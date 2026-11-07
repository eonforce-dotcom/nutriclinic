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
  const fetch = async (url, init) => {
    calls.push({ url, init });
    const [, account, id] = /\/vault\/([0-9a-f]{32})\/(.*)$/.exec(new URL(url).pathname) ?? [];
    const reply = (status, data) => ({ status, json: async () => data });
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
  return { fetch, accounts, calls };
}
async function device(server, code) {
  const store = memory();
  const keys = await vaultKeys(code);
  const api = vaultApi({ fetch: server.fetch, base: 'https://sahnoroloji.org/nutriclinic/api/vault/', account: keys.account, auth: keys.auth });
  const local = { list: () => listCases(store), get: (id) => getCase(store, id), store: (r) => storeCase(store, r), remove: (id) => deleteCase(store, id) };
  const pending = [];
  return { store, keys, api, local, pending, sync: () => syncVault({ api, key: keys.key, local, pending }) };
}
const at = (minute) => new Date(Date.UTC(2026, 10, 7, 20, minute));

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

test('Sync between two devices: upload, download, newer change wins, deletions travel, conflicts retried', async () => {
  const server = fakeServer();
  const code = newCode();
  const A = await device(server, code);
  assert.equal((await A.api.create()).status, 201);
  const a1 = newCaseId();
  const a2 = newCaseId();
  putCase(A.store, { id: a1, label: 'A1', data: { values: { age: '60' } } }, at(1));
  putCase(A.store, { id: a2, data: { values: { age: '61' } } }, at(2));
  assert.deepEqual(await A.sync(), { uploaded: 2, downloaded: 0, removed: 0, failed: 0, full: false, remote: 2 });
  // The site holds encrypted text only.
  assert.equal(JSON.stringify([...server.accounts.values()][0].cases.get(a1)).includes('A1'), false);
  const B = await device(server, code);
  assert.equal((await B.sync()).downloaded, 2);
  assert.deepEqual(getCase(B.store, a1).data, { values: { age: '60' } });
  assert.equal(getCase(B.store, a1).updatedAt, getCase(A.store, a1).updatedAt);
  assert.equal((await B.sync()).uploaded, 0);
  // B changes a1; A receives it.
  putCase(B.store, { id: a1, label: 'A1', data: { values: { age: '65' } } }, at(3));
  assert.equal((await B.sync()).uploaded, 1);
  assert.equal((await A.sync()).downloaded, 1);
  assert.equal(getCase(A.store, a1).data.values.age, '65');
  // A deletes a2; B loses it on its next sync.
  deleteCase(A.store, a2);
  A.pending.push({ id: a2, updatedAt: at(4).toISOString() });
  await A.sync();
  assert.equal(A.pending.length, 0);
  assert.equal((await B.sync()).removed, 1);
  assert.equal(getCase(B.store, a2), null);
  // Both change a1; the later change wins on both devices.
  putCase(B.store, { id: a1, data: { values: { age: '66' } } }, at(5));
  putCase(A.store, { id: a1, data: { values: { age: '67' } } }, at(6));
  await B.sync();
  await A.sync();
  await B.sync();
  assert.deepEqual([getCase(A.store, a1).data.values.age, getCase(B.store, a1).data.values.age], ['67', '67']);
  // A case changed after its deletion elsewhere is kept and goes back to the site.
  const a3 = newCaseId();
  putCase(A.store, { id: a3, data: { values: { age: '70' } } }, at(7));
  await A.sync();
  await B.sync();
  deleteCase(A.store, a3);
  A.pending.push({ id: a3, updatedAt: at(8).toISOString() });
  putCase(B.store, { id: a3, data: { values: { age: '71' } } }, at(9));
  await A.sync();
  const kept = await B.sync();
  assert.equal(kept.uploaded, 1);
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

test('Sync: a wrong or unknown code reads nothing; a full device stops downloading; calls carry no cookies', async () => {
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
  const res = await B.sync();
  assert.equal(res.full, true);
  assert.equal(listCases(B.store).length, MAX_CASES);
  const get = server.calls.find((c) => c.init.method === 'GET');
  assert.deepEqual([get.init.credentials, get.init.headers['Content-Type'], typeof get.init.headers['X-Vault-Auth']], ['omit', undefined, 'string']);
});
