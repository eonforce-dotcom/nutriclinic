import test from 'node:test';
import assert from 'node:assert/strict';
import { reportAppendixMarkup } from '../dist/print-report.mjs';

const B = (en, tr) => ({en, tr});
function fixture() {
  return {
    language: 'en', input: {studyId:'SYNTHETIC-PRINT', visitDate:'2026-10-28', labDate:'2026-10-27', uunDate:'2026-10-28', demo:true},
    uiVersion:'test-ui', engineVersion:'test-core', engineSha256:'engine-hash-001', assessmentSha256:'assessment-hash-002', evidenceSha256:'catalog-hash-003', evidenceCutoff:'2026-10-26',
    clinicalInput: {gripStrength:0, crpULN:5, sofaPlatelets:150, sofaFiO2:0.21, ureaValue:31, ureaUnit:'mg/dL', functionSource:'Original assessment sheet', functionDate:'2026-10-27', functionConfirmed:false, conditions:['stroke'], invalidFields:['sofaGcs']},
    clinicalOutputs: {
      malnutrition:[{id:'nrs2002', title:B('Provided nutritional risk','Sağlanan beslenme riski'), status:'incomplete', summary:B('Provided summary; not recomputed.','Sağlanan özet; yeniden hesaplanmadı.'), values:{score:null}, sourceIds:['source-clinical']}],
      fn:[], markers:[{id:'sofa2', title:B('Provided SOFA-2','Sağlanan SOFA-2'), status:'review', summary:B('Already evaluated organ score','Önceden hesaplanmış organ puanı'), values:{score:7, components:{brain:null, respiratory:0}}, sourceIds:['source-score']}],
      ctx:{blockers:[B('Provided context blocker','Sağlanan bağlam engeli')], nitrogenBlockers:[B('Provided renal restriction','Sağlanan böbrek sınırlaması')], notes:[]},
    },
    delivery:{version:'followup-test', measures:{episodeId:'E1', periodStart:'2026-10-27T08:00+03:00', periodEnd:'2026-10-28T08:00+03:00', actualEnergy:0, actualProtein:null, targetVersion:'P1', source:'Chart v2', targetsStable:false, confirmed:false, invalidFields:['actualProtein']}, output:{valid:false, errors:[{code:'missing-protein', ...B('Protein is missing','Protein eksik')}], notes:[], sourceIds:['source-delivery']}},
    followupComparison:{version:'followup-test', selection:{studyId:'SYNTHETIC-PRINT', episodeId:'E1', context:'icu', phase:'late', targetVersion:'P1', selectedIds:['R1','R2']}, summary:{days:1, missingDays:null, totalEnergy:0, totalProtein:0, energyPercent:0, proteinPercent:0}, rows:[{recordId:'R1', period:{start:'2026-10-26T08:00+03:00', end:'2026-10-27T08:00+03:00', basis:'instant'}, actual:{energy:0,protein:0}, targets:{energy:1600,protein:80}, difference:{energy:-1600,protein:-80}, nitrogen:null, sourceIds:['source-delivery']}], excluded:[{recordId:'R2', reasons:[{code:'overlap', ...B('Overlapping revision','Örtüşen revizyon')},{code:'unconfirmed', ...B('Not verified','Doğrulanmadı')}]}], notes:[B('Gaps are not zero','Boşluklar sıfır değildir')]},
    coreRuleProvenance:{rules:[{id:'nlr', mappingStatus:'formula-unmapped', sourceReferences:[], implementationPolicies:['local-positive-denominator']},{id:'pni', mappingStatus:'formula-units-checked-abstract-only', sourceReferences:[{sourceId:'source-core',role:'original-abstract-formula-units'}], implementationPolicies:['local-canonical-units']}]},
    decisionReviews:[{topicId:'icu-protein',choiceId:'defer',rationale:'Reassess against the local protocol.',reviewedAt:'2026-10-27T12:00:00Z',confirmed:true,currentAtSave:false,sourceIds:['source-decision']}],
    sources:['source-clinical','source-score','source-delivery','source-core','source-decision'].map(id=>({id,title:B(`Canonical ${id}`,`Kanonik ${id}`),access:B('Abstract only','Yalnız özet'),url:`https://example.org/${id}`})),
  };
}
const cell = (html, label) => {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return html.match(new RegExp(`<th scope="row">${escaped}</th><td>(.*?)</td>`))?.[1];
};
function freeze(value) {
  if (value && typeof value === 'object') { Object.freeze(value); Object.values(value).forEach(freeze); }
  return value;
}

test('appendix preserves supplied clinical values, dates, units, restrictions and source identities without calculation', () => {
  const data = fixture(), before = structuredClone(data);
  freeze(data);
  const html = reportAppendixMarkup(data);
  assert.equal(cell(html, 'functionDate'), '2026-10-27');
  assert.equal(cell(html, 'gripStrength [kg]'), '0');
  assert.equal(cell(html, 'ureaValue [mg/dL]'), '31');
  assert.equal(cell(html, 'sofaFiO2 [fraction]'), '0.21');
  assert.equal(cell(html, 'sofaPlatelets [10³/µL]'), '150');
  assert.equal(cell(html, 'functionConfirmed'), 'Not confirmed');
  assert.match(html, /Provided summary; not recomputed\./);
  assert.match(html, /Provided context blocker/);
  assert.match(html, /Provided renal restriction/);
  for (const id of ['source-clinical','source-score','source-delivery','source-core','source-decision']) {
    assert.match(html, new RegExp(`Canonical ${id}`));
  }
  for (const hash of ['engine-hash-001','assessment-hash-002','catalog-hash-003']) assert.ok(html.includes(hash));
  assert.match(html, /No dedicated source mapped/);
  assert.match(html, /local-positive-denominator/);
  assert.ok(!html.includes('<details'), 'source metadata is printable independently of collapsed UI details');
  assert.deepEqual(data, before);
});

test('zero, missing, invalid and unconfirmed remain distinct in actual intake and follow-up', () => {
  const html = reportAppendixMarkup(fixture());
  assert.equal(cell(html, 'actualEnergy [kcal/24h]'), '0');
  assert.equal(cell(html, 'actualProtein [g/24h]'), 'Missing / not assessed');
  assert.equal(cell(html, 'targetsStable'), 'Not confirmed');
  assert.equal(cell(html, 'missingDays [24h slots]'), 'Missing / not assessed');
  assert.equal(cell(html, 'Estimated nitrogen balance [g N/24h]'), 'Missing / not assessed');
  assert.equal(cell(html, 'Signed differences · kcal / g protein'), '-1600 / -80');
  assert.match(html, /2026-10-26T08:00\+03:00/);
  assert.match(html, /2026-10-27T08:00\+03:00/);
  assert.match(html, /Protein is missing/);
  assert.match(html, /Overlapping revision/);
  assert.match(html, /Not verified/);
  assert.match(html, /actualProtein/);
  assert.match(html, /sofaGcs/);
  assert.match(html, /Reassessment required/);
  assert.ok(!html.includes('Current inputs reviewed'), 'saved confirmed:true alone does not imply current review');
  const empty = reportAppendixMarkup();
  assert.match(empty, /No included observation supplied/);
  assert.match(empty, /Core source map not supplied/);
  assert.equal(cell(empty, 'engineSha256'), 'Missing / not assessed');
});

test('all supplied text is escaped and source URLs cannot inject unsafe links or authority', () => {
  const data = fixture(), injection = '<script>alert("x")</script>';
  data.input.studyId = injection;
  data.clinicalInput.contextNote = '<img src=x onerror=alert(1)>';
  data.delivery.measures.source = 'Chart </td><iframe src=x>';
  data.decisionReviews[0].rationale = injection;
  data.coreRuleProvenance.rules[0].implementationPolicies = ['<svg onload=x>'];
  data.sources[0].title = injection;
  data.sources[0].access = '<b>Full access claimed</b>';
  data.sources[0].url = 'https://example.org/paper?x=1&y=2';
  data.labReferences = {profileSnapshot:{source:'<a href="javascript:x">bad</a>',rows:{crp:{enabled:true,lower:null,upper:2,unit:'mg/L'}}},results:[{analyte:'crp',value:1,lower:null,upper:2,unit:'mg/L',status:'within',reason:null}],applicabilityConfirmed:false};
  const html = reportAppendixMarkup(data);
  assert.match(html, /&lt;script&gt;alert\(&quot;x&quot;\)&lt;\/script&gt;/);
  assert.match(html, /&lt;img src=x onerror=alert\(1\)&gt;/);
  assert.match(html, /&lt;svg onload=x&gt;/);
  assert.match(html, /href="https:\/\/example.org\/paper\?x=1&amp;y=2"/);
  assert.match(html, /&lt;a href=&quot;javascript:x&quot;&gt;bad&lt;\/a&gt;/);
  assert.ok(!/<script|<img|<iframe|<svg|href="javascript:/i.test(html));
  for (const url of ['javascript:alert(1)','data:text/html,bad','http://example.org/','/relative','https://user:password@example.org/']) {
    data.sources = [{id:'source-clinical',title:'Source with unsafe URL',access:'Abstract only',url}];
    const unsafe = reportAppendixMarkup(data);
    assert.ok(!unsafe.includes('<a '), url);
    assert.match(unsafe, /Safe HTTPS link not supplied/);
    assert.match(unsafe, /Unavailable in supplied canonical catalog/);
  }
});

test('English and Turkish render from an explicit selected locale while user text/ISO values stay unchanged', () => {
  const data = fixture();
  data.clinicalInput.contextNote = 'Özgün klinisyen gerekçesi: ş, ğ, ı, İ.';
  data.sources[0].access = 'Özet';
  data.translateValue = (value, language) => value === 'Özet' && language === 'en' ? 'Original abstract' : value;
  const en = reportAppendixMarkup(data), tr = reportAppendixMarkup({...data,language:'tr'});
  assert.match(en, /lang="en"/); assert.match(tr, /lang="tr"/);
  assert.match(en, /Clinical inputs, dates and confirmations/);
  assert.match(tr, /Klinik girdiler, tarihler ve doğrulamalar/);
  assert.match(en, /Original abstract/); assert.match(tr, /Özet/);
  assert.match(tr, /Sağlanan böbrek sınırlaması/);
  assert.match(tr, /Protein eksik/);
  assert.match(tr, /Örtüşen revizyon/);
  assert.match(tr, /Yeniden değerlendirme gerekli/);
  assert.match(tr, /Kanonik source-clinical/);
  for (const html of [en,tr]) {
    assert.ok(html.includes('Özgün klinisyen gerekçesi: ş, ğ, ı, İ.'));
    assert.ok(html.includes('2026-10-27T08:00+03:00'));
  }
  assert.equal(reportAppendixMarkup({...data,language:'unknown'}), en);
});

test('latest dated decision is selected by instant, not array order, and missing currentness is not inferred', () => {
  const data = fixture();
  data.decisionReviews = [
    {topicId:'icu-protein',choiceId:'defer',rationale:'Latest by UTC instant',reviewedAt:'2026-10-28T08:00:00Z',confirmed:true},
    {topicId:'icu-protein',choiceId:'specialist',rationale:'Older despite later written hour',reviewedAt:'2026-10-28T09:00:00+03:00',currentAtSave:false},
    {topicId:'unresolved-topic',choiceId:'unknown-choice',rationale:'Undated record retained',reviewedAt:'not a timestamp'},
  ];
  const html = reportAppendixMarkup(data);
  assert.equal((html.match(/Most recent dated record/g)||[]).length, 1);
  const latestStart = html.indexOf('Most recent dated record');
  assert.ok(html.indexOf('Latest by UTC instant',latestStart) < html.indexOf('Older despite later written hour',latestStart));
  assert.match(html, /Currentness not supplied/);
  assert.match(html, /Undated record retained/);
  assert.match(html, /unresolved-topic/);
});

test('rendering requires no browser global storage and cannot leak a previous assessment into a later call', () => {
  const keys = ['localStorage','sessionStorage','document','window'], descriptors = new Map(keys.map(key=>[key,Object.getOwnPropertyDescriptor(globalThis,key)]));
  try {
    for (const key of keys) Object.defineProperty(globalThis,key,{configurable:true,get(){throw Error(`Unexpected ${key} access`);}});
    const first = fixture(); first.input.studyId = 'PRIVATE-FIRST-ONLY';
    assert.ok(reportAppendixMarkup(first).includes('PRIVATE-FIRST-ONLY'));
    const second = reportAppendixMarkup({input:{studyId:'SECOND'}});
    assert.ok(!second.includes('PRIVATE-FIRST-ONLY'));
    assert.ok(!second.includes('Original assessment sheet'));
  } finally {
    for (const key of keys) { const descriptor = descriptors.get(key); if (descriptor) Object.defineProperty(globalThis,key,descriptor); else delete globalThis[key]; }
  }
});

test('clinic profile prints entered and canonical units, zero/missing bounds, source/date applicability and supplied status without inference', () => {
  const data = fixture();
  data.labReferences = {
    schemaVersion:'clinic-lab-references-0.1.0', applicabilityConfirmed:false, clinicalValidation:false,
    profileSnapshot:{clinicName:'SYNTHETIC LAB',source:'Assay insert <revision 3>',version:'LAB-3',effectiveFrom:'2026-10-01',effectiveTo:'',ageMin:18,ageMax:90,sex:'male',rows:{
      albumin:{enabled:true,lower:3.5,upper:5,unit:'g/dL'},
      crp:{enabled:true,lower:0,upper:5,unit:'mg/L'},
      uun:{enabled:true,lower:null,upper:20,unit:'g/24h'},
      phosphate:{enabled:false,lower:0.8,upper:1.5,unit:'mmol/L'},
    }},
    results:[
      {analyte:'albumin',value:31,unit:'g/L',lower:35,upper:50,status:'below',reason:null},
      {analyte:'crp',value:0,unit:'mg/L',lower:0,upper:5,status:'not-applicable',reason:'applicability-unconfirmed'},
      {analyte:'uun',value:null,unit:'g/24h',lower:null,upper:20,status:'unavailable',reason:'collection-unconfirmed'},
    ],
  };
  const before = structuredClone(data); freeze(data);
  const en = reportAppendixMarkup(data), tr = reportAppendixMarkup({...data,language:'tr'});
  assert.equal(cell(en,'Hospital / laboratory'),'SYNTHETIC LAB');
  assert.equal(cell(en,'Assay / source document'),'Assay insert &lt;revision 3&gt;');
  assert.equal(cell(en,'Profile version'),'LAB-3');
  assert.equal(cell(en,'Valid from'),'2026-10-01');
  assert.equal(cell(en,'Recorded-sex applicability'),'Male');
  assert.equal(cell(en,'Patient applicability confirmation'),'Not confirmed');
  assert.equal(cell(tr,'Hastaya uygunluk onayı'),'Doğrulanmadı');
  assert.match(en,/3\.5 – 5 g\/dL/); assert.match(en,/35 – 50 g\/L/); assert.match(en,/31 g\/L/);
  assert.match(en,/0 – 5 mg\/L/); assert.match(en,/Missing \/ not assessed – 20 g\/24h/);
  assert.match(en,/Below entered interval/); assert.match(tr,/Girilen aralığın altında/);
  assert.match(en,/Patient applicability not confirmed \[applicability-unconfirmed\]/);
  assert.match(tr,/Tam idrar toplaması doğrulanmadı \[collection-unconfirmed\]/);
  assert.ok(!en.includes('Within entered bounds'),'the renderer must not override a supplied not-applicable status because value zero is within bounds');
  assert.ok(!en.includes('0.8 – 1.5'),'disabled interval omitted from patient comparison');
  assert.ok(!en.includes('&quot;rows&quot;'),'no raw profile JSON blob');
  assert.ok(!en.includes('&quot;profileSnapshot&quot;'),'no raw snapshot JSON blob');
  assert.deepEqual(data,before);
});

test('enabled intervals without supplied comparison cannot gain an inferred normal classification or confirmation', () => {
  const data = fixture();
  data.labReferences = {profileSnapshot:{clinicName:'Local source',rows:{albumin:{enabled:true,lower:35,upper:50,unit:'g/L'}}},results:[],clinicalValidation:true};
  const html = reportAppendixMarkup(data);
  assert.equal(cell(html,'Supplied comparison status'),'Missing / not assessed');
  assert.equal(cell(html,'Patient applicability confirmation'),'Missing / not assessed');
  assert.match(html,/does not establish muscle anabolism or an optimal dose/);
  assert.ok(!html.includes('Within entered bounds'));
  const absent = reportAppendixMarkup({...data,labReferences:null});
  assert.match(absent,/No enabled laboratory interval supplied/);
  assert.ok(!absent.includes('Local source'));
});
