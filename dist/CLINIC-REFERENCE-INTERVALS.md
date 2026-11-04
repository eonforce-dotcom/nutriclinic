# Clinic laboratory reference intervals

UI 0.3.18 · local-only · 28 October 2026.

The laboratory page accepts the clinic's own intervals for the ten supported core laboratory measurements. No population interval is prefilled. Enable a measurement and enter a lower bound, an upper bound, or both. Empty bounds are absent, not zero. Both bounds must be nonnegative, finite and ordered; measurements exactly at an entered bound are within the entered bounds.

Enter the hospital/laboratory, assay or source document, profile version, effective start date, optional end date, adult age limits and recorded-sex applicability. A clinician must verify specimen type, assay, reference population and the actual laboratory document. A date-only interval applies inclusively to the written specimen date; it does not establish a collection time. This prototype supports one interval per analyte in one active clinic profile; it does not automatically select among assay-, age-, sex- or specimen-specific subgroups.

Patient comparison requires valid age, recorded sex, assessment/specimen dates, confirmed laboratory measurements, no dependent input error and explicit profile applicability confirmation. Editing patient inputs or clinic settings removes applicability confirmation. Blood and UUN dates remain separate. UUN additionally requires a confirmed, coherent 24-hour collection, matching written collection-end date and positive measured urine volume. An isolated UUN laboratory interval is separate from the requirements and interpretation of approximate nitrogen balance.

Measurements are compared in the application's canonical units. Supported equivalent interval units are albumin g/dL → g/L, absolute cells/µL → 10^9/L, and potassium mEq/L → mmol/L. Other unit conversions are rejected. These are the established import conversions, not a general unit inference service.

Saving a clinic profile stores only its configuration in this browser's local storage. Patient measurements, comparison results and applicability confirmation are excluded. The profile can be exported/imported as `clinic-reference-profile.json` for another workstation. Local storage is origin- and browser-specific; there is no central institution account, profile approval workflow or immutable audit trail. Do not enter patient identifiers in a clinic profile.

Research JSON records include the profile snapshot, validity/errors, supplied comparison results and current applicability. The `labReferences` CSV column is appended after the previous 87 columns. Import preserves the original record as untrusted history, validates configuration again, recomputes the context and clears applicability; imported results or confirmations are never authority. Legacy records without a clinic profile remain accepted. A current clinic profile is retained, unconfirmed, when opening such a record.

These intervals add below/within/above laboratory context. They do not change engine safety guards, GLIM, organ scores, the separately confirmed CRP upper-reference field in disease/metabolism, energy/protein prescriptions or doses. They cannot validate a catabolic/anabolic classifier, an independent physiological reference, treatment benefit or an optimum regimen. The investigator's reference-feasibility worksheet and clinical study decisions remain required for those aims.

Method context: the public [CLSI EP28 product scope](https://clsi.org/shop/standards/ep28/) describes laboratory reference-interval establishment and verification, including transfer considerations. Only the public scope was consulted; the paid full standard was not reviewed. This application does not claim compliance with, or perform, an EP28 establishment/verification study.

Technical tests cover units, exact bounds, missing/invalid inputs, age/sex/date applicability, UUN collection integrity, snapshot isolation and unchanged clinical calculations. NutriClinic supports clinical decisions and does not replace them. Native Chrome pagination and actual narrow-width visual acceptance are still pending after the browser control stopped on 28 October.
