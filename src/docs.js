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
const pgSearch=ph=>`<label class="search pgs"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><input id="pgQ" placeholder="${esc(ph)}" value="${esc(document.getElementById('q').value)}" autocomplete="off" type="search"></label>`;
function bindPgSearch(){const i=document.getElementById('pgQ');if(!i)return;
  i.oninput=()=>{const q=document.getElementById('q');q.value=i.value;q.dispatchEvent(new Event('input'));const n=document.getElementById('pgQ');if(n&&n!==i){n.focus();n.setSelectionRange(n.value.length,n.value.length)}}}
