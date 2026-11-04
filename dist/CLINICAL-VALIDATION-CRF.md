# Independent verification and feasibility CRF / Bağımsız doğrulama ve uygulanabilirlik CRF taslağı

**Blank draft for review · 25 October 2026 · Sources inspected: UI 0.3.3 / core 0.1.1.**

This form supports two separate activities: independent technical verification of frozen software and planning of an adult ICU/ward measurement-feasibility study. It is not a completed study, patient database, recruitment authorization or clinical-validation report. Complete only the sections relevant to the prespecified question. No patient data, sample size or numerical acceptance threshold are supplied.

**Türkçe kullanım:** Bu boş taslak teknik hesap/güvenlik doğrulamasını ve erişkin YBÜ/servis ölçüm uygulanabilirliğini ayrı kaydeder. Uygulama alanları ile dış CRF'de toplanacak bilgiler ayrıdır. Araştırma ekibi amaç, bağımsız referans, zaman penceresi, eksiklik kodları, kabul ölçütleri ve veri yönetimini önceden kesinleştirir. Form etik izin, örneklem hesabı veya katabolik/anabolik tanı etiketi sağlamaz.

Companion documents: [protocol](./RESEARCH-PROTOCOL.md), [implemented data dictionary](./DATA-DICTIONARY.md), [metabolic methods](./METABOLIC-METHODS-AND-VALIDATION.md), [delivery follow-up methods](./FOLLOW-UP-METHODS.md), [site-level independent-reference feasibility decision](./REFERENCE-FEASIBILITY-DECISION-RECORD.md). Use their frozen versions alongside this form; this is a recording aid, not a replacement protocol. The site-level sheet is a blank planning step before choosing a physiological comparison; it does not establish method availability or approval.

## 1. Study/form control / Çalışma ve form kontrolü

| External field / Dış alan | Entry / Kayıt |
|---|---|
| Protocol ID/version and CRF ID/version/date / Protokol-CRF sürümleri | ___ |
| Activity: technical verification or measurement feasibility / Aşama | ___ |
| Intended use, primary question and explicit exclusions / Amaç-soru-kapsam dışı durumlar | ___ |
| Primary construct to be measured / Ölçülmek istenen birincil yapı | ___ |
| Site, responsible investigator and role assignments / Merkez-sorumlu-görevler | ___ |
| Institutional/ethics decision reference and applicable consent pathway / Kurum-etik kararı-rıza yolu | ___ |
| Approved data location, access roles and retention rule / Onaylı veri konumu-yetki-saklama | ___ |
| Approvals or human decisions still pending / Bekleyen onay ve kararlar | ___ |

An empty approval field does not imply approval. Use research IDs; keep patient identity linkage under institutional control, outside this form/export. Do not enter names, identity numbers, report barcodes or identifying filenames.

## 2. Observation identity and denominator / Gözlem kimliği ve payda

| External field / Dış alan | Entry / Kayıt |
|---|---|
| Site and screening ID/date / Merkez-tarama kimliği/tarihi | ___ |
| Research patient ID; mapping to `input.studyId` / Hasta araştırma kimliği-eşleme | ___ |
| Admission ID; mapping to `delivery.measures.episodeId` if used / Yatış kimliği-eşleme | ___ |
| Logical visit/window ID / Mantıksal ziyaret-pencere kimliği | ___ |
| Source `recordId`, revision and superseded revision / Kaynak kayıt-revizyon-önceki revizyon | ___ |
| Cohort: adult ICU or adult ward / Kohort: erişkin YBÜ veya servis | ___ |
| Eligibility decision, assessor and source / Uygunluk-değerlendirici-kaynak | ___ |
| Exclusion/non-enrolment reason / Dışlama-katılmama nedeni | ___ |
| Relevant admission/transfer/discharge/death times / İlgili yatış-transfer-çıkış zamanları | ___ |
| Planned observation window; attempted/completed status / Planlanan pencere-deneme-tamamlanma | ___ |
| Unavailable/failed observation reason / Eksik-başarısız gözlem nedeni | ___ |

Prespecify the counting rules below. Screened, eligible, enrolled, planned windows, attempted measurements, completed measurements and calculation-eligible observations require separate counts. ICU and ward remain separate cohorts. Patient, admission and repeated-window counts are different units; a new record UUID, revision or reimport is not another patient-day.

| Prespecified denominator / Önceden tanımlı payda | Counting and dependency rule / Sayım-bağımlılık kuralı | Approval reference / Onay kaydı |
|---|---|---|
| Primary technical measure / Birincil teknik ölçüt | ___ | ___ |
| Primary feasibility measure / Birincil uygulanabilirlik ölçütü | ___ | ___ |
| Repeated observations/admissions within patient / Hasta içi tekrarlı gözlem-yatış | ___ | ___ |
| Revisions, overlaps and reimports / Revizyon-çakışma-yeniden aktarım | ___ | ___ |
| Failed collections, transfer, discharge and death / Başarısız toplama-transfer-çıkış-ölüm | ___ | ___ |

Retain failed/uninterpretable collections and reasons. Do not silently exclude early deaths or failed observations. App follow-up coverage spans retained aligned windows, not the whole admission; record the full planned schedule and exit reasons externally. A correctly suppressed technical output is a tested case, not missing data. Distinguish expected suppression, failed execution and an incorrectly available result.

## 3. Implemented fields mapped to external CRF / Mevcut alanların dış CRF eşlemesi

The middle column describes actual application paths. The final column is external research information, **not a currently importable application schema**. See the data dictionary for the complete distinction.

| Domain / Alan | Implemented paths and units / Mevcut yol-birim | External CRF completion / Dış CRF gereği |
|---|---|---|
| Identity/time / Kimlik-zaman | `input.studyId`, `recordId`, `input.visitDate` **YYYY-MM-DD**, save time `savedAt` | Stable visit/revision mapping, centre, measurement/availability/cutoff times, assessor |
| Anthropometry / Antropometri | `input.age/sex/height/weight/usualWeight/lossMonths/fluidWeight`; FFM/function in `clinicalProfile.measures` | Weight type/date/method, fluid confounding, standardized muscle/function measurement details |
| Clinical safety / Klinik güvenlik | `input.context/phase/renal/hemodynamics/gi/swallow/route`; `clinicalProfile.measures.conditions` and context flags | Diagnosis/support timelines, changing renal function, independently assessed losses and source |
| Blood / Kan | `input.albumin` **g/L**; `neutrophils/lymphocytes` **10⁹/L**; CRP mg/L; creatinine mg/dL; lactate and K/P/Mg mmol/L; `labDate` | Original value/unit, assay method, specimen/availability times, local references, independent transcription check |
| Urea marker / Üre belirteci | `clinicalProfile.measures.ureaValue/ureaAnalyte/ureaUnit/markerDate/markerConfirmed`, `crpULN` | Explicit original analyte/unit/source; avoid numerical threshold equivalence with differently expressed study UCRs |
| Urine/protein / İdrar-protein | `input.uun` **g N/24 h**, `uunDate`, `collectionStart/End`, `urineVolume` mL, `actualProtein` g/matched 24 h; completeness/matching/loss flags | Assay/analyte, collection failure details, loss routes/uncertainty, independent matched-period intake source |
| Targets/formula / Hedef-mama | `input.kcalTarget` kcal/day, `proteinTarget` g/day; other contributions; formula **kcal/mL**, protein **g/100 mL**, water **mL/100 mL**, name/source | Routine plan before software, author/validity period, label version and independently verified composition |
| Actual delivery / Gerçek alım | `delivery.measures` episode/target version, exact period, total actual kcal/protein, source and two confirmations | Per-source amounts, non-nutritional calories, actual fluid, interruptions/tolerance, duplicate-source reconciliation |
| Criteria/function / Ölçüt-işlev | `clinicalProfile.measures` and `.outputs`: malnutrition, muscle/function, swallowing, UCR/CRP, SOFA-2 and recorded SAPS II | Original form/method/version/language, assessor, confounding and independent interpretation |
| Results / Çıktılar | `output` calculations/blockers/trace; `delivery.output`; `followupComparison` rows/exclusions/summary; `decisionReview` | Independent expected results, blinded reference, adjudication, feasibility burden and prespecified outcomes |

**Unit/time check / Birim-zaman kontrolü:** albumin is g/L, not g/dL; core neutrophil/lymphocyte counts are 10⁹/L, not cells/µL. `visitDate` is a date, not a timestamp; `savedAt` is save time, not measurement/cutoff time. Preserve original units separately and document conversion. Planned volume is not actual delivery; administration is not measured absorption.

## 4. Per-measurement source, missingness and cutoff / Ölçüm kaynağı, eksiklik ve bilgi kesimi

Repeat for every required measurement. App confirmation flags and short source fields do not provide the full envelope below.

| External field / Dış alan | Entry / Kayıt |
|---|---|
| Measurement ID and application field path / Ölçüm kimliği-alan yolu | ___ |
| Original value, analyte and unit / Özgün değer-analit-birim | ___ |
| Canonical value/unit and explicit conversion / Kanonik değer-birim-dönüşüm | ___ |
| Method/device/assay and version / Yöntem-cihaz-assay-sürüm | ___ |
| Controlled source document ID, location and hash / Kontrollü belge-konum-hash | ___ |
| Specimen/measurement time and reporting timezone / Örnek-ölçüm zamanı-saat dilimi | ___ |
| Interval start/end and time basis if applicable / Pencere-zaman temeli | ___ |
| Result available to clinical team at / Sonucun ekibe eriştiği an | ___ |
| Prespecified assessment information cutoff / Değerlendirme bilgi kesim anı | ___ |
| Available by cutoff? Supporting source / Kesim anında erişilebilirlik-dayanak | ___ |
| Entered by/at; independently verified by/at / Giriş ve bağımsız doğrulama kişi-zamanı | ___ |
| Correction, previous value and reason / Düzeltme-önceki değer-gerekçe | ___ |
| Missing/unreliable/not-applicable status and reason / Eksiklik-güvenilmezlik-uygulanamazlık nedeni | ___ |

Approve a missingness code list before collection. Distinguish not measured, unknown, pending, unreliable, not applicable and unavailable where relevant; these are not automatically implemented app codes. An unchecked boolean is not an independently established normal/absent finding, including the `extraLosses` field.

App written-day checks cannot establish within-day recency. Record explicit times externally for the information cutoff. Preserve zoned instants versus unzoned wall times; do not infer timezone from the computer. Record whether the UUN day matches the written collection-end day and whether actual protein shares the exact interval. The core urine rule is **24±0.1 h**; delivery pooling requires **exactly 24 h**. These are software eligibility rules, not established clinical measurement tolerances.

## 5. Routine plan before software / Yazılım öncesi rutin klinik plan

If required by the prespecified design, capture routine care before software exposure. If exposure already occurred, record it; do not retrospectively call the plan independent. This form does not direct a treatment change.

| External field / Dış alan | Entry / Kayıt |
|---|---|
| Routine plan source, author/role and recorded time / Rutin plan kaynağı-yazar-zaman | ___ |
| Valid from/to; protocol/version / Geçerlilik aralığı-protokol-sürüm | ___ |
| Phase, route, weight basis and clinical rationale / Faz-yol-ağırlık temeli-gerekçe | ___ |
| Routine energy/protein targets and units / Rutin enerji-protein hedefleri-birim | ___ |
| Product source/version and other contributions / Ürün kaynağı-sürümü-diğer katkılar | ___ |
| Actual administration source, interruptions and reconciliation / Gerçek uygulama-kesinti-uzlaştırma | ___ |
| Software result first viewed by/at / Çıktıyı ilk gören kişi-zaman | ___ |
| Independent before exposure? Evidence / Çıktı öncesi bağımsızlık-dayanak | ___ |
| Difference from app arithmetic/blockers and independent explanation / Hesap-engel farkı-bağımsız açıklama | ___ |
| Exposure or deviation affecting independence / Bağımsızlığı etkileyen sapma-maruz kalma | ___ |

App `clinicianConfirmed` and optional `decisionReview` do not prove this sequence. `plan.rate` is target-volume arithmetic, not a recorded starting pump order. Collect the actual prescription from its controlled clinical source.

## 6. Independent reference and adjudication / Bağımsız referans ve uyuşmazlık çözümü

Separate an **arithmetic reference** from a **physiological/clinical reference**. Independently calculating UUN+4 can check arithmetic; it cannot establish the biological validity of that same candidate estimate. Do not derive a binary catabolic/anabolic “truth” label from the candidate's inputs.

| External field / Dış alan | Entry / Kayıt |
|---|---|
| Intended construct, specified exactly / Ölçülen yapının açık tanımı | ___ |
| Reference type: arithmetic or physiological/clinical / Referans türü | ___ |
| Independent method, version and source / Bağımsız yöntem-sürüm-kaynak | ___ |
| Evidence of independence from candidate / Adaydan bağımsızlığın dayanağı | ___ |
| Matched interval, acquisition protocol and quality criteria / Eşleşen pencere-protokol-kalite koşulları | ___ |
| Reference acquired by/at; source location / Referans kişi-zamanı-kaynak | ___ |
| Reviewer 1: blinded information, result and reasoning / Değerlendirici 1: körleme-sonuç-gerekçe | ___ |
| Reviewer 2: blinded information, result and reasoning / Değerlendirici 2: körleme-sonuç-gerekçe | ___ |
| Agreement/disagreement under prespecified rule / Önceden tanımlı kurala göre uyum-uyuşmazlık | ___ |
| Adjudicator, decision, evidence and time / Hakem-karar-dayanak-zaman | ___ |
| Unavailable/unreliable reference: reason and analysis handling / Referans eksikliği-güvenilmezliği-analiz işlemi | ___ |

Whole-body nitrogen retention/loss, muscle protein turnover, nutritional-status criteria and functional change are different constructs. The team must specify a feasible independent method for its chosen question. Prognostic association and prescription-attainment percentages do not supply that reference. Preserve failed/uninterpretable attempts for feasibility analysis.

## 7. Technical case and discrepancy log / Teknik olgu ve hata kaydı

Specify expected results and acceptance rules independently **before execution**. Include expected null/suppressed outputs, blockers and preserved raw inputs, not only numeric matches. Numerical tolerances, allowable error rates and severity taxonomy remain for approval; none are invented here.

| Technical control field / Teknik kontrol alanı | Entry / Kayıt |
|---|---|
| Test-case ID, purpose and ICU/ward scope / Test kimliği-amacı-kohortu | ___ |
| Frozen source commit/archive and manifest hashes / Dondurulmuş kaynak-manifest hash'leri | ___ |
| Input/fixture JSON and source-file hash / Giriş-fixture-kaynak dosya hash'i | ___ |
| Exact entry/import/selection/confirmation/reimport/reset actions / Kesin işlem sırası | ___ |
| Browser/OS, locale and source time basis / Tarayıcı-sistem-dil-zaman temeli | ___ |
| Independent expected calculation, eligibility and blockers / Bağımsız beklenen hesap-uygunluk-engeller | ___ |
| Prespecified rounding/tolerance and nonnumeric rule / Önceden tanımlı yuvarlama-tolerans-diğer kural | ___ |
| Expected-result author/date before execution / Beklenen sonucu önceden belirleyen kişi-zaman | ___ |
| Executor/date and actual result artifact / Uygulayan kişi-zaman-gerçek çıktı | ___ |

| Discrepancy ID / Hata kimliği | Field/rule / Alan-kural | Expected / Beklenen | Actual / Gerçek | Difference/unit / Fark-birim | Importance under approved taxonomy / Onaylı önem sınıfı | Decision/adjudicator / Karar-hakem | Repair/version/retest evidence / Düzeltme-sürüm-tekrar kanıtı |
|---|---|---|---|---|---|---|---|
| ___ | ___ | ___ | ___ | ___ | ___ | ___ | ___ |
| ___ | ___ | ___ | ___ | ___ | ___ | ___ | ___ |

Prespecify missing-versus-zero cases; supported/unsupported unit conversion; invalid/future/mismatched dates; incomplete/shifted urine and intake windows; renal/loss contradictions; stale confirmations; competing loads/reset; corrupt files/reimports; duplicate/overlapping revisions; target-version conflicts; and locale changes preserving canonical data. A critical unsafe numerical result must remain separately visible rather than being hidden by overall accuracy. Regression pass counts are not clinical validation.

## 8. Archive and replay / Arşiv ve yeniden çalıştırma

| Artifact or check / Gerekli çıktı-kontrol | Location/hash/status / Konum-hash-durum |
|---|---|
| Full canonical JSON, original export and reimport history / Tam JSON-özgün export-aktarım geçmişi | ___ |
| Frozen source archive/commit and dependencies / Dondurulmuş kaynak-bağımlılıklar | ___ |
| `release-info.json`, `build-info.mjs`, evidence catalog and hash checks / Manifest-kanıt kataloğu-hash kontrolü | ___ |
| Controlled source IDs/locations and access permissions / Kontrollü kaynak eşlemesi-yetki | ___ |
| Independent expected calculations/reference records / Bağımsız hesap-referans kayıtları | ___ |
| Prespecified analysis, exclusions, missingness and revision selection / Analiz-dışlama-eksiklik-revizyon seçimi | ___ |
| Replay results, discrepancies and reviewer sign-off / Tekrar sonuçları-hatalar-inceleme | ___ |

Use **full JSON plus frozen code/manifest**. Normal session snapshots include `engineVersion`, `engineSha256`, `assessmentSha256`, `uiVersion`, `evidenceCutoff`, inputs, outputs, provenance and module records. Inspect actual reimported files rather than assuming all metadata survives unchanged. Confirm the hash scope from the manifest: a core hash alone does not freeze every display/evidence file.

CSV is a summary for analysis. It omits some JSON metadata, provenance, input errors and traces and cannot replace the canonical source archive. Screenshots/printouts aid human review but do not replace replayable inputs. The session-memory prototype supplies neither institutional persistence nor authenticated reviewer identity or an immutable correction history.

## 9. Decisions requiring the study team / Araştırma ekibinin kararları

| Decision / Karar | Owner / Sorumlu | Approved answer/version / Onaylı yanıt-sürüm | Unresolved / Açık konu |
|---|---|---|---|
| Intended use, primary construct and stage / Amaç-birincil yapı-aşama | ___ | ___ | ___ |
| ICU/ward eligibility, schedule and exit rules / Kohort-uygunluk-takvim-çıkış | ___ | ___ | ___ |
| Independent reference feasibility and measurement standard / Bağımsız referans-ölçüm standardı | ___ | ___ | ___ |
| Cutoff, timezone, sources and missingness / Bilgi kesimi-zaman-kaynak-eksiklik | ___ | ___ | ___ |
| Reviewer independence/blinding and adjudication / Bağımsızlık-körleme-hakemlik | ___ | ___ | ___ |
| Technical acceptance criteria and error taxonomy / Teknik kabul-hata sınıfları | ___ | ___ | ___ |
| Denominator, analysis, precision/sample-size justification / Payda-analiz-kesinlik-örneklem gerekçesi | ___ | ___ | ___ |
| Institutional review, consent and real-data governance / Kurum-etik-rıza-gerçek veri yönetimi | ___ | ___ | ___ |

Recruitment, extra patient measurements or a dose-changing strategy are not activated by this form. The team must resolve the approvals and prespecified methods applicable to its intended stage. This draft establishes no physiological classifier, optimum nutrition dose, ethical approval or outcome benefit.
