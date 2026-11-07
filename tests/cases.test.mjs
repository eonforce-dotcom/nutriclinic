// Tests of the cases kept on this device.
// SPDX-License-Identifier: AGPL-3.0-only
import test from 'node:test';
import assert from 'node:assert/strict';
import { CASES_KEY, MAX_CASES, newCaseId, isCaseId, deviceStorageOn, setDeviceStorage, listCases, getCase, putCase, renameCase, deleteCase, clearCases, currentCaseId, setCurrentCaseId, caseToReopen, cleanLabel } from '../web/cases.mjs';

const memory = () => {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => { m.set(k, String(v)); }, removeItem: (k) => { m.delete(k); } };
};

test('Device cases: add, replace, list last changed first, rename, delete, clear', () => {
  const s = memory();
  const a = newCaseId();
  const b = newCaseId();
  assert.ok(isCaseId(a) && isCaseId(b) && a !== b);
  assert.deepEqual(putCase(s, { id: a, label: 'Yatak 5', data: { values: { age: 60 } } }, new Date('2026-11-07T10:00:00Z')), { ok: true });
  assert.deepEqual(putCase(s, { id: b, data: { values: { age: 70 } }, view: 'result', step: 3 }, new Date('2026-11-07T11:00:00Z')), { ok: true });
  assert.deepEqual(listCases(s).map((c) => c.id), [b, a]);
  putCase(s, { id: a, label: 'Yatak 5', data: { values: { age: 61 } } }, new Date('2026-11-07T12:00:00Z'));
  const first = listCases(s)[0];
  assert.deepEqual([first.id, first.data.values.age, first.createdAt, first.label], [a, 61, '2026-11-07T10:00:00.000Z', 'Yatak 5']);
  assert.deepEqual([getCase(s, b).view, getCase(s, b).step], ['result', 3]);
  assert.ok(renameCase(s, b, '  Oda\n12  '));
  assert.equal(getCase(s, b).label, 'Oda 12');
  setCurrentCaseId(s, a);
  deleteCase(s, a);
  assert.equal(getCase(s, a), null);
  assert.equal(currentCaseId(s), null);
  clearCases(s);
  assert.equal(listCases(s).length, 0);
});

test('Device cases: limits, damaged storage, the on/off choice and the reopening window', () => {
  const s = memory();
  for (let i = 0; i < MAX_CASES; i += 1) assert.equal(putCase(s, { id: newCaseId(), data: { values: { i } } }).ok, true);
  assert.deepEqual(putCase(s, { id: newCaseId(), data: { values: {} } }), { ok: false, error: 'full' });
  assert.deepEqual(putCase(s, { id: listCases(s)[0].id, data: { values: { big: 'x'.repeat(200000) } } }), { ok: false, error: 'size' });
  assert.deepEqual(putCase(s, { id: 'bad', data: {} }), { ok: false, error: 'storage' });
  s.setItem(CASES_KEY, '{not json');
  assert.deepEqual(listCases(s), []);
  s.setItem(CASES_KEY, JSON.stringify([{ id: 'c-0123456789abcdef', updatedAt: '2026-11-07T10:00:00.000Z', data: { values: {} } }, { id: 'x', data: {} }, null, { id: 'c-0123456789abcdee', updatedAt: 'yesterday', data: {} }]));
  assert.equal(listCases(s).length, 1);
  assert.equal(deviceStorageOn(s), true);
  setDeviceStorage(s, false);
  assert.equal(deviceStorageOn(s), false);
  setDeviceStorage(s, true);
  assert.equal(deviceStorageOn(s), true);
  const t = memory();
  const id = newCaseId();
  putCase(t, { id, data: { values: { age: 50 } } }, new Date('2026-11-07T08:00:00Z'));
  setCurrentCaseId(t, id);
  assert.equal(caseToReopen(t, new Date('2026-11-07T19:00:00Z'))?.id, id);
  assert.equal(caseToReopen(t, new Date('2026-11-07T20:00:01Z')), null);
  assert.equal(cleanLabel('a'.repeat(60)).length, 40);
  const denied = { getItem: () => { throw new Error('denied'); }, setItem: () => { throw new Error('denied'); }, removeItem: () => {} };
  assert.equal(deviceStorageOn(denied), false);
  assert.deepEqual(putCase(denied, { id: newCaseId(), data: {} }), { ok: false, error: 'storage' });
  assert.equal(currentCaseId(denied), null);
});
