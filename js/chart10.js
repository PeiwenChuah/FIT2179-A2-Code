// chart10.js — Pure SVG Version (Fixed labels, clean layout)

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
    { label: 'Ambulatory healthcare providers', value: 18881, color: C.provider },
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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function init() {
    var el = document.getElementById('chart10');
    if (!el) return;
    draw(el);
  }

  function draw(el) {
    el.innerHTML = '';

    var W = 1000;
    var H = 550;

    var xA = 70;
    var xB = 190;
    var xC = 310;
    var xD = 460;
    var xE = 610;
    var xF = 760;

    var BW = 8, MW = 7, SW = 6;

    var scale = 280 / TOTAL;
    var SGAP = 18;

    function px(v) { return Math.max(2, v * scale); }

    function layout(items, cy) {
      var rh = items.map(d => px(d.value));
      var total = rh.reduce((s, h) => s + h, 0) + SGAP * (items.length - 1);
      var top = cy - total / 2;
      var cur = top;
      return items.map((d, i) => {
        var obj = { d: d, y: cur, h: rh[i] };
        cur += rh[i] + SGAP;
        return obj;
      });
    }

    function sumValues(arr) {
      return arr.reduce((s, d) => s + px(d.value), 0);
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

    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', W);
    svg.setAttribute('height', H);
    svg.style.display = 'block';
    svg.style.margin = '0 auto';
    el.appendChild(svg);

    function ribbon(x1, y1, x2, y2, h, color, a) {
      var mx = (x1 + x2) / 2;
      var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      var d = `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}
               L${x2},${y2 + h} C${mx},${y2 + h} ${mx},${y1 + h} ${x1},${y1 + h} Z`;
      path.setAttribute('d', d);
      path.setAttribute('fill', color);
      path.setAttribute('fill-opacity', a || 0.45);
      svg.appendChild(path);
    }

    function bar(x, y, h, c, w) {
      var r = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      r.setAttribute('x', x);
      r.setAttribute('y', y);
      r.setAttribute('width', w || BW);
      r.setAttribute('height', h);
      r.setAttribute('fill', c);
      svg.appendChild(r);
    }

    function lbl(text, val, x, y, anchor, bold) {
      var t1 = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      t1.setAttribute('x', x);
      t1.setAttribute('y', y);
      t1.setAttribute('text-anchor', anchor);
      t1.style.fontSize = '9px';
      t1.style.fontWeight = bold ? '700' : '400';
      t1.textContent = text;
      svg.appendChild(t1);

      var t2 = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      t2.setAttribute('x', x);
      t2.setAttribute('y', y + 11);
      t2.setAttribute('text-anchor', anchor);
      t2.style.fontSize = '8px';
      t2.style.fill = '#777';
      t2.textContent = val;
      svg.appendChild(t2);
    }

    function fmt(n) {
      return 'RM' + n.toLocaleString() + 'M';
    }

    // Sources
    colAPub.forEach(d => {
      bar(xA, d.y, d.h, d.d.color);
      lbl(d.d.label, fmt(d.d.value), xA - 8, d.y + d.h / 2, 'end');
    });

    colAPriv.forEach(d => {
      bar(xA, d.y, d.h, d.d.color);
      lbl(d.d.label, fmt(d.d.value), xA - 8, d.y + d.h / 2, 'end');
    });

    var acc = 0;
    colAPub.forEach(d => {
      ribbon(xA + BW, d.y, xB, pubBarY + acc, d.h, d.d.color);
      acc += d.h;
    });

    acc = 0;
    colAPriv.forEach(d => {
      ribbon(xA + BW, d.y, xB, privBarY + acc, d.h, d.d.color);
      acc += d.h;
    });

    bar(xB, pubBarY, pubT, C.public, MW);
    bar(xB, privBarY, privT, C.private, MW);

    lbl('PUBLIC', fmt(45580), xB + MW + 5, pubCY, 'start', true);
    lbl('PRIVATE', fmt(44247), xB + MW + 5, privCY, 'start', true);

    ribbon(xB + MW, pubBarY, xC, srcBarY, pubT, C.public);
    ribbon(xB + MW, privBarY, xC, srcBarY + pubT, privT, C.private);

    bar(xC, srcBarY, pubT + privT, C.source, SW);
    lbl('SOURCE', fmt(89827), xC + SW + 5, srcCY, 'start', true);

    acc = 0;
    colD.forEach(d => {
      var h = (pubT + privT) * (d.d.value / TOTAL);
      ribbon(xC + SW, srcBarY + acc, xD, d.y, h, C.source, 0.3);
      acc += h;
    });

    colD.forEach(d => {
      bar(xD, d.y, d.h, d.d.color);
      lbl(d.d.label, fmt(d.d.value), xD + BW + 8, d.y + d.h / 2, 'start');
    });

    acc = 0;
    colD.forEach(d => {
      ribbon(xD + BW, d.y, xE, provBarY + acc, d.h, d.d.color);
      acc += d.h;
    });

    bar(xE, provBarY, provT, C.provider, SW);
    lbl('PROVIDERS', fmt(89827), xE + SW + 5, srcCY, 'start', true);

    acc = 0;
    colF.forEach(d => {
      var h = provT * (d.d.value / TOTAL);
      ribbon(xE + SW, provBarY + acc, xF, d.y, h, C.func);
      acc += h;
    });

    colF.forEach(d => {
      bar(xF, d.y, d.h, d.d.color);
      lbl(d.d.label, fmt(d.d.value), xF + BW + 8, d.y + d.h / 2, 'start');
    });
  }
})();