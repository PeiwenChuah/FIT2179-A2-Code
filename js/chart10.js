// chart10.js — Flow of Health Funds (D3 Sankey)
// Changes from previous version:
//  1. Title/subtitle moved to left-align (done in index.html)
//  2. Links scaled down — max stroke-width capped at 60px, mapped onto a thinner range
//  3. SVG canvas uses full container width up to 1100px (wider horizontal spread)
//  4. Label de-overlap: nudge labels vertically if they would collide

(function () {
  'use strict';

  function loadScript(src, cb) {
    var s = document.createElement('script');
    s.src = src;
    s.onload = cb;
    document.head.appendChild(s);
  }

  loadScript('https://cdn.jsdelivr.net/npm/d3@7/dist/d3.min.js', function () {
    loadScript('https://cdn.jsdelivr.net/npm/d3-sankey@0.12.3/dist/d3-sankey.min.js', init);
  });

  // ── Colours ───────────────────────────────────────────────────
  var COL = {
    pubSrc  : '#7ab4dc',
    public  : '#4a88c0',
    privSrc : '#e8a070',
    private : '#c85a28',
    source  : '#7a8898',
    provider: '#6aaa6a',
    func    : '#9464b4',
  };

  // ── Nodes ─────────────────────────────────────────────────────
  var NODES = [
    { id:  0, label: 'MOH',                    value: 39148, sub: 'RM39,148M', col: 0, color: COL.pubSrc  },
    { id:  1, label: 'Other federal agencies', value:  2066, sub: 'RM2,066M',  col: 0, color: COL.pubSrc  },
    { id:  2, label: 'MOE',                    value:  1975, sub: 'RM1,975M',  col: 0, color: COL.pubSrc  },
    { id:  3, label: 'Other public sources',   value:  2391, sub: 'RM2,391M',  col: 0, color: COL.pubSrc  },
    { id:  4, label: 'Out-of-pocket',          value: 34843, sub: 'RM44,843M', col: 0, color: COL.privSrc },
    { id:  5, label: 'Private insurance',      value:  7112, sub: 'RM7,112M',  col: 0, color: COL.privSrc },
    { id:  6, label: 'All corporations',       value:  1461, sub: 'RM1,461M',  col: 0, color: COL.privSrc },
    { id:  7, label: 'Other private sources',  value:   831, sub: 'RM831M',    col: 0, color: COL.privSrc },
    { id:  8, label: 'PUBLIC',                 value: 45580, sub: 'RM45,580M', col: 1, color: COL.public  },
    { id:  9, label: 'PRIVATE',                value: 44247, sub: 'RM44,247M', col: 1, color: COL.private },
    { id: 10, label: 'SOURCE',                 value: 89827, sub: 'RM89,827M', col: 2, color: COL.source  },
    { id: 11, label: 'All hospitals',                                     value: 48721, sub: 'RM48,721M', col: 3, color: COL.provider },
    { id: 12, label: 'Providers of ambulatory health care',               value: 18881, sub: 'RM18,881M', col: 3, color: COL.provider },
    { id: 13, label: 'All other providers',                               value:  5049, sub: 'RM5,049M',  col: 3, color: COL.provider },
    { id: 14, label: 'Retail sale and other providers of medical goods',  value:  7636, sub: 'RM7,636M',  col: 3, color: COL.provider },
    { id: 15, label: 'Providers of health care system administration and financing', value: 8640, sub: 'RM8,640M', col: 3, color: COL.provider },
    { id: 16, label: 'PROVIDERS',             value: 89827, sub: 'RM89,827M', col: 4, color: COL.provider },
    { id: 17, label: 'Services of curative care',    value: 56554, sub: 'RM56,554M', col: 5, color: COL.func },
    { id: 18, label: 'Medical goods',               value:  8560, sub: 'RM8,560M',  col: 5, color: COL.func },
    { id: 19, label: 'Gross capital formation',      value:  8475, sub: 'RM8,475M',  col: 5, color: COL.func },
    { id: 20, label: 'Governance and health system', value:  7211, sub: 'RM7,211M',  col: 5, color: COL.func },
    { id: 21, label: 'Preventive care',              value:  5415, sub: 'RM5,415M',  col: 5, color: COL.func },
    { id: 22, label: 'All other functions',          value:  3612, sub: 'RM3,612M',  col: 5, color: COL.func },
  ];

  // ── Links ─────────────────────────────────────────────────────
  var LINKS = [
    { source:  0, target:  8, value: 39148 },
    { source:  1, target:  8, value:  2066 },
    { source:  2, target:  8, value:  1975 },
    { source:  3, target:  8, value:  2391 },
    { source:  4, target:  9, value: 34843 },
    { source:  5, target:  9, value:  7112 },
    { source:  6, target:  9, value:  1461 },
    { source:  7, target:  9, value:   831 },
    { source:  8, target: 10, value: 45580 },
    { source:  9, target: 10, value: 44247 },
    { source: 10, target: 11, value: 48721 },
    { source: 10, target: 12, value: 18881 },
    { source: 10, target: 13, value:  5049 },
    { source: 10, target: 14, value:  7636 },
    { source: 10, target: 15, value:  8640 },
    { source: 11, target: 16, value: 48721 },
    { source: 12, target: 16, value: 18881 },
    { source: 13, target: 16, value:  5049 },
    { source: 14, target: 16, value:  7636 },
    { source: 15, target: 16, value:  8640 },
    { source: 16, target: 17, value: 56554 },
    { source: 16, target: 18, value:  8560 },
    { source: 16, target: 19, value:  8475 },
    { source: 16, target: 20, value:  7211 },
    { source: 16, target: 21, value:  5415 },
    { source: 16, target: 22, value:  3612 },
  ];

  // ── Init ──────────────────────────────────────────────────────
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

  // ── Draw ──────────────────────────────────────────────────────
  function drawChart(el) {
    d3.select(el).selectAll('*').remove();

    // CHANGE 3: use full container width, capped at 1100px for wider horizontal spread
    var W      = Math.min(Math.max(el.offsetWidth || 900, 700), 1100);
    var H      = 640;
    var mt     = 10, mb = 10;
    var ml     = 152;   // space for left-side labels
    var mr     = 200;   // space for right-side labels
    var innerW = W - ml - mr;
    var innerH = H - mt - mb;

    // Column x-fractions — spread evenly across innerW
    var colFrac = [0, 0.17, 0.34, 0.53, 0.72, 1.0];
    var nodeW   = 11;

    // CHANGE 2: scale link widths to a thinner range
    // d3-sankey computes widths proportional to the node height.
    // We'll remap after layout: scale all link widths by a factor < 1
    var LINK_SCALE = 0.45;  // reduces link thickness to ~45% of default

    // ── Sankey layout ────────────────────────────────────────────
    var sankey = d3.sankey()
      .nodeId(function (d) { return d.id; })
      .nodeWidth(nodeW)
      .nodePadding(10)
      .extent([[0, 0], [innerW, innerH]])
      .nodeSort(function (a, b) { return a.id - b.id; });

    var graph = sankey({
      nodes: NODES.map(function (d) { return Object.assign({}, d); }),
      links: LINKS.map(function (d) { return Object.assign({}, d); }),
    });

    // Fix x positions to our column fractions
    graph.nodes.forEach(function (n) {
      n.x0 = colFrac[n.col] * innerW;
      n.x1 = n.x0 + nodeW;
    });
    sankey.update(graph);

    // Apply link scale to widths
    graph.links.forEach(function (lk) {
      lk.width = lk.width * LINK_SCALE;
    });

    // ── SVG ───────────────────────────────────────────────────────
    var svg = d3.select(el).append('svg')
      .attr('width', '100%')
      .attr('height', H)
      .attr('viewBox', '0 0 ' + W + ' ' + H)
      .style('overflow', 'visible');

    var root = svg.append('g')
      .attr('transform', 'translate(' + ml + ',' + mt + ')');

    // ── Links ─────────────────────────────────────────────────────
    var linkPath = d3.sankeyLinkHorizontal();

    root.append('g')
      .selectAll('path')
      .data(graph.links)
      .join('path')
        .attr('d', linkPath)
        .attr('fill', 'none')
        .attr('stroke', function (d) { return d.source.color; })
        .attr('stroke-width', function (d) { return Math.max(0.6, d.width); })
        .attr('stroke-opacity', 0.32)
      .append('title')
        .text(function (d) {
          return d.source.label + ' → ' + d.target.label +
                 '  RM' + d3.format(',')(d.value) + 'M';
        });

    // ── Node bars ─────────────────────────────────────────────────
    root.append('g')
      .selectAll('rect')
      .data(graph.nodes)
      .join('rect')
        .attr('x',      function (d) { return d.x0; })
        .attr('y',      function (d) { return d.y0; })
        .attr('width',  nodeW)
        .attr('height', function (d) { return Math.max(1, d.y1 - d.y0); })
        .attr('fill',   function (d) { return d.color; })
        .attr('rx', 2)
      .append('title')
        .text(function (d) { return d.label + '  ' + d.sub; });

    // ── Labels ────────────────────────────────────────────────────
    var FONT = "'Times New Roman', Times, serif";
    var LH   = 11;      // line-height px
    var FS   = 9.5;     // base font size
    var FS_S = 8.5;     // sub (value) font size
    var WRAP = 26;      // max chars per line before wrapping

    // CHANGE 4: de-overlap labels within the same side of the same column
    // Collect label blocks and nudge them apart if they overlap
    var labelBlocks = [];   // { col, side, midY, top, bot, dy }

    function wrapText(label) {
      var words = label.split(' ');
      var lines = [], cur = '';
      words.forEach(function (w) {
        var test = cur ? cur + ' ' + w : w;
        if (test.length > WRAP && cur) { lines.push(cur); cur = w; }
        else { cur = test; }
      });
      if (cur) lines.push(cur);
      return lines;
    }

    // First pass: compute natural positions
    graph.nodes.forEach(function (n) {
      var midY   = (n.y0 + n.y1) / 2;
      var lines  = wrapText(n.label);
      var nLines = lines.length + 1;           // +1 for value sub
      var blockH = nLines * LH;
      var onLeft = n.col <= 2;
      labelBlocks.push({
        n: n,
        lines: lines,
        nLines: nLines,
        blockH: blockH,
        onLeft: onLeft,
        naturalMid: midY,
        nudgedMid: midY,
      });
    });

    // CHANGE 4: sort each (col, side) group and push overlapping blocks apart
    var groups = {};
    labelBlocks.forEach(function (b) {
      var key = b.n.col + '_' + (b.onLeft ? 'L' : 'R');
      if (!groups[key]) groups[key] = [];
      groups[key].push(b);
    });

    Object.keys(groups).forEach(function (key) {
      var grp = groups[key].sort(function (a, b) { return a.naturalMid - b.naturalMid; });
      // Iteratively push down overlapping blocks (2 passes for stability)
      for (var pass = 0; pass < 3; pass++) {
        for (var i = 1; i < grp.length; i++) {
          var prev = grp[i - 1];
          var curr = grp[i];
          var prevBot = prev.nudgedMid + prev.blockH / 2 + 2;  // 2px gap
          var currTop = curr.nudgedMid - curr.blockH / 2;
          if (currTop < prevBot) {
            curr.nudgedMid = prevBot + curr.blockH / 2;
          }
        }
      }
    });

    // Second pass: draw labels at nudged positions
    labelBlocks.forEach(function (b) {
      var n      = b.n;
      var midY   = b.nudgedMid;
      var nodeH  = n.y1 - n.y0;
      var onLeft = b.onLeft;
      var tx     = onLeft ? (n.x0 - 6) : (n.x1 + 6);
      var anchor = onLeft ? 'end' : 'start';
      var isBold = (n.col === 2 || n.col === 4);

      var allLines = b.lines.concat([n.sub]);
      var startY   = midY - (allLines.length * LH) / 2 + LH / 2;

      allLines.forEach(function (line, i) {
        var isVal = (i === allLines.length - 1);
        root.append('text')
          .attr('x', tx)
          .attr('y', startY + i * LH)
          .attr('dy', '0.32em')
          .attr('text-anchor', anchor)
          .style('font-family', FONT)
          .style('font-size', isVal ? FS_S + 'px' : (nodeH < 14 ? '8px' : FS + 'px'))
          .style('font-weight', isBold && !isVal ? '700' : '400')
          .style('fill', isVal ? '#777' : '#1a1a2e')
          .text(line);
      });
    });
  }

})();