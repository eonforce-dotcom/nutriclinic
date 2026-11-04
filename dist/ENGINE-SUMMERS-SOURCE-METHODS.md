# ENGINE and Summers/PROMS — source and method audit

**Checked:** 25 October 2026, Europe/Istanbul. **Interface integration:** 0.3.5. English main text; Turkish interpretation notes below. This document consolidates two completed focused original-source audits. It is not a new search, exhaustive systematic review, formal RoB 2/GRADE assessment or clinical validation. Current registry records, indexed original passages and directly read documents are distinguished. Neither study creates an individual protein-dose rule or a binary anabolic/catabolic label.

## 1. Publication identity and counting / Kimlik ve sayım

| Existing catalog record | Verified family and source basis | Denominators: retain their distinct meanings |
|---|---|---|
| `engine-aki-pcr-posthoc-2026` — *Protein requirements and determinants of protein catabolic rate in critically ill patients with acute kidney injury: A post hoc analysis of the ENGINE randomized controlled trial*; DOI **10.1016/j.clnesp.2026.105039**, PMID **42628743** | ENGINE, **NCT06238674**. Original 2026 Introduction reference 13 and publisher-deposited Crossref `message.reference`, key `10.1016/j.clnesp.2026.105039_bib13`, identify parent DOI **10.1038/s41598-025-97443-z**. Original parent Methods explicitly name the registry. | **80 parent → 78 secondary analysis**; indexed Results attribute the two exclusions to incomplete urine collections. No new randomization or independent cohort. |
| `summers-anabolic-resistance-rct-2026` — *Increasing protein dose does not further augment muscle protein synthesis in critical illness: a randomized, controlled clinical trial*; DOI **10.1093/ajrccm/aamag086**, PMID **42085214** | PROMS, **ACTRN12620000776909**, Royal Adelaide Hospital. The original abstract and indexed publisher Methods explicitly identify the registration; the official current ANZCTR record was directly read. | **29 randomized (14/15) → 21 completed (10/11) → 20 analysed (10/10)** after exclusion of one lower-dose protocol violation. Registry target/final fields are **20**; do not relabel this as 20 randomized or silently reconcile it with the publication flow. |

These are additions to the provenance of **two existing records**. The catalog remains **62 publications**, with **12 selected source records** carrying lineage metadata; neither number is a unique-trial or unique-patient total. See [study-family audit](STUDY-FAMILIES-AND-SCREENING.md).

## 2. ENGINE: strategy, association and unverified PCR method

The parent, *Indirect calorimetry and nitrogen balance guided nutrition therapy in ICU patients with acute kidney injury* (Scientific Reports 15:12558, published 12 April 2025), describes a single-center, open, individual 1:1 superiority trial, blocks of four. It compares a **combined strategy** of indirect-calorimetry-guided energy and nitrogen-balance-guided protein with clinician-directed care. This does not isolate a protein-dose effect. Sources: [original parent Methods](https://www.nature.com/articles/s41598-025-97443-z), [official current registry](https://clinicaltrials.gov/api/v2/studies/NCT06238674).

The 2026 abstract reports 24-hour UUN at 72 hours, mean PCR **1.15 ± 0.42 g/kg/day**, and mortality aHR **0.29 (95% CI 0.08–1.06; p=.062)** for **achieved** protein intake 0.8–1.2 versus <0.8 g/kg/day. These are exploratory post-randomization intake categories, not randomized doses. The CI includes 1; neither equivalence nor a causal mortality benefit is established. Illness, feeding tolerance and subsequent care can influence achieved intake. A cohort mean is not an individual requirement. The indexed Introduction's description “prespecified post hoc” has not been independently checked against a dated SAP. Online publication **21 August 2026** and the **October 2026** issue are separate dates. Sources: [original indexed abstract](https://pubmed.ncbi.nlm.nih.gov/42628743/), [indexed publisher sections](https://www.sciencedirect.com/science/article/abs/pii/S2405457726021364).

| Method item | Read evidence and remaining limit |
|---|---|
| PCR equation | Parent Methods refer to **Supplementary Fig. 1S**; indexed PMC identifies `41598_2025_97443_MOESM1_ESM.docx`. The supplement was **not retrieved/read**. Coefficients, nitrogen conversion and exact 2026 calculation cannot be reproduced from the accessed passages. |
| Weight | Parent Methods prefer actual recorded weight, with ideal weight if unavailable. Exact 2026 denominator, fallback frequency, ideal-weight equation and edema/dry-weight corrections are unverified. |
| Renal handling | Changing BUN/body urea pool, distribution volume, extra-urinary nitrogen and dialysis losses are unverified. Do not assume steady state or import a familiar PCR equation from elsewhere. |
| KRT timing | The 2026 indexed framing is AKI without RRT. The current parent registry excludes RRT before admission but allows management after new RRT; parent Methods repeat calorimetry after new RRT. This does not establish that every parent participant remained RRT-free or define the secondary analysis's censoring/exclusions. |
| Model reproducibility | Full regression specifications, exposure timing, time-varying treatment/RRT handling and multiplicity remain unreviewed. Reported BUN/weight associations do not prove causal determinants; mathematical coupling cannot be assessed without the equation. |

The application's matched-day **UUN+4 approximate nitrogen balance is not established as this study's PCR/PNA method**. Neither formula substitution nor removal of existing AKI/KRT calculation limits is justified by this audit.

**TR:** Ana deney birleşik enerji/protein stratejisini sınar; 2026'nın gerçekleşen alım kategorileri randomize değildir. İki eksik idrar toplaması ayrı bir payda kaybıdır. PCR eki okunmadığı için denklemi, renal düzeltmeleri veya bireysel protein gereksinimini doğrulanmış sayamayız.

## 3. Registry chronology and eligibility / Kayıt zamanı ve kapsam

| Item | ENGINE — current ClinicalTrials.gov record | PROMS — current ANZCTR record |
|---|---|---|
| Submission/public registration | Submitted **7 January 2024**; QC **1 February 2024**; first publicly posted **2 February 2024**, `ACTUAL`. | Submitted **12 June 2020**; registered **30 July 2020**; marked prospective. |
| Start/conduct dates | Paper conduct **4 February 2023–30 January 2024**. Registry actual start **7 March 2023**: an unresolved start-date conflict. First public posting follows both starts and the paper's reported conduct interval. | Registry actual first enrolment **3 November 2020**, last enrolment/data collection **28 October 2022**. Paper screening **7 September 2020–27 October 2022** describes a different event; no invented reconciliation. |
| Currentness | Last update submitted/posted **1/2 February 2024**; status `UNKNOWN`, last known `ACTIVE_NOT_RECRUITING`, verified February 2024. Estimated primary/final completion **15/28 March 2024** must not replace published conduct dates. | Last updated **10 January 2023**. Current text was read; archived versions were not appraised. |
| Primary registered outcome | 28-day mortality after randomization. | Postprandial mixed-muscle fractional synthesis rate (**%/h**), biopsies at **0 and 360 minutes**, 40 versus 20 g. |
| Allocation/masking metadata | Randomized parallel; outcome-assessor single masking. The paper calls the trial open; do not describe all staff as blinded. | Computer-generated parallel allocation; participants/data analysts and external analysing laboratory masked; investigators unmasked. |
| Current eligibility context | Age 18–90; ventilated KDIGO AKI; expected ICU stay >72 h. Exclusions include CKD4/5, RRT before admission, post-cardiothoracic surgery, FiO2 >0.6, pregnancy, BMI <17 or >35/very-high refeeding risk and Child-Pugh C. | Adults in Royal Adelaide ICU, invasive ventilation expected through next day, suitable for enteral feeding and arterial access. Exclusions include dialysis, recent upper-abdominal surgery, treatment limitation, pregnancy, vegan diet/lactose intolerance, Jehovah's Witness status and biopsy bleeding/antithrombotic restrictions. |
| Public protocol/SAP | No public protocol/SAP document section in retrieved API response; `hasResults=false`. An IPD-sharing statement is not a retrieved protocol. | No supporting protocol/SAP upload in the current record. |

Sources: [ENGINE registry landing page](https://clinicaltrials.gov/study/NCT06238674), [official complete current API JSON](https://clinicaltrials.gov/api/v2/studies/NCT06238674), [official current ANZCTR record](https://www.anzctr.org.au/Trial/Registration/TrialReview.aspx?ACTRN=12620000776909), and original papers linked above/below. Eligibility here describes accessed source records, not newly verified final-cohort counts or automatic software eligibility rules.

ENGINE's **retrospective public registration** is established by these dates; the date of an unseen internal protocol is not. PROMS registration precedes the current recorded enrolment start, but its prospective label does not verify the timing of every analysis. Neither audit compares historical registry versions or assigns a formal risk-of-bias score.

**TR:** ENGINE'in makale/kayıt başlangıç farkı korunur; sonradan kamuya açılan kayıt “prospektif” diye sunulmaz. PROMS'un güncel son örneklem alanı 20'dir; makaledeki 29 randomize/21 tamamlayan/20 analiz ayrımı bununla kapatılmaz. Güncel kayıt, eski sürümlerin veya son kohortun eksiksiz doğrulaması değildir.

## 4. PROMS: acute muscle synthesis is a distinct construct

Twenty analysed ventilated adults received a single **40 versus 20 g intraduodenal whey exposure over one hour**, with tracer/biopsy assessment over **six postprandial hours**. Adjusted muscle synthesis difference **0.007 %/h (95% CI −0.003 to 0.016; p=.152)** does not demonstrate superiority or equivalence. Online **24 February 2026** differs from the May issue date. Sources: [original indexed abstract](https://pubmed.ncbi.nlm.nih.gov/42085214/), [indexed original publisher Methods/Results](https://academic.oup.com/ajrccm/article/212/5/964/8496139), [publisher-deposited bibliographic metadata](https://api.crossref.org/works/10.1093%2Fajrccm%2Faamag086).

Indexed original Methods/Statistical analyses describe replacement of withdrawals to obtain complete primary data, complete-case analysis without imputation, and no overall multiple-testing adjustment. **Registered whole-body breakdown/balance and several metabolic/hormonal outcomes were not analysed.** A within-arm fasting/postprandial comparison was added at trial completion before analysis; no prepublished SAP was available. Supplementary Table S1/Methods and final protocol/amendment history remain unread. These are reported methods and access limits, not a completed selective-reporting or RoB judgment. [Original publisher sections](https://academic.oup.com/ajrccm/article/212/5/964/8496139).

**Interpretation:** short-window mixed-muscle fractional synthesis is not net muscle balance, because breakdown is separate. Plasma amino-acid availability is not incorporation or net retention. Separately registered but unanalysed whole-body outcomes cannot be reported as measured whole-body net balance. A single postpyloric exposure does not validate longitudinal daily g/kg needs, continuous enteral feeding, later rehabilitation, clinical efficacy or a binary metabolic classifier. It cannot serve as an interchangeable reference for the app's approximate matched-day UUN+4 balance. These limits do not prescribe a higher or lower dose.

**TR:** Altı saatlik kas sentezi yanıtı, net kas dengesi veya günlük/uzun dönem protein gereksinimi değildir. Kayıtta bulunan fakat analiz edilmeyen tüm-vücut yıkım/dengesi sonuç gibi sunulmaz. İstatistiksel olarak anlamlı bulunmayan gruplar arası fark eşdeğerlik kanıtı oluşturmaz.

## 5. Exact access achieved / Gerçek erişim düzeyi

| Original/official URL | Access achieved on the completed audits; limit |
|---|---|
| [ENGINE PubMed](https://pubmed.ncbi.nlm.nih.gov/42628743/) | Indexed original abstract/identifiers/dates; direct opening returned HHS footer only. |
| [ENGINE 2026 publisher](https://www.sciencedirect.com/science/article/abs/pii/S2405457726021364) | Indexed original Introduction, setting/design, Results and Discussion snippets; direct **403**. Complete 2026 methods/tables not read. |
| [ENGINE deposited references](https://api.crossref.org/works/10.1016%2Fj.clnesp.2026.105039) | Ordinary public JSON; `message.reference`/bib13 used only for parent bibliographic identity. No deposited text-mining links followed. |
| [ENGINE parent journal](https://www.nature.com/articles/s41598-025-97443-z) | Indexed original “Trial design” Methods/publication metadata; direct opening redirected to inaccessible publisher cookie authorization. |
| [ENGINE parent PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC11993687/) | Indexed original Methods/supplement filename; initial article shell followed by browser check. No complete-full-text or supplement-read claim. |
| [ENGINE official API](https://clinicaltrials.gov/api/v2/studies/NCT06238674) | Complete current public JSON read normally; not archived registration. |
| [PROMS PubMed](https://pubmed.ncbi.nlm.nih.gov/42085214/) | Indexed original abstract/metadata; direct opening footer-only. |
| [PROMS original OUP](https://academic.oup.com/ajrccm/article/212/5/964/8496139) | Indexed original Methods, Statistical analyses, Results and Discussion; direct web/CDN failure and ordinary GET **403**. No direct full-text or supplement access. |
| [PROMS official ANZCTR](https://www.anzctr.org.au/Trial/Registration/TrialReview.aspx?ACTRN=12620000776909) | Complete current record read through ordinary public GET after web-tool timeouts; no history/protocol upload appraised. |
| [PROMS deposited metadata](https://api.crossref.org/works/10.1093%2Fajrccm%2Faamag086) | Bibliographic corroboration of DOI/title/online/print identity; deposited PDF links not opened. |
| [Adelaide author-thesis metadata](https://digital.library.adelaide.edu.au/dspace/handle/2440/136600) and [public PDF](https://digital.library.adelaide.edu.au/server/api/core/bitstreams/2ec7de81-2376-45a9-9209-3b975f44d617/content) | Metadata/front matter/indexed contents identify PROMS protocol section 2.3 in the 2022 thesis. Chapter body/exact registration/version linkage not read; later section fetches timed out. **Protocol lead, not verified final protocol/SAP.** |
| [Correspondence PMID42462115](https://pubmed.ncbi.nlm.nih.gov/42462115/) and [OUP original](https://academic.oup.com/ajrccm/article/212/10/2669/8735996), DOI10.1093/ajrccm/aamag381 | Indexed original metadata/text for *Protein responsiveness during critical illness*: Comment/Editorial, not corrigendum/new trial or evidence of later-phase efficacy. |
| PROMS PMC | **Not requested.** A previous note reports release 1 May 2027; this audit did not independently recheck that date or bypass access. A PMCID is not proof of current full-text access. |

No VETİS/session attempt, author contact or restricted-access/challenge bypass was used in these two audits. Reviews, registry mirrors and commercial summaries were not used to establish their design/results. Bounded queries identified no verified new correction; this is not proof that none exists.

**25 October additional supplement-access check:** an ordinary public PMC article response exposed the [exact original supplement URL](https://pmc.ncbi.nlm.nih.gov/articles/instance/11993687/bin/41598_2025_97443_MOESM1_ESM.docx). The asset response was an HTML download challenge, not a DOCX; the journal also returned a client challenge. No challenge was executed. The asset's location is directly confirmed, but its equation/units/renal handling remain unread. This access event does not establish that the parent equation was used identically in the 2026 analysis, change a calculation gate or create a PCR dose rule.

## 6. Selected reproducible query log / Seçilmiş sorgu kaydı

The following **selected exact queries were executed on 25 October 2026** during the completed audits, followed by original/official URLs in section 5. They were not rerun to write this document. This is a partial log of focused discovery, not reproducible exhaustive screening: result counts, excluded-study totals and a PRISMA flow were not recorded and are not invented.

| Exact query | Purpose / disposition |
|---|---|
| `"10.1016/j.clnesp.2026.105039"` | Locate original secondary report. |
| `"s41598-025-97443-z" "NCT"` | Parent Methods explicitly identify NCT06238674. |
| `"s41598-025-97443-z" "nitrogen" "protein" "formula"` | Locate equation reference; supplement content remains unread. |
| `"NCT06238674" "SAP" OR "statistical analysis plan"` | No dated standalone SAP verified. |
| `"41598_2025_97443_MOESM1_ESM.docx"` | Supplement identity lead; no equation-content extraction. |
| `"10.1016/j.clnesp.2026.105039" "correction" OR "corrigendum" OR "erratum"` | No verified new correction identified; not an absence claim. |
| `"10.1093/ajrccm/aamag086" trial registration` | Explicit PROMS/ACTRN identity in originals. |
| `"ACTRN12620000776909" protocol masking primary outcome` | Current official registry outcome/masking/eligibility. |
| `"aamag086" supplementary Table S1` | Supplement lead; underlying file not retrieved. |
| `site:digital.library.adelaide.edu.au "2.3" "PROMS" "protocol"` | Thesis contents lead; chapter/version not verified. |
| `"aamag086" correction corrigendum erratum` | Correspondence distinguished from correction; no verified correction identified. |

## 7. Unresolved before thesis extraction / Tez için açık işler

1. **ENGINE calculation:** obtain and read original Supplementary Fig. 1S and full 2026 methods/tables; extract the exact PCR/PNA equation, units, weight/renal handling and collection/exposure times. Keep absent details missing rather than reconstructing them from another equation.
2. **ENGINE timing:** compare original archived registry versions and any dated protocol/SAP with the paper's start-date conflict and the secondary analysis. Current public registration chronology is established; internal prespecification is not.
3. **PROMS reporting:** retrieve Table S1/Methods, verified final protocol/SAP/amendments and archived registry history. Preserve 29/21/20 plus registry-final-20; assess unanalysed registered outcomes and added comparisons with their chronology.
4. **Independent appraisal:** a thesis team must define eligibility, independent extraction/adjudication, complete search/archive procedures and an appropriate risk-of-bias framework before claiming a systematic review or formal grade. Family linkage and sample size alone do not supply that appraisal.

For the broader comparison see [EVIDENCE-COMPARISON-AND-SEARCH.md](EVIDENCE-COMPARISON-AND-SEARCH.md); for application constructs see [METABOLIC-METHODS-AND-VALIDATION.md](METABOLIC-METHODS-AND-VALIDATION.md). These source relationships refine interpretation and reproducibility, without validating a feeding algorithm or adding independent participants.
