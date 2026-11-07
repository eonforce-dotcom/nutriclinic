// NutriClinic case vault, browser side: cases kept on the site as well, encrypted on this device with a key derived
// from the clinician's personal code (WebCrypto: HKDF-SHA-256, AES-GCM 256, the case id bound as additional data). The
// site receives only the encrypted text; the code and the key never leave the device. The fetch function and the
// device's case store are passed in, so everything here can be tested without a browser.
// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Gökay Duman

export const CODE_KEY = 'nc-staged.vault.v1';
export const PENDING_KEY = 'nc-staged.vaultdel.v1';
const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'; // Crockford base32: no I, L, O, U
const CODE_BYTES = 20;
const CASE_ID = /^c-[0-9a-f]{16}$/;
const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/;
const text = (s) => new TextEncoder().encode(s);
const hex = (bytes) => [...bytes].map((x) => x.toString(16).padStart(2, '0')).join('');
const b64 = (bytes) => btoa(String.fromCharCode(...bytes));
const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
const b64url = (bytes) => b64(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

// A new personal code: 20 random bytes as 32 characters, shown in groups of four.
export function newCode(fill = (bytes) => globalThis.crypto.getRandomValues(bytes)) {
  const bytes = new Uint8Array(CODE_BYTES);
  fill(bytes);
  let bits = 0;
  let value = 0;
  let out = '';
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) { out += ALPHABET[(value >>> (bits - 5)) & 31]; bits -= 5; }
  }
  return out;
}
// The code as typed: spaces and dashes ignored, lower case accepted, O read as 0 and I or L as 1. Null when invalid.
export function normalizeCode(input) {
  const s = String(input ?? '').toUpperCase().replace(/[\s-]/g, '').replace(/O/g, '0').replace(/[IL]/g, '1');
  return s.length === 32 && [...s].every((c) => ALPHABET.includes(c)) ? s : null;
}
export const formatCode = (code) => code.match(/.{4}/g).join('-');
function codeBytes(code) {
  const out = new Uint8Array(CODE_BYTES);
  let bits = 0;
  let value = 0;
  let n = 0;
  for (const c of code) {
    value = (value << 5) | ALPHABET.indexOf(c);
    bits += 5;
    if (bits >= 8) { out[n] = (value >>> (bits - 8)) & 255; n += 1; bits -= 8; }
  }
  return out;
}

// Account identifier, access token and case key, all derived from the code.
export async function vaultKeys(code, subtle = globalThis.crypto.subtle) {
  const ikm = await subtle.importKey('raw', codeBytes(code), 'HKDF', false, ['deriveBits', 'deriveKey']);
  const salt = text('nutriclinic-vault-v1');
  const bits = async (info, n) => new Uint8Array(await subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt, info: text(info) }, ikm, n * 8));
  const account = hex(await bits('account', 16));
  const auth = b64url(await bits('auth', 32));
  const key = await subtle.deriveKey({ name: 'HKDF', hash: 'SHA-256', salt, info: text('cases') }, ikm, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  return { account, auth, key };
}

export async function seal(key, record, subtle = globalThis.crypto.subtle) {
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await subtle.encrypt({ name: 'AES-GCM', iv, additionalData: text(record.id) }, key, text(JSON.stringify(record))));
  return { v: 1, iv: b64(iv), ct: b64(ct) };
}
// The case, or null when the text cannot be decrypted with this key or is not this case.
export async function unseal(key, id, payload, subtle = globalThis.crypto.subtle) {
  try {
    if (!payload || payload.v !== 1) return null;
    const plain = await subtle.decrypt({ name: 'AES-GCM', iv: unb64(payload.iv), additionalData: text(id) }, key, unb64(payload.ct));
    const record = JSON.parse(new TextDecoder().decode(plain));
    return record && record.id === id && record.data && typeof record.data === 'object' && ISO.test(String(record.updatedAt)) ? record : null;
  } catch {
    return null;
  }
}

// HTTP calls; { status, data }. Credentials are never sent (the access token is the only identity); `signal` stops
// every call when site storage is turned off on this device.
export function vaultApi({ fetch, base, account, auth, signal }) {
  const call = async (method, path, body) => {
    const res = await fetch(`${base}${account}/${path}`, {
      method, credentials: 'omit', cache: 'no-store', referrerPolicy: 'no-referrer', ...(signal ? { signal } : {}),
      headers: { 'X-Vault-Auth': auth, ...(body ? { 'Content-Type': 'application/json' } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    let data = null;
    try { data = await res.json(); } catch { data = null; }
    return { status: res.status, data };
  };
  return { create: () => call('POST', ''), list: () => call('GET', ''), get: (id) => call('GET', id), put: (id, body) => call('PUT', id, body) };
}

// Two-way sync of this device's cases with the site. The later change of a case wins (its last change time); a case
// deleted on one device is deleted on the others unless it was changed after the deletion.
// local: { list(), get(id), store(record) -> boolean, remove(id), pending(id) -> boolean (a deletion made here and not
// yet settled, read at the moment of asking) }. pending: the deletions made here when the sync starts; it is not
// changed: `done` in the result lists the ones settled (sent, or no longer needed). Every download checks that the case
// did not change, and was not deleted, here meanwhile. Throws { status } when the list cannot be read.
export async function syncVault({ api, key, local, pending = [], subtle }) {
  const out = { uploaded: 0, downloaded: 0, removed: 0, failed: 0, full: false, limit: false, remote: 0, done: [] };
  const listed = await api.list();
  if (listed.status !== 200 || !Array.isArray(listed.data?.cases)) throw Object.assign(new Error('list'), { status: listed.status });
  const remote = new Map(listed.data.cases.filter((c) => CASE_ID.test(c?.id) && Number.isInteger(c.revision) && ISO.test(String(c.updatedAt))).map((c) => [c.id, c]));
  const live = new Set([...remote.values()].filter((r) => !r.deleted).map((r) => r.id)); // cases on the site after the sync
  const waiting = new Set(); // deletions that could not be sent: these cases are neither downloaded nor uploaded now
  const refused = (res) => { out.failed += 1; if (res.status === 507) out.limit = true; };
  const upload = async (record, r) => {
    const res = await api.put(record.id, { baseRevision: r ? r.revision : null, updatedAt: record.updatedAt, payload: await seal(key, record, subtle) });
    if (res.status === 200) { out.uploaded += 1; live.add(record.id); } else refused(res);
  };
  for (const d of pending) {
    const r = remote.get(d.id);
    // Nothing to delete on the site, or the case was changed elsewhere after this deletion (then it is kept).
    if (!r || r.deleted || r.updatedAt > d.updatedAt) { out.done.push(d.id); continue; }
    const res = await api.put(d.id, { baseRevision: r.revision, updatedAt: d.updatedAt, deleted: true });
    if (res.status !== 200) { refused(res); waiting.add(d.id); continue; }
    remote.set(d.id, { id: d.id, revision: res.data.revision, updatedAt: d.updatedAt, deleted: true });
    live.delete(d.id);
    out.done.push(d.id);
  }
  for (const r of remote.values()) {
    if (waiting.has(r.id) || local.pending(r.id)) continue;
    const mine = local.get(r.id);
    if (r.deleted) {
      if (!mine) continue;
      if (mine.updatedAt > r.updatedAt) await upload(mine, r); // changed here after the deletion elsewhere: kept
      else { local.remove(r.id); out.removed += 1; }
      continue;
    }
    if (mine && mine.updatedAt > r.updatedAt) { await upload(mine, r); continue; }
    if (mine && mine.updatedAt === r.updatedAt) continue;
    const got = await api.get(r.id);
    const record = got.status === 200 && got.data?.payload ? await unseal(key, r.id, got.data.payload, subtle) : null;
    if (!record) { out.failed += 1; continue; }
    // Changed or deleted here during the download: the newer state of this device is kept (and sent next time).
    if ((local.get(r.id)?.updatedAt ?? null) !== (mine?.updatedAt ?? null) || local.pending(r.id)) continue;
    if (local.store(record)) out.downloaded += 1; else out.full = true;
  }
  for (const mine of local.list()) if (!remote.has(mine.id) && !waiting.has(mine.id)) await upload(mine, null);
  out.remote = live.size;
  return out;
}