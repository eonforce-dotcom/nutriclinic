# Offline synthetic agreement dry run

This dependency-free Node package demonstrates ledger selection, repeated-window agreement calculations and patient-cluster resampling using **synthetic data only**. It is separate from the bedside app and is not a clinical-record import route, physiological validation or approved study SAP. Every report retains `clinicalPass: null`; no classifier, feeding dose, clinical threshold or sample size is selected.

Türkçe: Bu araç yalnız sentetik veriyle teknik yeniden çalıştırma içindir. Uygulamanın hasta JSON/CSV çıktısı bu sözleşmenin girdisi değildir; gerçek hasta verisi kullanılmaz. Beklenen sayısal sonuca ulaşmak klinik geçerlik göstermez.

## Run locally

From the repository root, with Node.js available:

```sh
node analysis/run.mjs --input analysis/fixtures/synthetic-agreement.json
node analysis/run.mjs --input analysis/fixtures/synthetic-agreement.json --output analysis/report.json
```

The CLI accepts `--input <file>` and optional `--output <report>`. It refuses overwriting the input or the two analysis implementation files. Choose a separate generated-report path and preserve the fixture/oracle. `analysis/report.json` above is a local example, not a checked-in result or clinical deliverable. The independent fixture checks below verify defined computations; successful command execution alone is not a validation pass.

| Exit code | Meaning |
|---|---|
| `0` | Help or completed report generation; a report may still contain non-estimable optional summaries. This is not a clinical pass. |
| `2` | Contract refusal, invalid JSON or CLI usage error. |
| `1` | Input/output or unexpected execution error. |

API:

```js
import { ANALYSIS_VERSION, analyzeSyntheticAgreement } from './analysis/agreement.mjs';
const report = analyzeSyntheticAgreement(syntheticInput);
```

## Input and report contract

See [analysis method specification](../dist/ANALYSIS-DRY-RUN-METHODS.md) for the calculation, denominator rules, assumptions, failure handling and original methodological references. Required schema/data class are `nutriklinik-synthetic-agreement-v1` / `synthetic`. Required configuration declares whole-body nitrogen balance, `g N/24h`, candidate-minus-reference, eligible-window weighting, `ba2007-varying-value-anova`, the synthetic within-patient residual-independence assumption, seed and replicate count. Do not omit metadata or substitute app exports.

An external patient/admission/window/revision ledger supplies denominators. Reimports are not new windows; exactly one revision must be selected. Matching requires finite observed values, an asserted independent same-construct/unit reference and equal exact 24-hour intervals with explicit time zones. Zero is valid. ICU and ward remain separate; repeated admissions stay within patient. Missing/suppressed/failed/unreliable measurements and exit events are not zero-filled or imputed.

The report preserves the synthetic-only boundary, configuration, global patient denominators, setting-specific window denominators and exclusion ledger, matched-pair means/differences, eligible-window bias, descriptive patient-weighted sensitivity, optional repeated-pair ANOVA components/LoA status and bootstrap seed/count/failure details. A prohibited reference refuses agreement; excluded windows and non-estimable summaries remain visible. Negative between-patient variance is not silently truncated. LoA bootstrap intervals are suppressed if any replicate is non-estimable. No output declares a real clinical pass.

| Report field | Meaning |
|---|---|
| `analysisVersion`, `status`, `errors`, `syntheticOnly`, `clinicalPass` | Standalone analysis version (`0.1.0` initially), `ok` or `refused`, contract errors, synthetic-only assertion and always-null clinical pass. `ok` is computational report status; the analysis version is separate from the app/clinical-engine version. |
| `contract`, `patients` | Explicit analysis choices; global total/screened/eligible/enrolled counts. |
| `settings.icu`, `settings.ward` | Separate counts, pair results, bias, ANOVA and bootstrap summaries. |
| `ledger` | Retained logical windows, revision/selection state and exclusions. `reasonCounts` counts applicable reason occurrences, which need not be mutually exclusive. |
| `analysisSetStatus`, setting `countsStatus` | Hard refusal before construction: `not_built` / `not_evaluated`, with null counts. A built valid ledger: `built` / `computed`, including true zero counts for a valid empty ledger. |
| `bias.eligibleWindow`, `bias.patientWeighted` | Equal-window primary descriptive bias and equal-patient weighting sensitivity within a setting. |
| `anova.status`, `reason`, `components`, `loa` | Estimability, disclosed failure, variance terms and point limits. |
| `bootstrap` | Separate valid/failed counts for bias and ANOVA; bias intervals can remain when optional ANOVA fails. `loaCI` requires an estimable point and every replicate. |

Within each setting, the generator uses `mulberry32`, reset to the configured seed, with patient clusters sorted by stable ID. Percentiles use linear interpolation at .025 and .975. This defines a deterministic computational choice; it is not an inferential endorsement.

Included pairs retain construct/unit, both source descriptions, original input intervals and the explicit synthetic reference-independence assertion. The input/hash remains the canonical companion archive; no field establishes an acquired physiological reference.

The CLI adds `provenance`; the pure API does not. Fields are `nodeVersion`, `inputSha256`, `inputBytes`, `analysisFiles`, `analysisSha256`, `analysisFileSha256` and `analysisHashAlgorithm`. Input hashes refer to the exact file bytes. The ordered `analysisFiles` list is `['analysis/agreement.mjs', 'analysis/run.mjs']`; the combined SHA-256 hashes UTF-8 text formed as `file + '\n' + fileContents` for each ordered file, joined with `'\n'`, with no newline normalization. This is source identity, not a scientific-validity certificate. These two-file hashes do not cover the fixture oracle, tests or method documents: preserve those with the full-source ZIP/manifest.

Computational guards allow at most 10,000 patients, 50,000 raw window rows and 10,000 bootstrap replicates; the seed is an unsigned 32-bit integer. These bounds protect the synthetic runner and do not propose a clinical sample size. Stable sorting uses explicit Unicode code-point order, not the host locale.

## Reproducibility and interpretation

Use the **full source ZIP**, extract it, and run from its repository root; the hosted Markdown/JSON downloads alone do not include the executable. This analysis path needs Node built-ins and no extra analysis dependencies. The research downloads `analysis-synthetic-input.json` and `analysis-synthetic-report.json` are an input/report pair; the source fixture is `analysis/fixtures/synthetic-agreement.json`.

| Source fixture | Purpose |
|---|---|
| `analysis/fixtures/synthetic-agreement.json` | Synthetic ledger with unequal follow-up, repeat admissions, true zero, unselected revision/reimport, overlap, unavailable/suppressed/failed measurements, incomplete collection, shifted interval and early exit. |
| `analysis/fixtures/synthetic-expected.json` | Independently derived ledger counts, pair differences/means and point-estimator algebra. It is **not** copied implementation output and supplies no independent bootstrap CI or coverage oracle. |

The expected file has 22 raw rows → 20 logical windows; global counts are 9 total / 8 screened / 7 eligible / 6 enrolled. ICU has 16 planned / 15 attempted / 14 complete / 6 pairs, window bias 4 and patient-weighted sensitivity 5; ward has 4 pairs and both biases 2, in g N/24h. These are explicit computational fixtures, not clinical targets. The full reason/count and variance-component assertions belong to the expected JSON.

Replay the independent fixture checks from the source root:

```sh
node --test tests/analysis-fixture.test.mjs
```

On 25 October 2026, the independent reviewer reported **5/5 passing** against the prewritten oracle, without changing expected values after implementation execution. The checks cover ledger/point algebra, order-invariant clustering/uncertainty availability and prohibited/non-independent reference refusal. They do not establish physiological validity or bootstrap coverage.

Keep input, expected file, code/version, command and generated report together. The fixture sample sizes and differences are arithmetic cases, **not a proposed clinical recruitment target or acceptable disagreement**. Whole-patient bootstrap clusters retain admissions/windows; a deterministic seed enables replay but does not validate the variance model or CI coverage. Daily serial dependence, magnitude-dependent bias and clinical feasibility require separate investigation and a prespecified study method. The ANOVA residual-independence assumption is asserted only for this demonstration.

The [research CRF](../dist/CLINICAL-VALIDATION-CRF.md) and [metabolic methods](../dist/METABOLIC-METHODS-AND-VALIDATION.md) describe outstanding real-study reference, adjudication, governance, estimand, event-policy and sample-size decisions. This package does not settle them. Statistical references do not alter the 62-publication clinical catalog.
