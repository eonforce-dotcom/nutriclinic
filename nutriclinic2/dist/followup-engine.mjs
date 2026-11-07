import { evaluate } from "./engine.mjs";
import { evaluateContext, enforceClinicalContext } from "./clinical-context.mjs";

export const FOLLOWUP_VERSION = "0.3.1";
const DAY = 86400000;
const sourceIds = ["espen-icu-2023", "aspen-icu-2022", "jccng-2024"];
const B = (code, en, tr) => ({ code, en, tr });
const present = (value) => value !== null && value !== undefined && value !== "";
const string = (value, max = Infinity) =>
  typeof value === "string" && value.trim().length > 0 && value.trim().length <= max;
const clean = (value) => typeof value === "string" ? value.trim() : "";
const finite = (value, min, max = Infinity, positive = false) =>
  typeof value === "number" && Number.isFinite(value) && value >= min && value <= max && (!positive || value > 0);
const dateValid = (value) => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return year > 0 && month >= 1 && month <= 12 && day >= 1 && day <= days[month - 1];
};

// Wall times are a separate, explicitly unzoned coordinate system. No host
// timezone, Date.parse rollover, DST guess, or implicit local conversion is used.
function timestamp(value) {
  if (typeof value !== "string") return null;
  const parts = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?(Z|[+-]\d{2}:\d{2})?$/.exec(value);
  if (!parts || !dateValid(parts[1])) return null;
  const [year, month, day] = parts[1].split("-").map(Number);
  const hour = Number(parts[2]), minute = Number(parts[3]), second = Number(parts[4] || 0);
  if (hour > 23 || minute > 59 || second > 59) return null;
  let offsetMinutes = 0;
  const zone = parts[6] || "";
  if (zone && zone !== "Z") {
    const zoneHour = Number(zone.slice(1, 3)), zoneMinute = Number(zone.slice(4, 6));
    if (zoneHour > 14 || zoneMinute > 59 || (zoneHour === 14 && zoneMinute !== 0)) return null;
    offsetMinutes = (zoneHour * 60 + zoneMinute) * (zone[0] === "-" ? -1 : 1);
  }
  const point = new Date(0);
  point.setUTCFullYear(year, month - 1, day);
  point.setUTCHours(hour, minute, second, Number((parts[5] || "").padEnd(3, "0")));
  return { ms: point.getTime() - offsetMinutes * 60000, basis: zone ? "instant" : "wall", date: parts[1] };
}

function deliveryMeasures(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  if (Object.hasOwn(raw, "measures"))
    return raw.measures && typeof raw.measures === "object" && !Array.isArray(raw.measures) ? raw.measures : {};
  return raw;
}

const scopeFrom = (input, delivery) => ({
  studyId: clean(input.studyId), episodeId: clean(delivery.episodeId),
  context: clean(input.context), phase: clean(input.phase), targetVersion: clean(delivery.targetVersion),
});
const scopeKeys = ["studyId", "episodeId", "context", "phase", "targetVersion"];
const safeObject = (value) => value && typeof value === "object" && !Array.isArray(value) ? value : {};

/**
 * One complete documented 24-hour delivery interval, compared with the same
 * physician prescription throughout that interval. Differences/ratios are
 * descriptive; no target, supplement, route, or dose is changed.
 * Accepts delivery measures directly or {measures}; ignores stored outputs.
 * The written period-end date is compared with visitDate without consulting
 * the host timezone. A date alone cannot establish time-of-day recency.
 */
export function evaluateDelivery(input = {}, delivery = {}, clinicalMeasures) {
  const d = safeObject(input), m = deliveryMeasures(delivery);
  const errors = [], notes = [];
  const add = (code, en, tr) => errors.push(B(code, en, tr));
  if(d.inputErrors!==undefined&&(!Array.isArray(d.inputErrors)||d.inputErrors.some(key=>['studyId','age','context','phase','visitDate','kcalTarget','proteinTarget'].includes(key))))add('input_errors','Correct invalid target or scope fields in the main assessment.','Ana değerlendirmedeki geçersiz hedef veya kapsam alanlarını düzeltin.');
  if (!string(d.studyId)) add("study_id", "A nonempty case/study identifier is required.", "Boş olmayan olgu/çalışma kodu gereklidir.");
  if (!finite(d.age, 18, 120)) add("adult", "A valid adult age (18–120) is required.", "Geçerli erişkin yaş (18–120) gereklidir.");
  if (!["icu", "ward"].includes(d.context)) add("context", "Select a known ICU or ward context.", "Bilinen YBÜ veya servis ortamını seçin.");
  if (!["early", "late", "recovery"].includes(d.phase)) add("phase", "Record the clinical phase: early, late, or recovery.", "Klinik fazı kaydedin: erken, geç veya iyileşme.");
  if (!dateValid(d.visitDate)) add("visit_date", "A real YYYY-MM-DD assessment date is required.", "Gerçek bir YYYY-MM-DD değerlendirme tarihi gereklidir.");
  if (!string(m.episodeId, 80)) add("episode_id", "An episode identifier of 1–80 characters is required.", "1–80 karakterli yatış/dönem kodu gereklidir.");
  if (!string(m.targetVersion, 160)) add("target_version", "A physician target version/period identifier of 1–160 characters is required.", "1–160 karakterli hekim hedef sürümü/dönem kodu gereklidir.");
  if (!string(m.source, 160)) add("source", "A delivery-record source of 1–160 characters is required.", "1–160 karakterli gerçekleşen alım kaynağı gereklidir.");
  if (!finite(m.actualEnergy, 0, 15000)) add("actual_energy", "Actual total energy must be an explicit number from 0 to 15000 kcal/24 h; missing is not zero.", "Gerçek toplam enerji açıkça 0–15000 kcal/24 saat sayısı olmalıdır; eksik değer sıfır değildir.");
  if (!finite(m.actualProtein, 0, 500)) add("actual_protein", "Actual total protein must be an explicit number from 0 to 500 g/24 h; missing is not zero.", "Gerçek toplam protein açıkça 0–500 g/24 saat sayısı olmalıdır; eksik değer sıfır değildir.");
  if (!finite(d.kcalTarget, 100, 10000)) add("energy_target", "A verified physician energy target within the application's 100–10000 kcal/24 h input range is required.", "Uygulamanın 100–10000 kcal/24 saat girdi aralığında doğrulanmış hekim enerji hedefi gereklidir.");
  if (!finite(d.proteinTarget, 1, 500)) add("protein_target", "A verified physician protein target within the application's 1–500 g/24 h input range is required.", "Uygulamanın 1–500 g/24 saat girdi aralığında doğrulanmış hekim protein hedefi gereklidir.");
  if (d.clinicianConfirmed !== true) add("target_confirmation", "The physician targets require renewed explicit confirmation.", "Hekim hedefleri yeniden açık doğrulama gerektirir.");
  if (m.targetsStable !== true) add("targets_stable", "Confirm that these exact prescribed targets applied throughout the complete delivery interval.", "Bu reçete hedeflerinin gerçekleşen alım penceresinin tamamında aynı kaldığını doğrulayın.");
  if (m.confirmed !== true) add("delivery_confirmation", "Confirm the complete actual intake and matched prescription interval from the source record.", "Tam gerçekleşen alımı ve eşleşen reçete dönemini kaynak kayıttan doğrulayın.");
  if (m.invalidFields !== undefined && (!Array.isArray(m.invalidFields) || m.invalidFields.length > 0))
    add("invalid_fields", "Correct invalid imported or entered delivery fields before confirmation.", "Doğrulamadan önce geçersiz içe aktarılmış veya girilmiş alım alanlarını düzeltin.");

  const start = timestamp(m.periodStart), end = timestamp(m.periodEnd);
  let period = null;
  if (!start || !end) add("period_format", "Use real strict ISO start/end timestamps, both unzoned or both with explicit offsets/Z.", "Gerçek ve kesin ISO başlangıç/bitiş zamanları kullanın; ikisi de saat dilimsiz veya ikisi de açık ofsetli/Z olmalıdır.");
  else {
    const sameBasis = start.basis === end.basis;
    const duration = sameBasis ? end.ms - start.ms : null;
    period = {
      start: m.periodStart, end: m.periodEnd, startMs: start.ms, endMs: end.ms,
      basis: sameBasis ? start.basis : null, hours: duration === null ? null : duration / 3600000,
    };
    if (!sameBasis) add("mixed_time_basis", "Unzoned wall times cannot be mixed with zoned instants in one interval.", "Aynı pencerede saat dilimsiz duvar saati ile ofsetli anlar karıştırılamaz.");
    else if (duration !== DAY) add("period_24h", "The complete interval must be exactly 24 hours; no normalization or prorating is applied.", "Tam pencere kesin olarak 24 saat olmalıdır; normalleştirme veya süreye oranlama yapılmaz.");
    if (dateValid(d.visitDate) && end.date > d.visitDate)
      add("future_period", "The written period-end date is later than the assessment date.", "Yazılan dönem bitiş tarihi değerlendirme tarihinden sonradır.");
    if (sameBasis && start.basis === "wall") notes.push(B("wall_time", "This is an unzoned 24-hour wall-clock record; timezone-aware elapsed duration and DST effects are not verified.", "Bu saat dilimsiz 24 saatlik duvar saati kaydıdır; saat dilimine göre geçen süre ve yaz saati etkileri doğrulanmamıştır."));
  }
  const valid = errors.length === 0;
  const actual = { energy: finite(m.actualEnergy, 0, 15000) ? m.actualEnergy : null, protein: finite(m.actualProtein, 0, 500) ? m.actualProtein : null };
  const targets = { energy: finite(d.kcalTarget, 100, 10000) ? d.kcalTarget : null, protein: finite(d.proteinTarget, 1, 500) ? d.proteinTarget : null };
  const percent = { energy: valid ? actual.energy / targets.energy * 100 : null, protein: valid ? actual.protein / targets.protein * 100 : null };
  const difference = { energy: valid ? actual.energy - targets.energy : null, protein: valid ? actual.protein - targets.protein : null };
  let nitrogen = null;
  const nitrogenRequested = present(d.uun) || present(d.actualProtein) || d.collectionComplete === true || d.collectionMatched === true;
  if (valid && nitrogenRequested) {
    const urineStart = timestamp(d.collectionStart), urineEnd = timestamp(d.collectionEnd);
    const matchedWindow = urineStart && urineEnd && urineStart.basis === period.basis && urineEnd.basis === period.basis &&
      urineStart.ms === period.startMs && urineEnd.ms === period.endMs;
    const matchedProtein = finite(d.actualProtein, 0, 1000) && Math.abs(d.actualProtein - actual.protein) <= 1e-8;
    if (!matchedWindow) notes.push(B("nitrogen_window", "Nitrogen balance is not plotted: urine collection and delivery do not have the exact same interval and time basis.", "Azot dengesi çizilmez: idrar toplama ile gerçekleşen alımın penceresi ve zaman temeli tam eşleşmiyor."));
    if (!matchedProtein) notes.push(B("nitrogen_protein", "Reconcile actual protein: the nitrogen calculation's input must match this verified total intake; inconsistent totals are not plotted together.", "Gerçek proteini uzlaştırın: azot hesabının girdisi bu doğrulanmış toplam alımla eşleşmelidir; uyumsuz toplamlar birlikte çizilmez."));
    if (matchedWindow && matchedProtein) {
      const core = evaluate(d);
      const interpreted = clinicalMeasures && typeof clinicalMeasures === "object"
        ? enforceClinicalContext(core,evaluateContext(d,clinicalMeasures)) : core;
      const estimate = interpreted.indices?.nitrogen?.value;
      if (typeof estimate === "number" && Number.isFinite(estimate)) nitrogen = estimate;
      else notes.push(B("nitrogen_ineligible", "Nitrogen balance remains unavailable under the core collection, laboratory, renal and loss requirements.", "Ana motorun toplama, laboratuvar, böbrek ve kayıp koşulları altında azot dengesi hesaplanamıyor."));
    }
  }
  notes.push(B("interpretation", "Differences and percentages describe documented delivery against physician targets. They do not grade under/overfeeding, create catch-up requirements, or change doses.", "Farklar ve yüzdeler belgelenmiş alımı hekim hedefleriyle karşılaştırır. Yetersiz/aşırı beslenmeyi derecelendirmez, telafi gereksinimi oluşturmaz veya doz değiştirmez."));
  notes.push(B("nitrogen_limit", "Estimated whole-body nitrogen balance is not proof of net muscle anabolism; no blood-index trend establishes it.", "Tahmini tüm vücut azot dengesi net kas anabolizmasının kanıtı değildir; kan indeksi seyri bunu belirlemez."));
  return { valid, errors, notes, period, scope: scopeFrom(d, m), actual, targets, percent, difference, nitrogen, sourceIds: [...sourceIds] };
}

const blankSummary = () => ({
  days: 0, calendarDays: null, missingDays: null, basis: null, coverageComparable: false,
  totalEnergy: null, totalProtein: null, targetEnergy: null, targetProtein: null,
  energyPercent: null, proteinPercent: null,
});

/**
 * Records: {recordId,input,delivery:{version,measures,output}}; delivery measures
 * may also be supplied directly as record.delivery. All stored outputs ignored.
 * Rows are flattened {recordId,...evaluateDeliveryResult}. Every overlapping
 * member is excluded, including a parseable overlapping unconfirmed revision.
 * selectedIds explicitly chooses revisions before validation/overlap checks.
 * calendarDays/missingDays count aligned 24-hour observation slots spanning the
 * retained intervals, not civil-midnight dates; unavailable for shifted anchors.
 */
export function buildDeliverySeries(records = [], selection = {}) {
  const notes = [], excluded = [], summary = blankSummary();
  const s = safeObject(selection);
  const validSelection = scopeKeys.every((key) => string(s[key], key === "episodeId" ? 80 : key === "targetVersion" ? 160 : Infinity)) &&
    ["icu", "ward"].includes(s.context) && ["early", "late", "recovery"].includes(s.phase);
  if (!validSelection) return { rows: [], excluded, summary, notes: [B("selection_scope", "Choose all five exact scope keys before pooling: case, episode, context, phase and target version.", "Birleştirmeden önce beş kapsam anahtarını tam seçin: olgu, dönem, ortam, faz ve hedef sürümü.")] };
  if (!Array.isArray(records)) return { rows: [], excluded, summary, notes: [B("records", "Delivery records must be an array.", "Gerçekleşen alım kayıtları bir dizi olmalıdır.")] };
  if (s.selectedIds !== undefined && (!Array.isArray(s.selectedIds) || !s.selectedIds.every((id) => string(id, 160))))
    return { rows: [], excluded, summary, notes: [B("selected_ids", "Explicit revision selection must contain record identifiers only.", "Açık revizyon seçimi yalnız kayıt kodları içermelidir.")] };
  const selectedIds = s.selectedIds === undefined ? null : new Set(s.selectedIds);
  const normalizedScope = Object.fromEntries(scopeKeys.map((key) => [key, clean(s[key])]));
  const candidates = [];
  records.forEach((record, index) => {
    const r = safeObject(record);
    if (selectedIds && !selectedIds.has(r.recordId)) return;
    const recordId = string(r.recordId, 160) ? r.recordId : `invalid-record-${index + 1}`;
    const reasons = [];
    if (!string(r.recordId, 160)) reasons.push(B("record_id", "A unique source record identifier is required.", "Benzersiz kaynak kayıt kodu gereklidir."));
    const evaluated = evaluateDelivery(r.input, r.delivery, r.clinicalProfile?.measures);
    if (!scopeKeys.every((key) => evaluated.scope[key] === normalizedScope[key])) {
      excluded.push({ recordId, reasons: [B("scope_mismatch", "This record is outside the exact selected case/episode/context/phase/target period.", "Bu kayıt seçilen tam olgu/dönem/ortam/faz/hedef dönemi kapsamı dışındadır.")] });
      return;
    }
    reasons.push(...evaluated.errors);
    candidates.push({ recordId, evaluated, reasons });
  });

  const intervalCandidates = candidates.filter(({ evaluated: r }) => r.period?.basis && r.period.hours === 24);
  // Duplicate identities are ambiguous even if their windows differ.
  const identityCounts = new Map();
  for (const c of candidates) identityCounts.set(c.recordId, (identityCounts.get(c.recordId) || 0) + 1);
  for (const c of candidates) if (identityCounts.get(c.recordId) > 1)
    c.reasons.push(B("duplicate_identity", "Duplicate source identity: explicitly resolve revisions; neither record is pooled.", "Yinelenen kaynak kimliği: revizyonları açıkça uzlaştırın; iki kayıt da birleştirilmez."));

  const bases = new Set(intervalCandidates.filter((c) => c.evaluated.valid).map((c) => c.evaluated.period.basis));
  if (bases.size > 1) {
    for (const c of intervalCandidates) c.reasons.push(B("series_time_basis", "Wall-time and instant-based intervals cannot be pooled in one series.", "Duvar saati ve an temelli pencereler aynı seride birleştirilemez."));
    notes.push(B("series_time_basis", "Mixed time bases prevent comparable coverage; no calendar-day counts or pooled totals are claimed.", "Karışık zaman temelleri karşılaştırılabilir kapsamı engeller; takvim günü sayısı veya birleşik toplam iddia edilmez."));
  }
  const targetPairs = new Set(candidates.filter((c) => c.evaluated.valid).map((c) => JSON.stringify(c.evaluated.targets)));
  if (targetPairs.size > 1) {
    for (const c of candidates) c.reasons.push(B("target_conflict", "The same target version contains different numeric prescriptions; reconcile or version targets before pooling.", "Aynı hedef sürümünde farklı sayısal reçeteler var; birleştirmeden önce hedefleri uzlaştırın veya sürümleyin."));
    notes.push(B("target_conflict", "Conflicting prescriptions within one target version are excluded, not averaged.", "Bir hedef sürümündeki çelişen reçeteler ortalanmaz, dışlanır."));
  }
  for (let i = 0; i < intervalCandidates.length; i++) {
    for (let j = i + 1; j < intervalCandidates.length; j++) {
      const a = intervalCandidates[i], b = intervalCandidates[j];
      if (a.evaluated.period.basis !== b.evaluated.period.basis) continue;
      const ap = a.evaluated.period, bp = b.evaluated.period;
      if (ap.startMs < bp.endMs && bp.startMs < ap.endMs) {
        for (const c of [a, b]) if (!c.reasons.some((reason) => reason.code === "overlap"))
          c.reasons.push(B("overlap", "Overlapping or duplicate intervals: every involved record is excluded; explicitly select the intended revision.", "Örtüşen veya yinelenen pencereler: ilgili tüm kayıtlar dışlanır; amaçlanan revizyonu açıkça seçin."));
      }
    }
  }
  const rows = candidates.filter((c) => !c.reasons.length).map((c) => ({ recordId: c.recordId, ...c.evaluated }))
    .sort((a, b) => a.period.startMs - b.period.startMs || a.recordId.localeCompare(b.recordId));
  excluded.push(...candidates.filter((c) => c.reasons.length).map(({ recordId, reasons }) => ({ recordId, reasons })));
  if (!rows.length) {
    notes.push(B("no_observations", "No comparable verified observations remain; missing intake is not filled with zero.", "Karşılaştırılabilir doğrulanmış gözlem kalmadı; eksik alım sıfırla doldurulmaz."));
    return { rows, excluded, summary, notes };
  }
  summary.days = rows.length;
  summary.basis = rows[0].period.basis;
  const anchor = rows[0].period.startMs;
  const aligned = rows.every((r) => (r.period.startMs - anchor) % DAY === 0);
  summary.coverageComparable = aligned;
  if (aligned) {
    summary.calendarDays = (rows.at(-1).period.endMs - anchor) / DAY;
    summary.missingDays = summary.calendarDays - rows.length;
  } else notes.push(B("unaligned_coverage", "Daily anchors differ; aggregate observations are shown, but missing whole-day coverage cannot be inferred.", "Günlük başlangıç saatleri farklı; gözlem toplamları gösterilir ancak eksik tam gün kapsamı çıkarılamaz."));
  summary.totalEnergy = rows.reduce((sum, r) => sum + r.actual.energy, 0);
  summary.totalProtein = rows.reduce((sum, r) => sum + r.actual.protein, 0);
  summary.targetEnergy = rows.reduce((sum, r) => sum + r.targets.energy, 0);
  summary.targetProtein = rows.reduce((sum, r) => sum + r.targets.protein, 0);
  summary.energyPercent = summary.totalEnergy / summary.targetEnergy * 100;
  summary.proteinPercent = summary.totalProtein / summary.targetProtein * 100;
  if (summary.basis === "wall") notes.push(B("wall_time", "Coverage uses unzoned wall-clock slots, not verified timezone-aware elapsed days.", "Kapsam, doğrulanmış saat dilimli geçen günler yerine saat dilimsiz duvar saati dilimlerini kullanır."));
  notes.push(B("coverage", "Totals include retained observed intervals only; absent intervals are not zero intake or catch-up debt.", "Toplamlar yalnız korunan gözlem pencerelerini içerir; eksik pencereler sıfır alım veya telafi borcu değildir."));
  return { rows, excluded, summary, notes };
}

/** Copy only known delivery fields; imported confirmations are always cleared.
 * Invalid field names survive in invalidFields even when their values are rejected.
 */
export function restoreDelivery(raw = {}) {
  const restored = {
    episodeId: "", periodStart: "", periodEnd: "", actualEnergy: null, actualProtein: null,
    targetVersion: "", source: "", targetsStable: false, confirmed: false, invalidFields: [],
  };
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    restored.invalidFields.push("delivery");
    return restored;
  }
  const m = deliveryMeasures(raw);
  if (Object.hasOwn(raw, "measures") && (!raw.measures || typeof raw.measures !== "object" || Array.isArray(raw.measures)))
    restored.invalidFields.push("delivery");
  const checks = {
    episodeId: (v) => string(v, 80), targetVersion: (v) => string(v, 160), source: (v) => string(v, 160),
    periodStart: (v) => timestamp(v) !== null, periodEnd: (v) => timestamp(v) !== null,
    actualEnergy: (v) => finite(v, 0, 15000), actualProtein: (v) => finite(v, 0, 500),
    targetsStable: (v) => typeof v === "boolean", confirmed: (v) => typeof v === "boolean",
  };
  if (m.invalidFields !== undefined) {
    if (Array.isArray(m.invalidFields)) restored.invalidFields.push(...m.invalidFields.filter((key) => typeof key === "string" && (Object.hasOwn(checks, key) || key === "delivery")));
    else restored.invalidFields.push("delivery");
  }
  for (const [key, check] of Object.entries(checks)) {
    const value = m[key];
    if (!present(value)) continue;
    if (!check(value)) restored.invalidFields.push(key);
    else if (key !== "confirmed" && key !== "targetsStable") restored[key] = typeof value === "string" && !key.startsWith("period") ? value.trim() : value;
  }
  restored.invalidFields = [...new Set(restored.invalidFields)];
  return restored;
}
