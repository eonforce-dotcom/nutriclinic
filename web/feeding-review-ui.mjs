// Presentation of engine-calculated feeding stages. No independent dose rule.
// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Gökay Duman
const esc = x => String(x ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function feedingReviewHtml(result, language = 'en') {
  const draft = result.plan?.initiation;
  if (!draft) return '';
  const T = (tr, en) => language === 'tr' ? tr : en;
  const N = (x, digits = 0) => Number(x).toLocaleString(language === 'tr' ? 'tr-TR' : 'en-GB', {maximumFractionDigits:digits});
  const text = b => typeof b === 'string' ? b : b?.[language] ?? b?.en ?? '';
  const steps = draft.steps ?? [];
  const recipe=result.plan?.formulaRecipe;
  const stepProducts=s=>recipe?.rows?.length>1 ? '<br><small>'+recipe.rows.map(r=>esc(`${N(s.volume*r.volumeMl/recipe.totals.formulaVolumeMl,1)} mL ${r.product.name}`)).join(' + ')+'</small>' : '';
  const title = steps.length ? T('Başlangıç ve kademeli artırma', 'Starting and advancing the feed') : T('Başlangıç / devam kararı', 'Start / continuation decision');
  const lead = steps.length ? `<p class="big">${esc(T(`Önerilen başlangıç: ${N(steps[0].rate)} mL/saat. İlk değerlendirme 12. saatte.`, `Suggested start: ${N(steps[0].rate)} mL/h. First reassessment at 12 hours.`))}</p>` : '';
  const table = steps.length ? `<div class="table-wrap"><table><thead><tr><th>${T('Başlangıçtan sonra', 'Time after starting')}</th><th>${T('Önerilen hız', 'Suggested rate')}</th><th>${T('Bu aralıkta mama', 'Formula in this interval')}</th></tr></thead><tbody>${steps.map(s => `<tr><td>${N(s.fromHour)}–${N(s.toHour)} ${T('saat', 'h')}</td><td>${N(s.rate)} mL/${T('saat', 'h')}</td><td>${N(s.volume)} mL · ${N(s.formulaKcal)} kcal · ${N(s.formulaProtein,1)} g ${T('protein', 'protein')}${stepProducts(s)}</td></tr>`).join('')}</tbody></table></div>` : '';
  const first = draft.first24Hours;
  const actual = first ? `<p class="note">${esc(T(`Bu kademelerle ilk 24 saatin planlanan toplamı: ${N(first.volume)} mL, ${N(first.formulaKcal)} kcal ve ${N(first.formulaProtein,1)} g protein. Hedef hız × 24 saat, ilk gün verilen miktar değildir.`, `With these stages the planned first 24 hours total ${N(first.volume)} mL, ${N(first.formulaKcal)} kcal and ${N(first.formulaProtein,1)} g protein. Target rate × 24 hours is not first-day delivery.`))}</p>` : '';
  const checkNames = {
    'hemodynamic-perfusion-stability':T('Dolaşım/perfüzyon ve vazopresör eğilimi uygun','Circulation/perfusion and vasopressor trend allow advancement'),
    'gastrointestinal-tolerance-and-aspiration':T('Gastrointestinal tolerans ve aspirasyon değerlendirmesi uygun','Gastrointestinal tolerance and aspiration assessment are acceptable'),
    'potassium-phosphate-magnesium':T('Potasyum, fosfor ve magnezyum izlenmiş; artışı engelleyen düşüş yok','Potassium, phosphate and magnesium monitored; no deficit precluding an increase'),
    'all-calorie-and-fluid-sources':T('Tüm kalori ve sıvı kaynakları hesaba katılmış','All calorie and fluid sources included'),
    'illness-phase-and-kidney-status':T('Hastalık evresi ve böbrek durumuna ait sınırlar korunuyor','Illness-phase and renal limits remain respected')
  };
  const checks = (draft.checks ?? []).map(c => `<li>${esc(checkNames[c]??text(c))}</li>`).join('');
  const targetNote=draft.status==='example'?T('Yeni beslenmede bu hızla doğrudan başlanmaz.','A new feed does not begin directly at this rate.'):draft.status==='continue'?T('Tolere edilen mevcut beslenme yalnız hesap nedeniyle yeniden başlatılmaz.','Do not restart a tolerated existing feed solely because of a calculation.'):T('Bu risk-uyarlanmış günlük sınırdır; olağan 12 saatlik artış şeması uygulanmaz.','This is the risk-adjusted daily limit; the routine 12-hour increase schedule does not apply.');
  return `<section class="card feeding-initiation" id="feeding-initiation"><h2>${esc(title)}</h2>${lead}<p>${esc(text(draft.guidance))}</p>${draft.targetRate != null ? `<p><strong>${T('Evre hedefi', 'Phase target')}:</strong> ${N(draft.targetRate)} mL/${T('saat', 'h')} · ${N(draft.targetVolumePerDay)} mL/${T('gün', 'day')}. ${targetNote}</p>` : ''}${table}${actual}${checks ? `<h3>${T('Her artış öncesi izlenecek kriterler', 'Criteria before each increase')}</h3><ul>${checks}</ul>` : ''}<p class="muted">${esc(T('Tablo mevcut girdilerden üretilen öneridir; sonraki basamak, önceki basamak tolere edilmiş ve klinik/metabolik durum uygun ise uygulanır. İlk gün gerçek verilen miktarı izlem alanına kaydedin.', 'The table is a proposal calculated from the current inputs. Advance only when the preceding stage is tolerated and the clinical/metabolic state allows it. Record actual first-day delivery in follow-up.'))}</p></section>`;
}
