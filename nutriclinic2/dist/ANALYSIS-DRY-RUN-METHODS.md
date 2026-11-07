# Synthetic agreement dry run — analysis method

**25 October 2026 · English main text / Türkçe notlar.** This is an offline computational demonstration using explicitly synthetic observations. It does not import clinical records, select a physiological reference, validate the clinical software or approve a study SAP, sample size or acceptance threshold. The output must retain **`clinicalPass: null`**. It contains no binary metabolic classifier, sign-derived diagnosis, ROC endpoint or feeding-dose rule.

The runner is separate from the bedside application. The full source ZIP contains `analysis/README.md`, the local API/CLI and replay fixtures; the hosted method note alone is not an executable package. Existing [research protocol](RESEARCH-PROTOCOL.md), [blank clinical CRF](CLINICAL-VALIDATION-CRF.md) and [metabolic method note](METABOLIC-METHODS-AND-VALIDATION.md) retain the unresolved clinical decisions; this document does not replace them.

**TR:** Bu çalışma yalnız sentetik verilerle sayım ve analiz kodunun yeniden çalıştırılabilmesini sınar. Hastada fizyolojik doğruluk, klinik geçerlik, güvenli mama/doz seçimi veya çalışma için onaylanmış örneklem büyüklüğü göstermez.

## 1. Explicit input contract / Açık veri sözleşmesi

Only JSON with `schema: 'nutriklinik-synthetic-agreement-v1'` and `dataClass: 'synthetic'` is accepted. It is a separate external ledger, **not a current application export or an approved future patient-data schema**. Required configuration is explicit:

| Field | Required value / meaning |
|---|---|
| `construct` | `whole-body-nitrogen-balance` |
| `unit` | `g N/24h` |
| `difference` | `candidate-minus-reference` |
| `estimand` | `eligible-window` |
| `method` | `ba2007-varying-value-anova` |
| `residualAssumption` | `independent-within-patient-synthetic` — a declared synthetic assumption, not a real-data finding |
| `bootstrap` | Explicit integer seed and fixed replicate count, retained in the report |

Each observed candidate/reference value must be finite; **zero is observed data**. Observed measurements must declare the same construct and unit above and cover the same exact 24-hour interval. An observed reference must explicitly assert `independent: true`. That assertion is necessary for this synthetic contract; a Boolean cannot establish actual physiological independence or an error-free reference. Wrong construct/unit or missing independence for an observed reference refuses agreement analysis. An unavailable/unreliable reference never becomes a pair or acquires inferred metadata. Muscle fractional synthesis, UCR, muscle imaging, strength, nutrition criteria and clinical outcomes are not interchangeable whole-body nitrogen-balance measurements.

`start`/`end` timestamps require an explicit UTC `Z` or offset. Durations and equality are assessed as instants: exactly 24 hours and identical logical, candidate and reference bounds. Date-only labels or shifted windows cannot establish a matched pair. No automatic unit conversion, daily rescaling or timestamp repair is inferred.

## 2. Ledger, revisions and denominators / Sayım ve revizyonlar

| Level | Counting/selection rule |
|---|---|
| Patient | Unique `patientId`; screened → eligible → enrolled must be logically nested. Global totals remain global: setting begins at the window, so no setting-specific screened denominator is invented. |
| Admission | Distinct `admissionId` within a patient; repeat admissions remain in that patient's cluster. |
| Logical window | `patientId + admissionId + windowId`; must refer to an enrolled patient. Planned/attempted counts refer to logical windows, not uploaded rows. |
| Revision/reimport | `revisionId` distinguishes revisions. Identical duplicates collapse. Conflicting duplicate revisions invalidate the logical window. Exactly one selected revision is required; the runner does not choose the latest automatically. Unselected revisions do not add pairs. |
| Overlap | Overlapping selected intervals for the same patient invalidate both, including overlap across admissions. Adjacent intervals touching at one boundary are allowed. |
| Event | `exitReason` is `death`, `discharge`, `transfer`, `other` or `null`: descriptive synthetic ledger metadata, not an approved clinical event/censoring policy. |

Keep **ICU and ward separate**. For each setting, report patient/admission counts from the retained ledger and planned, attempted, complete-collection, candidate-observed, reference-available and matched-pair window counts. Pair-contributing patients are a separate count; ledger presence alone does not imply a pair. Retain the exclusion ledger and reasons alongside these denominators. A reason can coexist with another problem in a window; reason counts must not be assumed to form mutually exclusive groups unless the report explicitly defines such a partition. Repeated revisions are never new patient-days.

Candidate statuses are `observed`, `expected_suppression`, `execution_failure` and `unavailable`; reference statuses are `observed`, `unavailable` and `unreliable`. Keep expected suppression, execution failure, unavailable candidate/reference, unreliable reference, incomplete collection, not-attempted and interval/selection problems distinguishable. Death/discharge/transfer do not create zero values. There is no reference imputation, missing-at-random assumption or automatic missingness weighting.

**TR:** Uygulamada hesabı bulunan günler, planlanan tüm toplama günlerinin paydasını sağlamaz. Dış çizelgedeki hasta–yatış–pencere–seçilmiş revizyon zinciri korunur. Tekrar yükleme yeni gözlem değildir; eksik sonuç sıfır değildir. Beklenen baskılama yazılım hatasından ayrı sayılır.

## 3. Quantity and weighting / Hedef ve ağırlıklandırma

For each eligible matched pair, retain **difference `d = candidate − reference`** and **pair mean `a = (candidate + reference)/2`**, both in g N/24h. Positive bias means a more positive candidate value. Correlation and a nonsignificant mean difference are not agreement tests. No approved acceptable-disagreement margin is supplied, so even identity/offset fixtures cannot produce a clinical-pass conclusion.

The explicit computational target is the distribution of **eligible, available matched windows**: raw-pair mean bias weights every included window equally. Patients with more included windows therefore contribute more. It does not estimate unavailable planned windows or an unselected clinical population. Also report a **patient-weighted descriptive sensitivity**, the mean of contributing patients' own mean differences. It answers a different weighting question and does not replace the declared eligible-window target. Do not average all days first and present resulting limits as limits for an individual daily pair.

Pair means/differences support inspection for magnitude-related bias, unequal variability and unusual observations. The dry run does not establish real-data normality, select a serial-correlation model or approve a response to diagnostic failure. Nitrogen balance can be negative or zero; no automatic log transformation is applied.

## 4. Optional repeated-pair ANOVA demonstration

The selected demonstration follows Bland and Altman's changing-value approach, **2007, section 3, printed pp.575–576**, checked in the [original author-hosted paper](https://www-users.york.ac.uk/~mb55/meas/ba2007.htm). It is not automatically suitable for consecutive clinical days. Let `N` be included pairs, `n` contributing patients, `m_i` pairs in patient `i`, `d̄_i` that patient's mean difference and `d̄` the raw-pair grand mean:

```text
MSW = sum_i sum_j (d_ij − d̄_i)^2 / (N − n)
MSB = sum_i m_i (d̄_i − d̄)^2 / (n − 1)
divisor = (N^2 − sum_i m_i^2) / ((n − 1) × N)
variance_between = (MSB − MSW) / divisor
variance_total = MSW + variance_between
LoA = d̄ ± 1.96 × sqrt(variance_total)
```

At least two contributing patients and `N > n` are required. Expose the variance components and status. A negative between-patient component is **non-estimable under this demonstration**, not silently truncated to zero. Exact zero components are allowed for computational identity/constant-offset fixtures. Non-estimability does not authorize switching estimators until an attractive answer appears.

The model requires suitable patient sampling, constant difference variance, an appropriate approximately normal difference distribution for 1.96 limits, and **independent within-patient residual differences**. Daily serial dependence can violate that assumption. [Original method](https://www-users.york.ac.uk/~mb55/meas/ba2007.htm). For this implementation, cluster resampling does not establish those assumptions; real-data diagnostics, a serial model and alternatives require a separate decision.

**TR:** Bu sentetik ANOVA klinik uygunluk kanıtı değildir. Günlük YBÜ ölçümlerinde artıkların hasta içi bağımsızlığı doğrulanmış değildir. Negatif varyans bileşeni gizlenmez; tahmin edilemiyor diye bildirilir.

## 5. Patient-cluster bootstrap and refusal / Küme bootstrap ve reddetme

Within each setting, resample **whole patients with replacement**, keeping all their admissions/windows together and assigning fresh replicate cluster IDs. Stable-ID ordering, seed and fixed replicate count make the computational replay deterministic. Report percentile 95% intervals for bias and valid/failed replicate counts. Optional LoA intervals are reported **only if every bootstrap replicate has estimable variance components**; otherwise suppress those intervals and retain the failure counts. Neither percentile intervals nor this rule establish validated coverage or clinical precision.

Contract violations, missing/invalid values, conflicting revisions, overlaps, shifted intervals and insufficient data must remain explicit; do not manufacture pairs, fill zeros, infer reference metadata or silently fall back to independent-pair limits. The report distinguishes hard contract refusals, excluded ledger windows and non-estimable optional summaries. A synthetic-only label, configuration, counts/reasons, pair-level results, both weightings, components/status and bootstrap details remain part of the auditable output. `clinicalPass` remains `null` in every case.

A hard refusal before set construction reports `analysisSetStatus: 'not_built'`, count values `null` and setting `countsStatus: 'not_evaluated'`; these are not observed zero denominators. A valid built empty ledger has true zero counts. Computed denominators remain available if a later optional numerical summary is non-estimable. Included pairs retain construct/unit, both source descriptions and original candidate/reference intervals; preserve the full input and hash alongside the report.

## 6. Replay boundary and unresolved human decisions

Freeze the input JSON, independently checked expected fixture, code/dependency versions, runner command, report and bootstrap configuration. Identity, offset/scaling disagreement, unequal follow-up, repeated admissions, reimports/revisions, overlap, true zero, missingness, incomplete collection, shifted times, early exit and prohibited-reference cases are **computational test scenarios**, not a proposed clinical sample or acceptance standard. Matching an expected output verifies that defined computation only.

The CLI adds `provenance`: Node version, exact input byte count/SHA-256 and ordered analysis-source file hashes/combined hash. The pure `analyzeSyntheticAgreement` API does not add environment/source provenance. Source hashes cover `analysis/agreement.mjs` and `analysis/run.mjs`; preserve the expected fixture, tests, method documents and full-source manifest separately. Hosted [synthetic input](analysis-synthetic-input.json) and [generated report](analysis-synthetic-report.json) support inspection; executable replay needs the full source ZIP and its `analysis/README.md`.

Before any real study: the clinical/research team must determine the independent same-construct reference and its uncertainty, collection feasibility, eligibility/event policy, primary estimand/weighting, serial model/diagnostics, acceptable disagreement, precision-based sample size, governance and final SAP. These are unresolved decisions; the dry run supplies no approval.

## Method references / Yöntem kaynakları

- Bland JM, Altman DG. *Agreement between methods of measurement with multiple observations per individual* (2007), DOI [10.1080/10543400701329422](https://doi.org/10.1080/10543400701329422). [Original author-hosted page](https://www-users.york.ac.uk/~mb55/meas/ba2007.htm) and [paper PDF](https://www-users.york.ac.uk/~mb55/meas/bland2007.pdf). The checked changing-value ANOVA divisor and serial-independence caveat support the bounded implementation above, not an approved real-patient model.
- [GRRAS original reporting checklist, official EQUATOR-hosted PDF](https://www.equator-network.org/wp-content/uploads/2012/12/GRRAS-checklist-for-reporting-of-studies-of-reliability-and-agreement.pdf): a **reporting checklist**, not study-design approval, a numerical quality score or clinical acceptance limits. The [current GRRAS-COSMIN site](https://www.grras-cosmin.org/) describes an update under development; it is not treated here as a final 2026 standard.

These statistical/reporting references do not add clinical RCTs or independent patients; this separate analysis package does not modify the clinical source catalog.
