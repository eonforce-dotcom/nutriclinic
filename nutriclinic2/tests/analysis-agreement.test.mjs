import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { ANALYSIS_VERSION, analyzeSyntheticAgreement } from "../analysis/agreement.mjs";

const config = () => ({
  construct: "whole-body-nitrogen-balance", unit: "g N/24h", difference: "candidate-minus-reference",
  estimand: "eligible-window", method: "ba2007-varying-value-anova",
  residualAssumption: "independent-within-patient-synthetic", bootstrap: { seed: 20261025, replicates: 40 },
});
const window = (patientId, day, difference = 0) => {
  const start = new Date(Date.UTC(2026, 0, day, 8)).toISOString();
  const end = new Date(Date.UTC(2026, 0, day + 1, 8)).toISOString();
  return {
    patientId, admissionId: "A1", windowId: `W${day}`, revisionId: "R1", selected: true,
    planned: true, attempted: true, collectionComplete: true, setting: "icu", start, end, exitReason: null,
    candidate: { status: "observed", value: difference, unit: "g N/24h", construct: "whole-body-nitrogen-balance", start, end, source: "synthetic candidate" },
    reference: { status: "observed", value: 0, unit: "g N/24h", construct: "whole-body-nitrogen-balance", start, end, source: "synthetic independent placeholder", independent: true },
  };
};
const input = (windows = [window("P1", 1), window("P1", 2), window("P2", 1), window("P2", 2)]) => ({
  schema: "nutriklinik-synthetic-agreement-v1", dataClass: "synthetic", config: config(),
  patients: [...new Set(windows.map((w) => w.patientId))].map((patientId) => ({ patientId, screened: true, eligible: true, enrolled: true })),
  windows,
});
const errors = (report) => report.errors.map((error) => error.code);
const freeze = (value) => { if (value && typeof value === "object") { Object.freeze(value); Object.values(value).forEach(freeze); } return value; };

test("explicit synthetic configuration is mandatory; no real-study or method defaults are inferred", () => {
  assert.equal(ANALYSIS_VERSION, "0.1.0");
  for (const data of [null, {}, { ...input(), dataClass: "clinical" }, { ...input(), schema: "research" }]) {
    const r = analyzeSyntheticAgreement(data);
    assert.equal(r.status, "refused"); assert.equal(r.clinicalPass, null); assert.equal(r.settings.icu.pairs.length, 0);
    assert.equal(r.analysisSetStatus, "not_built");
    assert.deepEqual(r.patients, { total: null, screened: null, eligible: null, enrolled: null });
    for (const setting of Object.values(r.settings)) {
      assert.equal(setting.countsStatus, "not_evaluated");
      assert.ok(Object.values(setting.counts).every((value) => value === null));
    }
  }
  for (const key of ["construct", "unit", "difference", "estimand", "method", "residualAssumption", "bootstrap"]) {
    const data = input(); delete data.config[key];
    assert.equal(analyzeSyntheticAgreement(data).status, "refused", key);
  }
  for (const bootstrap of [{ seed: -1, replicates: 40 }, { seed: 0.1, replicates: 40 }, { seed: 0, replicates: 0 }, { seed: 0, replicates: 10001 }]) {
    const data = input(); data.config.bootstrap = bootstrap;
    assert.equal(analyzeSyntheticAgreement(data).status, "refused");
  }
  const unknown = input(); unknown.patientName = "Forbidden extra field";
  assert.ok(errors(analyzeSyntheticAgreement(unknown)).includes("unknown_field"));
  const empty = analyzeSyntheticAgreement(input([]));
  assert.equal(empty.analysisSetStatus, "built");
  assert.deepEqual(empty.patients, { total: 0, screened: 0, eligible: 0, enrolled: 0 });
  assert.equal(empty.settings.icu.countsStatus, "computed");
  assert.equal(empty.settings.icu.counts.planned, 0, "Valid empty ledger has a true zero rather than an uncomputed count");
});

test("patient denominators are external, nested and never inferred from windows", () => {
  const data = input();
  data.patients.push({ patientId: "E", screened: true, eligible: true, enrolled: false }, { patientId: "S", screened: true, eligible: false, enrolled: false }, { patientId: "U", screened: false, eligible: false, enrolled: false });
  assert.deepEqual(analyzeSyntheticAgreement(data).patients, { total: 5, screened: 4, eligible: 3, enrolled: 2 });
  for (const mutate of [
    (d) => { d.patients[0].screened = false; },
    (d) => { d.patients[0].eligible = false; },
    (d) => { d.patients.push(structuredClone(d.patients[0])); },
    (d) => { d.windows[0].patientId = "not-in-ledger"; },
    (d) => { d.patients = new Array(1); },
    (d) => { d.windows = new Array(1); },
  ]) {
    const changed = structuredClone(data); mutate(changed);
    assert.equal(analyzeSyntheticAgreement(changed).status, "refused");
  }
});

test("observed incompatible metadata or nonfinite values refuse agreement; unavailable is not an independence claim", () => {
  for (const mutate of [
    (w) => { w.reference.independent = false; },
    (w) => { delete w.reference.independent; },
    (w) => { w.candidate.construct = "muscle-FSR"; },
    (w) => { w.reference.unit = "g/kg/day"; },
    (w) => { w.reference.value = "0"; },
    (w) => { w.candidate.value = Infinity; },
    (w) => { w.reference.value = null; },
    (w) => { delete w.reference.status; },
  ]) {
    const data = input(); mutate(data.windows[0]);
    const result = analyzeSyntheticAgreement(data);
    assert.equal(result.status, "refused"); assert.equal(result.settings.icu.anova, null);
  }
  const missing = input(); missing.windows[0].reference = { status: "unavailable" };
  const r = analyzeSyntheticAgreement(missing);
  assert.equal(r.status, "ok");
  assert.equal(r.settings.icu.counts.candidateObserved, 4);
  assert.equal(r.settings.icu.counts.referenceAvailable, 3);
  assert.equal(r.settings.icu.counts.pairs, 3);
  assert.deepEqual(r.ledger.find((w) => w.patientId === "P1" && w.windowId === "W1").reasons, ["reference_unavailable"]);
});

test("zero, signed differences and complete source intervals are retained without classification or mutation", () => {
  const data = freeze(input([window("P1", 1, -2), window("P1", 2, 0), window("P2", 1, 2), window("P2", 2, 4)]));
  const before = JSON.stringify(data), result = analyzeSyntheticAgreement(data), row = result.settings.icu.pairs[1];
  assert.equal(JSON.stringify(data), before);
  assert.equal(result.clinicalPass, null);
  assert.equal(row.candidate, 0); assert.equal(row.reference, 0); assert.equal(row.difference, 0); assert.equal(row.mean, 0);
  assert.equal(row.unit, "g N/24h"); assert.equal(row.construct, "whole-body-nitrogen-balance");
  assert.equal(row.candidateSource, "synthetic candidate"); assert.equal(row.referenceSource, "synthetic independent placeholder");
  assert.equal(row.referenceIndependentSyntheticAssertion, true);
  assert.equal(row.candidateStart, data.windows[1].candidate.start);
  assert.equal(row.referenceEnd, data.windows[1].reference.end);
  assert.equal(result.settings.icu.bias.eligibleWindow, 1);
});

test("revision selection and exact reimport collapse do not manufacture new planned windows", () => {
  const original = window("P1", 1, 1), replacement = structuredClone(original);
  original.selected = false; replacement.revisionId = "R2"; replacement.candidate.value = 2;
  const data = input([original, replacement, structuredClone(replacement)]);
  const r = analyzeSyntheticAgreement(data);
  assert.equal(r.settings.icu.counts.planned, 1); assert.equal(r.settings.icu.counts.attempted, 1);
  assert.equal(r.settings.icu.counts.revisionGroups, 2); assert.equal(r.settings.icu.counts.duplicateRows, 1);
  assert.equal(r.settings.icu.pairs[0].difference, 2);
  const missing = structuredClone(data); missing.windows.forEach((w) => { w.selected = false; });
  const m = analyzeSyntheticAgreement(missing);
  assert.equal(m.settings.icu.counts.planned, 1);
  assert.equal(m.settings.icu.counts.pairs, 0);
  assert.equal(m.settings.icu.counts.unresolvedRevisions, 1);
  assert.ok(m.settings.icu.exclusions[0].reasons.includes("revision_selection_missing"));
  const multiple = structuredClone(data); multiple.windows[0].selected = true;
  assert.ok(analyzeSyntheticAgreement(multiple).settings.icu.exclusions[0].reasons.includes("revision_selection_multiple"));
  const conflict = structuredClone(data); conflict.windows[2].candidate.value = 99;
  const c = analyzeSyntheticAgreement(conflict);
  assert.equal(c.settings.icu.counts.pairs, 0);
  assert.ok(c.settings.icu.exclusions[0].reasons.includes("conflicting_duplicate"));
});

test("unresolved revisions keep unanimous ledger flags and expose conflicting denominators", () => {
  const a = window("P1", 1), b = structuredClone(a);
  a.selected = false; b.selected = false; b.revisionId = "R2"; b.attempted = false; b.collectionComplete = false;
  const r = analyzeSyntheticAgreement(input([a, b]));
  assert.equal(r.settings.icu.counts.planned, 1);
  assert.equal(r.settings.icu.counts.attempted, 0); assert.equal(r.settings.icu.counts.unknownAttempted, 1);
  assert.equal(r.settings.icu.counts.complete, 0); assert.equal(r.settings.icu.counts.unknownComplete, 1);
  assert.equal(r.ledger[0].attempted, null);
  assert.ok(r.ledger[0].reasons.includes("ledger_conflict"));
});

test("time comparisons require explicit zoned exact 24-hour matched windows, not written-date coincidence", () => {
  const data = input([window("P1", 1)]);
  data.windows[0].candidate.start = "2026-01-01T11:00:00+03:00";
  data.windows[0].candidate.end = "2026-01-02T11:00:00+03:00";
  assert.equal(analyzeSyntheticAgreement(data).settings.icu.counts.pairs, 1);
  for (const [mutate, code] of [
    [(w) => { w.start = "2026-01-01T08:00"; }, "interval_invalid"],
    [(w) => { w.end = "2026-02-30T08:00:00Z"; }, "interval_invalid"],
    [(w) => { w.end = "2026-01-02T08:00:00+14:01"; }, "interval_invalid"],
    [(w) => { w.end = "2026-01-02T08:06:00Z"; }, "interval_not_24h"],
    [(w) => { w.reference.end = "2026-01-02T08:00:01Z"; }, "reference_interval_mismatch"],
    [(w) => { w.candidate.start = "2026-01-01T08:00:00"; }, "candidate_interval_invalid"],
  ]) {
    const changed = structuredClone(data); mutate(changed.windows[0]);
    const r = analyzeSyntheticAgreement(changed);
    assert.equal(r.status, "ok", "Incorrect windows are explicit exclusions, not valid pairs");
    assert.equal(r.settings.icu.counts.pairs, 0);
    assert.ok(r.settings.icu.exclusions[0].reasons.includes(code), code);
  }
  const dst = window("P1", 1);
  Object.assign(dst, { start: "2026-03-28T08:00:00+01:00", end: "2026-03-29T09:00:00+02:00" });
  for (const measure of [dst.candidate, dst.reference]) Object.assign(measure, { start: dst.start, end: dst.end });
  assert.equal(analyzeSyntheticAgreement(input([dst])).settings.icu.counts.pairs, 1);
});

test("all selected overlapping intervals are excluded across admissions and settings; adjacency is retained", () => {
  const a = window("P1", 1), adjacent = window("P1", 2), overlap = structuredClone(a);
  overlap.windowId = "OTHER"; overlap.admissionId = "A2"; overlap.setting = "ward";
  const r = analyzeSyntheticAgreement(input([a, adjacent, overlap]));
  assert.equal(r.settings.icu.counts.pairs, 1);
  assert.equal(r.settings.icu.pairs[0].windowId, "W2");
  assert.equal(r.settings.ward.counts.pairs, 0);
  assert.equal(r.settings.icu.reasonCounts.overlap, 1); assert.equal(r.settings.ward.reasonCounts.overlap, 1);
  const unselected = structuredClone(overlap); unselected.selected = false;
  assert.equal(analyzeSyntheticAgreement(input([a, adjacent, unselected])).settings.icu.counts.pairs, 2);
});

test("all exclusion/status reasons and exit events remain visible without zero-filling", () => {
  const dead = window("P1", 1);
  Object.assign(dead, { attempted: false, collectionComplete: false, exitReason: "death", candidate: { status: "unavailable" }, reference: { status: "unreliable" } });
  const r = analyzeSyntheticAgreement(input([dead]));
  assert.equal(r.settings.icu.counts.planned, 1); assert.equal(r.settings.icu.counts.attempted, 0);
  assert.equal(r.settings.icu.counts.candidateObserved, 0); assert.equal(r.settings.icu.counts.referenceAvailable, 0);
  assert.equal(r.ledger[0].exitReason, "death");
  assert.deepEqual(r.ledger[0].reasons, ["not_attempted", "incomplete_collection", "candidate_unavailable", "reference_unreliable"]);
  assert.equal(r.settings.icu.bias.eligibleWindow, null);
});

test("ANOVA zero components are allowed; insufficient or negative components are not silently corrected", () => {
  for (const offset of [0, 2]) {
    const data = input([window("P1", 1, offset), window("P1", 2, offset), window("P2", 1, offset), window("P2", 2, offset)]);
    const r = analyzeSyntheticAgreement(data).settings.icu;
    assert.equal(r.anova.status, "estimable"); assert.equal(r.anova.components.varianceTotal, 0);
    assert.deepEqual(r.anova.loa, { lower: offset, upper: offset });
    assert.equal(r.bootstrap.anovaFailedReplicates, 0); assert.ok(r.bootstrap.loaCI);
  }
  const negative = analyzeSyntheticAgreement(input([window("P1", 1, -1), window("P1", 2, 1), window("P2", 1, -1), window("P2", 2, 1)])).settings.icu;
  assert.equal(negative.anova.reason, "negative_between_component");
  assert.equal(negative.anova.components.varianceBetween, -1); assert.equal(negative.anova.loa, null);
  assert.equal(negative.bootstrap.anovaFailedReplicates, 40);
  assert.equal(negative.bootstrap.biasValidReplicates, 40);
  assert.deepEqual(negative.bootstrap.biasCI.eligibleWindow, { lower: 0, upper: 0 });
  assert.equal(negative.bootstrap.loaCI, null);
  const single = analyzeSyntheticAgreement(input([window("P1", 1), window("P1", 2)])).settings.icu;
  assert.equal(single.anova.reason, "insufficient_patients"); assert.equal(single.bootstrap.replicatesRun, 0);
  const noRepeats = analyzeSyntheticAgreement(input([window("P1", 1), window("P2", 1)])).settings.icu;
  assert.equal(noRepeats.anova.reason, "no_within_patient_repeats"); assert.ok(noRepeats.bootstrap.biasCI);
});

test("patient-weighted sensitivity differs explicitly from the eligible-window primary", () => {
  const r = analyzeSyntheticAgreement(input([window("P1", 1, 0), window("P1", 2, 2), window("P1", 3, 4), window("P2", 1, 8)])).settings.icu;
  assert.equal(r.bias.eligibleWindow, 3.5); assert.equal(r.bias.patientWeighted, 5);
  assert.equal(r.counts.patients, 2); assert.equal(r.counts.pairs, 4);
  assert.equal(r.bootstrap.sampling, "whole-patient-with-replacement");
});

test("host locale and input order cannot change cluster sampling or numeric results", () => {
  const names = ["ı", "İ", "I", "😀", "A"];
  const data = input(names.flatMap((name, i) => [window(name, 1, i), window(name, 2, i)]));
  const result = analyzeSyntheticAgreement(data), reversed = structuredClone(data);
  reversed.windows.reverse(); reversed.patients.reverse();
  const original = String.prototype.localeCompare;
  try {
    String.prototype.localeCompare = () => { throw Error("Host locale collation must not be called"); };
    assert.deepEqual(analyzeSyntheticAgreement(reversed), result);
  } finally { String.prototype.localeCompare = original; }
  assert.deepEqual([...new Set(result.settings.icu.pairs.map((p) => p.patientId))], ["A", "I", "İ", "ı", "😀"]);
});

test("finite extreme inputs cannot silently serialize arithmetic overflow as an ordinary null estimate", () => {
  const difference = input(); difference.windows[0].candidate.value = 1e308; difference.windows[0].reference.value = -1e308;
  assert.ok(errors(analyzeSyntheticAgreement(difference)).includes("nonfinite_pair"));
  const variance = input([window("P1", 1, 1e308), window("P1", 2, -1e308), window("P2", 1, 1e308), window("P2", 2, -1e308)]);
  const r = analyzeSyntheticAgreement(variance).settings.icu;
  assert.equal(r.countsStatus, "computed"); assert.equal(r.counts.pairs, 4);
  assert.equal(r.anova.status, "not_estimable"); assert.equal(r.anova.reason, "nonfinite_variance");
  assert.equal(r.anova.components.withinSS, null);
  assert.equal(r.bootstrap.loaCI, null); assert.equal(r.bootstrap.anovaFailedReplicates, 40);
  assert.ok(!JSON.stringify(r).includes("Infinity"));
});

const root = fileURLToPath(new URL("..", import.meta.url));
const cli = resolve(root, "analysis/run.mjs");
const run = (args) => spawnSync(process.execPath, [cli, ...args], { cwd: root, encoding: "utf8", timeout: 15000, maxBuffer: 2 * 1024 * 1024 });
const digest = (value) => createHash("sha256").update(value).digest("hex");
async function temporary(action) {
  const dir = await mkdtemp(join(tmpdir(), "nutriklinik-analysis-test-"));
  try { await action(dir); }
  finally {
    // The only recursive removal is the exact directory created for this test.
    assert.equal(dirname(dir), resolve(tmpdir()));
    assert.ok(dir.startsWith(join(resolve(tmpdir()), "nutriklinik-analysis-test-")));
    await rm(dir, { recursive: true, force: true });
  }
}

test("CLI replay provenance hashes exact input bytes and the explicit source-file list", async () => {
  await temporary(async (dir) => {
    const path = join(dir, "synthetic.json"), output = join(dir, "report.json");
    const bytes = Buffer.from(JSON.stringify(input(), null, 1) + "\n"); await writeFile(path, bytes);
    const execution = run(["--input", path]);
    assert.equal(execution.status, 0, execution.stderr);
    const report = JSON.parse(execution.stdout);
    assert.equal(report.clinicalPass, null); assert.equal(report.provenance.nodeVersion, process.version);
    assert.equal(report.provenance.inputSha256, digest(bytes)); assert.equal(report.provenance.inputBytes, bytes.length);
    const files = ["analysis/agreement.mjs", "analysis/run.mjs"];
    const contents = await Promise.all(files.map((file) => readFile(resolve(root, file), "utf8")));
    assert.deepEqual(report.provenance.analysisFiles, files);
    assert.equal(report.provenance.analysisSha256, digest(files.map((file, i) => file + "\n" + contents[i]).join("\n")));
    for (let i = 0; i < files.length; i++) assert.equal(report.provenance.analysisFileSha256[files[i]], digest(contents[i]));
    assert.deepEqual(JSON.parse(run(["--input", path]).stdout), report);
    const saved = run(["--input", path, "--output", output]);
    assert.equal(saved.status, 0, saved.stderr); assert.equal(saved.stdout, "");
    assert.deepEqual(JSON.parse(await readFile(output, "utf8")), report);
  });
});

test("CLI refuses unsupported/real input and overwrite routes without changing the fixture or source", async () => {
  await temporary(async (dir) => {
    const path = join(dir, "fixture.json");
    await writeFile(path, JSON.stringify(input())); const before = await readFile(path);
    const sourceBefore = await readFile(cli);
    assert.equal(run(["--input", path, "--output", path]).status, 2);
    assert.equal(run(["--input", path, "--output", cli]).status, 2);
    assert.deepEqual(await readFile(path), before); assert.deepEqual(await readFile(cli), sourceBefore);
    assert.equal(run(["--unknown", path]).status, 2);
    assert.equal(run([]).status, 2);
    assert.equal(run(["--help"]).status, 0);
    await writeFile(path, "{invalid"); assert.equal(run(["--input", path]).status, 2);
    await writeFile(path, JSON.stringify({ ...input(), dataClass: "real" }));
    const refused = run(["--input", path]);
    assert.equal(refused.status, 2); assert.equal(JSON.parse(refused.stdout).status, "refused");
    assert.equal(run(["--input", join(dir, "missing.json")]).status, 1);
  });
});
