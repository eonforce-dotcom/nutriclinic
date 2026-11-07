# NutriClinic clinical modules — methods and limits

Research interface v0.2.0 · evidence reviewed through **24 October 2026**. Adult ICU and ward populations. NutriClinic supports clinical decisions and does not replace them.

## Primary purpose and decision sequence

1. Record reliable anthropometry, nutritional screening, clinical phase, actual intake and verified laboratory/collection data.
2. Describe malnutrition candidate findings and metabolic observations. A normal BMI or albumin does not exclude malnutrition. No blood index establishes net muscle anabolism.
3. Review feeding safety, disease context, organ function and refeeding risk.
4. A physician sets and confirms the energy/protein targets and product composition. The software calculates the energy gap, formula volume, resulting protein, remaining deficits and formula-derived free water. It does not optimize an individual biological dose.
5. Compare relevant evidence and record an optional approach, rationale and protocol version. This documentation cannot override safety checks or change targets.

## Malnutrition and sarcopenia

| Module | Implemented calculation | What remains clinical |
|---|---|---|
| GLIM, 2025 update / 2026 intake guidance | Existing main-form phenotype/etiology candidate findings | Screening, measurement validity, diagnosis and staging |
| ESPEN 2015 | After positive screening: BMI <18.5, or confirmed unintentional loss >10% at any time / >5% within 3 months plus low age-specific BMI or low sex-specific FFMI | Edema, loss trajectory, FFM method, interpretation; no severity or dose assigned |
| AND/ASPEN 2012 | Counts clinician-confirmed clinical characteristics within selected acute/chronic/social etiology; ≥2 yields a candidate checklist | Original time/severity definitions and physical examination. Albumin is not a characteristic. ICU grip is excluded |
| NRS 2002 | Clinician-rated nutritional impairment 0–3 + disease severity 0–3 + one point at age ≥70; ≥3 indicates risk | Original component ratings. No automatic SOFA/SAPS conversion |
| EWGSOP2, with 2019 correction | Strength, appendicular mass and physical-performance candidate pattern from verified measurements | Test standardization, neurological confounding and fluid reliability. ICU/acute confounding prevents classification |

FFMI is **total fat-free mass/height²**. EWGSOP2 muscle assessment uses appendicular skeletal muscle mass or its height-adjusted index; these quantities are not interchangeable. Corrected female appendicular mass threshold is <15 kg, male <20 kg; ASMI thresholds <5.5 and <7 kg/m² respectively. Strength thresholds are grip <16 kg in women / <27 kg in men, or five-chair-rise >15 seconds. Severe candidate interpretation requires confirmed low performance (gait ≤0.8 m/s or SPPB ≤8), after strength and mass findings. Missing performance is not normal performance.

Primary sources: [ESPEN 2015](https://pubmed.ncbi.nlm.nih.gov/25799486/), [AND/ASPEN 2012](https://pubmed.ncbi.nlm.nih.gov/22709779/), [publisher implementation article](https://aspenjournals.onlinelibrary.wiley.com/doi/10.1177/0884533613508435), [official NRS form](https://www.espen.org/documents/Screening.pdf), [EWGSOP2](https://pmc.ncbi.nlm.nih.gov/articles/PMC6322506/), [EWGSOP2 correction](https://doi.org/10.1093/ageing/afz046).

## Dysphagia and feeding safety

The app records a total from the **original validated EAT-10 form**, a clinician-assigned **FOIS 1–7**, and separate **IDDSI food 3–7 / fluid 0–4** levels. It does not reproduce or alter questionnaire wording. EAT-10 ≥3 is a symptom-screen threshold, not an aspiration diagnosis. The total is not a bedside water challenge. FOIS describes intake function; it does not independently select a route. IDDSI levels are clinician records from appropriate testing, not automatic thickener prescriptions.

Assessment method, date, record/source and explicit verification accompany scale interpretation. FEES/VFSS are available assessment records; selecting them does not constitute oral clearance. Impaired alertness or observed unsafe swallowing blocks a general oral formula draft, even with EAT-10=0 or an unchecked verification. FOIS 1 conflicts with an oral route and requires reconciliation. No tube route is prescribed by the app. Main-form clinician swallowing assessment and contextual findings must agree.

Sources: [original EAT-10](https://pubmed.ncbi.nlm.nih.gov/19140539/), [Turkish EAT-10 validation](https://pubmed.ncbi.nlm.nih.gov/27405421/), [original FOIS](https://pubmed.ncbi.nlm.nih.gov/16084801/), [official IDDSI framework documents](https://www.iddsi.org/resources/framework-documents), [2025 UEG/ESNM clinical recommendations](https://pmc.ncbi.nlm.nih.gov/articles/PMC12269739/). A 2026 IDDSI-related commentary is labelled as commentary, not a new validated replacement scale.

## Disease context, metabolism and severity

Chronic history must be explicitly recorded and reviewed. Options include IBD, kidney/liver disease, heart failure, diabetes, cancer, respiratory and neurological conditions and intestinal failure. IBD requires type and active disease/remission. Kidney history conflicting with the main renal field must be reconciled. Intestinal failure, high-output stoma and obstruction disable the general formula draft and require specialist planning. Other diseases prompt relevant glucose, fluid, absorption, medication and swallowing review; they do not trigger unvalidated numerical adjustments.

Approximate nitrogen balance uses actual matched protein intake and a valid full urine collection under the core engine's assumptions. Negative balance may reflect catabolic burden and/or insufficient intake; positive nitrogen retention does not prove net muscle anabolism. Treatment titration from a composite “anabolic/catabolic score” has **not** been validated in this project.

**UCR:** requires explicit urea versus BUN identity, units and verified same-date creatinine. Urea mg/dL = urea mmol/L ×6.006; urea mg/dL = BUN mg/dL ×2.144. Urea/creatinine and BUN/creatinine are separately labelled. Ambiguous BUN mmol/L is rejected. Kidney/liver function, fluid balance, bleeding, KRT and protein delivery confound interpretation. No universal threshold or automatic dose change is applied. CRP/local upper-reference ratio is arithmetic context, not an inflammation-severity grade.

**SOFA-2 (2025, corrected publisher text accessed October 2026):** calculates six organ components and total 0–24 for verified adult ICU inputs in one defined 24-hour window. This implementation requires known components and does not impute missing values as zero. It uses PaO₂/FiO₂; it does not implement the optional SpO₂ proxy, non-verbal GCS proxies or resource/treatment-ceiling exceptions. Those cases require scoring from the original table by a specialist. Vasopressor rates use µg/kg/min, FiO₂ is a fraction, bilirubin/creatinine use mg/dL, platelets use 10³/µL. Organ support and urine-duration criteria can determine the highest applicable score. No individual mortality probability is calculated.

**SAPS II:** records a dated, verified total calculated by a clinician using the original 17-variable admission-window form. This version **does not automatically recalculate SAPS II components**. SOFA-2 and SAPS II describe organ dysfunction/illness severity; neither is an inflammation scale or a validated nutrition-dose rule.

Sources: [SOFA-2 original Table 2](https://jamanetwork.com/journals/jama/fullarticle/2840822), [SAPS II original](https://doi.org/10.1001/jama.1993.03510240069035), [UCR and CRRT primary research](https://pubmed.ncbi.nlm.nih.gov/40506980/), [official ESPEN IBD guideline](https://2022.espen.org/files/ESPEN-Guidelines/ESPEN_guideline_on_Clinical_nutrition_in_inflammatory_bowel_disease.pdf).

## Indication-specific adjuncts

The central workflow remains nutritional assessment and individualized physician planning. The SCFA note is collapsed and shown only when **IBD** is selected. A 140-person oral microencapsulated-butyrate randomized IBD study appeared online in 2025 and in a 2026 issue; access was the original indexed abstract, not full methods. Its results do not validate isolated acetate/propionate, routine ICU use or an automatic dose. The older rectal SCFA-mixture trial did not demonstrate significant overall benefit. This is a gastroenterology discussion prompt, not a recommendation for all malnourished patients.

Sources: [butyrate IBD trial](https://pubmed.ncbi.nlm.nih.gov/41354580/), [rectal SCFA mixture trial](https://pubmed.ncbi.nlm.nih.gov/9176076/). Glutamine, isolated leucine, BCAA, HMB and combination products remain separately evaluated in the component and comparison screens.

## Data and reproducibility

Input changes clear applicable clinical verification and evidence-review confirmation. Language changes preserve measurements and user-entered text. Clinical measures, candidate outputs and approach reasoning are included in JSON/CSV; original imported records are preserved, external results are not trusted, and confirmations must be renewed. Source IDs, evidence cutoff, timestamps and engine/assessment hashes support reproducibility. The assessment hash covers core and added clinical calculations; it is not a certification or immutable audit log.

Patient data remain in the open tab's memory. Locale preference alone persists locally. There is no institutional patient database or access-control system for patient records. Save the research export before refreshing. Thesis use requires an approved protocol, independent clinical reference assessment, patient-level validation, predefined outcomes and institutional data governance.

## Türkçe kapsam özeti

Ana amaç malnütrisyon ve metabolik bulguları değerlendirerek hekimin belirlediği hedeflerden beslenme taslağı oluşturmaktır. GLIM/ESPEN/AND-ASPEN aday ölçütleri, NRS 2002 riski ve EWGSOP2 işlev ölçümleri ayrı yorumlanır. EAT-10/FOIS/IDDSI özgün değerlendirme kayıtlarından girilir; alarm bulgusu oral planı engeller. Kronik hastalık ve İBH fazı değerlendirmeye katılır. SOFA-2 alt puanları hesaplanır; SAPS II bu sürümde yalnız klinisyenin hesapladığı toplam olarak kaydedilir. UCR, CRP ve organ skorları kesin katabolizma/anabolizma tanısı veya otomatik doz anahtarı değildir. Bütirat notu yalnız ilgili İBH bağlamında ikincil kanıt olarak sunulur. Yazılım araştırma sürümüdür; klinik geçerlik çalışması yapılmamıştır.

## Implementation crosswalk — local 0.3.14 / 26 October 2026

The v0.2.0 / **24 October 2026 literature baseline above is historical**. This update maps the inspected implementation, including the 0.3.11 marker-integrity guards, to existing catalog records. It is not a new literature search or original-criterion appraisal. Selected UCR original reviews dated 25 October and the related 26 October metabolic-source updates retain their separate access limits in the linked method notes. No new medical rule, clinical cutoff, source-access claim or supplement dose is introduced.

**Source-link types:** **S** = `sourceIds` returned on a result; **U** = separate UI links; **D** = a documented contextual mapping only. Clinical criteria describe source-based candidate patterns; software policy governs accepted data, confirmations, conservative scope and comparability. A catalog ID does not establish that every implemented boundary/footnote matches the original publication. Existing tests exercise software behavior, not clinical validity; no tests were rerun for this documentation update.

Main fields below belong to `input`; additional fields belong to `clinicalProfile.measures` unless specified. Functions are in `dist/` in the source package.

| Output group | Function / principal fields | Actual source linkage and implementation boundary |
|---|---|---|
| BMI/loss/GLIM | `engine.mjs:evaluate`; age, height, weight, usualWeight, lossMonths, muscle, inflammation, intakeCriterion, screenPositive | **No per-output IDs. U:** `clinical-workspace.mjs:refresh` separately links `glim-2025`, `glim-intake-2026`. Raw values drive candidate thresholds; no diagnosis/staging. Fluid reliability is a plan gate, not a universal suppression of descriptive GLIM findings. |
| NLR / PNI | `evaluate`; neutrophils, lymphocytes, albumin, laboratory/assessment dates and confirmation, inputErrors | **No per-output IDs. D:** PNI `onodera-pni-1984`; interpretation context `aspen-visceral-2021`. No dedicated NLR formula-source ID is mapped. Canonical units, adult/date/confirmation and dependent-input gates apply; no universal metabolic or dose threshold. |
| Nitrogen estimate | `evaluate`; actualProtein, uun/uunDate, collectionStart/End, urineVolume, completeness/matching, renal/extraLosses | **No per-output IDs. D:** `jccng-2024`, renal context `espen-kidney-2024`. Approximate matched protein/6.25 − (UUN+4); written-day/date checks and 24±0.1 h tolerance are software eligibility policies. Context can suppress the estimate; positive balance is not muscle anabolism. |
| Refeeding/electrolytes | `evaluate`; negligibleDays, BMI/loss period, electrolytes, refeedingHistory, P/K/Mg | **No per-output IDs. D:** `nice-cg32` risk context. NICE-style major/minor pattern is distinct from local numeric prechecks, missing/conflict handling and plan gates. General reducedDays is not negligibleDays; no developed-syndrome diagnosis. |
| Formula draft | `evaluate`; physician targets, other intake, verified product composition/name/source, volume limit, route, hours/servingVolume | **No per-output IDs. D:** `espen-icu-2023` is clinical context. Volume follows the energy gap, cap and downward 0.1 mL rounding; protein gap remains explicit. These arithmetic/scope policies do not select an optimal target or authorize a pump order. |
| ESPEN candidate | `criteria-malnutrition.mjs:evaluateMalnutrition`; screening, reliable weight, unintentional loss, fatFreeMass/ffmMethodValid | **S:** `espen-diagnosis-2015`. Adult/measurement eligibility; FFM/height² is not ASM. Diagnosis/staging remains clinical. |
| AND/ASPEN checklist | Same function; aspenContext and clinician-rated intake/weight/muscle/fat/fluid/grip | **S:** `and-aspen-malnutrition-2012`. Unknown characteristics remain unknown; ICU grip excluded. Source-specific clinical definitions are not reconstructed from laboratory indices. |
| NRS 2002 | Same function; age, nrsNutrition, nrsDisease | **S:** `espen-screening-nrs2002`. Known integer component ratings and age addition; missing is not zero. No automatic organ-score conversion or feeding escalation. |
| EWGSOP2 | `criteria-function.mjs:evaluateFunction`, private `sarcopenia/recordReady`; strength, ASM, performance, validity/confounding, functionSource/Date/Confirmed | **S:** `ewgsop2-2019`, `ewgsop2-correction-2019`. Dated verified measures; ICU/confounding restrictions are conservative policy. Missing performance does not imply normal severity; FFMI is not substituted for ASM. |
| Dysphagia records/safety | `evaluateFunction`, private `eatScore/recordReady`; EAT total/items, FOIS, IDDSI food/fluid, assessment/source/date/confirmation, unsafe/alertness flags | **S:** `eat10-original-2008`, `eat10-turkish-2016`, `fois-original-2005`, `iddsi-framework-2026`, `ueg-esnm-dysphagia-2025`, `digest-iddsi-mapping-2026`, distributed across their own outputs. A commentary ID does not validate a scale. No oral clearance; context checks unsafe signs and FOIS/route conflict. |
| Disease context / IBD note | `clinical-context.mjs:evaluateContext/enforceClinicalContext`; conditions, contextReviewed, ibdType/Phase, highOutputStoma, bowelObstruction; workspace adjunct visibility | Context returns **no per-prompt IDs. U:** `espen-ibd-2023`; IBD adjunct links `butyrate-ibd-print-2026`, `scfa-mixture-uc-1997`. Reviewed history/contradictions and general-draft suppression are policy; no automatic disease-specific dose or SCFA treatment. |
| UCR / BUN–creatinine | `evaluateMarkers`, private `paired/flagsAllow`; creatinine, ureaValue/Analyte/Unit, markerDate/Confirmed, error flags | **S:** `ucr-crrt-2025`, `ucr-aki-mortality-posthoc-2026`, `ucr-effort-ward-2025`. Both concentrations normalized to mg/dL; source molar scales are distinct. Data-integrity guards below do not create a UCR diagnosis or treatment threshold. |
| CRP/reference fold | Same function/helpers; crp, crpULN and paired laboratory/marker metadata | **S:** `aspen-visceral-2021` provides interpretation context. Separate CRP/ULN dependency gates; not an inflammation-severity or dose model. |
| SOFA-2 / recorded SAPS II | `evaluateMarkers`; adult ICU, sofa* components/date/confirmation; saps2Total, sapsDate/Confirmed | **S:** `sofa2-2025`, `saps2-1993`, respectively. All six SOFA components must be known; missing is not zero. SAPS II records a clinician-calculated total; no component recalculation, mortality estimate or nutrition target. |
| Delivery / repeated windows | `followup-engine.mjs:evaluateDelivery/buildDeliverySeries`; actual intake, scope/episode/target version, timestamps, source/confirmations | **S at delivery-record level:** shared `espen-icu-2023`, `aspen-icu-2022`, `jccng-2024`, not a source per exclusion or formula. Exact 24 h, stable targets, matched nitrogen window/protein, revision/overlap/time-basis checks and no zero-filled gaps are comparability policies. |
| Optional evidence choice | `decision-review.mjs:makeReview/isReviewCurrent/choiceAvailable`; topic/choice, rationale, confirmation, input snapshot/time | **S on review record:** selected `decision-topics.mjs` topic's source set. This is review provenance, not proof of a source for each clinical rule. Imported confirmation cannot create a fresh session review; choices neither change targets nor override blockers. |

### Paired laboratory guards added in 0.3.11

`clinical-context.mjs:flagsAllow` allows absent error metadata but rejects malformed/non-array lists, invalid entries and sparse holes. Valid keys are trimmed. `paired` checks main `inputErrors` keys `labsConfirmed`, `labDate`, `visitDate` and clinical `invalidFields` keys `markerConfirmed`, `markerDate`, as well as true confirmations, real dates, equal marker/blood date and blood date no later than assessment.

UCR additionally checks main `creatinine` and clinical `ureaValue`, `ureaAnalyte`, `ureaUnit`. Creatinine must satisfy the existing `import.mjs:labDefs.creatinine` **0.1–30 mg/dL data-acceptance interval**, not a clinical normal range. CRP instead checks main `crp` and clinical `crpULN`. Rechecking a confirmation does not remove an invalid-field flag. Measured zero urea/CRP is retained; valid unrelated error keys do not suppress the independent proxy. These helper guards are specific to the paired markers, not a claim that every evaluator implements the same metadata gate.

Existing technical examples are in `tests/clinical-context.test.mjs` (dependency isolation, malformed metadata, reconfirmation, boundaries and zero), `engine.test.mjs` (arithmetic/laboratory/collection/refeeding/plan), `criteria-malnutrition.test.mjs`, `criteria-function.test.mjs`, `followup-engine.test.mjs` and `decision-review.test.mjs`. They are technical rule checks, not independent physiological reference measurements.

### Source methods and investigator decisions

The [ICU/ward UCR original-source methods](./UCR-ORIGINAL-SOURCE-METHODS.md) preserve source scales, available-data selection and unread supplements/SAP limits; the [metabolic methods](./METABOLIC-METHODS-AND-VALIDATION.md) preserve current implementation and dated source updates. These source records do not validate a guided dose. The [reference-feasibility decision sheet](./REFERENCE-FEASIBILITY-DECISION-RECORD.md) and [independent CRF](./CLINICAL-VALIDATION-CRF.md) remain blank investigator tools: local independent acquisition, primary construct, acceptable disagreement, analysis, sample-size and institutional decisions cannot be supplied by this crosswalk.

**Türkçe:** Üstteki 24 Ekim literatür tabanı korunur; bu bölüm yerel 0.3.14 için kod–kaynak eşlemesidir. Ana motorun GLIM/NLR/PNI/azot/refeeding/plan çıktılarında henüz çıktı bazlı `sourceIds` yoktur; ayrı GLIM bağlantısı veya ortak izlem kaynakları bu eksikliği tamamlanmış saydırmaz. Kaynakta tarif edilen klinik ölçüt, yazılımın veri kabul/güvenlik politikası ve teknik test birbirinden ayrılır. Kaynak kimliğinin geçerli olması, özgün ölçütün bütünüyle doğru uygulandığını veya klinik geçerliği kanıtlamaz. Yeni eşik, doz, hasta verisi, klinik kural veya uzak yayın eklenmedi.

## Implemented reference map — local 0.3.15 / 26 October 2026

The preceding crosswalk records the 0.3.14 implementation. In 0.3.15, the new pure `core-rule-provenance.mjs` provides an additive **record-level** `coreRuleProvenance` map; `engine.mjs` and its `evaluate()` return shape remain unchanged. The map's `outputPaths` refer to existing core output groups. It is documentation provenance, not measured data provenance, reviewer confirmation or a complete proof of every guard.

| Output group | Mapped IDs and bounded role |
|---|---|
| BMI / weight loss | No dedicated source mapped; descriptive arithmetic. |
| GLIM candidate | `glim-2025`: clinical framework; `glim-intake-2026`: intake interpretation. |
| NLR | No dedicated formula source mapped; laboratory validity policies remain local. |
| PNI | `onodera-pni-1984`: documentary formula context, independently unverified original formula; `aspen-visceral-2021`: interpretation context. |
| Approximate nitrogen / metabolic description | `jccng-2024`: approximate method context; `espen-kidney-2024`: applicability context. This is not proof of net muscle anabolism. |
| Refeeding risk | `nice-cg32`: risk framework, not diagnosis of developed syndrome. |
| Formula plan / references | `espen-icu-2023`: clinical context only. Arithmetic uses physician-entered targets; it does not select an optimum dose. |

`scope` is `reference-map-only`, `clinicalValidation` is always false, and local policy codes are explicitly separated from source support. The shared laboratory date check does not establish independently matching specimen times. Source titles/access/HTTPS links in the expandable EN/TR panel come from the canonical catalog. Source IDs and allowed roles are checked during release. The map and renderer are included in the assessment hash; core/analysis/evidence calculations and frozen-search contents remain unchanged.

Manual records, synthetic follow-up examples and research JSON reimports receive a fresh current map. Reimported maps cannot supply current authority: the incoming record remains historical under `originalRecord`, current results/hash identity are regenerated and the existing confirmation resets remain. JSON schemas remain backward compatible; CSV adds one last JSON-valued `coreRuleProvenance` column. See [the data dictionary](./DATA-DICTIONARY.md) for exact fields and limits.

**Türkçe:** 0.3.14 tablosu tarihsel durumdur. 0.3.15'te kayıt düzeyindeki ek harita yedi ana çıktı grubunu kaynak/rol veya açık eşlenmemiş durumla ilişkilendirir. Çekirdek motor çıktısı ve klinik eşikler değişmedi. Kaynak bağlamı, yerel yazılım politikası, ölçüm kaynağı ve klinik validasyon birbirinden ayrılır. Gelen harita güncel kural olarak güvenilmez; yeniden aktarım güncel haritayı ve sonucu üretir, özgün kaydı saklar ve onayları yenilemeyi gerektirir. Yeni özgün literatür incelemesi veya hasta üzerinde doğrulama yapılmış sayılmaz.

## PNI equation-source refinement — local 0.3.16

The earlier 0.3.15 PNI row records its conservative mapping at that time. Direct inspection of the [original PubMed English abstract](https://pubmed.ncbi.nlm.nih.gov/6438478/) now checks its equation and stated units against the unchanged canonical-unit expression. Its source role is `original-abstract-formula-units`, status `formula-units-checked-abstract-only`. Full Japanese methods and current ICU/ward validity remain unreviewed; local input/date/error guards are not validated by this algebraic match. No numerical PNI threshold, dose, engine output or safety gate changes. [The source-method note](./PNI-SOURCE-METHODS.md) provides the unit derivation and access boundary.

**Türkçe:** Özette denklem/birim kontrolü, tam metin yöntem incelemesinden ve klinik geçerlikten ayrıdır. Önceki “belgesel/doğrulanmamış” PNI etiketi bu dar kapsamlı kontrolle güncellendi; klinik hedefler ve hesaplar aynıdır. Ayrı araştırma tarama defteri hasta aktarım şeması değildir ve otomatik uygun çalışma seçmez.

## Lin PMV original-use context — local 0.3.17

On 26 October 2026, a normal public DOI route reached Lin's original publisher main text. Methods/Results, Tables 1/2 with footnotes and Figure 1 were inspected; supplementary material and historical registry versions remain unread. The previous PMC browser check is route-specific, not evidence that every publisher route was blocked. [Lin PMV source methods](./LIN-PMV-SOURCE-METHODS.md) records the current access and interpretation limits.

This single-centre, late stable PMV trial reports **100 randomized, 91 protocol completers and primary ITT analyses retaining all 100**. Its incremental high-protein/core-rehabilitation/NMES strategies do not establish an isolated AA effect, factorial interaction or an individually validated anabolic state. The study target of **1.5 g/kg ideal body weight/day** is a prescription used in that population, not a new app target. Arm-specific withdrawals are known, but complete serial measurement Ns and historical endpoint prespecification remain unverified.

The main outcome methods explicitly use **EN protein/6.25 − (24-hour UUN + 4)**. This adds original-use context for the approximate nitrogen equation; it is not an original derivation, independent physiological reference, validation of the app's collection tolerance or a route-independent loss model. Group balance results and respiratory outcomes do not prove net muscle anabolism. The article's renal feeding practice does not override existing renal/KRT or major-loss restrictions. No clinical equation, target, dose or eligibility gate changes through this source context.

**Türkçe:** Lin'in özgün ana metni artık incelendi; önceki PMC engeli yalnız o yola aittir. 100 randomize, 91 tamamlayan ve birincil ITT 100 ayrı tutulur. Geç/stabil PMV'de eklemeli protein–rehabilitasyon–NMES bulguları erken YBÜ geneline, izole AA yararına veya anabolik sınıflandırıcıya çevrilmez. Azot denkleminin özgün kullanımı, uygulama kontrollerinin veya klinik geçerliğin kanıtı değildir; böbrek/doz kuralları değiştirilmez.
