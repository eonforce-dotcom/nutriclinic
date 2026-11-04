import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCoreRuleProvenance, describeCoreRule } from '../dist/core-rule-provenance.mjs';
import { VERSION } from '../dist/engine.mjs';
import { EVIDENCE_CUTOFF } from '../dist/config.mjs';
import { evidence } from '../dist/evidence.mjs';
import { indexEvidence } from '../dist/evidence-indices.mjs';
import { extraEvidence } from '../dist/evidence-extra.mjs';

const rule = id => buildCoreRuleProvenance().rules.find(row => row.id === id);

test('current map separates documentation provenance from clinical or reviewer validation', () => {
  const map = buildCoreRuleProvenance();
  assert.equal(map.schemaVersion, '0.1.0');
  assert.equal(map.origin, 'current-implementation-map');
  assert.equal(map.engineVersion, VERSION);
  assert.equal(map.evidenceCutoff, EVIDENCE_CUTOFF);
  assert.equal(map.documentationReviewedAt, '2026-10-26');
  assert.equal(map.scope, 'reference-map-only');
  assert.equal(map.clinicalValidation, false);
  assert.equal(map.implementationPolicyScope, 'local-policies-not-source-validation');
  for (const key of ['reviewer', 'confirmed', 'reviewedInput', 'patient', 'clinicalPass']) {
    assert.equal(Object.hasOwn(map, key), false);
  }
});

test('unmapped arithmetic and NLR stay explicit instead of borrowing other marker sources', () => {
  const nlr = rule('nlr');
  assert.equal(nlr.mappingStatus, 'formula-unmapped');
  assert.deepEqual(nlr.sourceReferences, []);
  assert.deepEqual(nlr.outputPaths, ['indices.nlr']);
  const anthropometry = rule('anthropometry');
  assert.equal(anthropometry.mappingStatus, 'arithmetic-unmapped');
  assert.deepEqual(anthropometry.sourceReferences, []);
  assert.match(describeCoreRule('nlr').scopeNote, /No dedicated NLR formula source/);
  assert.match(describeCoreRule('nlr').scopeNote, /other marker papers do not validate/);
});

test('abstract equation check is distinct from full-text or clinical/optimal-dose validation', () => {
  const plan = rule('formulaPlan');
  assert.equal(plan.mappingStatus, 'clinical-context-only');
  assert.deepEqual(plan.sourceReferences, [{ sourceId: 'espen-icu-2023', role: 'clinical-context-only' }]);
  assert.match(describeCoreRule('formulaPlan').scopeNote, /physician-entered targets/);
  assert.match(describeCoreRule('formulaPlan').scopeNote, /not an optimum-dose/);
  const pni = rule('pni');
  assert.equal(pni.mappingStatus, 'formula-units-checked-abstract-only');
  assert.equal(pni.sourceReferences.find(row => row.sourceId === 'onodera-pni-1984').role, 'original-abstract-formula-units');
  assert.equal(pni.sourceReferences.find(row => row.sourceId === 'aspen-visceral-2021').role, 'interpretation-context');
  assert.match(describeCoreRule('pni').scopeNote, /original English abstract states/);
  assert.match(describeCoreRule('pni').scopeNote, /Japanese full-text methods remain unread/);
  assert.match(describeCoreRule('pni').scopeNote, /does not establish ICU\/ward clinical validity/);
  assert.match(describeCoreRule('nitrogenBalance').scopeNote, /tolerance and suppression guards are local policies/);
  assert.match(describeCoreRule('nitrogenBalance').scopeNote, /does not validate an individual anabolic-state classifier/);
});

test('every mapped source exists locally with a bounded relationship and uniquely owned output paths', () => {
  const sources = new Set([...evidence, ...indexEvidence, ...extraEvidence].map(source => source.id));
  const allowedRoles = new Set(['clinical-framework', 'intake-interpretation', 'original-abstract-formula-units', 'interpretation-context', 'approximate-method-context', 'original-use-context', 'applicability-context', 'risk-framework', 'clinical-context-only']);
  const ids = new Set();
  const paths = new Set();
  const map = buildCoreRuleProvenance();
  assert.equal(map.rules.length, 7);
  for (const row of map.rules) {
    assert.equal(ids.has(row.id), false, `Duplicate rule ${row.id}`);
    ids.add(row.id);
    assert.ok(row.outputPaths.length);
    for (const path of row.outputPaths) {
      assert.match(path, /^[a-zA-Z]+(?:\.[a-zA-Z]+)*$/);
      assert.equal(paths.has(path), false, `Ambiguous output ${path}`);
      paths.add(path);
    }
    for (const reference of row.sourceReferences) {
      assert.ok(sources.has(reference.sourceId), `Unknown source ${reference.sourceId}`);
      assert.ok(allowedRoles.has(reference.role), `Unbounded source role ${reference.role}`);
    }
    assert.ok(row.implementationPolicies.length);
    assert.ok(row.implementationPolicies.every(policy => /^local-[a-z0-9-]+$/.test(policy)));
  }
  assert.ok(paths.has('glim') && paths.has('refeeding') && paths.has('indices.nitrogen') && paths.has('metabolic'));
});

test('maps are fresh deep copies, JSON-safe and compact without patient or localized state', () => {
  const expected = buildCoreRuleProvenance();
  const changed = buildCoreRuleProvenance();
  changed.scope = 'validated';
  changed.rules[0].outputPaths.push('patient');
  changed.rules[1].sourceReferences[0].role = 'validation';
  changed.rules[1].sourceReferences.push({ sourceId: 'invented', role: 'validation' });
  changed.rules[2].implementationPolicies[0] = 'external';
  changed.rules.pop();
  assert.deepEqual(buildCoreRuleProvenance(), expected);
  const serialized = JSON.stringify(expected);
  assert.deepEqual(JSON.parse(serialized), expected);
  assert.ok(Buffer.byteLength(serialized, 'utf8') < 5000);
  assert.equal(serialized.includes('scopeNote'), false);
  assert.equal(serialized.includes('"label"'), false);
});

test('caller-supplied metadata and hostile getters cannot become trusted provenance', () => {
  const untrusted = new Proxy({}, { get() { throw new Error('Imported metadata must not be read'); } });
  assert.deepEqual(buildCoreRuleProvenance(untrusted), buildCoreRuleProvenance());
  assert.deepEqual(buildCoreRuleProvenance({ origin: 'imported', rules: [], confirmed: true }), buildCoreRuleProvenance());
});

test('localized descriptions are isolated and prototype-safe with English fallback', () => {
  for (const row of buildCoreRuleProvenance().rules) {
    const en = describeCoreRule(row.id);
    const tr = describeCoreRule(row.id, 'tr');
    assert.deepEqual(Object.keys(en).sort(), ['label', 'scopeNote']);
    assert.ok(en.label && en.scopeNote && tr.label && tr.scopeNote);
    assert.notEqual(en.label, tr.label);
    assert.notEqual(en.scopeNote, tr.scopeNote);
    assert.deepEqual(describeCoreRule(row.id, 'unknown'), en);
    en.scopeNote = 'validated';
    tr.label = 'mutated';
    assert.notEqual(describeCoreRule(row.id).scopeNote, 'validated');
    assert.notEqual(describeCoreRule(row.id, 'tr').label, 'mutated');
  }
  for (const id of ['unknown', '__proto__', 'constructor', 'toString', '', null, {}, ['glim']]) {
    assert.equal(describeCoreRule(id), null);
  }
  assert.deepEqual(describeCoreRule('nlr', '__proto__'), describeCoreRule('nlr'));
});
