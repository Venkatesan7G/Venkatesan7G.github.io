/* =====================================================================
   scenes.js  -  the six animated figures (hero, edu, exp, uav, skills, contact)
   ---------------------------------------------------------------------
   AI-EDIT NOTES (paste this block into Claude/AI when asking for a new or changed scene)
   - Each scene is  SCENES.<name> = function(){ var state...; return function(S,t,dt){ ...draw one frame... } };
     S.ctx = canvas 2D context, S.W = canvas width in CSS px (changes with the window), S.gy = ground line y,
     canvas height is always 132, t = seconds since load, dt = seconds since last frame.
   - Draw only with the helpers below so the art stays in the same pixel style and follows light/dark theme:
       R(ctx,x,y,w,h,colour)  filled rectangle   TX(ctx,text,x,y,colour,size)  mono text (keep it short, 10 to 12 px)
       ground(S) cloud(S,x,y,scale) sun(S,x,y,t) tree(S,x) ball(ctx,x,y)
       draw(...) / pt(...) from sprites.js   Pal(x) + chase(pal,targetX,dt,gap,faceDir) + drawPal(S,pal,t,opts) = the dog that stays with the boy
       pw(time,[[t0,v0],[t1,v1],...]) smooth keyframe curve   vel(keys,t) its speed   sm(u) smoothstep   clamp(v,a,b)
   - Colours: use TH.ink TH.muted TH.rule TH.accent TH.warn TH.soft TH.board TH.sun TH.leaf TH.wood TH.line TH.ball only.
     Never hard-code hex, otherwise dark mode breaks.
   - Rules: the dog is ALWAYS in the scene with the boy. Loop length 8 to 12 s. No flashing faster than 3 times a second.
     Keep text inside the canvas. Do not draw anything outside 0..W and 0..132.
   - A new scene needs 3 steps: (1) add SCENES.myname = ... here, (2) add an entry in data/figures.json with "scene":"myname",
     (3) put {{fig:key}} where it should appear in src/template.html. Then run: node build.mjs
   - Background tweak = edit the first lines of that scene (sun, cloud, tree, ground, racks...). Speed tweak = edit the loop length
     (T, or the number after t% ) and the keyframe times.
   ===================================================================== */
/* ---------- helpers ---------- */
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function sm(u){u=clamp(u,0,1);return u*u*(3-2*u)}
function pw(t,k){
  if(t<=k[0][0])return k[0][1];
  for(var i=1;i<k.length;i++){if(t<=k[i][0]){var a=k[i-1],b=k[i],u=sm((t-a[0])/(b[0]-a[0]));return a[1]+(b[1]-a[1])*u}}
  return k[k.length-1][1];
}
function vel(k,c){return (pw(c+.02,k)-pw(c-.02,k))/.04}
function R(ctx,x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h))}
function TX(ctx,s,x,y,c,sz){ctx.fillStyle=c;ctx.font=(sz||11)+'px "JetBrains Mono",ui-monospace,monospace';ctx.fillText(s,Math.round(x),Math.round(y))}
function ground(S){R(S.ctx,0,S.gy,S.W,2,TH.rule);for(var x=6;x<S.W;x+=18)R(S.ctx,x,S.gy+5,6,2,TH.rule)}
function cloud(S,x,y,sc){var c=S.ctx,s=sc||1;R(c,x,y+6*s,34*s,8*s,TH.soft);R(c,x+6*s,y,14*s,10*s,TH.soft);R(c,x+16*s,y+3*s,12*s,9*s,TH.soft)}
function sun(S,x,y,t){
  var c=S.ctx;R(c,x-8,y-12,16,24,TH.sun);R(c,x-12,y-8,24,16,TH.sun);R(c,x-10,y-10,20,20,TH.sun);
  var on=Math.floor(t*2)%2;for(var i=0;i<8;i++){var a=i*Math.PI/4+(on?.2:0);R(c,x+Math.cos(a)*19-1,y+Math.sin(a)*19-1,3,3,TH.sun)}
}
function tree(S,x){var c=S.ctx,gy=S.gy;R(c,x-3,gy-24,6,24,TH.wood);R(c,x-14,gy-58,28,34,TH.leaf);R(c,x-18,gy-50,36,18,TH.leaf);R(c,x-8,gy-64,16,8,TH.leaf)}
function ball(c,x,y){R(c,x-3,y-3,6,6,TH.line);R(c,x-2,y-2,4,4,TH.ball)}

/* Dog that stays with the boy */
function Pal(x0){return {x:x0,v:0,dir:1,ph:0,idle:0}}
function chase(d,target,dt,gap,face){
  var dx=target-d.x,dist=Math.abs(dx),want=0;
  if(dist>gap)want=Math.sign(dx)*clamp((dist-gap)*3+50,0,300);
  d.v+=(want-d.v)*Math.min(1,dt*7);d.x+=d.v*dt;
  if(Math.abs(d.v)>25)d.dir=Math.sign(d.v);else if(face)d.dir=face;
  d.ph+=Math.abs(d.v)*dt/28;
  d.idle=Math.abs(d.v)<25?d.idle+dt:0;
}
function drawPal(S,d,t,opts){
  opts=opts||{};
  var moving=Math.abs(d.v)>40,o;
  if(moving)o={pose:'run',f:Math.floor(d.ph)%4,tail:Math.floor(t*10)%4,mouth:1,ear:Math.floor(d.ph)%2};
  else if(opts.lie)o={pose:'lie',tail:Math.floor(t*4)%2,sleep:opts.sleep?1:0};
  else if(d.idle>1.4||opts.sit)o={pose:'sit',tail:Math.floor(t*5)%2,mouth:(Math.floor(t*.7)%4===0)?1:0};
  else o={pose:'stand',tail:Math.floor(t*6)%4};
  if(opts.hop)return draw(S.ctx,'dog',o,d.x,S.gy,d.dir,opts.hop);
  return draw(S.ctx,'dog',o,d.x,S.gy,d.dir,0);
}
function boyWalkO(v,ph,t,extra){
  var mv=Math.abs(v)>25,o={f:mv?Math.floor(ph)%4:0,bob:mv?(Math.floor(ph)%2?0:-1):0};
  for(var k in extra)o[k]=extra[k];
  return o;
}

/* ---------- scenes ---------- */
var SCENES={};

/* 1 hero: fetch */
SCENES.hero=function(){
  var gait=0,dir=1,T=9.5,bph=0;
  return function(S,t,dt){
    var c=S.ctx,W=S.W,gy=S.gy,cc=t%T;
    sun(S,W-46,26,t);cloud(S,(t*6)%(W+80)-60,16,1);cloud(S,(t*3.5+W*.5)%(W+80)-60,40,.8);tree(S,W-26);ground(S);
    var BX=Math.round(W*.13);
    var DX=[[0,.25],[1.3,.25],[2.95,.80],[3.5,.80],[5.3,.205],[5.9,.205],[6.7,.24],[9.5,.24]].map(function(k){return [k[0],k[1]*W]});
    var AR=[[0,-35],[.4,-35],[1,150],[1.3,-100],[1.8,-70],[2.4,5],[5.2,5],[5.5,-40],[6.2,-40],[6.8,-75],[7.3,-35],[9.5,-35]];
    var x=pw(cc,DX),v=vel(DX,cc);if(Math.abs(v)>25)dir=v>0?1:-1;
    gait+=Math.abs(v)*dt/28;
    var a=pw(cc,AR);
    var bs=draw(c,'boy',{f:0,bob:0,ab:a,af:0},BX,gy,1,0);
    var hand=pt('boy',BX,gy,1,bs.tip[0],bs.tip[1]);
    var moving=Math.abs(v)>40,mouthOpen=cc<3.2||cc>5.6;
    var o=moving?{pose:'run',f:Math.floor(gait)%4,tail:Math.floor(t*10)%4,mouth:mouthOpen?1:0,ear:Math.floor(gait)%2,down:(cc>2.9&&cc<3.45)?1:0}
              :{pose:(cc>5.9||cc<1.3)?'sit':'stand',tail:Math.floor(t*6)%4,mouth:0,down:(cc>2.9&&cc<3.45)?1:0};
    if(!moving&&cc>=2.9&&cc<=3.5)o={pose:'stand',tail:2,mouth:1,down:1};
    draw(c,'dog',o,x,gy,dir,0);
    var m=pt('dog',x,gy,dir,26,(o.down?8:4)+((o.pose==='run'&&(Math.floor(gait)%4===2))?-1:0),0);
    var rel=[BX+22,gy-42],bx,by;
    if(cc<1.3){bx=hand[0];by=hand[1]}
    else if(cc<2.8){var u=(cc-1.3)/1.5,tx=W*.8+28;bx=rel[0]+(tx-rel[0])*u;by=rel[1]+(gy-4-rel[1])*u-70*4*u*(1-u)}
    else if(cc<3.3){bx=W*.8+28;by=gy-4}
    else if(cc<5.5){bx=m[0];by=m[1]}
    else if(cc<5.85){var d=sm((cc-5.5)/.35);bx=m[0];by=m[1]+(gy-4-m[1])*d}
    else if(cc<6.8){bx=pw(5.6,[[0,0],[5.6,W*.205-28],[9.5,W*.205-28]]);by=gy-4}
    else if(cc<7.4){var u2=(cc-6.8)/.6,sx=W*.205-28;bx=sx+(hand[0]-sx)*u2;by=gy-4+(hand[1]-gy+4)*u2-18*4*u2*(1-u2)}
    else{bx=hand[0];by=hand[1]}
    ball(c,bx,by);
  };
};

/* 2 education: lecture board, dog asleep beside him */
SCENES.edu=function(){
  var pal=Pal(0),inited=false;
  return function(S,t,dt){
    var c=S.ctx,W=S.W,gy=S.gy;ground(S);
    var bx0=Math.round(W*.50),bw=W-bx0-8,by0=8,bh=gy-by0-16;
    R(c,bx0,by0,bw,bh,TH.line);R(c,bx0+3,by0+3,bw-6,bh-6,TH.board);
    TX(c,'mixture',bx0+10,by0+16,TH.muted,10);TX(c,'source 1',bx0+bw*.55,by0+16,TH.muted,10);TX(c,'source 2',bx0+bw*.55,by0+bh*.52,TH.muted,10);
    var ph=t*1.4,pw1=bw*.42,x0=bx0+10;
    for(var i=0;i<pw1;i+=2){
      var u=i/pw1,s1=Math.sin(u*12+ph),s2=Math.sin(u*30-ph*1.7);
      R(c,x0+i,by0+bh*.52-(.65*s1+.4*s2)*bh*.22,2,2,TH.ink);
    }
    var ax=bx0+bw*.46;R(c,ax,by0+bh*.5,12,2,TH.ink);R(c,ax+8,by0+bh*.5-3,2,8,TH.ink);
    var x1=bx0+bw*.55,w1=bw*.4;
    for(var j=0;j<w1;j+=2){var uu=j/w1;R(c,x1+j,by0+bh*.34-Math.sin(uu*12+ph)*bh*.12,2,2,TH.accent);R(c,x1+j,by0+bh*.78-Math.sin(uu*30-ph*1.7)*bh*.12,2,2,TH.warn)}
    var BX=Math.round(W*.36);
    if(!inited){pal.x=BX-66;inited=true}
    chase(pal,BX-66,dt,2,1);
    draw(c,'boy',{f:0,bob:0,ab:-82+Math.round(Math.sin(t*6)*10),af:0},BX,gy,1,0);
    drawPal(S,pal,t,{lie:true,sleep:true});
    if(Math.abs(pal.v)<30){var z=(t*.9)%1;TX(c,'z',pal.x+16,gy-26-z*16,TH.muted,10+Math.floor(z*4));TX(c,'Z',pal.x+26,gy-36-((z+.5)%1)*16,TH.muted,12)}
  };
};

/* 3 experience: server room, boy walks the racks, dog trots with him */
SCENES.exp=function(){
  var gp=0,bd=1,pal=Pal(10),inited=false;
  var K=[[0,.06],[1.8,.22],[2.6,.22],[4.2,.45],[5.4,.45],[7,.22],[8,.22],[9.6,.06],[11,.06]];
  return function(S,t,dt){
    var c=S.ctx,W=S.W,gy=S.gy,cc=t%11;
    ground(S);
    TX(c,'load',8,14,TH.muted,10);R(c,8,20,84,8,TH.rule);var u=sm((cc%7)/6);R(c,8,20,84*(1+5*u)/6,8,TH.accent);TX(c,(1+5*u).toFixed(1)+'x',98,28,TH.ink,10);
    R(c,8,46,W-16,2,TH.rule);
    for(var i=0;i<9;i++){var px=((cc*70+i*(W/9))%(W-16))+8;R(c,px,43,6,6,TH.accent)}
    for(var r=0;r<4;r++){
      var rx=Math.round(W*.53)+r*Math.round(W*.115),rw=Math.round(W*.085);
      R(c,rx,56,rw,gy-56,TH.line);R(c,rx+2,58,rw-4,gy-60,TH.board);
      for(var s=0;s<5;s++){R(c,rx+6,66+s*10,rw*.5,2,TH.rule);var on=.3+.7*Math.abs(Math.sin(t*(1.5+s*.4)+r*2+s));c.globalAlpha=on;R(c,rx+rw-12,65+s*10,4,4,TH.accent);c.globalAlpha=1}
    }
    var bx=pw(cc,K.map(function(k){return [k[0],k[1]*W]})),v=vel(K,cc)*W;if(Math.abs(v)>25)bd=v>0?1:-1;
    gp+=Math.abs(v)*dt/18;
    if(!inited){pal.x=bx-36;inited=true}
    chase(pal,bx-bd*36,dt,6,bd);
    var o=boyWalkO(v,gp,t,{ab:0,af:-62});
    var bs=draw(c,'boy',o,bx,gy,bd,0);
    var h=pt('boy',bx,gy,bd,bs.tip[0],bs.tip[1]);
    R(c,h[0]-(bd>0?0:14),h[1]-10,14,9,TH.line);R(c,h[0]-(bd>0?0:14)+1,h[1]-9,12,7,TH.board);
    drawPal(S,pal,t,{});
  };
};

/* 4 projects: UAV polls sensor nodes in a field */
SCENES.uav=function(){
  var pal=Pal(0),inited=false;
  var nodes=[.46,.66,.86];
  return function(S,t,dt){
    var c=S.ctx,W=S.W,gy=S.gy,cc=t%12;
    cloud(S,(t*5)%(W+80)-60,14,.9);
    for(var r=0;r<3;r++)for(var x=Math.round(W*.34);x<W-6;x+=10){R(c,x,gy+5+r*0,2,2,TH.leaf)}
    ground(S);
    for(var x2=Math.round(W*.34);x2<W-6;x2+=14){R(c,x2,gy-5,3,5,TH.leaf);R(c,x2+1,gy-9,1,4,TH.leaf)}
    var path=[[0,.34],[1.2,.46],[3,.46],[4.2,.66],[6,.66],[7.2,.86],[9,.86],[11,.34],[12,.34]];
    var dx=pw(cc,path.map(function(k){return [k[0],k[1]*W]})),dy=44+Math.sin(t*3)*2;
    nodes.forEach(function(n,i){
      var nx=Math.round(W*n),near=Math.abs(dx-nx)<10,polled=cc>[1.4,4.4,7.4][i]&&cc<11.2;
      R(c,nx-1,gy-22,3,22,TH.line);R(c,nx-5,gy-30,11,9,TH.line);R(c,nx-4,gy-29,9,7,polled?TH.accent:TH.board);
      if(near&&cc<9.5){for(var k=0;k<3;k++){var q=((t*1.6+k/3)%1);c.globalAlpha=1-q;R(c,nx-2-q*18,dy+10+q*(gy-dy-44),5+q*36,2,TH.accent);c.globalAlpha=1}}
    });
    R(c,dx-1,gy-3,Math.round(18-(gy-dy)*.02),2,TH.shadow||'rgba(0,0,0,.18)');
    R(c,dx-9,dy,18,5,TH.line);R(c,dx-8,dy+1,16,3,TH.ink);R(c,dx-3,dy-3,6,3,TH.line);
    var fl=Math.floor(t*14)%2;R(c,dx-16,dy-2,10,2,TH.line);R(c,dx+6,dy-2,10,2,TH.line);
    c.globalAlpha=fl?1:.5;R(c,dx-16,dy-4,10,1,TH.muted);R(c,dx+6,dy-4,10,1,TH.muted);c.globalAlpha=1;
    TX(c,'polling',Math.round(dx)-18,dy-10,TH.muted,10);
    var BX=Math.round(W*.14);
    if(!inited){pal.x=BX+36;inited=true}
    chase(pal,BX+38,dt,2,1);
    var look=clamp((dx-BX)/(W*.5),0,1);
    draw(c,'boy',{f:0,bob:0,ab:-140+Math.round(look*30),af:-30},BX,gy,1,0);
    var o=Math.abs(pal.v)>40?{pose:'run',f:Math.floor(pal.ph)%4,tail:Math.floor(t*10)%4,mouth:1}:{pose:'sit',tail:Math.floor(t*6)%2,mouth:1,tilt:-1};
    draw(c,'dog',o,pal.x,gy,pal.dir,0);
  };
};

/* 5 skills: a commit moves through build, test, deploy; the cluster scales out */
SCENES.skills=function(){
  var pal=Pal(0),inited=false;
  return function(S,t,dt){
    var c=S.ctx,W=S.W,gy=S.gy;ground(S);
    var BX=Math.round(W*.12),dx=BX+20;
    R(c,dx,gy-22,50,4,TH.line);R(c,dx+1,gy-21,48,2,TH.wood);R(c,dx+4,gy-18,3,18,TH.line);R(c,dx+43,gy-18,3,18,TH.line);
    R(c,dx+12,gy-36,24,14,TH.line);R(c,dx+14,gy-34,20,10,TH.board);
    var tl=1+Math.floor(t*3)%4;for(var i=0;i<tl;i++)R(c,dx+16,gy-33+i*2,6+((i*5)%10),1,TH.accent);
    TX(c,'terraform apply',dx+6,gy-42,TH.muted,10);
    if(!inited){pal.x=BX-34;inited=true}
    chase(pal,BX-34,dt,2,1);
    draw(c,'boy',{f:0,bob:Math.floor(t*5)%2?0:-1,ab:-95,af:-80+Math.round(Math.sin(t*9)*8)},BX,gy,1,0);
    drawPal(S,pal,t,{sit:true});
    /* pipeline */
    var px0=Math.round(W*.36),px1=Math.round(W*.70),L=px1-px0,by=gy-26;
    R(c,px0,by,L,3,TH.rule);for(var x=px0+((t*20)%12);x<px1;x+=12)R(c,x,by+5,5,2,TH.rule);
    var st=[.2,.5,.8],nm=['build','test','deploy'];
    st.forEach(function(u,i){var sx=px0+L*u;R(c,sx-11,by-30,3,30,TH.line);R(c,sx+8,by-30,3,30,TH.line);R(c,sx-11,by-33,22,3,TH.line);TX(c,nm[i],sx-12,by+20,TH.muted,10)});
    for(var k=0;k<4;k++){
      var u2=((t*.16+k/4)%1),x2=px0+L*u2,col=u2<.2?TH.ink:(u2<.5?TH.muted:(u2<.8?TH.accent:TH.accent));
      R(c,x2-5,by-10,10,10,TH.line);R(c,x2-4,by-9,8,8,u2<.2?TH.board:col);
      if(u2>.8)R(c,x2-2,by-6,4,2,TH.board);
    }
    /* cluster */
    var cx0=Math.round(W*.76),cw=W-cx0-10,n=clamp(2+Math.floor((t%12)*1.0),2,12);
    TX(c,'pods: '+n,cx0,16,TH.muted,10);
    for(var j=0;j<12;j++){var col2=j%4,row=Math.floor(j/4),px=cx0+col2*Math.round(cw/4),py=gy-62+row*18;
      R(c,px,py,Math.round(cw/4)-6,14,TH.line);R(c,px+1,py+1,Math.round(cw/4)-8,12,j<n?TH.accent:TH.board)}
  };
};

/* 6 contact: phone rings, dog barks, boy runs over */
SCENES.contact=function(){
  var bp=0,bd=1,pal=Pal(-10);
  var BXk=[[0,.04],[2.5,.62],[6.2,.62],[7.2,.5],[9.5,.04]],AR=[[0,-35],[2.5,-35],[2.9,-80],[3.3,-150],[6,-150],[6.3,-80],[6.7,-35],[9.5,-35]];
  return function(S,t,dt){
    var c=S.ctx,W=S.W,gy=S.gy,cc=t%9.5;ground(S);
    var dx=Math.round(W*.76),dtop=gy-30;
    R(c,dx-30,dtop,60,5,TH.line);R(c,dx-29,dtop+1,58,3,TH.wood);R(c,dx-26,dtop+5,4,30,TH.line);R(c,dx+22,dtop+5,4,30,TH.line);
    var ringing=cc>.3&&cc<2.95;
    var bx=pw(cc,BXk.map(function(k){return [k[0],k[1]*W]})),v=vel(BXk,cc)*W;if(Math.abs(v)>25)bd=v>0?1:-1;
    bp+=Math.abs(v)*dt/18;
    chase(pal,bx-bd*36,dt,6,bd);
    var a=pw(cc,AR),mv=Math.abs(v)>25;
    var o=boyWalkO(v,bp,t,mv?{ab:0,af:0}:{ab:0,af:a});
    var bs=draw(c,'boy',o,bx,gy,bd,0);
    var h=pt('boy',bx,gy,bd,bs.tip[0],bs.tip[1]);
    var px=dx,py=dtop-9;
    if(cc>=3&&cc<3.3){var u=sm((cc-3)/.3);px=dx+(h[0]-dx)*u;py=py+(h[1]-py)*u}
    else if(cc>=3.3&&cc<6){px=h[0];py=h[1]}
    else if(cc>=6&&cc<6.3){var u2=sm((cc-6)/.3);px=h[0]+(dx-h[0])*u2;py=h[1]+(dtop-9-h[1])*u2}
    var sh=ringing?Math.round(Math.sin(t*40)*2):0;
    R(c,px-4+sh,py-8,8,14,TH.line);R(c,px-3+sh,py-7,6,10,TH.ink);R(c,px-2+sh,py-6,4,6,TH.board);
    if(ringing){for(var k=0;k<3;k++){var q=((t*.9+k/3)%1);c.globalAlpha=1-q;R(c,dx-8-q*14,dtop-22-q*10,16+q*28,2,TH.accent);c.globalAlpha=1}}
    if(cc>3.4&&cc<5.9){for(var i=0;i<3;i++)if(Math.floor(t*4)%3>=i)R(c,bx+bd*(6+i*7),gy-70,3,3,TH.ink)}
    var hop=(ringing&&Math.abs(pal.v)<30)?-Math.abs(Math.sin(t*9))*8:0;
    drawPal(S,pal,t,{hop:hop});
    if(ringing&&cc>1.9&&Math.floor(t*3)%2===0)TX(c,'woof!',pal.x+(pal.dir>0?8:-48),gy-52,TH.warn,12);
  };
};
