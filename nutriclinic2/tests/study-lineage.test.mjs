import test from 'node:test';
import assert from 'node:assert/strict';
import {lineageFor,lineageEvidenceIds,lineageMarkup} from '../dist/study-lineage.mjs';

test('ward EFFORT and ICU EFFORT Protein remain distinct trials despite a shared acronym',()=>{
 const ward=lineageFor('ucr-effort-ward-2025'),icu=lineageFor('effort-protein-2023');
 assert.equal(ward.family.registry.id,'NCT02517476');assert.equal(icu.family.registry.id,'NCT03160547');
 assert.notEqual(ward.familyId,icu.familyId);assert.equal(ward.reportsParentRandomization,false);assert.equal(ward.randomizedExposureForQuestion,false);
 assert.equal(icu.reportsParentRandomization,true);assert.equal(icu.randomizedExposureForQuestion,true);
 assert.ok(ward.family.dates.firstPosted>ward.family.dates.actualStart);
});
test('verified secondary linkage and observational supportive cohorts are not new randomized trials',()=>{
 const age=lineageFor('need-age-heterogeneity-2026'),mixed=lineageFor('deng-physiological-windows-2026'),ucr=lineageFor('ucr-aki-mortality-posthoc-2026');
 assert.equal(age.reportsParentRandomization,false);assert.equal(age.randomizedExposureForQuestion,true);
 assert.equal(mixed.randomizedExposureForQuestion,false);assert.equal(mixed.familyId,null);assert.equal(mixed.cohorts.length,2);
 assert.equal(mixed.cohorts[1].directRegistryCitationVerified,false);assert.equal(mixed.cohorts[1].familyId,age.familyId);
 assert.match(lineageMarkup('deng-physiological-windows-2026','en'),/Two cohort roles/);
 assert.match(lineageMarkup('deng-physiological-windows-2026','tr'),/İki kohort rolü/);
 assert.doesNotMatch(lineageMarkup('deng-physiological-windows-2026','en'),/Parent linkage incomplete/);
 assert.equal(ucr.linkStatus,'verified');assert.equal(ucr.familyId,age.familyId);
 assert.equal(ucr.family.registry.id,'ISRCTN12233792');assert.equal(ucr.reportsParentRandomization,false);assert.equal(ucr.randomizedExposureForQuestion,false);
 for(const id of lineageEvidenceIds)assert.equal(lineageFor(id).independentParticipantTotal,null);
 assert.equal(lineageFor('unmapped-publication'),null);
 for(const invalid of ['__proto__','toString',{},null])assert.equal(lineageFor(invalid),null);
});
test('lineage display preserves bilingual uncertainty and never changes source metadata',()=>{
 const id='ucr-aki-mortality-posthoc-2026';
 assert.match(lineageMarkup(id,'en'),/Overlap.*is unquantified/);
 assert.match(lineageMarkup(id,'tr'),/örtüşme nicelenmedi/);
 assert.equal(lineageMarkup('unknown'),'');
 const altered=lineageFor('ucr-effort-ward-2025');altered.family.registry.id='invalid';
 assert.equal(lineageFor('ucr-effort-ward-2025').family.registry.id,'NCT02517476');
 assert.match(lineageMarkup('ucr-effort-ward-2025'),/data-no-i18n/);
});

test('individual PRECISe and cluster-period TARGET keep separate analysis-plan chronology and uncertainty',()=>{
 const precise=lineageFor('precise-2024'),target=lineageFor('target-protein-2025');
 assert.equal(precise.family.registry.id,'NCT04633421');
 assert.equal(target.family.registry.id,'ACTRN12621001484831');
 assert.notEqual(precise.familyId,target.familyId);
 assert.equal(precise.family.randomizationUnit,'individual-participant');
 assert.equal(target.family.randomizationUnit,'icu-cluster-treatment-sequence');
 assert.equal(precise.family.sap.coverMonth,'2023-11');
 assert.equal(precise.family.sap.uploadedDate,'2024-01-14');
 assert.equal(target.family.sap.supersedesEarlierPlan,true);
 assert.equal(target.family.sap.receivedDate,'2024-08-01');
 assert.equal(target.family.sap.publishedDate,'2025-02-06');
 assert.match(lineageMarkup('precise-2024','en'),/not labelled a proven outcome switch/);
 assert.match(lineageMarkup('target-protein-2025','en'),/not a within-patient crossover/);
 assert.match(lineageMarkup('target-protein-2025','tr'),/hasta içi çapraz geçiş değildir/);
 assert.match(lineageMarkup('target-protein-2025','en'),/supersedes/);
 assert.match(lineageMarkup('target-protein-2025','en'),/href="https:\/\/link.springer.com\/article\/10.1186\/s13063-025-08759-0"/);
 for(const id of ['precise-2024','target-protein-2025'])assert.equal(lineageFor(id).independentParticipantTotal,null);
});

test('the Lausanne HMB biochemical report does not become another trial or a calibrated UCR treatment target',()=>{
 const metabolic=lineageFor('berger-hmb-metabolic-posthoc-2026'),factorial=lineageFor('wu-icu-hmb-2025');
 assert.equal(metabolic.family.registry.id,'NCT03628365');
 assert.equal(metabolic.reportsParentRandomization,false);
 assert.equal(metabolic.family.parent.doi,'10.1016/j.clnu.2021.07.018');
 assert.deepEqual(metabolic.reportedUcr,{analyteBasis:null,unitBasis:null,contrastCi:null,perAnalyteDenominators:null});
 assert.equal(factorial.family.registry.id,'ChiCTR2200057685');
 assert.notEqual(factorial.familyId,metabolic.familyId);
 assert.equal(factorial.includesEarlierParticipants.n,112);
 assert.equal(factorial.includesEarlierParticipants.reportDoi,'10.1186/s13054-023-04698-x');
 assert.equal(factorial.family.registry.access,'indexed-official-record');
 assert.match(lineageMarkup('wu-icu-hmb-2025','en'),/10 ICUs in 5 hospitals/);
 assert.match(lineageMarkup('berger-hmb-metabolic-posthoc-2026','en'),/cannot be overlaid/);
 assert.match(lineageMarkup('berger-hmb-metabolic-posthoc-2026','tr'),/bindirilemez/);
 for(const id of ['berger-hmb-metabolic-posthoc-2026','wu-icu-hmb-2025'])assert.equal(lineageFor(id).independentParticipantTotal,null);
});

test('NEXIS provenance distinguishes current registry eligibility from final-cohort and complete-protocol verification',()=>{
 const trial=lineageFor('nexis-aa-cycling-2026');
 assert.equal(trial.auditDate,'2026-10-25');
 assert.equal(lineageFor('precise-2024').auditDate,'2026-10-24');
 assert.equal(trial.family.registry.id,'NCT03021902');
 assert.equal(trial.family.protocol.access,'indexed-original-passages');
 assert.equal(trial.family.populationScopeBasis,'current-registry-not-verified-final-cohort');
 assert.equal(trial.family.dates.firstPostDateType,'ESTIMATED');
 assert.match(lineageMarkup('nexis-aa-cycling-2026','en'),/not verified final-cohort counts/);
 assert.match(lineageMarkup('nexis-aa-cycling-2026','tr'),/doğrulanmış son analiz kohortu sayıları değildir/);
 assert.equal(trial.independentParticipantTotal,null);
});

test('ENGINE secondary intake categories retain parent overlap without becoming randomized PCR dose targets',()=>{
 const secondary=lineageFor('engine-aki-pcr-posthoc-2026');
 assert.equal(secondary.auditDate,'2026-10-25');
 assert.equal(secondary.family.registry.id,'NCT06238674');
 assert.equal(secondary.family.parent.doi,'10.1038/s41598-025-97443-z');
 assert.equal(secondary.reportsParentRandomization,false);
 assert.equal(secondary.randomizedExposureForQuestion,false);
 assert.equal(secondary.analysisContrast,'nonrandom-achieved-intake-association');
 assert.equal(secondary.participantCounts.parentEnrolled-secondary.participantCounts.excludedIncompleteUrineCollections,secondary.participantCounts.secondaryAnalyzed);
 assert.equal(secondary.pcrMethodVerification.equationVerified,false);
 assert.equal(secondary.pcrMethodVerification.renalKineticHandlingVerified,false);
 assert.equal(secondary.pcrMethodVerification.individualDoseTargetValidated,false);
 assert.equal(secondary.family.registry.historicalVersionsCompared,false);
 assert.notEqual(secondary.family.dates.actualStart,secondary.family.dates.reportedStudyStart);
 assert.ok(secondary.family.dates.firstPosted>secondary.family.dates.reportedStudyEnd);
 assert.match(lineageMarkup('engine-aki-pcr-posthoc-2026','en'),/not the randomized treatment contrast/);
 assert.match(lineageMarkup('engine-aki-pcr-posthoc-2026','en'),/unread Supplementary Fig\. 1S/);
 assert.match(lineageMarkup('engine-aki-pcr-posthoc-2026','tr'),/PCR katsayıları.*doğrulanmadı/);
 assert.match(lineageMarkup('engine-aki-pcr-posthoc-2026','en'),/prespecification was not independently verified/);
 assert.equal(secondary.independentParticipantTotal,null);
});

test('PROMS keeps randomized/completed/analyzed denominators distinct and muscle FSR separate from unanalysed net balance',()=>{
 const acute=lineageFor('summers-anabolic-resistance-rct-2026');
 assert.equal(acute.auditDate,'2026-10-25');
 assert.equal(acute.family.registry.id,'ACTRN12620000776909');
 assert.equal(acute.reportsParentRandomization,true);
 assert.equal(acute.randomizedExposureForQuestion,true);
 assert.equal(acute.participantCounts.randomized,29);
 assert.equal(acute.participantCounts.completed,21);
 assert.equal(acute.participantCounts.analyzed,20);
 assert.notEqual(acute.participantCounts.randomized,acute.participantCounts.registryFinal);
 assert.equal(acute.participantCounts.completed-acute.participantCounts.completedExcludedProtocolViolation,acute.participantCounts.analyzed);
 assert.equal(acute.outcomeScope.postprandialHours,6);
 assert.equal(acute.outcomeScope.wholeBodyBreakdownAnalyzed,false);
 assert.equal(acute.outcomeScope.wholeBodyBalanceAnalyzed,false);
 assert.equal(acute.outcomeScope.individualDailyDoseValidated,false);
 assert.ok(acute.family.dates.registered<acute.family.dates.actualStart);
 assert.equal(acute.family.registry.historicalVersionsCompared,false);
 assert.equal(acute.family.protocolLead.finalProtocolVerified,false);
 assert.equal(acute.family.parent.access,'indexed-original-methods-results');
 assert.match(lineageMarkup('summers-anabolic-resistance-rct-2026','en'),/does not measure whole-body net protein balance/);
 assert.match(lineageMarkup('summers-anabolic-resistance-rct-2026','en'),/registered whole-body breakdown\/balance outcomes were not analyzed/);
 assert.match(lineageMarkup('summers-anabolic-resistance-rct-2026','tr'),/her analizin prospektif belirlendiğini kanıtlamaz/);
 assert.equal(lineageFor('precise-2024').auditDate,'2026-10-24');
 assert.equal(acute.independentParticipantTotal,null);
});

test('Lin PMV retains primary ITT without inventing serial Ns, independent cohorts or isolated nutrient validity',()=>{
 const trial=lineageFor('lin-pmv-2026'),counts=trial.participantCounts;
 assert.deepEqual([counts.randomized,counts.completed,counts.primaryITT],[100,91,100]);
 assert.equal(counts.randomized-counts.earlyWithdrawals,counts.completed);
 assert.equal(Object.values(trial.outcomeDenominators.primaryAsReported).reduce((sum,n)=>sum+n,0),counts.primaryITT);
 assert.deepEqual(trial.outcomeDenominators.primaryAsReported,counts.randomizedArms);
 assert.equal(trial.outcomeDenominators.serialNutritionAndFunctionMeasuredNs,null);
 assert.equal(trial.independentParticipantTotal,null);
 const prior=trial.relatedPublications.find(report=>report.pmid==='36297079');
 assert.match(prior.role,/prior-observational-record-analysis/);
 assert.equal(prior.participantOverlapVerified,false);
 assert.equal(trial.randomizedExposureForQuestion,true);
 assert.match(trial.analysisContrast,/assigned-additive-package-not-isolated-amino-acid-or-factorial-effect/);
 assert.equal(trial.outcomeScope.independentAnabolicStateValidated,false);
 assert.equal(trial.outcomeScope.individualProteinTargetValidated,false);
 const duration=trial.outcomeScope.ventilationDuration;
 assert.deepEqual([duration.paperHierarchy,duration.registryProtocolHierarchy],['primary','secondary']);
 assert.equal(duration.exactClockReconciled,false);
 assert.equal(trial.family.registry.historicalVersionsCompared,false);
 const en=lineageMarkup('lin-pmv-2026','en'),tr=lineageMarkup('lin-pmv-2026','tr');
 assert.match(en,/Prior 2022 observational records and this trial are not merged or summed/);
 assert.match(tr,/2022 gözlemsel kayıtları bu deneyle birleştirilmez\/toplanmaz/);
 assert.match(en,/Additive arms cannot isolate amino-acid\/protein effects/);
 assert.match(en,/ventilation duration primary; current registry\/protocol call it secondary/);
});
