# Focused original-study search and extraction plan

**Version 0.1.1 · 25 October 2026 · EN main text / TR notes**

This is a reproducible, focused PubMed discovery pilot for the adult ICU/ward nutrition project. It is **not a completed systematic review, independent dual screening, formal risk-of-bias assessment, GRADE profile, thesis or clinical validation**. At the 0.3.7 capture, the 62-record clinical source library includes older trials, guidelines and instruments; it is a separate curated resource, not the result count of this pilot. Search metadata never changes a dose or metabolic interpretation.

## 1. Questions and eligibility to be applied during review

| Question | Population and comparison | Eligible original evidence | What must remain separate |
|---|---|---|---|
| Energy and protein strategy | Adults in ICU versus adults on hospital wards; amount, timing, route or individualized support versus an explicit comparator | Randomized individual/cluster/crossover trials for treatment effects; original comparative observational studies as a separate design stratum | Assigned strategy versus achieved intake; energy and protein cointerventions; acute versus recovery phases; ICU versus ward |
| Metabolic measurement and prognosis | Same populations; nitrogen balance, protein turnover, UCR and related measures against an explicit measurement or outcome | Original measurement/agreement, mechanistic or prognostic studies; derivation and external validation separated | Whole-body balance versus muscle synthesis; association versus measurement validity; prediction versus treatment benefit |
| Treatment-effect modification | A randomized nutrition comparison, with a candidate metabolic/clinical modifier | Original interaction analysis with its parent trial and analysis plan traceable | Interaction versus separate within-subgroup significance; prespecified versus post hoc; participant overlap |
| Individual components | Glutamine, leucine, BCAA, HMB and other AA mixtures, with exact composition/route/timing | Original trials or mechanistic studies, labelled by design and population | Each component versus a mixture; ingredient effect versus bundled exercise/energy; biochemical versus patient-important outcomes |

Include adults aged at least 18 years when the eligible adult subgroup is separable. Pediatric, pregnancy, outpatient/healthy-volunteer and animal-only studies are outside the main clinical application. Mixed samples stay unresolved until adult inpatient results can be separated. Burns, pancreatitis, major surgery, ECMO, organ failure/KRT and rehabilitation need explicit population tags; a result in one such group is not a general ICU recommendation. No minimum sample size is used to declare quality. Design, bias, precision, clinical relevance and applicability take priority over date or size alone.

Reviews and guidelines can locate original studies or supply separately labelled guidance; protocols, registry entries and corrections belong to their study families and do not become completed outcome trials. Abstract-only access is not a full-method review. Conference-only reports, inaccessible methods and uncertain eligibility remain explicit pending states, rather than exclusions solely because access is difficult.

**TR:** Ana hedef yetişkin YBÜ ve servis beslenmesidir. Tarama grubuna girmek gerçek hasta ortamını göstermez; ventilatör bağımlı bir hasta servis sorgusunda bulunabilir. Glutamin, lösin, BCAA ve HMB ayrı çıkarılır. SCFA yalnız ana soruya doğrudan katkısı olan özgün klinik kanıt varsa değerlendirilir.

## 2. Executed search, dates and preserved history

The public **PubMed ESearch/ESummary** interface was used on 25 October 2026, without institutional credentials, cookies or an API key. Requests were sequential with at least 700 ms between calls. No VETİS session was read or renewed for this pilot. The pending institutional-access question remains separate.

Six initial queries crossed two population candidate blocks (ICU / ward) with three topic blocks (energy/protein / metabolic / amino acids). A methodological cross-check identified omitted wording: ventilation, protein provision/delivery, caloric/EN/PN terms, UCR/BUN-creatinine/UUN/PCR/tracer/FSR and generic AA/EAA/whey. Six **amendment01** queries were then executed; the original queries and raw results were retained. This was AI-assisted checking, **not independent human search-specialist review**. Full literal strings are in `snapshot-20261025/queries.json`; each request URL, actual server translation, warning/error object, timestamps, count, IDs and raw-byte SHA-256 are retained in `runs.json`. The amendment was not silently backdated as the original strategy.

All queries used:

```text
(2026/01/01:2026/10/25[dp]) AND (1800/01/01:2026/10/25[crdt])
```

There were **no language, adult, human, study-design, outcome or free-full-text filters**. These criteria must be screened rather than assumed from an index filter. Publication date and record-create date serve different purposes: a 2026 print issue can refer to an earlier online paper, and an updated book record can be retrieved without being a new original 2026 study. The fixed dates do not reconstruct an immutable historical PubMed database or prove when a complete article became available. Future updates must retain a new capture and search record-create dates as well as publication dates; do not simply discard a delayed older publication.

| Query stratum | Pilot hits | Amendment01 hits |
|---|---:|---:|
| ICU energy/protein | 289 | 1153 |
| ICU metabolic | 92 | 113 |
| ICU amino acids | 34 | 186 |
| Ward energy/protein | 393 | 1162 |
| Ward metabolic | 85 | 97 |
| Ward amino acids | 57 | 316 |

Across **12 query runs: 3977 query memberships → 2544 exact unique PMIDs**, with metadata acquired in 26 nonoverlapping batches. The pilot alone had 950 memberships and 771 unique PMIDs. These are retrieval counts, **not screened records, eligible studies, unique trials or participants**. All 2544 metadata candidate rows remain `screeningStatus: pending`, `extractionStatus: pending`, `familyStatus: unresolved`. Selected original-paper access notes elsewhere do not turn this ledger into completed dual screening.

Every ESearch response returned all IDs for its reported count. The server warning that adjusted the requested 10000 limit to 9999 was retained; actual individual query counts were below that limit. No phrase-not-found or search-error entries were returned. Complete ID retrieval means only that these particular queries were captured; it does not establish adequate search sensitivity. The known-catalog DOI probe is a lexical check, not a sensitivity validation set. Several existing criteria, guideline and nutrition-source records remain outside these queries.

Only PubMed was executed. **Embase, CENTRAL, CINAHL, Web of Science/Scopus, a comprehensive registry search, reference/citation chasing, grey literature and an all-years search remain unexecuted in this pilot.** Existing older trials are background anchors, not a substitute for an independently reviewed historical search. Database-specific strings require a search specialist's translation and approval before execution; a PubMed string is not represented as an executed Embase search.

## 3. Record identity, study families and decisions

1. Preserve immutable raw response bytes, capture times and hashes. Exact PMID repetition across queries becomes one candidate with **all** query memberships retained. Retain raw bibliographic dates, publication types, identifiers and title without inferring eligibility from a title or publication-type tag.
2. Normalize DOI case/prefix only for an identity candidate check; do not merge different PMIDs solely because DOI, title, acronym, authors or sample size look alike. Flag conflicting DOI/PMID records for inspection, including corrections, protocols and updated records. Keep a documented canonical record decision and its source.
3. Link reports to a trial/cohort only through explicit original-paper, protocol or registry evidence. Store parent ID, registry, linkage source/location, certainty, report role and overlapping subset. If a report uses two cohorts, retain both roles. An unresolved parent remains null. Never sum all report sample sizes as independent participants.
4. Use two independent human reviewers for title/abstract and then full-text eligibility; record reviewer IDs, timestamp, decision, criterion and a single main full-text exclusion reason. Resolve disagreement with a documented adjudicator. Neither reviewer should see the other's initial decision. The current package supplies pending candidates, **not those completed reviews**.
5. Keep a separate versioned decision ledger keyed by PMID/report ID. Suggested fields: `reviewStage`, `reviewerId`, `decision` (`include/exclude/uncertain`), `reasonCode`, `sourceUrl`, `sourceLocation`, `accessDepth`, `decisionAt`, `adjudicationId`, `familyId` and `familyCertainty`. Do not overwrite raw acquisition files or manufacture reviewer identities. Keep not-retrieved, pending access and uncertain eligibility distinct.
6. Report database hits, exact deduplicated records, screened records, reports sought/retrieved, eligible reports, unique families and analysed participants as separate denominators. An empty decision ledger does not mean zero eligible studies. A PRISMA flow cannot be completed from retrieval counts alone.

## 4. Extraction and appraisal before clinical integration

Use independent extraction/verification with page/section/table provenance. For each original report retain:

- Citation, DOI/PMID, online/print dates, access depth, correction/retraction checks and capture date; parent registration, first submission/public posting, recruitment dates, protocol/SAP versions and dates. A current registry is not proof of historical prespecification.
- Actual setting, centers/countries, eligibility and disease/phase/organ-support context; randomized, eligible, enrolled, complete, outcome-specific analysed and missing denominators, with arm and follow-up timing. Publication-type metadata is not a verified design assessment.
- Assigned and delivered energy/protein; weight denominator and its date/type; route, phase, duration, product and amino-acid composition; energy, exercise and other cointerventions. Record exact analyte/unit/time window and renal/KRT/loss handling before comparing UCR, PCR, UUN or tracer findings.
- Prespecified versus reported primary/secondary/exploratory outcomes; original effect measure, estimate, uncertainty, adjusted covariates, missing-data/estimand rules, clustering/repeated measures and interaction estimates. An improved marker is not automatically improved survival, function or net anabolism.
- Design-appropriate risk-of-bias review by trained reviewers, with domain-level reasons and resolution; certainty assessment for a defined body of evidence/outcome, not a quality score assigned from year, journal, multicenter status or sample size. These appraisals are **not completed** here.
- An explicit proposed software consequence: contextual evidence only; clinician-selectable approach; safety restriction; or no implementation. Require clinical review, source trace and relevant technical checks before a rule change. Conflicting trials must retain their populations/interventions and uncertainty; averaging doses or choosing the newest paper automatically is not a reconciliation method.

## 5. Package and offline verification

The downloadable `focused-search-20261025.zip` contains this note, the raw search/summary snapshot, a research README, an offline consistency verifier, the extended search review (including unexecuted database-specific draft strings), and five selected original-report access notes. It contains bibliographic metadata, **no abstracts/full-text article copies, credentials, proxy URLs or patient records**. A report title in metadata is not evidence that the original full text was read.

With Node.js, extract the ZIP and run from its root:

```text
node verify-search-snapshot.mjs snapshot-20261025
```

In the full source ZIP use:

```text
node research/verify-search-snapshot.mjs research/snapshot-20261025
```

The verifier checks raw hashes, requests, reported/returned IDs, translated queries/warnings/errors, metadata coverage, exact candidate union and memberships, and pending review states. It makes no network requests, reproduces **snapshot consistency**, and cannot prove database completeness, source truth, independence of patients, clinical validity or reviewer competence. Changing both raw data and all associated hashes is outside a hash-consistency check's authentication guarantee; retain the published source snapshot/commit. Re-running PubMed later can return different records or metadata.

## 6. Method sources and access

- [PRISMA-S original reporting extension](https://doi.org/10.1186/s13643-020-01542-z): reporting of searches, source/interface, complete strategies, dates, limits, supplementary methods, records and deduplication. Reporting guidance does not certify search completeness or this project's conduct.
- [Official PRISMA 2020 resources](https://www.prisma-statement.org/prisma-2020): reporting and flow-diagram framework; no completed flow or compliance claim is made for this focused pilot.
- [PubMed Help, NLM](https://pubmed.ncbi.nlm.nih.gov/help/): official search fields/date semantics and translated queries. The ordinary Bookshelf documentation open returned a browser check; only accessible official/indexed documentation was used, without solving a challenge.
- [NCBI E-utilities parameter documentation](https://www.ncbi.nlm.nih.gov/books/NBK25499/?report=printable): official indexed ESearch description including the PubMed retrieval limit; actual count/ID equality was also verified in the stored responses.

**TR teslim notu:** 2544 kayıt, 2544 kaliteli veya uygun araştırma demek değildir. Bu paket aramanın sorgu ve ham veri izini sağlar; bağımsız çift tarama, özgün tam metin çıkarımı ve tasarıma uygun yanlılık/kanıt kesinliği değerlendirmesi henüz tamamlanmadı. YBÜ/servis sınıflaması başlıktan veya hangi sorguda bulunduğundan otomatik atanmaz. Yeni kanıtlar klinik onay olmadan otomatik doz ya da kesin katabolik/anabolik tanıya çevrilmez.

Related: [study-family audit](./STUDY-FAMILIES-AND-SCREENING.md), [clinical-validation CRF](./CLINICAL-VALIDATION-CRF.md), [metabolic validation plan](./METABOLIC-METHODS-AND-VALIDATION.md), [synthetic analysis methods](./ANALYSIS-DRY-RUN-METHODS.md).
