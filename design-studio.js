(()=>{
"use strict";

const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const W=900,H=1100;
const STORAGE_KEY="design_studio_gallery_v3";
const FAV_KEY="design_studio_brush_favourites_v3";
const RECENT_BRUSH_KEY="design_studio_recent_brushes_v3";
const RECENT_COLOUR_KEY="design_studio_recent_colours_v3";
const COLOUR_PALETTE_KEY="design_studio_colour_palettes_v1";
const CUSTOM_BRUSH_KEY="design_studio_custom_brushes_v1";

const galleryScreen=$("#galleryScreen");
const editorScreen=$("#editorScreen");
const galleryGrid=$("#galleryGrid");
const emptyGallery=$("#emptyGallery");
const createModal=$("#createModal");
const galleryMenu=$("#galleryMenu");
const viewport=$("#canvasViewport");
const stage=$("#canvasStage");
const display=$("#displayCanvas");
const dctx=display.getContext("2d");

const PALETTE=["#111111","#FFFFFF","#7B7B82","#D94141","#F08B32","#E7C63C","#55A65A","#3D8EEA","#5353C6","#8E56C7","#DA5DA8","#7B4C39"];
const CATEGORIES=[
  ["recent","Recent"],
  ["sketching","Sketching"],
  ["inking","Inking"],
  ["markers","Markers"],
  ["custom","My Brushes"],
  ["favourites","Favorites"]
];

const BRUSHES=[
  {id:"hb",name:"HB Pencil",category:"sketching",note:"Clean everyday sketch",mode:"pencil",size:10,opacity:.72},
  {id:"tech-pencil",name:"Technical Pencil",category:"sketching",note:"Fine controlled pencil",mode:"pencil",size:6,opacity:.8},
  {id:"6b",name:"6B Pencil",category:"sketching",note:"Soft dark graphite",mode:"soft",size:16,opacity:.65},
  {id:"rough-pencil",name:"Rough Pencil",category:"sketching",note:"Textured sketch line",mode:"rough",size:13,opacity:.62},
  {id:"studio-pen",name:"Studio Pen",category:"inking",note:"Smooth pressure line",mode:"pen",size:12,opacity:1},
  {id:"fine-liner",name:"Fine Liner",category:"inking",note:"Crisp detail line",mode:"pen",size:6,opacity:1},
  {id:"monoline",name:"Monoline",category:"inking",note:"Consistent round line",mode:"pen",size:18,opacity:1},
  {id:"technical-pen",name:"Technical Pen",category:"inking",note:"Precise ink line",mode:"pen",size:8,opacity:1},
  {id:"brush-marker",name:"Brush Marker",category:"markers",note:"Soft marker stroke",mode:"marker",size:34,opacity:.72},
  {id:"alcohol-marker",name:"Alcohol Marker",category:"markers",note:"Layerable broad marker",mode:"marker",size:46,opacity:.38},
  {id:"chisel-marker",name:"Chisel Marker",category:"markers",note:"Broad fashion marker",mode:"chisel",size:44,opacity:.55},
  {id:"highlighter",name:"Highlighter",category:"markers",note:"Transparent colour",mode:"marker",size:58,opacity:.22}
];

const state={
  designs:loadJSON(STORAGE_KEY,[]),
  currentId:null,
  activeView:"front",
  designKind:"fashion",
  croquisVisible:true,
  croquisOpacity:.35,
  overlayOther:false,
  referenceImage:null,
  views:{front:[],back:[]},
  activeLayerByView:{front:null,back:null},
  layers:[],
  activeLayerId:null,
  tool:"brush",
  eraserMode:"partial",
  strokeEraseLast:null,
  brush:BRUSHES[0],
  brushCategory:"sketching",
  colour:"#111111",
  size:22,
  opacity:1,
  favourites:new Set(loadJSON(FAV_KEY,[])),
  recentBrushes:loadJSON(RECENT_BRUSH_KEY,[]),
  customBrushes:loadJSON(CUSTOM_BRUSH_KEY,[]),
  editingCustomBrushId:null,
  brushDraft:null,
  recentColours:loadJSON(RECENT_COLOUR_KEY,["#111111"]),
  colourPalettes:loadJSON(COLOUR_PALETTE_KEY,[{name:"My Palette",colours:[]}]),
  activePalette:0,
  colourHue:0,
  colourSat:0,
  colourVal:.067,
  eyedropper:false,
  drawing:false,
  drawingPointer:null,
  lastPoint:null,
  strokePoints:[],
  strokeBase:null,
  strokeCanvas:null,
  textureCarry:0,
  textureIndex:0,
  viewScale:1,
  viewX:0,
  viewY:0,
  pointers:new Map(),
  gesture:null,
  history:[],
  historyIndex:-1,
  selectedGalleryId:null,
  selectMode:false,
  selectedGallery:new Set(),
  layerDrag:null,
  touchPan:null,
  pendingDraw:null
};

function loadJSON(key,fallback){
  try{const v=JSON.parse(localStorage.getItem(key)||"null");return v==null?fallback:v}catch(_){return fallback}
}
function saveJSON(key,value){
  try{localStorage.setItem(key,JSON.stringify(value));return true}catch(_){toast("Storage is full");return false}
}
function uid(){return "d"+Date.now().toString(36)+Math.random().toString(36).slice(2,7)}
function layerUid(){return "l"+Date.now().toString(36)+Math.random().toString(36).slice(2,7)}
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function toast(msg){
  const el=$("#toast");el.textContent=msg;el.classList.add("show");
  clearTimeout(toast.t);toast.t=setTimeout(()=>el.classList.remove("show"),1400);
}
function formatDate(ts){
  const d=new Date(ts);
  return d.toLocaleDateString(undefined,{month:"short",day:"numeric",year:d.getFullYear()!==new Date().getFullYear()?"numeric":undefined});
}
function escapeHtml(s){
  return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}

const croquisImages={front:new Image(),back:new Image()};
croquisImages.front.src="design-assets/croquis-front.svg";
croquisImages.back.src="design-assets/croquis-back.svg";

function drawCroquis(ctx,type,opacity,w=W,h=H){
  if(type==="blank"||!state.croquisVisible)return;
  const img=croquisImages[type];
  if(!img||!img.complete||!img.naturalWidth)return;
  const targetH=h*.94;
  const targetW=targetH*(320/1175);
  ctx.save();
  ctx.globalAlpha=opacity;
  ctx.globalCompositeOperation="multiply";
  ctx.drawImage(img,(w-targetW)/2,(h-targetH)/2,targetW,targetH);
  ctx.restore();
}
function newLayer(name){
  const c=document.createElement("canvas");c.width=W;c.height=H;
  return {id:layerUid(),name:name||"Layer",visible:true,opacity:1,blend:"source-over",canvas:c};
}
function activeLayer(){return state.layers.find(l=>l.id===state.activeLayerId)||state.layers[0]||null}
function setActiveLayer(id){
  if(state.layers.some(l=>l.id===id)){
    state.activeLayerId=id;
    state.activeLayerByView[state.activeView]=id;
  }
  resetHistory();
  renderLayers();
}
function renderLayerArray(ctx,layers,alpha=1){
  for(let i=layers.length-1;i>=0;i--){
    const l=layers[i];if(!l.visible)continue;
    ctx.globalAlpha=alpha*l.opacity;
    ctx.globalCompositeOperation=l.blend||"source-over";
    ctx.drawImage(l.canvas,0,0);
  }
}
function compositeTo(ctx,includeReference=true,view=state.activeView,includeOverlay=state.overlayOther,includeMannequin=true){
  ctx.save();
  ctx.setTransform(1,0,0,1,0,0);
  ctx.clearRect(0,0,W,H);
  ctx.fillStyle="#fff";ctx.fillRect(0,0,W,H);

  const croquisType=state.designKind==="blank"?"blank":view;
  if(includeMannequin)drawCroquis(ctx,croquisType,state.croquisOpacity);

  if(includeOverlay&&state.designKind!=="blank"){
    const other=view==="front"?"back":"front";
    if(includeMannequin)drawCroquis(ctx,other,.09);
    renderLayerArray(ctx,state.views[other]||[],.16);
  }

  if(includeReference&&state.referenceImage){
    ctx.globalAlpha=.38;ctx.globalCompositeOperation="source-over";
    const r=fitImage(state.referenceImage,W,H);
    ctx.drawImage(state.referenceImage,r.x,r.y,r.w,r.h);
  }

  renderLayerArray(ctx,state.views[view]||state.layers,1);
  ctx.restore();
}
function render(){compositeTo(dctx,true)}
function fitImage(img,w,h){
  const s=Math.min(w/img.width,h/img.height);
  return {w:img.width*s,h:img.height*s,x:(w-img.width*s)/2,y:(h-img.height*s)/2};
}

function drawBrushPreview(canvas,brush){
  const c=canvas.getContext("2d"),w=canvas.width,h=canvas.height;
  c.clearRect(0,0,w,h);c.save();
  const mid=h/2;
  if(brush.mode==="custom"){
    const pts=[];
    for(let i=0;i<=36;i++){
      const t=i/36;
      pts.push({x:8+t*(w-16),y:mid+Math.sin(t*Math.PI*2)*8,pressure:.35+.65*Math.sin(t*Math.PI)});
    }
    drawCustomBrushStroke(c,pts,brush,"#202024",.24);
  }else if(isTexture(brush.mode)){
    const step=previewTextureSpacing(brush.mode);
    let index=0;
    for(let x=12;x<w-8;x+=step){
      const y=mid+Math.sin(x/20)*4;
      textureMark(c,brush.mode,x,y,12,0,index++,true,brush.opacity);
    }
  }else{
    c.strokeStyle="#202024";
    c.globalAlpha=Math.max(.35,brush.opacity);
    c.lineCap="round";c.lineJoin="round";
    c.lineWidth=Math.max(2,brush.size*.22);
    c.beginPath();c.moveTo(7,mid+8);c.bezierCurveTo(w*.28,mid-17,w*.62,mid+13,w-7,mid-5);c.stroke();
    if(brush.mode==="rough"){
      c.globalAlpha=.25;c.lineWidth=1.4;
      c.beginPath();c.moveTo(8,mid+11);c.bezierCurveTo(w*.3,mid-13,w*.64,mid+16,w-8,mid-2);c.stroke();
    }
  }
  c.restore();
}
function previewTextureSpacing(mode){
  if(["crochet","boucle","lace","sequin","rhinestone","bead"].includes(mode))return 17;
  if(["knit","cross","mesh"].includes(mode))return 15;
  if(["fur","fuzzy","glitter"].includes(mode))return 13;
  return 12;
}
function isTexture(mode){
  return !["pencil","soft","rough","pen","marker","chisel","custom"].includes(mode);
}
function allBrushes(){return BRUSHES.concat(state.customBrushes||[])}
function getBrushById(id){return allBrushes().find(b=>b.id===id)||null}
function renderBrushCategories(){
  const root=$("#brushCategories");root.innerHTML="";
  CATEGORIES.forEach(([id,label])=>{
    const b=document.createElement("button");b.className="brush-category"+(state.brushCategory===id?" active":"");b.textContent=label;
    b.onclick=()=>{state.brushCategory=id;renderBrushCategories();renderBrushList()};
    root.appendChild(b);
  });
}
function brushesForCategory(){
  if(state.brushCategory==="favourites")return allBrushes().filter(b=>state.favourites.has(b.id));
  if(state.brushCategory==="recent")return state.recentBrushes.map(id=>getBrushById(id)).filter(Boolean);
  if(state.brushCategory==="custom")return state.customBrushes;
  return BRUSHES.filter(b=>b.category===state.brushCategory);
}
function renderBrushList(){
  const root=$("#brushList");root.innerHTML="";
  if(state.brushCategory==="custom"){
    const head=document.createElement("div");head.className="custom-brush-header";
    const label=document.createElement("strong");label.textContent="My Brushes";
    const add=document.createElement("button");add.textContent="＋ New Brush";add.onclick=()=>openBrushStudio();
    head.append(label,add);root.appendChild(head);
  }
  const list=brushesForCategory();
  if(!list.length){
    const d=document.createElement("div");d.className="brush-empty";
    d.textContent=state.brushCategory==="custom"?"No custom brushes yet":state.brushCategory==="favourites"?"No favorites yet":"No recent brushes yet";
    root.appendChild(d);return;
  }
  list.forEach(brush=>{
    const row=document.createElement("div");row.className="brush-row"+(brush.mode==="custom"?" custom":"")+(state.brush.id===brush.id?" active":"");
    row.tabIndex=0;row.setAttribute("role","button");
    const cv=document.createElement("canvas");cv.width=150;cv.height=52;
    const copy=document.createElement("span");copy.innerHTML="<strong>"+escapeHtml(brush.name)+"</strong><small>"+escapeHtml(brush.note||"Custom Brush")+"</small>";
    if(brush.mode==="custom"){
      const actions=document.createElement("span");actions.className="custom-brush-actions";
      const edit=document.createElement("button");edit.textContent="Edit";edit.onclick=e=>{e.stopPropagation();openBrushStudio(brush)};
      const dup=document.createElement("button");dup.textContent="Copy";dup.onclick=e=>{e.stopPropagation();duplicateCustomBrush(brush.id)};
      const del=document.createElement("button");del.textContent="Delete";del.className="danger";del.onclick=e=>{e.stopPropagation();deleteCustomBrush(brush.id)};
      actions.append(edit,dup,del);row.append(cv,copy,actions);
    }else{
      const fav=document.createElement("span");fav.className="favourite-btn";fav.textContent=state.favourites.has(brush.id)?"♥":"♡";
      fav.onclick=e=>{e.stopPropagation();toggleFavourite(brush.id)};
      row.append(cv,copy,fav);
    }
    row.onclick=()=>selectBrush(brush);
    row.onkeydown=e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();selectBrush(brush)}};
    root.appendChild(row);drawBrushPreview(cv,brush);
  });
}
function selectBrush(brush){
  state.brush=brush;state.tool="brush";state.size=brush.size;state.opacity=brush.opacity;
  $("#sizeSlider").value=brush.size;$("#opacitySlider").value=Math.round(brush.opacity*100);updateSliderLabels();
  state.recentBrushes=[brush.id].concat(state.recentBrushes.filter(id=>id!==brush.id)).slice(0,8);
  saveJSON(RECENT_BRUSH_KEY,state.recentBrushes);syncToolButtons();renderBrushList();toast(brush.name);
}
function toggleFavourite(id){
  state.favourites.has(id)?state.favourites.delete(id):state.favourites.add(id);
  saveJSON(FAV_KEY,Array.from(state.favourites));renderBrushList();
}
function duplicateCustomBrush(id){
  const src=state.customBrushes.find(b=>b.id===id);if(!src)return;
  const copy={...src,id:"cb"+Date.now().toString(36)+Math.random().toString(36).slice(2,6),name:(src.name||"Brush")+" Copy"};
  state.customBrushes.push(copy);saveJSON(CUSTOM_BRUSH_KEY,state.customBrushes);renderBrushList();toast("Brush duplicated");
}
function deleteCustomBrush(id){
  const brush=state.customBrushes.find(b=>b.id===id);if(!brush)return;
  if(!confirm("Delete "+brush.name+"?"))return;
  state.customBrushes=state.customBrushes.filter(b=>b.id!==id);
  state.recentBrushes=state.recentBrushes.filter(x=>x!==id);state.favourites.delete(id);
  saveJSON(CUSTOM_BRUSH_KEY,state.customBrushes);saveJSON(RECENT_BRUSH_KEY,state.recentBrushes);saveJSON(FAV_KEY,Array.from(state.favourites));
  if(state.brush.id===id)state.brush=BRUSHES[0];
  renderBrushList();toast("Brush deleted");
}
function defaultBrushDraft(){
  return {id:"draft-brush",name:"Untitled Brush",category:"custom",note:"Custom Brush",mode:"custom",size:22,opacity:1,spacing:12,taper:0,smoothing:55,pressure:65,shapeData:null,grainData:null};
}
function openBrushStudio(brush=null){
  state.editingCustomBrushId=brush&&brush.mode==="custom"?brush.id:null;
  state.brushDraft=brush&&brush.mode==="custom"?{...brush}:{...defaultBrushDraft(),id:"draft-"+Date.now().toString(36)};
  syncBrushStudioUI();
  $("#brushStudioModal").classList.remove("hidden");
  requestAnimationFrame(renderBrushStudioPreview);
}
function closeBrushStudio(){
  $("#brushStudioModal").classList.add("hidden");
  state.editingCustomBrushId=null;state.brushDraft=null;
}
function syncBrushStudioUI(){
  const b=state.brushDraft;if(!b)return;
  $("#brushNameInput").value=b.name||"Untitled Brush";
  $("#brushSpacing").value=b.spacing;$("#brushSize").value=b.size;$("#brushOpacity").value=Math.round(b.opacity*100);
  $("#brushTaper").value=b.taper;$("#brushSmoothing").value=b.smoothing;$("#brushPressure").value=b.pressure;
  updateBrushStudioOutputs();renderBrushSourcePreview("shape");renderBrushSourcePreview("grain");
}
function updateBrushStudioOutputs(){
  const b=state.brushDraft;if(!b)return;
  $("#brushSpacingOut").textContent=Math.round(b.spacing)+"%";
  $("#brushSizeOut").textContent=Math.round(b.size/120*100)+"%";
  $("#brushOpacityOut").textContent=Math.round(b.opacity*100)+"%";
  $("#brushTaperOut").textContent=Math.round(b.taper)+"%";
  $("#brushSmoothingOut").textContent=Math.round(b.smoothing)+"%";
  $("#brushPressureOut").textContent=Math.round(b.pressure)+"%";
}
function renderBrushSourcePreview(kind){
  const b=state.brushDraft;if(!b)return;
  const prop=kind==="shape"?"shapeData":"grainData",root=$("#"+kind+"Preview");root.innerHTML="";
  if(b[prop]){
    const img=document.createElement("img");img.src=b[prop];img.alt=kind==="shape"?"Brush shape":"Brush grain";root.appendChild(img);
  }else{
    const span=document.createElement("span");span.textContent=kind==="shape"?"Round":"None";root.appendChild(span);
  }
}
function processBrushAsset(file){
  return new Promise((resolve,reject)=>{
    if(!file){reject(new Error("No file"));return}
    const reader=new FileReader();
    reader.onerror=()=>reject(new Error("Could not read image"));
    reader.onload=()=>{
      const img=new Image();
      img.onerror=()=>reject(new Error("Could not load image"));
      img.onload=()=>{
        const size=256,cv=document.createElement("canvas");cv.width=size;cv.height=size;const c=cv.getContext("2d");
        const scale=Math.max(size/img.width,size/img.height),dw=img.width*scale,dh=img.height*scale;
        c.clearRect(0,0,size,size);c.drawImage(img,(size-dw)/2,(size-dh)/2,dw,dh);
        const im=c.getImageData(0,0,size,size),d=im.data;
        let transparent=false;for(let i=3;i<d.length;i+=4){if(d[i]<245){transparent=true;break}}
        if(transparent){
          for(let i=0;i<d.length;i+=4){d[i]=255;d[i+1]=255;d[i+2]=255}
        }else{
          let sum=0,count=0;
          for(let y=0;y<size;y+=4)for(let x=0;x<size;x+=4){
            if(x<16||x>size-17||y<16||y>size-17){const i=(y*size+x)*4;sum+=(d[i]+d[i+1]+d[i+2])/3;count++}
          }
          const invert=sum/Math.max(1,count)>140;
          for(let i=0;i<d.length;i+=4){
            const lum=.2126*d[i]+.7152*d[i+1]+.0722*d[i+2],alpha=invert?255-lum:lum;
            d[i]=255;d[i+1]=255;d[i+2]=255;d[i+3]=Math.round(alpha);
          }
        }
        c.putImageData(im,0,0);resolve(cv.toDataURL("image/png"));
      };
      img.src=reader.result;
    };
    reader.readAsDataURL(file);
  });
}
async function importBrushAsset(kind,file){
  if(!state.brushDraft||!file)return;
  try{
    const data=await processBrushAsset(file);
    if(kind==="shape")state.brushDraft.shapeData=data;else state.brushDraft.grainData=data;
    customAssetCache.clear();customStampCache.clear();renderBrushSourcePreview(kind);renderBrushStudioPreview();
  }catch(_){toast("Could not import that image")}
}
function saveBrushDraft(){
  const b=state.brushDraft;if(!b)return;
  const name=$("#brushNameInput").value.trim()||"Untitled Brush";
  const saved={...b,name,category:"custom",note:"Custom Brush",mode:"custom"};
  if(state.editingCustomBrushId){
    const i=state.customBrushes.findIndex(x=>x.id===state.editingCustomBrushId);
    if(i>=0){saved.id=state.editingCustomBrushId;state.customBrushes[i]=saved}
  }else{
    saved.id="cb"+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
    state.customBrushes.push(saved);
  }
  if(!saveJSON(CUSTOM_BRUSH_KEY,state.customBrushes))return;
  customAssetCache.clear();customStampCache.clear();
  state.brushCategory="custom";state.brush=saved;state.size=saved.size;state.opacity=saved.opacity;
  $("#sizeSlider").value=saved.size;$("#opacitySlider").value=Math.round(saved.opacity*100);updateSliderLabels();
  closeBrushStudio();renderBrushCategories();renderBrushList();toast("Brush saved");
}

function syncToolButtons(){
  $("#brushBtn").classList.toggle("active",state.tool==="brush");
  $("#smudgeBtn").classList.toggle("active",state.tool==="smudge");
  $("#eraserBtn").classList.toggle("active",state.tool==="eraser");
}
function setTool(tool){
  state.tool=tool;syncToolButtons();
  if(tool==="eraser"){$("#sizeSlider").value=clamp(state.size,2,120);syncEraserModes()}
  updateSliderLabels();
}

function syncEraserModes(){
  $$(".eraser-mode").forEach(b=>b.classList.toggle("active",b.dataset.eraserMode===state.eraserMode));
}
function setEraserMode(mode){
  state.eraserMode=mode==="stroke"?"stroke":"partial";
  state.tool="eraser";syncToolButtons();syncEraserModes();
  toast(state.eraserMode==="stroke"?"Stroke Erase":"Partial Erase");
}
function nearestPaintedPixel(imageData,x,y,radius){
  const w=imageData.width,h=imageData.height,data=imageData.data;
  x=Math.round(x);y=Math.round(y);radius=Math.max(2,Math.round(radius));
  let best=-1,bestD=Infinity;
  for(let yy=Math.max(0,y-radius);yy<=Math.min(h-1,y+radius);yy++){
    for(let xx=Math.max(0,x-radius);xx<=Math.min(w-1,x+radius);xx++){
      const d2=(xx-x)*(xx-x)+(yy-y)*(yy-y);if(d2>radius*radius||d2>=bestD)continue;
      if(data[(yy*w+xx)*4+3]>8){best=yy*w+xx;bestD=d2}
    }
  }
  return best;
}
function eraseConnectedStroke(layer,p){
  const ctx=layer.canvas.getContext("2d"),img=ctx.getImageData(0,0,W,H),data=img.data;
  const start=nearestPaintedPixel(img,p.x,p.y,Math.max(8,state.size*.7));
  if(start<0)return false;

  const visited=new Uint8Array(W*H),queue=new Int32Array(W*H);
  let head=0,tail=0;queue[tail++]=start;visited[start]=1;
  const component=[];
  while(head<tail){
    const n=queue[head++],alpha=data[n*4+3];
    if(alpha<=8)continue;
    component.push(n);
    const x=n%W,y=(n/W)|0;
    for(let oy=-1;oy<=1;oy++)for(let ox=-1;ox<=1;ox++){
      if(!ox&&!oy)continue;
      const nx=x+ox,ny=y+oy;if(nx<0||ny<0||nx>=W||ny>=H)continue;
      const ni=ny*W+nx;if(visited[ni])continue;
      visited[ni]=1;if(data[ni*4+3]>8)queue[tail++]=ni;
    }
  }
  if(!component.length)return false;
  for(const n of component){const i=n*4;data[i]=data[i+1]=data[i+2]=data[i+3]=0}
  ctx.putImageData(img,0,0);return true;
}
function hsvToRgb(h,s,v){
  h=((h%360)+360)%360;s=clamp(s,0,1);v=clamp(v,0,1);
  const c=v*s,x=c*(1-Math.abs((h/60)%2-1)),m=v-c;
  let r=0,g=0,b=0;
  if(h<60){r=c;g=x}else if(h<120){r=x;g=c}else if(h<180){g=c;b=x}else if(h<240){g=x;b=c}else if(h<300){r=x;b=c}else{r=c;b=x}
  return [Math.round((r+m)*255),Math.round((g+m)*255),Math.round((b+m)*255)];
}
function rgbToHsv(r,g,b){
  r/=255;g/=255;b/=255;const max=Math.max(r,g,b),min=Math.min(r,g,b),d=max-min;
  let h=0;if(d){if(max===r)h=60*(((g-b)/d)%6);else if(max===g)h=60*((b-r)/d+2);else h=60*((r-g)/d+4)}
  if(h<0)h+=360;
  return [h,max===0?0:d/max,max];
}
function rgbToHex(r,g,b){return "#"+[r,g,b].map(v=>Math.round(v).toString(16).padStart(2,"0")).join("").toUpperCase()}
function hexToRgb(hex){const m=/^#([0-9a-f]{6})$/i.exec(hex);return m?[parseInt(m[1].slice(0,2),16),parseInt(m[1].slice(2,4),16),parseInt(m[1].slice(4,6),16)]:null}

function drawColourDisc(){
  const cv=$("#colourDisc");if(!cv)return;
  const c=cv.getContext("2d"),w=cv.width,h=cv.height,cx=w/2,cy=h/2,r=Math.min(w,h)/2-3;
  const im=c.createImageData(w,h),data=im.data;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const dx=x-cx,dy=y-cy,dist=Math.hypot(dx,dy),i=(y*w+x)*4;
    if(dist>r){data[i+3]=0;continue}
    const sat=clamp(dist/r,0,1),hue=(Math.atan2(dy,dx)*180/Math.PI+360)%360;
    const [rr,gg,bb]=hsvToRgb(hue,sat,1);
    data[i]=rr;data[i+1]=gg;data[i+2]=bb;data[i+3]=255;
  }
  c.putImageData(im,0,0);
  const radius=state.colourSat*r,ang=state.colourHue*Math.PI/180;
  $("#discMarker").style.left=(cx+Math.cos(ang)*radius)+"px";
  $("#discMarker").style.top=(cy+Math.sin(ang)*radius)+"px";
  $("#discMarker").style.background=state.colour;
}
function drawClassicPicker(){
  const cv=$("#classicSquare");if(!cv)return;
  const c=cv.getContext("2d"),w=cv.width,h=cv.height;
  const im=c.createImageData(w,h),data=im.data;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const sat=x/(w-1),val=1-y/(h-1),[rr,gg,bb]=hsvToRgb(state.colourHue,sat,val),i=(y*w+x)*4;
    data[i]=rr;data[i+1]=gg;data[i+2]=bb;data[i+3]=255;
  }
  c.putImageData(im,0,0);
  $("#classicMarker").style.left=(state.colourSat*w)+"px";
  $("#classicMarker").style.top=((1-state.colourVal)*h)+"px";
  $("#classicMarker").style.background=state.colour;
  $("#hueSlider").value=Math.round(state.colourHue);
}
function refreshColourPickers(){
  drawColourDisc();drawClassicPicker();
  $("#currentColourChip").style.background=state.colour;
  $("#currentColourText").textContent=state.colour;
  $("#eyedropperBtn").classList.toggle("active",state.eyedropper);
}
function makeSwatch(colour,opts={}){
  const b=document.createElement("button");
  b.className="colour-swatch"+(colour.toUpperCase()===state.colour?" selected":"");
  b.style.background=colour;b.title=colour;b.type="button";
  b.onclick=()=>setColour(colour);
  if(opts.holdToRemove){
    let timer=null,moved=false;
    const clear=()=>{if(timer)clearTimeout(timer);timer=null};
    b.addEventListener("pointerdown",()=>{moved=false;timer=setTimeout(()=>{timer=null;removeRecentColour(colour)},550)});
    b.addEventListener("pointermove",()=>{moved=true;clear()});
    b.addEventListener("pointerup",clear);b.addEventListener("pointercancel",clear);b.addEventListener("pointerleave",clear);
  }
  return b;
}
function renderRecentColours(){
  const root=$("#recentColours");root.innerHTML="";
  state.recentColours.slice(0,12).forEach(c=>root.appendChild(makeSwatch(c,{holdToRemove:true})));
}
function removeRecentColour(colour){
  state.recentColours=state.recentColours.filter(c=>c!==colour);
  saveJSON(RECENT_COLOUR_KEY,state.recentColours);renderRecentColours();toast("Removed from Recent");
}
function normalizePalettes(){
  if(!Array.isArray(state.colourPalettes)||!state.colourPalettes.length)state.colourPalettes=[{name:"My Palette",colours:[]}];
  state.colourPalettes=state.colourPalettes.map((p,i)=>({name:String(p&&p.name||("Palette "+(i+1))),colours:Array.isArray(p&&p.colours)?p.colours.filter(c=>/^#[0-9a-f]{6}$/i.test(c)).slice(0,36):[]}));
  state.activePalette=clamp(state.activePalette,0,state.colourPalettes.length-1);
}
function renderPalettes(){
  normalizePalettes();
  const sel=$("#paletteSelect");sel.innerHTML="";
  state.colourPalettes.forEach((p,i)=>{const o=document.createElement("option");o.value=i;o.textContent=p.name;if(i===state.activePalette)o.selected=true;sel.appendChild(o)});
  const root=$("#savedPalette");root.innerHTML="";
  state.colourPalettes[state.activePalette].colours.forEach(c=>root.appendChild(makeSwatch(c)));
}
function createPalette(){
  const name=prompt("Palette name","My Palette");if(!name||!name.trim())return;
  state.colourPalettes.push({name:name.trim(),colours:[]});state.activePalette=state.colourPalettes.length-1;
  saveJSON(COLOUR_PALETTE_KEY,state.colourPalettes);renderPalettes();
}
function addCurrentToPalette(){
  normalizePalettes();const p=state.colourPalettes[state.activePalette];
  if(!p.colours.includes(state.colour))p.colours.push(state.colour);
  saveJSON(COLOUR_PALETTE_KEY,state.colourPalettes);renderPalettes();toast("Added to "+p.name);
}
function setColour(value,record=true){
  let c=String(value||"").trim();
  if(!/^#[0-9a-f]{6}$/i.test(c))return false;
  c=c.toUpperCase();state.colour=c;
  const rgb=hexToRgb(c),hsv=rgbToHsv(rgb[0],rgb[1],rgb[2]);
  state.colourHue=hsv[0];state.colourSat=hsv[1];state.colourVal=hsv[2];
  $("#colourPicker").value=c;$("#hexInput").value=c;$("#colourDot").style.background=c;
  if(record){
    state.recentColours=[c].concat(state.recentColours.filter(x=>x!==c)).slice(0,12);
    saveJSON(RECENT_COLOUR_KEY,state.recentColours);renderRecentColours();
  }
  refreshColourPickers();renderPalettes();
  return true;
}
function setColourFromHsv(h,s,v,record=false){
  state.colourHue=((h%360)+360)%360;state.colourSat=clamp(s,0,1);state.colourVal=clamp(v,0,1);
  const rgb=hsvToRgb(state.colourHue,state.colourSat,state.colourVal),hex=rgbToHex(...rgb);
  state.colour=hex;$("#colourPicker").value=hex;$("#hexInput").value=hex;$("#colourDot").style.background=hex;
  $("#currentColourChip").style.background=hex;$("#currentColourText").textContent=hex;
  if(record){
    state.recentColours=[hex].concat(state.recentColours.filter(x=>x!==hex)).slice(0,12);
    saveJSON(RECENT_COLOUR_KEY,state.recentColours);renderRecentColours();
  }
  refreshColourPickers();
}
function pickDiscAt(clientX,clientY,record=false){
  const cv=$("#colourDisc"),r=cv.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2,dx=clientX-cx,dy=clientY-cy,max=r.width/2;
  const sat=clamp(Math.hypot(dx,dy)/max,0,1),h=(Math.atan2(dy,dx)*180/Math.PI+360)%360;
  setColourFromHsv(h,sat,1,record);
}
function pickClassicAt(clientX,clientY,record=false){
  const cv=$("#classicSquare"),r=cv.getBoundingClientRect();
  const s=clamp((clientX-r.left)/r.width,0,1),v=1-clamp((clientY-r.top)/r.height,0,1);
  setColourFromHsv(state.colourHue,s,v,record);
}
function commitCurrentColour(){
  state.recentColours=[state.colour].concat(state.recentColours.filter(x=>x!==state.colour)).slice(0,12);
  saveJSON(RECENT_COLOUR_KEY,state.recentColours);renderRecentColours();renderPalettes();
}
function setColourTab(tab){
  Array.from(document.querySelectorAll(".colour-tab")).forEach(b=>b.classList.toggle("active",b.dataset.colourTab===tab));
  Array.from(document.querySelectorAll(".colour-view")).forEach(v=>v.classList.toggle("hidden",v.dataset.colourView!==tab));
  if(tab==="disc")drawColourDisc();if(tab==="classic")drawClassicPicker();if(tab==="palettes")renderPalettes();
}
function sampleCanvasColour(e){
  const r=display.getBoundingClientRect(),x=clamp(Math.floor((e.clientX-r.left)*W/r.width),0,W-1),y=clamp(Math.floor((e.clientY-r.top)*H/r.height),0,H-1);
  const p=dctx.getImageData(x,y,1,1).data;
  setColour(rgbToHex(p[0],p[1],p[2]),true);
  state.eyedropper=false;refreshColourPickers();toast("Colour picked");
}
function renderLayers(){
  const root=$("#layersList");root.innerHTML="";
  $("#layersSideLabel").textContent=state.designKind==="blank"?"Canvas":(state.activeView==="front"?"Front":"Back");

  state.layers.forEach((layer,index)=>{
    const row=document.createElement("div");
    row.className="layer-row"+(layer.id===state.activeLayerId?" active":"");
    row.dataset.layerId=layer.id;

    const eye=document.createElement("button");
    eye.className="layer-eye";eye.type="button";eye.textContent=layer.visible?"◉":"○";
    eye.title=layer.visible?"Hide layer":"Show layer";
    eye.onclick=e=>{e.stopPropagation();layer.visible=!layer.visible;render();renderLayers();scheduleSave()};

    const thumb=document.createElement("img");
    thumb.className="layer-thumb";thumb.alt="";thumb.src=layerThumbnail(layer);

    const name=document.createElement("button");
    name.className="layer-name";name.type="button";
    name.innerHTML=escapeHtml(layer.name)+"<span class=\"layer-sub\">"+Math.round(layer.opacity*100)+"% · "+blendLabel(layer.blend)+"</span>";
    name.onclick=e=>{e.stopPropagation();renameLayer(layer)};

    const more=document.createElement("button");
    more.className="layer-more";more.type="button";more.textContent="•••";more.title="Layer options";

    const grab=document.createElement("button");
    grab.className="layer-grab";grab.type="button";grab.textContent="≡";grab.title="Drag to reorder";

    const menu=document.createElement("div");menu.className="layer-menu hidden";
    const dup=document.createElement("button");dup.type="button";dup.textContent="Duplicate";dup.onclick=e=>{e.stopPropagation();duplicateLayer(layer)};
    const rename=document.createElement("button");rename.type="button";rename.textContent="Rename";rename.onclick=e=>{e.stopPropagation();renameLayer(layer)};
    const del=document.createElement("button");del.type="button";del.textContent="Delete";del.className="danger";del.onclick=e=>{e.stopPropagation();deleteLayer(layer)};
    menu.append(dup,rename,del);

    const blendRow=document.createElement("label");blendRow.className="layer-blend-row hidden";
    const blendText=document.createElement("span");blendText.textContent="Blend";
    const blend=document.createElement("select");
    [
      ["source-over","Normal"],["multiply","Multiply"],["screen","Screen"],["overlay","Overlay"],
      ["soft-light","Soft Light"],["hard-light","Hard Light"],["color-dodge","Color Dodge"],["color-burn","Color Burn"],
      ["darken","Darken"],["lighten","Lighten"],["difference","Difference"],["hue","Hue"],
      ["saturation","Saturation"],["color","Color"],["luminosity","Luminosity"]
    ].forEach(([v,l])=>{const o=document.createElement("option");o.value=v;o.textContent=l;if(layer.blend===v)o.selected=true;blend.appendChild(o)});
    blend.onchange=e=>{layer.blend=e.target.value;render();name.querySelector(".layer-sub").textContent=Math.round(layer.opacity*100)+"% · "+blendLabel(layer.blend);scheduleSave()};
    blendRow.append(blendText,blend);

    const opacity=document.createElement("label");opacity.className="layer-opacity hidden";
    const opText=document.createElement("span");opText.textContent="Opacity";
    const range=document.createElement("input");range.type="range";range.min="0";range.max="100";range.value=Math.round(layer.opacity*100);
    const out=document.createElement("span");out.textContent=Math.round(layer.opacity*100)+"%";
    range.oninput=e=>{
      layer.opacity=+e.target.value/100;out.textContent=e.target.value+"%";
      const sub=name.querySelector(".layer-sub");if(sub)sub.textContent=e.target.value+"% · "+blendLabel(layer.blend);
      render();
    };
    range.onchange=()=>scheduleSave();
    opacity.append(opText,range,out);

    more.onclick=e=>{
      e.stopPropagation();
      const opening=menu.classList.contains("hidden");
      $$(".layer-menu",root).forEach(x=>x.classList.add("hidden"));
      $$(".layer-blend-row",root).forEach(x=>x.classList.add("hidden"));
      $$(".layer-opacity",root).forEach(x=>x.classList.add("hidden"));
      if(opening){menu.classList.remove("hidden");blendRow.classList.remove("hidden");opacity.classList.remove("hidden")}
    };

    row.onclick=()=>setActiveLayer(layer.id);

    grab.onpointerdown=e=>{
      e.preventDefault();e.stopPropagation();
      setActiveLayer(layer.id);
      state.layerDrag={pointerId:e.pointerId,fromId:layer.id,toId:layer.id,moved:false};
      row.classList.add("dragging");
      try{grab.setPointerCapture(e.pointerId)}catch(_){}
    };
    grab.onpointermove=e=>{
      const drag=state.layerDrag;if(!drag||drag.pointerId!==e.pointerId)return;
      const target=document.elementFromPoint?document.elementFromPoint(e.clientX,e.clientY):null;
      const targetRow=target&&target.closest?target.closest(".layer-row"):null;
      if(!targetRow||!root.contains(targetRow))return;
      const toId=targetRow.dataset.layerId;if(!toId||toId===drag.toId)return;
      drag.toId=toId;drag.moved=true;
      $$(".layer-row",root).forEach(x=>x.classList.remove("drop-target"));
      targetRow.classList.add("drop-target");
    };
    const finishDrag=e=>{
      const drag=state.layerDrag;if(!drag||drag.pointerId!==e.pointerId)return;
      state.layerDrag=null;
      $$(".layer-row",root).forEach(x=>x.classList.remove("dragging","drop-target"));
      if(drag.fromId!==drag.toId)reorderLayer(drag.fromId,drag.toId);
    };
    grab.onpointerup=finishDrag;grab.onpointercancel=finishDrag;

    // Desktop drag fallback.
    grab.draggable=true;
    grab.ondragstart=e=>{e.stopPropagation();e.dataTransfer.setData("text/plain",layer.id);e.dataTransfer.effectAllowed="move";row.classList.add("dragging")};
    row.ondragover=e=>{e.preventDefault();e.dataTransfer.dropEffect="move";row.classList.add("drop-target")};
    row.ondragleave=()=>row.classList.remove("drop-target");
    row.ondrop=e=>{e.preventDefault();e.stopPropagation();row.classList.remove("drop-target");const fromId=e.dataTransfer.getData("text/plain");reorderLayer(fromId,layer.id)};
    grab.ondragend=()=>$$(".layer-row",root).forEach(x=>x.classList.remove("dragging","drop-target"));

    row.append(eye,thumb,name,more,grab,menu,blendRow,opacity);
    root.appendChild(row);
  });
}
function blendLabel(v){
  return {
    "source-over":"Normal",multiply:"Multiply",screen:"Screen",overlay:"Overlay","soft-light":"Soft Light",
    "hard-light":"Hard Light","color-dodge":"Color Dodge","color-burn":"Color Burn",darken:"Darken",
    lighten:"Lighten",difference:"Difference",hue:"Hue",saturation:"Saturation",color:"Color",luminosity:"Luminosity"
  }[v]||"Normal";
}
function layerThumbnail(layer){
  const c=document.createElement("canvas");c.width=48;c.height=48;const x=c.getContext("2d");
  x.fillStyle="#fff";x.fillRect(0,0,48,48);x.globalAlpha=layer.opacity;x.drawImage(layer.canvas,0,0,48,48);
  return c.toDataURL("image/jpeg",.72);
}
function renameLayer(layer){
  const v=prompt("Layer name",layer.name);if(v===null)return;const n=v.trim();if(n)layer.name=n;
  renderLayers();scheduleSave();
}
function duplicateLayer(layer){
  const copy=newLayer(layer.name+" copy");copy.visible=layer.visible;copy.opacity=layer.opacity;copy.blend=layer.blend;
  copy.canvas.getContext("2d").drawImage(layer.canvas,0,0);
  const i=state.layers.indexOf(layer);state.layers.splice(i,0,copy);
  state.activeLayerId=copy.id;state.activeLayerByView[state.activeView]=copy.id;
  render();renderLayers();resetHistory();scheduleSave();
}
function deleteLayer(layer){
  if(state.layers.length<=1){toast("Keep at least one layer");return}
  const i=state.layers.indexOf(layer);state.layers.splice(i,1);
  if(state.activeLayerId===layer.id)state.activeLayerId=state.layers[Math.min(i,state.layers.length-1)].id;
  state.activeLayerByView[state.activeView]=state.activeLayerId;
  render();renderLayers();resetHistory();scheduleSave();
}
function reorderLayer(fromId,toId){
  const from=state.layers.findIndex(l=>l.id===fromId),to=state.layers.findIndex(l=>l.id===toId);
  if(from<0||to<0||from===to)return;
  const [layer]=state.layers.splice(from,1);
  const adjusted=state.layers.findIndex(l=>l.id===toId);
  state.layers.splice(adjusted<0?state.layers.length:adjusted,0,layer);
  render();renderLayers();scheduleSave();
}
function addLayer(){
  const layer=newLayer("Layer "+(state.layers.length+1));
  state.layers.unshift(layer);state.activeLayerId=layer.id;state.activeLayerByView[state.activeView]=layer.id;
  renderLayers();resetHistory();scheduleSave();
}
function closePanels(){$$(".floating-panel").forEach(p=>p.classList.add("hidden"))}
function togglePanel(panel){
  const was=panel.classList.contains("hidden");closePanels();if(was)panel.classList.remove("hidden");
}
$$("[data-close-panel]").forEach(b=>b.onclick=closePanels);

function fitCanvas(){
  const r=viewport.getBoundingClientRect();
  const baseW=720,baseH=880;
  const s=Math.min((r.width-20)/baseW,(r.height-20)/baseH);
  state.viewScale=clamp(s,.15,2.5);state.viewX=(r.width-baseW*state.viewScale)/2;state.viewY=(r.height-baseH*state.viewScale)/2;
  applyView();
}
function applyView(){stage.style.transform="translate3d("+state.viewX+"px,"+state.viewY+"px,0) scale("+state.viewScale+")"}
function zoomAt(f,clientX,clientY){
  const r=viewport.getBoundingClientRect(),mx=clientX-r.left,my=clientY-r.top;
  const old=state.viewScale,cx=(mx-state.viewX)/old,cy=(my-state.viewY)/old;
  state.viewScale=clamp(old*f,.2,5);state.viewX=mx-cx*state.viewScale;state.viewY=my-cy*state.viewScale;applyView();
}
function pointFromEvent(e){
  const r=display.getBoundingClientRect();
  return {x:clamp((e.clientX-r.left)*W/r.width,0,W),y:clamp((e.clientY-r.top)*H/r.height,0,H),pressure:e.pointerType==="pen"&&e.pressure>0?e.pressure:.55};
}

function beginStroke(p){
  const layer=activeLayer();if(!layer)return;
  state.drawing=true;
  state.lastPoint=p;
  state.textureCarry=0;
  state.textureIndex=0;

  if(state.tool==="brush"&&!isTexture(state.brush.mode)){
    state.strokePoints=[p];
    state.strokeBase=layer.canvas.getContext("2d").getImageData(0,0,W,H);
    state.strokeCanvas=document.createElement("canvas");
    state.strokeCanvas.width=W;state.strokeCanvas.height=H;
    redrawContinuousStroke(layer);
  }else if(state.tool==="eraser"){
    if(state.eraserMode==="stroke"){
      state.strokeEraseLast=p;eraseConnectedStroke(layer,p);
    }else{
      state.strokePoints=[p];
      state.strokeBase=layer.canvas.getContext("2d").getImageData(0,0,W,H);
      state.strokeCanvas=document.createElement("canvas");
      state.strokeCanvas.width=W;state.strokeCanvas.height=H;
      redrawContinuousStroke(layer);
    }
  }else if(state.tool==="brush"&&isTexture(state.brush.mode)){
    drawTexture(layer.canvas.getContext("2d"),p,p);
  }
  render();
}
function continueStroke(p){
  if(!state.drawing)return;
  const layer=activeLayer();if(!layer)return;
  const lctx=layer.canvas.getContext("2d");

  if((state.tool==="brush"&&!isTexture(state.brush.mode))||(state.tool==="eraser"&&state.eraserMode==="partial")){
    const prev=state.strokePoints[state.strokePoints.length-1]||p;
    const factor=state.brush.mode==="custom"?clamp(.78-(Number(state.brush.smoothing)||0)*.0058,.20,.78):state.brush.mode==="pen"?.58:state.brush.mode==="marker"?.50:state.brush.mode==="chisel"?.48:.46;
    const smooth={
      x:prev.x+(p.x-prev.x)*factor,
      y:prev.y+(p.y-prev.y)*factor,
      pressure:prev.pressure+(p.pressure-prev.pressure)*.5
    };
    state.strokePoints.push(smooth);
    redrawContinuousStroke(layer);
  }else if(state.tool==="eraser"&&state.eraserMode==="stroke"){
    const last=state.strokeEraseLast||p;
    if(Math.hypot(p.x-last.x,p.y-last.y)>Math.max(6,state.size*.35)){
      eraseConnectedStroke(layer,p);state.strokeEraseLast=p;
    }
  }else if(state.tool==="smudge"){
    smudgeLine(layer.canvas,state.lastPoint,p);
  }else if(isTexture(state.brush.mode)){
    drawTexture(lctx,state.lastPoint,p);
  }
  state.lastPoint=p;
  render();
}
function endStroke(){
  if(!state.drawing)return;
  state.drawing=false;
  state.lastPoint=null;
  state.strokePoints=[];
  state.strokeBase=null;
  state.strokeCanvas=null;
  state.textureCarry=0;
  state.strokeEraseLast=null;
  pushHistory();renderLayers();scheduleSave();
}
function brushWidth(p){
  const pressure=p&&p.pressure?(.62+p.pressure*.62):1;
  return Math.max(1,state.size*pressure);
}
function redrawContinuousStroke(layer){
  if(!state.strokeBase||!state.strokeCanvas)return;
  const target=layer.canvas.getContext("2d");
  target.putImageData(state.strokeBase,0,0);

  const sc=state.strokeCanvas, sctx=sc.getContext("2d");
  sctx.clearRect(0,0,W,H);
  const pts=state.strokePoints;
  if(!pts.length)return;

  if(state.tool==="eraser"){
    drawSmoothPathToMask(sctx,pts,"#000",state.size,"round",false);
    target.save();
    target.globalCompositeOperation="destination-out";
    target.globalAlpha=1;
    target.drawImage(sc,0,0);
    target.restore();
    return;
  }

  const b=state.brush;
  if(b.mode==="custom")drawCustomBrushStroke(sctx,pts,{...b,size:state.size},state.colour,1);
  else drawSmoothPathToMask(sctx,pts,state.colour,state.size,"round",true);

  if(b.mode==="rough"&&pts.length>1){
    sctx.save();sctx.globalAlpha=.36;sctx.translate(1.5,-1.5);
    drawSmoothPathToMask(sctx,pts,state.colour,Math.max(1,state.size*.22),"round",false);
    sctx.restore();
  }

  let modeOpacity=b.mode==="custom"?1:b.opacity;
  if(b.mode==="pencil")modeOpacity*=.88;
  if(b.mode==="soft")modeOpacity*=.72;
  if(b.mode==="rough")modeOpacity*=.78;

  target.save();
  target.globalCompositeOperation="source-over";
  target.globalAlpha=state.opacity*modeOpacity;
  target.drawImage(sc,0,0);
  target.restore();
}
function drawSmoothPathToMask(ctx,pts,colour,size,lineCap,usePressure){
  ctx.save();
  ctx.strokeStyle=colour;
  ctx.fillStyle=colour;
  ctx.globalAlpha=1;
  ctx.lineJoin="round";
  ctx.lineCap=lineCap||"round";

  if(pts.length===1){
    ctx.beginPath();ctx.arc(pts[0].x,pts[0].y,Math.max(1,size*.5),0,Math.PI*2);ctx.fill();ctx.restore();return;
  }

  for(let i=1;i<pts.length;i++){
    const p0=pts[Math.max(0,i-2)],p1=pts[i-1],p2=pts[i];
    const start=i===1?p1:{x:(p0.x+p1.x)/2,y:(p0.y+p1.y)/2};
    const end={x:(p1.x+p2.x)/2,y:(p1.y+p2.y)/2};
    const pressure=usePressure?(p1.pressure+p2.pressure)/2:.55;
    ctx.lineWidth=usePressure?Math.max(1,size*(.62+pressure*.62)):Math.max(1,size);
    ctx.beginPath();
    ctx.moveTo(start.x,start.y);
    ctx.quadraticCurveTo(p1.x,p1.y,end.x,end.y);
    ctx.stroke();
  }

  const last=pts[pts.length-1],prev=pts[pts.length-2];
  ctx.lineWidth=usePressure?Math.max(1,size*(.62+last.pressure*.62)):Math.max(1,size);
  ctx.beginPath();
  ctx.moveTo((prev.x+last.x)/2,(prev.y+last.y)/2);
  ctx.lineTo(last.x,last.y);
  ctx.stroke();
  ctx.restore();
}
const customAssetCache=new Map();
const customStampCache=new Map();

function customAsset(brush,key){
  const src=brush&&brush[key];if(!src)return null;
  const cacheKey=brush.id+":"+key;
  const found=customAssetCache.get(cacheKey);
  if(found&&found.src===src)return found.img.complete?found.img:null;
  const img=new Image();
  customAssetCache.set(cacheKey,{src,img});
  img.onload=()=>{customStampCache.clear();if(state.brushDraft)renderBrushStudioPreview();renderBrushList()};
  img.src=src;
  return img.complete&&img.naturalWidth?img:null;
}
function customStamp(brush,colour){
  const key=[brush.id,brush.shapeData||"",brush.grainData||"",colour].join("|");
  if(customStampCache.has(key))return customStampCache.get(key);
  const cv=document.createElement("canvas");cv.width=128;cv.height=128;const c=cv.getContext("2d");
  const shape=customAsset(brush,"shapeData"),grain=customAsset(brush,"grainData");
  c.clearRect(0,0,128,128);
  if(shape)c.drawImage(shape,0,0,128,128);
  else{c.fillStyle="#fff";c.beginPath();c.arc(64,64,61,0,Math.PI*2);c.fill()}
  if(grain){
    c.globalCompositeOperation="destination-in";
    c.drawImage(grain,0,0,128,128);
  }
  c.globalCompositeOperation="source-in";c.fillStyle=colour;c.fillRect(0,0,128,128);
  c.globalCompositeOperation="source-over";
  customStampCache.set(key,cv);return cv;
}
function drawCustomBrushStroke(ctx,pts,brush,colour,scale=1){
  if(!pts||!pts.length)return;
  const base=Math.max(1,(Number(brush.size)||22)*scale);
  const spacing=Math.max(1.2,base*clamp((Number(brush.spacing)||12)/100,.01,1));
  const pressureStrength=clamp((Number(brush.pressure)||0)/100,0,1);
  const taperStrength=clamp((Number(brush.taper)||0)/100,0,1);
  const stamp=customStamp(brush,colour);

  if(pts.length===1){
    const p=pts[0],ps=1-pressureStrength+pressureStrength*(.35+(p.pressure||.55)*.9);
    const sz=base*ps*(1-taperStrength*.65);
    ctx.drawImage(stamp,p.x-sz/2,p.y-sz/2,sz,sz);return;
  }

  const segs=[];let total=0;
  for(let i=1;i<pts.length;i++){
    const a=pts[i-1],b=pts[i],len=Math.hypot(b.x-a.x,b.y-a.y);
    if(len>0){segs.push({a,b,len,start:total});total+=len}
  }
  if(!total)return;

  for(let d=0;d<=total;d+=spacing){
    let seg=segs[segs.length-1];
    for(let i=0;i<segs.length;i++){if(d<=segs[i].start+segs[i].len){seg=segs[i];break}}
    const local=clamp((d-seg.start)/seg.len,0,1);
    const x=seg.a.x+(seg.b.x-seg.a.x)*local,y=seg.a.y+(seg.b.y-seg.a.y)*local;
    const pressure=(seg.a.pressure||.55)+((seg.b.pressure||.55)-(seg.a.pressure||.55))*local;
    const progress=d/total,edge=Math.min(1,progress*7,(1-progress)*7);
    const taperScale=(1-taperStrength)+taperStrength*Math.max(.08,edge);
    const pressureScale=(1-pressureStrength)+pressureStrength*(.35+pressure*.9);
    const sz=Math.max(.8,base*taperScale*pressureScale);
    const angle=Math.atan2(seg.b.y-seg.a.y,seg.b.x-seg.a.x);
    ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.drawImage(stamp,-sz/2,-sz/2,sz,sz);ctx.restore();
  }
}
function renderBrushStudioPreview(){
  const cv=$("#brushStudioPreview");if(!cv||!state.brushDraft)return;
  const c=cv.getContext("2d"),w=cv.width,h=cv.height;c.clearRect(0,0,w,h);
  c.fillStyle="#fff";c.fillRect(0,0,w,h);
  const pts=[];
  for(let i=0;i<=70;i++){
    const t=i/70;
    pts.push({x:30+t*(w-60),y:h*.52+Math.sin(t*Math.PI*2.1)*h*.13,pressure:.25+.75*Math.sin(t*Math.PI)});
  }
  c.save();c.globalAlpha=state.brushDraft.opacity||1;
  drawCustomBrushStroke(c,pts,state.brushDraft,"#3B2730",1);
  c.restore();
}
function normaliseCustomBrushes(){
  if(!Array.isArray(state.customBrushes))state.customBrushes=[];
  state.customBrushes=state.customBrushes.filter(Boolean).map((b,i)=>({
    id:b.id||("cb"+Date.now().toString(36)+i),name:String(b.name||"Custom Brush"),category:"custom",note:"Custom Brush",mode:"custom",
    size:clamp(Number(b.size)||22,1,120),opacity:clamp(Number(b.opacity)||1,.05,1),spacing:clamp(Number(b.spacing)||12,1,100),
    taper:clamp(Number(b.taper)||0,0,100),smoothing:clamp(Number(b.smoothing)||55,0,100),pressure:clamp(Number(b.pressure)||65,0,100),
    shapeData:b.shapeData||null,grainData:b.grainData||null
  }));
}
function smudgeLine(canvas,a,b){
  const c=canvas.getContext("2d"),r=Math.max(8,state.size*.7),x=clamp(a.x-r,0,W-r*2),y=clamp(a.y-r,0,H-r*2),size=Math.max(4,Math.round(r*2));
  const temp=document.createElement("canvas");temp.width=size;temp.height=size;const t=temp.getContext("2d");t.drawImage(canvas,x,y,size,size,0,0,size,size);
  c.save();c.globalAlpha=.18*state.opacity;c.filter="blur("+Math.max(1,r*.12)+"px)";c.drawImage(temp,b.x-r,b.y-r,size,size);c.restore();
}
function textureSpacing(mode,s){
  const m={
    crochet:.56,knit:.46,fuzzy:.28,stitch:.55,cross:.62,embroidered:.23,weave:.45,denim:.30,
    boucle:.48,fur:.24,sequin:.68,rhinestone:.72,glitter:.23,chalk:.22,watercolour:.20,
    velvet:.20,satin:.18,leather:.38,mesh:.56,lace:.72,bead:.66
  };
  return Math.max(4,s*(m[mode]||.42));
}
function drawTexture(ctx,a,b){
  const dx=b.x-a.x,dy=b.y-a.y,dist=Math.hypot(dx,dy),angle=dist?Math.atan2(dy,dx):0;
  const spacing=textureSpacing(state.brush.mode,state.size);
  if(dist<.01){
    textureMark(ctx,state.brush.mode,a.x,a.y,state.size,angle,state.textureIndex++,false,state.brush.opacity);
    return;
  }
  let d=state.textureCarry?spacing-state.textureCarry:0;
  while(d<=dist){
    const t=d/dist;
    textureMark(ctx,state.brush.mode,a.x+dx*t,a.y+dy*t,state.size,angle,state.textureIndex++,false,state.brush.opacity);
    d+=spacing;
  }
  state.textureCarry=(state.textureCarry+dist)%spacing;
}
function textureMark(ctx,mode,x,y,s,angle,index,preview=false,opacity=1){
  const col=preview?"#202024":state.colour;
  const baseAlpha=preview?Math.max(.7,opacity):state.opacity*opacity;
  ctx.save();
  ctx.translate(x,y);ctx.rotate(angle);
  ctx.strokeStyle=col;ctx.fillStyle=col;ctx.lineCap="round";ctx.lineJoin="round";
  ctx.globalAlpha=baseAlpha;

  if(mode==="crochet"){
    ctx.lineWidth=Math.max(1,s*.075);
    ctx.beginPath();ctx.ellipse(-s*.12,0,s*.24,s*.15,-.18,0,Math.PI*2);ctx.stroke();
    ctx.beginPath();ctx.ellipse(s*.14,0,s*.24,s*.15,.18,0,Math.PI*2);ctx.stroke();
    ctx.beginPath();ctx.moveTo(-s*.30,0);ctx.lineTo(s*.32,0);ctx.globalAlpha*=.45;ctx.stroke();
  }else if(mode==="knit"){
    ctx.lineWidth=Math.max(1,s*.065);
    for(const off of [-s*.13,s*.13]){
      ctx.beginPath();ctx.moveTo(-s*.30,off);ctx.quadraticCurveTo(-s*.05,off-s*.18,s*.12,off);ctx.quadraticCurveTo(s*.24,off+s*.16,s*.34,off);ctx.stroke();
    }
  }else if(mode==="fuzzy"){
    ctx.lineWidth=Math.max(1,s*.10);ctx.beginPath();ctx.moveTo(-s*.34,0);ctx.lineTo(s*.34,0);ctx.stroke();
    ctx.lineWidth=Math.max(.7,s*.035);ctx.globalAlpha*=.68;
    for(let k=0;k<8;k++){const px=(Math.random()-.5)*s*.62,side=k%2?1:-1,len=s*(.14+Math.random()*.22);ctx.beginPath();ctx.moveTo(px,0);ctx.lineTo(px+len*.22,side*len);ctx.stroke()}
  }else if(mode==="stitch"){
    ctx.lineWidth=Math.max(1,s*.09);ctx.beginPath();ctx.moveTo(-s*.30,0);ctx.lineTo(s*.30,0);ctx.stroke();
    ctx.globalAlpha*=.35;ctx.beginPath();ctx.arc(-s*.32,0,s*.04,0,Math.PI*2);ctx.arc(s*.32,0,s*.04,0,Math.PI*2);ctx.fill();
  }else if(mode==="cross"){
    ctx.lineWidth=Math.max(1,s*.07);ctx.beginPath();ctx.moveTo(-s*.20,-s*.20);ctx.lineTo(s*.20,s*.20);ctx.moveTo(s*.20,-s*.20);ctx.lineTo(-s*.20,s*.20);ctx.stroke();
  }else if(mode==="embroidered"){
    ctx.lineWidth=Math.max(.8,s*.035);
    for(let k=-3;k<=3;k++){ctx.globalAlpha=baseAlpha*(.62+Math.random()*.3);ctx.beginPath();ctx.moveTo(-s*.34,k*s*.035);ctx.quadraticCurveTo(0,k*s*.02+Math.sin(index+k)*s*.035,s*.34,k*s*.035);ctx.stroke()}
  }else if(mode==="weave"){
    ctx.lineWidth=Math.max(.7,s*.035);ctx.globalAlpha*=.78;
    for(let k=-1;k<=1;k++){const o=k*s*.16;ctx.beginPath();ctx.moveTo(-s*.34,o);ctx.lineTo(s*.34,o);ctx.stroke();ctx.beginPath();ctx.moveTo(o,-s*.30);ctx.lineTo(o,s*.30);ctx.stroke()}
  }else if(mode==="denim"){
    ctx.lineWidth=Math.max(.7,s*.03);ctx.globalAlpha*=.62;
    for(let k=-2;k<=2;k++){ctx.beginPath();ctx.moveTo(-s*.32,k*s*.10);ctx.lineTo(s*.32,k*s*.10+s*.20);ctx.stroke()}
    ctx.globalAlpha*=.45;for(let k=0;k<4;k++){ctx.beginPath();ctx.arc((Math.random()-.5)*s*.5,(Math.random()-.5)*s*.35,s*.018,0,Math.PI*2);ctx.fill()}
  }else if(mode==="boucle"){
    ctx.lineWidth=Math.max(1,s*.055);
    const loops=3;for(let k=0;k<loops;k++){const ox=(k-1)*s*.18,ry=s*(.10+((index+k)%3)*.025);ctx.beginPath();ctx.ellipse(ox,(k%2?1:-1)*s*.04,s*.13,ry,k*.22,0,Math.PI*2);ctx.stroke()}
    ctx.beginPath();ctx.arc(s*.18,-s*.10,s*.055,0,Math.PI*2);ctx.fill();
  }else if(mode==="fur"){
    ctx.lineWidth=Math.max(.65,s*.025);
    for(let k=0;k<8;k++){const yy=(k-3.5)*s*.055,len=s*(.25+Math.random()*.28),bend=(Math.random()-.5)*s*.12;ctx.globalAlpha=baseAlpha*(.45+Math.random()*.4);ctx.beginPath();ctx.moveTo(-s*.20,yy);ctx.quadraticCurveTo(0,yy+bend,len,yy+bend*.35);ctx.stroke()}
  }else if(mode==="sequin"){
    const r=s*.22;ctx.lineWidth=Math.max(1,s*.055);ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.stroke();
    ctx.globalAlpha*=.45;ctx.beginPath();ctx.arc(-r*.28,-r*.28,r*.22,0,Math.PI*2);ctx.fill();
  }else if(mode==="rhinestone"){
    const r=s*.25;ctx.lineWidth=Math.max(1,s*.045);ctx.beginPath();ctx.moveTo(0,-r);ctx.lineTo(r,0);ctx.lineTo(0,r);ctx.lineTo(-r,0);ctx.closePath();ctx.stroke();
    ctx.beginPath();ctx.moveTo(0,-r);ctx.lineTo(0,r);ctx.moveTo(-r,0);ctx.lineTo(r,0);ctx.stroke();
    ctx.fillStyle="#fff";ctx.globalAlpha=.7;ctx.beginPath();ctx.arc(-r*.22,-r*.22,r*.14,0,Math.PI*2);ctx.fill();
  }else if(mode==="glitter"){
    ctx.lineWidth=Math.max(.7,s*.025);
    for(let k=0;k<5;k++){const gx=(Math.random()-.5)*s*.52,gy=(Math.random()-.5)*s*.45,r=s*(.025+Math.random()*.035);ctx.globalAlpha=baseAlpha*(.45+Math.random()*.55);ctx.beginPath();ctx.arc(gx,gy,r,0,Math.PI*2);ctx.fill()}
    if(index%3===0){ctx.globalAlpha=baseAlpha*.8;ctx.beginPath();ctx.moveTo(-s*.09,0);ctx.lineTo(s*.09,0);ctx.moveTo(0,-s*.09);ctx.lineTo(0,s*.09);ctx.stroke()}
  }else if(mode==="chalk"){
    ctx.globalAlpha=baseAlpha*.28;ctx.lineWidth=s*.24;ctx.beginPath();ctx.moveTo(-s*.28,0);ctx.lineTo(s*.28,0);ctx.stroke();
    ctx.globalAlpha=baseAlpha*.62;for(let k=0;k<7;k++){ctx.beginPath();ctx.arc((Math.random()-.5)*s*.58,(Math.random()-.5)*s*.28,s*(.012+Math.random()*.025),0,Math.PI*2);ctx.fill()}
  }else if(mode==="watercolour"){
    ctx.globalAlpha=baseAlpha*.09;ctx.filter="blur("+Math.max(1,s*.06)+"px)";
    for(let k=0;k<3;k++){ctx.beginPath();ctx.ellipse((k-1)*s*.12,(Math.random()-.5)*s*.10,s*.34,s*.25,0,0,Math.PI*2);ctx.fill()}
  }else if(mode==="velvet"){
    ctx.globalAlpha=baseAlpha*.32;ctx.lineWidth=s*.24;ctx.beginPath();ctx.moveTo(-s*.30,0);ctx.lineTo(s*.30,0);ctx.stroke();
    ctx.globalAlpha=baseAlpha*.7;ctx.lineWidth=Math.max(.6,s*.02);for(let k=0;k<9;k++){const px=(k-4)*s*.07;ctx.beginPath();ctx.moveTo(px,-s*.16);ctx.lineTo(px+s*.04,s*.16);ctx.stroke()}
  }else if(mode==="satin"){
    ctx.globalAlpha=baseAlpha*.55;ctx.lineWidth=s*.34;ctx.beginPath();ctx.moveTo(-s*.34,0);ctx.lineTo(s*.34,0);ctx.stroke();
    ctx.strokeStyle=preview?"#fff":"rgba(255,255,255,.82)";ctx.globalAlpha=.62;ctx.lineWidth=Math.max(1,s*.055);ctx.beginPath();ctx.moveTo(-s*.30,-s*.06);ctx.lineTo(s*.30,-s*.06);ctx.stroke();
  }else if(mode==="leather"){
    ctx.lineWidth=Math.max(.7,s*.025);ctx.globalAlpha=baseAlpha*.55;
    for(let k=0;k<4;k++){const ox=(Math.random()-.5)*s*.42,oy=(Math.random()-.5)*s*.30,r=s*(.07+Math.random()*.06);ctx.beginPath();for(let n=0;n<6;n++){const a=n/6*Math.PI*2,rr=r*(.75+Math.random()*.35),px=ox+Math.cos(a)*rr,py=oy+Math.sin(a)*rr;n?ctx.lineTo(px,py):ctx.moveTo(px,py)}ctx.closePath();ctx.stroke()}
  }else if(mode==="mesh"){
    ctx.lineWidth=Math.max(.7,s*.035);ctx.globalAlpha*=.78;
    const rw=s*.26,rh=s*.22;ctx.beginPath();ctx.moveTo(-rw,0);ctx.lineTo(0,-rh);ctx.lineTo(rw,0);ctx.lineTo(0,rh);ctx.closePath();ctx.stroke();
  }else if(mode==="lace"){
    ctx.lineWidth=Math.max(.8,s*.045);
    ctx.beginPath();ctx.arc(-s*.16,0,s*.16,Math.PI,0);ctx.arc(s*.16,0,s*.16,Math.PI,0);ctx.stroke();
    ctx.globalAlpha*=.7;ctx.beginPath();ctx.arc(0,s*.05,s*.055,0,Math.PI*2);ctx.fill();
  }else if(mode==="bead"){
    const r=s*.18;ctx.lineWidth=Math.max(1,s*.05);ctx.globalAlpha*=.7;ctx.beginPath();ctx.moveTo(-s*.34,0);ctx.lineTo(s*.34,0);ctx.stroke();
    ctx.globalAlpha=baseAlpha;ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.fill();
    ctx.fillStyle="#fff";ctx.globalAlpha=.55;ctx.beginPath();ctx.arc(-r*.28,-r*.28,r*.18,0,Math.PI*2);ctx.fill();
  }
  ctx.restore();
}
function pushHistory(){
  const layer=activeLayer();if(!layer)return;
  const entry={layerId:layer.id,data:layer.canvas.toDataURL("image/png")};
  if(state.historyIndex<state.history.length-1)state.history=state.history.slice(0,state.historyIndex+1);
  state.history.push(entry);if(state.history.length>12)state.history.shift();state.historyIndex=state.history.length-1;syncHistoryButtons();
}
function resetHistory(){state.history=[];state.historyIndex=-1;pushHistory()}
async function restoreHistory(index){
  const entry=state.history[index];if(!entry)return;const layer=state.layers.find(l=>l.id===entry.layerId);if(!layer)return;
  await drawDataUrl(layer.canvas,entry.data);render();renderLayers();scheduleSave();syncHistoryButtons();
}
function undo(){if(state.historyIndex<=0)return;state.historyIndex--;restoreHistory(state.historyIndex)}
function redo(){if(state.historyIndex>=state.history.length-1)return;state.historyIndex++;restoreHistory(state.historyIndex)}
function syncHistoryButtons(){$("#undoBtn").disabled=state.historyIndex<=0;$("#redoBtn").disabled=state.historyIndex>=state.history.length-1}

function serializeLayers(layers=state.layers){return layers.map(l=>({id:l.id,name:l.name,visible:l.visible,opacity:l.opacity,blend:l.blend,data:l.canvas.toDataURL("image/png")}))}
function thumbnailData(){
  const c=document.createElement("canvas");c.width=200;c.height=250;const x=c.getContext("2d");
  const full=document.createElement("canvas");full.width=W;full.height=H;
  compositeTo(full.getContext("2d"),false,"front",false);
  x.drawImage(full,0,0,200,250);
  return c.toDataURL("image/jpeg",.72);
}
function currentDesign(){
  return state.designs.find(d=>d.id===state.currentId)||null;
}
function saveCurrentDesign(){
  const d=currentDesign();if(!d)return;
  d.name=$("#designNameInput").value.trim()||"Untitled Artwork";
  d.kind=state.designKind;
  d.activeView=state.activeView;
  d.croquisVisible=state.croquisVisible;
  d.croquisOpacity=state.croquisOpacity;
  d.updatedAt=Date.now();
  d.views={front:serializeLayers(state.views.front),back:serializeLayers(state.views.back)};
  delete d.layers;delete d.croquis;
  d.thumbnail=thumbnailData();
  saveJSON(STORAGE_KEY,state.designs);
}
function scheduleSave(){clearTimeout(scheduleSave.t);scheduleSave.t=setTimeout(saveCurrentDesign,220)}
async function drawDataUrl(canvas,data){
  const ctx=canvas.getContext("2d");ctx.clearRect(0,0,W,H);if(!data)return;
  await new Promise(resolve=>{const img=new Image();img.onload=()=>{ctx.drawImage(img,0,0,W,H);resolve()};img.onerror=resolve;img.src=data});
}
async function deserializeLayerArray(savedLayers){
  const arr=[];
  for(const saved of savedLayers||[]){
    const l=newLayer(saved.name||"Layer");
    l.id=saved.id||layerUid();l.visible=saved.visible!==false;
    l.opacity=typeof saved.opacity==="number"?saved.opacity:1;
    l.blend=saved.blend||"source-over";
    await drawDataUrl(l.canvas,saved.data);
    arr.push(l);
  }
  if(!arr.length)arr.push(newLayer("Layer 1"));
  return arr;
}
async function loadDesign(design){
  state.currentId=design.id;
  state.designKind=design.kind||"fashion";
  state.activeView=design.activeView==="back"?"back":"front";
  state.croquisVisible=design.croquisVisible!==false&&state.designKind!=="blank";
  state.croquisOpacity=typeof design.croquisOpacity==="number"?design.croquisOpacity:.35;
  state.overlayOther=false;state.referenceImage=null;

  if(design.views){
    state.views.front=await deserializeLayerArray(design.views.front);
    state.views.back=await deserializeLayerArray(design.views.back);
  }else{
    const legacy=await deserializeLayerArray(design.layers||[]);
    state.views.front=design.croquis==="back"?[newLayer("Layer 1")]:legacy;
    state.views.back=design.croquis==="back"?legacy:[newLayer("Layer 1")];
  }

  state.activeLayerByView.front=state.views.front[0].id;
  state.activeLayerByView.back=state.views.back[0].id;
  state.layers=state.views[state.activeView];
  state.activeLayerId=state.activeLayerByView[state.activeView];

  $("#designNameInput").value=design.name||"Untitled Artwork";
  $("#croquisVisibleToggle").checked=state.croquisVisible;
  $("#croquisOpacitySlider").value=Math.round(state.croquisOpacity*100);
  $("#croquisOpacityOutput").textContent=Math.round(state.croquisOpacity*100)+"%";

  galleryScreen.classList.add("hidden");editorScreen.classList.remove("hidden");
  syncViewControls();render();renderLayers();resetHistory();requestAnimationFrame(fitCanvas);
}
function createDesign(kind){
  const now=Date.now(),d={
    id:uid(),name:"Untitled Artwork",kind:kind==="blank"?"blank":"fashion",
    activeView:"front",croquisVisible:kind!=="blank",croquisOpacity:.35,updatedAt:now,
    views:{front:[],back:[]},thumbnail:""
  };
  state.designs.unshift(d);saveJSON(STORAGE_KEY,state.designs);createModal.classList.add("hidden");
  loadDesign(d).then(saveCurrentDesign);
}
function returnToGallery(){
  saveCurrentDesign();closePanels();editorScreen.classList.add("hidden");galleryScreen.classList.remove("hidden");renderGallery();
}
function renderGallery(){
  galleryGrid.innerHTML="";emptyGallery.classList.toggle("hidden",state.designs.length>0);
  galleryGrid.classList.toggle("hidden",state.designs.length===0);
  state.designs.sort((a,b)=>(b.updatedAt||0)-(a.updatedAt||0));
  state.designs.forEach(d=>{
    const card=document.createElement("article");card.className="artwork-card"+(state.selectedGallery.has(d.id)?" selected":"");card.dataset.id=d.id;
    const thumb=document.createElement("button");thumb.className="artwork-thumb";
    if(d.thumbnail){const img=document.createElement("img");img.src=d.thumbnail;img.alt=d.name||"Artwork";thumb.appendChild(img)}
    thumb.onclick=()=>{if(state.selectMode){toggleGallerySelection(d.id);return}loadDesign(d)};
    const meta=document.createElement("div");meta.className="artwork-meta";
    const copy=document.createElement("div");copy.className="artwork-copy";copy.innerHTML="<strong>"+escapeHtml(d.name||"Untitled Artwork")+"</strong><small>"+formatDate(d.updatedAt||Date.now())+"</small>";
    const menu=document.createElement("button");menu.className="card-menu";menu.textContent="•••";menu.onclick=e=>openGalleryMenu(e,d.id);
    meta.append(copy,menu);card.append(thumb,meta);galleryGrid.appendChild(card);
  });
}
function toggleGallerySelection(id){
  state.selectedGallery.has(id)?state.selectedGallery.delete(id):state.selectedGallery.add(id);renderGallery();
}
function openGalleryMenu(e,id){
  state.selectedGalleryId=id;const r=e.currentTarget.getBoundingClientRect();galleryMenu.style.left=Math.min(window.innerWidth-160,r.left-115)+"px";galleryMenu.style.top=Math.min(window.innerHeight-190,r.bottom+4)+"px";galleryMenu.classList.remove("hidden");
}
async function renderSavedSide(ctx,d,side){
  ctx.fillStyle="#fff";ctx.fillRect(0,0,W,H);
  const kind=d.kind||"fashion";
  const oldVisible=state.croquisVisible;
  state.croquisVisible=d.croquisVisible!==false&&kind!=="blank";
  drawCroquis(ctx,kind==="blank"?"blank":side,typeof d.croquisOpacity==="number"?d.croquisOpacity:.35);
  state.croquisVisible=oldVisible;
  let saved=(d.views&&d.views[side])||[];
  if(!d.views&&d.layers&&((d.croquis||"front")===side))saved=d.layers;
  for(let i=saved.length-1;i>=0;i--){
    const item=saved[i];if(item.visible===false)continue;
    const temp=document.createElement("canvas");temp.width=W;temp.height=H;await drawDataUrl(temp,item.data);
    ctx.globalAlpha=typeof item.opacity==="number"?item.opacity:1;ctx.globalCompositeOperation=item.blend||"source-over";ctx.drawImage(temp,0,0);
  }
  ctx.globalAlpha=1;ctx.globalCompositeOperation="source-over";
}
async function exportStoredDesign(d){
  const c=document.createElement("canvas");c.width=W*2;c.height=H;const x=c.getContext("2d");
  const left=document.createElement("canvas"),right=document.createElement("canvas");left.width=right.width=W;left.height=right.height=H;
  await renderSavedSide(left.getContext("2d"),d,"front");await renderSavedSide(right.getContext("2d"),d,"back");
  x.drawImage(left,0,0);x.drawImage(right,W,0);downloadCanvas(c,d.name||"Artwork");
}
function downloadCanvas(canvas,name){
  const a=document.createElement("a");a.download=(name||"Artwork").replace(/[^a-z0-9-_]+/gi,"-")+".png";a.href=canvas.toDataURL("image/png");a.click();
}
function makeExportCanvas(view,includeMannequin){
  const c=document.createElement("canvas");c.width=W;c.height=H;
  compositeTo(c.getContext("2d"),false,view,false,includeMannequin);
  return c;
}
function exportCurrent(mode="current",includeMannequin=true){
  const name=$("#designNameInput").value||"Artwork";
  if(state.designKind==="blank"){
    const c=makeExportCanvas(state.activeView,false);
    downloadCanvas(c,name);toast("Canvas exported");return;
  }
  const chosen=mode==="current"?state.activeView:mode;
  if(chosen==="both"){
    const c=document.createElement("canvas");c.width=W*2;c.height=H;const x=c.getContext("2d");
    const front=makeExportCanvas("front",includeMannequin),back=makeExportCanvas("back",includeMannequin);
    x.drawImage(front,0,0);x.drawImage(back,W,0);
    downloadCanvas(c,name+"-front-back");toast("Front + Back exported");return;
  }
  const c=makeExportCanvas(chosen,includeMannequin);
  downloadCanvas(c,name+"-"+chosen);toast((chosen==="front"?"Front":"Back")+" exported");
}
function openExportModal(){
  closePanels();
  const blank=state.designKind==="blank";
  $("#fashionExportOptions").classList.toggle("hidden",blank);
  $("#blankExportOptions").classList.toggle("hidden",!blank);
  $("#includeMannequinRow").classList.toggle("hidden",blank);
  $("#exportModal").classList.remove("hidden");
}
function closeExportModal(){$("#exportModal").classList.add("hidden")}
function syncReferenceActions(){
  const has=!!state.referenceImage;
  $("#referenceStatus").textContent=has?"Replace ›":"Add ›";
  $("#removeReferenceAction").classList.toggle("hidden",!has);
}
function syncViewControls(){
  Array.from(document.querySelectorAll(".side-button")).forEach(b=>b.classList.toggle("active",b.dataset.side===state.activeView));
  $("#overlayBtn").classList.toggle("active",state.overlayOther);
  $("#overlayBtn").setAttribute("aria-pressed",state.overlayOther?"true":"false");
}
function switchView(side){
  if(side!== "front" && side!=="back" || side===state.activeView)return;
  state.activeLayerByView[state.activeView]=state.activeLayerId;
  state.activeView=side;
  state.layers=state.views[side];
  state.activeLayerId=state.activeLayerByView[side]||state.layers[0]?.id||null;
  if(state.activeLayerId)state.activeLayerByView[side]=state.activeLayerId;
  syncViewControls();render();renderLayers();resetHistory();scheduleSave();
}

$("#newDesignBtn").onclick=()=>createModal.classList.remove("hidden");
$("#emptyCreateBtn").onclick=()=>createModal.classList.remove("hidden");
$("#cancelCreateBtn").onclick=()=>createModal.classList.add("hidden");
$$("[data-new-kind]").forEach(b=>b.onclick=()=>createDesign(b.dataset.newKind));
$("#backToGalleryBtn").onclick=returnToGallery;
$$(".side-button").forEach(b=>b.onclick=()=>switchView(b.dataset.side));
$("#overlayBtn").onclick=()=>{state.overlayOther=!state.overlayOther;syncViewControls();render()};

$("#selectGalleryBtn").onclick=()=>{
  state.selectMode=!state.selectMode;if(!state.selectMode)state.selectedGallery.clear();
  $("#selectGalleryBtn").textContent=state.selectMode?"Done":"Select";renderGallery();
};

$$("[data-gallery-action]").forEach(b=>b.onclick=async()=>{
  const d=state.designs.find(x=>x.id===state.selectedGalleryId);galleryMenu.classList.add("hidden");if(!d)return;
  const action=b.dataset.galleryAction;
  if(action==="rename"){const n=prompt("Artwork name",d.name||"Untitled Artwork");if(n&&n.trim()){d.name=n.trim();d.updatedAt=Date.now();saveJSON(STORAGE_KEY,state.designs);renderGallery()}}
  if(action==="duplicate"){const copy=JSON.parse(JSON.stringify(d));copy.id=uid();copy.name=(d.name||"Untitled Artwork")+" copy";copy.updatedAt=Date.now();state.designs.unshift(copy);saveJSON(STORAGE_KEY,state.designs);renderGallery()}
  if(action==="delete"){if(confirm("Delete this artwork?")){state.designs=state.designs.filter(x=>x.id!==d.id);saveJSON(STORAGE_KEY,state.designs);renderGallery()}}
  if(action==="export")await exportStoredDesign(d);
});
document.addEventListener("pointerdown",e=>{if(!galleryMenu.classList.contains("hidden")&&!e.target.closest("#galleryMenu")&&!e.target.closest(".card-menu"))galleryMenu.classList.add("hidden")});

$("#brushBtn").onclick=()=>{setTool("brush");togglePanel($("#brushPanel"))};
$("#smudgeBtn").onclick=()=>{setTool("smudge");closePanels()};
$("#eraserBtn").onclick=()=>{setTool("eraser");togglePanel($("#eraserPanel"))};
$(".eraser-mode").forEach(b=>b.onclick=()=>setEraserMode(b.dataset.eraserMode));
$("#layersBtn").onclick=()=>togglePanel($("#layersPanel"));
$("#colourBtn").onclick=()=>togglePanel($("#colourPanel"));
$("#actionsBtn").onclick=()=>togglePanel($("#actionsPanel"));
$("#croquisAction").onclick=()=>{closePanels();$("#croquisPanel").classList.remove("hidden")};
$("#fitCanvasAction").onclick=()=>{closePanels();fitCanvas()};
$("#exportAction").onclick=openExportModal;
$("#cancelExportBtn").onclick=closeExportModal;
Array.from(document.querySelectorAll("[data-export-mode]")).forEach(b=>b.onclick=()=>{const mode=b.dataset.exportMode,include=$("#exportIncludeMannequin").checked;closeExportModal();exportCurrent(mode,include)});
$("#clearLayerAction").onclick=()=>{const l=activeLayer();if(!l)return;if(confirm("Clear active layer?")){l.canvas.getContext("2d").clearRect(0,0,W,H);render();renderLayers();resetHistory();scheduleSave()}};
$("#addLayerBtn").onclick=addLayer;
$("#createBrushBtn").onclick=()=>openBrushStudio();
$("#cancelBrushStudioBtn").onclick=closeBrushStudio;
$("#saveBrushBtn").onclick=saveBrushDraft;
$("#brushNameInput").oninput=e=>{if(state.brushDraft)state.brushDraft.name=e.target.value};
$("#shapeInput").onchange=e=>{const f=e.target.files&&e.target.files[0];if(f)importBrushAsset("shape",f);e.target.value=""};
$("#grainInput").onchange=e=>{const f=e.target.files&&e.target.files[0];if(f)importBrushAsset("grain",f);e.target.value=""};
$("#clearShapeBtn").onclick=()=>{if(state.brushDraft){state.brushDraft.shapeData=null;customAssetCache.clear();customStampCache.clear();renderBrushSourcePreview("shape");renderBrushStudioPreview()}};
$("#clearGrainBtn").onclick=()=>{if(state.brushDraft){state.brushDraft.grainData=null;customAssetCache.clear();customStampCache.clear();renderBrushSourcePreview("grain");renderBrushStudioPreview()}};
[
  ["brushSpacing","spacing",v=>+v],["brushSize","size",v=>+v],["brushOpacity","opacity",v=>+v/100],
  ["brushTaper","taper",v=>+v],["brushSmoothing","smoothing",v=>+v],["brushPressure","pressure",v=>+v]
].forEach(([id,key,convert])=>{
  $("#"+id).oninput=e=>{if(!state.brushDraft)return;state.brushDraft[key]=convert(e.target.value);updateBrushStudioOutputs();customStampCache.clear();renderBrushStudioPreview()};
});
$("#undoBtn").onclick=undo;$("#redoBtn").onclick=redo;

$("#designNameInput").onchange=scheduleSave;
$("#sizeSlider").oninput=e=>{state.size=+e.target.value;updateSliderLabels()};
$("#opacitySlider").oninput=e=>{state.opacity=+e.target.value/100;updateSliderLabels()};
function updateSliderLabels(){
  $("#sizeOutput").textContent=Math.round(state.size/120*100)+"%";$("#opacityOutput").textContent=Math.round(state.opacity*100)+"%";
}
$("#colourPicker").oninput=e=>setColour(e.target.value);
$("#hexInput").onchange=e=>{if(!setColour(e.target.value)){$("#hexInput").value=state.colour;toast("Use a 6-digit hex colour")}};
Array.from(document.querySelectorAll(".colour-tab")).forEach(b=>b.onclick=()=>setColourTab(b.dataset.colourTab));
$("#paletteSelect").onchange=e=>{state.activePalette=+e.target.value;renderPalettes()};
$("#newPaletteBtn").onclick=createPalette;
$("#addColourToPaletteBtn").onclick=addCurrentToPalette;
$("#eyedropperBtn").onclick=()=>{state.eyedropper=!state.eyedropper;refreshColourPickers();if(state.eyedropper)toast("Tap the canvas to pick a colour")};
$("#hueSlider").oninput=e=>{setColourFromHsv(+e.target.value,state.colourSat,state.colourVal,false);drawClassicPicker()};
$("#hueSlider").onchange=commitCurrentColour;

(function bindColourCanvases(){
  const disc=$("#colourDisc"),classic=$("#classicSquare");
  let discDown=false,classicDown=false;
  disc.addEventListener("pointerdown",e=>{discDown=true;disc.setPointerCapture?.(e.pointerId);pickDiscAt(e.clientX,e.clientY,false)});
  disc.addEventListener("pointermove",e=>{if(discDown)pickDiscAt(e.clientX,e.clientY,false)});
  const discEnd=()=>{if(discDown){discDown=false;commitCurrentColour()}};
  disc.addEventListener("pointerup",discEnd);disc.addEventListener("pointercancel",discEnd);
  classic.addEventListener("pointerdown",e=>{classicDown=true;classic.setPointerCapture?.(e.pointerId);pickClassicAt(e.clientX,e.clientY,false)});
  classic.addEventListener("pointermove",e=>{if(classicDown)pickClassicAt(e.clientX,e.clientY,false)});
  const classicEnd=()=>{if(classicDown){classicDown=false;commitCurrentColour()}};
  classic.addEventListener("pointerup",classicEnd);classic.addEventListener("pointercancel",classicEnd);
})();

$$(".croquis-choice").forEach(b=>b.onclick=()=>{state.currentCroquis=b.dataset.croquis;renderCroquisChoices();render();scheduleSave()});
$("#croquisVisibleToggle").onchange=e=>{state.croquisVisible=e.target.checked;render();scheduleSave()};
$("#croquisOpacitySlider").oninput=e=>{state.croquisOpacity=+e.target.value/100;$("#croquisOpacityOutput").textContent=e.target.value+"%";render()};
$("#croquisOpacitySlider").onchange=scheduleSave;

$("#referenceInput").onchange=e=>{
  const file=e.target.files&&e.target.files[0];if(!file)return;
  const reader=new FileReader();
  reader.onload=()=>{
    const img=new Image();
    img.onload=()=>{state.referenceImage=img;syncReferenceActions();closePanels();render();toast("Reference added")};
    img.src=reader.result;
  };
  reader.readAsDataURL(file);e.target.value="";
};
$("#removeReferenceAction").onclick=()=>{state.referenceImage=null;syncReferenceActions();render();toast("Reference removed")};

viewport.addEventListener("wheel",e=>{e.preventDefault();zoomAt(e.deltaY<0?1.08:.92,e.clientX,e.clientY)},{passive:false});
viewport.addEventListener("pointerdown",e=>{
  if(state.eyedropper&&e.target===display){sampleCanvasColour(e);closePanels();return}
  closePanels();

  // Finger touches are navigation only: one finger pans, two fingers pinch-zoom.
  if(e.pointerType==="touch"){
    state.pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(state.pointers.size===1){
      state.touchPan={pointerId:e.pointerId,lastX:e.clientX,lastY:e.clientY};
    }else if(state.pointers.size===2){
      state.touchPan=null;
      const p=Array.from(state.pointers.values()),a=p[0],b=p[1];
      state.gesture={dist:Math.hypot(a.x-b.x,a.y-b.y),scale:state.viewScale,x:state.viewX,y:state.viewY,midX:(a.x+b.x)/2,midY:(a.y+b.y)/2};
    }
    try{viewport.setPointerCapture(e.pointerId)}catch(_){}
    return;
  }

  if(e.target!==display)return;

  // Apple Pencil / stylus draws immediately.
  if(e.pointerType==="pen"){
    state.drawingPointer=e.pointerId;beginStroke(pointFromEvent(e));
    try{viewport.setPointerCapture(e.pointerId)}catch(_){}
    return;
  }

  // Mouse clicks do not drop a dot. Drawing starts only after a small drag.
  if(e.pointerType==="mouse"&&e.button===0){
    if(state.tool==="eraser"&&state.eraserMode==="stroke"){
      state.drawingPointer=e.pointerId;beginStroke(pointFromEvent(e));
      try{viewport.setPointerCapture(e.pointerId)}catch(_){}
      return;
    }
    state.pendingDraw={pointerId:e.pointerId,startEvent:{clientX:e.clientX,clientY:e.clientY,pointerType:e.pointerType,pressure:e.pressure},startX:e.clientX,startY:e.clientY};
    try{viewport.setPointerCapture(e.pointerId)}catch(_){}
  }
});
viewport.addEventListener("pointermove",e=>{
  if(e.pointerType==="touch"&&state.pointers.has(e.pointerId)){
    state.pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});

    if(state.pointers.size>=2&&state.gesture){
      const p=Array.from(state.pointers.values()),a=p[0],b=p[1],dist=Math.hypot(a.x-b.x,a.y-b.y),midX=(a.x+b.x)/2,midY=(a.y+b.y)/2,r=viewport.getBoundingClientRect();
      const startX=state.gesture.midX-r.left,startY=state.gesture.midY-r.top,cx=(startX-state.gesture.x)/state.gesture.scale,cy=(startY-state.gesture.y)/state.gesture.scale;
      state.viewScale=clamp(state.gesture.scale*(dist/state.gesture.dist),.2,5);
      state.viewX=midX-r.left-cx*state.viewScale;state.viewY=midY-r.top-cy*state.viewScale;applyView();
      return;
    }

    if(state.pointers.size===1&&state.touchPan&&state.touchPan.pointerId===e.pointerId){
      state.viewX+=e.clientX-state.touchPan.lastX;
      state.viewY+=e.clientY-state.touchPan.lastY;
      state.touchPan.lastX=e.clientX;state.touchPan.lastY=e.clientY;applyView();
      return;
    }
  }

  if(state.pendingDraw&&state.pendingDraw.pointerId===e.pointerId&&!state.drawing){
    const moved=Math.hypot(e.clientX-state.pendingDraw.startX,e.clientY-state.pendingDraw.startY);
    if(moved>=3&&(e.buttons&1)){
      const start=state.pendingDraw.startEvent;
      state.pendingDraw=null;
      state.drawingPointer=e.pointerId;
      beginStroke(pointFromEvent(start));
      continueStroke(pointFromEvent(e));
    }
    return;
  }

  if(state.drawing&&e.pointerId===state.drawingPointer){
    const samples=typeof e.getCoalescedEvents==="function"?e.getCoalescedEvents():[e];
    for(const sample of samples)continueStroke(pointFromEvent(sample));
  }
});
function pointerEnd(e){
  if(state.pendingDraw&&state.pendingDraw.pointerId===e.pointerId)state.pendingDraw=null;

  if(state.pointers.has(e.pointerId)){
    state.pointers.delete(e.pointerId);
    if(state.pointers.size<2)state.gesture=null;
    if(state.pointers.size===1){
      const [id,p]=state.pointers.entries().next().value;
      state.touchPan={pointerId:id,lastX:p.x,lastY:p.y};
    }else if(state.pointers.size===0){
      state.touchPan=null;
    }
  }

  if(state.drawing&&e.pointerId===state.drawingPointer){endStroke();state.drawingPointer=null}
}
viewport.addEventListener("pointerup",pointerEnd);viewport.addEventListener("pointercancel",pointerEnd);
window.addEventListener("resize",()=>{if(!editorScreen.classList.contains("hidden"))requestAnimationFrame(fitCanvas)});
window.addEventListener("keydown",e=>{
  if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==="z"){e.preventDefault();e.shiftKey?redo():undo()}
});

function init(){
  normaliseCustomBrushes();renderGallery();renderBrushCategories();renderBrushList();normalizePalettes();renderRecentColours();renderPalettes();setColour(state.colour,false);setColourTab("disc");syncReferenceActions();syncEraserModes();updateSliderLabels();syncToolButtons();syncHistoryButtons();
  croquisImages.front.onload=()=>{render();};
  croquisImages.back.onload=()=>{render();};
}
init();
})();