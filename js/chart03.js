let cachedCSVRows  = [];
let currentYear    = "2022";
let currentZoom    = null;   // null = overview, string = zoomed state name

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
   COLOUR MAP  (unchanged from original)
══════════════════════════════════════════════════════════ */
const STATE_COLORS = {
    "Johor":           "#60760590",
    "Kedah":           "#2e8b8b",
    "Kelantan":        "#5b3fa0",
    "Melaka":          "#5a9e3e",
    "Negeri Sembilan": "#10bcbf",
    "Pahang":          "#4a6fa5",
    "Perak":           "#c97b2a",
    "Perlis":          "#1d7a6e",
    "Pulau Pinang":    "#8b6bb1",
    "Sabah":           "#3a7d54",
    "Sarawak":         "#2a6699",
    "Selangor":        "#1a3a5c",
    "Terengganu":      "#634908",
    "Kuala Lumpur":    "#c8972a",
    "Putrajaya":       "#7a4a78",
    "WP Labuan":       "#0d5073"
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

    // district totals  →  key = "state||district"
    const districtMap = {};
    rows.forEach(d => {
        const k = d.state + '||' + d.district;
        districtMap[k] = (districtMap[k] || 0) + d.beds;
    });

    // state totals
    const stateMap = {};
    Object.entries(districtMap).forEach(([k, v]) => {
        const state = k.split('||')[0];
        stateMap[state] = (stateMap[state] || 0) + v;
    });

    return { districtMap, stateMap };
}

/* ══════════════════════════════════════════════════════════
   BUILD HIGHCHARTS DATA
   MODE A (zoom=null)  → parent/child hierarchy
   MODE B (zoom=state) → flat districts, no parent
══════════════════════════════════════════════════════════ */
function buildData(districtMap, stateMap, zoom) {
    const data = [];

    if (!zoom) {
        /* ── MODE A ─────────────────────────────────── */
        Object.keys(stateMap).forEach(state => {
            data.push({
                id:    state,
                name:  state,
                value: stateMap[state],
                color: STATE_COLORS[state] || '#6b7a90'
            });
        });
        Object.entries(districtMap).forEach(([k, beds]) => {
            const [state, district] = k.split('||');
            data.push({
                id:     k,
                name:   district,
                parent: state,
                value:  beds,
                color:  STATE_COLORS[state] || '#6b7a90'
            });
        });
    } else {
        /* ── MODE B ─────────────────────────────────── */
        const col = STATE_COLORS[zoom] || '#6b7a90';
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
   DISTRICT LABEL FORMATTER  (shared between both modes)
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
                  word-wrap:break-word;font-weight:700;">
        ${this.point.name}
      </div>
      ${showBeds
        ? `<div style="font-size:8px;color:rgba(255,255,255,0.82);
                       font-weight:500;margin-top:2px;">
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

    /* destroy previous chart cleanly */
    const prev = Highcharts.charts.find(
        c => c && c.renderTo && c.renderTo.id === 'chart03'
    );
    if (prev) prev.destroy();

    /* ── levels config ─────────────────────────────────── */
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
                backgroundColor: 'rgba(0,0,0,0.22)',
                style: { zIndex: 3, pointerEvents: 'none' },
                formatter: function () {
                    return `<span style="color:#fff;font-size:10px;font-weight:800;
                        letter-spacing:.5px;text-shadow:1px 1px 3px rgba(0,0,0,.5);">
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
                    color: '#fff', fontWeight: '700',
                    textOutline: '1px rgba(0,0,0,.4)',
                    zIndex: 2, pointerEvents: 'none'
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
                    color: '#fff', fontWeight: '700',
                    textOutline: '1px rgba(0,0,0,.4)',
                    zIndex: 2, pointerEvents: 'none'
                },
                formatter: districtLabel
            }
        }
    ];

    /* ── render ────────────────────────────────────────── */
    const chart = Highcharts.chart('chart03', {
        chart: {
            height: 700,
            backgroundColor: 'transparent',
            style: { fontFamily: "'Source Sans 3', sans-serif" },
            animation: { duration: 350 },
            margin: [65, 10, 10, 10]
        },

        title: {
            text: isZoom
                ? `${zoom} — District Bed Capacity (${currentYear})`
                : `Hospital Beds Capacity by State & District — ${currentYear}`,
            align: 'left',
            style: { color: '#1a1f2e', fontWeight: '800', fontSize: '18px', letterSpacing: '-0.3px' }
        },

        subtitle: {
            text: isZoom
                ? `Showing all districts in <b>${zoom}</b> · Click "← All States" to go back`
                : 'Click any <b>district tile</b> to zoom into that state · Click any <b>state label</b> to zoom into that state',
            useHTML: true,
            align: 'left',
            style: {
                color: isZoom ? '#c8972a' : '#6b7a90',
                fontSize: '12px',
                fontWeight: isZoom ? '600' : '400'
            }
        },

        tooltip: {
            enabled: true,
            useHTML: true,
            outside: true,
            backgroundColor: '#ffffff',
            borderRadius: 8,
            shadow: { offsetX: 0, offsetY: 2, opacity: 0.08, width: 12 },
            borderWidth: 0,
            style: { fontSize: '13px', color: '#1a1f2e', padding: '0' },
            formatter: function () {
                const stateName = isZoom ? zoom : (this.point.parent || this.point.name);
                const isStateTile = !this.point.parent && !isZoom;
                return `
                <div style="padding:10px 14px;min-width:160px;">
                  <div style="font-size:13px;font-weight:700;color:#1a1f2e;margin-bottom:4px;">
                    ${this.point.name}
                  </div>
                  ${!isStateTile
                    ? `<div style="font-size:11px;color:#6b7a90;margin-bottom:6px;">${stateName}</div>`
                    : ''}
                  <div style="display:flex;align-items:baseline;gap:4px;">
                    <span style="font-size:18px;font-weight:800;color:#1a3a5c;">
                      ${Highcharts.numberFormat(this.point.value, 0)}
                    </span>
                    <span style="font-size:11px;color:#6b7a90;">beds</span>
                  </div>
                </div>`;
            }
        },

        plotOptions: {
            treemap: {
                layoutAlgorithm: 'squarified',
                allowDrillToNode: false,
                /*
                 * KEY: interactByLeaf: true
                 *   → only leaf nodes (districts in overview, all tiles in zoom) receive
                 *     pointer events and fire click.
                 *   → This means in MODE A, clicking a district tile fires click with
                 *     this.parent = state name  →  we zoom in.
                 *   → State header labels have pointer-events:none so clicks pass through
                 *     to the district tile underneath.
                 *
                 * We also wire a separate click on state-level (parent) nodes via
                 * the series point events with a check on !this.node (leaf detection).
                 */
                interactByLeaf: true,
                animationLimit: 1000,
                crisp: false,
                states: {
                    hover: {
                        brightness: 0.1,
                        borderColor: '#ffffff',
                        borderWidth: 2
                    }
                },
                levels: isZoom ? levelsZoomed : levelsOverview,
                point: {
                    events: {
                        click: function () {
                            if (isZoom) return; // already zoomed, district clicks are informational only

                            // this.parent is the state ID when a district (leaf) is clicked
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

    /* ── "← All States" back button, visible only in zoom mode ── */
    if (isZoom) {
        const btnW = 130;
        chart.renderer
            .button(
                '← All States',
                chart.chartWidth - btnW - 10,
                10,
                function () {
                    currentZoom = null;
                    buildChart();
                },
                {
                    fill: '#1a3a5c', stroke: 'none', r: 6,
                    style: {
                        color: '#ffffff', fontSize: '11px', fontWeight: '700',
                        fontFamily: "'Source Sans 3', sans-serif", cursor: 'pointer'
                    },
                    padding: 9
                },
                { fill: '#c8972a', style: { color: '#ffffff' } },
                { fill: '#b07820', style: { color: '#ffffff' } }
            )
            .attr({ zIndex: 20 })
            .add();
    }
}

initChart();