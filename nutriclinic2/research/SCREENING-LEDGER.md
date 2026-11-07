# Local draft eligibility-review ledger / Yerel uygunluk inceleme taslağı

**Version 0.1.0 · 26 October 2026.** This is a separate local recording aid for **human-declared review drafts**, not completed independent dual screening, an approved protocol, authenticated identity, adjudication, trial-family extraction, quality appraisal or a clinical gate. No real screening decisions are supplied. Keep it outside the patient JSON importer.

## Two commands only

From the canonical desktop edition folder, using its bundled runtime:

```powershell
& .\runtime\node.exe .\work\nutriklinik\research\screening-ledger.mjs init .\work\review-ledger.json
& .\runtime\node.exe .\work\nutriklinik\research\screening-ledger.mjs verify .\work\review-ledger.json
```

`init OUTPUT.json` creates an **empty `events: []` ledger** with source binding. It generates no reviewer IDs, decisions, event IDs or review times. Creation is exclusive: existing files are never overwritten, parent directories are not created, and the target must be a `.json` file beneath the canonical local project. `dist/`, the frozen snapshot, symbolic links/junctions and paths outside the project are refused, as are Windows alternate streams, device names and ambiguous trailing-dot/space components. The protected focused ZIP cannot be an output. Path checks are not a guarantee against a hostile process concurrently replacing filesystem components.

`verify INPUT.json` reads and validates only; it does not repair, append, rewrite or publish anything. Both commands first run the existing [frozen-snapshot verifier](./verify-search-snapshot.mjs). They use no network. Success exits 0; usage/schema/path refusals exit 2; unexpected filesystem failures exit 1. There is no append, adjudication, criteria-amendment or final-eligibility command.

## Frozen source binding

The sidecar binds to:

- `research/snapshot-20261025/candidates-metadata.json`, **2544 exact PMIDs**, SHA-256 `324ba27bb601983e5f2a04da8b1b21d9afb4c3ecd1b2175ab7248dbec0183538`;
- exact current bytes of `dist/FOCUSED-SEARCH-METHODS.md`, method version **0.1.1**, with the SHA-256 recorded at initialization and compared again on verification.

The acquisition snapshot and ZIP stay unchanged. Query membership, publication type and dates do not establish eligibility. A changed method hash invalidates that ledger's binding; this tool does not silently migrate prior judgments to changed criteria. The canonical method remains a draft, not an approved study protocol. A matching hash establishes byte consistency, not authorship or review quality.

Pure exports are `buildEmptyLedger(eligibilityMethodSha256)` and `validateLedger(ledger, {candidatePmids, eligibilityMethodSha256})`. They do no I/O or clock-based inference. The CLI obtains their context from the checked canonical files; a caller of the pure function is responsible for supplying trusted source context.

## Human-supplied event contract

The top-level keys are exactly `schemaVersion`, `scope`, `sourceBinding`, `events`. Use the generated empty envelope. Each manually supplied event has **all** fields below; no extra fields are accepted. Events must be a JSON array, with at most 50,000 entries and a 10 MB file limit. Unknown keys, duplicate JSON object keys (including escaped equivalents), invalid UTF-8, non-JSON shapes and excessive nesting are rejected.

| Field | Required declaration |
|---|---|
| `eventId` | Unique, nonempty human-supplied ID, at most 120 characters. |
| `pmid` | Exact string PMID present in the bound snapshot; a report ID, not a unique trial or patient. |
| `reviewerId` | Explicit supplied label, at most 120 characters; different labels do not prove different independent people. |
| `reviewerAuthority` | Exactly `human-declared-unverified`; the tool does not authenticate that claim. |
| `decisionAt` | Human-declared ISO timestamp with seconds and explicit `Z`/UTC offset. Calendar/clock/relative chronology is checked; identity, actual reading and past occurrence are not verified. |
| `criteriaVersion` | Exactly `0.1.1`; amendments require a future explicit design. |
| `stage` / `decision` | `title-abstract`: `advance`, `exclude`, `uncertain`. `full-text`: `include`, `exclude`, `uncertain`. `advance` means further review, not eligible evidence. |
| `reason` | Nonempty principal reason/detail, at most 2000 characters; uncertainty states what is missing. No automatic date, sample-size, design or population inference is performed. |
| `source` | Exactly the five citation fields below, describing what was actually consulted or an unsuccessful retrieval attempt. |
| `supersedesEventId` / `revisionReason` | Both `null` for a first declaration. A revision names the exact earlier current event and gives a nonempty revision reason. |

`source` contains exactly:

- `kind`: `metadata`, `abstract`, `original-report`, `protocol`, `registry` or `correction`;
- `url`: public HTTPS reference without embedded username/password; the tool makes no request and does not certify the publisher or exclude every possible sensitive URL parameter;
- `location`: specific consulted section/table/page or explicit unsuccessful-attempt location;
- `accessDepth`: `metadata-only`, `title-only`, `abstract-only`, `partial-full-text`, `full-text` or `not-retrieved`;
- `checkedAt`: declared source-check/attempt timestamp, no later than `decisionAt`.

Do not enter patient data, login details, cookies, tokens or institutional proxy URLs. `not-retrieved` must remain `uncertain`, regardless of stage. A full-text `include` requires an **actually consulted original-report declaration**, `accessDepth: full-text`, and an original-report URL/location. Metadata, an abstract, a protocol or the PubMed bibliographic page cannot satisfy it. This is a consistency requirement on the human declaration, not proof that the article was read or correctly interpreted. Partial access may support a declared draft exclusion, but is not completed full-method screening.

## Revisions, counts and unresolved disagreement

A reviewer may have only one current declaration per PMID/stage/criteria version. Changes must explicitly supersede that reviewer's earlier **current** event, with a later declared decision time. Cross-reviewer/candidate/stage revisions, dangling or forward references, branches, duplicate event IDs and unreferenced duplicate current decisions are rejected. Earlier events remain in the supplied array. This checks revision consistency; it cannot prove that a user has not removed or rewritten history. There is no immutable audit log, trusted head or authenticated timestamp.

The report counts **current declared decisions**, separately by stage and decision. It also shows candidate reports with/without a current declaration, multiple-reviewer-label reports and unresolved disagreements. Different reviewer decisions never resolve by majority, timestamp or “last wins.” Concordant labels do not establish blinding, independence or final eligibility. Counts can decrease/change when a reviewer explicitly revises a draft; historical events remain counted separately.

`frozenSnapshotScreeningStatus` remains `pending`; `eligibleCount` is always `null` and `eligibilityEvaluated` is always `false`. There are no eligible-trial or participant totals, screened-completion claims, family/bias results or clinical conclusions. An empty ledger has 2544 reports without declarations, not zero eligible studies. Source-access notes elsewhere are not converted into events automatically.

## Technical checks and human work

### 28 October 2026 filename migration

The actual `work/nutriklinik-screening-ledger.json` was still empty when the user requested English filenames. Its original bytes are preserved in `work/screening-ledger-before-filename-migration-20261028.json`. An explicit one-time migration changed only the eligibility-method filename/hash binding after checking that the original Git method text and the renamed method differ by the documented filename substitutions alone. Criteria version 0.1.1, the candidate hash/count and the zero event count were preserved. This is not migration of human judgments, a criteria amendment or a general hash-compatibility exception. Verification still rejects an arbitrary stale/changed method binding. See the [migration receipt](../../screening-ledger-filename-migration-20261028.json). Historical initial verification receipts remain historical.

Run the focused synthetic tests from the application directory:

```powershell
& ..\..\runtime\node.exe --test tests\screening-ledger.test.mjs
```

The tests use explicitly synthetic labels/declarations, exercise the real CLI, and compare every frozen file plus ZIP before/after empty init and verify. Passing tests establish this defined technical behavior only. Actual reviewers must supply their own judgments, retrieval evidence, review process and approvals. Study-family, appraisal and extraction work remain separate.

**Türkçe:** Araç yalnız yerel ve taslak beyan kaydıdır. `init` boş olay listesi oluşturur; değerlendirici veya karar üretmez. `verify` salt okunurdur. Donmuş 2544 adayın dosyaları/ZIP'i değiştirilmez. Başlık–özet aşamasındaki `advance`, tam metin uygunluğu değildir. Erişilemeyen metin `uncertain` kalır. Düzeltme önceki aynı değerlendirici/PMID/aşamaya açıkça bağlanır; farklı beyanlar otomatik uzlaştırılmaz. Farklı kimlik etiketleri bağımsız insan incelemesini, tarih alanları gerçek okuma zamanını veya kararların doğruluğunu kanıtlamaz. Nihai uygunluk, çalışma/hasta toplamı, yanlılık değerlendirmesi veya klinik geçerlik üretilmez.
