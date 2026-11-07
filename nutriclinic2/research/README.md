# Focused PubMed metadata snapshot · 25 October 2026

This package captures 12 actual public PubMed queries (six pilot, six retained amendments), 3977 query memberships and 2544 exact unique PMID candidates. All candidate screening/extraction/family decisions remain pending. It is not an eligible-study count or completed systematic review.

`snapshot-20261025/queries.json` preserves literal query strings, date/filter choices and the amendment. `runs.json` links ESearch requests, raw response hashes, server translations, warnings/errors and PMID lists. `metadata-runs.json` links 26 nonoverlapping ESummary batches to exact raw response hashes and requested/returned IDs. `candidates-metadata.json` holds bibliographic fields plus query memberships and explicit pending statuses; no abstract or article full text is included. `known-catalog-probes.json` is a lexical DOI probe only, not a validated sensitivity or eligibility set.

Read `FOCUSED-SEARCH-METHODS.md` in the downloadable focused ZIP or `dist/FOCUSED-SEARCH-METHODS.md` in the full source ZIP for eligibility/extraction, access, appraisal and method-source boundaries.

From the full source ZIP:

```text
node research/verify-search-snapshot.mjs research/snapshot-20261025
```

From the focused ZIP:

```text
node verify-search-snapshot.mjs snapshot-20261025
```

This offline command verifies internal acquisition/metadata consistency. It does not authenticate altered data, re-query PubMed, screen records, infer patient setting or assess clinical effects. Retain the source snapshot/commit. Public databases can change after capture.

No clinical calculation, dose or patient-data route is added by this research package. No institutional login or patient record is included. Do not load these files into the app's patient research JSON importer.

## Separate local draft review ledger · 26 October 2026

The local source package now includes [screening-ledger.mjs](./screening-ledger.mjs) and [its instructions](./SCREENING-LEDGER.md). It creates an **empty sidecar** bound to the exact frozen candidate bytes and the current eligibility-method document, and checks supplied review declarations without changing the snapshot or focused ZIP. This is an implemented recording/validation aid, not completed screening or an approved review protocol.

From the application directory, using the bundled local runtime:

```powershell
& ../../runtime/node.exe research/screening-ledger.mjs init ../my-screening-draft.json
& ../../runtime/node.exe research/screening-ledger.mjs verify ../my-screening-draft.json
```

Initialization refuses existing outputs and protected snapshot/dist paths. The tool makes no network requests. No human names, reviews or decisions are generated. Identity, source access and decision dates remain supplied declarations, not authentication or proof of work. Revision and disagreement checks do not establish blinding, completed independent dual review, adjudication, final eligibility, study families or quality. An empty ledger leaves all2544candidates pending and eligible reports unknown. Use the full instructions before hand-editing any event; unsupported changes are refused. Keep the sidecar outside patient imports and preserve the original source snapshot/commit.
