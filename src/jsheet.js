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
