/* ================= Extras · the same tools as the Jameel admin =================
   - In work now (Dashboard): which worker has which order in his hands, since when
   - Work log (page): per order who cut / stitched / … how many pieces and when, each entry with the time it took
   - Duty hours + work time: Start → Finish, counted only inside the duty hours
   - Workshop capacity per day: load of the coming delivery days + the delivery date a new order gets
   - Orders: delivery date from – to, with the pieces to deliver
   - Give back: a step started by mistake goes back to Waiting
   - My work & pay: search by order no.
   Start times: counters/ws_<order>_<step> {n: ms, w: worker} – removed on Finish. The finished entry (prod) keeps s, e and
   m (duty minutes). Duty hours and capacity: meta/flow.work (the owner writes it). No new collection, no rules change. */
var WORKCFG={duty:[{f:'09:00',t:'12:00'},{f:'16:00',t:'23:00'}],cap:0,margin:1,dayOff:5,delDays:10};
var workSaver=null; // live.js
const okHM=s=>/^([01]\d|2[0-3]):[0-5]\d$/.test(s||'');
const hmMin=s=>{const a=String(s).split(':');return (+a[0]||0)*60+(+a[1]||0)};
const WDAYS=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
function setWorkCfg(w){if(!w||typeof w!=='object')return;
  if(Array.isArray(w.duty))WORKCFG.duty=w.duty.filter(x=>x&&okHM(x.f)&&okHM(x.t)&&x.t>x.f).map(x=>({f:x.f,t:x.t})).sort((a,b)=>a.f<b.f?-1:1).slice(0,4);
  for(const k of ['cap','margin','delDays'])if(w[k]!=null&&isFinite(+w[k]))WORKCFG[k]=Math.max(0,Math.round(+w[k]));
  if(w.dayOff!=null&&isFinite(+w.dayOff))WORKCFG.dayOff=Math.max(-1,Math.min(6,Math.round(+w.dayOff)));
  if(!WORKCFG.delDays)WORKCFG.delDays=10}
const isOff=d=>WORKCFG.dayOff>=0&&d.getDay()===WORKCFG.dayOff;
/* minutes between two moments that fall inside the duty hours (the day off counts only if he started or finished on it) */
function dutyMin(a,b){a=+a;b=+b;if(!(b>a))return 0;
  const sh=WORKCFG.duty.map(x=>[hmMin(x.f),hmMin(x.t)]).filter(x=>x[1]>x[0]);
  if(!sh.length)return Math.round((b-a)/6e4);
  const A=new Date(a),B=new Date(b),d=new Date(A.getFullYear(),A.getMonth(),A.getDate());let tot=0,n=0;
  while(+d<=b&&n++<62){if(!isOff(d)||sameDay(A,d)||sameDay(B,d))for(const [f,t] of sh){const s=Math.max(a,+d+f*6e4),e=Math.min(b,+d+t*6e4);if(e>s)tot+=e-s}
    d.setDate(d.getDate()+1)}
  return Math.round(tot/6e4)}
/* time taken: duty minutes; work done fully outside the duty hours (in the break) counts as it was */
const tookMin=(s,e)=>{const m=dutyMin(s,e);return m||(e-s<16*36e5?Math.max(1,Math.round((e-s)/6e4)):0)};
const ents=n=>`${n} ${n===1?'entry':'entries'}`;
const hmT=m=>{m=Math.round(+m||0);return m<60?`${m} min`:`${Math.floor(m/60)}h ${String(m%60).padStart(2,'0')}m`};
const clock=ms=>{const d=new Date(ms);const t=d.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'});return sameDay(d,today)?t:`${fmtD(d)} ${t}`};

/* ---------- start of a step ---------- */
const wsKey=(rno,k)=>`ws_${rno}_${k}`;
function wsGet(rno,k){const key=wsKey(rno,k);let v=+CNT[key]||0;if(!v){try{v=+localStorage.getItem(key)||0}catch(e){}}return v}
function wsSet(rno,k,ms,wid){const key=wsKey(rno,k);
  if(ms){CNT[key]=ms;try{localStorage.setItem(key,ms)}catch(e){}}else{delete CNT[key];try{localStorage.removeItem(key)}catch(e){}}
  if(LIVE&&db&&fb){try{const r=fb.doc(db,'counters',key);(ms?fb.setDoc(r,{n:ms,w:wid||0}):fb.deleteDoc(r)).catch(()=>{})}catch(e){}}}
function xStart(o,k){wsSet(o.rno,k,Date.now(),k==='sew'?o.tailor:(o.tw||{})[k])}
function xFin(o,k,p){const s=wsGet(o.rno,k),e=Date.now();p.e=new Date(e);if(s&&e>s&&e-s<45*864e5){p.s=new Date(s);p.m=tookMin(s,e)}wsSet(o.rno,k,0);return p}
/* started by mistake: back to Waiting (nothing is counted for the worker) */
function undoStart(o,k){if(!o||tv(o,k)!=='doing')return;o.t[k]='wait';wsSet(o.rno,k,0);syncSt(o);toast(`${ono(o)}: ${TK[k]?TK[k].t:k} given back · waiting again`)}
const undoBtn=(o,k,sm)=>canAssign()&&tv(o,k)==='doing'?`<button class="btn${sm?' sm':''}" data-undo="${o.rno}" data-k="${k}" title="Started by mistake? Give it back">↩ Give back</button>`:'';
document.addEventListener('click',e=>{
  const u=e.target.closest('[data-undo]');if(u){e.stopPropagation();const o=orders.find(x=>x.rno===+u.dataset.undo);undoStart(o,u.dataset.k);document.getElementById('layer').innerHTML='';route();return}
  const n=e.target.closest('[data-nw]');if(n)openOrder(+n.dataset.nw)});
try{for(let i=localStorage.length-1;i>=0;i--){const k=localStorage.key(i);if(k&&k.startsWith('ws_')&&Date.now()-(+localStorage.getItem(k)||0)>45*864e5)localStorage.removeItem(k)}}catch(e){}

/* ---------- Dashboard: in work now, by worker ---------- */
function nowList(){const out=[];O().forEach(o=>{if(o.st==='done'||!o.t)return;TASKS.forEach(t=>{if(o.t[t.k]!=='doing')return;const wid=t.k==='sew'?o.tailor:(o.tw||{})[t.k];out.push({o,k:t.k,wid:workers.some(w=>w.id===wid)?wid:0,at:wsGet(o.rno,t.k)})})});return out}
function nowPanel(){const L=nowList(),g=new Map(),now=Date.now();L.forEach(x=>{if(!g.has(x.wid))g.set(x.wid,[]);g.get(x.wid).push(x)});
  const G=[...g.entries()].map(([wid,xs])=>({wid,w:wk(wid),xs:xs.sort((a,b)=>(a.at||9e15)-(b.at||9e15)),q:sumBy(xs,x=>x.o.qty)})).sort((a,b)=>b.q-a.q);
  return `<div class="panel" id="nowWip"><div class="panel-h"><h2>In work now</h2><span class="sp"></span><span class="muted" style="font-size:12.5px">${L.length?`${pl(G.length,'worker')} · ${sumBy(L,x=>x.o.qty)} pcs in hand`:'Started, not finished'}</span></div>
   ${L.length?`<div class="noww">${G.map(x=>`<div class="nw"><div class="nwh">${wAv(x.w,34)}<div class="grow"><b>${x.wid?esc(x.w.name):'Not assigned'}</b><span>${x.wid?esc(roleText(x.w))+(curBranch?'':' · '+esc(bname(x.w.branch))):''}</span></div><span class="nwq num">${x.q}<small>pcs</small></span></div>
     ${x.xs.map(y=>`<div class="nwl" data-nw="${y.o.rno}" tabindex="0" role="button"><span class="rid">${ono(y.o)}</span><span class="nwc" dir="auto">${esc(cust(y.o.cid).name)}</span><b class="num">${y.o.qty} pcs</b><span class="nwk"><span class="pill s-cut">${esc(stageT(y.k))}</span>${late(y.o)?'<span class="pill s-late">Late</span>':''}<span class="nwt num">${y.at?`${clock(y.at)} · ${hmT(tookMin(y.at,now))}`:''}</span></span></div>`).join('')}</div>`).join('')}</div>`
    :'<div class="empty" style="padding:16px">No piece is in work right now.</div>'}</div>`}

/* ---------- workshop capacity: pieces per day → load of the delivery days, delivery date for a new order ---------- */
const capOpen=()=>orders.filter(o=>o.st!=='done'&&o.st!=='ready').map(o=>({o,q:Math.max(0,(+o.qty||0)-oInfo(o).sew)})).filter(x=>x.q>0);
function capFreeDate(q){const cap=+WORKCFG.cap||0;if(!cap)return null;const need=sumBy(capOpen(),x=>x.q)+(+q||0),d=new Date(today);let made=0;
  for(let i=0;i<500;i++){if(!isOff(d))made+=cap;if(made>=need)break;d.setDate(d.getDate()+1)}
  return addD(d,+WORKCFG.margin||0)}
function dueDefault(){const a=addD(today,+WORKCFG.delDays||10),f=capFreeDate(1);return f&&f>a?f:a}
function capPlan(n=14){const cap=+WORKCFG.cap||0,L=capOpen(),mar=+WORKCFG.margin||0,rows=[];let need=sumBy(L.filter(x=>x.o.due<today),x=>x.q),made=0;const lateQ=need,q=[];
  for(let i=0;i<n;i++){const d=addD(today,i),off=isOff(d);if(!off)made+=cap;q.push(made);const xs=L.filter(x=>sameDay(x.o.due,d)),dq=sumBy(xs,x=>x.q);need+=dq;
    const can=i-mar>=0?q[i-mar]:0;rows.push({d,off,n:xs.length,dq,need,can,short:Math.max(0,need-can)})}
  return{cap,total:sumBy(L,x=>x.q),orders:L.length,lateQ,rows,free:capFreeDate(1)}}
const dLong=d=>d.toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short'});
function capSummary(p){return `<div class="okpi"><div><span>Still to stitch</span><b class="num">${p.total}<small>pcs</small></b><em>${pl(p.orders,'order')} in all workshops</em></div>
   <div><span>Capacity</span><b class="num">${p.cap}<small>pcs / day</small></b><em>${WORKCFG.dayOff>=0?WDAYS[WORKCFG.dayOff]+' off':'No day off'}</em></div>
   <div class="${p.lateQ?'bad':''}"><span>Already late</span><b class="num">${p.lateQ}<small>pcs</small></b><em>Delivery date passed</em></div>
   <div class="okc"><span>New order can be delivered</span><b style="font-size:19px">${p.free?dLong(p.free):'—'}</b><em>${p.free?`${Math.ceil(p.total/p.cap)} working days of work + ${WORKCFG.margin} margin`:''}</em></div></div>`}
function capPanel(){if(!(+WORKCFG.cap>0)||!RA().stage)return '';const p=capPlan(14),mx=Math.max(p.cap,...p.rows.map(r=>r.dq))||1;
  return `<div class="panel" id="capPanel"><div class="panel-h"><h2>Workshop load</h2><span class="sp"></span><span class="muted" style="font-size:12.5px">Next 14 delivery days · all workshops · ${p.cap} pcs / day</span></div>
   <div class="panel-b" style="padding:12px 16px">${capSummary(p)}
    <div class="capd">${p.rows.map(r=>`<div class="cd ${r.off?'off':''} ${r.short?'short':''}" title="${dLong(r.d)}: ${r.dq} pcs to stitch for this day · needed by then ${r.need} · can make ${r.can}"><i><b style="height:${Math.min(100,r.dq/mx*100)}%"></b></i><span class="num">${r.dq||''}</span><em>${r.d.toLocaleDateString('en-GB',{weekday:'short'}).slice(0,2)}<br>${r.d.getDate()}</em>${r.short?`<u class="num">−${r.short}</u>`:''}</div>`).join('')}</div>
    <p class="muted" style="font-size:12px;margin:8px 0 0">Bar = pieces still to stitch for that delivery day. Red = the workshop cannot finish them in time (short by that many pieces).</p></div></div>`}
const capHint=()=>{if(!(+WORKCFG.cap>0))return '';const p=capPlan(1);return `<small class="caph">Workshop: ${p.total} pcs waiting · ${p.cap} / day · free from ${p.free?fmtD(p.free):'—'}</small>`};

/* ---------- Settings → Duty hours & capacity (owner) ---------- */
function workCfgHtml(){const c=WORKCFG;
  return `<div class="panel" id="setWork"><div class="panel-h"><h2>Duty hours & capacity</h2><span class="sp"></span><span class="muted" style="font-size:12px">One setting for all branches</span></div>
   <div class="panel-b wcfg">
    <div class="wcc"><p class="h4">Duty hours</p><p class="muted" style="font-size:12.5px;margin:0">A worker's time on a piece (Start → Finish) is counted only inside these hours.</p>
     <div id="wcDuty"></div><div><button class="btn sm" id="wcAdd" type="button">${ico('plus')} Add shift</button></div>
     <div class="field"><label for="wcOff">Weekly day off</label><select id="wcOff"><option value="-1">No day off</option>${WDAYS.map((d,i)=>`<option value="${i}" ${c.dayOff===i?'selected':''}>${d}</option>`).join('')}</select></div></div>
    <div class="wcc"><p class="h4">Workshop capacity</p><p class="muted" style="font-size:12.5px;margin:0">How many pieces all tailors together finish in one day. 0 = not used.</p>
     <div class="field"><label for="wcCap">Pieces per day</label><input id="wcCap" class="num" type="number" min="0" inputmode="numeric" value="${c.cap||''}" placeholder="0"></div>
     <div class="field"><label for="wcDel">Delivery days for a new order</label><input id="wcDel" class="num" type="number" min="1" inputmode="numeric" value="${c.delDays}"></div>
     <div class="field"><label for="wcMar">Margin days before delivery</label><input id="wcMar" class="num" type="number" min="0" inputmode="numeric" value="${c.margin}"></div></div>
   </div>
   <div class="panel-b" style="border-top:1px solid var(--line);display:flex;flex-direction:column;gap:12px"><div id="wcPlan"></div><div><button class="btn pri" id="wcSave" type="button">Save</button></div></div></div>`}
function workCfgMount(){const box=document.getElementById('wcDuty');if(!box)return;let duty=WORKCFG.duty.map(x=>({...x}));
  const draw=()=>{box.innerHTML=duty.map((x,i)=>`<div class="wsh"><input type="time" data-wf="${i}" value="${x.f}" aria-label="From"><span class="muted">to</span><input type="time" data-wt="${i}" value="${x.t}" aria-label="To"><button class="btn sm" type="button" data-wx="${i}" aria-label="Remove">${ico('x')}</button></div>`).join('')||'<span class="muted" style="font-size:12.5px">No duty hours: the whole time from Start to Finish is counted.</span>';
    box.querySelectorAll('[data-wf]').forEach(i=>i.onchange=()=>duty[+i.dataset.wf].f=i.value);box.querySelectorAll('[data-wt]').forEach(i=>i.onchange=()=>duty[+i.dataset.wt].t=i.value);
    box.querySelectorAll('[data-wx]').forEach(b=>b.onclick=()=>{duty.splice(+b.dataset.wx,1);draw()})};
  const plan=()=>{const el=document.getElementById('wcPlan');if(el)el.innerHTML=+WORKCFG.cap>0?capSummary(capPlan(1)):'<span class="muted" style="font-size:12.5px">Set the pieces per day to see when a new order can be delivered. A new order then gets that delivery date by itself.</span>'};
  draw();plan();
  document.getElementById('wcAdd').onclick=()=>{if(duty.length>=4){toast('4 shifts at most');return}duty.push({f:'13:00',t:'15:00'});draw()};
  document.getElementById('wcSave').onclick=async()=>{const $=id=>document.getElementById(id);
    if(duty.some(x=>!okHM(x.f)||!okHM(x.t)||x.t<=x.f)){toast('Check the duty hours: "to" must be after "from"');return}
    const n={duty:duty.map(x=>({f:x.f,t:x.t})),cap:Math.max(0,+$('wcCap').value||0),margin:Math.max(0,+$('wcMar').value||0),delDays:Math.max(1,+$('wcDel').value||10),dayOff:+$('wcOff').value};
    const b=$('wcSave');b.disabled=true;
    try{if(workSaver)await workSaver(n);else{try{localStorage.setItem('st_workcfg',JSON.stringify(n))}catch(e){}}setWorkCfg(n);duty=WORKCFG.duty.map(x=>({...x}));draw();plan();toast('Duty hours and capacity saved')}
    catch(e){toast('Could not save: '+(e.code||e.message||e))}b.disabled=false}}

/* ---------- Orders: delivery date from – to ---------- */
var oDue={f:'',t:''};
function xDueOk(o){if(!oDue.f&&!oDue.t)return true;const k=dkey2(o.due);return (!oDue.f||k>=oDue.f)&&(!oDue.t||k<=oDue.t)}
function xDueBar(all,info){const on=oDue.f||oDue.t,Q=(t,a,b)=>{const f=dkey2(addD(today,a)),e=dkey2(addD(today,b));return `<button type="button" class="chip ${oDue.f===f&&oDue.t===e?'on':''}" data-odq="${f}|${e}">${t}</button>`};
  let sum='';if(on){const pcs=sumBy(all,o=>o.qty),del=sumBy(all,o=>info.get(o.rno).dq),rd=sumBy(all.filter(o=>o.st==='ready'),o=>Math.max(0,o.qty-info.get(o.rno).dq)),nr=Math.max(0,pcs-del-rd);
    sum=`<div class="odsum"><div><span>Orders</span><b class="num">${all.length}</b></div><div><span>Pieces</span><b class="num">${pcs}</b></div><div><span>Ready</span><b class="num tgood">${rd}</b></div><div><span>Not ready</span><b class="num ${nr?'tbad':''}">${nr}</b></div><div><span>Delivered</span><b class="num">${del}</b></div></div>`}
  return `<div class="odue"><b class="odl">Delivery date</b><label class="pfl">From <input type="date" id="oDf" value="${oDue.f}"></label><label class="pfl">To <input type="date" id="oDt" value="${oDue.t}"></label>
    <div class="chips">${Q('Today',0,0)}${Q('Tomorrow',1,1)}${Q('7 days',0,6)}</div>${on?'<button type="button" class="btn sm" id="oDx">Clear</button>':''}${sum}</div>`}
function xDueBind(){const f=document.getElementById('oDf'),t=document.getElementById('oDt');if(!f)return;
  f.onchange=t.onchange=()=>{oDue={f:f.value,t:t.value};if(oDue.f&&oDue.t&&oDue.f>oDue.t)oDue={f:oDue.t,t:oDue.f};ordersView()};
  document.querySelectorAll('[data-odq]').forEach(b=>b.onclick=()=>{const [a,c]=b.dataset.odq.split('|');oDue=oDue.f===a&&oDue.t===c?{f:'',t:''}:{f:a,t:c};ordersView()});
  const x=document.getElementById('oDx');if(x)x.onclick=()=>{oDue={f:'',t:''};ordersView()}}

/* ---------- My work & pay: by order no. ---------- */
var myOrdQ='';
const xMyOrdBox=()=>`<label class="search" style="flex:1 1 170px;max-width:260px;width:auto"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><input id="myOq" type="search" inputmode="numeric" placeholder="Order no." value="${esc(myOrdQ)}" autocomplete="off"></label>`;
function xMyOrd(w){const q=myOrdQ.trim().replace(/^#/,'').toLowerCase();
  if(!q)return '<div class="panel"><div class="empty">Type an order number to see what you did on it, and when.</div></div>';
  const os=orders.filter(o=>ordMatch(o,q)),rn=new Set(os.map(o=>o.rno));if(/^\d+$/.test(q))rn.add(+q);
  const ent=prodLog.filter(p=>p.w===w.id&&rn.has(p.rno)&&(+p.qty||0)).sort((a,b)=>pT(b)-pT(a));
  const mine=os.flatMap(o=>TASKS.filter(t=>needs(o,t.k)&&tv(o,t.k)!=='done'&&(t.k==='sew'?o.tailor===w.id:(o.tw||{})[t.k]===w.id)).map(t=>({o,t})));
  if(!ent.length&&!mine.length)return `<div class="panel"><div class="empty">No work of yours on order “${esc(myOrdQ)}”.</div></div>`;
  const head=os.map(o=>`<div class="row" data-r="${o.rno}" style="cursor:pointer"><span class="rid">${ono(o)}</span><div class="grow"><b dir="auto">${esc(cust(o.cid).name.split(' ')[0])}</b><span>${pl(o.qty,'thobe')} · delivery ${fmtD(o.due)}</span></div><span class="pill ${WHERE_C(oInfo(o).where)}">${esc(oInfo(o).where)}</span></div>`).join('');
  return `<div class="kpis"><div class="kpi"><span class="l">Pieces I did</span><span class="v">${sumBy(ent,p=>p.qty)}<small>pcs</small></span><span class="d muted">${ents(ent.length)}</span></div>
     <div class="kpi"><span class="l">Work time</span><span class="v" style="font-size:24px">${ent.some(p=>p.m)?hmT(sumBy(ent,p=>p.m)):'—'}</span><span class="d muted">Start → Finish, in duty hours</span></div></div>
    ${head?`<div class="panel"><div class="rows">${head}</div></div>`:''}
    <div class="panel"><div class="panel-h"><h2>My work on this order</h2></div><div class="tbl-wrap"><table><thead><tr><th>Date</th><th>Work</th><th>Pieces</th><th>Time taken</th></tr></thead><tbody>
     ${mine.map(x=>`<tr><td class="muted">—</td><td>${esc(x.t.t)}</td><td class="num">${x.o.qty}</td><td>${tv(x.o,x.t.k)==='doing'?'<span class="pill s-cut">In progress</span>':'<span class="pill s-new">Waiting</span>'}</td></tr>`).join('')}
     ${ent.map(p=>`<tr><td>${pE(p)?clock(+pE(p)):fmtD(p.d)}</td><td>${esc(STAGE_T[p.stage]||p.stage)}</td><td class="num"><b>${p.qty}</b></td><td class="num">${p.m?hmT(p.m):'—'}</td></tr>`).join('')}</tbody></table></div></div>`}
function xMyOrdBind(){const i=document.getElementById('myOq');if(!i)return;let t;
  const go=()=>{myOrdQ=i.value;mypay();const n=document.getElementById('myOq');if(n){n.focus();try{n.setSelectionRange(n.value.length,n.value.length)}catch(e){}}};
  i.oninput=()=>{clearTimeout(t);t=setTimeout(go,350)};i.onkeydown=e=>{if(e.key==='Enter'){clearTimeout(t);go()}}}

/* ---------- Work log page: owner, branch manager, accountant ---------- */
const pT=p=>+(p.e||p.upd||p.d);
/* the moment it was finished (older entries: the time the entry was saved, when that is the same day) */
const pE=p=>{const e=p.e||p.upd;return e&&sameDay(new Date(e),d0(p.d))?new Date(e):null};
var wlTab='ord',wlW=0,wlK='',wlQ='';
function workLogView(){
  const P=perGet('wlog','week'),B=curBranch,q=wlQ.trim().replace(/^#/,'').toLowerCase(),om=new Map(orders.map(o=>[o.rno,o]));
  const hitO=q?orders.filter(o=>ordMatch(o,q)):[],byNo=!!q&&(hitO.length>0||/^\d+$/.test(q)),hitR=new Set(hitO.map(o=>o.rno));if(/^\d+$/.test(q))hitR.add(+q);
  const scope=p=>{if(!B)return true;const o=om.get(p.rno);return p.made===B||wk(p.w).branch===B||!!(o&&o.branch===B)};
  const qOk=p=>{if(!q)return true;if(byNo)return hitR.has(p.rno);const o=om.get(p.rno);if(!o)return false;const c=cust(o.cid);return c.name.toLowerCase().includes(q)||String(c.phone||'').includes(q)};
  const base=prodLog.filter(p=>(+p.qty||0)>0&&scope(p)&&(byNo||inPer(p.d,P)));
  const ent=base.filter(p=>qOk(p)&&(!wlW||p.w===wlW)&&(!wlK||p.stage===wlK)).sort((a,b)=>pT(b)-pT(a));
  const ks=TASKS.map(t=>t.k).filter(k=>k==='cut'||k==='sew'||ent.some(p=>p.stage===k));ent.forEach(p=>{if(!ks.includes(p.stage))ks.push(p.stage)});
  const people=[...new Set(base.map(p=>p.w))].map(id=>wk(id)).filter(w=>w.id).sort((a,b)=>a.name.localeCompare(b.name));
  const S=k=>sumBy(ent.filter(p=>p.stage===k),p=>p.qty),timed=ent.filter(p=>p.m>0),tm=sumBy(timed,p=>p.m),tq=sumBy(timed,p=>p.qty);
  const when=p=>pE(p)?clock(+pE(p)):fmtD(p.d),wn=p=>wk(p.w).id?wk(p.w).name:'—',cn=p=>{const o=om.get(p.rno);return o?cust(o.cid).name:''};
  // by order
  const g=new Map();ent.forEach(p=>{const k=p.rno||0;if(!g.has(k))g.set(k,{rno:k,o:om.get(k),e:[],last:0});const x=g.get(k);x.e.push(p);x.last=Math.max(x.last,pT(p))});
  const G=[...g.values()].sort((a,b)=>b.last-a.last);
  const cell=(x,k)=>x.e.filter(p=>p.stage===k).map(p=>`<div class="wlc"><b>${esc(wn(p))}</b> <span class="num">${p.qty} pcs</span><small>${when(p)}${p.m?' · '+hmT(p.m):''}</small></div>`).join('')||'<span class="muted">—</span>';
  // by worker (work time)
  const bw=new Map();ent.forEach(p=>{if(!bw.has(p.w))bw.set(p.w,{w:wk(p.w),q:0,n:0,tq:0,m:0,os:new Set()});const x=bw.get(p.w);x.q+=+p.qty||0;x.n++;if(p.rno)x.os.add(p.rno);if(p.m>0){x.tq+=+p.qty||0;x.m+=p.m}});
  const BW=[...bw.values()].sort((a,b)=>b.q-a.q);
  const tab=(k,t,n)=>`<button type="button" class="${wlTab===k?'on':''}" data-wlt="${k}">${t}${n!=null?`<span class="num">${n}</span>`:''}</button>`;
  let body;
  if(wlTab==='ent')body=xTable([{t:'Finished',f:p=>`<span class="num">${when(p)}</span>`},{t:'Order',f:p=>p.rno?`<b class="num">${onoR(p.rno)}</b>`:'<span class="muted">—</span>'},{t:'Customer',f:p=>`<span dir="auto">${esc(cn(p))}</span>`},{t:'Work',f:p=>esc(stageT(p.stage))},{t:'Worker',f:p=>`<b>${esc(wn(p))}</b>`},{t:'Pcs',r:1,f:p=>`<b>${p.qty}</b>`},{t:'Started',f:p=>p.s?`<span class="num">${clock(+p.s)}</span>`:'<span class="muted">—</span>'},{t:'Work time',r:1,f:p=>p.m?hmT(p.m):'—'},{t:'Made at',f:p=>esc(bname(p.made))}],
     ent.slice(0,1500),{attr:p=>p.rno&&om.has(p.rno)?`data-lr="${p.rno}"`:'',mw:'860px',h:'calc(100vh - 330px)',empty:'No work in this period.',foot:['Total','','','','',sumBy(ent,p=>p.qty),'',tm?hmT(tm):'','']});
  else if(wlTab==='time')body=xTable([{t:'Worker',f:x=>`<span style="display:inline-flex;gap:8px;align-items:center">${wAv(x.w,28)}<b>${esc(x.w.id?x.w.name:'—')}</b></span>`},{t:'Job',f:x=>esc(roleText(x.w))},{t:'Pcs',r:1,f:x=>`<b>${x.q}</b>`},{t:'Orders',r:1,f:x=>x.os.size||''},{t:'Pcs with time',r:1,f:x=>x.tq||'—'},{t:'Work time',r:1,f:x=>x.m?hmT(x.m):'—'},{t:'Avg per piece',r:1,f:x=>x.tq?`<b>${hmT(x.m/x.tq)}</b>`:'—'}],
     BW,{attr:x=>x.w.id?`data-wlw="${x.w.id}"`:'',h:'calc(100vh - 330px)',empty:'No work in this period.',foot:['Total','',sumBy(BW,x=>x.q),'',tq||'',tm?hmT(tm):'',tq?hmT(tm/tq):'']});
  else body=xTable([{t:'Order',f:x=>x.rno?`<b class="num">${onoR(x.rno)}</b>`:'<span class="muted">No order no.</span>'},{t:'Customer',f:x=>x.o?`<b dir="auto" class="cn">${esc(cust(x.o.cid).name)}</b>`:''},{t:'Pcs',r:1,f:x=>x.o?`<b>${x.o.qty}</b>`:''},...ks.map(k=>({t:stageT(k),f:x=>cell(x,k)})),{t:'Now',f:x=>{if(!x.o)return '';const i=oInfo(x.o);return `<span class="pill ${WHERE_C(i.where)}">${esc(i.where)}</span>`}}],
     G.slice(0,800),{attr:x=>x.o?`data-lr="${x.rno}"`:'',mw:`${420+ks.length*170}px`,h:'calc(100vh - 330px)',empty:byNo?`No work found for order “${esc(wlQ)}”.`:'No work in this period.',foot:['Total',pl(G.filter(x=>x.rno).length,'order'),sumBy(G,x=>x.o?x.o.qty:0),...ks.map(k=>`<b>${S(k)}</b> pcs`),'']});
  V(`<div class="panel"><div class="panel-b" style="padding:12px 16px">${perBar('wlPer',P)}
     <div class="wltools"><label class="search" style="flex:1 1 200px;max-width:300px;width:auto"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><input id="wlQ" type="search" placeholder="Order no. or customer" value="${esc(wlQ)}" autocomplete="off"></label>
      <label class="pfl">Worker <select id="wlW"><option value="0">All workers</option>${people.map(w=>`<option value="${w.id}" ${w.id===wlW?'selected':''}>${esc(w.name)}</option>`).join('')}</select></label>
      <label class="pfl">Work <select id="wlK"><option value="">All steps</option>${Object.keys(TASK_DEF).filter(k=>TK[k]||base.some(p=>p.stage===k)).map(k=>`<option value="${k}" ${k===wlK?'selected':''}>${esc(stageT(k))}</option>`).join('')}</select></label>
      <span class="sp" style="flex:1"></span><button class="btn sm" id="wlCsv">CSV</button><button class="btn sm" id="wlPrint">Print</button></div>
     <div class="muted" style="font-size:12.5px;margin-top:8px">${byNo?`Whole history of order “${esc(wlQ)}”`:perLabel(P)+' · '+esc(B?bname(B):'All branches & factories')} · tap a row to open the order</div></div></div>
   <div class="okpi"><div><span>Orders worked on</span><b class="num">${G.filter(x=>x.rno).length}</b><em>${ents(ent.length)}</em></div>${ks.map(k=>`<div><span>${esc(stageT(k))}</span><b class="num">${S(k)}<small>pcs</small></b></div>`).join('')}
    <div class="okc"><span>Work time</span><b class="num" style="font-size:20px">${tm?hmT(tm):'—'}</b><em>${tq?`avg ${hmT(tm/tq)} per piece · ${tq} pcs timed`:'Counted from Start to Finish'}</em></div></div>
   <div class="panel opanel"><div class="otools"><div class="seg" role="tablist">${tab('ord','By order',G.length)}${tab('ent','All entries',ent.length)}${tab('time','Work time',BW.length)}</div></div>${body}</div>`);
  perBind('wlPer',P,workLogView);
  const $=id=>document.getElementById(id);let t;
  const again=()=>{wlQ=$('wlQ').value;workLogView();const n=$('wlQ');if(n){n.focus();try{n.setSelectionRange(n.value.length,n.value.length)}catch(e){}}};
  $('wlQ').oninput=()=>{clearTimeout(t);t=setTimeout(again,350)};$('wlQ').onkeydown=e=>{if(e.key==='Enter'){clearTimeout(t);again()}};
  $('wlW').onchange=e=>{wlW=+e.target.value;workLogView()};$('wlK').onchange=e=>{wlK=e.target.value;workLogView()};
  document.querySelectorAll('[data-wlt]').forEach(b=>b.onclick=()=>{wlTab=b.dataset.wlt;workLogView()});
  document.querySelectorAll('#view [data-lr]').forEach(r=>r.onclick=()=>openOrder(+r.dataset.lr));
  document.querySelectorAll('#view [data-wlw]').forEach(r=>r.onclick=()=>{wlW=+r.dataset.wlw;wlTab='ent';workLogView()});
  const name=`work_log_${byNo?q:dkey2(P.from)+'_'+dkey2(P.to)}`,sub=`${B?bname(B):'All branches & factories'} · ${byNo?'order '+wlQ:perLabel(P)}`;
  const HO=['Order','Customer','Pcs',...ks.map(stageT)],RO=G.map(x=>[x.rno?onoR(x.rno):'',x.o?cust(x.o.cid).name:'',x.o?x.o.qty:'',...ks.map(k=>x.e.filter(p=>p.stage===k).map(p=>`${wn(p)} ${p.qty} pcs (${when(p)}${p.m?', '+hmT(p.m):''})`).join('; '))]);
  const HE=['Finished','Order','Customer','Work','Worker','Pcs','Started','Work time (min)','Made at'],RE=ent.map(p=>[pE(p)?`${dkey2(pE(p))} ${pE(p).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})}`:dkey2(p.d),p.rno?onoR(p.rno):'',cn(p),stageT(p.stage),wn(p),p.qty,p.s?`${dkey2(p.s)} ${new Date(p.s).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})}`:'',p.m||'',bname(p.made)]);
  const HT=['Worker','Job','Pcs','Orders','Pcs with time','Work time','Avg per piece'],RT=BW.map(x=>[x.w.id?x.w.name:'',roleText(x.w),x.q,x.os.size,x.tq,x.m?hmT(x.m):'',x.tq?hmT(x.m/x.tq):'']);
  $('wlCsv').onclick=()=>csvOut(name,wlTab==='ent'?[HE,...RE]:wlTab==='time'?[HT,...RT]:[HO,...RO]);
  $('wlPrint').onclick=()=>printRep('Work log',sub,pTiles([['Orders',G.filter(x=>x.rno).length],...ks.map(k=>[stageT(k),S(k)+' pcs']),['Work time',tm?hmT(tm):'—']])
    +(wlTab==='ent'?pTable(HE,RE,null,[5,7]):wlTab==='time'?pTable(HT,RT,null,[2,3,4]):pTable(HO,RO,null,[2])));
}

/* ---------- demo: order numbers, times and start times on the sample work, so the new pages show something ---------- */
if(DEMO){try{setWorkCfg({cap:30,...JSON.parse(localStorage.getItem('st_workcfg')||'{}')})}catch(e){setWorkCfg({cap:30})}
  let z=7;const rz=()=>(z=(z*9301+49297)%233280)/233280;
  prodLog.forEach(p=>{if(!p.rno){const pool=orders.filter(o=>o.t&&o.t[p.stage]==='done'&&(p.stage!=='sew'||o.tailor===p.w));const o=pool.length?pool[Math.floor(rz()*pool.length)]:null;if(o)p.rno=o.rno}
    if(!p.e){const e=Math.min(Date.now()-3e5,+p.d+(9+Math.floor(rz()*13))*36e5+Math.floor(rz()*59)*6e4),m=Math.round((+p.qty||1)*(25+rz()*50));p.e=new Date(e);p.s=new Date(e-m*6e4);p.m=m}});
  orders.forEach(o=>{if(o.st==='done'||!o.t)return;Object.keys(o.t).forEach(k=>{if(o.t[k]==='doing')CNT[wsKey(o.rno,k)]=Date.now()-Math.round((10+rz()*170)*6e4)})})}
