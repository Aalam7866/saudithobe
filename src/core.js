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
/* workshop tasks: cutting first, tailor after cutting, hinge + tatreez start as soon as the tailor starts, ironing after the tailor */
const TASKS=[
 {k:'cut',t:'Cutting',role:'Cutter',avail:o=>true},
 {k:'sew',t:'Tailor',role:'Tailor',avail:o=>o.t.cut==='done'},
 {k:'hinge',t:'Hinge',role:'Hinge',avail:o=>o.hinge&&o.t.sew!=='wait'},
 {k:'tat',t:'Tatreez',role:'Tatreez',avail:o=>o.tatreez&&o.t.sew!=='wait'},
 {k:'iron',t:'Ironing',role:'Ironing',avail:o=>o.t.sew==='done'}];
const TK=Object.fromEntries(TASKS.map(t=>[t.k,t]));const ROLE2TASK={Cutter:'cut',Tailor:'sew',Hinge:'hinge',Tatreez:'tat',Ironing:'iron'};
const WORKSHOP_ROLES=['Tailor','Cutter','Hinge','Tatreez','Ironing'];
function syncSt(o){if(o.st==='done')return;o.st=o.t.sew==='done'?'ready':o.t.cut==='done'?'sew':'cut'}
const pending=(o,k)=>o.st!=='done'&&TK[k].avail(o)&&o.t[k]!=='done'&&!(k==='tat'&&!o.tatreez)&&!(k==='hinge'&&!o.hinge);
const SI=Object.fromEntries(STAGES.map((s,i)=>[s.k,i]));
const FABRICS=['Toyobo (Japan)','Shakespeare (UK)','Loriana','Korean summer','Daniel Hechter','Egyptian cotton'];
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
const ROLES=['Tailor','Cutter','Hinge','Tatreez','Ironing','Cashier','Branch manager','Factory supervisor'];

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
  if(x!=='done')o.st='cut';syncSt(o);delete o.ost});
const notices=[];
function notifyReady(o,silent){const n={id:notices.length+1,rno:o.rno,branch:o.branch,made:o.made,tailor:o.tailor,qty:o.qty,at:new Date(),seen:{},open:['hinge','tat'].filter(k=>pending(o,k)).map(k=>TK[k].t)};notices.push(n);if(!silent)showPopups()}
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
const delLog=[],prodLog=[];
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
  if(cur==='wait'){o.t[k]='doing';toast(`#${o.rno}: ${TK[k].t} started${k==='sew'&&(o.hinge||o.tatreez)?' · now showing in '+[o.hinge?'Hinge':'',o.tatreez?'Tatreez':''].filter(Boolean).join(' and '):''}`)}
  else{o.t[k]='done';const wid=k==='sew'?o.tailor:o.tw[k];if(wid)prodLog.push({d:today,w:wid,made:o.made,stage:k,qty:o.qty,rno:o.rno});
    if(k==='sew'){const t=wk(o.tailor);t.mdone=(t.mdone||0)+o.qty}
    toast(`#${o.rno}: ${TK[k].t} finished${k==='cut'?' · sent to the tailor':k==='sew'?' · owner and '+bname(o.branch)+' manager notified':''}`)}
  const before=o.st;syncSt(o);if(before!=='ready'&&o.st==='ready')notifyReady(o)}
const taskBtn=(o,k)=>o.t[k]==='wait'?`Start ${TK[k].t.toLowerCase()}`:`Finish ${TK[k].t.toLowerCase()}`;
const taskPill=(o,k)=>{const v=o.t[k];if((k==='tat'&&!o.tatreez)||(k==='hinge'&&!o.hinge))return '<span class="pill s-done">Not needed</span>';if(v==='done')return '<span class="pill s-ready">Done</span>';if(v==='doing')return '<span class="pill s-cut">In progress</span>';return TK[k].avail(o)?'<span class="pill s-new">Waiting</span>':'<span class="pill s-done">Not yet</span>'};
const canTask=()=>RA().stage;

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
   pages:['mywork','board','daily','workers'],tabs:['mywork','board','daily','workers'],
   can:['His own job cards with measurements','Board: cutting, tailor, hinge, tatreez','Factory adds tailors, cutters, hinge, tatreez','Factory daily production report','Move thobes to the next stage','His target and commission this month']}};
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
  ({dashboard,daily,orders:ordersView,new:newOrder,measurements,customers:customersView,payments,workers:workersView,branches,reports,settings,till,mywork,board})[r.h]();
  if(ROLE!=='owner'){const a=RA();document.getElementById('view').insertAdjacentHTML('afterbegin',`<div class="rolebar">${ico(a.icon)}<span>Signed in as <b>${a.name}</b> · ${a.label}${a.branch?' · '+bname(a.branch):''}. ${a.lock?'Locked to this '+(isFac(a.branch)?'factory':'branch')+'.':''} ${a.money?'':'Prices and cash are hidden for this login.'}</span></div>`);document.querySelectorAll('.rolebar svg').forEach(x=>{x.style.width='18px';x.style.color='var(--brass)'})}
  window.scrollTo(0,0);
}
const V=html=>document.getElementById('view').innerHTML=html;
const demoNote='<div class="demo"><span class="tag">Demo data</span> Everything here is sample data for review. It will be replaced by the shop\'s real database once connected.</div>';

/* ================= Dashboard ================= */
function revSeries(list,days){const r=[];for(let i=days-1;i>=0;i--){const d=addD(today,-i);r.push({d,v:list.filter(o=>+o.created===+d).reduce((s,o)=>s+o.paid,0)})}return r}
function dashboard(){
  const all=O(),active=all.filter(o=>o.st!=='done'),ready=all.filter(o=>o.st==='ready');
  const due=all.reduce((s,o)=>s+(o.total-o.paid),0);
  const rev=revSeries(all,14);
  const wkv=rev.slice(7).reduce((s,x)=>s+x.v,0),pw=rev.slice(0,7).reduce((s,x)=>s+x.v,0);
  const PIPE=[...TASKS.map(t=>({k:t.k,t:t.t,n:all.filter(o=>pending(o,t.k)).reduce((s,o)=>s+o.qty,0)})),{k:'ready',t:'Ready for pickup',n:all.filter(o=>o.st==='ready').reduce((s,o)=>s+o.qty,0)}];const mx=Math.max(...PIPE.map(p=>p.n));
  const soon=active.filter(o=>o.st!=='ready').sort((a,b)=>a.due-b.due).slice(0,7);
  V(`${demoNote}
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
function ordersView(){
  const q=document.getElementById('q').value.trim().toLowerCase();const all=O();
  const fl=all.filter(o=>(orderFilter==='all'||(orderFilter==='late'?late(o):o.st===orderFilter))&&(!q||String(o.rno).includes(q)||cust(o.cid).name.toLowerCase().includes(q)||cust(o.cid).phone.includes(q)));
  const chip=(k,t,n)=>`<button class="chip ${orderFilter===k?'on':''}" data-f="${k}">${t}<span class="num">${n}</span></button>`;
  V(`<div class="chips">${chip('all','All',all.length)}${chip('late','Overdue',all.filter(late).length)}${STAGES.map(s=>chip(s.k,s.t,all.filter(o=>o.st===s.k).length)).join('')}</div>
  <div class="panel"><div class="tbl-wrap"><table>
   <thead><tr><th>Receipt</th><th>Customer</th>${curBranch?'':'<th>Branch</th>'}<th>Qty</th><th>Fabric</th><th>Tailor</th><th>Made at</th><th>Pickup</th><th>Total</th><th>Balance</th><th>Status</th></tr></thead>
   <tbody>${fl.map(o=>{const c=cust(o.cid),rem=o.total-o.paid;return `<tr class="click" data-r="${o.rno}">
    <td><span class="rid">#${o.rno}</span></td><td class="who"><b>${c.name}</b><span>${c.phone}</span></td>${curBranch?'':`<td>${bTag(o.branch)} ${bname(o.branch)}</td>`}
    <td class="num">${o.qty}</td><td>${o.fabric}</td><td>${wk(o.tailor).name}</td><td>${isFac(o.made)?bTag(o.made)+' Factory':'Shop'}</td><td class="num">${fmtD(o.due)}</td>
    <td class="num">${sar(o.total)}</td><td class="num" style="color:${rem?'var(--bad)':'var(--ok)'}">${rem?sar(rem):'Paid'}</td><td>${pill(o)}</td></tr>`}).join('')}</tbody>
  </table></div>${fl.length?'':'<div class="empty">No orders match this filter.</div>'}</div>`);
  document.querySelectorAll('.chip').forEach(b=>b.onclick=()=>{orderFilter=b.dataset.f;ordersView()});
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
    <div><p class="h4">Style</p><div class="kv">${DESIGN_.map(g=>`<div><span>${g.t}</span><b style="font-family:var(--f-body);font-size:13px">${g.opts.find(x=>x[0]===o.design[g.k])[1]}</b></div>`).join('')}<div><span>Fabric</span><b style="font-family:var(--f-body);font-size:13px">${o.fabric}</b></div></div></div>
    <div><p class="h4">Measurements · ${esc(prof.name)}</p>${mShow(prof.m)}</div>
    ${o.note?`<div><p class="h4">Note</p><div class="msg" style="border-color:var(--brass)">${esc(o.note)}</div></div>`:''}
    ${RA().money?`<div><p class="h4">WhatsApp message</p><div class="msg" id="wamsg">${esc(waText(o))}</div></div>`:''}`,
   `${o.st==='ready'&&RA().pay&&!rem?`<button class="btn pri" id="handBtn">Hand over to customer</button>`:''}${rem&&RA().pay?`<button class="btn" id="payBtn">${ico('cash')}Record ${sar(rem)} SAR</button>`:''}${RA().money?`<button class="btn" id="waBtn">${ico('wa')}Copy message</button>`:''}`);
  document.querySelectorAll('[data-tk]').forEach(b=>b.onclick=()=>{stepTask(o,b.dataset.tk);route();openOrder(rno)});
  const hb=document.getElementById('handBtn');if(hb)hb.onclick=()=>{delLog.push({d:today,rno:o.rno,branch:o.branch,qty:o.qty,amt:0});o.st='done';toast(`#${o.rno} handed over`);route();openOrder(rno)};
  const pay=document.getElementById('payBtn');if(pay)pay.onclick=()=>{if(o.st==='ready'){o.st='done';delLog.push({d:today,rno:o.rno,branch:o.branch,qty:o.qty,amt:rem})}payLog.push({d:today,rno:o.rno,branch:o.branch,amt:rem,m:'Cash',t:'Balance'});o.paid=o.total;toast(`Payment of ${sar(rem)} SAR recorded`);route();openOrder(rno)};
  const wb=document.getElementById('waBtn');if(wb)wb.onclick=()=>copyEl('wamsg',waText(o));
}
function copyEl(id,t){navigator.clipboard.writeText(t).then(()=>toast('Copied'),()=>{const r=document.createRange();r.selectNodeContents(document.getElementById(id));getSelection().removeAllRanges();getSelection().addRange(r);toast('Text selected, copy it now')})}

/* ================= New order ================= */
let draft;
function newOrder(){
  draft={design:Object.fromEntries(DESIGN_.map(g=>[g.k,g.opts[0][0]])),tab:'qalab'};
  const due0=addD(today,10);const nextR=Math.max(...orders.map(o=>o.rno))+1;
  const br=curBranch&&!isFac(curBranch)?curBranch:1;
  V(`<div class="form">
   <div class="sec">
    <div class="panel"><div class="panel-h"><h2>Customer</h2></div><div class="panel-b"><div class="fgrid">
      <div class="field" style="grid-column:span 2"><label for="fCust">Existing customer</label><select id="fCust"><option value="">New customer</option>${customers.map(c=>`<option value="${c.id}">${c.name} · ${c.phone}</option>`).join('')}</select></div>
      <div class="field"><label for="fProf">Measurement profile</label><select id="fProf"><option value="0">Self</option></select></div>
      <div class="field"><label for="fName">Name</label><input id="fName" placeholder="Customer name"></div>
      <div class="field"><label for="fPhone">Mobile</label><input id="fPhone" class="num" placeholder="05xxxxxxxx"></div>
      <div class="field"><label for="fBranch">Branch</label><select id="fBranch">${SHOPS().map(b=>`<option value="${b.id}" ${b.id===br?'selected':''}>${b.name} · ${b.city}</option>`).join('')}</select></div>
    </div></div></div>
    <div class="panel"><div class="panel-h"><h2>Measurements</h2><span class="sp"></span><span class="muted" style="font-size:12px">The shop's measurement sheet · filled in from the customer's saved profile</span></div>
     <div class="panel-b" style="display:flex;flex-direction:column;gap:14px">${mForm('m_',{})}</div></div>
    <div class="panel"><div class="panel-h"><h2>Style</h2><span class="sp"></span><span class="muted" style="font-size:12px" id="dsum"></span></div>
     <div class="dtabs" id="dtabs"></div><div class="dopts" id="dopts"></div></div>
    <div class="panel"><div class="panel-h"><h2>Order & payment</h2></div><div class="panel-b"><div class="fgrid">
      <div class="field"><label for="fQty">Thobes</label><input id="fQty" type="number" min="1" value="2" class="num"></div>
      <div class="field"><label for="fPrice">Price per thobe (SAR)</label><input id="fPrice" type="number" min="0" value="260" class="num"></div>
      <div class="field"><label for="fPaid">Deposit (SAR)</label><input id="fPaid" type="number" min="0" value="200" class="num"></div>
      <div class="field"><label for="fFabric">Fabric</label><select id="fFabric">${FABRICS.map(f=>`<option>${f}</option>`).join('')}</select></div>
      <div class="field"><label for="fMade">Stitch at</label><select id="fMade"></select></div>
      <div class="field"><label for="fTailor">Tailor</label><select id="fTailor"></select></div>
      <div class="field"><label for="fDue">Pickup date</label><input id="fDue" type="date" value="${due0.toISOString().slice(0,10)}"></div>
      <div class="field" style="grid-column:1/-1;flex-direction:row;align-items:center;gap:8px"><input type="checkbox" id="fHinge" style="width:auto"><label for="fHinge" style="color:var(--text);margin-inline-end:18px">Needs Hinge</label><input type="checkbox" id="fTat" style="width:auto"><label for="fTat" style="color:var(--text)">Needs Tatreez (embroidery)</label></div>
      <div class="field" style="grid-column:1/-1"><label for="fNote">Notes</label><textarea id="fNote" rows="2" placeholder="e.g. embroider name, sleeve 1 cm longer"></textarea></div>
    </div></div></div>
   </div>
   <aside class="slip"><div class="head"><b>New receipt</b><span class="num">#${nextR}</span></div>
    <dl id="slipdl"></dl>
    <div class="tot"><div><span class="muted">Total</span><span class="num" id="tTot"></span></div><div><span class="muted">Deposit</span><span class="num" id="tPaid"></span></div><div class="big"><span>Balance</span><span class="num" id="tRem"></span></div></div>
    <div class="act"><button class="btn pri" id="saveBtn">Save order and issue receipt</button><a class="btn" href="#orders">Cancel</a></div>
   </aside></div>`);
  const $=id=>document.getElementById(id);
  const fillMade=()=>{const b=+$('fBranch').value;const keep=$('fMade').value;$('fMade').innerHTML=`<option value="${b}">${bname(b)} workshop</option>`+FACS().map(f=>`<option value="${f.id}">${f.name}</option>`).join('');$('fMade').value=keep&&[...$('fMade').options].some(x=>x.value===keep)?keep:String((FACS()[0]||{id:b}).id)};
  const fillTailors=()=>{$('fTailor').innerHTML=tailorsOf(+$('fMade').value).map(w=>`<option value="${w.id}">${w.name}${w.status==='leave'?' (on leave)':''}</option>`).join('')};
  const drawDesign=()=>{
    $('dtabs').innerHTML=DESIGN_.map(g=>`<button class="dtab ${draft.tab===g.k?'on':''}" data-t="${g.k}">${g.t}<small>${g.ar}</small></button>`).join('');
    const g=DESIGN_.find(x=>x.k===draft.tab);
    $('dopts').innerHTML=g.opts.map(([k,t])=>`<button class="dopt ${draft.design[g.k]===k?'on':''}" data-o="${k}" aria-pressed="${draft.design[g.k]===k}">${glyph(g.k,k)}<span>${t}</span></button>`).join('');
    $('dsum').textContent=DESIGN_.map(g=>g.opts.find(o=>o[0]===draft.design[g.k])[1]).join(' · ');
    document.querySelectorAll('.dtab').forEach(b=>b.onclick=()=>{draft.tab=b.dataset.t;drawDesign()});
    document.querySelectorAll('.dopt').forEach(b=>b.onclick=()=>{draft.design[draft.tab]=b.dataset.o;drawDesign();slip()});
  };
  const slip=()=>{
    const qty=+$('fQty').value||0,price=+$('fPrice').value||0,paid=+$('fPaid').value||0,tot=qty*price;
    const c=$('fCust').value?cust(+$('fCust').value):null;const t=wk(+$('fTailor').value);
    $('slipdl').innerHTML=[['Customer',c?c.name:($('fName').value||'—')],['Branch',bname(+$('fBranch').value)],['Stitch at',isFac(+$('fMade').value)?bname(+$('fMade').value):'Shop workshop'],['Thobes',`${qty} × ${sar(price)}`],['Fabric',$('fFabric').value],['Tailor',t?t.name:'—'],['Pickup',$('fDue').value?fmtD(new Date($('fDue').value)):'—'],
      ...DESIGN_.map(g=>[g.t,g.opts.find(o=>o[0]===draft.design[g.k])[1]])].map(([a,b])=>`<div><dt>${a}</dt><dd>${esc(b)}</dd></div>`).join('');
    if(!$('tTot'))return;$('tTot').textContent=sar(tot)+' SAR';$('tPaid').textContent=sar(paid)+' SAR';$('tRem').textContent=sar(Math.max(0,tot-paid))+' SAR';
  };
  const fillM=()=>{const c=$('fCust').value?cust(+$('fCust').value):null;const p=c?c.profiles[+$('fProf').value]||c.profiles[0]:null;mFill('m_',p?p.m:{})};
  $('fCust').onchange=()=>{const c=$('fCust').value?cust(+$('fCust').value):null;$('fName').value=c?c.name:'';$('fPhone').value=c?c.phone:'';
    $('fProf').innerHTML=(c?c.profiles:[{name:'Self'}]).map((p,i)=>`<option value="${i}">${p.name}</option>`).join('');if(c){$('fBranch').value=c.branch;fillMade();fillTailors()}fillM();slip()};
  $('fProf').onchange=fillM;
  $('fBranch').onchange=()=>{fillMade();fillTailors();slip()};
  $('fMade').onchange=()=>{fillTailors();slip()};
  ['fQty','fPrice','fPaid','fFabric','fTailor','fDue','fName'].forEach(id=>$(id).oninput=slip);
  $('saveBtn').onclick=()=>{
    let cid=+$('fCust').value;
    if(!cid){if(!$('fName').value.trim()||!$('fPhone').value.trim()){toast('Enter the customer name and mobile number');$('fName').focus();return}
      const m=mRead('m_');cid=customers.length+1;customers.push({id:cid,name:$('fName').value.trim(),phone:$('fPhone').value.trim(),branch:+$('fBranch').value,profiles:[{name:'Self',m}],hist:[{d:today,t:'First measurement taken',by:'Admin'}]})}
    const qty=+$('fQty').value||1,price=+$('fPrice').value||0;
    const dep=+$('fPaid').value||0;if(RA().money&&dep)payLog.push({d:today,rno:nextR,branch:+$('fBranch').value,amt:dep,m:'Cash',t:'Deposit'});
    orders.unshift({rno:nextR,cid,branch:+$('fBranch').value,made:+$('fMade').value,qty,price,total:qty*price,paid:RA().money?(+$('fPaid').value||0):0,created:new Date(today),due:new Date($('fDue').value||due0),st:'cut',t:{cut:'wait',sew:'wait',hinge:'wait',tat:'wait',iron:'wait'},tw:{},tatreez:$('fTat').checked,hinge:$('fHinge').checked,tailor:+$('fTailor').value,fabric:$('fFabric').value,design:{...draft.design},profile:+$('fProf').value||0,note:$('fNote').value});
    toast(`${RA().money?`Receipt #${nextR} saved`:`Order #${nextR} sent to the cashier`} · now in ${bname(+$('fMade').value)} cutting`);orderFilter='all';if(can('orders')){location.hash='orders';setTimeout(()=>openOrder(nextR),50)}else{location.hash=RA().home}
  };
  fillMade();fillTailors();drawDesign();slip();mTicks();
  if(!RA().money){['fPrice','fPaid'].forEach(id=>$(id).closest('.field').hidden=true);document.querySelector('.slip .tot').innerHTML='<div class="muted" style="font-size:13px">Prices and deposit are added by the cashier.</div>';$('saveBtn').textContent='Save order and send to cashier'}
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
function measurements(){
  const q=document.getElementById('q').value.trim().toLowerCase();
  const list=customers.filter(c=>(!curBranch||c.branch===curBranch)&&(!q||c.name.toLowerCase().includes(q)||c.phone.includes(q)));
  if(!list.find(c=>c.id===selCust)){selCust=list[0]?list[0].id:0;selProf=0}
  const c=cust(selCust);
  if(!c){V(`${demoNote}<div class="panel"><div class="empty">No customers in this branch yet.</div></div>`);return}
  const p=c.profiles[selProf]||c.profiles[0];
  const last=orders.filter(o=>o.cid===c.id);
  V(`<div class="mlay">
   <div class="panel"><div class="panel-h"><h2>Customers</h2><span class="sp"></span><span class="muted num" style="font-size:12px">${list.length}</span></div>
    <div class="clist">${list.map(x=>`<button class="crow ${x.id===c.id?'on':''}" data-c="${x.id}"><div class="ini">${initials(x.name)}</div><div class="grow"><b>${x.name}</b><span>${x.phone} · ${pl(x.profiles.length,'profile')}</span></div></button>`).join('')}</div></div>
   <div class="sec">
    <div class="panel">
     <div class="panel-h" style="flex-wrap:wrap"><div><h2 style="font-size:18px;font-family:var(--f-display);font-weight:600">${c.name}</h2><span class="muted num" style="font-size:12.5px">${c.phone} · ${bname(c.branch)} branch · ${pl(last.length,'order')}${c.book?` · <span dir="rtl">دفتر ${esc(c.book)}</span>`:''}</span></div><span class="sp"></span>
      <button class="btn sm" id="newOrdBtn">${ico('plus')}New order with these</button></div>
     <div class="panel-b" style="display:flex;flex-direction:column;gap:16px">
      <div class="ptabs">${c.profiles.map((x,i)=>`<button class="chip ${i===selProf?'on':''}" data-p="${i}">${x.name}</button>`).join('')}<button class="chip" id="addProf">+ Add profile</button></div>
      <div class="mbody" style="grid-template-columns:minmax(0,1fr)">
       <div style="display:flex;flex-direction:column;gap:14px;min-width:0">
        ${mForm('mm_',p.m)}
        <div class="field"><label for="mNote">Fitting notes</label><textarea id="mNote" rows="2" placeholder="e.g. likes a loose fit at the chest, right shoulder 1 cm lower">${p.note||''}</textarea></div>
        <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn pri" id="mSave">Save measurements</button><button class="btn" id="mReset">Undo changes</button></div>
       </div>
      </div>
     </div>
    </div>
    <div class="grid2">
     <div class="panel"><div class="panel-h"><h2>Measurement history</h2></div><div class="panel-b"><div class="hist">${c.hist.map(h=>`<div><time>${fmtD(h.d)}</time><span style="flex:1">${esc(h.t)}</span><span class="muted">${esc(h.by)}</span></div>`).join('')}</div></div></div>
     <div class="panel"><div class="panel-h"><h2>Recent orders</h2></div><div class="rows">${last.slice(0,4).map(o=>`<div class="row" data-r="${o.rno}" style="cursor:pointer"><span class="rid">#${o.rno}</span><div class="grow"><b>${pl(o.qty,'thobe')} · ${o.fabric}</b><span>${fmtD(o.created)}</span></div>${pill(o)}</div>`).join('')||'<div class="empty">No orders yet.</div>'}</div></div>
    </div>
   </div></div>`);
  document.querySelectorAll('.crow').forEach(b=>b.onclick=()=>{selCust=+b.dataset.c;selProf=0;measurements()});
  document.querySelectorAll('[data-p]').forEach(b=>b.onclick=()=>{selProf=+b.dataset.p;measurements()});
  mTicks();
  document.querySelectorAll('.meas input:not([type=checkbox]),.meas textarea').forEach(inp=>inp.oninput=()=>{const ch=inp.value.trim()!==mVal(p.m,inp.dataset.k);inp.style.borderColor=ch?'var(--warn)':'';inp.style.background=ch?'var(--warn-bg)':''});
  document.getElementById('mReset').onclick=()=>measurements();
  document.getElementById('mSave').onclick=()=>{const nm=mRead('mm_'),ch=[];MALL.forEach(([k,t,ty])=>{const a=mVal(p.m,k),b=nm[k]||'';if(a!==b)ch.push(ty==='tick'?(b?`✓ ${t}`:`✗ ${t}`):`${t} ${a||'—'} → ${b||'—'}`)});p.m=nm;p.note=document.getElementById('mNote').value;
    if(ch.length)c.hist.unshift({d:today,t:(p.name==='Self'?'':p.name+': ')+ch.join(', '),by:'Admin'});toast(ch.length?`Saved ${pl(ch.length,'change')}`:'No changes to save');measurements()};
  document.getElementById('addProf').onclick=()=>{
    const close=drawer('New measurement profile',`<div class="muted" style="font-size:13px">${c.name}</div>`,
     `<div class="field"><label for="npName">Profile name</label><input id="npName" placeholder="e.g. Son · Fahad, Winter thobe"></div>
      <div class="field"><label for="npCopy">Start from</label><select id="npCopy"><option value="-1">Empty</option>${c.profiles.map((x,i)=>`<option value="${i}">${x.name}</option>`).join('')}</select></div>`,
     `<button class="btn pri" id="npSave">Create profile</button>`);
    document.getElementById('npSave').onclick=()=>{const n=document.getElementById('npName').value.trim();if(!n){toast('Give the profile a name');return}const src=+document.getElementById('npCopy').value;
      c.profiles.push({name:n,m:src>=0?{...c.profiles[src].m}:{}});selProf=c.profiles.length-1;close();toast(`Profile "${n}" added`);measurements()};
  };
  document.getElementById('newOrdBtn').onclick=()=>{location.hash='new';setTimeout(()=>{const s=document.getElementById('fCust');s.value=c.id;s.onchange();const pp=document.getElementById('fProf');pp.value=selProf;pp.onchange()},30)};
  bindRows();
}

/* ================= Customers ================= */
function customersView(){
  const q=document.getElementById('q').value.trim().toLowerCase();
  const list=customers.filter(c=>(!curBranch||c.branch===curBranch)&&(!q||c.name.toLowerCase().includes(q)||c.phone.includes(q))).map(c=>{const os=orders.filter(o=>o.cid===c.id);return{c,n:os.length,spent:os.reduce((s,o)=>s+o.paid,0),due:os.reduce((s,o)=>s+o.total-o.paid,0),last:os[0]}}).sort((a,b)=>b.spent-a.spent);
  V(`<div class="panel"><div class="panel-h"><h2>${pl(list.length,'customer')}</h2><span class="sp"></span><span class="muted" style="font-size:12px">Sorted by total spent · tap a row for measurements</span></div><div class="tbl-wrap"><table>
   <thead><tr><th>Customer</th><th>Home branch</th><th>Orders</th>${RA().money?'<th>Total paid</th><th>Balance</th>':''}<th>Profiles</th><th>Last order</th></tr></thead>
   <tbody>${list.map(x=>`<tr class="click" data-c="${x.c.id}"><td class="who"><b>${x.c.name}</b><span>${x.c.phone}</span></td><td>${bTag(x.c.branch)} ${bname(x.c.branch)}</td><td class="num">${x.n}</td>${RA().money?`<td class="num">${sar(x.spent)}</td>
    <td class="num" style="color:${x.due?'var(--bad)':'var(--muted)'}">${x.due?sar(x.due):'—'}</td>`:''}<td>${x.c.profiles.map(p=>p.name).join(', ')}</td><td>${x.last?`<span class="rid">#${x.last.rno}</span> ${pill(x.last)}`:'—'}</td></tr>`).join('')}</tbody></table></div></div>`);
  document.querySelectorAll('tr[data-c]').forEach(r=>r.onclick=()=>{selCust=+r.dataset.c;selProf=0;location.hash='measurements'});
}

/* ================= Payments ================= */
function payments(){
  const all=O();const open=all.filter(o=>o.total>o.paid).sort((a,b)=>(b.total-b.paid)-(a.total-a.paid));
  const coll=all.reduce((s,o)=>s+o.paid,0),due=open.reduce((s,o)=>s+o.total-o.paid,0),readyDue=open.filter(o=>o.st==='ready').reduce((s,o)=>s+o.total-o.paid,0);
  V(`<div class="kpis" style="grid-template-columns:repeat(3,minmax(0,1fr))">
    <div class="kpi"><span class="l">Collected (last 40 days)</span><span class="v">${sar(coll)}<small>SAR</small></span></div>
    <div class="kpi"><span class="l">Balance due from customers</span><span class="v" style="color:var(--bad)">${sar(due)}<small>SAR</small></span></div>
    <div class="kpi"><span class="l">Due on ready orders</span><span class="v">${sar(readyDue)}<small>SAR</small></span><span class="d muted">Collected at pickup</span></div></div>
  <div class="panel"><div class="panel-h"><h2>Unpaid receipts</h2></div><div class="tbl-wrap"><table>
   <thead><tr><th>Receipt</th><th>Customer</th>${curBranch?'':'<th>Branch</th>'}<th>Total</th><th>Paid</th><th>Balance</th><th>Paid so far</th><th>Status</th></tr></thead>
   <tbody>${open.map(o=>{const p=o.paid/o.total;return `<tr class="click" data-r="${o.rno}"><td><span class="rid">#${o.rno}</span></td><td class="who"><b>${cust(o.cid).name}</b><span>${cust(o.cid).phone}</span></td>${curBranch?'':`<td>${bTag(o.branch)}</td>`}
    <td class="num">${sar(o.total)}</td><td class="num">${sar(o.paid)}</td><td class="num" style="color:var(--bad);font-weight:600">${sar(o.total-o.paid)}</td>
    <td><div class="load" style="width:90px"><i style="width:${p*100}%"></i></div></td><td>${pill(o)}</td></tr>`}).join('')}</tbody></table></div></div>`);
  bindRows();
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
  <div class="rowtools"><div class="chips">${chip('all','All',all.length)}${ROLES.filter(r=>all.some(w=>w.role===r)).map(r=>chip(r,r,all.filter(w=>w.role===r).length)).join('')}${chip('off','Inactive & blocked',all.filter(w=>!okW(w)).length)}</div><span class="sp"></span>${addRoles().length?`<button class="btn pri" id="addW">${ico('plus')}Add ${isFactoryLogin()?'workshop worker':'worker'}</button>`:''}</div>
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
    <div><p class="h4">Attendance · last 14 days <span class="muted" style="font-weight:500">(${s.absent} absent)</span></p><div class="att">${w.att.map(a=>`<i class="${a==='a'?'a':a==='o'?'o':''}"></i>`).join('')}</div><p class="muted" style="font-size:11.5px;margin:6px 0 0">Green present · red absent · grey Friday</p></div>
    ${w.role==='Tailor'?`<div><p class="h4">Current work (${pl(s.act,'thobe')})</p><div class="rows" style="border:1px solid var(--line);border-radius:8px">${os.map(o=>`<div class="row" data-r="${o.rno}" style="cursor:pointer"><span class="rid">#${o.rno}</span><div class="grow"><b>${cust(o.cid).name}</b><span>${pl(o.qty,'thobe')} · due ${fmtD(o.due)}</span></div>${pill(o)}</div>`).join('')||'<div class="empty">Nothing assigned.</div>'}</div></div>`:''}`,
   `${canEditW(w)?`<button class="btn pri" id="editW">Edit</button>`:''}${canEditW(w)||isOwner()?`<button class="btn" id="appW">App link</button>`:''}${(canEditW(w)||ROLE==='manager')&&okW(w)?`<button class="btn" id="leaveW">${w.status==='leave'?'Mark as back':'Mark on leave'}</button>`:''}
    ${isOwner()?`<button class="btn" id="actW">${w.status==='inactive'?'Activate':'Deactivate'}</button><button class="btn" id="blkW" style="color:var(--bad)">${w.status==='blocked'?'Unblock':'Block'}</button><button class="btn" id="delW" style="color:var(--bad);border-color:var(--bad)">Delete</button>`:'<span class="muted" style="font-size:12px;align-self:center">Block, deactivate and delete: owner only</span>'}`);
  const $=x=>document.getElementById(x);
  if($('editW'))$('editW').onclick=()=>workerForm(w);
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
    t+=`\n\nTailoring: cut ${ps(prod,'cut')} · stitched ${ps(prod,'sew')} · hinge ${ps(prod,'hinge')} · tatreez ${ps(prod,'tat')} · ironed ${ps(prod,'iron')} pcs`;
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
     <div class="bs"><div><span>Cut</span><b>${ps(pp,'cut')}</b></div><div><span>Stitched</span><b>${ps(pp,'sew')}</b></div><div><span>Ironed</span><b>${ps(pp,'iron')}</b></div></div>
     <div class="bs"><div><span>Hinge</span><b>${ps(pp,'hinge')}</b></div><div><span>Tatreez</span><b>${ps(pp,'tat')}</b></div><div><span>Ready</span><b>${ps(pp,'sew')}</b></div></div>
     <div class="bm"><div><span class="muted">Still in production</span><span class="num">${inProd} pcs</span></div>${recv!==null?`<div><span class="muted">Received from shops</span><span class="num">${recv} pcs</span></div>${SHOPS().map(s=>{const q=sentToFac.filter(o=>o.made===b.id&&o.branch===s.id).reduce((a,o)=>a+o.qty,0);return q?`<div><span class="muted">· ${s.name}</span><span class="num">${q} pcs</span></div>`:''}).join('')}`:''}</div></div>`}).join('')}</div>
  <div class="panel"><div class="panel-h"><h2>Each worker today</h2><span class="sp"></span><span class="muted" style="font-size:12px">Pieces done ${dayLabel.toLowerCase()} · month to date</span></div><div class="tbl-wrap"><table>
   <thead><tr><th>Worker</th><th>Workshop</th><th>Job</th><th>Attendance</th><th>Pieces</th><th>Month so far</th><th>Target</th>${money?'<th>Earned today</th>':''}</tr></thead>
   <tbody>${tailors.map(w=>{const mine=prod.filter(p=>p.w===w.id);const q=mine.reduce((s,p)=>s+p.qty,0);const st=wStats(w);const a=attOf(w);
     const month=w.role==='Tailor'?st.doneQ:prodLog.filter(p=>p.w===w.id&&p.d.getMonth()===D.getMonth()).reduce((s,p)=>s+p.qty,0);
     const earnToday=w.role!=='Tailor'?null:w.pay==='piece'?q*w.rate:w.pay==='target'?(month>=w.target?Math.min(q,month-w.target)*w.comm:0):null;
     return `<tr><td><b>${w.name}</b></td><td>${bTag(w.branch)} ${bname(w.branch)}</td><td>${w.role}</td><td>${isFri?'<span class="pill s-done">Friday</span>':a==='a'?'<span class="pill s-late">Absent</span>':w.status==='leave'?'<span class="pill s-cut">Leave</span>':'<span class="pill s-ready">Present</span>'}</td>
      <td class="num"><b>${q}</b> ${{Tailor:'stitched',Cutter:'cut',Ironing:'ironed',Hinge:'hinge',Tatreez:'tatreez'}[w.role]}</td><td class="num">${month}</td>
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
    <div class="rows">${ready.map(o=>{const rem=o.total-o.paid;return `<div class="row"><span class="rid" data-r="${o.rno}" style="cursor:pointer">#${o.rno}</span><div class="grow"><b>${cust(o.cid).name}</b><span class="num">${cust(o.cid).phone} · ${pl(o.qty,'thobe')}</span></div>
     <span class="num" style="font-weight:700;color:${rem?'var(--bad)':'var(--ok)'}">${rem?sar(rem)+' SAR':'Paid'}</span>
     ${rem?`<button class="btn sm" data-col="${o.rno}" data-m="Cash">Cash</button><button class="btn sm" data-col="${o.rno}" data-m="Card (mada)">mada</button>`:`<button class="btn sm pri" data-hand="${o.rno}">Hand over</button>`}</div>`}).join('')||'<div class="empty">No thobes waiting for pickup.</div>'}</div></div>
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
    res.innerHTML=`<div class="panel"><div class="rows">${f.map(o=>`<div class="row" data-r="${o.rno}" style="cursor:pointer"><span class="rid">#${o.rno}</span><div class="grow"><b>${cust(o.cid).name}</b><span>${pl(o.qty,'thobe')} · balance ${sar(o.total-o.paid)} SAR</span></div>${pill(o)}</div>`).join('')||'<div class="empty">No receipt found in this branch.</div>'}</div></div>`;bindRows()};
  document.querySelectorAll('[data-col]').forEach(x=>x.onclick=()=>{const o=orders.find(y=>y.rno===+x.dataset.col);const rem=o.total-o.paid;payLog.push({d:today,rno:o.rno,branch:o.branch,amt:rem,m:x.dataset.m,t:'Balance'});delLog.push({d:today,rno:o.rno,branch:o.branch,qty:o.qty,amt:rem});o.paid=o.total;o.st='done';toast(`#${o.rno}: ${sar(rem)} SAR by ${x.dataset.m}, thobes handed over`);route()});
  document.querySelectorAll('[data-hand]').forEach(x=>x.onclick=()=>{const o=orders.find(y=>y.rno===+x.dataset.hand);delLog.push({d:today,rno:o.rno,branch:o.branch,qty:o.qty,amt:0});o.st='done';toast(`#${o.rno} handed over`);route()});
  document.querySelectorAll('[data-dep]').forEach(x=>x.onclick=()=>{const o=orders.find(y=>y.rno===+x.dataset.dep);const a=+document.getElementById('dep'+o.rno).value||0;if(!a){toast('Enter the deposit amount');return}o.paid=Math.min(o.total,a);payLog.push({d:today,rno:o.rno,branch:o.branch,amt:o.paid,m:'Cash',t:'Deposit'});toast(`Deposit ${sar(o.paid)} SAR taken for #${o.rno}`);route()});
  document.getElementById('closeDay').onclick=()=>toast('Demo: the day total will be locked and sent to the owner');
  document.querySelectorAll('.rid[data-r]').forEach(r=>r.onclick=()=>openOrder(+r.dataset.r));
}

/* ================= Tailor: My work ================= */
const ME=()=>workers.find(w=>w.name===USER.name)||workers.find(w=>w.role==='Tailor'&&w.branch===USER.branch)||workers.find(w=>w.role==='Tailor');
function mmLine(o){const c=cust(o.cid),p=c.profiles[o.profile]||c.profiles[0];return MEAS.filter(([k])=>mVal(p.m,k)!=='').slice(0,4).map(([k,t])=>`<span dir="rtl">${esc(t)}</span> ${esc(mVal(p.m,k))}`).join(' ')||'<span>No measurement yet</span>'}
function myJobs(w){const k=ROLE2TASK[w.role];if(!k)return[];
  return orders.filter(o=>pending(o,k)&&(k==='sew'?o.tailor===w.id:(o.made===w.branch&&(!o.tw[k]||o.tw[k]===w.id)))).sort((a,b)=>a.due-b.due)}
function mywork(){
  const w=ROLE==='tailor'?ME():(workers.find(x=>x.role==='Tailor'&&x.branch===(curBranch||4))||ME());
  const k=ROLE2TASK[w.role]||'sew';const s=wStats(w);const jobs=myJobs(w);
  V(`<div class="kpis">
    <div class="kpi"><span class="l">Waiting for me</span><span class="v">${jobs.filter(o=>o.t[k]==='wait').reduce((a,o)=>a+o.qty,0)}</span><span class="d muted">${TK[k].t} · ${pl(jobs.length,'job card')}</span></div>
    <div class="kpi"><span class="l">In progress</span><span class="v">${jobs.filter(o=>o.t[k]==='doing').reduce((a,o)=>a+o.qty,0)}</span><span class="d muted">Started, not finished</span></div>
    <div class="kpi"><span class="l">${k==='sew'?'Finished this month':'Done today'}</span><span class="v">${k==='sew'?s.doneQ:prodLog.filter(p=>p.w===w.id&&+p.d===+today).reduce((a,p)=>a+p.qty,0)}<small>pcs</small></span><span class="d ${k==='sew'&&s.doneQ>=w.target?'up':'muted'}">${k==='sew'&&w.pay==='target'?(s.doneQ>=w.target?`Target reached · +${s.extra} extra`:`${w.target-s.doneQ} pcs to target`):w.role}</span></div>
    <div class="kpi"><span class="l">My pay so far</span><span class="v">${sar(s.earn)}<small>SAR</small></span><span class="d muted">${payLabel(w)}</span></div></div>
  ${w.pay==='target'&&k==='sew'?`<div class="panel"><div class="panel-b">${targetBar(w,s)}</div></div>`:''}
  <h2 style="margin:0;font-size:17px">My job cards · ${TK[k].t}</h2>
  ${jobs.map(o=>{const c=cust(o.cid),p=c.profiles[o.profile]||c.profiles[0],d=daysLeft(o);return `<div class="jc">
    <div class="jh"><span class="rid" style="font-size:17px">#${o.rno}</span><div style="flex:1;min-width:0"><b>${c.name.split(' ')[0]} · ${pl(o.qty,'thobe')} · ${BRANCHES.find(b=>b.id===o.branch).code}</b><div class="muted" style="font-size:12.5px">${o.fabric} · ${p.name}${o.hinge?' · Hinge':''}${o.tatreez?' · Tatreez':''}${o.note?' · '+esc(o.note):''}</div></div>${taskPill(o,k)}<span class="days ${d<0?'late':d<=1?'today':''}">${d<0?`${-d}d late`:d===0?'Due today':`Due in ${d}d`}</span></div>
    <div class="jb"><div><p class="h4">Measurements · ${esc(p.name)}</p>${mShow(p.m)}</div>
     <div><p class="h4">Style</p><div class="dopts" style="padding:0;grid-template-columns:repeat(auto-fill,minmax(96px,1fr))">${DESIGN_.map(g=>{const op=g.opts.find(x=>x[0]===o.design[g.k]);return `<div class="dopt" style="cursor:default">${glyph(g.k,op[0])}<span>${op[1]}</span><em>${g.t}</em></div>`}).join('')}</div></div></div>
    <div class="jf"><button class="btn pri" data-step="${o.rno}" data-k="${k}">${taskBtn(o,k)}</button><button class="btn" data-r="${o.rno}">Open details</button></div></div>`}).join('')||'<div class="panel"><div class="empty">Nothing waiting for you right now.</div></div>'}`);
  document.querySelectorAll('[data-step]').forEach(b=>b.onclick=()=>{const o=orders.find(x=>x.rno===+b.dataset.step);stepTask(o,b.dataset.k,w);route()});
  bindRows();
}

/* ================= Production board ================= */
function board(){
  const fid=curBranch;const inScope=o=>!fid||o.made===fid||o.branch===fid;
  const list=orders.filter(o=>inScope(o)&&o.st!=='done');
  const ready=list.filter(o=>o.st==='ready');
  V(`<div class="msg" style="border-color:var(--brass)">Every new order from any branch lands in <b>Cutting</b>. When cutting is finished it moves to the <b>Tailor</b>. The moment the tailor starts, it also shows in <b>Hinge</b> and <b>Tatreez</b> (only orders ticked for them), so they work at the same time. When the tailor finishes, the owner and that branch's manager get a <b>Ready</b> popup.</div>
  <div class="rowtools"><span class="muted" style="font-size:13px">${fid?bname(fid):'All workshops'} · ${list.filter(o=>o.st!=='ready').reduce((s,o)=>s+o.qty,0)} thobes in production · ${ready.reduce((s,o)=>s+o.qty,0)} ready</span></div>
  <div class="board" style="grid-template-columns:repeat(5,minmax(220px,1fr))">${TASKS.map(t=>{const js=list.filter(o=>pending(o,t.k)).sort((a,b)=>(a.t[t.k]==='doing'?0:1)-(b.t[t.k]==='doing'?0:1)||a.due-b.due);return `<div class="col"><h3>${t.t}<span class="num">${js.reduce((s,o)=>s+o.qty,0)}</span></h3><div class="cards2">
   ${js.map(o=>{const wid=t.k==='sew'?o.tailor:o.tw[t.k];return `<div class="job ${late(o)?'late':''}"><div class="t"><span class="rid">#${o.rno}</span><span style="display:flex;gap:4px">${o.hinge&&t.k!=='hinge'?'<span class="tag" title="Needs hinge">H</span>':''}${o.tatreez&&t.k!=='tat'?'<span class="tag" title="Needs tatreez">T</span>':''}<span class="tag">${BRANCHES.find(b=>b.id===o.branch).code}</span></span></div>
    <b style="font-size:13px">${pl(o.qty,'thobe')} · ${o.fabric}</b><div class="m">${wid?wk(wid).name:'Not assigned'} · due ${fmtD(o.due)}</div>
    ${t.k==='sew'||t.k==='cut'?`<div class="mm">${mmLine(o,['tool','sadr','kom','raqba'])}</div>`:''}
    <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">${taskPill(o,t.k)}${canTask()?`<button class="btn sm pri" data-mv="${o.rno}" data-k="${t.k}">${o.t[t.k]==='wait'?'Start':'Finish'}</button>`:''}<button class="btn sm" data-r="${o.rno}">Details</button></div></div>`}).join('')||'<div class="muted" style="font-size:12.5px;padding:6px">Empty</div>'}</div></div>`}).join('')}</div>`);
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
  <div class="panel"><div class="panel-h"><h2>Branch comparison</h2><span class="sp"></span><span class="muted" style="font-size:12px">Last 40 days</span></div><div class="tbl-wrap"><table>
   <thead><tr><th>Branch</th><th>Orders</th><th>Thobes</th><th>Sent to factory</th><th>Revenue</th><th>Avg per order</th><th>Balance due</th><th>Overdue</th></tr></thead>
   <tbody>${SHOPS().map(b=>{const os=orders.filter(o=>o.branch===b.id),rv=os.reduce((s,o)=>s+o.paid,0),tq=os.reduce((s,o)=>s+o.qty,0),fq=os.filter(o=>isFac(o.made)).reduce((s,o)=>s+o.qty,0);return `<tr><td>${bTag(b.id)} <b>${b.name}</b> <span class="muted">${b.city}</span></td><td class="num">${os.length}</td><td class="num">${tq}</td><td class="num">${fq} <span class="muted">(${tq?Math.round(fq/tq*100):0}%)</span></td><td class="num">${sar(rv)}</td><td class="num">${os.length?sar(os.reduce((s,o)=>s+o.total,0)/os.length):'—'}</td><td class="num">${sar(os.reduce((s,o)=>s+o.total-o.paid,0))}</td><td class="num" style="color:${os.filter(late).length?'var(--bad)':'inherit'}">${os.filter(late).length}</td></tr>`}).join('')}</tbody></table></div></div>`);
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
  const all=O();
  const byFab=FABRICS.map(f=>({k:f,v:all.filter(o=>o.fabric===f).reduce((s,o)=>s+o.qty,0)})).sort((a,b)=>b.v-a.v);
  const bars=arr=>{const mx=Math.max(...arr.map(a=>a.v))||1;return `<div class="rows">${arr.map(a=>`<div class="row" style="padding-block:8px"><div class="grow"><b style="font-weight:500">${a.k}</b></div><div class="load" style="width:45%"><i style="width:${a.v/mx*100}%"></i></div><span class="num" style="min-width:34px;text-align:right">${a.v}</span></div>`).join('')}</div>`};
  const byT=tailorsOf(curBranch).map(w=>({k:`${w.name} · ${BRANCHES.find(b=>b.id===w.branch).code}`,v:wStats(w).doneQ})).sort((a,b)=>b.v-a.v);
  V(`<div class="grid2">
   <div class="panel"><div class="panel-h"><h2>Most ordered fabrics</h2><span class="sp"></span><span class="muted" style="font-size:12px">Thobes</span></div>${bars(byFab)}</div>
   <div class="panel"><div class="panel-h"><h2>Most popular styles</h2><span class="sp"></span><span class="muted" style="font-size:12px">Orders</span></div>${bars(DESIGN_.map(g=>{const c={};all.forEach(o=>c[o.design[g.k]]=(c[o.design[g.k]]||0)+1);const top=Object.entries(c).sort((a,b)=>b[1]-a[1])[0]||['',0];const opt=g.opts.find(o=>o[0]===top[0]);return{k:`${g.t}: ${opt?opt[1]:'—'}`,v:top[1]}}))}</div>
   <div class="panel"><div class="panel-h"><h2>Thobes finished this month</h2><span class="sp"></span><span class="muted" style="font-size:12px">By tailor</span></div>${bars(byT)}</div>
   <div class="panel"><div class="panel-h"><h2>Revenue by branch</h2><span class="sp"></span><span class="muted" style="font-size:12px">SAR · last 40 days</span></div>${bars(SHOPS().map(b=>({k:b.name,v:Math.round(orders.filter(o=>o.branch===b.id).reduce((s,o)=>s+o.paid,0))})))}</div>
  </div>`);
}

/* ================= Settings ================= */
function settings(){
  V(`<div class="grid2"><div class="panel"><div class="panel-h"><h2>Business details</h2></div><div class="panel-b"><div class="fgrid">
   <div class="field" style="grid-column:1/-1"><label for="sName">Business name</label><input id="sName" value="Saudi Thobe Men's Tailoring"></div>
   <div class="field"><label for="sDomain">Domain</label><input id="sDomain" class="num" value="saudithobe.men"></div>
   <div class="field"><label for="sVat">VAT number</label><input id="sVat" class="num" placeholder="3xxxxxxxxxxxxx3"></div>
   <div class="field"><label for="sDays">Default delivery time (days)</label><input id="sDays" type="number" value="10" class="num"></div>
   <div class="field"><label for="sCur">Currency</label><input id="sCur" value="SAR" class="num"></div>
  </div></div></div>
  <div class="panel"><div class="panel-h"><h2>Logins & permissions</h2><span class="sp"></span><span class="muted" style="font-size:12px">${pl(USERS.length,'login')} · 5 roles</span></div><div class="rows">
   ${USERS.map((u,i)=>{const a=ACCESS[u.role];return `<div class="row"><div class="avatar">${a.no}</div><div class="grow"><b>${u.name}</b><span>${a.label} · ${u.branch?bname(u.branch):'All branches'}</span></div><button class="btn sm" data-try="${i}">Try it</button></div>`}).join('')}
  </div></div></div>`);
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
