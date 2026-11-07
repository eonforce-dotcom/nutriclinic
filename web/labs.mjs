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
const BASE = {
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
  // SOFA-2 liver and haemostasis (sofa2-2025): bilirubin 1 mg/dL = 17.1 µmol/L; platelets.
  bilirubin: { canonical: 'mg/dL', min: 0, max: 60, units: [['mg/dL', 1], ['µmol/L', 1 / 17.1]] },
  platelets: { canonical: '10^9/L', min: 0, max: 2000, units: [['10³/µL', 1], ['/µL', 0.001]] },
};
// Tests that can carry the laboratory's own reference limits (entered in the unit of the value; no population
// default is ever assumed).
export const LIMIT_KEYS = ['potassium', 'phosphate', 'magnesium', 'creatinine', 'urea', 'albumin', 'crp', 'neutrophils', 'lymphocytes', 'lactate', 'vitD'];
const LIMITS = Object.fromEntries(LIMIT_KEYS.flatMap((k) => ['Low', 'High'].map((side) => [`${k}${side}`, { ...BASE[k], unitOf: k }])));
export const LABS = Object.freeze({ ...BASE, ...LIMITS });
export const LAB_KEYS = Object.keys(LABS);
// A reference limit uses the unit chosen for its value.
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

// null when empty or valid; otherwise { code: 'nan' | 'unit' | 'range' | 'grouping', min, max } with the limits in
// the entered unit, so the interface can say "between a and b mg/dL".
export function checkLab(key, value, unit) {
  const def = LABS[key];
  if (!def || empty(value)) return null;
  const factor = labFactor(key, unit);
  if (factor === null) return { code: 'unit', min: null, max: null };
  // A thousands separator ("250.000", "1,800") would be read as a decimal point, giving a value a thousand times
  // too small: it is refused where values of 1000 or more are possible, and counts per µL (whole numbers) take no
  // separator at all.
  const raw = typeof value === 'string' ? value.trim() : '';
  if (unit === '/µL' && /[.,]/.test(raw)) return { code: 'grouping', perUl: true, min: def.min / factor, max: def.max / factor };
  if (def.max / factor >= 1000 && /^[+-]?\d{1,3}[.,]\d{3}$/.test(raw)) return { code: 'grouping', min: def.min / factor, max: def.max / factor };
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

// A lower limit above the upper limit is an input error: such a pair is not used.
export const invertedLimits = (l, k) => l[`${k}Low`] != null && l[`${k}High`] != null && l[`${k}Low`] > l[`${k}High`];

// Below / within / above the laboratory's own limits; null where a value or both limits are missing.
export function labFlags(l) {
  const out = {};
  for (const k of LIMIT_KEYS) {
    if (l[k] == null) continue; // null or absent
    if (invertedLimits(l, k)) { out[k] = 'inverted'; continue; }
    const low = l[`${k}Low`] != null ? l[k] < l[`${k}Low`] : null;
    const high = l[`${k}High`] != null ? l[k] > l[`${k}High`] : null;
    if (low === null && high === null) continue;
    out[k] = low ? 'low' : high ? 'high' : low === false || high === false ? 'normal' : null;
  }
  return out;
}

// ---------------------------------------------------------------------------------------------
// Import from a laboratory file read on this device (CSV or JSON rows: test, value, unit, date).
const fold = (x) => String(x ?? '').toLocaleLowerCase('tr-TR').replace(/ı/g, 'i').normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
const nameKey = (x) => fold(x).replace(/[^a-z0-9#+]/g, '');
const ALIASES = new Map([
  ...['potassium', 'potasyum', 'k', 'k+'].map((a) => [a, 'potassium']),
  ...['phosphate', 'phosphorus', 'fosfat', 'fosfor', 'inorganikfosfor', 'p'].map((a) => [a, 'phosphate']),
  ...['magnesium', 'magnezyum', 'mg'].map((a) => [a, 'magnesium']),
  ...['creatinine', 'kreatinin', 'crea', 'creat'].map((a) => [a, 'creatinine']),
  ...['urea', 'ure', 'bun', 'kanureazotu'].map((a) => [a, 'urea']),
  ...['albumin', 'alb'].map((a) => [a, 'albumin']),
  ...['crp', 'creaktifprotein', 'hscrp'].map((a) => [a, 'crp']),
  ...['neutrophils', 'neutrophil', 'notrofil', 'notrofil#', 'neu', 'neu#', 'neut', 'anc'].map((a) => [a, 'neutrophils']),
  ...['lymphocytes', 'lymphocyte', 'lenfosit', 'lenfosit#', 'lym', 'lym#', 'lymph'].map((a) => [a, 'lymphocytes']),
  ...['lactate', 'laktat', 'lac'].map((a) => [a, 'lactate']),
  ...['vitd', 'dvitamini', 'vitamind', '25ohd', '25(oh)d', '25ohvitamind', '25hidroksivitamind'].map((a) => [a, 'vitD']),
  ...['bilirubin', 'totalbilirubin', 'tbil', 'bilirubintotal'].map((a) => [a, 'bilirubin']),
  ...['platelets', 'platelet', 'trombosit', 'plt'].map((a) => [a, 'platelets']),
]);
const unitText = (x) => String(x ?? '').toLowerCase().replace(/\s/g, '').replace(/[µμ]/g, 'u').replace(/³/g, '^3').replace(/⁹/g, '^9').replace(/^(x|×)/, '');
const CELL_UNITS = { '10^3/ul': '10³/µL', '10^9/l': '10³/µL', 'k/ul': '10³/µL', '/ul': '/µL', 'cells/ul': '/µL', '/mm3': '/µL', 'hucre/ul': '/µL' };
const UNIT_MAP = {
  potassium: { 'mmol/l': 'mmol/L', 'meq/l': 'mEq/L' },
  phosphate: { 'mg/dl': 'mg/dL', 'mmol/l': 'mmol/L' },
  magnesium: { 'mg/dl': 'mg/dL', 'mmol/l': 'mmol/L' },
  creatinine: { 'mg/dl': 'mg/dL', 'umol/l': 'µmol/L' },
  urea: { 'mg/dl': 'mg/dL', 'mmol/l': 'mmol/L' },
  albumin: { 'g/dl': 'g/dL', 'g/l': 'g/L' },
  crp: { 'mg/l': 'mg/L', 'mg/dl': 'mg/dL' },
  neutrophils: CELL_UNITS,
  lymphocytes: CELL_UNITS,
  lactate: { 'mmol/l': 'mmol/L', 'mg/dl': 'mg/dL' },
  vitD: { 'ng/ml': 'ng/mL', 'ug/l': 'ng/mL', 'nmol/l': 'nmol/L' },
  bilirubin: { 'mg/dl': 'mg/dL', 'umol/l': 'µmol/L' },
  platelets: CELL_UNITS,
};
const isoDate = (x) => {
  const t = String(x ?? '').trim();
  if (!t) return '';
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(t) || /^(\d{2})[./](\d{2})[./](\d{4})$/.exec(t);
  if (!m) return null;
  const [y, mo, d] = m[1].length === 4 ? [m[1], m[2], m[3]] : [m[3], m[2], m[1]];
  const iso = `${y}-${mo}-${d}`;
  const dt = new Date(`${iso}T12:00:00Z`);
  return Number.isFinite(dt.getTime()) && dt.toISOString().slice(0, 10) === iso ? iso : null;
};

// One row of a file → { key, value, unit, date } or { error }; error codes are translated by the interface.
export function importRow(row) {
  if (!row || typeof row !== 'object' || Array.isArray(row)) return { error: 'row' };
  if (row.__wide) return { test: String(Object.values(row)[0] ?? '').slice(0, 60), rawUnit: '', rawValue: '', error: 'wide' };
  const pick = (...names) => {
    for (const n of names) { const hit = Object.keys(row).find((k) => nameKey(k) === n); if (hit !== undefined) return row[hit]; }
    return undefined;
  };
  const test = String(pick('test', 'tetkik', 'analiz', 'name', 'ad') ?? '').trim();
  const rawUnit = pick('unit', 'birim');
  const rawValue = pick('value', 'deger', 'sonuc', 'result');
  const date = isoDate(pick('date', 'tarih'));
  const base = { test: test.slice(0, 60), rawUnit: String(rawUnit ?? '').slice(0, 30), rawValue: String(rawValue ?? '').slice(0, 30) };
  const key = ALIASES.get(nameKey(test));
  // A comparator in the test name or the value ("CRP <", "<0,5") is a censored result: never an exact value.
  if (/[<>≤≥]/.test(test) || /[<>≤≥]/.test(String(rawValue ?? ''))) return { ...base, ...(key ? { key } : {}), error: 'censored' };
  if (!key) return { ...base, error: 'test' };
  const bun = nameKey(test) === 'bun' || nameKey(test) === 'kanureazotu';
  if (!unitText(rawUnit)) return { ...base, key, error: 'unit-missing' };
  let unit = UNIT_MAP[key][unitText(rawUnit)] ?? null;
  if (bun && unit === 'mg/dL') unit = 'BUN mg/dL';
  if (bun && unit !== 'BUN mg/dL') unit = null;
  if (!unit) return { ...base, key, error: 'unit' };
  const value = typeof rawValue === 'number' ? String(rawValue) : String(rawValue ?? '').trim();
  const err = checkLab(key, value, unit);
  if (!value || err) return { ...base, key, unit, error: ['range', 'grouping'].includes(err?.code) ? err.code : 'value' };
  if (date === null) return { ...base, key, unit, value, error: 'date' };
  return { ...base, key, unit, value, date };
}

// CSV with a header row (comma or semicolon; quotes allowed) → array of row objects.
export function parseCSV(text) {
  // Delimiter of the header line, counted outside quotes.
  const seen = { ';': 0, '\t': 0, ',': 0 };
  let inQuote = false;
  for (const ch of text) {
    if (ch === '\n' || ch === '\r') { if (!inQuote) break; }
    if (ch === '"') inQuote = !inQuote;
    else if (!inQuote && ch in seen) seen[ch] += 1;
  }
  const delimiter = seen[';'] ? ';' : seen['\t'] ? '\t' : ',';
  const rows = [];
  let row = [];
  let cell = '';
  let quote = false;
  for (let i = 0; i < text.length; i += 1) {
    const c = text[i];
    if (c === '"') {
      if (quote && text[i + 1] === '"') { cell += '"'; i += 1; } else quote = !quote;
    } else if (c === delimiter && !quote) { row.push(cell); cell = ''; }
    else if ((c === '\n' || c === '\r') && !quote) {
      if (c === '\r' && text[i + 1] === '\n') i += 1;
      row.push(cell);
      if (row.some((x) => x.trim())) rows.push(row);
      row = []; cell = '';
    } else cell += c;
  }
  if (quote) throw new Error('quote');
  row.push(cell);
  if (row.some((x) => x.trim())) rows.push(row);
  const header = (rows.shift() ?? []).map((x) => x.replace(/^\uFEFF/, '').trim());
  const names = header.map(nameKey);
  if (!names.some((n) => ['test', 'tetkik', 'analiz', 'name', 'ad'].includes(n)) || !names.some((n) => ['value', 'deger', 'sonuc', 'result'].includes(n))) throw new Error('header');
  // The same meaning twice (for example two value columns) would silently overwrite a cell.
  const ROLE = (n) => (['test', 'tetkik', 'analiz', 'name', 'ad'].includes(n) ? 'test' : ['value', 'deger', 'sonuc', 'result'].includes(n) ? 'value' : ['unit', 'birim'].includes(n) ? 'unit' : ['date', 'tarih'].includes(n) ? 'date' : n);
  const roles = names.map(ROLE).filter(Boolean);
  if (new Set(roles).size !== roles.length) throw new Error('header-dup');
  return rows.map((r) => {
    const obj = Object.fromEntries(header.map((h, i) => [h, (r[i] ?? '').trim()]));
    if (r.length > header.length && r.slice(header.length).some((x) => x.trim())) obj.__wide = true;
    return obj;
  });
}

// File text → rows ready for preview; at most 300 rows.
export function importText(name, text) {
  const ext = String(name ?? '').toLowerCase().split('.').pop();
  let rows;
  if (ext === 'json') {
    const data = JSON.parse(text);
    rows = Array.isArray(data) ? data : null;
    if (!rows) throw new Error('json');
  } else rows = parseCSV(text);
  if (rows.length > 300) throw new Error('size');
  return preselect(rows.map((r, i) => ({ i, ...importRow(r) })));
}

// One row per test is preselected: the only result (or identical results), or the latest-dated one when every row
// of that test has a date and the latest date has a single result. Otherwise the rows are marked `choose` and the
// clinician picks one; nothing is preselected for that test. A test that also has a recognised but unusable row (a
// unit, range, date or censored-value error) is never preselected, and `none` (an incomplete text) preselects nothing.
function preselect(rows, { none = false } = {}) {
  const groups = new Map();
  const blocked = new Set();
  for (const r of rows) {
    r.selected = false;
    r.choose = false;
    if (r.error) { if (r.key) blocked.add(r.key); continue; }
    groups.set(r.key, [...(groups.get(r.key) ?? []), r]);
  }
  if (none) return rows;
  const distinct = (list) => new Set(list.map((x) => `${String(x.value).replace(',', '.')}|${x.unit}`)).size;
  for (const [key, same] of groups) {
    if (blocked.has(key)) { same.forEach((x) => { x.choose = true; }); continue; }
    const dated = same.every((x) => x.date);
    const latestDate = dated ? same.reduce((d, x) => (x.date > d ? x.date : d), '') : '';
    const latest = latestDate ? same.filter((x) => x.date === latestDate) : [];
    if (distinct(same) === 1) (latest[0] ?? same[0]).selected = true;
    else if (latest.length && distinct(latest) === 1) latest[0].selected = true;
    else same.forEach((x) => { x.choose = true; });
  }
  return rows;
}

// ---------------------------------------------------------------------------------------------
// SOFA-2 (sofa2-2025, corrected publisher text of Table 2): six organ components 0–4 for one 24-hour window.
// Missing components are not zero: the total is given only when all six are known. Uses PaO2/FiO2; the SpO2 proxy,
// non-verbal GCS proxies and treatment-ceiling rules are not implemented.
const URINE = { normal: 0, oliguria6: 1, oliguria12: 2, oliguria24: 3, anuria12: 3 };
export function sofa2(s) {
  const c = { brain: null, respiratory: null, cardiovascular: null, liver: null, kidney: null, hemostasis: null };
  if (s.gcs !== null && s.delirium !== null) c.brain = Math.max(s.gcs >= 15 ? 0 : s.gcs >= 13 ? 1 : s.gcs >= 9 ? 2 : s.gcs >= 6 ? 3 : 4, s.delirium ? 1 : 0);
  if (s.ventilation === 'ecmo') c.respiratory = 4;
  else if (s.pao2 !== null && s.fio2 !== null && (s.ventilation === 'none' || s.ventilation === 'advanced')) {
    const pf = s.pao2 / s.fio2;
    c.respiratory = pf > 300 ? 0 : pf > 225 ? 1 : pf > 150 ? 2 : s.ventilation === 'advanced' ? (pf > 75 ? 3 : 4) : 2;
  }
  if (s.cvMechanical === true) c.cardiovascular = 4;
  else if (s.cvMechanical === false && s.ne !== null && s.epi !== null && s.otherVaso !== null) {
    const dose = s.ne + s.epi;
    const other = s.otherVaso === true;
    c.cardiovascular = dose > 0.4 ? 4 : dose > 0.2 ? (other ? 4 : 3) : dose > 0 ? (other ? 3 : 2) : other ? 2 : s.map !== null ? (s.map >= 70 ? 0 : 1) : null;
  }
  if (s.bilirubin !== null) c.liver = s.bilirubin <= 1.2 ? 0 : s.bilirubin <= 3 ? 1 : s.bilirubin <= 6 ? 2 : s.bilirubin <= 12 ? 3 : 4;
  if (s.rrt === true) c.kidney = 4;
  else if (s.rrt === false && s.creatinine !== null && s.urine in URINE) c.kidney = Math.max(s.creatinine <= 1.2 ? 0 : s.creatinine <= 2 ? 1 : s.creatinine <= 3.5 ? 2 : 3, URINE[s.urine]);
  if (s.platelets !== null) c.hemostasis = s.platelets > 150 ? 0 : s.platelets > 100 ? 1 : s.platelets > 80 ? 2 : s.platelets > 50 ? 3 : 4;
  const known = Object.values(c).filter((v) => v !== null);
  return { components: c, total: known.length === 6 ? known.reduce((a, b) => a + b, 0) : null, known: known.length, partial: known.reduce((a, b) => a + b, 0) };
}

// ---------------------------------------------------------------------------------------------
// Laboratory results in a report's text (for example a PDF): one or more "<test> <value> <unit>" segments per line,
// read from the left. Around the value (between the name and the value, or the value and its unit) only result flags
// (H, L, *, ↑ …), dates and times and specimen words (serum, plazma …) may stand; the unit may also come just before
// the value. Any other word ends the line, so "Bilirubin direkt 0,3" is not read as total bilirubin, "Kreatinin
// (idrar) 80" not as serum creatinine and "CRP < 0,5" (a censored result) not at all; a reference range is never taken
// as a result, nor a name that mixes urea and BUN. A second test on the same line is read only right after the first
// one's unit (and its reference range). Test names need three or more letters (K or P alone are ambiguous in free text). Every row goes through the
// same checks as a file row, carries its report line and page, and is preselected only when it is unambiguous.
const SPECIMEN = new Set(['serum', 'plazma', 'plasma', 'kan', 'blood', 'tamkan', 'wholeblood', 'venoz', 'venous', 'venozkan', 'arteriyel', 'arterial', 'arteriyelkan', 's', 'p', 'sp', 'inorganik', 'inorganic', 'kantitatif', 'quantitative', 'nefelometrik', 'turbidimetrik']);
const BRACKETED = new Set(['total', 'toplam', 'abs', 'mutlak', 'absolute', '#', '25oh']);
const FLAG = /^(\(?(h|l|hh|ll|h\*|l\*)\)?|\*{1,2}|!{1,2}|↑{1,2}|↓{1,2})$/i;
const DATE_TIME = /^(\d{1,2}[./]\d{1,2}[./]\d{2,4}|\d{4}-\d{2}-\d{2}|\d{1,2}:\d{2}(:\d{2})?)$/;
const VALUE = /^(\d+(?:[.,]\d+)?)(?:\*{1,2}|!{1,2}|↑|↓|h|l)?$/i;
const RANGE = /^(\(?\d+(?:[.,]\d+)?[-–]\d+(?:[.,]\d+)?\)?|[<>≤≥]=?\d+(?:[.,]\d+)?)$/;
const DASH = /^[-–—]/;
const MAX_TEXT_ROWS = 300;
const MAX_TEXT_LINES = 20000;
const textDate = (t) => {
  const m = /^(\d{1,2})[./](\d{1,2})[./](\d{4})$/.exec(t);
  return isoDate(m ? `${m[1].padStart(2, '0')}.${m[2].padStart(2, '0')}.${m[3]}` : /^\d{4}-\d{2}-\d{2}$/.test(t) ? t : '') || '';
};
const COMPARATOR = /[<>≤≥=]/;
// Urea names that report BUN (urea nitrogen): a name mixing both ("Üre (BUN)") is not read, since BUN is converted.
const BUN_NAMES = new Set(['bun', 'kanureazotu']);
// A specimen word, bare (letters only) or in brackets; in brackets also "(total)", "(#)", "(25-OH)" or the test's own
// short name with the same basis. A token with a comparator is never a qualifier ("(serum)<" ends the line).
function qualifier(tok, key, bunName) {
  if (COMPARATOR.test(tok)) return false;
  const m = /^\(([^()]*)\)$/.exec(tok);
  if (!m && !/^\p{L}+$/u.test(tok)) return false;
  const inner = nameKey(m ? m[1] : tok);
  if (SPECIMEN.has(inner)) return true;
  if (!m) return false;
  return BRACKETED.has(inner) || (ALIASES.get(inner) === key && BUN_NAMES.has(inner) === bunName);
}
// The test a name stands for ({ key, test: the name as matched }), or null. Bracketed parts must be qualifiers
// ("Kreatinin (idrar)" is not creatinine); they are left out of the matched name.
function testName(name) {
  // A percentage ("NEU%", "Lenfosit %") is not the count; unbalanced brackets or a comparator are not a name.
  if (name.includes('%') || COMPARATOR.test(name) || (name.match(/\(/g) ?? []).length !== (name.match(/\)/g) ?? []).length) return null;
  const whole = nameKey(name);
  if (whole.length >= 3 && ALIASES.has(whole)) return { key: ALIASES.get(whole), test: name };
  const bare = name.replace(/\([^()]*\)/g, ' ').replace(/\s+/g, ' ').trim();
  const bareKey = nameKey(bare);
  const key = bareKey.length >= 3 ? ALIASES.get(bareKey) : undefined;
  if (!key) return null;
  return [...name.matchAll(/\([^()]*\)/g)].every((m) => qualifier(m[0], key, BUN_NAMES.has(bareKey))) ? { key, test: bare } : null;
}
const nameToken = (t) => !COMPARATOR.test(t) && (/\p{L}/u.test(t) || t === '#');
function segmentAt(tokens, start) {
  for (let k = Math.min(6, tokens.length - start - 1); k >= 1; k -= 1) {
    const words = tokens.slice(start, start + k);
    if (!words.every(nameToken)) continue;
    const hit = testName(words.join(' '));
    if (hit) return resultAfter(tokens, start + k, hit.key, hit.test); // the longest known name wins; no shorter retry
  }
  return null;
}
function resultAfter(tokens, from, key, name) {
  const bunName = BUN_NAMES.has(nameKey(name));
  const units = UNIT_MAP[key];
  const unitAt = (p) => {
    for (let n = 1; n <= 3 && p + n <= tokens.length; n += 1) {
      const u = tokens.slice(p, p + n).join('');
      if (units[unitText(u)]) return { unit: u, next: p + n };
    }
    return null;
  };
  let date = '';
  // Flags, dates and times, and specimen words may stand around the value.
  const noise = (t) => {
    if (DATE_TIME.test(t)) { date ||= textDate(t); return true; }
    return FLAG.test(t) || qualifier(t, key, bunName);
  };
  let j = from;
  let before = null;
  while (j < tokens.length) {
    if (noise(tokens[j])) { j += 1; continue; }
    const u = before ? null : unitAt(j);
    if (!u) break;
    before = u;
    j = u.next;
  }
  const m = VALUE.exec(tokens[j] ?? '');
  if (!m || DASH.test(tokens[j + 1] ?? '')) return null; // no result here, or the start of a reference range
  let p = j + 1;
  let unit = before?.unit ?? '';
  if (!before) {
    while (p < tokens.length && noise(tokens[p])) p += 1;
    const u = unitAt(p);
    if (u) { unit = u.unit; p = u.next; } else if (p < tokens.length) { unit = tokens[p]; p += 1; } // shown with an error
  }
  if (DASH.test(tokens[p] ?? '')) return null; // "3,5 mmol/L - 5,1 mmol/L" is a reference range
  return { key, name, value: m[1], unit, date, end: p };
}
// The end of a part of a line that is not one of our tests ("Hemoglobin 12,1 g/dL" in a two-column report), or -1.
// Nothing in it is imported; it is only passed over so that a test of ours right after it can still be read.
const UNIT_LIKE = (t) => !VALUE.test(t) && (/[/%]/.test(t) || /^[a-zµμ]{1,4}$/i.test(t));
function otherEnd(tokens, start) {
  let j = start;
  while (j < tokens.length && j - start < 6 && nameToken(tokens[j]) && !VALUE.test(tokens[j])) j += 1;
  if (j === start || !VALUE.test(tokens[j] ?? '')) return -1;
  let p = j + 1;
  while (p < tokens.length && FLAG.test(tokens[p])) p += 1;
  if (p < tokens.length && UNIT_LIKE(tokens[p])) p += 1;
  return p;
}
// text: the whole text, or one text per page (rows then carry their page number). Returns { rows, truncated } where
// truncated is false, 'rows' (more than 300 results) or 'lines' (more than 20 000 lines); an incomplete text
// preselects nothing.
export function rowsFromText(text) {
  const pages = Array.isArray(text) ? text : [text];
  const found = [];
  let lines = 0;
  let truncated = false;
  reading: for (let pi = 0; pi < pages.length; pi += 1) {
    for (const raw of String(pages[pi] ?? '').split(/\r?\n/)) {
      const line = raw.replace(/\s+/g, ' ').trim();
      if (!line) continue;
      lines += 1;
      if (lines > MAX_TEXT_LINES) { truncated = 'lines'; break reading; }
      const tokens = line.split(' ');
      const dates = [...new Set(tokens.filter((t) => DATE_TIME.test(t)).map(textDate).filter(Boolean))];
      let i = 0;
      while (i < tokens.length && DATE_TIME.test(tokens[i])) i += 1; // a date or time opening the row
      let first = true;
      while (i < tokens.length) {
        const seg = segmentAt(tokens, i);
        let p = seg ? seg.end : otherEnd(tokens, i);
        if (p < 0) break;
        while (p < tokens.length && FLAG.test(tokens[p])) p += 1;
        if (RANGE.test(tokens[p] ?? '')) p += 1;
        else if (VALUE.test(tokens[p] ?? '') && /^[-–—]$/.test(tokens[p + 1] ?? '') && VALUE.test(tokens[p + 2] ?? '')) p += 3;
        if (seg) {
          // The report text behind the row: the whole line when short, otherwise this test's own part of it.
          const from = first ? 0 : i;
          const source = line.length <= 160 ? line : `${from > 0 ? '… ' : ''}${tokens.slice(from, p).join(' ').slice(0, 200)}${p < tokens.length ? ' …' : ''}`;
          found.push({ ...seg, date: seg.date || (dates.length === 1 ? dates[0] : ''), line: source, page: Array.isArray(text) ? pi + 1 : null });
        }
        while (p < tokens.length && (FLAG.test(tokens[p]) || DATE_TIME.test(tokens[p]))) p += 1;
        if (p <= i) break;
        i = p;
        first = false;
      }
    }
  }
  if (!truncated && found.length > MAX_TEXT_ROWS) truncated = 'rows';
  const rows = found.slice(0, MAX_TEXT_ROWS).map((r, i) => ({ i, ...importRow({ test: r.name, value: r.value, unit: r.unit, date: r.date }), line: r.line, page: r.page }));
  return { rows: preselect(rows, { none: Boolean(truncated) }), truncated };
}
