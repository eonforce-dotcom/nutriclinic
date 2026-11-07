# UI0.3.19 local workspace addition

`nutriklinik-local-workspace-0.1.0`: current.draftId is a stableUUID for an unfinished assessment; current.input/clinicalProfile/delivery/labReferences/decisionReview/provenance preserve entered fields and explicit error metadata. records retains immutable assessment objects; importedComparisons remains untrusted history. SQLiteworkspace uses monotonic revision/updatedAt; saved assessments and draftidentities remain discoverable when working records are cleared. Currentclinical confirmations are reset onreopen; archivedrecord confirmations are preserved as historical documentation. No patient localStorage; no data/ insoftwareZIP. See [record methods](./LOCAL-PATIENT-RECORDS.md).

# UI0.3.18 addition — clinic interval context

`labReferences` stores `clinic-lab-references-0.1.0` configuration snapshot, profile validity/errors, per-analyte contextual comparison, explicit transient applicability and `clinicalValidation:false`. It is appended as CSV column88 after the previous87columns. Clinic profile persistence excludes patient values/results/applicability. Research import retains untrusted original records, validates profile and recomputes comparisons with confirmationfalse. Legacy absence remainsnull. See [methods](./CLINIC-REFERENCE-INTERVALS.md).

# NutriClinic veri sözlüğü / Data dictionary

**Belge revizyonu:** 26 Ekim 2026 · **İncelenen kaynak:** UI 0.3.17 / çekirdek 0.1.1 · **Kapsam:** yetişkin YBÜ ve servis araştırma prototipi.

Bu belge **A bölümünde uygulanmış kayıt/export şemasını**, **B bölümünde henüz uygulanmamış hedef araştırma şemasını** ayrı gösterir. B bölümündeki alanlar mevcut uygulamanın içe aktarma formatı değildir. Önerilen bir alanın listelenmesi, arayüzde veya veri tabanında uygulanmış olduğu anlamına gelmez.

**English overview:** Part A describes implemented record/export paths and canonical units. Part B is a future research-data proposal, not an importable application schema. The app stores albumin in **g/L**, core neutrophil/lymphocyte counts in **10⁹/L**, and `input.visitDate` as **YYYY-MM-DD**, not a timestamp. Independent research records must add measurement provenance, missingness, cutoff times, reviewer identity and reference/outcome information.

İlişkili belgeler: [Araştırma protokolü](./RESEARCH-PROTOCOL.md), [Metabolik yöntem ve doğrulama](./METABOLIC-METHODS-AND-VALIDATION.md), [İzlem yöntemi](./FOLLOW-UP-METHODS.md), [Bağımsız doğrulama CRF taslağı](./CLINICAL-VALIDATION-CRF.md).

## A. Uygulanmış şema / Implemented schema

Eşleme `app.mjs`, `import.mjs`, `engine.mjs`, `clinical-workspace.mjs`, `clinical-context.mjs`, `criteria-malnutrition.mjs`, `criteria-function.mjs`, `followup-engine.mjs` ve `followup-ui.mjs` kaynaklarına dayanır. Sayısal kabul aralıkları klinik normal aralık veya doz önerisi değildir. Çalışma, kullandığı kaynak sürümünü ayrıca dondurmalıdır.

### A1. Kimlik, sürüm ve zaman / Identity, version and time

JSON üst zarfı `schema`, `exportedAt`, `records`, `followupComparison` ve `importedComparisons` içerir. Aşağıdaki yollar `records[]` içindedir.

| Gerçek yol / Actual path | Mevcut anlam / Current meaning | Sınır / Limit |
|---|---|---|
| `recordId` | Her kaydetmede üretilen kayıt UUID'si | Hasta, yatış veya değişmez mantıksal ziyaret kimliği değildir. Revizyon/yeniden aktarım yeni gözlem günü sayılmaz. |
| `input.studyId` | Kimliksiz olgu/çalışma kodu | Oturumlar arası benzersizlik veya kurum hasta anahtar yönetimi sağlanmaz. |
| `input.visitDate` | **YYYY-MM-DD** değerlendirme günü | Değerlendirme saati, ofseti veya bilgi kesim zamanı içermez. |
| `savedAt` | Kaydetme anı, ISO UTC zaman damgası | Ölçüm/örnek alma, rapor erişilebilirliği veya hekim onay zamanı değildir. |
| `schemaVersion` | Kayıt şeması sürümü | Motor/arayüz/izlem sürümleriyle eşit varsayılmaz. |
| `engineVersion`, `engineSha256`, `assessmentSha256`, `uiVersion`, `evidenceCutoff` | Manuel/sentetik snapshot ve yeniden aktarımda güncel hesap sürümü, kaynak hash'leri ve kanıt kesiti | Yeniden aktarım yeni sonuç ve güncel kimlik üretir; eski kimlikler `originalRecord` içinde tarihsel veridir. Kanıt tarihi katalog içeriğinin hash'i değildir. |
| `coreRuleProvenance` | Ana sonuç grupları için güncel yapılandırılmış kaynak eşlemesi | Ölçüm kaynağı `provenance[]`, klinik doğrulama veya hekim imzası değildir. A4'teki kapsam/geçiş kuralları geçerlidir. |
| `input.demo`, `input.inputErrors` | Sentetik örnek bayrağı; geçersiz alan kimlikleri | `demo=false` bağımsız veri doğrulaması değildir; hata listesi eksiklik nedeni sözlüğü değildir. |
| `input`, `output`, `provenance`, `clinicalProfile`, `delivery`, `decisionReview` | Giriş kopyası, sonuçlar ve ilişkili modül kayıtları | Oturum belleğindedir; kalıcı kurumsal kayıt veya değiştirilemez denetim izi sağlamaz. |

### A2. Ana girişler ve kanonik birimler / Core inputs and canonical units

| Gerçek `input` alanları / Actual input fields | Mevcut birim veya değer / Current unit or value | Kayıt sınırı / Recording limit |
|---|---|---|
| `age`, `sex`, `pregnant` | yıl; `female/male/other`; `yes/no` veya boş bilinmeyen seçim | Tam doğum tarihi kaydedilmez. |
| `height`, `weight`, `usualWeight`, `lossMonths`, `fluidWeight` | cm; kg; kg; ay; `reliable/unreliable` | Her ağırlığın ayrı tarihi/yöntemi ve gerçek/kuru/ideal/ayarlanmış tür alanı yoktur. |
| `context`, `phase`, `icuDay` | `icu/ward`; `early/late/recovery`; gün | Faz gün sayısından otomatik belirlenmez; yatış/transfer zaman çizelgesi yoktur. |
| `renal`, `hemodynamics`, `gi`, `swallow`, `route` | `none/aki/ckd/rrt`; `stable/unstable`; `functional/contraindicated`; `safe/unsafe`; `oral/tube` | AKI evresi, KRT türü/zamanı, tüp yeri ve PN reçetesi bu seçimlerden çıkarılamaz. |
| `norepinephrineEquivalent` | µg/kg/dakika | Kullanıcının doğruladığı gözlem; uygulama eşdeğer doz dönüşümü yapmaz. |
| `electrolytes`, `refeedingHistory` | `normal/low`; `yes/no` | Toplu değerlendirme; ayrı ilaç dozu/zamanı veya refeeding olayı kaydı değildir. |
| `usualIntake`, `reducedDays`, `negligibleDays` | olağan alımın yüzdesi; gün; gün | Olağan alıma oran, gereksinim veya hekim hedefi karşılanma oranıyla aynı değildir. |
| `intakeCriterion`, `muscle`, `inflammation`, `screenPositive` | klinisyen seçimi/bayrağı | Özgün tarama/ölçüm kaydının yerine geçmez. |
| `albumin` | **g/L** | Yapılandırılmış aktarımda g/dL ×10 dönüştürülür. |
| `neutrophils`, `lymphocytes` | **10⁹/L** mutlak sayım | Desteklenen `/µL` veya `/mm3` sonuçları ÷1000 dönüştürülür; yüzde kabul edilmez. `/mm³` yazımı bu ayrıştırıcı sürümünün kabul ettiği birim listesinde değildir. |
| `crp`, `creatinine`, `lactate` | mg/L; mg/dL; mmol/L | Yerel CRP üst referansı ek modüldedir; tek sonuç katabolizma/protein dozu belirlemez. |
| `potassium`, `phosphate`, `magnesium` | mmol/L | Sayısal ön kontroller yerel laboratuvar referansının yerine geçmez. |
| `labDate` | **YYYY-MM-DD** | Ana kan panelinin ortak örnek günü; test başına örnek saati/rapor erişim zamanı yoktur. |
| `uun`, `uunDate` | **g N/24 saat** toplam idrar üre azotu; **YYYY-MM-DD** | Konsantrasyon, serum üre/BUN veya toplam idrar azotu değildir. Kan tarihinden ayrıdır. |
| `actualProtein` | g / eşleşen 24 saat | Gerçekte alınan toplam protein; planlanan miktar değildir. |
| `collectionStart`, `collectionEnd`, `urineVolume` | ISO zaman; ISO zaman; mL | Aynı zaman temeli gerekir: iki ofsetsiz duvar zamanı veya ikisi de ofsetli/Z. |
| `collectionComplete`, `collectionMatched`, `extraLosses` | boolean | İşaretlenmemiş ek-kayıp kutusu, dış CRF'de “kayıp yokluğu bağımsız değerlendirildi” anlamına çevrilmemelidir. |
| `measuredEE`, `kcalTarget`, `proteinTarget`, `otherKcal`, `otherProtein` | kcal/gün; kcal/gün; g/gün; kcal/gün; g/gün | Ölçüm kalite/tarih zarfı, hedefi belirleyen kişi/zaman ve kaynak dökümü ayrı tutulmaz. |
| `formulaName`, `formulaSource` | ürün adı ve etiket/kaynak metni | Sürümlenmiş katalog, etiket dosyası/hash'i veya doğrulayan kişi değildir. |
| `formulaEnergy`, `formulaProtein`, `formulaWater` | **kcal/mL**; **g/100 mL**; **mL/100 mL** | 1 mL ile 100 mL paydaları eşitlenmemelidir. |
| `formulaVolumeLimit`, `hours`, `servingVolume` | mL/gün; saat/gün; mL | Hacim sınırı diğer sıvıları kapsamaz. |
| `labsConfirmed`, `formulaVerified`, `clinicianConfirmed` | boolean | Kaynak/ürün/hekim değerlendirmesi onayı; kimliği belli zaman damgalı klinik imza değildir. |

### A3. Klinik ve izlem modülleri / Clinical and follow-up modules

Bu tabloda ilk yolu `clinicalProfile.measures.` ile başlayan satırlardaki sonraki kısa alan adları da aynı nesnenin altındadır. Bunlar ayrı üst düzey JSON alanları değildir.

| Gerçek yol / Actual path | Uygulanmış kapsam / Implemented scope | Dış CRF gereği / External CRF need |
|---|---|---|
| `clinicalProfile.measures.fatFreeMass`, `ffmMethodValid`, `lossUnintentional` | Toplam FFM kg, yöntem/sıvı ve istemsiz kayıp onayı | Ayrıntılı cihaz/yöntem/tarih kaydı |
| `clinicalProfile.measures.aspenContext`, `aspenIntake`, `aspenWeight`, `aspenMuscle`, `aspenFat`, `aspenFluid`, `aspenGrip`, `nrsNutrition`, `nrsDisease` | AND/ASPEN özellikleri; NRS 2002 alt puanları | Özgün tanım/süre/şiddet ve değerlendirici kaynağı |
| `clinicalProfile.measures.gripStrength`, `chairRiseSeconds`, `appendicularMass`, `gaitSpeed`, `sppb`, `strengthValid`, `muscleValid`, `performanceValid`, `sarcopeniaConfounded`, `functionSource`, `functionDate`, `functionConfirmed` | kg; saniye; kg; m/s; 0–12; geçerlilik/karıştırıcı bayrakları ve ortak kaynak/tarih/onay | Standardizasyon, cihaz, etkilenen taraf, tekrarlar, değerlendirici |
| `clinicalProfile.measures.eat10Total`, `fois`, `iddsiFood`, `iddsiFluid`, `dysphagiaAssessment`, `impairedAlertness`, `dysphagiaUnsafeSigns`, `dysphagiaSource`, `dysphagiaDate`, `dysphagiaConfirmed` | Özgün değerlendirmeden toplam/düzey ve güvenlik bağlamı | Özgün form dili/sürümü ve bağımsız yutma kaydı |
| `clinicalProfile.measures.conditions`, `ibdType`, `ibdPhase`, `highOutputStoma`, `bowelObstruction`, `contextNote`, `contextReviewed` | Kronik hastalık, emilim/kayıp ve beslenme uygunluğu | Seyir, ölçülen kayıp miktarı ve doğrulayan kişi/zaman |
| `clinicalProfile.measures.ureaValue`, `ureaAnalyte`, `ureaUnit`, `crpULN`, `markerDate`, `markerConfirmed` | Açık üre/BUN analiti-birimi, CRP üst referansı, aynı gün onayı | UCR'de iki analit mg/dL temeline getirilir; mmol/mmol çalışma değerleriyle sayısal eşik eşlemesi yapılmaz. |
| `clinicalProfile.measures.sofaGcs`, `sofaDelirium`, `sofaPaO2`, `sofaFiO2`, `sofaVentilation`, `sofaMap`, `sofaNe`, `sofaEpi`, `sofaOtherVaso`, `sofaMechanical`, `sofaBilirubin`, `sofaCreatinine`, `sofaRrt`, `sofaUrine`, `sofaPlatelets`, `sofaDate`, `sofaConfirmed`; `saps2Total`, `sapsDate`, `sapsConfirmed` | SOFA-2 organ girdileri; klinisyenin SAPS II toplamı | Özgün pencere/dipnot ve kaynak kontrolü; SAPS II'nin 17 alt değişkeni yeniden hesaplanmaz. |
| `clinicalProfile.outputs` | Kriter, işlev, bağlam, belirteç sonuçları ve kaynak kimlikleri | Bağımsız referans/klinik sonuç değildir. |
| `delivery.measures.episodeId`, `targetVersion`, `periodStart`, `periodEnd`, `source` | Yatış, hedef sürümü, alım dönemi, kaynak metni | Tam yatış/kaynak zaman çizelgesi |
| `delivery.measures.actualEnergy`, `actualProtein`, `targetsStable`, `confirmed`, `invalidFields` | kcal/24 saat; g/24 saat; hedef/alım onayları | Kaynak bazlı alım, beslenme dışı enerji, sıvı, kesinti/tolerans dökümü |
| `delivery.output` | `valid/errors/notes/period/scope/actual/targets/percent/difference/nitrogen/sourceIds` | Hekim hedefine göre betimleme; emilim veya fizyolojik optimum değildir. |
| `followupComparison` | Sürüm, beş kapsam anahtarı ve seçilen kimlikler; `rows/excluded/summary/notes` | Korunan dönemler arasındaki kapsama, bütün yatışın tam izlemi değildir. |
| `decisionReview.records[]` | Konu/seçim, gerekçe, incelenen giriş kopyası, kaynaklar, zaman/güncellik | Yazılım görülmeden kaydedilmiş rutin plan veya kör bağımsız referans değildir. |

### A4. Kaynak, eksiklik ve arşiv / Provenance, missingness and archive

`provenance[]` yapılandırılmış aktarımda test, özgün örnek günü, normalleştirilmiş birim, yöntem ve dönüşüm açıklamasını taşır. Manuel girişte tarih/yöntem ve değişiklik zamanı bulunabilir. **Ham rapor değeri/birimi, dosya hash'i, sayfa/satır, assay yöntemi, doğrulayan kişi/zaman ve tüm düzeltmeler ortak bir zarf halinde saklanmaz.** Dış CRF/kontrollü kaynak eşlemesi bunları tamamlamalıdır. Kimlik taşıyabilecek dosya adı araştırma anahtarı olarak kullanılmamalıdır.

Boş/null, sıfır veya normal değildir. Mevcut bilinmeyen seçimleri/onay boolean'ları yapılandırılmış `missingReason` sözlüğü sağlamaz. Yapılmamış, beklenen, güvenilmez, uygulanamaz, bilinmeyen ve erişilemeyen ölçümler dış CRF'de önceden onaylanmış kodlarla ayrılmalıdır.

Ana `output`: `bmi`, `weightLoss`, `indices`, `metabolic`, `glim`, `refeeding`, `blockers`, `reference`, `plan`, `trace`. NLR/PNI/azot değeri uygun değilse bulunmayabilir. Pozitif/negatif yaklaşık azot sonucu net kas anabolizması veya tek başına tedavi başarısı değildir. `plan.rate`, hedef hacmin saatlik aritmetik karşılığıdır; başlangıç/pompa reçetesi değildir.

**0.3.15 — additive core reference map / ek kaynak haritası:** `records[].coreRuleProvenance` ayrı, isteğe bağlı bir metadata alanıdır; mevcut `output` şekli, çekirdek 0.1.1, kayıt şeması `0.1.0` ve üst JSON şeması `nutriklinik-research-0.1.0` değişmedi. Harita `schemaVersion`, `origin`, `engineVersion`, `documentationReviewedAt`, `evidenceCutoff`, `scope: reference-map-only`, `clinicalValidation: false`, `implementationPolicyScope` ve `rules[]` içerir. Her kuralda `id`, `outputPaths`, `sourceReferences[{sourceId,role}]`, `mappingStatus`, `implementationPolicies[]` vardır. Yollar `output` nesnesine görelidir; örneğin `indices.nitrogen`. Bunlar sonuç varlığı/uygunluğu veya tanı iddiası değildir.

BMI/ağırlık aritmetiği ve NLR için özel kaynak eşlenmemiştir. **0.3.16 PNI güncellemesi:** özgün İngilizce özette denklem/birimler doğrudan kontrol edildi ve kanonik birimlerle cebirsel eşdeğerlik gösterildi. Rol `original-abstract-formula-units`, durum `formula-units-checked-abstract-only` olarak ayrılır. Bu, Japonca tam metin yöntemleri veya YBÜ/servis klinik geçerliğinin doğrulanması değildir; [yöntem notuna](./PNI-SOURCE-METHODS.md) bakın. **0.3.17 azot dengesi bağlamı:** `lin-pmv-2026` kaynağı `original-use-context` rolüyle eklenir: özgün çalışmada yaklaşık denklemin kullanılması, bireysel anabolik durum sınıflandırıcısının geçerliği değildir. [Lin PMV yöntem notu](./LIN-PMV-SOURCE-METHODS.md) incelenen kaynak düzeylerini ayırır. GLIM/NICE klinik çerçevesi, azotun yaklaşık yöntemi/renal uygulanabilirliği ve mama planının yalnız bağlamsal ESPEN referansı ayrı rollerdir. `local-*` kontroller yazılım politikalarıdır; bütün eşikleri veya güvenlik kurallarını kaynakların doğruladığı anlamına gelmez. Kaynak haritası ve görünümü `assessmentSha256` kapsamındadır; çekirdek denklem dosyası değişmedi.

Manuel kayıt, sentetik örnek ve araştırma JSON'u yeniden aktarımında harita yalnız yerel güncel sabitlerden üretilir. Eski dosyada alanın bulunmaması kabul edilir; gelen harita güncel otorite olarak kullanılmaz. Gelen bütün kayıt `originalRecord` altında tarihsel/doğrulanmamış olarak korunur; yeni `output` tekrar hesaplanır, mevcut onay sıfırlama kuralları korunur. Eski dosyaya ölçüm günü veya klinik onay uydurulmaz. CSV'nin eski sütun sırası korunmuş ve sona tek `coreRuleProvenance` sütunu (JSON metni) eklenmiştir; harita yoksa hücre boştur. Eski sabit sütun sayısı bekleyen analizler bu ek sütunu dikkate almalıdır. Harita eklenmesi CSV'yi tam JSON arşivine dönüştürmez.

**Tam yeniden üretim için JSON + dondurulmuş kaynak arşivi/commit + manifest gerekir.** `release-info.json`, `build-info.mjs` ve ilgili kanıt kataloğu/hash'i birlikte saklanmalıdır. Hash kapsamı manifestten kontrol edilir; tek motor hash'i bütün arayüz/çeviri/kanıt dosyalarını kapsıyor varsayılmaz. Kaynak kayıtlarla eşleme ve bağımsız referans dosyaları kurumun kontrollü ortamında korunur.

CSV; ana giriş/onaylar, seçilmiş hesap sonuçları, klinik/gerçek alım payload'ları ve izlem seçim/dışlama/özetlerini taşır. **Tam JSON eşdeğeri değildir:** mevcut CSV'de `engineSha256`, `assessmentSha256`, `uiVersion`, tam `provenance`, `inputErrors`, bütün hesap/yorum izi ve özgün yeniden aktarım geçmişi bulunmaz. CSV veya ekran görüntüsü tek başına yeniden çalıştırılabilir kaynak arşivinin yerine geçmez.

### A5. Uygulanmış tarih alanları ve göç kuralı / Date and migration rules

`input.uunDate`: YYYY-MM-DD, UUN raporundaki örnek/toplama bitiş tarihi. Kan tarihi `labDate` ile birleştirilmez. Azot dengesi için yazılan `collectionEnd` takvim günüyle eşit ve `visitDate` gününü aşmayan gerçek tarih gerekir. Ofsetli zamanlarda da yazılı gün karşılaştırılır; sunucu/cihaz saat dilimine dönüştürülmez. Başlangıç/bitiş süresi ayrıca doğrulanır. Eksik UUN tarihi sonucu bilinmeyen tutar; sıfır yapmaz. Eski JSON'a tarih uydurulmaz; doğrulamalar yenilenir. Yapılandırılmış laboratuvar aktarımında özgün UUN tarihi girişte ve `provenance[]` içinde korunur. Araştırma JSON'u yeniden açıldığında gün `input.uunDate` içinde, özgün kaynak izi ise `originalRecord.provenance` altında kalır; yeni `provenance[]` yeniden aktarım olayını tanımlar. Tarih değiştirilince mevcut UUN değeri ve ana kaynak izi temizlenir; elle ölçüm değişikliği yeni manuel kaynak izi oluşturur.

`clinicalProfile.measures.conditions` içindeki böbrek/bağırsak yetmezliği ve `highOutputStoma=true`, basit azot yorumu için ana ekran ve izlemde ayrıca kontrol edilir. Ham veri silinmez; yeniden uzlaştırılmalıdır. Bunlar klinik doz veya tanı alanları değildir.

Gerçek alım izlemi **tam 24 saat** ister; ana idrar uygunluğundaki **24±0,1 saat** ile aynı teknik kural değildir. Bunlar klinik olarak doğrulanmış ölçüm toleransları olarak sunulmamalıdır. Azot noktası için protein toplamı ve pencereler/zaman temeli tam eşleşir. Gün düzeyindeki kontroller aynı gün içindeki erişilebilirliği kanıtlamaz; bilgi kesim zamanı dış CRF'de kaydedilmelidir.

## B. Hedef araştırma şeması önerisi / Future proposal — not implemented or importable

Aşağıdaki alan adları dış araştırma veri modeli tasarımıdır; A bölümündeki gerçek yolların yerine konulamaz. Mevcut JSON'a eklenmeleri uygulamanın bunları kullanacağı anlamına gelmez. Bu öneri ikili katabolik/anabolik “gerçek etiket”, örneklem hesabı, kabul eşiği veya etik izin sağlamaz. Çocuk, gebelik ve evde bağımsız tedavi amaçlanan yetişkin YBÜ/servis araştırma kapsamından ayrıdır.

## Kayıt, zaman ve ölçüm kaynağı

| Alan | Tip / birim | Tanım ve kayıt kuralı |
|---|---|---|
| `studyId` | Metin | Rastgele, takma kimlik; ad, T.C. kimlik no, protokol numarası veya bunlardan türetilmiş hash içermez. Yeniden eşleme anahtarı araştırma veri setinden ayrı tutulur. |
| `logicalVisitId`, `revisionId`, `assessmentCutoffAt` | Metin; ofsetli ISO zaman | Önerilen mantıksal ziyaret/revizyon ve bilgi kesim anı. **Mevcut `input.visitDate` YYYY-MM-DD gün alanıdır; timestamp değildir.** Ölçüm, rapor erişimi, giriş ve inceleme anları ayrı kaydedilir; varsa etik plana uygun tarih kaydırması belgelenir. |
| `setting`, `admissionDate`, `icuDay`, `illnessPhase` | ICU/ward; tarih; gün; kategori | Bakım yeri, yatış zamanı ve hastalığın akut/stabil/iyileşme fazı. Faz otomatik olarak yalnız gün sayısından çıkarılmaz. |
| Her sayısal ölçümün ortak zarfı | Nesne | `value`, `unit`, `measuredAt`, `windowStart`, `windowEnd`, `sourceType`, `sourceDocumentId`, `sourceLocation`, `method`, `referenceLow`, `referenceHigh`, `verifiedBy`, `verifiedAt`, `missingReason`. Gerekli olmayan zaman aralığı alanı boş bırakılabilir. |
| `sourceType`, `method` | Kategori/metin | Laboratuvar, kalibre tartı, hasta/yakın beyanı, cihaz, hemşire alım çizelgesi, üretici etiketi; ölçüm ile tahmin ayırt edilir. Tahmini boy/kilo ayrıca işaretlenir. |
| `importAudit` | Nesne | Dosyanın yerel kimliği/hash’i, sayfa/satır, orijinal değer/birim ve dönüştürülmüş değer; ayrıştırıcı sürümü, kullanıcı düzeltmesi ve zaman damgası. Dosya adı da kimlik bilgisi taşıyabileceğinden araştırma çıktısına alınmaz. |

Boş alan sıfır değildir. `missingReason`: `notMeasured`, `unknown`, `notApplicable`, `unreliable`, `pending`, `withheld`. Evet/hayır klinik alanlarında da `unknown` bulunur. Geçersiz veya belirsiz değer hesaplamaya katılmaz; neden görüntülenir. Eksik veri otomatik normal değerle doldurulmaz. OCR/ayrıştırma sonucu klinisyen doğrulamasından önce taslaktır.

## Klinik girişler

| Alanlar | Birim / değer | Kullanım ve koşul |
|---|---|---|
| `ageYears`, `sexForEquation`, `pregnancyStatus` | yıl; kadın/erkek/belirtilmedi; üç durum | Formül seçimi ve kapsam kontrolü. Tam doğum tarihi yerine yaş tercih edilir. Cinsiyet alanı yalnız kullanılan denklemin gerektirdiği bağlamda tutulur. |
| `heightCm`, `weightKg`, `usualWeightKg`, `weightAt1MonthKg`, `weightAt3MonthsKg`, `weightAt6MonthsKg` | cm; kg | Her ağırlığın ölçüm tarihi/yöntemi gerekir. İstemsiz kayıp ayrıca doğrulanır. `edema`, `ascites`, `fluidOverload`, `dryWeightKg`, `amputation` güvenilirliği etkiler; kuru ağırlık tahmini işaretlenir. |
| `weightLossIntentional`, `weightLossWindowMonths` | üç durum; ay | GLIM ve taramada zaman penceresi kaybolmamalı. Kayıp yüzdesi `(önceki−güncel)/önceki×100`; sıvı değişimine bağlı fark klinik kayıp gibi yorumlanmaz. |
| `muscleMassMethod`, `muscleMassValue`, `muscleMassUnit`, `muscleReference`, `lowMuscleMass`, `muscleLossSeverity`, `fatLossSeverity` | yöntem/birim/kategori | BT, DXA, BIA, ultrason veya muayene/antropometri; anatomik seviye ve referans kaydedilir. `calfCircumferenceCm`, `midArmCircumferenceCm` isteğe bağlıdır. El kavrama kuvveti kg olarak işlev göstergesidir; kas kitlesi ölçümü yerine sessizce konulmaz. |
| `diagnoses`, `diseaseSeverity`, `inflammationClinical`, `sepsis`, `majorTrauma`, `burns`, `liverDisease` | Kod/metin; üç durum | Tanı ve hastalık yükü klinisyen tarafından doğrulanır. APACHE II/SOFA varsa puan ve hesaplandığı gün ayrı tutulur. NRS hastalık puanı gerekçesiz otomatik atanmaz. |
| `renalStatus`, `akiStage`, `rrtType`, `rrtStart`, `urineOutputMl24h` | normal/CKD/AKI; evre; yok/IHD/PD/CRRT; tarih; mL/24 saat | Azot dengesi ve protein değerlendirmesi için gereklidir. CRRT/diyaliz kayıpları ölçülmediyse basit UUN formülü güvenilir kabul edilmez. |
| `hemodynamicStable`, `shockControlled`, `vasopressorTrend`, `bowelIschemiaSuspected`, `bowelObstruction`, `activeGIBleeding`, `giFunctional` | üç durum/kategori | Beslenme yolu ve klinik değerlendirme gereğini belirler. Hemodinamik belirsizlikte otomatik uygulama planı verilmez. |
| `swallowAssessment`, `aspirationRisk`, `feedingRoute`, `tubeLocation`, `giTolerance` | kategori/metin | Özellikle nöroloji hastasında yutma değerlendirmesi ve aspirasyon riski; oral, gastrik/postpilorik EN, PN veya kombinasyon. Disfaji yalnız kan testinden çıkarılmaz. |
| `nausea`, `vomiting`, `diarrhea`, `constipation`, `abdominalPain`, `malabsorption`, `giLosses` | şiddet/süre; mL/gün varsa | GLIM 2026 alım/semptom ölçütü ve tolerans takibi. Semptom şiddeti klinisyen tarafından doğrulanır. Dren, fistül ve yara kayıpları ayrıca kaydedilir. |
| `usualIntakePercent`, `usualIntakeReductionDays`, `negligibleIntakeDays`, `expectedNoIntakeDays`, `estimatedNeedIntakePercent` | %; gün | Olağan alıma göre azalma ile hesaplanmış gereksinimin karşılanması farklı alanlardır. GLIM 2026 için olağan alım; refeeding/diğer protokoller için ilgili tanım kullanılır. |
| `alcoholRisk`, `insulinUse`, `chemotherapy`, `antacids`, `diuretics`, `thiamineGiven` | üç durum; doz/zaman varsa | Refeeding riskini ve elektrolit yorumunu destekler. Normal başlangıç elektroliti toplam vücut açığını dışlamaz. |

## Laboratuvar, aynı zaman penceresi ve alım

| Alanlar | İç standart birim | Kural |
|---|---|---|
| `albumin`, `prealbumin`, `crp`, `crpUpperLimit` | albümin **g/L**; prealbümin açık rapor birimi; CRP/üst sınır mg/L | Mevcut albümin standardı g/L korunur; özgün farklı birim ayrı `rawUnit` alanında saklanır ve dönüşüm belgelenir. Prealbümin bu sürümün ana panelinde uygulanmış değildir. Albümin/prealbümin tek başına beslenme veya anabolizma tanısı değildir. |
| `neutrophils`, `lymphocytes`, `platelets`, `wbc` | ana nötrofil/lenfosit **10⁹/L**; diğerleri analite özgü açık birim | Mevcut nötrofil/lenfosit standardı korunur; orijinal hücre/µL sonucu ayrı saklanır ve dönüşüm belgelenir. Yüzde mutlak sayım değildir. SOFA-2 trombositi kendi `10³/µL` birimiyle ayrıdır. NLR'de aynı birim/pencere; lenfosit sıfırsa bölme yapılmaz. |
| `totalCholesterol`, `glucose`, `creatinine`, `bun`, `urea` | mg/dL | Üre ile BUN ayrı analitlerdir. BUN, serum üresi veya spot idrar üresi günlük UUN yerine konmaz. `egfr` mL/dk/1.73 m² ve yöntem/tarih ile tutulur. |
| `sodium`, `potassium`, `phosphate`, `magnesium`, `calcium` | mmol/L | Orijinal birim korunur. Özellikle fosfat/magnezyum mg/dL dönüşümleri analite özgüdür. Baseline ve seri ölçümler zaman damgalıdır; refeeding düşüşü aynı analitin beslenme öncesi değerine göre hesaplanır. |
| `labEpisodes`, `feedingStart`, `calorieEscalationAt` | ISO zamanlı seri | K/P/Mg azalması, beslenme başlangıcı/artışı ve organ bulgularıyla eşleştirilir. Başka nedenlere bağlı düşüşler için klinik değerlendirme alanı bulunur. |
| `proteinActualG`, `energyOralKcal`, `energyENKcal`, `energyPNKcal`, `proteinOralG`, `proteinENG`, `proteinPNG` | g/pencere; kcal/pencere | Reçete edilen değil, gerçekten alınan/verilen miktar. Kesinti, kusma, infüzyon durması ve kalan hacim belgelenir. |
| `propofolKcal`, `ivDextroseKcal`, `otherNonNutritionKcal`, `fluidActualMl` | kcal/pencere; mL/pencere | Beslenme dışı enerji, ilaç ve IV sıvı katkıları ayrı kaydedilip toplam enerjiye katılır. Çift sayım engellenir. |
| `uunG24h`, `collectionStart`, `collectionEnd`, `urineVolumeMl`, `collectionComplete` | g N/24 saat; zaman; mL; üç durum | İdrar **üre azotu** analiti açıkça doğrulanır. Protein alımıyla aynı 24 saat kullanılır; kaydırılmış veya eksik pencereyle azot dengesi üretilmez. |
| `drainLossMl`, `fistulaLossMl`, `dialysateNitrogenLossG`, `otherNitrogenLossG`, `bunTrend` | mL/pencere; g N/pencere; seri | Ek kayıplar ve renal/üre havuzu değişimi yöntem uygunluğunu belirler. Ölçülmeyen kayıp sıfır varsayılmaz. |
| `reeKcalDay`, `reeMethod`, `reeMeasuredAt`, `calorimetryConditions` | kcal/gün; cihaz/denklem | İndirekt kalorimetri sonucu ile kestirim ayrıdır. Cihaz koşulları/ölçüm kalite onayı kaydedilir. |

## Hesaplanan göstergeler ve klinisyen onaylı plan

`bmi`, zaman pencereli `weightLossPercent`, `nlr`, `pni`, `conut`, GLIM ölçütleri ve refeeding risk bayrakları kaynak giriş kimlikleri, formül/protokol sürümü ve üretim zamanıyla tutulur. `nitrogenBalanceGDay` yalnız uygun eşzamanlı veriyle yaklaşık değer olarak verilir: gerçek protein/6.25 − (UUN+4). `nitrogenBalanceMethod`, `calculationEligible`, `ineligibilityReasons` ve `uncertaintyNotes` zorunludur. Pozitif/negatif denge, kesin kas sentezi/yıkımı veya tedavi başarısı tanısı yapılmaz.

Plan kaydı: `targetEnergyKcalDay`, `targetProteinGDay`, `targetFluidMlDay`, `weightBasis` (gerçek/kuru/ideal/ayarlanmış), `weightBasisKg`, `guidelineId`, `protocolVersion`, `illnessPhase`, `route`, `startingRateMlHour`, `infusionHours`, `dailyVolumeMl`, `advanceSchedule`, `monitoringPlan`. Bunlar taslak/onaylı/iptal durumlarıyla ayrılır. `approvedBy`, `approvedAt`, `approvalRationale`, `overrideReason` ve önceki sürüm saklanır. Eksik klinik bilgiyle onay durumu taklit edilmez.

Ürün kataloğu kaydı: `formulaId`, `manufacturer`, `brand`, `productName`, `country`, `packVolumeMl`, `energyKcalPer100Ml`, `proteinGPer100Ml`, `carbohydrateGPer100Ml`, `fatGPer100Ml`, `fiberGPer100Ml`, `waterMlPer100Ml`, `sodium/potassium/phosphate/magnesiumPer100Ml`, `osmolality`, `allergens`, `routeSuitability`, `manufacturerSourceUrl`, `labelVersion`, `verifiedAt`, `verifiedBy`. Her mineral kendi açık birimiyle saklanır; bilinmeyen içerik sıfır sayılmaz. Üretici etiketi doğrulanmamış örnek formül gerçek marka önerisi değildir. Plan–ürün eşlemesinde bileşim sürümü kilitlenir; hacim, toplam enerji/protein, sıvı ve elektrolitler yeniden hesaplanır, eksiğin nedeni görünür olur.

## Araştırma sonuçları ve denetim

Sonuçlar tahmin girdilerinden ayrı tabloda tutulur: `outcomeStudyId`, `outcomeVisitId`, 28/90 gün mortalitesi ve izlem tarihi, hastane/YBÜ yatış süresi, enfeksiyon, ventilasyonsuz gün, fonksiyonel sonuç, kas ölçümü değişimi, verilen enerji/protein yeterliliği, klinisyen doğrulamalı refeeding olayı, tolerans ve advers olaylar. Her sonuç için tanım, başlangıç noktası, değerlendiren kişi, körleme ve eksik/kayıp izlem nedeni gerekir. Başlangıç tahmininde gelecekteki sonuç veya tedavi sonrası laboratuvar kullanılmaz.

`auditEventId`, aktör/rol, zaman, kayıt kimliği, işlem, önceki/yeni değer, gerekçe, algoritma ve katalog sürümü izlenir. Türetilmiş sonuçlar orijinal girdiyi değiştirmez. Dışa aktarım sütunları, takma kimlikleme yöntemi, erişim rolü ve onaylı çalışma protokolü kaydedilir. Kaynak PDF/raporların tamamı uygulama veya araştırma veri setine sessizce kopyalanmaz; kimlik bilgisi içeren belgeler kontrollü kaynak sisteminde tutulur.
