import { VERSION } from './engine.mjs';
import { EVIDENCE_CUTOFF } from './config.mjs';

// A bounded documentation map. An original-abstract equation check does not
// validate clinical applicability or establish source support for local guards.
// Keep patient/reviewer state and localized prose out of the exported map.
const rules = [
  {
    id: 'anthropometry',
    outputPaths: ['bmi', 'weightLoss'],
    sourceReferences: [],
    mappingStatus: 'arithmetic-unmapped',
    implementationPolicies: ['local-input-validity', 'local-adult-scope', 'local-display-rounding'],
  },
  {
    id: 'glim',
    outputPaths: ['glim'],
    sourceReferences: [
      { sourceId: 'glim-2025', role: 'clinical-framework' },
      { sourceId: 'glim-intake-2026', role: 'intake-interpretation' },
    ],
    mappingStatus: 'framework-context',
    implementationPolicies: ['local-clinician-confirmed-findings', 'local-candidate-only', 'local-unrounded-thresholds'],
  },
  {
    id: 'nlr',
    outputPaths: ['indices.nlr'],
    sourceReferences: [],
    mappingStatus: 'formula-unmapped',
    implementationPolicies: ['local-verified-lab-date', 'local-positive-denominator', 'local-dependent-error-gates'],
  },
  {
    id: 'pni',
    outputPaths: ['indices.pni'],
    sourceReferences: [
      { sourceId: 'onodera-pni-1984', role: 'original-abstract-formula-units' },
      { sourceId: 'aspen-visceral-2021', role: 'interpretation-context' },
    ],
    mappingStatus: 'formula-units-checked-abstract-only',
    implementationPolicies: ['local-canonical-units', 'local-verified-lab-date', 'local-dependent-error-gates'],
  },
  {
    id: 'nitrogenBalance',
    outputPaths: ['indices.nitrogen', 'metabolic'],
    sourceReferences: [
      { sourceId: 'jccng-2024', role: 'approximate-method-context' },
      { sourceId: 'espen-kidney-2024', role: 'applicability-context' },
      { sourceId: 'lin-pmv-2026', role: 'original-use-context' },
    ],
    mappingStatus: 'approximate-method-context',
    implementationPolicies: ['local-matched-collection-intake', 'local-24h-tolerance', 'local-date-volume-gates', 'local-renal-loss-suppression'],
  },
  {
    id: 'refeedingRisk',
    outputPaths: ['refeeding'],
    sourceReferences: [{ sourceId: 'nice-cg32', role: 'risk-framework' }],
    mappingStatus: 'risk-framework-context',
    implementationPolicies: ['local-electrolyte-precheck', 'local-incomplete-conflict-gates', 'local-plan-suppression'],
  },
  {
    id: 'formulaPlan',
    outputPaths: ['plan', 'reference'],
    sourceReferences: [{ sourceId: 'espen-icu-2023', role: 'clinical-context-only' }],
    mappingStatus: 'clinical-context-only',
    implementationPolicies: ['local-physician-target-input', 'local-volume-cap-floor', 'local-product-provenance-gates', 'local-clinical-scope-gates'],
  },
];

const descriptions = new Map([
  ['anthropometry', {
    en: {
      label: 'BMI and weight change',
      scopeNote: 'Descriptive arithmetic; no dedicated clinical source is mapped. Input and adult-scope guards are local policies. This map does not establish clinical validation.',
    },
    tr: {
      label: 'BKİ ve ağırlık değişimi',
      scopeNote: 'Betimleyici aritmetik; özel bir klinik kaynak eşleştirilmedi. Girdi ve erişkin kapsamı kontrolleri yerel yazılım politikalarıdır. Bu harita klinik validasyon göstermez.',
    },
  }],
  ['glim', {
    en: {
      label: 'GLIM candidate findings',
      scopeNote: 'The sources provide a clinical framework and intake-interpretation context. Findings remain candidates requiring clinical assessment. Local guards and the implementation have not been clinically validated by this map.',
    },
    tr: {
      label: 'GLIM aday bulguları',
      scopeNote: 'Kaynaklar klinik çerçeve ve alımın yorumlanması için bağlam sağlar. Bulgular klinik değerlendirme gerektiren adaylardır. Bu harita yerel kontrollerin veya uygulamanın klinik validasyonu değildir.',
    },
  }],
  ['nlr', {
    en: {
      label: 'Neutrophil-to-lymphocyte ratio (NLR)',
      scopeNote: 'No dedicated NLR formula source is mapped in the current catalog. Laboratory guards are local policies; other marker papers do not validate this formula or a dose decision. Clinical validation remains pending.',
    },
    tr: {
      label: 'Nötrofil/lenfosit oranı (NLR)',
      scopeNote: 'Mevcut katalogda özel bir NLR formül kaynağı eşleştirilmedi. Laboratuvar kontrolleri yerel yazılım politikalarıdır; diğer belirteç makaleleri bu formülü veya doz kararını doğrulamaz. Klinik validasyon beklemektedir.',
    },
  }],
  ['pni', {
    en: {
      label: 'Prognostic nutritional index (PNI)',
      scopeNote: 'The original English abstract states the PNI equation and units; the app uses their algebraically equivalent canonical-unit form. Japanese full-text methods remain unread. ASPEN provides albumin-interpretation context. This does not establish ICU/ward clinical validity, validate local guards or supply a dose rule.',
    },
    tr: {
      label: 'Prognostik beslenme indeksi (PNI)',
      scopeNote: 'Özgün İngilizce özet PNI denklemini ve birimlerini belirtir; uygulama bunun cebirsel olarak eşdeğer kanonik birim biçimini kullanır. Japonca tam metin yöntemleri okunmadı. ASPEN albümin yorumuna bağlam sağlar. Bu kontrol YBÜ/servis klinik geçerliğini veya yerel kontrolleri doğrulamaz; doz kuralı sağlamaz.',
    },
  }],
  ['nitrogenBalance', {
    en: {
      label: 'Approximate nitrogen balance',
      scopeNote: 'Sources give approximate-method and renal-applicability context. A 2026 PMV trial reports use of this equation; it does not validate an individual anabolic-state classifier. Collection tolerance and suppression guards are local policies. Estimated balance does not prove muscle anabolism or an optimum dose.',
    },
    tr: {
      label: 'Yaklaşık azot dengesi',
      scopeNote: 'Kaynaklar yaklaşık yöntem ve renal uygulanabilirlik bağlamı sağlar. 2026 PMV çalışması bu denklemin kullanımını bildirir; bireysel anabolik durum sınıflandırıcısını doğrulamaz. Toplama toleransı ve sonucu engelleme kontrolleri yerel yazılım politikalarıdır. Tahmini denge kas anabolizmasını veya optimum dozu kanıtlamaz.',
    },
  }],
  ['refeedingRisk', {
    en: {
      label: 'Refeeding risk screen',
      scopeNote: 'NICE provides the risk framework, not a diagnosis of developed syndrome. Electrolyte prechecks and plan suppression are local policies; linking the source does not clinically validate every implementation guard.',
    },
    tr: {
      label: 'Refeeding risk taraması',
      scopeNote: 'NICE risk çerçevesi sağlar; gelişmiş sendrom tanısı koymaz. Elektrolit ön kontrolleri ve planın engellenmesi yerel yazılım politikalarıdır; kaynak bağlantısı her uygulama kontrolünün klinik validasyonu değildir.',
    },
  }],
  ['formulaPlan', {
    en: {
      label: 'Formula plan arithmetic and references',
      scopeNote: 'ESPEN ICU supplies clinical context only. The plan performs arithmetic from physician-entered targets, not an optimum-dose recommendation. Volume rounding and scope guards are local policies; this map does not establish clinical validation.',
    },
    tr: {
      label: 'Mama planı aritmetiği ve referanslar',
      scopeNote: 'ESPEN YBÜ yalnız klinik bağlam sağlar. Plan, hekimin girdiği hedeflerle aritmetik hesap yapar; optimum doz önermez. Hacim yuvarlama ve kapsam kontrolleri yerel yazılım politikalarıdır; bu harita klinik validasyon göstermez.',
    },
  }],
]);

/** Build a fresh trusted map from local constants; accepts no imported metadata. */
export function buildCoreRuleProvenance() {
  return {
    schemaVersion: '0.1.0',
    origin: 'current-implementation-map',
    engineVersion: VERSION,
    documentationReviewedAt: '2026-10-26',
    evidenceCutoff: EVIDENCE_CUTOFF,
    scope: 'reference-map-only',
    clinicalValidation: false,
    implementationPolicyScope: 'local-policies-not-source-validation',
    rules: rules.map(rule => ({
      id: rule.id,
      outputPaths: [...rule.outputPaths],
      sourceReferences: rule.sourceReferences.map(reference => ({ ...reference })),
      mappingStatus: rule.mappingStatus,
      implementationPolicies: [...rule.implementationPolicies],
    })),
  };
}

/** Fresh UI prose; unknown IDs never resolve through Object.prototype. */
export function describeCoreRule(id, language = 'en') {
  const description = typeof id === 'string' ? descriptions.get(id) : undefined;
  return description ? { ...description[language === 'tr' ? 'tr' : 'en'] } : null;
}
