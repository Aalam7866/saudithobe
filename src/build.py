"""Builds the site from the demo core + the live layer.
   src/core.js  : the demo screens (copied from the approved demo)
   src/live.js  : Firebase layer
   src/head.html: styles + page markup
   -> index.html, app.js
"""
import re, sys, pathlib
SRC = pathlib.Path(__file__).parent
ROOT = SRC.parent
s = (SRC / 'core.js').read_text()

def R(a, b, n=1):
    global s
    c = s.count(a)
    if c < 1:
        sys.exit(f'NOT FOUND: {a[:110]}')
    if n == 'all':
        s = s.replace(a, b)
    else:
        s = s.replace(a, b, 1)

# ---- module, demo switch -------------------------------------------------------------
R('<script>\n(function(){\n', "import { FIREBASE_CONFIG } from './config.js';\nconst DEMO=new URLSearchParams(location.search).has('demo')||!FIREBASE_CONFIG.apiKey;const LIVE=!DEMO;\n")
s = s.rstrip()
assert s.endswith('})();\n</script>') or s.endswith('})();</script>') or s.endswith('</script>'), s[-40:]
s = s[: s.rfind('})();')]

# demo data only in demo
R("const BRANCHES=[\n {id:1", "const BRANCHES=!DEMO?[]:[\n {id:1")
R("const workers=WNAMES.map(", "const workers=!DEMO?[]:WNAMES.map(")
R("const STOCK=FABRICS.map(", "const STOCK=!DEMO?[]:FABRICS.map(")
R("const EMBL=[{code:1,", "const EMBL=!DEMO?[]:[{code:1,")
R("const customers=NAMES.map(", "const customers=!DEMO?[]:NAMES.map(")
R("for(let i=0;i<64;i++){", "for(let i=0;i<(DEMO?64:0);i++){")
R("[[1,380,'Cash'],[1,520,'Card (mada)'],[2,260,'Cash'],[1,190,'Transfer'],[3,440,'Card (mada)']].forEach(", "(DEMO?[[1,380,'Cash'],[1,520,'Card (mada)'],[2,260,'Cash'],[1,190,'Transfer'],[3,440,'Card (mada)']]:[]).forEach(")
R("for(let k=1;k<14;k++){const d=addD(today,-k);if(d.getDay()===5)continue;", "for(let k=1;k<(DEMO?14:0);k++){const d=addD(today,-k);if(d.getDay()===5)continue;")
R("for(let k=0;k<14;k++){const d=addD(today,-k);if(d.getDay()===5)continue;\n  workers.forEach(", "for(let k=0;k<(DEMO?14:0);k++){const d=addD(today,-k);if(d.getDay()===5)continue;\n  workers.forEach(")

# ids that must not collide
R("Math.max(...orders.map(o=>o.rno))+1", "Math.max(1000,...orders.map(o=>o.rno))+1")
R("cid=customers.length+1;", "cid=Math.max(0,...customers.map(c=>c.id))+1;")
R("const t=w||{id:workers.length+1,", "const t=w||{id:Math.max(0,...workers.filter(x=>!x.exeEmp&&x.id<100000).map(x=>x.id))+1,")
R("const t=b||{id:Math.max(...BRANCHES.map(x=>x.id))+1};", "const t=b||{id:Math.max(0,...BRANCHES.map(x=>x.id))+1};")
R("const n={id:notices.length+1,", "const n={id:DEMO?notices.length+1:Math.random().toString(36).slice(2,12),")
R("notices.find(x=>x.id===+b.dataset.popOk)", "notices.find(x=>String(x.id)===b.dataset.popOk)")
R("notices.find(x=>x.id===+b.dataset.popOpen)", "notices.find(x=>String(x.id)===b.dataset.popOpen)")

# who is signed in
R("let ROLE='owner',USER=USERS[0];", "let ROLE='owner',USER=DEMO?USERS[0]:{role:'owner',name:'',branch:0};")
R("const isFactoryLogin=()=>ROLE==='tailor'&&isFac(USER.branch);", "const isFactoryLogin=()=>ROLE==='tailor'&&isFac(USER.branch)&&(DEMO||USER.job==='Factory supervisor');")
R("const ME=()=>workers.find(w=>w.name===USER.name)||", "const ME=()=>(LIVE&&workers.find(w=>w.id===USER.sid))||workers.find(w=>w.name===USER.name)||")
R("const demoNote='<div class=\"demo\">", "const demoNote=!DEMO?'':'<div class=\"demo\">")
R('<div class="demo"><span class="tag">Demo data</span> ${dayLabel}', '<div class="demo">${DEMO?\'<span class="tag">Demo data</span> \':\'\'}${dayLabel}')
R("toast('Demo: the day total will be locked and sent to the owner')", "toast(DEMO?'Demo: the day total will be locked and sent to the owner':'Day closed. The owner can see it in the daily report')")
R("Demo preview. The Install button works on the real saudithobe.men site; inside this preview it only shows the steps.", "${DEMO?'Demo preview. The Install button works on the real saudithobe.men site; inside this preview it only shows the steps.':''}")

# month pieces from the real workshop log
R("const doneQ=(w.mdone||0)+month.reduce((s,o)=>s+o.qty,0);",
  "const doneQ=LIVE?prodLog.filter(p=>p.w===w.id&&p.stage==='sew'&&p.d.getMonth()===today.getMonth()&&p.d.getFullYear()===today.getFullYear()).reduce((s,p)=>s+p.qty,0):(w.mdone||0)+month.reduce((s,o)=>s+o.qty,0);")

# add worker: real login
R("$('wSave').onclick=()=>{const n=$('wName').value.trim();", "$('wSave').onclick=async()=>{const n=$('wName').value.trim();")
R("if(!w)workers.push(t);close();toast(w?'Changes saved':`${n} added to ${bname(t.branch)}`);",
  "if(!w){if(LIVE){const sb=$('wSave');sb.disabled=true;sb.textContent='Creating login…';try{t.login=jobLogin(t.role);await createStaff(t);workers.push(t)}catch(e){sb.disabled=false;sb.textContent='Add worker';toast('Could not add: '+(e.code||e.message));return}}else workers.push(t)}close();toast(w?'Changes saved':`${n} added to ${bname(t.branch)}`);")

# add branch: real logins
R("$('bSave').onclick=()=>{const n=$('bName').value.trim(),c=$('bCode').value.trim().toUpperCase();",
  "$('bSave').onclick=async()=>{const n=$('bName').value.trim(),c=$('bCode').value.trim().toUpperCase();")
R("let made=0;if(!b){BRANCHES.push(t);const fac=t.type==='factory';",
  "let made=0;if(!b&&LIVE){BRANCHES.push(t);await flush();const fac=t.type==='factory';const sb=$('bSave');sb.disabled=true;sb.textContent='Creating logins…';\n      for(const [r,id,job] of [['manager','lgMgr','Branch manager'],['measure','lgMeas','Measurement'],['cashier','lgCash','Cashier'],['tailor','lgTail',fac?'Factory supervisor':'Tailor']]){if(fac&&r!=='tailor')continue;const v=$(id).value.trim();if(!v)continue;\n        const w={id:0,name:v,role:job,login:r,branch:t.id,phone:'',nat:'',joined:today,pay:'salary',rate:0,basic:0,target:60,comm:0,iqama:null,status:'active'};try{await createStaff(w);workers.push(w);made++}catch(e){toast(`Could not create ${v}: ${e.code||e.message}`)}}\n    }else if(!b){BRANCHES.push(t);const fac=t.type==='factory';")

# personal links in live
R("const wLink=w=>`https://${DOMAIN}/app/${wslug(w)}`;", "const wLink=w=>LIVE?personalLink(w):`https://${DOMAIN}/app/${wslug(w)}`;")
R('<button class="btn sm pri" id="wpv">Preview</button>', '${LIVE?`<a class="btn sm pri" href="${wLink(w)}" target="_blank" rel="noopener">Open</a>`:`<button class="btn sm pri" id="wpv">Preview</button>`}')
R("document.getElementById('wpv').onclick=()=>installScreen(null,null,w);", "const pv=document.getElementById('wpv');if(pv)pv.onclick=()=>installScreen(null,null,w);")
R("if(rs)rs.onclick=()=>toast(`${w.name} will set a new PIN next time he opens his app`);",
  "if(rs)rs.onclick=async()=>{if(DEMO){toast(`${w.name} will set a new PIN next time he opens his app`);return}rs.disabled=true;try{await resetPin(w);toast('New link made. The old PIN no longer works');workerApp(w)}catch(e){rs.disabled=false;toast('Could not reset: '+(e.code||e.message))}};")
R('<span class="muted" style="font-size:12px">Only for ${esc(w.name)}</span>', '<span class="muted" style="font-size:12px">Only for ${esc(w.name)}${LIVE?(w.pinSet?\' · PIN set\':\' · first-time link, he sets his PIN\'):\'\'}</span>')

# attendance from the worker drawer
R("""    <div><p class="h4">Attendance · last 14 days""", """    ${(isOwner()||managesW(w))&&okW(w)?`<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><b style="font-size:13.5px">Today</b>${w.att[13]==='a'?'<span class="pill s-late">Absent</span>':'<span class="pill s-ready">Present</span>'}<button class="btn sm" id="attW">${w.att[13]==='a'?'Mark present':'Mark absent'}</button></div>`:''}
    <div><p class="h4">Attendance · last 14 days""")
R("  if($('editW'))$('editW').onclick=()=>workerForm(w);", "  if($('editW'))$('editW').onclick=()=>workerForm(w);\n  if($('attW'))$('attW').onclick=async()=>{const v=w.att[13]==='a'?'p':'a';if(LIVE){await setAtt(w,v)}w.att[13]=v;toast(`${w.name}: ${v==='a'?'absent':'present'} today`);route();openWorker(id)};")
R("const canEditW=w=>", "const managesW=w=>ROLE==='manager'&&w.branch===USER.branch||isFactoryLogin()&&w.branch===USER.branch;\nconst canEditW=w=>")

# branch links in live: each person's own link
R("function branchLinks(b,fresh){", """function branchLinks(b,fresh){
  if(LIVE){const ppl=workers.filter(w=>w.branch===b.id&&['manager','measure','cashier','tailor'].includes(w.login||jobLogin(w.role)));
    drawer(fresh?`${b.name} is ready`:`${b.name} links`,`<div class="muted" style="font-size:13px">${fresh?'Send each person their own link.':`${b.code} · ${b.city}`}</div>`,
     `<div class="msg" style="border-color:var(--brass)">Each person opens <b>their own link</b>, sets a PIN, and can install it as their own app. A first-time link works only until the PIN is set.</div>
      <div class="links">${ppl.map(w=>`<div class="lk"><div class="qr" id="qrp_${w.id}"></div><div style="min-width:0"><b>${esc(w.name)}</b><span class="muted" style="font-size:12px">${esc(w.role)}${w.pinSet?' · PIN set':' · waiting for first sign in'}</span><span class="url">${esc(wLink(w))}</span>
       <div class="acts"><button class="btn sm" data-wapp="${w.id}">Link & WhatsApp</button></div></div></div>`).join('')||'<div class="empty">No logins for this branch yet. Add people from Workers.</div>'}</div>`,'');
    ppl.forEach(w=>qrInto(document.getElementById('qrp_'+w.id),wLink(w)));
    document.querySelectorAll('[data-wapp]').forEach(x=>x.onclick=()=>workerApp(wk(+x.dataset.wapp)));return}""")

# settings: no "Try it" in live
R("""<button class="btn sm" data-try="${i}">Try it</button>""", """${DEMO?`<button class="btn sm" data-try="${i}">Try it</button>`:(u.sid?`<button class="btn sm" data-wapp2="${u.sid}">Link</button>`:'')}""")
R("""document.addEventListener('click',e=>{const t=e.target.closest('[data-try]');""", """document.addEventListener('click',e=>{const t2=e.target.closest('[data-wapp2]');if(t2){workerApp(wk(+t2.dataset.wapp2));return}const t=e.target.closest('[data-try]');""")


# safety for missing references (deleted worker, branch, customer)
R("BRANCHES.find(b=>b.id===o.branch).code", "(BRANCHES.find(b=>b.id===o.branch)||{code:'—'}).code", 'all')
R("const cust=id=>customers.find(c=>c.id===id);", "const cust=id=>customers.find(c=>c.id===id)||{id:0,name:'—',phone:'',branch:0,profiles:[{name:'Self',m:{}}],hist:[]};")
R("const wk=id=>workers.find(w=>w.id===id);", "const wk=id=>workers.find(w=>w.id===id)||{id:0,name:'—',role:'',branch:0,att:[],status:'inactive',pay:'salary',rate:0};")
R("  const o=orders.find(x=>x.rno===rno),c=cust(o.cid),", "  const o=orders.find(x=>x.rno===rno);if(!o)return;const c=cust(o.cid),")
R("  const k=ROLE2TASK[w.role]||'sew';const s=wStats(w);const jobs=myJobs(w);", "  if(!w){V('<div class=\"panel\"><div class=\"empty\">Loading your work…</div></div>');return}\n  const k=ROLE2TASK[w.role]||'sew';const s=wStats(w);const jobs=myJobs(w);")
R("try{t.login=jobLogin(t.role);await createStaff(t);workers.push(t)}", "try{t.login=jobLogin(t.role);await createStaff(t);if(!workers.some(x=>x.id===t.id))workers.push(t)}")
R("try{await createStaff(w);workers.push(w);made++}", "try{await createStaff(w);if(!workers.some(x=>x.id===w.id))workers.push(w);made++}")
R("return orders.filter(o=>(pending(o,k)||(k==='sew'&&atTailor(o)))&&(k==='sew'?o.tailor===w.id:", "return orders.filter(o=>(pending(o,k)||(k==='sew'&&atTailor(o)))&&(k==='sew'?(o.tailor===w.id||(!workers.some(x=>x.id===o.tailor)&&o.made===w.branch)):")
R("function stepTask(o,k,by){const cur=o.t[k];if(cur==='done')return;", "function stepTask(o,k,by){const cur=o.t[k];if(cur==='done')return;\n  if(k==='sew'&&!workers.some(x=>x.id===o.tailor)){const t=by&&by.role==='Tailor'?by:null;if(!t){toast('Choose a tailor first');return}o.tailor=t.id}")
# board: choose the tailor when none is set
R("${t.k==='sew'||t.k==='cut'?`<div class=\"mm\">${mmLine(o,['tool','sadr','kom','raqba'])}</div>`:''}", "${t.k==='sew'||t.k==='cut'?`<div class=\"mm\">${mmLine(o,['tool','sadr','kom','raqba'])}</div>`:''}${t.k==='sew'&&canAssign()&&o.t.sew==='wait'?`<select class=\"tsel\" data-tsel=\"${o.rno}\" aria-label=\"Tailor\" style=\"border:1px solid var(--line);border-radius:7px;padding:5px;background:var(--surface)\"><option value=\"\">Choose tailor…</option>${tailorsOf(o.made).map(w=>`<option value=\"${w.id}\" ${w.id===o.tailor?'selected':''}>${esc(w.name)}</option>`).join('')}</select>`:''}")
R("  document.querySelectorAll('[data-mv]').forEach(b=>b.onclick=()=>{const o=orders.find(x=>x.rno===+b.dataset.mv);stepTask(o,b.dataset.k);route()});", "  document.querySelectorAll('[data-tsel]').forEach(s=>s.onchange=()=>{const o=orders.find(x=>x.rno===+s.dataset.tsel);o.tailor=+s.value||0;toast(s.value?`${ono(o)} given to ${wk(o.tailor).name}`:'Tailor removed');route()});\n  document.querySelectorAll('[data-mv]').forEach(b=>b.onclick=()=>{const o=orders.find(x=>x.rno===+b.dataset.mv);stepTask(o,b.dataset.k,b.dataset.k==='sew'?wk(o.tailor):null);route()});")
# first run: nothing set up yet
R("function dashboard(){", "function dashboard(){\n  if(LIVE&&!BRANCHES.length&&ROLE==='owner'){V(`<div class=\"panel\"><div class=\"panel-b\" style=\"display:flex;flex-direction:column;gap:12px;align-items:flex-start\"><h2 style=\"margin:0;font-family:var(--f-display);font-weight:600;font-size:22px\">Welcome, ${esc(USER.name)}</h2><p class=\"muted\" style=\"margin:0\">Start by adding your shop branches and the tailoring factory. Each branch gets logins for its manager, measurement and cashier.</p><a class=\"btn pri\" href=\"#branches\">Add branches & factory</a></div></div>`);return}")


# numbers for records made on the website never meet the shop exe's own numbers
R("Math.max(1000,...orders.map(o=>o.rno))+1", "Math.max(DEMO?1000:50000,...orders.filter(o=>DEMO||!o.exe||o.rno>=50000).map(o=>o.rno))+1")
R("cid=Math.max(0,...customers.map(c=>c.id))+1;", "cid=Math.max(DEMO?0:500000,...customers.filter(c=>DEMO||c.id>=500000).map(c=>c.id))+1;")
R('<div class="rid" style="font-size:13px">Receipt ${ono(o)} · ${bname(o.branch)} branch</div>', '<div class="rid" style="font-size:13px">Receipt ${ono(o)}${o.exeNo&&o.exeNo!==o.rno?` · shop no. ${o.exeNo}`:\'\'} · ${bname(o.branch)} branch${o.exe?\' · from shop exe\':\'\'}</div>')
# people from the shop exe get their login from here
R('<div class="acts"><button class="btn sm" id="wcp">Copy link</button>', '<div class="acts">${LIVE&&!w.uid?`<button class="btn sm pri" id="wmk">Create his login</button>`:\'\'}<button class="btn sm" id="wcp">Copy link</button>')
R("document.getElementById('wcp').onclick=()=>cp(wLink(w),'Link copied');", "const mk=document.getElementById('wmk');if(mk)mk.onclick=async()=>{mk.disabled=true;mk.textContent='Creating…';try{w.login=w.login||jobLogin(w.role);await createStaff(w);toast('Login made. Send him the link');workerApp(w)}catch(e){mk.disabled=false;mk.textContent='Create his login';toast('Could not create: '+(e.code||e.message))}};\n  document.getElementById('wcp').onclick=()=>{if(LIVE&&!w.uid){toast('Create his login first');return}cp(wLink(w),'Link copied')};")
# owner: shop exe status in Settings

# delete worker in live also removes login (flush → removeStaff); demo unchanged
# start
R("route();showLogin();", "if(DEMO){route();showLogin()}else liveBoot();\nsetTimeout(()=>location.reload(),addD(today,1)-new Date()+60000);")

live = (SRC / 'live.js').read_text()
# the JAMEEL measurement sheet: its places (generated by tools/jameel_gen.py) and the sheet engine
js = (SRC / 'jspec.js').read_text() + '\n' + (SRC / 'jsheet.js').read_text()
START = 'if(DEMO){route();showLogin()}else liveBoot();'
assert s.count(START) == 1
s = s.replace(START, (SRC / 'docs.js').read_text() + '\n' + (SRC / 'exeviews.js').read_text() + '\n' + START)
app = s + '\n' + js + '\n' + live + "\nasync function loadFirebase(){\n  if(window.__FB_MOCK)return window.__FB_MOCK;\n  const V='10.14.1',B=`https://www.gstatic.com/firebasejs/${V}/`;\n  const [a,au,fs]=await Promise.all([import(B+'firebase-app.js'),import(B+'firebase-auth.js'),import(B+'firebase-firestore.js')]);\n  return {...a,...au,...fs};\n}\n"
(ROOT / 'app.js').write_text(app)

head = (SRC / 'head.html').read_text()
title = '<title>Saudi Thobe Admin</title>'
assert title in head
head = head.replace('<meta name="claude:viewport-fit-sides" content="cover">\n', '')
head = head.replace(title, '')
style_start = head.index('<script src="https://cdnjs')
pre = head[:style_start]
rest = head[style_start:]
# split CSS block from body markup
css_end = rest.index('</style>') + len('</style>')
headpart, bodypart = rest[:css_end], rest[css_end:]
html = f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Saudi Thobe</title>
<meta name="theme-color" content="#16213a">
<link rel="icon" href="/img/icon-192.png">
<link rel="apple-touch-icon" href="/img/icon-192.png">
<meta name="apple-mobile-web-app-capable" content="yes">
{pre}{headpart}
<style>:root{{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}}body{{margin:0;font-size:14px}}img{{max-width:100%}}</style>
</head>
<body>
{bodypart.strip()}
<script type="module" src="/app.js"></script>
</body>
</html>
'''
(ROOT / 'index.html').write_text(html)
print('built', len(app), 'bytes app.js')
