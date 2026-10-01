/* Virtual FLIM lab: decay curve + phasor with a free/bound NADH control. Exposes window.FlimLab.draw(). */
(function(){
  var root=document.documentElement;
  var t1=0.4,t2=2.5, w=2*Math.PI*0.08; // rad/ns at 80 MHz
  var NS='http://www.w3.org/2000/svg';
  function el(n,a,p){var e=document.createElementNS(NS,n);for(var k in a)e.setAttribute(k,a[k]);if(p)p.appendChild(e);return e}
  function ph(t){var wt=w*t;return [1/(1+wt*wt), wt/(1+wt*wt)]}
  var dS=document.getElementById('decay'), pS=document.getElementById('phasor'), slider=document.getElementById('bound'), stat=document.getElementById('stat');
  var css=getComputedStyle(root);
  // decay axes
  var dx0=34,dx1=312,dy0=14,dy1=172, tmax=12.5;
  function X(t){return dx0+(t/tmax)*(dx1-dx0)} function Y(v){var l=Math.log10(Math.max(v,1e-3));return dy0+(-l/3)*(dy1-dy0)}
  var dAxes=el('g',{},dS);
  el('line',{x1:dx0,y1:dy1,x2:dx1,y2:dy1,class:'axis'},dAxes); el('line',{x1:dx0,y1:dy0,x2:dx0,y2:dy1,class:'axis'},dAxes);
  [0,2.5,5,7.5,10,12.5].forEach(function(t){el('text',{x:X(t),y:dy1+13,'text-anchor':'middle',class:'axis-t'},dAxes).textContent=t});
  [[1,'1'],[0.1,'0.1'],[0.01,'0.01'],[0.001,'10⁻³']].forEach(function(p){el('line',{x1:dx0,x2:dx1,y1:Y(p[0]),y2:Y(p[0]),class:'axis','stroke-dasharray':'2 4',opacity:.6},dAxes);el('text',{x:dx0-5,y:Y(p[0])+3,'text-anchor':'end',class:'axis-t'},dAxes).textContent=p[1]});
  var dUnit=el('text',{x:dx1,y:dy1+26,'text-anchor':'end',class:'axis-t'},dAxes);
  function curve(fn){var d='';for(var k=0;k<=160;k++){var t=k/160*tmax;d+=(k?'L':'M')+X(t).toFixed(1)+' '+Y(fn(t)).toFixed(1)}return d}
  var cFree=el('path',{d:curve(function(t){return Math.exp(-t/t1)}),fill:'none',stroke:'var(--warm)','stroke-width':1,'stroke-dasharray':'3 3',opacity:.8},dS);
  var cBound=el('path',{d:curve(function(t){return Math.exp(-t/t2)}),fill:'none',stroke:'var(--indigo)','stroke-width':1,'stroke-dasharray':'3 3',opacity:.8},dS);
  var cMix=el('path',{fill:'none',stroke:'var(--fg)','stroke-width':2},dS);
  var lf=el('text',{x:X(1.6),y:Y(0.012),class:'axis-t',fill:'var(--warm)'},dS); lf.style.fill='var(--warm)';
  var lb=el('text',{x:X(7.2),y:Y(0.03)-6,class:'axis-t'},dS); lb.style.fill='var(--indigo)';
  // phasor
  var px0=24,pscale=272,py0=176;
  function PX(g){return px0+g*pscale} function PY(s){return py0-s*pscale}
  var pA=el('g',{},pS);
  el('line',{x1:PX(0),y1:py0,x2:PX(1),y2:py0,class:'axis'},pA);
  var arc='';for(var k=0;k<=100;k++){var a=Math.PI*k/100, g=0.5+0.5*Math.cos(a), s=0.5*Math.sin(a);arc+=(k?'L':'M')+PX(g).toFixed(1)+' '+PY(s).toFixed(1)}
  el('path',{d:arc,fill:'none',stroke:'var(--muted)','stroke-width':1,opacity:.7},pA);
  [0,0.5,1].forEach(function(g){el('text',{x:PX(g),y:py0+13,'text-anchor':'middle',class:'axis-t'},pA).textContent=g});
  el('text',{x:PX(1),y:py0+24,'text-anchor':'end',class:'axis-t'},pA).textContent='G';
  el('text',{x:PX(0)-4,y:PY(0.5)+3,'text-anchor':'end',class:'axis-t'},pA).textContent='S';
  var P1=ph(t1),P2=ph(t2);
  el('line',{x1:PX(P1[0]),y1:PY(P1[1]),x2:PX(P2[0]),y2:PY(P2[1]),stroke:'var(--muted)','stroke-dasharray':'3 3'},pS);
  el('circle',{cx:PX(P1[0]),cy:PY(P1[1]),r:4,fill:'var(--warm)'},pS);
  el('circle',{cx:PX(P2[0]),cy:PY(P2[1]),r:4,fill:'var(--indigo)'},pS);
  var pl1=el('text',{x:PX(P1[0]),y:PY(P1[1])-9,'text-anchor':'end',class:'axis-t'},pS); pl1.style.fill='var(--warm)';
  var pl2=el('text',{x:PX(P2[0])-6,y:PY(P2[1])-9,'text-anchor':'middle',class:'axis-t'},pS); pl2.style.fill='var(--indigo)';
  var halo=el('circle',{r:12,fill:'var(--fg)',opacity:.12},pS);
  var dot=el('circle',{r:6,fill:'var(--fg)',stroke:'var(--bg)','stroke-width':2},pS);

  function drawLab(){
    var en=root.getAttribute('data-lang')==='en';
    var a2=slider.value/100, a1=1-a2;
    cMix.setAttribute('d',curve(function(t){return a1*Math.exp(-t/t1)+a2*Math.exp(-t/t2)}));
    var f1=a1*t1/(a1*t1+a2*t2), f2=1-f1;
    var g=f1*P1[0]+f2*P2[0], s=f1*P1[1]+f2*P2[1];
    dot.setAttribute('cx',PX(g));dot.setAttribute('cy',PY(s));halo.setAttribute('cx',PX(g));halo.setAttribute('cy',PY(s));
    var tm=a1*t1+a2*t2;
    stat.textContent='α₂ '+Math.round(a2*100)+'% · τm '+tm.toFixed(2)+' ns';
    dUnit.textContent = en?'time (ns)':'tempo (ns)';
    lf.textContent = en?'free · 0.4 ns':'livre · 0.4 ns';
    lb.textContent = en?'bound · 2.5 ns':'ligado · 2.5 ns';
    pl1.textContent = en?'free':'livre'; pl2.textContent = en?'bound':'ligado';
  }
  slider.addEventListener('input',drawLab);
  window.FlimLab={draw:drawLab};
  drawLab();
})();
