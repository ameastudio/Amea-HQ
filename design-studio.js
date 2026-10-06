(()=>{
"use strict";

const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const W=900,H=1100;
const STORAGE_KEY="design_studio_gallery_v3";
const FAV_KEY="design_studio_brush_favourites_v3";
const RECENT_BRUSH_KEY="design_studio_recent_brushes_v3";
const RECENT_COLOUR_KEY="design_studio_recent_colours_v3";

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
  ["textures","Textures"],
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
  {id:"highlighter",name:"Highlighter",category:"markers",note:"Transparent colour",mode:"marker",size:58,opacity:.22},
  {id:"crochet-loop",name:"Crochet Loop",category:"textures",note:"Looped crochet texture",mode:"crochet",size:26,opacity:1},
  {id:"knit-rib",name:"Knit Rib",category:"textures",note:"Vertical knit ribs",mode:"knit",size:26,opacity:1},
  {id:"fuzzy-yarn",name:"Fuzzy Yarn",category:"textures",note:"Soft yarn fibres",mode:"fuzzy",size:28,opacity:.8},
  {id:"stitch-line",name:"Stitch Line",category:"textures",note:"Even stitch marks",mode:"stitch",size:22,opacity:1},
  {id:"cross-stitch",name:"Cross Stitch",category:"textures",note:"Cross stitch marks",mode:"cross",size:22,opacity:1},
  {id:"embroidered",name:"Embroidered",category:"textures",note:"Dense thread line",mode:"thread",size:25,opacity:.9},
  {id:"fabric-weave",name:"Fabric Weave",category:"textures",note:"Woven fabric texture",mode:"weave",size:28,opacity:.75},
  {id:"denim",name:"Denim Texture",category:"textures",note:"Rough denim grain",mode:"denim",size:30,opacity:.55},
  {id:"boucle",name:"Bouclé",category:"textures",note:"Nubby loop texture",mode:"boucle",size:31,opacity:.72},
  {id:"fur",name:"Fur",category:"textures",note:"Fine tapered strands",mode:"fur",size:34,opacity:.62},
  {id:"sequins",name:"Sequins",category:"textures",note:"Reflective sequin dots",mode:"sequin",size:30,opacity:.9},
  {id:"rhinestones",name:"Rhinestones",category:"textures",note:"Sparkling stone chain",mode:"rhinestone",size:28,opacity:1},
  {id:"glitter",name:"Glitter",category:"textures",note:"Fine scattered sparkle",mode:"glitter",size:26,opacity:.72},
  {id:"chalk",name:"Chalk Texture",category:"textures",note:"Powdery chalk line",mode:"chalk",size:34,opacity:.5},
  {id:"watercolour",name:"Watercolour Texture",category:"textures",note:"Soft wet colour",mode:"watercolour",size:48,opacity:.28},
  {id:"velvet",name:"Velvet",category:"textures",note:"Soft dense fabric",mode:"velvet",size:34,opacity:.55},
  {id:"satin",name:"Satin Shine",category:"textures",note:"Smooth highlight stroke",mode:"satin",size:34,opacity:.7},
  {id:"leather",name:"Leather Grain",category:"textures",note:"Fine leather grain",mode:"leather",size:28,opacity:.58},
  {id:"mesh",name:"Mesh",category:"textures",note:"Open mesh marks",mode:"mesh",size:30,opacity:.85},
  {id:"lace",name:"Lace Detail",category:"textures",note:"Decorative lace loops",mode:"lace",size:32,opacity:.85},
  {id:"bead",name:"Bead Chain",category:"textures",note:"Linked round beads",mode:"bead",size:25,opacity:1}
];

const state={
  designs:loadJSON(STORAGE_KEY,[]),
  currentId:null,
  currentCroquis:"front",
  croquisOpacity:.35,
  referenceImage:null,
  layers:[],
  activeLayerId:null,
  tool:"brush",
  brush:BRUSHES[0],
  brushCategory:"sketching",
  colour:"#111111",
  size:22,
  opacity:1,
  favourites:new Set(loadJSON(FAV_KEY,[])),
  recentBrushes:loadJSON(RECENT_BRUSH_KEY,[]),
  recentColours:loadJSON(RECENT_COLOUR_KEY,["#111111"]),
  drawing:false,
  drawingPointer:null,
  lastPoint:null,
  textureCarry:0,
  viewScale:1,
  viewX:0,
  viewY:0,
  pointers:new Map(),
  gesture:null,
  history:[],
  historyIndex:-1,
  selectedGalleryId:null,
  selectMode:false,
  selectedGallery:new Set()
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

function drawCroquis(ctx,type,opacity,w=W,h=H){
  if(type==="blank")return;
  const sx=w/900,sy=h/1100;
  ctx.save();
  ctx.scale(sx,sy);
  ctx.globalAlpha=opacity;
  ctx.strokeStyle="#8f8f98";
  ctx.lineWidth=1.55;
  ctx.lineCap="round";
  ctx.lineJoin="round";
  const cx=450;
  const back=type==="back";

  ctx.beginPath();
  ctx.ellipse(cx,100,43,59,0,0,Math.PI*2);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(427,154);ctx.lineTo(423,196);
  ctx.moveTo(473,154);ctx.lineTo(477,196);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(423,196);
  ctx.bezierCurveTo(382,202,344,216,326,244);
  ctx.bezierCurveTo(310,290,323,354,349,404);
  ctx.bezierCurveTo(368,443,370,475,356,519);
  ctx.bezierCurveTo(343,559,327,597,317,645);
  ctx.bezierCurveTo(313,687,337,719,365,738);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(477,196);
  ctx.bezierCurveTo(518,202,556,216,574,244);
  ctx.bezierCurveTo(590,290,577,354,551,404);
  ctx.bezierCurveTo(532,443,530,475,544,519);
  ctx.bezierCurveTo(557,559,573,597,583,645);
  ctx.bezierCurveTo(587,687,563,719,535,738);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(326,244);
  ctx.bezierCurveTo(296,330,282,417,286,510);
  ctx.bezierCurveTo(289,589,302,662,308,736);
  ctx.bezierCurveTo(309,765,299,787,289,804);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(574,244);
  ctx.bezierCurveTo(604,330,618,417,614,510);
  ctx.bezierCurveTo(611,589,598,662,592,736);
  ctx.bezierCurveTo(591,765,601,787,611,804);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(365,738);
  ctx.bezierCurveTo(350,785,350,832,363,877);
  ctx.bezierCurveTo(373,920,380,973,381,1030);
  ctx.bezierCurveTo(383,1055,377,1070,365,1081);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(535,738);
  ctx.bezierCurveTo(550,785,550,832,537,877);
  ctx.bezierCurveTo(527,920,520,973,519,1030);
  ctx.bezierCurveTo(517,1055,523,1070,535,1081);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(438,738);
  ctx.bezierCurveTo(425,805,421,870,427,931);
  ctx.bezierCurveTo(432,985,431,1037,429,1078);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(462,738);
  ctx.bezierCurveTo(475,805,479,870,473,931);
  ctx.bezierCurveTo(468,985,469,1037,471,1078);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(365,1081);ctx.quadraticCurveTo(389,1092,429,1078);
  ctx.moveTo(535,1081);ctx.quadraticCurveTo(511,1092,471,1078);
  ctx.stroke();

  if(back){
    ctx.beginPath();
    ctx.moveTo(450,195);ctx.bezierCurveTo(440,255,440,322,450,389);
    ctx.bezierCurveTo(459,430,459,474,450,521);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(401,283);ctx.quadraticCurveTo(450,307,499,283);
    ctx.stroke();
  }else{
    ctx.beginPath();
    ctx.moveTo(389,286);ctx.bezierCurveTo(410,264,432,265,450,287);
    ctx.bezierCurveTo(468,265,490,264,511,286);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(450,296);ctx.bezierCurveTo(444,360,445,426,450,493);
    ctx.stroke();
  }

  ctx.beginPath();
  ctx.moveTo(356,519);ctx.bezierCurveTo(389,540,420,545,450,543);
  ctx.bezierCurveTo(480,545,511,540,544,519);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(317,645);ctx.bezierCurveTo(355,610,396,603,450,617);
  ctx.bezierCurveTo(504,603,545,610,583,645);
  ctx.stroke();

  ctx.restore();
}

function newLayer(name){
  const c=document.createElement("canvas");c.width=W;c.height=H;
  return {id:layerUid(),name:name||"Layer",visible:true,opacity:1,blend:"source-over",canvas:c};
}
function activeLayer(){return state.layers.find(l=>l.id===state.activeLayerId)||state.layers[0]||null}
function setActiveLayer(id){
  if(state.layers.some(l=>l.id===id))state.activeLayerId=id;
  resetHistory();
  renderLayers();
}
function compositeTo(ctx,includeReference=true){
  ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,W,H);ctx.fillStyle="#fff";ctx.fillRect(0,0,W,H);
  drawCroquis(ctx,state.currentCroquis,state.croquisOpacity);
  if(includeReference&&state.referenceImage){
    ctx.globalAlpha=.38;ctx.globalCompositeOperation="source-over";
    const r=fitImage(state.referenceImage,W,H);
    ctx.drawImage(state.referenceImage,r.x,r.y,r.w,r.h);
  }
  for(let i=state.layers.length-1;i>=0;i--){
    const l=state.layers[i];if(!l.visible)continue;
    ctx.globalAlpha=l.opacity;ctx.globalCompositeOperation=l.blend||"source-over";ctx.drawImage(l.canvas,0,0);
  }
  ctx.restore();
}
function render(){compositeTo(dctx,true)}
function fitImage(img,w,h){
  const s=Math.min(w/img.width,h/img.height);
  return {w:img.width*s,h:img.height*s,x:(w-img.width*s)/2,y:(h-img.height*s)/2};
}

function drawBrushPreview(canvas,brush){
  const c=canvas.getContext("2d"),w=canvas.width,h=canvas.height;
  c.clearRect(0,0,w,h);c.save();c.strokeStyle="#202024";c.fillStyle="#202024";c.lineCap="round";c.lineJoin="round";
  const mid=h/2;
  if(isTexture(brush.mode)){
    for(let x=10;x<w-8;x+=13){previewTexture(c,brush.mode,x,mid+Math.sin(x/18)*5,10)}
  }else{
    c.globalAlpha=brush.opacity;c.lineWidth=Math.max(2,brush.size*.22);
    if(brush.mode==="chisel")c.lineCap="butt";
    c.beginPath();c.moveTo(8,mid+8);c.bezierCurveTo(w*.33,mid-16,w*.65,mid+12,w-8,mid-4);c.stroke();
    if(brush.mode==="rough"){
      c.globalAlpha=.28;c.lineWidth=2;c.beginPath();c.moveTo(8,mid+11);c.bezierCurveTo(w*.33,mid-12,w*.65,mid+15,w-8,mid-1);c.stroke();
    }
  }
  c.restore();
}
function previewTexture(c,mode,x,y,s){
  c.save();c.lineWidth=1.4;
  if(mode==="crochet"||mode==="boucle"||mode==="lace"){c.beginPath();c.arc(x,y,s*.45,0,Math.PI*1.7);c.stroke()}
  else if(mode==="knit"){c.beginPath();c.moveTo(x-3,y-6);c.quadraticCurveTo(x+4,y,x-3,y+6);c.stroke()}
  else if(mode==="stitch"){c.beginPath();c.moveTo(x-4,y);c.lineTo(x+4,y);c.stroke()}
  else if(mode==="cross"){c.beginPath();c.moveTo(x-4,y-4);c.lineTo(x+4,y+4);c.moveTo(x+4,y-4);c.lineTo(x-4,y+4);c.stroke()}
  else if(mode==="sequin"||mode==="rhinestone"||mode==="bead"){c.beginPath();c.arc(x,y,s*.34,0,Math.PI*2);c.stroke()}
  else if(mode==="mesh"||mode==="weave"){c.beginPath();c.moveTo(x-4,y-4);c.lineTo(x+4,y+4);c.moveTo(x+4,y-4);c.lineTo(x-4,y+4);c.stroke()}
  else{for(let k=0;k<3;k++){c.beginPath();c.arc(x+(k-1)*3,y+(k%2?2:-2),1.2,0,Math.PI*2);c.fill()}}
  c.restore();
}
function isTexture(mode){return !["pencil","soft","rough","pen","marker","chisel"].includes(mode)}

function renderBrushCategories(){
  const root=$("#brushCategories");root.innerHTML="";
  CATEGORIES.forEach(([id,label])=>{
    const b=document.createElement("button");b.className="brush-category"+(state.brushCategory===id?" active":"");b.textContent=label;
    b.onclick=()=>{state.brushCategory=id;renderBrushCategories();renderBrushList()};
    root.appendChild(b);
  });
}
function brushesForCategory(){
  if(state.brushCategory==="favourites")return BRUSHES.filter(b=>state.favourites.has(b.id));
  if(state.brushCategory==="recent")return state.recentBrushes.map(id=>BRUSHES.find(b=>b.id===id)).filter(Boolean);
  return BRUSHES.filter(b=>b.category===state.brushCategory);
}
function renderBrushList(){
  const root=$("#brushList");root.innerHTML="";
  const list=brushesForCategory();
  if(!list.length){
    const d=document.createElement("div");d.className="brush-empty";d.textContent=state.brushCategory==="favourites"?"No favorites yet":"No recent brushes yet";root.appendChild(d);return;
  }
  list.forEach(brush=>{
    const row=document.createElement("button");row.className="brush-row"+(state.brush.id===brush.id?" active":"");
    const cv=document.createElement("canvas");cv.width=150;cv.height=52;
    const copy=document.createElement("span");copy.innerHTML="<strong>"+escapeHtml(brush.name)+"</strong><small>"+escapeHtml(brush.note)+"</small>";
    const fav=document.createElement("span");fav.className="favourite-btn";fav.textContent=state.favourites.has(brush.id)?"♥":"♡";
    fav.onclick=e=>{e.stopPropagation();toggleFavourite(brush.id)};
    row.onclick=()=>selectBrush(brush);
    row.append(cv,copy,fav);root.appendChild(row);drawBrushPreview(cv,brush);
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
function syncToolButtons(){
  $("#brushBtn").classList.toggle("active",state.tool==="brush");
  $("#smudgeBtn").classList.toggle("active",state.tool==="smudge");
  $("#eraserBtn").classList.toggle("active",state.tool==="eraser");
}
function setTool(tool){
  state.tool=tool;syncToolButtons();
  if(tool==="eraser")$("#sizeSlider").value=clamp(state.size,2,120);
  updateSliderLabels();
}

function renderDefaultPalette(){
  const root=$("#defaultPalette");root.innerHTML="";
  PALETTE.forEach(colour=>root.appendChild(makeSwatch(colour)));
  renderRecentColours();
}
function makeSwatch(colour){
  const b=document.createElement("button");b.className="colour-swatch";b.style.background=colour;b.title=colour;b.onclick=()=>setColour(colour);return b;
}
function renderRecentColours(){
  const root=$("#recentColours");root.innerHTML="";
  state.recentColours.slice(0,12).forEach(c=>root.appendChild(makeSwatch(c)));
}
function setColour(value,record=true){
  let c=String(value||"").trim();
  if(!/^#[0-9a-f]{6}$/i.test(c))return false;
  c=c.toUpperCase();state.colour=c;$("#colourPicker").value=c;$("#hexInput").value=c;$("#colourDot").style.background=c;
  if(record){
    state.recentColours=[c].concat(state.recentColours.filter(x=>x!==c)).slice(0,12);
    saveJSON(RECENT_COLOUR_KEY,state.recentColours);renderRecentColours();
  }
  return true;
}

function renderLayers(){
  const root=$("#layersList");root.innerHTML="";
  state.layers.forEach((layer,index)=>{
    const row=document.createElement("div");row.className="layer-row"+(layer.id===state.activeLayerId?" active":"");row.draggable=true;row.dataset.layerId=layer.id;

    const eye=document.createElement("button");eye.className="layer-eye";eye.textContent=layer.visible?"◉":"○";eye.title=layer.visible?"Hide layer":"Show layer";
    eye.onclick=e=>{e.stopPropagation();layer.visible=!layer.visible;render();renderLayers();scheduleSave()};

    const thumb=document.createElement("img");thumb.className="layer-thumb";thumb.alt="";thumb.src=layerThumbnail(layer);

    const name=document.createElement("button");name.className="layer-name";name.innerHTML=escapeHtml(layer.name)+"<span class=\"layer-sub\">"+Math.round(layer.opacity*100)+"% · "+blendLabel(layer.blend)+"</span>";
    name.onclick=e=>{e.stopPropagation();renameLayer(layer)};

    const more=document.createElement("button");more.className="layer-more";more.textContent="•••";
    more.onclick=e=>{e.stopPropagation();row.classList.toggle("expanded")};

    const menu=document.createElement("div");menu.className="layer-menu hidden";
    if(row.classList.contains("expanded"))menu.classList.remove("hidden");
    const dup=document.createElement("button");dup.textContent="Duplicate";dup.onclick=e=>{e.stopPropagation();duplicateLayer(layer)};
    const up=document.createElement("button");up.textContent="Move Up";up.disabled=index===0;up.onclick=e=>{e.stopPropagation();moveLayer(index,-1)};
    const down=document.createElement("button");down.textContent="Move Down";down.disabled=index===state.layers.length-1;down.onclick=e=>{e.stopPropagation();moveLayer(index,1)};
    const del=document.createElement("button");del.textContent="Delete";del.onclick=e=>{e.stopPropagation();deleteLayer(layer)};
    const rename=document.createElement("button");rename.textContent="Rename";rename.onclick=e=>{e.stopPropagation();renameLayer(layer)};
    const blend=document.createElement("select");
    [["source-over","Normal"],["multiply","Multiply"],["screen","Screen"],["overlay","Overlay"]].forEach(([v,l])=>{const o=document.createElement("option");o.value=v;o.textContent=l;if(layer.blend===v)o.selected=true;blend.appendChild(o)});
    blend.onchange=e=>{layer.blend=e.target.value;render();renderLayers();scheduleSave()};
    menu.append(dup,rename,up,down,del,blend);

    const opacity=document.createElement("label");opacity.className="layer-opacity hidden";
    const opText=document.createElement("span");opText.textContent="Opacity";
    const range=document.createElement("input");range.type="range";range.min="0";range.max="100";range.value=Math.round(layer.opacity*100);
    const out=document.createElement("span");out.textContent=Math.round(layer.opacity*100)+"%";
    range.oninput=e=>{layer.opacity=+e.target.value/100;out.textContent=e.target.value+"%";render()};
    range.onchange=()=>{renderLayers();scheduleSave()};
    opacity.append(opText,range,out);

    more.onclick=e=>{e.stopPropagation();const expanded=menu.classList.toggle("hidden");opacity.classList.toggle("hidden",expanded)};

    row.onclick=()=>setActiveLayer(layer.id);
    row.ondragstart=e=>{e.dataTransfer.setData("text/plain",layer.id);e.dataTransfer.effectAllowed="move"};
    row.ondragover=e=>{e.preventDefault();e.dataTransfer.dropEffect="move"};
    row.ondrop=e=>{e.preventDefault();const fromId=e.dataTransfer.getData("text/plain");reorderLayer(fromId,layer.id)};

    row.append(eye,thumb,name,more,menu,opacity);root.appendChild(row);
  });
}
function blendLabel(v){return {"source-over":"Normal",multiply:"Multiply",screen:"Screen",overlay:"Overlay"}[v]||"Normal"}
function layerThumbnail(layer){
  const c=document.createElement("canvas");c.width=48;c.height=48;const x=c.getContext("2d");x.fillStyle="#fff";x.fillRect(0,0,48,48);x.globalAlpha=layer.opacity;x.drawImage(layer.canvas,0,0,48,48);return c.toDataURL("image/jpeg",.72);
}
function renameLayer(layer){
  const v=prompt("Layer name",layer.name);if(v===null)return;const n=v.trim();if(n)layer.name=n;renderLayers();scheduleSave();
}
function duplicateLayer(layer){
  const copy=newLayer(layer.name+" copy");copy.visible=layer.visible;copy.opacity=layer.opacity;copy.blend=layer.blend;copy.canvas.getContext("2d").drawImage(layer.canvas,0,0);
  const i=state.layers.indexOf(layer);state.layers.splice(i,0,copy);state.activeLayerId=copy.id;render();renderLayers();resetHistory();scheduleSave();
}
function deleteLayer(layer){
  if(state.layers.length<=1){toast("Keep at least one layer");return}
  const i=state.layers.indexOf(layer);state.layers.splice(i,1);
  if(state.activeLayerId===layer.id)state.activeLayerId=state.layers[Math.min(i,state.layers.length-1)].id;
  render();renderLayers();resetHistory();scheduleSave();
}
function moveLayer(index,delta){
  const ni=clamp(index+delta,0,state.layers.length-1);if(ni===index)return;
  const [l]=state.layers.splice(index,1);state.layers.splice(ni,0,l);render();renderLayers();scheduleSave();
}
function reorderLayer(fromId,toId){
  const from=state.layers.findIndex(l=>l.id===fromId),to=state.layers.findIndex(l=>l.id===toId);
  if(from<0||to<0||from===to)return;const [l]=state.layers.splice(from,1);state.layers.splice(to,0,l);render();renderLayers();scheduleSave();
}
function addLayer(){
  const layer=newLayer("Layer "+(state.layers.length+1));state.layers.unshift(layer);state.activeLayerId=layer.id;renderLayers();resetHistory();scheduleSave();
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
  const layer=activeLayer();if(!layer)return;state.drawing=true;state.lastPoint=p;state.textureCarry=0;
  if(isTexture(state.brush.mode))drawTexture(layer.canvas.getContext("2d"),p,p);
  else if(state.tool==="brush")drawLine(layer.canvas.getContext("2d"),p,p);
  render();
}
function continueStroke(p){
  if(!state.drawing)return;const layer=activeLayer();if(!layer)return;const ctx=layer.canvas.getContext("2d");
  if(state.tool==="eraser")eraseLine(ctx,state.lastPoint,p);
  else if(state.tool==="smudge")smudgeLine(layer.canvas,state.lastPoint,p);
  else if(isTexture(state.brush.mode))drawTexture(ctx,state.lastPoint,p);
  else drawLine(ctx,state.lastPoint,p);
  state.lastPoint=p;render();
}
function endStroke(){
  if(!state.drawing)return;state.drawing=false;state.lastPoint=null;pushHistory();renderLayers();scheduleSave();
}
function brushWidth(p){
  const pressure=p&&p.pressure?(.55+p.pressure*.75):1;return state.size*pressure;
}
function drawLine(ctx,a,b){
  const brush=state.brush;ctx.save();ctx.globalCompositeOperation="source-over";ctx.strokeStyle=state.colour;ctx.globalAlpha=state.opacity*brush.opacity;ctx.lineWidth=brushWidth(b);ctx.lineCap=brush.mode==="chisel"?"butt":"round";ctx.lineJoin="round";
  if(brush.mode==="pencil")ctx.globalAlpha*=.78;
  if(brush.mode==="soft")ctx.globalAlpha*=.58;
  if(brush.mode==="rough")ctx.globalAlpha*=.54;
  ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
  if(brush.mode==="rough"){
    ctx.globalAlpha*=.35;ctx.lineWidth=Math.max(1,ctx.lineWidth*.25);ctx.beginPath();ctx.moveTo(a.x+2,a.y-2);ctx.lineTo(b.x+2,b.y-2);ctx.stroke();
  }
  ctx.restore();
}
function eraseLine(ctx,a,b){
  ctx.save();ctx.globalCompositeOperation="destination-out";ctx.globalAlpha=1;ctx.strokeStyle="#000";ctx.lineCap="round";ctx.lineJoin="round";ctx.lineWidth=state.size;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.restore();
}
function smudgeLine(canvas,a,b){
  const ctx=canvas.getContext("2d"),r=Math.max(8,state.size*.7),x=clamp(a.x-r,0,W-r*2),y=clamp(a.y-r,0,H-r*2),size=Math.max(4,Math.round(r*2));
  const temp=document.createElement("canvas");temp.width=size;temp.height=size;const t=temp.getContext("2d");t.drawImage(canvas,x,y,size,size,0,0,size,size);
  ctx.save();ctx.globalAlpha=.22*state.opacity;ctx.filter="blur("+Math.max(1,r*.13)+"px)";ctx.drawImage(temp,b.x-r,b.y-r,size,size);ctx.restore();
}
function drawTexture(ctx,a,b){
  const dist=Math.hypot(b.x-a.x,b.y-a.y),step=Math.max(7,state.size*.55),n=Math.max(1,Math.ceil(dist/step));
  for(let i=0;i<=n;i++){
    const t=n?i/n:0,x=a.x+(b.x-a.x)*t,y=a.y+(b.y-a.y)*t;
    textureMark(ctx,state.brush.mode,x,y,state.size);
  }
}
function textureMark(ctx,mode,x,y,s){
  ctx.save();ctx.strokeStyle=state.colour;ctx.fillStyle=state.colour;ctx.globalAlpha=state.opacity*state.brush.opacity;ctx.lineWidth=Math.max(1,s*.08);ctx.lineCap="round";
  if(mode==="crochet"||mode==="boucle"){ctx.beginPath();ctx.arc(x,y,s*.28,.2,Math.PI*1.8);ctx.stroke()}
  else if(mode==="knit"){ctx.beginPath();ctx.moveTo(x-s*.16,y-s*.3);ctx.quadraticCurveTo(x+s*.25,y,x-s*.16,y+s*.3);ctx.stroke()}
  else if(mode==="fuzzy"||mode==="fur"){for(let k=0;k<5;k++){const a=Math.random()*Math.PI*2,r=s*(.12+Math.random()*.25);ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+Math.cos(a)*r,y+Math.sin(a)*r);ctx.stroke()}}
  else if(mode==="stitch"){ctx.beginPath();ctx.moveTo(x-s*.25,y);ctx.lineTo(x+s*.25,y);ctx.stroke()}
  else if(mode==="cross"){ctx.beginPath();ctx.moveTo(x-s*.2,y-s*.2);ctx.lineTo(x+s*.2,y+s*.2);ctx.moveTo(x+s*.2,y-s*.2);ctx.lineTo(x-s*.2,y+s*.2);ctx.stroke()}
  else if(mode==="thread"){for(let k=-2;k<=2;k++){ctx.beginPath();ctx.moveTo(x-s*.3,y+k*2);ctx.lineTo(x+s*.3,y+k*2);ctx.stroke()}}
  else if(mode==="weave"||mode==="mesh"){ctx.beginPath();ctx.moveTo(x-s*.22,y-s*.22);ctx.lineTo(x+s*.22,y+s*.22);ctx.moveTo(x+s*.22,y-s*.22);ctx.lineTo(x-s*.22,y+s*.22);ctx.stroke()}
  else if(mode==="denim"||mode==="leather"||mode==="chalk"||mode==="velvet"){for(let k=0;k<5;k++){const ox=(Math.random()-.5)*s*.5,oy=(Math.random()-.5)*s*.5;ctx.beginPath();ctx.arc(x+ox,y+oy,Math.max(1,s*.035),0,Math.PI*2);ctx.fill()}}
  else if(mode==="sequin"||mode==="rhinestone"||mode==="bead"){ctx.beginPath();ctx.arc(x,y,s*.22,0,Math.PI*2);mode==="sequin"?ctx.stroke():ctx.fill();if(mode==="rhinestone"){ctx.fillStyle="#fff";ctx.globalAlpha=.65;ctx.beginPath();ctx.arc(x-s*.06,y-s*.06,s*.05,0,Math.PI*2);ctx.fill()}}
  else if(mode==="glitter"){for(let k=0;k<6;k++){const ox=(Math.random()-.5)*s*.6,oy=(Math.random()-.5)*s*.6;ctx.beginPath();ctx.arc(x+ox,y+oy,Math.max(1,s*.025+Math.random()*s*.025),0,Math.PI*2);ctx.fill()}}
  else if(mode==="watercolour"){ctx.globalAlpha*=.16;ctx.beginPath();ctx.arc(x,y,s*.5,0,Math.PI*2);ctx.fill()}
  else if(mode==="satin"){ctx.globalAlpha*=.5;ctx.lineWidth=s*.3;ctx.beginPath();ctx.moveTo(x-s*.25,y);ctx.lineTo(x+s*.25,y);ctx.stroke()}
  else if(mode==="lace"){ctx.beginPath();ctx.arc(x-s*.14,y,s*.2,Math.PI,0);ctx.arc(x+s*.14,y,s*.2,Math.PI,0);ctx.stroke()}
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

function serializeLayers(){return state.layers.map(l=>({id:l.id,name:l.name,visible:l.visible,opacity:l.opacity,blend:l.blend,data:l.canvas.toDataURL("image/png")}))}
function thumbnailData(){
  const c=document.createElement("canvas");c.width=200;c.height=250;const x=c.getContext("2d");const full=document.createElement("canvas");full.width=W;full.height=H;compositeTo(full.getContext("2d"),false);x.drawImage(full,0,0,200,250);return c.toDataURL("image/jpeg",.72);
}
function currentDesign(){
  return state.designs.find(d=>d.id===state.currentId)||null;
}
function saveCurrentDesign(){
  const d=currentDesign();if(!d)return;
  d.name=$("#designNameInput").value.trim()||"Untitled Artwork";d.croquis=state.currentCroquis;d.croquisOpacity=state.croquisOpacity;d.updatedAt=Date.now();d.layers=serializeLayers();d.thumbnail=thumbnailData();
  saveJSON(STORAGE_KEY,state.designs);
}
function scheduleSave(){clearTimeout(scheduleSave.t);scheduleSave.t=setTimeout(saveCurrentDesign,220)}
async function drawDataUrl(canvas,data){
  const ctx=canvas.getContext("2d");ctx.clearRect(0,0,W,H);if(!data)return;
  await new Promise(resolve=>{const img=new Image();img.onload=()=>{ctx.drawImage(img,0,0,W,H);resolve()};img.onerror=resolve;img.src=data});
}
async function loadDesign(design){
  state.currentId=design.id;state.currentCroquis=design.croquis||"front";state.croquisOpacity=typeof design.croquisOpacity==="number"?design.croquisOpacity:.35;state.referenceImage=null;
  state.layers=[];
  for(const saved of design.layers||[]){
    const l=newLayer(saved.name||"Layer");l.id=saved.id||layerUid();l.visible=saved.visible!==false;l.opacity=typeof saved.opacity==="number"?saved.opacity:1;l.blend=saved.blend||"source-over";await drawDataUrl(l.canvas,saved.data);state.layers.push(l);
  }
  if(!state.layers.length)state.layers=[newLayer("Layer 1")];
  state.activeLayerId=state.layers[0].id;$("#designNameInput").value=design.name||"Untitled Artwork";$("#croquisOpacitySlider").value=Math.round(state.croquisOpacity*100);$("#croquisOpacityOutput").textContent=Math.round(state.croquisOpacity*100)+"%";
  galleryScreen.classList.add("hidden");editorScreen.classList.remove("hidden");render();renderLayers();renderCroquisChoices();resetHistory();requestAnimationFrame(fitCanvas);
}
function createDesign(croquis){
  const now=Date.now(),d={id:uid(),name:"Untitled Artwork",croquis:croquis,croquisOpacity:.35,updatedAt:now,layers:[],thumbnail:""};
  state.designs.unshift(d);saveJSON(STORAGE_KEY,state.designs);createModal.classList.add("hidden");
  loadDesign(d).then(()=>{saveCurrentDesign()});
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
async function exportStoredDesign(d){
  const c=document.createElement("canvas");c.width=W;c.height=H;const x=c.getContext("2d");x.fillStyle="#fff";x.fillRect(0,0,W,H);drawCroquis(x,d.croquis||"front",typeof d.croquisOpacity==="number"?d.croquisOpacity:.35);
  const layers=[];
  for(const saved of d.layers||[]){const l=newLayer(saved.name||"Layer");l.visible=saved.visible!==false;l.opacity=typeof saved.opacity==="number"?saved.opacity:1;l.blend=saved.blend||"source-over";await drawDataUrl(l.canvas,saved.data);layers.push(l)}
  for(let i=layers.length-1;i>=0;i--){const l=layers[i];if(!l.visible)continue;x.globalAlpha=l.opacity;x.globalCompositeOperation=l.blend;x.drawImage(l.canvas,0,0)}
  downloadCanvas(c,d.name||"Artwork");
}
function downloadCanvas(canvas,name){
  const a=document.createElement("a");a.download=(name||"Artwork").replace(/[^a-z0-9-_]+/gi,"-")+".png";a.href=canvas.toDataURL("image/png");a.click();
}
function exportCurrent(){
  const c=document.createElement("canvas");c.width=W;c.height=H;compositeTo(c.getContext("2d"),false);downloadCanvas(c,$("#designNameInput").value);toast("Exported");
}

function renderCroquisChoices(){
  $$(".croquis-choice").forEach(b=>b.classList.toggle("active",b.dataset.croquis===state.currentCroquis));
}
function renderNewPreviews(){
  $$("[data-preview]").forEach(c=>{const x=c.getContext("2d");x.clearRect(0,0,c.width,c.height);x.fillStyle="#fff";x.fillRect(0,0,c.width,c.height);drawCroquis(x,c.dataset.preview,.5,c.width,c.height)});
}

$("#newDesignBtn").onclick=()=>createModal.classList.remove("hidden");
$("#emptyCreateBtn").onclick=()=>createModal.classList.remove("hidden");
$("#cancelCreateBtn").onclick=()=>createModal.classList.add("hidden");
$$("[data-new-croquis]").forEach(b=>b.onclick=()=>createDesign(b.dataset.newCroquis));
$("#backToGalleryBtn").onclick=returnToGallery;

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
$("#eraserBtn").onclick=()=>{setTool("eraser");closePanels()};
$("#layersBtn").onclick=()=>togglePanel($("#layersPanel"));
$("#colourBtn").onclick=()=>togglePanel($("#colourPanel"));
$("#actionsBtn").onclick=()=>togglePanel($("#actionsPanel"));
$("#croquisAction").onclick=()=>{closePanels();$("#croquisPanel").classList.remove("hidden")};
$("#fitCanvasAction").onclick=()=>{closePanels();fitCanvas()};
$("#exportAction").onclick=()=>{closePanels();exportCurrent()};
$("#clearLayerAction").onclick=()=>{const l=activeLayer();if(!l)return;if(confirm("Clear active layer?")){l.canvas.getContext("2d").clearRect(0,0,W,H);render();renderLayers();resetHistory();scheduleSave()}};
$("#addLayerBtn").onclick=addLayer;
$("#undoBtn").onclick=undo;$("#redoBtn").onclick=redo;

$("#designNameInput").onchange=scheduleSave;
$("#sizeSlider").oninput=e=>{state.size=+e.target.value;updateSliderLabels()};
$("#opacitySlider").oninput=e=>{state.opacity=+e.target.value/100;updateSliderLabels()};
function updateSliderLabels(){
  $("#sizeOutput").textContent=Math.round(state.size/120*100)+"%";$("#opacityOutput").textContent=Math.round(state.opacity*100)+"%";
}
$("#colourPicker").oninput=e=>setColour(e.target.value);
$("#hexInput").onchange=e=>{if(!setColour(e.target.value)){$("#hexInput").value=state.colour;toast("Use a 6-digit hex colour")}};

$$(".croquis-choice").forEach(b=>b.onclick=()=>{state.currentCroquis=b.dataset.croquis;renderCroquisChoices();render();scheduleSave()});
$("#croquisOpacitySlider").oninput=e=>{state.croquisOpacity=+e.target.value/100;$("#croquisOpacityOutput").textContent=e.target.value+"%";render()};
$("#croquisOpacitySlider").onchange=scheduleSave;

$("#referenceInput").onchange=e=>{
  const file=e.target.files&&e.target.files[0];if(!file)return;
  const reader=new FileReader();reader.onload=()=>{const img=new Image();img.onload=()=>{state.referenceImage=img;closePanels();render();toast("Reference added")};img.src=reader.result};reader.readAsDataURL(file);
};

viewport.addEventListener("wheel",e=>{e.preventDefault();zoomAt(e.deltaY<0?1.08:.92,e.clientX,e.clientY)},{passive:false});
viewport.addEventListener("pointerdown",e=>{
  closePanels();
  if(e.pointerType==="touch"){
    state.pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(state.pointers.size===2){
      state.drawing=false;const p=Array.from(state.pointers.values()),a=p[0],b=p[1];
      state.gesture={dist:Math.hypot(a.x-b.x,a.y-b.y),scale:state.viewScale,x:state.viewX,y:state.viewY,midX:(a.x+b.x)/2,midY:(a.y+b.y)/2};return;
    }
  }
  if(e.target===display){
    state.drawingPointer=e.pointerId;beginStroke(pointFromEvent(e));try{viewport.setPointerCapture(e.pointerId)}catch(_){}
  }
});
viewport.addEventListener("pointermove",e=>{
  if(e.pointerType==="touch"&&state.pointers.has(e.pointerId)){
    state.pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(state.pointers.size>=2&&state.gesture){
      const p=Array.from(state.pointers.values()),a=p[0],b=p[1],dist=Math.hypot(a.x-b.x,a.y-b.y),midX=(a.x+b.x)/2,midY=(a.y+b.y)/2,r=viewport.getBoundingClientRect();
      const startX=state.gesture.midX-r.left,startY=state.gesture.midY-r.top,cx=(startX-state.gesture.x)/state.gesture.scale,cy=(startY-state.gesture.y)/state.gesture.scale;
      state.viewScale=clamp(state.gesture.scale*(dist/state.gesture.dist),.2,5);state.viewX=midX-r.left-cx*state.viewScale;state.viewY=midY-r.top-cy*state.viewScale;applyView();return;
    }
  }
  if(state.drawing&&e.pointerId===state.drawingPointer)continueStroke(pointFromEvent(e));
});
function pointerEnd(e){
  if(state.pointers.has(e.pointerId))state.pointers.delete(e.pointerId);
  if(state.pointers.size<2)state.gesture=null;
  if(state.drawing&&e.pointerId===state.drawingPointer){endStroke();state.drawingPointer=null}
}
viewport.addEventListener("pointerup",pointerEnd);viewport.addEventListener("pointercancel",pointerEnd);
window.addEventListener("resize",()=>{if(!editorScreen.classList.contains("hidden"))requestAnimationFrame(fitCanvas)});
window.addEventListener("keydown",e=>{
  if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==="z"){e.preventDefault();e.shiftKey?redo():undo()}
});

function init(){
  renderGallery();renderNewPreviews();renderBrushCategories();renderBrushList();renderDefaultPalette();setColour(state.colour,false);updateSliderLabels();syncToolButtons();syncHistoryButtons();
}
init();
})();