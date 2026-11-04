# NutriClinic

Clinician-supervised workspace for adult ICU and ward nutrition assessment.

NutriClinic brings anthropometry, GLIM, ESPEN and NRS 2002 support, sarcopenia (EWGSOP2) and dysphagia records, laboratory import with clinic reference intervals, energy and protein planning, daily intake follow-up and a source-traceable evidence library together in one browser application. The interface opens in English and offers Turkish.

> **Research version, not clinically validated.** NutriClinic supports clinician review. It does not make a definitive diagnosis of malnutrition, sarcopenia or anabolic/catabolic state and does not set an automatic optimal amino-acid dose. Technical tests are not clinical validation; inputs, sources and results must be checked by the clinical team.

- Live service: <https://sahnoroloji.org/nutriclinic/>
- Version: 0.3.23 (4 November 2026)

## Repository layout

| Path | Contents |
|---|---|
| `dist/` | The browser application (HTML, CSS and JavaScript modules) with its method and evidence documents. `dist/vendor/` holds the vendored Mozilla PDF.js build. |
| `hosted/` | Python record service, standard library only: `nutriclinic_api.py` (HTTP API and guest mode), `nutriclinic_store.py` (SQLite storage, backups and restore), `dev_server.py` (local test server) and `build_source_zip.py` (builds the corresponding-source archive). |
| `tests/` | Tests for the browser modules, run with Node's built-in test runner. |
| `hosted/tests/` | Tests for the record service, run with Python's `unittest`. |
| `analysis/` | Agreement-analysis code with synthetic fixtures. |
| `research/` | Frozen PubMed search snapshot of 25 October 2026, its verification script and the screening-ledger tool. |

## Run it locally

Python 3.12 or later is enough; nothing needs to be installed.

```sh
python hosted/dev_server.py <empty-data-folder> 4210 --guest
```

Then open <http://127.0.0.1:4210/nutriclinic/>. The development server imitates the hosted setup: `/nutriclinic/` is the open guest space (one cookie-bound space per browser) and `/nutriclinic/tam/` stands for the password-protected full access. Use synthetic data only.

## Tests

```sh
node --test tests/*.test.mjs
python -m unittest discover -s hosted/tests
```

No npm packages are needed. Checked for this release with Node.js 24.22 (320 tests passing) and Python 3.14 (25 tests passing, 1 skipped); the live record service runs on Python 3.12.

## Hosted deployment in short

nginx serves `dist/` at `/nutriclinic/` (open guest mode) and at `/nutriclinic/tam/` (HTTP basic auth), proxies `/nutriclinic/api/local/` and `/nutriclinic/tam/api/local/` to the record service, clears `X-Remote-User` on the open path and sets it from basic auth on `/tam/`. The record service is a WSGI application (`nutriclinic_api:application`; the live service runs it under gunicorn) configured through `NUTRICLINIC_DATA_ROOT`, `NUTRICLINIC_PATH_PREFIX=/nutriclinic`, `NUTRICLINIC_GUEST_MODE=1`, `NUTRICLINIC_FULL_PREFIX=/nutriclinic/tam` and `NUTRICLINIC_ALLOWED_HOSTS`. Optionally, nginx sets a readable cookie `nc_ulke=<country code>` (for example from Cloudflare's `CF-IPCountry`) so that visitors from Turkey open the Turkish interface.

This repository is the source edition: `dist/edition.mjs` says `EDITION = 'local'`. The hosted service is served with `EDITION = 'server'`, which changes only the storage wording; `hosted/dev_server.py` and `hosted/build_source_zip.py` make that switch. `dist/index.html` links to `focused-search-20261025.zip`, a generated download on the live service whose snapshot and reviews are in `research/`. Server-specific deployment scripts and the desktop launcher are not part of this repository.

## Dependencies

`package.json` declares no dependencies and `.npmrc` disables npm lifecycle scripts. The record service uses only the Python standard library. Mozilla PDF.js is vendored in `dist/vendor/` and pinned by SHA-256; `node verify-vendor.mjs` checks it.

## Patient data

Enter de-identified study codes only, never names or identity numbers. This repository contains software and synthetic test data only: no patient records, credentials or server secrets.

## License

Copyright (C) 2026 Gökay Duman (Dr. Gökay Duman · Neurology).

NutriClinic is free software, licensed under the GNU Affero General Public License v3.0 only (AGPL-3.0-only); see [LICENSE](LICENSE) and [NOTICE](NOTICE). If you run a modified version for users over a network, section 13 of the license requires you to offer those users the corresponding source of your version.

Third-party component: Mozilla PDF.js (Apache-2.0); see [dist/legal/THIRD-PARTY-NOTICES.txt](dist/legal/THIRD-PARTY-NOTICES.txt) and [dist/vendor/PDFJS-LICENSE.txt](dist/vendor/PDFJS-LICENSE.txt). Cited publications, guidelines and other external works keep their own copyright and are not licensed by this repository.

## Citation

If you use NutriClinic in research or teaching, please cite it; GitHub's "Cite this repository" button reads [CITATION.cff](CITATION.cff). Citation is requested; it is not an additional condition of the license.

> Duman G. NutriClinic: clinical nutrition workspace [software]. Version 0.3.23. 2026. Available from: https://sahnoroloji.org/nutriclinic/
