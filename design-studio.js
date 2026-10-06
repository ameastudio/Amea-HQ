(() => {
"use strict";
const W=1800,H=2200,BASE_W=720,BASE_H=880;
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const artboard=$("#artboard"),ctx=artboard.getContext("2d",{willReadFrequently:true});
const shell=$("#studioShell"),viewport=$("#canvasViewport"),transform=$("#canvasTransform"),toast=$("#toast");

const BRUSHES={
  pencils:[
    {id:"hb-pencil",name:"HB Pencil",note:"Smooth everyday drawing pencil",size:11,opacity:.96,smoothing:.34,pressure:true,multiplier:1,mode:"pencil",sample:3},
    {id:"technical-pencil",name:"Technical Pencil",note:"Fine, precise construction lines",size:6,opacity:1,smoothing:.18,pressure:true,multiplier:.78,mode:"line",sample:2},
    {id:"6b-pencil",name:"6B Pencil",note:"Soft, dark and sketchy",size:22,opacity:.78,smoothing:.28,pressure:true,multiplier:1.16,mode:"softpencil",sample:6},
    {id:"rough-pencil",name:"Rough Pencil",note:"Loose textured sketch line",size:18,opacity:.68,smoothing:.18,pressure:true,multiplier:1.08,mode:"roughpencil",sample:5}
  ],
  pens:[
    {id:"studio-pen",name:"Studio Pen",note:"Clean pressure-sensitive line",size:11,opacity:1,smoothing:.58,pressure:true,multiplier:1,mode:"line",sample:4},
    {id:"fine-liner",name:"Fine Liner",note:"Sharp detail work",size:5,opacity:1,smoothing:.48,pressure:false,multiplier:.72,mode:"line",sample:2},
    {id:"monoline",name:"Monoline",note:"Even-width smooth outline",size:14,opacity:1,smoothing:.68,pressure:false,multiplier:1,mode:"line",sample:4},
    {id:"technical-pen",name:"Technical Pen",note:"Crisp seams and clean edges",size:8,opacity:.98,smoothing:.44,pressure:false,multiplier:.82,mode:"line",sample:3}
  ],
  markers:[
    {id:"brush-marker",name:"Brush Marker",note:"Bold pressure-sensitive colour",size:34,opacity:.9,smoothing:.46,pressure:true,multiplier:1.7,mode:"line",sample:9},
    {id:"alcohol-marker",name:"Alcohol Marker",note:"Soft transparent colour build-up",size:42,opacity:.4,smoothing:.55,pressure:false,multiplier:1.85,mode:"marker",sample:10},
    {id:"chisel-marker",name:"Chisel Marker",note:"Wide block colour stroke",size:48,opacity:.72,smoothing:.30,pressure:false,multiplier:1.9,mode:"chisel",sample:12},
    {id:"highlighter",name:"Highlighter",note:"Light transparent colour wash",size:58,opacity:.22,smoothing:.58,pressure:false,multiplier:2.1,mode:"marker",sample:13}
  ],
  textures:[
    {id:"stitch-line",name:"Stitch Line",note:"Even garment stitch trail",size:10,opacity:1,smoothing:.4,pressure:false,multiplier:1,mode:"stitch",sample:3},
    {id:"crochet-loop",name:"Crochet Loop",note:"Looped crochet texture",size:22,opacity:.86,smoothing:.3,pressure:false,multiplier:1,mode:"crochet",sample:7},
    {id:"knit-rib",name:"Knit Rib",note:"Ribbed knit texture",size:18,opacity:.82,smoothing:.35,pressure:false,multiplier:1,mode:"knit",sample:6},
    {id:"fuzzy-yarn",name:"Fuzzy Yarn",note:"Soft fluffy yarn texture",size:24,opacity:.66,smoothing:.2,pressure:false,multiplier:1,mode:"fuzzy",sample:8},
    {id:"rhinestones",name:"Rhinestones",note:"Sparkle detail trail",size:20,opacity:1,smoothing:.25,pressure:false,multiplier:1,mode:"bead",sample:7}
  ]
};

const state={
  tool:"brush",brushCategory:"pencils",brush:null,colour:"#f22278",brushSize:12,opacity:1,smoothing:.28,
  pressureEnabled:true,brushMultiplier:1,eraserSize:48,drawing:false,last:null,lastSpecial:null,
  selection:null,selectionStart:null,croquisBody:"classic",croquisView:"front",croquisOpacity:1,croquisHidden:false,
  referenceImage:null,referenceOpacity:.4,motif:null,motifScale:1,motifSpacing:90,motifRotation:0,lastStamp:null,
  layers:[],activeLayerId:null,history:[],historyIndex:-1,recentColours:[],
  zoom:1,fitScale:1,panX:0,panY:0,touches:new Map(),gesture:null
};

function newCanvas(){const c=document.createElement("canvas");c.width=W;c.height=H;return c}
function activeLayer(){return state.layers.find(l=>l.id===state.activeLayerId)||state.layers[0]}
function addLayer(name=""){const l={id:crypto.randomUUID?.()||String(Date.now()+Math.random()),name:String(name||"").trim(),visible:true,canvas:newCanvas()};state.layers.unshift(l);state.activeLayerId=l.id;renderLayerList();render();snapshot();return l}
function renameLayer(id){
  const layer=state.layers.find(l=>l.id===id);if(!layer)return;
  const next=prompt("Name this layer",layer.name||"");
  if(next===null)return;
  layer.name=String(next).trim();
  renderLayerList();snapshot();
}
function moveLayer(id,dir){
  const i=state.layers.findIndex(l=>l.id===id);if(i<0)return;
  const ni=i+dir;if(ni<0||ni>=state.layers.length)return;
  [state.layers[i],state.layers[ni]]=[state.layers[ni],state.layers[i]];
  renderLayerList();render();snapshot();
}
function showToast(m){toast.textContent=m;toast.classList.add("show");clearTimeout(showToast.t);showToast.t=setTimeout(()=>toast.classList.remove("show"),1400)}

const BRUSH_FAV_KEY="amea_design_brush_favorites";
let brushFavorites=new Set(JSON.parse(localStorage.getItem(BRUSH_FAV_KEY)||"[]"));
function allBrushes(){return Object.values(BRUSHES).flat()}
function brushIsFavorite(p){return brushFavorites.has(p.id)}
function toggleBrushFavorite(p){
  if(brushIsFavorite(p))brushFavorites.delete(p.id);else brushFavorites.add(p.id);
  localStorage.setItem(BRUSH_FAV_KEY,JSON.stringify([...brushFavorites]));
}
function syncActiveBrushCard(){
  const p=state.brush;if(!p)return;
  const name=$("#activeBrushName"),note=$("#activeBrushNote"),preview=$("#activeBrushPreview");
  if(name)name.textContent=p.name;
  if(note)note.textContent=p.note;
  if(preview)drawBrushPreview(preview,p);
}

function setColour(hex){state.colour=hex;$("#colourPicker").value=hex;$("#hexValue").textContent=hex.toUpperCase();const dot=$("#dockColourDot");if(dot)dot.style.background=hex;state.recentColours=[hex,...state.recentColours.filter(c=>c!==hex)].slice(0,8);renderRecentColours()}
function renderRecentColours(){const root=$("#recentColours");root.innerHTML="";state.recentColours.forEach(c=>{const b=document.createElement("button");b.style.setProperty("--swatch",c);b.onclick=()=>setColour(c);root.appendChild(b)})}

function drawBrushPreview(canvas,p){
  const c=canvas.getContext("2d"),w=canvas.width,h=canvas.height;
  c.clearRect(0,0,w,h);
  c.save();c.lineCap="round";c.lineJoin="round";c.strokeStyle="#33242c";c.fillStyle="#33242c";
  const curve=(offset,alpha,width,cap="round")=>{
    c.globalAlpha=alpha;c.lineWidth=width;c.lineCap=cap;c.beginPath();
    c.moveTo(9,h*.64+offset);
    c.bezierCurveTo(w*.22,h*.22+offset,w*.43,h*.86+offset,w*.67,h*.42+offset);
    c.bezierCurveTo(w*.79,h*.20+offset,w*.88,h*.38+offset,w-9,h*.28+offset);
    c.stroke();
  };
  if(p.mode==="stitch"){
    c.lineWidth=2.7;for(let x=12;x<w-12;x+=14){const y=h*.56+Math.sin(x*.09)*3;c.beginPath();c.moveTo(x-4,y+3);c.lineTo(x+5,y-3);c.stroke()}
  }else if(p.mode==="bead"){
    for(let x=14;x<w-10;x+=17){const y=h*.53+Math.sin(x*.14)*5;c.beginPath();c.arc(x,y,5,0,Math.PI*2);c.fill();c.fillStyle="#fff";c.globalAlpha=.6;c.beginPath();c.arc(x-1.4,y-1.5,1.4,0,Math.PI*2);c.fill();c.fillStyle="#33242c";c.globalAlpha=1}
  }else if(p.mode==="crochet"){
    c.lineWidth=2.1;for(let x=12;x<w-14;x+=12){const y=h*.54+Math.sin(x*.12)*3;c.beginPath();c.arc(x,y,5.4,0,Math.PI*2);c.stroke();c.beginPath();c.arc(x+5,y,5.4,0,Math.PI*2);c.stroke()}
  }else if(p.mode==="knit"){
    c.lineWidth=2;for(let x=12;x<w-11;x+=10){c.beginPath();c.moveTo(x,h*.72);c.quadraticCurveTo(x+5,h*.26,x+10,h*.72);c.stroke()}
  }else if(p.mode==="fuzzy"){
    curve(0,.5,6);c.globalAlpha=.4;c.lineWidth=1.2;
    for(let x=12;x<w-12;x+=5){const y=h*.52+Math.sin(x*.1)*6;for(let k=0;k<3;k++){const a=(x+k*17)*.57,r=4+k*2;c.beginPath();c.moveTo(x,y);c.lineTo(x+Math.cos(a)*r,y+Math.sin(a)*r);c.stroke()}}
  }else if(p.mode==="softpencil"){
    curve(-1,.40,6);curve(1,.34,4);curve(0,.28,2);
  }else if(p.mode==="roughpencil"){
    curve(-2,.33,4);curve(2,.24,3);curve(0,.27,2);
    c.globalAlpha=.18;c.lineWidth=1;
    for(let i=0;i<18;i++){const x=12+i*(w-24)/18,y=h*.54+Math.sin(i*.8)*9;c.beginPath();c.moveTo(x,y-3);c.lineTo(x+5,y+3);c.stroke()}
  }else if(p.mode==="pencil"){
    curve(-.8,.62,3);curve(.9,.26,1.4);
  }else if(p.mode==="chisel"){
    curve(0,p.opacity,Math.max(10,p.sample*1.25),"butt");
  }else if(p.mode==="marker"){
    curve(0,p.opacity,Math.max(10,p.sample*1.2));
  }else if(p.name==="Fine Liner"||p.name==="Technical Pencil"){
    curve(0,.98,2);
  }else if(p.name==="Monoline"){
    curve(0,1,5);
  }else{
    curve(0,.95,Math.max(2,p.sample));
  }
  c.restore();
}

function renderBrushes(category=state.brushCategory){
  state.brushCategory=category;
  $$(".category-chip").forEach(b=>b.classList.toggle("active",b.dataset.brushCategory===category));
  const list=category==="favorites"?allBrushes().filter(brushIsFavorite):(BRUSHES[category]||[]);
  const root=$("#brushPresets");root.innerHTML="";
  list.forEach(p=>{
    const b=document.createElement("button");
    b.className="brush-preset"+(state.brush?.id===p.id?" active":"");
    b.innerHTML='<canvas class="brush-preview-canvas" width="156" height="76"></canvas><span class="brush-preset-copy"><strong>'+p.name+'</strong><small>'+p.note+'</small></span><span class="fav-star" role="button" aria-label="'+(brushIsFavorite(p)?"Remove from favorites":"Add to favorites")+'">'+(brushIsFavorite(p)?"♥":"♡")+'</span>';
    b.onclick=e=>{
      const fav=e.target.closest(".fav-star");
      if(fav){e.preventDefault();e.stopPropagation();toggleBrushFavorite(p);renderBrushes(category);return}
      applyBrush(p);
    };
    root.appendChild(b);
    drawBrushPreview($(".brush-preview-canvas",b),p);
  });
  if(!list.length)root.innerHTML='<div class="brush-empty"><strong>No favorites yet</strong><small>Tap ♡ on any brush to keep it here.</small></div>';
}
function applyBrush(p){
  state.tool="brush";state.brush=p;state.brushSize=p.size;state.opacity=p.opacity;state.smoothing=p.smoothing;state.pressureEnabled=p.pressure;state.brushMultiplier=p.multiplier;
  $("#brushSize").value=p.size;$("#brushSizeValue").textContent=p.size;
  $("#brushOpacity").value=Math.round(p.opacity*100);$("#brushOpacityValue").textContent=Math.round(p.opacity*100)+"%";
  $("#brushSmoothing").value=Math.round(p.smoothing*100);$("#brushSmoothingValue").textContent=Math.round(p.smoothing*100)+"%";
  $("#pressureToggle").checked=p.pressure;
  $$(".quick-tool").forEach(b=>b.classList.remove("active"));
  syncActiveBrushCard();renderBrushes(state.brushCategory);showToast(p.name);
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

function drawHumanCroquis(t,bodyType,view,cx,top,scale=1){
  const curvy=bodyType==="curvy";
  const three=view==="threequarter";
  const back=view==="back";
  const shoulder=curvy?165:152;
  const bust=curvy?145:128;
  const waist=curvy?82:72;
  const hip=curvy?178:145;
  const thigh=curvy?112:92;
  const calf=curvy?58:50;
  const tilt=three?20:0;

  t.save();
  t.translate(cx+tilt,top);
  t.scale(scale,scale);
  if(three)t.transform(.94,0,-.055,1,10,0);

  t.strokeStyle="rgba(178,132,151,.72)";
  t.lineWidth=3/scale;
  t.lineCap="round";
  t.lineJoin="round";
  t.fillStyle="transparent";

  // head + simple face/hair guides
  t.beginPath();
  t.ellipse(three?7:0,90,58,80,three?-.08:0,0,Math.PI*2);
  t.stroke();

  if(!back){
    t.save();
    t.globalAlpha=.45;
    t.lineWidth=1.8/scale;
    t.beginPath();
    if(three){
      t.moveTo(13,60);t.quadraticCurveTo(29,90,16,121);
      t.moveTo(-5,88);t.lineTo(27,85);
    }else{
      t.moveTo(0,57);t.lineTo(0,122);
      t.moveTo(-26,88);t.quadraticCurveTo(0,95,26,88);
    }
    t.stroke();
    t.restore();
  }

  // neck and shoulder line
  t.beginPath();
  t.moveTo(-29,166);t.lineTo(-35,230);
  t.moveTo(29,166);t.lineTo(35,230);
  t.moveTo(-35,230);
  t.bezierCurveTo(-72,244,-shoulder,255,-shoulder,303);
  t.stroke();
  t.beginPath();
  t.moveTo(35,230);
  t.bezierCurveTo(72,244,shoulder,255,shoulder,303);
  t.stroke();

  // torso outline - clean fashion mannequin line only
  t.beginPath();
  t.moveTo(-shoulder,303);
  t.bezierCurveTo(-shoulder+4,360,-bust-10,430,-bust,500);
  t.bezierCurveTo(-bust+8,565,-waist-7,610,-waist,675);
  t.bezierCurveTo(-waist+3,730,-hip,774,-hip,845);
  t.bezierCurveTo(-hip+6,900,-112,935,-55,958);
  t.stroke();

  t.beginPath();
  t.moveTo(shoulder,303);
  t.bezierCurveTo(shoulder-4,360,bust+10,430,bust,500);
  t.bezierCurveTo(bust-8,565,waist+7,610,waist,675);
  t.bezierCurveTo(waist-3,730,hip,774,hip,845);
  t.bezierCurveTo(hip-6,900,112,935,55,958);
  t.stroke();

  // arms: simple outer + inner contour, easy to sketch over
  const drawArm=(side)=>{
    const q=side;
    const upper=q*(shoulder+12), elbow=q*(205+(curvy?8:0)), wrist=q*(194+(curvy?7:0));
    t.beginPath();
    t.moveTo(q*shoulder,300);
    t.bezierCurveTo(q*(shoulder+32),410,elbow,560,elbow,700);
    t.bezierCurveTo(elbow,830,wrist,945,wrist,1040);
    t.quadraticCurveTo(wrist-q*7,1080,wrist-q*26,1090);
    t.stroke();
    t.beginPath();
    t.moveTo(q*(shoulder-15),325);
    t.bezierCurveTo(q*(shoulder+1),455,q*(168+(curvy?5:0)),575,q*(166+(curvy?5:0)),700);
    t.bezierCurveTo(q*(165+(curvy?5:0)),825,wrist-q*30,940,wrist-q*34,1032);
    t.stroke();
    t.beginPath();
    t.moveTo(wrist-q*26,1090);
    t.quadraticCurveTo(wrist-q*9,1112,wrist+q*10,1082);
    t.stroke();
  };
  drawArm(-1);drawArm(1);

  // pelvis connection
  t.beginPath();
  t.moveTo(-55,958);
  t.quadraticCurveTo(0,986,55,958);
  t.stroke();

  // legs
  const drawLeg=(side)=>{
    const q=side;
    const outerHip=q*(hip*.74), innerHip=q*28;
    const outerKnee=q*thigh, innerKnee=q*38;
    const outerAnkle=q*calf, innerAnkle=q*24;
    t.beginPath();
    t.moveTo(outerHip,915);
    t.bezierCurveTo(q*(thigh+22),1090,outerKnee,1235,q*(86+(curvy?6:0)),1375);
    t.bezierCurveTo(q*(70+(curvy?4:0)),1515,outerAnkle,1660,outerAnkle,1772);
    t.stroke();
    t.beginPath();
    t.moveTo(innerHip,970);
    t.bezierCurveTo(q*54,1110,innerKnee,1240,q*48,1378);
    t.bezierCurveTo(q*38,1510,innerAnkle,1645,innerAnkle,1772);
    t.stroke();

    // foot
    t.beginPath();
    t.moveTo(outerAnkle,1772);
    t.quadraticCurveTo(q*(72+(curvy?4:0)),1797,q*(82+(curvy?5:0)),1811);
    t.quadraticCurveTo(q*46,1822,innerAnkle,1772);
    t.stroke();
  };
  drawLeg(-1);drawLeg(1);

  // only a few subtle construction cues
  t.save();
  t.globalAlpha=.35;
  t.lineWidth=1.7/scale;
  if(back){
    t.beginPath();
    t.moveTo(0,238);t.bezierCurveTo(-3,440,3,650,0,892);t.stroke();
    t.beginPath();
    t.moveTo(-70,836);t.quadraticCurveTo(0,875,70,836);t.stroke();
  }else if(three){
    t.beginPath();
    t.moveTo(15,245);t.bezierCurveTo(5,440,18,640,12,885);t.stroke();
    t.beginPath();
    t.moveTo(-60,520);t.quadraticCurveTo(18,548,90,512);t.stroke();
  }else{
    t.beginPath();
    t.moveTo(-84,515);t.quadraticCurveTo(0,548,84,515);t.stroke();
    t.beginPath();
    t.moveTo(0,675);t.lineTo(0,890);t.stroke();
  }
  t.restore();

  t.restore();
}

function drawCroquis(t){
  if(state.croquisHidden)return;
  t.save();
  t.globalAlpha=state.croquisOpacity;
  drawHumanCroquis(t,state.croquisBody,state.croquisView,W/2,105,1);
  t.restore();
}

function renderBodyTypePreviews(){
  $$("[data-body-preview]").forEach(c=>{
    const pc=c.getContext("2d");
    pc.clearRect(0,0,c.width,c.height);
    drawHumanCroquis(pc,c.dataset.bodyPreview,"front",c.width/2,3,.075);
  });
}

function render(){
  ctx.clearRect(0,0,W,H);ctx.fillStyle="#fff";ctx.fillRect(0,0,W,H);
  if(state.referenceImage){ctx.save();ctx.globalAlpha=state.referenceOpacity;const i=state.referenceImage,s=Math.min((W*.82)/i.width,(H*.82)/i.height),iw=i.width*s,ih=i.height*s;ctx.drawImage(i,(W-iw)/2,(H-ih)/2,iw,ih);ctx.restore()}
  drawCroquis(ctx);
  [...state.layers].reverse().forEach(l=>{if(l.visible)ctx.drawImage(l.canvas,0,0)});
  if(state.selection){ctx.save();ctx.strokeStyle="#f22278";ctx.lineWidth=5;ctx.setLineDash([18,14]);ctx.strokeRect(state.selection.x,state.selection.y,state.selection.w,state.selection.h);ctx.restore()}
}

function drawSpecial(l,p){
  const b=state.brush||BRUSHES.pencils[0],last=state.lastSpecial||p,dist=Math.hypot(p.x-last.x,p.y-last.y),spacing=Math.max(14,state.brushSize*1.5);
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
  const b=state.brush||BRUSHES.pencils[0];
  if(["stitch","bead","crochet","knit","fuzzy"].includes(b.mode)){drawSpecial(l,p);state.last=p;render();return}
  l.save();l.globalCompositeOperation="source-over";l.strokeStyle=state.colour;l.globalAlpha=state.opacity;l.lineCap="round";l.lineJoin="round";
  const pressure=state.pressureEnabled?(.58+p.pressure*.92):1,smooth=Math.min(.8,state.smoothing*.8),tx=prev.x+(p.x-prev.x)*(1-smooth),ty=prev.y+(p.y-prev.y)*(1-smooth);
  let width=state.brushSize*state.brushMultiplier*pressure;
  if(b.mode==="pencil")l.globalAlpha*=.82;
  if(b.mode==="softpencil")l.globalAlpha*=.72;
  if(b.mode==="roughpencil")l.globalAlpha*=.64;
  if(b.mode==="marker"||b.mode==="chisel")l.globalAlpha*=.94;
  l.lineWidth=width;
  if(b.mode==="chisel")l.lineCap="butt";
  l.beginPath();l.moveTo(prev.x,prev.y);l.lineTo(tx,ty);l.stroke();
  if(b.mode==="softpencil"||b.mode==="roughpencil"){
    l.globalAlpha*=.32;l.lineWidth=Math.max(1,width*.38);
    l.beginPath();l.moveTo(prev.x+2,prev.y-1);l.lineTo(tx+2,ty-1);l.stroke();
  }
  l.restore();state.last={x:tx,y:ty,pressure:p.pressure};render();
}
function pickColour(p){render();const px=ctx.getImageData(Math.max(0,Math.min(W-1,Math.round(p.x))),Math.max(0,Math.min(H-1,Math.round(p.y))),1,1).data;setColour("#"+[px[0],px[1],px[2]].map(v=>v.toString(16).padStart(2,"0")).join(""));state.tool="brush";showToast("Colour picked")}
function rect(a,b){return{x:Math.min(a.x,b.x),y:Math.min(a.y,b.y),w:Math.abs(a.x-b.x),h:Math.abs(a.y-b.y)}}
function stampMotif(p,random=false){if(!state.motif){showToast("Create a motif first ✿");return}const l=activeLayer().canvas.getContext("2d"),m=state.motif,s=state.motifScale*(random?(.8+Math.random()*.4):1),w=m.width*s,h=m.height*s,r=(state.motifRotation+(random?(Math.random()*24-12):0))*Math.PI/180;l.save();l.translate(p.x,p.y);l.rotate(r);l.drawImage(m,-w/2,-h/2,w,h);l.restore();render()}
function createMotif(){if(!state.selection||state.selection.w<8||state.selection.h<8){showToast("Select your motif first");return}const s=state.selection,m=document.createElement("canvas");m.width=Math.round(s.w);m.height=Math.round(s.h);const mc=m.getContext("2d");[...state.layers].reverse().forEach(l=>{if(l.visible)mc.drawImage(l.canvas,s.x,s.y,s.w,s.h,0,0,m.width,m.height)});state.motif=m;const p=$("#motifPreview"),pc=p.getContext("2d");pc.clearRect(0,0,p.width,p.height);const sc=Math.min((p.width-18)/m.width,(p.height-18)/m.height);pc.drawImage(m,(p.width-m.width*sc)/2,(p.height-m.height*sc)/2,m.width*sc,m.height*sc);$("#motifStatus").textContent="Motif saved ✓";showToast("Motif saved")}
function patternFill(){if(!state.selection||!state.motif){showToast("Select an area and create a motif first");return}const s=state.selection,g=Math.max(20,state.motifSpacing),old=state.selection;state.selection=null;for(let y=s.y+g/2;y<s.y+s.h;y+=g)for(let x=s.x+g/2;x<s.x+s.w;x+=g)stampMotif({x,y},false);state.selection=old;render();snapshot()}

function renderLayerList(){
  const root=$("#layerList");root.innerHTML="";
  state.layers.forEach((layer,index)=>{
    const row=document.createElement("div");
    row.className="layer-item"+(layer.id===state.activeLayerId?" active":"");
    row.innerHTML=
      '<button class="layer-eye" aria-label="'+(layer.visible?'Hide':'Show')+' layer">'+
        (layer.visible?'<svg viewBox="0 0 24 24"><path d="M2.8 12s3.4-5 9.2-5 9.2 5 9.2 5-3.4 5-9.2 5-9.2-5-9.2-5Z"/><circle cx="12" cy="12" r="2.4"/></svg>':'<svg viewBox="0 0 24 24"><path d="M4 4l16 16M9.5 7.3A9.8 9.8 0 0 1 12 7c5.8 0 9.2 5 9.2 5a15.7 15.7 0 0 1-2.1 2.5M14.4 16.7A9.7 9.7 0 0 1 12 17c-5.8 0-9.2-5-9.2-5a15.9 15.9 0 0 1 2.1-2.6"/></svg>')+
      '</button>'+
      '<button class="layer-name" aria-label="Rename layer">'+(layer.name?escapeHtml(layer.name):'<span>Tap to name</span>')+'</button>'+
      '<span class="layer-order">'+
        '<button class="layer-up" aria-label="Move layer up" '+(index===0?'disabled':'')+'>↑</button>'+
        '<button class="layer-down" aria-label="Move layer down" '+(index===state.layers.length-1?'disabled':'')+'>↓</button>'+
      '</span>'+
      '<button class="layer-delete" aria-label="Delete layer">×</button>';
    row.onclick=e=>{
      const btn=e.target.closest("button");
      if(btn?.classList.contains("layer-eye"))layer.visible=!layer.visible;
      else if(btn?.classList.contains("layer-name")){renameLayer(layer.id);return}
      else if(btn?.classList.contains("layer-up")){moveLayer(layer.id,-1);return}
      else if(btn?.classList.contains("layer-down")){moveLayer(layer.id,1);return}
      else if(btn?.classList.contains("layer-delete")){
        if(state.layers.length===1){showToast("Keep at least one layer");return}
        state.layers=state.layers.filter(l=>l.id!==layer.id);
        if(state.activeLayerId===layer.id)state.activeLayerId=state.layers[0]?.id||null;
        snapshot();
      }else state.activeLayerId=layer.id;
      renderLayerList();render();
    };
    root.appendChild(row);
  });
}
function escapeHtml(v){return v.replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[ch]))}
function serializeLayers(){return state.layers.map(l=>({id:l.id,name:l.name,visible:l.visible,data:l.canvas.toDataURL("image/png")}))}
function snapshot(){const s={layers:serializeLayers(),activeLayerId:state.activeLayerId,croquisBody:state.croquisBody,croquisView:state.croquisView,croquisOpacity:state.croquisOpacity,croquisHidden:state.croquisHidden};state.history=state.history.slice(0,state.historyIndex+1);state.history.push(s);if(state.history.length>20)state.history.shift();state.historyIndex=state.history.length-1}
async function restore(s){const layers=[];for(const d of s.layers){const c=newCanvas(),i=new Image();await new Promise(r=>{i.onload=r;i.src=d.data});c.getContext("2d").drawImage(i,0,0);layers.push({id:d.id,name:d.name,visible:d.visible,canvas:c})}state.layers=layers;state.activeLayerId=s.activeLayerId;state.croquisBody=s.croquisBody||"classic";state.croquisView=s.croquisView||"front";state.croquisOpacity=s.croquisOpacity??1;state.croquisHidden=s.croquisHidden??false;syncCroquisUI();renderLayerList();render()}
async function undo(){if(state.historyIndex<=0)return;state.historyIndex--;await restore(state.history[state.historyIndex])}
async function redo(){if(state.historyIndex>=state.history.length-1)return;state.historyIndex++;await restore(state.history[state.historyIndex])}
function exportPNG(){const c=newCanvas(),x=c.getContext("2d");x.fillStyle="#fff";x.fillRect(0,0,W,H);drawCroquis(x);[...state.layers].reverse().forEach(l=>{if(l.visible)x.drawImage(l.canvas,0,0)});const a=document.createElement("a"),safe=($("#designName").value||"amea-design").trim().replace(/[^a-z0-9-_]+/gi,"-");a.download=(safe||"amea-design")+".png";a.href=c.toDataURL("image/png");a.click();showToast("Exported ✓")}

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
function chooseBody(type){state.croquisBody=type;syncCroquisUI();render();snapshot()}
function chooseView(view){state.croquisView=view;syncCroquisUI();render();snapshot()}
$("[data-body-type]").forEach(b=>b.onclick=()=>chooseBody(b.dataset.bodyType));
$("[data-view]").forEach(b=>b.onclick=()=>chooseView(b.dataset.view));
function syncCroquisUI(){
  $("[data-body-type]").forEach(b=>b.classList.toggle("active",b.dataset.bodyType===state.croquisBody));
  $("[data-view]").forEach(b=>b.classList.toggle("active",b.dataset.view===state.croquisView));
  $("#activeBodyLabel").textContent=state.croquisBody==="curvy"?"Curvy":"Classic";
  $("#croquisOpacity").value=Math.round(state.croquisOpacity*100);
  $("#croquisOpacityValue").textContent=Math.round(state.croquisOpacity*100)+"%";
  $("#hideCroquis").checked=state.croquisHidden;
}
$("#croquisOpacity").oninput=e=>{state.croquisOpacity=+e.target.value/100;$("#croquisOpacityValue").textContent=e.target.value+"%";render()};
$("#hideCroquis").onchange=e=>{state.croquisHidden=e.target.checked;render();snapshot()};

$("#motifSize").oninput=e=>{state.motifScale=+e.target.value/100;$("#motifSizeValue").textContent=e.target.value+"%"};
$("#motifSpacing").oninput=e=>{state.motifSpacing=+e.target.value;$("#motifSpacingValue").textContent=e.target.value};
$("#motifRotation").oninput=e=>{state.motifRotation=+e.target.value;$("#motifRotationValue").textContent=e.target.value+"°"};
$("#createMotifBtn").onclick=createMotif;$("#clearMotifBtn").onclick=()=>{state.motif=null;$("#motifPreview").getContext("2d").clearRect(0,0,220,160);$("#motifStatus").textContent="No motif saved"};

$("#addLayerBtn").onclick=()=>{const l=addLayer("");const name=prompt("Name this layer","");if(name!==null){l.name=String(name).trim();renderLayerList();snapshot()}};
$("#clearLayerBtn").onclick=()=>{const l=activeLayer();if(!l)return;if(confirm("Clear active layer?")){l.canvas.getContext("2d").clearRect(0,0,W,H);render();snapshot()}};

$("#referenceUpload").onchange=e=>{const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=()=>{const i=new Image();i.onload=()=>{state.referenceImage=i;render();showToast("Reference added")};i.src=r.result};r.readAsDataURL(f)};
$("#referenceOpacity").oninput=e=>{state.referenceOpacity=+e.target.value/100;$("#referenceOpacityValue").textContent=e.target.value+"%";render()};
$("#removeReferenceBtn").onclick=()=>{state.referenceImage=null;$("#referenceUpload").value="";render()};

function togglePanel(side,open){const cls=side+"-collapsed";open?shell.classList.remove(cls):shell.classList.add(cls);requestAnimationFrame(()=>requestAnimationFrame(fitCanvas))}
$("#toggleLeft").onclick=()=>togglePanel("left",false);$("#toggleRight").onclick=()=>togglePanel("right",false);$("#reopenLeft").onclick=()=>togglePanel("left",true);$("#reopenRight").onclick=()=>togglePanel("right",true);$("#openBrushesDock").onclick=()=>togglePanel("left",true);$("#openStudioDock").onclick=()=>togglePanel("right",true);$("#openColourDock").onclick=()=>{togglePanel("right",true);const tab=$('.tab-btn[data-tab="colour"]');if(tab)tab.click()};

$("#undoBtn").onclick=undo;$("#redoBtn").onclick=redo;$("#exportBtn").onclick=exportPNG;
window.addEventListener("resize",()=>requestAnimationFrame(fitCanvas));
window.addEventListener("keydown",e=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==="z"){e.preventDefault();e.shiftKey?redo():undo()}});

addLayer("");
state.history=[];state.historyIndex=-1;
state.brush=BRUSHES.pencils[0];renderBrushes("pencils");applyBrush(state.brush);setColour(state.colour);renderBodyTypePreviews();syncCroquisUI();renderLayerList();render();snapshot();requestAnimationFrame(fitCanvas);
})();