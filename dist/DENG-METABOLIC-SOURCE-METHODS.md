# Deng 2026 — physiological-window source methods

Original-source review: **26 October 2026**. This note concerns *Nutritional adequacy is associated with improved survival within specific physiological windows in critically ill patients*, [DOI 10.1016/j.clnesp.2026.105009](https://doi.org/10.1016/j.clnesp.2026.105009). It documents a bounded source review, without a systematic-review claim, formal risk-of-bias grade or clinical validation.

## Access and study identity

Authorized VETİS institutional access reached the original ScienceDirect main HTML. Methods, Results, six displayed main-table texts, figure captions and relevant references were read from the retained visible-text capture. **Figure images, the Word supplement, code, protocol/SAP and archived registration were not inspected.** Earlier abstract-level review remains historical; this access does not reconstruct its exact depth or date. Licensed raw text and proxy addresses are not distributed.

The main text explicitly names NEED and cites Ke et al., *Actively implementing an evidence-based feeding guideline for critically ill patients (NEED): a multicenter, cluster-randomized, controlled trial*, [Crit Care 2022;26:46](https://doi.org/10.1186/s13054-022-03921-5). No ISRCTN identifier appears in the captured Deng text. This verifies the parent-publication link, not a direct registry citation. Achieved feeding adequacy was observational; the parent randomization did not randomize these exposures. Participant overlap with other NEED secondary reports is unquantified, so their samples cannot be summed as independent patients.

## Cohorts, denominators and timing

MIMIC-IV screened 94,458 adult ICU admissions and analysed **5,370** patients with stays ≥7 days and an EN/PN record. Exclusions included missing anthropometry, specified calorie/protein-record gaps and absent laboratory data. The calorie-record coding rule does not verify complete nutrition collection. First-week PN occurred in 276/5,370; this cohort was not exclusively enteral.

NEED was a selected, exclusively enterally fed supportive subset. The main-text flow is:

`2772 − 212 (stay <7 days) − 235 (oral diet) − 35 (nutrition data missing) − 965 (first-week PN) = 1325; − 3 (28-day outcome missing) = 1322`.

This arithmetic comes from prose; the Figure 6 image was not visually checked. Table 4 reports 175 deaths among 1,322 patients.

Both cohorts divide intake by study estimates of **25 kcal/kg ideal body weight/day** and **1.2 g/kg ideal body weight/day**. These denominators are neither measured requirements nor individualized prescriptions. The IBW equation and handling of changing weight are unspecified in the captured main Methods.

| Feature | MIMIC-IV | NEED |
|---|---|---|
| Feeding exposure | Daily EN/PN; time-varying adequacy | First-week mean adequacy |
| Physiology | Daily, most severity-indicative recorded value | Primarily admission/enrolment baseline |
| Analysis | Stabilized-IP-weighted marginal structural Cox | Adjusted, stratified ordinary Cox |
| Reported scale | Energy <80%, 80–100%, >100% of target | Table 6 effects labelled per 10% adequacy |

The main categorization wording explicitly describes energy; exact protein-categorization code was not checked. NEED's first-week ICU/admission versus post-enrolment wording is not fully aligned. Daily worst physiology may follow feeding within a day; exposure lag/history and norepinephrine-equivalent (NEE) conversion are unspecified. MIMIC cannot confirm propofol calories; NEED lacks lipid-based medication-vehicle calories. Formula composition and amino-acid efficacy cannot be recovered from these ratios.

## Models and reported windows

Main Methods describe predictive-mean-matching multiple imputation for variables with <60% missingness and cumulative weights truncated at the 1st/99th percentiles. Variable-level missingness, imputation/pooling details, model code and supplementary balance/positivity diagnostics were not verified. MIMIC follow-up begins at ICU admission and censors ICU discharge before day 28; complete post-ICU 28-day outcome ascertainment is not thereby established. The ≥7-day eligibility restriction selects long-stay survivors. Landmark sensitivity and E-values are stated, but estimates, risk-set details and independent prospective specification were not established from the available main text. Residual confounding and reverse causality remain possible.

Tables report separate physiological strata, not a verified joint AND-window rule. MIMIC formal interaction results are:

| Marker boundary | Energy interaction P | Protein interaction P |
|---|---:|---:|
| NEE <0.3 versus ≥0.3 µg/kg/min | <0.001 | <0.001 |
| Lactate <2 versus ≥2 mmol/L | 0.052 | 0.003 |
| Creatinine <5 versus ≥5 mg/dL | Not reported | 0.467 |

Interaction-effect confidence intervals are not displayed. A significant association in one stratum and a nonsignificant association in another does not itself establish interaction. The creatinine interaction is nonsignificant; the Discussion explicitly rejects 5 mg/dL as a validated clinical threshold. NEED Table 6 supplies subgroup associations, without formal interaction tests. Its **Cr <5 mg/dL row labels caloric adequacy**, whereas surrounding prose interprets protein adequacy: this unresolved source conflict must not be silently corrected.

## Consequence for this software

The report supports recording exposure, physiology and provenance for research. It does not validate feeding readiness, a catabolic/anabolic classifier, an optimal dose or timing rule, or selection of glutamine, leucine/HMB or a formula. Both cohort differences and unresolved reporting details remain visible; no study threshold or denominator is transferred into clinical calculations.

## Türkçe özet

26 Ekim 2026'da yetkili kurumsal erişimle özgün ana HTML metni, altı tablonun metni ve şekil açıklamaları incelendi; şekil görüntüleri, ekler ve SAP okunmadı. MIMIC günlük zamanla değişen alımı, NEED ise seçilmiş 1.322 hastada ilk hafta ortalamasını ve başlangıç fizyolojisini analiz ediyor. İdeal ağırlığa göre 25 kcal/kg/gün ve 1,2 g/kg/gün araştırma paydalarıdır; gerçek bireysel gereksinim değildir. Ayrı katmanlar birleşik bir pencere kuralını doğrulamaz. Enerji–laktat etkileşimi P=0,052, protein–kreatinin etkileşimi P=0,467'dir. Yazarlar 5 mg/dL'yi doğrulanmış klinik eşik saymıyor. NEED Tablo 6'nın kreatinin satırında kalori etiketi ile protein yorumu çelişiyor. Ana NEED yayını doğrudan atıflıdır; yakalanan Deng metninde doğrudan kayıt numarası yoktur. Bu inceleme doz, metabolik tanı veya mama seçimi kuralı üretmez.
