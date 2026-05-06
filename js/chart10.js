// chart10.js — Pure SVG Version (No external dependencies)

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

    var W = 950;
    var H = 520;

    // Column positions - shifted left for better label fit
    var xA = 40;
    var xB = 150;
    var xC = 280;
    var xD = 430;
    var xE = 580;
    var xF = 730;

    var BW = 8, MW = 7, SW = 6;

    var scale = 260 / TOTAL;
    var SGAP = 16;

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

    function ribbon(x1, y1, h1, x2, y2, h2, color, a) {
      var mx = (x1 + x2) / 2;
      var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      var d = 'M' + x1 + ',' + y1 + ' C' + mx + ',' + y1 + ' ' + mx + ',' + y2 + ' ' + x2 + ',' + y2 +
              ' L' + x2 + ',' + (y2 + h2) + ' C' + mx + ',' + (y2 + h2) + ' ' + mx + ',' + (y1 + h1) + ' ' + x1 + ',' + (y1 + h1) + ' Z';
      path.setAttribute('d', d);
      path.setAttribute('fill', color);
      path.setAttribute('fill-opacity', a || 0.45);
      svg.appendChild(path);
    }

    function bar(x, y, h, c, w) {
      var rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', x - (w || BW) / 2);
      rect.setAttribute('y', y);
      rect.setAttribute('width', w || BW);
      rect.setAttribute('height', h);
      rect.setAttribute('fill', c);
      svg.appendChild(rect);
    }

    function lbl(text, val, x, y, anchor, bold) {
      var text1 = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text1.setAttribute('x', x);
      text1.setAttribute('y', y);
      text1.setAttribute('text-anchor', anchor);
      text1.style.fontSize = '9px';
      text1.style.fontWeight = bold ? '700' : '400';
      text1.textContent = text;
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

    // DRAW - Public Sources
    for (var i = 0; i < colAPub.length; i++) {
      var d = colAPub[i];
      bar(xA, d.y, d.h, d.d.color);
      lbl(d.d.label, fmt(d.d.value), xA - 8, d.y + d.h / 2, 'end', false);
    }

    // DRAW - Private Sources
    for (var i = 0; i < colAPriv.length; i++) {
      var d = colAPriv[i];
      bar(xA, d.y, d.h, d.d.color);
      lbl(d.d.label, fmt(d.d.value), xA - 8, d.y + d.h / 2, 'end', false);
    }

    // Ribbons from sources to public/private
    var acc = 0;
    for (var i = 0; i < colAPub.length; i++) {
      var d = colAPub[i];
      ribbon(xA + 4, d.y, d.h, xB - 4, pubBarY + acc, d.h, d.d.color);
      acc += px(d.d.value);
    }

    acc = 0;
    for (var i = 0; i < colAPriv.length; i++) {
      var d = colAPriv[i];
      ribbon(xA + 4, d.y, d.h, xB - 4, privBarY + acc, d.h, d.d.color);
      acc += px(d.d.value);
    }

    // Public and Private bars
    bar(xB, pubBarY, pubT, C.public, MW);
    bar(xB, privBarY, privT, C.private, MW);

    lbl('PUBLIC', fmt(45580), xB + 10, pubCY, 'start', true);
    lbl('PRIVATE', fmt(44247), xB + 10, privCY, 'start', true);

    // Ribbons to SOURCE
    ribbon(xB + 4, pubBarY, pubT, xC - 4, srcBarY, pubT, C.public);
    ribbon(xB + 4, privBarY, privT, xC - 4, srcBarY + pubT, privT, C.private);

    // SOURCE bar
    bar(xC, srcBarY, pubT + privT, C.source, SW);
    lbl('SOURCE', fmt(89827), xC + 10, srcCY, 'start', true);

    // Ribbons to providers
    acc = 0;
    for (var i = 0; i < colD.length; i++) {
      var d = colD[i];
      var h = (pubT + privT) * (d.d.value / TOTAL);
      ribbon(xC + 4, srcBarY + acc, h, xD - 4, d.y, d.h, C.source, 0.3);
      acc += h;
    }

    // Providers bars
    for (var i = 0; i < colD.length; i++) {
      var d = colD[i];
      bar(xD, d.y, d.h, d.d.color);
      lbl(d.d.label, fmt(d.d.value), xD + 10, d.y + d.h / 2, 'start', false);
    }

    // GREEN flow line (providers to functions) - made longer
    acc = 0;
    for (var i = 0; i < colD.length; i++) {
      var d = colD[i];
      ribbon(xD + 8, d.y, d.h, xE - 12, provBarY + acc, d.h, d.d.color);
      acc += px(d.d.value);
    }

    // FUNCTIONS bar
    bar(xE, provBarY, provT, C.provider, SW);
    lbl('PROVIDERS', fmt(89827), xE + 10, srcCY, 'start', true);

    // Ribbons to functions
    acc = 0;
    for (var i = 0; i < colF.length; i++) {
      var d = colF[i];
      var h = provT * (d.d.value / TOTAL);
      ribbon(xE + 4, provBarY + acc, h, xF - 4, d.y, d.h, C.func);
      acc += h;
    }

    // Functions bars
    for (var i = 0; i < colF.length; i++) {
      var d = colF[i];
      bar(xF, d.y, d.h, d.d.color);
      lbl(d.d.label, fmt(d.d.value), xF + 10, d.y + d.h / 2, 'start', false);
    }
  }
})();