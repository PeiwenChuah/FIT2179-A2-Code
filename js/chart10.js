// chart10.js — FINAL CLEAN (better spacing + compact layout)

(function () {
  'use strict';

  function loadScript(src, cb) {
    var s = document.createElement('script');
    s.src = src; s.onload = cb;
    document.head.appendChild(s);
  }

  loadScript('https://cdn.jsdelivr.net/npm/d3@7/dist/d3.min.js', init);

  var C = {
    moh:'#6ab0d8', pubSrc:'#a8d4e8', outPocket:'#e8a080', privSrc:'#f0c8a8',
    public:'#5a9fd4', private:'#c86030', source:'#8090a8',
    provider:'#60b060', func:'#9060b8'
  };

  var TOTAL = 89827;

  var pubSources = [
    { label:'MOH', value:39148, color:C.moh },
    { label:'Other federal agencies', value:2066, color:C.pubSrc },
    { label:'MOE', value:1975, color:C.pubSrc },
    { label:'Other public sources', value:2391, color:C.pubSrc }
  ];

  var privSources = [
    { label:'Out-of-pocket', value:34843, color:C.outPocket },
    { label:'Private insurance', value:7112, color:C.privSrc },
    { label:'All corporations', value:1461, color:C.privSrc },
    { label:'Other private sources', value:831, color:C.privSrc }
  ];

  var providers = [
    { label:'All hospitals', value:48721, color:C.provider },
    { label:'Providers of ambulatory health care', value:18881, color:C.provider },
    { label:'All other providers', value:5049, color:C.provider },
    { label:'Retail medical goods providers', value:7636, color:C.provider },
    { label:'Health system admin & financing', value:8640, color:C.provider }
  ];

  var functions_ = [
    { label:'Curative care', value:56554, color:C.func },
    { label:'Medical goods', value:8560, color:C.func },
    { label:'Capital formation', value:8475, color:C.func },
    { label:'Governance', value:7211, color:C.func },
    { label:'Preventive care', value:5415, color:C.func },
    { label:'Other functions', value:3612, color:C.func }
  ];

  function init() {
    var el = document.getElementById('chart10');
    if (!el) return;
    draw(el);
  }

  function draw(el) {
    d3.select(el).selectAll('*').remove();

    var W = 900;
    var H = 520;

    // MOVED CHART LEFT: reduced all x-coordinates by 20px to fit left labels
    var xA = 60;   // was 80
    var xB = 180;  // was 200
    var xC = 320;  // was 340
    var xD = 480;  // was 500
    var xE = 600;  // was 620
    var xF = 740;  // was 760

    var BW = 8, MW = 7, SW = 6;

    var scale = 260 / TOTAL;
    var SGAP = 16;

    function px(v){ return Math.max(2, v*scale); }

    function layout(items, cy){
      var rh = items.map(d=>px(d.value));
      var total = rh.reduce((s,h)=>s+h,0) + SGAP*(items.length-1);
      var top = cy - total/2, cur=top;
      return items.map((d,i)=>{
        var obj = {d:d, y:cur, h:rh[i]};
        cur += rh[i] + SGAP;
        return obj;
      });
    }

    var pubCY=H*0.32, privCY=H*0.68, srcCY=H*0.5;

    var colAPub  = layout(pubSources, pubCY);
    var colAPriv = layout(privSources, privCY);
    var colD     = layout(providers, srcCY);
    var colF     = layout(functions_, srcCY);

    var pubT = d3.sum(pubSources,d=>px(d.value));
    var privT= d3.sum(privSources,d=>px(d.value));
    var provT= d3.sum(providers,d=>px(d.value));

    var pubBarY  = pubCY  - pubT/2;
    var privBarY = privCY - privT/2;
    var srcBarY  = srcCY  - (pubT+privT)/2;
    var provBarY = srcCY  - provT/2;

    var svg = d3.select(el).append('svg')
      .attr('width',W)
      .attr('height',H);

    function ribbon(x1,y1,h1,x2,y2,h2,color,a){
      var mx=(x1+x2)/2;
      svg.append('path')
        .attr('d',`M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}
                   L${x2},${y2+h2} C${mx},${y2+h2} ${mx},${y1+h1} ${x1},${y1+h1} Z`)
        .attr('fill',color).attr('fill-opacity',a||0.45);
    }

    function bar(x,y,h,c,w){
      svg.append('rect')
        .attr('x',x-(w||BW)/2)
        .attr('y',y)
        .attr('width',w||BW)
        .attr('height',h)
        .attr('fill',c);
    }

    function lbl(text,val,x,y,anchor,bold){
      svg.append('text')
        .attr('x',x)
        .attr('y',y)
        .attr('text-anchor',anchor)
        .style('font-size','9px')
        .style('font-weight',bold?'700':'400')
        .text(text);

      svg.append('text')
        .attr('x',x)
        .attr('y',y+11)
        .attr('text-anchor',anchor)
        .style('font-size','8px')
        .style('fill','#777')
        .text(val);
    }

    function fmt(n){
      return 'RM'+n.toLocaleString()+'M';
    }

    // DRAW

    colAPub.forEach(d=>{
      bar(xA,d.y,d.h,d.d.color);
      lbl(d.d.label,fmt(d.d.value),xA-10,d.y+d.h/2,'end');
    });

    colAPriv.forEach(d=>{
      bar(xA,d.y,d.h,d.d.color);
      lbl(d.d.label,fmt(d.d.value),xA-10,d.y+d.h/2,'end');
    });

    var acc=0;
    colAPub.forEach(d=>{
      ribbon(xA+4,d.y,d.h,xB-4,pubBarY+acc,d.h,d.d.color);
      acc+=px(d.d.value);
    });

    acc=0;
    colAPriv.forEach(d=>{
      ribbon(xA+4,d.y,d.h,xB-4,privBarY+acc,d.h,d.d.color);
      acc+=px(d.d.value);
    });

    bar(xB,pubBarY,pubT,C.public,MW);
    bar(xB,privBarY,privT,C.private,MW);

    lbl('PUBLIC',fmt(45580),xB+10,pubCY,'start',true);
    lbl('PRIVATE',fmt(44247),xB+10,privCY,'start',true);

    ribbon(xB+4,pubBarY,pubT,xC-4,srcBarY,pubT,C.public);
    ribbon(xB+4,privBarY,privT,xC-4,srcBarY+pubT,privT,C.private);

    bar(xC,srcBarY,pubT+privT,C.source,SW);
    lbl('SOURCE',fmt(89827),xC+10,srcCY,'start',true);

    acc=0;
    colD.forEach(d=>{
      var h=(pubT+privT)*(d.d.value/TOTAL);
      ribbon(xC+4,srcBarY+acc,h,xD-4,d.y,d.h,C.source,0.3);
      acc+=h;
    });

    colD.forEach(d=>{
      bar(xD,d.y,d.h,d.d.color);
      lbl(d.d.label,fmt(d.d.value),xD+10,d.y+d.h/2,'start');
    });

    acc=0;
    colD.forEach(d=>{
      // GREEN FLOW: from providers (xD) to functions (xE)
      // Made longer by moving xD+6 (was xD+4) and xE-6 (was xE-4) to extend the connection
      ribbon(xD+6, d.y, d.h, xE-6, provBarY+acc, d.h, d.d.color);
      acc += px(d.d.value);
    });

    bar(xE,provBarY,provT,C.provider,SW);
    lbl('PROVIDERS',fmt(89827),xE+10,srcCY,'start',true);

    acc=0;
    colF.forEach(d=>{
      var h=provT*(d.d.value/TOTAL);
      ribbon(xE+4,provBarY+acc,h,xF-4,d.y,d.h,C.func);
      acc+=h;
    });

    colF.forEach(d=>{
      bar(xF,d.y,d.h,d.d.color);
      lbl(d.d.label,fmt(d.d.value),xF+10,d.y+d.h/2,'start');
    });
  }

})();