// Focused source relationships. Publication counts are not trial/participant totals.
const B=(en,tr)=>({en,tr});
export const LINEAGE_AUDIT_DATE='2026-10-24';
export const trialFamilies={
 'lin-pmv-nct05932134':{
  title:B('Lin PMV · protein, rehabilitation and trunk NMES','Lin PMV · protein, rehabilitasyon ve gövde NMES'),
  registry:{id:'NCT05932134',url:'https://clinicaltrials.gov/study/NCT05932134',access:'official-current-api-raw',historicalVersionsCompared:false,enrollment:{n:100,type:'actual'}},
  parent:{doi:'10.1080/07853890.2026.2728179',url:'https://www.tandfonline.com/doi/full/10.1080/07853890.2026.2728179',access:'original-main-html-tables-and-flow'},
  dates:{firstSubmitted:'2023-04-26',firstSubmissionMeetingQc:'2023-07-05',firstPosted:'2023-07-06',actualStart:'2023-09-18',paperRecruitmentEnd:'2024-09-18',registryActualCompletion:'2025-03-21',resultsFirstPosted:'2025-12-17',resultsOnline:'2026-09-22',resultsIssue:'2026-12'},
  randomizationUnit:'individual-participant',
  protocol:{url:'https://cdn.clinicaltrials.gov/large-docs/34/NCT05932134/Prot_SAP_000.pdf',date:'2022-12-09',uploadDate:'2025-12-10',access:'public-pdf-selected-methods-and-statistics-with-selected-page-visual-check'},
  note:B('Primary ITT includes 100 randomized (30/30/30/10); 91 completed the protocol. Serial measurement Ns are not established by that statement. The 2022 RESULT reference describes a prior observational record analysis, not this randomized parent; exact person overlap is unverified.','Birincil ITT 100 randomize kişiyi (30/30/30/10) içerir; 91 kişi protokolü tamamladı. Bu ifade tüm seri ölçüm sayılarını doğrulamaz. 2022 RESULT atfı önceki gözlemsel kayıt analizini tanımlar; bu randomize ana deney değildir. Kesin kişi örtüşmesi doğrulanmadı.'),
  methodsNote:B('Single-centre stable RCC pilot; age ≥20, ventilation >21 days. Additive arms cannot isolate amino-acid/protein effects. Final paper makes ventilation duration primary; current registry/protocol call it secondary. Posted protocol count/statistical/missing-data descriptions differ internally and from final Methods; historical prespecification remains unverified. Source-defined renal feeding and neurological exclusions are not app rules.','Tek merkezli stabil RCC pilotu; yaş ≥20, ventilasyon >21 gün. Eklemeli kollar aminoasit/protein etkisini ayıramaz. Son makalede ventilasyon süresi birincil; güncel kayıt/protokolde ikincildir. Paylaşılan protokolün sayı/istatistik/eksik veri ifadeleri kendi içinde ve son yöntemle farklıdır; tarihsel önbelirleme doğrulanmadı. Çalışmanın renal beslenme ve nörolojik dışlama tanımları uygulama kuralı değildir.'),
  prespecificationStatus:'current-registry-and-selected-protocol-compared-historical-versions-unreviewed'
 },
 'wulandari-bcaa-nct06167772':{
  title:B('Wulandari · BCAA-enriched nutrition','Wulandari · BCAA ile zenginleştirilmiş beslenme'),
  registry:{id:'NCT06167772',url:'https://clinicaltrials.gov/study/NCT06167772',access:'official-current-api-raw-response',historicalVersionsCompared:false,enrollment:{n:40,type:'actual'},structuredResultsPosted:false,documentSectionAvailable:false},
  parent:{doi:'10.1016/j.clnesp.2025.11.153',url:'https://doi.org/10.1016/j.clnesp.2025.11.153',access:'indexed-original-methods-results-only'},
  studyDesign:'randomized-parallel-as-currently-registered',randomizationUnit:null,
  dates:{firstSubmitted:'2023-12-04',firstSubmissionMeetingQc:'2023-12-04',firstPosted:'2023-12-13',actualStart:'2023-12-14',actualPrimaryCompletion:'2024-05-10',actualCompletion:'2024-05-10',lastRegistryUpdatePosted:'2024-07-23',resultsOnline:'2025-11-29',resultsIssue:'2026-04'},
  note:B('The indexed original registration statement names NCT06167772; the current official registry links the matching DOI as a derived reference. Its 40 actual enrollment does not establish the original randomized count or replace the reported 40 analyzed and 36 muscle observations. Public posting precedes the currently recorded start by one day; archived content and final prespecification remain unread.','İndekslenen özgün kayıt bildirimi NCT06167772\'yi adlandırır; güncel resmî kayıt eşleşen DOI\'yi türetilmiş atıf olarak bağlar. Gerçek katılım 40, ilk randomizasyon sayısını doğrulamaz; bildirilen 40 analiz ve 36 kas gözleminin yerine geçmez. İlk kamu kaydı güncel başlangıçtan bir gün öncedir; arşiv içerik ve son önbelirleme okunmadı.'),
  methodsNote:B('The article is labelled double-blind, the current registry quadruple, while its placebo-comparator category explicitly describes no placebo. The masking procedure remains unresolved. Common NMES and unequal achieved protein/energy prevent an isolated-leucine interpretation. Registry gram wording does not repair the article mg/g inconsistency; nitrogen/protein-to-nonprotein-calorie wording also differs internally. Original main text/flow, supplement, protocol/SAP and history remain unread.','Makale çift, güncel kayıt dört kör olarak etiketlidir; kayıttaki plasebo karşılaştırıcı kategorisinin açıklaması plasebo olmadığını söyler. Körleme yöntemi çözümlenmedi. Ortak NMES ve eşitlenmemiş gerçekleşen protein/enerji, saf lösin yorumu sağlamaz. Kaydın gram ifadeleri makaledeki mg/g tutarsızlığını düzeltmez; azot/protein–protein dışı kalori ifadeleri de kayıt içinde farklıdır. Özgün tam ana metin/akış, ek, protokol/SAP ve geçmiş okunmadı.'),
  prespecificationStatus:'current-public-posting-before-start-historical-content-and-final-analysis-unverified'
 },
 'promob-icu-nct04099108':{
  title:B('ProMob-ICU · additional amino acids and cycling','ProMob-ICU · ek aminoasit ve bisiklet'),
  registry:{id:'NCT04099108',url:'https://clinicaltrials.gov/study/NCT04099108',access:'official-current-api-selected-fields',historicalVersionsCompared:false,enrollment:{n:50,type:'actual'},structuredResultsPosted:false,documentSectionAvailable:false},
  parent:{doi:'10.1002/jpen.70041',url:'https://pmc.ncbi.nlm.nih.gov/articles/PMC12865756/',access:'original-main-methods-results-html-tables-1-3'},
  randomizationUnit:'individual-participant',
  dates:{firstSubmitted:'2019-09-18',firstSubmissionMeetingQc:'2019-09-18',firstPosted:'2019-09-23',actualStart:'2021-05-24',reportedRecruitmentStart:'2021-05',reportedRecruitmentEnd:'2022-09',actualPrimaryCompletion:'2022-09-09',actualCompletion:'2022-12-31',lastRegistryUpdatePosted:'2025-12-03',resultsOnline:'2025-12-31',resultsIssue:'2026-02'},
  protocolLead:{label:'S1 study protocol',fileLabel:'JPEN-50-170-s001.pdf',access:'main-article-link-and-label-only',originalTextReviewed:false,sapVerified:false},
  note:B('Single-centre combined strategy: both arms received nutrition and routine mobilization; additional IV amino acids and cycling were assigned together. Public registration preceded the recorded start. The current registry actual enrollment of 50 does not replace the article\'s 53 randomized participants.','Tek merkezli birleşik strateji: iki kolda beslenme ve rutin mobilizasyon vardı; ek IV aminoasit ve bisiklet birlikte atandı. Kamu kaydı bildirilen başlangıçtan öncedir. Güncel kaydın gerçek 50 katılımı, makaledeki 53 randomize kişinin yerine geçmez.'),
  methodsNote:B('The main article is open-label with selected blinded outcome assessments; the current registry labels outcome-assessor masking. S1/SAP, other supplements, flow image and archived registry versions are unread. Outcome-specific paired/model counts remain unverified. Alpha-allocation and secondary multiplicity statements conflict within the main report; no testing sequence is silently repaired or formal bias grade assigned.','Ana makale açık etiketlidir; seçilmiş sonuç değerlendirmeleri kördür ve güncel kayıt sonuç değerlendiricisi körlüğünü etiketler. S1/SAP, diğer ekler, akış görüntüsü ve arşiv kayıtları okunmadı. Sonuç başına eşleşmiş/model sayıları doğrulanmadı. Ana metindeki alfa dağılımı ve ikincil çoklu karşılaştırma ifadeleri çelişir; test sırası sessizce düzeltilmez ve biçimsel yanlılık puanı verilmez.'),
  prespecificationStatus:'public-study-registration-before-start-final-protocol-sap-history-unreviewed'
 },
 'fradkin-pmv-nct04825717':{
  title:B('PMV calorimetry trial · Fradkin','Uzamış ventilasyonda kalorimetri deneyi · Fradkin'),
  registry:{id:'NCT04825717',url:'https://clinicaltrials.gov/study/NCT04825717',access:'official-current-api',historicalVersionsCompared:false,enrollment:{n:200,type:'estimated'},structuredResultsPosted:false,documentSectionAvailable:false},
  parent:{doi:'10.1186/s13054-026-06272-7',url:'https://link.springer.com/article/10.1186/s13054-026-06272-7',access:'original-main-methods-results-discussion-reference-identity'},
  randomizationUnit:'individual-participant',
  dates:{firstSubmitted:'2021-03-15',firstSubmissionMeetingQc:'2021-03-29',firstPosted:'2021-04-01',actualStart:'2019-12-01',reportedRecruitmentStart:'2019-11',reportedRecruitmentEnd:'2023-04',lastRegistryUpdatePosted:'2023-07-11',resultsPublished:'2026-08-28'},
  protocol:{doi:'10.1016/j.clnesp.2023.01.003',url:'https://doi.org/10.1016/j.clnesp.2023.01.003',year:2023,access:'bibliographic-pointer-only-original-text-unread',originalTextReviewed:false,versionVerified:false,sapVerified:false},
  note:B('Single centre. Public registration in April 2021 follows both the article and registry recruitment starts. The article labels March 15 registration; the API identifies submission, not first public posting. Current estimated enrollment 200 differs from 326 planned, 211 ITT and 198 PP in the article.','Tek merkezlidir. Nisan 2021 kamu kaydı, hem makaledeki hem kayıttaki katılım başlangıcından sonradır. Makale 15 Mart’ı kayıt diye verir; API bunun ilk kamuya açılma değil gönderim olduğunu gösterir. Güncel tahmini 200, makaledeki planlı 326, ITT 211 ve PP 198’den farklıdır.'),
  methodsNote:B('Current registry primaries use eight weeks, whereas the article follows randomized patients up to 120 days. Registered survival clocks after weaning differ from the reported all-cohort/randomization anchor. Registry triple-masking and article double-blind labels retain the unblinded prescribing-dietitian exception. Original protocol/SAP, historical versions, flow image and supplement are unread; no formal outcome-switch or bias grade is assigned.','Güncel kayıt birincil sonuçları sekiz haftalık, makale randomizasyondan 120 güne kadar izler. Kayıttaki ayrılma sonrası sağkalım saatleri, bildirilen tüm kohort/randomizasyon başlangıcından farklıdır. Kayıt üçlü ve makale çift kör etiketleri, reçeteleyen diyetisyenin kör olmaması istisnasıyla birlikte korunur. Özgün protokol/SAP, tarihsel sürümler, akış görüntüsü ve ek okunmadı; biçimsel sonuç değişikliği veya yanlılık puanı hükmü verilmedi.'),
  prespecificationStatus:'public-registration-after-recruitment-original-protocol-history-unreviewed'
 },
 'epic-nct05124860':{
  title:B('EPIC · longitudinal calorimetry cohort','EPIC · seri kalorimetri kohortu'),
  registry:{id:'NCT05124860',url:'https://clinicaltrials.gov/study/NCT05124860',access:'official-current-api',historicalVersionsCompared:false,enrollment:{n:714,type:'actual'}},
  studyDesign:'observational-prospective-cohort',randomizationUnit:null,
  parent:{doi:'10.1186/s13054-026-06102-w',url:'https://link.springer.com/article/10.1186/s13054-026-06102-w',access:'original-main-methods-results-discussion'},
  reportLabel:B('Observational report','Gözlemsel yayın'),
  dates:{firstSubmitted:'2021-10-25',firstSubmissionMeetingQc:'2021-11-15',firstPosted:'2021-11-18',actualStart:'2022-02-21',reportedStart:'2022-01',reportedEnd:'2024-05',actualPrimaryCompletion:'2024-07-18',actualCompletion:'2025-03-21'},
  protocol:{url:'https://cdn.clinicaltrials.gov/large-docs/60/NCT05124860/Prot_SAP_002.pdf',access:'original-combined-protocol-sap-selected-sections',protocolUpdated:'2022-02-21',sapUpdated:'2025-04-08',uploadedDate:'2025-04-09',historicalVersionsCompared:false,analysisLockChronologyVerified:false},
  note:B('Prospective study registration precedes recruitment; the paper uses the QC date, not the first public posting. Current enrollment 714 and the prolonged-stay report 433 are different denominators. An Australian subset overlaps TARGET Protein; the overlap count remains unknown.','Prospektif çalışma kaydı katılım başlangıcından öncedir; makale ilk kamuya açılma yerine kalite kontrol tarihini kullanır. Güncel kayıttaki 714 ile uzamış yatış yayınındaki 433 farklı paydalardır. Avustralya alt grubu TARGET Protein ile örtüşür; örtüşen kişi sayısı bilinmiyor.'),
  methodsNote:B('The available combined document separates the 2022 protocol from the April 2025 SAP; database-lock timing and earlier versions remain unverified. Protocol one-third versus reported 25% excess-weight normalization, planned K-means/DTW versus exploratory LCA, and >10 versus ≥10 days remain explicit differences. Nutrition recorded as hourly rates ×24 is not verified cumulative 24-hour delivery. Supplement tables were structurally inspected, not fully rendered.','Mevcut birleşik belge 2022 protokolünü Nisan 2025 SAP’den ayırır; veri kilidi zamanı ve eski sürümler doğrulanmadı. Protokolde fazla ağırlığın üçte biri ile yayında %25’i, planlanan K-means/DTW ile keşifsel LCA ve >10 ile ≥10 gün farklılıkları korunur. Saatlik hız ×24 olarak kaydedilen beslenme, doğrulanmış toplam 24 saatlik alım değildir. Ek tablolar yapısal olarak incelendi; tam görsel sayfa denetimi yapılmadı.'),
  prespecificationStatus:'study-registered-before-recruitment-final-analysis-history-unverified'
 },
 'excel-nutrition-actrn12623000304639':{
  title:B('ECMO-Nutrition · EXCEL-linked substudy','ECMO-Nutrition · EXCEL bağlantılı alt çalışma'),
  registry:{id:'ACTRN12623000304639',url:'https://www.anzctr.org.au/Trial/Registration/TrialReview.aspx?ACTRN=12623000304639',access:'official-current-record',historicalVersionsCompared:false,enrollment:{target:150,final:150}},
  studyDesign:'observational-prospective-registry-linked-cohort',randomizationUnit:null,
  parent:{doi:'10.1016/j.nut.2026.113244',url:'https://pubmed.ncbi.nlm.nih.gov/42172821/',access:'original-abstract-and-indexed-publisher-passages'},
  reportLabel:B('Nutrition substudy report','Beslenme alt çalışması yayını'),
  platform:{name:'EXCEL',url:'https://www.monash.edu/medicine/sphpm/registries/excel',exactCrossReportOverlapVerified:false},
  dates:{submitted:'2023-03-02',registered:'2023-03-17',actualStart:'2022-06-09',actualLastEnrollment:'2023-07-09',actualLastDataCollection:'2023-08-04',resultsProvided:'2026-06-23'},
  registrationTiming:'retrospectively-registered',
  note:B('Prospectively collected observations were retrospectively registered. ECMO-Nutrition is linked to the separate EXCEL registry platform; it is not a randomized nutrition trial or all EXCEL participants. Current registry 150 versus reported 147 and institutional nine versus reported ten sites remain unresolved.','Prospektif toplanan gözlemler geriye dönük kaydedilmiştir. ECMO-Nutrition ayrı EXCEL kayıt platformuna bağlıdır; randomize beslenme deneyi veya tüm EXCEL katılımcıları değildir. Güncel kayıttaki 150 ile yayındaki 147 ve kurum sayfasındaki dokuz ile bildirilen on merkez farkı çözümlenmedi.'),
  methodsNote:B('Registration permits age ≥16; the published cohort minimum age and an isolated ≥18 subset were not verified. Ward data for 37 do not identify all eligible survivors or a follow-up completeness rate. Full published Methods, flow and SAP were inaccessible. Planned six-month and historical-cohort questions are not verified additional results or causal nutrient effects.','Kayıt ≥16 yaşa izin verir; yayımlanan örneklemin en küçük yaşı ve ayrı bir ≥18 alt grubu doğrulanmadı. Servis verisi bulunan 37 kişi, uygun tüm sağ kalanları veya izlem tamlık oranını göstermez. Yayımlanmış tam yöntem, akış ve SAP’ye erişilemedi. Planlanan altı aylık ve tarihsel kohort soruları doğrulanmış ek sonuçlar veya nedensel besin etkileri değildir.'),
  prespecificationStatus:'retrospective-registration-current-record-only'
 },
 'engine-aki-nct06238674':{
  title:B('ENGINE · combined AKI nutrition strategy','ENGINE · AKI’de birleşik beslenme stratejisi'),
  registry:{id:'NCT06238674',url:'https://clinicaltrials.gov/study/NCT06238674',access:'official-current-api',historicalVersionsCompared:false},
  parent:{doi:'10.1038/s41598-025-97443-z',url:'https://www.nature.com/articles/s41598-025-97443-z',access:'indexed-original-methods'},
  dates:{firstSubmitted:'2024-01-07',firstPosted:'2024-02-02',actualStart:'2023-03-07',reportedStudyStart:'2023-02-04',reportedStudyEnd:'2024-01-30'},
  randomizationUnit:'individual-participant',
  registrationTiming:'first-public-posting-after-reported-conduct',
  note:B('The parent randomized strategy combined indirect-calorimetry energy guidance and nitrogen-balance-guided protein versus usual care. The 2026 achieved-intake association is not the randomized treatment contrast. Public registration followed the reported study interval.','Ana randomize strateji, indirekt kalorimetriyle enerji ve azot dengesiyle protein rehberliğini olağan bakımla karşılaştırır. 2026’daki gerçekleşen alım ilişkisi randomize tedavi karşılaştırması değildir. Kamuya açık kayıt, bildirilen çalışma döneminden sonradır.'),
  methodsNote:B('The paper starts on 4 February 2023; the current registry starts on 7 March 2023. The discrepancy is unresolved. Exact PCR coefficients, weight normalization and renal kinetic handling remain unverified; the parent refers to unread Supplementary Fig. 1S. Access was indexed original passages and current registry/reference metadata, not complete 2026 full text or a dated SAP. Author-reported prespecification was not independently verified.','Makale 4 Şubat 2023, güncel kayıt 7 Mart 2023 başlangıcı verir; fark çözümlenmedi. PCR katsayıları, ağırlıkla normalizasyon ve renal kinetik işleme doğrulanmadı; ana yayın okunmamış Ek Şekil 1S’ye yönlendirir. İndekslenen özgün bölümler ve güncel kayıt/kaynakça metadatası okundu; 2026 tam metni veya tarihli SAP tam incelenmedi. Yazarın önbelirleme beyanı bağımsız doğrulanmadı.'),
  prespecificationStatus:'author-reported-posthoc-prespecification-not-independently-verified'
 },
 'proms-actrn12620000776909':{
  title:B('PROMS · acute muscle protein synthesis','PROMS · akut kas protein sentezi'),
  registry:{id:'ACTRN12620000776909',url:'https://www.anzctr.org.au/Trial/Registration/TrialReview.aspx?ACTRN=12620000776909',access:'official-current-record',historicalVersionsCompared:false,enrollment:{target:20,final:20}},
  parent:{doi:'10.1093/ajrccm/aamag086',url:'https://academic.oup.com/ajrccm/article/212/5/964/8496139',access:'indexed-original-methods-results'},
  dates:{submitted:'2020-06-12',registered:'2020-07-30',actualStart:'2020-11-03',actualLastEnrollment:'2022-10-28',lastUpdated:'2023-01-10'},
  randomizationUnit:'individual-participant',
  protocolLead:{url:'https://digital.library.adelaide.edu.au/dspace/handle/2440/136600',access:'metadata-and-indexed-contents-only',finalProtocolVerified:false},
  note:B('The original report distinguishes 29 randomized, 21 completed and 20 analyzed; the current registry lists 20 as the final sample. These are different denominators, not extra cohorts. A six-hour muscle fractional-synthesis response to one whey exposure does not measure whole-body net protein balance or validate a daily individual protein target.','Özgün yayın 29 randomize, 21 tamamlayan ve 20 analiz edilen kişiyi ayırır; güncel kayıtta son örneklem 20’dir. Bunlar farklı paydalardır, ek kohort değildir. Tek whey maruziyetine altı saatlik kas fraksiyonel sentez yanıtı, tüm vücut net protein dengesini ölçmez ve günlük bireysel protein hedefini doğrulamaz.'),
  methodsNote:B('Indexed Methods report that registered whole-body breakdown/balance outcomes were not analyzed, with complete-case analysis and no prepublished SAP. A within-arm comparison was added at completion before analysis. The thesis is only a protocol lead: chapter text, final supplement/SAP and historical registry amendments were not reviewed. Current registration does not establish every analysis as prospectively specified.','İndekslenen yöntem, kaydedilmiş tüm vücut yıkım/denge sonuçlarının analiz edilmediğini, tam olgu analizini ve önceden yayımlanmış SAP olmadığını bildirir. Grup içi karşılaştırma çalışma tamamlanınca, analiz öncesinde eklenmiştir. Tez yalnız protokol için bir ipucudur; bölüm metni, son ek/SAP ve tarihsel kayıt değişiklikleri incelenmedi. Güncel kayıt, her analizin prospektif belirlendiğini kanıtlamaz.'),
  prespecificationStatus:'current-registration-read-final-sap-and-history-unreviewed'
 },
 'nexis-nct03021902':{
  title:B('NEXIS · combined amino acids and cycling','NEXIS · amino asit ve bisiklet birlikte'),
  registry:{id:'NCT03021902',url:'https://clinicaltrials.gov/study/NCT03021902',access:'official-current-api'},
  parent:{doi:'10.1093/ajrccm/aamag287',url:'https://pubmed.ncbi.nlm.nih.gov/42438140/'},
  dates:{firstSubmitted:'2016-12-21',firstPosted:'2017-01-16',firstPostDateType:'ESTIMATED',actualStart:'2017-09-28'},
  randomizationUnit:'individual-participant',
  protocol:{url:'https://bmjopen.bmj.com/content/9/7/e027893',doi:'10.1136/bmjopen-2018-027893',year:2019,access:'indexed-original-passages'},
  populationScopeBasis:'current-registry-not-verified-final-cohort',
  note:B('Individual randomized phase 2 trial; amino acids and cycling were combined. The protocol and registry do not add new participants. Original result access remains abstract-only.','Bireysel randomize faz 2 deney; amino asit ve bisiklet birlikte verildi. Protokol ve kayıt yeni katılımcı eklemez. Özgün sonuca erişim özet düzeyindedir.'),
  methodsNote:B('Current registry excludes primary neuromuscular disease, intracranial/spinal motor disorders, airway-protection-only ventilation and AKI without RRT. These are not verified final-cohort counts. Protocol access was indexed passages; complete final methods/SAP and historical amendments remain unreviewed.','Güncel kayıt primer nöromüsküler hastalığı, intrakraniyal/spinal motor süreçleri, yalnız havayolu koruması için ventilasyonu ve KRT olmadan AKI’yi dışlar. Bunlar doğrulanmış son analiz kohortu sayıları değildir. Protokolün indekslenen bölümleri okundu; tam son yöntem/SAP ve tarihsel değişiklikler incelenmedi.'),
  prespecificationStatus:'historical-comparison-and-final-sap-incomplete'
 },
 'hmb-icu-ch-nct03628365':{
  title:B('Lausanne HMB-ICU-CH','Lausanne HMB-ICU-CH'),
  registry:{id:'NCT03628365',url:'https://clinicaltrials.gov/study/NCT03628365',access:'official-current-api'},
  parent:{doi:'10.1016/j.clnu.2021.07.018',url:'https://pubmed.ncbi.nlm.nih.gov/34358832/'},
  dates:{firstSubmitted:'2018-08-07',firstPosted:'2018-08-14',actualStart:'2018-09-17'},
  randomizationUnit:'individual-participant',
  note:B('The 2026 biochemical report reuses the Lausanne trial; it is not a new randomization. Parent enrollment was 37, with 30 completing day-15 tests. These denominators are not added together.','2026 biyokimyasal raporu Lausanne deneyini yeniden kullanır; yeni randomizasyon değildir. Ana kayıtta 37 katılım, 15. gün testlerini tamamlayan 30 kişi vardır. Bu paydalar toplanmaz.'),
  methodsNote:B('The reported UCR analyte/unit basis, contrast CI and per-analyte denominators were not verified from the original tables. It cannot be overlaid on this app’s urea/creatinine or BUN/creatinine output. Full text and prespecification remain incompletely reviewed.','Bildirilen UCR’nin analit/birim temeli, karşılaştırma güven aralığı ve analit başına paydalar özgün tablolardan doğrulanmadı. Uygulamanın üre/kreatinin veya BUN/kreatinin çıktısına bindirilemez. Tam metin ve önbelirleme incelemesi eksiktir.'),
  prespecificationStatus:'secondary-analysis-prespecification-not-established'
 },
 'hmb-rt-chictr2200057685':{
  title:B('Fujian HMB and resistance training','Fujian HMB ve direnç egzersizi'),
  registry:{id:'ChiCTR2200057685',url:'https://www.chictr.org.cn/hvshowproject.html?id=202250&v=1.1',access:'indexed-official-record'},
  parent:{doi:'10.1186/s13054-025-05660-9',url:'https://link.springer.com/article/10.1186/s13054-025-05660-9'},
  dates:{registered:'2022-03-15'},
  randomizationUnit:'individual-four-arm-factorial',
  note:B('10 ICUs in 5 hospitals. The expanded 266-person report includes 112 participants from the earlier report under the same protocol/registration; do not count 378 independent participants. This is distinct from Lausanne HMB-ICU-CH.','5 hastanede 10 YBÜ. Genişletilmiş 266 kişilik yayın aynı protokol/kayıttaki önceki 112 kişiyi içerir; 378 bağımsız katılımcı sayılmaz. Lausanne HMB-ICU-CH’den ayrıdır.'),
  methodsNote:B('The original papers explicitly identify the registration and overlap. The official registry was available as indexed text only; its full history and the protocol amendment chronology were not appraised.','Özgün yayınlar kayıt numarasını ve örtüşmeyi açıkça belirtir. Resmî kayda yalnız indekslenen metinle erişildi; tam kayıt geçmişi ve protokol değişikliği kronolojisi değerlendirilmedi.'),
  prespecificationStatus:'expanded-report-amendment-chronology-incomplete'
 },
 'precise-nct04633421':{
  title:B('PRECISe · individual randomization','PRECISe · bireysel randomizasyon'),
  registry:{id:'NCT04633421',url:'https://clinicaltrials.gov/study/NCT04633421'},
  parent:{doi:'10.1016/S0140-6736(24)01304-7',url:'https://doi.org/10.1016/S0140-6736(24)01304-7'},
  dates:{firstSubmitted:'2020-10-23',firstPosted:'2020-11-18',actualStart:'2020-11-19'},
  randomizationUnit:'individual-participant',
  protocol:{url:'https://link.springer.com/article/10.1186/s13063-023-07380-3',publishedDate:'2023-06-19',access:'original-full-text'},
  sap:{url:'https://cdn.clinicaltrials.gov/large-docs/21/NCT04633421/SAP_000.pdf',version:'1.0',coverMonth:'2023-11',registryDocumentDate:'2023-11-30',uploadedDate:'2024-01-14',signatureDates:['2024-01-12','2024-01-14'],access:'original-pdf-relevant-sections'},
  note:B('Two treatment groups; individual, centre-stratified randomization. The published protocol followed recruitment start. Registry, protocol and SAP dates do not independently establish when every analysis was prespecified.','İki tedavi grubu; merkezle tabakalanmış bireysel randomizasyon. Yayımlanan protokol katılım başlangıcından sonradır. Kayıt, protokol ve SAP tarihleri her analizin ne zaman önceden belirlendiğini bağımsız olarak kanıtlamaz.'),
  methodsNote:B('Follow-up anchor differs: ICU admission in the protocol/SAP/current registry versus randomization in the results paper. This remains unresolved; it is not labelled a proven outcome switch.','İzlem başlangıcı farklıdır: protokol/SAP/güncel kayıtta YBÜ yatışı, sonuç yayınında randomizasyon. Fark çözümlenmedi; kanıtlanmış sonlanım değişikliği olarak etiketlenmez.'),
  prespecificationStatus:'documents-identified-historical-comparison-incomplete'
 },
 'target-protein-actrn12621001484831':{
  title:B('TARGET Protein · ICU cluster sequence','TARGET Protein · YBÜ küme sırası'),
  registry:{id:'ACTRN12621001484831',url:'https://www.anzctr.org.au/Trial/Registration/TrialReview.aspx?ACTRN=12621001484831'},
  parent:{doi:'10.1001/jama.2025.9110',url:'https://jamanetwork.com/journals/jama/fullarticle/2835302'},
  dates:{submitted:'2021-09-23',registered:'2021-11-01',recruitmentStart:'2022-05-23',recruitmentEnd:'2023-08-23'},
  randomizationUnit:'icu-cluster-treatment-sequence',
  protocol:{url:'https://doi.org/10.1016/j.ccrj.2023.08.001',year:2023,access:'indexed-original-methods'},
  sap:{url:'https://link.springer.com/article/10.1186/s13063-025-08759-0',receivedDate:'2024-08-01',publishedDate:'2025-02-06',supersedesEarlierPlan:true,access:'original-full-text'},
  note:B('Eight ICU clusters, four treatment periods. Patients keep their original formula across period changes; this is not a within-patient crossover. Distinct from the earlier TARGET energy trial.','Sekiz YBÜ kümesi, dört tedavi dönemi. Hasta dönem değişiminde ilk formülünü sürdürür; hasta içi çapraz geçiş değildir. Önceki TARGET enerji deneyinden ayrıdır.'),
  methodsNote:B('The published SAP explicitly supersedes the protocol/registry analysis plan. Registry GEE and the revised quantile mixed model are separate versions. Enrollment counts (3412 registry; 3411 enrolled/3397 analyzed in results) and final follow-up dates differ; no reconciliation is inferred.','Yayımlanan SAP önceki protokol/kayıt analiz planının yerini açıkça alır. Kayıttaki GEE ile revize kantil karma model ayrı sürümlerdir. Katılım sayısı (kayıt3412; sonuçlarda3411 katılım/3397 analiz) ve son izlem tarihi farklıdır; açıklama uydurulmaz.'),
  prespecificationStatus:'revised-sap-identified-historical-comparison-incomplete'
 },
 'effort-ward-nct02517476':{
  title:B('EFFORT · medical ward','EFFORT · dahili servis'),
  registry:{id:'NCT02517476',url:'https://clinicaltrials.gov/study/NCT02517476'},
  parent:{doi:'10.1016/S0140-6736(18)32776-4',url:'https://pubmed.ncbi.nlm.nih.gov/31030981/'},
  dates:{actualStart:'2014-04',firstSubmitted:'2015-07-30',firstPosted:'2015-08-07'},
  note:B('Distinct from EFFORT Protein. Registry first posting follows recorded recruitment start; prospective registration is not assumed.','EFFORT Protein’den ayrıdır. Kayıttaki ilk yayımlanma, kayıtlı başlangıçtan sonradır; prospektif kayıt varsayılmaz.')
 },
 'effort-protein-nct03160547':{
  title:B('EFFORT Protein · ICU','EFFORT Protein · YBÜ'),
  registry:{id:'NCT03160547',url:'https://clinicaltrials.gov/study/NCT03160547'},
  parent:{doi:'10.1016/S0140-6736(22)02469-2',url:'https://pubmed.ncbi.nlm.nih.gov/36708732/'},
  dates:{actualStart:'2017-11-21',firstSubmitted:'2017-05-17',firstPosted:'2017-05-19'},
  note:B('Different population/intervention from ward EFFORT. Registry start and published recruitment dates differ; no explanation is inferred.','Servis EFFORT’tan farklı popülasyon/müdahaledir. Kayıt başlangıcı ile yayımlanan katılım tarihleri farklıdır; neden uydurulmaz.')
 },
 'need-isrctn12233792':{
  title:B('NEED · ICU feeding-guideline implementation','NEED · YBÜ beslenme kılavuzu uygulaması'),
  registry:{id:'ISRCTN12233792',url:'https://www.isrctn.com/ISRCTN12233792'},
  parent:{doi:'10.1186/s13054-022-03921-5',url:'https://link.springer.com/article/10.1186/s13054-022-03921-5'},
  dates:{registration:'2017-11-24',enrollment:'2018-03-26'},
  note:B('Registry export and age paper say 24 November 2017; the parent abstract says 20 November. The discrepancy is retained, not silently reconciled.','Kayıt dışa aktarımı ve yaş makalesi 24 Kasım 2017, ana özet 20 Kasım der. Fark korunur; sessizce eşitlenmez.')
 }
};
const records={
 'lin-pmv-2026':{
  auditDate:'2026-10-26',familyId:'lin-pmv-nct05932134',linkStatus:'verified',
  analysisRole:B('Parent pilot randomized combined-intervention report','Birleşik müdahaleli ana pilot randomize yayın'),
  reportsParentRandomization:true,randomizedExposureForQuestion:true,
  participantCounts:{assessed:195,ineligible:66,declined:29,randomized:100,randomizedArms:{highProtein:30,highProteinRehabilitation:30,highProteinRehabilitationNmes:30,usualCare:10},completed:91,earlyWithdrawals:9,withdrawalsByArm:{highProtein:4,highProteinRehabilitation:2,highProteinRehabilitationNmes:1,usualCare:2},primaryITT:100},
  outcomeDenominators:{primaryAsReported:{highProtein:30,highProteinRehabilitation:30,highProteinRehabilitationNmes:30,usualCare:10},serialNutritionAndFunctionMeasuredNs:null},
  outcomeScope:{weaningSuccess:'five-consecutive-ventilator-free-days',ventilationDuration:{paperHierarchy:'primary',registryProtocolHierarchy:'secondary',exactClockReconciled:false},treatmentEffectCi:null,independentAnabolicStateValidated:false,individualProteinTargetValidated:false},
  analysisContrast:'assigned-additive-package-not-isolated-amino-acid-or-factorial-effect',
  nutrientExposure:{studyTarget:{protein:1.5,unit:'g/kg/day',weightBasis:'ideal-body-weight'},deliveredProteinGroupMeans:[1.4,1.5,1.4,1.2],nitrogenMethod:'EN-protein-g/6.25-(24h-UUN-g-N+4)',dialysisLossHandlingVerified:false},
  relatedPublications:[{pmid:'36297079',doi:'10.3390/nu14204395',registryReferenceType:'RESULT',role:'prior-observational-record-analysis-cited-for-RCC-weaning-protocol',participantOverlapVerified:false}],
  participantOverlap:B('100 randomized and 91 completers are one cohort, not 191 people. Figure 1 and final Methods retain 100 in primary ITT analyses; no complete-case count is invented for serial measurements. Prior 2022 observational records and this trial are not merged or summed.','100 randomize ve 91 tamamlayan aynı kohorttur; 191 kişi değildir. Şekil 1 ve son yöntem birincil ITT’de 100 kişiyi korur; seri ölçümler için tam olgu sayısı uydurulmaz. Önceki 2022 gözlemsel kayıtları bu deneyle birleştirilmez/toplanmaz.'),
  sourceUrls:['https://www.tandfonline.com/doi/full/10.1080/07853890.2026.2728179','https://clinicaltrials.gov/api/v2/studies/NCT05932134','https://cdn.clinicaltrials.gov/large-docs/34/NCT05932134/Prot_SAP_000.pdf','https://pubmed.ncbi.nlm.nih.gov/36297079/'],
  basis:B('Original main Methods/Results, Tables 1/2 and complete Figure 1 were inspected through the normal public publisher DOI route; no CAPTCHA was solved. Current official API and selected public protocol pages supply separate source-qualified fields. The prior 2022 original abstract reports 172 observational records from 2020–2022, not a randomized parent. This does not establish every historical amendment or independent-patient total.','Özgün ana yöntem/sonuçlar, Tablo 1/2 ve tam Şekil 1 normal kamuya açık yayıncı DOI yolundan incelendi; CAPTCHA çözülmedi. Güncel resmî API ve seçilmiş kamu protokol sayfaları ayrı kaynak nitelikli alanlar sağlar. Önceki 2022 özgün özeti 2020–2022 döneminden 172 gözlemsel kaydı bildirir; randomize ana deney değildir. Her tarihsel değişiklik veya benzersiz kişi toplamı doğrulanmış sayılmaz.')
 },
 'wulandari-icu-bcaa-print-2026':{
  auditDate:'2026-10-26',familyId:'wulandari-bcaa-nct06167772',linkStatus:'indexed-original-registration-corroborated-by-current-registry',
  analysisRole:B('Reported randomized BCAA-enriched nutritional strategy; original flow unverified','Bildirilen randomize BCAA ile zenginleştirilmiş beslenme stratejisi; özgün akış doğrulanmadı'),
  reportsParentRandomization:true,randomizedExposureForQuestion:true,
  randomizedExposureScope:'supplemented-nutrition-versus-standard-nutrition-with-common-NMES',isolatedLeucineEffectRandomized:false,
  participantCounts:{randomized:null,randomizedArms:null,reportedAnalyzed:40,reportedMuscleThicknessN:36,reportedAttritionPercent:33,currentRegistryActual:40},
  outcomeDenominators:{perArmAndTime:null,lossReasonsAndTiming:null,analysisPopulationDefinition:null},
  interventionVerification:{articleMgGramConflictResolved:false,actualRouteSpecificDoseVerified:false,individualDoseValidated:false},
  participantOverlap:B('One existing report and registry association, not another trial or 80 independent patients. Analyzed 40, muscle N36 and current enrollment 40 are separately sourced quantities. Randomized N, allocated arm counts, loss flow and cross-report overlap remain unknown; do not reverse-calculate from 33% reported losses.','Mevcut tek yayın ile kayıt ilişkisi vardır; ek deney veya 80 bağımsız hasta değildir. Analiz 40, kas N36 ve güncel katılım 40 ayrı kaynaklı sayılardır. Randomize N, ilk kol sayıları, kayıp akışı ve yayınlar arası örtüşme bilinmiyor; bildirilen %33 kayıptan ters hesap yapılmaz.'),
  sourceUrls:['https://doi.org/10.1016/j.clnesp.2025.11.153','https://clinicaltrials.gov/api/v2/studies/NCT06167772'],
  basis:B('Original access remains indexed Methods/Results and registration text. A fresh authorized VETIS search recognized institutional access and found one exact-DOI result, but article navigation was rejected by browser security policy; no bypass or full-text claim followed. The current official API was directly archived on 26 October. Current registry labels are not a read original flow, dated SAP or historical outcome comparison.','Özgün erişim indekslenen yöntem/sonuç ve kayıt metni düzeyindedir. Yeni yetkili VETİS araması kurum erişimini tanıdı ve DOI için tek sonuç verdi; makaleye geçiş tarayıcı güvenlik denetimince reddedildi. Erişim aşılmadı ve tam metin okunmuş sayılmadı. Güncel resmî API 26 Ekim\'de doğrudan arşivlendi. Güncel kayıt etiketleri okunmuş özgün akış, tarihli SAP veya tarihsel sonuç karşılaştırması değildir.')
 },
 'veldsman-icu-aa-mobilization-print-2026':{
  auditDate:'2026-10-26',familyId:'promob-icu-nct04099108',linkStatus:'verified',
  analysisRole:B('Original randomized combined AA-plus-cycling strategy report','Özgün randomize AA ve bisiklet birleşik strateji yayını'),
  reportsParentRandomization:true,randomizedExposureForQuestion:true,
  randomizedExposureScope:'additional-iv-amino-acids-and-cycling-over-nutrition-and-routine-mobilization',isolatedAminoAcidEffectRandomized:false,
  participantCounts:{screened:649,eligibleApproached:71,randomized:53,randomizedArms:null,modifiedITT:50,modifiedITTArms:{standardCare:25,intervention:25},excludedAfterRandomization:3,earlyDeaths:2,consentWithdrawals:1,exclusionArmAttribution:null,currentRegistryActual:50},
  outcomeDenominators:{biopsyPairedByArm:null,ultrasoundPairedByArm:null,secondaryModels:null},
  outcomeScope:{primaryMeasurements:['VL-biopsy-myofiber-CSA','RF-ultrasound-CSA'],reportedAveragePreIcuDay:2,reportedAveragePostIcuDay:8,individualMatchedTimesVerified:false,isolatedAminoAcidBenefitValidated:false,metabolicClassifierValidated:false,individualDoseValidated:false},
  relatedReports:[{doi:'10.1016/j.clnesp.2024.11.009',relation:'explicit-same-cohort-energy-expenditure-report',originalTextReviewed:false,participantOverlapCount:null}],
  participantOverlap:B('One ProMob-ICU trial, distinct from NEXIS. The main report identifies the earlier energy-expenditure publication as this cohort; it does not add independent participants. Fifty mITT participants (25/25) follow 53 randomized, with two early deaths and one consent withdrawal. Original randomized arm counts and outcome-specific Ns remain unknown.','NEXIS\'ten ayrı tek ProMob-ICU deneyidir. Ana metin önceki enerji harcaması yayınını bu kohort diye tanımlar; ek bağımsız katılımcı oluşturmaz. 53 randomize kişiden iki erken ölüm ve bir onam çekilmesi sonrası 50 mITT (25/25) vardır. İlk randomizasyon kol sayıları ve sonuç başına ölçüm sayıları bilinmiyor.'),
  sourceUrls:['https://pmc.ncbi.nlm.nih.gov/articles/PMC12865756/','https://clinicaltrials.gov/api/v2/studies/NCT04099108','https://doi.org/10.1016/j.clnesp.2024.11.009'],
  basis:B('Original main Methods name ProMob-ICU/NCT04099108; the current official registry corroborates identity and prospective study-registration chronology. The same-cohort EE report is a verified citation, not a separately read original. Average day-2/day-8 primary measurements are distinct from the intervention-only three-timepoint plasma-AA secondary question. Main Tables 1–3 were reviewed; supplement/SAP/history and flow image were not. Arm/time mean CIs are not reconstructed as treatment-effect CIs.','Özgün ana yöntem ProMob-ICU/NCT04099108\'i adlandırır; güncel resmî kayıt kimliği ve prospektif çalışma kaydı kronolojisini destekler. Aynı kohortun EE yayını doğrulanmış atıftır; özgün metni ayrıca okunmadı. Ortalama 2./8. gün birincil ölçümler, yalnız müdahale kolunun üç zamanlı plazma AA ikincil sorusundan ayrıdır. Ana Tablo 1–3 incelendi; ek/SAP/geçmiş ve akış görüntüsü okunmadı. Kol/zaman ortalama GA\'larından tedavi etkisi GA\'sı türetilmez.')
 },
 'fradkin-calorimetry-pmv-rct-2026':{
  auditDate:'2026-10-26',familyId:'fradkin-pmv-nct04825717',linkStatus:'verified',
  analysisRole:B('Original randomized nutrition-target strategy report; achieved-energy association is separate','Özgün randomize beslenme hedefi stratejisi yayını; gerçekleşen enerji ilişkisi ayrıdır'),
  reportsParentRandomization:true,randomizedExposureForQuestion:true,
  participantCounts:{randomized:211,calorimetryArm:111,controlArm:100,planned:326,perProtocol:198,reportedNamedWithdrawals:3,weaningTimeSummarySuccessfulParticipants:118},
  analysisContrast:{primary:'randomized-target-strategy',achievedEnergyAssociation:'post-hoc-nonrandom-per-protocol'},
  followupAnchors:{registryPrimaryWeeks:8,reportedMaximumDaysFromRandomization:120,reportedWeaningTimeSummaryPopulation:'successful-weaners-only',registrySurvival:'post-weaning-selected-successful-participants',articleThreeMonthSurvival:'randomization-all-ITT',reconciled:false},
  participantOverlap:B('One trial: protocol and final report do not add independent participants. The 198 PP observations and 118 successful-weaner time summaries are selected analyses, not new cohorts. Three named withdrawals do not explain the entire 211-to-198 difference; do not reconstruct the unread flow.','Tek deneydir: protokol ve sonuç yayını bağımsız katılımcı eklemez. 198 PP ve başarılı ayrılan 118 kişinin süre özetleri seçilmiş analizlerdir, yeni kohort değildir. Adlandırılan üç çekilme 211–198 farkının tümünü açıklamaz; okunmamış akış yeniden kurulmaz.'),
  sourceUrls:['https://link.springer.com/article/10.1186/s13054-026-06272-7','https://clinicaltrials.gov/api/v2/studies/NCT04825717','https://doi.org/10.1016/j.clnesp.2023.01.003'],
  basis:B('Original main text names NCT04825717; the current official registry independently links both the 2026 results and 2023 protocol publications. Protocol identity is bibliographic only; original content/SAP and archived prespecification were not read. A calorimetry-based versus Schofield-based energy target is randomized; both arms underwent weekly calorimetry. Selected achieved-energy gaps are not randomized.','Özgün ana metin NCT04825717’yi adlandırır; güncel resmî kayıt 2026 sonuç ve 2023 protokol yayınlarını bağımsız olarak bağlar. Protokol kimliği yalnız bibliyografiktir; özgün içerik/SAP ve arşiv önbelirlemesi okunmadı. Kalorimetriye dayalı enerji hedefi ile Schofield’e dayalı hedef randomize karşılaştırılmıştır; iki kolda da haftalık kalorimetri yapılmıştır. Seçilmiş gerçekleşen enerji farkları randomize değildir.')
 },
 'persistent-critical-illness-ee-2026':{
  auditDate:'2026-10-25',familyId:'epic-nct05124860',linkStatus:'verified',
  analysisRole:B('Longitudinal observational energy-expenditure report','Seri gözlemsel enerji harcaması yayını'),
  reportsParentRandomization:false,randomizedExposureForQuestion:false,
  participantCounts:{reportedPatients:433,reportedMeasurements:1194,adjustedModelPatients:393,adjustedModelObservations:1003,exploratoryLcaPatients:269,regionalAustralianPatients:138,regionalAustralianMeasurements:394},
  relatedStudies:[{familyId:'target-protein-actrn12621001484831',relation:'explicit-partial-participant-overlap',overlapCount:null}],
  participantOverlap:B('An Australian subset is explicitly reported to overlap TARGET Protein, but its size is not identified. Regional totals of 138 patients/394 measurements are not the overlap count. Do not add EPIC and TARGET samples as unique participants; repeated measurements are not additional people.','Avustralya alt grubunun TARGET Protein ile örtüştüğü açıkça bildirilir; büyüklüğü verilmez. Bölgesel 138 hasta/394 ölçüm, örtüşen kişi sayısı değildir. EPIC ile TARGET örneklemleri benzersiz kişi olarak toplanmaz; tekrarlı ölçümler ek hasta değildir.'),
  sourceUrls:['https://link.springer.com/article/10.1186/s13054-026-06102-w','https://clinicaltrials.gov/api/v2/studies/NCT05124860','https://cdn.clinicaltrials.gov/large-docs/60/NCT05124860/Prot_SAP_002.pdf','https://media.springernature.com/original/springer-static/esm/art%3A10.1186%2Fs13054-026-06102-w/MediaObjects/13054_2026_6102_MOESM1_ESM.docx'],
  basis:B('The original article names NCT05124860; the official current registry links this report. Main methods, combined protocol/SAP and relevant structural supplement tables were reviewed. EE trajectories and exploratory classes are not protein-balance or treatment-response validation.','Özgün makale NCT05124860’ı adlandırır; resmî güncel kayıt bu yayını bağlar. Ana yöntem, birleşik protokol/SAP ve ilgili yapısal ek tablolar incelendi. EE seyri ve keşifsel sınıflar, protein dengesi veya tedavi yanıtı doğrulaması değildir.')
 },
 'excel-ecmo-delivery-2026':{
  auditDate:'2026-10-25',familyId:'excel-nutrition-actrn12623000304639',linkStatus:'verified',
  analysisRole:B('Observational nutrition-delivery substudy','Gözlemsel beslenme sunumu alt çalışması'),
  reportsParentRandomization:false,randomizedExposureForQuestion:false,
  participantCounts:{reportedPatients:147,icuEnergyAvailable:140,wardDataAvailable:37,registeredFinal:150},
  populationVerification:{registeredMinimumAge:16,publishedMinimumAgeVerified:false,adult18SubsetVerified:false,wardEligibleDenominatorVerified:false},
  participantOverlap:B('ICU and ward observations are not independent cohorts; the overlap of their reported analysis sets is not quantified in the accessed abstract. Exact reuse across other EXCEL publications remains unresolved. The 2012 historical comparator is not a concurrent randomized control.','YBÜ ve servis gözlemleri bağımsız kohortlar değildir; erişilen özette analiz gruplarının örtüşmesi nicelenmez. Diğer EXCEL yayınlarıyla kesin kişi tekrarı çözümlenmedi. 2012 tarihsel karşılaştırıcısı eşzamanlı randomize kontrol değildir.'),
  sourceUrls:['https://pubmed.ncbi.nlm.nih.gov/42172821/','https://www.sciencedirect.com/science/article/pii/S0899900726001528','https://www.anzctr.org.au/Trial/Registration/TrialReview.aspx?ACTRN=12623000304639','https://www.monash.edu/medicine/sphpm/anzicrc/research/anzic-rc-nutrition-program/ecmo-nutrition'],
  basis:B('Original abstract and current registry explicitly identify ECMO-Nutrition and its EXCEL linkage. Current registration is complete access; full published Methods/flow/SAP are unreviewed. Recorded delivery divided by physician prescription does not measure an optimal requirement.','Özgün özet ve güncel kayıt ECMO-Nutrition ile EXCEL bağlantısını açıkça tanımlar. Güncel kayda tam erişildi; yayımlanmış tam yöntem/akış/SAP incelenmedi. Kaydedilen alımın hekim reçetesine oranı optimal gereksinimi ölçmez.')
 },
 'engine-aki-pcr-posthoc-2026':{
  auditDate:'2026-10-25',familyId:'engine-aki-nct06238674',linkStatus:'verified',
  analysisRole:B('Secondary post hoc PCR and achieved-intake analysis','İkincil post hoc PCR ve gerçekleşen alım analizi'),
  reportsParentRandomization:false,randomizedExposureForQuestion:false,
  participantCounts:{parentEnrolled:80,secondaryAnalyzed:78,excludedIncompleteUrineCollections:2},
  analysisContrast:'nonrandom-achieved-intake-association',
  pcrMethodVerification:{equationVerified:false,parentEquationLocator:'Supplementary Fig. 1S',renalKineticHandlingVerified:false,individualDoseTargetValidated:false},
  participantOverlap:B('78 analyzed from the 80-person parent; two incomplete urine collections were excluded. No new randomization or independent cohort is added. Achieved-intake mortality categories are observational within the randomized study.','80 kişilik ana çalışmadan 78 kişi analiz edildi; eksik idrar toplaması bulunan iki kişi çıkarıldı. Yeni randomizasyon veya bağımsız kohort eklenmez. Gerçekleşen alıma göre mortalite kategorileri, randomize çalışma içinde gözlemseldir.'),
  sourceUrls:['https://pubmed.ncbi.nlm.nih.gov/42628743/','https://www.sciencedirect.com/science/article/abs/pii/S2405457726021364','https://api.crossref.org/works/10.1016%2Fj.clnesp.2026.105039','https://www.nature.com/articles/s41598-025-97443-z','https://clinicaltrials.gov/api/v2/studies/NCT06238674'],
  basis:B('Original 2026 Introduction reference 13 and publisher-deposited Crossref bib13 identify the parent DOI; original parent Methods explicitly name NCT06238674. Complete 2026 methods and the PCR-equation supplement were not read.','Özgün 2026 girişinin 13. kaynağı ve yayıncının Crossref’e yatırdığı bib13 ana DOI’yi verir; özgün ana yöntem NCT06238674’ü açıkça adlandırır. 2026’nın tam yöntemi ve PCR denklemi eki okunmadı.')
 },
 'summers-anabolic-resistance-rct-2026':{
  auditDate:'2026-10-25',familyId:'proms-actrn12620000776909',linkStatus:'verified',
  analysisRole:B('Parent randomized acute muscle-synthesis report','Ana randomize akut kas sentezi yayını'),
  reportsParentRandomization:true,randomizedExposureForQuestion:true,
  participantCounts:{randomized:29,completed:21,analyzed:20,registryFinal:20,completedExcludedProtocolViolation:1},
  outcomeScope:{postprandialHours:6,wholeBodyBreakdownAnalyzed:false,wholeBodyBalanceAnalyzed:false,individualDailyDoseValidated:false},
  participantOverlap:B('29 randomized, 21 completed, then one lower-dose protocol violation excluded: 20 analyzed. Registry final 20 is not silently treated as 20 randomized; these denominators are not added.','29 randomize, 21 tamamlayan; daha sonra düşük doz grubundaki bir protokol ihlali çıkarıldı: 20 analiz. Kayıttaki son 20 kişi sessizce 20 randomize sayılmaz; bu paydalar toplanmaz.'),
  sourceUrls:['https://pubmed.ncbi.nlm.nih.gov/42085214/','https://academic.oup.com/ajrccm/article/212/5/964/8496139','https://www.anzctr.org.au/Trial/Registration/TrialReview.aspx?ACTRN=12620000776909','https://api.crossref.org/works/10.1093%2Fajrccm%2Faamag086'],
  basis:B('Original abstract/indexed publisher Methods explicitly identify PROMS/ACTRN12620000776909; the official current registry was read directly. Access is indexed original methods/results plus current registration, not direct full-text/supplement or archived-registry appraisal.','Özgün özet/indekslenen yayıncı yöntemi PROMS/ACTRN12620000776909’u açıkça verir; resmî güncel kayıt doğrudan okundu. Erişim, indekslenen özgün yöntem/sonuç ile güncel kayıttır; doğrudan tam metin/ek veya arşivlenmiş kayıt incelemesi değildir.')
 },
 'nexis-aa-cycling-2026':{
  auditDate:'2026-10-25',familyId:'nexis-nct03021902',linkStatus:'verified',
  analysisRole:B('Parent combined-intervention randomized report','Ana birleşik müdahale randomize yayını'),
  reportsParentRandomization:true,randomizedExposureForQuestion:true,
  participantOverlap:B('115 randomized; protocol/registry are related documents, not new independent trials. A separate study adapting NEXIS cycling is not assumed to share its cohort.','115 randomize; protokol/kayıt ilişkili belgelerdir, yeni bağımsız deney değildir. NEXIS bisiklet yöntemini uyarlayan ayrı bir çalışmanın aynı kohortu kullandığı varsayılmaz.'),
  sourceUrls:['https://pubmed.ncbi.nlm.nih.gov/42438140/','https://clinicaltrials.gov/api/v2/studies/NCT03021902','https://bmjopen.bmj.com/content/9/7/e027893'],
  basis:B('Original abstract names NCT03021902; official registry links both result and protocol. Indexed original protocol passages describe individual allocation.','Özgün özet NCT03021902’yi adlandırır; resmî kayıt sonuç ve protokolü bağlar. İndekslenen özgün protokol bölümleri bireysel atamayı tanımlar.')
 },
 'berger-hmb-metabolic-posthoc-2026':{
  auditDate:'2026-10-25',familyId:'hmb-icu-ch-nct03628365',linkStatus:'verified',
  analysisRole:B('Secondary post hoc biochemical analysis','İkincil post hoc biyokimyasal analiz'),
  reportsParentRandomization:false,randomizedExposureForQuestion:true,
  reportedUcr:{analyteBasis:null,unitBasis:null,contrastCi:null,perAnalyteDenominators:null},
  participantOverlap:B('Reuses the parent 37-person study; publication in 2026 does not add a new randomized cohort.','37 kişilik ana çalışmayı yeniden kullanır; 2026’da yayımlanması yeni randomize kohort eklemez.'),
  sourceUrls:['https://pubmed.ncbi.nlm.nih.gov/42202485/','https://pubmed.ncbi.nlm.nih.gov/34358832/','https://clinicaltrials.gov/api/v2/studies/NCT03628365'],
  basis:B('The original abstract/indexed publisher Methods cite NCT03628365 and the Viana parent; the official registry independently links both publications.','Özgün özet/indekslenen yayıncı yöntemi NCT03628365 ve Viana ana yayınına atıf verir; resmî kayıt iki yayını bağımsız olarak bağlar.')
 },
 'wu-icu-hmb-2025':{
  auditDate:'2026-10-25',familyId:'hmb-rt-chictr2200057685',linkStatus:'verified',
  analysisRole:B('Expanded factorial randomized trial report','Genişletilmiş faktöriyel randomize deney yayını'),
  reportsParentRandomization:true,randomizedExposureForQuestion:true,
  includesEarlierParticipants:{n:112,reportDoi:'10.1186/s13054-023-04698-x',reportUrl:'https://link.springer.com/article/10.1186/s13054-023-04698-x'},
  participantOverlap:B('266 includes the earlier 112; the two publications are not independent samples. HMB and resistance-training factors remain distinct.','266 kişi önceki 112’yi içerir; iki yayın bağımsız örneklem değildir. HMB ve direnç egzersizi faktörleri ayrı tutulur.'),
  sourceUrls:['https://link.springer.com/article/10.1186/s13054-025-05660-9','https://link.springer.com/article/10.1186/s13054-023-04698-x','https://www.chictr.org.cn/hvshowproject.html?id=202250&v=1.1'],
  basis:B('Original methods explicitly state the same registration/protocol and the included earlier participants. Registry access itself was indexed only.','Özgün yöntem aynı kayıt/protokolü ve içerilen önceki katılımcıları açıkça belirtir. Kayıt sayfasına erişim yalnız indeks düzeyindeydi.')
 },
 'precise-2024':{
  familyId:'precise-nct04633421',linkStatus:'verified',
  analysisRole:B('Parent randomized treatment report','Ana randomize tedavi yayını'),
  reportsParentRandomization:true,randomizedExposureForQuestion:true,
  participantOverlap:B('One parent trial; its protocol and SAP are related documents, not additional trials or participants.','Tek ana deney; protokolü ve SAP ilişkili belgelerdir, ek deney veya katılımcı değildir.'),
  sourceUrls:['https://clinicaltrials.gov/api/v2/studies/NCT04633421','https://link.springer.com/article/10.1186/s13063-023-07380-3','https://cdn.clinicaltrials.gov/large-docs/21/NCT04633421/SAP_000.pdf'],
  basis:B('Original results article, original protocol/SAP and official registry verify NCT04633421. Historical registry versions and independent lock/unblinding chronology are not fully audited.','Özgün sonuç yayını, protokol/SAP ve resmî kayıt NCT04633421’i doğrular. Tarihsel kayıt sürümleri ve bağımsız veri kilitleme/körlük açılması kronolojisi tam denetlenmedi.')
 },
 'target-protein-2025':{
  auditDate:'2026-10-25',familyId:'target-protein-actrn12621001484831',linkStatus:'verified',
  analysisRole:B('Parent cluster-randomized treatment report','Ana küme randomize tedavi yayını'),
  reportsParentRandomization:true,randomizedExposureForQuestion:true,
  relatedStudies:[{familyId:'epic-nct05124860',relation:'explicit-partial-participant-overlap',overlapCount:null}],
  participantOverlap:B('One parent trial; analysis-plan publications do not add independent patients. The EPIC calorimetry paper explicitly reports an overlapping Australian subset, with unknown overlap count. Its 433 patients and regional 138 are not independent additions to TARGET.','Tek ana deney; analiz planı yayınları bağımsız hasta eklemez. EPIC kalorimetri yayını, kişi sayısı bilinmeyen örtüşen bir Avustralya alt grubunu açıkça bildirir. Oradaki 433 hasta ve bölgesel 138 kişi TARGET’a bağımsız eklenmez.'),
  sourceUrls:['https://jamanetwork.com/journals/jama/fullarticle/2835302','https://www.anzctr.org.au/Trial/Registration/TrialReview.aspx?ACTRN=12621001484831','https://link.springer.com/article/10.1186/s13063-025-08759-0','https://link.springer.com/article/10.1186/s13054-026-06102-w'],
  basis:B('The prior identity audit used original JAMA results, official ANZCTR and published SAP; corrupted supplement extraction was not a full review. The 25 October addition uses the original EPIC Discussion for partial overlap and does not claim a new review of all TARGET documents.','Önceki kimlik denetimi özgün JAMA sonucu, resmî ANZCTR ve yayımlanmış SAP’yi kullandı; bozuk ek metin çıkarımı tam inceleme değildi. 25 Ekim eklemesi, kısmi örtüşme için özgün EPIC tartışmasını kullanır; tüm TARGET belgelerinin yeniden incelendiğini iddia etmez.')
 },
 'ucr-effort-ward-2025':{
  auditDate:'2026-10-25',familyId:'effort-ward-nct02517476',linkStatus:'verified',
  analysisRole:B('Secondary biomarker and exploratory parent-treatment interaction analysis','İkincil biyobelirteç ve keşifsel ana tedavi etkileşimi analizi'),
  reportsParentRandomization:false,randomizedExposureForQuestion:false,
  randomizedExposureScope:'biomarker-level-or-change-not-parent-treatment-assignment',
  participantCounts:{parentAnalysisReported:2028,baselineUcr:1595,followupUcr:870},
  reportedUcr:{ureaUnit:'mmol/L',creatinineUnit:'umol/L',formulaAsPrinted:'(urea_mmol_L / creatinine_umol_L) / 1000',reportedScaleReconciled:false,clinicalDecisionThreshold:null,individualDoseTargetValidated:false},
  treatmentInteraction:{parentAssignmentRandomized:true,outcome:'30-day-all-cause-mortality',measure:'Cox-HR',figure:'3',printedPage:247,baselineP:0.26,changeP:0.80,changeGroupingPostBaseline:true,interactionEffectEstimate:null,interactionConfidenceInterval:null,perModelSampleSizes:null},
  participantOverlap:B('Nested within EFFORT: 1595 baseline and 870 follow-up UCR observations are not new independent participants. Follow-up permits Day 7 or earlier discharge. Availability, centre and extreme-value exclusions limit the subset.','EFFORT içindedir: 1595 başlangıç ve 870 izlem UCR gözlemi yeni bağımsız katılımcılar değildir. İzlem 7. gün veya daha erken taburculuk olabilir. Veri uygunluğu, merkez ve uç değer dışlamaları alt kümeyi sınırlar.'),
  sourceUrls:['https://doi.org/10.1016/j.clnesp.2025.03.042','https://edepot.wur.nl/691468','https://clinicaltrials.gov/api/v2/studies/NCT02517476'],
  basis:B('Original full article identifies NCT02517476 and Figure 3 supplies interaction P values; the previous registry check independently lists this derived report. Parent assignment is randomized, UCR level/change is not. Printed formula versus reported scale is unresolved; stratum HR intervals do not supply an interaction-effect CI or establish equivalence.','Özgün tam makale NCT02517476’yı adlandırır; Şekil 3 etkileşim p değerlerini verir. Önceki kayıt denetimi türetilmiş yayını bağımsız olarak listeler. Ana atama randomizedir; UCR düzeyi/değişimi değildir. Basılı formül ile bildirilen ölçek uzlaştırılmadı; grup HR aralıkları etkileşim GA sağlamaz veya eşdeğerliği göstermez.')
 },
 'effort-protein-2023':{
  familyId:'effort-protein-nct03160547',linkStatus:'verified',
  analysisRole:B('Parent randomized treatment report','Ana randomize tedavi yayını'),
  reportsParentRandomization:true,randomizedExposureForQuestion:true,
  participantOverlap:B('Parent report of this trial. Publication year is not the date of a new randomization.','Bu deneyin ana yayınıdır. Yayın yılı yeni bir randomizasyon tarihi değildir.'),
  sourceUrls:['https://pubmed.ncbi.nlm.nih.gov/36708732/','https://clinicaltrials.gov/api/v2/studies/NCT03160547'],
  basis:B('Original trial abstract and official registry identify NCT03160547.','Özgün deney özeti ve resmî kayıt NCT03160547’yi belirtir.')
 },
 'need-age-heterogeneity-2026':{
  familyId:'need-isrctn12233792',linkStatus:'verified',
  analysisRole:B('Post hoc treatment-effect modification analysis','Post hoc tedavi etkisi değişimi analizi'),
  reportsParentRandomization:false,randomizedExposureForQuestion:true,
  participantOverlap:B('Reuses NEED assignment; no new randomization. Age analysis was developed after parent completion/publication.','NEED atamasını yeniden kullanır; yeni randomizasyon yoktur. Yaş analizi ana çalışma/yayından sonra geliştirilmiştir.'),
  sourceUrls:['https://link.springer.com/article/10.1186/s40560-026-00942-y','https://www.isrctn.com/api/trial/ISRCTN12233792/format/who'],
  basis:B('Original methods explicitly name NEED/ISRCTN; official registry export verifies the parent identity.','Özgün yöntem NEED/ISRCTN’yi açıkça verir; resmî kayıt dışa aktarımı ana kimliği doğrular.')
 },
 'deng-physiological-windows-2026':{
  auditDate:'2026-10-26',familyId:null,linkStatus:'parent_named',
  relationshipLabel:B('Two cohort roles · MIMIC-IV / NEED','İki kohort rolü · MIMIC-IV / NEED'),
  analysisRole:B('Observational report with two cohort roles','İki kohort rollü gözlemsel yayın'),
  reportsParentRandomization:false,randomizedExposureForQuestion:false,
  cohorts:[{dataset:'MIMIC-IV',role:'derivation',sampleSize:5370,exposureTimeStructure:'daily'},{dataset:'NEED',role:'supportive',sampleSize:1322,familyId:'need-isrctn12233792',parentPublicationCitationVerified:true,directRegistryCitationVerified:false,exposureTimeStructure:'first-week-mean',physiologyTimeStructure:'baseline-enrollment'}],
  needSelection:{parentReportedEnrolled:2772,excludedIcuUnder7Days:212,excludedFirstWeekOralDiet:235,excludedMissingNutrition:35,excludedFirstWeekParenteralNutrition:965,remainingBeforeMortalityExclusion:1325,excludedMissingMortality:3,analyzed:1322,basis:'main-results-prose-not-visual-flow-figure'},
  windowEvidence:{separateMarkerStrata:true,jointAndWindowVerified:false,formalInteractionP:{norepinephrineEnergy:'<0.001',norepinephrineProtein:'<0.001',lactateEnergy:0.052,lactateProtein:0.003,creatinineProtein:0.467},needTable6CreatinineExposureLabelReconciled:false,clinicalDecisionThreshold:null,individualDoseTargetValidated:false},
  participantOverlap:B('MIMIC-IV is the daily main analysis; NEED is a first-week-mean supportive cohort, not replication of a daily dynamic rule. Its 1322 are selected from the NEED parent; overlap with other NEED reports is unquantified. Do not sum samples as unique participants.','Ana günlük analiz MIMIC-IV; NEED ilk hafta ortalamalı destekleyici kohorttur, günlük dinamik kuralın tekrarı değildir. 1322 kişi ana NEED’den seçilmiştir; diğer NEED yayınlarıyla örtüşme nicelenmedi. Örneklemleri benzersiz katılımcı olarak toplamayın.'),
  sourceUrls:['https://doi.org/10.1016/j.clnesp.2026.105009','https://link.springer.com/article/10.1186/s13054-022-03921-5'],
  basis:B('Authorized original main Methods 2.1 and reference 13 identify the NEED parent publication, whose registry had separate verification. No ISRCTN identifier appears in the captured main text; direct registry citation remains unverified. Six HTML table texts and captions were reviewed, not figure images or supplement. Separate strata and a Table 6 exposure-label conflict do not establish a joint classifier or dose.','Yetkili özgün ana Yöntem 2.1 ve kaynak 13, kaydı ayrı incelenmiş NEED ana yayınını tanımlar. Kaydedilen ana metinde ISRCTN kimliği yoktur; doğrudan kayıt atfı doğrulanmadı. Altı HTML tablo metni ve açıklamalar incelendi; şekil görüntüleri/ek incelenmedi. Ayrı katmanlar ve Tablo 6 maruziyet etiketi uyuşmazlığı ortak sınıflandırıcı veya doz doğrulamaz.')
 },
 'ucr-aki-mortality-posthoc-2026':{
  auditDate:'2026-10-25',familyId:'need-isrctn12233792',linkStatus:'verified',
  analysisRole:B('Post hoc observational prognostic analysis within NEED','NEED içinde post hoc gözlemsel prognostik analiz'),
  reportsParentRandomization:false,randomizedExposureForQuestion:false,
  participantCounts:{parentReportedEnrolled:2772,day1Analyzed:2613,day7Analyzed:2516,bothDays:2512},
  reportedUcr:{analyteBasis:'serum-urea/serum-creatinine',unitBasis:'mmol/mmol',formula:'urea_mmol_L / (creatinine_umol_L / 1000)',clinicalDecisionThreshold:null,individualDoseTargetValidated:false},
  participantOverlap:B('Reuses NEED participants with no new randomization. Day 1/7 sets share 2512 people and are not fully nested. Overlap with the age analysis and other NEED reports is unquantified; do not sum samples as independent participants.','Yeni randomizasyon olmadan NEED katılımcılarını yeniden kullanır. 1./7. gün kümelerinde 2512 ortak kişi vardır; kümeler tam iç içe değildir. Yaş analizi ve diğer NEED yayınlarıyla örtüşme nicelenmedi; örneklemleri bağımsız katılımcı gibi toplamayın.'),
  sourceUrls:['https://doi.org/10.1002/jpen.70148','https://www.isrctn.com/api/trial/ISRCTN12233792/format/who'],
  basis:B('Original main Methods explicitly name NEED/ISRCTN12233792; institutional main-text/table review on 25 October supersedes the earlier abstract-only unresolved link. Parent identity had separate registry verification. Figures/supplements remain unread; allocation adjustment is not a treatment-interaction or UCR-guided dose trial.','Özgün ana yöntem NEED/ISRCTN12233792’yi açıkça adlandırır; 25 Ekim kurum erişimiyle ana metin/tablo incelemesi, önceki yalnız özet kaynaklı eksik bağlantıyı günceller. Ana kimliğin ayrı kayıt doğrulaması vardır. Şekil/ekler okunmadı; atama için düzeltme, tedavi etkileşimi veya UCR rehberli doz deneyi değildir.')
 }
};
export const lineageEvidenceIds=Object.keys(records);
export function lineageFor(id){
 const record=typeof id==='string'&&Object.hasOwn(records,id)?records[id]:null;
 return record?structuredClone({evidenceId:id,auditDate:LINEAGE_AUDIT_DATE,independentParticipantTotal:null,...record,family:record.familyId?trialFamilies[record.familyId]:null}):null;
}
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function lineageMarkup(id,language='en'){
 const record=lineageFor(id);if(!record)return '';
 const locale=language==='tr'?'tr':'en',L=value=>value?.[locale]||'',T=(en,tr)=>locale==='tr'?tr:en;
 const family=record.family;
 const relationshipTitle=family?L(family.title):record.relationshipLabel?L(record.relationshipLabel):T('Parent linkage incomplete','Ana çalışma bağlantısı eksik');
 return `<section class="study-lineage" data-no-i18n><strong>${T('Study relationship','Çalışma ilişkisi')} · ${esc(relationshipTitle)}</strong><p>${esc(L(record.analysisRole))}. ${esc(L(record.participantOverlap))}</p>${family?`<p><a href="${esc(family.registry.url)}" target="_blank" rel="noopener noreferrer">${esc(family.registry.id)} ↗</a> · <a href="${esc(family.parent.url)}" target="_blank" rel="noopener noreferrer">${esc(family.reportLabel?L(family.reportLabel):T('Parent results','Ana çalışma sonucu'))} ↗</a>${family.protocol?` · <a href="${esc(family.protocol.url)}" target="_blank" rel="noopener noreferrer">${T('Protocol','Protokol')} ↗</a>`:''}${family.sap?` · <a href="${esc(family.sap.url)}" target="_blank" rel="noopener noreferrer">SAP ↗</a>`:''}</p><p>${esc(L(family.note))}</p>${family.methodsNote?`<p>${esc(L(family.methodsNote))}</p>`:''}`:''}${record.cohorts?`<p>${record.cohorts.map(c=>`${esc(c.dataset)}: ${c.sampleSize}, ${c.role==='derivation'?T('main cohort','ana kohort'):T('supportive cohort','destekleyici kohort')}`).join(' · ')}</p>`:''}<p>${esc(L(record.basis))}</p><small>${T('Focused identity audit; not a systematic review, bias grade or pooled participant count.','Odaklı kimlik denetimi; sistematik derleme, yanlılık puanı veya birleşik katılımcı sayısı değildir.')}</small></section>`;
}
