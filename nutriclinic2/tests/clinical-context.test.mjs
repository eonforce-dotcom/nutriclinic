import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluateContext,evaluateMarkers,enforceClinicalContext} from '../dist/clinical-context.mjs';
import {evaluateFunction} from '../dist/criteria-function.mjs';
const d={age:64,context:'icu',route:'oral',renal:'none',swallow:'safe',visitDate:'2026-10-24',labDate:'2026-10-23',labsConfirmed:true,creatinine:1,crp:30};
const m={conditions:['none'],contextReviewed:true,markerDate:d.labDate,markerConfirmed:true};
const marker=(id,input=d,measures=m)=>evaluateMarkers(input,measures).find(r=>r.id===id);
const normal={sofaConfirmed:true,sofaDate:'2026-10-24',sofaGcs:15,sofaDelirium:'no',sofaPaO2:100,sofaFiO2:.21,sofaVentilation:'none',sofaMap:70,sofaNe:0,sofaEpi:0,sofaOtherVaso:'no',sofaMechanical:'no',sofaBilirubin:1.2,sofaCreatinine:1.2,sofaRrt:'no',sofaUrine:'normal',sofaPlatelets:151};
const sofa=overrides=>marker('sofa2',d,{...normal,...overrides}).values;
test('history must be reviewed and contradictory none/condition entries do not clear it',()=>{
 assert.equal(evaluateContext(d,m).blockers.length,0);
 for(const measures of [{},{...m,contextReviewed:false},{...m,conditions:['none','ibd']},{...m,conditions:['invalid']}])assert.ok(evaluateContext(d,measures).blockers.length);
});
test('IBD phase is required but does not invent a target; kidney conflict and intestinal failure block generic plan',()=>{
 assert.ok(evaluateContext(d,{...m,conditions:['ibd']}).blockers.length);
 assert.equal(evaluateContext(d,{...m,conditions:['ibd'],ibdType:'uc',ibdPhase:'remission'}).blockers.length,0);
 for(const extra of [{conditions:['kidney']},{conditions:['shortBowel']},{highOutputStoma:true},{bowelObstruction:true}])assert.ok(evaluateContext(d,{...m,...extra}).blockers.length);
});
test('EAT-10 zero cannot override impaired alertness or observed unsafe signs',()=>{
 for(const unsafe of [{impairedAlertness:true},{dysphagiaUnsafeSigns:true}]){
  const fn=evaluateFunction(d,{eat10Total:0,...unsafe});
  assert.ok(evaluateContext(d,m,fn).blockers.some(v=>v.en.includes('Swallowing')));
 }
});
test('FOIS nothing-by-mouth conflicts with oral route; tube route is not blocked by an oral-route warning',()=>{
 const fn=evaluateFunction(d,{fois:1,dysphagiaConfirmed:true,dysphagiaSource:'synthetic FEES',dysphagiaDate:'2026-10-24'});
 assert.ok(evaluateContext(d,m,fn).blockers.some(v=>v.en.includes('FOIS')));
 assert.equal(evaluateContext({...d,route:'tube'},m,fn).blockers.length,0);
});
test('context policy removes a previously valid plan without mutating core result or inventing doses',()=>{
 const core={plan:{volume:600},blockers:['core'],trace:['core trace']};
 const before=structuredClone(core);const out=enforceClinicalContext(core,{blockers:[{en:'review',tr:'kontrol'}]});
 assert.equal(out.plan,null);assert.deepEqual(out.blockers,['core','kontrol']);assert.deepEqual(core,before);
 assert.equal(enforceClinicalContext(core,{blockers:[]}).plan.volume,600);
});
test('urea mg/dL, urea mmol/L and BUN mg/dL are explicitly converted to distinct ratios',()=>{
 const a=marker('ucr',d,{...m,ureaValue:42.88,ureaAnalyte:'urea',ureaUnit:'mg/dL'}).values;
 const b=marker('ucr',d,{...m,ureaValue:20,ureaAnalyte:'bun',ureaUnit:'mg/dL'}).values;
 const c=marker('ucr',d,{...m,ureaValue:42.88/6.006,ureaAnalyte:'urea',ureaUnit:'mmol/L'}).values;
 assert.ok(Math.abs(a.ucr-b.ucr)<1e-10&&Math.abs(a.ucr-c.ucr)<1e-10);assert.equal(b.bunCreatinineRatio,20);
 assert.equal(marker('ucr',d,{...m,ureaValue:20,ureaAnalyte:'bun',ureaUnit:'mmol/L'}).values.ucr,null);
});

test('kidney and intestinal-loss contradictions remove nitrogen interpretation and numeric trace without changing raw result',()=>{
 const core={plan:{volume:600},indices:{nitrogen:{value:2},nlr:{value:4},pni:null},metabolic:{title:'Pozitif tahmini azot dengesi',detail:'2'},blockers:[],trace:['NLR = 4 / 1.','Tahmini azot dengesi = 2.','Toplama: old']};
 const before=structuredClone(core);
 for(const changes of [{conditions:['kidney']},{conditions:['shortBowel']},{highOutputStoma:true}]){
  const out=enforceClinicalContext(core,evaluateContext(d,{...m,...changes}));
  assert.equal(out.indices.nitrogen,null);
  assert.equal(out.indices.nlr.value,4);
  assert.match(out.metabolic.title,/belirlenemedi/);
  assert.equal(out.plan,null);
  assert.ok(!out.trace.some(row=>/^(Tahmini azot dengesi =|Toplama:)/.test(row)));
 }
 assert.deepEqual(core,before);
 assert.equal(enforceClinicalContext(core,evaluateContext(d,m)).indices.nitrogen.value,2);
 assert.equal(enforceClinicalContext(core,evaluateContext(d,{...m,bowelObstruction:true})).indices.nitrogen.value,2);
});
test('unverified, mismatched/future dates, missing creatinine and numeric strings never produce UCR',()=>{
 const fields={...m,ureaValue:30,ureaAnalyte:'urea',ureaUnit:'mg/dL'};
 for(const [input,measures] of [[{...d,labsConfirmed:false},fields],[d,{...fields,markerConfirmed:false}],[d,{...fields,markerDate:'2026-10-22'}],[{...d,labDate:'2026-10-25'},{...fields,markerDate:'2026-10-25'}],[{...d,creatinine:null},fields],[d,{...fields,ureaValue:'30'}]])assert.equal(marker('ucr',input,measures).values.ucr,null);
 assert.equal(marker('crp',d,{...m,crpULN:5}).values.crpRatio,6);
 assert.equal(marker('crp',d,{...m,crpULN:0}).values.crpRatio,null);
});
test('reconfirmed out-of-range creatinine remains unavailable to UCR without clearing its error',()=>{
 const input={...d,creatinine:0.05,inputErrors:['creatinine'],labsConfirmed:true};
 const measures={...m,ureaValue:30,ureaAnalyte:'urea',ureaUnit:'mg/dL',crpULN:5,markerConfirmed:true};
 const before=structuredClone({input,measures});
 const result=marker('ucr',input,measures);
 assert.equal(result.status,'incomplete');
 assert.deepEqual(result.values,{ureaMgDl:null,ucr:null,bunCreatinineRatio:null});
 assert.equal(marker('crp',input,measures).values.crpRatio,6);
 assert.deepEqual({input,measures},before);
});
test('main laboratory error dependencies suppress only the affected paired proxy',()=>{
 const measures={...m,ureaValue:30,ureaAnalyte:'urea',ureaUnit:'mg/dL',crpULN:5};
 for(const [field,ucr,crp] of [
  ['creatinine',null,6],[' creatinine ',null,6],['crp',30,null],
  ['labDate',null,null],['visitDate',null,null],['labsConfirmed',null,null],
  ['formulaEnergy',30,6],['collectionEnd',30,6],
 ]){
  const input={...d,inputErrors:[field]};
  assert.equal(marker('ucr',input,measures).values.ucr,ucr,field);
  assert.equal(marker('crp',input,measures).values.crpRatio,crp,field);
 }
 assert.equal(marker('ucr',{...d,inputErrors:[]},measures).values.ucr,30);
 assert.equal(marker('crp',{...d,inputErrors:[]},measures).values.crpRatio,6);
});
test('clinical laboratory error dependencies do not contaminate the independent proxy',()=>{
 const measures={...m,ureaValue:30,ureaAnalyte:'urea',ureaUnit:'mg/dL',crpULN:5};
 for(const [field,ucr,crp] of [
  ['ureaValue',null,6],['ureaAnalyte',null,6],['ureaUnit',null,6],
  ['crpULN',30,null],['markerDate',null,null],['markerConfirmed',null,null],
  [' markerDate ',null,null],['sofaCreatinine',30,6],['saps2Total',30,6],
 ]){
  const input={...measures,invalidFields:[field]};
  assert.equal(marker('ucr',d,input).values.ucr,ucr,field);
  assert.equal(marker('crp',d,input).values.crpRatio,crp,field);
 }
 assert.equal(marker('ucr',d,{...measures,invalidFields:[]}).values.ucr,30);
 assert.equal(marker('crp',d,{...measures,invalidFields:[]}).values.crpRatio,6);
});
test('malformed main or clinical error metadata cannot authorize paired lab calculations',()=>{
 const measures={...m,ureaValue:30,ureaAnalyte:'urea',ureaUnit:'mg/dL',crpULN:5};
 for(const flags of [null,'creatinine',{},[null],[7],[''],['   '],['formulaEnergy',false],Array(1)]){
  for(const [input,context] of [[{...d,inputErrors:flags},measures],[d,{...measures,invalidFields:flags}]]){
   const before=structuredClone({input,context});
   assert.equal(marker('ucr',input,context).status,'incomplete');
   assert.equal(marker('ucr',input,context).values.ucr,null);
   assert.equal(marker('crp',input,context).values.crpRatio,null);
   assert.deepEqual({input,context},before);
  }
 }
});
test('UCR follows existing creatinine acceptance boundaries and retains measured zero numerators',()=>{
 const measures={...m,ureaValue:30,ureaAnalyte:'urea',ureaUnit:'mg/dL'};
 for(const creatinine of [0.1,30])assert.equal(marker('ucr',{...d,creatinine},measures).values.ucr,30/creatinine);
 for(const creatinine of [0,0.05,0.0999,30.0001,NaN,Infinity,'0.1',null])assert.equal(marker('ucr',{...d,creatinine},measures).values.ucr,null,String(creatinine));
 const zero=marker('ucr',d,{...measures,ureaValue:0});
 assert.equal(zero.status,'review');assert.equal(zero.values.ucr,0);assert.equal(zero.values.bunCreatinineRatio,0);
 assert.equal(marker('crp',{...d,crp:0},{...m,crpULN:5}).values.crpRatio,0);
});
test('SOFA-2 zero requires all six verified organ systems; missing is not normal',()=>{
 assert.equal(sofa({}).score,0);
 for(const patch of [{sofaPlatelets:null},{sofaDelirium:''},{sofaUrine:''},{sofaConfirmed:false},{sofaDate:'2026-10-25'},{sofaFiO2:21}])assert.equal(sofa(patch).score,null);
 assert.equal(marker('sofa2',{...d,context:'ward'},normal).values.score,null);
});
test('SOFA-2 exact boundaries and highest applicable support scores',()=>{
 for(const [platelets,expected] of [[150,1],[100,2],[80,3],[50,4]])assert.equal(sofa({sofaPlatelets:platelets}).components.hemostasis,expected);
 for(const [pao,expected] of [[301,0],[300,1],[225,2],[150,3],[75,4]])assert.equal(sofa({sofaPaO2:pao,sofaFiO2:1,sofaVentilation:'advanced'}).components.respiratory,expected);
 assert.equal(sofa({sofaPaO2:75,sofaFiO2:1,sofaVentilation:'none'}).components.respiratory,2);
 for(const [ne,other,expected] of [[.2,'no',2],[.2,'yes',3],[.4,'no',3],[.4,'yes',4],[.401,'no',4]])assert.equal(sofa({sofaNe:ne,sofaOtherVaso:other}).components.cardiovascular,expected);
 assert.equal(sofa({sofaNe:.1,sofaEpi:.15}).components.cardiovascular,3);
 assert.equal(sofa({sofaCreatinine:1,sofaUrine:'anuria12'}).components.kidney,3);
 assert.equal(sofa({sofaRrt:'yes',sofaCreatinine:null,sofaUrine:''}).components.kidney,4);
 assert.equal(sofa({sofaDelirium:'yes'}).components.brain,1);
 assert.equal(sofa({sofaMechanical:'yes',sofaNe:null,sofaEpi:null}).components.cardiovascular,4);
});
test('SAPS II is only a dated, verified adult ICU recorded total; zero retained',()=>{
 const fields={sapsConfirmed:true,sapsDate:'2026-10-24',saps2Total:0};
 assert.equal(marker('saps2',d,fields).values.score,0);
 for(const patch of [{saps2Total:164},{saps2Total:1.5},{saps2Total:null},{sapsConfirmed:false},{sapsDate:'invalid'}])assert.equal(marker('saps2',d,{...fields,...patch}).values.score,null);
});
