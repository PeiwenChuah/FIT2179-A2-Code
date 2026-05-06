// chart10.js — Pure SVG Version (Perfect alignment, no scroll)

(function () {
  'use strict';

  var C = {
    moh: '#6ab0d8',
    pubSrc: '#a8d4e8',
    outPocket: '#e8a080',
    privSrc: '#f0c8a8',
    public: '#5a9fd4',
    private: '#c86030',
    source: '#8090a8',
    provider: '#60b060',
    func: '#9060b8'
  };

  var TOTAL = 89827;

  var pubSources = [
    { label: 'MOH', value: 39148, color: C.moh },
    { label: 'Other federal agencies', value: 2066, color: C.pubSrc },
    { label: 'MOE', value: 1975, color: C.pubSrc },
    { label: 'Other public sources', value: 2391, color: C.pubSrc }
  ];

  var privSources = [
    { label: 'Out-of-pocket', value: 34843, color: C.outPocket },
    { label: 'Private insurance', value: 7112, color: C.privSrc },
    { label: 'All corporations', value: 1461, color: C.privSrc },
    { label: 'Other private sources', value: 831, color: C.privSrc }
  ];

  var providers = [
    { label: 'All hospitals', value: 48721, color: C.provider },
    { label: 'Providers of ambulatory health care', value: 18881, color: C.provider },
    { label: 'All other providers', value: 5049, color: C.provider },
    { label: 'Retail medical goods providers', value: 7636, color: C.provider },
    { label: 'Health system admin & financing', value: 8640, color: C.provider }
  ];

  var functions_ = [
    { label: 'Curative care', value: 56554, color: C.func },
    { label: 'Medical goods', value: 8560, color: C.func },
    { label: 'Capital formation', value: 8475, color: C.func },
    { label: 'Governance', value: 7211, color: C.func },
    { label: 'Preventive care', value: 5415, color: C.func },
    { label: 'Other functions', value: 3612, color: C.func }
  ];

  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function init() {
    var el = document.getElementById('chart10');
    if (!el) {
      console.error('chart10 element not found');
      return;
    }
    draw(el);
  }

  function draw(el) {
    el.innerHTML = '';

    // Adjusted width to fit within container without horizontal scroll
    var W = 1000;
    var H = 550;

    // Column positions - optimized to fit in 1000px width
    var xA = 70;   // Sources column
    var xB = 190;  // Public/Private split
    var xC = 310;  // Source total
    var xD = 460;  // Providers column
    var xE = 610;  // PROVIDERS label
    var xF = 760;  // Functions column

    var BW = 8, MW = 7, SW = 6;

    var scale = 280 / TOTAL;
    var SGAP = 18;

    function px(v) { return Math.max(2, v * scale); }

    function layout(items, cy) {
      var rh = items.map(function(d) { return px(d.value); });
      var total = rh.reduce(function(s, h) { return s + h; }, 0) + SGAP * (items.length - 1);
      var top = cy - total / 2;
      var cur = top;
      var result = [];
      for (var i = 0; i < items.length; i++) {
        result.push({ d: items[i], y: cur, h: rh[i] });
        cur += rh[i] + SGAP;
      }
      return result;
    }

    // Helper sum function
    function sumValues(arr) {
      var total = 0;
      for (var i = 0; i < arr.length; i++) {
        total += px(arr[i].value);
      }
      return total;
    }

    var pubCY = H * 0.32;
    var privCY = H * 0.68;
    var srcCY = H * 0.5;

    var colAPub = layout(pubSources, pubCY);
    var colAPriv = layout(privSources, privCY);
    var colD = layout(providers, srcCY);
    var colF = layout(functions_, srcCY);

    var pubT = sumValues(pubSources);
    var privT = sumValues(privSources);
    var provT = sumValues(providers);

    var pubBarY = pubCY - pubT / 2;
    var privBarY = privCY - privT / 2;
    var srcBarY = srcCY - (pubT + privT) / 2;
    var provBarY = srcCY - provT / 2;

    // Create SVG container
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', W);
    svg.setAttribute('height', H);
    svg.style.display = 'block';
    svg.style.margin = '0 auto';
    el.appendChild(svg);

    function ribbon(x1, y1, x2, y2, h, color, a) {
      var mx = (x1 + x2) / 2;
      var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      var d = 'M' + x1 + ',' + y1 + ' C' + mx + ',' + y1 + ' ' + mx + ',' + y2 + ' ' + x2 + ',' + y2 +
              ' L' + x2 + ',' + (y2 + h) + ' C' + mx + ',' + (y2 + h) + ' ' + mx + ',' + (y1 + h) + ' ' + x1 + ',' + (y1 + h) + ' Z';
      path.setAttribute('d', d);
      path.setAttribute('fill', color);
      path.setAttribute('fill-opacity', a || 0.45);
      svg.appendChild(path);
    }

    function bar(x, y, h, c, w) {
      var rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', x);
      rect.setAttribute('y', y);
      rect.setAttribute('width', w || BW);
      rect.setAttribute('height', h);
      rect.setAttribute('fill', c);
      svg.appendChild(rect);
    }

    function lbl(text, val, x, y, anchor, bold) {
      // Wrap long text for better display
      var displayText = text;
      if (text === 'Providers of ambulatory health care') {
        displayText = 'Providers of ambulatory';
        // Add second line
        var text1a = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text1a.setAttribute('x', x);
        text1a.setAttribute('y', y - 5);
        text1a.setAttribute('text-anchor', anchor);
        text1a.style.fontSize = '9px';
        text1a.style.fontWeight = bold ? '700' : '400';
        text1a.textContent = 'ambulatory health care';
        svg.appendChild(text1a);
        
        var text1b = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text1b.setAttribute('x', x);
        text1b.setAttribute('y', y + 5);
        text1b.setAttribute('text-anchor', anchor);
        text1b.style.fontSize = '9px';
        text1b.style.fontWeight = bold ? '700' : '400';
        text1b.textContent = displayText;
        svg.appendChild(text1b);
        
        var text2 = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text2.setAttribute('x', x);
        text2.setAttribute('y', y + 16);
        text2.setAttribute('text-anchor', anchor);
        text2.style.fontSize = '8px';
        text2.style.fill = '#777';
        text2.textContent = val;
        svg.appendChild(text2);
        return;
      }
      
      var text1 = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text1.setAttribute('x', x);
      text1.setAttribute('y', y);
      text1.setAttribute('text-anchor', anchor);
      text1.style.fontSize = '9px';
      text1.style.fontWeight = bold ? '700' : '400';
      text1.textContent = displayText;
      svg.appendChild(text1);

      var text2 = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text2.setAttribute('x', x);
      text2.setAttribute('y', y + 11);
      text2.setAttribute('text-anchor', anchor);
      text2.style.fontSize = '8px';
      text2.style.fill = '#777';
      text2.textContent = val;
      svg.appendChild(text2);
    }

    function fmt(n) {
      return 'RM' + n.toLocaleString() + 'M';
    }

    // DRAW - Public Sources bars (x position is exact bar start)
    for (var i = 0; i < colAPub.length; i++) {
      var d = colAPub[i];
      bar(xA, d.y, d.h, d.d.color, BW);
      lbl(d.d.label, fmt(d.d.value), xA - 8, d.y + d.h / 2, 'end', false);
    }

    // DRAW - Private Sources bars
    for (var i = 0; i < colAPriv.length; i++) {
      var d = colAPriv[i];
      bar(xA, d.y, d.h, d.d.color, BW);
      lbl(d.d.label, fmt(d.d.value), xA - 8, d.y + d.h / 2, 'end', false);
    }

    // Ribbons from sources to public/private - aligned to bar edges
    var acc = 0;
    for (var i = 0; i < colAPub.length; i++) {
      var d = colAPub[i];
      ribbon(xA + BW, d.y, xB, pubBarY + acc, d.h, d.d.color);
      acc += d.h;
    }

    acc = 0;
    for (var i = 0; i < colAPriv.length; i++) {
      var d = colAPriv[i];
      ribbon(xA + BW, d.y, xB, privBarY + acc, d.h, d.d.color);
      acc += d.h;
    }

    // Public and Private bars
    bar(xB, pubBarY, pubT, C.public, MW);
    bar(xB, privBarY, privT, C.private, MW);

    lbl('PUBLIC', fmt(45580), xB + MW + 5, pubCY, 'start', true);
    lbl('PRIVATE', fmt(44247), xB + MW + 5, privCY, 'start', true);

    // Ribbons to SOURCE - aligned to bar edges
    ribbon(xB + MW, pubBarY, xC, srcBarY, pubT, C.public);
    ribbon(xB + MW, privBarY, xC, srcBarY + pubT, privT, C.private);

    // SOURCE bar
    bar(xC, srcBarY, pubT + privT, C.source, SW);
    lbl('SOURCE', fmt(89827), xC + SW + 5, srcCY, 'start', true);

    // Calculate exact cumulative heights for provider ribbons
    var providerCumulativeHeights = [];
    var cumHeight = 0;
    for (var i = 0; i < colD.length; i++) {
      providerCumulativeHeights.push(cumHeight);
      cumHeight += colD[i].h;
    }

    // Ribbons to providers - using exact source bar proportions
    var sourceTotalHeight = pubT + privT;
    acc = 0;
    for (var i = 0; i < colD.length; i++) {
      var d = colD[i];
      var ribbonHeight = sourceTotalHeight * (d.d.value / TOTAL);
      ribbon(xC + SW, srcBarY + acc, xD, d.y, ribbonHeight, C.source, 0.3);
      acc += ribbonHeight;
    }

    // Providers bars
    for (var i = 0; i < colD.length; i++) {
      var d = colD[i];
      bar(xD, d.y, d.h, d.d.color, BW);
      lbl(d.d.label, fmt(d.d.value), xD + BW + 8, d.y + d.h / 2, 'start', false);
    }

    // GREEN flow line (providers to functions) - aligned to bar edges
    acc = 0;
    for (var i = 0; i < colD.length; i++) {
      var d = colD[i];
      ribbon(xD + BW, d.y, xE, provBarY + acc, d.h, d.d.color);
      acc += d.h;
    }

    // PROVIDERS label bar
    bar(xE, provBarY, provT, C.provider, SW);
    lbl('PROVIDERS', fmt(89827), xE + SW + 5, srcCY, 'start', true);

    // Ribbons to functions - exact alignment
    acc = 0;
    for (var i = 0; i < colF.length; i++) {
      var d = colF[i];
      var h = provT * (d.d.value / TOTAL);
      ribbon(xE + SW, provBarY + acc, xF, d.y, h, C.func);
      acc += h;
    }

    // Functions bars
    for (var i = 0; i < colF.length; i++) {
      var d = colF[i];
      bar(xF, d.y, d.h, d.d.color, BW);
      lbl(d.d.label, fmt(d.d.value), xF + BW + 8, d.y + d.h / 2, 'start', false);
    }
  }
})();