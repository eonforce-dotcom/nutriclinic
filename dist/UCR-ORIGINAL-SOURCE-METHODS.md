# Urea–creatinine ratio — ICU and medical-ward source methods

**Source reviews: 25 October 2026 · document update: 26 October 2026 · English main text / Türkçe özetler.** Authorized institutional access enabled review of original main-text Methods, Results and displayed tables for [Zhou et al., DOI 10.1002/jpen.70148](https://doi.org/10.1002/jpen.70148), PMID 42806521. Zhou Figures 1–3 were collapsed and supplements unread. The medical-ward addition uses the public institutional Diethelm/EFFORT original, including Figure 3; VETİS was not needed for that paper. Earlier abstract-only access remains historical. This note paraphrases completed reviews without redistributing licensed text, raw captures, images or session-specific institutional/proxy access links. No formal bias grade or completed-screening claim is made.

## Zhou / NEED ICU analysis: family, analytes and timing

Original Methods explicitly identify **NEED / ISRCTN12233792**: ICUs received a feeding-guideline implementation strategy or usual care. This secondary report describes 2772 enrolled across 90 Chinese ICUs during 26 March 2018–4 July 2019. [Public registration](https://www.isrctn.com/ISRCTN12233792) identifies the parent; current/historical registry versions were not newly appraised for this update. Neither UCR nor achieved protein intake was randomized. Adjustment for NEED allocation does not turn their associations into a randomized protein-dose comparison.

The study ratio uses **serum urea**, not BUN, with creatinine converted to the same molar concentration:

```text
UCR (mmol/mmol) = urea (mmol/L) / [creatinine (µmol/L) / 1000]
```

The factor 1000 is a unit conversion, not a biological correction. This study scale must not be numerically overlaid on the app's unchanged mass-based urea/creatinine or separately labelled BUN/creatinine ratios. Formula verification supplies no clinical cutoff or dosing conversion.

Study Days 1 and 7 follow enrolment, which occurred within 24 hours of ICU admission; they are not arbitrary specimen-date labels. Day 7 analyses retain **Day 1 AKI stratification**, rather than newly adjudicating Day 7 AKI. Later-acute protein exposure is mean **Days 3–7** oral/enteral plus parenteral nutrition, excluding albumin, divided by body weight. The read definition does not establish actual/dry/ideal/adjusted weight selection.

Baseline AKI used operational creatinine/KRT criteria: the creatinine definition used an increase ≥26 µmol/L or a value ≥1.5 times a reference. With pre-illness values unavailable, the reference was 90 µmol/L for females / 110 µmol/L for males. Urine-output criteria were unused. Incomplete CKD history can affect AKI/CKD classification; this is not complete patient-specific KDIGO adjudication or an app AKI diagnosis. Assay harmonization and exact sampling windows remain unestablished by the read main text.

## Zhou: separate analysis sets and availability

| Set | Reported participants |
|---|---|
| Day 1 | 2613: 1987 without / 626 with baseline AKI |
| Day 7 | 2516: 1926 without / 590 with baseline AKI |
| In both sets | 2512 |

Consequently 101 Day 1-only and 4 Day 7-only records follow by subtraction; these are derived counts, not independently inspected supplementary exclusion categories. Day 7 is **not a fully nested Day 1 subset**. Do not add the sets as independent samples or assume complete paired trajectories.

Treating teams determined laboratory testing; Days 2–6 lacked sufficient completeness. Eligibility required available analysis variables, and deaths before Day 7 were ineligible for that set. The reviewed main text describes no imputation/missingness-weighting procedure. Unread Figure S1/Table S5 are needed to resolve missing-variable exclusions, the four Day 7-only cases and death-versus-missing-data flow. The separate adjusted linear model's sample size is not expressly established by its displayed table.

Day 7 survivors are related to mortality 28 days **from enrolment**. Exact Day 7 risk-set entry, landmark/reset or delayed-entry implementation remains unclear. Survivor/data-availability selection therefore limits bedside interpretation; this uncertainty does not establish that a particular statistical error occurred.

## Zhou: models, information availability and actual evidence

[Original main Methods/Results](https://doi.org/10.1002/jpen.70148) describe spline Cox models with three/four knots, without supplying exact knot positions. Clinical covariate selection also used observed correlation and collinearity checks. Proportional-hazards checks are described, but results are in unread Tables S3/S4: no claim that assumptions passed is warranted. ICU-cluster variance handling is not described in the reviewed main text and cannot be inferred from the parent's cluster randomization. No multiplicity adjustment was made.

Low/middle/high UCR groups are **data-derived**: the middle region surrounds a fitted risk minimum within 1.05 times that predicted minimum. Spline references differ between models. These definitions are not externally fixed clinical reference intervals; unread figures must not supply invented numeric thresholds.

The Day 1 adjustment includes GI bleeding documented at **any time during Days 1–7**. It therefore cannot be assumed to use only information available at an actual Day 1 prediction time. Separately fitted AKI curves are not automatically a formal interaction test.

Table 2 associates each additional achieved 1 g/kg/day over Days 3–7 with **+19.74 mmol/mmol Day 7 UCR, 95% CI 7.24–32.25**. This is an observational intake association. The reviewed main text does not describe a UCR-by-randomized-treatment interaction or UCR-guided feeding trial; unread supplements cannot establish global absence of other analyses.

Direct muscle-mass measurement was unavailable in the reported analysis. Prognosis, a spline minimum or intake-associated UCR change cannot establish whole-body nitrogen balance, muscle synthesis/breakdown, binary metabolic status or benefit from UCR-guided supplementation. **App ratios, thresholds, renal/loss checks and dose rules remain unchanged.**

## Zhou / NEED — Türkçe özet

Özgün ana metin NEED bağlantısını ve molar üre/kreatinin tanımını doğrular; uygulamanın kütle oranları değişmez. Gün 7 kümesi erken ölenleri içermez ve Gün 1'in tam alt kümesi değildir. AKI tanımı gerçek hastalık öncesi kreatinin yerine cinsiyete göre referans kullanır. Gün 1 modelindeki sonraki günlerin kanama bilgisi, yatış anı tahminine doğrudan taşınamaz. Ana metin ve tablolar okunmuştur; şekiller/ekler okunmamıştır. Prognoz ve gerçekleşen alım ilişkisi, UCR’ye göre mama veya doz seçiminin yararını kanıtlamaz.

## Diethelm / EFFORT medical-ward analysis

[Diethelm et al., DOI 10.1016/j.clnesp.2025.03.042](https://doi.org/10.1016/j.clnesp.2025.03.042) was reviewed through the [public Wageningen Taverne original](https://edepot.wur.nl/691468): institutional cover plus eight article pages. Main Methods, Tables 1/2, Figure 3 and limitations were read, with rendered pages visually checked on 25 October 2026. This supersedes abstract-only access for the main paper; supplementary flow/models and a secondary-analysis SAP remain unverified. Raw article files/images stay outside this documentation package.

### Selected population and variable follow-up

The paper explicitly identifies **EFFORT / NCT02517476**, the eight-centre Swiss medical-ward trial, distinct from EFFORT Protein ICU. Eligibility included nutritional risk, NRS-2002 ≥3 and anticipated stay ≥5 days; ICU/surgical admission and inability to ingest orally were parent exclusions. Its findings cannot establish treatment selection for ICU patients or major dysphagia preventing oral intake.

Of the reported 2028 parent-analysis participants, **1595 had baseline UCR** and **870 had paired follow-up**. One centre was excluded for laboratory-data errors; unverified extreme observations were also removed. These exclusions are not all ordinary missing tests. Exact flow counts and centre identity require unread supplementary material.

Baseline morning blood was collected within 48 hours. Follow-up was **day 7 or earlier discharge**, with some measurements on days 5/6 acknowledged. Do not label all 870 as observations taken exactly on day 7 or a uniform seven-day interval. Follow-up availability and discharge can select the observed sample; a Table 1 footnote's assumed metabolic-state labels are not independent physiological validation.

### Printed formula and threshold-scale conflict

Methods 2.6 specifies serum **urea mmol/L / creatinine µmol/L**, then prints division by 1000:

```text
Printed UCR = [urea (mmol/L) / creatinine (µmol/L)] / 1000
```

That instruction conflicts with the reported scale, including Table 1 mean 81.3 and Figure 3 threshold 83.22. The implemented numeric scale is **unresolved**. Do not silently change the operator, harmonize it with Zhou's formula, or transfer a threshold to the app's mass ratios. Resolution needs verified code, author clarification or a correction.

Threshold 83.22 was derived from this cohort's 30-day mortality, not a physiological truth standard. Section 2.6 names **Liu**; 2.7/limitations name **ROC/Youden J**. Both descriptions are retained; neither is silently selected as the verified algorithm.

### Treatment interaction and clinical scope

Figure 3 reports **nutritional support versus control** adjusted treatment HRs for 30-day mortality:

| Stratification | Within-stratum treatment HR (95% CI) | Interaction p |
|---|---|---|
| Low / high baseline UCR | 0.72 (0.43–1.21) / 0.57 (0.37–0.88) | 0.26 |
| UCR decline / rise | 0.64 (0.32–1.27) / 0.72 (0.43–1.20) | 0.80 |

These intervals belong to the **stratum HRs, not interaction effects**. Exact Figure 3 model/per-arm N and interaction effect CIs are unverified; 1595/870 must not be assigned as model sample sizes. Nonsignificant interaction tests establish neither equivalent benefit nor a useful UCR-guided strategy.

UCR change is post-baseline: treatment, illness and follow-up availability can influence it. Randomization does not randomize those trajectories. GI bleeding/AKI/severe-CKD/dialysis exclusions belong to sensitivity analyses, not universal main-cohort filters. Model details and missingness/interaction diagnostics remain incomplete. Exploratory CRP/protein-target/renal strata do not authorize inflammation-triggered dosing. Prognosis and selected subgroup estimates provide no anabolic classifier, physiological threshold or individualized supplement dose; app calculations and rules remain unchanged.

### EFFORT — Türkçe özet

Kamuya açık kurum arşivindeki özgün ana metin, tablolar ve Şekil 3 incelendi; ekler/SAP doğrulanmadı. Basılı /1000 işlemi gösterilen ölçekle uyuşmuyor; sessizce düzeltilmez ve 83,22 uygulama eşiği yapılmaz. 870 tekrar ölçüm, tam yedinci gün anlamına gelmez; erken taburculuk ölçümü de kullanılabilir. HR güven aralıkları etkileşim güven aralığı değildir. Değişim tedaviden etkilenebilir; sonuçlar UCR veya CRP ile doz seçiminin yararını kanıtlamaz.
