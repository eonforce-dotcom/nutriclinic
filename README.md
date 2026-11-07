# NutriClinic

Staged nutrition recommendation for adult ICU and ward patients.

Enter the patient's data in six short steps. NutriClinic recommends:

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
own field with the accepted range.

> **NutriClinic supports clinical decisions and does not replace them.** Review every recommendation at the
> bedside together with its inputs and sources.

- Live service: <https://sahnoroloji.org/nutriclinic/>
- Previous workspace (saved patients, detailed assessment): <https://sahnoroloji.org/nutriclinic2/>; its source is in
  [`nutriclinic2/`](nutriclinic2/)
- Version: 1.1.0 (7 November 2026); clinical rules and sources: [`docs/CLINICAL-RULES.md`](docs/CLINICAL-RULES.md)

## Privacy

The application is a static page. It has no server component, stores nothing and sends nothing. Its Content Security
Policy blocks all network requests from the page.

## Repository layout

| Path | Contents |
|---|---|
| `web/` | The application: `index.html`, `app.css`, `app.mjs` (staged interface), `engine.mjs` (rule engine, pure functions), `scales.mjs` (screening and assessment scales), `text.mjs`, `sources.mjs` (sources with PMIDs), `initial-locale.mjs`. |
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
node --test tests/engine.test.mjs tests/scales.test.mjs
```

No npm packages are needed (Node.js 24 or later).

## License

Copyright (C) 2026 Gökay Duman. AGPL-3.0-only; see [`LICENSE`](LICENSE) and [`NOTICE`](NOTICE). Please cite as
described in [`CITATION.cff`](CITATION.cff).
