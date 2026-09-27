(() => {
  "use strict";

  const W=1800,H=2200,BASE_W=720,BASE_H=880;
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const artboard=$("#artboard"),ctx=artboard.getContext("2d",{willReadFrequently:true});
  const shell=$("#studioShell"),viewport=$("#canvasViewport"),transform=$("#canvasTransform"),toast=$("#toast");

  const BRUSH_PRESETS={
    pencil:[
      {name:"Studio Pencil",note:"Clean fashion sketch",size:12,opacity:1,smoothing:.28,pressure:true,multiplier:1,sample:3},
      {name:"Technical Pencil",note:"Fine crisp line",size:7,opacity:1,smoothing:.12,pressure:true,multiplier:.78,sample:2},
      {name:"6B Pencil",note:"Soft dark sketch",size:24,opacity:.82,smoothing:.34,pressure:true,multiplier:1.15,sample:6},
      {name:"Soft Sketch",note:"Loose planning line",size:20,opacity:.42,smoothing:.5,pressure:true,multiplier:1.2,sample:5}
    ],
    marker:[
      {name:"Studio Marker",note:"Smooth solid colour",size:28,opacity:.88,smoothing:.34,pressure:true,multiplier:1.5,sample:8},
      {name:"Brush Marker",note:"Pressure-sensitive stroke",size:34,opacity:.94,smoothing:.46,pressure:true,multiplier:1.7,sample:10},
      {name:"Chisel Marker",note:"Bold edge",size:34,opacity:.9,smoothing:.2,pressure:false,multiplier:1.9,sample:9},
      {name:"Highlighter",note:"Transparent colour wash",size:56,opacity:.24,smoothing:.58,pressure:false,multiplier:2.1,sample:13}
    ]
  };
  const BODY={
    standard:{shoulders:1,waist:1,hips:1,head:1},
    petite:{shoulders:.94,waist:.96,hips:.97,head:1.03},
    curvy:{shoulders:.98,waist:.82,hips:1.16,head:1},
    plus:{shoulders:1.08,waist:1.13,hips:1.2,head:1.02}
  };

  const state={
    tool:"pencil",colour:"#e24892",brushSize:12,opacity:1,smoothing:.28,pressureEnabled:true,brushMultiplier:1,
    drawing:false,last:null,selection:null,selectionStart:null,
    template:"front",mannequinStyle:"fashion",bodyType:"standard",mannequinOpacity:1,showFaceGuide:true,showCenterGuide:true,
    referenceImage:null,referenceOpacity:.4,motif:null,motifScale:1,motifSpacing:90,motifRotation:0,
    layers:[],activeLayerId:null,history:[],historyIndex:-1,recentColours:[],
    zoom:1,fitScale:1,panX:0,panY:0,touches:new Map(),gesture:null
  };

  function newCanvas(){const c=document.createElement("canvas");c.width=W;c.height=H;return c}
  function activeLayer(){return state.layers.find(l=>l.id===state.activeLayerId)||state.layers[0]}
  function addLayer(name="Sketch"){
    const layer={id:(crypto.randomUUID?.()||String(Date.now()+Math.random())),name,visible:true,canvas:newCanvas()};
    state.layers.unshift(layer);state.activeLayerId=layer.id;renderLayerList();render();snapshot();return layer;
  }
  function showToast(msg){toast.textContent=msg;toast.classList.add("show");clearTimeout(showToast.t);showToast.t=setTimeout(()=>toast.classList.remove("show"),1500)}

  function setColour(hex){
    state.colour=hex;
    $("#colourPicker").value=hex;
    $("#hexValue").textContent=hex.toUpperCase();
    state.recentColours=[hex,...state.recentColours.filter(c=>c!==hex)].slice(0,8);
    renderRecentColours();
  }
  function renderRecentColours(){
    const root=$("#recentColours");root.innerHTML="";
    state.recentColours.forEach(c=>{const b=document.createElement("button");b.style.setProperty("--swatch",c);b.onclick=()=>setColour(c);root.appendChild(b)});
  }

  function openBrushLibrary(kind){
    const list=BRUSH_PRESETS[kind];if(!list)return;
    $("#brushLibraryTitle").textContent=kind==="marker"?"Marker Brushes":"Pencil Brushes";
    const root=$("#brushPresets");root.innerHTML="";
    list.forEach(p=>{
      const b=document.createElement("button");
      b.className="brush-preset"+(state.brushPreset===p.name?" active":"");
      b.innerHTML=`<span class="brush-sample"><i style="height:${p.sample}px"></i></span><span><strong>${p.name}</strong><small>${p.note}</small></span>`;
      b.onclick=()=>applyBrushPreset(kind,p);
      root.appendChild(b);
    });
  }
  function applyBrushPreset(kind,p){
    state.tool=kind;state.brushPreset=p.name;state.brushSize=p.size;state.opacity=p.opacity;state.smoothing=p.smoothing;state.pressureEnabled=p.pressure;state.brushMultiplier=p.multiplier;
    $("#brushSize").value=p.size;$("#brushSizeValue").textContent=p.size;
    $("#brushOpacity").value=Math.round(p.opacity*100);$("#brushOpacityValue").textContent=Math.round(p.opacity*100)+"%";
    $("#brushSmoothing").value=Math.round(p.smoothing*100);$("#brushSmoothingValue").textContent=Math.round(p.smoothing*100)+"%";
    $("#pressureToggle").checked=p.pressure;
    $$(".tool-btn").forEach(btn=>btn.classList.toggle("active",btn.dataset.tool===kind));
    openBrushLibrary(kind);showToast(p.name);
  }
  function setTool(tool){
    state.tool=tool;
    $$(".tool-btn").forEach(btn=>btn.classList.toggle("active",btn.dataset.tool===tool));
    if(tool==="pencil"||tool==="marker")openBrushLibrary(tool);
    if(["stamp","scatter","fillpattern"].includes(tool)&&!state.motif)showToast("Create a motif first ✿");
  }

  function fitCanvas(){
    const r=viewport.getBoundingClientRect(),margin=shell.classList.contains("left-collapsed")&&shell.classList.contains("right-collapsed")?0:30;
    state.fitScale=Math.min((r.width-margin)/BASE_W,(r.height-margin)/BASE_H);
    state.zoom=1;
    state.panX=(r.width-BASE_W*state.fitScale)/2;
    state.panY=(r.height-BASE_H*state.fitScale)/2;
    applyTransform();
  }
  function applyTransform(){
    const scale=state.fitScale*state.zoom;
    transform.style.transform=`translate3d(${state.panX}px,${state.panY}px,0) scale(${scale})`;
    $("#zoomReadout").textContent=Math.round(state.zoom*100)+"%";
  }
  function zoomAt(factor,clientX,clientY){
    const vr=viewport.getBoundingClientRect();
    const mx=clientX-vr.left,my=clientY-vr.top;
    const oldScale=state.fitScale*state.zoom;
    const contentX=(mx-state.panX)/oldScale,contentY=(my-state.panY)/oldScale;
    state.zoom=Math.max(.2,Math.min(5,state.zoom*factor));
    const newScale=state.fitScale*state.zoom;
    state.panX=mx-contentX*newScale;state.panY=my-contentY*newScale;applyTransform();
  }
  viewport.addEventListener("wheel",e=>{e.preventDefault();zoomAt(e.deltaY<0?1.08:.92,e.clientX,e.clientY)},{passive:false});
  $("#fitCanvasBtn").onclick=fitCanvas;

  function pagePoint(e){
    const r=artboard.getBoundingClientRect();
    return {x:(e.clientX-r.left)*(W/r.width),y:(e.clientY-r.top)*(H/r.height),pressure:e.pointerType==="pen"&&e.pressure>0?e.pressure:.5};
  }
  function startTouchGesture(){
    const pts=[...state.touches.values()];
    if(pts.length===1){
      state.gesture={type:"pan",startX:pts[0].x,startY:pts[0].y,panX:state.panX,panY:state.panY};
    } else if(pts.length>=2){
      const [a,b]=pts;
      const mid={x:(a.x+b.x)/2,y:(a.y+b.y)/2};
      state.gesture={type:"pinch",dist:Math.hypot(a.x-b.x,a.y-b.y),zoom:state.zoom,mid,panX:state.panX,panY:state.panY};
    }
  }
  function updateTouchGesture(){
    const pts=[...state.touches.values()];
    if(pts.length>=2){
      const [a,b]=pts,dist=Math.hypot(a.x-b.x,a.y-b.y),mid={x:(a.x+b.x)/2,y:(a.y+b.y)/2};
      if(!state.gesture||state.gesture.type!=="pinch")startTouchGesture();
      const g=state.gesture,vr=viewport.getBoundingClientRect(),mx=mid.x-vr.left,my=mid.y-vr.top;
      const startMidX=g.mid.x-vr.left,startMidY=g.mid.y-vr.top,oldScale=state.fitScale*g.zoom;
      const contentX=(startMidX-g.panX)/oldScale,contentY=(startMidY-g.panY)/oldScale;
      state.zoom=Math.max(.2,Math.min(5,g.zoom*(dist/g.dist)));
      const newScale=state.fitScale*state.zoom;
      state.panX=mx-contentX*newScale;state.panY=my-contentY*newScale;applyTransform();
    } else if(pts.length===1&&state.gesture?.type==="pan"){
      const p=pts[0];state.panX=state.gesture.panX+(p.x-state.gesture.startX);state.panY=state.gesture.panY+(p.y-state.gesture.startY);applyTransform();
    }
  }

  function body(){return BODY[state.bodyType]||BODY.standard}
  function drawMannequin(t,view){
    if(view==="blank")return;
    state.mannequinStyle==="realistic"?drawRealistic(t,view):drawFashion(t,view);
  }
  function drawHead(t,cx,y,w,h){
    if(!state.showFaceGuide)return;
    t.beginPath();t.ellipse(cx,y,w,h,0,0,Math.PI*2);t.fill();t.stroke();
  }
  function drawFashion(t,view){
    const b=body(),cx=W/2,y=55;
    t.save();t.globalAlpha=state.mannequinOpacity;t.strokeStyle="#c8b7c0";t.fillStyle="#fcf7f9";t.lineWidth=6;t.lineCap="round";t.lineJoin="round";
    drawHead(t,cx,190+y,(view==="side"?70:100)*b.head,130*b.head);
    if(view==="side"){
      t.beginPath();t.moveTo(cx-10,330+y);t.bezierCurveTo(cx+100,470+y,cx+100,720+y,cx+45,850+y);t.bezierCurveTo(cx+90,970+y,cx+80,1120+y,cx+55,1280+y);t.lineTo(cx+25,1945);t.lineTo(cx+75,2040);
      t.moveTo(cx-10,330+y);t.bezierCurveTo(cx-75,480+y,cx-72,720+y,cx-32,850+y);t.bezierCurveTo(cx-5,1010+y,cx-35,1310+y,cx-8,1950);t.lineTo(cx-45,2035);t.stroke();
      t.beginPath();t.moveTo(cx+35,500+y);t.bezierCurveTo(cx+160,760+y,cx+135,1050+y,cx+90,1270+y);t.stroke();
    }else{
      const shoulder=190*b.shoulders,waist=92*b.waist,hip=150*b.hips,shift=view==="threequarter"?25:0;
      t.beginPath();
      t.moveTo(cx-48+shift,325+y);t.bezierCurveTo(cx-shoulder+shift,450+y,cx-175+shift,690+y,cx-waist+shift,820+y);t.bezierCurveTo(cx-92+shift,910+y,cx-90+shift,1010+y,cx-hip+shift,1110+y);t.bezierCurveTo(cx-140+shift,1330+y,cx-102+shift,1560+y,cx-75+shift,1945);t.lineTo(cx-120+shift,2040);
      t.moveTo(cx+48+shift,325+y);t.bezierCurveTo(cx+shoulder+shift,450+y,cx+175+shift,690+y,cx+waist+shift,820+y);t.bezierCurveTo(cx+92+shift,910+y,cx+90+shift,1010+y,cx+hip+shift,1110+y);t.bezierCurveTo(cx+140+shift,1330+y,cx+102+shift,1560+y,cx+75+shift,1945);t.lineTo(cx+120+shift,2040);t.stroke();
      t.beginPath();t.moveTo(cx-52+shift,435+y);t.bezierCurveTo(cx-245+shift,455+y,cx-310+shift,570+y,cx-360+shift,760+y);t.bezierCurveTo(cx-415+shift,930+y,cx-410+shift,1115+y,cx-375+shift,1310+y);
      t.moveTo(cx+52+shift,435+y);t.bezierCurveTo(cx+245+shift,455+y,cx+310+shift,570+y,cx+360+shift,760+y);t.bezierCurveTo(cx+415+shift,930+y,cx+410+shift,1115+y,cx+375+shift,1310+y);t.stroke();
      t.beginPath();t.moveTo(cx-10+shift,1120+y);t.lineTo(cx-12+shift,1945);t.moveTo(cx+10+shift,1120+y);t.lineTo(cx+12+shift,1945);t.stroke();
      if(state.showCenterGuide){t.strokeStyle="#eadfe4";t.lineWidth=3;t.setLineDash([18,20]);t.beginPath();t.moveTo(cx+shift,360+y);t.lineTo(cx+shift,1980);t.stroke();t.setLineDash([])}
    }
    t.restore();
  }
  function drawRealistic(t,view){
    const b=body(),cx=W/2,y=65;
    t.save();t.globalAlpha=state.mannequinOpacity;t.strokeStyle="#c5b3bc";t.fillStyle="#f7f1f4";t.lineWidth=5;t.lineCap="round";t.lineJoin="round";
    drawHead(t,cx,205+y,(view==="side"?74:106)*b.head,136*b.head);
    if(view==="side"){
      t.beginPath();t.moveTo(cx,345+y);t.bezierCurveTo(cx+115,510+y,cx+118,720+y,cx+52,870+y);t.bezierCurveTo(cx+100,970+y,cx+92,1100+y,cx+80,1220+y);t.bezierCurveTo(cx+58,1440+y,cx+40,1690+y,cx+28,1960);t.lineTo(cx+88,2040);
      t.moveTo(cx,345+y);t.bezierCurveTo(cx-90,500+y,cx-95,715+y,cx-38,875+y);t.bezierCurveTo(cx-8,1000+y,cx-25,1250+y,cx-12,1960);t.lineTo(cx-60,2040);t.stroke();
    }else{
      const shoulder=205*b.shoulders,waist=100*b.waist,hip=165*b.hips,shift=view==="threequarter"?28:0;
      t.beginPath();t.moveTo(cx-68+shift,345+y);t.bezierCurveTo(cx-shoulder+shift,400+y,cx-190+shift,650+y,cx-waist+shift,855+y);t.bezierCurveTo(cx-90+shift,960+y,cx-96+shift,1050+y,cx-hip+shift,1140+y);t.bezierCurveTo(cx-152+shift,1360+y,cx-120+shift,1630+y,cx-78+shift,1960);t.lineTo(cx-125+shift,2040);
      t.moveTo(cx+68+shift,345+y);t.bezierCurveTo(cx+shoulder+shift,400+y,cx+190+shift,650+y,cx+waist+shift,855+y);t.bezierCurveTo(cx+90+shift,960+y,cx+96+shift,1050+y,cx+hip+shift,1140+y);t.bezierCurveTo(cx+152+shift,1360+y,cx+120+shift,1630+y,cx+78+shift,1960);t.lineTo(cx+125+shift,2040);t.stroke();
      t.beginPath();t.moveTo(cx-70+shift,450+y);t.bezierCurveTo(cx-250+shift,470+y,cx-315+shift,590+y,cx-365+shift,770+y);t.bezierCurveTo(cx-405+shift,930+y,cx-405+shift,1100+y,cx-378+shift,1280+y);
      t.moveTo(cx+70+shift,450+y);t.bezierCurveTo(cx+250+shift,470+y,cx+315+shift,590+y,cx+365+shift,770+y);t.bezierCurveTo(cx+405+shift,930+y,cx+405+shift,1100+y,cx+378+shift,1280+y);t.stroke();
      if(state.showCenterGuide){t.strokeStyle="#eadfe4";t.lineWidth=3;t.setLineDash([18,20]);t.beginPath();t.moveTo(cx+shift,360+y);t.lineTo(cx+shift,1990);t.stroke();t.setLineDash([])}
    }
    t.restore();
  }

  function render(){
    ctx.clearRect(0,0,W,H);ctx.fillStyle="#fff";ctx.fillRect(0,0,W,H);
    if(state.referenceImage){
      ctx.save();ctx.globalAlpha=state.referenceOpacity;const img=state.referenceImage,sc=Math.min((W*.82)/img.width,(H*.82)/img.height),iw=img.width*sc,ih=img.height*sc;ctx.drawImage(img,(W-iw)/2,(H-ih)/2,iw,ih);ctx.restore();
    }
    drawMannequin(ctx,state.template);
    [...state.layers].reverse().forEach(l=>{if(l.visible)ctx.drawImage(l.canvas,0,0)});
    if(state.selection)drawSelection(ctx,state.selection);
  }
  function drawSelection(t,s){t.save();t.strokeStyle="#e24892";t.lineWidth=5;t.setLineDash([18,14]);t.strokeRect(s.x,s.y,s.w,s.h);t.restore()}

  function strokeTo(p){
    const layer=activeLayer();if(!layer)return;const l=layer.canvas.getContext("2d"),prev=state.last||p;
    l.save();l.lineCap="round";l.lineJoin="round";l.globalAlpha=state.opacity;
    if(state.tool==="eraser"){l.globalCompositeOperation="destination-out";l.strokeStyle="#000";l.lineWidth=state.brushSize*2.2}
    else{l.globalCompositeOperation="source-over";l.strokeStyle=state.colour;const pressure=state.pressureEnabled?(.58+p.pressure*.92):1;l.lineWidth=state.brushSize*state.brushMultiplier*pressure}
    const smooth=Math.min(.8,state.smoothing*.8),tx=prev.x+(p.x-prev.x)*(1-smooth),ty=prev.y+(p.y-prev.y)*(1-smooth);
    l.beginPath();l.moveTo(prev.x,prev.y);l.lineTo(tx,ty);l.stroke();l.restore();state.last={x:tx,y:ty,pressure:p.pressure};render();
  }
  function pickColour(p){render();const px=ctx.getImageData(Math.max(0,Math.min(W-1,Math.round(p.x))),Math.max(0,Math.min(H-1,Math.round(p.y))),1,1).data;const hex="#"+[px[0],px[1],px[2]].map(v=>v.toString(16).padStart(2,"0")).join("");setColour(hex);setTool("pencil");showToast("Colour picked")}
  function rect(a,b){return{x:Math.min(a.x,b.x),y:Math.min(a.y,b.y),w:Math.abs(a.x-b.x),h:Math.abs(a.y-b.y)}}
  function stampMotif(p,random=false){
    if(!state.motif){showToast("Create a motif first ✿");return}
    const l=activeLayer().canvas.getContext("2d"),m=state.motif,sc=state.motifScale*(random?(.8+Math.random()*.4):1),w=m.width*sc,h=m.height*sc,rot=(state.motifRotation+(random?(Math.random()*24-12):0))*Math.PI/180;
    l.save();l.translate(p.x,p.y);l.rotate(rot);l.drawImage(m,-w/2,-h/2,w,h);l.restore();render();
  }
  function createMotif(){
    if(!state.selection||state.selection.w<8||state.selection.h<8){showToast("Select your motif first");return}
    const s=state.selection,m=document.createElement("canvas");m.width=Math.round(s.w);m.height=Math.round(s.h);const mc=m.getContext("2d");
    [...state.layers].reverse().forEach(l=>{if(l.visible)mc.drawImage(l.canvas,s.x,s.y,s.w,s.h,0,0,m.width,m.height)});
    state.motif=m;const p=$("#motifPreview"),pc=p.getContext("2d");pc.clearRect(0,0,p.width,p.height);const sc=Math.min((p.width-18)/m.width,(p.height-18)/m.height);pc.drawImage(m,(p.width-m.width*sc)/2,(p.height-m.height*sc)/2,m.width*sc,m.height*sc);$("#motifStatus").textContent="Motif saved ✓";showToast("Motif saved");
  }
  function patternFill(){
    if(!state.selection||!state.motif){showToast("Select an area and create a motif first");return}
    const s=state.selection,g=Math.max(20,state.motifSpacing),old=state.selection;state.selection=null;
    for(let y=s.y+g/2;y<s.y+s.h;y+=g)for(let x=s.x+g/2;x<s.x+s.w;x+=g)stampMotif({x,y},false);
    state.selection=old;render();snapshot();
  }

  function renderLayerList(){
    const root=$("#layerList");root.innerHTML="";
    state.layers.forEach(layer=>{
      const row=document.createElement("div");row.className="layer-item"+(layer.id===state.activeLayerId?" active":"");
      row.innerHTML=`<button class="layer-eye">${layer.visible?"◉":"○"}</button><div class="layer-name">${escapeHtml(layer.name)}</div><button class="layer-delete">×</button>`;
      row.onclick=e=>{
        if(e.target.classList.contains("layer-eye"))layer.visible=!layer.visible;
        else if(e.target.classList.contains("layer-delete")){if(state.layers.length===1)return;state.layers=state.layers.filter(l=>l.id!==layer.id);if(state.activeLayerId===layer.id)state.activeLayerId=state.layers[0].id;snapshot()}
        else state.activeLayerId=layer.id;
        renderLayerList();render();
      };
      root.appendChild(row);
    });
  }
  function escapeHtml(v){return v.replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[ch]))}
  function serializeLayers(){return state.layers.map(l=>({id:l.id,name:l.name,visible:l.visible,data:l.canvas.toDataURL("image/png")}))}
  function snapshot(){
    const s={layers:serializeLayers(),activeLayerId:state.activeLayerId,template:state.template,mannequinStyle:state.mannequinStyle,bodyType:state.bodyType,mannequinOpacity:state.mannequinOpacity,showFaceGuide:state.showFaceGuide,showCenterGuide:state.showCenterGuide};
    state.history=state.history.slice(0,state.historyIndex+1);state.history.push(s);if(state.history.length>20)state.history.shift();state.historyIndex=state.history.length-1;
  }
  async function restore(s){
    const layers=[];for(const d of s.layers){const c=newCanvas(),img=new Image();await new Promise(r=>{img.onload=r;img.src=d.data});c.getContext("2d").drawImage(img,0,0);layers.push({id:d.id,name:d.name,visible:d.visible,canvas:c})}
    state.layers=layers;state.activeLayerId=s.activeLayerId;state.template=s.template;state.mannequinStyle=s.mannequinStyle||"fashion";state.bodyType=s.bodyType||"standard";state.mannequinOpacity=s.mannequinOpacity??1;state.showFaceGuide=s.showFaceGuide??true;state.showCenterGuide=s.showCenterGuide??true;syncMannequinUI();renderLayerList();render();
  }
  async function undo(){if(state.historyIndex<=0)return;state.historyIndex--;await restore(state.history[state.historyIndex])}
  async function redo(){if(state.historyIndex>=state.history.length-1)return;state.historyIndex++;await restore(state.history[state.historyIndex])}
  function exportPNG(){
    const c=newCanvas(),x=c.getContext("2d");x.fillStyle="#fff";x.fillRect(0,0,W,H);drawMannequin(x,state.template);[...state.layers].reverse().forEach(l=>{if(l.visible)x.drawImage(l.canvas,0,0)});
    const a=document.createElement("a"),safe=($("#designName").value||"amea-design").trim().replace(/[^a-z0-9-_]+/gi,"-");a.download=(safe||"amea-design")+".png";a.href=c.toDataURL("image/png");a.click();showToast("Exported ✓");
  }

  viewport.addEventListener("pointerdown",e=>{
    if(e.pointerType==="touch"){
      e.preventDefault();state.touches.set(e.pointerId,{x:e.clientX,y:e.clientY});viewport.setPointerCapture?.(e.pointerId);startTouchGesture();return;
    }
    if(e.pointerType==="mouse"&&e.button!==0)return;
    const p=pagePoint(e);artboard.setPointerCapture?.(e.pointerId);
    if(state.tool==="eyedropper")return pickColour(p);
    if(state.tool==="fillpattern")return patternFill();
    if(state.tool==="stamp"){stampMotif(p);snapshot();return}
    if(state.tool==="select"){state.selectionStart=p;state.selection={x:p.x,y:p.y,w:0,h:0};render();return}
    state.drawing=true;state.last=p;if(state.tool==="scatter"){stampMotif(p,true);state.lastStamp=p;return}strokeTo(p);
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
    if(e.pointerType==="touch"){
      state.touches.delete(e.pointerId);
      if(state.touches.size===1)startTouchGesture();else if(state.touches.size===0)state.gesture=null;
      return;
    }
    if(state.tool==="select"){state.selectionStart=null;render();return}
    if(state.drawing)snapshot();state.drawing=false;state.last=null;state.lastStamp=null;
  }
  viewport.addEventListener("pointerup",endPointer);viewport.addEventListener("pointercancel",endPointer);

  $$(".tool-btn").forEach(b=>b.onclick=()=>setTool(b.dataset.tool));
  $("#brushSize").oninput=e=>{state.brushSize=+e.target.value;$("#brushSizeValue").textContent=e.target.value};
  $("#brushOpacity").oninput=e=>{state.opacity=+e.target.value/100;$("#brushOpacityValue").textContent=e.target.value+"%"};
  $("#brushSmoothing").oninput=e=>{state.smoothing=+e.target.value/100;$("#brushSmoothingValue").textContent=e.target.value+"%"};
  $("#pressureToggle").onchange=e=>state.pressureEnabled=e.target.checked;
  $("#colourPicker").oninput=e=>setColour(e.target.value);
  $$("#swatches button").forEach(b=>b.onclick=()=>setColour(b.dataset.colour));

  $$(".tab-btn").forEach(btn=>btn.onclick=()=>{$$(".tab-btn").forEach(b=>b.classList.remove("active"));$$(".tab-panel").forEach(p=>p.classList.remove("active"));btn.classList.add("active");$('[data-panel="'+btn.dataset.tab+'"]').classList.add("active")});
  $$(".view-btn").forEach(btn=>btn.onclick=()=>{state.template=btn.dataset.template;$$(".view-btn").forEach(b=>b.classList.toggle("active",b===btn));render();snapshot()});
  $("[data-mannequin-style='fashion']").onclick=()=>{state.mannequinStyle="fashion";syncMannequinUI();render();snapshot()};
  $("[data-mannequin-style='realistic']").onclick=()=>{state.mannequinStyle="realistic";syncMannequinUI();render();snapshot()};
  $$("[data-body-type]").forEach(btn=>btn.onclick=()=>{state.bodyType=btn.dataset.bodyType;syncMannequinUI();render();snapshot()});
  function syncMannequinUI(){
    $$("[data-mannequin-style]").forEach(b=>b.classList.toggle("active",b.dataset.mannequinStyle===state.mannequinStyle));
    $$("[data-body-type]").forEach(b=>b.classList.toggle("active",b.dataset.bodyType===state.bodyType));
    $("#mannequinOpacity").value=Math.round(state.mannequinOpacity*100);$("#mannequinOpacityValue").textContent=Math.round(state.mannequinOpacity*100)+"%";
    $("#showFaceGuide").checked=state.showFaceGuide;$("#showCenterGuide").checked=state.showCenterGuide;
  }
  $("#mannequinOpacity").oninput=e=>{state.mannequinOpacity=+e.target.value/100;$("#mannequinOpacityValue").textContent=e.target.value+"%";render()};
  $("#showFaceGuide").onchange=e=>{state.showFaceGuide=e.target.checked;render();snapshot()};
  $("#showCenterGuide").onchange=e=>{state.showCenterGuide=e.target.checked;render();snapshot()};

  $("#motifSize").oninput=e=>{state.motifScale=+e.target.value/100;$("#motifSizeValue").textContent=e.target.value+"%"};
  $("#motifSpacing").oninput=e=>{state.motifSpacing=+e.target.value;$("#motifSpacingValue").textContent=e.target.value};
  $("#motifRotation").oninput=e=>{state.motifRotation=+e.target.value;$("#motifRotationValue").textContent=e.target.value+"°"};
  $("#createMotifBtn").onclick=createMotif;$("#clearMotifBtn").onclick=()=>{state.motif=null;$("#motifPreview").getContext("2d").clearRect(0,0,220,160);$("#motifStatus").textContent="No motif saved"};

  $("#addLayerBtn").onclick=()=>addLayer("Layer "+(state.layers.length+1));
  $("#clearLayerBtn").onclick=()=>{const l=activeLayer();if(!l)return;if(confirm("Clear active layer?")){l.canvas.getContext("2d").clearRect(0,0,W,H);render();snapshot()}};

  $("#referenceUpload").onchange=e=>{const file=e.target.files?.[0];if(!file)return;const r=new FileReader();r.onload=()=>{const img=new Image();img.onload=()=>{state.referenceImage=img;render();showToast("Reference added")};img.src=r.result};r.readAsDataURL(file)};
  $("#referenceOpacity").oninput=e=>{state.referenceOpacity=+e.target.value/100;$("#referenceOpacityValue").textContent=e.target.value+"%";render()};
  $("#removeReferenceBtn").onclick=()=>{state.referenceImage=null;$("#referenceUpload").value="";render()};

  function togglePanel(side,open){
    const cls=side+"-collapsed";
    open?shell.classList.remove(cls):shell.classList.add(cls);
    requestAnimationFrame(()=>requestAnimationFrame(fitCanvas));
  }
  $("#toggleLeft").onclick=()=>togglePanel("left",false);$("#toggleRight").onclick=()=>togglePanel("right",false);
  $("#reopenLeft").onclick=()=>togglePanel("left",true);$("#reopenRight").onclick=()=>togglePanel("right",true);

  $("#undoBtn").onclick=undo;$("#redoBtn").onclick=redo;$("#exportBtn").onclick=exportPNG;
  window.addEventListener("resize",()=>requestAnimationFrame(fitCanvas));
  window.addEventListener("keydown",e=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==="z"){e.preventDefault();e.shiftKey?redo():undo()}});

  addLayer("Details");addLayer("Colour");addLayer("Sketch");
  state.history=[];state.historyIndex=-1;
  state.brushPreset="Studio Pencil";applyBrushPreset("pencil",BRUSH_PRESETS.pencil[0]);setColour(state.colour);syncMannequinUI();renderLayerList();render();snapshot();
  requestAnimationFrame(fitCanvas);
})();