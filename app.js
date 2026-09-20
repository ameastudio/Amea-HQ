const $=s=>document.querySelector(s);
const G=(k,d=[])=>{try{return JSON.parse(localStorage.getItem("ah_"+k)||JSON.stringify(d))}catch(e){return d}};
let cloudReady=false,cloudQueue=Promise.resolve();
function S(k,v){
  localStorage.setItem("ah_"+k,JSON.stringify(v));
  if(cloudReady)queueCloudSync(k,v);
}
let cur="home";const O=()=>G("orders"),C=()=>G("customers"),I=()=>G("inventory"),E=()=>G("expenses"),SUP=()=>G("suppliers"),ITEMS=()=>G("items");const M=n=>new Intl.NumberFormat("en-JM",{style:"currency",currency:"JMD",maximumFractionDigits:0}).format(+n||0);
function jamaicaHour(){
  try{
    const parts=new Intl.DateTimeFormat("en-US",{timeZone:"America/Jamaica",hour:"2-digit",hour12:false}).formatToParts(new Date());
    const raw=Number(parts.find(p=>p.type==="hour")?.value);
    return raw===24?0:raw;
  }catch(e){
    return new Date().getHours();
  }
}
function greeting(){
  const h=jamaicaHour();
  return h<5?"Good night":h<12?"Good morning":h<17?"Good afternoon":h<21?"Good evening":"Good night";
}
function refreshHomeGreeting(){
  const el=$("#homeGreeting");
  if(el)el.textContent=`${greeting()}, Améa Boss ✨`;
}

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
    await enterHQ();
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
    if(data?.session)await enterHQ();
    else showAuth();
    cloud.auth.onAuthStateChange((event,session)=>{
      if(event==="SIGNED_OUT"){cloudReady=false;showAuth()}
    });
  }catch(err){
    console.error("Améa HQ cloud start error",err);
    showAuth("Could not connect to Améa HQ cloud. Check your internet and reload.");
  }
}


const CLOUD_COLLECTIONS=["customers","items","suppliers","inventory","expenses","orders"];

function setCloudStatus(text,state="ok"){
  localStorage.setItem("ah_cloud_status",text);
  localStorage.setItem("ah_cloud_state",state);
  localStorage.setItem("ah_cloud_last",new Date().toISOString());
}

async function syncNow(){
  const btn=$("#syncNowBtn");
  if(btn){btn.disabled=true;btn.textContent="Syncing…"}
  try{
    cloudReady=false;
    await initialCloudSync();
    cloudReady=true;
    setCloudStatus("Synced ✓","ok");
    page("more");
  }catch(err){
    console.error("Manual cloud sync error",err);
    cloudReady=false;
    setCloudStatus("Sync issue","error");
    page("more");
  }
}

function localToRemote(kind,x){
  if(kind==="customers")return {
    id:x.id,name:x.name,phone:x.phone||null,email:x.email||null,
    instagram:x.instagram||null,measurements:x.measurements||null,notes:x.notes||null
  };
  if(kind==="items")return {
    id:x.id,name:x.name,category:x.category||null,price:+x.price||0,
    sizes:x.sizes||null,item_type:x.status||"Made to order",
    photo_url:x.photo||null,notes:x.notes||null,active:true
  };
  if(kind==="orders")return {
    id:x.id,order_number:x.no,customer_id:x.customerId||null,item_id:x.itemId||null,
    customer_name:x.customer||"",product_name:x.product||"",size:x.size||null,
    color:x.color||null,price:+x.price||0,paid:+x.paid||0,source:x.source||null,
    due_date:x.due||null,payment_method:x.payment||null,delivery_method:x.delivery||null,
    status:x.status||"New",notes:x.notes||null,edit_history:x.history||[],
    order_type:x.orderType||"Made to Order",
    custom_details:x.customDetails||null,
    inspiration_photos:Array.isArray(x.inspirationPhotos)?x.inspirationPhotos:[],
    created_at:x.created||new Date().toISOString()
  };
  if(kind==="expenses")return {
    id:x.id,category:x.category||null,description:x.supplier||null,
    amount:+x.amount||0,expense_date:x.date||new Date().toISOString().slice(0,10),
    notes:x.note||null
  };
  if(kind==="inventory")return {
    id:x.id,name:x.name,inventory_type:x.type||null,quantity:+x.qty||0,
    low_stock_level:+x.low||0,unit:x.unit||null,notes:x.notes||null
  };
  if(kind==="suppliers")return {
    id:x.id,name:x.name,phone:x.phone||null,email:x.email||null,
    website:x.website||null,instagram:x.instagram||null,notes:x.notes||null
  };
  return x;
}

function remoteToLocal(kind,x){
  if(kind==="customers")return {
    id:x.id,name:x.name,phone:x.phone||"",email:x.email||"",
    instagram:x.instagram||"",measurements:x.measurements||"",notes:x.notes||""
  };
  if(kind==="items")return {
    id:x.id,name:x.name,category:x.category||"Other",price:+x.price||0,
    sizes:x.sizes||"",status:x.item_type||"Made to order",
    photo:x.photo_url||"",notes:x.notes||""
  };
  if(kind==="orders")return {
    id:x.id,no:x.order_number,customerId:x.customer_id||"",itemId:x.item_id||"",
    customer:x.customer_name||"",product:x.product_name||"",size:x.size||"",
    color:x.color||"",price:+x.price||0,paid:+x.paid||0,source:x.source||"Not set",
    due:x.due_date||"",payment:x.payment_method||"",delivery:x.delivery_method||"",
    status:x.status||"New",notes:x.notes||"",history:Array.isArray(x.edit_history)?x.edit_history:[],
    orderType:x.order_type||"Made to Order",
    customDetails:x.custom_details||"",
    inspirationPhotos:Array.isArray(x.inspiration_photos)?x.inspiration_photos:[],
    created:x.created_at
  };
  if(kind==="expenses")return {
    id:x.id,category:x.category||"Other",supplier:x.description||"",
    amount:+x.amount||0,date:x.expense_date||"",note:x.notes||""
  };
  if(kind==="inventory")return {
    id:x.id,name:x.name,type:x.inventory_type||"Material",qty:+x.quantity||0,
    low:+x.low_stock_level||0,unit:x.unit||"",notes:x.notes||""
  };
  if(kind==="suppliers")return {
    id:x.id,name:x.name,phone:x.phone||"",email:x.email||"",
    website:x.website||"",instagram:x.instagram||"",notes:x.notes||""
  };
  return x;
}

async function remoteRows(kind){
  const {data,error}=await cloud.from(kind).select("*");
  if(error)throw error;
  return data||[];
}

async function upsertCollection(kind,rows){
  if(!rows.length)return;
  const payload=rows.map(x=>localToRemote(kind,x));
  const {error}=await cloud.from(kind).upsert(payload,{onConflict:"id"});
  if(error)throw error;
}

async function syncSettingsInitial(){
  const local=G("settings",{});
  const {data:{user}}=await cloud.auth.getUser();
  if(!user)throw new Error("No signed-in user.");

  const {data,error}=await cloud.from("business_settings").select("*").maybeSingle();
  if(error)throw error;

  if(data){
    localStorage.setItem("ah_settings",JSON.stringify({
      businessName:data.business_name||"Améa",
      email:data.business_email||"",
      phone:data.phone||"",
      website:data.website||"",
      instagram:data.instagram||"",
      address:data.address||"",
      invoiceNote:data.invoice_note||"Thank you for choosing Améa ♡",
      delivery:Array.isArray(data.delivery_methods)?data.delivery_methods:["Pickup","Delivery"]
    }));
  }else{
    const row={
      owner_id:user.id,
      business_name:local.businessName||"Améa",
      currency:"JMD",
      business_email:local.email||null,
      phone:local.phone||null,
      website:local.website||null,
      instagram:local.instagram||null,
      address:local.address||null,
      invoice_note:local.invoiceNote||"Thank you for choosing Améa ♡",
      delivery_methods:Array.isArray(local.delivery)?local.delivery:["Pickup","Delivery"]
    };
    const {error:insertError}=await cloud.from("business_settings").upsert(row,{onConflict:"owner_id"});
    if(insertError)throw insertError;
  }
}

async function initialCloudSync(){
  // Cloud is authoritative once it contains rows.
  // If a table is empty, existing phone/browser data is uploaded automatically
  // so the user does not lose the HQ records already entered.
  for(const kind of CLOUD_COLLECTIONS){
    const remote=await remoteRows(kind);
    const local=G(kind,[]);
    if(remote.length){
      localStorage.setItem("ah_"+kind,JSON.stringify(remote.map(x=>remoteToLocal(kind,x))));
    }else if(local.length){
      await upsertCollection(kind,local);
    }
  }
  await syncSettingsInitial();
  setCloudStatus("Synced ✓","ok");
}

async function pushSettingsToCloud(v){
  const {data:{user}}=await cloud.auth.getUser();
  if(!user)return;
  const row={
    owner_id:user.id,
    business_name:v.businessName||"Améa",
    currency:"JMD",
    business_email:v.email||null,
    phone:v.phone||null,
    website:v.website||null,
    instagram:v.instagram||null,
    address:v.address||null,
    invoice_note:v.invoiceNote||"Thank you for choosing Améa ♡",
    delivery_methods:Array.isArray(v.delivery)?v.delivery:["Pickup","Delivery"]
  };
  const {error}=await cloud.from("business_settings").upsert(row,{onConflict:"owner_id"});
  if(error)throw error;
}

async function pushCollectionToCloud(kind,v){
  if(!cloudReady||!cloud)return;
  if(kind==="settings")return pushSettingsToCloud(v);
  if(!CLOUD_COLLECTIONS.includes(kind))return;
  await upsertCollection(kind,Array.isArray(v)?v:[]);
}

function queueCloudSync(kind,v){
  const snapshot=JSON.parse(JSON.stringify(v));
  cloudQueue=cloudQueue
    .then(()=>pushCollectionToCloud(kind,snapshot))
    .then(()=>setCloudStatus("Synced ✓","ok"))
    .catch(err=>{
      console.error("Améa HQ cloud sync error",err);
      setCloudStatus("Sync issue","error");
    });
}

async function deleteCloudRow(table,id){
  if(!cloudReady||!cloud)return;
  const {error}=await cloud.from(table).delete().eq("id",id);
  if(error){
    console.error("Cloud delete error",error);
    setCloudStatus("Sync issue","error");
  }else setCloudStatus("Synced ✓","ok");
}

async function enterHQ(){
  showHQ();
  const view=$("#view");
  if(view)view.innerHTML=`<div class="cloud-loading"><div class="cloud-spinner"></div><h2>Opening Améa HQ…</h2><div class="meta">Syncing your business data securely.</div></div>`;
  try{
    cloudReady=false;
    await initialCloudSync();
    cloudReady=true;
    page("home");
  }catch(err){
    console.error("Initial Améa HQ sync error",err);
    cloudReady=false;
    setCloudStatus("Using device data","error");
    page("home");
    setTimeout(()=>alert("Améa HQ opened, but cloud sync could not finish. Your device data is still here. Check your internet and try again."),50);
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

let homeAnalyticsMode="months";

function startOfWeek(date){
  const d=new Date(date);
  d.setHours(0,0,0,0);
  const day=d.getDay();
  const diff=(day===0?-6:1-day);
  d.setDate(d.getDate()+diff);
  return d;
}
function homeMonthActivity(){
  const now=new Date(),orders=O(),rows=[];
  for(let offset=5;offset>=0;offset--){
    const d=new Date(now.getFullYear(),now.getMonth()-offset,1);
    const y=d.getFullYear(),m=d.getMonth();
    const count=orders.filter(o=>{
      const od=new Date(o.created);
      return !Number.isNaN(od.getTime())&&od.getFullYear()===y&&od.getMonth()===m;
    }).length;
    rows.push({
      label:d.toLocaleDateString("en-JM",{month:"short"}),
      full:d.toLocaleDateString("en-JM",{month:"long",year:"numeric"}),
      count
    });
  }
  return rows;
}
function homeWeekActivity(){
  const current=startOfWeek(new Date()),orders=O(),rows=[];
  for(let offset=5;offset>=0;offset--){
    const start=new Date(current);
    start.setDate(start.getDate()-(offset*7));
    const end=new Date(start);
    end.setDate(end.getDate()+7);
    const count=orders.filter(o=>{
      const od=new Date(o.created);
      return !Number.isNaN(od.getTime())&&od>=start&&od<end;
    }).length;
    rows.push({
      label:start.toLocaleDateString("en-JM",{month:"short",day:"numeric"}),
      full:"Week of "+start.toLocaleDateString("en-JM",{month:"short",day:"numeric",year:"numeric"}),
      count
    });
  }
  return rows;
}
function homeActivityMarkup(mode=homeAnalyticsMode){
  const rows=mode==="weeks"?homeWeekActivity():homeMonthActivity();
  const max=Math.max(1,...rows.map(x=>x.count));
  const best=rows.reduce((a,b)=>b.count>a.count?b:a,rows[0]);
  const total=rows.reduce((sum,x)=>sum+x.count,0);
  return `<div class=activity-summary>${total?`Best period: <b>${esc(best.full)} · ${best.count} order${best.count===1?"":"s"}</b>`:"No orders in these periods yet."}</div>
    <div class=activity-chart>
      ${rows.map(x=>`<div class=activity-col title="${esc(x.full)}">
        <span class=activity-count>${x.count}</span>
        <div class=activity-track><div class=activity-bar style="height:${x.count?Math.max(12,Math.round((x.count/max)*100)):4}%"></div></div>
        <span class=activity-label>${esc(x.label)}</span>
      </div>`).join("")}
    </div>`;
}
function setHomeAnalytics(mode){
  homeAnalyticsMode=mode==="weeks"?"weeks":"months";
  document.querySelectorAll("[data-home-analytics]").forEach(btn=>btn.classList.toggle("active",btn.dataset.homeAnalytics===homeAnalyticsMode));
  const box=$("#homeAnalytics");
  if(box)box.innerHTML=homeActivityMarkup(homeAnalyticsMode);
}

function page(x){cur=x;render()}function render(){document.querySelectorAll("nav button").forEach(b=>b.classList.toggle("active",b.dataset.page===cur));let v=$("#view");if(cur=="home"){let o=O(),e=E(),now=new Date(),mo=o.filter(x=>new Date(x.created).getMonth()==now.getMonth()),sales=mo.reduce((a,x)=>a+x.paid,0),out=mo.reduce((a,x)=>a+Math.max(0,x.price-x.paid),0),ex=e.filter(x=>new Date(x.date).getMonth()==now.getMonth()).reduce((a,x)=>a+x.amount,0),today=new Date().toISOString().slice(0,10);v.innerHTML=`<div class=hero><h2 id=homeGreeting>${greeting()}, Améa Boss ✨</h2><div class=meta>Everything in your studio, in one pretty place.</div></div><div class=grid><div class=card>Sales<b>${M(sales)}</b></div><div class=card>Orders<b>${mo.length}</b></div><div class=card>Outstanding<b>${M(out)}</b></div><div class=card>Expenses<b>${M(ex)}</b></div></div><div class=section><h3>Today</h3><div class=card>${list(O().filter(x=>x.due==today),true)||'<div class=meta>No orders due today 💗</div>'}</div></div><div class="section home-analytics-section"><div class=analytics-home-head><div><h3>Order Activity</h3><div class=meta>See which weeks or months bring in the most orders.</div></div><div class=analytics-home-toggle><button data-home-analytics=months class="${homeAnalyticsMode==="months"?"active":""}" onclick="setHomeAnalytics('months')">Months</button><button data-home-analytics=weeks class="${homeAnalyticsMode==="weeks"?"active":""}" onclick="setHomeAnalytics('weeks')">Weeks</button></div></div><div id=homeAnalytics>${homeActivityMarkup(homeAnalyticsMode)}</div></div><div class=section><h3>Recent Orders</h3>${list(O().slice(-5).reverse())||'<div class=empty>No orders yet.</div>'}</div>`}
else if(cur=="orders")v.innerHTML=`<h2>Orders</h2><input placeholder="Search orders, customers, products…" oninput="searchO(this.value)"><div id=ol>${list(O().slice().reverse())||'<div class=empty>No orders yet.</div>'}</div>`;
else if(cur=="customers")v.innerHTML=`<div class=top><h2>Customers</h2><button onclick=newCustomer()>＋ Add</button></div>${C().map(x=>{let st=customerStats(x),last=st.last?st.last.toLocaleDateString("en-JM",{day:"numeric",month:"short",year:"numeric"}):"";return `<div class="item customer-row" onclick="openCustomer('${x.id}')"><div class=top><b>${esc(x.name)}</b><span class="customer-badge ${st.orders.length?"returning":"new"}">${st.orders.length?"RETURNING":"NEW"}</span></div><div class=meta>${esc(x.phone||"")}${x.email?" · "+esc(x.email):""}<br><b>${customerStatusText(x)}</b>${st.orders.length?` · ${M(st.paid)} lifetime`:""}${last?`<br>Last order: ${last}`:""}</div><div class=customer-chevron>View customer →</div></div>`}).join("")||'<div class=empty>No customers yet.</div>'}`;
else if(cur=="invoices"){
  const orders=O().slice().reverse();
  v.innerHTML=`<div class=top><div><h2>Invoices</h2><div class=meta>Invoices are created from your saved orders.</div></div></div>
  ${orders.length?orders.map(o=>{
    const bal=Math.max(0,(+o.price||0)-(+o.paid||0));
    return `<div class=item>
      <div class=top><b>${esc("INV-"+o.no)}</b><span class="badge invoice-status ${bal>0?"due":"paid"}">${bal>0?"Balance due":"Paid"}</span></div>
      <div class=meta>${esc(o.customer||"")} · ${esc(o.product||"")}<br>Total: ${M(o.price)} · <span class=invoice-paid-text>Paid: ${M(o.paid)}</span> · <span class=invoice-due-text>Balance: ${M(bal)}</span></div>
      <button class=invoice-list-btn onclick="openInvoice('${o.id}')">Open Invoice</button>
    </div>`
  }).join(""):'<div class=empty>No invoices yet. Create an order first.</div>'}`;
}

else if(cur=="items")v.innerHTML=`<div class=top><div><h2>Items</h2><div class=meta>Products you sell — separate from materials inventory.</div></div><button onclick=newItem()>＋ Add</button></div><div class=item-catalog>${ITEMS().map(x=>`<div class=item-card onclick="newItem('${x.id}')">${x.photo?`<img src="${x.photo}" alt="${esc(x.name)}">`:`<div class=item-photo-placeholder>AMÉA</div>`}<div class=item-card-body><b>${esc(x.name)}</b><div class=meta>${esc(x.category||"Other")} · ${M(x.price)}</div><div class=meta>${x.status=="Ready-made"?"Ready-made":"Made to order"}${x.sizes?` · ${esc(x.sizes)}`:""}</div></div></div>`).join("")||'<div class=empty>No items yet. Add your first product so orders can select from a list.</div>'}</div>`;
else if(cur=="inventory")v.innerHTML=`<div class=top><h2>Inventory</h2><button onclick=newInventory()>＋ Add</button></div>${I().map(x=>`<div class=item><div class=top><b>${x.name}</b><span class=${x.qty<=x.low?"money":""}>${x.qty}</span></div><div class=meta>${x.type}${x.qty<=x.low?" · LOW STOCK":""}</div></div>`).join("")||'<div class=empty>No inventory yet.</div>'}`;
else if(cur=="more"){
  let cs=localStorage.getItem("ah_cloud_status")||"Connected";
  let state=localStorage.getItem("ah_cloud_state")||"ok";
  let last=localStorage.getItem("ah_cloud_last");
  let when=last?new Date(last).toLocaleString("en-JM",{dateStyle:"medium",timeStyle:"short"}):"Not synced yet";
  v.innerHTML=`<h2>More</h2>
  <div class=quick>
    <button onclick="page('items')">♢ Items</button>
    <button onclick="page('inventory')">▦ Inventory</button>
    <button onclick="page('expenses')">↘ Expenses</button>
    <button onclick="page('analytics')">▥ Analytics</button>
    <button onclick="page('calendar')">♡ Calendar</button>
    <button onclick="page('settings')">⚙ Settings</button>
  </div>

  <div class="section">
    <div class="card backup-card">
      <div class="backup-head">
        <div>
          <span class="backup-eyebrow">AMÉA CLOUD</span>
          <h3>Cloud Backup</h3>
        </div>
        <span class="sync-pill ${state==="error"?"error":"ok"}">${esc(cs)}</span>
      </div>

      <div class="backup-row">
        <span>Last backup</span>
        <b>${esc(when)}</b>
      </div>

      <div class="backup-note">
        Your customers, orders, items, inventory, expenses, suppliers and business settings are stored in your private Améa cloud account.
      </div>
<button id="syncNowBtn" class="primary backup-sync" onclick="syncNow()">Sync Now</button>
      <button class="signout-btn backup-signout" onclick="logoutHQ()">Sign Out</button>
    </div>
  </div>`;
}
else if(cur=="expenses")v.innerHTML=`<div class=top><h2>Expenses</h2><div class=top-actions><button onclick=manageSuppliers()>Suppliers</button><button onclick=newExpense()>＋ Add</button></div></div>${E().slice().reverse().map(x=>`<div class=item><div class=top><b>${x.category}</b><span class=money>${M(x.amount)}</span></div><div class=meta>${x.date}${x.supplier?" · Supplier: "+x.supplier:""}${x.note?" · "+x.note:""}</div></div>`).join("")||'<div class=empty>No expenses yet.</div>'}`;
else if(cur=="analytics"){renderAnalytics("month")}
else if(cur=="calendar")v.innerHTML=`<div class=top><h2>Calendar</h2><button onclick=ics()>Add .ics</button></div>${O().filter(x=>x.due).sort((a,b)=>a.due.localeCompare(b.due)).map(x=>`<div class=item><b>${x.due}</b><div class=meta>${x.no} · ${x.customer} · ${x.product} · ${x.delivery}</div></div>`).join("")||'<div class=empty>No due dates yet.</div>'}`;
else if(cur=="settings"){
  let s=G("settings",{});
  v.innerHTML=`<h2>Settings</h2>

  <div class="card settings-card">
    <div class=settings-title>
      <div>
        <b>Business & Invoice Info</b>
        <span>These details automatically appear on your invoices.</span>
      </div>
    </div>

    <label>Business name</label>
    <input id=sbn value="${esc(s.businessName||"Améa")}" placeholder="Améa">

    <label>Business email</label>
    <input id=se type=email value="${esc(s.email||"")}" placeholder="Add when ready">

    <label>Phone / WhatsApp</label>
    <input id=sp value="${esc(s.phone||"")}" placeholder="Add when ready">

    <label>Website</label>
    <input id=sw value="${esc(s.website||"")}" placeholder="Add later">

    <label>Instagram</label>
    <input id=si value="${esc(s.instagram||"")}" placeholder="@ameastudio">

    <label>Business address <span class=meta>(optional)</span></label>
    <textarea id=sa placeholder="Leave blank if you don't want an address on invoices">${esc(s.address||"")}</textarea>

    <label>Invoice closing message</label>
    <input id=sin value="${esc(s.invoiceNote||"Thank you for choosing Améa ♡")}" placeholder="Thank you for choosing Améa ♡">

    <label>Delivery options</label>
    <input id=sd value="${esc((s.delivery||["Pickup","Delivery"]).join(", "))}">

    <button class=primary onclick=saveSettings()>Save Business Info</button>
  </div>

  <div class="section quick">
    <button onclick=notify()>Allow Notifications</button>
    <button onclick=backup()>Export Backup</button>
  </div>
  <p class=meta>Your HQ data is synced to your private cloud account. Device storage is kept as a local copy too.</p>`
}}
function list(a){return a.map(x=>`<div class=item onclick="editOrder('${x.id}')"><div class=top><b>${x.no} · ${x.customer}</b><span class=badge>${x.status}</span></div><div class=meta>${x.orderType==="Custom"?'<span class="custom-order-tag">CUSTOM</span> ':""}${esc(x.product)} · ${esc(x.size||"—")} · ${esc(x.color||"—")}<br>Placed via: ${esc(x.source||"Not set")} · Payment: ${esc(x.payment||"—")} · Delivery: ${esc(x.delivery||"—")}<br>Due: ${esc(x.due||"—")}</div><div class=money>${M(x.paid)} paid · ${M(Math.max(0,x.price-x.paid))} balance</div></div>`).join("")}
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
  if(confirm("Delete this item?")){S("items",ITEMS().filter(x=>x.id!==id));deleteCloudRow("items",id);dlg.close();page("items")}
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

let draftInspoPhotos=[];
let activeOrderBase={};
let pendingOrderReturn=null;

function captureOrderDraft(){
  const base={...activeOrderBase};
  const type=$("#otype")?.value||base.orderType||"Made to Order";
  const itemId=$("#op")?.value||base.itemId||"";
  const selectedItem=itemById(itemId);
  return {
    ...base,
    customerId:$("#oc")?.value||base.customerId||"",
    itemId,
    product:type==="Custom"?($("#customTitle")?.value.trim()||base.product||""):(selectedItem?.name||base.product||""),
    orderType:type,
    customDetails:$("#customDetails")?.value||base.customDetails||"",
    inspirationPhotos:[...draftInspoPhotos],
    size:$("#os")?.value||"",
    color:$("#ocol")?.value||"",
    price:+($("#opr")?.value||0),
    paid:+($("#opa")?.value||0),
    source:$("#osrc")?.value||"Not set",
    due:$("#od")?.value||"",
    payment:$("#opay")?.value||"",
    delivery:$("#odel")?.value||"",
    status:$("#ost")?.value||"New",
    notes:$("#on")?.value||"",
    _reason:$("#reason")?.value||""
  };
}
function addCustomerFromOrder(){
  pendingOrderReturn=captureOrderDraft();
  newCustomer("",true);
}
function returnToOrderFromCustomer(){
  const draft=pendingOrderReturn;
  pendingOrderReturn=null;
  if(draft)newOrder(draft);
  else{dlg.close();render()}
}


function toggleCustomOrder(){
  const isCustom=$("#otype")?.value==="Custom";
  const regular=$("#regularOrderFields"),custom=$("#customOrderFields");
  if(regular)regular.style.display=isCustom?"none":"block";
  if(custom)custom.style.display=isCustom?"block":"none";
  renderInspoPreviews();
}

function renderInspoPreviews(){
  const box=$("#inspoPreview");
  if(!box)return;
  box.innerHTML=draftInspoPhotos.length
    ? draftInspoPhotos.map((src,i)=>`<div class=inspo-thumb><img src="${src}" alt="Inspiration ${i+1}"><button type=button onclick="removeInspoPhoto(${i})">×</button></div>`).join("")
    : '<div class="meta inspo-empty">No inspiration photos added yet.</div>';
}

function removeInspoPhoto(i){
  draftInspoPhotos.splice(i,1);
  renderInspoPreviews();
}

function imageToInspoDataUrl(file){
  return new Promise((resolve,reject)=>{
    const reader=new FileReader();
    reader.onerror=()=>reject(new Error("Could not read image"));
    reader.onload=()=>{
      const img=new Image();
      img.onerror=()=>reject(new Error("Could not process image"));
      img.onload=()=>{
        const max=600,scale=Math.min(1,max/Math.max(img.width,img.height));
        const c=document.createElement("canvas");
        c.width=Math.max(1,Math.round(img.width*scale));
        c.height=Math.max(1,Math.round(img.height*scale));
        c.getContext("2d").drawImage(img,0,0,c.width,c.height);
        resolve(c.toDataURL("image/jpeg",.64));
      };
      img.src=reader.result;
    };
    reader.readAsDataURL(file);
  });
}

async function addInspoPhotos(input){
  const files=[...(input.files||[])];
  if(!files.length)return;
  if(draftInspoPhotos.length+files.length>4){
    alert("You can save up to 4 inspiration photos per custom order.");
    input.value="";
    return;
  }
  for(const file of files){
    try{draftInspoPhotos.push(await imageToInspoDataUrl(file))}
    catch(e){alert("One of those photos could not be added. Try another image.")}
  }
  input.value="";
  renderInspoPreviews();
}

function newOrder(x={}){
  activeOrderBase={...x};
  const customers=C(),items=ITEMS();
  let selectedCustomerId=x.customerId||customers.find(c=>String(c.name||"").trim().toLowerCase()===String(x.customer||"").trim().toLowerCase())?.id||"";
  let selectedItemId=x.itemId||items.find(i=>String(i.name||"").trim().toLowerCase()===String(x.product||"").trim().toLowerCase())?.id||"";
  const orderType=x.orderType||"Made to Order";
  draftInspoPhotos=Array.isArray(x.inspirationPhotos)?[...x.inspirationPhotos]:[];

  const customerOptions=customers.length
    ? `<option value="">Select a customer</option>${customers.map(c=>`<option value="${c.id}" ${selectedCustomerId===c.id?"selected":""}>${esc(c.name)}${c.phone?" · "+esc(c.phone):""}</option>`).join("")}`
    : `<option value="">No customers saved yet</option>`;
  const itemOptions=items.length
    ? `<option value="">Select an item</option>${items.map(i=>`<option value="${i.id}" ${selectedItemId===i.id?"selected":""}>${esc(i.name)} · ${M(i.price)}</option>`).join("")}`
    : `<option value="">No items saved yet</option>`;

  openF(`<h2>${x.id?"Edit":"New"} Order</h2>
  <div class=customer-select-head><label>Customer</label><button type=button class=inline-plus onclick=addCustomerFromOrder() aria-label="Add new customer">＋</button></div>
  <select id=oc ${customers.length?"":"disabled"}>${customerOptions}</select>
  ${customers.length?"":'<div class=customer-help>Add a customer first, then return to New Order.</div>'}

  <label>Order type</label>
  <select id=otype onchange="toggleCustomOrder()">
    <option ${orderType==="Made to Order"?"selected":""}>Made to Order</option>
    <option ${orderType==="Custom"?"selected":""}>Custom</option>
  </select>

  <div id=regularOrderFields>
    <label>Item</label>
    <select id=op ${items.length?"":"disabled"} onchange="fillOrderItem(this.value)">${itemOptions}</select>
    ${items.length?"":'<div class=customer-help>Add an item first for made-to-order orders.</div>'}
  </div>

  <div id=customOrderFields class=custom-order-panel>
    <label>Custom order name</label>
    <input id=customTitle value="${orderType==="Custom"?esc(x.product||""):""}" placeholder="e.g. Pink birthday crochet dress">

    <label>What does the client want? <span class=private-field-note>PRIVATE · not shown on invoice</span></label>
    <textarea id=customDetails placeholder="Design details, changes, reminders, special requests…">${esc(x.customDetails||"")}</textarea>

    <label>Inspiration photos <span class=meta>(up to 4)</span></label>
    <div id=inspoPreview class=inspo-grid></div>
    <input id=inspoFiles type=file accept="image/*" multiple onchange="addInspoPhotos(this)">
  </div>

  <div class=row><div><label>Size</label><input id=os list=orderSizeList value="${esc(x.size||"")}"><datalist id=orderSizeList></datalist></div><div><label>Color</label><input id=ocol value="${esc(x.color||"")}"></div></div>
  <div class=row><div><label>Price</label><input id=opr type=number value="${x.price||""}"></div><div><label>Paid</label><input id=opa type=number value="${x.paid||0}"></div></div>
  <label>Where was this order placed?</label><select id=osrc>${["Not set","Website","Instagram","WhatsApp","In person","Phone","Other"].map(z=>`<option ${x.source==z?"selected":""}>${z}</option>`).join("")}</select>
  <label>Due date</label><input id=od type=date value="${x.due||""}">
  <label>Payment method</label><select id=opay>${["Cash","Bank transfer","Website"].map(z=>`<option ${x.payment==z?"selected":""}>${z}</option>`).join("")}</select>
  <label>Delivery method</label><select id=odel>${dels().map(z=>`<option ${x.delivery==z?"selected":""}>${z}</option>`).join("")}</select>
  <label>Status</label><select id=ost>${["New","In Studio","Ready","Delivered"].map(z=>`<option ${x.status==z?"selected":""}>${z}</option>`).join("")}</select>
  <label>Private notes</label><textarea id=on>${esc(x.notes||"")}</textarea>
  ${x.id?'<label>Reason for edit</label><input id=reason placeholder="Reason required">':""}
  <button class=primary onclick="saveOrder('${x.id||""}')" ${customers.length?"":"disabled"}>Save Order</button>
  ${x.id?`<button class=invoice-btn onclick="openInvoice('${x.id}')">Create Invoice</button><button class=danger onclick="delOrder('${x.id}')">Delete Order</button>`:""}`);

  toggleCustomOrder();
  if(orderType!=="Custom"&&selectedItemId)fillOrderItem(selectedItemId);
  if($("#reason")&&x._reason)$("#reason").value=x._reason;
}
function saveOrder(id){
  let a=O(),old=a.find(x=>x.id==id);
  if(old&&!$("#reason").value.trim())return alert("Add a reason for the edit.");

  const customer=C().find(c=>c.id===oc.value);
  if(!customer)return alert("Select a customer.");

  const orderType=otype.value;
  const isCustom=orderType==="Custom";
  let item=null,product="",itemId="";

  if(isCustom){
    product=customTitle.value.trim()||"Custom Order";
  }else{
    item=itemById(op.value);
    if(!item)return alert("Select an item.");
    product=item.name;
    itemId=item.id;
  }

  let seq=+localStorage.getItem("ah_seq")||0,
  x={
    id:id||crypto.randomUUID(),
    no:old?.no||"AM-"+String(seq+1).padStart(4,"0"),
    customerId:customer.id,
    customer:customer.name,
    itemId,
    product,
    orderType,
    customDetails:isCustom?customDetails.value.trim():"",
    inspirationPhotos:isCustom?[...draftInspoPhotos]:[],
    size:os.value,
    color:ocol.value,
    price:+opr.value||0,
    paid:+opa.value||0,
    source:osrc.value,
    due:od.value,
    payment:opay.value,
    delivery:odel.value,
    status:ost.value,
    notes:on.value,
    created:old?.created||new Date().toISOString(),
    history:old?.history||[]
  };

  if(old){
    x.history.push({at:new Date().toISOString(),reason:reason.value});
    a=a.map(z=>z.id==id?x:z);
  }else{
    localStorage.setItem("ah_seq",seq+1);
    a.push(x);
  }

  try{S("orders",a)}
  catch(e){return alert("Those photos are too large for this device. Remove one inspiration photo and try again.")}
  dlg.close();
  render();
}
function editOrder(id){newOrder(O().find(x=>x.id==id))}

function esc(v){return String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
function customerForOrder(o){return C().find(c=>(o.customerId&&c.id===o.customerId)||(!o.customerId&&String(c.name||"").trim().toLowerCase()==String(o.customer||"").trim().toLowerCase()))||{}}
function invoiceMarkup(id,printMode=false){
  const o=O().find(x=>x.id==id); if(!o)return "";
  const c=customerForOrder(o),s=G("settings",{}),balance=Math.max(0,(+o.price||0)-(+o.paid||0));
  const created=o.created?new Date(o.created):new Date();
  const issued=created.toLocaleDateString("en-JM",{year:"numeric",month:"short",day:"numeric"});
  const businessName=s.businessName||"Améa";
  const logoUrl=new URL("amea-logo.png",window.location.href).href;
  const contact=[
    s.email&&`<span>${esc(s.email)}</span>`,
    s.phone&&`<span>${esc(s.phone)}</span>`,
    s.website&&`<span>${esc(s.website)}</span>`,
    s.instagram&&`<span>${esc(s.instagram)}</span>`,
    s.address&&`<span>${esc(s.address)}</span>`
  ].filter(Boolean).join("");

  return `<div class="invoice-sheet ${printMode?"print-mode":""}">
    <div class=invoice-head>
      <div class=invoice-logo-wrap>
        <img class=invoice-logo src="${logoUrl}" alt="${esc(businessName)}">
        <div class=invoice-contact>${contact||'<span>Business contact information</span>'}</div>
      </div>
      <div class=invoice-title-wrap>
        <div class=invoice-title>INVOICE</div>
        <div class=invoice-number><b>${esc("INV-"+o.no)}</b><span>${esc(issued)}</span></div>
      </div>
    </div>

    <div class=invoice-rule></div>

    <div class=invoice-info>
      <div>
        <small>BILL TO</small>
        <b>${esc(o.customer)}</b>
        ${c.email?`<span>${esc(c.email)}</span>`:""}
        ${c.phone?`<span>${esc(c.phone)}</span>`:""}
      </div>
      <div>
        <small>ORDER DETAILS</small>
        <span>${esc(o.orderType||"Made to Order")}</span>
        ${o.due?`<span>Due ${esc(o.due)}</span>`:""}
        ${o.delivery?`<span>${esc(o.delivery)}</span>`:""}
      </div>
    </div>

    <div class=invoice-line-head><span>ITEM</span><span>AMOUNT</span></div>
    <div class=invoice-line>
      <div>
        <b>${esc(o.product)}</b>
        <span>${esc([o.size&&"Size "+o.size,o.color&&o.color].filter(Boolean).join(" · "))}</span>
      </div>
      <b>${M(o.price)}</b>
    </div>

    <div class=invoice-totals>
      <div><span>Total</span><b>${M(o.price)}</b></div>
      <div class=invoice-paid><span>Paid</span><b>${M(o.paid)}</b></div>
      <div class=invoice-balance><span>Balance Due</span><b>${M(balance)}</b></div>
    </div>

    <div class=invoice-meta invoice-meta-single>
      <div><small>ORDER NUMBER</small><span>${esc(o.no)}</span></div>
    </div>

    <p class=invoice-thanks>${esc(s.invoiceNote||"Thank you for choosing Améa ♡")}</p>
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
  *{box-sizing:border-box}body{margin:0;background:#fff;color:#51283d;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.invoice-sheet{max-width:760px;margin:0 auto;padding:42px}.invoice-head{display:flex;justify-content:space-between;gap:36px;align-items:flex-start}.invoice-logo{display:block;width:150px;max-height:70px;object-fit:contain;object-position:left center}.invoice-contact{margin-top:12px}.invoice-contact span{display:block;color:#866273;font-size:11px;line-height:1.55}.invoice-title-wrap{text-align:right}.invoice-title{font-family:Georgia,serif;font-size:31px;letter-spacing:6px;color:#f04e94}.invoice-number{margin-top:12px}.invoice-number b,.invoice-number span{display:block}.invoice-number span{color:#9a6a80;font-size:12px;margin-top:5px}.invoice-rule{height:1px;background:#f1d7e3;margin:26px 0}.invoice-info{display:grid;grid-template-columns:1fr 1fr;gap:35px}.invoice-info small,.invoice-meta small{display:block;color:#a76f88;font-size:9px;letter-spacing:1.5px;margin-bottom:7px}.invoice-info b,.invoice-info span{display:block;margin:3px 0}.invoice-info span{font-size:12px;color:#7e5b6b}.invoice-line-head,.invoice-line{display:grid;grid-template-columns:1fr auto;gap:20px}.invoice-line-head{margin-top:34px;padding:10px 0;border-bottom:1px solid #f1d7e3;color:#a76f88;font-size:9px;letter-spacing:1.3px}.invoice-line{padding:18px 0;border-bottom:1px solid #f1d7e3}.invoice-line span{display:block;color:#8c6677;font-size:12px;margin-top:5px}.invoice-description{max-width:450px;line-height:1.5}.invoice-totals{margin:24px 0 0 auto;max-width:300px}.invoice-totals>div{display:flex;justify-content:space-between;padding:7px 0}.invoice-paid{color:#2f7d50;font-weight:700}.invoice-balance{border-top:1px solid #f1d7e3;margin-top:6px;padding-top:13px!important;color:#c83568;font-weight:700}.invoice-meta{display:grid;grid-template-columns:repeat(3,1fr);gap:15px;margin-top:35px;padding-top:20px;border-top:1px solid #f1d7e3}.invoice-meta span{font-size:12px}.invoice-thanks{text-align:center;margin-top:44px;color:#e64d90}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}.invoice-sheet{padding:20px}}</style></head><body>${body}<script>window.onload=()=>setTimeout(()=>window.print(),150)<\/script></body></html>`);
  w.document.close();
}
async function shareInvoice(id){
  const o=O().find(x=>x.id==id); if(!o)return;
  const bal=Math.max(0,(+o.price||0)-(+o.paid||0));
  const text=`Améa Invoice ${"INV-"+o.no}\nCustomer: ${o.customer}\n${o.product}${o.size?" · Size "+o.size:""}${o.color?" · "+o.color:""}\nTotal: ${M(o.price)}\nPaid: ${M(o.paid)}\nBalance: ${M(bal)}\n${o.delivery||""}`;
  if(navigator.share){try{await navigator.share({title:`Améa Invoice ${o.no}`,text});return}catch(e){if(e?.name==="AbortError")return}}
  alert(text);
}

function delOrder(id){let r=prompt("Reason for deleting this order?");if(!r)return;let d=G("deleted");d.push({...O().find(x=>x.id==id),deleteReason:r,deletedAt:new Date().toISOString()});S("deleted",d);S("orders",O().filter(x=>x.id!=id));deleteCloudRow("orders",id);dlg.close();render()}
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

function newCustomer(id="",returnToOrder=false){
  const c=id?C().find(x=>x.id===id):{};
  openF(`<h2>${id?"Edit":"Add"} Customer</h2>
    <label>Name</label><input id=cn value="${esc(c?.name||"")}">
    <label>Phone</label><input id=cp value="${esc(c?.phone||"")}">
    <label>Email</label><input id=ce type=email value="${esc(c?.email||"")}">
    <label>Instagram</label><input id=ci value="${esc(c?.instagram||"")}">
    <label>Measurements</label><textarea id=cm>${esc(c?.measurements||"")}</textarea>
    <label>Private notes</label><textarea id=cno>${esc(c?.notes||"")}</textarea>
    <button class=primary onclick="saveCustomer('${id}',${returnToOrder})">${id?"Save Changes":"Save Customer"}</button>
    ${returnToOrder?`<button class=secondary-btn onclick=returnToOrderFromCustomer()>Back to Order</button>`:(id?`<button class=secondary-btn onclick="openCustomer('${id}')">Cancel</button>`:"")}
  `)
}

function saveCustomer(id="",returnToOrder=false){
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

  if(returnToOrder){
    const draft=pendingOrderReturn||{};
    pendingOrderReturn=null;
    newOrder({...draft,customerId:updated.id,customer:updated.name});
    return;
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
  if(orders.length)S("orders",O().map(o=>o.customerId===id?{...o,customerId:""}:o));
  deleteCloudRow("customers",id);
  dlg.close();
  render();
}
function newExpense(){let suppliers=SUP();openF(`<h2>Add Expense</h2><label>Category</label><select id=ec>${["Yarn/materials","Packaging","Ads","Delivery","Equipment","Other"].map(x=>`<option>${x}</option>`)}</select><label>Supplier</label><input id=es list=supplierList placeholder="Where did you buy it?"><datalist id=supplierList>${suppliers.map(x=>`<option value="${x.name}">`).join("")}</datalist><label>Amount</label><input id=ea type=number><label>Date</label><input id=ed type=date value="${new Date().toISOString().slice(0,10)}"><label>Note</label><input id=en><button class=primary onclick=saveExpense()>Save</button>`)}
function saveExpense(){let a=E(),supplier=es.value.trim();a.push({id:crypto.randomUUID(),category:ec.value,supplier,amount:+ea.value||0,date:ed.value,note:en.value});S("expenses",a);if(supplier&&!SUP().some(x=>x.name.toLowerCase()==supplier.toLowerCase())){let s=SUP();s.push({id:crypto.randomUUID(),name:supplier});S("suppliers",s)}dlg.close();render()}
function manageSuppliers(){let s=SUP();openF(`<div class=top><h2>Suppliers</h2><button onclick=addSupplier()>＋ Add</button></div><div id=supplierRows>${s.map(x=>`<div class=item><div class=top><b>${x.name}</b><button class=mini-danger onclick="deleteSupplier('${x.id}')">Remove</button></div></div>`).join("")||'<div class=empty>No suppliers saved yet.</div>'}</div>`)}
function addSupplier(){let name=prompt("Supplier name");if(!name||!name.trim())return;let s=SUP();if(!s.some(x=>x.name.toLowerCase()==name.trim().toLowerCase())){s.push({id:crypto.randomUUID(),name:name.trim()});S("suppliers",s)}manageSuppliers()}
function deleteSupplier(id){S("suppliers",SUP().filter(x=>x.id!=id));deleteCloudRow("suppliers",id);manageSuppliers()}
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

function saveSettings(){
  S("settings",{
    businessName:sbn.value.trim()||"Améa",
    email:se.value.trim(),
    phone:sp.value.trim(),
    website:sw.value.trim(),
    instagram:si.value.trim(),
    address:sa.value.trim(),
    invoiceNote:sin.value.trim()||"Thank you for choosing Améa ♡",
    delivery:sd.value.split(",").map(x=>x.trim()).filter(Boolean)
  });
  alert("Business info saved 💗");
}
function notify(){Notification.requestPermission().then(x=>alert(x=="granted"?"Notifications allowed 💗":"Notifications not enabled."))}
function dl(n,d,t){let a=document.createElement("a");a.href=URL.createObjectURL(new Blob([d],{type:t}));a.download=n;a.click()}function backup(){dl("amea-hq-backup.json",JSON.stringify({orders:O(),customers:C(),items:ITEMS(),inventory:I(),expenses:E(),suppliers:SUP(),settings:G("settings",{}),deleted:G("deleted")},null,2),"application/json")}
function ics(){let a=["BEGIN:VCALENDAR","VERSION:2.0"];O().filter(x=>x.due).forEach(x=>a.push("BEGIN:VEVENT",`UID:${x.id}@ameahq`,`DTSTART;VALUE=DATE:${x.due.replaceAll("-","")}`,`SUMMARY:${x.no} - ${x.customer} - ${x.product}`,"END:VEVENT"));a.push("END:VCALENDAR");dl("amea-orders.ics",a.join("\r\n"),"text/calendar")}
if("serviceWorker"in navigator)navigator.serviceWorker.register("sw.js").catch(()=>{});
setInterval(refreshHomeGreeting,60000);
window.addEventListener("focus",refreshHomeGreeting);
document.addEventListener("visibilitychange",()=>{if(!document.hidden)refreshHomeGreeting()});
window.addEventListener("DOMContentLoaded",startHQ);
