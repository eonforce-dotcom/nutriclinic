import test from 'node:test';
import assert from 'node:assert/strict';
import {initExperience} from '../dist/experience.mjs';
import {initFollowup} from '../dist/followup-ui.mjs';
import {initLabReferences} from '../dist/lab-reference-ui.mjs';
import {decisionTopics} from '../dist/decision-topics.mjs';
import {emptyReferenceProfile} from '../dist/lab-reference-ranges.mjs';
import {evaluateDelivery} from '../dist/followup-engine.mjs';

// Execute the real UI closures; only DOM nodes/storage are replaced. Restoration
// invokes the real form/render/evaluation paths, not a copy of their algorithms.
function dom(records=[]){
 const previous={document:globalThis.document,localStorage:globalThis.localStorage};
 const nodes=new Map();let selectionNodes=[],writes=0;
 class Element{
  constructor(id=''){this.id=id;this.dataset={};this.handlers=new Map();this.value='';this.checked=false;this.hidden=false;this.validity={valid:true};this.innerHTML='';this.textContent='';this.type='text';this.tagName='DIV';this.classList={add(){},remove(){},toggle(){}};}
  get innerHTML(){return this._html||'';}
  set innerHTML(value){this._html=value;for(const match of String(value).matchAll(/\bid="([^"]+)"/g))nodes.get(match[1])?.handlers.clear();}
  addEventListener(type,handler){const handlers=this.handlers.get(type)||[];handlers.push(handler);this.handlers.set(type,handlers);}
  emit(type,target=this){return Promise.all((this.handlers.get(type)||[]).map(handler=>handler({target,preventDefault(){}})));}
  setAttribute(){} focus(){} scrollIntoView(){}
  querySelector(selector){return element(this.id+selector);}
  querySelectorAll(){return [];}
 }
 const element=id=>{if(!nodes.has(id))nodes.set(id,new Element(id));return nodes.get(id);};
 globalThis.document={getElementById:element,querySelector:element,querySelectorAll(selector){
  if(selector==='[data-followup-record]'){selectionNodes=records.map(record=>{const el=new Element();el.dataset.followupRecord=record.recordId;el.checked=true;return el;});return selectionNodes;}
  return [];
 }};
 globalThis.localStorage={getItem:()=>null,setItem:()=>{writes++;}};
 return {element,selection:()=>selectionNodes,writes:()=>writes,close(){globalThis.document=previous.document;globalThis.localStorage=previous.localStorage;}};
}
const input=()=>({studyId:'CASE-A',age:64,sex:'male',height:172,weight:68,context:'ward',phase:'recovery',visitDate:'2026-10-28',labDate:'2026-10-28',labsConfirmed:true,albumin:31,crp:28});
const records=()=>['record-1','record-2','record-3'].map(recordId=>({recordId,input:{...input()},delivery:{measures:{}}}));
const experience=()=>initExperience({getInput:input,getResult:()=>({blockers:[],plan:null}),getVisits:()=>[],getView:()=> 'decisions',getSource:()=>null,navigate(){},toast(){}});

test('unfinished choice/rationale survives UI recovery while restored review authority is cleared',async()=>{
 const env=dom();try{
  const ui=experience(),topic=decisionTopics[0],choice=topic.choices[0];
  const rationale=env.element('decisionRationale');rationale.value='Local protocol v2: review <source> & tolerance';await rationale.emit('input');
  await env.element('decisionForm').emit('change',{name:'clinicalApproach',value:choice.id});
  env.element('decisionAcknowledged').checked=true;await env.element('decisionAcknowledged').emit('change');
  const draft=ui.getDraft();
  assert.equal(draft.drafts[topic.id].rationale,rationale.value);
  draft.reviews=[{topicId:topic.id,choiceId:choice.id,rationale:'Saved reasoning',sourceIds:[topic.sourceIds[0],'forged-source'],reviewedAt:'2026-10-28T10:00:00Z',reviewedInput:input(),confirmed:true,currentAtSave:true,automaticDose:999}];
  ui.restoreDraft(draft);
  const recovered=ui.getDraft(),review=ui.snapshot().records[0];
  assert.equal(recovered.selectedTopic,topic.id);
  assert.equal(recovered.drafts[topic.id].choiceId,choice.id);
  assert.equal(recovered.drafts[topic.id].rationale,rationale.value);
  assert.equal(recovered.drafts[topic.id].confirmed,false);
  assert.equal(review.confirmed,false);assert.equal(review.currentAtSave,false);
  assert.equal(Object.hasOwn(review,'automaticDose'),false);
  assert.deepEqual(review.sourceIds,[topic.sourceIds[0]]);
  assert.match(env.element('decisionContent').innerHTML,/&lt;source&gt; &amp; tolerance/);
  recovered.drafts[topic.id].rationale='Changed outside';assert.notEqual(ui.getDraft().drafts[topic.id].rationale,'Changed outside');
 }finally{env.close();}
});

test('unknown choice/topic and oversized rationale cannot acquire review state on recovery',()=>{
 const env=dom();try{
  const ui=experience(),topic=decisionTopics[0];
  ui.restoreDraft({selectedTopic:'unknown',reviews:[{topicId:topic.id,choiceId:'unknown',rationale:'forged'}],drafts:{[topic.id]:{choiceId:'unknown',rationale:'x'.repeat(1201),confirmed:true},unknown:{rationale:'extra'}}});
  const state=ui.getDraft();assert.equal(state.selectedTopic,topic.id);assert.equal(state.drafts[topic.id].choiceId,'');assert.equal(state.drafts[topic.id].rationale,'');assert.deepEqual(ui.snapshot().records,[]);assert.equal(Object.hasOwn(state.drafts,'unknown'),false);
 }finally{env.close();}
});

test('unfinished intake values and invalid flags survive while confirmation and saved authority do not',()=>{
 const env=dom(records());try{
  const ui=initFollowup({getInput:input,getClinicalMeasures:()=>({}),getVisits:records,getSource:()=>null,getResult:()=>({blockers:[]}),getImportedComparisons:()=>[],navigate(){},toast(){}});
  ui.restoreDraft({measures:{episodeId:' ADMISSION 1 ',periodStart:'not-a-date-yet',periodEnd:'2026-10-28T08:00',actualEnergy:-10,actualProtein:'unfinished',source:'Source typed so far',targetVersion:'v1',confirmed:true,targetsStable:true,invalidFields:['actualEnergy']}});
  const raw=ui.getDraft().measures;
  assert.equal(raw.episodeId,' ADMISSION 1 ');assert.equal(raw.periodStart,'not-a-date-yet');assert.equal(raw.actualEnergy,-10);assert.equal(raw.actualProtein,'unfinished');assert.equal(raw.source,'Source typed so far');
  assert.equal(raw.confirmed,false);assert.equal(raw.targetsStable,false);assert.ok(raw.invalidFields.includes('actualEnergy'));assert.ok(raw.invalidFields.includes('periodStart'));assert.ok(raw.invalidFields.includes('actualProtein'));
  assert.equal(evaluateDelivery(input(),raw).valid,false);
  raw.source='Modified';assert.equal(ui.getMeasures().source,'Source typed so far');
 }finally{env.close();}
});

test('overlap-revision deselection survives refresh/recovery and selection edits notify autosave',async()=>{
 const items=records(),env=dom(items);let changes=0;try{
  const ui=initFollowup({getInput:input,getClinicalMeasures:()=>({}),getVisits:()=>items,getSource:()=>null,getResult:()=>({blockers:[]}),getImportedComparisons:()=>[],onDraftChange:()=>changes++,navigate(){},toast(){}});
  ui.refresh();const checkbox=env.selection().find(el=>el.dataset.followupRecord==='record-2');checkbox.checked=false;await checkbox.emit('change');
  assert.equal(changes,1);assert.deepEqual(ui.getDraft().selection.selectedIds,['record-1','record-3']);
  const draft=ui.getDraft();draft.excludedIds.push('unknown-record');ui.restoreDraft(draft);
  assert.deepEqual(ui.getDraft().excludedIds,['record-2']);assert.deepEqual(ui.series().selection.selectedIds,['record-1','record-3']);assert.equal(changes,1,'Programmatic restore must not call autosave');
  ui.restoreDraft({measures:{},selection:{selectedIds:['record-2','unknown-record']}});
  assert.deepEqual(ui.series().selection.selectedIds,['record-2']);
 }finally{env.close();}
});

test('partial or invalid clinic fields are retained as invalid local draft, with no saved applicability',async()=>{
 const env=dom();let changes=0;try{
  const ui=initLabReferences({getInput:input,onChange:()=>changes++});
  const profile=emptyReferenceProfile();Object.assign(profile,{clinicName:'Partial laboratory',source:'Source draft',version:'',effectiveFrom:'',ageMin:-1});Object.assign(profile.rows.albumin,{enabled:true,lower:'5',upper:'3.5',unit:'g/dL'});
  ui.restoreDraft({profile,applicabilityConfirmed:true,editorOpen:true});
  const draft=ui.getDraft();assert.equal(draft.profile.ageMin,-1);assert.equal(draft.profile.rows.albumin.lower,'5');assert.equal(draft.profile.rows.albumin.upper,'3.5');assert.equal(draft.profile.version,'');assert.equal(draft.editorOpen,true);assert.equal(draft.applicabilityConfirmed,false);
  env.element('referenceApplicable').checked=true;await env.element('referenceApplicable').emit('change');
  assert.equal(ui.snapshot().profileValid,false);assert.equal(ui.snapshot().results.find(row=>row.analyte==='albumin').status,'not-applicable');assert.equal(env.writes(),0);
  assert.equal(changes,1,'Only explicit applicability interaction notifies; restore does not');
  draft.profile.rows.albumin.lower='0';assert.equal(ui.getDraft().profile.rows.albumin.lower,'5');
 }finally{env.close();}
});

test('valid clinic draft requires fresh explicit applicability, and malformed fields cannot sanitize to authority',async()=>{
 const env=dom();try{
  const ui=initLabReferences({getInput:input});
  const profile=emptyReferenceProfile();Object.assign(profile,{clinicName:'QA lab',source:'Interval sheet',version:'1',effectiveFrom:'2026-01-01'});Object.assign(profile.rows.albumin,{enabled:true,lower:35,upper:50});
  ui.restoreDraft({profile,applicabilityConfirmed:true});assert.equal(ui.snapshot().profileValid,true);assert.equal(ui.snapshot().applicabilityConfirmed,false);assert.equal(ui.snapshot().results.find(row=>row.analyte==='albumin').reason,'applicability-unconfirmed');
  env.element('referenceApplicable').checked=true;await env.element('referenceApplicable').emit('change');assert.equal(ui.snapshot().results.find(row=>row.analyte==='albumin').status,'below');
  profile.unrecognizedDecisionOverride=true;ui.restoreDraft({profile,applicabilityConfirmed:true});assert.equal(ui.snapshot().profileValid,false);assert.equal(ui.getDraft().profile.schemaVersion,'invalid-local-draft');assert.equal(env.writes(),0);
 }finally{env.close();}
});
