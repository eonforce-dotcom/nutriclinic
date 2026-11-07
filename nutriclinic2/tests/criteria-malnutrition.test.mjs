import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluateMalnutrition} from '../dist/criteria-malnutrition.mjs';
const d={age:64,sex:'male',context:'ward',height:200,weight:80,usualWeight:80,lossMonths:3,fluidWeight:'reliable',screenPositive:true};
const card=(id,input=d,m={})=>evaluateMalnutrition(input,m).find(r=>r.id===id);
test('ESPEN low BMI pathway requires adult, positive screening and reliable weight',()=>{
 assert.equal(card('espen2015',{...d,weight:72}).status,'met');
 for(const extra of [{age:17},{screenPositive:false},{fluidWeight:'uncertain'}])assert.equal(card('espen2015',{...d,weight:72,...extra}).status,'incomplete');
});
test('ESPEN weight-loss and BMI thresholds are strict, not rounded into a diagnosis',()=>{
 assert.equal(card('espen2015',{...d,weight:76,usualWeight:80},{lossUnintentional:true}).status,'not_met');
 assert.equal(card('espen2015',{...d,weight:75.9,usualWeight:80},{lossUnintentional:true}).status,'met');
 assert.equal(card('espen2015',{...d,weight:80,usualWeight:90,lossMonths:9},{lossUnintentional:true}).status,'incomplete');
 assert.equal(card('espen2015',{...d,age:70,weight:84,usualWeight:100,lossMonths:9},{lossUnintentional:true}).status,'met');
});
test('FFMI uses total FFM with confirmed method, never appendicular muscle as a substitute',()=>{
 const input={...d,weight:100,usualWeight:120,lossMonths:6};
 assert.equal(card('espen2015',input,{lossUnintentional:true,appendicularMass:15}).status,'incomplete');
 assert.equal(card('espen2015',input,{lossUnintentional:true,fatFreeMass:60,ffmMethodValid:true}).status,'met');
 assert.equal(card('espen2015',input,{lossUnintentional:true,fatFreeMass:60,ffmMethodValid:false}).status,'incomplete');
});
test('AND/ASPEN counts clinician-confirmed characteristics and excludes ICU grip',()=>{
 const fields={aspenContext:'acute',aspenIntake:'yes',aspenGrip:'yes'};
 assert.equal(card('aspen',d,fields).status,'met');
 assert.equal(card('aspen',{...d,context:'icu'},fields).status,'incomplete');
 assert.equal(card('aspen',d,{albumin:1}).status,'incomplete');
 const no=Object.fromEntries(['aspenIntake','aspenWeight','aspenMuscle','aspenFat','aspenFluid','aspenGrip'].map(k=>[k,'no']));
 assert.equal(card('aspen',d,{...no,aspenContext:'chronic'}).status,'not_met');
});
test('NRS 2002 adds age at 70 and keeps unknown component distinct from zero',()=>{
 assert.equal(card('nrs2002',d,{nrsNutrition:1,nrsDisease:1}).values.score,2);
 assert.equal(card('nrs2002',{...d,age:70},{nrsNutrition:1,nrsDisease:1}).values.score,3);
 assert.equal(card('nrs2002',d,{nrsNutrition:0,nrsDisease:0}).values.score,0);
 for(const m of [{nrsNutrition:null,nrsDisease:0},{nrsNutrition:1.5,nrsDisease:1},{nrsNutrition:4,nrsDisease:0}])assert.equal(card('nrs2002',d,m).values.score,null);
});
