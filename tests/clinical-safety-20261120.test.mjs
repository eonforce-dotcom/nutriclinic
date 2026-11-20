import test from 'node:test';
import assert from 'node:assert/strict';
import {recommend} from '../web/engine.mjs';
import {resolveFormulaWorkspace,formulaWorkspaceHtml} from '../web/formula-workspace.mjs';
import {feedingReviewHtml} from '../web/feeding-review-ui.mjs';
import {anonymize} from '../web/vault.mjs';
const ward={setting:'ward',age:67,sex:'male',heightCm:175,weightKg:65,swallow:'unsafe',gi:'ok',shock:'none',kidney:'normal',feeding:'none',weightLossPct:0,lowIntakeDays:0,lowElectrolytes:'no',alcohol:'no',riskDrugs:'no',fluidRestriction:'no'};
const icu={...ward,setting:'icu',weightKg:70,icuDay:8,feeding:'ongoing',feedingDays:8};
test('PN cannot claim 0kcal and simultaneously prescribe91g amino acids',()=>{
  const r=recommend({...icu,gi:'contraindicated',propofolMlH:70});
  assert.equal(r.plan.today.pnKcal,0);
  assert.equal(r.plan.today.aminoAcids,0);
  assert.equal(r.plan.today.aminoAcidsTarget,91);
  assert.ok(r.plan.today.proteinLimitedByEnergy);
  for(const row of r.plan.rows) assert.ok(row.aminoAcidsKcal+row.nonProteinKcal<=row.pnKcal+1e-9);
});
test('UUN result is approximate and does not itself change protein target',()=>{
  const control=recommend(icu),r=recommend({...icu,uun:18,uunProtein:80});
  assert.equal(r.nitrogen.status,'estimate');
  assert.equal(r.nitrogen.nb,-9.2);
  assert.equal(r.nitrogen.raisesProteinTarget,false);
  assert.equal(r.plan.today.proteinTarget,control.plan.today.proteinTarget);
});
test('refeeding risk alone is not a severe-malnutrition diagnosis for early PN',()=>{
  const r=recommend({...icu,icuDay:1,feeding:'none',lowIntakeDays:11,gi:'contraindicated'});
  assert.equal(r.refeeding.level,'high');
  assert.equal(r.route.kind,'pn-later');
  assert.equal(recommend({...r.input,severeMalnutritionConfirmed:'yes'}).route.kind,'pn');
});
test('fluid arithmetic subtracts every explicitly assessed other source once, and does not assume an unknown amount is zero',()=>{
  const missing=recommend(ward).plan.fluid;
  assert.equal(missing.extraMin,null);
  const fluid=recommend({...ward,otherFluidsMlDay:500}).plan.fluid;
  assert.ok(fluid.reconciled);
  assert.equal(fluid.extraMin,Math.max(0,1950-fluid.formulaWater-500));
  assert.equal(recommend({...ward,otherFluidsMlDay:0,fluidRestriction:null}).plan.fluid.extraMin,null);
  const unknown=recommend({...ward,otherFluidsMlDay:0,product:{en:{kcalPerMl:1.25,proteinPer100:9.4,waterUnknown:1}}}).plan.fluid;
  assert.equal(unknown.formulaWater,null);assert.equal(unknown.extraMin,null);
});
test('incompatible labels are errors; normal rounded phase rates do not exceed their energy ceiling',()=>{
  const bad=recommend({...ward,product:{en:{kcalPerMl:0.1,proteinPer100:20}}});
  assert.ok(bad.blocked); assert.ok(bad.invalid.includes('product.en.energyProteinConsistency'));
  const r=recommend({...icu,icuDay:3,feedingDays:3});
  assert.equal(r.plan.today.rate,37);
  assert.ok(r.plan.today.formulaKcal<=r.plan.today.kcalTarget);
});
test('a very low known phosphate pauses starting; unknown critical information instead retains a conditional number',()=>{
  const low=recommend({...ward,phosphate:0.1,phosphateUnit:'mmol/L'});
  assert.equal(low.route.reason,'electrolytes');assert.equal(low.plan.today,null);
  const unknown=recommend({...ward,age:null,gi:null,shock:null});
  assert.ok(unknown.plan.today.volume>0);
  assert.ok(unknown.missing.some(x=>x.field==='age'));
});
test('ICU stay is not used as an unentered feeding duration',()=>{
  const r=recommend({...icu,feedingDays:null});
  assert.equal(r.plan.today.feedDay,1);
  assert.ok(r.warnings.some(w=>w.en.includes('Actual feeding duration')));
});
test('renal impairment no longer receives an unqualified repeated prokinetic dose',()=>{
  const r=recommend({...icu,kidney:'aki',highGrv:true});
  const notes=r.notes.map(n=>n.text.en).join(' ');
  assert.match(notes,/renal/i);assert.match(notes,/metoclopramide/);
  assert.doesNotMatch(notes,/10 mg three times/);
});
test('automatic exact-market recipe, pump arithmetic and initiation table agree',()=>{
  const base=recommend(ward),m=resolveFormulaWorkspace(base);
  assert.ok(m.recipe.automationAllowed);
  assert.ok(m.recipe.totals.energyKcal<=m.targets.energyKcal+1e-7);
  assert.ok(m.recipe.totals.proteinG<=m.targets.proteinG+1e-7);
  const result=recommend({...ward,product:{en:{...m.composition,limitFirstDay:1}}});
  assert.ok(Math.abs(result.plan.today.volume-m.recipe.totals.formulaVolumeMl)<0.01);
  assert.ok(Math.abs(result.plan.today.formulaProtein-m.recipe.totals.formulaProteinG)<0.01);
  assert.ok(result.plan.initiation.first24Hours.volume<result.plan.today.volume);
  for(const lang of ['en','tr']) {
    const html=formulaWorkspaceHtml(m,lang)+feedingReviewHtml(result,lang);
    assert.doesNotMatch(html,/NaN|undefined|hemodynamic-perfusion-stability/);
    assert.match(html,/mL/);
  }
});
test('an overfeeding manual alternative remains visible and never becomes the automatic applied composition',()=>{
  const base=recommend(ward);
  const m=resolveFormulaWorkspace(base,{firstId:1001,mode:2,firstMl:5000});
  assert.ok(m.recipe.totals.formulaEnergyKcal>m.targets.energyKcal);
  assert.equal(m.recipe.automationAllowed,false);assert.equal(m.composition,null);
  assert.match(formulaWorkspaceHtml(m,'en'),/not an automatic recommendation/);
});
test('anonymous copies retain only bounded numeric catalog settings, not arbitrary catalog text',()=>{
  const d=anonymize({product:{catalog:{firstId:1001,firstMl:500,mode:2,name:'PRIVATE',source:'PRIVATE'}}},'1.11.0',new Map());
  assert.deepEqual(d.product.catalog,{firstId:1001,firstMl:500,mode:2});
});
test('known total-fluid budget constrains every future day, even with a first-day recipe',()=>{
  const input={...icu,fluidRestriction:'yes',fluidLimitMlDay:1000,otherFluidsMlDay:700,product:{en:{kcalPerMl:2,proteinPer100:9,dailyVolumeLimit:250,limitFirstDay:1}}};
  const r=recommend(input);
  assert.ok(r.plan.rows.every(row=>row.volume<=300));
  const model=resolveFormulaWorkspace(recommend({...input,product:{}}));
  assert.equal(model.targets.maxFormulaMl,300);
  assert.ok(model.recipe.totals.formulaVolumeMl<=300);
});
test('catalog liquids never override a texture restriction, and malformed manual amounts are not applied',()=>{
  const textured=recommend({...ward,swallow:'modified',iddsiFood:4,iddsiFluid:2,oralIntakePct:50});
  const tm=resolveFormulaWorkspace(textured,{firstId:1001,mode:1});
  assert.equal(tm.textureRestricted,true);assert.equal(tm.recipe,null);
  const invalid=resolveFormulaWorkspace(recommend(ward),{firstId:1001,firstMl:-50,mode:2});
  assert.equal(invalid.invalidConfig,true);assert.equal(invalid.composition,null);
});
