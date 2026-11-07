// NutriClinic staged interface. With device storage on, cases are kept in this browser; on the site only when the
// clinician ticks it, and then anonymised (without the case label) under a case code that this device matches.
// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Gökay Duman
import { recommend, normalize, checkNumber, checkProduct, ENGINE_VERSION, RULES_DATE, PRODUCT_DEFAULTS } from './engine.mjs';
import { swallowStatus, FOIS_TEXT, IDDSI_FOOD, IDDSI_DRINK } from './scales.mjs';
import { LABS, LAB_KEYS, LIMIT_KEYS, checkLab, defaultUnit, unitKey, importText, rowsFromText } from './labs.mjs';
import { followupSummary, checkFollowupValue, FOLLOWUP_FIELDS, MAX_FOLLOWUP_ROWS } from './followup.mjs';
import { SOURCES } from './sources.mjs';
import { getInitialLocale, LANGUAGE_STORAGE_KEY } from './initial-locale.mjs';
import { newCaseId, deviceStorageOn, setDeviceStorage, listCases, getCase, putCase, renameCase, deleteCase, clearCases, setCurrentCaseId, caseToReopen, markSite, clearSiteMarks, cleanLabel as cleanCaseLabel, MAX_CASES } from './cases.mjs';
import { TOKEN_KEY, PENDING_KEY, isToken, newToken, siteApi, pushCases } from './vault.mjs';

let lang = getInitialLocale();
const state = { step: 1, values: { setting: 'icu' }, product: {}, followup: [], decisions: {}, view: 'cards', prevView: 'cards', evidenceQuery: '', evidenceKind: '', openDetails: new Set(), openMore: new Set(), caseId: null, caseLabel: '', example: false, reopened: null, siteMsg: null };

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
  privacy: ['Vakalar bu tarayıcıda tutulur ve Vakalarım’dan silinebilir. Sitede saklamayı seçerseniz vakalar bu cihazda kişisel kodunuzla şifrelenip gönderilir; sunucu içeriği okuyamaz.', 'Cases are kept in this browser and can be deleted under My cases. If you choose to keep them on the site, they are encrypted on this device with your personal code before they are sent; the server cannot read them.'],
  myCases: ['Vakalarım', 'My cases'],
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
  openCase: ['Vaka aç', 'Open case'],
  saveCase: ['Vakayı kaydet (JSON)', 'Save case (JSON)'],
  tableCsv: ['Tablo (CSV)', 'Table (CSV)'],
  inputs: ['Girilen bilgiler', 'Entered data'],
  fileNote: ['Kaydedilen dosya yalnız bu cihaza iner ve hasta bilgisi içerir: kurum kurallarına göre saklayın.', 'The saved file is downloaded to this device only and contains patient data: keep it according to local rules.'],
  caseError: ['Bu dosya bir NutriClinic vaka dosyası değil.', 'This file is not a NutriClinic case file.'],
  decisionsDropped: ['Vaka dosyasındaki bazı karar seçimleri bu sürümde tanınmadı ve alınmadı.', 'Some decision choices in the case file are not known to this version and were not taken.'],
};
const L = (x) => (Array.isArray(x) ? x[lang === 'tr' ? 0 : 1] : x && typeof x === 'object' && 'tr' in x ? x[lang] : x ?? '');
const t = (key) => L(T[key]);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const nf = (x, d = 0) => (x === null || x === undefined || !Number.isFinite(x) ? '–' : Number(x).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-GB', { minimumFractionDigits: d, maximumFractionDigits: d }));
const r10 = (x) => Math.round(x / 10) * 10;

// ---------------------------------------------------------------------------------------------
// Steps and fields
const yesNoUnknown = [{ value: 'yes', label: T.yes }, { value: 'no', label: T.no }, { value: 'unknown', label: T.unknown }];
const yesNo = [{ value: 'yes', label: T.yes }, { value: 'no', label: T.no }];
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
  {
    title: ['Laboratuvar', 'Laboratory'],
    lead: ['İsteğe bağlı. Değeri kendi laboratuvarınızın biriminde girin; dönüşümü ben yaparım.', 'Optional. Enter each value in your laboratory’s unit; I convert it.'],
    fields: (v) => [
      { key: 'phosphate', type: 'lab', label: v.feeding === 'ongoing' ? ['Fosfor (şimdiki)', 'Phosphate (now)'] : ['Fosfor (fosfat)', 'Phosphate'], unlock: ['Fosforu girerseniz beslenme öncesi düşüklüğü ve beslenme sırasında refeeding hipofosfatemisini (<0,65 mmol/L ya da >0,16 mmol/L düşüş) ben belirlerim.', 'Enter phosphate and I detect a low pre-feeding level and refeeding hypophosphataemia during feeding (<0.65 mmol/L or a fall >0.16 mmol/L).'] },
      ...(v.feeding === 'ongoing' ? [{ key: 'phosphateBefore', type: 'lab', label: ['Beslenme başlamadan önceki fosfor', 'Phosphate before feeding started'], hint: ['Düşüşü hesaplamak için', 'To calculate the fall'] }] : []),
      { key: 'potassium', type: 'lab', label: ['Potasyum', 'Potassium'] },
      { key: 'magnesium', type: 'lab', label: ['Magnezyum', 'Magnesium'] },
      { key: 'more-limits', type: 'more', label: ['Laboratuvarınızın referans aralıkları', 'Your laboratory’s reference intervals'], lead: ['Raporunuzdaki alt ve üst sınırlar, değerle aynı birimde. Hazır bir değer konmaz.', 'The lower and upper limits on your report, in the same unit as the value. No default is assumed.'],
        unlock: ['K, P ve Mg alt sınırlarını girerseniz beslenme öncesi düşüklüğü (NICE) ben belirlerim; diğer sınırlar sonuçta düşük/yüksek işareti ve CRP oranı verir.', 'Enter the K, P and Mg lower limits and I decide whether the pre-feeding level is low (NICE); the other limits give low/high marks and the CRP ratio in the result.'],
        fields: [{ key: 'limits-table', type: 'limits', rows: LIMIT_KEYS }] },
      { key: 'more-import', type: 'more', label: ['Dosyadan aktar (CSV, JSON, PDF, TXT)', 'Import from a file (CSV, JSON, PDF, TXT)'],
        unlock: ['Laboratuvar dökümünü CSV ya da JSON olarak verirseniz değerleri önizleyip seçerek aktarırım.', 'Give a laboratory export as CSV or JSON and I preview the values and import the ones you choose.'],
        fields: [{ key: 'import', type: 'import', label: ['Dosya seçin', 'Choose a file'], hint: ['Dosya bu cihazda okunur, hiçbir yere gönderilmez. CSV/JSON sütunları: test, value (değer) ve unit (birim) gerekli; date (tarih) isteğe bağlı. PDF’te laboratuvar satırları tanınmaya çalışılır; TXT okunması için gösterilir.', 'The file is read on this device and sent nowhere. CSV/JSON columns: test, value and unit are required; date is optional. In a PDF, laboratory lines are recognised where possible; a TXT file is shown for reading.'] }] },
      { key: 'crp', type: 'lab', label: ['CRP', 'CRP'], unlock: v.setting === 'ward' ? ['CRP’yi girerseniz yüksek inflamasyonda (>100 mg/L) beslenme desteğine beklenen yanıtı belirtirim.', 'Enter CRP to flag the expected response to nutrition support with high inflammation (>100 mg/L).'] : ['CRP’yi girerseniz inflamasyon bağlamını sonuçta gösteririm.', 'Enter CRP to show the inflammatory context in the result.'] },
      { key: 'albumin', type: 'lab', label: ['Albümin', 'Albumin'], hint: ['Malnütrisyon ölçütü değildir; PNI için', 'Not a malnutrition criterion; used for PNI'] },
      { key: 'lymphocytes', type: 'lab', label: ['Lenfosit (mutlak sayı)', 'Lymphocytes (absolute count)'], unlock: ['Albümin ve lenfositle PNI’yi, nötrofille NLR’yi hesaplarım (yalnız bilgi; doz değişmez).', 'With albumin and lymphocytes I calculate PNI, with neutrophils NLR (context only; no dose change).'] },
      { key: 'neutrophils', type: 'lab', label: ['Nötrofil (mutlak sayı)', 'Neutrophils (absolute count)'] },
      { key: 'urea', type: 'lab', label: ['Üre', 'Urea'], unlock: ['Üre ve kreatininle üre/kreatinin oranını katabolizma göstergesi olarak gösteririm (araştırma belirteci; doz değişmez).', 'With urea and creatinine I show the urea/creatinine ratio as a catabolism marker (research marker; no dose change).'] },
      { key: 'creatinine', type: 'lab', label: ['Kreatinin', 'Creatinine'] },
      ...(v.setting !== 'ward' ? [{ key: 'lactate', type: 'lab', label: ['Laktat', 'Lactate'] }] : []),
      { key: 'vitD', type: 'lab', label: ['25(OH) D vitamini', '25(OH) vitamin D'], unlock: ['25(OH)D girerseniz D vitamini eksikliğine göre öneride bulunurum.', 'Enter 25(OH)D for a vitamin D recommendation.'] },
      ...(v.setting !== 'ward' ? [{ key: 'more-sofa', type: 'more', label: ['SOFA-2 ve SAPS II (isteğe bağlı)', 'SOFA-2 and SAPS II (optional)'],
        lead: ['Aynı 24 saatin en kötü değerleri. Böbrek bileşeni 3. adımdaki diyaliz seçimini ve bu karttaki kreatinini kullanır. Ciddiyet bağlamıdır; beslenme dozunu değiştirmez.', 'Worst values of the same 24 hours. The kidney component uses the dialysis answer in step 3 and the creatinine on this card. Severity context; it does not change nutrition doses.'],
        unlock: ['Altı organ bileşenini girerseniz SOFA-2 toplamını hesaplarım; eksik bileşen sıfır sayılmaz.', 'Enter the six organ components and I calculate the SOFA-2 total; a missing component is not counted as zero.'],
        fields: [
          { key: 'sofaGcs', type: 'num', label: ['Glasgow koma skalası', 'Glasgow coma scale'], unit: ['3–15', '3–15'] },
          { key: 'sofaDelirium', type: 'seg', label: ['Deliryum', 'Delirium'], options: yesNo },
          { key: 'sofaPao2', type: 'num', label: ['PaO₂', 'PaO₂'], unit: ['mmHg', 'mmHg'] },
          { key: 'sofaFio2', type: 'num', label: ['FiO₂', 'FiO₂'], unit: ['%', '%'] },
          { key: 'sofaVent', type: 'seg', stack: true, wide: true, label: ['Solunum desteği', 'Respiratory support'], options: [{ value: 'none', label: ['İleri destek yok', 'No advanced support'] }, { value: 'advanced', label: ['Özgün tanıma göre ileri destek', 'Advanced support under the original definition'] }, { value: 'ecmo', label: ['Solunumsal ECMO', 'Respiratory ECMO'] }] },
          { key: 'sofaMap', type: 'num', label: ['Ortalama arter basıncı', 'Mean arterial pressure'], unit: ['mmHg', 'mmHg'] },
          { key: 'sofaNe', type: 'num', label: ['Noradrenalin hızı', 'Norepinephrine rate'], unit: ['µg/kg/dk', 'µg/kg/min'] },
          { key: 'sofaEpi', type: 'num', label: ['Adrenalin hızı', 'Epinephrine rate'], unit: ['µg/kg/dk', 'µg/kg/min'] },
          { key: 'sofaOtherVaso', type: 'seg', label: ['Başka vazopresör ya da inotrop', 'Any other vasopressor or inotrope'], options: yesNo },
          { key: 'sofaMechanical', type: 'seg', label: ['Tanıma göre kardiyovasküler mekanik destek', 'Cardiovascular mechanical support per definition'], options: yesNo },
          { key: 'bilirubin', type: 'lab', label: ['Total bilirubin', 'Total bilirubin'] },
          { key: 'platelets', type: 'lab', label: ['Trombosit', 'Platelets'] },
          { key: 'sofaUrine', type: 'seg', stack: true, wide: true, label: ['İdrar çıkışı', 'Urine output'], options: [{ value: 'normal', label: ['Ölçüt yok', 'No criterion'] }, { value: 'oliguria6', label: ['6–12 saat <0,5 mL/kg/saat', '<0.5 mL/kg/h for 6–12 h'] }, { value: 'oliguria12', label: ['≥12 saat <0,5 mL/kg/saat', '<0.5 mL/kg/h for ≥12 h'] }, { value: 'oliguria24', label: ['≥24 saat <0,3 mL/kg/saat', '<0.3 mL/kg/h for ≥24 h'] }, { value: 'anuria12', label: ['≥12 saat anüri', 'Anuria for ≥12 h'] }] },
          { key: 'saps2', type: 'num', label: ['SAPS II toplamı (özgün formdan)', 'SAPS II total (original form)'], unit: ['0–163', '0–163'] },
        ] }] : []),
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
  // Keep the current step visible in the horizontally scrolling bar (phones), without scrolling the page.
  const current = nav.querySelector('[aria-current="step"]');
  if (current && nav.scrollWidth > nav.clientWidth) nav.scrollLeft = Math.max(0, current.offsetLeft - nav.offsetLeft - (nav.clientWidth - current.offsetWidth) / 2);
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
  if (f.type === 'lab') {
    const val = v[f.key] ?? '';
    const unit = v[unitKey(f.key)] ?? defaultUnit(f.key);
    const err = fieldError(f, val);
    const units = LABS[f.key].units;
    const unitHtml = units.length > 1 && !LABS[f.key].unitOf
      ? `<select class="unit-select" data-unit="${f.key}" aria-label="${esc(L(f.label))}: ${esc(L(['birim', 'unit']))}">${units.map(([u]) => `<option value="${esc(u)}"${u === unit ? ' selected' : ''}>${esc(u)}</option>`).join('')}</select>`
      : `<span class="unit">${esc(unit)}</span>`;
    return `<div class="field${wide}"><label for="f-${f.key}">${esc(L(f.label))}</label>
      <div class="input-wrap${err ? ' invalid' : ''}"><input id="f-${f.key}" data-key="${f.key}" inputmode="decimal" autocomplete="off" enterkeyhint="next" value="${esc(val)}" aria-describedby="err-${f.key}"${err ? ' aria-invalid="true"' : ''}>${unitHtml}</div>
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
  if (f.type === 'limits') {
    const cell = (k, side) => {
      const key = `${k}${side}`;
      const val = v[key] ?? '';
      const err = fieldError({ key, type: 'lab' }, val);
      const name = `${L(LAB_NAMES[k])} ${L(side === 'Low' ? ['alt sınırı', 'lower limit'] : ['üst sınırı', 'upper limit'])}`;
      return `<td><div class="input-wrap${err ? ' invalid' : ''}"><input id="f-${key}" data-key="${key}" inputmode="decimal" autocomplete="off" value="${esc(val)}" aria-label="${esc(name)}" aria-describedby="err-${key}"${err ? ' aria-invalid="true"' : ''}></div><p class="field-error" id="err-${key}" aria-live="polite"${err ? '' : ' hidden'}>${esc(err ?? '')}</p></td>`;
    };
    const rows = f.rows.map((k) => `<tr><th scope="row" class="l">${esc(L(LAB_NAMES[k]))}</th><td class="l">${esc(v[unitKey(k)] ?? defaultUnit(k))}</td>${cell(k, 'Low')}${cell(k, 'High')}</tr>`).join('');
    return `<div class="field wide"><div class="table-wrap"><table class="limits"><thead><tr><th class="l">Test</th><th class="l">${esc(L(['Birim', 'Unit']))}</th><th>${esc(L(['Alt sınır', 'Lower limit']))}</th><th>${esc(L(['Üst sınır', 'Upper limit']))}</th></tr></thead><tbody>${rows}</tbody></table></div></div>`;
  }
  if (f.type === 'import') return importHtml(f);
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
  if (f.type === 'limits') return f.rows.some((k) => ['Low', 'High'].some((side) => String(v[`${k}${side}`] ?? '').trim() !== ''));
  if (f.type === 'import') return Boolean(state.import);
  if (f.type === 'more') return f.fields.some(hasValue);
  const x = v[f.key];
  return x !== undefined && x !== null && String(x).trim() !== '' && x !== 'unknown';
}
const flatFields = (fields) => fields.flatMap((f) => (f.type === 'more' ? flatFields(f.fields)
  : f.type === 'limits' ? f.rows.flatMap((k) => ['Low', 'High'].map((side) => ({ key: `${k}${side}`, type: 'lab', label: [`${LAB_NAMES[k][0]} ${side === 'Low' ? 'alt' : 'üst'} sınırı`, `${LAB_NAMES[k][1]} ${side === 'Low' ? 'lower' : 'upper'} limit`] })))
    : [f]));

// ---------------------------------------------------------------------------------------------
// File import: read on this device (CSV, JSON, TXT); nothing is stored or sent.
const IMPORT_ERRORS = {
  test: ['Test tanınmadı', 'Unknown test'], unit: ['Birim tanınmadı', 'Unknown unit'], value: ['Sayı değil', 'Not a number'],
  range: ['Kabul aralığı dışında', 'Outside the accepted range'], date: ['Tarih tanınmadı', 'Unknown date'], row: ['Satır okunamadı', 'Row not readable'],
  'unit-missing': ['Birim yok', 'No unit'], wide: ['Satırda başlıktan fazla sütun var', 'More cells than header columns'],
  grouping: ['Belirsiz sayı (binlik ayırıcı ya da üç ondalık): elle girin', 'Ambiguous number (thousands separator or three decimals): enter it by hand'],
  censored: ['Sınır değer (<, >): aktarılmaz', 'Censored value (<, >): not imported'],
  'no-value': ['Sonuç okunamadı (yalnız aralık, yorum ya da bölünmüş satır)', 'No result read (range only, a comment or a split line)'],
  specimen: ['İdrar ya da başka sıvı bölümünde: serum değeri değil', 'In a urine or other fluid section: not a serum value'],
  split: ['Ondalık virgül hücreyi bölmüş olabilir: değeri elle girin', 'A decimal comma may have split the cell: enter the value by hand'],
  dup: ['Aynı anlamda iki alan var', 'Two fields with the same meaning'],
};
const FILE_ERRORS = {
  quote: ['CSV tırnakları eşleşmiyor.', 'CSV quotes do not match.'],
  header: ['CSV başlığında en az "test" ve "value" (ya da "tetkik" ve "değer") sütunları olmalı.', 'The CSV header needs at least "test" and "value" columns.'],
  'header-dup': ['CSV başlığında aynı anlamda iki sütun var (örneğin iki değer sütunu): birini kaldırın.', 'The CSV header has two columns with the same meaning (for example two value columns): remove one.'],
  json: ['JSON dosyası bir satır listesi olmalı.', 'The JSON file must be a list of rows.'],
  size: ['En çok 300 satır aktarılabilir.', 'At most 300 rows can be imported.'],
  big: ['Dosya 10 MB sınırını aşıyor.', 'The file exceeds 10 MB.'],
  pages: ['Bu sürüm en çok 50 sayfalık PDF okur.', 'This version reads PDFs of at most 50 pages.'],
  'pdf-empty': ['PDF’te okunabilir metin yok (taranmış görüntü olabilir): değerleri elle girin.', 'The PDF has no readable text (it may be a scanned image): enter the values by hand.'],
  'pdf-error': ['PDF açılamadı.', 'The PDF could not be opened.'],
  read: ['Dosya okunamadı.', 'The file could not be read.'],
  'pdf-big': ['PDF çok büyük ya da karmaşık (en çok 400.000 karakter metin okunur): ilgili sayfaları ayrı bir PDF olarak deneyin ya da değerleri elle girin.', 'The PDF is too large or complex (at most 400,000 characters of text are read): try the relevant pages as a separate PDF or enter the values by hand.'],
  'pdf-time': ['PDF 60 saniyede okunamadı: ilgili sayfaları ayrı bir PDF olarak deneyin ya da değerleri elle girin.', 'The PDF could not be read within 60 seconds: try the relevant pages as a separate PDF or enter the values by hand.'],
  type: ['Desteklenen dosyalar: CSV, JSON, TXT, PDF.', 'Supported files: CSV, JSON, TXT, PDF.'],
};
// A text read only in part preselects nothing; the notice says why.
const truncatedText = (kind) => (kind === 'lines' ? L(['Metin 20.000 satırdan uzun: yalnız ilk 20.000 satır incelendi ve hiçbir sonuç önceden seçilmedi.', 'The text is longer than 20,000 lines: only the first 20,000 were examined and no result is preselected.'])
  : kind ? L(['Dosyada 300’den fazla sonuç var: ilk 300’ü gösteriliyor ve hiçbiri önceden seçilmedi; aktarmak istediklerinizi seçin.', 'The file has more than 300 results: the first 300 are shown and none is preselected; choose the ones to import.']) : '');
function importHtml(f) {
  const imp = state.import;
  let body = '';
  if (imp?.loading) body = `<p class="hint">${esc(L(['Dosya okunuyor…', 'Reading the file…']))}</p>`;
  else if (imp?.error) body = `<p class="field-error">${esc(L(FILE_ERRORS[imp.error] ?? FILE_ERRORS.type))}</p>`;
  else if (imp?.done !== undefined) body = `<p class="hint">${esc(L([`${imp.done} değer aktarıldı; kartlardaki alanlara yazıldı.`, `${imp.done} values imported into the fields.`]))}</p>`;
  else if (imp?.rows) {
    // Each PDF row shows its report line (and page) so the value can be checked where it was read.
    const source = (r) => (r.line ? `<br><span class="muted">${r.page ? `${esc(L(['s.', 'p.']))} ${r.page}: ` : ''}${esc(r.line)}</span>` : '');
    const status = (r) => (r.error ? `<span class="chip high">${esc(L(IMPORT_ERRORS[r.error] ?? IMPORT_ERRORS.row))}</span>`
      : r.choose ? `<span class="chip medium">${esc(L(['Birden çok sonuç: birini seçin', 'Several results: choose one']))}</span>` : '');
    const rows = imp.rows.map((r) => `<tr><td>${r.error ? '' : `<input type="checkbox" data-import-row="${r.i}" ${r.selected ? 'checked' : ''} aria-label="${esc(r.test)}">`}</td><td class="l">${esc(r.test)}${r.key ? ` → ${esc(L(LAB_NAMES[r.key]))}` : ''}${source(r)}</td><td class="l">${esc(r.value ?? r.rawValue)} ${esc(r.unit ?? r.rawUnit)}</td><td class="l">${esc(r.date ?? '')}</td><td class="l">${status(r)}</td></tr>`).join('');
    const n = imp.rows.filter((r) => r.selected && !r.error).length;
    const notes = [
      imp.pdf ? L(['PDF’ten tanınan satırlar: her değeri altındaki rapor satırıyla karşılaştırıp seçin. Bir test için yalnız bir değer seçilebilir. Tanınmayanlar için metin aşağıda.', 'Lines recognised in the PDF: compare each value with the report line under it before choosing it. Only one value can be chosen per test. The text is below for anything not recognised.']) : '',
      truncatedText(imp.truncated),
    ].filter(Boolean).map((x) => `<p class="hint">${esc(x)}</p>`).join('');
    body = notes + `<div class="table-wrap"><table><thead><tr><th></th><th class="l">Test</th><th class="l">${esc(L(['Değer', 'Value']))}</th><th class="l">${esc(L(['Tarih', 'Date']))}</th><th class="l"></th></tr></thead><tbody>${rows}</tbody></table></div>
      <div class="actions"><button type="button" class="btn" data-act="import-clear">${esc(L(['Vazgeç', 'Cancel']))}</button><button type="button" class="btn primary" data-act="import-apply" ${n ? '' : 'disabled'}>${esc(L([`Seçilenleri aktar (${n})`, `Import selected (${n})`]))}</button></div>`
      + (imp.pdf && imp.text ? `<details class="ev"><summary>${esc(L(['PDF metni', 'PDF text']))}</summary><pre class="import-text">${esc(imp.text)}</pre></details>` : '');
  } else if (imp?.text !== undefined) {
    const cut = !imp.pdf && imp.text.length > 100000;
    const hint = imp.pdf ? ['PDF’te tanınan laboratuvar satırı yok: değerleri metinden ilgili alanlara elle girin.', 'No laboratory line was recognised in the PDF: enter the values from the text into the fields by hand.']
      : ['Metindeki değerleri ilgili alanlara elle girin.', 'Enter the values from the text into the fields by hand.'];
    body = `<p class="hint">${esc(L(hint))}${cut ? esc(L([' Metnin ilk 100.000 karakteri gösteriliyor.', ' The first 100,000 characters of the text are shown.'])) : ''}</p>${imp.truncated ? `<p class="hint">${esc(truncatedText(imp.truncated))}</p>` : ''}<pre class="import-text">${esc(cut ? imp.text.slice(0, 100000) : imp.text)}</pre>`;
  }
  return `<div class="field wide"><label for="f-import">${esc(L(f.label))}</label><input type="file" id="f-import" data-import="1" accept=".csv,.json,.txt,.pdf,text/csv,application/json,text/plain"><p class="hint">${esc(L(f.hint))}</p>${body}</div>`;
}
// Each import gets a number; a result that arrives after another import started, or after the case changed, is
// dropped (a slow PDF never fills a newer case or replaces a newer file).
let importSeq = 0;
// The same for opening a case file: a file still being read when another case is started or opened is dropped.
let caseSeq = 0;
// Starts a new, empty case with the given values (new case, example, opened case file).
function resetCase(values) {
  caseSeq += 1;
  state.caseId = null;
  state.caseLabel = '';
  state.example = false;
  state.reopened = null;
  lastSaved = '';
  if (deviceOn()) { try { setCurrentCaseId(deviceStore, null); } catch { /* storage unavailable */ } }
  state.values = values;
  state.product = {};
  state.followup = [];
  state.decisions = {};
  state.import = null;
  importSeq += 1;
  state.openDetails.clear();
}
async function readImport(file, seq) {
  const ext = file.name.toLowerCase().split('.').pop();
  if (file.size > 10 * 1024 * 1024) return { error: 'big' };
  if (ext === 'pdf') return readPdf(file, seq);
  if (!['csv', 'json', 'txt'].includes(ext)) return { error: 'type' };
  const text = await file.text();
  if (ext === 'txt') return { text };
  try { return { rows: importText(file.name, text) }; } catch (err) { return { error: FILE_ERRORS[err.message] ? err.message : ext === 'json' ? 'json' : 'header' }; }
}
// When the laboratory's limits are already entered for a test, the imported value is converted into the unit of
// those limits (so they keep their meaning); otherwise the value keeps its own unit.
const decimal = (x) => {
  let s = String(Number(x.toPrecision(4)));
  if (/^\d{1,3}\.\d{3}$/.test(s)) s = String(Number(x.toFixed(2))); // "6.006" would be refused as a thousands separator
  return s.replace('.', lang === 'tr' ? ',' : '.');
};
// PDF text with the reviewed PDF.js copy (6.2.108, vendor/dependencies.json): the file is read on this device, no
// scripting, no network. At most 50 pages, 400 000 characters, 200 000 text pieces and 60 seconds; the text is read in
// chunks and reading stops (the worker is closed) at a limit or when another file or case is opened.
const PDF_LIMITS = { pages: 50, chars: 400000, items: 200000, ms: 60000 };
async function readPdf(file, seq) {
  let task = null;
  let timer = null;
  const expired = new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('pdf-time')), PDF_LIMITS.ms); });
  expired.catch(() => {});
  const timed = (promise) => Promise.race([promise, expired]);
  const current = () => { if (seq !== importSeq) throw new Error('stale'); };
  try {
    const pdfjs = await import('./vendor/pdf.mjs');
    pdfjs.GlobalWorkerOptions.workerSrc = new URL('./vendor/pdf.worker.mjs', import.meta.url).href;
    task = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()), useWorkerFetch: false, disableAutoFetch: true, disableStream: true, isEvalSupported: false, enableXfa: false });
    const pdf = await timed(task.promise);
    if (pdf.numPages > PDF_LIMITS.pages) return { error: 'pages' };
    const pages = [];
    let chars = 0;
    let items = 0;
    for (let n = 1; n <= pdf.numPages; n += 1) {
      current();
      const page = await timed(pdf.getPage(n));
      const reader = page.streamTextContent().getReader();
      const parts = [];
      try {
        for (;;) {
          current();
          const { value, done } = await timed(reader.read());
          if (done) break;
          for (const it of value?.items ?? []) {
            const str = typeof it.str === 'string' ? it.str : '';
            parts.push(str, it.hasEOL ? '\n' : ' ');
            chars += str.length + 1;
          }
          items += value?.items?.length ?? 0;
          if (chars > PDF_LIMITS.chars || items > PDF_LIMITS.items) throw new Error('pdf-big');
        }
      } finally {
        reader.cancel().catch(() => {});
      }
      pages.push(parts.join(''));
    }
    const text = pages.join('\n');
    if (!text.trim()) return { error: 'pdf-empty' };
    const { rows, truncated } = rowsFromText(pages);
    return rows.length ? { rows, truncated, text, pdf: true } : { text, truncated, pdf: true };
  } catch (err) {
    if (err?.message === 'stale') return { stale: true };
    return { error: ['pdf-big', 'pdf-time'].includes(err?.message) ? err.message : 'pdf-error' };
  } finally {
    clearTimeout(timer);
    try { await task?.destroy(); } catch { /* already closed */ }
  }
}
function applyImport() {
  const chosen = (state.import?.rows ?? []).filter((r) => r.selected && !r.error).sort((x, y) => (x.date || '').localeCompare(y.date || ''));
  for (const r of chosen) {
    const current = state.values[unitKey(r.key)] ?? defaultUnit(r.key);
    const hasLimits = ['Low', 'High'].some((side) => String(state.values[`${r.key}${side}`] ?? '').trim() !== '');
    const from = LABS[r.key].units.find(([u]) => u === r.unit);
    const to = LABS[r.key].units.find(([u]) => u === current);
    if (hasLimits && current !== r.unit && from && to) {
      state.values[r.key] = decimal((Number(String(r.value).replace(',', '.')) * from[1]) / to[1]);
    } else {
      state.values[r.key] = r.value;
      state.values[unitKey(r.key)] = r.unit;
    }
  }
  state.import = { done: chosen.length };
}
function redrawCards() {
  const scroll = window.scrollY;
  renderCards();
  window.scrollTo({ top: scroll });
}

// ---------------------------------------------------------------------------------------------
// Field errors: shown under the field itself, saying what is wrong and what is accepted.
const nfa = (x) => Number(x).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-GB', { maximumFractionDigits: 2, useGrouping: false });
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
  if (err.code === 'unit') return L(['Bu birim tanınmıyor: listeden birim seçin.', 'Unknown unit: choose a unit from the list.']);
  if (err.code === 'nan') return L(['Sayı girin (örnek: 72,5).', 'Enter a number (for example 72.5).']);
  if (err.code === 'grouping') return err.perUl ? L(['µL başına sayı ayırıcısız tam sayı olarak yazılır (örnek: 250000).', 'Counts per µL are written as whole numbers without separators (for example 250000).'])
    : L(['Belirsiz yazım: binlik ayırıcı okunmaz. Bin ve üzerini ayırıcısız (örnek: 1800), ondalığı daha az basamakla (örnek: 12,5) yazın.', 'Ambiguous: thousands separators are not read. Write 1000 or more without a separator (for example 1800) and decimals with fewer digits (for example 12.5).']);
  if (err.code === 'integer') return L([`Tam sayı girin (${nfa(err.min)}–${nfa(err.max)}).`, `Enter a whole number (${nfa(err.min)}–${nfa(err.max)}).`]);
  const u = unit && !/^\d+–\d+$/.test(unit) ? ` ${unit}` : '';
  if (err.exclusiveMin) return L([`0’dan büyük, en çok ${nfa(err.max)}${u} olmalı; girilen ${shown}.`, `Must be above 0 and at most ${nfa(err.max)}${u}; entered ${shown}.`]);
  return L([`${rangeText(err.min, err.max, unit)} arasında olmalı; girilen ${shown}.`, `Must be ${rangeText(err.min, err.max, unit)}; entered ${shown}.`]);
}
function fieldError(f, value) {
  if (f?.type === 'lab') {
    const unit = state.values[unitKey(f.key)] ?? defaultUnit(f.key);
    const err = checkLab(f.key, value, unit);
    if (err) return errorText(err, unit, value);
    // An upper limit below the lower limit (same unit) is an input error.
    if (f.key.endsWith('High')) {
      const lowKey = f.key.replace(/High$/, 'Low');
      const lo = Number(String(state.values[lowKey] ?? '').trim().replace(',', '.'));
      const hi = Number(String(value ?? '').trim().replace(',', '.'));
      if (String(value ?? '').trim() && String(state.values[lowKey] ?? '').trim() && Number.isFinite(lo) && Number.isFinite(hi) && lo > hi) return L(['Üst sınır alt sınırdan küçük olamaz.', 'The upper limit cannot be below the lower limit.']);
    }
    return null;
  }
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

// ---------------------------------------------------------------------------------------------
// Laboratory values and derived indices (context only).
const LAB_NAMES = {
  potassium: ['Potasyum', 'Potassium'], phosphate: ['Fosfor', 'Phosphate'], phosphateBefore: ['Beslenme öncesi fosfor', 'Phosphate before feeding'],
  magnesium: ['Magnezyum', 'Magnesium'], creatinine: ['Kreatinin', 'Creatinine'], urea: ['Üre', 'Urea'], albumin: ['Albümin', 'Albumin'],
  crp: ['CRP', 'CRP'], neutrophils: ['Nötrofil', 'Neutrophils'], lymphocytes: ['Lenfosit', 'Lymphocytes'], lactate: ['Laktat', 'Lactate'], vitD: ['25(OH)D', '25(OH)D'],
  bilirubin: ['Bilirubin', 'Bilirubin'], platelets: ['Trombosit', 'Platelets'],
};
function labsHtml(r) {
  const l = r.labs;
  if (!l) return '';
  const entered = LAB_KEYS.filter((k) => !LABS[k].unitOf && l.values[k] !== null);
  if (!entered.length) return '';
  const FLAG = { low: ['↓ düşük', '↓ low'], high: ['↑ yüksek', '↑ high'], normal: ['aralıkta', 'within range'] };
  const digits = (x) => (Math.abs(x) >= 100 ? 0 : Math.abs(x) >= 10 ? 1 : 2);
  const rows = entered.map((k) => {
    const unit = state.values[unitKey(k)] ?? defaultUnit(k);
    const canonical = LABS[k].canonical;
    const shown = `${esc(String(state.values[k]).trim())} ${esc(unit)}`;
    const conv = unit !== canonical && LABS[k].units.find(([u]) => u === unit)?.[1] !== 1 ? ` = ${nf(l.values[k], digits(l.values[k]))} ${esc(canonical === '10^9/L' ? '10⁹/L' : canonical)}` : '';
    const lo = String(state.values[`${k}Low`] ?? '').trim();
    const hi = String(state.values[`${k}High`] ?? '').trim();
    const ref = lo && hi ? `${lo}–${hi}` : lo ? `≥${lo}` : hi ? `≤${hi}` : '';
    const limits = LIMIT_KEYS.includes(k) && ref ? ` <span class="muted">(ref. ${esc(ref)})</span>` : '';
    const flag = l.flags?.[k] && FLAG[l.flags[k]] ? ` <span class="chip ${l.flags[k] === 'normal' ? 'ok' : 'high'}">${esc(L(FLAG[l.flags[k]]))}</span>` : '';
    return `<tr><td class="l">${esc(L(LAB_NAMES[k]))}</td><td class="l">${shown}${conv}${limits}${flag}</td></tr>`;
  }).join('');
  const ix = l.indices;
  const items = [];
  if (ix.nlr !== undefined) items.push(scaleRow('NLR', 'info', [L([`Nötrofil/lenfosit oranı ${nf(ix.nlr, 1)}. Sistemik inflamasyon ve stres göstergesidir; tek başına karar vermez.`, `Neutrophil-to-lymphocyte ratio ${nf(ix.nlr, 1)}. A marker of systemic inflammation and stress; it decides nothing on its own.`])], ['nlr-2001']));
  if (ix.pni !== undefined) items.push(scaleRow('PNI', 'info', [L([`PNI ${nf(ix.pni, 1)} (Onodera). Özgün cerrahi çalışmada >45 güvenli, 40–45 riskli, <40 sakıncalı. Albümin inflamasyonda düşer; malnütrisyon ölçütü değildir.`, `PNI ${nf(ix.pni, 1)} (Onodera). In the original surgical study >45 was safe, 40–45 risky and <40 possibly contraindicated. Albumin falls with inflammation; it is not a malnutrition criterion.`])], ['pni-1984']));
  if (ix.crpRatio !== undefined) items.push(scaleRow(L(['CRP / üst sınır', 'CRP / upper limit']), 'info', [L([`${nf(ix.crpRatio, 1)} kat. İnflamasyon bağlamıdır; tek başına karar vermez.`, `${nf(ix.crpRatio, 1)} times. Inflammatory context; it decides nothing on its own.`])], []));
  if (ix.ucrMass !== undefined) items.push(scaleRow(L(['Üre/kreatinin oranı', 'Urea/creatinine ratio']), 'info', [
    L([`${nf(ix.ucrMass, 0)} (mg/dL:mg/dL) · ${nf(ix.ucrMolar, 0)} (mmol/L:mmol/L). Katabolizma için araştırma belirtecidir; doz değiştirmez. Bir çalışmada yüksek grup ≥75 (mg/dL:mg/dL) idi.`, `${nf(ix.ucrMass, 0)} (mg/dL:mg/dL) · ${nf(ix.ucrMolar, 0)} (mmol/L:mmol/L). A research marker of catabolism; it does not change the dose. One study’s high group was ≥75 (mg/dL:mg/dL).`]),
    r.input.kidney === 'crrt' ? L(['Sürekli böbrek replasman tedavisi oranı düşürür: yorumlamayın.', 'Continuous kidney replacement therapy lowers the ratio: do not interpret it.']) : r.input.kidney === 'aki' || r.input.kidney === 'ihd' ? L(['Böbrek yetmezliğinde üre ve kreatinin birikir: oran dikkatle yorumlanır.', 'Urea and creatinine accumulate in kidney failure: interpret the ratio with care.']) : null,
  ], ['ucr-trauma-2019', 'ucr-crrt-2025']));
  const FINDING = {
    hypoPhosphate: ['Fosfordan refeeding hipofosfatemisi belirlendi: enerji 48 saat kısıtlanır.', 'Refeeding hypophosphataemia found from phosphate: energy is restricted for 48 h.'],
    lowBeforeFeeding: ['Beslenme öncesi elektrolit düşük: refeeding riski yüksek sayıldı.', 'Low pre-feeding electrolyte: refeeding risk taken as high.'],
    lowDuringFeeding: ['Beslenme sırasında potasyum ya da magnezyum alt sınırın altında: yerine koyun.', 'Potassium or magnesium below the lower limit during feeding: replace it.'],
    normalBeforeFeeding: ['K, P ve Mg alt sınırın üstünde: beslenme öncesi düşüklük yok.', 'K, P and Mg above the lower limits: no low pre-feeding level.'],
  };
  const findings = l.findings.map((f) => L(FINDING[f]));
  const open = state.openDetails.has('labs') ? ' open' : '';
  return `<section class="card"><details data-details="labs"${open}><summary>${esc(L(['Laboratuvar', 'Laboratory']))}</summary>
    ${findings.length ? `<ul class="lines">${findings.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
    <div class="table-wrap"><table><tbody>${rows}</tbody></table></div>${items.join('')}</details></section>`;
}

// ---------------------------------------------------------------------------------------------
// Printable report: a print-only header and a summary of every entered value.
function printHeaderHtml() {
  const now = new Date().toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-GB', { dateStyle: 'long', timeStyle: 'short' });
  return `<section class="card print-only"><h2>NutriClinic · ${esc(L(['Beslenme önerisi', 'Nutrition recommendation']))}</h2><p>${esc(now)} · NutriClinic ${esc(ENGINE_VERSION)} · ${esc(L(['Kurallar', 'Rules']))} ${esc(RULES_DATE)}</p><p><strong>${esc(t('intended'))}</strong></p></section>`;
}
function shownValue(f) {
  const v = state.values;
  if (f.type === 'num') return `${String(v[f.key]).trim()} ${L(f.unit)}`.trim();
  if (f.type === 'lab') return `${String(v[f.key]).trim()} ${v[unitKey(f.key)] ?? defaultUnit(f.key)}`;
  if (f.type === 'seg') { const o = f.options.find((x) => x.value === String(v[f.key])); return o ? L(o.label) : String(v[f.key]); }
  return '';
}
function inputsHtml() {
  const rows = [];
  // The case code of this case's anonymised copy on the site (the site has no label, only this code).
  const siteCode = site && state.caseId && deviceStore ? getCase(deviceStore, state.caseId)?.siteCode : null;
  if (siteCode) rows.push(`<tr><th colspan="2" class="l">${esc(L(['Sitedeki anonim kopya', 'Anonymised copy on the site']))}</th></tr><tr><td class="l">${esc(L(['Site kodu', 'Site code']))}</td><td class="l">${esc(siteCode)}</td></tr>`);
  STEPS.forEach((s, i) => {
    const items = [];
    for (const f of flatFields(s.fields(state.values))) {
      if (f.type === 'checks') { f.items.filter((x) => state.values[x.key] === true).forEach((x) => items.push([L(['İşaretli', 'Ticked']), L(x.label)])); continue; }
      if (!['num', 'lab', 'seg'].includes(f.type)) continue;
      const x = state.values[f.key];
      if (x === undefined || x === null || String(x).trim() === '' || x === 'unknown') continue;
      items.push([L(f.label), shownValue(f)]);
    }
    if (items.length) rows.push(`<tr><th colspan="2" class="l">${i + 1}. ${esc(L(s.title))}</th></tr>` + items.map(([k, val]) => `<tr><td class="l">${esc(k)}</td><td class="l">${esc(val)}</td></tr>`).join(''));
  });
  const LABEL_NAMES = {
    'en.kcalPerMl': ['Mama enerjisi', 'Formula energy', 'kcal/mL'], 'en.proteinPer100': ['Mama proteini', 'Formula protein', 'g/100 mL'], 'en.waterPer100': ['Serbest su', 'Free water', 'mL/100 mL'],
    'ons.serving': ['ONS servis miktarı', 'ONS serving', ''], 'ons.kcal': ['ONS enerjisi / servis', 'ONS energy / serving', 'kcal'], 'ons.protein': ['ONS proteini / servis', 'ONS protein / serving', 'g'],
    'module.proteinPer100g': ['Protein modülü', 'Protein module', 'g/100 g'], 'powder.kcalPer100g': ['Toz enerji', 'Powder energy', 'kcal/100 g'],
    'powder.proteinPer100g': ['Toz protein', 'Powder protein', 'g/100 g'], 'powder.kcalPerMl': ['Sulandırılmış mama', 'Prepared feed', 'kcal/mL'],
  };
  const label = Object.entries(LABEL_NAMES).filter(([path]) => { const [g, k] = path.split('.'); return String(state.product[g]?.[k] ?? '').trim() !== ''; })
    .map(([path, [tr, en, unit]]) => { const [g, k] = path.split('.'); return [L([tr, en]), `${String(state.product[g][k]).trim()} ${g === 'ons' && k === 'serving' ? state.product.ons?.unit ?? '' : unit}`.trim()]; });
  if (state.product.form === 'powder') label.unshift([L(['Ürün formu', 'Product form']), t('powder')]);
  const decided = Object.entries(state.decisions);
  if (decided.length) {
    if (!evidenceModule) loadEvidence().then(() => { if (state.view === 'result') renderResult(); });
    rows.push(`<tr><th colspan="2" class="l">${esc(L(['Karar konuları: hekim seçimi', 'Decision topics: physician choice']))}</th></tr>` + decided.map(([id, ch]) => {
      const [k, val] = DECISION_WORD(id, ch);
      const note = evidenceModule && decisionStatus(id, ch) === 'setting' ? L([' (bu bakım ortamında sunulmuyor: karar konusunda yeniden seçin)', ' (not offered for this care setting: choose again in the decision topic)']) : '';
      return `<tr><td class="l">${esc(k)}</td><td class="l">${esc(val + note)}</td></tr>`;
    }).join(''));
  }
  if (label.length) rows.push(`<tr><th colspan="2" class="l">${esc(L(['Ürün etiketi', 'Product label']))}</th></tr>` + label.map(([k, val]) => `<tr><td class="l">${esc(k)}</td><td class="l">${esc(val)}</td></tr>`).join(''));
  if (!rows.length) return '';
  const open = state.openDetails.has('inputs') ? ' open' : '';
  return `<section class="card"><details data-details="inputs"${open}><summary>${esc(t('inputs'))}</summary><div class="table-wrap"><table><tbody>${rows.join('')}</tbody></table></div></details></section>`;
}
// While printing every section is open; afterwards the previous state returns.
let closedForPrint = null;
window.addEventListener('beforeprint', () => {
  if (closedForPrint) return; // a print cycle is already active
  closedForPrint = [...document.querySelectorAll('#result details:not([open])')];
  closedForPrint.forEach((d) => { d.open = true; });
});
window.addEventListener('afterprint', () => { (closedForPrint ?? []).forEach((d) => { d.open = false; }); closedForPrint = null; });

// ---------------------------------------------------------------------------------------------
// Case file (JSON) and table (CSV): created on this device; nothing is sent.
const CASE_FORMAT = 'nutriclinic-case';
function download(name, text, type) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const link = document.createElement('a');
  link.href = url; link.download = name;
  document.body.append(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
const stamp = () => new Date().toISOString().slice(0, 16).replace(/[-:]/g, '').replace('T', '-');
// Only choices offered for the current care setting are saved; others stay in the report, marked for reassessment.
const savedDecisions = () => Object.fromEntries(Object.entries(state.decisions).filter(([id, ch]) => !evidenceModule || decisionStatus(id, ch) === 'ok'));
function saveCase(r) {
  const summary = r && !r.blocked ? { route: r.route?.kind ?? null, productClass: r.product?.cls ?? null, todayKcal: (() => { const k = r.plan?.today?.kcalTarget ?? r.plan?.oral?.kcalTarget; return Number.isFinite(k) ? Math.round(k) : null; })(), supplements: (r.supplements ?? []).map((s) => s.id) } : null;
  const data = { format: CASE_FORMAT, formatVersion: 1, app: ENGINE_VERSION, rulesDate: RULES_DATE, savedAt: new Date().toISOString(), label: state.caseLabel, values: state.values, product: state.product, followup: state.followup, decisions: savedDecisions(), summary };
  download(`nutriclinic-vaka-${stamp()}.json`, `${JSON.stringify(data, null, 2)}\n`, 'application/json');
}
function saveTableCsv(r) {
  const rows = r.plan?.rows ?? [];
  const sep = lang === 'tr' ? ';' : ',';
  const num = (x, d = 0) => (x === null || x === undefined || !Number.isFinite(x) ? '' : (Math.round(x * 10 ** d) / 10 ** d).toString().replace('.', lang === 'tr' ? ',' : '.'));
  const icu = r.input.setting === 'icu';
  const head = [icu ? t('icuDayCol') : t('feedDayCol'), t('energyCol'), t('proteinCol'), t('formulaCol'), t('rateCol'), t('feedsCol'), t('moduleCol'), t('aaCol')];
  const body = rows.map((x) => [icu ? x.icuDay : x.feedDay, num(x.kcalTarget ?? x.pnKcal ?? x.kcal), num(x.proteinTarget ?? x.aminoAcids ?? x.protein, 1), x.cls ? L(CLASS_SHORT[x.cls] ?? ['', '']) : '', num(x.rate), x.feeds ? `${x.feeds.n} x ${num(x.feeds.ml)}` : '', num(x.moduleProtein, 1), num(x.aminoAcids, 1)]);
  const csv = [head, ...body].map((line) => line.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(sep)).join('\r\n');
  download(`nutriclinic-tablo-${stamp()}.csv`, `\uFEFF${csv}\r\n`, 'text/csv');
}
// Only plain values with simple keys are taken from a case file.
const cleanObject = (o) => (o && typeof o === 'object' && !Array.isArray(o) ? Object.fromEntries(Object.entries(o).filter(([k, x]) => /^[A-Za-z][A-Za-z0-9]{0,40}$/.test(k) && ['string', 'number', 'boolean'].includes(typeof x)).map(([k, x]) => [k, typeof x === 'string' ? x.slice(0, 200) : x])) : {});
// Reads a case (from a file or from this device) into the page: plain values only, decisions this version knows.
// Returns the number of decisions left out, or null when another case was started or opened meanwhile.
async function applyCaseData(data, seq) {
  const values = cleanObject(data.values);
  const product = Object.fromEntries(['en', 'ons', 'module', 'powder'].filter((g) => data.product?.[g]).map((g) => [g, cleanObject(data.product[g])]));
  if (data.product?.form === 'powder') product.form = 'powder';
  // Decisions keep the topic and choice ids of evidence-data.mjs; pairs this version does not know are not taken.
  const raw = data.decisions && typeof data.decisions === 'object' && !Array.isArray(data.decisions) ? Object.entries(data.decisions) : [];
  let decisions = {};
  let dropped = 0;
  if (raw.length) {
    try { await loadEvidence(); } catch { /* library unavailable: the choices cannot be checked and are not taken */ }
    decisions = Object.fromEntries(raw.filter(([id, ch]) => typeof ch === 'string' && evidenceModule && decisionStatus(id, ch) !== 'unknown'));
    dropped = raw.length - Object.keys(decisions).length;
  }
  if (seq !== caseSeq) return null; // another case was started or opened meanwhile
  resetCase({ ...values, setting: values.setting === 'ward' ? 'ward' : 'icu' });
  state.product = product;
  state.followup = (Array.isArray(data.followup) ? data.followup.slice(0, MAX_FOLLOWUP_ROWS) : []).map((row) => { const c = cleanObject(row); return { day: String(c.day ?? ''), kcal: String(c.kcal ?? ''), protein: String(c.protein ?? '') }; });
  state.decisions = decisions;
  return dropped;
}
async function openCase(file) {
  const seq = ++caseSeq;
  let dropped = 0;
  try {
    if (file.size > 1024 * 1024) throw new Error('size');
    const data = JSON.parse(await file.text());
    if (data?.format !== CASE_FORMAT || data.formatVersion !== 1 || !data.values || typeof data.values !== 'object' || Array.isArray(data.values)) throw new Error('format');
    if (seq !== caseSeq) return;
    dropped = await applyCaseData(data, seq);
    if (dropped === null) return;
    state.caseLabel = cleanCaseLabel(data.label);
    saveToDevice(); // an opened file becomes a case on this device (when device storage is on)
    go('result');
  } catch {
    if (seq === caseSeq) window.alert(t('caseError'));
    return;
  }
  if (dropped) window.alert(t('decisionsDropped'));
}

// ---------------------------------------------------------------------------------------------
// Cases on this device (cases.mjs). The open case is saved as it changes, unless device storage is off or the case
// is the example. Nothing is sent anywhere; the browser keeps the cases until they are deleted here.
let deviceStore = null;
try { deviceStore = window.localStorage; } catch { deviceStore = null; }
const deviceOn = () => Boolean(deviceStore) && deviceStorageOn(deviceStore);
let lastSaved = '';
let deviceError = null;
let saveTimer = null;
const DEVICE_ERRORS = {
  full: [`Bu cihazda en çok ${MAX_CASES} vaka saklanır: bu vaka kaydedilmedi. Vakalarım’dan eski vakaları silin.`, `At most ${MAX_CASES} cases are kept on this device: this case was not saved. Delete old cases under My cases.`],
  size: ['Vaka çok büyük olduğu için bu cihaza kaydedilmedi.', 'The case is too large and was not saved on this device.'],
  storage: ['Tarayıcı vakayı kaydetmedi (depolama dolu ya da engelli). Vakayı dosyaya kaydedin.', 'The browser did not save the case (storage full or blocked). Save the case to a file.'],
};
const caseIsEmpty = () => Object.keys(state.values).every((k) => k === 'setting') && !Object.keys(state.product).length && !state.followup.length && !Object.keys(state.decisions).length;
const caseData = () => ({ values: state.values, product: state.product, followup: state.followup, decisions: savedDecisions() });
function saveToDevice() {
  clearTimeout(saveTimer);
  if (!deviceOn() || state.example || caseIsEmpty()) return;
  const data = caseData();
  const text = JSON.stringify([state.caseLabel, data]);
  if (text === lastSaved) return;
  if (!state.caseId) state.caseId = newCaseId();
  const res = putCase(deviceStore, { id: state.caseId, label: state.caseLabel, data, view: state.view === 'result' ? 'result' : 'cards', step: state.step });
  const before = deviceError;
  deviceError = res.ok ? null : res.error;
  if (res.ok) {
    lastSaved = text;
    try { setCurrentCaseId(deviceStore, state.caseId); } catch { /* storage unavailable */ }
    schedulePush();
  }
  renderCasesButton();
  if (before !== deviceError) renderDeviceNote();
}
const scheduleSave = () => { clearTimeout(saveTimer); saveTimer = setTimeout(saveToDevice, 300); };
async function openDeviceCase(c, { reopened = false, keepView = false } = {}) {
  const seq = ++caseSeq;
  const dropped = await applyCaseData(c.data, seq);
  if (dropped === null) return;
  state.caseId = c.id;
  state.caseLabel = c.label;
  lastSaved = JSON.stringify([state.caseLabel, caseData()]);
  try { setCurrentCaseId(deviceStore, c.id); } catch { /* storage unavailable */ }
  state.reopened = reopened ? c.updatedAt : null;
  if (keepView) render(); // a newer version from the site: the clinician stays where they are
  else if (c.view === 'result') go('result'); else go(c.step);
  if (dropped) window.alert(t('decisionsDropped'));
}
function renderCasesButton() {
  const b = document.getElementById('my-cases');
  if (!b) return;
  const n = deviceOn() ? listCases(deviceStore).length : 0;
  b.textContent = `${t('myCases')}${n ? ` (${n})` : ''}`;
}
const when = (iso) => new Date(iso).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-GB', { dateStyle: 'short', timeStyle: 'short' });
// A notice under the header: a case reopened by itself after a reload, or a case that could not be saved.
function renderDeviceNote() {
  const box = document.getElementById('device-note');
  if (!box) return;
  const parts = [];
  if (state.reopened) {
    parts.push(`<p>${esc(L([`Bu cihazdaki son vaka açıldı (son değişiklik ${when(state.reopened)}).`, `The last case on this device was opened (last change ${when(state.reopened)}).`]))}${state.caseLabel ? ` <strong>${esc(state.caseLabel)}</strong>` : ''}</p>
      <div class="actions"><button type="button" class="btn" data-act="reopened-new">${esc(L(['Yeni vaka başlat', 'Start a new case']))}</button><button type="button" class="btn" data-act="reopened-close">${esc(L(['Tamam', 'OK']))}</button></div>`);
  }
  if (deviceError) parts.push(`<p class="field-error">${esc(L(DEVICE_ERRORS[deviceError]))}</p>`);
  box.innerHTML = parts.join('');
  box.hidden = !parts.length;
}
function caseSummary(d) {
  const v = d?.values ?? {};
  return [v.setting === 'ward' ? L(['Servis', 'Ward']) : L(['Yoğun bakım', 'ICU']), v.age !== undefined && v.age !== '' ? `${v.age} ${L(['yaş', 'y'])}` : '',
    v.weightKg !== undefined && v.weightKg !== '' ? `${v.weightKg} kg` : '', v.setting !== 'ward' && v.icuDay !== undefined && v.icuDay !== '' ? `${L(['YB günü', 'ICU day'])} ${v.icuDay}` : ''].filter(Boolean).join(' · ');
}
function renderCases() {
  const box = $('#cases');
  const on = deviceOn();
  const list = on ? listCases(deviceStore) : [];
  const rows = list.map((c) => `<tr${c.id === state.caseId ? ' class="current"' : ''}><td class="l"><input data-case-label="${esc(c.id)}" value="${esc(c.label)}" maxlength="40" autocomplete="off" placeholder="${esc(L(['Vaka kodu (ad yazmayın)', 'Case code (no names)']))}" aria-label="${esc(L(['Vaka kodu', 'Case code']))}"></td><td class="l">${esc(caseSummary(c.data))}${c.id === state.caseId ? ` <span class="chip ok">${esc(L(['açık', 'open']))}</span>` : ''}</td>${site ? `<td class="l"><code>${esc(c.siteCode ?? '…')}</code></td>` : ''}<td class="l">${esc(when(c.updatedAt))}</td><td class="l"><button type="button" class="btn" data-act="case-open" data-id="${esc(c.id)}">${esc(L(['Aç', 'Open']))}</button> <button type="button" class="btn" data-act="case-delete" data-id="${esc(c.id)}">${esc(L(['Sil', 'Delete']))}</button></td></tr>`).join('');
  box.innerHTML = `<section class="card"><h2>${esc(L(['Bu cihazdaki vakalar', 'Cases on this device']))}</h2>
      <p class="lead">${esc(L(['Vakalar yalnız bu tarayıcıda saklanır, hiçbir yere gönderilmez. Bu tarayıcıyı kullanan herkes görebilir: ortak bilgisayarda işiniz bitince vakayı silin ya da saklamayı kapatın. Hasta adı ya da kimlik numarası yazmayın; vaka kodu kullanın. Son vaka, son değişikliğinden sonraki 12 saat içinde sayfa yeniden açılırsa kendiliğinden gelir.', 'Cases are kept only in this browser and sent nowhere. Anyone using this browser can see them: on a shared computer delete the case when you finish, or turn storage off. Do not write patient names or ID numbers; use a case code. The last case reopens by itself when the page is opened again within 12 hours of its last change.']))}</p>
      <label class="check"><input type="checkbox" data-device="toggle"${on ? ' checked' : ''}${deviceStore ? '' : ' disabled'}><span>${esc(L(['Vakaları bu cihazda sakla', 'Keep cases on this device']))}</span></label>
      ${deviceStore ? '' : `<p class="field-error">${esc(L(['Bu tarayıcı yerel saklamaya izin vermiyor (gizli pencere ya da engellenmiş site verisi): vakayı dosyaya kaydedin.', 'This browser does not allow local storage (private window or blocked site data): save the case to a file.']))}</p>`}
      ${deviceError ? `<p class="field-error">${esc(L(DEVICE_ERRORS[deviceError]))}</p>` : ''}
      ${on ? (list.length ? `<div class="table-wrap"><table><thead><tr><th class="l">${esc(L(['Vaka kodu', 'Case code']))}</th><th class="l">${esc(L(['Özet', 'Summary']))}</th>${site ? `<th class="l">${esc(L(['Site kodu', 'Site code']))}</th>` : ''}<th class="l">${esc(L(['Son değişiklik', 'Last change']))}</th><th></th></tr></thead><tbody>${rows}</tbody></table></div><p class="muted">${list.length}/${MAX_CASES}</p>` : `<p class="muted">${esc(L(['Bu cihazda saklanan vaka yok.', 'No case is kept on this device.']))}</p>`) : ''}
      <div class="actions"><button type="button" class="btn" data-act="cases-back">${esc(t('back'))}</button><button type="button" class="btn" data-act="case-new">${esc(L(['Yeni vaka', 'New case']))}</button>${on && list.length ? `<button type="button" class="btn" data-act="cases-clear">${esc(L(['Hepsini bu cihazdan sil', 'Delete all from this device']))}</button>` : ''}</div></section>${siteHtml()}`;
}

// ---------------------------------------------------------------------------------------------
// Follow-up: delivered energy and protein against the day's target (context only; nothing is stored).
// The target of a past ICU day is recalculated with the current inputs, feeding taken as running.
function followupTargets(r) {
  const cache = new Map();
  const pick = (row) => (row ? { kcal: row.kcalTarget ?? row.kcal, protein: row.proteinTarget ?? row.protein } : null);
  const icu = r.input.setting === 'icu';
  return (day) => {
    if (cache.has(day)) return cache.get(day);
    let target = null;
    if (icu) {
      const q = recommend({ ...engineInput(), icuDay: String(day), feeding: 'ongoing' });
      target = q.blocked || !q.plan ? null : pick(q.plan.today) ?? (q.plan.oral ? { kcal: q.plan.oral.kcalTarget, protein: q.plan.oral.proteinTarget } : null);
    } else {
      const rows = r.plan?.rows ?? [];
      target = pick(rows[rows.length - 1]);
    }
    cache.set(day, target);
    return target;
  };
}
function followupHtml(r) {
  if (!r.plan) return '';
  const icu = r.input.setting === 'icu';
  const sum = followupSummary(state.followup, followupTargets(r), { icu });
  const cell = (i, field, unit) => {
    const val = state.followup[i]?.[field] ?? '';
    const err = checkFollowupValue(field, val);
    const id = `fu-${i}-${field}`;
    const name = L({ day: icu ? ['YB günü', 'ICU day'] : ['Beslenme günü', 'Feeding day'], kcal: ['Verilen enerji', 'Delivered energy'], protein: ['Verilen protein', 'Delivered protein'] }[field]);
    return `<td><div class="input-wrap${err ? ' invalid' : ''}"><input id="${id}" data-fu="${i}:${field}" inputmode="decimal" autocomplete="off" value="${esc(val)}" aria-label="${esc(name)} (${esc(unit)})"${err ? ' aria-invalid="true"' : ''}></div>${err ? `<p class="field-error">${esc(errorText(err, unit, val))}</p>` : ''}</td>`;
  };
  const rows = sum.rows.map((x, i) => `<tr>${cell(i, 'day', icu ? L(['gün', 'day']) : L(['gün', 'day']))}${cell(i, 'kcal', 'kcal')}${cell(i, 'protein', 'g')}
    <td>${x.target ? `${nf(r10(x.target.kcal))} kcal · ${nf(Math.round(x.target.protein))} g` : '–'}</td>
    <td>${x.pctKcal !== undefined ? `${nf(Math.round(x.pctKcal))}% · ${nf(Math.round(x.pctProtein))}%${x.over ? ' <span class="chip high">↑</span>' : ''}` : '–'}</td>
    <td><button type="button" class="btn" data-act="fu-del" data-i="${i}" aria-label="${esc(L(['Satırı sil', 'Remove row']))}">×</button></td></tr>`).join('');
  const over = sum.rows.some((x) => x.over);
  const summary = sum.counted ? L([`${sum.counted} günde birikmiş fark: enerji ${sum.energyBalance >= 0 ? '+' : ''}${nf(r10(sum.energyBalance))} kcal, protein ${sum.proteinBalance >= 0 ? '+' : ''}${nf(Math.round(sum.proteinBalance))} g.`, `Cumulative difference over ${sum.counted} days: energy ${sum.energyBalance >= 0 ? '+' : ''}${nf(r10(sum.energyBalance))} kcal, protein ${sum.proteinBalance >= 0 ? '+' : ''}${nf(Math.round(sum.proteinBalance))} g.`]) : '';
  const open = state.openDetails.has('followup') || state.followup.length ? ' open' : '';
  return `<section class="card"><details data-details="followup"${open}><summary>${esc(L(['İzlem: verilen beslenme', 'Follow-up: delivered nutrition']))}</summary>
    <p class="hint">${esc(L(['Her gün verilen toplam enerji ve proteini (mama, ONS, ağızdan, PN, propofol ve dekstroz dahil) girin. Hedef o gün için şimdiki girdilerle hesaplanır; beslenme sürüyor kabul edilir.', 'Enter the total energy and protein delivered each day (formula, ONS, oral, PN, propofol and dextrose included). The target is calculated for that day with the current inputs, feeding taken as running.']))}</p>
    ${state.followup.length ? `<div class="table-wrap"><table class="limits"><thead><tr><th>${esc(icu ? t('icuDayCol') : t('feedDayCol'))}</th><th>${esc(L(['Enerji (kcal)', 'Energy (kcal)']))}</th><th>${esc(L(['Protein (g)', 'Protein (g)']))}</th><th>${esc(L(['Hedef', 'Target']))}</th><th>${esc(L(['Karşılanan', 'Achieved']))}</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>` : ''}
    ${summary ? `<p><strong>${esc(summary)}</strong></p>` : ''}
    ${over ? `<div class="note">${esc(L(['Erken fazda günün hedefinin %10’undan fazla üzerinde enerji verildi: ilk haftada enerji tahmini gereksinimin %70’inin altında tutulur (kalorimetriyle ilk 3 gün ölçülen harcamanın %70’ini aşmaz).', 'In the early phase energy exceeded the day’s target by more than 10%: in the first week energy is kept below 70% of the estimated needs (with calorimetry, not above 70% of measured expenditure for the first 3 days).']))}<div>${srcChip('espen-icu-2023')}</div></div>` : ''}
    <div class="actions">${state.followup.length < MAX_FOLLOWUP_ROWS ? `<button type="button" class="btn" data-act="fu-add">${esc(L(['Gün ekle', 'Add a day']))}</button>` : ''}</div>
  </details></section>`;
}
function addFollowupRow() {
  const last = state.followup[state.followup.length - 1];
  const lastDay = Number(String(last?.day ?? '').replace(',', '.'));
  const icuDay = Number(String(state.values.icuDay ?? '').replace(',', '.'));
  const day = Number.isInteger(lastDay) && lastDay > 0 ? lastDay + 1 : state.values.setting !== 'ward' && Number.isInteger(icuDay) && icuDay > 1 ? icuDay - 1 : 1;
  state.followup.push({ day: String(Math.min(365, day)), kcal: '', protein: '' });
}

// ---------------------------------------------------------------------------------------------
// Evidence library and decision topics (loaded only when opened; context, never a dose rule).
let evidenceModule = null;
const loadEvidence = () => (evidenceModule ? Promise.resolve(evidenceModule) : import('./evidence-data.mjs').then((m) => { evidenceModule = m; return m; }));
const EV_FIELDS = [['application', ['Uygulama', 'Application']], ['limitations', ['Sınırlılıklar', 'Limitations']], ['design', ['Tasarım', 'Design']], ['population', ['Popülasyon', 'Population']], ['primaryOutcome', ['Birincil sonlanım', 'Primary outcome']], ['sampleNote', ['Örneklem', 'Sample']], ['qualityHold', ['Kalite notu', 'Quality note']], ['access', ['Erişim', 'Access']], ['accessNote', ['Erişim notu', 'Access note']]];
const lc = (s) => String(s ?? '').toLocaleLowerCase(lang === 'tr' ? 'tr-TR' : 'en-GB');
// The type filter keeps a language-independent value (the English label), so it survives a language change.
const kindId = (r) => (r.kind && typeof r.kind === 'object' ? String(r.kind.en ?? '') : String(r.kind ?? ''));
// 'ok' | 'setting' (the choice is not offered for the current care setting) | 'unknown' (no such topic or choice).
// A 'setting' choice stays in the report with a note to choose again and is not saved in the case file.
function decisionStatus(id, choice) {
  const tp = evidenceModule?.DECISION_TOPICS.find((x) => x.id === id);
  const ch = tp?.choices.find((x) => x.id === choice);
  if (!tp || !ch) return 'unknown';
  return !ch.contexts || ch.contexts.includes(state.values.setting === 'ward' ? 'ward' : 'icu') ? 'ok' : 'setting';
}
function renderEvidence() {
  const box = $('#evidence');
  if (!evidenceModule) {
    box.innerHTML = `<section class="card"><p>${esc(L(['Kanıt kütüphanesi yükleniyor…', 'Loading the evidence library…']))}</p></section>`;
    loadEvidence().then(() => { if (state.view === 'evidence') renderEvidence(); });
    return;
  }
  const { EVIDENCE, EVIDENCE_META, DECISION_TOPICS } = evidenceModule;
  const setting = state.values.setting === 'ward' ? 'ward' : 'icu';
  const topics = DECISION_TOPICS.map((tp) => {
    const studies = tp.studies.map((s) => `<div class="supp"><h3>${esc(s.short)} <span class="chip low">${esc(L(s.badge))}</span></h3><p class="why"><strong>${esc(L(['Popülasyon', 'Population']))}:</strong> ${esc(L(s.population))}</p><p class="why"><strong>${esc(L(['Müdahale', 'Intervention']))}:</strong> ${esc(L(s.intervention))}</p><p class="why"><strong>${esc(L(['Sonuç', 'Outcome']))}:</strong> ${esc(L(s.outcome))}</p></div>`).join('');
    const chosen = state.decisions[tp.id];
    const choices = tp.choices.filter((ch) => !ch.contexts || ch.contexts.includes(setting)).map((ch) => `<label class="check"><input type="radio" name="dec-${esc(tp.id)}" data-decision="${esc(tp.id)}" value="${esc(ch.id)}" ${chosen === ch.id ? 'checked' : ''}><span><strong>${esc(L(ch.label))}</strong><br><span class="muted">${esc(L(ch.detail))}</span></span></label>`).join('');
    const stale = chosen && decisionStatus(tp.id, chosen) === 'setting' ? `<p class="field-error">${esc(L(['Kayıtlı seçim bu bakım ortamında sunulmuyor: yeniden seçin.', 'The saved choice is not offered for this care setting: choose again.']))}</p>` : '';
    const clear = chosen ? `<p><button type="button" class="linkish" data-act="decision-clear" data-topic="${esc(tp.id)}">${esc(L(['Seçimi kaldır', 'Clear the choice']))}</button></p>` : '';
    const open = state.openDetails.has(`topic-${tp.id}`) ? ' open' : '';
    return `<details class="topic" data-details="topic-${esc(tp.id)}"${open}><summary>${esc(tp.number)} · ${esc(L(tp.label))}: ${esc(L(tp.title))}</summary><p class="lead">${esc(L(tp.question))}</p>${studies}<p><strong>${esc(L(['Sentez', 'Synthesis']))}:</strong> ${esc(L(tp.synthesis))}</p>${choices ? `<span class="label">${esc(L(['Hekim seçimi (vaka dosyasına ve rapora girer)', 'Physician choice (saved in the case file and the report)']))}</span><div class="checks">${choices}</div>` : ''}${stale}${clear}</details>`;
  }).join('');
  const kinds = [...new Map(EVIDENCE.map((r) => [kindId(r), L(r.kind)])).entries()].sort((x, y) => x[1].localeCompare(y[1], lang === 'tr' ? 'tr' : 'en'));
  const q = lc(state.evidenceQuery.trim());
  const shown = EVIDENCE.filter((r) => (!state.evidenceKind || kindId(r) === state.evidenceKind) && (!q || [r.title, L(r.summary), L(r.application), L(r.kind), String(r.year)].some((x) => lc(x).includes(q))))
    .sort((x, y) => (y.year ?? 0) - (x.year ?? 0));
  const items = shown.map((r) => {
    const rows = EV_FIELDS.filter(([k]) => r[k]).map(([k, name]) => `<p><strong>${esc(L(name))}:</strong> ${esc(L(r[k]))}</p>`).join('');
    const links = [r.url && /^https:\/\//.test(r.url) ? `<a href="${esc(r.url)}" target="_blank" rel="noopener noreferrer">${esc(L(['Kaynak', 'Source']))}</a>` : '', r.doi ? `<a href="https://doi.org/${esc(r.doi)}" target="_blank" rel="noopener noreferrer">DOI ${esc(r.doi)}</a>` : ''].filter(Boolean).join(' · ');
    return `<details class="ev"><summary>${esc(String(r.year ?? ''))} · ${esc(L(r.kind))} — ${esc(r.title)}</summary>${r.summary ? `<p>${esc(L(r.summary))}</p>` : ''}${rows}${r.sampleSize !== undefined ? `<p><strong>n:</strong> ${esc(String(r.sampleSize))}</p>` : ''}${links ? `<p>${links}</p>` : ''}</details>`;
  }).join('');
  box.innerHTML = `<section class="card"><h2>${esc(L(['Kanıt kütüphanesi', 'Evidence library']))}</h2>
      <p class="lead">${esc(L([`Odaklı, kaynağa bağlı seçki; sistematik derleme değildir. Literatür kesiti: ${EVIDENCE_META.cutoff}. Hiçbiri otomatik doz kuralı değildir; öneriler kural belgesindeki kaynaklara dayanır.`, `A focused, source-linked selection, not a systematic review. Literature cut-off: ${EVIDENCE_META.cutoff}. None of it is an automatic dose rule; recommendations rest on the sources in the rules document.`]))}</p>
      <div class="actions"><button type="button" class="btn" data-act="evidence-back">${esc(t('back'))}</button></div></section>
    <section class="card"><h2>${esc(L(['Karar konuları', 'Decision topics']))}</h2><p class="muted">${esc(L(['Kılavuz referansı ile büyük çalışmaların gerçekte test ettiğini karşılaştırır; hekim seçimini kaydeder.', 'Compares guideline references with what large trials actually tested; records the physician’s choice.']))}</p>${topics}</section>
    <section class="card"><h2>${esc(L(['Kaynaklar', 'Sources']))} (${shown.length}/${EVIDENCE.length})</h2>
      <div class="fields"><div class="field"><label for="ev-q">${esc(L(['Ara', 'Search']))}</label><div class="input-wrap"><input id="ev-q" data-ev="q" autocomplete="off" value="${esc(state.evidenceQuery)}"></div></div>
      <div class="field"><label for="ev-kind">${esc(L(['Tür', 'Type']))}</label><div class="input-wrap"><select id="ev-kind" data-ev="kind" class="unit-select ev-kind"><option value="">${esc(L(['Hepsi', 'All']))}</option>${kinds.map(([id, label]) => `<option value="${esc(id)}"${id === state.evidenceKind ? ' selected' : ''}>${esc(label)}</option>`).join('')}</select></div></div></div>
      ${items || `<p class="muted">${esc(L(['Eşleşen kaynak yok.', 'No matching source.']))}</p>`}</section>`;
}
const DECISION_WORD = (id, choice) => {
  const tp = evidenceModule?.DECISION_TOPICS.find((x) => x.id === id);
  const ch = tp?.choices.find((x) => x.id === choice);
  return tp && ch ? [L(tp.label), L(ch.label)] : [id, choice];
};

// ICU severity scores (context only).
const ORGANS = { brain: ['Beyin', 'Brain'], respiratory: ['Solunum', 'Respiratory'], cardiovascular: ['Kardiyovasküler', 'Cardiovascular'], liver: ['Karaciğer', 'Liver'], kidney: ['Böbrek', 'Kidney'], hemostasis: ['Hemostaz', 'Haemostasis'] };
function icuScoresHtml(r) {
  const s = r.icuScores;
  if (!s || (!s.sofa2.entered && s.saps2 === null)) return '';
  const rows = [];
  if (s.sofa2.entered) {
    const c = s.sofa2.components;
    const parts = Object.keys(ORGANS).map((k) => `${L(ORGANS[k])} ${c[k] ?? '?'}`).join(' · ');
    rows.push(scaleRow('SOFA-2', s.sofa2.total !== null ? 'info' : 'incomplete', [
      s.sofa2.total !== null ? L([`Toplam ${s.sofa2.total} / 24.`, `Total ${s.sofa2.total} / 24.`]) : L([`${s.sofa2.known}/6 bileşen bilinir; bilinenlerin toplamı ${s.sofa2.partial}. Eksik bileşen sıfır sayılmaz.`, `${s.sofa2.known}/6 components known; their sum is ${s.sofa2.partial}. A missing component is not zero.`]),
      parts,
      L(['Ciddiyet bağlamıdır; beslenme dozunu değiştirmez.', 'Severity context; it does not change nutrition doses.']),
    ], ['sofa2-2025']));
  }
  if (s.saps2 !== null) rows.push(scaleRow('SAPS II', 'info', [L([`Kaydedilen toplam ${s.saps2} (klinisyenin özgün formdan hesabı; yeniden hesaplanmaz).`, `Recorded total ${s.saps2} (the clinician's calculation from the original form; not recalculated).`])], ['saps2-1993']));
  const open = state.openDetails.has('icu-scores') ? ' open' : '';
  return `<section class="card"><details data-details="icu-scores"${open}><summary>${esc(L(['Yoğun bakım ciddiyet skorları', 'ICU severity scores']))}</summary>${rows.join('')}</details></section>`;
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
  const actions = `<div class="actions"><button type="button" class="btn" data-act="edit">${esc(t('edit'))}</button><div class="right"><button type="button" class="btn" data-act="new">${esc(t('newPatient'))}</button><button type="button" class="btn" data-act="save-case">${esc(t('saveCase'))}</button>${(r.plan?.rows?.length ?? 0) > 1 ? `<button type="button" class="btn" data-act="save-csv">${esc(t('tableCsv'))}</button>` : ''}<button type="button" class="btn primary" data-act="print">${esc(t('print'))}</button></div></div><p class="muted no-print file-note">${esc(t('fileNote'))}</p>`;
  if (r.blocked) {
    if (r.invalid?.length) {
      const items = r.invalid.map((k) => {
        const at = locateField(k);
        const name = at ? `${L(at.field.label)} (${at.step}. ${L(['adım', 'step'])})` : k;
        const why = at ? fieldError(at.field, state.values[k]) ?? L(['Geçersiz değer.', 'Invalid value.']) : L(['Geçersiz değer.', 'Invalid value.']);
        return `<li><span class="txt"><strong>${esc(name)}</strong>: ${esc(why)}</span>${at ? `<button type="button" class="btn" data-fix="${at.step}" data-field="${esc(k)}">${esc(L(['Düzelt', 'Correct']))}</button>` : ''}</li>`;
      }).join('');
      box.innerHTML = printHeaderHtml() + `<section class="card summary missing"><h2>${esc(t('blocked'))}</h2><p class="big">${esc(L(['Hesap yapılmadı: aşağıdaki değerleri düzeltin.', 'No calculation was made: correct the values below.']))}</p><ul>${items}</ul></section>` + inputsHtml() + actions;
      return;
    }
    box.innerHTML = printHeaderHtml() + `<section class="card summary"><h2>${esc(t('blocked'))}</h2><p class="big">${esc(L(r.blocked))}</p></section>` + inputsHtml() + actions;
    return;
  }
  if (!r.plan) {
    box.innerHTML = printHeaderHtml() + `<section class="card summary"><span class="route">${esc(L(ROUTE_TEXT[r.route.kind] ?? ['', '']))}</span><h2>${esc(t('todayPlan'))}</h2><p class="big">${esc(L(['Miktar hesaplamak için kilo ya da boy gerekli.', 'Weight or height is needed to calculate amounts.']))}</p></section>${missingHtml(r)}${scalesHtml(r)}` + inputsHtml() + actions;
    return;
  }
  box.innerHTML = printHeaderHtml() + summaryHtml(r) + suppHtml(r) + tableHtml(r) + followupHtml(r) + missingHtml(r) + scalesHtml(r) + labsHtml(r) + icuScoresHtml(r) + notesHtml(r) + detailsHtml(r) + inputsHtml() + sourcesHtml(r) + actions;
}

function renderFooter() {
  $('#foot').innerHTML = `<p><strong>${esc(t('intended'))}</strong></p><p>${esc(t('privacy'))}</p>
    <p class="no-print">NutriClinic ${esc(ENGINE_VERSION)} · ${esc(L(['Kurallar', 'Rules']))} ${esc(RULES_DATE)} · Dr. Gökay Duman · <a href="LICENSE.txt">${esc(t('license').split('·')[0].trim())}</a> · <a href="source-code.zip">${esc(t('license').split('·')[1].trim())}</a></p>
    <p class="no-print"><button type="button" class="linkish" data-act="evidence">${esc(L(['Kanıt kütüphanesi ve karar konuları', 'Evidence library and decision topics']))}</button> · <a href="../nutriclinic2/">${esc(t('oldVersion'))}</a></p>`;
}

function render() {
  document.documentElement.lang = lang;
  document.title = `NutriClinic · ${lang === 'tr' ? 'Beslenme önerisi' : 'Nutrition recommendation'}`;
  document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll('[data-lang]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
  renderProgress();
  const cards = $('#cards');
  const result = $('#result');
  const evidence = $('#evidence');
  const cases = $('#cases');
  cards.hidden = state.view !== 'cards';
  result.hidden = state.view !== 'result';
  evidence.hidden = state.view !== 'evidence';
  cases.hidden = state.view !== 'cases';
  if (state.view === 'result') renderResult();
  else if (state.view === 'evidence') renderEvidence();
  else if (state.view === 'cases') renderCases();
  else renderCards();
  renderFooter();
  renderCasesButton();
  renderDeviceNote();
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
  if (el.id === 'open-case') { document.getElementById('case-file')?.click(); return; }
  if (el.id === 'my-cases') {
    if (state.view !== 'cases') state.prevView = state.view;
    state.view = 'cases';
    render();
    window.scrollTo({ top: 0 });
    if (site && (!lastPush || Date.now() - Date.parse(lastPush.at) > 30000)) pushNow();
    return;
  }
  if (el.id === 'example') {
    resetCase({ setting: 'icu', age: 67, sex: 'male', heightCm: 172, weightKg: 78, icuDay: 3, swallow: 'unsafe', gi: 'ok', shock: 'none', feeding: 'ongoing', kidney: 'normal', bowel: 'normal', stroke: true, usualWeightKg: 81, lossMonths: '3', lowIntakeDays: 2, nrsDisease: '3', lowElectrolytes: 'no', alcohol: 'no', riskDrugs: 'no', propofolMlH: 8 });
    state.example = true; // the example is never kept on the device
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
  if (act === 'fu-add' || act === 'fu-del') {
    if (act === 'fu-add') addFollowupRow(); else state.followup.splice(Number(el.dataset.i), 1);
    state.openDetails.add('followup');
    const scroll = window.scrollY;
    renderResult();
    window.scrollTo({ top: scroll });
    if (act === 'fu-add') document.getElementById(`fu-${state.followup.length - 1}-kcal`)?.focus();
    return;
  }
  if (act === 'evidence') { state.prevView = state.view === 'evidence' ? state.prevView : state.view; state.view = 'evidence'; render(); window.scrollTo({ top: 0 }); return; }
  if (act === 'cases-back') { state.view = ['cards', 'result'].includes(state.prevView) ? state.prevView : 'cards'; render(); window.scrollTo({ top: 0 }); return; }
  if (act === 'case-new' || act === 'reopened-new') { resetCase({ setting: state.values.setting ?? 'icu' }); go(1); return; }
  if (act === 'reopened-close') { state.reopened = null; renderDeviceNote(); return; }
  if (act === 'case-open') { const c = deviceStore ? getCase(deviceStore, el.dataset.id) : null; if (c) openDeviceCase(c); return; }
  if (act === 'case-delete') {
    const question = site ? ['Bu vaka bu cihazdan ve sitedeki anonim kopyasıyla birlikte silinsin mi? Geri alınamaz.', 'Delete this case from this device together with its anonymised copy on the site? This cannot be undone.']
      : ['Bu vaka bu cihazdan silinsin mi? Geri alınamaz.', 'Delete this case from this device? This cannot be undone.'];
    if (!window.confirm(L(question))) return;
    const gone = getCase(deviceStore, el.dataset.id);
    deleteCase(deviceStore, el.dataset.id);
    if (site && gone?.siteCode) { writePending([...readPending(), gone.siteCode]); pushNow(); }
    if (el.dataset.id === state.caseId) resetCase({ setting: state.values.setting ?? 'icu' }); // the open case leaves the screen too
    render();
    return;
  }
  if (act === 'cases-clear') { clearDevice(); return; }
  if (act === 'site-push') { pushNow(); return; }
  if (act === 'decision-clear') { delete state.decisions[el.dataset.topic]; const y = window.scrollY; renderEvidence(); window.scrollTo({ top: y }); return; }
  if (act === 'evidence-back') { state.view = state.prevView === 'evidence' ? 'cards' : state.prevView; render(); window.scrollTo({ top: 0 }); return; }
  if (act === 'save-case') { saveCase(recommend(engineInput())); return; }
  if (act === 'save-csv') { saveTableCsv(recommend(engineInput())); return; }
  if (act === 'import-apply') { applyImport(); redrawCards(); return; }
  if (act === 'import-clear') { state.import = null; redrawCards(); return; }
  if ((act === 'next' || act === 'show') && state.view === 'cards') {
    const bad = flatFields(STEPS[state.step - 1].fields(state.values)).find((f) => (f.type === 'num' || f.type === 'lab') && fieldError(f, state.values[f.key]));
    if (bad) { showFieldErrors(); focusField(bad.key); return; }
  }
  if (act === 'next') go(state.step + 1);
  else if (act === 'back') go(state.step - 1);
  else if (act === 'show') go('result');
  else if (act === 'edit') go(state.step);
  else if (act === 'print') window.print();
  else if (act === 'new') { resetCase({ setting: state.values.setting ?? 'icu' }); go(1); }
});

document.addEventListener('change', (e) => {
  if (e.target.id === 'case-file') {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) openCase(file);
    return;
  }
  const fileInput = e.target.closest('input[data-import]');
  if (fileInput) {
    const file = fileInput.files?.[0];
    if (file) {
      const seq = ++importSeq;
      state.import = { loading: true };
      state.openMore.add('more-import');
      redrawCards();
      readImport(file, seq).then((imp) => { if (seq !== importSeq || imp?.stale) return; state.import = imp; redrawCards(); })
        .catch(() => { if (seq === importSeq) { state.import = { error: 'read' }; redrawCards(); } });
    }
    return;
  }
  const importRow = e.target.closest('input[data-import-row]');
  if (importRow) {
    const row = state.import?.rows?.[Number(importRow.dataset.importRow)];
    if (row) {
      row.selected = importRow.checked;
      // One value per test: choosing a row clears the other rows of the same test.
      if (row.selected) state.import.rows.forEach((x) => { if (x !== row && x.key === row.key) x.selected = false; });
    }
    redrawCards();
    return;
  }
  if (e.target.dataset?.device === 'toggle') {
    if (!e.target.checked) { deviceOff(e.target); return; }
    setDeviceStorage(deviceStore, true);
    saveToDevice();
    render();
    return;
  }
  if (e.target.dataset?.site === 'toggle') { siteToggle(e.target); return; }
  if (e.target.dataset?.caseLabel) {
    const id = e.target.dataset.caseLabel;
    renameCase(deviceStore, id, e.target.value);
    if (id === state.caseId) { state.caseLabel = cleanCaseLabel(e.target.value); lastSaved = JSON.stringify([state.caseLabel, caseData()]); }
    renderCases();
    return;
  }
  if (e.target.dataset?.ev === 'kind') { state.evidenceKind = e.target.value; renderEvidence(); return; }
  if (e.target.dataset?.decision) {
    if (decisionStatus(e.target.dataset.decision, e.target.value) === 'ok') state.decisions[e.target.dataset.decision] = e.target.value;
    const y = window.scrollY;
    renderEvidence();
    window.scrollTo({ top: y });
    return;
  }
  const unitSelect = e.target.closest('select[data-unit]');
  if (unitSelect) {
    const key = unitSelect.dataset.unit;
    state.values[unitKey(key)] = unitSelect.value;
    // Lower limits show the unit of their value: redraw the card, keeping the place.
    const scroll = window.scrollY;
    renderCards();
    window.scrollTo({ top: scroll });
    document.querySelector(`select[data-unit="${key}"]`)?.focus();
    return;
  }
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
  if (input.dataset.ev === 'q') {
    state.evidenceQuery = input.value;
    const pos = input.selectionStart;
    renderEvidence();
    const again = document.getElementById('ev-q');
    if (again) { again.focus(); try { again.setSelectionRange(pos, pos); } catch { /* not a text input */ } }
    return;
  }
  if (input.dataset.fu) {
    const [i, field] = input.dataset.fu.split(':');
    if (state.followup[Number(i)] && field in FOLLOWUP_FIELDS) state.followup[Number(i)][field] = input.value;
    const id = input.id;
    const pos = input.selectionStart;
    const scroll = window.scrollY;
    renderResult();
    window.scrollTo({ top: scroll });
    const again = document.getElementById(id);
    if (again) { again.focus(); try { again.setSelectionRange(pos, pos); } catch { /* not a text input */ } }
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

// ---------------------------------------------------------------------------------------------
// Cases on the site (vault.mjs), only when the clinician ticks it: each case is sent anonymised - without its label -
// under a case code; this device keeps the label and matches the code to show the real case. On the site only this
// device (by its token) and the administrator can see a copy. Unticked, cases stay on this device only.
const SITE_BASE = new URL('api/vault/', document.baseURI).href;
let site = null; // { token, api, abort }
let siteGen = 0; // changes whenever site storage is turned off here: a sending still running then changes nothing
let pushing = false;
let pushAgain = false;
let currentPush = null;
let pushTimer = null;
let lastPush = null;
let siteError = null;
const SITE_TEXT = {
  offline: ['Siteye ulaşılamadı; vakalar bu cihazda duruyor, sonra yeniden gönderilecek.', 'The site could not be reached; the cases stay on this device and will be sent later.'],
  partial: ['Bazı vakalar siteye gönderilemedi; sonra yeniden denenecek.', 'Some cases could not be sent to the site; it will be tried again.'],
  limit: ['Sitede bu cihaz için yer kalmadı (en çok 200 vaka): eski vakaları silin.', 'No room left on the site for this device (at most 200 cases): delete old cases.'],
  'off-failed': ['Sitedeki kopyalar silinemedi (siteye ulaşılamadı); sitede saklama açık kaldı. Sonra yeniden deneyin.', 'The copies on the site could not be deleted (the site could not be reached); site storage stays on. Try again later.'],
};
const readPending = () => {
  try { const x = JSON.parse(deviceStore.getItem(PENDING_KEY) ?? '[]'); return Array.isArray(x) ? x.filter((c) => typeof c === 'string' && /^NC-/.test(c)) : []; } catch { return []; }
};
const writePending = (list) => { try { deviceStore.setItem(PENDING_KEY, JSON.stringify([...new Set(list)])); } catch { /* storage unavailable */ } };
function connectSite(token) {
  const abort = new AbortController();
  return { token, abort, api: siteApi({ fetch: (...args) => window.fetch(...args), base: SITE_BASE, token, signal: abort.signal }) };
}
function forgetSite() {
  siteGen += 1;
  site?.abort.abort();
  site = null;
  lastPush = null;
  siteError = null;
  try { deviceStore?.removeItem(TOKEN_KEY); deviceStore?.removeItem(PENDING_KEY); } catch { /* storage unavailable */ }
  if (deviceStore) clearSiteMarks(deviceStore);
}
// One sending at a time; a request during one runs once more afterwards.
function pushNow() {
  clearTimeout(pushTimer);
  if (!site || !deviceOn()) return Promise.resolve();
  if (currentPush) { pushAgain = true; return currentPush; }
  currentPush = runPush().finally(() => {
    currentPush = null;
    if (pushAgain) { pushAgain = false; pushNow(); }
  });
  return currentPush;
}
async function runPush() {
  const gen = siteGen;
  const s = site;
  const alive = () => gen === siteGen && site === s && deviceOn();
  const local = { list: () => (alive() ? listCases(deviceStore) : []), mark: (id, code, at) => alive() && markSite(deviceStore, id, code, at) };
  pushing = true;
  if (state.view === 'cases') renderCases();
  try {
    const res = await pushCases({ api: s.api, local, pending: readPending(), engine: ENGINE_VERSION });
    if (!alive()) return;
    writePending(readPending().filter((c) => !res.done.includes(c)));
    lastPush = { at: new Date().toISOString(), ...res };
    siteError = res.limit ? 'limit' : res.failed ? 'partial' : null;
  } catch {
    if (alive()) siteError = 'offline';
  } finally {
    pushing = false;
  }
  if (!alive()) return;
  renderCasesButton();
  if (state.view === 'cases') renderCases();
}
const schedulePush = () => { if (site) { clearTimeout(pushTimer); pushTimer = setTimeout(pushNow, 3000); } };
// Turning site storage off here deletes this device's copies on the site first; when that fails it stays on.
async function deleteSiteCopies() {
  if (!site) return true;
  try {
    const listed = await site.api.list();
    if (listed.status !== 200) return false;
    for (const c of listed.data?.cases ?? []) if ((await site.api.remove(c.code)).status !== 200) return false;
    return true;
  } catch {
    return false;
  }
}
async function siteToggle(box) {
  state.siteMsg = null;
  if (box.checked) {
    let token = null;
    try { token = newToken(); deviceStore.setItem(TOKEN_KEY, token); } catch { box.checked = false; return; }
    siteGen += 1;
    site = connectSite(token);
    renderCases();
    await pushNow();
    return;
  }
  if (!window.confirm(L(['Sitede saklama kapatılsın mı? Bu cihazın sitedeki anonim kopyaları silinir.', 'Stop keeping cases on the site? The anonymised copies of this device on the site are deleted.']))) { box.checked = true; return; }
  await currentPush;
  if (!(await deleteSiteCopies())) { state.siteMsg = 'off-failed'; renderCases(); return; }
  forgetSite();
  renderCases();
}
async function clearDevice() {
  const n = listCases(deviceStore).length;
  const question = site ? [`Bu cihazdaki ${n} vaka ve sitedeki anonim kopyaları silinsin mi? Geri alınamaz.`, `Delete the ${n} cases on this device and their anonymised copies on the site? This cannot be undone.`]
    : [`Bu cihazdaki ${n} vakanın hepsi silinsin mi? Geri alınamaz.`, `Delete all ${n} cases from this device? This cannot be undone.`];
  if (!window.confirm(L(question))) return;
  if (site) writePending([...readPending(), ...listCases(deviceStore).map((c) => c.siteCode).filter(Boolean)]);
  clearCases(deviceStore);
  resetCase({ setting: state.values.setting ?? 'icu' });
  render();
  if (site) pushNow();
}
async function deviceOff(box) {
  const n = listCases(deviceStore).length;
  const question = site ? [`Cihazda saklama kapatılsın mı? Bu cihazdaki ${n} vaka ve sitedeki anonim kopyaları silinir.`, `Turn device storage off? The ${n} cases on this device and their anonymised copies on the site will be deleted.`]
    : [`Cihazda saklama kapatılsın mı? Bu cihazdaki ${n} vaka silinir.`, `Turn device storage off? The ${n} cases on this device will be deleted.`];
  if ((n || site) && !window.confirm(L(question))) { box.checked = true; return; }
  if (site) {
    await currentPush;
    if (!(await deleteSiteCopies())) { state.siteMsg = 'off-failed'; render(); return; }
    forgetSite();
  }
  clearCases(deviceStore);
  setDeviceStorage(deviceStore, false);
  state.caseId = null;
  lastSaved = '';
  render();
}
function siteHtml() {
  if (!deviceOn()) return '';
  const on = Boolean(site);
  const status = !on ? '' : pushing ? L(['Gönderiliyor…', 'Sending…'])
    : lastPush ? L([`Sitede ${lastPush.remote} vaka · son gönderim ${when(lastPush.at)}`, `${lastPush.remote} cases on the site · last sent ${when(lastPush.at)}`]) : '';
  const problem = state.siteMsg ?? (on ? siteError : null);
  const error = problem ? `<p class="field-error">${esc(L(SITE_TEXT[problem]))}${on && siteError ? ` <button type="button" class="linkish" data-act="site-push">${esc(L(['Yeniden dene', 'Try again']))}</button>` : ''}</p>` : '';
  return `<section class="card"><label class="check"><input type="checkbox" data-site="toggle"${on ? ' checked' : ''}><span>${esc(L(['Vakaları sitede de sakla', 'Also keep cases on the site']))}</span></label>
    <p class="hint">${esc(L(['İşaretlerseniz vakalar anonimleştirilerek sitedeki veritabanında saklanır.', 'If ticked, cases are anonymised and kept in the site’s database.']))}</p>${status ? `<p class="muted">${esc(status)}</p>` : ''}${error}</section>`;
}
// After a reload: this device's token, if site storage was turned on here.
async function loadSite() {
  if (!deviceOn() || site) return;
  let token = null;
  try { token = deviceStore.getItem(TOKEN_KEY); } catch { token = null; }
  if (!isToken(token)) return;
  siteGen += 1;
  site = connectSite(token);
  renderCasesButton();
  await pushNow();
}

// Every change of the open case is saved on this device shortly after it happens, and at once when the page is left.
for (const type of ['input', 'change', 'click']) document.addEventListener(type, scheduleSave);
window.addEventListener('pagehide', saveToDevice);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') saveToDevice(); });

render();
{
  const c = deviceOn() ? caseToReopen(deviceStore) : null;
  (c ? openDeviceCase(c, { reopened: true }) : Promise.resolve()).then(loadSite).catch(() => { /* site storage stays off */ });
}
