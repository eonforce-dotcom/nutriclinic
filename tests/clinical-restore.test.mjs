import test from 'node:test';
import assert from 'node:assert/strict';
import {restoreClinicalMeasures,restoreClinicalDraft} from '../dist/clinical-workspace.mjs';
test('clinical profile round trip retains real zero, context and user text while resetting all clinical confirmations',()=>{
 const record={measures:{conditions:['ibd'],ibdType:'uc',ibdPhase:'active',eat10Total:3,fois:5,iddsiFluid:0,dysphagiaSource:'SYNTHETIC FEES α',dysphagiaDate:'2026-10-23',dysphagiaConfirmed:true,contextReviewed:true,markerConfirmed:true,sofaConfirmed:true}};
 const before=structuredClone(record),out=restoreClinicalMeasures(record);
 assert.equal(out.iddsiFluid,0);assert.equal(out.fois,5);assert.equal(out.dysphagiaSource,'SYNTHETIC FEES α');assert.equal(out.ibdPhase,'active');
 for(const key of ['dysphagiaConfirmed','contextReviewed','markerConfirmed','sofaConfirmed'])assert.equal(out[key],false);
 assert.deepEqual(out.invalidFields,[]);assert.deepEqual(record,before);
});
test('malformed clinical fields remain explicit errors rather than becoming normal values',()=>{
 const out=restoreClinicalMeasures({measures:{eat10Total:3.5,iddsiFood:9,sofaFiO2:21,functionDate:'2026-02-30',nrsNutrition:4,gripStrength:'20',conditions:['none'],unknownField:'ignored'}});
 for(const key of ['eat10Total','iddsiFood','sofaFiO2','functionDate','nrsNutrition','gripStrength'])assert.ok(out.invalidFields.includes(key),key);
 assert.equal(out.eat10Total,null);assert.equal(out.unknownField,undefined);
});
test('local clinical drafts preserve unfinished invalid measurements and flags without restoring confirmation',()=>{
 const source={measures:{sofaFiO2:21,eat10Total:3.5,functionDate:'2026-02-30',functionSource:'Unfinished source',invalidFields:['sofaFiO2','eat10Total'],functionConfirmed:true,sofaConfirmed:true}};
 const before=structuredClone(source),draft=restoreClinicalDraft(source);
 assert.equal(draft.sofaFiO2,21);assert.equal(draft.eat10Total,3.5);assert.equal(draft.functionDate,'2026-02-30');assert.equal(draft.functionSource,'Unfinished source');
 assert.ok(draft.invalidFields.includes('sofaFiO2'));assert.ok(draft.invalidFields.includes('eat10Total'));
 assert.equal(draft.functionConfirmed,false);assert.equal(draft.sofaConfirmed,false);assert.deepEqual(source,before);
});
