import {getLocale} from './i18n.mjs';

// Interface guidance only: no patient inputs, clinical rules or saved settings.
export const navigationHelp = {
 assessment:{en:{title:'Patient assessment',purpose:'Brings the patient context, body measurements and intake history together.',action:'Start here. Enter a study code, assessment date, age, height, weight, care setting and intake history.'},tr:{title:'Hasta değerlendirmesi',purpose:'Hasta bağlamını, vücut ölçümlerini ve alım öyküsünü bir araya getirir.',action:'Buradan başlayın. Çalışma kodu, değerlendirme tarihi, yaş, boy, ağırlık, bakım ortamı ve alım öyküsünü girin.'}},
 labs:{en:{title:'Laboratory results',purpose:'Reviews measurements, units, specimen dates and the institution’s laboratory reference intervals.',action:'Upload a PDF, CSV or JSON file, or enter values. Compare entries with the source document, check units and dates, then confirm the reviewed results.'},tr:{title:'Laboratuvar sonuçları',purpose:'Ölçümleri, birimleri, örnek tarihlerini ve kurumun laboratuvar referans aralıklarını değerlendirir.',action:'PDF, CSV veya JSON yükleyin ya da değerleri girin. Kaynak belgeyle karşılaştırın, birim ve tarihleri kontrol edin, ardından incelediğiniz sonuçları onaylayın.'}},
 plan:{en:{title:'Nutrition plan',purpose:'Shows calculation steps, safety checks, physician-entered targets and the draft feeding program.',action:'Review missing or conflicting inputs, enter the targets you assessed for this patient and verify the formula label before reviewing the draft.'},tr:{title:'Beslenme planı',purpose:'Hesaplama adımlarını, güvenlik kontrollerini, hekimin girdiği hedefleri ve beslenme programı taslağını gösterir.',action:'Eksik veya çelişen girdileri inceleyin. Bu hasta için değerlendirdiğiniz hedefleri girin ve taslağı değerlendirirken ürün etiketini doğrulayın.'}},
 research:{en:{title:'Follow-up & records',purpose:'Brings actual-intake follow-up, saved assessments and report exports together.',action:'Record actual intake for each observation window. Check the dates and matching targets; use saved patients and backups to reopen earlier cases.'},tr:{title:'İzlem ve kayıtlar',purpose:'Gerçek alım izlemini, kaydedilmiş değerlendirmeleri ve rapor dışa aktarımlarını bir araya getirir.',action:'Her gözlem dönemi için gerçek alımı kaydedin. Tarihleri ve eşleşen hedefleri kontrol edin; önceki olguları kayıtlı hastalar ve yedeklerden açın.'}},
 criteria:{en:{title:'Nutrition criteria',purpose:'Organizes nutrition risk, malnutrition and muscle or functional assessment findings.',action:'Enter the available screening findings and measurements, record their source and date, and review the candidate findings clinically.'},tr:{title:'Beslenme kriterleri',purpose:'Beslenme riski, malnütrisyon ve kas veya işlev değerlendirmesi bulgularını düzenler.',action:'Mevcut tarama bulgularını ve ölçümleri girin, kaynak ve tarihlerini kaydedin, aday bulguları klinik olarak değerlendirin.'}},
 dysphagia:{en:{title:'Swallowing assessment',purpose:'Documents the clinician’s swallowing assessment and recorded oral-intake safety information.',action:'Enter the assessment or screening result, its source and date, and any recorded food or fluid level. Review unanswered or unconfirmed items.'},tr:{title:'Disfaji değerlendirmesi',purpose:'Hekimin yutma değerlendirmesini ve kaydedilen oral alım güvenliği bilgisini belgeler.',action:'Değerlendirme veya tarama sonucunu, kaynak ve tarihini, varsa kaydedilmiş gıda veya sıvı düzeyini girin. Yanıtsız veya onaylanmamış alanları inceleyin.'}},
 context:{en:{title:'Disease & metabolism',purpose:'Documents chronic diseases, inflammation and organ or metabolic observations relevant to the assessment.',action:'Select the relevant conditions, add available measurements and review the contextual cautions when assessing the nutrition plan.'},tr:{title:'Hastalık ve metabolizma',purpose:'Değerlendirmeyle ilişkili kronik hastalıkları, inflamasyonu ve organ veya metabolik gözlemleri belgeler.',action:'İlgili hastalıkları seçin, mevcut ölçümleri ekleyin ve beslenme planını değerlendirirken bağlama ilişkin uyarıları inceleyin.'}},
 decisions:{en:{title:'Clinical choices',purpose:'Compares conflicting evidence and records the clinician’s interpretation.',action:'Choose the relevant question, read the patient populations and limitations, and optionally document your institution-approved approach and reasoning.'},tr:{title:'Klinik tercihler',purpose:'Çelişen kanıtları karşılaştırır ve hekimin yorumunu kaydeder.',action:'İlgili soruyu seçin, hasta gruplarını ve sınırlılıkları okuyun; isterseniz kurumunuzun onayladığı yaklaşımı ve gerekçenizi belgeleyin.'}},
 evidence:{en:{title:'Evidence library',purpose:'Lists sources with study design, access level and limitations.',action:'Search or filter your clinical question, open the original source and check the patient population, intervention and applicability.'},tr:{title:'Kanıt kitaplığı',purpose:'Kaynakları çalışma tasarımı, erişim düzeyi ve sınırlılıklarıyla listeler.',action:'Klinik sorunuzu arayın veya filtreleyin. Özgün kaynağı açıp hasta grubunu, müdahaleyi ve uygulanabilirliğini kontrol edin.'}},
 components:{en:{title:'Amino acid & component evidence',purpose:'Separates the evidence for glutamine, leucine, BCAA, HMB and other nutritional components.',action:'Review each component’s patient population, reported benefits or harms and source-access limits before making your own clinical assessment.'},tr:{title:'Aminoasit ve bileşen kanıtı',purpose:'Glutamin, lösin, BCAA, HMB ve diğer beslenme bileşenlerinin kanıtlarını ayrı gösterir.',action:'Kendi klinik değerlendirmeniz için her bileşenin hasta grubunu, bildirilen yarar veya zararlarını ve kaynak erişim sınırlarını inceleyin.'}},
};

export function initNavigationHelp({getLanguage=getLocale}={}) {
 const nav=document.getElementById('mainNavigation');
 if(!nav)return {refresh(){},hide(){},destroy(){}};
 let active=null,showTimer=null,hideTimer=null,destroyed=false;
 const entries=[],cleanups=[];
 const language=()=>getLanguage()==='tr'?'tr':'en';
 const listen=(node,type,fn,options)=>{node.addEventListener(type,fn,options);cleanups.push(()=>node.removeEventListener(type,fn,options));};
 const clearShow=()=>{if(showTimer!==null)clearTimeout(showTimer);showTimer=null;};
 const clearHide=()=>{if(hideTimer!==null)clearTimeout(hideTimer);hideTimer=null;};
 const release=entry=>{if(!entry.hover&&!entry.focus&&!entry.tooltipHover)entry.dismissed=false;};
 function hide({suppress=false}={}){
  clearShow();clearHide();if(!active)return;
  const entry=active;entry.dismissed=suppress;entry.tooltip.hidden=true;entry.help.setAttribute('aria-expanded','false');entry.tooltipHover=false;entry.pinned=false;active=null;release(entry);
 }
 function position(entry){
  if(entry!==active||entry.tooltip.hidden)return;
  const rect=entry.row.getBoundingClientRect(),tip=entry.tooltip.getBoundingClientRect();
  const width=window.innerWidth||document.documentElement.clientWidth||390,height=window.innerHeight||document.documentElement.clientHeight||844;
  const gap=10,edge=10;
  let left=rect.right+gap;
  if(left+tip.width>width-edge)left=Math.max(edge,rect.left-tip.width-gap);
  // On a narrow screen the full-width panel sits below its menu row, or above
  // it when that is the only remaining space. No ancestor overflow clips it.
  if(width<650)left=edge;
  let top=rect.top;
  if(width<650)top=rect.bottom+gap;
  if(top+tip.height>height-edge)top=Math.max(edge,Math.min(rect.top-tip.height-gap,height-tip.height-edge));
  left=Math.max(edge,Math.min(left,width-tip.width-edge));
  top=Math.max(edge,Math.min(top,height-tip.height-edge));
  entry.tooltip.style.left=`${left}px`;entry.tooltip.style.top=`${top}px`;
 }
 function show(entry,pinned=false){
  clearShow();clearHide();if(destroyed||entry.dismissed&&!pinned)return;
  if(active&&active!==entry)hide();
  entry.dismissed=false;entry.pinned=pinned;active=entry;entry.tooltip.hidden=false;entry.help.setAttribute('aria-expanded','true');position(entry);
 }
 function scheduleShow(entry){
  clearHide();if(entry.dismissed||active===entry)return;clearShow();
  showTimer=setTimeout(()=>{showTimer=null;if(entry.hover||entry.focus)show(entry);},650);
 }
 function scheduleHide(entry){
  if(entry!==active){if(!entry.hover&&!entry.focus)clearShow();release(entry);return;}
  if(entry.hover||entry.focus||entry.tooltipHover||entry.pinned)return;
  clearHide();hideTimer=setTimeout(()=>{hideTimer=null;if(active===entry&&!entry.hover&&!entry.focus&&!entry.tooltipHover&&!entry.pinned)hide();release(entry);},200);
 }
 for(const button of nav.querySelectorAll('button[data-view]')){
  const id=button.dataset.view;if(!navigationHelp[id])continue;
  const row=document.createElement('div');row.className='navigation-help-row';
  button.before(row);row.append(button);
  const help=document.createElement('button');help.type='button';help.className='navigation-help-toggle';help.textContent='?';help.setAttribute('data-no-i18n','');
  const tooltip=document.createElement('div');tooltip.id=`navigation-help-${id}`;tooltip.className='navigation-help-tooltip';tooltip.hidden=true;tooltip.setAttribute('role','tooltip');tooltip.setAttribute('data-no-i18n','');
  const heading=document.createElement('strong'),purpose=document.createElement('p'),action=document.createElement('p');tooltip.append(heading,purpose,action);document.body.append(tooltip);row.append(help);
  const originalDescription=button.getAttribute('aria-describedby');button.setAttribute('aria-describedby',[originalDescription,tooltip.id].filter(Boolean).join(' '));
  help.setAttribute('aria-describedby',tooltip.id);help.setAttribute('aria-controls',tooltip.id);help.setAttribute('aria-expanded','false');
  const entry={id,row,button,help,tooltip,heading,purpose,action,originalDescription,hover:false,focus:false,tooltipHover:false,pinned:false,dismissed:false};entries.push(entry);
  listen(row,'pointerenter',event=>{if(event.pointerType==='touch')return;entry.hover=true;scheduleShow(entry);});
  listen(row,'pointerleave',()=>{entry.hover=false;scheduleHide(entry);release(entry);});
  listen(row,'focusin',()=>{entry.focus=true;scheduleShow(entry);});
  listen(row,'focusout',event=>{if(row.contains(event.relatedTarget))return;entry.focus=false;scheduleHide(entry);release(entry);});
  listen(tooltip,'pointerenter',()=>{entry.tooltipHover=true;clearHide();});
  listen(tooltip,'pointerleave',()=>{entry.tooltipHover=false;scheduleHide(entry);release(entry);});
  listen(help,'click',event=>{event.preventDefault();event.stopPropagation();if(active===entry&&!tooltip.hidden)hide({suppress:true});else show(entry,true);});
  listen(button,'click',()=>hide({suppress:true}));
 }
 listen(document,'keydown',event=>{if(event.key==='Escape'){if(active)hide({suppress:true});else{clearShow();for(const entry of entries)if(entry.hover||entry.focus)entry.dismissed=true;}}});
 listen(document,'pointerdown',event=>{if(active&&!active.row.contains(event.target)&&!active.tooltip.contains(event.target))hide({suppress:true});});
 listen(window,'resize',()=>{if(active)position(active);});
 listen(document,'scroll',()=>{if(active)position(active);},true);
 listen(window,'beforeprint',()=>hide());
 function refresh(){
  const lang=language();
  for(const entry of entries){const value=navigationHelp[entry.id][lang];entry.heading.textContent=value.title;entry.purpose.textContent=(lang==='tr'?'Ne işe yarar: ':'Purpose: ')+value.purpose;entry.action.textContent=(lang==='tr'?'Ne yapmalısınız: ':'Your next step: ')+value.action;entry.help.setAttribute('aria-label',(lang==='tr'?'Menü yardımı: ':'Menu help: ')+value.title);}
  if(active)position(active);
 }
 refresh();
 return {refresh,hide,destroy(){if(destroyed)return;hide();destroyed=true;for(const cleanup of cleanups)cleanup();for(const entry of entries){if(entry.originalDescription===null)entry.button.removeAttribute('aria-describedby');else entry.button.setAttribute('aria-describedby',entry.originalDescription);entry.row.before(entry.button);entry.row.remove();entry.tooltip.remove();}}};
}
