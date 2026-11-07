// NutriClinic staged interface. Patient data stay in this page: nothing is stored or sent.
// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Gökay Duman
import { recommend, normalize, checkNumber, checkProduct, ENGINE_VERSION, RULES_DATE, PRODUCT_DEFAULTS } from './engine.mjs';
import { swallowStatus, FOIS_TEXT, IDDSI_FOOD, IDDSI_DRINK } from './scales.mjs';
import { SOURCES } from './sources.mjs';
import { getInitialLocale, LANGUAGE_STORAGE_KEY } from './initial-locale.mjs';

let lang = getInitialLocale();
const state = { step: 1, values: { setting: 'icu' }, product: {}, view: 'cards', openDetails: new Set(), openMore: new Set() };

// ---------------------------------------------------------------------------------------------
// Text
const T = {
  tagline: ['Kademeli beslenme önerisi', 'Staged nutrition recommendation'],
  example: ['Örnek olgu', 'Example case'],
  back: ['Geri', 'Back'],
  next: ['Devam', 'Next'],
  showNow: ['Öneriyi şimdi göster', 'Show recommendation now'],
  show: ['Öneriyi göster', 'Show recommendation'],
  result: ['Öneri', 'Recommendation'],
  edit: ['Bilgileri düzenle', 'Edit inputs'],
  newPatient: ['Yeni hasta', 'New patient'],
  print: ['Yazdır / PDF', 'Print / PDF'],
  add: ['Ekle', 'Add'],
  unknown: ['Bilinmiyor', 'Unknown'],
  yes: ['Evet', 'Yes'],
  no: ['Hayır', 'No'],
  required: ['gerekli', 'required'],
  todayPlan: ['Bugünkü öneri', 'Today’s recommendation'],
  energyToday: ['Enerji hedefi (bugün)', 'Energy target (today)'],
  proteinToday: ['Protein hedefi (bugün)', 'Protein target (today)'],
  delivered: ['Mama ile verilen', 'Delivered by the formula'],
  fullTarget: ['Tam hedef', 'Full target'],
  supplements: ['Gerekli takviyeler', 'Indicated supplements'],
  noSupplements: ['Bu verilerle ek takviye gerekmiyor.', 'No additional supplement is indicated with these data.'],
  progression: ['Günlük ilerleme', 'Day-by-day progression'],
  missingTitle: ['Eksik veriler', 'Missing data'],
  missingLead: ['Öneri şu anki verilerle verildi. Aşağıdakiler girilirse öneri kesinleşir.', 'The recommendation uses the data available now. Entering these makes it more precise.'],
  missingNone: ['Önemli eksik veri yok.', 'No important data missing.'],
  notes: ['Klinik notlar', 'Clinical notes'],
  monitoring: ['İzlem', 'Monitoring'],
  details: ['Hesap ayrıntısı', 'Calculation details'],
  sources: ['Kaynaklar', 'Sources'],
  label: ['Ürün etiketini girin (isteğe bağlı)', 'Enter the product label (optional)'],
  labelLead: ['Varsayılanlar bu mama türünün tipik etiket değerleridir. Kullandığınız ürünün etiketini girerseniz bütün miktarlar ona göre yeniden hesaplanır.', 'Defaults are typical label values for this formula class. Enter the label of the product you use and every amount is recalculated from it.'],
  day: ['Gün', 'Day'],
  icuDayCol: ['YB günü', 'ICU day'],
  feedDayCol: ['Beslenme günü', 'Feeding day'],
  energyCol: ['Enerji (kcal)', 'Energy (kcal)'],
  proteinCol: ['Protein (g)', 'Protein (g)'],
  formulaCol: ['Mama', 'Formula'],
  rateCol: ['Hız (mL/sa)', 'Rate (mL/h)'],
  feedsCol: ['Öğün', 'Feeds'],
  moduleCol: ['Protein modülü (g)', 'Protein module (g)'],
  aaCol: ['Amino asit (g)', 'Amino acids (g)'],
  today: ['bugün', 'today'],
  intended: ['Klinik kararı destekler, yerine geçmez. Her öneriyi hasta başında, girdileri ve kaynaklarıyla birlikte değerlendirin.', 'Supports clinical decisions; does not replace them. Review every recommendation at the bedside together with its inputs and sources.'],
  privacy: ['Girilen bilgiler bu sayfadan çıkmaz: kaydedilmez, sunucuya gönderilmez.', 'Entered data never leave this page: nothing is saved or sent to a server.'],
  oldVersion: ['Önceki sürüm (kayıtlı hastalar ve ayrıntılı çalışma alanı)', 'Previous version (saved patients and detailed workspace)'],
  license: ['Lisans: AGPL-3.0 · Kaynak kodu', 'License: AGPL-3.0 · Source code'],
  weightUsed: ['Hesap kilosu', 'Weight used'],
  proteinWeightUsed: ['Protein için kilo', 'Weight for protein'],
  bmi: ['BKİ', 'BMI'],
  ibw: ['İdeal (öngörülen) kilo', 'Ideal (predicted) weight'],
  refeeding: ['Refeeding riski', 'Refeeding risk'],
  nitrogen: ['Azot dengesi', 'Nitrogen balance'],
  nonNutritional: ['Beslenme dışı kalori', 'Non-nutritional calories'],
  energyBasis: ['Enerji hesabı', 'Energy basis'],
  proteinBasis: ['Protein hesabı', 'Protein basis'],
  assumptions: ['Varsayımlar', 'Assumptions'],
  warnings: ['Uyarı', 'Warning'],
  route: ['Beslenme yolu', 'Feeding route'],
  access: ['Erişim', 'Access'],
  typical: ['tipik etiket', 'typical label'],
  fromLabel: ['girilen etiket', 'entered label'],
  fiber: ['lifli (çözünür + çözünmez lif)', 'with fibre (soluble + insoluble)'],
  form: ['Ürün formu', 'Product form'],
  liquid: ['Sıvı', 'Liquid'],
  powder: ['Toz', 'Powder'],
  blocked: ['Öneri verilemiyor', 'No recommendation'],
  exampleNote: ['Örnek olgu yüklendi (sentetik veri).', 'Example case loaded (synthetic data).'],
};
const L = (x) => (Array.isArray(x) ? x[lang === 'tr' ? 0 : 1] : x && typeof x === 'object' && 'tr' in x ? x[lang] : x ?? '');
const t = (key) => L(T[key]);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const nf = (x, d = 0) => (x === null || x === undefined || !Number.isFinite(x) ? '–' : Number(x).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-GB', { minimumFractionDigits: d, maximumFractionDigits: d }));
const r10 = (x) => Math.round(x / 10) * 10;

// ---------------------------------------------------------------------------------------------
// Steps and fields
const yesNoUnknown = [{ value: 'yes', label: T.yes }, { value: 'no', label: T.no }, { value: 'unknown', label: T.unknown }];
// "unlock": small coloured sentence shown while the field is empty, saying what entering it adds.
// Effective swallowing (the most cautious entered finding) and BMI, for showing the right questions.
const effectiveSwallow = (v) => swallowStatus(normalize(v).p).value;
const bmiOf = (v) => { const { p } = normalize(v); return p.heightCm && p.weightKg ? p.weightKg / (p.heightCm / 100) ** 2 : null; };
const STEPS = [
  {
    title: ['Hasta', 'Patient'],
    lead: ['Önce temel bilgiler. Kilo olmadan miktar hesaplanamaz; diğer eksikler öneriyi durdurmaz.', 'Basic data first. Amounts need the weight; other gaps do not stop the recommendation.'],
    fields: (v) => [
      { key: 'setting', type: 'seg', wide: true, label: ['Bakım yeri', 'Care setting'], options: [{ value: 'icu', label: ['Yoğun bakım', 'Intensive care'] }, { value: 'ward', label: ['Servis', 'Ward'] }], fixed: true },
      { key: 'age', type: 'num', label: ['Yaş', 'Age'], unit: ['yıl', 'years'], unlock: ['Yaşı girerseniz 65 yaş üstünde lifli mama ve ONS kuralını, 70 yaştan itibaren NRS 2002 ve GLIM eşiklerini uygularım.', 'Enter the age to apply the fibre and ONS rules from 65 and the NRS 2002 and GLIM cut-offs from 70.'] },
      { key: 'sex', type: 'seg', label: ['Cinsiyet', 'Sex'], options: [{ value: 'female', label: ['Kadın', 'Female'] }, { value: 'male', label: ['Erkek', 'Male'] }], unlock: ['Cinsiyet ideal kilo formülünü ve kas gücü eşiklerini belirler.', 'Sex selects the ideal-weight formula and the muscle-strength cut-offs.'] },
      { key: 'heightCm', type: 'num', label: ['Boy', 'Height'], unit: ['cm', 'cm'], unlock: ['Boyu girerseniz ideal ve düzeltilmiş kiloyu hesaplar, obezite ya da zayıflıkta hedefi ayarlarım.', 'Enter the height to calculate ideal and adjusted weight and adapt targets in obesity or underweight.'] },
      { key: 'weightKg', type: 'num', label: ['Güncel kilo', 'Current weight'], unit: ['kg', 'kg'], req: true, unlock: ['Bütün miktarlar kiloya göre hesaplanır; girilmezse temkinli tahmin kullanırım.', 'All amounts are per kg; without it I use a cautious estimate.'] },
      ...(v.setting !== 'ward' ? [{ key: 'icuDay', type: 'num', label: ['Yoğun bakımın kaçıncı günü?', 'Day of ICU stay'], unit: ['gün', 'day'], hint: ['Yatış günü = 1', 'Admission day = 1'], unlock: ['Günü girerseniz akut faz sınırlarına göre bugünkü enerji ve proteini veririm.', 'Enter the day to set today’s energy and protein within the acute-phase limits.'] }] : []),
    ],
  },
  {
    title: ['Beslenme yolu', 'Feeding route'],
    lead: ['Yutma, sindirim kanalı ve dolaşım durumu mamanın yolunu ve zamanını belirler.', 'Swallowing, gut and circulation decide the route and timing.'],
    fields: (v) => {
      const swallow = effectiveSwallow(v);
      const oral = swallow === 'safe' || swallow === 'modified';
      return [
        { key: 'swallow', type: 'seg', stack: true, wide: true, label: ['Ağızdan beslenme / disfaji', 'Oral intake / dysphagia'], options: [
          { value: 'safe', label: ['Güvenle yiyebiliyor', 'Can eat safely'] },
          { value: 'modified', label: ['Disfaji var; kıvam ayarlı diyetle yiyebiliyor', 'Dysphagia; can eat a texture-modified diet'] },
          { value: 'unsafe', label: ['Yiyemiyor: yutma güvensiz, entübe ya da bilinç kapalı', 'Cannot eat: unsafe swallow, intubated or reduced consciousness'] },
        ], unlock: ['Yutma/disfaji durumunu girerseniz beslenme yolunu (ağızdan, kıvam ayarlı, tüp) ve uygun ONS kıvamını öneririm.', 'Enter swallowing/dysphagia to get the route (oral, texture-modified, tube) and the right ONS texture.'] },
        ...(oral ? [{ key: 'oralIntakePct', type: 'num', label: ['Gereksiniminin yüzde kaçını yiyor?', 'Share of needs eaten'], unit: ['%', '%'], hint: ['Son 1–3 günün ortalaması; tabağın yarısı ≈ %50', 'Average of the last 1–3 days; half the tray ≈ 50%'], unlock: ['Alımı girerseniz ONS sayısını ya da tüple ek beslenme gereğini kesinleştiririm.', 'Enter intake to fix the number of ONS servings or the need for extra tube feeding.'] }] : []),
        { key: 'more-dysphagia', type: 'more', label: ['Disfaji ölçekleri (isteğe bağlı): FOIS, IDDSI, EAT-10', 'Dysphagia scales (optional): FOIS, IDDSI, EAT-10'],
          unlock: ['FOIS ya da IDDSI düzeyini girerseniz yutma durumunu ve ONS’nin kıvamını onlardan belirlerim; EAT-10 yutma değerlendirmesi gereğini gösterir.', 'Enter FOIS or IDDSI levels and I set swallowing and the ONS thickness from them; EAT-10 shows whether a swallowing assessment is needed.'],
          fields: [
            { key: 'fois', type: 'seg', stack: true, wide: true, label: ['FOIS (işlevsel ağızdan alım düzeyi)', 'FOIS (functional oral intake level)'], options: [1, 2, 3, 4, 5, 6, 7].map((n) => ({ value: String(n), label: [`${n} · ${FOIS_TEXT[n].tr}`, `${n} · ${FOIS_TEXT[n].en}`] })) },
            { key: 'iddsiFood', type: 'seg', stack: true, label: ['IDDSI yiyecek düzeyi', 'IDDSI food level'], options: [3, 4, 5, 6, 7].map((n) => ({ value: String(n), label: [`${n} · ${IDDSI_FOOD[n].tr}`, `${n} · ${IDDSI_FOOD[n].en}`] })) },
            { key: 'iddsiFluid', type: 'seg', stack: true, label: ['IDDSI içecek düzeyi', 'IDDSI drink level'], options: [0, 1, 2, 3, 4].map((n) => ({ value: String(n), label: [`${n} · ${IDDSI_DRINK[n].tr}`, `${n} · ${IDDSI_DRINK[n].en}`] })), unlock: ['İçecek düzeyini girerseniz ONS’yi sıvı ya da kıvamlı seçer, kıvam artırıcı gereğini söylerim.', 'Enter the drink level and I choose a liquid or thickened ONS and say whether a thickener is needed.'] },
            { key: 'eat10', type: 'num', label: ['EAT-10 toplam puanı', 'EAT-10 total score'], unit: ['0–40', '0–40'], hint: ['Valide Türkçe formdaki toplam; ≥3 anormal', 'Total of the validated form; ≥3 is abnormal'] },
            { key: 'swallowAssessment', type: 'seg', label: ['Yutma değerlendirmesi', 'Swallowing assessment'], options: [{ value: 'none', label: ['Yapılmadı', 'Not done'] }, { value: 'bedside', label: ['Yatak başı', 'Bedside'] }, { value: 'fees', label: ['FEES', 'FEES'] }, { value: 'vfss', label: ['VFSS', 'VFSS'] }] },
            { key: 'checks-swallow', type: 'checks', wide: true, label: ['Varsa işaretleyin', 'Tick if present'], items: [
              { key: 'impairedAlertness', label: ['Uyanıklık bozuk (öz bildirim güvenilmez)', 'Impaired alertness (self-report unreliable)'] },
              { key: 'unsafeSigns', label: ['Yutarken güvensizlik bulgusu: öksürük, ses değişikliği, desatürasyon', 'Unsafe signs while swallowing: cough, voice change, desaturation'] },
            ] },
          ] },
        { key: 'gi', type: 'seg', label: ['Sindirim kanalı', 'Gut'], options: [{ value: 'ok', label: ['Kullanılabilir', 'Usable'] }, { value: 'contraindicated', label: ['Kullanılamaz (obstrüksiyon, iskemi vb.)', 'Not usable (obstruction, ischaemia, etc.)'] }], unlock: ['Sindirim kanalı kullanılamıyorsa parenteral beslenmenin zamanını ve miktarını hesaplarım.', 'If the gut cannot be used I time and size parenteral nutrition.'] },
        { key: 'shock', type: 'seg', stack: true, label: ['Şok', 'Shock'], options: [{ value: 'none', label: ['Yok', 'None'] }, { value: 'controlled', label: ['Var, sıvı/vazopressörle kontrol altında', 'Present, controlled with fluids/vasopressors'] }, { value: 'uncontrolled', label: ['Kontrolsüz (perfüzyon hedefleri sağlanmadı)', 'Uncontrolled (perfusion goals not met)'] }], unlock: v.setting === 'ward' ? ['Şok varsa beslenmenin ertelenip ertelenmeyeceğini belirlerim.', 'With shock I decide whether feeding must wait.'] : ['Şok durumunu girerseniz beslenmenin bugün başlayıp başlamayacağını ve dozunu belirlerim; girilmezse bugün düşük doz veririm.', 'Enter shock status to decide whether and how much to feed today; without it I give a low dose today.'] },
        { key: 'feeding', type: 'seg', label: ['Beslenme desteği', 'Nutrition support'], options: [{ value: 'none', label: ['Henüz başlamadı', 'Not started yet'] }, { value: 'ongoing', label: ['Sürüyor ve tolere ediliyor', 'Running and tolerated'] }], unlock: ['Beslenme sürüyorsa kademeli artışı bulunduğu günden sürdürürüm; girilmezse ilk basamaktan başlarım.', 'If feeding is running I continue the progression from today; otherwise I start from the first step.'] },
        ...(v.setting === 'ward' && !oral ? [{ key: 'feedingMode', type: 'seg', label: ['Tüple uygulama', 'Tube delivery'], options: [{ value: 'continuous', label: ['Pompayla sürekli', 'Continuous by pump'] }, { value: 'intermittent', label: ['Aralıklı öğünler (bolus)', 'Intermittent feeds (bolus)'] }], unlock: ['Aralıklı seçerseniz günlük öğün sayısını ve her öğünün mL’sini veririm.', 'Choose intermittent to get the number of feeds and mL per feed.'] }] : []),
        { key: 'checks-route', type: 'checks', wide: true, label: ['Varsa işaretleyin', 'Tick if present'], unlock: ['Mide rezidüsünde prokinetik dozunu, aspirasyon riskinde postpilorik yolu, uzun tüp gereğinde PEG zamanını öneririm.', 'High residuals give a prokinetic dose, aspiration risk a post-pyloric route, a long tube course the PEG timing.'], items: [
          ...(v.setting !== 'ward' ? [
            { key: 'highGrv', label: ['Mide aspiratı 6 saatte >500 mL', 'Gastric aspirate >500 mL in 6 h'] },
            { key: 'hypoxemia', label: ['Kontrolsüz, yaşamı tehdit eden hipoksemi, hiperkapni ya da asidoz', 'Uncontrolled life-threatening hypoxaemia, hypercapnia or acidosis'] },
            { key: 'giBleed', label: ['Aktif üst GİS kanaması', 'Active upper GI bleeding'] },
            { key: 'ischemia', label: ['Bağırsak iskemisi', 'Bowel ischaemia'] },
            { key: 'fistula', label: ['Distal erişimi olmayan yüksek debili fistül', 'High-output fistula without distal access'] },
            { key: 'acs', label: ['Abdominal kompartman sendromu', 'Abdominal compartment syndrome'] },
          ] : []),
          { key: 'aspirationRisk', label: ['Aspirasyon riski çok yüksek', 'Very high aspiration risk'] },
          { key: 'longTube', label: ['Tüple beslenme 4 haftadan uzun sürecek gibi', 'Tube feeding likely to last more than 4 weeks'] },
        ] },
      ];
    },
  },
  {
    title: ['Klinik durum', 'Clinical status'],
    lead: ['Böbrek, sıvı ve bağırsak durumu mama türünü ve protein miktarını değiştirir.', 'Kidney, fluid and bowel status change the formula class and protein dose.'],
    fields: (v) => [
      { key: 'kidney', type: 'seg', stack: true, wide: true, label: ['Böbrek', 'Kidney'], options: [
        { value: 'normal', label: ['Normal', 'Normal'] },
        { value: 'aki', label: v.setting === 'ward' ? ['eGFR <30 ya da AKI (diyaliz yok)', 'eGFR <30 or AKI (no dialysis)'] : ['AKI / KBH, diyaliz yok', 'AKI / CKD, no dialysis'] },
        { value: 'ihd', label: ['Aralıklı hemodiyaliz', 'Intermittent haemodialysis'] },
        { value: 'crrt', label: ['Sürekli böbrek replasman tedavisi (CRRT)', 'Continuous kidney replacement therapy (CRRT)'] },
      ], unlock: ['Böbrek durumunu girerseniz proteini AKI, diyaliz ya da CRRT’ye göre ayarlar, gerekirse düşük proteinli mama öneririm; girilmezse temkin için 1,0 g/kg alırım.', 'Enter kidney status to set protein for AKI, dialysis or CRRT and suggest a low-protein formula if needed; without it I use 1.0 g/kg.'] },
      { key: 'bowel', type: 'seg', label: ['Dışkılama', 'Bowel'], options: [{ value: 'normal', label: ['Normal', 'Normal'] }, { value: 'diarrhea', label: ['İshal', 'Diarrhoea'] }, { value: 'constipation', label: ['Kabızlık', 'Constipation'] }], unlock: ['İshal ya da kabızlık varsa lifli mama ve ek öneriler veririm.', 'With diarrhoea or constipation I suggest fibre and extra measures.'] },
      { key: 'burnsTbsa', type: 'num', label: ['Yanık', 'Burn'], unit: ['% TVYA', '% TBSA'], hint: ['Yanık yoksa boş bırakın', 'Leave empty if no burn'], unlock: v.setting === 'ward' ? ['Yanık yüzdesini girerseniz çinko gereğini hesaplarım.', 'Enter the burn size to calculate zinc.'] : ['Yanık yüzdesini girerseniz çinko ve glutamin gereğini hesaplarım.', 'Enter the burn size to calculate zinc and glutamine.'] },
      { key: 'checks-clinical', type: 'checks', wide: true, label: ['Varsa işaretleyin', 'Tick if present'], unlock: ['Sıvı kısıtlamasında enerji yoğun mama, inmede tüp/PEG zamanlaması, travmada glutamin, bası yarasında arjinin-glutamin-HMB öneririm.', 'Fluid restriction gives an energy-dense formula, stroke the tube/PEG timing, trauma glutamine, pressure ulcers arginine-glutamine-HMB.'], items: [
        { key: 'fluidRestriction', label: ['Sıvı kısıtlaması gerekiyor', 'Fluid restriction needed'] },
        { key: 'diabetes', label: ['Diyabet ya da hiperglisemi', 'Diabetes or hyperglycaemia'] },
        { key: 'stroke', label: ['İnme (iskemik ya da hemorajik)', 'Stroke (ischaemic or haemorrhagic)'] },
        ...(v.setting !== 'ward' ? [{ key: 'trauma', label: ['Majör travma', 'Major trauma'] }] : [{ key: 'pressureUlcer', label: ['Bası yarası', 'Pressure ulcer'] }]),
        ...(v.sex === 'female' ? [{ key: 'pregnant', label: ['Gebelik', 'Pregnancy'] }] : []),
      ] },
    ],
  },
  {
    title: ['Beslenme riski', 'Nutritional risk'],
    lead: ['NRS 2002 taraması ve GLIM malnütrisyon ölçütleri. Kilo kaybı ve düşük alım refeeding riskini de belirler.', 'NRS 2002 screening and GLIM malnutrition criteria. Weight loss and low intake also set the refeeding risk.'],
    fields: (v) => {
      const bmi = bmiOf(v);
      const loss = String(v.usualWeightKg ?? '').trim() !== '' || String(v.weightLossPct ?? '').trim() !== '';
      return [
        { key: 'usualWeightKg', type: 'num', label: ['Hastalık öncesi olağan kilo', 'Usual (pre-illness) weight'], unit: ['kg', 'kg'], unlock: ['Olağan kiloyu girerseniz kilo kaybını hesaplar; NRS 2002, GLIM, refeeding riski ve böbrek hastasında protein kilosu için kullanırım.', 'Enter the usual weight to calculate weight loss for NRS 2002, GLIM, refeeding risk and the protein weight in kidney disease.'] },
        { key: 'weightLossPct', type: 'num', label: ['İstemsiz kilo kaybı', 'Unintentional weight loss'], unit: ['%', '%'], hint: ['Olağan kilo girildiyse boş bırakabilirsiniz', 'May stay empty if the usual weight is entered'] },
        ...(loss ? [{ key: 'lossMonths', type: 'seg', wide: true, label: ['Kilo kaybı ne kadar sürede oldu?', 'Over what period was the weight lost?'], options: [{ value: '1', label: ['1 ay', '1 month'] }, { value: '2', label: ['2 ay', '2 months'] }, { value: '3', label: ['3 ay', '3 months'] }, { value: '6', label: ['3–6 ay', '3–6 months'] }, { value: '12', label: ['6 aydan uzun', 'More than 6 months'] }], unlock: ['Süreyi girerseniz kaybı NRS 2002 ve GLIM’e göre puanlarım.', 'Enter the period to grade the loss for NRS 2002 and GLIM.'] }] : []),
        { key: 'lowIntakeDays', type: 'num', label: ['Kaç gündür çok az ya da hiç beslenemiyor?', 'Days of little or no intake'], unit: ['gün', 'days'], unlock: ['Gün sayısını girerseniz başlangıç miktarını, tiamin gereğini ve NRS 2002/GLIM alım ölçütünü belirlerim.', 'Enter the number of days to set the starting amount, thiamine and the NRS 2002/GLIM intake criterion.'] },
        { key: 'nrsDisease', type: 'seg', stack: true, wide: true, label: ['Hastalık şiddeti (NRS 2002)', 'Disease severity (NRS 2002)'], options: [
          { value: '0', label: ['0 · Gereksinim artmamış', '0 · Normal requirements'] },
          { value: '1', label: ['1 · Kalça kırığı; akut komplikasyonlu kronik hastalık (siroz, KOAH, kronik hemodiyaliz, diyabet, kanser)', '1 · Hip fracture; chronic disease with acute complications (cirrhosis, COPD, chronic haemodialysis, diabetes, cancer)'] },
          { value: '2', label: ['2 · Majör karın cerrahisi, inme, ağır pnömoni, hematolojik kanser', '2 · Major abdominal surgery, stroke, severe pneumonia, haematological malignancy'] },
          { value: '3', label: ['3 · Kafa travması, kemik iliği nakli, yoğun bakım hastası (APACHE II >10)', '3 · Head injury, bone-marrow transplantation, ICU patient (APACHE II >10)'] },
        ], unlock: ['Hastalık şiddetini seçerseniz NRS 2002’yi hesaplar, serviste ONS gereğini kesinleştiririm.', 'Choose the disease severity and I calculate NRS 2002 and settle the need for ONS on the ward.'] },
        ...(bmi !== null && bmi <= 20.5 ? [{ key: 'nrsImpaired', type: 'seg', label: ['Genel durum bozuk mu? (NRS 2002, BKİ ≤20,5)', 'Impaired general condition? (NRS 2002, BMI ≤20.5)'], options: yesNoUnknown }] : []),
        { key: 'glimMuscle', type: 'seg', label: ['Kas kitlesi (GLIM)', 'Muscle mass (GLIM)'], options: [{ value: 'normal', label: ['Normal', 'Normal'] }, { value: 'moderate', label: ['Hafif–orta azalmış', 'Mild–moderate deficit'] }, { value: 'severe', label: ['Ağır azalmış', 'Severe deficit'] }], hint: ['BIA, DEXA, BT ya da ultrason; yoksa baldır çevresi ve muayene. Ödemde güvenilmez.', 'BIA, DEXA, CT or ultrasound; otherwise calf circumference and examination. Unreliable with oedema.'], unlock: ['Kas kitlesini girerseniz GLIM malnütrisyonunu ve evresini kesinleştiririm.', 'Enter the muscle mass to confirm GLIM malnutrition and its stage.'] },
        { key: 'glimIntake', type: 'seg', label: ['Alım azlığı ya da emilim bozukluğu (GLIM)', 'Reduced intake or assimilation (GLIM)'], options: yesNoUnknown, hint: ['Gereksinimin ≤%50’si 1 haftadan uzun, herhangi bir azalma 2 haftadan uzun ya da kronik sindirim/emilim sorunu', '≤50% of requirements for >1 week, any reduction for >2 weeks, or chronic GI malabsorption'] },
        { key: 'glimInflammation', type: 'seg', label: ['İnflamasyon ya da hastalık yükü (GLIM)', 'Inflammation or disease burden (GLIM)'], options: yesNoUnknown, hint: v.setting === 'ward' ? ['Akut hastalık ya da yaralanma (enfeksiyon, yanık, travma) ya da kronik hastalık (kanser, KOAH, kalp yetmezliği, KBH)', 'Acute disease or injury (infection, burns, trauma) or chronic disease (cancer, COPD, heart failure, CKD)'] : ['Yoğun bakım hastalığında boş bırakılırsa “var” kabul edilir', 'Taken as present in critical illness if left empty'] },
        { key: 'checks-risk', type: 'checks', wide: true, label: ['Varsa işaretleyin', 'Tick if present'], items: [
          { key: 'oedema', label: ['Belirgin ödem ya da sıvı yükü (kilo ve BKİ güvenilmez)', 'Marked oedema or fluid overload (weight and BMI unreliable)'] },
        ] },
        { key: 'more-nrs', type: 'more', label: ['NRS 2002 beslenme puanını elle girin (isteğe bağlı)', 'Enter the NRS 2002 nutrition score by hand (optional)'], lead: ['Boş bırakılırsa kilo kaybı, BKİ ve alımdan hesaplanır. Veriler daha yüksek bir puan gösterirse o kullanılır.', 'If empty it is calculated from weight loss, BMI and intake. If the data show a higher score, that one is used.'], fields: [
          { key: 'nrsNutrition', type: 'seg', stack: true, wide: true, label: ['Beslenme bozukluğu puanı', 'Impaired nutritional status score'], options: [
            { value: '0', label: ['0 · Beslenme durumu normal', '0 · Normal nutritional status'] },
            { value: '1', label: ['1 · 3 ayda >%5 kayıp ya da geçen hafta gereksinimin %50–75’i', '1 · >5% loss in 3 months or 50–75% of requirements last week'] },
            { value: '2', label: ['2 · 2 ayda >%5 kayıp, BKİ 18,5–20,5 ile genel durum bozuk ya da alım %25–60', '2 · >5% loss in 2 months, BMI 18.5–20.5 with impaired condition, or intake 25–60%'] },
            { value: '3', label: ['3 · 1 ayda >%5 (3 ayda >%15) kayıp, BKİ <18,5 ile genel durum bozuk ya da alım %0–25', '3 · >5% loss in 1 month (>15% in 3 months), BMI <18.5 with impaired condition, or intake 0–25%'] },
          ] },
        ] },
        { key: 'more-aspen', type: 'more', label: ['AND/ASPEN ve ESPEN 2015 ölçütleri (isteğe bağlı)', 'AND/ASPEN and ESPEN 2015 criteria (optional)'], lead: ['Klinisyenin doğruladığı özellikler sayılır; otomatik şiddet verilmez.', 'Clinician-confirmed characteristics are counted; no automatic severity.'], fields: [
          { key: 'aspenContext', type: 'seg', wide: true, label: ['Bağlam (AND/ASPEN)', 'Context (AND/ASPEN)'], options: [{ value: 'acute', label: ['Akut hastalık/yaralanma', 'Acute illness/injury'] }, { value: 'chronic', label: ['Kronik hastalık', 'Chronic illness'] }, { value: 'social', label: ['Sosyal/çevresel', 'Social/environmental'] }] },
          { key: 'aspenIntake', type: 'seg', label: ['Yetersiz enerji alımı', 'Insufficient energy intake'], options: yesNoUnknown },
          { key: 'aspenWeight', type: 'seg', label: ['Kilo kaybı (bağlama göre)', 'Weight loss (by context)'], options: yesNoUnknown },
          { key: 'aspenMuscle', type: 'seg', label: ['Kas kaybı', 'Loss of muscle mass'], options: yesNoUnknown },
          { key: 'aspenFat', type: 'seg', label: ['Deri altı yağ kaybı', 'Loss of subcutaneous fat'], options: yesNoUnknown },
          { key: 'aspenFluid', type: 'seg', label: ['Kilo kaybını maskeleyen sıvı birikimi', 'Fluid accumulation masking weight loss'], options: yesNoUnknown },
          ...(v.setting === 'ward' ? [{ key: 'aspenGrip', type: 'seg', label: ['Azalmış kavrama gücü', 'Reduced grip strength'], options: yesNoUnknown }] : []),
          { key: 'ffmKg', type: 'num', label: ['Yağsız kütle (FFM)', 'Fat-free mass (FFM)'], unit: ['kg', 'kg'], hint: ['BIA ya da DEXA; ESPEN 2015 yağsız kütle indeksi için', 'BIA or DEXA; for the ESPEN 2015 fat-free mass index'] },
        ] },
      ];
    },
  },
  {
    title: ['Refeeding riski', 'Refeeding risk'],
    lead: ['Başlangıç miktarını ve tiamin/elektrolit gereğini belirler (NICE ölçütleri). Kilo kaybı ve düşük alım 4. adımda soruldu. Girilmezse temkinli başlangıç uygulanır.', 'Sets the starting amount and the need for thiamine and electrolytes (NICE criteria). Weight loss and low intake are asked in step 4. Without them a cautious start is used.'],
    fields: () => [
      { key: 'lowElectrolytes', type: 'seg', label: ['Beslenme öncesi K, P ya da Mg düşük mü?', 'Low K, P or Mg before feeding?'], options: yesNoUnknown, unlock: ['Düşükse refeeding riski yüksek sayılır; tiamin ve elektrolit dozlarını hesaplarım.', 'If low, refeeding risk is high: I calculate thiamine and electrolyte doses.'] },
      { key: 'alcohol', type: 'seg', label: ['Alkol kullanım bozukluğu', 'Alcohol use disorder'], options: yesNoUnknown },
      { key: 'riskDrugs', type: 'seg', label: ['İnsülin, kemoterapi, antasit ya da diüretik', 'Insulin, chemotherapy, antacids or diuretics'], options: yesNoUnknown },
      { key: 'checks-refeed', type: 'checks', wide: true, label: ['Varsa işaretleyin', 'Tick if present'], unlock: ['Wernicke şüphesinde yüksek doz tiamin; beslenme sırasında fosfat düştüyse 48 saatlik kısıtlama uygularım.', 'Suspected Wernicke gives high-dose thiamine; a phosphate drop during feeding gives a 48-h restriction.'], items: [
        { key: 'wernicke', label: ['Wernicke ensefalopatisi şüphesi (bilinç değişikliği, ataksi, oftalmopleji)', 'Suspected Wernicke encephalopathy (confusion, ataxia, ophthalmoplegia)'] },
        { key: 'hypoPhosphate', label: ['Beslenme sırasında fosfat <0,65 mmol/L ya da >0,16 mmol/L düştü', 'Phosphate fell below 0.65 mmol/L or by >0.16 mmol/L during feeding'] },
      ] },
    ],
  },
  {
    title: ['Ölçümler', 'Measurements'],
    lead: ['İsteğe bağlı. Her ölçüm öneriyi hastaya göre inceltir.', 'Optional. Each measurement individualises the recommendation.'],
    fields: (v) => [
      ...(v.setting !== 'ward' ? [{ key: 'measuredEE', type: 'num', label: ['İndirekt kalorimetri (ölçülen enerji harcaması)', 'Indirect calorimetry (measured energy expenditure)'], unit: ['kcal/gün', 'kcal/day'], unlock: ['Kalorimetriyi girerseniz enerjiyi tahmin yerine ölçüme göre (3. günden sonra %80–100) veririm.', 'Enter calorimetry to base energy on the measurement (80–100% after day 3) instead of an estimate.'] }] : []),
      { key: 'uun', type: 'num', label: ['24 saatlik idrar üre azotu (UUN)', '24-h urine urea nitrogen (UUN)'], unit: ['g/gün', 'g/day'], unlock: ['UUN ve o günkü proteini girerseniz anabolik/katabolik durumu belirleyip proteini ölçülen kaybı karşılayacak şekilde ayarlarım.', 'Enter UUN and that day’s protein to determine the anabolic/catabolic state and set protein to replace the measured loss.'] },
      { key: 'uunProtein', type: 'num', label: ['Aynı 24 saatte alınan protein', 'Protein received in the same 24 h'], unit: ['g', 'g'], hint: ['Azot dengesi = protein/6,25 − (UUN + 4)', 'Nitrogen balance = protein/6.25 − (UUN + 4)'] },
      ...(v.setting !== 'ward' ? [{ key: 'propofolMlH', type: 'num', label: ['Propofol %1 infüzyonu', 'Propofol 1% infusion'], unit: ['mL/sa', 'mL/h'], unlock: ['Propofol hızını girerseniz kalorisini mamadan düşer, lipit sınırını kontrol ederim.', 'Enter the propofol rate to subtract its calories and check the lipid limit.'] }] : []),
      { key: 'dextroseG', type: 'num', label: ['IV dekstroz (glukoz)', 'IV dextrose (glucose)'], unit: ['g/gün', 'g/day'], hint: ['%5 dekstroz 1000 mL = 50 g', '5% dextrose 1000 mL = 50 g'], unlock: ['IV dekstrozu girerseniz kalorisini mamadan düşer, glukoz sınırını kontrol ederim.', 'Enter IV dextrose to subtract its calories and check the glucose limit.'] },
      { key: 'vitD', type: 'num', label: ['25(OH) D vitamini', '25(OH) vitamin D'], unit: ['ng/mL', 'ng/mL'], unlock: ['25(OH)D girerseniz D vitamini eksikliğine göre öneride bulunurum.', 'Enter 25(OH)D for a vitamin D recommendation.'] },
      ...(v.setting === 'ward' ? [{ key: 'crp', type: 'num', label: ['CRP (akut faz yanıtı)', 'CRP (acute-phase response)'], unit: ['mg/L', 'mg/L'], unlock: ['CRP girerseniz yüksek inflamasyonda (>100 mg/L) beslenme desteğine beklenen yanıtı belirtirim.', 'Enter CRP to flag the expected response to nutrition support with high inflammation (>100 mg/L).'] }] : []),
      { key: 'more-muscle', type: 'more', label: ['Kas gücü ve kütlesi (EWGSOP2 sarkopeni)', 'Muscle strength and mass (EWGSOP2 sarcopenia)'],
        lead: v.setting === 'ward' ? ['Standart ölçüm yöntemiyle; popülasyona uygun eşikler kullanılır.', 'With standard measurement methods; population-appropriate cut-offs are used.'] : ['Yoğun bakımda kas gücü testleri akut hastalık ve sedasyondan etkilenir: sonuç yalnız kayıt içindir.', 'In the ICU strength tests are affected by acute illness and sedation: the result is for the record only.'],
        unlock: ['Kavrama gücü ya da sandalye testini girerseniz sarkopeniyi değerlendirir, kas kütlesini GLIM’e aktarırım.', 'Enter grip strength or the chair test and I assess sarcopenia and pass muscle mass to GLIM.'],
        fields: [
          { key: 'gripKg', type: 'num', label: ['El kavrama gücü', 'Grip strength'], unit: ['kg', 'kg'], hint: ['En iyi değer; düşük: erkek <27, kadın <16 kg', 'Best value; low: men <27, women <16 kg'] },
          { key: 'chairRiseS', type: 'num', label: ['5 kez sandalyeden kalkma süresi', 'Five chair rises'], unit: ['sn', 's'], hint: ['>15 sn düşük kas gücü', '>15 s is low strength'] },
          { key: 'asmKg', type: 'num', label: ['Apendiküler iskelet kası (ASM)', 'Appendicular skeletal muscle mass (ASM)'], unit: ['kg', 'kg'], hint: ['DEXA ya da BIA; düşük: erkek <20, kadın <15 kg ya da ASM/boy² <7,0/<5,5', 'DEXA or BIA; low: men <20, women <15 kg, or ASM/height² <7.0/<5.5'] },
          { key: 'gaitSpeed', type: 'num', label: ['Yürüme hızı (4 m)', 'Gait speed (4 m)'], unit: ['m/sn', 'm/s'], hint: ['≤0,8 m/sn düşük performans', '≤0.8 m/s is low performance'] },
          { key: 'sppb', type: 'num', label: ['SPPB', 'SPPB'], unit: ['0–12', '0–12'], hint: ['≤8 düşük performans', '≤8 is low performance'] },
          { key: 'checks-muscle', type: 'checks', wide: true, label: ['Varsa işaretleyin', 'Tick if present'], items: [
            { key: 'sarcopeniaConfounded', label: ['Akut hastalık, nörolojik güçsüzlük, ağrı ya da sedasyon ölçümü etkiliyor', 'Acute illness, neurological weakness, pain or sedation affects the tests'] },
          ] },
        ] },
    ],
  },
];

// ---------------------------------------------------------------------------------------------
// Rendering: cards
const $ = (sel, root = document) => root.querySelector(sel);

function renderProgress() {
  const nav = $('#progress');
  const items = STEPS.map((s, i) => {
    const n = i + 1;
    const current = state.view === 'cards' && state.step === n;
    return `<button type="button" data-goto="${n}" ${current ? 'aria-current="step"' : ''} class="${state.view === 'result' || state.step > n ? 'done' : ''}"><span class="num">${n}</span>${esc(L(s.title))}</button>`;
  });
  items.push(`<button type="button" data-goto="result" ${state.view === 'result' ? 'aria-current="step"' : ''}><span class="num">✓</span>${esc(t('result'))}</button>`);
  nav.innerHTML = items.join('');
}

// Small coloured sentence: what entering this field adds (shown while it is empty).
const unlockHtml = (f, isEmpty) => (f.unlock && isEmpty ? `<p class="unlock" data-unlock="${f.key}">✦ ${esc(L(f.unlock))}</p>` : '');

function fieldHtml(f) {
  const v = state.values;
  const wide = f.wide ? ' wide' : '';
  if (f.type === 'num') {
    const val = v[f.key] ?? '';
    const err = fieldError(f, val);
    return `<div class="field${wide}"><label for="f-${f.key}">${esc(L(f.label))}${f.req ? `<span class="req" title="${esc(t('required'))}">*</span>` : ''}</label>
      <div class="input-wrap${err ? ' invalid' : ''}"><input id="f-${f.key}" data-key="${f.key}" inputmode="decimal" autocomplete="off" enterkeyhint="next" value="${esc(val)}" aria-describedby="err-${f.key}"${err ? ' aria-invalid="true"' : ''}><span class="unit">${esc(L(f.unit))}</span></div>
      <p class="field-error" id="err-${f.key}" aria-live="polite"${err ? '' : ' hidden'}>${esc(err ?? '')}</p>
      ${f.hint ? `<p class="hint">${esc(L(f.hint))}</p>` : ''}${unlockHtml(f, String(val).trim() === '')}</div>`;
  }
  if (f.type === 'seg') {
    const cur = v[f.key] ?? null;
    const buttons = f.options.map((o) => `<button type="button" data-seg="${f.key}" data-value="${o.value}" aria-pressed="${cur === o.value || (o.value === 'unknown' && cur === 'unknown')}" ${f.fixed ? 'data-fixed="1"' : ''}>${esc(L(o.label))}</button>`).join('');
    return `<div class="field${wide}" role="group" aria-labelledby="l-${f.key}"><span class="label" id="l-${f.key}">${esc(L(f.label))}</span><div class="seg${f.stack ? ' stack' : ''}">${buttons}</div>${unlockHtml(f, cur === null || cur === 'unknown')}</div>`;
  }
  if (f.type === 'checks') {
    if (!f.items.length) return '';
    const boxes = f.items.map((c) => `<label class="check"><input type="checkbox" data-check="${c.key}" ${v[c.key] === true ? 'checked' : ''}><span>${esc(L(c.label))}</span></label>`).join('');
    return `<div class="field${wide}"><span class="label">${esc(L(f.label))}</span><div class="checks">${boxes}</div>${unlockHtml(f, !f.items.some((c) => v[c.key] === true))}</div>`;
  }
  if (f.type === 'more') {
    // Optional block: closed until opened or until one of its fields has a value.
    const filledIn = f.fields.some(hasValue);
    const open = state.openMore.has(f.key) || filledIn ? ' open' : '';
    return `<div class="field wide"><details class="more" data-more="${f.key}"${open}><summary>${esc(L(f.label))}</summary>${f.lead ? `<p class="hint">${esc(L(f.lead))}</p>` : ''}<div class="fields">${f.fields.map(fieldHtml).join('')}</div></details>${unlockHtml(f, !filledIn)}</div>`;
  }
  return '';
}

function hasValue(f) {
  const v = state.values;
  if (f.type === 'checks') return f.items.some((c) => v[c.key] === true);
  if (f.type === 'more') return f.fields.some(hasValue);
  const x = v[f.key];
  return x !== undefined && x !== null && String(x).trim() !== '' && x !== 'unknown';
}
const flatFields = (fields) => fields.flatMap((f) => (f.type === 'more' ? flatFields(f.fields) : [f]));

// ---------------------------------------------------------------------------------------------
// Field errors: shown under the field itself, saying what is wrong and what is accepted.
const nfa = (x) => Number(x).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-GB', { maximumFractionDigits: 2 });
function rangeText(min, max, unit) {
  const u = unit && !/^\d+–\d+$/.test(unit) ? unit : '';
  if (u.startsWith('%')) {
    const rest = u.slice(1).trim();
    return lang === 'tr' ? `%${nfa(min)}–${nfa(max)}${rest ? ` ${rest}` : ''}` : `${nfa(min)}–${nfa(max)}%${rest ? ` ${rest}` : ''}`;
  }
  return `${nfa(min)}–${nfa(max)}${u ? ` ${u}` : ''}`;
}
function errorText(err, unit, raw) {
  const shown = String(raw ?? '').trim() || nfa(err.value);
  if (err.code === 'nan') return L(['Sayı girin (örnek: 72,5).', 'Enter a number (for example 72.5).']);
  if (err.code === 'integer') return L([`Tam sayı girin (${nfa(err.min)}–${nfa(err.max)}).`, `Enter a whole number (${nfa(err.min)}–${nfa(err.max)}).`]);
  const u = unit && !/^\d+–\d+$/.test(unit) ? ` ${unit}` : '';
  if (err.exclusiveMin) return L([`0’dan büyük, en çok ${nfa(err.max)}${u} olmalı; girilen ${shown}.`, `Must be above 0 and at most ${nfa(err.max)}${u}; entered ${shown}.`]);
  return L([`${rangeText(err.min, err.max, unit)} arasında olmalı; girilen ${shown}.`, `Must be ${rangeText(err.min, err.max, unit)}; entered ${shown}.`]);
}
function fieldError(f, value) {
  if (!f || f.type !== 'num') return null;
  const err = checkNumber(f.key, value);
  if (err) return errorText(err, L(f.unit), value);
  if (f.key === 'age' && String(value ?? '').trim() !== '') {
    const { age } = normalize({ age: value }).p;
    if (age !== null && age < 18) return L(['Bu araç 18 yaş ve üzeri erişkinler içindir; çocuklarda öneri verilmez.', 'This tool is for adults aged 18 and over; no recommendation is given for children.']);
  }
  return null;
}
function locateField(key) {
  for (let i = 0; i < STEPS.length; i += 1) {
    const field = flatFields(STEPS[i].fields(state.values)).find((f) => f.key === key);
    if (field) return { step: i + 1, field };
  }
  return null;
}
const currentField = (key) => flatFields(STEPS[state.step - 1].fields(state.values)).find((f) => f.key === key);
function setFieldError(input, text) {
  const wrap = input.closest('.input-wrap');
  const line = document.getElementById(`err-${input.dataset.key}`);
  wrap?.classList.toggle('invalid', Boolean(text));
  if (text) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid');
  if (line) { line.textContent = text ?? ''; line.hidden = !text; }
}
function showFieldErrors() {
  document.querySelectorAll('#cards input[data-key]').forEach((input) => setFieldError(input, fieldError(currentField(input.dataset.key), input.value)));
}
// Focus a field and bring it to the middle of the screen (opening its optional block if needed).
function focusField(key) {
  const el = document.getElementById(`f-${key}`) || document.querySelector(`[data-seg="${key}"]`) || document.querySelector(`[data-check="${key}"]`);
  if (!el) return false;
  const block = el.closest('details.more');
  if (block && !block.open) { block.open = true; state.openMore.add(block.dataset.more); }
  el.focus({ preventScroll: true });
  el.scrollIntoView({ block: 'center' });
  return true;
}

function renderCards() {
  const s = STEPS[state.step - 1];
  const last = state.step === STEPS.length;
  const fields = s.fields(state.values).map(fieldHtml).join('');
  $('#cards').innerHTML = `<section class="card" aria-labelledby="card-title">
    <h2 id="card-title">${state.step}. ${esc(L(s.title))}</h2>
    <p class="lead">${esc(L(s.lead))}</p>
    <div class="fields">${fields}</div>
    <div class="actions">
      ${state.step > 1 ? `<button type="button" class="btn" data-act="back">${esc(t('back'))}</button>` : '<span></span>'}
      <div class="right">
        ${last ? '' : `<button type="button" class="btn soft" data-act="show">${esc(t('showNow'))}</button>`}
        <button type="button" class="btn primary" data-act="${last ? 'show' : 'next'}">${esc(last ? t('show') : t('next'))}</button>
      </div>
    </div>
  </section>`;
}

// ---------------------------------------------------------------------------------------------
// Rendering: result
const ROUTE_TEXT = {
  oral: ['Ağızdan beslenme ve ONS', 'Oral diet and ONS'],
  en: ['Enteral beslenme (tüple)', 'Enteral (tube) feeding'],
  delay: ['Enteral beslenme şimdilik ertelenir', 'Enteral feeding is delayed for now'],
  pn: ['Parenteral beslenme', 'Parenteral nutrition'],
  'pn-later': ['Parenteral beslenme (3–7. günler arasında)', 'Parenteral nutrition (between days 3 and 7)'],
};
const ACCESS_TEXT = {
  ng: ['Nazogastrik tüp (mide)', 'Nasogastric tube (gastric)'],
  postpyloric: ['Postpilorik (tercihen jejunal) tüp', 'Post-pyloric (preferably jejunal) tube'],
  oral: ['Ağızdan', 'Oral'],
  iv: ['Damar yolu (PN için uygun kateter)', 'Venous access suitable for PN'],
};
const DELAY_TEXT = {
  shock: ['kontrolsüz şok: perfüzyon hedeflerine ulaşılmadı', 'uncontrolled shock: perfusion goals not reached'],
  grv: ['mide aspiratı 6 saatte 500 mL’nin üzerinde', 'gastric aspirate above 500 mL in 6 h'],
  hypoxemia: ['kontrolsüz, yaşamı tehdit eden hipoksemi, hiperkapni ya da asidoz', 'uncontrolled life-threatening hypoxaemia, hypercapnia or acidosis'],
  giBleed: ['aktif üst GİS kanaması (kanama durunca başlanır)', 'active upper GI bleeding (start once bleeding has stopped)'],
};
const WEIGHT_KIND = {
  actual: ['gerçek kilo', 'actual weight'],
  adjusted: ['düzeltilmiş kilo (ideal kilo + fazlanın %25’i)', 'adjusted weight (ideal + 25% of the excess)'],
  'bmi18-no-weight': ['BKİ 18,5’e karşılık gelen kilo (gerçek kilo girilmedi)', 'weight at BMI 18.5 (actual weight not entered)'],
  'capped-no-height': ['100 kg ile sınırlandı (boy girilmedi)', 'capped at 100 kg (height not entered)'],
  ideal: ['ideal kilo (böbrek hastasında ödem nedeniyle)', 'ideal weight (kidney disease: oedema)'],
  'actual-below-ideal': ['gerçek kilo (ideal kilonun altında)', 'actual weight (below ideal weight)'],
  usual: ['olağan (hastalık öncesi) kilo', 'usual (pre-illness) weight'],
  'usual-adjusted': ['olağan kiloya göre düzeltilmiş kilo', 'adjusted from usual weight'],
};
const ENERGY_BASIS = {
  'icu-weight': ['ESPEN 2023: kalorimetri yokken 25 kcal/kg (20–25); ilk hafta tahminin %70’inin altında (%65), 8. günden sonra %100', 'ESPEN 2023: 25 kcal/kg (20–25) without calorimetry; below 70% of the estimate in week 1 (65%), 100% from day 8'],
  ic: ['İndirekt kalorimetri: ilk 3 gün en çok %70, sonra %80–100', 'Indirect calorimetry: at most 70% for 3 days, then 80–100%'],
  'ward-weight': ['ESPEN 2024: 27 kcal/kg (NICE: 25–35)', 'ESPEN 2024: 27 kcal/kg (NICE: 25–35)'],
  'ward-underweight': ['ESPEN 2024: ağır zayıflıkta 30 kcal/kg, yavaşça ulaşılır', 'ESPEN 2024: 30 kcal/kg when severely underweight, reached slowly'],
};
const PROTEIN_WHY = {
  'icu-base': ['ESPEN 2023 R22: 1,3 g/kg, kademeli artırılarak', 'ESPEN 2023 R22: 1.3 g/kg, increased progressively'],
  'icu-obese': ['ESPEN 2023 R52: obezitede düzeltilmiş kiloyla 1,3 g/kg', 'ESPEN 2023 R52: 1.3 g/kg of adjusted weight in obesity'],
  'kidney-unknown': ['Böbrek durumu bilinmiyor: temkin için 1,0 g/kg (böbrek normalse 1,3)', 'Kidney status unknown: 1.0 g/kg as a precaution (1.3 with normal kidneys)'],
  'ward-kidney-unknown': ['Böbrek durumu bilinmiyor: temkin için 1,0 g/kg (böbrek normalse 1,2–1,5)', 'Kidney status unknown: 1.0 g/kg as a precaution (1.2–1.5 with normal kidneys)'],
  'kidney-aki': ['ESPEN 2024 böbrek R18: KRT yokken 1,0’dan başlayıp toleransla 1,3 g/kg’a', 'ESPEN 2024 kidney R18: without KRT start at 1.0 and increase to 1.3 g/kg if tolerated'],
  'kidney-ihd': ['ESPEN 2024 böbrek R18: aralıklı KRT’de 1,3–1,5 g/kg', 'ESPEN 2024 kidney R18: 1.3–1.5 g/kg on intermittent KRT'],
  'kidney-crrt': ['ESPEN 2024 böbrek R18: sürekli KRT’de 1,5–1,7 g/kg', 'ESPEN 2024 kidney R18: 1.5–1.7 g/kg on continuous KRT'],
  trauma: ['ESPEN 2023: travmada 1,5–2 g/kg düşünülebilir (alt sınır kullanıldı)', 'ESPEN 2023: 1.5–2 g/kg may be considered in trauma (lower bound used)'],
  'ward-base': ['ESPEN 2024 R12: 1,2–1,5 g/kg', 'ESPEN 2024 R12: 1.2–1.5 g/kg'],
  'ward-kidney': ['ESPEN 2024 R13 ve böbrek R18: eGFR <30 ya da AKI, KRT yok: 0,8 g/kg (0,8–1,0)', 'ESPEN 2024 R13 and kidney R18: eGFR <30 or AKI without KRT: 0.8 g/kg (0.8–1.0)'],
  'ward-ihd': ['ESPEN 2024 böbrek R18: aralıklı KRT’de en az 1,2 g/kg', 'ESPEN 2024 kidney R18: at least 1.2 g/kg on intermittent KRT'],
  catabolic: ['Negatif azot dengesi: ölçülen kaybı karşılayacak kadar, en çok 1,5 g/kg (ESPEN 2023 R51–R52 yaklaşımı)', 'Negative nitrogen balance: enough to replace the measured loss, at most 1.5 g/kg (ESPEN 2023 R51–R52 approach)'],
  'catabolic-obese': ['Negatif azot dengesi (obez): ölçülen kaybı karşılayacak kadar, en çok 2,0 g/kg ideal kilo', 'Negative nitrogen balance (obese): enough to replace the measured loss, at most 2.0 g/kg of ideal weight'],
};
const REFEED_TEXT = {
  low: ['Düşük (NICE ölçütleri karşılanmadı)', 'Low (NICE criteria not met)'],
  unknown: ['Belirlenemedi (eksik veri)', 'Undetermined (missing data)'],
  high: ['Yüksek (NICE Kutu 1)', 'High (NICE Box 1)'],
  extreme: ['Aşırı (BKİ <14 ya da 15 günden uzun ihmal edilebilir alım)', 'Extreme (BMI <14 or negligible intake beyond 15 days)'],
};
const CLASS_SHORT = {
  'en-standard': ['Standart', 'Standard'], 'en-high-protein': ['Yüksek protein', 'High protein'],
  'en-very-high-protein': ['Çok yüksek protein', 'Very high protein'], 'en-dense': ['Enerji yoğun', 'Energy dense'], 'en-label': ['Etiket', 'Label'],
  'en-low-protein': ['Düşük protein', 'Low protein'], 'en-powder': ['Toz', 'Powder'],
};
const srcChip = (id) => (SOURCES[id] ? `<span class="chip src">${esc(L(SOURCES[id].short))}</span>` : '');

function compText(r) {
  const c = r.product?.composition;
  if (!c) return '';
  const tag = r.product.fromLabel ? t('fromLabel') : t('typical');
  if ('kcalPerMl' in c) return `${tag}: ${nf(c.kcalPerMl, 2)} kcal/mL · ${nf(c.proteinPer100, 1)} g protein/100 mL`;
  if ('serving' in c) return `${tag}: ${nf(c.serving)} ${c.unit} = ${nf(c.kcal)} kcal · ${nf(c.protein)} g protein`;
  return '';
}

function summaryHtml(r) {
  const plan = r.plan;
  const kind = r.route.kind;
  const lines = [];
  let big = '';
  let kpis = '';
  const today = plan?.today;
  if (kind === 'oral' && plan.oral) {
    const o = plan.oral;
    const unit = o.ons.unit;
    if (o.servings === 0 && o.noRisk) big = L([`Beslenme riski yok (NRS 2002 = ${o.nrsScore}): ONS gerekmiyor. Haftada bir yeniden tarayın; alım azalırsa yeniden değerlendirin.`, `No nutritional risk (NRS 2002 = ${o.nrsScore}): no ONS needed. Rescreen weekly; reassess if intake falls.`]);
    else if (o.servings === 0 && o.capped) big = L(['Refeeding nedeniyle bugünkü toplam enerji sınırlı; ağızdan alım bu sınıra ulaşıyor. Bugün ONS eklemeyin, tabloya göre günler içinde artırın.', 'Because of refeeding risk today’s total energy is capped and oral intake already reaches it. Add no ONS today; increase over the days as in the table.']);
    else if (o.servings === 0) big = L([`Ağızdan beslenme yeterli: bugünkü hedefin en az %${Math.round(o.share * 100)}’i karşılanıyor. ONS gerekmiyor; alımı izleyin.`, `Oral intake is sufficient: at least ${Math.round(o.share * 100)}% of today’s target is met. No ONS needed; monitor intake.`]);
    else big = L([`Günde ${o.servings} × ${nf(o.ons.serving)} ${unit} ${L(r.product.label)}${o.fiber ? ' (lifli)' : ''}`, `${o.servings} × ${nf(o.ons.serving)} ${unit} per day of ${L(r.product.label)}${o.fiber ? ' (with fibre)' : ''}`]);
    if (o.servings > 0) lines.push(L(['Öğün aralarında, yemekten en az 1 saat sonra (örn. 10:30, 15:30, 21:00).', 'Between meals, at least 1 h after a meal (e.g. 10:30, 15:30, 21:00).']));
    if (o.capped) lines.push(L([`Refeeding: ilk gün toplam enerji en çok ${nf(r10(o.kcalTarget))} kcal; 4–7 günde tam hedefe çıkılır (tablo).`, `Refeeding: total energy on day 1 at most ${nf(r10(o.kcalTarget))} kcal; full target within 4–7 days (table).`]));
    if (o.moduleProtein > 0) lines.push(L([`Protein açığı: protein tozu ${nf(o.moduleProtein)} g protein/gün (≈ ${nf(o.moduleGrams)} g), 2–3 doza bölünüp içecek ya da yemeğe karıştırılarak.`, `Protein gap: protein powder ${nf(o.moduleProtein)} g protein/day (≈ ${nf(o.moduleGrams)} g), in 2–3 doses mixed into drinks or food.`]));
    if (r.input.swallow === 'modified') {
      const lv = [o.iddsi.food !== null ? L([`yiyecekler IDDSI ${o.iddsi.food}, ${IDDSI_FOOD[o.iddsi.food].tr.toLocaleLowerCase('tr-TR')}`, `foods IDDSI ${o.iddsi.food}, ${IDDSI_FOOD[o.iddsi.food].en.toLowerCase()}`]) : null,
        o.iddsi.fluid !== null ? L([`içecekler IDDSI ${o.iddsi.fluid}, ${IDDSI_DRINK[o.iddsi.fluid].tr.toLocaleLowerCase('tr-TR')}`, `drinks IDDSI ${o.iddsi.fluid}, ${IDDSI_DRINK[o.iddsi.fluid].en.toLowerCase()}`]) : null].filter(Boolean).join('; ');
      lines.push(L(['Diyet: kıvam ayarlı, enerji ve protein bakımından zenginleştirilmiş.', 'Diet: texture-modified, energy- and protein-enriched.']));
      lines.push(lv ? L([`Kıvam: ${lv}.`, `Texture: ${lv}.`]) : L(['Kıvam: sıvılar yutma değerlendirmesindeki IDDSI düzeyinde.', 'Texture: drinks at the IDDSI level set by the swallowing assessment.']));
    }
    kpis = kpi(t('energyToday'), `${nf(r10(o.kcalTarget))} kcal`, `${nf(o.kcalTarget / r.metrics.energyWeight, 1)} kcal/kg`)
      + kpi(t('proteinToday'), `${nf(Math.round(o.proteinTarget))} g`, `${nf(o.proteinTarget / r.metrics.proteinWeight, 2)} g/kg`)
      + kpi(L(['ONS ile', 'From ONS']), `${nf(o.onsKcal)} kcal`, `${nf(o.onsProtein)} g protein`)
      + (o.totalKcal !== null ? kpi(L(['Toplam (tahmini)', 'Total (estimated)']), `${nf(r10(o.totalKcal))} kcal`, `${nf(Math.round((o.totalKcal / o.kcalTarget) * 100))}% · ${nf(Math.round(o.totalProtein))} g protein`) : '');
  } else if ((kind === 'en' && today) || (kind === 'delay' && !plan.pnAfterShock && plan.restart)) {
    const label = L(r.product.label) + (r.product.fiber ? `, ${t('fiber')}` : '');
    const restart = plan.restart;
    const cur = kind === 'delay' ? restart : today;
    if (kind === 'delay') {
      big = L([`Şu an enteral beslenme başlatmayın: ${L(DELAY_TEXT[r.route.reason] ?? ['erteleme koşulu', 'delaying condition'])}.`, `Do not start enteral feeding now: ${L(DELAY_TEXT[r.route.reason] ?? ['delaying condition', 'delaying condition'])}.`]);
      lines.push(L([`Koşul düzelince düşük dozla başlayın: ${label}, ${nf(restart.rate)} mL/saat (24 saat sürekli); sonra aşağıdaki tabloya göre artırın.`, `Once it resolves, start at a low dose: ${label}, ${nf(restart.rate)} mL/h (continuous over 24 h); then increase as in the table below.`]));
    } else if (!cur.volume) {
      big = L(['Bugün tüple mama verilmez: bugünkü hedef ağızdan alım ya da beslenme dışı kaloriyle karşılanıyor. Sonraki günler için tabloya bakın.', 'No tube feed today: today’s target is covered by oral intake or non-nutritional calories. See the table for the next days.']);
    } else if (today.feeds) {
      big = L([`${label}: günde ${today.feeds.n} öğün × ${nf(today.feeds.ml)} mL (3–4 saat arayla) = ${nf(today.volume)} mL/gün`, `${label}: ${today.feeds.n} feeds × ${nf(today.feeds.ml)} mL a day (every 3–4 h) = ${nf(today.volume)} mL/day`]);
    } else {
      big = L([`${label}: ${nf(today.rate)} mL/saat, 24 saat pompayla sürekli = ${nf(today.volume)} mL/gün`, `${label}: ${nf(today.rate)} mL/h by pump, continuous over 24 h = ${nf(today.volume)} mL/day`]);
    }
    if (cur.moduleProtein > 0) lines.push(L([`Protein modülü: ${nf(cur.moduleProtein)} g protein/gün (≈ ${nf(cur.moduleGrams)} g toz), 2–4 doza bölünüp suyla tüpten.`, `Protein module: ${nf(cur.moduleProtein)} g protein/day (≈ ${nf(cur.moduleGrams)} g powder), in 2–4 doses with water via the tube.`]));
    if (cur.powderGrams) lines.push(L([`Toz ürün kullanılıyorsa: günde ${nf(cur.powderGrams)} g toz (etiketteki sulandırmayla).`, `If a powder is used: ${nf(cur.powderGrams)} g powder a day (diluted as on the label).`]));
    if (r.route.supplementalToOral) lines.push(L([`Ağızdan alım (%${nf(r.input.oralIntakePct)}) sürer; ONS ile %75’e ulaşılamadığı için açık tüple kapatılır.`, `Oral intake (${nf(r.input.oralIntakePct)}%) continues; ONS cannot reach 75%, so the gap is covered by tube.`]));
    if (r.product.changeFrom) lines.push(L([`${r.product.changeFrom.day}. günden itibaren: ${L(r.product.changeFrom.label)} (tabloya bakın).`, `From day ${r.product.changeFrom.day}: ${L(r.product.changeFrom.label)} (see the table).`]));
    if (plan.fluid) lines.push(L([`Toplam sıvı 30–35 mL/kg: ${nf(r10(plan.fluid.min))}–${nf(r10(plan.fluid.max))} mL/gün. Mamadan ${nf(r10(plan.fluid.formulaWater))} mL; ek su (yıkama dahil) ${nf(r10(plan.fluid.extraMin))}–${nf(r10(plan.fluid.extraMax))} mL/gün.`, `Total fluid 30–35 mL/kg: ${nf(r10(plan.fluid.min))}–${nf(r10(plan.fluid.max))} mL/day. Formula water ${nf(r10(plan.fluid.formulaWater))} mL; extra water (flushes included) ${nf(r10(plan.fluid.extraMin))}–${nf(r10(plan.fluid.extraMax))} mL/day.`]));
    const shown = cur;
    const kE = kind === 'delay' ? L(['Başlangıç enerjisi (koşul düzelince)', 'Start energy (once resolved)']) : t('energyToday');
    const kP = kind === 'delay' ? L(['Başlangıç proteini (koşul düzelince)', 'Start protein (once resolved)']) : t('proteinToday');
    kpis = kpi(kE, `${nf(r10(shown.kcalTarget))} kcal`, `${nf(shown.kcalTarget / r.metrics.energyWeight, 1)} kcal/kg`)
      + kpi(kP, `${nf(Math.round(shown.proteinTarget))} g`, `${nf(shown.proteinTarget / r.metrics.proteinWeight, 2)} g/kg`)
      + kpi(t('delivered'), `${nf(r10(shown.formulaKcal))} kcal`, `${nf(Math.round(shown.formulaProtein + (shown.moduleProtein || 0)))} g protein${shown.moduleProtein ? L([' (modül dahil)', ' (module included)']) : ''}${r.nonNutritional.total > 0 ? L([` · + ${nf(r10(r.nonNutritional.total))} kcal propofol/dekstroz`, ` · + ${nf(r10(r.nonNutritional.total))} kcal propofol/dextrose`]) : ''}`)
      + fullKpi(r);
  } else if ((kind === 'pn' || kind === 'pn-later' || (kind === 'delay' && plan?.pnAfterShock)) && plan?.rows?.length) {
    const day1 = today ?? plan.rows[0];
    const later = kind !== 'pn';
    big = kind === 'delay'
      ? L(['Şu an beslenme başlatmayın: kontrolsüz şok. Sindirim kanalı da kullanılamadığı için şok kontrol altına alınınca parenteral beslenme planlanır.', 'Do not start feeding now: uncontrolled shock. Because the gut is also unusable, parenteral nutrition is planned once shock is controlled.'])
      : kind === 'pn-later'
      ? L(['Sindirim kanalı kullanılamıyor: parenteral beslenmeyi 3–7. günler arasında başlatın (ağır malnütrisyonda daha erken ve kademeli). Enteral yolu her gün yeniden değerlendirin.', 'The gut cannot be used: start parenteral nutrition between days 3 and 7 (earlier and progressively if severely malnourished). Reassess the enteral route daily.'])
      : L([`Parenteral beslenme: ${nf(r10(day1.pnKcal))} kcal/gün, amino asit ${nf(Math.round(day1.aminoAcids))} g/gün`, `Parenteral nutrition: ${nf(r10(day1.pnKcal))} kcal/day, amino acids ${nf(Math.round(day1.aminoAcids))} g/day`]);
    if (later && day1.icuDay) lines.push(L([`PN başlangıcı (${day1.icuDay}. gün): ${nf(r10(day1.pnKcal))} kcal, amino asit ${nf(Math.round(day1.aminoAcids))} g; sonra tabloya göre artırın.`, `PN start (day ${day1.icuDay}): ${nf(r10(day1.pnKcal))} kcal, amino acids ${nf(Math.round(day1.aminoAcids))} g; then increase as in the table.`]));
    lines.push(L([`Sınırlar: glukoz en çok ${nf(Math.round(day1.glucoseMaxG))} g/gün (5 mg/kg/dk); lipit en çok ${nf(Math.round(day1.lipidMaxG))} g/gün (1,5 g/kg, propofol dahil). Torbayı enerji ve amino asit hedefine en yakın olacak şekilde seçin.`, `Limits: glucose at most ${nf(Math.round(day1.glucoseMaxG))} g/day (5 mg/kg/min); lipid at most ${nf(Math.round(day1.lipidMaxG))} g/day (1.5 g/kg, propofol included). Choose the bag closest to the energy and amino-acid targets.`]));
    const k1 = later ? L([`PN başlangıç hedefi${day1.icuDay ? ` (${day1.icuDay}. gün)` : ''}`, `PN start target${day1.icuDay ? ` (day ${day1.icuDay})` : ''}`]) : t('energyToday');
    kpis = kpi(k1, `${nf(r10(day1.kcal))} kcal`, `${nf(day1.kcal / r.metrics.energyWeight, 1)} kcal/kg`)
      + kpi(later ? L([`Amino asit${day1.icuDay ? ` (${day1.icuDay}. gün)` : ''}`, `Amino acids${day1.icuDay ? ` (day ${day1.icuDay})` : ''}`]) : t('proteinToday'), `${nf(Math.round(day1.protein))} g`, `${nf(day1.protein / r.metrics.proteinWeight, 2)} g/kg`) + fullKpi(r);
  }
  const access = r.route.access && kind !== 'oral' ? `<p class="muted">${esc(t('access'))}: ${esc(L(ACCESS_TEXT[r.route.access]))}</p>` : '';
  const comp = compText(r);
  return `<section class="card summary">
    <span class="route">${esc(L(kind === 'delay' && plan?.pnAfterShock ? ['Beslenme şimdilik ertelenir', 'Feeding is delayed for now'] : ROUTE_TEXT[kind]))}</span>
    <h2>${esc(t('todayPlan'))}</h2>
    ${riskChips(r)}
    <p class="big">${esc(big)}</p>
    ${comp ? `<p class="muted">${esc(comp)}</p>` : ''}
    ${lines.length ? `<ul class="lines">${lines.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
    ${access}
    <div class="kpis">${kpis}</div>
    ${r.product?.composition && r.product.cls !== 'pn' ? labelEditor(r) : ''}
  </section>`;
}

const kpi = (k, v, s) => `<div class="kpi"><div class="k">${esc(k)}</div><div class="v">${esc(v)}</div><div class="s">${esc(s)}</div></div>`;
function fullKpi(r) {
  if (r.input.setting !== 'icu') return '';
  const last = r.plan.rows[r.plan.rows.length - 1];
  const full = r.fullEnergy.kcal;
  const proteinFull = last.proteinPerKgFull * r.metrics.proteinWeight;
  return kpi(t('fullTarget'), `${nf(r10(full))} kcal`, `${nf(Math.round(proteinFull))} g protein (${nf(last.proteinPerKgFull, 2)} g/kg)`);
}

function labelEditor(r) {
  const isOns = r.route.kind === 'oral';
  const open = state.openDetails.has('label') ? ' open' : '';
  const p = state.product;
  const c = r.product.composition;
  const num = (path, label, unit, value) => {
    const err = checkProduct(path, value);
    const text = err ? `${errorText(err, unit, value)} ${L(['Bu değer kullanılmadı.', 'This value is not used.'])}` : '';
    return `<div class="field"><label for="lbl-${path}">${esc(label)}</label><div class="input-wrap${err ? ' invalid' : ''}"><input id="lbl-${path}" data-label="${path}" inputmode="decimal" value="${esc(value ?? '')}" placeholder="${esc(nf(numberAt(c, path) ?? numberAtDefault(path), 2))}" aria-describedby="lbl-err-${path}"${err ? ' aria-invalid="true"' : ''}><span class="unit">${esc(unit)}</span></div><p class="field-error" id="lbl-err-${path}" aria-live="polite"${err ? '' : ' hidden'}>${esc(text)}</p></div>`;
  };
  const fields = isOns
    ? num('ons.serving', L(['Servis miktarı', 'Serving size']), c.unit, p.ons?.serving) + num('ons.kcal', L(['Enerji / servis', 'Energy / serving']), 'kcal', p.ons?.kcal) + num('ons.protein', L(['Protein / servis', 'Protein / serving']), 'g', p.ons?.protein)
    : num('en.kcalPerMl', L(['Enerji', 'Energy']), 'kcal/mL', p.en?.kcalPerMl) + num('en.proteinPer100', 'Protein', 'g/100 mL', p.en?.proteinPer100) + num('en.waterPer100', L(['Serbest su', 'Free water']), 'mL/100 mL', p.en?.waterPer100)
      + num('module.proteinPer100g', L(['Protein modülü', 'Protein module']), 'g/100 g', p.module?.proteinPer100g)
      + `<div class="field"><span class="label">${esc(t('form'))}</span><div class="seg"><button type="button" data-form="liquid" aria-pressed="${p.form !== 'powder'}">${esc(t('liquid'))}</button><button type="button" data-form="powder" aria-pressed="${p.form === 'powder'}">${esc(t('powder'))}</button></div></div>`
      + (p.form === 'powder' ? num('powder.kcalPer100g', L(['Toz enerji', 'Powder energy']), 'kcal/100 g', p.powder?.kcalPer100g) + num('powder.proteinPer100g', L(['Toz protein', 'Powder protein']), 'g/100 g', p.powder?.proteinPer100g) + num('powder.kcalPerMl', L(['Sulandırılmış mama', 'Prepared feed']), 'kcal/mL', p.powder?.kcalPerMl) : '');
  return `<details data-details="label" class="label-toggle"${open}><summary>${esc(t('label'))}</summary><p class="muted">${esc(t('labelLead'))}</p><div class="label-edit">${fields}</div></details>`;
}
const numberAt = (obj, path) => { const key = path.split('.')[1]; return obj && typeof obj[key] === 'number' ? obj[key] : null; };
const numberAtDefault = (path) => {
  const [group, key] = path.split('.');
  if (group === 'module') return PRODUCT_DEFAULTS['protein-module'].proteinPer100g;
  if (group === 'powder') return PRODUCT_DEFAULTS.powder[key];
  return null;
};

function suppHtml(r) {
  if (!r.supplements.length) return `<section class="card"><h2>${esc(t('supplements'))}</h2><p class="muted">${esc(t('noSupplements'))}</p></section>`;
  const items = r.supplements.map((s) => `<div class="supp"><h3>${esc(L(s.name))}</h3><p class="dose">${esc(L(s.dose))}</p><p class="why">${s.why.map((w) => esc(L(w))).join(' · ')}</p><div>${s.src.map(srcChip).join('')}</div></div>`).join('');
  return `<section class="card"><h2>${esc(t('supplements'))}</h2>${items}</section>`;
}

function tableHtml(r) {
  const rows = r.plan?.rows ?? [];
  if (rows.length < 2) return '';
  const icu = r.input.setting === 'icu';
  const kind = r.route.kind;
  const dayLabel = icu ? t('icuDayCol') : t('feedDayCol');
  let head;
  let body;
  const pnTable = kind === 'pn' || kind === 'pn-later' || (kind === 'delay' && r.plan.pnAfterShock);
  if (pnTable) {
    head = `<th class="l">${esc(dayLabel)}</th><th>${esc(t('energyCol'))}</th><th>${esc(t('aaCol'))}</th>`;
    body = rows.map((x, i) => `<tr class="${i === 0 ? 'today' : ''}"><td>${icu ? x.icuDay : x.feedDay}${i === 0 ? ` (${esc(t('today'))})` : ''}</td><td>${nf(r10(x.pnKcal ?? x.kcal))}</td><td>${nf(Math.round(x.aminoAcids ?? x.protein))}</td></tr>`).join('');
  } else if (kind === 'en' || kind === 'delay') {
    const intermittent = rows[0].feeds;
    head = `<th class="l">${esc(dayLabel)}</th><th>${esc(t('energyCol'))}</th><th>${esc(t('proteinCol'))}</th><th class="l">${esc(t('formulaCol'))}</th><th>${esc(intermittent ? t('feedsCol') : t('rateCol'))}</th><th>${esc(t('moduleCol'))}</th>`;
    body = rows.map((x, i) => `<tr class="${i === 0 && kind !== 'delay' ? 'today' : ''}"><td>${icu ? x.icuDay : x.feedDay}${i === 0 ? ` (${esc(t('today'))})` : ''}</td><td>${nf(r10(x.kcalTarget))}</td><td>${nf(Math.round(x.proteinTarget))}</td><td class="l">${esc(L(CLASS_SHORT[x.cls]))}</td><td>${x.feeds ? `${x.feeds.n} × ${nf(x.feeds.ml)}` : nf(x.rate)}</td><td>${x.moduleProtein ? nf(x.moduleProtein) : '–'}</td></tr>`).join('');
  } else {
    head = `<th class="l">${esc(dayLabel)}</th><th>${esc(t('energyCol'))}</th><th>${esc(t('proteinCol'))}</th>`;
    body = rows.map((x, i) => `<tr class="${i === 0 ? 'today' : ''}"><td>${icu ? x.icuDay : x.feedDay}</td><td>${nf(r10(x.kcal))}</td><td>${nf(Math.round(x.protein))}</td></tr>`).join('');
  }
  const title = kind === 'delay' ? L(['Beslenme başlayınca ilerleme', 'Progression once feeding starts']) : t('progression');
  return `<section class="card"><h2>${esc(title)}</h2><div class="table-wrap"><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div></section>`;
}

function missingHtml(r) {
  const items = r.missing.filter((x) => x.card > 0 || x.impact !== 'low');
  if (!items.length) return `<section class="card missing"><h2>${esc(t('missingTitle'))}</h2><p class="muted">${esc(t('missingNone'))}</p></section>`;
  const level = { critical: ['Kritik', 'Critical'], high: ['Yüksek', 'High'], medium: ['Orta', 'Medium'], low: ['Düşük', 'Low'] };
  const list = items.map((x) => `<li><span class="txt"><span class="chip ${x.impact}">${esc(L(level[x.impact]))}</span> ${esc(L(x.text))}</span>${x.card > 0 ? `<button type="button" class="btn" data-fix="${x.card}" data-field="${esc(x.focus ?? x.field)}">${esc(t('add'))}</button>` : ''}</li>`).join('');
  return `<section class="card missing"><h2>${esc(t('missingTitle'))} (${items.length})</h2><p class="muted">${esc(t('missingLead'))}</p><ul>${list}</ul></section>`;
}

function notesHtml(r) {
  const parts = [];
  if (r.warnings.length) parts.push(r.warnings.map((w) => `<div class="warn"><strong>${esc(t('warnings'))}:</strong> ${esc(L(w))}</div>`).join(''));
  if (r.notes.length) parts.push(`<h2>${esc(t('notes'))}</h2>` + r.notes.map((n) => `<div class="note">${esc(L(n.text))}<div>${n.src.map(srcChip).join('')}</div></div>`).join(''));
  if (r.monitoring.length) parts.push(`<h2>${esc(t('monitoring'))}</h2><ul class="lines">${r.monitoring.map((m) => `<li>${esc(L(m))}</li>`).join('')}</ul>`);
  return parts.length ? `<section class="card">${parts.join('')}</section>` : '';
}

function detailsHtml(r) {
  const m = r.metrics;
  const nb = r.nitrogen;
  const rows = [];
  const add = (k, v) => rows.push(`<tr><td class="l">${esc(k)}</td><td class="l">${esc(v)}</td></tr>`);
  if (m.bmi) add(t('bmi'), nf(m.bmi, 1));
  if (m.ibw) add(t('ibw'), `${nf(m.ibw, 1)} kg`);
  if (m.energyWeight) add(t('weightUsed'), `${nf(m.energyWeight, 1)} kg — ${L(WEIGHT_KIND[m.energyWeightKind])}`);
  if (m.proteinWeight && m.proteinWeightKind !== m.energyWeightKind) add(t('proteinWeightUsed'), `${nf(m.proteinWeight, 1)} kg — ${L(WEIGHT_KIND[m.proteinWeightKind])}`);
  if (r.fullEnergy?.basis) add(t('energyBasis'), L(ENERGY_BASIS[r.fullEnergy.basis]));
  const why = r.plan?.rows?.[r.plan.rows.length - 1]?.proteinWhy ?? r.days?.[r.days.length - 1]?.proteinWhy;
  if (why) add(t('proteinBasis'), why.map((w) => L(PROTEIN_WHY[w])).join(' · '));
  add(t('refeeding'), L(REFEED_TEXT[r.refeeding.level]));
  add(t('nitrogen'), nb.status === 'unknown'
    ? L(nb.reason === 'kidney' ? ['Böbrek yetmezliğinde yorumlanmaz', 'Not interpreted in kidney failure'] : ['Ölçülmedi', 'Not measured'])
    : L([`${nf(nb.nb, 1)} g/gün → ${nb.status === 'catabolic' ? 'katabolik' : 'denge / anabolik'}; dengeyi sağlayan protein ≈ ${nf(Math.round(nb.replacementProtein))} g/gün${nb.diarrhea ? ' (ishalde kayıp olduğundan fazla)' : ''}`, `${nf(nb.nb, 1)} g/day → ${nb.status === 'catabolic' ? 'catabolic' : 'balanced / anabolic'}; protein for balance ≈ ${nf(Math.round(nb.replacementProtein))} g/day${nb.diarrhea ? ' (losses higher with diarrhoea)' : ''}`]));
  if (r.nonNutritional.total > 0) add(t('nonNutritional'), L([`${nf(r10(r.nonNutritional.total))} kcal/gün (propofol ${nf(r10(r.nonNutritional.propofolKcal))}, dekstroz ${nf(r10(r.nonNutritional.dextroseKcal))})`, `${nf(r10(r.nonNutritional.total))} kcal/day (propofol ${nf(r10(r.nonNutritional.propofolKcal))}, dextrose ${nf(r10(r.nonNutritional.dextroseKcal))})`]));
  const open = state.openDetails.has('calc') ? ' open' : '';
  return `<section class="card"><details data-details="calc"${open}><summary>${esc(t('details'))}</summary><div class="table-wrap"><table><tbody>${rows.join('')}</tbody></table></div></details></section>`;
}

// ---------------------------------------------------------------------------------------------
// Screening and assessment scales.
const STATUS = {
  risk: { cls: 'high', text: ['Risk var', 'At risk'] },
  no_risk: { cls: 'ok', text: ['Risk yok', 'No risk'] },
  met: { cls: 'high', text: ['Karşılandı', 'Met'] },
  not_met: { cls: 'ok', text: ['Karşılanmadı', 'Not met'] },
  probable: { cls: 'medium', text: ['Olası', 'Probable'] },
  review: { cls: 'medium', text: ['İnceleme gerekir', 'Needs review'] },
  incomplete: { cls: 'low', text: ['Eksik veri', 'Incomplete'] },
  not_applicable: { cls: 'low', text: ['Gerekmiyor', 'Not needed'] },
  info: { cls: 'low', text: ['Kaydedildi', 'Recorded'] },
};
const statusChip = (st) => `<span class="chip ${STATUS[st].cls}">${esc(L(STATUS[st].text))}</span>`;
const GRADE = { 0: ['yok', 'none'], 1: ['orta (evre 1)', 'moderate (stage 1)'], 2: ['ağır (evre 2)', 'severe (stage 2)'] };
const FROM = (from) => (from === 'data' ? L([' (verilerden)', ' (from the data)']) : from === 'measured' ? L([' (ölçülen ASM)', ' (measured ASM)']) : '');

function riskChips(r) {
  const s = r.scales;
  if (!s) return '';
  const chips = [];
  if (s.nrs.status !== 'incomplete') chips.push(`<span class="chip ${STATUS[s.nrs.status].cls}">NRS 2002: ${s.nrs.exact ? '' : '≥'}${s.nrs.score}</span>`);
  if (s.glim.status === 'met') chips.push(`<span class="chip high">${esc(L([`GLIM: ${s.glim.severe ? 'ağır' : 'orta'} malnütrisyon`, `GLIM: ${s.glim.severe ? 'severe' : 'moderate'} malnutrition`]))}</span>`);
  if (['met', 'probable'].includes(s.ewgsop2.status)) chips.push(`<span class="chip medium">${esc(L(s.ewgsop2.status === 'probable' ? ['Olası sarkopeni', 'Probable sarcopenia'] : ['Sarkopeni', 'Sarcopenia']))}</span>`);
  if (s.eat10.abnormal === true) chips.push(`<span class="chip medium">EAT-10: ${s.eat10.score}</span>`);
  return chips.length ? `<div class="risk-chips">${chips.join('')}</div>` : '';
}

function scaleRow(title, status, lines, sources) {
  return `<div class="scale"><h3>${esc(title)} ${statusChip(status)}</h3>${lines.filter(Boolean).map((x) => `<p>${esc(x)}</p>`).join('')}<div>${sources.map(srcChip).join('')}</div></div>`;
}

function scalesHtml(r) {
  const s = r.scales;
  if (!s) return '';
  const rows = [];
  // NRS 2002
  const n = s.nrs;
  const missingNrs = [n.disease === null ? L(['hastalık şiddeti', 'disease severity']) : null, n.nutritionOpen ? L(['beslenme puanı için kilo kaybı ve süresi, BKİ ile genel durum, son haftadaki alım', 'for the nutrition score: weight loss and its duration, BMI with general condition, intake in the last week']) : null, !n.ageKnown ? L(['yaş', 'age']) : null].filter(Boolean);
  const nrsLine = L([`Puan ${n.exact ? '' : 'en az '}${n.score} = beslenme ${n.nutrition}${n.nutritionFrom === 'entered' ? ' (girilen)' : ''} + hastalık ${n.disease ?? '?'} + yaş ${n.agePoint}${n.ageKnown ? '' : '?'}.`, `Score ${n.exact ? '' : 'at least '}${n.score} = nutrition ${n.nutrition}${n.nutritionFrom === 'entered' ? ' (entered)' : ''} + disease ${n.disease ?? '?'} + age ${n.agePoint}${n.ageKnown ? '' : '?'}.`]);
  rows.push(scaleRow('NRS 2002', n.status, [
    nrsLine,
    n.parts.length ? L(['Beslenme puanı: ', 'Nutrition score: ']) + n.parts.map((x) => L(x)).join('; ') : null,
    missingNrs.length && n.status !== 'risk' ? L(['Eksik: ', 'Missing: ']) + missingNrs.join(', ') : null,
    n.status === 'risk' ? L(['≥3: beslenme riski; bireysel beslenme planı yapılır ve GLIM ile malnütrisyon değerlendirilir.', '≥3: nutritional risk; an individual nutrition plan is made and malnutrition is assessed with GLIM.']) : n.status === 'no_risk' ? L(['<3: haftada bir yeniden tarayın.', '<3: rescreen weekly.']) : null,
  ], ['nrs2002-2003']));
  // GLIM
  const g = s.glim;
  const c = g.criteria;
  const phen = [c.weightLoss >= 1 ? L([`kilo kaybı ${L(GRADE[c.weightLoss])}`, `weight loss ${L(GRADE[c.weightLoss])}`]) : null, c.bmi >= 1 ? L([`düşük BKİ ${L(GRADE[c.bmi])}`, `low BMI ${L(GRADE[c.bmi])}`]) : null, c.muscle >= 1 ? L([`kas kitlesi azalmış ${L(GRADE[c.muscle])}${FROM(c.muscleFrom)}`, `reduced muscle mass ${L(GRADE[c.muscle])}${FROM(c.muscleFrom)}`]) : null].filter(Boolean);
  const etio = [c.intake === true ? L(['alım azlığı', 'reduced intake']) + FROM(c.intakeFrom) : null, c.inflammation === true ? L(['inflamasyon/hastalık yükü', 'inflammation/disease burden']) + FROM(c.inflammationFrom) : null].filter(Boolean);
  rows.push(scaleRow('GLIM', g.status, [
    g.status === 'met' ? L([`Malnütrisyon, ${g.severe ? 'ağır (evre 2)' : `orta (evre 1)${g.stageExact ? '' : '; eksik veriyle, daha ağır olabilir'}`}.`, `Malnutrition, ${g.severe ? 'severe (stage 2)' : `moderate (stage 1)${g.stageExact ? '' : '; with incomplete data, may be more severe'}`}.`])
      : g.status === 'not_met' ? L([g.phenotype === false ? 'Fenotipik ölçütlerin hiçbiri yok: GLIM malnütrisyonu yok.' : 'Etiyolojik ölçüt yok: GLIM tanısı konmaz.', g.phenotype === false ? 'No phenotypic criterion: no GLIM malnutrition.' : 'No etiologic criterion: no GLIM diagnosis.'])
        : L(['Tamamlanmadı: en az bir fenotipik (kilo kaybı ve süresi, BKİ, kas kitlesi) ve bir etiyolojik (alım azlığı, inflamasyon) ölçüt gerekir.', 'Incomplete: at least one phenotypic (weight loss and its duration, BMI, muscle mass) and one etiologic (reduced intake, inflammation) criterion are needed.']),
    phen.length ? L(['Fenotipik: ', 'Phenotypic: ']) + phen.join('; ') : null,
    etio.length ? L(['Etiyolojik: ', 'Etiologic: ']) + etio.join('; ') : null,
    s.nrs.status === 'no_risk' && g.status === 'met' ? L(['Not: NRS 2002 taraması negatif; GLIM normalde pozitif taramadan sonra uygulanır.', 'Note: NRS 2002 screening is negative; GLIM is normally applied after a positive screen.']) : null,
  ], ['glim-2019']));
  // ESPEN 2015
  const e = s.espen2015;
  if (e.status !== 'incomplete' || e.ffmi !== null || e.criteriaMet === true) {
    rows.push(scaleRow(L(['ESPEN 2015 malnütrisyon tanısı', 'ESPEN 2015 malnutrition diagnosis']), e.status, [
      e.status === 'met' ? L([e.option === 1 ? 'Seçenek 1: BKİ <18,5.' : 'Seçenek 2: istemsiz kilo kaybı ile düşük BKİ ya da düşük yağsız kütle indeksi.', e.option === 1 ? 'Option 1: BMI <18.5.' : 'Option 2: unintentional weight loss with a low BMI or a low fat-free mass index.'])
        : e.status === 'not_met' ? L(['Ölçütler karşılanmadı.', 'Criteria not met.']) : e.status === 'not_applicable' ? L(['Tarama negatif: tanı değerlendirmesi gerekmez.', 'Negative screening: no diagnostic assessment needed.'])
          : e.screen === null && e.criteriaMet === true ? L(['Tanı ölçütleri karşılanıyor; tanı pozitif taramadan sonra konur: NRS 2002’yi tamamlayın.', 'The diagnostic criteria are met; the diagnosis follows a positive screen: complete NRS 2002.'])
            : e.screen === null ? L(['Önce NRS 2002 taraması tamamlanmalı; ayrıca BKİ, kilo kaybı ve süresi ya da yağsız kütle gerekir.', 'NRS 2002 screening must be completed first; BMI, weight loss and its duration, or fat-free mass are also needed.'])
              : L(['Tamamlanmadı: BKİ, kilo kaybı ve süresi ya da yağsız kütle gerekir.', 'Incomplete: BMI, weight loss and its duration, or fat-free mass are needed.']),
      e.ffmi !== null ? L([`Yağsız kütle indeksi ${nf(e.ffmi, 1)} kg/m² (düşük: kadın <15, erkek <17).`, `Fat-free mass index ${nf(e.ffmi, 1)} kg/m² (low: women <15, men <17).`]) : null,
    ], ['espen-malnutrition-2015']));
  }
  // AND/ASPEN
  const a = s.aspen;
  if (a.entered) {
    rows.push(scaleRow('AND/ASPEN', a.status, [
      L([`${a.count}/${a.total} özellik doğrulandı, ${a.unknown} değerlendirilmedi${a.context ? '' : '; bağlam seçilmedi'}. En az 2 özellik malnütrisyonu destekler; şiddet otomatik verilmez.`, `${a.count}/${a.total} characteristics confirmed, ${a.unknown} not assessed${a.context ? '' : '; no context chosen'}. At least 2 support malnutrition; severity is not assigned automatically.`]),
      a.gripExcluded ? L(['Yoğun bakımda kavrama gücü sayılmaz.', 'Grip strength is not counted in the ICU.']) : null,
    ], ['aspen-malnutrition-2012']));
  }
  // EWGSOP2
  const w = s.ewgsop2;
  if (w.entered) {
    const text = {
      met: w.severe ? ['Ağır sarkopeni: düşük güç, düşük kas miktarı ve düşük performans.', 'Severe sarcopenia: low strength, low muscle quantity and low performance.'] : ['Sarkopeni: düşük güç ve düşük kas miktarı.', 'Sarcopenia: low strength and low muscle quantity.'],
      probable: ['Olası sarkopeni: düşük kas gücü; kas miktarı ölçülmedi.', 'Probable sarcopenia: low muscle strength; muscle quantity not measured.'],
      review: w.confounded ? ['Yoğun bakım ya da karıştırıcı etken: ölçümler yalnız kayıt içindir, sarkopeni sınıflaması yapılmaz.', 'ICU or a confounder: the measurements are for the record only; no sarcopenia classification.'] : ['Düşük güç, kas miktarı normal: diğer nedenleri araştırın.', 'Low strength with normal muscle quantity: look for other causes.'],
      not_met: ['Kas gücü normal: sarkopeni olası değil.', 'Normal muscle strength: sarcopenia unlikely.'],
      incomplete: ['Kas gücü (kavrama ya da sandalye testi) ve cinsiyet gerekir.', 'Muscle strength (grip or chair test) and sex are needed.'],
    }[w.status];
    rows.push(scaleRow('EWGSOP2', w.status, [
      L(text),
      w.asmIndex !== null ? L([`ASM/boy² ${nf(w.asmIndex, 2)} kg/m² (düşük: erkek <7,0, kadın <5,5).`, `ASM/height² ${nf(w.asmIndex, 2)} kg/m² (low: men <7.0, women <5.5).`]) : null,
      !w.massReliable && r.input.oedema === true ? L(['Ödemde kas miktarı eşikleri kullanılmadı.', 'Muscle-quantity cut-offs not used with oedema.']) : null,
    ], ['ewgsop2-2019']));
  }
  // EAT-10, FOIS, IDDSI and swallowing
  const t10 = s.eat10;
  if (t10.entered) rows.push(scaleRow('EAT-10', t10.status, [L([`Puan ${t10.score} (≥3 anormal).${t10.unreliable ? ' Uyanıklık bozukken öz bildirim güvenilir değil.' : ''}`, `Score ${t10.score} (≥3 abnormal).${t10.unreliable ? ' Self-report is unreliable with impaired alertness.' : ''}`])], ['eat10-2008', 'eat10-tr-2016']));
  if (s.fois !== null) rows.push(scaleRow('FOIS', 'info', [L([`Düzey ${s.fois}: ${FOIS_TEXT[s.fois].tr}.`, `Level ${s.fois}: ${FOIS_TEXT[s.fois].en}.`])], ['fois-2005']));
  if (s.iddsi.food !== null || s.iddsi.fluid !== null) rows.push(scaleRow('IDDSI', 'info', [L([
    [s.iddsi.food !== null ? `Yiyecek ${s.iddsi.food} (${IDDSI_FOOD[s.iddsi.food].tr})` : null, s.iddsi.fluid !== null ? `içecek ${s.iddsi.fluid} (${IDDSI_DRINK[s.iddsi.fluid].tr})` : null].filter(Boolean).join(', ') + '.',
    [s.iddsi.food !== null ? `Food ${s.iddsi.food} (${IDDSI_FOOD[s.iddsi.food].en})` : null, s.iddsi.fluid !== null ? `drinks ${s.iddsi.fluid} (${IDDSI_DRINK[s.iddsi.fluid].en})` : null].filter(Boolean).join(', ') + '.',
  ])], ['iddsi-2017']));
  const sw = s.swallow;
  if (sw.found.some((x) => x.from !== 'entered') || s.assessment) {
    const word = { safe: ['güvenle yiyebilir', 'can eat safely'], modified: ['kıvam ayarlı diyet', 'texture-modified diet'], unsafe: ['ağızdan beslenmez', 'no oral feeding'] };
    const how = { none: ['yapılmadı', 'not done'], bedside: ['yatak başı', 'bedside'], fees: ['FEES', 'FEES'], vfss: ['VFSS', 'VFSS'] };
    rows.push(scaleRow(L(['Yutma güvenliği', 'Swallowing safety']), sw.value === 'unsafe' || sw.conflict ? 'review' : sw.value ? 'info' : 'incomplete', [
      sw.value ? L([`Kullanılan yutma durumu: ${word[sw.value][0]}${sw.conflict ? ' (bilgiler çelişiyor; en temkinlisi seçildi)' : ''}.`, `Swallowing used: ${word[sw.value][1]}${sw.conflict ? ' (findings disagree; the most cautious was chosen)' : ''}.`]) : null,
      s.assessment ? L([`Yutma değerlendirmesi: ${how[s.assessment][0]}.`, `Swallowing assessment: ${how[s.assessment][1]}.`]) : null,
      L(['Yatak başı bulgular sessiz aspirasyonu dışlamaz; gerekirse VFSS ya da FEES.', 'Bedside findings do not exclude silent aspiration; VFSS or FEES if needed.']),
    ], ['ueg-esnm-2025']));
  }
  const open = state.openDetails.has('scales') ? ' open' : '';
  return `<section class="card"><details data-details="scales"${open}><summary>${esc(L(['Tarama ve değerlendirme ölçekleri', 'Screening and assessment scales']))}</summary>${rows.join('')}</details></section>`;
}

function sourcesHtml(r) {
  const open = state.openDetails.has('src') ? ' open' : '';
  const items = r.sources.filter((id) => SOURCES[id]).map((id) => {
    const s = SOURCES[id];
    const links = [s.pmid ? `<a href="https://pubmed.ncbi.nlm.nih.gov/${s.pmid}/" target="_blank" rel="noopener noreferrer">PMID ${s.pmid}</a>` : '', s.doi ? `<a href="https://doi.org/${s.doi}" target="_blank" rel="noopener noreferrer">DOI</a>` : '', s.url ? `<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(L(['Resmî metin', 'Official text']))}</a>` : ''].filter(Boolean).join(' · ');
    return `<li><strong>${esc(L(s.short))}</strong> — ${esc(s.cite)} ${links}<br><span class="muted">${esc(L(s.used))}</span></li>`;
  }).join('');
  return `<section class="card"><details data-details="src"${open}><summary>${esc(t('sources'))} (${r.sources.length})</summary><ol class="src-list">${items}</ol></details></section>`;
}

// Partly entered labels are completed from the recommended class, so one changed value already counts.
const filled = (obj, keys) => obj && keys.some((k) => String(obj[k] ?? '').trim() !== '');
// Label values outside their limits are shown as errors at the field and not used.
const cleanLabel = (group, obj) => (obj ? Object.fromEntries(Object.entries(obj).filter(([k, v]) => k === 'unit' || !checkProduct(`${group}.${k}`, v))) : obj);
function engineInput() {
  const { form } = state.product;
  const module = cleanLabel('module', state.product.module);
  const powder = cleanLabel('powder', state.product.powder);
  const enLabel = cleanLabel('en', state.product.en);
  const onsLabel = cleanLabel('ons', state.product.ons);
  const base = recommend({ ...state.values, product: { module, form, powder } });
  const c = base.product?.composition ?? {};
  const pr = { module, form, powder };
  const pick = (v, d) => (String(v ?? '').trim() !== '' ? v : d);
  if (filled(enLabel, ['kcalPerMl', 'proteinPer100', 'waterPer100']) && 'kcalPerMl' in c) {
    const en = enLabel;
    pr.en = { kcalPerMl: pick(en.kcalPerMl, c.kcalPerMl), proteinPer100: pick(en.proteinPer100, c.proteinPer100), waterPer100: pick(en.waterPer100, c.waterPer100) };
  }
  if (filled(onsLabel, ['serving', 'kcal', 'protein']) && 'serving' in c) {
    const ons = onsLabel;
    pr.ons = { serving: pick(ons.serving, c.serving), kcal: pick(ons.kcal, c.kcal), protein: pick(ons.protein, c.protein), unit: c.unit };
  }
  return { ...state.values, product: pr };
}

function renderResult() {
  const r = recommend(engineInput());
  const box = $('#result');
  const actions = `<div class="actions"><button type="button" class="btn" data-act="edit">${esc(t('edit'))}</button><div class="right"><button type="button" class="btn" data-act="new">${esc(t('newPatient'))}</button><button type="button" class="btn primary" data-act="print">${esc(t('print'))}</button></div></div>`;
  if (r.blocked) {
    if (r.invalid?.length) {
      const items = r.invalid.map((k) => {
        const at = locateField(k);
        const name = at ? `${L(at.field.label)} (${at.step}. ${L(['adım', 'step'])})` : k;
        const why = at ? fieldError(at.field, state.values[k]) ?? L(['Geçersiz değer.', 'Invalid value.']) : L(['Geçersiz değer.', 'Invalid value.']);
        return `<li><span class="txt"><strong>${esc(name)}</strong>: ${esc(why)}</span>${at ? `<button type="button" class="btn" data-fix="${at.step}" data-field="${esc(k)}">${esc(L(['Düzelt', 'Correct']))}</button>` : ''}</li>`;
      }).join('');
      box.innerHTML = `<section class="card summary missing"><h2>${esc(t('blocked'))}</h2><p class="big">${esc(L(['Hesap yapılmadı: aşağıdaki değerleri düzeltin.', 'No calculation was made: correct the values below.']))}</p><ul>${items}</ul>${actions}</section>`;
      return;
    }
    box.innerHTML = `<section class="card summary"><h2>${esc(t('blocked'))}</h2><p class="big">${esc(L(r.blocked))}</p>${actions}</section>`;
    return;
  }
  if (!r.plan) {
    box.innerHTML = `<section class="card summary"><span class="route">${esc(L(ROUTE_TEXT[r.route.kind] ?? ['', '']))}</span><h2>${esc(t('todayPlan'))}</h2><p class="big">${esc(L(['Miktar hesaplamak için kilo ya da boy gerekli.', 'Weight or height is needed to calculate amounts.']))}</p></section>${missingHtml(r)}${scalesHtml(r)}${actions}`;
    return;
  }
  box.innerHTML = summaryHtml(r) + suppHtml(r) + tableHtml(r) + missingHtml(r) + scalesHtml(r) + notesHtml(r) + detailsHtml(r) + sourcesHtml(r) + actions;
}

function renderFooter() {
  $('#foot').innerHTML = `<p><strong>${esc(t('intended'))}</strong></p><p>${esc(t('privacy'))}</p>
    <p class="no-print">NutriClinic ${esc(ENGINE_VERSION)} · ${esc(L(['Kurallar', 'Rules']))} ${esc(RULES_DATE)} · Dr. Gökay Duman · <a href="LICENSE.txt">${esc(t('license').split('·')[0].trim())}</a> · <a href="source-code.zip">${esc(t('license').split('·')[1].trim())}</a></p>
    <p class="no-print"><a href="../nutriclinic2/">${esc(t('oldVersion'))}</a></p>`;
}

function render() {
  document.documentElement.lang = lang;
  document.title = `NutriClinic · ${lang === 'tr' ? 'Beslenme önerisi' : 'Nutrition recommendation'}`;
  document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll('[data-lang]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
  renderProgress();
  const cards = $('#cards');
  const result = $('#result');
  if (state.view === 'result') { cards.hidden = true; result.hidden = false; renderResult(); }
  else { result.hidden = true; cards.hidden = false; renderCards(); }
  renderFooter();
}

// ---------------------------------------------------------------------------------------------
// Events
function go(step, focusKey) {
  if (step === 'result') { state.view = 'result'; render(); $('#result').scrollIntoView({ block: 'start' }); return; }
  state.view = 'cards';
  state.step = Math.min(STEPS.length, Math.max(1, Number(step)));
  render();
  if (focusKey && focusField(focusKey)) return;
  window.scrollTo({ top: 0 });
  document.querySelector('#cards input, #cards button[data-seg]')?.focus({ preventScroll: true });
}

function setLabelValue(path, value) {
  const [group, key] = path.split('.');
  state.product[group] = { ...(state.product[group] ?? {}), [key]: value };
  if (group === 'ons') state.product.ons.unit = state.product.ons.unit ?? (effectiveSwallow(state.values) === 'modified' ? 'g' : 'mL');
}

document.addEventListener('click', (e) => {
  const el = e.target.closest('button');
  if (!el) return;
  if (el.dataset.lang) {
    lang = el.dataset.lang;
    try { localStorage.setItem(LANGUAGE_STORAGE_KEY, lang); } catch { /* storage unavailable */ }
    render();
    return;
  }
  if (el.id === 'example') {
    state.values = { setting: 'icu', age: 67, sex: 'male', heightCm: 172, weightKg: 78, icuDay: 3, swallow: 'unsafe', gi: 'ok', shock: 'none', feeding: 'ongoing', kidney: 'normal', bowel: 'normal', stroke: true, usualWeightKg: 81, lossMonths: '3', lowIntakeDays: 2, nrsDisease: '3', lowElectrolytes: 'no', alcohol: 'no', riskDrugs: 'no', propofolMlH: 8 };
    state.product = {};
    go('result');
    return;
  }
  if (el.dataset.goto) { go(el.dataset.goto === 'result' ? 'result' : Number(el.dataset.goto)); return; }
  if (el.dataset.fix) { go(Number(el.dataset.fix), el.dataset.field); return; }
  if (el.dataset.seg) {
    const key = el.dataset.seg;
    const value = el.dataset.value;
    if (state.values[key] === value && !el.dataset.fixed) delete state.values[key];
    else state.values[key] = value;
    const scroll = window.scrollY;
    renderCards();
    window.scrollTo({ top: scroll });
    document.querySelector(`[data-seg="${key}"][data-value="${value}"]`)?.focus();
    return;
  }
  if (el.dataset.form) {
    state.product.form = el.dataset.form === 'powder' ? 'powder' : undefined;
    state.openDetails.add('label');
    const scroll = window.scrollY;
    renderResult();
    window.scrollTo({ top: scroll });
    return;
  }
  const act = el.dataset.act;
  if ((act === 'next' || act === 'show') && state.view === 'cards') {
    const bad = flatFields(STEPS[state.step - 1].fields(state.values)).find((f) => f.type === 'num' && fieldError(f, state.values[f.key]));
    if (bad) { showFieldErrors(); focusField(bad.key); return; }
  }
  if (act === 'next') go(state.step + 1);
  else if (act === 'back') go(state.step - 1);
  else if (act === 'show') go('result');
  else if (act === 'edit') go(state.step);
  else if (act === 'print') window.print();
  else if (act === 'new') { state.values = { setting: state.values.setting ?? 'icu' }; state.product = {}; state.openDetails.clear(); go(1); }
});

document.addEventListener('change', (e) => {
  const field = e.target.closest('#cards input[data-key]');
  if (field) setFieldError(field, fieldError(currentField(field.dataset.key), field.value));
  const box = e.target.closest('input[type="checkbox"][data-check]');
  if (box) {
    state.values[box.dataset.check] = box.checked;
    const field = box.closest('.field');
    const hint = field?.querySelector('.unlock');
    if (hint) hint.hidden = [...field.querySelectorAll('input[type="checkbox"]')].some((x) => x.checked);
  }
});

document.addEventListener('input', (e) => {
  const input = e.target;
  if (input.dataset.key) {
    state.values[input.dataset.key] = input.value;
    const hint = document.querySelector(`[data-unlock="${input.dataset.key}"]`);
    if (hint) hint.hidden = input.value.trim() !== '';
    // A shown error disappears as soon as the value is valid; a new error appears when leaving the field.
    const f = currentField(input.dataset.key);
    if (f && !fieldError(f, input.value)) setFieldError(input, null);
    return;
  }
  if (input.dataset.label) {
    setLabelValue(input.dataset.label, input.value);
    const id = input.id;
    const pos = input.selectionStart;
    const scroll = window.scrollY;
    state.openDetails.add('label');
    renderResult();
    window.scrollTo({ top: scroll });
    const again = document.getElementById(id);
    if (again) { again.focus(); try { again.setSelectionRange(pos, pos); } catch { /* not a text input */ } }
  }
});

document.addEventListener('toggle', (e) => {
  const d = e.target;
  if (d.dataset?.details) { if (d.open) state.openDetails.add(d.dataset.details); else state.openDetails.delete(d.dataset.details); }
  if (d.dataset?.more) { if (d.open) state.openMore.add(d.dataset.more); else state.openMore.delete(d.dataset.more); }
}, true);

document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && e.target.matches('#cards input[data-key]')) {
    e.preventDefault();
    const inputs = [...document.querySelectorAll('#cards input[data-key]')].filter((x) => x.offsetParent !== null);
    const i = inputs.indexOf(e.target);
    if (i < inputs.length - 1) inputs[i + 1].focus(); else go(state.step < STEPS.length ? state.step + 1 : 'result');
  }
});

render();
