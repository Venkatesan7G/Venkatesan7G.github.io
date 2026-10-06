/* app.js: page behaviour only (canvas loop, pause, theme, reference tooltips, copy email). No content here. */
(function(){
  var mq=window.matchMedia?matchMedia('(prefers-reduced-motion: reduce)'):null;
  var still=2.4;                       /* time used for the calm still frame */
  var playing=!(mq&&mq.matches);       /* play by default, unless the device asks for reduced motion */
  readTheme();
  var list=[],H=132,T=playing?0:still;
  var pauseBtn=document.getElementById('pause'),themeBtn=document.getElementById('theme');
  function label(){if(pauseBtn){pauseBtn.textContent=playing?'Pause motion':'Play motion';pauseBtn.setAttribute('aria-pressed',playing?'false':'true')}}
  function frame(S,t,dt){S.ctx.clearRect(0,0,S.W,H);S.run(S,t,dt)}
  /* run the scene silently up to the still time, so the dog and props are already where they should be */
  function warm(S){for(var tt=0;tt<still;tt+=1/30)frame(S,tt,1/30);S.warm=true}
  document.querySelectorAll('canvas[data-scene]').forEach(function(cv){
    var fn=SCENES[cv.getAttribute('data-scene')];if(!fn)return;
    var S={cv:cv,ctx:cv.getContext('2d'),W:0,gy:H-16,run:fn(),vis:false,dirty:true,warm:false};
    function size(){var w=Math.round(cv.clientWidth)||600,d=window.devicePixelRatio||1;S.W=w;cv.width=Math.round(w*d);cv.height=Math.round(H*d);S.ctx.setTransform(d,0,0,d,0,0);S.dirty=true}
    size();if(window.ResizeObserver)new ResizeObserver(size).observe(cv);
    list.push(S);
  });
  if('IntersectionObserver' in window){
    var io=new IntersectionObserver(function(es){es.forEach(function(e){list.forEach(function(S){if(S.cv===e.target)S.vis=e.isIntersecting})})},{rootMargin:'60px'});
    list.forEach(function(S){io.observe(S.cv)});
  }else list.forEach(function(S){S.vis=true});
  label();
  var last=performance.now();
  (function loop(now){
    var dt=Math.min((now-last)/1000,.05);last=now;
    if(playing){
      if(!document.hidden){T+=dt;list.forEach(function(S){if(S.vis){frame(S,T,dt);S.dirty=false}})}
    }else{
      /* not playing: keep a drawn frame on screen, redraw it after any resize or theme change */
      list.forEach(function(S){if(S.dirty){if(!S.warm&&T===still)warm(S);frame(S,T,0);S.dirty=false}});
    }
    requestAnimationFrame(loop);
  })(last);
  if(pauseBtn)pauseBtn.addEventListener('click',function(){playing=!playing;list.forEach(function(S){S.dirty=true});label()});
  if(mq){var onMq=function(){playing=!mq.matches;list.forEach(function(S){S.dirty=true});label()};
    if(mq.addEventListener)mq.addEventListener('change',onMq);else if(mq.addListener)mq.addListener(onMq)}
  /* theme (remembered in this browser; works without storage too) */
  if(themeBtn)themeBtn.addEventListener('click',function(){
    var r=document.documentElement,dark=r.getAttribute('data-theme')==='dark'||(!r.getAttribute('data-theme')&&matchMedia('(prefers-color-scheme: dark)').matches);
    var next=dark?'light':'dark';r.setAttribute('data-theme',next);
    try{localStorage.setItem('theme',next)}catch(e){}
    readTheme();list.forEach(function(S){S.dirty=true});
  });
  if(window.matchMedia)matchMedia('(prefers-color-scheme: dark)').addEventListener('change',function(){setTimeout(function(){readTheme();list.forEach(function(S){S.dirty=true})},50)});
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
