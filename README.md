# NutriClinic

Staged nutrition recommendation for adult ICU and ward patients.

Enter the patient's data in seven short steps. NutriClinic recommends:

- the feeding route;
- source-referenced adult formula products with explicit market/package identities, or a custom label;
- the daily amount, with the pump rate or the number and size of feeds;
- a calculated single-product or two-product daily recipe, without automatic protein-module dosing;
- the supplements that are indicated (thiamine, vitamin D, zinc, glutamine, electrolytes, multivitamins, HMB), with
  calculated doses.

It distinguishes a phase target from the starting rate, gives a conditional 12-hour advancement proposal for eligible new EN starts, and shows actual planned first-day totals. Refeeding, shock and ongoing tolerated feeding use their own criteria. Missing critical facts retain a numeric conditional proposal with prominent assumptions; known contraindications remain distinct. See docs/CHANGELOG-1.11.0.md.

A menu lists every part of the application: the steps, calculators and scales on their own (NRS 2002, GLIM, ESPEN
2015, AND/ASPEN, sarcopenia, swallowing, refeeding risk, SOFA-2 and SAPS II, laboratory values and indices, weight and
targets), the follow-up, the cases on the device and the evidence library. On wide screens it is a fixed column on the
left; on phones and tablets it opens from the menu button. A calculator shows only its questions - the same fields as
in the steps, so what is entered there also goes into the open case - and its result while typing.

NutriClinic never stops because data are missing. It answers with the most cautious documented assumption and lists
the missing data, ordered by how much each one would change the answer. Once the data are complete, the
recommendation is recalculated from those facts. Approximate nitrogen balance (which does not automatically change protein),
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
- Version: **1.11.0**, published 20 November 2026; [release notes](docs/CHANGELOG-1.11.0.md) and [clinical rules and sources](docs/CLINICAL-RULES.md)

## What changed in 1.11.0

- **Starting and advancing enteral feeding:** the phase target rate is separate from the starting rate. Eligible new
  continuous feeds have a proposed 12-hour reassessment schedule and separately calculated first-day delivery.
  The 48-72-hour advancement example depends on tolerance, circulation, electrolytes and phase limits; it is not a
  universal deadline. Ongoing tolerated feeding, shock and refeeding risk have distinct pathways.
- **Named formula products:** 22 adult manufacturer-referenced entries from five manufacturers: Nestlé Health
  Science, Nutricia/Danone, Abbott, Fresenius Kabi and Kate Farms. Turkey and international market/package labels
  are identified separately, with source-check dates. Coverage is not exhaustive; source checks do not establish
  current local availability or replace confirmation of the actual container label. Resource Energy for Turkey
  remains noncalculable until its exact composition table is verified.
- **Formula-first protein coverage:** the system calculates a single-product or two-product daily proposal against
  the current energy/protein targets and known volume limits. Ranking describes nutritional fit, not brand
  superiority. No protein-powder module is automatically prescribed. Unknown formula water is not inferred from
  another product.
- **Reviewed calculations and safety context:** PN amino-acid energy stays in the calorie budget; approximate
  nitrogen balance does not automatically increase protein. Fluid accounting, ceiling-preserving rounding,
  swallowing assessment and renal/neurologic/QT considerations for prokinetic alternatives were corrected.
- **Visible alternatives:** product choices, manually entered amounts, remaining nutrient gaps and limit warnings
  stay visible. Missing critical facts retain a conditional numeric proposal with explicit assumptions; known
  contraindications remain distinct. Numeric product selections are retained in browser/file/site case copies.

## Choosing formulas

1. Enter the patient's data, including the feeding route, whether feeding is new or ongoing, and relevant fluid
   limits. The result shows the best-fitting default for the current targets and known limits.
2. In **Choose formulas / calculate daily amounts**, open **Change products and alternatives**. Choose
   **Turkey** (the default) or **All referenced markets**, then select a first product and optionally a second.
   The market filter controls automatic suggestions; always check the market/package of a manually selected product.
3. Enter the prescribed **Total formula volume limit**, if available. Selecting products recalculates their daily
   amounts, energy/protein totals and remaining gaps. Product details link to manufacturer references and warnings.
4. **Try my own amounts** exposes mL/day fields for comparison; excesses are flagged rather than silently applied.
   **Show the best fitting default** returns to automatic selection. Confirm the container label, allergens,
   route and any texture requirement before using a proposal.
5. Daily product amounts describe the **phase target**. For a new enteral feed, use the separate starting and
   advancement table and its first-day totals. Two-product plans mean **separately administered products**, not
   approval to mix them in one bag.

## Privacy

The application is a static page with one small optional service. With device storage on (the default), cases are kept in this browser's
storage: at most 200, listed under "My cases" (case code, summary, last change; open, rename, delete); the last case
reopens by itself only within 12 hours of its last change; the example case is never kept; turning device storage off
deletes the cases from the device. The chosen language is remembered too. Only when the clinician ticks "Also keep cases on the site" are cases sent: each case goes anonymised under a random
case code (NC-XXXX-XXXX) - only the answers to the form's questions (numbers, choices, ticks, laboratory units), the age
as a five-year band, the product label values, the follow-up and the chosen evidence options; the label and anything
else stay on the device, which matches the code to show the real case. `server/nutriclinic_vault.py` (Python standard
library, SQLite) refuses any other value - a value must be a number of at most six digits before and four after the
decimal mark, true/false, one of the application's own answer words or a laboratory unit - so no name, ID number,
telephone number, e-mail address or date can be stored. A device proves its copies with a random token of which only
the SHA-256 is stored: it sees, changes and deletes only its own copies, and unticking deletes them all (at once, or as
soon as the site can be reached), after which the site refuses that token. The administrator sees every copy,
anonymised (the day of saving only, nothing about the sending device), on `web/yonetim/` behind the site's password. The page's Content Security Policy allows network requests to that service only. A case can be saved as a JSON file and opened again, and the
day-by-day table downloaded as CSV; these files are created on the device only and contain patient data, so they are
kept according to local rules. A follow-up table compares the energy and protein delivered each day with that
day's target and gives the cumulative difference. An evidence library (65 sources) with four decision topics, carried over
from the previous workspace, records the physician's choice. Laboratory PDFs are read on the device with the reviewed
PDF.js 6.2.108 (`web/vendor/`, Apache-2.0); recognised lines are shown for confirmation. The printed report starts with the date, version and intended use and ends with a
summary of every entered value.

## Repository layout

| Path | Contents |
|---|---|
| `web/` | The staged interface, rule engine, scales and laboratory values; `feeding-review-ui.mjs` presents starting/advancement, and `formula-catalog.mjs`, `formula-planning.mjs`, `formula-workspace.mjs` provide referenced products, daily calculations and selection. |
| `tests/` | Engine and scale tests with hand-calculated clinical cases (Node's built-in test runner). |
| `docs/` | Clinical rules with recommendation numbers and sources; `durum.md`: migration plan and status (Turkish). |
| `tools/` | `build_source_zip.py`: builds the corresponding-source archive served with the application (AGPL). |
| `nutriclinic2/` | The previous NutriClinic workspace (version 0.3.23) with its record service, tests and research files. |

## Run it locally

Any static file server works, for example:

```sh
python -m http.server 4230 --bind 127.0.0.1 --directory web
```

Then open <http://127.0.0.1:4230/>. Use synthetic data only.

## Tests

```sh
node --test tests/*.test.mjs
python -m unittest discover -s server/tests
```

No npm packages are needed (Node.js 24 or later).

## License

Copyright (C) 2026 Gökay Duman. AGPL-3.0-only; see [`LICENSE`](LICENSE) and [`NOTICE`](NOTICE). Please cite as
described in [`CITATION.cff`](CITATION.cff).
