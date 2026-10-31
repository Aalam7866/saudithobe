/* ================= Language: English · العربية · हिन्दी =================
   The screens are written in English; this swaps every known label on the page (menu, titles, buttons, table heads, tiles)
   for the chosen language, also on whatever is drawn later. Names, numbers and Arabic text stay as they are.
   The choice is kept on this device. */
let LANG=(()=>{try{return localStorage.getItem('st_lang')||'en'}catch(e){return 'en'}})();
const L3=(ar,hi)=>({ar,hi});
const TR_SRC={
 // menu & page titles
 'Dashboard':L3('لوحة التحكم','डैशबोर्ड'),'Home':L3('الرئيسية','होम'),'Orders':L3('الطلبات','ऑर्डर'),'New order':L3('طلب جديد','नया ऑर्डर'),'New':L3('جديد','नया'),
 'Measurements':L3('المقاسات','नाप'),'Measure':L3('المقاس','नाप'),'Customers':L3('العملاء','ग्राहक'),'Payments':L3('المدفوعات','भुगतान'),'Workers':L3('العمال','कारीगर'),
 'Branches & factories':L3('الفروع والمصانع','शाखाएँ और फैक्ट्री'),'Branches':L3('الفروع','शाखाएँ'),'Daily report':L3('التقرير اليومي','दैनिक रिपोर्ट'),'Daily':L3('اليومي','दैनिक'),
 'Reports':L3('التقارير','रिपोर्ट'),'Settings':L3('الإعدادات','सेटिंग्स'),'Cashier desk':L3('الكاشير','कैशियर डेस्क'),'Desk':L3('الكاشير','डेस्क'),'My work':L3('عملي','मेरा काम'),
 'My work & pay':L3('عملي وراتبي','मेरा काम और वेतन'),'My pay':L3('راتبي','मेरा वेतन'),'Production board':L3('لوحة الإنتاج','प्रोडक्शन बोर्ड'),'Board':L3('اللوحة','बोर्ड'),
 'Purchases & stock':L3('المشتريات والمخزون','खरीद और स्टॉक'),'Stock':L3('المخزون','स्टॉक'),'WhatsApp':L3('واتساب','व्हाट्सऐप'),'Message tracker':L3('متابعة الرسائل','मैसेज ट्रैकर'),'Messages':L3('الرسائل','मैसेज'),
 'Daily work':L3('العمل اليومي','रोज़ का काम'),'Business':L3('الأعمال','व्यापार'),'Cashier':L3('الكاشير','कैशियर'),'Workshop':L3('الورشة','वर्कशॉप'),'Viewing':L3('عرض','देख रहे हैं'),
 'All branches':L3('كل الفروع','सभी शाखाएँ'),'All branches & factories':L3('كل الفروع والمصانع','सभी शाखाएँ और फैक्ट्री'),'Switch':L3('تبديل','बदलें'),'Sign out':L3('خروج','लॉग आउट'),
 // workshop steps & status
 'Cutting':L3('القص','कटिंग'),'Tailor':L3('الخياط','दर्ज़ी'),'Tailoring':L3('الخياطة','सिलाई'),'Hinge':L3('الهنج','हिंज'),'Tatreez':L3('التطريز','कढ़ाई'),'Bottom cutting':L3('قص الأسفل','बॉटम कटिंग'),'Ironing':L3('الكوي','इस्त्री'),
 'Ready for pickup':L3('جاهز للاستلام','लेने के लिए तैयार'),'Ready':L3('جاهز','तैयार'),'Delivered':L3('تم التسليم','दे दिया'),'Late':L3('متأخر','देर'),'Overdue':L3('متأخر','देर से'),'Not cut':L3('لم يُقص','कटा नहीं'),
 'Cut done':L3('تم القص','कटिंग हो गई'),'Stitching':L3('قيد الخياطة','सिलाई चल रही'),'Stitched':L3('تمت الخياطة','सिल गया'),'Back to tailor':L3('عاد للخياط','दर्ज़ी के पास वापस'),'Pending':L3('معلق','बाकी'),
 'In progress':L3('قيد التنفيذ','चल रहा है'),'Done':L3('تم','हो गया'),'Waiting':L3('بانتظار','इंतज़ार'),'Not needed':L3('غير مطلوب','ज़रूरत नहीं'),'Not yet':L3('ليس بعد','अभी नहीं'),
 'Taken · due':L3('مستلم · متبقي','ले गया · बाकी'),'✓ Ready':L3('✓ جاهز','✓ तैयार'),'Open details':L3('التفاصيل','विवरण'),'Measurements & style':L3('المقاسات والموديل','नाप और स्टाइल'),
 'Waiting for me':L3('بانتظاري','मेरे लिए बाकी'),'Finished this month':L3('أنجزت هذا الشهر','इस महीने पूरे'),'Done today':L3('أنجزت اليوم','आज पूरे'),'My pay this month':L3('راتبي هذا الشهر','इस महीने का वेतन'),
 'Nothing waiting for you right now.':L3('لا يوجد عمل بانتظارك الآن.','अभी आपके लिए कोई काम नहीं।'),
 // common words, table heads
 'Order':L3('الطلب','ऑर्डर'),'Order No':L3('رقم الطلب','ऑर्डर नंबर'),'Invoice':L3('الفاتورة','इनवॉइस'),'Customer':L3('العميل','ग्राहक'),'Mobile':L3('الجوال','मोबाइल'),'Booked':L3('تاريخ الحجز','बुकिंग'),
 'Delivery':L3('التسليم','डिलीवरी'),'Pcs':L3('القطع','पीस'),'Total':L3('الإجمالي','कुल'),'Paid':L3('المدفوع','जमा'),'Due':L3('المتبقي','बाकी'),'Balance':L3('المتبقي','बाकी'),'Status':L3('الحالة','स्थिति'),
 'Cut':L3('القص','कटिंग'),'Branch':L3('الفرع','शाखा'),'Made at':L3('مكان الخياطة','कहाँ सिला'),'Fabric':L3('القماش','कपड़ा'),'Date':L3('التاريخ','तारीख'),'Method':L3('طريقة الدفع','तरीका'),'Amount':L3('المبلغ','रकम'),
 'Type':L3('النوع','प्रकार'),'Worker':L3('العامل','कारीगर'),'Job':L3('الوظيفة','काम'),'Present':L3('حاضر','हाज़िर'),'Name':L3('الاسم','नाम'),'Orders / pcs':L3('الطلبات / القطع','ऑर्डर / पीस'),
 'Total pcs':L3('إجمالي القطع','कुल पीस'),'Thobes':L3('الثياب','थोब'),'Ordered':L3('تاريخ الطلب','ऑर्डर दिया'),'Pickup':L3('الاستلام','लेने की तारीख'),'Stitched at':L3('مكان الخياطة','कहाँ सिला'),
 'Items':L3('الأصناف','आइटम'),'Style':L3('الموديل','स्टाइल'),'Note':L3('ملاحظة','नोट'),'Search':L3('بحث','खोजें'),'Code':L3('الرمز','कोड'),'Item':L3('الصنف','आइटम'),'Company':L3('الشركة','कंपनी'),
 'Seller':L3('المورد','विक्रेता'),'Colour':L3('اللون','रंग'),'Model':L3('الموديل','मॉडल'),'Value':L3('القيمة','मूल्य'),'Yards':L3('ياردة','गज़'),'In stock':L3('في المخزون','स्टॉक में'),
 // buttons
 'Save':L3('حفظ','सेव'),'Cancel':L3('إلغاء','रद्द'),'Close':L3('إغلاق','बंद'),'Print':L3('طباعة','प्रिंट'),'Print A4':L3('طباعة A4','A4 प्रिंट'),'Export CSV':L3('تصدير CSV','CSV निकालें'),'Edit':L3('تعديل','बदलें'),
 'Delete':L3('حذف','हटाएँ'),'Add':L3('إضافة','जोड़ें'),'Today':L3('اليوم','आज'),'Yesterday':L3('أمس','कल'),'7 days':L3('٧ أيام','7 दिन'),'This month':L3('هذا الشهر','इस महीने'),'Last month':L3('الشهر الماضي','पिछले महीने'),
 'This year':L3('هذه السنة','इस साल'),'Month':L3('الشهر','महीना'),'From':L3('من','से'),'To':L3('إلى','तक'),'◀ Previous':L3('◀ السابق','◀ पिछला'),'Next ▶':L3('التالي ▶','अगला ▶'),'Details':L3('التفاصيل','विवरण'),
 '🖨 Invoice':L3('🖨 الفاتورة','🖨 इनवॉइस'),'Copy message':L3('نسخ الرسالة','मैसेज कॉपी'),'Copy for WhatsApp':L3('نسخ للواتساب','व्हाट्सऐप के लिए कॉपी'),'Open order':L3('فتح الطلب','ऑर्डर खोलें'),'OK':L3('حسناً','ठीक है'),
 'Save measurements':L3('حفظ المقاسات','नाप सेव करें'),'Undo changes':L3('تراجع','बदलाव वापस'),'Full screen':L3('ملء الشاشة','पूरी स्क्रीन'),'🖨 Print sheet':L3('🖨 طباعة الورقة','🖨 शीट प्रिंट'),
 'Save & Print  (Ctrl+S)':L3('حفظ وطباعة (Ctrl+S)','सेव और प्रिंट (Ctrl+S)'),'Save only':L3('حفظ فقط','सिर्फ़ सेव'),'Add worker':L3('إضافة عامل','कारीगर जोड़ें'),'Simple dashboard':L3('لوحة مختصرة','सादा डैशबोर्ड'),
 'Shop dashboard (AL THOB)':L3('لوحة المحل (الثوب)','दुकान डैशबोर्ड (AL THOB)'),'Shop dashboard':L3('لوحة المحل','दुकान डैशबोर्ड'),'Open next ▶':L3('فتح التالي ▶','अगला खोलें ▶'),'Open':L3('فتح','खोलें'),
 // tiles & headings
 'Money & orders':L3('المال والطلبات','पैसा और ऑर्डर'),'Sales booked':L3('المبيعات المحجوزة','बुक हुई बिक्री'),'Collected':L3('المحصّل','वसूल'),'Collected – down payments':L3('المحصّل – العربون','वसूल – एडवांस'),
 'Collected – due payments':L3('المحصّل – المتبقي','वसूल – बाकी भुगतान'),'All customers due':L3('مستحقات العملاء','सब ग्राहकों का बाकी'),'Refunds':L3('المرتجعات','वापसी'),'Not delivered':L3('لم يُسلّم','नहीं दिया'),
 'Hinge pcs':L3('قطع الهنج','हिंज पीस'),'Zip pcs':L3('قطع السحاب','ज़िप पीस'),'Total order pcs':L3('إجمالي قطع الطلبات','कुल ऑर्डर पीस'),'Cutting finished':L3('القص المنتهي','कटिंग पूरी'),
 'Cutting remaining':L3('القص المتبقي','कटिंग बाकी'),'Total stitched':L3('إجمالي المخيط','कुल सिले'),'Stitching remaining':L3('الخياطة المتبقية','सिलाई बाकी'),'Total delivered':L3('إجمالي المسلّم','कुल दिए'),
 'Remaining':L3('المتبقي','बाकी'),'From earlier months':L3('من الأشهر السابقة','पिछले महीनों से'),'Collected by method':L3('المحصّل حسب الطريقة','तरीके से वसूल'),'Customers with due':L3('عملاء عليهم مبالغ','बाकी वाले ग्राहक'),
 'Late deliveries':L3('تسليمات متأخرة','देर वाली डिलीवरी'),'Work plan':L3('خطة العمل','काम की योजना'),'Top 50 customers':L3('أفضل ٥٠ عميل','टॉप 50 ग्राहक'),'Hinge & zip by month':L3('الهنج والسحاب شهرياً','महीने के हिसाब से हिंज और ज़िप'),
 'Low stock':L3('مخزون منخفض','कम स्टॉक'),'Summary':L3('ملخص','सारांश'),'Daily report (exe)':L3('التقرير اليومي (البرنامج)','दैनिक रिपोर्ट (exe)'),'Tailoring report':L3('تقرير الخياطة','सिलाई रिपोर्ट'),
 'Work by worker':L3('العمل حسب العامل','कारीगर के हिसाब से काम'),'Payments & deliveries':L3('المدفوعات والتسليم','भुगतान और डिलीवरी'),'Down payment':L3('العربون','एडवांस'),'Payment':L3('دفعة','भुगतान'),
 'Payment + delivery':L3('دفعة + تسليم','भुगतान + डिलीवरी'),'Delivery only':L3('تسليم فقط','सिर्फ़ डिलीवरी'),'Delivered with due':L3('سُلّم والمبلغ متبقي','दिया पर पैसा बाकी'),'Refund':L3('مرتجع','वापसी'),
 'Business report':L3('تقرير الأعمال','व्यापार रिपोर्ट'),'Workshop flow':L3('مراحل الورشة','वर्कशॉप का क्रम'),'Logins & permissions':L3('الدخول والصلاحيات','लॉगिन और अनुमति'),
 'Orders ready / الطلبات الجاهزة':L3('الطلبات الجاهزة','तैयार ऑर्डर'),'Due reminders / تذكير بالمستحقات':L3('تذكير بالمستحقات','बाकी की याद'),'Delivery date changed':L3('تغيير موعد التسليم','डिलीवरी तारीख बदली'),'Broadcast':L3('رسالة جماعية','सबको मैसेज'),
 'All orders':L3('كل الطلبات','सभी ऑर्डर'),'With due':L3('عليها مبالغ','बाकी वाले'),'Free gifts':L3('هدايا','मुफ़्त गिफ़्ट'),'Taken with due':L3('مستلم ومتبقي','ले गया पर बाकी'),
 'Orders in progress':L3('طلبات قيد التنفيذ','चल रहे ऑर्डर'),'Revenue, last 7 days':L3('الإيراد · آخر ٧ أيام','कमाई · पिछले 7 दिन'),'Balance due from customers':L3('المتبقي على العملاء','ग्राहकों पर बाकी'),
 'Workshop right now':L3('الورشة الآن','अभी वर्कशॉप'),'Upcoming deliveries':L3('التسليمات القادمة','आने वाली डिलीवरी'),'Daily revenue':L3('الإيراد اليومي','रोज़ की कमाई'),'All orders ':L3('كل الطلبات','सभी ऑर्डर'),
 'Order value':L3('قيمة الطلبات','ऑर्डर की कीमत'),'Due from customers':L3('المتبقي على العملاء','ग्राहकों पर बाकी'),'Past delivery date':L3('تجاوز موعد التسليم','डिलीवरी की तारीख निकल गई'),
 'Waiting for the customer':L3('بانتظار العميل','ग्राहक का इंतज़ार'),'Shop workshop':L3('ورشة المحل','दुकान की वर्कशॉप'),'Not assigned yet':L3('لم يُحدد بعد','अभी तय नहीं'),'Orders':L3('الطلبات','ऑर्डर'),
 'Measurement sheet & style':L3('ورقة المقاس والموديل','नाप शीट और स्टाइल'),'📐 Open the measurement sheet':L3('📐 فتح ورقة المقاس','📐 नाप शीट खोलें'),'Old shop paper values':L3('قيم الورقة القديمة','पुरानी पर्ची के नाप'),
 'WhatsApp message':L3('رسالة واتساب','व्हाट्सऐप मैसेज'),'Hand over to customer':L3('تسليم للعميل','ग्राहक को दें'),'Customer':L3('العميل','ग्राहक'),'Mobile':L3('الجوال','मोबाइल'),'Address':L3('العنوان','पता'),
 'Booking date':L3('تاريخ الحجز','बुकिंग की तारीख'),'Delivery date':L3('تاريخ التسليم','डिलीवरी की तारीख'),'Invoice No':L3('رقم الفاتورة','इनवॉइस नंबर'),'Discount':L3('الخصم','छूट'),'VAT':L3('الضريبة','वैट'),
 'Pay type':L3('نوع الراتب','वेतन का प्रकार'),'This month':L3('هذا الشهر','इस महीने'),'Joined':L3('تاريخ الانضمام','जुड़ने की तारीख'),'Nationality':L3('الجنسية','राष्ट्रीयता'),'Iqama expiry':L3('انتهاء الإقامة','इक़ामा ख़त्म'),
 'Mark on leave':L3('إجازة','छुट्टी पर'),'Deactivate':L3('إيقاف','बंद करें'),'Block':L3('حظر','ब्लॉक'),'App link':L3('رابط التطبيق','ऐप लिंक'),'Sign in':L3('دخول','लॉगिन'),'Enter':L3('دخول','अंदर जाएँ'),
 'Measurements':L3('المقاسات','नाप'),'Due reminder':L3('تذكير بالمبلغ','बाकी की याद'),'Payments & deliveries':L3('المدفوعات والتسليم','भुगतान और डिलीवरी'),
 'Workers\' work':L3('عمل العمال','कारीगरों का काम'),'Attendance · last 14 days':L3('الحضور · آخر ١٤ يوم','हाज़िरी · पिछले 14 दिन'),'Language':L3('اللغة','भाषा'),
};
const TR={ar:{},hi:{}};Object.entries(TR_SRC).forEach(([k,v])=>{TR.ar[k]=v.ar;TR.hi[k]=v.hi});
function trText(n){const d=TR[LANG];const v=n.nodeValue;if(!v)return;const k=v.trim();if(k&&d[k]!==undefined&&d[k]!==k)n.nodeValue=v.replace(k,d[k])}
function trTree(root){if(LANG==='en'||!root)return;const d=TR[LANG];
  if(root.nodeType===3){trText(root);return}
  if(root.nodeType!==1)return;
  const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode:n=>{const p=n.parentNode;return p&&/^(SCRIPT|STYLE|TEXTAREA)$/.test(p.nodeName)?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT}});
  let n;while((n=w.nextNode()))trText(n);
  (root.querySelectorAll?[root,...root.querySelectorAll('[placeholder],[title],[aria-label]')]:[]).forEach(e=>{['placeholder','title'].forEach(a=>{const v=e.getAttribute&&e.getAttribute(a);if(v&&d[v.trim()])e.setAttribute(a,d[v.trim()])})});
  if(root.querySelectorAll)root.querySelectorAll('option').forEach(o=>{const k=o.textContent.trim();if(d[k])o.textContent=d[k]})}
function setLang(l){LANG=l;try{localStorage.setItem('st_lang',l)}catch(e){}location.reload()}
(function i18nStart(){
  document.documentElement.lang=LANG==='ar'?'ar':LANG==='hi'?'hi':'en';
  if(LANG==='ar')document.documentElement.dir='rtl';
  // the language box in the top bar
  const bar=document.querySelector('header.top #themeBtn');
  if(bar){const s=document.createElement('select');s.id='langSel';s.className='langsel';s.setAttribute('aria-label','Language');
    s.innerHTML='<option value="en">English</option><option value="ar">العربية</option><option value="hi">हिन्दी</option>';s.value=LANG;s.onchange=()=>setLang(s.value);bar.parentNode.insertBefore(s,bar)}
  // also on the sign-in screen (top corner)
  const f=document.createElement('select');f.id='langFloat';f.className='langsel';f.setAttribute('aria-label','Language');f.innerHTML='<option value="en">English</option><option value="ar">العربية</option><option value="hi">हिन्दी</option>';f.value=LANG;f.onchange=()=>setLang(f.value);document.body.appendChild(f);
  if(LANG==='en')return;
  trTree(document.body);
  new MutationObserver(ms=>{for(const m of ms){if(m.type==='characterData')trText(m.target);else m.addedNodes.forEach(trTree)}}).observe(document.body,{childList:true,subtree:true,characterData:true});
})();
