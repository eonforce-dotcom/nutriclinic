import { describeCoreRule } from './core-rule-provenance.mjs';

const esc = value => String(value ?? '').replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
const localeOf = language => language === 'tr' ? 'tr' : 'en';
const text = (language, en, tr) => localeOf(language) === 'tr' ? tr : en;
const roleLabels = {
  'clinical-framework': ['Clinical framework', 'Klinik çerçeve'],
  'intake-interpretation': ['Intake interpretation', 'Alımın yorumlanması'],
  'original-abstract-formula-units': ['Equation and units in original abstract', 'Özgün özette denklem ve birimler'],
  'interpretation-context': ['Interpretation context', 'Yorum bağlamı'],
  'approximate-method-context': ['Approximate method context', 'Yaklaşık yöntem bağlamı'],
  'original-use-context': ['Original report of equation use', 'Denklemin kullanımını bildiren özgün yayın'],
  'applicability-context': ['Applicability context', 'Uygulanabilirlik bağlamı'],
  'risk-framework': ['Risk framework', 'Risk çerçevesi'],
  'clinical-context-only': ['Clinical context only', 'Yalnız klinik bağlam'],
};
const statusLabels = {
  'arithmetic-unmapped': ['No dedicated source mapped', 'Özel kaynak eşleştirilmedi'],
  'formula-unmapped': ['No dedicated source mapped', 'Özel kaynak eşleştirilmedi'],
  'framework-context': ['Clinical framework and interpretation', 'Klinik çerçeve ve yorum'],
  'formula-units-checked-abstract-only': ['Equation and units checked · abstract only', 'Denklem ve birimler kontrol edildi · yalnız özet'],
  'approximate-method-context': ['Approximate method context', 'Yaklaşık yöntem bağlamı'],
  'risk-framework-context': ['Risk framework', 'Risk çerçevesi'],
  'clinical-context-only': ['Clinical context only', 'Yalnız klinik bağlam'],
};
const policyLabels = {
  'local-input-validity': ['Input validity', 'Girdi geçerliliği'],
  'local-adult-scope': ['Adult scope', 'Erişkin kapsamı'],
  'local-display-rounding': ['Display rounding', 'Gösterim yuvarlaması'],
  'local-clinician-confirmed-findings': ['Clinician-confirmed findings', 'Klinisyenin doğruladığı bulgular'],
  'local-candidate-only': ['Candidate findings only', 'Yalnız aday bulgular'],
  'local-unrounded-thresholds': ['Thresholds use unrounded values', 'Eşiklerde yuvarlanmamış değerler'],
  'local-verified-lab-date': ['Verified laboratory date; no future sample', 'Doğrulanmış laboratuvar tarihi; ileri tarihli örnek yok'],
  'local-positive-denominator': ['Positive denominator', 'Pozitif payda'],
  'local-dependent-error-gates': ['Dependent input error checks', 'İlgili girdi hata kontrolleri'],
  'local-canonical-units': ['Canonical input units', 'Kanonik girdi birimleri'],
  'local-matched-collection-intake': ['Matched collection and actual intake', 'Eşleşen toplama ve gerçek alım'],
  'local-24h-tolerance': ['Collection-duration tolerance', 'Toplama süresi toleransı'],
  'local-date-volume-gates': ['Collection date and volume checks', 'Toplama tarihi ve hacim kontrolleri'],
  'local-renal-loss-suppression': ['Renal and major-loss restrictions', 'Böbrek ve önemli kayıp sınırlamaları'],
  'local-electrolyte-precheck': ['Numeric electrolyte prechecks', 'Sayısal elektrolit ön kontrolleri'],
  'local-incomplete-conflict-gates': ['Incomplete or conflicting data checks', 'Eksik veya çelişen veri kontrolleri'],
  'local-plan-suppression': ['Plan suppression', 'Planı engelleme'],
  'local-physician-target-input': ['Physician-entered targets', 'Hekimin girdiği hedefler'],
  'local-volume-cap-floor': ['Volume cap and downward rounding', 'Hacim sınırı ve aşağı yuvarlama'],
  'local-product-provenance-gates': ['Product source and verification', 'Ürün kaynağı ve doğrulaması'],
  'local-clinical-scope-gates': ['Clinical scope restrictions', 'Klinik kapsam sınırlamaları'],
};
const label = (labels, key, language, fallback) => {
  const pair = typeof key === 'string' && Object.hasOwn(labels, key) ? labels[key] : null;
  return pair ? pair[localeOf(language) === 'tr' ? 1 : 0] : fallback;
};
const localizedSource = (value, language, translateValue) => {
  const raw = typeof value === 'string' ? value : value && typeof value[localeOf(language)] === 'string' ? value[localeOf(language)] : '';
  return typeof translateValue === 'function' ? String(translateValue(raw) ?? '') : raw;
};
const sourceUrl = value => {
  if (typeof value !== 'string') return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : null;
  } catch { return null; }
};

export function coreRuleSourcesTitle(language = 'en') {
  return text(language, 'Sources for core calculations', 'Ana hesaplamaların kaynakları');
}

/** Pure markup: source titles, access and HTTPS links come only from the canonical catalog. */
export function coreRuleSourcesMarkup(provenance, evidence = [], language = 'en', translateValue) {
  const locale = localeOf(language), T = (en, tr) => text(locale, en, tr);
  const catalog = new Map((Array.isArray(evidence) ? evidence : []).filter(source => source && typeof source.id === 'string').map(source => [source.id, source]));
  const rules = Array.isArray(provenance?.rules) ? provenance.rules : [];
  const cards = rules.map(rule => {
    const description = describeCoreRule(rule?.id, locale);
    if (!description) return '';
    const references = Array.isArray(rule.sourceReferences) ? rule.sourceReferences : [];
    const sources = references.length ? `<ul>${references.map(reference => {
      const source = catalog.get(reference?.sourceId);
      const role = label(roleLabels, reference?.role, locale, T('Contextual reference', 'Bağlamsal kaynak'));
      if (!source) return `<li><strong>${esc(role)}</strong> · ${T('Source unavailable in the current catalog.', 'Kaynak güncel katalogda bulunamadı.')}</li>`;
      const title = localizedSource(source.title, locale, translateValue) || source.id;
      const access = localizedSource(source.access, locale, translateValue) || T('Access not recorded', 'Erişim kaydı yok');
      const url = sourceUrl(source.url);
      return `<li><strong>${esc(role)}</strong><br>${url ? `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(title)} ↗</a>` : `${esc(title)} · ${T('Source link unavailable', 'Kaynak bağlantısı kullanılamıyor')}`}<br><small>${esc(access)}</small></li>`;
    }).join('')}</ul>` : `<p class="footnote">${T('No dedicated source is mapped for this output group.', 'Bu çıktı grubu için özel bir kaynak eşleştirilmedi.')}</p>`;
    const policies = (Array.isArray(rule.implementationPolicies) ? rule.implementationPolicies : []).map(code => label(policyLabels, code, locale, T('Additional local policy', 'Diğer yerel yazılım politikası')));
    return `<article class="criteria-card" data-status="review"><span class="criteria-status">${esc(label(statusLabels, rule.mappingStatus, locale, T('Reference mapping', 'Kaynak eşlemesi')))}</span><h3>${esc(description.label)}</h3><p>${esc(description.scopeNote)}</p>${sources}${policies.length ? `<p class="footnote"><strong>${T('Software policies', 'Yazılım politikaları')}:</strong> ${esc(policies.join(' · '))}.</p>` : ''}</article>`;
  }).join('');
  return `<p class="footnote">${T('This is a map of the current implementation. Source links do not independently verify every implemented rule or software policy.', 'Bu, mevcut uygulamanın kaynak eşlemesidir. Kaynak bağlantıları, uygulanan her kuralı veya yazılım politikasını bağımsız olarak doğrulamaz.')}</p><p class="footnote">${T('Engine', 'Motor')}: ${esc(provenance?.engineVersion)} · ${T('Documentation reviewed', 'Belge inceleme tarihi')}: ${esc(provenance?.documentationReviewedAt)} · ${T('Evidence cutoff', 'Kanıt kesiti')}: ${esc(provenance?.evidenceCutoff)}</p><div class="clinical-grid">${cards}</div>`;
}
