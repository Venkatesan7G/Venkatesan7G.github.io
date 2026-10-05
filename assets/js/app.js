/* app.js: page behaviour only (canvas loop, pause, theme, reference tooltips, copy email). No content here. */
(function(){
  var reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  readTheme();
  var list=[],H=132;
  document.querySelectorAll('canvas[data-scene]').forEach(function(cv){
    var fn=SCENES[cv.getAttribute('data-scene')];if(!fn)return;
    var S={cv:cv,ctx:cv.getContext('2d'),W:0,gy:H-16,run:fn(),vis:false,dpr:1};
    function size(){var w=Math.round(cv.clientWidth)||600,d=window.devicePixelRatio||1;S.W=w;S.dpr=d;cv.width=Math.round(w*d);cv.height=Math.round(H*d);S.ctx.setTransform(d,0,0,d,0,0)}
    size();if(window.ResizeObserver)new ResizeObserver(size).observe(cv);
    list.push(S);
  });
  function frame(S,t,dt){S.ctx.clearRect(0,0,S.W,H);S.run(S,t,dt)}
  var pauseBtn=document.getElementById('pause');
  if(reduce){list.forEach(function(S){frame(S,2.4,.016)});if(pauseBtn)pauseBtn.hidden=true}
  else{
    if('IntersectionObserver' in window){
      var io=new IntersectionObserver(function(es){es.forEach(function(e){list.forEach(function(S){if(S.cv===e.target)S.vis=e.isIntersecting})})},{rootMargin:'60px'});
      list.forEach(function(S){io.observe(S.cv)});
    }else list.forEach(function(S){S.vis=true});
    var T=0,last=performance.now(),paused=false;
    if(pauseBtn)pauseBtn.addEventListener('click',function(){paused=!paused;this.textContent=paused?'Play motion':'Pause motion'});
    (function loop(now){
      var dt=Math.min((now-last)/1000,.05);last=now;
      if(!paused&&!document.hidden){T+=dt;list.forEach(function(S){if(S.vis)frame(S,T,dt)})}
      requestAnimationFrame(loop);
    })(last);
  }
  /* theme (remembered in this browser; works without storage too) */
  var themeBtn=document.getElementById('theme');
  if(themeBtn)themeBtn.addEventListener('click',function(){
    var r=document.documentElement,dark=r.getAttribute('data-theme')==='dark'||(!r.getAttribute('data-theme')&&matchMedia('(prefers-color-scheme: dark)').matches);
    var next=dark?'light':'dark';r.setAttribute('data-theme',next);
    try{localStorage.setItem('theme',next)}catch(e){}
    readTheme();if(reduce)list.forEach(function(S){frame(S,2.4,.016)});
  });
  if(window.matchMedia)matchMedia('(prefers-color-scheme: dark)').addEventListener('change',function(){setTimeout(readTheme,50)});
  /* reference tooltips: hover or focus (CSS), tap to open, keep on screen */
  var cites=[].slice.call(document.querySelectorAll('.cite'));
  function place(ci){
    var tip=ci.querySelector('.tip');tip.style.left='0px';
    var r=tip.getBoundingClientRect(),vw=document.documentElement.clientWidth;
    if(r.right>vw-10)tip.style.left=(vw-10-r.right)+'px';
    if(r.left<10)tip.style.left=(10-r.left)+'px';
  }
  cites.forEach(function(ci){
    ci.addEventListener('mouseenter',function(){place(ci)});
    ci.querySelector('button').addEventListener('focus',function(){place(ci)});
    ci.querySelector('button').addEventListener('click',function(e){e.stopPropagation();var o=ci.classList.contains('open');cites.forEach(function(x){x.classList.remove('open')});if(!o){ci.classList.add('open');place(ci)}});
  });
  document.addEventListener('click',function(e){if(!e.target.closest('.cite'))cites.forEach(function(x){x.classList.remove('open')})});
  document.addEventListener('keydown',function(e){if(e.key==='Escape')cites.forEach(function(x){x.classList.remove('open')})});
  /* copy email */
  var copyBtn=document.getElementById('copy');
  if(copyBtn)copyBtn.addEventListener('click',function(){
    var t=document.getElementById('mail').textContent,out=document.getElementById('copied');
    function done(m){out.textContent=m;setTimeout(function(){out.textContent=''},2500)}
    try{navigator.clipboard.writeText(t).then(function(){done('Copied')},function(){done('Select the address and copy')})}catch(e){done('Select the address and copy')}
  });
})();
