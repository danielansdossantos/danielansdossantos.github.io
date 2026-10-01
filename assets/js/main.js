(function(){
  var NS='http://www.w3.org/2000/svg';
  function el(n,a,p){var e=document.createElementNS(NS,n);for(var k in a)e.setAttribute(k,a[k]);if(p)p.appendChild(e);return e}
  var root=document.documentElement;

  /* ---------- language (English is the default) ---------- */
  function setLang(l){
    root.setAttribute('data-lang',l);
    document.getElementById('lang-pt').setAttribute('aria-pressed',l==='pt');
    document.getElementById('lang-en').setAttribute('aria-pressed',l==='en');
    root.lang = l==='en' ? 'en' : 'pt-PT';
    try{localStorage.setItem('ds-lang2',l)}catch(e){}
    document.querySelectorAll('[data-alt-en]').forEach(function(i){i.alt=i.getAttribute(l==='pt'?'data-alt-pt':'data-alt-en')||''});
    document.querySelectorAll('[data-label-en]').forEach(function(i){i.setAttribute('aria-label',i.getAttribute(l==='pt'?'data-label-pt':'data-label-en'))});
    if(window.FlimLab)FlimLab.draw(); svgLang(); drawWave();
  }
  var saved='en'; try{saved=localStorage.getItem('ds-lang2')||'en'}catch(e){}
  document.getElementById('lang-pt').onclick=function(){setLang('pt')};
  document.getElementById('lang-en').onclick=function(){setLang('en')};

  /* ---------- publication filter ---------- */
  var fbtns=document.querySelectorAll('.pubbar button');
  fbtns.forEach(function(b){b.addEventListener('click',function(){
    fbtns.forEach(function(x){x.setAttribute('aria-pressed',x===b)});
    var f=b.dataset.f;
    document.querySelectorAll('#pubs li').forEach(function(li){li.hidden = !(f==='all'||li.dataset.k===f)});
  })});

  /* ---------- data-driven lists (data/*.json) ---------- */
  function esc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
  function bi(o){return '<span class="pt">'+esc(o.pt)+'</span><span class="en">'+esc(o.en)+'</span>'}
  function getJSON(u){return fetch(u).then(function(r){if(!r.ok)throw new Error(u+' '+r.status);return r.json()})}

  getJSON('data/publicacoes.json').then(function(list){
    document.getElementById('pubs').innerHTML=list.map(function(p){
      var au=esc(p.authors).replace(/\[\[(.*?)\]\]/g,'<span class="me">$1</span>');
      return '<li data-k="'+(p.type==='article'?'j':'c')+'"><span class="yr">'+p.year+'</span><div><span class="t">'+esc(p.title)+(p.first?'<span class="first">1st</span>':'')+'</span>'+
        '<span class="a">'+au+'</span><span class="v">'+esc(p.venue)+'</span>'+
        (p.doi?'<a class="doi" href="https://doi.org/'+esc(p.doi)+'" target="_blank" rel="noopener">doi:'+esc(p.doi)+'</a>':'')+'</div></li>';
    }).join('');
  }).catch(function(e){console.warn('publications not loaded',e)});

  /* videos: light embeds (thumbnail first, iframe only after the click) */
  function videoThumb(v){
    var dur=v.duration?'<span class="dur">'+esc(v.duration)+'</span>':'';
    var kind=v.series?'<span class="kind">'+bi(v.series)+'</span>':(v.kind==='audio'?'<span class="kind">podcast</span>':'');
    var play='<span class="play'+(v.kind==='audio'?' audio':'')+'" aria-hidden="true"></span>';
    var img=v.youtubeId?'<img src="https://i.ytimg.com/vi/'+esc(v.youtubeId)+'/hqdefault.jpg" alt="" loading="lazy" width="480" height="360">':'';
    if(v.youtubeId)return '<button type="button" class="vthumb" data-yt="'+esc(v.youtubeId)+'" data-start="'+(+v.start||0)+'" data-label-en="Play video: '+esc(v.title.en)+'" data-label-pt="Reproduzir vídeo: '+esc(v.title.pt)+'">'+img+kind+play+dur+'</button>';
    return '<a class="vthumb" href="'+esc(v.url)+'" target="_blank" rel="noopener" data-label-en="Open: '+esc(v.title.en)+'" data-label-pt="Abrir: '+esc(v.title.pt)+'">'+kind+play+dur+'</a>';
  }
  getJSON('data/videos.json').then(function(d){
    var items=d.items.filter(function(v){return v.youtubeId||v.url});
    if(!items.length)return;
    function text(v){return '<b>'+bi(v.title)+'</b><small>'+bi(v.description)+'</small>'}
    var first=items[0], rest=items.slice(1);
    var h='<div class="vcard">'+videoThumb(first)+text(first)+'</div>';
    if(rest.length)h+='<div class="vside">'+rest.map(function(v){return '<div class="vcard">'+videoThumb(v)+'<div>'+text(v)+'</div></div>'}).join('')+'</div>';
    var box=document.getElementById('videos'); box.innerHTML=h;
    document.getElementById('videos-block').hidden=false; document.getElementById('media').hidden=false;
    box.addEventListener('click',function(e){
      var b=e.target.closest('button[data-yt]'); if(!b)return;
      var f=document.createElement('iframe');
      f.src='https://www.youtube-nocookie.com/embed/'+b.dataset.yt+'?autoplay=1&rel=0'+(b.dataset.start>0?'&start='+b.dataset.start:'');
      f.allow='accelerometer; autoplay; encrypted-media; picture-in-picture; fullscreen'; f.allowFullscreen=true;
      f.title=b.getAttribute('aria-label')||'Video';
      var d=document.createElement('div'); d.className='vthumb'; d.appendChild(f); b.replaceWith(d); f.focus();
    });
    if(window.FlimLab)setLang(root.getAttribute('data-lang')||'en'); // refresh aria-labels
  }).catch(function(e){console.warn('videos not loaded',e)});

  /* gallery + accessible lightbox */
  var gal=[], lb=document.getElementById('lightbox'), lbi=document.getElementById('lb-img'), lbcap=document.getElementById('lb-cap'), cur=0, opener=null;
  function show(i){
    cur=(i+gal.length)%gal.length; var g=gal[cur];
    lbi.src='assets/img/'+g.file; lbi.setAttribute('data-alt-en',g.alt.en||g.caption.en); lbi.setAttribute('data-alt-pt',g.alt.pt||g.caption.pt);
    lbi.alt=lbi.getAttribute(root.getAttribute('data-lang')==='pt'?'data-alt-pt':'data-alt-en');
    lbcap.innerHTML=bi(g.caption);
  }
  function openLb(i,btn){opener=btn;show(i);lb.hidden=false;document.getElementById('lb-close').focus();document.body.style.overflow='hidden'}
  function closeLb(){lb.hidden=true;document.body.style.overflow='';if(opener)opener.focus()}
  document.getElementById('lb-close').onclick=closeLb;
  document.getElementById('lb-prev').onclick=function(){show(cur-1)};
  document.getElementById('lb-next').onclick=function(){show(cur+1)};
  lb.addEventListener('click',function(e){if(e.target===lb)closeLb()});
  document.addEventListener('keydown',function(e){
    if(lb.hidden)return;
    if(e.key==='Escape')closeLb();
    else if(e.key==='ArrowLeft')show(cur-1);
    else if(e.key==='ArrowRight')show(cur+1);
    else if(e.key==='Tab'){ // keep focus inside the dialog
      var f=lb.querySelectorAll('button'), a=f[0], z=f[f.length-1];
      if(e.shiftKey&&document.activeElement===a){e.preventDefault();z.focus()}
      else if(!e.shiftKey&&document.activeElement===z){e.preventDefault();a.focus()}
    }
  });
  getJSON('data/galeria.json').then(function(d){
    gal=d.items.filter(function(g){return g.file});
    if(!gal.length)return;
    var box=document.getElementById('gallery');
    box.innerHTML=gal.map(function(g,i){
      return '<button type="button" class="gitem" data-i="'+i+'"><img src="assets/img/'+esc(g.file)+'" loading="lazy" alt="" data-alt-en="'+esc(g.alt.en||g.caption.en)+'" data-alt-pt="'+esc(g.alt.pt||g.caption.pt)+'">'+
        '<span><i>'+esc(g.technique)+'</i>'+bi(g.title)+'</span></button>';
    }).join('');
    box.addEventListener('click',function(e){var b=e.target.closest('.gitem');if(b)openLb(+b.dataset.i,b)});
    document.getElementById('gallery-block').hidden=false; document.getElementById('media').hidden=false;
    setLang(root.getAttribute('data-lang')||'en'); // refresh alt texts
  }).catch(function(e){console.warn('gallery not loaded',e)});

  /* ---------- metabolism stages ---------- */
  var mt=document.getElementById('metab'), mbtn=document.querySelectorAll('.mtabs button');
  mbtn.forEach(function(b){b.addEventListener('click',function(){
    var st=b.dataset.s; mbtn.forEach(function(x){x.setAttribute('aria-pressed',x===b)});
    if(st==='all') mt.removeAttribute('data-stage'); else mt.setAttribute('data-stage',st);
    document.querySelectorAll('#mtext > [data-s]').forEach(function(d){d.hidden = d.dataset.s!==st});
  })});
  function svgLang(){var en=root.getAttribute('data-lang')==='en';document.querySelectorAll('svg [data-pt]').forEach(function(t){t.textContent=t.getAttribute(en?'data-en':'data-pt')})}

  /* ---------- light: helpers ---------- */
  function wl2rgb(l){var r=0,g=0,b=0;
    if(l>=380&&l<440){r=-(l-440)/60;b=1}else if(l<490){g=(l-440)/50;b=1}else if(l<510){g=1;b=-(l-510)/20}
    else if(l<580){r=(l-510)/70;g=1}else if(l<645){r=1;g=-(l-645)/65}else if(l<=750){r=1}
    var f=l<380||l>750?0:(l<420?.3+.7*(l-380)/40:(l>700?.3+.7*(750-l)/50:1));
    function c(v){return Math.round(255*Math.pow(v*f,.8))}
    return 'rgb('+c(r)+','+c(g)+','+c(b)+')'}
  /* prism */
  (function(){var sv=document.getElementById('prism');if(!sv)return;
    var A=[150,30],B=[95,160],C=[205,160];
    el('line',{x1:10,y1:118,x2:128,y2:88,class:'beam'},sv);
    var wl=el('text',{x:12,y:108},sv);wl.setAttribute('data-pt','luz branca');wl.setAttribute('data-en','white light');wl.textContent='white light';
    el('polygon',{points:A+' '+B+' '+C,class:'glass'},sv);
    var src=[178,98];
    for(var l=400;l<=700;l+=4){var t=(l-400)/300, y=150-t*95;
      el('line',{x1:src[0],y1:src[1],x2:292,y2:y+ (1-t)*20,stroke:wl2rgb(l),'stroke-width':3.2,'stroke-opacity':.9},sv)}
    [[700,'700 nm'],[550,'550'],[400,'400 nm']].forEach(function(p){var t=(p[0]-400)/300;el('text',{x:298,y:150-t*95+(1-t)*20+4},sv).textContent=p[1]});
    el('line',{x1:128,y1:88,x2:src[0],y2:src[1],stroke:'var(--fg)','stroke-width':2,'stroke-opacity':.5},sv);
  })();
  /* wavelength explorer */
  var wsv=document.getElementById('wave'),lam=document.getElementById('lambda');
  var wpath=el('path',{fill:'none','stroke-width':3,'stroke-linecap':'round'},wsv);
  el('line',{x1:0,x2:340,y1:55,y2:55,class:'axis','stroke-dasharray':'2 4'},wsv);
  var bracket=el('path',{fill:'none',stroke:'var(--muted)','stroke-width':1},wsv);
  var btxt=el('text',{class:'axis-t','text-anchor':'middle'},wsv);
  function drawWave(){
    var en=root.getAttribute('data-lang')!=='pt', l=+lam.value, px=l/9, d='';
    for(var x=0;x<=340;x+=2){d+=(x?'L':'M')+x+' '+(55-36*Math.sin(2*Math.PI*x/px)).toFixed(1)}
    var col=(l<380||l>750)?'var(--muted)':wl2rgb(l);
    wpath.setAttribute('d',d);wpath.setAttribute('stroke',col);
    var x0=px/4, x1=x0+px; bracket.setAttribute('d','M'+x0+' 100 L'+x0+' 94 L'+x1+' 94 L'+x1+' 100'); bracket.setAttribute('transform','translate(0,-2)');
    btxt.setAttribute('x',(x0+x1)/2);btxt.setAttribute('y',108);btxt.textContent='λ';
    document.getElementById('r-l').textContent=l+' nm';
    document.getElementById('r-e').textContent=(1239.84/l).toFixed(2)+' eV';
    document.getElementById('r-f').textContent=Math.round(299792.458/l)+' THz';
    var z=l<380?(en?'ultraviolet · invisible':'ultravioleta · invisível'):l>750?(en?'infrared · invisible':'infravermelho · invisível'):
      l<450?(en?'violet':'violeta'):l<495?(en?'blue':'azul'):l<570?(en?'green':'verde'):l<590?(en?'yellow':'amarelo'):l<620?(en?'orange':'laranja'):(en?'red':'vermelho');
    var zn=document.getElementById('zone'); zn.textContent=z; zn.style.color=(l<380||l>750)?'':col;
  }
  lam.addEventListener('input',drawWave);
  /* EM spectrum */
  (function(){var sv=document.getElementById('emspec');if(!sv)return;
    var x0=20,x1=880,lo=-13,hi=3; function X(m){return x0+(Math.log10(m)-lo)/(hi-lo)*(x1-x0)}
    var y=40,h=34;
    var bands=[[1e-13,1e-11,'Gama','Gamma'],[1e-11,1e-8,'Raios X','X-rays'],[1e-8,380e-9,'UV','UV'],[380e-9,750e-9,'',''],[750e-9,1e-3,'Infravermelho','Infrared'],[1e-3,1,'Micro-ondas','Microwaves'],[1,1e3,'Rádio','Radio']];
    bands.forEach(function(b,i){var a=X(b[0]),c=X(b[1]);
      el('rect',{x:a,y:y,width:c-a,height:h,fill:i%2?'var(--surface-2)':'color-mix(in srgb,var(--surface-2) 55%,var(--bg))',stroke:'var(--line)'},sv);
      if(b[2]){var t=el('text',{x:(a+c)/2,y:y+h/2+4,'text-anchor':'middle',class:'rl'},sv);t.setAttribute('data-pt',b[2]);t.setAttribute('data-en',b[3]);t.textContent=b[3]}});
    var va=X(380e-9),vc=X(750e-9);
    var gid='visg'; var d=el('defs',{},sv),g=el('linearGradient',{id:gid,x1:0,x2:1,y1:0,y2:0},d);
    for(var l=380;l<=750;l+=10) el('stop',{offset:(l-380)/370,'stop-color':wl2rgb(l)},g);
    el('rect',{x:va,y:y,width:Math.max(vc-va,2),height:h,fill:'url(#'+gid+')'},sv);
    // zoom
    var zx0=300,zx1=600,zy=118;
    el('path',{d:'M'+va+' '+(y+h)+' L'+zx0+' '+zy+' M'+vc+' '+(y+h)+' L'+zx1+' '+zy,stroke:'var(--muted)','stroke-dasharray':'3 3',fill:'none'},sv);
    el('rect',{x:zx0,y:zy,width:zx1-zx0,height:20,rx:3,fill:'url(#'+gid+')'},sv);
    var vt=el('text',{x:(zx0+zx1)/2,y:zy+36,'text-anchor':'middle',class:'vis'},sv);vt.setAttribute('data-pt','visível · 380–750 nm');vt.setAttribute('data-en','visible · 380–750 nm');vt.textContent=vt.getAttribute('data-en');
    [[380,'380'],[500,'500'],[600,'600'],[750,'750 nm']].forEach(function(p){el('text',{x:zx0+(p[0]-380)/370*(zx1-zx0),y:zy-4,'text-anchor':'middle'},sv).textContent=p[1]});
    [[1e-12,'1 pm'],[1e-9,'1 nm'],[1e-6,'1 µm'],[1e-3,'1 mm'],[1,'1 m'],[1e3,'1 km']].forEach(function(p){var x=X(p[0]);el('line',{x1:x,x2:x,y1:y-6,y2:y,class:'axis'},sv);el('text',{x:x,y:y-10,'text-anchor':'middle'},sv).textContent=p[1]});
    var e1=el('text',{x:x0,y:178},sv);e1.setAttribute('data-pt','← mais energia');e1.setAttribute('data-en','← more energy');e1.textContent=e1.getAttribute('data-en');
    var e2=el('text',{x:x1,y:178,'text-anchor':'end'},sv);e2.setAttribute('data-pt','menos energia →');e2.setAttribute('data-en','less energy →');e2.textContent=e2.getAttribute('data-en');
  })();
  /* biophoton emission */
  (function(){var sv=document.getElementById('bioem');if(!sv)return;
    var x0=40,x1=620,y0=18,y1=150,l0=350,l1=650; function X(l){return x0+(l-l0)/(l1-l0)*(x1-x0)}
    var d=el('defs',{},sv),g=el('linearGradient',{id:'bvis',x1:0,x2:1,y1:0,y2:0},d);
    for(var l=l0;l<=l1;l+=10) el('stop',{offset:(l-l0)/(l1-l0),'stop-color':l<380?'#3A2A66':wl2rgb(l)},g);
    el('rect',{x:x0,y:y1+6,width:x1-x0,height:7,rx:2,fill:'url(#bvis)'},sv);
    el('line',{x1:x0,x2:x1,y1:y1,y2:y1,class:'axis'},sv);
    [350,400,450,500,550,600,650].forEach(function(l){el('text',{x:X(l),y:y1+28,'text-anchor':'middle'},sv).textContent=l});
    el('text',{x:x1,y:y1+42,'text-anchor':'end'},sv).textContent='λ (nm)';
    [[400,28,'var(--col)','colagénio','collagen'],[460,34,'var(--warm)','NADH','NADH'],[530,36,'var(--flavin)','FAD','FAD']].forEach(function(b){
      var p='M'+X(l0)+' '+y1;for(var l=l0;l<=l1;l+=3){p+='L'+X(l).toFixed(1)+' '+(y1-Math.exp(-Math.pow((l-b[0])/b[1],2)/2)*(y1-y0)).toFixed(1)}p+='L'+X(l1)+' '+y1+'Z';
      el('path',{d:p,fill:b[2],'fill-opacity':.16,stroke:b[2],'stroke-width':2},sv);
      var t=el('text',{x:X(b[0]),y:y0-4,'text-anchor':'middle',class:'bl'},sv);t.style.fill=b[2];t.setAttribute('data-pt',b[3]);t.setAttribute('data-en',b[4]);t.textContent=b[4];
    });
  })();
  setLang(saved==='pt'?'pt':'en');
})();
