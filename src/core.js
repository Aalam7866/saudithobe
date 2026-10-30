<script>
(function(){
/* ================= Icons ================= */
const I={
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
   (hinge, tatreez, bottom cutting for zip); off = not used (ironing). When every step the order needs is done the tailor
   ticks Ready (FLOW_OPT.tready) – or, with that off, it is ready by itself. */
const TASK_DEF={cut:{t:'Cutting',role:'Cutter'},sew:{t:'Tailor',role:'Tailor'},hinge:{t:'Hinge',role:'Hinge'},tat:{t:'Tatreez',role:'Tatreez'},btm:{t:'Bottom cutting',role:'Bottom cutting'},iron:{t:'Ironing',role:'Ironing'}};
const FLOW_DEFAULT=[{k:'cut',m:'after',on:true},{k:'sew',m:'after',on:true},{k:'hinge',m:'send',on:true},{k:'tat',m:'send',on:true},{k:'btm',m:'send',on:true},{k:'iron',m:'after',on:false}];
const FLOW_OPT={tready:true};
let FLOW=JSON.parse(JSON.stringify(FLOW_DEFAULT));
const needs=(o,k)=>k==='hinge'?!!o.hinge:k==='tat'?!!o.tatreez:k==='btm'?(+o.zipQty||0)>0:true;
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
const toSend=o=>TASKS.filter(t=>t.m==='send'&&needs(o,t.k)&&tv(o,t.k)==='wait'&&!isSent(o,t.k));
function syncSt(o){if(o.st==='done'||o.st==='ready')return;const mains=TASKS.filter(t=>t.m==='after'&&needs(o,t.k));
  // hold = the website's tailor will tick Ready (the shop exe then never marks it ready by itself)
  const tr=FLOW_OPT.tready&&!!TK.sew;o.hold=tr&&tv(o,'sew')==='done';
  if(mains.length&&allStepsDone(o)&&!tr){o.st='ready';o.hold=false;return}
  o.st=(mains[0]&&tv(o,mains[0].k)==='done')||tv(o,'sew')==='done'?'sew':'cut'}
/* the tailor: send this order to hinge / tatreez / bottom cutting */
function sendTask(o,k){o.sent={...(o.sent||{}),[k]:true};if(!o.tw[k]){const w=firstOf(TK[k].role,o.made);o.tw[k]=w?w.id:null}toast(`#${o.rno}: sent for ${TK[k].t.toLowerCase()}`)}
/* the tailor: everything is done, the order is ready for pickup → popup for the owner and that branch */
function markReady(o){if(!allStepsDone(o)){toast('Not finished yet: '+TASKS.filter(t=>needs(o,t.k)&&tv(o,t.k)!=='done').map(t=>t.t).join(', '));return}
  o.st='ready';o.hold=false;toast(`#${o.rno} ready for pickup · owner and ${bname(o.branch)} notified`);notifyReady(o)}
const pending=(o,k)=>o.st!=='done'&&!!TK[k]&&TK[k].avail(o)&&tv(o,k)!=='done'&&needs(o,k);
const SI=Object.fromEntries(STAGES.map((s,i)=>[s.k,i]));
const FABRICS=['Toyobo (Japan)','Shakespeare (UK)','Loriana','Korean summer','Daniel Hechter','Egyptian cotton'];
/* the shop's fabric stock and embroidery list (live: sent by the AL THOB exe) – the order page works like the exe's order window */
const STOCK=FABRICS.map((f,i)=>({code:1111+i,name:f,company:'',colour:'',rate:[380,320,260,220,300,240][i],stock:[40,12,25,8,0,30][i]}));
const EMBL=[{code:1,model:'Name on pocket',price:30},{code:2,model:'Collar line',price:45},{code:3,model:'Cuff design',price:35}];
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

const BRANCHES=[
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
const workers=WNAMES.map(([n,r,b],i)=>({id:i+1,name:n,role:r,branch:b,phone:'05'+String(Math.floor(10000000+rnd()*89999999)),
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
const customers=NAMES.map((n,i)=>{const profiles=[{name:'Self',m:mk(140)}];if(rnd()>.6)profiles.push({name:'Son · '+pick(SONS),m:mk(112)});if(rnd()>.8)profiles.push({name:'Winter thobe',m:{...profiles[0].m,p_chest1:String(+profiles[0].m.p_chest1+1)}});
  const hist=[{d:addD(today,-Math.floor(30+rnd()*300)),t:'First measurement taken',by:pick(['Abu Ahmed','Javed Akhtar','Arshad Mehmood'])}];
  if(rnd()>.4)hist.unshift({d:addD(today,-Math.floor(rnd()*28)),t:`صدر ١ ${+profiles[0].m.p_chest1-1} → ${profiles[0].m.p_chest1}`,by:pick(['Abu Ahmed','Mohammed Iqbal','Sohail Ahmed'])});
  return{id:i+1,name:n,phone:'05'+String(Math.floor(10000000+rnd()*89999999)),branch:i%5===4?2:i%7===6?3:1,profiles,hist}});
const orders=[];let rno=1240;
for(let i=0;i<64;i++){
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
function notifyReady(o,silent){const n={id:notices.length+1,rno:o.rno,branch:o.branch,made:o.made,tailor:o.tailor,qty:o.qty,at:new Date(),seen:{},open:TASKS.filter(t=>t.k!=='sew'&&t.k!=='cut'&&needs(o,t.k)&&tv(o,t.k)!=='done').map(t=>t.t)};notices.push(n);if(!silent)showPopups()}
orders.filter(o=>o.st==='ready').slice(0,2).forEach(o=>notifyReady(o,true));
const payLog=[];orders.forEach(o=>{if(+o.created>=+addD(today,-13)&&o.paid)payLog.push({d:new Date(o.created),rno:o.rno,branch:o.branch,amt:o.paid,m:rnd()>.5?'Card (mada)':'Cash',t:'Deposit'})});
[[1,380,'Cash'],[1,520,'Card (mada)'],[2,260,'Cash'],[1,190,'Transfer'],[3,440,'Card (mada)']].forEach(([b,a,m],i)=>payLog.push({d:today,rno:1240+i*7,branch:b,amt:a,m,t:'Balance'}));
const cust=id=>customers.find(c=>c.id===id);
const wk=id=>workers.find(w=>w.id===id);

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
for(let k=1;k<14;k++){const d=addD(today,-k);if(d.getDay()===5)continue;
  [1,2,3].forEach(b=>{const n=b===1?3+Math.floor(r2()*4):1+Math.floor(r2()*4);for(let j=0;j<n;j++){const amt=p2([120,190,260,330,380,520,640]),m=p2(['Cash','Cash','Card (mada)','Card (mada)','Transfer']),rno=1100+Math.floor(r2()*140);
    payLog.push({d,rno,branch:b,amt,m,t:'Balance'});delLog.push({d,rno,branch:b,qty:1+Math.floor(r2()*4),amt})}});}
for(let k=0;k<14;k++){const d=addD(today,-k);if(d.getDay()===5)continue;
  workers.forEach(w=>{if(w.att[13-k]==='a')return;const f=isFac(w.branch);
    if(w.role==='Tailor'){const q=k===0?1+Math.floor(r2()*3):(f?2:1)+Math.floor(r2()*(f?4:3));if(q)prodLog.push({d,w:w.id,made:w.branch,stage:'sew',qty:q})}
    if(w.role==='Cutter')prodLog.push({d,w:w.id,made:w.branch,stage:'cut',qty:(k===0?2:f?8:5)+Math.floor(r2()*6)});
    if(w.role==='Ironing')prodLog.push({d,w:w.id,made:w.branch,stage:'iron',qty:(k===0?2:f?7:4)+Math.floor(r2()*5)});
    if(w.role==='Hinge')prodLog.push({d,w:w.id,made:w.branch,stage:'hinge',qty:(k===0?2:f?6:3)+Math.floor(r2()*5)});
    if(w.role==='Tatreez')prodLog.push({d,w:w.id,made:w.branch,stage:'tat',qty:(k===0?1:f?4:2)+Math.floor(r2()*4)});});}
function stepTask(o,k,by){const cur=o.t[k];if(cur==='done')return;
  if(k!=='sew'&&!o.tw[k]){const w=by&&by.role===TK[k].role?by:firstOf(TK[k].role,o.made);o.tw[k]=w?w.id:null}
  if(tv(o,k)==='wait'){o.t[k]='doing';toast(`#${o.rno}: ${TK[k].t} started`)}
  else{o.t[k]='done';const wid=k==='sew'?o.tailor:o.tw[k];if(wid)prodLog.push({d:today,w:wid,made:o.made,stage:k,qty:o.qty,rno:o.rno});
    if(k==='sew'){const t=wk(o.tailor);t.mdone=(t.mdone||0)+o.qty}
    toast(`#${o.rno}: ${TK[k].t} finished${k==='cut'?' · sent to the tailor':k==='sew'?(toSend(o).length?' · now send it for '+toSend(o).map(t=>t.t.toLowerCase()).join(', '):FLOW_OPT.tready?' · tick Ready when it is ready':''):TK[k].m==='send'?' · back to the tailor':''}`)}
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
 {h:'settings',t:'Settings',i:'cog'},
 {h:'till',t:'Cashier desk',s:'Desk',i:'till',g:'Cashier'},
 {h:'mywork',t:'My work',s:'My work',i:'needle',g:'Workshop'},
 {h:'mypay',t:'My work & pay',s:'My pay',i:'cash'},
 {h:'board',t:'Production board',s:'Board',i:'board'}];
/* ================= Logins (5 roles) ================= */
const ACCESS={
 owner:{no:1,label:'Owner · Admin',name:'Owner',icon:'crown',branch:0,lock:false,home:'dashboard',money:true,pay:true,stage:true,
   pages:['dashboard','daily','orders','new','measurements','customers','payments','workers','branches','reports','settings','till','board'],tabs:['dashboard','daily','orders','workers','branches'],
   can:['Every branch and factory','Daily report: sales, payments, tailoring','Add branches, factories and workers','Only owner can block, deactivate or delete workers']},
 manager:{no:2,label:'Branch manager',name:'Faisal Al-Harthi',icon:'branch',branch:1,lock:true,home:'dashboard',money:true,pay:true,stage:true,
   pages:['dashboard','daily','orders','new','measurements','customers','payments','workers','reports','board'],tabs:['dashboard','daily','orders','new','workers'],
   can:['Only his own branch','His branch daily report','Orders, customers and payments','His branch workers and attendance','Branch reports']},
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
let ROLE='owner',USER=USERS[0];const RA=()=>({...ACCESS[ROLE],name:USER.name,branch:USER.branch});
const can=h=>RA().pages.includes(h);
const isOwner=()=>ROLE==='owner';
const isFactoryLogin=()=>ROLE==='tailor'&&isFac(USER.branch);
const addRoles=()=>isOwner()?ROLES:isFactoryLogin()?WORKSHOP_ROLES:ROLE==='manager'?['Cashier']:[];
const canDed=w=>isOwner()||(ROLE==='manager'&&w.branch===USER.branch)||(isFactoryLogin()&&w.branch===USER.branch);
const canEditW=w=>isOwner()||(isFactoryLogin()&&w.branch===USER.branch&&WORKSHOP_ROLES.includes(w.role))||(ROLE==='manager'&&w.branch===USER.branch&&w.role==='Cashier');
const wStatusPill=w=>({leave:'<span class="pill s-cut">On leave</span>',inactive:'<span class="pill s-done">Inactive</span>',blocked:'<span class="pill s-late">Blocked</span>'}[w.status]||'');
/* ready popups for owner and the branch manager */
const myNotices=()=>ROLE==='owner'?notices:ROLE==='manager'?notices.filter(n=>n.branch===USER.branch):[];
function updateBell(){const n=myNotices().filter(x=>!x.seen[USER.name]).length;const b=document.getElementById('bellN');b.textContent=n;b.hidden=!n;document.getElementById('bellBtn').hidden=!(ROLE==='owner'||ROLE==='manager')}
function showPopups(){updateBell();let box=document.getElementById('pops');if(!box){box=document.createElement('div');box.id='pops';box.className='pops';document.body.appendChild(box)}
  const all=myNotices().filter(x=>!x.seen[USER.name]);const list=all.slice(-2).reverse();const more=all.length-list.length;
  box.innerHTML=list.map(n=>{const c=cust(orders.find(o=>o.rno===n.rno).cid);return `<div class="pop" role="alert"><div class="pop-ic">✓</div><div style="flex:1;min-width:0"><b>Order #${n.rno} is ready</b><span>${c.name} · ${pl(n.qty,'thobe')} · ${bname(n.branch)} branch</span><span>${wk(n.tailor).name} · ${bname(n.made)}${n.open.length?` · ${n.open.join(' & ')} pending`:''}</span>
   <div style="display:flex;gap:6px;margin-top:6px"><button class="btn sm pri" data-pop-open="${n.id}">Open order</button><button class="btn sm" data-pop-ok="${n.id}">OK</button></div></div></div>`}).join('')+(more?`<button class="btn sm pop" style="justify-content:center;padding:8px" id="popMore">+${more} more ready orders</button>`:'');
  const pm=document.getElementById('popMore');if(pm)pm.onclick=bellList;
  box.querySelectorAll('[data-pop-ok]').forEach(b=>b.onclick=()=>{notices.find(x=>x.id===+b.dataset.popOk).seen[USER.name]=1;showPopups()});
  box.querySelectorAll('[data-pop-open]').forEach(b=>b.onclick=()=>{const n=notices.find(x=>x.id===+b.dataset.popOpen);n.seen[USER.name]=1;showPopups();openOrder(n.rno)});
}
function bellList(){const list=myNotices().slice().reverse();
  drawer('Ready notifications',`<div class="muted" style="font-size:13px">${ROLE==='owner'?'All branches':bname(USER.branch)+' branch'}</div>`,
   `<div class="rows" style="border:1px solid var(--line);border-radius:8px">${list.map(n=>`<div class="row" data-r="${n.rno}" style="cursor:pointer"><span class="rid">#${n.rno}</span><div class="grow"><b>${cust(orders.find(o=>o.rno===n.rno).cid).name}</b><span>${pl(n.qty,'thobe')} · ${bname(n.branch)} · tailor ${wk(n.tailor).name}</span></div>${n.seen[USER.name]?'<span class="pill s-done">Seen</span>':'<span class="pill s-ready">New</span>'}</div>`).join('')||'<div class="empty">No ready orders yet.</div>'}</div>`,
   `<button class="btn" id="markAll">Mark all as seen</button>`);
  list.forEach(n=>{});document.getElementById('markAll').onclick=()=>{list.forEach(n=>n.seen[USER.name]=1);showPopups();bellList()};
  document.querySelectorAll('.drawer [data-r]').forEach(r=>r.onclick=()=>openOrder(+r.dataset.r))}
function showLogin(){
  const L=document.createElement('div');L.className='login';L.id='login';
  L.innerHTML=`<div class="login-in">
   <div class="login-top"><div class="mark">ST</div><div><h1>Saudi Thobe · Sign in</h1><p class="lead">Each person gets their own login and sees only what their job needs. Demo: pick a role to see its screens.</p></div></div>
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
  ({dashboard,daily,orders:ordersView,new:newOrder,measurements,customers:customersView,payments,workers:workersView,branches,reports,settings,till,mywork,mypay,board})[r.h]();
  if(ROLE!=='owner'){const a=RA();document.getElementById('view').insertAdjacentHTML('afterbegin',`<div class="rolebar">${ico(a.icon)}<span>Signed in as <b>${a.name}</b> · ${a.label}${a.branch?' · '+bname(a.branch):''}. ${a.lock?'Locked to this '+(isFac(a.branch)?'factory':'branch')+'.':''} ${a.money?'':'Prices and cash are hidden for this login.'}</span></div>`);document.querySelectorAll('.rolebar svg').forEach(x=>{x.style.width='18px';x.style.color='var(--brass)'})}
  window.scrollTo(0,0);
}
const V=html=>document.getElementById('view').innerHTML=html;
const demoNote='<div class="demo"><span class="tag">Demo data</span> Everything here is sample data for review. It will be replaced by the shop\'s real database once connected.</div>';

/* ================= Dashboard ================= */
function revSeries(list,days){const r=[];for(let i=days-1;i>=0;i--){const d=addD(today,-i);r.push({d,v:list.filter(o=>+o.created===+d).reduce((s,o)=>s+o.paid,0)})}return r}
function dashboard(){
  if(dashExe)return shopDash();
  const all=O(),active=all.filter(o=>o.st!=='done'),ready=all.filter(o=>o.st==='ready');
  const due=all.reduce((s,o)=>s+(o.total-o.paid),0);
  const rev=revSeries(all,14);
  const wkv=rev.slice(7).reduce((s,x)=>s+x.v,0),pw=rev.slice(0,7).reduce((s,x)=>s+x.v,0);
  const PIPE=[...TASKS.map(t=>({k:t.k,t:t.t,n:all.filter(o=>pending(o,t.k)).reduce((s,o)=>s+o.qty,0)})),{k:'ready',t:'Ready for pickup',n:all.filter(o=>o.st==='ready').reduce((s,o)=>s+o.qty,0)}];const mx=Math.max(...PIPE.map(p=>p.n));
  const soon=active.filter(o=>o.st!=='ready').sort((a,b)=>a.due-b.due).slice(0,7);
  V(`${demoNote}
  ${RA().money?`<div class="rowtools"><span class="sp"></span><button class="btn pri" id="dashExeBtn">${ico('chart')}Shop dashboard (AL THOB)</button></div>`:''}
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
        <span class="rid">#${o.rno}</span><div class="grow"><b>${cust(o.cid).name}</b><span>${pl(o.qty,'thobe')} · ${wk(o.tailor).name} ${curBranch?'':'· '+bname(o.branch)}</span></div>${pill(o)}
        <span class="days ${d<0?'late':d===0?'today':''}">${d<0?`${-d}d late`:d===0?'Today':`in ${d}d`}</span></div>`}).join('')||'<div class="empty">Nothing due.</div>'}</div>
    </div>
    <div class="panel">
      <div class="panel-h"><h2>Daily revenue</h2><span class="sp"></span><span class="muted" style="font-size:12px">Last 14 days · SAR</span></div>
      <div class="panel-b">${lineChart(rev)}</div>
    </div>
  </div>`);
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
const OFILTERS=[['all','All orders'],['open','Not delivered'],['due','With due'],['ready','Ready'],['done','Delivered'],['late','Late'],['gift','Free gifts']];
function oInfo(o){
  const pcs=+o.qty||0,dq=o.st==='done'?pcs:Math.min(pcs,delLog.filter(d=>d.rno===o.rno).reduce((s,d)=>s+(+d.qty||0),0));
  const ps=k=>prodLog.filter(p=>p.rno===o.rno&&p.stage===k).reduce((s,p)=>s+(+p.qty||0),0);
  const cut=Math.min(pcs,Math.max(ps('cut'),o.t.cut==='done'?pcs:0)),sew=Math.min(pcs,Math.max(ps('sew'),o.t.sew==='done'?pcs:0));
  const hq=+o.hingeQty||(o.hinge?pcs:0),hd=Math.min(hq,Math.max(ps('hinge'),o.t.hinge==='done'?hq:0));
  const due=Math.round((o.total-o.paid)*100)/100;
  const status=dq>=pcs&&pcs>0?'Delivered':dq>0?'Partly delivered':o.st==='ready'?'Ready':o.due<today?'Late':sew>=pcs&&pcs>0?'Stitched':sew>0||cut>0||o.t.cut!=='wait'?'In progress':'Pending';
  return{dq,cut,sew,hq,hd,due,status};
}
const OSTAT_C={Delivered:'s-done','Partly delivered':'s-info',Ready:'s-ready',Late:'s-late',Stitched:'s-ready','In progress':'s-cut',Pending:'s-wait'};
let oSort={k:'rno',d:-1};
function ordersView(){
  const q=document.getElementById('q').value.trim().toLowerCase();const money=RA().money;
  const all=O();const info=new Map(all.map(o=>[o.rno,oInfo(o)]));
  const pass=(o,f)=>{const x=info.get(o.rno);return f==='all'?true:f==='open'?x.dq<o.qty:f==='due'?x.due>0.5:f==='ready'?o.st==='ready'&&x.dq<o.qty:f==='done'?x.status==='Delivered':f==='late'?x.dq<o.qty&&o.due<today:f==='gift'?!!o.gift:true};
  const hit=o=>{if(!q)return true;const c=cust(o.cid);return String(o.rno)===q||String(o.invoiceNo||'')===q||String(o.cid)===q||String(o.exeNo||'')===q||c.name.toLowerCase().includes(q)||String(c.phone).includes(q)};
  if(!OFILTERS.some(f=>f[0]===orderFilter))orderFilter='all';
  const val=(o,k)=>{const x=info.get(o.rno),c=cust(o.cid);return k==='rno'?o.rno:k==='inv'?(+o.invoiceNo||0):k==='cust'?c.name.toLowerCase():k==='booked'?+o.created:k==='due'?+o.due:k==='pcs'?o.qty:k==='total'?o.total:k==='paid'?o.paid:k==='bal'?x.due:k==='status'?x.status:o.rno};
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
     <button class="btn sm" id="oCsv" title="Download as CSV (Excel)">${ico('orders')}CSV</button><button class="btn sm" id="oPrint" title="Print this list">${ico('cal')}Print</button>
    </div>
    <div class="tbl-wrap otbl"><table class="ot">
     <thead><tr>${th('rno','Order / Invoice','stk s1')}${th('cust','Customer','stk s2')}<th>Mobile</th>${th('booked','Booked')}${th('due','Delivery')}${th('pcs','Pcs','r')}
      ${money?th('total','Total','r')+th('paid','Paid','r')+th('bal','Due','r'):''}${th('status','Status')}<th>Cut</th><th>Stitched</th><th>Hinge</th><th>Ready</th><th class="r">Delivered</th>${money?'<th>Method</th>':''}<th>Tailor</th><th>Fabric</th><th>Made at</th><th>Branch</th></tr></thead>
     <tbody>${fl.map(o=>{const c=cust(o.cid),x=info.get(o.rno),lateD=x.dq<o.qty&&o.due<today;return `<tr class="click" data-r="${o.rno}" tabindex="0">
      <td class="stk s1"><span class="rid">#${o.rno}</span><small class="sub">${o.gift?'Free gift':o.invoiceNo?'Inv '+o.invoiceNo:'Inv —'}${o.exeNo&&o.exeNo!==o.rno?' · shop '+o.exeNo:''}</small></td>
      <td class="stk s2"><b dir="auto" class="cn">${esc(c.name)}</b></td>
      <td class="num">${esc(c.phone)}</td>
      <td class="num">${D(o.created)}</td><td class="num ${lateD?'tbad':''}">${D(o.due)}</td><td class="r num">${o.qty}</td>
      ${money?`<td class="r num">${sar(o.total)}</td><td class="r num">${sar(o.paid)}</td><td class="r num ${x.due>0.5?'tbad':'tok'}">${x.due>0.5?sar(x.due):'—'}</td>`:''}
      <td><span class="pill ${OSTAT_C[x.status]||''}">${x.status}</span></td>
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
    const R=fl.map(o=>{const c=cust(o.cid),x=info.get(o.rno);return [o.rno,o.gift?'Gift':o.invoiceNo||'',c.name,c.phone,dkey2(o.created),dkey2(o.due),o.qty,...(money?[o.total,o.paid,x.due]:[]),x.status,x.cut,x.sew,x.hq?`${x.hd}/${x.hq}`:'',o.st==='ready'||o.st==='done'?'Yes':'',x.dq,...(money?[o.pm||'']:[]),o.tailor?wk(o.tailor).name:'',o.fabric||'',isFac(o.made)?bname(o.made):'Shop',bname(o.branch)]});
    return [H,...R]};
  document.getElementById('oCsv').onclick=()=>{const csv='﻿'+rowsCsv().map(r=>r.map(v=>`"${String(v??'').replace(/"/g,'""')}"`).join(',')).join('\r\n');
    const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));a.download=`orders_${dkey2(today)}.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),2000)};
  document.getElementById('oPrint').onclick=()=>{const rs=rowsCsv();const w=window.open('','_blank');if(!w){toast('Allow pop-ups to print');return}
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Orders ${dkey2(today)}</title><style>body{font:11px Arial,sans-serif;margin:16px}h1{font-size:16px;margin:0 0 4px}p{margin:0 0 10px;color:#555}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ccc;padding:3px 5px;text-align:left;white-space:nowrap}th{background:#eee}@page{size:A4 landscape;margin:10mm}</style></head><body><h1>Orders · ${esc(OFILTERS.find(f=>f[0]===orderFilter)[1])}</h1><p>${esc(curBranch?bname(curBranch):'All branches')} · ${today.toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'})} · ${pl(T.n,'order')}${money?` · total ${sar(T.tot)} SAR · due ${sar(T.due)} SAR`:''}</p><table><thead><tr>${rs[0].map(h=>`<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rs.slice(1).map(r=>`<tr>${r.map(v=>`<td dir="auto">${esc(v??'')}</td>`).join('')}</tr>`).join('')}</tbody></table></body></html>`);
    w.document.close();setTimeout(()=>w.print(),300)};
  bindRows();
}
function bindRows(){document.querySelectorAll('[data-r]').forEach(r=>r.onclick=()=>openOrder(+r.dataset.r))}
function waText(o){const c=cust(o.cid);const rem=o.total-o.paid;const first=c.name.split(' ')[0];
  return o.st==='ready'?`Assalamu alaikum ${first},\nYour thobes are ready for pickup at Saudi Thobe, ${bname(o.branch)} branch.\nReceipt no.: ${o.rno}\nBalance due: ${sar(rem)} SAR\nWe look forward to seeing you.`
  :`Assalamu alaikum ${first},\nWe have received your order no. ${o.rno} (${pl(o.qty,'thobe')}) at our ${bname(o.branch)} branch.\nExpected pickup: ${fmtD(o.due)}\nPaid: ${sar(o.paid)} SAR · Balance: ${sar(rem)} SAR`;}
function openOrder(rno){
  const o=orders.find(x=>x.rno===rno),c=cust(o.cid),i=SI[o.st],rem=o.total-o.paid,prof=c.profiles[o.profile]||c.profiles[0];
  drawer(c.name,`<div class="rid" style="font-size:13px">Receipt #${o.rno} · ${bname(o.branch)} branch</div>`,
   `<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">${pill(o)}<span class="muted num">${c.phone}</span></div>
    <div class="steps">${STAGES.map((s,j)=>`<div class="step ${j<i?'done':j===i?'cur':''}">${s.t}</div>`).join('')}</div>
    <div class="kv"><div><span>Thobes</span><b>${o.qty}</b></div><div><span>Ordered</span><b>${fmtD(o.created)}</b></div><div><span>Pickup</span><b>${fmtD(o.due)}</b></div>
     <div><span>Stitched at</span><b style="font-family:var(--f-body);font-size:13px">${o.made===o.branch?'Shop workshop':bname(o.made)}</b></div>
     ${RA().money?`<div><span>Total</span><b>${sar(o.total)}</b></div><div><span>Paid</span><b style="color:var(--ok)">${sar(o.paid)}</b></div><div><span>Balance</span><b style="color:${rem?'var(--bad)':'var(--ok)'}">${sar(rem)}</b></div>`:''}</div>
    <div><p class="h4">Workshop · ${o.made===o.branch?bname(o.made)+' workshop':bname(o.made)}</p><div class="rows" style="border:1px solid var(--line);border-radius:8px">${TASKS.map(t=>{const wid=t.k==='sew'?o.tailor:o.tw[t.k];return `<div class="row" style="padding-block:8px"><div class="grow"><b>${t.t}</b><span>${wid?wk(wid).name:'Not assigned yet'}</span></div>${taskPill(o,t.k)}${canTask()&&pending(o,t.k)?`<button class="btn sm" data-tk="${t.k}">${taskBtn(o,t.k)}</button>`:''}</div>`}).join('')}</div></div>
    <div><p class="h4">Tailor</p><div class="row" style="padding:0;border:0"><div class="wav" style="width:36px;height:36px;font-size:14px">${initials(wk(o.tailor).name)}</div><div class="grow"><b>${wk(o.tailor).name}</b><span>${wk(o.tailor).role} · ${bname(wk(o.tailor).branch)}</span></div></div></div>
    ${orderItems(o)}
    ${jHas(o.meas)||jHas(prof.m)?`<div><p class="h4">Measurement sheet & style</p>${jStylesHtml(jHas(o.meas)?o.meas:prof.m)}<button class="btn sm" id="jOpen" style="margin-top:8px">📐 Open the measurement sheet</button></div>`:`<div><p class="h4">Style</p><div class="kv">${DESIGN_.map(g=>`<div><span>${g.t}</span><b style="font-family:var(--f-body);font-size:13px">${g.opts.find(x=>x[0]===o.design[g.k])[1]}</b></div>`).join('')}<div><span>Fabric</span><b style="font-family:var(--f-body);font-size:13px">${o.fabric}</b></div></div></div>`}
    ${MALL.some(([k])=>mVal(prof.m,k)!=='')?`<div><p class="h4">Old shop paper values</p>${mShow(prof.m)}</div>`:''}
    ${o.note?`<div><p class="h4">Note</p><div class="msg" style="border-color:var(--brass)">${esc(o.note)}</div></div>`:''}
    ${RA().money?`<div><p class="h4">WhatsApp message</p><div class="msg" id="wamsg">${esc(waText(o))}</div></div>`:''}`,
   `${o.st==='ready'&&RA().pay&&!rem?`<button class="btn pri" id="handBtn">Hand over to customer</button>`:''}${rem&&RA().pay?`<button class="btn" id="payBtn">${ico('cash')}Record ${sar(rem)} SAR</button>`:''}${RA().money?`<button class="btn" id="waBtn">${ico('wa')}Copy message</button>`:''}`);
  document.querySelectorAll('[data-tk]').forEach(b=>b.onclick=()=>{stepTask(o,b.dataset.tk);route();openOrder(rno)});
  const jo=document.getElementById('jOpen');if(jo)jo.onclick=()=>jSheetWindow(`Order #${o.rno} · ${c.name}`,jHas(o.meas)?o.meas:prof.m,{ro:true});
  const hb=document.getElementById('handBtn');if(hb)hb.onclick=()=>{delLog.push({d:today,rno:o.rno,branch:o.branch,qty:o.qty,amt:0});o.st='done';toast(`#${o.rno} handed over`);route();openOrder(rno)};
  const pay=document.getElementById('payBtn');if(pay)pay.onclick=()=>{if(o.st==='ready'){o.st='done';delLog.push({d:today,rno:o.rno,branch:o.branch,qty:o.qty,amt:rem})}payLog.push({d:today,rno:o.rno,branch:o.branch,amt:rem,m:'Cash',t:'Balance'});o.paid=o.total;toast(`Payment of ${sar(rem)} SAR recorded`);route();openOrder(rno)};
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
  const due0=addD(today,10);const nextR=Math.max(...orders.map(o=>o.rno))+1;
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
    ${F('Order No',`<input id="fOno" class="num" readonly value="(new) ${nextR}">`)}
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
  $('fBranch').onchange=()=>{fillMade();fillTailors()};$('fMade').onchange=fillTailors;
  ['fDisc','fPaid'].forEach(id=>$(id).oninput=totals);
  $('fGift').onchange=()=>{$('fInv').value=$('fGift').checked?'(free gift – no invoice)':'(new)'};
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
    if(!cid){cid=customers.length+1;customers.push({id:cid,name,phone:$('fPhone').value.trim(),addr:$('fAddr').value.trim(),branch:+$('fBranch').value,profiles:[{name:'Self',m:meas}],hist:[{d:today,t:'First measurement taken',by:USER.name||'Admin'}]})}
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
    orders.unshift(o);
    toast(`${money?`Order #${nextR} saved`:`Order #${nextR} sent to the cashier`} · now in ${bname(o.made)} cutting`);
    if(print)printOrder(o);
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
function printOrder(o){
  const c=cust(o.cid),w=window.open('','_blank');if(!w){toast('Allow pop-ups to print');return}
  const L=o.lines||[],E=o.emb||[];
  w.document.write(`<!doctype html><html dir="rtl"><head><meta charset="utf-8"><title>Order ${o.rno}</title><style>body{font:13px Arial,sans-serif;margin:14px;max-width:560px}h1{font-size:18px;margin:0}table{width:100%;border-collapse:collapse;margin:8px 0}th,td{border-bottom:1px solid #ccc;padding:4px;text-align:right}td.n{text-align:left;direction:ltr}.t td{border:0;padding:2px 4px}.b{font-weight:bold;font-size:15px}@page{margin:8mm}</style></head><body>
   <h1>الثوب السعودي · AL THOB AL SAUDI</h1><div>${esc(bname(o.branch))} · ${o.created.toLocaleDateString('en-GB')}</div><hr>
   <table class="t"><tr><td>رقم الطلب / Order</td><td class="n b">${o.rno}</td></tr><tr><td>العميل / Customer</td><td class="n">${esc(c.name)} (${c.id})</td></tr><tr><td>الجوال / Mobile</td><td class="n">${esc(c.phone)}</td></tr>
   <tr><td>التسليم / Delivery</td><td class="n b">${o.due.toLocaleDateString('en-GB')}</td></tr>${o.hingeQty?`<tr><td>Hinge</td><td class="n">${o.hingeQty}</td></tr>`:''}${o.zipQty?`<tr><td>سحاب / Zip</td><td class="n">${o.zipQty}</td></tr>`:''}${o.sample?'<tr><td colspan="2">عينة: العميل ترك ثوب عينة</td></tr>':''}${o.gift?'<tr><td colspan="2"><b>هدية – Free gift</b></td></tr>':''}</table>
   <table><thead><tr><th>الصنف / Item</th><th>العدد</th><th>السعر</th><th>المبلغ</th></tr></thead><tbody>${[...L,...E].map(l=>`<tr><td>${esc(l.item)}${l.code?' ('+l.code+')':''}</td><td class="n">${l.qty}</td><td class="n">${sar2(l.rate)}</td><td class="n">${sar2(l.qty*l.rate)}</td></tr>`).join('')}</tbody></table>
   <table class="t"><tr><td>المجموع / Subtotal</td><td class="n">${sar2(o.gross)}</td></tr><tr><td>الخصم / Discount</td><td class="n">${sar2(o.disc)}</td></tr><tr><td>ضريبة 15% / VAT</td><td class="n">${sar2(o.vat)}</td></tr>
   <tr class="b"><td>الإجمالي / TOTAL</td><td class="n">${sar2(o.total)}</td></tr><tr><td>المدفوع / Paid${o.pm?' ('+esc(o.pm)+')':''}</td><td class="n">${sar2(o.paid)}</td></tr><tr class="b"><td>المتبقي / Balance</td><td class="n">${sar2(o.total-o.paid)}</td></tr></table>
   ${o.note?`<div>ملاحظات: ${esc(o.note)}</div>`:''}</body></html>`);
  w.document.close();setTimeout(()=>w.print(),300);
}

/* the order's items as the shop exe keeps them: fabric lines (IN = shop stock / OUT = customer's fabric), embroidery, totals */
function orderItems(o){
  const L=o.lines||[],E=o.emb||[],money=RA().money;
  const extra=[o.invoiceNo?['Invoice no.',String(o.invoiceNo)]:null,o.exeNo&&o.exeNo!==o.rno?['Shop order no.',String(o.exeNo)]:null,o.hingeQty?['Hinge button',o.hingeQty+' pcs']:null,o.zipQty?['Zip',o.zipQty+' pcs']:null,
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
  V(`<div class="mlay">
   <div class="panel"><div class="panel-h"><h2>Customers</h2><span class="sp"></span><span class="muted num" style="font-size:12px">${list.length}</span></div>
    <div class="clist">${show.map(x=>`<button class="crow ${x.id===c.id?'on':''}" data-c="${x.id}"><div class="ini num" style="font-size:11px">${x.id}</div><div class="grow"><b dir="auto">${esc(x.name)}</b><span>${esc(x.phone)}${jHas((x.profiles[0]||{}).m)?' · 📐':''}</span></div></button>`).join('')}${list.length>show.length?`<div class="muted" style="padding:10px;font-size:12px">Search to find the other ${list.length-show.length}…</div>`:''}</div></div>
   <div class="sec">
    <div class="panel">
     <div class="panel-h" style="flex-wrap:wrap;gap:8px"><div><h2 style="font-size:18px;font-family:var(--f-display);font-weight:600" dir="auto">${esc(c.name)}</h2><span class="muted num" style="font-size:12.5px">No. ${c.id} · ${esc(c.phone)} · ${bname(c.branch)} · ${pl(last.length,'order')}${c.book?` · <span dir="rtl">دفتر ${esc(c.book)}</span>`:''}</span></div><span class="sp"></span>
      <span class="muted" id="msN" style="font-size:12.5px"></span>
      <button class="btn sm" id="msZo" aria-label="Smaller">－</button><button class="btn sm" id="msZi" aria-label="Bigger">＋</button><button class="btn sm" id="msFull">Full screen</button>
      <button class="btn sm" id="mReset">Undo changes</button><button class="btn sm pri" id="mSave">Save measurements</button>
      ${can('new')?`<button class="btn sm" id="newOrdBtn">${ico('plus')}New order</button>`:''}</div>
     <div class="jwrap" id="msHost"></div>
    </div>
    ${oldPaper?`<details class="panel" style="padding:0"><summary class="panel-h" style="cursor:pointer"><h2>Old shop paper values</h2><span class="sp"></span><span class="muted" style="font-size:12px">from the earlier AL THOB sheet</span></summary><div class="panel-b">${mShow(p.m)}</div></details>`:''}
    <div class="grid2">
     <div class="panel"><div class="panel-h"><h2>Measurement history</h2></div><div class="panel-b"><div class="hist">${(c.hist||[]).map(h=>`<div><time>${fmtD(h.d)}</time><span style="flex:1">${esc(h.t)}</span><span class="muted">${esc(h.by||'')}</span></div>`).join('')||'<span class="muted">—</span>'}</div></div></div>
     <div class="panel"><div class="panel-h"><h2>Recent orders</h2></div><div class="rows">${last.slice(0,5).map(o=>`<div class="row" data-r="${o.rno}" style="cursor:pointer"><span class="rid">#${o.rno}</span><div class="grow"><b>${pl(o.qty,'thobe')} · <span dir="auto">${esc(o.fabric||'')}</span></b><span>${fmtD(o.created)}</span></div>${pill(o)}</div>`).join('')||'<div class="empty">No orders yet.</div>'}</div></div>
    </div>
   </div></div>`);
  const fabs=()=>{const a=[];last.slice(0,3).forEach(o=>(o.lines||[]).forEach(l=>{const n=l.src==='OUT'?'قماش العميل':String(l.code||l.item);if(!a.includes(n))a.push(n)}));return a};
  const msN=()=>{document.getElementById('msN').textContent=jCount(work)+' values'};
  jsCur=jSheet(document.getElementById('msHost'),work,{fabrics:fabs,onChange:msN});msN();
  document.getElementById('msZo').onclick=()=>jsCur.zoom(.8);document.getElementById('msZi').onclick=()=>jsCur.zoom(1.25);
  document.getElementById('msFull').onclick=()=>jSheetWindow(`Measurements · ${c.name}`,work,{fabrics:fabs,onDone:m=>{jsCur.load(m)}});
  document.querySelectorAll('.crow').forEach(b=>b.onclick=()=>{selCust=+b.dataset.c;measurements()});
  document.getElementById('mReset').onclick=()=>measurements();
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
  V(`<div class="panel"><div class="panel-h"><h2>${pl(list.length,'customer')}</h2><span class="sp"></span><span class="muted" style="font-size:12px">Sorted by total spent · tap a row for measurements</span></div><div class="tbl-wrap"><table>
   <thead><tr><th class="r">Cust No</th><th>Customer</th><th>Mobile</th><th>Book</th><th class="r">Orders</th>${RA().money?'<th class="r">Total paid</th><th class="r">Balance</th>':''}<th>Last order</th><th>Home branch</th></tr></thead>
   <tbody>${list.map(x=>`<tr class="click" data-c="${x.c.id}"><td class="num r" style="text-align:right">${x.c.id}</td><td><b dir="auto">${esc(x.c.name)}</b></td><td class="num">${esc(x.c.phone)}</td><td dir="auto" class="muted">${esc(x.c.book||'')}</td><td class="num" style="text-align:right">${x.n}</td>${RA().money?`<td class="num" style="text-align:right">${sar(x.spent)}</td>
    <td class="num" style="text-align:right;color:${x.due?'var(--bad)':'var(--muted)'}">${x.due?sar(x.due):'—'}</td>`:''}<td>${x.last?`<span class="rid">#${x.last.rno}</span> ${pill(x.last)}`:'—'}</td><td>${bTag(x.c.branch)} ${bname(x.c.branch)}</td></tr>`).join('')}</tbody></table></div></div>`);
  document.querySelectorAll('tr[data-c]').forEach(r=>r.onclick=()=>{selCust=+r.dataset.c;selProf=0;location.hash='measurements'});
}

/* ================= Payments ================= */
/* Payments: the AL THOB exe's Payments page (every payment and delivery, from – to, type, branch, search) and the unpaid receipts */
let payTab='log',payF={from:null,to:null,type:'all',br:-1,q:''};
function payRows(){
  // one row per payment; a delivery on the same order and day joins its payment row, else it is a row of its own
  const used=new Set(),rows=[];
  payLog.forEach((p,i)=>{const d=delLog.findIndex((x,k)=>!used.has(k)&&x.rno===p.rno&&+x.d===+p.d);if(d>=0)used.add(d);
    rows.push({k:'p'+i,d:p.d,rno:p.rno,branch:p.branch,type:p.t==='Deposit'?'Down payment':'Due payment',act:d>=0?'DELIVER':'PAY',amt:+p.amt||0,m:p.pm||p.m||'',ref:p.ref||'',dq:d>=0?(+delLog[d].qty||0):0,receipt:p.receipt||'',src:p,del:d>=0?delLog[d]:null})});
  delLog.forEach((x,k)=>{if(!used.has(k))rows.push({k:'d'+k,d:x.d,rno:x.rno,branch:x.branch,type:'Due payment',act:'DELIVER',amt:0,m:'',ref:'',dq:+x.qty||0,receipt:'',src:null,del:x})});
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
     <tbody>${open.map(o=>{const c=cust(o.cid),p=o.total?o.paid/o.total:0;return `<tr class="click" data-r="${o.rno}"><td><span class="rid">#${o.rno}</span><small class="sub">${o.invoiceNo?'Inv '+o.invoiceNo:'Inv —'}</small></td><td><b dir="auto">${esc(c.name)}</b></td><td class="num">${esc(c.phone)}</td>
      <td class="r num">${sar(o.total)}</td><td class="r num">${sar(o.paid)}</td><td class="r num tbad">${sar(o.total-o.paid)}</td><td><div class="mbar"><i><b style="width:${p*100}%"></b></i></div></td><td>${pill(o)}</td><td>${bTag(o.branch)} ${bname(o.branch)}</td></tr>`}).join('')}</tbody></table>${open.length?'':'<div class="empty">No unpaid receipts.</div>'}</div></div>`);
    document.querySelectorAll('[data-pt]').forEach(b=>b.onclick=()=>{payTab=b.dataset.pt;payments()});bindRows();return}
  const d0=new Date(payF.from),d1=new Date(payF.to);d1.setHours(23,59,59);
  const q=payF.q.trim().toLowerCase();
  const rows=payRows().filter(r=>{if(r.d<d0||r.d>d1)return false;if(payF.br&&r.branch!==payF.br)return false;
    if(payF.type==='down'&&r.type!=='Down payment')return false;if(payF.type==='due'&&r.type!=='Due payment')return false;
    if(!q)return true;const o=orders.find(x=>x.rno===r.rno),c=o?cust(o.cid):null;return String(r.rno)===q||String(r.receipt)===q||(o&&String(o.invoiceNo||'')===q)||(c&&c.name.toLowerCase().includes(q))});
  const tot=rows.reduce((s,r)=>s+r.amt,0),byM={};rows.forEach(r=>{if(r.amt){const k=webCat(r.m||'Cash');byM[k]=(byM[k]||0)+r.amt}});
  const D=d=>d.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'2-digit'});
  V(`${tabs}<div class="okpi"><div><span>Payments</span><b class="num">${rows.filter(r=>r.amt).length}</b><em>${D(d0)} – ${D(d1)}</em></div>
    <div class="okc"><span>Total received</span><b class="num">${sar2(tot)}<small>SAR</small></b><em>${payF.br?bname(payF.br):'All branches'}</em></div>
    ${['Cash','Card (mada)','Transfer'].map(k=>`<div><span>${k}</span><b class="num">${sar(byM[k]||0)}<small>SAR</small></b><em>${tot?Math.round((byM[k]||0)/tot*100):0}%</em></div>`).join('')}
    <div><span>Deliveries</span><b class="num">${rows.reduce((s,r)=>s+r.dq,0)}</b><em>pieces handed over</em></div></div>
  <div class="panel opanel">
   <div class="otools">${money?`<button class="btn sm pri" id="pRecv">${ico('cash')}Receive payment / Deliver</button>`:''}<button class="btn sm" id="pReprint">Reprint receipt</button>${isOwner()?'<button class="btn sm" id="pDel" style="color:var(--bad)">Delete payment</button>':''}<span class="sp"></span><button class="btn sm" id="pCsv">${ico('orders')}CSV</button><button class="btn sm" id="pPrint">${ico('cal')}Print</button></div>
   <div class="otools pf">
    <label>From <input type="date" id="pFrom" value="${dkey2(d0)}"></label><label>To <input type="date" id="pTo" value="${dkey2(payF.to)}"></label>
    <select id="pType"><option value="all"${payF.type==='all'?' selected':''}>All payments</option><option value="down"${payF.type==='down'?' selected':''}>Down payments (at booking)</option><option value="due"${payF.type==='due'?' selected':''}>Due payments / deliveries</option></select>
    <select id="pBr"><option value="0">All branches</option>${SHOPS().map(b=>`<option value="${b.id}"${b.id===payF.br?' selected':''}>${esc(b.name)}</option>`).join('')}</select>
    <input id="pQ" placeholder="Search: name / order / receipt" value="${esc(payF.q)}" style="min-width:200px">
    <button class="btn sm pri" id="pShow">Show</button><span class="muted" style="font-size:13px"><b>${pl(rows.length,'row')}</b> · Total <b class="num">${sar2(tot)}</b></span></div>
   <div class="tbl-wrap otbl"><table class="ot" style="min-width:1400px"><thead><tr><th class="stk s1">Date</th><th>Receipt</th><th>Order No</th><th>Invoice</th><th>Customer</th><th class="r">Order Total</th><th>Type</th><th>Action</th><th class="r">Amount</th><th>Method</th><th>Reference</th><th class="r">Delivered Qty</th><th class="r">Balance now</th><th>Branch</th></tr></thead>
    <tbody>${rows.map(r=>{const o=orders.find(x=>x.rno===r.rno),c=o?cust(o.cid):null;return `<tr class="click${r.k===payF.sel?' sel':''}" data-pk="${r.k}" tabindex="0">
     <td class="stk s1 num">${D(r.d)}</td><td class="num">${r.receipt||'<span class="muted">—</span>'}</td><td><span class="rid">#${r.rno}</span></td><td class="num">${o&&o.invoiceNo?o.invoiceNo:'<span class="muted">—</span>'}</td>
     <td><b dir="auto">${c?esc(c.name):'—'}</b></td><td class="r num">${o?sar(o.total):'—'}</td><td>${r.type}</td><td><span class="pill ${r.act==='DELIVER'?'s-ready':'s-cut'}">${r.act}</span></td>
     <td class="r num" style="font-weight:600">${r.amt?sar2(r.amt):'<span class="muted">0</span>'}</td><td>${esc(r.m)}</td><td class="num">${esc(r.ref)}</td><td class="r num">${r.dq||''}</td>
     <td class="r num ${o&&o.total-o.paid>0.5?'tbad':'tok'}">${o?(o.total-o.paid>0.5?sar(o.total-o.paid):'—'):''}</td><td>${bTag(r.branch)} ${bname(r.branch)}</td></tr>`}).join('')}</tbody>
    ${rows.length?`<tfoot><tr><td class="stk s1">Total</td><td colspan="7">${pl(rows.length,'row')}</td><td class="r num">${sar2(tot)}</td><td colspan="2"></td><td class="r num">${rows.reduce((s,r)=>s+r.dq,0)}</td><td colspan="2"></td></tr></tfoot>`:''}
   </table>${rows.length?'':'<div class="empty">No payments in these days.</div>'}</div></div>`);
  const $=id=>document.getElementById(id);
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
    ...rows.map(r=>{const o=orders.find(x=>x.rno===r.rno),c=o?cust(o.cid):null;return [dkey2(r.d),r.receipt,r.rno,o&&o.invoiceNo||'',c?c.name:'',o?o.total:'',r.type,r.act,r.amt,r.m,r.ref,r.dq,bname(r.branch)]})];
  $('pCsv').onclick=()=>{const csv='﻿'+csvRows().map(r=>r.map(v=>`"${String(v??'').replace(/"/g,'""')}"`).join(',')).join('\r\n');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));a.download=`payments_${dkey2(d0)}_${dkey2(payF.to)}.csv`;a.click()};
  $('pPrint').onclick=()=>{const rs=csvRows(),w=window.open('','_blank');if(!w){toast('Allow pop-ups to print');return}
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Payments</title><style>body{font:11px Arial,sans-serif;margin:16px}h1{font-size:16px;margin:0 0 4px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ccc;padding:3px 5px;text-align:left;white-space:nowrap}th{background:#eee}@page{size:A4 landscape;margin:10mm}</style></head><body><h1>Payments · ${payF.br?esc(bname(payF.br)):'All branches'}</h1><p>${D(d0)} – ${D(d1)} · ${pl(rows.length,'row')} · total ${sar2(tot)} SAR</p><table><thead><tr>${rs[0].map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${rs.slice(1).map(r=>`<tr>${r.map(v=>`<td dir="auto">${esc(v??'')}</td>`).join('')}</tr>`).join('')}</tbody></table></body></html>`);w.document.close();setTimeout(()=>w.print(),300)};
}
/* + Receive payment / Deliver: as the exe's payment window – order no., due, amount, method, reference, pieces handed over */
function receivePayment(rno,deliverAll){
  const close=drawer('Receive payment / Deliver','<div class="muted" style="font-size:13px">Type the order no. (or the invoice no.)</div>',
   `<div class="fgrid" style="grid-template-columns:1fr 1fr"><div class="field" style="grid-column:1/-1"><label for="rpO">Order No</label><input id="rpO" class="num" inputmode="numeric" value="${rno||''}"></div>
     <div id="rpInfo" style="grid-column:1/-1"></div>
     <div class="field"><label for="rpA">Amount (SAR)</label><input id="rpA" type="number" min="0" class="num"></div>
     <div class="field"><label for="rpM">Payment method</label><select id="rpM"><option value=""></option>${PMETHODS.map(m=>`<option>${m}</option>`).join('')}</select></div>
     <div class="field"><label for="rpR">Reference / SPAN</label><input id="rpR"></div>
     <div class="field"><label for="rpQ">Deliver pieces now</label><input id="rpQ" type="number" min="0" value="0" class="num"></div></div>`,
   `<button class="btn pri" id="rpSave">Save</button><button class="btn" id="rpPrint">Save &amp; Print</button>`);
  const $=id=>document.getElementById(id);let o=null;
  const find=()=>{const v=$('rpO').value.trim();o=orders.find(x=>String(x.rno)===v)||orders.find(x=>String(x.invoiceNo||'')===v&&v)||null;
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
    close();toast(`Order #${o.rno}: ${a?sar2(a)+' SAR received':''}${a&&q?' · ':''}${q?q+' pcs delivered':''}`);
    if(print)printPayment({d:new Date(today),rno:o.rno,amt:a,m,ref:p?p.ref:'',dq:q,type:'Due payment',receipt:''});route()};
  $('rpSave').onclick=()=>save(false);$('rpPrint').onclick=()=>save(true);
}
function printPayment(r){
  const o=orders.find(x=>x.rno===r.rno),c=o?cust(o.cid):null,w=window.open('','_blank');if(!w){toast('Allow pop-ups to print');return}
  w.document.write(`<!doctype html><html dir="rtl"><head><meta charset="utf-8"><title>Receipt ${r.rno}</title><style>body{font:13px Arial,sans-serif;margin:12px;max-width:340px}h1{font-size:16px;margin:0}td{padding:3px 2px}td.n{text-align:left;direction:ltr}.b{font-weight:bold;font-size:15px}@page{margin:6mm}</style></head><body>
   <h1>الثوب السعودي · AL THOB AL SAUDI</h1><div>سند قبض / Payment receipt${r.receipt?' #'+r.receipt:''}</div><hr><table style="width:100%">
   <tr><td>التاريخ / Date</td><td class="n">${r.d.toLocaleDateString('en-GB')}</td></tr><tr><td>رقم الطلب / Order</td><td class="n b">${r.rno}</td></tr>${o&&o.invoiceNo?`<tr><td>الفاتورة / Invoice</td><td class="n">${o.invoiceNo}</td></tr>`:''}
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
  const doneQ=(w.mdone||0)+month.reduce((s,o)=>s+o.qty,0);
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
   </button>`}).join('')||'<div class="empty">No workers match.</div>'}</div>`);
  document.querySelectorAll('[data-role]').forEach(b=>b.onclick=()=>{workerRole=b.dataset.role;workersView()});
  document.querySelectorAll('[data-w]').forEach(b=>b.onclick=()=>openWorker(+b.dataset.w));
  const aw=document.getElementById('addW');if(aw)aw.onclick=()=>workerForm();
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
    <div><p class="h4">Attendance · last 14 days <span class="muted" style="font-weight:500">(${s.absent} absent)</span></p><div class="att">${w.att.map(a=>`<i class="${a==='a'?'a':a==='o'?'o':''}"></i>`).join('')}</div><p class="muted" style="font-size:11.5px;margin:6px 0 0">Green present · red absent · grey Friday</p></div>
    ${ROLE2TASK[w.role]?'<div id="wwSec"></div>':''}
    ${w.role==='Tailor'?`<div><p class="h4">Current work (${pl(s.act,'thobe')})</p><div class="rows" style="border:1px solid var(--line);border-radius:8px">${os.map(o=>`<div class="row" data-r="${o.rno}" style="cursor:pointer"><span class="rid">#${o.rno}</span><div class="grow"><b>${cust(o.cid).name}</b><span>${pl(o.qty,'thobe')} · due ${fmtD(o.due)}</span></div>${pill(o)}</div>`).join('')||'<div class="empty">Nothing assigned.</div>'}</div></div>`:''}`,
   `${canEditW(w)?`<button class="btn pri" id="editW">Edit</button>`:''}${canEditW(w)||isOwner()?`<button class="btn" id="appW">App link</button>`:''}${(canEditW(w)||ROLE==='manager')&&okW(w)?`<button class="btn" id="leaveW">${w.status==='leave'?'Mark as back':'Mark on leave'}</button>`:''}
    ${isOwner()?`<button class="btn" id="actW">${w.status==='inactive'?'Activate':'Deactivate'}</button><button class="btn" id="blkW" style="color:var(--bad)">${w.status==='blocked'?'Unblock':'Block'}</button><button class="btn" id="delW" style="color:var(--bad);border-color:var(--bad)">Delete</button>`:'<span class="muted" style="font-size:12px;align-self:center">Block, deactivate and delete: owner only</span>'}`);
  const $=x=>document.getElementById(x);
  wwMount(w);
  if($('editW'))$('editW').onclick=()=>workerForm(w);
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
  $('wSave').onclick=()=>{const n=$('wName').value.trim();if(!n){toast('Enter the worker\'s name');$('wName').focus();return}
    const t=w||{id:workers.length+1,status:'active',mdone:0,att:Array.from({length:14},(_,k)=>addD(today,k-13).getDay()===5?'o':'p')};
    Object.assign(t,{name:n,role:$('wRole').value,branch:+$('wBranch').value,phone:$('wPhone').value.trim(),nat:$('wNat').value.trim(),pay:$('wPay').value,rate:+$('wRate').value||0,basic:+$('wBasic').value||0,target:+$('wTarget').value||0,comm:+$('wComm').value||0,joined:new Date($('wJoin').value||today),iqama:$('wIq').value?new Date($('wIq').value):null});
    if(!w)workers.push(t);close();toast(w?'Changes saved':`${n} added to ${bname(t.branch)}`);if((location.hash||'').slice(1)!=='workers')location.hash='workers';else route();if(!w)workerApp(t,true)};
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
  <div class="demo"><span class="tag">Demo data</span> ${dayLabel}, ${D.toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'})} · ${curBranch?bname(curBranch)+(isFac(curBranch)?'':' branch'):'all branches and factories'}${isFri?' · Friday, shop closed':''}</div>
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
   <div class="panel"><div class="panel-h"><h2>Delivered & paid</h2><span class="sp"></span><span class="muted" style="font-size:12px">${pl(dels.length,'order')}</span></div><div class="tbl-wrap"><table><thead><tr><th>Receipt</th>${shops.length>1?'<th>Branch</th>':''}<th>Thobes</th><th>Paid at delivery</th></tr></thead><tbody>${dels.map(p=>`<tr><td><span class="rid">#${p.rno}</span></td>${shops.length>1?`<td>${bTag(p.branch)}</td>`:''}<td class="num">${p.qty}</td><td class="num">${p.amt?sar(p.amt):'<span class="muted">already paid</span>'}</td></tr>`).join('')||'<tr><td colspan="4" class="muted">No deliveries.</td></tr>'}</tbody></table></div></div>
   <div class="panel"><div class="panel-h"><h2>New orders booked</h2><span class="sp"></span><span class="muted" style="font-size:12px">${pl(booked.length,'order')}</span></div><div class="tbl-wrap"><table><thead><tr><th>Receipt</th><th>Customer</th><th>Thobes</th><th>Sale</th><th>Deposit</th></tr></thead><tbody>${booked.map(o=>`<tr class="click" data-r="${o.rno}"><td><span class="rid">#${o.rno}</span> ${shops.length>1?bTag(o.branch):''}</td><td>${cust(o.cid).name}</td><td class="num">${o.qty}</td><td class="num">${sar(o.total)}</td><td class="num">${sar(o.paid)}</td></tr>`).join('')||'<tr><td colspan="5" class="muted">No new orders.</td></tr>'}</tbody></table></div></div>
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
    <div class="rows">${ready.map(o=>{const rem=o.total-o.paid;return `<div class="row tpay" data-pay="${o.rno}" tabindex="0" style="cursor:pointer" title="Receive payment / deliver"><span class="rid">#${o.rno}</span><div class="grow"><b dir="auto">${esc(cust(o.cid).name)}</b><span class="num">${cust(o.cid).phone} · ${pl(o.qty,'thobe')}</span></div>
     <span class="num" style="font-weight:700;color:${rem>0.5?'var(--bad)':'var(--ok)'}">${rem>0.5?sar(rem)+' SAR':'Paid'}</span><span class="muted" aria-hidden="true">›</span></div>`}).join('')||'<div class="empty">No thobes waiting for pickup.</div>'}</div></div>
   ${unpaidNew.length?`<div class="panel"><div class="panel-h"><h2>New orders waiting for deposit</h2><span class="sp"></span><span class="muted" style="font-size:12px">Sent by measurement</span></div><div class="rows">${unpaidNew.map(o=>`<div class="row"><span class="rid">#${o.rno}</span><div class="grow"><b>${cust(o.cid).name}</b><span>${pl(o.qty,'thobe')} · ${o.fabric}</span></div><input class="num" style="width:80px;border:1px solid var(--line);border-radius:7px;padding:6px;background:var(--ground)" id="dep${o.rno}" value="${Math.round(o.total/2)}" aria-label="Deposit"><button class="btn sm pri" data-dep="${o.rno}">Take deposit</button></div>`).join('')}</div></div>`:''}
  </div>
  <aside class="sec">
   <div class="panel"><div class="panel-h"><h2>Today's cash box</h2><span class="sp"></span><span class="muted" style="font-size:12px">${bname(b)}</span></div>
    <div class="cashbox"><div><span>Cash</span><span class="num">${sar(by('Cash'))}</span></div><div><span>Card (mada)</span><span class="num">${sar(by('Card (mada)'))}</span></div><div><span>Bank transfer</span><span class="num">${sar(by('Transfer'))}</span></div><div><span>Total today</span><span class="num">${sar(log.reduce((s,p)=>s+p.amt,0))} SAR</span></div></div></div>
   <div class="panel"><div class="panel-h"><h2>Today's receipts</h2></div><div class="rows">${log.slice().reverse().map(p=>`<div class="row" style="padding-block:8px"><span class="rid">#${p.rno}</span><div class="grow"><b style="font-weight:500">${p.t}</b><span>${p.m}</span></div><span class="num">${sar(p.amt)}</span></div>`).join('')||'<div class="empty">No payments yet today.</div>'}</div></div>
   <button class="btn" id="closeDay">Close the day</button>
  </aside></div>`);
  const tq=document.getElementById('tq');
  tq.oninput=()=>{const q=tq.value.trim();const res=document.getElementById('tres');if(q.length<2){res.innerHTML='';return}
    const f=mine.filter(o=>String(o.rno).includes(q)||cust(o.cid).phone.includes(q)).slice(0,5);
    res.innerHTML=`<div class="panel"><div class="rows">${f.map(o=>`<div class="row" data-pay="${o.rno}" style="cursor:pointer"><span class="rid">#${o.rno}</span><div class="grow"><b>${cust(o.cid).name}</b><span>${pl(o.qty,'thobe')} · balance ${sar(o.total-o.paid)} SAR</span></div>${pill(o)}</div>`).join('')||'<div class="empty">No receipt found in this branch.</div>'}</div></div>`;
    res.querySelectorAll('[data-pay]').forEach(x=>x.onclick=()=>{const o=orders.find(y=>y.rno===+x.dataset.pay);receivePayment(o.rno,o.st==='ready')})};
  // a ready order: the payment / delivery window (as the exe's) – balance and all pieces filled in
  document.querySelectorAll('[data-pay]').forEach(x=>{x.onclick=()=>receivePayment(+x.dataset.pay,true);x.onkeydown=e=>{if(e.key==='Enter')x.click()}});
  document.querySelectorAll('[data-dep]').forEach(x=>x.onclick=()=>{const o=orders.find(y=>y.rno===+x.dataset.dep);const a=+document.getElementById('dep'+o.rno).value||0;if(!a){toast('Enter the deposit amount');return}o.paid=Math.min(o.total,a);payLog.push({d:today,rno:o.rno,branch:o.branch,amt:o.paid,m:'Cash',t:'Deposit'});toast(`Deposit ${sar(o.paid)} SAR taken for #${o.rno}`);route()});
  document.getElementById('closeDay').onclick=()=>toast('Demo: the day total will be locked and sent to the owner');
  document.querySelectorAll('.rid[data-r]').forEach(r=>r.onclick=()=>openOrder(+r.dataset.r));
}

/* ================= Tailor: My work ================= */
const ME=()=>workers.find(w=>w.name===USER.name)||workers.find(w=>w.role==='Tailor'&&w.branch===USER.branch)||workers.find(w=>w.role==='Tailor');
function mmLine(o){const c=cust(o.cid),p=c.profiles[o.profile]||c.profiles[0];return MEAS.filter(([k])=>mVal(p.m,k)!=='').slice(0,4).map(([k,t])=>`<span dir="rtl">${esc(t)}</span> ${esc(mVal(p.m,k))}`).join(' ')||'<span>No measurement yet</span>'}
function myJobs(w){const k=ROLE2TASK[w.role];if(!k)return[];
  return orders.filter(o=>(pending(o,k)||(k==='sew'&&atTailor(o)))&&(k==='sew'?o.tailor===w.id:(o.made===w.branch&&(!o.tw[k]||o.tw[k]===w.id)))).sort((a,b)=>a.due-b.due)}
/* tailor's card after stitching: send for hinge / tatreez / bottom cutting, see where it is, then Ready */
function tailorBack(o){const ts=TASKS.filter(t=>t.m==='send'&&needs(o,t.k));
  const parts=ts.map(t=>{const v=tv(o,t.k);return v==='done'?`<span class="pill s-ready">${t.t} done</span>`:v==='doing'?`<span class="pill s-cut">At ${t.t.toLowerCase()}</span>`:isSent(o,t.k)?`<span class="pill s-wait">Sent for ${t.t.toLowerCase()}</span>`:`<button class="btn pri" data-send="${o.rno}" data-k="${t.k}">Send for ${t.t.toLowerCase()}</button>`});
  const done=allStepsDone(o);
  return parts.join('')+(FLOW_OPT.tready?`<button class="btn ${done?'pri':''}" data-rdy="${o.rno}" ${done?'':'disabled title="Waiting for the other steps"'} style="${done?'background:var(--ok);border-color:var(--ok)':''}">✓ Ready</button>`:'')}
function mywork(){
  const w=ROLE==='tailor'?ME():(workers.find(x=>x.role==='Tailor'&&x.branch===(curBranch||4))||ME());
  const k=ROLE2TASK[w.role]||'sew';const s=wStats(w);const jobs=myJobs(w);
  V(`<div class="kpis">
    <div class="kpi"><span class="l">Waiting for me</span><span class="v">${jobs.filter(o=>o.t[k]==='wait').reduce((a,o)=>a+o.qty,0)}</span><span class="d muted">${TK[k].t} · ${pl(jobs.length,'job card')}</span></div>
    <div class="kpi"><span class="l">In progress</span><span class="v">${jobs.filter(o=>o.t[k]==='doing').reduce((a,o)=>a+o.qty,0)}</span><span class="d muted">Started, not finished</span></div>
    <div class="kpi"><span class="l">${k==='sew'?'Finished this month':'Done today'}</span><span class="v">${k==='sew'?s.doneQ:prodLog.filter(p=>p.w===w.id&&+p.d===+today).reduce((a,p)=>a+p.qty,0)}<small>pcs</small></span><span class="d ${k==='sew'&&s.doneQ>=w.target?'up':'muted'}">${k==='sew'&&w.pay==='target'?(s.doneQ>=w.target?`Target reached · +${s.extra} extra`:`${w.target-s.doneQ} pcs to target`):w.role}</span></div>
    <a class="kpi" href="#mypay" style="text-decoration:none;color:inherit"><span class="l">My pay this month</span><span class="v">${sar(monthPay(w,ymKey(today)).net)}<small>SAR</small></span><span class="d muted">After deductions · see details ›</span></a></div>
  ${w.pay==='target'&&k==='sew'?`<div class="panel"><div class="panel-b">${targetBar(w,s)}</div></div>`:''}
  <h2 style="margin:0;font-size:17px">My job cards · ${TK[k].t}</h2>
  ${jobs.map(o=>{const c=cust(o.cid),p=c.profiles[o.profile]||c.profiles[0],d=daysLeft(o);return `<div class="jc">
    <div class="jh"><span class="rid" style="font-size:17px">#${o.rno}</span><div style="flex:1;min-width:0"><b>${c.name.split(' ')[0]} · ${pl(o.qty,'thobe')} · ${BRANCHES.find(b=>b.id===o.branch).code}</b><div class="muted" style="font-size:12.5px">${o.fabric} · ${p.name}${o.hinge?' · Hinge':''}${o.tatreez?' · Tatreez':''}${+o.zipQty?' · Zip':''}${o.note?' · '+esc(o.note):''}</div></div>${k==='sew'&&atTailor(o)?(allStepsDone(o)?'<span class="pill s-ready">Stitched · all done</span>':'<span class="pill s-cut">Stitched</span>'):taskPill(o,k)}<span class="days ${d<0?'late':d<=1?'today':''}">${d<0?`${-d}d late`:d===0?'Due today':`Due in ${d}d`}</span></div>
    <details class="jmore" data-js="${o.rno}"><summary class="btn sm">Measurements & style</summary>${jHas(o.meas)||jHas(p.m)?`<div class="jwrap jro" style="margin-top:10px"></div>${jStylesHtml(jHas(o.meas)?o.meas:p.m)}`:''}<div class="jb"${jHas(o.meas)||jHas(p.m)?' hidden':''}><div><p class="h4">Measurements · ${esc(p.name)}</p>${mShow(p.m)}</div>
     <div><p class="h4">Style</p><div class="dopts" style="padding:0;grid-template-columns:repeat(auto-fill,minmax(96px,1fr))">${DESIGN_.map(g=>{const op=g.opts.find(x=>x[0]===o.design[g.k]);return `<div class="dopt" style="cursor:default">${glyph(g.k,op[0])}<span>${op[1]}</span><em>${g.t}</em></div>`}).join('')}</div></div></div></details>
    <div class="jf">${k==='sew'&&atTailor(o)?tailorBack(o):`<button class="btn pri" data-step="${o.rno}" data-k="${k}">${taskBtn(o,k)}</button>`}<button class="btn" data-r="${o.rno}">Open details</button></div></div>`}).join('')||'<div class="panel"><div class="empty">Nothing waiting for you right now.</div></div>'}`);
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
   ${js.map(o=>{const wid=t.k==='sew'?o.tailor:o.tw[t.k];return `<div class="job ${late(o)?'late':''}"><div class="t"><span class="rid">#${o.rno}</span><span style="display:flex;gap:4px">${o.hinge&&t.k!=='hinge'?'<span class="tag" title="Needs hinge">H</span>':''}${o.tatreez&&t.k!=='tat'?'<span class="tag" title="Needs tatreez">T</span>':''}<span class="tag">${BRANCHES.find(b=>b.id===o.branch).code}</span></span></div>
    <b style="font-size:13px">${pl(o.qty,'thobe')} · ${o.fabric}</b><div class="m">${wid?wk(wid).name:'Not assigned'} · due ${fmtD(o.due)}</div>
    ${t.k==='sew'||t.k==='cut'?`<div class="mm">${mmLine(o,['tool','sadr','kom','raqba'])}</div>`:''}
    <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">${taskPill(o,t.k)}${canTask()?`<button class="btn sm pri" data-mv="${o.rno}" data-k="${t.k}">${o.t[t.k]==='wait'?'Start':'Finish'}</button>`:''}<button class="btn sm" data-r="${o.rno}">Details</button></div></div>`}).join('')||'<div class="muted" style="font-size:12.5px;padding:6px">Empty</div>'}</div></div>`}).join('')}${FLOW_OPT.tready?(()=>{const js=list.filter(atTailor).sort((a,b)=>a.due-b.due);return `<div class="col"><h3>Back at tailor · Ready<span class="num">${js.reduce((s,o)=>s+o.qty,0)}</span></h3><div class="cards2">${js.map(o=>`<div class="job ${late(o)?'late':''}"><div class="t"><span class="rid">#${o.rno}</span><span class="tag">${(BRANCHES.find(b=>b.id===o.branch)||{code:''}).code}</span></div>
    <b style="font-size:13px">${pl(o.qty,'thobe')} · ${esc(o.fabric||'')}</b><div class="m">${esc(wk(o.tailor).name)} · due ${fmtD(o.due)}</div>
    <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">${TASKS.filter(t=>t.m==='send'&&needs(o,t.k)).map(t=>{const v=tv(o,t.k);return `<span class="pill ${v==='done'?'s-ready':v==='doing'||isSent(o,t.k)?'s-cut':'s-wait'}">${t.t}: ${v==='done'?'done':v==='doing'?'working':isSent(o,t.k)?'sent':'not sent'}</span>`}).join('')}${allStepsDone(o)?'<span class="pill s-ready">Waiting for tailor\'s Ready</span>':''}<button class="btn sm" data-r="${o.rno}">Details</button></div></div>`).join('')||'<div class="muted" style="font-size:12.5px;padding:6px">Empty</div>'}</div></div>`})():''}</div>`);
  document.querySelectorAll('[data-mv]').forEach(b=>b.onclick=()=>{const o=orders.find(x=>x.rno===+b.dataset.mv);stepTask(o,b.dataset.k);route()});
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
  $('bSave').onclick=()=>{const n=$('bName').value.trim(),c=$('bCode').value.trim().toUpperCase();if(!n||!c){toast('Enter a name and short code');return}
    const t=b||{id:Math.max(...BRANCHES.map(x=>x.id))+1};Object.assign(t,{name:n,code:c,city:$('bCity').value,phone:$('bPhone').value,address:$('bAddr').value,hours:$('bHours').value,opened:new Date($('bOpen').value||today),type:$('bType').value,capacity:+$('bCap').value||0});
    let made=0;if(!b){BRANCHES.push(t);const fac=t.type==='factory';
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
   <p class="sub" style="font-size:12px;margin:0">Demo preview. The Install button works on the real saudithobe.men site; inside this preview it only shows the steps.</p>
  </div>`;
  document.body.appendChild(el);
  const close=()=>el.remove();
  document.getElementById('ipClose').onclick=close;
  document.getElementById('ipInstall').onclick=()=>toast('On the real site this opens the browser\'s Install window');
  const go=document.getElementById('ipGo');if(go)go.onclick=()=>{const p=document.getElementById('ipPin').value;if(!/^\d{4}$/.test(p)){toast('Enter a 4-digit PIN');return}close();document.getElementById('layer').innerHTML='';const L=document.getElementById('login');if(L)L.remove();if(w)enterWorker(w);else enterAs(r,ui>=0?ui:undefined)};
}

/* ================= One app per worker ================= */
const wslug=w=>`${(BRANCHES.find(b=>b.id===w.branch)||{code:'st'}).code.toLowerCase()}-${w.id}-${w.name.split(' ')[0].toLowerCase().replace(/[^a-z]/g,'')}`;
const wLink=w=>`https://${DOMAIN}/app/${wslug(w)}`;
const wRoleKey=w=>({'Branch manager':'manager',Cashier:'cashier','Factory supervisor':'tailor'}[w.role])||(ROLE2TASK[w.role]?'tailor':'tailor');
function workerApp(w,fresh){
  const msg=`Assalamu alaikum ${w.name.split(' ')[0]},\nThis is your own Saudi Thobe app (${w.role}, ${bname(w.branch)}):\n${wLink(w)}\nOpen it, set your PIN, then tap Install. It is only for you.`;
  drawer(fresh?`${w.name} added`:`${w.name} · app`,`<div class="muted" style="font-size:13px">${w.role} · ${bname(w.branch)}</div>`,
   `<div class="msg" style="border-color:var(--brass)">Every worker gets <b>his own app</b>. It installs as <b>"ST · ${esc(w.name.split(' ')[0])}"</b> and opens straight into his ${ROLE2TASK[w.role]?TK[ROLE2TASK[w.role]].t.toLowerCase()+' job cards':'work'}. Two workers can install their apps on the same phone or PC: each shows up as a separate icon, never "already installed".</div>
    <div class="lk"><div class="qr" id="qr_w"></div><div style="min-width:0"><b>Personal app link</b><span class="muted" style="font-size:12px">Only for ${esc(w.name)}</span><span class="url">${wLink(w)}</span>
     <div class="acts"><button class="btn sm" id="wcp">Copy link</button><button class="btn sm" id="wwa">${ico('wa')}Copy WhatsApp message</button><button class="btn sm pri" id="wpv">Preview</button></div></div></div>
    <div><p class="h4">Same phone, two workers</p><div class="applike" style="background:var(--ground);color:var(--text)">${[w,...workers.filter(x=>x!==w&&x.branch===w.branch).slice(0,2)].map(x=>`<div style="display:flex;flex-direction:column;align-items:center;gap:4px;width:74px;text-align:center"><div class="appico" style="width:46px;height:46px;font-size:14px">${initials(x.name)}</div><span style="font-size:11px">ST · ${esc(x.name.split(' ')[0])}</span></div>`).join('')}</div>
     <p class="muted" style="font-size:12px;margin:6px 0 0">Each app keeps its own login, so one worker can't open the other's job cards.</p></div>`,
   `${isOwner()?`<button class="btn" id="wreset">Reset PIN</button>`:''}`);
  qrInto(document.getElementById('qr_w'),wLink(w));
  const cp=(t,ok)=>navigator.clipboard.writeText(t).then(()=>toast(ok),()=>toast('Copy blocked here. Select the link and copy it'));
  document.getElementById('wcp').onclick=()=>cp(wLink(w),'Link copied');
  document.getElementById('wwa').onclick=()=>cp(msg,'Message copied, paste it in WhatsApp');
  document.getElementById('wpv').onclick=()=>installScreen(null,null,w);
  const rs=document.getElementById('wreset');if(rs)rs.onclick=()=>toast(`${w.name} will set a new PIN next time he opens his app`);
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
  document.querySelectorAll('[data-tc]').forEach(r=>r.onclick=()=>{selCust=+r.dataset.tc;location.hash='customers'});
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
   ${USERS.map((u,i)=>{const a=ACCESS[u.role];return `<div class="row"><div class="avatar">${a.no}</div><div class="grow"><b>${u.name}</b><span>${a.label} · ${u.branch?bname(u.branch):'All branches'}</span></div><button class="btn sm" data-try="${i}">Try it</button></div>`}).join('')}
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
document.addEventListener('click',e=>{const t=e.target.closest('[data-try]');if(t){const u=USERS[+t.dataset.try];enterAs(u.role,+t.dataset.try)}});
document.getElementById('switchRole').onclick=showLogin;
document.getElementById('bellBtn').onclick=bellList;
document.getElementById('installBtn').onclick=()=>installScreen(null,ROLE);
document.getElementById('branchSel').onchange=e=>{curBranch=+e.target.value;route()};
document.getElementById('q').addEventListener('input',()=>{const h=(location.hash||'#dashboard').slice(1);
  if(h==='customers')customersView();else if(h==='measurements')measurements();else if(h==='workers')workersView();else if(can('orders')){if(h!=='orders'){location.hash='orders';return}ordersView()}});
document.getElementById('themeBtn').onclick=()=>{const r=document.documentElement;const dark=r.dataset.theme?r.dataset.theme==='dark':matchMedia('(prefers-color-scheme: dark)').matches;r.dataset.theme=dark?'light':'dark'};
document.addEventListener('keydown',e=>{if(e.key==='Escape')document.getElementById('layer').innerHTML=''});
addEventListener('hashchange',()=>{document.getElementById('layer').innerHTML='';route()});
route();showLogin();
})();
</script>
