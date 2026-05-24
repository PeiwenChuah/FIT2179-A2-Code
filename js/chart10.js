(function () {
    'use strict';

    /*
      Sankey node colours — unique to finance flow section only.
      No colour here is reused in workforce or disease charts.
        Source layer   → teal-navy  #1a5c7a
        Aggregator     → slate      #5a6878
        Centre node    → dark navy  #1a3050
        Provider layer → forest teal#3a8a70
        Agg2 layer     → amber      #b06020
        Function layer → indigo     #6850a8
    */
    const COL = {
        source: '#1f4e79',
        agg: '#4f5d75',
        center: '#243b53',
        provider: '#0f766e',
        agg2: '#c57b1c',
        function: '#6b5ca5'
    };

    function init() {
        const el = document.getElementById('chart10');
        if (!el) return;

        const fmt = (v) => 'RM ' + v.toLocaleString() + 'M';

        const rawData = [
            { n: 'MOH',               v: 39148 }, { n: 'Other Fed',       v: 2066  },
            { n: 'MOE',               v: 1975  }, { n: 'Other Public',    v: 2391  },
            { n: 'Out-of-pocket',     v: 34843 }, { n: 'Insurance',       v: 7112  },
            { n: 'Corporate',         v: 1461  }, { n: 'Other Private',   v: 831   },
            { n: 'PUBLIC',            v: 45580 }, { n: 'PRIVATE',         v: 44247 },
            { n: 'SOURCE',            v: 89827 },
            { n: 'Hospitals',         v: 48721 }, { n: 'Ambulatory',      v: 18881 },
            { n: 'Other Providers',   v: 5049  }, { n: 'Retail Goods',    v: 7636  },
            { n: 'Admin/Financing',   v: 8640  },
            { n: 'PROVIDERS',         v: 89827 },
            { n: 'Curative Care',     v: 56554 }, { n: 'Medical Goods',   v: 8560  },
            { n: 'Capital Formation', v: 8475  }, { n: 'Governance',      v: 7211  },
            { n: 'Preventive Care',   v: 5415  }, { n: 'Other Functions', v: 3612  }
        ];

        const displayLabels = rawData.map(d => `${d.n}<br>${fmt(d.v)}`);
        const tooltipLabels = rawData.map(d => `${d.n} (${fmt(d.v)})`);

        const data = {
            type: 'sankey',
            orientation: 'h',
            arrangement: 'fixed',
            node: {
                hoverinfo: 'none',
                pad: 50,
                thickness: 14,
                line: { color: 'white', width: 1 },
                label: displayLabels,
                customdata: tooltipLabels,
                x: [0.05,0.05,0.05,0.05, 0.05,0.05,0.05,0.05, 0.25,0.25, 0.38, 0.58,0.58,0.58,0.58,0.58, 0.72, 0.95,0.95,0.95,0.95,0.95,0.95],
                y: [0.05,0.18,0.26,0.34, 0.60,0.78,0.88,0.96, 0.18,0.80, 0.50, 0.08,0.28,0.45,0.68,0.92, 0.50, 0.02,0.22,0.40,0.60,0.80,0.98],
                color: [
                    ...Array(8).fill(COL.source),
                    ...Array(2).fill(COL.agg),
                    COL.center,
                    ...Array(5).fill(COL.provider),
                    COL.agg2,
                    ...Array(6).fill(COL.function)
                ]
            },
            link: {
                hovertemplate: '%{source.customdata} → %{target.customdata}<extra></extra>',
                source: [0,1,2,3, 4,5,6,7, 8,9, 10,10,10,10,10, 11,12,13,14,15, 16,16,16,16,16,16],
                target: [8,8,8,8, 9,9,9,9, 10,10, 11,12,13,14,15, 16,16,16,16,16, 17,18,19,20,21,22],
                value: [
                    39148,2066,1975,2391, 34843,7112,1461,831,
                    45580,44247,
                    48721,18881,5049,7636,8640,
                    48721,18881,5049,7636,8640,
                    56554,8560,8475,7211,5415,3612
                ],
                color: [
                    ...Array(8).fill('rgba(26,92,122,0.16)'),
                    ...Array(2).fill('rgba(90,104,120,0.16)'),
                    ...Array(5).fill('rgba(58,138,112,0.16)'),
                    ...Array(5).fill('rgba(176,96,32,0.16)'),
                    ...Array(6).fill('rgba(104,80,168,0.16)')
                ]
            }
        };

        const layout = {
            font: {
                family: 'Source Sans 3, sans-serif',
                size: 12,
                color: '#1a1f2e'
            },
            margin: { l: 0, r: 0, b: 0, t: 20 },
            height: 500,
            autosize: true,
            paper_bgcolor: 'transparent',
            plot_bgcolor: 'transparent'
        };

        Plotly.newPlot('chart10', [data], layout, {
            responsive: true,
            displayModeBar: false
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();