(() => {
  "use strict";

  const W = 1800, H = 2200;
  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => [...root.querySelectorAll(sel)];

  const artboard = $("#artboard");
  const ctx = artboard.getContext("2d", { willReadFrequently: true });
  const shell = $("#studioShell");
  const toast = $("#toast");

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
    recentColours: []
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

  function setTool(tool) {
    state.tool = tool;
    $$(".tool-btn").forEach(btn => btn.classList.toggle("active", btn.dataset.tool === tool));
    artboard.style.cursor = tool === "eyedropper" ? "crosshair" : tool === "select" ? "crosshair" : "default";
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

  function drawMannequin(target, view) {
    if (view === "blank") return;
    const t = target;
    t.save();
    t.strokeStyle = "#cdbdc5";
    t.fillStyle = "#fbf5f7";
    t.lineWidth = 7;
    t.lineCap = "round";
    t.lineJoin = "round";
    const cx = W/2;

    // head
    t.beginPath();
    t.ellipse(cx, 245, view === "side" ? 78 : 108, 142, 0, 0, Math.PI*2);
    t.fill(); t.stroke();

    // neck
    t.beginPath();
    t.moveTo(cx-45, 375); t.lineTo(cx-52, 470);
    t.moveTo(cx+45, 375); t.lineTo(cx+52, 470);
    t.stroke();

    if (view === "side") {
      t.beginPath();
      t.moveTo(cx-15, 465);
      t.bezierCurveTo(cx+115,520,cx+135,690,cx+90,830);
      t.bezierCurveTo(cx+40,990,cx+85,1200,cx+45,1360);
      t.bezierCurveTo(cx+18,1510,cx+30,1720,cx+14,1975);
      t.moveTo(cx-15,465);
      t.bezierCurveTo(cx-75,555,cx-90,720,cx-48,845);
      t.bezierCurveTo(cx-15,1010,cx-42,1200,cx-38,1360);
      t.bezierCurveTo(cx-20,1520,cx-12,1730,cx-5,1975);
      t.stroke();

      // arm
      t.beginPath();
      t.moveTo(cx+45,530);
      t.bezierCurveTo(cx+165,760,cx+140,1040,cx+95,1240);
      t.stroke();
      return;
    }

    // torso
    t.beginPath();
    t.moveTo(cx-52,465);
    t.bezierCurveTo(cx-180,510,cx-185,675,cx-135,820);
    t.bezierCurveTo(cx-95,935,cx-80,1030,cx-115,1165);
    t.bezierCurveTo(cx-150,1295,cx-120,1425,cx-82,1545);
    t.lineTo(cx-55,2000);
    t.moveTo(cx+52,465);
    t.bezierCurveTo(cx+180,510,cx+185,675,cx+135,820);
    t.bezierCurveTo(cx+95,935,cx+80,1030,cx+115,1165);
    t.bezierCurveTo(cx+150,1295,cx+120,1425,cx+82,1545);
    t.lineTo(cx+55,2000);
    t.stroke();

    // shoulders and arms
    t.beginPath();
    t.moveTo(cx-52,485);
    t.bezierCurveTo(cx-240,490,cx-310,560,cx-360,690);
    t.bezierCurveTo(cx-425,880,cx-420,1110,cx-375,1320);
    t.moveTo(cx+52,485);
    t.bezierCurveTo(cx+240,490,cx+310,560,cx+360,690);
    t.bezierCurveTo(cx+425,880,cx+420,1110,cx+375,1320);
    t.stroke();

    // inner legs
    t.beginPath();
    t.moveTo(cx-5,1245); t.lineTo(cx-8,1995);
    t.moveTo(cx+5,1245); t.lineTo(cx+8,1995);
    t.stroke();

    // light guides
    t.strokeStyle = "#eadfe4";
    t.lineWidth = 3;
    t.setLineDash([18,20]);
    t.beginPath(); t.moveTo(cx,440); t.lineTo(cx,2040); t.stroke();
    t.setLineDash([]);

    if (view === "back") {
      t.strokeStyle = "#d6c5cd";
      t.lineWidth = 5;
      t.beginPath();
      t.moveTo(cx-55,485); t.quadraticCurveTo(cx,535,cx+55,485);
      t.stroke();
    }
    t.restore();
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
    lctx.lineCap = "round";
    lctx.lineJoin = "round";
    lctx.globalAlpha = state.opacity;

    if (state.tool === "eraser") {
      lctx.globalCompositeOperation = "destination-out";
      lctx.strokeStyle = "rgba(0,0,0,1)";
      lctx.lineWidth = state.brushSize * 2.2;
    } else {
      lctx.globalCompositeOperation = "source-over";
      lctx.strokeStyle = state.colour;
      const pressureBoost = p.pressure ? (.65 + p.pressure*.75) : 1;
      lctx.lineWidth = state.brushSize * (state.tool === "marker" ? 2.2 : 1) * pressureBoost;
    }
    lctx.beginPath();
    lctx.moveTo(prev.x, prev.y);
    lctx.lineTo(p.x, p.y);
    lctx.stroke();
    lctx.restore();
    state.last = p;
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
      template: state.template
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
  $$(".tool-btn").forEach(b => b.addEventListener("click",()=>setTool(b.dataset.tool)));
  $$("[data-quick-tool]").forEach(b => b.addEventListener("click",()=>setTool(b.dataset.quickTool)));

  $("#brushSize").addEventListener("input", e => {
    state.brushSize=+e.target.value; $("#brushSizeValue").textContent=e.target.value;
  });
  $("#brushOpacity").addEventListener("input", e => {
    state.opacity=+e.target.value/100; $("#brushOpacityValue").textContent=e.target.value+"%";
  });
  $("#colourPicker").addEventListener("input",e=>setColour(e.target.value));
  $$("#swatches button").forEach(b=>b.addEventListener("click",()=>setColour(b.dataset.colour)));

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
  renderLayerList();
  render();
})();