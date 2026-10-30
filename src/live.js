
/* =====================================================================================
   LIVE MODE  ·  Firebase (Auth + Firestore)
   Everything above renders from plain arrays (BRANCHES, workers, customers, orders, ...).
   Here those arrays are filled from Firestore in real time, and every change the screens
   make to them is written back by flush() (field-level diff, so two people editing the
   same order at once do not overwrite each other).
   ===================================================================================== */
const COL={branches:BRANCHES,staff:workers,customers,orders,payments:payLog,deliveries:delLog,prod:prodLog,notices,ded:dedLog,items:STOCK,emb:EMBL};
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
    if(col==='items'||col==='emb')continue;          // the shop exe's lists: never written from here
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
    if(col==='ded')for(const id of [...synced.ded.keys()])if(!seen.has(id)){await fb.deleteDoc(fb.doc(db,'ded',id));synced.ded.delete(id)}
  }
}
async function createOrder(o){
  const {doc,runTransaction}=fb;let rno=o.rno;const old=o.rno;
  await runTransaction(db,async tx=>{
    for(let i=0;i<50;i++){const s=await tx.get(doc(db,'orders',String(rno)));if(!s.exists())break;rno++}
    o.rno=rno;tx.set(doc(db,'orders',String(rno)),{...plain('orders',o),upd:new Date()})});
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
  if(col==='orders'){x.t={cut:'wait',sew:'wait',hinge:'wait',tat:'wait',iron:'wait',...(x.t||{})};x.tw=x.tw||{};x.design={...Object.fromEntries(DESIGN_.map(g=>[g.k,g.opts[0][0]])),...(x.design||{})};
    if(x.profile==null)x.profile=0;if(x.made==null)x.made=x.branch;if(x.tailor==null)x.tailor=0;if(x.fabric==null)x.fabric='';if(x.note==null)x.note='';if(!(x.created instanceof Date))x.created=today;if(!(x.due instanceof Date))x.due=x.created}
  if(col==='customers'){if(!Array.isArray(x.profiles)||!x.profiles.length)x.profiles=[{name:'Self',m:{}}];x.profiles.forEach(p=>{p.m=p.m||{}});x.hist=x.hist||[];if(x.phone==null)x.phone=''}
  if(col==='staff'){if(!(x.joined instanceof Date))x.joined=today;if(x.status==null)x.status='active';if(x.phone==null)x.phone='';if(x.nat==null)x.nat='';['rate','basic','target','comm'].forEach(k=>{if(x[k]==null)x[k]=0});if(!x.pay)x.pay='salary';if(x.iqama===undefined)x.iqama=null}
  if(col==='payments'||col==='deliveries'||col==='prod'||col==='ded'){if(!(x.d instanceof Date))x.d=today}
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
  unsubs.push(onSnapshot(query(collection(db,'att'),where('d','>=',dkey(since(14)))),s=>{ATT.clear();s.forEach(x=>{const d=x.data();ATT.set(x.id,d.v)});applyAtt();rerender()},()=>{}));
  if(ROLE==='owner'||ROLE==='manager'||isFactoryLogin())unsubs.push(onSnapshot(ROLE==='owner'?collection(db,'keys'):query(collection(db,'keys'),where('branch','==',USER.branch)),s=>{s.forEach(x=>KEYS[x.id]=x.data().k)},()=>{}));
}

/* ---------- sign in ---------- */
const params=new URLSearchParams(location.search);
const U=params.get('u'),K=params.get('k');
function loginShell(inner){
  let L=document.getElementById('login');if(!L){L=document.createElement('div');L.className='login';L.id='login';document.body.appendChild(L)}
  L.innerHTML=`<div class="login-in" style="max-width:460px">
   <div class="login-top"><div class="mark">ST</div><div><h1 style="font-size:26px">Saudi Thobe</h1><p class="lead">saudithobe.men</p></div></div>
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
