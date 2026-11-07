// NutriClinic follow-up: delivered energy and protein against each day's target. Pure functions; context only,
// never a dose change. Early-phase overfeeding note: espen-icu-2023 R17/R19 (first week below 70% of the
// estimate, or of measured expenditure for 3 days).
// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Gökay Duman

export const FOLLOWUP_FIELDS = Object.freeze({
  day: { min: 1, max: 365, integer: true },
  kcal: { min: 0, max: 15000 },
  protein: { min: 0, max: 500 },
});
export const MAX_FOLLOWUP_ROWS = 31;

const number = (v) => {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (typeof v !== 'string') return null;
  const t = v.trim().replace(',', '.');
  if (!t || !/^[+-]?(\d+(\.\d*)?|\.\d+)$/.test(t)) return null;
  return Number(t);
};
const empty = (v) => v === undefined || v === null || String(v).trim() === '';

// null when empty or valid; otherwise { code: 'nan' | 'integer' | 'range', min, max }.
export function checkFollowupValue(field, value) {
  const lim = FOLLOWUP_FIELDS[field];
  if (!lim || empty(value)) return null;
  const x = number(value);
  if (x === null) return { code: 'nan', ...lim };
  if (lim.integer && !Number.isInteger(x)) return { code: 'integer', ...lim };
  if (x < lim.min || x > lim.max) return { code: 'range', value: x, ...lim };
  return null;
}

// rows: [{ day, kcal, protein }] as entered; targetFor(day) → { kcal, protein } or null.
// A row counts when its day and both delivered values are valid; missing values are never zero.
export function followupSummary(rows, targetFor, { icu = true } = {}) {
  const out = [];
  let energy = 0;
  let protein = 0;
  let counted = 0;
  for (const r of rows) {
    const bad = ['day', 'kcal', 'protein'].some((f) => checkFollowupValue(f, r[f]));
    const day = bad ? null : number(r.day);
    const kcal = bad ? null : number(r.kcal);
    const prot = bad ? null : number(r.protein);
    const complete = day !== null && kcal !== null && prot !== null;
    const target = complete ? targetFor(day) : null;
    const row = { day, kcal, protein: prot, complete, target, invalid: bad };
    if (complete && target && target.kcal > 0 && target.protein > 0) {
      row.pctKcal = (kcal / target.kcal) * 100;
      row.pctProtein = (prot / target.protein) * 100;
      // Early ICU phase: energy clearly above the cautious day target.
      row.over = icu && day <= 7 && kcal > target.kcal * 1.1;
      energy += kcal - target.kcal;
      protein += prot - target.protein;
      counted += 1;
    }
    out.push(row);
  }
  return { rows: out, counted, energyBalance: counted ? energy : null, proteinBalance: counted ? protein : null };
}
