# PNI: original equation, units and access limits / Özgün denklem ve sınırlar

26 October 2026 · Local UI 0.3.16 · Engine 0.1.1 unchanged.

The [original Onodera English abstract in PubMed, PMID 6438478](https://pubmed.ncbi.nlm.nih.gov/6438478/) explicitly supplies the PNI equation and its units. It concerns a historical gastrointestinal surgical risk model; this is not a general ICU/ward nutritional-state or protein-dose validation. The existing catalog already recorded abstract access; this update resolves the previously conservative source-map role by comparing the equation directly. No new independent trial was added.

| Quantity | Original abstract notation | App canonical notation |
|---|---|---|
| Albumin | g/100 mL | g/L |
| Absolute lymphocytes | count/mm³ | 10⁹/L |
| PNI | 10 × albumin + 0.005 × lymphocytes | albumin + 5 × lymphocytes |

The equivalence is dimensional arithmetic: albumin in g/100 mL is one tenth of g/L; lymphocytes per mm³ are 1000 times their 10⁹/L value. Thus `10(A/10) + 0.005(1000L) = A + 5L`. For a synthetic arithmetic example, 31 g/L and 1.3 × 10⁹/L yield 37.5 in either form. This comparison does not verify assays, measurement times, the local suppression policies or patient-level clinical performance.

Access depth is **original English abstract only**. Location: PubMed Abstract, equation sentence and following unit definition. The Japanese article's printed pages 1001–1005 are bibliographic metadata, not inspected equation pages. The [society article record](https://journal.jssoc.or.jp/articles/info/0850091001.html) reached its official maintenance notice; no main text, PDF or alternate authentication route was used. Model construction, detailed eligibility, calibration and contemporary applicability remain unreviewed. Historical surgical cutoffs do not become current ICU/ward malnutrition, anabolism or dosing thresholds.

The structured map now uses `original-abstract-formula-units` with `formula-units-checked-abstract-only`. ASPEN's albumin-interpretation reference and local data guards remain separate. `clinicalValidation` stays false. Core numerical calculations, targets and blockers are unchanged; current exports preserve the revised map and assessment hash.

**Türkçe:** Özgün PubMed İngilizce özeti denklem ve birimleri açıkça verir; mevcut kanonik birim ifadesiyle cebirsel eşdeğerlik kontrol edildi. Japonca tam metin okunmadı. Bu sınırlı kaynak kontrolü, YBÜ/serviste klinik geçerlik, kesin katabolik/anabolik tanı veya otomatik mama/aminoasit dozu anlamına gelmez. Kaynak haritasındaki “özette denklem ve birimler” rolü tam metin/yöntem doğrulamasından ayrıdır. Hesaplar ve güvenlik engelleri değişmedi.

Related: [data dictionary](./DATA-DICTIONARY.md), [clinical implementation map](./CLINICAL-MODULES-METHODS.md), [metabolic research boundaries](./METABOLIC-METHODS-AND-VALIDATION.md).
