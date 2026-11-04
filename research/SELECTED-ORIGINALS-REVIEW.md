# Initial six-query pilot audit — five selected originals

**Checked:** 25 October 2026, Europe/Istanbul. **Scope:** bounded prioritization and original-source extraction, not completed screening, a systematic review, formal risk-of-bias grading or clinical validation. These notes are separate from the curated clinical catalog; they do not add clinical rules. No VETİS/session use, restricted-access bypass or author contact.

## Pilot selection and subsequent search expansion

**The five reports below were selected from the initial 771-PMID pilot, not from the subsequently expanded 2544-candidate union.** The initial six query IDs were `icu-energyProtein`, `icu-metabolic`, `icu-aminoAcids`, `ward-energyProtein`, `ward-metabolic` and `ward-aminoAcids`. Root's saved query/run records preserve exact strings, translated searches, URLs, timestamps and raw-file hashes. Their counts were ICU energy/protein 289, metabolic 92, amino acids 34; ward energy/protein 393, metabolic 85, amino acids 57: **950 query hits, 771 exact unique PMIDs**. Query retrieval was complete; eligibility screening was not.

At initial selection, the metadata view contained 771 candidates marked screening/extraction pending and family unresolved. Matching DOI arrays or a PMID explicitly present in the catalog's PubMed URLs found 11 exact matches against the 62-record catalog; **760 nonmatches are not 760 new eligible studies**. A metadata-priority view selected 90 nonmatches whose publication types contained Randomized Controlled Trial/Multicenter Study/Clinical Trial, or whose titles contained `multicent`, `randomi` or `pragmatic`. This is only a discovery convenience. Protocols, reviews, pediatric material and secondary analyses occur in that view; indexing tags do not establish actual design or quality.

Five candidates were chosen from that view for their nutrition/metabolic focus and multicenter title/design signal. No sixth original was extracted. Other records remain unappraised here; this auditor did not edit the screening ledger. Protocol titles including NUTRIREA-4, EFFORTII and several high-protein protocols were not treated as completed outcome trials. Existing ENGINE, PROMS and other catalog records were not re-audited.

The search was subsequently amended to **12 queries, 3977 query memberships and 2544 unique candidates**, with 26 summary batches completed by root. The current metadata file has 2544 screening-pending records; these five bounded original-source checks do not change that ledger status or complete either screen.

**Provenance limit:** the initial 771-record metadata serialization was not retained separately. The six original query responses and first eight raw metadata batches remain in the package, and initial membership can be reconstructed. No exact-original-pilot-file hash is claimed. The current metadata hash below covers the expanded union, not the earlier selection view.

| Artifact / status | SHA-256 and qualification |
|---|---|
| Current `snapshot-20261025/candidates-metadata.json` | `324ba27bb601983e5f2a04da8b1b21d9afb4c3ecd1b2175ab7248dbec0183538`; 3101901 bytes, 2544 candidates. **Expanded union, not pilot-selection input.** |
| Clinical `dist/evidence-catalog.json` used for catalog matching | `444631522400b5040eda8ac7e1cbd9a6500737734655faaf2ff3d7261dad421d`; 62-record catalog. |

## Original-source extraction

### 1. GOULASH — PMID 41786585

**Title:** High versus gradually increasing energy nutrition in the early phase of acute pancreatitis (GOULASH): a multicentre double-blind randomised clinical trial. DOI **10.1136/gutjnl-2025-335970**. Discovered by `ward-energyProtein`.

Original abstract: multicenter double-blind randomized comparison in acute pancreatitis, across predicted severities; recruitment 2017–2023. **636 enrolled; mITT 312 high-energy/307 gradual-energy = 619**. The primary death/severe-pancreatitis composite was 28/312 versus 18/307; uncorrected/corrected p=.19/.42. Secondary organ-failure/pain signals did not survive multiplicity correction. The trial stopped early following a post hoc ethics/futility decision; do not describe this as a prespecified futility boundary or equivalence result. It compares energy progression, not isolated protein/AA dose or general ICU supplementation. Registration **ISRCTN63827758** is explicit in the original abstract. No matching family was found in this catalog; patient-level independence from all outside reports was not established. [Original PubMed](https://pubmed.ncbi.nlm.nih.gov/41786585/), [original publisher abstract](https://gut.bmj.com/content/early/2026/03/05/gutjnl-2025-335970.abstract).

**Access:** complete original abstract via public EFetch; indexed original publisher abstract/PDF passages. Direct DOI/PDF requests failed 403; PMC showed a browser check. Complete main methods/supplements/SAP and registry history were not read. ESummary reports 7 April 2026; the early-view publisher URL contains 5 March 2026, not independently reconciled here. **Disposition:** useful condition-specific nutrition RCT candidate; retain denominators, early stopping and corrected uncertainty before integration.

### 2. NUTRIWHI — PMID 42018334

**Title:** Early Enteral vs Oral Postoperative Nutrition After Pancreatoduodenectomy: The NUTRIWHI Randomized Clinical Trial. DOI **10.1001/jamasurg.2026.1048**. Discovered by `ward-energyProtein`.

Original abstract: **open-label parallel superiority** RCT at 3 tertiary centers, Switzerland/France; NRS ≥3, pancreatic surgery. **144 included/142 randomized/118 analysed**, 59 per arm after 24 post-randomization dropouts. Early nasojejunal nutrition supplemented oral intake; both groups had standardized PN criteria. Mean 90-day comprehensive complication index 25.5 versus 35.8, difference 10.3 points favoring EEN, 95% CI 1.8–18.8, p=.02. Overall morbidity was not significantly different; do not extend the primary continuous-outcome finding to every complication or mortality. Registration **NCT05042882** is explicit. No matching catalog family was found; protocol/family publication overlap was not comprehensively mapped. [Original PubMed](https://pubmed.ncbi.nlm.nih.gov/42018334/), [original JAMA article](https://jamanetwork.com/journals/jamasurgery/fullarticle/2847846).

**Access:** complete original abstract via EFetch; public JAMA HTML exposed abstract/tables and online 22 April 2026 metadata; later access timed out. Full analytical methods/protocol/SAP not appraised. ESummary additionally tags Equivalence Trial, but the article expressly calls its design superiority: the tag is not proof of equivalence. **Disposition:** relevant surgical-route candidate, with 17% post-randomization attrition to assess; no general ward/ICU dose rule.

### 3. Persistent-critical-illness energy expenditure — PMID 42204563

**Title:** Time course of energy expenditure in persistent critical illness: a prospective multicentre study. DOI **10.1186/s13054-026-06102-w**. Discovered by `icu-energyProtein` and `icu-metabolic`.

Original abstract: prospective observational seven-ICU cohort, 2022–2024; ICU stay ≥10 days, at least one calorimetry measurement. **433 patients/1194 measurements**, not 1194 independent patients. Energy expenditure rose toward day 10 then declined in adjusted longitudinal models; exploratory metabolic trajectories are not validated anabolic/catabolic classes. **NCT05124860** is named; the paper's prospective-registration/SAP statements were not independently checked against historical versions. [Original PubMed](https://pubmed.ncbi.nlm.nih.gov/42204563/).

Full original Methods/Results distinguish **1003 measurements in the final primary model** and **269 patients in LCA**. Small hypo/hyper classes and entropy 0.63 limit the exploratory grouping. The Discussion explicitly identifies **an Australian subset also enrolled in TARGET Protein**: overlap size is not supplied in that read passage. Do not add 433 to TARGET's participants as an independent total. Selection on prolonged stay, irregular measurement and unmodelled informative dropout matter. [Original publisher Methods/Results/Discussion](https://link.springer.com/article/10.1186/s13054-026-06102-w).

**Access:** original open publisher HTML methods/results/discussion directly read; supplement contents/history not appraised. **Disposition:** particularly relevant metabolic-method candidate, with verified catalog-family overlap; useful for longitudinal uncertainty, not a feeding-readiness classifier or proof of daily requirements.

### 4. Sepsis PIICS/malnutrition — PMID 42617400

**Title:** Persistent inflammation, immunosuppression and catabolism syndrome and malnutrition in critically ill patients with sepsis: A multi-center prospective observational study. DOI **10.1016/j.clnu.2026.106757**. Discovered by `icu-metabolic`.

Despite the broad title, the original abstract explicitly describes a **secondary analysis of prospective multicenter ILOSS**, adults with sepsis admitted 2020–2021. **250 analysed; 127 PIICS**. Its operational definition requires hospital stay ≥14 days and at least 2 day-14 findings: lymphocytes <800/µL, CRP >2.0 mg/dL, albumin <3.0 g/dL. GLIM malnutrition association OR 1.80, 95% CI 1.02–3.18; nutrition-intake comparisons are observational. These inflammatory/clinical criteria are not an independently measured nitrogen-balance truth label, measured muscle anabolism or causal dose-response result. Primary ILOSS participant total/registration and exact overlap with other ILOSS reports were not verified; do not call this a new randomized cohort or sum reports. [Original PubMed](https://pubmed.ncbi.nlm.nih.gov/42617400/), [original publisher](https://www.sciencedirect.com/science/article/pii/S0261561426001846).

**Access:** complete original abstract via EFetch and indexed original publisher Summary/Methods; direct full text 403 despite indexed OA label. **Disposition:** potentially useful secondary observational context, with lineage and assay-definition cautions; lower priority than an independent intervention result for supplementation decisions.

### 5. ECMO nutrition across ICU/ward — PMID 42172821

**Title:** Nutrition provision across acute hospitalization in adult patients receiving extracorporeal membrane oxygenation: A prospective multicenter observational, registry-embedded study. DOI **10.1016/j.nut.2026.113244**. Discovered by `icu-energyProtein` and `ward-energyProtein`.

Original abstract: prospective observational nutrition study nested in Australia's **EXCEL** ECMO registry, 10 tertiary hospitals, 2022–2023; **147 patients**, ICU energy data 140 and available post-ICU ward data only 37. Primary outcome was delivery relative to **clinician-prescribed targets**, not measured individual requirements. Energy delivery averaged 64% ICU/70% ward and protein 61%/77% of those targets. Nonsignificant setting differences do not establish equivalence or a causal benefit from closing the gap. Repeated ICU/ward observations are not independent cohorts. **ACTRN12623000304639** is explicit; the EXCEL registry family is named, but broader report overlap/unique participants and historical registration timing were not appraised. [Original PubMed](https://pubmed.ncbi.nlm.nih.gov/42172821/), [original publisher](https://www.sciencedirect.com/science/article/pii/S0899900726001528).

**Access:** complete original abstract via EFetch plus indexed original publisher abstract/highlights; direct full text 403 despite OA label. **Disposition:** useful ICU-to-ward delivery/feasibility candidate for an ECMO subgroup; neither a nutrition-effect RCT nor an optimal-dose estimate.

## Access and query log

All five direct PubMed HTML opens exposed only HHS footer text. One ordinary public NCBI request then returned the complete original abstracts/identifiers as XML, without credentials or challenge bypass:

`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=41786585,42018334,42204563,42617400,42172821&retmode=xml&tool=nutriklinik_focused_research`

Only these five candidate publications were extracted. Original-publisher discovery queries included:

```text
"10.1136/gutjnl-2025-335970" site:gut.bmj.com
"10.1016/j.clnu.2026.106757" site:sciencedirect.com
"10.1016/j.nut.2026.113244" site:sciencedirect.com
site:jamanetwork.com/journals/jamasurgery/fullarticle/2847846 "intention" "protocol"
site:jamanetwork.com/journals/jamasurgery/fullarticle/2847846 "24" "excluded"
site:sciencedirect.com/science/article/pii/S0261561426001846 "ILOSS" "UMIN"
site:sciencedirect.com/science/article/pii/S0899900726001528 "EXCEL" "ACTRN12623000304639"
```

The JAMA follow-ups returned irrelevant general author instructions rather than usable trial-method passages; they were not used as evidence about NUTRIWHI. Indexed GOULASH correspondence/supplement leads were not counted as extra trials or treated as a completed supplement appraisal. No current registry or archived-version appraisal was completed for these candidates. No correction search completeness is claimed.

## Bounded finding and next decision

There are **five absent-catalog original reports worth a human inclusion decision**: two nutrition RCT reports with condition-specific populations, one longitudinal metabolic cohort partly overlapping TARGET Protein, one ILOSS secondary analysis and one EXCEL observational nutrition substudy. They are not five independent new nutrition trials. The task adds no catalog records, source counts, doses or classifier rules; the existing clinical catalog remains 62.

For any selected integration, preserve the access level and distinct denominators, review final methods/protocol/SAP and publication families, and decide the relevance to the app's adult ICU/ward question. No title/type priority or sample size becomes an evidence-quality grade. This five-report pilot note completes neither the initial 771-record screen nor the current 2544-record screen; all current candidates remain screening-pending, and the note cannot establish that the rest contain no useful originals.
