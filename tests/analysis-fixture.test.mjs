import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {analyzeSyntheticAgreement} from '../analysis/agreement.mjs';

const fixture=JSON.parse(await readFile(new URL('../analysis/fixtures/synthetic-agreement.json',import.meta.url),'utf8'));
const expected=JSON.parse(await readFile(new URL('../analysis/fixtures/synthetic-expected.json',import.meta.url),'utf8'));
const key=row=>`${row.patientId}|${row.admissionId}|${row.windowId}`;
const near=(actual,wanted,label)=>{
 assert.ok(Number.isFinite(actual),`${label} must be finite`);
 assert.ok(Math.abs(actual-wanted)<1e-10,`${label}: ${actual} differs from independent ${wanted}`);
};

test('the synthetic fixture ledger keeps actual zero, revisions, duplicate imports and patient flags explicit',()=>{
 assert.equal(fixture.dataClass,'synthetic');
 assert.equal(fixture.windows.length,expected.rawRows);
 assert.equal(new Set(fixture.windows.map(key)).size,expected.logicalWindows);
 const counts={total:fixture.patients.length,screened:0,eligible:0,enrolled:0};
 for(const patient of fixture.patients){
  for(const flag of ['screened','eligible','enrolled']){
   assert.equal(typeof patient[flag],'boolean');
   counts[flag]+=Number(patient[flag]);
  }
  assert.ok(!patient.enrolled||patient.eligible);
  assert.ok(!patient.eligible||patient.screened);
 }
 assert.deepEqual(counts,expected.globalPatientCounts);
 const zero=fixture.windows.filter(row=>key(row)===expected.assertions.trueObservedZeroKey&&row.selected);
 assert.equal(zero.length,2);
 assert.deepEqual(zero[0],zero[1]);
 assert.equal(zero[0].candidate.status,'observed');assert.equal(zero[0].candidate.value,0);
 assert.equal(zero[0].reference.status,'observed');assert.equal(zero[0].reference.value,0);
 assert.ok(fixture.windows.some(row=>row.revisionId==='R0'&&!row.selected&&row.candidate.value===999));
 for(const row of fixture.windows){
  assert.equal(row.reference.construct,expected.assertions.referenceConstruct);
  assert.equal(row.reference.unit,expected.assertions.referenceUnit);
  assert.equal(row.reference.independent,true);
 }
});

test('analysis agrees with independently counted denominators, exclusions and repeated-measures algebra',()=>{
 const report=analyzeSyntheticAgreement(structuredClone(fixture));
 assert.equal(report.status,'ok');assert.deepEqual(report.errors,[]);
 assert.equal(report.syntheticOnly,true);assert.equal(report.clinicalPass,null);
 assert.deepEqual(report.patients,expected.globalPatientCounts);
 assert.equal(report.ledger.length,expected.logicalWindows);
 for(const setting of ['icu','ward']){
  const actual=report.settings[setting],oracle=expected.settings[setting];
  assert.deepEqual(actual.counts,oracle.counts);
  assert.deepEqual(actual.reasonCounts,oracle.reasonCounts);
  const exclusionMap=new Map(actual.exclusions.map(row=>[key(row),[...row.reasons].sort()]));
  assert.equal(exclusionMap.size,oracle.exclusions.length);
  for(const row of oracle.exclusions)assert.deepEqual(exclusionMap.get(row.key),[...row.reasons].sort());
  const pairMap=new Map(actual.pairs.map(row=>[key(row),row]));
  assert.equal(pairMap.size,oracle.pairs.length);
  for(const pair of oracle.pairs){
   const measured=pairMap.get(key(pair));assert.ok(measured);
   assert.equal(measured.revisionId,pair.revisionId);
   near(measured.difference,pair.difference,`${setting} ${key(pair)} difference`);
   near(measured.mean,pair.mean,`${setting} ${key(pair)} pair mean`);
  }
  near(actual.bias.eligibleWindow,oracle.bias.eligibleWindow,`${setting} window bias`);
  near(actual.bias.patientWeighted,oracle.bias.patientWeighted,`${setting} patient-weighted sensitivity`);
  assert.equal(actual.anova.status,'estimable');
  for(const [name,value] of Object.entries(oracle.anova)){
   if(name==='loa')continue;
   near(actual.anova.components[name],value,`${setting} ${name}`);
  }
  near(actual.anova.loa.lower,oracle.anova.loa.lower,`${setting} LoA lower`);
  near(actual.anova.loa.upper,oracle.anova.loa.upper,`${setting} LoA upper`);
 }
 assert.equal(report.settings.icu.counts.patients,4);
 assert.equal(report.settings.icu.anova.components.n,3);
 assert.notEqual(report.settings.icu.bias.eligibleWindow,report.settings.icu.bias.patientWeighted);
 assert.equal(report.settings.ward.anova.components.varianceBetween,2);
});

test('patient-cluster bootstrap is order invariant and keeps failed ANOVA replicates separate from bias uncertainty',()=>{
 const first=analyzeSyntheticAgreement(structuredClone(fixture));
 const reordered=structuredClone(fixture);reordered.patients.reverse();reordered.windows.reverse();
 const second=analyzeSyntheticAgreement(reordered);
 for(const setting of ['icu','ward']){
  const bootstrap=first.settings[setting].bootstrap;
  assert.deepEqual(bootstrap,second.settings[setting].bootstrap);
  assert.equal(bootstrap.seed,expected.bootstrap.seed);
  assert.equal(bootstrap.replicates,expected.bootstrap.replicates);
  assert.equal(bootstrap.replicatesRun,expected.bootstrap.replicates);
  assert.equal(bootstrap.biasValidReplicates+bootstrap.biasFailedReplicates,expected.bootstrap.replicates);
  assert.equal(bootstrap.anovaValidReplicates+bootstrap.anovaFailedReplicates,expected.bootstrap.replicates);
  assert.equal(bootstrap.biasFailedReplicates,0);
  assert.ok(bootstrap.biasCI);
 }
 // Repeated draws of the one-window ICU patient can lack residual degrees of freedom.
 assert.ok(first.settings.icu.bootstrap.anovaFailedReplicates>0);
 assert.equal(first.settings.icu.bootstrap.loaCI,null);
 // Every ward resample has two fresh cluster identities and exact zero within variance.
 assert.equal(first.settings.ward.bootstrap.anovaFailedReplicates,0);
 assert.ok(first.settings.ward.bootstrap.loaCI);
});

test('a wrong reference construct refuses agreement instead of becoming a valid main-fixture pair',()=>{
 const wrong=structuredClone(fixture);
 wrong.windows.find(row=>row.patientId==='P2'&&row.windowId==='W01').reference.construct='muscle-fractional-synthesis-rate';
 const report=analyzeSyntheticAgreement(wrong);
 assert.equal(report.status,'refused');assert.equal(report.clinicalPass,null);
 assert.ok(report.errors.length>0);
});

test('a non-independent reference refuses agreement independently of the wrong-construct mutation',()=>{
 const nonIndependent=structuredClone(fixture);
 nonIndependent.windows.find(row=>row.patientId==='P2'&&row.windowId==='W01').reference.independent=false;
 const report=analyzeSyntheticAgreement(nonIndependent);
 assert.equal(report.status,'refused');assert.equal(report.clinicalPass,null);
 assert.ok(report.errors.length>0);
});
