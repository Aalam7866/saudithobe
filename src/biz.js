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
