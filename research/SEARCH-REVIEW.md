# Focused original-study search and review plan

**Prepared 25 October 2026; evidence-date target through 2026-10-25.** English main text / Türkçe guidance. This is a reproducible focused-search plan and review of completed PubMed pilot/amendment retrievals. It is not a completed systematic review, eligibility screen, risk-of-bias assessment, GRADE evaluation or validation of NutriKlinik.

## 1. What exists and what was reviewed

Reviewed the current `dist/RESEARCH-PROTOCOL.md`, catalog records and scope metadata in `dist/evidence-catalog.json`, the metabolic/component methods, study-family audits and comparison/search note. They already separate technical verification, physiological validity and treatment utility, and retain source-specific access limits. The catalog contains original trials, nested analyses, guidelines, consensus statements, instruments and a secondary synthesis. **Catalog entries cannot serve as an already screened original-study set or a count of independent trials.** Existing audited originals are seeds and extraction leads; they need not be re-extracted solely to populate this plan.

The main agent has executed six fixed PubMed queries, archived separately in `work/pubmed-focused-20261025/queries.json` and `runs.json`. Local inspection verifies:

| Actual pilot query | Retrieved query IDs |
|---|---:|
| icu-energyProtein | 289 |
| icu-metabolic | 92 |
| icu-aminoAcids | 34 |
| ward-energyProtein | 393 |
| ward-metabolic | 85 |
| ward-aminoAcids | 57 |

All six pilot ID retrievals are logged complete, from **06:43:33–06:43:39 UTC on 25 October 2026**. They yielded **950 query-hit occurrences and 771 exact unique PMIDs**. The counts above are query records, not study sizes.

The main agent then executed the six post-pilot strings supplied in `work/focused-search-amended-queries.json`. Local inspection of the appended `runs.json` and metadata confirms:

| Actual amendment01 query | Retrieved query IDs |
|---|---:|
| icu-energyProtein-amendment01 | 1,153 |
| icu-metabolic-amendment01 | 113 |
| icu-aminoAcids-amendment01 | 186 |
| ward-energyProtein-amendment01 | 1,162 |
| ward-metabolic-amendment01 | 97 |
| ward-aminoAcids-amendment01 | 316 |

Amended ID retrievals completed **06:48:37–06:48:43 UTC**; the main agent reported metadata retrieval complete at **06:49:15 UTC**. All 12 runs have `count == retrieved` and `complete: true`. The combined **3,977 query-hit occurrences collapse to 2,544 exact unique PMIDs**; **1,773** are additional to the pilot. `candidates-metadata.json` contains 2,544 metadata records. The logged request-cap-adjustment warning is retained; these runs do not show an ID-count shortfall. ESummary completion does not supply abstracts, full texts, eligibility or an independently adjudicated design.

**Execution boundary:** PubMed pilot and amendment retrievals were executed by the main agent, not this reviewer. Historical searches, Embase, CENTRAL and independent human screening have **not** been completed by this task. Preserve the original six strings, counts, translated queries, warnings and hashes within the appended history; never relabel them as amended searches.

## 2. Questions and intended synthesis strata

Use two care-setting strata: **adult ICU** and **adult non-ICU inpatient/rehabilitation ward**. The query that retrieves a citation is not its final setting classification. Mixed-setting studies need extractable strata; do not force them into a single setting or add their participants twice.

| Question | Population / intervention or exposure | Comparator / outcome / eligible design |
|---|---|---|
| **A. Amount and composition effects** | Adults ≥18 in ICU or ward; energy/protein amount, nutrition route/timing, oral supplements, complete formulas or the prespecified glutamine/leucine/BCAA/HMB/AA/EAA interventions. | Assigned alternative strategy, usual care or placebo. Patient outcomes and harms are distinguished from muscle/function/body-composition and metabolic outcomes. Individual, cluster and factorial RCTs are primary causal evidence; controlled nonrandomized comparisons are a separate confounding-limited stratum. |
| **B. Metabolic measurement and association** | Same populations; UCR/BUN-creatinine measures, nitrogen loss/balance/PCR, tracer protein turnover, muscle synthesis/breakdown, and response trajectories. | An explicitly identified independent same-construct reference for agreement/validity, or a prospectively defined clinical outcome for prognostic association. Prospective/retrospective cohorts, method-comparison studies, mechanistic human trials and original secondary analyses are eligible in distinct categories. |
| **C. Treatment-effect modification** | A baseline or prespecified marker within a trial or a separate randomized marker-guided strategy. | Extract the treatment-by-marker interaction/uncertainty or randomized strategy contrast. A within-marker subgroup P value, achieved-intake association or prognostic effect is not sufficient evidence of marker-selected treatment benefit. |

All three questions require phase, route, actual intake and organ-support context. A combined energy/protein or AA/exercise strategy is not an isolated protein/AA experiment. Whole-body nitrogen balance, muscle fractional synthesis, net muscle balance, malnutrition and inflammation severity are different constructs.

**TR:** Ana amaç beslenme miktarı/içeriği ile metabolik değerlendirmedir. YBÜ ve servis ayrı tutulur; prognoz ilişkisi, fizyolojik ölçüm doğruluğu ve tedavi yanıtı seçimi aynı sonuç sayılmaz. Yeni bir makale otomatik doz veya anabolik/katabolik etiket üretmez.

## 3. Eligibility fixed before screening

- **Adults/settings:** include extractable adult inpatient data. Mixed-age reports remain pending if adult data cannot be separated. Community-only sarcopenia, healthy volunteers, athletes, children, animals and in-vitro work are outside the main set. Community studies already in the catalog remain contextual extrapolation evidence. Inpatient neurological/dysphagia and renal/KRT groups are applicability strata, not interchangeable populations.
- **Design:** original human data only in the main evidence set, including original secondary analyses correctly labelled. Protocols, SAPs, registry records and corrections are linked supporting reports. Guidelines, consensus, reviews and meta-analyses can identify anchors and explain context; they do not become newly conducted original trials. Editorials, correspondence and manufacturer summaries are not efficacy results. Abstract-only, preprint or conference-only evidence has a separate provisional/access status; it must not be silently treated as a fully appraised peer-reviewed report.
- **Interventions/outcomes:** include clinically relevant nutrition exposure or metabolic measurement. Do not require mortality or a statistically significant result. Record all eligible reported outcomes according to a prespecified hierarchy. Keep acute mechanistic windows separate from daily requirements and patient-centred endpoints. An isolated IBD/SCFA symptom study without a nutrition/malnutrition/metabolic question remains contextual, avoiding drift from the main project.
- **Date:** prioritize 2026 originals and distinguish first-online, issue and recruitment dates. The executed pilot uses `2026/01/01:2026/10/25[dp]` plus a creation-date cap. This is a database snapshot definition, not proof every result is a newly published original 2026 study. Later backfills and ahead-of-print/print-year mismatches require separately logged checks. Earlier evidence is retained through a deliberately identified anchor/citation process; no complete historical coverage is claimed.
- **No arbitrary quality shortcut:** no minimum sample size, significance, multicentre, English, free-full-text, human/adult indexing or publication-type filter is used to discard records automatically. Larger multicentre trials get review priority, without excluding informative mechanistic studies or equating size with low bias. Human/adult eligibility is established from reports; indexing can lag.
- **Access:** unavailable full text is `awaiting_access`, not an invented exclusion for poor methods. Specify any genuine language/resource restriction before applying it and report its effect. Respect institutional access and public-release limits.

Historical anchors already present include EFFORT Protein, PRECISe, TARGET Protein, NUTRIREA-3, REDOXS, RE-ENERGIZE and the ward EFFORT family. Parent/protocol/secondary links already checked should be reused with their actual access dates; a new run must still log where each anchor was retrieved. This is a finite anchor list, not an assertion that all earlier relevant trials are known.

## 4. Material pilot gaps and amendment rationale

The pilot is useful, but a metadata-only known-item check found a catalog seed absent by DOI and distinctive title: Veldsman, **10.1002/jpen.70041**. This does not establish whether its absence arises from wording, indexing or date representation. Fradkin's prolonged-ventilation RCT, **10.1186/s13054-026-06272-7**, is retrieved only by the ward amount query. Zhou UCR, PMID **42806521**, is retrieved by ICU amount rather than the metabolic query. NEXIS appears in both setting-query pools. These checks demonstrate gaps and cross-stratum retrieval; they are not a measured search sensitivity.

Also, the candidate metadata contain older GeneReviews records with 2026 update/sort dates (e.g. PMID20301338, original metadata year 1993). Do not classify a record as an original 2026 experiment from the query date filter or sort date.

**Amendment01 preserves the same two populations × three topics and fixed date clauses.** It adds ventilation/critical-care population wording; provision/delivery/caloric and enteral/parenteral nutrition; UCR/BUN-creatinine/UUN/PCR/tracer/FSR variants; and generic/essential amino-acid/whey wording. It adds no outcome/design/language/full-text/age filter. Greek/hyphen spelling, discipline-specific terminology, database indexing and missing headings remain possible gaps. No perfect retrieval claim follows from one known-item check.

A post-execution metadata check confirms Veldsman as PMID **41472548**, now in the ICU amount and AA amendment sets. Fradkin PMID **42791574** now also occurs in the ICU amount amendment; Zhou PMID **42806521** now occurs in the metabolic amendment. NEXIS PMID **42438140** occurs in ICU and ward candidate sets, including amended AA queries. This resolves these specific retrieval gaps; it does not validate population classification, eligibility or overall sensitivity.

### Exact PubMed strategy files

1. **Executed pilot:** retain all six full strings exactly as stored in `work/pubmed-focused-20261025/queries.json`; use `runs.json` for actual translations and dates.
2. **Executed post-pilot amendment:** `work/focused-search-amended-queries.json` contains six fully expanded strings, with IDs ending `-amendment01`; their actual requests/translations are appended in the main run log. It is an amendment file, not the original pilot record.
3. Each amended query ends with the unchanged literal clauses:

```text
AND (2026/01/01:2026/10/25[dp])
AND (1800/01/01:2026/10/25[crdt])
```

4. After actual execution, archive the expanded submitted string, NLM query translation, warnings/errors, response/time/hash and complete PMID list. Investigate ignored/not-found phrases rather than assuming a successful HTTP response validates search syntax.
5. A future date-sensitivity amendment may use electronic/publication-date fields and a separately declared historical window. It must receive a new ID, not retrospectively redefine this pilot. PubMed creation date is not publication date; a future rerun with the same cap cannot recreate every historical database state.

The [current NLM guide](https://pubmed.ncbi.nlm.nih.gov/help/) documents separate publication/electronic/entry dates, fielded searches and the query translation available in Advanced Search history. Its update date was 30 September 2026 when checked. These features inform syntax reporting; the expanded project searches are not validated search filters.

## 5. Other database strings and supplementary discovery — proposed only

An information specialist should validate the available SBÜ platform, controlled headings, proximity/phrase behaviour, syntax and known-item retrieval before these drafts are executed. Embase.com syntax is not Ovid syntax. Save final translated strings verbatim. No additional database has been searched by this task.

### Embase.com free-text draft

The following five blocks deliberately avoid claiming that an unchecked Emtree term has been validated. Add verified exploded headings after librarian review; record that change. Boolean combinations yield six separate query histories, not one opaque mixed-setting pool.

```text
E1 = ('critically ill' OR 'critical illness' OR 'intensive care' OR
      'critical care' OR ICU OR 'mechanical ventilation' OR
      'mechanically ventilated' OR 'prolonged mechanical ventilation'):ti,ab,kw
E2 = (hospitali* OR inpatient* OR 'medical ward' OR 'medical wards' OR
      rehabilitation OR 'noncritically ill' OR 'non-critically ill'):ti,ab,kw
E3 = ((protein AND (intake OR dose* OR provision OR delivery OR requirement* OR supplement*)) OR
      ((energy OR calori*) AND (intake OR target* OR provision OR delivery OR restrict*)) OR
      'nutritional support' OR 'nutrition therapy' OR 'oral nutritional supplement*' OR
      'indirect calorimetry' OR 'enteral nutrition' OR 'parenteral nutrition' OR
      'enteral feeding' OR 'parenteral feeding'):ti,ab,kw
E4 = ((cataboli* OR anaboli* OR 'nitrogen balance' OR 'urea creatinine ratio' OR
      'urea to creatinine ratio' OR 'BUN creatinine ratio' OR UCR OR
      'protein catabolic rate' OR 'protein turnover' OR 'protein breakdown' OR
      'muscle protein synthesis' OR 'fractional synthesis rate' OR
      'fractional synthetic rate' OR FSR OR 'urinary urea nitrogen' OR UUN OR
      tracer* OR 'stable isotope*') AND
      (nutrition* OR protein OR muscle OR nitrogen OR urea OR creatinine)):ti,ab,kw
E5 = (glutamin* OR leucine OR 'branched chain amino acid*' OR BCAA OR
      hydroxymethylbutyrate OR 'hydroxy methylbutyrate' OR HMB OR
      'amino acid*' OR 'essential amino acid*' OR EAA OR whey):ti,ab,kw

E1 AND E3 AND 2026:py
E1 AND E4 AND 2026:py
E1 AND E5 AND 2026:py
E2 AND E3 AND 2026:py
E2 AND E4 AND 2026:py
E2 AND E5 AND 2026:py
```

`E1` etc. are document block names: paste their definitions into actual search-history lines and archive the final native query. A publication-year limit is not an exact first-online cutoff; inspect dates against 25 October and record the platform's actual date filters. Do not pretend the PubMed creation-date cap has a verified identical Embase equivalent.

### CENTRAL / Cochrane Library Search Manager draft

Use the same text concepts, but create native Search Manager lines rather than importing Embase field syntax unchanged. A compact starting example is:

```text
#1 ("critically ill" OR "critical illness" OR "intensive care" OR "critical care" OR
    ICU OR "mechanical ventilation" OR "mechanically ventilated"):ti,ab,kw
#2 (hospitali* OR inpatient* OR "medical ward" OR rehabilitation OR
    "non-critically ill"):ti,ab,kw
#3 ((protein AND (intake OR dose* OR provision OR delivery OR requirement* OR supplement*)) OR
    ((energy OR calori*) AND (intake OR target* OR provision OR delivery)) OR
    "nutritional support" OR "enteral nutrition" OR "parenteral nutrition" OR
    "oral nutritional supplement*" OR "indirect calorimetry"):ti,ab,kw
#4 ("amino acid*" OR "essential amino acid*" OR glutamin* OR leucine OR BCAA OR
    "branched chain amino acid*" OR HMB OR hydroxymethylbutyrate OR whey):ti,ab,kw
#5 #1 AND (#3 OR #4)
#6 #2 AND (#3 OR #4)
```

Restrict the reviewed results to **Trials/CENTRAL**, record issue/version and native date-limit behaviour, and retain trial-register/conference reports as related documents. CENTRAL does not replace a separate observational/metabolic search. The Cochrane-owned training document confirms the fielded Search Manager form, but these project strings and their date treatment remain untested.

### Registries, citations and journal checks

- Search ClinicalTrials.gov and relevant ISRCTN/ANZCTR/ChiCTR records by verified identifiers first, then topic terms such as `critical illness AND nutrition`, `mechanical ventilation AND protein`, and `inpatient AND nutritional support`. Save exact native field selections, terms, date and returned identifiers; these expressions are proposed until run. Registry status is not a completed publication result.
- For every included or unresolved family: backward references, later citing reports, original journal related-article links, registered protocol/SAP and publisher correction/retraction links. Use the original DOI plus `correction`, `erratum`, `corrigendum` and `retraction` as separately logged focused queries. Absence in that check means “not identified,” not proof of no correction.
- A guideline/review can lead to an original report, but extraction must return to that original. Record the seed and the additional method used. General web searching is supplementary discovery, not a substitute for the database search log.

## 6. Records, reports, studies and overlapping cohorts

Maintain four linked units: **search hit → bibliographic report → study family → analysis cohort/outcome**.

1. Preserve every raw export, query ID, PMID/DOI, retrieval timestamp and original spelling. Exact PMID duplicates can collapse for the candidate queue while retaining all query memberships. DOI/title near-matches require manual review; do not merge distinct corrections, protocols or secondary reports simply because their titles/authors resemble each other.
2. Normalize DOI URLs/case and identifiers only in matching fields; retain source originals. Log every removed duplicate with retained ID, rule/software version and reviewer. The pilot's 771 and combined queue's 2,544 unique PMIDs are only exact-ID deduplication, not completed report/study-family deduplication.
3. Link families using explicit original-paper registry/protocol citations or corroborating original metadata, with source/locator and certainty. Similar sample size/authors alone are insufficient. Keep unresolved family IDs null. Current registry content is not an archived version or proof of prospective outcome specification.
4. Retain randomized/enrolled/completed/analyzed denominators separately. Parent and nested analyses are not additive. Mixed datasets need cohort-level rows; an expanded report can include an earlier cohort. Unknown cross-report overlap prevents a unique-participant total.
5. Preserve online/print/correction dates and document roles. Protocols, SAPs and registry links add provenance, not independent efficacy trials. No catalog-to-trial counting shortcut is permitted.

## 7. Independent screening, extraction and applicability

**Required review workflow, not claimed completed:** pilot the eligibility form, then have two trained human reviewers assess titles/abstracts independently and full reports independently. Record each decision before resolving disagreements; a third reviewer adjudicates unresolved cases. “Unclear” advances to retrieval, not automatic exclusion. AI/automation may assist retrieval or organization, but its role and human checks must be disclosed; two agent messages are not represented as completed independent clinical screening.

At full-report exclusion, retain one predeclared primary reason plus secondary notes: wrong population/setting, no relevant intervention/measurement, non-original report role, ineligible design, duplicate report, post-cutoff publication, nonextractable adult stratum, or pending access. Separate pending access from a substantive exclusion. Retain both reviewers' decisions, adjudication, date, report locator and amendment history. Create flow counts only from this actual ledger.

Independent extraction/checking should cover:

- report/family IDs, registry/protocol/SAP versions and actual access level;
- sites, eligibility, baseline nutrition/neurological state, ICU phase, ventilation, AKI/CKD/KRT, inflammation/hemodynamics, refeeding risk and exclusions;
- allocation unit/concealment/masking, intended sample, randomized/analyzed flow, follow-up and reasons for missingness/death;
- intervention and comparator **whole compositions**, routes, fixed/weight-based amounts, actual-versus-prescribed delivery, weight basis, duration, energy/nitrogen matching and exercise/co-interventions;
- primary/secondary/exploratory outcome definitions, construct, sampling/collection window, assay, units and formulas actually read; changing urea pools and dialysis/extra losses where applicable;
- exact estimand, assignment versus achieved exposure, interaction versus subgroup association, effect/CI with denominator and time anchor, adjustment variables, repeated-measure handling and multiplicity;
- funding/conflicts, corrections, unresolved discrepancies and applicability limits. Missing/unclear means unknown, never zero.

For a thesis, select the current appropriate design/outcome-specific bias tool and have independent trained reviewers record domain judgments and supporting original passages. Do not infer RoB 2 from randomization labels, assign a study-wide quality score from sample size, or generate GRADE from one abstract. Certainty is a separate outcome/body-of-evidence task after eligible studies and appraisals exist. This note performs none of those assessments.

Clinical disagreement should first be explained by population, phase, route, bundled treatment, comparator, achieved exposure and endpoint. A physician can document a justified interpretation of competing studies; a UI choice must not convert a prognostic marker, secondary signal or unreviewed regimen into a validated dose rule.

## 8. Minimum execution/archive checklist

- [ ] Freeze PICO/eligibility, outcome hierarchy, date policy, reviewers and amendment policy before formal screening.
- [x] Preserve the actual six-query PubMed pilot and exact-ID retrieval/metadata logs; do not label its 771 PMIDs eligible studies.
- [x] Execute amendment01 under new IDs and append translations/warnings/counts/hashes; the combined queue contains 2,544 exact PMIDs, not eligible studies.
- [x] Recheck the identified Veldsman/Fradkin/Zhou retrieval gaps; they are now retrieved by the intended amended concepts. Other anchor validation remains incomplete; no “100% sensitive” claim follows.
- [ ] Record database **and platform**; validate translated Embase/CENTRAL syntax and any controlled headings before execution.
- [ ] Decide and run the finite pre-2026 anchor/citation search or explicitly retain its limited scope.
- [ ] Export all records with query membership; exact-ID/report/family deduplication are separate logged stages.
- [ ] Complete independent human screening/adjudication and full-text retrieval/access tracking.
- [ ] Complete double extraction, family/participant overlap checks, registry/protocol/SAP/correction reconciliation and appropriate appraisal.
- [ ] Update the search near submission, with actual execution date and newly added/backfilled records identified. Do not describe a later search as the historical 25 October snapshot.
- [ ] Publish only observed flow counts and completed method steps. Retain uncertainty and no clinical-validity/treatment-selection claim.

**TR:** PubMed pilotu ve revizyonunun yürütülmesi taramanın bittiği anlamına gelmez. Birleşik kuyruktaki 2.544 PMID, 2.544 uygun özgün çalışma değildir. Revize sorgular yeni kimlikle eklendi; eski arama geçmişi korundu. Bağımsız insan elemesi, tam metin, çalışma ailesi, veri çıkarımı ve yanlılık değerlendirmesi tamamlanmadan sistematik derleme veya kanıt derecesi iddiası yapılmaz.

## 9. Original method sources and actual access on 25 October 2026

| Source | Access depth actually achieved | Use / limit |
|---|---|---|
| [PRISMA 2020 official overview](https://www.prisma-statement.org/prisma-2020) and [official checklist page](https://www.prisma-statement.org/prisma-2020-checklist) | Direct HTML overview/download-description pages read. | Identify reporting resources; downloadable checklist files were not separately rendered. |
| [Original PRISMA 2020 statement, PLOS Medicine](https://journals.plos.org/plosmedicine/article?id=10.1371/journal.pmed.1003583), DOI 10.1371/journal.pmed.1003583 | Original full-text HTML available; scope, record/report/study definitions, limitations and reporting-change passages read. BMJ DOI10.1136/bmj.n71 direct opening returned403. | The statement addresses reporting and does not itself establish review conduct/quality. Full search strategies, reviewer independence and amendment/material availability should be disclosed. No full supplement-read claim. |
| [Original PRISMA-S](https://link.springer.com/article/10.1186/s13643-020-01542-z), DOI 10.1186/s13643-020-01542-z | Direct original full-text HTML; development/scope and relevant database/platform, strategy, limits, update, date, peer-review, count and deduplication passages read. | Search-report transparency, including strategies as actually run and archiveable methods; not a clinical appraisal or conduct certification. |
| [NLM PubMed User Guide](https://pubmed.ncbi.nlm.nih.gov/help/) | Direct official HTML, date fields and Search Details passages. Page update30September2026. | Date distinctions and query translation; project query sensitivity was not validated by reading help. |
| [Elsevier Embase search](https://www.elsevier.support/embase/answer/how-do-i-search-in-embase), [field codes](https://www.elsevier.support/embase/answer/what-field-codes-can-i-use-in-embase), [operators](https://www.elsevier.support/embase/answer/can-i-use-boolean-operators-wildcards-and-proximity-operators-in-embase) | Original vendor indexed/HTML documentation; field codes directly opened; operators page updated6March2026 in indexed text. | Platform-specific fields/phrases/Boolean/truncation; no licensed Embase search executed. |
| [Cochrane-owned Search Manager training PDF](https://resources.cochrane.org/sites/resources.cochrane.org/files/uploads/Trainers/Activity%202_Cochrane%20Library_preview.pdf) | Official indexed training passages/screenshots text; direct PDF fetch timed out. | Supports the draft fielded form; no full PDF or actual CENTRAL-query review claimed. |

Methods-source browsing used the direct URLs above plus these two discovery queries: `site.elsevier.com Embase quick user guide ti ab kw search syntax` and `site.cochranelibrary.com "ti,ab,kw" "Search Manager"`. The guessed PRISMA-S/Extensions landing paths did not resolve; the original PRISMA-S journal article supplied the usable source. No clinical study search was executed by this reviewer to write the plan, and no VETİS/blocked-supplement attempt was made.
