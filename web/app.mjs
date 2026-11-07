// NutriClinic staged interface. Patient data stay in this page: nothing is stored or sent.
// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Gökay Duman
import { recommend, ENGINE_VERSION, RULES_DATE, PRODUCT_DEFAULTS } from './engine.mjs';
import { SOURCES } from './sources.mjs';
import { getInitialLocale, LANGUAGE_STORAGE_KEY } from './initial-locale.mjs';

let lang = getInitialLocale();
const state = { step: 1, values: { setting: 'icu' }, product: {}, view: 'cards', openDetails: new Set() };

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
const STEPS = [
  {
    title: ['Hasta', 'Patient'],
    lead: ['Önce temel bilgiler. Kilo olmadan miktar hesaplanamaz; diğer eksikler öneriyi durdurmaz.', 'Basic data first. Amounts need the weight; other gaps do not stop the recommendation.'],
    fields: (v) => [
      { key: 'setting', type: 'seg', wide: true, label: ['Bakım yeri', 'Care setting'], options: [{ value: 'icu', label: ['Yoğun bakım', 'Intensive care'] }, { value: 'ward', label: ['Servis', 'Ward'] }], fixed: true },
      { key: 'age', type: 'num', label: ['Yaş', 'Age'], unit: ['yıl', 'years'], unlock: ['Yaşı girerseniz 65 yaş üstünde lifli mama ve ONS kuralını uygularım.', 'Enter the age to apply the fibre and ONS rules from age 65.'] },
      { key: 'sex', type: 'seg', label: ['Cinsiyet', 'Sex'], options: [{ value: 'female', label: ['Kadın', 'Female'] }, { value: 'male', label: ['Erkek', 'Male'] }], unlock: ['Cinsiyet ideal kilo formülünü belirler.', 'Sex selects the ideal-weight formula.'] },
      { key: 'heightCm', type: 'num', label: ['Boy', 'Height'], unit: ['cm', 'cm'], unlock: ['Boyu girerseniz ideal ve düzeltilmiş kiloyu hesaplar, obezite ya da zayıflıkta hedefi ayarlarım.', 'Enter the height to calculate ideal and adjusted weight and adapt targets in obesity or underweight.'] },
      { key: 'weightKg', type: 'num', label: ['Güncel kilo', 'Current weight'], unit: ['kg', 'kg'], req: true, unlock: ['Bütün miktarlar kiloya göre hesaplanır; girilmezse temkinli tahmin kullanırım.', 'All amounts are per kg; without it I use a cautious estimate.'] },
      ...(v.setting !== 'ward' ? [{ key: 'icuDay', type: 'num', label: ['Yoğun bakımın kaçıncı günü?', 'Day of ICU stay'], unit: ['gün', 'day'], hint: ['Yatış günü = 1', 'Admission day = 1'], unlock: ['Günü girerseniz akut faz sınırlarına göre bugünkü enerji ve proteini veririm.', 'Enter the day to set today’s energy and protein within the acute-phase limits.'] }] : []),
    ],
  },
  {
    title: ['Beslenme yolu', 'Feeding route'],
    lead: ['Yutma, sindirim kanalı ve dolaşım durumu mamanın yolunu ve zamanını belirler.', 'Swallowing, gut and circulation decide the route and timing.'],
    fields: (v) => [
      { key: 'swallow', type: 'seg', stack: true, wide: true, label: ['Ağızdan beslenme / disfaji', 'Oral intake / dysphagia'], options: [
        { value: 'safe', label: ['Güvenle yiyebiliyor', 'Can eat safely'] },
        { value: 'modified', label: ['Disfaji var; kıvam ayarlı diyetle yiyebiliyor', 'Dysphagia; can eat a texture-modified diet'] },
        { value: 'unsafe', label: ['Yiyemiyor: yutma güvensiz, entübe ya da bilinç kapalı', 'Cannot eat: unsafe swallow, intubated or reduced consciousness'] },
      ], unlock: ['Yutma/disfaji durumunu girerseniz beslenme yolunu (ağızdan, kıvam ayarlı, tüp) ve uygun ONS kıvamını öneririm.', 'Enter swallowing/dysphagia to get the route (oral, texture-modified, tube) and the right ONS texture.'] },
      ...(v.swallow === 'safe' || v.swallow === 'modified' ? [{ key: 'oralIntakePct', type: 'num', label: ['Gereksiniminin yüzde kaçını yiyor?', 'Share of needs eaten'], unit: ['%', '%'], hint: ['Son 1–3 günün ortalaması; tabağın yarısı ≈ %50', 'Average of the last 1–3 days; half the tray ≈ 50%'], unlock: ['Alımı girerseniz ONS sayısını ya da tüple ek beslenme gereğini kesinleştiririm.', 'Enter intake to fix the number of ONS servings or the need for extra tube feeding.'] }] : []),
      { key: 'gi', type: 'seg', label: ['Sindirim kanalı', 'Gut'], options: [{ value: 'ok', label: ['Kullanılabilir', 'Usable'] }, { value: 'contraindicated', label: ['Kullanılamaz (obstrüksiyon, iskemi vb.)', 'Not usable (obstruction, ischaemia, etc.)'] }], unlock: ['Sindirim kanalı kullanılamıyorsa parenteral beslenmenin zamanını ve miktarını hesaplarım.', 'If the gut cannot be used I time and size parenteral nutrition.'] },
      ...(v.setting !== 'ward' ? [
        { key: 'shock', type: 'seg', stack: true, label: ['Şok', 'Shock'], options: [{ value: 'none', label: ['Yok', 'None'] }, { value: 'controlled', label: ['Var, sıvı/vazopressörle kontrol altında', 'Present, controlled with fluids/vasopressors'] }, { value: 'uncontrolled', label: ['Kontrolsüz (perfüzyon hedefleri sağlanmadı)', 'Uncontrolled (perfusion goals not met)'] }], unlock: ['Şok durumunu girerseniz beslenmenin bugün başlayıp başlamayacağını ve dozunu belirlerim; girilmezse bugün düşük doz veririm.', 'Enter shock status to decide whether and how much to feed today; without it I give a low dose today.'] },
      ] : []),
      { key: 'feeding', type: 'seg', label: ['Beslenme desteği', 'Nutrition support'], options: [{ value: 'none', label: ['Henüz başlamadı', 'Not started yet'] }, { value: 'ongoing', label: ['Sürüyor ve tolere ediliyor', 'Running and tolerated'] }], unlock: ['Beslenme sürüyorsa kademeli artışı bulunduğu günden sürdürürüm; girilmezse ilk basamaktan başlarım.', 'If feeding is running I continue the progression from today; otherwise I start from the first step.'] },
      ...(v.setting === 'ward' && v.swallow !== 'safe' && v.swallow !== 'modified' ? [{ key: 'feedingMode', type: 'seg', label: ['Tüple uygulama', 'Tube delivery'], options: [{ value: 'continuous', label: ['Pompayla sürekli', 'Continuous by pump'] }, { value: 'intermittent', label: ['Aralıklı öğünler (bolus)', 'Intermittent feeds (bolus)'] }], unlock: ['Aralıklı seçerseniz günlük öğün sayısını ve her öğünün mL’sini veririm.', 'Choose intermittent to get the number of feeds and mL per feed.'] }] : []),
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
    ],
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
      ...(v.setting !== 'ward' ? [{ key: 'burnsTbsa', type: 'num', label: ['Yanık', 'Burn'], unit: ['% TVYA', '% TBSA'], hint: ['Yanık yoksa boş bırakın', 'Leave empty if no burn'], unlock: ['Yanık yüzdesini girerseniz çinko ve glutamin gereğini hesaplarım.', 'Enter the burn size to calculate zinc and glutamine.'] }] : []),
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
    title: ['Refeeding riski', 'Refeeding risk'],
    lead: ['Başlangıç miktarını ve tiamin/elektrolit gereğini belirler (NICE ölçütleri). Girilmezse temkinli başlangıç uygulanır.', 'Sets the starting amount and the need for thiamine and electrolytes (NICE criteria). Without it a cautious start is used.'],
    fields: () => [
      { key: 'usualWeightKg', type: 'num', label: ['Hastalık öncesi olağan kilo', 'Usual (pre-illness) weight'], unit: ['kg', 'kg'], unlock: ['Olağan kiloyu girerseniz kilo kaybını hesaplar, refeeding riskini ve böbrek hastasında protein kilosunu belirlerim.', 'Enter the usual weight to calculate weight loss, refeeding risk and the protein weight in kidney disease.'] },
      { key: 'weightLossPct', type: 'num', label: ['Son 3–6 ayda istemsiz kilo kaybı', 'Unintentional weight loss in 3–6 months'], unit: ['%', '%'], hint: ['Olağan kilo girildiyse boş bırakabilirsiniz', 'May stay empty if the usual weight is entered'] },
      { key: 'lowIntakeDays', type: 'num', label: ['Kaç gündür çok az ya da hiç beslenemiyor?', 'Days of little or no intake'], unit: ['gün', 'days'], unlock: ['Gün sayısını girerseniz başlangıç miktarını ve tiamin gereğini belirlerim.', 'Enter the number of days to set the starting amount and thiamine.'] },
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
    const invalid = state.invalid?.includes(f.key) ? ' invalid' : '';
    return `<div class="field${wide}"><label for="f-${f.key}">${esc(L(f.label))}${f.req ? `<span class="req" title="${esc(t('required'))}">*</span>` : ''}</label>
      <div class="input-wrap${invalid}"><input id="f-${f.key}" data-key="${f.key}" inputmode="decimal" autocomplete="off" enterkeyhint="next" value="${esc(val)}"><span class="unit">${esc(L(f.unit))}</span></div>
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
  return '';
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
    if (o.servings === 0 && o.capped) big = L(['Refeeding nedeniyle bugünkü toplam enerji sınırlı; ağızdan alım bu sınıra ulaşıyor. Bugün ONS eklemeyin, tabloya göre günler içinde artırın.', 'Because of refeeding risk today’s total energy is capped and oral intake already reaches it. Add no ONS today; increase over the days as in the table.']);
    else if (o.servings === 0) big = L([`Ağızdan beslenme yeterli: bugünkü hedefin en az %${Math.round(o.share * 100)}’i karşılanıyor. ONS gerekmiyor; alımı izleyin.`, `Oral intake is sufficient: at least ${Math.round(o.share * 100)}% of today’s target is met. No ONS needed; monitor intake.`]);
    else big = L([`Günde ${o.servings} × ${nf(o.ons.serving)} ${unit} ${L(r.product.label)}${o.fiber ? ' (lifli)' : ''}`, `${o.servings} × ${nf(o.ons.serving)} ${unit} per day of ${L(r.product.label)}${o.fiber ? ' (with fibre)' : ''}`]);
    if (o.servings > 0) lines.push(L(['Öğün aralarında, yemekten en az 1 saat sonra (örn. 10:30, 15:30, 21:00).', 'Between meals, at least 1 h after a meal (e.g. 10:30, 15:30, 21:00).']));
    if (o.capped) lines.push(L([`Refeeding: ilk gün toplam enerji en çok ${nf(r10(o.kcalTarget))} kcal; 4–7 günde tam hedefe çıkılır (tablo).`, `Refeeding: total energy on day 1 at most ${nf(r10(o.kcalTarget))} kcal; full target within 4–7 days (table).`]));
    if (o.moduleProtein > 0) lines.push(L([`Protein açığı: protein tozu ${nf(o.moduleProtein)} g protein/gün (≈ ${nf(o.moduleGrams)} g), 2–3 doza bölünüp içecek ya da yemeğe karıştırılarak.`, `Protein gap: protein powder ${nf(o.moduleProtein)} g protein/day (≈ ${nf(o.moduleGrams)} g), in 2–3 doses mixed into drinks or food.`]));
    if (r.input.swallow === 'modified') lines.push(L(['Diyet: kıvam ayarlı, enerji ve protein bakımından zenginleştirilmiş; sıvılar yutma değerlendirmesindeki IDDSI düzeyinde.', 'Diet: texture-modified, energy- and protein-enriched; fluids at the IDDSI level set by the swallowing assessment.']));
    kpis = kpi(t('energyToday'), `${nf(r10(o.kcalTarget))} kcal`, `${nf(o.kcalTarget / r.metrics.energyWeight, 1)} kcal/kg`)
      + kpi(t('proteinToday'), `${nf(Math.round(o.proteinTarget))} g`, `${nf(o.proteinTarget / r.metrics.proteinWeight, 2)} g/kg`)
      + kpi(L(['ONS ile', 'From ONS']), `${nf(o.onsKcal)} kcal`, `${nf(o.onsProtein)} g protein`)
      + (o.totalKcal !== null ? kpi(L(['Toplam (tahmini)', 'Total (estimated)']), `${nf(r10(o.totalKcal))} kcal`, `${nf(Math.round((o.totalKcal / o.kcalTarget) * 100))}% · ${nf(Math.round(o.totalProtein))} g protein`) : '');
  } else if ((kind === 'en' || kind === 'delay') && today) {
    const label = L(r.product.label) + (r.product.fiber ? `, ${t('fiber')}` : '');
    const restart = plan.restart;
    if (kind === 'delay') {
      big = L([`Şu an enteral beslenme başlatmayın: ${L(DELAY_TEXT[r.route.reason] ?? ['erteleme koşulu', 'delaying condition'])}.`, `Do not start enteral feeding now: ${L(DELAY_TEXT[r.route.reason] ?? ['delaying condition', 'delaying condition'])}.`]);
      lines.push(L([`Koşul düzelince düşük dozla başlayın: ${label}, ${nf(restart.rate)} mL/saat (24 saat sürekli); sonra aşağıdaki tabloya göre artırın.`, `Once it resolves, start at a low dose: ${label}, ${nf(restart.rate)} mL/h (continuous over 24 h); then increase as in the table below.`]));
    } else if (!today.volume) {
      big = L(['Bugün tüple mama verilmez: bugünkü hedef ağızdan alım ya da beslenme dışı kaloriyle karşılanıyor. Sonraki günler için tabloya bakın.', 'No tube feed today: today’s target is covered by oral intake or non-nutritional calories. See the table for the next days.']);
    } else if (today.feeds) {
      big = L([`${label}: günde ${today.feeds.n} öğün × ${nf(today.feeds.ml)} mL (3–4 saat arayla) = ${nf(today.volume)} mL/gün`, `${label}: ${today.feeds.n} feeds × ${nf(today.feeds.ml)} mL a day (every 3–4 h) = ${nf(today.volume)} mL/day`]);
    } else {
      big = L([`${label}: ${nf(today.rate)} mL/saat, 24 saat pompayla sürekli = ${nf(today.volume)} mL/gün`, `${label}: ${nf(today.rate)} mL/h by pump, continuous over 24 h = ${nf(today.volume)} mL/day`]);
    }
    if (today.moduleProtein > 0) lines.push(L([`Protein modülü: ${nf(today.moduleProtein)} g protein/gün (≈ ${nf(today.moduleGrams)} g toz), 2–4 doza bölünüp suyla tüpten.`, `Protein module: ${nf(today.moduleProtein)} g protein/day (≈ ${nf(today.moduleGrams)} g powder), in 2–4 doses with water via the tube.`]));
    if (today.powderGrams) lines.push(L([`Toz ürün kullanılıyorsa: günde ${nf(today.powderGrams)} g toz (etiketteki sulandırmayla).`, `If a powder is used: ${nf(today.powderGrams)} g powder a day (diluted as on the label).`]));
    if (r.route.supplementalToOral) lines.push(L([`Ağızdan alım (%${nf(r.input.oralIntakePct)}) sürer; ONS ile %75’e ulaşılamadığı için açık tüple kapatılır.`, `Oral intake (${nf(r.input.oralIntakePct)}%) continues; ONS cannot reach 75%, so the gap is covered by tube.`]));
    if (r.product.changeFrom) lines.push(L([`${r.product.changeFrom.day}. günden itibaren: ${L(r.product.changeFrom.label)} (tabloya bakın).`, `From day ${r.product.changeFrom.day}: ${L(r.product.changeFrom.label)} (see the table).`]));
    if (plan.fluid) lines.push(L([`Toplam sıvı 30–35 mL/kg: ${nf(r10(plan.fluid.min))}–${nf(r10(plan.fluid.max))} mL/gün. Mamadan ${nf(r10(plan.fluid.formulaWater))} mL; ek su (yıkama dahil) ${nf(r10(plan.fluid.extraMin))}–${nf(r10(plan.fluid.extraMax))} mL/gün.`, `Total fluid 30–35 mL/kg: ${nf(r10(plan.fluid.min))}–${nf(r10(plan.fluid.max))} mL/day. Formula water ${nf(r10(plan.fluid.formulaWater))} mL; extra water (flushes included) ${nf(r10(plan.fluid.extraMin))}–${nf(r10(plan.fluid.extraMax))} mL/day.`]));
    const shown = kind === 'delay' ? restart : today;
    kpis = kpi(t('energyToday'), `${nf(r10(shown.kcalTarget))} kcal`, `${nf(shown.kcalTarget / r.metrics.energyWeight, 1)} kcal/kg`)
      + kpi(t('proteinToday'), `${nf(Math.round(shown.proteinTarget))} g`, `${nf(shown.proteinTarget / r.metrics.proteinWeight, 2)} g/kg`)
      + kpi(t('delivered'), `${nf(r10(shown.formulaKcal))} kcal`, `${nf(Math.round(shown.formulaProtein + (shown.moduleProtein || 0)))} g protein${shown.moduleProtein ? L([' (modül dahil)', ' (module included)']) : ''}${r.nonNutritional.total > 0 ? L([` · + ${nf(r10(r.nonNutritional.total))} kcal propofol/dekstroz`, ` · + ${nf(r10(r.nonNutritional.total))} kcal propofol/dextrose`]) : ''}`)
      + fullKpi(r);
  } else if ((kind === 'pn' || kind === 'pn-later') && plan?.rows?.length) {
    const day1 = today ?? plan.rows[0];
    big = kind === 'pn-later'
      ? L(['Sindirim kanalı kullanılamıyor: parenteral beslenmeyi 3–7. günler arasında başlatın (ağır malnütrisyonda daha erken ve kademeli). Enteral yolu her gün yeniden değerlendirin.', 'The gut cannot be used: start parenteral nutrition between days 3 and 7 (earlier and progressively if severely malnourished). Reassess the enteral route daily.'])
      : L([`Parenteral beslenme: ${nf(r10(day1.pnKcal))} kcal/gün, amino asit ${nf(Math.round(day1.aminoAcids))} g/gün`, `Parenteral nutrition: ${nf(r10(day1.pnKcal))} kcal/day, amino acids ${nf(Math.round(day1.aminoAcids))} g/day`]);
    if (kind === 'pn-later') lines.push(L([`PN başlangıcı (${day1.icuDay}. gün): ${nf(r10(day1.pnKcal))} kcal, amino asit ${nf(Math.round(day1.aminoAcids))} g; sonra tabloya göre artırın.`, `PN start (day ${day1.icuDay}): ${nf(r10(day1.pnKcal))} kcal, amino acids ${nf(Math.round(day1.aminoAcids))} g; then increase as in the table.`]));
    lines.push(L([`Sınırlar: glukoz en çok ${nf(Math.round(day1.glucoseMaxG))} g/gün (5 mg/kg/dk); lipit en çok ${nf(Math.round(day1.lipidMaxG))} g/gün (1,5 g/kg, propofol dahil). Torbayı enerji ve amino asit hedefine en yakın olacak şekilde seçin.`, `Limits: glucose at most ${nf(Math.round(day1.glucoseMaxG))} g/day (5 mg/kg/min); lipid at most ${nf(Math.round(day1.lipidMaxG))} g/day (1.5 g/kg, propofol included). Choose the bag closest to the energy and amino-acid targets.`]));
    const k1 = kind === 'pn-later' ? L([`PN başlangıç hedefi (${day1.icuDay}. gün)`, `PN start target (day ${day1.icuDay})`]) : t('energyToday');
    kpis = kpi(k1, `${nf(r10(day1.kcal))} kcal`, `${nf(day1.kcal / r.metrics.energyWeight, 1)} kcal/kg`)
      + kpi(kind === 'pn-later' ? L([`Amino asit (${day1.icuDay}. gün)`, `Amino acids (day ${day1.icuDay})`]) : t('proteinToday'), `${nf(Math.round(day1.protein))} g`, `${nf(day1.protein / r.metrics.proteinWeight, 2)} g/kg`) + fullKpi(r);
  }
  const access = r.route.access && kind !== 'oral' ? `<p class="muted">${esc(t('access'))}: ${esc(L(ACCESS_TEXT[r.route.access]))}</p>` : '';
  const comp = compText(r);
  return `<section class="card summary">
    <span class="route">${esc(L(ROUTE_TEXT[kind]))}</span>
    <h2>${esc(t('todayPlan'))}</h2>
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
  const num = (path, label, unit, value) => `<div class="field"><label for="lbl-${path}">${esc(label)}</label><div class="input-wrap"><input id="lbl-${path}" data-label="${path}" inputmode="decimal" value="${esc(value ?? '')}" placeholder="${esc(nf(numberAt(c, path) ?? numberAtDefault(path), 2))}"><span class="unit">${esc(unit)}</span></div></div>`;
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
  if (kind === 'pn' || kind === 'pn-later') {
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
  return `<section class="card"><h2>${esc(t('progression'))}</h2><div class="table-wrap"><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div></section>`;
}

function missingHtml(r) {
  const items = r.missing.filter((x) => x.card > 0 || x.impact !== 'low');
  if (!items.length) return `<section class="card missing"><h2>${esc(t('missingTitle'))}</h2><p class="muted">${esc(t('missingNone'))}</p></section>`;
  const level = { critical: ['Kritik', 'Critical'], high: ['Yüksek', 'High'], medium: ['Orta', 'Medium'], low: ['Düşük', 'Low'] };
  const list = items.map((x) => `<li><span class="txt"><span class="chip ${x.impact}">${esc(L(level[x.impact]))}</span> ${esc(L(x.text))}</span>${x.card > 0 ? `<button type="button" class="btn" data-fix="${x.card}" data-field="${esc(x.field)}">${esc(t('add'))}</button>` : ''}</li>`).join('');
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
function engineInput() {
  const { module, form, powder } = state.product;
  const base = recommend({ ...state.values, product: { module, form, powder } });
  const c = base.product?.composition ?? {};
  const pr = { module, form, powder };
  const pick = (v, d) => (String(v ?? '').trim() !== '' ? v : d);
  if (filled(state.product.en, ['kcalPerMl', 'proteinPer100', 'waterPer100']) && 'kcalPerMl' in c) {
    const en = state.product.en;
    pr.en = { kcalPerMl: pick(en.kcalPerMl, c.kcalPerMl), proteinPer100: pick(en.proteinPer100, c.proteinPer100), waterPer100: pick(en.waterPer100, c.waterPer100) };
  }
  if (filled(state.product.ons, ['serving', 'kcal', 'protein']) && 'serving' in c) {
    const ons = state.product.ons;
    pr.ons = { serving: pick(ons.serving, c.serving), kcal: pick(ons.kcal, c.kcal), protein: pick(ons.protein, c.protein), unit: c.unit };
  }
  return { ...state.values, product: pr };
}

function renderResult() {
  const r = recommend(engineInput());
  state.invalid = r.missing?.filter((x) => x.card === 0).map((x) => x.field) ?? [];
  const box = $('#result');
  const actions = `<div class="actions"><button type="button" class="btn" data-act="edit">${esc(t('edit'))}</button><div class="right"><button type="button" class="btn" data-act="new">${esc(t('newPatient'))}</button><button type="button" class="btn primary" data-act="print">${esc(t('print'))}</button></div></div>`;
  if (r.blocked) {
    let message = L(r.blocked);
    if (r.invalid?.length) {
      const labels = new Map(STEPS.flatMap((s, i) => s.fields(state.values).filter((f) => f.type === 'num').map((f) => [f.key, `${L(f.label)} (${i + 1}. ${L(['adım', 'step'])})`])));
      const names = r.invalid.map((k) => labels.get(k) ?? k).join(', ');
      message = L([`Geçersiz değer: ${names}. Değeri düzeltin; geçersiz değerle hesap yapılmaz.`, `Invalid value: ${names}. Correct it; no calculation is made with an invalid value.`]);
    }
    box.innerHTML = `<section class="card summary"><h2>${esc(t('blocked'))}</h2><p class="big">${esc(message)}</p>${actions}</section>`;
    return;
  }
  if (!r.plan) {
    box.innerHTML = `<section class="card summary"><span class="route">${esc(L(ROUTE_TEXT[r.route.kind] ?? ['', '']))}</span><h2>${esc(t('todayPlan'))}</h2><p class="big">${esc(L(['Miktar hesaplamak için kilo ya da boy gerekli.', 'Weight or height is needed to calculate amounts.']))}</p></section>${missingHtml(r)}${actions}`;
    return;
  }
  box.innerHTML = summaryHtml(r) + suppHtml(r) + tableHtml(r) + missingHtml(r) + notesHtml(r) + detailsHtml(r) + sourcesHtml(r) + actions;
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
  const target = focusKey ? document.getElementById(`f-${focusKey}`) || document.querySelector(`[data-seg="${focusKey}"]`) || document.querySelector(`[data-check="${focusKey}"]`) : document.querySelector('#cards input, #cards button[data-seg]');
  window.scrollTo({ top: 0 });
  target?.focus({ preventScroll: false });
}

function setLabelValue(path, value) {
  const [group, key] = path.split('.');
  state.product[group] = { ...(state.product[group] ?? {}), [key]: value };
  if (group === 'ons') state.product.ons.unit = state.product.ons.unit ?? (state.values.swallow === 'modified' ? 'g' : 'mL');
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
    state.values = { setting: 'icu', age: 67, sex: 'male', heightCm: 172, weightKg: 78, icuDay: 3, swallow: 'unsafe', gi: 'ok', shock: 'none', feeding: 'ongoing', kidney: 'normal', bowel: 'normal', stroke: true, usualWeightKg: 81, lowIntakeDays: 2, lowElectrolytes: 'no', alcohol: 'no', riskDrugs: 'no', propofolMlH: 8 };
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
  if (act === 'next') go(state.step + 1);
  else if (act === 'back') go(state.step - 1);
  else if (act === 'show') go('result');
  else if (act === 'edit') go(state.step);
  else if (act === 'print') window.print();
  else if (act === 'new') { state.values = { setting: state.values.setting ?? 'icu' }; state.product = {}; state.openDetails.clear(); go(1); }
});

document.addEventListener('change', (e) => {
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
}, true);

document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && e.target.matches('#cards input[data-key]')) {
    e.preventDefault();
    const inputs = [...document.querySelectorAll('#cards input[data-key]')];
    const i = inputs.indexOf(e.target);
    if (i < inputs.length - 1) inputs[i + 1].focus(); else go(state.step < STEPS.length ? state.step + 1 : 'result');
  }
});

render();
