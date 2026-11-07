# PRECISe and TARGET Protein: study identity and methods audit

**PRECISe ve TARGET Protein: çalışma kimliği ve yöntem denetimi**

**Review date:** 24 October 2026 · Europe/Istanbul  
**Scope:** Two existing NutriClinic trial records; original publications, protocols, statistical analysis plans and official registries.

This focused audit verifies study relationships and records the methods documents actually accessed. It does not constitute a systematic review, a complete historical registry comparison, or a formal RoB 2 or GRADE assessment. Previously extracted treatment results were not re-extracted. Protocols, registries and analysis plans are supporting documents for the existing trials; they do not add independent trials or participants to the evidence count.

**Türkçe kullanım notu:** Bu belge iki mevcut çalışmanın kimliğini ve yöntem sürümlerini açıklar. Güncel bir kayıt sayfasının okunması, bütün analizlerin hasta alımından önce belirlendiğini göstermez. Bu denetimde VETİS kullanılmadı; erişim düzeyleri aşağıda kaynak bazında belirtilmiştir.

## 1. Verified study identities

| NutriClinic record | Study family | Verified registration | Randomization unit |
|---|---|---|---|
| `precise-2024` | `precise-nct04633421` | [NCT04633421 — ClinicalTrials.gov](https://clinicaltrials.gov/study/NCT04633421) | Individual participant, in a parallel trial stratified by centre. |
| `target-protein-2025` | `target-protein-actrn12621001484831` | [ACTRN12621001484831 — ANZCTR](https://www.anzctr.org.au/Trial/Registration/TrialReview.aspx?ACTRN=12621001484831) | ICU cluster assigned to a treatment sequence across successive periods. |

PRECISe used four masking labels for **two treatment groups**. TARGET Protein assigned eight ICUs to alternating sequences across four three-month periods. A TARGET participant continued the originally assigned formula if still in the ICU when the cluster changed period; this was not a crossover of treatments within that participant. These design details were checked in the [original PRECISe article](https://orbi.uliege.be/bitstream/2268/328391/1/2024%20Lancet%20-%20Effect%20of%20high%20versus%20standard%20protein%20provision%20on%20functional%20recovery%20in%20people%20with%20critical%20illness%20-%20PRECISe.pdf) and [original TARGET Protein methods](https://jamanetwork.com/journals/jama/fullarticle/2835302).

**Türkçe:** PRECISe bireysel randomize bir çalışmadır. TARGET Protein'de randomize edilen birim YBÜ kümesinin tedavi sırasıdır; hasta içi çapraz geçiş değildir. TARGET Protein, önceki **TARGET enerji çalışması** ve onun kas alt çalışmalarından da ayrılmalıdır. Benzer ad veya ürün kullanımı, aynı randomize hasta grubunu göstermez.

## 2. PRECISe: documents and chronology

### Original results and registration

The original results publication has DOI **10.1016/S0140-6736(24)01304-7** and PMID **39153816**. Its 11-page university-hosted PDF was opened and relevant methods reviewed. It reports recruitment from **19 November 2020 to 14 April 2023**, with **935 participants randomized**. The journal issue is dated **17 August 2024**. The report states that analyses followed database lock and were completed before unblinding; that sequence is **author-reported**, without independent verification of the lock or unblinding timestamps in this audit. [Original article PDF](https://orbi.uliege.be/bitstream/2268/328391/1/2024%20Lancet%20-%20Effect%20of%20high%20versus%20standard%20protein%20provision%20on%20functional%20recovery%20in%20people%20with%20critical%20illness%20-%20PRECISe.pdf).

The [official registry](https://clinicaltrials.gov/study/NCT04633421) was independently read through its [public JSON API](https://clinicaltrials.gov/api/v2/studies/NCT04633421). The following fields describe the current record; an archived 2020 version was not retrieved.

| Registry event or field | Date or value |
|---|---|
| First submitted | 23 October 2020 |
| First publicly posted | 18 November 2020 |
| Actual study start | 19 November 2020 |
| Actual enrollment | 935 |
| Recorded study completion | 3 October 2023 |
| Last update publicly posted | 22 January 2024 |

### Protocol and statistical analysis plan

The published protocol, DOI **10.1186/s13063-023-07380-3**, was opened in the [original journal full text](https://link.springer.com/article/10.1186/s13063-023-07380-3). Its administrative table identifies Netherlands protocol **V4.0** and Belgium protocol **V3.0**, both dated **15 December 2022**. The protocol article was published on **19 June 2023**, after recruitment had begun. It describes the primary outcome and the pooled-data sample-size increase from **824 to 935**; it should not be described as an unchanged, pre-enrollment publication.

The 36-page [official registry SAP PDF](https://cdn.clinicaltrials.gov/large-docs/21/NCT04633421/SAP_000.pdf) was opened and relevant sections checked. Its cover, signatures and registry metadata refer to different events:

| Event or document label | Date or version | Provenance |
|---|---|---|
| SAP cover | V1.0, November 2023 | PDF cover, page 1. |
| Netherlands protocol identified on SAP cover | V5.0, October 2023 | PDF cover, page 1. |
| Belgium protocol identified on SAP cover | V4.0, October 2023 | PDF cover, page 1. |
| SAP document date | 30 November 2023 | Official registry document metadata. |
| Signature dates visible in SAP | 12 and 14 January 2024 | PDF signature page, page 4. |
| SAP upload date | 14 January 2024 | Official registry document metadata. |
| Registry update publicly posted | 22 January 2024 | Official registry status metadata. |

The SAP date printed on the cover is not the signature date, upload date, publication date, database-lock date or unblinding date. These records identify the documents; they do not independently establish the timing of every analytic decision.

### Primary endpoint and follow-up anchor

The primary construct is a longitudinal, baseline-adjusted **EQ-5D-5L health utility score**, not direct measurement of protein anabolism. Preserve the following difference in source wording:

| Source | Follow-up anchor stated in the accessed material |
|---|---|
| Published protocol, SAP and current registry | 30, 90 and 180 days after **ICU admission**. |
| Results publication | 30, 90 and 180 days after **randomization**. |

The original [protocol outcome section](https://link.springer.com/article/10.1186/s13063-023-07380-3), [SAP primary-outcome section](https://cdn.clinicaltrials.gov/large-docs/21/NCT04633421/SAP_000.pdf) and results article were checked. The anchors should not be silently harmonized or described as a proven outcome switch. Reconciliation requires the actual assessment procedures and source records.

**Türkçe yöntem notu:** Kayıt kimliği doğrulanmıştır. Protokolün yayım tarihi, SAP kapak tarihi, imza ve yükleme tarihleri ayrı olaylardır. Veritabanı kilidi ile körlüğün açılmasına ilişkin zaman sırası makalede yazarların bildirimidir; bağımsız zaman damgası denetimi yapılmadı. Takibin YBÜ kabulüne mi randomizasyona mı göre hesaplandığına ilişkin metin farkı açık tutulmalıdır.

## 3. TARGET Protein: documents and chronology

### Original registration

The [official ANZCTR record](https://www.anzctr.org.au/Trial/Registration/TrialReview.aspx?ACTRN=12621001484831) was directly readable. It identifies the study as **ACTRN12621001484831** and reports:

| Registry event | Date |
|---|---|
| Submitted | 23 September 2021 |
| Registered | 1 November 2021 |
| Actual first participant enrollment | 23 May 2022 |
| Actual last participant enrollment | 23 August 2023 |
| Last updated | 29 August 2024 |

The registry labels the study prospectively registered, and these dates place registration before recruitment. Current fields do not establish the original version of every endpoint or analysis model. The primary endpoint includes index-hospital readmissions, is anchored to commencement of enteral nutrition, and assigns zero days to deaths through day 90. The current registry analysis text describes **generalized estimating equations (GEE)**.

### Protocol and revised analysis plan

The protocol is DOI **10.1016/j.ccrj.2023.08.001**, published in 2023. [Indexed original PMC methods](https://pmc.ncbi.nlm.nih.gov/articles/PMC10581259/) and the [author-institution record](https://digital.library.adelaide.edu.au/items/209f682e-4af9-4f13-8f3a-5a89af4afa14) identify the registration and staggered site starts on **23 May and 23 August 2022**. Direct opening of PMC returned a browser-check page. Access is therefore recorded as **indexed original methods**, not a complete direct-HTML protocol review.

The published SAP is DOI **10.1186/s13063-025-08759-0**. Its [original open full text](https://link.springer.com/article/10.1186/s13063-025-08759-0) was read and reports:

| Publication event | Date |
|---|---|
| Manuscript received | 1 August 2024 |
| Accepted | 30 January 2025 |
| Published | 6 February 2025 |

The SAP explicitly **supersedes the analysis plan in the earlier protocol and registration**. It specifies a median/quantile mixed model accounting for cluster, period and delayed-start strata. The article states that recruitment was complete and linkage ongoing at submission. Publication before the results paper does not, by itself, independently establish when each analytic decision was made or when outcome data became available.

### Original results and supplementary access

The original JAMA publication is DOI **10.1001/jama.2025.9110**, PMID **40495743**. It appeared online on **11 June 2025**, in the **22 July 2025** issue. Methods describe use of the SAP. Supplements 1 and 2 were opened as PDFs of **40 and 31 pages**, respectively, but text extraction was corrupted. This audit does **not** claim complete reading of those supplements or assign unverified supplement-version dates. Readable original protocol/SAP publications support the verified details above. Use the [stable JAMA article and its supplement links](https://jamanetwork.com/journals/jama/fullarticle/2835302), not expiring signed CDN addresses.

### Differences requiring reconciliation

| Field | Current ANZCTR record | Original JAMA report |
|---|---|---|
| Enrollment / analysis population | Final enrollment: **3,412**. | **3,411 enrolled; 3,397 analyzed**. |
| Final collection / follow-up | Last data collection: **22 November 2023**. | Final follow-up: **21 November 2023**. |
| Analysis-plan description | GEE. | Refers to the revised SAP, including the quantile mixed model. |

Keep the provenance of each value. The model difference is explicitly addressed by the revised SAP's statement that it supersedes the earlier plan. The count and final-date differences were not independently reconciled; no correction is inferred.

**Türkçe yöntem notu:** Kayıt kimliği ve YBÜ düzeyindeki randomizasyon doğrulanmıştır. Yayımlanan SAP, önceki kayıt/protokol analiz planının yerine geçtiğini açıkça belirtir. Güncel kayıt ile sonuç makalesindeki hasta sayısı ve son takip tarihi farklılıkları kaynaklarıyla birlikte korunmalıdır; varsayımla düzeltilmemelidir.

## 4. Metadata and evidence-counting guidance

For the existing trial records, retain these verified relationships:

| Field | PRECISe | TARGET Protein |
|---|---|---|
| `evidenceId` | `precise-2024` | `target-protein-2025` |
| `familyId` | `precise-nct04633421` | `target-protein-actrn12621001484831` |
| `linkStatus` | `verified` | `verified` |
| `analysisRole` | `parent-randomized-treatment` | `parent-randomized-treatment` |
| `prespecificationStatus` | `documents-identified-historical-comparison-incomplete` | `revised-sap-identified-historical-comparison-incomplete` |
| `independentParticipantTotal` | `null` | `null` |

These records describe two existing trial families. Protocol, registry, SAP and results documents must not be counted as separate trials or added together as new participant cohorts. A verified study relationship does not imply a completed appraisal of selective reporting or of every prespecified analysis.

## 5. Corrections and remaining questions

Exact DOI/title searches using “correction” or “erratum” and the accessible original pages did not identify a verified correction for either results article. The finding is **“not identified in this focused check”**, not “no correction exists.” The linked Lancet comment, DOI **10.1016/S0140-6736(24)01499-5**, is commentary rather than an erratum. Direct PubMed opening for PRECISe returned only a footer; its PMID was identified through original indexing.

Before a formal methods appraisal, retrieve archived registry versions and date-stamped amendments; distinguish approval, receipt, publication, upload, database lock and unblinding. Reconcile the PRECISe follow-up anchor and TARGET population/date differences against the underlying study documentation. No automated protein dose, metabolic classification or evidence-quality grade follows from these metadata.

**Türkçe:** Tarihsel kayıt sürümleri ve değişiklik belgeleri karşılaştırılmadan bütün analizler için “önceden belirlenmiş” sonucu çıkarılmaz. Buradaki doğrulama bir tedavi önerisi veya yazılımın klinik geçerlik kanıtı değildir.

## 6. Exact search queries and access log

All searches below were run on **24 October 2026**. This was a focused search; exhaustive result counts or screening totals were not collected and are not claimed.

```text
"10.1016/S0140-6736(24)01304-7" trial registration
"10.1001/jama.2025.9110" trial registration
"PRECISe" "protein" trial protocol statistical analysis plan
site.anzctr.org.au "ACTRN12621001484831"
"TARGET Protein" "statistical analysis plan" 2024
"01304-7" correction
"jama.2025.9110" correction
"Study protocol for TARGET protein" 2023 147 154
"ACTRN12621001484831" "TrialReview"
"Effect of high versus standard protein provision" "Correction"
"Augmented Enteral Protein During Critical Illness" "Correction"
site.pubmed.ncbi.nlm.nih.gov "10.1016/S0140-6736(24)01304-7"
site.pubmed.ncbi.nlm.nih.gov "10.1001/jama.2025.9110" "Erratum"
site.thelancet.com "01304-7" "Correction"
site.jamanetwork.com "jama.2025.9110" "Correction"
"10.1016/j.ccrj.2023.08.001" PMC
"Study protocol for TARGET protein" "May" "2022"
```

| Source | Access in this audit | Extent and limitation |
|---|---|---|
| PRECISe original results | University-hosted original PDF. | Relevant methods read; not a supplementary-package audit. |
| PRECISe protocol | Original publisher full text. | Registration, versions, outcome and sample-size passages checked. |
| PRECISe SAP | Official ClinicalTrials.gov PDF. | Cover, signature page and relevant outcome/unblinding sections checked. |
| PRECISe registry | Official public API JSON. | Read through a normal `Invoke-RestMethod` request; current record, not historical versions. |
| TARGET Protein original results | Original JAMA full text. | Identity, methods, dates and document links checked. |
| TARGET Protein supplements 1 and 2 | PDFs opened through JAMA. | Text extraction corrupted; no complete-reading claim. |
| TARGET Protein protocol | Indexed original methods and institution record. | Direct PMC reached a browser check; full direct-HTML reading not claimed. |
| TARGET Protein SAP | Original open publisher full text. | Identity, publication dates, outcome and revised-plan passages read. |
| TARGET Protein registry | Direct official ANZCTR HTML. | Current record readable; archived versions not retrieved. |

The retained evidence was limited to original publications, author-institution copies, original protocol/SAP material and official registries. Unrelated asthma **PrecISE**, nonmatching correction DOIs, reviews, informal summaries and proxy-domain copies were excluded from evidentiary extraction. No credentials or access-control workaround were used. The review covered relevant sections; it was not a line-by-line review of every supplementary page.
