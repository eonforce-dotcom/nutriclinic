# Reference-feasibility decision / Referans uygulanabilirliği kararı

**Blank site worksheet · version 1 · 26 October 2026.** Complete one record per site, intended use and primary construct. Keep adult ICU and ward plans separate. This sheet records a human research-design decision; it is not a patient record, import schema, recruitment authorization or automatic clinical pass. An unsigned worksheet is a prepared tool, not completed readiness.

Use frozen versions of the [CRF §§1/6/9](./CLINICAL-VALIDATION-CRF.md), [protocol](./RESEARCH-PROTOCOL.md), [metabolic methods](./METABOLIC-METHODS-AND-VALIDATION.md) and [data dictionary](./DATA-DICTIONARY.md). The [synthetic analysis](./ANALYSIS-DRY-RUN-METHODS.md) demonstrates computations only; its independence declaration cannot replace an acquired reference.

## 1. Scope / Amaç

| Study-level field / Çalışma alanı | Entry / Kayıt |
|---|---|
| Site; decision ID/version/date / Merkez; karar kimliği-sürüm-tarih | ___ |
| Protocol/CRF and frozen software/manifest versions | ___ |
| Adult ICU intended use, exclusions / YBÜ amacı, dışlamalar | ___ |
| Adult ward intended use, exclusions / Servis amacı, dışlamalar | ___ |
| Setting covered by this decision / Bu kararın ortamı | ___ |
| One primary question, candidate output and construct / Tek birincil soru-çıktı-yapı | ___ |

## 2. Choose the construct / Yapıyı seçin

These are implemented outputs, **not preselected study endpoints**. Select one or specify another; a reference must measure the same intended construct.

| Candidate / Aday | Verified expression / Mevcut ifade | Interpretation boundary / Sınır |
|---|---|---|
| Approximate whole-body nitrogen balance / Yaklaşık tüm vücut azot dengesi | **g N/24 h**; matched actual protein (g/24 h)/6.25 − [UUN (g N/24 h) + 4 g N/24 h] | Fixed-loss approximation; not net muscle anabolism. |
| Urea/creatinine; separate BUN/creatinine | Both component concentrations normalized to **mg/dL**; each ratio is **dimensionless** | Different ratios; no validated catabolic class or universal threshold. |
| CRP context / CRP bağlamı | CRP **mg/L**; CRP/entered local upper reference is a **dimensionless fold** | Not an inflammation-severity grade or anabolic truth. |
| Nutritional status or muscle/function criteria / Beslenme veya kas-işlev ölçütü | Exact criterion, method/version and unit: ___ | Separate constructs; neither automatically validates nitrogen balance. |

Selected construct and reason / Seçim ve gerekçe: ___

## 3. Can this site acquire an independent reference? / Merkezde ölçülebilir mi?

No institutional method or availability has been established by this worksheet. Leave unknowns explicit; do not invent a gold standard.

| Acquisition decision / Ölçüm kararı | Evidence, owner or unresolved / Dayanak-sorumlu-açık konu |
|---|---|
| Proposed method/version; laboratory or assessor | ___ |
| Availability: confirmed / unavailable / unknown; dated institutional evidence | ___ |
| Specimen/procedure, equipment, training and resources | ___ |
| Turnaround, workload/cost and feasible repeat schedule | ___ |
| Original analyte/unit, conversion and measurement uncertainty | ___ |
| Matched start/end, timezone and information cutoff | ___ |
| Acquisition quality, reliability criteria and failure reasons | ___ |

**Independence check:** list every shared candidate/reference input, including intake, UUN, loss assumptions and reviewer information: ___. Recalculating UUN+4 from the same inputs checks arithmetic; it is not independent physiological validation. Candidate-derived clinician labels create circularity. Independent-acquisition evidence and same-construct judgment: ___. If independence is unresolved, physiological agreement remains unestablished.

**Bağımsızlık:** Aynı girdilerle aynı hesabı tekrarlamak biyolojik doğrulama değildir. Kas/işlev veya beslenme ölçütünü farklı bir fizyolojik yapının doğrusu saymayın.

## 4. Observation and review plan / Gözlem ve inceleme

| Required plan / Gerekli plan | Entry / Kayıt |
|---|---|
| Candidate/reference timing; permitted mismatch and justification | ___ |
| Blinded assessor information, access order and cutoff enforcement | ___ |
| Independent reviewers, disagreement rule and adjudicator | ___ |
| Planned → attempted → completed → usable measurement ledger | ___ |
| Missing, unreliable, failed, suppressed and not-attempted reasons | ___ |
| Repeat/admission/revision rules; transfer, discharge and death handling | ___ |
| Uncertainty/serial model, acceptance margin, sample-size rationale and SAP version | ___ |

Retain unsuccessful attempts and original units. Missingness is not zero; repeated windows are not independent patients. Keep ICU/ward denominators separate. Record any shared-input dependence rather than removing inconvenient cases after seeing results. Numerical limits, local exclusions and analysis decisions remain blank until justified and approved.

## 5. Record one decision / Bir karar kaydedin

| Stage / Aşama | What this decision supports / Kararın kapsamı |
|---|---|
| Technical verification only / Yalnız teknik doğrulama | Frozen calculations, blockers and independently specified expected outputs; no biological claim. |
| Measurement-feasibility planning / Ölçüm uygulanabilirliği planı | Proposed acquisition, burden, quality and failure-denominator assessment; applicable institutional permissions still required. |
| Physiological-comparison proposal awaiting approval / Onay bekleyen fizyolojik karşılaştırma önerisi | Named independent same-construct method proposed; protocol/SAP, statistical and governance approvals remain explicit dependencies. |

Selected stage; rationale; unsupported questions: ___

Next action, responsible person and review date: ___

## 6. Ownership and sign-off / Sorumluluk ve imza

| Human owner / İnsan sorumlu | Name/role; decision evidence; dated signature/version |
|---|---|
| Principal investigator / Sorumlu araştırmacı | ___ |
| Nutrition/metabolic-methods collaborator / Beslenme-metabolizma yöntem uzmanı | ___ |
| Institutional laboratory/measurement lead / Kurum ölçüm sorumlusu | ___ |
| Statistician / İstatistikçi | ___ |
| Ethics/data-governance decision reference / Etik-veri yönetimi kararı | ___ |

**TR:** Boş alan onay anlamına gelmez. Yöntemin gerçekten erişilebilirliği, bağımsızlığı, zaman eşleşmesi ve belirsizliği kurum ekibince belgelenir. Bu kayıt tek başına ek hasta ölçümünü, araştırmaya hasta alımını veya beslenme dozunu değiştiren araştırmayı başlatmaz. Tamamlanan sürümü kontrollü kurum kaydında saklayın; uygulama onay kutuları kimliği doğrulanmış imza yerine geçmez.
