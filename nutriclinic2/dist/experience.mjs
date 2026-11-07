import { getLocale, translate } from './i18n.mjs';
import { decisionTopics, DECISION_REVIEW_VERSION } from './decision-topics.mjs';
import { makeReview, isReviewCurrent, choiceAvailable } from './decision-review.mjs';
import { dateValid } from './import.mjs';
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const text = (en, tr) => getLocale() === 'tr' ? tr : en;
const local = value => typeof value === 'object' && value ? value[getLocale()] : value;

export function initExperience({ getInput, getResult, getVisits, getView, getSource, navigate, toast, onDraftChange }) {
  const $ = id => document.getElementById(id);
  let selectedTopic = decisionTopics[0].id, reviews = {}, drafts = {};
  const currentTopic = () => decisionTopics.find(topic => topic.id === selectedTopic);
  const draftFor = topic => drafts[topic.id] ||= { choiceId: reviews[topic.id]?.choiceId || '', rationale: reviews[topic.id]?.rationale || '', confirmed: false };

  function workflow() {
    $('workflowNav').setAttribute('aria-label', text('Assessment steps','Değerlendirme adımları'));
    const input = getInput(), result = getResult(), view = getView();
    const clinicalView = ['assessment','labs','plan','research'].includes(view);
    $('workflowNav').hidden = !clinicalView;
    $('workflowNext').hidden = !clinicalView || view === 'assessment';
    const inputErrors = input.inputErrors === undefined ? [] : input.inputErrors;
    const errorsKnown = Array.isArray(inputErrors) && inputErrors.every(id => typeof id === 'string');
    const contextKnown = dateValid(input.visitDate) && Number.isFinite(input.age) && input.age >= 18 && input.age <= 120 && Number.isFinite(input.height) && input.height >= 100 && input.height <= 230 && Number.isFinite(input.weight) && input.weight >= 20 && input.weight <= 350 && ['ward','icu'].includes(input.context) && errorsKnown && inputErrors.length === 0;
    const laboratoryFields = ['age','visitDate','labDate','uunDate','albumin','neutrophils','lymphocytes','crp','lactate','creatinine','potassium','phosphate','magnesium','uun','actualProtein','collectionStart','collectionEnd','urineVolume'];
    const labsReviewed = input.labsConfirmed === true && dateValid(input.visitDate) && dateValid(input.labDate) && input.labDate <= input.visitDate && errorsKnown && !inputErrors.some(id => laboratoryFields.includes(id));
    const planReady = !!result.plan && !result.blockers.length;
    const saved = getVisits().filter(visit => visit.input.studyId === input.studyId && visit.input.visitDate === input.visitDate).length;
    const steps = [
      { id:'assessment', number:'01', label:text('Patient context','Hasta bağlamı'), detail:contextKnown ? text('Core inputs entered','Temel girdiler girildi') : text('Start with the patient','Hastayla başlayın'), done:contextKnown },
      { id:'labs', number:'02', label:text('Laboratory review','Laboratuvar kontrolü'), detail:labsReviewed ? text('Source check recorded','Kaynak kontrolü kaydedildi') : text('Upload or enter results','Yükleyin veya elle girin'), done:labsReviewed },
      { id:'plan', number:'03', label:text('Targets & program','Hedefler ve program'), detail:planReady ? text('Draft available','Taslak görüntülenebilir') : text('Check safety & targets','Güvenlik ve hedef kontrolü'), done:planReady },
      { id:'research', number:'04', label:text('Review & record','İnceleme ve kayıt'), detail:saved ? text(`${saved} saved for this case`,`${saved} olgu kaydı`) : text('Save or export','Kaydedin veya dışa aktarın'), done:!!saved },
    ];
    $('workflowNav').innerHTML = steps.map(step => `<button type="button" class="workflow-step ${view === step.id ? 'is-current' : ''} ${step.done ? 'is-complete' : ''}" data-workflow="${step.id}" ${view === step.id ? 'aria-current="step"' : ''}><span class="workflow-number">${step.number}</span><span class="workflow-copy"><strong class="workflow-label">${esc(step.label)}</strong><span class="workflow-detail">${esc(step.detail)}</span></span></button>`).join('');
    const next = !contextKnown ? ['assessment',text('Complete patient context','Hasta bağlamını tamamlayın')]
      : !labsReviewed ? ['labs',text('Review laboratory values','Laboratuvar değerlerini kontrol edin')]
      : !planReady ? ['plan',text('Review safety checks & targets','Güvenlik kontrollerini ve hedefleri inceleyin')]
      : ['research',text('Review and save this assessment','Değerlendirmeyi inceleyin ve kaydedin')];
    $('workflowNext').innerHTML = `<span>${esc(text('Next in your assessment','Değerlendirmede sonraki adım'))}</span><button class="text-button" type="button" data-workflow="${next[0]}">${esc(next[1])} →</button><button class="text-button" type="button" data-workflow="decisions">${esc(text('Compare approaches','Yaklaşımları karşılaştır'))} ⇄</button>`;
  }

  function sourceCard(study) {
    const source = getSource(study.id);
    if (!source) return '';
    return `<article class="decision-study"><span class="decision-tag">${esc(local(study.badge))}</span><h3>${esc(study.short)}</h3><dl class="decision-facts"><dt>${text('Population','Hasta grubu')}</dt><dd>${esc(local(study.population))}</dd><dt>${text('What was compared','Karşılaştırılan')}</dt><dd>${esc(local(study.intervention))}</dd></dl><div class="decision-outcome">${esc(local(study.outcome))}</div><details class="evidence-details"><summary>${text('Source access & limits','Kaynağa erişim ve sınırlar')}</summary><p>${esc(translate(source.access))}</p><p>${esc(translate(source.accessNote || source.limitations))}</p></details><a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">${text('Read original source','Özgün kaynağı oku')} ↗</a></article>`;
  }

  function renderTopic() {
    $('decisionTabs').setAttribute('aria-label', text('Evidence comparison topics','Kanıt karşılaştırma konuları'));
    const topic = currentTopic(), input = getInput(), result = getResult(), draft = draftFor(topic), review = reviews[topic.id];
    const current = isReviewCurrent(review, input);
    $('decisionTabs').innerHTML = decisionTopics.map(item => `<button class="decision-tab ${topic.id === item.id ? 'active' : ''}" type="button" data-topic="${item.id}" aria-pressed="${topic.id === item.id}">${esc(local(item.label))}</button>`).join('');
    const context = input.context === 'icu' ? text('Intensive care','Yoğun bakım') : input.context === 'ward' ? text('Ward','Servis') : text('Setting not specified','Ortam belirtilmedi');
    const phase = {early:text('Early acute','Erken akut'),late:text('Late acute','Geç akut'),recovery:text('Recovery','İyileşme')}[input.phase] || text('Phase not specified','Faz belirtilmedi');
    const safe = result.blockers.length ? text(`${result.blockers.length} planning checks unresolved`,`${result.blockers.length} plan kontrolü tamamlanmadı`) : text('Basic planning checks completed','Temel plan kontrolleri tamamlandı');
    $('decisionContent').innerHTML = `<div data-tone="${topic.tone}"><div class="decision-patient-context"><strong>${esc(context)} · ${esc(phase)}</strong><span>${esc(safe)}</span></div><div class="decision-toolbar"><span class="decision-tag">${topic.number} · ${text('Focused evidence comparison','Odaklı kanıt karşılaştırması')}</span><span class="footnote">${text('Comparison version','Karşılaştırma sürümü')} · ${esc(DECISION_REVIEW_VERSION)}</span></div><h2>${esc(local(topic.title))}</h2><p class="decision-question">${esc(local(topic.question))}</p><div class="decision-comparison">${topic.studies.map(sourceCard).join('')}</div><section class="decision-synthesis"><h3>${text('Why these findings differ','Bu bulgular neden farklı?')}</h3><p>${esc(local(topic.synthesis))}</p><details class="evidence-details"><summary>${text('All sources used in this comparison','Karşılaştırmada kullanılan tüm kaynaklar')}</summary><ul>${topic.sourceIds.map(id => { const source = getSource(id); return source ? `<li><a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">${esc(translate(source.title))} ↗</a> <small>· ${esc(translate(source.access))}</small></li>` : ''; }).join('')}</ul></details></section><form id="decisionForm" class="decision-choice"><h3>${text('Your clinical interpretation','Klinik yorumunuz')}</h3><p>${text('Document an institution-approved approach and why it fits this patient. This is optional research documentation; it does not apply doses, start treatment or unlock a blocked calculation.','Kurumun onayladığı yaklaşımı ve hastaya neden uygun olduğunu kaydedin. Bu isteğe bağlı araştırma kaydıdır; doz uygulamaz, tedavi başlatmaz veya engelli hesabı açmaz.')}</p><fieldset class="decision-choice-grid"><legend class="visually-hidden">${text('Approach to document','Kaydedilecek yaklaşım')}</legend>${topic.choices.map(choice => { const available = choiceAvailable(choice,input); return `<label class="decision-option ${!available ? 'unavailable' : ''}"><input type="radio" name="clinicalApproach" value="${choice.id}" ${draft.choiceId === choice.id && available ? 'checked' : ''} ${available ? '' : 'disabled'}><span><strong>${esc(local(choice.label))}</strong><small>${esc(local(choice.detail))}${available ? '' : ' · ' + text('Unavailable for the current setting or phase.','Mevcut ortam veya faz için uygun değil.')}</small></span></label>`; }).join('')}</fieldset><label class="decision-rationale" for="decisionRationale"><strong>${text('Reasoning & protocol version','Gerekçe ve protokol sürümü')}</strong><textarea id="decisionRationale" maxlength="1200" rows="4" placeholder="${text('Patient fit, protocol/version, uncertainty, monitoring and reassessment…','Hastaya uygunluk, protokol/sürüm, belirsizlik, izlem ve yeniden değerlendirme…')}">${esc(draft.rationale)}</textarea></label><label class="check-field"><input type="checkbox" id="decisionAcknowledged" ${draft.confirmed ? 'checked' : ''}><span>${text('I reviewed the patient population, limitations and current clinical inputs.','Hasta grubunu, sınırlılıkları ve güncel klinik girdileri değerlendirdim.')}</span></label><div class="decision-actions"><button class="button primary" type="submit">${text('Save reasoning for this assessment','Bu değerlendirme için gerekçeyi kaydet')}</button><button class="button subtle" type="button" data-decision-plan>${text('Back to nutrition plan','Beslenme planına dön')} →</button></div><p id="decisionStatus" class="decision-note ${review && !current ? 'stale' : ''}" role="status">${review ? (current ? text('Reasoning recorded for the current inputs. Save the assessment to include it in JSON/CSV and the report.','Gerekçe güncel girdiler için kaydedildi. JSON/CSV ve rapora eklemek için değerlendirmeyi kaydedin.') : text('Inputs or confirmations changed. Review this choice again before treating it as current.','Girdiler veya onaylar değişti. Güncel saymadan önce seçimi yeniden değerlendirin.')) : text('No approach is selected by default.','Varsayılan bir yaklaşım seçilmez.')}</p></form></div>`;
    $('decisionRationale').addEventListener('input', event => { draft.rationale = event.target.value; onDraftChange?.(); });
    $('decisionAcknowledged').addEventListener('change', event => { draft.confirmed = event.target.checked; onDraftChange?.(); });
    $('decisionForm').addEventListener('change', event => { if (event.target.name === 'clinicalApproach') { draft.choiceId = event.target.value; onDraftChange?.(); } });
    $('decisionForm').addEventListener('submit', event => {
      event.preventDefault();
      const status = $('decisionStatus');
      if (!draft.choiceId || !choiceAvailable(topic.choices.find(choice => choice.id === draft.choiceId), getInput())) { status.textContent = text('Select an available approach.','Uygun bir yaklaşım seçin.'); return; }
      if (!draft.rationale.trim()) { status.textContent = text('Add your clinical reasoning and protocol/version.','Klinik gerekçeyi ve protokol/sürümü ekleyin.'); $('decisionRationale').focus(); return; }
      if (!draft.confirmed) { status.textContent = text('Confirm that you reviewed the population, limits and inputs.','Hasta grubunu, sınırları ve girdileri değerlendirdiğinizi onaylayın.'); return; }
      try {
        reviews[topic.id] = makeReview({ topicId:topic.id, choiceId:draft.choiceId, rationale:draft.rationale, confirmed:true, input:getInput() }, decisionTopics);
        renderTopic(); report();
        onDraftChange?.();
        toast('Klinik gerekçe bu oturumda kaydedildi.');
      } catch { status.textContent = text('The review could not be saved. Recheck the choice and inputs.','Değerlendirme kaydedilemedi. Seçimi ve girdileri kontrol edin.'); }
    });
    $('decisionContent').querySelector('[data-decision-plan]').addEventListener('click', () => navigate('plan'));
  }

  function report() {
    const target = $('decisionReport');
    if (!target) return;
    const items = Object.values(reviews);
    target.innerHTML = `<h3>${text('Clinical interpretation records','Klinik yorum kayıtları')}</h3>${items.length ? items.map(review => {
      const topic = decisionTopics.find(item => item.id === review.topicId), choice = topic?.choices.find(item => item.id === review.choiceId);
      if (!topic || !choice) return '';
      return `<div class="trace-row"><strong>${esc(local(topic.label))} · ${esc(local(choice.label))}</strong><p data-no-i18n>${esc(review.rationale)}</p><small>${esc(review.reviewedAt)} · ${isReviewCurrent(review,getInput()) ? text('Current inputs reviewed','Güncel girdiler değerlendirildi') : text('Reassessment required','Yeniden değerlendirme gerekli')}</small></div>`;
    }).join('') : `<p class="footnote">${text('No optional clinical interpretation recorded.','İsteğe bağlı klinik yorum kaydedilmedi.')}</p>`}`;
  }

  $('decisionTabs').addEventListener('click', event => {
    const button = event.target.closest('[data-topic]');
    if (button && decisionTopics.some(topic => topic.id === button.dataset.topic)) { selectedTopic = button.dataset.topic; renderTopic(); onDraftChange?.(); }
  });
  for (const element of [$('workflowNav'),$('workflowNext')]) element.addEventListener('click', event => {
    const button = event.target.closest('[data-workflow]');
    if (button) navigate(button.dataset.workflow);
  });
  const refresh = () => { workflow(); renderTopic(); report(); };
  const restoredReviews = items => Object.fromEntries((Array.isArray(items) ? items : []).flatMap(item => {
    const topic = decisionTopics.find(topic => topic.id === item?.topicId);
    if (!topic?.choices.some(choice => choice.id === item.choiceId) || typeof item.rationale !== 'string' || item.rationale.length > 1200) return [];
    let reviewedInput = {};
    try { if (item.reviewedInput && typeof item.reviewedInput === 'object' && !Array.isArray(item.reviewedInput)) reviewedInput = JSON.parse(JSON.stringify(item.reviewedInput)); } catch { return []; }
    return [[topic.id, {topicId:topic.id,choiceId:item.choiceId,rationale:item.rationale,reviewedInput,
      sourceIds:Array.isArray(item.sourceIds)?item.sourceIds.filter(id=>topic.sourceIds.includes(id)):[],
      reviewedAt:typeof item.reviewedAt==='string'&&item.reviewedAt.length<=80?item.reviewedAt:'',confirmed:false,currentAtSave:false}]];
  }));
  refresh();
  return {
    refresh,
    reset() { reviews = {}; drafts = {}; refresh(); },
    invalidateReviews() { for (const review of Object.values(reviews)) review.confirmed = false; for (const draft of Object.values(drafts)) draft.confirmed = false; },
    restore(items = []) {
      reviews = restoredReviews(items); drafts = {};
      refresh();
    },
    getDraft() { return {selectedTopic,reviews:Object.values(reviews).map(review=>({...structuredClone(review),confirmed:false,currentAtSave:false})),drafts:structuredClone(drafts)}; },
    restoreDraft(data) {
      reviews = restoredReviews(data?.reviews); drafts = {};
      selectedTopic = decisionTopics.some(topic=>topic.id===data?.selectedTopic)?data.selectedTopic:decisionTopics[0].id;
      for (const topic of decisionTopics) {
        const raw = data?.drafts && Object.hasOwn(data.drafts,topic.id) ? data.drafts[topic.id] : null;
        if (!raw || typeof raw !== 'object' || Array.isArray(raw)) continue;
        drafts[topic.id] = {choiceId:topic.choices.some(choice=>choice.id===raw.choiceId)?raw.choiceId:'',
          rationale:typeof raw.rationale==='string'&&raw.rationale.length<=1200?raw.rationale:'',confirmed:false};
      }
      refresh();
    },
    snapshot() {
      return { version:DECISION_REVIEW_VERSION, records:Object.values(reviews).map(review => ({ ...structuredClone(review), currentAtSave:isReviewCurrent(review,getInput()) })) };
    },
  };
}
