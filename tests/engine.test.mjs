// Engine tests. Expected values are calculated by hand from the cited rules (see docs/CLINICAL-RULES.md).
import test from 'node:test';
import assert from 'node:assert/strict';
import { recommend, bodyMetrics, normalize, refeedingRisk, nitrogenBalance } from '../web/engine.mjs';
import { SOURCES } from '../web/sources.mjs';

const near = (actual, expected, tol = 0.6, label = '') => assert.ok(Math.abs(actual - expected) <= tol, `${label} expected ≈${expected}, got ${actual}`);
const supp = (r, id) => r.supplements.find((s) => s.id === id);
const missing = (r, field) => r.missing.find((x) => x.field === field);

const icuBase = { setting: 'icu', age: 60, sex: 'male', heightCm: 175, weightKg: 70, icuDay: 1, swallow: 'unsafe', gi: 'ok', shock: 'none', kidney: 'normal' };
const lowRisk = { weightLossPct: 0, lowIntakeDays: 0, lowElectrolytes: 'no', alcohol: 'no', riskDrugs: 'no' };
const icuLow = { ...icuBase, ...lowRisk };
const wardBase = { setting: 'ward', age: 72, sex: 'female', heightCm: 160, weightKg: 55, gi: 'ok', kidney: 'normal', weightLossPct: 5, lowIntakeDays: 3, lowElectrolytes: 'no', alcohol: 'no', riskDrugs: 'no' };

test('A. ICU day 1 with refeeding data missing: cautious start 10 kcal/kg, very-high-protein formula, 23 mL/h', () => {
  const r = recommend(icuBase);
  const m = r.metrics;
  near(m.bmi, 22.86, 0.01, 'BMI');
  near(m.ibw, 70.57, 0.01, 'IBW');
  assert.equal(m.energyWeightKind, 'actual');
  near(r.fullEnergy.kcal, 1750, 0.01, 'full energy');
  assert.equal(r.route.kind, 'en');
  assert.equal(r.route.mode, 'continuous');
  const today = r.plan.today;
  near(today.kcalTarget, 700, 0.01, 'day-1 energy');
  near(today.proteinTarget, 56, 0.01, 'day-1 protein = (0.40/0.65) × 1.3 g/kg');
  assert.equal(today.cls, 'en-very-high-protein');
  assert.equal(today.rate, 23);
  assert.equal(today.volume, 552);
  assert.equal(today.moduleGrams, 0);
  assert.equal(r.refeeding.level, 'unknown');
  assert.equal(r.rfRamp, true);
  assert.match(supp(r, 'thiamine').dose.tr, /100 mg × 3\/gün IV/);
  assert.ok(supp(r, 'mvte'), 'multivitamin below 1500 kcal of formula');
  assert.equal(r.product.changeFrom, undefined, 'one formula class through the first ICU week');
  for (const f of ['refeeding', 'measuredEE', 'uun', 'propofolMlH', 'feeding']) assert.ok(missing(r, f), `missing ${f}`);
});

test('A2. ICU week 1 with low refeeding risk: below 70% (65%), protein 1.3 g/kg from day 3, one class, switch on day 8', () => {
  const rows = recommend(icuLow).plan.rows;
  assert.deepEqual(rows.map((x) => Math.round(x.kcalTarget)), [700, 875, 1138, 1138, 1138, 1138, 1138]);
  assert.deepEqual(rows.map((x) => Math.round(x.proteinTarget)), [56, 70, 91, 91, 91, 91, 91]);
  assert.ok(rows.every((x) => x.cls === 'en-very-high-protein'));
  assert.equal(rows[3].rate, 38);
  near(rows[3].formulaProtein, 91.2, 0.01, 'day-4 formula protein');
  const later = recommend({ ...icuLow, icuDay: 5, feeding: 'ongoing' });
  assert.equal(later.product.changeFrom.day, 8);
  assert.equal(later.product.changeFrom.cls, 'en-high-protein');
});

test('A3. ICU day 8 without calorimetry goes to 100% (25 kcal/kg)', () => {
  const r = recommend({ ...icuLow, icuDay: 8, feeding: 'ongoing' });
  near(r.plan.today.kcalTarget, 1750, 0.01);
  assert.equal(r.plan.today.cls, 'en-high-protein');
});

test('A4. indirect calorimetry: ≤70% to day 3, 85% day 4, 100% from day 5', () => {
  const r = recommend({ ...icuLow, measuredEE: 2000 });
  assert.deepEqual(r.plan.rows.map((x) => Math.round(x.kcalTarget)), [800, 1000, 1400, 1700, 2000, 2000, 2000]);
});

test('B. obese ICU patient: adjusted weight (IBW + 25% of excess), 1.3 g/kg adjusted, very-high-protein formula', () => {
  const r = recommend({ ...icuBase, sex: 'female', heightCm: 165, weightKg: 120, icuDay: 5, feeding: 'ongoing' });
  const m = r.metrics;
  near(m.bmi, 44.08, 0.01);
  near(m.ibw, 56.97, 0.01);
  near(m.adjusted, 72.72, 0.01);
  assert.equal(m.energyWeightKind, 'adjusted');
  near(r.plan.today.kcalTarget, 1181.8, 0.1);
  near(r.plan.today.proteinTarget, 94.54, 0.01);
  assert.equal(r.plan.today.cls, 'en-very-high-protein');
  assert.equal(r.plan.today.rate, 39, 'rounded down while the refeeding risk is undetermined');
});

test('C. CRRT: usual weight, 1.5 g/kg, module, thiamine continues during KRT', () => {
  const r = recommend({ ...icuBase, heightCm: 180, weightKg: 80, usualWeightKg: 75, icuDay: 6, feeding: 'ongoing', kidney: 'crrt' });
  assert.equal(r.metrics.proteinWeightKind, 'usual');
  near(r.plan.today.proteinTarget, 112.5, 0.01);
  near(r.plan.today.kcalTarget, 1218.75, 0.01);
  assert.equal(r.plan.today.cls, 'en-very-high-protein');
  assert.equal(r.plan.today.rate, 40);
  assert.equal(r.plan.today.moduleProtein, 17);
  assert.equal(r.plan.today.moduleGrams, 18);
  assert.equal(r.nitrogen.reason, 'missing');
  assert.ok(r.sources.includes('espen-kidney-2024'));
  assert.match(supp(r, 'thiamine').dose.tr, /Sürekli KRT boyunca 100 mg\/gün/);
});

test('C2. AKI without usual weight or height: protein uses current weight and says so; AKI starts at 1.0 g/kg', () => {
  const r = recommend({ ...icuLow, heightCm: null, kidney: 'aki', icuDay: 6, feeding: 'ongoing' });
  assert.equal(r.metrics.proteinWeightKind, 'actual');
  assert.match(missing(r, 'usualWeightKg').text.tr, /güncel kiloyla/);
  near(r.plan.today.proteinTarget, 70, 0.01);
});

test('C3. emaciated AKI patient: protein weight never above the actual weight', () => {
  const r = recommend({ ...icuLow, heightCm: 170, weightKg: 45, kidney: 'aki' });
  assert.equal(r.metrics.proteinWeight, 45);
});

test('D. high refeeding risk (NICE Box 1): 10 kcal/kg start, thiamine before feeding, electrolytes per kg', () => {
  const r = recommend({ ...icuBase, sex: 'female', heightCm: 165, weightKg: 45, weightLossPct: 12, lowIntakeDays: 7, lowElectrolytes: 'no', alcohol: 'no', riskDrugs: 'no', feeding: 'none' });
  assert.equal(r.refeeding.level, 'high');
  const kcal = r.plan.rows.map((x) => x.kcalTarget);
  near(kcal[0], 450, 0.01, 'day 1 = 10 kcal/kg');
  near(kcal[1], 520.3, 0.1);
  near(kcal[2], 590.6, 0.1);
  near(kcal[4], 731.25, 0.01, 'day 5 = 65% cap');
  assert.match(supp(r, 'thiamine').dose.tr, /300 mg IV/);
  assert.match(supp(r, 'electrolytes').dose.tr, /Potasyum 90–180 mmol\/gün/);
  assert.match(supp(r, 'mvte').dose.tr, /ilk 10 gün/);
});

test('D2. extreme refeeding risk starts at 5 kcal/kg and asks for rhythm monitoring', () => {
  const r = recommend({ ...icuBase, sex: 'female', heightCm: 170, weightKg: 39, lowIntakeDays: 20, feeding: 'none' });
  assert.equal(r.refeeding.level, 'extreme');
  near(r.plan.rows[0].kcalTarget, 195, 0.01);
  assert.ok(r.monitoring.some((x) => /ritmini/.test(x.tr)));
});

test('E. ward, 72 y, eats 50%: 27 kcal/kg, 1.2 g/kg, two high-protein ONS, ward thiamine for reduced intake', () => {
  const r = recommend({ ...wardBase, swallow: 'safe', oralIntakePct: 50 });
  assert.equal(r.refeeding.level, 'low');
  assert.equal(r.route.kind, 'oral');
  near(r.plan.oral.kcalTarget, 1485, 0.01);
  near(r.plan.oral.proteinTarget, 66, 0.01);
  assert.equal(r.plan.oral.servings, 2);
  near(r.plan.oral.totalKcal, 1342.5, 0.01);
  assert.equal(r.plan.oral.moduleProtein, 0);
  assert.match(supp(r, 'thiamine').dose.tr, /^100 mg\/gün ağızdan ya da IV/);
  assert.ok(missing(r, 'vitD'));
});

test('F. ward, eats 10%: ONS cannot reach 75%, tube feeding for the rest with fibre and fluid plan', () => {
  const r = recommend({ ...wardBase, swallow: 'safe', oralIntakePct: 10 });
  assert.equal(r.route.kind, 'en');
  assert.equal(r.route.supplementalToOral, true);
  const t = r.plan.today;
  assert.equal(t.cls, 'en-standard');
  assert.equal(t.rate, 56);
  assert.equal(t.moduleProtein, 6);
  assert.equal(r.product.fiber, true);
  near(r.plan.fluid.formulaWater, 1128.96, 0.01);
  near(r.plan.fluid.min, 1650, 0.01);
});

test('F2. ward refeeding risk while eating: ONS never pushes day 1 above 10 kcal/kg', () => {
  const base = { ...wardBase, age: 70, heightCm: 165, weightKg: 45, swallow: 'safe', weightLossPct: 12, lowIntakeDays: 7 };
  const r = recommend({ ...base, oralIntakePct: 30 });
  assert.equal(r.refeeding.level, 'high');
  near(r.plan.oral.kcalTarget, 450, 0.01);
  near(r.plan.oral.intakeKcal, 364.5, 0.01, '30% of the full need (27 kcal/kg × 45 kg)');
  assert.equal(r.plan.oral.servings, 0, 'no serving fits under the 450 kcal ceiling');
  assert.equal(r.plan.oral.capped, true);
  const hungry = recommend({ ...base, oralIntakePct: 5 });
  assert.equal(hungry.plan.oral.servings, 1);
  assert.ok(hungry.plan.oral.totalKcal <= 450);
});

test('G. burns >20% TBSA: zinc 30–35 mg IV and enteral glutamine 0.3–0.5 g/kg with the RE-ENERGIZE note', () => {
  const r = recommend({ ...icuBase, heightCm: 180, weightKg: 80, icuDay: 2, burnsTbsa: 30 });
  assert.match(supp(r, 'zinc').dose.tr, /30–35 mg\/gün IV/);
  assert.match(supp(r, 'glutamine').dose.tr, /^24–40 g\/gün/);
  assert.match(supp(r, 'glutamine').why[0].tr, /RE-ENERGIZE/);
  assert.ok(r.sources.includes('reenergize-2022'));
  const kidneyUnknown = recommend({ ...icuBase, heightCm: 180, weightKg: 80, icuDay: 2, burnsTbsa: 30, kidney: null });
  assert.match(supp(kidneyUnknown, 'glutamine').dose.tr, /verilmez/);
});

test('G2. no glutamine for a general ICU patient (ESPEN R28), for PN, or for trauma after day 5', () => {
  assert.equal(supp(recommend(icuBase), 'glutamine'), undefined);
  assert.equal(supp(recommend({ ...icuBase, burnsTbsa: 30, gi: 'contraindicated', icuDay: 4 }), 'glutamine'), undefined);
  assert.equal(supp(recommend({ ...icuBase, trauma: true, icuDay: 6, feeding: 'ongoing' }), 'glutamine'), undefined);
  assert.match(supp(recommend({ ...icuBase, trauma: true, icuDay: 3 }), 'glutamine').dose.tr, /^14–21 g\/gün/);
});

test('H. gut unusable: PN from day 3 unless severely malnourished; daily IV micronutrients', () => {
  const early = recommend({ ...icuBase, gi: 'contraindicated', icuDay: 1 });
  assert.equal(early.route.kind, 'pn-later');
  assert.equal(early.plan.rows[0].icuDay, 3);
  assert.equal(early.plan.today, null);
  const r = recommend({ ...icuBase, gi: 'contraindicated', icuDay: 4, feeding: 'none' });
  assert.equal(r.route.kind, 'pn');
  near(r.plan.today.glucoseMaxG, 504, 0.01);
  near(r.plan.today.lipidMaxG, 105, 0.01);
  assert.match(supp(r, 'mvte').dose.tr, /IV multivitamin/);
  assert.equal(recommend({ ...icuBase, gi: 'contraindicated', icuDay: 1, weightLossPct: 12 }).route.kind, 'pn-later', 'moderate weight loss is not severe');
  assert.equal(recommend({ ...icuBase, gi: 'contraindicated', icuDay: 1, weightLossPct: 16 }).route.kind, 'pn', 'early progressive PN in severe malnutrition (R7)');
});

test('H2. uncontrolled shock outranks an unusable gut: no feeding now, and the restart plan is parenteral', () => {
  const r = recommend({ ...icuBase, gi: 'contraindicated', ischemia: true, shock: 'uncontrolled' });
  assert.equal(r.route.kind, 'delay');
  assert.equal(r.route.reason, 'shock');
  assert.equal(r.route.access, 'iv');
  assert.equal(r.plan.pnAfterShock, true);
  assert.equal(r.plan.today, null);
  assert.equal(r.plan.restart, undefined, 'no enteral restart into an unusable gut');
  assert.equal(r.plan.rows[0].icuDay, 3);
  assert.ok('pnKcal' in r.plan.rows[0]);
  assert.equal(r.product.cls, 'pn');
});

test('H4. delayed feeding has no feed today; the table is the progression after the restart', () => {
  const r = recommend({ ...icuBase, shock: 'uncontrolled' });
  assert.equal(r.plan.today, null);
  assert.ok(r.plan.restart.rate > 0);
  assert.equal(supp(r, 'mvte'), undefined);
});

test('H5. ward: uncontrolled shock delays feeding; a burn >20% gets zinc but no glutamine', () => {
  const shock = recommend({ ...wardBase, swallow: 'unsafe', shock: 'uncontrolled' });
  assert.equal(shock.route.kind, 'delay');
  const burn = recommend({ ...wardBase, swallow: 'safe', oralIntakePct: 60, burnsTbsa: 25 });
  assert.ok(supp(burn, 'zinc'));
  assert.equal(supp(burn, 'glutamine'), undefined);
});

test('H3. ward PN starts at 50% for 2 days', () => {
  const r = recommend({ ...wardBase, sex: 'male', heightCm: 175, weightKg: 70, swallow: 'unsafe', gi: 'contraindicated' });
  assert.equal(r.route.kind, 'pn');
  assert.deepEqual(r.plan.rows.map((x) => Math.round(x.kcal)), [945, 945, 1890]);
});

test('I. uncontrolled shock delays EN; the low-dose restart scales protein with energy', () => {
  const r = recommend({ ...icuBase, shock: 'uncontrolled' });
  assert.equal(r.route.kind, 'delay');
  near(r.plan.restart.kcalTarget, 350, 0.01);
  near(r.plan.restart.proteinTarget, 28, 0.01);
  assert.equal(r.plan.restart.moduleProtein, 0);
  const c = recommend({ ...icuBase, shock: 'controlled' });
  near(c.plan.today.kcalTarget, 350, 0.01, 'controlled shock: low-dose EN');
  const unknown = recommend({ ...icuBase, shock: null });
  near(unknown.plan.today.kcalTarget, 350, 0.01, 'unknown shock: low dose as a precaution');
});

test('I2. high gastric residual: weight-based erythromycin; a GI bleed outranks it and gets no prokinetic advice', () => {
  const r = recommend({ ...icuBase, highGrv: true });
  assert.equal(r.route.reason, 'grv');
  assert.ok(r.notes.some((n) => /210–490 mg\/gün/.test(n.text.tr)));
  const bleed = recommend({ ...icuBase, highGrv: true, giBleed: true });
  assert.equal(bleed.route.reason, 'giBleed');
  assert.ok(!bleed.notes.some((n) => /eritromisin/.test(n.text.tr)));
});

test('J. blocked: under 18, pregnancy, invalid values', () => {
  assert.ok(recommend({ ...icuBase, age: 15 }).blocked);
  assert.ok(recommend({ ...icuBase, sex: 'female', pregnant: true }).blocked);
  const bad = recommend({ ...icuBase, weightKg: 10 });
  assert.ok(bad.blocked);
  assert.deepEqual(bad.invalid, ['weightKg']);
});

test('K. no weight or height: no amounts, weight reported as critical', () => {
  const r = recommend({ setting: 'icu' });
  assert.equal(r.plan, null);
  assert.equal(r.missing[0].impact, 'critical');
  assert.equal(r.missing[0].field, 'weightKg');
});

test('K2. height but no weight: the weight at BMI 18.5 is used and flagged', () => {
  const r = recommend({ ...icuBase, weightKg: null });
  assert.equal(r.metrics.energyWeightKind, 'bmi18-no-weight');
  near(r.fullEnergy.kcal, 25 * 18.5 * 1.75 ** 2, 0.01);
  assert.equal(missing(r, 'weightKg').impact, 'critical');
});

test('K3. weight above 100 kg without height: capped at 100 kg and flagged critical', () => {
  const r = recommend({ ...icuBase, heightCm: null, weightKg: 200 });
  assert.equal(r.metrics.energyWeightKind, 'capped-no-height');
  near(r.fullEnergy.kcal, 2500, 0.01);
  assert.equal(missing(r, 'heightCm').impact, 'critical');
  const kidney = recommend({ ...icuBase, heightCm: null, weightKg: 150, usualWeightKg: 140, kidney: 'crrt' });
  assert.equal(kidney.metrics.proteinWeight, 100, 'usual weight is capped too without height');
});

test('L. catabolic (negative nitrogen balance) after day 4: protein replaces losses, capped at 1.5 g/kg', () => {
  const nb = nitrogenBalance(normalize({ uun: 18, uunProtein: 80, kidney: 'normal' }).p);
  near(nb.nb, -9.2, 0.001);
  assert.equal(nb.status, 'catabolic');
  near(nb.replacementProtein, 137.5, 0.001);
  const r = recommend({ ...icuLow, icuDay: 6, feeding: 'ongoing', uun: 18, uunProtein: 80 });
  near(r.plan.today.proteinTarget, 105, 0.01);
  assert.ok(r.plan.today.proteinWhy.includes('catabolic'));
  const early = recommend({ ...icuLow, icuDay: 2, feeding: 'ongoing', uun: 18, uunProtein: 80 });
  near(early.plan.today.proteinTarget, (0.5 / 0.65) * 91, 0.01, 'no escalation before day 5');
  const balanced = recommend({ ...icuLow, icuDay: 6, feeding: 'ongoing', uun: 8, uunProtein: 90 });
  assert.equal(balanced.nitrogen.status, 'balanced');
  near(balanced.plan.today.proteinTarget, 91, 0.01);
  const kidneyUnknown = recommend({ ...icuLow, kidney: null, icuDay: 6, feeding: 'ongoing', uun: 18, uunProtein: 80 });
  near(kidneyUnknown.plan.today.proteinTarget, 70, 0.01, 'no escalation and 1.0 g/kg while kidney status is unknown');
});

test('L1. major trauma with a large measured loss: protein up to 2.0 g/kg', () => {
  const r = recommend({ ...icuLow, trauma: true, icuDay: 6, feeding: 'ongoing', uun: 25, uunProtein: 80 });
  near(r.plan.today.proteinTarget, 140, 0.01);
});

test('L2. nitrogen balance is not interpreted in kidney failure', () => {
  const r = recommend({ ...icuBase, kidney: 'aki', uun: 18, uunProtein: 80 });
  assert.equal(r.nitrogen.reason, 'kidney');
});

test('M. Wernicke suspicion overrides other thiamine doses', () => {
  const r = recommend({ ...icuBase, wernicke: true, alcohol: true });
  assert.match(supp(r, 'thiamine').dose.tr, /^500 mg × 3\/gün IV/);
});

test('N. propofol calories are subtracted from the formula', () => {
  const r = recommend({ ...icuLow, icuDay: 8, feeding: 'ongoing', propofolMlH: 10 });
  near(r.nonNutritional.propofolKcal, 264, 0.01);
  near(r.plan.today.kcalTarget, 1750, 0.01);
  assert.equal(r.plan.today.rate, Math.round((1750 - 264) / 1.25 / 24));
});

test('O. vitamin D below 20 ng/mL: no ICU dose (R36), ward 4000–5000 IU/day for 2 months', () => {
  const icu = recommend({ ...icuBase, vitD: 9 });
  assert.match(supp(icu, 'vitd').dose.tr, /Yoğun bakımda ek doz önerilmez/);
  assert.match(supp(icu, 'vitd').why[0].tr, /ağır eksiklik/);
  const ward = recommend({ ...wardBase, swallow: 'safe', oralIntakePct: 80, vitD: 9 });
  assert.match(supp(ward, 'vitd').dose.tr, /4000–5000 IU\/gün/);
  assert.equal(supp(recommend({ ...icuBase, vitD: 25 }), 'vitd'), undefined);
});

test('P. dysphagia: texture ONS reaches 30 g protein with 3 servings; low intake switches to tube with stroke note', () => {
  const base = { setting: 'ward', age: 68, sex: 'male', heightCm: 172, weightKg: 68, swallow: 'modified', gi: 'ok', kidney: 'normal', stroke: true };
  const r = recommend({ ...base, oralIntakePct: 60 });
  assert.equal(r.plan.oral.cls, 'ons-texture');
  assert.equal(r.plan.oral.servings, 3);
  assert.ok(r.notes.some((n) => /IDDSI/.test(n.text.tr)));
  const low = recommend({ ...base, oralIntakePct: 40 });
  assert.equal(low.route.kind, 'en', '40% + 3 texture ONS stays below 75%: tube feeding for the rest');
  assert.ok(low.notes.some((n) => /72 saatte/.test(n.text.tr)), 'stroke note with tube feeding');
});

test('Q. unknown swallowing is not assumed safe', () => {
  const r = recommend({ ...icuBase, swallow: null });
  assert.equal(r.route.kind, 'en');
  assert.ok(missing(r, 'swallow'));
});

test('R. entered label values replace the defaults', () => {
  const r = recommend({ ...icuLow, icuDay: 8, feeding: 'ongoing', product: { en: { kcalPerMl: 1.5, proteinPer100: 7.5 } } });
  assert.equal(r.plan.today.cls, 'en-label');
  assert.equal(r.plan.today.rate, Math.round(1750 / 1.5 / 24));
});

test('R2. powder: protein and grams come from the powder label and its dilution', () => {
  const r = recommend({ ...icuLow, icuDay: 8, feeding: 'ongoing', product: { form: 'powder' } });
  const t = r.plan.today;
  assert.equal(t.cls, 'en-powder');
  assert.equal(t.rate, 73);
  near(t.formulaProtein, 1752 * (1 / 4.5) * 17 / 100, 0.01);
  assert.equal(t.moduleProtein, 25);
  assert.equal(t.powderGrams, 389);
});

test('S. every cited source id exists in the source list', () => {
  const cases = [icuBase, { ...icuBase, kidney: 'crrt', burnsTbsa: 40, vitD: 8, wernicke: true }, { setting: 'ward', age: 80, sex: 'female', heightCm: 150, weightKg: 40, swallow: 'safe', oralIntakePct: 20, pressureUlcer: true, bowel: 'constipation', diabetes: true, crp: 150 }];
  for (const c of cases) for (const id of recommend(c).sources) assert.ok(SOURCES[id], `unknown source ${id}`);
});

test('T. body metrics: unknown sex uses the female formula; ward adjusts only from BMI 30', () => {
  const { p } = normalize({ setting: 'ward', heightCm: 170, weightKg: 80 });
  const m = bodyMetrics(p);
  near(m.ibw, 61.52, 0.01);
  assert.equal(m.energyWeightKind, 'actual', 'BMI 27.7 on the ward: actual weight');
  assert.equal(refeedingRisk(p, m).level, 'unknown');
});

test('U. kidney status unknown: ICU protein 1.0 g/kg; ward 1.0 g/kg; no ward fluid plan', () => {
  near(recommend({ ...icuLow, kidney: null, icuDay: 6, feeding: 'ongoing' }).plan.today.proteinTarget, 70, 0.01);
  const ward = recommend({ ...wardBase, kidney: null, swallow: 'unsafe' });
  near(ward.plan.today.proteinTarget, 55, 0.01);
  assert.equal(ward.plan.fluid, null);
});

test('V. ward AKI: low-protein formula plus module instead of overfeeding protein', () => {
  const r = recommend({ ...wardBase, sex: 'male', heightCm: 175, weightKg: 70, swallow: 'unsafe', kidney: 'aki' });
  const t = r.plan.today;
  near(t.proteinTarget, 56, 0.01);
  assert.equal(t.cls, 'en-low-protein');
  assert.equal(t.rate, 39);
  assert.equal(t.moduleProtein, 28);
  assert.equal(r.warnings.length, 0);
});

test('W. pressure ulcer mixture only with known normal kidneys', () => {
  const ok = recommend({ ...wardBase, swallow: 'safe', oralIntakePct: 60, pressureUlcer: true });
  assert.match(supp(ok, 'ulcer-mix').dose.tr, /^Arjinin 14 g/);
  const aki = recommend({ ...wardBase, swallow: 'safe', oralIntakePct: 60, pressureUlcer: true, kidney: 'aki' });
  assert.match(supp(aki, 'ulcer-mix').dose.tr, /verilmez/);
});

test('X. very high aspiration risk: post-pyloric access; dysphagia with that risk is not fed orally', () => {
  const r = recommend({ ...icuBase, aspirationRisk: true });
  assert.equal(r.route.access, 'postpyloric');
  assert.ok(r.notes.some((n) => /postpilorik/.test(n.text.tr)));
  const dys = recommend({ ...wardBase, swallow: 'modified', oralIntakePct: 60, aspirationRisk: true });
  assert.equal(dys.route.kind, 'en');
});

test('Y. refeeding hypophosphataemia during feeding: energy held at the start level for 48 h', () => {
  const r = recommend({ ...icuLow, icuDay: 6, feeding: 'ongoing', hypoPhosphate: true });
  const kcal = r.plan.rows.map((x) => Math.round(x.kcalTarget));
  // Days 6–7 at 10 kcal/kg; day 8 (cap now 100%) one step up: 0.40 + 0.60 × 1/4 = 0.55 × 1750.
  assert.deepEqual(kcal.slice(0, 3), [700, 700, 963]);
  const ward = recommend({ ...wardBase, swallow: 'unsafe', hypoPhosphate: true });
  assert.equal(ward.plan.rows.length, 6);
  near(ward.plan.rows[5].kcalTarget, 1485, 0.01, 'the ward table reaches the full target');
});

test('Z. a long tube course plans a PEG but keeps nasogastric access now', () => {
  const r = recommend({ ...icuBase, longTube: true, stroke: true });
  assert.equal(r.route.access, 'ng');
  assert.equal(r.route.pegPlanned, true);
  assert.ok(r.notes.some((n) => /PEG planlanır/.test(n.text.tr)));
});

test('Z2. ward CRP >100 mg/L adds the EFFORT inflammation note', () => {
  const r = recommend({ ...wardBase, swallow: 'safe', oralIntakePct: 60, crp: 150 });
  assert.ok(r.notes.some((n) => /CRP 150 mg\/L/.test(n.text.tr)));
});
