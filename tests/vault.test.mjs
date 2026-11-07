// Tests of the case vault, browser side (synthetic data; an in-memory server with the same rules as
// server/nutriclinic_vault.py).
// SPDX-License-Identifier: AGPL-3.0-only
import test from 'node:test';
import assert from 'node:assert/strict';
import { newCode, normalizeCode, formatCode, vaultKeys, seal, unseal, vaultApi, syncVault } from '../web/vault.mjs';
import { listCases, getCase, putCase, storeCase, deleteCase, newCaseId, MAX_CASES } from '../web/cases.mjs';

const memory = () => {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => { m.set(k, String(v)); }, removeItem: (k) => { m.delete(k); } };
};
function fakeServer() {
  const accounts = new Map();
  const calls = [];
  const server = { accounts, calls, hook: null };
  server.fetch = async (url, init) => {
    calls.push({ url, init });
    const [, account, id] = /\/vault\/([0-9a-f]{32})\/(.*)$/.exec(new URL(url).pathname) ?? [];
    const reply = (status, data) => ({ status, json: async () => data });
    const forced = server.hook ? await server.hook(init.method, id, init.body ? JSON.parse(init.body) : null) : null;
    if (forced) return reply(forced, { error: 'forced' });
    const acc = accounts.get(account);
    if (init.method === 'POST' && id === '') { if (acc) return reply(409, { error: 'exists' }); accounts.set(account, { auth: init.headers['X-Vault-Auth'], cases: new Map() }); return reply(201, {}); }
    if (!acc) return reply(404, { error: 'no-account' });
    if (acc.auth !== init.headers['X-Vault-Auth']) return reply(401, { error: 'auth' });
    if (init.method === 'GET' && id === '') return reply(200, { cases: [...acc.cases.values()].map((r) => ({ id: r.id, revision: r.revision, updatedAt: r.updatedAt, deleted: Boolean(r.deleted) })) });
    if (init.method === 'GET') { const r = acc.cases.get(id); return r ? reply(200, r) : reply(404, { error: 'not-found' }); }
    if (init.method === 'PUT') {
      const body = JSON.parse(init.body);
      const cur = acc.cases.get(id);
      if ((cur ? cur.revision : null) !== body.baseRevision) return reply(409, { error: 'conflict', revision: cur?.revision ?? null });
      const rec = { id, revision: (cur?.revision ?? 0) + 1, updatedAt: body.updatedAt, ...(body.deleted ? { deleted: true } : { payload: body.payload }) };
      acc.cases.set(id, rec);
      return reply(200, { revision: rec.revision });
    }
    return reply(405, { error: 'method' });
  };
  return server;
}
// A device as the page runs it: its own store, the deletions made here, and the settled ones removed after each sync.
async function device(server, code) {
  const store = memory();
  const keys = await vaultKeys(code);
  const dev = { store, keys, pending: [] };
  dev.api = vaultApi({ fetch: server.fetch, base: 'https://sahnoroloji.org/nutriclinic/api/vault/', account: keys.account, auth: keys.auth });
  dev.local = { list: () => listCases(store), get: (id) => getCase(store, id), store: (r) => storeCase(store, r), remove: (id) => deleteCase(store, id), pending: (id) => dev.pending.some((d) => d.id === id) };
  dev.sync = async () => {
    const res = await syncVault({ api: dev.api, key: keys.key, local: dev.local, pending: [...dev.pending] });
    dev.pending = dev.pending.filter((d) => !res.done.includes(d.id));
    return res;
  };
  dev.remove = (id, when) => { deleteCase(store, id); dev.pending.push({ id, updatedAt: when.toISOString() }); };
  return dev;
}
const at = (minute) => new Date(Date.UTC(2026, 10, 7, 20, minute));
const live = (server) => [...[...server.accounts.values()][0].cases.values()].filter((r) => !r.deleted).map((r) => r.id);

test('Personal code: 32 characters, typed forms accepted, keys derived from it', async () => {
  const code = newCode();
  assert.match(code, /^[0-9A-HJKMNP-TV-Z]{32}$/);
  assert.equal(normalizeCode(formatCode(code).toLowerCase()), code);
  assert.equal(normalizeCode('O0IL'.repeat(8)), '0011'.repeat(8));
  assert.equal(normalizeCode('ABC'), null);
  assert.equal(normalizeCode('U'.repeat(32)), null);
  const a = await vaultKeys(code);
  const b = await vaultKeys(normalizeCode(formatCode(code)));
  const c = await vaultKeys(newCode());
  assert.match(a.account, /^[0-9a-f]{32}$/);
  assert.match(a.auth, /^[A-Za-z0-9_-]{43}$/);
  assert.deepEqual([a.account, a.auth], [b.account, b.auth]);
  assert.notEqual(a.account, c.account);
  assert.equal(a.key.extractable, false);
});

test('Encryption: only the same code and the same case open the text; any change is detected', async () => {
  const { key } = await vaultKeys(newCode());
  const other = (await vaultKeys(newCode())).key;
  const record = { id: newCaseId(), label: 'Yatak 3', createdAt: '2026-11-07T20:00:00.000Z', updatedAt: '2026-11-07T20:00:00.000Z', view: 'cards', step: 1, data: { values: { age: '70' } } };
  const payload = await seal(key, record);
  assert.equal(JSON.stringify(payload).includes('Yatak'), false);
  assert.deepEqual(await unseal(key, record.id, payload), record);
  assert.equal(await unseal(other, record.id, payload), null);
  assert.equal(await unseal(key, newCaseId(), payload), null);
  const ct = Uint8Array.from(atob(payload.ct), (ch) => ch.charCodeAt(0));
  ct[0] ^= 1;
  assert.equal(await unseal(key, record.id, { ...payload, ct: btoa(String.fromCharCode(...ct)) }), null);
});

test('Sync between two devices: upload, download, newer change wins, deletions travel, conflicts settled', async () => {
  const server = fakeServer();
  const code = newCode();
  const A = await device(server, code);
  assert.equal((await A.api.create()).status, 201);
  const a1 = newCaseId();
  const a2 = newCaseId();
  putCase(A.store, { id: a1, label: 'A1', data: { values: { age: '60' } } }, at(1));
  putCase(A.store, { id: a2, data: { values: { age: '61' } } }, at(2));
  assert.deepEqual(await A.sync(), { uploaded: 2, downloaded: 0, removed: 0, failed: 0, full: false, limit: false, remote: 2, done: [] });
  assert.equal(JSON.stringify([...server.accounts.values()][0].cases.get(a1)).includes('A1'), false);
  const B = await device(server, code);
  assert.equal((await B.sync()).downloaded, 2);
  assert.deepEqual(getCase(B.store, a1).data, { values: { age: '60' } });
  assert.equal(getCase(B.store, a1).updatedAt, getCase(A.store, a1).updatedAt);
  assert.equal((await B.sync()).uploaded, 0);
  putCase(B.store, { id: a1, label: 'A1', data: { values: { age: '65' } } }, at(3));
  assert.equal((await B.sync()).uploaded, 1);
  assert.equal((await A.sync()).downloaded, 1);
  assert.equal(getCase(A.store, a1).data.values.age, '65');
  A.remove(a2, at(4));
  assert.deepEqual((await A.sync()).done, [a2]);
  assert.equal(A.pending.length, 0);
  assert.equal((await B.sync()).removed, 1);
  assert.equal(getCase(B.store, a2), null);
  putCase(B.store, { id: a1, data: { values: { age: '66' } } }, at(5));
  putCase(A.store, { id: a1, data: { values: { age: '67' } } }, at(6));
  await B.sync();
  await A.sync();
  await B.sync();
  assert.deepEqual([getCase(A.store, a1).data.values.age, getCase(B.store, a1).data.values.age], ['67', '67']);
  // Changed after its deletion elsewhere: kept, and back on the site.
  const a3 = newCaseId();
  putCase(A.store, { id: a3, data: { values: { age: '70' } } }, at(7));
  await A.sync();
  await B.sync();
  A.remove(a3, at(8));
  putCase(B.store, { id: a3, data: { values: { age: '71' } } }, at(9));
  await A.sync();
  assert.equal((await B.sync()).uploaded, 1);
  assert.equal((await A.sync()).downloaded, 1);
  assert.equal(getCase(A.store, a3).data.values.age, '71');
  // A stale revision is refused and settled on the next sync.
  const real = A.api.put;
  A.api.put = (id, body) => real(id, { ...body, baseRevision: 999 });
  putCase(A.store, { id: a1, data: { values: { age: '68' } } }, at(10));
  assert.equal((await A.sync()).failed, 1);
  A.api.put = real;
  assert.equal((await A.sync()).uploaded, 1);
});

test('Sync (independent review): deletions are never lost or undone, and a newer edit is never overwritten', async () => {
  const server = fakeServer();
  const code = newCode();
  const A = await device(server, code);
  await A.api.create();
  const [x, y, z] = [newCaseId(), newCaseId(), newCaseId()];
  for (const [i, id] of [x, y, z].entries()) putCase(A.store, { id, data: { values: { i } } }, at(i));
  await A.sync();
  // A deletion made while a sync runs stays pending and is sent next time; the sync does not bring the case back.
  A.remove(x, at(10));
  server.hook = (method) => { if (method === 'GET') { server.hook = null; A.remove(y, at(11)); } return null; };
  const B = await device(server, code);
  await B.sync(); // (the hook fires on B's first GET; it only stands for "a deletion on A during a sync")
  server.hook = async (method) => { if (method === 'PUT' && !A.removedDuring) { A.removedDuring = true; A.remove(z, at(12)); } return null; };
  const first = await A.sync();
  assert.ok(first.done.includes(x));
  assert.ok(A.pending.some((d) => d.id === z), 'the deletion made during the sync is kept');
  server.hook = null;
  await A.sync();
  assert.deepEqual(A.pending, []);
  assert.deepEqual(live(server), []);
  assert.deepEqual(listCases(A.store), []);
  // A refused deletion (429) keeps its case off this device and is sent later.
  const w = newCaseId();
  putCase(A.store, { id: w, data: { values: { w: 1 } } }, at(20));
  await A.sync();
  A.remove(w, at(21));
  server.hook = (method, id, body) => (method === 'PUT' && body?.deleted ? 429 : null);
  const refused = await A.sync();
  assert.deepEqual([refused.downloaded, refused.done.length, getCase(A.store, w)], [0, 0, null]);
  server.hook = null;
  await A.sync();
  assert.deepEqual([A.pending.length, live(server).includes(w)], [0, false]);
  // An edit saved during a download is not overwritten by the older copy from the site.
  const v = newCaseId();
  putCase(A.store, { id: v, data: { values: { weight: '72' } } }, at(30));
  await A.sync();
  const C = await device(server, code);
  putCase(C.store, { id: v, data: { values: { weight: '70' } } }, at(29)); // older copy here
  server.hook = (method, id) => { if (method === 'GET' && id === v) { server.hook = null; putCase(C.store, { id: v, data: { values: { weight: '69' } } }, at(31)); } return null; };
  await C.sync();
  assert.equal(getCase(C.store, v).data.values.weight, '69');
  await C.sync();
  await A.sync();
  assert.equal(getCase(A.store, v).data.values.weight, '69');
  // An older deletion does not delete a newer version on the site.
  const u = newCaseId();
  putCase(A.store, { id: u, data: { values: { u: 1 } } }, at(40));
  await A.sync();
  await C.sync();
  C.remove(u, at(41));
  putCase(A.store, { id: u, data: { values: { u: 2 } } }, at(42));
  await A.sync();
  const late = await C.sync();
  assert.ok(late.done.includes(u));
  assert.ok(live(server).includes(u));
  await C.sync();
  assert.equal(getCase(C.store, u).data.values.u, 2);
  // A deletion of a case the site never had sends nothing.
  const t = newCaseId();
  putCase(C.store, { id: t, data: {} }, at(50));
  C.remove(t, at(51));
  const before = server.calls.length;
  assert.deepEqual((await C.sync()).done, [t]);
  assert.equal(server.calls.slice(before).filter((c) => c.init.method === 'PUT').length, 0);
});

test('Sync: a wrong or unknown code reads nothing; a full device stops downloading; the site refusing room is reported', async () => {
  const server = fakeServer();
  const code = newCode();
  const A = await device(server, code);
  await A.api.create();
  for (let i = 0; i < 3; i += 1) putCase(A.store, { id: newCaseId(), data: { values: { i } } }, at(i));
  await A.sync();
  const stranger = await device(server, newCode());
  await assert.rejects(stranger.sync(), (err) => err.status === 404);
  const forged = vaultApi({ fetch: server.fetch, base: 'https://sahnoroloji.org/nutriclinic/api/vault/', account: A.keys.account, auth: 'x'.repeat(43) });
  assert.equal((await forged.list()).status, 401);
  const B = await device(server, code);
  for (let i = 0; i < MAX_CASES; i += 1) putCase(B.store, { id: newCaseId(), data: { values: { j: i } } }, at(30));
  server.hook = (method, id, body) => (method === 'PUT' && body?.payload ? 507 : null);
  const res = await B.sync();
  assert.deepEqual([res.full, res.limit], [true, true]);
  assert.equal(listCases(B.store).length, MAX_CASES);
  const get = server.calls.find((c) => c.init.method === 'GET');
  assert.deepEqual([get.init.credentials, get.init.headers['Content-Type'], typeof get.init.headers['X-Vault-Auth']], ['omit', undefined, 'string']);
});
