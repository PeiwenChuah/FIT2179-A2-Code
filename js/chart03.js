// Global variable to store the raw CSV data to avoid re-fetching on every change
let cachedCSVRows = [];

async function initChart() {
    try {
        const response = await fetch('data/hospital_beds_treemap.csv');
        if (!response.ok) throw new Error('CSV not found');
        const csvText = await response.text();

        cachedCSVRows = csvText.split(/\r?\n/)
            .filter(row => row.trim().length > 0)
            .slice(1);

        renderChart03("2022");

        document.getElementById('yearSelect').addEventListener('change', function(e) {
            renderChart03(e.target.value);
        });

    } catch (e) {
        console.error("Initialization failed:", e);
    }
}

function renderChart03(selectedYear) {
    /*
      State colours — carefully chosen so every adjacent pair
      is visually distinct (hue + lightness differences ≥ 30°):
        Johor         coral-red   #d9534f
        Kedah         teal        #2e8b8b
        Kelantan      deep violet #5b3fa0
        Melaka        lime-green  #5a9e3e
        N. Sembilan   dusty rose  #c46a8a
        Pahang        slate-blue  #4a6fa5
        Perak         burnt amber #c97b2a
        Perlis        dark cyan   #1d7a6e   (distinct from Kedah teal)
        P. Pinang     muted mauve #8b6bb1
        Sabah         forest grn  #3a7d54
        Sarawak       steel blue  #2a6699
        Selangor      dark navy   #1a3a5c
        Terengganu    hot brick   #b84a2e
        W.P. K.L.     gold        #c8972a
        W.P. Putrajaya warm plum  #7a4a78
        W.P. Labuan   deep ocean  #0d5073
    */
    const stateColorMap = {
        "Johor":            "#60760590",
        "Kedah":            "#2e8b8b",
        "Kelantan":         "#5b3fa0",
        "Melaka":           "#5a9e3e",
        "Negeri Sembilan":  "#10bcbf",
        "Pahang":           "#4a6fa5",
        "Perak":            "#c97b2a",
        "Perlis":           "#1d7a6e",
        "Pulau Pinang":     "#8b6bb1",
        "Sabah":            "#3a7d54",
        "Sarawak":          "#2a6699",
        "Selangor":         "#1a3a5c",
        "Terengganu":       "#634908",
        "W.P. Kuala Lumpur":"#c8972a",
        "W.P. Putrajaya":   "#7a4a78",
        "W.P. Labuan":      "#0d5073"
    };

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
        const stateColor = stateColorMap[state] || '#6b7a90';
        chartData.push({
            id:     key,
            name:   district,
            parent: state,
            value:  totalBeds,
            color:  stateColor
        });
    });

    Highcharts.chart('chart03', {
        chart: {
            height: 820,
            backgroundColor: 'transparent',
            style: { fontFamily: "'Source Sans 3', sans-serif" },
            animation: { duration: 300 }
        },
        title: {
            text: `Hospital Beds by State & District — ${selectedYear}`,
            style: {
                color: '#1a1f2e',
                fontWeight: '700',
                fontSize: '15px',
                fontFamily: "'Source Sans 3', sans-serif"
            }
        },
        subtitle: {
            text: 'Click a state to drill down · Click the title to zoom back out',
            style: {
                color: '#6b7a90',
                fontSize: '11px',
                fontFamily: "'Source Sans 3', sans-serif"
            }
        },
        tooltip: {
            enabled: true,
            useHTML: true,
            backgroundColor: '#FFFFFF',
            shadow: false,
            borderWidth: 1,
            borderColor: '#e2e6ea',
            style: { fontSize: '12px', color: '#1a1f2e', fontFamily: "'Source Sans 3', sans-serif" },
            pointFormat: '<b>{point.name}</b><br>{point.value} beds'
        },
        plotOptions: {
            treemap: {
                layoutAlgorithm: 'squarified',
                allowDrillToNode: true,
                interactByLeaf: false,
                animationLimit: 1000,
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
                            backgroundColor: 'rgba(26,31,46,0.82)',
                            padding: 4,
                            formatter: function() {
                                const wp = ["W.P. Labuan", "W.P. Putrajaya", "W.P. Kuala Lumpur"];
                                if (wp.includes(this.point.name)) return null;
                                return `<span style="color:#fff;font-size:10px;font-weight:700;font-family:'Source Sans 3',sans-serif;">${this.point.name.toUpperCase()} ›</span>`;
                            }
                        }
                    },
                    {
                        level: 2,
                        borderWidth: 1,
                        borderColor: 'rgba(255,255,255,0.35)',
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
                                textOutline: '1.5px rgba(0,0,0,0.55)',
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
                                    ? `<div style="font-size:9px;color:rgba(255,255,255,0.85);font-weight:400;margin-top:1px;">${this.point.value} beds</div>`
                                    : '';
                                return `
                                <div style="width:${w}px;height:${h}px;display:flex;flex-direction:column;align-items:center;justify-content:center;overflow:hidden;">
                                    <div style="font-size:${fontSize}px;line-height:1;width:92%;word-wrap:break-word;">${this.point.name}</div>
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

initChart();