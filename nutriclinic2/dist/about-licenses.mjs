import {getLocale} from './i18n.mjs';
import {UI_VERSION} from './config.mjs';

// Product/legal information only. No patient inputs, storage access or requests.
const escape = value => String(value ?? '').replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[character]);
const text = value => typeof value === 'string' ? value.trim() : '';
const authorNames = authors => Array.isArray(authors) ? authors.map(author => typeof author === 'string' ? text(author) : author && typeof author === 'object' ? text(author.name) || [text(author.given),text(author.family)].filter(Boolean).join(' ') : '').filter(Boolean) : [];

const copy = {
 en:{
  title:'About & licenses', close:'Close', help:'Read about NutriClinic, reuse conditions, authorship, source code and academic citation.',
  subtitle:'Clinical nutrition workspace for adult ICU and ward assessments.', version:'Version', license:'Software license',
  owner:'Copyright holder', authors:'Author', pending:'Attribution details pending',
  scope:'What this license covers', scopeText:'AGPLv3 covers the original NutriClinic software identified in the license notice. Third-party components, publications and other external materials retain their own licenses and permissions.',
  freedoms:'Reuse and source code', freedomsText:'You may use, copy, modify and commercially redistribute the covered software under AGPLv3. Keep the required copyright and license notices, and provide corresponding source when required. Modified versions offered over a network must offer their corresponding source to interacting users.',
  source:'Download corresponding source', sourceNote:'Source means the software code. It does not require publishing patient records, credentials or private clinical data.',
  credit:'Authorship and citation', creditText:'Please retain the applicable authorship and legal notices. Academic citation is requested, not an additional mandatory condition of AGPLv3.', citationPending:'The academic citation will be completed when the author details are confirmed.', citation:'Academic citation file',
  third:'Third-party software', thirdText:'Mozilla PDF.js (Apache-2.0) reads laboratory PDFs in the browser; the desktop package also bundles the Node.js runtime. These components keep their own copyright, license and attribution terms.',
  licenseFile:'Read AGPLv3', noticeFile:'Copyright and attribution notice', thirdFile:'Third-party notices',
  warranty:'Intended use and limits', warrantyText:'The software is provided without warranty under the license. It supports clinical decisions and does not replace them; the clinical team reviews every result, with its inputs and sources, before use. It does not establish a definitive anabolic or catabolic diagnosis or an automatic optimal amino-acid dose.',
 },
 tr:{
  title:'Hakkında ve Lisanslar', close:'Kapat', help:'NutriClinic, yeniden kullanım koşulları, yazar bilgileri, kaynak kodu ve akademik atıf hakkında bilgi alın.',
  subtitle:'Yetişkin yoğun bakım ve servis değerlendirmeleri için klinik beslenme çalışma alanı.', version:'Sürüm', license:'Yazılım lisansı',
  owner:'Telif hakkı sahibi', authors:'Yazar', pending:'Atıf bilgileri tamamlanmayı bekliyor',
  scope:'Bu lisansın kapsamı', scopeText:'AGPLv3, lisans bildiriminde belirtilen özgün NutriClinic yazılımını kapsar. Üçüncü taraf bileşenler, yayınlar ve diğer dış materyaller kendi lisans ve izin koşullarını korur.',
  freedoms:'Yeniden kullanım ve kaynak kodu', freedomsText:'Kapsamdaki yazılımı AGPLv3 koşullarıyla kullanabilir, kopyalayabilir, değiştirebilir ve ticari olarak yeniden dağıtabilirsiniz. Gerekli telif ve lisans bildirimlerini koruyun; lisansın gerektirdiği durumlarda karşılık gelen kaynak kodunu sunun. Ağ üzerinden kullandırılan değiştirilmiş sürümler, kendileriyle etkileşen kullanıcılara karşılık gelen kaynak kodunu sunmalıdır.',
  source:'Karşılık gelen kaynak kodunu indir', sourceNote:'Kaynak kodu yazılımın kodudur. Hasta kayıtlarını, kimlik bilgilerini veya özel klinik verileri yayımlamayı gerektirmez.',
  credit:'Yazar bilgileri ve atıf', creditText:'İlgili yazar ve yasal bildirimleri koruyun. Akademik atıf rica edilir; AGPLv3 koşullarına ek bir zorunluluk değildir.', citationPending:'Akademik atıf, yazar bilgileri doğrulandığında tamamlanacaktır.', citation:'Akademik atıf dosyası',
  third:'Üçüncü taraf yazılımlar', thirdText:'Laboratuvar PDF dosyaları tarayıcıda Mozilla PDF.js (Apache-2.0) ile okunur; masaüstü paketinde ayrıca Node.js çalışma ortamı bulunur. Bu bileşenler kendi telif, lisans ve atıf koşullarını korur.',
  licenseFile:'AGPLv3 metnini oku', noticeFile:'Telif ve atıf bildirimi', thirdFile:'Üçüncü taraf bildirimleri',
  warranty:'Kullanım amacı ve sınırlar', warrantyText:'Yazılım, lisans koşulları kapsamında garanti verilmeden sunulur. Klinik kararı destekler, yerine geçmez; klinik ekip her sonucu girdileri ve kaynaklarıyla birlikte kullanmadan önce kontrol eder. Kesin anabolik veya katabolik tanı ya da otomatik optimum aminoasit dozu belirlemez.',
 },
};

export function aboutLicensesMarkup(metadata={}, locale='en') {
 const words=copy[locale==='tr'?'tr':'en'];
 const holder=text(metadata?.copyrightHolder), authors=authorNames(metadata?.authors);
 const year=Number.isInteger(metadata?.year)&&metadata.year>=1900&&metadata.year<=9999?metadata.year:2026;
 const citation=text(metadata?.citation) || (authors.length ? `${authors.join('; ')} (${year}). NutriClinic (${UI_VERSION}).` : '');
 return `<div class="about-licenses-header"><div><span class="about-licenses-kicker">NutriClinic · ${escape(words.version)} ${escape(UI_VERSION)}</span><h2 id="aboutLicensesTitle">${escape(words.title)}</h2><p>${escape(words.subtitle)}</p></div><button id="aboutLicensesClose" class="button secondary" type="button" autofocus>${escape(words.close)}</button></div>
 <div class="about-licenses-content">
  <section class="about-licenses-summary"><span class="about-licenses-badge">AGPL-3.0-only</span><dl><div><dt>${escape(words.license)}</dt><dd>GNU Affero General Public License v3.0</dd></div><div><dt>${escape(words.owner)}</dt><dd>${holder?`© ${year} ${escape(holder)}`:escape(words.pending)}</dd></div>${authors.length?`<div><dt>${escape(words.authors)}</dt><dd>${escape(authors.join('; '))}</dd></div>`:''}</dl></section>
  <section class="about-licenses-card"><h3>${escape(words.scope)}</h3><p>${escape(words.scopeText)}</p><div class="about-licenses-links"><a href="./legal/LICENSE.txt">${escape(words.licenseFile)}</a><a href="./legal/NOTICE.txt">${escape(words.noticeFile)}</a></div></section>
  <section class="about-licenses-card"><h3>${escape(words.freedoms)}</h3><p>${escape(words.freedomsText)}</p><a class="about-licenses-source" href="./source-code.zip" download="NutriClinic-source-code.zip">↓ ${escape(words.source)}</a><p class="about-licenses-note">${escape(words.sourceNote)}</p></section>
  <section class="about-licenses-card"><h3>${escape(words.credit)}</h3><p>${escape(words.creditText)}</p>${citation?`<blockquote class="about-licenses-citation">${escape(citation)}</blockquote>`:`<p class="about-licenses-note">${escape(words.citationPending)}</p>`}<a href="./CITATION.cff" download="CITATION.cff">${escape(words.citation)}</a></section>
  <section class="about-licenses-card"><h3>${escape(words.third)}</h3><p>${escape(words.thirdText)}</p><a href="./legal/THIRD-PARTY-NOTICES.txt">${escape(words.thirdFile)}</a></section>
  <section class="about-licenses-card about-licenses-limits"><h3>${escape(words.warranty)}</h3><p>${escape(words.warrantyText)}</p></section>
 </div>`;
}

export function initAboutLicenses({button=document.getElementById('aboutLicensesButton'),metadata={},getLanguage=getLocale}={}) {
 if(!button)return {open(){},hide(){},refresh(){},destroy(){}};
 const dialog=document.createElement('dialog');
 dialog.id='aboutLicensesDialog';dialog.className='about-licenses-dialog';
 dialog.setAttribute('data-no-i18n','');dialog.setAttribute('aria-labelledby','aboutLicensesTitle');
 dialog.setAttribute('aria-modal','true');document.body.append(dialog);
 const previousAttributes=new Map(['title','aria-label','aria-haspopup','aria-controls','data-no-i18n'].map(name=>[name,button.getAttribute(name)]));
 const previousText=button.textContent;
 button.setAttribute('data-no-i18n','');button.setAttribute('aria-haspopup','dialog');button.setAttribute('aria-controls',dialog.id);
 let previousFocus=null,destroyed=false;
 const language=()=>getLanguage()==='tr'?'tr':'en';
 const isOpen=()=>dialog.open||dialog.hasAttribute('open');
 function restoreFocus(){if(!previousFocus)return;const target=previousFocus.isConnected===false?button:previousFocus;previousFocus=null;target?.focus?.({preventScroll:true});}
 function hide(){
  if(!isOpen())return;
  if(typeof dialog.close==='function')dialog.close();else dialog.removeAttribute('open');
  restoreFocus();
 }
 function refresh(){
  if(destroyed)return;
  const words=copy[language()],focusWasInside=dialog.contains(document.activeElement),scrollTop=dialog.scrollTop;
  button.textContent=words.title;button.setAttribute('aria-label',words.title);button.setAttribute('title',words.help);
  dialog.setAttribute('lang',language());dialog.innerHTML=aboutLicensesMarkup(metadata,language());dialog.scrollTop=scrollTop;
  dialog.querySelector('#aboutLicensesClose').addEventListener('click',hide);
  if(isOpen()&&focusWasInside)dialog.querySelector('#aboutLicensesClose').focus({preventScroll:true});
 }
 function open(){
  if(destroyed||isOpen())return;
  previousFocus=document.activeElement||button;refresh();
  if(typeof dialog.showModal==='function')dialog.showModal();else dialog.setAttribute('open','');
  dialog.querySelector('#aboutLicensesClose').focus({preventScroll:true});
 }
 function cancel(event){event.preventDefault();hide();}
 function closed(){restoreFocus();}
 function keyboard(event){
  if(event.key==='Escape'){event.preventDefault();hide();return;}
  if(event.key!=='Tab'||!isOpen())return;
  const focusable=[...dialog.querySelectorAll('button:not([disabled]),a[href]')];
  const first=focusable[0],last=focusable.at(-1),active=document.activeElement;
  if(event.shiftKey&&(active===first||!dialog.contains(active))){event.preventDefault();last?.focus();}
  else if(!event.shiftKey&&(active===last||!dialog.contains(active))){event.preventDefault();first?.focus();}
 }
 const openClick=()=>open();
 button.addEventListener('click',openClick);dialog.addEventListener('cancel',cancel);dialog.addEventListener('close',closed);dialog.addEventListener('keydown',keyboard);
 refresh();
 return {open,hide,refresh,destroy(){
  if(destroyed)return;hide();destroyed=true;
  button.removeEventListener('click',openClick);dialog.removeEventListener('cancel',cancel);dialog.removeEventListener('close',closed);dialog.removeEventListener('keydown',keyboard);dialog.remove();
  button.textContent=previousText;for(const [name,value] of previousAttributes){if(value===null)button.removeAttribute(name);else button.setAttribute(name,value);}
 }};
}
