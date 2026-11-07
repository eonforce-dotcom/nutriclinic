// Tests of the screening and assessment scales and of how they change the recommendation.
// SPDX-License-Identifier: AGPL-3.0-only
import test from 'node:test';
import assert from 'node:assert/strict';
import { recommend, normalize, bodyMetrics } from '../web/engine.mjs';
import { nrs2002, glim, espen2015, aspen, ewgsop2, eat10, swallowStatus } from '../web/scales.mjs';
import { SOURCES } from '../web/sources.mjs';

const prep = (raw) => {
  const { p, invalid } = normalize(raw);
  assert.deepEqual(invalid, []);
  p.swallow = swallowStatus(p).value;
  return { p, m: bodyMetrics(p) };
};

test('NRS 2002: weight loss in 2 months, BMI <20.5 with impaired condition, age 75 → 2 + 1 + 1 = 4', () => {
  const { p, m } = prep({ setting: 'ward', age: 75, sex: 'female', heightCm: 160, weightKg: 52, usualWeightKg: 56, lossMonths: 2, nrsImpaired: 'yes', swallow: 'safe', oralIntakePct: 80, nrsDisease: 1 });
  const r = nrs2002(p, m);
  assert.equal(r.nutrition, 2);
  assert.equal(r.score, 4);
  assert.equal(r.exact, true);
  assert.equal(r.status, 'risk');
});

test('NRS 2002: complete and below 3 → no risk; unknown intake keeps it incomplete', () => {
  const base = { setting: 'ward', age: 50, sex: 'male', heightCm: 175, weightKg: 80, weightLossPct: 0, swallow: 'safe', nrsDisease: 1 };
  const a = prep({ ...base, oralIntakePct: 90 });
  assert.equal(nrs2002(a.p, a.m).status, 'no_risk');
  const b = prep(base);
  assert.equal(nrs2002(b.p, b.m).status, 'incomplete');
  const c = prep({ ...base, nrsNutrition: 0 });
  const rc = nrs2002(c.p, c.m);
  assert.equal(rc.status, 'no_risk');
  assert.equal(rc.score, 1);
});

test('NRS 2002: disease score 3 alone already means risk (score is a lower bound)', () => {
  const { p, m } = prep({ setting: 'icu', age: 60, sex: 'male', heightCm: 170, weightKg: 70, nrsDisease: 3 });
  const r = nrs2002(p, m);
  assert.equal(r.status, 'risk');
  assert.equal(r.exact, false);
  assert.equal(r.score, 3);
});

test('NRS 2002: a clinician score below the data is replaced by the data, with a warning', () => {
  const { p, m } = prep({ setting: 'ward', age: 50, heightCm: 170, weightKg: 70, lowIntakeDays: 8, nrsNutrition: 1, nrsDisease: 0 });
  const r = nrs2002(p, m);
  assert.equal(r.nutrition, 3);
  assert.equal(r.warnings.length, 1);
  assert.equal(r.status, 'risk');
});

test('GLIM: 12.5% loss in 3 months in the ICU = stage 2 (severe); early PN when the gut cannot be used', () => {
  const raw = { setting: 'icu', age: 60, sex: 'male', heightCm: 175, weightKg: 70, usualWeightKg: 80, lossMonths: 3, icuDay: 1, gi: 'contraindicated', shock: 'none', kidney: 'normal' };
  const { p, m } = prep(raw);
  const g = glim(p, m);
  assert.equal(g.status, 'met');
  assert.equal(g.stage, 2);
  assert.equal(g.criteria.inflammationFrom, 'data');
  const r = recommend(raw);
  assert.equal(r.route.kind, 'pn');
  assert.equal(r.route.earlyPn, true);
  assert.ok(r.notes.some((n) => n.src.includes('glim-2019')));
  const r2 = recommend({ ...raw, usualWeightKg: 71 });
  assert.equal(r2.route.kind, 'pn-later');
  assert.ok(r2.missing.some((x) => x.field === 'glimMuscle' && x.impact === 'high'));
});

test('GLIM: BMI 19.5 at age 75 with reduced intake = stage 2; age-specific cut-off', () => {
  const { p, m } = prep({ setting: 'ward', age: 75, sex: 'female', heightCm: 160, weightKg: 49.9, glimIntake: 'yes' });
  const g = glim(p, m);
  assert.equal(g.status, 'met');
  assert.equal(g.stage, 2);
  const young = prep({ setting: 'ward', age: 50, sex: 'female', heightCm: 160, weightKg: 49.9, glimIntake: 'yes' });
  assert.equal(glim(young.p, young.m).stage, 1);
});

test('GLIM: unknown loss period, normal BMI → incomplete; all phenotypes normal → not met; oedema → not reassuring', () => {
  const a = prep({ setting: 'ward', age: 50, sex: 'male', heightCm: 175, weightKg: 74, weightLossPct: 7 });
  assert.equal(glim(a.p, a.m).status, 'incomplete');
  const b = prep({ setting: 'ward', age: 50, sex: 'male', heightCm: 175, weightKg: 77, weightLossPct: 2, glimMuscle: 'normal' });
  assert.equal(glim(b.p, b.m).status, 'not_met');
  const c = prep({ setting: 'ward', age: 50, sex: 'male', heightCm: 175, weightKg: 77, weightLossPct: 2, glimMuscle: 'normal', oedema: true });
  assert.equal(glim(c.p, c.m).status, 'incomplete');
});

test('ESPEN 2015: option 1 (BMI <18.5), option 2 (loss with low BMI or low FFMI), negative screening', () => {
  const risk = { status: 'risk' };
  const a = prep({ setting: 'ward', age: 50, sex: 'female', heightCm: 170, weightKg: 51.7 });
  const ra = espen2015(a.p, a.m, risk);
  assert.equal(ra.status, 'met');
  assert.equal(ra.option, 1);
  const b = prep({ setting: 'ward', age: 50, sex: 'female', heightCm: 165, weightKg: 53, weightLossPct: 12 });
  assert.equal(espen2015(b.p, b.m, risk).option, 2);
  const c = prep({ setting: 'ward', age: 50, sex: 'female', heightCm: 165, weightKg: 60, weightLossPct: 6, lossMonths: 2, ffmKg: 38 });
  const rc = espen2015(c.p, c.m, risk);
  assert.ok(rc.ffmi < 15);
  assert.equal(rc.status, 'met');
  assert.equal(espen2015(c.p, c.m, { status: 'no_risk' }).status, 'not_applicable');
});

test('AND/ASPEN: two characteristics in a context = met; grip is not counted in the ICU', () => {
  const a = normalize({ setting: 'ward', aspenContext: 'acute', aspenIntake: 'yes', aspenMuscle: 'yes' }).p;
  assert.equal(aspen(a).status, 'met');
  const b = normalize({ setting: 'icu', aspenContext: 'acute', aspenIntake: 'yes', aspenGrip: 'yes' }).p;
  const rb = aspen(b);
  assert.equal(rb.count, 1);
  assert.equal(rb.gripExcluded, true);
  assert.equal(rb.status, 'incomplete');
});

test('EWGSOP2: thresholds, severity, the corrected female ASM index (<5.5) and ICU review', () => {
  const met = ewgsop2(normalize({ setting: 'ward', sex: 'female', heightCm: 160, gripKg: 14, asmKg: 14, gaitSpeed: 0.7 }).p);
  assert.equal(met.status, 'met');
  assert.equal(met.severe, true);
  assert.equal(ewgsop2(normalize({ setting: 'ward', sex: 'male', gripKg: 30, chairRiseS: 12 }).p).status, 'not_met');
  const lowIndex = ewgsop2(normalize({ setting: 'ward', sex: 'female', heightCm: 168, gripKg: 14, asmKg: 15.5 }).p);
  assert.ok(lowIndex.asmIndex < 5.5);
  assert.equal(lowIndex.lowMass, true);
  const normalIndex = ewgsop2(normalize({ setting: 'ward', sex: 'female', heightCm: 168, gripKg: 14, asmKg: 16 }).p);
  assert.ok(normalIndex.asmIndex > 5.5 && normalIndex.asmIndex < 6.0);
  assert.equal(normalIndex.lowMass, false);
  assert.equal(normalIndex.status, 'review');
  assert.equal(ewgsop2(normalize({ setting: 'ward', sex: 'female', gripKg: 14 }).p).status, 'probable');
  assert.equal(ewgsop2(normalize({ setting: 'icu', sex: 'female', gripKg: 10, asmKg: 12 }).p).status, 'review');
});

test('EAT-10: ≥3 abnormal, <3 not met, unreliable with impaired alertness; integers only', () => {
  assert.equal(eat10(normalize({ eat10: 3 }).p).status, 'met');
  assert.equal(eat10(normalize({ eat10: 2 }).p).status, 'not_met');
  assert.equal(eat10(normalize({ eat10: 12, impairedAlertness: true }).p).status, 'review');
  const r = recommend({ setting: 'ward', weightKg: 70, eat10: '2.5' });
  assert.ok(r.blocked);
  assert.deepEqual(r.invalid, ['eat10']);
});

test('Swallowing: FOIS, IDDSI and safety findings; the most cautious finding wins', () => {
  const s = (raw) => swallowStatus(normalize(raw).p);
  assert.equal(s({ fois: 2 }).value, 'unsafe');
  assert.equal(s({ fois: 5 }).value, 'modified');
  const c = s({ fois: 7, swallow: 'modified' });
  assert.equal(c.value, 'modified');
  assert.equal(c.conflict, true);
  assert.equal(s({ iddsiFluid: 2 }).value, 'modified');
  assert.equal(s({ iddsiFluid: 0, iddsiFood: 7 }).value, 'safe');
  assert.equal(s({ swallow: 'safe', impairedAlertness: true }).value, 'unsafe');
  assert.equal(s({}).value, null);
});

test('Engine: FOIS 1 gives tube feeding; a conflict is reported as a warning', () => {
  const r = recommend({ setting: 'ward', age: 70, sex: 'male', heightCm: 172, weightKg: 70, fois: 1, gi: 'ok', kidney: 'normal' });
  assert.equal(r.route.kind, 'en');
  assert.equal(r.input.swallow, 'unsafe');
  assert.ok(!r.missing.some((x) => x.field === 'swallow'));
  const c = recommend({ setting: 'ward', age: 70, sex: 'male', heightCm: 172, weightKg: 70, swallow: 'safe', fois: 3 });
  assert.equal(c.route.kind, 'en');
  assert.ok(c.warnings.some((w) => w.tr.includes('Yutma bilgileri birbirini tutmuyor')));
});

test('Engine: IDDSI drink level chooses the ONS: thin drinks → liquid ONS; thickened → texture-modified ONS', () => {
  const base = { setting: 'ward', age: 70, sex: 'female', heightCm: 160, weightKg: 55, swallow: 'modified', oralIntakePct: 50, kidney: 'normal', weightLossPct: 0, lowIntakeDays: 0, lowElectrolytes: 'no', alcohol: 'no', riskDrugs: 'no' };
  const thin = recommend({ ...base, iddsiFluid: 0, iddsiFood: 5 });
  assert.equal(thin.product.cls, 'ons-high-protein');
  const thick = recommend({ ...base, iddsiFluid: 2, iddsiFood: 5 });
  assert.equal(thick.product.cls, 'ons-texture');
  assert.ok(thick.notes.some((n) => n.text.tr.includes('IDDSI 2')));
  const unknown = recommend(base);
  assert.equal(unknown.product.cls, 'ons-texture');
  assert.ok(unknown.missing.some((x) => x.field === 'iddsiFluid'));
});

test('Engine: ward ONS with unknown intake — none without nutritional risk, the minimum with risk', () => {
  const base = { setting: 'ward', age: 50, sex: 'male', heightCm: 175, weightKg: 80, swallow: 'safe', kidney: 'normal', weightLossPct: 0, lowIntakeDays: 0, lowElectrolytes: 'no', alcohol: 'no', riskDrugs: 'no' };
  const none = recommend({ ...base, nrsNutrition: 0, nrsDisease: 1 });
  assert.equal(none.plan.oral.servings, 0);
  assert.equal(none.plan.oral.noRisk, true);
  assert.ok(none.sources.includes('nrs2002-2003'));
  const risk = recommend({ ...base, nrsNutrition: 1, nrsDisease: 2 });
  assert.equal(risk.scales.nrs.status, 'risk');
  assert.equal(risk.plan.oral.servings, 2);
  const unknown = recommend(base);
  assert.equal(unknown.plan.oral.servings, 2);
  assert.ok(unknown.missing.some((x) => x.field === 'nrsDisease'));
});

test('Engine: oedema makes "not met" refeeding criteria unknown; a loss over >6 months is not a NICE criterion', () => {
  const base = { setting: 'ward', age: 50, sex: 'male', heightCm: 175, weightKg: 80, weightLossPct: 0, lowIntakeDays: 0, lowElectrolytes: 'no', alcohol: 'no', riskDrugs: 'no', swallow: 'safe', oralIntakePct: 80, kidney: 'normal' };
  assert.equal(recommend(base).refeeding.level, 'low');
  assert.equal(recommend({ ...base, oedema: true }).refeeding.level, 'unknown');
  const lost = { ...base, weightKg: 67.2, usualWeightKg: 80, weightLossPct: undefined };
  assert.equal(recommend({ ...lost, lossMonths: 3 }).refeeding.level, 'high');
  assert.equal(recommend({ ...lost, lossMonths: 12 }).refeeding.level, 'unknown');
});

test('Engine: stroke — oral feeding without a dysphagia screen is flagged; sarcopenia note on the ward', () => {
  const r = recommend({ setting: 'ward', age: 72, sex: 'male', heightCm: 175, weightKg: 70, swallow: 'safe', oralIntakePct: 60, stroke: true, swallowAssessment: 'none', kidney: 'normal' });
  assert.ok(r.warnings.some((w) => w.tr.includes('öneri 52')));
  const m = recommend({ setting: 'ward', age: 72, sex: 'male', heightCm: 175, weightKg: 70, swallow: 'safe', oralIntakePct: 60, stroke: true, kidney: 'normal' });
  assert.ok(m.missing.some((x) => x.field === 'swallowAssessment'));
  const s = recommend({ setting: 'ward', age: 80, sex: 'female', heightCm: 158, weightKg: 52, swallow: 'safe', oralIntakePct: 60, gripKg: 12, asmKg: 13, kidney: 'normal' });
  assert.equal(s.scales.ewgsop2.status, 'met');
  assert.ok(s.notes.some((n) => n.src.includes('icfsr-2018')));
});

test('Engine: missing loss duration is listed; every scale source exists', () => {
  const r = recommend({ setting: 'ward', age: 60, sex: 'female', heightCm: 160, weightKg: 50, usualWeightKg: 56, swallow: 'modified', oralIntakePct: 40, fois: 5, iddsiFood: 4, iddsiFluid: 3, eat10: 15, swallowAssessment: 'vfss', nrsDisease: 2, glimMuscle: 'moderate', glimInflammation: 'yes', aspenContext: 'chronic', aspenIntake: 'yes', aspenWeight: 'yes', gripKg: 12, asmKg: 12, ffmKg: 35, kidney: 'normal' });
  assert.ok(r.missing.some((x) => x.field === 'lossMonths'));
  assert.equal(r.scales.glim.status, 'met');
  assert.equal(recommend({ setting: 'ward', age: 60, sex: 'female', heightCm: 160, weightKg: 50, glimMuscle: 'moderate' }).scales.glim.status, 'incomplete');
  for (const id of r.sources) assert.ok(SOURCES[id], `unknown source ${id}`);
  for (const id of ['glim-2019', 'aspen-malnutrition-2012', 'ewgsop2-2019', 'eat10-2008', 'fois-2005', 'iddsi-2017', 'ueg-esnm-2025']) assert.ok(r.sources.includes(id), id);
});

test('Audit fixes: ESPEN 2015 loss over a known longer period, diagnosis only after a positive screen', () => {
  const a = prep({ setting: 'ward', age: 50, sex: 'female', heightCm: 165, weightKg: 60, weightLossPct: 7, lossMonths: 6, ffmKg: 42 });
  assert.equal(espen2015(a.p, a.m, { status: 'risk' }).values.loss, false);
  assert.equal(espen2015(a.p, a.m, { status: 'risk' }).status, 'not_met');
  const b = prep({ setting: 'ward', age: 50, sex: 'female', heightCm: 170, weightKg: 51.7 });
  const rb = espen2015(b.p, b.m, { status: 'incomplete' });
  assert.equal(rb.status, 'incomplete');
  assert.equal(rb.criteriaMet, true);
});

test('Audit fixes: NRS 2002 BMI 20.5 is inside 18.5–20.5; malnutrition by AND/ASPEN keeps ward ONS', () => {
  const { p, m } = prep({ setting: 'ward', age: 50, sex: 'male', heightCm: 200, weightKg: 82, nrsImpaired: 'yes' });
  assert.equal(m.bmi, 20.5);
  assert.equal(nrs2002(p, m).nutrition, 2);
  const base = { setting: 'ward', age: 50, sex: 'male', heightCm: 175, weightKg: 80, swallow: 'safe', kidney: 'normal', weightLossPct: 0, lowIntakeDays: 0, lowElectrolytes: 'no', alcohol: 'no', riskDrugs: 'no', nrsNutrition: 0, nrsDisease: 1 };
  assert.equal(recommend(base).plan.oral.servings, 0);
  const mal = recommend({ ...base, aspenContext: 'chronic', aspenIntake: 'yes', aspenMuscle: 'yes' });
  assert.equal(mal.scales.malnutrition, true);
  assert.equal(mal.plan.oral.noRisk, false);
  assert.equal(mal.plan.oral.servings, 2);
});

test('Audit fixes: with an unusable gut the data that could show GLIM stage 2 are asked unless ruled out', () => {
  const raw = { setting: 'icu', age: 60, sex: 'male', heightCm: 170, weightKg: 56.4, icuDay: 1, gi: 'contraindicated', shock: 'none', kidney: 'normal' };
  const r = recommend(raw);
  assert.equal(r.scales.glim.status, 'met');
  assert.equal(r.scales.glim.stage, 1);
  assert.equal(r.route.kind, 'pn-later');
  assert.ok(r.missing.some((x) => x.field === 'glimMuscle' && x.impact === 'high'));
  const known = recommend({ ...raw, weightLossPct: 0, glimMuscle: 'moderate' });
  assert.equal(known.scales.glim.stageExact, true);
  assert.ok(!known.missing.some((x) => x.field === 'glimMuscle'));
});
