// NutriClinic site copies, browser side. With "Also keep cases on the site" ticked, each case of this device is sent
// anonymised - without its label (the only free text in a case) - under a random case code such as NC-7K3P-Q2M9; this
// device keeps the label and the whole case and matches the code to show the real case. On the site only this device
// and the administrator can see the copy. The fetch function and the device's case store are passed in, so everything
// here can be tested without a browser.
// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Gökay Duman

export const TOKEN_KEY = 'nc-staged.site.v1'; // this device's owner token (the site keeps only its SHA-256)
export const PENDING_KEY = 'nc-staged.sitedel.v1'; // case codes whose copies are still to be deleted on the site
export const SITE_CODE = /^NC-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}$/;
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

// The anonymised copy: the clinical values only. The label, the screen position and the times stay on this device;
// a value that is not a number, true/false or a short word without spaces is left out, so no free text leaves it.
export function anonymize(data, engine) {
  const plain = (v, n) => typeof v === 'boolean' || (typeof v === 'number' && Number.isFinite(v))
    || (typeof v === 'string' && (v === '' || (v.length <= n && /^[^\s\u0000-\u001f\u007f]+$/.test(v))));
  const fields = (o, n) => Object.fromEntries(Object.entries(o && typeof o === 'object' ? o : {}).filter(([k, v]) => /^[A-Za-z][A-Za-z0-9]{0,40}$/.test(k) && plain(v, n)).slice(0, 400));
  const product = {};
  for (const g of ['en', 'ons', 'module', 'powder']) if (data?.product?.[g] && typeof data.product[g] === 'object') product[g] = Object.fromEntries(Object.entries(fields(data.product[g], 20)).slice(0, 20));
  if (data?.product?.form === 'powder') product.form = 'powder';
  return {
    values: fields(data?.values, 40),
    product,
    followup: (Array.isArray(data?.followup) ? data.followup.slice(0, 31) : []).map((r) => Object.fromEntries(['day', 'kcal', 'protein'].filter((k) => plain(r?.[k], 12)).map((k) => [k, r[k]]))),
    decisions: Object.fromEntries(Object.entries(data?.decisions && typeof data.decisions === 'object' ? data.decisions : {})
      .filter(([k, v]) => /^[a-z][a-z0-9-]{0,40}$/.test(k) && typeof v === 'string' && /^[a-z0-9][a-z0-9-]{0,60}$/.test(v)).slice(0, 20)),
    ...(engine && /^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$/.test(engine) ? { engine } : {}),
  };
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
  return { list: () => call('GET', ''), put: (code, body) => call('PUT', code, body), remove: (code) => call('DELETE', code) };
}

// Brings the site in line with this device: deletions made here, copies whose case is no longer here, and new or
// changed cases (a case gets its code when it is first sent; a code taken by another device is replaced).
// local: { list(), mark(id, code, at) -> boolean }. pending: codes to delete; it is not changed: `done` in the result
// lists the ones settled. Throws { status } when the list cannot be read.
export async function pushCases({ api, local, pending = [], engine, newCode = newSiteCode }) {
  const out = { sent: 0, deleted: 0, failed: 0, limit: false, remote: 0, done: [] };
  const listed = await api.list();
  if (listed.status !== 200 || !Array.isArray(listed.data?.cases)) throw Object.assign(new Error('list'), { status: listed.status });
  const remote = new Map(listed.data.cases.filter((c) => SITE_CODE.test(String(c?.code))).map((c) => [c.code, c.updatedAt]));
  const remove = async (code) => {
    const res = await api.remove(code);
    if (res.status === 200) { remote.delete(code); out.deleted += 1; return true; }
    out.failed += 1;
    return false;
  };
  for (const code of pending) if (!remote.has(code) || await remove(code)) out.done.push(code);
  const cases = local.list();
  const here = new Set(cases.map((c) => c.siteCode).filter(Boolean));
  for (const code of [...remote.keys()]) if (!here.has(code)) await remove(code); // its case was deleted here
  for (const c of cases) {
    if (c.siteCode && c.siteAt === c.updatedAt && remote.get(c.siteCode) === c.updatedAt) continue;
    const body = { updatedAt: c.updatedAt, data: anonymize(c.data, engine) };
    let code = c.siteCode ?? newCode();
    let res = await api.put(code, body);
    if (res.status === 409 && !c.siteCode) { code = newCode(); res = await api.put(code, body); }
    if (res.status === 200) {
      remote.set(code, c.updatedAt);
      out.sent += 1;
      if (!local.mark(c.id, code, c.updatedAt) && !c.siteCode) await remove(code); // the case was deleted meanwhile
    } else {
      out.failed += 1;
      if (res.status === 507) out.limit = true;
    }
  }
  out.remote = remote.size;
  return out;
}
