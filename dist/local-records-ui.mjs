import {getLocale} from './i18n.mjs';
import {editionText as S,isServerEdition} from './edition.mjs';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const T=(en,tr)=>getLocale()==='tr'?tr:en;
const time=value=>value?new Date(value).toLocaleString(getLocale()==='tr'?'tr-TR':'en-GB',{timeZone:'Europe/Istanbul'}):'—';

export function initLocalRecordsUI({getStore,openPatient,saveBeforeSwitch,downloadRecovery,importRecovery,navigate}){
 const $=id=>document.getElementById(id);
 let status={phase:'loading',loaded:false,dirty:false,saving:false},notice='',patients=[],backups=[],filter='',page=null,busy=false,ready=false;
 // Hosted guest mode (sahnoroloji.org/nutriclinic): guest = open site, own records only; full = signed in at ./tam/.
 let guests=[],guestName=null,guestPatients=[],guestPage=null,guestOpen=false,guestNotice='',guestsLoaded=false;
 const guestLabel=name=>T('Guest','Misafir')+' · '+String(name||'').slice(8,14);
 function saveJson(name,value){const url=URL.createObjectURL(new Blob([JSON.stringify(value,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
 function renderAccess(){
  const bar=$('accessBar');if(!bar)return;
  if(status.access!=='guest'&&status.access!=='full'){bar.hidden=true;bar.innerHTML='';return;}
  bar.hidden=false;bar.dataset.access=status.access;
  bar.innerHTML=status.access==='guest'
   ?`<span class="access-badge">${T('Guest','Misafir')}</span><a class="button secondary access-link" href="./tam/">${T('Full access sign-in','Tam erişim girişi')}</a>`
   :`<span class="access-badge">${T('Full access','Tam erişim')}</span><a class="button subtle access-link" href="../">${T('Guest view','Misafir görünümü')}</a>`;
 }
 function guestNote(){
  if(status.access!=='guest')return '';
  return `<p class="access-note">${T('Guest mode: only you see the records entered in this browser. They are tied to this browser; if you clear browser data or use another device you cannot reach them again, so download a recovery file for important work. Signed-in full-access users can view guest records.','Misafir modu: Bu tarayıcıda girdiğiniz kayıtları yalnız siz görürsünüz. Kayıtlar bu tarayıcıya bağlıdır; tarayıcı verilerini silerseniz ya da başka cihazdan girerseniz onlara yeniden ulaşamazsınız. Önemli çalışmalar için kurtarma dosyası indirin. Tam erişimle giriş yapan kullanıcılar misafir kayıtlarını görebilir.')}</p>`;
 }
 function guestSection(){
  if(status.access!=='full')return '';
  const recordRows=guestPage?guestPage.records.map((r,i)=>`<article><div><strong>${esc(r?.input?.studyId||'—')}</strong><small>${esc(r?.input?.visitDate||'—')} · ${esc(r?.output?.metabolic?.title||'—')} · ${T('saved','kaydedildi')} ${esc(time(r?.savedAt))}</small></div><button class="button subtle" data-guest-record="${i}">${T('Download JSON','JSON indir')}</button></article>`).join(''):'';
  const draft=guestPage?.latestDraft?`<article><div><strong>${T('Unsaved draft','Kaydedilmemiş taslak')}</strong><small>${esc(time(guestPage.latestDraft.updatedAt))}</small></div><button class="button subtle" data-guest-draft>${T('Download JSON','JSON indir')}</button></article>`:'';
  return `<details id="guestRecords" class="local-backup-controls" ${guestOpen?'open':''}><summary>${T('Guest records (read-only)','Misafir kayıtları (salt okunur)')} · ${guests.length}</summary>
  <p>${T('Records that visitors entered without signing in. Each guest space belongs to one browser. Nothing here can be changed; download JSON to keep a copy.','Giriş yapmadan kullanan ziyaretçilerin girdiği kayıtlar. Her misafir alanı tek bir tarayıcıya aittir. Buradan hiçbir şey değiştirilemez; kopya için JSON indirin.')}</p>
  <div class="button-row"><button id="guestRefresh" class="button secondary" ${busy?'disabled':''}>${T('Refresh guest list','Misafir listesini yenile')}</button></div>
  <div class="local-patient-list">${guests.length?guests.map((g,i)=>`<article ${g.guest===guestName?'data-selected="true"':''}><div><strong>${esc(guestLabel(g.guest))}</strong><small>${g.available===false?T('database unavailable','veritabanı açılamadı'):`${Number(g.patientCount)||0} ${T('patient codes','hasta kodu')} · ${Number(g.recordCount)||0} ${T('saved assessments','kayıtlı değerlendirme')} · ${Number(g.draftCount)||0} ${T('drafts','taslak')} · ${esc(time(g.updatedAt))}`}</small></div><button class="button secondary" data-guest="${i}" ${busy||g.available===false?'disabled':''}>${T('Show','Göster')}</button></article>`).join(''):`<p>${T('No guest records yet.','Henüz misafir kaydı yok.')}</p>`}</div>
  ${guestName?`<h3>${esc(guestLabel(guestName))}</h3><div class="local-patient-list">${guestPatients.length?guestPatients.map((p,i)=>`<article ${guestPage&&guestPage.studyId===p.studyId?'data-selected="true"':''}><div><strong>${esc(p.studyId||T('Unassigned draft','Kodu girilmemiş taslak'))}</strong><small>${Number(p.recordCount)||0} ${T('saved assessments','kayıtlı değerlendirme')} · ${Number(p.draftCount)||0} ${T('drafts','taslak')} · ${esc(time(p.updatedAt))}</small></div><button class="button secondary" data-guest-patient="${i}" ${busy?'disabled':''}>${T('Show','Göster')}</button></article>`).join(''):`<p>${T('This guest has no patients.','Bu misafirin hastası yok.')}</p>`}</div>`:''}
  ${guestPage?`<h3>${esc(guestPage.studyId||T('Unassigned draft','Kodu girilmemiş taslak'))} · ${guestPage.total} ${T('saved assessments','kayıtlı değerlendirme')}</h3><div class="local-patient-list">${recordRows}${draft}</div>${guestPage.hasMore?`<p class="footnote">${T('Showing the newest 200 assessments.','En yeni 200 değerlendirme gösteriliyor.')}</p>`:''}<div class="button-row"><button id="guestPatientJson" class="button subtle">${T('Download this patient (JSON)','Bu hastayı indir (JSON)')}</button></div>`:''}
  <p role="status">${esc(guestNotice)}</p></details>`;
 }
 function bindGuestSection(target){
  const details=target.querySelector('#guestRecords');if(!details)return;
  details.addEventListener('toggle',()=>{const was=guestOpen;guestOpen=details.open;if(!was&&guestOpen&&!guestsLoaded)void refreshGuests();});
  $('guestRefresh')?.addEventListener('click',()=>void refreshGuests());
  for(const b of target.querySelectorAll('[data-guest]'))b.addEventListener('click',()=>void openGuest(guests[Number(b.dataset.guest)].guest));
  for(const b of target.querySelectorAll('[data-guest-patient]'))b.addEventListener('click',()=>void openGuestPatient(guestPatients[Number(b.dataset.guestPatient)].studyId));
  for(const b of target.querySelectorAll('[data-guest-record]'))b.addEventListener('click',()=>{const r=guestPage.records[Number(b.dataset.guestRecord)];saveJson(`nutriclinic-${guestName.slice(8,14)}-${String(r?.input?.studyId||'kayit').replace(/[^A-Za-z0-9_-]/g,'_')}-${String(r?.recordId||'').slice(0,8)}.json`,r);});
  target.querySelector('[data-guest-draft]')?.addEventListener('click',()=>saveJson(`nutriclinic-${guestName.slice(8,14)}-taslak.json`,guestPage.latestDraft));
  $('guestPatientJson')?.addEventListener('click',()=>saveJson(`nutriclinic-${guestName.slice(8,14)}-${String(guestPage.studyId||'taslak').replace(/[^A-Za-z0-9_-]/g,'_')}.json`,{guest:guestName,exportedAt:new Date().toISOString(),...guestPage}));
 }
 async function refreshGuests(){
  if(busy)return;busy=true;
  try{const r=await getStore().listGuests();guestsLoaded=true;if(r.ok){guests=r.guests;guestNotice='';if(guestName&&!guests.some(g=>g.guest===guestName)){guestName=null;guestPatients=[];guestPage=null;}}else guestNotice=T('Guest list could not be loaded.','Misafir listesi yüklenemedi.');}
  finally{busy=false;renderArchive();}
 }
 async function openGuest(name){
  if(busy)return;busy=true;
  try{const r=await getStore().listGuestPatients(name);if(r.ok){guestName=name;guestPatients=r.patients;guestPage=null;guestNotice='';}else guestNotice=T('Guest records could not be opened.','Misafir kayıtları açılamadı.');}
  finally{busy=false;renderArchive();}
 }
 async function openGuestPatient(studyId){
  if(busy||!guestName)return;busy=true;
  try{const r=await getStore().loadGuestPatient(guestName,studyId,0,200);if(r.ok){guestPage={...r,studyId};guestNotice='';}else guestNotice=T('Patient could not be opened.','Hasta açılamadı.');}
  finally{busy=false;renderArchive();}
 }
 function statusMessage(){
  if(status.conflict)return S(T('Another tab saved a newer version. Your changes are still here; export recovery before reopening the saved workspace.','Başka sekme daha yeni bir sürüm kaydetti. Değişiklikleriniz burada duruyor; kayıtlı çalışma alanını açmadan önce kurtarma dosyasını indirin.'),T('Another user or tab saved a newer version. Your changes are still here; download a recovery file before reopening the saved workspace.','Başka bir kullanıcı veya sekme daha yeni bir sürüm kaydetti. Değişiklikleriniz burada duruyor; kayıtlı çalışma alanını açmadan önce kurtarma dosyasını indirin.'));
  if(status.reloadRequired)return T('Backup restored. Reopen the saved workspace to continue.','Yedek geri yüklendi. Devam etmek için kayıtlı çalışma alanını yeniden açın.');
  if(status.phase==='error')return S(T('NOT SAVED — local storage could not confirm this change. Keep this tab open; retry or download recovery.','KAYDEDİLMEDİ — yerel depolama bu değişikliği doğrulayamadı. Sekmeyi açık tutun; tekrar deneyin veya kurtarma dosyasını indirin.'),T('Not saved — the server did not confirm the last change. Keep this tab open and retry, or download a recovery file.','Kaydedilmedi — sunucu son değişikliği doğrulamadı. Sekmeyi açık tutup tekrar deneyin veya kurtarma dosyasını indirin.'));
  if(!status.loaded)return S(T('Connecting to this computer’s patient records…','Bu bilgisayardaki hasta kayıtlarına bağlanılıyor…'),T('Connecting to patient records…','Hasta kayıtlarına bağlanılıyor…'));
  if(status.saving)return S(T('Saving on this computer…','Bu bilgisayara kaydediliyor…'),T('Saving…','Kaydediliyor…'));
  if(status.dirty)return T('Changes pending — saving automatically…','Değişiklikler bekliyor — otomatik kaydediliyor…');
  return status.hasSavedWorkspace?S(T('Saved on this computer','Bu bilgisayara kaydedildi'),T('Saved','Kaydedildi'))+' · '+time(status.updatedAt):S(T('Local records ready. Enter a new assessment or open a saved patient.','Yerel kayıtlar hazır. Yeni değerlendirme girin veya kayıtlı hastayı açın.'),T('Records ready. Enter a new assessment or open a saved patient.','Kayıtlar hazır. Yeni değerlendirme girin veya kayıtlı hastayı açın.'));
 }
 function refresh(){
  renderAccess();
  const bar=$('localRecordStatus');if(!bar)return;
  bar.dataset.saveState=status.conflict||status.phase==='error'?'error':status.dirty||status.saving?'pending':'saved';
  bar.innerHTML=`<div><strong>${S(T('Local patient records','Yerel hasta kayıtları'),T('Patient records','Hasta kayıtları'))}</strong><p role="status">${esc(statusMessage())}</p><small>${T('Autosave includes unfinished entries. Confirmations require review when reopened.','Otomatik kayıt, tamamlanmamış girdileri de içerir. Yeniden açılan verilerin onayları tekrar kontrol edilir.')}</small>${guestNote()}</div><div class="button-row"><button id="localSaveNow" class="button secondary" ${busy?'disabled':''}>${T('Save now','Şimdi kaydet')}</button><button id="localOpenArchive" class="button subtle">${T('Saved patients & backups','Kayıtlı hastalar ve yedekler')}</button><button id="localRecovery" class="button subtle">${T('Download recovery','Kurtarma dosyasını indir')}</button>${status.conflict||status.reloadRequired?`<button id="localReloadSaved" class="button secondary">${T('Reopen saved workspace','Kayıtlı çalışma alanını aç')}</button>`:''}</div>`;
  $('localSaveNow').addEventListener('click',async()=>{const result=await getStore().flush();notice=result.ok?S(T('Current entries saved on disk.','Güncel girdiler diske kaydedildi.'),T('Current entries saved.','Güncel girdiler kaydedildi.')):T('Save was not confirmed. Download recovery and keep this tab open.','Kayıt doğrulanamadı. Kurtarma dosyası indirin ve sekmeyi açık tutun.');renderArchive();});
  $('localRecovery').addEventListener('click',downloadRecovery);
  $('localOpenArchive').addEventListener('click',()=>{navigate('research');void refreshLists();});
  $('localReloadSaved')?.addEventListener('click',async()=>{
   if(status.dirty||status.conflict){downloadRecovery();notice=T('Recovery downloaded. Confirm reopening to replace the on-screen draft with the saved copy.','Kurtarma indirildi. Ekrandaki taslağın kayıtlı kopyayla değişmesi için yeniden açmayı doğrulayın.');navigate('research');renderArchive();return;}
   const result=await getStore().reloadSavedWorkspace();notice=result.ok?T('Saved workspace reopened. Review confirmations.','Kayıtlı çalışma alanı açıldı. Onayları kontrol edin.'):T('Workspace could not be reopened.','Çalışma alanı açılamadı.');renderArchive();
  });
  renderArchive();
 }
 function renderArchive(){
  const target=$('localPatientArchive');if(!target)return;
  const shown=patients.filter(p=>String(p.studyId||'').toLocaleLowerCase().includes(filter.toLocaleLowerCase()));
  const workingRange=page?.records?.length?`${page.offset+1}–${Math.min(page.offset+page.records.length,page.total)}`:'0';
  target.innerHTML=`<div class="card-head"><div><span class="eyebrow">${S(T('THIS COMPUTER','BU BİLGİSAYAR'),T('SERVER','SUNUCU'))}</span><h2>${T('Patient archive and recovery','Hasta arşivi ve kurtarma')}</h2></div><button id="localRefreshArchive" class="button secondary" ${busy?'disabled':''}>${T('Refresh list','Listeyi yenile')}</button></div><p>${T('Saved assessments remain in the archive when the working list is cleared. Unfinished drafts are also retained when you switch patients.','Çalışma listesi temizlendiğinde kaydedilmiş değerlendirmeler arşivde kalır. Hasta değiştirirken tamamlanmamış taslaklar da korunur.')}</p><label for="localPatientSearch">${T('Find patient by study code','Çalışma koduyla hasta ara')}</label><input id="localPatientSearch" type="search" autocomplete="off" maxlength="160" value="${esc(filter)}"><p class="footnote">${shown.length} / ${patients.length} ${T('patient codes','hasta kodu')}</p><div class="local-patient-list">${shown.length?shown.slice(0,200).map((p,i)=>`<article><div><strong>${esc(p.studyId||T('Unassigned draft','Kodu girilmemiş taslak'))}</strong><small>${Number(p.recordCount)||0} ${T('saved assessments','kayıtlı değerlendirme')} · ${Number(p.draftCount)||0} ${T('drafts','taslak')} · ${esc(time(p.updatedAt))}</small></div><button class="button secondary" data-local-patient="${i}" ${busy?'disabled':''}>${T('Open','Aç')}</button></article>`).join(''): `<p>${T(ready?'No matching patient.':'Open this section or refresh the list to load saved patients.',ready?'Eşleşen hasta yok.':'Kayıtlı hastaları yüklemek için bu bölümü açın veya listeyi yenileyin.')}</p>`}</div>${shown.length>200?`<p>${T('Showing the first 200 matches; refine the code search.','İlk 200 eşleşme gösteriliyor; kod aramasını daraltın.')}</p>`:''}${page?`<div class="local-history-page"><p>${esc(page.studyId||T('Unassigned draft','Kodsuz taslak'))} · ${T('Working list','Çalışma listesi')}: ${workingRange} / ${page.total} ${T('saved assessments','kayıtlı değerlendirme')}</p><div class="button-row">${page.offset>0?`<button id="localNewerRecords" class="button subtle">${T('Newer assessments','Daha yeni değerlendirmeler')}</button>`:''}${page.hasMore?`<button id="localOlderRecords" class="button subtle">${T('Older assessments','Daha eski değerlendirmeler')}</button>`:''}</div></div>`:''}
  <details class="local-backup-controls"><summary>${T('Backups and recovery','Yedekleme ve kurtarma')}</summary><p>${S(T('The database is stored in nutrition/data. Backups are stored in nutrition/data/backups. The software package excludes these patient files. A copy on the same disk cannot protect against disk loss.','Veritabanı nutrition/data içinde; yedekler nutrition/data/backups içinde tutulur. Yazılım paketi bu hasta dosyalarını içermez. Aynı diskteki kopya, disk kaybına karşı koruma sağlamaz.'),T('Records are kept in the NutriClinic server database. Backups created here stay on the same server, so they do not protect against loss of that server.','Kayıtlar NutriClinic sunucusundaki veritabanında tutulur. Buradan oluşturulan yedekler aynı sunucuda kalır; sunucunun kaybına karşı koruma sağlamaz.'))}</p><button id="localCreateBackup" class="button secondary" ${busy?'disabled':''}>${S(T('Create local backup now','Şimdi yerel yedek oluştur'),T('Create backup now','Şimdi yedek oluştur'))}</button><label for="localBackupSelect">${T('Available backups','Mevcut yedekler')}</label><select id="localBackupSelect"><option value="">${T('Select a backup','Yedek seçin')}</option>${backups.map(b=>`<option value="${esc(b.file)}">${esc(time(b.createdAt))} · ${esc(b.kind)} · ${esc(b.file)}</option>`).join('')}</select><label class="check-field"><input id="localRestoreConfirmed" type="checkbox"><span>${T('I checked the backup date. Restore its saved workspace and keep a safety backup of the current database.','Yedek tarihini kontrol ettim. Kayıtlı çalışma alanını bu yedekten aç ve mevcut veritabanının güvenlik yedeğini koru.')}</span></label><button id="localRestoreBackup" class="button secondary" ${busy?'disabled':''}>${T('Restore selected backup','Seçili yedeği geri yükle')}</button></details>${status.conflict?`<label class="check-field"><input id="localReopenConfirmed" type="checkbox"><span>${T('I saved a recovery file of this draft and want to reopen the newer saved workspace.','Bu taslağın kurtarma dosyasını kaydettim; daha yeni kayıtlı çalışma alanını açmak istiyorum.')}</span></label><button id="localDiscardAndReopen" class="button secondary">${T('Confirm reopening saved copy','Kayıtlı kopyayı açmayı doğrula')}</button>`:''}<p id="localArchiveNotice" role="status">${esc(notice)}</p>`;
  if(page?.drafts?.length)target.insertAdjacentHTML('beforeend',`<details class="local-backup-controls"><summary>${T('Saved drafts for this patient','Bu hastanın kayıtlı taslakları')} · ${page.draftCount}</summary>${page.drafts.map(d=>`<div class="button-row"><span>${esc(time(d.updatedAt))}</span><button class="button subtle" data-local-draft="${esc(d.draftId)}">${T('Open this draft','Bu taslağı aç')}</button></div>`).join('')}</details>`);
  if(status.access==='full'){target.insertAdjacentHTML('beforeend',guestSection());bindGuestSection(target);}
  target.insertAdjacentHTML('beforeend',`<div class="button-row"><label class="button subtle" for="localRecoveryFile">${T('Open a recovery file','Kurtarma dosyası aç')}</label><input id="localRecoveryFile" class="file-input" type="file" accept=".json,application/json"></div>`);
  // The guide describes the desktop data folder, so the hosted edition does not offer it.
  if(!isServerEdition())target.insertAdjacentHTML('beforeend',`<a class="button subtle" href="./LOCAL-PATIENT-RECORDS.md" download>${T('Local records and backup guide ↓','Yerel kayıt ve yedekleme rehberi ↓')}</a>`);
  $('localRefreshArchive').addEventListener('click',()=>void refreshLists());
  $('localPatientSearch').addEventListener('input',e=>{filter=e.target.value;const start=e.target.selectionStart;renderArchive();$('localPatientSearch').focus();try{$('localPatientSearch').setSelectionRange(start,start);}catch{}});
  for(const button of target.querySelectorAll('[data-local-patient]'))button.addEventListener('click',()=>void loadPatient(shown[Number(button.dataset.localPatient)].studyId,0));
  $('localNewerRecords')?.addEventListener('click',()=>void loadPatient(page.studyId,Math.max(0,page.offset-page.limit)));
  $('localOlderRecords')?.addEventListener('click',()=>void loadPatient(page.studyId,page.offset+page.limit));
  for(const button of target.querySelectorAll('[data-local-draft]'))button.addEventListener('click',async()=>{
   if(busy||!await saveBeforeSwitch())return;const loaded=await getStore().loadDraft(button.dataset.localDraft);if(!loaded.ok){notice=T('Draft could not be opened.','Taslak açılamadı.');renderArchive();return;}
   await openPatient({records:page.records,latestDraft:loaded},page.studyId);notice=T('Draft opened; entered values retained and confirmations require review.','Taslak açıldı; girilen değerler korundu, onaylar yeniden değerlendirilmeli.');renderArchive();
  });
  $('localRecoveryFile')?.addEventListener('change',async event=>{const file=event.target.files?.[0];if(!file)return;const result=await importRecovery?.(file);notice=result?.ok?T('Recovery file opened with confirmations cleared.','Kurtarma dosyası onayları kaldırılarak açıldı.'):T('Recovery file was not opened. Existing entries were retained.','Kurtarma dosyası açılmadı. Mevcut girdiler korundu.');renderArchive();});
  $('localCreateBackup').addEventListener('click',async()=>{if(!await saveBeforeSwitch())return;const result=await getStore().backup();notice=result.ok?T('Backup created: ','Yedek oluşturuldu: ')+(result.backup?.file||''):T('Backup could not be confirmed.','Yedek doğrulanamadı.');await refreshLists();});
  $('localRestoreBackup').addEventListener('click',async()=>{const selected=$('localBackupSelect').value;if(!selected||!$('localRestoreConfirmed').checked){notice=T('Select a backup and confirm its date first.','Önce yedek seçip tarihini doğrulayın.');renderArchive();return;}if(!await saveBeforeSwitch())return;const result=await getStore().restoreBackup(selected);if(result.ok)await getStore().reloadSavedWorkspace();notice=result.ok?T('Backup workspace restored; current assessments were retained in the archive and a safety backup was created.','Yedek çalışma alanı açıldı; mevcut değerlendirmeler arşivde korundu ve güvenlik yedeği oluşturuldu.'):T('Restore was not confirmed; current data were not replaced by this screen.','Geri yükleme doğrulanamadı; bu ekrandan mevcut veriler değiştirilmedi.');await refreshLists();});
  $('localDiscardAndReopen')?.addEventListener('click',async()=>{if(!$('localReopenConfirmed').checked)return;const result=await getStore().reloadSavedWorkspace({discardPending:true});notice=result.ok?T('Saved copy reopened. Recovery file remains available.','Kayıtlı kopya açıldı. Kurtarma dosyanız korunur.'):T('Could not reopen the saved copy.','Kayıtlı kopya açılamadı.');renderArchive();});
 }
 async function refreshLists(){
  if(busy)return;busy=true;
  try{const [p,b]=await Promise.all([getStore().listPatients(),getStore().listBackups()]);if(p.ok){patients=p.patients;ready=true;}if(b.ok)backups=b.backups;if(!p.ok||!b.ok)notice=T('Archive/backup list could not be loaded. Current entries remain on screen.','Arşiv/yedek listesi yüklenemedi. Güncel girdiler ekranda duruyor.');}
  finally{busy=false;refresh();}
 }
 async function loadPatient(studyId,offset){
  if(busy||!await saveBeforeSwitch())return;busy=true;
  try{const response=await getStore().loadPatient(studyId,offset,200);if(!response.ok){notice=T('Patient could not be opened.','Hasta açılamadı.');return;}await openPatient(response,studyId);page={studyId,offset:response.offset||0,limit:response.limit||200,total:response.total||0,hasMore:!!response.hasMore||!!response.draftsHasMore,draftCount:response.draftCount||0,drafts:response.drafts||[],records:response.records};notice=T('Patient opened; review confirmations before use.','Hasta açıldı; kullanmadan önce onayları kontrol edin.');}
  catch{notice=T('Stored patient data could not be opened; on-screen data were preserved.','Kayıtlı hasta verisi açılamadı; ekrandeki veriler korundu.');}
  finally{busy=false;refresh();}
 }
 return {update(value){status=value;refresh();},refresh,refreshLists};
}
