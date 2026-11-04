import { readFile, realpath } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';
import { basename, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// This verifies a frozen public-metadata retrieval, not eligibility, trial identity,
// study quality, full-text access, search sensitivity, or a clinical method.
const here = dirname(fileURLToPath(import.meta.url));
const candidateKeys = ['pmid', 'queryIds', 'title', 'source', 'journal', 'pubdate', 'epubdate',
  'sortpubdate', 'publicationTypes', 'identifiers', 'recordStatus', 'doi',
  'screeningStatus', 'extractionStatus', 'familyStatus'];
const fail = (where, message) => { throw new Error(`${where}: ${message}`); };
const requireThat = (value, where, message) => { if (!value) fail(where, message); };
const object = (value, where) => {
  requireThat(value !== null && typeof value === 'object' && !Array.isArray(value), where, 'object required');
  return value;
};
const equal = (actual, expected, where, message = 'does not match stored raw response') =>
  requireThat(isDeepStrictEqual(actual, expected), where, message);
const text = (value, where) => requireThat(typeof value === 'string' && value.trim().length > 0, where, 'nonempty string required');
const integer = (value, where) => {
  requireThat(Number.isSafeInteger(value) && value >= 0, where, 'nonnegative safe integer required');
  return value;
};
const rawInteger = (value, where) => {
  requireThat(typeof value === 'string' && /^(0|[1-9]\d*)$/.test(value), where, 'canonical integer string required');
  return integer(Number(value), where);
};
function ids(value, where, validate = true) {
  requireThat(Array.isArray(value), where, 'array required');
  if (validate) for (const id of value) requireThat(typeof id === 'string' && /^[1-9]\d*$/.test(id), where, 'canonical PMID strings required');
  requireThat(new Set(value).size === value.length, where, 'duplicate IDs');
  return value;
}
function sameSet(actual, expected, where) {
  const a = new Set(actual), b = new Set(expected);
  requireThat(a.size === actual.length && b.size === expected.length, where, 'duplicate IDs');
  requireThat(a.size === b.size && [...a].every(id => b.has(id)), where, 'missing or unexpected IDs');
}
function timestamps(row, where) {
  for (const key of ['startedAt', 'completedAt']) {
    requireThat(typeof row[key] === 'string' && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(row[key]) &&
      Number.isFinite(Date.parse(row[key])) && new Date(row[key]).toISOString() === row[key], `${where}.${key}`, 'valid UTC timestamp required');
  }
  requireThat(Date.parse(row.completedAt) >= Date.parse(row.startedAt), where, 'completion precedes start');
}

// JSON.parse alone would silently accept repeated object keys, including a
// repeated PMID in an ESummary object. Validate syntax first, then walk keys.
function parseJson(bytes, where) {
  const source = bytes.toString('utf8');
  let result;
  try { result = JSON.parse(source); } catch { fail(where, 'invalid JSON'); }
  let offset = 0;
  const space = () => { while (/\s/.test(source[offset] ?? '') && offset < source.length) offset++; };
  const string = () => {
    const start = offset++;
    while (offset < source.length) {
      const char = source[offset++];
      if (char === '\\') offset++;
      else if (char === '"') return JSON.parse(source.slice(start, offset));
    }
  };
  const walk = () => {
    space();
    if (source[offset] === '{') {
      offset++; space(); const keys = new Set();
      if (source[offset] === '}') { offset++; return; }
      while (true) {
        space(); const key = string();
        requireThat(!keys.has(key), where, `duplicate JSON object key ${JSON.stringify(key)}`);
        keys.add(key); space(); offset++; walk(); space();
        if (source[offset++] === '}') return;
      }
    }
    if (source[offset] === '[') {
      offset++; space();
      if (source[offset] === ']') { offset++; return; }
      while (true) { walk(); space(); if (source[offset++] === ']') return; }
    }
    if (source[offset] === '"') { string(); return; }
    while (offset < source.length && !/[\s,\]}]/.test(source[offset])) offset++;
  };
  walk();
  return result;
}

function request(urlText, endpoint, where) {
  let url;
  try { url = new URL(urlText); } catch { fail(where, 'invalid request URL'); }
  requireThat(url.origin === 'https://eutils.ncbi.nlm.nih.gov' && url.pathname === `/entrez/eutils/${endpoint}.fcgi` &&
    !url.username && !url.password && !url.hash, where, 'official HTTPS E-utilities endpoint required');
  requireThat(new Set(url.searchParams.keys()).size === [...url.searchParams.keys()].length, where, 'duplicate URL parameters');
  requireThat(url.searchParams.get('db') === 'pubmed' && url.searchParams.get('retmode') === 'json', where, 'PubMed JSON request required');
  return url.searchParams;
}

function errorValue(raw, result) {
  const found = [];
  for (const [prefix, value] of [['response', raw], ['result', result]]) {
    for (const key of ['error', 'ERROR', 'errorlist']) {
      if (Object.hasOwn(value, key)) found.push([`${prefix}.${key}`, value[key]]);
    }
  }
  return found.length === 0 ? null : found.length === 1 ? found[0][1] : Object.fromEntries(found);
}

/**
 * Verify exact bytes and the complete ESearch -> ESummary -> pending-candidate
 * chain. Does not fetch, modify files, adjudicate a record, or merge by DOI.
 * An absent, partial or internally inconsistent snapshot throws.
 */
export async function verifySearchSnapshot(directory = resolve(here, 'snapshot-20261025')) {
  const base = await realpath(resolve(directory));
  const usedRawFiles = new Set();
  async function load(name, expectedHash, isRaw = false) {
    requireThat(typeof name === 'string' && basename(name) === name && /^[A-Za-z0-9][A-Za-z0-9._-]*\.json$/.test(name), 'rawFile', 'simple JSON filename required');
    const path = await realpath(resolve(base, name));
    requireThat(dirname(path) === base, name, 'file must remain inside snapshot directory');
    const bytes = await readFile(path);
    if (isRaw) {
      requireThat(typeof expectedHash === 'string' && /^[0-9a-f]{64}$/.test(expectedHash), name, 'SHA256 must be 64 lowercase hexadecimal characters');
      equal(createHash('sha256').update(bytes).digest('hex'), expectedHash, name, 'raw SHA256 mismatch');
      requireThat(!usedRawFiles.has(name), name, 'raw file reused by multiple runs');
      usedRawFiles.add(name);
    }
    return parseJson(bytes, name);
  }
  const plan = object(await load('queries.json'), 'queries.json');
  const runs = await load('runs.json');
  const metadataRuns = await load('metadata-runs.json');
  const inventory = object(await load('candidates-metadata.json'), 'candidates-metadata.json');
  equal(plan.schemaVersion, 'nutriklinik-focused-search-plan-v1', 'queries.json.schemaVersion');
  text(plan.version, 'queries.json.version'); text(plan.scope, 'queries.json.scope');
  requireThat(typeof plan.cutoff === 'string' && /^\d{4}-\d\d-\d\d$/.test(plan.cutoff) &&
    Number.isFinite(Date.parse(plan.cutoff)) && new Date(plan.cutoff).toISOString().slice(0, 10) === plan.cutoff, 'queries.json.cutoff', 'valid written cutoff date required');
  equal(plan.databasesExecuted, ['PubMed'], 'queries.json.databasesExecuted', 'this verifier covers PubMed only');
  requireThat(Array.isArray(plan.queries) && plan.queries.length > 0, 'queries.json.queries', 'nonempty query plan required');
  requireThat(Array.isArray(runs) && Array.isArray(metadataRuns) && Array.isArray(inventory.candidates), 'snapshot', 'run and candidate arrays required');
  const queries = new Map();
  for (const query of plan.queries) {
    object(query, 'query'); text(query.id, 'query.id'); text(query.query, `query ${query.id}`);
    requireThat(!queries.has(query.id), 'queries.json', `duplicate query ID ${query.id}`); queries.set(query.id, query);
  }
  sameSet(runs.map(run => run.queryId), [...queries.keys()], 'runs.json query IDs');
  const memberships = new Map(), perQuery = [];
  for (const run of runs) {
    const where = `ESearch ${run.queryId}`; object(run, where); timestamps(run, where);
    equal(run.httpStatus, 200, where, 'HTTP status must be 200');
    const params = request(run.requestUrl, 'esearch', `${where}.requestUrl`);
    equal(params.get('term'), queries.get(run.queryId).query, where, 'URL term differs from the planned literal query');
    equal(params.get('retstart'), '0', where, 'single complete request must start at zero');
    const maximum = rawInteger(params.get('retmax'), `${where}.request.retmax`);
    const raw = object(await load(run.rawFile, run.rawSha256, true), run.rawFile);
    equal(raw.header?.type, 'esearch', run.rawFile, 'ESearch response required');
    const result = object(raw.esearchresult, `${run.rawFile}.esearchresult`);
    const rawIds = ids(result.idlist, `${where}.raw.idlist`);
    const count = rawInteger(result.count, `${where}.raw.count`);
    equal(rawInteger(result.retstart, `${where}.raw.retstart`), 0, where, 'raw results do not start at zero');
    equal(rawInteger(result.retmax, `${where}.raw.retmax`), rawIds.length, where, 'raw retmax differs from returned IDs');
    equal(integer(run.count, `${where}.count`), count, where, 'reported count differs from raw count');
    equal(integer(run.retrieved, `${where}.retrieved`), rawIds.length, where, 'retrieved count differs from raw IDs');
    equal(ids(run.pmids, `${where}.pmids`), rawIds, where, 'stored PMIDs differ from raw ID order/content');
    requireThat(count === rawIds.length && maximum >= count && run.complete === true, where, 'retrieval is incomplete or complete flag is not true');
    text(result.querytranslation, `${where}.raw.querytranslation`);
    equal(run.queryTranslation, result.querytranslation, where, 'query translation was lost or changed');
    requireThat(Object.hasOwn(run, 'warnings') && Object.hasOwn(run, 'errors'), where, 'explicit warnings and errors fields required');
    equal(run.warnings, result.warninglist ?? null, where, 'raw warnings were lost or changed');
    const errors = errorValue(raw, result);
    equal(run.errors, errors, where, 'raw error presence was lost or changed');
    requireThat(errors === null, where, 'raw response contains an error; completeness cannot be verified');
    for (const pmid of rawIds) {
      if (!memberships.has(pmid)) memberships.set(pmid, []);
      memberships.get(pmid).push(run.queryId);
    }
    perQuery.push({ queryId: run.queryId, count, retrieved: rawIds.length, complete: true,
      rawFile: run.rawFile, warnings: run.warnings, errors: run.errors });
  }
  const summaries = new Map(), requestedAll = [];
  for (const [index, run] of metadataRuns.entries()) {
    const where = `ESummary batch ${index + 1}`; object(run, where); timestamps(run, where);
    if (Object.hasOwn(run, 'httpStatus')) equal(run.httpStatus, 200, where, 'HTTP status must be 200 when recorded');
    const requested = ids(run.requested, `${where}.requested`);
    requireThat(requested.length > 0, where, 'empty metadata batch');
    const params = request(run.requestUrl, 'esummary', `${where}.requestUrl`);
    equal(ids((params.get('id') ?? '').split(','), `${where}.request.id`), requested, where, 'URL IDs differ from requested IDs');
    const raw = object(await load(run.rawFile, run.rawSha256, true), run.rawFile);
    equal(raw.header?.type, 'esummary', run.rawFile, 'ESummary response required');
    const result = object(raw.result, `${run.rawFile}.result`);
    requireThat(errorValue(raw, result) === null, where, 'raw metadata response contains an error');
    const returned = ids(result.uids, `${where}.raw.uids`);
    equal(ids(run.returned, `${where}.returned`), returned, where, 'returned IDs differ from raw uids');
    sameSet(returned, requested, where);
    sameSet(Object.keys(result).filter(key => key !== 'uids'), returned, `${where}.record keys`);
    for (const pmid of returned) {
      requireThat(!summaries.has(pmid), where, `duplicate PMID ${pmid} across metadata batches`);
      const record = object(result[pmid], `${where}.${pmid}`);
      equal(record.uid, pmid, `${where}.${pmid}.uid`, 'record uid differs from PMID key');
      requireThat(errorValue({}, record) === null, `${where}.${pmid}`, 'metadata record contains an error');
      requireThat(Array.isArray(record.articleids), `${where}.${pmid}.articleids`, 'source identifiers required');
      equal(record.articleids.filter(id => id.idtype === 'pubmed').map(id => id.value), [pmid], `${where}.${pmid}.articleids`, 'PubMed identifier differs from record uid');
      summaries.set(pmid, record);
    }
    requestedAll.push(...requested);
  }
  sameSet(requestedAll, [...memberships.keys()], 'metadata requested PMID union');
  sameSet([...summaries.keys()], [...memberships.keys()], 'metadata returned PMID union');
  const candidateIds = ids(inventory.candidates.map(candidate => candidate.pmid), 'candidate PMIDs');
  sameSet(candidateIds, [...memberships.keys()], 'candidate PMID union');
  for (const candidate of inventory.candidates) {
    const where = `candidate ${candidate.pmid}`, record = summaries.get(candidate.pmid);
    sameSet(Object.keys(candidate), candidateKeys, `${where} schema`);
    ids(candidate.queryIds, `${where}.queryIds`, false);
    sameSet(candidate.queryIds, memberships.get(candidate.pmid), `${where}.queryIds`);
    for (const [key, rawKey] of Object.entries({ title: 'title', source: 'source', journal: 'fulljournalname',
      pubdate: 'pubdate', epubdate: 'epubdate', sortpubdate: 'sortpubdate', recordStatus: 'recordstatus' })) {
      equal(candidate[key], record[rawKey] || '', `${where}.${key}`, 'candidate metadata differs from raw ESummary');
    }
    equal(candidate.publicationTypes, record.pubtype || [], `${where}.publicationTypes`);
    equal(candidate.identifiers, record.articleids, `${where}.identifiers`);
    equal(candidate.doi, record.articleids.filter(id => id.idtype === 'doi').map(id => id.value), `${where}.doi`);
    equal(candidate.screeningStatus, 'pending', `${where}.screeningStatus`, 'retrieval snapshot must remain pending');
    equal(candidate.extractionStatus, 'pending', `${where}.extractionStatus`, 'retrieval snapshot must remain pending');
    equal(candidate.familyStatus, 'unresolved', `${where}.familyStatus`, 'trial families must remain unresolved');
  }
  return {
    schemaVersion: 'nutriklinik-focused-search-verification-v1', verified: true,
    scope: 'focused_pubmed_metadata_snapshot', cutoff: plan.cutoff,
    queryCount: queries.size, perQuery, queryMembershipCount: [...memberships.values()].reduce((sum, values) => sum + values.length, 0),
    uniqueCandidateCount: memberships.size, metadataBatchCount: metadataRuns.length,
    metadataRecordCount: summaries.size, rawFileCount: usedRawFiles.size, retrievalComplete: true,
    screeningStatus: 'pending', extractionStatus: 'pending', familyStatus: 'unresolved', trialCount: null,
    eligibilityEvaluated: false, fullTextAccessEvaluated: false, qualityEvaluated: false,
    systematicReviewClaim: false, clinicalEffectsEvaluated: false, clinicalRuleChangeClaim: null,
  };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.length > 3) {
    console.error('Usage: node research/verify-search-snapshot.mjs [snapshot-directory]'); process.exitCode = 2;
  } else {
    try { console.log(JSON.stringify(await verifySearchSnapshot(process.argv[2]), null, 2)); }
    catch (error) { console.error(`Search snapshot verification failed: ${error.message}`); process.exitCode = 1; }
  }
}
