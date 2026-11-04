import test from 'node:test';
import assert from 'node:assert/strict';
import {initLocalRecordsUI} from '../dist/local-records-ui.mjs';

function fixture(t){
 const previous=globalThis.document,nodes=new Map();let patientButtons=[],draftButtons=[];
 class Element{
  constructor(id=''){this.id=id;this.handlers={};this.dataset={};this.value='';this.checked=false;this.disabled=false;this._html='';}
  set innerHTML(value){this._html=value;for(const m of value.matchAll(/<[^>]*\bid="([^"]+)"[^>]*>/g)){const node=new Element(m[1]);node.disabled=/\sdisabled(?:\s|>)/.test(m[0]);nodes.set(m[1],node);}if(this.id==='localPatientArchive'){
   patientButtons=[...value.matchAll(/data-local-patient="([^"]+)"/g)].map(m=>{const e=new Element();e.dataset.localPatient=m[1];return e;});
   draftButtons=[...value.matchAll(/data-local-draft="([^"]+)"/g)].map(m=>{const e=new Element();e.dataset.localDraft=m[1];return e;});
  }}
  get innerHTML(){return this._html;}
  insertAdjacentHTML(_,value){this.innerHTML=this._html+value;}
  querySelectorAll(query){return query==='[data-local-patient]'?patientButtons:query==='[data-local-draft]'?draftButtons:[];}
  addEventListener(type,fn){(this.handlers[type]??=[]).push(fn);}
  async emit(type){for(const fn of this.handlers[type]||[])await fn({target:this});}
  focus(){}setSelectionRange(){}
 }
 nodes.set('localRecordStatus',new Element('localRecordStatus'));nodes.set('localPatientArchive',new Element('localPatientArchive'));
 globalThis.document={getElementById:id=>nodes.get(id)||null};t.after(()=>{globalThis.document=previous;});
 const calls=[],store={flush:async()=>({ok:true}),listPatients:async()=>({ok:true,patients:[{studyId:'SYNTHETIC-UI',recordCount:3,draftCount:1,updatedAt:'2026-10-28T10:00:00Z'}]}),
  listBackups:async()=>({ok:true,backups:[{file:'manual-synthetic.sqlite',kind:'manual',createdAt:'2026-10-28T10:00:00Z'}]}),
  loadPatient:async(code,offset,limit)=>({ok:true,records:[{recordId:'synthetic'}],total:3,offset,limit,hasMore:false,draftCount:1,drafts:[]}),
  backup:async()=>{calls.push('backup');return {ok:true,backup:{file:'manual-synthetic.sqlite'}};},
  restoreBackup:async file=>{calls.push(['restore',file]);return {ok:true};},
  reloadSavedWorkspace:async options=>{calls.push(['reload',options]);return {ok:true};}};
 let openPatientHandler=async(value,code)=>calls.push(['open',code,value.records.length]);
 const ui=initLocalRecordsUI({getStore:()=>store,openPatient:(value,code)=>openPatientHandler(value,code),saveBeforeSwitch:async()=>true,
  downloadRecovery:()=>calls.push('recovery'),navigate:view=>calls.push(['navigate',view])});
 return {ui,store,calls,node:id=>nodes.get(id),patient:()=>patientButtons[0],setOpen:handler=>{openPatientHandler=handler;}};
}
const deferred=()=>{let resolve;const promise=new Promise(done=>{resolve=done;});return {promise,resolve};};
const settle=async predicate=>{for(let i=0;i<40&&!predicate();i++)await Promise.resolve();assert.ok(predicate(),'Expected async UI stage reached');};
test('save status distinguishes failed/pending/saved and archive opens the selected patient after loading its list',async t=>{
 const h=fixture(t);h.ui.update({phase:'error',loaded:true,dirty:true,errorCode:'storage-unreachable'});
 assert.match(h.node('localRecordStatus').innerHTML,/NOT SAVED/);assert.equal(h.node('localRecordStatus').dataset.saveState,'error');
 h.ui.update({phase:'ready',loaded:true,dirty:false,hasSavedWorkspace:true,updatedAt:'2026-10-28T10:00:00Z'});assert.match(h.node('localRecordStatus').innerHTML,/Saved on this computer/);
 await h.ui.refreshLists();assert.match(h.node('localPatientArchive').innerHTML,/SYNTHETIC-UI/);await h.patient().emit('click');
 // The click wrapper intentionally starts async loading without awaiting it.
 for(let i=0;i<20&&!h.calls.some(c=>Array.isArray(c)&&c[0]==='open');i++)await Promise.resolve();
 assert.deepEqual(h.calls.find(c=>Array.isArray(c)&&c[0]==='open'),['open','SYNTHETIC-UI',1]);
});
test('backup restore requires an explicit selected file and confirmation, while conflict recovery opens the review section',async t=>{
 const h=fixture(t);h.ui.update({phase:'ready',loaded:true,dirty:false});await h.ui.refreshLists();
 await h.node('localRestoreBackup').emit('click');assert.ok(!h.calls.some(c=>Array.isArray(c)&&c[0]==='restore'));
 h.node('localBackupSelect').value='manual-synthetic.sqlite';h.node('localRestoreConfirmed').checked=true;await h.node('localRestoreBackup').emit('click');
 assert.deepEqual(h.calls.find(c=>Array.isArray(c)&&c[0]==='restore'),['restore','manual-synthetic.sqlite']);
 h.ui.update({phase:'conflict',loaded:true,dirty:true,conflict:true});await h.node('localReloadSaved').emit('click');
 assert.ok(h.calls.includes('recovery'));assert.ok(h.calls.some(c=>Array.isArray(c)&&c[0]==='navigate'&&c[1]==='research'));
 const before=h.calls.filter(c=>Array.isArray(c)&&c[0]==='reload').length;await h.node('localDiscardAndReopen').emit('click');assert.equal(h.calls.filter(c=>Array.isArray(c)&&c[0]==='reload').length,before);
 h.node('localReopenConfirmed').checked=true;await h.node('localDiscardAndReopen').emit('click');assert.equal(h.calls.filter(c=>Array.isArray(c)&&c[0]==='reload').length,before+1);
});
test('archive open reenables Save now after a save-status update arrives while opening the patient',async t=>{
 const h=fixture(t),pending=deferred();let opening=false;
 const saved={phase:'ready',loaded:true,dirty:false,hasSavedWorkspace:true,updatedAt:'2026-10-28T10:00:00Z'};
 h.ui.update(saved);await h.ui.refreshLists();
 h.setOpen(async()=>{opening=true;h.ui.update({...saved,saving:true});await pending.promise;h.ui.update(saved);});
 await h.patient().emit('click');await settle(()=>opening);
 assert.equal(h.node('localSaveNow').disabled,true,'A status render during archive open marks the action busy');
 pending.resolve();await settle(()=>h.node('localArchiveNotice').innerHTML===''&&h.node('localPatientArchive').innerHTML.includes('Patient opened; review confirmations before use.'));
 assert.equal(h.node('localSaveNow').disabled,false,'Finishing archive open must also refresh the status-bar action');
});
test('refreshing archive lists clears a busy status-bar render on success and a rejected list request',async t=>{
 const h=fixture(t),pending=deferred(),saved={phase:'ready',loaded:true,dirty:false,hasSavedWorkspace:true};
 h.ui.update(saved);
 h.store.listPatients=async()=>{h.ui.update(saved);return pending.promise;};
 const refresh=h.ui.refreshLists();assert.equal(h.node('localSaveNow').disabled,true);
 pending.resolve({ok:true,patients:[]});await refresh;assert.equal(h.node('localSaveNow').disabled,false);
 h.store.listPatients=async()=>{h.ui.update(saved);throw Error('synthetic request failure');};
 await assert.rejects(h.ui.refreshLists(),/synthetic request failure/);
 assert.equal(h.node('localSaveNow').disabled,false,'The finally transition must clear the action even if a request throws');
});
test('a draft-only patient shows an empty working-list range instead of an inverted range',async t=>{
 const h=fixture(t);h.ui.update({phase:'ready',loaded:true,dirty:false});await h.ui.refreshLists();
 h.store.loadPatient=async(code,offset,limit)=>({ok:true,records:[],total:0,offset,limit,hasMore:false,draftCount:1,drafts:[]});
 await h.patient().emit('click');await settle(()=>h.node('localPatientArchive').innerHTML.includes('Patient opened; review confirmations before use.'));
 assert.match(h.node('localPatientArchive').innerHTML,/Working list: 0 \/ 0 saved assessments/);
 assert.doesNotMatch(h.node('localPatientArchive').innerHTML,/Working list: 1–0/);
});
