// Global variable to store the raw CSV data to avoid re-fetching on every change
let cachedCSVRows = [];

async function initChart() {
    try {
        const response = await fetch('data/hospital_beds_treemap.csv');
        if (!response.ok) throw new Error('CSV not found');
        const csvText = await response.text();
        
        // Cache the rows (skipping header)
        cachedCSVRows = csvText.split(/\r?\n/).filter(row => row.trim().length > 0).slice(1);
        
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
    // 1. Filter data based on the selectedYear string
    const filteredData = cachedCSVRows.map(row => {
        const cols = row.split(',');
        if (cols.length < 5) return null;
        return {
            date: cols[0].trim(),
            state: cols[1].trim(),
            district: cols[2].trim(),
            type: cols[3].trim(),
            beds: parseInt(cols[4])
        };
    }).filter(d => 
        d !== null && 
        d.date.startsWith(selectedYear) && // Matches years like "2022-01-01"
        d.state !== "Malaysia" && 
        d.district !== "All Districts" && 
        d.type !== "all" && 
        !isNaN(d.beds) && 
        d.beds > 0
    );

    const uniqueStateColors = [
        '#2E5A88', '#A85A24', '#4D5A5A', '#1F7A6F', '#6C3483', 
        '#21618C', '#922B21', '#512E5F', '#0E6251', '#7E5109',
        '#283747', '#7D6608', '#1B4F72', '#4A235A', '#145A32', '#78281F'
    ];

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
            id: key,
            name: district,
            parent: state,
            value: totalBeds,
            color: uniqueStateColors[states.indexOf(state) % uniqueStateColors.length]
        });
    });

    Highcharts.chart('chart03', {
        chart: {
            height: 900,
            backgroundColor: 'transparent',
            style: { fontFamily: 'Arial, sans-serif' }
        },
        title: {
            // Dynamic Title based on selectedYear
            text: `MALAYSIA HOSPITAL BED DISTRIBUTION BY STATE (${selectedYear})`,
            style: { color: '#000', fontWeight: 'bold', fontSize: '20px' }
        },
        tooltip: {
            enabled: true,
            useHTML: true,
            backgroundColor: '#FFFFFF',
            opacity: 1,
            shadow: true,
            borderWidth: 1,
            borderColor: '#333',
            style: { zIndex: 9999, fontSize: '12px', color: '#000' },
            pointFormat: '<b>{point.name}</b>: {point.value} beds'
        },
        plotOptions: {
            treemap: {
                layoutAlgorithm: 'squarified',
                levels: [{
                    level: 1,
                    borderWidth: 4,
                    borderColor: '#000',
                    dataLabels: {
                        enabled: true,
                        useHTML: true,
                        align: 'left',
                        verticalAlign: 'top',
                        style: { zIndex: 1 },
                        backgroundColor: 'rgba(0,0,0,0.9)',
                        padding: 4,
                        formatter: function() {
                            const singleDistrictStates = ["W.P. Labuan", "W.P. Putrajaya", "W.P. Kuala Lumpur"];
                            if (singleDistrictStates.includes(this.point.name)) {
                                return null; 
                            }
                            return `<span style="color:#FFF; font-size:11px; font-weight:bold;">${this.point.name.toUpperCase()} ></span>`;
                        }
                    }
                }, {
                    level: 2,
                    borderWidth: 1.5,
                    borderColor: '#000',
                    dataLabels: {
                        enabled: true,
                        useHTML: true,
                        allowOverlap: true, 
                        crop: false, 
                        overflow: 'allow',
                        padding: 0,
                        style: {
                            color: '#FFD700',
                            fontWeight: '900',
                            textOutline: '2px solid #000',
                            textAlign: 'center',
                            zIndex: 2
                        },
                        formatter: function() {
                            const w = this.point.shapeArgs.width;
                            const h = this.point.shapeArgs.height;
                            let fontSize = Math.max(w * 0.12, 6.5);
                            if (fontSize > 14) fontSize = 14;

                            const valueText = (h > 40 && w > 40) 
                                ? `<div style="font-size: 10px; color: #fff; font-weight: 400; margin-top: 1px;">${this.point.value}</div>` 
                                : '';

                            return `
                            <div style="width: ${w}px; height: ${h}px; display: flex; flex-direction: column; align-items: center; justify-content: center; overflow: hidden;">
                                <div style="font-size: ${fontSize}px; line-height: 0.95; width: 95%; word-wrap: break-word;">
                                    ${this.point.name}
                                </div>
                                ${valueText}
                            </div>`;
                        }
                    }
                }]
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