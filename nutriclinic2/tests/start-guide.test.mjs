import test from 'node:test';
import assert from 'node:assert/strict';
import { initStartGuide } from '../dist/start-guide.mjs';

function fixture(t) {
  const before = new Map(['document', 'window'].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  const nodes = new Map();
  const interactions = [];
  class Element {
    constructor(id) { this.id = id; this.handlers = {}; this.attrs = {}; this.hidden = false; this.html = ''; }
    setAttribute(key, value) { this.attrs[key] = value; }
    set innerHTML(value) {
      this.html = value;
      for (const match of value.matchAll(/id="([^"]+)"/g)) nodes.set(match[1], new Element(match[1]));
    }
    get innerHTML() { return this.html; }
    addEventListener(type, handler) { this.handlers[type] = handler; }
    click() { this.handlers.click?.(); }
    focus(options) { interactions.push(['focus', this.id, options]); }
    scrollIntoView(options) { interactions.push(['scroll', this.id, options]); }
  }
  for (const id of ['startGuide', 'studyId', 'visitDate', 'age', 'height', 'weight', 'context', 'phase']) nodes.set(id, new Element(id));
  globalThis.document = { getElementById: id => nodes.get(id) || null };
  globalThis.window = { matchMedia: () => ({ matches: true }) };
  t.after(() => { for (const [key, descriptor] of before) { if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key]; } });
  let input = {}, view = 'assessment', language = 'en';
  const ui = initStartGuide({ getInput: () => input, getView: () => view, getLanguage: () => language,
    navigate: next => { interactions.push(['navigate', next]); view = next; },
    openArchive: () => interactions.push(['archive']),
  });
  return { ui, interactions, node: id => nodes.get(id), setInput: value => { input = value; }, setView: value => { view = value; }, setLanguage: value => { language = value; } };
}

test('begin action navigates and focuses the first missing patient field without altering data', t => {
  const h = fixture(t), input = { studyId: 'SYNTHETIC', visitDate: '2026-10-28', age: null, height: null };
  const before = structuredClone(input); h.setInput(input);
  h.node('startGuidePatient').click();
  assert.deepEqual(h.interactions, [['navigate', 'assessment'], ['focus', 'age', { preventScroll: true }], ['scroll', 'age', { behavior: 'auto', block: 'center' }]]);
  assert.deepEqual(input, before);
});

test('entered zero is not treated as blank, while an explicitly invalid field is offered for correction', t => {
  const h = fixture(t), input = { studyId: 'SYNTHETIC', visitDate: '2026-10-28', age: 0, height: 170, weight: null, context: 'ward', phase: 'recovery', inputErrors: [] };
  h.setInput(input); h.node('startGuidePatient').click();
  assert.equal(h.interactions.find(item => item[0] === 'focus')[1], 'weight');
  h.interactions.length = 0; input.inputErrors = ['age']; h.node('startGuidePatient').click();
  assert.equal(h.interactions.find(item => item[0] === 'focus')[1], 'age');
});

test('saved-patient action calls the archive handler and language refresh updates the guide', t => {
  const h = fixture(t);
  assert.match(h.node('startGuide').innerHTML, /START HERE/);
  h.node('startGuideArchive').click(); assert.deepEqual(h.interactions, [['archive']]);
  h.setLanguage('tr'); h.ui.refresh();
  assert.match(h.node('startGuide').innerHTML, /BURADAN BAŞLAYIN/);
  assert.match(h.node('startGuide').innerHTML, /Kayıtlı hastayı aç/);
  assert.doesNotMatch(h.node('startGuide').innerHTML, /Open a saved patient/);
  assert.equal(h.node('startGuide').attrs['data-no-i18n'], '');
  h.setView('research'); h.ui.refresh(); assert.equal(h.node('startGuide').hidden, true);
  h.setView('assessment'); h.ui.refresh(); assert.equal(h.node('startGuide').hidden, false);
});
