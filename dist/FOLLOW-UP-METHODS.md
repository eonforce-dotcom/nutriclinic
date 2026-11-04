# Nutrition delivery follow-up — methods / Beslenme izlemi yöntemi

NutriClinic 0.3.0 · 24 October 2026 · adult ward and ICU research software.

## Purpose

Compare **actual documented intake** with a physician prescription that applied unchanged to the same complete 24-hour period. Keep the metabolic observation separate from the delivery comparison. This is a descriptive ledger; it does not select an optimal dose, diagnose muscle anabolism or change feeding.

## Observation definition

Each saved observation includes study/case ID, admission/episode ID, ICU/ward setting, clinical phase, target-plan version, exact start/end timestamps, actual total energy/protein, source record and two explicit verifications. The main assessment supplies the physician targets and their confirmation. Changing any delivery field or main clinical input clears applicable current-delivery verification. Language switching preserves values and verification.

All relevant sources must be included once: consumed oral intake, administered enteral/parenteral nutrition, modular protein and non-nutritional calories such as IV dextrose or lipid-based sedation. A product's prescribed volume is not its actual delivery. Administered delivery is not a measure of absorption. This version accepts verified aggregate totals; it does not independently reconcile medication administration records or detect duplicate source entries within a manually calculated total.

An hourly nutrition rate captured at calorimetry and multiplied by 24 is a daily-equivalent projection, not a verified 24-hour cumulative total. Interruptions and rate changes must be reconciled in the documented aggregate before using it here. Measured expenditure and the physician prescription remain separate from actual delivery. The [EPIC / ECMO-Nutrition source-method note](ENERGY-MEASUREMENT-AND-DELIVERY-SOURCE-METHODS.md) explains why measurement-time exposure, prescription-relative delivery and incomplete post-ICU observation cannot be substituted for this ledger's definition.

Use strict ISO 8601 timestamps. Both endpoints must represent the same time basis: explicit-offset instants or unzoned wall times. Exactly 24 hours are required; partial periods are not extrapolated. Zoned timestamps account for their explicit offsets; a 23/25-hour daylight-saving transition does not silently become a 24-hour interval. Unzoned records are labelled as wall-clock observations, with elapsed-time/DST uncertainty. No host-timezone assumptions are made. The written end date must not be after the assessment date; a date alone cannot verify time-of-day recency.

The prescription must apply to the entire observation window unchanged. If it changed during the window, reconcile the record outside this module. Give a new target version to a new prescription. Input bounds (energy target 100–10000 kcal/24h, protein target 1–500 g/24h) are software acceptance limits, **not recommended clinical ranges**.

## Calculation

- Energy percentage = actual total energy / matched prescribed energy ×100.
- Protein percentage = actual total protein / matched prescribed protein ×100.
- Signed difference = actual − prescribed. Negative and positive signs describe a comparison with the recorded plan; they do not grade underfeeding or overfeeding.
- Series percentages use sum(actual) / sum(matched targets), not the unweighted average of daily percentages. No dose or catch-up schedule is generated.

An explicit zero is a real observation. Missing intake, unknown targets, invalid periods or unverified records do not become zero intake or zero requirements. A 100% line denotes the prescription, not a validated individual biological optimum; a deliberately progressive/hypocaloric acute-phase plan can be clinically appropriate.

## Longitudinal comparison and revisions

Pooling requires **all five exact scope keys**: case, episode, setting, phase and target version. Data from other scopes are excluded. Different numerical prescriptions under one version are treated as a conflict. The software re-evaluates source inputs; it ignores saved output claims.

Intervals are half-open [start,end): adjacent 24-hour windows are allowed. All members of duplicate or overlapping intervals are excluded, including parseable unconfirmed revisions. Explicit source-record checkboxes allow one intended verified revision to be selected. Importing the same observation with another record ID does not create another observation day. The original record remains in the exported history.

The coverage card counts retained verified windows. Missing slots are inferred only when retained starts share an aligned 24-hour anchor and the same time basis. The span is between the earliest and latest **retained** periods; it is not the whole admission and does not establish days outside that span. Conflicting/excluded records are separately shown. Differing daily anchors prevent a missing-day count. Missing periods are not filled with zero and lines do not connect across gaps.

JSON exports include the current comparison scope, selected source IDs, recomputed rows, exclusions and descriptive summary. CSV carries each observation's delivery payload, source record ID, selection/inclusion flags, exclusions and current summary. Prior imported comparison snapshots remain untrusted provenance in JSON. Imported clinical/delivery verifications are reset; imported summaries or record-selection claims are not automatically activated.

## Metabolic observations

Nitrogen balance is plotted only when the existing core engine's collection, laboratory, renal/KRT and additional-loss requirements permit it, and both the urine collection interval/time basis and actual protein total match this delivery record exactly. Inconsistent protein totals or periods produce a reconciliation note and no paired nitrogen point.

The core approximation is actual protein /6.25 − (24-hour UUN +4), with the documented limitations of the fixed non-urea/non-urinary loss assumption. Positive nitrogen retention does not demonstrate net muscle anabolism, and negative balance does not distinguish catabolic burden from inadequate intake. Albumin, PNI or UCR trends do not resolve that distinction. Functional/muscle measurements and independent clinical assessment remain necessary.

## Evidence and limits

The [official ESPEN ICU guideline](https://www.espen.org/files/ESPEN-Guidelines/ESPEN_practical_and_partially_revised_guideline_Clinical_nutrition_in_the_intensive_care_unit.pdf) supports individualized phase-aware nutrition assessment and measured expenditure where appropriate. Its recommendations are not proof of one optimal individual target. The [official ASPEN factsheet](https://nutritioncare.org/wp-content/uploads/2024/12/Adult-Crit-Ill-Patient-Guidelines-Factsheet.pdf) explicitly discusses lipid-sedation calories and clinical review of glycemia, triglycerides and tolerance. Access here was the official summary, not an assertion that the complete ASPEN guideline was newly reviewed.

Recent large protein trials already compared in the app—[EFFORT](https://pubmed.ncbi.nlm.nih.gov/36708732/), [PRECISe](https://orbi.uliege.be/handle/2268/328391), [TARGET Protein](https://jamanetwork.com/journals/jama/fullarticle/2835302)—do not validate titration from a delivery percentage or nitrogen-balance trend. The 2026 NEXIS record and other 2026 papers retain their original design/access limits. No new clinical efficacy study was performed for the follow-up release.

UI prompts request review of documentation, interruptions, tolerance, swallowing, fluid/renal changes and the current prescription. They do not apply biochemical dose multipliers. Main feeding-safety blockers remain in force. Data are held only in the current tab; export before refreshing. There is no institution-grade persistent audit log or patient database.

## Türkçe kullanım özeti

Beslenme planının altındaki gerçek alım alanına yatış kodu, plan sürümü, tam 24 saatlik dönem, tüm kaynaklardan gerçek enerji/protein ve kaynak kaydı girilir. Aynı hedeflerin tüm dönem boyunca değişmeden geçerli olduğu ve alımın doğrulandığı işaretlenir. Değerlendirme kaydedilince Araştırma kayıtları ekranında seri oluşur.

Ölçüm anındaki hız ×24 gerçek günlük toplam yerine girilmez; kesinti ve hız değişimleri kaynak kaydından uzlaştırılır. Kalorimetri harcaması ve hekim hedefi, gerçek teslimden ayrı tutulur.

Farklı hasta/yatış/faz/hedef sürümleri karıştırılmaz. Çakışan dönemler birlikte dışlanır; tek revizyonu açıkça seçmek gerekir. Eksik gün sıfır alım değildir. Kapsama yalnız korunan dönemler arasındaki hizalı aralığı anlatır; tüm yatış süresi değildir. Azot dengesi yalnız tam eşleşen idrar dönemi ve gerçek proteinle çizilir; kas anabolizması tanısı veya otomatik doz değişimi üretmez. JSON/CSV ve rapor araştırma izini saklar; içe aktarma onayları sıfırlar. NutriClinic klinik kararı destekler, yerine geçmez.
