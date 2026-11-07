// NutriClinic administrator page: the anonymised site copies of every device, behind the site's password (nginx).
// Read-only. The engine runs here to show each case's targets; nothing is sent anywhere.
// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Gökay Duman
import { recommend } from '../engine.mjs';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const when = (iso) => { const d = new Date(iso); return Number.isNaN(d.getTime()) ? '' : d.toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' }); };
const num = (x, d = 0) => (Number.isFinite(x) ? x.toLocaleString('tr-TR', { maximumFractionDigits: d }) : '');
const $ = (id) => document.getElementById(id);
let cases = [];

// Targets with the engine of this site (the copy keeps the version it was sent with).
function targets(data) {
  try {
    const r = recommend({ ...(data.values ?? {}) });
    if (r.blocked) return { kcal: null, protein: null, route: '', cls: '' };
    const day = r.plan?.today ?? r.plan?.oral ?? {};
    return { kcal: day.kcalTarget ?? null, protein: day.proteinTarget ?? null, route: r.route?.kind ?? '', cls: r.product?.cls ?? '' };
  } catch {
    return { kcal: null, protein: null, route: '', cls: '' };
  }
}
const SETTING = { icu: 'Yoğun bakım', ward: 'Servis' };
const SEX = { male: 'Erkek', female: 'Kadın' };

function download(name, text, type) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
const COLUMNS = [['Site kodu', (c) => c.code], ['Kaynak', (c) => c.source], ['Kaydedilme', (c) => when(c.savedAt)], ['Ortam', (c) => SETTING[c.data.values?.setting] ?? ''],
  ['Yaş', (c) => c.data.values?.age ?? ''], ['Cinsiyet', (c) => SEX[c.data.values?.sex] ?? ''], ['Boy (cm)', (c) => c.data.values?.heightCm ?? ''],
  ['Kilo (kg)', (c) => c.data.values?.weightKg ?? ''], ['YB günü', (c) => (c.data.values?.setting === 'ward' ? '' : c.data.values?.icuDay ?? '')],
  ['Enerji hedefi (kcal)', (c) => num(c.t.kcal)], ['Protein hedefi (g)', (c) => num(c.t.protein)]];

function renderList(total) {
  const head = COLUMNS.map(([name]) => `<th class="l">${esc(name)}</th>`).join('');
  const rows = cases.map((c, i) => `<tr>${COLUMNS.map(([, f]) => `<td class="l">${esc(f(c))}</td>`).join('')}<td><button type="button" class="btn" data-i="${i}">Ayrıntı</button></td></tr>`).join('');
  $('list').innerHTML = `<p><strong>${esc(num(total))}</strong> anonim vaka${total > cases.length ? ` (ilk ${esc(num(cases.length))} gösteriliyor)` : ''}.</p>
    ${cases.length ? `<div class="table-wrap"><table><thead><tr>${head}<th></th></tr></thead><tbody>${rows}</tbody></table></div>` : '<p class="muted">Sitede henüz vaka yok.</p>'}
    <div class="actions"><button type="button" class="btn" data-act="json">Tümünü indir (JSON)</button><button type="button" class="btn" data-act="csv">Tablo (CSV)</button></div>`;
}
function renderDetail(c) {
  const box = $('detail');
  const pairs = (o) => Object.entries(o ?? {}).map(([k, v]) => `<tr><td class="l">${esc(k)}</td><td class="l">${esc(typeof v === 'object' ? JSON.stringify(v) : v)}</td></tr>`).join('');
  const follow = (c.data.followup ?? []).map((r) => `<tr><td class="l">${esc(r.day)}</td><td class="l">${esc(r.kcal)}</td><td class="l">${esc(r.protein)}</td></tr>`).join('');
  box.innerHTML = `<h2>${esc(c.code)}</h2>
    <p class="muted">Kaynak ${esc(c.source)} · son değişiklik ${esc(when(c.updatedAt))} · siteye kayıt ${esc(when(c.savedAt))}${c.data.engine ? ` · gönderen sürüm ${esc(c.data.engine)}` : ''}</p>
    <p>Bu sitenin motoruyla: yol <strong>${esc(c.t.route || '—')}</strong>, ürün sınıfı <strong>${esc(c.t.cls || '—')}</strong>, enerji <strong>${esc(num(c.t.kcal) || '—')}</strong> kcal, protein <strong>${esc(num(c.t.protein) || '—')}</strong> g.</p>
    <h3>Girilen değerler</h3><div class="table-wrap"><table><tbody>${pairs(c.data.values)}</tbody></table></div>
    ${Object.keys(c.data.product ?? {}).length ? `<h3>Ürün etiketi</h3><div class="table-wrap"><table><tbody>${pairs(c.data.product)}</tbody></table></div>` : ''}
    ${follow ? `<h3>İzlem</h3><div class="table-wrap"><table><thead><tr><th class="l">Gün</th><th class="l">Enerji (kcal)</th><th class="l">Protein (g)</th></tr></thead><tbody>${follow}</tbody></table></div>` : ''}
    ${Object.keys(c.data.decisions ?? {}).length ? `<h3>Karar konuları</h3><div class="table-wrap"><table><tbody>${pairs(c.data.decisions)}</tbody></table></div>` : ''}
    <div class="actions"><button type="button" class="btn" data-act="close">Kapat</button></div>`;
  box.hidden = false;
  box.scrollIntoView({ block: 'start' });
}

document.addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  if (b.dataset.i !== undefined) { renderDetail(cases[Number(b.dataset.i)]); return; }
  if (b.dataset.act === 'close') { $('detail').hidden = true; return; }
  const stamp = new Date().toISOString().slice(0, 16).replace(/[-:]/g, '').replace('T', '-');
  if (b.dataset.act === 'json') download(`nutriclinic-anonim-vakalar-${stamp}.json`, `${JSON.stringify(cases.map(({ t, ...c }) => c), null, 2)}\n`, 'application/json');
  if (b.dataset.act === 'csv') {
    const cell = (x) => `"${String(x ?? '').replace(/"/g, '""')}"`;
    const lines = [COLUMNS.map(([name]) => cell(name)).join(';'), ...cases.map((c) => COLUMNS.map(([, f]) => cell(f(c))).join(';'))];
    download(`nutriclinic-anonim-vakalar-${stamp}.csv`, `﻿${lines.join('\r\n')}\r\n`, 'text/csv');
  }
});

try {
  const res = await fetch('api/cases?limit=2000', { credentials: 'same-origin', cache: 'no-store' });
  if (!res.ok) throw new Error(String(res.status));
  const body = await res.json();
  cases = (body.cases ?? []).map((c) => ({ ...c, data: c.data ?? {}, t: targets(c.data ?? {}) }));
  renderList(body.total ?? cases.length);
} catch (err) {
  $('list').innerHTML = `<p class="field-error">Vakalar okunamadı (${esc(err.message)}).</p>`;
}
