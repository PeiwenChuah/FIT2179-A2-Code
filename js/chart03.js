// Global variable to store the raw CSV data to avoid re-fetching on every change
let cachedCSVRows = [];

async function initChart() {
    try {
        const response = await fetch('data/hospital_beds_treemap.csv');
        if (!response.ok) throw new Error('CSV not found');
        const csvText = await response.text();

        // Cache the rows (skipping header)
        cachedCSVRows = csvText.split(/\r?\n/)
            .filter(row => row.trim().length > 0)
            .slice(1);

        // Initial render with default year
        renderChart03("2022");

        // Add Event Listener to Dropdown
        document.getElementById('yearSelect').addEventListener('change', function(e) {
            renderChart03(e.target.value);
        });

    } catch (e) {
        console.error("Initialization failed:", e);
    }
}

function renderChart03(selectedYear) {
    // Dashboard colour palette — navy/teal/gold family, no red+green conflict
    const uniqueStateColors = [
        '#1a3a5c', '#1a6b9a', '#5b8fa8', '#c8972a', '#7a6db0',
        '#b05a2e', '#3d8c6f', '#2a6899', '#8c7a3d', '#4a5c8c',
        '#6e4a8c', '#3d6ea8', '#5a3d8c', '#8c5a3d', '#3d8c5a', '#8c3d5a'
    ];

    const filteredData = cachedCSVRows.map(row => {
        const cols = row.split(',');
        if (cols.length < 5) return null;
        return {
            date:     cols[0].trim(),
            state:    cols[1].trim(),
            district: cols[2].trim(),
            type:     cols[3].trim(),
            beds:     parseInt(cols[4])
        };
    }).filter(d =>
        d !== null &&
        d.date.startsWith(selectedYear) &&
        d.state !== "Malaysia" &&
        d.district !== "All Districts" &&
        d.type !== "all" &&
        !isNaN(d.beds) &&
        d.beds > 0
    );

    let states = [...new Set(filteredData.map(d => d.state))];
    const districtTotals = {};
    filteredData.forEach(d => {
        const key = `${d.state}|${d.district}`;
        districtTotals[key] = (districtTotals[key] || 0) + d.beds;
    });

    let chartData = [];
    states.forEach(state => {
        chartData.push({ id: state, name: state, color: 'transparent' });
    });

    Object.entries(districtTotals).forEach(([key, totalBeds]) => {
        const [state, district] = key.split('|');
        chartData.push({
            id:     key,
            name:   district,
            parent: state,
            value:  totalBeds,
            color:  uniqueStateColors[states.indexOf(state) % uniqueStateColors.length]
        });
    });

    Highcharts.chart('chart03', {
        chart: {
            height: 820,
            backgroundColor: 'transparent',
            style: { fontFamily: "'Source Sans 3', sans-serif" }
        },
        title: {
            text: `Malaysia Hospital Bed Distribution by State (${selectedYear})`,
            style: {
                color: '#1a1f2e',
                fontWeight: '700',
                fontSize: '15px',
                fontFamily: "'Source Sans 3', sans-serif"
            }
        },
        tooltip: {
            enabled: true,
            useHTML: true,
            backgroundColor: '#FFFFFF',
            shadow: true,
            borderWidth: 1,
            borderColor: '#e2e6ea',
            style: { zIndex: 9999, fontSize: '12px', color: '#1a1f2e', fontFamily: "'Source Sans 3', sans-serif" },
            pointFormat: '<b>{point.name}</b>: {point.value} beds'
        },
        plotOptions: {
            treemap: {
                layoutAlgorithm: 'squarified',
                levels: [
                    {
                        level: 1,
                        borderWidth: 3,
                        borderColor: '#ffffff',
                        dataLabels: {
                            enabled: true,
                            useHTML: true,
                            align: 'left',
                            verticalAlign: 'top',
                            style: { zIndex: 1 },
                            backgroundColor: 'rgba(26,31,46,0.85)',
                            padding: 4,
                            formatter: function() {
                                const singleDistrictStates = ["W.P. Labuan", "W.P. Putrajaya", "W.P. Kuala Lumpur"];
                                if (singleDistrictStates.includes(this.point.name)) return null;
                                return `<span style="color:#fff; font-size:10px; font-weight:700; font-family:'Source Sans 3',sans-serif;">${this.point.name.toUpperCase()} ›</span>`;
                            }
                        }
                    },
                    {
                        level: 2,
                        borderWidth: 1,
                        borderColor: 'rgba(255,255,255,0.4)',
                        dataLabels: {
                            enabled: true,
                            useHTML: true,
                            allowOverlap: true,
                            crop: false,
                            overflow: 'allow',
                            padding: 0,
                            style: {
                                color: '#ffffff',
                                fontWeight: '700',
                                textOutline: '1.5px rgba(0,0,0,0.6)',
                                textAlign: 'center',
                                zIndex: 2,
                                fontFamily: "'Source Sans 3', sans-serif"
                            },
                            formatter: function() {
                                const w = this.point.shapeArgs.width;
                                const h = this.point.shapeArgs.height;
                                let fontSize = Math.max(w * 0.12, 6.5);
                                if (fontSize > 13) fontSize = 13;

                                const valueText = (h > 40 && w > 40)
                                    ? `<div style="font-size:9px; color:rgba(255,255,255,0.85); font-weight:400; margin-top:1px;">${this.point.value} beds</div>`
                                    : '';

                                return `
                                <div style="width:${w}px; height:${h}px; display:flex; flex-direction:column; align-items:center; justify-content:center; overflow:hidden;">
                                    <div style="font-size:${fontSize}px; line-height:1; width:92%; word-wrap:break-word;">${this.point.name}</div>
                                    ${valueText}
                                </div>`;
                            }
                        }
                    }
                ]
            }
        },
        series: [{
            type: 'treemap',
            allowDrillToNode: true,
            interactByLeaf: false,
            data: chartData
        }],
        credits: { enabled: false }
    });
}

// Start the process
initChart();