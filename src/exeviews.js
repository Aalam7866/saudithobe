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
   xTable([{t:'Order',f:o=>`<b class="num">#${o.rno}</b>`},{t:'Customer',f:o=>esc(cust(o.cid).name)},{t:'Booked',f:o=>fmtD(o.created)},{t:'Delivery',f:o=>`<span class="${late(o)?'tbad':''}">${fmtD(o.due)}</span>`},{t:'Pcs',r:1,f:o=>o.qty},
     ...(money?[{t:'Total',r:1,f:o=>sar2(o.total)},{t:'Due',r:1,f:o=>sar2(o.total-o.paid)}]:[]),{t:'Status',f:o=>{const x=oInfo(o);return `<span class="pill ${WHERE_C(x.where)}">${esc(x.where)}</span>${x.status==='Late'?' <span class="pill s-late">Late</span>':''}`}}],
     list.slice(0,500),{attr:o=>`data-lr="${o.rno}"`,h:'calc(100vh - 220px)',empty:'No orders.'}),'');
  document.querySelectorAll('[data-lr]').forEach(r=>r.onclick=()=>{close();openOrder(+r.dataset.lr)});
}
function payListDrawer(title,list){
  drawer(title,`<div class="muted" style="font-size:13px">${pl(list.length,'payment')} · ${sar2(sumBy(list,p=>p.amt))} SAR</div>`,
   xTable([{t:'Date',f:p=>fmtD(p.d)},{t:'Order',f:p=>`<b class="num">#${p.rno}</b>`},{t:'Customer',f:p=>{const o=orders.find(x=>x.rno===p.rno);return o?esc(cust(o.cid).name):'—'}},{t:'Type',f:p=>p.amt<0?'Refund':p.t==='Deposit'?'Down payment':'Due payment'},{t:'Method',f:p=>esc(pmName(p))},{t:'Amount',r:1,f:p=>`<b>${sar2(p.amt)}</b>`}],
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
  V(`<div class="rowtools"><button class="btn" id="dashBack">${ico('dash')}Simple dashboard</button><h2 style="margin:0;font-size:17px">Shop dashboard <span class="muted" style="font-weight:500;font-size:13px">· same as AL THOB exe · ${esc(B?bname(B):'All branches')}</span></h2><span class="sp"></span><button class="btn" id="dashPrint">Print</button></div>
  <div class="panel"><div class="panel-b" style="padding:12px 16px">${perBar('dashPer',P)}<div class="muted" style="font-size:12.5px;margin-top:8px">${perLabel(P)} · ${pl(perDays(P),'day')} · tap any box to see the list</div></div></div>
  <p class="h4" style="margin:4px 0 -8px">Money & orders</p>
  <div class="okpi">
   ${money?T('sales','Sales booked',`${sar(sumBy(booked,o=>o.total))}<small>SAR</small>`,`${pl(booked.length,'order')} · VAT ${sar(vat)}`):''}
   ${money?T('coll','Collected',`${sar(sumBy(coll,p=>p.amt))}<small>SAR</small>`,`Down ${sar(sumBy(coll.filter(p=>p.t==='Deposit'),p=>p.amt))} · Due ${sar(sumBy(coll.filter(p=>p.t!=='Deposit'),p=>p.amt))}`,'okc'):''}
   ${money?T('due','All customers due',`${sar(sumBy(dueAll,o=>o.total-o.paid))}<small>SAR</small>`,`${pl(dueAll.length,'order')} unpaid`,'bad'):''}
   ${money?T('ref','Refunds',`${sar(Math.abs(sumBy(refs,p=>p.amt)))}<small>SAR</small>`,pl(refs.length,'refund')):''}
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
  perBind('dashPer',P,shopDash);
  document.querySelectorAll('[data-dk]').forEach(t=>{const go=()=>{const k=t.dataset.dk;if(k==='coll')return payListDrawer('Collected · '+perLabel(P),coll);if(k==='ref')return payListDrawer('Refunds · '+perLabel(P),refs);const [ti,list]=L[k];orderListDrawer(`${ti} · ${k==='due'||k==='open'||k==='late'?'now':perLabel(P)}`,list.slice().sort((a,b)=>k==='due'?(b.total-b.paid)-(a.total-a.paid):b.created-a.created),money)};t.onclick=go;t.onkeydown=e=>{if(e.key==='Enter')go()}});
  const body=()=>{const el=$('dashTabBody');let h='';
    if(dashTab==='due'){const g={};dueAll.forEach(o=>{const x=g[o.cid]=g[o.cid]||{c:cust(o.cid),n:0,t:0,d:0,last:o.created};x.n++;x.t+=o.total;x.d+=o.total-o.paid;if(o.created>x.last)x.last=o.created});
      const r=Object.values(g).sort((a,b)=>b.d-a.d);h=xTable([{t:'Customer',f:x=>`<b>${esc(x.c.name)}</b>`},{t:'Mobile',f:x=>`<span class="num">${esc(x.c.phone||'')}</span>`},{t:'Orders',r:1,f:x=>x.n},{t:'Last order',f:x=>fmtD(x.last)},...(money?[{t:'Order total',r:1,f:x=>sar2(x.t)},{t:'Due',r:1,f:x=>`<b class="tbad">${sar2(x.d)}</b>`}]:[])],r,{attr:x=>`data-dc="${x.c.id}"`,h:'460px',empty:'No customer owes money.',foot:['Total',r.length+' customers',sumBy(r,x=>x.n),'',...(money?[sar2(sumBy(r,x=>x.t)),sar2(sumBy(r,x=>x.d))]:[])]})}
    else if(dashTab==='late'){const r=lateL.slice().sort((a,b)=>a.due-b.due);h=xTable([{t:'Order',f:o=>`<b class="num">#${o.rno}</b>`},{t:'Customer',f:o=>esc(cust(o.cid).name)},{t:'Delivery date',f:o=>fmtD(o.due)},{t:'Days late',r:1,f:o=>`<b class="tbad">${-daysLeft(o)}</b>`},{t:'Pcs',r:1,f:o=>o.qty},{t:'Cut',r:1,f:o=>I(o).cut},{t:'Stitched',r:1,f:o=>I(o).sew},{t:'Made at',f:o=>esc(bname(o.made))},{t:'Tailor',f:o=>esc(o.tailor?wk(o.tailor).name:'—')}],r,{attr:o=>`data-lr="${o.rno}"`,h:'460px',empty:'Nothing late. 👍'})}
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
    el.querySelectorAll('[data-dc]').forEach(r=>r.onclick=()=>{selCust=+r.dataset.dc;location.hash='customers'});
    el.querySelectorAll('[data-pd2]').forEach(r=>r.onclick=()=>{const k=r.dataset.pd2;const os=open.filter(o=>o.st!=='ready'&&(k==='late'?o.due<today:dkey2(o.due)===k));orderListDrawer(k==='late'?'Late, not ready':'Due '+fmtL(pDate(k)),os,money)})};
  document.querySelectorAll('[data-dt]').forEach(b=>b.onclick=()=>{dashTab=b.dataset.dt;document.querySelectorAll('[data-dt]').forEach(x=>x.classList.toggle('on',x===b));body()});
  body();
  $('dashPrint').onclick=()=>printRep('Shop dashboard',`${B?bname(B):'All branches'} · ${perLabel(P)}`,pTiles([...(money?[['Sales booked',sar2(sumBy(booked,o=>o.total))],['Collected',sar2(sumBy(coll,p=>p.amt))],['All customers due',sar2(sumBy(dueAll,o=>o.total-o.paid))],['Refunds',sar2(Math.abs(sumBy(refs,p=>p.amt)))]]:[]),
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
    rows.push({o,inv:o.invoiceNo||'',rno:p.rno,name:o.cid?cust(o.cid).name:'—',tot:p.t==='Deposit'?o.total||0:0,down:p.amt>0&&p.t==='Deposit'?p.amt:0,due:p.amt>0&&p.t!=='Deposit'?p.amt:0,disc:p.t==='Deposit'?(o.disc||0):0,ref:p.amt<0?-p.amt:0,m:pmName(p),type:p.amt<0?'Refund':p.t==='Deposit'?'New order':dq?'Delivery + payment':'Due payment',dq,rc:p.ref||'',user:p.by||(p.exe?'Shop exe':''),br:p.branch})});
  booked.filter(o=>!pays.some(p=>p.rno===o.rno&&p.t==='Deposit')).forEach(o=>rows.push({o,inv:o.invoiceNo||'',rno:o.rno,name:cust(o.cid).name,tot:o.total,down:0,due:0,disc:o.disc||0,ref:0,m:'',type:'New order (no payment)',dq:0,rc:'',user:o.by||'',br:o.branch}));
  dels.filter(d=>!usedDel.has(d)).forEach(d=>{const o=orders.find(x=>x.rno===d.rno)||{};rows.push({o,inv:o.invoiceNo||'',rno:d.rno,name:o.cid?cust(o.cid).name:'—',tot:0,down:0,due:0,disc:0,ref:0,m:'',type:'Delivery',dq:d.qty,rc:'',user:d.by||'',br:d.branch})});
  rows.sort((a,b)=>a.rno-b.rno);
  const coll=sumBy(pays.filter(p=>p.amt>0),p=>p.amt),ref=-sumBy(pays.filter(p=>p.amt<0),p=>p.amt);
  const cashIn=sumBy(pays.filter(p=>/cash/i.test(pmName(p))),p=>p.amt);
  const byM={},byU={};pays.forEach(p=>{const m=pmName(p)||'Other',u=p.by||(p.exe?'Shop exe':'—');byM[m]=(byM[m]||0)+p.amt;(byU[u]=byU[u]||{n:0,a:0}).n++;byU[u].a+=p.amt});
  const touched=new Set(rows.map(r=>r.rno)).size;
  const tiles=[['Report for',D.toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})],['New orders / pcs',`${booked.length} / ${sumBy(booked,o=>o.qty)}`],['Sales value',sar2(sumBy(booked,o=>o.total))],['Collected',sar2(coll)],['Refunds',sar2(ref)],['Net cash',sar2(cashIn)],['Pieces delivered',sumBy(dels,d=>d.qty)],['Orders touched',touched]];
  const cols=[['Invoice',r=>esc(r.inv)],['Order No',r=>`<b class="num">${r.rno}</b>`],['Name',r=>esc(r.name)],['Order Total',r=>r.tot?sar2(r.tot):'',1],['Down Payment',r=>r.down?sar2(r.down):'',1],['Paid Due',r=>r.due?sar2(r.due):'',1],['Discount',r=>r.disc?sar2(r.disc):'',1],['Refund',r=>r.ref?`<span class="tbad">${sar2(r.ref)}</span>`:'',1],['Method',r=>esc(r.m)],['Type',r=>esc(r.type)],['Delivered Pcs',r=>r.dq||'',1],['Receipt',r=>esc(r.rc)],['User',r=>esc(r.user)],...(B?[]:[['Branch',r=>esc(bname(r.br))]])];
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
  const H=cols.map(c=>c[0]),plain=r=>[r.inv,r.rno,r.name,r.tot?sar2(r.tot):'',r.down?sar2(r.down):'',r.due?sar2(r.due):'',r.disc?sar2(r.disc):'',r.ref?sar2(r.ref):'',r.m,r.type,r.dq||'',r.rc,r.user,...(B?[]:[bname(r.br)])];
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
   ${xTable([{t:'Worker',f:x=>`<b>${esc(x.w.name)}</b>`},{t:'Job',f:x=>esc(x.w.role==='Cutter'?'Cutting':x.w.role)},{t:'Branch / factory',f:x=>esc(bname(x.w.branch))},{t:'Present',f:x=>{const a=att(x.w);return a==='a'?'<span class="tbad">Absent</span>':a==='o'?'<span class="muted">Off</span>':a?'Yes':''}},...ks.map(k=>({t:stageT(k),r:1,f:x=>x.q[k]||''})),{t:'Total pcs',r:1,f:x=>`<b>${x.t||'—'}</b>`},{t:'Orders',f:x=>x.n.size?`<span class="num muted">${[...x.n].slice(0,8).map(n=>'#'+n).join(' ')}${x.n.size>8?' …':''}</span>`:''}],
     rows,{attr:x=>`data-ow="${x.w.id}"`,h:'calc(100vh - 380px)',empty:'No workshop work on this day.',foot:['Total','','','',...ks.map(k=>S(k)),sumBy(rows,x=>x.t),'']})}</div>
  <div class="grid2" style="grid-template-columns:1fr 1fr">
   <div class="panel"><div class="panel-h"><h2>By branch & factory</h2></div>${xTable([{t:'Place',f:x=>`${bTag(x.b.id)} <b>${esc(x.b.name)}</b>`},...ks.map(k=>({t:stageT(k),r:1,f:x=>x.q[k]||''}))],byPlace,{empty:'No work.'})}</div>
   <div class="panel"><div class="panel-h"><h2>Finished this day</h2><span class="sp"></span><span class="muted" style="font-size:12px">Ready for pickup or delivered</span></div>${xTable([{t:'Order',f:o=>`<b class="num">#${o.rno}</b>`},{t:'Customer',f:o=>esc(cust(o.cid).name)},{t:'Pcs',r:1,f:o=>o.qty},{t:'Delivery',f:o=>fmtD(o.due)},{t:'Branch',f:o=>esc(bname(o.branch))}],readyToday,{attr:o=>`data-lr="${o.rno}"`,empty:'No order finished.'})}</div>
  </div>`);
  dayNavBind();
  document.querySelectorAll('#view [data-ow]').forEach(r=>r.onclick=()=>{const P=perGet('w');Object.assign(P,perMake('day',D));openWorker(+r.dataset.ow)});
  document.querySelectorAll('#view [data-lr]').forEach(r=>r.onclick=()=>openOrder(+r.dataset.lr));
  const H=['Worker','Job','Branch','Present',...ks.map(stageT),'Total pcs','Orders'],plain=x=>[x.w.name,x.w.role,bname(x.w.branch),att(x.w)==='a'?'Absent':att(x.w)==='o'?'Off':'Yes',...ks.map(k=>x.q[k]||''),x.t,[...x.n].join(' ')];
  document.getElementById('dtCsv').onclick=()=>csvOut(`tailoring_report_${dkey2(D)}`,[H,...rows.map(plain)]);
  document.getElementById('dtPrint').onclick=()=>printRep('Tailoring report',`${B?bname(B):'All branches & factories'} · ${D.toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}`,
    pTiles([...ks.map(k=>[stageT(k),S(k)+' pcs']),['Orders finished',readyToday.length],['Sent to factory',sent.length]])+pTable(H,rows.map(plain),['Total','','','',...ks.map(k=>S(k)),sumBy(rows,x=>x.t),''],ks.map((k,i)=>4+i).concat([4+ks.length]))
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
   ${xTable([{t:'Date',f:x=>`<b>${x.d.toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short'})}</b>`},...(ks.length>1?ks.map(k=>({t:stageT(k),r:1,f:x=>x.q[k]||''})):[]),{t:'Pcs',r:1,f:x=>`<b>${x.t}</b>`},{t:'Orders',f:x=>`<span class="num muted">${[...x.n].slice(0,6).map(n=>'#'+n).join(' ')}${x.n.size>6?' …':''}</span>`}],dl,{h:'300px',empty:'No work in this period.',foot:dl.length?['Total',...(ks.length>1?ks.map(k=>sumBy(ent.filter(p=>p.stage===k),p=>p.qty)):[]),tot,os.size+' orders']:null})}
   ${ent.some(p=>p.rno)?`<p class="h4" style="margin:12px 0 6px">Orders worked on</p>${xTable([{t:'Date',f:p=>fmtD(p.d)},{t:'Order',f:p=>`<b class="num">#${p.rno}</b>`},{t:'Customer',f:p=>{const o=orders.find(x=>x.rno===p.rno);return o?esc(cust(o.cid).name):'—'}},{t:'Work',f:p=>stageT(p.stage)},{t:'Pcs',r:1,f:p=>p.qty}],ent.filter(p=>p.rno).slice(0,300),{attr:p=>`data-r="${p.rno}"`,h:'300px'})}`:''}`}
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
