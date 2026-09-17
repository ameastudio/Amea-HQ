const $=s=>document.querySelector(s),G=(k,d=[])=>JSON.parse(localStorage.getItem("ah_"+k)||JSON.stringify(d)),S=(k,v)=>localStorage.setItem("ah_"+k,JSON.stringify(v));let cur="home";const O=()=>G("orders"),C=()=>G("customers"),I=()=>G("inventory"),E=()=>G("expenses"),SUP=()=>G("suppliers"),ITEMS=()=>G("items");const M=n=>new Intl.NumberFormat("en-JM",{style:"currency",currency:"JMD",maximumFractionDigits:0}).format(+n||0);
function greeting(){let h=new Date().getHours();return h<12?"Good morning":h<18?"Good afternoon":"Good evening"}

const SUPABASE_URL="https://ndmrwfctiomruibiczrj.supabase.co";
const SUPABASE_PUBLISHABLE_KEY="sb_publishable_3YRAOX1udY5SkPugRSy8WQ__aTUzl3y";
let cloud=null;

function initCloudClient(){
  if(!window.supabase)throw new Error("Supabase library did not load.");
  cloud=window.supabase.createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,{
    auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}
  });
}

function showAuth(message=""){
  const auth=$("#auth-screen"),app=$("#app"),msg=$("#auth-message");
  if(auth)auth.style.display="grid";
  if(app)app.style.display="none";
  if(msg)msg.textContent=message;
}

function showHQ(){
  const auth=$("#auth-screen"),app=$("#app");
  if(auth)auth.style.display="none";
  if(app)app.style.display="block";
  page("home");
}

async function loginHQ(){
  const email=$("#auth-email")?.value.trim();
  const password=$("#auth-password")?.value||"";
  const msg=$("#auth-message"),btn=$("#auth-button");
  if(!email||!password){
    if(msg)msg.textContent="Enter your email and password.";
    return;
  }
  if(btn){btn.disabled=true;btn.textContent="Signing in…"}
  if(msg)msg.textContent="";
  try{
    const {error}=await cloud.auth.signInWithPassword({email,password});
    if(error)throw error;
    showHQ();
  }catch(err){
    if(msg)msg.textContent=err?.message||"Could not sign in.";
  }finally{
    if(btn){btn.disabled=false;btn.textContent="Sign In"}
  }
}

async function logoutHQ(){
  if(!cloud)return;
  await cloud.auth.signOut();
  showAuth("Signed out.");
}

async function startHQ(){
  try{
    initCloudClient();
    const {data,error}=await cloud.auth.getSession();
    if(error)throw error;
    if(data?.session)showHQ();
    else showAuth();
    cloud.auth.onAuthStateChange((event,session)=>{
      if(event==="SIGNED_OUT")showAuth();
      if(event==="SIGNED_IN"&&session)showHQ();
    });
  }catch(err){
    console.error("Améa HQ cloud start error",err);
    showAuth("Could not connect to Améa HQ cloud. Check your internet and reload.");
  }
}


function ordersForCustomer(c){
  const name=String(c?.name||"").trim().toLowerCase();
  return O().filter(o=>
    (o.customerId&&c?.id&&o.customerId===c.id) ||
    (!o.customerId&&String(o.customer||"").trim().toLowerCase()===name)
  );
}
function customerStats(c){
  const orders=ordersForCustomer(c).slice().sort((a,b)=>new Date(b.created||0)-new Date(a.created||0));
  const paid=orders.reduce((sum,o)=>sum+(+o.paid||0),0);
  const sources=[...new Set(orders.map(o=>o.source).filter(x=>x&&x!=="Not set"))];
  const last=orders[0]?.created?new Date(orders[0].created):null;
  return {orders,paid,sources,last};
}
function customerStatusText(c){
  const n=ordersForCustomer(c).length;
  return n===0?"No purchases yet":n===1?"1 purchase":"Returning customer · "+n+" purchases";
}

function page(x){cur=x;render()}function render(){document.querySelectorAll("nav button").forEach(b=>b.classList.toggle("active",b.dataset.page===cur));let v=$("#view");if(cur=="home"){let o=O(),e=E(),now=new Date(),mo=o.filter(x=>new Date(x.created).getMonth()==now.getMonth()),sales=mo.reduce((a,x)=>a+x.paid,0),out=mo.reduce((a,x)=>a+Math.max(0,x.price-x.paid),0),ex=e.filter(x=>new Date(x.date).getMonth()==now.getMonth()).reduce((a,x)=>a+x.amount,0),today=new Date().toISOString().slice(0,10);v.innerHTML=`<div class=hero><h2>${greeting()}, Améa Boss ✨</h2><div class=meta>Everything in your studio, in one pretty place.</div></div><div class=grid><div class=card>Sales<b>${M(sales)}</b></div><div class=card>Orders<b>${mo.length}</b></div><div class=card>Outstanding<b>${M(out)}</b></div><div class=card>Expenses<b>${M(ex)}</b></div></div><div class=section><h3>Today</h3><div class=card>${list(O().filter(x=>x.due==today),true)||'<div class=meta>No orders due today 💗</div>'}</div></div><div class=section><h3>Quick Actions</h3><div class=quick><button onclick=newOrder()>＋ New Order</button><button onclick=newCustomer()>＋ Customer</button><button onclick=newExpense()>＋ Expense</button><button onclick="page('calendar')">♡ Calendar</button></div></div><div class=section><h3>Recent Orders</h3>${list(O().slice(-5).reverse())||'<div class=empty>No orders yet.</div>'}</div>`}
else if(cur=="orders")v.innerHTML=`<h2>Orders</h2><input placeholder="Search orders, customers, products…" oninput="searchO(this.value)"><div id=ol>${list(O().slice().reverse())||'<div class=empty>No orders yet.</div>'}</div>`;
else if(cur=="customers")v.innerHTML=`<div class=top><h2>Customers</h2><button onclick=newCustomer()>＋ Add</button></div>${C().map(x=>{let st=customerStats(x),last=st.last?st.last.toLocaleDateString("en-JM",{day:"numeric",month:"short",year:"numeric"}):"";return `<div class="item customer-row" onclick="openCustomer('${x.id}')"><div class=top><b>${esc(x.name)}</b><span class="customer-badge ${st.orders.length?"returning":"new"}">${st.orders.length?"RETURNING":"NEW"}</span></div><div class=meta>${esc(x.phone||"")}${x.email?" · "+esc(x.email):""}<br><b>${customerStatusText(x)}</b>${st.orders.length?` · ${M(st.paid)} lifetime`:""}${last?`<br>Last order: ${last}`:""}</div><div class=customer-chevron>View customer →</div></div>`}).join("")||'<div class=empty>No customers yet.</div>'}`;
else if(cur=="invoices"){
  const orders=O().slice().reverse();
  v.innerHTML=`<div class=top><div><h2>Invoices</h2><div class=meta>Invoices are created from your saved orders.</div></div></div>
  ${orders.length?orders.map(o=>{
    const bal=Math.max(0,(+o.price||0)-(+o.paid||0));
    return `<div class=item>
      <div class=top><b>${esc("INV-"+o.no)}</b><span class="badge">${bal>0?"Balance due":"Paid"}</span></div>
      <div class=meta>${esc(o.customer||"")} · ${esc(o.product||"")}<br>Total: ${M(o.price)} · Paid: ${M(o.paid)} · Balance: ${M(bal)}</div>
      <button class=invoice-list-btn onclick="openInvoice('${o.id}')">Open Invoice</button>
    </div>`
  }).join(""):'<div class=empty>No invoices yet. Create an order first.</div>'}`;
}

else if(cur=="items")v.innerHTML=`<div class=top><div><h2>Items</h2><div class=meta>Products you sell — separate from materials inventory.</div></div><button onclick=newItem()>＋ Add</button></div><div class=item-catalog>${ITEMS().map(x=>`<div class=item-card onclick="newItem('${x.id}')">${x.photo?`<img src="${x.photo}" alt="${esc(x.name)}">`:`<div class=item-photo-placeholder>AMÉA</div>`}<div class=item-card-body><b>${esc(x.name)}</b><div class=meta>${esc(x.category||"Other")} · ${M(x.price)}</div><div class=meta>${x.status=="Ready-made"?"Ready-made":"Made to order"}${x.sizes?` · ${esc(x.sizes)}`:""}</div></div></div>`).join("")||'<div class=empty>No items yet. Add your first product so orders can select from a list.</div>'}</div>`;
else if(cur=="inventory")v.innerHTML=`<div class=top><h2>Inventory</h2><button onclick=newInventory()>＋ Add</button></div>${I().map(x=>`<div class=item><div class=top><b>${x.name}</b><span class=${x.qty<=x.low?"money":""}>${x.qty}</span></div><div class=meta>${x.type}${x.qty<=x.low?" · LOW STOCK":""}</div></div>`).join("")||'<div class=empty>No inventory yet.</div>'}`;
else if(cur=="more")v.innerHTML=`<h2>More</h2><div class=quick><button onclick="page('items')">♢ Items</button><button onclick="page('inventory')">▦ Inventory</button><button onclick="page('expenses')">↘ Expenses</button><button onclick="page('analytics')">▥ Analytics</button><button onclick="page('calendar')">♡ Calendar</button><button onclick="page('settings')">⚙ Settings</button></div><div class="section"><div class="card cloud-card"><div><b>Cloud account</b><div class="meta">Signed in securely with Supabase.</div></div><button class="signout-btn" onclick="logoutHQ()">Sign Out</button></div></div>`;
else if(cur=="expenses")v.innerHTML=`<div class=top><h2>Expenses</h2><div class=top-actions><button onclick=manageSuppliers()>Suppliers</button><button onclick=newExpense()>＋ Add</button></div></div>${E().slice().reverse().map(x=>`<div class=item><div class=top><b>${x.category}</b><span class=money>${M(x.amount)}</span></div><div class=meta>${x.date}${x.supplier?" · Supplier: "+x.supplier:""}${x.note?" · "+x.note:""}</div></div>`).join("")||'<div class=empty>No expenses yet.</div>'}`;
else if(cur=="analytics"){renderAnalytics("month")}
else if(cur=="calendar")v.innerHTML=`<div class=top><h2>Calendar</h2><button onclick=ics()>Add .ics</button></div>${O().filter(x=>x.due).sort((a,b)=>a.due.localeCompare(b.due)).map(x=>`<div class=item><b>${x.due}</b><div class=meta>${x.no} · ${x.customer} · ${x.product} · ${x.delivery}</div></div>`).join("")||'<div class=empty>No due dates yet.</div>'}`;
else if(cur=="settings"){let s=G("settings",{});v.innerHTML=`<h2>Settings</h2><div class=card><label>Email</label><input id=se value="${s.email||""}"><label>WhatsApp / phone</label><input id=sp value="${s.phone||""}"><label>Instagram</label><input id=si value="${s.instagram||""}"><label>Delivery options</label><input id=sd value="${(s.delivery||["Pickup","Delivery"]).join(", ")}"><button class=primary onclick=saveSettings()>Save</button></div><div class="section quick"><button onclick=notify()>Allow Notifications</button><button onclick=backup()>Export Backup</button></div><p class=meta>This build stores data on this device. Export backups regularly.</p>`}}
function list(a){return a.map(x=>`<div class=item onclick="editOrder('${x.id}')"><div class=top><b>${x.no} · ${x.customer}</b><span class=badge>${x.status}</span></div><div class=meta>${x.product} · ${x.size||"—"} · ${x.color||"—"}<br>Placed via: ${x.source||"Not set"} · Payment: ${x.payment} · Delivery: ${x.delivery}<br>Due: ${x.due||"—"}</div><div class=money>${M(x.paid)} paid · ${M(Math.max(0,x.price-x.paid))} balance</div></div>`).join("")}
function searchO(q){q=q.toLowerCase();$("#ol").innerHTML=list(O().filter(x=>JSON.stringify(x).toLowerCase().includes(q)))}
function openF(h){$("#form").innerHTML=h;if(!dlg.open)dlg.showModal()}function openAddMenu(){openF(`<h2>Add to Améa HQ</h2><div class=add-menu><button onclick="newOrder()">＋ New Order</button><button onclick="newCustomer()">＋ Customer</button><button onclick="newItem()">＋ Item</button><button onclick="newExpense()">＋ Expense</button><button onclick="newInventory()">＋ Inventory</button></div>`)}
function dels(){return G("settings",{}).delivery||["Pickup","Delivery"]}

function itemById(id){return ITEMS().find(x=>x.id===id)}
function imageToSmallDataUrl(file){
  return new Promise((resolve,reject)=>{
    if(!file)return resolve("");
    const reader=new FileReader();
    reader.onerror=()=>reject(new Error("Could not read image"));
    reader.onload=()=>{
      const img=new Image();
      img.onerror=()=>reject(new Error("Could not process image"));
      img.onload=()=>{
        const max=700,scale=Math.min(1,max/Math.max(img.width,img.height));
        const c=document.createElement("canvas");
        c.width=Math.max(1,Math.round(img.width*scale));
        c.height=Math.max(1,Math.round(img.height*scale));
        c.getContext("2d").drawImage(img,0,0,c.width,c.height);
        resolve(c.toDataURL("image/jpeg",.72));
      };
      img.src=reader.result;
    };
    reader.readAsDataURL(file);
  });
}
function previewItemPhoto(input){
  const f=input.files&&input.files[0];
  if(!f)return;
  const r=new FileReader();
  r.onload=()=>{let p=$("#itemPhotoPreview");if(p){p.src=r.result;p.style.display="block"}};
  r.readAsDataURL(f);
}
function newItem(id=""){
  const x=id?itemById(id):{};
  openF(`<h2>${id?"Edit":"New"} Item</h2>
    <label>Item name</label><input id=itemName value="${esc(x?.name||"")}" placeholder="e.g. Eve Dress">
    <label>Category</label><select id=itemCategory>${["Dresses","Skirt Sets","Short Sets","Other"].map(z=>`<option ${x?.category==z?"selected":""}>${z}</option>`).join("")}</select>
    <label>Default price (JMD)</label><input id=itemPrice type=number value="${x?.price||""}">
    <label>Sizes offered</label><input id=itemSizes value="${esc(x?.sizes||"XS, S, M, L, XL")}" placeholder="XS, S, M, L, XL">
    <label>Item type</label><select id=itemStatus>${["Made to order","Ready-made"].map(z=>`<option ${x?.status==z?"selected":""}>${z}</option>`).join("")}</select>
    <label>Photo <span class=meta>(optional)</span></label>
    ${x?.photo?`<img id=itemPhotoPreview class=item-photo-preview src="${x.photo}" alt="">`:`<img id=itemPhotoPreview class=item-photo-preview style="display:none" alt="">`}
    <input id=itemPhoto type=file accept="image/*" onchange="previewItemPhoto(this)">
    <label>Notes</label><textarea id=itemNotes>${esc(x?.notes||"")}</textarea>
    <button class=primary onclick="saveItem('${id}')">${id?"Save Changes":"Add Item"}</button>
    ${id?`<button class=danger onclick="deleteItem('${id}')">Delete Item</button>`:""}`)
}
async function saveItem(id=""){
  const name=itemName.value.trim();
  if(!name)return alert("Add an item name.");
  const price=+itemPrice.value||0;
  let a=ITEMS(),old=id?itemById(id):null,photo=old?.photo||"";
  const file=itemPhoto.files&&itemPhoto.files[0];
  if(file){
    try{photo=await imageToSmallDataUrl(file)}
    catch(e){return alert("I couldn't process that photo. Try another image.")}
  }
  const x={id:id||crypto.randomUUID(),name,category:itemCategory.value,price,sizes:itemSizes.value.trim(),status:itemStatus.value,photo,notes:itemNotes.value.trim()};
  a=id?a.map(z=>z.id===id?x:z):[...a,x];
  try{S("items",a)}
  catch(e){return alert("That photo is too large for the current offline app storage. Try a smaller image.")}
  dlg.close();page("items")
}
function deleteItem(id){
  if(O().some(o=>o.itemId===id))return alert("This item is already used on an order, so it can't be deleted yet.");
  if(confirm("Delete this item?")){S("items",ITEMS().filter(x=>x.id!==id));dlg.close();page("items")}
}
function fillOrderItem(id){
  const item=itemById(id);
  if(!item)return;
  if($("#opr"))opr.value=item.price||0;
  const sizeInput=$("#os");
  if(sizeInput){
    const sizes=String(item.sizes||"").split(",").map(x=>x.trim()).filter(Boolean);
    sizeInput.setAttribute("list","orderSizeList");
    let dl=$("#orderSizeList");
    if(dl)dl.innerHTML=sizes.map(s=>`<option value="${esc(s)}">`).join("");
  }
}

function newOrder(x={}){
  const customers=C(),items=ITEMS();
  let selectedCustomerId=x.customerId||customers.find(c=>String(c.name||"").trim().toLowerCase()===String(x.customer||"").trim().toLowerCase())?.id||"";
  let selectedItemId=x.itemId||items.find(i=>String(i.name||"").trim().toLowerCase()===String(x.product||"").trim().toLowerCase())?.id||"";
  const customerOptions=customers.length
    ? `<option value="">Select a customer</option>${customers.map(c=>`<option value="${c.id}" ${selectedCustomerId===c.id?"selected":""}>${esc(c.name)}${c.phone?" · "+esc(c.phone):""}</option>`).join("")}`
    : `<option value="">No customers saved yet</option>`;
  const itemOptions=items.length
    ? `<option value="">Select an item</option>${items.map(i=>`<option value="${i.id}" ${selectedItemId===i.id?"selected":""}>${esc(i.name)} · ${M(i.price)}</option>`).join("")}`
    : `<option value="">No items saved yet</option>`;
  openF(`<h2>${x.id?"Edit":"New"} Order</h2>
  <label>Customer</label>
  <select id=oc ${customers.length?"":"disabled"}>${customerOptions}</select>
  ${customers.length?"":'<div class=customer-help>Add a customer first, then return to New Order.</div>'}
  <label>Item</label>
  <select id=op ${items.length?"":"disabled"} onchange="fillOrderItem(this.value)">${itemOptions}</select>
  ${items.length?"":'<div class=customer-help>Add an item first, then return to New Order.</div>'}
  <div class=row><div><label>Size</label><input id=os list=orderSizeList value="${esc(x.size||"")}"><datalist id=orderSizeList></datalist></div><div><label>Color</label><input id=ocol value="${esc(x.color||"")}"></div></div>
  <div class=row><div><label>Price</label><input id=opr type=number value="${x.price||""}"></div><div><label>Paid</label><input id=opa type=number value="${x.paid||0}"></div></div>
  <label>Where was this order placed?</label><select id=osrc>${["Not set","Website","Instagram","WhatsApp","In person","Phone","Other"].map(z=>`<option ${x.source==z?"selected":""}>${z}</option>`).join("")}</select>
  <label>Due date</label><input id=od type=date value="${x.due||""}">
  <label>Payment method</label><select id=opay>${["Cash","Bank transfer","Website"].map(z=>`<option ${x.payment==z?"selected":""}>${z}</option>`).join("")}</select>
  <label>Delivery method</label><select id=odel>${dels().map(z=>`<option ${x.delivery==z?"selected":""}>${z}</option>`).join("")}</select>
  <label>Status</label><select id=ost>${["New","In Studio","Ready","Delivered"].map(z=>`<option ${x.status==z?"selected":""}>${z}</option>`).join("")}</select>
  <label>Private notes</label><textarea id=on>${esc(x.notes||"")}</textarea>
  ${x.id?'<label>Reason for edit</label><input id=reason placeholder="Reason required">':""}
  <button class=primary onclick="saveOrder('${x.id||""}')" ${customers.length&&items.length?"":"disabled"}>Save Order</button>
  ${x.id?`<button class=invoice-btn onclick="openInvoice('${x.id}')">Create Invoice</button><button class=danger onclick="delOrder('${x.id}')">Delete Order</button>`:""}`);
  if(selectedItemId)fillOrderItem(selectedItemId);
}
function saveOrder(id){
  let a=O(),old=a.find(x=>x.id==id);
  if(old&&!$("#reason").value.trim())return alert("Add a reason for the edit.");
  const customer=C().find(c=>c.id===oc.value);
  if(!customer)return alert("Select a customer.");
  const item=itemById(op.value);
  if(!item)return alert("Select an item.");
  let seq=+localStorage.getItem("ah_seq")||0,
  x={id:id||crypto.randomUUID(),no:old?.no||"AM-"+String(seq+1).padStart(4,"0"),customerId:customer.id,customer:customer.name,itemId:item.id,product:item.name,size:os.value,color:ocol.value,price:+opr.value||0,paid:+opa.value||0,source:osrc.value,due:od.value,payment:opay.value,delivery:odel.value,status:ost.value,notes:on.value,created:old?.created||new Date().toISOString(),history:old?.history||[]};
  if(old){x.history.push({at:new Date().toISOString(),reason:reason.value});a=a.map(z=>z.id==id?x:z)}
  else{localStorage.setItem("ah_seq",seq+1);a.push(x)}
  S("orders",a);dlg.close();render()
}
function editOrder(id){newOrder(O().find(x=>x.id==id))}

function esc(v){return String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
function customerForOrder(o){return C().find(c=>(o.customerId&&c.id===o.customerId)||(!o.customerId&&String(c.name||"").trim().toLowerCase()==String(o.customer||"").trim().toLowerCase()))||{}}
function invoiceMarkup(id,printMode=false){
  const o=O().find(x=>x.id==id); if(!o)return "";
  const c=customerForOrder(o),s=G("settings",{}),balance=Math.max(0,(+o.price||0)-(+o.paid||0));
  const created=o.created?new Date(o.created):new Date();
  const issued=created.toLocaleDateString("en-JM",{year:"numeric",month:"short",day:"numeric"});
  return `<div class="invoice-sheet ${printMode?"print-mode":""}">
    <div class=invoice-head>
      <div><div class=invoice-brand>améa</div><div class=invoice-sub>INVOICE</div></div>
      <div class=invoice-number><b>${esc("INV-"+o.no)}</b><span>${esc(issued)}</span></div>
    </div>
    <div class=invoice-rule></div>
    <div class=invoice-info>
      <div><small>BILL TO</small><b>${esc(o.customer)}</b>${c.email?`<span>${esc(c.email)}</span>`:""}${c.phone?`<span>${esc(c.phone)}</span>`:""}</div>
      <div><small>FROM</small><b>Améa</b>${s.email?`<span>${esc(s.email)}</span>`:""}${s.phone?`<span>${esc(s.phone)}</span>`:""}${s.instagram?`<span>${esc(s.instagram)}</span>`:""}</div>
    </div>
    <div class=invoice-line-head><span>ITEM</span><span>AMOUNT</span></div>
    <div class=invoice-line>
      <div><b>${esc(o.product)}</b><span>${esc([o.size&&"Size "+o.size,o.color&&o.color].filter(Boolean).join(" · "))}</span></div>
      <b>${M(o.price)}</b>
    </div>
    <div class=invoice-totals>
      <div><span>Total</span><b>${M(o.price)}</b></div>
      <div><span>Paid</span><b>${M(o.paid)}</b></div>
      <div class=invoice-balance><span>Balance</span><b>${M(balance)}</b></div>
    </div>
    <div class=invoice-meta>
      <div><small>PAYMENT METHOD</small><span>${esc(o.payment||"—")}</span></div>
      <div><small>FULFILMENT</small><span>${esc(o.delivery||"—")}</span></div>
      ${o.due?`<div><small>DUE DATE</small><span>${esc(o.due)}</span></div>`:""}
    </div>
    <p class=invoice-thanks>Thank you for choosing Améa ♡</p>
  </div>`;
}
function openInvoice(id){
  openF(`<h2>Invoice Preview</h2>${invoiceMarkup(id)}<div class=invoice-actions><button class=primary onclick="printInvoice('${id}')">Print / Save PDF</button><button onclick="shareInvoice('${id}')">Share Invoice Details</button></div><p class=meta>On iPhone/iPad, “Print / Save PDF” opens the print preview. Use the Share button there to save the PDF to Files or send it.</p>`);
}
function printInvoice(id){
  const body=invoiceMarkup(id,true);
  const w=window.open("","_blank");
  if(!w)return alert("Allow pop-ups for Améa HQ to print the invoice.");
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Améa Invoice</title><style>
  *{box-sizing:border-box}body{margin:0;background:#fff;color:#51283d;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.invoice-sheet{max-width:760px;margin:0 auto;padding:42px}.invoice-head{display:flex;justify-content:space-between;align-items:flex-start}.invoice-brand{font-family:Georgia,serif;font-size:48px;color:#f04e94;line-height:1}.invoice-sub{letter-spacing:4px;font-size:10px;margin-top:8px;color:#9a6a80}.invoice-number{text-align:right}.invoice-number b,.invoice-number span{display:block}.invoice-number span{color:#9a6a80;font-size:12px;margin-top:5px}.invoice-rule{height:1px;background:#f1d7e3;margin:26px 0}.invoice-info{display:grid;grid-template-columns:1fr 1fr;gap:35px}.invoice-info small,.invoice-meta small{display:block;color:#a76f88;font-size:9px;letter-spacing:1.5px;margin-bottom:7px}.invoice-info b,.invoice-info span{display:block;margin:3px 0}.invoice-info span{font-size:12px;color:#7e5b6b}.invoice-line-head,.invoice-line{display:grid;grid-template-columns:1fr auto;gap:20px}.invoice-line-head{margin-top:34px;padding:10px 0;border-bottom:1px solid #f1d7e3;color:#a76f88;font-size:9px;letter-spacing:1.3px}.invoice-line{padding:18px 0;border-bottom:1px solid #f1d7e3}.invoice-line span{display:block;color:#8c6677;font-size:12px;margin-top:5px}.invoice-totals{margin:24px 0 0 auto;max-width:300px}.invoice-totals>div{display:flex;justify-content:space-between;padding:7px 0}.invoice-balance{border-top:1px solid #f1d7e3;margin-top:6px;padding-top:13px!important;color:#e73984}.invoice-meta{display:grid;grid-template-columns:repeat(3,1fr);gap:15px;margin-top:35px;padding-top:20px;border-top:1px solid #f1d7e3}.invoice-meta span{font-size:12px}.invoice-thanks{text-align:center;margin-top:44px;color:#e64d90}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}.invoice-sheet{padding:20px}}</style></head><body>${body}<script>window.onload=()=>setTimeout(()=>window.print(),150)<\/script></body></html>`);
  w.document.close();
}
async function shareInvoice(id){
  const o=O().find(x=>x.id==id); if(!o)return;
  const bal=Math.max(0,(+o.price||0)-(+o.paid||0));
  const text=`Améa Invoice ${"INV-"+o.no}\nCustomer: ${o.customer}\n${o.product}${o.size?" · Size "+o.size:""}${o.color?" · "+o.color:""}\nTotal: ${M(o.price)}\nPaid: ${M(o.paid)}\nBalance: ${M(bal)}\n${o.delivery||""}`;
  if(navigator.share){try{await navigator.share({title:`Améa Invoice ${o.no}`,text});return}catch(e){if(e?.name==="AbortError")return}}
  alert(text);
}

function delOrder(id){let r=prompt("Reason for deleting this order?");if(!r)return;let d=G("deleted");d.push({...O().find(x=>x.id==id),deleteReason:r,deletedAt:new Date().toISOString()});S("deleted",d);S("orders",O().filter(x=>x.id!=id));dlg.close();render()}
function openCustomer(id){
  const c=C().find(x=>x.id===id); if(!c)return;
  const st=customerStats(c);
  const outstanding=st.orders.reduce((sum,o)=>sum+Math.max(0,(+o.price||0)-(+o.paid||0)),0);
  const last=st.last?st.last.toLocaleDateString("en-JM",{day:"numeric",month:"short",year:"numeric"}):"—";
  const history=st.orders.length?st.orders.map(o=>{
    const d=o.created?new Date(o.created).toLocaleDateString("en-JM",{day:"numeric",month:"short",year:"numeric"}):"";
    return `<button class=customer-order-row onclick="editOrder('${o.id}')">
      <div><b>${esc(o.no)} · ${esc(o.product)}</b><span>${esc([o.size&&"Size "+o.size,o.color].filter(Boolean).join(" · "))}</span></div>
      <div><b>${M(o.price)}</b><span>${d}</span></div>
    </button>`;
  }).join(""):'<div class=empty>No orders yet.</div>';

  openF(`<div class=customer-profile>
    <div class=top>
      <div><h2>${esc(c.name)}</h2><div class="customer-badge ${st.orders.length?"returning":"new"}">${st.orders.length?"RETURNING CUSTOMER":"NEW CUSTOMER"}</div></div>
      <button class=profile-edit onclick="newCustomer('${c.id}')">Edit</button>
    </div>

    <div class=customer-stats>
      <div><span>Orders</span><b>${st.orders.length}</b></div>
      <div><span>Lifetime paid</span><b>${M(st.paid)}</b></div>
      <div><span>Outstanding</span><b>${M(outstanding)}</b></div>
      <div><span>Last order</span><b>${last}</b></div>
    </div>

    <div class=profile-section>
      <h3>Customer info</h3>
      <div class=profile-info>
        <div><span>Phone</span><b>${esc(c.phone||"—")}</b></div>
        <div><span>Email</span><b>${esc(c.email||"—")}</b></div>
        <div><span>Instagram</span><b>${esc(c.instagram||"—")}</b></div>
        <div><span>Ordered via</span><b>${st.sources.length?st.sources.map(esc).join(", "):"—"}</b></div>
      </div>
    </div>

    <div class=profile-section>
      <h3>Measurements</h3>
      <div class=profile-note>${c.measurements?esc(c.measurements):"No measurements saved."}</div>
    </div>

    <div class=profile-section>
      <h3>Private notes</h3>
      <div class=profile-note>${c.notes?esc(c.notes):"No private notes."}</div>
    </div>

    <div class=profile-section>
      <h3>Order history</h3>
      <div class=customer-order-history>${history}</div>
    </div>

    <button class=danger onclick="deleteCustomer('${c.id}')">Delete Customer</button>
  </div>`)
}

function newCustomer(id=""){
  const c=id?C().find(x=>x.id===id):{};
  openF(`<h2>${id?"Edit":"Add"} Customer</h2>
    <label>Name</label><input id=cn value="${esc(c?.name||"")}">
    <label>Phone</label><input id=cp value="${esc(c?.phone||"")}">
    <label>Email</label><input id=ce type=email value="${esc(c?.email||"")}">
    <label>Instagram</label><input id=ci value="${esc(c?.instagram||"")}">
    <label>Measurements</label><textarea id=cm>${esc(c?.measurements||"")}</textarea>
    <label>Private notes</label><textarea id=cno>${esc(c?.notes||"")}</textarea>
    <button class=primary onclick="saveCustomer('${id}')">${id?"Save Changes":"Save Customer"}</button>
    ${id?`<button class=secondary-btn onclick="openCustomer('${id}')">Cancel</button>`:""}
  `)
}

function saveCustomer(id=""){
  const name=cn.value.trim();
  if(!name)return alert("Add the customer's name.");
  let a=C(),old=id?a.find(x=>x.id===id):null;
  const updated={
    id:id||crypto.randomUUID(),
    name,
    phone:cp.value.trim(),
    email:ce.value.trim(),
    instagram:ci.value.trim(),
    measurements:cm.value.trim(),
    notes:cno.value.trim()
  };
  a=id?a.map(x=>x.id===id?updated:x):[...a,updated];
  S("customers",a);

  // Keep existing order names in sync if the customer's name changes.
  if(id&&old&&old.name!==name){
    S("orders",O().map(o=>o.customerId===id?{...o,customer:name}:o));
  }

  dlg.close();
  render();
}

function deleteCustomer(id){
  const c=C().find(x=>x.id===id); if(!c)return;
  const orders=ordersForCustomer(c);
  const message=orders.length
    ? `${c.name} has ${orders.length} saved order${orders.length===1?"":"s"}. The orders will stay in Améa HQ, but this customer profile and contact details will be deleted. Delete customer?`
    : `Delete ${c.name}?`;
  if(!confirm(message))return;
  S("customers",C().filter(x=>x.id!==id));
  dlg.close();
  render();
}
function newExpense(){let suppliers=SUP();openF(`<h2>Add Expense</h2><label>Category</label><select id=ec>${["Yarn/materials","Packaging","Ads","Delivery","Equipment","Other"].map(x=>`<option>${x}</option>`)}</select><label>Supplier</label><input id=es list=supplierList placeholder="Where did you buy it?"><datalist id=supplierList>${suppliers.map(x=>`<option value="${x.name}">`).join("")}</datalist><label>Amount</label><input id=ea type=number><label>Date</label><input id=ed type=date value="${new Date().toISOString().slice(0,10)}"><label>Note</label><input id=en><button class=primary onclick=saveExpense()>Save</button>`)}
function saveExpense(){let a=E(),supplier=es.value.trim();a.push({id:crypto.randomUUID(),category:ec.value,supplier,amount:+ea.value||0,date:ed.value,note:en.value});S("expenses",a);if(supplier&&!SUP().some(x=>x.name.toLowerCase()==supplier.toLowerCase())){let s=SUP();s.push({id:crypto.randomUUID(),name:supplier});S("suppliers",s)}dlg.close();render()}
function manageSuppliers(){let s=SUP();openF(`<div class=top><h2>Suppliers</h2><button onclick=addSupplier()>＋ Add</button></div><div id=supplierRows>${s.map(x=>`<div class=item><div class=top><b>${x.name}</b><button class=mini-danger onclick="deleteSupplier('${x.id}')">Remove</button></div></div>`).join("")||'<div class=empty>No suppliers saved yet.</div>'}</div>`)}
function addSupplier(){let name=prompt("Supplier name");if(!name||!name.trim())return;let s=SUP();if(!s.some(x=>x.name.toLowerCase()==name.trim().toLowerCase())){s.push({id:crypto.randomUUID(),name:name.trim()});S("suppliers",s)}manageSuppliers()}
function deleteSupplier(id){S("suppliers",SUP().filter(x=>x.id!=id));manageSuppliers()}
function newInventory(){openF(`<h2>Add Inventory</h2><label>Item</label><input id=ii><label>Type</label><select id=it><option>Material</option><option>Packaging</option><option>Finished product</option></select><label>Quantity</label><input id=iq type=number><label>Low stock alert at</label><input id=il type=number value=2><button class=primary onclick=saveInventory()>Save</button>`)}function saveInventory(){let a=I();a.push({id:crypto.randomUUID(),name:ii.value,type:it.value,qty:+iq.value||0,low:+il.value||2});S("inventory",a);dlg.close();render()}

function analyticsMonthKey(dateString){
  if(!dateString)return "";
  if(/^\d{4}-\d{2}-\d{2}$/.test(dateString))return dateString.slice(0,7);
  const d=new Date(dateString);
  if(Number.isNaN(d.getTime()))return "";
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
}
function currentMonthKey(){
  const d=new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
}
function monthLabel(key){
  if(!/^\d{4}-\d{2}$/.test(key))return "Selected month";
  const [y,m]=key.split("-").map(Number);
  return new Date(y,m-1,1).toLocaleDateString("en-JM",{month:"long",year:"numeric"});
}
function renderAnalytics(range="month",selectedMonth=currentMonthKey()){
  const now=new Date();
  const monthKey=selectedMonth||currentMonthKey();
  const inRange=dateString=>{
    if(!dateString)return false;
    if(range=="all")return true;
    if(range=="month")return analyticsMonthKey(dateString)==monthKey;
    const d=new Date(dateString);
    return !Number.isNaN(d.getTime())&&d.getFullYear()==now.getFullYear();
  };
  const orders=O().filter(x=>inRange(x.created));
  const expenses=E().filter(x=>inRange(x.date));
  const sales=orders.reduce((a,x)=>a+(+x.paid||0),0);
  const ex=expenses.reduce((a,x)=>a+(+x.amount||0),0);
  const outstanding=orders.reduce((a,x)=>a+Math.max(0,(+x.price||0)-(+x.paid||0)),0);
  const sourceCounts={};
  orders.forEach(x=>{let s=x.source||"Not set";sourceCounts[s]=(sourceCounts[s]||0)+1});
  const topSources=Object.entries(sourceCounts).sort((a,b)=>b[1]-a[1]).slice(0,5);
  const title=range=="month"?monthLabel(monthKey):range=="year"?String(now.getFullYear()):"All Time";
  $("#view").innerHTML=`<h2>Analytics</h2>
  <div class=analytics-picker>
    <label>Choose a month</label>
    <input id=analyticsMonth type=month value="${monthKey}" onchange="renderAnalytics('month',this.value)">
  </div>
  <div class=segmented>
    <button class="${range=="month"&&monthKey==currentMonthKey()?"active":""}" onclick="renderAnalytics('month',currentMonthKey())">This Month</button>
    <button class="${range=="year"?"active":""}" onclick="renderAnalytics('year','${monthKey}')">This Year</button>
    <button class="${range=="all"?"active":""}" onclick="renderAnalytics('all','${monthKey}')">All Time</button>
  </div>
  <div class=analytics-period>Viewing <b>${title}</b></div>
  <div class=grid>
    <div class=card>Payments<b>${M(sales)}</b></div>
    <div class=card>Expenses<b>${M(ex)}</b></div>
    <div class=card>Est. Profit<b>${M(sales-ex)}</b></div>
    <div class=card>Orders<b>${orders.length}</b></div>
    <div class=card>Outstanding<b>${M(outstanding)}</b></div>
  </div>
  <div class=section><h3>Where orders came from</h3>
    ${topSources.length?topSources.map(([name,count])=>`<div class=item><div class=top><b>${name}</b><span>${count} order${count==1?"":"s"}</span></div></div>`).join(""):'<div class=empty>No order-source data for this period yet.</div>'}
  </div>`;
}

function saveSettings(){S("settings",{email:se.value,phone:sp.value,instagram:si.value,delivery:sd.value.split(",").map(x=>x.trim()).filter(Boolean)});alert("Saved 💗")}
function notify(){Notification.requestPermission().then(x=>alert(x=="granted"?"Notifications allowed 💗":"Notifications not enabled."))}
function dl(n,d,t){let a=document.createElement("a");a.href=URL.createObjectURL(new Blob([d],{type:t}));a.download=n;a.click()}function backup(){dl("amea-hq-backup.json",JSON.stringify({orders:O(),customers:C(),items:ITEMS(),inventory:I(),expenses:E(),suppliers:SUP(),settings:G("settings",{}),deleted:G("deleted")},null,2),"application/json")}
function ics(){let a=["BEGIN:VCALENDAR","VERSION:2.0"];O().filter(x=>x.due).forEach(x=>a.push("BEGIN:VEVENT",`UID:${x.id}@ameahq`,`DTSTART;VALUE=DATE:${x.due.replaceAll("-","")}`,`SUMMARY:${x.no} - ${x.customer} - ${x.product}`,"END:VEVENT"));a.push("END:VCALENDAR");dl("amea-orders.ics",a.join("\r\n"),"text/calendar")}
if("serviceWorker"in navigator)navigator.serviceWorker.register("sw.js").catch(()=>{});
window.addEventListener("DOMContentLoaded",startHQ);
