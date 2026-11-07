// Tests of the site copies, browser side (synthetic data; an in-memory site with the same rules as
// server/nutriclinic_vault.py).
// SPDX-License-Identifier: AGPL-3.0-only
import test from 'node:test';
import assert from 'node:assert/strict';
import { newToken, isToken, newSiteCode, SITE_CODE, anonymize, siteApi, pushCases } from '../web/vault.mjs';
import { listCases, getCase, putCase, deleteCase, markSite, clearSiteMarks, newCaseId } from '../web/cases.mjs';

const memory = () => {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => { m.set(k, String(v)); }, removeItem: (k) => { m.delete(k); } };
};
function fakeSite() {
  const rows = new Map(); // code -> { owner, updatedAt, data }
  const site = { rows, calls: [], hook: null };
  site.fetch = async (url, init) => {
    site.calls.push({ url, init });
    const reply = (status, data) => ({ status, json: async () => data });
    const forced = site.hook ? await site.hook(init.method, url) : null;
    if (forced) return reply(forced, { error: 'forced' });
    const token = init.headers['X-Site-Token'];
    const code = decodeURIComponent(new URL(url).pathname.split('/').pop());
    if (init.method === 'GET') return reply(200, { cases: [...rows].filter(([, r]) => r.owner === token).map(([c, r]) => ({ code: c, updatedAt: r.updatedAt })) });
    if (init.method === 'PUT') {
      const body = JSON.parse(init.body);
      if (JSON.stringify(body.data).includes(' ')) return reply(400, { error: 'values' });
      if (rows.has(code) && rows.get(code).owner !== token) return reply(409, { error: 'taken' });
      rows.set(code, { owner: token, updatedAt: body.updatedAt, data: body.data });
      return reply(200, {});
    }
    if (init.method === 'DELETE') { if (rows.get(code)?.owner === token) rows.delete(code); return reply(200, {}); }
    return reply(405, {});
  };
  return site;
}
function device(site) {
  const store = memory();
  const dev = { store, token: newToken(), pending: [] };
  dev.api = siteApi({ fetch: site.fetch, base: 'https://sahnoroloji.org/nutriclinic/api/vault/', token: dev.token });
  dev.local = { list: () => listCases(store), mark: (id, code, at) => markSite(store, id, code, at) };
  dev.push = async (opts = {}) => {
    const res = await pushCases({ api: dev.api, local: dev.local, pending: [...dev.pending], engine: '1.9.0', ...opts });
    dev.pending = dev.pending.filter((c) => !res.done.includes(c));
    return res;
  };
  dev.remove = (id) => { const c = getCase(store, id); deleteCase(store, id); if (c?.siteCode) dev.pending.push(c.siteCode); };
  return dev;
}
const at = (minute) => new Date(Date.UTC(2026, 10, 7, 20, minute));

test('Codes and tokens: case codes of the form NC-XXXX-XXXX, 43-character tokens', () => {
  const codes = new Set(Array.from({ length: 200 }, () => newSiteCode()));
  assert.equal(codes.size, 200);
  for (const c of codes) assert.match(c, SITE_CODE);
  assert.ok(isToken(newToken()));
  assert.equal(isToken('short'), false);
});

test('Anonymised copy: no label, no free text, only clinical values', () => {
  const data = {
    values: { setting: 'icu', age: '67', sex: 'male', weightKg: 78, stroke: true, note: 'Ahmet Yılmaz', 'bad key': '1', x: 'a\nb' },
    product: { ons: { kcal: '300', unit: 'mL', brand: 'iki kutu' }, form: 'powder', other: { a: 1 } },
    followup: [{ day: '2', kcal: '1200', protein: '60', note: 'gece' }],
    decisions: { 'icu-protein': 'progressive-local', bad: 'Dr Ali' },
  };
  const copy = anonymize(data, '1.9.0');
  assert.deepEqual(copy, {
    values: { setting: 'icu', age: '67', sex: 'male', weightKg: 78, stroke: true },
    product: { ons: { kcal: '300', unit: 'mL' }, form: 'powder' },
    followup: [{ day: '2', kcal: '1200', protein: '60' }],
    decisions: { 'icu-protein': 'progressive-local' },
    engine: '1.9.0',
  });
});

test('Sending: each case gets a code; the label stays here; changes, deletions and taken codes are handled', async () => {
  const site = fakeSite();
  const A = device(site);
  const a1 = newCaseId();
  const a2 = newCaseId();
  putCase(A.store, { id: a1, label: 'Yatak 5 - Ahmet', data: { values: { age: '60' } } }, at(1));
  putCase(A.store, { id: a2, data: { values: { age: '61' } } }, at(2));
  const first = await A.push();
  assert.deepEqual([first.sent, first.failed, first.remote], [2, 0, 2]);
  const code1 = getCase(A.store, a1).siteCode;
  assert.match(code1, SITE_CODE);
  // The site has the clinical values under the code, never the label; this device matches the code to the label.
  assert.equal(JSON.stringify([...site.rows.values()]).includes('Yatak'), false);
  assert.deepEqual(site.rows.get(code1).data.values, { age: '60' });
  assert.equal(getCase(A.store, a1).label, 'Yatak 5 - Ahmet');
  assert.equal((await A.push()).sent, 0); // nothing changed
  // A change keeps the code and is sent again.
  putCase(A.store, { id: a1, label: 'Yatak 5 - Ahmet', data: { values: { age: '62' } } }, at(3));
  assert.equal(getCase(A.store, a1).siteCode, code1);
  assert.equal((await A.push()).sent, 1);
  assert.equal(site.rows.get(code1).data.values.age, '62');
  // A deletion here deletes the copy; another device cannot see or touch A's copies.
  const B = device(site);
  putCase(B.store, { id: newCaseId(), data: { values: { age: '70' } } }, at(4));
  await B.push();
  assert.equal((await B.push()).remote, 1);
  A.remove(a2);
  const del = await A.push();
  assert.deepEqual([del.deleted, A.pending.length, del.remote], [1, 0, 1]);
  assert.equal(site.rows.size, 2);
  // A code already taken by another device is replaced by a new one.
  const taken = [...site.rows.keys()].find((c) => c !== code1);
  const a3 = newCaseId();
  putCase(A.store, { id: a3, data: { values: { age: '80' } } }, at(5));
  const codes = [taken, 'NC-0000-0001'];
  await A.push({ newCode: () => codes.shift() });
  assert.equal(getCase(A.store, a3).siteCode, 'NC-0000-0001');
  // A copy whose case was deleted here while the site was unreachable is removed on the next sending.
  site.hook = () => 503;
  deleteCase(A.store, a3); // (no pending entry: as if the deletion had happened before the code was recorded)
  await assert.rejects(A.push(), (err) => err.status === 503);
  site.hook = null;
  const late = await A.push();
  assert.equal(late.deleted, 1);
  assert.equal(site.rows.has('NC-0000-0001'), false);
  // Turning site storage off: every copy is deleted, the codes are forgotten here.
  for (const c of listCases(A.store)) A.pending.push(c.siteCode);
  await A.push({ local: { list: () => [], mark: () => false } });
  clearSiteMarks(A.store);
  assert.deepEqual([...site.rows.values()].filter((r) => r.owner === A.token), []);
  assert.equal(getCase(A.store, a1).siteCode, null);
});

test('Sending: a refused copy is retried, the room limit is reported, and cookies are never sent', async () => {
  const site = fakeSite();
  const A = device(site);
  const id = newCaseId();
  putCase(A.store, { id, data: { values: { age: '50' } } }, at(1));
  site.hook = (method) => (method === 'PUT' ? 507 : null);
  const full = await A.push();
  assert.deepEqual([full.sent, full.failed, full.limit, getCase(A.store, id).siteCode], [0, 1, true, null]);
  site.hook = null;
  assert.equal((await A.push()).sent, 1);
  const call = site.calls.find((c) => c.init.method === 'GET');
  assert.deepEqual([call.init.credentials, call.init.headers['Content-Type'], typeof call.init.headers['X-Site-Token']], ['omit', undefined, 'string']);
});
