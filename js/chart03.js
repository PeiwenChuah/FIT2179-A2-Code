let cachedCSVRows = [];
let currentYear   = '2022';
let currentZoom   = null;

/* ══════════════════════════════════════════════════════════
   INIT — fetch CSV once, wire up year selector
══════════════════════════════════════════════════════════ */
async function initChart() {
    try {
        const response = await fetch('data/hospital_beds_treemap.csv');
        if (!response.ok) throw new Error('CSV not found');
        const csvText = await response.text();

        cachedCSVRows = csvText
            .split(/\r?\n/)
            .filter(r => r.trim().length > 0)
            .slice(1);

        buildChart();

        document.getElementById('yearSelect').addEventListener('change', function (e) {
            currentYear = e.target.value;
            currentZoom = null;
            buildChart();
        });

    } catch (e) {
        console.error('initChart failed:', e);
    }
}

/* ══════════════════════════════════════════════════════════
   STATE COLOUR MAP
══════════════════════════════════════════════════════════ */
const STATE_COLORS = {
    'Johor': '#1f4e79',
    'Kedah': '#c57b1c',
    'Kelantan': '#6b5ca5',
    'Melaka': '#0f766e',
    'Negeri Sembilan': '#8a5a2b',
    'Pahang': '#355070',
    'Perak': '#7c6a0a',
    'Perlis': '#7a5195',
    'Pulau Pinang': '#20639b',
    'Sabah': '#8c564b',
    'Sarawak': '#3b5b92',
    'Selangor': '#264653',
    'Terengganu': '#a16f00',
    'Kuala Lumpur': '#bc6c25',
    'Putrajaya': '#5e548e',
    'WP Labuan': '#2a6f97'
};

/* ══════════════════════════════════════════════════════════
   PARSE + AGGREGATE
══════════════════════════════════════════════════════════ */
function getAggregates(year) {
    const rows = cachedCSVRows.map(row => {
        const c = row.split(',');
        if (c.length < 5) return null;
        return {
            date:     c[0].trim(),
            state:    c[1].trim(),
            district: c[2].trim(),
            type:     c[3].trim(),
            beds:     parseInt(c[4])
        };
    }).filter(d =>
        d &&
        d.date.startsWith(year) &&
        d.state    !== 'Malaysia' &&
        d.district !== 'All Districts' &&
        d.type     !== 'all' &&
        !isNaN(d.beds) &&
        d.beds > 0
    );

    const districtMap = {};
    rows.forEach(d => {
        const k = d.state + '||' + d.district;
        districtMap[k] = (districtMap[k] || 0) + d.beds;
    });

    const stateMap = {};
    Object.entries(districtMap).forEach(([k, v]) => {
        const state = k.split('||')[0];
        stateMap[state] = (stateMap[state] || 0) + v;
    });

    return { districtMap, stateMap };
}

/* ══════════════════════════════════════════════════════════
   BUILD HIGHCHARTS DATA
══════════════════════════════════════════════════════════ */
function buildData(districtMap, stateMap, zoom) {
    const data = [];

    if (!zoom) {
        Object.keys(stateMap).forEach(state => {
            data.push({
                id:    state,
                name:  state,
                value: stateMap[state],
                color: STATE_COLORS[state] || '#4a5a6a'
            });
        });
        Object.entries(districtMap).forEach(([k, beds]) => {
            const [state, district] = k.split('||');
            data.push({
                id:     k,
                name:   district,
                parent: state,
                value:  beds,
                color:  STATE_COLORS[state] || '#4a5a6a'
            });
        });
    } else {
        const col = STATE_COLORS[zoom] || '#4a5a6a';
        Object.entries(districtMap)
            .filter(([k]) => k.startsWith(zoom + '||'))
            .forEach(([k, beds]) => {
                const district = k.split('||')[1];
                data.push({ id: k, name: district, value: beds, color: col });
            });
    }

    return data;
}

/* ══════════════════════════════════════════════════════════
   DISTRICT LABEL FORMATTER
══════════════════════════════════════════════════════════ */
function districtLabel() {
    const w = (this.point.shapeArgs && this.point.shapeArgs.width)  || 0;
    const h = (this.point.shapeArgs && this.point.shapeArgs.height) || 0;
    if (w < 22 || h < 16) return null;

    let fs = '11px';
    if (w < 80) fs = '9.5px';
    if (w < 50) fs = '8px';
    if (w < 35) fs = '7px';

    const showBeds = h > 44 && w > 58;

    return `<div style="
        width:${w}px;height:${h}px;
        display:flex;flex-direction:column;
        align-items:center;justify-content:center;
        padding:3px;box-sizing:border-box;text-align:center;">
      <div style="font-size:${fs};line-height:1.2;width:98%;
                  word-wrap:break-word;font-weight:700;font-family:'Source Sans 3',sans-serif;">
        ${this.point.name}
      </div>
      ${showBeds
        ? `<div style="font-size:8px;color:rgba(255,255,255,0.82);
                       font-weight:500;margin-top:2px;font-family:'Source Sans 3',sans-serif;">
             ${Highcharts.numberFormat(this.point.value, 0)} beds
           </div>`
        : ''}
    </div>`;
}

/* ══════════════════════════════════════════════════════════
   MAIN RENDER
══════════════════════════════════════════════════════════ */
function buildChart() {
    const { districtMap, stateMap } = getAggregates(currentYear);
    const zoom   = currentZoom;
    const isZoom = zoom !== null;
    const data   = buildData(districtMap, stateMap, zoom);

    const prev = Highcharts.charts.find(
        c => c && c.renderTo && c.renderTo.id === 'chart03'
    );
    if (prev) prev.destroy();

    const levelsOverview = [
        {
            level: 1,
            borderWidth: 2,
            borderColor: '#ffffff',
            dataLabels: {
                enabled: true,
                useHTML: true,
                align: 'left',
                verticalAlign: 'top',
                padding: 5,
                borderRadius: 3,
                backgroundColor: 'rgba(0,0,0,0.20)',
                style: { zIndex: 3, pointerEvents: 'none' },
                formatter: function () {
                    return `<span style="color:#fff;font-size:10px;font-weight:800;
                        letter-spacing:.5px;text-shadow:1px 1px 3px rgba(0,0,0,.45);
                        font-family:'Source Sans 3',sans-serif;">
                        ${this.key.toUpperCase()} ›</span>`;
                }
            }
        },
        {
            level: 2,
            borderWidth: 0.5,
            borderColor: 'rgba(255,255,255,0.3)',
            dataLabels: {
                enabled: true,
                useHTML: true,
                allowOverlap: true,
                crop: false,
                overflow: 'allow',
                style: {
                    color: '#fff',
                    fontWeight: '700',
                    textOutline: '1px rgba(0,0,0,.35)',
                    zIndex: 2,
                    pointerEvents: 'none'
                },
                formatter: districtLabel
            }
        }
    ];

    const levelsZoomed = [
        {
            level: 1,
            borderWidth: 1.5,
            borderColor: '#ffffff',
            dataLabels: {
                enabled: true,
                useHTML: true,
                allowOverlap: true,
                crop: false,
                overflow: 'allow',
                style: {
                    color: '#fff',
                    fontWeight: '700',
                    textOutline: '1px rgba(0,0,0,.35)',
                    zIndex: 2,
                    pointerEvents: 'none'
                },
                formatter: districtLabel
            }
        }
    ];

    const chart = Highcharts.chart('chart03', {
        chart: {
            height: 680,
            backgroundColor: 'transparent',
            style: { fontFamily: "'Source Sans 3', sans-serif" },
            animation: { duration: 320 },
            // INCREASED TOP MARGIN TO 45px TO CREATE SPACE FOR THE BUTTON
            margin: [35, 10, 10, 10]
        },

        title: null,

        tooltip: {
            enabled: true,
            useHTML: true,
            outside: true,
            backgroundColor: '#ffffff',
            borderRadius: 6,
            shadow: false,
            borderWidth: 1,
            borderColor: '#e2e6ea',
            style: { fontSize: '12px', color: '#1a1f2e', padding: '0' },
            formatter: function () {
                const stateName = isZoom ? zoom : (this.point.parent || this.point.name);
                const isStateTile = !this.point.parent && !isZoom;
                return `
                <div style="padding:9px 13px;min-width:150px;">
                  <div style="font-size:12px;font-weight:700;color:#1a1f2e;margin-bottom:3px;">
                    ${this.point.name}
                  </div>
                  ${!isStateTile
                    ? `<div style="font-size:10px;color:#6b7a90;margin-bottom:5px;">${stateName}</div>`
                    : ''}
                  <div style="display:flex;align-items:baseline;gap:4px;">
                    <span style="font-size:16px;font-weight:800;color:#1a3a5c;">
                      ${Highcharts.numberFormat(this.point.value, 0)}
                    </span>
                    <span style="font-size:10px;color:#6b7a90;">beds</span>
                  </div>
                </div>`;
            }
        },

        plotOptions: {
            treemap: {
                layoutAlgorithm: 'squarified',
                allowDrillToNode: false,
                interactByLeaf: true,
                animationLimit: 1000,
                crisp: false,
                states: {
                    hover: {
                        brightness: 0.08,
                        borderColor: '#ffffff',
                        borderWidth: 2
                    }
                },
                levels: isZoom ? levelsZoomed : levelsOverview,
                point: {
                    events: {
                        click: function () {
                            if (isZoom) return;
                            if (this.parent) {
                                currentZoom = this.parent;
                                buildChart();
                            }
                        }
                    }
                }
            }
        },

        series: [{
            type: 'treemap',
            data: data,
            name: isZoom ? zoom : 'Malaysia'
        }],

        credits: { enabled: false }
    });

    if (isZoom) {
        const btnW = 120;
        chart.renderer
            .button(
                '← All States',
                chart.chartWidth - btnW - 10,
                0, // PLACED SAFELY AT Y=5 WITHIN THE 45px MARGIN
                function () {
                    currentZoom = null;
                    buildChart();
                },
                {
                    fill: '#1a3a5c',
                    stroke: 'none',
                    r: 5,
                    style: {
                        color: '#ffffff',
                        fontSize: '11px',
                        fontWeight: '700',
                        fontFamily: "'Source Sans 3', sans-serif",
                        cursor: 'pointer'
                    },
                    padding: 8
                },
                { fill: '#c8972a', style: { color: '#ffffff' } },
                { fill: '#a07010', style: { color: '#ffffff' } }
            )
            .attr({ zIndex: 20 })
            .add();
    }
}

initChart();