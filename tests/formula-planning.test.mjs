// SPDX-License-Identifier: AGPL-3.0-only
import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluateFormulaRecipe, suggestFormulaPlans} from '../web/formula-planning.mjs';

const a = {id:'MANUFACTURER-A-SKU-1-TR', name:'Synthetic A', kcalPerMl:1, proteinPer100:4, waterPer100:84, route:'both', tube:true, complete:true, provenance:{url:'https://example.org/synthetic-a', market:'TR'}};
const b = {id:'MANUFACTURER-B-SKU-2-TR', name:'Synthetic B', kcalPerMl:1.5, proteinPer100:10, waterPer100:76, route:'enteral', tube:true, complete:true, provenance:{url:'https://example.org/synthetic-b', market:'TR'}};
const targets = {energyKcal:1000, proteinG:50, otherEnergyKcal:0, otherProteinG:0, maxProteinG:50, maxFormulaMl:1000};
const safety = {clinicianEligibilityConfirmed:true, route:'tube', refeedingRisk:false, shock:false, intolerance:false, contraindication:false};
const recipe = overrides => evaluateFormulaRecipe({rows:[{product:a,volumeMl:620},{product:b,volumeMl:250}], targets, safety, ...overrides});
const suggestions = overrides => suggestFormulaPlans({products:[a,b], targets, safety, ...overrides});
const near = (x,y) => assert.ok(Math.abs(x-y)<1e-8, `${x} != ${y}`);

test('two known products have hand-calculated exact energy/protein/volume/water totals', () => {
  const r=recipe();
  assert.equal(r.arithmeticValid,true); assert.equal(r.automationAllowed,true);
  assert.deepEqual(r.totals,{formulaVolumeMl:870,formulaEnergyKcal:995,formulaProteinG:49.8,formulaWaterMl:710.8,energyKcal:995,proteinG:49.8});
  assert.equal(r.gaps.energyKcal,5); near(r.gaps.proteinG,0.2);
  assert.deepEqual(r.rows[0].provenance,a.provenance);
});

test('the2x2 pair solution is625mL+250mL, then each quantity rounds down to10mL', () => {
  const r=suggestions();
  assert.equal(r.automationAllowed,true); assert.equal(r.selectedDefault.type,'pair');
  near(r.selectedDefault.exactSolution.volumeMl[0],625);
  near(r.selectedDefault.exactSolution.volumeMl[1],250);
  assert.deepEqual(r.selectedDefault.rows.map(x=>x.volumeMl),[620,250]);
  assert.equal(r.selectedDefault.totals.energyKcal,995);
  near(r.selectedDefault.totals.proteinG,49.8);
  assert.equal(r.selectedDefault.totals.formulaVolumeMl,870);
  assert.ok(r.selectedDefault.score<r.candidates.find(c=>c.type==='single').score);
});

test('other-source energy and protein are subtracted once and counted once in totals', () => {
  const r=suggestions({targets:{...targets,otherEnergyKcal:200,otherProteinG:10}});
  assert.deepEqual(r.selectedDefault.rows.map(x=>x.volumeMl),[500,200]);
  assert.equal(r.selectedDefault.totals.formulaEnergyKcal,800);
  assert.equal(r.selectedDefault.totals.formulaProteinG,40);
  assert.equal(r.selectedDefault.totals.energyKcal,1000);
  assert.equal(r.selectedDefault.totals.proteinG,50);
});

test('single candidates respect the protein ceiling instead of raising the current phase target', () => {
  const r=suggestions({products:[b]});
  assert.equal(r.selectedDefault.type,'single');
  assert.equal(r.selectedDefault.rows[0].volumeMl,500);
  assert.equal(r.selectedDefault.totals.energyKcal,750);
  assert.equal(r.selectedDefault.totals.proteinG,50);
  assert.equal(r.selectedDefault.gaps.energyKcal,250);
  assert.equal(r.criteria.targets.maxProteinG,50);
});

test('explicit formula-fluid budget rejects the pair; a fitting single remains eligible', () => {
  const r=suggestions({targets:{...targets,maxFormulaMl:800}});
  assert.ok(r.candidates.length);
  assert.ok(r.candidates.every(c=>c.totals.formulaVolumeMl<=800));
  assert.ok(r.candidates.every(c=>c.type==='single'));
  assert.equal(r.selectedDefault.rows[0].productId,b.id);
});

test('an omitted or explicit null formula-volume limit does not invent a clinical budget', () => {
  for(const maxFormulaMl of [null,undefined]) {
    const r=suggestions({targets:{...targets,maxFormulaMl}});
    assert.equal(r.criteria.targets.maxFormulaMl,null);
    assert.equal(r.selectedDefault.totals.formulaVolumeMl,870);
  }
});

test('unknown water propagates; a zero-volume unknown-water row contributes zero only', () => {
  const r=recipe({rows:[{product:a,volumeMl:620},{product:{...b,waterPer100:null},volumeMl:250}]});
  assert.equal(r.totals.formulaWaterMl,null);
  assert.equal(r.totals.formulaEnergyKcal,995);
  assert.equal(r.warnings[0].code,'formula-water-unknown');
  assert.equal(recipe({rows:[{product:a,volumeMl:620},{product:{...b,waterPer100:null},volumeMl:0}]}).totals.formulaWaterMl,520.8);
});

test('known clinical restrictions block automation while preserving manual arithmetic', () => {
  for(const override of [{clinicianEligibilityConfirmed:false},{refeedingRisk:true},{shock:true},{intolerance:true},{contraindication:true},{route:undefined}]) {
    const context={...safety,...override};
    const r=recipe({safety:context});
    assert.equal(r.arithmeticValid,true);
    assert.equal(r.totals.formulaEnergyKcal,995);
    assert.equal(r.automationAllowed,false);
    const s=suggestions({safety:context});
    assert.equal(s.automationAllowed,false); assert.deepEqual(s.candidates,[]); assert.equal(s.selectedDefault,null);
  }
});

test('unknown safety facts retain conditional numeric comparisons and visible assumptions', () => {
  for(const override of [{clinicianEligibilityConfirmed:undefined},{refeedingRisk:null},{shock:null},{intolerance:undefined},{contraindication:null}]) {
    const context={...safety,...override};
    const r=suggestions({safety:context});
    assert.equal(r.automationAllowed,true); assert.equal(r.conditional,true);
    assert.equal(r.criteria.safetyKnownEligible,false);
    assert.ok(r.warnings.length); assert.ok(r.selectedDefault.rows.length);
    assert.ok(r.selectedDefault.warnings.length); assert.equal(r.selectedDefault.conditional,true);
    assert.equal(recipe({safety:context}).totals.formulaEnergyKcal,995);
  }
  const r=suggestions({safety:{...safety,assumptions:['Assumed gut usable; verify before administration.']}});
  assert.equal(r.selectedDefault.warnings.find(w=>w.code==='parent-conditional-assumption').detail,'Assumed gut usable; verify before administration.');
  assert.equal(r.conditional,true);
  const invalid=suggestions({safety:{...safety,shock:'no'}});
  assert.equal(invalid.automationAllowed,false);
  assert.ok(invalid.errors.some(e=>e.code==='invalid-safety-value'));
});

test('known refeeding risk allows composition comparison only with an explicit managed-phase cap flag', () => {
  assert.equal(suggestions({safety:{...safety,refeedingRisk:true}}).automationAllowed,false);
  const r=suggestions({safety:{...safety,refeedingRisk:true,allowManagedRefeeding:true,
    assumptions:['Known refeeding risk-specific phase energy/protein caps used.']}});
  assert.equal(r.automationAllowed,true); assert.equal(r.conditional,true);
  assert.ok(r.selectedDefault.warnings.some(w=>w.code==='managed-refeeding-phase-targets'));
  assert.ok(r.candidates.every(c=>c.totals.energyKcal<=targets.energyKcal+1e-8&&c.totals.proteinG<=targets.maxProteinG+1e-8));
  assert.equal(suggestions({safety:{...safety,refeedingRisk:true,allowManagedRefeeding:true,contraindication:true}}).automationAllowed,false);
});

test('tube-incompatible, oral-only and incomplete products cannot become automatic candidates', () => {
  for(const product of [{...a,tube:false},{...a,route:'oral'},{...a,complete:false}]) {
    const r=suggestions({products:[product,b]});
    assert.ok(r.candidates.every(c=>c.rows.every(row=>row.productId!==a.id)));
    assert.ok(r.excluded.some(p=>p.productId===a.id));
  }
  const oral=suggestions({safety:{...safety,route:'oral'}});
  assert.ok(oral.candidates.every(c=>c.rows.every(row=>row.productId!==b.id)));
});

test('empty, coerced, negative, infinite and oversized quantities fail closed', () => {
  for(const volumeMl of ['',null,undefined,'10',NaN,Infinity,-1,10000.1]) {
    const r=recipe({rows:[{product:a,volumeMl}]});
    assert.equal(r.arithmeticValid,false,String(volumeMl)); assert.equal(r.totals,null);
  }
  assert.equal(recipe({rows:[]}).arithmeticValid,false);
  assert.equal(recipe({rows:Array(1)}).arithmeticValid,false);
  for(const field of ['energyKcal','proteinG','otherEnergyKcal','otherProteinG','maxProteinG']) {
    assert.equal(suggestions({targets:{...targets,[field]:'0'}}).automationAllowed,false,field);
  }
  for(const product of [{...a,id:''},{...a,kcalPerMl:0},{...a,kcalPerMl:Infinity},{...a,proteinPer100:'4'},{...a,waterPer100:101}]) assert.equal(recipe({rows:[{product,volumeMl:100}]}).arithmeticValid,false);
});

test('duplicate exact-SKU rows or catalog identities cannot double-count a product', () => {
  const r=recipe({rows:[{product:a,volumeMl:100},{product:{...a},volumeMl:100}]});
  assert.equal(r.arithmeticValid,false); assert.equal(r.totals,null);
  const s=suggestions({products:[a,{...a},b]});
  assert.equal(s.automationAllowed,false); assert.deepEqual(s.candidates,[]);
});

test('negative or singular pair solutions are excluded without hiding feasible singles', () => {
  const singular=suggestions({products:[a,{...a,id:'B',kcalPerMl:2,proteinPer100:8}]});
  assert.ok(singular.excluded.some(p=>p.reasons.some(r=>r.code==='singular-pair')));
  assert.ok(singular.candidates.every(c=>c.type==='single'));
  const negative=suggestions({targets:{...targets,proteinG:90,maxProteinG:90}});
  assert.ok(negative.excluded.some(p=>p.reasons.some(r=>r.code==='negative-or-nonfinite-pair-solution')));
  assert.ok(negative.candidates.every(c=>c.type==='single'));
});

test('all proposed plans satisfy explicit ceilings after rounding and preserve inputs', () => {
  const input={products:[b,a],targets:{...targets},safety:{...safety},maxResults:10};
  const before=structuredClone(input);
  const r=suggestFormulaPlans(input);
  assert.deepEqual(input,before);
  assert.deepEqual(r.selectedDefault,suggestions().selectedDefault,'selection is independent of catalog order');
  for(const c of r.candidates) {
    assert.ok(c.totals.energyKcal<=targets.energyKcal+1e-8);
    assert.ok(c.totals.proteinG<=targets.maxProteinG+1e-8);
    assert.ok(c.totals.formulaVolumeMl<=targets.maxFormulaMl+1e-8);
    assert.ok(c.rows.every(x=>x.volumeMl%10===0));
  }
});

test('existing external overfeeding and exhausted formula budget never produce add-on feeding', () => {
  for(const changed of [{otherEnergyKcal:1001},{otherProteinG:51}]) {
    const r=suggestions({targets:{...targets,...changed}});
    assert.equal(r.automationAllowed,false); assert.deepEqual(r.candidates,[]);
  }
  const r=suggestions({targets:{...targets,otherEnergyKcal:1000}});
  assert.deepEqual(r.candidates,[]); assert.equal(r.selectedDefault,null);
  assert.equal(r.noCandidateReason,'no-formula-energy-budget');
});

test('manual mixtures report separately which target or volume constraint was exceeded', () => {
  for(const [overrides,code] of [
    [{targets:{...targets,maxFormulaMl:800}},'formula-volume-ceiling-exceeded'],
    [{targets:{...targets,energyKcal:990}},'phase-energy-ceiling-exceeded'],
    [{rows:[{product:b,volumeMl:510}]},'protein-ceiling-exceeded'],
  ]) {
    const r=recipe(overrides);
    assert.equal(r.arithmeticValid,true); assert.equal(r.withinConstraints,false);
    assert.ok(r.constraintErrors.some(e=>e.code===code)); assert.equal(r.automationAllowed,false);
  }
});

test('a numeric exact SKU is preserved as identity and missing water is not assumed zero', () => {
  const r=recipe({rows:[{product:{...a,id:12345,waterPer100:undefined},volumeMl:500}]});
  assert.equal(r.rows[0].productId,'12345');
  assert.equal(r.totals.formulaWaterMl,null);
  assert.equal(r.totals.formulaEnergyKcal,500);
});
