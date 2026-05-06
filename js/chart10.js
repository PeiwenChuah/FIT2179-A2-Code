// chart10.js — Flow of Health Funds
// Matches reference diagram (Image 2) closely:
// - Thinner flow bands (lower opacity + narrower spread)
// - No FUNCTIONS label
// - SOURCE and PROVIDERS are very short bars (merge points only)
// - Smaller public sub-sources (Other federal agencies, MOE, Other public) merge lower/separately from MOH
// - Colors match Image 2 palette

(function () {
  'use strict';

  function loadScript(src, cb) {
    var s = document.createElement('script');
    s.src = src; s.onload = cb;
    document.head.appendChild(s);
  }

  loadScript('https://cdn.jsdelivr.net/npm/d3@7/dist/d3.min.js', init);

  // ── Palette (matching Image 2) ─────────────────────────────────
  var C = {
    moh      : '#6ab0d8',   // blue for MOH
    pubSrc   : '#a8d4e8',   // lighter blue for smaller public sources
    outPocket: '#e8a080',   // salmon for out-of-pocket
    privSrc  : '#f0c8a8',   // lighter peach for smaller private sources
    public   : '#4a8cc0',   // medium blue — PUBLIC node
    private  : '#c86030',   // burnt orange — PRIVATE node
    source   : '#8090a8',   // grey-blue — SOURCE node
    provider : '#60b060',   // green — provider groups & PROVIDERS node
    func     : '#9060b8',   // purple — functions
  };

  // ── Data ──────────────────────────────────────────────────────
  var TOTAL = 89827;

  var MOH_VAL = 39148;
  var smallPubSources = [
    { label: 'Other federal agencies', value: 2066, color: C.pubSrc },
    { label: 'MOE',                    value: 1975, color: C.pubSrc },
    { label: 'Other public sources',   value: 2391, color: C.pubSrc },
  ];
  var smallPubTotal = smallPubSources.reduce(function(s,d){ return s+d.value; }, 0); // 6432

  var publicTotal = MOH_VAL + smallPubTotal; // 45580

  var privateSources = [
    { label: 'Out-of-pocket',         value: 34843, color: C.outPocket },
    { label: 'Private insurance',     value:  7112, color: C.privSrc   },
    { label: 'All corporations',      value:  1461, color: C.privSrc   },
    { label: 'Other private sources', value:   831, color: C.privSrc   },
  ];
  var privateTotal = privateSources.reduce(function(s,d){ return s+d.value; }, 0); // 44247

  var providers = [
    { label: 'All hospitals',                                               value: 48721, color: C.provider },
    { label: 'Providers of ambulatory health care',                         value: 18881, color: C.provider },
    { label: 'All other providers',                                         value:  5049, color: C.provider },
    { label: 'Retail sale and other providers of medical goods',            value:  7636, color: C.provider },
    { label: 'Providers of health care system administration and financing', value:  8640, color: C.provider },
  ];

  var functions_ = [
    { label: 'Services of curative care',     value: 56554, color: C.func },
    { label: 'Medical goods',                value:  8560, color: C.func },
    { label: 'Gross capital formation',      value:  8475, color: C.func },
    { label: 'Governance and health system', value:  7211, color: C.func },
    { label: 'Preventive care',              value:  5415, color: C.func },
    { label: 'All other functions',          value:  3612, color: C.func },
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

    var W  = Math.min(Math.max(el.offsetWidth || 900, 700), 1200);
    var H  = 640;
    var FONT = "'Times New Roman', Times, serif";

    // ── Column x-centres ──────────────────────────────────────
    var xA = 0.09 * W;   // source bars
    var xB = 0.23 * W;   // PUBLIC / PRIVATE nodes
    var xC = 0.38 * W;   // SOURCE node (very short)
    var xD = 0.57 * W;   // provider group bars
    var xE = 0.72 * W;   // PROVIDERS node (very short)
    var xF = 0.89 * W;   // function bars

    var BAR_W      = 10;  // width of source/provider bars
    var MERGE_W    = 6;   // width of PUBLIC/PRIVATE merge nodes
    var SHORTBAR_W = 6;   // width of SOURCE and PROVIDERS (very short / thin)
    var SHORTBAR_H = 28;  // height of SOURCE and PROVIDERS bars — tiny merge indicator
    var GAP        = 5;   // gap between stacked bands

    // ── Vertical scale ────────────────────────────────────────
    var vPad  = 60;
    var availH = H - 2 * vPad;
    var scale  = availH / (TOTAL * 1.22);

    function px(val) { return val * scale; }

    // ── Layout helpers ────────────────────────────────────────
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

    // ── Col A layout ──────────────────────────────────────────
    // MOH is at top-ish; small pub sources cluster just below MOH
    // Then a gap; then private sources
    var mohH       = px(MOH_VAL);
    var smallPubH  = px(smallPubTotal) + (smallPubSources.length - 1) * GAP;
    var privH      = px(privateTotal)  + (privateSources.length - 1)  * GAP;

    // Total left column height
    var totalLeftH = mohH + GAP * 2 + smallPubH + GAP * 6 + privH;
    var leftTop    = centreY - totalLeftH / 2;

    // MOH bar
    var mohY = leftTop;

    // Small public sources start just below MOH
    var smallPubStartY = mohY + mohH + GAP * 2;
    var colASmallPub = [];
    var cursor = smallPubStartY;
    smallPubSources.forEach(function(d) {
      var h = px(d.value);
      colASmallPub.push({ d: d, y: cursor, h: h });
      cursor += h + GAP;
    });

    // Private sources after a bigger gap
    var privStartY = smallPubStartY + smallPubH + GAP * 6;
    var colAPriv = [];
    cursor = privStartY;
    privateSources.forEach(function(d) {
      var h = px(d.value);
      colAPriv.push({ d: d, y: cursor, h: h });
      cursor += h + GAP;
    });

    // ── Col B: PUBLIC and PRIVATE merge nodes ─────────────────
    var pubMidY  = mohY + (mohH + GAP * 2 + smallPubH) / 2;
    var pubNodeH = mohH + GAP * 2 + smallPubH;
    var colBPubY = mohY;

    var privMidY  = privStartY + privH / 2;
    var colBPrivY = privStartY;

    // ── Col C: SOURCE — very short bar, centred ───────────────
    var colCY = centreY - SHORTBAR_H / 2;

    // ── Col D: provider groups, centred ──────────────────────
    var colD = layoutColumn(providers, TOTAL, centreY);

    // ── Col E: PROVIDERS — very short bar, centred ───────────
    var colEY = centreY - SHORTBAR_H / 2;

    // ── Col F: functions, centred ─────────────────────────────
    var colF = layoutColumn(functions_, TOTAL, centreY);

    // ── SVG ───────────────────────────────────────────────────
    var svg = d3.select(el).append('svg')
      .attr('width', '100%')
      .attr('height', H)
      .attr('viewBox', '0 0 ' + W + ' ' + H)
      .style('font-family', FONT);

    // ── Draw a thin smooth band ───────────────────────────────
    // opacity kept low for thin appearance
    function band(x1, y1, h1, x2, y2, h2, color, opacity) {
      opacity = opacity === undefined ? 0.22 : opacity;
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

    // ── Draw a node bar ───────────────────────────────────────
    function nodeBar(x, y, h, color, w) {
      w = w || BAR_W;
      svg.append('rect')
        .attr('x', x - w / 2)
        .attr('y', y)
        .attr('width', w)
        .attr('height', Math.max(2, h))
        .attr('fill', color)
        .attr('rx', 2);
    }

    // ── Label helper ──────────────────────────────────────────
    function label(text, sub, x, midY, anchor, bold, smallFont) {
      var fs  = smallFont ? 8 : 9;
      var fsS = 7.5;
      var LH  = 10.5;
      var words = text.split(' '), lines = [], cur = '';
      words.forEach(function(w){
        var t = cur ? cur+' '+w : w;
        if (t.length > 26 && cur){ lines.push(cur); cur = w; } else { cur = t; }
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
          .style('fill', isVal ? '#888' : '#1a1a2e')
          .text(line);
      });
    }

    // ═══════════════════════════════════════════════════════════
    // DRAW
    // ═══════════════════════════════════════════════════════════

    // ── 1. Col A bars + labels ─────────────────────────────────
    // MOH
    nodeBar(xA, mohY, mohH, C.moh);
    label('MOH', 'RM'+fmt(MOH_VAL)+'M', xA - BAR_W/2 - 4, mohY + mohH/2, 'end', false, false);

    // Small public sources
    colASmallPub.forEach(function(item){
      nodeBar(xA, item.y, item.h, item.d.color);
      label(item.d.label, 'RM'+fmt(item.d.value)+'M',
            xA - BAR_W/2 - 4, item.y + item.h/2, 'end', false, true);
    });

    // Private sources
    colAPriv.forEach(function(item){
      nodeBar(xA, item.y, item.h, item.d.color);
      label(item.d.label, 'RM'+fmt(item.d.value)+'M',
            xA - BAR_W/2 - 4, item.y + item.h/2, 'end', false, item.h < 16);
    });

    // ── 2. Bands: Col A sources → Col B PUBLIC node ───────────
    // MOH → PUBLIC (flows into top portion of PUBLIC node)
    band(xA + BAR_W/2, mohY, mohH,
         xB - MERGE_W/2, colBPubY, mohH,
         C.moh, 0.25);

    // Small pub sources → PUBLIC (flows into lower portion of PUBLIC node)
    var smallPubBOffset = mohH + GAP * 2; // offset within PUBLIC node
    colASmallPub.forEach(function(item){
      var bh = px(item.d.value);
      band(xA + BAR_W/2, item.y, item.h,
           xB - MERGE_W/2, colBPubY + smallPubBOffset, bh,
           item.d.color, 0.22);
      smallPubBOffset += bh + GAP;
    });

    // Private sources → PRIVATE node
    var privBOffset = 0;
    colAPriv.forEach(function(item){
      var bh = px(item.d.value);
      band(xA + BAR_W/2, item.y, item.h,
           xB - MERGE_W/2, colBPrivY + privBOffset, bh,
           item.d.color, 0.22);
      privBOffset += bh + GAP;
    });

    // ── 3. Col B nodes + labels ───────────────────────────────
    nodeBar(xB, colBPubY,  pubNodeH, C.public,  MERGE_W);
    nodeBar(xB, colBPrivY, privH,    C.private, MERGE_W);
    label('PUBLIC',  'RM45,580M', xB + MERGE_W/2 + 4, colBPubY  + pubNodeH/2, 'start', true);
    label('PRIVATE', 'RM44,247M', xB + MERGE_W/2 + 4, colBPrivY + privH/2,    'start', true);

    // ── 4. Bands: Col B → Col C SOURCE (very short bar) ───────
    // PUBLIC and PRIVATE both converge toward centre (SOURCE bar)
    band(xB + MERGE_W/2, colBPubY, pubNodeH,
         xC - SHORTBAR_W/2, colCY - (SHORTBAR_H * publicTotal/TOTAL)/2, SHORTBAR_H * publicTotal/TOTAL,
         C.public, 0.22);
    band(xB + MERGE_W/2, colBPrivY, privH,
         xC - SHORTBAR_W/2, colCY + SHORTBAR_H * publicTotal/TOTAL - (SHORTBAR_H * privateTotal/TOTAL)/2, SHORTBAR_H * privateTotal/TOTAL,
         C.private, 0.22);

    // ── 5. Col C SOURCE node (very short) + label ─────────────
    nodeBar(xC, colCY, SHORTBAR_H, C.source, SHORTBAR_W);
    label('SOURCE', 'RM89,827M', xC + SHORTBAR_W/2 + 4, colCY + SHORTBAR_H/2, 'start', true);

    // ── 6. Bands: SOURCE → Col D provider groups ──────────────
    var srcOut = 0;
    colD.forEach(function(item){
      var sh = px(item.d.value);
      band(xC + SHORTBAR_W/2, colCY + SHORTBAR_H * (srcOut/TOTAL), Math.max(1, SHORTBAR_H * (item.d.value/TOTAL)),
           xD - BAR_W/2, item.y, item.h,
           C.source, 0.20);
      srcOut += item.d.value;
    });

    // ── 7. Col D provider bars + labels ───────────────────────
    colD.forEach(function(item){
      nodeBar(xD, item.y, item.h, item.d.color);
      label(item.d.label, 'RM'+fmt(item.d.value)+'M',
            xD + BAR_W/2 + 4, item.y + item.h/2, 'start', false, item.h < 18);
    });

    // ── 8. Bands: Col D → Col E PROVIDERS (very short) ────────
    var provOut = 0;
    colD.forEach(function(item){
      var eh = px(item.d.value);
      band(xD + BAR_W/2, item.y, item.h,
           xE - SHORTBAR_W/2, colEY + SHORTBAR_H * (provOut/TOTAL), Math.max(1, SHORTBAR_H * (item.d.value/TOTAL)),
           item.d.color, 0.22);
      provOut += item.d.value;
    });

    // ── 9. Col E PROVIDERS node (very short) + label ──────────
    nodeBar(xE, colEY, SHORTBAR_H, C.provider, SHORTBAR_W);
    label('PROVIDERS', 'RM89,827M', xE + SHORTBAR_W/2 + 4, colEY + SHORTBAR_H/2, 'start', true);

    // ── 10. Bands: PROVIDERS → Col F functions ────────────────
    var fnOut = 0;
    colF.forEach(function(item){
      var fh = px(item.d.value);
      band(xE + SHORTBAR_W/2, colEY + SHORTBAR_H * (fnOut/TOTAL), Math.max(1, SHORTBAR_H * (item.d.value/TOTAL)),
           xF - BAR_W/2, item.y, item.h,
           C.func, 0.25);
      fnOut += item.d.value;
    });

    // ── 11. Col F function bars + labels ──────────────────────
    colF.forEach(function(item){
      nodeBar(xF, item.y, item.h, item.d.color);
      label(item.d.label, 'RM'+fmt(item.d.value)+'M',
            xF + BAR_W/2 + 4, item.y + item.h/2, 'start', false, item.h < 18);
    });

    // NOTE: FUNCTIONS label intentionally removed per requirements
  }

  function fmt(n) {
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

})();