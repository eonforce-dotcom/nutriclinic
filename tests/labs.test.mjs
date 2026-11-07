// Tests of laboratory units, conversions, derived indices and their effect on the recommendation.
// SPDX-License-Identifier: AGPL-3.0-only
import test from 'node:test';
import assert from 'node:assert/strict';
import { recommend } from '../web/engine.mjs';
import { checkLab, readLab, labIndices, phosphateDrop } from '../web/labs.mjs';
import { SOURCES } from '../web/sources.mjs';

const close = (a, b, tol = 0.01) => assert.ok(Math.abs(a - b) <= tol, `${a} ≠ ${b}`);
const read = (key, value, unit) => {
  const invalid = [];
  const x = readLab({ [key]: value, [`${key}Unit`]: unit }, key, invalid);
  assert.deepEqual(invalid, []);
  return x;
};

test('Conversions from the usual Turkish units to canonical units', () => {
  close(read('phosphate', '2,0', 'mg/dL'), 0.6458, 0.001);
  close(read('magnesium', '1.8', 'mg/dL'), 0.7406, 0.001);
  close(read('creatinine', '88.42', 'µmol/L'), 1.0, 0.0001);
  close(read('urea', '20', 'BUN mg/dL'), 42.88, 0.01);
  close(read('urea', '10', 'mmol/L'), 60.06, 0.01);
  close(read('albumin', '3.5', 'g/dL'), 35, 1e-9);
  close(read('crp', '2', 'mg/dL'), 20, 1e-9);
  close(read('lymphocytes', '1500', '/µL'), 1.5, 1e-9);
  close(read('vitD', '50', 'nmol/L'), 20.03, 0.01);
  // Default unit = first in the list (mg/dL for phosphate).
  close(read('phosphate', '3.1'), 1.001, 0.001);
});

test('Laboratory errors give the limits in the entered unit', () => {
  const e = checkLab('phosphate', '30', 'mg/dL');
  assert.equal(e.code, 'range');
  close(e.min, 0.155, 0.001);
  close(e.max, 24.78, 0.01);
  assert.equal(checkLab('phosphate', '1', 'g/L').code, 'unit');
  assert.equal(checkLab('potassium', 'abc', 'mmol/L').code, 'nan');
  assert.equal(checkLab('potassium', '', 'mmol/L'), null);
  const r = recommend({ setting: 'ward', weightKg: 70, phosphate: '40', phosphateUnit: 'mg/dL' });
  assert.ok(r.blocked);
  assert.deepEqual(r.invalid, ['phosphate']);
});

test('Indices: NLR, PNI and the urea/creatinine ratio in both conventions', () => {
  const ix = labIndices({ neutrophils: 8, lymphocytes: 1, albumin: 35, urea: 60, creatinine: 1 });
  close(ix.nlr, 8, 1e-9);
  close(ix.pni, 40, 1e-9);
  close(ix.ucrMass, 60, 1e-9);
  close(ix.ucrMolar, 112.98, 0.05);
  assert.deepEqual(labIndices({ neutrophils: 8, lymphocytes: 0, albumin: null, urea: null, creatinine: null }), {});
});

test('Phosphate: below 0.65 or a fall above 0.16 mmol/L', () => {
  assert.equal(phosphateDrop({ phosphate: 0.6, phosphateBefore: null }), true);
  assert.equal(phosphateDrop({ phosphate: 1.0, phosphateBefore: 1.2 }), true);
  assert.equal(phosphateDrop({ phosphate: 1.0, phosphateBefore: 1.1 }), false);
  assert.equal(phosphateDrop({ phosphate: 1.0, phosphateBefore: null }), null);
  assert.equal(phosphateDrop({ phosphate: null, phosphateBefore: 1.1 }), null);
});

test('Engine: phosphate during feeding gives refeeding hypophosphataemia; before feeding a low level', () => {
  const icu = { setting: 'icu', age: 60, sex: 'male', heightCm: 175, weightKg: 75, icuDay: 4, swallow: 'unsafe', gi: 'ok', shock: 'none', feeding: 'ongoing', kidney: 'normal' };
  const r = recommend({ ...icu, phosphate: '1.8', phosphateUnit: 'mg/dL' });
  assert.equal(r.input.hypoPhosphate, true);
  assert.deepEqual(r.labs.findings, ['hypoPhosphate']);
  assert.ok(r.notes.some((n) => n.text.tr.includes('laboratuvardan')));
  const fall = recommend({ ...icu, phosphate: '1.0', phosphateUnit: 'mmol/L', phosphateBefore: '1.2', phosphateBeforeUnit: 'mmol/L' });
  assert.equal(fall.input.hypoPhosphate, true);
  const fine = recommend({ ...icu, phosphate: '1.0', phosphateUnit: 'mmol/L', phosphateBefore: '1.1', phosphateBeforeUnit: 'mmol/L' });
  assert.notEqual(fine.input.hypoPhosphate, true);
  const ward = { setting: 'ward', age: 60, sex: 'female', heightCm: 160, weightKg: 60, swallow: 'safe', oralIntakePct: 60, kidney: 'normal', feeding: 'none', weightLossPct: 0, lowIntakeDays: 0, alcohol: 'no', riskDrugs: 'no' };
  const low = recommend({ ...ward, phosphate: '0.6', phosphateUnit: 'mmol/L' });
  assert.equal(low.input.lowElectrolytes, true);
  assert.equal(low.refeeding.level, 'high');
  const conflict = recommend({ ...ward, lowElectrolytes: 'no', phosphate: '0.6', phosphateUnit: 'mmol/L' });
  assert.equal(conflict.refeeding.level, 'high');
  assert.ok(conflict.warnings.some((w) => w.tr.includes('Hayır')));
});

test('Engine: indices are reported with their sources; CRP and 25(OH)D take units', () => {
  const r = recommend({ setting: 'ward', age: 70, sex: 'male', heightCm: 172, weightKg: 70, swallow: 'safe', oralIntakePct: 80, kidney: 'normal', neutrophils: '9', lymphocytes: '1.2', albumin: '3.2', albuminUnit: 'g/dL', urea: '80', creatinine: '1.0', crp: '12', crpUnit: 'mg/dL', vitD: '25', vitDUnit: 'nmol/L' });
  close(r.labs.indices.nlr, 7.5, 1e-9);
  close(r.labs.indices.pni, 38, 1e-9);
  close(r.labs.indices.ucrMass, 80, 1e-9);
  close(r.input.crp, 120, 1e-9);
  assert.ok(r.notes.some((n) => n.text.tr.includes('CRP 120')));
  assert.ok(r.supplements.some((s) => s.id === 'vitd'));
  for (const id of ['nlr-2001', 'pni-1984', 'ucr-trauma-2019', 'ucr-crrt-2025']) assert.ok(r.sources.includes(id), id);
  for (const id of r.sources) assert.ok(SOURCES[id], `unknown source ${id}`);
});

test('Audit fixes: lower limits decide low pre-feeding electrolytes; no population default', () => {
  const ward = { setting: 'ward', age: 60, sex: 'female', heightCm: 160, weightKg: 60, swallow: 'safe', oralIntakePct: 60, kidney: 'normal', feeding: 'none', weightLossPct: 0, lowIntakeDays: 0, alcohol: 'no', riskDrugs: 'no' };
  // Potassium 3.1 below the laboratory's 3.5: low → high risk.
  const k = recommend({ ...ward, potassium: '3.1', potassiumLow: '3.5' });
  assert.deepEqual(k.labs.lowKeys, ['potassium']);
  assert.equal(k.refeeding.level, 'high');
  // Phosphate 0.72 mmol/L without a lower limit: not judged, asked as missing data (high while the question is open).
  const p = recommend({ ...ward, phosphate: '0.72', phosphateUnit: 'mmol/L' });
  assert.equal(p.input.lowElectrolytes, null);
  assert.ok(p.missing.some((x) => x.field === 'lab-limits' && x.impact === 'high' && x.focus === 'phosphateLow'));
  // With the laboratory's lower limit 0.81 the same value is low.
  const pl = recommend({ ...ward, phosphate: '0.72', phosphateUnit: 'mmol/L', phosphateLow: '0.81' });
  assert.deepEqual(pl.labs.lowKeys, ['phosphate']);
  assert.equal(pl.input.lowElectrolytes, true);
  // A lower limit follows the unit of its value (mg/dL): 2.3 mg/dL with lower limit 2.5 mg/dL is low.
  const mg = recommend({ ...ward, phosphate: '2.3', phosphateUnit: 'mg/dL', phosphateLow: '2.5' });
  assert.deepEqual(mg.labs.lowKeys, ['phosphate']);
  // All three above their lower limits with the question unanswered: the criterion is absent.
  const ok = recommend({ ...ward, potassium: '4.0', potassiumLow: '3.5', phosphate: '3.5', phosphateLow: '2.5', magnesium: '2.0', magnesiumLow: '1.6' });
  assert.equal(ok.input.lowElectrolytes, false);
  assert.ok(ok.labs.findings.includes('normalBeforeFeeding'));
  assert.equal(ok.refeeding.level, 'low');
  assert.ok(ok.sources.includes('nice-cg32') && !ok.sources.includes('espen-icu-2023'));
});

test('Audit fixes: an unticked hypophosphataemia box is overruled with a warning; exact 0.16 fall is not "more than"', () => {
  const icu = { setting: 'icu', age: 60, sex: 'male', heightCm: 175, weightKg: 75, icuDay: 4, swallow: 'unsafe', gi: 'ok', shock: 'none', feeding: 'ongoing', kidney: 'normal' };
  const r = recommend({ ...icu, hypoPhosphate: false, phosphate: '0.6', phosphateUnit: 'mmol/L' });
  assert.equal(r.input.hypoPhosphate, true);
  assert.ok(r.warnings.some((w) => w.tr.includes('işaretli kabul edildi')));
  const ticked = recommend({ ...icu, hypoPhosphate: true, phosphate: '0.6', phosphateUnit: 'mmol/L' });
  assert.ok(ticked.labs.findings.includes('hypoPhosphate'));
  assert.ok(ticked.notes.some((n) => n.text.tr.includes('laboratuvardan')));
  assert.equal(phosphateDrop({ phosphate: 0.84, phosphateBefore: 1.0 }), false);
  const low = recommend({ ...icu, potassium: '3.0', potassiumLow: '3.5' });
  assert.ok(low.labs.findings.includes('lowDuringFeeding'));
  assert.equal(checkLab('potassium', '4', 'g/L').code, 'unit');
});
