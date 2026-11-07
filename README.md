# NutriClinic

Staged nutrition recommendation for adult ICU and ward patients.

Enter the patient's data in seven short steps. NutriClinic recommends:

- the feeding route;
- the formula class by content (no brands);
- the daily amount, with the pump rate or the number and size of feeds;
- protein-module and powder grams;
- the supplements that are indicated (thiamine, vitamin D, zinc, glutamine, electrolytes, multivitamins, HMB), with
  calculated doses.

It also gives a day-by-day progression table and the monitoring to do.

NutriClinic never stops because data are missing. It answers with the most cautious documented assumption and lists
the missing data, ordered by how much each one would change the answer. Once the data are complete, the
recommendation becomes the ideal one for that patient. The anabolic/catabolic state (24-hour urine urea nitrogen),
dysphagia (FOIS, IDDSI, EAT-10), nutritional risk (NRS 2002), malnutrition (GLIM), diarrhoea, constipation, kidney
replacement therapy, refeeding risk and non-nutritional calories (propofol, dextrose) all change the result. ESPEN
2015, AND/ASPEN and EWGSOP2 (sarcopenia) assessments are shown with their sources. An invalid value is shown under its
own field with the accepted range. Laboratory values are entered in the laboratory's own unit (for example mg/dL or
mmol/L) and converted; phosphate during feeding detects refeeding hypophosphataemia. Laboratory results can be imported
from a CSV or JSON file read on the device; the laboratory's own reference intervals mark low and high values; SOFA-2
and a recorded SAPS II total are shown for ICU patients.

> **NutriClinic supports clinical decisions and does not replace them.** Review every recommendation at the
> bedside together with its inputs and sources.

- Live service: <https://sahnoroloji.org/nutriclinic/>
- Previous workspace (saved patients, detailed assessment): <https://sahnoroloji.org/nutriclinic2/>; its source is in
  [`nutriclinic2/`](nutriclinic2/)
- Version: 1.7.0 (7 November 2026); clinical rules and sources: [`docs/CLINICAL-RULES.md`](docs/CLINICAL-RULES.md)

## Privacy

The application is a static page. It has no server component and sends nothing. With device storage on (the default), cases are kept only in this browser's
storage: at most 50, listed under "My cases" (case code, summary, last change; open, rename, delete); the last case
reopens by itself only within 12 hours of its last change; the example case is never kept; turning device storage off
deletes the cases from the device. The chosen language is remembered too. Its Content Security
Policy blocks all network requests from the page. A case can be saved as a JSON file and opened again, and the
day-by-day table downloaded as CSV; these files are created on the device only and contain patient data, so they are
kept according to local rules. A follow-up table compares the energy and protein delivered each day with that
day's target and gives the cumulative difference. An evidence library (65 sources) with four decision topics, carried over
from the previous workspace, records the physician's choice. Laboratory PDFs are read on the device with the reviewed
PDF.js 6.2.108 (`web/vendor/`, Apache-2.0); recognised lines are shown for confirmation. The printed report starts with the date, version and intended use and ends with a
summary of every entered value.

## Repository layout

| Path | Contents |
|---|---|
| `web/` | The application: `index.html`, `app.css`, `app.mjs` (staged interface), `engine.mjs` (rule engine, pure functions), `scales.mjs` (screening and assessment scales), `labs.mjs` (laboratory units and indices), `followup.mjs` (delivered nutrition), `cases.mjs` (cases kept on this device), `evidence-data.mjs` (evidence library and decision topics), `vendor/` (PDF.js 6.2.108, Apache-2.0), `text.mjs`, `sources.mjs` (sources with PMIDs), `initial-locale.mjs`. |
| `tests/` | Engine and scale tests with hand-calculated clinical cases (Node's built-in test runner). |
| `docs/` | Clinical rules with recommendation numbers and sources; `durum.md`: migration plan and status (Turkish). |
| `tools/` | `build_source_zip.py`: builds the corresponding-source archive served with the application (AGPL). |
| `nutriclinic2/` | The previous NutriClinic workspace (version 0.3.23) with its record service, tests and research files. |

## Run it locally

Any static file server works, for example:

```sh
python -m http.server 4230 --directory web
```

Then open <http://127.0.0.1:4230/>. Use synthetic data only.

## Tests

```sh
node --test tests/engine.test.mjs tests/scales.test.mjs tests/labs.test.mjs tests/followup.test.mjs tests/cases.test.mjs
```

No npm packages are needed (Node.js 24 or later).

## License

Copyright (C) 2026 Gökay Duman. AGPL-3.0-only; see [`LICENSE`](LICENSE) and [`NOTICE`](NOTICE). Please cite as
described in [`CITATION.cff`](CITATION.cff).
