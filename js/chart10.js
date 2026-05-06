// chart10.js — Flow of Health Funds (D3 Sankey)
// Exact 4-column structure matching original diagram:
// Col 0: Individual sources
// Col 1: PUBLIC / PRIVATE aggregate
// Col 2: Provider groups
// Col 3: Functions

(function () {
  // ── Load D3 and d3-sankey dynamically ──────────────────────────
  function loadScript(src, cb) {
    var s = document.createElement('script');
    s.src = src;
    s.onload = cb;
    document.head.appendChild(s);
  }

  loadScript('https://cdn.jsdelivr.net/npm/d3@7/dist/d3.min.js', function () {
    loadScript('https://cdn.jsdelivr.net/npm/d3-sankey@0.12.3/dist/d3-sankey.min.js', buildChart);
  });

  function buildChart() {
    // ── Nodes (fixed columns) ──────────────────────────────────
    // col 0: sources, col 1: PUBLIC/PRIVATE, col 2: providers, col 3: functions
    var nodes = [
      // col 0 – public sources
      { id: 0,  label: 'MOH',                          value: 39148, col: 0, group: 'pub-src' },
      { id: 1,  label: 'Other federal agencies',       value:  2066, col: 0, group: 'pub-src' },
      { id: 2,  label: 'MOE',                          value:  1975, col: 0, group: 'pub-src' },
      { id: 3,  label: 'Other public sources',         value:  2391, col: 0, group: 'pub-src' },
      // col 0 – private sources
      { id: 4,  label: 'Out-of-pocket',                value: 34843, col: 0, group: 'prv-src' },
      { id: 5,  label: 'Private insurance',            value:  7112, col: 0, group: 'prv-src' },
      { id: 6,  label: 'All corporations',             value:  1461, col: 0, group: 'prv-src' },
      { id: 7,  label: 'Other private sources',        value:   831, col: 0, group: 'prv-src' },

      // col 1 – aggregate buckets
      { id: 8,  label: 'PUBLIC\nRM45,580M',            value: 45580, col: 1, group: 'public'  },
      { id: 9,  label: 'PRIVATE\nRM44,247M',           value: 44247, col: 1, group: 'private' },

      // col 2 – providers
      { id: 10, label: 'All hospitals',                value: 48721, col: 2, group: 'provider' },
      { id: 11, label: 'Providers of ambulatory\nhealth care', value: 18881, col: 2, group: 'provider' },
      { id: 12, label: 'Providers of health care\nsystem administration\n& financing', value: 8640, col: 2, group: 'provider' },
      { id: 13, label: 'Retail sale & other\nproviders of medical goods', value: 7636, col: 2, group: 'provider' },
      { id: 14, label: 'All other providers',          value:  5049, col: 2, group: 'provider' },

      // col 3 – functions
      { id: 15, label: 'Services of curative care',   value: 56554, col: 3, group: 'function' },
      { id: 16, label: 'Medical goods',               value:  8560, col: 3, group: 'function' },
      { id: 17, label: 'Gross capital formation',     value:  8475, col: 3, group: 'function' },
      { id: 18, label: 'Governance & health system',  value:  7211, col: 3, group: 'function' },
      { id: 19, label: 'Preventive care',             value:  5415, col: 3, group: 'function' },
      { id: 20, label: 'All other functions',         value:  3612, col: 3, group: 'function' },
    ];

    // ── Links ─────────────────────────────────────────────────
    // Col 0 → Col 1
    var links = [
      { source: 0, target: 8,  value: 39148 },
      { source: 1, target: 8,  value:  2066 },
      { source: 2, target: 8,  value:  1975 },
      { source: 3, target: 8,  value:  2391 },

      { source: 4, target: 9,  value: 34843 },
      { source: 5, target: 9,  value:  7112 },
      { source: 6, target: 9,  value:  1461 },
      { source: 7, target: 9,  value:   831 },

      // Col 1 → Col 2  (distribute PUBLIC and PRIVATE proportionally to each provider)
      // Proportions based on each provider's share of total 89,827
      // All hospitals 48721 → pub share = 48721*(45580/89827)=24726, prv=23995
      { source: 8,  target: 10, value: 24726 },
      { source: 9,  target: 10, value: 23995 },
      // Ambulatory 18881 → pub 9584, prv 9297
      { source: 8,  target: 11, value:  9584 },
      { source: 9,  target: 11, value:  9297 },
      // Admin/finance 8640 → pub 4383, prv 4257
      { source: 8,  target: 12, value:  4383 },
      { source: 9,  target: 12, value:  4257 },
      // Retail 7636 → pub 3875, prv 3761
      { source: 8,  target: 13, value:  3875 },
      { source: 9,  target: 13, value:  3761 },
      // Other providers 5049 → pub 2562, prv 2487 (trim to match totals)
      { source: 8,  target: 14, value:  2562 },
      { source: 9,  target: 14, value:  2487 },

      // Col 2 → Col 3
      // All hospitals → mainly curative + capital + governance + preventive
      { source: 10, target: 15, value: 33200 },
      { source: 10, target: 17, value:  8475 },
      { source: 10, target: 18, value:  4000 },
      { source: 10, target: 19, value:  3046 },

      // Ambulatory → curative + preventive + other
      { source: 11, target: 15, value: 15000 },
      { source: 11, target: 19, value:  2369 },
      { source: 11, target: 20, value:  1512 },

      // Admin/finance → governance + curative + other
      { source: 12, target: 18, value:  3211 },
      { source: 12, target: 15, value:  3529 },
      { source: 12, target: 20, value:  1900 },

      // Retail → medical goods exclusively
      { source: 13, target: 16, value:  7636 },

      // Other providers → curative + medical goods + other
      { source: 14, target: 15, value:  4825 },
      { source: 14, target: 16, value:   924 },
      { source: 14, target: 20, value:   200 },
    ];

    // ── Colour palette ─────────────────────────────────────────
    var palette = {
      'pub-src':  '#6aaee0',
      'public':   '#3a78b5',
      'prv-src':  '#e09070',
      'private':  '#c05c30',
      'provider': '#74b374',
      'function': '#9b72b0',
    };

    // ── Dimensions ────────────────────────────────────────────
    var container = document.getElementById('chart10');
    var W = container.offsetWidth || 860;
    var H = 620;
    var margin = { top: 8, right: 180, bottom: 8, left: 170 };

    var svg = d3.select('#chart10')
      .append('svg')
      .attr('width', '100%')
      .attr('height', H)
      .attr('viewBox', '0 0 ' + W + ' ' + H);

    var innerW = W - margin.left - margin.right;
    var innerH = H - margin.top - margin.bottom;

    // ── Build Sankey ──────────────────────────────────────────
    var sankey = d3.sankey()
      .nodeId(function (d) { return d.id; })
      .nodeWidth(18)
      .nodePadding(12)
      .extent([[margin.left, margin.top], [W - margin.right, H - margin.bottom]])
      .nodeSort(function (a, b) { return a.id - b.id; }); // preserve insertion order

    // d3-sankey mutates the arrays, so clone
    var graph = sankey({
      nodes: nodes.map(function (d) { return Object.assign({}, d); }),
      links: links.map(function (d) { return Object.assign({}, d); }),
    });

    // ── Links ──────────────────────────────────────────────────
    var linkPath = d3.sankeyLinkHorizontal();

    svg.append('g').attr('class', 'links')
      .selectAll('path')
      .data(graph.links)
      .join('path')
        .attr('d', linkPath)
        .attr('stroke-width', function (d) { return Math.max(1, d.width); })
        .attr('stroke', function (d) {
          return palette[d.source.group] || '#aaa';
        })
        .attr('stroke-opacity', 0.38)
        .attr('fill', 'none')
      .append('title')
        .text(function (d) {
          return d.source.label.replace(/\n/g,' ') +
                 ' → ' +
                 d.target.label.replace(/\n/g,' ') +
                 '\nRM' + d3.format(',')(d.value) + 'M';
        });

    // ── Nodes ──────────────────────────────────────────────────
    var nodeG = svg.append('g').attr('class', 'nodes')
      .selectAll('g')
      .data(graph.nodes)
      .join('g');

    nodeG.append('rect')
      .attr('x', function (d) { return d.x0; })
      .attr('y', function (d) { return d.y0; })
      .attr('width', function (d) { return d.x1 - d.x0; })
      .attr('height', function (d) { return Math.max(1, d.y1 - d.y0); })
      .attr('fill', function (d) { return palette[d.group] || '#888'; })
      .attr('rx', 2)
      .append('title')
        .text(function (d) {
          return d.label.replace(/\n/g,' ') + '\nRM' + d3.format(',')(d.value) + 'M';
        });

    // ── Labels ────────────────────────────────────────────────
    nodeG.each(function (d) {
      var g = d3.select(this);
      var isLeft  = d.col <= 1;
      var isRight = d.col >= 2;
      var lines   = d.label.split('\n');
      var midY    = (d.y0 + d.y1) / 2;
      var nodeH   = d.y1 - d.y0;
      var lineH   = 12;

      // Value string
      var valStr = 'RM' + d3.format(',')(d.value) + 'M';

      // For col 0 and col 1, label left; for col 2 and col 3, label right
      var textX, anchor;
      if (d.col === 0) { textX = d.x0 - 6;  anchor = 'end';   }
      if (d.col === 1) { textX = d.x0 - 6;  anchor = 'end';   }
      if (d.col === 2) { textX = d.x1 + 6;  anchor = 'start'; }
      if (d.col === 3) { textX = d.x1 + 6;  anchor = 'start'; }

      var totalLines = lines.length + 1; // +1 for value
      var startY = midY - ((totalLines - 1) * lineH) / 2;

      lines.forEach(function (line, i) {
        g.append('text')
          .attr('x', textX)
          .attr('y', startY + i * lineH)
          .attr('dy', '0.32em')
          .attr('text-anchor', anchor)
          .style('font-family', 'Georgia, serif')
          .style('font-size', nodeH < 14 ? '8px' : '10px')
          .style('fill', '#1a1a2e')
          .text(line);
      });

      // Value line
      g.append('text')
        .attr('x', textX)
        .attr('y', startY + lines.length * lineH)
        .attr('dy', '0.32em')
        .attr('text-anchor', anchor)
        .style('font-family', 'Georgia, serif')
        .style('font-size', nodeH < 14 ? '7.5px' : '9.5px')
        .style('fill', '#555')
        .text(valStr);
    });

    // ── Responsive redraw ──────────────────────────────────────
    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        d3.select('#chart10 svg').remove();
        buildChart();
      }, 200);
    });
  }
})();