// Tests of laboratory units, conversions, derived indices and their effect on the recommendation.
// SPDX-License-Identifier: AGPL-3.0-only
import test from 'node:test';
import assert from 'node:assert/strict';
import { recommend, checkNumber, checkProduct } from '../web/engine.mjs';
import { checkLab, readLab, labIndices, phosphateDrop, parseCSV, importText, labFlags, sofa2, rowsFromText } from '../web/labs.mjs';
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

test('Import: Turkish CSV headers and names, units, dates; the latest row of a test is preselected', () => {
  const csv = 'Tetkik;Değer;Birim;Tarih\nFosfor;2,3;mg/dL;06.11.2026\nPotasyum;3,4;mmol/L;2026-11-05\nPotasyum;3,9;mmol/L;2026-11-06\nBUN;20;mg/dL;\nNötrofil#;5,2;10^3/uL;\nHemoglobin;12;g/dL;\nKreatinin;140;µmol/L;31.02.2026';
  assert.equal(parseCSV(csv).length, 7);
  const rows = importText('lab.csv', csv);
  const by = (t) => rows.find((r) => r.test === t);
  assert.equal(by('Fosfor').key, 'phosphate');
  assert.equal(by('Fosfor').date, '2026-11-06');
  assert.equal(by('BUN').unit, 'BUN mg/dL');
  assert.equal(by('Nötrofil#').unit, '10³/µL');
  assert.equal(by('Hemoglobin').error, 'test');
  assert.equal(by('Kreatinin').error, 'date');
  const pot = rows.filter((r) => r.key === 'potassium');
  assert.deepEqual(pot.map((r) => r.selected), [false, true]);
  const json = importText('lab.json', JSON.stringify([{ test: 'CRP', value: 12, unit: 'mg/L', date: '2026-11-06' }, { test: 'Albümin', value: '3,1', unit: 'g/dL' }]));
  assert.equal(json.filter((r) => r.selected).length, 2);
  assert.throws(() => parseCSV('a,b\n1,2'), /header/);
  assert.throws(() => importText('x.json', '{"a":1}'), /json/);
});

test('Reference flags and the CRP ratio from the laboratory limits', () => {
  assert.deepEqual(labFlags({ potassium: 3.1, potassiumLow: 3.5, potassiumHigh: 5.1, crp: 50, crpLow: null, crpHigh: 5, albumin: 40, albuminLow: null, albuminHigh: null }), { potassium: 'low', crp: 'high' });
  const r = recommend({ setting: 'ward', age: 60, sex: 'male', heightCm: 175, weightKg: 75, swallow: 'safe', oralIntakePct: 80, kidney: 'normal', crp: '50', crpHigh: '5' });
  close(r.labs.indices.crpRatio, 10, 1e-9);
  assert.equal(r.labs.flags.crp, 'high');
});

test('SOFA-2: components, total only when all six are known, ICU only', () => {
  const s = sofa2({ gcs: 14, delirium: false, pao2: 80, fio2: 0.4, ventilation: 'none', cvMechanical: false, ne: 0.15, epi: 0, otherVaso: false, map: 65, bilirubin: 2.5, rrt: false, creatinine: 1.5, urine: 'oliguria12', platelets: 90 });
  assert.deepEqual(s.components, { brain: 1, respiratory: 2, cardiovascular: 2, liver: 1, kidney: 2, hemostasis: 2 });
  assert.equal(s.total, 10);
  assert.equal(sofa2({ gcs: null, delirium: null, pao2: 60, fio2: 1, ventilation: 'advanced', cvMechanical: null, ne: null, epi: null, otherVaso: null, map: null, bilirubin: null, rrt: true, creatinine: null, urine: null, platelets: null }).total, null);
  const icu = { setting: 'icu', age: 60, sex: 'male', heightCm: 175, weightKg: 75, icuDay: 2, swallow: 'unsafe', gi: 'ok', shock: 'none', kidney: 'normal', creatinine: '1.5' };
  const r = recommend({ ...icu, sofaGcs: 14, sofaDelirium: 'no', sofaPao2: 80, sofaFio2: 40, sofaVent: 'none', sofaMechanical: 'no', sofaNe: 0.15, sofaEpi: 0, sofaOtherVaso: 'no', sofaMap: 65, bilirubin: '2.5', sofaUrine: 'oliguria12', platelets: '90', saps2: 41 });
  assert.equal(r.icuScores.sofa2.total, 10);
  assert.equal(r.icuScores.saps2, 41);
  assert.ok(r.sources.includes('sofa2-2025') && r.sources.includes('saps2-1993'));
  assert.equal(recommend({ ...icu, kidney: 'crrt' }).icuScores.sofa2.entered, false);
  assert.equal(recommend({ ...icu, setting: 'ward', sofaGcs: 14 }).icuScores, undefined);
  assert.deepEqual(recommend({ ...icu, sofaFio2: 15 }).invalid, ['sofaFio2']);
});

test('Codex audit fixes: missing unit, inverted limits, quoted delimiter, wide rows and duplicate headers', () => {
  const noUnit = importText('a.json', JSON.stringify([{ test: 'potassium', value: 4 }]));
  assert.equal(noUnit[0].error, 'unit-missing');
  assert.deepEqual(labFlags({ potassium: 4, potassiumLow: 5, potassiumHigh: 3 }), { potassium: 'inverted' });
  const ward = { setting: 'ward', age: 60, sex: 'female', heightCm: 160, weightKg: 60, swallow: 'safe', oralIntakePct: 60, kidney: 'normal', feeding: 'none', weightLossPct: 0, lowIntakeDays: 0, alcohol: 'no', riskDrugs: 'no' };
  const inv = recommend({ ...ward, potassium: '3.1', potassiumLow: '5', potassiumHigh: '3' });
  assert.deepEqual(inv.labs.lowKeys, []);
  assert.ok(inv.warnings.some((w) => w.tr.includes('alt sınır üst sınırdan büyük')));
  const quoted = parseCSV('test,value,unit,"note;detail"\npotassium,4,mmol/L,x');
  assert.equal(quoted[0].value, '4');
  const wide = importText('w.csv', 'test,value,unit\npotassium,4,mmol/L,extra');
  assert.equal(wide[0].error, 'wide');
  assert.throws(() => parseCSV('test,value,unit,value\npotassium,4,mmol/L,5'), /header-dup/);
});

test('Report text (PDF): laboratory lines recognised; single-letter names and censored values skipped', () => {
  const text = 'HASTA RAPORU\nPotasyum 3,4 mmol/L 3,5 - 5,1\nFosfor (P) 2,1 mg/dL 2,5-4,5\nKreatinin 1,2 mg/dL\nK 4,0 mmol/L\nCRP <0,5 mg/L\nÜre 45 mg/dL\nNötrofil# 7,2 10^3/uL\nAçıklama: numune hemolizli\nPotasyum 4,4 mmol/L';
  const { rows, truncated } = rowsFromText(text);
  assert.equal(truncated, false);
  const ok = rows.filter((r) => !r.error);
  assert.deepEqual(ok.map((r) => r.key), ['potassium', 'phosphate', 'creatinine', 'urea', 'neutrophils', 'potassium']);
  assert.equal(ok[0].value, '3,4');
  assert.equal(ok[0].line, 'Potasyum 3,4 mmol/L 3,5 - 5,1');
  assert.equal(ok[1].unit, 'mg/dL');
  assert.equal(ok[4].unit, '10³/µL');
  // Two different undated potassium results: none is preselected, the clinician chooses.
  assert.deepEqual(rows.filter((r) => r.selected).map((r) => `${r.key}:${r.value}`), ['phosphate:2,1', 'creatinine:1,2', 'urea:45', 'neutrophils:7,2']);
  assert.deepEqual(rows.filter((r) => r.choose).map((r) => r.value), ['3,4', '4,4']);
});

test('Report text (PDF): censored results, qualified tests, reference ranges and neighbouring values are never taken', () => {
  const count = (line) => rowsFromText(line).rows.length;
  for (const line of ['CRP < 0,5 mg/L', 'CRP <0,5 mg/L', 'Potasyum > 6,5 mmol/L', 'CRP ≤0,5 mg/L', 'CRP ≥ 200 mg/L']) assert.equal(count(line), 0, line);
  for (const line of ['Kreatinin (idrar) 12 mg/dL', 'İdrar kreatinin 80 mg/dL', 'Bilirubin direkt 0,3 mg/dL', 'Bilirubin direct 2.0 mg/dL', 'Kreatinin kinaz 150 U/L', 'Mikroalbumin 30 mg/L']) assert.equal(count(line), 0, line);
  for (const line of ['Urea - Creatinine 1.2 mg/dL', 'CRP 1e2 mg/L 5 mg/L', 'Potasyum 3,5-5,1 mmol/L', 'Potasyum 3,5 - 5,1 mmol/L', 'Potasyum mmol/L 3,5 - 5,1']) assert.equal(count(line), 0, line);
});

test('Report text (PDF): flags, units before or around the value, dates, qualifiers, two tests on a line, pages', () => {
  const one = (line) => { const r = rowsFromText(line).rows; assert.equal(r.length, 1, line); return r[0]; };
  assert.equal(one('Potasyum 6.2H mmol/L 4.5 mmol/L').value, '6.2');
  const flagged = one('Potasyum 4,1 H mmol/L 3,5-5,1');
  assert.deepEqual([flagged.value, flagged.unit, flagged.error], ['4,1', 'mmol/L', undefined]);
  assert.equal(one('Albumin 3,2 g/ dL 3,5-5,2').unit, 'g/dL');
  assert.equal(one('Nötrofil 4,50 x 10^3/µL').unit, '10³/µL');
  const before = one('Potasyum mmol/L 3,8 3,5-5,1');
  assert.deepEqual([before.value, before.unit], ['3,8', 'mmol/L']);
  assert.equal(one('Potasyum (K) 4,2 mmol/L').key, 'potassium');
  assert.equal(one('Albümin (serum) 3,1 g/dL').key, 'albumin');
  assert.equal(one('Bilirubin total 1,2 mg/dL').key, 'bilirubin');
  assert.equal(one('25(OH)D 18 ng/mL').key, 'vitD');
  assert.equal(one('D vitamini (25-OH) 18 ng/mL').key, 'vitD');
  assert.equal(one('CRP (Kantitatif) 12,4 mg/L 0-5').value, '12,4');
  assert.equal(one('C-Reaktif Protein (CRP) 12,4 mg/L <5').key, 'crp');
  assert.equal(one('Kan Üre Azotu (BUN) 26 mg/dL').unit, 'BUN mg/dL');
  assert.equal(rowsFromText('NEU% 74,0 %\nLenfosit % 25 %').rows.length, 0);
  const dated = one('07.11.2026 08:30 Kreatinin 1,1 mg/dL 0,7-1,3');
  assert.deepEqual([dated.key, dated.date], ['creatinine', '2026-11-07']);
  const two = rowsFromText('Potasyum 4,1 mmol/L 3,5-5,1 Fosfor 1,8 mg/dL 2,5-4,5').rows;
  assert.deepEqual(two.map((r) => `${r.key}:${r.value}`), ['potassium:4,1', 'phosphate:1,8']);
  // Dated results of one test: the latest is preselected.
  const days = rowsFromText('Potasyum 05.11.2026 4,4 mmol/L\nPotasyum 06.11.2026 2,4 mmol/L').rows;
  assert.deepEqual(days.map((r) => r.date), ['2026-11-05', '2026-11-06']);
  assert.deepEqual(days.map((r) => r.selected), [false, true]);
  assert.deepEqual(rowsFromText(['Potasyum 4 mmol/L', 'Kreatinin 1 mg/dL']).rows.map((r) => r.page), [1, 2]);
  const many = rowsFromText(Array.from({ length: 301 }, (_, i) => `Potasyum ${(3 + (i % 10) / 10).toFixed(1)} mmol/L`).join('\n'));
  assert.deepEqual([many.rows.length, many.truncated], [300, 'rows']);
  // An incomplete text preselects nothing: a later, conflicting result may have been left out.
  assert.equal(many.rows.filter((r) => r.selected).length, 0);
});

test('Report text (PDF): second check of the fixes', () => {
  const count = (line) => rowsFromText(line).rows.length;
  // Comparators glued to a qualifier, a urea name with a BUN qualifier, a range written with units.
  for (const line of ['CRP (serum)≤ 0.5 mg/L', 'CRP (serum)< 0.5 mg/L', 'Urea (BUN) 26 mg/dL', 'Üre (BUN) 26 mg/dL', 'BUN (Üre) 26 mg/dL', 'Potasyum 3,5 mmol/L - 5,1 mmol/L']) assert.equal(count(line), 0, line);
  // A time, date or specimen word between the value and its unit.
  const two = rowsFromText('06.11.2026 Potasyum 4.1 mmol/L\n07.11.2026 Potasyum 2.4 08:30 mmol/L').rows;
  assert.deepEqual(two.map((r) => [r.unit, r.date, r.selected]), [['mmol/L', '2026-11-06', false], ['mmol/L', '2026-11-07', true]]);
  const crp = rowsFromText('CRP 12 06.11.2026 mg/L').rows[0];
  assert.deepEqual([crp.unit, crp.date, crp.error], ['mg/L', '2026-11-06', undefined]);
  assert.equal(rowsFromText('Potasyum 4 serum mmol/L').rows[0].unit, 'mmol/L');
  // A recognised but unusable row of the same test blocks preselection of the other.
  const plt = rowsFromText('Trombosit 250.000 /µL\nTrombosit 180 10^3/µL').rows;
  assert.deepEqual(plt.map((r) => [r.error, r.selected, r.choose]), [['grouping', false, false], [undefined, false, true]]);
  // A long line: the row shows its own part of the line, including the value.
  const long = rowsFromText(`${'Potasyum 4.1 mmol/L '.repeat(12)}CRP 12 mg/L`).rows.find((r) => r.key === 'crp');
  assert.ok(long.line.includes('CRP 12 mg/L'), long.line);
  // Two-column reports: a test that is not ours on the left is passed over, never imported.
  assert.deepEqual(rowsFromText('Hemoglobin 12,1 g/dL 12-16 Albumin 3,1 g/dL 3,5-5,2').rows.map((r) => `${r.key}:${r.value}`), ['albumin:3,1']);
  assert.deepEqual(rowsFromText('Sodyum 138 mmol/L Potasyum 4,2 mmol/L').rows.map((r) => `${r.key}:${r.value}`), ['potassium:4,2']);
  assert.deepEqual(rowsFromText('Kreatinin (idrar) 80 mg/dL Kreatinin 1,0 mg/dL').rows.map((r) => `${r.key}:${r.value}`), ['creatinine:1,0']);
  assert.equal(count('CRP < 0,5 mg/L Potasyum 4,2 mmol/L'), 0);
  assert.equal(count('İdrar Kreatinin 80 mg/dL'), 0);
  // A comparator in a file row.
  assert.equal(importText('lab.csv', 'test;value;unit\nCRP <;0.5;mg/L\nCRP;<0,5;mg/L')[0].error, 'censored');
  assert.equal(importText('lab.csv', 'test;value;unit\nCRP;<0,5;mg/L')[0].error, 'censored');
  // Signed thousands separators.
  assert.equal(checkLab('urea', '+1.000', 'mg/dL').code, 'grouping');
  assert.equal(checkNumber('measuredEE', '+1.800').code, 'grouping');
  assert.equal(checkProduct('ons.kcal', '+1.200').code, 'grouping');
});

test('Thousands separators are refused instead of being read as a decimal point', () => {
  assert.equal(checkLab('platelets', '250.000', '/µL').code, 'grouping');
  assert.equal(checkLab('platelets', '250,000', '/µL').code, 'grouping');
  assert.equal(checkLab('neutrophils', '4,5', '/µL').code, 'grouping');
  assert.equal(checkLab('platelets', '250000', '/µL'), null);
  assert.equal(checkLab('platelets', '250', '10³/µL'), null);
  assert.equal(checkLab('neutrophils', '4,5', '10³/µL'), null);
  assert.equal(checkLab('urea', '1.000', 'mg/dL').code, 'grouping');
  assert.equal(checkLab('potassium', '4.500', 'mmol/L'), null);
  assert.deepEqual(rowsFromText('Trombosit 250.000 /µL\nPlatelets 250,000 /uL').rows.map((r) => r.error), ['grouping', 'grouping']);
  assert.equal(checkNumber('measuredEE', '1.800').code, 'grouping');
  assert.equal(checkNumber('measuredEE', '1800'), null);
  assert.equal(checkNumber('weightKg', '72.500'), null);
  assert.equal(checkProduct('ons.kcal', '1.200').code, 'grouping');
});
