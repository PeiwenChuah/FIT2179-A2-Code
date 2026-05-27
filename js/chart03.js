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
   STATE COLOUR MAP (Untouched Pastels)
══════════════════════════════════════════════════════════ */
const STATE_COLORS = {
    'Johor': '#ADD8E6',          
    'Kedah': '#FFE4E1',          
    'Kelantan': '#c5c5fb',       
    'Melaka': '#FFFACD',         
    'Negeri Sembilan': '#D3D3D3',
    'Pahang': '#AFEEEE',         
    'Perak': '#F5DEB3',          
    'Perlis': '#E0FFFF',         
    'Pulau Pinang': '#FFB6C1',   
    'Sabah': '#F0FFF0',          
    'Sarawak': '#c2a2d7',        
    'Selangor': '#FFDAB9',       
    'Terengganu': '#e5edab',     
    'W.P. Kuala Lumpur': '#F5F5DC',   
    'W.P. Putrajaya': '#f5d1dd',      
    'WP Labuan': '#C0C0C0'       
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

    // Detect if we are currently zoomed into a state
    const isZoom = currentZoom !== null;

    // District text: smaller in overview, larger when zoomed
    let fs = isZoom ? '16px' : '11.5px'; 
    if (w < 80) fs = isZoom ? '14px' : '10px';
    if (w < 50) fs = isZoom ? '12px' : '9px';
    if (w < 35) fs = isZoom ? '10px' : '8px';

    const showBeds = h > 44 && w > 58;
    
    // Beds text: size is ok (10px) in overview, larger (13px) when zoomed
    const bedsFs = isZoom ? '13px' : '10px'; 

    return `<div style="
        width:${w}px;height:${h}px;
        display:flex;flex-direction:column;
        align-items:center;justify-content:center;
        padding:3px;box-sizing:border-box;text-align:center;">

      <div style="font-size:${fs};line-height:1.2;width:98%;
                  word-wrap:break-word;font-weight:700;color:#3d4a5c;">
        ${this.point.name}
      </div>

      ${showBeds
        ? `<div style="font-size:${bedsFs};color:#526075;
                       font-weight:600;margin-top:2px;">
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
            borderColor: '#888888',
            dataLabels: {
                enabled: true,
                useHTML: true,
                align: 'left',
                verticalAlign: 'top',
                padding: 2,   
                borderRadius: 3,
                backgroundColor: 'rgba(255,255,255,0.40)', /* ⬅ Swapped to a light frosted background */
                style: { zIndex: 3, pointerEvents: 'none' },
                formatter: function () {
                    return `<span style="
                        display:inline-block;
                        line-height:1;   
                        color:#413f3f; /* ⬅ Changed to solid black */
                        font-size:12px;
                        font-weight:800;
                        letter-spacing:.5px;
                        text-shadow:none; /* ⬅ Removed shadow for crisp black text */
                        ">
                        ${this.key.toUpperCase()} ›</span>`;
                }
            }
        },
        {
            level: 2,
            borderWidth: 0.5,
            borderColor: '#888888', 
            dataLabels: {
                enabled: true,
                useHTML: true,
                allowOverlap: true,
                crop: false,
                overflow: 'allow',
                style: {
                    color: '#3d4a5c',      
                    fontWeight: '700',
                    fontSize: '12px',
                    textOutline: 'none',   
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
            borderColor: '#888888', 
            dataLabels: {
                enabled: true,
                useHTML: true,
                allowOverlap: true,
                crop: false,
                overflow: 'allow',
                style: {
                    color: '#3d4a5c',      
                    fontWeight: '700',
                    fontSize: '12px',
                    textOutline: 'none',   
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
            style: { fontFamily: "sans-serif" },
            animation: { duration: 320 },
            margin: [37, 0, 10, 0]
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
            style: { fontSize: '12px', color: '#1a1f2e' },
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
                        borderColor: '#cccccc',
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
        chart.renderer
            .button(
                '← BACK TO ALL STATES',
                0,
                0,
                function () {
                    currentZoom = null;
                    buildChart();
                },
                {
                    fill: '#1a3a5c',
                    stroke: 'none',
                    r: 6,
                    style: {
                        color: '#ffffff',
                        fontSize: '10px',
                        fontWeight: '800',
                        cursor: 'pointer'
                    },
                    padding: 10
                },
                { fill: '#c8972a', style: { color: '#ffffff' } },
                { fill: '#a07010', style: { color: '#ffffff' } }
            )
            .attr({ zIndex: 20 })
            .add();
    }
}

initChart();