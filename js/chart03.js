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
    const stateColorMap = {
        "Johor":             "#60760590",
        "Kedah":             "#2e8b8b",
        "Kelantan":          "#5b3fa0",
        "Melaka":            "#5a9e3e",
        "Negeri Sembilan":   "#10bcbf",
        "Pahang":            "#4a6fa5",
        "Perak":             "#c97b2a",
        "Perlis":            "#1d7a6e",
        "Pulau Pinang":      "#8b6bb1",
        "Sabah":             "#3a7d54",
        "Sarawak":           "#2a6699",
        "Selangor":          "#1a3a5c",
        "Terengganu":        "#634908",
        "Kuala Lumpur":      "#c8972a",
        "Putrajaya":         "#7a4a78",
        "WP Labuan":         "#0d5073"
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

    const states = [...new Set(filteredData.map(d => d.state))];

    const districtTotals = {};
    filteredData.forEach(d => {
        const key = `${d.state}|${d.district}`;
        districtTotals[key] = (districtTotals[key] || 0) + d.beds;
    });

    let chartData = [];
    states.forEach(state => {
        const stateBeds = Object.entries(districtTotals)
            .filter(([k]) => k.startsWith(state + '|'))
            .reduce((sum, [, v]) => sum + v, 0);
        chartData.push({
            id:    state,
            name:  state,
            value: stateBeds,
            color: 'transparent'
        });
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
            height: 700,
            backgroundColor: 'transparent',
            style: { fontFamily: "'Source Sans 3', sans-serif" },
            animation: { duration: 400 },
            events: {
                load: function() {
                    const style = document.createElement('style');
                    style.type = 'text/css';
                    style.innerHTML = `
                        /* Prevent internal collision sweeps from dropping or flickering text labels */
                        .highcharts-data-labels, 
                        .highcharts-data-labels text, 
                        .highcharts-data-label-level-1,
                        .highcharts-data-label-level-2 {
                            visibility: visible !important;
                            opacity: 1 !important;
                        }
                    `;
                    document.getElementsByTagName('head')[0].appendChild(style);
                },
                render: function() {
                    const chart = this;
                    if (chart.series && chart.series[0] && chart.series[0].rootNode && chart.series[0].rootNode !== '') {
                        chart.setTitle(null, {
                            text: '← Click the state title header bar to zoom back out',
                            style: { color: '#c8972a', fontSize: '12px', fontWeight: '600' }
                        }, false);
                    } else {
                        chart.setTitle(null, {
                            text: 'Click any state or individual district tile to drill down into detail',
                            style: { color: '#6b7a90', fontSize: '12px', fontWeight: '400' }
                        }, false);
                    }
                }
            }
        },
        title: {
            text: `Hospital Beds Capacity by State & District — ${selectedYear}`,
            align: 'left',
            style: {
                color: '#1a1f2e',
                fontWeight: '800',
                fontSize: '18px',
                letterSpacing: '-0.3px'
            }
        },
        subtitle: {
            text: 'Click any state or individual district tile to drill down into detail',
            align: 'left',
            style: {
                color: '#6b7a90',
                fontSize: '12px'
            }
        },
        tooltip: {
            enabled: true,
            useHTML: true,
            backgroundColor: '#ffffff', // Change from rgba() to 100% solid white
            borderRadius: 6,
            shadow: true,
            borderWidth: 0,
            style: { 
                fontSize: '13px', 
                color: '#1a1f2e',
                zIndex: 9999 // Forces the HTML content layer onto the top layer
            },
            pointFormat: '<div style="padding: 4px 6px; background: #ffffff;"><b>{point.name}</b><br><span style="color:#6b7a90;">Capacity:</span> <b>{point.value}</b> total beds</div>'
        },
        plotOptions: {
            treemap: {
                layoutAlgorithm: 'squarified',
                interactByLeaf: true,
                allowDrillToNode: true,
                animationLimit: 1500,
                states: {
                    hover: {
                        /* Fix: Keep background colors consistent on hover to match HTML text,
                          and highlight the active tile with a crisp white border instead.
                        */
                        brightness: 0, 
                        borderColor: '#ffffff',
                        borderWidth: 3
                    }
                },
                levels: [
                    {
                        level: 1,
                        borderWidth: 2,
                        borderColor: '#ffffff',
                        dataLabels: {
                            enabled: true,
                            useHTML: true,
                            align: 'left',
                            verticalAlign: 'top',
                            className: 'highcharts-data-label-level-1',
                            style: { zIndex: 3, pointerEvents: 'none' },
                            backgroundColor: 'rgba(255, 255, 255, 0.15)',
                            padding: 5,
                            borderRadius: 4,
                            formatter: function() {
                                const w = this.point.shapeArgs ? this.point.shapeArgs.width : 100;
                                const h = this.point.shapeArgs ? this.point.shapeArgs.height : 100;

                                if (w < 110 || h < 90) {
                                    return null;
                                }
                                return `<span style="color:#ffffff; font-size:10px; font-weight:800; letter-spacing: 0.5px; text-shadow: 1px 1px 3px rgba(0,0,0,0.4);">${this.point.name.toUpperCase()}</span>`;
                            }
                        }
                    },
                    {
                        level: 2,
                        borderWidth: 0.5,
                        borderColor: 'rgba(255,255,255,0.25)',
                        dataLabels: {
                            enabled: true,
                            useHTML: true,
                            allowOverlap: true,
                            crop: false,
                            overflow: 'allow',
                            className: 'highcharts-data-label-level-2',
                            style: {
                                color: '#ffffff',
                                fontWeight: '700',
                                textOutline: '1px rgba(0,0,0,0.35)',
                                textAlign: 'center',
                                zIndex: 2,
                                pointerEvents: 'none'
                            },
                            formatter: function() {
                                const w = this.point.shapeArgs ? this.point.shapeArgs.width  : 60;
                                const h = this.point.shapeArgs ? this.point.shapeArgs.height : 40;
                                
                                if (w < 20 || h < 15) return null;

                                let labelFontSize = '11px';
                                if (w < 60) labelFontSize = '9px';
                                if (w < 40) labelFontSize = '7.5px';

                                const singleDistricts = ["Perlis", "Kuala Lumpur", "Putrajaya", "WP Labuan"];
                                const displayName = singleDistricts.includes(this.point.name)
                                    ? this.point.name.toUpperCase()
                                    : this.point.name;

                                const valueDisplay = (h > 40 && w > 55)
                                    ? `<div style="font-size: 8.5px; color: rgba(255,255,255,0.85); font-weight: 500; margin-top: 2px;">${this.point.value} beds</div>`
                                    : '';
                                    
                                return `
                                <div style="width:${w}px; height:${h}px; display:flex; flex-direction:column; align-items:center; justify-content:center; padding: 2px; box-sizing: border-box;">
                                    <div style="font-size:${labelFontSize}; line-height:1.1; width:98%; word-wrap:break-word; font-weight:700;">${displayName}</div>
                                    ${valueDisplay}
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
            interactByLeaf: true,
            data: chartData,
            point: {
                events: {
                    click: function() {
                        const series = this.series;
                        if (this.node && this.node.isRoot) {
                            series.drillToNode('');
                        }
                    }
                }
            }
        }],
        credits: { enabled: false }
    });
}

initChart();