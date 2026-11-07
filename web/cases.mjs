// NutriClinic cases kept on this device, in the browser's storage. Pure functions over a Storage-like object
// ({ getItem, setItem, removeItem }); nothing here leaves the device. Device storage is on unless the clinician turns
// it off; turning it off removes the cases from this device (the interface asks first).
// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Gökay Duman

export const CASES_KEY = 'nc-staged.cases.v1';
export const CURRENT_KEY = 'nc-staged.current.v1';
export const DEVICE_KEY = 'nc-staged.device.v1';
export const MAX_CASES = 200;
export const MAX_CASE_BYTES = 128 * 1024;
export const MAX_LABEL = 40;
// The last case reopens by itself after a reload only when it changed within this time (a shared computer's next
// user does not see it on opening the page; it stays in the list).
export const REOPEN_MS = 12 * 60 * 60 * 1000;

const ID = /^c-[0-9a-f]{16}$/;
const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/;
// The case code of a case's anonymised copy on the site, and the change time of the version sent there.
const SITE_CODE = /^NC-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}$/;
const siteFields = (c) => ({ siteCode: SITE_CODE.test(String(c?.siteCode)) ? c.siteCode : null, siteAt: SITE_CODE.test(String(c?.siteCode)) && ISO.test(String(c?.siteAt)) ? c.siteAt : null });

export function newCaseId(fill = (bytes) => globalThis.crypto.getRandomValues(bytes)) {
  const bytes = new Uint8Array(8);
  fill(bytes);
  return `c-${[...bytes].map((x) => x.toString(16).padStart(2, '0')).join('')}`;
}
export const isCaseId = (id) => typeof id === 'string' && ID.test(id);

export function deviceStorageOn(storage) {
  try { return storage.getItem(DEVICE_KEY) !== 'off'; } catch { return false; }
}
export function setDeviceStorage(storage, on) {
  storage.setItem(DEVICE_KEY, on ? 'on' : 'off');
}

// Plain label: no line breaks or control characters, at most 40 characters.
export const cleanLabel = (x) => String(x ?? '').replace(/[\u0000-\u001f\u007f]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, MAX_LABEL);

function readAll(storage) {
  let raw;
  try { raw = JSON.parse(storage.getItem(CASES_KEY) ?? '[]'); } catch { return []; }
  if (!Array.isArray(raw)) return [];
  return raw.filter((c) => c && typeof c === 'object' && isCaseId(c.id) && c.data && typeof c.data === 'object' && !Array.isArray(c.data)
    && ISO.test(String(c.updatedAt)))
    .map((c) => ({ id: c.id, label: cleanLabel(c.label), createdAt: ISO.test(String(c.createdAt)) ? c.createdAt : c.updatedAt, updatedAt: c.updatedAt,
      view: c.view === 'result' ? 'result' : 'cards', step: Number.isInteger(c.step) && c.step >= 1 && c.step <= 20 ? c.step : 1, data: c.data, ...siteFields(c) }));
}
function writeAll(storage, list) {
  storage.setItem(CASES_KEY, JSON.stringify(list));
}

// Cases on this device, last changed first. Damaged entries are left out.
export function listCases(storage) {
  return readAll(storage).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}
export function getCase(storage, id) {
  return readAll(storage).find((c) => c.id === id) ?? null;
}

// Adds or replaces one case. { ok: true } or { ok: false, error: 'full' (50 cases) | 'size' | 'storage' }.
export function putCase(storage, { id, label = '', data, view = 'cards', step = 1 }, now = new Date()) {
  if (!isCaseId(id) || !data || typeof data !== 'object') return { ok: false, error: 'storage' };
  const text = JSON.stringify(data);
  if (text.length > MAX_CASE_BYTES) return { ok: false, error: 'size' };
  const list = readAll(storage);
  const at = list.findIndex((c) => c.id === id);
  if (at < 0 && list.length >= MAX_CASES) return { ok: false, error: 'full' };
  const stamp = now.toISOString();
  const record = { id, label: cleanLabel(label), createdAt: at < 0 ? stamp : list[at].createdAt, updatedAt: stamp,
    view: view === 'result' ? 'result' : 'cards', step: Number.isInteger(step) ? step : 1, data: JSON.parse(text), ...siteFields(list[at]) };
  if (at < 0) list.push(record); else list[at] = record;
  try { writeAll(storage, list); } catch { return { ok: false, error: 'storage' }; }
  return { ok: true };
}
// Writes a whole case as it is, keeping its own times (a case received from the site). False when it is damaged or
// the device is full.
export function storeCase(storage, c) {
  if (!c || !isCaseId(c.id) || !c.data || typeof c.data !== 'object' || Array.isArray(c.data) || !ISO.test(String(c.updatedAt))) return false;
  if (JSON.stringify(c.data).length > MAX_CASE_BYTES) return false;
  const list = readAll(storage);
  const at = list.findIndex((x) => x.id === c.id);
  if (at < 0 && list.length >= MAX_CASES) return false;
  const record = { id: c.id, label: cleanLabel(c.label), createdAt: ISO.test(String(c.createdAt)) ? c.createdAt : c.updatedAt, updatedAt: c.updatedAt,
    view: c.view === 'result' ? 'result' : 'cards', step: Number.isInteger(c.step) && c.step >= 1 && c.step <= 20 ? c.step : 1, data: c.data, ...siteFields(c) };
  if (at < 0) list.push(record); else list[at] = record;
  try { writeAll(storage, list); } catch { return false; }
  return true;
}
// Records that a case was sent to the site under code in its version of t (its change time then). A later change
// of the case keeps the code; the case is sent again because its change time differs.
export function markSite(storage, id, code, at) {
  if (!SITE_CODE.test(String(code)) || !ISO.test(String(at))) return false;
  const list = readAll(storage);
  const c = list.find((x) => x.id === id);
  if (!c) return false;
  c.siteCode = code;
  c.siteAt = at;
  try { writeAll(storage, list); } catch { return false; }
  return true;
}
// Forgets every site code (site storage turned off on this device).
export function clearSiteMarks(storage) {
  const list = readAll(storage).map((c) => ({ ...c, siteCode: null, siteAt: null }));
  try { writeAll(storage, list); } catch { /* storage unavailable */ }
}
export function renameCase(storage, id, label) {
  const list = readAll(storage);
  const c = list.find((x) => x.id === id);
  if (!c) return false;
  c.label = cleanLabel(label);
  try { writeAll(storage, list); } catch { return false; }
  return true;
}
export function deleteCase(storage, id) {
  const list = readAll(storage).filter((c) => c.id !== id);
  writeAll(storage, list);
  if (currentCaseId(storage) === id) storage.removeItem(CURRENT_KEY);
}
export function clearCases(storage) {
  storage.removeItem(CASES_KEY);
  storage.removeItem(CURRENT_KEY);
}

export function currentCaseId(storage) {
  try { const id = storage.getItem(CURRENT_KEY); return isCaseId(id) ? id : null; } catch { return null; }
}
export function setCurrentCaseId(storage, id) {
  if (id) storage.setItem(CURRENT_KEY, id); else storage.removeItem(CURRENT_KEY);
}
// The case to reopen after a reload, or null.
export function caseToReopen(storage, now = new Date()) {
  const id = currentCaseId(storage);
  const c = id ? getCase(storage, id) : null;
  return c && now.getTime() - Date.parse(c.updatedAt) <= REOPEN_MS ? c : null;
}
