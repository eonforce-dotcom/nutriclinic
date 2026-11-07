// NutriClinic site copies, browser side. With "Also keep cases on the site" ticked, each case of this device is sent
// anonymised under a random case code such as NC-7K3P-Q2M9: only the answers to the form's questions (numbers, choices,
// ticks, laboratory units), the age only as a five-year band, the product label values, the follow-up and the chosen
// evidence options. The case label and anything else stay on this device, which keeps the whole case and matches the
// code to show the real case. On the site only this device and the administrator can see the copy. The fetch function
// and the device's case store are passed in, so everything here can be tested without a browser.
// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Gökay Duman
import { LABS, unitKey } from './labs.mjs';
import { PRODUCT_LIMITS } from './engine.mjs';

export const TOKEN_KEY = 'nc-staged.site.v1'; // this device's owner token (the site keeps only its SHA-256)
export const PENDING_KEY = 'nc-staged.sitedel.v1'; // case codes whose copies are still to be deleted on the site
export const WIPE_KEY = 'nc-staged.sitewipe.v1'; // tokens of a site storage turned off here whose copies are still to be deleted
export const SITE_CODE = /^NC-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}$/;
// The forms a value may take on the site; the server refuses anything else.
export const KEY = /^[A-Za-z][A-Za-z0-9]{0,40}$/;
export const DECIMAL = /^[+-]?[0-9]{1,6}([.,][0-9]{1,4})?$/;
export const CHOICE = /^[a-z][a-z0-9]{0,23}$/;
export const AGE_BAND = /^([0-9]{1,2}-[0-9]{1,2}|90\+)$/;
export const SITE_UNITS = new Set(Object.values(LABS).flatMap((lab) => lab.units.map(([u]) => u)));
const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'; // Crockford base32: no I, L, O, U
const random = (n, fill) => { const bytes = new Uint8Array(n); fill(bytes); return bytes; };
const base32 = (bytes) => {
  let bits = 0;
  let value = 0;
  let out = '';
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) { out += ALPHABET[(value >>> (bits - 5)) & 31]; bits -= 5; }
  }
  return out;
};
const defaultFill = (bytes) => globalThis.crypto.getRandomValues(bytes);

export const newToken = (fill = defaultFill) => btoa(String.fromCharCode(...random(32, fill))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
export const isToken = (t) => typeof t === 'string' && /^[A-Za-z0-9_-]{43}$/.test(t);
export const newSiteCode = (fill = defaultFill) => { const s = base32(random(5, fill)); return `NC-${s.slice(0, 4)}-${s.slice(4, 8)}`; };

const text = (v) => (typeof v === 'number' ? (Number.isFinite(v) ? String(v) : '') : typeof v === 'string' ? v.trim() : '');
// The age leaves the device only as a band: under 18, 18-19, five-year bands (20-24 ... 85-89) and 90 or over. The
// bands start at the ages the rules use (18, 65, 70).
export function ageBand(v) {
  const s = text(v);
  const x = DECIMAL.test(s) ? Number(s.replace(',', '.')) : NaN;
  if (!Number.isFinite(x) || x < 0 || x > 130) return null;
  if (x < 18) return '0-17';
  if (x >= 90) return '90+';
  const low = Math.floor(x / 5) * 5;
  return `${Math.max(18, low)}-${low + 4}`;
}
// The age the administrator's calculations use for a band: its middle, rounded down (65-69 -> 67), 92 for 90+.
export function bandAge(band) {
  if (band === '90+') return 92;
  const m = /^([0-9]{1,2})-([0-9]{1,2})$/.exec(String(band ?? ''));
  return m ? Math.floor((Number(m[1]) + Number(m[2])) / 2) : null;
}

// What may leave the device for each question of a case, from the form's own fields (the questions shown for that
// case): 'number', 'age', 'flag', or the set of the question's answers (choices; the units of a laboratory value).
export function siteSchema(fields) {
  const out = new Map();
  for (const f of fields) {
    if (f.type === 'num') out.set(f.key, f.key === 'age' ? 'age' : 'number');
    else if (f.type === 'lab') {
      out.set(f.key, 'number');
      if (LABS[f.key]) out.set(unitKey(f.key), new Set(LABS[f.key].units.map(([u]) => u)));
    } else if (f.type === 'seg') out.set(f.key, new Set((f.options ?? []).map((o) => o.value)));
    else if (f.type === 'checks') for (const c of f.items ?? []) out.set(c.key, 'flag');
  }
  return out;
}

// The anonymised copy. A value whose question is not in `schema`, or that does not have its question's form (a
// number typed as a number, one of the question's answers, a tick), stays on this device: no free text leaves it.
export function anonymize(data, engine, schema = new Map()) {
  const src = data?.values && typeof data.values === 'object' && !Array.isArray(data.values) ? data.values : {};
  const values = {};
  for (const [key, rule] of schema) {
    if (!KEY.test(key) || !Object.hasOwn(src, key)) continue;
    const v = src[key];
    if (rule === 'flag') { if (typeof v === 'boolean') values[key] = v; continue; }
    if (rule instanceof Set) {
      if (typeof v === 'string' && rule.has(v) && (CHOICE.test(v) || DECIMAL.test(v) || SITE_UNITS.has(v))) values[key] = v;
      continue;
    }
    const s = text(v);
    if (rule === 'age') { const band = ageBand(s); if (band) values[key] = band; } else if (rule === 'number' && DECIMAL.test(s)) values[key] = s;
  }
  const product = {};
  for (const path of Object.keys(PRODUCT_LIMITS)) {
    const [group, key] = path.split('.');
    const s = text(data?.product?.[group]?.[key]);
    if (DECIMAL.test(s)) (product[group] ??= {})[key] = s;
  }
  if (product.ons && ['mL', 'g'].includes(data?.product?.ons?.unit)) product.ons.unit = data.product.ons.unit;
  if (data?.product?.form === 'powder') product.form = 'powder';
  const followup = (Array.isArray(data?.followup) ? data.followup.slice(0, 31) : [])
    .map((r) => Object.fromEntries(['day', 'kcal', 'protein'].map((k) => [k, text(r?.[k])]).filter(([, s]) => DECIMAL.test(s))))
    .filter((r) => Object.keys(r).length);
  const decisions = Object.fromEntries(Object.entries(data?.decisions && typeof data.decisions === 'object' ? data.decisions : {})
    .filter(([k, v]) => /^[a-z][a-z0-9-]{0,40}$/.test(k) && typeof v === 'string' && /^[a-z0-9][a-z0-9-]{0,60}$/.test(v)).slice(0, 20));
  return { values, product, followup, decisions, ...(engine && /^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$/.test(engine) ? { engine } : {}) };
}

// HTTP calls; { status, data }. Cookies are never sent (the token is the only identity); `signal` stops every call
// when site storage is turned off on this device.
export function siteApi({ fetch, base, token, signal }) {
  const call = async (method, path, body) => {
    const res = await fetch(`${base}${path}`, {
      method, credentials: 'omit', cache: 'no-store', referrerPolicy: 'no-referrer', ...(signal ? { signal } : {}),
      headers: { 'X-Site-Token': token, ...(body ? { 'Content-Type': 'application/json' } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    let data = null;
    try { data = await res.json(); } catch { data = null; }
    return { status: res.status, data };
  };
  return {
    list: () => call('GET', ''), put: (code, body) => call('PUT', code, body), remove: (code) => call('DELETE', code), removeAll: () => call('DELETE', ''),
  };
}

// Deletes every copy of a device on the site, then checks that none is left: a sending under way when site storage
// was turned off may still arrive, so this repeats (at most `rounds` times, a second apart). true when none is left.
export async function wipeSite(api, { rounds = 3, wait = (ms) => new Promise((resolve) => { setTimeout(resolve, ms); }) } = {}) {
  for (let i = 0; i < rounds; i += 1) {
    if (i) await wait(1000);
    const res = await api.removeAll();
    if (res.status === 401) return true; // not a token the site accepts: it holds nothing for it
    if (res.status !== 200) return false;
    const listed = await api.list();
    if (listed.status !== 200 || !Array.isArray(listed.data?.cases)) return false;
    if (!listed.data.cases.length) return true;
  }
  return false;
}

// Brings the site in line with this device: deletions made here, copies whose case is no longer here, and new or
// changed cases (a case gets its code when it is first sent; a code that belongs to another device is replaced).
// local: { list(), mark(id, code, at) -> boolean }. pending: codes to delete; it is not changed: `done` in the result
// lists the ones settled. schemaOf(case): what of the case may be sent (siteSchema). alive(): false once site storage
// was turned off or changed here; nothing more is sent then. `closed`: the site refused the token (its copies were
// deleted when site storage was turned off). Throws { status } when the list cannot be read.
export async function pushCases({ api, local, pending = [], engine, schemaOf = () => new Map(), newCode = newSiteCode, alive = () => true }) {
  const out = { sent: 0, deleted: 0, failed: 0, limit: null, busy: null, remote: 0, done: [], stopped: false, closed: false };
  const stop = () => { if (alive()) return false; out.stopped = true; return true; };
  const listed = await api.list();
  if (listed.status !== 200 || !Array.isArray(listed.data?.cases)) throw Object.assign(new Error('list'), { status: listed.status });
  const remote = new Map(listed.data.cases.filter((c) => SITE_CODE.test(String(c?.code))).map((c) => [c.code, c.updatedAt]));
  const remove = async (code) => {
    const res = await api.remove(code);
    if (res.status === 200) { remote.delete(code); out.deleted += 1; return true; }
    out.failed += 1;
    return false;
  };
  for (const code of pending) {
    if (stop()) return out;
    if (!remote.has(code) || await remove(code)) out.done.push(code);
  }
  const cases = local.list();
  const here = new Set(cases.map((c) => c.siteCode).filter(Boolean));
  for (const code of [...remote.keys()]) {
    if (stop()) return out;
    if (!here.has(code)) await remove(code); // its case was deleted here
  }
  for (const c of cases) {
    if (c.siteCode && c.siteAt === c.updatedAt && remote.get(c.siteCode) === c.updatedAt) continue;
    if (stop()) return out;
    const body = { updatedAt: c.updatedAt, data: anonymize(c.data, engine, schemaOf(c)) };
    let code = c.siteCode ?? newCode();
    let res = await api.put(code, body);
    if (res.status === 409) { // the code belongs to another device (for example this device before its site storage was reset)
      if (stop()) return out;
      code = newCode();
      res = await api.put(code, body);
    }
    if (res.status === 200) {
      remote.set(code, c.updatedAt);
      out.sent += 1;
      if (!local.mark(c.id, code, c.updatedAt) && code !== c.siteCode && alive()) await remove(code); // the case was deleted meanwhile
      continue;
    }
    if (res.status === 410) { out.closed = true; break; } // this token's site storage was turned off: nothing more is sent
    out.failed += 1;
    const why = res.data?.error;
    if (res.status === 507) out.limit = why === 'case-limit' || why === 'owner-full' ? 'device' : 'site';
    if (res.status === 429) out.busy = why === 'new-device-limit' ? 'new-device' : 'rate';
    if (out.busy || out.limit === 'site') break; // the next ones would be refused the same way
  }
  out.remote = remote.size;
  return out;
}
