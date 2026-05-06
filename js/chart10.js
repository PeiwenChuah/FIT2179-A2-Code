// chart10.js — Flow of Health Funds (D3 Sankey)
// 6-column structure:
//  Col 0  Individual sources
//  Col 1  PUBLIC / PRIVATE buckets
//  Col 2  SOURCE hub  (RM89,827M)
//  Col 3  Provider-group nodes
//  Col 4  PROVIDERS hub  (RM89,827M)
//  Col 5  Function nodes

(function () {
  'use strict';

  function loadScript(src, cb) {
    var s = document.createElement('script');
    s.src  = src;
    s.onload = cb;
    document.head.appendChild(s);
  }

  loadScript('https://cdn.jsdelivr.net/npm/d3@7/dist/d3.min.js', function () {
    loadScript('https://cdn.jsdelivr.net/npm/d3-sankey@0.12.3/dist/d3-sankey.min.js', init);
  });

  // ── Colour tokens ────────────────────────────────────────────
  var COL = {
    pubSrc  : '#7ab4dc',
    public  : '#4a88c0',
    privSrc : '#e8a070',
    private : '#c85a28',
    source  : '#7a8898',
    provider: '#6aaa6a',
    func    : '#9464b4',
  };

  // ── Data ─────────────────────────────────────────────────────
  var NODES = [
    // col 0 – public individual sources (id 0–3)
    { id:  0, label: 'MOH',                    value: 39148, sub: 'RM39,148M', col: 0, color: COL.pubSrc  },
    { id:  1, label: 'Other federal agencies', value:  2066, sub: 'RM2,066M',  col: 0, color: COL.pubSrc  },
    { id:  2, label: 'MOE',                    value:  1975, sub: 'RM1,975M',  col: 0, color: COL.pubSrc  },
    { id:  3, label: 'Other public sources',   value:  2391, sub: 'RM2,391M',  col: 0, color: COL.pubSrc  },
    // col 0 – private individual sources (id 4–7)
    { id:  4, label: 'Out-of-pocket',          value: 34843, sub: 'RM44,843M', col: 0, color: COL.privSrc },
    { id:  5, label: 'Private insurance',      value:  7112, sub: 'RM7,112M',  col: 0, color: COL.privSrc },
    { id:  6, label: 'All corporations',       value:  1461, sub: 'RM1,461M',  col: 0, color: COL.privSrc },
    { id:  7, label: 'Other private sources',  value:   831, sub: 'RM831M',    col: 0, color: COL.privSrc },

    // col 1 – aggregate buckets (id 8–9)
    { id:  8, label: 'PUBLIC',                 value: 45580, sub: 'RM45,580M', col: 1, color: COL.public  },
    { id:  9, label: 'PRIVATE',                value: 44247, sub: 'RM44,247M', col: 1, color: COL.private },

    // col 2 – SOURCE hub (id 10)
    { id: 10, label: 'SOURCE',                 value: 89827, sub: 'RM89,827M', col: 2, color: COL.source  },

    // col 3 – provider groups (id 11–15, order matches original diagram top→bottom)
    { id: 11, label: ['All hospitals'],                                          value: 48721, sub: 'RM48,721M', col: 3, color: COL.provider },
    { id: 12, label: ['Providers of ambulatory health care'],                    value: 18881, sub: 'RM18,881M', col: 3, color: COL.provider },
    { id: 13, label: ['All other providers'],                                    value:  5049, sub: 'RM5,049M',  col: 3, color: COL.provider },
    { id: 14, label: ['Retail sale and other providers of medical goods'],       value:  7636, sub: 'RM7,636M',  col: 3, color: COL.provider },
    { id: 15, label: ['Providers of health care system administration and financing'], value: 8640, sub: 'RM8,640M', col: 3, color: COL.provider },

    // col 4 – PROVIDERS hub (id 16)
    { id: 16, label: 'PROVIDERS',              value: 89827, sub: 'RM89,827M', col: 4, color: COL.provider },

    // col 5 – functions (id 17–22, order matches original diagram top→bottom)
    { id: 17, label: ['Services of curative care'],   value: 56554, sub: 'RM56,554M', col: 5, color: COL.func },
    { id: 18, label: ['Medical goods'],               value:  8560, sub: 'RM8,560M',  col: 5, color: COL.func },
    { id: 19, label: ['Gross capital formation'],     value:  8475, sub: 'RM8,475M',  col: 5, color: COL.func },
    { id: 20, label: ['Governance and health system'],value:  7211, sub: 'RM7,211M',  col: 5, color: COL.func },
    { id: 21, label: ['Preventive care'],             value:  5415, sub: 'RM5,415M',  col: 5, color: COL.func },
    { id: 22, label: ['All other functions'],         value:  3612, sub: 'RM3,612M',  col: 5, color: COL.func },
  ];

  var LINKS = [
    // Col 0 → Col 1
    { source:  0, target:  8, value: 39148 },
    { source:  1, target:  8, value:  2066 },
    { source:  2, target:  8, value:  1975 },
    { source:  3, target:  8, value:  2391 },
    { source:  4, target:  9, value: 34843 },
    { source:  5, target:  9, value:  7112 },
    { source:  6, target:  9, value:  1461 },
    { source:  7, target:  9, value:   831 },

    // Col 1 → Col 2 (SOURCE)
    { source:  8, target: 10, value: 45580 },
    { source:  9, target: 10, value: 44247 },

    // Col 2 → Col 3 (provider groups)
    { source: 10, target: 11, value: 48721 },
    { source: 10, target: 12, value: 18881 },
    { source: 10, target: 13, value:  5049 },
    { source: 10, target: 14, value:  7636 },
    { source: 10, target: 15, value:  8640 },

    // Col 3 → Col 4 (PROVIDERS)
    { source: 11, target: 16, value: 48721 },
    { source: 12, target: 16, value: 18881 },
    { source: 13, target: 16, value:  5049 },
    { source: 14, target: 16, value:  7636 },
    { source: 15, target: 16, value:  8640 },

    // Col 4 → Col 5 (functions)
    { source: 16, target: 17, value: 56554 },
    { source: 16, target: 18, value:  8560 },
    { source: 16, target: 19, value:  8475 },
    { source: 16, target: 20, value:  7211 },
    { source: 16, target: 21, value:  5415 },
    { source: 16, target: 22, value:  3612 },
  ];

  // ── Chart build ───────────────────────────────────────────────
  function init() {
    var el = document.getElementById('chart10');
    if (!el) return;
    drawChart(el);
    var timer;
    window.addEventListener('resize', function () {
      clearTimeout(timer);
      timer = setTimeout(function () { drawChart(el); }, 200);
    });
  }

  function drawChart(el) {
    // Clear previous
    d3.select(el).selectAll('*').remove();

    var W  = Math.max(el.offsetWidth || 860, 700);
    var H  = 580;
    var mt = 12, mb = 12;
    // Horizontal margins for labels
    var ml = 148;   // left labels (cols 0–2)
    var mr = 190;   // right labels (cols 3–5)

    var innerW = W  - ml - mr;
    var innerH = H  - mt - mb;

    // Fixed x fractions for 6 columns across innerW
    // We want roughly equal spacing
    var colFrac = [0, 0.18, 0.36, 0.55, 0.73, 1.0];
    var nodeW   = 12;  // thin node bars

    // ── Sankey layout ──────────────────────────────────────────
    var sankey = d3.sankey()
      .nodeId(function (d) { return d.id; })
      .nodeWidth(nodeW)
      .nodePadding(8)
      .extent([[0, 0], [innerW, innerH]])
      .nodeSort(function (a, b) { return a.id - b.id; });

    var graph = sankey({
      nodes: NODES.map(function (d) { return Object.assign({}, d, { label: Array.isArray(d.label) ? d.label[0] : d.label }); }),
      links: LINKS.map(function (d) { return Object.assign({}, d); }),
    });

    // Override x positions to enforce column layout
    graph.nodes.forEach(function (n) {
      n.x0 = colFrac[n.col] * innerW;
      n.x1 = n.x0 + nodeW;
    });
    sankey.update(graph);

    // ── SVG root ───────────────────────────────────────────────
    var svg = d3.select(el).append('svg')
      .attr('width', '100%')
      .attr('height', H)
      .attr('viewBox', '0 0 ' + W + ' ' + H)
      .style('overflow', 'visible');

    var root = svg.append('g')
      .attr('transform', 'translate(' + ml + ',' + mt + ')');

    // ── Draw links ─────────────────────────────────────────────
    var linkPath = d3.sankeyLinkHorizontal();

    root.append('g')
      .selectAll('path')
      .data(graph.links)
      .join('path')
        .attr('d', linkPath)
        .attr('fill', 'none')
        .attr('stroke', function (d) { return d.source.color; })
        .attr('stroke-width', function (d) { return Math.max(0.8, d.width); })
        .attr('stroke-opacity', 0.30)
      .append('title')
        .text(function (d) {
          return d.source.label + ' → ' + d.target.label +
                 '  RM' + d3.format(',')(d.value) + 'M';
        });

    // ── Draw node rectangles ───────────────────────────────────
    root.append('g')
      .selectAll('rect')
      .data(graph.nodes)
      .join('rect')
        .attr('x',      function (d) { return d.x0; })
        .attr('y',      function (d) { return d.y0; })
        .attr('width',  function (d) { return d.x1 - d.x0; })
        .attr('height', function (d) { return Math.max(1, d.y1 - d.y0); })
        .attr('fill',   function (d) { return d.color; })
        .attr('rx', 2)
      .append('title')
        .text(function (d) { return d.label + '  ' + d.sub; });

    // ── Labels ─────────────────────────────────────────────────
    var FONT  = "'Times New Roman', Times, serif";
    var LH    = 11;   // line-height px

    graph.nodes.forEach(function (n) {
      var midY  = (n.y0 + n.y1) / 2;
      var nodeH = n.y1 - n.y0;

      // Wrap label into lines ≤ 28 chars
      var words  = n.label.split(' ');
      var lines  = [];
      var cur    = '';
      words.forEach(function (w) {
        var test = cur ? cur + ' ' + w : w;
        if (test.length > 28 && cur) { lines.push(cur); cur = w; }
        else { cur = test; }
      });
      if (cur) lines.push(cur);

      var allLines = lines.concat([n.sub]);      // label lines + value line
      var totalH   = allLines.length * LH;
      var startY   = midY - totalH / 2 + LH / 2;

      // Cols 0, 1, 2 → label on the LEFT of the node bar
      // Cols 3, 4, 5 → label on the RIGHT
      var onLeft  = n.col <= 2;
      var tx      = onLeft ? (n.x0 - 6) : (n.x1 + 6);
      var anchor  = onLeft ? 'end' : 'start';
      var isBold  = (n.col === 2 || n.col === 4);  // SOURCE / PROVIDERS hubs

      allLines.forEach(function (line, i) {
        var isValueLine = (i === allLines.length - 1);
        root.append('text')
          .attr('x', tx)
          .attr('y', startY + i * LH)
          .attr('dy', '0.32em')
          .attr('text-anchor', anchor)
          .style('font-family', FONT)
          .style('font-size',   isValueLine ? '8.5px' : (nodeH < 18 ? '8px' : '9.5px'))
          .style('font-weight', isBold && !isValueLine ? '700' : '400')
          .style('fill',        isValueLine ? '#666' : '#1a1a2e')
          .text(line);
      });
    });
  }

})();