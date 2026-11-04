/** Adult functional criteria and clinician-entered swallowing records.
 * Display support only: no diagnosis, feeding clearance, texture prescription,
 * water challenge, supplement choice, or change to the clinical engine.
 */
const L = (en, tr) => ({ en, tr });
const present = (x) => x !== null && x !== undefined && x !== "";
const text = (x) => typeof x === "string" && x.trim().length > 0;
const number = (x, min, max, integer = false, positive = false) =>
  typeof x === "number" && Number.isFinite(x) && x >= min && x <= max &&
  (!integer || Number.isInteger(x)) && (!positive || x > 0) ? x : null;
const dateValid = (value) => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return year > 0 && month >= 1 && month <= 12 && day >= 1 && day <= days[month - 1];
};
const recordReady = (input, measures, prefix) =>
  measures[`${prefix}Confirmed`] === true && text(measures[`${prefix}Source`]) &&
  dateValid(measures[`${prefix}Date`]) && dateValid(input.visitDate) &&
  measures[`${prefix}Date`] <= input.visitDate;
const orKnown = (values) => values.includes(true) ? true : values.includes(false) ? false : null;
const result = (id, title, status, summary, details, values, sourceIds) =>
  ({ id, title, status, summary, details, values, sourceIds });

export const functionSources = [
  {
    id: "ewgsop2-2019", year: 2019, doi: "10.1093/ageing/afy169",
    title: L("EWGSOP2: revised European sarcopenia consensus", "EWGSOP2: güncellenmiş Avrupa sarkopeni uzlaşısı"),
    url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC6322506/",
    access: L("Original indexed text; direct PMC requests intermittently blocked", "Özgün dizin metni; doğrudan PMC istekleri aralıklı engellendi"),
    note: L("European reference thresholds; clinical and measurement context remains essential.", "Avrupa referans eşikleri; klinik ve ölçüm bağlamı gereklidir."),
  },
  {
    id: "ewgsop2-correction-2019", year: 2019, doi: "10.1093/ageing/afz046",
    title: L("EWGSOP2 correction: female ASM/height² threshold", "EWGSOP2 düzeltmesi: kadın ASM/boy² eşiği"),
    url: "https://academic.oup.com/ageing/article/48/4/601/5488778",
    access: L("Official publisher correction read", "Resmî yayıncı düzeltmesi okundu"),
    note: L("The corrected female threshold is <5.5 kg/m², not <6.0.", "Düzeltilmiş kadın eşiği <5,5 kg/m²'dir; <6,0 değildir."),
  },
  {
    id: "eat10-original-2008", year: 2008, doi: "10.1177/000348940811701210",
    title: L("Original EAT-10 validation", "Özgün EAT-10 validasyonu"),
    url: "https://pubmed.ncbi.nlm.nih.gov/19140539/",
    access: L("Original PubMed indexed abstract read; publisher access timed out", "Özgün PubMed dizin özeti okundu; yayıncı erişimi zaman aşımına uğradı"),
    note: L("Symptom score ≥3 is abnormal; this is not an aspiration clearance test. Questionnaire wording is not reproduced.", "Belirti puanı ≥3 anormaldir; aspirasyon açısından güvenlik testi değildir. Anket maddeleri çoğaltılmaz."),
  },
  {
    id: "eat10-turkish-2016", year: 2016, doi: "10.1007/s00455-016-9723-9",
    title: L("Validation of the Turkish EAT-10", "Türkçe EAT-10 validasyonu"),
    url: "https://pubmed.ncbi.nlm.nih.gov/27405421/",
    access: L("Original indexed abstract and author institution record read", "Özgün dizin özeti ve yazar kurumu kaydı okundu"),
    note: L("Use the validated original language form, not an app-generated translation.", "Uygulamanın çevirdiği anket yerine valide özgün dil formunu kullanın."),
  },
  {
    id: "fois-original-2005", year: 2005, doi: "10.1016/j.apmr.2004.11.049",
    title: L("Original FOIS validation in stroke", "İnmede özgün FOIS validasyonu"),
    url: "https://pubmed.ncbi.nlm.nih.gov/16084801/",
    access: L("Original indexed abstract read", "Özgün dizin özeti okundu"),
    note: L("Seven-level functional intake record, not a swallowing physiology or aspiration test.", "Yedi düzeyli işlevsel alım kaydıdır; yutma fizyolojisi veya aspirasyon testi değildir."),
  },
  {
    id: "iddsi-framework-2026", year: 2026, doi: null,
    title: L("IDDSI official framework: version 2.2", "IDDSI resmî çerçevesi: sürüm 2.2"),
    url: "https://www.iddsi.org/resources/framework-documents",
    access: L("Official indexed framework/version page read; direct page returned 403", "Resmî dizin çerçeve/sürüm sayfası okundu; doğrudan sayfa 403 döndürdü"),
    note: L("Framework definitions 2.2, testing methods 2.0; clinician records food and fluid levels separately.", "Çerçeve tanımları 2.2, test yöntemleri 2.0; gıda ve sıvı düzeyleri klinisyen tarafından ayrı kaydedilir."),
  },
  {
    id: "ueg-esnm-dysphagia-2025", year: 2025, doi: "10.1002/ueg2.70062",
    title: L("UEG/ESNM clinical dysphagia recommendations", "UEG/ESNM klinik disfaji önerileri"),
    url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC12269739/",
    access: L("Original indexed recommendations read; direct PMC requests encountered a bot check", "Özgün dizin önerileri okundu; doğrudan PMC isteklerinde bot kontrolü görüldü"),
    note: L("Bedside findings alone do not fully characterize oropharyngeal dysfunction; instrumental assessment requires clinical suitability.", "Yatak başı bulgular orofaringiyal bozukluğu tek başına tam tanımlamaz; enstrümantal inceleme klinik uygunluk gerektirir."),
  },
  {
    id: "digest-iddsi-mapping-2026", year: 2026, doi: "10.1007/s00455-026-10943-6",
    title: L("2026 DIGEST–IDDSI terminology mapping", "2026 DIGEST–IDDSI terminoloji eşleştirmesi"),
    url: "https://link.springer.com/article/10.1007/s00455-026-10943-6",
    access: L("Original publisher full text read", "Özgün yayıncı tam metni okundu"),
    note: L("Terminology commentary, not a newly validated screening scale or automatic texture-selection algorithm.", "Terminoloji yorumudur; yeni valide tarama ölçeği veya otomatik kıvam seçme algoritması değildir."),
  },
];

function sarcopenia(input, measures, adult) {
  const grip = number(measures.gripStrength, 0, 200);
  const chair = number(measures.chairRiseSeconds, 0, 600, false, true);
  const asm = number(measures.appendicularMass, 0, 150, false, true);
  const gait = number(measures.gaitSpeed, 0, 5, false, true);
  const sppb = number(measures.sppb, 0, 12, true);
  const height = number(input.height, 0, 300, false, true);
  const sexKnown = input.sex === "male" || input.sex === "female";
  const male = input.sex === "male";
  const errors = [
    ["gripStrength", grip], ["chairRiseSeconds", chair], ["appendicularMass", asm],
    ["gaitSpeed", gait], ["sppb", sppb],
  ].filter(([key, value]) => present(measures[key]) && value === null).map(([key]) => key);
  const ready = recordReady(input, measures, "function");
  const lowGrip = measures.strengthValid === true && grip !== null && sexKnown ? grip < (male ? 27 : 16) : null;
  const lowChair = measures.strengthValid === true && chair !== null ? chair > 15 : null;
  const lowStrength = orKnown([lowGrip, lowChair]);
  const massReady = measures.muscleValid === true && input.fluidWeight === "reliable" && sexKnown;
  const asmHeight2 = asm !== null && height !== null ? asm / (height / 100) ** 2 : null;
  const lowAbsolute = massReady && asm !== null ? asm < (male ? 20 : 15) : null;
  const lowIndexed = massReady && asmHeight2 !== null ? asmHeight2 < (male ? 7 : 5.5) : null;
  const lowMass = orKnown([lowAbsolute, lowIndexed]);
  const lowGait = measures.performanceValid === true && gait !== null ? gait <= 0.8 : null;
  const lowSppb = measures.performanceValid === true && sppb !== null ? sppb <= 8 : null;
  const lowPerformance = orKnown([lowGait, lowSppb]);
  const confounded = input.context === "icu" || measures.sarcopeniaConfounded === true;
  const values = {
    gripStrength: grip, chairRiseSeconds: chair, appendicularMass: asm, asmHeight2,
    gaitSpeed: gait, sppb, lowGrip, lowChair, lowStrength, lowMassByAbsolute: lowAbsolute,
    lowMassByIndexed: lowIndexed, lowMass, lowGait, lowSppb, lowPerformance,
    candidatePattern: ready && adult && !confounded && measures.sarcopeniaConfounded === false && !errors.length && lowStrength === true && lowMass === true,
    severeCandidatePattern: ready && adult && !confounded && measures.sarcopeniaConfounded === false && !errors.length && lowStrength === true && lowMass === true && lowPerformance === true,
    assessmentReady: ready, confounded, errors,
  };
  const details = [
    L("Use standardized measurements and population-appropriate references; ASM is not total lean mass or FFMI.", "Standart ölçüm ve popülasyona uygun referans kullanın; ASM, toplam yağsız kitle veya FFMI değildir."),
    L("Five chair rises must follow the standardized protocol. Neurological weakness, pain, sedation and fluid shifts can confound interpretation.", "Beş sandalye kalkışı standart protokole uymalıdır. Nörolojik güçsüzlük, ağrı, sedasyon ve sıvı değişimleri yorumu etkileyebilir."),
  ];
  let status = "incomplete";
  let summary = L("Valid adult measurements, source/date and confirmation are required.", "Geçerli erişkin ölçümleri, kaynak/tarih ve doğrulama gereklidir.");
  if (!adult) details.push(L("Adult age must be known; pediatric criteria are outside this module.", "Erişkin yaş bilinmelidir; pediatrik ölçütler bu modülün dışındadır."));
  if (errors.length) details.push(L(`Correct invalid measurements: ${errors.join(", ")}.`, `Geçersiz ölçümleri düzeltin: ${errors.join(", ")}.`));
  if (adult && ready && !errors.length && lowStrength !== null && measures.sarcopeniaConfounded === false) {
    if (confounded) {
      status = "review";
      summary = L("ICU/acute functional impairment requires specialist interpretation; no primary sarcopenia diagnosis is inferred.", "YBÜ/akut işlev kaybı uzman yorumu gerektirir; primer sarkopeni tanısı çıkarılmaz.");
    } else if (lowStrength === false) {
      status = "not_met";
      summary = L("The entered valid strength tests do not meet the low-strength threshold; this does not exclude all muscle disease.", "Girilen geçerli güç testleri düşük güç eşiğini karşılamıyor; bu tüm kas hastalıklarını dışlamaz.");
    } else if (lowMass === true) {
      status = "met";
      summary = lowPerformance === true
        ? L("Candidate pattern of low strength, low muscle quantity and low performance; clinical confirmation is required.", "Düşük güç, düşük kas miktarı ve düşük performans aday örüntüsü; klinik doğrulama gerekir.")
        : L("Candidate pattern of low strength and low muscle quantity; clinical confirmation is required.", "Düşük güç ve düşük kas miktarı aday örüntüsü; klinik doğrulama gerekir.");
    } else {
      status = "review";
      summary = L("Low-strength candidate finding; confirm muscle quantity/quality and investigate competing causes.", "Düşük güç aday bulgusu; kas miktarı/kalitesini doğrulayın ve diğer nedenleri değerlendirin.");
    }
  } else if (adult && ready && !errors.length && measures.sarcopeniaConfounded === true && [grip, chair, asm, gait, sppb].some((x) => x !== null)) {
    status = "review";
    summary = L("Confounded measurements are recorded for review; no sarcopenia classification is assigned.", "Karıştırıcılardan etkilenen ölçümler inceleme için kaydedilir; sarkopeni sınıflaması yapılmaz.");
  }
  if (lowStrength === true && lowMass === true && lowPerformance === null)
    details.push(L("Performance severity remains unknown; missing tests are not normal results.", "Performans şiddeti bilinmiyor; eksik testler normal sonuç değildir."));
  if (asm !== null && input.fluidWeight !== "reliable")
    details.push(L("Fluid/measurement reliability must be resolved before using muscle-quantity thresholds.", "Kas miktarı eşikleri kullanılmadan önce sıvı/ölçüm güvenilirliği netleştirilmelidir."));
  return result("ewgsop2", L("EWGSOP2 functional candidate assessment", "EWGSOP2 işlevsel aday değerlendirmesi"), status, summary, details, values,
    ["ewgsop2-2019", "ewgsop2-correction-2019"]);
}

function eatScore(measures) {
  const total = number(measures.eat10Total, 0, 40, true);
  const totalInvalid = present(measures.eat10Total) && total === null;
  const rawItems = measures.eat10Items;
  const itemsPresent = Array.isArray(rawItems) && rawItems.some(present);
  const suppliedInvalidArray = present(rawItems) && !Array.isArray(rawItems);
  const allItems = Array.isArray(rawItems) && rawItems.length === 10 && rawItems.every((x) => number(x, 0, 4, true) !== null);
  const calculatedTotal = allItems ? rawItems.reduce((sum, x) => sum + x, 0) : null;
  const partialOrInvalid = suppliedInvalidArray || (itemsPresent && !allItems) || (Array.isArray(rawItems) && rawItems.length !== 10);
  const conflict = total !== null && calculatedTotal !== null && total !== calculatedTotal;
  const score = totalInvalid || partialOrInvalid || conflict ? null : total ?? calculatedTotal;
  return { score, enteredTotal: total, calculatedTotal, conflict, partialOrInvalid, invalid: totalInvalid || partialOrInvalid };
}

/**
 * measures fields:
 * gripStrength, chairRiseSeconds (5 rises), appendicularMass (ASM kg), gaitSpeed,
 * sppb, strengthValid/muscleValid/performanceValid, sarcopeniaConfounded,
 * functionSource/functionDate/functionConfirmed,
 * eat10Total or numeric eat10Items (no copyrighted item wording), fois,
 * iddsiFood (3–7), iddsiFluid (0–4), dysphagiaAssessment (none/bedside/FEES/VFSS),
 * dysphagiaSource/dysphagiaDate/dysphagiaConfirmed,
 * dysphagiaUnsafeSigns and impairedAlertness.
 * input supplies adult age, sex, height cm, fluidWeight, context, swallow,
 * route, and visitDate. No value is coerced from an empty/string input.
 */
export function evaluateFunction(input = {}, measures = {}) {
  const d = input && typeof input === "object" && !Array.isArray(input) ? input : {};
  const m = measures && typeof measures === "object" && !Array.isArray(measures) ? measures : {};
  const age = number(d.age, 0, 130, false, true);
  const adult = age !== null && age >= 18;
  const swallowingRecord = adult && recordReady(d, m, "dysphagia");
  const assessmentKnown = ["bedside", "FEES", "VFSS"].includes(m.dysphagiaAssessment);
  const assessmentReady = swallowingRecord && assessmentKnown;
  const score = eatScore(m);
  const screenPositive = score.score === null ? null : score.score >= 3;
  const eatDetails = [
    L("Use an original validated language form. EAT-10 is a symptom record; a low score cannot exclude silent aspiration or authorize oral feeding.", "Özgün valide dil formunu kullanın. EAT-10 belirti kaydıdır; düşük puan sessiz aspirasyonu dışlamaz veya oral beslenmeye izin vermez."),
  ];
  let eatStatus = "incomplete";
  let eatSummary = L("Enter a verified total from the validated form; unanswered items are not scored as zero.", "Valide formdaki doğrulanmış toplamı girin; yanıtsız maddeler sıfır puanlanmaz.");
  if (score.conflict) {
    eatStatus = "review";
    eatSummary = L("Entered total and item sum disagree; reconcile the original form before interpretation.", "Girilen toplam ile madde toplamı uyumsuz; yorumlamadan önce özgün formla uzlaştırın.");
  } else if (score.score !== null && swallowingRecord) {
    eatStatus = screenPositive ? "met" : "not_met";
    eatSummary = screenPositive
      ? L("EAT-10 symptom threshold is met (≥3); consider clinical swallowing assessment, without diagnosing aspiration.", "EAT-10 belirti eşiği karşılandı (≥3); aspirasyon tanısı koymadan klinik yutma değerlendirmesini düşünün.")
      : L("The EAT-10 symptom threshold is not met; aspiration safety is not established.", "EAT-10 belirti eşiği karşılanmadı; aspirasyon açısından güvenlik belirlenmiş değildir.");
    if (m.impairedAlertness === true) {
      eatStatus = "review";
      eatDetails.push(L("Impaired alertness can invalidate self-report; verify whether the original assessment was usable.", "Uyanıklık bozukluğu öz bildirimi geçersiz kılabilir; özgün değerlendirmenin kullanılabilirliğini doğrulayın."));
    }
  }
  if (score.invalid) eatDetails.push(L("Use exactly ten integer item scores 0–4 or a valid integer total 0–40; no partial score is calculated.", "Tam on adet 0–4 tam sayı madde puanı veya geçerli 0–40 tam sayı toplam kullanın; kısmi puan hesaplanmaz."));
  const eat = result("eat10", L("EAT-10 symptom screen", "EAT-10 belirti taraması"), eatStatus, eatSummary, eatDetails,
    { ...score, screenPositive, assessmentReady: swallowingRecord, questionnaireItemsReproduced: false },
    ["eat10-original-2008", "eat10-turkish-2016"]);

  const foisLevel = number(m.fois, 1, 7, true);
  const foisInvalid = present(m.fois) && foisLevel === null;
  const fois = result("fois", L("FOIS: clinician-recorded intake function", "FOIS: klinisyen tarafından kaydedilen alım işlevi"),
    foisLevel !== null && assessmentReady ? "review" : "incomplete",
    foisLevel !== null && assessmentReady
      ? L(`Recorded FOIS level ${foisLevel}; this describes intake function and does not prescribe a feeding route.`, `Kaydedilmiş FOIS düzeyi ${foisLevel}; alım işlevini tanımlar, beslenme yolu reçetelemez.`)
      : L("A clinician-assigned level 1–7 and verified assessment are required.", "Klinisyenin belirlediği 1–7 düzeyi ve doğrulanmış değerlendirme gereklidir."),
    [L("FOIS does not establish airway protection; use the clinician's original scale and examination.", "FOIS hava yolu korunmasını belirlemez; klinisyenin özgün ölçeği ve muayenesi kullanılır.")],
    { level: foisLevel, invalid: foisInvalid, assessmentReady, oralRecordConflict: foisLevel === 1 && d.route === "oral" },
    ["fois-original-2005", "ueg-esnm-dysphagia-2025"]);

  const food = number(m.iddsiFood, 3, 7, true);
  const fluid = number(m.iddsiFluid, 0, 4, true);
  const iddsiInvalid = (present(m.iddsiFood) && food === null) || (present(m.iddsiFluid) && fluid === null);
  const iddsi = result("iddsi", L("IDDSI: clinician-recorded food/fluid levels", "IDDSI: klinisyenin kaydettiği gıda/sıvı düzeyleri"),
    !iddsiInvalid && (food !== null || fluid !== null) && assessmentReady ? "review" : "incomplete",
    !iddsiInvalid && (food !== null || fluid !== null) && assessmentReady
      ? L(`Recorded IDDSI food: ${food ?? 'not assessed'}; fluid: ${fluid ?? 'not assessed'}. Levels remain clinician decisions; the app does not infer texture or verify product consistency.`, `Kaydedilen IDDSI gıda: ${food ?? 'değerlendirilmedi'}; sıvı: ${fluid ?? 'değerlendirilmedi'}. Düzeyler klinisyen kararıdır; uygulama kıvam çıkarımı veya ürün kıvamı doğrulaması yapmaz.`)
      : L("Record food (3–7) and/or fluid (0–4) separately from a verified assessment; missing levels remain unknown.", "Doğrulanmış değerlendirmeden gıda (3–7) ve/veya sıvı (0–4) düzeyini ayrı kaydedin; eksik düzey bilinmiyor olarak kalır."),
    [L("IDDSI standardizes descriptions and testing; it is not a dysphagia severity score or an automatic thickener recommendation.", "IDDSI tanımları ve testleri standartlaştırır; disfaji şiddet puanı veya otomatik kıvam artırıcı önerisi değildir.")],
    { food, fluid, invalid: iddsiInvalid, assessmentReady, frameworkVersion: "2.2", testingMethodsVersion: "2.0" },
    ["iddsi-framework-2026", "digest-iddsi-mapping-2026"]);

  const safetyReasons = [];
  if (m.impairedAlertness === true) safetyReasons.push("impaired_alertness");
  if (d.swallow === "unsafe") safetyReasons.push("unsafe_swallow");
  if (m.dysphagiaUnsafeSigns === true) safetyReasons.push("unsafe_signs");
  const hasUnsafeSwallow = safetyReasons.length > 0;
  const flagsKnown = typeof m.impairedAlertness === "boolean" && typeof m.dysphagiaUnsafeSigns === "boolean";
  const swallowKnown = d.swallow === "safe" || d.swallow === "unsafe";
  const safetyKnown = assessmentReady && flagsKnown && swallowKnown;
  let safetyStatus = hasUnsafeSwallow ? "review" : safetyKnown ? "not_met" : "incomplete";
  let safetySummary = hasUnsafeSwallow
    ? L("Unsafe signs or impaired alertness require clinical review; do not use an app-led water or food challenge.", "Güvensiz bulgu veya uyanıklık bozukluğu klinik inceleme gerektirir; uygulama yönlendirmeli su ya da gıda denemesi kullanmayın.")
    : L("Missing or unverified swallowing information cannot establish oral feeding safety.", "Eksik veya doğrulanmamış yutma bilgisi oral beslenme güvenliğini belirleyemez.");
  if (!hasUnsafeSwallow && safetyKnown) safetySummary = L("No explicit unsafe trigger is recorded; this output is not clearance for oral feeding.", "Açık güvensizlik tetikleyicisi kaydedilmedi; bu çıktı oral beslenme onayı değildir.");
  if (!hasUnsafeSwallow && screenPositive && swallowingRecord) {
    safetyStatus = "review";
    safetySummary = L("Symptoms warrant clinical swallowing review; EAT-10 alone does not establish aspiration or select a feeding route.", "Belirtiler klinik yutma incelemesi gerektirir; EAT-10 tek başına aspirasyon belirlemez veya beslenme yolu seçmez.");
  }
  if (!hasUnsafeSwallow && foisLevel === 1 && d.route === "oral" && assessmentReady) {
    safetyStatus = "review";
    safetySummary = L("The recorded FOIS level conflicts with the oral route; reconcile the clinician's record. No replacement route is selected automatically.", "Kaydedilen FOIS düzeyi oral yolla uyumsuz; klinisyen kaydını uzlaştırın. Yerine başka yol otomatik seçilmez.");
  }
  const safety = result("swallow-safety", L("Swallowing safety and assessment review", "Yutma güvenliği ve değerlendirme incelemesi"), safetyStatus, safetySummary,
    [
      L("FEES and VFSS provide complementary instrumental information when clinically indicated; selection requires specialist assessment.", "FEES ve VFSS klinik endikasyonda tamamlayıcı enstrümantal bilgi sağlar; seçim uzman değerlendirmesi gerektirir."),
      L("Impaired consciousness or poor cooperation requires suitability/stability assessment and may preclude FEES. Bedside findings alone cannot exclude silent aspiration.", "Bilinç bozukluğu veya yetersiz iş birliği uygunluk/stabilite değerlendirmesi gerektirir ve FEES'e engel olabilir. Yatak başı bulgular sessiz aspirasyonu tek başına dışlayamaz."),
    ],
    { hasUnsafeSwallow, safetyReasons, safetyKnown, assessmentReady, assessment: assessmentKnown ? m.dysphagiaAssessment : null,
      screenPositive, referralConsidered: hasUnsafeSwallow || screenPositive === true, waterChallengeOffered: false,
      oralRecordConflict: foisLevel === 1 && d.route === "oral" },
    ["ueg-esnm-dysphagia-2025", "eat10-original-2008"]);
  return [sarcopenia(d, m, adult), eat, fois, iddsi, safety];
}
