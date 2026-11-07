import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { verifySearchSnapshot } from '../research/verify-search-snapshot.mjs';

const runProcess = promisify(execFile);
const verifier = fileURLToPath(new URL('../research/verify-search-snapshot.mjs', import.meta.url));
const frozen = fileURLToPath(new URL('../research/snapshot-20261025/', import.meta.url));
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const json = value => JSON.stringify(value, null, 2) + '\n';
const clock = { startedAt: '2026-10-25T06:00:00.000Z', completedAt: '2026-10-25T06:00:01.000Z' };
const warning = { phrasesignored: [], outputmessages: ['A retained NLM warning.'] };

function url(endpoint, params) {
  const value = new URL(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/${endpoint}.fcgi`);
  for (const [key, text] of Object.entries({ db: 'pubmed', retmode: 'json', ...params })) value.searchParams.set(key, text);
  return value.href;
}
function fixtureData() {
  const queries = [{ id: 'icu-protein', query: 'protein[tiab] AND 2026[dp]' }, { id: 'ward-aa-amendment', query: 'leucine[tiab] AND 2026[dp]' }];
  const raw = {}, runs = [];
  for (const [index, ids] of [['101', '202'], ['202', '303']].entries()) {
    const query = queries[index], rawFile = `search-${index + 1}.json`;
    raw[rawFile] = { header: { type: 'esearch' }, esearchresult: { count: '2', retmax: '2', retstart: '0', idlist: ids,
      querytranslation: `translated ${query.query}`, ...(index === 0 ? { warninglist: warning } : {}) } };
    runs.push({ ...clock, queryId: query.id, requestUrl: url('esearch', { term: query.query, retmax: '10000', retstart: '0' }),
      httpStatus: 200, rawFile, rawSha256: sha256(json(raw[rawFile])), count: 2, retrieved: 2, complete: true,
      queryTranslation: `translated ${query.query}`, warnings: index === 0 ? warning : null, errors: null, pmids: ids });
  }
  const candidates = [
    { pmid: '101', queryIds: ['icu-protein'], title: 'Updated book chapter.', source: '', journal: '', pubdate: '1993', epubdate: '', sortpubdate: '2026/09/22 00:00',
      publicationTypes: ['Review'], identifiers: [{ idtype: 'pubmed', idtypen: 1, value: '101' }, { idtype: 'doi', idtypen: 3, value: '10.1000/shared' }],
      recordStatus: 'PubMed', doi: ['10.1000/shared'], screeningStatus: 'pending', extractionStatus: 'pending', familyStatus: 'unresolved' },
    { pmid: '202', queryIds: ['icu-protein', 'ward-aa-amendment'], title: 'Protein trial report.', source: 'Test J', journal: 'Test Journal', pubdate: '2026 Mar', epubdate: '2023 May 24', sortpubdate: '2026/03/01 00:00',
      publicationTypes: ['Journal Article', 'Randomized Controlled Trial'], identifiers: [{ idtype: 'pubmed', idtypen: 1, value: '202' }, { idtype: 'doi', idtypen: 3, value: '10.1000/shared' }],
      recordStatus: 'PubMed - indexed for MEDLINE', doi: ['10.1000/shared'], screeningStatus: 'pending', extractionStatus: 'pending', familyStatus: 'unresolved' },
    { pmid: '303', queryIds: ['ward-aa-amendment'], title: 'Amino acid cohort.', source: 'Other J', journal: 'Other Journal', pubdate: '2026 Oct', epubdate: '', sortpubdate: '2026/10/01 00:00',
      publicationTypes: ['Journal Article'], identifiers: [{ idtype: 'pubmed', idtypen: 1, value: '303' }],
      recordStatus: 'PubMed', doi: [], screeningStatus: 'pending', extractionStatus: 'pending', familyStatus: 'unresolved' },
  ];
  const metadataRuns = [];
  for (const [index, batch] of [candidates.slice(0, 2), candidates.slice(2)].entries()) {
    const rawFile = `summary-${index + 1}.json`, ids = batch.map(candidate => candidate.pmid);
    const result = { uids: ids };
    for (const c of batch) result[c.pmid] = { uid: c.pmid, title: c.title, source: c.source, fulljournalname: c.journal,
      pubdate: c.pubdate, epubdate: c.epubdate, sortpubdate: c.sortpubdate, pubtype: c.publicationTypes,
      articleids: c.identifiers, recordstatus: c.recordStatus };
    raw[rawFile] = { header: { type: 'esummary' }, result };
    metadataRuns.push({ ...clock, requestUrl: url('esummary', { id: ids.join(',') }), rawFile,
      rawSha256: sha256(json(raw[rawFile])), requested: ids, returned: ids });
  }
  return { plan: { schemaVersion: 'nutriklinik-focused-search-plan-v1', version: '0.1.0', cutoff: '2026-10-25',
    scope: 'Focused metadata discovery only', databasesExecuted: ['PubMed'], queries }, runs, metadataRuns,
    inventory: { scope: 'Unscreened public metadata', candidates }, raw };
}
async function withFixture(t, change) {
  const directory = await mkdtemp(join(tmpdir(), 'nutriklinik-search-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  // Separate JSON files do not share arrays in memory. Keep mutation fixtures
  // independent too, so changing raw uids cannot also alter requested IDs.
  const data = JSON.parse(JSON.stringify(fixtureData()));
  if (change) await change(data);
  for (const [name, value] of Object.entries({ 'queries.json': data.plan, 'runs.json': data.runs,
    'metadata-runs.json': data.metadataRuns, 'candidates-metadata.json': data.inventory, ...data.raw })) {
    await writeFile(join(directory, name), typeof value === 'string' ? value : json(value));
  }
  return { directory, data };
}
const rehash = (data, row) => { row.rawSha256 = sha256(typeof data.raw[row.rawFile] === 'string' ? data.raw[row.rawFile] : json(data.raw[row.rawFile])); };

test('valid retrieval computes unique PMID and per-query counts, preserving old dates, DOI conflicts and pending claims', async t => {
  const { directory } = await withFixture(t);
  const report = await verifySearchSnapshot(directory);
  assert.equal(report.verified, true); assert.equal(report.queryCount, 2);
  assert.equal(report.queryMembershipCount, 4); assert.equal(report.uniqueCandidateCount, 3);
  assert.equal(report.metadataBatchCount, 2); assert.equal(report.metadataRecordCount, 3);
  assert.equal(report.rawFileCount, 4); assert.equal(report.retrievalComplete, true);
  assert.deepEqual(report.perQuery.map(row => row.count), [2, 2]);
  assert.deepEqual(report.perQuery[0].warnings, warning); assert.equal(report.perQuery[1].warnings, null);
  assert.equal(report.screeningStatus, 'pending'); assert.equal(report.extractionStatus, 'pending');
  assert.equal(report.familyStatus, 'unresolved'); assert.equal(report.trialCount, null);
  for (const key of ['eligibilityEvaluated', 'fullTextAccessEvaluated', 'qualityEvaluated', 'systematicReviewClaim', 'clinicalEffectsEvaluated']) assert.equal(report[key], false);
  assert.equal(report.clinicalRuleChangeClaim, null);
  // Successful verification is read-only; equal DOIs never collapse these PMIDs.
  const before = await readFile(join(directory, 'candidates-metadata.json'));
  await verifySearchSnapshot(directory);
  assert.deepEqual(await readFile(join(directory, 'candidates-metadata.json')), before);
});

test('published raw snapshot verifies against independently reconstructed membership and metadata denominators', async () => {
  const report = await verifySearchSnapshot(frozen);
  const plan = JSON.parse(await readFile(join(frozen, 'queries.json')));
  const runs = JSON.parse(await readFile(join(frozen, 'runs.json')));
  const batches = JSON.parse(await readFile(join(frozen, 'metadata-runs.json')));
  const candidates = JSON.parse(await readFile(join(frozen, 'candidates-metadata.json'))).candidates;
  const union = new Set(runs.flatMap(run => run.pmids));
  assert.equal(report.queryCount, plan.queries.length);
  assert.equal(report.queryMembershipCount, runs.reduce((sum, run) => sum + run.pmids.length, 0));
  assert.equal(report.uniqueCandidateCount, union.size); assert.equal(report.uniqueCandidateCount, candidates.length);
  assert.equal(report.metadataBatchCount, batches.length);
  assert.equal(report.metadataRecordCount, batches.reduce((sum, run) => sum + run.returned.length, 0));
  assert.ok(candidates.every(row => row.screeningStatus === 'pending' && row.extractionStatus === 'pending' && row.familyStatus === 'unresolved'));
});

test('a byte-only change and an altered expected SHA256 both fail before accepting parsed content', async t => {
  for (const kind of ['raw', 'hash']) await t.test(kind, async t => {
    const { directory } = await withFixture(t, data => {
      if (kind === 'raw') data.raw['search-1.json'] = json(data.raw['search-1.json']) + ' ';
      else data.runs[0].rawSha256 = '0'.repeat(64);
    });
    await assert.rejects(verifySearchSnapshot(directory), /raw SHA256 mismatch/);
  });
});

test('omitting either raw-hash field never downgrades verification to an unhashed file read', async t => {
  for (const group of ['runs', 'metadataRuns']) await t.test(group, async t => {
    const { directory } = await withFixture(t, data => { delete data[group][0].rawSha256; });
    await assert.rejects(verifySearchSnapshot(directory), /SHA256 must be/);
  });
});

test('matching a reduced ID list and its new hash cannot disguise truncation against the reported count', async t => {
  const { directory } = await withFixture(t, data => {
    data.raw['search-1.json'].esearchresult.idlist.pop();
    data.raw['search-1.json'].esearchresult.retmax = '1';
    data.runs[0].pmids = ['101']; data.runs[0].retrieved = 1; rehash(data, data.runs[0]);
  });
  await assert.rejects(verifySearchSnapshot(directory), /retrieval is incomplete/);
});

test('partial flags, altered translations, lost warnings and omitted error fields refuse a complete snapshot', async t => {
  for (const [name, mutate, expected] of [
    ['complete flag', data => { data.runs[0].complete = false; }, /retrieval is incomplete/],
    ['translation', data => { data.runs[0].queryTranslation = 'another query'; }, /query translation/],
    ['warning', data => { data.runs[0].warnings = null; }, /warnings were lost/],
    ['error field', data => { delete data.runs[0].errors; }, /explicit warnings and errors/],
  ]) await t.test(name, async t => {
    const { directory } = await withFixture(t, mutate); await assert.rejects(verifySearchSnapshot(directory), expected);
  });
});

test('raw errors are neither silently discarded nor accepted as successful complete retrieval', async t => {
  for (const retained of [false, true]) await t.test(`error retained: ${retained}`, async t => {
    const { directory } = await withFixture(t, data => {
      data.raw['search-1.json'].esearchresult.errorlist = { phrasesnotfound: ['required phrase'] };
      if (retained) data.runs[0].errors = { phrasesnotfound: ['required phrase'] };
      rehash(data, data.runs[0]);
    });
    await assert.rejects(verifySearchSnapshot(directory), retained ? /contains an error/ : /error presence was lost/);
  });
});

test('duplicate and missing queries, PMIDs or candidate membership are detected independently of totals', async t => {
  for (const [name, mutate, expected] of [
    ['missing query run', data => { data.runs.pop(); }, /query IDs/],
    ['duplicate query plan', data => { data.plan.queries.push(data.plan.queries[0]); }, /duplicate query ID/],
    ['duplicate raw PMID', data => { data.raw['search-1.json'].esearchresult.idlist = ['101', '101']; rehash(data, data.runs[0]); }, /duplicate IDs/],
    ['missing candidate', data => { data.inventory.candidates.pop(); }, /candidate PMID union/],
    ['duplicate candidate', data => { data.inventory.candidates[2] = data.inventory.candidates[0]; }, /duplicate IDs/],
    ['lost membership', data => { data.inventory.candidates[1].queryIds = ['icu-protein']; }, /queryIds/],
    ['invented membership', data => { data.inventory.candidates[0].queryIds = ['ward-aa-amendment']; }, /queryIds/],
  ]) await t.test(name, async t => {
    const { directory } = await withFixture(t, mutate); await assert.rejects(verifySearchSnapshot(directory), expected);
  });
});

test('all exported candidate metadata remains traceable to original ESummary, including dates, DOI and publication types', async t => {
  for (const [key, value] of Object.entries({ title: 'Changed title', journal: 'Invented journal', source: 'Invented source',
    pubdate: '2026', epubdate: '2026 Jan 1', sortpubdate: '2026/01/01 00:00', publicationTypes: ['Randomized Controlled Trial'],
    identifiers: [], recordStatus: 'MEDLINE', doi: ['10.1000/invented'] })) await t.test(key, async t => {
    const { directory } = await withFixture(t, data => { data.inventory.candidates[0][key] = value; });
    await assert.rejects(verifySearchSnapshot(directory), new RegExp(key));
  });
});

test('ESummary cannot omit or add an ID, silently repeat a batch, or disagree on record identity', async t => {
  for (const [name, mutate, expected] of [
    ['missing uid', data => { data.raw['summary-1.json'].result.uids.pop(); data.metadataRuns[0].returned = ['101']; rehash(data, data.metadataRuns[0]); }, /missing or unexpected IDs/],
    ['missing record', data => { delete data.raw['summary-1.json'].result['202']; rehash(data, data.metadataRuns[0]); }, /record keys/],
    ['unrequested record', data => { data.raw['summary-1.json'].result['999'] = data.raw['summary-1.json'].result['101']; rehash(data, data.metadataRuns[0]); }, /record keys/],
    ['duplicate batch', data => { const batch = structuredClone(data.metadataRuns[0]); batch.rawFile = 'summary-copy.json'; data.raw[batch.rawFile] = structuredClone(data.raw['summary-1.json']); data.metadataRuns.push(batch); }, /duplicate PMID/],
    ['uid mismatch', data => { data.raw['summary-1.json'].result['101'].uid = '999'; rehash(data, data.metadataRuns[0]); }, /record uid/],
    ['pubmed ID mismatch', data => { data.raw['summary-1.json'].result['101'].articleids[0].value = '999'; rehash(data, data.metadataRuns[0]); }, /PubMed identifier/],
  ]) await t.test(name, async t => {
    const { directory } = await withFixture(t, mutate); await assert.rejects(verifySearchSnapshot(directory), expected);
  });
});

test('literal query, ESummary requested IDs and fixed offline filename boundary cannot be silently changed', async t => {
  for (const [name, mutate, expected] of [
    ['different term', data => { data.runs[0].requestUrl = url('esearch', { term: 'unrelated', retstart: '0', retmax: '10000' }); }, /URL term differs/],
    ['insufficient retmax', data => { data.runs[0].requestUrl = data.runs[0].requestUrl.replace('retmax=10000', 'retmax=1'); }, /retrieval is incomplete/],
    ['different requested IDs', data => { data.metadataRuns[0].requestUrl = url('esummary', { id: '101,999' }); }, /URL IDs differ/],
    ['different endpoint', data => { data.metadataRuns[0].requestUrl = data.metadataRuns[0].requestUrl.replace('eutils.ncbi.nlm.nih.gov', 'example.test'); }, /official HTTPS/],
    ['path traversal', data => { data.runs[0].rawFile = '../private.json'; }, /simple JSON filename/],
  ]) await t.test(name, async t => {
    const { directory } = await withFixture(t, mutate); await assert.rejects(verifySearchSnapshot(directory), expected);
  });
});

test('a repeated JSON object key is refused even when JSON.parse and the raw hash would accept it', async t => {
  const { directory } = await withFixture(t, data => {
    data.raw['summary-1.json'] = json(data.raw['summary-1.json']).replace('"uid": "101",', '"uid": "101", "uid": "101",');
    rehash(data, data.metadataRuns[0]);
  });
  await assert.rejects(verifySearchSnapshot(directory), /duplicate JSON object key "uid"/);
});

test('screening, extraction and trial-family decisions cannot be smuggled into this pending retrieval snapshot', async t => {
  for (const key of ['screeningStatus', 'extractionStatus', 'familyStatus']) await t.test(key, async t => {
    const { directory } = await withFixture(t, data => { data.inventory.candidates[0][key] = 'included'; });
    await assert.rejects(verifySearchSnapshot(directory), new RegExp(key));
  });
});

test('a genuine zero-result search can verify without invented metadata or zero-valued trial claims', async t => {
  const { directory } = await withFixture(t, data => {
    data.plan.queries = data.plan.queries.slice(0, 1); data.runs = data.runs.slice(0, 1);
    Object.assign(data.runs[0], { count: 0, retrieved: 0, pmids: [] });
    Object.assign(data.raw['search-1.json'].esearchresult, { count: '0', retmax: '0', idlist: [] });
    rehash(data, data.runs[0]); data.metadataRuns = []; data.inventory.candidates = [];
  });
  const result = await verifySearchSnapshot(directory);
  assert.equal(result.uniqueCandidateCount, 0); assert.equal(result.metadataRecordCount, 0);
  assert.equal(result.retrievalComplete, true); assert.equal(result.trialCount, null);
});

test('CLI accepts absolute and relative snapshot paths, defaults to the frozen snapshot, and exits nonzero on tampering', async t => {
  const { directory } = await withFixture(t), cwd = dirname(directory);
  for (const argument of [directory, relative(cwd, directory)]) {
    const result = await runProcess(process.execPath, [verifier, argument], { cwd });
    assert.equal(JSON.parse(result.stdout).uniqueCandidateCount, 3); assert.equal(result.stderr, '');
  }
  const defaultResult = await runProcess(process.execPath, [verifier], { cwd });
  assert.equal(JSON.parse(defaultResult.stdout).retrievalComplete, true);
  await writeFile(join(directory, 'search-1.json'), '{}');
  await assert.rejects(runProcess(process.execPath, [verifier, directory], { cwd }), error => {
    assert.equal(error.code, 1); assert.match(error.stderr, /raw SHA256 mismatch/); assert.equal(error.stdout, ''); return true;
  });
});
