import { getLocale } from './i18n.mjs';

const orderedFields = ['studyId', 'visitDate', 'age', 'height', 'weight', 'context', 'phase'];
const missing = value => value == null || (typeof value === 'string' && value.trim() === '');

export function initStartGuide({ getInput, getView, navigate, openArchive, getLanguage = getLocale }) {
  const target = document.getElementById('startGuide');
  if (!target) return { refresh() {} };
  target.setAttribute('data-no-i18n', '');
  target.setAttribute('aria-labelledby', 'startGuideTitle');

  function focusPatientInput() {
    navigate('assessment');
    const input = getInput() || {};
    const invalid = Array.isArray(input.inputErrors) ? input.inputErrors : [];
    const first = orderedFields.find(id => invalid.includes(id) || missing(input[id]));
    const control = document.getElementById(first || 'studyId') || document.getElementById('studyId');
    if (!control) return;
    control.focus({ preventScroll: true });
    const reducedMotion = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    control.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'center' });
  }

  function refresh() {
    const tr = getLanguage() === 'tr';
    target.hidden = getView() !== 'assessment';
    if (target.hidden) return;
    const copy = tr ? {
      eyebrow: 'BURADAN BAŞLAYIN', title: 'Önce hastanın temel bilgilerini girin.',
      order: 'Hasta bilgileri → Kan sonuçları → Beslenme planı → İzlem ve kayıtlar',
      instruction: 'Çalışma kodu, değerlendirme tarihi, yaş, boy, ağırlık ve bakım ortamıyla başlayın. Diğer değerlendirmeleri ve kanıt menülerini hastaya gerektiğinde açın.',
      start: 'Hasta bilgilerine git', archive: 'Kayıtlı hastayı aç',
    } : {
      eyebrow: 'START HERE', title: 'Begin with the patient’s core information.',
      order: 'Patient information → Laboratory results → Nutrition plan → Follow-up & records',
      instruction: 'Start with the study code, assessment date, age, height, weight and care setting. Open the additional assessments and evidence menus when relevant to this patient.',
      start: 'Go to patient information', archive: 'Open a saved patient',
    };
    target.innerHTML = `<div class="start-guide-copy"><span class="eyebrow">${copy.eyebrow}</span><h2 id="startGuideTitle">${copy.title}</h2><p class="start-guide-order">${copy.order}</p><p>${copy.instruction}</p></div><div class="start-guide-actions"><button id="startGuidePatient" type="button" class="button primary">${copy.start} <span aria-hidden="true">↓</span></button>${typeof openArchive === 'function' ? `<button id="startGuideArchive" type="button" class="button subtle">${copy.archive}</button>` : ''}</div>`;
    document.getElementById('startGuidePatient').addEventListener('click', focusPatientInput);
    document.getElementById('startGuideArchive')?.addEventListener('click', () => openArchive());
  }

  refresh();
  return { refresh };
}
