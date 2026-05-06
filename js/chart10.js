// chart10.js — Flow of Health Funds
// Custom-drawn Sankey matching the reference diagram (Image 1)
// Layout: sources → PUBLIC/PRIVATE merge → SOURCE node → provider groups → PROVIDERS node → functions
// Nodes at merge points are compact (not full-height bars).
// All bands are proportional to RM values.

(function () {
  'use strict';

  function loadScript(src, cb) {
    var s = document.createElement('script');
    s.src = src; s.onload = cb;
    document.head.appendChild(s);
  }

  loadScript('https://cdn.jsdelivr.net/npm/d3@7/dist/d3.min.js', init);

  // ── Palette (matching Image 1) ─────────────────────────────────
  var C = {
    moh      : '#7bbfdd',   // light blue
    pubSrc   : '#9bcce8',   // lighter blue for smaller public sources
    outPocket: '#e8b090',   // salmon/peach for out-of-pocket
    privSrc  : '#f0c8a8',   // lighter peach for smaller private sources
    public   : '#5090c8',   // medium blue — PUBLIC node
    private  : '#c86030',   // burnt orange — PRIVATE node
    source   : '#888fa0',   // grey — SOURCE node
    provider : '#70b870',   // green — provider groups & PROVIDERS node
    func     : '#9060b8',   // purple — functions
    hosp     : '#70b870',
  };

  // ── Data ──────────────────────────────────────────────────────
  // All values in RM million
  var TOTAL = 89827;

  var publicSources = [
    { label: 'MOH',                    value: 39148, color: C.moh    },
    { label: 'Other federal agencies', value:  2066, color: C.pubSrc },
    { label: 'MOE',                    value:  1975, color: C.pubSrc },
    { label: 'Other public sources',   value:  2391, color: C.pubSrc },
  ];
  var privateSources = [
    { label: 'Out-of-pocket',         value: 34843, color: C.outPocket },
    { label: 'Private insurance',     value:  7112, color: C.privSrc   },
    { label: 'All corporations',      value:  1461, color: C.privSrc   },
    { label: 'Other private sources', value:   831, color: C.privSrc   },
  ];
  var publicTotal  = publicSources.reduce(function(s,d){ return s+d.value; }, 0);   // 45580
  var privateTotal = privateSources.reduce(function(s,d){ return s+d.value; }, 0);  // 44247

  var providers = [
    { label: 'All hospitals',                                              value: 48721, color: C.provider },
    { label: 'Providers of ambulatory health care',                        value: 18881, color: C.provider },
    { label: 'All other providers',                                        value:  5049, color: C.provider },
    { label: 'Retail sale and other providers of medical goods',           value:  7636, color: C.provider },
    { label: 'Providers of health care system administration and financing',value:  8640, color: C.provider },
  ];

  var functions_ = [
    { label: 'Services of curative care',    value: 56554, color: C.func },
    { label: 'Medical goods',               value:  8560, color: C.func },
    { label: 'Gross capital formation',     value:  8475, color: C.func },
    { label: 'Governance and health system',value:  7211, color: C.func },
    { label: 'Preventive care',             value:  5415, color: C.func },
    { label: 'All other functions',         value:  3612, color: C.func },
  ];

  // ── Init ──────────────────────────────────────────────────────
  function init() {
    var el = document.getElementById('chart10');
    if (!el) return;
    draw(el);
    var t;
    window.addEventListener('resize', function(){ clearTimeout(t); t = setTimeout(function(){ draw(el); }, 180); });
  }

  function draw(el) {
    d3.select(el).selectAll('*').remove();

    var W  = Math.min(Math.max(el.offsetWidth || 900, 700), 1100);
    var H  = 620;
    var FONT = "'Times New Roman', Times, serif";

    // ── Column x-centres (as fractions of W) ──────────────────
    // Col A: individual source bars       ~12%
    // Col B: PUBLIC / PRIVATE nodes       ~25%
    // Col C: SOURCE node                  ~40%
    // Col D: provider group bars          ~58%
    // Col E: PROVIDERS node               ~72%
    // Col F: function bars                ~88%
    var xA = 0.10 * W;
    var xB = 0.24 * W;
    var xC = 0.39 * W;
    var xD = 0.57 * W;
    var xE = 0.72 * W;
    var xF = 0.88 * W;

    var BAR_W  = 13;   // width of every node bar
    var GAP    = 6;    // gap between stacked bands within a column

    // ── Vertical scale: map total value to available height ────
    var vPad = 60;     // top/bottom padding
    var availH = H - 2 * vPad;
    // Scale: pixels per RM-million unit
    // We want the total height of all bands + gaps to fill availH
    // Total bands = TOTAL, total gaps per column varies — use a scale factor
    var scale = availH / (TOTAL * 1.18);   // 1.18 accounts for inter-band gaps

    function px(val) { return val * scale; }

    // ── Compute vertical positions for each column ─────────────
    // Each column is centred on H/2

    function layoutColumn(items, totalVal, centreY) {
      var totalPx = px(totalVal) + (items.length - 1) * GAP;
      var y0 = centreY - totalPx / 2;
      var out = [];
      var cursor = y0;
      items.forEach(function(d) {
        var h = px(d.value);
        out.push({ d: d, y: cursor, h: h });
        cursor += h + GAP;
      });
      return out;
    }

    var centreY = H / 2;

    // Col A – public sources (top half), private sources (bottom half)
    var pubH    = px(publicTotal);
    var privH   = px(privateTotal);
    var totalBandH = pubH + privH + GAP * 3;
    var colATop = centreY - totalBandH / 2;

    var colAPub  = layoutColumn(publicSources,  publicTotal,  colATop + pubH / 2);
    var colAPriv = layoutColumn(privateSources, privateTotal, colATop + pubH + GAP * 3 + privH / 2);

    // Col B – PUBLIC node, PRIVATE node (compact, centred on merged flow)
    var pubMidY  = colATop + pubH / 2;
    var privMidY = colATop + pubH + GAP * 3 + privH / 2;
    var colBPub  = { y: pubMidY  - pubH / 2,  h: pubH,  color: C.public  };
    var colBPriv = { y: privMidY - privH / 2, h: privH, color: C.private };

    // Col C – SOURCE node (full total height, centred)
    var sourceH   = px(TOTAL);
    var colCY     = centreY - sourceH / 2;

    // Col D – provider groups, centred
    var colD = layoutColumn(providers, TOTAL, centreY);

    // Col E – PROVIDERS node (full total, centred)
    var colEY = centreY - sourceH / 2;

    // Col F – functions, centred
    var colF = layoutColumn(functions_, TOTAL, centreY);

    // ── SVG ───────────────────────────────────────────────────
    var svg = d3.select(el).append('svg')
      .attr('width', '100%')
      .attr('height', H)
      .attr('viewBox', '0 0 ' + W + ' ' + H)
      .style('font-family', FONT);

    // ── Helper: draw a smooth horizontal band between two rects ──
    // (x1,y1,h1) left edge; (x2,y2,h2) right edge
    function band(x1, y1, h1, x2, y2, h2, color, opacity) {
      opacity = opacity || 0.28;
      var mx = (x1 + x2) / 2;
      var path = [
        'M', x1, y1,
        'C', mx, y1, mx, y2, x2, y2,
        'L', x2, y2 + h2,
        'C', mx, y2 + h2, mx, y1 + h1, x1, y1 + h1,
        'Z'
      ].join(' ');
      svg.append('path')
        .attr('d', path)
        .attr('fill', color)
        .attr('fill-opacity', opacity)
        .attr('stroke', 'none');
    }

    // ── Helper: draw a node bar ────────────────────────────────
    function nodeBar(x, y, h, color, rx) {
      svg.append('rect')
        .attr('x', x - BAR_W / 2)
        .attr('y', y)
        .attr('width', BAR_W)
        .attr('height', Math.max(2, h))
        .attr('fill', color)
        .attr('rx', rx === undefined ? 2 : rx);
    }

    // ── Helper: label ─────────────────────────────────────────
    function label(text, sub, x, midY, anchor, bold, smallFont) {
      var fs  = smallFont ? 8.5 : 9.5;
      var fsS = 8;
      var LH  = 11;
      // wrap text at 24 chars
      var words = text.split(' '), lines = [], cur = '';
      words.forEach(function(w){
        var t = cur ? cur+' '+w : w;
        if (t.length > 24 && cur){ lines.push(cur); cur = w; } else { cur = t; }
      });
      if (cur) lines.push(cur);
      var allLines = lines.concat([sub]);
      var totalH = allLines.length * LH;
      var startY = midY - totalH / 2 + LH / 2;
      allLines.forEach(function(line, i){
        var isVal = i === allLines.length - 1;
        svg.append('text')
          .attr('x', x)
          .attr('y', startY + i * LH)
          .attr('dy', '0.32em')
          .attr('text-anchor', anchor)
          .style('font-family', FONT)
          .style('font-size', isVal ? fsS+'px' : fs+'px')
          .style('font-weight', bold && !isVal ? '700' : '400')
          .style('fill', isVal ? '#777' : '#1a1a2e')
          .text(line);
      });
    }

    // ═══════════════════════════════════════════════════════════
    // DRAW — left to right
    // ═══════════════════════════════════════════════════════════

    // ── 1. Col A source bars + labels ─────────────────────────
    colAPub.forEach(function(item){
      nodeBar(xA, item.y, item.h, item.d.color);
      label(item.d.label, 'RM'+fmt(item.d.value)+'M',
            xA - BAR_W/2 - 5, item.y + item.h/2, 'end', false, item.h < 16);
    });
    colAPriv.forEach(function(item){
      nodeBar(xA, item.y, item.h, item.d.color);
      label(item.d.label, 'RM'+fmt(item.d.value)+'M',
            xA - BAR_W/2 - 5, item.y + item.h/2, 'end', false, item.h < 16);
    });

    // ── 2. Bands: Col A → Col B ───────────────────────────────
    // public sources → PUBLIC node
    colAPub.forEach(function(item){
      band(xA + BAR_W/2, item.y, item.h,
           xB - BAR_W/2, colBPub.y, colBPub.h * (item.d.value / publicTotal),
           item.d.color);
    });
    // private sources → PRIVATE node
    // Accumulate offsets on PRIVATE node
    var privOffsetB = 0;
    colAPriv.forEach(function(item){
      var bh = colBPriv.h * (item.d.value / privateTotal);
      band(xA + BAR_W/2, item.y, item.h,
           xB - BAR_W/2, colBPriv.y + privOffsetB, bh,
           item.d.color);
      privOffsetB += bh;
    });

    // ── 3. Col B nodes + labels ───────────────────────────────
    nodeBar(xB, colBPub.y,  colBPub.h,  C.public);
    nodeBar(xB, colBPriv.y, colBPriv.h, C.private);
    label('PUBLIC',  'RM45,580M', xB - BAR_W/2 - 5, pubMidY,  'end', true);
    label('PRIVATE', 'RM44,247M', xB - BAR_W/2 - 5, privMidY, 'end', true);

    // ── 4. Bands: Col B → Col C (SOURCE) ──────────────────────
    // PUBLIC → top half of SOURCE
    band(xB + BAR_W/2, colBPub.y,  colBPub.h,
         xC - BAR_W/2, colCY,       px(publicTotal),
         C.public, 0.28);
    // PRIVATE → bottom half of SOURCE
    band(xB + BAR_W/2, colBPriv.y, colBPriv.h,
         xC - BAR_W/2, colCY + px(publicTotal), px(privateTotal),
         C.private, 0.28);

    // ── 5. Col C SOURCE node + label ─────────────────────────
    nodeBar(xC, colCY, sourceH, C.source);
    label('SOURCE', 'RM89,827M', xC + BAR_W/2 + 5, centreY, 'start', true);

    // ── 6. Bands: Col C (SOURCE) → Col D (provider groups) ────
    // Accumulate offset leaving SOURCE right edge top-down
    var srcOffsetOut = 0;
    colD.forEach(function(item){
      var sh = px(item.d.value);
      band(xC + BAR_W/2, colCY + srcOffsetOut, sh,
           xD - BAR_W/2, item.y, item.h,
           C.source, 0.22);
      srcOffsetOut += sh;
    });

    // ── 7. Col D provider bars + labels ───────────────────────
    colD.forEach(function(item){
      nodeBar(xD, item.y, item.h, item.d.color);
      label(item.d.label, 'RM'+fmt(item.d.value)+'M',
            xD + BAR_W/2 + 5, item.y + item.h/2, 'start', false, item.h < 18);
    });

    // ── 8. Bands: Col D → Col E (PROVIDERS) ───────────────────
    var provOffsetE = 0;
    colD.forEach(function(item){
      var eh = px(item.d.value);
      band(xD + BAR_W/2, item.y, item.h,
           xE - BAR_W/2, colEY + provOffsetE, eh,
           item.d.color, 0.28);
      provOffsetE += eh;
    });

    // ── 9. Col E PROVIDERS node + label ───────────────────────
    nodeBar(xE, colEY, sourceH, C.provider);
    label('PROVIDERS', 'RM89,827M', xE + BAR_W/2 + 5, centreY, 'start', true);

    // ── 10. Bands: Col E (PROVIDERS) → Col F (functions) ──────
    var provOffsetF = 0;
    colF.forEach(function(item){
      var fh = px(item.d.value);
      band(xE + BAR_W/2, colEY + provOffsetF, fh,
           xF - BAR_W/2, item.y, item.h,
           C.func, 0.28);
      provOffsetF += fh;
    });

    // ── 11. Col F function bars + labels ──────────────────────
    colF.forEach(function(item){
      nodeBar(xF, item.y, item.h, item.d.color);
      label(item.d.label, 'RM'+fmt(item.d.value)+'M',
            xF + BAR_W/2 + 5, item.y + item.h/2, 'start', false, item.h < 18);
    });

    // ── 12. FUNCTIONS label (top right, matching Image 1 style) ─
    svg.append('text')
      .attr('x', xF + BAR_W/2 + 5)
      .attr('y', colF[0].y - 14)
      .style('font-family', FONT)
      .style('font-size', '9px')
      .style('font-weight', '700')
      .style('fill', '#9060b8')
      .style('letter-spacing', '0.04em')
      .text('FUNCTIONS  RM89,827M');
  }

  function fmt(n) {
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

})();