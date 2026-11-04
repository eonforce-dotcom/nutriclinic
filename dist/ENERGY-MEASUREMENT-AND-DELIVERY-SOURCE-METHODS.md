# Energy measurement and delivery — EPIC, ECMO-Nutrition and prolonged ventilation

**Updated 26 October 2026 · English main text / Türkçe notlar.** This note condenses completed original-source audits: EPIC/ECMO-Nutrition source access on 25 October and Fradkin on 26 October. It adds no clinical calculation, dose, metabolic classifier, completed screening decision, formal bias grade or clinical-validation claim. Original article files are not redistributed.

## Four quantities with different meanings

| Quantity | What it represents |
|---|---|
| **Measured energy expenditure (EE)** | Gas-exchange-derived expenditure under the recorded measurement conditions, expressed on a daily scale; not nutrition delivery or an automatically appropriate prescription. |
| **Measurement-time nutrition rate ×24** | A daily-equivalent projection of the formulation/rate running at measurement. It does not establish uninterrupted administration during the preceding or following 24 hours. |
| **Verified actual 24-hour delivery** | Cumulative documented intake from all relevant sources over the specified complete interval, accounting for interruptions/rate changes. Delivery is not absorption or nitrogen retention. |
| **Physician prescription** | The documented treatment target applying to that interval. A delivery percentage uses this denominator; 100% does not establish an individual biological optimum. |

EPIC's [supplement Table 3](https://media.springernature.com/original/springer-static/esm/art%3A10.1186%2Fs13054-026-06102-w/MediaObjects/13054_2026_6102_MOESM1_ESM.docx) derives nutrition from hourly rates ×24; ECMO-Nutrition reports delivery relative to prescribed targets. Neither replaces the verified intake required by [nutrition follow-up](FOLLOW-UP-METHODS.md).

**TR:** Ölçülen harcama, ölçüm anındaki hızın 24 ile çarpımı, doğrulanmış 24 saatlik gerçek teslim ve hekim reçetesi ayrı tutulur. Bunlardan biri diğerinin doğrulaması değildir.

## EPIC: chronology, analytical choices and overlap

[EPIC's original report](https://link.springer.com/article/10.1186/s13054-026-06102-w), PMID 42204563 / DOI 10.1186/s13054-026-06102-w, is an observational calorimetry cohort, **NCT05124860**. The [current official API](https://clinicaltrials.gov/api/v2/studies/NCT05124860) separates submission 25 October 2021, QC 15 November and public posting 18 November. The paper calls 15 November registration. Current start 21 February 2022 differs from the paper's January 2022–May 2024 interval. Public registration precedes both starts; historical analysis timing remains incompletely verified.

The [official combined protocol/SAP](https://cdn.clinicaltrials.gov/large-docs/60/NCT05124860/Prot_SAP_002.pdf) states protocol updated 21 February 2022 and SAP updated 8 April 2025; upload was 9 April 2025, 10:34 without a timezone. Filename `002` does not independently establish “version 2.” No historical-version comparison or independent database-lock/analysis-start timestamp was obtained. A post-measurement SAP update can precede analysis; it proves neither late selection nor complete prespecification.

Important source differences remain visible:

- Protocol/registry prolonged stay **>10 days** versus publication **≥10 days**. A single-site shorter-stay sensitivity comparison does not replace the omitted all-site shorter-stay analysis.
- Protocol weight adjustment used **one-third of excess above ideal weight**; supplement Table 3 uses **25% of excess above ideal weight when BMI >25**, consistent with the paper. These are not interchangeable app defaults.
- SAP proposed **K-means/dynamic-time-warping** grouping; the paper used **latent class analysis (LCA)**, entropy 0.63. Covariate elimination, spline/model selection and AIC comparisons included data-driven choices. Exploratory classes do not establish treatment-response or protein-anabolism categories.
- Conditional missing-data proposals, including imputation/censoring weights, are not proof of implementation. The report describes CRP interpolation, residual CRP missingness 11.5%, no albumin imputation or multiplicity correction, and acknowledges unmodelled informative dropout.

Keep **433 patients/1194 measurements**, **393 patients/1003 observations in the adjusted EE model**, and **269 LCA patients** distinct. Current registry enrollment 714 is another unreconciled denominator. An Australian subset explicitly overlaps TARGET Protein; **138 Australian patients is a regional total, not the overlap count**. Do not pool unique participants or infer that EPIC exposures were randomized. Measurement-time rates, prolonged-stay selection and uneven sampling also prevent a group EE curve from proving an individual's daily requirement or metabolic transition.

## ECMO-Nutrition: current registration versus published implementation

[ACTRN12623000304639](https://www.anzctr.org.au/Trial/Registration/TrialReview.aspx?ACTRN=12623000304639) identifies a prospective observational nutrition substudy linked to EXCEL. Submission 2 March 2023 / public registration 17 March 2023 followed actual recruitment beginning 9 June 2022; the record explicitly labels registration retrospective. Current registry information is not an archived protocol/SAP audit or the actual published method.

Preserve these discrepancies and limits:

- Registry final **150** versus [2026 report 147](https://pubmed.ncbi.nlm.nih.gov/42172821/); the planned exclusion of deaths within 72 hours does not prove why three participants differ.
- [Investigator project page](https://www.monash.edu/medicine/sphpm/anzicrc/research/anzic-rc-nutrition-program/ecmo-nutrition): **nine sites**, versus article/registry **ten hospitals**. Its manuscript-preparation status does not override the published article.
- Registry minimum age **16**; whether every final participant was **≥18** is unverified. Do not change the app's adult scope from this entry.
- Report ward data **37**, ICU energy data 140, overall 147. The number eligible for ward observation is unknown: 37/147 is not a verified completeness rate, and 110 must not be labelled lost follow-ups. ICU/ward records are not independent cohorts.

The outcome is delivery relative to **clinician-prescribed targets**, not measured requirements. Actual target-setting, ratio aggregation, oral-intake estimation and missingness/flow methods remain unread. The registry's six-month associations and historical 2012 comparison are planned questions; their clinical results are not established here. Other EXCEL reports may overlap, but exact overlap totals remain unknown.

**TR:** EXCEL bağlantısı yeni randomizasyon oluşturmaz. 150/147 ve 9/10 farkları varsayımla kapatılmaz; servis verisi bulunan 37 kişinin uygun-izlem paydası bilinmiyor. Reçete açığı otomatik doz veya katabolizma kuralı değildir.

## Fradkin: a single-centre prolonged-ventilation RCT

[Fradkin's original results report](https://doi.org/10.1186/s13054-026-06272-7) concerns one randomized trial at Reuth Rehabilitation Hospital, Tel Aviv. Eligibility required adult age, ventilation ≥21 days and ≥6 hours/day, and stability without vasopressors; irreversible neurodegenerative disease was excluded. This selected rehabilitation population does not represent all acute ICU patients. Weekly calorimetry-guided isocaloric nutrition was compared with a Schofield estimate; both arms underwent weekly calorimetry, received similar protein management and shared weaning care. This was not a protein-dose randomization.

The paper reports **211 randomized/ITT patients: 111 versus 100**, against **326 planned**, and **198 per-protocol (PP)** patients. Pandemic restrictions limited recruitment. Two device-related withdrawals and one unmeasurable oral-intake withdrawal are described; these three do **not** explain the entire 13-person ITT-to-PP difference. The Figure 1 image and arm-specific PP flow were not inspected, so missing reasons cannot be reconstructed from subtraction.

Successful weaning required ≥7 days of spontaneous breathing, continuously or ≥18 hours/day, allowing CPAP ≤6 hours/day. The paper follows weaning from randomization for up to **120 days**, censoring deaths. Success was 58% versus 50%, difference **+8 percentage points (95% CI −6 to +21)**. The **27/31-day medians apply only to the 118 successful patients**; they are not all-randomized-patient medians. The reported comparison P = 0.58 and success interval establish neither superiority nor equivalence. The 198-patient achieved energy-gap analysis was explicitly post hoc and observational. Its association does not inherit randomized treatment status; the gap's sign/implementation also needs clarification before numerical reuse.

The [official current API](https://clinicaltrials.gov/api/v2/studies/NCT04825717) independently links the results and protocol publications to [NCT04825717](https://clinicaltrials.gov/study/NCT04825717). It was read on 26 October; historical versions were not compared. Preserve the source differences:

| Feature | Article | Current registry |
|---|---|---|
| Recruitment start | November 2019 | 1 December 2019, actual |
| Enrollment | 326 planned; 211 randomized | 200, estimated |
| Masking label | Double-blind; prescribing dietitian unblinded | Triple: participant, care provider, investigator |
| Primary follow-up | All 211 ITT; up to 120 days | Within eight weeks; success rate among attempted weaners, time until success or five consecutive failed attempts |
| Survival clock/population | All-cohort ITT; three months explicitly from randomization, with weaning-stratified analyses | Three-month post-weaning survival in successful weaners; 12-month post-weaning survival |

The paper's “registration” date, **15 March 2021**, is the current registry's first submission; first public posting was **1 April 2021**. Public registration therefore followed both reported starts. Current estimated enrollment does not replace the actual paper sample. These outcome/population/clock differences require protocol and history reconciliation; they are not a formal outcome-switch or bias judgment. Current masking labels likewise do not erase the dietitian exception.

The [2023 protocol, DOI 10.1016/j.clnesp.2023.01.003](https://doi.org/10.1016/j.clnesp.2023.01.003), is a verified bibliographic pointer from reference 19 and the current registry, **not a reviewed protocol**. Its publication after recruitment began does not establish when each analysis was fixed. Original protocol/SAP, amendments, archived history, figure images, separate table pages and supplement remain unread. The publisher main Methods/Results, Discussion and Figure 1 caption were read. This trial's protocol cannot be replaced by EPIC's; no pooled effect with that observational cohort is calculated. No individualized dose, metabolic classifier or treatment-benefit claim is added.

**TR:** Bu tek merkezli uzamış ventilasyon RCT'sinde 211 ITT, 326 planlı ve 198 PP paydaları ayrıdır; üç çekilme bütün 13 kişilik farkı açıklamaz. 27/31 gün medyanları yalnız 118 başarılı hastaya aittir. Kayıttaki sekiz hafta ile makaledeki 120 gün ve sağkalımın ventilatörden ayrılma/randomizasyon başlangıçları eşitlenmez. İlk gönderim 15 Mart, ilk kamuya paylaşım 1 Nisan 2021'dir; başlangıçlar da Kasım/1 Aralık 2019 olarak farklıdır. Protokol DOI'si doğrulandı, özgün protokol/SAP ve şekil görüntüleri okunmadı. Bulgular otomatik doz veya metabolik tanı kuralı değildir.

## Access and use in this software

EPIC, 25 October: original publisher Methods/Results/Discussion, current registry, the 12-page protocol/SAP and relevant supplement tables were read. Selected protocol pages were visually checked; supplement OOXML was inspected, with no complete rendered-page/embedded-figure appraisal. Historical versions and raw analysis-code reconstruction remain incomplete.

ECMO-Nutrition, 25 October: complete current ANZCTR read by normal public GET; original abstract/indexed publisher material and institutional information reviewed. [Direct publisher full text](https://www.sciencedirect.com/science/article/pii/S0899900726001528) returned 403; complete main Methods, flowchart and supplement were not obtained. No VETİS, login or challenge bypass was used.

Fradkin, 26 October: original publisher main text and current official registry API reviewed; protocol citation verified. Protocol/SAP, archived history, figure images, separate table pages and supplement were not read. The human-facing registry link is supplied for navigation; the API was the retrieved registry source.

Retain source conditions/time basis, actual intake, prescription and exclusions separately. EPIC/ECMO-Nutrition provide observational context; Fradkin provides a selected single-centre randomized comparison and a distinct post hoc achieved-intake analysis. Their roles do not validate a general optimal dose, day 10 feeding switch, anabolic classifier or causal recovery benefit. Existing calculations and eligibility checks remain unchanged.
