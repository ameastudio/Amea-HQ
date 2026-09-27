(() => {
  "use strict";

  const W = 1800, H = 2200;
  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => [...root.querySelectorAll(sel)];

  const artboard = $("#artboard");
  const ctx = artboard.getContext("2d", { willReadFrequently: true });
  const shell = $("#studioShell");
  const toast = $("#toast");


  const BRUSH_PRESETS = {
    pencil: [
      {name:"Studio Pencil",note:"Clean everyday sketch",size:12,opacity:1,smoothing:.25,pressure:true,shape:"round",multiplier:1,sample:3},
      {name:"Technical Pencil",note:"Fine crisp linework",size:7,opacity:1,smoothing:.12,pressure:true,shape:"round",multiplier:.8,sample:2},
      {name:"6B Pencil",note:"Soft dark fashion sketch",size:24,opacity:.82,smoothing:.32,pressure:true,shape:"round",multiplier:1.15,sample:6},
      {name:"Soft Sketch",note:"Loose planning lines",size:20,opacity:.42,smoothing:.48,pressure:true,shape:"round",multiplier:1.2,sample:5}
    ],
    marker: [
      {name:"Studio Marker",note:"Smooth solid colour",size:26,opacity:.86,smoothing:.34,pressure:true,shape:"round",multiplier:1.55,sample:8},
      {name:"Brush Marker",note:"Pressure-sensitive strokes",size:34,opacity:.92,smoothing:.46,pressure:true,shape:"round",multiplier:1.7,sample:10},
      {name:"Chisel Marker",note:"Bold blocky edges",size:30,opacity:.88,smoothing:.2,pressure:false,shape:"square",multiplier:1.8,sample:9},
      {name:"Highlighter",note:"Transparent colour wash",size:52,opacity:.24,smoothing:.55,pressure:false,shape:"round",multiplier:2,sample:13}
    ]
  };

  const BODY_TYPES = {
    standard:{height:1,shoulders:1,waist:1,hips:1,legs:1,head:1},
    petite:{height:.93,shoulders:.95,waist:.95,hips:.97,legs:.9,head:1.03},
    curvy:{height:1,shoulders:.97,waist:.83,hips:1.14,legs:1,head:1},
    plus:{height:1.02,shoulders:1.08,waist:1.12,hips:1.18,legs:1.02,head:1.02}
  };

  const state = {
    tool: "pencil",
    colour: "#e24892",
    brushSize: 12,
    opacity: 1,
    drawing: false,
    last: null,
    selection: null,
    selectionStart: null,
    template: "front",
    referenceImage: null,
    referenceOpacity: .40,
    motif: null,
    motifScale: 1,
    motifSpacing: 90,
    motifRotation: 0,
    layers: [],
    activeLayerId: null,
    history: [],
    historyIndex: -1,
    lastStamp: null,
    recentColours: [],
    brushPreset:"Studio Pencil",
    smoothing:.25,
    pressureEnabled:true,
    brushShape:"round",
    brushMultiplier:1,
    mannequinStyle:"fashion",
    mannequinOpacity:1,
    showFaceGuide:true,
    showCenterGuide:true,
    bodyType:"standard"
  };

  function newCanvas() {
    const c = document.createElement("canvas");
    c.width = W; c.height = H;
    return c;
  }

  function addLayer(name="Sketch") {
    const layer = {
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()),
      name,
      visible: true,
      canvas: newCanvas()
    };
    state.layers.unshift(layer);
    state.activeLayerId = layer.id;
    renderLayerList();
    render();
    snapshot();
    return layer;
  }

  function activeLayer() {
    return state.layers.find(l => l.id === state.activeLayerId) || state.layers[0];
  }

  function openBrushLibrary(kind=state.tool) {
    if (!BRUSH_PRESETS[kind]) return;
    const box=$("#brushLibrary"), root=$("#brushPresets");
    $("#brushLibraryTitle").textContent=kind==="marker"?"Marker Brushes":"Pencil Brushes";
    root.innerHTML="";
    BRUSH_PRESETS[kind].forEach(p=>{
      const b=document.createElement("button");
      b.className="brush-preset"+(state.brushPreset===p.name?" active":"");
      b.innerHTML=`<span class="brush-sample"><i style="height:${p.sample}px"></i></span><span><strong>${p.name}</strong><small>${p.note}</small></span>`;
      b.addEventListener("click",()=>applyBrushPreset(kind,p));
      root.appendChild(b);
    });
    box.classList.add("open");
  }

  function applyBrushPreset(kind,p) {
    state.tool=kind;
    state.brushPreset=p.name;
    state.brushSize=p.size;
    state.opacity=p.opacity;
    state.smoothing=p.smoothing;
    state.pressureEnabled=p.pressure;
    state.brushShape=p.shape;
    state.brushMultiplier=p.multiplier;
    $("#brushSize").value=p.size;
    $("#brushSizeValue").textContent=p.size;
    $("#brushOpacity").value=Math.round(p.opacity*100);
    $("#brushOpacityValue").textContent=Math.round(p.opacity*100)+"%";
    $("#brushSmoothing").value=Math.round(p.smoothing*100);
    $("#brushSmoothingValue").textContent=Math.round(p.smoothing*100)+"%";
    $("#pressureToggle").checked=p.pressure;
    $$(".tool-btn").forEach(btn=>btn.classList.toggle("active",btn.dataset.tool===kind));
    openBrushLibrary(kind);
    showToast(p.name);
  }

  function setTool(tool) {
    state.tool = tool;
    $$(".tool-btn").forEach(btn => btn.classList.toggle("active", btn.dataset.tool === tool));
    artboard.style.cursor = tool === "eyedropper" ? "crosshair" : tool === "select" ? "crosshair" : "default";
    if (tool === "pencil" || tool === "marker") openBrushLibrary(tool);
    else $("#brushLibrary")?.classList.remove("open");
    if (tool === "stamp" || tool === "scatter" || tool === "fillpattern") {
      if (!state.motif) showToast("Create a motif first ✿");
    }
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.remove("show"), 1800);
  }

  function pointFromEvent(e) {
    const rect = artboard.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (W / rect.width),
      y: (e.clientY - rect.top) * (H / rect.height),
      pressure: e.pointerType === "pen" && e.pressure > 0 ? e.pressure : 0.5
    };
  }

  function currentBody(){ return BODY_TYPES[state.bodyType] || BODY_TYPES.standard; }

  function drawFashionMannequin(target, view) {
    if (view === "blank") return;
    const b=currentBody(), cx=W/2, y=65;
    const t=target;
    t.save(); t.globalAlpha=state.mannequinOpacity; t.strokeStyle="#ccb9c3"; t.fillStyle="#fbf6f8"; t.lineWidth=6; t.lineCap="round"; t.lineJoin="round";
    if(state.showFaceGuide){ t.beginPath(); t.ellipse(cx,190+y,(view==="side"?70:100)*b.head,130*b.head,0,0,Math.PI*2); t.fill(); t.stroke(); }
    const shoulderY=400+y, waistY=770+y, hipY=1010+y, kneeY=1470+y, ankleY=1975;
    const shoulder=190*b.shoulders, waist=92*b.waist, hip=150*b.hips;
    if(view==="side"){
      t.beginPath();
      t.moveTo(cx-10,295+y); t.lineTo(cx-18,shoulderY);
      t.bezierCurveTo(cx+95,450+y,cx+105,630+y,cx+48,waistY);
      t.bezierCurveTo(cx+85,860+y,cx+95,925+y,cx+80,hipY);
      t.bezierCurveTo(cx+42,1190+y,cx+55,1320+y,cx+24,kneeY); t.lineTo(cx+14,ankleY);
      t.moveTo(cx-10,295+y); t.bezierCurveTo(cx-60,430+y,cx-70,625+y,cx-32,waistY);
      t.bezierCurveTo(cx-12,1010+y,cx-28,1220+y,cx-26,kneeY); t.lineTo(cx-4,ankleY); t.stroke();
      t.beginPath(); t.moveTo(cx+28,470+y); t.bezierCurveTo(cx+162,715+y,cx+135,1040+y,cx+88,1260+y); t.stroke();
    } else if(view==="threequarter"){
      t.beginPath();
      t.moveTo(cx-45,300+y); t.lineTo(cx-55,shoulderY); t.bezierCurveTo(cx-210,445+y,cx-190,690+y,cx-120,waistY);
      t.bezierCurveTo(cx-90,860+y,cx-118,950+y,cx-98,hipY); t.bezierCurveTo(cx-72,1270+y,cx-62,1405+y,cx-50,kneeY); t.lineTo(cx-38,ankleY);
      t.moveTo(cx+60,300+y); t.lineTo(cx+68,shoulderY); t.bezierCurveTo(cx+155,460+y,cx+165,680+y,cx+108,waistY);
      t.bezierCurveTo(cx+115,870+y,cx+130,945+y,cx+118,hipY); t.bezierCurveTo(cx+95,1270+y,cx+78,1410+y,cx+64,kneeY); t.lineTo(cx+46,ankleY); t.stroke();
      t.beginPath(); t.moveTo(cx-55,420+y); t.bezierCurveTo(cx-250,470+y,cx-280,610+y,cx-310,740+y); t.bezierCurveTo(cx-348,930+y,cx-330,1120+y,cx-292,1300+y);
      t.moveTo(cx+55,425+y); t.bezierCurveTo(cx+185,475+y,cx+215,620+y,cx+250,800+y); t.bezierCurveTo(cx+282,960+y,cx+275,1110+y,cx+245,1260+y); t.stroke();
    } else {
      t.beginPath();
      t.moveTo(cx-45,300+y); t.lineTo(cx-52,shoulderY); t.bezierCurveTo(cx-shoulder,445+y,cx-185,680+y,cx-waist,waistY);
      t.bezierCurveTo(cx-92,840+y,cx-88,930+y,cx-hip,hipY); t.bezierCurveTo(cx-145,1270+y,cx-105,1420+y,cx-78,kneeY); t.lineTo(cx-48,ankleY);
      t.moveTo(cx+45,300+y); t.lineTo(cx+52,shoulderY); t.bezierCurveTo(cx+shoulder,445+y,cx+185,680+y,cx+waist,waistY);
      t.bezierCurveTo(cx+92,840+y,cx+88,930+y,cx+hip,hipY); t.bezierCurveTo(cx+145,1270+y,cx+105,1420+y,cx+78,kneeY); t.lineTo(cx+48,ankleY); t.stroke();
      t.beginPath(); t.moveTo(cx-50,420+y); t.bezierCurveTo(cx-245,430+y,cx-305,520+y,cx-358,690+y); t.bezierCurveTo(cx-428,900+y,cx-420,1120+y,cx-380,1330+y);
      t.moveTo(cx+50,420+y); t.bezierCurveTo(cx+245,430+y,cx+305,520+y,cx+358,690+y); t.bezierCurveTo(cx+428,900+y,cx+420,1120+y,cx+380,1330+y); t.stroke();
      t.beginPath(); t.moveTo(cx-6,1100+y); t.lineTo(cx-10,ankleY); t.moveTo(cx+6,1100+y); t.lineTo(cx+10,ankleY); t.stroke();
    }
    if(state.showCenterGuide && view!=="side"){ t.strokeStyle="#eadfe4"; t.lineWidth=3; t.setLineDash([18,20]); t.beginPath(); t.moveTo(cx,340+y); t.lineTo(cx,2025); t.stroke(); t.setLineDash([]); }
    t.restore();
  }

  function drawRealisticMannequin(target, view) {
    if (view === "blank") return;
    const b=currentBody(), cx=W/2, y=75;
    const t=target;
    t.save(); t.globalAlpha=state.mannequinOpacity; t.strokeStyle="#c7b4bd"; t.fillStyle="#f8f2f4"; t.lineWidth=5; t.lineCap="round"; t.lineJoin="round";
    if(state.showFaceGuide){ t.beginPath(); t.ellipse(cx,205+y,(view==="side"?72:104)*b.head,135*b.head,0,0,Math.PI*2); t.fill(); t.stroke(); }
    const sW=205*b.shoulders, wW=100*b.waist, hW=164*b.hips;
    if(view==="side"){
      t.beginPath(); t.moveTo(cx-5,338+y); t.quadraticCurveTo(cx+12,410+y,cx+2,480+y);
      t.bezierCurveTo(cx+110,520+y,cx+120,705+y,cx+50,860+y); t.bezierCurveTo(cx+95,950+y,cx+102,1030+y,cx+82,1130+y); t.bezierCurveTo(cx+50,1300+y,cx+40,1500+y,cx+28,1940); t.lineTo(cx+7,2050);
      t.moveTo(cx-5,338+y); t.bezierCurveTo(cx-85,470+y,cx-96,700+y,cx-35,860+y); t.bezierCurveTo(cx-4,960+y,cx-18,1070+y,cx-24,1195+y); t.bezierCurveTo(cx-28,1430+y,cx-18,1690+y,cx-8,2050); t.stroke();
      t.beginPath(); t.moveTo(cx+45,500+y); t.bezierCurveTo(cx+155,780+y,cx+140,1060+y,cx+98,1270+y); t.stroke();
    } else if(view==="threequarter"){
      t.beginPath(); t.moveTo(cx-62,338+y); t.bezierCurveTo(cx-150,390+y,cx-172,620+y,cx-112,845+y); t.bezierCurveTo(cx-88,945+y,cx-100,1032+y,cx-110,1140+y); t.bezierCurveTo(cx-138,1400+y,cx-92,1700+y,cx-62,2050);
      t.moveTo(cx+72,338+y); t.bezierCurveTo(cx+152,395+y,cx+170,635+y,cx+118,860+y); t.bezierCurveTo(cx+132,960+y,cx+142,1038+y,cx+128,1135+y); t.bezierCurveTo(cx+115,1398+y,cx+84,1700+y,cx+52,2050); t.stroke();
      t.beginPath(); t.moveTo(cx-64,445+y); t.bezierCurveTo(cx-240,470+y,cx-300,620+y,cx-320,795+y); t.bezierCurveTo(cx-335,945+y,cx-315,1090+y,cx-286,1265+y);
      t.moveTo(cx+58,460+y); t.bezierCurveTo(cx+180,495+y,cx+222,640+y,cx+248,812+y); t.bezierCurveTo(cx+266,950+y,cx+258,1080+y,cx+232,1230+y); t.stroke();
    } else {
      t.beginPath(); t.moveTo(cx-70,338+y); t.bezierCurveTo(cx-sW,390+y,cx-190,625+y,cx-wW,840+y); t.bezierCurveTo(cx-88,930+y,cx-92,1040+y,cx-hW,1120+y); t.bezierCurveTo(cx-152,1330+y,cx-122,1605+y,cx-78,2050);
      t.moveTo(cx+70,338+y); t.bezierCurveTo(cx+sW,390+y,cx+190,625+y,cx+wW,840+y); t.bezierCurveTo(cx+88,930+y,cx+92,1040+y,cx+hW,1120+y); t.bezierCurveTo(cx+152,1330+y,cx+122,1605+y,cx+78,2050); t.stroke();
      t.beginPath(); t.moveTo(cx-70,445+y); t.bezierCurveTo(cx-245,465+y,cx-310,555+y,cx-362,730+y); t.bezierCurveTo(cx-408,890+y,cx-410,1060+y,cx-382,1268+y);
      t.moveTo(cx+70,445+y); t.bezierCurveTo(cx+245,465+y,cx+310,555+y,cx+362,730+y); t.bezierCurveTo(cx+408,890+y,cx+410,1060+y,cx+382,1268+y); t.stroke();
      t.beginPath(); t.moveTo(cx-18,1140+y); t.bezierCurveTo(cx-35,1450+y,cx-25,1760+y,cx-16,2050); t.moveTo(cx+18,1140+y); t.bezierCurveTo(cx+35,1450+y,cx+25,1760+y,cx+16,2050); t.stroke();
    }
    if(state.showCenterGuide && view!=="side"){ t.strokeStyle="#eadfe4"; t.lineWidth=3; t.setLineDash([18,20]); t.beginPath(); t.moveTo(cx,340+y); t.lineTo(cx,2050); t.stroke(); t.setLineDash([]); }
    t.restore();
  }

  function drawMannequin(target, view) {
    if (state.mannequinStyle === "realistic") drawRealisticMannequin(target, view);
    else drawFashionMannequin(target, view);
  }

  function render() {
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0,0,W,H);

    if (state.referenceImage) {
      ctx.save();
      ctx.globalAlpha = state.referenceOpacity;
      const img = state.referenceImage;
      const scale = Math.min((W*.82)/img.width, (H*.82)/img.height);
      const iw = img.width * scale, ih = img.height * scale;
      ctx.drawImage(img, (W-iw)/2, (H-ih)/2, iw, ih);
      ctx.restore();
    }

    drawMannequin(ctx, state.template);

    [...state.layers].reverse().forEach(layer => {
      if (layer.visible) ctx.drawImage(layer.canvas, 0, 0);
    });

    if (state.selection) drawSelection(ctx, state.selection);
  }

  function drawSelection(target, s) {
    target.save();
    target.strokeStyle = "#e24892";
    target.lineWidth = 5;
    target.setLineDash([18,14]);
    target.strokeRect(s.x, s.y, s.w, s.h);
    target.setLineDash([]);
    target.fillStyle = "#e24892";
    [[s.x,s.y],[s.x+s.w,s.y],[s.x,s.y+s.h],[s.x+s.w,s.y+s.h]].forEach(([x,y])=>{
      target.beginPath(); target.arc(x,y,9,0,Math.PI*2); target.fill();
    });
    target.restore();
  }

  function strokeTo(p) {
    const layer = activeLayer();
    if (!layer) return;
    const lctx = layer.canvas.getContext("2d");
    const prev = state.last || p;
    lctx.save();
    lctx.lineCap = state.brushShape === "square" ? "square" : "round";
    lctx.lineJoin = state.brushShape === "square" ? "bevel" : "round";
    lctx.globalAlpha = state.opacity;
    const smoothAmount = Math.min(.82, Math.max(0,state.smoothing) * .82);
    const target = {x:prev.x+(p.x-prev.x)*(1-smoothAmount),y:prev.y+(p.y-prev.y)*(1-smoothAmount),pressure:p.pressure};
    if (state.tool === "eraser") {
      lctx.globalCompositeOperation = "destination-out";
      lctx.strokeStyle = "rgba(0,0,0,1)";
      lctx.lineWidth = state.brushSize * 2.2;
    } else {
      lctx.globalCompositeOperation = "source-over";
      lctx.strokeStyle = state.colour;
      const pressureBoost = state.pressureEnabled && p.pressure ? (.58 + p.pressure*.9) : 1;
      lctx.lineWidth = state.brushSize * state.brushMultiplier * pressureBoost;
    }
    lctx.beginPath(); lctx.moveTo(prev.x,prev.y); lctx.lineTo(target.x,target.y); lctx.stroke(); lctx.restore();
    state.last = target;
    render();
  }

  function pickColour(p) {
    render();
    const pixel = ctx.getImageData(Math.max(0,Math.min(W-1,Math.round(p.x))), Math.max(0,Math.min(H-1,Math.round(p.y))), 1,1).data;
    const hex = "#" + [pixel[0],pixel[1],pixel[2]].map(v=>v.toString(16).padStart(2,"0")).join("");
    setColour(hex);
    setTool("pencil");
    showToast(`Picked ${hex.toUpperCase()}`);
  }

  function setColour(hex) {
    state.colour = hex;
    $("#colourPicker").value = hex;
    $("#hexValue").textContent = hex.toUpperCase();
    $("#floatingColour").style.background = hex;
    state.recentColours = [hex, ...state.recentColours.filter(c => c !== hex)].slice(0,8);
    renderRecentColours();
  }

  function renderRecentColours() {
    const root = $("#recentColours");
    root.innerHTML = "";
    state.recentColours.forEach(c => {
      const b = document.createElement("button");
      b.style.setProperty("--swatch", c);
      b.addEventListener("click", ()=>setColour(c));
      root.appendChild(b);
    });
  }

  function normaliseRect(a,b) {
    const x = Math.min(a.x,b.x), y = Math.min(a.y,b.y);
    return {x,y,w:Math.abs(a.x-b.x),h:Math.abs(a.y-b.y)};
  }

  function stampMotif(p, random=false) {
    if (!state.motif) { showToast("Create a motif first ✿"); return; }
    const layer = activeLayer();
    if (!layer) return;
    const lctx = layer.canvas.getContext("2d");
    const motif = state.motif;
    const scale = state.motifScale * (random ? (.8 + Math.random()*.4) : 1);
    const drawW = motif.width * scale;
    const drawH = motif.height * scale;
    const rot = (state.motifRotation + (random ? (Math.random()*24-12) : 0)) * Math.PI/180;

    lctx.save();
    lctx.translate(p.x,p.y);
    lctx.rotate(rot);
    lctx.drawImage(motif, -drawW/2, -drawH/2, drawW, drawH);
    lctx.restore();
    render();
  }

  function patternFill() {
    if (!state.selection) { showToast("Select an area first"); return; }
    if (!state.motif) { showToast("Create a motif first ✿"); return; }
    const s = state.selection;
    const gap = Math.max(20, state.motifSpacing);
    const oldSelection = state.selection;
    state.selection = null;
    for (let y=s.y+gap/2; y<s.y+s.h; y+=gap) {
      for (let x=s.x+gap/2; x<s.x+s.w; x+=gap) {
        stampMotif({x,y}, false);
      }
    }
    state.selection = oldSelection;
    render();
    snapshot();
  }

  function createMotif() {
    if (!state.selection || state.selection.w < 8 || state.selection.h < 8) {
      showToast("Use Select around your flower first");
      return;
    }
    const s = state.selection;
    const motif = document.createElement("canvas");
    motif.width = Math.max(1, Math.round(s.w));
    motif.height = Math.max(1, Math.round(s.h));
    const mctx = motif.getContext("2d");

    // Capture only visible drawing layers, not mannequin/reference.
    [...state.layers].reverse().forEach(layer => {
      if (layer.visible) mctx.drawImage(layer.canvas, s.x,s.y,s.w,s.h, 0,0,motif.width,motif.height);
    });

    state.motif = motif;
    const preview = $("#motifPreview");
    const pctx = preview.getContext("2d");
    pctx.clearRect(0,0,preview.width,preview.height);
    const sc = Math.min((preview.width-18)/motif.width,(preview.height-18)/motif.height);
    pctx.drawImage(motif,(preview.width-motif.width*sc)/2,(preview.height-motif.height*sc)/2,motif.width*sc,motif.height*sc);
    $("#motifStatus").textContent = "Motif saved ✓";
    showToast("Motif saved — stamp it anywhere ✿");
  }

  function renderLayerList() {
    const root = $("#layerList");
    root.innerHTML = "";
    state.layers.forEach(layer => {
      const row = document.createElement("div");
      row.className = "layer-item" + (layer.id === state.activeLayerId ? " active" : "");
      row.innerHTML = `
        <button class="layer-eye" title="Show/hide">${layer.visible ? "◉" : "○"}</button>
        <div class="layer-name">${escapeHtml(layer.name)}</div>
        <button class="layer-delete" title="Delete">×</button>`;
      row.addEventListener("click", e => {
        if (e.target.classList.contains("layer-eye")) {
          layer.visible = !layer.visible;
        } else if (e.target.classList.contains("layer-delete")) {
          if (state.layers.length === 1) return showToast("Keep at least one layer");
          state.layers = state.layers.filter(l => l.id !== layer.id);
          if (state.activeLayerId === layer.id) state.activeLayerId = state.layers[0].id;
          snapshot();
        } else {
          state.activeLayerId = layer.id;
        }
        renderLayerList(); render();
      });
      row.querySelector(".layer-name").addEventListener("dblclick", e => {
        e.stopPropagation();
        const next = prompt("Layer name", layer.name);
        if (next) { layer.name = next.trim().slice(0,32); renderLayerList(); }
      });
      root.appendChild(row);
    });
  }

  function escapeHtml(v) {
    return v.replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[ch]));
  }

  function serializeLayers() {
    return state.layers.map(l => ({
      id:l.id, name:l.name, visible:l.visible, data:l.canvas.toDataURL("image/png")
    }));
  }

  function snapshot() {
    const snap = {
      layers: serializeLayers(),
      activeLayerId: state.activeLayerId,
      template: state.template,
      mannequinStyle: state.mannequinStyle,
      bodyType: state.bodyType,
      mannequinOpacity: state.mannequinOpacity,
      showFaceGuide: state.showFaceGuide,
      showCenterGuide: state.showCenterGuide
    };
    state.history = state.history.slice(0,state.historyIndex+1);
    state.history.push(snap);
    if (state.history.length > 20) state.history.shift();
    state.historyIndex = state.history.length-1;
  }

  async function restoreSnapshot(snap) {
    const layers = [];
    for (const d of snap.layers) {
      const c = newCanvas();
      const img = new Image();
      await new Promise(resolve => { img.onload=resolve; img.src=d.data; });
      c.getContext("2d").drawImage(img,0,0);
      layers.push({id:d.id,name:d.name,visible:d.visible,canvas:c});
    }
    state.layers = layers;
    state.activeLayerId = snap.activeLayerId;
    state.template = snap.template;
    state.mannequinStyle = snap.mannequinStyle || "fashion";
    state.bodyType = snap.bodyType || "standard";
    state.mannequinOpacity = snap.mannequinOpacity ?? 1;
    state.showFaceGuide = snap.showFaceGuide ?? true;
    state.showCenterGuide = snap.showCenterGuide ?? true;
    syncMannequinUI();
    renderLayerList(); render();
  }

  async function undo() {
    if (state.historyIndex <= 0) return;
    state.historyIndex--;
    await restoreSnapshot(state.history[state.historyIndex]);
  }
  async function redo() {
    if (state.historyIndex >= state.history.length-1) return;
    state.historyIndex++;
    await restoreSnapshot(state.history[state.historyIndex]);
  }

  function exportPNG() {
    const exportCanvas = newCanvas();
    const ectx = exportCanvas.getContext("2d");
    ectx.fillStyle="#fff"; ectx.fillRect(0,0,W,H);
    if (state.referenceImage) {
      ectx.save(); ectx.globalAlpha=state.referenceOpacity;
      const img=state.referenceImage;
      const scale=Math.min((W*.82)/img.width,(H*.82)/img.height);
      const iw=img.width*scale, ih=img.height*scale;
      ectx.drawImage(img,(W-iw)/2,(H-ih)/2,iw,ih); ectx.restore();
    }
    drawMannequin(ectx,state.template);
    [...state.layers].reverse().forEach(l=>{if(l.visible) ectx.drawImage(l.canvas,0,0)});
    const link=document.createElement("a");
    const safe=($("#designName").value||"amea-design").trim().replace(/[^a-z0-9-_]+/gi,"-").replace(/^-|-$/g,"");
    link.download=`${safe || "amea-design"}.png`;
    link.href=exportCanvas.toDataURL("image/png");
    link.click();
    showToast("PNG exported ✓");
  }

  // Pointer / Apple Pencil drawing
  artboard.addEventListener("pointerdown", e => {
    e.preventDefault();
    artboard.setPointerCapture?.(e.pointerId);
    const p=pointFromEvent(e);

    if (state.tool === "eyedropper") return pickColour(p);
    if (state.tool === "fillpattern") return patternFill();
    if (state.tool === "stamp") { stampMotif(p); state.lastStamp=p; return; }
    if (state.tool === "select") {
      state.selectionStart=p; state.selection={x:p.x,y:p.y,w:0,h:0}; render(); return;
    }

    state.drawing=true; state.last=p;
    if (state.tool === "scatter") {
      stampMotif(p,true); state.lastStamp=p; return;
    }
    strokeTo(p);
  }, {passive:false});

  artboard.addEventListener("pointermove", e => {
    if (!state.drawing && state.tool !== "select") return;
    if (!(e.buttons > 0 || e.pointerType === "touch" || e.pointerType === "pen")) return;
    e.preventDefault();
    const p=pointFromEvent(e);

    if (state.tool === "select" && state.selectionStart) {
      state.selection=normaliseRect(state.selectionStart,p); render(); return;
    }
    if (!state.drawing) return;

    if (state.tool === "scatter") {
      const last=state.lastStamp||p;
      const dx=p.x-last.x, dy=p.y-last.y;
      const dist=Math.hypot(dx,dy);
      if (dist >= state.motifSpacing) { stampMotif(p,true); state.lastStamp=p; }
      return;
    }
    strokeTo(p);
  }, {passive:false});

  function endPointer() {
    if (state.tool === "select") {
      state.selectionStart=null; render(); return;
    }
    if (state.drawing) snapshot();
    state.drawing=false; state.last=null; state.lastStamp=null;
  }
  artboard.addEventListener("pointerup", endPointer);
  artboard.addEventListener("pointercancel", endPointer);

  // Tool controls
  $$(".tool-btn").forEach(b => b.addEventListener("click",()=>{
    const t=b.dataset.tool;
    if ((t==="pencil"||t==="marker") && state.tool===t) openBrushLibrary(t);
    else setTool(t);
  }));
  $$("[data-quick-tool]").forEach(b => b.addEventListener("click",()=>setTool(b.dataset.quickTool)));
  $("#closeBrushLibrary").addEventListener("click",()=>$("#brushLibrary").classList.remove("open"));
  $("#brushSmoothing").addEventListener("input",e=>{state.smoothing=+e.target.value/100;$("#brushSmoothingValue").textContent=e.target.value+"%"});
  $("#pressureToggle").addEventListener("change",e=>{state.pressureEnabled=e.target.checked});

  $("#brushSize").addEventListener("input", e => {
    state.brushSize=+e.target.value; $("#brushSizeValue").textContent=e.target.value;
  });
  $("#brushOpacity").addEventListener("input", e => {
    state.opacity=+e.target.value/100; $("#brushOpacityValue").textContent=e.target.value+"%";
  });
  $("#colourPicker").addEventListener("input",e=>setColour(e.target.value));
  $$("#swatches button").forEach(b=>b.addEventListener("click",()=>setColour(b.dataset.colour)));

  function syncMannequinUI(){
    $$("[data-mannequin-style]").forEach(btn=>btn.classList.toggle("active",btn.dataset.mannequinStyle===state.mannequinStyle));
    $$("[data-body-type]").forEach(btn=>btn.classList.toggle("active",btn.dataset.bodyType===state.bodyType));
    $("#mannequinOpacity").value=Math.round(state.mannequinOpacity*100);
    $("#mannequinOpacityValue").textContent=Math.round(state.mannequinOpacity*100)+"%";
    $("#showFaceGuide").checked=state.showFaceGuide;
    $("#showCenterGuide").checked=state.showCenterGuide;
  }
  $$("[data-mannequin-style]").forEach(btn=>btn.addEventListener("click",()=>{state.mannequinStyle=btn.dataset.mannequinStyle;syncMannequinUI();render();snapshot()}));
  $$("[data-body-type]").forEach(btn=>btn.addEventListener("click",()=>{state.bodyType=btn.dataset.bodyType;syncMannequinUI();render();snapshot()}));
  $("#mannequinOpacity").addEventListener("input",e=>{state.mannequinOpacity=+e.target.value/100;$("#mannequinOpacityValue").textContent=e.target.value+"%";render()});
  $("#showFaceGuide").addEventListener("change",e=>{state.showFaceGuide=e.target.checked;render();snapshot()});
  $("#showCenterGuide").addEventListener("change",e=>{state.showCenterGuide=e.target.checked;render();snapshot()});

  $("#motifSize").addEventListener("input",e=>{
    state.motifScale=+e.target.value/100; $("#motifSizeValue").textContent=e.target.value+"%";
  });
  $("#motifSpacing").addEventListener("input",e=>{
    state.motifSpacing=+e.target.value; $("#motifSpacingValue").textContent=e.target.value;
  });
  $("#motifRotation").addEventListener("input",e=>{
    state.motifRotation=+e.target.value; $("#motifRotationValue").textContent=e.target.value+"°";
  });
  $("#createMotifBtn").addEventListener("click",createMotif);
  $("#clearMotifBtn").addEventListener("click",()=>{
    state.motif=null; $("#motifPreview").getContext("2d").clearRect(0,0,220,160);
    $("#motifStatus").textContent="No motif saved"; showToast("Motif cleared");
  });

  // Tabs
  $$(".tab-btn").forEach(btn=>btn.addEventListener("click",()=>{
    $$(".tab-btn").forEach(b=>b.classList.remove("active"));
    $$(".tab-panel").forEach(p=>p.classList.remove("active"));
    btn.classList.add("active");
    $(`.tab-panel[data-panel="${btn.dataset.tab}"]`).classList.add("active");
  }));

  // Layers
  $("#addLayerBtn").addEventListener("click",()=>addLayer(`Layer ${state.layers.length+1}`));
  $("#clearLayerBtn").addEventListener("click",()=>{
    const layer=activeLayer(); if(!layer) return;
    if (!confirm(`Clear "${layer.name}"?`)) return;
    layer.canvas.getContext("2d").clearRect(0,0,W,H);
    render(); snapshot();
  });

  // Mannequin views
  $$(".view-btn").forEach(btn=>btn.addEventListener("click",()=>{
    state.template=btn.dataset.template;
    $$(".view-btn").forEach(b=>b.classList.toggle("active",b===btn));
    render(); snapshot();
  }));

  // Reference
  $("#referenceUpload").addEventListener("change",e=>{
    const file=e.target.files?.[0]; if(!file) return;
    const reader=new FileReader();
    reader.onload=()=>{
      const img=new Image();
      img.onload=()=>{state.referenceImage=img; render(); showToast("Reference added ✓");};
      img.src=reader.result;
    };
    reader.readAsDataURL(file);
  });
  $("#referenceOpacity").addEventListener("input",e=>{
    state.referenceOpacity=+e.target.value/100;
    $("#referenceOpacityValue").textContent=e.target.value+"%";
    render();
  });
  $("#removeReferenceBtn").addEventListener("click",()=>{
    state.referenceImage=null; $("#referenceUpload").value=""; render();
  });

  // Collapsible panels
  $("#toggleLeft").addEventListener("click",()=>shell.classList.toggle("left-collapsed"));
  $("#toggleRight").addEventListener("click",()=>shell.classList.toggle("right-collapsed"));
  $("#reopenLeft").addEventListener("click",()=>shell.classList.remove("left-collapsed"));
  $("#reopenRight").addEventListener("click",()=>shell.classList.remove("right-collapsed"));

  // Focus mode
  function toggleFocus(force) {
    const on = typeof force==="boolean" ? force : !document.body.classList.contains("focus-mode");
    document.body.classList.toggle("focus-mode",on);
  }
  $("#focusBtn").addEventListener("click",()=>toggleFocus());
  $("#exitFocusBtn").addEventListener("click",()=>toggleFocus(false));

  // Undo/redo/export
  $("#undoBtn").addEventListener("click",undo);
  $("#redoBtn").addEventListener("click",redo);
  $("#floatingUndo").addEventListener("click",undo);
  $("#exportBtn").addEventListener("click",exportPNG);

  // Keyboard shortcuts for desktop testing
  window.addEventListener("keydown",e=>{
    if ((e.metaKey||e.ctrlKey) && e.key.toLowerCase()==="z") {
      e.preventDefault(); e.shiftKey ? redo() : undo();
    }
  });

  // Initial state
  addLayer("Details");
  addLayer("Colour");
  addLayer("Sketch");
  state.history = [];
  state.historyIndex = -1;
  snapshot();
  setColour(state.colour);
  applyBrushPreset("pencil",BRUSH_PRESETS.pencil[0]);
  $("#brushLibrary").classList.remove("open");
  syncMannequinUI();
  renderLayerList();
  render();
})();