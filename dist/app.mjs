import { glutamineEvidence } from "./evidence-amino-glutamine.mjs";
import { leucineEvidence } from "./evidence-amino-leucine.mjs";
import { evidence2026 } from "./evidence-2026.mjs";
import { neuroEvidence2026 } from "./evidence-neuro-2026.mjs";
import { extraEvidence } from "./evidence-extra.mjs";
import { engineSha256, assessmentSha256 } from "./build-info.mjs";
import { dateValid, labDefs, parseCSV, normalizeRow } from "./import.mjs";
import { evaluate, VERSION } from "./engine.mjs";
import { evidence } from "./evidence.mjs";
import { indexEvidence } from "./evidence-indices.mjs";
import { initI18n, translate, getLocale, getNumberLocale } from "./i18n.mjs";
import { initExperience } from "./experience.mjs";
import { evidenceUpdate } from "./evidence-update-20261024.mjs";
import { metabolicEvidence } from "./evidence-metabolic-20261024.mjs";
import { lineageMarkup } from "./study-lineage.mjs";
import { EVIDENCE_CUTOFF, UI_VERSION } from "./config.mjs";
import { initClinicalWorkspace } from "./clinical-workspace.mjs";
import { additionalSources } from "./clinical-sources.mjs";
import { initFollowup } from "./followup-ui.mjs";
import { restoreDelivery, evaluateDelivery } from "./followup-engine.mjs";
import { enforceClinicalContext } from "./clinical-context.mjs";
import { buildCoreRuleProvenance } from "./core-rule-provenance.mjs";
import { coreRuleSourcesMarkup, coreRuleSourcesTitle } from "./core-provenance-ui.mjs";
import { initLabReferences } from "./lab-reference-ui.mjs";
import { evaluateReferenceProfile, restoreReferenceProfile } from "./lab-reference-ranges.mjs";
import { reportAppendixMarkup } from "./print-report.mjs";
import { createLocalRecordStore } from "./local-record-store.mjs";
import { initLocalRecordsUI } from "./local-records-ui.mjs";
import { initNavigationHelp } from "./navigation-help.mjs";
import { initStartGuide } from "./start-guide.mjs";
import { applyEditionText, editionText } from "./edition.mjs";
import { initAboutLicenses } from "./about-licenses.mjs";
// Copyright and citation shown in "About & licenses" (AGPL-3.0-only; see legal/NOTICE.txt).
const ABOUT_METADATA = {
  copyrightHolder: "Gökay Duman",
  authors: ["Dr. Gökay Duman · Neurology"],
  year: 2026,
  citation: `Duman G. NutriClinic: clinical nutrition workspace [software]. Version ${UI_VERSION}. 2026. Available from: https://sahnoroloji.org/nutriclinic/`,
};
const $ = (id) => document.getElementById(id);
const esc = (v) =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const fmt = (n, d = 1) =>
  Number.isFinite(n)
    ? n.toLocaleString(getNumberLocale(), { maximumFractionDigits: d })
    : "—";
const N = (id, label, unit, min, max, hint = "") => ({
  id,
  label,
  unit,
  min,
  max,
  hint,
  type: "number",
});
const S = (id, label, options, hint = "") => ({
  id,
  label,
  options,
  hint,
  type: "select",
});
const T = (id, label, type = "text", hint = "") => ({ id, label, type, hint });
const yesno = [
  ["no", "Hayır"],
  ["yes", "Evet"],
];
const groups = {
  patientForm: [
    T("studyId", "Kimliksiz çalışma kodu"),
    T("visitDate", "Değerlendirme tarihi", "date"),
    N("age", "Yaş", "yıl", 18, 120),
    S("sex", "Kaydedilen cinsiyet", [
      ["female", "Kadın"],
      ["male", "Erkek"],
      ["other", "Diğer / belirtilmedi"],
    ]),
    N("height", "Boy", "cm", 100, 230),
    N("weight", "Değerlendirme ağırlığı", "kg", 20, 350),
    N("usualWeight", "Olağan ağırlık", "kg", 20, 350),
    N(
      "lossMonths",
      "Kayıp değerlendirme dönemi",
      "ay",
      0.1,
      60,
      "İstemsiz kaybın gerçekleştiği dönem",
    ),
    S("fluidWeight", "Ağırlık güvenilirliği", [
      ["reliable", "Kuru / güvenilir ağırlık"],
      ["unreliable", "Ödem / sıvı yükü / belirsiz"],
    ]),
    S("pregnant", "Gebelik / emzirme", yesno),
  ],
  clinicalForm: [
    S("context", "Bakım ortamı", [
      ["ward", "Servis"],
      ["icu", "Yoğun bakım"],
    ]),
    S(
      "phase",
      "Klinik faz",
      [
        ["early", "Erken akut"],
        ["late", "Geç akut"],
        ["recovery", "İyileşme / rehabilitasyon"],
      ],
      "Gün sayısından otomatik çıkarılmaz",
    ),
    N("icuDay", "YBÜ günü", "gün", 1, 365),
    N(
      "norepinephrineEquivalent",
      "Noradrenalin eşdeğeri · gözlem",
      "µg/kg/dk",
      0,
      10,
      "Doğrulanmış eşdeğer doz; bu sürüm dönüştürmez",
    ),
    S("hemodynamics", "Hemodinami", [
      ["stable", "Stabil / perfüzyon yeterli"],
      ["unstable", "Kontrolsüz şok / yetersiz perfüzyon"],
    ]),
    S("renal", "Böbrek bağlamı", [
      ["none", "AKI / CKD / RRT yok"],
      ["aki", "Akut böbrek hasarı"],
      ["ckd", "Kronik böbrek hastalığı"],
      ["rrt", "Renal replasman tedavisi"],
    ]),
    S("gi", "Gastrointestinal uygunluk", [
      ["functional", "Fonksiyonel / EN için engel yok"],
      ["contraindicated", "İskemi / ileus / kanama / diğer engel"],
    ]),
    S("swallow", "Yutma değerlendirmesi", [
      ["safe", "Değerlendirilmiş, oral alım güvenli"],
      ["unsafe", "Güvenli değil / değerlendirme gerekli"],
    ]),
    S("route", "Planlanan beslenme yolu", [
      ["oral", "Oral beslenme desteği"],
      ["tube", "Enteral tüp"],
    ]),
    S("electrolytes", "K / P / Mg başlangıç değerlendirmesi", [
      ["normal", "Değerlendirildi; düşüklük yok"],
      ["low", "Bir veya daha fazla düşük"],
    ]),
    S(
      "refeedingHistory",
      "Alkol / NICE ilişkili ilaç öyküsü",
      yesno,
      "İnsülin, kemoterapi, antasit veya diüretik dahil",
    ),
  ],
  intakeForm: [
    N("usualIntake", "Olağan alıma göre son hafta", "%", 0, 200),
    N("reducedDays", "Azalmış alım süresi", "gün", 0, 365),
    N("negligibleDays", "Yok / ihmal edilebilir alım", "gün", 0, 180),
    S(
      "intakeCriterion",
      "GLIM 2026 alım / absorpsiyon ölçütü",
      yesno,
      "≤%50 olağan alım / son hafta; >2 hafta azalma veya ağır beslenme etkili semptom",
    ),
    S("muscle", "Kas kitlesi değerlendirmesi", [
      ["normal", "Ölçüldü; düşük değil"],
      ["low", "Valide yöntemle düşük"],
    ]),
    S("inflammation", "Klinik inflamasyon / hastalık yükü", yesno),
  ],
  labForm: [
    T("labDate", "Kan örneği tarihi", "date"),
    N("albumin", "Albümin", "g/L", 5, 70, "g/dL × 10 = g/L"),
    N("neutrophils", "Mutlak nötrofil", "10⁹/L", 0, 100),
    N("lymphocytes", "Mutlak lenfosit", "10⁹/L", 0, 100),
    N("crp", "CRP", "mg/L", 0, 1000),
    N(
      "lactate",
      "Laktat · araştırma gözlemi",
      "mmol/L",
      0.1,
      30,
      "Tek değerden beslenme toleransı çıkarılmaz",
    ),
    N(
      "creatinine",
      "Kreatinin · araştırma gözlemi",
      "mg/dL",
      0.1,
      30,
      "Otomatik katabolizma / protein dozu üretmez",
    ),
    N("potassium", "Potasyum", "mmol/L", 0.5, 12),
    N("phosphate", "Fosfat", "mmol/L", 0.05, 8),
    N("magnesium", "Magnezyum", "mmol/L", 0.05, 6),
  ],
  nitrogenForm: [
    T("uunDate", "UUN örnek / toplama bitiş tarihi", "date", "İdrar raporundaki örnek tarihi; doğrulanmış toplama bitiş günüyle eşleşmeli"),
    N("uun", "İdrar üre azotu · 24 saat", "g N", 0, 100),
    N("actualProtein", "Aynı dönemde gerçek toplam protein", "g/24s", 0, 500),
    T("collectionStart", "İdrar toplama başlangıcı", "datetime-local"),
    T("collectionEnd", "İdrar toplama bitişi", "datetime-local"),
    N("urineVolume", "24 saatlik toplam idrar", "mL", 1, 20000),
  ],
  targetForm: [
    N("measuredEE", "İndirekt kalorimetri ölçümü", "kcal/gün", 300, 10000),
    N("kcalTarget", "Hekimin günlük enerji hedefi", "kcal", 100, 10000),
    N("proteinTarget", "Hekimin günlük protein hedefi", "g", 1, 500),
    N("otherKcal", "Diğer kaynaklardan enerji", "kcal", 0, 10000),
    N("otherProtein", "Diğer kaynaklardan protein", "g", 0, 500),
  ],
  formulaForm: [
    T("formulaName", "Ürün / mama adı"),
    T("formulaSource", "Üretici etiketi / kaynak sürümü"),
    N("formulaEnergy", "Enerji yoğunluğu", "kcal/mL", 0.1, 3),
    N("formulaProtein", "Protein", "g/100mL", 0.1, 30),
    N("formulaWater", "Serbest su", "mL/100mL", 0, 100),
    N(
      "formulaVolumeLimit",
      "Mama için günlük hacim sınırı",
      "mL",
      1,
      10000,
      "Diğer sıvıları içermez",
    ),
    N(
      "hours",
      "Etkin besleme süresi",
      "saat/gün",
      1,
      24,
      "Tüp beslemede gerçek çalışılan süre",
    ),
    N(
      "servingVolume",
      "Oral porsiyon hacmi",
      "mL",
      10,
      1000,
      "Günlük hacim porsiyona bölünür; tam şişeye yuvarlanmaz",
    ),
  ],
};
const checks = {
  labChecks: [
    [
      "labsConfirmed",
      "Örnek tarihi, ölçümler ve birimleri kaynak belgeyle doğruladım.",
    ],
  ],
  nitrogenChecks: [
    [
      "collectionComplete",
      "Toplama başlangıç/bitişini, 24 saatlik süreyi ve hacmi doğruladım; idrar eksiksiz toplandı.",
    ],
    [
      "collectionMatched",
      "UUN ile gerçek oral + enteral + parenteral protein toplamı aynı 24 saate ait.",
    ],
    [
      "extraLosses",
      "Yanık, fistül, dren, ishal veya diğer önemli ek azot kaybı var.",
    ],
  ],
  planChecks: [
    [
      "formulaVerified",
      "Üretici bileşimini, ürünün hastaya uygunluğunu, alerjenleri, elektrolitleri ve ilaç etkileşimlerini doğruladım.",
    ],
    [
      "clinicianConfirmed",
      "Enerji / protein hedeflerini ve beslenme yolunu hekim olarak değerlendirdim.",
    ],
  ],
};
const fields = Object.values(groups).flat();
const bools = [
  ...Object.values(checks)
    .flat()
    .map((x) => x[0]),
  "screenPositive",
];

const today = () =>
  new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Istanbul" });
const blank = () =>
  Object.fromEntries([
    ...fields.map((f) => [f.id, f.type === "number" ? null : ""]),
    ...bools.map((k) => [k, false]),
    ["demo", false],
    ["inputErrors", []],
    ["visitDate", today()],
  ]);
const previousDay = () => {
  const d = new Date(today() + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
};
const demo = () => ({
  ...blank(),
  demo: true,
  studyId: "DEMO-001",
  age: 64,
  sex: "male",
  height: 172,
  weight: 68,
  usualWeight: 75,
  lossMonths: 3,
  fluidWeight: "reliable",
  pregnant: "no",
  context: "ward",
  phase: "recovery",
  hemodynamics: "stable",
  renal: "none",
  gi: "functional",
  swallow: "safe",
  route: "oral",
  electrolytes: "normal",
  refeedingHistory: "no",
  usualIntake: 50,
  reducedDays: 14,
  negligibleDays: 0,
  intakeCriterion: "yes",
  muscle: "low",
  inflammation: "yes",
  screenPositive: true,
  labDate: today(),
  albumin: 31,
  neutrophils: 7.2,
  lymphocytes: 1.3,
  crp: 28,
  potassium: 4.1,
  phosphate: 1.05,
  magnesium: 0.82,
  labsConfirmed: true,
  uun: 13,
  uunDate: today(),
  actualProtein: 70,
  collectionStart: previousDay() + "T08:00",
  collectionEnd: today() + "T08:00",
  urineVolume: 1600,
  collectionComplete: true,
  collectionMatched: true,
  kcalTarget: 2000,
  proteinTarget: 88,
  otherKcal: 1100,
  otherProtein: 40,
  formulaName: "Sentetik örnek bileşim · klinik ürün değildir",
  formulaSource: "Arayüz örneği",
  formulaEnergy: 1.5,
  formulaProtein: 7.5,
  formulaWater: 78,
  formulaVolumeLimit: 1000,
  hours: 24,
  servingVolume: 200,
  formulaVerified: true,
  clinicianConfirmed: true,
});
let state = demo(),
  result,
  visits = [],
  importedComparisons = [],
  view = "assessment",
  importRows = [],
  sourceInfo = [],
  experience = null,
  navigationHelp = null,
  startGuide = null,
  workspace = null,
  followup = null,
  clinicReferences = null,
  localStore = null,
  localRecordsUI = null,
  restoringLocal = false,
  draftId = crypto.randomUUID(),
  localRecoveryGeneration = 0,
  caseSwitching = false;
function markLocalChanged(){if(!restoringLocal)localStore?.changed();}
async function saveBeforeSwitch(){
  if(!localStore)return true;
  const saved=await localStore.flush();
  if(!saved.ok){toast(getLocale()==='tr'?editionText('Önceki girdiler diske kaydedilemedi. Sekmeyi açık tutun ve kurtarma dosyasını indirin.','Önceki girdiler sunucuya kaydedilemedi. Sekmeyi açık tutun ve kurtarma dosyasını indirin.'):'Previous entries could not be saved. Keep this tab open and download recovery.');return false;}
  return true;
}
async function switchCurrentCase(action){
  if(caseSwitching)return;
  caseSwitching=true;
  try{if(!await saveBeforeSwitch())return;localRecoveryGeneration++;action();markLocalChanged();await localStore?.flush();}
  finally{caseSwitching=false;}
}
let labImportGeneration = 0,
  researchImportGeneration = 0;
const names = {
  criteria: ['Beslenme kriterleri','Ölçütleri, kendi klinik bağlamında değerlendirin.','Kriter, işlev ve tarama bulgularını gözden geçirin.'],
  dysphagia: ['Disfaji değerlendirmesi','Yutma işlevi, belirtiler ve güvenliği ayrı inceleyin.','Yutma kaydını ve değerlendirmeyi tamamlayın.'],
  context: ['Hastalık ve metabolizma','Hastalık, organ yükü ve metabolik bulgular birlikte.','Kronik hastalık, organ işlevi ve metabolik ölçümleri değerlendirin.'],
  decisions: [
    "Klinik tercihler",
    "Yaklaşımları, kanıtıyla karşılaştırın.",
    "Hasta grubu, müdahale ve belirsizliği inceleyin; klinik yorumunuzun gerekçesini kaydedin.",
  ],
  assessment: [
    "Değerlendirme",
    "Hasta değerlendirmesi",
    "Klinik bağlam, antropometri ve laboratuvarı aynı değerlendirmede birleştirin.",
  ],
  labs: [
    "Kan sonuçları",
    "Ölçümlerden, izlenebilir verilere.",
    "Sonuçları yükleyin, birim ve tarihleri doğrulayın; eksik veriyi görünür tutun.",
  ],
  plan: [
    "Beslenme planı",
    "Hedefleri, günlük programa dönüştürün.",
    "Klinik güvenlik kontrolleri ve hekim hedefleriyle mama hacmini hesaplayın.",
  ],
  evidence: [
    "Kanıt kitaplığı",
    "Kararların arkasındaki kanıtları inceleyin.",
    "Kaynağın türünü, özgün metne erişimi ve uygulamadaki sınırlarını birlikte görün.",
  ],
  components: [
    "AA ve bileşen kanıtı",
    "Bileşenleri, kendi kanıtlarıyla değerlendirin.",
    "Amino asit, metabolit ve çok bileşenli ürün çalışmalarının hasta grubu ve klinik sonuçlarını karşılaştırın.",
  ],
  research: [
    "İzlem ve kayıtlar",
    "Günlük alımı izleyin, değerlendirmeyi kaydedin.",
    "Hedeflenen ve verilen beslenmeyi karşılaştırın; kayıtları gözden geçirin, kaydedin veya dışa aktarın.",
  ],
};
function fieldHTML(f) {
  const input =
    f.type === "select"
      ? `<select id="${f.id}"><option value="">Seçiniz / bilinmiyor</option>${f.options.map(([v, l]) => `<option value="${v}">${l}</option>`).join("")}</select>`
      : `<div class="input-wrap"><input id="${f.id}" type="${f.type}" ${f.type === "number" ? `min="${f.min}" max="${f.max}" step="any" inputmode="decimal"` : ""} ${f.type === "text" ? 'maxlength="160"' : ""} autocomplete="off">${f.unit ? `<span class="unit">${f.unit}</span>` : ""}</div>`;
  return `<div class="field"><label for="${f.id}">${f.label}</label>${input}${f.hint ? `<small>${f.hint}</small>` : ""}</div>`;
}
for (const [g, fs] of Object.entries(groups))
  $(g).innerHTML = fs.map(fieldHTML).join("");
for (const [g, cs] of Object.entries(checks))
  $(g).innerHTML = cs
    .map(
      ([id, text]) =>
        `<label class="check-field"><input id="${id}" type="checkbox"><span>${text}</span></label>`,
    )
    .join("");
$("intakeForm").insertAdjacentHTML(
  "beforeend",
  '<label class="check-field"><input id="screenPositive" type="checkbox"><span>Önceki valide beslenme taramasında risk pozitif; klinisyen doğruladı.</span></label>',
);
function fill() {
  for (const f of fields) $(f.id).value = state[f.id] ?? "";
  for (const k of bools) $(k).checked = !!state[k];
  render();
}
function toast(s) {
  $("toast").textContent = s;
  $("toast").classList.add("show");
  clearTimeout(toast.t);
  toast.t = setTimeout(() => $("toast").classList.remove("show"), 3500);
}
function go(v, updateHistory = true) {
  if (!names[v]) return;
  view = v;
  document.querySelector('.sidebar').classList.remove('menu-open');
  $("menuToggle").setAttribute('aria-expanded','false');
  document
    .querySelectorAll(".view")
    .forEach((e) => (e.hidden = e.id !== `view-${v}`));
  document.querySelectorAll(".nav").forEach((e) => {
    e.classList.toggle("active", e.dataset.view === v);
    e.setAttribute("aria-current", e.dataset.view === v ? "page" : "false");
  });
  [
    $("breadcrumb").textContent,
    $("pageTitle").textContent,
    $("pageSubtitle").textContent,
  ] = names[v];
  if (updateHistory && window.location.hash !== `#${v}`) history.pushState({view:v}, "", `#${v}`);
  experience?.refresh();
  startGuide?.refresh();
  navigationHelp?.hide();
  $("pageTitle").focus({preventScroll:true});
  window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? "auto" : "smooth" });
}
window.addEventListener('popstate', () => go(names[location.hash.slice(1)] ? location.hash.slice(1) : 'assessment', false));
$("menuToggle").addEventListener('click', () => {
  const open = document.querySelector('.sidebar').classList.toggle('menu-open');
  $("menuToggle").setAttribute('aria-expanded', String(open));
  if (open) window.scrollTo({top:0, behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'});
});
document
  .querySelectorAll("[data-view]")
  .forEach((e) => e.addEventListener("click", () => go(e.dataset.view)));
document
  .querySelectorAll("[data-goto]")
  .forEach((e) => e.addEventListener("click", () => go(e.dataset.goto)));
document.querySelector(".brand").addEventListener("click", (e) => {
  e.preventDefault();
  go("assessment");
});
for (const f of fields)
  $(f.id).addEventListener("input", (e) => {
    const raw = e.target.value;
    state[f.id] = f.type === "number" ? (raw !== "" ? Number(raw) : null) : raw;
    state.inputErrors = (state.inputErrors || []).filter((id) => id !== f.id);
    if (!e.target.validity.valid) state.inputErrors.push(f.id);
    invalidate(f.id);
    render();
  });
for (const k of bools)
  $(k).addEventListener("change", (e) => {
    state[k] = e.target.checked;
    if (["labsConfirmed", "collectionComplete", "collectionMatched"].includes(k)) clinicReferences?.resetApplicability();
    experience?.invalidateReviews();
    followup?.invalidate();
    render();
  });
function invalidate(k) {
  clinicReferences?.resetApplicability();
  experience?.invalidateReviews();
  workspace?.invalidateCore();
  followup?.invalidate();
  if (["studyId", "visitDate"].includes(k)) {
    resetImport();
    invalidateResearchImport();
    for (const id of ["labsConfirmed", "collectionComplete", "collectionMatched", "formulaVerified", "clinicianConfirmed"]) {
      state[id] = false;
      $(id).checked = false;
    }
  }
  if (k === "uunDate") {
    state.uun = null;
    state.inputErrors = (state.inputErrors || []).filter(id => id !== "uun");
    $("uun").value = "";
    sourceInfo = sourceInfo.filter(r => r.test !== "uun");
  } else if (k === "uun") {
    sourceInfo = [...sourceInfo.filter(r => r.test !== "uun"), {test:"uun",date:state.uunDate,unit:"g N/24h",method:"manual-entry",changedAt:new Date().toISOString()}];
  }
  if (k === "labDate") {
    for (const field of groups.labForm)
      if (field.type === "number") {
        state[field.id] = null;
        $(field.id).value = "";
      }
    sourceInfo = sourceInfo.filter((r) => r.test === "uun");
    state.inputErrors = (state.inputErrors || []).filter(id => !groups.labForm.some(f => f.type === "number" && f.id === id));
  } else if (groups.labForm.some((f) => f.id === k)) {
    sourceInfo = sourceInfo.filter((r) => r.test !== k);
    sourceInfo.push({
      test: k,
      date: state.labDate,
      method: "manual-entry",
      changedAt: new Date().toISOString(),
    });
  }
  if (!["studyId", "visitDate", "sex"].includes(k)) {
    if (
      ![
        "formulaName",
        "formulaSource",
        "formulaEnergy",
        "formulaProtein",
        "formulaWater",
        "formulaVolumeLimit",
        "servingVolume",
      ].includes(k)
    ) {
      state.clinicianConfirmed = false;
      $("clinicianConfirmed").checked = false;
    }
  }
  if (
    [
      "formulaName",
      "formulaSource",
      "formulaEnergy",
      "formulaProtein",
      "formulaWater",
    ].includes(k)
  ) {
    state.formulaVerified = false;
    $("formulaVerified").checked = false;
  }
  if (groups.labForm.some((f) => f.id === k)) {
    state.labsConfirmed = false;
    $("labsConfirmed").checked = false;
  }
  if (groups.nitrogenForm.some((f) => f.id === k)) {
    state.collectionComplete = false;
    state.collectionMatched = false;
    $("collectionComplete").checked = false;
    $("collectionMatched").checked = false;
  }
}
function displayValue(id) {
  const value = state[id];
  return state.demo && ["Sentetik örnek bileşim · klinik ürün değildir", "Arayüz örneği"].includes(value)
    ? translate(value) : value;
}
function render() {
  result = evaluate(state);
  if (workspace) result = enforceClinicalContext(result,workspace.context());
  if (state.demo) for (const id of ["formulaName", "formulaSource"]) $(id).value = displayValue(id);
  $("sideCase").textContent = state.studyId || translate("Çalışma kodu girilmedi");
  $("sideContext").textContent =
    `${state.context === "icu" ? "Yoğun bakım" : state.context === "ward" ? "Servis" : "Ortam seçilmedi"} · ${state.demo ? "Sentetik örnek" : "Oturum verisi"}`;
  $("modeNotice").innerHTML = state.demo
    ? '<span class="notice-icon">i</span><div><strong>Sentetik örnek olgu görüntüleniyor.</strong> Gerçek hasta verisi içermez. Hesaplamalar klinik doğrulama bekleyen araştırma yazılımına aittir.</div>'
    : `<span class="notice-icon">i</span><div data-no-i18n><strong>${getLocale()==='tr'?'Hekim denetimli değerlendirme':'Physician-supervised assessment'}</strong> ${getLocale()==='tr'?editionText('Girdiler bu bilgisayara otomatik kaydedilir; kayıt durumunu üstte kontrol edin. Yeniden açınca klinik onayları gözden geçirin.','Girdiler sunucuya otomatik kaydedilir; kayıt durumunu üstte kontrol edin. Yeniden açınca klinik onayları gözden geçirin.'):editionText('Entries save automatically on this computer; check the save status above. Review clinical confirmations when reopening.','Entries save automatically to the server; check the save status above. Review clinical confirmations when reopening.')}</div>`;
  $("metricBmi").textContent = fmt(result.bmi);
  $("metricLoss").textContent =
    result.weightLoss == null ? "—" : getLocale() === "tr" ? `%${fmt(result.weightLoss)}` : `${fmt(result.weightLoss)}%`;
  $("metricLossPeriod").textContent = state.lossMonths
    ? `${fmt(state.lossMonths)} aylık dönemde`
    : "Dönem belirtilmedi";
  $("metricNitrogen").textContent = fmt(result.indices?.nitrogen?.value, 2);
  $("metricRefeeding").textContent =
    {
      high: "Yüksek risk",
      low: "NICE yüksek risk eşiği karşılanmadı",
      unknown: "Belirsiz",
      moderate: "Olası risk",
    }[result.refeeding.level] || result.refeeding.level;
  $("metabolicTitle").textContent = result.metabolic.title;
  $("metabolicDetail").textContent = result.metabolic.detail;
  $("glimTitle").textContent = result.glim.title;
  $("glimDetail").textContent = result.glim.detail;
  $("blockerSummary").textContent = result.blockers.length
    ? `${result.blockers.length} kontrol tamamlanmalı. ${result.blockers.slice(0, 2).join(" ")}`
    : "Temel güvenlik alanları ve hekim hedefleri doğrulandı. Program taslağı görüntülenebilir.";
  $("nlrValue").textContent = fmt(result.indices.nlr?.value, 2);
  $("pniValue").textContent = fmt(result.indices.pni?.value, 2);
  $("labCount").textContent =
    groups.labForm.filter((f) => f.type === "number" && state[f.id] != null)
      .length || "—";
  $("planSafety").classList.toggle("ready", !result.blockers.length);
  $("planSafety").innerHTML = result.blockers.length
    ? `<h3>Program oluşturmak için tamamlanacak kontroller</h3><ul>${result.blockers.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>`
    : '<h3>Program taslağı için temel kontroller tamamlandı.</h3><p class="footnote">Son klinik değerlendirme ve uygulama kararı sorumlu hekimdedir.</p>';
  const ref = result.reference;
  $("referenceText").innerHTML =
    `<strong>Kılavuz referansı · otomatik reçete değildir</strong><p>${esc(ref.energy)}</p><p>${esc(ref.protein)}</p>${(Array.isArray(
      ref.notes,
    )
      ? ref.notes
      : [ref.notes]
    )
      .filter(Boolean)
      .map((x) => `<p>${esc(x)}</p>`)
      .join("")}`;
  renderPlan();
  renderInputReport();
  $("traceList").innerHTML = [
    `Motor: ${VERSION} · Kanıt kesiti: ${EVIDENCE_CUTOFF}`,
    `Olgu: ${state.studyId || "—"} · Değerlendirme: ${state.visitDate || "—"} · Kan: ${state.labDate || "—"}`,
    ...result.trace.map(row => state.demo && typeof row === "string" && row.startsWith("Mama/etiket kaydı:")
      ? row.replace(state.formulaName, displayValue("formulaName")).replace(state.formulaSource, displayValue("formulaSource")) : row),
  ]
    .map(
      (x) =>
        `<div class="trace-row">${esc(typeof x === "string" ? x : JSON.stringify(x))}</div>`,
    )
    .join("");
  $("lastUpdated").textContent = state.demo
    ? "Sentetik örnek olgu"
    : `Oturumda hesaplandı · ${new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Istanbul" })}`;
  experience?.refresh();
  workspace?.refresh();
  followup?.refresh();
  renderCoreRuleSources();
  clinicReferences?.refresh();
  startGuide?.refresh();
  renderPrintAppendix();
}
function renderPrintAppendix() {
  const target = $("reportAppendix");
  if (!target) return;
  target.innerHTML = reportAppendixMarkup({input:state, clinicalInput:workspace?.getMeasures(), clinicalOutputs:workspace?.snapshot()?.outputs,
    decisionReviews:experience?.snapshot()?.records, delivery:followup?.snapshot(), followupComparison:followup?.series(),
    coreRuleProvenance:buildCoreRuleProvenance(), sources:allEvidence, language:getLocale(), translateValue:translate,
    labReferences:clinicReferences?.snapshot(), generatedAt:new Date().toISOString(), engineVersion:VERSION, uiVersion:UI_VERSION,
    engineSha256, assessmentSha256, evidenceCutoff:EVIDENCE_CUTOFF});
}
function renderCoreRuleSources() {
  const target = $("coreRuleSourceContent");
  if (!target) return;
  $("coreRuleSourceTitle").textContent = coreRuleSourcesTitle(getLocale());
  target.innerHTML = coreRuleSourcesMarkup(buildCoreRuleProvenance(), allEvidence, getLocale(), translate);
}
function renderPlan() {
  const p = result.plan;
  if (!p) {
    $("planResult").innerHTML =
      '<div class="plan-empty">Klinik bağlamı, laboratuvar kontrolünü, hekim hedeflerini ve ürün bileşimini tamamlayın. Yüksek riskli veya kapsam dışı durumlarda bu sürüm doz üretmez.</div>';
    return;
  }
  const remaining =
    state.route === "oral" && state.servingVolume
      ? `Yaklaşık ${fmt(p.volume / state.servingVolume, 2)} × ${fmt(state.servingVolume, 0)} mL porsiyon eşdeğeri / gün. Tam şişeye yuvarlama yapılmadı.`
      : `${fmt(p.rate, 1)} mL/saat × ${fmt(state.hours, 1)} saat. Bu değer hedef hacmin aritmetik karşılığıdır; başlangıç hızı değildir.`;
  $("planResult").innerHTML =
    `<div class="plan-volume">${fmt(p.volume, 1)}<span>mL / gün</span></div><p class="plan-rate" data-no-i18n>${esc(displayValue("formulaName"))}</p><p class="plan-rate">${remaining}</p><div class="plan-stats"><div><small>Toplam enerji · tüm kaynaklar</small><strong>${fmt(p.energy, 0)} <small>kcal / gün</small></strong></div><div><small>Toplam protein · tüm kaynaklar</small><strong>${fmt(p.protein, 1)} <small>g / gün</small></strong></div><div><small>Mamadan enerji</small><strong>${fmt(p.volume * state.formulaEnergy, 0)} <small>kcal / gün</small></strong></div><div><small>Mamadan serbest su</small><strong>${fmt(p.water, 0)} <small>mL / gün</small></strong></div></div><p class="gap-note">Enerji açığı: ${fmt(p.energyGap, 0)} kcal · Protein açığı: ${fmt(p.proteinGap, 1)} g.${p.protein > state.proteinTarget ? ` Protein hedefinin ${fmt(p.protein - state.proteinTarget, 1)} g üzerindedir.` : ""} Enerji hedefine göre hacim hesaplanır; protein açığını kapatmak için hacim otomatik artırılmaz.</p><p class="footnote">Kurumun klinik protokolü ve ürün talimatı ile değerlendirilmelidir. Tolerans, toplam sıvı, aspirasyon ve elektrolit kontrolü bu aritmetik hesabın dışındadır.</p>`;
}
function resetImport() {
  labImportGeneration++;
  importRows = [];
  $("importPreview").innerHTML = "";
  $("extractedText").textContent = "";
  $("extractedText").hidden = true;
  $("labFile").value = "";
  $("uploadStatus").textContent =
    "Dosya seçilmedi. Sonuçları elle de girebilirsiniz.";
}
function invalidateResearchImport() {
  researchImportGeneration++;
  $("sessionFile").value = "";
  $("researchStatus").textContent = "";
}
$("newCase").addEventListener("click", () => switchCurrentCase(() => {
  draftId=crypto.randomUUID();
  clinicReferences?.resetApplicability();
  state = blank();
  resetImport();
  invalidateResearchImport();
  sourceInfo = [];
  workspace?.reset(false);
  followup?.reset();
  fill();
  experience?.reset();
  go("assessment");
  toast("Boş değerlendirme açıldı.");
}));
$("demoCase").addEventListener("click", () => switchCurrentCase(() => {
  draftId=crypto.randomUUID();
  clinicReferences?.resetApplicability();
  state = demo();
  resetImport();
  invalidateResearchImport();
  sourceInfo = [];
  workspace?.reset(true);
  followup?.reset();
  fill();
  experience?.reset();
  toast("Sentetik örnek olgu yüklendi.");
}));
$("clearImport").addEventListener("click", () => {
  resetImport();
  toast("Dosya aktarımı temizlendi. Girilen ölçümler korundu.");
});
function previewRows(rows) {
  importRows = rows.slice(0, 300).map(normalizeRow);
  $("importPreview").innerHTML =
    `<table><thead><tr><th>Seç</th><th>Test</th><th>Değer / birim</th><th>Tarih / durum</th></tr></thead><tbody>${importRows.map((r, i) => `<tr><td>${r.error ? "—" : `<input type="checkbox" data-import="${i}" aria-label="${esc(r.test)} sonucunu seç">`}</td><td>${esc(r.test || "Bilinmiyor")}</td><td>${r.error ? "—" : `${fmt(r.value, 3)} ${esc(r.unit)}`}</td><td>${esc(r.error || `${r.date}${r.conversion ? " · " + r.conversion : ""}`)}</td></tr>`).join("")}</tbody></table><button id="applyImport" class="button primary">Seçilen sonuçları aktar</button><p class="footnote">Aynı testten tek ölçüm ve kan testleri için tek tarih seçin. UUN tarihi idrar toplama dönemiyle ayrıca eşleştirilir.</p>`;
  $("applyImport").addEventListener("click", applyImport);
}
function applyImport() {
  const selected = [...document.querySelectorAll("[data-import]:checked")].map(
    (x) => importRows[Number(x.dataset.import)],
  );
  if (!selected.length) {
    toast("Aktarılacak sonuç seçin.");
    return;
  }
  if (new Set(selected.map((r) => r.test)).size !== selected.length) {
    toast("Aynı test için yalnız bir ölçüm seçin.");
    return;
  }
  const blood = selected.filter((r) => r.test !== "uun");
  if (new Set(blood.map((r) => r.date)).size > 1) {
    toast("Kan testleri için aynı örnek tarihini seçin.");
    return;
  }
  clinicReferences?.resetApplicability();
  if (state.demo) { state = blank(); sourceInfo = []; invalidateResearchImport(); workspace?.reset(false); followup?.reset(); }
  if (blood.length) {
    for (const key of Object.keys(labDefs))
      if (key !== "uun") state[key] = null;
    sourceInfo = sourceInfo.filter((r) => r.test === "uun");
  }
  for (const r of selected) state[r.test] = r.value;
  const urine = selected.find(r => r.test === "uun");
  if (urine) state.uunDate = urine.date;
  state.inputErrors = (state.inputErrors || []).filter(id => !selected.some(r => r.test === id) && !(blood.length && (id === "labDate" || groups.labForm.some(f => f.type === "number" && f.id === id))) && !(urine && id === "uunDate"));
  if (blood.length) state.labDate = blood[0].date;
  state.labsConfirmed = false;
  state.collectionComplete = false;
  state.collectionMatched = false;
  state.clinicianConfirmed = false;
  sourceInfo = [
    ...sourceInfo.filter((r) => !selected.some((s) => s.test === r.test)),
    ...selected.map((r) => ({
      test: r.test,
      date: r.date,
      unit: r.unit,
      method: "structured-file-reviewed",
      conversion: r.conversion,
    })),
  ];
  experience?.invalidateReviews();
  workspace?.invalidateCore();
  fill();
  $("uploadStatus").textContent =
    `${selected.length} ölçüm aktarıldı. Kaynak belgeyle karşılaştırıp doğrulama kutusunu işaretleyin.`;
  toast("Sonuçlar aktarıldı; doğrulama bekliyor.");
  markLocalChanged();
}
$("labFile").addEventListener("change", async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  resetImport();
  const generation = labImportGeneration;
  const current = () => generation === labImportGeneration;
  state.labsConfirmed = false;
  state.clinicianConfirmed = false;
  experience?.invalidateReviews();
  $("labsConfirmed").checked = false;
  $("clinicianConfirmed").checked = false;
  render();
  $("uploadStatus").textContent = "Dosya cihazda okunuyor…";
  let pdf = null, pdfTask = null;
  try {
    if (file.size > 10 * 1024 * 1024) throw Error("Dosya sınırı 10 MB.");
    const ext = file.name.split(".").pop().toLowerCase();
    if (["csv", "json"].includes(ext)) {
      const txt = await file.text();
      if (!current()) return;
      const rows = ext === "json" ? JSON.parse(txt) : parseCSV(txt);
      if (!Array.isArray(rows) || rows.length > 300)
        throw Error("En fazla 300 test kaydı içeren bir dizi gerekir.");
      previewRows(rows);
      $("uploadStatus").textContent =
        `${rows.length} kayıt okundu. Test, birim ve tarihi inceleyip aktarılacak ölçümleri seçin.`;
    } else if (["pdf", "txt"].includes(ext)) {
      let txt = "";
      if (ext === "pdf") {
        const pdfjs = await import("./vendor/pdf.mjs");
        if (!current()) return;
        pdfjs.GlobalWorkerOptions.workerSrc = "./vendor/pdf.worker.mjs";
        const bytes = await file.arrayBuffer();
        if (!current()) return;
        pdfTask = pdfjs.getDocument({
          data: new Uint8Array(bytes),
          useWorkerFetch: false,
          disableAutoFetch: true,
          disableStream: true,
          // Compatibility flag only; the patched vendor is the dependency fix.
          isEvalSupported: false,
        });
        pdf = await pdfTask.promise;
        if (!current()) return;
        if (pdf.numPages > 50)
          throw Error("Bu sürüm en fazla 50 sayfa PDF okur.");
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          if (!current()) return;
          const text = await page.getTextContent();
          if (!current()) return;
          txt +=
            `\n— Sayfa ${i} —\n` +
            text.items.map((v) => v.str + (v.hasEOL ? "\n" : " ")).join("");
        }
      } else {
        txt = await file.text();
        if (!current()) return;
      }
      if (txt.replace(/— Sayfa \d+ —/g, "").trim().length < 20)
        throw Error(
          "Okunabilir metin bulunamadı. Taranmış/görsel PDF için ölçümleri elle girin; OCR uygulanmadı.",
        );
      $("extractedText").textContent = txt.slice(0, 100000);
      $("extractedText").hidden = false;
      $("uploadStatus").textContent =
        "Metin okundu. PDF/TXT ölçümleri otomatik eşlenmez; test, tarih ve birimleri doğrulayıp sağdaki alanlara elle girin.";
    } else throw Error("Desteklenmeyen dosya biçimi.");
  } catch (err) {
    if (!current()) return;
    $("uploadStatus").textContent = `Dosya aktarılamadı: ${err.message}`;
  } finally {
    // Each PDF owns its resources even after its generation was invalidated.
    // Cleanup must never change the current job's preview, status or input.
    // PDF.js6 owns teardown on the loading task; older/test proxies may expose
    // it on the document. Prefer the real task so completed parses release it.
    const resource = typeof pdfTask?.destroy === "function" ? pdfTask : pdf;
    if (resource) {
      try { await resource.destroy(); } catch { /* Preserve the read result/error. */ }
    }
  }
});
function download(name, text, type = "application/json") {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
$("csvTemplate").addEventListener("click", () =>
  download(
    "laboratory-template.csv",
    "\uFEFFtest;value;unit;date\r\nalbumin;31;g/L;2026-10-23\r\nneutrophils;7.2;10^9/L;2026-10-23\r\nlymphocytes;1.3;10^9/L;2026-10-23\r\ncrp;28;mg/L;2026-10-23\r\npotassium;4.1;mmol/L;2026-10-23\r\nphosphate;1.05;mmol/L;2026-10-23\r\nmagnesium;0.82;mmol/L;2026-10-23\r\n",
    "text/csv;charset=utf-8",
  ),
);
const studyMeta = {
  "effort-protein-2023":
    "1.329 randomize · 1.301 analiz · 85 YBÜ · çok uluslu · yüksek beslenme riski ve mekanik ventilasyon",
  "precise-2024":
    "935 hasta · çok merkezli, çift kör RCT · invaziv ventilasyon",
  "target-protein-2025":
    "3.397 hasta · küme randomize çapraz geçişli RCT · YBÜ",
  "glim-intake-2026":
    "30 tamamlayan uzman · değiştirilmiş Delphi · hasta RCT’si değildir",
  "glints-2026":
    "Uzman Delphi konsensusu · beslenme endikasyonları · hasta RCT’si değildir",
};
function sourceType(e) {
  const k = e.kind;
  if (/derleme|meta|review/i.test(k)) return "review";
  if (/post.?hoc|ikincil/i.test(k)) return "secondary";
  if (/kohort|gözlem/i.test(k)) return "cohort";
  if (/kılavuz|guideline/i.test(k)) return "Kılavuz";
  if (/RCT|random/i.test(k)) return "RCT";
  return "consensus";
}
const allEvidence = [
  ...evidence,
  ...indexEvidence,
  ...extraEvidence,
  ...evidence2026,
  ...neuroEvidence2026,
  ...glutamineEvidence,
  ...leucineEvidence,
  ...evidenceUpdate,
  ...metabolicEvidence,
  ...additionalSources,
];
function sourceCard(e) {
  const count = e.sampleSize
    ? `<strong>n = ${fmt(e.sampleSize, 0)}</strong> · `
    : "";
  const meta = translate(e.sampleNote || studyMeta[e.id] || "");
  const access =
    /kısmi erişim/i.test(e.access)
      ? "Kısmi erişim"
      : e.access.length > 45
      ? /özet/i.test(e.access)
        ? "Özet"
        : "Erişim ayrıntısı"
      : e.access;
  return `<article class="evidence-card"><div class="evidence-meta"><span class="tag">${esc(translate(e.kind))} · ${e.year}</span><span title="${esc(e.accessNote || e.access)}">${esc(access)}</span></div>
    <h3>${esc(e.title)}</h3>${count||meta ? `<p class="study-meta">${count}${esc(meta)}</p>` : ''}
    ${e.population ? `<p><strong>Hasta grubu:</strong> ${esc(e.population)}</p>` : ''}
    <p class="evidence-main">${e.primaryOutcome ? '<strong>Bildirilen sonuç:</strong> ' + esc(e.primaryOutcome) : esc(e.summary)}</p>
    <details class="evidence-details"><summary>Yöntem, yorum ve sınırlılıklar</summary>
      <p><strong>Erişim düzeyi:</strong> ${esc(e.access)}</p>
      ${lineageMarkup(e.id,getLocale())}
      ${e.design ? `<p>${esc(e.design)}</p>` : ''}${e.primaryOutcome ? `<p>${esc(e.summary)}</p>` : ''}
      <p class="application">${esc(e.application)}</p><p class="limitations">Sınır: ${esc(e.limitations)}</p>
      ${e.accessNote ? `<p><strong>Erişim kaydı:</strong> ${esc(e.accessNote)}</p>` : ''}
      ${e.onlineDate || e.printDate ? `<p class="footnote"><strong>Yayın tarihleri:</strong> <span>Çevrimiçi</span> ${esc(e.onlineDate || '—')} · <span>Basılı sayı</span> ${esc(e.printDate || '—')}</p>` : ''}
    </details><a href="${esc(e.url)}" target="_blank" rel="noopener noreferrer">Özgün kaynağı aç ↗</a>
    <div class="evidence-doi">${e.doi ? 'DOI: ' + esc(e.doi) : 'Resmî kaynak'}</div></article>`;
}
function renderComponents() {
  $("componentList").innerHTML = [
    [
      "Glutamin",
      "IV, enteral ve kombine rejimler; genel YBÜ ile yanık popülasyonları ayrı değerlendirilir.",
      glutamineEvidence,
    ],
    [
      "Lösin, BCAA ve HMB",
      "Saf lösin, çok bileşenli ürünler ve lösin metaboliti HMB eşdeğer müdahaleler değildir.",
      [...leucineEvidence, ...evidenceUpdate.filter(e => e.id.includes('bcaa'))],
    ],
    [
      "Birleşik amino asit ve mobilizasyon müdahalesi",
      "İzole amino asit etkisi, birlikte verilen egzersiz ve toplam alımdan ayrılamaz.",
      evidenceUpdate.filter(e => e.id.includes('aa-mobilization') || e.id.includes('aa-cycling')),
    ],
  ]
    .map(
      ([title, note, records]) =>
        `<div class="component-heading"><h2>${title}</h2><p>${note}</p></div>${[
          ...records,
        ]
          .sort((a, b) => b.year - a.year)
          .map(sourceCard)
          .join("")}`,
    )
    .join("");
}
function renderEvidence() {
  const search = $("evidenceSearch").value.toLocaleLowerCase(getNumberLocale()),
    filter = $("evidenceFilter").value;
  const year = $("evidenceYear").value;
  const list = allEvidence
    .filter(
      (e) =>
        (year === "all" || String(e.year) === year) &&
        (!e.qualityHold || $("showQualityHold").checked) &&
        ($("evidenceSize").value === "all" ||
          (e.sampleSize ||
            {
              "target-protein-2025": 3397,
              "effort-protein-2023": 1301,
              "nutrirea3-2023": 3036,
              "nutrirea3-renal-2026": 3036,
            }[e.id] ||
            0) >= 1000) &&
        (JSON.stringify(e) + " " +
          Object.values(e).filter(v => typeof v === "string").map(v => translate(v)).join(" "))
          .toLocaleLowerCase(getNumberLocale()).includes(search) &&
        (filter === "all" || sourceType(e) === filter),
    )
    .sort(
      (a, b) => b.year - a.year || (b.sampleSize || 0) - (a.sampleSize || 0),
    );
  $("evidenceList").innerHTML = list.length
    ? list.map(sourceCard).join("")
    : "<p>Aramayla eşleşen kaynak bulunamadı.</p>";
  $("evidenceSummary").textContent = `${list.length} / ${allEvidence.length} kaynak gösteriliyor`;
}
$("showQualityHold").addEventListener("change", renderEvidence);
$("evidenceSize").addEventListener("change", renderEvidence);
$("evidenceYear").addEventListener("change", renderEvidence);
$("evidenceSearch").addEventListener("input", renderEvidence);
$("evidenceFilter").addEventListener("change", renderEvidence);
function snapshot() {
  return {
    recordId: crypto.randomUUID(),
    schemaVersion: "0.1.0",
    engineVersion: VERSION,
    engineSha256,
    assessmentSha256,
    evidenceCutoff: EVIDENCE_CUTOFF,
    uiVersion: UI_VERSION,
    savedAt: new Date().toISOString(),
    input: structuredClone(state),
    output: structuredClone(result),
    coreRuleProvenance: buildCoreRuleProvenance(),
    provenance: structuredClone(sourceInfo),
    decisionReview: experience?.snapshot() || { version:EVIDENCE_CUTOFF, records:[] },
    clinicalProfile: workspace?.snapshot() || null,
    delivery: followup?.snapshot() || null,
    labReferences: clinicReferences?.snapshot() || null,
  };
}
function renderVisits() {
  $("visitCount").textContent = `${visits.length} kayıt`;
  $("visitsList").innerHTML = visits.length
    ? visits
        .map(
          (v, i) =>
            `<div class="visit-row"><div><strong><span data-no-i18n>${esc(v.input.studyId)}</span> ${v.input.demo ? "· SENTETİK" : ""}</strong><small>${esc(v.input.visitDate)} · ${esc(v.output.metabolic.title)} · ${esc(v.engineVersion)}</small></div><button class="button subtle" data-load-visit="${i}">Aç ↗</button></div>`,
        )
        .join("")
    : '<p class="footnote">Henüz değerlendirme kaydedilmedi.</p>';
  document.querySelectorAll("[data-load-visit]").forEach((b) =>
    b.addEventListener("click", () => switchCurrentCase(() => {
      const v = visits[Number(b.dataset.loadVisit)];
      draftId=crypto.randomUUID();
      resetImport();
      invalidateResearchImport();
      state = structuredClone(v.input);
      state.clinicianConfirmed = false;
      state.formulaVerified = false;
      state.labsConfirmed = false;
      state.collectionComplete = false;
      state.collectionMatched = false;
      sourceInfo = structuredClone(v.provenance || []);
      clinicReferences?.restore(v.labReferences);
      fill();
      workspace?.restore(v.clinicalProfile);
      followup?.restore(v.delivery);
      render();
      experience?.restore(v.decisionReview?.records || []);
      go("assessment");
      toast("Kayıt açıldı; onaylar yeniden değerlendirme bekliyor.");
    })),
  );
}
function saveAssessment(){
  if (!state.studyId || !dateValid(state.visitDate)) {
    toast("Çalışma kodu ve değerlendirme tarihi gerekli.");
    return false;
  }
  if (visits.length >= 200) {
    toast("Oturum sınırı 200 kayıt. Dışa aktarın.");
    return false;
  }
  visits.push(snapshot());
  followup?.refresh();
  renderVisits();
  experience?.refresh();
  markLocalChanged();
  void localStore?.flush();
  toast(getLocale()==='tr'?editionText('Değerlendirme çalışma listesine eklendi; diske kayıt durumunu üstte izleyin.','Değerlendirme çalışma listesine eklendi; kayıt durumunu üstte izleyin.'):editionText('Assessment added to the working list; check the disk save status above.','Assessment added to the working list; check the save status above.'));
  return true;
}
$("saveVisit").addEventListener("click",saveAssessment);
$("exportJson").addEventListener("click", () => {
  if (!visits.length) {
    toast("Önce değerlendirme kaydedin.");
    return;
  }
  download(
    "nutriclinic-research.json",
    JSON.stringify(
      {
        schema: "nutriklinik-research-0.1.0",
        exportedAt: new Date().toISOString(),
        records: visits,
        followupComparison: followup?.series() || null,
        importedComparisons: structuredClone(importedComparisons),
      },
      null,
      2,
    ),
  );
});
function csvCell(v) {
  if (v == null) return "";
  let s = String(v);
  if (typeof v === "string" && /^[=+@\-\t\r]/.test(s)) s = "'" + s;
  return '"' + s.replaceAll('"', '""') + '"';
}
$("exportCsv").addEventListener("click", () => {
  if (!visits.length) {
    toast("Önce değerlendirme kaydedin.");
    return;
  }
  const comparison=followup?.series();
  const scope=comparison?.selection||{},selected=new Set(scope.selectedIds||[]),included=new Set((comparison?.rows||[]).map(r=>r.recordId));
  const comparisonScope=JSON.stringify(Object.fromEntries(['studyId','episodeId','context','phase','targetVersion'].map(key=>[key,scope[key]??null])));
  const headers = [
    "recordId",
    "savedAt",
    "engineVersion",
    "evidenceCutoff",
    ...fields.map((f) => f.id),
    ...bools,
    "demo",
    "bmi",
    "weightLoss",
    "nlr",
    "pni",
    "nitrogen",
    "refeedingLevel",
    "planVolume",
    "planEnergy",
    "planProtein",
    "blockers",
    "decisionReviews",
    "clinicalProfile",
    "delivery",
    "followupScope",
    "followupSelected",
    "followupIncluded",
    "followupExclusions",
    "followupSummary",
    "coreRuleProvenance",
    "labReferences",
  ];
  const rows = visits.map((v) => [
    v.recordId,
    v.savedAt,
    v.engineVersion,
    v.evidenceCutoff,
    ...fields.map((f) => v.input[f.id]),
    ...bools.map((k) => v.input[k]),
    v.input.demo,
    v.output.bmi,
    v.output.weightLoss,
    v.output.indices.nlr?.value,
    v.output.indices.pni?.value,
    v.output.indices.nitrogen?.value,
    v.output.refeeding.level,
    v.output.plan?.volume,
    v.output.plan?.energy,
    v.output.plan?.protein,
    v.output.blockers.join(" | "),
    JSON.stringify((v.decisionReview?.records || []).map(({topicId,choiceId,rationale,sourceIds,reviewedAt,currentAtSave}) => ({topicId,choiceId,rationale,sourceIds,reviewedAt,currentAtSave}))),
    JSON.stringify(v.clinicalProfile || null),
    JSON.stringify(v.delivery || null),
    comparisonScope,
    selected.has(v.recordId),
    included.has(v.recordId),
    JSON.stringify(comparison?.excluded.find(row=>row.recordId===v.recordId)?.reasons||(!selected.has(v.recordId)?[{code:"not_selected",en:"Not selected",tr:"Seçilmedi"}]:comparison?.notes||[])),
    JSON.stringify(comparison?.summary||null),
    v.coreRuleProvenance == null ? "" : JSON.stringify(v.coreRuleProvenance),
    v.labReferences == null ? "" : JSON.stringify(v.labReferences),
  ]);
  download(
    "nutriclinic-research.csv",
    "\uFEFF" +
      [headers, ...rows].map((r) => r.map(csvCell).join(";")).join("\r\n"),
    "text/csv;charset=utf-8",
  );
});
function safeInput(obj) {
  if (!obj || typeof obj !== "object" || Array.isArray(obj))
    throw Error("Girdi kaydı geçersiz.");
  const safe = blank();
  safe.visitDate = "";
  for (const f of fields) {
    const value = obj[f.id];
    if (value == null || value === "") continue;
    if (f.type === "number") {
      if (
        typeof value !== "number" ||
        !Number.isFinite(value) ||
        value < f.min ||
        value > f.max
      )
        throw Error(`Geçersiz sayı: ${f.id}`);
    } else if (typeof value !== "string" || value.length > 160)
      throw Error(`Geçersiz metin: ${f.id}`);
    else if (f.type === "select" && !f.options.some(([key]) => key === value))
      throw Error(`Geçersiz seçim: ${f.id}`);
    if (f.type === "date" && !dateValid(value))
      throw Error(`Geçersiz tarih: ${f.id}`);
    safe[f.id] = value;
  }
  for (const k of bools) safe[k] = obj[k] === true;
  safe.demo = obj.demo === true;
  safe.inputErrors = Array.isArray(obj.inputErrors)
    ? obj.inputErrors.filter(
        (id) => typeof id === "string" && fields.some((f) => f.id === id),
      )
    : [];
  return safe;
}
$("sessionFile").addEventListener("change", async (e) => {
  const f = e.target.files?.[0];
  if (!f) return;
  const generation = ++researchImportGeneration;
  const current = () => generation === researchImportGeneration;
  $("researchStatus").textContent = "Araştırma dosyası cihazda okunuyor…";
  try {
    if (f.size > 5 * 1024 * 1024) throw Error("Dosya sınırı 5 MB.");
    const text = await f.text();
    if (!current()) return;
    const data = JSON.parse(text);
    if (
      data.schema !== "nutriklinik-research-0.1.0" ||
      !Array.isArray(data.records) ||
      data.records.length > 200
    )
      throw Error("Desteklenen araştırma dosyası değil.");
    const loaded = data.records.map((v) => {
      const input = safeInput(v.input);
      input.clinicianConfirmed = false;
      input.formulaVerified = false;
      input.labsConfirmed = false;
      input.collectionComplete = false;
      input.collectionMatched = false;
      return {
        recordId: crypto.randomUUID(),
        schemaVersion: "0.1.0",
        engineVersion: VERSION,
        engineSha256,
        assessmentSha256,
        uiVersion: UI_VERSION,
        evidenceCutoff: EVIDENCE_CUTOFF,
        savedAt: new Date().toISOString(),
        originalRecord: structuredClone(v),
        labReferences: v.labReferences == null ? null : {...evaluateReferenceProfile(input,restoreReferenceProfile(v.labReferences)),applicabilityConfirmed:false},
        delivery: {version:UI_VERSION,measures:restoreDelivery(v.delivery?.measures)},
        clinicalProfile: v.clinicalProfile?.measures ? {version:EVIDENCE_CUTOFF,measures:structuredClone(v.clinicalProfile.measures)} : null,
        decisionReview: {version:EVIDENCE_CUTOFF,records:Array.isArray(v.decisionReview?.records)?structuredClone(v.decisionReview.records):[]},
        input,
        output: evaluate(input),
        coreRuleProvenance: buildCoreRuleProvenance(),
        provenance: [
          {
            method: "research-json-reimport",
            originalSavedAt: String(v.savedAt || "").slice(0, 80),
            note: "Dış sonuçlar güvenilmedi; yeniden hesaplandı. Onaylar sıfırlandı.",
          },
        ],
      };
    });
    if(!await saveBeforeSwitch()||!current())return;
    importedComparisons=[...(Array.isArray(data.importedComparisons)?structuredClone(data.importedComparisons):[]),...(data.followupComparison?[{importedAt:new Date().toISOString(),trusted:false,comparison:structuredClone(data.followupComparison)}]:[])];
    visits = loaded;
    renderVisits();
    followup?.refresh();
    markLocalChanged();
    $("researchStatus").textContent =
      `${loaded.length} kayıt açıldı ve mevcut motorla yeniden hesaplandı. Klinik onaylar yeniden gereklidir.`;
  } catch (err) {
    if (!current()) return;
    $("researchStatus").textContent = `Dosya açılamadı: ${err.message}`;
  } finally {
    if (current()) e.target.value = "";
  }
});
$("clearVisits").addEventListener("click", async () => {
  if(!await saveBeforeSwitch())return;
  invalidateResearchImport();
  visits = [];
  importedComparisons=[];
  renderVisits();
  followup?.refresh();
  experience?.refresh();
  markLocalChanged();
  toast(getLocale()==='tr'?editionText('Çalışma listesi temizlendi. Diskteki hasta arşivi ve indirilen dosyalar korundu.','Çalışma listesi temizlendi. Sunucudaki hasta arşivi ve indirilen dosyalar korundu.'):'Working list cleared. The saved patient archive and downloaded files were retained.');
});
$("printReport").addEventListener("click", () => {renderPrintAppendix();window.print();});
window.addEventListener("beforeprint",renderPrintAppendix);

function renderInputReport() {
  const target = $("reportInputList");
  if (!target) return;
  const mapped = fields.map((f) => {
    let value = state[f.id];
    if (f.type === "select")
      value = f.options.find(([key]) => key === value)?.[1] || "Bilinmiyor";
    else if (f.type === "number")
      value =
        value == null ? "Eksik" : fmt(value, 4) + (f.unit ? " " + f.unit : "");
    else value = value || "Eksik";
    const raw = ["text", "date", "datetime-local"].includes(f.type) && state[f.id];
    return "<tr><th>" + esc(f.label) + "</th><td" + (raw ? " data-no-i18n" : "") + ">" + esc(raw ? displayValue(f.id) : value) + "</td></tr>";
  });
  mapped.push(
    ...bools.map(
      (k) =>
        "<tr><th>" +
        esc(
          Object.values(checks)
            .flat()
            .find((x) => x[0] === k)?.[1] || "Valide tarama pozitif",
        ) +
        "</th><td>" +
        (state[k] ? "Evet" : "Hayır / doğrulanmadı") +
        "</td></tr>",
    ),
  );
  target.innerHTML =
    "<h3>Güncel değerlendirmenin girdileri</h3><table><tbody>" +
    mapped.join("") +
    "</tbody></table><h3>Plan ve güvenlik çıktısı</h3><p>" +
    esc(
      result.plan
        ? "Mama hacmi " +
            fmt(result.plan.volume, 1) +
            " mL/gün · toplam enerji " +
            fmt(result.plan.energy, 1) +
            " kcal · toplam protein " +
            fmt(result.plan.protein, 1) +
            " g"
        : "Plan üretilmedi.",
    ) +
    "</p><ul>" +
    result.blockers.map((x) => "<li>" + esc(x) + "</li>").join("") +
    "</ul><h3>Formüller ve hesaplama izi</h3>";
}
fill();
renderVisits();
renderEvidence();
renderComponents();
workspace = initClinicalWorkspace({
  getInput:()=>state,
  getResult:()=>result,
  getSource:id=>allEvidence.find(e=>e.id===id),
  onChange:()=>{experience?.invalidateReviews();state.clinicianConfirmed=false;$("clinicianConfirmed").checked=false;followup?.invalidate();render();markLocalChanged();},
});
render();
experience = initExperience({
  getInput: () => ({...state,clinicalMeasures:workspace?.getMeasures()||{},deliveryMeasures:followup?.getMeasures()||{},labReferences:clinicReferences?.snapshot()||null}),
  getResult: () => result,
  getVisits: () => visits,
  getView: () => view,
  getSource: id => allEvidence.find(e => e.id === id),
  navigate: go,
  toast,
  onDraftChange:markLocalChanged,
});
followup = initFollowup({
 getInput:()=>state,getClinicalMeasures:()=>workspace?.getMeasures(),getVisits:()=>visits,getSource:id=>allEvidence.find(e=>e.id===id),getResult:()=>result,getImportedComparisons:()=>importedComparisons,
 onDraftChange:()=>{experience?.invalidateReviews();markLocalChanged();},onSave:saveAssessment,navigate:go,toast,
 onExamples:()=>{
  if(!state.demo)return;
  if(visits.some(v=>v.delivery?.measures?.episodeId==='DEMO-FOLLOWUP')){toast(getLocale()==='tr'?'Sentetik izlem örneği zaten var.':'The synthetic follow-up example already exists.');return;}
  const base=demo(),day=offset=>{const date=new Date(base.visitDate+'T12:00:00Z');date.setUTCDate(date.getUTCDate()+offset);return date.toISOString().slice(0,10);};
  if(visits.length+3>200){toast(getLocale()==='tr'?'Oturum kayıt sınırına ulaşıldı.':'Session record limit reached.');return;}
  const added=[];resetImport();invalidateResearchImport();sourceInfo=[];workspace.reset(true);
  for(let i=0;i<3;i++){
   const date=day(i-2),start=day(i-3)+'T08:00',end=date+'T08:00';
   const input={...base,visitDate:date,labDate:date,uunDate:date,collectionStart:start,collectionEnd:end,actualProtein:[50,70,85][i],uun:[13,12,11][i]};
   const measures={episodeId:'DEMO-FOLLOWUP',periodStart:start,periodEnd:end,actualEnergy:[1000,1450,1800][i],actualProtein:input.actualProtein,targetVersion:'DEMO-plan-v1',source:'SYNTHETIC intake chart / not real patient data',targetsStable:true,confirmed:true,invalidFields:[]};
   added.push({recordId:crypto.randomUUID(),schemaVersion:'0.1.0',engineVersion:VERSION,engineSha256,assessmentSha256,uiVersion:UI_VERSION,evidenceCutoff:EVIDENCE_CUTOFF,savedAt:new Date().toISOString(),input,output:evaluate(input),coreRuleProvenance:buildCoreRuleProvenance(),provenance:[{method:'synthetic-followup-example'}],clinicalProfile:workspace.snapshot(),delivery:{version:UI_VERSION,measures,output:evaluateDelivery(input,measures)}});
  }
  clinicReferences?.resetApplicability();
  visits.push(...added);state=structuredClone(added.at(-1).input);fill();followup.setDraft(added.at(-1).delivery.measures);renderVisits();followup.refresh();experience?.refresh();
  markLocalChanged();
 }
});
followup.refresh();
clinicReferences = initLabReferences({getInput:()=>state,onChange:()=>{experience?.invalidateReviews();render();markLocalChanged();},
 downloadProfile:profile=>download("clinic-reference-profile.json",JSON.stringify(profile,null,2))});
navigationHelp = initNavigationHelp();
const aboutLicenses = initAboutLicenses({ metadata: ABOUT_METADATA });
startGuide = initStartGuide({getInput:()=>state,getView:()=>view,navigate:go,openArchive:()=>$("localOpenArchive")?.click()});
applyEditionText();
initI18n(() => {
  // Re-render numbers and generated UI, without changing input state or confirmations.
  render();
  renderVisits();
  renderEvidence();
  renderComponents();
  localRecordsUI?.refresh();
  aboutLicenses.refresh();
  navigationHelp?.refresh();
  startGuide?.refresh();
  [$("breadcrumb").textContent, $("pageTitle").textContent, $("pageSubtitle").textContent] = names[view];
});
if (names[location.hash.slice(1)]) go(location.hash.slice(1), false);

// Patient persistence uses only the bundled loopback server. Reopening a draft
// restores entered measurements but never reauthorizes clinical confirmations.
function safeDraftInput(raw){
 if(!raw||typeof raw!=='object'||Array.isArray(raw))throw Error('invalid-local-draft');
 const clean=blank();clean.visitDate='';
 const invalid=new Set(Array.isArray(raw.inputErrors)?raw.inputErrors.filter(key=>fields.some(f=>f.id===key)):[]);
 for(const f of fields){const value=raw[f.id];if(value==null||value===''){clean[f.id]=f.type==='number'?null:'';continue;}
  if(f.type==='number'){
   if(typeof value!=='number'||!Number.isFinite(value))throw Error('invalid-local-draft');
   clean[f.id]=value;if(value<f.min||value>f.max)invalid.add(f.id);
  }else{
   if(typeof value!=='string'||value.length>160)throw Error('invalid-local-draft');clean[f.id]=value;
   if(f.type==='select'&&!f.options.some(([key])=>key===value))invalid.add(f.id);
   if(f.type==='date'&&!dateValid(value))invalid.add(f.id);
  }
 }
 for(const key of bools)clean[key]=raw[key]===true;
 for(const key of ['clinicianConfirmed','formulaVerified','labsConfirmed','collectionComplete','collectionMatched'])clean[key]=false;
 clean.demo=raw.demo===true;clean.inputErrors=[...invalid];return clean;
}
function captureLocalWorkspace(){
 return {schema:'nutriklinik-local-workspace-0.1.0',uiVersion:UI_VERSION,engineSha256,assessmentSha256,
  current:{draftId,input:structuredClone(state),clinicalProfile:workspace?.getDraft?.()||{measures:workspace?.getMeasures()||{}},
   delivery:followup?.getDraft?.()||followup?.snapshot(),labReferences:clinicReferences?.getDraft?.()||clinicReferences?.snapshot(),
   decisionReview:experience?.getDraft?.()||experience?.snapshot(),provenance:structuredClone(sourceInfo)},
  records:structuredClone(visits),importedComparisons:structuredClone(importedComparisons)};
}
function prepareLocalWorkspace(value){
 if(!value||value.schema!=='nutriklinik-local-workspace-0.1.0'||!value.current||!Array.isArray(value.records)||value.records.length>200||!Array.isArray(value.importedComparisons))throw Error('invalid-local-workspace');
 const current=value.current;
 if(typeof current.draftId!=='string'||!/^[0-9a-f-]{36}$/i.test(current.draftId))throw Error('invalid-local-draft-id');
 const input=safeDraftInput(current.input),ids=new Set();
 const records=value.records.map(record=>{
  if(!record||typeof record.recordId!=='string'||record.recordId.length>160||ids.has(record.recordId)||!record.input||typeof record.input.studyId!=='string'||!record.output?.metabolic||!record.output?.indices||!record.output?.refeeding||!Array.isArray(record.output.blockers))throw Error('invalid-local-record');
  ids.add(record.recordId);return structuredClone(record);
 });
 return {current:structuredClone(current),input,records,importedComparisons:structuredClone(value.importedComparisons)};
}
function applyLocalWorkspace(value){
 if(value===null)return;
 const ready=prepareLocalWorkspace(value);
 restoringLocal=true;
 try{
  resetImport();invalidateResearchImport();state=ready.input;draftId=ready.current.draftId;visits=ready.records;importedComparisons=ready.importedComparisons;
  sourceInfo=Array.isArray(ready.current.provenance)?structuredClone(ready.current.provenance):[];
  workspace?.restoreDraft?.(ready.current.clinicalProfile);
  followup?.restoreDraft?.(ready.current.delivery);
  clinicReferences?.restoreDraft?.(ready.current.labReferences);
  experience?.restoreDraft?.(ready.current.decisionReview);
  fill();renderVisits();renderPrintAppendix();
 }finally{restoringLocal=false;}
}
function downloadLocalRecovery(){
 download('nutriclinic-workspace-recovery.json',JSON.stringify({...captureLocalWorkspace(),exportedAt:new Date().toISOString()},null,2));
}
async function importLocalRecovery(file){
 const generation=++localRecoveryGeneration,originalDraft=draftId;
 const current=()=>generation===localRecoveryGeneration&&draftId===originalDraft;
 try{
  if(file.size>16*1024*1024)return {ok:false};
  const value=JSON.parse(await file.text());
  if(!current())return {ok:false};
  if(value?.schema!=='nutriklinik-local-workspace-0.1.0'||!Array.isArray(value.records)||value.records.length>200||!value.current)return {ok:false};
  const records=value.records.map(original=>{
   const input=safeInput(original.input);
   for(const key of ['clinicianConfirmed','formulaVerified','labsConfirmed','collectionComplete','collectionMatched'])input[key]=false;
   return {recordId:crypto.randomUUID(),schemaVersion:'0.1.0',engineVersion:VERSION,engineSha256,assessmentSha256,uiVersion:UI_VERSION,evidenceCutoff:EVIDENCE_CUTOFF,
    savedAt:new Date().toISOString(),originalRecord:structuredClone(original),input,output:evaluate(input),coreRuleProvenance:buildCoreRuleProvenance(),
    clinicalProfile:original.clinicalProfile,delivery:{version:UI_VERSION,measures:restoreDelivery(original.delivery?.measures)},
    labReferences:original.labReferences?{...evaluateReferenceProfile(input,restoreReferenceProfile(original.labReferences)),applicabilityConfirmed:false}:null,
    decisionReview:{version:EVIDENCE_CUTOFF,records:[]},provenance:[{method:'workspace-recovery-file-reimport',trusted:false}]};
  });
  const payload={...value,records,current:{...value.current,draftId:crypto.randomUUID()},importedComparisons:Array.isArray(value.importedComparisons)?value.importedComparisons:[]};
  prepareLocalWorkspace(payload);
  if(!await saveBeforeSwitch()||!current())return {ok:false};
  applyLocalWorkspace(payload);markLocalChanged();const saved=await localStore.flush();return {ok:saved.ok};
 }catch{return {ok:false};}
}
async function openLocalPatient(response,studyId){
 if(!await saveBeforeSwitch())throw Error('unsaved-current-draft');
 const records=response.records;
 const latest=response.latestDraft?.current;
 const lastRecord=records[0];
 const current=latest||{draftId:crypto.randomUUID(),input:lastRecord?.input||{...blank(),studyId},clinicalProfile:lastRecord?.clinicalProfile,delivery:lastRecord?.delivery,
  labReferences:lastRecord?.labReferences==null?clinicReferences?.getDraft?.():{profile:lastRecord.labReferences.profileSnapshot},
  decisionReview:{reviews:lastRecord?.decisionReview?.records||[]},provenance:lastRecord?.provenance||[]};
 // Validate fully before replacing the currently displayed case.
 const payload={schema:'nutriklinik-local-workspace-0.1.0',current,records,importedComparisons:[]};prepareLocalWorkspace(payload);
 localRecoveryGeneration++;
 applyLocalWorkspace(payload);markLocalChanged();await localStore.flush();go('assessment');
}
localRecordsUI=initLocalRecordsUI({getStore:()=>localStore,openPatient:openLocalPatient,saveBeforeSwitch,downloadRecovery:downloadLocalRecovery,importRecovery:importLocalRecovery,navigate:go});
localStore=createLocalRecordStore({capture:captureLocalWorkspace,apply:applyLocalWorkspace,onStatus:value=>localRecordsUI.update(value)});
document.addEventListener('input',event=>{const el=event.target;if(el?.id==='languageSelect'||el?.closest?.('#localRecordStatus,#localPatientArchive'))return;markLocalChanged();});
document.addEventListener('change',event=>{const el=event.target;if(el?.id==='languageSelect'||el?.closest?.('#localRecordStatus,#localPatientArchive'))return;markLocalChanged();});
window.addEventListener('beforeunload',event=>{const status=localStore.getState();if(status.dirty||status.saving){event.preventDefault();event.returnValue='';}});
window.addEventListener('pagehide',()=>{if(localStore.getState().dirty)void localStore.flush({keepalive:true});});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'&&localStore.getState().dirty)void localStore.flush();});
void localStore.start().then(started=>{
 if(started.ok&&!started.restored&&!localStore.getState().dirty){
  restoringLocal=true;try{state=blank();draftId=crypto.randomUUID();sourceInfo=[];workspace.reset(false);followup.reset();experience.reset();clinicReferences.resetApplicability();fill();}finally{restoringLocal=false;}
 }
});
