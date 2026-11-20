// Exact-market product selection and daily recipe presentation; no independent clinical targets.
// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Gökay Duman
import { FORMULAS, CATALOG_DATE, COVERAGE, productById } from './formula-catalog.mjs';
import { evaluateFormulaRecipe, suggestFormulaPlans } from './formula-planning.mjs';
const esc = x => String(x ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num = x => x === '' || x == null ? null : Number(String(x).replace(',','.'));
export const CATALOG_FIELDS = ['firstId','secondId','firstMl','secondMl','mode','market','limitMl'];
export function cleanCatalogConfig(raw) {
  const out = {};
  for (const key of CATALOG_FIELDS) {
    const x = num(raw?.[key]);
    if (Number.isFinite(x) && x >= 0 && x <= (key.includes('Id') ? 99999 : 10000)) out[key] = x;
  }
  return out;
}
const adapt = p => ({...p,route:p.route === 'tube' ? 'enteral' : p.route});
const specialty = p => /nepro|renal|novasource-renal/.test(p.id) ? 'renal' : /diabet|glucerna/.test(p.id) ? 'diabetes' : /peptide|peptamen|survimed/.test(p.id) ? 'peptide' : 'general';
export function resolveFormulaWorkspace(result, config = {}) {
  const route = result.route?.kind;
  if (!result.plan || result.blocked || !['en','oral'].includes(route)) return null;
  const p = result.input, row = route === 'en' ? result.plan.today : result.plan.oral;
  if (!row) return null;
  const cfg = cleanCatalogConfig(config);
  const invalidConfig=Object.entries(config??{}).some(([key,value])=>CATALOG_FIELDS.includes(key) && value!=='' && value!=null && (!Number.isFinite(num(value)) || num(value)<0 || num(value)>(key.includes('Id')?99999:10000)))
    || cfg.mode!=null && ![0,1,2].includes(cfg.mode) || cfg.market!=null && ![0,1].includes(cfg.market);
  const otherEnergyKcal = route === 'oral' ? row.intakeKcal : result.route.supplementalToOral ? Math.min(row.kcalTarget,result.fullEnergy.kcal*(p.oralIntakePct ?? 0)/100) : 0;
  const otherProteinG = route === 'oral' ? row.intakeProtein : result.route.supplementalToOral ? Math.min(row.proteinTarget,row.proteinPerKgFull*result.metrics.proteinWeight*(p.oralIntakePct ?? 0)/100) : 0;
  const catalog = FORMULAS.filter(product => product.complete && (route === 'en' ? product.tube : product.oral));
  const market = cfg.market === 1 ? 'all' : 'TR';
  const inMarket = catalog.filter(product => market === 'all' || product.market === 'TR');
  const automaticProducts = inMarket.filter(product => {
    const tag = specialty(product);
    return tag === 'general' || tag === 'diabetes' && p.diabetes === true || tag === 'renal' && p.kidney !== null && p.kidney !== 'normal';
  });
  const limits=[cfg.limitMl,p.formulaVolumeLimitMlDay,
    p.fluidLimitMlDay===null?null:Math.max(0,p.fluidLimitMlDay-(p.otherFluidsMlDay??0))].filter(v=>v!=null);
  const targets = {energyKcal:row.kcalTarget, proteinG:row.proteinTarget,
    otherEnergyKcal:(otherEnergyKcal ?? 0)+(result.nonNutritional?.total ?? 0),otherProteinG:otherProteinG ?? 0,
    maxProteinG:row.proteinTarget,maxFormulaMl:limits.length?Math.min(...limits):null};
  const safety = {route:route === 'en' ? 'tube' : 'oral',clinicianEligibilityConfirmed:true,
    refeedingRisk:result.refeeding.level === 'low' ? false : result.refeeding.level === 'unknown' ? null : true,
    allowManagedRefeeding:true,shock:p.shock === 'uncontrolled',intolerance:p.highGrv === true,
    contraindication:p.gi === 'contraindicated' || p.ischemia === true || p.acs === true || p.fistula === true,
    assumptions:[...(p.shock === null ? ['shock-unknown-phase-cap-retained'] : []),...(p.gi === null ? ['gut-assumed-usable'] : []),
      ...(p.fluidRestriction === true && targets.maxFormulaMl === null ? ['fluid-restriction-without-volume-budget'] : []),
      ...(p.fluidLimitMlDay!==null && p.otherFluidsMlDay===null ? ['restricted-fluid-budget-assumes-zero-other-sources'] : []),
      ...(route === 'oral' && otherEnergyKcal === null ? ['oral-intake-not-quantified'] : [])]};
  const textureRestricted=route==='oral' && p.swallow==='modified' && p.iddsiFluid!==0;
  const suggestions = route === 'oral' && (otherEnergyKcal === null || row.servings === 0 || textureRestricted) ? null
    : suggestFormulaPlans({products:automaticProducts.map(adapt),targets,safety,maxResults:5});
  let recipe = suggestions?.selectedDefault ?? null;
  const first = productById(cfg.firstId), second = productById(cfg.secondId);
  let selectedOverride = false;
  if (cfg.mode === 1 && first) {
    recipe = suggestFormulaPlans({products:[first,...(second && second.id !== first.id ? [second] : [])].map(adapt),targets,safety,maxResults:5}).selectedDefault;
    selectedOverride = true;
  } else if (cfg.mode === 2 && first) {
    recipe = evaluateFormulaRecipe({rows:[{product:adapt(first),volumeMl:cfg.firstMl ?? 0},...(second ? [{product:adapt(second),volumeMl:cfg.secondMl ?? 0}] : [])],targets,safety});
    selectedOverride = true;
  }
  if (recipe?.rows?.length && recipe.automationAllowed && route === 'en') {
    // Align whole-hour pump setting and daily product amounts. Never round above a target.
    const total = recipe.totals.formulaVolumeMl;
    const pumpVolume = Math.floor(total/24)*24;
    let used = 0;
    const amounts = recipe.rows.map((r,i) => {
      const volumeMl = i === recipe.rows.length-1 ? Math.max(0,pumpVolume-used) : Math.floor(r.volumeMl/total*pumpVolume*10)/10;
      used += volumeMl; return {product:r.product,volumeMl};
    });
    recipe = pumpVolume > 0 ? evaluateFormulaRecipe({rows:amounts,targets,safety}) : null;
  }
  let composition = null;
  if (invalidConfig) recipe={automationAllowed:false,rows:[],totals:null,errors:[{code:'invalid-catalog-input'}]};
  if (route === 'en' && recipe?.automationAllowed && recipe.totals?.formulaVolumeMl > 0) {
    const t = recipe.totals,v=t.formulaVolumeMl;
    composition = {kcalPerMl:t.formulaEnergyKcal/v,proteinPer100:t.formulaProteinG/v*100,
      ...(t.formulaWaterMl === null ? {waterUnknown:1} : {waterPer100:t.formulaWaterMl/v*100}),dailyVolumeLimit:v};
  }
  if (textureRestricted) recipe=null; // catalog liquids do not establish the prescribed IDDSI texture
  const chosen = recipe?.rows?.map(r=>r.product) ?? (first ? [first] : []);
  return {config:cfg,invalidConfig,route,market,catalog,inMarket,automaticProducts,suggestions,recipe,composition,
    selectedOverride,chosen,targets,safety,textureRestricted,needsOralIntake:route === 'oral' && otherEnergyKcal === null,
    scope:'formula-composition-within-current-phase-targets'};
}

const ISSUE = {
  'energy-ceiling-exceeded':['Enerji hedefi aşılıyor','Energy target exceeded'],
  'protein-ceiling-exceeded':['Protein hedefi aşılıyor','Protein target exceeded'],
  'formula-volume-ceiling-exceeded':['Mama hacim sınırı aşılıyor','Formula volume limit exceeded'],
  'product-not-suitable-for-tube':['Ürün tüple kullanım için uygun değil','Product is not for tube use'],
  'product-not-suitable-for-oral':['Ürün oral kullanım için uygun değil','Product is not for oral use'],
  'invalid-volume':['Hacim geçersiz','Invalid volume'], 'duplicate-product':['Aynı ürün iki kez seçilmiş','The same product was selected twice'],
  'eligibility-not-established':['Beslenme uygunluğu sağlanmadı','Feeding suitability is not established'],
  'formula-water-unknown':['Serbest su bilgisi yok; tahmin edilmedi','Free water is unknown; no value was assumed'],
  'invalid-product-protein':['Protein etiketi geçersiz','Invalid protein label'],
  'invalid-product-energy':['Enerji etiketi geçersiz','Invalid energy label'],
};
export function formulaWorkspaceHtml(model,language='en') {
  if (!model) return '';
  const tr=language==='tr',T=(a,b)=>tr?a:b,N=(x,d=1)=>Number(x).toLocaleString(tr?'tr-TR':'en-GB',{maximumFractionDigits:d});
  const cfg=model.config, r=model.recipe, auto=model.suggestions?.selectedDefault;
  const option=(p,id)=>`<option value="${p.catalogId}"${Number(id)===p.catalogId?' selected':''}>${esc(p.name)} · ${p.market}</option>`;
  const choose=(key,id,none)=>`<select id="formula-${key}" data-formula="${key}"><option value="0">${none}</option>${model.catalog.map(p=>option(p,id)).join('')}</select>`;
  const selected=(id)=>model.catalog.find(p=>p.catalogId===id);
  const recipeText=recipe=>recipe.rows.map(row=>`${N(row.volumeMl)} mL ${row.product.name}`).join(' + ');
  const volumeInputs = cfg.mode === 2 ? `<div class="label-edit">${[['firstMl',T('Birinci ürün / gün','First product / day')],['secondMl',T('İkinci ürün / gün','Second product / day')]].map(([key,label])=>`<div class="field"><label for="formula-${key}">${label}</label><input id="formula-${key}" data-formula="${key}" inputmode="decimal" value="${esc(cfg[key]??'')}" placeholder="mL/${T('gün','day')}"></div>`).join('')}</div>` : '';
  let body='';
  if (r?.totals) {
    const totals=r.totals;
    body=`<p class="big">${esc(recipeText(r))}</p><p>${T('Toplam mama','Formula total')}: <strong>${N(totals.formulaVolumeMl)} mL · ${N(totals.formulaEnergyKcal)} kcal · ${N(totals.formulaProteinG)} g ${T('protein','protein')}</strong>. ${T('Serbest su','Free water')}: ${totals.formulaWaterMl===null?T('bilinmiyor','unknown'):N(totals.formulaWaterMl)+' mL'}.</p>`;
    if (r.gaps) body+=`<p>${T('Diğer kaynaklarla toplam','Total including other sources')}: ${N(totals.energyKcal)} kcal · ${N(totals.proteinG)} g. ${T('Kalan açık','Remaining gap')}: ${N(r.gaps.energyKcal)} kcal · ${N(r.gaps.proteinG)} g.</p>`;
    if (!r.automationAllowed) body+=`<p class="note warning">${T('Bu miktarlar öneri olarak kullanılmaz:','These amounts are not an automatic recommendation:')} ${(r.errors??[]).map(e=>esc((ISSUE[e.code]??[e.code,e.code])[tr?0:1])).join('; ')}. ${T('Girdiğiniz alternatif görünür kalır; güvenli varsayılanın yerine geçmedi.','Your alternative remains visible; it has not replaced the safe default.')}</p>`;
  } else body=`<p>${model.invalidConfig?T('Ürün/miktar seçiminde geçersiz değer var; bu alternatif uygulanmadı.','Invalid product/amount selection; this alternative was not applied.'):model.textureRestricted?T('Kıvamlı ONS önerisi korunuyor. Bu sıvı katalog ürünleri girilen IDDSI kıvamını doğrulamaz; ince sıvı gibi otomatik kullanılmaz.','The texture-modified ONS recommendation is retained. These liquid catalog entries do not establish the prescribed IDDSI texture and are not automatically used as thin drinks.'):T('Mevcut evre hedefiyle uygun bir ürün kombinasyonu hesaplanamadı; enerji/protein hedeflerini, beslenme yolunu ve hacim sınırını aşağıda kontrol edin.','No eligible product combination could be calculated for the current phase; review the goals, route and volume limit below.')}</p>`;
  const refs=(model.chosen.length?model.chosen:[selected(cfg.firstId)]).filter(Boolean).map(p=>`<details><summary>${esc(p.name)} · ${p.market} · ${N(p.kcalPerMl,3)} kcal/mL · ${N(p.proteinPer100,2)} g/100 mL</summary><p>${T('Ambalaj','Package')}: ${esc(p.sku)}; ${T('Kaynak kontrolü','Source checked')}: ${p.checkedAt}. <a href="${esc(p.sourceUrl)}" target="_blank" rel="noopener noreferrer">${T('Üreticinin etiketi','Manufacturer label')}</a></p><ul>${(tr?p.warningsTr:p.warnings??[]).map(w=>`<li>${esc(w)}</li>`).join('')}</ul></details>`).join('');
  if (model.manualLabelActive) body=`<p class="note">${T('Ana öneri, kendiniz girdiğiniz etiketle hesaplanır. Aşağıdaki katalog miktarları alternatif karşılaştırmadır; ürünü seçerseniz ana plana uygulanır.','The main recommendation uses your entered label. Catalog amounts below are an alternative comparison; select a product to apply it to the main plan.')}</p>`+body;
  const alternatives=(model.suggestions?.candidates??[]).slice(1).map(c=>`<li>${esc(recipeText(c))} (${N(c.totals.formulaEnergyKcal)} kcal / ${N(c.totals.formulaProteinG)} g) <button type="button" class="btn no-print" data-formula-candidate="${c.rows.map(x=>`${x.product.catalogId}:${x.volumeMl}`).join('|')}">${T('Bu alternatifi hesapla','Calculate this alternative')}</button></li>`).join('');
  return `<section class="card" id="formula-workspace"><h2>${T('Mamayı seç / günlük miktarları hesapla','Choose formulas / calculate daily amounts')}</h2><p>${T('Öneri, markanın üstünlüğüne göre değil mevcut evre hedeflerinin besin bileşimine en yakın karşılığına göre sıralanır.','Recommendations rank nutritional fit to the current phase targets, not brand superiority.')}</p>${body}<p class="muted">${T('Bu miktarlar hedef evre içindir; yeni beslenmede başlangıç/artırma tablosu uygulanır. İki ürünün ayrı günlük miktarlarıdır; aynı torbada fiziksel karışım onayı değildir.','Amounts are for the target phase; use the initiation/advancement table for a new feed. These are daily amounts of separately administered products, not approval to mix them in one bag.')}</p>
  <details class="no-print"${cfg.mode?' open':''}><summary>${T('Ürünleri ve alternatifleri değiştir','Change products and alternatives')}</summary><div class="label-edit"><div class="field"><label for="formula-market">${T('Otomatik önerinin pazarı','Market for automatic suggestions')}</label><select id="formula-market" data-formula="market"><option value="0"${model.market==='TR'?' selected':''}>${T('Türkiye','Turkey')}</option><option value="1"${model.market==='all'?' selected':''}>${T('Tüm doğrulanmış ülkeler','All referenced markets')}</option></select></div><div class="field"><label for="formula-firstId">${T('Birinci ürün','First product')}</label>${choose('firstId',cfg.firstId,T('Sistem seçsin','Automatic'))}</div><div class="field"><label for="formula-secondId">${T('İkinci ürün (isteğe bağlı)','Second product (optional)')}</label>${choose('secondId',cfg.secondId,T('Tek ürün / otomatik','Single / automatic'))}</div><div class="field"><label for="formula-limitMl">${T('Toplam mama hacmi sınırı','Total formula volume limit')} (mL/${T('gün','day')})</label><input id="formula-limitMl" data-formula="limitMl" inputmode="decimal" value="${esc(cfg.limitMl??'')}" placeholder="${T('Varsa girin','If prescribed')}"></div></div>${volumeInputs}<div class="actions"><button class="btn" type="button" data-formula-mode="0">${T('En uygun varsayılanı göster','Show the best fitting default')}</button><button class="btn" type="button" data-formula-mode="2">${T('Miktarları kendim deneyeyim','Try my own amounts')}</button></div>${alternatives?`<h3>${T('Diğer hesaplanan seçenekler','Other calculated options')}</h3><ul>${alternatives}</ul>`:''}</details>
  <p class="note">${T('Seçim yapılmazsa sistem önerisi kullanılır. Ülke, ürün sürümü, alerjenler ve ambalaj etiketini karşılaştırın. Eksik serbest su değeri başka üründen tamamlanmaz.','Without a selection the system default is used. Compare the market, product version, allergens and container label. Missing free water is not filled from another product.')}</p>${model.safety.assumptions.length?`<p class="note warning">${T('Öneri koşulludur: eksik bilgiye ilişkin varsayımlar ve evre sınırları ana uyarılarda gösterilir. Sıvı kısıtlamasında sayısal hacim bütçesi belirtilmemişse hesap bu sınırı doğrulayamaz.','Conditional proposal: missing-data assumptions and phase limits are shown in the main warnings. Without a numeric fluid budget a restriction cannot be checked against the calculated volume.')}</p>`:''}${refs}
  <details class="no-print"><summary>${T('Katalog kapsamı ve kaynakları','Catalog coverage and sources')} (${model.catalog.length}; ${CATALOG_DATE})</summary><p>${esc(COVERAGE.summary[language])}</p>${(COVERAGE.nonCalculable??[]).map(p=>`<p>${esc(p.name)}: ${esc(p.reason[language])}</p>`).join('')}<div class="table-wrap"><table><thead><tr><th>${T('Ürün / ülke','Product / market')}</th><th>kcal/mL</th><th>g/100mL</th><th>${T('Kaynak','Source')}</th></tr></thead><tbody>${model.catalog.map(p=>`<tr><td>${esc(p.name)} · ${p.market}</td><td>${N(p.kcalPerMl,3)}</td><td>${N(p.proteinPer100,2)}</td><td><a href="${esc(p.sourceUrl)}" target="_blank" rel="noopener noreferrer">${esc(p.manufacturer)}</a></td></tr>`).join('')}</tbody></table></div></details></section>`;
}
