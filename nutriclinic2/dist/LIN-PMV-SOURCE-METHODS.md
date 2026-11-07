# Lin PMV — protein, rehabilitation and NMES source methods

**Original-source review: 26 October 2026 · Local 0.3.17 documentation · EN / TR.** Report: *Effects of protein, muscle rehabilitation and trunk neuromuscular electrostimulation in patients with prolonged mechanical ventilation: a prospective, randomized controlled pilot study*, DOI [10.1080/07853890.2026.2728179](https://doi.org/10.1080/07853890.2026.2728179), [PMID 42773805](https://pubmed.ncbi.nlm.nih.gov/42773805/). Online 22 September 2026; December 2026 issue. The issue date is not recruitment timing or a new randomization.

## Actual access and applicability

The first normal public DOI navigation reached the [open-access publisher main HTML](https://www.tandfonline.com/doi/full/10.1080/07853890.2026.2728179), without login, proxy or CAPTCHA solving. Complete Methods/Results, selected Discussion/limitations, Tables 1/2 with complete footnotes and the complete Figure 1 image were inspected. The earlier PMC browser check remains specific to that route; it was not retried. Supplementary material and historical registry versions were not read. This note condenses the retained source audit, not another retrieval or formal risk-of-bias assessment.

This was one **24-bed respiratory care centre in Taiwan**, recruiting 18 September 2023–18 September 2024: stable nasogastrically fed adults **≥20 years**, ventilated **>21 days**. It concerns late, stable PMV, not an unselected early acute ICU or all neurological patients. Qualified neurological exclusions must retain their actual wording rather than become a blanket app exclusion.

## Arms, flow and analysis populations

Methods describe **3:3:3:1** assignment. Figure 1 reports **195 assessed − 66 ineligible − 29 declining = 100 randomized**. Four arms added interventions incrementally; the paper expressly calls this **additive, not factorial**.

| Arm | Randomized / primary ITT | Withdrawals | Weaned | Deaths |
|---|---:|---:|---:|---:|
| 1: usual care + high protein | 30 | 4 | 20 | 5 |
| 2: arm 1 + core rehabilitation | 30 | 2 | 22 | 5 |
| 3: arm 2 + trunk NMES | 30 | 1 | 26 | 4 |
| 4: usual care | 10 | 2 | 3 | 3 |

**91 completed the protocol; the paper states that all 100 were retained in primary ITT analyses.** Withdrawal reasons are reported overall, not cross-tabulated by arm. ITT membership does not establish complete measurements for every serial laboratory/functional outcome. A nonsignificant completer/noncompleter baseline comparison does not eliminate attrition concerns.

The study specifies **1.5 g/kg ideal body weight/day** as a protein target; reported delivered means differ from the prescription. This is a study target, not an individually validated optimum. Exact arm content matters: the combined-package comparison cannot isolate amino acids, protein, rehabilitation or NMES. Conditional incremental comparisons require their own estimates and uncertainty.

## Outcomes, uncertainty and nitrogen equation

Reported ventilation-duration means were **56.5 / 57.1 / 41.1 / 74.4 days**, arms 1–4. Table 2 gives Dunn-adjusted P = **0.0006** for arm 3 versus usual care, but **0.0962** for high protein alone versus usual care. Global, adjusted pairwise and within-group pre/post tests are different results. No treatment-effect CI is supplied; the exact ventilation-time origin remains unresolved. Do not convert the arm ordering into a tested dose-response or equivalence conclusion. Seventeen deaths occurred overall; the authors attributed none to intervention, which is narrower than independent safety validation or mortality benefit.

The original outcome methods use:

```text
Approximate nitrogen balance (g N/day)
  = EN protein (g/day) / 6.25 − [24-hour UUN (g N/day) + 4]
```

This documents **original clinical use of the approximate equation**, not its derivation, independent measurement validation or proof that every app guard is source-validated. The study's EN setting does not verify other intake routes, complete urine collection, RRT losses or every unmeasured loss assumption. Group nitrogen-balance means were similar; estimated retention and respiratory recovery do not establish individual net muscle anabolism. The authors' proposed “stable anabolic state” interpretation is not a validated classifier or feeding-readiness rule.

## Remaining source distinctions and software boundary

Current registration [NCT05932134](https://clinicaltrials.gov/study/NCT05932134) treats ventilation duration as secondary; the final article calls it primary alongside weaning. The [public protocol/SAP PDF](https://cdn.clinicaltrials.gov/large-docs/34/NCT05932134/Prot_SAP_000.pdf) was reviewed in selected methods/statistics sections and selected complete page images, separately from the final article. Protocol versus article details differ in pulse-width/intensity, ideal-weight wording, power calculations and statistical methods. Current documents and upload dates do not establish historical prespecification. Recruitment, admission-duration, completion and post-intervention clocks remain distinct. Eligibility prints MIP in mmHg while Table 1 reports PiMax in cmH₂O; no conversion or rule is implemented from that inconsistency.

The paper describes not reducing study protein for renal failure. That is **not** a NutriClinic renal exception or an evidence-backed individual prescription; RRT-specific numbers/losses and collection validity remain unestablished. Reference 29 identifies the [previous 2022 RCC weaning-protocol report](https://pubmed.ncbi.nlm.nih.gov/36297079/), whose original abstract describes an observational record analysis, not verified reuse of this randomized cohort. Participant overlap remains unquantified; no independent participant total is added.

No clinical target, dose, neurological/renal gate or binary metabolic state changes. See [clinical-module methods](./CLINICAL-MODULES-METHODS.md), [metabolic limits](./METABOLIC-METHODS-AND-VALIDATION.md) and the [independent-reference worksheet](./REFERENCE-FEASIBILITY-DECISION-RECORD.md). The finding supports bounded source context; it does not complete human screening.

## Türkçe özet

26 Ekim'de özgün yayıncı ana yöntem/sonuç, Tablo 1/2 dipnotları ve Şekil 1 incelendi. Önceki PMC kontrolü bütün yayıncı erişiminin engelli olduğu anlamına gelmez; ekler ve tarihsel kayıt okunmadı. Çalışma stabil, NG ile beslenen ≥20 yaş, >21 gün ventilasyonlu tek merkez hastalarındadır. **100 randomize, 91 protokol tamamlayan ve birincil ITT 100** ayrı paydalardır; tüm seri ölçümlerin eksiksiz olduğu çıkarılmaz. Protein/rehabilitasyon/NMES eklemeli kollardır; faktöriyel veya izole aminoasit etkisi değildir. EN protein/6,25 − (UUN+4) özgün kullanım bağlamıdır; bağımsız anabolizma doğrulaması değildir. “Stabil anabolik durum”, 1,5 g/kg ideal ağırlık hedefi ve çalışmanın renal uygulaması otomatik tanı, doz veya uygulama istisnasına çevrilmez.
