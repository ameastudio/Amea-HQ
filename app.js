const $=s=>document.querySelector(s);
const G=(k,d=[])=>{try{return JSON.parse(localStorage.getItem("ah_"+k)||JSON.stringify(d))}catch(e){return d}};
let cloudReady=false,cloudQueue=Promise.resolve();
function S(k,v){
  localStorage.setItem("ah_"+k,JSON.stringify(v));
  if(cloudReady)queueCloudSync(k,v);
}
let cur="home";const O=()=>G("orders"),C=()=>G("customers"),I=()=>G("inventory"),E=()=>G("expenses"),SUP=()=>G("suppliers"),ITEMS=()=>G("items"),
PATTERNS=()=>G("studio_patterns"),MODELS=()=>G("studio_models"),YARNS=()=>G("studio_yarns"),VERSIONS=()=>G("studio_versions");
const M=n=>new Intl.NumberFormat("en-JM",{style:"currency",currency:"JMD",maximumFractionDigits:0}).format(+n||0);
const AMEA_LOGO_DATA="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAZsAAACICAYAAAAxrUZ5AAAN80lEQVR4nO3dPbPU1hnA8Yc7NraGW5qe29kNfANoIZ1JoyJtbNJEvRsvVWrNpMBmJrXSmNK08A1ICtOZxpVdpMCj4XrGpOAs3rt3tTrP0XnX/1cxF610Vis9j86rRAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQPmupC4AgPUZu+HtgT/fb/r2SfTCIAqSDYCoJhLN1lnTt69ilQXxnKQuAID1mEk0IiI/RikIoiPZAIjCItGgYiQbAMGRaECyARDU2A23U5cB6ZFsAIT2TLHtabBSIClGowEIRtt81vQtMalS1GwABEGiwS6SDQDvSDTYxw8MwJuxG26Icq4MiWYd+JEBLDZ2w00ReaH8GMvTrAjJBsCkneawxyLyVdO3v5i/fykij1z3S21mffjBAUzyPBnzvOnbjzzuDwUh2QCYtSTpUIuBCMkGgAPTR/O5iLQi8qm8a2b7Z9O3/0laMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAASU/XI1Yzd8LyJ3F+5m0/TtQx/lWZOxG96IyFWHj94qZdmSBd9RRORq07e/+SxPDZauCG3cafr2uY/ylKL2WJddsvG8yuyUl03ffhbhOEUZu+GaiLz2vNunTd/e87xPZ4G+49ZJ07cxrt+sjN3wrYj8NfBhrm9fb1CLtcW6LJJNpJM+KcdVaRXn5HHTt19EOtYiKc9z5GvsrOnbVxGPF52n2ouTHO9XW2uOdSlvfpc3+52LyMfap0fFq2qzCRKai9L1ArI8xmnTt79a7s8qAMW84G2+o6Y8yqf4YpoTbSmuS9W96hgPimjGJNa9Ez3ZODwReW+DtPjxkzf9hEw2cxekj2QwdsMP8m7p+SlB25Zn2r8X1wbNMax+o5KfxLcsv6uXl6ON3fC1iGxst8/1/BLrLor5hHlD7DLuVpT3k8/cRMlqOqGSzZH9BumQnfseIQLF1DFDBSXfNcSc+K4ZKo8998CyK5s+HWLdYVGSjbadMsWTyrEy5laefTblG7vhioj8fuC/go9emQsavs7vVBNXjN/P8vfKdqTQPpvaRaTzOnXdHpS6lkOsmxb0izpkeC/NG65mqr1R24d9JpuJ4b1RR6nM9XUsvcgnzlfs38xqGHXqgHiM5Wi96H0lMfowlyDWzQv2oziMGc/mqS+HWo6vmyuHIDxTlvd8DnRIFdAtf7dsBqLsyqU2M0VxT0SNJcQ6Oyc+d7Zlmk00J/88l5Mv4hS8szQVhFON4LGoganP7YHPPE4ZEC2PrXkCjsKcx82RTU4yqJHZTr7dmJpGcMQ6e96TjWlKsO3UExERHyNYApg8NyUknJye9vecHvtPzbk9sO1pyqaJHWdzG+R0DdnUOHOYrKp8SAqe0Il1ng7iYuyG26Jc+iOTAHiJubkmg4apOmcpt6f9XTYjssZu+MRimwvf0QTELEZ72TaRmX6spFKMFlxCOfLyZqhyEOv0fNdsnim3v+P5+F7NBI27ppMtK6bd/YJMnvZ3zT35/3zsPw8ESNe1zUK6b7FN6CVeJo3dcLO0RONAO5FSg1in5C3ZuFS3Slhob+aGe2SGZmbBPG1tdv+WY8CwefKfurgP1AZu5TiL3HbexNgNn4cuy4Fj3pCZQJzjdbPjaFPsrrEbPvR9cGKdmyADBGxkfjFrWM8BCMncVBeetgo/x5eGZZrvuFsbeFrBcjDfJTjm0f6M3K8bZXNpqEVXreV+PhUWxTovycaMyKjZ0fOUujnNPHGc7/6tgAv8wdwGB54g979jNqtJT3iZugD7LJ7Ks27uceC1iZVY5x7rfNVstCMycg+EF1iMxEmy+u2O/ScO62aGVJq+/cZmOzPJ8OCAgBDl8sl20myskWmWS89k39yTGLHOUbJmtAKdH/vPnIay5jIqy5PXB85tdjWG3KVc4wzFCRLroiebgi/oj1MXwEbB59dazGV2amA5dNVm9FxOsn/gKPheDBLrYiebW5GP543NpLYM2nOfJj5+DLMTJvEHM2dpdoZ7jFWHPVM1ZyVArNsTNdlUMHJoTtIboIAO88VyXFPMh23fVABH5yyJFP0Eni1i3WW+ks3sfriggaP+4nuHhyb4YjFinSMvycZUuybbUNd08lM1pa3hHFf+HUOMaNxYbFP7ICGvQ7mJdX/QxjpvF5rptL2697crazr5Ru5tyVgBxSursxlFGUKIodzEuvdUse4Dn0c2y4as7YQjjuxHHxWoyE7s1JOoRYh1LmqvQnsT6/0YLtbwRMVwZ3uKWk2pndi2TY6bkIWoVahYR7Kxl90Lr4AFjk7cy5VmMcicXlJWmCCxjmRjIafVAYBjFLWaHF/iZSOLhW9rFTLWkWyOGLvhB8dXFUdfNh6onc1L9bbW0LTsU4xY53WAQC3MO1OWvNjqO6HzEJGtYF7N7ARVo8iBDynEjHUkG8Nk6BTvFgF82VhuN/t6h9xonroLHvgQRapYt9pkY17EVWQnKbCE7esdcqFMNLQo7Mkl1q0m2ZjhfIwoQ5VqbUIbu+GN7bYkmndyjXVVJhszPNJ11MrJoVnVjEhD5japC+Cb6U+wfdPm9ZBlyVVJsa6KZGNmFLusLfW46dsvLLc9kwyfFoAamX4F247r08peGDip5FhXXLJZ2P7ofFE2fftq7AbHwwLZyH5wgFng0Xbdratm6Zjq1Bbrsk82jtXEB6V1ggKuxm64qdj8X8EK4sGaBwPUHuuyTDbmNbazbxc0qn2yASy9sN0w13tF26ldS6JZU6zLJtmY0TQbi02vN337S+DiAIhE2SFddMAVWW+sS5psTPXf5qnsFhO1gLqsqTZDrEuUbGw7AEu+uAAcZtY4s116RkTkftO3T0KVJyRi3R+iJhvFirTVn3hgbcZuuCYirxUfKabzex+x7rIoyUbRJnvW9O2rkGUBENfKajLEuglBk43mSWZNGR5IZeyGNzHeZeM4jPdO07fPQ5QnNGLdvGDJRpHhi32KAQpku/yLE8elTopeAYBYZ8d7slFWmYu+yIASjd3w1tfT9YJ1tGoYwkysU/CabMZuuC0iz2y2XWtVEsjBXpI42hFvhih/JctesiUysfBjiYh1et6SjWaBOE4+kJVHYze4LO44p8pOcGKdGy/JRvlq0aBtxgCSqKbWcgyxzt3iZKNcofVO6e20QIVeisiXe3/7n4j8dw0JxBaxbplFycYsgW178qXUYY1AhTZN3z5MXYhSEOuWO1n4eet3LdB2CeSDRKNGrFvIOdkohzyeuR4HgF8EQx1inR9OycbMDrZW44gUICNPUxegVsQ6f1xrNpplKJY21QE47k+pC1AxYp0n6pPjkOkZzQIEpL3HTGc3ZhDr/HLJxJpMf99h/wDCsu7sXjlinUdBq31rXnQOwHoQ6+apko1ZeA5AZhhh5hexzj9tzUbzAqTHyn0DiMQsrolpxDrPgjWjNX37Rah9A1jsx9QFqAWxzg5D9YB6MN8G2SLZAJVo+vaeZnuGQCMm62QzdsPNkAXJnVlaHKgJQ6APINaFiXWams2/QxSgIEvfUgjEcCd1ASpArAtAk2ysl9cGkIZ2aXvlIpNrQawLgD4bC2M3vEldBkDhQeoCoEwhYx3Jxg6vd0Uxmr79RrP92vsocEGwWEeymUEzAwqlmWj4IlgpEtMuprlmoWMdyeYIZlmjVNqJhjU+VI3dcE1Efh+74S3DvI+LEes0yUY1YWzshtvKsmTFnHxmWaNkL1MXILHXO//WDPMm1gWgSTZ/U+77mXL7bJiLh0SDojV9+5lm+5pqNwv7oYh1AVgnm7W87nTshi+l4IsH2KVdDbqiwQIX+qE054FYF0bQPpvSluk2M2cf7f35zFyoZwmKBPhwXbFt8YMFDtTQgg8FJ9bN0yYbbRuwZpnupMZu+EH2Zs42fXtl+5Szlqcd1Kfp218025fcnHaoZqYdCm4Q6zxTJRttG7CIyNgNX2s/E5u5uXZnDZ/zMirUxKE5rdSE49x8tvc5Yp1nMYY+byIcw8nYDdcO3FTXm779KEmBgIBqTzgHyruJXITYx7OWQ6xTJxuXLJjjRWvKtDs0cluVVDU5AIVRzRDP8d495FA5m759uGSfxDq/ok3qzOVHmMjwvMMdq9D07W+11XByu59zOV+5xTqnZONa2NQ/wqEMLyIPSDRYG5eEk9uIq7EbPgkdTIl1/nyw4LMnIvK79kNjN7yN/YXNSqaXmg9IMlizpm+vKIPiz2M3vHTpPPdt7IbvReTu/t8D3dPEOg+cm9Gavn0rjiuEmqek4Mv2m+McKuetHE4+kJq5DzTLs3xq7qskkz/HbvjQ3NOxEg2xzpMlNRtp+va3sRuuitvrZa9un6p8ngwzK3Z/stJ7uZx4IBdN395zWB/rxdgNIu8mAr4KUa59x2phoe9rYt1yi5KNyPsf4VQutw9a27mI1FV00448O6EqtxMP5MQkDG2zmojIjybpPG369p7vcpka1LFVDc5jDd8l1i2zONmIiDR9+6u4Xaj7Pg3QsXa/6dsnnvcJVGkbqBzuw7t7n3Gu8Uz1xxxwamJPNMQ6d16SzZbpcLTKvhFslo6zB9ZqQdLZ2tZ4QkgeVIl1el6Tjcj7dZiumKUbNr73byFaGzJQOw9Jx6cgTXWuiHU6wdv2zBvyXDrVNKK12wJrFzvx5NoHsY9Yd1zsMeDXZEHn2p6snnKANbLowHd1YoYcF4lYd1nyJwbT7vlnmR7Cdy4ifxeRb0u++IC1MPf0TzI/N+WpiPyj6dvn4UuVHrEOAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACU7/+HdwOtwboY9QAAAABJRU5ErkJggg==";
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
  setTimeout(applyAmeaBrandHeader,0);
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

const STUDIO_COLLECTIONS={
  studio_patterns:"crochet_patterns",
  studio_models:"crochet_models",
  studio_yarns:"crochet_yarns",
  studio_versions:"crochet_pattern_versions"
};
let studioCloudAvailable=true;

function studioLocalToRemote(kind,x){
  if(kind==="studio_patterns")return {
    id:x.id,name:x.name||"Untitled Pattern",technique:x.technique||"Crochet",
    category:x.category||"Other",status:x.status||"Draft",collection_name:x.collection||null,
    tags:Array.isArray(x.tags)?x.tags:[],pinned:!!x.pinned,main_photo:x.mainPhoto||null,
    extra_photos:Array.isArray(x.extraPhotos)?x.extraPhotos:[],yarns:Array.isArray(x.yarns)?x.yarns:[],
    hook_size:x.hookSize||null,knit_details:x.knit||{},materials:Array.isArray(x.materials)?x.materials:[],
    material_notes:x.materialNotes||null,sizes:Array.isArray(x.sizes)?x.sizes:[],
    linked_model_id:x.linkedModelId||null,measurements:Array.isArray(x.measurements)?x.measurements:[],
    instructions:Array.isArray(x.instructions)?x.instructions:[],notes:x.notes||null,costing:x.costing||{},
    created_at:x.created||new Date().toISOString(),updated_at:x.updated||new Date().toISOString()
  };
  if(kind==="studio_models")return {
    id:x.id,name:x.name||"Model",usual_size:x.usualSize||null,
    measurements:Array.isArray(x.measurements)?x.measurements:[],notes:x.notes||null,
    created_at:x.created||new Date().toISOString(),updated_at:x.updated||new Date().toISOString()
  };
  if(kind==="studio_yarns")return {
    id:x.id,brand:x.brand||null,yarn_name:x.yarnName||"Yarn",colour:x.colour||null,
    weight_type:x.weightType||null,notes:x.notes||null,
    created_at:x.created||new Date().toISOString(),updated_at:x.updated||new Date().toISOString()
  };
  if(kind==="studio_versions")return {
    id:x.id,pattern_id:x.patternId,version_name:x.name||"Saved Version",
    snapshot:x.snapshot||{},created_at:x.created||new Date().toISOString()
  };
  return x;
}
function studioRemoteToLocal(kind,x){
  if(kind==="studio_patterns")return {
    id:x.id,name:x.name||"Untitled Pattern",technique:x.technique||"Crochet",
    category:x.category||"Other",status:x.status||"Draft",collection:x.collection_name||"",
    tags:Array.isArray(x.tags)?x.tags:[],pinned:!!x.pinned,mainPhoto:x.main_photo||"",
    extraPhotos:Array.isArray(x.extra_photos)?x.extra_photos:[],yarns:Array.isArray(x.yarns)?x.yarns:[],
    hookSize:x.hook_size||"",knit:x.knit_details||{},materials:Array.isArray(x.materials)?x.materials:[],
    materialNotes:x.material_notes||"",sizes:Array.isArray(x.sizes)?x.sizes:[],
    linkedModelId:x.linked_model_id||"",measurements:Array.isArray(x.measurements)?x.measurements:[],
    instructions:Array.isArray(x.instructions)?x.instructions:[],notes:x.notes||"",costing:x.costing||{},
    created:x.created_at,updated:x.updated_at
  };
  if(kind==="studio_models")return {
    id:x.id,name:x.name||"Model",usualSize:x.usual_size||"",
    measurements:Array.isArray(x.measurements)?x.measurements:[],notes:x.notes||"",
    created:x.created_at,updated:x.updated_at
  };
  if(kind==="studio_yarns")return {
    id:x.id,brand:x.brand||"",yarnName:x.yarn_name||"Yarn",colour:x.colour||"",
    weightType:x.weight_type||"",notes:x.notes||"",created:x.created_at,updated:x.updated_at
  };
  if(kind==="studio_versions")return {
    id:x.id,patternId:x.pattern_id,name:x.version_name||"Saved Version",
    snapshot:x.snapshot||{},created:x.created_at
  };
  return x;
}
async function studioRemoteRows(kind){
  const table=STUDIO_COLLECTIONS[kind];
  const {data,error}=await cloud.from(table).select("*");
  if(error)throw error;
  return data||[];
}
async function upsertStudioCollection(kind,rows){
  if(!rows.length||!studioCloudAvailable)return;
  const table=STUDIO_COLLECTIONS[kind];
  const payload=rows.map(x=>studioLocalToRemote(kind,x));
  const {error}=await cloud.from(table).upsert(payload,{onConflict:"id"});
  if(error)throw error;
}
async function initialStudioCloudSync(){
  studioCloudAvailable=true;
  for(const kind of Object.keys(STUDIO_COLLECTIONS)){
    try{
      const remote=await studioRemoteRows(kind);
      const local=G(kind,[]);
      if(remote.length)localStorage.setItem("ah_"+kind,JSON.stringify(remote.map(x=>studioRemoteToLocal(kind,x))));
      else if(local.length)await upsertStudioCollection(kind,local);
    }catch(err){
      studioCloudAvailable=false;
      console.warn("Crochet Studio cloud is not ready yet.",err);
      break;
    }
  }
}

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
    order_items:Array.isArray(x.items)?x.items:[],
    pattern_progress:x.patternProgress&&typeof x.patternProgress==="object"?x.patternProgress:{},
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
    items:Array.isArray(x.order_items)?x.order_items:[],
    patternProgress:x.pattern_progress&&typeof x.pattern_progress==="object"?x.pattern_progress:{},
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
  await initialStudioCloudSync();
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
  if(STUDIO_COLLECTIONS[kind]){
    if(!studioCloudAvailable)return;
    return upsertStudioCollection(kind,Array.isArray(v)?v:[]);
  }
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
  const maxCount=Math.max(1,...rows.map(x=>x.count));
  const chartMax=Math.max(4,Math.ceil(maxCount/4)*4);
  const best=rows.reduce((a,b)=>b.count>a.count?b:a,rows[0]);
  const total=rows.reduce((sum,x)=>sum+x.count,0);

  const W=340,H=188,left=35,right=12,top=16,bottom=34;
  const plotW=W-left-right,plotH=H-top-bottom;
  const xAt=i=>left+(rows.length===1?plotW/2:(plotW*i/(rows.length-1)));
  const yAt=n=>top+plotH-(n/chartMax)*plotH;
  const points=rows.map((r,i)=>`${xAt(i).toFixed(1)},${yAt(r.count).toFixed(1)}`).join(" ");
  const areaPoints=`${left},${top+plotH} ${points} ${left+plotW},${top+plotH}`;

  const grid=[0,1,2,3,4].map(i=>{
    const val=Math.round(chartMax-(chartMax*i/4));
    const y=top+(plotH*i/4);
    return `<line x1="${left}" y1="${y}" x2="${left+plotW}" y2="${y}" class=activity-gridline></line>
      <text x="${left-8}" y="${y+3}" text-anchor=end class=activity-y-label>${val}</text>`;
  }).join("");

  const dots=rows.map((r,i)=>{
    const x=xAt(i),y=yAt(r.count);
    return `<g class=activity-point>
      <circle cx="${x}" cy="${y}" r="5"></circle>
      <text x="${x}" y="${Math.max(10,y-10)}" text-anchor=middle class=activity-value>${r.count}</text>
      <title>${esc(r.full)}: ${r.count} order${r.count===1?"":"s"}</title>
    </g>`;
  }).join("");

  const labels=rows.map((r,i)=>`<text x="${xAt(i)}" y="${H-10}" text-anchor=middle class=activity-x-label>${esc(r.label)}</text>`).join("");

  return `<div class=activity-summary>${total?`Best period: <b>${esc(best.full)} · ${best.count} order${best.count===1?"":"s"}</b>`:"No orders in these periods yet."}</div>
    <div class=activity-chart-card>
      <div class=activity-axis-title>Orders</div>
      <svg class=activity-line-chart viewBox="0 0 ${W} ${H}" role=img aria-label="Order activity chart">
        ${grid}
        <polygon points="${areaPoints}" class=activity-area></polygon>
        <polyline points="${points}" class=activity-line></polyline>
        ${dots}
        ${labels}
      </svg>
    </div>`;
}
function setHomeAnalytics(mode){
  homeAnalyticsMode=mode==="weeks"?"weeks":"months";
  document.querySelectorAll("[data-home-analytics]").forEach(btn=>btn.classList.toggle("active",btn.dataset.homeAnalytics===homeAnalyticsMode));
  const box=$("#homeAnalytics");
  if(box)box.innerHTML=homeActivityMarkup(homeAnalyticsMode);
}


function applyAmeaBrandHeader(){
  const h=document.querySelector("header h1");
  if(h&&!h.classList.contains("amea-brand-header")){
    h.classList.add("amea-brand-header");
    h.innerHTML=`<img src="amea-logo.png" alt="Améa"><small>HQ</small>`;
  }
}

let studioPatternId="";
let studioSub="patterns";
let studioMainPhoto="";
let studioExtraPhotos=[];

function studioPatternById(id){return PATTERNS().find(x=>x.id===id)}
function studioModelById(id){return MODELS().find(x=>x.id===id)}
function studioYarnById(id){return YARNS().find(x=>x.id===id)}
function studioCategories(){
  return ["Bikini","Dress","Top","Skirt","Set","Shorts","Accessories","Other"];
}
function studioDefaultPattern(){
  return {
    id:"",name:"",technique:"Crochet",category:"Dress",status:"Draft",collection:"",
    tags:[],pinned:false,mainPhoto:"",extraPhotos:[],yarns:[{}],hookSize:"",
    knit:{machine:"",mode:"Panel",rowCount:"",tension:"",notes:""},
    materials:[{text:""}],materialNotes:"",sizes:["S"],linkedModelId:"",
    measurements:[{name:"Bust",value:"",unit:"in"}],
    instructions:[{name:"Main Section",yarnOverride:"",hookOverride:"",measurementNotes:"",steps:[]}],
    notes:"",costing:{enabled:false,yarn:"",labor:"",other:""}
  };
}
function studioLogoBlock(subtitle="Crochet Studio"){
  return `<div class=studio-brand><div class=studio-brand-line><img src="amea-logo.png" alt="Améa"><span>STUDIO</span></div><div class=studio-subtitle>${esc(subtitle)}</div></div>`;
}
function renderStudio(){
  if(studioPatternId)return renderStudioPattern(studioPatternId);
  if(studioSub==="yarns")return renderStudioYarns();
  if(studioSub==="models")return renderStudioModels();
  if(studioSub==="calculator")return renderStudioCalculator();
  renderStudioLibrary();
}
function studioGo(sub="patterns"){
  studioPatternId="";
  studioSub=sub;
  cur="crochet";
  render();
}
function studioBack(){
  studioPatternId="";
  studioSub="patterns";
  page("crochet");
}
function renderStudioLibrary(){
  const v=$("#view");
  const patterns=PATTERNS().slice().sort((a,b)=>(+!!b.pinned)-(+!!a.pinned)||new Date(b.updated||b.created||0)-new Date(a.updated||a.created||0));
  const cats=[...new Set(patterns.map(x=>x.category).filter(Boolean))].sort();
  const cols=[...new Set(patterns.map(x=>x.collection).filter(Boolean))].sort();
  v.innerHTML=`<div class=studio-page>
    <div class=studio-topbar>${studioLogoBlock()}<button class=studio-new-btn onclick=newStudioPattern()>＋ New Pattern</button></div>
    <div class=studio-tool-grid>
      <button onclick="studioGo('yarns')"><span>🧶</span><b>Yarn Library</b><small>${YARNS().length} saved</small></button>
      <button onclick="studioGo('models')"><span>♡</span><b>My Models</b><small>${MODELS().length} saved</small></button>
      <button onclick="studioGo('calculator')"><span>⌁</span><b>Calculator</b><small>Stitches & rows</small></button>
    </div>
    <div class=studio-library-head><div><h2>Patterns</h2><div class=meta>${patterns.length} pattern${patterns.length===1?"":"s"} saved</div></div></div>
    <input id=studioSearch class=studio-search placeholder="Search patterns…" oninput=studioApplyFilters()>
    <div class=studio-filters>
      <select id=studioTechnique onchange=studioApplyFilters()><option value="">Crochet + Knit</option><option>Crochet</option><option>Knit</option></select>
      <select id=studioCategory onchange=studioApplyFilters()><option value="">All categories</option>${cats.map(x=>`<option>${esc(x)}</option>`).join("")}</select>
      <select id=studioStatus onchange=studioApplyFilters()><option value="">All statuses</option><option>Draft</option><option>Testing</option><option>Final</option></select>
      <select id=studioCollection onchange=studioApplyFilters()><option value="">All collections</option>${cols.map(x=>`<option>${esc(x)}</option>`).join("")}</select>
    </div>
    <div id=studioPatternGrid class=studio-pattern-grid>${studioPatternCards(patterns)}</div>
  </div>`;
}
function studioPatternCards(patterns){
  if(!patterns.length)return `<div class="empty studio-empty">No patterns yet. Tap <b>＋ New Pattern</b> to create your first one 💗</div>`;
  return patterns.map(x=>`<button class=studio-pattern-card data-search="${esc([x.name,x.technique,x.category,x.status,x.collection,(x.tags||[]).join(" ")].join(" ").toLowerCase())}" data-technique="${esc(x.technique||"")}" data-category="${esc(x.category||"")}" data-status="${esc(x.status||"")}" data-collection="${esc(x.collection||"")}" onclick="openStudioPattern('${x.id}')">
    <div class=studio-pattern-photo>${x.mainPhoto?`<img src="${x.mainPhoto}" alt="${esc(x.name)}">`:`<div class=studio-pattern-placeholder><img src="amea-logo.png" alt=""><span>Pattern</span></div>`}${x.pinned?'<span class=studio-pin>★</span>':""}</div>
    <div class=studio-pattern-copy><b>${esc(x.name||"Untitled Pattern")}</b><span>${esc(x.technique||"Crochet")} • ${esc(x.category||"Other")} • ${esc(x.status||"Draft")}</span></div>
  </button>`).join("");
}
function studioApplyFilters(){
  const q=($("#studioSearch")?.value||"").trim().toLowerCase();
  const tech=$("#studioTechnique")?.value||"",cat=$("#studioCategory")?.value||"",status=$("#studioStatus")?.value||"",col=$("#studioCollection")?.value||"";
  document.querySelectorAll(".studio-pattern-card").forEach(card=>{
    const show=(!q||card.dataset.search.includes(q))&&(!tech||card.dataset.technique===tech)&&(!cat||card.dataset.category===cat)&&(!status||card.dataset.status===status)&&(!col||card.dataset.collection===col);
    card.style.display=show?"block":"none";
  });
}
function openStudioPattern(id){
  studioPatternId=id;
  studioSub="patterns";
  cur="crochet";
  render();
}
function studioYarnSummary(y){
  return [y.brand,y.yarnName,y.colour,y.weightType].filter(Boolean).join(" · ")||"Yarn";
}
function studioPatternHeroMeta(x){
  return `${esc(x.technique||"Crochet")} • ${esc(x.category||"Other")} • ${esc(x.status||"Draft")}`;
}
function renderStudioPattern(id){
  const x=studioPatternById(id);
  if(!x){studioPatternId="";return renderStudioLibrary()}
  const model=studioModelById(x.linkedModelId);
  const versions=VERSIONS().filter(v=>v.patternId===id).sort((a,b)=>new Date(b.created)-new Date(a.created));
  const cost=x.costing||{},costTotal=(+cost.yarn||0)+(+cost.labor||0)+(+cost.other||0);
  const v=$("#view");
  v.innerHTML=`<div class=studio-detail>
    <div class=studio-detail-nav><button onclick=studioBack()>← Patterns</button><div class=studio-detail-actions><button onclick="toggleStudioPin('${x.id}')">${x.pinned?"★":"☆"}</button><button onclick="editStudioPattern('${x.id}')">Edit</button></div></div>
    <div class=studio-detail-hero>
      <div class=studio-detail-photo>${x.mainPhoto?`<img src="${x.mainPhoto}" alt="${esc(x.name)}">`:`<div class=studio-pattern-placeholder><img src="amea-logo.png" alt=""></div>`}</div>
      <div class=studio-detail-title><div class=studio-eyebrow>PATTERN</div><h2>${esc(x.name)}</h2><div class=studio-meta-strip>${studioPatternHeroMeta(x)}</div>${x.collection?`<div class=studio-collection>${esc(x.collection)}</div>`:""}</div>
    </div>
    <div class=studio-action-row>
      <button onclick="duplicateStudioPattern('${x.id}')">Duplicate</button>
      <button onclick="saveStudioVersion('${x.id}')">Save Version</button>
      ${x.status==="Final"?`<button class=studio-gold onclick="exportStudioPatternPDF('${x.id}')">Export PDF</button>`:""}
    </div>

    <section class=studio-detail-section><h3>Materials</h3>
      ${(x.materials||[]).filter(m=>m.text).map(m=>`<div class=studio-check>□ ${esc(m.text)}</div>`).join("")||'<div class=meta>No materials added.</div>'}
      ${x.materialNotes?`<p>${esc(x.materialNotes)}</p>`:""}
    </section>

    <section class=studio-detail-section><h3>Yarn & ${x.technique==="Knit"?"Machine":"Hook"}</h3>
      ${(x.yarns||[]).filter(y=>Object.values(y||{}).some(Boolean)).map((y,i)=>`<div class=studio-yarn-detail><b>${i===0?"Main yarn":"Extra yarn / colour"}</b><span>${esc(studioYarnSummary(y))}</span>${y.amount?`<small>Amount: ${esc(y.amount)}</small>`:""}${y.price?`<small>Price: ${M(y.price)}</small>`:""}${y.purchasedAt?`<small>Purchased: ${esc(y.purchasedAt)}</small>`:""}</div>`).join("")||'<div class=meta>No yarn details added.</div>'}
      ${x.technique==="Crochet"?(x.hookSize?`<div class=studio-detail-line><b>Hook</b><span>${esc(x.hookSize)}</span></div>`:""):`<div class=studio-knit-grid>
        <div><b>Machine</b><span>${esc(x.knit?.machine||"—")}</span></div>
        <div><b>Mode</b><span>${esc(x.knit?.mode||"—")}</span></div>
        <div><b>Rows</b><span>${esc(x.knit?.rowCount||"—")}</span></div>
        <div><b>Tension / settings</b><span>${esc(x.knit?.tension||"—")}</span></div>
        ${x.knit?.notes?`<div class=studio-knit-notes><b>Machine notes</b><span>${esc(x.knit.notes)}</span></div>`:""}
      </div>`}
    </section>

    <section class=studio-detail-section><h3>Measurements</h3>
      ${(x.sizes||[]).length?`<div class=studio-size-pills>${x.sizes.map(s=>`<span>${esc(s)}</span>`).join("")}</div>`:""}
      ${model?`<div class=studio-model-link><b>Model: ${esc(model.name)}</b><span>${esc(model.usualSize||"")}</span></div>`:""}
      ${(x.measurements||[]).filter(m=>m.name||m.value).map(m=>`<div class=studio-measure-row><b>${esc(m.name||"Measurement")}</b><span>${esc(m.value||"—")} ${esc(m.unit||"")}</span></div>`).join("")||'<div class=meta>No measurements added.</div>'}
    </section>

    <section class=studio-detail-section><h3>Pattern Instructions</h3>
      ${(x.instructions||[]).map((s,si)=>`<div class=studio-instruction-section>
        <div class=studio-instruction-title><span>${String(si+1).padStart(2,"0")}</span><h4>${esc(s.name||"Section")}</h4></div>
        ${(s.yarnOverride||s.hookOverride||s.measurementNotes)?`<div class=studio-section-overrides>${s.yarnOverride?`<span><b>Yarn:</b> ${esc(s.yarnOverride)}</span>`:""}${s.hookOverride?`<span><b>${x.technique==="Knit"?"Machine/settings":"Hook"}:</b> ${esc(s.hookOverride)}</span>`:""}${s.measurementNotes?`<span><b>Measurements:</b> ${esc(s.measurementNotes)}</span>`:""}</div>`:""}
        ${(s.steps||[]).slice().sort((a,b)=>studioStepRowNumber(a,1)-studioStepRowNumber(b,1)).filter(st=>st.label||st.text||st.rowNumber||studioStepSegments(st).length).map((st,i)=>`<div class=studio-step><b>Row ${studioStepRowNumber(st,i+1)}</b><p>${studioStepReadable(st)}</p></div>`).join("")||'<div class=meta>No rows yet.</div>'}
      </div>`).join("")||'<div class=meta>No instructions added.</div>'}
    </section>

    ${(x.extraPhotos||[]).length?`<section class=studio-detail-section><h3>Extra Photos</h3><div class=studio-extra-grid>${x.extraPhotos.map(p=>`<img src="${p}" alt="">`).join("")}</div></section>`:""}
    ${x.notes?`<section class=studio-detail-section><h3>Notes</h3><p>${esc(x.notes)}</p></section>`:""}
    ${cost.enabled?`<section class=studio-detail-section><h3>Optional Costing</h3><div class=studio-measure-row><b>Yarn</b><span>${M(cost.yarn)}</span></div><div class=studio-measure-row><b>Labour</b><span>${M(cost.labor)}</span></div><div class=studio-measure-row><b>Other</b><span>${M(cost.other)}</span></div><div class="studio-measure-row studio-total"><b>Total cost</b><span>${M(costTotal)}</span></div></section>`:""}
    <section class=studio-detail-section><div class=top><h3>Saved Versions</h3><span class=meta>${versions.length}</span></div>
      ${versions.length?versions.map(ver=>`<div class=studio-version-row><div><b>${esc(ver.name)}</b><span>${new Date(ver.created).toLocaleString("en-JM",{dateStyle:"medium",timeStyle:"short"})}</span></div><div><button onclick="previewStudioVersion('${ver.id}')">View</button><button onclick="restoreStudioVersion('${ver.id}')">Restore</button></div></div>`).join(""):'<div class=meta>No versions saved yet. Tap “Save Version” when you want a checkpoint.</div>'}
    </section>
    <button class=studio-delete onclick="deleteStudioPattern('${x.id}')">Delete Pattern</button>
  </div>`;
}
function toggleStudioPin(id){
  const a=PATTERNS().map(x=>x.id===id?{...x,pinned:!x.pinned,updated:new Date().toISOString()}:x);
  S("studio_patterns",a);renderStudioPattern(id);
}
function duplicateStudioPattern(id){
  const x=studioPatternById(id);if(!x)return;
  const copy=JSON.parse(JSON.stringify(x));
  copy.id=crypto.randomUUID();copy.name=x.name+" Copy";copy.status="Draft";copy.pinned=false;
  copy.created=new Date().toISOString();copy.updated=copy.created;
  S("studio_patterns",[...PATTERNS(),copy]);
  studioPatternId=copy.id;render();
}
function saveStudioVersion(id){
  const x=studioPatternById(id);if(!x)return;
  const name=prompt("Version name",`${x.name} · ${new Date().toLocaleDateString("en-JM",{day:"numeric",month:"short",year:"numeric"})}`);
  if(!name)return;
  const ver={id:crypto.randomUUID(),patternId:id,name:name.trim(),snapshot:JSON.parse(JSON.stringify(x)),created:new Date().toISOString()};
  S("studio_versions",[...VERSIONS(),ver]);
  renderStudioPattern(id);
}
function previewStudioVersion(id){
  const v=VERSIONS().find(x=>x.id===id);if(!v)return;
  const x=v.snapshot||{};
  openF(`<button class=close onclick=dlg.close()>×</button><h2>${esc(v.name)}</h2><div class=meta>Saved ${new Date(v.created).toLocaleString("en-JM",{dateStyle:"medium",timeStyle:"short"})}</div>
    <div class=version-preview><b>${esc(x.name||"Pattern")}</b><span>${esc(x.technique||"")} • ${esc(x.category||"")} • ${esc(x.status||"")}</span>
    <p>${(x.instructions||[]).length} section${(x.instructions||[]).length===1?"":"s"} · ${(x.measurements||[]).length} measurement${(x.measurements||[]).length===1?"":"s"}</p></div>`);
}
function restoreStudioVersion(id){
  const ver=VERSIONS().find(x=>x.id===id);if(!ver)return;
  if(!confirm("Restore this saved version? Your current pattern will be replaced."))return;
  const snap=JSON.parse(JSON.stringify(ver.snapshot||{}));
  snap.id=ver.patternId;snap.updated=new Date().toISOString();
  S("studio_patterns",PATTERNS().map(x=>x.id===ver.patternId?snap:x));
  dlg.close?.();studioPatternId=ver.patternId;render();
}
function deleteStudioPattern(id){
  if(!confirm("Delete this pattern? This cannot be undone."))return;
  S("studio_patterns",PATTERNS().filter(x=>x.id!==id));
  S("studio_versions",VERSIONS().filter(v=>v.patternId!==id));
  deleteCloudRow("crochet_patterns",id);
  studioPatternId="";studioSub="patterns";render();
}

function studioYarnRow(y={},index=0){
  const lib=YARNS();
  return `<div class=studio-editor-row data-yarn-row>
    <div class=studio-editor-row-head><b>${index===0?"Main yarn":"Extra yarn / colour"}</b><button type=button onclick="this.closest('[data-yarn-row]').remove()">×</button></div>
    <select data-yarn-library onchange=studioFillYarnFromLibrary(this)><option value="">Type custom yarn</option>${lib.map(z=>`<option value="${z.id}" ${y.libraryId===z.id?"selected":""}>${esc(studioYarnSummary(z))}</option>`).join("")}</select>
    <div class=studio-two><input data-yarn-brand placeholder="Brand" value="${esc(y.brand||"")}"><input data-yarn-name placeholder="Yarn name" value="${esc(y.yarnName||"")}"></div>
    <div class=studio-two><input data-yarn-colour placeholder="Colour" value="${esc(y.colour||"")}"><input data-yarn-weight placeholder="Weight / type" value="${esc(y.weightType||"")}"></div>
    <div class=studio-two><input data-yarn-amount placeholder="Amount used" value="${esc(y.amount||"")}"><input data-yarn-price type=number placeholder="Price (optional)" value="${esc(y.price||"")}"></div>
    <input data-yarn-store placeholder="Where purchased (optional)" value="${esc(y.purchasedAt||"")}">
  </div>`;
}
function studioMaterialRow(m={}){
  return `<div class="studio-inline-row" data-material-row><input data-material-text placeholder="e.g. 4 mm hook, stitch markers" value="${esc(m.text||"")}"><button type=button onclick="this.parentElement.remove()">×</button></div>`;
}
function studioMeasurementRow(m={}){
  return `<div class="studio-measure-edit" data-measure-row><input data-measure-name placeholder="Measurement" value="${esc(m.name||"")}"><input data-measure-value placeholder="Value" value="${esc(m.value||"")}"><select data-measure-unit><option ${m.unit==="in"?"selected":""}>in</option><option ${m.unit==="cm"?"selected":""}>cm</option><option ${m.unit==="st"?"selected":""}>st</option><option ${m.unit==="rows"?"selected":""}>rows</option></select><button type=button onclick="this.parentElement.remove()">×</button></div>`;
}

function studioNumberOptions(selected="",max=300){
  const n=Number(selected)||1;
  let out="";
  for(let i=1;i<=max;i++)out+=`<option value="${i}" ${i===n?"selected":""}>${i}</option>`;
  return out;
}
function studioStitchOptions(selected=""){
  const stitches=[
    ["SC","Single Crochet (SC)"],["HDC","Half Double Crochet (HDC)"],["DC","Double Crochet (DC)"],
    ["TR","Treble Crochet (TR)"],["SL ST","Slip Stitch (SL ST)"],["CH","Chain (CH)"],
    ["INC","Increase (INC)"],["DEC","Decrease (DEC)"],["BLO","Back Loop Only (BLO)"],
    ["FLO","Front Loop Only (FLO)"],["OTHER","Other / note"]
  ];
  return stitches.map(([v,l])=>`<option value="${v}" ${selected===v?"selected":""}>${l}</option>`).join("");
}
function studioStepRowNumber(st={},fallback=1){
  if(+st.rowNumber)return +st.rowNumber;
  const m=String(st.label||"").match(/row\s*(\d+)/i);
  return m?+m[1]:fallback;
}
function studioStepSegments(st={}){
  if(Array.isArray(st.segments)&&st.segments.length)return st.segments;
  return [];
}
function studioStepReadable(st={}){
  const segs=studioStepSegments(st);
  const built=segs.map(s=>`${esc(s.stitch||"Stitch")} × ${esc(s.count||"—")}`).join(" · ");
  return [built,st.note||(!segs.length?st.text:"")].filter(Boolean).join(" — ")||"No stitch details";
}
function studioSegmentEdit(seg={}){
  return `<div class=studio-segment-edit data-segment-row>
    <select data-segment-stitch>${studioStitchOptions(seg.stitch||"SC")}</select>
    <select data-segment-count>${studioNumberOptions(seg.count||1,500)}</select>
    <button type=button onclick="this.closest('[data-segment-row]').remove()">×</button>
  </div>`;
}
function studioStepRow(st={},fallback=1){
  const rowNumber=studioStepRowNumber(st,fallback);
  const segments=studioStepSegments(st);
  return `<div class=studio-step-edit data-step-row data-step-id="${esc(st.id||crypto.randomUUID())}">
    <div class=studio-step-edit-head>
      <div><span>Row</span><select data-step-rownum>${studioNumberOptions(rowNumber,300)}</select></div>
      <button type=button onclick="this.closest('[data-step-row]').remove()">Remove</button>
    </div>
    <div data-segment-list>${(segments.length?segments:[{stitch:"SC",count:1}]).map(studioSegmentEdit).join("")}</div>
    <button type=button class=studio-add-line onclick=studioAddSegmentToSavedRow(this)>＋ Add Stitch</button>
    <input data-step-note placeholder="Row note (optional)" value="${esc(st.note||(!segments.length?st.text||"":""))}">
  </div>`;
}
function studioSectionEditor(s={},index=0){
  const steps=(s.steps||[{}]).slice().sort((a,b)=>studioStepRowNumber(a,1)-studioStepRowNumber(b,1));
  const next=Math.max(0,...steps.map((st,i)=>studioStepRowNumber(st,i+1)))+1;
  return `<div class=studio-section-edit data-section-row>
    <div class=studio-editor-row-head><b>Section ${index+1}</b><button type=button onclick="this.closest('[data-section-row]').remove()">×</button></div>
    <input data-section-name placeholder="e.g. TOP, SKIRT, BODY, STRAPS" value="${esc(s.name||"")}">
    <details><summary>Section-specific details (optional)</summary>
      <input data-section-yarn placeholder="Different yarn/colour for this section" value="${esc(s.yarnOverride||"")}">
      <input data-section-hook placeholder="Different hook / machine settings" value="${esc(s.hookOverride||"")}">
      <input data-section-measure placeholder="Measurement notes for this section" value="${esc(s.measurementNotes||"")}">
    </details>

    <div class=studio-quick-row-builder>
      <div class=studio-builder-title><div><b>Quick Row Builder</b><span>Choose instead of stopping to type.</span></div><button type=button class=studio-mic-btn onclick=studioVoiceRow(this) title="Speak a row">🎙</button></div>
      <div class=studio-builder-grid>
        <label>Row #<select data-builder-row>${studioNumberOptions(next,300)}</select></label>
        <label>Stitch<select data-builder-stitch>${studioStitchOptions("SC")}</select></label>
        <label>Amount<select data-builder-count>${studioNumberOptions(1,500)}</select></label>
      </div>
      <div class=studio-builder-segments data-builder-segments></div>
      <div class=studio-builder-actions>
        <button type=button onclick=studioBuilderAddStitch(this)>＋ Add Stitch</button>
        <button type=button class=studio-row-add onclick=studioBuilderAddRow(this)>Add Row</button>
      </div>
      <div class=studio-builder-shortcuts>
        <button type=button onclick=studioSameAsPrevious(this)>↻ Same as Previous</button>
        <details><summary>Repeat Multiple Rows</summary>
          <div class=studio-repeat-grid>
            <label>From<select data-repeat-from>${studioNumberOptions(Math.max(1,next-1),300)}</select></label>
            <label>To<select data-repeat-to>${studioNumberOptions(Math.min(300,next+4),300)}</select></label>
            <label>Use same as<select data-repeat-source>${studioNumberOptions(Math.max(1,next-1),300)}</select></label>
          </div>
          <button type=button class=studio-repeat-add onclick=studioRepeatMultipleRows(this)>Add Repeated Rows</button>
        </details>
      </div>
    </div>

    <div data-step-list>${steps.map((st,i)=>studioStepRow(st,i+1)).join("")}</div>
  </div>`;
}
function studioAddSegmentToSavedRow(btn){
  const list=btn.closest("[data-step-row]")?.querySelector("[data-segment-list]");
  if(list)list.insertAdjacentHTML("beforeend",studioSegmentEdit({stitch:"SC",count:1}));
}
function studioBuilderAddStitch(btn){
  const sec=btn.closest("[data-section-row]");
  if(!sec)return;
  const stitch=sec.querySelector("[data-builder-stitch]")?.value||"SC";
  const count=sec.querySelector("[data-builder-count]")?.value||"1";
  const box=sec.querySelector("[data-builder-segments]");
  if(box)box.insertAdjacentHTML("beforeend",`<span data-pending-segment data-stitch="${esc(stitch)}" data-count="${esc(count)}">${esc(stitch)} × ${esc(count)} <button type=button onclick="this.parentElement.remove()">×</button></span>`);
}
function studioPendingSegments(sec){
  const chips=[...sec.querySelectorAll("[data-pending-segment]")].map(x=>({stitch:x.dataset.stitch,count:+x.dataset.count||1}));
  if(chips.length)return chips;
  return [{stitch:sec.querySelector("[data-builder-stitch]")?.value||"SC",count:+(sec.querySelector("[data-builder-count]")?.value||1)}];
}
function studioBuilderAddRow(btn){
  const sec=btn.closest("[data-section-row]");if(!sec)return;
  const row=+(sec.querySelector("[data-builder-row]")?.value||1);
  const segs=studioPendingSegments(sec);
  const list=sec.querySelector("[data-step-list]");
  list?.insertAdjacentHTML("beforeend",studioStepRow({id:crypto.randomUUID(),rowNumber:row,segments:segs,note:""},row));
  const pending=sec.querySelector("[data-builder-segments]");if(pending)pending.innerHTML="";
  const rowSelect=sec.querySelector("[data-builder-row]");
  if(rowSelect)rowSelect.value=String(Math.min(300,row+1));
}
function studioSameAsPrevious(btn){
  const sec=btn.closest("[data-section-row]");if(!sec)return;
  const rows=[...sec.querySelectorAll("[data-step-row]")];
  if(!rows.length)return alert("Add a row first.");
  const last=rows[rows.length-1];
  const lastNum=+(last.querySelector("[data-step-rownum]")?.value||rows.length);
  const segs=[...last.querySelectorAll("[data-segment-row]")].map(r=>({stitch:r.querySelector("[data-segment-stitch]")?.value||"SC",count:+(r.querySelector("[data-segment-count]")?.value||1)}));
  const note=last.querySelector("[data-step-note]")?.value||"";
  sec.querySelector("[data-step-list]")?.insertAdjacentHTML("beforeend",studioStepRow({id:crypto.randomUUID(),rowNumber:lastNum+1,segments:segs,note},lastNum+1));
  const rowSelect=sec.querySelector("[data-builder-row]");if(rowSelect)rowSelect.value=String(Math.min(300,lastNum+2));
}
function studioRepeatMultipleRows(btn){
  const sec=btn.closest("[data-section-row]");if(!sec)return;
  const box=btn.closest("details");
  const from=+(box.querySelector("[data-repeat-from]")?.value||1),to=+(box.querySelector("[data-repeat-to]")?.value||from),source=+(box.querySelector("[data-repeat-source]")?.value||from);
  if(to<from)return alert("The To row needs to be the same or higher than From.");
  const sourceRow=[...sec.querySelectorAll("[data-step-row]")].find(r=>+(r.querySelector("[data-step-rownum]")?.value||0)===source);
  if(!sourceRow)return alert("That source row is not in this section yet.");
  const segs=[...sourceRow.querySelectorAll("[data-segment-row]")].map(r=>({stitch:r.querySelector("[data-segment-stitch]")?.value||"SC",count:+(r.querySelector("[data-segment-count]")?.value||1)}));
  const note=sourceRow.querySelector("[data-step-note]")?.value||"";
  const list=sec.querySelector("[data-step-list]");
  for(let n=from;n<=to;n++){
    if([...sec.querySelectorAll("[data-step-row]")].some(r=>+(r.querySelector("[data-step-rownum]")?.value||0)===n))continue;
    list?.insertAdjacentHTML("beforeend",studioStepRow({id:crypto.randomUUID(),rowNumber:n,segments:segs,note},n));
  }
  const rowSelect=sec.querySelector("[data-builder-row]");if(rowSelect)rowSelect.value=String(Math.min(300,to+1));
  box.open=false;
}
function studioVoiceRow(btn){
  const Recognition=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!Recognition)return alert("Voice row entry is not available in this browser yet. The dropdowns will still work.");
  const sec=btn.closest("[data-section-row]");
  const r=new Recognition();r.lang="en-US";r.interimResults=false;r.maxAlternatives=1;
  btn.textContent="…";
  r.onend=()=>btn.textContent="🎙";
  r.onerror=()=>alert("I couldn't catch that. Try again or use the dropdowns.");
  r.onresult=e=>{
    const heard=e.results?.[0]?.[0]?.transcript||"";
    const rowMatch=heard.match(/row\s+(\d+)/i),numMatch=heard.match(/(\d+)\s+(single|half double|double|treble|slip|chain|increase|decrease)/i);
    const phrase=(numMatch?.[2]||"").toLowerCase();
    const map={"single":"SC","half double":"HDC","double":"DC","treble":"TR","slip":"SL ST","chain":"CH","increase":"INC","decrease":"DEC"};
    if(rowMatch)sec.querySelector("[data-builder-row]").value=rowMatch[1];
    if(numMatch){sec.querySelector("[data-builder-count]").value=numMatch[1];sec.querySelector("[data-builder-stitch]").value=map[phrase]||"SC";}
    if(!rowMatch&&!numMatch)alert(`I heard: "${heard}". Check the dropdowns before adding the row.`);
  };
  r.start();
}
function studioFillYarnFromLibrary(sel){
  const y=studioYarnById(sel.value),row=sel.closest("[data-yarn-row]");if(!y||!row)return;
  row.querySelector("[data-yarn-brand]").value=y.brand||"";
  row.querySelector("[data-yarn-name]").value=y.yarnName||"";
  row.querySelector("[data-yarn-colour]").value=y.colour||"";
  row.querySelector("[data-yarn-weight]").value=y.weightType||"";
}
function studioAddYarn(){const box=$("#studioYarnList");if(box)box.insertAdjacentHTML("beforeend",studioYarnRow({},box.querySelectorAll("[data-yarn-row]").length))}
function studioAddMaterial(){const box=$("#studioMaterialList");if(box)box.insertAdjacentHTML("beforeend",studioMaterialRow())}
function studioAddMeasurement(){const box=$("#studioMeasurementList");if(box)box.insertAdjacentHTML("beforeend",studioMeasurementRow({unit:"in"}))}
function studioAddSection(){const box=$("#studioSectionList");if(box)box.insertAdjacentHTML("beforeend",studioSectionEditor({},box.querySelectorAll("[data-section-row]").length))}
function studioToggleTechnique(){
  const knit=$("#studioTechniqueEdit")?.value==="Knit";
  if($("#studioCrochetFields"))$("#studioCrochetFields").style.display=knit?"none":"block";
  if($("#studioKnitFields"))$("#studioKnitFields").style.display=knit?"block":"none";
}
function studioToggleCost(){
  if($("#studioCostFields"))$("#studioCostFields").style.display=$("#studioCostEnabled")?.checked?"grid":"none";
}
async function studioMainPhotoChanged(input){
  const f=input.files?.[0];if(!f)return;
  try{
    studioMainPhoto=await imageToSmallDataUrl(f);
    const p=$("#studioMainPreview");if(p){p.src=studioMainPhoto;p.style.display="block"}
  }catch(e){alert("I couldn't process that photo. Try another image.")}
}
async function studioExtraPhotosChanged(input){
  const files=[...(input.files||[])].slice(0,6);
  for(const f of files){
    try{studioExtraPhotos.push(await imageToSmallDataUrl(f))}catch(e){}
  }
  studioExtraPhotos=studioExtraPhotos.slice(0,6);
  studioRenderExtraPreviews();
  input.value="";
}
function studioRenderExtraPreviews(){
  const box=$("#studioExtraPreview");if(!box)return;
  box.innerHTML=studioExtraPhotos.map((p,i)=>`<div><img src="${p}" alt=""><button type=button onclick="studioExtraPhotos.splice(${i},1);studioRenderExtraPreviews()">×</button></div>`).join("")||'<span class=meta>No extra photos yet.</span>';
}
function newStudioPattern(){editStudioPattern("")}
function editStudioPattern(id=""){
  const x=id?JSON.parse(JSON.stringify(studioPatternById(id)||studioDefaultPattern())):studioDefaultPattern();
  studioMainPhoto=x.mainPhoto||"";studioExtraPhotos=[...(x.extraPhotos||[])];
  const sizes=["XS","S","M","L","XL"];
  openF(`<button class=close onclick=dlg.close()>×</button><div class=studio-editor-title>${studioLogoBlock(id?"Edit Pattern":"New Pattern")}</div>
    <label>Pattern name</label><input id=studioPatternName value="${esc(x.name||"")}" placeholder="e.g. Flora Dress">
    <div class=studio-three><div><label>Technique</label><select id=studioTechniqueEdit onchange=studioToggleTechnique()><option ${x.technique==="Crochet"?"selected":""}>Crochet</option><option ${x.technique==="Knit"?"selected":""}>Knit</option></select></div>
    <div><label>Category</label><select id=studioCategoryEdit>${studioCategories().map(z=>`<option ${x.category===z?"selected":""}>${z}</option>`).join("")}</select></div>
    <div><label>Status</label><select id=studioStatusEdit>${["Draft","Testing","Final"].map(z=>`<option ${x.status===z?"selected":""}>${z}</option>`).join("")}</select></div></div>
    <div class=studio-two><div><label>Collection <span class=meta>(optional)</span></label><input id=studioCollectionEdit value="${esc(x.collection||"")}" placeholder="e.g. Eden"></div><div><label>Tags</label><input id=studioTags value="${esc((x.tags||[]).join(", "))}" placeholder="floral, summer, fitted"></div></div>

    <div class=studio-editor-block><h3>Photos</h3>
      ${studioMainPhoto?`<img id=studioMainPreview class=studio-main-preview src="${studioMainPhoto}" alt="">`:`<img id=studioMainPreview class=studio-main-preview style="display:none" alt="">`}
      <label>Main finished-piece photo</label><input type=file accept="image/*" onchange=studioMainPhotoChanged(this)>
      <label>Extra / reference photos <span class=meta>(up to 6)</span></label><input type=file accept="image/*" multiple onchange=studioExtraPhotosChanged(this)>
      <div id=studioExtraPreview class=studio-extra-preview></div>
    </div>

    <div class=studio-editor-block><div class=studio-editor-row-head><h3>Yarn</h3><button type=button onclick=studioAddYarn()>＋ Add Yarn</button></div><div id=studioYarnList>${(x.yarns?.length?x.yarns:[{}]).map((y,i)=>studioYarnRow(y,i)).join("")}</div></div>

    <div id=studioCrochetFields class=studio-editor-block><h3>Hook</h3><input id=studioHook value="${esc(x.hookSize||"")}" placeholder="e.g. 4 mm"></div>
    <div id=studioKnitFields class=studio-editor-block><h3>Knit Machine Details</h3><div class=studio-two><input id=studioMachine value="${esc(x.knit?.machine||"")}" placeholder="Machine / size, e.g. Sentro 48"><select id=studioMachineMode><option ${x.knit?.mode==="Panel"?"selected":""}>Panel</option><option ${x.knit?.mode==="Tube"?"selected":""}>Tube</option></select></div><div class=studio-two><input id=studioRowCount value="${esc(x.knit?.rowCount||"")}" placeholder="Row count"><input id=studioTension value="${esc(x.knit?.tension||"")}" placeholder="Tension / settings"></div><textarea id=studioMachineNotes placeholder="Machine notes">${esc(x.knit?.notes||"")}</textarea></div>

    <div class=studio-editor-block><div class=studio-editor-row-head><h3>Materials</h3><button type=button onclick=studioAddMaterial()>＋ Add</button></div><div id=studioMaterialList>${(x.materials?.length?x.materials:[{}]).map(studioMaterialRow).join("")}</div><textarea id=studioMaterialNotes placeholder="Extra materials notes">${esc(x.materialNotes||"")}</textarea></div>

    <div class=studio-editor-block><h3>Sizing & Model</h3><div class=studio-size-checks>${sizes.map(s=>`<label><input type=checkbox value="${s}" ${x.sizes?.includes(s)?"checked":""}> ${s}</label>`).join("")}<label><input id=studioCustomSizeCheck type=checkbox ${x.sizes?.some(s=>!sizes.includes(s))?"checked":""}> Custom</label></div><input id=studioCustomSize value="${esc((x.sizes||[]).filter(s=>!sizes.includes(s)).join(", "))}" placeholder="Custom size name(s), optional"><label>Saved model <span class=meta>(optional)</span></label><select id=studioModel><option value="">No saved model</option>${MODELS().map(m=>`<option value="${m.id}" ${x.linkedModelId===m.id?"selected":""}>${esc(m.name)}${m.usualSize?" · "+esc(m.usualSize):""}</option>`).join("")}</select></div>

    <div class=studio-editor-block><div class=studio-editor-row-head><h3>Measurements</h3><button type=button onclick=studioAddMeasurement()>＋ Add Measurement</button></div><div id=studioMeasurementList>${(x.measurements?.length?x.measurements:[{name:"Bust",unit:"in"}]).map(studioMeasurementRow).join("")}</div></div>

    <div class=studio-editor-block><div class=studio-editor-row-head><h3>Pattern Instructions</h3><button type=button onclick=studioAddSection()>＋ Section</button></div><div id=studioSectionList>${(x.instructions?.length?x.instructions:[{name:"Main Section",steps:[]}]).map(studioSectionEditor).join("")}</div></div>

    <div class=studio-editor-block><h3>Notes</h3><textarea id=studioPatternNotes placeholder="Anything else you want to remember…">${esc(x.notes||"")}</textarea></div>

    <div class=studio-editor-block><label class=studio-cost-toggle><input id=studioCostEnabled type=checkbox ${x.costing?.enabled?"checked":""} onchange=studioToggleCost()> Track cost for this pattern</label><div id=studioCostFields class=studio-cost-fields><input id=studioCostYarn type=number placeholder="Yarn cost" value="${esc(x.costing?.yarn||"")}"><input id=studioCostLabor type=number placeholder="Labour" value="${esc(x.costing?.labor||"")}"><input id=studioCostOther type=number placeholder="Other cost" value="${esc(x.costing?.other||"")}"></div></div>

    <button class=primary onclick="saveStudioPattern('${id}')">${id?"Save Pattern":"Create Pattern"}</button>`);
  studioToggleTechnique();studioToggleCost();studioRenderExtraPreviews();
}
function collectStudioYarns(){
  return [...document.querySelectorAll("[data-yarn-row]")].map(row=>({
    libraryId:row.querySelector("[data-yarn-library]")?.value||"",
    brand:row.querySelector("[data-yarn-brand]")?.value.trim()||"",
    yarnName:row.querySelector("[data-yarn-name]")?.value.trim()||"",
    colour:row.querySelector("[data-yarn-colour]")?.value.trim()||"",
    weightType:row.querySelector("[data-yarn-weight]")?.value.trim()||"",
    amount:row.querySelector("[data-yarn-amount]")?.value.trim()||"",
    price:+(row.querySelector("[data-yarn-price]")?.value||0),
    purchasedAt:row.querySelector("[data-yarn-store]")?.value.trim()||""
  })).filter(y=>Object.values(y).some(Boolean));
}
function collectStudioMaterials(){
  return [...document.querySelectorAll("[data-material-row]")].map(row=>({text:row.querySelector("[data-material-text]")?.value.trim()||""})).filter(x=>x.text);
}
function collectStudioMeasurements(){
  return [...document.querySelectorAll("[data-measure-row]")].map(row=>({
    name:row.querySelector("[data-measure-name]")?.value.trim()||"",
    value:row.querySelector("[data-measure-value]")?.value.trim()||"",
    unit:row.querySelector("[data-measure-unit]")?.value||""
  })).filter(x=>x.name||x.value);
}
function collectStudioInstructions(){
  return [...document.querySelectorAll("[data-section-row]")].map(sec=>({
    name:sec.querySelector("[data-section-name]")?.value.trim()||"Section",
    yarnOverride:sec.querySelector("[data-section-yarn]")?.value.trim()||"",
    hookOverride:sec.querySelector("[data-section-hook]")?.value.trim()||"",
    measurementNotes:sec.querySelector("[data-section-measure]")?.value.trim()||"",
    steps:[...sec.querySelectorAll("[data-step-row]")].map((st,i)=>({
      id:st.dataset.stepId||crypto.randomUUID(),
      rowNumber:+(st.querySelector("[data-step-rownum]")?.value||i+1),
      segments:[...st.querySelectorAll("[data-segment-row]")].map(r=>({
        stitch:r.querySelector("[data-segment-stitch]")?.value||"SC",
        count:+(r.querySelector("[data-segment-count]")?.value||1)
      })),
      note:st.querySelector("[data-step-note]")?.value.trim()||""
    })).sort((a,b)=>a.rowNumber-b.rowNumber)
  }));
}
function saveStudioPattern(id=""){
  const name=$("#studioPatternName")?.value.trim();if(!name)return alert("Give the pattern a name.");
  const now=new Date().toISOString(),old=id?studioPatternById(id):null;
  const baseSizes=[...document.querySelectorAll(".studio-size-checks input[type=checkbox][value]:checked")].map(x=>x.value);
  const custom=$("#studioCustomSize")?.value.split(",").map(x=>x.trim()).filter(Boolean)||[];
  const sizes=[...new Set([...baseSizes,...custom])];
  const x={
    id:id||crypto.randomUUID(),name,technique:$("#studioTechniqueEdit").value,category:$("#studioCategoryEdit").value,
    status:$("#studioStatusEdit").value,collection:$("#studioCollectionEdit").value.trim(),
    tags:$("#studioTags").value.split(",").map(x=>x.trim()).filter(Boolean),pinned:old?.pinned||false,
    mainPhoto:studioMainPhoto,extraPhotos:[...studioExtraPhotos],yarns:collectStudioYarns(),
    hookSize:$("#studioHook")?.value.trim()||"",
    knit:{machine:$("#studioMachine")?.value.trim()||"",mode:$("#studioMachineMode")?.value||"Panel",rowCount:$("#studioRowCount")?.value.trim()||"",tension:$("#studioTension")?.value.trim()||"",notes:$("#studioMachineNotes")?.value.trim()||""},
    materials:collectStudioMaterials(),materialNotes:$("#studioMaterialNotes").value.trim(),sizes,
    linkedModelId:$("#studioModel").value,measurements:collectStudioMeasurements(),instructions:collectStudioInstructions(),
    notes:$("#studioPatternNotes").value.trim(),
    costing:{enabled:!!$("#studioCostEnabled")?.checked,yarn:+($("#studioCostYarn")?.value||0),labor:+($("#studioCostLabor")?.value||0),other:+($("#studioCostOther")?.value||0)},
    created:old?.created||now,updated:now
  };
  const a=id?PATTERNS().map(z=>z.id===id?x:z):[...PATTERNS(),x];
  try{S("studio_patterns",a)}catch(e){return alert("This pattern is too large to save on this device. Try removing an extra photo.")}
  dlg.close();studioPatternId=x.id;studioSub="patterns";page("crochet");
}

function renderStudioYarns(){
  const v=$("#view");
  v.innerHTML=`<div class=studio-subpage><div class=studio-detail-nav><button onclick="studioGo('patterns')">← Patterns</button><button onclick=newStudioYarn()>＋ Add Yarn</button></div>${studioLogoBlock("Yarn Library")}<div class=meta studio-page-note>Save yarns you use often. You can still type a custom yarn inside any pattern.</div><div class=studio-library-list>${YARNS().map(y=>`<div class=studio-library-item><div><b>${esc(y.yarnName||"Yarn")}</b><span>${esc([y.brand,y.colour,y.weightType].filter(Boolean).join(" · "))}</span></div><button onclick="newStudioYarn('${y.id}')">Edit</button></div>`).join("")||'<div class=empty>No yarns saved yet.</div>'}</div></div>`;
}
function newStudioYarn(id=""){
  const y=id?studioYarnById(id):{};
  openF(`<button class=close onclick=dlg.close()>×</button><h2>${id?"Edit":"Add"} Yarn</h2><label>Brand</label><input id=syBrand value="${esc(y?.brand||"")}"><label>Yarn name</label><input id=syName value="${esc(y?.yarnName||"")}"><label>Colour</label><input id=syColour value="${esc(y?.colour||"")}"><label>Weight / type</label><input id=syWeight value="${esc(y?.weightType||"")}" placeholder="e.g. 4 / Worsted / Cotton"><label>Notes</label><textarea id=syNotes>${esc(y?.notes||"")}</textarea><button class=primary onclick="saveStudioYarn('${id}')">Save Yarn</button>${id?`<button class=danger onclick="deleteStudioYarn('${id}')">Delete Yarn</button>`:""}`);
}
function saveStudioYarn(id=""){
  const name=$("#syName").value.trim();if(!name)return alert("Add a yarn name.");
  const old=id?studioYarnById(id):null,now=new Date().toISOString();
  const y={id:id||crypto.randomUUID(),brand:$("#syBrand").value.trim(),yarnName:name,colour:$("#syColour").value.trim(),weightType:$("#syWeight").value.trim(),notes:$("#syNotes").value.trim(),created:old?.created||now,updated:now};
  S("studio_yarns",id?YARNS().map(x=>x.id===id?y:x):[...YARNS(),y]);dlg.close();renderStudioYarns();
}
function deleteStudioYarn(id){
  if(!confirm("Delete this yarn from the library? Existing patterns keep their saved yarn details."))return;
  S("studio_yarns",YARNS().filter(x=>x.id!==id));deleteCloudRow("crochet_yarns",id);dlg.close();renderStudioYarns();
}

function renderStudioModels(){
  const v=$("#view");
  v.innerHTML=`<div class=studio-subpage><div class=studio-detail-nav><button onclick="studioGo('patterns')">← Patterns</button><button onclick=newStudioModel()>＋ Add Model</button></div>${studioLogoBlock("My Models")}<div class=meta studio-page-note>Save each model once, then link them to patterns. Pattern-specific measurements can still be different.</div><div class=studio-library-list>${MODELS().map(m=>`<div class=studio-library-item><div><b>${esc(m.name)}</b><span>${esc(m.usualSize||"No usual size")} · ${(m.measurements||[]).length} measurements</span></div><button onclick="newStudioModel('${m.id}')">Edit</button></div>`).join("")||'<div class=empty>No models saved yet.</div>'}</div></div>`;
}
function studioModelMeasureRow(m={}){
  return `<div class=studio-measure-edit data-model-measure><input data-mm-name placeholder="Measurement" value="${esc(m.name||"")}"><input data-mm-value placeholder="Value" value="${esc(m.value||"")}"><select data-mm-unit><option ${m.unit==="in"?"selected":""}>in</option><option ${m.unit==="cm"?"selected":""}>cm</option></select><button type=button onclick="this.parentElement.remove()">×</button></div>`;
}
function addStudioModelMeasure(){const box=$("#studioModelMeasures");box.insertAdjacentHTML("beforeend",studioModelMeasureRow({unit:"in"}))}
function newStudioModel(id=""){
  const m=id?studioModelById(id):{measurements:[{name:"Bust",unit:"in"},{name:"Waist",unit:"in"},{name:"Hips",unit:"in"}]};
  openF(`<button class=close onclick=dlg.close()>×</button><h2>${id?"Edit":"Add"} Model</h2><label>Name / nickname</label><input id=smName value="${esc(m?.name||"")}"><label>Usual size</label><input id=smSize value="${esc(m?.usualSize||"")}" placeholder="S, M, L…"><div class=studio-editor-row-head><label>Measurements</label><button type=button onclick=addStudioModelMeasure()>＋ Add</button></div><div id=studioModelMeasures>${(m?.measurements||[]).map(studioModelMeasureRow).join("")}</div><label>Notes</label><textarea id=smNotes>${esc(m?.notes||"")}</textarea><button class=primary onclick="saveStudioModel('${id}')">Save Model</button>${id?`<button class=danger onclick="deleteStudioModel('${id}')">Delete Model</button>`:""}`);
}
function saveStudioModel(id=""){
  const name=$("#smName").value.trim();if(!name)return alert("Add the model's name or nickname.");
  const old=id?studioModelById(id):null,now=new Date().toISOString();
  const measurements=[...document.querySelectorAll("[data-model-measure]")].map(r=>({name:r.querySelector("[data-mm-name]").value.trim(),value:r.querySelector("[data-mm-value]").value.trim(),unit:r.querySelector("[data-mm-unit]").value})).filter(x=>x.name||x.value);
  const m={id:id||crypto.randomUUID(),name,usualSize:$("#smSize").value.trim(),measurements,notes:$("#smNotes").value.trim(),created:old?.created||now,updated:now};
  S("studio_models",id?MODELS().map(x=>x.id===id?m:x):[...MODELS(),m]);dlg.close();renderStudioModels();
}
function deleteStudioModel(id){
  if(PATTERNS().some(x=>x.linkedModelId===id)&&!confirm("This model is linked to a pattern. Delete the saved model anyway? The pattern's own measurements will stay."))return;
  S("studio_models",MODELS().filter(x=>x.id!==id));deleteCloudRow("crochet_models",id);dlg.close();renderStudioModels();
}

function renderStudioCalculator(){
  const v=$("#view");
  v.innerHTML=`<div class=studio-subpage><div class=studio-detail-nav><button onclick="studioGo('patterns')">← Patterns</button></div>${studioLogoBlock("Measurement Calculator")}
    <div class=studio-calc-card>
      <div class=studio-calc-switch><button id=calcSimpleBtn class=active onclick="studioCalcMode('simple')">Simple</button><button id=calcAdvancedBtn onclick="studioCalcMode('advanced')">Advanced</button></div>
      <label>Units</label><select id=calcUnit><option value=in>Inches</option><option value=cm>Centimetres</option></select>
      <div class=studio-two><div><label>Target width / circumference</label><input id=calcWidth type=number step=.01 placeholder="e.g. 34"></div><div><label>Target length</label><input id=calcLength type=number step=.01 placeholder="e.g. 20"></div></div>
      <div class=studio-calc-gauge><h3>Your gauge</h3><div class=studio-two><input id=calcGaugeSt type=number step=.01 placeholder="Stitches"><input id=calcGaugeWidth type=number step=.01 value=4 placeholder="Across this width"></div><div class=studio-two><input id=calcGaugeRows type=number step=.01 placeholder="Rows"><input id=calcGaugeHeight type=number step=.01 value=4 placeholder="Across this height"></div></div>
      <div id=calcAdvanced style="display:none"><h3>Advanced</h3><div class=studio-two><div><label>Ease %</label><input id=calcEase type=number step=.1 value=0 placeholder="-10 or 5"></div><div><label>Stretch reduction %</label><input id=calcStretch type=number step=.1 value=0></div></div><div class=studio-two><div><label>Total seam allowance</label><input id=calcSeam type=number step=.01 value=0></div><div><label>Panels</label><input id=calcPanels type=number min=1 step=1 value=1></div></div></div>
      <button class=primary onclick=calculateStudioGauge()>Calculate</button>
      <div id=calcResult class=studio-calc-result><span>Your stitch and row counts will show here.</span></div>
    </div>
    <div class="meta studio-calc-note">Use your own swatch gauge. Counts are a starting point — always check fit and fabric stretch on the actual piece.</div>
  </div>`;
}
function studioCalcMode(mode){
  const adv=mode==="advanced";
  $("#calcAdvanced").style.display=adv?"block":"none";
  $("#calcSimpleBtn").classList.toggle("active",!adv);$("#calcAdvancedBtn").classList.toggle("active",adv);
}
function calculateStudioGauge(){
  let width=+$("#calcWidth").value||0,length=+$("#calcLength").value||0,st=+$("#calcGaugeSt").value||0,gw=+$("#calcGaugeWidth").value||0,rows=+$("#calcGaugeRows").value||0,gh=+$("#calcGaugeHeight").value||0;
  if(!width||!st||!gw)return alert("Add a target width and stitch gauge.");
  const advanced=$("#calcAdvanced").style.display!=="none";
  let panels=1,finalWidth=width;
  if(advanced){
    const ease=+$("#calcEase").value||0,stretch=+$("#calcStretch").value||0,seam=+$("#calcSeam").value||0;
    panels=Math.max(1,+$("#calcPanels").value||1);
    finalWidth=width*(1+ease/100)*(1-stretch/100)+seam;
  }
  const totalSt=Math.max(1,Math.round(finalWidth*(st/gw)));
  const perPanel=Math.max(1,Math.round(totalSt/panels));
  const rowCount=length&&rows&&gh?Math.max(1,Math.round(length*(rows/gh))):null;
  $("#calcResult").innerHTML=`<div><span>Total stitches</span><b>${totalSt}</b></div>${panels>1?`<div><span>Approx. per panel</span><b>${perPanel}</b></div>`:""}${rowCount?`<div><span>Rows for length</span><b>${rowCount}</b></div>`:""}<small>Adjusted width used: ${finalWidth.toFixed(2)} ${$("#calcUnit").value}</small>`;
}

function exportStudioPatternPDF(id){
  const x=studioPatternById(id);if(!x||x.status!=="Final")return alert("Only Final patterns can be exported.");
  const model=studioModelById(x.linkedModelId);
  const rows=(x.instructions||[]).map((s,i)=>`<section><h2>${String(i+1).padStart(2,"0")} · ${esc(s.name||"Section")}</h2>${(s.yarnOverride||s.hookOverride||s.measurementNotes)?`<div class=over>${s.yarnOverride?`<b>Yarn:</b> ${esc(s.yarnOverride)} `:""}${s.hookOverride?`<b>Hook/settings:</b> ${esc(s.hookOverride)} `:""}${s.measurementNotes?`<b>Measurements:</b> ${esc(s.measurementNotes)}`:""}</div>`:""}${(s.steps||[]).slice().sort((a,b)=>studioStepRowNumber(a,1)-studioStepRowNumber(b,1)).map((st,i)=>`<div class=step><b>Row ${studioStepRowNumber(st,i+1)}</b><p>${studioStepReadable(st)}</p></div>`).join("")}</section>`).join("");
  const win=window.open("","_blank");if(!win)return alert("Allow pop-ups so I can open the PDF layout.");
  win.document.write(`<!doctype html><html><head><meta charset=utf-8><title>${esc(x.name)} · Améa Pattern</title><style>
    @page{margin:16mm}*{box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#5a2440;line-height:1.5;margin:0}.head{border-bottom:2px solid #b88935;padding-bottom:18px;margin-bottom:24px;display:flex;justify-content:space-between;align-items:end}.logo{height:46px;max-width:170px;object-fit:contain}.hq{color:#b88935;font-size:11px;font-weight:800;letter-spacing:2px}.eyebrow{font-size:9px;letter-spacing:2px;color:#b88935;font-weight:800}h1{font-family:Georgia,serif;color:#f52578;margin:3px 0 5px;font-size:30px}h2{font-family:Georgia,serif;color:#f52578;font-size:18px;margin:24px 0 8px}.meta{color:#93677c;font-size:11px}.hero{display:grid;grid-template-columns:145px 1fr;gap:20px;align-items:start}.hero img.photo{width:145px;height:145px;object-fit:cover;border-radius:18px}.box{background:#fff8fc;border:1px solid #f1d7e3;border-radius:14px;padding:12px;margin:12px 0}.grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.line{padding:5px 0;border-bottom:1px solid #f5e5ec}.step{padding:9px 0;border-bottom:1px solid #f2dde6}.step p{margin:3px 0 0;white-space:pre-wrap}.over{background:#fff6fa;padding:9px;border-radius:10px;font-size:10px}.extra{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.extra img{width:100%;aspect-ratio:1;object-fit:cover;border-radius:12px}.footer{margin-top:30px;border-top:1px solid #e9d4dc;padding-top:10px;color:#93677c;font-size:9px;text-align:center}@media print{button{display:none}}</style></head><body>
    <div class=head><div><img class=logo src="${AMEA_LOGO_DATA}"><div class=hq>AMÉA STUDIO · PATTERN</div></div><div class=eyebrow>FINAL PATTERN</div></div>
    <div class=hero>${x.mainPhoto?`<img class=photo src="${x.mainPhoto}">`:""}<div><div class=eyebrow>${esc(x.technique)} · ${esc(x.category)}</div><h1>${esc(x.name)}</h1><div class=meta>${x.collection?esc(x.collection)+" · ":""}Sizes: ${esc((x.sizes||[]).join(", ")||"—")}${model?" · Model: "+esc(model.name):""}</div></div></div>
    <div class=box><h2>Materials</h2>${(x.materials||[]).map(m=>`<div class=line>□ ${esc(m.text)}</div>`).join("")||"—"}${x.materialNotes?`<p>${esc(x.materialNotes)}</p>`:""}</div>
    <div class=box><h2>Yarn & ${x.technique==="Knit"?"Machine":"Hook"}</h2>${(x.yarns||[]).map(y=>`<div class=line><b>${esc(studioYarnSummary(y))}</b>${y.amount?" · "+esc(y.amount):""}</div>`).join("")}${x.technique==="Crochet"?`<p><b>Hook:</b> ${esc(x.hookSize||"—")}</p>`:`<div class=grid><div><b>Machine:</b> ${esc(x.knit?.machine||"—")}</div><div><b>Mode:</b> ${esc(x.knit?.mode||"—")}</div><div><b>Rows:</b> ${esc(x.knit?.rowCount||"—")}</div><div><b>Tension:</b> ${esc(x.knit?.tension||"—")}</div></div>`}</div>
    <div class=box><h2>Measurements</h2>${(x.measurements||[]).map(m=>`<div class=line><b>${esc(m.name)}</b> · ${esc(m.value)} ${esc(m.unit||"")}</div>`).join("")||"—"}</div>
    ${rows}
    ${(x.extraPhotos||[]).length?`<section><h2>Reference Photos</h2><div class=extra>${x.extraPhotos.map(p=>`<img src="${p}">`).join("")}</div></section>`:""}
    ${x.notes?`<section><h2>Notes</h2><p>${esc(x.notes)}</p></section>`:""}
    <div class=footer>Améa Studio · Final pattern</div>
    <script>window.onload=()=>setTimeout(()=>window.print(),250)<\/script></body></html>`);
  win.document.close();
}

function page(x){cur=x;render()}function render(){document.body.classList.toggle("studio-mode",cur==="crochet");document.querySelectorAll("nav button").forEach(b=>b.classList.toggle("active",b.dataset.page===cur));let v=$("#view");if(cur=="home"){let o=O(),e=E(),now=new Date(),mo=o.filter(x=>new Date(x.created).getMonth()==now.getMonth()),sales=mo.reduce((a,x)=>a+x.paid,0),out=mo.reduce((a,x)=>a+Math.max(0,x.price-x.paid),0),ex=e.filter(x=>new Date(x.date).getMonth()==now.getMonth()).reduce((a,x)=>a+x.amount,0),today=new Date().toISOString().slice(0,10);v.innerHTML=`<div class=hero><h2 id=homeGreeting>${greeting()}, Améa Boss ✨</h2><div class=meta>Everything in your studio, in one pretty place.</div></div><div class=grid><div class=card>Sales<b>${M(sales)}</b></div><div class=card>Orders<b>${mo.length}</b></div><div class=card>Outstanding<b>${M(out)}</b></div><div class=card>Expenses<b>${M(ex)}</b></div></div><div class=section><h3>Today</h3><div class=card>${list(O().filter(x=>x.due==today),true)||'<div class=meta>No orders due today 💗</div>'}</div></div><button class=studio-home-shortcut onclick="page(\'crochet\')"><div><span class=studio-home-eyebrow>AMÉA HQ</span><b>Crochet Studio</b><small>Patterns · Yarn · Models · Calculator</small></div><span class=studio-home-arrow>→</span></button><div class="section home-analytics-section"><div class=analytics-home-head><div><h3>Order Activity</h3><div class=meta>See which weeks or months bring in the most orders.</div></div><div class=analytics-home-toggle><button data-home-analytics=months class="${homeAnalyticsMode==="months"?"active":""}" onclick="setHomeAnalytics('months')">Months</button><button data-home-analytics=weeks class="${homeAnalyticsMode==="weeks"?"active":""}" onclick="setHomeAnalytics('weeks')">Weeks</button></div></div><div id=homeAnalytics>${homeActivityMarkup(homeAnalyticsMode)}</div></div><div class=section><h3>Recent Orders</h3>${list(O().slice(-5).reverse())||'<div class=empty>No orders yet.</div>'}</div>`}
else if(cur=="orders")v.innerHTML=`<h2>Orders</h2><input placeholder="Search orders, customers, products…" oninput="searchO(this.value)"><div id=ol>${list(O().slice().reverse())||'<div class=empty>No orders yet.</div>'}</div>`;
else if(cur=="customers")v.innerHTML=`<div class=top><h2>Customers</h2><button onclick=newCustomer()>＋ Add</button></div>${C().map(x=>{let st=customerStats(x),last=st.last?st.last.toLocaleDateString("en-JM",{day:"numeric",month:"short",year:"numeric"}):"";return `<div class="item customer-row" onclick="openCustomer('${x.id}')"><div class=top><b>${esc(x.name)}</b><span class="customer-badge ${st.orders.length?"returning":"new"}">${st.orders.length?"RETURNING":"NEW"}</span></div><div class=meta>${esc(x.phone||"")}${x.email?" · "+esc(x.email):""}<br><b>${customerStatusText(x)}</b>${st.orders.length?` · ${M(st.paid)} lifetime`:""}${last?`<br>Last order: ${last}`:""}</div><div class=customer-chevron>View customer →</div></div>`}).join("")||'<div class=empty>No customers yet.</div>'}`;
else if(cur=="invoices"){
  const orders=O().slice().reverse();
  v.innerHTML=`<div class=top><div><h2>Invoices</h2><div class=meta>Invoices are created from your saved orders.</div></div></div>
  ${orders.length?orders.map(o=>{
    const bal=Math.max(0,(+o.price||0)-(+o.paid||0));
    return `<div class=item>
      <div class=top><b>${esc("INV-"+o.no)}</b><span class="badge invoice-status ${bal>0?"due":"paid"}">${bal>0?"Balance due":"Paid"}</span></div>
      <div class=meta>${esc(o.customer||"")} · ${esc(orderSummaryProduct(orderItemsFor(o)))}<br>Total: ${M(o.price)} · <span class=invoice-paid-text>Paid: ${M(o.paid)}</span> · <span class=invoice-due-text>Balance: ${M(bal)}</span></div>
      <button class=invoice-list-btn onclick="openInvoice('${o.id}')">Open Invoice</button>
    </div>`
  }).join(""):'<div class=empty>No invoices yet. Create an order first.</div>'}`;
}

else if(cur=="crochet"){renderStudio()}
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
    <button onclick="page('crochet')">✦ Crochet Studio</button>
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
function list(a){return a.map(x=>{
  const items=orderItemsFor(x);
  const summary=items.map(it=>orderItemLabel(it)).join(" · ");
  return `<div class=item onclick="editOrder('${x.id}')"><div class=top><b>${x.no} · ${x.customer}</b><span class=badge>${x.status}</span></div><div class=meta>${items.length>1?'<span class="multi-order-tag">MULTI-ITEM</span> ':""}${esc(summary||x.product)}<br>Placed via: ${esc(x.source||"Not set")} · Payment: ${esc(x.payment||"—")} · Delivery: ${esc(x.delivery||"—")}<br>Due: ${esc(x.due||"—")}</div><div class=money>${M(x.paid)} paid · ${M(Math.max(0,x.price-x.paid))} balance</div>${orderHasPattern(x)?`<button class=order-work-quick onclick="event.stopPropagation();openOrderPatternChooser('${x.id}')">✓ Work on Pattern</button>`:""}</div>`;
}).join("")}
function searchO(q){q=q.toLowerCase();$("#ol").innerHTML=list(O().filter(x=>JSON.stringify(x).toLowerCase().includes(q)))}
function openF(h){$("#form").innerHTML=h;if(!dlg.open)dlg.showModal()}function openAddMenu(){openF(`<h2>Add to Améa HQ</h2><div class=add-menu><button onclick="newOrder()">＋ New Order</button><button onclick="newCustomer()">＋ Customer</button><button onclick="newItem()">＋ Item</button><button onclick="newExpense()">＋ Expense</button><button onclick="newInventory()">＋ Inventory</button><button onclick="dlg.close();page(\'crochet\');setTimeout(newStudioPattern,0)">＋ Pattern</button></div>`)}
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

function orderItemsFor(o={}){
  if(Array.isArray(o.items)&&o.items.length)return o.items.map((it,i)=>({
    lineId:it.lineId||crypto.randomUUID(),type:it.type||it.orderType||"Made to Order",
    itemId:it.itemId||"",name:it.name||it.product||"Item",size:it.size||"",color:it.color||"",
    price:+it.price||0,details:it.details||it.customDetails||"",patternId:it.patternId||""
  }));
  if(o.product||o.itemId||o.price)return [{
    lineId:crypto.randomUUID(),type:o.orderType||"Made to Order",itemId:o.itemId||"",name:o.product||"Item",
    size:o.size||"",color:o.color||"",price:+o.price||0,details:o.customDetails||"",patternId:""
  }];
  return [{lineId:crypto.randomUUID(),type:"Made to Order",itemId:"",name:"",size:"",color:"",price:0,details:"",patternId:""}];
}
function orderItemLabel(it){return it.name||itemById(it.itemId)?.name||"Item"}
function orderItemsTotal(items){return (items||[]).reduce((a,it)=>a+(+it.price||0),0)}
function orderSummaryProduct(items){
  const good=(items||[]).filter(x=>orderItemLabel(x));
  if(!good.length)return "Order";
  return good.length===1?orderItemLabel(good[0]):`${orderItemLabel(good[0])} + ${good.length-1} more`;
}
function finalPatternOptions(selected=""){
  return `<option value="">No pattern linked</option>${PATTERNS().filter(p=>p.status==="Final").map(p=>`<option value="${p.id}" ${selected===p.id?"selected":""}>${esc(p.name)} · ${esc(p.technique)}</option>`).join("")}`;
}
function orderLineCard(it={},index=0){
  const items=ITEMS(),type=it.type||"Made to Order";
  const catalogOptions=`<option value="">Select item</option>${items.map(i=>`<option value="${i.id}" ${it.itemId===i.id?"selected":""}>${esc(i.name)} · ${M(i.price)}</option>`).join("")}`;
  return `<div class=order-line-card data-order-line data-line-id="${esc(it.lineId||crypto.randomUUID())}">
    <div class=order-line-head><div><span>ITEM ${index+1}</span><b>${esc(it.name||"New item")}</b></div>${index?`<button type=button onclick=removeOrderLine(this)>Remove</button>`:""}</div>
    <label>Item type</label><select data-line-type onchange=toggleOrderLine(this)><option ${type==="Made to Order"?"selected":""}>Made to Order</option><option ${type==="Custom"?"selected":""}>Custom</option></select>
    <div data-line-catalog>
      <label>Item</label><select data-line-item onchange=fillOrderLineCatalog(this)>${catalogOptions}</select>
    </div>
    <div data-line-custom>
      <label>Custom item name</label><input data-line-name value="${esc(type==="Custom"?it.name||"":"")}" placeholder="e.g. Matching crochet hat">
    </div>
    <div class=row><div><label>Size</label><input data-line-size value="${esc(it.size||"")}"></div><div><label>Colour</label><input data-line-color value="${esc(it.color||"")}"></div></div>
    <label>Price</label><input data-line-price type=number value="${it.price||""}" oninput=refreshOrderTotal()>
    <label>Pattern used <span class=meta>(optional)</span></label><select data-line-pattern>${finalPatternOptions(it.patternId||"")}</select>
    <label>Private item notes <span class=private-field-note>NOT ON INVOICE</span></label>
    <textarea data-line-details placeholder="Changes, reminders, special requests…">${esc(it.details||"")}</textarea>
  </div>`;
}
function renderOrderLines(items){
  const box=$("#orderLines");if(!box)return;
  box.innerHTML=(items||[]).map(orderLineCard).join("");
  box.querySelectorAll("[data-order-line]").forEach(line=>toggleOrderLine(line.querySelector("[data-line-type]"),false));
  refreshOrderTotal();
}
function addOrderLine(){
  const box=$("#orderLines");if(!box)return;
  const idx=box.querySelectorAll("[data-order-line]").length;
  box.insertAdjacentHTML("beforeend",orderLineCard({lineId:crypto.randomUUID(),type:"Made to Order"},idx));
  toggleOrderLine(box.lastElementChild.querySelector("[data-line-type]"),false);
  refreshOrderTotal();
}
function removeOrderLine(btn){
  btn.closest("[data-order-line]")?.remove();
  [...document.querySelectorAll("[data-order-line]")].forEach((line,i)=>{
    const tag=line.querySelector(".order-line-head span");if(tag)tag.textContent=`ITEM ${i+1}`;
  });
  refreshOrderTotal();
}
function toggleOrderLine(sel,clear=true){
  const line=sel?.closest("[data-order-line]");if(!line)return;
  const custom=sel.value==="Custom";
  const cat=line.querySelector("[data-line-catalog]"),cus=line.querySelector("[data-line-custom]");
  if(cat)cat.style.display=custom?"none":"block";
  if(cus)cus.style.display=custom?"block":"none";
  if(clear&&custom){const name=line.querySelector("[data-line-name]");if(name&&!name.value)name.focus();}
}
function fillOrderLineCatalog(sel){
  const line=sel.closest("[data-order-line]"),item=itemById(sel.value);if(!line||!item)return;
  line.querySelector("[data-line-price]").value=item.price||0;
  const head=line.querySelector(".order-line-head b");if(head)head.textContent=item.name;
  refreshOrderTotal();
}
function collectOrderItems(){
  return [...document.querySelectorAll("[data-order-line]")].map((line,i)=>{
    const type=line.querySelector("[data-line-type]")?.value||"Made to Order";
    const itemId=type==="Custom"?"":line.querySelector("[data-line-item]")?.value||"";
    const item=itemById(itemId);
    const name=type==="Custom"?(line.querySelector("[data-line-name]")?.value.trim()||`Custom item ${i+1}`):(item?.name||"");
    return {
      lineId:line.dataset.lineId||crypto.randomUUID(),type,itemId,name,
      size:line.querySelector("[data-line-size]")?.value.trim()||"",
      color:line.querySelector("[data-line-color]")?.value.trim()||"",
      price:+(line.querySelector("[data-line-price]")?.value||0),
      patternId:line.querySelector("[data-line-pattern]")?.value||"",
      details:line.querySelector("[data-line-details]")?.value.trim()||""
    };
  });
}
function refreshOrderTotal(){
  const total=collectOrderItems().reduce((a,x)=>a+x.price,0);
  const el=$("#orderItemsTotal");if(el)el.textContent=M(total);
}
function orderHasPattern(o){return orderItemsFor(o).some(it=>it.patternId)}
function patternProgressFor(o,lineId){return (o.patternProgress&&o.patternProgress[lineId])||{}}
function patternRowsForTracker(pattern){
  const out=[];
  (pattern?.instructions||[]).forEach((sec,si)=>{
    (sec.steps||[]).slice().sort((a,b)=>studioStepRowNumber(a,1)-studioStepRowNumber(b,1)).forEach((st,i)=>{
      const row=studioStepRowNumber(st,i+1);
      out.push({key:`${si}:${st.id||row+":"+i}`,section:sec.name||`Section ${si+1}`,row,st});
    });
  });
  return out;
}
function openOrderPatternChooser(orderId){
  const o=O().find(x=>x.id===orderId);if(!o)return;
  const linked=orderItemsFor(o).filter(it=>it.patternId&&studioPatternById(it.patternId));
  if(!linked.length)return alert("Link a Final pattern to an item in this order first.");
  if(linked.length===1)return openOrderPatternTracker(orderId,linked[0].lineId);
  openF(`<button class=close onclick=dlg.close()>×</button><h2>Choose Item Pattern</h2>${linked.map(it=>`<button class=pattern-choice-btn onclick="openOrderPatternTracker('${orderId}','${it.lineId}')"><b>${esc(orderItemLabel(it))}</b><span>${esc(studioPatternById(it.patternId)?.name||"Pattern")}</span></button>`).join("")}`);
}
function openOrderPatternTracker(orderId,lineId){
  const o=O().find(x=>x.id===orderId);if(!o)return;
  const it=orderItemsFor(o).find(x=>x.lineId===lineId);if(!it)return;
  const p=studioPatternById(it.patternId);if(!p)return alert("That linked pattern is no longer available.");
  const rows=patternRowsForTracker(p),progress=patternProgressFor(o,lineId),done=rows.filter(r=>progress[r.key]).length;
  const pct=rows.length?Math.round(done/rows.length*100):0;
  let currentSection="";
  const markup=rows.map(r=>{
    const sectionHead=r.section!==currentSection?(currentSection=r.section,`<div class=tracker-section-title>${esc(r.section)}</div>`):"";
    return `${sectionHead}<label class="tracker-row ${progress[r.key]?"done":""}">
      <input type=checkbox ${progress[r.key]?"checked":""} onchange="toggleOrderPatternRow('${orderId}','${lineId}','${encodeURIComponent(r.key)}',this.checked)">
      <div><b>Row ${r.row}</b><span>${studioStepReadable(r.st)}</span></div>
    </label>`;
  }).join("");
  openF(`<button class=close onclick=dlg.close()>×</button><div class=tracker-head><span>ORDER ${esc(o.no)}</span><h2>${esc(orderItemLabel(it))}</h2><p>${esc(p.name)} · ${esc(p.technique)}</p></div>
    <div class=tracker-progress><div><b>${done} of ${rows.length} rows done</b><span>${pct}%</span></div><div class=tracker-progress-track><i style="width:${pct}%"></i></div></div>
    <div class=tracker-tip>${done<rows.length?`Next up: <b>Row ${rows.find(r=>!progress[r.key])?.row||1}</b>`:"Pattern complete 🎉"}</div>
    <div class=tracker-list>${markup||'<div class=empty>No rows in this pattern yet.</div>'}</div>`);
}
function toggleOrderPatternRow(orderId,lineId,keyEncoded,checked){
  const key=decodeURIComponent(keyEncoded);
  const orders=O(),o=orders.find(x=>x.id===orderId);if(!o)return;
  const progress={...(o.patternProgress||{})};
  progress[lineId]={...(progress[lineId]||{}),[key]:checked};
  const updated={...o,patternProgress:progress};
  S("orders",orders.map(x=>x.id===orderId?updated:x));
  openOrderPatternTracker(orderId,lineId);
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
  const items=collectOrderItems();
  const first=items[0]||{};
  return {
    ...base,
    customerId:$("#oc")?.value||base.customerId||"",
    items,
    itemId:first.itemId||"",
    product:orderSummaryProduct(items),
    orderType:items.length>1?"Multiple Items":first.type||"Made to Order",
    customDetails:first.details||"",
    inspirationPhotos:[...draftInspoPhotos],
    size:first.size||"",
    color:first.color||"",
    price:orderItemsTotal(items),
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
  const customers=C();
  const selectedCustomerId=x.customerId||customers.find(c=>String(c.name||"").trim().toLowerCase()===String(x.customer||"").trim().toLowerCase())?.id||"";
  const customerOptions=customers.length
    ? `<option value="">Select a customer</option>${customers.map(c=>`<option value="${c.id}" ${selectedCustomerId===c.id?"selected":""}>${esc(c.name)}${c.phone?" · "+esc(c.phone):""}</option>`).join("")}`
    : `<option value="">No customers saved yet</option>`;
  const orderItems=orderItemsFor(x);
  draftInspoPhotos=Array.isArray(x.inspirationPhotos)?[...x.inspirationPhotos]:[];

  openF(`<h2>${x.id?"Edit":"New"} Order</h2>
  <div class=customer-select-head><label>Customer</label><button type=button class=inline-plus onclick=addCustomerFromOrder() aria-label="Add new customer">＋</button></div>
  <select id=oc ${customers.length?"":"disabled"}>${customerOptions}</select>
  ${customers.length?"":'<div class=customer-help>Add a customer first, then return to New Order.</div>'}

  <div class=order-items-heading><div><h3>Items</h3><span>Add everything they want under one order.</span></div><button type=button onclick=addOrderLine()>＋ Add Another Item</button></div>
  <div id=orderLines></div>
  <div class=order-total-box><span>Order Total</span><b id=orderItemsTotal>${M(orderItemsTotal(orderItems))}</b></div>

  <label>Inspiration photos <span class=meta>(optional · shared with this order)</span></label>
  <div id=inspoPreview class=inspo-grid></div>
  <input id=inspoFiles type=file accept="image/*" multiple onchange="addInspoPhotos(this)">

  <label>Paid</label><input id=opa type=number value="${x.paid||0}">
  <label>Where was this order placed?</label><select id=osrc>${["Not set","Website","Instagram","WhatsApp","In person","Phone","Other"].map(z=>`<option ${x.source==z?"selected":""}>${z}</option>`).join("")}</select>
  <label>Due date</label><input id=od type=date value="${x.due||""}">
  <label>Payment method</label><select id=opay>${["Cash","Bank transfer","Website"].map(z=>`<option ${x.payment==z?"selected":""}>${z}</option>`).join("")}</select>
  <label>Delivery method</label><select id=odel>${dels().map(z=>`<option ${x.delivery==z?"selected":""}>${z}</option>`).join("")}</select>
  <label>Status</label><select id=ost>${["New","In Studio","Ready","Delivered"].map(z=>`<option ${x.status==z?"selected":""}>${z}</option>`).join("")}</select>
  <label>Private order notes</label><textarea id=on>${esc(x.notes||"")}</textarea>
  ${x.id?'<label>Reason for edit</label><input id=reason placeholder="Reason required">':""}
  <button class=primary onclick="saveOrder('${x.id||""}')" ${customers.length?"":"disabled"}>Save Order</button>
  ${x.id&&orderHasPattern(x)?`<button class=pattern-work-btn onclick="saveOrder('${x.id}',true)">Save & Work on Pattern</button>`:""}
  ${x.id?`<button class=invoice-btn onclick="openInvoice('${x.id}')">Create Invoice</button><button class=danger onclick="delOrder('${x.id}')">Delete Order</button>`:""}`);

  renderOrderLines(orderItems);
  renderInspoPreviews();
  if($("#reason")&&x._reason)$("#reason").value=x._reason;
}
function saveOrder(id,openPatternAfter=false){
  let a=O(),old=a.find(x=>x.id==id);
  if(old&&!$("#reason").value.trim())return alert("Add a reason for the edit.");

  const customer=C().find(c=>c.id===oc.value);
  if(!customer)return alert("Select a customer.");

  const items=collectOrderItems();
  if(!items.length)return alert("Add at least one item.");
  for(const it of items){
    if(it.type!=="Custom"&&!it.itemId)return alert("Select an item for each made-to-order line.");
    if(!it.name)return alert("Give each custom item a name.");
  }
  const first=items[0],total=orderItemsTotal(items);
  let seq=+localStorage.getItem("ah_seq")||0;
  const x={
    id:id||crypto.randomUUID(),
    no:old?.no||"AM-"+String(seq+1).padStart(4,"0"),
    customerId:customer.id,
    customer:customer.name,
    items,
    itemId:first.itemId||"",
    product:orderSummaryProduct(items),
    orderType:items.length>1?"Multiple Items":first.type,
    customDetails:first.details||"",
    inspirationPhotos:[...draftInspoPhotos],
    size:first.size||"",
    color:first.color||"",
    price:total,
    paid:+opa.value||0,
    source:osrc.value,
    due:od.value,
    payment:opay.value,
    delivery:odel.value,
    status:ost.value,
    notes:on.value,
    patternProgress:old?.patternProgress||{},
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
  if(openPatternAfter&&orderHasPattern(x)){
    openOrderPatternChooser(x.id);
    return;
  }
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
    ${orderItemsFor(o).map(it=>`<div class=invoice-line>
      <div>
        <b>${esc(orderItemLabel(it))}</b>
        <span>${esc([it.size&&"Size "+it.size,it.color&&it.color].filter(Boolean).join(" · "))}</span>
      </div>
      <b>${M(it.price)}</b>
    </div>`).join("")}

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
  const itemLines=orderItemsFor(o).map(it=>`${orderItemLabel(it)}${it.size?" · Size "+it.size:""}${it.color?" · "+it.color:""} — ${M(it.price)}`).join("\n");
  const text=`Améa Invoice ${"INV-"+o.no}\nCustomer: ${o.customer}\n${itemLines}\nTotal: ${M(o.price)}\nPaid: ${M(o.paid)}\nBalance: ${M(bal)}\n${o.delivery||""}`;
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
    const its=orderItemsFor(o);
    return `<button class=customer-order-row onclick="editOrder('${o.id}')">
      <div><b>${esc(o.no)} · ${esc(orderSummaryProduct(its))}</b><span>${esc(its.map(orderItemLabel).join(" · "))}</span></div>
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
function analyticsDate(value){
  if(!value)return null;
  const d=new Date(value);
  return Number.isNaN(d.getTime())?null:d;
}
function monthsBetweenInclusive(a,b){
  if(!a||!b)return 1;
  return Math.max(1,(b.getFullYear()-a.getFullYear())*12+(b.getMonth()-a.getMonth())+1);
}
function yearsBetweenInclusive(a,b){
  if(!a||!b)return 1;
  return Math.max(1,b.getFullYear()-a.getFullYear()+1);
}
function weeksBetweenInclusive(a,b){
  if(!a||!b)return 1;
  const days=Math.max(0,(b-a)/86400000);
  return Math.max(1,Math.ceil((days+1)/7));
}
function moneyShort(n){
  n=+n||0;
  if(Math.abs(n)>=1000000)return "$"+(n/1000000).toFixed(1).replace(".0","")+"M";
  if(Math.abs(n)>=1000)return "$"+(n/1000).toFixed(1).replace(".0","")+"K";
  return "$"+Math.round(n);
}
function analyticsSpan(){
  const dates=[
    ...O().map(x=>analyticsDate(x.created)),
    ...E().map(x=>analyticsDate(x.date))
  ].filter(Boolean).sort((a,b)=>a-b);
  return {first:dates[0]||new Date(),last:new Date()};
}
function allTimeAverageStats(){
  const span=analyticsSpan();
  const received=O().reduce((a,x)=>a+(+x.paid||0),0);
  return {
    received,
    week:received/weeksBetweenInclusive(span.first,span.last),
    month:received/monthsBetweenInclusive(span.first,span.last),
    year:received/yearsBetweenInclusive(span.first,span.last),
    first:span.first
  };
}
function analyticsMonthRows(count=12){
  const now=new Date(),rows=[];
  for(let offset=count-1;offset>=0;offset--){
    const d=new Date(now.getFullYear(),now.getMonth()-offset,1);
    const y=d.getFullYear(),m=d.getMonth();
    const orders=O().filter(o=>{
      const od=analyticsDate(o.created);
      return od&&od.getFullYear()===y&&od.getMonth()===m;
    });
    const expenses=E().filter(e=>{
      const ed=analyticsDate(e.date);
      return ed&&ed.getFullYear()===y&&ed.getMonth()===m;
    });
    rows.push({
      key:`${y}-${String(m+1).padStart(2,"0")}`,
      label:d.toLocaleDateString("en-JM",{month:"short"}),
      full:d.toLocaleDateString("en-JM",{month:"long",year:"numeric"}),
      revenue:orders.reduce((a,x)=>a+(+x.paid||0),0),
      booked:orders.reduce((a,x)=>a+(+x.price||0),0),
      expenses:expenses.reduce((a,x)=>a+(+x.amount||0),0),
      orders:orders.length
    });
  }
  return rows;
}
function analyticsTrendChart(){
  const rows=analyticsMonthRows(12);
  const max=Math.max(1,...rows.flatMap(x=>[x.revenue,x.expenses]));
  const W=700,H=255,left=54,right=15,top=30,bottom=45,plotW=W-left-right,plotH=H-top-bottom;
  const group=plotW/rows.length,barW=Math.max(8,Math.min(17,group*.28));
  const yAt=n=>top+plotH-(n/max)*plotH;
  const grid=[0,1,2,3,4].map(i=>{
    const val=max-(max*i/4),y=top+(plotH*i/4);
    return `<line x1="${left}" y1="${y}" x2="${left+plotW}" y2="${y}" class=analytics-gridline></line>
      <text x="${left-9}" y="${y+3}" text-anchor=end class=analytics-axis-label>${moneyShort(val)}</text>`;
  }).join("");
  const bars=rows.map((r,i)=>{
    const cx=left+group*i+group/2;
    const revH=(r.revenue/max)*plotH,exH=(r.expenses/max)*plotH;
    return `<g>
      <rect x="${cx-barW-2}" y="${top+plotH-revH}" width="${barW}" height="${Math.max(1,revH)}" rx="4" class=analytics-bar-revenue><title>${esc(r.full)} received: ${M(r.revenue)}</title></rect>
      <rect x="${cx+2}" y="${top+plotH-exH}" width="${barW}" height="${Math.max(1,exH)}" rx="4" class=analytics-bar-expense><title>${esc(r.full)} expenses: ${M(r.expenses)}</title></rect>
      <text x="${cx}" y="${H-20}" text-anchor=middle class=analytics-axis-label>${esc(r.label)}</text>
    </g>`;
  }).join("");
  return `<div class=analytics-chart-shell>
    <div class=analytics-legend><span><i class=legend-revenue></i>Payments received</span><span><i class=legend-expense></i>Expenses</span></div>
    <div class=analytics-chart-scroll><svg class=analytics-main-chart viewBox="0 0 ${W} ${H}" role=img aria-label="Payments received and expenses by month">${grid}${bars}</svg></div>
  </div>`;
}
function startOfAnalyticsWeek(date){
  const d=new Date(date);
  d.setHours(0,0,0,0);
  const day=d.getDay(),diff=day===0?-6:1-day;
  d.setDate(d.getDate()+diff);
  return d;
}
function bestBusinessPeriods(){
  const orders=O(),weekMap={},monthMap={},yearMap={};
  orders.forEach(o=>{
    const d=analyticsDate(o.created); if(!d)return;
    const revenue=+o.paid||0;
    const ws=startOfAnalyticsWeek(d);
    const wk=`${ws.getFullYear()}-${String(ws.getMonth()+1).padStart(2,"0")}-${String(ws.getDate()).padStart(2,"0")}`;
    const mk=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
    const yk=String(d.getFullYear());
    weekMap[wk]=(weekMap[wk]||0)+revenue;
    monthMap[mk]=(monthMap[mk]||0)+revenue;
    yearMap[yk]=(yearMap[yk]||0)+revenue;
  });
  const best=(obj)=>Object.entries(obj).sort((a,b)=>b[1]-a[1])[0]||["",0];
  const [weekKey,weekValue]=best(weekMap);
  const [monthKey,monthValue]=best(monthMap);
  const [yearKey,yearValue]=best(yearMap);
  return {
    weekKey,weekValue,
    monthKey,monthValue,
    yearKey,yearValue
  };
}
function formatWeekKey(key){
  if(!key)return "—";
  const d=new Date(key+"T00:00:00");
  return "Week of "+d.toLocaleDateString("en-JM",{month:"short",day:"numeric",year:"numeric"});
}
function annualSummaryRows(){
  const years=new Set();
  O().forEach(o=>{const d=analyticsDate(o.created);if(d)years.add(d.getFullYear())});
  E().forEach(e=>{const d=analyticsDate(e.date);if(d)years.add(d.getFullYear())});
  if(!years.size)years.add(new Date().getFullYear());
  return [...years].sort((a,b)=>b-a).map(year=>{
    const orders=O().filter(o=>analyticsDate(o.created)?.getFullYear()===year);
    const expenses=E().filter(e=>analyticsDate(e.date)?.getFullYear()===year);
    const revenue=orders.reduce((a,x)=>a+(+x.paid||0),0);
    const booked=orders.reduce((a,x)=>a+(+x.price||0),0);
    const ex=expenses.reduce((a,x)=>a+(+x.amount||0),0);
    return {year,revenue,booked,expenses:ex,profit:revenue-ex,orders:orders.length};
  });
}
function analyticsProgressRows(entries,total,type="pink"){
  if(!entries.length)return '<div class=empty>No data for this period yet.</div>';
  const max=Math.max(1,...entries.map(x=>x[1]));
  return entries.map(([name,value,detail])=>`<div class=analytics-rank>
    <div class=top><b>${esc(name)}</b><span>${detail||value}</span></div>
    <div class=analytics-rank-track><div class="analytics-rank-fill ${type}" style="width:${Math.max(4,(value/max)*100)}%"></div></div>
  </div>`).join("");
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

  const allOrders=O(),allExpenses=E();
  const orders=allOrders.filter(x=>inRange(x.created));
  const expenses=allExpenses.filter(x=>inRange(x.date));
  const received=orders.reduce((a,x)=>a+(+x.paid||0),0);
  const booked=orders.reduce((a,x)=>a+(+x.price||0),0);
  const ex=expenses.reduce((a,x)=>a+(+x.amount||0),0);
  const net=received-ex;
  const outstanding=orders.reduce((a,x)=>a+Math.max(0,(+x.price||0)-(+x.paid||0)),0);
  const avgOrder=orders.length?booked/orders.length:0;
  const margin=received?((net/received)*100):0;

  const sourceCounts={},productStats={},statusCounts={},expenseCats={},customerStats={},paymentCounts={};
  orders.forEach(x=>{
    const src=x.source||"Not set";
    sourceCounts[src]=(sourceCounts[src]||0)+1;
    const lineItems=orderItemsFor(x),totalValue=Math.max(0,orderItemsTotal(lineItems));
    lineItems.forEach(it=>{
      const prod=orderItemLabel(it)||"Unnamed item";
      if(!productStats[prod])productStats[prod]={orders:0,revenue:0};
      productStats[prod].orders++;
      const allocated=totalValue>0?(+x.paid||0)*((+it.price||0)/totalValue):0;
      productStats[prod].revenue+=allocated;
    });
    const st=x.status||"New";
    statusCounts[st]=(statusCounts[st]||0)+1;
    const pay=x.payment||"Not set";
    paymentCounts[pay]=(paymentCounts[pay]||0)+1;
    const cid=x.customerId||x.customer||"Unknown";
    if(!customerStats[cid])customerStats[cid]={name:x.customer||"Customer",orders:0,revenue:0};
    customerStats[cid].orders++;
    customerStats[cid].revenue+=(+x.paid||0);
  });
  expenses.forEach(x=>{
    const cat=x.category||"Other";
    expenseCats[cat]=(expenseCats[cat]||0)+(+x.amount||0);
  });

  const topSources=Object.entries(sourceCounts).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([n,v])=>[n,v,`${v} order${v===1?"":"s"}`]);
  const topProducts=Object.entries(productStats).sort((a,b)=>b[1].revenue-a[1].revenue).slice(0,5).map(([n,v])=>[n,v.revenue,`${v.orders} order${v.orders===1?"":"s"} · ${M(v.revenue)}`]);
  const topCustomers=Object.values(customerStats).sort((a,b)=>b.revenue-a.revenue).slice(0,5).map(v=>[v.name,v.revenue,`${v.orders} order${v.orders===1?"":"s"} · ${M(v.revenue)}`]);
  const expenseRows=Object.entries(expenseCats).sort((a,b)=>b[1]-a[1]).slice(0,6).map(([n,v])=>[n,v,M(v)]);
  const statusRows=Object.entries(statusCounts).sort((a,b)=>b[1]-a[1]).map(([n,v])=>[n,v,`${v}`]);
  const paymentRows=Object.entries(paymentCounts).sort((a,b)=>b[1]-a[1]).map(([n,v])=>[n,v,`${v}`]);

  const allCustomerOrders={};
  allOrders.forEach(x=>{
    const cid=x.customerId||x.customer||"Unknown";
    allCustomerOrders[cid]=(allCustomerOrders[cid]||0)+1;
  });
  const customerIds=Object.keys(allCustomerOrders);
  const repeatCustomers=customerIds.filter(id=>allCustomerOrders[id]>1).length;
  const repeatRate=customerIds.length?(repeatCustomers/customerIds.length*100):0;
  const uniquePeriodCustomers=new Set(orders.map(x=>x.customerId||x.customer).filter(Boolean)).size;

  const averages=allTimeAverageStats();
  const best=bestBusinessPeriods();
  const annualRows=annualSummaryRows();
  const title=range=="month"?monthLabel(monthKey):range=="year"?String(now.getFullYear()):"All Time";

  $("#view").innerHTML=`<h2>Analytics</h2>
  <div class=analytics-intro>Full business performance from the orders and expenses saved in Améa HQ.</div>

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

  <div class="grid analytics-kpi-grid">
    <div class="card analytics-kpi received"><span>Payments received</span><b>${M(received)}</b></div>
    <div class="card analytics-kpi booked"><span>Booked sales</span><b>${M(booked)}</b></div>
    <div class="card analytics-kpi expense"><span>Expenses</span><b>${M(ex)}</b></div>
    <div class="card analytics-kpi profit"><span>Est. cash profit</span><b>${M(net)}</b></div>
    <div class="card analytics-kpi outstanding"><span>Outstanding</span><b>${M(outstanding)}</b></div>
    <div class="card analytics-kpi"><span>Orders</span><b>${orders.length}</b></div>
    <div class="card analytics-kpi"><span>Avg. order value</span><b>${M(avgOrder)}</b></div>
    <div class="card analytics-kpi"><span>Est. margin</span><b>${margin.toFixed(1)}%</b></div>
  </div>

  <div class=section>
    <div class=analytics-section-head><div><h3>Average money received</h3><div class=meta>Based on your full recorded business history, including quiet periods.</div></div></div>
    <div class="grid analytics-average-grid">
      <div class="card average-card"><span>Per week</span><b>${M(averages.week)}</b></div>
      <div class="card average-card"><span>Per month</span><b>${M(averages.month)}</b></div>
      <div class="card average-card"><span>Per year</span><b>${M(averages.year)}</b></div>
      <div class="card average-card"><span>Lifetime received</span><b>${M(averages.received)}</b></div>
    </div>
  </div>

  <div class=section>
    <div class=analytics-section-head><div><h3>12-month money trend</h3><div class=meta>Payments received compared with expenses.</div></div></div>
    ${analyticsTrendChart()}
  </div>

  <div class=section>
    <h3>Strongest periods</h3>
    <div class=analytics-highlight-grid>
      <div class=analytics-highlight><span>Best week</span><b>${best.weekKey?formatWeekKey(best.weekKey):"—"}</b><strong>${M(best.weekValue)}</strong></div>
      <div class=analytics-highlight><span>Best month</span><b>${best.monthKey?monthLabel(best.monthKey):"—"}</b><strong>${M(best.monthValue)}</strong></div>
      <div class=analytics-highlight><span>Best year</span><b>${best.yearKey||"—"}</b><strong>${M(best.yearValue)}</strong></div>
    </div>
  </div>

  <div class=section>
    <h3>Annual summary</h3>
    <div class=annual-table-wrap>
      <table class=annual-table>
        <thead><tr><th>Year</th><th>Received</th><th>Expenses</th><th>Profit</th><th>Orders</th></tr></thead>
        <tbody>${annualRows.map(r=>`<tr><td><b>${r.year}</b></td><td>${M(r.revenue)}</td><td>${M(r.expenses)}</td><td class="${r.profit>=0?"positive":"negative"}">${M(r.profit)}</td><td>${r.orders}</td></tr>`).join("")}</tbody>
      </table>
    </div>
  </div>

  <div class=section>
    <h3>Customers</h3>
    <div class="grid analytics-mini-grid">
      <div class=card>Customers this period<b>${uniquePeriodCustomers}</b></div>
      <div class=card>Repeat customers<b>${repeatCustomers}</b></div>
      <div class=card>Repeat rate<b>${repeatRate.toFixed(0)}%</b></div>
      <div class=card>Avg. received/order<b>${M(orders.length?received/orders.length:0)}</b></div>
    </div>
    <div class=analytics-subtitle>Top customers</div>
    ${analyticsProgressRows(topCustomers,received,"gold")}
  </div>

  <div class=section>
    <h3>Top products</h3>
    ${analyticsProgressRows(topProducts,received,"pink")}
  </div>

  <div class=section>
    <h3>Order status</h3>
    ${analyticsProgressRows(statusRows,orders.length,"pink")}
  </div>

  <div class=section>
    <h3>Where orders came from</h3>
    ${analyticsProgressRows(topSources,orders.length,"gold")}
  </div>

  <div class=section>
    <h3>Payment methods</h3>
    ${analyticsProgressRows(paymentRows,orders.length,"pink")}
  </div>

  <div class=section>
    <h3>Expense breakdown</h3>
    ${analyticsProgressRows(expenseRows,ex,"gold")}
  </div>

  <div class=analytics-note>“Payments received” uses the Paid amount saved on each order. “Est. cash profit” is payments received minus recorded expenses.</div>`;
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
