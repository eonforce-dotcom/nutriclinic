# NutriClinic focused study-family audit — interface 0.3.14

Seventeen source records carry structured lineage metadata. This is a selected subset of the 64-source catalog, not a count of unique trials or patients. Unmapped publications are not assumed independent. `studyLineage` in the JSON catalog preserves verified, named-parent and unresolved links, different cohort roles and null unique-participant totals. The physician screen shows this information inside source methods. Neither targets nor clinical eligibility gates are changed by publication linkage.

Türkçe: On yedi kaynak için çalışma ilişkisi yapılandırıldı. 64 kaynak benzersiz deney sayısı değildir. Eşlenmemiş yayın bağımsız sayılmaz. Aynı kısaltmalı servis EFFORT ve YBÜ EFFORT Protein ayrılır. Deng'in iki kohortu korunur; Zhou'nun özgün ana metni NEED bağlantısını doğrular. NEED yayınları arasında örtüşme nicelenmedi, kayıt tarihi çelişkileri korunur. Bu ilişki doz veya tanı kuralına dönüşmez. Aşağıdaki önerilen ayrıntılı alanlar, tümünün arayüzde bulunduğu anlamına gelmez.

## Updated locally in 0.3.14 / Wulandari kısmi özgün erişim ve güncel kayıt

The indexed original registration statement and directly archived current API identify **NCT06167772**. The registry's actual enrollment40 does not establish randomized N or replace reported analyzed40/muscleN36. Current posting precedes the recorded start by one day, but historical outcome wording/SAP and original participant flow are unread. Quadruple versus double-blind labels, the placebo-category/no-placebo description and nutrient wording remain unresolved. Fresh VETİS exact-DOI search recognized institutional access; article navigation was rejected by browser security policy and no workaround was attempted. The relationship is explicitly limited to indexed original access plus current registry, not full original verification. [Wulandari source and access note](./WULANDARI-BCAA-SOURCE-METHODS.md) records the boundaries. Counts remain64 sources, now17 selected relationships; no new patient, classifier or dose is added.

Türkçe: Randomizasyon ve akış bilinmeyenleri korunur. Güncel kayıt tam makale, tarihsel önbelirleme veya mg/g uyuşmazlığının çözümü değildir. Bu sürüm yalnız masaüstündeki yerel projede güncellendi.

## Updated in 0.3.13 / ProMob-ICU birleşik müdahale

Veldsman's existing report identifies **NCT04099108 / ProMob-ICU**, corroborated by the current official registry. Both arms receive routine mobilization; additional intravenous amino acids and cycling form the randomized intervention. The 53 randomized and 50 modified-ITT participants are different denominators; the current registry's actual 50 does not replace the randomized count. The main report explicitly relates a prior energy-expenditure publication to the same cohort, without creating another independent sample. Current public registration predates the recorded start, but the original supporting protocol/SAP and archived amendments remain unread. No isolated amino-acid benefit, equivalence or dose rule is inferred. [Combined-trial source methods](./HMB-NEXIS-SOURCE-METHODS.md) preserve access and denominator limits.

Türkçe: Aynı kohortun enerji harcaması yayını ek katılımcı sayılmaz. Rutin mobilizasyon iki kolda da vardır; IV aminoasit ve ek bisiklet birlikte değerlendirilir. Sonuç başına ölçüm sayıları ve önbelirleme doğrulanmış sayılmaz. Katalog 64, seçilmiş ilişki sayısı 16'dır.

## Updated in 0.3.12 / Fradkin kalorimetri deneyi

The existing PMV nutrition-target trial is linked to **NCT04825717** through the original article and current official registry, which lists both its results and protocol publications. The selected audit now covers **15 records**, while the source catalog remains 64. The protocol reference adds no participants. Public posting on 1 April 2021 follows both recorded recruitment starts; the article's 15 March date is submission. Estimated registry enrollment 200, planned 326, ITT 211 and PP 198 remain separate. The 27/31-day medians concern 118 successful weaners, not all ITT participants; three named withdrawals do not explain the entire PP difference.

Current registry primaries use eight weeks, whereas the article uses a 120-day follow-up limit. Survival populations/clocks and masking descriptions differ. These are unresolved source comparisons, not a formal outcome-switch or risk-of-bias ruling. Original protocol/SAP, historical registry versions, flow image and supplement remain unread. The randomized target strategy is distinguished from post hoc achieved-energy association. [Energy measurement and delivery methods](./ENERGY-MEASUREMENT-AND-DELIVERY-SOURCE-METHODS.md) preserves the source-specific dates and limits; no metabolic classifier or feeding dose follows.

Türkçe: Fradkin tek merkezli deneyinin sonuç ve protokol kimliği doğrulandı. Tahmini/planlı/ITT/PP paydaları ve başarılı ayrılanların süre özeti ayrıldı; kayıt ile sonuç izlem saatleri eşitlenmedi. Protokolün bibliyografik bağlantısı, özgün içeriğinin veya SAP'nin incelendiği anlamına gelmez. Katalog 64, seçilmiş ilişki sayısı 15'tir; yeni bağımsız hasta toplamı veya doz kuralı yoktur.

## Updated in 0.3.11 / Deng kohort rollerinin özgün kaynakla doğrulanması

Authorized original main Methods 2.1 and reference 13 now verify the NEED parent publication for Deng's supportive cohort. The captured main text contains no ISRCTN identifier: `parentPublicationCitationVerified:true` is distinct from `directRegistryCitationVerified:false`. MIMIC-IV remains the primary daily cohort; NEED uses first-week mean exposure and baseline physiology. The source card therefore displays two cohort roles rather than implying one trial family for the whole paper. The NEED selection flow is verified from Results prose, not a visually inspected flow figure. Cross-report overlap remains unquantified and independent-participant totals remain null. [The Deng methods note](./DENG-METABOLIC-SOURCE-METHODS.md) records the separate-stratum, interaction and access limits. This updates one existing record; counts remain 64 sources and 14 selected lineage records.

Türkçe: Özgün ana yayın atfı doğrulandı; doğrudan kayıt numarası atfı doğrulanmadı. MIMIC-IV günlük ana analiz ile NEED ilk hafta ortalamalı destekleyici kohort ayrı gösterilir. Kümeler yeni bağımsız katılımcı toplamı veya ortak besleme eşiği üretmez.

## Updated in 0.3.10 / Servis EFFORT-UCR özgün yöntem incelemesi

The original EFFORT ward article was reviewed through the WUR institutional Taverne repository on 25 October 2026. It explicitly identifies NCT02517476 and preserves the already verified family link. Baseline 1595 and paired follow-up 870 are nested selected subsets of the reported 2028 parent-analysis patients; they are not independent cohorts or verified Figure 3 model denominators. Follow-up can be Day 7 or earlier discharge. The Figure 3 treatment comparisons retain parent allocation, while UCR level/change is not randomized and change groups are defined after treatment starts. Interaction P values 0.26/0.80 do not establish equivalence; stratum HR confidence intervals are not interaction-effect confidence intervals. The printed formula/scale conflict remains unresolved. Main Methods, tables and Figure 3 were reviewed; supplements and secondary SAP were not. [The shared UCR source-method note](./UCR-ORIGINAL-SOURCE-METHODS.md) records details. Counts remain 64 catalog records and 14 selected lineage records; no new trial or dose rule was added.

Türkçe: Servis EFFORT-UCR özgün makalesi kurum arşivinden incelendi; VETİS bu makale için kullanılmadı. Başlangıç ve izlem alt kümeleri yeni bağımsız hastalar değildir. Ana tedavi ataması randomize olsa da UCR değişimi randomize değildir. Etkileşim p değerleri eşdeğerlik veya doz seçimi kanıtı sayılmaz; basılı formül/ölçek uyuşmazlığı korunur.

## Updated in 0.3.9 / UCR özgün yöntem incelemesi

Authorized VETİS access on 25 October 2026 established explicit NEED/ISRCTN12233792 linkage in Zhou's original main Methods. Main text and displayed tables were reviewed; figure panels and supplements were not read. This updates an existing record rather than adding a trial or participants. Day1 n2613 and Day7 n2516 share2512 people; the sets are not fully nested. Cross-report overlap with the age analysis and Deng's NEED cohort remains unquantified. The study's molar UCR is not the app's mass ratio, and adjustment for NEED assignment is not a UCR-guided randomized dose comparison. [UCR-ORIGINAL-SOURCE-METHODS.md](./UCR-ORIGINAL-SOURCE-METHODS.md) records the unit basis, analysis timing, available-data selection, operational AKI and access limits. The initial abstract-only finding below is historical and superseded for parent identity.

Türkçe: 25 Ekim özgün ana yöntem incelemesi NEED kimliğini doğrular; önceki yalnız özet kaynaklı eksik bağlantı güncellendi. Şekil/ekler incelenmedi. Yayın ve katılımcı sayısı artmadı; molar oran doz veya metabolik durum eşiği yapılmadı.

## Added in 0.3.5 / Eklenen ENGINE ve PROMS ilişkileri

| Existing record | Verified lineage and counting limit |
|---|---|
| `engine-aki-pcr-posthoc-2026` | ENGINE **NCT06238674**, parent DOI **10.1038/s41598-025-97443-z**; **78 analysed within 80 parent participants**, two incomplete urine collections excluded. The combined randomized nutrition strategy differs from the secondary achieved-intake association. No new randomization; unread PCR supplement and retrospectively public registration/start-date conflict remain explicit. |
| `summers-anabolic-resistance-rct-2026` | PROMS **ACTRN12620000776909**; **29 randomized / 21 completed / 20 analysed**, distinct from the current registry final-20 field. Six-hour muscle fractional synthesis is not net balance or daily protein requirements. Registered whole-body balance/breakdown were not analysed; no prepublished SAP was available in the indexed methods. |

[ENGINE-SUMMERS-SOURCE-METHODS.md](./ENGINE-SUMMERS-SOURCE-METHODS.md) preserves original URLs, actual access, chronology, selected exact queries and unresolved methods. These are two existing catalog records: the catalog remains **62**, with **12 selected lineage mappings**, not 12 independent trials. Complete articles, supplements and historical prespecification were not all reviewed.

Türkçe: ENGINE ana çalışma bağlantısı ve PROMS kimliği doğrulandı; paydalar birleştirilmez. PCR denklemi okunmadı; akut kas sentezi günlük gereksinime çevrilmez. Yeni kaynak veya katılımcı toplamı eklenmez.

## Added in 0.3.4 / Eklenen HMB ve NEXIS ilişkileri

The newly catalogued HMB2026 publication is a secondary Lausanne report, not another randomized cohort. Lausanne NCT03628365 and Fujian ChiCTR2200057685 are distinct families; Fujian's expanded 266-person report includes112 from the earlier publication. NEXIS NCT03021902 is a combined amino-acid/cycling trial with current-registry eligibility and indexed-protocol access explicitly distinguished from final-cohort/full-text verification. [HMB-NEXIS-SOURCE-METHODS.md](./HMB-NEXIS-SOURCE-METHODS.md) records the source basis, dates and unresolved units/methods. This update adds one publication to the catalog, with no unique-participant total or dose rule.

## Added in 0.3.3 / Eklenen yöntem bağlantıları

PRECISe is linked to **NCT04633421** and TARGET Protein to **ACTRN12621001484831**. PRECISe randomizes individual participants; TARGET randomizes ICU treatment sequences across periods, not repeated treatments within each patient. Protocol and statistical-analysis-plan links accompany the source cards and JSON metadata. The TARGET SAP explicitly supersedes the earlier plan. PRECISe follow-up anchors and TARGET registry/result counts and dates remain unresolved rather than being silently harmonized. No result, dose rule or evidence-quality grade is changed.

The detailed original-source, chronology and search audit is [PRECISE-TARGET-METHODS-AUDIT.md](./PRECISE-TARGET-METHODS-AUDIT.md). These protocol/SAP/registry documents belong to two existing source records; they did not increase the then-61-record catalog or add independent participants.

Türkçe: PRECISe bireysel, TARGET YBÜ küme dönemli randomizasyondur. SAP/protokol sürümleri ayrıdır; kaynaklar arasındaki sayı ve tarih farkları korunur. Yöntem bağlantıları klinik hedefi değiştirmez; aşağıdaki beş kaynaklık ilk denetimi tamamlar.

---
# Initial five-source family and registry audit / İlk beş kaynaklık aile ve kayıt denetimi

**Audit date / Tarih:** 24 October / Ekim 2026, Europe/Istanbul. **Scope:** focused original-publication, protocol and registry mapping for existing NutriClinic records. This is not an exhaustive systematic search, formal RoB2/GRADE judgment or clinical validation. The audit describes publication identity; integration in the app is metadata only. Public web and official registry APIs were used; this auditor did not use VETİS. Full-text access histories are documented separately.

**Main finding / Ana bulgu:** EFFORT ward and EFFORT Protein are separate trials despite sharing an acronym. A secondary publication is not another randomization. Zhou's parent was unresolved from the initially accessed abstract; the 25 October original-method update above now verifies NEED. Similar authors/sample sizes alone were not used to establish linkage.

## 1. Family mapping and certainty

| Existing evidence ID | Family / registry | What is established | Counting rule / certainty |
|---|---|---|---|
| `ucr-effort-ward-2025` | **EFFORT medical ward**, **NCT02517476** | The later original full article explicitly names the registry and Figure 3 supplies interaction tests; the earlier official API check independently lists PMID40122337 as **DERIVED** and PMID31030981 as parent results. | Verified family link; secondary biomarker/parent-treatment exploration, **no new randomization**. UCR change and available follow-up are post-baseline. |
| `effort-protein-2023` | **EFFORT Protein ICU**, **NCT03160547** | Original trial abstract explicitly gives this registration; independent official registry response confirms the different intervention/population and1329 enrollment. | Separate randomized trial; must not merge with ward EFFORT. |
| `need-age-heterogeneity-2026` | **NEED**, **ISRCTN12233792** | Original open full text explicitly names parent NEED and registry; registry API independently confirms acronym/design/enrollment. Parent DOI10.1186/s13054-022-03921-5. | Verified family link; post hoc age-effect analysis, **no new randomization**. |
| `deng-physiological-windows-2026` | **MIMIC-IV derivation + NEED supportive cohort** | Later original Methods/reference 13 confirms the NEED parent publication and Results prose gives subset flow. The captured main text does not give an ISRCTN identifier. | Preserve **two cohort roles** and distinguish daily versus first-week exposure. Direct registry citation remains unverified; do not sum 1322 with other NEED reports as unique patients. |
| `ucr-aki-mortality-posthoc-2026` | **NEED**, **ISRCTN12233792** (updated 25 October) | Later authorized original main Methods explicitly identifies the parent. Earlier abstract-only uncertainty is retained in the dated access history. | Verified family; secondary observational UCR question, **no new randomization**. Day 1/7 overlap and cross-report overlap prevent independent participant aggregation. |

**TR:** Aynı ana çalışmanın alt analizleri ayrı makale olarak kalır; bağımsız deney gibi sayılmaz. Deng çalışmasında MIMIC-IV ve NEED farklı kohort rolleriyle saklanır. Alt örneklemler arasında kişi düzeyinde örtüşme bilinmeden sayılar toplanmaz. Zhou için daha sonra özgün ana yöntemle doğrulanan NEED bağlantısı kullanılır.

## 2. Verified original/registry provenance

### EFFORT medical ward family

- **UCR publication:** DOI10.1016/j.clnesp.2025.03.042, PMID40122337, online21March2025, June2025 issue. [Original PubMed abstract](https://pubmed.ncbi.nlm.nih.gov/40122337/) directly opened: registration **NCT02517476**;1595 baseline/870day7 from2028 EFFORT analysis participants. No new patients randomized for the UCR analysis. Full text not obtained here.
- **Parent results:** DOI10.1016/S0140-6736(18)32776-4, PMID31030981,2019. [Original PubMed abstract](https://pubmed.ncbi.nlm.nih.gov/31030981/) directly opened: eight Swiss hospitals,2088 randomized;60 consent withdrawals;2028 analyzed. Randomized individualized nutritional support versus standard hospital food. This is a treatment contrast; the UCR association is a nested biomarker question.
- **Official registry:** [NCT02517476](https://clinicaltrials.gov/study/NCT02517476), read successfully as JSON from [official API](https://clinicaltrials.gov/api/v2/studies/NCT02517476). Fields checked: `identificationModule.nctId/acronym`; `designModule.enrollmentInfo`2088 actual; `referencesModule.references` contains both parentPMID31030981 and UCRPMID40122337 as DERIVED. The registry's broad DERIVED tag is not an independent methodological appraisal.
- **Protocol:** DOI10.18203/2349-3259.ijct20182085,2018, [original protocol in author-institution repository](https://arbor.bfh.ch/bitstreams/87264a2a-0bc9-429f-9762-7a8a26b5fe40/download). Nine-page original PDF opened; title/design/registration checked. The publication date alone does not prove that every2025 biomarker analysis was prespecified.

**Registry chronology must remain precise:** actual study start **2014-04**; first submitted **2015-07-30**; first posted **2015-08-07**; last registry update posted2018-05-18. Thus the frequently quoted7August2015 date is a **first-public-posting date after recorded recruitment began**, not evidence of prospective registration. No formal risk-of-bias rating is assigned here.

### EFFORT Protein ICU family

- **Parent:** DOI10.1016/S0140-6736(22)02469-2, PMID36708732. [Original indexed PubMed abstract](https://pubmed.ncbi.nlm.nih.gov/36708732/) explicitly identifies **NCT03160547**,85ICUs/16countries,1329 randomized/1301 analyzed. It compares prescribed high versus usual protein in ventilated high-risk ICU adults. Direct PubMed opening intermittently returned only a footer; full paper not read by this auditor. Existing root VETİS review is a separate access event.
- **Registry:** [NCT03160547](https://clinicaltrials.gov/study/NCT03160547), official [API JSON](https://clinicaltrials.gov/api/v2/studies/NCT03160547) successfully read. Enrollment1329; actual start2017-11-21; first submitted2017-05-17; first posted2017-05-19. Preserve submitted and posted dates separately. The parent abstract reports randomized recruitment beginning17January2018; do not silently rewrite either record or invent an explanation for this start-date difference.
- Registry links **RE-EFFORT**, PMID38229072, DOI10.1186/s13054-024-04799-1, as a secondary publication; original [PMC methods](https://pmc.ncbi.nlm.nih.gov/articles/PMC10792897/) also explicitly identify NCT03160547. It is not ward EFFORT or Zhou2026. This audit used it for identity only, not a new effect-size extraction.

**TR:** İki kayıt da “EFFORT” kısaltmasını kullanır. Ayırıcı anahtar kısaltma değil, kayıt numarası ve popülasyondur: servisNCT02517476; protein/YBÜNCT03160547. Yeni bir alt analiz yayın yılı, yeni randomizasyon yılı değildir.

### NEED family and date reconciliation

- **Parent results:** DOI10.1186/s13054-022-03921-5, PMID35172856, published16February2022; original [publisher full text](https://link.springer.com/article/10.1186/s13054-022-03921-5) opened. It explicitly links **ISRCTN12233792**;2772 enrolled March2018–July2019. ICU-level feeding-guideline implementation versus usual practice; not isolated protein-dose randomization.97ICUs randomized,90 enrolled patients—retain the denominators separately.
- **Protocol/SAP:** [Additional file1,118-page original PDF](https://media.springernature.com/original/springer-static/esm/art%3A10.1186%2Fs13054-022-03921-5/MediaObjects/13054_2022_3921_MOESM1_ESM.pdf) opened. Contents identify protocol versions/changes and original SAP; version1 dated2July2017. This audit located/read relevant design/contents passages, not a complete118-page prespecification appraisal.
- **Age paper:** DOI10.1186/s40560-026-00942-y; original [full text](https://link.springer.com/article/10.1186/s40560-026-00942-y) opened. Methods explicitly say2672 from2772,100 lacking28-day vital status,88contributingICUs. The age analysis was not prespecified in the parent protocol/SAP and was developed after parent-study completion/publication, without separate registration. It retains randomized assignment for an exploratory effect-modification question; it is not a new confirmatory trial.
- **Registry date resolved:** HTML registry opening reached a cookie/JavaScript holding page. Its own [FAQ/API documentation](https://www.isrctn.com/page/faqs) permits the public XML API. The documented [single-record WHO XML endpoint](https://www.isrctn.com/api/trial/ISRCTN12233792/format/who) was successfully read via a normal HTTP request: `trial_id=ISRCTN12233792`, `acronym=NEED`, `date_registration=24/11/2017`, `date_enrolment=26/03/2018`, `results_actual_enrolment=2772`. Thus the registry agrees with the age paper's **24November2017**; the parent's abstract says20November2017. Store the conflict and registry-derived date, rather than claiming agreement across sources. Current API data are not an archived2017 version.
- **Correction:** original [2022 correction](https://link.springer.com/article/10.1186/s13054-022-03982-6) opened; corrects an affiliation, not trial outcomes/registration date.

### Deng2026 mixed-cohort report

[Original indexed abstract](https://pubmed.ncbi.nlm.nih.gov/42562321/), DOI10.1016/j.clnesp.2026.105009, explicitly names MIMIC-IV and a NEED supportive cohort. It studies achieved nutritional adequacy observationally; the presence of randomized-source data does not randomize achieved adequacy. The1322NEED subset may overlap other NEED analyses; exact overlap is not established. Direct registry citation and detailed exclusions remain for the separately documented VETİS full-text check. No new registry was verified for this observational report.

### Zhou2026 parent unresolved at the initial 24 October audit

[Original indexed abstract](https://pubmed.ncbi.nlm.nih.gov/42806521/), DOI10.1002/jpen.70148, reports post hoc analyses on days1/7 in2613/2516patients. It supplies no parent acronym, registry, or protocol link in the accessed text. Direct publisher full/abstract URLs were unavailable. Search results did not provide an original source connecting its DOI to ISRCTN12233792 or another registration. A possible resemblance is not a confirmed link; leave registry/family null. Authorized institutional VETİS full-text review is the next appropriate source step.

## 3. Proposed structured fields / Önerilen yapılandırılmış alanlar

```js
// Metadata only; no dose or diagnosis rule.
{
 evidenceId: 'ucr-effort-ward-2025',
 familyId: 'effort-ward-nct02517476',
 parentRegistry: { registry:'ClinicalTrials.gov', id:'NCT02517476',
   url:'https://clinicaltrials.gov/study/NCT02517476' },
 parentResultsDoi:'10.1016/S0140-6736(18)32776-4',
 analysisRole:{ en:'Secondary biomarker analysis', tr:'İkincil biyobelirteç analizi' },
 linkStatus:'verified', // verified | parent_named | unresolved
 linkBasis:[
  {url:'https://pubmed.ncbi.nlm.nih.gov/40122337/',locator:'Abstract: clinical trial registration'},
  {url:'https://clinicaltrials.gov/api/v2/studies/NCT02517476',locator:'referencesModule.references: PMID40122337'}
 ],
 randomizationNewForReport:false,
 randomizedExposureForThisQuestion:false, // UCR was not randomized
 population:{ en:'Adult medical inpatients at nutritional risk', tr:'Beslenme riskli yetişkin dahili servis hastaları' },
 cohortRole:'nested-biomarker',
 enrollmentCounts:{ parentRandomized:2088, parentAnalyzed:2028, baselineUcr:1595, day7Ucr:870 },
 independentParticipantTotal:null, // never infer unique combined counts across reports
 registrationDates:{ firstSubmitted:'2015-07-30', firstPosted:'2015-08-07', actualStart:'2014-04' },
 access:{ originalArticle:'abstract', registry:'official-api-json', checkedDate:'2026-10-24' },
 prespecification:'not-established-from-accessed-material',
 applicability:{ en:'Prognostic analysis; no validated UCR-selected feeding dose', tr:'Prognoz analizi; UCR’ye göre besleme dozu doğrulanmış değil' }
}
```

Suggested remaining mappings:

```js
[
 {evidenceId:'effort-protein-2023',familyId:'effort-protein-nct03160547',registryId:'NCT03160547',linkStatus:'verified',analysisRole:'parent-randomized-treatment',randomizationNewForReport:true},
 {evidenceId:'need-age-heterogeneity-2026',familyId:'need-isrctn12233792',registryId:'ISRCTN12233792',linkStatus:'verified',analysisRole:'posthoc-effect-modification',randomizationNewForReport:false},
 {evidenceId:'deng-physiological-windows-2026',familyId:null,registryId:null,linkStatus:'parent_named',analysisRole:'observational-multiple-cohorts',randomizationNewForReport:false,
   cohorts:[{dataset:'MIMIC-IV',role:'derivation',n:5370},{dataset:'NEED',familyId:'need-isrctn12233792',role:'supportive',n:1322,directRegistryCitationVerified:false}]},
 {evidenceId:'ucr-aki-mortality-posthoc-2026',familyId:'need-isrctn12233792',registryId:'ISRCTN12233792',linkStatus:'verified',analysisRole:'posthoc-observational-prognostic',randomizationNewForReport:false} // updated 25 October
]
```

The first flag means **this publication reports the parent randomization**, not that randomization occurred in its publication year. Avoid deriving a displayed “number of trials” directly from this flag or adding parent and nested sample sizes. Where the research question is randomized assignment, use `randomizedExposureForThisQuestion=true`; for achieved intake/UCR association it remains false even within an RCT family.

**EN compact label:** “Study family: EFFORT medical ward · secondary analysis · participants overlap the parent trial.”

**TR kısa etiket:** “Çalışma ailesi: EFFORT dahili servis · ikincil analiz · katılımcılar ana çalışmayla örtüşür.”

**EN unresolved label:** “Parent trial/registration not yet verified from the original full text.”

**TR çözümlenmemiş etiket:** “Ana çalışma/kayıt bilgisi özgün tam metinden henüz doğrulanmadı.”

## 4. Exact focused queries and access log

All below run24October2026. General web discovery was followed only by original journal/PubMed records, author-institution copies, protocols or official registries. Irrelevant names/DOI-neighbors, reviews and generic health pages were excluded from evidentiary extraction. Search engine result counts were not reliable/exported and are not invented here; this is not a PRISMA flow.

| Exact query | Material result / disposition |
|---|---|
| `"10.1002/jpen.70148" trial` | Original PubMed UCR record; no parent registry in abstract. |
| `"10.1016/j.clnesp.2025.03.042" trial` | Original UCR ward record. |
| `"NEED" "2026" nutrition "Deng" trial registry` | Original NEED results and Deng record located; unrelated results excluded. |
| `"Zhou" "Urea-to-Creatinine-Ratio" "70148"` | Original UCR abstract, parent unresolved. |
| `"70148" "ISRCTN12233792"` | No supporting original DOI-to-registry linkage extracted. |
| `"Urea-to-Creatinine-Ratio" "NEED"` | No original linkage sufficient to resolve Zhou. |
| `"EFFORT" "02517476" Lancet 2019` | Parent medical-ward EFFORT results. |
| `site.clinicaltrials.gov "NCT02517476"` | Registry identified; HTML content sparse, official API subsequently read. |
| `site.pubmed.ncbi.nlm.nih.gov "Individualised nutritional support in medical inpatients" "2019"` | PMID31030981. |
| `site.pubmed.ncbi.nlm.nih.gov "EFFORT Protein" "NCT03160547"` | Parent protein and RE-EFFORT identity. |
| `site.isrctn.com "12233792"` | No useful indexed registry text; documented public API used. |
| `"Nutritional adequacy is associated" "ISRCTN"` | No direct registry citation verified from this query. |
| `"10.1002/jpen.70148" "NEED trial"` | No supporting original linkage extracted. |
| `"10.1002/jpen.70148" "12233792"` | No supporting original linkage extracted. |
| `"EFFORT" "NCT02517476" "protocol"` | Protocol/institutional originals; other EFFORT secondaries, not independent trials. |
| `"Nutritional adequacy is associated" "10.1016/j.clnesp.2026.105009"` | Original Deng PubMed/publisher record. |
| `"Effectiveness of early nutritional therapy" "EFFORT" "2016" protocol` | Original2018protocol located; don't mislabel2016. |
| `"10.1016/j.clnesp.2025.03.042" "unibe"` | No verified full UCR text obtained. |
| `"10.1002/jpen.70148" "ClinicalTrials"` | No original registration linkage extracted. |
| `"Urea-to-Creatinine-Ratio and the risk" "feeding"` | No additional original parent identity verified. |
| `"10.1016/j.clnesp.2025.03.042" "protocol"` | Original publisher abstract; no2025-specific prespecification proof. |
| `"Nutritional adequacy is associated" "ISRCTN12233792"` | No direct citation verified; retain the named NEED cohort only. |

### Historical direct access operations — 24 October 2026

- PubMed40122337 and31030981: full original abstract HTML opened.36708732,42806521 and42562321: direct calls sometimes footer-only; original indexed abstracts used and access distinguished.
- Wiley70148 `/doi/` and `/doi/abs/`: unavailable through web tool; no full-text claim.
- NEED parent2022, age2026 and2022correction: original publisher HTML read. Parent supplementary protocol/SAP PDF118pages opened; selective relevant passages read.
- ClinicalTrials.gov study-page HTML sparse; official `api/v2/studies/NCT02517476` and `.../NCT03160547` returned JSON normally via `Invoke-RestMethod`,24October2026. Only public trial metadata used; no credentials.
- ISRCTN study-page HTML holding screen. Official FAQ led to API documentation (`https://bit.ly/ISRCTN_APIdoc_v0_6`), whose single-trial endpoint was then requested normally. `https://www.isrctn.com/api/trial/ISRCTN12233792/format/who` returnedHTTP200, `application/xml`,24October2026. This is the registry's documented export interface, not a challenge workaround.
- A broad EFFORT protocol query surfaced an institutional PDF with title *The impact of nutritional support on malnourished inpatients with aging-related vulnerability*, DOI10.1016/j.nut.2021.111279. First-page identity checked and excluded from UCR full-text access; it must not be mistaken for the2025UCR original.

## 5. What remains / Kalan doğrulama

1. Zhou parent and main Methods are now reviewed; figure/supplementary flow, model diagnostics, cluster variance, Day 7 risk-set timing and historical prespecification remain unresolved. The ward-UCR main article now supplies Figure 3 P values and stratum treatment HRs, but not an interaction-effect CI or exact model denominators. Keep these absent values null; the printed formula/scale conflict also requires clarification.
2. Original/archived registry versions and SAPs require a separate temporal-prespecification comparison. Current registry records alone cannot establish what was public before enrollment or before the2025/2026 analysis.
3. Deng parent-publication identity and subset flow are now verified from the main text; direct registry citation is absent from the capture and remains unverified. Figure images, supplement and full temporal-model diagnostics remain unread. Do not turn the supportive cohort into another randomized intervention contrast or a validated joint-window classifier.
4. Never pool these reports merely because they share a trial family: prognostic UCR effects, randomized feeding contrasts, achieved-intake associations and exploratory treatment interactions estimate different quantities.

**TR:** Bu denetim makale kimliğini, çalışma ailesini ve sayım hatalarını düzeltir. Biyobelirtecin tedavi yanıtını seçtirdiğini veya yazılımın klinik olarak valide olduğunu göstermez.

## EPIC and ECMO-Nutrition extension · 25 October 2026

The selected relationship audit now covers14 catalog records, not14 unique trials. EPIC is its own observational family, NCT05124860, with an explicit unquantified Australian overlap with TARGET Protein. ECMO-Nutrition is an observational substudy linked to the separate EXCEL registry platform; ACTRN12623000304639 was retrospectively registered. Same-family, repeated-setting and partially overlapping publications cannot be pooled as new independent participants. Original access, denominator, age and version-history limits are recorded in [the energy measurement and delivery audit](./ENERGY-MEASUREMENT-AND-DELIVERY-SOURCE-METHODS.md). This extension does not change the frozen2544-candidate search snapshot or complete its human screening.

TR: Çalışma ilişkisi alt kümesi14 kaynak kaydını kapsar; bağımsız deney veya toplam hasta sayısı değildir. İki yeni yayın gözlemseldir; otomatik hedef, doz veya metabolik sınıf üretmez.
