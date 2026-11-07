// Tests of the site copies, browser side (synthetic data; an in-memory site with the same rules as
// server/nutriclinic_vault.py, whose patterns are checked against the browser's here too).
// SPDX-License-Identifier: AGPL-3.0-only
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  newToken, isToken, newSiteCode, SITE_CODE, KEY, DECIMAL, CHOICE, AGE_BAND, SITE_UNITS, ageBand, bandAge, siteSchema, anonymize, siteApi, pushCases, wipeSite,
} from '../web/vault.mjs';
import { listCases, getCase, putCase, deleteCase, markSite, clearSiteMarks, newCaseId } from '../web/cases.mjs';

const memory = () => {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => { m.set(k, String(v)); }, removeItem: (k) => { m.delete(k); } };
};
const allowed = (k, v) => (k === 'age' ? AGE_BAND.test(String(v)) : typeof v === 'boolean' || typeof v === 'number'
  || (typeof v === 'string' && (v === '' || DECIMAL.test(v) || CHOICE.test(v) || SITE_UNITS.has(v))));
function fakeSite() {
  const rows = new Map(); // code -> { owner, updatedAt, data }
  const closed = new Set(); // tokens whose copies were all deleted (site storage turned off)
  const site = { rows, closed, calls: [], hook: null };
  site.fetch = async (url, init) => {
    site.calls.push({ url, init });
    const reply = (status, data) => ({ status, json: async () => (data === undefined ? Promise.reject(new Error('html')) : data) });
    const forced = site.hook ? await site.hook(init.method, url) : null;
    if (Array.isArray(forced)) return reply(forced[0], forced[1] === undefined ? undefined : { error: forced[1] });
    if (forced) return reply(forced, { error: 'forced' });
    const token = init.headers['X-Site-Token'];
    const code = decodeURIComponent(new URL(url).pathname.split('/').pop());
    if (init.method === 'GET') return reply(200, { cases: [...rows].filter(([, r]) => r.owner === token).map(([c, r]) => ({ code: c, updatedAt: r.updatedAt })) });
    if (init.method === 'PUT') {
      const body = JSON.parse(init.body);
      if (!Object.entries(body.data.values ?? {}).every(([k, v]) => KEY.test(k) && allowed(k, v))) return reply(400, { error: 'values' });
      if (closed.has(token)) return reply(410, { error: 'closed' });
      if (rows.has(code) && rows.get(code).owner !== token) return reply(409, { error: 'taken' });
      rows.set(code, { owner: token, updatedAt: body.updatedAt, data: body.data });
      return reply(200, {});
    }
    if (init.method === 'DELETE' && code === '') { for (const [c, r] of [...rows]) if (r.owner === token) rows.delete(c); closed.add(token); return reply(200, {}); }
    if (init.method === 'DELETE') { if (rows.get(code)?.owner === token) rows.delete(code); return reply(200, {}); }
    return reply(405, {});
  };
  return site;
}
// A small form like the application's: choices, numbers, a laboratory value with its unit, ticks.
const FIELDS = [
  { key: 'setting', type: 'seg', options: [{ value: 'icu' }, { value: 'ward' }] },
  { key: 'age', type: 'num' }, { key: 'sex', type: 'seg', options: [{ value: 'female' }, { value: 'male' }] },
  { key: 'weightKg', type: 'num' }, { key: 'fois', type: 'seg', options: [{ value: '1' }, { value: '7' }] },
  { key: 'potassium', type: 'lab' }, { key: 'checks-clinical', type: 'checks', items: [{ key: 'stroke' }, { key: 'trauma' }] },
];
const SCHEMA = siteSchema(FIELDS);
function device(site) {
  const store = memory();
  const dev = { store, token: newToken(), pending: [] };
  dev.api = siteApi({ fetch: site.fetch, base: 'https://sahnoroloji.org/nutriclinic/api/vault/', token: dev.token });
  dev.local = { list: () => listCases(store), mark: (id, code, at) => markSite(store, id, code, at) };
  dev.push = async (opts = {}) => {
    const res = await pushCases({ api: dev.api, local: dev.local, pending: [...dev.pending], engine: '1.9.1', schemaOf: () => SCHEMA, ...opts });
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

test('Age bands: five-year bands that start at the ages the rules use; the middle for calculations', () => {
  const cases = [[17, '0-17'], [18, '18-19'], ['19,9', '18-19'], [20, '20-24'], [64, '60-64'], [65, '65-69'], ['69.5', '65-69'], [70, '70-74'],
    [89, '85-89'], [90, '90+'], [104, '90+'], ['abc', null], [-1, null], [131, null], ['', null], ['67 yaş', null]];
  for (const [age, band] of cases) assert.equal(ageBand(age), band, String(age));
  assert.deepEqual(['65-69', '70-74', '18-19', '0-17', '90+', 'x'].map(bandAge), [67, 72, 18, 8, 92, null]);
  // The bands keep each side of the rules' ages: 65 (fibre, ONS), 70 (NRS 2002), 18 (adults).
  for (const age of [17, 18, 64, 65, 69, 70]) {
    const mid = bandAge(ageBand(age));
    assert.deepEqual([mid >= 18, mid >= 65, mid >= 70], [age >= 18, age >= 65, age >= 70], String(age));
  }
});

test('Anonymised copy: only the answers to the form, in their form; the age as a band; no label, no free text', () => {
  const data = {
    label: 'Yatak 5 - Ahmet',
    values: {
      setting: 'icu', age: '67', sex: 'Ahmet', weightKg: '78,5', fois: '7', potassium: '3,4', potassiumUnit: 'mEq/L', stroke: true, trauma: 'evet',
      note: 'Ahmet Yılmaz', heightCm: '172', 'bad key': '1',
    },
    product: { ons: { kcal: '300', unit: 'mL', brand: 'Marka', serving: 'iki kutu' }, en: { kcalPerMl: '1,5' }, form: 'powder', other: { a: 1 } },
    followup: [{ day: '2', kcal: '1200', protein: '60', note: 'gece' }, { day: '07.11.2026' }],
    decisions: { 'icu-protein': 'progressive-local', bad: 'Dr Ali' },
  };
  assert.deepEqual(anonymize(data, '1.9.1', SCHEMA), {
    values: { setting: 'icu', age: '65-69', weightKg: '78,5', fois: '7', potassium: '3,4', potassiumUnit: 'mEq/L', stroke: true },
    product: { ons: { kcal: '300', unit: 'mL' }, en: { kcalPerMl: '1,5' }, form: 'powder' },
    followup: [{ day: '2', kcal: '1200', protein: '60' }],
    decisions: { 'icu-protein': 'progressive-local' },
    engine: '1.9.1',
  });
  // A number field holding a name, a telephone number or a date leaves nothing; a unit must be the test's own.
  for (const typed of ['Ahmet', '05321234567', '07.11.1950', '1e9', '12345678901']) assert.deepEqual(anonymize({ values: { weightKg: typed } }, '', SCHEMA).values, {});
  assert.deepEqual(anonymize({ values: { potassiumUnit: 'g/dL' } }, '', SCHEMA).values, {});
  // Without a schema nothing of the values leaves.
  assert.deepEqual(anonymize(data, '1.9.1').values, {});
});

test('The site and this device use the same value rules', () => {
  const py = readFileSync(new URL('../server/nutriclinic_vault.py', import.meta.url), 'utf8');
  const pattern = (name) => new RegExp(`^(?:${py.match(new RegExp(`\\n${name} = re\\.compile\\(r'([^']+)'\\)`))[1]})$`);
  const samples = ['', '0', '7', '-0,25', '123456.123456', '1234567', '1.2.3', '1e9', 'icu', 'anuria12', 'Ahmet', 'a b', 'y'.repeat(24), 'y'.repeat(25),
    '65-69', '0-17', '90+', '100-104', '65-69 Ali', 'mmol/L', 'mEq/L', '10³/µL', 'potassiumUnit', 'bad key', '_x'];
  for (const [name, here] of [['DECIMAL', DECIMAL], ['AGE_BAND', AGE_BAND], ['KEY', KEY]]) {
    const there = pattern(name);
    for (const s of samples) assert.equal(there.test(s), here.test(s), `${name} ${s}`);
  }
  const set = (name) => new Set([...py.match(new RegExp(`\\n${name} = frozenset\\(\\[([^\\]]+)\\]\\)`))[1].matchAll(/'([^']+)'/g)].map((m) => m[1]));
  assert.deepEqual([...set('UNITS')].sort(), [...SITE_UNITS].sort());
  // The site knows exactly the answer words of the application's own questions (numeric answers are numbers), so
  // none is lost on the way and no other word is accepted.
  const app = readFileSync(new URL('../web/app.mjs', import.meta.url), 'utf8');
  const form = app.slice(app.indexOf('const yesNoUnknown'), app.indexOf('const flatFields'));
  const answers = [...new Set([...form.matchAll(/value: '([^']*)'/g)].map((m) => m[1]))];
  assert.ok(answers.length > 30);
  for (const v of answers) assert.ok(CHOICE.test(v) || DECIMAL.test(v), v);
  assert.deepEqual([...set('CHOICES')].sort(), answers.filter((v) => !DECIMAL.test(v)).sort());
});

test('Sending: each case gets a code; the label stays here; changes, deletions and taken codes are handled', async () => {
  const site = fakeSite();
  const A = device(site);
  const a1 = newCaseId();
  const a2 = newCaseId();
  putCase(A.store, { id: a1, label: 'Yatak 5 - Ahmet', data: { values: { age: '60', weightKg: 'Ahmet' } } }, at(1));
  putCase(A.store, { id: a2, data: { values: { age: '61' } } }, at(2));
  const first = await A.push();
  assert.deepEqual([first.sent, first.failed, first.remote], [2, 0, 2]);
  const code1 = getCase(A.store, a1).siteCode;
  assert.match(code1, SITE_CODE);
  // The site has the clinical values under the code, never the label; this device matches the code to the label.
  assert.equal(JSON.stringify([...site.rows.values()]).includes('Ahmet'), false);
  assert.deepEqual(site.rows.get(code1).data.values, { age: '60-64' });
  assert.equal(getCase(A.store, a1).label, 'Yatak 5 - Ahmet');
  assert.equal((await A.push()).sent, 0); // nothing changed
  // A change keeps the code and is sent again.
  putCase(A.store, { id: a1, label: 'Yatak 5 - Ahmet', data: { values: { age: '66' } } }, at(3));
  assert.equal(getCase(A.store, a1).siteCode, code1);
  assert.equal((await A.push()).sent, 1);
  assert.equal(site.rows.get(code1).data.values.age, '65-69');
  // A deletion here deletes the copy; another device cannot see or touch A's copies.
  const B = device(site);
  putCase(B.store, { id: newCaseId(), data: { values: { age: '70' } } }, at(4));
  await B.push();
  assert.equal((await B.push()).remote, 1);
  A.remove(a2);
  const del = await A.push();
  assert.deepEqual([del.deleted, A.pending.length, del.remote], [1, 0, 1]);
  assert.equal(site.rows.size, 2);
  // A new code that another device holds already is replaced by a new one.
  const taken = [...site.rows.keys()].find((c) => c !== code1);
  const a3 = newCaseId();
  putCase(A.store, { id: a3, data: { values: { age: '80' } } }, at(5));
  const codes = [taken, 'NC-0000-0001'];
  await A.push({ newCode: () => codes.shift() });
  assert.equal(getCase(A.store, a3).siteCode, 'NC-0000-0001');
  // So is a code this device recorded earlier that now belongs to another device (site storage reset meanwhile).
  markSite(A.store, a3, taken, getCase(A.store, a3).updatedAt.replace('20:05', '20:04'));
  await A.push({ newCode: () => 'NC-0000-0002' });
  assert.equal(getCase(A.store, a3).siteCode, 'NC-0000-0002');
  assert.equal(site.rows.get(taken).owner, B.token);
  // A copy whose case was deleted here while the site was unreachable is removed on the next sending.
  site.hook = () => 503;
  deleteCase(A.store, a3); // (no pending entry: as if the deletion had happened before the code was recorded)
  await assert.rejects(A.push(), (err) => err.status === 503);
  site.hook = null;
  const late = await A.push();
  assert.ok(late.deleted >= 1);
  assert.equal([...site.rows.keys()].some((c) => c.startsWith('NC-0000-')), false);
  assert.equal(getCase(A.store, a1).siteCode, code1);
  clearSiteMarks(A.store);
  assert.equal(getCase(A.store, a1).siteCode, null);
});

test('Sending: limits are told apart, a refused copy is retried, and nothing but the token identifies the device', async () => {
  const site = fakeSite();
  const A = device(site);
  const ids = [newCaseId(), newCaseId(), newCaseId()];
  ids.forEach((id, i) => putCase(A.store, { id, data: { values: { age: String(50 + i) } } }, at(i + 1)));
  // This device's room is full: the others are still tried (an update would pass).
  site.hook = (method) => (method === 'PUT' ? [507, 'case-limit'] : null);
  const full = await A.push();
  assert.deepEqual([full.sent, full.failed, full.limit], [0, 3, 'device']);
  // The site is full, or many new devices came from this address today, or nginx holds back: sending stops there.
  for (const [forced, limit, busy] of [[[507, 'full'], 'site', null], [[429, 'new-device-limit'], null, 'new-device'], [[429, undefined], null, 'rate']]) {
    site.hook = (method) => (method === 'PUT' ? forced : null);
    const res = await A.push();
    assert.deepEqual([res.failed, res.limit, res.busy], [1, limit, busy], String(forced));
  }
  site.hook = null;
  assert.equal((await A.push()).sent, 3);
  for (const call of site.calls) {
    assert.equal(call.init.credentials, 'omit');
    assert.deepEqual(Object.keys(call.init.headers).filter((h) => h !== 'Content-Type'), ['X-Site-Token']);
  }
});

test('Turning site storage off: sending stops at once, and every copy is deleted even when one arrives late', async () => {
  const site = fakeSite();
  const A = device(site);
  for (let i = 0; i < 4; i += 1) putCase(A.store, { id: newCaseId(), data: { values: { age: '40' } } }, at(i + 1));
  // Turned off after the first copy: nothing more is sent or marked.
  let on = true;
  site.hook = (method) => { if (method === 'PUT') on = false; return null; };
  const res = await A.push({ alive: () => on });
  assert.deepEqual([res.sent, res.stopped, site.rows.size], [1, true, 1]);
  site.hook = null;
  await A.push();
  assert.equal(site.rows.size, 4);
  // A sending under way reaches the site after the first deletion: the next round deletes it too.
  const late = { owner: A.token, updatedAt: at(9).toISOString(), data: { values: {} } };
  let rounds = 0;
  const waits = [];
  const api = { ...A.api, removeAll: async () => { rounds += 1; const r = await A.api.removeAll(); if (rounds === 1) site.rows.set('NC-0000-0099', late); return r; } };
  assert.equal(await wipeSite(api, { wait: async (ms) => { waits.push(ms); } }), true);
  assert.deepEqual([rounds, waits, [...site.rows.values()].filter((r) => r.owner === A.token).length], [2, [1000], 0]);
  // The site cannot be reached: not done (the device keeps the token and tries again later).
  site.hook = () => 503;
  assert.equal(await wipeSite(A.api, { wait: async () => {} }), false);
  site.hook = () => [401, 'token'];
  assert.equal(await wipeSite(A.api, { wait: async () => {} }), true);
  site.hook = null;
  // After the deletion the site refuses this token: a sending still under way (another tab, a request already on its
  // way) stores nothing, and the device is told so.
  putCase(A.store, { id: newCaseId(), data: { values: { age: '41' } } }, at(20));
  clearSiteMarks(A.store);
  const late2 = await A.push();
  assert.deepEqual([late2.sent, late2.closed, [...site.rows.values()].filter((r) => r.owner === A.token).length], [0, true, 0]);
});
