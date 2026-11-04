import { constants } from 'node:fs';
import { lstat, open, readFile, realpath } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { verifySearchSnapshot } from './verify-search-snapshot.mjs';

// This sidecar collects declared drafts only. It never changes the acquisition
// snapshot, authenticates a reviewer or decides final report/trial eligibility.
export const CANDIDATE_SHA256 = '324ba27bb601983e5f2a04da8b1b21d9afb4c3ecd1b2175ab7248dbec0183538';
export const CANDIDATE_COUNT = 2544;
export const METHOD_VERSION = '0.1.1';
const CANDIDATE_FILE = 'research/snapshot-20261025/candidates-metadata.json';
const METHOD_FILE = 'dist/FOCUSED-SEARCH-METHODS.md';
const SCHEMA = 'nutriklinik-screening-ledger-v0.1.0';
const SCOPE = 'draft-review-collection';
const here = dirname(fileURLToPath(import.meta.url));
const application = resolve(here, '..');
const canonicalRoot = resolve(application, '../..');
const snapshot = join(here, 'snapshot-20261025');
const protectedDirectories = [snapshot, join(application, 'dist')];
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
class Refusal extends Error {}
const requireThat = (condition, message) => { if (!condition) throw new Refusal(message); };
const exactObject = (value, keys, where) => {
  requireThat(value !== null && typeof value === 'object' && !Array.isArray(value) &&
    [Object.prototype, null].includes(Object.getPrototypeOf(value)), `${where}: plain object required`);
  const actual = Reflect.ownKeys(value);
  requireThat(actual.length === keys.length && keys.every(key => Object.hasOwn(value, key)) && actual.every(key => {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    return typeof key === 'string' && descriptor.enumerable && Object.hasOwn(descriptor, 'value');
  }), `${where}: missing, unknown or non-JSON keys`);
};
const string = (value, where, max = 2000) => {
  requireThat(typeof value === 'string' && value.length > 0 && value.length <= max && value === value.trim() && !/[\u0000-\u001f\u007f]/.test(value), `${where}: bounded nonempty trimmed text required`);
};
const digest = (value, where) => requireThat(typeof value === 'string' && /^[a-f0-9]{64}$/.test(value), `${where}: lowercase SHA-256 required`);
function instant(value, where) {
  requireThat(typeof value === 'string', `${where}: explicit-offset ISO timestamp required`);
  const match = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?(Z|[+-](\d{2}):(\d{2}))$/.exec(value);
  requireThat(match, `${where}: explicit-offset ISO timestamp required`);
  const day = new Date(`${match[1]}T00:00:00Z`);
  requireThat(Number.isFinite(day.getTime()) && day.toISOString().slice(0, 10) === match[1] && match[1].slice(0, 4) !== '0000', `${where}: invalid calendar day`);
  requireThat(Number(match[2]) < 24 && Number(match[3]) < 60 && Number(match[4]) < 60, `${where}: invalid clock time`);
  requireThat(match[6] === 'Z' || (Number(match[7]) <= 14 && Number(match[8]) < 60 && (Number(match[7]) !== 14 || Number(match[8]) === 0)), `${where}: invalid UTC offset`);
  const result = Date.parse(value);
  requireThat(Number.isFinite(result), `${where}: invalid timestamp`);
  return result;
}
function sourceCitation(source, event, where) {
  exactObject(source, ['kind', 'url', 'location', 'accessDepth', 'checkedAt'], where);
  requireThat(['metadata', 'abstract', 'original-report', 'protocol', 'registry', 'correction'].includes(source.kind), `${where}: unknown source kind`);
  requireThat(['metadata-only', 'title-only', 'abstract-only', 'partial-full-text', 'full-text', 'not-retrieved'].includes(source.accessDepth), `${where}: unknown access depth`);
  string(source.url, `${where}.url`, 2000);
  let url;
  try { url = new URL(source.url); } catch { throw new Refusal(`${where}: invalid source URL`); }
  requireThat(url.protocol === 'https:' && !url.username && !url.password, `${where}: public HTTPS URL without credentials required`);
  string(source.location, `${where}.location`);
  const checked = instant(source.checkedAt, `${where}.checkedAt`);
  requireThat(checked <= instant(event.decisionAt, `${where}.decisionAt`), `${where}: source check follows declared decision`);
  if (source.kind === 'metadata') requireThat(['metadata-only', 'title-only', 'not-retrieved'].includes(source.accessDepth), `${where}: metadata is not full text`);
  if (source.kind === 'abstract') requireThat(['abstract-only', 'title-only', 'not-retrieved'].includes(source.accessDepth), `${where}: abstract is not full text`);
  if (source.accessDepth === 'not-retrieved') requireThat(event.decision === 'uncertain', `${where}: not retrieved must remain uncertain`);
  if (event.stage === 'full-text' && event.decision === 'include') {
    requireThat(source.kind === 'original-report' && source.accessDepth === 'full-text', `${where}: full-text include requires an actually consulted original full-report declaration`);
    requireThat(url.hostname.replace(/\.+$/, '') !== 'pubmed.ncbi.nlm.nih.gov', `${where}: PubMed bibliographic/abstract page is not an original full report`);
  }
}

/** Pure: no clock, file creation, identities or decisions are generated. */
export function buildEmptyLedger(eligibilityMethodSha256) {
  digest(eligibilityMethodSha256, 'eligibility method');
  return {
    schemaVersion: SCHEMA, scope: SCOPE,
    sourceBinding: {
      candidateFile: CANDIDATE_FILE, candidateSha256: CANDIDATE_SHA256, candidateCount: CANDIDATE_COUNT,
      eligibilityMethodFile: METHOD_FILE, eligibilityMethodVersion: METHOD_VERSION, eligibilityMethodSha256,
    },
    events: [],
  };
}

/** Pure: known PMIDs and method hash must come from trusted, checked source bytes. */
export function validateLedger(ledger, { candidatePmids, eligibilityMethodSha256 } = {}) {
  digest(eligibilityMethodSha256, 'expected eligibility method');
  requireThat(Array.isArray(candidatePmids) && candidatePmids.length === CANDIDATE_COUNT && candidatePmids.every(pmid => typeof pmid === 'string' && /^[1-9]\d*$/.test(pmid)) && new Set(candidatePmids).size === CANDIDATE_COUNT, 'trusted candidate PMID set required');
  exactObject(ledger, ['schemaVersion', 'scope', 'sourceBinding', 'events'], 'ledger');
  requireThat(ledger.schemaVersion === SCHEMA && ledger.scope === SCOPE, 'unsupported ledger schema or scope');
  const expected = buildEmptyLedger(eligibilityMethodSha256).sourceBinding;
  exactObject(ledger.sourceBinding, Object.keys(expected), 'sourceBinding');
  for (const key of Object.keys(expected)) requireThat(ledger.sourceBinding[key] === expected[key], `sourceBinding.${key}: differs from trusted source`);
  requireThat(Array.isArray(ledger.events) && ledger.events.length <= 50000, 'events: bounded array required');
  const known = new Set(candidatePmids), seen = new Map(), active = new Map();
  for (let index = 0; index < ledger.events.length; index++) {
    const event = ledger.events[index], where = `events[${index}]`;
    exactObject(event, ['eventId', 'pmid', 'reviewerId', 'reviewerAuthority', 'decisionAt', 'criteriaVersion', 'stage', 'decision', 'reason', 'source', 'supersedesEventId', 'revisionReason'], where);
    string(event.eventId, `${where}.eventId`, 120);
    requireThat(!seen.has(event.eventId), `${where}: duplicate event ID`);
    requireThat(typeof event.pmid === 'string' && known.has(event.pmid), `${where}: PMID not in bound candidate snapshot`);
    string(event.reviewerId, `${where}.reviewerId`, 120);
    requireThat(event.reviewerAuthority === 'human-declared-unverified', `${where}: only explicit unverified human declarations are accepted`);
    const time = instant(event.decisionAt, `${where}.decisionAt`);
    requireThat(event.criteriaVersion === METHOD_VERSION, `${where}: unsupported criteria version; amendments are not implemented`);
    requireThat(['title-abstract', 'full-text'].includes(event.stage), `${where}: unknown stage`);
    const decisions = event.stage === 'title-abstract' ? ['advance', 'exclude', 'uncertain'] : ['include', 'exclude', 'uncertain'];
    requireThat(decisions.includes(event.decision), `${where}: decision is not allowed in this stage`);
    string(event.reason, `${where}.reason`);
    sourceCitation(event.source, event, `${where}.source`);
    const key = JSON.stringify([event.pmid, event.reviewerId, event.stage, event.criteriaVersion]);
    if (event.supersedesEventId === null) {
      requireThat(event.revisionReason === null, `${where}: revision reason requires a superseded event`);
      requireThat(!active.has(key), `${where}: duplicate current decision; explicit revision required`);
    } else {
      string(event.supersedesEventId, `${where}.supersedesEventId`, 120);
      string(event.revisionReason, `${where}.revisionReason`);
      const previous = seen.get(event.supersedesEventId);
      requireThat(previous && previous.key === key && active.get(key)?.eventId === previous.event.eventId, `${where}: revision must name the earlier current decision of the same reviewer, PMID, stage and criteria`);
      requireThat(time > previous.time, `${where}: revision decision time must follow the earlier decision`);
    }
    seen.set(event.eventId, {event, key, time});
    active.set(key, event);
  }
  const current = [...active.values()];
  const stages = {};
  for (const stage of ['title-abstract', 'full-text']) {
    const events = current.filter(event => event.stage === stage), reports = new Map();
    const counts = Object.fromEntries((stage === 'title-abstract' ? ['advance', 'exclude', 'uncertain'] : ['include', 'exclude', 'uncertain']).map(decision => [decision, 0]));
    for (const event of events) {
      counts[event.decision]++;
      reports.set(event.pmid, [...(reports.get(event.pmid) || []), event]);
    }
    const disagreements = [...reports].filter(([, values]) => new Set(values.map(event => event.decision)).size > 1).map(([pmid, values]) => ({pmid, eventIds: values.map(event => event.eventId), reviewerLabels: values.map(event => event.reviewerId), decisions: values.map(event => event.decision)}));
    stages[stage] = {
      currentDeclaredDecisionCounts: counts,
      candidateReportsWithCurrentDeclaration: reports.size,
      candidateReportsWithoutCurrentDeclaration: CANDIDATE_COUNT - reports.size,
      multipleReviewerLabelReports: [...reports.values()].filter(values => values.length > 1).length,
      unresolvedDecisionDisagreements: disagreements,
    };
  }
  return {
    valid: true, scope: SCOPE, eligibilityEvaluated: false, eligibleCount: null,
    frozenSnapshotScreeningStatus: 'pending', frozenCandidateCount: CANDIDATE_COUNT,
    eventCount: ledger.events.length, currentDeclaredDecisionCount: current.length,
    candidateReportsWithoutAnyCurrentDeclaration: CANDIDATE_COUNT - new Set(current.map(event => event.pmid)).size,
    declaredReviewerLabels: [...new Set(current.map(event => event.reviewerId))].sort(), stages,
    authenticatedHumanIdentity: false, independentDualScreeningVerified: false, blindingVerified: false,
    adjudicationImplemented: false, familyOrQualityEvaluation: false, immutableAudit: false,
  };
}

// JSON.parse alone silently accepts conflicting repeated decision/reviewer keys.
// Check syntax, then boundedly walk object keys, including escaped spellings.
function parseLedger(bytes) {
  requireThat(bytes.length <= 10 * 1024 * 1024, 'ledger exceeds 10 MB');
  let source;
  try { source = new TextDecoder('utf-8', {fatal: true}).decode(bytes); }
  catch { throw new Refusal('ledger must contain valid UTF-8'); }
  let value;
  try { value = JSON.parse(source); } catch { throw new Refusal('invalid ledger JSON'); }
  let offset = 0;
  const space = () => { while (offset < source.length && /\s/.test(source[offset])) offset++; };
  const stringValue = () => {
    const start = offset++;
    while (offset < source.length) {
      const character = source[offset++];
      if (character === '\\') offset++;
      else if (character === '"') return JSON.parse(source.slice(start, offset));
    }
  };
  const walk = (depth = 0) => {
    requireThat(depth <= 24, 'ledger JSON nesting exceeds limit');
    space();
    if (source[offset] === '{') {
      offset++; space(); const keys = new Set();
      if (source[offset] === '}') { offset++; return; }
      while (true) {
        space(); const key = stringValue();
        requireThat(!keys.has(key), `duplicate JSON object key ${JSON.stringify(key)}`);
        keys.add(key); space(); offset++; walk(depth + 1); space();
        if (source[offset++] === '}') return;
      }
    }
    if (source[offset] === '[') {
      offset++; space();
      if (source[offset] === ']') { offset++; return; }
      while (true) { walk(depth + 1); space(); if (source[offset++] === ']') return; }
    }
    if (source[offset] === '"') { stringValue(); return; }
    while (offset < source.length && !/[\s,\]}]/.test(source[offset])) offset++;
  };
  walk();
  return value;
}

const within = (parent, child) => {
  const path = relative(parent, child);
  return path === '' || (!isAbsolute(path) && path !== '..' && !path.startsWith(`..${sep}`));
};
async function safePath(input, creating = false) {
  requireThat(typeof input === 'string' && input.length > 0, 'local JSON path required');
  const target = resolve(input);
  requireThat(within(canonicalRoot, target) && target !== canonicalRoot && target.toLowerCase().endsWith('.json'), 'ledger must be a JSON file inside the canonical local project');
  requireThat(!protectedDirectories.some(directory => within(directory, target)), 'ledger cannot be inside dist or the frozen snapshot');
  const components = relative(canonicalRoot, target).split(sep);
  requireThat(components.every(component => !/[<>:"|?*]/.test(component) && !/[. ]$/.test(component) && !/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(component)), 'alternate streams, device names and ambiguous Windows path components are refused');
  const rootStat = await lstat(canonicalRoot);
  requireThat(rootStat.isDirectory() && !rootStat.isSymbolicLink(), 'canonical root must be a real directory');
  const realRoot = await realpath(canonicalRoot);
  const protectedReal = await Promise.all(protectedDirectories.map(directory => realpath(directory)));
  let current = canonicalRoot;
  for (let index = 0; index < components.length; index++) {
    current = join(current, components[index]);
    const last = index === components.length - 1;
    let stat;
    try { stat = await lstat(current); }
    catch (error) {
      if (creating && last && error.code === 'ENOENT') return target;
      throw error;
    }
    requireThat(!stat.isSymbolicLink(), 'symbolic links/junctions are not accepted for ledger paths');
    requireThat(last ? stat.isFile() : stat.isDirectory(), 'ledger path component has the wrong type');
    const actual = await realpath(current);
    requireThat(within(realRoot, actual) && !protectedReal.some(directory => within(directory, actual)), 'ledger path aliases a protected or external location');
    if (creating && last) throw new Refusal('output already exists; no overwrite is allowed');
  }
  return target;
}
async function sources() {
  // Use the existing verifier before either real CLI operation; no network or writes.
  const verification = await verifySearchSnapshot(snapshot);
  requireThat(verification.verified === true && verification.uniqueCandidateCount === CANDIDATE_COUNT, 'frozen snapshot verification failed');
  const bytes = await readFile(join(application, CANDIDATE_FILE));
  requireThat(hash(bytes) === CANDIDATE_SHA256, 'candidate bytes differ from the pinned source SHA-256');
  const inventory = JSON.parse(bytes.toString('utf8'));
  const method = await readFile(join(application, METHOD_FILE));
  requireThat(method.toString('utf8').includes('**Version 0.1.1 · 25 October 2026'), 'canonical eligibility method version changed; explicit tool review required');
  return {candidatePmids: inventory.candidates.map(candidate => candidate.pmid), eligibilityMethodSha256: hash(method)};
}

async function run(args) {
  requireThat(args.length === 2 && ['init', 'verify'].includes(args[0]), 'Usage: node research/screening-ledger.mjs init OUTPUT.json | verify INPUT.json');
  const [command, filename] = args;
  const target = await safePath(filename, command === 'init');
  const context = await sources();
  if (command === 'verify') {
    const handle = await open(target, constants.O_RDONLY | (constants.O_NOFOLLOW || 0));
    try {
      const stat = await handle.stat();
      requireThat(stat.isFile() && stat.size <= 10 * 1024 * 1024, 'regular ledger file within 10 MB required');
      return validateLedger(parseLedger(await handle.readFile()), context);
    } finally { await handle.close(); }
  }
  const ledger = buildEmptyLedger(context.eligibilityMethodSha256);
  const report = validateLedger(ledger, context);
  const handle = await open(target, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | (constants.O_NOFOLLOW || 0), 0o600);
  try {
    await safePath(target); // Recheck aliases after exclusive creation, before writing.
    await handle.writeFile(JSON.stringify(ledger, null, 2) + '\n', 'utf8');
    await handle.sync();
  } finally { await handle.close(); }
  return {...report, initializedEmptyLedger: target};
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { console.log(JSON.stringify(await run(process.argv.slice(2)), null, 2)); }
  catch (error) {
    console.error(`Screening-ledger refusal: ${error.message}`);
    process.exitCode = error instanceof Refusal || error.code === 'EEXIST' ? 2 : 1;
  }
}
