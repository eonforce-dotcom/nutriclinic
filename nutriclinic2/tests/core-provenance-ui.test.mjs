import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCoreRuleProvenance } from '../dist/core-rule-provenance.mjs';
import { coreRuleSourcesMarkup, coreRuleSourcesTitle } from '../dist/core-provenance-ui.mjs';

test('seven core groups distinguish frameworks, context and unmapped calculations in both locales', () => {
  const map = buildCoreRuleProvenance(), before = structuredClone(map);
  const en = coreRuleSourcesMarkup(map), tr = coreRuleSourcesMarkup(map, [], 'tr');
  assert.equal((en.match(/<article /g) || []).length, 7);
  assert.equal((tr.match(/<article /g) || []).length, 7);
  assert.equal((en.match(/No dedicated source is mapped for this output group\./g) || []).length, 2);
  assert.match(en, /GLIM candidate findings/);
  assert.match(en, /Software policies/);
  assert.match(en, /Clinical context only/);
  assert.match(en, /Equation and units checked · abstract only/);
  assert.match(tr, /GLIM aday bulguları/);
  assert.match(tr, /Yazılım politikaları/);
  assert.match(tr, /Yalnız klinik bağlam/);
  assert.match(tr, /Denklem ve birimler kontrol edildi · yalnız özet/);
  assert.deepEqual(map, before);
  assert.equal(coreRuleSourcesTitle(), 'Sources for core calculations');
  assert.equal(coreRuleSourcesTitle('tr'), 'Ana hesaplamaların kaynakları');
  assert.equal(coreRuleSourcesTitle('unsupported'), coreRuleSourcesTitle());
});

test('source links use canonical titles/access, escape markup and ignore reference-supplied attributes', () => {
  const map = buildCoreRuleProvenance();
  map.rules = [map.rules.find(rule => rule.id === 'pni')];
  map.rules[0].sourceReferences = [{sourceId:'canonical',role:'original-abstract-formula-units',url:'https://injected.example/',title:'Injected title'}];
  const catalog = [{id:'canonical', title:'<img src=x onerror=alert(1)> "Title"', access:'Original <script>text</script>', url:'https://example.org/paper?x=1&y=2'}];
  const original = structuredClone(catalog), html = coreRuleSourcesMarkup(map, catalog);
  assert.match(html, /href="https:\/\/example\.org\/paper\?x=1&amp;y=2"/);
  assert.match(html, /rel="noopener noreferrer"/);
  assert.match(html, /&lt;img src=x onerror=alert\(1\)&gt; &quot;Title&quot;/);
  assert.match(html, /Original &lt;script&gt;text&lt;\/script&gt;/);
  assert.ok(!html.includes('<img'));
  assert.ok(!html.includes('<script>'));
  assert.ok(!html.includes('injected.example'));
  assert.ok(!html.includes('Injected title'));
  assert.deepEqual(catalog, original);
});

test('non-HTTPS, relative, malformed and credential-bearing canonical URLs never become links', () => {
  for (const url of ['javascript:alert(1)','data:text/html,<script>','http://example.org/','/paper','not a URL','https://user:password@example.org/']) {
    const map = buildCoreRuleProvenance();
    map.rules = [map.rules.find(rule => rule.id === 'pni')];
    map.rules[0].sourceReferences = [{sourceId:'bad',role:'interpretation-context'}];
    const html = coreRuleSourcesMarkup(map, [{id:'bad',title:'Canonical source',access:'Abstract only',url}]);
    assert.ok(!html.includes('<a '), url);
    assert.match(html, /Source link unavailable/);
    assert.match(html, /Abstract only/);
  }
});

test('unknown or prototype-shaped rule/source/role values do not acquire authority', () => {
  const map = buildCoreRuleProvenance();
  map.rules = [{id:'constructor'},{id:'pni',mappingStatus:'__proto__',sourceReferences:[{sourceId:'missing',role:'constructor'}],implementationPolicies:['__proto__']}];
  const html = coreRuleSourcesMarkup(map, [], 'en');
  assert.equal((html.match(/<article /g) || []).length, 1);
  assert.match(html, /Source unavailable in the current catalog/);
  assert.match(html, /Contextual reference/);
  assert.match(html, /Additional local policy/);
  assert.ok(!html.includes('<a '));
});

test('localized catalog text and translation callback retain explicit English/Turkish rendering', () => {
  const map = buildCoreRuleProvenance();
  map.rules = [map.rules.find(rule => rule.id === 'pni')];
  map.rules[0].sourceReferences = [{sourceId:'local',role:'interpretation-context'}];
  const catalog = [{id:'local',title:{en:'Original title',tr:'Özgün başlık'},access:'Özet',url:'https://example.org/'}];
  const en = coreRuleSourcesMarkup(map, catalog, 'en', value => value === 'Özet' ? 'Abstract only' : value);
  const tr = coreRuleSourcesMarkup(map, catalog, 'tr');
  assert.match(en, /Original title/); assert.match(en, /Abstract only/);
  assert.match(tr, /Özgün başlık/); assert.match(tr, /Özet/);
  assert.match(tr, /Yorum bağlamı/);
});
