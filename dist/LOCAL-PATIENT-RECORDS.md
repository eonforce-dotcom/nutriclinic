# Local patient records and backup

UI0.3.19 · 28 October2026 · one computer / Windows account ·127.0.0.1 only.

## Daily use

1. Open `START.cmd`. A new installation starts with an empty assessment after local storage connects. The example case is available explicitly through **Load example case**.
2. Enter a patient study code and measurements. Current inputs, clinical fields, intake data, clinic intervals and unfinished reasoning are automatically saved after a short debounce. The status above the form distinguishes pending, saving, saved, failed and conflicting changes. **Wait for “Saved on this computer” before closing.** An in-flight or pending write prompts before ordinary page close; sudden power loss before acknowledgement can still lose the latest unsent keystrokes.
3. **Save assessment** adds an immutable dated assessment to the archive. Editing/reopening creates a working copy; it does not overwrite earlier assessment records. The working list holds200assessments; the archive may contain more and has explicit history pagination. **New assessment** first flushes the previous draft. If the save fails, switching is blocked and the current values remain visible.
4. **Saved patients & backups** opens the archive in Research records. Search by study code; unfinished drafts without a code appear as **Unassigned draft**. Saved drafts are selectable separately. Clearing the working list does not delete archived assessments or previous drafts.
5. On refresh/reopen, saved measurement values, pending text, validation errors and the selected follow-up revisions are recovered. Clinical confirmations are cleared in the current working copy and must be checked again. Historical assessment inputs/outputs, their IDs and version/hash metadata remain unchanged; they are not silently rewritten using newer code. Saved imported comparisons remain untrusted history.

The raw upload preview and original laboratory attachment are not a document archive. Applied results and their recorded provenance are saved. Retain original reports using your existing clinical document workflow.

## Storage and access

- Database: `data/nutriklinik.sqlite` inside the desktop edition folder.
- Consistent backup snapshots: `data/backups/` inside the desktop edition folder.
- WAL/SHM companion files may exist while SQLite is running. Do not copy only the live primary file as a backup; use **Create local backup now**, which includes committed WAL data in a standalone snapshot.
- Patient data are not stored in browser localStorage. The server uses SQLite transactions with FULL synchronization and compare-and-swap revisions. Another tab cannot silently overwrite a newer saved workspace. A conflict keeps the unsaved on-screen draft, offers a recovery download and requires explicit reopening of the saved copy.
- The API is bound to127.0.0.1, checks the exact local Host and Origin, and requires an in-memory request token for data operations. Static website routes cannot serve `data/`. Requests/logs do not print patient values. No application/patient data are uploaded, pushed or deployed.
- This is one local workstation, not a shared network service. There is no application login, role management, encryption-at-rest layer or immutable institutional audit log. Anyone with access to this Windows account/project files can read the local records. Use your workstation's existing access controls and study codes rather than names/identity numbers.

## Backup and recovery

**Create local backup now** produces a standalone SQLite snapshot. An automatic snapshot is also made before the first mutation on a day when prior data exist; the latest14daily snapshots are retained. Manual and before-restore backups are retained. Daily backups are not a separate copy after each keystroke; normal autosave transactions remain the current data store.

Choose a listed backup, check its date and explicitly confirm restore. A safety backup of the current database is created first. Restoration reopens the selected working state and preserves newer archived assessments and missing draft identities. It does not merge conflicting assessment identities or silently erase history. A malformed/corrupt backup fails before replacement.

Keep a periodic copy of a completed backup on your institution-approved separate storage. A backup on the same disk does not protect against loss of that disk. **The software/source ZIP excludes the entire `data/` directory**, including backups. Copying/updating the software package therefore does not back up your patients; do not remove the existing data directory during an update.

If saving fails, keep the tab open, use **Save now** to retry, or download the current **workspace recovery JSON**. **Open a recovery file** validates the file, treats it as an external import, generates new assessment identities, retains originals as untrusted provenance and clears/recomputes current confirmations/results. It cannot authorize an imported treatment or reference comparison. A conflict recovery download is separate from the confirmed SQLite backup.

If the primary database is corrupt, the server reports storage unavailable and does not reset it to an empty database. In that case the normal in-app restore is unavailable: close the local server, preserve the entire existing data directory and recover from a verified standalone backup with technical assistance. Do not delete or overwrite the only copy.

## Verification boundary

299 technical tests passed before the current release checkpoint. Tests include the real HTTP client/server and SQLite file across restart, unfinished drafts, zero versus missing values, stable identities, archive retention, explicit pagination, stale-tab conflicts, failed writes, malformed input, backup/restore and corruption refusal. Core arithmetic and clinical source/analysis/frozen-search bytes are unchanged. This is technical verification, not a new claim about clinical validity.

Live UI verification of this new persistence screen could not run because local browser use is disabled in Work settings. Actual narrow-screen and printed EN/TR pagination acceptance remain open. These limits are separate from the already passing storage/API tests.
