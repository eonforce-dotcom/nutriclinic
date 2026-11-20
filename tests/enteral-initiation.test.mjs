// Regression cases for Mert's two review findings. Synthetic inputs only.
import test from 'node:test';
import assert from 'node:assert/strict';
import { recommend } from '../web/engine.mjs';

const ward = {
  setting:'ward', age:70, sex:'male', heightCm:170, weightKg:65,
  feeding:'none', swallow:'unsafe', gi:'ok', shock:'none', kidney:'normal',
  weightLossPct:0, lowIntakeDays:0, lowElectrolytes:'no', alcohol:'no', riskDrugs:'no',
};

test('73mL/h is a full phase-target calculation; a new ward feed starts below it in the reviewable local example', () => {
  const r = recommend(ward), target = r.plan.today, draft = r.plan.initiation;
  assert.equal(target.rate, 73);
  assert.equal(target.targetRate, 73);
  assert.equal(target.rateMeaning, 'phase-target-not-start');
  assert.equal(target.volume, 1752, '24h at target is separate from first-day delivery');
  assert.equal(draft.status, 'example');
  assert.equal(draft.steps[0].rate, 18);
  assert.equal(draft.steps[1].rate, 29);
  assert.equal(draft.first24Hours.volume, 564, '12h at18 plus12h at29, not73×24');
  assert.equal(draft.first24Hours.formulaKcal, 564);
  assert.ok(Math.abs(draft.first24Hours.formulaProtein-22.56)<1e-10);
  assert.equal(draft.automaticAdvancement, false);
  assert.equal(draft.requiresClinicianReview, true);
  assert.ok(draft.steps.every(step => step.requiresReview));
  assert.equal(draft.steps.at(-1).fromHour, 60, 'illustrative target attainment falls within48–72h');
  assert.equal(draft.steps.at(-1).rate, 73);
  assert.match(draft.guidance.en, /local example/);
  assert.match(draft.guidance.tr, /yerel protokol örneği/);
  assert.equal(draft.requiresManualConfirmation, false);
  assert.equal(draft.recommendedStartRate, 18);
  assert.equal(draft.criteria.feedingStatus,'none');
});

test('12h table preserves ICU phase caps instead of replacing them with full feeding', () => {
  const r = recommend({...ward, setting:'icu', icuDay:1, weightKg:70});
  assert.equal(r.plan.today.kcalTarget, 700);
  assert.equal(r.plan.rows[2].kcalTarget, 1137.5);
  for (const step of r.plan.initiation.steps) {
    const phase = r.plan.rows[Math.floor(step.fromHour/24)];
    assert.equal(step.phaseTargetRate, phase.rate);
    assert.ok(step.rate <= phase.rate);
    assert.ok(step.formulaKcal <= phase.kcalTarget/2);
  }
  assert.ok(r.plan.initiation.first24Hours.formulaKcal < r.plan.today.formulaKcal);
});

test('high/extreme/unknown refeeding risk suppresses the normal12h example and keeps existing ceilings', () => {
  for (const change of [
    {lowElectrolytes:'yes'},
    {weightKg:38, heightCm:170, lowIntakeDays:18},
    {weightLossPct:null,lowIntakeDays:null,lowElectrolytes:null,alcohol:null,riskDrugs:null},
  ]) {
    const r = recommend({...ward,...change});
    assert.equal(r.plan.initiation.status, 'risk-review');
    assert.deepEqual(r.plan.initiation.steps, []);
    assert.equal(r.plan.initiation.first24Hours, null);
    assert.equal(r.plan.initiation.dailyCeilings[0].kcal, r.plan.today.kcalTarget);
    assert.equal(r.plan.initiation.targetWindowHours, undefined);
    assert.ok(r.plan.today.kcalTarget <= 10*r.metrics.energyWeight);
  }
});

test('more than5days little intake preserves the50% first2day ceiling, not a generic full-rate deadline', () => {
  const r = recommend({...ward,lowIntakeDays:6});
  assert.equal(r.refeeding.level, 'low');
  assert.equal(r.plan.initiation.status,'risk-review');
  assert.equal(r.plan.rows[0].kcalTarget,877.5);
  assert.equal(r.plan.rows[1].kcalTarget,877.5);
  assert.deepEqual(r.plan.initiation.steps,[]);
});

test('ongoing feeds are not restarted; blank feeding keeps the stated cautious new-start proposal without inventing a recorded answer', () => {
  const ongoing = recommend({...ward,feeding:'ongoing'}).plan.initiation;
  assert.equal(ongoing.status,'continue');
  assert.deepEqual(ongoing.steps,[]);
  const unknown = recommend({...ward,feeding:null}).plan.initiation;
  assert.equal(unknown.status,'example');
  assert.equal(unknown.feedingStatusAssumed,true);
  assert.equal(unknown.criteria.feedingStatus,null);
  assert.equal(unknown.assumptions[0].used,'new-start-proposal');
  assert.equal(unknown.steps[0].rate,18);
  assert.equal(unknown.requiresManualConfirmation,false);
});

test('shock, an EN delaying condition, or unconfirmed stability never generates the normal numeric start table', () => {
  for (const change of [{shock:'uncontrolled'},{shock:'controlled'},{shock:null},{highGrv:'yes'},{giBleed:'yes'}]) {
    const r = recommend({...ward,...change});
    assert.ok(['review','hold'].includes(r.plan.initiation.status));
    assert.deepEqual(r.plan.initiation.steps,[]);
    assert.equal(r.plan.initiation.automaticAdvancement,false);
  }
});

test('intermittent EN receives a separate individual starting-order review, not a pump schedule', () => {
  const r = recommend({...ward,feedingMode:'intermittent'});
  assert.equal(r.plan.initiation.reason,'intermittent-needs-individual-order');
  assert.equal(r.plan.today.rate,null);
  assert.deepEqual(r.plan.initiation.steps,[]);
  assert.ok(r.plan.today.feeds.n >=4);
});

test('EN protein gap triggers complete-formula review and no automatic protein powder dose', () => {
  const row = recommend({...ward, product:{module:{proteinPer100g:50}}}).plan.today;
  assert.equal(row.proteinTarget,78);
  assert.equal(row.formulaProtein,70.08);
  assert.equal(row.proteinGap,7.9);
  assert.equal(row.moduleGrams,0);
  assert.equal(row.moduleProtein,0);
  assert.equal(row.proteinReview.strategy,'review-complete-formula-first');
  assert.equal(row.proteinReview.automaticModule,false);
  assert.equal(row.proteinReview.energyCeiling,1755);
  assert.equal(row.proteinReview.keepPhaseAndKidneyTarget,true);
});

test('ONS protein gaps are also reviewed before modular products; missing intake does not become a known zero gap', () => {
  const product={ons:{serving:200,kcal:300,protein:1}};
  const oral = recommend({...ward,swallow:'safe',oralIntakePct:50,product}).plan.oral;
  assert.ok(oral.proteinGap>0);
  assert.equal(oral.moduleProtein,0);
  assert.equal(oral.moduleGrams,0);
  assert.equal(oral.proteinReview.strategy,'review-complete-formula-first');
  const unknown = recommend({...ward,swallow:'safe',oralIntakePct:null,product}).plan.oral;
  assert.equal(unknown.proteinGap,null);
  assert.equal(unknown.proteinReview.strategy,'confirm-intake-first');
});

test('renal protein targets and complete-feed powder arithmetic remain intact without an automatic module', () => {
  const renal = recommend({...ward,weightKg:70,heightCm:175,kidney:'aki'}).plan.today;
  assert.equal(renal.proteinTarget,56);
  assert.equal(renal.moduleProtein,0);
  assert.ok(renal.proteinGap>0);
  const powder = recommend({...ward,product:{form:'powder'}}).plan.today;
  assert.ok(powder.powderGrams>0,'complete powdered formula is distinct from a protein module');
  assert.equal(powder.moduleGrams,0);
});
