import test from 'node:test';
import assert from 'node:assert/strict';
import { createLocalRecordStore } from '../dist/local-record-store.mjs';

const clone = value => structuredClone(value);
const deferred = () => { let resolve, reject; const promise = new Promise((yes,no)=>{resolve=yes;reject=no;}); return {promise,resolve,reject}; };
const draftId = '39b4be89-a91f-4f7c-98d7-cdd2ec4fe1cd';
const workspace = value => ({schema:'nutriklinik-local-workspace-0.1.0',current:{draftId,input:{studyId:'SYNTHETIC-ONLY',albumin:value},clinicalProfile:null,delivery:null,labReferences:null,decisionReview:null,provenance:[]},records:[],importedComparisons:[]});
const response = (value,status=200) => ({ok:status>=200&&status<300,status,json:async()=>clone(value)});
const settle = async predicate => { for(let i=0;i<40&&!predicate();i++)await Promise.resolve(); assert.ok(predicate(),'Expected asynchronous stage was reached'); };
function harness({snapshot=null,revision=0,hook,onStatus,capture,apply}={}) {
  let current=workspace(31),stored=clone(snapshot),rev=revision,updatedAt=snapshot?'2026-10-28T10:00:00.000Z':null,timerId=0;
  const calls=[],statuses=[],applied=[],timers=new Map();
  function normal(url,options) {
    if(url==='api/local/bootstrap')return response({token:'synthetic-test-token-00000000',storage:{mode:'local-sqlite',available:true}});
    if(url==='api/local/workspace'&&options.method==='GET')return response({revision:rev,snapshot:stored,updatedAt});
    if(url==='api/local/workspace'&&options.method==='PUT'){
      const body=JSON.parse(options.body);
      if(body.expectedRevision!==rev)return response({error:'conflict'},409);
      stored=clone(body.snapshot);rev++;updatedAt='2026-10-28T10:00:01.000Z';
      return response({revision:rev,snapshot:stored,updatedAt});
    }
    if(url==='api/local/backup')return response({backup:{file:'manual-synthetic.sqlite',createdAt:'2026-10-28T10:01:00Z',kind:'manual'}});
    if(url==='api/local/backups')return response({backups:[{file:'manual-synthetic.sqlite'}]});
    if(url==='api/local/patients')return response({patients:[{studyId:'SYNTHETIC-ONLY',recordCount:1,draftCount:1,latestDraftId:draftId}]});
    if(url.startsWith('api/local/patient?')){
      const query=new URL(url,'http://127.0.0.1:4188').searchParams;
      return response({records:[{recordId:'synthetic'}],total:300,offset:Number(query.get('offset')),limit:Number(query.get('limit')),hasMore:true,latestDraft:{draftId,current:workspace(38).current},draftCount:1});
    }
    if(url.startsWith('api/local/draft?'))return response({draftId,studyId:'SYNTHETIC-ONLY',updatedAt,current:workspace(38).current});
    if(url==='api/local/restore'){
      const body=JSON.parse(options.body);assert.equal(body.backupFile,'manual-synthetic.sqlite');assert.equal(body.expectedRevision,rev);
      stored=workspace(42);rev++;updatedAt='2026-10-28T10:02:00Z';return response({revision:rev,snapshot:stored,updatedAt,safetyBackup:{file:'safety-synthetic.sqlite'}});
    }
    throw Error('Unexpected local endpoint');
  }
  const store=createLocalRecordStore({capture:capture||(()=>clone(current)),apply:apply||(value=>{applied.push(clone(value));current=clone(value);}),
    onStatus:value=>{statuses.push(clone(value));onStatus?.(value);},requestTimeoutMs:0,
    setTimer:fn=>{const id=++timerId;timers.set(id,fn);return id;},clearTimer:id=>timers.delete(id),
    fetchImpl:async(url,options)=>{calls.push({url,options});return hook?hook(url,options,()=>normal(url,options)):normal(url,options);}});
  return {store,calls,statuses,applied,timers,current:()=>clone(current),set:value=>{current=clone(value);},stored:()=>clone(stored),revision:()=>rev,
    async tick(){const callbacks=[...timers.values()];timers.clear();for(const callback of callbacks)callback();await settle(()=>!store.getState().saving);},
    writes:()=>calls.filter(call=>call.options.method==='PUT')};
}

test('startup restores the saved draft once without writing it back or sending data to another host',async()=>{
  const h=harness({snapshot:workspace(36),revision:7});
  assert.deepEqual(await h.store.start(),{ok:true,revision:7,restored:true});
  assert.equal(h.applied.length,1);assert.equal(h.current().current.input.albumin,36);assert.equal(h.writes().length,0);
  await h.store.start();assert.equal(h.applied.length,1);assert.equal(h.calls.length,2);
  for(const {url,options}of h.calls){assert.ok(url.startsWith('api/local/'));assert.equal(options.redirect,'error');assert.equal(options.credentials,'same-origin');assert.equal(options.cache,'no-store');}
  assert.equal(h.calls[1].options.headers['X-NutriKlinik-Token'],'synthetic-test-token-00000000');
  assert.ok(h.statuses.every(item=>!Object.hasOwn(item,'snapshot')&&!Object.hasOwn(item,'current')));
  h.store.dispose();
});

test('an edit during startup cannot replace a saved remote draft; explicit reload guards unsaved work',async()=>{
  const read=deferred();const h=harness({snapshot:workspace(41),hook:async(url,options,normal)=>url==='api/local/workspace'&&options.method==='GET'&&!read.done?read.promise:normal()});
  const start=h.store.start();await settle(()=>h.calls.length===2);
  h.set(workspace(29));h.store.changed();read.done=true;read.resolve(response({revision:4,snapshot:workspace(41),updatedAt:'2026-10-28T10:00:00Z'}));
  assert.deepEqual(await start,{ok:false,code:'edited-during-load'});assert.equal(h.applied.length,0);assert.equal(h.current().current.input.albumin,29);
  assert.equal((await h.store.flush()).ok,false);assert.equal(h.writes().length,0);
  assert.deepEqual(await h.store.reloadSavedWorkspace(),{ok:false,code:'unsaved-changes'});
  assert.equal((await h.store.reloadSavedWorkspace({discardPending:true})).ok,true);
  assert.equal(h.applied.length,1);assert.equal(h.current().current.input.albumin,41);assert.equal(h.store.getState().dirty,false);
  h.store.dispose();
});

test('startup on an empty database retains user edits and a flush captures synchronously before bootstrap awaits',async()=>{
  const boot=deferred();const h=harness({hook:async(url,options,normal)=>url==='api/local/bootstrap'?boot.promise:normal()});
  h.set(workspace(33));h.store.changed();const save=h.store.flush();
  h.set(workspace(99)); // Deliberately change callback result without a changed event.
  boot.resolve(response({token:'synthetic-test-token-00000000',storage:{available:true}}));
  assert.equal((await save).ok,true);assert.equal(h.applied.length,0);
  assert.equal(h.stored().current.input.albumin,33,'The flush owns the snapshot captured at call time');
  assert.equal(h.store.getState().dirty,false);h.store.dispose();
});

test('edits made before the first read cannot be mistaken for disposable initial defaults',async()=>{
  const h=harness({snapshot:workspace(39),revision:3});h.set(workspace(26));h.store.changed();
  assert.equal((await h.store.flush()).code,'edited-during-load');assert.equal(h.applied.length,0);assert.equal(h.writes().length,0);
  assert.equal(h.current().current.input.albumin,26);assert.equal(h.store.getState().dirty,true);h.store.dispose();
});

test('writes serialize and edits made during a write remain unsaved until their own acknowledgement',async()=>{
  const pending=[];const h=harness({hook:async(url,options,normal)=>{if(options.method==='PUT'){const gate=deferred();pending.push({gate,normal});await gate.promise;}return normal();}});
  await h.store.start();h.set(workspace(30));h.store.changed();const first=h.store.flush();await settle(()=>pending.length===1);
  assert.equal(h.store.getState().dirty,true);assert.equal(h.store.getState().saving,true);
  h.set(workspace(35));h.store.changed();const second=h.store.flush();assert.equal(pending.length,1);
  pending[0].gate.resolve();await settle(()=>pending.length===2);
  assert.equal(h.stored().current.input.albumin,30);assert.equal(h.store.getState().dirty,true);
  assert.equal(JSON.parse(h.writes()[1].options.body).expectedRevision,1);
  assert.equal(JSON.parse(h.writes()[1].options.body).snapshot.current.input.albumin,35);
  pending[1].gate.resolve();assert.equal((await first).ok,true);assert.equal((await second).ok,true);
  assert.equal(h.stored().current.input.albumin,35);assert.equal(h.revision(),2);assert.equal(h.store.getState().dirty,false);
  assert.equal(h.store.getState().saving,false);h.store.dispose();
});

test('debouncing batches edits and explicit flush cancels the pending timer',async()=>{
  const h=harness();await h.store.start();h.set(workspace(32));h.store.changed();h.set(workspace(34));h.store.changed();
  assert.equal(h.timers.size,1);assert.equal(h.writes().length,0);await h.store.flush();
  assert.equal(h.timers.size,0);assert.equal(h.writes().length,1);assert.equal(h.stored().current.input.albumin,34);h.store.dispose();
});

test('network failure does not acknowledge or discard edits and explicit retry can save them',async()=>{
  let fail=true;const h=harness({hook:async(url,options,normal)=>{if(options.method==='PUT'&&fail)throw Error('synthetic disconnect');return normal();}});
  await h.store.start();h.store.changed();assert.deepEqual(await h.store.flush(),{ok:false,code:'storage-unreachable'});
  assert.equal(h.store.getState().dirty,true);assert.equal(h.store.getState().phase,'error');assert.equal(h.stored(),null);
  fail=false;assert.equal((await h.store.flush()).ok,true);assert.equal(h.store.getState().dirty,false);h.store.dispose();
});

test('a revision conflict locks writes without silently reloading or overwriting either draft',async()=>{
  const h=harness({snapshot:workspace(36),revision:2,hook:async(url,options,normal)=>options.method==='PUT'?response({error:'conflict'},409):normal()});
  await h.store.start();h.set(workspace(27));h.store.changed();assert.deepEqual(await h.store.flush(),{ok:false,code:'conflict'});
  assert.equal(h.store.getState().dirty,true);assert.equal(h.store.getState().conflict,true);assert.equal(h.current().current.input.albumin,27);
  h.store.changed();await h.store.flush();assert.equal(h.writes().length,1);assert.equal(h.stored().current.input.albumin,36);
  assert.equal(h.applied.length,1);h.store.dispose();
});

test('malformed bootstrap, workspace and write acknowledgements never become a saved status',async()=>{
  for(const [target,body,code]of [
    ['bootstrap',{token:'short'},'storage-unavailable'],
    ['workspace',{revision:-1,snapshot:workspace(31),updatedAt:null},'invalid-workspace-response'],
    ['workspace',{revision:0,snapshot:{records:[]},updatedAt:null},'invalid-workspace-response'],
  ]){
    const h=harness({hook:async(url,options,normal)=>url==='api/local/'+target?response(body):normal()});
    assert.equal((await h.store.start()).code,code);assert.equal(h.applied.length,0);assert.equal(h.writes().length,0);h.store.dispose();
  }
  const h=harness({hook:async(url,options,normal)=>options.method==='PUT'?response({revision:500,snapshot:workspace(31),updatedAt:'2026-10-28'}):normal()});
  await h.store.start();h.store.changed();assert.equal((await h.store.flush()).code,'save-response-invalid');
  assert.equal(h.store.getState().dirty,true);await h.store.flush();assert.equal(h.writes().length,1);h.store.dispose();
});

test('capture failures and oversize snapshots remain unsaved without a partial request',async()=>{
  const h=harness({capture:()=>{throw Error('synthetic capture error');}});await h.store.start();h.store.changed();
  assert.equal((await h.store.flush()).code,'capture-failed');assert.equal(h.store.getState().dirty,true);assert.equal(h.writes().length,0);h.store.dispose();
  const large=harness();await large.store.start();const value=workspace(31);value.current.input.note='x'.repeat(16*1024*1024);large.set(value);large.store.changed();
  assert.equal((await large.store.flush()).code,'snapshot-too-large');assert.equal(large.writes().length,0);assert.equal(large.store.getState().dirty,true);large.store.dispose();
});

test('keepalive is bounded and never falsely acknowledges a draft over the browser request budget',async()=>{
  const h=harness();await h.store.start();const value=workspace(31);value.current.input.note='x'.repeat(64*1024);h.set(value);h.store.changed();
  assert.equal((await h.store.flush({keepalive:true})).code,'keepalive-too-large');assert.equal(h.writes().length,0);assert.equal(h.store.getState().dirty,true);
  assert.equal((await h.store.flush()).ok,true);assert.equal(h.writes()[0].options.keepalive,false);
  h.set(workspace(32));h.store.changed();assert.equal((await h.store.flush({keepalive:true})).ok,true);assert.equal(h.writes()[1].options.keepalive,true);h.store.dispose();
});

test('backup waits for the durable save and archive/draft lookups stay on fixed local endpoints with pagination',async()=>{
  const h=harness();await h.store.start();h.store.changed();const saved=await h.store.backup();assert.equal(saved.ok,true);
  assert.ok(h.calls.findIndex(c=>c.options.method==='PUT')<h.calls.findIndex(c=>c.url==='api/local/backup'));
  assert.equal((await h.store.listPatients()).patients[0].draftCount,1);
  const page=await h.store.loadPatient('SYNTHETIC / ? https://example.invalid',200,100);assert.equal(page.total,300);assert.equal(page.offset,200);assert.equal(page.hasMore,true);assert.equal(page.latestDraft.draftId,draftId);
  assert.equal((await h.store.loadDraft(draftId)).current.input.albumin,38);
  assert.equal((await h.store.listBackups()).backups[0].file,'manual-synthetic.sqlite');
  const before=h.calls.length;assert.equal((await h.store.loadPatient('x',-1)).ok,false);assert.equal((await h.store.loadDraft('../patient')).ok,false);assert.equal(h.calls.length,before);
  assert.ok(h.calls.every(c=>c.url.startsWith('api/local/')));h.store.dispose();
});

test('backup restore refuses dirty edits, never applies implicitly, and requires an explicit saved-workspace reload',async()=>{
  const h=harness();await h.store.start();h.store.changed();
  assert.deepEqual(await h.store.restoreBackup('manual-synthetic.sqlite'),{ok:false,code:'unsaved-changes'});assert.equal(h.calls.some(c=>c.url==='api/local/restore'),false);
  await h.store.flush();const before=h.current();const restored=await h.store.restoreBackup('manual-synthetic.sqlite');
  assert.equal(restored.ok,true);assert.equal(restored.reloadRequired,true);assert.equal(restored.safetyBackup.file,'safety-synthetic.sqlite');assert.deepEqual(h.current(),before);assert.equal(h.applied.length,0);
  assert.equal((await h.store.flush()).code,'reload-required');assert.equal(h.store.getState().reloadRequired,true);
  assert.equal((await h.store.reloadSavedWorkspace()).ok,true);assert.equal(h.current().current.input.albumin,42);assert.equal(h.store.getState().reloadRequired,false);
  assert.equal((await h.store.restoreBackup('../manual.sqlite')).code,'invalid-backup-file');h.store.dispose();
});

test('disposed requests cannot apply, acknowledge or trigger later writes',async()=>{
  const read=deferred();const h=harness({snapshot:workspace(41),hook:async(url,options,normal)=>url==='api/local/workspace'?read.promise:normal()});
  const start=h.store.start();await settle(()=>h.calls.length===2);h.store.dispose();read.resolve(response({revision:1,snapshot:workspace(41),updatedAt:null}));
  assert.equal((await start).code,'disposed');assert.equal(h.applied.length,0);assert.equal(h.store.getState().phase,'disposed');
  h.store.changed();assert.equal((await h.store.flush()).code,'disposed');assert.equal(h.calls.length,2);assert.equal(h.timers.size,0);
});

test('a failing renderer cannot turn a durable write into loss or expose patient data through status metadata',async()=>{
  const h=harness({onStatus:()=>{throw Error('synthetic display error');}});await h.store.start();h.store.changed();assert.equal((await h.store.flush()).ok,true);
  assert.equal(h.store.getState().dirty,false);assert.ok(h.statuses.every(status=>!JSON.stringify(status).includes('SYNTHETIC-ONLY')));h.store.dispose();
});

test('an application restore failure leaves the saved remote copy intact and locks automatic replacement',async()=>{
  const h=harness({snapshot:workspace(37),apply:()=>{throw Error('synthetic validation failure');}});
  assert.equal((await h.store.start()).code,'restore-failed');h.store.changed();assert.equal((await h.store.flush()).code,'restore-failed');
  assert.equal(h.stored().current.input.albumin,37);assert.equal(h.writes().length,0);h.store.dispose();
});
test('unnamed unfinished drafts remain discoverable through the blank patient code',async()=>{
 const h=harness();await h.store.start();assert.equal((await h.store.loadPatient('')).ok,true);
 const request=h.calls.find(call=>call.url.startsWith('api/local/patient?'));assert.equal(new URL(request.url,'http://127.0.0.1').searchParams.get('studyId'),'');h.store.dispose();
});
test('a rotated local token can recover after server restart without changing the CAS revision',async()=>{
 let restarted=false;
 const h=harness({hook:async(url,options,normal)=>{
  if(url==='api/local/bootstrap'&&restarted)return response({token:'new-synthetic-server-token-123456',storage:{available:true}});
  if(restarted&&options.method==='PUT'&&options.headers['X-NutriKlinik-Token']!=='new-synthetic-server-token-123456')return response({error:'invalid-local-token'},403);
  return normal();
 }});
 await h.store.start();restarted=true;h.store.changed();assert.equal((await h.store.flush()).ok,true);
 const writes=h.writes();assert.equal(writes.length,2);assert.equal(JSON.parse(writes[0].options.body).expectedRevision,0);assert.equal(JSON.parse(writes[1].options.body).expectedRevision,0);
 assert.equal(h.store.getState().dirty,false);h.store.dispose();
});
