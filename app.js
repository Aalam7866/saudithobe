import { FIREBASE_CONFIG } from './config.js';
const DEMO=new URLSearchParams(location.search).has('demo')||!FIREBASE_CONFIG.apiKey;const LIVE=!DEMO;
/* ================= Icons ================= */
const I={box:'<path d="M21 8 12 3 3 8v8l9 5 9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/>',msg:'<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/><path d="M8 10h8M8 14h5"/>',
 dash:'<path d="M3 13h8V3H3zM13 21h8V11h-8zM3 21h8v-6H3zM13 3v6h8V3z"/>',
 orders:'<path d="M9 4h6l1 2h3v15H5V6h3z"/><path d="M9 11h6M9 15h4"/>',
 plus:'<path d="M12 5v14M5 12h14"/>',
 users:'<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6 6 0 0 1 3.5 6"/>',
 tape:'<path d="M3 7h13a5 5 0 0 1 0 10H3z"/><circle cx="16" cy="12" r="2"/><path d="M6 7v3M9 7v4M12 7v3"/><path d="M16 17h5"/>',
 cash:'<rect x="2.5" y="6" width="19" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 9v.01M18 15v.01"/>',
 worker:'<circle cx="12" cy="7" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/><path d="M9 14l3 3 3-3"/>',
 branch:'<path d="M3 21h18M5 21V8l7-5 7 5v13M9 21v-6h6v6"/>',
 chart:'<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
 cog:'<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>',
 wa:'<path d="M3.5 20.5l1.3-4A8.5 8.5 0 1 1 8 19.5z"/><path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1-1.5-2-1-1 .8a4 4 0 0 1-2-2l.8-1-1-2z"/>',
 x:'<path d="M6 6l12 12M18 6 6 18"/>',
 cal:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4M7 14h3M7 17h6"/>',
 crown:'<path d="M3 8l4 4 5-7 5 7 4-4-2 11H5z"/>',
 board:'<rect x="3" y="4" width="5" height="16" rx="1"/><rect x="10" y="4" width="5" height="11" rx="1"/><rect x="17" y="4" width="4" height="7" rx="1"/>',
 till:'<rect x="3" y="10" width="18" height="10" rx="2"/><path d="M7 10V5h10v5M8 14h2M14 14h2M8 17h8"/>',
 needle:'<path d="M20 4 7 17M17 3l4 4"/><circle cx="5.5" cy="18.5" r="2"/><path d="M14 6c-4 0-9 3-9 9"/>'
};
const ico=(k,sw=1.9)=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${I[k]}</svg>`;

/* ================= Reference data ================= */
const STAGES=[{k:'cut',t:'Cutting',c:'s-cut'},{k:'sew',t:'Tailoring',c:'s-sew'},{k:'ready',t:'Ready for pickup',c:'s-ready'},{k:'done',t:'Delivered',c:'s-done'}];
/* workshop flow (Settings → Workshop flow, drag to change): the steps in order; "after" = starts when the previous main
   step is finished, "with" = starts as soon as the previous main step starts; "send" = after stitching the tailor sends it
   (hinge, tatreez, bottom cutting for zip and hinge orders – after the hinge); off = not used (ironing). When every step the order needs is done the tailor
   ticks Ready (FLOW_OPT.tready) – or, with that off, it is ready by itself. */
const TASK_DEF={cut:{t:'Cutting',role:'Cutter'},sew:{t:'Tailor',role:'Tailor'},hinge:{t:'Hinge',role:'Hinge'},tat:{t:'Tatreez',role:'Tatreez'},btm:{t:'Bottom cutting',role:'Bottom cutting'},iron:{t:'Ironing',role:'Ironing'}};
const FLOW_DEFAULT=[{k:'cut',m:'after',on:true},{k:'sew',m:'after',on:true},{k:'hinge',m:'send',on:true},{k:'tat',m:'send',on:true},{k:'btm',m:'send',on:true},{k:'iron',m:'after',on:false}];
const FLOW_OPT={tready:true};
let FLOW=JSON.parse(JSON.stringify(FLOW_DEFAULT));
const needs=(o,k)=>k==='hinge'?!!o.hinge:k==='tat'?!!o.tatreez:k==='btm'?((+o.zipQty||0)>0||!!o.hinge):true;
const tv=(o,k)=>(o.t&&o.t[k])||'wait';
const isSent=(o,k)=>!!(o.sent&&o.sent[k]);
const TASKS=[],TK={};const ROLE2TASK={Cutter:'cut',Tailor:'sew',Hinge:'hinge',Tatreez:'tat','Bottom cutting':'btm',Ironing:'iron'};
const WORKSHOP_ROLES=[],ROLES=[];
const ironOn=()=>FLOW.some(f=>f.k==='iron'&&f.on);
function applyFlow(){
  const on=FLOW.filter(f=>f.on);TASKS.length=0;
  on.forEach((f,i)=>{let pm=null;for(let j=i-1;j>=0;j--)if(on[j].m==='after'){pm=on[j].k;break}
    TASKS.push({k:f.k,...TASK_DEF[f.k],m:f.m,prev:pm,avail:o=>f.m==='send'?(tv(o,f.k)!=='wait'||(tv(o,'sew')==='done'&&isSent(o,f.k))):!pm?true:f.m==='with'?tv(o,pm)!=='wait':tv(o,pm)==='done'})});
  Object.keys(TK).forEach(k=>delete TK[k]);TASKS.forEach(t=>TK[t.k]=t);
  const used=r=>{const k=ROLE2TASK[r];return !k||on.some(f=>f.k===k)};
  WORKSHOP_ROLES.length=0;WORKSHOP_ROLES.push(...['Tailor','Cutter','Hinge','Tatreez','Bottom cutting','Ironing'].filter(used));
  ROLES.length=0;ROLES.push(...['Tailor','Cutter','Hinge','Tatreez','Bottom cutting','Ironing','Cashier','Branch manager','Factory supervisor'].filter(used));
}
applyFlow();
/* all the steps this order needs are done (main steps + the ones the tailor sends) */
const allStepsDone=o=>TASKS.filter(t=>t.m!=='with'&&needs(o,t.k)).every(t=>tv(o,t.k)==='done')&&TASKS.filter(t=>t.m==='with'&&needs(o,t.k)).every(t=>tv(o,t.k)==='done');
/* stitched, now with the tailor: send for hinge / tatreez / bottom cutting, then tick Ready */
const atTailor=o=>o.st!=='done'&&o.st!=='ready'&&tv(o,'sew')==='done'&&!!TK.sew;
/* bottom cutting of a hinge order goes after the hinge is finished (sent by the hinge worker or the tailor) */
const canSend=(o,k)=>tv(o,'sew')==='done'&&(k!=='btm'||!needs(o,'hinge')||tv(o,'hinge')==='done');
const toSend=o=>TASKS.filter(t=>t.m==='send'&&needs(o,t.k)&&tv(o,t.k)==='wait'&&!isSent(o,t.k)&&canSend(o,t.k));
/* the hinge worker: his finished hinge orders that still have to go for bottom cutting */
const hingeBack=w=>TK.btm&&TK.btm.m==='send'?orders.filter(o=>o.st!=='done'&&o.st!=='ready'&&tv(o,'hinge')==='done'&&o.tw.hinge===w.id&&needs(o,'btm')&&tv(o,'btm')==='wait'&&!isSent(o,'btm')&&canSend(o,'btm')):[];
function syncSt(o){if(o.st==='done'||o.st==='ready')return;const mains=TASKS.filter(t=>t.m==='after'&&needs(o,t.k));
  // hold = the website's tailor will tick Ready (the shop exe then never marks it ready by itself)
  const tr=FLOW_OPT.tready&&!!TK.sew;o.hold=tr&&tv(o,'sew')==='done';
  if(mains.length&&allStepsDone(o)&&!tr){o.st='ready';o.hold=false;return}
  o.st=(mains[0]&&tv(o,mains[0].k)==='done')||tv(o,'sew')==='done'?'sew':'cut'}
/* the tailor: send this order to hinge / tatreez / bottom cutting */
function sendTask(o,k){o.sent={...(o.sent||{}),[k]:true};if(!o.tw[k]){const w=firstOf(TK[k].role,o.made);o.tw[k]=w?w.id:null}toast(`${ono(o)}: sent for ${TK[k].t.toLowerCase()}`)}
/* the tailor: everything is done, the order is ready for pickup → popup for the owner and that branch */
function markReady(o){if(!allStepsDone(o)){toast('Not finished yet: '+TASKS.filter(t=>needs(o,t.k)&&tv(o,t.k)!=='done').map(t=>t.t).join(', '));return}
  o.st='ready';o.hold=false;toast(`${ono(o)} ready for pickup · owner and ${bname(o.branch)} notified`);notifyReady(o)}
const pending=(o,k)=>o.st!=='done'&&!!TK[k]&&TK[k].avail(o)&&tv(o,k)!=='done'&&needs(o,k);
const SI=Object.fromEntries(STAGES.map((s,i)=>[s.k,i]));
const FABRICS=['Toyobo (Japan)','Shakespeare (UK)','Loriana','Korean summer','Daniel Hechter','Egyptian cotton'];
/* the shop's fabric stock and embroidery list (live: sent by the AL THOB exe) – the order page works like the exe's order window */
const STOCK=!DEMO?[]:FABRICS.map((f,i)=>({code:1111+i,name:f,company:'',colour:'',rate:[380,320,260,220,300,240][i],stock:[40,12,25,8,0,30][i]}));
const EMBL=!DEMO?[]:[{code:1,model:'Name on pocket',price:30},{code:2,model:'Collar line',price:45},{code:3,model:'Cuff design',price:35}];
const PMETHODS=['Cash','Span','Mada','Visa','Bank Transfer','Cheque','STC Pay'];
const OUT_ITEM='تفصيل ثوب قماش خارجي',OUT_RATE=180,VAT_RATE=0.15;
/* the website's money groups (daily report): Cash / Card (mada) / Transfer */
const webCat=m=>/cash/i.test(m)?'Cash':/mada|span|visa|card/i.test(m)?'Card (mada)':/transfer|stc|cheque/i.test(m)?'Transfer':m;
const vatOf=net=>Math.round(net*VAT_RATE/(1+VAT_RATE)*100)/100;
/* Measurement sheet: the same boxes, tick boxes and drawings as the shop exe's paper (AL THOB · MeasurementLayout = Sheet).
   Keys are the exe's own (measurements.data), so the sync copies them 1:1. Values are text; a tick / drawing is "1".
   [key, label, type]  type: '' = box · 'big' = text area · 'tick' = tick box */
const MSHEET=[
 {g:'Sleeve & cuff',ar:'الكم والكبك',f:[['p_mid0_0','الكم سادة ١'],['p_mid0_1','الكم سادة ٢'],['p_mid0_2','الكم سادة ٣'],['p_cuff_0','الكبك ١'],['p_cuff_1','الكبك ٢'],['p_cuff_2','الكبك ٣'],['p_mid1','تنزيلة']]},
 {g:'Row, right to left',ar:'السطر',f:[['p_row0','خانة ١'],['p_row1','خانة ٢'],['p_row2','خانة ٣'],['p_row4','سادة'],['p_row6','كبك'],['p_row8','قلاب'],['p_row10','سادة ٢'],['p_row12','قطن'],['p_row14','سلك و شتوي']]},
 {g:'Hand & chest',ar:'يد سادة · صدر',f:[['p_chk_hand','يد سادة','tick'],['p_hand','يد سادة'],['p_chk_handcuff','كبك','tick'],['p_hand_cuff','كبك'],['p_wide','خانة ٥ سم'],['p_chk_jabzor','جبزور','tick'],['p_chest1','صدر ١'],['p_chest2','صدر ٢']]},
 {g:'Drawings',ar:'الرسومات',f:[['p_t_btn','باين','tick'],['p_t_btn_sq','باين · مربع','tick'],['p_t_hidden','مخفي','tick'],['p_t_hidden_sq','مخفي · مربع','tick'],['p_t_zip','سحاب','tick'],['p_t_zip_sq','سحاب · مربع','tick'],['p_t_hzip','مخفي سحاب','tick'],['p_t_hzip_sq','مخفي سحاب · مربع','tick'],
   ['p_t_col_turn','ياقة قلاب','tick'],['p_t_col_round','ياقة مدور','tick'],['p_t_col_band','ياقة مردعة','tick'],['p_t_cuff_plain','يد سادة','tick'],['p_t_cuff_chamfer','كبك مشطوف','tick'],['p_t_cuff_square','كبك مربع','tick'],['p_t_cuff_round','كبك مدور','tick'],['p_t_cuff_double','كبك دبل','tick'],
   ['p_t_pk_normal','جيب عادي','tick'],['p_t_pk_round','جيب مدور','tick'],['p_t_pk_square','جيب مربع','tick'],['p_t_jabzor','جبزور','tick'],['p_t_jabzor_sq','جبزور · مربع','tick'],['p_cuff_note','ملاحظة الكبك','big']]},
 {g:'Bottom of the sheet',ar:'أسفل الورقة',f:[['p_chk_pk_hidden','جيب مخفي','tick'],['p_chk_pk_visible','جيب باين','tick'],['p_right1','4.5×5.25'],['p_right2','تحت'],['p_right3','خلف'],['p_val0','تخاليص'],['p_val1','فتحة'],['p_val2','ورك'],['p_val3','جيب'],
   ['p_chk_clip','مشبك','tick'],['p_chk_pen','جيب قلم كامل','tick'],['p_pk_a','جيب ٠٫٧٥ سم'],['p_pk_b','جيب ١٫٥ سم'],['p_left0','يسار'],['p_left1','يسار · الصندوق','big']]},
 {g:'Notes & measurements',ar:'ملاحظات ومقاسات',f:[['p_body','ملاحظات ومقاسات','big']]}];
const MALL=MSHEET.flatMap(g=>g.f),MEAS=MALL.filter(f=>f[2]!=='tick'),MTICK=MALL.filter(f=>f[2]==='tick');
const mVal=(m,k)=>{const v=m&&m[k];return v==null?'':String(v)};
/* filled boxes as label/value tiles, ticked ones as chips */
function mShow(m){
  const box=MEAS.filter(([k])=>mVal(m,k)!=='').map(([k,t])=>`<div><span dir="rtl">${esc(t)}</span><b dir="auto" style="font-size:14px;white-space:pre-wrap">${esc(mVal(m,k))}</b></div>`).join('');
  const tk=MTICK.filter(([k])=>mVal(m,k)==='1').map(([,t])=>`<span class="chip on" style="cursor:default">${esc(t)}</span>`).join('');
  return (box?`<div class="kv">${box}</div>`:'')+(tk?`<div class="chips" dir="rtl" style="margin-top:8px">${tk}</div>`:'')||'<div class="muted" style="font-size:13px">No measurement yet.</div>'}
/* the sheet as a form: inputs get id = pre + key */
function mForm(pre,m){
  return MSHEET.map(g=>`<div><p class="h4">${g.g} · <span dir="rtl">${g.ar}</span></p><div class="fgrid meas" dir="rtl" style="grid-template-columns:repeat(auto-fill,minmax(112px,1fr));gap:10px">${g.f.map(([k,t,ty])=>ty==='tick'
    ?`<label class="chip mtick ${mVal(m,k)==='1'?'on':''}" style="display:flex;align-items:center;gap:6px;justify-content:center;align-self:end;min-height:38px"><input type="checkbox" id="${pre}${k}" data-k="${k}" ${mVal(m,k)==='1'?'checked':''} style="width:auto;margin:0">${esc(t)}</label>`
    :`<div class="field"${ty==='big'?' style="grid-column:1/-1"':''}><label for="${pre}${k}">${esc(t)}</label>${ty==='big'?`<textarea id="${pre}${k}" data-k="${k}" rows="3" dir="auto">${esc(mVal(m,k))}</textarea>`:`<input id="${pre}${k}" data-k="${k}" dir="auto" value="${esc(mVal(m,k))}">`}</div>`).join('')}</div></div>`).join('')}
function mRead(pre){const m={};MALL.forEach(([k,,ty])=>{const e=document.getElementById(pre+k);if(!e)return;if(ty==='tick'){if(e.checked)m[k]='1'}else{const v=e.value.trim();if(v)m[k]=v}});return m}
function mFill(pre,m){MALL.forEach(([k,,ty])=>{const e=document.getElementById(pre+k);if(!e)return;if(ty==='tick'){e.checked=mVal(m,k)==='1';e.closest('.chip').classList.toggle('on',e.checked)}else e.value=mVal(m,k)})}
function mTicks(){document.querySelectorAll('.mtick input').forEach(c=>c.onchange=()=>c.closest('.chip').classList.toggle('on',c.checked))}

/* Design catalogue — mirrors F:\AL THOB\thobe_design folders */
const DESIGN_=[
 {k:'qalab',t:'Collar',ar:'Qalab',opts:[['formal_2','Formal 2'],['formal_2_button','Formal 2 · button'],['formal_2_hidden_snap','Formal 2 · hidden snap'],['french','French'],['french_button','French · button'],['formal','Formal'],['formal_button','Formal · button']]},
 {k:'raqba',t:'Neck',ar:'Raqba',opts:[['regular','Regular'],['regular_button','Regular · button'],['regular_hidden_snap','Regular · hidden snap'],['chinese_square','Chinese square'],['round','Round'],['round_button','Round · button'],['chinese_round','Chinese round']]},
 {k:'jabzoor',t:'Placket',ar:'Jabzoor',opts:[['square_visible','Square · visible'],['triangle_visible','Triangle · visible'],['square_hidden','Square · hidden'],['triangle_hidden','Triangle · hidden'],['square_zipper','Square · zipper'],['triangle_zipper','Triangle · zipper'],['square_hidden_padding','Square · hidden, padded']]},
 {k:'kabak',t:'Cuff',ar:'Kabak',opts:[['plain','Plain'],['plain_open','Plain · open'],['formal','Formal'],['french','French'],['chamfered','Chamfered'],['square','Square'],['round','Round'],['double','Double']]},
 {k:'jaib',t:'Pocket',ar:'Jaib',opts:[['square','Square'],['square_pen','Square · pen slot'],['chamfered','Chamfered'],['chamfered_pen','Chamfered · pen slot'],['round','Round'],['hidden','Hidden'],['hidden_pen','Hidden · pen slot']]}
];
/* ================= Demo data ================= */
let seed=11;const rnd=()=>(seed=(seed*9301+49297)%233280)/233280;const pick=a=>a[Math.floor(rnd()*a.length)];
const today=new Date();today.setHours(0,0,0,0);
const addD=(d,n)=>{const x=new Date(d);x.setDate(x.getDate()+n);return x};

const BRANCHES=!DEMO?[]:[
 {id:1,code:'OLY',name:'Al Olaya',city:'Riyadh',address:'Olaya St., near Kingdom Centre',phone:'0112 345 678',opened:new Date(2019,2,10),hours:'9:00 – 13:00 · 16:30 – 23:00',main:true,type:'shop'},
 {id:2,code:'MLZ',name:'Al Malaz',city:'Riyadh',address:'Salah Al-Din St., Al Malaz',phone:'0114 778 120',opened:new Date(2022,8,1),hours:'9:00 – 13:00 · 16:30 – 23:00',type:'shop'},
 {id:3,code:'JED',name:'Al Rawdah',city:'Jeddah',address:'Prince Sultan Rd., Al Rawdah',phone:'0126 650 904',opened:new Date(2025,10,20),hours:'10:00 – 13:00 · 17:00 – 24:00',type:'shop'},
 {id:4,code:'FAC',name:'Central Factory',city:'Riyadh',address:'2nd Industrial City, Al Sulay',phone:'0112 980 455',opened:new Date(2024,1,4),hours:'7:00 – 17:00 · two shifts in season',type:'factory',capacity:420}];
const isFac=id=>{const b=BRANCHES.find(x=>x.id===id);return !!b&&b.type==='factory'};
const SHOPS=()=>BRANCHES.filter(b=>b.type!=='factory'),FACS=()=>BRANCHES.filter(b=>b.type==='factory');
const bname=id=>{const b=BRANCHES.find(x=>x.id===id);return b?b.name:'—'};

const WNAMES=[['Abu Ahmed','Tailor',1],['Mohammed Iqbal','Tailor',1],['Abdulrahman Saleh','Cutter',1],['Shahid Khan','Tailor',1],['Rafiq Hossain','Ironing',1],['Faisal Al-Harthi','Branch manager',1],['Imran Ali','Cashier',1],
 ['Javed Akhtar','Tailor',2],['Sohail Ahmed','Tailor',2],['Nasir Uddin','Cutter',2],['Kamal Hassan','Ironing',2],['Turki Al-Dawsari','Branch manager',2],
 ['Arshad Mehmood','Tailor',3],['Bilal Qureshi','Tailor',3],['Zahid Hussain','Cutter',3],['Hani Al-Sharif','Cashier',3],
 ['Ghulam Rasool','Tailor',4],['Tariq Mahmood','Tailor',4],['Abdul Karim','Tailor',4],['Manzoor Ahmed','Tailor',4],['Riaz Hussain','Cutter',4],['Shafiq Rahman','Cutter',4],['Anwar Hossain','Ironing',4],['Saleem Akhtar','Factory supervisor',4],
 ['Sajid Ali','Hinge',4],['Naveed Iqbal','Hinge',4],['Irfan Ahmed','Tatreez',4],['Asif Raza','Hinge',1],['Mubeen Khan','Tatreez',1],['Rashid Mir','Hinge',2],['Danish Akram','Hinge',3]];
const NATS=['Pakistan','India','Bangladesh','Saudi Arabia'];
const workers=!DEMO?[]:WNAMES.map(([n,r,b],i)=>({id:i+1,name:n,role:r,branch:b,phone:'05'+String(Math.floor(10000000+rnd()*89999999)),
  nat:n.includes('Al-')?'Saudi Arabia':pick(NATS.slice(0,3)),joined:addD(today,-Math.floor(200+rnd()*1600)),
  pay:r==='Tailor'?(i%4===3?'piece':'target'):'salary',rate:r==='Tailor'?pick([22,25,28]):pick([2800,3200,3500,4500]),basic:pick([1200,1500,1800]),target:pick([50,60,70]),comm:pick([12,15,18]),mdone:r==='Tailor'?Math.round(40+rnd()*45):0,
  iqama:n.includes('Al-')?null:addD(today,Math.floor(-10+rnd()*400)),status:i===8?'leave':'active',
  att:Array.from({length:14},(_,k)=>{const d=addD(today,k-13);return d.getDay()===5?'o':(rnd()>.93?'a':'p')})}));
const okW=w=>w.status!=='inactive'&&w.status!=='blocked';
const tailorsOf=b=>workers.filter(w=>w.role==='Tailor'&&okW(w)&&(!b||w.branch===b));
const firstOf=(role,b)=>workers.find(w=>w.role===role&&w.branch===b&&w.status==='active')||workers.find(w=>w.role===role&&w.status==='active');

const NAMES=['Abdullah Al-Shehri','Faisal Al-Otaibi','Sultan Al-Qahtani','Khalid Al-Dosari','Majed Al-Harbi','Turki Al-Mutairi','Naif Al-Ghamdi','Bandar Al-Zahrani','Saud Al-Anazi','Mishal Al-Shammari','Yousef Al-Ahmadi','Hamad Al-Subaie','Rakan Al-Buqami','Omar Al-Juhani','Nasser Al-Yami','Waleed Al-Rashidi','Ibrahim Al-Malki','Ziyad Al-Shamrani','Fahad Al-Sahli','Ahmed Al-Zahrani','Salman Al-Ruwaili','Majid Al-Asmari'];
const mk=(base)=>({p_mid0_0:'7.75',p_mid0_1:'6.25',p_mid0_2:'5.75',p_cuff_0:'7.5',p_cuff_1:'6.5',p_cuff_2:'6.25',p_mid1:'2.75',p_row0:String(Math.round(base*0.43)),p_row1:String(Math.round(16+rnd()*4)),p_row2:String(Math.round(15+rnd()*4)),p_row4:String(Math.round(21+rnd()*4)),p_chest1:String(Math.round(21+rnd()*4)),p_chest2:'8.5',p_val0:'6',p_val1:'6.75',p_val2:String(Math.round(24+rnd()*3)),p_val3:'7.75',p_t_col_turn:'1',p_t_cuff_chamfer:'1',p_chk_pen:'1'});
const SONS=['Fahad','Saad','Abdulaziz','Talal','Mohammed'];
const customers=!DEMO?[]:NAMES.map((n,i)=>{const profiles=[{name:'Self',m:mk(140)}];if(rnd()>.6)profiles.push({name:'Son · '+pick(SONS),m:mk(112)});if(rnd()>.8)profiles.push({name:'Winter thobe',m:{...profiles[0].m,p_chest1:String(+profiles[0].m.p_chest1+1)}});
  const hist=[{d:addD(today,-Math.floor(30+rnd()*300)),t:'First measurement taken',by:pick(['Abu Ahmed','Javed Akhtar','Arshad Mehmood'])}];
  if(rnd()>.4)hist.unshift({d:addD(today,-Math.floor(rnd()*28)),t:`صدر ١ ${+profiles[0].m.p_chest1-1} → ${profiles[0].m.p_chest1}`,by:pick(['Abu Ahmed','Mohammed Iqbal','Sohail Ahmed'])});
  return{id:i+1,name:n,phone:'05'+String(Math.floor(10000000+rnd()*89999999)),branch:i%5===4?2:i%7===6?3:1,profiles,hist}});
const orders=[];let rno=1240;
for(let i=0;i<(DEMO?64:0);i++){
  const c=pick(customers),qty=1+Math.floor(rnd()*4),price=pick([180,220,260,320,380]);
  const branch=rnd()<.55?1:rnd()<.65?2:3;
  const created=addD(today,-Math.floor(rnd()*40));const due=addD(created,7+Math.floor(rnd()*10));
  let st;const age=(today-created)/864e5;
  if(age>25)st='done';else if(age>16)st=pick(['ready','done','ready']);else if(age>9)st=pick(['sew','iron','ready']);else if(age>3)st=pick(['cut','sew']);else st=pick(['new','new','cut']);
  const ost=st;
  const total=qty*price;const paid=st==='done'?total:Math.min(total,Math.round(total*pick([0.3,0.5,0.5,1])/10)*10);
  const d={};DESIGN_.forEach(g=>d[g.k]=pick(g.opts)[0]);
  const made=rnd()<.42?4:branch;
  orders.push({ost,rno:rno++,cid:c.id,branch,made,qty,price,total,paid,created,due,st,tailor:pick(tailorsOf(made)).id,fabric:pick(FABRICS),design:d,profile:0,note:rnd()>.75?'Embroider name on pocket':''});
}
orders.sort((a,b)=>b.created-a.created);
let s3=7;const r3=()=>(s3=(s3*9301+49297)%233280)/233280;
orders.forEach(o=>{const D='done',W='wait',G='doing';const x=o.ost;o.tatreez=!!o.note||r3()<.35;o.hinge=r3()<.7;
  o.t=x==='new'?{cut:W,sew:W,hinge:W,tat:W,iron:W}:x==='cut'?{cut:G,sew:W,hinge:W,tat:W,iron:W}:x==='sew'?{cut:D,sew:r3()<.3?W:G,hinge:r3()<.5?D:G,tat:r3()<.4?D:G,iron:W}:x==='iron'?{cut:D,sew:G,hinge:D,tat:r3()<.6?D:G,iron:W}:{cut:D,sew:D,hinge:D,tat:D,iron:x==='ready'&&r3()<.4?W:D};
  if(o.t.sew===W){o.t.hinge=W;o.t.tat=W}
  o.tw={cut:o.t.cut!==W?(firstOf('Cutter',o.made)||{}).id:null,hinge:o.t.hinge!==W?(firstOf('Hinge',o.made)||{}).id:null,tat:o.t.tat!==W?(firstOf('Tatreez',o.made)||{}).id:null,iron:o.t.iron!==W?(firstOf('Ironing',o.made)||{}).id:null};
  o.t.btm=W;o.sent={};if(r3()<.25){o.zipQty=o.qty}
  if(o.t.sew===D){['hinge','tat'].forEach(k=>{if(o.t[k]!==W)o.sent[k]=true});if(o.zipQty&&x!=='sew'){o.t.btm=D;o.sent.btm=true}}
  if(x!=='done'&&x!=='ready')o.st='cut';syncSt(o);delete o.ost});
const notices=[];
function notifyReady(o,silent){const n={id:DEMO?notices.length+1:Math.random().toString(36).slice(2,12),rno:o.rno,branch:o.branch,made:o.made,tailor:o.tailor,qty:o.qty,at:new Date(),seen:{},open:TASKS.filter(t=>t.k!=='sew'&&t.k!=='cut'&&needs(o,t.k)&&tv(o,t.k)!=='done').map(t=>t.t)};notices.push(n);if(!silent)showPopups()}
orders.filter(o=>o.st==='ready').slice(0,2).forEach(o=>notifyReady(o,true));
const payLog=[];orders.forEach(o=>{if(+o.created>=+addD(today,-13)&&o.paid)payLog.push({d:new Date(o.created),rno:o.rno,branch:o.branch,amt:o.paid,m:rnd()>.5?'Card (mada)':'Cash',t:'Deposit'})});
(DEMO?[[1,380,'Cash'],[1,520,'Card (mada)'],[2,260,'Cash'],[1,190,'Transfer'],[3,440,'Card (mada)']]:[]).forEach(([b,a,m],i)=>payLog.push({d:today,rno:1240+i*7,branch:b,amt:a,m,t:'Balance'}));
const cust=id=>customers.find(c=>c.id===id)||{id:0,name:'—',phone:'',branch:0,profiles:[{name:'Self',m:{}}],hist:[]};
const wk=id=>workers.find(w=>w.id===id)||{id:0,name:'—',role:'',branch:0,att:[],status:'inactive',pay:'salary',rate:0};

function glyph(group,opt){
  const s='fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
  const btn=opt.includes('button')?'<circle cx="32" cy="38" r="2.2" fill="currentColor"/>':'';
  const snap=opt.includes('snap')||opt.includes('hidden')?'<path d="M32 34v10" stroke-dasharray="2 3"/>':'';
  if(group==='qalab'){const fr=opt.startsWith('french');return `<svg viewBox="0 0 64 54" ${s}><path d="M14 46 22 14h20l8 32"/><path d="M22 14 32 ${fr?30:26} 42 14"/><path d="M22 14 ${fr?12:16} ${fr?30:26} 28 30"/><path d="M42 14 ${fr?52:48} ${fr?30:26} 36 30"/>${btn}${snap}</svg>`}
  if(group==='raqba'){const ch=opt.startsWith('chinese'),rd=opt.includes('round');return `<svg viewBox="0 0 64 54" ${s}><path d="M12 48 20 18h24l8 30"/>${ch?(rd?'<path d="M20 18q12-8 24 0v6q-12-7-24 0z"/>':'<path d="M20 12h24v10H20z"/>'):(rd?'<path d="M20 18q12 14 24 0"/>':'<path d="M20 18q12 6 24 0v6q-12 5-24 0z"/>')}<path d="M32 26v20"/>${btn}${snap}</svg>`}
  if(group==='jabzoor'){const tri=opt.includes('triangle');const zip=opt.includes('zipper');return `<svg viewBox="0 0 64 54" ${s}><path d="M26 6h12v34${tri?'l-6 8-6-8':'h-12'}z"/>${zip?'<path d="M32 9v30" stroke-dasharray="1.5 2.5"/>':(opt.includes('hidden')?'':'<circle cx="32" cy="14" r="1.8" fill="currentColor"/><circle cx="32" cy="24" r="1.8" fill="currentColor"/><circle cx="32" cy="34" r="1.8" fill="currentColor"/>')}${opt.includes('padding')?'<path d="M28 10h8"/>':''}</svg>`}
  if(group==='kabak'){const sh={plain:'M14 18h36v20H14z',plain_open:'M14 18h36v20H14z',formal:'M14 16h36v24H14z',french:'M12 12h40v30H12z',chamfered:'M18 14h28l6 6v14l-6 6H18l-6-6V20z',square:'M12 14h40v26H12z',round:'M22 14h20a10 10 0 0 1 10 10v6a10 10 0 0 1-10 10H22a10 10 0 0 1-10-10v-6a10 10 0 0 1 10-10z',double:'M12 12h40v30H12z'}[opt];return `<svg viewBox="0 0 64 54" ${s}><path d="${sh}"/>${opt==='double'||opt==='french'?'<path d="M12 27h40"/>':''}${opt==='plain_open'?'<path d="M44 18v20" stroke-dasharray="2 3"/>':'<circle cx="44" cy="27" r="2" fill="currentColor"/>'}</svg>`}
  const base=opt.replace('_pen','');const p={square:'M18 12h28v30H18z',chamfered:'M18 12h28v24l-6 6H24l-6-6z',round:'M18 12h28v20a14 10 0 0 1-28 0z',hidden:'M16 16h32'}[base];
  return `<svg viewBox="0 0 64 54" ${s}><path d="${p}"/>${base==='hidden'?'<path d="M16 16q16 6 32 0" stroke-dasharray="2 3"/>':''}${opt.includes('pen')?'<path d="M38 4v18" stroke-width="3"/>':''}</svg>`;
}

/* ---- daily logs: deliveries and production (demo history, last 14 days) ---- */
let s2=99;const r2=()=>(s2=(s2*9301+49297)%233280)/233280;const p2=a=>a[Math.floor(r2()*a.length)];
const delLog=[],prodLog=[],dedLog=[];
/* salary deductions: {sid, branch, d, amt, reason, by} — added by the owner / branch manager / factory supervisor */
workers.filter(w=>w.role==='Tailor').slice(0,5).forEach((w,i)=>{dedLog.push({sid:w.id,branch:w.branch,d:addD(today,-(3+i*4)),amt:[100,50,200,75,150][i],reason:['Advance','Absent 1 day','Advance','Damaged fabric','Advance'][i],by:'Owner'})});
payLog.filter(p=>p.t==='Balance').forEach(p=>delLog.push({d:p.d,rno:p.rno,branch:p.branch,qty:1+Math.floor(r2()*3),amt:p.amt}));
for(let k=1;k<(DEMO?14:0);k++){const d=addD(today,-k);if(d.getDay()===5)continue;
  [1,2,3].forEach(b=>{const n=b===1?3+Math.floor(r2()*4):1+Math.floor(r2()*4);for(let j=0;j<n;j++){const amt=p2([120,190,260,330,380,520,640]),m=p2(['Cash','Cash','Card (mada)','Card (mada)','Transfer']),rno=1100+Math.floor(r2()*140);
    payLog.push({d,rno,branch:b,amt,m,t:'Balance'});delLog.push({d,rno,branch:b,qty:1+Math.floor(r2()*4),amt})}});}
for(let k=0;k<(DEMO?14:0);k++){const d=addD(today,-k);if(d.getDay()===5)continue;
  workers.forEach(w=>{if(w.att[13-k]==='a')return;const f=isFac(w.branch);
    if(w.role==='Tailor'){const q=k===0?1+Math.floor(r2()*3):(f?2:1)+Math.floor(r2()*(f?4:3));if(q)prodLog.push({d,w:w.id,made:w.branch,stage:'sew',qty:q})}
    if(w.role==='Cutter')prodLog.push({d,w:w.id,made:w.branch,stage:'cut',qty:(k===0?2:f?8:5)+Math.floor(r2()*6)});
    if(w.role==='Ironing')prodLog.push({d,w:w.id,made:w.branch,stage:'iron',qty:(k===0?2:f?7:4)+Math.floor(r2()*5)});
    if(w.role==='Hinge')prodLog.push({d,w:w.id,made:w.branch,stage:'hinge',qty:(k===0?2:f?6:3)+Math.floor(r2()*5)});
    if(w.role==='Tatreez')prodLog.push({d,w:w.id,made:w.branch,stage:'tat',qty:(k===0?1:f?4:2)+Math.floor(r2()*4)});});}
function stepTask(o,k,by){const cur=o.t[k];if(cur==='done')return;
  if(k==='sew'&&!workers.some(x=>x.id===o.tailor)){const t=by&&by.role==='Tailor'?by:null;if(!t){toast('Choose a tailor first');return}o.tailor=t.id}
  if(k!=='sew'&&!o.tw[k]){const w=by&&by.role===TK[k].role?by:firstOf(TK[k].role,o.made);o.tw[k]=w?w.id:null}
  if(tv(o,k)==='wait'){o.t[k]='doing';toast(`${ono(o)}: ${TK[k].t} started`)}
  else{o.t[k]='done';const wid=k==='sew'?o.tailor:o.tw[k];if(wid)prodLog.push({d:today,w:wid,made:o.made,stage:k,qty:o.qty,rno:o.rno});
    if(k==='sew'){const t=wk(o.tailor);t.mdone=(t.mdone||0)+o.qty}
    toast(`${ono(o)}: ${TK[k].t} finished${k==='cut'?' · sent to the tailor':k==='sew'?(toSend(o).length?' · now send it for '+toSend(o).map(t=>t.t.toLowerCase()).join(', '):FLOW_OPT.tready?' · tick Ready when it is ready':''):k==='hinge'&&needs(o,'btm')&&TK.btm&&tv(o,'btm')==='wait'&&!isSent(o,'btm')?' · now send it for bottom cutting':TK[k].m==='send'?' · back to the tailor':''}`)}
  const before=o.st;syncSt(o);if(before!=='ready'&&o.st==='ready')notifyReady(o)}
const taskBtn=(o,k)=>tv(o,k)==='wait'?`Start ${TK[k].t.toLowerCase()}`:`Finish ${TK[k].t.toLowerCase()}`;
const taskPill=(o,k)=>{const v=tv(o,k);if(!needs(o,k))return '<span class="pill s-done">Not needed</span>';if(v==='done')return '<span class="pill s-ready">Done</span>';if(v==='doing')return '<span class="pill s-cut">In progress</span>';return TK[k].avail(o)?'<span class="pill s-new">Waiting</span>':'<span class="pill s-done">Not yet</span>'};
const canTask=()=>ROLE==='tailor';
const canAssign=()=>RA().stage;

/* ================= Helpers ================= */
let curBranch=0; // 0 = all branches
const O=()=>orders.filter(o=>!curBranch||o.branch===curBranch||o.made===curBranch);
const W=()=>workers.filter(w=>!curBranch||w.branch===curBranch);
const sar=n=>Math.round(n).toLocaleString('en-US');
const fmtD=d=>d.toLocaleDateString('en-GB',{day:'numeric',month:'short'});
const fmtY=d=>d.toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'});
const daysLeft=o=>Math.round((o.due-today)/864e5);
const late=o=>o.st!=='done'&&o.st!=='ready'&&daysLeft(o)<0;
const pill=o=>late(o)?`<span class="pill s-late">Overdue</span>`:`<span class="pill ${STAGES[SI[o.st]].c}">${STAGES[SI[o.st]].t}</span>`;
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const pl=(n,w)=>`${n} ${w}${n===1?'':'s'}`;
const initials=n=>n.split(' ').filter(x=>!/^(Al-|Abu)$/.test(x)).map(x=>x.replace('Al-','')[0]).slice(0,2).join('');
const iqDays=w=>w.iqama?Math.round((w.iqama-today)/864e5):null;
const iqPill=w=>{const d=iqDays(w);if(d===null)return '<span class="pill s-done">Citizen</span>';if(d<0)return `<span class="pill s-late">Iqama expired</span>`;if(d<60)return `<span class="pill s-cut">Iqama ${d}d left</span>`;return `<span class="pill s-ready">Iqama valid</span>`};
const bTag=id=>{const b=BRANCHES.find(x=>x.id===id);return b?`<span class="tag">${b.code}</span>`:''};
function toast(t){const el=document.createElement('div');el.className='toast';el.textContent=t;document.body.appendChild(el);setTimeout(()=>el.remove(),2200)}
function drawer(title,sub,body,foot){
  const L=document.getElementById('layer');
  L.innerHTML=`<div class="scrim" id="scrim"></div><aside class="drawer" role="dialog" aria-label="${esc(title)}">
   <div class="dh"><div style="flex:1;min-width:0">${sub}<h3>${title}</h3></div><button class="iconbtn" id="xBtn" aria-label="Close">${ico('x')}</button></div>
   <div class="db">${body}</div>${foot?`<div class="df">${foot}</div>`:''}</aside>`;
  const close=()=>L.innerHTML='';document.getElementById('scrim').onclick=close;document.getElementById('xBtn').onclick=close;return close;
}

/* ================= Navigation ================= */
const ROUTES=[
 {h:'dashboard',t:'Dashboard',s:'Home',i:'dash',g:'Daily work'},
 {h:'orders',t:'Orders',s:'Orders',i:'orders'},
 {h:'new',t:'New order',s:'New',i:'plus'},
 {h:'measurements',t:'Measurements',s:'Measure',i:'tape'},
 {h:'customers',t:'Customers',s:'Customers',i:'users'},
 {h:'payments',t:'Payments',s:'Payments',i:'cash',g:'Business'},
 {h:'workers',t:'Workers',s:'Workers',i:'worker'},
 {h:'branches',t:'Branches & factories',s:'Branches',i:'branch'},
 {h:'daily',t:'Daily report',s:'Daily',i:'cal'},
 {h:'reports',t:'Reports',i:'chart'},
 {h:'stock',t:'Purchases & stock',s:'Stock',i:'box'},
 {h:'whatsapp',t:'WhatsApp',s:'WhatsApp',i:'wa'},
 {h:'messages',t:'Message tracker',s:'Messages',i:'msg'},
 {h:'settings',t:'Settings',i:'cog'},
 {h:'till',t:'Cashier desk',s:'Desk',i:'till',g:'Cashier'},
 {h:'mywork',t:'My work',s:'My work',i:'needle',g:'Workshop'},
 {h:'mypay',t:'My work & pay',s:'My pay',i:'cash'},
 {h:'board',t:'Production board',s:'Board',i:'board'}];
/* ================= Logins (5 roles) ================= */
const ACCESS={
 owner:{no:1,label:'Owner · Admin',name:'Owner',icon:'crown',branch:0,lock:false,home:'dashboard',money:true,pay:true,stage:true,
   pages:['dashboard','daily','orders','new','measurements','customers','payments','workers','branches','reports','stock','whatsapp','messages','settings','till','board'],tabs:['dashboard','daily','orders','workers','branches'],
   can:['Every branch and factory','Daily report: sales, payments, tailoring','Add branches, factories and workers','Only owner can block, deactivate or delete workers']},
 manager:{no:2,label:'Branch manager',name:'Faisal Al-Harthi',icon:'branch',branch:1,lock:true,home:'dashboard',money:true,pay:true,stage:true,
   pages:['dashboard','daily','orders','new','measurements','customers','payments','till','workers','reports','stock','whatsapp','messages','board'],tabs:['dashboard','daily','orders','new','workers'],
   can:['Only his own branch','Shop dashboard and daily report (exe style) + tailoring report','Orders, customers, payments and cashier desk','His branch workers: attendance and work by date / month','Branch reports']},
 measure:{no:3,label:'Measurement',name:'Yasir Mahmood',icon:'tape',branch:1,lock:true,home:'measurements',money:false,pay:false,stage:false,
   pages:['measurements','customers','new'],tabs:['measurements','new','customers'],
   can:['Take and update measurements','Profiles: self, son, winter thobe','Choose collar, cuff, pocket style','Start the order, no prices or cash']},
 cashier:{no:4,label:'Cashier',name:'Imran Ali',icon:'till',branch:1,lock:true,home:'till',money:true,pay:true,stage:false,
   pages:['till','daily','orders','new','payments','customers'],tabs:['till','daily','orders','new'],
   can:['Find a receipt fast','Take deposits and balances','Hand over ready thobes','Today\'s cash and card total']},
 tailor:{no:5,label:'Tailor & factory',name:'Ghulam Rasool',icon:'needle',branch:4,lock:true,home:'mywork',money:false,pay:false,stage:true,
   pages:['mywork','mypay'],tabs:['mywork','mypay'],
   can:['Only his own job cards with measurements','Move his thobes to the next stage','His own daily work report, by month or by date','His salary, target, commission and deductions']}};
const USERS=[
 {role:'owner',name:'Owner',branch:0},
 {role:'manager',name:'Faisal Al-Harthi',branch:1},{role:'manager',name:'Turki Al-Dawsari',branch:2},{role:'manager',name:'Majed Al-Ghamdi',branch:3},
 {role:'measure',name:'Yasir Mahmood',branch:1},{role:'measure',name:'Sohail Ahmed',branch:2},{role:'measure',name:'Arshad Mehmood',branch:3},
 {role:'cashier',name:'Imran Ali',branch:1},{role:'cashier',name:'Kamal Hassan',branch:2},{role:'cashier',name:'Hani Al-Sharif',branch:3},
 {role:'tailor',name:'Ghulam Rasool',branch:4},{role:'tailor',name:'Abu Ahmed',branch:1},{role:'tailor',name:'Javed Akhtar',branch:2},{role:'tailor',name:'Bilal Qureshi',branch:3}];
let ROLE='owner',USER=DEMO?USERS[0]:{role:'owner',name:'',branch:0};const RA=()=>({...ACCESS[ROLE],name:USER.name,branch:USER.branch});
const can=h=>RA().pages.includes(h);
const isOwner=()=>ROLE==='owner';
const isFactoryLogin=()=>ROLE==='tailor'&&isFac(USER.branch)&&(DEMO||USER.job==='Factory supervisor');
const addRoles=()=>isOwner()?ROLES:isFactoryLogin()?WORKSHOP_ROLES:ROLE==='manager'?['Cashier']:[];
const canDed=w=>isOwner()||(ROLE==='manager'&&w.branch===USER.branch)||(isFactoryLogin()&&w.branch===USER.branch);
const managesW=w=>ROLE==='manager'&&w.branch===USER.branch||isFactoryLogin()&&w.branch===USER.branch;
const canEditW=w=>isOwner()||(isFactoryLogin()&&w.branch===USER.branch&&WORKSHOP_ROLES.includes(w.role))||(ROLE==='manager'&&w.branch===USER.branch&&w.role==='Cashier');
const wStatusPill=w=>({leave:'<span class="pill s-cut">On leave</span>',inactive:'<span class="pill s-done">Inactive</span>',blocked:'<span class="pill s-late">Blocked</span>'}[w.status]||'');
/* ready popups for owner and the branch manager */
const myNotices=()=>ROLE==='owner'?notices:ROLE==='manager'?notices.filter(n=>n.branch===USER.branch):[];
function updateBell(){const n=myNotices().filter(x=>!x.seen[USER.name]).length;const b=document.getElementById('bellN');b.textContent=n;b.hidden=!n;document.getElementById('bellBtn').hidden=!(ROLE==='owner'||ROLE==='manager')}
function showPopups(){updateBell();let box=document.getElementById('pops');if(!box){box=document.createElement('div');box.id='pops';box.className='pops';document.body.appendChild(box)}
  const all=myNotices().filter(x=>!x.seen[USER.name]);const list=all.slice(-2).reverse();const more=all.length-list.length;
  box.innerHTML=list.map(n=>{const c=cust(orders.find(o=>o.rno===n.rno).cid);return `<div class="pop" role="alert"><div class="pop-ic">✓</div><div style="flex:1;min-width:0"><b>Order ${onoR(n.rno)} is ready</b><span>${c.name} · ${pl(n.qty,'thobe')} · ${bname(n.branch)} branch</span><span>${wk(n.tailor).name} · ${bname(n.made)}${n.open.length?` · ${n.open.join(' & ')} pending`:''}</span>
   <div style="display:flex;gap:6px;margin-top:6px"><button class="btn sm pri" data-pop-open="${n.id}">Open order</button><button class="btn sm" data-pop-ok="${n.id}">OK</button></div></div></div>`}).join('')+(more?`<button class="btn sm pop" style="justify-content:center;padding:8px" id="popMore">+${more} more ready orders</button>`:'');
  const pm=document.getElementById('popMore');if(pm)pm.onclick=bellList;
  box.querySelectorAll('[data-pop-ok]').forEach(b=>b.onclick=()=>{notices.find(x=>String(x.id)===b.dataset.popOk).seen[USER.name]=1;showPopups()});
  box.querySelectorAll('[data-pop-open]').forEach(b=>b.onclick=()=>{const n=notices.find(x=>String(x.id)===b.dataset.popOpen);n.seen[USER.name]=1;showPopups();openOrder(n.rno)});
}
function bellList(){const list=myNotices().slice().reverse();
  drawer('Ready notifications',`<div class="muted" style="font-size:13px">${ROLE==='owner'?'All branches':bname(USER.branch)+' branch'}</div>`,
   `<div class="rows" style="border:1px solid var(--line);border-radius:8px">${list.map(n=>`<div class="row" data-r="${n.rno}" style="cursor:pointer"><span class="rid">${onoR(n.rno)}</span><div class="grow"><b>${cust(orders.find(o=>o.rno===n.rno).cid).name}</b><span>${pl(n.qty,'thobe')} · ${bname(n.branch)} · tailor ${wk(n.tailor).name}</span></div>${n.seen[USER.name]?'<span class="pill s-done">Seen</span>':'<span class="pill s-ready">New</span>'}</div>`).join('')||'<div class="empty">No ready orders yet.</div>'}</div>`,
   `<button class="btn" id="markAll">Mark all as seen</button>`);
  list.forEach(n=>{});document.getElementById('markAll').onclick=()=>{list.forEach(n=>n.seen[USER.name]=1);showPopups();bellList()};
  document.querySelectorAll('.drawer [data-r]').forEach(r=>r.onclick=()=>openOrder(+r.dataset.r))}
function showLogin(){
  const L=document.createElement('div');L.className='login';L.id='login';
  L.innerHTML=`<div class="login-in">
   <div class="login-top"><img src="/img/logo.png" alt="" class="llogo"><div><h1>Al Thob Al Saudi · Sign in</h1><p class="lead">Each person gets their own login and sees only what their job needs. Demo: pick a role to see its screens.</p></div></div>
   <div class="roles">${Object.entries(ACCESS).map(([k,a])=>{const us=USERS.map((u,i)=>({u,i})).filter(x=>x.u.role===k);return `<div class="rcard" data-role="${k}">
     <div class="rh"><span class="no">LOGIN ${a.no}</span>${ico(a.icon,1.7)}<b>${a.label}</b></div>
     <div class="rb">${us.length>1?`<div class="field"><label for="u_${k}">Who · branch</label><select id="u_${k}">${us.map(x=>`<option value="${x.i}">${bname(x.u.branch)}: ${x.u.name}</option>`).join('')}</select></div>`:`<div class="who2"><span class="avatar" style="width:24px;height:24px;font-size:11px">${us[0].u.name[0]}</span>${us[0].u.name} · All branches</div>`}
      <ul>${a.can.map(c=>`<li>${c}</li>`).join('')}</ul></div>
     <button class="btn pri go" data-go="${k}">Enter</button></div>`}).join('')}</div>
   <div class="loginform"><div class="field"><label for="lgUser">Username or mobile</label><input id="lgUser" placeholder="05xxxxxxxx"></div><div class="field"><label for="lgPass">Password</label><input id="lgPass" type="password" placeholder="••••••"></div><div class="field"><label for="lgBranch">Branch</label><select id="lgBranch">${BRANCHES.map(b=>`<option>${b.name}</option>`).join('')}</select></div><button class="btn pri" id="lgGo" style="height:40px">Sign in</button></div>
   <p class="muted" style="font-size:12.5px;margin:0">The form above is how the real login will look on saudithobe.men. In this demo it does nothing; use the role cards.</p>
  </div>`;
  document.body.appendChild(L);
  L.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>{const k=b.dataset.go,sel=document.getElementById('u_'+k);enterAs(k,sel?+sel.value:USERS.findIndex(u=>u.role===k))});
  document.getElementById('lgGo').onclick=()=>toast('Demo: choose one of the five role cards');
}
function enterAs(k,ui){
  const nu=USERS[ui!==undefined&&ui>=0?ui:USERS.findIndex(u=>u.role===k)];const ww=workers.find(w=>w.name===nu.name);
  if(ww&&(ww.status==='blocked'||ww.status==='inactive')){toast(`${nu.name}'s login is ${ww.status} by the owner`);return}
  ROLE=k;USER=nu;const a=RA();curBranch=a.branch;
  const L=document.getElementById('login');if(L)L.remove();
  document.getElementById('meAv').textContent=a.name[0];document.getElementById('meName').textContent=a.name;document.getElementById('meRole').textContent=a.label;
  document.getElementById('newBtn').hidden=!can('new');document.querySelector('.search').hidden=ROLE==='tailor';
  const sel=document.getElementById('branchSel');sel.disabled=a.lock;sel.closest('.bsel').title=a.lock?'Locked to your branch':'Branch';
  orderFilter='all';
  if(location.hash.slice(1)===a.home)route();else location.hash=a.home;
  toast(`Signed in as ${a.name} · ${a.label}`);
  showPopups();
}

function drawNav(cur){
  const open=O().filter(o=>o.st!=='done').length;
  const vis=[...RA().pages].sort((a,b)=>(a===RA().home?-1:b===RA().home?1:0)).map(h=>ROUTES.find(r=>r.h===h)).map((r,i)=>i===0&&ROLE!=='owner'?{...r,g:'My work'}:(ROLE!=='owner'&&i>0?{...r,g:''}:r));let lastG='';
  document.getElementById('nav').innerHTML=vis.map(r=>{const g=r.g&&r.g!==lastG?r.g:'';if(r.g)lastG=r.g;return {...r,g}}).map(r=>(r.g?`<div class="grp">${r.g}</div>`:'')+`<a href="#${r.h}" class="${r.h===cur?'on':''}">${ico(r.i)}${r.t}${r.h==='orders'?`<span class="cnt">${open}</span>`:r.h==='workers'?`<span class="cnt">${W().length}</span>`:r.h==='branches'?`<span class="cnt">${BRANCHES.length}</span>`:''}</a>`).join('');
  document.getElementById('tabs').style.gridTemplateColumns=`repeat(${RA().tabs.length},minmax(0,1fr))`;
  document.getElementById('tabs').innerHTML=RA().tabs.map(h=>{const r=ROUTES.find(x=>x.h===h);return `<a href="#${h}" class="${h===cur?'on':''}">${ico(r.i)}${r.s}</a>`}).join('');
  const b=BRANCHES.find(x=>x.id===curBranch);
  document.getElementById('bsw').innerHTML=`Viewing<b>${b?`${b.name} · ${b.city}`:`${SHOPS().length} shops · ${FACS().length} factory`}</b>`;
  const sel=document.getElementById('branchSel');
  sel.innerHTML=`<option value="0">All branches & factories</option><optgroup label="Shops">`+SHOPS().map(b=>`<option value="${b.id}">${b.name} · ${b.city}</option>`).join('')+`</optgroup><optgroup label="Factories">`+FACS().map(b=>`<option value="${b.id}">${b.name}</option>`).join('')+`</optgroup>`;sel.value=String(curBranch);
}

let orderFilter='all',selCust=1,selProf=0,workerRole='all';
function route(){
  if(document.getElementById('bellN'))updateBell();
  let h=(location.hash||'#'+RA().home).slice(1);if(!can(h))h=RA().home;const r=ROUTES.find(x=>x.h===h)||ROUTES[0];
  drawNav(r.h);document.getElementById('title').textContent=r.t;
  const b=BRANCHES.find(x=>x.id===curBranch);
  document.getElementById('subtitle').textContent=(b?`${b.name}${b.type==='factory'?'':' branch'} · `:'All branches · ')+today.toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
  ({dashboard,daily,orders:ordersView,new:newOrder,measurements,customers:customersView,payments,workers:workersView,branches,reports,stock:stockView,whatsapp:whatsappView,messages:messagesView,settings,till,mywork,mypay,board})[r.h]();
  if(ROLE!=='owner'){const a=RA();document.getElementById('view').insertAdjacentHTML('afterbegin',`<div class="rolebar">${ico(a.icon)}<span>Signed in as <b>${a.name}</b> · ${a.label}${a.branch?' · '+bname(a.branch):''}. ${a.lock?'Locked to this '+(isFac(a.branch)?'factory':'branch')+'.':''} ${a.money?'':'Prices and cash are hidden for this login.'}</span></div>`);document.querySelectorAll('.rolebar svg').forEach(x=>{x.style.width='18px';x.style.color='var(--brass)'})}
  window.scrollTo(0,0);
}
const V=html=>document.getElementById('view').innerHTML=html;
const demoNote=!DEMO?'':'<div class="demo"><span class="tag">Demo data</span> Everything here is sample data for review. It will be replaced by the shop\'s real database once connected.</div>';

/* ================= Dashboard ================= */
function revSeries(list,days){const r=[];for(let i=days-1;i>=0;i--){const d=addD(today,-i);r.push({d,v:list.filter(o=>+o.created===+d).reduce((s,o)=>s+o.paid,0)})}return r}
function dashboard(){
  if(LIVE&&!BRANCHES.length&&ROLE==='owner'){V(`<div class="panel"><div class="panel-b" style="display:flex;flex-direction:column;gap:12px;align-items:flex-start"><h2 style="margin:0;font-family:var(--f-display);font-weight:600;font-size:22px">Welcome, ${esc(USER.name)}</h2><p class="muted" style="margin:0">Start by adding your shop branches and the tailoring factory. Each branch gets logins for its manager, measurement and cashier.</p><a class="btn pri" href="#branches">Add branches & factory</a></div></div>`);return}
  if(dashExe)return shopDash();
  const all=O(),active=all.filter(o=>o.st!=='done'),ready=all.filter(o=>o.st==='ready');
  const due=all.reduce((s,o)=>s+(o.total-o.paid),0);
  const rev=revSeries(all,14);
  const wkv=rev.slice(7).reduce((s,x)=>s+x.v,0),pw=rev.slice(0,7).reduce((s,x)=>s+x.v,0);
  const PIPE=[...TASKS.map(t=>({k:t.k,t:t.t,n:all.filter(o=>pending(o,t.k)).reduce((s,o)=>s+o.qty,0)})),{k:'ready',t:'Ready for pickup',n:all.filter(o=>o.st==='ready').reduce((s,o)=>s+o.qty,0)}];const mx=Math.max(...PIPE.map(p=>p.n));
  const soon=active.filter(o=>o.st!=='ready').sort((a,b)=>a.due-b.due).slice(0,7);
  V(`${demoNote}
  ${RA().money?`<div class="rowtools"><span class="sp"></span>${RA().pay?`<button class="btn" id="dashPay">${ico('cash')}Pay / Deliver</button>`:''}<button class="btn pri" id="dashExeBtn">${ico('chart')}Shop dashboard (AL THOB)</button></div>`:''}
  <div class="kpis">
    <div class="kpi"><span class="l">Orders in progress</span><span class="v">${active.length}<small>orders</small></span><span class="d muted">${active.reduce((s,o)=>s+o.qty,0)} thobes in the workshop</span></div>
    <div class="kpi"><span class="l">Ready for pickup</span><span class="v">${ready.length}<small>orders</small></span><span class="d muted">Waiting for the customer</span></div>
    <div class="kpi"><span class="l">Revenue, last 7 days</span><span class="v">${sar(wkv)}<small>SAR</small></span><span class="d ${wkv>=pw?'up':'dn'}">${wkv>=pw?'▲':'▼'} ${pw?Math.abs(Math.round((wkv-pw)/pw*100)):0}% vs previous week</span></div>
    <div class="kpi"><span class="l">Balance due from customers</span><span class="v">${sar(due)}<small>SAR</small></span><span class="d muted">${all.filter(o=>o.total>o.paid).length} unpaid receipts</span></div>
  </div>
  <div class="panel">
    <div class="panel-h"><h2>Workshop right now</h2><span class="sp"></span><span class="muted" style="font-size:12.5px">Thobes waiting or in progress at each step · tap to open the board</span></div>
    <div class="pipe">${PIPE.map(p=>`<div class="stage" data-st="${p.k}"><div class="n">${p.n}</div><div class="t">${p.t}</div><div class="bar"><i style="width:${mx?p.n/mx*100:0}%"></i></div></div>`).join('')}</div>
  </div>
  <div class="grid2">
    <div class="panel">
      <div class="panel-h"><h2>Upcoming deliveries</h2><span class="sp"></span><a class="btn sm" href="#orders">All orders</a></div>
      <div class="rows">${soon.map(o=>{const d=daysLeft(o);return `<div class="row" data-r="${o.rno}" style="cursor:pointer">
        <span class="rid">${ono(o)}</span><div class="grow"><b>${cust(o.cid).name}</b><span>${pl(o.qty,'thobe')} · ${wk(o.tailor).name} ${curBranch?'':'· '+bname(o.branch)}</span></div>${pill(o)}
        <span class="days ${d<0?'late':d===0?'today':''}">${d<0?`${-d}d late`:d===0?'Today':`in ${d}d`}</span></div>`}).join('')||'<div class="empty">Nothing due.</div>'}</div>
    </div>
    <div class="panel">
      <div class="panel-h"><h2>Daily revenue</h2><span class="sp"></span><span class="muted" style="font-size:12px">Last 14 days · SAR</span></div>
      <div class="panel-b">${lineChart(rev)}</div>
    </div>
  </div>`);
  const dpy=document.getElementById('dashPay');if(dpy)dpy.onclick=()=>receivePayment(0);
  const dxb=document.getElementById('dashExeBtn');if(dxb)dxb.onclick=()=>{dashExe=true;shopDash();window.scrollTo(0,0)};
  document.querySelectorAll('.stage').forEach(e=>e.onclick=()=>{if(e.dataset.st==='ready'){orderFilter='ready';location.hash='orders'}else location.hash='board'});
  bindRows();
}
function lineChart(data){
  const Wd=420,H=200,pl_=44,pr=10,pt=12,pb=26;const mx=Math.max(...data.map(x=>x.v))||1;const top=Math.ceil(mx/1000)*1000;
  const x=i=>pl_+(i/(data.length-1))*(Wd-pl_-pr);const y=v=>pt+(1-v/top)*(H-pt-pb);
  const pts=data.map((d,i)=>[x(i),y(d.v)]);const ticks=[0,top/2,top];
  return `<svg class="chart" viewBox="0 0 ${Wd} ${H}" style="width:100%;height:auto;display:block">
  ${ticks.map(t=>`<line class="gl" x1="${pl_}" x2="${Wd-pr}" y1="${y(t)}" y2="${y(t)}"/><text x="${pl_-6}" y="${y(t)+4}" text-anchor="end">${sar(t)}</text>`).join('')}
  <path class="ar" d="M${pts.map(p=>p.join(',')).join('L')}L${x(data.length-1)},${y(0)}L${x(0)},${y(0)}Z"/>
  <path class="ln" d="M${pts.map(p=>p.join(',')).join('L')}"/>
  <circle class="dot" cx="${pts.at(-1)[0]}" cy="${pts.at(-1)[1]}" r="4"/>
  ${[0,7,13].map(i=>`<text x="${x(i)}" y="${H-6}" text-anchor="${i===0?'start':i===13?'end':'middle'}">${fmtD(data[i].d)}</text>`).join('')}
  </svg>`;
}

/* ================= Orders ================= */
/* Orders: the same columns and filters as the AL THOB exe's Orders page (+ tailor, fabric, made at, branch at the end) */
const OFILTERS=[['all','All orders'],['open','Not delivered'],['due','With due'],['ready','Ready'],['done','Delivered'],['late','Late'],['tdue','Taken with due'],['gift','Free gifts']];
function oInfo(o){
  const pcs=+o.qty||0,dq=o.st==='done'?pcs:Math.min(pcs,delLog.filter(d=>d.rno===o.rno).reduce((s,d)=>s+(+d.qty||0),0));
  const ps=k=>prodLog.filter(p=>p.rno===o.rno&&p.stage===k).reduce((s,p)=>s+(+p.qty||0),0);
  const cut=Math.min(pcs,Math.max(ps('cut'),o.t.cut==='done'?pcs:0)),sew=Math.min(pcs,Math.max(ps('sew'),o.t.sew==='done'?pcs:0));
  const hq=+o.hingeQty||(o.hinge?pcs:0),hd=Math.min(hq,Math.max(ps('hinge'),o.t.hinge==='done'?hq:0));
  const due=Math.round((o.total-o.paid)*100)/100;
  const status=dq>=pcs&&pcs>0?'Delivered':dq>0?'Partly delivered':o.st==='ready'?'Ready':o.due<today?'Late':sew>=pcs&&pcs>0?'Stitched':sew>0||cut>0||o.t.cut!=='wait'?'In progress':'Pending';
  return{dq,cut,sew,hq,hd,due,status,where:oWhere(o,pcs,dq,cut,sew)};
}
/* where the order is now, in short (Orders → Status) */
const SHORT={hinge:'hinge',tat:'tatreez',btm:'bottom cut',iron:'ironing'};
function oWhere(o,pcs,dq,cut,sew){
  if(dq>=pcs&&pcs>0)return 'Delivered';if(dq>0)return `Delivered ${dq}/${pcs}`;if(o.st==='ready')return 'Ready';
  const T=k=>tv(o,k);
  if(T('sew')==='done'||(sew>=pcs&&pcs>0)){const ts=TASKS.filter(t=>t.k!=='cut'&&t.k!=='sew'&&needs(o,t.k));
    const at=ts.filter(t=>T(t.k)==='doing');if(at.length)return 'At '+at.map(t=>SHORT[t.k]||t.t).join(' + ');
    const sent=ts.filter(t=>T(t.k)==='wait'&&isSent(o,t.k));if(sent.length)return 'Sent '+sent.map(t=>SHORT[t.k]||t.t).join(' + ');
    if(ts.every(t=>T(t.k)==='done'))return ts.length?'Back to tailor':'Stitched';
    const done=ts.filter(t=>T(t.k)==='done');return done.length?done.map(t=>(SHORT[t.k]||t.t)).join(' + ')+' done':'Stitched'}
  if(T('sew')==='doing'||sew>0)return sew>0&&sew<pcs?`Stitching ${sew}/${pcs}`:'Stitching';
  if(T('cut')==='done'||(cut>=pcs&&pcs>0))return 'Cut done';
  if(T('cut')==='doing'||cut>0)return cut>0&&cut<pcs?`Cutting ${cut}/${pcs}`:'Cutting';
  return 'Not cut'}
const WHERE_C=w=>/^Delivered \d/.test(w)?'s-info':w==='Delivered'?'s-done':w==='Ready'||w==='Back to tailor'?'s-ready':w==='Not cut'?'s-wait':w==='Stitched'||/done$/.test(w)?'s-info':'s-cut';
const OSTAT_C={Delivered:'s-done','Partly delivered':'s-info',Ready:'s-ready',Late:'s-late',Stitched:'s-ready','In progress':'s-cut',Pending:'s-wait'};
let oSort={k:'rno',d:-1};
function ordersView(){
  const q=document.getElementById('q').value.trim().toLowerCase();const money=RA().money;
  const all=O();const info=new Map(all.map(o=>[o.rno,oInfo(o)]));
  const pass=(o,f)=>{const x=info.get(o.rno);return f==='all'?true:f==='open'?x.dq<o.qty:f==='due'?x.due>0.5:f==='ready'?o.st==='ready'&&x.dq<o.qty:f==='done'?x.status==='Delivered':f==='late'?x.dq<o.qty&&o.due<today:f==='tdue'?x.dq>0&&x.due>0.5:f==='gift'?!!o.gift:true};
  const hit=o=>{if(!q)return true;const c=cust(o.cid);return ordMatch(o,q)||(o.bno||'').toLowerCase().includes(q)&&q.length>=4||String(o.cid)===q||c.name.toLowerCase().includes(q)||String(c.phone).includes(q)};
  if(!OFILTERS.some(f=>f[0]===orderFilter))orderFilter='all';
  const val=(o,k)=>{const x=info.get(o.rno),c=cust(o.cid);return k==='rno'?o.rno:k==='inv'?(+o.binvSeq||+o.invoiceNo||0):k==='cust'?c.name.toLowerCase():k==='booked'?+o.created:k==='due'?+o.due:k==='pcs'?o.qty:k==='total'?o.total:k==='paid'?o.paid:k==='bal'?x.due:k==='status'?x.status:o.rno};
  const fl=all.filter(o=>pass(o,orderFilter)&&hit(o)).sort((a,b)=>{const A=val(a,oSort.k),B=val(b,oSort.k);return (A<B?-1:A>B?1:0)*oSort.d||b.rno-a.rno});
  const sum=f=>fl.reduce((s,o)=>s+f(o),0);
  const T={n:fl.length,pcs:sum(o=>o.qty),tot:sum(o=>o.total),paid:sum(o=>o.paid),due:sum(o=>Math.max(0,info.get(o.rno).due)),late:fl.filter(o=>info.get(o.rno).status==='Late').length,ready:fl.filter(o=>o.st==='ready').length};
  const D=d=>d.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'2-digit'});
  const th=(k,t,cls='')=>`<th class="${cls}${k?' sortable':''}" ${k?`data-sort="${k}" aria-sort="${oSort.k===k?(oSort.d>0?'ascending':'descending'):'none'}"`:''}>${t}${k&&oSort.k===k?`<span class="sarr">${oSort.d>0?'▲':'▼'}</span>`:''}</th>`;
  const bar=(a,b)=>`<div class="mbar" title="${a} of ${b}"><span class="num">${a}<em>/${b}</em></span><i><b style="width:${b?Math.min(100,a/b*100):0}%;${a>=b&&b?'background:var(--ok)':''}"></b></i></div>`;
  V(`<div class="okpi">
     <div><span>Orders</span><b class="num">${T.n}</b><em>${pl(T.pcs,'piece')}</em></div>
     ${money?`<div><span>Order value</span><b class="num">${sar(T.tot)}<small>SAR</small></b><em>Paid ${sar(T.paid)}</em></div>
     <div class="bad"><span>Due from customers</span><b class="num">${sar(T.due)}<small>SAR</small></b><em>${fl.filter(o=>info.get(o.rno).due>0.5).length} orders with balance</em></div>`:''}
     <div class="${T.late?'bad':''}"><span>Late</span><b class="num">${T.late}</b><em>Past delivery date</em></div>
     <div class="okc"><span>Ready for pickup</span><b class="num">${T.ready}</b><em>Waiting for the customer</em></div></div>
   <div class="panel opanel">
    <div class="otools">
     <div class="seg" role="tablist">${OFILTERS.map(([k,t])=>`<button role="tab" aria-selected="${k===orderFilter}" class="${k===orderFilter?'on':''}" data-of="${k}">${t}<span class="num">${all.filter(o=>pass(o,k)).length}</span></button>`).join('')}</div>
     <span class="sp"></span>
     ${pgSearch('Order, invoice, name, mobile')}<button class="btn sm" id="oCsv" title="Download as CSV (Excel)">${ico('orders')}CSV</button><button class="btn sm" id="oPrint" title="Print this list">${ico('cal')}Print</button>
    </div>
    <div class="tbl-wrap otbl"><table class="ot">
     <thead><tr>${th('rno','Order / Invoice','stk s1')}${th('cust','Customer','stk s2')}<th>Mobile</th>${th('booked','Booked')}${th('due','Delivery')}${th('pcs','Pcs','r')}
      ${money?th('total','Total','r')+th('paid','Paid','r')+th('bal','Due','r'):''}${th('status','Status')}<th>Cut</th><th>Stitched</th><th>Hinge</th><th>Ready</th><th class="r">Delivered</th>${money?'<th>Method</th>':''}<th>Tailor</th><th>Fabric</th><th>Made at</th><th>Branch</th></tr></thead>
     <tbody>${fl.map(o=>{const c=cust(o.cid),x=info.get(o.rno),lateD=x.dq<o.qty&&o.due<today;return `<tr class="click" data-r="${o.rno}" tabindex="0">
      <td class="stk s1"><span class="rid">${ono(o)}</span><small class="sub">${o.gift?'Free gift':oinv(o)?'Inv '+oinv(o):'Inv —'}${o.exeNo&&o.exeNo!==o.rno?' · shop '+o.exeNo:''}</small></td>
      <td class="stk s2"><b dir="auto" class="cn">${esc(c.name)}</b></td>
      <td class="num">${esc(c.phone)}</td>
      <td class="num">${D(o.created)}</td><td class="num ${lateD?'tbad':''}">${D(o.due)}</td><td class="r num">${o.qty}</td>
      ${money?`<td class="r num">${sar(o.total)}</td><td class="r num">${sar(o.paid)}</td><td class="r num ${x.due>0.5?'tbad':'tok'}">${x.due>0.5?sar(x.due):'—'}</td>`:''}
      <td><span class="pill ${WHERE_C(x.where)}" title="${esc(x.status)}">${esc(x.where)}</span>${x.status==='Late'?' <span class="pill s-late">Late</span>':''}${x.dq>0&&x.due>0.5?' <span class="pill s-late" title="Thobe taken, money still due">Taken · due</span>':''}</td>
      <td>${bar(x.cut,o.qty)}</td><td>${bar(x.sew,o.qty)}</td><td>${x.hq?bar(x.hd,x.hq):'<span class="muted">—</span>'}</td>
      <td>${o.st==='ready'||o.st==='done'?'<span class="tick">✓</span>':''}</td><td class="r num">${x.dq?x.dq:'<span class="muted">0</span>'}</td>
      ${money?`<td>${o.pm?esc(o.pm):'<span class="muted">—</span>'}</td>`:''}<td>${o.tailor&&wk(o.tailor).id?esc(wk(o.tailor).name):'<span class="muted">—</span>'}</td>
      <td dir="auto" class="fab" title="${esc(o.fabric||'')}">${esc(o.fabric||'')}</td><td>${isFac(o.made)?bTag(o.made)+' Factory':'Shop'}</td><td>${bTag(o.branch)} ${bname(o.branch)}</td></tr>`}).join('')}</tbody>
     ${fl.length?`<tfoot><tr><td class="stk s1">Total</td><td class="stk s2">${pl(T.n,'order')}</td><td></td><td></td><td></td><td class="r num">${T.pcs}</td>${money?`<td class="r num">${sar(T.tot)}</td><td class="r num">${sar(T.paid)}</td><td class="r num tbad">${sar(T.due)}</td>`:''}<td colspan="${money?11:10}"></td></tr></tfoot>`:''}
    </table>${fl.length?'':`<div class="empty">No orders match${q?` “${esc(q)}”`:''} in <b>${OFILTERS.find(f=>f[0]===orderFilter)[1]}</b>.</div>`}</div></div>`);
  document.querySelectorAll('[data-of]').forEach(b=>b.onclick=()=>{orderFilter=b.dataset.of;ordersView()});
  document.querySelectorAll('th[data-sort]').forEach(h=>h.onclick=()=>{const k=h.dataset.sort;oSort=oSort.k===k?{k,d:-oSort.d}:{k,d:k==='cust'||k==='status'?1:-1};ordersView()});
  document.querySelectorAll('tr[data-r]').forEach(r=>r.onkeydown=e=>{if(e.key==='Enter')openOrder(+r.dataset.r)});
  const rowsCsv=()=>{const H=['Order No','Invoice','Customer','Mobile','Booked','Delivery','Pcs',...(money?['Total','Paid','Due']:[]),'Status','Cut','Stitched','Hinge','Ready','Delivered',...(money?['Method']:[]),'Tailor','Fabric','Made at','Branch'];
    const R=fl.map(o=>{const c=cust(o.cid),x=info.get(o.rno);return [ono(o).replace(/^#/,''),o.gift?'Gift':oinv(o),c.name,c.phone,dkey2(o.created),dkey2(o.due),o.qty,...(money?[o.total,o.paid,x.due]:[]),x.status,x.cut,x.sew,x.hq?`${x.hd}/${x.hq}`:'',o.st==='ready'||o.st==='done'?'Yes':'',x.dq,...(money?[o.pm||'']:[]),o.tailor?wk(o.tailor).name:'',o.fabric||'',isFac(o.made)?bname(o.made):'Shop',bname(o.branch)]});
    return [H,...R]};
  document.getElementById('oCsv').onclick=()=>{const csv='﻿'+rowsCsv().map(r=>r.map(v=>`"${String(v??'').replace(/"/g,'""')}"`).join(',')).join('\r\n');
    const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));a.download=`orders_${dkey2(today)}.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),2000)};
  document.getElementById('oPrint').onclick=()=>{const rs=rowsCsv();const w=window.open('','_blank');if(!w){toast('Allow pop-ups to print');return}
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Orders ${dkey2(today)}</title><style>body{font:11px Arial,sans-serif;margin:16px}h1{font-size:16px;margin:0 0 4px}p{margin:0 0 10px;color:#555}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ccc;padding:3px 5px;text-align:left;white-space:nowrap}th{background:#eee}@page{size:A4 landscape;margin:10mm}</style></head><body><h1>Orders · ${esc(OFILTERS.find(f=>f[0]===orderFilter)[1])}</h1><p>${esc(curBranch?bname(curBranch):'All branches')} · ${today.toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'})} · ${pl(T.n,'order')}${money?` · total ${sar(T.tot)} SAR · due ${sar(T.due)} SAR`:''}</p><table><thead><tr>${rs[0].map(h=>`<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rs.slice(1).map(r=>`<tr>${r.map(v=>`<td dir="auto">${esc(v??'')}</td>`).join('')}</tr>`).join('')}</tbody></table></body></html>`);
    w.document.close();setTimeout(()=>w.print(),300)};
  bindRows();bindPgSearch();
}
function bindRows(){document.querySelectorAll('[data-r]').forEach(r=>r.onclick=()=>openOrder(+r.dataset.r))}
function waText(o){const c=cust(o.cid);const rem=o.total-o.paid;const first=c.name.split(' ')[0];
  return o.st==='ready'?`Assalamu alaikum ${first},\nYour thobes are ready for pickup at Saudi Thobe, ${bname(o.branch)} branch.\nReceipt no.: ${o.rno}\nBalance due: ${sar(rem)} SAR\nWe look forward to seeing you.`
  :`Assalamu alaikum ${first},\nWe have received your order no. ${o.rno} (${pl(o.qty,'thobe')}) at our ${bname(o.branch)} branch.\nExpected pickup: ${fmtD(o.due)}\nPaid: ${sar(o.paid)} SAR · Balance: ${sar(rem)} SAR`;}
function openOrder(rno){
  {const x=orders.find(y=>y.rno===rno);if(x&&typeof ensurePayRange==='function'&&x.created<addD(today,-40))ensurePayRange(x.created)}
  const o=orders.find(x=>x.rno===rno);if(!o)return;const c=cust(o.cid),i=SI[o.st],rem=o.total-o.paid,prof=c.profiles[o.profile]||c.profiles[0];
  drawer(c.name,`<div class="rid" style="font-size:13px">Receipt ${ono(o)}${o.exeNo&&o.exeNo!==o.rno?` · shop no. ${o.exeNo}`:''} · ${bname(o.branch)} branch${o.exe?' · from shop exe':''}</div>`,
   `<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">${pill(o)}<span class="muted num">${c.phone}</span></div>
    <div class="steps">${STAGES.map((s,j)=>`<div class="step ${j<i?'done':j===i?'cur':''}">${s.t}</div>`).join('')}</div>
    <div class="kv"><div><span>Thobes</span><b>${o.qty}</b></div><div><span>Ordered</span><b>${fmtD(o.created)}</b></div><div><span>Pickup</span><b>${fmtD(o.due)}</b></div>
     <div><span>Stitched at</span><b style="font-family:var(--f-body);font-size:13px">${o.made===o.branch?'Shop workshop':bname(o.made)}</b></div>
     ${RA().money?`<div><span>Total</span><b>${sar(o.total)}</b></div><div><span>Paid</span><b style="color:var(--ok)">${sar(o.paid)}</b></div><div><span>Balance</span><b style="color:${rem?'var(--bad)':'var(--ok)'}">${sar(rem)}</b></div>`:''}</div>
    ${RA().money?payHist(o):''}
    <div><p class="h4">Workshop · ${o.made===o.branch?bname(o.made)+' workshop':bname(o.made)}</p><div class="rows" style="border:1px solid var(--line);border-radius:8px">${TASKS.map(t=>{const wid=t.k==='sew'?o.tailor:o.tw[t.k];return `<div class="row" style="padding-block:8px"><div class="grow"><b>${t.t}</b><span>${wid?wk(wid).name:'Not assigned yet'}</span></div>${taskPill(o,t.k)}${canTask()&&pending(o,t.k)?`<button class="btn sm" data-tk="${t.k}">${taskBtn(o,t.k)}</button>`:''}</div>`}).join('')}</div></div>
    <div><p class="h4">Tailor</p><div class="row" style="padding:0;border:0"><div class="wav" style="width:36px;height:36px;font-size:14px">${initials(wk(o.tailor).name)}</div><div class="grow"><b>${wk(o.tailor).name}</b><span>${wk(o.tailor).role} · ${bname(wk(o.tailor).branch)}</span></div></div></div>
    ${orderItems(o)}
    ${jHas(o.meas)||jHas(prof.m)?`<div><p class="h4">Measurement sheet & style</p>${jStylesHtml(jHas(o.meas)?o.meas:prof.m)}<button class="btn sm" id="jOpen" style="margin-top:8px">📐 Open the measurement sheet</button></div>`:`<div><p class="h4">Style</p><div class="kv">${DESIGN_.map(g=>`<div><span>${g.t}</span><b style="font-family:var(--f-body);font-size:13px">${g.opts.find(x=>x[0]===o.design[g.k])[1]}</b></div>`).join('')}<div><span>Fabric</span><b style="font-family:var(--f-body);font-size:13px">${o.fabric}</b></div></div></div>`}
    ${MALL.some(([k])=>mVal(prof.m,k)!=='')?`<div><p class="h4">Old shop paper values</p>${mShow(prof.m)}</div>`:''}
    ${o.note?`<div><p class="h4">Note</p><div class="msg" style="border-color:var(--brass)">${esc(o.note)}</div></div>`:''}
    ${RA().money?`<div><p class="h4">WhatsApp message</p><div class="msg" id="wamsg">${esc(waText(o))}</div></div>`:''}`,
   `${o.st==='ready'&&RA().pay&&!rem?`<button class="btn pri" id="handBtn">Hand over to customer</button>`:''}${rem&&RA().pay?`<button class="btn" id="payBtn">${ico("cash")}Payment / Delivery · ${sar(rem)} SAR</button>`:''}${RA().money?`<button class="btn" id="waBtn">${ico('wa')}Copy message</button>`:''}${RA().money&&(!o.gift||outFab(o).length)?`<button class="btn" id="prtBtn">🖨 Invoice</button>`:''}`);
  const prt=document.getElementById('prtBtn');if(prt)prt.onclick=()=>printOrder(o);
  document.querySelectorAll('[data-tk]').forEach(b=>b.onclick=()=>{stepTask(o,b.dataset.tk);route();openOrder(rno)});
  const jo=document.getElementById('jOpen');if(jo)jo.onclick=()=>jSheetWindow(`Order ${ono(o)} · ${c.name}`,jHas(o.meas)?o.meas:prof.m,{ro:true});
  // hand over / record: the same Payment / Delivery window as the cashier desk (amount, method, reference, pieces)
  const hb=document.getElementById('handBtn');if(hb)hb.onclick=()=>receivePayment(o.rno,true);
  const pay=document.getElementById('payBtn');if(pay)pay.onclick=()=>receivePayment(o.rno,o.st==='ready');
  const wb=document.getElementById('waBtn');if(wb)wb.onclick=()=>copyEl('wamsg',waText(o));
}
function copyEl(id,t){navigator.clipboard.writeText(t).then(()=>toast('Copied'),()=>{const r=document.createRange();r.selectNodeContents(document.getElementById(id));getSelection().removeAllRanges();getSelection().addRange(r);toast('Text selected, copy it now')})}

/* ================= New order ================= */
let draft;
/* New order: the AL THOB exe's order window – customer no. / name / mobile / address, booking + delivery date, order and
   invoice no., free gift, sample, notes, hinge / zip pcs; the items (shop stock or customer's fabric) and embroidery grids;
   subtotal, discount, VAT, total, down payment, method, reference, balance; Save & Print · Save only · Measurements… · Cancel */
function newOrder(){
  draft={design:Object.fromEntries(DESIGN_.map(g=>[g.k,g.opts[0][0]])),lines:[],emb:[],meas:{},sel:-1,esel:-1};
  const due0=addD(today,10);const nextR=Math.max(DEMO?1000:50000,...orders.filter(o=>DEMO||!o.exe||o.rno>=50000).map(o=>o.rno))+1;
  const br=curBranch&&!isFac(curBranch)?curBranch:(USER.branch&&!isFac(USER.branch)?USER.branch:(SHOPS()[0]||{id:1}).id);
  const money=RA().money;
  const F=(lab,ctl,span)=>`<label class="ol">${lab}</label><div class="oc"${span?` style="grid-column:span ${span}"`:''}>${ctl}</div>`;
  V(`<div class="oform">
   <div class="panel"><div class="ogrid">
    ${F('Customer No',`<div class="orow"><input id="fCno" class="num" inputmode="numeric" placeholder="(empty = new customer)"><button class="btn sm" id="fFind">Find…</button></div>`)}
    ${F('Name *','<input id="fName" dir="auto" autocomplete="off">')}
    ${F('Mobile','<input id="fPhone" class="num" inputmode="tel">')}
    ${F('Address','<input id="fAddr" dir="auto">')}
    ${F('Booking date',`<input id="fBook" type="date" value="${dkey2(today)}">`)}
    ${F('Delivery date',`<input id="fDue" type="date" value="${dkey2(due0)}">`)}
    ${F('Order No',`<input id="fOno" class="num" readonly value="(new)">`)}
    ${F('Invoice No',`<div class="orow"><input id="fInv" class="num" readonly value="(new)"><label class="ock gift"><input type="checkbox" id="fGift"> Free gift / هدية</label></div>`)}
    ${F('',`<label class="ock"><input type="checkbox" id="fSample"> Customer left a sample thobe</label>`)}
    ${F('Notes','<input id="fNote" dir="auto">',5)}
    ${F('Hinge button pcs / عدد Hinge button','<input id="fHingeQ" type="number" min="0" value="0" class="num" style="max-width:110px">')}
    ${F('Zip pcs / عدد السحاب','<input id="fZipQ" type="number" min="0" value="0" class="num" style="max-width:110px">')}
    ${F('Branch',`<select id="fBranch">${SHOPS().map(b=>`<option value="${b.id}" ${b.id===br?'selected':''}>${esc(b.name)}</option>`).join('')}</select>`)}
    ${F('Stitch at','<select id="fMade"></select>')}
    ${F('Tailor','<select id="fTailor"></select>')}
   </div></div>
   <div class="panel"><div class="obar"><b>Items</b><button class="btn sm pri" id="addIn">Add item from stock (F3)</button><button class="btn sm" id="addOut">Add customer-fabric line</button><button class="btn sm" id="rmLine">Remove line</button>
     <span class="muted">IN = shop fabric (reduces stock) · OUT = customer's own fabric (tailoring only)</span></div>
    <div class="tbl-wrap"><table class="ogridt"><thead><tr><th style="width:34px">#</th><th style="width:70px">Source</th><th style="width:80px">Code</th><th>Item</th><th style="width:120px">Company</th><th style="width:80px">Qty</th><th class="mny" style="width:100px">Rate</th><th class="mny" style="width:110px">Amount</th></tr></thead><tbody id="lnBody"></tbody></table></div></div>
   <div class="panel"><div class="obar"><b>Embroidery / التطريز</b><button class="btn sm pri" id="addEmb">Choose embroidery…</button><button class="btn sm" id="rmEmb">Remove embroidery</button>
     <span class="muted">choose the design → model and price come in; choose the fabric it goes on</span></div>
    <div class="tbl-wrap"><table class="ogridt"><thead><tr><th style="width:80px">Code</th><th>Model</th><th>Fabric</th><th style="width:80px">Qty</th><th class="mny" style="width:100px">Rate</th><th class="mny" style="width:110px">Amount</th></tr></thead><tbody id="embBody"></tbody></table></div></div>
   <div class="panel obottom" id="payPanel"><div class="otot">
     <label>Subtotal</label><input id="tGross" class="num" readonly>
     <label>Down payment</label><input id="fPaid" class="num" type="number" min="0" value="0">
     <label>Discount</label><input id="fDisc" class="num" type="number" min="0" value="0">
     <label>Payment method</label><select id="fMethod"><option value=""></option>${PMETHODS.map(m=>`<option>${m}</option>`).join('')}</select>
     <label>VAT 15%</label><input id="tVat" class="num" readonly>
     <label>Reference / SPAN</label><input id="fRef">
     <label class="big">TOTAL</label><input id="tTot" class="num big" readonly>
     <label></label><div id="tRem" class="obal"></div>
   </div></div>
   <div class="obtns"><button class="btn pri" id="saveP">Save &amp; Print  (Ctrl+S)</button><button class="btn" id="saveO">Save only</button>
    <button class="btn" id="measB">📐 Measurements…</button><span class="muted" id="measN"></span><span class="sp"></span><a class="btn" href="#orders">Cancel</a></div>
  </div>`);
  const $=id=>document.getElementById(id);
  let cid=0;
  const lineName=(l,i)=>`${i+1}) ${l.src==='OUT'?'قماش العميل: '+l.item:l.item+(l.code?` (${l.code})`:'')}`;
  const fabNames=()=>{const a=[];draft.lines.forEach(l=>{const n=l.src==='OUT'?'قماش العميل':String(l.code||l.item||'');if(n&&!a.includes(n))a.push(n)});return a};
  const measInfo=()=>{const n=jCount(draft.meas);$('measN').textContent=n?`${n} values on the sheet`:'no measurement yet';$('measB').classList.toggle('pri',!n)};
  const inp=(i,f,v,attrs='')=>`<input data-li="${i}" data-f="${f}" value="${esc(v)}" ${attrs}>`;
  const drawLines=()=>{
    $('lnBody').innerHTML=draft.lines.map((l,i)=>`<tr class="${i===draft.sel?'on':''}" data-row="${i}"><td class="num">${i+1}</td><td><span class="tag">${l.src}</span></td><td class="num">${l.code||''}</td>
      <td>${l.src==='OUT'?inp(i,'item',l.item,'dir="auto"'):`<span dir="auto">${esc(l.item)}</span>`}</td><td>${esc(l.company||'')}</td>
      <td>${inp(i,'qty',l.qty,'type="number" min="0" step="any" class="num"')}</td><td class="mny">${inp(i,'rate',l.rate,'type="number" min="0" step="any" class="num"')}</td><td class="num mny" id="la${i}">${sar2(l.qty*l.rate)}</td></tr>`).join('')
      ||`<tr><td colspan="8"><div class="empty" style="padding:14px">Add the fabric: <b>Add item from stock</b> or <b>Add customer-fabric line</b>.</div></td></tr>`;
    $('embBody').innerHTML=draft.emb.map((e,i)=>`<tr class="${i===draft.esel?'on':''}" data-erow="${i}"><td class="num">${e.code}</td><td dir="auto">${esc(e.item)}</td>
      <td><select data-ei="${i}" data-f="fab"><option value="-1">—</option>${draft.lines.map((l,k)=>`<option value="${k}" ${k===e.fab?'selected':''}>${esc(lineName(l,k))}</option>`).join('')}</select></td>
      <td><input data-ei="${i}" data-f="qty" type="number" min="0" class="num" value="${e.qty}"></td><td class="mny"><input data-ei="${i}" data-f="rate" type="number" min="0" class="num" value="${e.rate}"></td><td class="num mny" id="ea${i}">${sar2(e.qty*e.rate)}</td></tr>`).join('')
      ||'<tr><td colspan="6"><div class="empty" style="padding:12px">No embroidery.</div></td></tr>';
    document.querySelectorAll('[data-li]').forEach(el=>el.oninput=()=>{const l=draft.lines[+el.dataset.li];l[el.dataset.f]=el.dataset.f==='item'?el.value:Math.max(0,+el.value||0);const a=$('la'+el.dataset.li);if(a)a.textContent=sar2(l.qty*l.rate);totals()});
    document.querySelectorAll('[data-ei]').forEach(el=>el.oninput=el.onchange=()=>{const e=draft.emb[+el.dataset.ei];e[el.dataset.f]=el.dataset.f==='fab'?+el.value:Math.max(0,+el.value||0);const a=$('ea'+el.dataset.ei);if(a)a.textContent=sar2(e.qty*e.rate);totals()});
    document.querySelectorAll('[data-row]').forEach(r=>r.onclick=e=>{if(e.target.closest('input'))return;draft.sel=+r.dataset.row;drawLines()});
    document.querySelectorAll('[data-erow]').forEach(r=>r.onclick=e=>{if(e.target.closest('input,select'))return;draft.esel=+r.dataset.erow;drawLines()});
    document.querySelectorAll('.ogridt .mny').forEach(x=>x.hidden=!money);
    totals();
  };
  const sums=()=>{const pcs=draft.lines.reduce((s,l)=>s+(+l.qty||0),0);const gross=Math.round((draft.lines.reduce((s,l)=>s+l.qty*l.rate,0)+draft.emb.reduce((s,e)=>s+e.qty*e.rate,0))*100)/100;
    const disc=Math.min(gross,Math.max(0,+$('fDisc').value||0)),total=Math.round((gross-disc)*100)/100,paid=money?Math.max(0,+$('fPaid').value||0):0;return{pcs,gross,disc,total,vat:vatOf(total),paid}};
  const totals=()=>{const m=sums();$('tGross').value=sar2(m.gross);$('tVat').value=sar2(m.vat);$('tTot').value=sar2(m.total);
    const rem=Math.round((m.total-m.paid)*100)/100;$('tRem').innerHTML=`Balance <b class="num">${sar2(rem)}</b> SAR`;$('tRem').classList.toggle('due',rem>0.005)};
  const fillMade=()=>{const b=+$('fBranch').value;const keep=$('fMade').value;$('fMade').innerHTML=`<option value="${b}">${bname(b)} workshop</option>`+FACS().map(f=>`<option value="${f.id}">${f.name}</option>`).join('');$('fMade').value=keep&&[...$('fMade').options].some(x=>x.value===keep)?keep:String((FACS()[0]||{id:b}).id)};
  const fillTailors=()=>{$('fTailor').innerHTML='<option value="0">—</option>'+tailorsOf(+$('fMade').value).map(w=>`<option value="${w.id}">${w.name}${w.status==='leave'?' (on leave)':''}</option>`).join('')};
  const setCust=c=>{cid=c?c.id:0;$('fCno').value=c?c.id:'';$('fName').value=c?c.name:'';$('fPhone').value=c?c.phone:'';$('fAddr').value=c?(c.addr||''):'';
    if(c&&SHOPS().some(b=>b.id===c.branch)){$('fBranch').value=c.branch;fillMade();fillTailors()}
    const last=c&&c.profiles[0]&&jHas(c.profiles[0].m)?c.profiles[0].m:null;if(last&&!jCount(draft.meas))draft.meas=JSON.parse(JSON.stringify(last));measInfo()};
  $('fCno').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();const c=customers.find(x=>String(x.id)===$('fCno').value.trim());if(c)setCust(c);else toast('Customer '+$('fCno').value+' not found')}};
  $('fCno').onchange=()=>{const v=$('fCno').value.trim();if(!v){cid=0;return}const c=customers.find(x=>String(x.id)===v);if(c)setCust(c)};
  $('fFind').onclick=()=>pickCustomer(setCust);
  const fillNo=()=>{const b=+$('fBranch').value;$('fOno').value='(new) '+branchNos(b,$('fGift').checked).bno;if(!$('fGift').checked){const n=branchNos(b,false);$('fInv').value=n.binv?'(new) '+n.binv:'(from the shop exe)'}};
  $('fBranch').onchange=()=>{fillMade();fillTailors();fillNo()};setTimeout(fillNo,0);$('fMade').onchange=fillTailors;
  ['fDisc','fPaid'].forEach(id=>$(id).oninput=totals);
  $('fGift').onchange=()=>{if($('fGift').checked)$('fInv').value='(free gift – no invoice)';else{const n=branchNos(+$('fBranch').value,false);$('fInv').value=n.binv?'(new) '+n.binv:'(from the shop exe)'}};
  $('addIn').onclick=()=>pickStock(it=>{draft.lines.push({src:'IN',code:it.code,item:it.name,company:it.company||'',qty:1,rate:it.rate});draft.sel=draft.lines.length-1;drawLines()});
  $('addOut').onclick=()=>{draft.lines.push({src:'OUT',code:0,item:OUT_ITEM,company:'',qty:1,rate:OUT_RATE});draft.sel=draft.lines.length-1;drawLines()};
  $('rmLine').onclick=()=>{if(draft.sel<0||!draft.lines[draft.sel]){toast('Click a line first');return}draft.lines.splice(draft.sel,1);draft.emb.forEach(e=>{if(e.fab===draft.sel)e.fab=-1;else if(e.fab>draft.sel)e.fab--});draft.sel=-1;drawLines()};
  $('addEmb').onclick=()=>{if(!EMBL.length){toast('The embroidery list is empty (shop exe → Embroidery)');return}pickEmb(x=>{draft.emb.push({code:x.code,item:'تطريز: '+x.model,fab:draft.lines.length?0:-1,qty:1,rate:x.price});draft.esel=draft.emb.length-1;drawLines()})};
  $('rmEmb').onclick=()=>{if(draft.esel<0||!draft.emb[draft.esel]){toast('Click an embroidery line first');return}draft.emb.splice(draft.esel,1);draft.esel=-1;drawLines()};
  $('measB').onclick=()=>{const c=cid?cust(cid):null;const last=c&&c.profiles[0]&&jHas(c.profiles[0].m)?c.profiles[0].m:null;
    jSheetWindow(`Measurements · ${$('fName').value||'new customer'}`,draft.meas,{fabrics:fabNames,last,onDone:m=>{draft.meas=m;measInfo()}})};
  const save=print=>{
    const name=$('fName').value.trim();if(!name){toast('Customer name is required.');$('fName').focus();return}
    const bk=$('fBook').value||dkey2(today),dv=$('fDue').value||dkey2(due0);if(dv<bk){toast('Delivery date is before booking date.');return}
    const lines=draft.lines.filter(l=>+l.qty>0);
    for(const [i,l] of draft.lines.entries()){if(!String(l.item).trim()){toast(`Line ${i+1}: item name is empty.`);return}if(!(+l.qty>0)){toast(`Line ${i+1}: quantity must be more than 0.`);return}}
    if(!lines.length){toast('Add at least one item.');return}
    const emb=draft.emb.filter(e=>+e.qty>0);for(const [k,e] of draft.emb.entries())if(!(+e.qty>0)){toast(`Embroidery line ${k+1}: quantity must be more than 0.`);return}
    const m=sums();const hq=Math.max(0,+$('fHingeQ').value||0),zq=Math.max(0,+$('fZipQ').value||0);
    if(money&&(+$('fDisc').value||0)>m.gross+0.01){toast('Discount is more than the subtotal.');return}
    if(m.paid>0&&!$('fMethod').value){toast('Choose the payment method.');$('fMethod').focus();return}
    if(m.paid>m.total+0.01){toast('Down payment is more than the total.');return}
    if(hq>m.pcs){toast(`Hinge button pcs (${hq}) is more than the order pcs (${m.pcs}).`);return}
    if(zq>m.pcs){toast(`Zip pcs (${zq}) is more than the order pcs (${m.pcs}).`);return}
    const meas=JSON.parse(JSON.stringify(draft.meas||{}));
    if(!cid){cid=Math.max(DEMO?0:500000,...customers.filter(c=>DEMO||c.id>=500000).map(c=>c.id))+1;customers.push({id:cid,name,phone:$('fPhone').value.trim(),addr:$('fAddr').value.trim(),branch:+$('fBranch').value,profiles:[{name:'Self',m:meas}],hist:[{d:today,t:'First measurement taken',by:USER.name||'Admin'}]})}
    else{const c=cust(cid);c.name=name;if($('fPhone').value.trim())c.phone=$('fPhone').value.trim();if($('fAddr').value.trim())c.addr=$('fAddr').value.trim();
      if(jCount(meas)){const p0=c.profiles[0]||(c.profiles[0]={name:'Self',m:{}});const old=Object.fromEntries(Object.entries(p0.m||{}).filter(([k])=>!k.startsWith('q_')));
        if(JSON.stringify(Object.fromEntries(Object.entries(p0.m||{}).filter(([k])=>k.startsWith('q_'))))!==JSON.stringify(meas)){p0.m={...old,...meas};c.hist.unshift({d:today,t:`Measurement for order #${nextR}`,by:USER.name||'Admin'})}}}
    const method=$('fMethod').value;
    if(m.paid>0)payLog.push({d:today,rno:nextR,branch:+$('fBranch').value,amt:m.paid,m:webCat(method),pm:method,ref:$('fRef').value.trim(),t:'Deposit',by:USER.name||''});
    const o={rno:nextR,cid,branch:+$('fBranch').value,made:+$('fMade').value,qty:m.pcs,price:m.pcs?Math.round(m.total/m.pcs*100)/100:0,total:m.total,paid:m.paid,
      created:new Date(bk+'T00:00:00'),due:new Date(dv+'T00:00:00'),st:'cut',t:{cut:'wait',sew:'wait',hinge:'wait',tat:'wait',btm:'wait',iron:'wait'},tw:{},sent:{},
      tatreez:emb.length>0,hinge:hq>0,hingeQty:hq,zipQty:zq,sample:$('fSample').checked,gift:$('fGift').checked,
      lines:lines.map(l=>({src:l.src,code:l.code||0,item:String(l.item).trim(),qty:+l.qty,rate:+l.rate})),emb:emb.map(e=>({code:e.code,item:e.item,fab:e.fab,qty:+e.qty,rate:+e.rate})),
      gross:m.gross,disc:m.disc,vat:m.vat,pm:method,ref:$('fRef').value.trim(),meas,
      tailor:+$('fTailor').value||0,fabric:lines.map(l=>l.src==='OUT'?'قماش العميل: '+l.item:l.item).join(' + '),design:{...draft.design},profile:0,note:$('fNote').value.trim()};
    Object.assign(o,branchNos(o.branch,o.gift));
    orders.unshift(o);
    toast(`${money?`Order ${ono(o)} saved`:`Order ${ono(o)} sent to the cashier`} · now in ${bname(o.made)} cutting`);
    // customer's own fabric: its receipt + the tag for the factory prints by itself (with the invoice on Save & Print)
    if(print)printReceipt(o,true);else if(outFab(o).length)printFabric(o);
    orderFilter='all';if(can('orders')){location.hash='orders';setTimeout(()=>openOrder(nextR),50)}else{location.hash=RA().home}
  };
  $('saveP').onclick=()=>save(true);$('saveO').onclick=()=>save(false);
  document.onkeydown=e=>{if((location.hash||'')!=='#new'){document.onkeydown=null;return}
    if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='s'){e.preventDefault();save(true)}else if(e.key==='F3'){e.preventDefault();$('addIn').click()}};
  fillMade();fillTailors();drawLines();measInfo();
  if(!money){$('payPanel').hidden=true;$('saveP').textContent='Save & Print';$('saveO').textContent='Save and send to cashier'}
  setTimeout(()=>$('fCno').focus(),30);
}
const sar2=n=>(Math.round((+n||0)*100)/100).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
/* Find… : customers by no. / name / mobile */
function pickCustomer(done){
  const close=drawer('Find customer','<div class="muted" style="font-size:13px">Customer no., name or mobile</div>',
    `<input id="pcQ" placeholder="Search…" style="width:100%;border:1px solid var(--line);border-radius:8px;padding:10px"><div class="rows" id="pcL" style="margin-top:8px;border:1px solid var(--line);border-radius:8px"></div>`,'');
  const draw=()=>{const q=document.getElementById('pcQ').value.trim().toLowerCase();
    const l=customers.filter(c=>!q||String(c.id)===q||c.name.toLowerCase().includes(q)||String(c.phone).includes(q)).slice(0,80);
    document.getElementById('pcL').innerHTML=l.map(c=>`<div class="row" data-pc="${c.id}" style="cursor:pointer"><span class="rid">${c.id}</span><div class="grow"><b dir="auto">${esc(c.name)}</b><span>${esc(c.phone)}${c.book?' · '+esc(c.book):''}</span></div></div>`).join('')||'<div class="empty">No customer found.</div>';
    document.querySelectorAll('[data-pc]').forEach(r=>r.onclick=()=>{close();done(cust(+r.dataset.pc))})};
  document.getElementById('pcQ').oninput=draw;draw();setTimeout(()=>document.getElementById('pcQ').focus(),30);
}
/* Add item from stock: code / name / company / colour / rate / in stock */
function pickStock(done){
  const close=drawer('Add item from stock','<div class="muted" style="font-size:13px">The shop\'s fabric stock (from the AL THOB exe)</div>',
    `<input id="psQ" placeholder="Code or name…" style="width:100%;border:1px solid var(--line);border-radius:8px;padding:10px"><div class="tbl-wrap" style="margin-top:8px;border:1px solid var(--line);border-radius:8px"><table><thead><tr><th>Code</th><th>Item</th><th>Company</th><th>Rate</th><th>Stock</th></tr></thead><tbody id="psL"></tbody></table></div>`,'');
  const draw=()=>{const q=document.getElementById('psQ').value.trim().toLowerCase();
    const l=STOCK.filter(it=>!q||String(it.code).startsWith(q)||String(it.name).toLowerCase().includes(q)||String(it.company||'').toLowerCase().includes(q));
    document.getElementById('psL').innerHTML=l.map(it=>`<tr class="click" data-ps="${it.code}"><td class="num"><b>${it.code}</b></td><td dir="auto">${esc(it.name)}${it.colour?` <span class="muted">${esc(it.colour)}</span>`:''}</td><td>${esc(it.company||'')}</td><td class="num">${sar(it.rate)}</td><td class="num" style="color:${it.stock>0?'inherit':'var(--bad)'}">${it.stock!=null?Math.floor(it.stock):''}</td></tr>`).join('')||'<tr><td colspan="5"><div class="empty">No fabric found.</div></td></tr>';
    document.querySelectorAll('[data-ps]').forEach(r=>r.onclick=()=>{const it=STOCK.find(x=>String(x.code)===r.dataset.ps);close();if(it.stock!=null&&it.stock<=0)toast(`Fabric ${it.code} is out of stock`);done(it)})};
  document.getElementById('psQ').oninput=draw;draw();setTimeout(()=>document.getElementById('psQ').focus(),30);
}
function pickEmb(done){
  const close=drawer('Choose embroidery','<div class="muted" style="font-size:13px">Embroidery designs (from the AL THOB exe)</div>',
    `<div class="rows" style="border:1px solid var(--line);border-radius:8px">${EMBL.map(x=>`<div class="row" data-pe="${x.code}" style="cursor:pointer"><span class="rid">${x.code}</span><div class="grow"><b dir="auto">${esc(x.model)}</b></div><span class="num">${sar(x.price)} SAR</span></div>`).join('')}</div>`,'');
  document.querySelectorAll('[data-pe]').forEach(r=>r.onclick=()=>{close();done(EMBL.find(x=>String(x.code)===r.dataset.pe))});
}
/* Save & Print: the order slip (A5 / receipt) */

/* the order's items as the shop exe keeps them: fabric lines (IN = shop stock / OUT = customer's fabric), embroidery, totals */
function orderItems(o){
  const L=o.lines||[],E=o.emb||[],money=RA().money;
  const extra=[oinv(o)?['Invoice no.',oinv(o)]:null,o.binv&&o.invoiceNo?['Shop invoice no.',String(o.invoiceNo)]:null,o.exeNo&&o.exeNo!==o.rno?['Shop order no.',String(o.exeNo)]:null,o.hingeQty?['Hinge button',o.hingeQty+' pcs']:null,o.zipQty?['Zip',o.zipQty+' pcs']:null,
    o.sample?['Sample','Customer left a sample thobe']:null,o.gift?['Free gift','No invoice']:null,money&&o.pm?['Paid by',o.pm+(o.ref?' · '+o.ref:'')]:null].filter(Boolean);
  if(!L.length&&!E.length&&!extra.length)return '';
  return `<div><p class="h4">Items</p>${L.length||E.length?`<div class="tbl-wrap" style="border:1px solid var(--line);border-radius:8px"><table><thead><tr><th>Type</th><th>Item</th><th>Pcs</th>${money?'<th>Rate</th><th>Amount</th>':''}</tr></thead><tbody>
    ${L.map(l=>`<tr><td><span class="tag">${esc(l.src)}</span></td><td dir="auto">${esc(l.item)}${l.code?` <span class="muted num">(${l.code})</span>`:''}</td><td class="num">${l.qty}</td>${money?`<td class="num">${sar(l.rate)}</td><td class="num">${sar(l.qty*l.rate)}</td>`:''}</tr>`).join('')}
    ${E.map(e=>`<tr><td><span class="tag">EMB</span></td><td dir="auto">${esc(e.item)}${e.code?` <span class="muted num">(${e.code})</span>`:''}${e.fab>=0&&L[e.fab]?` <span class="muted">← ${esc(L[e.fab].item)}</span>`:''}</td><td class="num">${e.qty}</td>${money?`<td class="num">${sar(e.rate)}</td><td class="num">${sar(e.qty*e.rate)}</td>`:''}</tr>`).join('')}</tbody></table></div>`:''}
    ${money&&(o.disc||o.vat)?`<div class="kv" style="margin-top:8px">${o.gross?`<div><span>Subtotal</span><b>${sar(o.gross)}</b></div>`:''}<div><span>Discount</span><b>${sar(o.disc||0)}</b></div><div><span>VAT 15% (included)</span><b>${(+o.vat||0).toFixed(2)}</b></div></div>`:''}
    ${extra.length?`<div class="kv" style="margin-top:8px">${extra.map(([k,v])=>`<div><span>${k}</span><b style="font-family:var(--f-body);font-size:13px">${esc(v)}</b></div>`).join('')}</div>`:''}</div>`;
}

/* ================= Measurements ================= */
// thobe drawing: [key, line path, badge x, badge y]
const TH=[
 ['tool','M104 46V338',92,190],
 ['katf','M62 40H238',150,32],
 ['sadr','M80 112H220',206,104],
 ['wast','M78 196H222',206,188],
 ['hajr','M76 268H224',206,260],
 ['kom','M244 50 282 154',272,96],
 ['wkom','M224 92 252 78',246,70],
 ['kabak','M262 166 292 152',294,168],
 ['raqba','M126 36Q150 52 174 36',150,58],
 ['jaib','M172 122H194V146H172Z',183,134]];
function thobeSVG(){
  return `<svg class="thobe" viewBox="0 0 310 360" aria-label="Thobe measurement guide">
   <path class="o" d="M124 30Q150 50 176 30L240 48 296 150 264 170 224 98 230 342H70L76 98 36 170 4 150 60 48Z"/>
   <path class="seam" d="M150 44V150M76 98H224"/>
   ${TH.map(([k,p],i)=>`<path class="ml" data-k="${k}" d="${p}"/>`).join('')}
   ${TH.map(([k,p,x,y],i)=>`<g class="bd" data-k="${k}"><circle cx="${x}" cy="${y}" r="9"/><text x="${x}" y="${y+3.6}" text-anchor="middle">${i+1}</text></g>`).join('')}
  </svg>`;
}
/* Measurements: the JAMEEL measurement sheet (as the exe), one per customer – his newest measurement */
let jsCur=null;
let mOrdSel=0;
function measurements(){
  const q=document.getElementById('q').value.trim().toLowerCase();
  const list=customers.filter(c=>(!curBranch||c.branch===curBranch)&&(!q||c.name.toLowerCase().includes(q)||String(c.phone).includes(q)||String(c.id)===q));
  if(!list.find(c=>c.id===selCust)){selCust=list[0]?list[0].id:0}
  const c=customers.find(x=>x.id===selCust);
  if(!c){V(`${demoNote}<div class="panel"><div class="empty">No customers${q?' match “'+esc(q)+'”':' in this branch yet'}.</div></div>`);return}
  const p=c.profiles[0]||(c.profiles[0]={name:'Self',m:{}});p.m=p.m||{};
  const work=Object.fromEntries(Object.entries(p.m).filter(([k])=>k.startsWith('q_')));
  const oldPaper=MALL.some(([k])=>mVal(p.m,k)!=='');
  const last=orders.filter(o=>o.cid===c.id).sort((a,b)=>b.rno-a.rno);
  const show=list.slice(0,300);
  if(!last.some(o=>o.rno===mOrdSel))mOrdSel=(last.find(o=>oInfo(o).dq<o.qty)||last[0]||{}).rno||0;const mo=last.find(o=>o.rno===mOrdSel)||null;
  V(`<div class="mlay">
   <div class="panel"><div style="padding:10px 12px 0">${pgSearch('Name, mobile or customer no.')}</div><div class="panel-h"><h2>Customers</h2><span class="sp"></span><span class="muted num" style="font-size:12px">${list.length}</span></div>
    <div class="clist">${show.map(x=>`<button class="crow ${x.id===c.id?'on':''}" data-c="${x.id}"><div class="ini num" style="font-size:11px">${x.id}</div><div class="grow"><b dir="auto">${esc(x.name)}</b><span>${esc(x.phone)}${jHas((x.profiles[0]||{}).m)?' · 📐':''}</span></div></button>`).join('')}${list.length>show.length?`<div class="muted" style="padding:10px;font-size:12px">Search to find the other ${list.length-show.length}…</div>`:''}</div></div>
   <div class="sec">
    <div class="panel">
     <div class="panel-h" style="flex-wrap:wrap;gap:8px"><div><h2 style="font-size:18px;font-family:var(--f-display);font-weight:600" dir="auto">${esc(c.name)}</h2><span class="muted num" style="font-size:12.5px">No. ${c.id} · ${esc(c.phone)} · ${bname(c.branch)} · ${pl(last.length,'order')}${c.book?` · <span dir="rtl">دفتر ${esc(c.book)}</span>`:''}</span></div><span class="sp"></span>
      <span class="muted" id="msN" style="font-size:12.5px"></span>
      <button class="btn sm" id="msZo" aria-label="Smaller">－</button><button class="btn sm" id="msZi" aria-label="Bigger">＋</button><button class="btn sm" id="msFull">Full screen</button>
      <button class="btn sm" id="mPrint">🖨 Print sheet</button><button class="btn sm" id="mReset">Undo changes</button><button class="btn sm pri" id="mSave">Save measurements</button>
      ${can('new')?`<button class="btn sm" id="newOrdBtn">${ico('plus')}New order</button>`:''}</div>
     ${last.length?`<div class="mordsel"><label for="mOrd" class="muted" style="font-size:12.5px;font-weight:600">Order for this sheet</label><select id="mOrd">${last.map(o=>`<option value="${o.rno}" ${o.rno===mo.rno?'selected':''}>${esc(ono(o))} · ${fmtD(o.created)} · ${pl(o.qty,'thobe')} · ${esc(oInfo(o).where)}</option>`).join('')}</select></div>`:''}
     ${jHeadHtml(mo,c)}
     <div class="jwrap" id="msHost"></div>
    </div>
    ${oldPaper?`<details class="panel" style="padding:0"><summary class="panel-h" style="cursor:pointer"><h2>Old shop paper values</h2><span class="sp"></span><span class="muted" style="font-size:12px">from the earlier AL THOB sheet</span></summary><div class="panel-b">${mShow(p.m)}</div></details>`:''}
    <div class="grid2">
     <div class="panel"><div class="panel-h"><h2>Measurement history</h2></div><div class="panel-b"><div class="hist">${(c.hist||[]).map(h=>`<div><time>${fmtD(h.d)}</time><span style="flex:1">${esc(h.t)}</span><span class="muted">${esc(h.by||'')}</span></div>`).join('')||'<span class="muted">—</span>'}</div></div></div>
     <div class="panel"><div class="panel-h"><h2>Recent orders</h2></div><div class="rows">${last.slice(0,5).map(o=>`<div class="row" data-r="${o.rno}" style="cursor:pointer"><span class="rid">${ono(o)}</span><div class="grow"><b>${pl(o.qty,'thobe')} · <span dir="auto">${esc(o.fabric||'')}</span></b><span>${fmtD(o.created)}</span></div>${pill(o)}</div>`).join('')||'<div class="empty">No orders yet.</div>'}</div></div>
    </div>
   </div></div>`);
  const fabs=()=>{const a=[];last.slice(0,3).forEach(o=>(o.lines||[]).forEach(l=>{const n=l.src==='OUT'?'قماش العميل':String(l.code||l.item);if(!a.includes(n))a.push(n)}));return a};
  const msN=()=>{document.getElementById('msN').textContent=jCount(work)+' values'};
  jsCur=jSheet(document.getElementById('msHost'),work,{fabrics:fabs,onChange:msN});msN();
  document.getElementById('msZo').onclick=()=>jsCur.zoom(.8);document.getElementById('msZi').onclick=()=>jsCur.zoom(1.25);
  document.getElementById('msFull').onclick=()=>jSheetWindow(`Measurements · ${c.name}`,work,{fabrics:fabs,onDone:m=>{jsCur.load(m)}});
  document.querySelectorAll('.crow').forEach(b=>b.onclick=()=>{selCust=+b.dataset.c;mOrdSel=0;measurements();const s=document.querySelector('.mlay .sec');if(s&&innerWidth<1000)s.scrollIntoView({behavior:'smooth',block:'start'})});
  bindPgSearch();
  document.getElementById('mReset').onclick=()=>measurements();
  const mos=document.getElementById('mOrd');if(mos)mos.onchange=()=>{mOrdSel=+mos.value;measurements()};
  document.getElementById('mPrint').onclick=()=>printSheet(mo&&jHas(mo.meas)?mo.meas:work,mo,c);
  document.getElementById('mSave').onclick=()=>{
    const before=Object.fromEntries(Object.entries(p.m).filter(([k])=>k.startsWith('q_')));
    const keys=new Set([...Object.keys(before),...Object.keys(work)]);let n=0;keys.forEach(k=>{if((before[k]||'')!==(work[k]||''))n++});
    if(!n){toast('No changes to save');return}
    const keep=Object.fromEntries(Object.entries(p.m).filter(([k])=>!k.startsWith('q_')));
    p.m={...keep,...JSON.parse(JSON.stringify(work))};
    (c.hist=c.hist||[]).unshift({d:today,t:`Measurement sheet: ${pl(n,'change')} (${jCount(work)} values)`,by:USER.name||'Admin'});
    toast(`Saved · ${pl(n,'change')}`);measurements()};
  const nb=document.getElementById('newOrdBtn');if(nb)nb.onclick=()=>{location.hash='new';setTimeout(()=>{const x=document.getElementById('fCno');if(x){x.value=c.id;x.onchange()}},40)};
  addEventListener('resize',function rs(){if(!document.getElementById('msHost')){removeEventListener('resize',rs);return}jsCur.fit()});
  bindRows();
}

/* ================= Customers ================= */
function customersView(){
  const q=document.getElementById('q').value.trim().toLowerCase();
  const list=customers.filter(c=>(!curBranch||c.branch===curBranch)&&(!q||c.name.toLowerCase().includes(q)||String(c.phone).includes(q)||String(c.id)===q)).map(c=>{const os=orders.filter(o=>o.cid===c.id);return{c,n:os.length,spent:os.reduce((s,o)=>s+o.paid,0),due:os.reduce((s,o)=>s+o.total-o.paid,0),last:os[0]}}).sort((a,b)=>b.spent-a.spent);
  V(`<div class="panel"><div class="panel-h"><h2>${pl(list.length,'customer')}</h2><span class="sp"></span><span class="muted" style="font-size:12px">Sorted by total spent · tap a customer to see everything</span></div><div class="tbl-wrap"><table>
   <thead><tr><th class="r">Cust No</th><th>Customer</th><th>Mobile</th><th>Book</th><th class="r">Orders</th>${RA().money?'<th class="r">Total paid</th><th class="r">Balance</th>':''}<th>Last order</th><th>Home branch</th></tr></thead>
   <tbody>${list.map(x=>`<tr class="click" data-c="${x.c.id}"><td class="num r" style="text-align:right">${x.c.id}</td><td><b dir="auto">${esc(x.c.name)}</b></td><td class="num">${esc(x.c.phone)}</td><td dir="auto" class="muted">${esc(x.c.book||'')}</td><td class="num" style="text-align:right">${x.n}</td>${RA().money?`<td class="num" style="text-align:right">${sar(x.spent)}</td>
    <td class="num" style="text-align:right;color:${x.due?'var(--bad)':'var(--muted)'}">${x.due?sar(x.due):'—'}</td>`:''}<td>${x.last?`<span class="rid">${ono(x.last)}</span> ${pill(x.last)}`:'—'}</td><td>${bTag(x.c.branch)} ${bname(x.c.branch)}</td></tr>`).join('')}</tbody></table></div></div>`);
  document.querySelectorAll('tr[data-c]').forEach(r=>r.onclick=()=>openCustomer(+r.dataset.c));
}

/* ================= Payments ================= */
/* Payments: the AL THOB exe's Payments page (every payment and delivery, from – to, type, branch, search) and the unpaid receipts */
let payTab='log',payF={from:null,to:null,type:'all',br:-1,q:''};
function payRows(){
  // one row per payment; a delivery on the same order and day joins its payment row, else it is a row of its own
  const used=new Set(),rows=[];
  payLog.forEach((p,i)=>{const d=p.t==='Deposit'?-1:delLog.findIndex((x,k)=>!used.has(k)&&x.rno===p.rno&&sameDay(x.d,new Date(new Date(p.d).setHours(0,0,0,0))));if(d>=0)used.add(d);
    rows.push({k:'p'+i,d:p.d,rno:p.rno,branch:p.branch,type:p.t==='Deposit'?'Down payment':'Due payment',act:p.t==='Deposit'?'SELL':d>=0?'DELIVER':'PAY',amt:+p.amt||0,m:p.pm||p.m||'',ref:p.ref||'',dq:d>=0?(+delLog[d].qty||0):0,receipt:p.receipt||'',src:p,del:d>=0?delLog[d]:null})});
  delLog.forEach((x,k)=>{if(!used.has(k))rows.push({k:'d'+k,d:x.d,rno:x.rno,branch:x.branch,type:'Delivery',act:'DELIVER',amt:0,m:'',ref:'',dq:+x.qty||0,receipt:'',src:null,del:x})});
  return rows.sort((a,b)=>b.d-a.d||b.rno-a.rno);
}
function payments(){
  const money=RA().money;
  if(!payF.from){payF.from=new Date(today.getFullYear(),today.getMonth(),1);payF.to=new Date(today)}
  if(payF.br<0)payF.br=curBranch&&!isFac(curBranch)?curBranch:0;
  if(typeof ensurePayRange==='function')ensurePayRange(payF.from);
  const tabs=`<div class="seg" role="tablist" style="margin-bottom:2px"><button class="${payTab==='log'?'on':''}" data-pt="log">Payments</button><button class="${payTab==='due'?'on':''}" data-pt="due">Unpaid receipts</button></div>`;
  if(payTab==='due'){
    const all=O();const open=all.filter(o=>o.total>o.paid+0.005).sort((a,b)=>(b.total-b.paid)-(a.total-a.paid));
    const coll=all.reduce((s,o)=>s+o.paid,0),due=open.reduce((s,o)=>s+o.total-o.paid,0),readyDue=open.filter(o=>o.st==='ready').reduce((s,o)=>s+o.total-o.paid,0);
    V(`${tabs}<div class="okpi"><div><span>Collected</span><b class="num">${sar(coll)}<small>SAR</small></b><em>On the orders shown</em></div><div class="bad"><span>Balance due</span><b class="num">${sar(due)}<small>SAR</small></b><em>${pl(open.length,'order')}</em></div><div class="okc"><span>Due on ready orders</span><b class="num">${sar(readyDue)}<small>SAR</small></b><em>Collected at pickup</em></div></div>
    <div class="panel opanel"><div class="tbl-wrap otbl"><table class="ot" style="min-width:900px"><thead><tr><th>Order / Invoice</th><th>Customer</th><th>Mobile</th><th class="r">Total</th><th class="r">Paid</th><th class="r">Balance</th><th>Paid so far</th><th>Status</th><th>Branch</th></tr></thead>
     <tbody>${open.map(o=>{const c=cust(o.cid),p=o.total?o.paid/o.total:0;return `<tr class="click" data-r="${o.rno}"><td><span class="rid">${ono(o)}</span><small class="sub">${oinv(o)?'Inv '+oinv(o):'Inv —'}</small></td><td><b dir="auto">${esc(c.name)}</b></td><td class="num">${esc(c.phone)}</td>
      <td class="r num">${sar(o.total)}</td><td class="r num">${sar(o.paid)}</td><td class="r num tbad">${sar(o.total-o.paid)}</td><td><div class="mbar"><i><b style="width:${p*100}%"></b></i></div></td><td>${pill(o)}</td><td>${bTag(o.branch)} ${bname(o.branch)}</td></tr>`}).join('')}</tbody></table>${open.length?'':'<div class="empty">No unpaid receipts.</div>'}</div></div>`);
    document.querySelectorAll('[data-pt]').forEach(b=>b.onclick=()=>{payTab=b.dataset.pt;payments()});bindRows();return}
  const d0=new Date(payF.from),d1=new Date(payF.to);d1.setHours(23,59,59);
  const q=payF.q.trim().toLowerCase();
  const rows=payRows().filter(r=>{if(r.d<d0||r.d>d1)return false;if(payF.br&&r.branch!==payF.br)return false;
    if(payF.type==='down'&&r.type!=='Down payment')return false;if(payF.type==='due'&&r.type==='Down payment')return false;
    if(!q)return true;const o=orders.find(x=>x.rno===r.rno),c=o?cust(o.cid):null;return String(r.rno)===q||String(r.receipt)===q||(o&&ordMatch(o,q))||(c&&c.name.toLowerCase().includes(q))});
  const tot=rows.reduce((s,r)=>s+r.amt,0),byM={};rows.forEach(r=>{if(r.amt){const k=webCat(r.m||'Cash');byM[k]=(byM[k]||0)+r.amt}});
  const D=d=>d.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'2-digit'});
  V(`${tabs}<div class="okpi"><div><span>Payments</span><b class="num">${rows.filter(r=>r.amt).length}</b><em>${D(d0)} – ${D(d1)}</em></div>
    <div class="okc"><span>Total received</span><b class="num">${sar2(tot)}<small>SAR</small></b><em>${payF.br?bname(payF.br):'All branches'}</em></div>
    ${['Cash','Card (mada)','Transfer'].map(k=>`<div><span>${k}</span><b class="num">${sar(byM[k]||0)}<small>SAR</small></b><em>${tot?Math.round((byM[k]||0)/tot*100):0}%</em></div>`).join('')}
    <div><span>Deliveries</span><b class="num">${rows.reduce((s,r)=>s+r.dq,0)}</b><em>pieces handed over</em></div></div>
  <div class="okpi c4" style="margin-top:-10px"><div class="okc"><span>Down payments</span><b class="num">${sar2(rows.filter(r=>r.type==='Down payment').reduce((s,r)=>s+r.amt,0))}<small>SAR</small></b><em>${pl(rows.filter(r=>r.type==='Down payment'&&r.amt).length,'order')} at booking</em></div>
   <div class="okc"><span>Due payments</span><b class="num">${sar2(rows.filter(r=>r.type==='Due payment').reduce((s,r)=>s+r.amt,0))}<small>SAR</small></b><em>${pl(rows.filter(r=>r.type==='Due payment'&&r.amt).length,'payment')} later / at pickup</em></div>
   <div><span>Delivered with payment</span><b class="num">${rows.filter(r=>r.act==='DELIVER'&&r.amt).reduce((s,r)=>s+r.dq,0)}</b><em>pieces</em></div><div><span>Delivered, nothing paid</span><b class="num">${rows.filter(r=>r.act==='DELIVER'&&!r.amt).reduce((s,r)=>s+r.dq,0)}</b><em>pieces (already paid before, or due)</em></div></div>
  <div class="panel opanel">
   <div class="otools">${money?`<button class="btn sm pri" id="pRecv">${ico('cash')}Receive payment / Deliver</button>`:''}<button class="btn sm" id="pReprint">Reprint receipt</button>${isOwner()?'<button class="btn sm" id="pDel" style="color:var(--bad)">Delete payment</button>':''}<span class="sp"></span><button class="btn sm" id="pCsv">${ico('orders')}CSV</button><button class="btn sm" id="pPrint">${ico('cal')}Print</button></div>
   <div class="otools pf">
    <label>From <input type="date" id="pFrom" value="${dkey2(d0)}"></label><label>To <input type="date" id="pTo" value="${dkey2(payF.to)}"></label>
    <select id="pType"><option value="all"${payF.type==='all'?' selected':''}>All payments</option><option value="down"${payF.type==='down'?' selected':''}>Down payments (at booking)</option><option value="due"${payF.type==='due'?' selected':''}>Due payments / deliveries</option></select>
    <select id="pBr"><option value="0">All branches</option>${SHOPS().map(b=>`<option value="${b.id}"${b.id===payF.br?' selected':''}>${esc(b.name)}</option>`).join('')}</select>
    <input id="pQ" placeholder="Search: name / order / receipt" value="${esc(payF.q)}" style="min-width:200px"><label class="search pgo" title="Order no. – Enter to open"><span class="muted" style="font-size:11px;font-weight:700">#</span><input id="pgO" placeholder="Order no." autocomplete="off"></label>
    <button class="btn sm pri" id="pShow">Show</button><span class="muted" style="font-size:13px"><b>${pl(rows.length,'row')}</b> · Total <b class="num">${sar2(tot)}</b></span></div>
   <div class="tbl-wrap otbl"><table class="ot" style="min-width:1520px"><thead><tr><th class="stk s1">Date</th><th>Receipt</th><th>Order No</th><th>Invoice</th><th>Customer</th><th class="r">Order Total</th><th class="r">Down payment</th><th>Type</th><th>Action</th><th class="r">Amount</th><th>Method</th><th>Reference</th><th class="r">Delivered Qty</th><th class="r">Balance now</th><th>Branch</th></tr></thead>
    <tbody>${rows.map(r=>{const o=orders.find(x=>x.rno===r.rno),c=o?cust(o.cid):null;return `<tr class="click${r.k===payF.sel?' sel':''}" data-pk="${r.k}" tabindex="0">
     <td class="stk s1 num">${D(r.d)}</td><td class="num">${r.receipt||'<span class="muted">—</span>'}</td><td><span class="rid">${onoR(r.rno)}</span></td><td class="num">${o&&oinv(o)?esc(oinv(o)):'<span class="muted">—</span>'}</td>
     <td><b dir="auto">${c?esc(c.name):'—'}</b></td><td class="r num">${o?sar(o.total):'—'}</td><td class="r num">${(()=>{if(r.type==='Down payment')return `<b style="color:var(--ok)">${sar2(r.amt)}</b><small class="sub">${fmtD(r.d)}</small>`;const dp=payLog.filter(p=>p.rno===r.rno&&p.t==='Deposit');const a=dp.reduce((s,p)=>s+(+p.amt||0),0);return a?`<b style="color:var(--ok)">${sar2(a)}</b><small class="sub">${fmtD(dp[0].d)}</small>`:'<span class="muted">—</span>'})()}</td><td>${r.type==='Down payment'?'<b>Sell</b>':r.type==='Delivery'?'Delivery':r.act==='DELIVER'?'Pay + delivery':'Pay'}</td><td><span class="pill ${r.act==='DELIVER'?'s-ready':r.act==='SELL'?'s-info':'s-cut'}">${r.act}</span></td>
     <td class="r num" style="font-weight:600">${r.amt?sar2(r.amt):'<span class="muted">0</span>'}</td><td>${esc(r.m)}</td><td class="num">${esc(r.ref)}</td><td class="r num">${r.dq||''}</td>
     <td class="r num ${o&&o.total-o.paid>0.5?'tbad':'tok'}">${o?(o.total-o.paid>0.5?sar(o.total-o.paid):'—'):''}</td><td>${bTag(r.branch)} ${bname(r.branch)}</td></tr>`}).join('')}</tbody>
    ${rows.length?`<tfoot><tr><td class="stk s1">Total</td><td colspan="8">${pl(rows.length,'row')}</td><td class="r num">${sar2(tot)}</td><td colspan="2"></td><td class="r num">${rows.reduce((s,r)=>s+r.dq,0)}</td><td colspan="2"></td></tr></tfoot>`:''}
   </table>${rows.length?'':'<div class="empty">No payments in these days.</div>'}</div></div>`);
  const $=id=>document.getElementById(id);
  bindOrdBox();
  const apply=()=>{payF.from=new Date($('pFrom').value+'T00:00:00');payF.to=new Date($('pTo').value+'T00:00:00');payF.type=$('pType').value;payF.br=+$('pBr').value;payF.q=$('pQ').value;payments()};
  $('pShow').onclick=apply;['pType','pBr','pFrom','pTo'].forEach(id=>$(id).onchange=apply);$('pQ').onkeydown=e=>{if(e.key==='Enter')apply()};
  document.querySelectorAll('[data-pt]').forEach(b=>b.onclick=()=>{payTab=b.dataset.pt;payments()});
  document.querySelectorAll('tr[data-pk]').forEach(tr=>{tr.onclick=()=>{payF.sel=tr.dataset.pk;document.querySelectorAll('tr[data-pk]').forEach(x=>x.classList.toggle('sel',x===tr))};tr.ondblclick=()=>{const r=rows.find(x=>x.k===tr.dataset.pk);if(r)openOrder(r.rno)}});
  const selRow=()=>{const r=rows.find(x=>x.k===payF.sel);if(!r)toast('Click a payment first');return r};
  if($('pRecv'))$('pRecv').onclick=()=>receivePayment();
  $('pReprint').onclick=()=>{const r=selRow();if(r)printPayment(r)};
  if($('pDel'))$('pDel').onclick=()=>{const r=selRow();if(!r)return;const o=orders.find(x=>x.rno===r.rno);
    if((r.src&&r.src.exe)||(r.del&&r.del.exe)){toast('This payment came from the shop exe – delete it there (Payments → Delete payment)');return}
    if(!confirm(`Delete this payment of ${sar2(r.amt)} SAR for order ${r.rno}?`))return;
    if(r.src){payLog.splice(payLog.indexOf(r.src),1);if(o)o.paid=Math.max(0,Math.round((o.paid-r.amt)*100)/100)}
    if(r.del){delLog.splice(delLog.indexOf(r.del),1);if(o&&o.st==='done')o.st=o.t.sew==='done'?'ready':o.st}
    payF.sel=null;toast('Payment deleted');payments()};
  const csvRows=()=>[['Date','Receipt','Order No','Invoice','Customer','Order Total','Type','Action','Amount','Method','Reference','Delivered Qty','Branch'],
    ...rows.map(r=>{const o=orders.find(x=>x.rno===r.rno),c=o?cust(o.cid):null;return [dkey2(r.d),r.receipt,onoR(r.rno).replace(/^#/,''),o?oinv(o):'',c?c.name:'',o?o.total:'',r.type==='Down payment'?'Sell':r.type==='Delivery'?'Delivery':r.act==='DELIVER'?'Pay + delivery':'Pay',r.act,r.amt,r.m,r.ref,r.dq,bname(r.branch)]})];
  $('pCsv').onclick=()=>{const csv='﻿'+csvRows().map(r=>r.map(v=>`"${String(v??'').replace(/"/g,'""')}"`).join(',')).join('\r\n');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));a.download=`payments_${dkey2(d0)}_${dkey2(payF.to)}.csv`;a.click()};
  $('pPrint').onclick=()=>{const rs=csvRows(),w=window.open('','_blank');if(!w){toast('Allow pop-ups to print');return}
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Payments</title><style>body{font:11px Arial,sans-serif;margin:16px}h1{font-size:16px;margin:0 0 4px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ccc;padding:3px 5px;text-align:left;white-space:nowrap}th{background:#eee}@page{size:A4 landscape;margin:10mm}</style></head><body><h1>Payments · ${payF.br?esc(bname(payF.br)):'All branches'}</h1><p>${D(d0)} – ${D(d1)} · ${pl(rows.length,'row')} · total ${sar2(tot)} SAR</p><table><thead><tr>${rs[0].map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${rs.slice(1).map(r=>`<tr>${r.map(v=>`<td dir="auto">${esc(v??'')}</td>`).join('')}</tr>`).join('')}</tbody></table></body></html>`);w.document.close();setTimeout(()=>w.print(),300)};
}
/* + Receive payment / Deliver: as the exe's payment window – order no., due, amount, method, reference, pieces handed over */
function receivePayment(rno,deliverAll){
  const close=drawer('Receive payment / Deliver','<div class="muted" style="font-size:13px">Type the order no. (or the invoice no.)</div>',
   `<div class="fgrid" style="grid-template-columns:1fr 1fr"><div class="field" style="grid-column:1/-1"><label for="rpO">Order No</label><input id="rpO" class="num" value="${rno?esc(onoR(rno).replace(/^#/,'')):''}"></div>
     <div id="rpInfo" style="grid-column:1/-1"></div>
     <div class="field"><label for="rpA">Amount (SAR)</label><input id="rpA" type="number" min="0" class="num"></div>
     <div class="field"><label for="rpM">Payment method</label><select id="rpM"><option value=""></option>${PMETHODS.map(m=>`<option>${m}</option>`).join('')}</select></div>
     <div class="field"><label for="rpR">Reference / SPAN</label><input id="rpR"></div>
     <div class="field"><label for="rpQ">Deliver pieces now</label><input id="rpQ" type="number" min="0" value="0" class="num"></div></div>`,
   `<button class="btn pri" id="rpSave">Save</button><button class="btn" id="rpPrint">Save &amp; Print</button>`);
  const $=id=>document.getElementById(id);let o=null;
  const find=()=>{const v=$('rpO').value.trim();o=orders.find(x=>String(x.rno)===v)||(v&&orders.find(x=>ordMatch(x,v)))||null;
    if(!o){$('rpInfo').innerHTML=v?'<div class="msg" style="border-color:var(--bad)">Order not found.</div>':'';return}
    const c=cust(o.cid),due=Math.round((o.total-o.paid)*100)/100,x=oInfo(o);
    $('rpInfo').innerHTML=`<div class="kv"><div><span>Customer</span><b dir="auto" style="font-family:var(--f-body);font-size:13px">${esc(c.name)}</b></div><div><span>Total</span><b>${sar2(o.total)}</b></div><div><span>Paid</span><b>${sar2(o.paid)}</b></div><div><span>Due</span><b style="color:${due>0?'var(--bad)':'var(--ok)'}">${sar2(due)}</b></div><div><span>Pieces</span><b>${o.qty}</b></div><div><span>Delivered</span><b>${x.dq}</b></div></div>`;
    $('rpA').value=due>0?due:0;$('rpQ').max=o.qty-x.dq;if(deliverAll)$('rpQ').value=Math.max(0,o.qty-x.dq)};
  $('rpO').oninput=find;find();setTimeout(()=>$('rpO').focus(),30);
  const save=print=>{if(!o){toast('Type a valid order no.');return}
    const a=Math.round((+$('rpA').value||0)*100)/100,q=Math.max(0,+$('rpQ').value||0),due=Math.round((o.total-o.paid)*100)/100,left=o.qty-oInfo(o).dq,m=$('rpM').value;
    if(a<0||a>due+0.01){toast(`More than the due ${sar2(due)}`);return}
    if(a>0&&!m){toast('Choose the payment method');return}
    if(q>left){toast(`Only ${left} piece(s) left to deliver`);return}
    if(!a&&!q){toast('Enter the amount or the pieces');return}
    if(q>0&&due-a>0.5&&!confirm(`Customer still owes ${sar2(due-a)} SAR. Deliver anyway?`))return;
    const p=a>0?{d:new Date(today),rno:o.rno,branch:o.branch,amt:a,m:webCat(m),pm:m,ref:$('rpR').value.trim(),t:'Balance',by:USER.name||''}:null;
    if(p){payLog.push(p);o.paid=Math.round((o.paid+a)*100)/100}
    if(q>0){delLog.push({d:new Date(today),rno:o.rno,branch:o.branch,qty:q,amt:a});if(oInfo(o).dq>=o.qty)o.st='done'}
    close();toast(`Order ${ono(o)}: ${a?sar2(a)+' SAR received':''}${a&&q?' · ':''}${q?q+' pcs delivered':''}`);
    if(print)printPayment({d:new Date(today),rno:o.rno,amt:a,m,ref:p?p.ref:'',dq:q,type:'Due payment',receipt:''});route()};
  $('rpSave').onclick=()=>save(false);$('rpPrint').onclick=()=>save(true);
}
function printPayment(r){
  const o=orders.find(x=>x.rno===r.rno),c=o?cust(o.cid):null,w=window.open('','_blank');if(!w){toast('Allow pop-ups to print');return}
  w.document.write(`<!doctype html><html dir="rtl"><head><meta charset="utf-8"><title>Receipt ${r.rno}</title><style>body{font:13px Arial,sans-serif;margin:12px;max-width:340px}h1{font-size:16px;margin:0}td{padding:3px 2px}td.n{text-align:left;direction:ltr}.b{font-weight:bold;font-size:15px}@page{margin:6mm}</style></head><body>
   <h1>الثوب السعودي · AL THOB AL SAUDI</h1><div>سند قبض / Payment receipt${r.receipt?' #'+r.receipt:''}</div><hr><table style="width:100%">
   <tr><td>التاريخ / Date</td><td class="n">${r.d.toLocaleDateString('en-GB')}</td></tr><tr><td>رقم الطلب / Order</td><td class="n b">${esc(onoR(r.rno).replace(/^#/,""))}</td></tr>${o&&oinv(o)?`<tr><td>الفاتورة / Invoice</td><td class="n">${esc(oinv(o))}</td></tr>`:''}
   <tr><td>العميل / Customer</td><td class="n">${c?esc(c.name):''}</td></tr><tr><td>المبلغ / Amount</td><td class="n b">${sar2(r.amt)} SAR</td></tr>${r.m?`<tr><td>طريقة الدفع / Method</td><td class="n">${esc(r.m)}${r.ref?' · '+esc(r.ref):''}</td></tr>`:''}
   ${r.dq?`<tr><td>تسليم / Delivered</td><td class="n">${r.dq} pcs</td></tr>`:''}${o?`<tr><td>الإجمالي / Total</td><td class="n">${sar2(o.total)}</td></tr><tr><td>المتبقي / Balance</td><td class="n b">${sar2(o.total-o.paid)}</td></tr>`:''}</table></body></html>`);
  w.document.close();setTimeout(()=>w.print(),300);
}

/* ================= Workers ================= */
const payLabel=w=>w.pay==='piece'?`${w.rate} SAR per thobe`:w.pay==='target'?`${sar(w.basic)} basic + ${w.comm} SAR/pc over ${w.target}`:`${sar(w.rate)} SAR monthly`;
function targetBar(w,s){if(w.pay!=='target')return '';const p=Math.min(100,s.doneQ/w.target*100);const hit=s.doneQ>=w.target;
  return `<div><div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px"><span class="muted">Target ${w.target} pcs</span><span class="num" style="color:${hit?'var(--ok)':'var(--muted)'};font-weight:600">${s.doneQ}/${w.target}${hit?` · +${s.extra} extra`:''}</span></div><div class="load" style="width:100%"><i style="width:${p}%;${hit?'background:var(--ok)':''}"></i></div></div>`}
function wStats(w){
  const os=orders.filter(o=>o.tailor===w.id);const k=ROLE2TASK[w.role];const act=k&&k!=='sew'?myJobs(w):os.filter(o=>o.st==='cut'||o.st==='sew');
  const month=os.filter(o=>(o.st==='done'||o.st==='ready')&&o.created.getMonth()===today.getMonth());
  const doneQ=LIVE?prodLog.filter(p=>p.w===w.id&&p.stage==='sew'&&p.d.getMonth()===today.getMonth()&&p.d.getFullYear()===today.getFullYear()).reduce((s,p)=>s+p.qty,0):(w.mdone||0)+month.reduce((s,o)=>s+o.qty,0);
  const extra=w.pay==='target'?Math.max(0,doneQ-w.target):0;
  const earn=w.pay==='piece'?doneQ*w.rate:w.pay==='target'?w.basic+extra*w.comm:w.rate;
  return{act:act.reduce((s,o)=>s+o.qty,0),late:act.filter(late).length,doneQ,extra,earn,absent:w.att.filter(a=>a==='a').length};
}
function workersView(){
  const q=document.getElementById('q').value.trim().toLowerCase();
  const all=W();const list=all.filter(w=>(workerRole==='all'?true:workerRole==='off'?!okW(w):w.role===workerRole)&&(!q||w.name.toLowerCase().includes(q)||w.phone.includes(q)));
  const exp=all.filter(w=>{const d=iqDays(w);return d!==null&&d<60}).length;
  const chip=(k,t,n)=>`<button class="chip ${workerRole===k?'on':''}" data-role="${k}">${t}<span class="num">${n}</span></button>`;
  V(`${demoNote}
  <div class="kpis">
   <div class="kpi"><span class="l">Workers</span><span class="v">${all.length}</span><span class="d muted">${curBranch?bname(curBranch)+' branch':'Across '+pl(BRANCHES.length,'branch').replace('branchs','branches')}</span></div>
   <div class="kpi"><span class="l">Tailors working today</span><span class="v">${all.filter(w=>w.role==='Tailor'&&w.status==='active'&&w.att[13]!=='a').length}</span><span class="d muted">${all.filter(w=>w.status==='leave').length} on leave</span></div>
   <div class="kpi"><span class="l">Thobes in hand</span><span class="v">${all.reduce((s,w)=>s+wStats(w).act,0)}</span><span class="d muted">Being cut, stitched or ironed</span></div>
   <div class="kpi"><span class="l">Iqama renewals due</span><span class="v" style="color:${exp?'var(--warn)':'inherit'}">${exp}</span><span class="d muted">Expired or within 60 days</span></div>
  </div>
  <div class="rowtools"><div class="chips">${chip('all','All',all.length)}${ROLES.filter(r=>WORKSHOP_ROLES.includes(r)||all.some(w=>w.role===r)).map(r=>chip(r,r==='Cutter'?'Cutting':r,all.filter(w=>w.role===r).length)).join('')}${chip('off','Inactive & blocked',all.filter(w=>!okW(w)).length)}</div><span class="sp"></span>${addRoles().length?`<button class="btn pri" id="addW">${ico('plus')}Add ${isFactoryLogin()?'workshop worker':'worker'}</button>`:''}</div>
  ${!isOwner()?`<div class="muted" style="font-size:12.5px">${isFactoryLogin()?'You can add tailors, cutters, hinge, tatreez and ironing workers to this factory. Only the owner can block, deactivate or delete a worker.':'Only the owner or the factory can add workshop workers. Only the owner can block, deactivate or delete.'}</div>`:''}
  <div class="wgrid">${list.map(w=>{const s=wStats(w);return `<button class="wcard" data-w="${w.id}">
    <div class="wtop"><div class="wav">${initials(w.name)}</div><div class="grow"><b>${w.name}</b><span>${w.role} · ${bname(w.branch)}</span></div>${wStatusPill(w)}</div>
    <div class="wstats"><div><span>In hand</span><b>${ROLE2TASK[w.role]?s.act:'—'}</b></div><div><span>Done (month)</span><b>${w.role==='Tailor'?s.doneQ:'—'}</b></div><div><span>${w.pay==='salary'?'Salary':'Pay so far'}</span><b>${sar(s.earn)}</b></div></div>
    ${targetBar(w,s)}
    <div class="att" title="Attendance, last 14 days">${w.att.map(a=>`<i class="${a==='a'?'a':a==='o'?'o':''}"></i>`).join('')}</div>
    <div class="wfoot"><span>${payLabel(w)}</span>${iqPill(w)}</div>
   </button>`}).join('')||'<div class="empty">No workers match.</div>'}</div>
  <div class="panel" id="bwPanel"></div>`);
  document.querySelectorAll('[data-role]').forEach(b=>b.onclick=()=>{workerRole=b.dataset.role;workersView()});
  document.querySelectorAll('[data-w]').forEach(b=>b.onclick=()=>openWorker(+b.dataset.w));
  const aw=document.getElementById('addW');if(aw)aw.onclick=()=>workerForm();
  bwMount();
}
function openWorker(id){
  const w=wk(id),s=wStats(w),os=orders.filter(o=>o.tailor===w.id&&o.st!=='done');
  const close=drawer(w.name,`<div class="muted" style="font-size:13px">${w.role} · ${bname(w.branch)} branch</div>`,
   `<div style="display:flex;gap:8px;flex-wrap:wrap">${wStatusPill(w)||'<span class="pill s-ready">Active</span>'}${iqPill(w)}</div>
    <div class="kv"><div><span>Mobile</span><b style="font-size:13px">${w.phone}</b></div><div><span>Nationality</span><b style="font-family:var(--f-body);font-size:13px">${w.nat}</b></div><div><span>Joined</span><b style="font-size:13px">${fmtY(w.joined)}</b></div>
     <div><span>Pay type</span><b style="font-family:var(--f-body);font-size:13px">${w.pay==='piece'?'Per thobe':w.pay==='target'?'Basic + target':'Monthly salary'}</b></div><div><span>This month</span><b>${sar(s.earn)}</b></div><div><span>Iqama expiry</span><b style="font-size:13px">${w.iqama?fmtY(w.iqama):'—'}</b></div></div>
    ${w.pay==='target'?`<div><p class="h4">Pay this month</p>${targetBar(w,s)}<div class="slip" style="position:static;margin-top:10px"><dl>
      <div><dt>Basic salary</dt><dd class="num">${sar(w.basic)} SAR</dd></div>
      <div><dt>Pieces finished</dt><dd class="num">${s.doneQ} pcs</dd></div>
      <div><dt>Target</dt><dd class="num">${w.target} pcs</dd></div>
      <div><dt>Extra pieces × commission</dt><dd class="num">${s.extra} × ${w.comm} = ${sar(s.extra*w.comm)} SAR</dd></div></dl>
      <div class="tot"><div class="big"><span>Total</span><span class="num">${sar(s.earn)} SAR</span></div></div></div></div>`:''}
    ${canDed(w)?(()=>{const mp=monthPay(w,ymKey(today));return `<div><p class="h4">Deductions · ${ymName(ymKey(today))} <span class="muted" style="font-weight:500">(${sar(mp.dedT)} SAR · net pay ${sar(mp.net)} SAR)</span></p>
      <div class="rows" style="border:1px solid var(--line);border-radius:8px">${mp.ded.map(x=>`<div class="row" style="padding-block:8px"><div class="grow"><b>${esc(x.reason||'Deduction')}</b><span>${fmtD(x.d)}${x.by?' · '+esc(x.by):''}</span></div><span class="num" style="color:var(--bad);font-weight:600">− ${sar(x.amt)}</span>${isOwner()?`<button class="btn sm" data-dedx="${dedLog.indexOf(x)}" aria-label="Remove">${ico('x')}</button>`:''}</div>`).join('')||'<div class="empty" style="padding:12px">No deductions this month.</div>'}</div>
      <div class="fgrid" style="margin-top:8px;grid-template-columns:120px 1fr 1fr auto;align-items:end"><div class="field"><label for="dAmt">Amount</label><input id="dAmt" type="number" min="1" class="num"></div><div class="field"><label for="dWhy">Reason</label><input id="dWhy" placeholder="Advance, absent, damage…"></div><div class="field"><label for="dDay">Date</label><input id="dDay" type="date" value="${dkey2(today)}"></div><button class="btn" id="dAdd">Add</button></div></div>`})():''}
    ${(isOwner()||managesW(w))&&okW(w)?`<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><b style="font-size:13.5px">Today</b>${w.att[13]==='a'?'<span class="pill s-late">Absent</span>':'<span class="pill s-ready">Present</span>'}<button class="btn sm" id="attW">${w.att[13]==='a'?'Mark present':'Mark absent'}</button></div>`:''}
    <div><p class="h4">Attendance · last 14 days <span class="muted" style="font-weight:500">(${s.absent} absent)</span></p><div class="att">${w.att.map(a=>`<i class="${a==='a'?'a':a==='o'?'o':''}"></i>`).join('')}</div><p class="muted" style="font-size:11.5px;margin:6px 0 0">Green present · red absent · grey Friday</p></div>
    ${ROLE2TASK[w.role]?'<div id="wwSec"></div>':''}
    ${w.role==='Tailor'?`<div><p class="h4">Current work (${pl(s.act,'thobe')})</p><div class="rows" style="border:1px solid var(--line);border-radius:8px">${os.map(o=>`<div class="row" data-r="${o.rno}" style="cursor:pointer"><span class="rid">${ono(o)}</span><div class="grow"><b>${cust(o.cid).name}</b><span>${pl(o.qty,'thobe')} · due ${fmtD(o.due)}</span></div>${pill(o)}</div>`).join('')||'<div class="empty">Nothing assigned.</div>'}</div></div>`:''}`,
   `${canEditW(w)?`<button class="btn pri" id="editW">Edit</button>`:''}${canEditW(w)||isOwner()?`<button class="btn" id="appW">App link</button>`:''}${(canEditW(w)||ROLE==='manager')&&okW(w)?`<button class="btn" id="leaveW">${w.status==='leave'?'Mark as back':'Mark on leave'}</button>`:''}
    ${isOwner()?`<button class="btn" id="actW">${w.status==='inactive'?'Activate':'Deactivate'}</button><button class="btn" id="blkW" style="color:var(--bad)">${w.status==='blocked'?'Unblock':'Block'}</button><button class="btn" id="delW" style="color:var(--bad);border-color:var(--bad)">Delete</button>`:'<span class="muted" style="font-size:12px;align-self:center">Block, deactivate and delete: owner only</span>'}`);
  const $=x=>document.getElementById(x);
  wwMount(w);
  if($('editW'))$('editW').onclick=()=>workerForm(w);
  if($('attW'))$('attW').onclick=async()=>{const v=w.att[13]==='a'?'p':'a';if(LIVE){await setAtt(w,v)}w.att[13]=v;toast(`${w.name}: ${v==='a'?'absent':'present'} today`);route();openWorker(id)};
  if($('dAdd'))$('dAdd').onclick=()=>{const a=+$('dAmt').value||0,why=$('dWhy').value.trim();if(a<=0){toast('Enter the amount');return}if(!why){toast('Write the reason');return}
    dedLog.push({sid:w.id,branch:w.branch,d:new Date(($('dDay').value||dkey2(today))+'T00:00:00'),amt:a,reason:why,by:USER.name||'Owner'});toast(`${sar(a)} SAR deducted from ${w.name}`);openWorker(id)};
  document.querySelectorAll('[data-dedx]').forEach(b=>b.onclick=()=>{const x=dedLog[+b.dataset.dedx];if(!x)return;dedLog.splice(+b.dataset.dedx,1);toast(`Deduction removed (${sar(x.amt)} SAR)`);openWorker(id)});
  if($('appW'))$('appW').onclick=()=>workerApp(w);
  if($('leaveW'))$('leaveW').onclick=()=>{w.status=w.status==='leave'?'active':'leave';toast(`${w.name}: ${w.status==='leave'?'on leave':'back at work'}`);route();openWorker(id)};
  if($('actW'))$('actW').onclick=()=>{w.status=w.status==='inactive'?'active':'inactive';toast(`${w.name} ${w.status==='inactive'?'deactivated: no new work, login off':'activated'}`);route();openWorker(id)};
  if($('blkW'))$('blkW').onclick=()=>{w.status=w.status==='blocked'?'active':'blocked';toast(`${w.name} ${w.status==='blocked'?'blocked: his app stops working':'unblocked'}`);route();openWorker(id)};
  if($('delW'))$('delW').onclick=()=>{const busy=orders.filter(o=>o.st!=='done'&&(o.tailor===w.id||Object.values(o.tw||{}).includes(w.id))&&TASKS.some(t=>pending(o,t.k)&&(t.k==='sew'?o.tailor===w.id:o.tw[t.k]===w.id)));
    const df=document.querySelector('.drawer .df');df.innerHTML=busy.length?`<div class="msg" style="border-color:var(--bad);flex:1">${w.name} still has ${pl(busy.length,'job')} open. Move them to someone else or deactivate him instead.</div><button class="btn" id="delNo">OK</button>`
      :`<span style="flex:1;align-self:center"><b>Delete ${esc(w.name)}?</b> This removes the worker, his login and his app. It cannot be undone.</span><button class="btn" id="delYes" style="background:var(--bad);color:#fff;border-color:var(--bad)">Delete</button><button class="btn" id="delNo">Cancel</button>`;
    $('delNo').onclick=()=>openWorker(id);if($('delYes'))$('delYes').onclick=()=>{workers.splice(workers.indexOf(w),1);for(let i=USERS.length-1;i>=0;i--)if(USERS[i].name===w.name)USERS.splice(i,1);document.getElementById('layer').innerHTML='';toast(`${w.name} deleted`);route()}};
  document.querySelectorAll('.drawer [data-r]').forEach(r=>r.onclick=()=>openOrder(+r.dataset.r));
}
function workerForm(w){
  const e=w||{name:'',role:addRoles()[0]||'Tailor',branch:isOwner()?(curBranch||1):USER.branch,phone:'',nat:'Pakistan',pay:'target',rate:25,basic:1500,target:60,comm:15,iqama:addD(today,365),joined:today};
  const close=drawer(w?'Edit worker':'Add worker',`<div class="muted" style="font-size:13px">${w?w.role+' · '+bname(w.branch):'New staff member'}</div>`,
   `<div class="fgrid" style="grid-template-columns:repeat(2,minmax(0,1fr))">
     <div class="field" style="grid-column:1/-1"><label for="wName">Full name</label><input id="wName" value="${esc(e.name)}" placeholder="e.g. Imran Ali"></div>
     <div class="field"><label for="wRole">Role</label><select id="wRole">${[...new Set([...(w?[w.role]:[]),...addRoles()])].map(r=>`<option ${r===e.role?'selected':''}>${r}</option>`).join('')}</select></div>
     <div class="field"><label for="wBranch">Branch</label><select id="wBranch">${(isOwner()?BRANCHES:BRANCHES.filter(b=>b.id===USER.branch)).map(b=>`<option value="${b.id}" ${b.id===e.branch?'selected':''}>${b.name}</option>`).join('')}</select></div>
     <div class="field"><label for="wPhone">Mobile</label><input id="wPhone" class="num" value="${esc(e.phone)}" placeholder="05xxxxxxxx"></div>
     <div class="field"><label for="wNat">Nationality</label><input id="wNat" value="${esc(e.nat)}"></div>
     <div class="field"><label for="wPay">Pay type</label><select id="wPay"><option value="piece" ${e.pay==='piece'?'selected':''}>Per thobe</option><option value="salary" ${e.pay==='salary'?'selected':''}>Monthly salary</option><option value="target" ${e.pay==='target'?'selected':''}>Basic salary + target + commission</option></select></div>
     <div class="field" id="fRate"><label for="wRate" id="wRateL">Rate (SAR)</label><input id="wRate" type="number" class="num" value="${e.rate}"></div>
     <div class="field" data-t><label for="wBasic">Basic salary (SAR / month)</label><input id="wBasic" type="number" class="num" value="${e.basic}"></div>
     <div class="field" data-t><label for="wTarget">Monthly target (pcs)</label><input id="wTarget" type="number" class="num" value="${e.target}"></div>
     <div class="field" data-t><label for="wComm">Extra commission (SAR per pc over target)</label><input id="wComm" type="number" class="num" value="${e.comm}"></div>
     <div class="field" data-t style="grid-column:1/-1"><div class="msg" id="wEx" style="border-color:var(--brass)"></div></div>
     <div class="field"><label for="wJoin">Joining date</label><input id="wJoin" type="date" value="${e.joined.toISOString().slice(0,10)}"></div>
     <div class="field"><label for="wIq">Iqama expiry</label><input id="wIq" type="date" value="${e.iqama?e.iqama.toISOString().slice(0,10):''}"></div>
    </div>`,
   `<button class="btn pri" id="wSave">${w?'Save changes':'Add worker'}</button>`);
  const $=id=>document.getElementById(id);
  const sync=()=>{const p=$('wPay').value,t=p==='target';$('fRate').hidden=t;document.querySelectorAll('[data-t]').forEach(x=>x.hidden=!t);
    $('wRateL').textContent=p==='piece'?'Rate per thobe (SAR)':'Monthly salary (SAR)';
    if(t){const b=+$('wBasic').value||0,tg=+$('wTarget').value||0,c=+$('wComm').value||0,ex=tg+10;
      $('wEx').innerHTML=`<b>Example:</b> if he finishes <b class="num">${ex}</b> pcs this month<br><span class="num">${sar(b)} + (${ex} − ${tg}) × ${c} = <b>${sar(b+10*c)} SAR</b></span><br><span class="muted" style="font-size:12px">Below ${tg} pcs he gets the basic salary only.</span>`}};
  ['wPay','wBasic','wTarget','wComm'].forEach(id=>$(id).oninput=sync);$('wPay').onchange=sync;sync();
  $('wSave').onclick=async()=>{const n=$('wName').value.trim();if(!n){toast('Enter the worker\'s name');$('wName').focus();return}
    const t=w||{id:Math.max(0,...workers.filter(x=>!x.exeEmp&&x.id<100000).map(x=>x.id))+1,status:'active',mdone:0,att:Array.from({length:14},(_,k)=>addD(today,k-13).getDay()===5?'o':'p')};
    Object.assign(t,{name:n,role:$('wRole').value,branch:+$('wBranch').value,phone:$('wPhone').value.trim(),nat:$('wNat').value.trim(),pay:$('wPay').value,rate:+$('wRate').value||0,basic:+$('wBasic').value||0,target:+$('wTarget').value||0,comm:+$('wComm').value||0,joined:new Date($('wJoin').value||today),iqama:$('wIq').value?new Date($('wIq').value):null});
    if(!w){if(LIVE){const sb=$('wSave');sb.disabled=true;sb.textContent='Creating login…';try{t.login=jobLogin(t.role);await createStaff(t);if(!workers.some(x=>x.id===t.id))workers.push(t)}catch(e){sb.disabled=false;sb.textContent='Add worker';toast('Could not add: '+(e.code||e.message));return}}else workers.push(t)}close();toast(w?'Changes saved':`${n} added to ${bname(t.branch)}`);if((location.hash||'').slice(1)!=='workers')location.hash='workers';else route();if(!w)workerApp(t,true)};
}

/* ================= Daily report ================= */
let repDay=0; // days back from today
const sameDay=(a,b)=>+new Date(a.getFullYear(),a.getMonth(),a.getDate())===+b;
function daily(){
  const D=addD(today,-repDay);const money=RA().money;
  const scope=curBranch?[BRANCHES.find(b=>b.id===curBranch)]:BRANCHES;
  const shops=scope.filter(b=>b.type!=='factory'),shopIds=shops.map(b=>b.id);
  const shopsOnly=ROLE!=='tailor'&&shops.length>0;
  const pay=payLog.filter(p=>sameDay(p.d,D)&&shopIds.includes(p.branch));
  const dels=delLog.filter(p=>sameDay(p.d,D)&&shopIds.includes(p.branch));
  const booked=orders.filter(o=>sameDay(o.created,D)&&shopIds.includes(o.branch));
  const shopRow=b=>{const bo=booked.filter(o=>o.branch===b.id),bp=pay.filter(p=>p.branch===b.id),bd=dels.filter(p=>p.branch===b.id);
    const dep=bp.filter(p=>p.t==='Deposit').reduce((s,p)=>s+p.amt,0),bal=bp.filter(p=>p.t==='Balance').reduce((s,p)=>s+p.amt,0);const m=k=>bp.filter(p=>p.m===k).reduce((s,p)=>s+p.amt,0);
    return{b,n:bo.length,pcs:bo.reduce((s,o)=>s+o.qty,0),sale:bo.reduce((s,o)=>s+o.total,0),dep,bal,tot:dep+bal,cash:m('Cash'),mada:m('Card (mada)'),tr:m('Transfer'),dn:bd.length,dq:bd.reduce((s,p)=>s+p.qty,0)}};
  const rows=shops.map(shopRow);const T=k=>rows.reduce((s,r)=>s+r[k],0);
  // tailoring
  const wsIds=curBranch?[curBranch]:BRANCHES.map(b=>b.id);
  const prod=prodLog.filter(p=>sameDay(p.d,D)&&wsIds.includes(p.made));
  const ps=(arr,st)=>arr.filter(p=>p.stage===st).reduce((s,p)=>s+p.qty,0);
  const shopsIn=ROLE==='tailor'?BRANCHES.filter(b=>b.id===curBranch):scope;
  const tailors=workers.filter(w=>wsIds.includes(w.branch)&&WORKSHOP_ROLES.includes(w.role));
  const k=repDay;const attOf=w=>k<14?w.att[13-k]:'p';
  const isFri=D.getDay()===5;
  const sentToFac=orders.filter(o=>sameDay(o.created,D)&&isFac(o.made)&&(wsIds.includes(o.made)||shopIds.includes(o.branch)));
  const dayLabel=repDay===0?'Today':repDay===1?'Yesterday':D.toLocaleDateString('en-GB',{weekday:'long'});
  const summaryText=()=>{let t=`*Saudi Thobe daily report*\n${D.toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'short',year:'numeric'})} · ${curBranch?bname(curBranch):'All branches'}\n`;
    if(shopsOnly&&money){t+=`\nSales booked: ${sar(T('sale'))} SAR (${T('n')} orders, ${T('pcs')} pcs)\nCollected: ${sar(T('tot'))} SAR\n  Deposits ${sar(T('dep'))} · Delivery payments ${sar(T('bal'))}\n  Cash ${sar(T('cash'))} · mada ${sar(T('mada'))} · Transfer ${sar(T('tr'))}\nDelivered: ${T('dn')} orders, ${T('dq')} pcs\n`;
      rows.forEach(r=>t+=`\n${r.b.name}: sale ${sar(r.sale)} · collected ${sar(r.tot)} · delivered ${r.dq} pcs`)}
    t+=`\n\nTailoring: cut ${ps(prod,'cut')} · stitched ${ps(prod,'sew')} · hinge ${ps(prod,'hinge')} · tatreez ${ps(prod,'tat')}${ironOn()?` · ironed ${ps(prod,'iron')}`:''} pcs`;
    shopsIn.forEach(b=>{const pp=prod.filter(p=>p.made===b.id);if(pp.length)t+=`\n${b.name}: stitched ${ps(pp,'sew')} pcs`});return t};
  V(`<div class="rowtools"><div class="chips">${[0,1,2,3,4,5,6].map(i=>{const d=addD(today,-i);return `<button class="chip ${repDay===i?'on':''}" data-day="${i}">${i===0?'Today':i===1?'Yesterday':d.toLocaleDateString('en-GB',{weekday:'short',day:'numeric'})}</button>`}).join('')}</div><span class="sp"></span>
   <button class="btn" id="copyRep">${ico('wa')}Copy for WhatsApp</button></div>
  <div class="demo">${DEMO?'<span class="tag">Demo data</span> ':''}${dayLabel}, ${D.toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'})} · ${curBranch?bname(curBranch)+(isFac(curBranch)?'':' branch'):'all branches and factories'}${isFri?' · Friday, shop closed':''}</div>
  ${shopsOnly&&money?`<div class="kpis">
    <div class="kpi"><span class="l">Total sale (orders booked)</span><span class="v">${sar(T('sale'))}<small>SAR</small></span><span class="d muted">${pl(T('n'),'order')} · ${T('pcs')} thobes</span></div>
    <div class="kpi"><span class="l">Payments received</span><span class="v">${sar(T('tot'))}<small>SAR</small></span><span class="d muted">Deposits ${sar(T('dep'))} · Delivery ${sar(T('bal'))}</span></div>
    <div class="kpi"><span class="l">Delivered to customers</span><span class="v">${T('dq')}<small>pcs</small></span><span class="d muted">${pl(T('dn'),'order')} handed over</span></div>
    <div class="kpi"><span class="l">Thobes stitched</span><span class="v">${ps(prod,'sew')}<small>pcs</small></span><span class="d muted">Cut ${ps(prod,'cut')} · Hinge ${ps(prod,'hinge')} · Tatreez ${ps(prod,'tat')}</span></div></div>
  <div class="panel"><div class="panel-h"><h2>Sales & payments by branch</h2><span class="sp"></span><span class="muted" style="font-size:12px">SAR</span></div><div class="tbl-wrap"><table>
   <thead><tr><th>Branch</th><th>New orders</th><th>Thobes</th><th>Total sale</th><th>Deposits</th><th>Delivery payments</th><th>Total received</th><th>Cash</th><th>mada</th><th>Transfer</th><th>Delivered</th></tr></thead>
   <tbody>${rows.map(r=>`<tr><td>${bTag(r.b.id)} <b>${r.b.name}</b></td><td class="num">${r.n}</td><td class="num">${r.pcs}</td><td class="num"><b>${sar(r.sale)}</b></td><td class="num">${sar(r.dep)}</td><td class="num">${sar(r.bal)}</td><td class="num"><b>${sar(r.tot)}</b></td><td class="num">${sar(r.cash)}</td><td class="num">${sar(r.mada)}</td><td class="num">${sar(r.tr)}</td><td class="num">${r.dq} pcs · ${r.dn}</td></tr>`).join('')}
   ${rows.length>1?`<tr style="background:var(--ground)"><td><b>Total</b></td><td class="num"><b>${T('n')}</b></td><td class="num"><b>${T('pcs')}</b></td><td class="num"><b>${sar(T('sale'))}</b></td><td class="num"><b>${sar(T('dep'))}</b></td><td class="num"><b>${sar(T('bal'))}</b></td><td class="num"><b>${sar(T('tot'))}</b></td><td class="num"><b>${sar(T('cash'))}</b></td><td class="num"><b>${sar(T('mada'))}</b></td><td class="num"><b>${sar(T('tr'))}</b></td><td class="num"><b>${T('dq')} pcs · ${T('dn')}</b></td></tr>`:''}</tbody></table></div></div>
  <div class="grid2">
   <div class="panel"><div class="panel-h"><h2>Delivered & paid</h2><span class="sp"></span><span class="muted" style="font-size:12px">${pl(dels.length,'order')}</span></div><div class="tbl-wrap"><table><thead><tr><th>Receipt</th>${shops.length>1?'<th>Branch</th>':''}<th>Thobes</th><th>Paid at delivery</th></tr></thead><tbody>${dels.map(p=>`<tr><td><span class="rid">${onoR(p.rno)}</span></td>${shops.length>1?`<td>${bTag(p.branch)}</td>`:''}<td class="num">${p.qty}</td><td class="num">${p.amt?sar(p.amt):'<span class="muted">already paid</span>'}</td></tr>`).join('')||'<tr><td colspan="4" class="muted">No deliveries.</td></tr>'}</tbody></table></div></div>
   <div class="panel"><div class="panel-h"><h2>New orders booked</h2><span class="sp"></span><span class="muted" style="font-size:12px">${pl(booked.length,'order')}</span></div><div class="tbl-wrap"><table><thead><tr><th>Receipt</th><th>Customer</th><th>Thobes</th><th>Sale</th><th>Deposit</th></tr></thead><tbody>${booked.map(o=>`<tr class="click" data-r="${o.rno}"><td><span class="rid">${ono(o)}</span> ${shops.length>1?bTag(o.branch):''}</td><td>${cust(o.cid).name}</td><td class="num">${o.qty}</td><td class="num">${sar(o.total)}</td><td class="num">${sar(o.paid)}</td></tr>`).join('')||'<tr><td colspan="5" class="muted">No new orders.</td></tr>'}</tbody></table></div></div>
  </div>`:''}
  <h2 style="margin:0;font-size:17px">Tailoring daily report</h2>
  <div class="cards" style="grid-template-columns:repeat(auto-fill,minmax(250px,1fr))">${shopsIn.map(b=>{const pp=prod.filter(p=>p.made===b.id);const ws=tailors.filter(w=>w.branch===b.id);const inProd=orders.filter(o=>o.made===b.id&&(o.st==='cut'||o.st==='sew')).reduce((s,o)=>s+o.qty,0);
    const recv=isFac(b.id)?sentToFac.filter(o=>o.made===b.id).reduce((s,o)=>s+o.qty,0):null;
    return `<div class="bcard"><div class="bh" ${isFac(b.id)?'style="background:var(--ink-2)"':''}><div style="flex:1"><span class="code">${b.code}</span>${isFac(b.id)?' <span class="code" style="border-color:#8a8576;color:#cfc9b8">Factory</span>':''}<h3 style="margin-top:8px">${b.name}${isFac(b.id)?'':' workshop'}</h3><p>${ws.filter(w=>attOf(w)!=='a').length} of ${ws.length} workers present</p></div></div>
     <div class="bs"><div><span>Cut</span><b>${ps(pp,'cut')}</b></div><div><span>Stitched</span><b>${ps(pp,'sew')}</b></div>${ironOn()?`<div><span>Ironed</span><b>${ps(pp,'iron')}</b></div>`:`<div><span>Hinge</span><b>${ps(pp,'hinge')}</b></div>`}</div>
     <div class="bs"><div><span>Hinge</span><b>${ps(pp,'hinge')}</b></div><div><span>Tatreez</span><b>${ps(pp,'tat')}</b></div><div><span>Ready</span><b>${ps(pp,'sew')}</b></div></div>
     <div class="bm"><div><span class="muted">Still in production</span><span class="num">${inProd} pcs</span></div>${recv!==null?`<div><span class="muted">Received from shops</span><span class="num">${recv} pcs</span></div>${SHOPS().map(s=>{const q=sentToFac.filter(o=>o.made===b.id&&o.branch===s.id).reduce((a,o)=>a+o.qty,0);return q?`<div><span class="muted">· ${s.name}</span><span class="num">${q} pcs</span></div>`:''}).join('')}`:''}</div></div>`}).join('')}</div>
  <div class="panel"><div class="panel-h"><h2>Each worker today</h2><span class="sp"></span><span class="muted" style="font-size:12px">Pieces done ${dayLabel.toLowerCase()} · month to date</span></div><div class="tbl-wrap"><table>
   <thead><tr><th>Worker</th><th>Workshop</th><th>Job</th><th>Attendance</th><th>Pieces</th><th>Month so far</th><th>Target</th>${money?'<th>Earned today</th>':''}</tr></thead>
   <tbody>${tailors.map(w=>{const mine=prod.filter(p=>p.w===w.id);const q=mine.reduce((s,p)=>s+p.qty,0);const st=wStats(w);const a=attOf(w);
     const month=w.role==='Tailor'?st.doneQ:prodLog.filter(p=>p.w===w.id&&p.d.getMonth()===D.getMonth()).reduce((s,p)=>s+p.qty,0);
     const earnToday=w.role!=='Tailor'?null:w.pay==='piece'?q*w.rate:w.pay==='target'?(month>=w.target?Math.min(q,month-w.target)*w.comm:0):null;
     return `<tr><td><b>${w.name}</b></td><td>${bTag(w.branch)} ${bname(w.branch)}</td><td>${w.role}</td><td>${isFri?'<span class="pill s-done">Friday</span>':a==='a'?'<span class="pill s-late">Absent</span>':w.status==='leave'?'<span class="pill s-cut">Leave</span>':'<span class="pill s-ready">Present</span>'}</td>
      <td class="num"><b>${q}</b> ${{Tailor:'stitched',Cutter:'cut',Ironing:'ironed',Hinge:'hinge',Tatreez:'tatreez','Bottom cutting':'bottom cut'}[w.role]}</td><td class="num">${month}</td>
      <td>${w.role==='Tailor'&&w.pay==='target'?`<div style="display:flex;gap:8px;align-items:center"><div class="load" style="width:70px"><i style="width:${Math.min(100,month/w.target*100)}%;${month>=w.target?'background:var(--ok)':''}"></i></div><span class="num" style="font-size:12px">${month}/${w.target}</span></div>`:'<span class="muted">—</span>'}</td>
      ${money?`<td class="num">${earnToday===null?'<span class="muted">salary</span>':sar(earnToday)}</td>`:''}</tr>`}).join('')||'<tr><td colspan="8" class="muted">No workshop staff here.</td></tr>'}</tbody></table></div></div>`);
  document.querySelectorAll('[data-day]').forEach(b=>b.onclick=()=>{repDay=+b.dataset.day;daily()});
  document.getElementById('copyRep').onclick=()=>{const t=summaryText();navigator.clipboard.writeText(t).then(()=>toast('Report copied, paste it in WhatsApp'),()=>toast('Copy blocked here; report text is ready on the real site'))};
  bindRows();
}

/* ================= Cashier desk ================= */
function till(){
  const b=curBranch||1;const mine=orders.filter(o=>o.branch===b);
  const ready=mine.filter(o=>o.st==='ready').sort((x,y)=>(y.total-y.paid)-(x.total-x.paid));
  const unpaidNew=mine.filter(o=>o.st!=='ready'&&o.st!=='done'&&o.paid===0);
  const log=payLog.filter(p=>p.branch===b&&+p.d===+today);
  const by=m=>log.filter(p=>p.m===m).reduce((s,p)=>s+p.amt,0);
  V(`<div class="till"><div class="sec">
   <label class="bigsearch">${ico('orders')}<input id="tq" placeholder="Receipt no. or mobile, e.g. 1252 or 05…" autocomplete="off"></label>
   <div id="tres"></div>
   <div class="panel"><div class="panel-h"><h2>Ready for pickup</h2><span class="sp"></span><span class="muted" style="font-size:12px">Collect the balance and hand over</span></div>
    <div class="rows">${ready.map(o=>{const rem=o.total-o.paid;return `<div class="row tpay" data-pay="${o.rno}" tabindex="0" style="cursor:pointer" title="Receive payment / deliver"><span class="rid">${ono(o)}</span><div class="grow"><b dir="auto">${esc(cust(o.cid).name)}</b><span class="num">${cust(o.cid).phone} · ${pl(o.qty,'thobe')}</span></div>
     <span class="num" style="font-weight:700;color:${rem>0.5?'var(--bad)':'var(--ok)'}">${rem>0.5?sar(rem)+' SAR':'Paid'}</span><span class="muted" aria-hidden="true">›</span></div>`}).join('')||'<div class="empty">No thobes waiting for pickup.</div>'}</div></div>
   ${unpaidNew.length?`<div class="panel"><div class="panel-h"><h2>New orders waiting for deposit</h2><span class="sp"></span><span class="muted" style="font-size:12px">Sent by measurement</span></div><div class="rows">${unpaidNew.map(o=>`<div class="row"><span class="rid">${ono(o)}</span><div class="grow"><b>${cust(o.cid).name}</b><span>${pl(o.qty,'thobe')} · ${o.fabric}</span></div><input class="num" style="width:80px;border:1px solid var(--line);border-radius:7px;padding:6px;background:var(--ground)" id="dep${o.rno}" value="${Math.round(o.total/2)}" aria-label="Deposit"><button class="btn sm pri" data-dep="${o.rno}">Take deposit</button></div>`).join('')}</div></div>`:''}
  </div>
  <aside class="sec">
   <div class="panel"><div class="panel-h"><h2>Today's cash box</h2><span class="sp"></span><span class="muted" style="font-size:12px">${bname(b)}</span></div>
    <div class="cashbox"><div><span>Cash</span><span class="num">${sar(by('Cash'))}</span></div><div><span>Card (mada)</span><span class="num">${sar(by('Card (mada)'))}</span></div><div><span>Bank transfer</span><span class="num">${sar(by('Transfer'))}</span></div><div><span>Total today</span><span class="num">${sar(log.reduce((s,p)=>s+p.amt,0))} SAR</span></div></div></div>
   <div class="panel"><div class="panel-h"><h2>Today's receipts</h2></div><div class="rows">${log.slice().reverse().map(p=>`<div class="row" style="padding-block:8px"><span class="rid">${onoR(p.rno)}</span><div class="grow"><b style="font-weight:500">${p.t}</b><span>${p.m}</span></div><span class="num">${sar(p.amt)}</span></div>`).join('')||'<div class="empty">No payments yet today.</div>'}</div></div>
   <button class="btn" id="closeDay">Close the day</button>
  </aside></div>`);
  const tq=document.getElementById('tq');
  tq.oninput=()=>{const q=tq.value.trim();const res=document.getElementById('tres');if(q.length<2){res.innerHTML='';return}
    const f=mine.filter(o=>String(o.rno).includes(q)||(o.bno||'').toLowerCase().includes(q.toLowerCase())||ordMatch(o,q)||cust(o.cid).phone.includes(q)).slice(0,5);
    res.innerHTML=`<div class="panel"><div class="rows">${f.map(o=>`<div class="row" data-pay="${o.rno}" style="cursor:pointer"><span class="rid">${ono(o)}</span><div class="grow"><b>${cust(o.cid).name}</b><span>${pl(o.qty,'thobe')} · balance ${sar(o.total-o.paid)} SAR</span></div>${pill(o)}</div>`).join('')||'<div class="empty">No receipt found in this branch.</div>'}</div></div>`;
    res.querySelectorAll('[data-pay]').forEach(x=>x.onclick=()=>{const o=orders.find(y=>y.rno===+x.dataset.pay);receivePayment(o.rno,o.st==='ready')})};
  // a ready order: the payment / delivery window (as the exe's) – balance and all pieces filled in
  document.querySelectorAll('[data-pay]').forEach(x=>{x.onclick=()=>receivePayment(+x.dataset.pay,true);x.onkeydown=e=>{if(e.key==='Enter')x.click()}});
  document.querySelectorAll('[data-dep]').forEach(x=>x.onclick=()=>{const o=orders.find(y=>y.rno===+x.dataset.dep);const a=+document.getElementById('dep'+o.rno).value||0;if(!a){toast('Enter the deposit amount');return}o.paid=Math.min(o.total,a);payLog.push({d:today,rno:o.rno,branch:o.branch,amt:o.paid,m:'Cash',t:'Deposit'});toast(`Deposit ${sar(o.paid)} SAR taken for ${ono(o)}`);route()});
  document.getElementById('closeDay').onclick=()=>toast(DEMO?'Demo: the day total will be locked and sent to the owner':'Day closed. The owner can see it in the daily report');
  document.querySelectorAll('.rid[data-r]').forEach(r=>r.onclick=()=>openOrder(+r.dataset.r));
}

/* ================= Tailor: My work ================= */
const ME=()=>(LIVE&&workers.find(w=>w.id===USER.sid))||workers.find(w=>w.name===USER.name)||workers.find(w=>w.role==='Tailor'&&w.branch===USER.branch)||workers.find(w=>w.role==='Tailor');
function mmLine(o){const c=cust(o.cid),p=c.profiles[o.profile]||c.profiles[0];return MEAS.filter(([k])=>mVal(p.m,k)!=='').slice(0,4).map(([k,t])=>`<span dir="rtl">${esc(t)}</span> ${esc(mVal(p.m,k))}`).join(' ')||'<span>No measurement yet</span>'}
function myJobs(w){const k=ROLE2TASK[w.role];if(!k)return[];
  return orders.filter(o=>(pending(o,k)||(k==='sew'&&atTailor(o)))&&(k==='sew'?(o.tailor===w.id||(!workers.some(x=>x.id===o.tailor)&&o.made===w.branch)):(o.made===w.branch&&(!o.tw[k]||o.tw[k]===w.id)))).concat(k==='hinge'?hingeBack(w):[]).sort((a,b)=>a.due-b.due)}
/* tailor's card after stitching: send for hinge / tatreez / bottom cutting, see where it is, then Ready */
function tailorBack(o){const ts=TASKS.filter(t=>t.m==='send'&&needs(o,t.k));
  const parts=ts.map(t=>{const v=tv(o,t.k);return v==='done'?`<span class="pill s-ready">${t.t} done</span>`:v==='doing'?`<span class="pill s-cut">At ${t.t.toLowerCase()}</span>`:isSent(o,t.k)?`<span class="pill s-wait">Sent for ${t.t.toLowerCase()}</span>`:canSend(o,t.k)?`<button class="btn pri" data-send="${o.rno}" data-k="${t.k}">Send for ${t.t.toLowerCase()}</button>`:`<span class="pill s-wait">${t.t}: after hinge</span>`});
  const done=allStepsDone(o);
  return parts.join('')+(FLOW_OPT.tready?`<button class="btn ${done?'pri':''}" data-rdy="${o.rno}" ${done?'':'disabled title="Waiting for the other steps"'} style="${done?'background:var(--ok);border-color:var(--ok)':''}">✓ Ready</button>`:'')}
function mywork(){
  const w=ROLE==='tailor'?ME():(workers.find(x=>x.role==='Tailor'&&x.branch===(curBranch||4))||ME());
  if(!w){V('<div class="panel"><div class="empty">Loading your work…</div></div>');return}
  const k=ROLE2TASK[w.role]||'sew';const s=wStats(w);const jobs=myJobs(w);
  V(`<div class="kpis">
    <div class="kpi"><span class="l">Waiting for me</span><span class="v">${jobs.filter(o=>o.t[k]==='wait').reduce((a,o)=>a+o.qty,0)}</span><span class="d muted">${TK[k].t} · ${pl(jobs.length,'job card')}</span></div>
    <div class="kpi"><span class="l">In progress</span><span class="v">${jobs.filter(o=>o.t[k]==='doing').reduce((a,o)=>a+o.qty,0)}</span><span class="d muted">Started, not finished</span></div>
    <div class="kpi"><span class="l">${k==='sew'?'Finished this month':'Done today'}</span><span class="v">${k==='sew'?s.doneQ:prodLog.filter(p=>p.w===w.id&&+p.d===+today).reduce((a,p)=>a+p.qty,0)}<small>pcs</small></span><span class="d ${k==='sew'&&s.doneQ>=w.target?'up':'muted'}">${k==='sew'&&w.pay==='target'?(s.doneQ>=w.target?`Target reached · +${s.extra} extra`:`${w.target-s.doneQ} pcs to target`):w.role}</span></div>
    <a class="kpi" href="#mypay" style="text-decoration:none;color:inherit"><span class="l">My pay this month</span><span class="v">${sar(monthPay(w,ymKey(today)).net)}<small>SAR</small></span><span class="d muted">After deductions · see details ›</span></a></div>
  ${w.pay==='target'&&k==='sew'?`<div class="panel"><div class="panel-b">${targetBar(w,s)}</div></div>`:''}
  <h2 style="margin:0;font-size:17px">My job cards · ${TK[k].t}</h2>
  ${jobs.map(o=>{const c=cust(o.cid),p=c.profiles[o.profile]||c.profiles[0],d=daysLeft(o);return `<div class="jc">
    <div class="jh"><span class="rid" style="font-size:17px">${ono(o)}</span><div style="flex:1;min-width:0"><b>${c.name.split(' ')[0]} · ${pl(o.qty,'thobe')} · ${(BRANCHES.find(b=>b.id===o.branch)||{code:'—'}).code}</b><div class="muted" style="font-size:12.5px">${o.fabric} · ${p.name}${o.hinge?' · Hinge':''}${o.tatreez?' · Tatreez':''}${+o.zipQty?' · Zip':''}${o.note?' · '+esc(o.note):''}</div></div>${k==='sew'&&atTailor(o)?(allStepsDone(o)?'<span class="pill s-ready">Stitched · all done</span>':'<span class="pill s-cut">Stitched</span>'):taskPill(o,k)}<span class="days ${d<0?'late':d<=1?'today':''}">${d<0?`${-d}d late`:d===0?'Due today':`Due in ${d}d`}</span></div>
    <details class="jmore" data-js="${o.rno}"><summary class="btn sm">Measurements & style</summary>${jHas(o.meas)||jHas(p.m)?`<div class="jwrap jro" style="margin-top:10px"></div>${jStylesHtml(jHas(o.meas)?o.meas:p.m)}`:''}<div class="jb"${jHas(o.meas)||jHas(p.m)?' hidden':''}><div><p class="h4">Measurements · ${esc(p.name)}</p>${mShow(p.m)}</div>
     <div><p class="h4">Style</p><div class="dopts" style="padding:0;grid-template-columns:repeat(auto-fill,minmax(96px,1fr))">${DESIGN_.map(g=>{const op=g.opts.find(x=>x[0]===o.design[g.k]);return `<div class="dopt" style="cursor:default">${glyph(g.k,op[0])}<span>${op[1]}</span><em>${g.t}</em></div>`}).join('')}</div></div></div></details>
    <div class="jf">${k==='sew'&&atTailor(o)?tailorBack(o):k==='hinge'&&tv(o,'hinge')==='done'?`<span class="pill s-ready">Hinge done</span><button class="btn pri" data-send="${o.rno}" data-k="btm">Send for bottom cutting</button>`:`<button class="btn pri" data-step="${o.rno}" data-k="${k}">${taskBtn(o,k)}</button>`}<button class="btn" data-r="${o.rno}">Open details</button></div></div>`}).join('')||'<div class="panel"><div class="empty">Nothing waiting for you right now.</div></div>'}`);
  document.querySelectorAll('[data-step]').forEach(b=>b.onclick=()=>{const o=orders.find(x=>x.rno===+b.dataset.step);stepTask(o,b.dataset.k,w);route()});
  document.querySelectorAll('[data-send]').forEach(b=>b.onclick=()=>{const o=orders.find(x=>x.rno===+b.dataset.send);sendTask(o,b.dataset.k);route()});
  document.querySelectorAll('[data-rdy]').forEach(b=>b.onclick=()=>{const o=orders.find(x=>x.rno===+b.dataset.rdy);markReady(o);route()});
  // the order's JAMEEL sheet (read only), drawn when the card's button is opened
  document.querySelectorAll('details[data-js]').forEach(d=>d.addEventListener('toggle',()=>{if(!d.open)return;const h=d.querySelector('.jro');if(!h||h.dataset.done)return;h.dataset.done=1;
    const o=orders.find(x=>x.rno===+d.dataset.js);const p0=cust(o.cid).profiles[0]||{m:{}};jSheet(h,JSON.parse(JSON.stringify(jHas(o.meas)?o.meas:p0.m)),{ro:true})}));
  bindRows();
}

/* ================= Worker: my work & pay (by month / by date) ================= */
const ymKey=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
const ymName=ym=>{const [y,m]=ym.split('-').map(Number);return new Date(y,m-1,1).toLocaleDateString('en-GB',{month:'long',year:'numeric'})};
const STAGE_T={cut:'Cutting',sew:'Tailor',hinge:'Hinge',tat:'Tatreez',btm:'Bottom cutting',iron:'Ironing'};
/* one worker's month: his work entries, pay (per thobe / salary / basic + target + commission) and deductions */
function monthPay(w,ym){
  const ent=prodLog.filter(p=>p.w===w.id&&ymKey(p.d)===ym).sort((a,b)=>b.d-a.d);
  const qty=ent.reduce((s,p)=>s+(+p.qty||0),0);
  const ded=dedLog.filter(x=>x.sid===w.id&&ymKey(x.d)===ym).sort((a,b)=>b.d-a.d);
  const dedT=ded.reduce((s,x)=>s+(+x.amt||0),0);
  const extra=w.pay==='target'?Math.max(0,qty-(+w.target||0)):0;
  const comm=w.pay==='target'?extra*(+w.comm||0):0;
  const base=w.pay==='piece'?qty*(+w.rate||0):w.pay==='target'?(+w.basic||0):(+w.rate||0);
  const earn=base+comm;
  return{ent,qty,ded,dedT,extra,comm,base,earn,net:earn-dedT};
}
let payYm=ymKey(today),payDay='',payMode='m';
function mypay(){
  const w=ROLE==='tailor'?ME():(workers.find(x=>x.role==='Tailor'&&x.branch===(curBranch||4))||ME());
  if(!w){V('<div class="panel"><div class="empty">Loading your work…</div></div>');return}
  const months=[];for(let i=0;i<12;i++){const d=new Date(today.getFullYear(),today.getMonth()-i,1);months.push(ymKey(d))}
  const ym=payMode==='d'&&payDay?payDay.slice(0,7):payYm;const mp=monthPay(w,ym);
  const perPc=w.pay==='piece';
  // days of the month with work
  const days={};mp.ent.forEach(p=>{const k=dkey2(p.d);(days[k]=days[k]||{d:p.d,q:0,os:new Set(),st:{}});days[k].q+=+p.qty||0;if(p.rno)days[k].os.add(p.rno);days[k].st[p.stage]=(days[k].st[p.stage]||0)+(+p.qty||0)});
  const dayList=Object.values(days).sort((a,b)=>b.d-a.d);
  const dayEnt=payMode==='d'&&payDay?mp.ent.filter(p=>dkey2(p.d)===payDay):[];
  const dayQ=dayEnt.reduce((s,p)=>s+(+p.qty||0),0);
  const sel=`<div class="rowtools" style="flex-wrap:wrap;gap:10px;align-items:center">
    <div class="chips"><button class="chip ${payMode==='m'?'on':''}" data-pm="m">By month</button><button class="chip ${payMode==='d'?'on':''}" data-pm="d">By date</button></div>
    ${payMode==='m'?`<select id="pYm" class="btn sm" style="padding:6px 10px" aria-label="Month">${months.map(m=>`<option value="${m}" ${m===payYm?'selected':''}>${ymName(m)}</option>`).join('')}</select>`
      :`<input type="date" id="pDay" class="btn sm" style="padding:6px 10px" value="${payDay||dkey2(today)}" max="${dkey2(today)}" aria-label="Date">`}
    <span class="muted" style="font-size:13px">${esc(w.name)} · ${esc(w.role)} · ${payLabel(w)}</span></div>`;
  const slip=`<div class="panel"><div class="panel-h"><h2>My pay · ${ymName(ym)}</h2></div><div class="panel-b">
    ${w.pay==='target'?targetBar(w,{doneQ:mp.qty,extra:mp.extra}):''}
    <div class="slip" style="position:static;margin-top:10px"><dl>
     ${w.pay==='target'?`<div><dt>Basic salary</dt><dd class="num">${sar(w.basic)} SAR</dd></div><div><dt>Pieces done</dt><dd class="num">${mp.qty} pcs</dd></div><div><dt>Target</dt><dd class="num">${w.target} pcs</dd></div><div><dt>Commission (${mp.extra} extra × ${w.comm})</dt><dd class="num">${sar(mp.comm)} SAR</dd></div>`
      :perPc?`<div><dt>Pieces done</dt><dd class="num">${mp.qty} pcs</dd></div><div><dt>Rate</dt><dd class="num">${w.rate} SAR per thobe</dd></div><div><dt>Earned</dt><dd class="num">${sar(mp.base)} SAR</dd></div>`
      :`<div><dt>Monthly salary</dt><dd class="num">${sar(w.rate)} SAR</dd></div><div><dt>Pieces done</dt><dd class="num">${mp.qty} pcs</dd></div>`}
     <div><dt>Deductions</dt><dd class="num" style="color:var(--bad)">${mp.dedT?'− '+sar(mp.dedT):'0'} SAR</dd></div></dl>
     <div class="tot"><div class="big"><span>Net pay</span><span class="num">${sar(mp.net)} SAR</span></div></div></div>
    <p class="muted" style="font-size:12px;margin:8px 0 0">${ym===ymKey(today)?'This month so far – it grows with every piece you finish.':'Whole month.'}</p></div></div>`;
  const dedPanel=`<div class="panel"><div class="panel-h"><h2>Deductions · ${ymName(ym)}</h2><span class="sp"></span><span class="num" style="color:var(--bad);font-weight:600">${sar(mp.dedT)} SAR</span></div>
    <div class="rows">${mp.ded.map(x=>`<div class="row"><div class="grow"><b>${esc(x.reason||'Deduction')}</b><span>${fmtD(x.d)}${x.by?' · by '+esc(x.by):''}</span></div><span class="num" style="color:var(--bad);font-weight:600">− ${sar(x.amt)}</span></div>`).join('')||'<div class="empty">No deductions this month.</div>'}</div></div>`;
  if(payMode==='d'){
    const d=payDay||dkey2(today);
    V(`${sel}<div class="kpis">
      <div class="kpi"><span class="l">Pieces on ${fmtD(new Date(d))}</span><span class="v">${dayQ}<small>pcs</small></span><span class="d muted">${pl(new Set(dayEnt.map(p=>p.rno).filter(Boolean)).size,'order')}</span></div>
      ${perPc?`<div class="kpi"><span class="l">Earned that day</span><span class="v">${sar(dayQ*(+w.rate||0))}<small>SAR</small></span><span class="d muted">${w.rate} SAR per thobe</span></div>`:''}
      <div class="kpi"><span class="l">Pieces in ${ymName(ym).split(' ')[0]}</span><span class="v">${mp.qty}<small>pcs</small></span><span class="d muted">Whole month</span></div>
      <div class="kpi"><span class="l">Net pay ${ymName(ym).split(' ')[0]}</span><span class="v">${sar(mp.net)}<small>SAR</small></span><span class="d muted">After deductions</span></div></div>
     <div class="panel"><div class="panel-h"><h2>My work · ${new Date(d).toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</h2></div>
      <div class="tbl-wrap"><table><thead><tr><th>Order</th><th>Work</th><th>Pieces</th></tr></thead><tbody>${dayEnt.map(p=>`<tr ${p.rno&&orders.some(o=>o.rno===p.rno)?`class="click" data-r="${p.rno}"`:''}><td><span class="rid">${p.rno?'#'+p.rno:'—'}</span></td><td>${STAGE_T[p.stage]||esc(p.stage)}</td><td class="num">${p.qty}</td></tr>`).join('')||'<tr><td colspan="3"><div class="empty">No work on this day.</div></td></tr>'}</tbody></table></div></div>
     ${dedPanel}`);
  }else{
    V(`${sel}<div class="kpis">
      <div class="kpi"><span class="l">Pieces done</span><span class="v">${mp.qty}<small>pcs</small></span><span class="d muted">${pl(dayList.length,'working day')}</span></div>
      <div class="kpi"><span class="l">${w.pay==='target'?'Basic + commission':perPc?'Earned':'Salary'}</span><span class="v">${sar(mp.earn)}<small>SAR</small></span><span class="d ${mp.comm?'up':'muted'}">${w.pay==='target'?(mp.extra?`+${sar(mp.comm)} commission`:`${Math.max(0,w.target-mp.qty)} pcs to target`):payLabel(w)}</span></div>
      <div class="kpi"><span class="l">Deductions</span><span class="v" style="color:${mp.dedT?'var(--bad)':'inherit'}">${sar(mp.dedT)}<small>SAR</small></span><span class="d muted">${pl(mp.ded.length,'entry')}</span></div>
      <div class="kpi"><span class="l">Net pay</span><span class="v">${sar(mp.net)}<small>SAR</small></span><span class="d muted">${ymName(ym)}</span></div></div>
     <div class="grid2">${slip}${dedPanel}</div>
     <div class="panel"><div class="panel-h"><h2>My daily report · ${ymName(ym)}</h2><span class="sp"></span><span class="muted" style="font-size:12px">Tap a day to see its orders</span></div>
      <div class="tbl-wrap"><table><thead><tr><th>Date</th><th>Pieces</th><th>Work</th><th>Orders</th>${perPc?'<th>Earned</th>':''}</tr></thead>
      <tbody>${dayList.map(x=>`<tr class="click" data-pday="${dkey2(x.d)}"><td>${x.d.toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short'})}</td><td class="num"><b>${x.q}</b></td><td>${Object.entries(x.st).map(([k,q])=>`${STAGE_T[k]||esc(k)} ${q}`).join(' · ')}</td><td class="num">${x.os.size}</td>${perPc?`<td class="num">${sar(x.q*(+w.rate||0))}</td>`:''}</tr>`).join('')||`<tr><td colspan="${perPc?5:4}"><div class="empty">No work in ${ymName(ym)}.</div></td></tr>`}</tbody></table></div></div>`);
  }
  document.querySelectorAll('[data-pm]').forEach(b=>b.onclick=()=>{payMode=b.dataset.pm;if(payMode==='d'&&!payDay)payDay=dkey2(today);mypay()});
  const ys=document.getElementById('pYm');if(ys)ys.onchange=()=>{payYm=ys.value;mypay()};
  const ds=document.getElementById('pDay');if(ds)ds.onchange=()=>{if(ds.value){payDay=ds.value;mypay()}};
  document.querySelectorAll('[data-pday]').forEach(r=>r.onclick=()=>{payMode='d';payDay=r.dataset.pday;mypay()});
  bindRows();
}
const dkey2=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

/* ================= Production board ================= */
function board(){
  const fid=curBranch;const inScope=o=>!fid||o.made===fid||o.branch===fid;
  const list=orders.filter(o=>inScope(o)&&o.st!=='done');
  const ready=list.filter(o=>o.st==='ready');
  V(`<div class="msg" style="border-color:var(--brass)">Every new order from any branch lands in <b>Cutting</b>. When cutting is finished it moves to the <b>Tailor</b>. When the tailor finishes stitching he sends it for <b>Hinge</b>, <b>Tatreez</b> or <b>Bottom cutting</b> (zip) when the order needs them. When those are done it comes back to him and he ticks <b>Ready</b>; then the owner and that branch get a popup. Change the steps in Settings → Workshop flow.</div>
  <div class="rowtools"><span class="muted" style="font-size:13px">${fid?bname(fid):'All workshops'} · ${list.filter(o=>o.st!=='ready').reduce((s,o)=>s+o.qty,0)} thobes in production · ${ready.reduce((s,o)=>s+o.qty,0)} ready</span></div>
  <div class="board" style="grid-template-columns:repeat(${TASKS.length+(FLOW_OPT.tready?1:0)},minmax(220px,1fr))">${TASKS.map(t=>{const js=list.filter(o=>pending(o,t.k)).sort((a,b)=>(a.t[t.k]==='doing'?0:1)-(b.t[t.k]==='doing'?0:1)||a.due-b.due);return `<div class="col"><h3>${t.t}<span class="num">${js.reduce((s,o)=>s+o.qty,0)}</span></h3><div class="cards2">
   ${js.map(o=>{const wid=t.k==='sew'?o.tailor:o.tw[t.k];return `<div class="job ${late(o)?'late':''}"><div class="t"><span class="rid">${ono(o)}</span><span style="display:flex;gap:4px">${o.hinge&&t.k!=='hinge'?'<span class="tag" title="Needs hinge">H</span>':''}${o.tatreez&&t.k!=='tat'?'<span class="tag" title="Needs tatreez">T</span>':''}<span class="tag">${(BRANCHES.find(b=>b.id===o.branch)||{code:'—'}).code}</span></span></div>
    <b style="font-size:13px">${pl(o.qty,'thobe')} · ${o.fabric}</b><div class="m">${wid?wk(wid).name:'Not assigned'} · due ${fmtD(o.due)}</div>
    ${t.k==='sew'||t.k==='cut'?`<div class="mm">${mmLine(o,['tool','sadr','kom','raqba'])}</div>`:''}${t.k==='sew'&&canAssign()&&o.t.sew==='wait'?`<select class="tsel" data-tsel="${o.rno}" aria-label="Tailor" style="border:1px solid var(--line);border-radius:7px;padding:5px;background:var(--surface)"><option value="">Choose tailor…</option>${tailorsOf(o.made).map(w=>`<option value="${w.id}" ${w.id===o.tailor?'selected':''}>${esc(w.name)}</option>`).join('')}</select>`:''}
    <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">${taskPill(o,t.k)}${canTask()?`<button class="btn sm pri" data-mv="${o.rno}" data-k="${t.k}">${o.t[t.k]==='wait'?'Start':'Finish'}</button>`:''}<button class="btn sm" data-r="${o.rno}">Details</button></div></div>`}).join('')||'<div class="muted" style="font-size:12.5px;padding:6px">Empty</div>'}</div></div>`}).join('')}${FLOW_OPT.tready?(()=>{const js=list.filter(atTailor).sort((a,b)=>a.due-b.due);return `<div class="col"><h3>Back at tailor · Ready<span class="num">${js.reduce((s,o)=>s+o.qty,0)}</span></h3><div class="cards2">${js.map(o=>`<div class="job ${late(o)?'late':''}"><div class="t"><span class="rid">${ono(o)}</span><span class="tag">${(BRANCHES.find(b=>b.id===o.branch)||{code:''}).code}</span></div>
    <b style="font-size:13px">${pl(o.qty,'thobe')} · ${esc(o.fabric||'')}</b><div class="m">${esc(wk(o.tailor).name)} · due ${fmtD(o.due)}</div>
    <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">${TASKS.filter(t=>t.m==='send'&&needs(o,t.k)).map(t=>{const v=tv(o,t.k);return `<span class="pill ${v==='done'?'s-ready':v==='doing'||isSent(o,t.k)?'s-cut':'s-wait'}">${t.t}: ${v==='done'?'done':v==='doing'?'working':isSent(o,t.k)?'sent':'not sent'}</span>`}).join('')}${allStepsDone(o)?'<span class="pill s-ready">Waiting for tailor\'s Ready</span>':''}<button class="btn sm" data-r="${o.rno}">Details</button></div></div>`).join('')||'<div class="muted" style="font-size:12.5px;padding:6px">Empty</div>'}</div></div>`})():''}</div>`);
  document.querySelectorAll('[data-tsel]').forEach(s=>s.onchange=()=>{const o=orders.find(x=>x.rno===+s.dataset.tsel);o.tailor=+s.value||0;toast(s.value?`${ono(o)} given to ${wk(o.tailor).name}`:'Tailor removed');route()});
  document.querySelectorAll('[data-mv]').forEach(b=>b.onclick=()=>{const o=orders.find(x=>x.rno===+b.dataset.mv);stepTask(o,b.dataset.k,b.dataset.k==='sew'?wk(o.tailor):null);route()});
  bindRows();
}

/* ================= Branches ================= */
function shopCard(b){
    const os=orders.filter(o=>o.branch===b.id),act=os.filter(o=>o.st!=='done'),ws=workers.filter(w=>w.branch===b.id);
    const rev=revSeries(os,14),r30=os.filter(o=>(today-o.created)/864e5<30).reduce((s,o)=>s+o.paid,0),mx=Math.max(...rev.map(x=>x.v))||1;
    const mgr=ws.find(w=>w.role==='Branch manager');const atF=act.filter(o=>isFac(o.made)).reduce((s,o)=>s+o.qty,0);
    return `<div class="bcard">
     <div class="bh"><div style="flex:1;min-width:0"><span class="code">${b.code}</span>${b.main?' <span class="code" style="border-color:#8a8576;color:#cfc9b8">Main</span>':''}<h3 style="margin-top:8px">${b.name}</h3><p>${b.city} · ${b.address}</p></div></div>
     <div class="bs"><div><span>Active orders</span><b>${act.length}</b></div><div><span>Ready</span><b>${os.filter(o=>o.st==='ready').length}</b></div><div><span>Workers</span><b>${ws.length}</b></div></div>
     <div class="bm">
      <div><span class="muted">Revenue, 30 days</span><b class="num">${sar(r30)} SAR</b></div>
      <div class="spark" title="Daily revenue, last 14 days">${rev.map(x=>`<i style="height:${Math.max(4,x.v/mx*100)}%"></i>`).join('')}</div>
      <div><span class="muted">At the factory</span><span class="num">${atF} thobes</span></div>
      <div><span class="muted">Manager</span><span>${mgr?mgr.name:'Not assigned'}</span></div>
      <div><span class="muted">Phone</span><span class="num">${b.phone}</span></div>
      <div><span class="muted">Hours</span><span class="num" style="font-size:12px">${b.hours}</span></div>
     </div>
     <div class="bf"><button class="btn pri sm" data-open="${b.id}">Open branch</button><button class="btn sm" data-edit="${b.id}">Edit</button><button class="btn sm" data-staff="${b.id}">Staff</button><button class="btn sm" data-links="${b.id}">Links</button></div>
    </div>`}
function facCard(f){
    const os=orders.filter(o=>o.made===f.id),inP=os.filter(o=>o.st==='cut'||o.st==='sew'),ws=workers.filter(w=>w.branch===f.id);
    const pcs=inP.reduce((s,o)=>s+o.qty,0),wkDone=os.filter(o=>(o.st==='ready'||o.st==='done')&&(today-o.created)/864e5<30).reduce((s,o)=>s+o.qty,0);
    const load=Math.min(100,pcs/((f.capacity||300)/7*10)*100);
    const byShop=SHOPS().map(b=>({b,n:inP.filter(o=>o.branch===b.id).reduce((s,o)=>s+o.qty,0)}));
    const st=['cut','sew','hinge','tat'].map(k=>({k,n:os.filter(o=>pending(o,k)).reduce((s,o)=>s+o.qty,0)}));
    return `<div class="bcard">
     <div class="bh" style="background:var(--ink-2)"><div style="flex:1;min-width:0"><span class="code">${f.code}</span> <span class="code" style="border-color:#8a8576;color:#cfc9b8">Factory</span><h3 style="margin-top:8px">${f.name}</h3><p>${f.city} · ${f.address}</p></div></div>
     <div class="bs"><div><span>In production</span><b>${pcs}</b></div><div><span>Finished, 30 days</span><b>${wkDone}</b></div><div><span>Workers</span><b>${ws.length}</b></div></div>
     <div class="bm">
      <div><span class="muted">Capacity</span><span class="num">${f.capacity||'—'} pcs / week</span></div>
      <div><div class="load" style="width:100%"><i style="width:${load}%;${load>85?'background:var(--bad)':''}"></i></div></div>
      <div><span class="muted">Cutting · Tailor · Hinge · Tatreez</span><span class="num">${st.map(x=>x.n).join(' · ')}</span></div>
      ${byShop.map(x=>`<div><span class="muted">From ${x.b.name}</span><span class="num">${x.n} pcs</span></div>`).join('')}
      <div><span class="muted">Supervisor</span><span>${(ws.find(w=>w.role==='Factory supervisor')||{}).name||'Not assigned'}</span></div>
     </div>
     <div class="bf"><button class="btn pri sm" data-open="${f.id}">Open factory</button><button class="btn sm" data-edit="${f.id}">Edit</button><button class="btn sm" data-staff="${f.id}">Staff</button><button class="btn sm" data-links="${f.id}">Link</button></div>
    </div>`}
function branches(){
  const addCard=(id,t,d)=>`<button class="bcard add" id="${id}">${ico('plus',1.6)}<b>${t}</b><span style="font-size:12.5px;padding-inline:20px;text-align:center">${d}</span></button>`;
  V(`${demoNote}
  <div class="rowtools"><h2 style="margin:0;font-size:17px">Shop branches <span class="muted num" style="font-weight:500">${SHOPS().length}</span></h2><span class="sp"></span><button class="btn" id="addB2">${ico('plus')}Add branch</button><button class="btn pri" id="addF2">${ico('plus')}Add factory</button></div>
  <div class="cards">${SHOPS().map(shopCard).join('')}${addCard('addB','Add a branch','New shop where customers order, get measured and pick up')}</div>
  <div class="rowtools"><h2 style="margin:0;font-size:17px">Tailoring factories <span class="muted num" style="font-weight:500">${FACS().length}</span></h2></div>
  <div class="cards">${FACS().map(facCard).join('')}${addCard('addF','Add a tailoring factory','Workshop that stitches orders sent from your shops')}</div>
  <div class="panel" id="bwPanel"></div>
  <div class="panel"><div class="panel-h"><h2>Branch comparison</h2><span class="sp"></span><span class="muted" style="font-size:12px">Last 40 days</span></div><div class="tbl-wrap"><table>
   <thead><tr><th>Branch</th><th>Orders</th><th>Thobes</th><th>Sent to factory</th><th>Revenue</th><th>Avg per order</th><th>Balance due</th><th>Overdue</th></tr></thead>
   <tbody>${SHOPS().map(b=>{const os=orders.filter(o=>o.branch===b.id),rv=os.reduce((s,o)=>s+o.paid,0),tq=os.reduce((s,o)=>s+o.qty,0),fq=os.filter(o=>isFac(o.made)).reduce((s,o)=>s+o.qty,0);return `<tr><td>${bTag(b.id)} <b>${b.name}</b> <span class="muted">${b.city}</span></td><td class="num">${os.length}</td><td class="num">${tq}</td><td class="num">${fq} <span class="muted">(${tq?Math.round(fq/tq*100):0}%)</span></td><td class="num">${sar(rv)}</td><td class="num">${os.length?sar(os.reduce((s,o)=>s+o.total,0)/os.length):'—'}</td><td class="num">${sar(os.reduce((s,o)=>s+o.total-o.paid,0))}</td><td class="num" style="color:${os.filter(late).length?'var(--bad)':'inherit'}">${os.filter(late).length}</td></tr>`}).join('')}</tbody></table></div></div>`);
  bwMount();
  document.querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>{curBranch=+b.dataset.open;toast(`Switched to ${bname(curBranch)}`);location.hash='dashboard'});
  document.querySelectorAll('[data-staff]').forEach(b=>b.onclick=()=>{curBranch=+b.dataset.staff;workerRole='all';location.hash='workers'});
  document.querySelectorAll('[data-links]').forEach(b=>b.onclick=()=>branchLinks(BRANCHES.find(x=>x.id===+b.dataset.links)));
  document.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>branchForm(BRANCHES.find(x=>x.id===+b.dataset.edit)));
  ['addB','addB2'].forEach(id=>document.getElementById(id).onclick=()=>branchForm(null,'shop'));
  ['addF','addF2'].forEach(id=>document.getElementById(id).onclick=()=>branchForm(null,'factory'));
}
function branchForm(b,type){
  const e=b||{code:'',name:'',city:'Riyadh',address:'',phone:'',hours:type==='factory'?'7:00 – 17:00':'9:00 – 13:00 · 16:30 – 23:00',opened:today,type,capacity:300};
  const F=e.type==='factory';
  const close=drawer(b?`Edit ${b.name}`:F?'Add a tailoring factory':'Add a branch',`<div class="muted" style="font-size:13px">${b?b.code+' · '+b.city:F?'New production workshop':'New shop location'}</div>`,
   `<div class="fgrid" style="grid-template-columns:repeat(2,minmax(0,1fr))">
     <div class="field"><label for="bName">${F?'Factory name':'Branch name'}</label><input id="bName" value="${esc(e.name)}" placeholder="${F?'e.g. Al Sulay Factory':'e.g. Al Nakheel'}"></div>
     <div class="field"><label for="bCode">Short code</label><input id="bCode" class="num" maxlength="4" value="${esc(e.code)}" placeholder="${F?'FC2':'NKL'}"></div>
     <div class="field" style="grid-column:1/-1"><label for="bType">Type</label><select id="bType"><option value="shop" ${F?'':'selected'}>Shop branch: takes orders, measures customers, hands over thobes</option><option value="factory" ${F?'selected':''}>Tailoring factory: stitches orders sent from shops</option></select></div>
     <div class="field"><label for="bCity">City</label><select id="bCity">${['Riyadh','Jeddah','Dammam','Makkah','Madinah','Khobar','Taif','Abha'].map(c=>`<option ${c===e.city?'selected':''}>${c}</option>`).join('')}</select></div>
     <div class="field"><label for="bPhone">Phone</label><input id="bPhone" class="num" value="${esc(e.phone)}" placeholder="011 xxx xxxx"></div>
     <div class="field" style="grid-column:1/-1"><label for="bAddr">Address</label><input id="bAddr" value="${esc(e.address)}" placeholder="Street, district"></div>
     <div class="field" style="grid-column:1/-1"><label for="bHours">Opening hours</label><input id="bHours" value="${esc(e.hours)}"></div>
     <div class="field"><label for="bOpen">Opening date</label><input id="bOpen" type="date" value="${e.opened.toISOString().slice(0,10)}"></div>
     <div class="field" data-shop><label for="bRecv">Receipt numbers start at</label><input id="bRecv" class="num" type="number" value="${b?'':(BRANCHES.length+1)*1000}" ${b?'disabled placeholder="Set"':''}></div>
     <div class="field" data-fac><label for="bCap">Capacity (thobes per week)</label><input id="bCap" class="num" type="number" value="${e.capacity||300}"></div>
     <div class="field" data-fac style="grid-column:1/-1"><label for="bServes">Takes orders from</label><select id="bServes">${['All shop branches',...SHOPS().map(x=>x.name+' only')].map(o=>`<option>${o}</option>`).join('')}</select></div>
    </div>
    <div class="msg" style="border-color:var(--brass)" id="bHelp"></div>
    ${b?'':`<div><p class="h4">Logins for this ${F?'factory':'branch'}</p><p class="muted" style="font-size:12.5px;margin:-4px 0 10px">Created together with the branch. Each person signs in and sees only this branch.</p>
     <div class="fgrid" style="grid-template-columns:repeat(2,minmax(0,1fr))">
      <div class="field" data-shop><label for="lgMgr">Branch manager</label><input id="lgMgr" placeholder="Name"></div>
      <div class="field" data-shop><label for="lgMeas">Measurement</label><input id="lgMeas" placeholder="Name"></div>
      <div class="field" data-shop><label for="lgCash">Cashier</label><input id="lgCash" placeholder="Name"></div>
      <div class="field"><label for="lgTail">Tailor / workshop login</label><input id="lgTail" placeholder="Name"></div>
     </div><p class="muted" style="font-size:12px;margin:8px 0 0">Leave a box empty to skip that login. You can add more later in Settings.</p></div>`}`,
   `<button class="btn pri" id="bSave">${b?'Save changes':'Create with logins'}</button>`);
  const $=id=>document.getElementById(id);
  const sync=()=>{const f=$('bType').value==='factory';document.querySelectorAll('[data-fac]').forEach(x=>x.hidden=!f);document.querySelectorAll('[data-shop]').forEach(x=>x.hidden=f);
    $('bHelp').textContent=f?'A factory has its own workers (tailors, cutters, ironing) but no customers or cash. When a shop creates an order it can choose "Stitch at: this factory". The factory sees those orders, moves them through cutting, stitching and ironing, and the shop gets them back as Ready for pickup.':'Each branch keeps its own orders, workers, cash and receipt numbers. Customers and their measurements are shared, so a customer measured in one branch can order from any branch.'};
  $('bType').onchange=sync;sync();
  $('bSave').onclick=async()=>{const n=$('bName').value.trim(),c=$('bCode').value.trim().toUpperCase();if(!n||!c){toast('Enter a name and short code');return}
    const t=b||{id:Math.max(0,...BRANCHES.map(x=>x.id))+1};Object.assign(t,{name:n,code:c,city:$('bCity').value,phone:$('bPhone').value,address:$('bAddr').value,hours:$('bHours').value,opened:new Date($('bOpen').value||today),type:$('bType').value,capacity:+$('bCap').value||0});
    let made=0;if(!b&&LIVE){BRANCHES.push(t);await flush();const fac=t.type==='factory';const sb=$('bSave');sb.disabled=true;sb.textContent='Creating logins…';
      for(const [r,id,job] of [['manager','lgMgr','Branch manager'],['measure','lgMeas','Measurement'],['cashier','lgCash','Cashier'],['tailor','lgTail',fac?'Factory supervisor':'Tailor']]){if(fac&&r!=='tailor')continue;const v=$(id).value.trim();if(!v)continue;
        const w={id:0,name:v,role:job,login:r,branch:t.id,phone:'',nat:'',joined:today,pay:'salary',rate:0,basic:0,target:60,comm:0,iqama:null,status:'active'};try{await createStaff(w);if(!workers.some(x=>x.id===w.id))workers.push(w);made++}catch(e){toast(`Could not create ${v}: ${e.code||e.message}`)}}
    }else if(!b){BRANCHES.push(t);const fac=t.type==='factory';
      [['manager','lgMgr'],['measure','lgMeas'],['cashier','lgCash'],['tailor','lgTail']].forEach(([r,id])=>{if(fac&&r!=='tailor')return;const v=$(id).value.trim();if(v){USERS.push({role:r,name:v,branch:t.id});made++;
        if(!workers.find(w=>w.name===v))workers.push({id:workers.length+1,name:v,role:{manager:'Branch manager',measure:'Tailor',cashier:'Cashier',tailor:fac?'Factory supervisor':'Tailor'}[r],branch:t.id,phone:'',nat:'',joined:today,pay:'salary',rate:3000,basic:1500,target:60,comm:15,mdone:0,iqama:null,status:'active',att:Array.from({length:14},(_,k)=>addD(today,k-13).getDay()===5?'o':'p')})}})}
    close();toast(b?'Saved':`${n} ${t.type==='factory'?'factory':'branch'} created${made?` with ${pl(made,'login')}`:''}`);route();if(!b)branchLinks(t,true)};
}

/* ================= Branch links & install ================= */
const DOMAIN='saudithobe.men';
const slug=b=>b.code.toLowerCase();
const LINKROLES=[['manager','Branch manager'],['measure','Measurement'],['cashier','Cashier']];
const linkFor=(b,r)=>`https://${DOMAIN}/${slug(b)}/${{manager:'manager',measure:'measurement',cashier:'cashier',tailor:'workshop'}[r]}`;
function qrInto(el,text){try{if(typeof QRCode!=='undefined'){new QRCode(el,{text,width:160,height:160,correctLevel:QRCode.CorrectLevel.M});return}}catch(e){}el.innerHTML='<span class="muted" style="font-size:11px;text-align:center">QR</span>'}
function branchLinks(b,fresh){
  if(LIVE){const ppl=workers.filter(w=>w.branch===b.id&&['manager','measure','cashier','tailor'].includes(w.login||jobLogin(w.role)));
    drawer(fresh?`${b.name} is ready`:`${b.name} links`,`<div class="muted" style="font-size:13px">${fresh?'Send each person their own link.':`${b.code} · ${b.city}`}</div>`,
     `<div class="msg" style="border-color:var(--brass)">Each person opens <b>their own link</b>, sets a PIN, and can install it as their own app. A first-time link works only until the PIN is set.</div>
      <div class="links">${ppl.map(w=>`<div class="lk"><div class="qr" id="qrp_${w.id}"></div><div style="min-width:0"><b>${esc(w.name)}</b><span class="muted" style="font-size:12px">${esc(w.role)}${w.pinSet?' · PIN set':' · waiting for first sign in'}</span><span class="url">${esc(wLink(w))}</span>
       <div class="acts"><button class="btn sm" data-wapp="${w.id}">Link & WhatsApp</button></div></div></div>`).join('')||'<div class="empty">No logins for this branch yet. Add people from Workers.</div>'}</div>`,'');
    ppl.forEach(w=>qrInto(document.getElementById('qrp_'+w.id),wLink(w)));
    document.querySelectorAll('[data-wapp]').forEach(x=>x.onclick=()=>workerApp(wk(+x.dataset.wapp)));return}
  const roles=isFac(b.id)?[['tailor','Workshop / tailor']]:[...LINKROLES,...(USERS.some(u=>u.branch===b.id&&u.role==='tailor')?[['tailor','Workshop / tailor']]:[])];
  const who=r=>USERS.filter(u=>u.branch===b.id&&u.role===r).map(u=>u.name).join(', ')||'No one yet';
  const msg=r=>`Assalamu alaikum,\nYour Saudi Thobe login for ${b.name} (${{manager:'Branch manager',measure:'Measurement',cashier:'Cashier',tailor:'Workshop'}[r]}):\n${linkFor(b,r)}\nOpen it, set your PIN, then tap "Install" to put the app on your phone or PC.`;
  drawer(fresh?`${b.name} is ready`:`${b.name} links`,`<div class="muted" style="font-size:13px">${fresh?'Branch created. Send each person their own link.':`${b.code} · ${b.city}`}</div>`,
   `<div class="msg" style="border-color:var(--brass)">Each link opens the app already set to <b>${b.name}</b> and the right job. The first time, the person sets a 4-digit PIN. After that they can install it: on a PC it opens in its own window like an .exe, on a phone it gets an icon like a normal app.</div>
    <div class="links">${roles.map(([r,t])=>`<div class="lk"><div class="qr" id="qr_${r}"></div><div style="min-width:0"><b>${t}</b><span class="muted" style="font-size:12px">${esc(who(r))}</span><span class="url" id="url_${r}">${linkFor(b,r)}</span>
     <div class="acts"><button class="btn sm" data-cp="${r}">Copy link</button><button class="btn sm" data-wa="${r}">${ico('wa')}Copy WhatsApp message</button><button class="btn sm pri" data-pv="${r}">Preview</button></div></div></div>`).join('')}</div>`,
   `<button class="btn" id="lkAll">Copy all ${roles.length} links</button>`);
  roles.forEach(([r])=>qrInto(document.getElementById('qr_'+r),linkFor(b,r)));
  const cp=(t,ok)=>navigator.clipboard.writeText(t).then(()=>toast(ok),()=>toast('Copy blocked here. Select the link and copy it'));
  document.querySelectorAll('[data-cp]').forEach(x=>x.onclick=()=>cp(linkFor(b,x.dataset.cp),'Link copied'));
  document.querySelectorAll('[data-wa]').forEach(x=>x.onclick=()=>cp(msg(x.dataset.wa),'Message copied, paste it in WhatsApp'));
  document.querySelectorAll('[data-pv]').forEach(x=>x.onclick=()=>installScreen(b,x.dataset.pv));
  document.getElementById('lkAll').onclick=()=>cp(roles.map(([r,t])=>`${t}: ${linkFor(b,r)}`).join('\n'),'All links copied');
}
function installScreen(b,r,w){
  if(w){b=BRANCHES.find(x=>x.id===w.branch);r=wRoleKey(w)}
  const a=ACCESS[r];const url=w?wLink(w):b?linkFor(b,r):`https://${DOMAIN}`;
  const ui=w?-1:b?USERS.findIndex(u=>u.branch===b.id&&u.role===r):-1;
  const el=document.createElement('div');el.className='inst';el.id='inst';
  el.innerHTML=`<div class="inst-in">
   <div class="chrome"><i></i><i></i><i></i><span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${url}</span><span title="Install app" style="color:var(--brass)">⤓ Install</span></div>
   <div class="applike"><div class="appico">${w?initials(w.name):'ST'}</div><div><b>${w?'ST · '+esc(w.name.split(' ')[0]):'Saudi Thobe'+(b?' · '+b.name:'')}</b><div class="sub" style="font-size:13px">${w?`${w.role} · ${bname(w.branch)} · personal app`:(a?a.label:'All logins')+(b?' · '+b.city:'')}</div></div></div>
   <div><h1>${w?`Assalamu alaikum, ${esc(w.name.split(' ')[0])}`:b&&a?`Welcome to ${b.name}, ${a.label.toLowerCase()}`:'Install Saudi Thobe'}</h1><p class="sub" style="margin:6px 0 0">Install once and open it from your desktop or home screen. It stays signed in to ${b?'this branch':'your branch'} and works on slow internet.</p></div>
   ${b?`<div class="loginform" style="background:var(--ink-2);border-color:rgba(255,255,255,.1);grid-template-columns:repeat(2,minmax(0,1fr)) auto"><div class="field"><label for="ipName" style="color:#b9b4a6">Your name</label><input id="ipName" value="${w?esc(w.name):ui>=0?esc(USERS[ui].name):''}" ${w?'readonly':''}></div><div class="field"><label for="ipPin" style="color:#b9b4a6">Set a 4-digit PIN</label><input id="ipPin" class="num" maxlength="4" inputmode="numeric" placeholder="••••"></div><button class="btn" id="ipGo" style="height:40px">Open app</button></div>`:''}
   <div class="plat">
    <div class="pcard"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2" y="4" width="20" height="13" rx="2"/><path d="M8 21h8M12 17v4"/></svg><b>Windows PC (like an .exe)</b><ol><li>Open the link in Chrome or Edge</li><li>Click <b>Install</b> in the address bar (⤓)</li><li>The app gets a desktop icon and opens in its own window</li></ol></div>
    <div class="pcard"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="6" y="2" width="12" height="20" rx="2"/><path d="M11 18h2"/></svg><b>Android phone</b><ol><li>Open the link in Chrome</li><li>Tap <b>Install app</b> (or ⋮ menu → Install)</li><li>The icon appears on the home screen</li></ol></div>
    <div class="pcard"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="6" y="2" width="12" height="20" rx="3"/><path d="M10 5h4"/></svg><b>iPhone</b><ol><li>Open the link in Safari</li><li>Tap Share ⬆, then <b>Add to Home Screen</b></li><li>Open it from the new icon</li></ol></div>
   </div>
   <div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn" id="ipInstall">⤓ Install app</button><button class="btn ghost" id="ipClose">Back to admin</button></div>
   ${w?`<p class="sub" style="font-size:13px;margin:0">This is <b>${esc(w.name)}'s own app</b>. If another worker's app is already on this phone, this one installs next to it as a separate icon.</p>`:''}
   <p class="sub" style="font-size:12px;margin:0">${DEMO?'Demo preview. The Install button works on the real saudithobe.men site; inside this preview it only shows the steps.':''}</p>
  </div>`;
  document.body.appendChild(el);
  const close=()=>el.remove();
  document.getElementById('ipClose').onclick=close;
  document.getElementById('ipInstall').onclick=()=>toast('On the real site this opens the browser\'s Install window');
  const go=document.getElementById('ipGo');if(go)go.onclick=()=>{const p=document.getElementById('ipPin').value;if(!/^\d{4}$/.test(p)){toast('Enter a 4-digit PIN');return}close();document.getElementById('layer').innerHTML='';const L=document.getElementById('login');if(L)L.remove();if(w)enterWorker(w);else enterAs(r,ui>=0?ui:undefined)};
}

/* ================= One app per worker ================= */
const wslug=w=>`${(BRANCHES.find(b=>b.id===w.branch)||{code:'st'}).code.toLowerCase()}-${w.id}-${w.name.split(' ')[0].toLowerCase().replace(/[^a-z]/g,'')}`;
const wLink=w=>LIVE?personalLink(w):`https://${DOMAIN}/app/${wslug(w)}`;
const wRoleKey=w=>({'Branch manager':'manager',Cashier:'cashier','Factory supervisor':'tailor'}[w.role])||(ROLE2TASK[w.role]?'tailor':'tailor');
function workerApp(w,fresh){
  const msg=`Assalamu alaikum ${w.name.split(' ')[0]},\nThis is your own Saudi Thobe app (${w.role}, ${bname(w.branch)}):\n${wLink(w)}\nOpen it, set your PIN, then tap Install. It is only for you.`;
  drawer(fresh?`${w.name} added`:`${w.name} · app`,`<div class="muted" style="font-size:13px">${w.role} · ${bname(w.branch)}</div>`,
   `<div class="msg" style="border-color:var(--brass)">Every worker gets <b>his own app</b>. It installs as <b>"ST · ${esc(w.name.split(' ')[0])}"</b> and opens straight into his ${ROLE2TASK[w.role]?TK[ROLE2TASK[w.role]].t.toLowerCase()+' job cards':'work'}. Two workers can install their apps on the same phone or PC: each shows up as a separate icon, never "already installed".</div>
    <div class="lk"><div class="qr" id="qr_w"></div><div style="min-width:0"><b>Personal app link</b><span class="muted" style="font-size:12px">Only for ${esc(w.name)}${LIVE?(w.pinSet?' · PIN set':' · first-time link, he sets his PIN'):''}</span><span class="url">${wLink(w)}</span>
     <div class="acts">${LIVE&&!w.uid?`<button class="btn sm pri" id="wmk">Create his login</button>`:''}<button class="btn sm" id="wcp">Copy link</button><button class="btn sm" id="wwa">${ico('wa')}Copy WhatsApp message</button>${LIVE?`<a class="btn sm pri" href="${wLink(w)}" target="_blank" rel="noopener">Open</a>`:`<button class="btn sm pri" id="wpv">Preview</button>`}</div></div></div>
    <div><p class="h4">Same phone, two workers</p><div class="applike" style="background:var(--ground);color:var(--text)">${[w,...workers.filter(x=>x!==w&&x.branch===w.branch).slice(0,2)].map(x=>`<div style="display:flex;flex-direction:column;align-items:center;gap:4px;width:74px;text-align:center"><div class="appico" style="width:46px;height:46px;font-size:14px">${initials(x.name)}</div><span style="font-size:11px">ST · ${esc(x.name.split(' ')[0])}</span></div>`).join('')}</div>
     <p class="muted" style="font-size:12px;margin:6px 0 0">Each app keeps its own login, so one worker can't open the other's job cards.</p></div>`,
   `${isOwner()?`<button class="btn" id="wreset">Reset PIN</button>`:''}`);
  qrInto(document.getElementById('qr_w'),wLink(w));
  const cp=(t,ok)=>navigator.clipboard.writeText(t).then(()=>toast(ok),()=>toast('Copy blocked here. Select the link and copy it'));
  const mk=document.getElementById('wmk');if(mk)mk.onclick=async()=>{mk.disabled=true;mk.textContent='Creating…';try{w.login=w.login||jobLogin(w.role);await createStaff(w);toast('Login made. Send him the link');workerApp(w)}catch(e){mk.disabled=false;mk.textContent='Create his login';toast('Could not create: '+(e.code||e.message))}};
  document.getElementById('wcp').onclick=()=>{if(LIVE&&!w.uid){toast('Create his login first');return}cp(wLink(w),'Link copied')};
  document.getElementById('wwa').onclick=()=>cp(msg,'Message copied, paste it in WhatsApp');
  const pv=document.getElementById('wpv');if(pv)pv.onclick=()=>installScreen(null,null,w);
  const rs=document.getElementById('wreset');if(rs)rs.onclick=async()=>{if(DEMO){toast(`${w.name} will set a new PIN next time he opens his app`);return}rs.disabled=true;try{await resetPin(w);toast('New link made. The old PIN no longer works');workerApp(w)}catch(e){rs.disabled=false;toast('Could not reset: '+(e.code||e.message))}};
}
function enterWorker(w){
  const role=wRoleKey(w);let i=USERS.findIndex(u=>u.name===w.name&&u.branch===w.branch);
  if(i<0){USERS.push({role,name:w.name,branch:w.branch});i=USERS.length-1}else USERS[i].role=USERS[i].role||role;
  enterAs(USERS[i].role,i)}

/* ================= Reports ================= */
function reports(){
  const P=perGet('rep','month'),money=RA().money,B=curBranch;
  const all=ordersAt(B),bk=all.filter(o=>inPer(o.created,P));
  const pays=paysAt(B).filter(p=>inPer(p.d,P)),coll=sumBy(pays,p=>p.amt);
  const sales=sumBy(bk,o=>o.total),pcs=sumBy(bk,o=>o.qty),disc=sumBy(bk,o=>o.disc||0),dueB=sumBy(bk,o=>o.total-o.paid);
  const dels=delsAt(B).filter(p=>inPer(p.d,P));
  const info=new Map(bk.map(o=>[o.rno,oInfo(o)]));
  const nd=perDays(P),byMonth=nd>62;const tr=[];
  if(!byMonth)for(let i=0;i<nd;i++){const d=addD(P.from,i);tr.push({l:d.toLocaleDateString('en-GB',{day:'numeric',month:'short'}),s:sumBy(bk.filter(o=>sameDay(o.created,d)),o=>o.total),c:sumBy(pays.filter(p=>sameDay(p.d,d)),p=>p.amt)})}
  else{let d=new Date(P.from.getFullYear(),P.from.getMonth(),1);while(d<=P.to){const k=ymKey(d);tr.push({l:d.toLocaleDateString('en-GB',{month:'short',year:'2-digit'}),s:sumBy(bk.filter(o=>ymKey(o.created)===k),o=>o.total),c:sumBy(pays.filter(p=>ymKey(p.d)===k),p=>p.amt)});d=new Date(d.getFullYear(),d.getMonth()+1,1)}}
  const tmx=Math.max(1,...tr.map(x=>Math.max(x.s,x.c)));
  const bars=(arr,unit)=>{const mx=Math.max(...arr.map(a=>a.v))||1,tot=sumBy(arr,a=>a.v)||1;return arr.length?`<div class="mbars">${arr.map(a=>`<div class="mb"><span title="${esc(a.k)}">${esc(a.k)}</span><div class="load"><i style="width:${a.v/mx*100}%"></i></div><b class="num">${unit==='sar'?sar(a.v):a.v}</b><em class="num">${Math.round(a.v/tot*100)}%</em></div>`).join('')}</div>`:'<div class="empty">Nothing in this period.</div>'};
  const shops=(B?BRANCHES.filter(b=>b.id===B):SHOPS());
  const brRows=shops.map(b=>{const os=bk.filter(o=>o.branch===b.id),ps=pays.filter(p=>p.branch===b.id);return{b,n:os.length,q:sumBy(os,o=>o.qty),s:sumBy(os,o=>o.total),c:sumBy(ps,p=>p.amt),d:sumBy(os,o=>o.total-o.paid)}});
  const byM={};pays.forEach(p=>{const k=pmName(p)||'Other';byM[k]=(byM[k]||0)+p.amt});
  const ent=prodLog.filter(p=>inPer(p.d,P)&&(!B||p.made===B||wk(p.w).branch===B));
  const byW={};ent.forEach(p=>{const w=wk(p.w);const x=byW[p.w]=byW[p.w]||{k:`${w.name} · ${w.role==='Cutter'?'Cutting':w.role}`,v:0};x.v+=+p.qty||0});
  const st={};bk.forEach(o=>{const s=info.get(o.rno).status;st[s]=(st[s]||0)+1});
  const byFab={};bk.forEach(o=>{if(o.fabric)byFab[o.fabric]=(byFab[o.fabric]||0)+o.qty});
  const styles=DESIGN_.map(g=>{const c={};bk.forEach(o=>{const v=(o.design||{})[g.k];if(v)c[v]=(c[v]||0)+1});const top=Object.entries(c).sort((a,b)=>b[1]-a[1])[0]||['',0];const opt=g.opts.find(o=>o[0]===top[0]);return{k:`${g.t}: ${opt?opt[1]:'—'}`,v:top[1]}}).filter(x=>x.v);
  const topC={};bk.forEach(o=>{const x=topC[o.cid]=topC[o.cid]||{c:cust(o.cid),n:0,q:0,t:0};x.n++;x.q+=o.qty;x.t+=o.total});
  const tops=Object.values(topC).sort((a,b)=>b.t-a.t||b.q-a.q).slice(0,10);
  const K=(l,v,sub,cls='')=>`<div class="${cls}"><span>${l}</span><b>${v}</b><em>${sub}</em></div>`;
  V(`<div class="rephead"><div><h2>Business report</h2><p class="muted">${esc(B?bname(B):'All branches & factories')} · ${perLabel(P)} · ${pl(nd,'day')}</p></div><span class="sp"></span><button class="btn" id="repCsv">Export CSV</button><button class="btn" id="repPrint">Print</button></div>
  <div class="panel"><div class="panel-b" style="padding:12px 16px">${perBar('repPer',P)}</div></div>
  <div class="okpi">
   ${money?K('Sales booked',`${sar(sales)}<small>SAR</small>`,`${pl(bk.length,'order')}`):''}
   ${money?K('Collected',`${sar(coll)}<small>SAR</small>`,`${pl(pays.length,'payment')}`,'okc'):''}
   ${K('Thobes ordered',pcs,`${bk.length?Math.round(pcs/bk.length*10)/10:0} per order`)}
   ${money?K('Average order',`${sar(bk.length?sales/bk.length:0)}<small>SAR</small>`,`discount given ${sar(disc)}`):''}
   ${money?K('Still due',`${sar(dueB)}<small>SAR</small>`,'on these orders',dueB>0?'bad':''):''}
   ${K('Delivered',`${sumBy(dels,d=>d.qty)}<small>pcs</small>`,pl(new Set(dels.map(d=>d.rno)).size,'order'))}
   ${K('Workshop output',`${sumBy(ent.filter(p=>p.stage==='sew'),p=>p.qty)}<small>stitched</small>`,`${sumBy(ent.filter(p=>p.stage==='cut'),p=>p.qty)} cut`)}
  </div>
  ${money?`<div class="panel"><div class="panel-h"><h2>Sales & collections</h2><span class="sp"></span><span class="lg"><i class="a"></i>Sales booked</span><span class="lg"><i class="b"></i>Collected</span><span class="muted" style="font-size:12px">${byMonth?'by month':'by day'} · SAR</span></div>
   <div class="panel-b"><div class="cchart" style="--n:${tr.length}">${tr.map(x=>`<div class="cc" title="${esc(x.l)}: sales ${sar(x.s)} · collected ${sar(x.c)}"><div class="cb"><i class="a" style="height:${x.s/tmx*100}%"></i><i class="b" style="height:${x.c/tmx*100}%"></i></div><span>${tr.length>16&&tr.indexOf(x)%Math.ceil(tr.length/12)?'':esc(x.l)}</span></div>`).join('')}</div></div></div>
  <div class="grid2">
   <div class="panel"><div class="panel-h"><h2>By branch</h2><span class="sp"></span><span class="muted" style="font-size:12px">SAR</span></div>${xTable([{t:'Branch',f:x=>`${bTag(x.b.id)} <b>${esc(x.b.name)}</b>`},{t:'Orders',r:1,f:x=>x.n},{t:'Pcs',r:1,f:x=>x.q},{t:'Sales',r:1,f:x=>`<b>${sar(x.s)}</b>`},{t:'Collected',r:1,f:x=>sar(x.c)},{t:'Due',r:1,f:x=>x.d>0?`<span class="tbad">${sar(x.d)}</span>`:'0'},{t:'Avg order',r:1,f:x=>sar(x.n?x.s/x.n:0)}],brRows,{foot:brRows.length>1?['Total',sumBy(brRows,x=>x.n),sumBy(brRows,x=>x.q),sar(sumBy(brRows,x=>x.s)),sar(sumBy(brRows,x=>x.c)),sar(sumBy(brRows,x=>x.d)),'']:null})}</div>
   <div class="panel"><div class="panel-h"><h2>Payment methods</h2></div><div class="panel-b">${bars(Object.entries(byM).sort((a,b)=>b[1]-a[1]).map(([k,v])=>({k,v})),'sar')}</div></div>
  </div>`:''}
  <div class="grid2">
   <div class="panel"><div class="panel-h"><h2>Workshop output by worker</h2><span class="sp"></span><span class="muted" style="font-size:12px">Pieces · all steps</span></div><div class="panel-b">${bars(Object.values(byW).sort((a,b)=>b.v-a.v).slice(0,15))}</div></div>
   <div class="panel"><div class="panel-h"><h2>Order status</h2><span class="sp"></span><span class="muted" style="font-size:12px">Orders booked in this period</span></div><div class="panel-b">${bars(Object.entries(st).sort((a,b)=>b[1]-a[1]).map(([k,v])=>({k,v})))}</div></div>
  </div>
  <div class="grid2">
   <div class="panel"><div class="panel-h"><h2>Most ordered fabrics</h2><span class="sp"></span><span class="muted" style="font-size:12px">Thobes</span></div><div class="panel-b">${bars(Object.entries(byFab).sort((a,b)=>b[1]-a[1]).slice(0,12).map(([k,v])=>({k,v})))}</div></div>
   <div class="panel"><div class="panel-h"><h2>Most popular styles</h2><span class="sp"></span><span class="muted" style="font-size:12px">Orders</span></div><div class="panel-b">${bars(styles)}</div></div>
  </div>
  <div class="panel"><div class="panel-h"><h2>Top 10 customers</h2><span class="sp"></span><span class="muted" style="font-size:12px">${perLabel(P)}</span></div>${xTable([{t:'#',r:1,f:x=>tops.indexOf(x)+1},{t:'Customer',f:x=>`<b>${esc(x.c.name)}</b>`},{t:'Mobile',f:x=>`<span class="num">${esc(x.c.phone||'')}</span>`},{t:'Orders',r:1,f:x=>x.n},{t:'Pcs',r:1,f:x=>x.q},...(money?[{t:'Total',r:1,f:x=>`<b>${sar(x.t)}</b>`}]:[])],tops,{attr:x=>`data-tc="${x.c.id}"`})}</div>`);
  perBind('repPer',P,reports);
  document.querySelectorAll('[data-tc]').forEach(r=>r.onclick=()=>openCustomer(+r.dataset.tc));
  const head=['Branch','Orders','Pcs',...(money?['Sales','Collected','Due']:[])],rowsP=brRows.map(x=>[x.b.name,x.n,x.q,...(money?[sar2(x.s),sar2(x.c),sar2(x.d)]:[])]);
  document.getElementById('repCsv').onclick=()=>csvOut(`report_${dkey2(P.from)}_${dkey2(P.to)}`,[head,...rowsP,[],['Worker','Pieces'],...Object.values(byW).map(x=>[x.k,x.v]),[],['Method','Amount'],...(money?Object.entries(byM).map(([k,v])=>[k,sar2(v)]):[])]);
  document.getElementById('repPrint').onclick=()=>printRep('Business report',`${B?bname(B):'All branches & factories'} · ${perLabel(P)}`,
    pTiles([...(money?[['Sales booked',sar2(sales)],['Collected',sar2(coll)],['Average order',sar2(bk.length?sales/bk.length:0)],['Still due',sar2(dueB)]]:[]),['Orders',bk.length],['Thobes',pcs],['Delivered pcs',sumBy(dels,d=>d.qty)]])
    +'<h2>By branch</h2>'+pTable(head,rowsP,null,[1,2,3,4,5])+(money?'<h2>Payment methods</h2>'+pTable(['Method','Amount'],Object.entries(byM).map(([k,v])=>[k,sar2(v)]),['Total',sar2(coll)],[1]):'')
    +'<h2>Workshop output by worker</h2>'+pTable(['Worker','Pieces'],Object.values(byW).sort((a,b)=>b.v-a.v).map(x=>[x.k,x.v]),null,[1])
    +'<h2>Top customers</h2>'+pTable(['Customer','Mobile','Orders','Pcs',...(money?['Total']:[])],tops.map(x=>[x.c.name,x.c.phone||'',x.n,x.q,...(money?[sar2(x.t)]:[])]),null,[2,3,4]));
}

/* ================= Settings ================= */
function settings(){
  const secs=[['setBiz','Business'],...(isOwner()?[['flowPanel','Workshop flow']]:[]),['setSync','Shop exe & sync'],['setLogins','Logins & permissions'],['setRoles','What each login can do'],['setPlaces','Branches & factories']];
  V(`<div class="setlay"><nav class="setnav" aria-label="Settings sections">${secs.map(([id,t],i)=>`<a href="#settings" data-sj="${id}" class="${i?'':'on'}">${t}</a>`).join('')}</nav><div class="setmain">
  <div class="panel" id="setBiz"><div class="panel-h"><h2>Business</h2></div><div class="panel-b"><div class="sgrid">
   <div><span>Business name</span><b>Saudi Thobe Men's Tailoring</b><em>AL THOB AL SAUDI · Riyadh</em></div>
   <div><span>Website</span><b class="num">${esc(DOMAIN)}</b><em>Admin, cashier, measurement and workshop links</em></div>
   <div><span>VAT</span><b class="num">${Math.round(VAT_RATE*100)}%</b><em>Included in prices</em></div>
   <div><span>Currency</span><b class="num">SAR</b><em>Saudi riyal</em></div>
   <div><span>Order numbers</span><b class="num">50000 +</b><em>Website orders · the shop exe keeps its own numbers</em></div>
   <div><span>Branches & factories</span><b class="num">${SHOPS().length} · ${FACS().length}</b><em>${pl(workers.length,'person')}</em></div>
  </div></div></div>
  ${isOwner()?flowEditorHtml():''}
  <div id="setSync"></div>
  <div class="panel" id="setLogins"><div class="panel-h"><h2>Logins & permissions</h2><span class="sp"></span><span class="muted" style="font-size:12px">${pl(USERS.length,'login')} · 5 roles</span></div><div class="rows" style="max-height:460px;overflow:auto">
   ${USERS.map((u,i)=>{const a=ACCESS[u.role];return `<div class="row"><div class="avatar">${a.no}</div><div class="grow"><b>${u.name}</b><span>${a.label} · ${u.branch?bname(u.branch):'All branches'}</span></div>${DEMO?`<button class="btn sm" data-try="${i}">Try it</button>`:(u.sid?`<button class="btn sm" data-wapp2="${u.sid}">Link</button>`:'')}</div>`}).join('')}
  </div></div>
  <div class="panel" id="setRoles"><div class="panel-h"><h2>What each login can do</h2></div><div class="rolegrid">${Object.values(ACCESS).map(a=>`<div class="rolec"><div class="rh">${ico(a.icon)}<b>${a.label}</b></div><ul>${a.can.map(c=>`<li>${esc(c)}</li>`).join('')}</ul><span class="muted" style="font-size:11.5px">${a.money?'Sees money':'No prices or money'}${a.stage?' · moves work':''}</span></div>`).join('')}</div></div>
  <div class="panel" id="setPlaces"><div class="panel-h"><h2>Branches & factories</h2><span class="sp"></span><a class="btn sm" href="#branches">Open</a></div>${xTable([{t:'Code',f:b=>bTag(b.id)},{t:'Name',f:b=>`<b>${esc(b.name)}</b>`},{t:'Type',f:b=>b.type==='factory'?'Factory':'Shop'},{t:'City',f:b=>esc(b.city||'')},{t:'Phone',f:b=>`<span class="num">${esc(b.phone||'')}</span>`},{t:'People',r:1,f:b=>workers.filter(w=>w.branch===b.id).length}],BRANCHES,{empty:'No branches yet.'})}</div>
  </div></div>`);
  const sync=document.getElementById('setSync');
  if(typeof LIVE!=='undefined'&&LIVE){sync.innerHTML=`<div class="panel"><div class="panel-h"><h2>Shop exe (AL THOB)</h2></div><div class="panel-b" id="exeBox"><span class="muted">Checking…</span></div></div>`}
  else sync.innerHTML=`<div class="panel"><div class="panel-h"><h2>Shop exe (AL THOB)</h2></div><div class="panel-b"><p class="muted" style="margin:0">In the live site this shows if the AL THOB exe is syncing: last round, and how many customers, orders and payments it sent.</p></div></div>`;
  if(isOwner())flowEditorMount();
  const nav=document.querySelectorAll('[data-sj]');nav.forEach(a=>a.onclick=e=>{e.preventDefault();nav.forEach(x=>x.classList.toggle('on',x===a));const t=document.getElementById(a.dataset.sj);if(t)t.scrollIntoView({behavior:'smooth',block:'start'})});
}

/* ================= Wiring ================= */
document.addEventListener('click',e=>{const t2=e.target.closest('[data-wapp2]');if(t2){workerApp(wk(+t2.dataset.wapp2));return}const t=e.target.closest('[data-try]');if(t){const u=USERS[+t.dataset.try];enterAs(u.role,+t.dataset.try)}});
document.getElementById('switchRole').onclick=showLogin;
document.getElementById('bellBtn').onclick=bellList;
document.getElementById('installBtn').onclick=()=>installScreen(null,ROLE);
document.getElementById('branchSel').onchange=e=>{curBranch=+e.target.value;route()};
document.getElementById('q').addEventListener('input',()=>{const h=(location.hash||'#dashboard').slice(1);
  if(h==='customers')customersView();else if(h==='measurements')measurements();else if(h==='workers')workersView();else if(h==='whatsapp')whatsappView();else if(h==='messages')messagesView();else if(can('orders')){if(h!=='orders'){location.hash='orders';return}ordersView()}});
document.getElementById('themeBtn').onclick=()=>{const r=document.documentElement;const dark=r.dataset.theme?r.dataset.theme==='dark':matchMedia('(prefers-color-scheme: dark)').matches;r.dataset.theme=dark?'light':'dark'};
document.addEventListener('keydown',e=>{if(e.key==='Escape')document.getElementById('layer').innerHTML=''});
addEventListener('hashchange',()=>{document.getElementById('layer').innerHTML='';route()});
/* ================= Numbers per branch, barcodes and the printed invoices (same as the AL THOB exe) =================
   Order no.  : <branch code>-<number>, own series per branch from 50001 (OLY-50001, MLZ-50001 …).
   Invoice no.: <branch code>-INV-<number>, own series per branch from 1001. The branch the shop exe (AL THOB) runs in
                keeps the exe's own invoice number (the exe gives it when the order comes down) – never two invoices.
   Orders made in the shop exe keep the exe's own order / invoice number.
   Prints: A4 tax invoice (InvoiceA4.cs: gold bars, BILL TO / ORDER DETAILS, items, payments & delivery, totals, ZATCA QR)
           and the 80 mm receipt (Docs.Invoice: simplified tax invoice) – with the order's barcode. */
let SHOP={CompanyEn:'AL THOB AL SAUDI',CompanyAr:'الثوب السعودي للخياطة الرجالية',Tagline:'',VatNo:'',CrNo:'',Address:'',Phone:'',Email:'',Currency:'SAR',VatRate:VAT_RATE,PricesIncludeVat:true,logo:'',qr:''};
let EXE_BRANCH=0;   // the branch the shop exe syncs (live: meta/exe)
const CNT={};       // live: the per-branch counters (counters/ord_<branch>, inv_<branch>)
const bcode=id=>((BRANCHES.find(b=>b.id===id)||{}).code||'ST');
const ono=o=>o?(o.bno||('#'+o.rno)):'';
const onoR=r=>{const o=orders.find(x=>x.rno===r);return o?ono(o):'#'+r};
const oinv=o=>!o||o.gift?'':(o.binv||(o.invoiceNo?String(o.invoiceNo):''));
const ordMatch=(o,q)=>{q=String(q||'').trim().toLowerCase();if(!q)return false;return String(o.rno)===q||(o.bno||'').toLowerCase()===q||String(o.bseq||'')===q||(o.binv||'').toLowerCase()===q||String(o.invoiceNo||'')===q||String(o.exeNo||'')===q};
/* the next numbers of a branch (the live layer makes them sure in a transaction) */
function branchNos(branch,gift){
  const os=orders.filter(o=>o.branch===branch);const r={};
  r.bseq=Math.max(50000,+CNT['ord_'+branch]||0,...os.map(o=>+o.bseq||0))+1;r.bno=`${bcode(branch)}-${r.bseq}`;
  if(!gift&&branch!==EXE_BRANCH){r.binvSeq=Math.max(1000,+CNT['inv_'+branch]||0,...os.map(o=>+o.binvSeq||0))+1;r.binv=`${bcode(branch)}-INV-${r.binvSeq}`}
  return r}
/* demo: numbers for the sample orders */
if(typeof LIVE==='undefined'||!LIVE){const by={};orders.slice().sort((a,b)=>a.created-b.created||a.rno-b.rno).forEach(o=>{const k=o.branch;const x=by[k]=by[k]||{o:50000,i:1000};o.bseq=++x.o;o.bno=`${bcode(k)}-${o.bseq}`;if(!o.gift){o.binvSeq=++x.i;o.binv=`${bcode(k)}-INV-${o.binvSeq}`}})}

/* ---------- CODE128 (set B) as SVG ---------- */
const C128=['212222','222122','222221','121223','121322','131222','122213','122312','132212','221213','221312','231212','112232','122132','122231','113222','123122','123221','223211','221132','221231','213212','223112','312131','311222','321122','321221','312212','322112','322211','212123','212321','232121','111323','131123','131321','112313','132113','132311','211313','231113','231311','112133','112331','132131','113123','113321','133121','313121','211331','231131','213113','213311','213131','311123','311321','331121','312113','312311','332111','314111','221411','431111','111224','111422','121124','121421','141122','141221','112214','112412','122114','122411','142112','142211','241211','221114','413111','241112','134111','111242','121142','121241','114212','124112','124211','411212','421112','421211','212141','214121','412121','111143','111341','131141','114113','114311','411113','411311','113141','114131','311141','411131','211412','211214','211232','2331112'];
function code128svg(text,h=46,mod=2){
  text=String(text||'').replace(/[^\x20-\x7e]/g,'');if(!text)return '';
  const codes=[104];for(const ch of text)codes.push(ch.charCodeAt(0)-32);
  let sum=104;codes.slice(1).forEach((c,i)=>sum+=c*(i+1));codes.push(sum%103,106);
  let x=10*mod,bars='';
  codes.forEach(c=>{const p=C128[c];for(let i=0;i<p.length;i++){const w=+p[i]*mod;if(i%2===0)bars+=`<rect x="${x}" y="0" width="${w}" height="${h}"/>`;x+=w}});
  const W=x+10*mod;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${h}" width="${W}" height="${h}" preserveAspectRatio="none" shape-rendering="crispEdges" style="background:#fff"><g fill="#000">${bars}</g></svg>`}
const barcodeHtml=(text,h=46,w='')=>`<div class="bc" style="${w?`width:${w};`:''}"><div class="bcs">${code128svg(text,h)}</div><div class="bct">${esc(text)}</div></div>`;

/* ---------- ZATCA phase-1 QR (seller, VAT no., time, total, VAT) ---------- */
function zatcaTlv(seller,vatNo,time,total,vat){
  const enc=new TextEncoder(),parts=[];
  [[1,seller],[2,vatNo],[3,time.toISOString().replace(/\.\d+Z$/,'Z')],[4,(+total).toFixed(2)],[5,(+vat).toFixed(2)]].forEach(([t,v])=>{const b=enc.encode(String(v||''));parts.push(t,b.length,...b)});
  let s='';new Uint8Array(parts).forEach(b=>s+=String.fromCharCode(b));return btoa(s)}
function qrDataUrl(text,size=220){try{if(typeof QRCode==='undefined')return '';const d=document.createElement('div');d.style.cssText='position:fixed;left:-9999px';document.body.appendChild(d);
  new QRCode(d,{text,width:size,height:size,correctLevel:QRCode.CorrectLevel.M});const c=d.querySelector('canvas');const u=c?c.toDataURL('image/png'):'';d.remove();return u}catch(e){return ''}}

/* ---------- the order's money, payments and deliveries (as the exe's InvoiceA4 loads them) ---------- */
function invData(o){
  const rate=+SHOP.VatRate||VAT_RATE,incl=SHOP.PricesIncludeVat!==false;
  const L=[...(o.lines||[]).map(l=>({...l,src:l.src})),...(o.emb||[]).map(e=>({src:'EMB',code:e.code,item:e.item,qty:e.qty,rate:e.rate}))];
  if(!L.length)L.push({src:'IN',code:'',item:o.fabric||'Thobe',qty:o.qty,rate:o.price||(o.qty?o.total/o.qty:o.total)});
  const gross=o.gross!=null?+o.gross:L.reduce((s,l)=>s+(+l.qty||0)*(+l.rate||0),0),disc=+o.disc||0,total=+o.total||0,vat=o.vat!=null?+o.vat:vatOf(total);
  const pays=payLog.filter(p=>p.rno===o.rno).sort((a,b)=>(a.t==='Deposit'?0:1)-(b.t==='Deposit'?0:1)||a.d-b.d);
  const down=pays.filter(p=>p.t==='Deposit'),later=pays.filter(p=>p.t!=='Deposit'&&p.amt>0);
  const dels=delLog.filter(d=>d.rno===o.rno).sort((a,b)=>a.d-b.d);const x=oInfo(o);
  const byM={};pays.filter(p=>p.amt>0).forEach(p=>{const k=pmName(p)||'-';byM[k]=(byM[k]||0)+p.amt});
  return{rate,incl,L,gross,disc,total,vat,paid:+o.paid||0,due:Math.round((total-(+o.paid||0))*100)/100,pays,down,later,dels,x,
    downAmt:down.reduce((s,p)=>s+p.amt,0),downDate:down[0]?down[0].d:o.created,laterAmt:later.reduce((s,p)=>s+p.amt,0),laterDate:later.length?later[later.length-1].d:null,
    methods:Object.entries(byM).map(([k,v])=>`${+v.toFixed(2)} ${k}`).join(' + '),branch:BRANCHES.find(b=>b.id===o.branch)||{}}}
const dmy=d=>d?new Date(d).toLocaleDateString('en-GB',{day:'2-digit',month:'2-digit',year:'numeric'}):'';
const logoSrc=()=>SHOP.logo||(location.origin+'/img/logo-print.jpg');
const shopAddr=b=>[b.address,b.city].filter(Boolean).join(', ')||SHOP.Address;
function printWin(title,css,body,pageCss){const w=window.open('','_blank');if(!w){toast('Allow pop-ups to print');return null}
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title><style>*{box-sizing:border-box}body{margin:0;font-family:Arial,Helvetica,sans-serif;color:#111;-webkit-print-color-adjust:exact;print-color-adjust:exact}
   .bc{display:inline-flex;flex-direction:column;align-items:center}.bcs svg{display:block;width:100%;height:auto}.bct{font:700 12px Arial;letter-spacing:.06em;margin-top:2px}${css}@page{${pageCss}}</style></head><body>${body}
   <script>window.onload=()=>setTimeout(()=>print(),250)<\/script></body></html>`);w.document.close();return w}

/* ---------- A4 tax invoice: the exe's InvoiceA4 (design 810 px wide) ---------- */
function printInvoiceA4(o){
  if(o.gift){toast('A free gift has no invoice');return}
  const d=invData(o),c=cust(o.cid),b=d.branch,M=sar2,inv=oinv(o)||'(pending)';
  const payState=d.due<=0.5?'PAID':'DUE '+M(d.due),delState=d.x.dq>=o.qty?'delivered':d.x.dq>0?'partly delivered':'pending delivery';
  const qr=SHOP.VatNo?qrDataUrl(zatcaTlv(SHOP.CompanyAr||SHOP.CompanyEn,SHOP.VatNo,o.created,d.total,d.vat)):'';
  const rows=[];for(let i=0;i<12;i++){const l=d.L[i];if(!l){rows.push('<tr class="e"><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>');continue}
    const amt=(+l.qty||0)*(+l.rate||0),tx=d.incl?amt/(1+d.rate):amt,v=d.incl?amt-tx:amt*d.rate,tot=d.incl?amt:amt+v;
    rows.push(`<tr><td class="c">${i+1}</td><td class="c">${esc(l.item)}${l.src==='OUT'?' (قماش العميل)':''}</td><td class="c">${l.code||''}</td><td class="c">${+l.qty}</td><td class="r">${M(l.rate)}</td><td class="r">${M(tx)}</td><td class="r">${M(v)}</td><td class="r">${M(tot)}</td></tr>`)}
  const subEx=d.incl?d.gross/(1+d.rate):d.gross,discEx=d.incl?d.disc/(1+d.rate):d.disc,discPct=d.gross>0?d.disc/d.gross*100:0;
  const lastDel=d.dels.length?d.dels[d.dels.length-1].d:null,pend=Math.max(0,o.qty-d.x.dq);
  const LR=(l,v,cls='')=>`<tr><th>${l}</th><td class="${cls}">${esc(v??'')}</td></tr>`;
  const css=`.pg{width:810px;margin:0 auto;position:relative;padding:8px 0;font-size:12px}
   .hd{display:flex;gap:12px;align-items:flex-start;min-height:160px}.hd .lg{width:160px;height:115px;margin-top:12px;display:flex;align-items:center;justify-content:center}.hd .lg img{max-width:100%;max-height:100%}
   .hd .tx{flex:1;text-align:right}.hd .en{color:#b8860b;font-weight:700;font-size:22px;margin-top:20px}.hd .ar{color:#b8860b;font-weight:700;font-size:16px;margin:2px 0 6px}.hd .tx div{margin:3px 0}
   .bar{background:#bf9000;color:#fff;font-weight:700;text-align:center;font-size:16px;padding:7px;margin:6px 0 14px}
   .two{display:grid;grid-template-columns:423px 383px;gap:4px}.two h3{margin:0;background:#bf9000;color:#fff;font-size:11px;padding:6px 4px}
   .two table{width:100%;border-collapse:collapse}.two th{font-size:10.5px;text-align:left;padding:4px;border-bottom:1px solid #bebebe;width:63%;white-space:nowrap}.two td{font-size:13px;padding:3px;border-bottom:1px solid #bebebe}
   .rt th{width:50%}.rt td{text-align:center;font-weight:700;background:#fff2cc}.rt .bl{color:#0033cc}.rt .gr{color:#008000}.rt .rd{color:#b22222}.rt .pm{background:#fff;outline:1px solid #0033cc;outline-offset:-3px;font-size:11px}.rt .st{background:#fff;font-size:11px}
   .it{width:100%;border-collapse:collapse;margin-top:16px}.it th{background:#bf9000;color:#fff;font-size:11px;height:46px;border-right:1px solid #e8d8a8}.it td{height:23px;border-bottom:1px solid #bebebe;border-right:1px solid #bebebe;padding:0 4px;font-size:11.5px}.it tr.e td{background:#fef9ec}.it tbody tr:last-child td{border-bottom:2px solid #b8860b}
   .c{text-align:center}.r{text-align:right}
   .bt{display:grid;grid-template-columns:423px 383px;gap:4px;margin-top:20px}.pd table,.tt table{width:100%;border-collapse:collapse}.pd .h td{background:#fff2cc;color:#5a3c00;font-weight:700;font-size:12px;padding:4px}.pd td{border-bottom:1px solid #bebebe;padding:2px 4px;font-size:11px}.pd td.v{text-align:right;font-weight:700;font-size:13px}.pd td.d{color:#888;text-align:center}
   .tt td{padding:3px 4px;font-size:12px;text-align:right}.tt .p{color:#0033cc;font-weight:700;background:#fff2cc;text-align:center;width:66px}.tt .big td{background:#fff2cc;font-weight:700;font-size:15px}
   .strip{background:#fff2cc;border:1px solid #e6c878;text-align:center;font-weight:700;padding:6px;margin-top:14px;font-size:12px}
   .ft{display:flex;align-items:flex-start;gap:16px;margin-top:10px;min-height:130px}.ft img{width:128px;height:128px;border:1px solid #000;padding:3px}.ft .bc{width:250px;margin-top:10px}
   .sg{flex:1;display:flex;justify-content:flex-end;gap:60px;margin-top:10px}.sg div{width:185px;border-top:1px solid #888;text-align:center;color:#888;font-size:10px;padding-top:2px}
   .foot{text-align:center;font-size:12px;margin-top:8px}`;
  const body=`<div class="pg">
   <div class="hd"><div class="lg"><img src="${logoSrc()}" alt=""></div><div class="tx"><div class="en">${esc(SHOP.CompanyEn)}</div><div class="ar">${esc(SHOP.CompanyAr)}   ${esc(SHOP.Tagline)}</div>
    <div><b>VAT Reg. No. / الرقم الضريبي: ${esc(SHOP.VatNo)}</b></div><div>CR No. / السجل التجاري: ${esc(SHOP.CrNo)}</div><div>${esc(b.name?`${b.name} – ${shopAddr(b)}`:SHOP.Address)}</div><div>${esc(b.phone||SHOP.Phone)}${SHOP.Email?'   |   '+esc(SHOP.Email):''}</div></div></div>
   <div class="bar">TAX INVOICE   /   فاتورة ضريبية</div>
   <div class="two"><div><h3>BILL TO  /  بيانات العميل</h3><table>${LR('Customer Name / اسم العميل',c.name)}${LR('Customer No / رقم العميل',c.id,'b')}${LR('Mobile / الجوال',c.phone)}${LR('Delivery Date / تاريخ التسليم',dmy(o.due))}${LR('Address / العنوان',c.addr||'')}${LR('Customer VAT No / الرقم الضريبي',c.vat||'')}</table></div>
    <div class="rt"><h3>ORDER DETAILS  /  بيانات الطلب</h3><table>${LR('Order No / رقم الطلب',ono(o).replace(/^#/,''),'bl')}${LR('Invoice No / رقم الفاتورة',inv,'gr')}${LR('Booking Date / تاريخ الحجز',dmy(o.created),'gr')}${LR('Print Date / تاريخ الطباعة',dmy(new Date()),'bl')}${LR('Payment Method / طريقة الدفع',d.methods||'','bl pm')}${LR('Status / الحالة',`${payState} – ${delState}`,(d.due<=0.5?'gr':'rd')+' st')}</table></div></div>
   <table class="it"><thead><tr><th style="width:60px">#</th><th style="width:202px">Item / الصنف</th><th style="width:68px">Code / الرمز</th><th style="width:95px">Qty / الكمية</th><th style="width:97px">Unit Price /<br>السعر</th><th style="width:103px">Taxable / المبلغ</th><th style="width:95px">VAT ${Math.round(d.rate*1000)/10}% /<br>الضريبة</th><th style="width:90px">Total / الإجمالي</th></tr></thead><tbody>${rows.join('')}</tbody></table>
   <div class="bt"><div class="pd"><table><tr class="h"><td colspan="2">PAYMENTS &amp; DELIVERY  /  الدفعات والتسليم</td><td class="d" style="background:#fff;color:#111;font-weight:400">Date / التاريخ</td></tr>
     <tr><td><b>Down Payment / العربون</b></td><td class="v">${M(d.downAmt)}</td><td class="d">${dmy(d.downDate)}</td></tr>
     <tr><td><b>Paid Later / دفعات لاحقة</b></td><td class="v">${M(d.laterAmt)}</td><td class="d">${dmy(d.laterDate)}</td></tr>
     <tr><td><b>Discount on Due / خصم</b></td><td class="v">${M(0)}</td><td class="d"></td></tr>
     <tr><td><b>Total Qty / إجمالي القطع</b></td><td class="v">${o.qty}</td><td class="d">${dmy(o.created)}</td></tr>
     <tr><td><b>Delivered Qty / المسلَّم</b></td><td class="v">${d.x.dq}</td><td class="d">${d.x.dq?dmy(lastDel):''}</td></tr>
     <tr><td><b>Pending Qty / المتبقي</b></td><td class="v" style="${pend?'color:red':''}">${pend}</td><td class="d">${dmy(o.due)}</td></tr></table></div>
    <div class="tt"><table><tr><td>Subtotal (Excl. VAT) / المجموع قبل الضريبة</td><td></td><td>${M(subEx)}</td></tr><tr><td>Discount / الخصم</td><td class="p">${+discPct.toFixed(2)}%</td><td>${M(discEx)}</td></tr>
     <tr><td>Taxable Amount / الوعاء الضريبي</td><td></td><td>${M(d.total-d.vat)}</td></tr><tr><td>VAT ${Math.round(d.rate*1000)/10}% / ضريبة القيمة المضافة</td><td class="p">${(d.rate*100).toFixed(1)}%</td><td>${M(d.vat)}</td></tr>
     <tr class="big"><td>TOTAL (Incl. VAT) / الإجمالي مع الضريبة</td><td></td><td>${M(d.total)}</td></tr><tr><td>Amount Paid / المبلغ المدفوع</td><td></td><td>${M(d.paid)}</td></tr><tr><td>Balance Due / المبلغ المتبقي</td><td></td><td>${M(d.due)}</td></tr></table></div></div>
   <div class="strip">Total in ${esc(SHOP.Currency||'SAR')} (Incl. VAT): ${M(d.total)}   |   Paid: ${M(d.paid)}   |   Balance Due: ${M(d.due)}   |   الإجمالي شامل الضريبة</div>
   <div class="ft">${qr?`<img src="${qr}" alt="">`:''}${SHOP.qr?`<img src="${SHOP.qr}" alt="" style="border:0">`:''}${barcodeHtml(ono(o).replace(/^#/,''),44)}<div class="sg"><div>Received By / استلمت بواسطة</div><div>Authorised Signature / التوقيع المعتمد</div></div></div>
   <div class="foot">${esc(SHOP.CompanyEn)}  –  ${esc(SHOP.CompanyAr)}  –  ${esc(SHOP.Tagline)}   |   Thank you for your business   |   شكراً لتعاملكم معنا</div></div>
  ${d.pays.length?`<div class="pg" style="page-break-before:always"><div class="bar">PAYMENT HISTORY   /   سجل الدفعات</div><table class="it"><thead><tr><th>#</th><th>Date / التاريخ</th><th>Receipt</th><th>Paid / المدفوع</th><th>Discount / خصم</th><th>Method / الطريقة</th><th>Status</th><th>Deliv. Qty /<br>مسلَّم</th></tr></thead><tbody>
   ${d.pays.map((p,i)=>{const dq=d.dels.filter(x=>+x.d===+p.d&&p.t!=='Deposit').reduce((s,x)=>s+x.qty,0);return `<tr><td class="c">${i+1}</td><td class="c">${dmy(p.d)}</td><td class="c">${p.t==='Deposit'?'Down Pmt':esc(p.ref||'')}</td><td class="r">${M(p.amt)}</td><td class="r">${M(0)}</td><td class="c">${esc(pmName(p))}</td><td class="c">${p.t==='Deposit'?'BOOKING':p.amt<0?'REFUND':'PAID'}</td><td class="c">${dq||0}</td></tr>`}).join('')}</tbody></table></div>`:''}`;
  printWin(`Invoice A4 ${inv}`,css,body,'size:A4;margin:8mm');
}

/* ---------- 80 mm receipt: the exe's Docs.Invoice (simplified tax invoice) ---------- */
const RC_CSS=`.rc{width:72mm;margin:0 auto;font-size:11.5px;padding:2mm 0}.ce{text-align:center}.ce img{max-width:150px;max-height:110px}.t1{font-size:15px;font-weight:700}.t2{font-size:14px;font-weight:700}.sm{font-size:10.5px}
   .rule{border-top:1px dashed #000;margin:4px 0}.dbl{border-top:3px double #000;margin:4px 0}.rw{display:flex;justify-content:space-between;gap:6px;padding:1px 0}.rw span{flex:0 0 47%}.rw b{text-align:right;font-weight:400}.rw.bd b,.rw.bd span{font-weight:700}.rw.big b,.rw.big span{font-size:14px}
   .ln{font-size:11px;margin-top:2px}.qr{text-align:center;margin:6px 0}.qr img{width:150px;height:150px}.bc{width:100%;margin:4px 0}`+`.pb{page-break-before:always;break-before:page}.tag{border:2px dashed #000;padding:6px;margin-top:8px;text-align:center}.tag .big{font-size:22px;font-weight:700}.tag .mid{font-size:15px;font-weight:700}`;
function rcBody(o){
  const d=invData(o),c=cust(o.cid),b=d.branch,M=sar2;
  const qr=SHOP.VatNo?qrDataUrl(zatcaTlv(SHOP.CompanyAr||SHOP.CompanyEn,SHOP.VatNo,o.created,d.total,d.vat),200):'';
  const R=(l,v,cls='')=>v===''||v==null?'':`<div class="rw ${cls}"><span>${l}</span><b>${esc(v)}</b></div>`;
  const body=`<div class="rc">
   <div class="ce"><img src="${logoSrc()}" alt=""><div class="t1" dir="rtl">${esc(SHOP.CompanyAr)}</div><div class="t2">${esc(SHOP.CompanyEn)}</div><div class="sm">${esc(SHOP.Tagline)}</div>
    <div class="sm">VAT No / الرقم الضريبي: ${esc(SHOP.VatNo)}</div>${SHOP.CrNo?`<div class="sm">CR No / السجل التجاري: ${esc(SHOP.CrNo)}</div>`:''}<div class="sm">${esc(b.name?`${b.name} – ${shopAddr(b)}`:SHOP.Address)}</div><div class="sm">${esc(b.phone||SHOP.Phone)}</div></div>
   <div class="rule"></div><div class="ce"><b>SIMPLIFIED TAX INVOICE</b><br><b>فاتورة ضريبية مبسطة</b></div><div class="rule"></div>
   ${R('Invoice No / رقم الفاتورة',oinv(o)||'(pending)','bd')}<div class="rw bd big"><span>Order No / رقم الطلب</span><b>${esc(ono(o).replace(/^#/,''))}</b></div>
   ${R('Date / التاريخ',dmy(o.created))}${R('Customer No / رقم العميل',c.id)}${R('Customer / العميل',c.name)}${R('Mobile / الجوال',c.phone)}${R('Delivery / التسليم',dmy(o.due))}${o.sample?R('Sample / عينة','Yes / نعم'):''}
   <div class="rule"></div>
   ${d.L.map(l=>`<div class="ln">${esc(l.item)}${l.code?'  ['+esc(l.code)+']':''}${l.src==='OUT'?'  (قماش العميل)':''}</div><div class="rw"><span>   ${+l.qty} x ${M(l.rate)}</span><b>${M((+l.qty||0)*(+l.rate||0))}</b></div>`).join('')}
   <div class="rule"></div>
   ${R('Subtotal / المجموع',M(d.gross))}${d.disc>0.005?R('Discount / الخصم','-'+M(d.disc)):''}${R('Taxable / الخاضع للضريبة',M(d.total-d.vat))}${R(`VAT ${Math.round(d.rate*1000)/10}% / الضريبة`,M(d.vat))}
   <div class="dbl"></div><div class="rw bd big"><span>TOTAL / الإجمالي</span><b>${M(d.total)} ${esc(SHOP.Currency||'SAR')}</b></div><div class="dbl"></div>
   ${R('Paid / المدفوع',M(d.paid))}<div class="rw bd"><span>Balance / المتبقي</span><b>${M(d.due)}</b></div>${R('Payment / الدفع',o.pm||'')}
   <div class="rule"></div>${barcodeHtml(ono(o).replace(/^#/,''),52)}
   ${qr?`<div class="qr"><img src="${qr}" alt=""></div>`:''}${SHOP.qr?`<div class="qr"><img src="${SHOP.qr}" alt="" style="width:110px;height:110px"></div>`:''}
   <div class="ce" style="font-weight:700;margin-top:4px">شكراً لزيارتكم  -  Thank you</div></div>`;
  return body}


/* customer's own fabric (قماش العميل): the customer copy, then the tag pinned on the fabric for the tailoring factory (exe: Docs.FabricReceipt) */
const outFab=o=>(o.lines||[]).filter(l=>l.src==='OUT');
function fabBody(o){
  const c=cust(o.cid),L=outFab(o),qty=+L.reduce((s,l)=>s+(+l.qty||0),0).toFixed(2),b=BRANCHES.find(x=>x.id===o.branch)||{},no=ono(o).replace(/^#/,'');
  const R=(l,v,cls='')=>v===''||v==null?'':`<div class="rw ${cls}"><span>${l}</span><b>${esc(v)}</b></div>`;
  return `<div class="rc"><div class="ce"><img src="${logoSrc()}" alt=""><div class="t1" dir="rtl">${esc(SHOP.CompanyAr)}</div><div class="t2">${esc(SHOP.CompanyEn)}</div><div class="sm">${esc(b.name?`${b.name} – ${shopAddr(b)}`:SHOP.Address)}</div><div class="sm">${esc(b.phone||SHOP.Phone)}</div></div>
   <div class="rule"></div><div class="ce"><b>CUSTOMER FABRIC RECEIPT</b><br><b>إيصال استلام قماش العميل</b></div><div class="rule"></div>
   <div class="rw bd big"><span>Order No / رقم الطلب</span><b>${esc(no)}</b></div>${R('Customer / العميل',c.name,'bd')}${R('Mobile / الجوال',c.phone)}${R('Received / تاريخ الاستلام',dmy(o.created))}
   <div class="rule"></div>${L.map(l=>R('  '+esc(l.item),+l.qty)).join('')}<div class="dbl"></div>
   <div class="rw bd big"><span>Fabric qty / عدد القماش</span><b>${qty}</b></div><div class="rw bd big"><span>Delivery / موعد التسليم</span><b>${dmy(o.due)}</b></div><div class="dbl"></div>
   <div class="ce" style="font-weight:700">يرجى إحضار هذا الإيصال عند الاستلام</div><div class="ce sm">Please bring this receipt at delivery</div>
   <div class="tag"><div class="mid">قماش العميل / CUSTOMER FABRIC</div><div class="big">${esc(no)}</div><div class="mid" dir="auto">${esc(c.name)}</div><div class="mid">العدد / Qty: ${qty}</div>
    <div class="mid">التسليم / Delivery: ${dmy(o.due)}</div><div class="sm" style="margin-top:3px">${esc(bname(o.branch))} → <b>${esc(bname(o.made))}</b>${o.tailor?' · '+esc(wk(o.tailor).name):''}</div>${barcodeHtml(no,46)}</div></div>`}
function printReceipt(o,fab){
  const parts=[];if(!o.gift)parts.push(rcBody(o));if(fab&&outFab(o).length)parts.push(fabBody(o));
  if(!parts.length){toast('A free gift has no invoice');return}
  printWin(`Invoice ${oinv(o)||ono(o)}`,RC_CSS,parts.map((p,i)=>i?`<div class="pb">${p}</div>`:p).join(''),'size:80mm auto;margin:3mm')}
function printFabric(o){if(!outFab(o).length){toast('No customer fabric in this order');return}printWin(`Fabric ${ono(o)}`,RC_CSS,fabBody(o),'size:80mm auto;margin:3mm')}
/* which one: receipt or A4 */
function printOrder(o){
  const close=drawer(`Print ${ono(o)}`,`<div class="muted" style="font-size:13px">${esc(cust(o.cid).name)} · invoice ${esc(oinv(o)||(o.gift?'free gift':'pending'))}</div>`,
   `<div style="display:grid;gap:10px"><button class="btn pri" id="prR" style="justify-content:center;padding:14px">🧾 Receipt (80 mm)</button><button class="btn" id="prA" style="justify-content:center;padding:14px">📄 A4 tax invoice</button>${outFab(o).length?'<button class="btn" id="prF" style="justify-content:center;padding:14px">🧵 Customer fabric receipt + tag</button>':''}
    <div style="text-align:center;margin-top:8px">${barcodeHtml(ono(o).replace(/^#/,''),50,'260px')}</div></div>`,'');
  document.getElementById('prR').onclick=()=>{close();printReceipt(o)};document.getElementById('prA').onclick=()=>{close();printInvoiceA4(o)};const pf=document.getElementById('prF');if(pf)pf.onclick=()=>{close();printFabric(o)};
}

/* ---------- measurement sheet header (order no. + barcode) and its print ---------- */
function jHeadHtml(o,c){
  return `<div class="jhd"><div class="jhb">${o?barcodeHtml(ono(o).replace(/^#/,''),40):'<span class="muted">No order chosen</span>'}</div>
   <div class="jhi"><div><span>رقم أمر التشغيل · Order</span><b class="num">${o?esc(ono(o).replace(/^#/,'')):'—'}</b></div><div><span>العميل · Customer</span><b class="num">${c?c.id:''}</b></div>
    <div><span>الاسم · Name</span><b dir="auto">${c?esc(c.name):''}</b></div><div><span>الجوال · Mobile</span><b class="num">${c?esc(c.phone):''}</b></div>
    <div><span>تاريخ أمر التشغيل · Booked</span><b class="num">${o?dmy(o.created):''}</b></div><div><span>التسليم · Delivery</span><b class="num">${o?dmy(o.due):''}</b></div><div><span>عدد الثياب · Pcs</span><b class="num">${o?o.qty:''}</b></div></div></div>`}
function printSheet(meas,o,c){
  const host=document.createElement('div');host.style.cssText='position:fixed;left:-10000px;top:0;width:1080px';document.body.appendChild(host);
  const s=jSheet(host,JSON.parse(JSON.stringify(meas||{})),{ro:true});host.style.width='1080px';s.fit();
  host.querySelectorAll('input,textarea').forEach(e=>{if(e.tagName==='TEXTAREA')e.textContent=e.value;else e.setAttribute('value',e.value)});
  host.querySelectorAll('select').forEach(e=>{[...e.options].forEach(op=>{if(op.selected)op.setAttribute('selected','')})});
  const css=[...document.querySelectorAll('style')].map(x=>x.textContent).join('\n');
  const html=host.innerHTML;host.remove();
  const w=window.open('','_blank');if(!w){toast('Allow pop-ups to print');return}
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><base href="${location.origin}/"><title>Measurement ${esc(o?ono(o):c?c.name:'')}</title><style>${css}
   body{background:#fff;margin:0;padding:6px;color:#000;-webkit-print-color-adjust:exact;print-color-adjust:exact}.jhd{margin-bottom:4px}@page{size:A4 landscape;margin:6mm}</style></head><body>${jHeadHtml(o,c)}<div class="jwrap" style="width:1080px">${html}</div>
   <script>window.onload=()=>setTimeout(()=>print(),500)<\/script></body></html>`);w.document.close();
}

/* ---------- the order's payments and deliveries, one line each (order drawer) ---------- */
function payHist(o){
  const pays=payLog.filter(p=>p.rno===o.rno).sort((a,b)=>a.d-b.d||(a.t==='Deposit'?-1:1)),dels=delLog.filter(x=>x.rno===o.rno).sort((a,b)=>a.d-b.d);
  const used=new Set(),ev=[];
  pays.forEach(p=>{let dq=0;if(p.t!=='Deposit'&&p.amt>0){dels.forEach(x=>{if(!used.has(x)&&sameDay(x.d,d0(p.d))){used.add(x);dq+=+x.qty||0}})}
    ev.push({d:p.d,type:p.amt<0?'Refund':p.t==='Deposit'?'Down payment':dq?'Payment + delivery':'Payment',m:pmName(p),ref:p.ref||'',amt:p.amt,dq,by:p.by||(p.exe?'Shop exe':'')})});
  dels.filter(x=>!used.has(x)).forEach(x=>ev.push({d:x.d,type:'Delivery only',m:'',ref:'',amt:0,dq:+x.qty||0,by:x.by||''}));
  ev.sort((a,b)=>a.d-b.d);
  // thobes taken while money was still due: the balance left at that moment
  {const total=+o.total||0,early=Math.max(0,Math.round(((+o.paid||0)-sumBy(ev,e=>e.amt))*100)/100);let paid=early;
   ev.forEach(e=>{paid+=e.amt;if(e.dq>0){const left=Math.round((total-paid)*100)/100;if(left>0.5){e.dueLeft=left;if(e.type==='Delivery only')e.type='Delivered with due'}}})}
  const listed=Math.round(sumBy(ev,e=>e.amt)*100)/100,gap=Math.round(((+o.paid||0)-listed)*100)/100;
  const byM={};ev.filter(e=>e.amt>0).forEach(e=>{byM[e.m||'—']=(byM[e.m||'—']||0)+e.amt});
  const n=ev.filter(e=>e.amt>0).length+(gap>0.5?1:0);
  const C={'Down payment':'s-info','Payment':'s-ready','Payment + delivery':'s-ready','Delivery only':'s-wait','Delivered with due':'s-late','Refund':'s-late'};
  const due=Math.round(((+o.total||0)-(+o.paid||0))*100)/100,taken=oInfo(o).dq;
  return `<div><p class="h4">Payments & deliveries <span class="muted" style="font-weight:500">· ${n?`${n} time${n>1?'s':''} paid`:'no payment yet'}${Object.keys(byM).length?' · '+Object.entries(byM).map(([k,v])=>`${esc(k)} ${sar2(v)}`).join(' + '):''}</span></p>
   ${taken>0&&due>0.5?`<div class="msg" style="border-color:var(--bad);background:var(--bad-bg);color:var(--bad);margin-bottom:8px;font-weight:600">⚠ Customer took ${taken} of ${o.qty} thobe${o.qty>1?'s':''} but <b>${sar2(due)} SAR</b> is still due · الثوب مستلم والمبلغ متبقي</div>`:''}
   <div class="rows" style="border:1px solid var(--line);border-radius:8px">${ev.map((e,i)=>`<div class="row" style="padding-block:9px;gap:10px"><span class="num muted" style="width:18px">${i+1}</span>
     <div class="grow"><b style="display:flex;gap:6px;align-items:center;flex-wrap:wrap"><span class="pill ${C[e.type]}">${e.type}</span>${e.m?`<span style="font-weight:500">${esc(e.m)}</span>`:''}</b>
      <span>${e.d.toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short',year:'numeric'})}${e.dq?` · ${e.dq} pcs delivered`:''}${e.dueLeft?` · <b style="color:var(--bad)">${sar2(e.dueLeft)} still due</b>`:''}${e.ref?' · ref '+esc(e.ref):''}${e.by?' · '+esc(e.by):''}</span></div>
     ${e.amt?`<b class="num" style="color:${e.amt<0?'var(--bad)':'var(--ok)'}">${e.amt<0?'−':''}${sar2(Math.abs(e.amt))}</b>`:''}</div>`).join('')}
    ${gap>0.5?`<div class="row" style="padding-block:9px"><span class="num muted" style="width:18px">·</span><div class="grow"><b style="font-weight:500">Earlier payment</b><span>not in the payment list (older than the loaded days, or from the shop's old records)</span></div><b class="num" style="color:var(--ok)">${sar2(gap)}</b></div>`:''}
    ${!ev.length&&gap<=0.5?'<div class="empty" style="padding:14px">No payments or deliveries yet.</div>':''}</div></div>`}

/* thobes of some orders: delivered / ready (waiting for the customer) / still in the workshop */
function thobeState(os){let pcs=0,del=0,rdy=0;os.forEach(o=>{const x=oInfo(o),q=+o.qty||0;pcs+=q;del+=Math.min(q,x.dq);if(o.st==='ready'||o.st==='done')rdy+=Math.max(0,q-x.dq)});return{pcs,del,rdy,work:Math.max(0,pcs-del-rdy)}}
const thobePills=t=>[t.del?`<span class="pill s-done">Delivered ${t.del}/${t.pcs}</span>`:'',t.rdy?`<span class="pill s-ready">Ready ${t.rdy}</span>`:'',t.work?`<span class="pill s-cut">In work ${t.work}</span>`:''].filter(Boolean).join(' ')||'—';
/* ---------- one customer in a drawer (same page): his orders, money, payments, measurement and a reminder ---------- */
function openCustomer(cid){
  const c=customers.find(x=>x.id===cid);if(!c){toast('Customer not found');return}
  const money=RA().money,os=orders.filter(o=>o.cid===cid).sort((a,b)=>b.created-a.created);
  const tot=sumBy(os,o=>o.total),paid=sumBy(os,o=>o.paid),due=Math.round((tot-paid)*100)/100,pcs=sumBy(os,o=>o.qty);
  const pays=payLog.filter(p=>os.some(o=>o.rno===p.rno)).sort((a,b)=>b.d-a.d);
  const taken=os.filter(o=>{const x=oInfo(o);return x.dq>0&&x.due>0.5}),ts=thobeState(os);
  const close=drawer(esc(c.name),`<div class="muted num" style="font-size:13px">Customer ${c.id} · ${esc(c.phone||'')} · ${esc(bname(c.branch))}</div>`,
   `${taken.length?`<div class="msg" style="border-color:var(--bad);background:var(--bad-bg);color:var(--bad);font-weight:600">⚠ Took thobes but still owes money on ${pl(taken.length,'order')}: ${taken.map(o=>esc(ono(o))).join(', ')}</div>`:''}
    <div class="kv"><div><span>Orders</span><b>${os.length}</b></div><div><span>Thobes</span><b>${pcs}</b></div><div><span>Last order</span><b style="font-size:13px">${os[0]?fmtD(os[0].created):'—'}</b></div>
     <div><span>Delivered</span><b style="color:var(--muted)">${ts.del}</b></div><div><span>Ready · not taken</span><b style="color:var(--ok)">${ts.rdy}</b></div><div><span>In the workshop</span><b style="color:var(--warn)">${ts.work}</b></div>
     ${money?`<div><span>Total</span><b>${sar(tot)}</b></div><div><span>Paid</span><b style="color:var(--ok)">${sar(paid)}</b></div><div><span>Due</span><b style="color:${due>0.5?'var(--bad)':'var(--ok)'}">${sar(due)}</b></div>`:''}</div>
    <div><p class="h4">Orders</p>${xTable([{t:'Order',f:o=>`<b class="num">${esc(ono(o))}</b>`},{t:'Booked',f:o=>fmtD(o.created)},{t:'Pcs',r:1,f:o=>o.qty},{t:'Delivered',r:1,f:o=>`${oInfo(o).dq}/${o.qty}`},...(money?[{t:'Total',r:1,f:o=>sar2(o.total)},{t:'Due',r:1,f:o=>o.total-o.paid>0.5?`<b class="tbad">${sar2(o.total-o.paid)}</b>`:'—'}]:[]),{t:'Status',f:o=>{const x=oInfo(o);return `<span class="pill ${WHERE_C(x.where)}">${esc(x.where)}</span>`}}],os,{attr:o=>`data-co="${o.rno}"`,empty:'No orders yet.'})}</div>
    ${money?`<div><p class="h4">Payments <span class="muted" style="font-weight:500">· ${pl(pays.length,'payment')}</span></p>${xTable([{t:'Date',f:p=>dmy(p.d)},{t:'Order',f:p=>`<span class="num">${esc(onoR(p.rno))}</span>`},{t:'Type',f:p=>p.amt<0?'Refund':p.t==='Deposit'?'Down payment':'Payment'},{t:'Method',f:p=>esc(pmName(p))},{t:'Amount',r:1,f:p=>`<b>${sar2(p.amt)}</b>`}],pays,{empty:'No payments in the loaded days.'})}</div>`:''}
    ${jHas((c.profiles[0]||{}).m)?`<div><p class="h4">Measurement</p>${jStylesHtml(c.profiles[0].m)}</div>`:''}`,
   `${can('measurements')?`<button class="btn" id="cuM">📐 Measurements</button>`:''}${can('new')?`<button class="btn" id="cuN">${ico('plus')}New order</button>`:''}${money&&due>0.5&&c.phone?`<button class="btn pri" id="cuW">${ico('wa')}Due reminder</button>`:''}`);
  document.querySelectorAll('[data-co]').forEach(r=>r.onclick=()=>openOrder(+r.dataset.co));
  const $=x=>document.getElementById(x);
  if($('cuM'))$('cuM').onclick=()=>{close();selCust=cid;selProf=0;location.hash='measurements'};
  if($('cuN'))$('cuN').onclick=()=>{close();location.hash='new';setTimeout(()=>{const x=document.getElementById('fCno');if(x){x.value=c.id;x.onchange&&x.onchange()}},60)};
  if($('cuW'))$('cuW').onclick=()=>{const o=os.find(x=>x.total-x.paid>0.5);const msg=waFill('WA_Due',{name:c.name,order:os.filter(x=>x.total-x.paid>0.5).map(x=>ono(x).replace(/^#/,'')).join(', '),amount:sar2(due)});waOpen(o,'DUE',msg);toast('WhatsApp opened · kept in the Message tracker')};
}

/* ---------- a search box inside the page (same as the one at the top) ---------- */
const pgSearch=ph=>`<label class="search pgs"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><input id="pgQ" placeholder="${esc(ph)}" value="${esc(document.getElementById('q').value)}" autocomplete="off" type="search"></label><label class="search pgo" title="Order no. – Enter to open"><span class="muted" style="font-size:11px;font-weight:700">#</span><input id="pgO" placeholder="Order no." autocomplete="off" inputmode="search"></label>`;
function bindPgSearch(){bindOrdBox();const i=document.getElementById('pgQ');if(!i)return;
  i.oninput=()=>{const q=document.getElementById('q');q.value=i.value;q.dispatchEvent(new Event('input'));const n=document.getElementById('pgQ');if(n&&n!==i){n.focus();n.setSelectionRange(n.value.length,n.value.length)}}}

/* the small "Order no." box: Enter opens that order (on the Measurements page: its customer and its sheet) */
function findOrderNo(v){v=String(v||'').trim().replace(/^#/,'');if(!v)return null;const l=v.toLowerCase();
  return orders.find(o=>String(o.rno)===v)||orders.find(o=>(o.bno||'').toLowerCase()===l)||orders.find(o=>String(o.bseq||'')===v)||orders.find(o=>String(o.exeNo||'')===v)||orders.find(o=>(o.binv||'').toLowerCase()===l||String(o.invoiceNo||'')===v)||null}
function bindOrdBox(){const b=document.getElementById('pgO');if(!b)return;
  b.onkeydown=e=>{if(e.key!=='Enter')return;e.preventDefault();const v=b.value.trim().replace(/^#/,'');
    // the same number in more branches (OLY-50003, MLZ-50003): choose
    const many=/^\d+$/.test(v)?orders.filter(o=>String(o.bseq||'')===v||String(o.rno)===v||String(o.exeNo||'')===v):[];
    if(many.length>1){const close=drawer(`Order ${esc(v)}`,'<div class="muted" style="font-size:13px">This number is in more than one branch – choose</div>',
      `<div class="rows" style="border:1px solid var(--line);border-radius:8px">${many.map(o=>`<div class="row" data-pick="${o.rno}" style="cursor:pointer"><span class="rid">${esc(ono(o))}</span><div class="grow"><b dir="auto">${esc(cust(o.cid).name)}</b><span>${esc(bname(o.branch))} · ${fmtD(o.created)} · ${pl(o.qty,'thobe')}</span></div>${pill(o)}</div>`).join('')}</div>`,'');
      document.querySelectorAll('[data-pick]').forEach(r=>r.onclick=()=>{close();go(orders.find(x=>x.rno===+r.dataset.pick))});b.value='';return}
    const o=findOrderNo(v);if(!o){toast(`Order ${b.value} not found`);b.select();return}
    go(o);b.value=''};
  const go=o=>{const h=(location.hash||'').slice(1);
    if(h==='measurements'){selCust=o.cid;mOrdSel=o.rno;measurements();const s=document.querySelector('.mlay .sec');if(s&&innerWidth<1000)s.scrollIntoView({behavior:'smooth'})}
    else openOrder(o.rno)}}

/* ================= AL THOB exe-style pages: shop dashboard, daily report (exe + tailoring), worker work by period,
   workshop flow editor. Loaded after core.js, before live.js. ================= */

/* ---------- period picker: today / 7 days / month / last month / year, one date, one month, or from–to ---------- */
const d0=d=>{const x=new Date(d);return new Date(x.getFullYear(),x.getMonth(),x.getDate())};
const pDate=s=>new Date(s+'T00:00:00');
function perMake(mode,a,b){const t=d0(today),P={mode};
  if(mode==='today'){P.from=t;P.to=t}
  else if(mode==='week'){P.from=addD(t,-6);P.to=t}
  else if(mode==='lmonth'){P.from=new Date(t.getFullYear(),t.getMonth()-1,1);P.to=new Date(t.getFullYear(),t.getMonth(),0)}
  else if(mode==='year'){P.from=new Date(t.getFullYear(),0,1);P.to=t}
  else if(mode==='day'){P.from=d0(a);P.to=d0(a)}
  else if(mode==='ym'){const [y,m]=a.split('-').map(Number);P.ym=a;P.from=new Date(y,m-1,1);const e=new Date(y,m,0);P.to=e>t?t:e}
  else if(mode==='range'){P.from=d0(a);P.to=d0(b);if(P.from>P.to)[P.from,P.to]=[P.to,P.from]}
  else{P.mode='month';P.from=new Date(t.getFullYear(),t.getMonth(),1);P.to=t}
  return P}
const PER={};
const perGet=(k,def)=>PER[k]||(PER[k]=perMake(def||'month'));
const inPer=(d,P)=>{if(!d)return false;const x=+d0(d);return x>=+P.from&&x<=+P.to};
const fmtL=d=>d.toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'});
const perLabel=P=>+P.from===+P.to?fmtL(P.from):`${fmtL(P.from)} – ${fmtL(P.to)}`;
const perDays=P=>Math.round((P.to-P.from)/864e5)+1;
function perBar(id,P){
  const months=[];for(let i=0;i<24;i++){const d=new Date(today.getFullYear(),today.getMonth()-i,1);months.push(ymKey(d))}
  const B=(k,t)=>`<button type="button" class="${P.mode===k?'on':''}" data-pm="${k}">${t}</button>`;
  return `<div class="perbar" id="${id}">
   <div class="seg">${B('today','Today')}${B('week','7 days')}${B('month','This month')}${B('lmonth','Last month')}${B('year','This year')}</div>
   <label class="pfl">Date <input type="date" data-pd max="${dkey2(today)}" value="${P.mode==='day'?dkey2(P.from):''}"></label>
   <label class="pfl">Month <select data-py><option value="">—</option>${months.map(m=>`<option value="${m}" ${P.mode==='ym'&&P.ym===m?'selected':''}>${ymName(m)}</option>`).join('')}</select></label>
   <label class="pfl">From <input type="date" data-pf value="${dkey2(P.from)}"></label><label class="pfl">To <input type="date" data-pt value="${dkey2(P.to)}"></label>
  </div>`}
function perBind(id,P,cb){const el=document.getElementById(id);if(!el)return;
  const go=n=>{Object.assign(P,n);delete P.ym;if(n.ym)P.ym=n.ym;if(typeof ensurePayRange==='function')ensurePayRange(P.from);cb()};
  el.querySelectorAll('[data-pm]').forEach(b=>b.onclick=()=>go(perMake(b.dataset.pm)));
  el.querySelector('[data-pd]').onchange=e=>{if(e.target.value)go(perMake('day',pDate(e.target.value)))};
  el.querySelector('[data-py]').onchange=e=>{if(e.target.value)go(perMake('ym',e.target.value))};
  const f=el.querySelector('[data-pf]'),t=el.querySelector('[data-pt]');
  f.onchange=t.onchange=()=>{if(f.value&&t.value)go(perMake('range',pDate(f.value),pDate(t.value)))};
}

/* ---------- small helpers: table, CSV, print ---------- */
const csvOut=(name,rows)=>{const csv='﻿'+rows.map(r=>r.map(v=>{v=v==null?'':String(v);return /[",\n]/.test(v)?`"${v.replace(/"/g,'""')}"`:v}).join(',')).join('\n');
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));a.download=name+'.csv';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),2000)};
function printRep(title,sub,blocks){const w=window.open('','_blank');if(!w){toast('Allow pop-ups to print');return}
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title><style>body{font:11px Arial,sans-serif;margin:16px;color:#111}h1{font-size:17px;margin:0 0 2px}h2{font-size:13px;margin:14px 0 6px}p{margin:0 0 10px;color:#555}
   table{border-collapse:collapse;width:100%;margin-bottom:6px}th,td{border:1px solid #bbb;padding:3px 6px;text-align:left;white-space:nowrap}th{background:#eee}td.n,th.n{text-align:right}tfoot td{font-weight:700;background:#f4f4f4}
   .tiles{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0 10px}.tiles div{border:1px solid #bbb;padding:5px 10px;min-width:110px}.tiles span{display:block;font-size:9.5px;color:#555;text-transform:uppercase}.tiles b{font-size:14px}@page{size:A4;margin:10mm}</style></head><body>
   <h1>${esc(title)}</h1><p>${esc(sub)}</p>${blocks}<script>setTimeout(()=>print(),300)<\/script></body></html>`);w.document.close()}
const pTiles=t=>`<div class="tiles">${t.map(([l,v])=>`<div><span>${esc(l)}</span><b>${esc(v)}</b></div>`).join('')}</div>`;
const pTable=(head,rows,foot,num)=>`<table><thead><tr>${head.map((h,i)=>`<th class="${num&&num.includes(i)?'n':''}">${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map((v,i)=>`<td class="${num&&num.includes(i)?'n':''}" dir="auto">${esc(v??'')}</td>`).join('')}</tr>`).join('')}</tbody>${foot?`<tfoot><tr>${foot.map((v,i)=>`<td class="${num&&num.includes(i)?'n':''}">${esc(v??'')}</td>`).join('')}</tr></tfoot>`:''}</table>`;
/* on-screen table: cols [{t,r:numeric,f:row=>html}] */
function xTable(cols,rows,opt={}){
  return `<div class="otbl xt" style="${opt.h?`max-height:${opt.h}`:''}"><table class="ot" style="min-width:${opt.mw||'100%'}">
   <thead><tr>${cols.map(c=>`<th class="${c.r?'r':''}">${c.t}</th>`).join('')}</tr></thead>
   <tbody>${rows.length?rows.map(r=>`<tr ${opt.attr?opt.attr(r):''} ${opt.attr?'tabindex="0" style="cursor:pointer"':''}>${cols.map(c=>`<td class="${c.r?'r num':''}">${c.f(r)}</td>`).join('')}</tr>`).join(''):`<tr><td colspan="${cols.length}"><div class="empty">${opt.empty||'Nothing in this period.'}</div></td></tr>`}</tbody>
   ${opt.foot&&rows.length?`<tfoot><tr>${opt.foot.map((v,i)=>`<td class="${cols[i]&&cols[i].r?'r num':''}">${v}</td>`).join('')}</tr></tfoot>`:''}</table></div>`}
const sumBy=(a,f)=>a.reduce((s,x)=>s+(+f(x)||0),0);
const ordersAt=b=>orders.filter(o=>!b||o.branch===b||o.made===b);
const paysAt=b=>payLog.filter(p=>!b||p.branch===b);
const delsAt=b=>delLog.filter(p=>!b||p.branch===b);
const pmName=p=>p.pm||p.m||'';
const stageT=k=>(TASK_DEF[k]||{t:k}).t;
/* order list drawer, used by the clickable tiles */
function orderListDrawer(title,list,money){
  const close=drawer(title,`<div class="muted" style="font-size:13px">${pl(list.length,'order')} · ${sumBy(list,o=>o.qty)} pcs${money?` · total ${sar(sumBy(list,o=>o.total))} SAR · due ${sar(sumBy(list,o=>o.total-o.paid))} SAR`:''}</div>`,
   xTable([{t:'Order',f:o=>`<b class="num">${ono(o)}</b>`},{t:'Customer',f:o=>esc(cust(o.cid).name)},{t:'Booked',f:o=>fmtD(o.created)},{t:'Delivery',f:o=>`<span class="${late(o)?'tbad':''}">${fmtD(o.due)}</span>`},{t:'Pcs',r:1,f:o=>o.qty},
     ...(money?[{t:'Total',r:1,f:o=>sar2(o.total)},{t:'Due',r:1,f:o=>sar2(o.total-o.paid)}]:[]),{t:'Status',f:o=>{const x=oInfo(o);return `<span class="pill ${WHERE_C(x.where)}">${esc(x.where)}</span>${x.status==='Late'?' <span class="pill s-late">Late</span>':''}`}}],
     list.slice(0,500),{attr:o=>`data-lr="${o.rno}"`,h:'calc(100vh - 220px)',empty:'No orders.'}),'');
  document.querySelectorAll('[data-lr]').forEach(r=>r.onclick=()=>{close();openOrder(+r.dataset.lr)});
}
function payListDrawer(title,list){
  drawer(title,`<div class="muted" style="font-size:13px">${pl(list.length,'payment')} · ${sar2(sumBy(list,p=>p.amt))} SAR</div>`,
   xTable([{t:'Date',f:p=>fmtD(p.d)},{t:'Order',f:p=>`<b class="num">${onoR(p.rno)}</b>`},{t:'Customer',f:p=>{const o=orders.find(x=>x.rno===p.rno);return o?esc(cust(o.cid).name):'—'}},{t:'Type',f:p=>p.amt<0?'Refund':p.t==='Deposit'?'Down payment':'Due payment'},{t:'Method',f:p=>esc(pmName(p))},{t:'Amount',r:1,f:p=>`<b>${sar2(p.amt)}</b>`}],
     list.slice().sort((a,b)=>b.d-a.d).slice(0,800),{h:'calc(100vh - 220px)',empty:'No payments.'}),'');
}

/* ================= Shop dashboard, same as the AL THOB exe ================= */
let dashExe=false,dashTab='due';
function shopDash(){
  const P=perGet('dash','month'),money=RA().money,B=curBranch;
  const all=ordersAt(B),booked=all.filter(o=>inPer(o.created,P));
  const pays=paysAt(B).filter(p=>inPer(p.d,P)),coll=pays.filter(p=>p.amt>0),refs=pays.filter(p=>p.amt<0);
  const dels=delsAt(B).filter(p=>inPer(p.d,P));
  const info=new Map(all.map(o=>[o.rno,oInfo(o)]));const I=o=>info.get(o.rno);
  const dueAll=all.filter(o=>o.total-o.paid>0.5);
  const open=all.filter(o=>I(o).dq<o.qty),lateL=open.filter(o=>o.due<today&&o.st!=='ready');
  const hingeL=booked.filter(o=>+o.hingeQty||o.hinge),zipL=booked.filter(o=>+o.zipQty);
  const pcs=sumBy(booked,o=>o.qty),cutD=sumBy(booked,o=>I(o).cut),sewD=sumBy(booked,o=>I(o).sew),delD=sumBy(booked,o=>I(o).dq);
  const earlier=all.filter(o=>o.created<P.from&&I(o).dq<o.qty);
  const vat=sumBy(booked,o=>o.vat!=null?o.vat:vatOf(o.total));
  const byM={};coll.forEach(p=>{const k=pmName(p)||'Other';byM[k]=(byM[k]||0)+p.amt});
  const T=(k,l,v,sub,cls='')=>`<div class="tap ${cls}" data-dk="${k}" tabindex="0" role="button"><span>${l}</span><b>${v}</b><em>${sub}</em></div>`;
  const L={
    sales:['Sales booked',booked],orders:['Orders booked',booked],due:['Customers with due',dueAll],open:['Not delivered',open],late:['Late deliveries',lateL],hinge:['Hinge orders',hingeL],zip:['Zip orders',zipL],
    pcs:['Order pieces',booked],cutD:['Cutting finished',booked.filter(o=>I(o).cut>0)],cutR:['Cutting remaining',booked.filter(o=>I(o).cut<o.qty)],sewD:['Stitched',booked.filter(o=>I(o).sew>0)],sewR:['Stitching remaining',booked.filter(o=>I(o).sew<o.qty)],
    delD:['Delivered',booked.filter(o=>I(o).dq>0)],rem:['Remaining to deliver',booked.filter(o=>I(o).dq<o.qty)],early:['From earlier months, not delivered',earlier]};
  const tabs=[['due','Customers with due',new Set(dueAll.map(o=>o.cid)).size],['late','Late deliveries',lateL.length],['plan','Work plan',null],['top','Top 50 customers',null],['hz','Hinge & zip by month',null],...(STOCK.length?[['stock','Low stock',STOCK.filter(s=>(+s.stock||0)<10).length]]:[])];
  V(`<div class="rowtools"><button class="btn" id="dashBack">${ico('dash')}Simple dashboard</button><h2 style="margin:0;font-size:17px">Shop dashboard <span class="muted" style="font-weight:500;font-size:13px">· same as AL THOB exe · ${esc(B?bname(B):'All branches')}</span></h2><span class="sp"></span>${RA().pay?`<button class="btn pri" id="dashPay2">${ico('cash')}Pay / Deliver</button>`:''}<button class="btn" id="dashPrint">Print</button></div>
  <div class="panel"><div class="panel-b" style="padding:12px 16px">${perBar('dashPer',P)}<div class="muted" style="font-size:12.5px;margin-top:8px">${perLabel(P)} · ${pl(perDays(P),'day')} · tap any box to see the list</div></div></div>
  <p class="h4" style="margin:4px 0 -8px">Money & orders</p>
  ${money?'<div class="okpi c6">':''}
   ${money?T('sales','Sales booked',`${sar(sumBy(booked,o=>o.total))}<small>SAR</small>`,`${pl(booked.length,'order')} · VAT ${sar(vat)}`):''}
   ${money?T('coll','Collected',`${sar(sumBy(coll,p=>p.amt))}<small>SAR</small>`,`${pl(coll.length,'payment')} · all methods`,'okc'):''}
   ${money?T('collD','Collected – down payments',`${sar2(sumBy(coll.filter(p=>p.t==='Deposit'),p=>p.amt))}<small>SAR</small>`,`${pl(coll.filter(p=>p.t==='Deposit').length,'order')} booked`,'okc'):''}
   ${money?T('collU','Collected – due payments',`${sar2(sumBy(coll.filter(p=>p.t!=='Deposit'),p=>p.amt))}<small>SAR</small>`,`${pl(coll.filter(p=>p.t!=='Deposit').length,'payment')} at delivery`,'okc'):''}
   ${money?T('due','All customers due',`${sar(sumBy(dueAll,o=>o.total-o.paid))}<small>SAR</small>`,`${pl(dueAll.length,'order')} unpaid`,'bad'):''}
   ${money?T('ref','Refunds',`${sar(Math.abs(sumBy(refs,p=>p.amt)))}<small>SAR</small>`,pl(refs.length,'refund')):''}
  ${money?'</div>':''}
  <div class="okpi c4">
   ${T('orders','Orders / pcs',`${booked.length}<small>/ ${pcs} pcs</small>`,'booked in this period')}
   ${T('open','Not delivered',`${open.length}<small>orders</small>`,`${lateL.length} late`,lateL.length?'bad':'')}
   ${T('hinge','Hinge pcs',`${sumBy(hingeL,o=>+o.hingeQty||o.qty)}`,pl(hingeL.length,'order'))}
   ${T('zip','Zip pcs',`${sumBy(zipL,o=>+o.zipQty)}`,pl(zipL.length,'order'))}
  </div>
  <p class="h4" style="margin:4px 0 -8px">Production · orders booked in this period</p>
  <div class="okpi">
   ${T('pcs','Total order pcs',pcs,pl(booked.length,'order'))}
   ${T('cutD','Cutting finished',cutD,pcs?Math.round(cutD/pcs*100)+'%':'—','okc')}
   ${T('cutR','Cutting remaining',pcs-cutD,'pcs',pcs-cutD?'bad':'')}
   ${T('sewD','Total stitched',sewD,pcs?Math.round(sewD/pcs*100)+'%':'—','okc')}
   ${T('sewR','Stitching remaining',pcs-sewD,'pcs',pcs-sewD?'bad':'')}
   ${T('delD','Total delivered',delD,`${sumBy(dels,p=>p.qty)} pcs handed over in period`)}
   ${T('rem','Remaining',pcs-delD,'pcs not delivered')}
   ${T('early','From earlier months',sumBy(earlier,o=>o.qty-I(o).dq),`${pl(earlier.length,'order')} still open`,earlier.length?'bad':'')}
  </div>
  ${money?`<div class="panel"><div class="panel-h"><h2>Collected by method</h2><span class="sp"></span><span class="muted" style="font-size:12px">${perLabel(P)} · SAR</span></div><div class="panel-b">${(()=>{const e=Object.entries(byM).sort((a,b)=>b[1]-a[1]),t=sumBy(e,x=>x[1])||1;
     return e.length?`<div class="mbars">${e.map(([k,v])=>`<div class="mb"><span>${esc(k)}</span><div class="load"><i style="width:${v/t*100}%"></i></div><b class="num">${sar2(v)}</b><em class="num">${Math.round(v/t*100)}%</em></div>`).join('')}</div>`:'<div class="empty">No payments in this period.</div>'})()}</div></div>`:''}
  <div class="panel"><div class="panel-h" style="flex-wrap:wrap"><div class="seg" id="dashTabs">${tabs.map(([k,t,n])=>`<button class="${dashTab===k?'on':''}" data-dt="${k}">${t}${n!=null?` <span class="num">${n}</span>`:''}</button>`).join('')}</div></div><div id="dashTabBody"></div></div>`);
  const $=x=>document.getElementById(x);
  $('dashBack').onclick=()=>{dashExe=false;dashboard()};
  if($('dashPay2'))$('dashPay2').onclick=()=>receivePayment(0);
  perBind('dashPer',P,shopDash);
  document.querySelectorAll('[data-dk]').forEach(t=>{const go=()=>{const k=t.dataset.dk;if(k==='coll')return payListDrawer('Collected · '+perLabel(P),coll);if(k==='collD')return payListDrawer('Collected – down payments · '+perLabel(P),coll.filter(p=>p.t==='Deposit'));if(k==='collU')return payListDrawer('Collected – due payments · '+perLabel(P),coll.filter(p=>p.t!=='Deposit'));if(k==='ref')return payListDrawer('Refunds · '+perLabel(P),refs);const [ti,list]=L[k];orderListDrawer(`${ti} · ${k==='due'||k==='open'||k==='late'?'now':perLabel(P)}`,list.slice().sort((a,b)=>k==='due'?(b.total-b.paid)-(a.total-a.paid):b.created-a.created),money)};t.onclick=go;t.onkeydown=e=>{if(e.key==='Enter')go()}});
  const body=()=>{const el=$('dashTabBody');let h='';
    if(dashTab==='due'){const g={};dueAll.forEach(o=>{const x=g[o.cid]=g[o.cid]||{c:cust(o.cid),n:0,t:0,d:0,last:o.created};x.n++;x.t+=o.total;x.d+=o.total-o.paid;if(o.created>x.last)x.last=o.created});Object.values(g).forEach(x=>x.ts=thobeState(all.filter(o=>o.cid===x.c.id&&o.total-o.paid>0.5)));
      const r=Object.values(g).sort((a,b)=>b.d-a.d);h=xTable([{t:'Customer',f:x=>`<b>${esc(x.c.name)}</b>`},{t:'Mobile',f:x=>`<span class="num">${esc(x.c.phone||'')}</span>`},{t:'Orders',r:1,f:x=>x.n},{t:'Last order',f:x=>fmtD(x.last)},{t:'Thobes',f:x=>thobePills(x.ts)},...(money?[{t:'Order total',r:1,f:x=>sar2(x.t)},{t:'Due',r:1,f:x=>`<b class="tbad">${sar2(x.d)}</b>`}]:[])],r,{attr:x=>`data-dc="${x.c.id}"`,h:'460px',empty:'No customer owes money.',foot:['Total',r.length+' customers',sumBy(r,x=>x.n),'','',...(money?[sar2(sumBy(r,x=>x.t)),sar2(sumBy(r,x=>x.d))]:[])]})}
    else if(dashTab==='late'){const r=lateL.slice().sort((a,b)=>a.due-b.due);h=xTable([{t:'Order',f:o=>`<b class="num">${ono(o)}</b>`},{t:'Customer',f:o=>esc(cust(o.cid).name)},{t:'Delivery date',f:o=>fmtD(o.due)},{t:'Days late',r:1,f:o=>`<b class="tbad">${-daysLeft(o)}</b>`},{t:'Pcs',r:1,f:o=>o.qty},{t:'Cut',r:1,f:o=>I(o).cut},{t:'Stitched',r:1,f:o=>I(o).sew},{t:'Made at',f:o=>esc(bname(o.made))},{t:'Tailor',f:o=>esc(o.tailor?wk(o.tailor).name:'—')}],r,{attr:o=>`data-lr="${o.rno}"`,h:'460px',empty:'Nothing late. 👍'})}
    else if(dashTab==='plan'){const r=[];for(let i=-1;i<14;i++){const d=i<0?null:addD(today,i);const os=open.filter(o=>o.st!=='ready'&&(i<0?o.due<today:sameDay(o.due,d)));if(!os.length&&i<0)continue;
        r.push({d,os,pcs:sumBy(os,o=>o.qty),cut:sumBy(os,o=>o.qty-I(o).cut),sew:sumBy(os,o=>o.qty-I(o).sew)})}
      h=`<p class="muted" style="font-size:12.5px;margin:10px 16px 0">Pieces that must be ready on each day (not ready yet). Tap a day to see the orders.</p>`+xTable([{t:'Delivery day',f:x=>x.d?`<b>${x.d.toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short'})}</b>`:'<b class="tbad">Already late</b>'},{t:'Orders',r:1,f:x=>x.os.length},{t:'Pcs',r:1,f:x=>x.pcs},{t:'Still to cut',r:1,f:x=>x.cut||'—'},{t:'Still to stitch',r:1,f:x=>x.sew?`<b>${x.sew}</b>`:'—'}],r,{attr:x=>`data-pd2="${x.d?dkey2(x.d):'late'}"`,h:'460px'})}
    else if(dashTab==='top'){const g={};booked.forEach(o=>{const x=g[o.cid]=g[o.cid]||{c:cust(o.cid),n:0,q:0,t:0,p:0};x.n++;x.q+=o.qty;x.t+=o.total;x.p+=o.paid});
      const r=Object.values(g).sort((a,b)=>b.t-a.t||b.q-a.q).slice(0,50);h=xTable([{t:'#',r:1,f:x=>r.indexOf(x)+1},{t:'Customer',f:x=>`<b>${esc(x.c.name)}</b>`},{t:'Mobile',f:x=>`<span class="num">${esc(x.c.phone||'')}</span>`},{t:'Orders',r:1,f:x=>x.n},{t:'Pcs',r:1,f:x=>x.q},...(money?[{t:'Total',r:1,f:x=>`<b>${sar2(x.t)}</b>`},{t:'Paid',r:1,f:x=>sar2(x.p)}]:[])],r,{attr:x=>`data-dc="${x.c.id}"`,h:'460px'})}
    else if(dashTab==='hz'){const r=[];for(let i=0;i<12;i++){const m=new Date(today.getFullYear(),today.getMonth()-i,1),k=ymKey(m);const os=all.filter(o=>ymKey(o.created)===k);
        r.push({k,n:os.length,q:sumBy(os,o=>o.qty),h:sumBy(os,o=>+o.hingeQty||(o.hinge?o.qty:0)),hn:os.filter(o=>+o.hingeQty||o.hinge).length,z:sumBy(os,o=>+o.zipQty),zn:os.filter(o=>+o.zipQty).length})}
      h=xTable([{t:'Month',f:x=>`<b>${ymName(x.k)}</b>`},{t:'Orders',r:1,f:x=>x.n},{t:'Pcs',r:1,f:x=>x.q},{t:'Hinge orders',r:1,f:x=>x.hn},{t:'Hinge pcs',r:1,f:x=>`<b>${x.h}</b>`},{t:'Zip orders',r:1,f:x=>x.zn},{t:'Zip pcs',r:1,f:x=>`<b>${x.z}</b>`}],r,{h:'460px',foot:['12 months',sumBy(r,x=>x.n),sumBy(r,x=>x.q),sumBy(r,x=>x.hn),sumBy(r,x=>x.h),sumBy(r,x=>x.zn),sumBy(r,x=>x.z)]})}
    else if(dashTab==='stock'){const r=STOCK.filter(s=>(+s.stock||0)<10).sort((a,b)=>(+a.stock||0)-(+b.stock||0));h=xTable([{t:'Code',f:s=>`<span class="num">${esc(s.code)}</span>`},{t:'Fabric',f:s=>`<b>${esc(s.name)}</b>`},{t:'Company',f:s=>esc(s.company||'')},{t:'Colour',f:s=>esc(s.colour||'')},{t:'In stock',r:1,f:s=>`<b class="${(+s.stock||0)<=0?'tbad':''}">${+s.stock||0}</b>`}],r,{h:'460px',empty:'Nothing low.'})}
    el.innerHTML=h;
    el.querySelectorAll('[data-lr]').forEach(r=>r.onclick=()=>openOrder(+r.dataset.lr));
    el.querySelectorAll('[data-dc]').forEach(r=>r.onclick=()=>openCustomer(+r.dataset.dc));
    el.querySelectorAll('[data-pd2]').forEach(r=>r.onclick=()=>{const k=r.dataset.pd2;const os=open.filter(o=>o.st!=='ready'&&(k==='late'?o.due<today:dkey2(o.due)===k));orderListDrawer(k==='late'?'Late, not ready':'Due '+fmtL(pDate(k)),os,money)})};
  document.querySelectorAll('[data-dt]').forEach(b=>b.onclick=()=>{dashTab=b.dataset.dt;document.querySelectorAll('[data-dt]').forEach(x=>x.classList.toggle('on',x===b));body()});
  body();
  $('dashPrint').onclick=()=>printRep('Shop dashboard',`${B?bname(B):'All branches'} · ${perLabel(P)}`,pTiles([...(money?[['Sales booked',sar2(sumBy(booked,o=>o.total))],['Collected',sar2(sumBy(coll,p=>p.amt))],['Collected – down payments',sar2(sumBy(coll.filter(p=>p.t==='Deposit'),p=>p.amt))],['Collected – due payments',sar2(sumBy(coll.filter(p=>p.t!=='Deposit'),p=>p.amt))],['All customers due',sar2(sumBy(dueAll,o=>o.total-o.paid))],['Refunds',sar2(Math.abs(sumBy(refs,p=>p.amt)))]]:[]),
    ['Orders / pcs',`${booked.length} / ${pcs}`],['Not delivered',`${open.length} (${lateL.length} late)`],['Hinge pcs',sumBy(hingeL,o=>+o.hingeQty||o.qty)],['Zip pcs',sumBy(zipL,o=>+o.zipQty)],['Cutting finished',cutD],['Cutting remaining',pcs-cutD],['Total stitched',sewD],['Stitching remaining',pcs-sewD],['Total delivered',delD],['Remaining',pcs-delD],['From earlier months',sumBy(earlier,o=>o.qty-I(o).dq)]])
    +(money?`<h2>Collected by method</h2>`+pTable(['Method','Amount (SAR)'],Object.entries(byM).map(([k,v])=>[k,sar2(v)]),['Total',sar2(sumBy(coll,p=>p.amt))],[1]):''));
}

/* ================= Daily report: summary (old) · exe daily report · tailoring report ================= */
let dailyTab='sum';
const dailyTabsHtml=()=>`<div class="rowtools" style="margin-bottom:-6px"><div class="seg" id="dTabs">${[['sum','Summary'],...(RA().money?[['exe','Daily report (exe)']]:[]),['tail','Tailoring report']].map(([k,t])=>`<button class="${dailyTab===k?'on':''}" data-dtab="${k}">${t}</button>`).join('')}</div></div>`;
function dailyTabsMount(){const v=document.getElementById('view');v.insertAdjacentHTML('afterbegin',dailyTabsHtml());
  v.querySelectorAll('[data-dtab]').forEach(b=>b.onclick=()=>{dailyTab=b.dataset.dtab;daily()})}
const _dailySum=daily;
daily=function(){if(dailyTab==='exe'&&!RA().money)dailyTab='sum';if(dailyTab==='exe')dailyExe();else if(dailyTab==='tail')dailyTailor();else _dailySum();dailyTabsMount()};
function dayNav(D){return `<div class="perbar"><div class="seg"><button type="button" id="dPrev">◀ Previous</button><button type="button" id="dToday" class="${repDay===0?'on':''}">Today</button><button type="button" id="dNext" ${repDay===0?'disabled':''}>Next ▶</button></div>
  <label class="pfl">Date <input type="date" id="dPick" value="${dkey2(D)}" max="${dkey2(today)}"></label><b style="font-size:14px">${D.toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</b>${D.getDay()===5?'<span class="pill s-wait">Friday</span>':''}</div>`}
function dayNavBind(){const $=x=>document.getElementById(x);const go=n=>{repDay=Math.max(0,n);if(typeof ensurePayRange==='function')ensurePayRange(addD(today,-repDay));daily()};
  $('dPrev').onclick=()=>go(repDay+1);$('dNext').onclick=()=>go(repDay-1);$('dToday').onclick=()=>go(0);
  $('dPick').onchange=e=>{if(e.target.value)go(Math.round((d0(today)-pDate(e.target.value))/864e5))}}
function dailyExe(){
  const D=addD(today,-repDay),B=curBranch;
  const shopIds=(B?BRANCHES.filter(b=>b.id===B):BRANCHES).map(b=>b.id);
  const inB=x=>!B||shopIds.includes(x.branch);
  const pays=payLog.filter(p=>sameDay(p.d,D)&&inB(p)),dels=delLog.filter(p=>sameDay(p.d,D)&&inB(p)),booked=orders.filter(o=>sameDay(o.created,D)&&inB(o));
  const rows=[],usedDel=new Set();
  pays.forEach(p=>{const o=orders.find(x=>x.rno===p.rno)||{};const dl=dels.filter(d=>d.rno===p.rno&&!usedDel.has(d));const dq=dl.length&&p.t!=='Deposit'?(dl.forEach(d=>usedDel.add(d)),sumBy(dl,d=>d.qty)):0;
    rows.push({o,inv:oinv(o),rno:p.rno,name:o.cid?cust(o.cid).name:'—',tot:p.t==='Deposit'?o.total||0:0,down:p.amt>0&&p.t==='Deposit'?p.amt:0,due:p.amt>0&&p.t!=='Deposit'?p.amt:0,disc:p.t==='Deposit'?(o.disc||0):0,ref:p.amt<0?-p.amt:0,m:pmName(p),type:p.amt<0?'Refund':p.t==='Deposit'?'New order':dq?'Delivery + payment':'Due payment',dq,rc:p.ref||'',user:p.by||(p.exe?'Shop exe':''),br:p.branch})});
  booked.filter(o=>!pays.some(p=>p.rno===o.rno&&p.t==='Deposit')).forEach(o=>rows.push({o,inv:oinv(o),rno:o.rno,name:cust(o.cid).name,tot:o.total,down:0,due:0,disc:o.disc||0,ref:0,m:'',type:'New order (no payment)',dq:0,rc:'',user:o.by||'',br:o.branch}));
  dels.filter(d=>!usedDel.has(d)).forEach(d=>{const o=orders.find(x=>x.rno===d.rno)||{};rows.push({o,inv:oinv(o),rno:d.rno,name:o.cid?cust(o.cid).name:'—',tot:0,down:0,due:0,disc:0,ref:0,m:'',type:'Delivery',dq:d.qty,rc:'',user:d.by||'',br:d.branch})});
  rows.sort((a,b)=>a.rno-b.rno);
  const coll=sumBy(pays.filter(p=>p.amt>0),p=>p.amt),ref=-sumBy(pays.filter(p=>p.amt<0),p=>p.amt);
  const cashIn=sumBy(pays.filter(p=>/cash/i.test(pmName(p))),p=>p.amt);
  const byM={},byU={};pays.forEach(p=>{const m=pmName(p)||'Other',u=p.by||(p.exe?'Shop exe':'—');byM[m]=(byM[m]||0)+p.amt;(byU[u]=byU[u]||{n:0,a:0}).n++;byU[u].a+=p.amt});
  const touched=new Set(rows.map(r=>r.rno)).size;
  const tiles=[['Report for',D.toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})],['New orders / pcs',`${booked.length} / ${sumBy(booked,o=>o.qty)}`],['Sales value',sar2(sumBy(booked,o=>o.total))],['Collected',sar2(coll)],['Refunds',sar2(ref)],['Net cash',sar2(cashIn)],['Pieces delivered',sumBy(dels,d=>d.qty)],['Orders touched',touched]];
  const cols=[['Invoice',r=>esc(r.inv)],['Order No',r=>`<b class="num">${esc(onoR(r.rno))}</b>`],['Name',r=>esc(r.name)],['Order Total',r=>r.tot?sar2(r.tot):'',1],['Down Payment',r=>r.down?sar2(r.down):'',1],['Paid Due',r=>r.due?sar2(r.due):'',1],['Discount',r=>r.disc?sar2(r.disc):'',1],['Refund',r=>r.ref?`<span class="tbad">${sar2(r.ref)}</span>`:'',1],['Method',r=>esc(r.m)],['Type',r=>esc(r.type)],['Delivered Pcs',r=>r.dq||'',1],['Receipt',r=>esc(r.rc)],['User',r=>esc(r.user)],...(B?[]:[['Branch',r=>esc(bname(r.br))]])];
  const F=k=>sumBy(rows,r=>r[k]);
  V(`<div class="panel"><div class="panel-b" style="padding:12px 16px;display:flex;gap:10px;flex-wrap:wrap;align-items:center">${dayNav(D)}<span class="sp" style="flex:1"></span><button class="btn" id="dxPrint">Print A4</button><button class="btn" id="dxCsv">Export CSV</button></div></div>
  <div class="okpi">${tiles.map(([l,v],i)=>`<div class="${i===3?'okc':i===4&&ref?'bad':''}"><span>${l}</span><b style="${i===0?'font-size:17px':''}">${v}</b></div>`).join('')}</div>
  <div class="panel"><div class="panel-h"><h2>Day book</h2><span class="sp"></span><span class="muted" style="font-size:12px">${pl(rows.length,'line')} · ${esc(B?bname(B):'All branches')}</span></div>
   ${xTable(cols.map(([t,f,r])=>({t,f,r})),rows,{attr:r=>`data-lr="${r.rno}"`,mw:'1250px',h:'calc(100vh - 360px)',empty:'Nothing on this day.',foot:['Total','','',sar2(F('tot')),sar2(F('down')),sar2(F('due')),sar2(F('disc')),sar2(F('ref')),'','',F('dq'),'','',...(B?[]:[''])]})}</div>
  <div class="grid2" style="grid-template-columns:1fr 1fr">
   <div class="panel"><div class="panel-h"><h2>Totals by method</h2></div>${xTable([{t:'Method',f:x=>`<b>${esc(x[0])}</b>`},{t:'Amount (SAR)',r:1,f:x=>sar2(x[1])}],Object.entries(byM).sort((a,b)=>b[1]-a[1]),{foot:['Total',sar2(coll-ref)],empty:'No payments.'})}</div>
   <div class="panel"><div class="panel-h"><h2>Totals by user</h2></div>${xTable([{t:'User',f:x=>`<b>${esc(x[0])}</b>`},{t:'Payments',r:1,f:x=>x[1].n},{t:'Amount (SAR)',r:1,f:x=>sar2(x[1].a)}],Object.entries(byU).sort((a,b)=>b[1].a-a[1].a),{foot:['Total',pays.length,sar2(coll-ref)],empty:'No payments.'})}</div>
  </div>`);
  dayNavBind();
  document.querySelectorAll('#view [data-lr]').forEach(r=>r.onclick=()=>openOrder(+r.dataset.lr));
  const H=cols.map(c=>c[0]),plain=r=>[r.inv,onoR(r.rno).replace(/^#/,''),r.name,r.tot?sar2(r.tot):'',r.down?sar2(r.down):'',r.due?sar2(r.due):'',r.disc?sar2(r.disc):'',r.ref?sar2(r.ref):'',r.m,r.type,r.dq||'',r.rc,r.user,...(B?[]:[bname(r.br)])];
  document.getElementById('dxCsv').onclick=()=>csvOut(`daily_report_${dkey2(D)}`,[H,...rows.map(plain)]);
  document.getElementById('dxPrint').onclick=()=>printRep('Daily report',`${B?bname(B):'All branches'} · ${D.toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}`,
    pTiles(tiles)+pTable(H,rows.map(plain),['Total','','',sar2(F('tot')),sar2(F('down')),sar2(F('due')),sar2(F('disc')),sar2(F('ref')),'','',F('dq'),'','',...(B?[]:[''])],[3,4,5,6,7,10])
    +'<h2>Totals by method</h2>'+pTable(['Method','Amount'],Object.entries(byM).map(([k,v])=>[k,sar2(v)]),['Total',sar2(coll-ref)],[1])
    +'<h2>Totals by user</h2>'+pTable(['User','Payments','Amount'],Object.entries(byU).map(([k,v])=>[k,v.n,sar2(v.a)]),['Total',pays.length,sar2(coll-ref)],[1,2]));
}
function dailyTailor(){
  const D=addD(today,-repDay),B=curBranch;
  const ws=BRANCHES.map(b=>b.id).filter(id=>!B||id===B);
  const ent=prodLog.filter(p=>sameDay(p.d,D)&&(!B||p.made===B||(wk(p.w).branch===B)));
  const ks=TASKS.map(t=>t.k).filter(k=>ent.some(p=>p.stage===k)||k==='cut'||k==='sew');
  const by={};ent.forEach(p=>{const x=by[p.w]=by[p.w]||{w:wk(p.w),q:{},n:new Set(),t:0};x.q[p.stage]=(x.q[p.stage]||0)+(+p.qty||0);x.t+=+p.qty||0;if(p.rno)x.n.add(p.rno)});
  const people=workers.filter(w=>ws.includes(w.branch)&&WORKSHOP_ROLES.includes(w.role)&&okW(w));
  people.forEach(w=>{if(!by[w.id])by[w.id]={w,q:{},n:new Set(),t:0}});
  const rows=Object.values(by).sort((a,b)=>b.t-a.t||a.w.name.localeCompare(b.w.name));
  const S=k=>sumBy(ent.filter(p=>p.stage===k),p=>p.qty);
  const readyToday=orders.filter(o=>(!B||o.made===B||o.branch===B)&&prodLog.some(p=>p.rno===o.rno&&sameDay(p.d,D))&&(o.st==='ready'||o.st==='done'));
  const sent=orders.filter(o=>sameDay(o.created,D)&&isFac(o.made)&&(!B||o.made===B||o.branch===B));
  const byPlace=ws.map(id=>({b:BRANCHES.find(x=>x.id===id),q:Object.fromEntries(ks.map(k=>[k,sumBy(ent.filter(p=>p.made===id&&p.stage===k),p=>p.qty)]))})).filter(x=>x.b&&ks.some(k=>x.q[k]));
  const att=w=>repDay<14?(w.att[13-repDay]||'p'):'';
  V(`<div class="panel"><div class="panel-b" style="padding:12px 16px;display:flex;gap:10px;flex-wrap:wrap;align-items:center">${dayNav(D)}<span class="sp" style="flex:1"></span><button class="btn" id="dtPrint">Print A4</button><button class="btn" id="dtCsv">Export CSV</button></div></div>
  <div class="okpi">${ks.map(k=>`<div><span>${stageT(k)}</span><b>${S(k)}<small>pcs</small></b></div>`).join('')}<div class="okc"><span>Orders finished</span><b>${readyToday.length}<small>${sumBy(readyToday,o=>o.qty)} pcs</small></b></div><div><span>Sent to factory</span><b>${sent.length}<small>${sumBy(sent,o=>o.qty)} pcs</small></b></div></div>
  <div class="panel"><div class="panel-h"><h2>Work by worker</h2><span class="sp"></span><span class="muted" style="font-size:12px">${esc(B?bname(B):'All branches & factories')} · tap a worker for his full work</span></div>
   ${xTable([{t:'Worker',f:x=>`<b>${esc(x.w.name)}</b>`},{t:'Job',f:x=>esc(x.w.role==='Cutter'?'Cutting':x.w.role)},...ks.map(k=>({t:stageT(k),r:1,f:x=>x.q[k]||''})),{t:'Total pcs',r:1,f:x=>`<b>${x.t||'—'}</b>`},{t:'Orders',f:x=>x.n.size?`<span class="num muted">${[...x.n].slice(0,8).map(n=>onoR(n)).join(' ')}${x.n.size>8?' …':''}</span>`:''},{t:'Branch / factory',f:x=>esc(bname(x.w.branch))},{t:'Present',f:x=>{const a=att(x.w);return a==='a'?'<span class="tbad">Absent</span>':a==='o'?'<span class="muted">Off</span>':a?'Yes':''}}],
     rows,{attr:x=>`data-ow="${x.w.id}"`,h:'calc(100vh - 380px)',empty:'No workshop work on this day.',foot:['Total','',...ks.map(k=>S(k)),sumBy(rows,x=>x.t),'','','']})}</div>
  <div class="grid2" style="grid-template-columns:1fr 1fr">
   <div class="panel"><div class="panel-h"><h2>By branch & factory</h2></div>${xTable([{t:'Place',f:x=>`${bTag(x.b.id)} <b>${esc(x.b.name)}</b>`},...ks.map(k=>({t:stageT(k),r:1,f:x=>x.q[k]||''}))],byPlace,{empty:'No work.'})}</div>
   <div class="panel"><div class="panel-h"><h2>Finished this day</h2><span class="sp"></span><span class="muted" style="font-size:12px">Ready for pickup or delivered</span></div>${xTable([{t:'Order',f:o=>`<b class="num">${ono(o)}</b>`},{t:'Customer',f:o=>esc(cust(o.cid).name)},{t:'Pcs',r:1,f:o=>o.qty},{t:'Delivery',f:o=>fmtD(o.due)},{t:'Branch',f:o=>esc(bname(o.branch))}],readyToday,{attr:o=>`data-lr="${o.rno}"`,empty:'No order finished.'})}</div>
  </div>`);
  dayNavBind();
  document.querySelectorAll('#view [data-ow]').forEach(r=>r.onclick=()=>{const P=perGet('w');Object.assign(P,perMake('day',D));openWorker(+r.dataset.ow)});
  document.querySelectorAll('#view [data-lr]').forEach(r=>r.onclick=()=>openOrder(+r.dataset.lr));
  const H=['Worker','Job',...ks.map(stageT),'Total pcs','Orders','Branch','Present'],plain=x=>[x.w.name,x.w.role,...ks.map(k=>x.q[k]||''),x.t,[...x.n].map(n=>onoR(n)).join(' '),bname(x.w.branch),att(x.w)==='a'?'Absent':att(x.w)==='o'?'Off':'Yes'];
  document.getElementById('dtCsv').onclick=()=>csvOut(`tailoring_report_${dkey2(D)}`,[H,...rows.map(plain)]);
  document.getElementById('dtPrint').onclick=()=>printRep('Tailoring report',`${B?bname(B):'All branches & factories'} · ${D.toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}`,
    pTiles([...ks.map(k=>[stageT(k),S(k)+' pcs']),['Orders finished',readyToday.length],['Sent to factory',sent.length]])+pTable(H,rows.map(plain),['Total','',...ks.map(k=>S(k)),sumBy(rows,x=>x.t),'','',''],ks.map((k,i)=>2+i).concat([2+ks.length]))
    +'<h2>Finished this day</h2>'+pTable(['Order','Customer','Pcs','Delivery','Branch'],readyToday.map(o=>[o.rno,cust(o.cid).name,o.qty,fmtD(o.due),bname(o.branch)]),null,[2]));
}

/* ================= Worker work by date / month / from–to ================= */
function workerWorkHtml(w,P){
  const ent=prodLog.filter(p=>p.w===w.id&&inPer(p.d,P)).sort((a,b)=>b.d-a.d);
  const ks=[...new Set(ent.map(p=>p.stage))];const tot=sumBy(ent,p=>p.qty);
  const days={};ent.forEach(p=>{const k=dkey2(p.d);const x=days[k]=days[k]||{d:d0(p.d),q:{},t:0,n:new Set()};x.q[p.stage]=(x.q[p.stage]||0)+(+p.qty||0);x.t+=+p.qty||0;if(p.rno)x.n.add(p.rno)});
  const dl=Object.values(days).sort((a,b)=>b.d-a.d);const os=new Set(ent.filter(p=>p.rno).map(p=>p.rno));
  const money=RA().money||ROLE==='tailor';
  return `<div class="okpi" style="margin-top:10px"><div><span>Pieces</span><b>${tot}</b><em>${ks.map(k=>`${stageT(k)} ${sumBy(ent.filter(p=>p.stage===k),p=>p.qty)}`).join(' · ')||'—'}</em></div><div><span>Orders</span><b>${os.size}</b></div><div><span>Days worked</span><b>${dl.length}</b><em>avg ${dl.length?Math.round(tot/dl.length*10)/10:0} pcs/day</em></div>${money&&w.pay==='piece'?`<div class="okc"><span>Pay for this work</span><b>${sar(tot*(+w.rate||0))}<small>SAR</small></b><em>${tot} × ${w.rate}</em></div>`:''}</div>
   <p class="h4" style="margin:12px 0 6px">Day by day</p>
   ${xTable([{t:'Date',f:x=>`<b>${x.d.toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short'})}</b>`},...(ks.length>1?ks.map(k=>({t:stageT(k),r:1,f:x=>x.q[k]||''})):[]),{t:'Pcs',r:1,f:x=>`<b>${x.t}</b>`},{t:'Orders',f:x=>`<span class="num muted">${[...x.n].slice(0,6).map(n=>onoR(n)).join(' ')}${x.n.size>6?' …':''}</span>`}],dl,{h:'300px',empty:'No work in this period.',foot:dl.length?['Total',...(ks.length>1?ks.map(k=>sumBy(ent.filter(p=>p.stage===k),p=>p.qty)):[]),tot,os.size+' orders']:null})}
   ${ent.some(p=>p.rno)?`<p class="h4" style="margin:12px 0 6px">Orders worked on</p>${xTable([{t:'Date',f:p=>fmtD(p.d)},{t:'Order',f:p=>`<b class="num">${onoR(p.rno)}</b>`},{t:'Customer',f:p=>{const o=orders.find(x=>x.rno===p.rno);return o?esc(cust(o.cid).name):'—'}},{t:'Work',f:p=>stageT(p.stage)},{t:'Pcs',r:1,f:p=>p.qty}],ent.filter(p=>p.rno).slice(0,300),{attr:p=>`data-r="${p.rno}"`,h:'300px'})}`:''}`}
function wwMount(w){const sec=document.getElementById('wwSec');if(!sec)return;const P=perGet('w');
  const draw=()=>{sec.innerHTML=`<p class="h4">Work · ${perLabel(P)}</p>${perBar('wwPer',P)}${workerWorkHtml(w,P)}<div style="margin-top:8px"><button class="btn sm" id="wwCsv">Export CSV</button></div>`;
    perBind('wwPer',P,draw);sec.querySelectorAll('[data-r]').forEach(r=>r.onclick=()=>openOrder(+r.dataset.r));
    document.getElementById('wwCsv').onclick=()=>csvOut(`${w.name.replace(/\W+/g,'_')}_${dkey2(P.from)}_${dkey2(P.to)}`,[['Date','Order','Customer','Work','Pcs'],...prodLog.filter(p=>p.w===w.id&&inPer(p.d,P)).sort((a,b)=>a.d-b.d).map(p=>{const o=orders.find(x=>x.rno===p.rno);return [dkey2(p.d),p.rno||'',o?cust(o.cid).name:'',stageT(p.stage),p.qty]})])};
  draw()}
/* Branches & factories: every workshop worker's work for a period */
let bwBranch=0;
function bwMount(){const box=document.getElementById('bwPanel');if(!box)return;const P=perGet('bw');
  const lock=RA().lock;const draw=()=>{const B=lock?curBranch:(bwBranch||curBranch);const ks=TASKS.map(t=>t.k);
    const ent=prodLog.filter(p=>inPer(p.d,P));
    const people=workers.filter(w=>(!B||w.branch===B)&&(WORKSHOP_ROLES.includes(w.role)||ent.some(p=>p.w===w.id)));
    const rows=people.map(w=>{const e=ent.filter(p=>p.w===w.id);return{w,q:Object.fromEntries(ks.map(k=>[k,sumBy(e.filter(p=>p.stage===k),p=>p.qty)])),t:sumBy(e,p=>p.qty),n:new Set(e.filter(p=>p.rno).map(p=>p.rno)).size,d:new Set(e.map(p=>dkey2(p.d))).size}}).sort((a,b)=>b.t-a.t||a.w.name.localeCompare(b.w.name));
    box.innerHTML=`<div class="panel-h" style="flex-wrap:wrap"><h2>Workers' work</h2><span class="sp"></span><select id="bwB" class="btn sm" style="padding:6px 10px" aria-label="Branch" ${lock?'hidden':''}><option value="0">All branches & factories</option>${BRANCHES.map(b=>`<option value="${b.id}" ${B===b.id?'selected':''}>${esc(b.name)}</option>`).join('')}</select><button class="btn sm" id="bwCsv">Export CSV</button></div>
     <div class="panel-b" style="padding:12px 16px 0">${perBar('bwPer',P)}<div class="muted" style="font-size:12.5px;margin:8px 0">${perLabel(P)} · tap a worker to see his work day by day</div></div>
     ${xTable([{t:'Worker',f:x=>`<b>${esc(x.w.name)}</b>`},{t:'Job',f:x=>esc(x.w.role==='Cutter'?'Cutting':x.w.role)},{t:'Branch / factory',f:x=>esc(bname(x.w.branch))},...ks.map(k=>({t:stageT(k),r:1,f:x=>x.q[k]||''})),{t:'Total pcs',r:1,f:x=>`<b>${x.t||'—'}</b>`},{t:'Orders',r:1,f:x=>x.n||''},{t:'Days',r:1,f:x=>x.d||''},{t:'Avg / day',r:1,f:x=>x.d?Math.round(x.t/x.d*10)/10:''}],
      rows,{attr:x=>`data-bw="${x.w.id}"`,h:'520px',empty:'No workshop workers.',foot:['Total','','',...ks.map(k=>sumBy(rows,x=>x.q[k])),sumBy(rows,x=>x.t),'','','']})}`;
    perBind('bwPer',P,draw);
    document.getElementById('bwB').onchange=e=>{bwBranch=+e.target.value;draw()};
    box.querySelectorAll('[data-bw]').forEach(r=>r.onclick=()=>{Object.assign(perGet('w'),JSON.parse(JSON.stringify(P),(k,v)=>k==='from'||k==='to'?new Date(v):v));openWorker(+r.dataset.bw)});
    document.getElementById('bwCsv').onclick=()=>csvOut(`workers_work_${dkey2(P.from)}_${dkey2(P.to)}`,[['Worker','Job','Branch',...ks.map(stageT),'Total pcs','Orders','Days'],...rows.map(x=>[x.w.name,x.w.role,bname(x.w.branch),...ks.map(k=>x.q[k]),x.t,x.n,x.d])])};
  draw()}

/* ================= Workshop flow editor (Settings) ================= */
let flowSaver=null; // live.js: saves to Firestore meta/flow
const FMODE={after:'After',with:'Together',send:'Tailor sends'};
function flowClean(steps){const out=[],seen=new Set();(Array.isArray(steps)?steps:[]).forEach(f=>{if(f&&TASK_DEF[f.k]&&!seen.has(f.k)){seen.add(f.k);out.push({k:f.k,m:FMODE[f.m]?f.m:'after',on:f.k==='sew'?true:!!f.on})}});
  FLOW_DEFAULT.forEach(f=>{if(!seen.has(f.k))out.push({...f})});
  out.forEach(f=>{if(f.k==='sew'||f.k==='cut')f.m=f.m==='send'?'after':f.m});
  const fi=out.findIndex(f=>f.on);if(fi>=0)out[fi].m='after';return out}
function setFlow(steps,opt){const c=flowClean(steps);FLOW.length=0;FLOW.push(...c);if(opt&&typeof opt.tready==='boolean')FLOW_OPT.tready=opt.tready;applyFlow();if(typeof LIVE==='undefined'||!LIVE)orders.forEach(o=>{if(o.t&&o.st!=='done'&&o.st!=='ready')syncSt(o)})}
const flowText=(fl,tr)=>{const on=fl.filter(f=>f.on);let s='';const sends=[];on.forEach((f,j)=>{if(f.m==='send')sends.push(TASK_DEF[f.k].t);else if(f.m==='with'&&j>0)s+=` + ${TASK_DEF[f.k].t}`;else s+=(s?' → ':'')+TASK_DEF[f.k].t});
  return (s||'—')+(sends.length?` → tailor sends (if needed): ${sends.join(' / ')}`:'')+(tr?' → tailor ticks Ready':'')+' → Ready for pickup'};
function flowEditorHtml(){return `<div class="panel" id="flowPanel"><div class="panel-h"><h2>Workshop flow</h2><span class="sp"></span><span class="muted" style="font-size:12px">Drag the steps to change the order</span></div><div class="panel-b" id="flowBox"></div></div>`}
function flowEditorMount(){const box=document.getElementById('flowBox');if(!box)return;let ed=JSON.parse(JSON.stringify(FLOW)),tr=FLOW_OPT.tready;const own=isOwner();
  const draw=()=>{ed=flowClean(ed);const ch=JSON.stringify(ed)!==JSON.stringify(FLOW)||tr!==FLOW_OPT.tready;const first=ed.findIndex(x=>x.on);
    box.innerHTML=`<p class="muted" style="margin:0 0 10px;font-size:13px"><b>After</b> = starts when the step before is finished. <b>Together</b> = can start as soon as the step before has started. <b>Tailor sends</b> = when the tailor has stitched it, he sends it there (only orders that need it: hinge, tatreez, bottom cutting for zip and hinge orders) and it comes back to him. Off = not used.</p>
     <ol class="flow" id="flowList">${ed.map((f,i)=>`<li class="fstep ${f.on?'':'off'}" draggable="${own}" data-fi="${i}">
       <span class="grip" aria-hidden="true">⋮⋮</span><span class="fno num">${f.on?ed.slice(0,i+1).filter(x=>x.on).length:'–'}</span>
       <div class="grow"><b>${TASK_DEF[f.k].t}</b><span class="muted" style="font-size:12px">Worker job: ${TASK_DEF[f.k].role==='Cutter'?'Cutting':TASK_DEF[f.k].role}${f.k==='btm'?' · zip and hinge orders (after the hinge)':f.k==='hinge'?' · hinge orders':f.k==='tat'?' · tatreez orders':''}</span></div>
       ${own?`<div class="seg sm">${Object.entries(FMODE).filter(([m])=>m!=='send'||(f.k!=='cut'&&f.k!=='sew')).map(([m,t])=>`<button type="button" class="${f.m===m?'on':''}" data-fm="${i}" data-v="${m}" ${first===i?'disabled':''}>${t}</button>`).join('')}</div>
       <label class="tgl" title="${f.k==='sew'?'Tailoring is always on':'On / off'}"><input type="checkbox" data-fo="${i}" ${f.on?'checked':''} ${f.k==='sew'?'disabled':''}><span></span></label>
       <span class="fmv"><button type="button" class="iconbtn" data-up="${i}" aria-label="Move up" ${i?'':'disabled'}>▲</button><button type="button" class="iconbtn" data-dn="${i}" aria-label="Move down" ${i<ed.length-1?'':'disabled'}>▼</button></span>`
       :`<span class="pill ${f.on?'s-ready':'s-wait'}">${f.on?FMODE[f.m]:'Off'}</span>`}</li>`).join('')}</ol>
     <div class="fstep" style="margin-top:8px"><span class="fno num" style="background:var(--ok)">✓</span><div class="grow"><b>Tailor ticks Ready</b><span class="muted" style="font-size:12px">When everything is done the order comes back to the tailor; he ticks Ready → popup for the owner and that branch. Off = ready by itself.</span></div>
       ${own?`<label class="tgl"><input type="checkbox" id="flowTr" ${tr?'checked':''}><span></span></label>`:`<span class="pill ${tr?'s-ready':'s-wait'}">${tr?'On':'Off'}</span>`}</div>
     <div class="fpath"><span class="muted">Flow:</span> <b>${esc(flowText(ed,tr))}</b></div>
     ${own?`<div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap"><button class="btn pri" id="flowSave" ${ch?'':'disabled'}>Save flow for all branches</button><button class="btn" id="flowUndo" ${ch?'':'disabled'}>Cancel changes</button><button class="btn" id="flowDef">Reset to default</button></div>`:'<p class="muted" style="font-size:12px;margin:10px 0 0">Only the owner can change the flow.</p>'}`;
    if(!own)return;
    const mv=(a,b)=>{if(b<0||b>=ed.length||a===b)return;const [x]=ed.splice(a,1);ed.splice(b,0,x);draw()};
    box.querySelectorAll('[data-up]').forEach(b=>b.onclick=()=>mv(+b.dataset.up,+b.dataset.up-1));
    box.querySelectorAll('[data-dn]').forEach(b=>b.onclick=()=>mv(+b.dataset.dn,+b.dataset.dn+1));
    box.querySelectorAll('[data-fm]').forEach(b=>b.onclick=()=>{ed[+b.dataset.fm].m=b.dataset.v;draw()});
    box.querySelectorAll('[data-fo]').forEach(c=>c.onchange=()=>{ed[+c.dataset.fo].on=c.checked;draw()});
    const $=x=>document.getElementById(x);
    $('flowTr').onchange=e=>{tr=e.target.checked;draw()};
    let from=-1;box.querySelectorAll('.fstep[data-fi]').forEach(li=>{
      li.ondragstart=e=>{from=+li.dataset.fi;li.classList.add('drag');e.dataTransfer.effectAllowed='move';try{e.dataTransfer.setData('text/plain',String(from))}catch(_){}};
      li.ondragend=()=>li.classList.remove('drag');
      li.ondragover=e=>{e.preventDefault();box.querySelectorAll('.fstep').forEach(x=>x.classList.toggle('over',x===li))};
      li.ondragleave=()=>li.classList.remove('over');
      li.ondrop=e=>{e.preventDefault();const to=+li.dataset.fi;if(from>=0)mv(from,to);from=-1}});
    $('flowUndo').onclick=()=>{ed=JSON.parse(JSON.stringify(FLOW));tr=FLOW_OPT.tready;draw()};
    $('flowDef').onclick=()=>{ed=JSON.parse(JSON.stringify(FLOW_DEFAULT));tr=true;draw()};
    $('flowSave').onclick=async()=>{const s=$('flowSave');s.disabled=true;s.textContent='Saving…';
      try{if(flowSaver)await flowSaver(flowClean(ed),tr);setFlow(ed,{tready:tr});toast('Flow saved for all branches');ed=JSON.parse(JSON.stringify(FLOW));draw()}
      catch(e){toast('Could not save: '+(e.code||e.message));s.disabled=false;s.textContent='Save flow for all branches'}}};
  draw()}

/* ================= Purchases & stock · WhatsApp · Message tracker (as the AL THOB exe's pages) =================
   Stock and purchases come from the shop exe (items / purch); WhatsApp messages sent from here and from the exe are both
   kept in walog, so the message tracker shows what went out from either side. */
const PURCH=[],WALOG=[];
if(typeof LIVE==='undefined'||!LIVE){
  const S=['Al Jedaie Textiles','Al Mutlaq Fabrics','Hassan Trading'];
  STOCK.forEach((it,i)=>{it.seller=S[i%3];it.model=i%2?'Single':'Double';it.purchased=it.stock+20+i*7;it.sold=20+i*7;it.returned=0;it.company=it.company||['Toyobo','Shikibo','Daniel Hechter'][i%3]});
  STOCK.forEach((it,i)=>{for(let k=0;k<2;k++){const y=40+((i*13+k*7)%30);PURCH.push({_id:'p'+i+k,d:addD(today,-(5+i*9+k*23)),code:it.code,seller:it.seller,rateYard:18+i*2,yards:y,ypp:it.model==='Single'?3.25:3.5,qty:Math.round(y/3.4),cost:Math.round((18+i*2)*3.4),value:Math.round((18+i*2)*y),note:''})}});
  orders.filter(o=>o.st==='ready').slice(0,5).forEach((o,i)=>WALOG.push({_id:'w'+i,d:addD(today,-i),at:'',kind:'READY',rno:o.rno,cid:o.cid,mobile:cust(o.cid).phone,msg:'',branch:o.branch,by:'Shop exe'}));
  orders.filter(o=>o.total-o.paid>0.5).slice(0,6).forEach((o,i)=>WALOG.push({_id:'d'+i,d:addD(today,-2-i),at:'',kind:'DUE',rno:o.rno,cid:o.cid,mobile:cust(o.cid).phone,msg:'',branch:o.branch,by:'Imran Ali'}));
}
const itemOf=code=>STOCK.find(x=>+x.code===+code)||{};
const lowLimit=()=>+SHOP.LowStock||10;

/* ---------- Purchases & stock ---------- */
let stTab='stock',stQ='';
function stockView(){
  const P=perGet('pur','year'),q=stQ.trim().toLowerCase();
  const its=STOCK.filter(x=>!q||String(x.code)===q||[x.name,x.company,x.seller,x.colour].some(v=>String(v||'').toLowerCase().includes(q))).sort((a,b)=>a.code-b.code);
  const pur=PURCH.filter(p=>inPer(p.d,P)).filter(p=>{if(!q)return true;const it=itemOf(p.code);return String(p.code)===q||[it.name,it.company,p.seller].some(v=>String(v||'').toLowerCase().includes(q))}).sort((a,b)=>b.d-a.d);
  const low=STOCK.filter(x=>(+x.stock||0)<lowLimit());
  const byS={};PURCH.filter(p=>inPer(p.d,P)).forEach(p=>{const k=p.seller||itemOf(p.code).seller||'—';const x=byS[k]=byS[k]||{k,codes:new Set(),q:0,y:0,v:0,last:p.d};x.codes.add(p.code);x.q+=+p.qty||0;x.y+=+p.yards||0;x.v+=+p.value||0;if(p.d>x.last)x.last=p.d});
  const sel=Object.values(byS).sort((a,b)=>b.v-a.v);
  const T=(l,v,e,c='')=>`<div class="${c}"><span>${l}</span><b>${v}</b><em>${e}</em></div>`;
  V(`<div class="okpi">${T('Items',STOCK.length,`${sumBy(STOCK,x=>+x.stock||0).toFixed(0)} pcs in stock`)}${T('Low stock',low.length,`under ${lowLimit()} pcs`,low.length?'bad':'')}
    ${T('Purchases',PURCH.filter(p=>inPer(p.d,P)).length,perLabel(P))}${T('Purchase value',`${sar(sumBy(PURCH.filter(p=>inPer(p.d,P)),p=>p.value))}<small>SAR</small>`,`${sumBy(PURCH.filter(p=>inPer(p.d,P)),p=>p.yards).toFixed(0)} yards`)}${T('Stock value',`${sar(sumBy(STOCK,x=>(+x.stock||0)*(+x.rate||0)))}<small>SAR</small>`,'at sale rate')}</div>
  <div class="panel"><div class="panel-h" style="flex-wrap:wrap;gap:10px"><div class="seg">${[['stock','Stock / المخزون',STOCK.length],['low','Low stock',low.length],['pur','Purchases / المشتريات',pur.length],['sel','Sellers / الموردين',sel.length]].map(([k,t,n])=>`<button class="${stTab===k?'on':''}" data-stt="${k}">${t} <span class="num">${n}</span></button>`).join('')}</div>
    <span class="sp"></span><label class="search" style="max-width:260px"><input id="stQ" placeholder="Code, item, company, seller" value="${esc(stQ)}"></label><button class="btn sm" id="stCsv">Export CSV</button><button class="btn sm" id="stPrint">Print</button></div>
   ${stTab==='pur'||stTab==='sel'?`<div class="panel-b" style="padding:10px 16px 0">${perBar('purPer',P)}</div>`:''}
   <div id="stBody"></div>
   <div class="panel-b muted" style="font-size:12px">Items, purchases and sellers are entered in the AL THOB exe (Stock &amp; Purchases); the website shows them after each sync.</div></div>`);
  const cols={
    stock:[['Code',x=>`<b class="num">${x.code}</b>`,0,x=>x.code],['Item',x=>esc(x.name),0,x=>x.name],['Company',x=>esc(x.company||''),0,x=>x.company||''],['Seller',x=>esc(x.seller||''),0,x=>x.seller||''],['Model',x=>esc(x.model||''),0,x=>x.model||''],['Colour',x=>esc(x.colour||''),0,x=>x.colour||''],
      ['Sale rate',x=>sar2(x.rate||0),1,x=>x.rate||0],['Purchased',x=>+x.purchased||0,1,x=>x.purchased||0],['Sold',x=>+x.sold||0,1,x=>x.sold||0],['Returned',x=>+x.returned||0,1,x=>x.returned||0],['In stock',x=>`<b class="${(+x.stock||0)<lowLimit()?'tbad':''}">${+x.stock||0}</b>`,1,x=>x.stock||0]],
    pur:[['Date',p=>dmy(p.d),0,p=>dkey2(p.d)],['Code',p=>`<b class="num">${p.code}</b>`,0,p=>p.code],['Item',p=>esc(itemOf(p.code).name||''),0,p=>itemOf(p.code).name||''],['Company',p=>esc(itemOf(p.code).company||''),0,p=>itemOf(p.code).company||''],['Seller',p=>esc(p.seller||''),0,p=>p.seller||''],
      ['Rate/Yard',p=>sar2(p.rateYard),1,p=>p.rateYard],['Yards',p=>+p.yards,1,p=>p.yards],['Yards/Pc',p=>+p.ypp||'',1,p=>p.ypp],['Qty (pcs)',p=>+p.qty,1,p=>p.qty],['Cost/Pc',p=>sar2(p.cost),1,p=>p.cost],['Value',p=>`<b>${sar2(p.value)}</b>`,1,p=>p.value],['Note',p=>esc(p.note||''),0,p=>p.note||'']],
    sel:[['Seller',x=>`<b>${esc(x.k)}</b>`,0,x=>x.k],['Items',x=>x.codes.size,1,x=>x.codes.size],['Total pcs',x=>+x.q.toFixed(2),1,x=>x.q],['Total yards',x=>+x.y.toFixed(2),1,x=>x.y],['Total value',x=>`<b>${sar2(x.v)}</b>`,1,x=>x.v],['Avg rate/yard',x=>x.y?sar2(x.v/x.y):'—',1,x=>x.y?x.v/x.y:0],['Last purchase',x=>dmy(x.last),0,x=>dkey2(x.last)]]};
  const k=stTab==='low'?'stock':stTab,rows=stTab==='stock'?its:stTab==='low'?low:stTab==='pur'?pur:sel,C=cols[k];
  const foot=k==='stock'?['Total','','','','','','',sumBy(rows,x=>x.purchased).toFixed(0),sumBy(rows,x=>x.sold).toFixed(0),sumBy(rows,x=>x.returned).toFixed(0),sumBy(rows,x=>x.stock).toFixed(0)]:k==='pur'?['Total','','','','','',sumBy(rows,p=>p.yards).toFixed(1),'',sumBy(rows,p=>p.qty).toFixed(0),'',sar2(sumBy(rows,p=>p.value)),'']:['Total','',sumBy(rows,x=>x.q).toFixed(0),sumBy(rows,x=>x.y).toFixed(1),sar2(sumBy(rows,x=>x.v)),'',''];
  document.getElementById('stBody').innerHTML=xTable(C.map(([t,f,r])=>({t,f,r})),rows,{h:'calc(100vh - 380px)',mw:'900px',foot,empty:stTab==='low'?'Nothing low. 👍':'Nothing here yet.'});
  document.querySelectorAll('[data-stt]').forEach(b=>b.onclick=()=>{stTab=b.dataset.stt;stockView()});
  const qi=document.getElementById('stQ');qi.oninput=()=>{stQ=qi.value;clearTimeout(qi._t);qi._t=setTimeout(()=>{stockView();const n=document.getElementById('stQ');n.focus();n.setSelectionRange(n.value.length,n.value.length)},250)};
  perBind('purPer',P,stockView);
  const plain=()=>[C.map(c=>c[0]),...rows.map(x=>C.map(c=>c[3](x)))];
  const title={stock:'Stock',low:'Low stock',pur:'Purchases',sel:'Seller summary'}[stTab];
  document.getElementById('stCsv').onclick=()=>csvOut(title.toLowerCase().replace(/ /g,'_')+'_'+dkey2(today),plain());
  document.getElementById('stPrint').onclick=()=>{const r=plain();printRep(title,stTab==='pur'||stTab==='sel'?perLabel(P):today.toLocaleDateString('en-GB'),pTable(r[0],r.slice(1),null))};
}

/* ---------- WhatsApp: due reminders, orders ready, delivery date changed, broadcast ---------- */
const waNum=p=>{let d=String(p||'').replace(/\D/g,'');if(!d)return '';const cc=String(SHOP.CountryCode||'966');if(d.startsWith('00'))d=d.slice(2);else if(d.startsWith('0'))d=cc+d.slice(1);else if(!d.startsWith(cc)&&d.length<=9)d=cc+d;return d};
const WA_DEF={WA_Ready:'السلام عليكم عميلنا العزيز {name} , طلبك رقم {order} جاهز للاستلام\n\nالثوب السعودي للخياطة الرجالية',
  WA_Due:'السلام عليكم عميلنا العزيز {name}\nرقم الطلب: {order}\nنود تذكيركم بأن لديكم مبلغ مستحق قدره {amount} ريال لدى محل الثوب السعودي للخياطة الرجالية.\nنرجو التكرم بسداد المبلغ في أقرب وقت ممكن.\nشكراً لتعاملكم معنا',
  WA_Delay:'السلام عليكم ورحمة الله وبركاته\nعميلنا العزيز {name}،\n\nنتقدم إليكم بخالص الاعتذار، ونود إفادتكم بأن موعد تسليم طلبكم رقم {order} قد تم تعديله ليصبح يوم {day_ar} الموافق {date}.{reason_ar}\n\nحرصاً منا على تقديم أعلى مستوى من الجودة والإتقان في التفصيل، نأمل تفهمكم الكريم، ونشكر لكم ثقتكم الغالية وصبركم.\n\nمع خالص التحية والتقدير،\n{shop}'};
const DAY_AR=['الأحد','الإثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
const waFill=(k,v)=>String(SHOP[k]||WA_DEF[k]).replace(/\{(\w+)\}/g,(m,x)=>v[x]!=null?v[x]:m);
const waSent=(o,kind)=>WALOG.filter(w=>w.kind===kind&&(w.rno===o.rno||(o.exeNo&&w.exeNo===o.exeNo))).sort((a,b)=>b.d-a.d)[0];
let waTab='ready',waDone=new Set(),waDelay={d:null,why:'',upd:true},waBody='',waPick='open';
function waOpen(o,kind,msg){const c=cust(o.cid),n=waNum(c.phone);if(!n){toast(`${c.name}: no mobile number`);return false}
  window.open(`https://wa.me/${n}?text=${encodeURIComponent(msg)}`,'_blank','noopener');
  WALOG.push({d:new Date(today),at:new Date().toISOString().slice(0,16).replace('T',' '),kind,rno:o.rno,cid:o.cid,mobile:c.phone,msg:msg.slice(0,600),branch:o.branch,by:USER.name||'Owner'});return true}
function whatsappView(){
  const all=O();const info=new Map(all.map(o=>[o.rno,oInfo(o)]));
  if(!waDelay.d)waDelay.d=addD(today,3);
  const lists={
    ready:all.filter(o=>o.st==='ready'&&info.get(o.rno).dq<o.qty&&!waSent(o,'READY')).map(o=>({o,kind:'READY',amt:o.total-o.paid,msg:waFill('WA_Ready',{name:cust(o.cid).name,order:ono(o).replace(/^#/,'')})})),
    due:all.filter(o=>o.total-o.paid>0.5).map(o=>({o,kind:'DUE',amt:o.total-o.paid,last:waSent(o,'DUE'),msg:waFill('WA_Due',{name:cust(o.cid).name,order:ono(o).replace(/^#/,''),amount:sar2(o.total-o.paid)})})),
    delay:all.filter(o=>info.get(o.rno).dq<o.qty&&o.st!=='ready'&&daysLeft(o)<=3).map(o=>({o,kind:'DELAY',amt:0,msg:waFill('WA_Delay',{name:cust(o.cid).name,order:ono(o).replace(/^#/,''),day_ar:DAY_AR[waDelay.d.getDay()],date:dmy(waDelay.d),reason_ar:waDelay.why?`\nالسبب: ${waDelay.why}`:'',shop:SHOP.CompanyAr})})),
    custom:(waPick==='open'?all.filter(o=>info.get(o.rno).dq<o.qty):all.filter(o=>daysLeft(o)>-60)).filter((o,i,a)=>a.findIndex(x=>x.cid===o.cid)===i).map(o=>({o,kind:'CUSTOM',amt:0,msg:`السلام عليكم ${cust(o.cid).name}\n${waBody}\n\n${SHOP.CompanyAr}`}))};
  const wq=document.getElementById('q').value.trim().toLowerCase();
  const L=lists[waTab].filter(r=>!wq||ordMatch(r.o,wq)||cust(r.o.cid).name.toLowerCase().includes(wq)||String(cust(r.o.cid).phone).includes(wq)),left=L.filter(r=>!waDone.has(waTab+r.o.rno));
  V(`<div class="okpi"><div><span>Ready · not sent</span><b>${lists.ready.length}</b><em>thobe ready message</em></div><div class="${lists.due.length?'bad':''}"><span>With due</span><b>${lists.due.length}</b><em>${sar(sumBy(lists.due,r=>r.amt))} SAR</em></div><div><span>Late or due in 3 days</span><b>${lists.delay.length}</b><em>delivery date notice</em></div><div class="okc"><span>Sent today</span><b>${WALOG.filter(w=>sameDay(w.d,today)).length}</b><em>from website and exe</em></div></div>
  <div class="panel"><div class="panel-h" style="flex-wrap:wrap;gap:10px"><div class="seg">${[['ready','Orders ready / الطلبات الجاهزة',lists.ready.length],['due','Due reminders / تذكير بالمستحقات',lists.due.length],['delay','Delivery date changed',lists.delay.length],['custom','Broadcast',lists.custom.length]].map(([k,t,n])=>`<button class="${waTab===k?'on':''}" data-wat="${k}">${t} <span class="num">${n}</span></button>`).join('')}</div>
 <span class="sp"></span>${pgSearch('Name, mobile, order')}<button class="btn pri" id="waNext" ${left.length?'':'disabled'}>Open next ▶ <span class="num" style="opacity:.8">(${left.length} left)</span></button></div>
   ${waTab==='delay'?`<div class="panel-b perbar" style="padding:10px 16px"><label class="pfl">New delivery date <input type="date" id="wdD" value="${dkey2(waDelay.d)}"></label><b>${waDelay.d.toLocaleDateString('en-GB',{weekday:'long'})} / ${DAY_AR[waDelay.d.getDay()]}</b>${waDelay.d.getDay()===5?' <span class="pill s-late">Friday</span>':''}<label class="pfl">Reason <input id="wdW" value="${esc(waDelay.why)}" placeholder="optional"></label><label class="pfl"><input type="checkbox" id="wdU" ${waDelay.upd?'checked':''}> also change the delivery date in the order</label></div>`:''}
   ${waTab==='custom'?`<div class="panel-b" style="padding:10px 16px;display:grid;gap:8px"><textarea id="wcT" rows="3" dir="auto" placeholder="Your message · رسالتك" style="border:1px solid var(--line);border-radius:8px;padding:9px;background:var(--ground);color:var(--text);font:inherit">${esc(waBody)}</textarea><div class="seg" style="width:max-content"><button class="${waPick==='open'?'on':''}" data-wp="open">Customers with open orders</button><button class="${waPick==='all'?'on':''}" data-wp="all">Customers of the last 60 days</button></div></div>`:''}
   ${xTable([{t:'Order',f:r=>`<b class="num">${esc(ono(r.o))}</b>`},{t:'Customer',f:r=>`<span dir="auto">${esc(cust(r.o.cid).name)}</span>`},{t:'Mobile',f:r=>`<span class="num">${esc(cust(r.o.cid).phone)}</span>`},{t:'Pcs',r:1,f:r=>r.o.qty},...(waTab==='due'?[{t:'Due',r:1,f:r=>`<b class="tbad">${sar2(r.amt)}</b>`},{t:'Last reminder',f:r=>r.last?dmy(r.last.d):'<span class="tbad">NOT SENT</span>'}]:[]),...(waTab==='delay'?[{t:'Delivery',f:r=>`<span class="${late(r.o)?'tbad':''}">${dmy(r.o.due)}</span>`}]:[]),
     {t:'Message',f:r=>`<span class="muted" dir="rtl" style="display:inline-block;max-width:340px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;vertical-align:middle">${esc(r.msg.replace(/\n/g,' '))}</span>`},{t:'',f:r=>waDone.has(waTab+r.o.rno)?'<span class="pill s-ready">Opened</span>':`<button class="btn sm" data-wao="${r.o.rno}">${ico('wa')}Open</button>`}],L,{h:'calc(100vh - 400px)',mw:'980px',empty:'Nobody to message here. 👍'})}
   <div class="panel-b muted" style="font-size:12px">Each click opens one chat in WhatsApp with the message ready – press Send there, then come back and click again. Every message opened is kept in the Message tracker.</div></div>`);
  document.querySelectorAll('[data-wat]').forEach(b=>b.onclick=()=>{waTab=b.dataset.wat;whatsappView()});bindPgSearch();
  const send=r=>{if(waTab==='custom'&&!waBody.trim()){toast('Write the message first');return}
    if(waOpen(r.o,r.kind,r.msg)){waDone.add(waTab+r.o.rno);if(r.kind==='DELAY'&&waDelay.upd){r.o.due=new Date(waDelay.d)}whatsappView()}};
  document.querySelectorAll('[data-wao]').forEach(b=>b.onclick=()=>send(L.find(r=>r.o.rno===+b.dataset.wao)));
  document.getElementById('waNext').onclick=()=>{const r=left[0];if(r)send(r)};
  const dd=document.getElementById('wdD');if(dd){dd.onchange=()=>{if(dd.value){waDelay.d=pDate(dd.value);whatsappView()}};document.getElementById('wdW').onchange=e=>{waDelay.why=e.target.value.trim();whatsappView()};document.getElementById('wdU').onchange=e=>{waDelay.upd=e.target.checked}}
  const ct=document.getElementById('wcT');if(ct)ct.onchange=()=>{waBody=ct.value;whatsappView()};
  document.querySelectorAll('[data-wp]').forEach(b=>b.onclick=()=>{waPick=b.dataset.wp;whatsappView()});
}

/* ---------- Message tracker: per order which messages went out, and every message sent ---------- */
let mtTab='orders',mtShow='ready';
const KIND_T={READY:'Thobe ready',DUE:'Due reminder',DELAY:'Delivery date changed',SAMPLE:'Sample ready',ALTERATION:'Alteration ready',BROADCAST:'Broadcast',CUSTOM:'Custom'};
function messagesView(){
  const P=perGet('msg','month'),all=O();const info=new Map(all.map(o=>[o.rno,oInfo(o)]));const q=document.getElementById('q').value.trim().toLowerCase();
  const open=all.filter(o=>info.get(o.rno).dq<o.qty);
  const readyMiss=open.filter(o=>o.st==='ready'&&!waSent(o,'READY')),readySent=open.filter(o=>o.st==='ready'&&waSent(o,'READY'));
  const dueMiss=all.filter(o=>o.total-o.paid>0.5&&!waSent(o,'DUE'));
  const logP=WALOG.filter(w=>inPer(w.d,P)&&(!curBranch||w.branch===curBranch));
  let list=mtShow==='ready'?[...readyMiss,...readySent]:mtShow==='open'?open:mtShow==='sent'?all.filter(o=>logP.some(w=>w.rno===o.rno)):mtShow==='deliv'?all.filter(o=>delLog.some(d=>d.rno===o.rno&&inPer(d.d,P))):all.filter(o=>inPer(o.created,P));
  if(q)list=list.filter(o=>ordMatch(o,q)||cust(o.cid).name.toLowerCase().includes(q)||String(cust(o.cid).phone).includes(q));
  const st=(o,k)=>{const w=waSent(o,k);return w?`<span class="pill s-ready">${dmy(w.d)}</span>`:'<span class="pill s-late">NOT SENT</span>'};
  const lastMsg=o=>{const w=WALOG.filter(x=>x.rno===o.rno).sort((a,b)=>b.d-a.d)[0];return w?`${dmy(w.d)} · ${KIND_T[w.kind]||w.kind}`:''};
  V(`<div class="okpi"><div class="${readyMiss.length?'bad':''} tap" data-mts="ready"><span>Ready · message not sent</span><b>${readyMiss.length}</b><em>${readySent.length} sent</em></div><div class="${dueMiss.length?'bad':''}"><span>Due · never reminded</span><b>${dueMiss.length}</b><em>${sar(sumBy(dueMiss,o=>o.total-o.paid))} SAR</em></div>
   <div class="tap" data-mts="sent"><span>Messages sent</span><b>${logP.length}</b><em>${perLabel(P)}</em></div><div class="tap" data-mts="deliv"><span>Pieces delivered</span><b>${sumBy(delLog.filter(d=>inPer(d.d,P)&&(!curBranch||d.branch===curBranch)),d=>d.qty)}</b><em>${perLabel(P)}</em></div></div>
  <div class="panel"><div class="panel-h" style="flex-wrap:wrap;gap:10px"><div class="seg"><button class="${mtTab==='orders'?'on':''}" data-mtt="orders">Tracker by order / متابعة الطلبات</button><button class="${mtTab==='log'?'on':''}" data-mtt="log">All sent messages / كل الرسائل المرسلة <span class="num">${logP.length}</span></button></div><span class="sp"></span>
    ${mtTab==='orders'?`<select id="mtS" class="btn sm" style="padding:6px 10px">${[['ready','Ready – not sent first'],['open','All open orders'],['sent','Messages sent (period)'],['deliv','Delivered (period)'],['all','All orders (period)']].map(([k,t])=>`<option value="${k}" ${mtShow===k?'selected':''}>${t}</option>`).join('')}</select>`:''}${pgSearch('Name, mobile, order')}<button class="btn sm" id="mtCsv">Export CSV</button><a class="btn sm pri" href="#whatsapp">${ico('wa')}WhatsApp</a></div>
   <div class="panel-b" style="padding:10px 16px 0">${perBar('mtPer',P)}</div>
   ${mtTab==='orders'?xTable([{t:'Order',f:o=>`<b class="num">${esc(ono(o))}</b>`},{t:'Customer',f:o=>`<span dir="auto">${esc(cust(o.cid).name)}</span>`},{t:'Mobile',f:o=>`<span class="num">${esc(cust(o.cid).phone)}</span>`},{t:'Pcs',r:1,f:o=>o.qty},{t:'Delivered',r:1,f:o=>info.get(o.rno).dq},
      {t:'Status',f:o=>{const x=info.get(o.rno);return `<span class="pill ${WHERE_C(x.where)}">${esc(x.where)}</span>`}},{t:'Ready message',f:o=>o.st==='ready'||info.get(o.rno).dq>0?st(o,'READY'):'—'},{t:'Due',r:1,f:o=>o.total-o.paid>0.5?`<b class="tbad">${sar2(o.total-o.paid)}</b>`:'—'},{t:'Due reminder',f:o=>o.total-o.paid>0.5?st(o,'DUE'):'—'},{t:'Last message',f:o=>`<span class="muted">${lastMsg(o)}</span>`}],
      list.slice(0,600),{attr:o=>`data-lr="${o.rno}"`,h:'calc(100vh - 400px)',mw:'1100px'})
   :xTable([{t:'Date',f:w=>`<span class="num">${esc(w.at||dmy(w.d))}</span>`},{t:'Type',f:w=>`<span class="pill ${w.kind==='READY'?'s-ready':w.kind==='DUE'?'s-late':'s-info'}">${esc(KIND_T[w.kind]||w.kind)}</span>`},{t:'Order',f:w=>`<b class="num">${esc(onoR(w.rno))}</b>`},{t:'Customer',f:w=>`<span dir="auto">${esc(w.cid?cust(w.cid).name:'')}</span>`},{t:'Mobile',f:w=>`<span class="num">${esc(w.mobile||'')}</span>`},{t:'By',f:w=>esc(w.by||'')},{t:'Branch',f:w=>esc(bname(w.branch))}],
      logP.filter(w=>!q||String(w.mobile||'').includes(q)||(w.cid&&cust(w.cid).name.toLowerCase().includes(q))||String(onoR(w.rno)).toLowerCase().includes(q)).slice().sort((a,b)=>b.d-a.d||String(b.at).localeCompare(String(a.at))),{h:'calc(100vh - 400px)',mw:'900px',empty:'No messages in this period.'})}</div>`);
  perBind('mtPer',P,messagesView);bindPgSearch();
  document.querySelectorAll('[data-mtt]').forEach(b=>b.onclick=()=>{mtTab=b.dataset.mtt;messagesView()});
  document.querySelectorAll('[data-mts]').forEach(b=>b.onclick=()=>{mtTab=b.dataset.mts==='sent'?'log':'orders';if(b.dataset.mts!=='sent')mtShow=b.dataset.mts;messagesView()});
  const s=document.getElementById('mtS');if(s)s.onchange=()=>{mtShow=s.value;messagesView()};
  document.querySelectorAll('#view [data-lr]').forEach(r=>r.onclick=()=>openOrder(+r.dataset.lr));
  document.getElementById('mtCsv').onclick=()=>mtTab==='orders'?csvOut('message_tracker',[['Order','Customer','Mobile','Pcs','Delivered','Status','Ready message','Due','Due reminder'],...list.map(o=>{const r=waSent(o,'READY'),d=waSent(o,'DUE');return [ono(o),cust(o.cid).name,cust(o.cid).phone,o.qty,info.get(o.rno).dq,info.get(o.rno).where,r?dmy(r.d):(o.st==='ready'?'NOT SENT':''),o.total-o.paid>0.5?sar2(o.total-o.paid):'',o.total-o.paid>0.5?(d?dmy(d.d):'NOT SENT'):'']})])
    :csvOut('whatsapp_log',[['Date','Type','Order','Customer','Mobile','By','Message'],...logP.map(w=>[w.at||dmy(w.d),KIND_T[w.kind]||w.kind,onoR(w.rno),w.cid?cust(w.cid).name:'',w.mobile,w.by||'',w.msg||''])]);
}

/* ================= Language: English · العربية · हिन्दी =================
   The screens are written in English; this swaps every known label on the page (menu, titles, buttons, table heads, tiles)
   for the chosen language, also on whatever is drawn later. Names, numbers and Arabic text stay as they are.
   The choice is kept on this device. */
let LANG=(()=>{try{return localStorage.getItem('st_lang')||'en'}catch(e){return 'en'}})();
const L3=(ar,hi)=>({ar,hi});
const TR_SRC={
 // menu & page titles
 'Dashboard':L3('لوحة التحكم','डैशबोर्ड'),'Home':L3('الرئيسية','होम'),'Orders':L3('الطلبات','ऑर्डर'),'New order':L3('طلب جديد','नया ऑर्डर'),'New':L3('جديد','नया'),
 'Measurements':L3('المقاسات','नाप'),'Measure':L3('المقاس','नाप'),'Customers':L3('العملاء','ग्राहक'),'Payments':L3('المدفوعات','भुगतान'),'Workers':L3('العمال','कारीगर'),
 'Branches & factories':L3('الفروع والمصانع','शाखाएँ और फैक्ट्री'),'Branches':L3('الفروع','शाखाएँ'),'Daily report':L3('التقرير اليومي','दैनिक रिपोर्ट'),'Daily':L3('اليومي','दैनिक'),
 'Reports':L3('التقارير','रिपोर्ट'),'Settings':L3('الإعدادات','सेटिंग्स'),'Cashier desk':L3('الكاشير','कैशियर डेस्क'),'Desk':L3('الكاشير','डेस्क'),'My work':L3('عملي','मेरा काम'),
 'My work & pay':L3('عملي وراتبي','मेरा काम और वेतन'),'My pay':L3('راتبي','मेरा वेतन'),'Production board':L3('لوحة الإنتاج','प्रोडक्शन बोर्ड'),'Board':L3('اللوحة','बोर्ड'),
 'Purchases & stock':L3('المشتريات والمخزون','खरीद और स्टॉक'),'Stock':L3('المخزون','स्टॉक'),'WhatsApp':L3('واتساب','व्हाट्सऐप'),'Message tracker':L3('متابعة الرسائل','मैसेज ट्रैकर'),'Messages':L3('الرسائل','मैसेज'),
 'Daily work':L3('العمل اليومي','रोज़ का काम'),'Business':L3('الأعمال','व्यापार'),'Cashier':L3('الكاشير','कैशियर'),'Workshop':L3('الورشة','वर्कशॉप'),'Viewing':L3('عرض','देख रहे हैं'),
 'All branches':L3('كل الفروع','सभी शाखाएँ'),'All branches & factories':L3('كل الفروع والمصانع','सभी शाखाएँ और फैक्ट्री'),'Switch':L3('تبديل','बदलें'),'Sign out':L3('خروج','लॉग आउट'),
 // workshop steps & status
 'Cutting':L3('القص','कटिंग'),'Tailor':L3('الخياط','दर्ज़ी'),'Tailoring':L3('الخياطة','सिलाई'),'Hinge':L3('الهنج','हिंज'),'Tatreez':L3('التطريز','कढ़ाई'),'Bottom cutting':L3('قص الأسفل','बॉटम कटिंग'),'Ironing':L3('الكوي','इस्त्री'),
 'Ready for pickup':L3('جاهز للاستلام','लेने के लिए तैयार'),'Ready':L3('جاهز','तैयार'),'Delivered':L3('تم التسليم','दे दिया'),'Late':L3('متأخر','देर'),'Overdue':L3('متأخر','देर से'),'Not cut':L3('لم يُقص','कटा नहीं'),
 'Cut done':L3('تم القص','कटिंग हो गई'),'Stitching':L3('قيد الخياطة','सिलाई चल रही'),'Stitched':L3('تمت الخياطة','सिल गया'),'Back to tailor':L3('عاد للخياط','दर्ज़ी के पास वापस'),'Pending':L3('معلق','बाकी'),
 'In progress':L3('قيد التنفيذ','चल रहा है'),'Done':L3('تم','हो गया'),'Waiting':L3('بانتظار','इंतज़ार'),'Not needed':L3('غير مطلوب','ज़रूरत नहीं'),'Not yet':L3('ليس بعد','अभी नहीं'),
 'Taken · due':L3('مستلم · متبقي','ले गया · बाकी'),'✓ Ready':L3('✓ جاهز','✓ तैयार'),'Open details':L3('التفاصيل','विवरण'),'Measurements & style':L3('المقاسات والموديل','नाप और स्टाइल'),
 'Waiting for me':L3('بانتظاري','मेरे लिए बाकी'),'Finished this month':L3('أنجزت هذا الشهر','इस महीने पूरे'),'Done today':L3('أنجزت اليوم','आज पूरे'),'My pay this month':L3('راتبي هذا الشهر','इस महीने का वेतन'),
 'Nothing waiting for you right now.':L3('لا يوجد عمل بانتظارك الآن.','अभी आपके लिए कोई काम नहीं।'),
 // common words, table heads
 'Order':L3('الطلب','ऑर्डर'),'Order No':L3('رقم الطلب','ऑर्डर नंबर'),'Invoice':L3('الفاتورة','इनवॉइस'),'Customer':L3('العميل','ग्राहक'),'Mobile':L3('الجوال','मोबाइल'),'Booked':L3('تاريخ الحجز','बुकिंग'),
 'Delivery':L3('التسليم','डिलीवरी'),'Pcs':L3('القطع','पीस'),'Total':L3('الإجمالي','कुल'),'Paid':L3('المدفوع','जमा'),'Due':L3('المتبقي','बाकी'),'Balance':L3('المتبقي','बाकी'),'Status':L3('الحالة','स्थिति'),
 'Cut':L3('القص','कटिंग'),'Branch':L3('الفرع','शाखा'),'Made at':L3('مكان الخياطة','कहाँ सिला'),'Fabric':L3('القماش','कपड़ा'),'Date':L3('التاريخ','तारीख'),'Method':L3('طريقة الدفع','तरीका'),'Amount':L3('المبلغ','रकम'),
 'Type':L3('النوع','प्रकार'),'Worker':L3('العامل','कारीगर'),'Job':L3('الوظيفة','काम'),'Present':L3('حاضر','हाज़िर'),'Name':L3('الاسم','नाम'),'Orders / pcs':L3('الطلبات / القطع','ऑर्डर / पीस'),
 'Total pcs':L3('إجمالي القطع','कुल पीस'),'Thobes':L3('الثياب','थोब'),'Ordered':L3('تاريخ الطلب','ऑर्डर दिया'),'Pickup':L3('الاستلام','लेने की तारीख'),'Stitched at':L3('مكان الخياطة','कहाँ सिला'),
 'Items':L3('الأصناف','आइटम'),'Style':L3('الموديل','स्टाइल'),'Note':L3('ملاحظة','नोट'),'Search':L3('بحث','खोजें'),'Code':L3('الرمز','कोड'),'Item':L3('الصنف','आइटम'),'Company':L3('الشركة','कंपनी'),
 'Seller':L3('المورد','विक्रेता'),'Colour':L3('اللون','रंग'),'Model':L3('الموديل','मॉडल'),'Value':L3('القيمة','मूल्य'),'Yards':L3('ياردة','गज़'),'In stock':L3('في المخزون','स्टॉक में'),
 // buttons
 'Save':L3('حفظ','सेव'),'Cancel':L3('إلغاء','रद्द'),'Close':L3('إغلاق','बंद'),'Print':L3('طباعة','प्रिंट'),'Print A4':L3('طباعة A4','A4 प्रिंट'),'Export CSV':L3('تصدير CSV','CSV निकालें'),'Edit':L3('تعديل','बदलें'),
 'Delete':L3('حذف','हटाएँ'),'Add':L3('إضافة','जोड़ें'),'Today':L3('اليوم','आज'),'Yesterday':L3('أمس','कल'),'7 days':L3('٧ أيام','7 दिन'),'This month':L3('هذا الشهر','इस महीने'),'Last month':L3('الشهر الماضي','पिछले महीने'),
 'This year':L3('هذه السنة','इस साल'),'Month':L3('الشهر','महीना'),'From':L3('من','से'),'To':L3('إلى','तक'),'◀ Previous':L3('◀ السابق','◀ पिछला'),'Next ▶':L3('التالي ▶','अगला ▶'),'Details':L3('التفاصيل','विवरण'),
 '🖨 Invoice':L3('🖨 الفاتورة','🖨 इनवॉइस'),'Copy message':L3('نسخ الرسالة','मैसेज कॉपी'),'Copy for WhatsApp':L3('نسخ للواتساب','व्हाट्सऐप के लिए कॉपी'),'Open order':L3('فتح الطلب','ऑर्डर खोलें'),'OK':L3('حسناً','ठीक है'),
 'Save measurements':L3('حفظ المقاسات','नाप सेव करें'),'Undo changes':L3('تراجع','बदलाव वापस'),'Full screen':L3('ملء الشاشة','पूरी स्क्रीन'),'🖨 Print sheet':L3('🖨 طباعة الورقة','🖨 शीट प्रिंट'),
 'Save & Print  (Ctrl+S)':L3('حفظ وطباعة (Ctrl+S)','सेव और प्रिंट (Ctrl+S)'),'Save only':L3('حفظ فقط','सिर्फ़ सेव'),'Add worker':L3('إضافة عامل','कारीगर जोड़ें'),'Simple dashboard':L3('لوحة مختصرة','सादा डैशबोर्ड'),
 'Shop dashboard (AL THOB)':L3('لوحة المحل (الثوب)','दुकान डैशबोर्ड (AL THOB)'),'Shop dashboard':L3('لوحة المحل','दुकान डैशबोर्ड'),'Open next ▶':L3('فتح التالي ▶','अगला खोलें ▶'),'Open':L3('فتح','खोलें'),
 // tiles & headings
 'Money & orders':L3('المال والطلبات','पैसा और ऑर्डर'),'Sales booked':L3('المبيعات المحجوزة','बुक हुई बिक्री'),'Collected':L3('المحصّل','वसूल'),'Collected – down payments':L3('المحصّل – العربون','वसूल – एडवांस'),
 'Collected – due payments':L3('المحصّل – المتبقي','वसूल – बाकी भुगतान'),'All customers due':L3('مستحقات العملاء','सब ग्राहकों का बाकी'),'Refunds':L3('المرتجعات','वापसी'),'Not delivered':L3('لم يُسلّم','नहीं दिया'),
 'Hinge pcs':L3('قطع الهنج','हिंज पीस'),'Zip pcs':L3('قطع السحاب','ज़िप पीस'),'Total order pcs':L3('إجمالي قطع الطلبات','कुल ऑर्डर पीस'),'Cutting finished':L3('القص المنتهي','कटिंग पूरी'),
 'Cutting remaining':L3('القص المتبقي','कटिंग बाकी'),'Total stitched':L3('إجمالي المخيط','कुल सिले'),'Stitching remaining':L3('الخياطة المتبقية','सिलाई बाकी'),'Total delivered':L3('إجمالي المسلّم','कुल दिए'),
 'Remaining':L3('المتبقي','बाकी'),'From earlier months':L3('من الأشهر السابقة','पिछले महीनों से'),'Collected by method':L3('المحصّل حسب الطريقة','तरीके से वसूल'),'Customers with due':L3('عملاء عليهم مبالغ','बाकी वाले ग्राहक'),
 'Late deliveries':L3('تسليمات متأخرة','देर वाली डिलीवरी'),'Work plan':L3('خطة العمل','काम की योजना'),'Top 50 customers':L3('أفضل ٥٠ عميل','टॉप 50 ग्राहक'),'Hinge & zip by month':L3('الهنج والسحاب شهرياً','महीने के हिसाब से हिंज और ज़िप'),
 'Low stock':L3('مخزون منخفض','कम स्टॉक'),'Summary':L3('ملخص','सारांश'),'Daily report (exe)':L3('التقرير اليومي (البرنامج)','दैनिक रिपोर्ट (exe)'),'Tailoring report':L3('تقرير الخياطة','सिलाई रिपोर्ट'),
 'Work by worker':L3('العمل حسب العامل','कारीगर के हिसाब से काम'),'Payments & deliveries':L3('المدفوعات والتسليم','भुगतान और डिलीवरी'),'Down payment':L3('العربون','एडवांस'),'Payment':L3('دفعة','भुगतान'),
 'Payment + delivery':L3('دفعة + تسليم','भुगतान + डिलीवरी'),'Delivery only':L3('تسليم فقط','सिर्फ़ डिलीवरी'),'Delivered with due':L3('سُلّم والمبلغ متبقي','दिया पर पैसा बाकी'),'Refund':L3('مرتجع','वापसी'),
 'Business report':L3('تقرير الأعمال','व्यापार रिपोर्ट'),'Workshop flow':L3('مراحل الورشة','वर्कशॉप का क्रम'),'Logins & permissions':L3('الدخول والصلاحيات','लॉगिन और अनुमति'),
 'Orders ready / الطلبات الجاهزة':L3('الطلبات الجاهزة','तैयार ऑर्डर'),'Due reminders / تذكير بالمستحقات':L3('تذكير بالمستحقات','बाकी की याद'),'Delivery date changed':L3('تغيير موعد التسليم','डिलीवरी तारीख बदली'),'Broadcast':L3('رسالة جماعية','सबको मैसेज'),
 'All orders':L3('كل الطلبات','सभी ऑर्डर'),'With due':L3('عليها مبالغ','बाकी वाले'),'Free gifts':L3('هدايا','मुफ़्त गिफ़्ट'),'Taken with due':L3('مستلم ومتبقي','ले गया पर बाकी'),
 'Orders in progress':L3('طلبات قيد التنفيذ','चल रहे ऑर्डर'),'Revenue, last 7 days':L3('الإيراد · آخر ٧ أيام','कमाई · पिछले 7 दिन'),'Balance due from customers':L3('المتبقي على العملاء','ग्राहकों पर बाकी'),
 'Workshop right now':L3('الورشة الآن','अभी वर्कशॉप'),'Upcoming deliveries':L3('التسليمات القادمة','आने वाली डिलीवरी'),'Daily revenue':L3('الإيراد اليومي','रोज़ की कमाई'),'All orders ':L3('كل الطلبات','सभी ऑर्डर'),
 'Order value':L3('قيمة الطلبات','ऑर्डर की कीमत'),'Due from customers':L3('المتبقي على العملاء','ग्राहकों पर बाकी'),'Past delivery date':L3('تجاوز موعد التسليم','डिलीवरी की तारीख निकल गई'),
 'Waiting for the customer':L3('بانتظار العميل','ग्राहक का इंतज़ार'),'Shop workshop':L3('ورشة المحل','दुकान की वर्कशॉप'),'Not assigned yet':L3('لم يُحدد بعد','अभी तय नहीं'),'Orders':L3('الطلبات','ऑर्डर'),
 'Measurement sheet & style':L3('ورقة المقاس والموديل','नाप शीट और स्टाइल'),'📐 Open the measurement sheet':L3('📐 فتح ورقة المقاس','📐 नाप शीट खोलें'),'Old shop paper values':L3('قيم الورقة القديمة','पुरानी पर्ची के नाप'),
 'WhatsApp message':L3('رسالة واتساب','व्हाट्सऐप मैसेज'),'Hand over to customer':L3('تسليم للعميل','ग्राहक को दें'),'Customer':L3('العميل','ग्राहक'),'Mobile':L3('الجوال','मोबाइल'),'Address':L3('العنوان','पता'),
 'Booking date':L3('تاريخ الحجز','बुकिंग की तारीख'),'Delivery date':L3('تاريخ التسليم','डिलीवरी की तारीख'),'Invoice No':L3('رقم الفاتورة','इनवॉइस नंबर'),'Discount':L3('الخصم','छूट'),'VAT':L3('الضريبة','वैट'),
 'Pay type':L3('نوع الراتب','वेतन का प्रकार'),'This month':L3('هذا الشهر','इस महीने'),'Joined':L3('تاريخ الانضمام','जुड़ने की तारीख'),'Nationality':L3('الجنسية','राष्ट्रीयता'),'Iqama expiry':L3('انتهاء الإقامة','इक़ामा ख़त्म'),
 'Mark on leave':L3('إجازة','छुट्टी पर'),'Deactivate':L3('إيقاف','बंद करें'),'Block':L3('حظر','ब्लॉक'),'App link':L3('رابط التطبيق','ऐप लिंक'),'Sign in':L3('دخول','लॉगिन'),'Enter':L3('دخول','अंदर जाएँ'),
 'Measurements':L3('المقاسات','नाप'),'Due reminder':L3('تذكير بالمبلغ','बाकी की याद'),'Payments & deliveries':L3('المدفوعات والتسليم','भुगतान और डिलीवरी'),
 'Order no.':L3('رقم الطلب','ऑर्डर नं.'),
 'Pay / Deliver':L3('دفع / تسليم','भुगतान / डिलीवरी'),'Receive payment / Deliver':L3('استلام دفعة / تسليم','भुगतान लें / डिलीवरी'),'Down payment ':L3('العربون','एडवांस'),
 'Ready · not taken':L3('جاهز · لم يُستلم','तैयार · नहीं ले गया'),'In the workshop':L3('في الورشة','वर्कशॉप में'),
 'Workers\' work':L3('عمل العمال','कारीगरों का काम'),'Attendance · last 14 days':L3('الحضور · آخر ١٤ يوم','हाज़िरी · पिछले 14 दिन'),'Language':L3('اللغة','भाषा'),
};
const TR={ar:{},hi:{}};Object.entries(TR_SRC).forEach(([k,v])=>{TR.ar[k]=v.ar;TR.hi[k]=v.hi});
function trText(n){const d=TR[LANG];const v=n.nodeValue;if(!v)return;const k=v.trim();if(k&&d[k]!==undefined&&d[k]!==k)n.nodeValue=v.replace(k,d[k])}
function trTree(root){if(LANG==='en'||!root)return;const d=TR[LANG];
  if(root.nodeType===3){trText(root);return}
  if(root.nodeType!==1)return;
  const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode:n=>{const p=n.parentNode;return p&&/^(SCRIPT|STYLE|TEXTAREA)$/.test(p.nodeName)?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT}});
  let n;while((n=w.nextNode()))trText(n);
  (root.querySelectorAll?[root,...root.querySelectorAll('[placeholder],[title],[aria-label]')]:[]).forEach(e=>{['placeholder','title'].forEach(a=>{const v=e.getAttribute&&e.getAttribute(a);if(v&&d[v.trim()])e.setAttribute(a,d[v.trim()])})});
  if(root.querySelectorAll)root.querySelectorAll('option').forEach(o=>{const k=o.textContent.trim();if(d[k])o.textContent=d[k]})}
function setLang(l){LANG=l;try{localStorage.setItem('st_lang',l)}catch(e){}location.reload()}
(function i18nStart(){
  document.documentElement.lang=LANG==='ar'?'ar':LANG==='hi'?'hi':'en';
  if(LANG==='ar')document.documentElement.dir='rtl';
  // the language box in the top bar
  const bar=document.querySelector('header.top #themeBtn');
  if(bar){const s=document.createElement('select');s.id='langSel';s.className='langsel';s.setAttribute('aria-label','Language');
    s.innerHTML='<option value="en">English</option><option value="ar">العربية</option><option value="hi">हिन्दी</option>';s.value=LANG;s.onchange=()=>setLang(s.value);bar.parentNode.insertBefore(s,bar)}
  // also on the sign-in screen (top corner)
  const f=document.createElement('select');f.id='langFloat';f.className='langsel';f.setAttribute('aria-label','Language');f.innerHTML='<option value="en">English</option><option value="ar">العربية</option><option value="hi">हिन्दी</option>';f.value=LANG;f.onchange=()=>setLang(f.value);document.body.appendChild(f);
  if(LANG==='en')return;
  trTree(document.body);
  new MutationObserver(ms=>{for(const m of ms){if(m.type==='characterData')trText(m.target);else m.addedNodes.forEach(trTree)}}).observe(document.body,{childList:true,subtree:true,characterData:true});
})();

if(DEMO){route();showLogin()}else liveBoot();
setTimeout(()=>location.reload(),addD(today,1)-new Date()+60000);

/* generated by tools/jameel_gen.py from the exe's JameelSheet.cs – do not edit by hand */
const JSPEC={"w":1500.0,"h":956.0,"notes":"q_notes","fields":[{"k":"q_c0","x":408.62,"y":65.94,"w":172.0,"h":39.96,"t":"box"},{"k":"q_c1","x":408.62,"y":110.34,"w":172.0,"h":44.4,"t":"box"},{"k":"q_b0","x":406.41,"y":239.1,"w":72.77,"h":55.5,"t":"box"},{"k":"q_b1","x":406.41,"y":299.04,"w":72.77,"h":55.5,"t":"box"},{"k":"q_b2","x":510.05,"y":239.1,"w":72.77,"h":55.5,"t":"box"},{"k":"q_b9","x":510.05,"y":299.04,"w":72.77,"h":55.5,"t":"box"},{"k":"q_b3","x":406.41,"y":394.5,"w":176.41,"h":59.94,"t":"box"},{"k":"q_b4","x":406.41,"y":458.88,"w":176.41,"h":59.94,"t":"box"},{"k":"q_b5","x":406.41,"y":523.26,"w":176.41,"h":59.94,"t":"box"},{"k":"q_b6","x":406.41,"y":587.64,"w":86.0,"h":62.16,"t":"box"},{"k":"q_b7","x":496.82,"y":587.64,"w":86.0,"h":62.16,"t":"box"},{"k":"q_b8","x":406.41,"y":654.24,"w":176.41,"h":59.94,"t":"box"},{"k":"q_b10","x":406.41,"y":718.62,"w":176.41,"h":59.94,"t":"box"},{"k":"q_s0","x":635.74,"y":164.73,"w":66.15,"h":53.28,"t":"box"},{"k":"q_s1","x":708.51,"y":195.81,"w":66.15,"h":53.28,"t":"box"},{"k":"q_s2","x":781.28,"y":226.89,"w":66.15,"h":53.28,"t":"box"},{"k":"q_s3","x":854.05,"y":256.86,"w":66.15,"h":53.28,"t":"box"},{"k":"q_s5","x":642.36,"y":322.35,"w":66.15,"h":53.28,"t":"box"},{"k":"q_s6","x":715.13,"y":350.1,"w":66.15,"h":53.28,"t":"box"},{"k":"q_s7","x":787.9,"y":376.74,"w":66.15,"h":53.28,"t":"box"},{"k":"q_s8","x":860.67,"y":403.38,"w":66.15,"h":53.28,"t":"box"},{"k":"q_cf_l","x":640.15,"y":83.7,"w":70.56,"h":55.5,"t":"box"},{"k":"q_cf_r","x":715.13,"y":83.7,"w":70.56,"h":55.5,"t":"box"},{"k":"q_lb0","x":287.33,"y":164.73,"w":66.15,"h":53.28,"t":"box"},{"k":"q_lb1","x":214.56,"y":195.81,"w":66.15,"h":53.28,"t":"box"},{"k":"q_ls2","x":141.79,"y":226.89,"w":66.15,"h":53.28,"t":"box"},{"k":"q_lb2","x":69.03,"y":256.86,"w":66.15,"h":53.28,"t":"box"},{"k":"q_lb3","x":280.72,"y":322.35,"w":66.15,"h":53.28,"t":"box"},{"k":"q_ls5","x":207.95,"y":350.1,"w":66.15,"h":53.28,"t":"box"},{"k":"q_ls6","x":135.18,"y":376.74,"w":66.15,"h":53.28,"t":"box"},{"k":"q_ls7","x":62.41,"y":403.38,"w":66.15,"h":53.28,"t":"box"},{"k":"q_lb4","x":271.9,"y":461.1,"w":72.77,"h":66.6,"t":"box"},{"k":"q_lb5","x":264.18,"y":545.46,"w":72.77,"h":66.6,"t":"box"},{"k":"q_lb6","x":256.46,"y":629.82,"w":72.77,"h":66.6,"t":"box"},{"k":"q_lb7","x":248.74,"y":714.18,"w":72.77,"h":66.6,"t":"box"},{"k":"q_r1","x":695.28,"y":536.58,"w":72.77,"h":62.16,"t":"box"},{"k":"q_z_rq","x":1318,"y":582.0,"w":80,"h":44,"t":"box"},{"k":"q_z_pl","x":1234,"y":582.0,"w":80,"h":44,"t":"box"},{"k":"q_z_cf","x":1054,"y":630.0,"w":88,"h":44,"t":"box"},{"k":"q_z_pk","x":142,"y":642.0,"w":60,"h":50,"t":"box"},{"k":"q_z_pk2","x":22,"y":642.0,"w":116,"h":50,"t":"box"},{"k":"q_lt0","x":32,"y":102.0,"w":160,"h":52,"t":"box"},{"k":"q_z_cl0","x":1334,"y":630.0,"w":90,"h":44,"t":"box"},{"k":"q_z_cl1","x":1240,"y":630.0,"w":90,"h":44,"t":"box"},{"k":"q_z_cl2","x":1146,"y":630.0,"w":90,"h":44,"t":"box"},{"k":"q_notes","x":958,"y":704.0,"w":524,"h":187,"t":"multi"},{"k":"q_x_mob","x":113,"y":698.0,"w":89,"h":26,"t":"tick","l":"جيب جوال"},{"k":"q_x_mob2","x":22,"y":698.0,"w":87,"h":26,"t":"tick","l":"دبل"},{"k":"q_x_hid","x":113,"y":728.0,"w":89,"h":26,"t":"tick","l":"جيب مخفي"},{"k":"q_x_vis","x":22,"y":728.0,"w":87,"h":26,"t":"tick","l":"جيب باين"}],"models":{"area":[958,12.0,524,562],"cells":[{"k":"q_d_jab","t":"الجبزور","o":[["placket_01_square_visible","جبزور مربع باين",""],["placket_02_triangle_visible","جبزور مثلث باين",""],["placket_03_square_hidden","جبزور مربع مخفي",""],["placket_04_triangle_hidden","جبزور مثلث مخفي",""],["placket_05_square_zipper","جبزور مربع سحاب",""],["placket_06_triangle_zipper","جبزور مثلث سحاب",""],["placket_07_square_hidden_zipper","جبزور مربع سحاب مخفي",""],["placket_08_triangle_hidden_zipper","جبزور مثلث سحاب مخفي",""],["placket_09_square_hidden_padding","جبزور مربع مخفي حشوة",""],["placket_10_triangle_hidden_padding","جبزور مثلث مخفي حشوة",""]]},{"k":"q_d_kabak","t":"الكبك","o":[["cuff_01_plain","سادة",""],["cuff_02_plain_open","سادة مفتوح",""],["cuff_03_formal_nopleat","كبك رسمي","بدون كسرة"],["cuff_03_formal_pleat1","كبك رسمي","كسرة واحدة"],["cuff_03_formal_pleat2","كبك رسمي","كسرتين"],["cuff_04_french_nopleat","كبك فرنسي","بدون كسرة"],["cuff_04_french_pleat1","كبك فرنسي","كسرة واحدة"],["cuff_04_french_pleat2","كبك فرنسي","كسرتين"],["cuff_05_chamfered_formal_nopleat","كبك مشطوف","رسمي - بدون كسرة"],["cuff_05_chamfered_formal_pleat1","كبك مشطوف","رسمي - كسرة واحدة"],["cuff_05_chamfered_formal_pleat2","كبك مشطوف","رسمي - كسرتين"],["cuff_05_chamfered_french_nopleat","كبك مشطوف","فرنسي - بدون كسرة"],["cuff_05_chamfered_french_pleat1","كبك مشطوف","فرنسي - كسرة واحدة"],["cuff_05_chamfered_french_pleat2","كبك مشطوف","فرنسي - كسرتين"],["cuff_06_square_formal_nopleat","كبك مربع","رسمي - بدون كسرة"],["cuff_06_square_formal_pleat1","كبك مربع","رسمي - كسرة واحدة"],["cuff_06_square_formal_pleat2","كبك مربع","رسمي - كسرتين"],["cuff_06_square_french_nopleat","كبك مربع","فرنسي - بدون كسرة"],["cuff_06_square_french_pleat1","كبك مربع","فرنسي - كسرة واحدة"],["cuff_06_square_french_pleat2","كبك مربع","فرنسي - كسرتين"],["cuff_07_round_formal_nopleat","كبك مدور","رسمي - بدون كسرة"],["cuff_07_round_formal_pleat1","كبك مدور","رسمي - كسرة واحدة"],["cuff_07_round_formal_pleat2","كبك مدور","رسمي - كسرتين"],["cuff_07_round_french_nopleat","كبك مدور","فرنسي - بدون كسرة"],["cuff_07_round_french_pleat1","كبك مدور","فرنسي - كسرة واحدة"],["cuff_07_round_french_pleat2","كبك مدور","فرنسي - كسرتين"],["cuff_08_double_formal_nopleat","كبك دبل","رسمي - بدون كسرة"],["cuff_08_double_formal_pleat1","كبك دبل","رسمي - كسرة واحدة"],["cuff_08_double_formal_pleat2","كبك دبل","رسمي - كسرتين"],["cuff_08_double_french_nopleat","كبك دبل","فرنسي - بدون كسرة"],["cuff_08_double_french_pleat1","كبك دبل","فرنسي - كسرة واحدة"],["cuff_08_double_french_pleat2","كبك دبل","فرنسي - كسرتين"]]},{"k":"q_d_col","t":"القلاب / الرقبة","o":[["collar_03_formal_2","قلاب رسمي 2",""],["collar_03_formal_2_button","قلاب رسمي 2","زرار باين"],["collar_03_formal_2_button1","قلاب رسمي 2","زرار باين ١"],["collar_03_formal_2_hidden_snap1","قلاب رسمي 2","مخفي كبس واحد"],["collar_03_formal_2_hidden_snap2","قلاب رسمي 2","مخفي كبس ٢"],["collar_03_formal_2_snap2","قلاب رسمي 2","كبس ٢"],["collar_04_french","قلاب فرنسي",""],["collar_04_french_button","قلاب فرنسي","زرار باين"],["collar_04_french_button1","قلاب فرنسي","زرار باين ١"],["collar_04_french_hidden_snap1","قلاب فرنسي","مخفي كبس واحد"],["collar_04_french_hidden_snap2","قلاب فرنسي","مخفي كبس ٢"],["collar_04_french_snap2","قلاب فرنسي","كبس ٢"],["collar_05_formal","قلاب رسمي",""],["collar_05_formal_button","قلاب رسمي","زرار باين"],["collar_05_formal_button1","قلاب رسمي","زرار باين ١"],["collar_05_formal_hidden_snap1","قلاب رسمي","مخفي كبس واحد"],["collar_05_formal_hidden_snap2","قلاب رسمي","مخفي كبس ٢"],["collar_05_formal_snap2","قلاب رسمي","كبس ٢"],["collar_01_regular","رقبة عادي",""],["collar_01_regular_button","رقبة عادي","زرار باين"],["collar_01_regular_button1","رقبة عادي","زرار باين ١"],["collar_01_regular_hidden_snap1","رقبة عادي","مخفي كبس واحد"],["collar_01_regular_hidden_snap2","رقبة عادي","مخفي كبس ٢"],["collar_01_regular_snap2","رقبة عادي","كبس ٢"],["collar_02_chinese_square","رقبة صيني مربع",""],["collar_06_round","رقبة مدور",""],["collar_06_round_button","رقبة مدور","زرار باين"],["collar_06_round_button1","رقبة مدور","زرار باين ١"],["collar_06_round_hidden_snap1","رقبة مدور","مخفي كبس واحد"],["collar_06_round_hidden_snap2","رقبة مدور","مخفي كبس ٢"],["collar_06_round_snap2","رقبة مدور","كبس ٢"],["collar_07_chinese_round","رقبة صيني مدور",""]]}],"pocket":{"list":{"k":"q_d_jaib","t":"الجيب","o":[["pocket_01_square","جيب مربع",""],["pocket_01_square_clip","جيب مربع","مشبك"],["pocket_01_square_pen","جيب مربع","قلم كامل"],["pocket_02_chamfered","جيب مشطوف",""],["pocket_02_chamfered_clip","جيب مشطوف","مشبك"],["pocket_02_chamfered_pen","جيب مشطوف","قلم كامل"],["pocket_03_round","جيب دائري",""],["pocket_03_round_clip","جيب دائري","مشبك"],["pocket_03_round_pen","جيب دائري","قلم كامل"],["pocket_04_hidden","جيب مخفي",""],["pocket_04_hidden_clip","جيب مخفي","مشبك"],["pocket_04_hidden_pen","جيب مخفي","قلم كامل"]]},"r":[22,476.0,210,160]},"btn":{"k":"q_d_btn","cell":"q_d_jab","t":"زرار","o":["3","4","5"]},"extras":[{"k":"q_d_jab_fill","cell":"q_d_jab","t":"حشوة","o":["جبزور","الماني","سنجل","دبل","2.5 وصلة","3 وصلة"]},{"k":"q_d_cf_fill","cell":"q_d_kabak","t":"حشوة","o":["جبزور","الماني","سنجل","دبل","2.5 وصلة","3 وصلة"]},{"k":"q_d_col_fill","cell":"q_d_col","t":"حشوة","o":["جبزور","الماني","سنجل","دبل","2.5 وصلة","3 وصلة"]},{"k":"q_d_col_snap","cell":"q_d_col","t":"كبس","o":["1 بلاستك","2 بلاستك","1 حديد","2 حديد","1 عراوي","2 عراوي"]}],"fab":"q_d_fab","qty":"q_d_qty","more":"q_d_more","note":"q_d_mnote","max":20}};

/* =====================================================================================
   JAMEEL measurement sheet – the same sheet as the exe's JameelSheet (Settings: MeasurementLayout = Jameel):
   the blank sheet as a picture (img/jameel_sheet.svg), the boxes / tick boxes in their places, and in the style
   panel the model rows (fabric, how many, note, more fabrics, the drawings of جبزور / كبك / قلاب with their small lists)
   and the pocket drawing. Values are kept under the exe's own "q_" keys (measurements.data), so the sync copies them 1:1.
   ===================================================================================== */
const JPIC=f=>`/img/styles/${encodeURIComponent(f)}.png`;
const jHas=m=>!!m&&Object.keys(m).some(k=>k.startsWith('q_')&&String(m[k]).trim()!=='');
const jmk=(k,n)=>n<=1?k:k+'_'+n;
function jCount(m){return Object.keys(m||{}).filter(k=>k.startsWith('q_')&&String(m[k]).trim()!==''&&!/_sq$/.test(k)).length}
function jOpt(list,v){return list.o.find(o=>o[0]===v)||null}
function jStyleName(m,key){const M=JSPEC.models,all=[...M.cells,M.pocket.list];const l=all.find(c=>c.k===key.replace(/_\d+$/,''));const o=l&&jOpt(l,m[key]);return o?o[1]+(o[2]?' – '+o[2]:''):''}
/* the chosen drawings of model 1 (and the pocket) as small pictures – for job cards and the order drawer */
function jStylesHtml(m){
  if(!m)return '';const M=JSPEC.models;
  const cells=[...M.cells.map(c=>[c,m[c.k]]),[M.pocket.list,m[M.pocket.list.k]]].filter(([c,v])=>v&&jOpt(c,v));
  if(!cells.length)return '';
  return `<div class="jst">${cells.map(([c,v])=>{const o=jOpt(c,v);return `<div><img src="${JPIC(o[0])}" alt=""><b>${esc(o[1])}</b>${o[2]?`<span>${esc(o[2])}</span>`:''}<em>${esc(c.t)}</em></div>`}).join('')}</div>`;
}

let JPK=null;   // the picture picker: {list, key, done}
function jPicker(list,cur,done){
  let el=document.getElementById('jpk');
  if(!el){el=document.createElement('div');el.id='jpk';el.className='jpk';el.innerHTML='<div class="jpkb"><div class="jpkh"><b id="jpkT"></b><button class="btn sm" id="jpkX" aria-label="Close">✕</button></div><div id="jpkG" class="jpkg"></div></div>';document.body.appendChild(el);
    el.addEventListener('click',e=>{if(e.target===el||e.target.closest('#jpkX')){el.style.display='none';return}const d=e.target.closest('.jpko');if(!d||!JPK)return;el.style.display='none';JPK.done(d.dataset.v)})}
  JPK={list,done};
  document.getElementById('jpkT').textContent=list.t;
  document.getElementById('jpkG').innerHTML='<div class="jpko" data-v=""><b>— بدون / none —</b></div>'+list.o.map(o=>`<div class="jpko${cur===o[0]?' on':''}" data-v="${esc(o[0])}"><b>${esc(o[1])}</b><img src="${JPIC(o[0])}" alt="" loading="lazy">${o[2]?`<span>${esc(o[2])}</span>`:''}</div>`).join('');
  el.style.display='flex';
}

/* build the sheet into host. opt: {ro: read only, fabrics: ()=>[names], onChange: ()=>{}}. Returns {meas, zoom(f), fit(), refresh()} */
function jSheet(host,meas,opt={}){
  const S=JSPEC,M=S.models,ro=!!opt.ro;let scale=1,nModels=1,MORE={};
  const set=(k,v)=>{if(v!==''&&v!=null)meas[k]=String(v);else delete meas[k]};
  const changed=()=>{if(opt.onChange)opt.onChange()};
  host.innerHTML='';const els={};
  const sh=document.createElement('div');sh.className='jsh'+(ro?' ro':'');host.appendChild(sh);
  const bg=document.createElement('img');bg.src='/img/jameel_sheet.svg';bg.alt='';bg.className='jbg';sh.appendChild(bg);
  S.fields.forEach(f=>{
    let el;
    if(f.t==='box'||f.t==='multi'){el=document.createElement(f.t==='multi'?'textarea':'input');el.className='fi';el.dir='auto';if(ro)el.readOnly=true;
      el.addEventListener('input',()=>{set(f.k,el.value.trim()?el.value:'');el.classList.toggle('on',!!el.value.trim());changed()})}
    else{el=document.createElement('div');el.className='tk';el.innerHTML=`<b>✓</b><span>${esc(f.l)}</span>`;
      if(!ro)el.addEventListener('click',()=>{set(f.k,meas[f.k]==='1'?'':'1');paint();changed()})}
    el.dataset.k=f.k;els[f.k]=el;sh.appendChild(el);
  });
  // model rows and the pocket
  const mdl=document.createElement('div');mdl.className='mdl';sh.appendChild(mdl);
  const pp=document.createElement('div');pp.className='mc pp';sh.appendChild(pp);
  const dl=document.createElement('datalist');dl.id='jfab'+Math.random().toString(36).slice(2,7);sh.appendChild(dl);
  const mKeys=()=>[M.fab,M.qty,M.more,M.note,M.btn.k,...M.cells.map(c=>c.k),...M.extras.map(e=>e.k)];
  const count=()=>{let c=1;const ks=mKeys();for(let n=2;n<=M.max;n++)if(ks.some(k=>meas[jmk(k,n)]!==undefined))c=n;return Math.max(c,nModels)};
  const parseMore=s=>String(s||'').split(';').filter(x=>x!=='').map(x=>{const p=x.split('×');return[p[0]||'',p[1]||'',p[2]||'']});
  const joinMore=a=>{const c=s=>String(s).trim().replace(/;/g,' ').replace(/×/g,'x');return a.filter(p=>c(p[0])).map(p=>c(p[0])+'×'+c(p[1])+(c(p[2])?'×'+c(p[2]):'')).join(';')};
  const pic=(list,v)=>{const o=v?jOpt(list,v):null;if(!o)return `<span class="muted">${ro?'—':'— اختر / choose —'}</span>`;return `<span>${esc(o[1])}</span><img src="${JPIC(o[0])}" alt=""><span class="sub">${esc(o[2]||'')}</span>`};
  const sel=(k,n,t,opts)=>{const v=meas[jmk(k,n)]||'';return `<select data-k="${k}" data-n="${n}" ${ro?'disabled':''}><option value="">${esc(t)}: —</option>${opts.map(o=>`<option value="${esc(o)}"${o===v?' selected':''}>${esc(t+' '+o)}</option>`).join('')}</select>`};
  function renderModels(){
    dl.innerHTML=(opt.fabrics?opt.fabrics():[]).map(f=>`<option value="${esc(f)}">`).join('');
    const cnt=count();let h='';
    for(let n=1;n<=cnt;n++){
      const more=MORE[n]||(MORE[n]=parseMore(meas[jmk(M.more,n)]));
      h+=`<div class="md"><div class="mbar"><b>موديل ${n}:</b> القماش<input class="fb" list="${dl.id}" data-k="${M.fab}" data-n="${n}" value="${esc(meas[jmk(M.fab,n)]||'')}" ${ro?'readonly':''}>
        عدد <input class="qt" type="number" min="0" inputmode="numeric" data-k="${M.qty}" data-n="${n}" value="${esc(meas[jmk(M.qty,n)]||'')}" ${ro?'readonly':''}>
        <input class="nt" placeholder="ملاحظة" data-k="${M.note}" data-n="${n}" value="${esc(meas[jmk(M.note,n)]||'')}" ${ro?'readonly':''}>
        ${ro?'':`<button type="button" class="b2" data-af="${n}">+ قماش آخر</button>${n===1?'<button type="button" class="b1" data-am="1">+ موديل آخر</button>':`<button type="button" class="x" data-dm="${n}">حذف</button>`}`}</div>`;
      if(more.length){h+='<div class="mbar mmore">قماش آخر:';more.forEach((p,i)=>{const a=` data-more="${n}" data-i="${i}"`;
        h+=` <input class="fb" list="${dl.id}"${a} data-p="0" value="${esc(p[0])}" ${ro?'readonly':''}><input class="qt" type="number" min="0"${a} data-p="1" value="${esc(p[1])}" ${ro?'readonly':''}><input class="nt" placeholder="ملاحظة"${a} data-p="2" value="${esc(p[2])}" ${ro?'readonly':''}>${ro?'':`<button type="button" class="x" data-df="${n}" data-i="${i}">✕</button>`}`});h+='</div>'}
      h+='<div class="mcells">';
      M.cells.forEach((c,ci)=>{h+=`<div class="mc"><div class="mt">${esc(c.t)}</div><div class="mp" data-pk="${ci}" data-n="${n}">${pic(c,meas[jmk(c.k,n)])}</div><div class="mx">`;
        if(M.btn.cell===c.k)h+=sel(M.btn.k,n,M.btn.t,M.btn.o);
        M.extras.forEach(e=>{if(e.cell===c.k)h+=sel(e.k,n,e.t,e.o)});h+='</div></div>'});
      h+='</div></div>';
    }
    mdl.innerHTML=h;
    pp.innerHTML=`<div class="mt">${esc(M.pocket.list.t)}</div><div class="mp" style="height:${M.pocket.r[3]-26}px">${pic(M.pocket.list,meas[M.pocket.list.k])}</div>`;
  }
  function mdlInput(e){
    const el=e.target,k=el.dataset.k,mn=el.dataset.more;
    if(k)set(jmk(k,+el.dataset.n),el.value.trim());
    else if(mn){const m=+mn,a=MORE[m];a[+el.dataset.i][+el.dataset.p]=el.value;set(jmk(M.more,m),joinMore(a))}
    changed();
  }
  if(!ro){
    mdl.addEventListener('input',mdlInput);mdl.addEventListener('change',mdlInput);
    mdl.addEventListener('click',e=>{const b=e.target.closest('button,[data-pk]');if(!b)return;
      if(b.dataset.am){const cnt=count();if(cnt>=M.max)return;const n=cnt+1,fl=opt.fabrics?opt.fabrics():[];
        [M.btn.k,...M.cells.map(c=>c.k),...M.extras.map(x=>x.k)].forEach(k=>{if(meas[k]!==undefined)meas[jmk(k,n)]=meas[k]});
        set(jmk(M.fab,n),fl[n-1]||meas[M.fab]||'');set(jmk(M.qty,n),'1');nModels=n;MORE[n]=[];renderModels();changed();mdl.scrollTop=mdl.scrollHeight;return}
      if(b.dataset.dm){const n=+b.dataset.dm,cnt=count(),ks=mKeys();if(!confirm(`حذف الموديل ${n}؟ – remove model ${n}?`))return;
        for(let m=n;m<cnt;m++){ks.forEach(k=>set(jmk(k,m),meas[jmk(k,m+1)]));MORE[m]=MORE[m+1]}ks.forEach(k=>delete meas[jmk(k,cnt)]);delete MORE[cnt];nModels=Math.max(1,cnt-1);renderModels();changed();return}
      if(b.dataset.af){const n=+b.dataset.af,a=MORE[n]||(MORE[n]=[]);if(a.length>=4){toast('4 more fabrics at most');return}a.push(['','1','']);renderModels();return}
      if(b.dataset.df){const n=+b.dataset.df;MORE[n].splice(+b.dataset.i,1);set(jmk(M.more,n),joinMore(MORE[n]));renderModels();changed();return}
      if(b.dataset.pk!==undefined){const c=M.cells[+b.dataset.pk],key=jmk(c.k,+b.dataset.n);jPicker(c,meas[key],v=>{set(key,v);renderModels();changed()})}});
    pp.addEventListener('click',()=>jPicker(M.pocket.list,meas[M.pocket.list.k],v=>{set(M.pocket.list.k,v);renderModels();changed()}));
  }
  function paint(){
    S.fields.forEach(f=>{const v=meas[f.k]||'';
      if(f.t==='tick'){els[f.k].classList.toggle('on',v==='1');els[f.k].querySelector('b').textContent=v==='1'?'✓':''}
      else{if(els[f.k].value!==v)els[f.k].value=v;els[f.k].classList.toggle('on',!!v.trim())}});
    renderModels();
  }
  function layout(){
    const s=scale;sh.style.width=S.w*s+'px';sh.style.height=S.h*s+'px';bg.style.width=S.w*s+'px';bg.style.height=S.h*s+'px';
    S.fields.forEach(f=>{const st=els[f.k].style;st.left=f.x*s+'px';st.top=f.y*s+'px';st.width=f.w*s+'px';st.height=f.h*s+'px';
      if(f.t==='box')st.fontSize=Math.max(9,Math.min(f.h*.55,24)*s)+'px';
      if(f.t==='multi')st.fontSize=Math.max(9,16*s)+'px';
      if(f.t==='tick'){st.fontSize=Math.max(8,13*s)+'px';const b=els[f.k].querySelector('b');b.style.width=b.style.height=Math.max(12,22*s)+'px'}});
    const a=M.area,r=M.pocket.r;
    mdl.style.left=a[0]*s+'px';mdl.style.top=a[1]*s+'px';mdl.style.width=a[2]+'px';mdl.style.height=a[3]+'px';mdl.style.transform=`scale(${s})`;
    pp.style.left=r[0]*s+'px';pp.style.top=r[1]*s+'px';pp.style.width=r[2]+'px';pp.style.height=r[3]+'px';pp.style.transform=`scale(${s})`;
  }
  const api={meas,
    fit(){const w=host.clientWidth||S.w;scale=Math.max(.2,Math.min(1.6,(w-4)/S.w));layout();return api},
    zoom(f){scale=Math.max(.2,Math.min(2.5,scale*f));layout();return api},
    refresh(){paint();return api},
    load(m){Object.keys(meas).forEach(k=>delete meas[k]);Object.assign(meas,m||{});nModels=1;MORE={};paint();changed();return api}};
  paint();api.fit();
  return api;
}
/* the sheet in a full-screen window (new order → Measurements…, order details → open the sheet) */
function jSheetWindow(title,meas,opt={}){
  let w=document.getElementById('jmo');if(w)w.remove();
  w=document.createElement('div');w.id='jmo';w.className='jmo';
  w.innerHTML=`<div class="jbar"><b>${esc(title)}</b><span class="sp"></span>${opt.ro?'':'<span class="muted" id="jmoN"></span>'}
    <button class="btn sm" data-z="0.8" aria-label="Smaller">－</button><button class="btn sm" data-z="1.25" aria-label="Bigger">＋</button>
    ${opt.ro?'':`${opt.last?'<button class="btn sm" id="jmoLast">Last measurement · آخر مقاس</button>':''}<button class="btn sm" id="jmoClr">Clear · مسح</button>`}
    <button class="btn sm pri" id="jmoOk">${opt.ro?'Close':'Done · تم'}</button></div><div class="jscroll"></div>`;
  document.body.appendChild(w);document.body.style.overflow='hidden';
  const work=JSON.parse(JSON.stringify(meas||{}));
  const cnt=()=>{const n=document.getElementById('jmoN');if(n)n.textContent=jCount(work)+' مقاس'};
  const sheet=jSheet(w.querySelector('.jscroll'),work,{...opt,onChange:cnt});cnt();
  w.querySelectorAll('[data-z]').forEach(b=>b.onclick=()=>sheet.zoom(+b.dataset.z));
  const close=save=>{w.remove();document.body.style.overflow='';if(save&&opt.onDone)opt.onDone(work)};
  document.getElementById('jmoOk').onclick=()=>close(!opt.ro);
  const lb=document.getElementById('jmoLast');if(lb)lb.onclick=()=>{if(jCount(work)&&!confirm('Replace with the last measurement? · استبدال بآخر مقاس؟'))return;sheet.load(JSON.parse(JSON.stringify(opt.last)))};
  const cb=document.getElementById('jmoClr');if(cb)cb.onclick=()=>{if(confirm('Clear all? · مسح الكل؟'))sheet.load({})};
  addEventListener('keydown',function esc_(e){if(e.key==='Escape'&&document.getElementById('jmo')){removeEventListener('keydown',esc_);close(false)}});
  return sheet;
}


/* =====================================================================================
   LIVE MODE  ·  Firebase (Auth + Firestore)
   Everything above renders from plain arrays (BRANCHES, workers, customers, orders, ...).
   Here those arrays are filled from Firestore in real time, and every change the screens
   make to them is written back by flush() (field-level diff, so two people editing the
   same order at once do not overwrite each other).
   ===================================================================================== */
const COL={branches:BRANCHES,staff:workers,customers,orders,payments:payLog,deliveries:delLog,prod:prodLog,notices,ded:dedLog,items:STOCK,emb:EMBL,purch:PURCH,walog:WALOG};
const KEY={items:x=>String(x.code),emb:x=>String(x.code),branches:x=>String(x.id),staff:x=>String(x.id),customers:x=>String(x.id),orders:x=>String(x.rno)};
const TRANSIENT={staff:['att','mdone'],orders:[],customers:[]};
const STAMP=new Set(['orders','customers','payments','deliveries','prod','staff','ded']);
const synced={};Object.keys(COL).forEach(c=>synced[c]=new Map());
let fb=null,app=null,db=null,auth=null,ME_UID=null,writing=0;
const rid=()=>Math.random().toString(36).slice(2,10)+Date.now().toString(36);
const randKey=()=>Array.from(crypto.getRandomValues(new Uint8Array(12)),b=>b.toString(16).padStart(2,'0')).join('');
const pinPass=(sid,pin)=>`ST#${pin}#${sid}#thobe`;
const staffEmail=(sid,gen)=>`s${sid}g${gen}@saudithobe.men`;
const JOB_LOGIN={'Branch manager':'manager',Cashier:'cashier',Measurement:'measure'};
const jobLogin=j=>JOB_LOGIN[j]||'tailor';
const SITE=location.origin.startsWith('http')?location.origin:'https://saudithobe.men';

function revive(x){if(x&&typeof x.toDate==='function')return x.toDate();if(Array.isArray(x))return x.map(revive);if(x&&typeof x==='object'){const o={};for(const k in x)o[k]=revive(x[k]);return o}return x}
function snap(col,x){return structuredClone(plain(col,x))}
function plain(col,x){const o={};for(const k in x){if(k==='_id'||(TRANSIENT[col]||[]).includes(k)||typeof x[k]==='function'||x[k]===undefined)continue;o[k]=x[k]}return o}
const J=v=>JSON.stringify(v===undefined?null:v);
const isObj=v=>v&&typeof v==='object'&&!Array.isArray(v)&&!(v instanceof Date);
const idOf=(col,x)=>KEY[col]?KEY[col](x):(x._id||(x._id=rid()));

/* ---------- write back what the screens changed ---------- */
let flushQ=Promise.resolve();
function flush(){flushQ=flushQ.then(doFlush).catch(e=>{console.error(e);toast('Could not save: '+(e.code||e.message||e))});return flushQ}
async function doFlush(){
  if(!db||!USER||!USER.uid)return;
  const {doc,setDoc,updateDoc,deleteDoc,runTransaction}=fb;
  for(const col of Object.keys(COL)){
    if(col==='items'||col==='emb'||col==='purch')continue;          // the shop exe's lists: never written from here
    const arr=COL[col],seen=new Set();
    for(const x of arr){
      const id=idOf(col,x);seen.add(id);
      const cur=plain(col,x),prev=synced[col].get(id);
      if(prev===undefined){
        if(col==='orders'){await createOrder(x);continue}
        if(col==='customers'){await createCustomer(x);continue}
        if(col==='staff'&&!x.uid)continue;            // staff are created by createStaff()
        writing++;try{await setDoc(doc(db,col,id),STAMP.has(col)?{...cur,upd:new Date()}:cur)}finally{writing--}
        synced[col].set(id,structuredClone(cur));continue}
      const upd={};let n=0;
      for(const k of new Set([...Object.keys(cur),...Object.keys(prev)])){
        if(J(cur[k])===J(prev[k]))continue;
        if(isObj(cur[k])&&isObj(prev[k])){for(const k2 of new Set([...Object.keys(cur[k]),...Object.keys(prev[k])]))if(J(cur[k][k2])!==J(prev[k][k2])){upd[`${k}.${k2}`]=cur[k][k2]===undefined?fb.deleteField():cur[k][k2];n++}}
        else{upd[k]=cur[k]===undefined?fb.deleteField():cur[k];n++}}
      if(n){if(STAMP.has(col))upd.upd=new Date();writing++;try{await updateDoc(doc(db,col,id),upd)}finally{writing--}
        if(col==='staff'&&('status' in upd)&&x.uid)await updateDoc(doc(db,'uids',x.uid),{active:okW(x)});
        synced[col].set(id,structuredClone(cur))}
    }
    if(col==='staff')for(const id of [...synced.staff.keys()])if(!seen.has(id)){const old=synced.staff.get(id);await removeStaff(id,old);synced.staff.delete(id)}
    if(col==='ded'||((col==='payments'||col==='deliveries')&&ROLE==='owner'))for(const id of [...synced[col].keys()])if(!seen.has(id)){await fb.deleteDoc(fb.doc(db,col,id));synced[col].delete(id)}
  }
}
async function createOrder(o){
  const {doc,runTransaction}=fb;let rno=o.rno;const old=o.rno;
  await runTransaction(db,async tx=>{
    for(let i=0;i<50;i++){const s=await tx.get(doc(db,'orders',String(rno)));if(!s.exists())break;rno++}
    // the branch's own order / invoice numbers (OLY-50001, OLY-INV-1001): counters per branch, never twice
    const b=o.branch,others=orders.filter(x=>x!==o&&x.branch===b);
    const rO=doc(db,'counters','ord_'+b),rI=doc(db,'counters','inv_'+b);const cO=await tx.get(rO),cI=await tx.get(rI);
    o.bseq=Math.max(50000,cO.exists()?+cO.data().n||0:0,...others.map(x=>+x.bseq||0))+1;o.bno=`${bcode(b)}-${o.bseq}`;
    const giveInv=!o.gift&&b!==EXE_BRANCH;
    if(giveInv){o.binvSeq=Math.max(1000,cI.exists()?+cI.data().n||0:0,...others.map(x=>+x.binvSeq||0))+1;o.binv=`${bcode(b)}-INV-${o.binvSeq}`}else{delete o.binvSeq;delete o.binv}
    o.rno=rno;tx.set(doc(db,'orders',String(rno)),{...plain('orders',o),upd:new Date()});
    tx.set(rO,{n:o.bseq});if(giveInv)tx.set(rI,{n:o.binvSeq})});
  for(const p of payLog)if(p.rno===old&&!synced.payments.has(p._id||''))p.rno=rno;
  synced.orders.set(String(o.rno),snap('orders',o));
}
async function createCustomer(c){
  const {doc,runTransaction}=fb;const old=c.id;
  await runTransaction(db,async tx=>{const s=await tx.get(doc(db,'customers',String(c.id)));
    if(s.exists()){const r=doc(db,'counters','customers');const cs=await tx.get(r);const base=Math.max(0,...customers.map(x=>+x.id||0));c.id=Math.max(base,cs.exists()?cs.data().n:0)+1;tx.set(r,{n:c.id})}
    tx.set(doc(db,'customers',String(c.id)),{...plain('customers',c),upd:new Date()})});
  if(c.id!==old)for(const o of orders)if(o.cid===old&&!synced.orders.has(String(o.rno)))o.cid=c.id;
  synced.customers.set(String(c.id),snap('customers',c));
}
async function removeStaff(id,old){
  const {doc,deleteDoc,writeBatch}=fb;const b=writeBatch(db);
  b.delete(doc(db,'staff',id));b.delete(doc(db,'pub',id));b.delete(doc(db,'keys',id));if(old&&old.uid)b.delete(doc(db,'uids',old.uid));
  await b.commit();
}

/* ---------- create a person: Firebase login + staff record + personal link ---------- */
async function createStaff(w){
  const {initializeApp,getAuth,createUserWithEmailAndPassword,signOut,doc,writeBatch,runTransaction}=fb;
  const {getApps}=fb;
  if(!w.id||(synced.staff.has(String(w.id))&&w.uid))w.id=await nextId('staff');
  const login=w.login||jobLogin(w.role),key=randKey(),gen=1;
  const a2=getApps().find(a=>a.name==='creator')||initializeApp(FIREBASE_CONFIG,'creator');const au2=getAuth(a2);
  const cred=await createUserWithEmailAndPassword(au2,staffEmail(w.id,gen),key);const uid=cred.user.uid;await signOut(au2);
  Object.assign(w,{uid,gen,login,pinSet:false,status:w.status||'active'});
  const b=writeBatch(db);
  b.set(doc(db,'staff',String(w.id)),{...plain('staff',w),upd:new Date()},{merge:true});
  b.set(doc(db,'uids',uid),{sid:w.id,role:login,branch:w.branch,job:w.role,active:true});
  b.set(doc(db,'pub',String(w.id)),{name:w.name,gen,job:w.role,branch:bname(w.branch)});
  b.set(doc(db,'keys',String(w.id)),{k:key,branch:w.branch});
  await b.commit();synced.staff.set(String(w.id),snap('staff',w));KEYS[w.id]=key;
  return w;
}
async function resetPin(w){
  const {initializeApp,getAuth,createUserWithEmailAndPassword,signOut,doc,writeBatch,getApps}=fb;
  const key=randKey(),gen=(w.gen||1)+1;
  const a2=getApps().find(a=>a.name==='creator')||initializeApp(FIREBASE_CONFIG,'creator');const au2=getAuth(a2);
  const cred=await createUserWithEmailAndPassword(au2,staffEmail(w.id,gen),key);await signOut(au2);
  const b=writeBatch(db),old=w.uid;w.uid=cred.user.uid;w.gen=gen;w.pinSet=false;
  b.update(doc(db,'staff',String(w.id)),{uid:w.uid,gen,pinSet:false,upd:new Date()});
  if(old)b.delete(doc(db,'uids',old));
  b.set(doc(db,'uids',w.uid),{sid:w.id,role:w.login||jobLogin(w.role),branch:w.branch,job:w.role,active:okW(w)});
  b.set(doc(db,'pub',String(w.id)),{name:w.name,gen,job:w.role,branch:bname(w.branch)});
  b.set(doc(db,'keys',String(w.id)),{k:key,branch:w.branch});
  await b.commit();synced.staff.set(String(w.id),snap('staff',w));KEYS[w.id]=key;
}
async function nextId(name){
  const {doc,runTransaction}=fb;let v;
  await runTransaction(db,async tx=>{const r=doc(db,'counters',name);const s=await tx.get(r);
    // people from the shop exe use 100000 + their shop number: the website's own numbers stay below
    const base=Math.max(0,...(name==='staff'?workers.filter(x=>!x.exeEmp&&x.id<100000):name==='customers'?customers.filter(x=>x.id>=500000):BRANCHES).map(x=>+x.id||0));
    v=Math.max(base,s.exists()?s.data().n:0)+1;tx.set(r,{n:v})});
  return v;
}
const KEYS={};
const personalLink=w=>`${SITE}/?u=${w.id}${!w.pinSet&&KEYS[w.id]?`&k=${KEYS[w.id]}`:''}`;

/* ---------- listeners ---------- */
const unsubs=[];let staleView=false;
function busy(){const a=document.activeElement;const h=(location.hash||'').slice(1);return (a&&/INPUT|SELECT|TEXTAREA/.test(a.tagName))||h==='new'}
let rerenderT=null;
function rerender(){clearTimeout(rerenderT);rerenderT=setTimeout(()=>{if(busy()){staleView=true;return}staleView=false;route()},120)}
const PARTS={};
function normalize(col,x){
  if(col==='orders'){x.t={cut:'wait',sew:'wait',hinge:'wait',tat:'wait',btm:'wait',iron:'wait',...(x.t||{})};x.tw=x.tw||{};x.sent=x.sent||{};if(x.hold==null)x.hold=false;x.design={...Object.fromEntries(DESIGN_.map(g=>[g.k,g.opts[0][0]])),...(x.design||{})};
    if(x.profile==null)x.profile=0;if(x.made==null)x.made=x.branch;if(x.tailor==null)x.tailor=0;if(x.fabric==null)x.fabric='';if(x.note==null)x.note='';if(!(x.created instanceof Date))x.created=today;if(!(x.due instanceof Date))x.due=x.created}
  if(col==='customers'){if(!Array.isArray(x.profiles)||!x.profiles.length)x.profiles=[{name:'Self',m:{}}];x.profiles.forEach(p=>{p.m=p.m||{}});x.hist=x.hist||[];if(x.phone==null)x.phone=''}
  if(col==='staff'){if(!(x.joined instanceof Date))x.joined=today;if(x.status==null)x.status='active';if(x.phone==null)x.phone='';if(x.nat==null)x.nat='';['rate','basic','target','comm'].forEach(k=>{if(x[k]==null)x[k]=0});if(!x.pay)x.pay='salary';if(x.iqama===undefined)x.iqama=null}
  if(col==='payments'||col==='deliveries'||col==='prod'||col==='ded'||col==='purch'||col==='walog'){if(!(x.d instanceof Date))x.d=today}
  return x}
function mergeParts(col){
  const arr=COL[col],m=new Map();
  (PARTS[col]||[]).forEach(p=>p.forEach((v,k)=>m.set(k,v)));
  const items=[...m.entries()].map(([id,v])=>{if(!KEY[col])v._id=id;return normalize(col,v)});
  if(col==='orders')items.sort((a,b)=>b.created-a.created);
  arr.length=0;arr.push(...items);
  synced[col]=new Map(items.map(x=>[idOf(col,x),snap(col,x)]));
  if(col==='staff'){applyAtt();USERS.length=0;USERS.push(...workers.map(w=>({role:w.login||jobLogin(w.role),name:w.name,branch:w.branch,sid:w.id})))}
}
function sub(col,q){
  const {onSnapshot}=fb;const part=new Map();(PARTS[col]=PARTS[col]||[]).push(part);
  unsubs.push(onSnapshot(q,snap=>{
    snap.docChanges().forEach(ch=>{if(ch.type==='removed')part.delete(ch.doc.id);else part.set(ch.doc.id,revive(ch.doc.data()))});
    mergeParts(col);
    if(col==='notices')showPopups();
    rerender();
  },e=>{console.error(col,e);if(e.code==='permission-denied'&&col==='keys')return;toast(`Cannot read ${col}: ${e.code||e.message}`)}));
}
const ATT=new Map();
function applyAtt(){workers.forEach(w=>{w.att=Array.from({length:14},(_,k)=>{const d=addD(today,k-13);if(d.getDay()===5)return 'o';return ATT.get(`${dkey(d)}_${w.id}`)==='a'?'a':'p'})})}
const dkey=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
async function setAtt(w,v){const {doc,setDoc}=fb;await setDoc(doc(db,'att',`${dkey(today)}_${w.id}`),{sid:w.id,d:dkey(today),v,branch:w.branch});}

function startListeners(){
  const {collection,query,where,onSnapshot}=fb;
  const since=n=>addD(today,-n);
  sub('branches',collection(db,'branches'));
  sub('staff',collection(db,'staff'));
  sub('customers',collection(db,'customers'));
  // the shop's fabric stock and embroidery list (sent by the AL THOB exe; read-only here)
  sub('items',collection(db,'items'));
  sub('emb',collection(db,'emb'));
  if(ROLE==='owner'||ROLE==='manager'){sub('purch',collection(db,'purch'));sub('walog',query(collection(db,'walog'),where('d','>=',since(120))))}
  sub('orders',query(collection(db,'orders'),where('created','>=',since(150))));
  sub('orders',query(collection(db,'orders'),where('st','in',['cut','sew','ready'])));
  sub('payments',query(collection(db,'payments'),where('d','>=',since(45))));
  sub('deliveries',query(collection(db,'deliveries'),where('d','>=',since(45))));
  // a worker (not the factory supervisor) gets only his own work – all of it, so he can look back month by month
  const worker=ROLE==='tailor'&&USER.job!=='Factory supervisor';
  if(worker)sub('prod',query(collection(db,'prod'),where('w','==',USER.sid)));
  else sub('prod',query(collection(db,'prod'),where('d','>=',since(45))));
  // salary deductions: the owner all, a manager / supervisor his branch, a worker only his own
  if(ROLE==='owner')sub('ded',collection(db,'ded'));
  else if(worker)sub('ded',query(collection(db,'ded'),where('sid','==',USER.sid)));
  else if(ROLE==='manager'||isFactoryLogin())sub('ded',query(collection(db,'ded'),where('branch','==',USER.branch)));
  sub('notices',query(collection(db,'notices'),where('at','>=',since(14))));
  unsubs.push(onSnapshot(collection(db,'counters'),s=>{s.forEach(x=>{CNT[x.id]=+x.data().n||0})},()=>{}));
  // the shop exe: which branch it runs in (that branch keeps the exe's invoice numbers) and the shop's details for the invoices
  unsubs.push(onSnapshot(fb.doc(db,'meta','exe'),x=>{const d=x.exists()?x.data():null;if(!d)return;EXE_BRANCH=+d.branch||0;if(d.shop&&typeof d.shop==='object')SHOP={...SHOP,...d.shop}},()=>{}));
  // workshop flow (Settings → Workshop flow): one for all branches
  unsubs.push(onSnapshot(fb.doc(db,'meta','flow'),x=>{const d=x.exists()?x.data():null;if(d&&d.v===2&&Array.isArray(d.steps)){const before=JSON.stringify([FLOW,FLOW_OPT]);setFlow(d.steps,{tready:d.tready!==false});if(JSON.stringify([FLOW,FLOW_OPT])!==before)rerender()}},()=>{}));
  flowSaver=(steps,tready)=>fb.setDoc(fb.doc(db,'meta','flow'),{v:2,steps,tready:!!tready,at:new Date(),by:USER.name||'Owner'});
  unsubs.push(onSnapshot(query(collection(db,'att'),where('d','>=',dkey(since(14)))),s=>{ATT.clear();s.forEach(x=>{const d=x.data();ATT.set(x.id,d.v)});applyAtt();rerender()},()=>{}));
  if(ROLE==='owner'||ROLE==='manager'||isFactoryLogin())unsubs.push(onSnapshot(ROLE==='owner'?collection(db,'keys'):query(collection(db,'keys'),where('branch','==',USER.branch)),s=>{s.forEach(x=>KEYS[x.id]=x.data().k)},()=>{}));
}

/* the Payments page asks for older days than the 45 loaded at start */
let payFrom=null;
function ensurePayRange(from){
  if(!db||!fb)return;const f=new Date(from);f.setHours(0,0,0,0);
  if(payFrom&&f>=payFrom)return;if(!payFrom&&f>=addD(today,-45)){payFrom=addD(today,-45);return}
  payFrom=f;const {collection,query,where}=fb;
  sub('payments',query(collection(db,'payments'),where('d','>=',f)));
  sub('deliveries',query(collection(db,'deliveries'),where('d','>=',f)));
  if(!(ROLE==='tailor'&&USER.job!=='Factory supervisor'))sub('prod',query(collection(db,'prod'),where('d','>=',f)));
}

/* ---------- sign in ---------- */
const params=new URLSearchParams(location.search);
const U=params.get('u'),K=params.get('k');
function loginShell(inner){
  let L=document.getElementById('login');if(!L){L=document.createElement('div');L.className='login';L.id='login';document.body.appendChild(L)}
  L.innerHTML=`<div class="login-in" style="max-width:460px">
   <div class="login-top"><img src="/img/logo.png" alt="" class="llogo"><div><h1 style="font-size:26px">Al Thob Al Saudi</h1><p class="lead">saudithobe.men</p></div></div>
   <div class="panel"><div class="panel-b" style="display:flex;flex-direction:column;gap:14px">${inner}</div></div></div>`;
  return L;
}
const errMsg=e=>({'auth/invalid-credential':'Wrong PIN or password.','auth/wrong-password':'Wrong PIN or password.','auth/too-many-requests':'Too many tries. Wait a few minutes and try again.','auth/network-request-failed':'No internet connection.','auth/email-already-in-use':'This email already has an account.','auth/weak-password':'Password must be at least 6 characters.'}[e.code]||e.message||String(e));

async function liveBoot(){
  fb=await loadFirebase();
  const {initializeApp,getAuth,getFirestore,onAuthStateChanged,doc,getDoc}=fb;
  // one Firebase app per person: two workers' apps on the same phone keep separate logins
  app=initializeApp(FIREBASE_CONFIG,U?`u${U}`:'[DEFAULT]');auth=getAuth(app);db=getFirestore(app);
  let pub=null;
  if(U){try{const s=await getDoc(doc(db,'pub',U));pub=s.exists()?s.data():null}catch(e){}
    setManifest(pub?`ST · ${pub.name.split(' ')[0]}`:'Saudi Thobe',`/?u=${U}`,pub)}
  else setManifest('Saudi Thobe','/',null);
  onAuthStateChanged(auth,async user=>{
    if(!user){showSignIn(pub);return}
    try{
      const s=await getDoc(doc(db,'uids',user.uid));
      if(!s.exists()){await fb.signOut(auth);showSignIn(pub,'This login is no longer active. Ask the owner for a new link.');return}
      const m=s.data();
      if(m.active===false){await fb.signOut(auth);showSignIn(pub,'This login is blocked by the owner.');return}
      if(U&&String(m.sid)!==String(U)&&m.role!=='owner'){await fb.signOut(auth);showSignIn(pub);return}
      ROLE=m.role;USER={role:m.role,name:m.role==='owner'?(m.name||'Owner'):(pub?pub.name:'Staff'),branch:m.branch||0,sid:m.sid,job:m.job,uid:user.uid};
      if(m.role!=='owner'){const st=await getDoc(doc(db,'staff',String(m.sid)));if(st.exists())USER.name=st.data().name}
    }catch(e){console.error(e);showSignIn(pub,errMsg(e));return}
    const L=document.getElementById('login');if(L)L.remove();
    if(USER.job==='Factory supervisor'){ACCESS.tailor={...ACCESS.tailor,home:'board',pages:['board','workers','daily'],tabs:['board','workers','daily']}}
    startListeners();
    enterLive();
  });
}
function showSignIn(pub,err){
  const {doc,getDoc}=fb;
  if(U&&!pub){loginShell(`<b>Link not found</b><p class="muted" style="margin:0">This personal link is not valid any more. Ask the owner or your manager for a new one.</p>`);return}
  if(U){
    const first=!!K;
    const L=loginShell(`<div><span class="muted" style="font-size:12.5px">${esc(pub.job)} · ${esc(pub.branch)}</span><h2 style="margin:2px 0 0;font-family:var(--f-display);font-weight:600;font-size:24px">Assalamu alaikum, ${esc(pub.name.split(' ')[0])}</h2></div>
     ${err?`<div class="msg" style="border-color:var(--bad)">${esc(err)}</div>`:''}
     <div class="field"><label for="pin1">${first?'Choose a 4-digit PIN':'Your PIN'}</label><input id="pin1" class="num" type="password" inputmode="numeric" maxlength="6" autocomplete="${first?'new-password':'current-password'}" style="font-size:22px;letter-spacing:.3em;text-align:center"></div>
     ${first?`<div class="field"><label for="pin2">Type the PIN again</label><input id="pin2" class="num" type="password" inputmode="numeric" maxlength="6" style="font-size:22px;letter-spacing:.3em;text-align:center"></div>`:''}
     <button class="btn pri" id="pinGo" style="justify-content:center;height:44px">${first?'Set PIN and open':'Open'}</button>
     ${first?'':'<p class="muted" style="font-size:12px;margin:0">Forgot your PIN? Ask the owner to reset it. You will get a new link.</p>'}`);
    const go=async()=>{const p1=document.getElementById('pin1').value.trim();
      if(!/^\d{4,6}$/.test(p1)){toast('PIN must be 4 to 6 digits');return}
      const btn=document.getElementById('pinGo');btn.disabled=true;btn.textContent='Opening…';
      try{
        if(first){const p2=document.getElementById('pin2').value.trim();if(p1!==p2){toast('The two PINs are not the same');btn.disabled=false;btn.textContent='Set PIN and open';return}
          try{const c=await fb.signInWithEmailAndPassword(auth,staffEmail(U,pub.gen),K);await fb.updatePassword(c.user,pinPass(U,p1));
            await fb.updateDoc(fb.doc(db,'staff',String(U)),{pinSet:true}).catch(()=>{});
            history.replaceState(null,'',`/?u=${U}`);}
          catch(e){if(e.code==='auth/invalid-credential'||e.code==='auth/wrong-password'){await fb.signInWithEmailAndPassword(auth,staffEmail(U,pub.gen),pinPass(U,p1));history.replaceState(null,'',`/?u=${U}`)}else throw e}}
        else await fb.signInWithEmailAndPassword(auth,staffEmail(U,pub.gen),pinPass(U,p1));
      }catch(e){btn.disabled=false;btn.textContent=first?'Set PIN and open':'Open';toast(errMsg(e))}};
    document.getElementById('pinGo').onclick=go;L.querySelectorAll('input').forEach(i=>i.onkeydown=e=>{if(e.key==='Enter')go()});
    setTimeout(()=>{const i=document.getElementById('pin1');if(i)i.focus()},50);return}
  // owner (no personal link)
  getDoc(doc(db,'meta','owner')).then(s=>{
    if(!s.exists()){
      const L=loginShell(`<h2 style="margin:0;font-family:var(--f-display);font-weight:600">Set up the owner account</h2><p class="muted" style="margin:0">First time only. This account controls every branch, factory and worker.</p>
       <div class="field"><label for="oName">Your name</label><input id="oName" autocomplete="name"></div>
       <div class="field"><label for="oMail">Email</label><input id="oMail" type="email" autocomplete="username"></div>
       <div class="field"><label for="oPass">Password (8+ characters)</label><input id="oPass" type="password" autocomplete="new-password"></div>
       <button class="btn pri" id="oGo" style="justify-content:center;height:44px">Create owner account</button>`);
      document.getElementById('oGo').onclick=async()=>{const n=document.getElementById('oName').value.trim(),m=document.getElementById('oMail').value.trim(),p=document.getElementById('oPass').value;
        if(!n||!m||p.length<8){toast('Fill in name, email and an 8+ character password');return}
        try{const c=await fb.createUserWithEmailAndPassword(auth,m,p);const b=fb.writeBatch(db);
          b.set(fb.doc(db,'meta','owner'),{uid:c.user.uid,name:n,at:new Date()});b.set(fb.doc(db,'uids',c.user.uid),{role:'owner',name:n,active:true,branch:0,sid:0});await b.commit();
          location.reload()}catch(e){toast(errMsg(e))}};
      return}
    const L=loginShell(`<h2 style="margin:0;font-family:var(--f-display);font-weight:600">Owner sign in</h2>
     ${err?`<div class="msg" style="border-color:var(--bad)">${esc(err)}</div>`:''}
     <div class="field"><label for="oMail">Email</label><input id="oMail" type="email" autocomplete="username"></div>
     <div class="field"><label for="oPass">Password</label><input id="oPass" type="password" autocomplete="current-password"></div>
     <button class="btn pri" id="oGo" style="justify-content:center;height:44px">Sign in</button>
     <p class="muted" style="font-size:12.5px;margin:0">Staff and workers: open your own personal link to sign in with your PIN.</p>`);
    const go=async()=>{try{await fb.signInWithEmailAndPassword(auth,document.getElementById('oMail').value.trim(),document.getElementById('oPass').value)}catch(e){toast(errMsg(e))}};
    document.getElementById('oGo').onclick=go;L.querySelectorAll('input').forEach(i=>i.onkeydown=e=>{if(e.key==='Enter')go()});
  }).catch(e=>loginShell(`<b>Cannot reach the database</b><p class="muted">${esc(errMsg(e))}</p>`));
}

/* ---------- personal app (manifest per person, so each installs as its own app) ---------- */
function setManifest(name,start,pub){
  const m={id:start,name,short_name:name.slice(0,12),start_url:SITE+start,scope:SITE+'/',display:'standalone',background_color:'#16213a',theme_color:'#16213a',
    description:pub?`${pub.job} · ${pub.branch}`:'Saudi Thobe tailoring',
    icons:[{src:SITE+'/img/icon-192.png',sizes:'192x192',type:'image/png',purpose:'any maskable'},{src:SITE+'/img/icon-512.png',sizes:'512x512',type:'image/png',purpose:'any maskable'}]};
  let l=document.querySelector('link[rel=manifest]');if(!l){l=document.createElement('link');l.rel='manifest';document.head.appendChild(l)}
  l.href='data:application/manifest+json,'+encodeURIComponent(JSON.stringify(m));
  document.title=name;
}
let deferredInstall=null;
addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredInstall=e});
if('serviceWorker' in navigator&&location.protocol==='https:')navigator.serviceWorker.register('/sw.js').catch(()=>{});

function enterLive(){
  const a=RA();curBranch=a.branch;
  document.getElementById('meAv').textContent=(USER.name||'?')[0];document.getElementById('meName').textContent=USER.name;document.getElementById('meRole').textContent=a.label;
  document.getElementById('newBtn').hidden=!can('new');document.querySelector('.search').hidden=ROLE==='tailor';
  const sel=document.getElementById('branchSel');sel.disabled=a.lock;
  const sw=document.getElementById('switchRole');sw.textContent='Sign out';sw.onclick=async()=>{await fb.signOut(auth);location.reload()};
  document.getElementById('installBtn').onclick=async()=>{if(deferredInstall){deferredInstall.prompt();deferredInstall=null}else installScreen(null,ROLE,ROLE==='owner'?null:workers.find(w=>w.id===USER.sid))};
  if(!location.hash||!can(location.hash.slice(1)))location.hash=a.home;
  route();showPopups();
  document.addEventListener('click',()=>setTimeout(flush,0));
  document.addEventListener('change',()=>setTimeout(flush,0));
  document.addEventListener('focusout',()=>{if(staleView)setTimeout(()=>{if(!busy())route()},200)});
}

/* ---------- owner: is the shop exe syncing? (it writes meta/exe after every round) ---------- */
const _settingsView=settings;
settings=function(){_settingsView();if(!LIVE||!db)return;const box=document.getElementById('exeBox');if(!box)return;
  fb.getDoc(fb.doc(db,'meta','exe')).then(s=>{
    if(!s.exists()){box.innerHTML=`<p class="muted" style="margin:0">Not connected yet. In the AL THOB exe open <b>Saudi Thobe online</b>, sign in with the owner email and choose this branch.</p>`;return}
    const m=revive(s.data()),mins=Math.round((Date.now()-m.at)/60000);
    box.innerHTML=`<div class="rows"><div class="row" style="padding:0 0 8px;border:0"><div class="grow"><b>${m.ok?'Syncing':'Problem'} · ${esc(bname(m.branch))}</b><span>Last round ${mins<1?'just now':mins+' min ago'}${m.msg?' · '+esc(m.msg):''}</span></div>${mins<10&&m.ok?'<span class="pill s-ready">Online</span>':'<span class="pill s-late">Check the shop PC</span>'}</div></div>
     <div class="kv">${Object.entries(m.counts||{}).map(([k,v])=>`<div><span>${esc(k)}</span><b>${v}</b></div>`).join('')}</div>
     <p class="muted" style="font-size:12px;margin:8px 0 0">The exe keeps its own data in F:\\AL THOB and a daily copy of the website in F:\\AL THOB\\backups.</p>`;
  }).catch(e=>{box.textContent='Cannot read: '+(e.code||e.message)})};

async function loadFirebase(){
  if(window.__FB_MOCK)return window.__FB_MOCK;
  const V='10.14.1',B=`https://www.gstatic.com/firebasejs/${V}/`;
  const [a,au,fs]=await Promise.all([import(B+'firebase-app.js'),import(B+'firebase-auth.js'),import(B+'firebase-firestore.js')]);
  return {...a,...au,...fs};
}
