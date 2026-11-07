import { uiTranslations, uiPatterns } from './i18n-ui-en.mjs';
import { engineTranslations, enginePatterns } from './i18n-engine-en.mjs';
import { evidenceTranslations } from './i18n-evidence-en.mjs';
import { updateEnglishTranslations } from './evidence-update-20261024.mjs';
import { experienceTranslations, experiencePatterns } from './i18n-experience-en.mjs';
import { additionalTranslations } from './clinical-sources.mjs';
import { clinicalRuntimeTranslations } from './clinical-context.mjs';
import { metabolicTranslations } from './evidence-metabolic-20261024.mjs';
import { getInitialLocale, LANGUAGE_STORAGE_KEY } from './initial-locale.mjs';

// Display translations never alter canonical clinical inputs, results or exports.
const dictionary = { ...uiTranslations, ...engineTranslations, ...evidenceTranslations, ...updateEnglishTranslations, ...experienceTranslations, ...additionalTranslations, ...metabolicTranslations };
Object.assign(dictionary,{
 'Bu bilgisayarda yerel kayıt':'Local records on this computer',
 'Girdiler yerel diske kaydedilir.':'Entries are saved on the local disk.',
 'Kayıt durumunu üstten kontrol edin.':'Check the save status above.',
 'Değerlendirme çalışma listesi':'Assessment working list',
 'Aynı olgunun ölçümlerini zaman damgasıyla kaydedin. Çalışma listesi ve taslaklar yerel diskte korunur; JSON/CSV ile ayrıca dışa aktarabilirsiniz.':'Save this case’s measurements with timestamps. The working list and drafts are retained on the local disk; you can also export JSON/CSV.',
 'Çalışma listesini temizle':'Clear working list',
 'Çalışma koduyla yerel disk kaydı; kullanıcı yetkisi veya değiştirilemez denetim izi bulunmaz':'Local disk storage using a study code; no user roles or immutable audit log.',
 // The language control is Turkish source text like every other label, so English shows no Turkish.
 'Dil':'Language',
 'Arayüz dili':'Interface language',
 // Server-edition wording (edition.mjs, data-server-text in index.html).
 'Sunucuda ortak kayıt':'Shared records on the server',
 'Girdiler sunucuya kaydedilir.':'Entries are saved on the server.',
 '◈ Hastane içi kullanım':'◈ For in-hospital use',
 'Aynı olgunun ölçümlerini zaman damgasıyla kaydedin. Çalışma listesi ve taslaklar sunucuda korunur; JSON/CSV ile ayrıca dışa aktarabilirsiniz.':'Save this case’s measurements with timestamps. The working list and drafts are retained on the server; you can also export JSON/CSV.',
 'Çalışma koduyla sunucuda kayıt; tek ortak şifreli hesap kullanılır, kişisel kullanıcı yetkisi veya değiştirilemez denetim izi bulunmaz':'Server storage using a study code; one shared password-protected account, no individual user roles or immutable audit log.'
});
const normalize = value => String(value).replace(/\s+/g, ' ').trim();
const escapeRegex = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const patterns = [...experiencePatterns, ...enginePatterns, ...uiPatterns].map(pattern => {
  const slots = [];
  let expression = '', position = 0;
  for (const match of pattern.tr.matchAll(/\{(\d+)\}/g)) {
    expression += escapeRegex(pattern.tr.slice(position, match.index)) + '([\\s\\S]*?)';
    slots.push(Number(match[1]));
    position = match.index + match[0].length;
  }
  expression += escapeRegex(pattern.tr.slice(position));
  const raw = pattern.tr.startsWith('Mama/etiket kaydı:') ? [0, 1]
    : pattern.tr.startsWith('Olgu:') ? [0, 1, 2] : [];
  return { ...pattern, slots, raw, regex: new RegExp('^' + expression + '$') };
});
let locale = 'en';
export const getLocale = () => locale;
export const getNumberLocale = () => locale === 'tr' ? 'tr-TR' : 'en-GB';

export function translate(value, language = locale, depth = 0) {
  if (language !== 'en' || value == null || depth > 12) return String(value ?? '');
  const source = String(value), key = normalize(source);
  if (!key) return source;
  let translated = clinicalRuntimeTranslations[key] || dictionary[key];
  if (!translated) {
    for (const pattern of patterns) {
      const matched = pattern.regex.exec(pattern.raw.length ? source.trim() : key);
      if (!matched) continue;
      const captures = {};
      pattern.slots.forEach((slot, index) => {
        const capture = matched[index + 1];
        captures[slot] = pattern.raw.includes(slot) || capture.length >= key.length
          ? capture : translate(capture, language, depth + 1);
      });
      translated = pattern.en.replace(/\{(\d+)\}/g, (_, slot) => captures[Number(slot)] ?? '');
      break;
    }
  }
  if (!translated) {
    for (const separator of ['; ', ' · ', '. ', ', ']) {
      if (!key.includes(separator)) continue;
      const split = key.split(separator);
      const pieces = separator === '. ' ? split.map((piece, index) => index < split.length - 1 ? piece + '.' : piece) : split;
      const rendered = pieces.map(piece => translate(piece, language, depth + 1));
      if (rendered.some((piece, index) => piece !== pieces[index])) {
        translated = rendered.join(separator === '. ' ? ' ' : separator);
        break;
      }
    }
  }
  if (!translated) return source;
  return (source.match(/^\s*/)?.[0] || '') + translated + (source.match(/\s*$/)?.[0] || '');
}

export function initI18n(onLanguageChange = () => {}, initialLocaleEnvironment) {
  const select = document.getElementById('languageSelect');
  locale = getInitialLocale(initialLocaleEnvironment);
  select.value = locale;
  const records = new WeakMap(), attributes = new WeakMap();
  let observer;
  const skip = element => !element || !!element.closest('script, style, textarea, pre, [data-no-i18n]');
  const update = () => {
    observer?.disconnect();
    document.documentElement.lang = locale;
    // DOM changes may arrive between a native select's input and change events.
    // Keep the user's pending selection intact until its change handler commits it.
    const walker = document.createTreeWalker(document.documentElement, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (skip(node.parentElement) || !node.data.trim()) continue;
      let record = records.get(node);
      if (!record || record.last !== node.data) record = { source: node.data };
      record.last = translate(record.source);
      if (node.data !== record.last) node.data = record.last;
      records.set(node, record);
    }
    for (const element of document.querySelectorAll('[placeholder], [title], [aria-label], [alt], meta[name="description"]')) {
      if (skip(element)) continue;
      const record = attributes.get(element) || {};
      for (const name of ['placeholder', 'title', 'aria-label', 'alt', ...(element.matches('meta[name="description"]') ? ['content'] : [])]) {
        if (!element.hasAttribute(name)) continue;
        const current = element.getAttribute(name);
        if (!record[name] || record[name].last !== current) record[name] = { source: current };
        const value = translate(record[name].source);
        record[name].last = value;
        if (current !== value) element.setAttribute(name, value);
      }
      attributes.set(element, record);
    }
    observer.observe(document.documentElement, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['placeholder', 'title', 'aria-label', 'alt'] });
  };
  observer = new MutationObserver(update);
  select.addEventListener('change', () => {
    locale = select.value === 'tr' ? 'tr' : 'en';
    try { localStorage.setItem(LANGUAGE_STORAGE_KEY, locale); } catch {}
    onLanguageChange();
    update();
  });
  onLanguageChange();
  update();
  document.documentElement.classList?.remove('i18n-pending');
  window.addEventListener('beforeprint', update);
  return update;
}
