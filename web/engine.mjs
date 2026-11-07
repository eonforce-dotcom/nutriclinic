// NutriClinic staged recommendation engine: pure functions, no I/O, no storage.
// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Gökay Duman
//
// Every rule cites the guideline item it implements (source ids are listed in sources.mjs and
// docs/CLINICAL-RULES.md). When an input is missing the engine still answers with the most cautious
// documented assumption, says which assumption it used, and lists the missing input with its effect.

import { B } from './text.mjs';
import { evaluateScales, swallowStatus, FOIS_TEXT as FOIS_NAMES, IDDSI_FOOD, IDDSI_DRINK } from './scales.mjs';
import { LAB_KEYS, readLab, labIndices, phosphateDrop, labFlags, sofa2, invertedLimits, LIMIT_KEYS } from './labs.mjs';

const IDDSI_NAMES = { food: IDDSI_FOOD, drink: IDDSI_DRINK };

export { B };
export const ENGINE_VERSION = '1.4.0';
export const RULES_DATE = '2026-11-07';
export const INTENDED_USE = B('NutriClinic klinik kararı destekler, yerine geçmez. Her öneri hasta başında, girdileri ve kaynaklarıyla birlikte değerlendirilir.', 'NutriClinic supports clinical decisions and does not replace them. Every recommendation is reviewed at the bedside with its inputs and sources.');

// ---------------------------------------------------------------------------------------------
// Constants taken from the cited guidelines.
const ICU_KCAL_PER_KG = 25;          // espen-icu-2023 commentary: weight-based 20–25 kcal/kg/d without calorimetry
const ICU_CAP_IC = 0.70;             // espen-icu-2023 R17: not exceeding 70% of measured EE (days 1–3)
const ICU_CAP_PREDICTED = 0.65;      // espen-icu-2023 R19: below 70% of the estimate in the first week
const ICU_PROTEIN = 1.3;             // espen-icu-2023 R22 (progressive), R52 (obese: per adjusted weight)
const WARD_KCAL_PER_KG = 27;         // espen-polymorbid-2024 R9; within nice-cg32 1.4.2 (25–35)
const WARD_UNDERWEIGHT_KCAL = 30;    // espen-polymorbid-2024 R10–R11 (reached slowly)
const WARD_PROTEIN = 1.2;            // espen-polymorbid-2024 R12 (1.2–1.5)
const LOW_DOSE_FRACTION = 0.20;      // espen-icu-2023 R38 low-dose EN; sepsis commentary 20–50% of full support
const PROPOFOL_KCAL_PER_ML = 1.1;    // espen-icu-2023 commentary
const PROPOFOL_LIPID_G_PER_ML = 0.1; // 1% propofol in a 10% lipid emulsion
const DEXTROSE_KCAL_PER_G = 3.4;
const GLUCOSE_MAX_G_PER_KG_DAY = 7.2; // espen-icu-2023 R23: ≤5 mg/kg/min
const LIPID_MAX_G_PER_KG_DAY = 1.5;  // espen-icu-2023 R25, including non-nutritional lipids
// Feeding-day progression, fraction of the full target (day 2 ≤50%: nice-cg32 1.4.5;
// full feeding prescribed within 3–7 days: espen-icu-2023 R8). Protein rises with energy and reaches its
// full target when energy reaches the phase cap, so one formula class covers the first ICU week.
const RAMP_ENERGY = [0.40, 0.50, 0.70, 0.85, 1.00];

// Typical label values per product class. Not brand data: editable defaults; every amount is
// recalculated from the label values the clinician enters.
export const PRODUCT_DEFAULTS = {
  'en-standard': { kind: 'en', kcalPerMl: 1.0, proteinPer100: 4.0, waterPer100: 84 },
  'en-high-protein': { kind: 'en', kcalPerMl: 1.25, proteinPer100: 6.3, waterPer100: 80 },
  'en-very-high-protein': { kind: 'en', kcalPerMl: 1.25, proteinPer100: 10.0, waterPer100: 79 },
  'en-dense': { kind: 'en', kcalPerMl: 1.5, proteinPer100: 7.5, waterPer100: 76 },
  'en-low-protein': { kind: 'en', kcalPerMl: 2.0, proteinPer100: 3.0, waterPer100: 70 },
  'ons-high-protein': { kind: 'ons', unit: 'mL', serving: 200, kcal: 300, protein: 20 },
  'ons-texture': { kind: 'ons', unit: 'g', serving: 125, kcal: 200, protein: 12 },
  'protein-module': { kind: 'module', proteinPer100g: 90 },
  'powder': { kind: 'powder', kcalPer100g: 450, proteinPer100g: 17, kcalPerMl: 1.0 },
};
const DENSITY = { 'en-very-high-protein': 8.0, 'en-high-protein': 5.04, 'en-standard': 4.0, 'en-low-protein': 1.5, 'en-dense': 5.0 };
export const PRODUCT_LABELS = {
  'en-standard': B('Standart polimerik enteral mama (izoozmolar, yaklaşık 1,0 kcal/mL)', 'Standard polymeric enteral formula (iso-osmolar, about 1.0 kcal/mL)'),
  'en-high-protein': B('Yüksek proteinli polimerik enteral mama (enerjinin yaklaşık %20’si proteinden)', 'High-protein polymeric enteral formula (about 20% of energy from protein)'),
  'en-very-high-protein': B('Çok yüksek proteinli enteral mama (enerjinin yaklaşık %30’u proteinden)', 'Very-high-protein enteral formula (about 30% of energy from protein)'),
  'en-dense': B('Enerji yoğun (1,5 kcal/mL) yüksek proteinli enteral mama', 'Energy-dense (1.5 kcal/mL) high-protein enteral formula'),
  'en-low-protein': B('Düşük proteinli, düşük elektrolitli enerji yoğun (yaklaşık 2,0 kcal/mL) enteral mama', 'Low-protein, low-electrolyte energy-dense (about 2.0 kcal/mL) enteral formula'),
  'en-label': B('Etiket değerleri girilen enteral mama', 'Enteral formula with entered label values'),
  'en-powder': B('Toz enteral mama (girilen etiket ve sulandırma)', 'Powdered enteral formula (entered label and dilution)'),
  'ons-high-protein': B('Yüksek proteinli, enerji yoğun oral beslenme desteği (ONS)', 'High-protein, energy-dense oral nutritional supplement (ONS)'),
  'ons-texture': B('Kıvamlı (puding veya koyulaştırılmış) yüksek proteinli ONS', 'Texture-modified (pudding or thickened) high-protein ONS'),
};

// ---------------------------------------------------------------------------------------------
// Input normalisation. Unknown = null. Any out-of-range value blocks the calculation (no silent fallback).
const toNumber = (v) => {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (typeof v === 'string') {
    const t = v.trim().replace(',', '.');
    if (!t) return null;
    const x = Number(t);
    return Number.isFinite(x) ? x : null;
  }
  return null;
};
const empty = (v) => v === undefined || v === null || v === '' || v === 'unknown';

// Allowed numeric ranges. The interface uses the same table to show an error next to the field.
export const FIELD_LIMITS = Object.freeze({
  age: { min: 0, max: 120 },
  heightCm: { min: 100, max: 230 },
  weightKg: { min: 15, max: 350 },
  icuDay: { min: 1, max: 365, integer: 'round' },
  oralIntakePct: { min: 0, max: 100 },
  burnsTbsa: { min: 0, max: 100 },
  usualWeightKg: { min: 15, max: 350 },
  weightLossPct: { min: 0, max: 80 },
  lowIntakeDays: { min: 0, max: 365 },
  measuredEE: { min: 300, max: 6000 },
  uun: { min: 0.5, max: 80 },
  uunProtein: { min: 0, max: 400 },
  propofolMlH: { min: 0, max: 100 },
  dextroseG: { min: 0, max: 1500 },
  lossMonths: { min: 0.5, max: 120 },
  ffmKg: { min: 10, max: 150 },
  gripKg: { min: 0, max: 100 },
  chairRiseS: { min: 1, max: 120 },
  asmKg: { min: 5, max: 60 },
  gaitSpeed: { min: 0.05, max: 3 },
  nrsDisease: { min: 0, max: 3, integer: 'strict' },
  nrsNutrition: { min: 0, max: 3, integer: 'strict' },
  sppb: { min: 0, max: 12, integer: 'strict' },
  eat10: { min: 0, max: 40, integer: 'strict' },
  fois: { min: 1, max: 7, integer: 'strict' },
  iddsiFood: { min: 3, max: 7, integer: 'strict' },
  iddsiFluid: { min: 0, max: 4, integer: 'strict' },
  // SOFA-2 inputs (ICU) and the recorded SAPS II total.
  sofaGcs: { min: 3, max: 15, integer: 'strict' },
  sofaPao2: { min: 1, max: 800 },
  sofaFio2: { min: 21, max: 100 },
  sofaMap: { min: 1, max: 200 },
  sofaNe: { min: 0, max: 10 },
  sofaEpi: { min: 0, max: 10 },
  saps2: { min: 0, max: 163, integer: 'strict' },
});
// null when the value is empty or valid; otherwise { code: 'nan' | 'integer' | 'range', min, max }.
export function checkNumber(key, value) {
  const lim = FIELD_LIMITS[key];
  if (!lim || empty(value)) return null;
  const x = toNumber(value);
  if (x === null) return { code: 'nan', ...lim };
  if (lim.integer === 'strict' && !Number.isInteger(x)) return { code: 'integer', ...lim };
  if (x < lim.min || x > lim.max) return { code: 'range', value: x, ...lim };
  return null;
}

export function normalize(raw = {}) {
  const invalid = [];
  const num = (key) => {
    if (empty(raw[key])) return null;
    if (checkNumber(key, raw[key])) { invalid.push(key); return null; }
    const x = toNumber(raw[key]);
    return FIELD_LIMITS[key].integer === 'round' ? Math.round(x) : x;
  };
  const pick = (key, options) => {
    if (empty(raw[key])) return null;
    if (!options.includes(raw[key])) { invalid.push(key); return null; }
    return raw[key];
  };
  const int = (key) => {
    if (empty(raw[key])) return null;
    if (checkNumber(key, raw[key])) { invalid.push(key); return null; }
    return toNumber(raw[key]);
  };
  const flag = (key) => (raw[key] === true || raw[key] === 'yes' ? true : raw[key] === false || raw[key] === 'no' ? false : null);
  const p = {
    setting: pick('setting', ['icu', 'ward']) ?? 'icu',
    age: num('age'),
    sex: pick('sex', ['female', 'male']),
    heightCm: num('heightCm'),
    weightKg: num('weightKg'),
    icuDay: num('icuDay'),
    feeding: pick('feeding', ['none', 'ongoing']),
    swallow: pick('swallow', ['safe', 'modified', 'unsafe']),
    oralIntakePct: num('oralIntakePct'),
    gi: pick('gi', ['ok', 'contraindicated']),
    shock: pick('shock', ['none', 'controlled', 'uncontrolled']),
    hypoxemia: flag('hypoxemia'), giBleed: flag('giBleed'), ischemia: flag('ischemia'),
    fistula: flag('fistula'), acs: flag('acs'), highGrv: flag('highGrv'), aspirationRisk: flag('aspirationRisk'),
    longTube: flag('longTube'),
    feedingMode: pick('feedingMode', ['continuous', 'intermittent']),
    kidney: pick('kidney', ['normal', 'aki', 'ihd', 'crrt']),
    fluidRestriction: flag('fluidRestriction'), diabetes: flag('diabetes'),
    bowel: pick('bowel', ['normal', 'diarrhea', 'constipation']),
    burnsTbsa: num('burnsTbsa'), trauma: flag('trauma'), pressureUlcer: flag('pressureUlcer'),
    stroke: flag('stroke'), pregnant: flag('pregnant'),
    usualWeightKg: num('usualWeightKg'), weightLossPct: num('weightLossPct'),
    lowIntakeDays: num('lowIntakeDays'), lowElectrolytes: flag('lowElectrolytes'),
    alcohol: flag('alcohol'), riskDrugs: flag('riskDrugs'), wernicke: flag('wernicke'),
    hypoPhosphate: flag('hypoPhosphate'),
    measuredEE: num('measuredEE'), uun: num('uun'), uunProtein: num('uunProtein'),
    propofolMlH: num('propofolMlH'), dextroseG: num('dextroseG'),
    // Screening and assessment scales (scales.mjs).
    lossMonths: num('lossMonths'), oedema: flag('oedema'),
    nrsDisease: int('nrsDisease'), nrsNutrition: int('nrsNutrition'), nrsImpaired: flag('nrsImpaired'),
    glimMuscle: pick('glimMuscle', ['normal', 'moderate', 'severe']), glimIntake: flag('glimIntake'), glimInflammation: flag('glimInflammation'),
    aspenContext: pick('aspenContext', ['acute', 'chronic', 'social']),
    aspenIntake: flag('aspenIntake'), aspenWeight: flag('aspenWeight'), aspenMuscle: flag('aspenMuscle'),
    aspenFat: flag('aspenFat'), aspenFluid: flag('aspenFluid'), aspenGrip: flag('aspenGrip'),
    ffmKg: num('ffmKg'), gripKg: num('gripKg'), chairRiseS: num('chairRiseS'), asmKg: num('asmKg'),
    gaitSpeed: num('gaitSpeed'), sppb: int('sppb'), sarcopeniaConfounded: flag('sarcopeniaConfounded'),
    eat10: int('eat10'), fois: int('fois'), iddsiFood: int('iddsiFood'), iddsiFluid: int('iddsiFluid'),
    swallowAssessment: pick('swallowAssessment', ['none', 'bedside', 'fees', 'vfss']),
    impairedAlertness: flag('impairedAlertness'), unsafeSigns: flag('unsafeSigns'),
    sofaGcs: int('sofaGcs'), sofaDelirium: flag('sofaDelirium'), sofaPao2: num('sofaPao2'), sofaFio2: num('sofaFio2'),
    sofaVent: pick('sofaVent', ['none', 'advanced', 'ecmo']), sofaMap: num('sofaMap'), sofaNe: num('sofaNe'), sofaEpi: num('sofaEpi'),
    sofaOtherVaso: flag('sofaOtherVaso'), sofaMechanical: flag('sofaMechanical'),
    sofaUrine: pick('sofaUrine', ['normal', 'oliguria6', 'oliguria12', 'oliguria24', 'anuria12']), saps2: int('saps2'),
  };
  if (p.setting === 'ward') {
    p.icuDay = null; p.measuredEE = null; p.propofolMlH = null; p.trauma = null;
    for (const k of ['sofaGcs', 'sofaDelirium', 'sofaPao2', 'sofaFio2', 'sofaVent', 'sofaMap', 'sofaNe', 'sofaEpi', 'sofaOtherVaso', 'sofaMechanical', 'sofaUrine', 'saps2']) p[k] = null;
  }
  if (p.setting === 'icu') { p.pressureUlcer = null; p.aspenGrip = null; } // grip is not an AND/ASPEN criterion in the ICU
  if (p.sex !== 'female') p.pregnant = null;
  if (p.weightLossPct === null && p.usualWeightKg !== null && p.weightKg !== null) {
    p.weightLossPct = Math.max(0, ((p.usualWeightKg - p.weightKg) / p.usualWeightKg) * 100);
    p.weightLossFromUsual = true;
  }
  // Laboratory values in canonical units (labs.mjs); 25(OH)D and CRP are read here too.
  p.labs = Object.fromEntries(LAB_KEYS.map((key) => [key, readLab(raw, key, invalid)]));
  p.vitD = p.labs.vitD;
  p.crp = p.labs.crp;
  p.product = normalizeProduct(raw.product, invalid);
  return { p, invalid };
}

// Product label values: above 0 and at most the stated maximum.
export const PRODUCT_LIMITS = Object.freeze({
  'en.kcalPerMl': 3,
  'en.proteinPer100': 20,
  'en.waterPer100': 100,
  'ons.serving': 1000,
  'ons.kcal': 1500,
  'ons.protein': 100,
  'module.proteinPer100g': 100,
  'powder.kcalPer100g': 900,
  'powder.proteinPer100g': 100,
  'powder.kcalPerMl': 3,
});
export function checkProduct(path, value) {
  const max = PRODUCT_LIMITS[path];
  if (max === undefined || empty(value)) return null;
  const x = toNumber(value);
  if (x === null) return { code: 'nan', min: 0, max };
  if (x <= 0 || x > max) return { code: 'range', value: x, min: 0, max, exclusiveMin: true };
  return null;
}

function normalizeProduct(raw, invalid) {
  const out = {};
  if (!raw || typeof raw !== 'object') return out;
  const read = (group, key) => {
    const v = raw[group]?.[key];
    if (empty(v)) return null;
    if (checkProduct(`${group}.${key}`, v)) { invalid.push(`product.${group}.${key}`); return null; }
    return toNumber(v);
  };
  const en = { kcalPerMl: read('en', 'kcalPerMl'), proteinPer100: read('en', 'proteinPer100'), waterPer100: read('en', 'waterPer100') };
  if (en.kcalPerMl && en.proteinPer100) out.en = en;
  const ons = { serving: read('ons', 'serving'), kcal: read('ons', 'kcal'), protein: read('ons', 'protein'), unit: raw.ons?.unit === 'g' ? 'g' : 'mL' };
  if (ons.serving && ons.kcal && ons.protein) out.ons = ons;
  const module = read('module', 'proteinPer100g');
  if (module) out.module = { proteinPer100g: module };
  if (raw.form === 'powder') {
    out.form = 'powder';
    const d = PRODUCT_DEFAULTS.powder;
    out.powder = {
      kcalPer100g: read('powder', 'kcalPer100g') ?? d.kcalPer100g,
      proteinPer100g: read('powder', 'proteinPer100g') ?? d.proteinPer100g,
      kcalPerMl: read('powder', 'kcalPerMl') ?? d.kcalPerMl,
    };
  }
  return out;
}

// Tri-state helpers: true / false / null (unknown).
const lt = (x, c) => (x === null ? null : x < c);
const gt = (x, c) => (x === null ? null : x > c);
const anyOf = (...v) => (v.some((x) => x === true) ? true : v.some((x) => x === null) ? null : false);
const allOf = (...v) => (v.every((x) => x === true) ? true : v.some((x) => x === false) ? false : null);
const kidneyFailureOf = (p) => ['aki', 'ihd', 'crrt'].includes(p.kidney);

// ---------------------------------------------------------------------------------------------
// Body weights. Ideal (predicted) weight: ardsnet-2000 formula, floored at BMI 18.5.
// Adjusted weight above BMI 25 (ICU) or 30 (ward): ideal + 25% of the excess (espen-icu-2023 R52
// commentary: add 20–25% of the excess; nice-cg32 1.4.2: lower energy above BMI 25).
export function bodyMetrics(p) {
  const h = p.heightCm;
  const w = p.weightKg;
  const m = { bmi: null, ibw: null, adjusted: null, energyWeight: null, energyWeightKind: null, proteinWeight: null, proteinWeightKind: null, obese: false };
  if (h) {
    const base = p.sex === 'male' ? 50 : 45.5; // unknown sex: female formula (lower, cautious)
    m.ibw = Math.max(base + 0.91 * (h - 152.4), 18.5 * (h / 100) ** 2);
  }
  if (h && w) m.bmi = w / (h / 100) ** 2;
  const threshold = p.setting === 'icu' ? 25 : 30;
  const adjust = (weight, bmi) => (bmi !== null && bmi > threshold && m.ibw && weight > m.ibw ? m.ibw + 0.25 * (weight - m.ibw) : null);
  if (w && !h && w > 100) {
    // Obesity cannot be assessed without height: the most cautious working weight is capped.
    m.energyWeight = 100; m.energyWeightKind = 'capped-no-height';
  } else if (w) {
    m.adjusted = adjust(w, m.bmi);
    m.obese = m.bmi !== null && m.bmi >= 30;
    if (m.adjusted) { m.energyWeight = m.adjusted; m.energyWeightKind = 'adjusted'; }
    else { m.energyWeight = w; m.energyWeightKind = 'actual'; }
  } else if (h) {
    // No weight: the weight at BMI 18.5 (cautious for an unweighed, possibly cachectic patient).
    m.energyWeight = 18.5 * (h / 100) ** 2; m.energyWeightKind = 'bmi18-no-weight';
  }
  // Kidney failure: espen-kidney-2024 R18 — usual (pre-illness) weight preferred over ideal weight;
  // actual weight is not used for protein (oedema). Ideal weight never exceeds the actual weight.
  if (kidneyFailureOf(p) && p.usualWeightKg) {
    const usualBmi = h ? p.usualWeightKg / (h / 100) ** 2 : null;
    const adj = adjust(p.usualWeightKg, usualBmi);
    const capped = !h && p.usualWeightKg > 100; // obesity cannot be assessed without height
    m.proteinWeight = capped ? 100 : adj ?? p.usualWeightKg;
    m.proteinWeightKind = capped ? 'capped-no-height' : adj ? 'usual-adjusted' : 'usual';
    m.energyWeight = m.proteinWeight; m.energyWeightKind = m.proteinWeightKind;
  } else if (kidneyFailureOf(p) && m.ibw && w) {
    m.proteinWeight = Math.min(m.ibw, w); m.proteinWeightKind = m.ibw <= w ? 'ideal' : 'actual';
  } else {
    m.proteinWeight = m.energyWeight; m.proteinWeightKind = m.energyWeightKind;
  }
  return m;
}

// ---------------------------------------------------------------------------------------------
// Refeeding risk (nice-cg32 Box 1, 1.4.5, 1.4.8) and malnutrition (nice-cg32 1.3.1), tri-state.
// "Severe" malnutrition for early PN (espen-icu-2023 R7) uses the Box 1 single criteria.
export function refeedingRisk(p, m) {
  // The NICE weight-loss criteria cover the last 3–6 months: a loss over a longer period cannot be placed in it.
  const wl = p.lossMonths !== null && p.lossMonths > 6 ? null : p.weightLossPct;
  // Oedema or fluid overload hides weight loss and raises the BMI: a criterion "not met" is not reassuring.
  const reliable = (x) => (p.oedema === true && x === false ? null : x);
  const bmiBelow = (c) => reliable(lt(m.bmi, c));
  const lossAbove = (c) => reliable(gt(wl, c));
  const days = p.lowIntakeDays;
  const major = [bmiBelow(16), lossAbove(15), gt(days, 10), p.lowElectrolytes];
  const minor = [bmiBelow(18.5), lossAbove(10), gt(days, 5), anyOf(p.alcohol, p.riskDrugs)];
  const highKnown = major.some((x) => x === true) || minor.filter((x) => x === true).length >= 2;
  const highPossible = major.some((x) => x !== false) || minor.filter((x) => x !== false).length >= 2;
  let level = highKnown ? 'high' : highPossible ? 'unknown' : 'low';
  if (level === 'high' && (lt(m.bmi, 14) === true || gt(days, 15) === true)) level = 'extreme';
  const malnourished = anyOf(bmiBelow(18.5), lossAbove(10), m.bmi !== null && wl !== null ? reliable(m.bmi < 20 && wl > 5) : null);
  const severe = anyOf(bmiBelow(16), lossAbove(15), gt(days, 10), allOf(bmiBelow(18.5), lossAbove(10)));
  return { level, reducedStart: gt(days, 5), malnourished, severe };
}

// ---------------------------------------------------------------------------------------------
// Nitrogen balance from 24-h urine urea nitrogen: NB = protein/6.25 − (UUN + 4).
// Protein guided by urinary nitrogen losses: espen-icu-2023 R51–R52.
export function nitrogenBalance(p) {
  if (p.uun === null || p.uunProtein === null) return { status: 'unknown', reason: 'missing' };
  if (kidneyFailureOf(p)) return { status: 'unknown', reason: 'kidney' };
  const losses = p.uun + 4;
  const nb = p.uunProtein / 6.25 - losses;
  return { status: nb >= 0 ? 'balanced' : 'catabolic', nb, replacementProtein: losses * 6.25, kidneyUnknown: p.kidney === null, diarrhea: p.bowel === 'diarrhea' };
}

// Protein target in g/kg for an absolute ICU day (or the ward), before the day ramp.
function proteinPerKg(p, m, nb, day) {
  const icu = p.setting === 'icu';
  let perKg;
  let range = null;
  const why = [];
  if (icu) {
    if (p.kidney === null) { perKg = 1.0; range = [1.0, 1.3]; why.push('kidney-unknown'); }
    else if (p.kidney === 'aki') { perKg = 1.0; range = [1.0, 1.3]; why.push('kidney-aki'); }
    else if (p.kidney === 'ihd') { perKg = 1.3; range = [1.3, 1.5]; why.push('kidney-ihd'); }
    else if (p.kidney === 'crrt') { perKg = 1.5; range = [1.5, 1.7]; why.push('kidney-crrt'); }
    else { perKg = ICU_PROTEIN; why.push(m.energyWeightKind === 'adjusted' ? 'icu-obese' : 'icu-base'); }
    if (p.trauma === true && p.kidney === 'normal' && day >= 5 && perKg < 1.5) { perKg = 1.5; range = [1.5, 2.0]; why.push('trauma'); }
  } else {
    if (p.kidney === null) { perKg = 1.0; range = [0.8, 1.2]; why.push('ward-kidney-unknown'); }
    else if (p.kidney === 'aki') { perKg = 0.8; range = [0.8, 1.0]; why.push('ward-kidney'); }
    else if (p.kidney === 'ihd') { perKg = 1.2; why.push('ward-ihd'); }
    else if (p.kidney === 'crrt') { perKg = 1.5; range = [1.5, 1.7]; why.push('kidney-crrt'); }
    else { perKg = WARD_PROTEIN; range = [1.2, 1.5]; why.push('ward-base'); }
  }
  // Catabolic escalation only with a measured negative balance and known normal kidneys.
  if (nb.status === 'catabolic' && p.kidney === 'normal' && (!icu || day >= 5) && m.proteinWeight) {
    const need = nb.replacementProtein / m.proteinWeight;
    // Ceiling: 1.5 g/kg; 2.0 in major trauma (espen-icu-2023 trauma commentary 1.5–2); obese 2.0 g/kg ideal weight (R52 commentary).
    const cap = icu ? (m.obese && m.ibw ? (2.0 * m.ibw) / m.proteinWeight : p.trauma === true ? 2.0 : 1.5) : 1.5;
    const raised = Math.min(Math.max(need, perKg), Math.max(cap, perKg));
    if (raised > perKg + 0.001) { perKg = raised; why.push(icu && m.obese ? 'catabolic-obese' : 'catabolic'); }
  }
  return { perKg, range, why };
}

// ---------------------------------------------------------------------------------------------
// Route of feeding (espen-icu-2023, espen-polymorbid-2024, espen-neurology-2018, espen-hen-2022).
function decideRoute(p, rf, severeMalnutrition) {
  const icu = p.setting === 'icu';
  const r = { kind: null, access: null, mode: null, reason: null };
  const gutBlocked = p.gi === 'contraindicated' || p.ischemia === true || p.fistula === true || p.acs === true;
  // Uncontrolled shock: no EN and no PN until resuscitated (espen-icu-2023 R38, R8). The restart plan is
  // parenteral when the gut is also unusable (never enteral into an ischaemic or obstructed gut).
  if (p.shock === 'uncontrolled') {
    r.kind = 'delay'; r.reason = 'shock'; r.gutBlocked = gutBlocked;
    r.access = gutBlocked ? 'iv' : p.aspirationRisk ? 'postpyloric' : 'ng';
    r.mode = 'continuous';
    return r;
  }
  // Gut unusable (espen-icu-2023 R38 delay list; R6 PN within 3–7 days; R7 early progressive PN if severely
  // malnourished: NICE Box 1 single criteria or GLIM stage 2).
  if (gutBlocked) {
    r.reason = p.ischemia ? 'ischemia' : p.acs ? 'acs' : p.fistula ? 'fistula' : 'gut';
    r.kind = !icu || severeMalnutrition || (p.icuDay ?? 1) >= 3 ? 'pn' : 'pn-later';
    r.earlyPn = icu && severeMalnutrition && (p.icuDay ?? 1) < 3;
    r.access = 'iv';
    return r;
  }
  // Other EN delays, in order of severity (R38).
  const delayReason = p.giBleed ? 'giBleed' : p.hypoxemia ? 'hypoxemia' : p.highGrv ? 'grv' : null;
  if (delayReason) { r.kind = 'delay'; r.reason = delayReason; r.access = p.aspirationRisk ? 'postpyloric' : 'ng'; r.mode = 'continuous'; return r; }
  const swallow = p.swallow;
  // Dysphagia with very high aspiration risk: post-pyloric EN (espen-icu-2023 R43).
  if (swallow === 'safe' || (swallow === 'modified' && p.aspirationRisk !== true)) {
    r.kind = 'oral'; r.access = 'oral'; r.mode = 'meals';
    return r;
  }
  r.kind = 'en';
  r.access = p.aspirationRisk ? 'postpyloric' : 'ng'; // gastric first (R10); post-pyloric if high aspiration risk (R12)
  r.mode = icu ? 'continuous' : (p.feedingMode ?? 'continuous'); // ICU continuous (R9); ward by need (HEN R31)
  r.pegPlanned = p.longTube === true; // PEG later, in the stable phase (HEN R7; neurology R66)
  return r;
}

// ---------------------------------------------------------------------------------------------
// Day plan.
const rampAt = (arr, idx) => arr[Math.min(arr.length, Math.max(1, idx)) - 1];
const round = (x, step = 1) => (x === null ? null : Math.round(x / step) * step);

function fullEnergy(p, m) {
  if (!m.energyWeight) return { kcal: null, basis: null };
  if (p.setting === 'icu') {
    if (p.measuredEE) return { kcal: p.measuredEE, basis: 'ic' };
    return { kcal: ICU_KCAL_PER_KG * m.energyWeight, basis: 'icu-weight' };
  }
  if (m.bmi !== null && m.bmi < 16 && p.weightKg) return { kcal: WARD_UNDERWEIGHT_KCAL * p.weightKg, basis: 'ward-underweight' };
  return { kcal: WARD_KCAL_PER_KG * m.energyWeight, basis: 'ward-weight' };
}

function nonNutritional(p) {
  const propofolMl = (p.propofolMlH ?? 0) * 24;
  const propofolKcal = propofolMl * PROPOFOL_KCAL_PER_ML;
  const dextroseKcal = (p.dextroseG ?? 0) * DEXTROSE_KCAL_PER_G;
  return { propofolKcal, propofolLipidG: propofolMl * PROPOFOL_LIPID_G_PER_ML, dextroseKcal, total: propofolKcal + dextroseKcal };
}

function dayTargets(p, m, rf, nb, full, route) {
  const icu = p.setting === 'icu';
  const ic = p.measuredEE !== null;
  const phaseCap = (abs) => (icu ? (ic ? (abs <= 3 ? ICU_CAP_IC : 1) : (abs <= 7 ? ICU_CAP_PREDICTED : 1)) : 1);
  const proteinBase = icu ? (ic ? ICU_CAP_IC : ICU_CAP_PREDICTED) : 1;
  const pnAfterShock = route.kind === 'delay' && route.gutBlocked === true;
  const isPn = route.kind === 'pn' || route.kind === 'pn-later' || pnAfterShock;
  const laterStart = route.kind === 'pn-later' || (pnAfterShock && icu); // PN from ICU day 3 (espen-icu-2023 R6)
  const eatingHalf = route.kind === 'oral' && p.oralIntakePct !== null && p.oralIntakePct >= 50;
  // nice-cg32 1.4.8 ramp for a high risk, and as the cautious assumption while the risk is undetermined.
  const rfRamp = rf.level === 'high' || rf.level === 'extreme' || (rf.level === 'unknown' && !eatingHalf);
  const hypoP = p.hypoPhosphate === true; // espen-icu-2023 R57: restrict 48 h, then increase gradually
  const precaution = !icu && !rfRamp && (rf.reducedStart === true || isPn); // nice-cg32 1.4.5; espen-icu-2023 R8
  const startPerKg = rf.level === 'extreme' ? 5 : 10;
  const firstAbs = laterStart ? Math.max(3, p.icuDay ?? 1) : (p.icuDay ?? 1);
  const days = icu ? 7 : hypoP ? 6 : rfRamp ? 5 : precaution ? 3 : 1;
  const rows = [];
  for (let k = 0; k < days; k += 1) {
    const abs = icu ? firstAbs + k : null;
    // Unknown feeding status = not started (cautious). PN that has not started begins at its own day 1.
    const ongoing = p.feeding === 'ongoing' && !laterStart && !pnAfterShock;
    const idx = ongoing ? (icu ? abs : 5 + k) : k + 1;
    const cap = phaseCap(abs);
    let eFrac = icu ? Math.min(rampAt(RAMP_ENERGY, idx), cap) : 1;
    const cautious = { rf: false, lowDose: false };
    if (rfRamp || hypoP) {
      const startFrac = Math.min(cap, (startPerKg * m.energyWeight) / full.kcal);
      const idxR = hypoP ? (k <= 1 ? 1 : k) : idx;
      const rfFrac = Math.min(cap, startFrac + (cap - startFrac) * Math.min(1, (idxR - 1) / 4));
      if (rfFrac < eFrac || !icu) { eFrac = icu ? Math.min(eFrac, rfFrac) : rfFrac; }
      cautious.rf = true;
    } else if (precaution && idx <= 2) {
      eFrac = 0.5;
      cautious.rf = true;
    }
    // Controlled shock, or shock status not entered: low-dose EN today (espen-icu-2023 R38).
    if (icu && k === 0 && !laterStart && !pnAfterShock && (p.shock === 'controlled' || p.shock === null)) {
      if (eFrac > LOW_DOSE_FRACTION) { eFrac = LOW_DOSE_FRACTION; cautious.lowDose = true; }
    }
    const pFrac = Math.min(1, eFrac / proteinBase);
    const pt = proteinPerKg(p, m, nb, abs ?? 99);
    rows.push({
      k, icuDay: abs, feedDay: idx, energyFraction: eFrac, proteinFraction: pFrac,
      kcal: eFrac * full.kcal, protein: pFrac * pt.perKg * m.proteinWeight,
      proteinPerKgFull: pt.perKg, proteinRange: pt.range, proteinWhy: pt.why,
      cautious: cautious.rf || cautious.lowDose, lowDose: cautious.lowDose,
    });
  }
  return { rows, proteinBase, rfRamp };
}

// Formula class: the most protein-dense class that does not exceed the needed density by more than
// 10%; the rest of the protein comes from a module (espen-kidney-2024 R25: choose by the calorie/protein ratio).
function chooseEnClass(proteinG, kcal, fluidRestricted) {
  if (!kcal || kcal <= 0) return 'en-standard';
  const need = (proteinG / kcal) * 100;
  if (fluidRestricted) return need >= 4.5 ? 'en-dense' : 'en-low-protein';
  return ['en-very-high-protein', 'en-high-protein', 'en-standard', 'en-low-protein'].find((c) => DENSITY[c] <= need * 1.1) ?? 'en-low-protein';
}

function enComposition(cls, product) {
  if (product.form === 'powder') {
    const pw = product.powder;
    const gramsPerMl = pw.kcalPerMl / (pw.kcalPer100g / 100);
    return { kcalPerMl: pw.kcalPerMl, proteinPer100: gramsPerMl * pw.proteinPer100g, waterPer100: null, gramsPerMl, fromLabel: true, powder: true };
  }
  if (product.en) {
    const d = PRODUCT_DEFAULTS[cls] ?? PRODUCT_DEFAULTS['en-standard'];
    return { kcalPerMl: product.en.kcalPerMl, proteinPer100: product.en.proteinPer100, waterPer100: product.en.waterPer100 ?? d.waterPer100, fromLabel: true };
  }
  const d = PRODUCT_DEFAULTS[cls];
  return { kcalPerMl: d.kcalPerMl, proteinPer100: d.proteinPer100, waterPer100: d.waterPer100, fromLabel: false };
}

function feedsFor(volume) {
  if (!volume || volume <= 0) return null;
  const n = Math.min(8, Math.max(4, Math.round(volume / 300)));
  return { n, ml: round(volume / n, 10) };
}

function enRow(row, nn, cls, comp, product, mode, otherProtein = 0, otherKcal = 0) {
  const formulaKcalTarget = Math.max(0, row.kcal - nn.total - otherKcal);
  const exactMl = formulaKcalTarget / comp.kcalPerMl;
  let rate = null;
  let feeds = null;
  let volume;
  if (mode === 'intermittent') {
    feeds = feedsFor(exactMl);
    if (feeds && row.cautious) feeds.ml = Math.floor(exactMl / feeds.n / 10) * 10; // never above a cautious ceiling
    volume = feeds ? feeds.n * feeds.ml : 0;
  } else {
    rate = Math.max(0, row.cautious ? Math.floor(exactMl / 24) : Math.round(exactMl / 24));
    volume = rate * 24;
  }
  const kcal = volume * comp.kcalPerMl;
  const protein = (volume * comp.proteinPer100) / 100;
  const gap = Math.max(0, row.protein - protein - otherProtein);
  const modulePct = product.module?.proteinPer100g ?? PRODUCT_DEFAULTS['protein-module'].proteinPer100g;
  const showModule = gap >= 5 && gap >= 0.05 * row.protein;
  return {
    cls, kcalTarget: row.kcal, proteinTarget: row.protein, formulaKcal: kcal, formulaProtein: protein,
    rate: mode === 'intermittent' ? null : rate, volume, feeds,
    water: comp.waterPer100 ? (volume * comp.waterPer100) / 100 : null,
    powderGrams: comp.powder ? round(volume * comp.gramsPerMl) : null,
    moduleProtein: showModule ? round(gap) : 0, moduleGrams: showModule ? round(gap / (modulePct / 100)) : 0,
    proteinOver: protein + otherProtein > row.protein * 1.2 ? protein + otherProtein - row.protein : 0,
  };
}

// ---------------------------------------------------------------------------------------------
// Supplements: shown only when indicated, with the calculated dose and a route that fits the feeding.
function supplements(p, m, rf, route, plan, scales) {
  const list = [];
  const malnourished = rf.malnourished === true || scales.malnutrition;
  const icu = p.setting === 'icu';
  const w = m.energyWeight; // adjusted weight in obesity, actual otherwise
  const kidneyFailure = kidneyFailureOf(p);
  const noOral = icu || ['pn', 'pn-later', 'delay'].includes(route.kind) || p.swallow === 'unsafe' || p.swallow === null;
  const tablets = !noOral && p.swallow === 'safe';
  // Thiamine — espen-mn-2022 R14.5, R14.6, Table 8; nice-cg32 1.4.8.
  const thiamine = [];
  if (p.wernicke) thiamine.push({ level: 5, dose: B('500 mg × 3/gün IV (glukozdan önce), ensefalopati düzelene kadar; sonra kanıtlanmış eksiklikte 50–100 mg/gün ağızdan', '500 mg three times a day IV (before glucose) until the encephalopathy improves; then 50–100 mg/day orally in proven deficiency'), why: B('Wernicke ensefalopatisi şüphesi', 'Suspected Wernicke encephalopathy') });
  if (rf.level === 'high' || rf.level === 'extreme') {
    thiamine.push({ level: 4, dose: noOral
      ? B('Beslenme başlamadan önce 300 mg IV, sonra en az 3 gün 200–300 mg/gün IV; ilk 10 gün tam doz IV B vitamini preparatı', '300 mg IV before feeding starts, then 200–300 mg/day IV for at least 3 more days; full-dose IV vitamin B preparation for the first 10 days')
      : B(`Beslenmeden hemen önce ve ilk 10 gün 200–300 mg/gün ağızdan; ${tablets ? 'B kompleks (kuvvetli) 1–2 tablet × 3/gün' : 'tablet yutamıyorsa tam doz IV B vitamini preparatı'}`, `200–300 mg/day orally immediately before and for the first 10 days of feeding; ${tablets ? 'vitamin B co strong 1–2 tablets three times a day' : 'full-dose IV vitamin B preparation if tablets cannot be swallowed'}`),
      why: B('Yüksek refeeding riski', 'High refeeding risk') });
  }
  const atRisk = p.alcohol === true || malnourished || gt(p.lowIntakeDays, 5) === true || rf.level === 'unknown';
  if (atRisk) thiamine.push({ level: 3, dose: icu ? B('100 mg × 3/gün IV, yatıştan itibaren 3–4 gün', '100 mg three times a day IV for 3–4 days from admission') : noOral ? B('100 mg × 3/gün IV', '100 mg three times a day IV') : B('100 mg × 3/gün ağızdan ya da IV', '100 mg three times a day orally or IV'),
    why: rf.level === 'unknown' && !(p.alcohol === true || malnourished || gt(p.lowIntakeDays, 5) === true) ? B('Eksiklik riski dışlanamadı (refeeding verisi eksik)', 'Deficiency risk not excluded (refeeding data missing)') : B('Eksiklik riski: alkol, malnütrisyon ya da 5 günden uzun düşük alım', 'At risk of deficiency: alcohol, malnutrition or more than 5 days of low intake') });
  if (icu && (p.icuDay ?? 1) <= 4) thiamine.push({ level: 2, dose: B('100 mg/gün IV (100–300 aralığı), yatıştan itibaren 3–4 gün', '100 mg/day IV (range 100–300) for 3–4 days from admission'), why: B('Yoğun bakıma yatış (ilk 3–4 gün)', 'ICU admission (first 3–4 days)') });
  if (!icu && (gt(p.lowIntakeDays, 0) === true || (p.oralIntakePct !== null && p.oralIntakePct < 75) || ['en', 'pn'].includes(route.kind))) {
    thiamine.push({ level: 2, dose: noOral ? B('100 mg/gün IV', '100 mg/day IV') : B('100 mg/gün ağızdan ya da IV', '100 mg/day orally or IV'), why: B('Serviste son günlerde azalmış besin alımı', 'Reduced food intake in recent days on the ward') });
  }
  if (thiamine.length || p.kidney === 'crrt') {
    const sorted = thiamine.sort((a, b) => b.level - a.level);
    const top = sorted[0];
    const crrtText = B('Sürekli KRT boyunca 100 mg/gün sürdürün.', 'Continue 100 mg/day while on continuous KRT.');
    const dose = top ? (p.kidney === 'crrt' ? B(`${top.dose.tr}. ${crrtText.tr}`, `${top.dose.en}. ${crrtText.en}`) : top.dose) : crrtText;
    const why = sorted.map((t) => t.why);
    if (p.kidney === 'crrt') why.push(B('Sürekli KRT ile kayıp', 'Losses on continuous KRT'));
    list.push({ id: 'thiamine', name: B('Tiamin (B1 vitamini)', 'Thiamine (vitamin B1)'), dose, why, src: rf.level === 'high' || rf.level === 'extreme' ? ['espen-mn-2022', 'nice-cg32'] : ['espen-mn-2022'] });
  }
  // Refeeding electrolytes — nice-cg32 1.4.8 (not automatic with impaired or unknown kidney function).
  if ((rf.level === 'high' || rf.level === 'extreme') && w) {
    if (kidneyFailure || p.kidney === null) {
      list.push({ id: 'electrolytes', name: B('Potasyum, fosfat, magnezyum', 'Potassium, phosphate, magnesium'), dose: B('Böbrek işlevi bozuk ya da bilinmiyor: otomatik doz verilmez; ölçülen düzeylere göre yerine koyun', 'Kidney function impaired or unknown: no automatic dose; replace according to measured levels'), why: [B('Yüksek refeeding riski', 'High refeeding risk')], src: ['nice-cg32', 'espen-icu-2023'] });
    } else {
      list.push({ id: 'electrolytes', name: B('Potasyum, fosfat, magnezyum', 'Potassium, phosphate, magnesium'),
        dose: B((f) => `Potasyum ${f(2 * w)}–${f(4 * w)} mmol/gün; fosfat ${f(0.3 * w)}–${f(0.6 * w)} mmol/gün; magnezyum ${f(0.2 * w)} mmol/gün IV${noOral ? '' : ` (ağızdan ${f(0.4 * w)} mmol/gün)`}. Beslenme öncesi düzeyler yüksekse verilmez; düşük düzeyi beslenmeden önce düzeltmek gerekmez.`,
          (f) => `Potassium ${f(2 * w)}–${f(4 * w)} mmol/day; phosphate ${f(0.3 * w)}–${f(0.6 * w)} mmol/day; magnesium ${f(0.2 * w)} mmol/day IV${noOral ? '' : ` (${f(0.4 * w)} mmol/day orally)`}. Not given if pre-feeding levels are high; low levels need not be corrected before feeding.`),
        why: [B('Yüksek refeeding riski', 'High refeeding risk')], src: ['nice-cg32'] });
    }
  }
  // Multivitamins and trace elements — espen-icu-2023 R34; espen-mn-2022 R1 and introduction; nice-cg32 1.4.8.
  const formulaKcalToday = plan.today?.formulaKcal ?? null;
  if (route.kind === 'pn' || route.kind === 'pn-later' || (route.kind === 'delay' && route.gutBlocked)) {
    list.push({ id: 'mvte', name: B('Multivitamin ve eser element', 'Multivitamins and trace elements'), dose: B('Parenteral beslenmeye her gün IV multivitamin ve eser element ekleyin', 'Add IV multivitamins and trace elements to parenteral nutrition every day'), why: [B('Parenteral beslenme', 'Parenteral nutrition')], src: ['espen-icu-2023', 'espen-mn-2022'] });
  } else if (rf.level === 'high' || rf.level === 'extreme') {
    list.push({ id: 'mvte', name: B('Multivitamin ve eser element', 'Multivitamins and trace elements'), dose: noOral ? B('Dengeli multivitamin-eser element 1 × 1/gün (enteral ya da IV), ilk 10 gün', 'Balanced multivitamin and trace elements once daily (enteral or IV) for the first 10 days') : B('Dengeli multivitamin-eser element 1 × 1/gün, ilk 10 gün', 'Balanced multivitamin and trace element supplement once daily for the first 10 days'), why: [B('Yüksek refeeding riski', 'High refeeding risk')], src: ['nice-cg32'] });
  } else if (route.kind === 'en' && formulaKcalToday !== null && formulaKcalToday < 1500) {
    list.push({ id: 'mvte', name: B('Multivitamin ve mineral', 'Multivitamins and minerals'), dose: B('Mamadan gelen enerji 1500 kcal/günün altındayken: tam multivitamin-mineral 1 × 1/gün (tüpten)', 'While formula energy is below 1500 kcal/day: one complete multivitamin-mineral dose per day (via the tube)'), why: [B((f) => `Bugünkü mama enerjisi ${f(formulaKcalToday)} kcal; mikrobesin içeriği 1500 kcal'lik mamaya göre düzenlenir`, (f) => `Today's formula energy is ${f(formulaKcalToday)} kcal; micronutrient content is designed per 1500 kcal of formula`)], src: ['espen-mn-2022'] });
  }
  // Vitamin D — espen-icu-2023 R36 (no ICU dose: dose and timing uncertain); espen-mn-2022 R24.3–R24.5; violet-2019.
  if (p.vitD !== null && p.vitD < 20) {
    const severe = p.vitD < 12;
    const why = [B((f) => `25(OH)D ${f(p.vitD, 1)} ng/mL (eksiklik <20${severe ? '; ağır eksiklik <12' : ''})`, (f) => `25(OH)D ${f(p.vitD, 1)} ng/mL (deficiency <20${severe ? '; severe <12' : ''})`)];
    const dose = icu
      ? B('Yoğun bakımda ek doz önerilmez: doz ve zamanlama belirsiz, tek seferlik çok yüksek doz yararsız bulundu. Beslenmenin standart D vitamini içeriği verilir (enteral 1500 kcal’de ≥1000 IU; PN ≥200 IU/gün). Servise geçişte 25(OH)D <20 ng/mL sürerse: 4000–5000 IU/gün, 2 ay.', 'No extra dose in the ICU: dose and timing are uncertain and a single ultra-high dose showed no benefit. Give the standard vitamin D content of feeding (enteral ≥1000 IU per 1500 kcal; PN ≥200 IU/day). If 25(OH)D stays <20 ng/mL on the ward: 4000–5000 IU/day for 2 months.')
      : route.kind === 'pn' ? B('PN katkısıyla en az 200 IU/gün; ağızdan/enteral beslenmeye geçince 4000–5000 IU/gün, 2 ay (hedef 25(OH)D 40–60 ng/mL).', 'At least 200 IU/day with PN additives; once oral/enteral feeding resumes, 4000–5000 IU/day for 2 months (target 25(OH)D 40–60 ng/mL).')
        : B('D3 vitamini 4000–5000 IU/gün ağızdan ya da tüpten, 2 ay; hedef 25(OH)D 40–60 ng/mL (ESPEN’in tekrarlayan eksiklik dozu).', 'Vitamin D3 4000–5000 IU/day orally or via the tube for 2 months; target 25(OH)D 40–60 ng/mL (ESPEN dose for recurrent deficiency).');
    list.push({ id: 'vitd', name: B('D3 vitamini (kolekalsiferol)', 'Vitamin D3 (cholecalciferol)'), dose, why, src: icu ? ['espen-icu-2023', 'espen-mn-2022', 'violet-2019'] : ['espen-mn-2022'] });
  }
  // Burns >20% TBSA — zinc espen-mn-2022 R13.6; enteral glutamine espen-icu-2023 R26 (reenergize-2022 found no benefit).
  const enteralFeeding = route.kind === 'en' || route.kind === 'oral';
  const day = p.icuDay ?? 1;
  if (p.burnsTbsa !== null && p.burnsTbsa > 20) {
    list.push({ id: 'zinc', name: B('Çinko', 'Zinc'), dose: B('30–35 mg/gün IV, 2–3 hafta', '30–35 mg/day IV for 2–3 weeks'), why: [B((f) => `Yanık %${f(p.burnsTbsa)} TVYA (>%20): eksüda kaybı`, (f) => `Burn ${f(p.burnsTbsa)}% TBSA (>20%): exudative losses`)], src: ['espen-mn-2022'] });
    if (icu && enteralFeeding && w && day <= 15) {
      if (p.kidney === 'normal') list.push({ id: 'glutamine', name: B('Glutamin (enteral)', 'Glutamine (enteral)'), dose: B((f) => `${f(0.3 * w)}–${f(0.5 * w)} g/gün (0,3–0,5 g/kg), protein hedefine ek; enteral beslenme başlar başlamaz 10–15 gün, 3 doza bölünerek`, (f) => `${f(0.3 * w)}–${f(0.5 * w)} g/day (0.3–0.5 g/kg) in addition to the protein target, from the start of enteral feeding for 10–15 days, in 3 divided doses`), why: [B('Yanık >%20 TVYA (ESPEN 2023 R26). En büyük RCT (RE-ENERGIZE, n=1200) yarar göstermedi; ESPEN öneriyi korudu.', 'Burn >20% TBSA (ESPEN 2023 R26). The largest RCT (RE-ENERGIZE, n=1200) showed no benefit; ESPEN kept the recommendation.')], src: ['espen-icu-2023', 'reenergize-2022'] });
      else list.push({ id: 'glutamine', name: B('Glutamin (enteral)', 'Glutamine (enteral)'), dose: B('Böbrek işlevi bilinmeden ya da AKI varken ek glutamin verilmez; böbrek işlevi normalse 0,3–0,5 g/kg/gün.', 'No extra glutamine while kidney function is unknown or in AKI; with normal kidney function 0.3–0.5 g/kg/day.'), why: [B('Yanık >%20 TVYA; böbrek işlevi doğrulanmadı', 'Burn >20% TBSA; kidney function not confirmed')], src: ['espen-icu-2023'] });
    }
  } else if (p.trauma === true && icu && enteralFeeding && w && day <= 5) {
    if (p.kidney === 'normal') list.push({ id: 'glutamine', name: B('Glutamin (enteral)', 'Glutamine (enteral)'), dose: B((f) => `${f(0.2 * w)}–${f(0.3 * w)} g/gün (0,2–0,3 g/kg), enteral beslenmeyle ilk 5 gün (yara iyileşmesi bozuksa 10–15 gün)`, (f) => `${f(0.2 * w)}–${f(0.3 * w)} g/day (0.2–0.3 g/kg) with enteral feeding for the first 5 days (10–15 days if wound healing is complicated)`), why: [B('Majör travma (ESPEN 2023 R27, kanıt düzeyi 0)', 'Major trauma (ESPEN 2023 R27, grade 0)')], src: ['espen-icu-2023'] });
  }
  // Pressure ulcer on the ward — espen-polymorbid-2024 R16 (grade 0; doses of the cited RCT).
  if (p.pressureUlcer === true && !icu && enteralFeeding) {
    list.push(p.kidney === 'normal'
      ? { id: 'ulcer-mix', name: B('Arjinin + glutamin + HMB', 'Arginine + glutamine + HMB'), dose: B('Arjinin 14 g + glutamin 14 g + kalsiyum-HMB 2,4 g/gün, oral ya da enteral beslenmeye ek', 'Arginine 14 g + glutamine 14 g + calcium HMB 2.4 g per day, added to oral or enteral feeding'), why: [B('Bası yarası iyileşmesi (ESPEN 2024 R16, kanıt düzeyi 0)', 'Pressure ulcer healing (ESPEN 2024 R16, grade 0)')], src: ['espen-polymorbid-2024'] }
      : { id: 'ulcer-mix', name: B('Arjinin + glutamin + HMB', 'Arginine + glutamine + HMB'), dose: B('Böbrek işlevi bilinmeden ya da eGFR <30 iken bu amino asit yükü verilmez; böbrek normalse arjinin 14 g + glutamin 14 g + Ca-HMB 2,4 g/gün.', 'Not given while kidney function is unknown or eGFR <30; with normal kidneys arginine 14 g + glutamine 14 g + Ca-HMB 2.4 g/day.'), why: [B('Bası yarası; böbrek işlevi doğrulanmadı', 'Pressure ulcer; kidney function not confirmed')], src: ['espen-polymorbid-2024'] });
  }
  return list;
}

// ---------------------------------------------------------------------------------------------
// Missing data, ordered by impact on the recommendation.
function missingData(p, m, rf, nb, route, scales) {
  const out = [];
  const add = (field, card, impact, text, focus = field) => out.push({ field, card, impact, text, focus });
  const icu = p.setting === 'icu';
  if (!p.weightKg) add('weightKg', 1, 'critical', p.heightCm ? B('Kilo yok: miktarlar BKİ 18,5’e karşılık gelen kiloyla (temkinli) hesaplandı. Gerçek kilo girilince düzelir.', 'Weight missing: amounts use the weight at BMI 18.5 (cautious). Enter the actual weight to correct them.') : B('Kilo ve boy yok: miktar hesaplanamaz.', 'Weight and height missing: amounts cannot be calculated.'));
  if (!p.heightCm) add('heightCm', 1, m.energyWeightKind === 'capped-no-height' ? 'critical' : 'high', m.energyWeightKind === 'capped-no-height' ? B('Boy yok ve kilo 100 kg üzerinde: obezite değerlendirilemediği için hesap 100 kg ile sınırlandı.', 'Height missing and weight above 100 kg: obesity cannot be assessed, so the calculation is capped at 100 kg.') : B('Boy yok: BKİ, ideal ve düzeltilmiş kilo hesaplanamadı; obezite ve zayıflıkta hedef değişir, refeeding riski eksik değerlendirildi.', 'Height missing: BMI, ideal and adjusted weight cannot be calculated; targets change in obesity and underweight, and refeeding risk is incompletely assessed.'));
  if (p.age === null) add('age', 1, 'high', B('Yaş yok: erişkin kabul edildi.', 'Age missing: assumed adult.'));
  if (!p.sex && p.heightCm) add('sex', 1, 'medium', B('Cinsiyet yok: ideal kilo kadın formülüyle (daha düşük) hesaplandı.', 'Sex missing: ideal weight uses the female formula (lower).'));
  if (icu && p.icuDay === null) add('icuDay', 1, 'high', B('Yoğun bakım günü yok: 1. gün kabul edildi (en temkinli hedef).', 'ICU day missing: day 1 assumed (most cautious target).'));
  if (p.feeding === null && route.kind !== 'pn-later') add('feeding', 2, 'medium', B('Beslenmenin başlayıp başlamadığı girilmedi: başlamadığı kabul edildi, en düşük basamaktan başlandı.', 'Whether feeding has started is not entered: assumed not started, so the first step is used.'));
  if (p.swallow === null && !['pn', 'pn-later'].includes(route.kind)) add('swallow', 2, 'high', B('Yutma değerlendirilmedi: güvenli kabul edilmedi, tüple beslenme önerildi.', 'Swallowing not assessed: not assumed safe; tube feeding recommended.'));
  if (route.kind === 'oral' && p.oralIntakePct === null) add('oralIntakePct', 2, 'high', B('Ağızdan alım yüzdesi yok: ONS en az miktarla önerildi. Alım girilince ONS ya da tüp gereği kesinleşir.', 'Oral intake percentage missing: ONS given at the minimum amount. Entering intake decides ONS versus tube feeding.'));
  if (p.gi === null) add('gi', 2, 'medium', B('Sindirim kanalının kullanılabilirliği girilmedi: kullanılabilir kabul edildi.', 'Gut usability not entered: assumed usable.'));
  if (icu && p.shock === null) add('shock', 2, 'high', B('Şok durumu girilmedi: temkin için bugün düşük doz (%20) verildi; kontrolsüz şokta beslenme ertelenir.', 'Shock status not entered: a low dose (20%) is used today as a precaution; feeding is delayed in uncontrolled shock.'));
  if (p.kidney === null) add('kidney', 3, 'high', B('Böbrek durumu girilmedi: temkin için protein 1,0 g/kg alındı ve ek amino asit önerilmedi. Böbrek normalse protein yükselir.', 'Kidney status not entered: protein set at 1.0 g/kg as a precaution and no extra amino acids given. With normal kidneys protein goes up.'));
  if (kidneyFailureOf(p) && !p.usualWeightKg) {
    add('usualWeightKg', 4, 'medium', m.proteinWeightKind === 'ideal'
      ? B('Olağan (hastalık öncesi) kilo yok: böbrek hastasında protein ideal kiloyla hesaplandı (ödem nedeniyle gerçek kilo kullanılmaz).', 'Usual (pre-illness) weight missing: protein uses ideal weight in kidney disease (actual weight is not used because of oedema).')
      : B('Olağan kilo yok: böbrek hastasında protein, ödemi de içerebilen güncel kiloyla hesaplandı.', 'Usual weight missing: protein in kidney disease uses the current weight, which may include oedema.'));
  }
  if (rf.level === 'unknown') {
    // Weight loss and days of low intake are asked on card 4; K/P/Mg, alcohol and drugs on card 5.
    const card4 = p.weightLossPct === null || p.lowIntakeDays === null || m.bmi === null;
    add('refeeding', card4 ? 4 : 5, 'high', B('Refeeding riski belirlenemedi (kilo kaybı, düşük alım süresi, beslenme öncesi K/P/Mg, alkol ve ilaçlar): temkin için yavaş başlangıç ve tiamin uygulandı.', 'Refeeding risk undetermined (weight loss, days of low intake, pre-feeding K/P/Mg, alcohol and drugs): a slow start and thiamine are used as a precaution.'), card4 ? 'weightLossPct' : 'lowElectrolytes');
  }
  const unjudged = p.feeding !== 'ongoing' && p.lowElectrolytes !== true ? ['potassium', 'phosphate', 'magnesium'].filter((k) => p.labs[k] !== null && p.labs[`${k}Low`] === null) : [];
  if (unjudged.length) add('lab-limits', 7, p.lowElectrolytes === null ? 'high' : 'medium', B(`${unjudged.map((k) => LAB_WORD[k].tr).join(', ')} girildi ama laboratuvarınızın alt sınırı yok: beslenme öncesi düşük olup olmadığını belirleyemem. Alt sınırı girin ya da 5. adımdaki "K, P ya da Mg düşük mü?" sorusunu yanıtlayın.`, `${unjudged.map((k) => LAB_WORD[k].en).join(', ')} entered without your laboratory's lower limit: I cannot tell whether the pre-feeding level is low. Enter the lower limit or answer "Low K, P or Mg?" in step 5.`), `${unjudged[0]}Low`);
  if (p.weightLossPct !== null && p.weightLossPct > 5 && p.lossMonths === null) add('lossMonths', 4, 'medium', B('Kilo kaybının süresi girilmedi: NRS 2002 ve GLIM kaybı süresine göre puanlar; NICE refeeding ölçütü için son 3–6 ay kabul edildi.', 'Duration of the weight loss missing: NRS 2002 and GLIM grade the loss by its duration; the NICE refeeding criteria assume the last 3–6 months.'));
  if (!icu && scales.nrs.status === 'incomplete') {
    if (p.nrsDisease === null) add('nrsDisease', 4, 'medium', B('NRS 2002 tamamlanmadı: hastalık şiddetini seçerseniz beslenme riskini hesaplarım. Risk yoksa ONS önerilmez; risk varsa ONS ve hedefler kesinleşir.', 'NRS 2002 incomplete: choose the disease severity and I calculate the nutritional risk. Without risk no ONS is given; with risk ONS and targets are confirmed.'));
    else add('nrsNutrition', 4, 'low', B('NRS 2002 beslenme puanı eksik verilerle hesaplandı (kilo kaybı ve süresi, BKİ ile genel durum, son haftadaki alım): eksikleri girin ya da puanı doğrudan seçin.', 'The NRS 2002 nutrition score was calculated from incomplete data (weight loss and its duration, BMI with general condition, intake in the last week): enter them or choose the score directly.'));
  }
  const severeRuledOut = scales.glim.phenotype === false || (scales.glim.status === 'met' && scales.glim.stageExact);
  if (route.kind === 'pn-later' && !scales.glim.severe && !severeRuledOut) add('glimMuscle', 4, 'high', B('Sindirim kanalı kullanılamıyor: ağır malnütrisyon (GLIM evre 2) varsa parenteral beslenme 3. günü beklemeden, kademeli başlar. Kilo kaybı ve süresi, BKİ ya da kas kitlesi girilirse belirlenir.', 'The gut cannot be used: with severe malnutrition (GLIM stage 2) parenteral nutrition starts progressively without waiting for day 3. Weight loss and its duration, BMI or muscle mass decide it.'));
  else if (!icu && scales.nrs.status === 'risk' && scales.glim.status === 'incomplete') add('glimMuscle', 4, 'low', B('Beslenme riski var; GLIM tamamlanmadı: kas kitlesi ile alım ve inflamasyon ölçütleri girilirse malnütrisyon tanısı ve evresi belirlenir.', 'Nutritional risk present; GLIM incomplete: muscle mass and the intake and inflammation criteria decide the diagnosis and stage of malnutrition.'));
  if (route.kind === 'oral' && p.swallow === 'modified' && p.iddsiFluid === null) add('iddsiFluid', 2, 'medium', B('IDDSI sıvı düzeyi girilmedi: kıvamlı (puding ya da koyulaştırılmış) ONS seçildi. Yutma değerlendirmesindeki düzeyi girerseniz ONS türünü ve kıvamını kesinleştiririm.', 'IDDSI drink level not entered: a texture-modified (pudding or thickened) ONS is chosen. Enter the level from the swallowing assessment to confirm the ONS type and thickness.'));
  if (p.stroke === true && route.kind === 'oral' && p.swallowAssessment === null) add('swallowAssessment', 2, 'high', B('İnme: ağızdan beslenmeden önce resmî yutma taraması yapılmalıdır (ESPEN 2018 öneri 52). Yapılan yutma değerlendirmesini girin.', 'Stroke: a formal dysphagia screen is needed before oral intake (ESPEN 2018 recommendation 52). Enter the swallowing assessment that was done.'));
  if (icu && p.measuredEE === null) add('measuredEE', 6, 'medium', B('İndirekt kalorimetri yok: enerji 25 kcal/kg tahminiyle hesaplandı. Ventilatördeki hastada kalorimetri önerilir.', 'No indirect calorimetry: energy uses the 25 kcal/kg estimate. Calorimetry is recommended in ventilated patients.'));
  if (nb.status === 'unknown') add('uun', 6, 'medium', nb.reason === 'kidney' ? B('Böbrek yetmezliğinde idrar üre azotu azot kaybını yansıtmaz: katabolik durum ölçülemedi; rutin protein hedefi kullanıldı.', 'In kidney failure urinary urea nitrogen does not reflect nitrogen loss: catabolic state not measured; routine protein target used.') : B('24 saatlik idrar üre azotu ve o günkü protein alımı yok: anabolik/katabolik durum belirlenemedi; rutin protein hedefi kullanıldı.', '24-h urine urea nitrogen and that day’s protein intake missing: anabolic/catabolic state undetermined; routine protein target used.'));
  if (icu && p.propofolMlH === null) add('propofolMlH', 6, 'medium', B('Propofol hızı girilmedi: beslenme dışı kalori sıfır kabul edildi (propofol 1,1 kcal/mL); propofol alıyorsa fazla beslenme olur.', 'Propofol rate not entered: non-nutritional calories assumed zero (propofol 1.1 kcal/mL); if propofol runs, this overfeeds.'));
  if (icu && p.dextroseG === null) add('dextroseG', 6, 'medium', B('IV dekstroz girilmedi: sıfır kabul edildi.', 'IV dextrose not entered: assumed zero.'));
  if (p.vitD === null && ((icu && (p.icuDay ?? 1) >= 7) || rf.malnourished === true || scales.malnutrition || (p.age ?? 0) >= 65)) add('vitD', 7, 'low', B('25(OH)D ölçülmedi: risk taşıyan hastada D vitamini durumu belirlenebilir.', '25(OH)D not measured: vitamin D status can be checked in patients at risk.'));
  if (p.bowel === null) add('bowel', 3, 'low', B('Dışkılama (ishal/kabızlık) girilmedi: ishal ya da kabızlığa göre lif seçimi yapılmadı.', 'Bowel pattern (diarrhoea/constipation) not entered: no fibre choice for diarrhoea or constipation.'));
  if (!icu && p.crp === null) add('crp', 7, 'low', B('CRP girilmedi: CRP >100 mg/L olan servis hastasında beslenme desteğine yanıt azalır.', 'CRP not entered: ward patients with CRP >100 mg/L respond less to nutritional support.'));
  const order = { critical: 0, high: 1, medium: 2, low: 3 };
  return out.sort((a, b) => order[a.impact] - order[b.impact]);
}

// ---------------------------------------------------------------------------------------------
// Monitoring (espen-icu-2023 R53–R57; nice-cg32 1.4.8; espen-neurology-2018 R60).
function monitoring(p, rf, route) {
  const out = [];
  const icu = p.setting === 'icu';
  out.push(B('Kan şekeri: başlangıçta ve ilk 2 gün en az 4 saatte bir; 180 mg/dL (10 mmol/L) üzerinde insülin.', 'Blood glucose: at start and at least every 4 h for the first 2 days; insulin above 180 mg/dL (10 mmol/L).'));
  if (icu || rf.level !== 'low' || p.hypoPhosphate) out.push(B('K, Mg, fosfat: ilk hafta en az günde bir. Fosfat <0,65 mmol/L ya da >0,16 mmol/L düşüş (refeeding hipofosfatemisi): günde 2–3 kez ölçüp yerine koyun, enerjiyi 48 saat kısıtlayıp sonra yavaşça artırın.', 'K, Mg, phosphate: at least daily in the first week. Phosphate <0.65 mmol/L or a drop >0.16 mmol/L (refeeding hypophosphataemia): measure 2–3 times a day and replace; restrict energy for 48 h, then increase slowly.'));
  if (rf.level === 'extreme') out.push(B('Aşırı refeeding riski: kalp ritmini sürekli izleyin; sıvı dengesini yakından izleyin.', 'Extreme refeeding risk: monitor cardiac rhythm continuously; monitor fluid balance closely.'));
  if (route.kind === 'en' || (route.kind === 'delay' && route.reason !== 'grv' && !route.gutBlocked)) out.push(B('Mide aspiratı 6 saatte 500 mL’yi aşarsa enteral beslenmeyi erteleyin; prokinetik ve gerekirse postpilorik tüp.', 'If gastric aspirate exceeds 500 mL in 6 h, delay enteral feeding; prokinetics and, if needed, a post-pyloric tube.'));
  if (p.swallow === 'modified') out.push(B('Kıvam ayarlı diyette sıvı ve besin alımını günlük izleyin; yutma değerlendirmesini düzenli tekrarlayın.', 'With texture-modified diets monitor fluid and food intake daily; repeat the swallowing assessment regularly.'));
  return out;
}

// ---------------------------------------------------------------------------------------------
// Condition-specific notes (only when relevant).
function clinicalNotes(p, m, route, plan, scales) {
  const notes = [];
  const icu = p.setting === 'icu';
  const w = m.energyWeight;
  if (route.kind === 'delay' && route.reason === 'grv' && w) {
    notes.push({ text: B((f) => `Mide aspiratı >500 mL/6 sa: karında akut bir sorun yoksa prokinetik başlayın. Birinci seçenek IV eritromisin ${f(3 * w)}–${f(7 * w)} mg/gün (3–7 mg/kg/gün); alternatif IV metoklopramid 10 mg × 3/gün ya da ikisi birlikte. Düzelmezse postpilorik tüp.`, (f) => `Gastric aspirate >500 mL/6 h: if the abdomen shows no acute problem, start a prokinetic. First choice IV erythromycin ${f(3 * w)}–${f(7 * w)} mg/day (3–7 mg/kg/day); alternative IV metoclopramide 10 mg three times a day, or both. If not resolved, a post-pyloric tube.`), src: ['espen-icu-2023'] });
  }
  if (route.kind === 'delay' && route.reason === 'shock') notes.push({ text: route.gutBlocked
    ? B('Kontrolsüz şokta beslenme başlatılmaz. Sindirim kanalı da kullanılamadığı için şok kontrol altına alınınca enteral değil parenteral beslenme planlanır (yoğun bakımda 3–7. günler arasında).', 'No feeding is started in uncontrolled shock. Because the gut is also unusable, once shock is controlled the plan is parenteral, not enteral (between ICU days 3 and 7).')
    : B('Kontrolsüz şokta enteral ya da parenteral beslenme başlatılmaz. Sıvı ve vazopressörle perfüzyon hedefleri sağlanınca düşük dozla başlayın.', 'Neither enteral nor parenteral feeding is started in uncontrolled shock. Once perfusion goals are met with fluids and vasopressors, start at a low dose.'), src: ['espen-icu-2023'] });
  if (route.kind === 'pn-later') notes.push({ text: B('Sindirim kanalı kullanılamıyor ve ağır malnütrisyon yok: parenteral beslenme 3–7. günler arasında başlatılır. Enteral yolu her gün yeniden değerlendirin.', 'The gut cannot be used and there is no severe malnutrition: parenteral nutrition starts between days 3 and 7. Reassess the enteral route daily.'), src: ['espen-icu-2023'] });
  if (p.diabetes === true) {
    notes.push({ text: icu
      ? B('Diyabet/hiperglisemi: mama türü değişmez; kan şekerini izleyin, 180 mg/dL (10 mmol/L) üzerinde insülin.', 'Diabetes/hyperglycaemia: the formula class does not change; monitor glucose, insulin above 180 mg/dL (10 mmol/L).')
      : B('Diyabet: hastanede hastalığa özgü ek ürünün rutin yararı gösterilmedi; kan şekerine göre tedavi. Evde uzun süreli tüple beslenmede düşük şekerli, yavaş sindirilen karbonhidratlı ve tekli doymamış yağdan zengin formül kullanılabilir.', 'Diabetes: no routine benefit of disease-specific products in hospital; treat glucose. For long-term home tube feeding a formula with less sugar, slowly digestible carbohydrate and more monounsaturated fat may be used.'),
      src: icu ? ['espen-icu-2023'] : ['espen-polymorbid-2024', 'espen-hen-2022'] });
  }
  if (p.stroke === true && ['en', 'delay'].includes(route.kind)) {
    notes.push({ text: B('İnme: 7 günden uzun sürmesi beklenen ağır disfajide ve ventilatördeki bilinci kapalı hastada en geç 72 saatte nazogastrik tüple beslenme başlayın. 28 günden uzun tüp gerekecekse PEG’i stabil dönemde (14–28. günler) planlayın; 48 saatten uzun ventilasyonda PEG ilk hafta içinde düşünülebilir.', 'Stroke: start nasogastric feeding within 72 h in severe dysphagia expected to last more than 7 days and in ventilated patients with reduced consciousness. If a tube is needed for more than 28 days, plan a PEG in the stable phase (days 14–28); with ventilation beyond 48 h a PEG may be considered within the first week.'), src: ['espen-neurology-2018'] });
  }
  if (route.pegPlanned) notes.push({ text: B('Tüple beslenme 4 haftadan uzun sürecekse PEG planlanır; stabil döneme kadar nazogastrik tüp kullanılır. Sorunsuz PEG sonrası beslenme 2–4 saat içinde başlayabilir.', 'If tube feeding will last beyond 4 weeks, plan a PEG; use a nasogastric tube until the stable phase. After an uncomplicated PEG, feeding can start within 2–4 h.'), src: ['espen-hen-2022', 'espen-neurology-2018'] });
  if (route.access === 'postpyloric') notes.push({ text: B('Aspirasyon riski çok yüksek: postpilorik (tercihen jejunal) tüp. Yerleştirilemezse ve yutma eğitimi sürüyorsa geçici parenteral beslenme düşünülebilir.', 'Very high aspiration risk: post-pyloric (preferably jejunal) tube. If it cannot be placed and swallowing training is ongoing, temporary parenteral nutrition can be considered.'), src: ['espen-icu-2023'] });
  if (route.kind === 'en' && icu) notes.push({ text: B('Yoğun bakımda mama pompayla sürekli verilir (bolus değil); başlangıç yolu mide. Mide intoleransı prokinetikle düzelmezse postpilorik tüp.', 'In the ICU the formula runs continuously by pump (not bolus); gastric access first. Post-pyloric if gastric intolerance persists despite prokinetics.'), src: ['espen-icu-2023'] });
  if (route.kind === 'oral' && p.swallow === 'modified' && p.iddsiFood === null && p.iddsiFluid === null) notes.push({ text: B('Disfaji: kıvam ayarlı, enerji ve protein bakımından zenginleştirilmiş diyet; sıvıların kıvamını (IDDSI düzeyi) yutma değerlendirmesi belirler. Yutma güvenli değilse tüple beslenmeye geçin.', 'Dysphagia: texture-modified, energy- and protein-enriched diet; the fluid thickness (IDDSI level) is set by the swallowing assessment. If swallowing is unsafe, switch to tube feeding.'), src: ['espen-icu-2023', 'espen-neurology-2018', 'espen-geriatrics-2022'] });
  if (p.bowel === 'diarrhea') notes.push({ text: ['en', 'delay'].includes(route.kind) ? B('İshal enteral beslenmeyi durdurma nedeni değildir; lifli mama ve sürekli (bolus olmayan) uygulama ishali azaltır. Nedenlerini (ilaç, enfeksiyon) araştırın.', 'Diarrhoea is not a reason to stop enteral feeding; fibre-containing formula and continuous (non-bolus) delivery reduce diarrhoea. Look for causes (drugs, infection).') : B('İshal: beslenmeyi kesmeyin; nedenlerini (ilaç, enfeksiyon) araştırın ve sıvı kaybını izleyin.', 'Diarrhoea: do not stop feeding; look for causes (drugs, infection) and monitor fluid losses.'), src: ['espen-icu-2023', 'espen-hen-2022'] });
  if (p.bowel === 'constipation') notes.push({ text: B('Kabızlık: lif içeren mama/ONS ve yeterli sıvı; laksatif kurum protokolüne göre.', 'Constipation: fibre-containing formula/ONS and adequate fluid; laxatives per local protocol.'), src: ['espen-hen-2022'] });
  if (!icu && p.crp !== null && p.crp > 100) notes.push({ text: B((f) => `CRP ${f(p.crp)} mg/L (>100): yüksek inflamasyonda servis hastaları beslenme desteğine yanıt vermedi (EFFORT ikincil analizi). Hedefleri zorlamadan sürdürün; inflamasyon gerileyince yeniden değerlendirin.`, (f) => `CRP ${f(p.crp)} mg/L (>100): with high inflammation ward patients did not respond to nutritional support (EFFORT secondary analysis). Continue without forcing targets; reassess when inflammation settles.`), src: ['espen-polymorbid-2024'] });
  if (plan?.lipidLow) notes.push({ text: B('Propofol lipidi günlük lipit sınırına yaklaşıyor: lipitsiz ya da düşük lipitli parenteral karışım seçin.', 'Propofol lipid approaches the daily lipid limit: choose a lipid-free or low-lipid parenteral mixture.'), src: ['espen-icu-2023'] });
  if (p.hypoPhosphate) notes.push({ text: B('Beslenme sırasında refeeding hipofosfatemisi: enerji 48 saat başlangıç düzeyinde tutuldu, sonra yavaşça artırılıyor (tablo). Fosfatı kurum protokolüyle yerine koyun; K/Mg/P günde 2–3 kez.', 'Refeeding hypophosphataemia during feeding: energy held at the starting level for 48 h, then increased slowly (table). Replace phosphate per local protocol; K/Mg/P 2–3 times a day.'), src: ['espen-icu-2023'] });
  notes.push(...scaleNotes(p, route, scales));
  if (p.labFindings?.includes('hypoPhosphate')) notes.push({ text: B((f) => `Fosfor ${f(p.labs.phosphate, 2)} mmol/L${p.labs.phosphateBefore !== null ? ` (beslenme öncesi ${f(p.labs.phosphateBefore, 2)})` : ''}: refeeding hipofosfatemisi laboratuvardan belirlendi (<0,65 mmol/L ya da >0,16 mmol/L düşüş).`, (f) => `Phosphate ${f(p.labs.phosphate, 2)} mmol/L${p.labs.phosphateBefore !== null ? ` (before feeding ${f(p.labs.phosphateBefore, 2)})` : ''}: refeeding hypophosphataemia found from the laboratory values (<0.65 mmol/L or a fall >0.16 mmol/L).`), src: ['espen-icu-2023'] });
  if (p.labFindings?.includes('lowBeforeFeeding')) notes.push({ text: B(`Beslenme öncesi düşük: ${p.lowLabKeys.map((k) => LAB_WORD[k].tr).join(', ')}. Düşük düzey refeeding riskini yüksek yapar (NICE Kutu 1).`, `Low before feeding: ${p.lowLabKeys.map((k) => LAB_WORD[k].en).join(', ')}. A low level makes the refeeding risk high (NICE Box 1).`), src: ['nice-cg32'] });
  if (p.labFindings?.includes('lowDuringFeeding')) notes.push({ text: B(`Beslenme sırasında ${p.lowLabKeys.map((k) => LAB_WORD[k].tr).join(' ve ')} laboratuvarınızın alt sınırının altında: kurum protokolüyle yerine koyun, düzeyleri sık izleyin.`, `During feeding ${p.lowLabKeys.map((k) => LAB_WORD[k].en).join(' and ')} is below your laboratory's lower limit: replace per local protocol and monitor levels closely.`), src: ['nice-cg32'] });
  if (p.labFindings?.includes('normalBeforeFeeding')) notes.push({ text: B('Potasyum, fosfor ve magnezyum laboratuvarınızın alt sınırının üstünde: "beslenme öncesi düşük" ölçütü yok.', 'Potassium, phosphate and magnesium are above your laboratory\'s lower limits: the "low before feeding" criterion is absent.'), src: ['nice-cg32'] });
  return notes;
}

// Notes from the screening and assessment scales (only when they change or explain the plan).
function scaleNotes(p, route, scales) {
  const notes = [];
  const icu = p.setting === 'icu';
  const sw = scales.swallow;
  const { food, fluid } = scales.iddsi;
  if (route.earlyPn) notes.push({ text: scales.glim.severe
    ? B('Ağır malnütrisyon (GLIM evre 2) ve kullanılamayan sindirim kanalı: parenteral beslenme 3. günü beklemeden düşük dozla başlar, kademeli artırılır.', 'Severe malnutrition (GLIM stage 2) with an unusable gut: parenteral nutrition starts at a low dose without waiting for day 3 and is increased progressively.')
    : B('Ağır malnütrisyon (NICE ölçütleri) ve kullanılamayan sindirim kanalı: parenteral beslenme 3. günü beklemeden düşük dozla başlar, kademeli artırılır.', 'Severe malnutrition (NICE criteria) with an unusable gut: parenteral nutrition starts at a low dose without waiting for day 3 and is increased progressively.'),
  src: scales.glim.severe ? ['espen-icu-2023', 'glim-2019'] : ['espen-icu-2023', 'nice-cg32'] });
  // Swallowing taken from the scales rather than from the swallowing question.
  if (sw.value && sw.from !== 'entered') {
    const what = {
      fois: B((f) => `FOIS ${f(p.fois)}`, (f) => `FOIS ${f(p.fois)}`),
      iddsi: B('IDDSI düzeyleri', 'IDDSI levels'),
      alertness: B('uyanıklık bozukluğu', 'impaired alertness'),
      signs: B('yutma sırasında güvensizlik bulgusu', 'unsafe signs during swallowing'),
    }[sw.from];
    const value = { safe: B('güvenle yiyebilir', 'can eat safely'), modified: B('kıvam ayarlı diyet', 'texture-modified diet'), unsafe: B('ağızdan beslenmez, tüple beslenir', 'no oral feeding, tube feeding') }[sw.value];
    notes.push({ text: B(`Yutma durumu ${what.tr} ile belirlendi: ${value.tr}.`, `Swallowing was set from ${what.en}: ${value.en}.`), src: sw.from === 'fois' ? ['fois-2005'] : sw.from === 'iddsi' ? ['iddsi-2017'] : ['ueg-esnm-2025'] });
  }
  if (route.kind === 'oral' && p.swallow === 'modified' && (food !== null || fluid !== null)) {
    const foodText = food !== null ? B(`yiyecekler IDDSI ${food} (${IDDSI_NAMES.food[food].tr})`, `foods IDDSI ${food} (${IDDSI_NAMES.food[food].en})`) : null;
    const fluidText = fluid !== null ? B(`içecekler IDDSI ${fluid} (${IDDSI_NAMES.drink[fluid].tr})`, `drinks IDDSI ${fluid} (${IDDSI_NAMES.drink[fluid].en})`) : null;
    const levels = [foodText, fluidText].filter(Boolean);
    const join = (k) => levels.map((x) => x[k]).join(', ');
    const tail = fluid === null
      ? B('İçecek düzeyi bilinmediği için ONS kıvamlı seçildi.', 'The drink level is unknown, so a texture-modified ONS is chosen.')
      : fluid === 0
        ? B('İnce sıvı güvenli: sıvı ONS kullanılabilir.', 'Thin drinks are safe: a liquid ONS can be used.')
        : B(`ONS dahil bütün sıvılar IDDSI ${fluid} düzeyine koyulaştırılır (kıvam artırıcıyla ya da hazır kıvamlı ürünle); düzeyi IDDSI akış testiyle doğrulayın.`, `All drinks, ONS included, are thickened to IDDSI level ${fluid} (with a thickener or a ready-thickened product); check the level with the IDDSI flow test.`);
    notes.push({ text: B(`Disfaji, kıvam ayarlı diyet: ${join('tr')}. ${tail.tr} Yutma güvenli değilse tüple beslenmeye geçin.`, `Dysphagia, texture-modified diet: ${join('en')}. ${tail.en} If swallowing is unsafe, switch to tube feeding.`), src: ['iddsi-2017', 'espen-neurology-2018'] });
  }
  if (p.fois !== null && p.fois <= 3 && route.kind !== 'oral') notes.push({ text: B(`FOIS ${p.fois} (${FOIS_NAMES[p.fois].tr}): beslenme hedefi tüple karşılanır. Yutma terapisiyle FOIS düzeyini düzenli olarak yeniden değerlendirin.`, `FOIS ${p.fois} (${FOIS_NAMES[p.fois].en}): the nutrition target is met by tube. Reassess the FOIS level regularly with swallowing therapy.`), src: ['fois-2005', 'ueg-esnm-2025'] });
  const eat = scales.eat10;
  if (eat.entered && eat.unreliable) notes.push({ text: B('Uyanıklık bozukken EAT-10 (öz bildirim) güvenilir değildir; yutma kararı klinik değerlendirmeyle verilir.', 'With impaired alertness EAT-10 (self-report) is unreliable; the swallowing decision rests on clinical assessment.'), src: ['eat10-2008'] });
  else if (eat.entered && eat.abnormal && p.swallow !== 'unsafe') notes.push({ text: p.swallow === null
    ? B(`EAT-10 = ${eat.score} (≥3, disfaji belirtisi): klinik yutma değerlendirmesi yapın, gerekirse VFSS ya da FEES. Sonuç gelene kadar ağızdan sıvı ve ONS vermeyin.`, `EAT-10 = ${eat.score} (≥3, dysphagia symptoms): perform a clinical swallowing assessment, with VFSS or FEES if needed. Give no oral fluids or ONS until the result is known.`)
    : B(`EAT-10 = ${eat.score} (≥3): disfaji belirtileri sürüyor; yutma değerlendirmesini yineleyin, gerekirse VFSS ya da FEES.`, `EAT-10 = ${eat.score} (≥3): dysphagia symptoms persist; repeat the swallowing assessment, with VFSS or FEES if needed.`), src: ['eat10-2008', 'ueg-esnm-2025'] });
  else if (eat.entered && !eat.abnormal && p.swallow === null) notes.push({ text: B(`EAT-10 = ${eat.score} (<3): belirti eşiği aşılmadı, ancak sessiz aspirasyon dışlanmaz; ağızdan beslenme kararı yutma değerlendirmesiyle verilir.`, `EAT-10 = ${eat.score} (<3): below the symptom threshold, but silent aspiration is not excluded; oral feeding is decided by a swallowing assessment.`), src: ['eat10-2008'] });
  const sarc = scales.ewgsop2;
  if (!icu && !sarc.confounded && ['met', 'probable'].includes(sarc.status)) {
    const what = sarc.status === 'probable' ? B('olası sarkopeni (düşük kas gücü)', 'probable sarcopenia (low muscle strength)') : sarc.severe ? B('ağır sarkopeni', 'severe sarcopenia') : B('sarkopeni', 'sarcopenia');
    notes.push({ text: B(`EWGSOP2: ${what.tr}. Tedavinin temeli direnç egzersizidir; günlük protein hedefine besin ya da protein desteğiyle ulaşın. Lösin ya da HMB için ayrı doz önerilmez: hastaya anlamlı yarar gösteren yeterli kanıt yok. D vitamini sarkopeni için ayrıca önerilmez (eksiklik varsa takviyelere bakın).`, `EWGSOP2: ${what.en}. Resistance exercise is the basis of treatment; reach the daily protein target with food or protein supplements. No separate leucine or HMB dose is recommended: evidence of patient-relevant benefit is insufficient. Vitamin D is not recommended for sarcopenia itself (see supplements if deficient).`), src: ['ewgsop2-2019', 'icfsr-2018'] });
  }
  if (p.oedema === true) notes.push({ text: B('Ödem ya da sıvı yükü işaretlendi: kiloya ve BKİ’ye dayanan tarama ve refeeding ölçütlerinde “karşılanmadı” sonucu güvence vermez; bilinmiyor sayıldı.', 'Oedema or fluid overload was ticked: a "not met" result of the weight- and BMI-based screening and refeeding criteria is not reassuring and is treated as unknown.'), src: ['glim-2019', 'nice-cg32'] });
  return notes;
}

// Ward tube feeding: total fluid 30–35 mL/kg/day (nice-cg32 1.4.2) unless restricted.
function wardFluid(p, m, today) {
  if (p.setting !== 'ward' || p.fluidRestriction === true || kidneyFailureOf(p) || p.kidney === null || !today?.water) return null;
  const w = m.energyWeight;
  if (!w) return null;
  const min = 30 * w;
  const max = 35 * w;
  return { min, max, formulaWater: today.water, extraMin: Math.max(0, min - today.water), extraMax: Math.max(0, max - today.water) };
}

// ---------------------------------------------------------------------------------------------
// Main entry point.
export function recommend(raw = {}) {
  const { p, invalid } = normalize(raw);
  const result = { version: ENGINE_VERSION, rulesDate: RULES_DATE, intendedUse: INTENDED_USE, input: p, warnings: [], notes: [], sources: new Set() };
  const src = (...ids) => ids.forEach((id) => result.sources.add(id));
  const icu = p.setting === 'icu';
  const finish = () => { result.sources = [...result.sources]; return result; };

  if (invalid.length) {
    result.blocked = B(`Geçersiz değer girildi (${invalid.join(', ')}). Düzeltin: geçersiz değerle hesap yapılmaz.`, `Invalid value entered (${invalid.join(', ')}). Correct it: no calculation is made with an invalid value.`);
    result.invalid = invalid; result.missing = [];
    return finish();
  }
  if (p.age !== null && p.age < 18) {
    result.blocked = B('Bu araç erişkinler (18 yaş ve üzeri) içindir; çocuklarda gereksinim farklıdır.', 'This tool is for adults (18 years and over); requirements differ in children.');
    result.missing = [];
    return finish();
  }
  if (p.pregnant === true) {
    result.blocked = B('Gebelikte enerji, protein ve mikrobesin gereksinimi farklıdır; bu araç gebelik için miktar önermez. Kadın doğum ve beslenme ekibiyle birlikte planlayın.', 'Energy, protein and micronutrient needs differ in pregnancy; this tool does not give amounts in pregnancy. Plan together with obstetrics and the nutrition team.');
    result.missing = [];
    return finish();
  }
  // Swallowing: the most cautious of the entered findings (scales.mjs); the answer itself is kept.
  const sw = swallowStatus(p);
  p.swallowEntered = p.swallow;
  p.swallow = sw.value;
  if (sw.conflict) result.warnings.push(swallowConflict(sw));
  const m = bodyMetrics(p);
  const scales = evaluateScales(p, m, sw);
  result.scales = scales;
  result.warnings.push(...scales.nrs.warnings);
  // Laboratory electrolytes. During feeding: phosphate <0.65 mmol/L or a fall >0.16 mmol/L is refeeding
  // hypophosphataemia (espen-icu-2023 R57); potassium or magnesium below the laboratory's lower limit is shown.
  // Before feeding: a value below the laboratory's lower limit is a low pre-feeding level (nice-cg32 Box 1);
  // phosphate <0.65 mmol/L is low in any laboratory. No population reference interval is assumed.
  const labs = p.labs;
  const below = (k) => (labs[k] !== null && labs[`${k}Low`] !== null && !invertedLimits(labs, k) ? labs[k] < labs[`${k}Low`] : null);
  const inverted = LIMIT_KEYS.filter((k) => invertedLimits(labs, k));
  if (inverted.length) result.warnings.push(B(`Referans aralığında alt sınır üst sınırdan büyük (${inverted.map((k) => LAB_WORD[k]?.tr ?? k).join(', ')}): bu aralık kullanılmadı. Laboratuvar kartında düzeltin.`, `Reference interval with the lower limit above the upper limit (${inverted.map((k) => LAB_WORD[k]?.en ?? k).join(', ')}): this interval is not used. Correct it on the laboratory card.`));
  const ELECTROLYTES = ['potassium', 'phosphate', 'magnesium'];
  p.labFindings = [];
  p.lowLabKeys = [];
  if (p.feeding === 'ongoing') {
    if (phosphateDrop(labs) === true) {
      p.labFindings.push('hypoPhosphate');
      if (p.hypoPhosphate === false) result.warnings.push(B('Fosfor refeeding hipofosfatemisi gösteriyor (<0,65 mmol/L ya da >0,16 mmol/L düşüş), ancak kutu işaretlenmemişti: işaretli kabul edildi.', 'Phosphate shows refeeding hypophosphataemia (<0.65 mmol/L or a fall >0.16 mmol/L), but the box was not ticked: it is taken as ticked.'));
      p.hypoPhosphate = true;
    }
    p.lowLabKeys = ['potassium', 'magnesium'].filter((k) => below(k) === true);
    if (p.lowLabKeys.length) p.labFindings.push('lowDuringFeeding');
  } else {
    p.lowLabKeys = ELECTROLYTES.filter((k) => below(k) === true || (k === 'phosphate' && labs.phosphate !== null && labs.phosphate < 0.65));
    if (p.lowLabKeys.length) {
      p.labFindings.push('lowBeforeFeeding');
      if (p.lowElectrolytes === false) result.warnings.push(B((f) => `Beslenme öncesi ${p.lowLabKeys.map((k) => LAB_WORD[k].tr).join(', ')} düşük, ancak "K, P ya da Mg düşük mü?" sorusu "Hayır" yanıtlandı. Düşük kabul edildi.`, (f) => `Pre-feeding ${p.lowLabKeys.map((k) => LAB_WORD[k].en).join(', ')} is low, but "Low K, P or Mg?" was answered "No". It is taken as low.`));
      p.lowElectrolytes = true;
    } else if (ELECTROLYTES.every((k) => below(k) === false) && p.lowElectrolytes === null) {
      p.lowElectrolytes = false;
      p.labFindings.push('normalBeforeFeeding');
    }
  }
  const indices = labIndices(labs);
  if (labs.crp !== null && labs.crpHigh !== null && labs.crpHigh > 0) indices.crpRatio = labs.crp / labs.crpHigh;
  result.labs = { values: labs, indices, findings: p.labFindings, lowKeys: p.lowLabKeys, flags: labFlags(labs) };
  // ICU severity (context only): SOFA-2 from the entered components (kidney replacement from the kidney answer,
  // creatinine, bilirubin and platelets from the laboratory card); SAPS II as the clinician's recorded total.
  if (icu) {
    const rrt = p.kidney === 'ihd' || p.kidney === 'crrt' ? true : p.kidney === 'normal' || p.kidney === 'aki' ? false : null;
    const sofa = sofa2({ gcs: p.sofaGcs, delirium: p.sofaDelirium, pao2: p.sofaPao2, fio2: p.sofaFio2 === null ? null : p.sofaFio2 / 100, ventilation: p.sofaVent,
      cvMechanical: p.sofaMechanical, ne: p.sofaNe, epi: p.sofaEpi, otherVaso: p.sofaOtherVaso, map: p.sofaMap, bilirubin: labs.bilirubin, rrt,
      creatinine: labs.creatinine, urine: p.sofaUrine, platelets: labs.platelets });
    // Shown only when a SOFA-2 input was entered (kidney replacement alone does not start the score).
    sofa.entered = [p.sofaGcs, p.sofaDelirium, p.sofaPao2, p.sofaFio2, p.sofaVent, p.sofaMap, p.sofaNe, p.sofaEpi, p.sofaOtherVaso, p.sofaMechanical, p.sofaUrine, labs.bilirubin, labs.platelets].some((x) => x !== null);
    result.icuScores = { sofa2: sofa, saps2: p.saps2 };
    if (sofa.entered) src('sofa2-2025');
    if (p.saps2 !== null) src('saps2-1993');
  }
  labSources(result.labs).forEach((id) => src(id));
  const rf = refeedingRisk(p, m);
  const nb = nitrogenBalance(p);
  const route = decideRoute(p, rf, rf.severe === true || scales.glim.severe);
  const full = fullEnergy(p, m);
  result.metrics = m; result.refeeding = rf; result.nitrogen = nb; result.route = route; result.fullEnergy = full;
  src(icu ? 'espen-icu-2023' : 'espen-polymorbid-2024');
  if (m.ibw) src('ardsnet-2000');
  scaleSources(scales).forEach((id) => src(id));
  if (p.stroke === true && route.kind === 'oral' && p.swallowAssessment === 'none') {
    result.warnings.push(B('İnme: yutma taraması yapılmadan ağızdan beslenme önerilmez (ESPEN 2018 öneri 52). Önce resmî yutma taraması yapın.', 'Stroke: oral feeding is not advised before a dysphagia screen (ESPEN 2018 recommendation 52). Perform a formal dysphagia screen first.'));
    src('espen-neurology-2018');
  }
  if (route.kind === 'oral' && p.swallow === 'safe' && scales.eat10.abnormal === true && !scales.eat10.unreliable) {
    result.warnings.push(B(`EAT-10 = ${scales.eat10.score} (≥3) iken yutma güvenli kabul edildi: klinik yutma değerlendirmesi önerilir, gerekirse VFSS ya da FEES.`, `Swallowing is taken as safe while EAT-10 = ${scales.eat10.score} (≥3): a clinical swallowing assessment is advised, with VFSS or FEES if needed.`));
  }

  const nn = nonNutritional(p);
  result.nonNutritional = nn;
  if (m.energyWeight && nn.propofolLipidG > LIPID_MAX_G_PER_KG_DAY * m.energyWeight) result.warnings.push(B((f) => `Propofol lipidi ${f(nn.propofolLipidG)} g/gün: 1,5 g/kg/gün lipit sınırını aşıyor.`, (f) => `Propofol lipid ${f(nn.propofolLipidG)} g/day exceeds the 1.5 g/kg/day lipid limit.`));
  if (m.energyWeight && p.dextroseG !== null && p.dextroseG > GLUCOSE_MAX_G_PER_KG_DAY * m.energyWeight) result.warnings.push(B((f) => `IV dekstroz ${f(p.dextroseG)} g/gün: 5 mg/kg/dk (${f(GLUCOSE_MAX_G_PER_KG_DAY * m.energyWeight)} g/gün) sınırını aşıyor.`, (f) => `IV dextrose ${f(p.dextroseG)} g/day exceeds 5 mg/kg/min (${f(GLUCOSE_MAX_G_PER_KG_DAY * m.energyWeight)} g/day).`));

  if (!full.kcal || !m.proteinWeight) {
    result.missing = missingData(p, m, rf, nb, route, scales);
    result.plan = null; result.product = null; result.supplements = [];
    result.monitoring = monitoring(p, rf, route);
    return finish();
  }

  const { rows, proteinBase, rfRamp } = dayTargets(p, m, rf, nb, full, route);
  result.rfRamp = rfRamp;
  const plan = { rows: [], today: null };
  const product = p.product;

  if (route.kind === 'oral') {
    // Texture-modified ONS unless the swallowing assessment allows thin drinks (IDDSI drink level 0).
    const texture = p.swallow === 'modified' && p.iddsiFluid !== 0;
    const cls = texture ? 'ons-texture' : 'ons-high-protein';
    const ons = product.ons ?? PRODUCT_DEFAULTS[cls];
    const cautious = rf.level === 'high' || rf.level === 'extreme' || rf.reducedStart === true || p.hypoPhosphate === true;
    const row = icu || cautious ? rows[0] : rows[rows.length - 1];
    const intake = p.oralIntakePct;
    // The intake question asks for the share of the patient's full needs.
    const fullProtein = row.proteinPerKgFull * m.proteinWeight;
    const intakeKcal = intake === null ? null : (full.kcal * intake) / 100;
    const intakeProtein = intake === null ? null : (fullProtein * intake) / 100;
    const share = kidneyFailureOf(p) ? 0.70 : 0.75; // espen-kidney-2024 R5; espen-polymorbid-2024 R25
    const targetMin = share * row.kcal;
    // ONS: at least 400 kcal and 30 g protein (espen-geriatrics-2022 R26), at most 3 servings. With a refeeding
    // risk the cautious day target is a ceiling: servings are rounded down without a minimum.
    const minServings = Math.min(3, Math.ceil(Math.max(400 / ons.kcal, 30 / ons.protein)));
    // Ward, intake unknown: ONS for patients at nutritional risk or malnourished (espen-polymorbid-2024 R21);
    // none when a complete NRS 2002 is below 3 and no malnutrition is diagnosed (rescreen weekly: nrs2002-2003).
    const noRisk = !icu && intake === null && scales.nrs.status === 'no_risk' && !scales.malnutrition;
    let servings;
    if (intake === null) servings = noRisk ? 0 : cautious ? Math.min(1, Math.floor(row.kcal / ons.kcal)) : minServings;
    else if (!cautious && intakeKcal + nn.total >= targetMin) servings = 0;
    else if (cautious) servings = Math.max(0, Math.min(3, Math.floor((row.kcal - intakeKcal - nn.total) / ons.kcal)));
    else {
      servings = Math.min(3, Math.max(minServings, Math.round((row.kcal - intakeKcal - nn.total) / ons.kcal)));
      if (servings < 3 && intakeKcal + servings * ons.kcal + nn.total < targetMin) servings = 3;
    }
    const reach = intake === null ? null : intakeKcal + servings * ons.kcal + nn.total;
    if (intake !== null && !cautious && servings === 3 && reach < targetMin) {
      // ONS cannot close the gap: tube feeding for the remainder (espen-icu-2023 R41; espen-kidney-2024 R5).
      route.kind = 'en'; route.supplementalToOral = true;
      route.access = p.aspirationRisk ? 'postpyloric' : 'ng';
      route.mode = icu ? 'continuous' : (p.feedingMode ?? 'continuous');
      route.pegPlanned = p.longTube === true;
    } else {
      const totalProtein = intake === null ? null : intakeProtein + servings * ons.protein;
      const gap = totalProtein === null ? 0 : Math.max(0, row.protein - totalProtein);
      const modulePct = product.module?.proteinPer100g ?? PRODUCT_DEFAULTS['protein-module'].proteinPer100g;
      plan.oral = {
        cls, ons, servings, intakePct: intake, intakeKcal, intakeProtein,
        onsKcal: servings * ons.kcal, onsProtein: servings * ons.protein,
        totalKcal: intake === null ? null : intakeKcal + servings * ons.kcal + nn.total,
        totalProtein, moduleProtein: gap >= 5 && !cautious ? round(gap) : 0, moduleGrams: gap >= 5 && !cautious ? round(gap / (modulePct / 100)) : 0,
        kcalTarget: row.kcal, proteinTarget: row.protein, share,
        fiber: p.bowel === 'constipation', capped: cautious,
        noRisk, nrsScore: scales.nrs.score, iddsi: { ...scales.iddsi },
      };
      plan.today = { formulaKcal: servings * ons.kcal };
      plan.rows = rows;
      result.product = { cls, label: PRODUCT_LABELS[cls], composition: ons, fromLabel: Boolean(product.ons), fiber: p.bowel === 'constipation' };
      src('espen-polymorbid-2024', 'espen-geriatrics-2022');
      if (texture) src('espen-neurology-2018');
      if (noRisk) src('nrs2002-2003');
    }
  }

  const pnAfterShock = route.kind === 'delay' && route.gutBlocked === true;
  if (route.kind === 'en' || (route.kind === 'delay' && !pnAfterShock)) {
    const fiber = p.bowel === 'diarrhea' || p.bowel === 'constipation' || (!icu && (p.age ?? 0) >= 65);
    const oralShare = route.supplementalToOral ? (p.oralIntakePct ?? 0) / 100 : 0;
    const mode = route.mode === 'intermittent' ? 'intermittent' : 'continuous';
    for (const row of rows) {
      // Oral intake is a share of the full needs; it covers at most the day's target.
      const otherKcal = Math.min(row.kcal, full.kcal * oralShare);
      const otherProtein = Math.min(row.protein, row.proteinPerKgFull * m.proteinWeight * oralShare);
      const cls = product.form === 'powder' ? 'en-powder' : product.en ? 'en-label' : chooseEnClass(row.protein - otherProtein, Math.max(0, row.kcal - nn.total - otherKcal), p.fluidRestriction === true);
      const comp = enComposition(cls, product);
      plan.rows.push({ ...row, ...enRow(row, nn, cls, comp, product, mode, otherProtein, otherKcal), comp });
    }
    if (route.kind === 'delay') {
      // Restart at a low dose once the delaying condition resolves (espen-icu-2023 R38); protein scaled with energy.
      const first = rows[0];
      const lowKcal = Math.min(first.kcal, LOW_DOSE_FRACTION * full.kcal);
      const lowProtein = Math.min(first.protein, first.proteinPerKgFull * m.proteinWeight * Math.min(1, (lowKcal / full.kcal) / proteinBase));
      const lowRow = { ...first, kcal: lowKcal, protein: lowProtein, cautious: true };
      const cls = plan.rows[0].cls;
      plan.restart = enRow(lowRow, nn, cls, plan.rows[0].comp, product, 'continuous');
    }
    // While feeding is delayed there is no feed today; the table shows the progression after the restart.
    plan.today = route.kind === 'delay' ? null : plan.rows[0];
    const first = plan.rows[0];
    const cls = first.cls;
    result.product = { cls, label: PRODUCT_LABELS[cls], composition: first.comp, fromLabel: Boolean(product.en) || product.form === 'powder', fiber };
    const later = plan.rows.find((r) => r.cls !== cls);
    if (later) result.product.changeFrom = { day: icu ? later.icuDay : later.feedDay, cls: later.cls, label: PRODUCT_LABELS[later.cls] };
    if (plan.today && plan.today.proteinOver > 0) result.warnings.push(B((f) => `Bugün mamadan gelen protein hedefi ${f(plan.today.proteinOver)} g aşıyor: daha düşük proteinli bir ürün seçin ya da kullandığınız ürünün etiketini girin.`, (f) => `Today the formula exceeds the protein target by ${f(plan.today.proteinOver)} g: choose a lower-protein product or enter the label of the product you use.`));
    if (plan.today && nn.total > plan.today.kcalTarget) result.warnings.push(B((f) => `Propofol ve dekstroz (${f(nn.total)} kcal) bugünkü enerji hedefini tek başına aşıyor: mama verilmez; sedasyonu ve dekstrozu gözden geçirin.`, (f) => `Propofol and dextrose (${f(nn.total)} kcal) alone exceed today's energy target: no formula is given; review sedation and dextrose.`));
    if (fiber) src('espen-hen-2022');
    if (fiber && !icu) src('espen-geriatrics-2022');
  }

  if (route.kind === 'pn' || route.kind === 'pn-later' || pnAfterShock) {
    plan.rows = rows.map((row) => {
      const kcal = Math.max(0, row.kcal - nn.total);
      return { ...row, pnKcal: kcal, aminoAcids: row.protein, nonProteinKcal: Math.max(0, kcal - 4 * row.protein),
        glucoseMaxG: Math.max(0, GLUCOSE_MAX_G_PER_KG_DAY * m.energyWeight - (p.dextroseG ?? 0)),
        lipidMaxG: Math.max(0, LIPID_MAX_G_PER_KG_DAY * m.energyWeight - nn.propofolLipidG) };
    });
    plan.today = route.kind === 'pn' ? plan.rows[0] : null;
    plan.pnAfterShock = pnAfterShock;
    plan.lipidLow = plan.rows[0].lipidMaxG < 0.5 * m.energyWeight;
    result.product = { cls: 'pn', label: B('Parenteral beslenme (amino asit + glukoz + lipit; 3 bölmeli torba ya da eczane karışımı)', 'Parenteral nutrition (amino acids + glucose + lipid; three-chamber bag or pharmacy compounded)') };
  }

  result.plan = plan;
  result.days = rows;
  if (nb.status !== 'unknown') src('espen-icu-2023');
  if (rf.level !== 'low' || rfRamp) src('nice-cg32');
  if (p.kidney && p.kidney !== 'normal') src('espen-kidney-2024');
  if (p.stroke) src('espen-neurology-2018');
  if (route.kind === 'en' && route.pegPlanned) src('espen-hen-2022');
  if (route.kind === 'en') plan.fluid = wardFluid(p, m, plan.today);
  if (plan.fluid) src('nice-cg32');
  result.supplements = supplements(p, m, rf, route, plan, scales);
  result.supplements.forEach((s) => src(...s.src));
  result.notes = clinicalNotes(p, m, route, plan, scales);
  result.notes.forEach((n) => src(...n.src));
  result.monitoring = monitoring(p, rf, route);
  result.missing = missingData(p, m, rf, nb, route, scales);
  return finish();
}

// ---------------------------------------------------------------------------------------------
// Scale helpers.
const LAB_WORD = {
  potassium: B('potasyum', 'potassium'), phosphate: B('fosfor', 'phosphate'), magnesium: B('magnezyum', 'magnesium'), creatinine: B('kreatinin', 'creatinine'),
  urea: B('üre', 'urea'), albumin: B('albümin', 'albumin'), crp: B('CRP', 'CRP'), neutrophils: B('nötrofil', 'neutrophils'), lymphocytes: B('lenfosit', 'lymphocytes'),
  lactate: B('laktat', 'lactate'), vitD: B('25(OH)D', '25(OH)D'),
};
const SWALLOW_WORD = { safe: B('güvenle yiyebilir', 'can eat safely'), modified: B('kıvam ayarlı diyet', 'texture-modified diet'), unsafe: B('ağızdan beslenmez', 'no oral feeding') };
const SWALLOW_FROM = { entered: B('yutma sorusu', 'swallowing question'), fois: B('FOIS', 'FOIS'), iddsi: B('IDDSI', 'IDDSI'), alertness: B('uyanıklık bozukluğu', 'impaired alertness'), signs: B('güvensizlik bulgusu', 'unsafe signs') };
function swallowConflict(sw) {
  const list = (k) => sw.found.map((x) => `${SWALLOW_FROM[x.from][k]}: ${SWALLOW_WORD[x.value][k]}`).join('; ');
  return B(`Yutma bilgileri birbirini tutmuyor (${list('tr')}). En temkinli olan kullanıldı: ${SWALLOW_WORD[sw.value].tr}. Klinik kaydı uzlaştırın.`,
    `The swallowing findings disagree (${list('en')}). The most cautious one is used: ${SWALLOW_WORD[sw.value].en}. Reconcile the clinical record.`);
}

function labSources(labs) {
  const ids = [];
  if (labs.indices.nlr !== undefined) ids.push('nlr-2001');
  if (labs.indices.pni !== undefined) ids.push('pni-1984');
  if (labs.indices.ucrMass !== undefined) ids.push('ucr-trauma-2019', 'ucr-crrt-2025');
  if (labs.findings.includes('hypoPhosphate')) ids.push('espen-icu-2023');
  if (labs.findings.some((f) => f !== 'hypoPhosphate')) ids.push('nice-cg32');
  return ids;
}

function scaleSources(s) {
  const ids = [];
  if (s.nrs.status !== 'incomplete') ids.push('nrs2002-2003', 'espen-screening-2002');
  if (s.glim.status !== 'incomplete') ids.push('glim-2019');
  if (s.espen2015.status === 'met' || s.espen2015.status === 'not_met') ids.push('espen-malnutrition-2015');
  if (s.aspen.entered) ids.push('aspen-malnutrition-2012');
  if (s.ewgsop2.entered) ids.push('ewgsop2-2019');
  if (s.eat10.entered) ids.push('eat10-2008', 'eat10-tr-2016');
  if (s.fois !== null) ids.push('fois-2005');
  if (s.iddsi.food !== null || s.iddsi.fluid !== null) ids.push('iddsi-2017');
  if ((s.assessment && s.assessment !== 'none') || s.swallow.from === 'alertness' || s.swallow.from === 'signs') ids.push('ueg-esnm-2025');
  return ids;
}
