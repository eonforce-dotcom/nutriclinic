import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { translate } from '../dist/i18n.mjs';
import { isServerEdition, editionText, setEditionForTests, applyEditionText, EDITION } from '../dist/edition.mjs';
import { initLocalRecordsUI } from '../dist/local-records-ui.mjs';

const read = file => fs.readFileSync(new URL('../dist/' + file, import.meta.url), 'utf8');
const turkish = /[çğıİöşüÇĞÖŞÜ]/;
const decode = value => value.replaceAll('&quot;', '"').replaceAll('&#39;', "'").replaceAll('&amp;', '&');

test('the source edition is local and the server edition is opt-in', t => {
  t.after(() => setEditionForTests('local'));
  assert.equal(EDITION, 'local');
  assert.equal(isServerEdition(), false);
  assert.equal(editionText('local', 'server'), 'local');
  setEditionForTests('server');
  assert.equal(isServerEdition(), true);
  assert.equal(editionText('local', 'server'), 'server');
});

test('server-edition static wording replaces only marked elements', t => {
  t.after(() => setEditionForTests('local'));
  const marked = { textContent: 'Bu bilgisayarda yerel kayıt', getAttribute: name => name === 'data-server-text' ? 'Sunucuda ortak kayıt' : null };
  const root = { querySelectorAll: query => query === '[data-server-text]' ? [marked] : [] };
  applyEditionText(root);
  assert.equal(marked.textContent, 'Bu bilgisayarda yerel kayıt');
  setEditionForTests('server');
  applyEditionText(root);
  assert.equal(marked.textContent, 'Sunucuda ortak kayıt');
});

test('every server-edition source text has a complete English translation', () => {
  const texts = [...read('index.html').matchAll(/data-server-text="([^"]+)"/g)].map(match => decode(match[1]));
  assert.ok(texts.length >= 5);
  for (const text of texts) {
    const english = translate(text);
    assert.notEqual(english, text, text);
    assert.doesNotMatch(english, turkish, english);
  }
});

test('the language control shows no Turkish in English', () => {
  const html = read('index.html');
  assert.doesNotMatch(html, /Language \/ Dil|Interface language \/ Arayüz dili/);
  assert.match(html, /<span>Dil<\/span>/);
  assert.match(html, /aria-label="Arayüz dili"/);
  assert.match(html, /<option value="en" data-no-i18n>English<\/option>/);
  assert.match(html, /<option value="tr" data-no-i18n>Türkçe<\/option>/);
  assert.equal(translate('Dil'), 'Language');
  assert.equal(translate('Arayüz dili'), 'Interface language');
});

test('untranslated source text stays hidden until i18n has run', () => {
  assert.match(read('index.html'), /<html lang="en" class="i18n-pending">/);
  assert.match(read('style.css'), /html\.i18n-pending body \{\s*visibility: hidden;/);
  assert.match(read('i18n.mjs'), /classList\?\.remove\('i18n-pending'\)/);
});

function recordsFixture(t) {
  const previous = globalThis.document, nodes = new Map();
  class Element {
    constructor(id = '') { this.id = id; this.handlers = {}; this.dataset = {}; this._html = ''; }
    set innerHTML(value) { this._html = value; for (const m of value.matchAll(/<[^>]*\bid="([^"]+)"[^>]*>/g)) nodes.set(m[1], new Element(m[1])); }
    get innerHTML() { return this._html; }
    insertAdjacentHTML(_, value) { this.innerHTML = this._html + value; }
    querySelectorAll() { return []; }
    addEventListener(type, fn) { (this.handlers[type] ??= []).push(fn); }
    focus() {} setSelectionRange() {}
  }
  nodes.set('localRecordStatus', new Element('localRecordStatus'));
  nodes.set('localPatientArchive', new Element('localPatientArchive'));
  globalThis.document = { getElementById: id => nodes.get(id) || null };
  t.after(() => { globalThis.document = previous; });
  const store = { flush: async () => ({ ok: true }), listPatients: async () => ({ ok: true, patients: [] }), listBackups: async () => ({ ok: true, backups: [] }) };
  const ui = initLocalRecordsUI({ getStore: () => store, openPatient: async () => {}, saveBeforeSwitch: async () => true, downloadRecovery: () => {}, navigate: () => {} });
  return { ui, html: id => nodes.get(id).innerHTML };
}

test('hosted records panel speaks of the server, never of this computer', t => {
  t.after(() => setEditionForTests('local'));
  setEditionForTests('server');
  const { ui, html } = recordsFixture(t);
  ui.update({ phase: 'idle', loaded: true, dirty: false, saving: false, hasSavedWorkspace: true, updatedAt: '2026-10-29T10:00:00Z' });
  assert.match(html('localRecordStatus'), /<strong>Patient records<\/strong>/);
  assert.match(html('localRecordStatus'), /Saved · /);
  assert.match(html('localPatientArchive'), /SERVER/);
  assert.match(html('localPatientArchive'), /Create backup now/);
  assert.doesNotMatch(html('localRecordStatus') + html('localPatientArchive'), /this computer|THIS COMPUTER|on disk|nutrition\/data|LOCAL-PATIENT-RECORDS\.md/);
  ui.update({ phase: 'error', loaded: true, dirty: true, saving: false });
  assert.match(html('localRecordStatus'), /Not saved — the server did not confirm the last change/);
  assert.doesNotMatch(html('localRecordStatus'), /NOT SAVED|local storage/);
});

test('desktop records panel keeps its local wording', t => {
  const { ui, html } = recordsFixture(t);
  ui.update({ phase: 'idle', loaded: true, dirty: false, saving: false, hasSavedWorkspace: true, updatedAt: '2026-10-29T10:00:00Z' });
  assert.match(html('localRecordStatus'), /Local patient records/);
  assert.match(html('localRecordStatus'), /Saved on this computer/);
  assert.match(html('localPatientArchive'), /LOCAL-PATIENT-RECORDS\.md/);
});
