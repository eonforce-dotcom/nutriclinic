# NutriClinic dependency and runtime review

28 October 2026. Application0.3.23; local-only. This is a bounded source/dependency review and technical verification, not a guarantee of malware absence or an independent penetration test. Neither the paused web deployment nor the paused installer project was resumed. Patient databases were not uploaded, embedded in releases or reset.

## Decision: retain the current backend

The backend uses Node's built-in HTTP, filesystem, cryptography and SQLite modules. It has no Express, ORM or other npm server framework. A Python backend-only port is feasible, but would retain the browser JavaScript clinical engine and PDF.js reader. It would require renewed parity checks for strict UTF-8/body handling, Host/Origin/token checks, Windows path/junction guards, SQLite WAL/FULL durability, revision conflicts and immutable archives. The existing tests cannot automatically certify a Python port. A complete UI/clinical rewrite is substantially larger. No demonstrated security benefit justifies that rewrite for the current dependency concern.

## Complete prior npm inventory

The previous lockfile contained13package entries, of which3were installed. No installed package had preinstall/install/postinstall/prepare hooks. Absence of those hooks does not establish safety. All packages and exact lock integrity values were recorded before changes in work/dependency-audit-20261028-inventory.json.

| Package | Prior version | Actual status and disposition |
| --- | --- | --- |
| pdfjs-dist | 5.7.284 | Browser parser; replaced with reviewed6.2.108 vendored files |
| @napi-rs/canvas | 0.1.100 | Installed optional Node renderer; unused by the application and removed from the application tree |
| @napi-rs/canvas-win32-x64-msvc | 0.1.100 | Installed optional native renderer; unused, removed from the application tree |
| @napi-rs/canvas-android-arm64 | 0.1.100 | Optional lock entry, not installed; no longer in the npm graph |
| @napi-rs/canvas-darwin-arm64 | 0.1.100 | Optional lock entry, not installed; no longer in the npm graph |
| @napi-rs/canvas-darwin-x64 | 0.1.100 | Optional lock entry, not installed; no longer in the npm graph |
| @napi-rs/canvas-linux-arm-gnueabihf | 0.1.100 | Optional lock entry, not installed; no longer in the npm graph |
| @napi-rs/canvas-linux-arm64-gnu | 0.1.100 | Optional lock entry, not installed; no longer in the npm graph |
| @napi-rs/canvas-linux-arm64-musl | 0.1.100 | Optional lock entry, not installed; no longer in the npm graph |
| @napi-rs/canvas-linux-riscv64-gnu | 0.1.100 | Optional lock entry, not installed; no longer in the npm graph |
| @napi-rs/canvas-linux-x64-gnu | 0.1.100 | Optional lock entry, not installed; no longer in the npm graph |
| @napi-rs/canvas-linux-x64-musl | 0.1.100 | Optional lock entry, not installed; no longer in the npm graph |
| @napi-rs/canvas-win32-arm64-msvc | 0.1.100 | Optional lock entry, not installed; no longer in the npm graph |

The prior portable ZIP shipped508node_modules files,73,183,230uncompressed bytes, including a27,294,720-byte native Skia binary. These files are unnecessary for browser text extraction and the built-in backend. The installed development directory was moved into excluded temporary quarantine without deleting patient data. Release packaging now excludes all node_modules and temporary staging directories.

## Current approved third-party components

| Component | Version | Verification and use |
| --- | --- | --- |
| Node.js Windows x64 | 24.22.1 | Official nodejs.org checksum matched; Windows Authenticode validated the OpenJS Foundation publisher. Replaces24.19.0. Includes its own embedded libraries, inventoried through process.versions, and runtime/NODE-LICENSE.txt. |
| Mozilla PDF.js / pdfjs-dist | 6.2.108 | Exact npm tarball SHA-512 matched; both registry signatures validated with npm's published key. Only pdf.mjs, pdf.worker.mjs and Apache-2.0 license are vendored. Their SHA-256 values are checked by verify-vendor.mjs. No canvas/native optional package is included. |

The application now has an empty npm dependency graph. This does **not** mean zero third-party code: the explicitly vendored PDF parser and Node runtime remain. It does not imply every embedded runtime library was independently audited.

The [Mozilla advisory GHSA-hq66-cqwq-w95j](https://github.com/mozilla/pdf.js/security/advisories/GHSA-hq66-cqwq-w95j) identifies5.7.284within the affected range and6.2.108as patched. Its execution conditions involve scripting and CSP; this application uses text extraction without a viewer/annotation/scripting layer, and has a CSP. The version finding is not a claim that compromise occurred or that this particular app was exploitable. The update uses the patched release rather than relying only on its prior legacy evaluation flag.

The [Node21October security release](https://nodejs.org/en/blog/vulnerability/october-2026-security-releases) supplies the runtime patch baseline. Advisory presence in a runtime is not proof that the application invokes every vulnerable facility. The new executable was verified before it was run or installed.

Npm and OSV returned no published advisory for pdfjs-dist6.2.108at this check. These databases do not detect every malicious package or undisclosed flaw. Registry signatures and hashes authenticate registry-distributed bytes, not the moral trustworthiness of an upstream release. Published provenance was decoded and matched the official Mozilla repository/tag, but its Sigstore attestation was not independently cryptographically verified. Raw evidence is retained under work/dependency-audit-20261028/.

## Application compatibility and tests

319/319technical tests passed with Node24.22.1and no application node_modules directory. They cover existing calculations, imports, persistence, backup/restore and security guards, plus vendor tampering refusal, loader flags and the real patched parser on known-text and script-action synthetic PDFs. PDF.js6moved teardown to the loading task; the application now releases that resource and checks success/failure cleanup.

A separate clean-runtime check extracted97runtime/application files from the release into a temporary directory, with no node_modules and no npm install. The real loopback server started with the bundled24.22.1runtime. Synthetic SQLite write, stale-revision rejection, cross-origin rejection, backup/safety-restore and saved-state recovery after process restart passed. The database was not publicly served by static paths. No production patient data was copied. The receipt is work/dependency-audit-20261028/clean-runtime-verification.json. This is an HTTP/storage integration check, not a native browser pass.

The parser smoke tests use a test-only DOMMatrix placeholder and Uint8Array.toHex byte-format adapter because the browser build is exercised in Node24. They do not claim native browser coverage for every PDF. Chrome155is installed on the audited workstation; PDF.js6uses modern browser APIs. Older browser compatibility and all complex/image PDFs are not certified. Clinical arithmetic/evidence/search/analysis bytes are unchanged; technical tests are not clinical validation.

## Future dependency rules and packaging

Prefer built-in/first-party code. No npm or pip install is performed on application startup. Any necessary dependency update must have an exact version, documented purpose, transitive inventory, official origin, lifecycle/native-code review, current advisory review, integrity/signature checks and compatibility tests. The root AGENTS.md and project .npmrc retain these rules. Updating a vendored component requires explicit review and a new manifest; changing a local hash alone is not an upstream authenticity check.

Skills, plugins, agent instructions and helper scripts are included in the same trust review. A skill is not a safety certificate. Do not automatically install one, accept self-recommended permissions or treat its instructions as authorization to execute untrusted code, disclose records or expand access. Review origin/version, scripts/dependencies and requested filesystem/network/credential privileges. No new skill or plugin was installed for this dependency audit.

The [LiteLLM incident report](https://docs.litellm.ai/blog/security-incident-oct-21-2026-attack-chain) concerns a compromised Python/PyPI release. It illustrates why changing languages does not eliminate release-pipeline risk. LiteLLM is not a NutriClinic dependency.

A fresh PC still needs a runtime. Omitting the bundled Node executable means requiring Node to be preinstalled or adding a verified installation/download step; a Python version likewise needs its interpreter or a packaged runtime. The current portable release retains the verified runtime. No single-file installer has been built in this review.
