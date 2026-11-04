import { decisionTopics } from './decision-topics.mjs';

const object = value => value && typeof value === 'object' && !Array.isArray(value) ? value : {};
const array = value => Array.isArray(value) ? value : [];
const esc = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
const units = {
  fatFreeMass: 'kg', gripStrength: 'kg', chairRiseSeconds: 's', appendicularMass: 'kg', gaitSpeed: 'm/s',
  sppb: '0–12', eat10Total: '0–40', iddsiFood: '3–7', iddsiFluid: '0–4', crpULN: 'mg/L',
  sofaGcs: '3–15', sofaPaO2: 'mmHg', sofaFiO2: 'fraction', sofaMap: 'mmHg',
  sofaNe: 'µg/kg/min', sofaEpi: 'µg/kg/min', sofaBilirubin: 'mg/dL', sofaCreatinine: 'mg/dL',
  sofaPlatelets: '10³/µL', saps2Total: '0–163', actualEnergy: 'kcal/24h', actualProtein: 'g/24h',
};
const confirmationFields = new Set(['ffmMethodValid', 'strengthValid', 'muscleValid', 'performanceValid', 'functionConfirmed', 'dysphagiaConfirmed', 'contextReviewed', 'markerConfirmed', 'sofaConfirmed', 'sapsConfirmed', 'targetsStable', 'confirmed', 'applicabilityConfirmed']);
const requiredClinicalTrace = ['functionSource', 'functionDate', 'functionConfirmed', 'dysphagiaSource', 'dysphagiaDate', 'dysphagiaConfirmed', 'markerDate', 'markerConfirmed', 'sofaDate', 'sofaConfirmed', 'sapsDate', 'sapsConfirmed', 'contextReviewed', 'invalidFields'];
const statusLabels = {
  incomplete: ['Incomplete assessment', 'Eksik değerlendirme'], review: ['Clinical interpretation', 'Klinik yorum'],
  met: ['Criterion / candidate pattern', 'Ölçüt / aday örüntü'], not_met: ['Threshold not met', 'Eşik karşılanmadı'],
};

/**
 * Presentation only: all clinical values, eligibility, errors and source IDs
 * must already be computed by the caller. No DOM, storage, clock, fetch or
 * clinical evaluation is used. Inputs and confirmation states are not changed.
 * clinicalInput is workspace.getMeasures(); clinicalOutputs is snapshot.outputs.
 * delivery is followup.snapshot(); followupComparison is followup.series().
 * decisionReviews are fresh experience.snapshot().records, not imported approval.
 */
export function reportAppendixMarkup(options = {}) {
  const o = object(options), language = o.language === 'tr' ? 'tr' : 'en';
  const T = (en, tr) => language === 'tr' ? tr : en;
  const local = value => typeof value === 'string'
    ? (typeof o.translateValue === 'function' ? o.translateValue(value, language) : value)
    : object(value)[language] ?? '';
  const missing = T('Missing / not assessed', 'Eksik / değerlendirilmedi');
  const display = (value, key = '') => {
    if (value == null || value === '') return missing;
    if (typeof value === 'boolean') return confirmationFields.has(key)
      ? value ? T('Confirmed', 'Doğrulandı') : T('Not confirmed', 'Doğrulanmadı')
      : value ? T('Yes', 'Evet') : T('No', 'Hayır');
    if (typeof value === 'number') return Number.isFinite(value) ? String(value) : T('Invalid non-finite value', 'Geçersiz sonlu olmayan değer');
    if (typeof value === 'string') return value;
    try { return JSON.stringify(value) ?? T('Unsupported value', 'Desteklenmeyen değer'); }
    catch { return T('Unprintable value', 'Yazdırılamayan değer'); }
  };
  const row = (label, value) => `<tr><th scope="row">${esc(label)}</th><td>${esc(value)}</td></tr>`;
  const table = rows => `<table><tbody>${rows.join('')}</tbody></table>`;
  const list = values => values.length ? `<ul>${values.map(value => `<li>${esc(local(value) || display(value))}</li>`).join('')}</ul>` : `<p>${esc(T('None supplied', 'Sağlanmadı'))}</p>`;
  const fieldRows = (raw, required = [], unitMap = units) => {
    const data = object(raw), keys = [...new Set([...Object.keys(data), ...required])];
    return keys.map(key => {
      let unit = Object.hasOwn(unitMap, key) ? unitMap[key] : '';
      if (key === 'ureaValue') unit = typeof data.ureaUnit === 'string' ? data.ureaUnit : T('unit not supplied', 'birim sağlanmadı');
      return row(`${key}${unit ? ` [${unit}]` : ''}`, display(data[key], key));
    });
  };
  const refs = new Set(), addRefs = values => array(values).forEach(id => { if (typeof id === 'string' && id) refs.add(id); });
  const input = object(o.input), clinical = object(o.clinicalInput), outputs = object(o.clinicalOutputs);
  const delivery = object(o.delivery), measures = object(delivery.measures), deliveryOutput = object(delivery.output);
  const comparison = object(o.followupComparison), selection = object(comparison.selection), summary = object(comparison.summary);
  const provenance = object(o.coreRuleProvenance), rules = array(provenance.rules);
  const reviews = array(o.decisionReviews).map(object);
  const modules = [...array(outputs.malnutrition), ...array(outputs.fn), ...array(outputs.markers)].map(object);
  const meta = [
    [T('Case / study code', 'Olgu / çalışma kodu'), input.studyId],
    [T('Assessment date (date only)', 'Değerlendirme tarihi (yalnız tarih)'), input.visitDate],
    [T('Blood specimen date (date only)', 'Kan örnek tarihi (yalnız tarih)'), input.labDate],
    [T('UUN specimen / collection-end date (date only)', 'UUN örnek / toplama bitiş tarihi (yalnız tarih)'), input.uunDate],
    [T('UI version', 'Arayüz sürümü'), o.uiVersion], [T('Engine version', 'Motor sürümü'), o.engineVersion],
    ['engineSha256', o.engineSha256], ['assessmentSha256', o.assessmentSha256],
    [T('Evidence cutoff', 'Kanıt kesiti'), o.evidenceCutoff],
  ];
  if (o.evidenceSha256 !== undefined) meta.push(['evidenceSha256', o.evidenceSha256]);
  if (o.generatedAt !== undefined) meta.push([T('Report generated at (provided timestamp)', 'Rapor üretim zamanı (sağlanan zaman damgası)'), o.generatedAt]);
  const metadata = table(meta.map(([key, value]) => row(key, display(value))));

  const clinicalTable = table(fieldRows(clinical, requiredClinicalTrace));
  const moduleHtml = modules.length ? modules.map(module => {
    addRefs(module.sourceIds);
    const status = Object.hasOwn(statusLabels, module.status) ? statusLabels[module.status][language === 'tr' ? 1 : 0] : display(module.status);
    return `<div><h4>${esc(local(module.title) || display(module.id))}</h4><p>${esc(display(module.id))} · ${esc(status)}</p><p>${esc(local(module.summary))}</p>${table(fieldRows(module.values, [], {}))}${list(array(module.details))}<p>${esc(T('Source IDs', 'Kaynak kimlikleri'))}: ${esc(array(module.sourceIds).join(' · ') || T('Not supplied; not inferred', 'Sağlanmadı; çıkarım yapılmadı'))}</p></div>`;
  }).join('') : `<p>${esc(T('Clinical module outputs/source IDs were not supplied; no result or source mapping was inferred.', 'Klinik modül çıktıları/kaynak kimlikleri sağlanmadı; sonuç veya kaynak eşlemesi çıkarılmadı.'))}</p>`;
  const context = object(outputs.ctx);
  const contextHtml = `<h4>${esc(T('Clinical-context restrictions and notes', 'Klinik bağlam sınırlamaları ve notları'))}</h4>${list([...array(context.blockers), ...array(context.nitrogenBlockers), ...array(context.notes)])}`;

  const deliveryHtml = `<h3>${esc(T('Current actual-intake record', 'Güncel gerçek alım kaydı'))}</h3>${table(fieldRows(measures, ['episodeId', 'periodStart', 'periodEnd', 'actualEnergy', 'actualProtein', 'targetVersion', 'source', 'targetsStable', 'confirmed', 'invalidFields']))}<p>${esc(T('Provided delivery validity', 'Sağlanan alım geçerliliği'))}: ${esc(display(deliveryOutput.valid))}</p><h4>${esc(T('Current delivery errors', 'Güncel alım hataları'))}</h4>${list(array(deliveryOutput.errors))}${list(array(deliveryOutput.notes))}`;
  addRefs(deliveryOutput.sourceIds);
  const comparisonScope = table(fieldRows(selection, ['studyId', 'episodeId', 'context', 'phase', 'targetVersion', 'selectedIds'], {}));
  const summaryUnits = {totalEnergy:'kcal', targetEnergy:'kcal', totalProtein:'g', targetProtein:'g', energyPercent:'%', proteinPercent:'%', days:T('verified 24h windows', 'doğrulanmış 24 saatlik dönem'), missingDays:T('24h slots', '24 saatlik dönem')};
  const comparisonSummary = table(fieldRows(summary, ['days', 'missingDays', 'totalEnergy', 'totalProtein'], summaryUnits));
  const observationRows = array(comparison.rows).map(raw => {
    const r = object(raw), period = object(r.period), actual = object(r.actual), targets = object(r.targets), difference = object(r.difference);
    addRefs(r.sourceIds);
    return `<div><h4>${esc(T('Included record', 'Dahil edilen kayıt'))}: ${esc(display(r.recordId))}</h4>${table([
      row(T('Start · written timestamp', 'Başlangıç · yazılan zaman damgası'), display(period.start)),
      row(T('End · written timestamp', 'Bitiş · yazılan zaman damgası'), display(period.end)),
      row(T('Time basis', 'Zaman temeli'), display(period.basis)),
      row(T('Energy · actual / prescribed [kcal/24h]', 'Enerji · gerçek / hedef [kcal/24h]'), `${display(actual.energy)} / ${display(targets.energy)}`),
      row(T('Protein · actual / prescribed [g/24h]', 'Protein · gerçek / hedef [g/24h]'), `${display(actual.protein)} / ${display(targets.protein)}`),
      row(T('Signed differences · kcal / g protein', 'İşaretli farklar · kcal / g protein'), `${display(difference.energy)} / ${display(difference.protein)}`),
      row(T('Estimated nitrogen balance [g N/24h]', 'Yaklaşık azot dengesi [g N/24h]'), display(r.nitrogen)),
    ])}</div>`;
  });
  const observations = observationRows.join('');
  const exclusions = array(comparison.excluded).map(raw => { const r = object(raw); return `<li><strong>${esc(display(r.recordId))}</strong>${list(array(r.reasons))}</li>`; });
  const followupHtml = `<h3>${esc(T('Selected saved follow-up: exact scope and observations', 'Seçili kayıtlı izlem: tam kapsam ve gözlemler'))}</h3>${comparisonScope}${comparisonSummary}<p>${esc(T('Values below are the supplied comparison output; gaps are not zero intake. Percentages refer to the physician prescription, not a biological optimum. Written timestamps/offsets are preserved without timezone conversion.', 'Aşağıdaki değerler sağlanan karşılaştırma çıktısıdır; boşluklar sıfır alım değildir. Yüzdeler biyolojik optimuma değil hekim hedeflerine göredir. Yazılan zaman damgaları/ofsetler saat dilimi dönüşümü olmadan korunur.'))}</p>${observationRows.length ? observations : `<p>${esc(T('No included observation supplied', 'Dahil edilen gözlem sağlanmadı'))}</p>`}<h4>${esc(T('Excluded records and all supplied reasons', 'Dışlanan kayıtlar ve sağlanan tüm gerekçeler'))}</h4>${exclusions.length ? `<ul>${exclusions.join('')}</ul>` : `<p>${esc(T('No exclusions supplied', 'Dışlama sağlanmadı'))}</p>`}${list(array(comparison.notes))}`;

  const dated = reviews.map((review, index) => ({index, time: typeof review.reviewedAt === 'string' ? Date.parse(review.reviewedAt) : NaN})).filter(item => Number.isFinite(item.time));
  const latest = dated.reduce((best, item) => best === null || item.time > best.time ? item : best, null);
  const decisionHtml = `<h3>${esc(T('Clinical interpretation records', 'Klinik yorum kayıtları'))}</h3><p>${esc(T('Optional documentation only; not approval, treatment or a dose instruction. Currentness below is supplied by the fresh session snapshot, not inferred from saved confirmation.', 'Yalnız isteğe bağlı kayıttır; onay, tedavi veya doz talimatı değildir. Aşağıdaki güncellik yeni oturum anlık kaydından sağlanır; kayıtlı onaydan çıkarılmaz.'))}</p>${reviews.length ? reviews.map((review, index) => {
    const topic = decisionTopics.find(item => item.id === review.topicId), choice = topic?.choices.find(item => item.id === review.choiceId);
    addRefs(review.sourceIds);
    const current = review.currentAtSave === true ? T('Current inputs reviewed', 'Güncel girdiler değerlendirildi') : review.currentAtSave === false ? T('Reassessment required', 'Yeniden değerlendirme gerekli') : T('Currentness not supplied', 'Güncellik sağlanmadı');
    return `<div><h4>${esc(local(topic?.label) || display(review.topicId))} · ${esc(local(choice?.label) || display(review.choiceId))}${latest?.index === index ? ` · ${esc(T('Most recent dated record', 'En son tarihli kayıt'))}` : ''}</h4><p>${esc(display(review.reviewedAt))} · ${esc(current)}</p><p>${esc(display(review.rationale))}</p><p>${esc(T('Source IDs', 'Kaynak kimlikleri'))}: ${esc(array(review.sourceIds).join(' · ') || T('Not supplied', 'Sağlanmadı'))}</p></div>`;
  }).join('') : `<p>${esc(T('No interpretation recorded', 'Yorum kaydedilmedi'))}</p>`}`;

  const coreRows = rules.map(raw => {
    const rule = object(raw), references = array(rule.sourceReferences).map(object);
    addRefs(references.map(ref => ref.sourceId));
    return row(display(rule.id), `${display(rule.mappingStatus)} · ${T('Sources/roles', 'Kaynaklar/roller')}: ${references.length ? references.map(ref => `${display(ref.sourceId)} [${display(ref.role)}]`).join('; ') : T('No dedicated source mapped', 'Özel kaynak eşleştirilmedi')} · ${T('Software policies', 'Yazılım politikaları')}: ${array(rule.implementationPolicies).join(' · ') || T('Not supplied', 'Sağlanmadı')}`);
  });
  const coreHtml = `<h3>${esc(T('Core calculation source map', 'Ana hesaplama kaynak eşlemesi'))}</h3><p>${esc(T('Reference mapping only. Sources and local software policies do not establish clinical validation, source agreement with every guard, or an individual anabolic-state/optimal-dose rule.', 'Yalnız kaynak eşlemesidir. Kaynaklar ve yerel yazılım politikaları klinik validasyon, her kontrolün kaynakla uyumu veya bireysel anabolik durum/optimum doz kuralı göstermez.'))}</p>${coreRows.length ? table(coreRows) : `<p>${esc(T('Core source map not supplied', 'Ana kaynak eşlemesi sağlanmadı'))}</p>`}`;

  const catalog = new Map(array(o.sources).map(object).filter(source => typeof source.id === 'string').map(source => [source.id, source]));
  const sourcesHtml = `<h3>${esc(T('Referenced source IDs, access and links', 'Atıf yapılan kaynak kimlikleri, erişim ve bağlantılar'))}</h3>${refs.size ? `<ul>${[...refs].map(id => {
    const source = catalog.get(id);
    if (!source) return `<li>${esc(id)} · ${esc(T('Unavailable in supplied canonical catalog', 'Sağlanan kanonik katalogda yok'))}</li>`;
    let url = null;
    try { const parsed = new URL(source.url); if (parsed.protocol === 'https:' && !parsed.username && !parsed.password) url = parsed.href; } catch {}
    const title = local(source.title) || id;
    return `<li><strong>${esc(id)}</strong> · ${url ? `<a href="${esc(url)}" rel="noopener noreferrer">${esc(title)}</a>` : esc(title)}<br>${esc(local(source.access) || T('Access not supplied', 'Erişim sağlanmadı'))}${url ? `<br>${esc(url)}` : ` · ${esc(T('Safe HTTPS link not supplied', 'Güvenli HTTPS bağlantısı sağlanmadı'))}`}</li>`;
  }).join('')}</ul>` : `<p>${esc(T('No source IDs supplied; none inferred', 'Kaynak kimliği sağlanmadı; çıkarım yapılmadı'))}</p>`}`;
  const laboratory = object(o.labReferences), profile = object(laboratory.profileSnapshot), referenceRows = object(profile.rows);
  const labNames = {albumin:['Albumin','Albümin'],neutrophils:['Absolute neutrophils','Mutlak nötrofil'],lymphocytes:['Absolute lymphocytes','Mutlak lenfosit'],crp:['CRP','CRP'],creatinine:['Creatinine','Kreatinin'],lactate:['Lactate','Laktat'],potassium:['Potassium','Potasyum'],phosphate:['Phosphate','Fosfat'],magnesium:['Magnesium','Magnezyum'],uun:['Urinary urea nitrogen · 24 h','İdrar üre azotu · 24 saat']};
  const referenceStatuses = {below:T('Below entered interval','Girilen aralığın altında'),within:T('Within entered bounds','Girilen sınırlar içinde'),above:T('Above entered interval','Girilen aralığın üstünde'),unavailable:T('Unavailable / verification required','Kullanılamıyor / doğrulama gerekli'),'not-applicable':T('Profile does not apply','Profil uygun değil')};
  const referenceReasons = {
    'row-disabled':T('Interval disabled','Aralık devre dışı'), 'invalid-profile':T('Invalid clinic profile','Geçersiz klinik profili'),
    'applicability-unconfirmed':T('Patient applicability not confirmed','Hastaya uygunluk doğrulanmadı'), 'invalid-error-metadata':T('Invalid error metadata','Geçersiz hata bilgisi'),
    'flagged-input':T('Correct flagged patient fields','İşaretli hasta alanlarını düzeltin'), 'laboratory-unconfirmed':T('Laboratory measurements not confirmed','Laboratuvar ölçümleri doğrulanmadı'),
    'invalid-patient-age':T('Invalid patient age','Geçersiz hasta yaşı'), 'age-mismatch':T('Outside the profile age range','Profil yaş aralığı dışında'),
    'invalid-patient-sex':T('Patient recorded sex unavailable','Hastanın kaydedilen cinsiyeti yok'), 'sex-mismatch':T('Recorded sex does not match this profile','Kaydedilen cinsiyet bu profile uymuyor'),
    'invalid-patient-date':T('Invalid specimen or assessment date','Geçersiz örnek veya değerlendirme tarihi'), 'specimen-after-assessment':T('Specimen is dated after assessment','Örnek tarihi değerlendirmeden sonra'),
    'profile-date-mismatch':T('Profile not valid on the specimen date','Profil örnek tarihinde geçerli değil'), 'collection-unconfirmed':T('Complete urine collection not confirmed','Tam idrar toplaması doğrulanmadı'),
    'missing-measurement':T('Measurement missing','Ölçüm eksik'), 'invalid-measurement':T('Invalid measurement','Geçersiz ölçüm'),
  };
  const bounds = (lower, upper, unit) => `${display(lower)} – ${display(upper)}${typeof unit === 'string' && unit ? ` ${unit}` : ''}`;
  const referenceResults = new Map(array(laboratory.results).map(object).filter(result => typeof result.analyte === 'string').map(result => [result.analyte, result]));
  const enabledReferences = Object.entries(referenceRows).filter(([, raw]) => object(raw).enabled === true);
  const profileRows = [
    [T('Hospital / laboratory','Hastane / laboratuvar'),profile.clinicName], [T('Assay / source document','Yöntem / kaynak belge'),profile.source],
    [T('Profile version','Profil sürümü'),profile.version], [T('Profile schema','Profil şeması'),laboratory.schemaVersion ?? profile.schemaVersion],
    [T('Valid from','Geçerlilik başlangıcı'),profile.effectiveFrom], [T('Valid until · optional','Geçerlilik sonu · isteğe bağlı'),profile.effectiveTo],
    [T('Minimum age [years]','En düşük yaş [yıl]'),profile.ageMin], [T('Maximum age [years]','En yüksek yaş [yıl]'),profile.ageMax],
    [T('Recorded-sex applicability','Kaydedilen cinsiyete uygunluk'),{all:T('All recorded sexes','Tüm kaydedilen cinsiyetler'),female:T('Female','Kadın'),male:T('Male','Erkek')}[profile.sex] ?? profile.sex],
    [T('Patient applicability confirmation','Hastaya uygunluk onayı'),display(laboratory.applicabilityConfirmed,'applicabilityConfirmed')],
  ];
  const referenceDetails = enabledReferences.map(([analyte, raw]) => {
    const interval = object(raw), supplied = referenceResults.get(analyte) ?? {}, name = labNames[analyte];
    const reason = supplied.reason == null ? T('None supplied','Sağlanmadı') : `${referenceReasons[supplied.reason] ?? T('See the supplied reason code','Sağlanan gerekçe koduna bakın')} [${display(supplied.reason)}]`;
    return `<div class="print-lab-interval"><h4>${esc(name ? T(...name) : analyte)} · ${esc(analyte)}</h4>${table([
      row(T('Entered interval · entered unit','Girilen aralık · girilen birim'),bounds(interval.lower,interval.upper,interval.unit)),
      row(T('Compared value · canonical unit','Karşılaştırılan değer · kanonik birim'),`${display(supplied.value)}${typeof supplied.unit === 'string' && supplied.unit ? ` ${supplied.unit}` : ''}`),
      row(T('Compared bounds · canonical unit','Karşılaştırılan sınırlar · kanonik birim'),bounds(supplied.lower,supplied.upper,supplied.unit)),
      row(T('Supplied comparison status','Sağlanan karşılaştırma durumu'),referenceStatuses[supplied.status] ?? display(supplied.status)),
      row(T('Supplied comparison reason','Sağlanan karşılaştırma gerekçesi'),reason),
    ])}</div>`;
  }).join('');
  const labHtml = o.labReferences === undefined ? '' : `<h3>${esc(T('Provided local laboratory references', 'Sağlanan yerel laboratuvar referansları'))}</h3><p>${esc(T('The source profile and comparison below are supplied by the current assessment. This print renderer derives no limits or classification. An absent bound is not zero. A laboratory interval does not establish muscle anabolism, an optimal dose or clinical validation.', 'Aşağıdaki kaynak profili ve karşılaştırma güncel değerlendirmeden sağlanır. Bu yazdırma bileşeni sınır veya sınıflama türetmez. Eksik sınır sıfır değildir. Laboratuvar aralığı kas anabolizması, optimum doz veya klinik validasyon göstermez.'))}</p>${table(profileRows.map(([label,value])=>row(label,display(value))))}${enabledReferences.length ? referenceDetails : `<p>${esc(T('No enabled laboratory interval supplied','Etkin laboratuvar aralığı sağlanmadı'))}</p>`}`;

  return `<section class="report-inputs print-report-appendix" data-no-i18n lang="${language}"><h3>${esc(T('Print trace appendix — current assessment', 'Yazdırma izi eki — güncel değerlendirme'))}</h3><p>${esc(input.demo === true ? T('SYNTHETIC EXAMPLE — no real patient data', 'SENTETİK ÖRNEK — gerçek hasta verisi içermez') : T('Session assessment — research prototype; clinical validation pending', 'Oturum değerlendirmesi — araştırma prototipi; klinik validasyon bekliyor'))}</p><p>${esc(T('Canonical field names, units and supplied values are preserved. Missing is not zero or normal. Date-only fields do not establish a time of day. JSON plus frozen code/manifest remains necessary for reproducibility.', 'Kanonik alan adları, birimler ve sağlanan değerler korunur. Eksik, sıfır veya normal değildir. Yalnız tarih alanları günün saatini göstermez. Tekrar üretilebilirlik için JSON ile dondurulmuş kod/manifest gerekir.'))}</p>${metadata}<h3>${esc(T('Clinical inputs, dates and confirmations', 'Klinik girdiler, tarihler ve doğrulamalar'))}</h3>${clinicalTable}${moduleHtml}${contextHtml}${labHtml}${deliveryHtml}${followupHtml}${decisionHtml}${coreHtml}${sourcesHtml}</section>`;
}
