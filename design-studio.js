(() => {
"use strict";
const W=1800,H=2200,BASE_W=720,BASE_H=880;
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const artboard=$("#artboard"),ctx=artboard.getContext("2d",{willReadFrequently:true});
const shell=$("#studioShell"),viewport=$("#canvasViewport"),transform=$("#canvasTransform"),toast=$("#toast");

const BRUSHES={
  sketching:[
    {name:"Studio Pencil",note:"Clean fashion sketch",size:12,opacity:1,smoothing:.28,pressure:true,multiplier:1,mode:"line",sample:3},
    {name:"Technical Pencil",note:"Fine crisp line",size:7,opacity:1,smoothing:.12,pressure:true,multiplier:.8,mode:"line",sample:2},
    {name:"6B Pencil",note:"Soft dark sketch",size:24,opacity:.82,smoothing:.34,pressure:true,multiplier:1.15,mode:"line",sample:6},
    {name:"Soft Sketch",note:"Loose planning line",size:20,opacity:.42,smoothing:.5,pressure:true,multiplier:1.2,mode:"line",sample:5}
  ],
  inking:[
    {name:"Monoline",note:"Smooth clean outline",size:14,opacity:1,smoothing:.62,pressure:false,multiplier:1,mode:"line",sample:4},
    {name:"Fine Liner",note:"Sharp detail work",size:6,opacity:1,smoothing:.5,pressure:false,multiplier:.75,mode:"line",sample:2},
    {name:"Seam Pen",note:"Crisp construction lines",size:8,opacity:.95,smoothing:.45,pressure:false,multiplier:.8,mode:"line",sample:3}
  ],
  markers:[
    {name:"Alcohol Marker",note:"Soft fashion colour",size:42,opacity:.42,smoothing:.55,pressure:false,multiplier:1.8,mode:"line",sample:10},
    {name:"Brush Marker",note:"Pressure-sensitive stroke",size:34,opacity:.92,smoothing:.45,pressure:true,multiplier:1.7,mode:"line",sample:9},
    {name:"Chisel Marker",note:"Bold block colour",size:48,opacity:.72,smoothing:.3,pressure:false,multiplier:1.9,mode:"line",sample:12},
    {name:"Highlighter",note:"Transparent colour wash",size:58,opacity:.22,smoothing:.58,pressure:false,multiplier:2.1,mode:"line",sample:13}
  ],
  fashion:[
    {name:"Stitch Line",note:"Even garment stitches",size:10,opacity:1,smoothing:.4,pressure:false,multiplier:1,mode:"stitch",sample:3},
    {name:"Rhinestones",note:"Sparkle detail trail",size:20,opacity:1,smoothing:.25,pressure:false,multiplier:1,mode:"bead",sample:7},
    {name:"Crochet Texture",note:"Looped crochet detail",size:22,opacity:.85,smoothing:.3,pressure:false,multiplier:1,mode:"crochet",sample:7},
    {name:"Knit Rib",note:"Ribbed knit texture",size:18,opacity:.8,smoothing:.35,pressure:false,multiplier:1,mode:"knit",sample:6},
    {name:"Fuzzy Yarn",note:"Soft yarn texture",size:24,opacity:.65,smoothing:.2,pressure:false,multiplier:1,mode:"fuzzy",sample:8}
  ],
  favorites:[]
};

const state={
  tool:"brush",brushCategory:"sketching",brush:null,colour:"#e24892",brushSize:12,opacity:1,smoothing:.28,
  pressureEnabled:true,brushMultiplier:1,eraserSize:48,drawing:false,last:null,lastSpecial:null,
  selection:null,selectionStart:null,croquis:"classic",croquisOpacity:1,croquisHidden:false,
  referenceImage:null,referenceOpacity:.4,motif:null,motifScale:1,motifSpacing:90,motifRotation:0,lastStamp:null,
  layers:[],activeLayerId:null,history:[],historyIndex:-1,recentColours:[],
  zoom:1,fitScale:1,panX:0,panY:0,touches:new Map(),gesture:null
};

function newCanvas(){const c=document.createElement("canvas");c.width=W;c.height=H;return c}
function activeLayer(){return state.layers.find(l=>l.id===state.activeLayerId)||state.layers[0]}
function addLayer(name="Sketch"){const l={id:crypto.randomUUID?.()||String(Date.now()+Math.random()),name,visible:true,canvas:newCanvas()};state.layers.unshift(l);state.activeLayerId=l.id;renderLayerList();render();snapshot();return l}
function showToast(m){toast.textContent=m;toast.classList.add("show");clearTimeout(showToast.t);showToast.t=setTimeout(()=>toast.classList.remove("show"),1400)}

function setColour(hex){state.colour=hex;$("#colourPicker").value=hex;$("#hexValue").textContent=hex.toUpperCase();state.recentColours=[hex,...state.recentColours.filter(c=>c!==hex)].slice(0,8);renderRecentColours()}
function renderRecentColours(){const root=$("#recentColours");root.innerHTML="";state.recentColours.forEach(c=>{const b=document.createElement("button");b.style.setProperty("--swatch",c);b.onclick=()=>setColour(c);root.appendChild(b)})}

function drawBrushPreview(canvas,p){
  const c=canvas.getContext("2d"),w=canvas.width,h=canvas.height;
  c.clearRect(0,0,w,h);
  c.save();c.lineCap="round";c.lineJoin="round";c.strokeStyle="#3c3036";c.fillStyle="#3c3036";
  const curve=(offset,alpha,width)=>{
    c.globalAlpha=alpha;c.lineWidth=width;c.beginPath();
    c.moveTo(10,h*.63+offset);
    c.bezierCurveTo(w*.25,h*.18+offset,w*.48,h*.86+offset,w*.7,h*.42+offset);
    c.bezierCurveTo(w*.8,h*.25+offset,w*.88,h*.35+offset,w-10,h*.28+offset);
    c.stroke();
  };
  if(p.mode==="stitch"){
    c.lineWidth=3;for(let x=12;x<w-12;x+=15){c.beginPath();c.moveTo(x,h*.62);c.lineTo(x+8,h*.48);c.stroke()}
  }else if(p.mode==="bead"){
    for(let x=13;x<w-9;x+=16){const y=h*.52+Math.sin(x*.16)*5;c.beginPath();c.arc(x,y,5,0,Math.PI*2);c.fill();c.fillStyle="#fff";c.globalAlpha=.65;c.beginPath();c.arc(x-1.5,y-1.5,1.4,0,Math.PI*2);c.fill();c.fillStyle="#3c3036";c.globalAlpha=1}
  }else if(p.mode==="crochet"){
    c.lineWidth=2.4;for(let x=12;x<w-12;x+=12){const y=h*.54+Math.sin(x*.12)*4;c.beginPath();c.arc(x,y,6,0,Math.PI*2);c.stroke();c.beginPath();c.arc(x+5,y,6,0,Math.PI*2);c.stroke()}
  }else if(p.mode==="knit"){
    c.lineWidth=2.2;for(let x=12;x<w-10;x+=10){c.beginPath();c.moveTo(x,h*.72);c.quadraticCurveTo(x+5,h*.25,x+10,h*.72);c.stroke()}
  }else if(p.mode==="fuzzy"){
    curve(0,.5,7);c.globalAlpha=.42;c.lineWidth=1.4;
    for(let x=12;x<w-12;x+=5){const y=h*.52+Math.sin(x*.1)*7;for(let k=0;k<3;k++){const a=(x+k*19)*.61,r=5+k*2;c.beginPath();c.moveTo(x,y);c.lineTo(x+Math.cos(a)*r,y+Math.sin(a)*r);c.stroke()}}
  }else if(/Marker|Highlighter/.test(p.name)){
    curve(0,p.opacity,Math.max(10,p.sample*1.3));
    if(p.name==="Chisel Marker"){c.globalAlpha=.42;c.lineCap="butt";c.lineWidth=17;c.beginPath();c.moveTo(12,h*.68);c.lineTo(w-12,h*.28);c.stroke()}
  }else if(p.name==="6B Pencil"){
    curve(-1,.46,7);curve(1,.45,5);curve(0,.35,2);
  }else if(p.name==="Soft Sketch"){
    curve(-2,.25,5);curve(2,.2,4);curve(0,.26,2);
  }else if(p.name==="Technical Pencil"||p.name==="Fine Liner"){
    curve(0,.95,2);
  }else if(p.name==="Monoline"){
    curve(0,1,5);
  }else{
    curve(-1,.55,3);curve(1,.38,2);
  }
  c.restore();
}

function renderBrushes(category=state.brushCategory){
  state.brushCategory=category;
  $$(".category-chip").forEach(b=>b.classList.toggle("active",b.dataset.brushCategory===category));
  const list=category==="favorites"?Object.values(BRUSHES).flat().filter(x=>x.favorite):BRUSHES[category];
  const root=$("#brushPresets");root.innerHTML="";
  (list||[]).forEach(p=>{
    const b=document.createElement("button");
    b.className="brush-preset"+(state.brush?.name===p.name?" active":"");
    b.innerHTML='<canvas class="brush-preview-canvas" width="156" height="76"></canvas><span><strong>'+p.name+'</strong><small>'+p.note+'</small></span><span class="fav-star">'+(p.favorite?"♥":"♡")+'</span>';
    b.onclick=e=>{
      if(e.target.classList.contains("fav-star")){e.stopPropagation();p.favorite=!p.favorite;renderBrushes(category);return}
      applyBrush(p);
    };
    root.appendChild(b);
    drawBrushPreview($(".brush-preview-canvas",b),p);
  });
  if(!list?.length)root.innerHTML='<div class="helper">Favorite brushes will appear here.</div>';
}
function applyBrush(p){
  state.tool="brush";state.brush=p;state.brushSize=p.size;state.opacity=p.opacity;state.smoothing=p.smoothing;state.pressureEnabled=p.pressure;state.brushMultiplier=p.multiplier;
  $("#brushSize").value=p.size;$("#brushSizeValue").textContent=p.size;
  $("#brushOpacity").value=Math.round(p.opacity*100);$("#brushOpacityValue").textContent=Math.round(p.opacity*100)+"%";
  $("#brushSmoothing").value=Math.round(p.smoothing*100);$("#brushSmoothingValue").textContent=Math.round(p.smoothing*100)+"%";
  $("#pressureToggle").checked=p.pressure;
  $$(".quick-tool").forEach(b=>b.classList.remove("active"));renderBrushes(state.brushCategory);showToast(p.name);
}
function setTool(t){state.tool=t;$$(".quick-tool").forEach(b=>b.classList.toggle("active",b.dataset.tool===t));if(t==="brush")renderBrushes();if(["stamp","scatter","fillpattern"].includes(t)&&!state.motif)showToast("Create a motif first ✿")}

function fitCanvas(){
  const r=viewport.getBoundingClientRect(),margin=shell.classList.contains("left-collapsed")&&shell.classList.contains("right-collapsed")?0:30;
  state.fitScale=Math.min((r.width-margin)/BASE_W,(r.height-margin)/BASE_H);
  state.zoom=1;state.panX=(r.width-BASE_W*state.fitScale)/2;state.panY=(r.height-BASE_H*state.fitScale)/2;applyTransform();
}
function applyTransform(){const s=state.fitScale*state.zoom;transform.style.transform="translate3d("+state.panX+"px,"+state.panY+"px,0) scale("+s+")";$("#zoomReadout").textContent=Math.round(state.zoom*100)+"%"}
function zoomAt(f,x,y){const vr=viewport.getBoundingClientRect(),mx=x-vr.left,my=y-vr.top,old=state.fitScale*state.zoom,cx=(mx-state.panX)/old,cy=(my-state.panY)/old;state.zoom=Math.max(.2,Math.min(5,state.zoom*f));const ns=state.fitScale*state.zoom;state.panX=mx-cx*ns;state.panY=my-cy*ns;applyTransform()}
viewport.addEventListener("wheel",e=>{e.preventDefault();zoomAt(e.deltaY<0?1.08:.92,e.clientX,e.clientY)},{passive:false});
$("#fitCanvasBtn").onclick=fitCanvas;

function startTouchGesture(){
  const pts=[...state.touches.values()];
  if(pts.length===1)state.gesture={type:"pan",startX:pts[0].x,startY:pts[0].y,panX:state.panX,panY:state.panY};
  else if(pts.length>=2){const [a,b]=pts,mid={x:(a.x+b.x)/2,y:(a.y+b.y)/2};state.gesture={type:"pinch",dist:Math.hypot(a.x-b.x,a.y-b.y),zoom:state.zoom,mid,panX:state.panX,panY:state.panY}}
}
function updateTouchGesture(){
  const pts=[...state.touches.values()];
  if(pts.length>=2){
    const [a,b]=pts,dist=Math.hypot(a.x-b.x,a.y-b.y),mid={x:(a.x+b.x)/2,y:(a.y+b.y)/2};
    if(!state.gesture||state.gesture.type!=="pinch")startTouchGesture();
    const g=state.gesture,vr=viewport.getBoundingClientRect(),mx=mid.x-vr.left,my=mid.y-vr.top,startX=g.mid.x-vr.left,startY=g.mid.y-vr.top,old=state.fitScale*g.zoom,cx=(startX-g.panX)/old,cy=(startY-g.panY)/old;
    state.zoom=Math.max(.2,Math.min(5,g.zoom*(dist/g.dist)));const ns=state.fitScale*state.zoom;state.panX=mx-cx*ns;state.panY=my-cy*ns;applyTransform();
  }else if(pts.length===1&&state.gesture?.type==="pan"){const p=pts[0];state.panX=state.gesture.panX+(p.x-state.gesture.startX);state.panY=state.gesture.panY+(p.y-state.gesture.startY);applyTransform()}
}
function pagePoint(e){const r=artboard.getBoundingClientRect();return{x:(e.clientX-r.left)*(W/r.width),y:(e.clientY-r.top)*(H/r.height),pressure:e.pointerType==="pen"&&e.pressure>0?e.pressure:.5}}

function skinStyle(t){t.fillStyle="#efd4c8";t.strokeStyle="#c5a99f";t.lineWidth=4;t.lineJoin="round";t.lineCap="round"}
function limb(t,x1,y1,x2,y2,w){t.save();skinStyle(t);t.lineWidth=w;t.beginPath();t.moveTo(x1,y1);t.lineTo(x2,y2);t.stroke();t.restore()}
function foot(t,x,y,dir=1){t.save();skinStyle(t);t.beginPath();t.ellipse(x+18*dir,y,38,17,dir>0?-.12:.12,0,Math.PI*2);t.fill();t.stroke();t.restore()}
function hand(t,x,y){t.save();skinStyle(t);t.beginPath();t.ellipse(x,y,22,34,0,0,Math.PI*2);t.fill();t.stroke();t.restore()}
function head(t,cx,cy,turn=0){t.save();skinStyle(t);t.beginPath();t.ellipse(cx,cy,82,112,turn,0,Math.PI*2);t.fill();t.stroke();t.restore()}
function torso(t,cx,opts){
  const sh=opts.shoulders,wa=opts.waist,hi=opts.hips,lean=opts.lean||0,y=opts.y||430;
  t.save();skinStyle(t);t.beginPath();
  t.moveTo(cx-sh+lean,y);t.bezierCurveTo(cx-sh-10+lean,y+90,cx-wa+lean,y+230,cx-wa+lean,y+360);
  t.bezierCurveTo(cx-wa+lean,y+460,cx-hi+lean,y+510,cx-hi+lean,y+610);
  t.quadraticCurveTo(cx+lean,y+660,cx+hi+lean,y+610);
  t.bezierCurveTo(cx+hi+lean,y+510,cx+wa+lean,y+460,cx+wa+lean,y+360);
  t.bezierCurveTo(cx+wa+lean,y+230,cx+sh+10+lean,y+90,cx+sh+lean,y);
  t.quadraticCurveTo(cx+lean,y+50,cx-sh+lean,y);
  t.closePath();t.fill();t.stroke();t.restore();
}
function leg(t,x,y,outer,ankle,dir){
  t.save();skinStyle(t);t.beginPath();
  t.moveTo(x-dir*outer,y);t.bezierCurveTo(x-dir*(outer+18),y+260,x-dir*(ankle+18),y+520,x-dir*ankle,y+760);
  t.lineTo(x+dir*ankle,y+760);t.bezierCurveTo(x+dir*(ankle+18),y+520,x+dir*(outer+18),y+260,x+dir*outer,y);t.closePath();t.fill();t.stroke();t.restore();
}
function drawCroquis(t,type){
  if(state.croquisHidden)return;
  t.save();t.globalAlpha=state.croquisOpacity;
  const cx=W/2;
  if(type==="classic"){
    head(t,cx,225);torso(t,cx,{shoulders:185,waist:92,hips:150,y:410});
    limb(t,cx-165,470,cx-340,1180,58);limb(t,cx+165,470,cx+340,1180,58);hand(t,cx-345,1210);hand(t,cx+345,1210);
    leg(t,cx-70,1000,88,36,-1);leg(t,cx+70,1000,88,36,1);foot(t,cx-110,2000,-1);foot(t,cx+110,2000,1);
  }else if(type==="curvy"){
    head(t,cx,225);torso(t,cx,{shoulders:188,waist:82,hips:205,y:410});
    limb(t,cx-170,475,cx-350,1190,64);limb(t,cx+170,475,cx+350,1190,64);hand(t,cx-355,1220);hand(t,cx+355,1220);
    leg(t,cx-92,1005,112,44,-1);leg(t,cx+92,1005,112,44,1);foot(t,cx-135,2000,-1);foot(t,cx+135,2000,1);
  }else if(type==="back"){
    head(t,cx,225);torso(t,cx,{shoulders:190,waist:96,hips:158,y:410});
    limb(t,cx-170,470,cx-335,1170,60);limb(t,cx+170,470,cx+335,1170,60);hand(t,cx-340,1200);hand(t,cx+340,1200);
    leg(t,cx-72,1005,90,38,-1);leg(t,cx+72,1005,90,38,1);foot(t,cx-112,2000,-1);foot(t,cx+112,2000,1);
    t.save();t.strokeStyle="#c2a49a";t.lineWidth=4;t.beginPath();t.moveTo(cx,430);t.bezierCurveTo(cx-8,650,cx+8,800,cx,990);t.stroke();t.restore();
  }else{
    head(t,cx+18,225,-.08);torso(t,cx,{shoulders:178,waist:88,hips:160,y:410,lean:34});
    limb(t,cx-120,470,cx-275,1110,58);limb(t,cx+190,485,cx+300,1050,54);hand(t,cx-280,1140);hand(t,cx+305,1080);
    leg(t,cx-30,1000,92,36,-1);leg(t,cx+115,1020,82,34,1);foot(t,cx-72,1995,-1);foot(t,cx+165,1965,1);
  }
  t.restore();
}

function render(){
  ctx.clearRect(0,0,W,H);ctx.fillStyle="#fff";ctx.fillRect(0,0,W,H);
  if(state.referenceImage){ctx.save();ctx.globalAlpha=state.referenceOpacity;const i=state.referenceImage,s=Math.min((W*.82)/i.width,(H*.82)/i.height),iw=i.width*s,ih=i.height*s;ctx.drawImage(i,(W-iw)/2,(H-ih)/2,iw,ih);ctx.restore()}
  drawCroquis(ctx,state.croquis);
  [...state.layers].reverse().forEach(l=>{if(l.visible)ctx.drawImage(l.canvas,0,0)});
  if(state.selection){ctx.save();ctx.strokeStyle="#e24892";ctx.lineWidth=5;ctx.setLineDash([18,14]);ctx.strokeRect(state.selection.x,state.selection.y,state.selection.w,state.selection.h);ctx.restore()}
}

function drawSpecial(l,p){
  const b=state.brush||BRUSHES.sketching[0],last=state.lastSpecial||p,dist=Math.hypot(p.x-last.x,p.y-last.y),spacing=Math.max(14,state.brushSize*1.5);
  if(dist<spacing)return;
  const dx=(p.x-last.x)/dist,dy=(p.y-last.y)/dist;
  for(let d=spacing;d<=dist;d+=spacing){
    const x=last.x+dx*d,y=last.y+dy*d;
    l.save();l.strokeStyle=state.colour;l.fillStyle=state.colour;l.globalAlpha=state.opacity;l.lineWidth=Math.max(3,state.brushSize*.18);l.lineCap="round";
    if(b.mode==="stitch"){l.beginPath();l.moveTo(x-dx*state.brushSize*.45,y-dy*state.brushSize*.45);l.lineTo(x+dx*state.brushSize*.45,y+dy*state.brushSize*.45);l.stroke()}
    if(b.mode==="bead"){l.beginPath();l.arc(x,y,state.brushSize*.34,0,Math.PI*2);l.fill();l.strokeStyle="rgba(255,255,255,.7)";l.lineWidth=2;l.beginPath();l.arc(x-state.brushSize*.1,y-state.brushSize*.1,state.brushSize*.1,0,Math.PI*2);l.stroke()}
    if(b.mode==="crochet"){l.beginPath();l.arc(x,y,state.brushSize*.38,0,Math.PI*2);l.stroke();l.beginPath();l.arc(x+state.brushSize*.25,y,state.brushSize*.38,0,Math.PI*2);l.stroke()}
    if(b.mode==="knit"){l.beginPath();l.moveTo(x-state.brushSize*.25,y-state.brushSize*.5);l.quadraticCurveTo(x,y,x+state.brushSize*.25,y-state.brushSize*.5);l.stroke()}
    if(b.mode==="fuzzy"){for(let k=0;k<6;k++){const a=Math.random()*Math.PI*2,r=Math.random()*state.brushSize*.7;l.beginPath();l.moveTo(x,y);l.lineTo(x+Math.cos(a)*r,y+Math.sin(a)*r);l.stroke()}}
    l.restore();
  }
  state.lastSpecial=p;
}
function strokeTo(p){
  const layer=activeLayer();if(!layer)return;const l=layer.canvas.getContext("2d"),prev=state.last||p;
  if(state.tool==="eraser"){l.save();l.globalCompositeOperation="destination-out";l.strokeStyle="#000";l.lineCap="round";l.lineJoin="round";l.lineWidth=state.eraserSize;l.beginPath();l.moveTo(prev.x,prev.y);l.lineTo(p.x,p.y);l.stroke();l.restore();state.last=p;render();return}
  const b=state.brush||BRUSHES.sketching[0];
  if(b.mode!=="line"){drawSpecial(l,p);state.last=p;render();return}
  l.save();l.globalCompositeOperation="source-over";l.strokeStyle=state.colour;l.globalAlpha=state.opacity;l.lineCap="round";l.lineJoin="round";
  const pressure=state.pressureEnabled?(.58+p.pressure*.92):1,smooth=Math.min(.8,state.smoothing*.8),tx=prev.x+(p.x-prev.x)*(1-smooth),ty=prev.y+(p.y-prev.y)*(1-smooth);
  l.lineWidth=state.brushSize*state.brushMultiplier*pressure;l.beginPath();l.moveTo(prev.x,prev.y);l.lineTo(tx,ty);l.stroke();l.restore();state.last={x:tx,y:ty,pressure:p.pressure};render();
}
function pickColour(p){render();const px=ctx.getImageData(Math.max(0,Math.min(W-1,Math.round(p.x))),Math.max(0,Math.min(H-1,Math.round(p.y))),1,1).data;setColour("#"+[px[0],px[1],px[2]].map(v=>v.toString(16).padStart(2,"0")).join(""));state.tool="brush";showToast("Colour picked")}
function rect(a,b){return{x:Math.min(a.x,b.x),y:Math.min(a.y,b.y),w:Math.abs(a.x-b.x),h:Math.abs(a.y-b.y)}}
function stampMotif(p,random=false){if(!state.motif){showToast("Create a motif first ✿");return}const l=activeLayer().canvas.getContext("2d"),m=state.motif,s=state.motifScale*(random?(.8+Math.random()*.4):1),w=m.width*s,h=m.height*s,r=(state.motifRotation+(random?(Math.random()*24-12):0))*Math.PI/180;l.save();l.translate(p.x,p.y);l.rotate(r);l.drawImage(m,-w/2,-h/2,w,h);l.restore();render()}
function createMotif(){if(!state.selection||state.selection.w<8||state.selection.h<8){showToast("Select your motif first");return}const s=state.selection,m=document.createElement("canvas");m.width=Math.round(s.w);m.height=Math.round(s.h);const mc=m.getContext("2d");[...state.layers].reverse().forEach(l=>{if(l.visible)mc.drawImage(l.canvas,s.x,s.y,s.w,s.h,0,0,m.width,m.height)});state.motif=m;const p=$("#motifPreview"),pc=p.getContext("2d");pc.clearRect(0,0,p.width,p.height);const sc=Math.min((p.width-18)/m.width,(p.height-18)/m.height);pc.drawImage(m,(p.width-m.width*sc)/2,(p.height-m.height*sc)/2,m.width*sc,m.height*sc);$("#motifStatus").textContent="Motif saved ✓";showToast("Motif saved")}
function patternFill(){if(!state.selection||!state.motif){showToast("Select an area and create a motif first");return}const s=state.selection,g=Math.max(20,state.motifSpacing),old=state.selection;state.selection=null;for(let y=s.y+g/2;y<s.y+s.h;y+=g)for(let x=s.x+g/2;x<s.x+s.w;x+=g)stampMotif({x,y},false);state.selection=old;render();snapshot()}

function renderLayerList(){const root=$("#layerList");root.innerHTML="";state.layers.forEach(layer=>{const row=document.createElement("div");row.className="layer-item"+(layer.id===state.activeLayerId?" active":"");row.innerHTML='<button class="layer-eye">'+(layer.visible?"◉":"○")+'</button><div class="layer-name">'+escapeHtml(layer.name)+'</div><button class="layer-delete">×</button>';row.onclick=e=>{if(e.target.classList.contains("layer-eye"))layer.visible=!layer.visible;else if(e.target.classList.contains("layer-delete")){if(state.layers.length===1)return;state.layers=state.layers.filter(l=>l.id!==layer.id);if(state.activeLayerId===layer.id)state.activeLayerId=state.layers[0].id;snapshot()}else state.activeLayerId=layer.id;renderLayerList();render()};root.appendChild(row)})}
function escapeHtml(v){return v.replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[ch]))}
function serializeLayers(){return state.layers.map(l=>({id:l.id,name:l.name,visible:l.visible,data:l.canvas.toDataURL("image/png")}))}
function snapshot(){const s={layers:serializeLayers(),activeLayerId:state.activeLayerId,croquis:state.croquis,croquisOpacity:state.croquisOpacity,croquisHidden:state.croquisHidden};state.history=state.history.slice(0,state.historyIndex+1);state.history.push(s);if(state.history.length>20)state.history.shift();state.historyIndex=state.history.length-1}
async function restore(s){const layers=[];for(const d of s.layers){const c=newCanvas(),i=new Image();await new Promise(r=>{i.onload=r;i.src=d.data});c.getContext("2d").drawImage(i,0,0);layers.push({id:d.id,name:d.name,visible:d.visible,canvas:c})}state.layers=layers;state.activeLayerId=s.activeLayerId;state.croquis=s.croquis||"classic";state.croquisOpacity=s.croquisOpacity??1;state.croquisHidden=s.croquisHidden??false;syncCroquisUI();renderLayerList();render()}
async function undo(){if(state.historyIndex<=0)return;state.historyIndex--;await restore(state.history[state.historyIndex])}
async function redo(){if(state.historyIndex>=state.history.length-1)return;state.historyIndex++;await restore(state.history[state.historyIndex])}
function exportPNG(){const c=newCanvas(),x=c.getContext("2d");x.fillStyle="#fff";x.fillRect(0,0,W,H);drawCroquis(x,state.croquis);[...state.layers].reverse().forEach(l=>{if(l.visible)x.drawImage(l.canvas,0,0)});const a=document.createElement("a"),safe=($("#designName").value||"amea-design").trim().replace(/[^a-z0-9-_]+/gi,"-");a.download=(safe||"amea-design")+".png";a.href=c.toDataURL("image/png");a.click();showToast("Exported ✓")}

viewport.addEventListener("pointerdown",e=>{
  if(e.pointerType==="touch"){e.preventDefault();state.touches.set(e.pointerId,{x:e.clientX,y:e.clientY});viewport.setPointerCapture?.(e.pointerId);startTouchGesture();return}
  if(e.pointerType==="mouse"&&e.button!==0)return;
  const p=pagePoint(e);artboard.setPointerCapture?.(e.pointerId);
  if(state.tool==="eyedropper")return pickColour(p);
  if(state.tool==="fillpattern")return patternFill();
  if(state.tool==="stamp"){stampMotif(p);snapshot();return}
  if(state.tool==="select"){state.selectionStart=p;state.selection={x:p.x,y:p.y,w:0,h:0};render();return}
  state.drawing=true;state.last=p;state.lastSpecial=p;
  if(state.tool==="scatter"){stampMotif(p,true);state.lastStamp=p;return}
  strokeTo(p);
},{passive:false});
viewport.addEventListener("pointermove",e=>{
  if(e.pointerType==="touch"&&state.touches.has(e.pointerId)){e.preventDefault();state.touches.set(e.pointerId,{x:e.clientX,y:e.clientY});updateTouchGesture();return}
  if(!state.drawing&&state.tool!=="select")return;
  const p=pagePoint(e);
  if(state.tool==="select"&&state.selectionStart){state.selection=rect(state.selectionStart,p);render();return}
  if(state.tool==="scatter"){const last=state.lastStamp||p;if(Math.hypot(p.x-last.x,p.y-last.y)>=state.motifSpacing){stampMotif(p,true);state.lastStamp=p}return}
  strokeTo(p);
},{passive:false});
function endPointer(e){
  if(e.pointerType==="touch"){state.touches.delete(e.pointerId);if(state.touches.size===1)startTouchGesture();else if(state.touches.size===0)state.gesture=null;return}
  if(state.tool==="select"){state.selectionStart=null;render();return}
  if(state.drawing)snapshot();state.drawing=false;state.last=null;state.lastSpecial=null;state.lastStamp=null;
}
viewport.addEventListener("pointerup",endPointer);viewport.addEventListener("pointercancel",endPointer);

$$(".category-chip").forEach(b=>b.onclick=()=>renderBrushes(b.dataset.brushCategory));
$$(".quick-tool").forEach(b=>b.onclick=()=>setTool(b.dataset.tool));
$("#brushSize").oninput=e=>{state.brushSize=+e.target.value;$("#brushSizeValue").textContent=e.target.value};
$("#brushOpacity").oninput=e=>{state.opacity=+e.target.value/100;$("#brushOpacityValue").textContent=e.target.value+"%"};
$("#eraserSize").oninput=e=>{state.eraserSize=+e.target.value;$("#eraserSizeValue").textContent=e.target.value};
$("#brushSmoothing").oninput=e=>{state.smoothing=+e.target.value/100;$("#brushSmoothingValue").textContent=e.target.value+"%"};
$("#pressureToggle").onchange=e=>state.pressureEnabled=e.target.checked;
$("#colourPicker").oninput=e=>setColour(e.target.value);
$$("#swatches button").forEach(b=>b.onclick=()=>setColour(b.dataset.colour));

$$(".tab-btn").forEach(btn=>btn.onclick=()=>{$$(".tab-btn").forEach(b=>b.classList.remove("active"));$$(".tab-panel").forEach(p=>p.classList.remove("active"));btn.classList.add("active");$('[data-panel="'+btn.dataset.tab+'"]').classList.add("active")});
function chooseCroquis(type){state.croquis=type;syncCroquisUI();render();snapshot()}
$$("[data-croquis]").forEach(b=>b.onclick=()=>chooseCroquis(b.dataset.croquis));
function syncCroquisUI(){$$("[data-croquis]").forEach(b=>b.classList.toggle("active",b.dataset.croquis===state.croquis));$("#croquisOpacity").value=Math.round(state.croquisOpacity*100);$("#croquisOpacityValue").textContent=Math.round(state.croquisOpacity*100)+"%";$("#hideCroquis").checked=state.croquisHidden}
$("#croquisOpacity").oninput=e=>{state.croquisOpacity=+e.target.value/100;$("#croquisOpacityValue").textContent=e.target.value+"%";render()};
$("#hideCroquis").onchange=e=>{state.croquisHidden=e.target.checked;render();snapshot()};

$("#motifSize").oninput=e=>{state.motifScale=+e.target.value/100;$("#motifSizeValue").textContent=e.target.value+"%"};
$("#motifSpacing").oninput=e=>{state.motifSpacing=+e.target.value;$("#motifSpacingValue").textContent=e.target.value};
$("#motifRotation").oninput=e=>{state.motifRotation=+e.target.value;$("#motifRotationValue").textContent=e.target.value+"°"};
$("#createMotifBtn").onclick=createMotif;$("#clearMotifBtn").onclick=()=>{state.motif=null;$("#motifPreview").getContext("2d").clearRect(0,0,220,160);$("#motifStatus").textContent="No motif saved"};

$("#addLayerBtn").onclick=()=>addLayer("Layer "+(state.layers.length+1));
$("#clearLayerBtn").onclick=()=>{const l=activeLayer();if(!l)return;if(confirm("Clear active layer?")){l.canvas.getContext("2d").clearRect(0,0,W,H);render();snapshot()}};

$("#referenceUpload").onchange=e=>{const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=()=>{const i=new Image();i.onload=()=>{state.referenceImage=i;render();showToast("Reference added")};i.src=r.result};r.readAsDataURL(f)};
$("#referenceOpacity").oninput=e=>{state.referenceOpacity=+e.target.value/100;$("#referenceOpacityValue").textContent=e.target.value+"%";render()};
$("#removeReferenceBtn").onclick=()=>{state.referenceImage=null;$("#referenceUpload").value="";render()};

function togglePanel(side,open){const cls=side+"-collapsed";open?shell.classList.remove(cls):shell.classList.add(cls);requestAnimationFrame(()=>requestAnimationFrame(fitCanvas))}
$("#toggleLeft").onclick=()=>togglePanel("left",false);$("#toggleRight").onclick=()=>togglePanel("right",false);$("#reopenLeft").onclick=()=>togglePanel("left",true);$("#reopenRight").onclick=()=>togglePanel("right",true);

$("#undoBtn").onclick=undo;$("#redoBtn").onclick=redo;$("#exportBtn").onclick=exportPNG;
window.addEventListener("resize",()=>requestAnimationFrame(fitCanvas));
window.addEventListener("keydown",e=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==="z"){e.preventDefault();e.shiftKey?redo():undo()}});

addLayer("Details");addLayer("Colour");addLayer("Sketch");
state.history=[];state.historyIndex=-1;
state.brush=BRUSHES.sketching[0];renderBrushes("sketching");applyBrush(state.brush);setColour(state.colour);syncCroquisUI();renderLayerList();render();snapshot();requestAnimationFrame(fitCanvas);
})();