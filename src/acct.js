/* ================= Accountant: salaries, advances, monthly deductions =================
   advance (collection adv): {sid, branch, d, amt, reason, by, plan:{'2026-11':200,'2026-12':200}}
   plan = how much is cut from his salary in each month; those cuts count as deductions in monthPay(). */
const advLog=[];
const isAcct=()=>ROLE==='accountant';
const canMoney=()=>isOwner()||isAcct();
const ymDate=ym=>{const [y,m]=ym.split('-').map(Number);return new Date(y,m-1,1)};
const ymAdd=(ym,n)=>{const d=ymDate(ym);return ymKey(new Date(d.getFullYear(),d.getMonth()+n,1))};
const advOf=sid=>advLog.filter(a=>a.sid===sid);
const advCut=(a,ym)=>+((a.plan||{})[ym])||0;
const advPlanned=a=>Object.values(a.plan||{}).reduce((s,v)=>s+(+v||0),0);
const advPaid=(a,upTo=ymKey(today))=>Object.entries(a.plan||{}).filter(([k])=>k<=upTo).reduce((s,[,v])=>s+(+v||0),0);
const advBal=(a,upTo)=>Math.max(0,(+a.amt||0)-advPaid(a,upTo));
function advCuts(w,ym){return advOf(w.id).filter(a=>advCut(a,ym)>0).map(a=>({sid:w.id,branch:w.branch,d:ymDate(ym),amt:advCut(a,ym),reason:`Advance repayment (taken ${fmtD(a.d)})`,by:a.by||'',adv:a}))}
function advSummary(w){const L=advOf(w.id),ym=ymKey(today);
  const total=sumBy(L,a=>a.amt),paid=sumBy(L,a=>Math.min(+a.amt||0,advPaid(a)));
  return{list:L,total,paid,bal:Math.max(0,total-paid),now:sumBy(L,a=>advCut(a,ym)),next:sumBy(L,a=>advCut(a,ymAdd(ym,1))),unplanned:sumBy(L,a=>Math.max(0,(+a.amt||0)-advPlanned(a)))}}
// equal cuts from a start month until the advance is covered
function makePlan(amt,per,start){const p={};let left=+amt||0,ym=start,i=0;per=+per||0;if(per<=0)return p;while(left>0&&i<60){const c=Math.min(per,left);p[ym]=c;left-=c;ym=ymAdd(ym,1);i++}return p}
const monthOpts=(sel,back=12,fwd=12)=>{const o=[];for(let i=-back;i<=fwd;i++)o.push(ymAdd(ymKey(today),i));return o.map(m=>`<option value="${m}" ${m===sel?'selected':''}>${ymName(m)}</option>`).join('')};

if(DEMO){const t=workers.filter(w=>w.role==='Tailor').slice(5,8),ym=ymKey(today);
  t.forEach((w,i)=>advLog.push({sid:w.id,branch:w.branch,d:addD(today,-(20+i*15)),amt:[1500,800,600][i],reason:['Family need','Iqama renewal','Ticket'][i],by:'Owner',plan:makePlan([1500,800,600][i],[500,200,300][i],ymAdd(ym,i?-1:0))}))}

/* ---------- Salaries & advances page (owner + accountant) ---------- */
let salYm=ymKey(today),salTab='sheet';
function salRows(ym){return W().filter(w=>okW(w)||w.status==='leave').map(w=>{const mp=monthPay(w,ym);const a=sumBy(mp.ded.filter(x=>x.adv),x=>x.amt);return{w,mp,adv:a,oth:mp.dedT-a,bon:mp.bonT}})}
function salaryView(){
  const ym=salYm,R=salRows(ym);
  const T={earn:sumBy(R,r=>r.mp.earn),base:sumBy(R,r=>r.mp.base),comm:sumBy(R,r=>r.mp.comm),bon:sumBy(R,r=>r.bon),adv:sumBy(R,r=>r.adv),oth:sumBy(R,r=>r.oth),net:sumBy(R,r=>r.mp.net)};
  const advAll=advLog.filter(a=>W().some(w=>w.id===a.sid)),out=sumBy(advAll,a=>advBal(a));
  const tab=(k,t)=>`<button class="${salTab===k?'on':''}" data-st="${k}">${t}</button>`;
  let body='';
  if(salTab==='sheet')body=xTable([
     {t:'Worker',f:r=>`<div style="display:flex;gap:8px;align-items:center">${wAv(r.w,30)}<div><b>${esc(r.w.name)}</b><div class="muted" style="font-size:11.5px">${esc(roleText(r.w))}</div></div></div>`},
     {t:'Branch',f:r=>esc(bname(r.w.branch))},
     {t:'Pay type',f:r=>esc(payLabel(r.w))},
     {t:'Pcs',r:1,f:r=>`<span title="${esc(workBy(r.mp).map(x=>x.job+' '+x.qty).join(' · '))}">${r.mp.qty}</span>`},
     {t:'Salary',r:1,f:r=>sar(r.mp.base)},
     {t:'Commission',r:1,f:r=>r.mp.comm?`<span class="tgood">+ ${sar(r.mp.comm)}</span>`:'—'},
     {t:'Bonus',r:1,f:r=>r.bon?`<span class="tgood">+ ${sar(r.bon)}</span>`:'—'},
     {t:'Advance cut',r:1,f:r=>r.adv?`<span class="tbad">− ${sar(r.adv)}</span>`:'—'},
     {t:'Other deductions',r:1,f:r=>r.oth?`<span class="tbad">− ${sar(r.oth)}</span>`:'—'},
     {t:'Net pay',r:1,f:r=>`<b>${sar(r.mp.net)}</b>`},
     {t:'Advance left',r:1,f:r=>{const s=advSummary(r.w);return s.bal?sar(s.bal):'—'}}],
    R,{attr:r=>`data-sw="${r.w.id}"`,mw:'980px',foot:['Total','','',sumBy(R,r=>r.mp.qty),sar(T.base),'+ '+sar(T.comm),'+ '+sar(T.bon),'− '+sar(T.adv),'− '+sar(T.oth),sar(T.net),sar(out)],empty:'No workers.'});
  else if(salTab==='adv')body=xTable([
     {t:'Worker',f:a=>{const w=workers.find(x=>x.id===a.sid);return `<b>${esc(w?w.name:'#'+a.sid)}</b>`}},
     {t:'Taken',f:a=>fmtL(a.d)},{t:'Reason',f:a=>esc(a.reason||'')},
     {t:'Amount',r:1,f:a=>sar(a.amt)},{t:'Recovered',r:1,f:a=>sar(Math.min(+a.amt||0,advPaid(a)))},{t:'Left',r:1,f:a=>`<b>${sar(advBal(a))}</b>`},
     {t:'Cut plan',f:a=>{const e=Object.entries(a.plan||{}).sort();return e.length?`<span style="font-size:12px">${e.map(([k,v])=>`<span class="${k===ymKey(today)?'pill s-cut':k<ymKey(today)?'muted':''}" style="white-space:nowrap">${ymName(k).slice(0,3)} ${k.slice(2,4)}: ${sar(v)}</span>`).join(' · ')}</span>`:'<span class="tbad">No plan</span>'}}],
    advAll.slice().sort((a,b)=>b.d-a.d),{attr:a=>`data-av="${advLog.indexOf(a)}"`,mw:'900px',empty:'No advances.'});
  else{const D=dedLog.filter(x=>ymKey(x.d)===ym&&!x.bonus===(salTab==='ded')&&W().some(w=>w.id===x.sid)).sort((a,b)=>b.d-a.d);
    body=xTable([{t:'Worker',f:x=>{const w=workers.find(y=>y.id===x.sid);return `<b>${esc(w?w.name:'#'+x.sid)}</b>`}},{t:'Date',f:x=>fmtL(x.d)},{t:'Reason',f:x=>esc(x.reason||'')},{t:'By',f:x=>esc(x.by||'')},{t:'Amount',r:1,f:x=>x.bonus?`<span class="tgood">+ ${sar(x.amt)}</span>`:`<span class="tbad">− ${sar(x.amt)}</span>`},
      {t:'',f:x=>`<button class="btn sm" data-dx="${dedLog.indexOf(x)}" aria-label="Remove">${ico('x')}</button>`}],D,{empty:salTab==='ded'?'No deductions this month.':'No bonus this month.',foot:['Total','','','',`${salTab==='ded'?'−':'+'} ${sar(sumBy(D,x=>x.amt))}`,'']})}
  V(`<div class="panel"><div class="panel-h" style="flex-wrap:wrap;gap:8px"><h2>Salaries & advances</h2><span class="sp"></span>
      <label class="pfl">Month <select id="salYm">${monthOpts(ym,23,2)}</select></label>
      <button class="btn" id="salAdv">${ico('plus')} Advance</button><button class="btn" id="salDed">${ico('plus')} Deduction</button><button class="btn" id="salBon">${ico('plus')} Bonus</button>
      <button class="btn" id="salPrint">Print sheet</button><button class="btn" id="salSlips">Print all slips (A4)</button><button class="btn" id="salCsv">CSV</button></div>
     <div class="okpi" style="margin:4px 0 12px"><div><span>Workers</span><b>${R.length}</b></div><div><span>Salary + commission</span><b>${sar(T.earn)}</b><em>commission ${sar(T.comm)} · ${ymName(ym)}</em></div><div><span>Bonus</span><b class="tgood">${sar(T.bon)}</b></div><div><span>Advance cuts</span><b class="tbad">${sar(T.adv)}</b></div><div><span>Other deductions</span><b class="tbad">${sar(T.oth)}</b></div><div><span>Net to pay</span><b>${sar(T.net)}</b><em>SAR</em></div><div><span>Advances outstanding</span><b>${sar(out)}</b><em>${pl(advAll.filter(a=>advBal(a)>0).length,'advance')}</em></div></div>
     <div class="seg" style="margin-bottom:10px">${tab('sheet','Salary sheet')}${tab('adv','Advances')}${tab('ded','Deductions')}${tab('bon','Bonus')}</div>
     ${body}<p class="muted" style="font-size:12px;margin:8px 0 0">Tap a worker to set his advance cuts and deductions month by month.</p></div>`);
  const $=id=>document.getElementById(id);
  $('salYm').onchange=e=>{salYm=e.target.value;salaryView()};
  document.querySelectorAll('[data-st]').forEach(b=>b.onclick=()=>{salTab=b.dataset.st;salaryView()});
  document.querySelectorAll('[data-sw]').forEach(r=>r.onclick=()=>salDrawer(+r.dataset.sw));
  document.querySelectorAll('[data-av]').forEach(r=>r.onclick=()=>{const a=advLog[+r.dataset.av];if(a)salDrawer(a.sid)});
  document.querySelectorAll('[data-dx]').forEach(b=>b.onclick=e=>{e.stopPropagation();const i=+b.dataset.dx;if(i<0)return;const x=dedLog[i];dedLog.splice(i,1);toast(`Deduction removed (${sar(x.amt)} SAR)`);salaryView()});
  $('salAdv').onclick=()=>advForm();$('salDed').onclick=()=>dedForm();$('salBon').onclick=()=>dedForm(0,'bonus');
  $('salSlips').onclick=()=>printSlips(R.map(r=>r.w),ym);
  const lines=()=>R.map(r=>[r.w.name,roleText(r.w),bname(r.w.branch),payLabel(r.w),r.mp.qty,sar(r.mp.base),r.mp.comm?sar(r.mp.comm):'',r.bon?sar(r.bon):'',r.adv?sar(r.adv):'',r.oth?sar(r.oth):'',sar(r.mp.net),sar(advSummary(r.w).bal)||'']);
  const head=['Worker','Job','Branch','Pay type','Pcs','Salary','Commission','Bonus','Advance cut','Deductions','Net pay','Advance left'];
  $('salCsv').onclick=()=>csvOut(`salary-${ym}`,[head,...lines()]);
  $('salPrint').onclick=()=>printRep(`Salary sheet · ${ymName(ym)}`,`${curBranch?bname(curBranch):'All branches'} · printed ${fmtL(today)} by ${USER.name||''}`,
    pTiles([['Workers',R.length],['Salary',sar(T.base)],['Commission',sar(T.comm)],['Bonus',sar(T.bon)],['Advance cuts',sar(T.adv)],['Other deductions',sar(T.oth)],['Net to pay',sar(T.net)]])+pTable(head,lines(),['Total','','','',sumBy(R,r=>r.mp.qty),sar(T.base),sar(T.comm),sar(T.bon),sar(T.adv),sar(T.oth),sar(T.net),sar(out)],[4,5,6,7,8,9,10,11]));
}

/* one worker: pay of the month, his advances with the month-by-month cut plan, and deductions */
function salDrawer(sid,ym=salYm){
  const w=workers.find(x=>x.id===sid);if(!w)return;const mp=monthPay(w,ym),s=advSummary(w);
  const oth=mp.ded.filter(x=>!x.adv);
  const close=drawer(esc(w.name),`<div class="muted" style="font-size:13px">${esc(roleText(w))} · ${esc(bname(w.branch))} · ${esc(payLabel(w))}</div>`,
   `<div class="okpi" style="flex-shrink:0;grid-template-columns:repeat(auto-fit,minmax(140px,1fr))"><div><span>Salary + commission · ${ymName(ym)}</span><b>${sar(mp.earn)}</b><em>commission ${sar(mp.comm)}</em></div><div><span>Bonus</span><b class="tgood">${sar(mp.bonT)}</b></div><div><span>Deductions</span><b class="tbad">${sar(mp.dedT)}</b></div><div><span>Net pay</span><b>${sar(mp.net)}</b></div><div><span>Advance left</span><b>${sar(s.bal)}</b><em>of ${sar(s.total)}</em></div></div>
    <div><p class="h4">Work done · ${ymName(ym)} <span class="muted" style="font-weight:500">(${mp.qty} pcs)</span></p>${workHtml(w,mp)}</div>
    <div><p class="h4">Bonus · ${ymName(ym)}</p><div class="rows" style="border:1px solid var(--line);border-radius:8px">${mp.bon.map(x=>`<div class="row" style="padding-block:8px"><div class="grow"><b>${esc(x.reason||'Bonus')}</b><span>${fmtD(x.d)}${x.by?' · '+esc(x.by):''}</span></div><span class="num tgood" style="font-weight:600">+ ${sar(x.amt)}</span><button class="btn sm" data-sdx="${dedLog.indexOf(x)}" aria-label="Remove">${ico('x')}</button></div>`).join('')||'<div class="empty" style="padding:12px">No bonus this month.</div>'}</div>
     <div class="fgrid" style="margin-top:8px;grid-template-columns:110px 1fr auto;align-items:end"><div class="field"><label for="sbAmt">Bonus (SAR)</label><input id="sbAmt" type="number" min="1" class="num"></div><div class="field"><label for="sbWhy">Reason</label><input id="sbWhy" placeholder="Good work, Eid, extra hours…"></div><button class="btn" id="sbAdd">Add bonus</button></div></div>
    <div><p class="h4">Advances</p>${s.list.length?s.list.map(a=>{const i=advLog.indexOf(a);const ks=Object.keys(a.plan||{}).sort();const from=ks[0]||ymKey(today);
      const months=[];for(let k=0;k<Math.max(6,ks.length?(ymDiff(from,ks[ks.length-1])+2):6);k++)months.push(ymAdd(from,k));
      return `<div style="border:1px solid var(--line);border-radius:10px;padding:10px 12px;margin-bottom:10px"><div style="display:flex;gap:8px;align-items:baseline;flex-wrap:wrap"><b>${sar(a.amt)} SAR</b><span class="muted">taken ${fmtL(a.d)}${a.reason?' · '+esc(a.reason):''}${a.by?' · by '+esc(a.by):''}</span><span class="sp" style="flex:1"></span><span>Left <b>${sar(advBal(a))}</b></span></div>
       <div class="fgrid" style="grid-template-columns:repeat(auto-fill,minmax(118px,1fr));gap:6px;margin-top:8px">${months.map(m=>`<div class="field"><label style="font-size:11.5px">${ymName(m)}${m===ymKey(today)?' ·now':''}</label><input type="number" min="0" class="num" data-ap="${i}" data-am="${m}" value="${advCut(a,m)||''}" placeholder="0"></div>`).join('')}</div>
       <div class="muted" style="font-size:12px;margin-top:6px" id="apInfo${i}">Planned ${sar(advPlanned(a))} of ${sar(a.amt)} SAR${advPlanned(a)<a.amt?` · <span class="tbad">${sar(a.amt-advPlanned(a))} not planned yet</span>`:''}</div>
       <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px"><input type="number" min="1" class="num" id="apPer${i}" placeholder="SAR / month" style="width:120px"><select id="apFrom${i}">${monthOpts(from,6,12)}</select><button class="btn sm" data-aplan="${i}">Fill plan</button><span class="sp" style="flex:1"></span>${isOwner()?`<button class="btn sm" data-adel="${i}" style="color:var(--bad)">Delete advance</button>`:''}</div></div>`}).join(''):'<div class="empty" style="padding:12px">No advance taken.</div>'}
     <button class="btn sm" id="sdAdv">${ico('plus')} New advance</button></div>
    <div><p class="h4">Deductions · ${ymName(ym)}</p><div class="rows" style="border:1px solid var(--line);border-radius:8px">${mp.ded.map(x=>`<div class="row" style="padding-block:8px"><div class="grow"><b>${esc(x.reason||'Deduction')}</b><span>${fmtD(x.d)}${x.by?' · '+esc(x.by):''}</span></div><span class="num tbad" style="font-weight:600">− ${sar(x.amt)}</span>${x.adv?'':`<button class="btn sm" data-sdx="${dedLog.indexOf(x)}" aria-label="Remove">${ico('x')}</button>`}</div>`).join('')||'<div class="empty" style="padding:12px">No deductions this month.</div>'}</div>
     <div class="fgrid" style="margin-top:8px;grid-template-columns:110px 1fr 150px auto;align-items:end"><div class="field"><label for="sdAmt">Amount</label><input id="sdAmt" type="number" min="1" class="num"></div><div class="field"><label for="sdWhy">Reason</label><input id="sdWhy" placeholder="Absent, damage, fine…"></div><div class="field"><label for="sdYm">Month</label><select id="sdYm">${monthOpts(ym,6,12)}</select></div><button class="btn" id="sdAdd">Add</button></div></div>`,
   `<button class="btn pri" id="sdSave">Save cut plan</button><button class="btn" id="sdSlip">Print slip (A4)</button><button class="btn" id="sdWa">${ico('wa')} WhatsApp</button><button class="btn" id="sdClose">Close</button>`);
  const $=id=>document.getElementById(id);
  const readPlans=()=>{document.querySelectorAll('[data-ap]').forEach(i=>{const a=advLog[+i.dataset.ap];if(!a)return;a.plan={...(a.plan||{})};const v=+i.value||0;if(v>0)a.plan[i.dataset.am]=v;else delete a.plan[i.dataset.am]})};
  document.querySelectorAll('[data-ap]').forEach(i=>i.oninput=()=>{const a=advLog[+i.dataset.ap];const tot=sumBy([...document.querySelectorAll(`[data-ap="${i.dataset.ap}"]`)],x=>x.value);
    $('apInfo'+i.dataset.ap).innerHTML=`Planned ${sar(tot)} of ${sar(a.amt)} SAR${tot<a.amt?` · <span class="tbad">${sar(a.amt-tot)} not planned yet</span>`:tot>a.amt?` · <span class="tbad">${sar(tot-a.amt)} more than the advance</span>`:''}`});
  document.querySelectorAll('[data-aplan]').forEach(b=>b.onclick=()=>{const i=+b.dataset.aplan,a=advLog[i],per=+$('apPer'+i).value||0;if(per<=0){toast('Write how much to cut each month');return}
    readPlans();const start=$('apFrom'+i).value;const keep=Object.fromEntries(Object.entries(a.plan||{}).filter(([k])=>k<start));const left=(+a.amt||0)-Object.values(keep).reduce((s,v)=>s+v,0);
    a.plan={...keep,...makePlan(left,per,start)};toast('Plan filled');salDrawer(sid,ym)});
  document.querySelectorAll('[data-adel]').forEach(b=>b.onclick=()=>{const i=+b.dataset.adel;if(!confirmTwice(b))return;advLog.splice(i,1);toast('Advance deleted');salDrawer(sid,ym);if(location.hash==='#salary')salaryView()});
  document.querySelectorAll('[data-sdx]').forEach(b=>b.onclick=()=>{const i=+b.dataset.sdx;if(i<0)return;dedLog.splice(i,1);toast('Deduction removed');salDrawer(sid,ym)});
  $('sdAdd').onclick=()=>{const a=+$('sdAmt').value||0,why=$('sdWhy').value.trim(),m=$('sdYm').value;if(a<=0){toast('Enter the amount');return}if(!why){toast('Write the reason');return}
    readPlans();dedLog.push({sid:w.id,branch:w.branch,d:m===ymKey(today)?new Date(today):ymDate(m),amt:a,reason:why,by:USER.name||'Owner'});toast(`${sar(a)} SAR deducted · ${ymName(m)}`);salDrawer(sid,ym)};
  $('sdAdv').onclick=()=>{readPlans();advForm(w.id)};
  $('sbAdd').onclick=()=>{const a=+$('sbAmt').value||0,why=$('sbWhy').value.trim();if(a<=0){toast('Enter the bonus amount');return}
    readPlans();dedLog.push({sid:w.id,branch:w.branch,d:ym===ymKey(today)?new Date(today):ymDate(ym),amt:a,reason:why||'Bonus',bonus:true,by:USER.name||'Owner'});toast(`Bonus ${sar(a)} SAR · ${w.name}`);salDrawer(sid,ym)};
  $('sdSlip').onclick=()=>{readPlans();printSlips([w],ym)};
  $('sdWa').onclick=()=>{readPlans();slipWa(w,ym)};
  $('sdSave').onclick=()=>{readPlans();toast('Saved');close();if((location.hash||'').slice(1)==='salary')salaryView()};
  $('sdClose').onclick=()=>{close();if((location.hash||'').slice(1)==='salary')salaryView()};
}
const ymDiff=(a,b)=>{const x=ymDate(a),y=ymDate(b);return (y.getFullYear()-x.getFullYear())*12+y.getMonth()-x.getMonth()};
function confirmTwice(b){if(b.dataset.sure)return true;b.dataset.sure=1;b.textContent='Tap again to delete';setTimeout(()=>{delete b.dataset.sure},4000);return false}
const wOpts=sel=>W().filter(w=>okW(w)||w.status==='leave').sort((a,b)=>a.name.localeCompare(b.name)).map(w=>`<option value="${w.id}" ${w.id===sel?'selected':''}>${esc(w.name)} · ${esc(w.role)} · ${esc(bname(w.branch))}</option>`).join('');

/* new advance: amount, date, reason and how much to cut each month */
function advForm(sid){
  const close=drawer('New advance','<div class="muted" style="font-size:13px">Money given to a worker before salary. It is cut from his salary month by month.</div>',
   `<div class="fgrid"><div class="field" style="grid-column:1/-1"><label for="avW">Worker</label><select id="avW">${wOpts(sid)}</select></div>
    <div class="field"><label for="avAmt">Advance amount (SAR)</label><input id="avAmt" type="number" min="1" class="num"></div>
    <div class="field"><label for="avD">Date given</label><input id="avD" type="date" value="${dkey2(today)}"></div>
    <div class="field" style="grid-column:1/-1"><label for="avWhy">Reason</label><input id="avWhy" placeholder="Family need, ticket, iqama…"></div>
    <div class="field"><label for="avPer">Cut each month (SAR)</label><input id="avPer" type="number" min="1" class="num"></div>
    <div class="field"><label for="avFrom">Start cutting from</label><select id="avFrom">${monthOpts(ymKey(today),0,12)}</select></div>
    <div class="field" style="grid-column:1/-1"><div class="msg" id="avPrev" style="border-color:var(--brass)">Write the amount and the monthly cut to see the plan.</div></div></div>`,
   `<button class="btn pri" id="avSave">Save advance</button>`);
  const $=id=>document.getElementById(id);
  const prev=()=>{const p=makePlan($('avAmt').value,$('avPer').value,$('avFrom').value),e=Object.entries(p);
    $('avPrev').innerHTML=e.length?`<b>${e.length} month${e.length>1?'s':''}:</b> ${e.map(([k,v])=>`${ymName(k)} <b class="num">${sar(v)}</b>`).join(' · ')}<br><span class="muted" style="font-size:12px">You can change any month later from Salaries & advances.</span>`:'Write the amount and the monthly cut to see the plan.'};
  ['avAmt','avPer'].forEach(i=>$(i).oninput=prev);$('avFrom').onchange=prev;
  $('avSave').onclick=()=>{const w=workers.find(x=>x.id===+$('avW').value),amt=+$('avAmt').value||0;if(!w){toast('Choose the worker');return}if(amt<=0){toast('Enter the amount');return}
    advLog.push({sid:w.id,branch:w.branch,d:new Date(($('avD').value||dkey2(today))+'T00:00:00'),amt,reason:$('avWhy').value.trim(),by:USER.name||'Owner',plan:makePlan(amt,$('avPer').value,$('avFrom').value)});
    toast(`Advance ${sar(amt)} SAR · ${w.name}`);close();if((location.hash||'').slice(1)==='salary')salaryView();else salDrawer(w.id)};
}

/* deduction for one month, or the same amount for several months */
function dedForm(sid,kind){const B=kind==='bonus';
  const close=drawer(B?'Add bonus':'Add deduction',`<div class="muted" style="font-size:13px">${B?'Extra money added to the salary: good work, Eid, extra hours…':'Cut from salary: absent days, damage, fine, room rent…'}</div>`,
   `<div class="fgrid"><div class="field" style="grid-column:1/-1"><label for="dfW">Worker</label><select id="dfW">${wOpts(sid)}</select></div>
    <div class="field"><label for="dfAmt">Amount each month (SAR)</label><input id="dfAmt" type="number" min="1" class="num"></div>
    <div class="field"><label for="dfYm">Month</label><select id="dfYm">${monthOpts(salYm,6,12)}</select></div>
    <div class="field" style="grid-column:1/-1"><label for="dfWhy">Reason</label><input id="dfWhy" placeholder="${B?'Good work, Eid, extra hours…':'Absent 2 days, damaged fabric, room rent…'}"></div>
    <div class="field"><label for="dfN">Repeat for</label><select id="dfN">${[1,2,3,4,5,6,9,12].map(n=>`<option value="${n}">${n===1?'This month only':n+' months'}</option>`).join('')}</select></div></div>`,
   `<button class="btn pri" id="dfSave">Save</button>`);
  const $=id=>document.getElementById(id);
  $('dfSave').onclick=()=>{const w=workers.find(x=>x.id===+$('dfW').value),a=+$('dfAmt').value||0,why=$('dfWhy').value.trim(),n=+$('dfN').value||1;
    if(!w){toast('Choose the worker');return}if(a<=0){toast('Enter the amount');return}if(!why){toast('Write the reason');return}
    for(let k=0;k<n;k++){const m=ymAdd($('dfYm').value,k);dedLog.push({sid:w.id,branch:w.branch,d:m===ymKey(today)?new Date(today):ymDate(m),amt:a,reason:why+(n>1?` (${k+1}/${n})`:''),...(B?{bonus:true}:{}),by:USER.name||'Owner'})}
    toast(`${sar(a)} SAR ${B?'bonus':'deducted'}${n>1?` × ${n} months`:''} · ${w.name}`);close();if((location.hash||'').slice(1)==='salary')salaryView()};
}

/* worker's own app: his advance */
const _mypayAcct=mypay;mypay=function(){_mypayAcct();
  const w=ROLE==='tailor'?ME():(workers.find(x=>x.role==='Tailor'&&x.branch===(curBranch||4))||ME());if(!w)return;const s=advSummary(w);if(!s.list.length)return;
  const v=document.getElementById('view');const at=v.querySelector('.mebar');
  const html=`<div class="panel" id="myAdv" style="flex-shrink:0"><div class="panel-h"><h2>My advance</h2></div>
    <div class="okpi"><div><span>Advance taken</span><b>${sar(s.total)}</b><em>SAR</em></div><div><span>Paid back</span><b>${sar(s.paid)}</b><em>incl. this month</em></div><div><span>Still to pay</span><b class="${s.bal?'tbad':''}">${sar(s.bal)}</b><em>SAR</em></div><div><span>Cut this month</span><b>${sar(s.now)}</b><em>next month ${sar(s.next)}</em></div></div>
    ${s.list.filter(a=>advBal(a)>0||advCut(a,ymKey(today))).map(a=>`<div class="muted" style="font-size:12.5px;margin:8px 18px 12px"><b style="color:var(--ink)">${sar(a.amt)} SAR</b> taken ${fmtL(a.d)}${a.reason?' · '+esc(a.reason):''} — cuts: ${Object.entries(a.plan||{}).sort().filter(([k])=>k>=ymKey(today)).map(([k,v])=>`${ymName(k)} ${sar(v)}`).join(' · ')||'not planned yet'}</div>`).join('')}</div>`;
  if(at)at.insertAdjacentHTML('afterend',html);else v.insertAdjacentHTML('afterbegin',html)};

/* ---------- work done, salary slip (A4) and WhatsApp ---------- */
function workBy(mp){const by={};mp.ent.forEach(p=>{const k=p.stage||'sew';(by[k]=by[k]||{job:stageT(k),qty:0,os:new Set()});by[k].qty+=+p.qty||0;if(p.rno)by[k].os.add(p.rno)});return Object.values(by).map(x=>({job:x.job,qty:x.qty,orders:x.os.size}))}
function commLines(w,mp){
  if(mp.parts&&mp.parts.length)return mp.parts.map(x=>w.pay==='target'?[`${jobT(x.role)}: ${x.qty} pcs · target ${x.target} · ${x.extra} extra × ${x.comm}`,x.c]:[`${jobT(x.role)}: ${x.qty} pcs × ${x.rate}`,x.c]);
  if(w.pay==='target')return [[`${mp.qty} pcs · target ${w.target} · ${mp.extra} extra × ${w.comm}`,mp.comm]];
  if(w.pay==='piece')return [[`${mp.qty} pcs × ${w.rate} SAR`,mp.base]];
  return []}
function workHtml(w,mp){const wb=workBy(mp),cl=commLines(w,mp);
  return `<div class="rows" style="border:1px solid var(--line);border-radius:8px">${wb.map(x=>`<div class="row" style="padding-block:7px"><div class="grow"><b>${esc(x.job)}</b><span>${pl(x.orders,'order')}</span></div><span class="num" style="font-weight:600">${x.qty} pcs</span></div>`).join('')||'<div class="empty" style="padding:12px">No work entered this month.</div>'}</div>
   ${cl.length?`<div class="muted" style="font-size:12.5px;margin-top:6px">${cl.map(([t,v])=>`${esc(t)} = <b style="color:var(--ink)">${sar(v)} SAR</b>`).join('<br>')}</div>`:''}`}
function slipData(w,ym){const mp=monthPay(w,ym),s=advSummary(w);
  const earn=[[w.pay==='target'?'Basic salary':w.pay==='piece'?'Pieces pay':'Monthly salary',mp.base]];
  if(mp.comm)earn.push(['Commission',mp.comm]);mp.bon.forEach(x=>earn.push([`Bonus${x.reason&&x.reason!=='Bonus'?' · '+x.reason:''}`,x.amt]));
  return{mp,s,earn,cuts:mp.ded.map(x=>[x.reason||'Deduction',x.amt]),wb:workBy(mp),cl:commLines(w,mp)}}
function slipHtml(w,ym){const D=slipData(w,ym),mp=D.mp,co=SHOP.CompanyEn||'AL THOB AL SAUDI';
  const tr=(a,b,c)=>`<tr><td>${esc(a)}</td><td class="n">${c||''}${sar(b)}</td></tr>`;
  return `<section class="pg"><header><img src="${logoSrc()}" alt=""><div><h1>${esc(co)}</h1><div>${esc(SHOP.CompanyAr||'')}</div><div class="m">${esc([SHOP.Address,SHOP.Phone].filter(Boolean).join(' · '))}</div></div><div class="tt"><b>SALARY SLIP</b><span>كشف الراتب</span><span>${esc(ymName(ym))}</span></div></header>
   <table class="info"><tr><th>Name · الاسم</th><td>${esc(w.name)}</td><th>Staff no.</th><td>${w.id}</td></tr><tr><th>Job · الوظيفة</th><td>${esc(roleText(w))}</td><th>Branch · الفرع</th><td>${esc(bname(w.branch))}</td></tr>
    <tr><th>Pay type</th><td>${esc(payLabel(w))}</td><th>Mobile</th><td>${esc(w.phone||'')}</td></tr></table>
   <h2>Work done · العمل</h2><table><thead><tr><th>Job</th><th class="n">Orders</th><th class="n">Pieces</th></tr></thead><tbody>${D.wb.map(x=>`<tr><td>${esc(x.job)}</td><td class="n">${x.orders}</td><td class="n">${x.qty}</td></tr>`).join('')||'<tr><td colspan="3">No work entered.</td></tr>'}</tbody><tfoot><tr><td>Total</td><td></td><td class="n">${mp.qty}</td></tr></tfoot></table>
   ${D.cl.length?`<p class="cl">${D.cl.map(([t,v])=>`${esc(t)} = <b>${sar(v)} SAR</b>`).join('<br>')}</p>`:''}
   <div class="two"><div><h2>Earnings · المستحقات</h2><table><tbody>${D.earn.map(([a,b])=>tr(a,b)).join('')}</tbody><tfoot><tr><td>Total</td><td class="n">${sar(mp.earn+mp.bonT)}</td></tr></tfoot></table></div>
    <div><h2>Deductions · الخصومات</h2><table><tbody>${D.cuts.map(([a,b])=>tr(a,b,'− ')).join('')||'<tr><td colspan="2">None</td></tr>'}</tbody><tfoot><tr><td>Total</td><td class="n">− ${sar(mp.dedT)}</td></tr></tfoot></table></div></div>
   <div class="net"><span>NET PAY · صافي الراتب</span><b>${sar(mp.net)} SAR</b></div>
   ${D.s.total?`<p class="adv">Advance: taken ${sar(D.s.total)} · paid back ${sar(D.s.paid)} · <b>still to pay ${sar(D.s.bal)} SAR</b>${D.s.next?` · next month cut ${sar(D.s.next)}`:''}</p>`:''}
   <div class="sig"><div>Prepared by · ${esc(USER.name||'')}</div><div>Worker signature · توقيع العامل</div><div>Approved · المعتمد</div></div>
   <p class="ft">Printed ${fmtL(today)}</p></section>`}
function printSlips(ws,ym){if(!ws.length){toast('No workers');return}const x=window.open('','_blank');if(!x){toast('Allow pop-ups to print');return}
  x.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Salary slips ${esc(ymName(ym))}</title><style>
   body{font:12px Arial,sans-serif;color:#111;margin:0}.pg{padding:14mm 14mm 10mm;page-break-after:always;min-height:260mm;box-sizing:border-box}.pg:last-child{page-break-after:auto}
   header{display:flex;gap:14px;align-items:center;border-bottom:2px solid #13213c;padding-bottom:10px;margin-bottom:12px}header img{height:64px}header h1{margin:0;font-size:19px;color:#13213c}header .m{color:#555;font-size:11px}
   .tt{margin-left:auto;text-align:right;display:flex;flex-direction:column}.tt b{font-size:18px;color:#b08a2e;letter-spacing:.06em}
   h2{font-size:13px;margin:14px 0 6px;color:#13213c}table{border-collapse:collapse;width:100%}th,td{border:1px solid #bbb;padding:5px 8px;text-align:left}th{background:#eef0f5}td.n,th.n{text-align:right}tfoot td{font-weight:700;background:#f4f4f4}
   .info th{width:18%}.two{display:grid;grid-template-columns:1fr 1fr;gap:14px}.cl{color:#444;font-size:11.5px;margin:6px 0 0}
   .net{margin-top:16px;border:2px solid #13213c;background:#13213c;color:#fff;display:flex;justify-content:space-between;align-items:center;padding:10px 14px;font-size:14px}.net b{font-size:20px;color:#f0d38a}
   .adv{margin-top:10px;border:1px dashed #b08a2e;padding:8px 10px}.sig{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-top:46px}.sig div{border-top:1px solid #333;padding-top:5px;text-align:center;font-size:11px}
   .ft{color:#777;font-size:10px;margin-top:16px}@page{size:A4;margin:0}</style></head><body>${ws.map(w=>slipHtml(w,ym)).join('')}<script>setTimeout(()=>print(),500)<\/script></body></html>`);x.document.close()}
function slipText(w,ym){const D=slipData(w,ym),mp=D.mp;
  return [`*${SHOP.CompanyEn||'AL THOB AL SAUDI'}*`,`Salary slip · ${ymName(ym)}`,``,`Name: ${w.name}`,`Job: ${roleText(w)} · ${bname(w.branch)}`,``,
    `*Work done: ${mp.qty} pcs*`,...D.wb.map(x=>`- ${x.job}: ${x.qty} pcs`),...D.cl.map(([t,v])=>`  ${t} = ${sar(v)}`),``,
    `*Earnings*`,...D.earn.map(([a,b])=>`+ ${a}: ${sar(b)}`),
    ...(D.cuts.length?[``,`*Deductions*`,...D.cuts.map(([a,b])=>`- ${a}: ${sar(b)}`)]:[]),``,
    `*NET PAY: ${sar(mp.net)} SAR*`,...(D.s.total?[`Advance still to pay: ${sar(D.s.bal)} SAR`]:[])].join('\n')}
function slipWa(w,ym){const n=waNum(w.phone);if(!n){toast(`${w.name}: no mobile number – add it in Workers`);return}
  window.open(`https://wa.me/${n}?text=${encodeURIComponent(slipText(w,ym))}`,'_blank')}
