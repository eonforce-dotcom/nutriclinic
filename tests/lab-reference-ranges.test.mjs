import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyReferenceProfile, validateReferenceProfile, evaluateReferenceProfile, restoreReferenceProfile } from '../dist/lab-reference-ranges.mjs';
import { labDefs } from '../dist/import.mjs';
import { evaluate } from '../dist/engine.mjs';
import { evaluateMarkers } from '../dist/clinical-context.mjs';

const input = () => ({ age: 64, sex: 'male', labsConfirmed: true, labDate: '2026-10-27', visitDate: '2026-10-28', albumin: 35, neutrophils: 4, lymphocytes: 1.5, crp: 0, potassium: 4, uun: 10, uunDate: '2026-10-26', collectionComplete: true, collectionStart: '2026-10-25T08:00', collectionEnd: '2026-10-26T08:00', urineVolume: 1500 });
const profile = (key = 'albumin', lower = 30, upper = 40, unit = labDefs[key].unit) => {
  const p = emptyReferenceProfile();
  Object.assign(p, { clinicName: 'Example hospital', source: 'Laboratory interval sheet', version: '1', effectiveFrom: '2026-01-01' });
  p.rows[key] = { enabled: true, lower, upper, unit };
  return p;
};
const result = (key = 'albumin', data = input(), p = profile(), options = { applicabilityConfirmed: true }) => evaluateReferenceProfile(data, p, options).results.find(row => row.analyte === key);
const freeze = value => { if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); } return value; };

test('profiles start empty and never supply a default normal range or patient authorization', () => {
  const p = emptyReferenceProfile();
  assert.equal(Object.keys(p.rows).length, 10);
  assert.ok(Object.values(p.rows).every(row => !row.enabled && row.lower === null && row.upper === null));
  p.rows.albumin.lower = 10;
  assert.equal(emptyReferenceProfile().rows.albumin.lower, null);
  assert.equal(validateReferenceProfile(emptyReferenceProfile()).valid, false);
  assert.equal(result('albumin', input(), profile(), {}).reason, 'applicability-unconfirmed');
  assert.equal(evaluateReferenceProfile(input(), profile()).clinicalValidation, false);
});

test('strict bound parsing preserves zero and one-sided ranges and rejects malformed configuration', () => {
  const p = profile('crp', '0', '5,5');
  assert.equal(validateReferenceProfile(p).valid, true);
  assert.equal(validateReferenceProfile(p).profile.rows.crp.upper, 5.5);
  assert.equal(result('crp', input(), p).status, 'within');
  for (const [lower, upper] of [[null, 5], [0, null]]) assert.equal(validateReferenceProfile(profile('crp', lower, upper)).valid, true);
  for (const bad of ['abc', '5mg/L', 'Infinity', Infinity, NaN, true, [], {}]) {
    const invalid = profile('crp', bad, 5);
    assert.equal(validateReferenceProfile(invalid).valid, false);
    assert.equal(result('crp', input(), invalid).status, 'not-applicable');
  }
  for (const [lower, upper] of [[' ', ''], [null, null], [5, 5], [6, 5], [-1, 5]]) assert.equal(validateReferenceProfile(profile('crp', lower, upper)).valid, false);
  for (const change of [{ effectiveFrom: '2026-02-30' }, { effectiveFrom: '0000-01-01' }, { effectiveTo: '2025-12-31' }, { ageMin: 17 }, { ageMax: 121 }, { ageMin: 70, ageMax: 60 }, { sex: 'unknown' }, { schemaVersion: 'future' }, { clinicName: '' }]) assert.equal(validateReferenceProfile({ ...profile(), ...change }).valid, false);
  assert.equal(validateReferenceProfile(profile('albumin', null, Number.MAX_VALUE, 'g/dL')).valid, false);
  assert.equal(result('albumin', input(), profile('albumin', null, Number.MAX_VALUE, 'g/dL')).upper, null);
});

test('comparison uses inclusive unrounded bounds and only permitted unit equivalents', () => {
  const p = profile();
  for (const [value, status] of [[29.999999, 'below'], [30, 'within'], [40, 'within'], [40.000001, 'above']]) assert.equal(result('albumin', { ...input(), albumin: value }, p).status, status);
  const a = result('albumin', input(), profile('albumin', 3, 4, 'g/dL'));
  assert.deepEqual(a, result());
  assert.equal(result('neutrophils', input(), profile('neutrophils', 2000, 6000, 'cells/µL')).status, 'within');
  assert.deepEqual(result('potassium', input(), profile('potassium', 3, 5, 'mEq/L')), result('potassium', input(), profile('potassium', 3, 5)));
  for (const [key, unit] of [['albumin', 'mg/dL'], ['crp', 'mg/dL'], ['magnesium', 'mEq/L'], ['neutrophils', '%'], ['uun', 'g/L']]) assert.equal(validateReferenceProfile(profile(key, 1, 5, unit)).valid, false);
  const lowerOnly = profile('albumin', 40, null);
  assert.equal(result('albumin', input(), lowerOnly).status, 'below');
  assert.equal(result('albumin', { ...input(), albumin: 40 }, lowerOnly).status, 'within');
});

test('patient applicability depends on documented adult age, sex and specimen-effective dates', () => {
  const p = { ...profile(), ageMin: 60, ageMax: 70, sex: 'male', effectiveTo: '2026-10-27' };
  assert.equal(result('albumin', input(), p).status, 'within');
  for (const change of [{ age: 17 }, { age: 59 }, { age: 71 }, { sex: 'female' }, { labDate: '2026-10-28' }, { labDate: '2025-12-31' }, { labDate: '2026-10-29' }]) assert.equal(result('albumin', { ...input(), ...change }, p).status, 'not-applicable');
  for (const change of [{ age: '64' }, { age: NaN }, { sex: '' }, { labDate: '2026-02-30' }, { labDate: '0000-01-01' }, { visitDate: '' }]) assert.equal(result('albumin', { ...input(), ...change }, p).status, 'unavailable');
  assert.equal(result('albumin', { ...input(), labDate: p.effectiveFrom }, p).status, 'within');
  assert.equal(result('albumin', { ...input(), age: p.ageMin }, p).status, 'within');
  assert.equal(result('albumin', { ...input(), age: p.ageMax }, p).status, 'within');
});

test('invalid flags, absent confirmation and implausible/missing values never become interval comparisons', () => {
  for (const flag of ['albumin', 'age', 'sex', 'labDate', 'visitDate', 'labsConfirmed']) assert.equal(result('albumin', { ...input(), inputErrors: [` ${flag} `] }).reason, 'flagged-input');
  for (const flags of [null, {}, [''], [1], new Array(1)]) assert.equal(result('albumin', { ...input(), inputErrors: flags }).reason, 'invalid-error-metadata');
  assert.equal(result('albumin', { ...input(), inputErrors: ['potassium'] }).status, 'within');
  for (const albumin of [null, undefined, '', '35', true, Infinity, 4, 71]) assert.equal(result('albumin', { ...input(), albumin }).status, 'unavailable');
  assert.equal(result('albumin', { ...input(), labsConfirmed: false }).reason, 'laboratory-unconfirmed');
  assert.equal(result('crp', input(), profile('crp', 0, 5)).value, 0);
  assert.equal(result('lymphocytes', { ...input(), lymphocytes: 0 }, profile('lymphocytes', 0, 5)).value, 0);
});

test('UUN uses its own confirmed complete-collection date and remains a measured laboratory comparison only', () => {
  const p = profile('uun', 5, 15);
  const data = { ...input(), labDate: undefined };
  assert.equal(result('uun', data, p).status, 'within');
  for (const change of [{ uunDate: '' }, { uunDate: '2026-02-30' }, { collectionComplete: false }, { inputErrors: ['uunDate'] }, { labsConfirmed: false }]) assert.equal(result('uun', { ...data, ...change }, p).status, 'unavailable');
  for (const key of ['collectionComplete', 'collectionStart', 'collectionEnd', 'urineVolume']) assert.equal(result('uun', { ...data, inputErrors: [key] }, p).reason, 'flagged-input');
  assert.equal(result('uun', { ...data, uunDate: '2026-10-29' }, p).status, 'not-applicable');
  assert.equal(result('uun', { ...data, uunDate: '2025-12-31' }, p).status, 'not-applicable');
  assert.equal(Object.hasOwn(evaluateReferenceProfile(data, p, { applicabilityConfirmed: true }), 'nitrogenBalance'), false);
});

test('UUN requires a coherent 24-hour collection, written end date and positive measured urine volume', () => {
  const p = profile('uun', 5, 15), data = input();
  for (const [change, reason] of [
    [{ collectionStart: undefined }, 'invalid-collection-time'],
    [{ collectionEnd: '2026-02-30T08:00' }, 'invalid-collection-time'],
    [{ collectionStart: '2026-10-25T24:00' }, 'invalid-collection-time'],
    [{ collectionEnd: '2026-10-26T08:00+14:01' }, 'invalid-collection-time'],
    [{ collectionEnd: '2026-10-26T08:00Z' }, 'mixed-collection-time-basis'],
    [{ collectionStart: '2026-10-26T08:00', collectionEnd: '2026-10-25T08:00' }, 'invalid-collection-duration'],
    [{ collectionEnd: '2026-10-26T07:53:59' }, 'invalid-collection-duration'],
    [{ collectionEnd: '2026-10-26T08:06:01' }, 'invalid-collection-duration'],
    [{ uunDate: '2026-10-27' }, 'collection-date-mismatch'],
    ...[null, undefined, 0, -1, '1500', true, Infinity].map(urineVolume => [{ urineVolume }, 'invalid-urine-volume']),
  ]) assert.equal(result('uun', { ...data, ...change }, p).reason, reason);
  for (const end of ['2026-10-26T07:54', '2026-10-26T08:06']) assert.equal(result('uun', { ...data, collectionEnd: end }, p).status, 'within');
  // Offset arithmetic uses elapsed instants; the specimen remains the written
  // end day, including when UTC would resolve to the preceding day.
  assert.equal(result('uun', { ...data, collectionStart: '2026-10-25T00:30+03:00', collectionEnd: '2026-10-26T00:30+03:00' }, p).status, 'within');
  assert.equal(result('uun', { ...data, collectionStart: '2026-10-25T08:00+03:00', collectionEnd: '2026-10-26T09:00+04:00' }, p).status, 'within');
  // Protein matching and renal/loss rules belong to nitrogen interpretation,
  // not this isolated laboratory interval comparison.
  assert.equal(result('uun', { ...data, collectionMatched: false, renal: 'aki', actualProtein: null }, p).status, 'within');
});

test('UUN collection boundary decisions agree with the existing core collection contract', () => {
  const p = profile('uun', 5, 15), data = { ...input(), actualProtein: 100, collectionMatched: true, renal: 'none', extraLosses: false };
  for (const change of [
    {}, { collectionEnd: '2026-10-26T08:06' }, { collectionEnd: '2026-10-26T07:54' },
    { collectionEnd: '2026-10-26T08:06:01' }, { collectionEnd: '2026-10-26T07:53:59' },
    { collectionStart: '' }, { collectionEnd: '2026-10-26T08:00Z' }, { uunDate: '2026-10-27' }, { urineVolume: 0 },
    { collectionStart: '2026-10-25T00:30+03:00', collectionEnd: '2026-10-26T00:30+03:00' },
  ]) {
    const sample = { ...data, ...change };
    assert.equal(result('uun', sample, p).status === 'within', evaluate(sample).indices.nitrogen !== null, JSON.stringify(change));
  }
});

test('snapshots and restored configuration are isolated and cannot authorize patient applicability', () => {
  const p = profile(), before = structuredClone(p);
  const evaluation = evaluateReferenceProfile(freeze(input()), freeze(p), { applicabilityConfirmed: true });
  assert.deepEqual(p, before);
  evaluation.profileSnapshot.rows.albumin.upper = 50;
  assert.equal(p.rows.albumin.upper, 40);
  const restored = restoreReferenceProfile({ ...evaluation, applicabilityConfirmed: true, labsConfirmed: true });
  assert.equal(Object.hasOwn(restored, 'applicabilityConfirmed'), false);
  assert.equal(result('albumin', input(), restored, {}).reason, 'applicability-unconfirmed');
  restored.rows.albumin.lower = 0;
  assert.equal(evaluation.profileSnapshot.rows.albumin.lower, 30);
  const forged = JSON.parse(JSON.stringify(before));
  forged.applicabilityConfirmed = true;
  forged.rows.__proto__ = { enabled: true };
  assert.equal(validateReferenceProfile(forged).valid, false);
  assert.equal(result('albumin', input(), restoreReferenceProfile(forged), {}).status, 'not-applicable');
  const invalid = profile('albumin', 'broken', 40);
  assert.equal(restoreReferenceProfile(invalid).rows.albumin.enabled, false);
  for (const invalidProfile of [invalid, { ...before, unknownField: 'cannot be silently removed' }, { ...before, schemaVersion: 'future' }]) {
    const restoredInvalid = restoreReferenceProfile(invalidProfile);
    assert.equal(validateReferenceProfile(restoredInvalid).valid, false);
    assert.deepEqual(restoredInvalid, emptyReferenceProfile());
    const invalidSnapshot = evaluateReferenceProfile(input(), invalidProfile, { applicabilityConfirmed: true });
    assert.equal(invalidSnapshot.profileValid, false);
    assert.ok(invalidSnapshot.profileErrors.length > 0);
    assert.deepEqual(restoreReferenceProfile(invalidSnapshot), emptyReferenceProfile());
  }
  assert.deepEqual(restoreReferenceProfile(null), emptyReferenceProfile());
});

test('reference evaluation cannot change clinical calculations, confirmations or the existing CRP denominator', () => {
  const data = { ...input(), crp: 10, clinicalProfile: { measures: { crpULN: 5, markerDate: '2026-10-27', markerConfirmed: true } }, inputErrors: ['potassium'] };
  const before = structuredClone(data), core = evaluate(data);
  const crpRatio = () => evaluateMarkers(data, data.clinicalProfile.measures).find(row => row.id === 'crp').values.crpRatio;
  assert.equal(crpRatio(), 2);
  const references = evaluateReferenceProfile(freeze(data), freeze(profile('crp', 0, 1)), { applicabilityConfirmed: true });
  assert.equal(references.results.find(row => row.analyte === 'crp').status, 'above');
  assert.deepEqual(data, before);
  assert.deepEqual(evaluate(data), core);
  assert.equal(data.clinicalProfile.measures.crpULN, 5);
  assert.equal(crpRatio(), 2);
  assert.equal(references.clinicalValidation, false);
});
