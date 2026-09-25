'use strict';
/* =====================================================================
   TEACTON customer web app — MVP prototype
   Layers (kept separate so a real backend can replace the mock layer):
   1. CONFIG / CATALOG   – static service catalogue (move to DB later)
   2. DB + Api           – mock persistence & async API (swap with fetch('/api/...'))
   3. Session            – in-memory auth session (no credentials in storage)
   4. Router + Views     – hash router and screen renderers
   5. Actions / Forms    – delegated event handlers
   ===================================================================== */
const LOGO={full:'logo-full.webp',emb:'logo-emblem.webp',word:'logo-wordmark.webp'};
const CONFIG={brand:'TEACTON',tagline:'TECHNOLOGY • PRECISION • RELIABILITY',mockOtp:'123456',otpLength:6,resendSeconds:30,
  demoPhone:'9876543210',serviceHours:{start:7,end:22},supportHours:'8:00 AM – 8:00 PM',
  limits:{photos:5,photoMB:10,videoMB:60,desc:500}};

/* ---------- tiny safe-templating helpers ---------- */
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
class Raw{constructor(s){this.s=s}}
const raw=s=>new Raw(s);
const toS=v=>v instanceof Raw?v.s:Array.isArray(v)?v.map(toS).join(''):(v==null||v===false)?'':esc(v);
const html=(st,...vals)=>{let o=st[0];vals.forEach((v,i)=>{o+=toS(v)+st[i+1]});return new Raw(o)};
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const clean=(v,max=200)=>String(v??'').replace(/[\u0000-\u001F\u007F<>]/g,' ').replace(/\s+/g,' ').trim().slice(0,max);
const cleanText=(v,max=500)=>String(v??'').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F<>]/g,'').replace(/[ \t]+/g,' ').replace(/\n{3,}/g,'\n\n').trim().slice(0,max);

/* ---------- icons ---------- */
const ICON={
bolt:'<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
drop:'<path d="M12 3s6 6.2 6 10.5A6 6 0 0 1 6 13.5C6 9.2 12 3 12 3z"/>',
snow:'<path d="M12 2v20M4.2 7l15.6 10M4.2 17 19.8 7M9 3.5l3 2.5 3-2.5M9 20.5l3-2.5 3 2.5"/>',
fridge:'<rect x="6" y="2.5" width="12" height="19" rx="2"/><path d="M6 10h12M9 6v1.5M9 13v3"/>',
wash:'<rect x="4" y="2.5" width="16" height="19" rx="2"/><circle cx="12" cy="13.5" r="4.5"/><path d="M7.5 6h.01M11 6h6"/>',
plug:'<path d="M9 2v5M15 2v5M6 7h12v4a6 6 0 0 1-12 0zM12 17v5"/>',
tools:'<path d="M14.7 6.3a4 4 0 0 0-5.4 5.1L3 17.7 6.3 21l6.3-6.3a4 4 0 0 0 5.1-5.4l-2.6 2.6-2.4-.6-.6-2.4z"/>',
home:'<path d="M3 11 12 3l9 8M5 9.5V21h5v-6h4v6h5V9.5"/>',
list:'<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>',
help:'<circle cx="12" cy="12" r="9.5"/><path d="M9.2 9.3a2.9 2.9 0 1 1 4.2 2.6c-.9.5-1.4 1-1.4 2M12 17.2h.01"/>',
user:'<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/>',
pin:'<path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
bell:'<path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 21h4"/>',
chev:'<path d="m9 5 7 7-7 7"/>',chevL:'<path d="m15 5-7 7 7 7"/>',chevD:'<path d="m6 9 6 6 6-6"/>',
phone:'<path d="M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2z"/>',
chat:'<path d="M4 5h16v11H9l-5 4z"/>',
camera:'<path d="M4 8h3l2-3h6l2 3h3v12H4z"/><circle cx="12" cy="13.5" r="3.5"/>',
video:'<rect x="3" y="6" width="13" height="12" rx="2"/><path d="m16 10 5-3v10l-5-3"/>',
check:'<path d="m5 12.5 4.5 4.5L19 7.5"/>',
clock:'<circle cx="12" cy="12" r="9.5"/><path d="M12 7v5l3 2"/>',
shield:'<path d="M12 2.5 4 5.5v6c0 5 3.5 8.5 8 10 4.5-1.5 8-5 8-10v-6z"/><path d="m8.5 12 2.5 2.5 4.5-5"/>',
x:'<path d="m6 6 12 12M18 6 6 18"/>',plus:'<path d="M12 5v14M5 12h14"/>',
search:'<circle cx="11" cy="11" r="6.5"/><path d="m16 16 5 5"/>',
star:'<path d="m12 3 2.7 5.8 6.3.7-4.7 4.3 1.3 6.2L12 16.9 6.4 20l1.3-6.2L3 9.5l6.3-.7z" fill="currentColor"/>',
info:'<circle cx="12" cy="12" r="9.5"/><path d="M12 11v6M12 7.5h.01"/>',
trash:'<path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14M10 11v6M14 11v6"/>',
edit:'<path d="M4 20h4L19 9l-4-4L4 16zM14 6l4 4"/>',
card:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M7 15h4"/>',
doc:'<path d="M6 3h8l4 4v14H6zM14 3v4h4M9 12h6M9 16h6"/>',
lock:'<rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
logout:'<path d="M10 4H5v16h5M15 8l4 4-4 4M19 12H9"/>',
headset:'<path d="M4 14v-2a8 8 0 0 1 16 0v2M4 14h3v5H4zM17 14h3v5h-3zM17 19c0 1.5-2 2-5 2"/>',
cal:'<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
alert:'<path d="M12 3 2 20h20zM12 10v4.5M12 17.5h.01"/>',
copy:'<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
send:'<path d="M3 11 21 3l-8 18-2-8z"/>',
upload:'<path d="M12 16V4M7 9l5-5 5 5M4 20h16"/>',
wallet:'<path d="M4 7h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4zM4 7a2 2 0 0 1 2-2h11M16 14h.01"/>',
info2:'<path d="M12 8v4l2 2"/>',
};
const ic=(n,s=22)=>raw(`<svg class="ic" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${ICON[n]||''}</svg>`);

/* =====================================================================
   1. CATALOG
   ===================================================================== */
const P=(id,name,min,max,extra={})=>({id,name,price:[min,max],...extra});
const CATALOG=[
{id:'electrical',name:'Electrical',icon:'bolt',blurb:'Wiring, switches, fans, lights and MCB issues',
 issues:['Not working','Sparking or burning smell','Frequent tripping','Needs replacement','Other'],
 problems:[P('wiring-repair','Wiring Repair',349,899),P('new-wiring','New Wiring',999,4999),
  P('wiring-extension','Wiring Extension',599,1799,{blurb:'Need to extend existing electrical wiring? Tell us what you need and a TEACTON technician will help.',issues:['Extend existing wiring','Add new electrical point','Add switch/socket','Extend wiring to another room','Other']}),
  P('rewiring','Rewiring',1499,7999),P('short-circuit','Short Circuit',449,1299),P('switch-socket','Switch/Socket Repair',249,599),
  P('fan','Fan Problem',249,699,{issues:['Fan not spinning','Slow or noisy','Regulator problem','Needs installation','Other']}),
  P('light','Light Problem',199,599,{issues:['Light not working','Flickering','Needs installation','Other']}),
  P('mcb','MCB/Fuse Problem',299,999,{issues:['MCB keeps tripping','Fuse blown','Needs replacement','Other']}),
  P('other-electrical','Other Electrical Problem',349,1499)]},
{id:'plumbing',name:'Plumbing',icon:'drop',blurb:'Taps, leaks, drains, bathrooms and tanks',
 issues:['Leaking','Blocked or slow','Broken or damaged','Needs installation','Other'],
 problems:[P('tap-repair','Tap Repair',199,599),P('pipe-leak','Pipe Leakage',299,999),P('bathroom-plumbing','Bathroom Plumbing',499,1999),
  P('sink-drain','Sink/Drain Problem',299,899),P('water-tank','Water Tank Problem',399,1499),P('other-plumbing','Other Plumbing Problem',249,999)]},
{id:'ac',name:'AC Services',icon:'snow',blurb:'Repair, servicing, installation and cleaning',
 issues:['Not cooling','Water leaking','Strange noise','Needs regular service','Other'],
 problems:[P('ac-repair','AC Repair',499,1499),P('ac-service','AC Service',499,899),P('ac-install','AC Installation',999,2499),
  P('ac-gas','AC Gas/Performance Issue',999,2999),P('ac-clean','AC Cleaning',499,999)]},
{id:'fridge',name:'Refrigerator',icon:'fridge',blurb:'Cooling, leakage and repair',
 issues:['Not cooling','Water leaking','Noise or vibration','Door or seal issue','Other'],
 problems:[P('fridge-repair','Refrigerator Repair',399,1499),P('fridge-cooling','Cooling Problem',399,1299),P('fridge-leak','Water Leakage',349,999),P('fridge-other','Other Refrigerator Problem',349,1199)]},
{id:'washer',name:'Washing Machine',icon:'wash',blurb:'Drainage, start-up and repair',
 issues:['Not starting','Not draining','Noise or vibration','Water leaking','Other'],
 problems:[P('washer-repair','Washing Machine Repair',399,1299),P('washer-drain','Drainage Problem',349,999),P('washer-start','Not Starting',349,1099),P('washer-other','Other Washing Machine Problem',349,1199)]},
{id:'appliances',name:'Other Appliances',icon:'plug',blurb:'Microwave, geyser, purifier, TV and more',
 issues:['Not working','Not heating or cooling','Noise or smell','Needs installation','Other'],
 problems:[P('microwave','Microwave',349,1199),P('geyser','Geyser',349,1299),P('purifier','Water Purifier',349,999),P('tv','Television',399,1499),P('other-appliance','Other Appliance',349,1299)]},
{id:'install',name:'Installation & Assembly',icon:'tools',blurb:'Appliances, fans, lights and furniture',
 issues:['New installation','Move or re-install','Assembly needed','Other'],
 problems:[P('appliance-install','Appliance Installation',399,999),P('fan-install','Fan Installation',249,599),P('light-install','Light Installation',199,599),P('furniture','Furniture Assembly',399,1499),P('other-install','Other Installation',299,1299)]}
];
const svcById=id=>CATALOG.find(c=>c.id===id);
const probOf=(cid,pid)=>svcById(cid)?.problems.find(p=>p.id===pid);
const issuesOf=(cid,pid)=>probOf(cid,pid)?.issues||svcById(cid)?.issues||['Not working','Needs replacement','Other'];
const blurbOf=(cid,pid)=>probOf(cid,pid)?.blurb||'Tell us what you need and a TEACTON technician will help.';
const SLOTS=[{id:'s1',label:'9:00 AM – 11:00 AM',start:9},{id:'s2',label:'11:00 AM – 1:00 PM',start:11},{id:'s3',label:'2:00 PM – 4:00 PM',start:14},{id:'s4',label:'4:00 PM – 6:00 PM',start:16},{id:'s5',label:'6:00 PM – 8:00 PM',start:18}];
const STATUSES=[{k:'received',l:'Booking Received'},{k:'assigned',l:'Technician Assigned'},{k:'on_the_way',l:'Technician On The Way'},{k:'arrived',l:'Technician Arrived'},{k:'in_progress',l:'Service In Progress'},{k:'completed',l:'Completed'}];
const STATES=['Andhra Pradesh','Assam','Bihar','Chandigarh','Chhattisgarh','Delhi','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Odisha','Punjab','Rajasthan','Tamil Nadu','Telangana','Uttar Pradesh','Uttarakhand','West Bengal','Other'];
const TECHS={
 t1:{id:'t1',name:'Suresh Kumar',rating:4.8,jobs:640,years:7,spec:'Electrical & wiring specialist',cats:['electrical','install']},
 t2:{id:'t2',name:'Imran Sheikh',rating:4.7,jobs:512,years:6,spec:'Plumbing & bathroom fittings',cats:['plumbing']},
 t3:{id:'t3',name:'Anil Nair',rating:4.9,jobs:780,years:9,spec:'AC & refrigerator technician',cats:['ac','fridge']},
 t4:{id:'t4',name:'Deepak Yadav',rating:4.6,jobs:430,years:5,spec:'Washing machines & home appliances',cats:['washer','appliances']}};

/* =====================================================================
   formatting
   ===================================================================== */
const money=n=>'₹'+Number(n).toLocaleString('en-IN');
const priceRange=p=>`${money(p[0])} – ${money(p[1])}`;
const isoDay=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const fromIso=s=>new Date(s+'T00:00:00');
const fmtDate=s=>fromIso(s).toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short',year:'numeric'});
const fmtStamp=t=>new Date(t).toLocaleString('en-IN',{day:'numeric',month:'short',hour:'numeric',minute:'2-digit'});
const initials=n=>(String(n||'').trim().split(/\s+/).slice(0,2).map(w=>w[0]).join('')||'TC').toUpperCase();
const addrLine=a=>[a.house,a.street,a.area,`${a.city}, ${a.state} ${a.pin}`].filter(Boolean).join(', ')+(a.landmark?` (Near ${a.landmark})`:'');
const maskPhone=p=>p.slice(0,2)+'•••••'+p.slice(-3);
const hash=s=>[...s].reduce((a,c)=>(a*31+c.charCodeAt(0))>>>0,7);
const wait=ms=>new Promise(r=>setTimeout(r,ms));

/* =====================================================================
   2. DB + Api (mock). Replace method bodies with real HTTP calls later.
   ===================================================================== */
const DB={key:'teacton.mvp.v1',mem:null,
 load(){if(this.mem)return this.mem;let d=null;try{d=JSON.parse(localStorage.getItem(this.key)||'null')}catch(e){}
  this.mem=d&&d.customers?d:{customers:{},seq:122,tickets:40};return this.mem},
 save(){try{localStorage.setItem(this.key,JSON.stringify(this.mem))}catch(e){}}};
const nextId=()=>{const d=DB.load();d.seq++;return `TCT-${new Date().getFullYear()}-${String(d.seq).padStart(6,'0')}`};
const nextTicket=p=>{const d=DB.load();d.tickets++;return `${p}-${new Date().getFullYear()}-${String(d.tickets).padStart(6,'0')}`};
const assignTech=cid=>Object.values(TECHS).find(t=>t.cats.includes(cid))||TECHS.t1;

function seedCustomer(phone){
 const now=Date.now(),day=864e5,addD=n=>isoDay(new Date(now+n*day));
 const mk=(o)=>{const pr=probOf(o.cat,o.pid);return{id:o.id,cat:o.cat,pid:o.pid,service:svcById(o.cat).name,problem:pr.name,issue:o.issue,description:o.desc,media:{photos:o.photos||0,video:false},
  addressId:o.addr,mode:o.mode,date:o.date,slotId:o.slot||null,slotLabel:o.slot?SLOTS.find(s=>s.id===o.slot).label:'As soon as possible',price:pr.price,status:o.status,techId:o.tech||null,
  history:o.hist,createdAt:o.created,cancelReason:o.reason||''}};
 const c={phone,name:'Rohan Mehta',email:'rohan.mehta@example.com',gender:'',profileDone:true,locId:'a1',expert:[],tickets:[],
  addresses:[
   {id:'a1',type:'Home',name:'Rohan Mehta',mobile:phone,house:'Flat 402',street:'Lakeview Residency, 5th Cross',area:'Koramangala',city:'Bengaluru',state:'Karnataka',pin:'560034',landmark:'Forum Mall',isDefault:true},
   {id:'a2',type:'Work',name:'Rohan Mehta',mobile:phone,house:'Tower B, 3rd Floor',street:'Tech Park Road',area:'Outer Ring Road',city:'Bengaluru',state:'Karnataka',pin:'560103',landmark:'',isDefault:false}],
  bookings:[
   mk({id:'TCT-2026-000121',cat:'ac',pid:'ac-service',issue:'Needs regular service',desc:'Bedroom split AC has not been serviced for a year.',addr:'a1',mode:'later',date:addD(3),slot:'s2',status:'assigned',tech:'t3',created:now-2*3600e3,
     hist:[{s:'received',at:now-2*3600e3},{s:'assigned',at:now-2*3600e3+9e5}]}),
   mk({id:'TCT-2026-000119',cat:'fridge',pid:'fridge-leak',issue:'Water leaking',desc:'Water collecting under the vegetable tray.',addr:'a1',mode:'later',date:addD(-9),slot:'s3',status:'cancelled',created:now-11*day,reason:'Booked by mistake',
     hist:[{s:'received',at:now-11*day},{s:'cancelled',at:now-10*day}]}),
   mk({id:'TCT-2026-000118',cat:'plumbing',pid:'tap-repair',issue:'Leaking',desc:'Kitchen tap drips continuously.',addr:'a2',mode:'later',date:addD(-14),slot:'s1',status:'completed',tech:'t2',created:now-16*day,photos:1,
     hist:[{s:'received',at:now-16*day},{s:'assigned',at:now-16*day+6e5},{s:'on_the_way',at:now-14*day},{s:'arrived',at:now-14*day+1.5e6},{s:'in_progress',at:now-14*day+1.8e6},{s:'completed',at:now-14*day+4.2e6}]})]};
 return c}

const Api={
 async requestOtp(phone){await wait(450);return{ok:true,ttl:CONFIG.resendSeconds}},
 async verifyOtp(phone,code){await wait(450);return code===CONFIG.mockOtp?{ok:true,token:'mock.'+Math.random().toString(36).slice(2)}:{ok:false}},
 async getCustomer(phone){await wait(150);const d=DB.load();if(!d.customers[phone]){d.customers[phone]=phone===CONFIG.demoPhone?seedCustomer(phone):{phone,name:'',email:'',gender:'',profileDone:false,locId:null,expert:[],tickets:[],addresses:[],bookings:[]};DB.save()}
  const c=d.customers[phone];c.bookings.filter(b=>b.status==='received'&&Date.now()-b.createdAt>2500).forEach(b=>Api._assign(b,true));return c},
 slots(iso){const now=new Date(),today=isoDay(now)===iso;return SLOTS.map(s=>({...s,state:today&&s.start<=now.getHours()?'past':hash(iso+s.id)%5===0?'full':'open'}))},
 nowAvailable(){const h=new Date().getHours();return h>=CONFIG.serviceHours.start&&h<CONFIG.serviceHours.end},
 async saveAddress(u,a){await wait(150);a.id='a'+Date.now().toString(36);if(!u.addresses.length)a.isDefault=true;if(a.isDefault)u.addresses.forEach(x=>x.isDefault=false);u.addresses.push(a);DB.save();return a},
 async deleteAddress(u,id){u.addresses=u.addresses.filter(a=>a.id!==id);if(u.addresses.length&&!u.addresses.some(a=>a.isDefault))u.addresses[0].isDefault=true;DB.save()},
 async createBooking(u,w){await wait(900);
  const pr=probOf(w.cat,w.pid),ad=u.addresses.find(a=>a.id===w.addressId),now=Date.now();
  if(!pr||!ad)throw new Error('invalid');
  const later=w.mode==='later',sl=SLOTS.find(s=>s.id===w.slot);
  const b={id:nextId(),cat:w.cat,pid:w.pid,service:svcById(w.cat).name,problem:pr.name,issue:w.issue,description:cleanText(w.desc,CONFIG.limits.desc),
   media:{photos:w.photos.length,video:!!w.video},addressId:ad.id,addressSnap:{...ad},mode:w.mode,date:later?w.date:isoDay(new Date()),slotId:later?sl.id:null,
   slotLabel:later?sl.label:'As soon as possible',price:pr.price,status:'received',techId:null,history:[{s:'received',at:now}],createdAt:now,cancelReason:''};
  u.bookings.unshift(b);DB.save();
  setTimeout(()=>Api._assign(b),2500);return b},
 _assign(b,silent){if(b.status!=='received')return;b.techId=assignTech(b.cat).id;b.status='assigned';b.history.push({s:'assigned',at:Date.now()});DB.save();if(!silent)Bus.changed(b.id)},
 async advance(b){const i=STATUSES.findIndex(s=>s.k===b.status);if(i<0||i>=STATUSES.length-1)return;const n=STATUSES[i+1].k;
  if(n==='assigned'&&!b.techId)b.techId=assignTech(b.cat).id;b.status=n;b.history.push({s:n,at:Date.now()});DB.save();Bus.changed(b.id)},
 async cancelBooking(b,reason){await wait(400);b.status='cancelled';b.cancelReason=clean(reason,80);b.history.push({s:'cancelled',at:Date.now()});DB.save()},
 async createExpert(u,r){await wait(600);const rec={id:nextTicket('EXP'),...r,at:Date.now()};u.expert.unshift(rec);DB.save();return rec},
 async createTicket(u,r){await wait(500);const rec={id:nextTicket('TCK'),...r,at:Date.now()};u.tickets.unshift(rec);DB.save();return rec},
 async updateProfile(u,p){await wait(200);u.name=p.name;u.email=p.email;u.gender=p.gender||'';u.profileDone=true;DB.save()}
};
const Bus={changed(id){if(Route.params&&Route.params.id===id&&['confirmed','booking'].includes(Route.name))render({soft:true});else if(Route.name==='bookings'||Route.name==='home')render({soft:true})}};

/* =====================================================================
   3. Session (memory only: no tokens or credentials are persisted)
   ===================================================================== */
const Session={token:null,user:null,phone:null,next:null,attempts:0,lockUntil:0,notifSeen:false};
const UI={tab:'active',exp:{method:'call',desc:'',photos:[],video:null,phone:'',when:'asap',errors:{},done:null},chats:{}};
const Timers=[];const T=id=>(Timers.push(id),id);const clearTimers=()=>{Timers.splice(0).forEach(id=>{clearTimeout(id);clearInterval(id)})};
const urlCache=new WeakMap();const urlOf=f=>{if(!urlCache.has(f))urlCache.set(f,URL.createObjectURL(f));return urlCache.get(f)};

/* =====================================================================
   Booking wizard state
   ===================================================================== */
const Wiz={s:null,
 reset(o={}){this.s={step:o.p?3:o.cat?2:1,cat:o.cat||null,pid:o.p||null,issue:'',desc:'',photos:[],video:null,addressId:null,mode:null,date:null,slot:null,errors:{}};
  const u=Session.user;if(u){const d=u.addresses.find(a=>a.id===u.locId)||u.addresses.find(a=>a.isDefault)||u.addresses[0];if(d)this.s.addressId=d.id}}};
const STEP_TITLES=['Service','Problem','Details','Photo & video','Address','Date & time','Review'];

/* =====================================================================
   4. Views
   ===================================================================== */
const NAV=[['home','#/home','Home','home'],['services','#/services','Services','tools'],['bookings','#/bookings','Bookings','list'],['expert','#/expert','Talk to an Expert','headset'],['help','#/help','Help','help'],['profile','#/profile','Profile','user']];
const cur=(a,k)=>a===k?'aria-current="page"':'';
function brand(href){return html`<a class="brand" href="${href}" aria-label="TEACTON home"><img class="emb logo-img" src="${LOGO.emb}" width="40" height="39" alt="TEACTON technician emblem"><img class="wm logo-img" src="${LOGO.word}" width="160" height="18" alt="TEACTON"></a>`}
function locLabel(){const u=Session.user;if(!u)return'Select location';const a=u.addresses.find(x=>x.id===u.locId)||u.addresses.find(x=>x.isDefault)||u.addresses[0];return a?a.city:'Add location'}
function events(){const u=Session.user;if(!u)return[];const out=[];const msg={received:'Booking received',assigned:'Technician assigned',on_the_way:'Technician is on the way',arrived:'Technician has arrived',in_progress:'Service in progress',completed:'Service completed',cancelled:'Booking cancelled'};
 u.bookings.forEach(b=>b.history.forEach(h=>out.push({at:h.at,t:msg[h.s],sub:`${b.service} · ${b.problem} · ${b.id}`,id:b.id})));return out.sort((a,b)=>b.at-a.at).slice(0,8)}
function header(active){const u=Session.user;
 return html`<header class="hdr"><div class="wrap hdr-in">${brand('#/home')}
 <button class="loc d" data-a="loc" aria-label="Service location: ${locLabel()}">${ic('pin',18)}<span>${locLabel()}</span>${ic('chevD',16)}</button>
 <div class="hdr-right"><button class="iconbtn" data-a="notif" aria-label="Notifications">${ic('bell',20)}${events().length&&!Session.notifSeen?html`<span class="dot"></span>`:''}</button>
 <a class="avatar" href="#/profile" aria-label="Profile">${initials(u.name||'Customer')}</a></div></div>
 ${active==='home'?html`<div class="wrap hdr-sub"><button class="loc" data-a="loc" aria-label="Service location: ${locLabel()}">${ic('pin',18)}<span>${locLabel()}</span><span style="margin-left:auto">${ic('chevD',16)}</span></button></div>`:''}</header>`}
function sidebar(active){const u=Session.user;
 return html`<aside class="side"><a class="side-logo" href="#/home" aria-label="TEACTON home"><img src="${LOGO.full}" width="220" height="170" alt="TEACTON — Technology, Precision, Reliability"></a>
 <nav aria-label="Main">${NAV.map(n=>html`<a href="${n[1]}" ${raw(cur(active,n[0]))}>${ic(n[3],20)}<span>${n[2]}</span></a>`)}</nav>
 <div class="side-foot"><a class="side-user" href="#/profile"><span class="avatar">${initials(u.name||'Customer')}</span><span><b>${u.name||'TEACTON Customer'}</b><small>+91 ${u.phone}</small></span></a></div></aside>`}
function bottomNav(active){return html`<nav class="bnav" aria-label="Primary">${[NAV[0],NAV[2],NAV[4],NAV[5]].map(n=>html`<a href="${n[1]}" ${raw(cur(active,n[0]))}>${ic(n[3],24)}<span>${n[2]}</span></a>`)}</nav>`}
function footer(){const li=Session.token;
 return html`<footer class="foot"><div class="wrap foot-in"><div><img class="logo-img" src="${LOGO.full}" width="150" height="116" alt="TEACTON — Technology, Precision, Reliability" loading="lazy"><p class="tag">${CONFIG.tagline}</p></div>
 <div><h4>Quick Links</h4><ul><li><a href="${li?'#/home':'#/login'}">Home</a></li><li><a href="#/services">Services</a></li><li><a href="#/bookings">Bookings</a></li><li><a href="#/help">Help</a></li><li><a href="#/about">About</a></li></ul></div>
 <div><h4>Legal</h4><ul><li><a href="#/privacy">Privacy Policy</a></li><li><a href="#/terms">Terms &amp; Conditions</a></li></ul></div>
 <div><h4>Support</h4><ul><li><a href="#/expert">Talk to an Expert</a></li><li><a href="#" data-a="support-chat">Customer Support</a></li></ul></div>
 </div><div class="wrap"><div class="copy">© 2026 TEACTON. All rights reserved.</div></div></footer>`}
function shell(inner,{nav='',wiz=false,cls=''}={}){
 return html`<a class="skip" href="#main">Skip to content</a><div class="app">${sidebar(nav)}<div class="content">${header(nav)}<main id="main" tabindex="-1" class="wrap"><div class="page ${cls}">${inner}</div></main>${footer()}</div></div>${wiz?'':bottomNav(nav)}`}
function pubShell(inner){return html`<a class="skip" href="#main">Skip to content</a><header class="hdr"><div class="wrap hdr-in">${brand('#/login')}<div class="hdr-right"><a class="btn sm" href="#/login">Log in</a></div></div></header><main id="main" tabindex="-1" class="wrap"><div class="page">${inner}</div></main>${footer()}`}
const anyShell=(inner,o)=>Session.token?shell(inner,o):pubShell(inner);
const back=(href,label='Back')=>html`<a class="crumb" href="${href}">${ic('chevL',18)}${label}</a>`;

function trust(){return html`<div class="trust">${[['shield','Verified Technicians'],['doc','Transparent Service'],['clock','Fast Booking'],['headset','Customer Support']].map(t=>html`<div class="t">${ic(t[0],24)}<b>${t[1]}</b></div>`)}</div>`}
function svcCard(c,i,tag='a'){const inner=html`<span class="tile">${ic(c.icon,26)}</span><b>${c.name}</b><small>${c.blurb}</small>`;
 return tag==='a'?html`<a class="svc" data-cat="${c.id}" href="#/book/${c.id}" data-a="start" data-c="${c.id}">${inner}</a>`
  :html`<button type="button" class="svc" data-cat="${c.id}" data-a="wiz-cat" data-c="${c.id}">${inner}</button>`}

/* ---- login / otp (split layout: logo panel on the side) ---- */
function authSplit(form){
 return html`<a class="skip" href="#main">Skip to content</a><div class="split"><section class="split-brand" aria-label="TEACTON"><img class="split-logo" src="${LOGO.full}" width="400" height="306" alt="TEACTON logo: a technician holding a lightning bolt and screwdriver. Technology, Precision, Reliability.">
 <div class="pitch"><h2>Reliable technical services at your doorstep.</h2><p>Book trusted technicians for electrical, plumbing, AC and appliance services.</p>
 <ul class="pts">${['Verified Technicians','Transparent Service','Fast Booking','Customer Support'].map(t=>html`<li>${ic('check',20)}${t}</li>`)}</ul></div></section>
 <main id="main" tabindex="-1" class="split-form"><div class="fbox">${form}</div></main></div>`}
function VLogin(){
 return authSplit(html`<h1 class="h1">Welcome to TEACTON</h1><p class="sub">Reliable technical services at your doorstep.</p>
 <form data-f="login" novalidate style="margin-top:24px"><div class="field"><label for="ph">Mobile number</label>
  <div class="phone"><span class="cc" aria-hidden="true">+91</span><input class="input" id="ph" name="phone" type="tel" inputmode="numeric" autocomplete="tel-national" maxlength="10" placeholder="Mobile Number" value="${CONFIG.demoPhone}" aria-describedby="ph-h"></div>
  <div class="hint" id="ph-h">We'll send a 6-digit OTP to verify your number.</div></div>
 <button class="btn block" type="submit">Continue</button></form>
 <p class="hint" style="margin-top:16px">By continuing, you agree to our <a href="#/terms">Terms &amp; Conditions</a> and <a href="#/privacy">Privacy Policy</a>.</p>
 <div class="notice" style="margin-top:22px">${ic('info',18)}<span>Prototype mode: the demo number is prefilled and any OTP request will accept <b>${CONFIG.mockOtp}</b>.</span></div>`)}
function VOtp(){
 if(!Session.phone)return VLogin();
 return authSplit(html`<h1 class="h1">Verify your number</h1><p class="sub">Enter the 6-digit OTP sent to your mobile number.</p><p class="hint">Sent to +91 ${maskPhone(Session.phone)}</p>
 <form data-f="otp" novalidate style="margin-top:22px"><fieldset style="border:0;padding:0;margin:0"><legend class="sr">6-digit OTP</legend>
 <div class="otp" id="otp">${[0,1,2,3,4,5].map(i=>html`<input inputmode="numeric" autocomplete="${i===0?'one-time-code':'off'}" maxlength="1" aria-label="OTP digit ${i+1}" data-i="${i}">`)}</div></fieldset>
 <div class="err" id="otp-err" role="alert" hidden></div>
 <button class="btn block" type="submit" style="margin-top:20px">Verify OTP</button></form>
 <div style="margin-top:8px"><button class="linkbtn" id="resend" data-a="resend" disabled>Resend OTP</button> · <button class="linkbtn" data-a="change-phone">Change phone number</button></div>
 <div class="notice" style="margin-top:18px">${ic('info',18)}<span>Prototype mode: enter <b>${CONFIG.mockOtp}</b> to continue.</span></div>`)}

/* ---- optional profile step after OTP ---- */
const GENDERS=['Male','Female','Other','Prefer not to say'];
function VWelcome(){const u=Session.user;
 return authSplit(html`<h1 class="h1">Tell us about you</h1><p class="sub">All fields are optional. You can change them anytime in your profile.</p>
 <form data-f="welcome" novalidate style="margin-top:22px">
 <div class="field"><label for="wn">Full name <span class="hint" style="display:inline">(optional)</span></label><input class="input" id="wn" name="name" autocomplete="name" maxlength="60" placeholder="Your name" value="${u.name}"></div>
 <fieldset class="field" style="border:0;padding:0;margin:0 0 16px"><legend class="lbl">Gender <span class="hint" style="display:inline">(optional)</span></legend>
 <div class="chips">${GENDERS.map(g=>html`<label class="chip"><input class="sr" type="radio" name="gender" value="${g}" ${raw(u.gender===g?'checked':'')}>${g}</label>`)}</div></fieldset>
 <div class="field"><label for="we">Email ID <span class="hint" style="display:inline">(optional)</span></label><input class="input" id="we" name="email" type="email" autocomplete="email" maxlength="100" placeholder="name@example.com" value="${u.email}"></div>
 <button class="btn block" type="submit">Save &amp; Continue</button></form>
 <div style="margin-top:8px;text-align:center"><button class="linkbtn" data-a="skip-welcome">Skip for now</button></div>`)}

/* ---- home ---- */
function VHome(){const u=Session.user;const act=u.bookings.filter(b=>['active','upcoming'].includes(bucket(b))).sort((a,b)=>b.createdAt-a.createdAt)[0];
 return shell(html`<div class="stack"><div class="herocard"><img class="hero-emb logo-img" src="${LOGO.emb}" width="150" height="145" alt="TEACTON technician"><div class="hero-body"><h1 class="h1">How can we help you today?</h1><p class="sub">Book trusted technicians for your home.</p>
 <div class="searchbox"><span aria-hidden="true">${ic('search',20)}</span><label class="sr" for="q">Search for a problem</label><input class="input" id="q" data-search type="search" placeholder="Search a problem, e.g. fan, tap, AC" autocomplete="off"></div></div></div>
 <div id="sr" class="stack" aria-live="polite"></div>
 ${act?html`<a class="bk" href="#/booking/${act.id}" style="margin:0"><div class="bk-top"><div><b class="t">${act.service}: ${act.problem}</b><div class="id">${act.id}</div></div>${statusBadge(act)}</div><p class="hint" style="margin-top:10px">${act.mode==='later'?`${fmtDate(act.date)} · ${act.slotLabel}`:'Service requested now'} · Tap to track</p></a>`:''}
 <section><div class="sec-head"><h2 class="sec-title">Our services</h2></div><div class="svc-grid">${CATALOG.map(c=>svcCard(c,0))}
 <a class="svc alt" href="#/expert"><span class="tile">${ic('headset',24)}</span><b>Talk to an Expert</b><small>Not sure what's wrong? Our technical team can help.</small></a></div>
 <div style="margin-top:16px"><a class="btn ghost" href="#/services">View All Services</a></div></section>
 <section>${trust()}</section></div>`,{nav:'home'})}
function VServices(){
 return shell(html`<div class="stack"><div><h1 class="h1">All services</h1><p class="sub">Choose a problem to start your booking.</p></div>
 ${CATALOG.map(c=>html`<section class="svc-block card"><h3>${ic(c.icon,24)}${c.name}</h3><div class="chips">${c.problems.map(p=>html`<a class="chip" href="#/book/${c.id}/${p.id}" data-a="start" data-c="${c.id}" data-p="${p.id}">${p.name}</a>`)}</div></section>`)}
 <div class="banner">${ic('help',34)}<div><h3>Can't find your service?</h3><p>Describe it to our experts and we'll guide you.</p></div><a class="btn gold" href="#/expert">Talk to an Expert</a></div></div>`,{nav:'services'})}

/* ---- booking wizard ---- */
function uploadBlock(st,target){
 const photos=st.photos||[],v=st.video;
 return html`<div class="upl"><label class="upl-tile" for="f-${target}-photo">${ic('camera',30)}Upload Photo<small>Optional · up to ${CONFIG.limits.photos} photos, ${CONFIG.limits.photoMB} MB each</small></label>
 <input class="sr" id="f-${target}-photo" type="file" accept="image/*" multiple data-file="photo" data-target="${target}">
 <label class="upl-tile" for="f-${target}-video">${ic('video',30)}Upload Video<small>Optional · one video, up to ${CONFIG.limits.videoMB} MB</small></label>
 <input class="sr" id="f-${target}-video" type="file" accept="video/*" data-file="video" data-target="${target}"></div>
 ${photos.length||v?html`<div class="previews">${photos.map((f,i)=>html`<div class="prev"><img src="${urlOf(f)}" alt="Uploaded photo ${i+1}"><button type="button" data-a="rm-file" data-t="${target}" data-k="photo" data-i="${i}" aria-label="Remove photo ${i+1}">${ic('x',16)}</button></div>`)}
 ${v?html`<div class="prev"><video src="${urlOf(v)}" muted playsinline aria-label="Uploaded video preview"></video><button type="button" data-a="rm-file" data-t="${target}" data-k="video" aria-label="Remove video">${ic('x',16)}</button></div>`:''}</div>`:''}`}
function fieldErr(e,id){return e?html`<div class="err" id="${id}" role="alert">${ic('alert',16)}<span>${e}</span></div>`:''}
function stepBody(s){const e=s.errors||{};
 if(s.step===1)return html`<h1 class="h2">Which service do you need?</h1><p class="sub">Select a category to continue.</p><div class="svc-grid" style="margin-top:16px">${CATALOG.map(c=>svcCard(c,-1,'button'))}</div>`;
 const c=svcById(s.cat);
 if(s.step===2)return html`<h1 class="h2">What do you need help with?</h1><p class="sub">${c.name}</p><div role="radiogroup" aria-label="Problem" style="margin-top:16px">${c.problems.map(p=>html`<button type="button" role="radio" class="opt" aria-checked="${s.pid===p.id?'true':'false'}" data-a="wiz-problem" data-id="${p.id}"><span class="radio"></span><span class="ttl">${p.name}</span><span class="go">${ic('chev',18)}</span></button>`)}</div>`;
 if(s.step===3){const p=probOf(s.cat,s.pid);
  return html`<h1 class="h2">${p.name}</h1><p class="sub">${blurbOf(s.cat,s.pid)}</p>
  <h2 class="h3" style="font-size:18px;margin:22px 0 10px" id="q-prob">What is the problem?</h2><div role="radiogroup" aria-labelledby="q-prob">${issuesOf(s.cat,s.pid).map(o=>html`<button type="button" role="radio" class="opt" aria-checked="${s.issue===o?'true':'false'}" data-a="wiz-issue" data-v="${o}"><span class="radio"></span><span class="ttl">${o}</span></button>`)}</div>${fieldErr(e.issue,'e-issue')}
  <div class="field" style="margin-top:18px"><label for="desc">Describe your problem</label><textarea class="textarea" id="desc" maxlength="${CONFIG.limits.desc}" data-bind="wiz.desc" ${raw(e.desc?'aria-invalid="true" aria-describedby="e-desc"':'')} placeholder="For example: which room, what happened, and when it started.">${s.desc}</textarea>${fieldErr(e.desc,'e-desc')}<div class="hint"><span id="cnt">${s.desc.length}</span>/${CONFIG.limits.desc}</div></div>`}
 if(s.step===4)return html`<h1 class="h2">Add a photo or video</h1><p class="sub">Optional, but it helps the technician prepare.</p><div style="margin-top:16px">${uploadBlock(s,'wiz')}</div>`;
 if(s.step===5){const u=Session.user;
  return html`<h1 class="h2">Where should the technician come?</h1><p class="sub">Select an address.</p><div role="radiogroup" aria-label="Address" style="margin-top:16px">
  ${u.addresses.map(a=>html`<button type="button" role="radio" class="addr" aria-checked="${s.addressId===a.id?'true':'false'}" data-a="wiz-addr" data-id="${a.id}" style="cursor:pointer;${s.addressId===a.id?'border-color:var(--blue);box-shadow:inset 0 0 0 1px var(--blue)':''}"><span class="badge blue">${a.type}</span><span style="flex:1"><b>${a.name}</b><p>${addrLine(a)}</p></span>${s.addressId===a.id?ic('check',22):''}</button>`)}</div>
  ${u.addresses.length?'':html`<div class="empty"><h3>No saved addresses</h3><p>Add an address to continue.</p></div>`}
  <button class="btn ghost" type="button" data-a="add-addr" data-after="wiz" style="margin-top:6px">${ic('plus',18)}Add New Address</button>${fieldErr(e.addr,'e-addr')}`}
 if(s.step===6){const now=Api.nowAvailable(),days=[...Array(7)].map((_,i)=>new Date(Date.now()+i*864e5));
  return html`<h1 class="h2">When do you need the service?</h1><div role="radiogroup" aria-label="Service timing" style="margin-top:16px">
  <button type="button" role="radio" class="opt" aria-checked="${s.mode==='now'?'true':'false'}" data-a="wiz-mode" data-v="now" ${raw(now?'':'aria-disabled="true"')}><span class="radio"></span><span><span class="ttl">Need service now</span><small>We'll assign the next available technician.</small></span></button>
  <button type="button" role="radio" class="opt" aria-checked="${s.mode==='later'?'true':'false'}" data-a="wiz-mode" data-v="later"><span class="radio"></span><span><span class="ttl">Schedule for later</span><small>Pick a date and time slot.</small></span></button></div>
  ${!now?html`<div class="notice err">${ic('alert',18)}<span><b>No technician is currently available.</b> We'll notify you when a technician becomes available, or you can schedule for later.</span></div>`:''}
  ${s.mode==='later'?html`<h2 style="font-size:18px;margin:22px 0 8px" id="q-date">Select date</h2><div class="days" role="group" aria-labelledby="q-date">${days.map(d=>{const iso=isoDay(d);return html`<button type="button" class="day" aria-pressed="${s.date===iso?'true':'false'}" data-a="wiz-date" data-v="${iso}"><small>${d.toLocaleDateString('en-IN',{weekday:'short'})}</small>${d.getDate()}<small>${d.toLocaleDateString('en-IN',{month:'short'})}</small></button>`})}</div>
   ${s.date?html`<h2 style="font-size:18px;margin:14px 0 10px" id="q-slot">Select time slot</h2><div class="slots" role="group" aria-labelledby="q-slot">${Api.slots(s.date).map(sl=>html`<button type="button" class="slot" aria-pressed="${s.slot===sl.id?'true':'false'}" data-a="wiz-slot" data-v="${sl.id}" ${raw(sl.state!=='open'?'disabled':'')}>${sl.label}<small>${sl.state==='open'?'Available':sl.state==='full'?'Fully booked':'Time has passed'}</small></button>`)}</div>`:''}`:''}
  ${fieldErr(e.time,'e-time')}`}
 if(s.step===7)return reviewBody(s)}
function reviewBody(s){const u=Session.user,a=u.addresses.find(x=>x.id===s.addressId),p=probOf(s.cat,s.pid),c=svcById(s.cat);
 const later=s.mode==='later',sl=SLOTS.find(x=>x.id===s.slot),media=[s.photos.length?`${s.photos.length} photo${s.photos.length>1?'s':''}`:'',s.video?'1 video':''].filter(Boolean).join(', ')||'None';
 const row=(k,v,st)=>html`<div class="r"><span class="k">${k}</span><span class="v">${v}</span>${st?html`<button class="e" type="button" data-a="wiz-goto" data-step="${st}" aria-label="Edit ${k}">Edit</button>`:html`<span></span>`}</div>`;
 return html`<h1 class="h2">Review your booking</h1><p class="sub">Check the details before you confirm.</p>
 <div class="card" style="margin-top:16px"><div class="sumhead"><img class="emb logo-img" src="${LOGO.emb}" alt="" width="40" height="40"><img class="logo-img" src="${LOGO.word}" alt="TEACTON" width="150" height="17"></div><div class="sum">
 ${row('Service',c.name,1)}${row('Problem',`${p.name} — ${s.issue}`,2)}${row('Description',s.desc,3)}${row('Photo/video',media,4)}${row('Address',addrLine(a),5)}
 ${row('Date',later?fmtDate(s.date):fmtDate(isoDay(new Date()))+' (today)',6)}${row('Time',later?sl.label:'As soon as possible',6)}
 <div class="r"><span class="k">Estimated price</span><span class="v price">${priceRange(p.price)}</span><span></span></div></div>
 <div class="notice" style="margin-top:12px">${ic('info',18)}<span>Final price may depend on the actual work required.</span></div></div>
 ${s.errors.submit?html`<div class="notice err" style="margin-top:14px" role="alert">${ic('alert',18)}<span>${s.errors.submit}</span></div>`:''}`}
function VBook(){if(!Wiz.s)Wiz.reset();const s=Wiz.s;
 const cta=s.step>=3?html`<div class="wiz-cta">${s.step===7?html`<button class="btn gold" type="button" data-a="wiz-confirm" id="confirm">${ic('check',20)}Confirm Booking</button>`:html`<button class="btn" type="button" data-a="wiz-next">Continue</button>`}</div>`:'';
 return shell(html`<div class="narrow" style="margin:0 auto"><div class="wiz-top"><button class="iconbtn" type="button" data-a="wiz-back" aria-label="Go back">${ic('chevL',20)}</button>
 <div style="flex:1;min-width:0"><div class="wiz-prog" role="progressbar" aria-valuemin="1" aria-valuemax="7" aria-valuenow="${s.step}" aria-label="Booking progress">${STEP_TITLES.map((_,i)=>html`<i class="${i+1<s.step?'on':i+1===s.step?'cur':''}"></i>`)}</div>
 <small class="hint" style="margin:0">Step ${s.step} of 7 · ${STEP_TITLES[s.step-1]}</small></div></div>${stepBody(s)}${cta}</div>`,{nav:'',wiz:true})}

/* ---- statuses / bookings ---- */
function bucket(b){if(b.status==='cancelled')return'cancelled';if(b.status==='completed')return'completed';if(b.mode==='later'&&['received','assigned'].includes(b.status))return'upcoming';return'active'}
function statusBadge(b){const l=b.status==='cancelled'?'Cancelled':STATUSES.find(s=>s.k===b.status).l;const cl=b.status==='completed'?'':b.status==='cancelled'?'red':['on_the_way','arrived','in_progress'].includes(b.status)?'gold':'blue';return html`<span class="badge ${cl}">${l}</span>`}
function timeline(b){const idx=STATUSES.findIndex(s=>s.k===b.status),cancelled=b.status==='cancelled';
 return html`<ol class="tl" aria-label="Service status">${STATUSES.map((s,i)=>{const h=b.history.find(x=>x.s===s.k);const st=cancelled?(h?'done':''):i<idx?'done':i===idx?(s.k==='completed'?'done':'cur'):'';
  return html`<li class="${st}" ${raw(st==='cur'?'aria-current="step"':'')}><span class="pt">${st==='done'?ic('check',15):''}</span><span class="lb">${s.l}</span><time>${h?fmtStamp(h.at):''}</time></li>`})}
  ${cancelled?html`<li class="cur"><span class="pt">${ic('x',15)}</span><span class="lb">Cancelled</span><time>${fmtStamp(b.history[b.history.length-1].at)}</time></li>`:''}</ol>`}
function techAvatar(t){return html`<svg class="tavatar" viewBox="0 0 64 64" role="img" aria-label="Technician ${t.name}"><circle cx="32" cy="32" r="30" fill="#0A1128" stroke="#F5B400" stroke-width="3"/><text x="32" y="39" text-anchor="middle" font-family="Chakra Petch,sans-serif" font-weight="700" font-size="22" fill="#fff">${initials(t.name)}</text></svg>`}
function techCard(b){const t=TECHS[b.techId];
 if(!t)return b.status==='cancelled'?'':html`<div class="card"><h2 class="h2" style="font-size:19px">Your technician</h2><p class="hint">We're assigning a verified technician to your booking.</p><div class="skel" style="width:70%;margin-top:14px"></div><div class="skel" style="width:45%;margin-top:10px"></div></div>`;
 return html`<div class="card tech"><h2 class="h2" style="font-size:19px">Your technician</h2><div class="tech-top">${techAvatar(t)}<div><b style="font:700 18px var(--f-head)">${t.name}</b> <span class="badge">${ic('shield',14)}Verified</span>
 <div class="meta"><span><span class="st">${ic('star',14)}</span> ${t.rating.toFixed(1)} (${t.jobs} jobs)</span><span>${t.years} yrs experience</span></div><div class="meta" style="margin-top:2px">${t.spec}</div></div></div>
 ${b.status==='on_the_way'?html`<div class="notice ok">${ic('clock',18)}<span>Arriving in about 20 minutes (demo estimate).</span></div>`:''}
 <div class="btnrow"><button class="btn sm" data-a="call-tech" data-id="${b.id}">${ic('phone',18)}Call Technician</button><button class="btn sm ghost" data-a="msg-tech" data-id="${b.id}">${ic('chat',18)}Message Technician</button>${Route.name==='booking'?'':html`<a class="btn sm ghost" href="#/booking/${b.id}">View Booking</a>`}</div></div>`}
function demoBox(b){if(['completed','cancelled'].includes(b.status))return'';
 return html`<div class="demo"><b>Prototype controls</b><p>Real status updates will come from technicians. Use these to walk through the full journey.</p><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn sm gold" data-a="demo-next" data-id="${b.id}">Advance status</button><button class="btn sm ghost" data-a="demo-play" data-id="${b.id}">Play all steps</button></div></div>`}
function detailRows(b){const ad=b.addressSnap||Session.user.addresses.find(a=>a.id===b.addressId);const t=TECHS[b.techId];
 const r=(k,v)=>html`<div class="r" style="grid-template-columns:110px 1fr"><span class="k">${k}</span><span class="v">${v}</span></div>`;
 return html`<div class="sum">${r('Service',b.service)}${r('Problem',`${b.problem}${b.issue?' — '+b.issue:''}`)}${r('Description',b.description)}${ad?r('Address',addrLine(ad)):''}${r('Date',b.mode==='later'?fmtDate(b.date):fmtDate(b.date)+' (requested now)')}${r('Time',b.slotLabel)}${r('Attachments',b.media.photos||b.media.video?`${b.media.photos} photo(s)${b.media.video?', 1 video':''}`:'None')}${r('Estimated price',priceRange(b.price))}</div>
 <p class="hint">Final price may depend on the actual work required.</p>`}
function VConfirmed(){const b=findBooking(Route.params.id);if(!b)return VNotFound();
 return shell(html`<div class="narrow stack" style="margin:0 auto"><div class="card center"><div class="okmark"><svg viewBox="0 0 24 24"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg></div>
 <h1 class="h1" style="font-size:30px">Booking Confirmed</h1><p class="sub">Your TEACTON service request has been received.</p>
 <div class="bid"><span id="bid">${b.id}</span><button class="iconbtn" style="width:38px;height:38px" data-a="copy" data-v="${b.id}" aria-label="Copy booking ID">${ic('copy',18)}</button></div></div>
 <div class="card"><h2 class="h2" style="font-size:19px;margin-bottom:6px">Booking details</h2>${detailRows(b)}</div>
 <div class="card"><h2 class="h2" style="font-size:19px;margin-bottom:14px">Service status</h2>${timeline(b)}</div>
 ${techCard(b)}${demoBox(b)}
 <div class="btnrow" style="grid-template-columns:1fr 1fr"><a class="btn" href="#/booking/${b.id}">View Booking</a><a class="btn ghost" href="#/home">Back to Home</a></div></div>`,{nav:'bookings'})}
const findBooking=id=>Session.user&&Session.user.bookings.find(b=>b.id===id);
function VBookingDetail(){const b=findBooking(Route.params.id);if(!b)return VNotFound();
 return shell(html`<div class="narrow stack" style="margin:0 auto">${back('#/bookings','My Bookings')}
 <div class="card"><div class="bk-top"><div><h1 class="h2">${b.service}: ${b.problem}</h1><div class="id hint">${b.id}</div></div>${statusBadge(b)}</div>
 ${b.status==='cancelled'&&b.cancelReason?html`<p class="hint">Reason: ${b.cancelReason}</p>`:''}</div>
 <div class="card"><h2 class="h2" style="font-size:19px;margin-bottom:14px">Service status</h2>${timeline(b)}</div>
 ${techCard(b)}
 <div class="card"><h2 class="h2" style="font-size:19px;margin-bottom:6px">Service information</h2>${detailRows(b)}</div>
 ${demoBox(b)}
 <div class="btnrow" style="grid-template-columns:1fr 1fr">${['received','assigned'].includes(b.status)?html`<button class="btn danger" data-a="cancel" data-id="${b.id}">Cancel Booking</button>`:''}<a class="btn ghost" href="#/help">Need help?</a></div></div>`,{nav:'bookings'})}
function VBookings(){const u=Session.user,all=[...u.bookings].sort((a,b)=>b.createdAt-a.createdAt);
 const tabs=[['active','Active'],['upcoming','Upcoming'],['completed','Completed'],['cancelled','Cancelled']];
 const list=all.filter(b=>bucket(b)===UI.tab);
 const empties={active:['No active bookings',"You don't have any active service requests."],upcoming:['No upcoming bookings','Scheduled services will appear here.'],completed:['No completed bookings yet.','Finished services will appear here.'],cancelled:['No cancelled bookings','Nothing has been cancelled.']};
 return shell(html`<div class="narrow" style="margin:0 auto"><h1 class="h1" style="margin-bottom:16px">My Bookings</h1>
 <div class="tabs" role="tablist" aria-label="Booking status">${tabs.map(t=>html`<button role="tab" class="tab" aria-selected="${UI.tab===t[0]?'true':'false'}" data-a="tab" data-v="${t[0]}">${t[1]}<span class="n">${all.filter(b=>bucket(b)===t[0]).length}</span></button>`)}</div>
 <div role="tabpanel">${list.length?list.map(b=>html`<a class="bk" href="#/booking/${b.id}"><div class="bk-top"><div><b class="t">${b.service}</b><div class="id">${b.id}</div></div>${statusBadge(b)}</div>
  <div class="bk-meta"><div><span>Problem</span>${b.problem}</div><div><span>Price</span>${priceRange(b.price)}</div><div><span>Date</span>${b.mode==='later'?fmtDate(b.date):'Today (now)'}</div><div><span>Time</span>${b.slotLabel}</div><div style="grid-column:1/-1"><span>Technician</span>${TECHS[b.techId]?TECHS[b.techId].name:'Not assigned yet'}</div></div></a>`)
  :html`<div class="empty"><div class="ill">${ic('list',30)}</div><h3>${empties[UI.tab][0]}</h3><p>${empties[UI.tab][1]}</p><a class="btn" href="#/services">Book a Service</a></div>`}</div></div>`,{nav:'bookings'})}

/* ---- expert ---- */
function VExpert(){const x=UI.exp,e=x.errors||{};if(!x.phone&&Session.user)x.phone=Session.user.phone;
 if(x.done)return shell(html`<div class="narrow stack center" style="margin:0 auto"><div class="card"><div class="okmark"><svg viewBox="0 0 24 24"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg></div><h1 class="h2">${x.done.method==='callback'?'Callback requested':x.done.method==='chat'?'Chat started':'Expert call requested'}</h1>
 <p class="sub">${x.done.method==='callback'?`Our technical team will call +91 ${maskPhone(x.done.phone)} ${x.done.when==='asap'?'as soon as possible':'during your preferred time'}.`:'Our technical team has your details.'}</p><div class="bid">${x.done.id}</div></div>
 <div class="btnrow" style="grid-template-columns:1fr 1fr"><a class="btn" href="#/services">Book a Service</a><button class="btn ghost" data-a="expert-again">Ask another question</button></div></div>`,{nav:'expert'});
 const M=[['call','Call an Expert','headset','Speak to our technical team now.'],['callback','Request a Callback','phone','We will call you back.'],['chat','Chat With Support','chat','Message us and share details.']];
 const label={call:'Call an Expert',callback:'Request a Callback',chat:'Start Chat'}[x.method];
 return shell(html`<div class="narrow stack" style="margin:0 auto"><div><h1 class="h1">Talk to an Expert</h1><p class="sub">Not sure what's wrong? Our technical team can help.</p></div>
 <div role="radiogroup" aria-label="How would you like to connect?">${M.map(m=>html`<button type="button" role="radio" class="opt" aria-checked="${x.method===m[0]?'true':'false'}" data-a="exp-method" data-v="${m[0]}"><span class="li" style="padding:0;min-height:0;border:0;background:none;pointer-events:none"><span class="ico">${ic(m[2],22)}</span><span><span class="ttl">${m[1]}</span><small>${m[3]}</small></span></span></button>`)}</div>
 <form class="card" data-f="expert" novalidate><div class="field"><label for="xd">Explain your problem</label><textarea class="textarea" id="xd" maxlength="${CONFIG.limits.desc}" data-bind="exp.desc" ${raw(e.desc?'aria-invalid="true"':'')} placeholder="Tell us what you see, hear or smell, and when it started.">${x.desc}</textarea>${fieldErr(e.desc,'e-xd')}</div>
 ${x.method==='callback'?html`<div class="row2"><div class="field"><label for="xp">Phone number</label><div class="phone"><span class="cc">+91</span><input class="input" id="xp" type="tel" inputmode="numeric" maxlength="10" data-bind="exp.phone" value="${x.phone}" ${raw(e.phone?'aria-invalid="true"':'')}></div>${fieldErr(e.phone,'e-xp')}</div>
  <div class="field"><label for="xw">Preferred time</label><select class="select" id="xw" data-bind="exp.when"><option value="asap" ${raw(x.when==='asap'?'selected':'')}>As soon as possible</option><option value="morning" ${raw(x.when==='morning'?'selected':'')}>Morning (9 AM – 12 PM)</option><option value="afternoon" ${raw(x.when==='afternoon'?'selected':'')}>Afternoon (12 – 4 PM)</option><option value="evening" ${raw(x.when==='evening'?'selected':'')}>Evening (4 – 8 PM)</option></select></div></div>`:''}
 <p class="lbl">Photo or video (optional)</p>${uploadBlock(x,'exp')}
 <button class="btn block" type="submit" style="margin-top:20px">${label}</button><p class="hint" style="text-align:center">Expert support hours: ${CONFIG.supportHours}</p></form>
 <div class="notice">${ic('info',18)}<span>This is for advice and diagnosis. To book a technician visit, <a href="#/services">choose a service</a>.</span></div></div>`,{nav:'expert'})}

/* ---- help / profile ---- */
function VHelp(){
 const rows=[['headset','Call TEACTON Support',`Available ${CONFIG.supportHours}`,'help-call'],['chat','Chat With Support','Message our team','support-chat'],['clock','Track Booking','See live status','#/bookings'],['x','Cancel Booking','Cancel an upcoming service','#/bookings'],['wallet','Payment Help','Payments and pricing','help-pay'],['alert','Service Complaint','Tell us what went wrong','help-complaint'],['info','Other Issue','Anything else','help-other']];
 return shell(html`<div class="narrow stack" style="margin:0 auto"><div><h1 class="h1">How can we help?</h1><p class="sub">Choose an option below.</p></div>
 <div class="list">${rows.map(r=>r[3].startsWith('#')?html`<a class="li" href="${r[3]}"><span class="ico">${ic(r[0],22)}</span><span>${r[1]}<small>${r[2]}</small></span><span class="chev">${ic('chev',18)}</span></a>`:html`<button class="li" data-a="${r[3]}"><span class="ico">${ic(r[0],22)}</span><span>${r[1]}<small>${r[2]}</small></span><span class="chev">${ic('chev',18)}</span></button>`)}</div>
 <div class="banner">${ic('help',34)}<div><h3>Can't find your service?</h3><p>Our experts will help you work out what's wrong.</p></div><a class="btn gold" href="#/expert">Talk to an Expert</a></div></div>`,{nav:'help'})}
function VProfile(){const u=Session.user;
 const rows=[['pin','My Addresses','#/addresses'],['list','My Bookings','#/bookings'],['card','Payment Methods','#/payments'],['help','Help & Support','#/help'],['doc','Terms & Conditions','#/terms'],['lock','Privacy Policy','#/privacy']];
 return shell(html`<div class="narrow stack" style="margin:0 auto"><div class="card pcard"><span class="avatar" role="img" aria-label="Profile photo placeholder">${initials(u.name||'Customer')}</span><div style="flex:1;min-width:180px"><h1 class="h2">${u.name||'TEACTON Customer'}</h1><p class="hint" style="margin:2px 0 0">+91 ${u.phone}</p><p class="hint" style="margin:0">${u.email||'Add your email'}${u.gender?' · '+u.gender:''}</p></div><button class="btn sm ghost" data-a="edit-profile">${ic('edit',16)}Edit</button></div>
 <div class="list">${rows.map(r=>html`<a class="li" href="${r[2]}"><span class="ico">${ic(r[0],22)}</span><span>${r[1]}</span><span class="chev">${ic('chev',18)}</span></a>`)}<button class="li out" data-a="logout"><span class="ico">${ic('logout',22)}</span><span>Logout</span></button></div></div>`,{nav:'profile'})}
function VAddresses(){const u=Session.user;
 return shell(html`<div class="narrow stack" style="margin:0 auto">${back('#/profile','Profile')}<h1 class="h1">My Addresses</h1>
 ${u.addresses.length?u.addresses.map(a=>html`<div class="addr"><span class="badge blue">${a.type}</span><span style="flex:1"><b>${a.name}</b> ${a.isDefault?html`<span class="badge gold">Default</span>`:''}<p>${addrLine(a)}</p><p>+91 ${a.mobile}</p></span>
  <span style="display:grid;gap:4px">${a.isDefault?'':html`<button class="linkbtn" data-a="addr-default" data-id="${a.id}">Set default</button>`}<button class="linkbtn" style="color:var(--err)" data-a="addr-del" data-id="${a.id}" aria-label="Delete ${a.type} address">Delete</button></span></div>`)
  :html`<div class="empty"><div class="ill">${ic('pin',30)}</div><h3>No saved addresses</h3><p>Add an address to book faster.</p></div>`}
 <button class="btn" data-a="add-addr" data-after="list">${ic('plus',18)}Add New Address</button></div>`,{nav:'profile'})}
function VPayments(){return shell(html`<div class="narrow stack" style="margin:0 auto">${back('#/profile','Profile')}<h1 class="h1">Payment Methods</h1>
 <div class="list"><div class="li"><span class="ico">${ic('wallet',22)}</span><span>Pay after service<small>Pay the technician once the work is done</small></span><span class="badge" style="margin-left:auto">Active</span></div>
 <div class="li" style="opacity:.75"><span class="ico">${ic('card',22)}</span><span>UPI, cards and wallets<small>Online payments are not available yet</small></span><span class="badge gray" style="margin-left:auto">Coming soon</span></div></div>
 <div class="notice">${ic('info',18)}<span>Final price may depend on the actual work required. You'll confirm the amount before paying.</span></div></div>`,{nav:'profile'})}
const LEGAL={terms:['Terms & Conditions',[['Using TEACTON','TEACTON helps you book technicians for home technical services. By using the app you agree to provide accurate details and to be present, or arrange access, at the booked time.'],['Bookings and pricing','Prices shown before booking are estimates. The final price may depend on the actual work required and will be confirmed with you before work begins.'],['Cancellations','You can cancel a booking before a technician is on the way. Repeated late cancellations may limit future bookings.'],['Your responsibilities','Keep the work area safe and share accurate information. Do not upload content that is unlawful or belongs to someone else.'],['Changes','We may update these terms as the service grows. Continued use means you accept the updated terms.']]],
 privacy:['Privacy Policy',[['What we collect','Your mobile number, name and email, saved addresses, booking details, and any photos or videos you choose to upload.'],['How we use it','To create and manage your bookings, assign technicians, provide support, and improve the service.'],['What technicians see','Technicians see only what is needed to do the job: the service, your description, the address and your first name. Calls and messages are routed through TEACTON.'],['Your choices','You can edit your profile, delete saved addresses and contact support about your data at any time.'],['Security','We never store your OTP. We use secure connections and limit access to your data.']]]};
function VLegal(){const k=Route.name,d=LEGAL[k];return anyShell(html`<div class="narrow stack" style="margin:0 auto">${back(Session.token?'#/profile':'#/','Back')}<h1 class="h1">${d[0]}</h1><p class="notice">${ic('info',18)}<span>Summary version for this prototype. Final legal text will be published before launch.</span></p>${d[1].map(s=>html`<section class="card"><h2 class="h2" style="font-size:19px">${s[0]}</h2><p class="sub" style="font-size:15.5px">${s[1]}</p></section>`)}</div>`,{nav:'profile'})}
function VAbout(){return anyShell(html`<div class="narrow stack" style="margin:0 auto">${back(Session.token?'#/home':'#/','Back')}<div class="card center"><div class="auth-logo logo-img" style="max-width:240px;margin-bottom:12px"><img src="${LOGO.full}" width="240" height="185" alt="TEACTON logo"></div><h1 class="h2">About TEACTON</h1><p class="sub">TEACTON is an on-demand platform for home technical services. We connect customers with verified technicians for electrical, plumbing, AC and appliance work, with clear booking and status tracking from request to completion.</p></div>${trust()}</div>`,{nav:''})}
function VNotFound(){return anyShell(html`<div class="empty"><div class="ill">${ic('alert',30)}</div><h1 class="h2">We couldn't find that page</h1><p>The link may be old or the booking may not exist.</p><a class="btn" href="${Session.token?'#/home':'#/'}">Go to Home</a></div>`)}

/* =====================================================================
   Router
   ===================================================================== */
const ROUTES=[['/','landing',()=>html``,1],['/login','login',VLogin,1],['/otp','otp',VOtp,1],['/welcome','welcome',VWelcome],['/home','home',VHome],['/services','services',VServices],['/book','book',VBook],['/book/:cat','book',VBook],['/book/:cat/:p','book',VBook],
 ['/confirmed/:id','confirmed',VConfirmed],['/bookings','bookings',VBookings],['/booking/:id','booking',VBookingDetail],['/expert','expert',VExpert],['/help','help',VHelp],['/profile','profile',VProfile],['/addresses','addresses',VAddresses],['/payments','payments',VPayments],
 ['/terms','terms',VLegal,1],['/privacy','privacy',VLegal,1],['/about','about',VAbout,1]].map(r=>({re:new RegExp('^'+r[0].replace(/:(\w+)/g,'([^/]+)')+'$'),keys:[...r[0].matchAll(/:(\w+)/g)].map(m=>m[1]),name:r[1],view:r[2],pub:!!r[3]}));
const TITLES={landing:'TEACTON – Reliable technical services at your doorstep',login:'Log in – TEACTON',otp:'Verify your number – TEACTON',home:'Home – TEACTON',welcome:'Your details – TEACTON',services:'Services – TEACTON',book:'Book a service – TEACTON',confirmed:'Booking confirmed – TEACTON',bookings:'My Bookings – TEACTON',booking:'Booking details – TEACTON',expert:'Talk to an Expert – TEACTON',help:'Help & Support – TEACTON',profile:'Profile – TEACTON',addresses:'My Addresses – TEACTON',payments:'Payment Methods – TEACTON',terms:'Terms & Conditions – TEACTON',privacy:'Privacy Policy – TEACTON',about:'About – TEACTON'};
let Route={name:'',params:{},path:''};
const go=p=>{if(location.hash==='#'+p)render();else location.hash='#'+p};
function matchRoute(path){for(const r of ROUTES){const m=path.match(r.re);if(m){const params={};r.keys.forEach((k,i)=>params[k]=decodeURIComponent(m[i+1]));return{r,params}}}return null}
function render(o={}){
 const path=(location.hash.replace(/^#/,'')||'/').split('?')[0];const m=matchRoute(path);
 const app=$('#app');let view,name='404',params={};
 if(!o.soft)clearTimers();
 if(m){const{r}=m;name=r.name;params=m.params;
  if(name==='landing'){history.replaceState(null,'','#'+(Session.token?'/home':'/login'));return render()}
  if(!r.pub&&!Session.token){Session.next=path;return go('/login')}
  if(Session.token&&['login','otp'].includes(name))return go('/home');
  if(name==='book'&&!o.soft){if(params.cat&&svcById(params.cat)){if(!Wiz.s||Wiz.s.cat!==params.cat||(params.p&&Wiz.s.pid!==params.p))Wiz.reset({cat:params.cat,p:probOf(params.cat,params.p)?params.p:null})}else if(params.cat){return go('/services')}}
  Route={name,params,path};view=r.view();
 }else{Route={name:'404',params:{},path};view=VNotFound()}
 const y=window.scrollY,active=document.activeElement&&document.activeElement.id;
 app.innerHTML=toS(view);document.title=TITLES[name]||'TEACTON';
 if(o.soft){window.scrollTo(0,y);if(active){const el=document.getElementById(active);el&&el.focus({preventScroll:true})}}else{window.scrollTo(0,0);const mn=$('#main');mn&&mn.focus({preventScroll:true})}
 mount(name,o);
}
function mount(name,o){
 if(name==='otp'&&!o.soft){startCountdown(CONFIG.resendSeconds);const f=$('#otp input');f&&f.focus()}
 if(name==='login'&&!o.soft){const el=$('#ph');el&&el.focus()}
}
function startCountdown(sec){let n=sec;const tick=()=>{const b=$('#resend');if(!b)return;if(n>0){b.textContent=`Resend OTP in ${n}s`;b.disabled=true;n--;T(setTimeout(tick,1000))}else{b.textContent='Resend OTP';b.disabled=false}};tick()}

/* =====================================================================
   Toasts, sheets
   ===================================================================== */
function toast(msg,bad){const d=document.createElement('div');d.className='toast'+(bad?' bad':'');d.textContent=msg;$('#toasts').appendChild(d);setTimeout(()=>d.remove(),3800)}
const friendlyErr=()=>toast('Something went wrong. Please try again.',true);
function closeSheet(){$$('dialog.sheet').forEach(d=>{try{d.close()}catch(e){}d.remove()})}
function sheet(title,body){closeSheet();const d=document.createElement('dialog');d.className='sheet';d.setAttribute('aria-labelledby','sheet-t');
 d.innerHTML=toS(html`<div class="sheet-h"><h2 id="sheet-t">${title}</h2><button class="iconbtn" data-a="close-sheet" aria-label="Close">${ic('x',20)}</button></div><div class="sheet-b">${body}</div>`);
 document.body.appendChild(d);d.addEventListener('close',()=>d.remove());d.addEventListener('click',e=>{if(e.target===d)d.close()});d.showModal();return d}
function openCall(name,sub){sheet(`Call ${name}`,html`<div class="stack"><p>${sub}</p><div class="notice">${ic('info',18)}<span>Calls connect through TEACTON so personal numbers stay private. In this prototype, calls are simulated.</span></div><button class="btn block" data-a="fake-call">${ic('phone',18)}Start call</button></div>`)}
function openChat(key,title,first){UI.chats[key]=UI.chats[key]||[{me:false,t:first}];
 sheet(title,html`<div class="chat" id="chatlog" aria-live="polite" tabindex="0">${chatHtml(key)}</div><form class="chat-in" data-f="chat" data-key="${key}" novalidate><label class="sr" for="cm">Message</label><input class="input" id="cm" maxlength="300" autocomplete="off" placeholder="Type a message"><button class="btn" type="submit" aria-label="Send">${ic('send',18)}</button></form>`);
 const l=$('#chatlog');l.scrollTop=l.scrollHeight}
const chatHtml=key=>UI.chats[key].map(m=>html`<div class="msg ${m.me?'me':'them'}">${m.t}</div>`);
function addrForm(after){
 const f=(id,label,ph='',o={})=>html`<div class="field"><label for="a-${id}">${label}</label><input class="input" id="a-${id}" name="${id}" ${raw(o.attrs||'')} placeholder="${ph}" value="${o.v||''}" autocomplete="${o.ac||'off'}"></div>`;
 return html`<form data-f="address" data-after="${after}" novalidate>${f('name','Full name','',{ac:'name',v:Session.user.name})}${f('mobile','Mobile number','10-digit number',{attrs:'type="tel" inputmode="numeric" maxlength="10"',ac:'tel-national',v:Session.user.phone})}
 <div class="row2">${f('house','House/Flat number','',{ac:'address-line1'})}${f('street','Building/Street','',{ac:'address-line2'})}</div>${f('area','Area')}
 <div class="row2">${f('city','City','',{ac:'address-level2'})}<div class="field"><label for="a-state">State</label><select class="select" id="a-state" name="state" autocomplete="address-level1"><option value="">Select state</option>${STATES.map(s=>html`<option>${s}</option>`)}</select></div></div>
 <div class="row2">${f('pin','PIN code','6 digits',{attrs:'type="text" inputmode="numeric" maxlength="6"',ac:'postal-code'})}${f('landmark','Landmark (optional)')}</div>
 <div class="field"><label for="a-type">Address type</label><select class="select" id="a-type" name="type"><option>Home</option><option>Work</option><option>Other</option></select></div>
 <button class="btn block" type="submit">Save Address</button></form>`}

/* =====================================================================
   5. Validation, actions, forms
   ===================================================================== */
const RULES={name:v=>v.length<2?'Enter your full name.':'',mobile:v=>/^[6-9]\d{9}$/.test(v)?'':'Enter a valid 10-digit mobile number.',house:v=>v?'':'Enter your house or flat number.',street:v=>v?'':'Enter the building or street.',area:v=>v?'':'Enter your area.',city:v=>v?'':'Enter your city.',state:v=>v?'':'Select your state.',pin:v=>/^[1-9]\d{5}$/.test(v)?'':'Enter a valid 6-digit PIN code.'};
function showErrors(form,errs){$$('.err[data-ve]',form).forEach(e=>e.remove());$$('[aria-invalid]',form).forEach(e=>e.removeAttribute('aria-invalid'));let first=null;
 Object.entries(errs).forEach(([k,msg])=>{const el=form.elements[k];if(!el)return;el.setAttribute('aria-invalid','true');const d=document.createElement('div');d.className='err';d.dataset.ve='1';d.id='e-'+k;d.setAttribute('role','alert');d.textContent=msg;el.setAttribute('aria-describedby',d.id);(el.closest('.phone')||el).insertAdjacentElement('afterend',d);first=first||el});first&&first.focus()}
function addFiles(t,kind,files){const L=CONFIG.limits;let n=0;
 for(const f of files){if(kind==='photo'){if(!/^image\//.test(f.type)){toast('Please choose an image file.',true);continue}if(f.size>L.photoMB*1048576){toast(`${f.name} is larger than ${L.photoMB} MB.`,true);continue}if(t.photos.length>=L.photos){toast(`You can add up to ${L.photos} photos.`,true);break}t.photos.push(f);n++}
  else{if(!/^video\//.test(f.type)){toast('Please choose a video file.',true);continue}if(f.size>L.videoMB*1048576){toast(`Video must be under ${L.videoMB} MB.`,true);continue}t.video=f;n++}}
 return n}
const target=k=>k==='exp'?UI.exp:Wiz.s;
const BIND={wiz:()=>Wiz.s,exp:()=>UI.exp};
const bump=()=>render({soft:true});

function wizNext(){const s=Wiz.s;s.errors={};
 if(s.step===3){if(!s.issue)s.errors.issue='Select what best describes the problem.';s.desc=cleanText(s.desc,CONFIG.limits.desc);if(s.desc.length<10)s.errors.desc='Add a few details so the technician can prepare (at least 10 characters).'}
 if(s.step===5&&!s.addressId)s.errors.addr='Select or add an address to continue.';
 if(s.step===6){if(!s.mode)s.errors.time='Choose when you need the service.';else if(s.mode==='later'&&(!s.date||!s.slot))s.errors.time='Select a date and an available time slot.';else if(s.mode==='now'&&!Api.nowAvailable())s.errors.time='No technician is currently available right now. Please schedule for later.'}
 if(Object.keys(s.errors).length){bump();const el=$('[role="alert"]');el&&el.scrollIntoView({block:'center',behavior:'smooth'});return}
 s.step++;render()}
const A={
 'cta-book'(){go(Session.token?'/services':'/login');if(!Session.token)Session.next='/services'},
 'cta-expert'(){Session.next='/expert';go(Session.token?'/expert':'/login')},
 start(el,e){e.preventDefault();const c=el.dataset.c,p=el.dataset.p;Wiz.reset({cat:c,p:p&&probOf(c,p)?p:null});go('/book')},
 'wiz-cat'(el){Wiz.s.cat=el.dataset.c;Wiz.s.pid=null;Wiz.s.issue='';Wiz.s.step=2;render()},
 'wiz-problem'(el){if(Wiz.s.pid!==el.dataset.id){Wiz.s.issue=''}Wiz.s.pid=el.dataset.id;Wiz.s.step=3;render()},
 'wiz-issue'(el){Wiz.s.issue=el.dataset.v;Wiz.s.errors.issue='';bump()},
 'wiz-addr'(el){Wiz.s.addressId=el.dataset.id;Wiz.s.errors.addr='';bump()},
 'wiz-mode'(el){if(el.dataset.v==='now'&&!Api.nowAvailable()){Wiz.s.mode=null;Wiz.s.errors.time='No technician is currently available right now. Please schedule for later.';return bump()}Wiz.s.mode=el.dataset.v;Wiz.s.errors.time='';bump()},
 'wiz-date'(el){Wiz.s.date=el.dataset.v;Wiz.s.slot=null;Wiz.s.errors.time='';bump()},
 'wiz-slot'(el){Wiz.s.slot=el.dataset.v;Wiz.s.errors.time='';bump()},
 'wiz-next':wizNext,
 'wiz-back'(){const s=Wiz.s;if(s.step<=1||(s.step===2&&!s.cat)){history.length>1?history.back():go('/home');return}
  if(s.step===3&&location.hash.split('/').length>3&&false)return;s.step--;s.errors={};render()},
 'wiz-goto'(el){Wiz.s.step=+el.dataset.step;render()},
 async 'wiz-confirm'(el){const s=Wiz.s,u=Session.user;el.disabled=true;el.innerHTML='<span class="spin"></span>Confirming…';s.errors={};
  try{const b=await Api.createBooking(u,s);Wiz.s=null;go('/confirmed/'+b.id)}catch(err){s.errors.submit='Something went wrong. Please try again.';bump()}},
 'rm-file'(el){const t=target(el.dataset.t);if(el.dataset.k==='photo')t.photos.splice(+el.dataset.i,1);else t.video=null;bump()},
 'add-addr'(el){sheet('Add New Address',addrForm(el.dataset.after))},
 'addr-default'(el){const u=Session.user;u.addresses.forEach(a=>a.isDefault=a.id===el.dataset.id);DB.save();bump();toast('Default address updated.')},
 'addr-del'(el){const a=Session.user.addresses.find(x=>x.id===el.dataset.id);sheet('Delete address?',html`<p>${a.type} · ${addrLine(a)}</p><div class="btnrow" style="grid-template-columns:1fr 1fr;margin-top:16px"><button class="btn ghost" data-a="close-sheet">Keep it</button><button class="btn danger" data-a="addr-del-ok" data-id="${a.id}">Delete</button></div>`)},
 async 'addr-del-ok'(el){await Api.deleteAddress(Session.user,el.dataset.id);closeSheet();if(Wiz.s&&Wiz.s.addressId===el.dataset.id)Wiz.s.addressId=null;bump();toast('Address deleted.')},
 loc(){const u=Session.user;sheet('Service location',html`<div>${u.addresses.length?u.addresses.map(a=>html`<button class="addr" data-a="loc-set" data-id="${a.id}" style="cursor:pointer"><span class="badge blue">${a.type}</span><span style="flex:1"><b>${a.city}</b><p>${addrLine(a)}</p></span>${(u.locId===a.id||(!u.locId&&a.isDefault))?ic('check',20):''}</button>`):html`<p class="hint">No saved addresses yet.</p>`}<button class="btn ghost block" data-a="add-addr" data-after="loc" style="margin-top:6px">${ic('plus',18)}Add New Address</button></div>`)},
 'loc-set'(el){Session.user.locId=el.dataset.id;DB.save();if(Wiz.s)Wiz.s.addressId=el.dataset.id;closeSheet();bump();toast('Location updated.')},
 notif(){Session.notifSeen=true;const ev=events();sheet('Notifications',ev.length?html`<div class="list">${ev.map(e=>html`<a class="li" href="#/booking/${e.id}" data-a="close-sheet"><span class="ico">${ic('bell',20)}</span><span>${e.t}<small>${e.sub} · ${fmtStamp(e.at)}</small></span></a>`)}</div>`:html`<div class="empty"><div class="ill">${ic('bell',30)}</div><h3>No notifications yet</h3><p>Booking updates will appear here.</p></div>`);bump()},
 'close-sheet'(el,e){const d=el.closest('dialog');if(d)d.close();else closeSheet()},
 tab(el){UI.tab=el.dataset.v;bump()},
 copy(el){navigator.clipboard&&navigator.clipboard.writeText(el.dataset.v).then(()=>toast('Booking ID copied.'),()=>toast(el.dataset.v))},
 'call-tech'(el){const b=findBooking(el.dataset.id),t=TECHS[b.techId];openCall(t.name,`Connect with ${t.name} about booking ${b.id}.`)},
 'msg-tech'(el){const b=findBooking(el.dataset.id),t=TECHS[b.techId];openChat('tech-'+b.id,`Message ${t.name}`,`Hi, this is ${t.name.split(' ')[0]} from TEACTON. How can I help with your ${b.problem.toLowerCase()} booking?`)},
 'help-call'(){openCall('TEACTON Support',`Our support team is available ${CONFIG.supportHours}.`)},
 'support-chat'(el,e){e&&e.preventDefault();openChat('support','Chat With Support','Hello! You\'re chatting with TEACTON Support. How can we help?')},
 'fake-call'(){closeSheet();toast('Demo: calling is simulated in this prototype.')},
 'help-pay'(){sheet('Payment Help',html`<div class="faq"><details open><summary>How is the price decided?</summary><p>You see an estimated range before booking. The final price may depend on the actual work required and is confirmed before the work starts.</p></details><details><summary>When do I pay?</summary><p>Payment is made after the service is completed. Online payments are coming soon.</p></details><details><summary>I was charged incorrectly</summary><p>Raise a service complaint from Help and share your booking ID. Our team will review it.</p></details></div><button class="btn block" data-a="help-complaint" style="margin-top:14px">Raise a complaint</button>`)},
 'help-complaint'(){issueForm('Service Complaint')},'help-other'(){issueForm('Other Issue')},
 'edit-profile'(){const u=Session.user;sheet('Edit profile',html`<form data-f="profile" novalidate><div class="field"><label for="pn">Full name</label><input class="input" id="pn" name="name" value="${u.name}" autocomplete="name" maxlength="60"></div><div class="field"><label for="pg">Gender (optional)</label><select class="select" id="pg" name="gender"><option value="">Not specified</option>${GENDERS.map(g=>html`<option ${raw(u.gender===g?'selected':'')}>${g}</option>`)}</select></div><div class="field"><label for="pe">Email (optional)</label><input class="input" id="pe" name="email" type="email" value="${u.email}" autocomplete="email" maxlength="100"></div><button class="btn block" type="submit">Save changes</button></form>`)},
 logout(){sheet('Log out?',html`<p>You'll need to verify your mobile number to sign in again.</p><div class="btnrow" style="grid-template-columns:1fr 1fr;margin-top:16px"><button class="btn ghost" data-a="close-sheet">Stay signed in</button><button class="btn danger" data-a="logout-ok">Logout</button></div>`)},
 'logout-ok'(){closeSheet();Session.token=null;Session.user=null;Session.phone=null;Wiz.s=null;go('/');toast('You have been logged out.')},
 cancel(el){const b=findBooking(el.dataset.id);sheet('Cancel booking?',html`<form data-f="cancel" data-id="${b.id}"><p class="hint" style="margin-bottom:12px">${b.service}: ${b.problem} · ${b.id}</p><div class="field"><label for="cr">Reason</label><select class="select" id="cr" name="reason"><option>Booked by mistake</option><option>Need to change date or time</option><option>Found another solution</option><option>Other</option></select></div><div class="btnrow" style="grid-template-columns:1fr 1fr"><button type="button" class="btn ghost" data-a="close-sheet">Keep booking</button><button class="btn danger" type="submit">Cancel booking</button></div></form>`)},
 'demo-next'(el){Api.advance(findBooking(el.dataset.id))},
 'demo-play'(el){const b=findBooking(el.dataset.id);T(setInterval(()=>{if(b.status==='completed'||b.status==='cancelled')return;Api.advance(b)},1800));toast('Playing status updates…')},
 'exp-method'(el){UI.exp.method=el.dataset.v;bump()},
 'expert-again'(){UI.exp={method:'call',desc:'',photos:[],video:null,phone:Session.user.phone,when:'asap',errors:{},done:null};bump()},
 resend:async()=>{await Api.requestOtp(Session.phone);toast('A new OTP has been sent.');startCountdown(CONFIG.resendSeconds)},
 'skip-welcome'(){Session.user.profileDone=true;DB.save();const nx=Session.next||'/home';Session.next=null;go(nx)},
 'change-phone'(){Session.phone=null;go('/login')}
};
function issueForm(title){const u=Session.user;
 sheet(title,html`<form data-f="issue" data-title="${title}" novalidate><div class="field"><label for="ib">Related booking (optional)</label><select class="select" id="ib" name="booking"><option value="">Not about a specific booking</option>${u.bookings.map(b=>html`<option value="${b.id}">${b.id} — ${b.service}</option>`)}</select></div>
 <div class="field"><label for="im">Tell us what happened</label><textarea class="textarea" id="im" name="msg" maxlength="500"></textarea></div><button class="btn block" type="submit">Submit</button></form>`)}

const F={
 async login(f){const phone=clean(f.elements.phone.value,10).replace(/\D/g,'');
  if(!/^[6-9]\d{9}$/.test(phone))return showErrors(f,{phone:'Enter a valid 10-digit mobile number.'});
  const b=$('button[type=submit]',f);b.disabled=true;b.innerHTML='<span class="spin"></span>Sending OTP…';
  try{await Api.requestOtp(phone);Session.phone=phone;Session.attempts=0;go('/otp')}catch(e){friendlyErr();b.disabled=false;b.textContent='Continue'}},
 async otp(f){const code=$$('#otp input').map(i=>i.value).join(''),err=$('#otp-err'),box=$('#otp');
  const fail=m=>{err.hidden=false;err.innerHTML=toS(html`${ic('alert',16)}<span>${m}</span>`);box.classList.remove('bad');void box.offsetWidth;box.classList.add('bad')};
  if(Date.now()<Session.lockUntil)return fail('Too many attempts. Please wait a moment and try again.');
  if(!/^\d{6}$/.test(code))return fail('Enter all 6 digits of your OTP.');
  const b=$('button[type=submit]',f);b.disabled=true;b.innerHTML='<span class="spin"></span>Verifying…';
  try{const r=await Api.verifyOtp(Session.phone,code);
   if(!r.ok){if(++Session.attempts>=5){Session.lockUntil=Date.now()+30000;Session.attempts=0}b.disabled=false;b.textContent='Verify OTP';$$('#otp input').forEach(i=>i.value='');$('#otp input').focus();return fail("That OTP doesn't match. Please check and try again.")}
   Session.token=r.token;Session.user=await Api.getCustomer(Session.phone);toast('Welcome to TEACTON!');go('/welcome')}
  catch(e){friendlyErr();b.disabled=false;b.textContent='Verify OTP'}},
 async address(f){const v=o=>clean(f.elements[o].value,o==='street'?120:80);const a={};['name','mobile','house','street','area','city','state','pin','landmark','type'].forEach(k=>a[k]=v(k));
  a.mobile=a.mobile.replace(/\D/g,'');const errs={};Object.keys(RULES).forEach(k=>{const m=RULES[k](a[k]);if(m)errs[k]=m});
  if(Object.keys(errs).length)return showErrors(f,errs);
  try{const saved=await Api.saveAddress(Session.user,a);const after=f.dataset.after;if(after==='wiz'&&Wiz.s){Wiz.s.addressId=saved.id;Wiz.s.errors.addr=''}if(after==='loc')Session.user.locId=saved.id;closeSheet();bump();toast('Address saved.')}catch(e){friendlyErr()}},
 async chat(f){const i=$('#cm'),t=clean(i.value,300);if(!t)return;const key=f.dataset.key;UI.chats[key].push({me:true,t});i.value='';const l=$('#chatlog');l.innerHTML=toS(chatHtml(key));l.scrollTop=l.scrollHeight;
  setTimeout(()=>{UI.chats[key].push({me:false,t:key==='support'?'Thanks for your message. A TEACTON support agent will reply here shortly.':'Thanks, noted. I will check and update you shortly.'});const lg=$('#chatlog');if(lg){lg.innerHTML=toS(chatHtml(key));lg.scrollTop=lg.scrollHeight}},1200)},
 async expert(f){const x=UI.exp;x.errors={};x.desc=cleanText(x.desc,CONFIG.limits.desc);if(x.desc.length<10)x.errors.desc='Tell us a little more (at least 10 characters).';
  if(x.method==='callback'&&!/^[6-9]\d{9}$/.test(String(x.phone).replace(/\D/g,'')))x.errors.phone='Enter a valid 10-digit mobile number.';
  if(Object.keys(x.errors).length)return bump();
  const b=$('button[type=submit]',f);b.disabled=true;b.innerHTML='<span class="spin"></span>Sending…';
  try{const rec=await Api.createExpert(Session.user,{method:x.method,description:x.desc,phone:String(x.phone).replace(/\D/g,''),when:x.when,photos:x.photos.length,video:!!x.video});
   x.done={id:rec.id,method:x.method,phone:rec.phone,when:x.when};
   if(x.method==='call'){bump();openCall('a TEACTON Expert',`Reference ${rec.id}. Our experts are available ${CONFIG.supportHours}.`)}
   else if(x.method==='chat'){UI.chats.expert=[{me:false,t:'Hello! You\'re chatting with a TEACTON expert.'},{me:true,t:x.desc}];bump();openChat('expert','Chat With Support','')}
   else bump()}catch(e){friendlyErr();b.disabled=false}},
 async profile(f){const name=clean(f.elements.name.value,60),email=clean(f.elements.email.value,100);const errs={};
  if(name.length<2)errs.name='Enter your name.';if(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email))errs.email='Enter a valid email address.';
  if(Object.keys(errs).length)return showErrors(f,errs);await Api.updateProfile(Session.user,{name,email,gender:GENDERS.includes(f.elements.gender.value)?f.elements.gender.value:''});closeSheet();bump();toast('Profile updated.')},
 async welcome(f){const u=Session.user,name=clean(f.elements.name.value,60),email=clean(f.elements.email.value,100),g=(f.querySelector('input[name=gender]:checked')||{}).value||'';const errs={};
  if(name&&name.length<2)errs.name='Enter your full name.';if(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email))errs.email='Enter a valid email address.';
  if(Object.keys(errs).length)return showErrors(f,errs);
  const b=$('button[type=submit]',f);b.disabled=true;b.innerHTML='<span class="spin"></span>Saving…';
  try{await Api.updateProfile(u,{name,email,gender:GENDERS.includes(g)?g:''});const nx=Session.next||'/home';Session.next=null;go(nx)}catch(e){friendlyErr();b.disabled=false;b.textContent='Save & Continue'}},
 async cancel(f){const b=findBooking(f.dataset.id);try{await Api.cancelBooking(b,f.elements.reason.value);closeSheet();UI.tab='cancelled';bump();toast('Booking cancelled.')}catch(e){friendlyErr()}},
 async issue(f){const m=cleanText(f.elements.msg.value,500);if(m.length<5){return showErrors(f,{msg:'Please tell us a little more.'})}
  try{const r=await Api.createTicket(Session.user,{title:f.dataset.title,booking:f.elements.booking.value,message:m});closeSheet();toast(`Received. Ticket ${r.id}`)}catch(e){friendlyErr()}}
};

/* ---------- global delegated listeners ---------- */
document.addEventListener('click',e=>{const el=e.target.closest('[data-a]');if(!el||el.getAttribute('aria-disabled')==='true'&&el.dataset.a!=='wiz-mode')return;const fn=A[el.dataset.a];if(fn)fn(el,e)});
document.addEventListener('submit',e=>{const f=e.target.closest('form[data-f]');if(!f)return;e.preventDefault();F[f.dataset.f](f)});
document.addEventListener('input',e=>{const el=e.target;
 if(el.dataset.bind){const[r,k]=el.dataset.bind.split('.'),o=BIND[r]();if(o){o[k]=el.value;if(el.id==='desc'){const c=$('#cnt');c&&(c.textContent=el.value.length)}}}
 if(el.dataset.search!==undefined){const q=el.value.trim().toLowerCase(),out=$('#sr');if(q.length<2){out.innerHTML='';return}
  const hits=[];CATALOG.forEach(c=>c.problems.forEach(p=>{if((p.name+' '+c.name).toLowerCase().includes(q))hits.push([c,p])}));
  out.innerHTML=toS(hits.length?html`<div class="stack" style="--g:8px">${hits.slice(0,6).map(([c,p])=>html`<button class="result" data-a="start" data-c="${c.id}" data-p="${p.id}"><span><b>${p.name}</b><br><small>${c.name}</small></span>${ic('chev',18)}</button>`)}</div>`:html`<div class="notice">${ic('info',18)}<span>No matching service. <a href="#/expert">Talk to an Expert</a> and we'll help.</span></div>`)}
 if(el.closest('#otp')){el.value=el.value.replace(/\D/g,'').slice(-1);if(el.value){const n=el.nextElementSibling;n?n.focus():$('#otp').closest('form').querySelector('button[type=submit]').focus()}}
 if(el.name==='phone'||el.name==='mobile'||el.name==='pin'){el.value=el.value.replace(/\D/g,'')}});
document.addEventListener('keydown',e=>{const el=e.target;if(el.closest&&el.closest('#otp')){const ins=$$('#otp input'),i=+el.dataset.i;
 if(e.key==='Backspace'&&!el.value&&i>0){ins[i-1].focus();ins[i-1].value=''}
 if(e.key==='ArrowLeft'&&i>0)ins[i-1].focus();if(e.key==='ArrowRight'&&i<5)ins[i+1].focus()}
 if((e.key==='Enter'||e.key===' ')&&el.getAttribute&&el.getAttribute('role')==='radio'&&el.tagName!=='BUTTON'){e.preventDefault();el.click()}});
document.addEventListener('paste',e=>{const el=e.target;if(!el.closest||!el.closest('#otp'))return;e.preventDefault();const d=(e.clipboardData.getData('text')||'').replace(/\D/g,'').slice(0,6);$$('#otp input').forEach((x,i)=>x.value=d[i]||'');const l=$$('#otp input')[Math.min(d.length,5)];l&&l.focus()});
document.addEventListener('change',e=>{const el=e.target;if(el.dataset.file){const t=target(el.dataset.target);if(!t)return;const n=addFiles(t,el.dataset.file,[...el.files]);el.value='';if(n)bump()}
 else if(el.dataset.bind&&el.tagName==='SELECT'){const[r,k]=el.dataset.bind.split('.');BIND[r]()[k]=el.value}});
window.addEventListener('hashchange',()=>render());

/* ---------- boot ---------- */
render();
