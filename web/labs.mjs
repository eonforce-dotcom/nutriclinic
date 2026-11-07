// NutriClinic laboratory values: units, conversions and derived indices. Pure functions.
// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Gökay Duman
//
// Values are entered in the unit of the clinician's laboratory and converted to one canonical unit from molar
// masses: phosphorus 30.97 g/mol, magnesium 24.305 g/mol, creatinine 113.12 g/mol (1 mg/dL = 88.42 µmol/L),
// urea 60.06 g/mol (1 mmol/L = 6.006 mg/dL; urea = BUN × 2.144), lactate 90.08 g/mol (1 mmol/L = 9.008 mg/dL),
// 25(OH)D 1 ng/mL = 2.496 nmol/L.
// Derived indices are shown for context only and never change a dose: NLR (nlr-2001), PNI (pni-1984),
// urea/creatinine ratio (ucr-trauma-2019, ucr-crrt-2025).

// First unit = the default (the usual unit in Turkish laboratories).
export const LABS = Object.freeze({
  potassium: { canonical: 'mmol/L', min: 0.5, max: 12, units: [['mmol/L', 1], ['mEq/L', 1]] },
  phosphate: { canonical: 'mmol/L', min: 0.05, max: 8, units: [['mg/dL', 1 / 3.097], ['mmol/L', 1]] },
  phosphateBefore: { canonical: 'mmol/L', min: 0.05, max: 8, units: [['mg/dL', 1 / 3.097], ['mmol/L', 1]] },
  magnesium: { canonical: 'mmol/L', min: 0.05, max: 6, units: [['mg/dL', 1 / 2.4305], ['mmol/L', 1]] },
  creatinine: { canonical: 'mg/dL', min: 0.1, max: 30, units: [['mg/dL', 1], ['µmol/L', 1 / 88.42]] },
  urea: { canonical: 'mg/dL', min: 1, max: 1000, units: [['mg/dL', 1], ['BUN mg/dL', 2.144], ['mmol/L', 6.006]] },
  albumin: { canonical: 'g/L', min: 5, max: 70, units: [['g/dL', 10], ['g/L', 1]] },
  crp: { canonical: 'mg/L', min: 0, max: 1000, units: [['mg/L', 1], ['mg/dL', 10]] },
  neutrophils: { canonical: '10^9/L', min: 0, max: 100, units: [['10³/µL', 1], ['/µL', 0.001]] },
  lymphocytes: { canonical: '10^9/L', min: 0, max: 100, units: [['10³/µL', 1], ['/µL', 0.001]] },
  lactate: { canonical: 'mmol/L', min: 0.1, max: 30, units: [['mmol/L', 1], ['mg/dL', 1 / 9.008]] },
  vitD: { canonical: 'ng/mL', min: 0, max: 200, units: [['ng/mL', 1], ['nmol/L', 1 / 2.496]] },
  // The laboratory's own lower reference limits, entered in the unit of the value (no population default).
  potassiumLow: { canonical: 'mmol/L', min: 0.5, max: 12, unitOf: 'potassium', units: [['mmol/L', 1], ['mEq/L', 1]] },
  phosphateLow: { canonical: 'mmol/L', min: 0.05, max: 8, unitOf: 'phosphate', units: [['mg/dL', 1 / 3.097], ['mmol/L', 1]] },
  magnesiumLow: { canonical: 'mmol/L', min: 0.05, max: 6, unitOf: 'magnesium', units: [['mg/dL', 1 / 2.4305], ['mmol/L', 1]] },
});
export const LAB_KEYS = Object.keys(LABS);
// A lower limit uses the unit chosen for its value.
export const unitKey = (key) => `${LABS[key]?.unitOf ?? key}Unit`;

const toNumber = (v) => {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (typeof v !== 'string') return null;
  const t = v.trim().replace(',', '.');
  if (!t || !/^[+-]?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?$/.test(t)) return null;
  const x = Number(t);
  return Number.isFinite(x) ? x : null;
};
const empty = (v) => v === undefined || v === null || v === '';

export function labFactor(key, unit) {
  const def = LABS[key];
  if (!def) return null;
  const found = def.units.find(([u]) => u === unit);
  return found ? found[1] : unit === undefined || unit === null || unit === '' ? def.units[0][1] : null;
}
export const defaultUnit = (key) => LABS[key].units[0][0];

// null when empty or valid; otherwise { code: 'nan' | 'unit' | 'range', min, max } with the limits expressed in
// the entered unit, so the interface can say "between a and b mg/dL".
export function checkLab(key, value, unit) {
  const def = LABS[key];
  if (!def || empty(value)) return null;
  const factor = labFactor(key, unit);
  if (factor === null) return { code: 'unit', min: null, max: null };
  const x = toNumber(value);
  if (x === null) return { code: 'nan', min: def.min / factor, max: def.max / factor };
  const canonical = x * factor;
  if (canonical < def.min || canonical > def.max) return { code: 'range', value: x, min: def.min / factor, max: def.max / factor };
  return null;
}

// Canonical value, or null when empty or invalid (invalid keys are pushed to `invalid`).
export function readLab(raw, key, invalid) {
  const value = raw[key];
  if (empty(value)) return null;
  const unit = raw[unitKey(key)];
  if (checkLab(key, value, unit)) { invalid.push(key); return null; }
  return toNumber(value) * labFactor(key, unit);
}

// Derived indices (context only).
export function labIndices(l) {
  const out = {};
  if (l.neutrophils !== null && l.lymphocytes !== null && l.lymphocytes > 0) out.nlr = l.neutrophils / l.lymphocytes;
  // Onodera: PNI = 10 × albumin (g/dL) + 0.005 × lymphocytes (/mm³) = albumin (g/L) + 5 × lymphocytes (10^9/L).
  if (l.albumin !== null && l.lymphocytes !== null) out.pni = l.albumin + 5 * l.lymphocytes;
  if (l.urea !== null && l.creatinine !== null && l.creatinine > 0) {
    out.ucrMass = l.urea / l.creatinine; // mg/dL : mg/dL (ucr-crrt-2025)
    out.ucrMolar = (l.urea / 6.006) / ((l.creatinine * 88.42) / 1000); // mmol/L : mmol/L (ucr-trauma-2019)
  }
  return out;
}

// Refeeding hypophosphataemia during feeding: phosphate <0.65 mmol/L or a fall of more than 0.16 mmol/L
// (espen-icu-2023 R57).
export function phosphateDrop(l) {
  if (l.phosphate === null) return null;
  const below = l.phosphate < 0.65;
  // A tolerance keeps an exact 0.16 mmol/L fall (floating point) from counting as more than 0.16.
  const fall = l.phosphateBefore !== null ? l.phosphateBefore - l.phosphate > 0.16 + 1e-9 : null;
  return below || fall === true ? true : fall === false ? false : null;
}
