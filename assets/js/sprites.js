/* =====================================================================
   sprites.js  -  the pixel-art engine (boy + yellow Labrador)
   ---------------------------------------------------------------------
   AI-EDIT NOTES (paste this block into Claude/AI when asking for changes)
   - Plain browser JavaScript, no libraries. Classic script, globals on purpose.
   - A sprite is built on a small grid with: px(x,y,c) rect(x,y,w,h,c) ell(cx,cy,rx,ry,c) line(x0,y0,x1,y1,c,thick)
     then outline('o') adds the dark outline. Each grid cell is drawn as U=2 screen pixels.
   - Colour letters (see pal()): o outline, f fur, F dark fur, l light fur, n nose, e eye, t tongue, c collar,
     s skin, S dark skin, h hair, b shirt, B dark shirt, p pants, k shoe, w white, r ball, g grey.
     Real colours come from CSS variables in assets/css/paper.css (:root and the dark blocks), via readTheme().
   - Boy:  boyGrid({f:0..3 walking frame, bob:-1|0, ab:back-arm angle, af:front-arm angle}). Grid 18x28. Faces right.
           Angles are degrees: 0 = arm hangs down, -90 = arm straight forward, -150 = arm raised high.
   - Dog:  dogGrid({pose:'stand'|'run'|'sit'|'lie', f:0..3 run frame, tail:0..3, mouth:0|1, ear:0|1, down:0|1, sleep:0|1, tilt:-1|0}). Grid 30x20.
   - draw(ctx,'boy'|'dog',opts,centreX,groundY,dir(+1|-1),yOffset) draws a sprite and returns it.
   - pt('boy'|'dog',cx,gy,dir,gridX,gridY) converts a sprite grid point into screen coordinates (use it to attach props to a hand or mouth).
   - To change looks: edit colours in paper.css, or edit the grid code below (hair = the loop in boyGrid, ears = head() in dogGrid).
   - After editing, hard-refresh the page (Ctrl+Shift+R). Sprites are cached per theme.
   ===================================================================== */
/* ---------- pixel sprite engine ---------- */
var U=2, TH={}, CACHE={};
function readTheme(){
  var cs=getComputedStyle(document.documentElement);
  function g(n){return cs.getPropertyValue(n).trim()}
  TH={ink:g('--ink'),muted:g('--muted'),rule:g('--rule'),accent:g('--accent'),warn:g('--warn'),soft:g('--soft'),board:g('--board'),
      shirt:g('--shirt'),pants:g('--pants'),skin:g('--skin'),hair:g('--hair'),fur:g('--fur'),fur2:g('--fur2'),fur3:g('--fur3'),
      line:g('--line'),ball:g('--ball'),shoe:g('--shoe'),sun:g('--sun'),leaf:g('--leaf'),wood:g('--wood')};
  CACHE={};
}
function shade(hex,f){
  var h=hex.replace('#','');if(h.length===3)h=h.split('').map(function(c){return c+c}).join('');
  var n=parseInt(h,16),r=(n>>16)&255,gg=(n>>8)&255,b=n&255;
  return 'rgb('+Math.round(r*f)+','+Math.round(gg*f)+','+Math.round(b*f)+')';
}
function pal(c){
  switch(c){
    case 'o':return TH.line; case 'f':return TH.fur; case 'F':return TH.fur2; case 'l':return TH.fur3;
    case 'n':return '#2A1C14'; case 'e':return '#2A1C14'; case 't':return '#E0708A'; case 'c':return TH.warn;
    case 's':return TH.skin; case 'S':return shade(TH.skin,.82); case 'h':return TH.hair;
    case 'b':return TH.shirt; case 'B':return shade(TH.shirt,.8); case 'p':return TH.pants; case 'k':return TH.shoe;
    case 'w':return '#FFFFFF'; case 'r':return TH.ball; case 'g':return TH.muted;
  } return '#f0f';
}
function Grid(w,h){this.w=w;this.h=h;this.a=new Array(w*h).fill('')}
Grid.prototype.px=function(x,y,c){x=Math.round(x)+1;y=Math.round(y)+1;if(x>=0&&y>=0&&x<this.w&&y<this.h)this.a[y*this.w+x]=c};
Grid.prototype.rect=function(x,y,w,h,c){for(var j=0;j<h;j++)for(var i=0;i<w;i++)this.px(x+i,y+j,c)};
Grid.prototype.ell=function(cx,cy,rx,ry,c){for(var y=Math.floor(cy-ry);y<=Math.ceil(cy+ry);y++)for(var x=Math.floor(cx-rx);x<=Math.ceil(cx+rx);x++){var dx=(x-cx)/rx,dy=(y-cy)/ry;if(dx*dx+dy*dy<=1.02)this.px(x,y,c)}};
Grid.prototype.line=function(x0,y0,x1,y1,c,th){var n=Math.max(Math.abs(x1-x0),Math.abs(y1-y0))*2+1;for(var i=0;i<=n;i++){var u=i/n,x=x0+(x1-x0)*u,y=y0+(y1-y0)*u;this.px(x,y,c);if(th>1){this.px(x+1,y,c)}}};
Grid.prototype.outline=function(c){
  var w=this.w,h=this.h,a=this.a,b=a.slice();
  for(var y=0;y<h;y++)for(var x=0;x<w;x++){
    if(a[y*w+x])continue;
    if((x>0&&a[y*w+x-1])||(x<w-1&&a[y*w+x+1])||(y>0&&a[(y-1)*w+x])||(y<h-1&&a[(y+1)*w+x]))b[y*w+x]=c;
  }
  this.a=b;
};
Grid.prototype.canvas=function(){
  var cv=document.createElement('canvas');cv.width=this.w;cv.height=this.h;var x=cv.getContext('2d');
  for(var j=0;j<this.h;j++)for(var i=0;i<this.w;i++){var c=this.a[j*this.w+i];if(c){x.fillStyle=pal(c);x.fillRect(i,j,1,1)}}
  return cv;
};
var DOGW=30,DOGH=20,BOYW=18,BOYH=28;

/* ---- yellowish fawn labrador, faces right, feet on row 17 (+1 margin) ---- */
function dogGrid(o){
  var g=new Grid(DOGW,DOGH),pose=o.pose||'stand',f=o.f||0,tl=o.tail||0,down=o.down?4:0,bob=0,hy;
  function leg(hx,hy2,fx,fy,c){g.line(hx,hy2,fx,fy,c,2);g.px(fx+1,fy+1,'l');g.px(fx+2,fy+1,'l')}
  function head(dx,dy,open){
    g.ell(21+dx,4+dy,3.9,3.3,'f');
    g.rect(23+dx,4+dy,4,3,'l');g.rect(26+dx,4+dy,2,2,'n');
    g.px(23+dx,3+dy,'e');
    if(open){g.rect(24+dx,7+dy,3,1,'o');g.rect(25+dx,8+dy,2,2,'t')}
    g.rect(19+dx,3+dy+(o.ear?-1:0),2,o.ear?4:5,'F');
  }
  if(pose==='stand'||pose==='run'){
    var S=[
      {fn:[22,16],ff:[20,15],bn:[2,16],bf:[4,15],bob:0},
      {fn:[19,16],ff:[17,16],bn:[6,16],bf:[8,16],bob:0},
      {fn:[14,15],ff:[12,16],bn:[12,16],bf:[10,15],bob:-1},
      {fn:[17,16],ff:[19,16],bn:[8,16],bf:[6,16],bob:0}][f%4];
    if(pose==='stand')S={fn:[17,16],ff:[14,16],bn:[7,16],bf:[10,16],bob:0};
    bob=S.bob;
    leg(14,12+bob,S.ff[0],S.ff[1],'F');leg(9,12+bob,S.bf[0],S.bf[1],'F');
    var ty=[[3,2],[2,5],[3,8],[2,5]][tl%4];
    g.line(4,8+bob,ty[0]-3,ty[1]+bob,'f',2);
    g.ell(12,8+bob,8.5,4.6,'f');g.ell(17,7+bob,3.5,4.5,'f');g.rect(6,11+bob,12,1,'l');
    leg(17,12+bob,S.fn[0],S.fn[1],'f');leg(7,12+bob,S.bn[0],S.bn[1],'f');
    g.rect(17,6+bob,2,4,'c');
    if(down)g.ell(19,7+bob,3,4,'f');
    head(0,bob+down,o.mouth);
  }else if(pose==='sit'){
    g.line(5,15,1,15+(tl%2),'f',2);
    g.ell(8,12,5,5,'f');g.ell(14,9,3.6,7,'f');g.rect(9,16,6,2,'l');
    g.rect(14,10,2,7,'f');g.rect(16,10,2,7,'f');g.rect(14,16,5,2,'l');
    g.rect(14,8,2,3,'c');
    head(-3,-1+(o.tilt||0),o.mouth);
  }else{ /* lie */
    g.line(4,14,0,13+(tl%2)*2,'f',2);
    g.ell(12,13,9,3.6,'f');
    g.rect(17,16,10,2,'f');g.rect(26,16,2,2,'l');
    g.ell(21,13,3.6,3,'f');g.rect(23,13,4,3,'l');g.rect(26,13,2,2,'n');
    if(!o.sleep)g.px(23,12,'e');else g.rect(22,12,2,1,'o');
    g.rect(19,12,2,5,'F');g.rect(16,10,2,3,'c');
  }
  g.outline('o');
  return g.canvas();
}

/* ---- boy, faces right ---- */
function armPts(g,a,bob,front){
  var sx=8,sy=10+bob,r=a*Math.PI/180,L=8,x,y;
  for(var i=0;i<=L;i++){
    x=sx-i*Math.sin(r);y=sy+i*Math.cos(r);
    var c=i<3?(front?'b':'B'):(front?'s':'S');
    g.px(x,y,c);
    if(Math.abs(Math.cos(r))>Math.abs(Math.sin(r)))g.px(x+1,y,c);else g.px(x,y+1,c);
  }
  return [x+1,y+1];
}
function boyGrid(o){
  var g=new Grid(BOYW,BOYH),f=o.f||0,bob=o.bob||0;
  var d=[[0,0],[3,-3],[0,0],[-3,3]][f%4];
  function legP(hx,dx){g.line(hx,17+bob,hx+dx,24,'p',2);g.rect(hx+dx,24,3,2,'k')}
  legP(6,d[1]);
  armPts(g,o.ab===undefined?0:o.ab,bob,false);
  g.rect(5,9+bob,6,8,'b');
  legP(8,d[0]);
  var tip=armPts(g,o.af===undefined?0:o.af,bob,true);
  g.rect(7,8+bob,2,1,'s');
  g.ell(8,4+bob,4.2,4.2,'s');
  for(var y=0;y<=8;y++)for(var x=3;x<=13;x++){
    var dx=(x-8)/4.4,dy=(y-4)/4.4;
    if(dx*dx+dy*dy<=1&&(y<=2||(x<=6&&y<=5)))g.px(x,y+bob,'h');
  }
  g.px(10,4+bob,'e');
  g.outline('o');
  o._tip=tip;
  return g.canvas();
}
function sprite(kind,o){
  var key=kind+JSON.stringify(o);
  if(!CACHE[key]){var oo=JSON.parse(JSON.stringify(o));CACHE[key]={cv:(kind==='dog'?dogGrid:boyGrid)(oo),tip:oo._tip}}
  return CACHE[key];
}
/* draw: cx = horizontal centre, gy = ground y. returns helper to find grid points in world space */
function draw(ctx,kind,o,cx,gy,dir,yoff){
  var s=sprite(kind,o),W=kind==='dog'?DOGW:BOYW,H=kind==='dog'?DOGH:BOYH;
  ctx.save();ctx.imageSmoothingEnabled=false;
  ctx.translate(Math.round(cx),Math.round(gy-(H-1)*U+(yoff||0)));
  if(dir<0)ctx.scale(-1,1);
  ctx.drawImage(s.cv,-W*U/2,0,W*U,H*U);
  ctx.restore();
  return s;
}
function pt(kind,cx,gy,dir,gx,gyy,yoff){
  var W=kind==='dog'?DOGW:BOYW,H=kind==='dog'?DOGH:BOYH;
  return [cx+dir*((gx+.5)-W/2)*U, gy-(H-1)*U+(gyy+.5)*U+(yoff||0)];
}
