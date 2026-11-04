import test from "node:test";
import assert from "node:assert/strict";
import { FOLLOWUP_VERSION, evaluateDelivery, buildDeliverySeries, restoreDelivery } from "../dist/followup-engine.mjs";

const input = (overrides = {}) => ({
  studyId: "CASE-A", age: 65, context: "icu", phase: "late", visitDate: "2026-10-30",
  kcalTarget: 2000, proteinTarget: 100, clinicianConfirmed: true, ...overrides,
});
const delivery = (overrides = {}) => ({
  episodeId: "ADMISSION-1", periodStart: "2026-10-23T08:00+03:00", periodEnd: "2026-10-24T08:00+03:00",
  actualEnergy: 1500, actualProtein: 80, targetVersion: "RX-1", source: "Verified complete administration and oral intake record",
  targetsStable: true, confirmed: true, ...overrides,
});
const selection = (overrides = {}) => ({ studyId: "CASE-A", episodeId: "ADMISSION-1", context: "icu", phase: "late", targetVersion: "RX-1", ...overrides });
const record = (recordId, overrides = {}, inputOverrides = {}) => ({
  recordId, input: input(inputOverrides), delivery: { version: FOLLOWUP_VERSION, measures: delivery(overrides), output: { valid: true, percent: { energy: 999 } } },
});
const codes = (messages) => messages.map((message) => message.code);

test('out-of-range prescriptions cannot create non-finite or misleading delivery ratios',()=>{
 for(const change of [{kcalTarget:Number.MIN_VALUE},{proteinTarget:Number.MIN_VALUE},{kcalTarget:10001},{proteinTarget:501},{age:121}]){
  const r=evaluateDelivery(input(change),delivery());assert.equal(r.valid,false);assert.equal(r.percent.energy,null);assert.equal(r.percent.protein,null);
 }
 assert.equal(evaluateDelivery(input({kcalTarget:100,proteinTarget:1}),delivery()).valid,true);
 assert.equal(evaluateDelivery(input({inputErrors:['kcalTarget']}),delivery()).valid,false);
});

test("a verified exact interval yields descriptive signed differences and ratios only", () => {
  assert.equal(FOLLOWUP_VERSION, "0.3.1");
  const r = evaluateDelivery(input(), delivery());
  assert.equal(r.valid, true);
  assert.deepEqual(r.actual, { energy: 1500, protein: 80 });
  assert.deepEqual(r.targets, { energy: 2000, protein: 100 });
  assert.deepEqual(r.percent, { energy: 75, protein: 80 });
  assert.deepEqual(r.difference, { energy: -500, protein: -20 });
  assert.equal(r.period.hours, 24);
  assert.equal(r.period.basis, "instant");
  assert.equal(r.nitrogen, null);
  assert.equal("plan" in r, false);
  assert.equal("recommendedDose" in r, false);
  assert.equal("anabolic" in r, false);
  const excess = evaluateDelivery(input(), delivery({ actualEnergy: 2500, actualProtein: 125 }));
  assert.deepEqual(excess.difference, { energy: 500, protein: 25 });
  assert.deepEqual(excess.percent, { energy: 125, protein: 125 });
});

test("explicit zero intake is valid and missing intake is never converted into zero", () => {
  const zero = evaluateDelivery(input(), delivery({ actualEnergy: 0, actualProtein: 0 }));
  assert.equal(zero.valid, true);
  assert.deepEqual(zero.percent, { energy: 0, protein: 0 });
  for (const value of [null, undefined, "", "0", false]) {
    for (const field of ["actualEnergy", "actualProtein"]) {
      const r = evaluateDelivery(input(), delivery({ [field]: value }));
      assert.equal(r.valid, false);
      assert.equal(r.percent.energy, null);
      assert.equal(r.actual[field === "actualEnergy" ? "energy" : "protein"], null);
    }
  }
});

test("bounds, complete scope and explicit confirmations cannot be bypassed", () => {
  for (const overrides of [
    { actualEnergy: -1 }, { actualEnergy: 15000.01 }, { actualEnergy: Infinity },
    { actualProtein: -1 }, { actualProtein: 500.01 }, { actualProtein: NaN },
    { episodeId: "" }, { episodeId: "x".repeat(81) }, { targetVersion: "x".repeat(161) },
    { source: "" }, { confirmed: "true" }, { targetsStable: false }, { invalidFields: ["actualEnergy"] },
  ]) assert.equal(evaluateDelivery(input(), delivery(overrides)).valid, false, JSON.stringify(overrides));
  for (const overrides of [
    { studyId: "" }, { age: 17 }, { age: "65" }, { context: "other" }, { phase: "" },
    { kcalTarget: 0 }, { proteinTarget: 0 }, { kcalTarget: "2000" }, { proteinTarget: Infinity }, { clinicianConfirmed: false },
  ]) assert.equal(evaluateDelivery(input(overrides), delivery()).valid, false, JSON.stringify(overrides));
  assert.equal(evaluateDelivery(input(), delivery({ actualEnergy: 15000, actualProtein: 500 })).valid, true);
  assert.equal(evaluateDelivery(input({ context: "ward", phase: "recovery" }), delivery()).valid, true);
});

test("calendar validation rejects rollover, invalid timestamps and future end dates", () => {
  for (const overrides of [
    { periodStart: "2026-02-30T08:00Z" }, { periodEnd: "2026-13-24T08:00Z" },
    { periodEnd: "2026-10-24T24:00Z" }, { periodEnd: "2026-10-24T08:00+15:00" },
    { periodEnd: "2026-10-24T08:00+14:01" }, { periodEnd: "24.10.2026 08:00" },
    { periodEnd: "2026-10-24" }, { periodEnd: " 2026-10-24T08:00Z" },
    { periodStart: "2026-10-30T08:00Z", periodEnd: "2026-10-31T08:00Z" },
  ]) assert.equal(evaluateDelivery(input(), delivery(overrides)).valid, false);
  for (const visitDate of ["2026-02-30", "30.10.2026", "2026-13-01", null])
    assert.equal(evaluateDelivery(input({ visitDate }), delivery()).valid, false);
  assert.equal(evaluateDelivery(input({ visitDate: "2024-03-01" }), delivery({ periodStart: "2024-02-28T08:00Z", periodEnd: "2024-02-29T08:00Z" })).valid, true);
});

test("only exactly 24 hours are compared; tolerance or rate normalization is not applied", () => {
  for (const periodEnd of ["2026-10-24T07:59+03:00", "2026-10-24T08:01+03:00", "2026-10-24T08:00:00.001+03:00", "2026-10-25T08:00+03:00", "2026-10-22T08:00+03:00"])
    assert.ok(codes(evaluateDelivery(input(), delivery({ periodEnd })).errors).includes("period_24h"));
});

test("zoned instants honor offset changes/DST; wall times remain a separate warned basis", () => {
  const dst23 = evaluateDelivery(input(), delivery({ periodStart: "2026-03-28T08:00+01:00", periodEnd: "2026-03-29T08:00+02:00" }));
  assert.equal(dst23.valid, false);
  assert.equal(dst23.period.hours, 23);
  const dst25 = evaluateDelivery(input(), delivery({ periodStart: "2026-10-24T08:00+02:00", periodEnd: "2026-10-25T08:00+01:00" }));
  assert.equal(dst25.valid, false);
  assert.equal(dst25.period.hours, 25);
  const actual24 = evaluateDelivery(input(), delivery({ periodStart: "2026-03-28T08:00+01:00", periodEnd: "2026-03-29T09:00+02:00" }));
  assert.equal(actual24.valid, true);
  const wall = evaluateDelivery(input(), delivery({ periodStart: "2026-03-28T08:00", periodEnd: "2026-03-29T08:00" }));
  assert.equal(wall.valid, true);
  assert.equal(wall.period.basis, "wall");
  assert.ok(codes(wall.notes).includes("wall_time"));
  const mixed = evaluateDelivery(input(), delivery({ periodStart: "2026-10-23T08:00", periodEnd: "2026-10-24T08:00+03:00" }));
  assert.equal(mixed.valid, false);
  assert.equal(mixed.period.hours, null);
  assert.ok(codes(mixed.errors).includes("mixed_time_basis"));
});

test("series re-evaluates raw snapshots, sorts rows and accepts half-open adjacency", () => {
  const records = [
    record("second", { periodStart: "2026-10-24T08:00+03:00", periodEnd: "2026-10-25T08:00+03:00" }),
    record("first"),
  ];
  const r = buildDeliverySeries(records, selection());
  assert.deepEqual(r.rows.map((row) => row.recordId), ["first", "second"]);
  assert.equal(r.rows[0].percent.energy, 75);
  assert.equal(r.excluded.length, 0);
  assert.equal(r.summary.days, 2);
  assert.equal(r.summary.calendarDays, 2);
  assert.equal(r.summary.missingDays, 0);
  assert.equal(r.summary.totalEnergy, 3000);
  assert.equal(r.summary.targetEnergy, 4000);
  assert.equal(r.summary.energyPercent, 75);
  assert.equal(r.summary.basis, "instant");
});

test("duplicate/imported/partially overlapping windows exclude every involved member", () => {
  for (const second of [
    record("imported-random-id"),
    record("shifted", { periodStart: "2026-10-23T09:00+03:00", periodEnd: "2026-10-24T09:00+03:00" }),
    record("same-instant-other-offset", { periodStart: "2026-10-23T05:00Z", periodEnd: "2026-10-24T05:00Z" }),
    record("unconfirmed-revision", { confirmed: false }),
  ]) {
    const r = buildDeliverySeries([record("first"), second], selection());
    assert.equal(r.rows.length, 0);
    assert.equal(r.excluded.length, 2);
    assert.ok(r.excluded.every((row) => codes(row.reasons).includes("overlap")));
    assert.equal(r.summary.totalEnergy, null);
  }
});

test("explicit revision selection resolves duplicates without choosing silently", () => {
  const records = [record("original"), record("revision", { actualEnergy: 1600 })];
  const r = buildDeliverySeries(records, selection({ selectedIds: ["revision"] }));
  assert.equal(r.rows.length, 1);
  assert.equal(r.rows[0].recordId, "revision");
  assert.equal(r.summary.totalEnergy, 1600);
  const empty = buildDeliverySeries(records, selection({ selectedIds: [] }));
  assert.equal(empty.rows.length, 0);
  assert.equal(empty.summary.totalEnergy, null);
  assert.equal(buildDeliverySeries(records, selection({ selectedIds: "revision" })).rows.length, 0);
});

test("scope keys and numeric prescription identity separate cases, admissions, contexts and targets", () => {
  const records = [
    record("correct"), record("other-case", {}, { studyId: "CASE-B" }),
    record("other-admission", { episodeId: "ADMISSION-2" }),
    record("other-context", {}, { context: "ward" }), record("other-phase", {}, { phase: "early" }),
    record("other-target", { targetVersion: "RX-2" }),
  ];
  const r = buildDeliverySeries(records, selection());
  assert.deepEqual(r.rows.map((row) => row.recordId), ["correct"]);
  assert.equal(r.excluded.length, 5);
  assert.ok(r.excluded.every((row) => codes(row.reasons).includes("scope_mismatch")));
  for (const key of ["studyId", "episodeId", "context", "phase", "targetVersion"]) {
    const incomplete = selection();
    delete incomplete[key];
    assert.equal(buildDeliverySeries(records, incomplete).rows.length, 0);
  }
  const conflict = buildDeliverySeries([record("first"), record("second", { periodStart: "2026-10-24T08:00+03:00", periodEnd: "2026-10-25T08:00+03:00" }, { kcalTarget: 2200 })], selection());
  assert.equal(conflict.rows.length, 0);
  assert.ok(conflict.excluded.every((row) => codes(row.reasons).includes("target_conflict")));
});

test("duplicate identities are ambiguous even when intervals are adjacent", () => {
  const r = buildDeliverySeries([record("same"), record("same", { periodStart: "2026-10-24T08:00+03:00", periodEnd: "2026-10-25T08:00+03:00" })], selection());
  assert.equal(r.rows.length, 0);
  assert.ok(r.excluded.every((row) => codes(row.reasons).includes("duplicate_identity")));
});

test("series never combines wall and instant bases or claims calendar coverage for them", () => {
  const r = buildDeliverySeries([record("instant"), record("wall", { periodStart: "2026-10-24T08:00", periodEnd: "2026-10-25T08:00" })], selection());
  assert.equal(r.rows.length, 0);
  assert.equal(r.summary.basis, null);
  assert.equal(r.summary.calendarDays, null);
  assert.equal(r.summary.missingDays, null);
  assert.equal(r.summary.coverageComparable, false);
  assert.ok(codes(r.notes).includes("series_time_basis"));
});

test("gaps remain missing observations rather than zero-filled intake", () => {
  const r = buildDeliverySeries([record("first"), record("third", { periodStart: "2026-10-25T08:00+03:00", periodEnd: "2026-10-26T08:00+03:00" })], selection());
  assert.equal(r.summary.days, 2);
  assert.equal(r.summary.calendarDays, 3);
  assert.equal(r.summary.missingDays, 1);
  assert.equal(r.summary.totalEnergy, 3000);
  assert.equal(r.summary.targetEnergy, 4000);
  assert.equal(r.summary.energyPercent, 75);
  const shifted = buildDeliverySeries([record("first"), record("shifted", { periodStart: "2026-10-24T09:00+03:00", periodEnd: "2026-10-25T09:00+03:00" })], selection());
  assert.equal(shifted.rows.length, 2);
  assert.equal(shifted.summary.calendarDays, null);
  assert.equal(shifted.summary.missingDays, null);
  assert.equal(shifted.summary.coverageComparable, false);
});

const nitrogenInput = (overrides = {}) => input({
  labDate: "2026-10-24", labsConfirmed: true, uun: 8, uunDate: "2026-10-24", actualProtein: 80,
  collectionStart: "2026-10-23T08:00+03:00", collectionEnd: "2026-10-24T08:00+03:00",
  urineVolume: 1500, collectionComplete: true, collectionMatched: true, renal: "none", extraLosses: false, ...overrides,
});
test("nitrogen uses the core estimate only for the same exact window and actual protein", () => {
  const r = evaluateDelivery(nitrogenInput(), delivery());
  assert.equal(r.valid, true);
  assert.equal(r.nitrogen, 0.8);
  assert.ok(codes(r.notes).includes("nitrogen_limit"));
  const equivalentZone = evaluateDelivery(nitrogenInput({ collectionStart: "2026-10-23T05:00Z", collectionEnd: "2026-10-24T05:00Z" }), delivery());
  assert.equal(equivalentZone.nitrogen, 0.8);
  const tinyArithmetic = evaluateDelivery(nitrogenInput({ actualProtein: 80 + 1e-10 }), delivery());
  assert.equal(tinyArithmetic.nitrogen, 0.8);
  for (const overrides of [
    { collectionStart: "2026-10-23T08:01+03:00", collectionEnd: "2026-10-24T08:01+03:00" },
    { collectionStart: "2026-10-23T08:00", collectionEnd: "2026-10-24T08:00" },
  ]) {
    const mismatched = evaluateDelivery(nitrogenInput(overrides), delivery());
    assert.equal(mismatched.nitrogen, null);
    assert.ok(codes(mismatched.notes).includes("nitrogen_window"));
  }
  const proteinConflict = evaluateDelivery(nitrogenInput({ actualProtein: 79.9 }), delivery());
  assert.equal(proteinConflict.nitrogen, null);
  assert.ok(codes(proteinConflict.notes).includes("nitrogen_protein"));
  for (const overrides of [{ renal: "aki" }, { extraLosses: true }, { collectionComplete: false }, { labsConfirmed: false }])
    assert.equal(evaluateDelivery(nitrogenInput(overrides), delivery()).nitrogen, null);
});

test("clinical kidney and intestinal-loss context suppresses nitrogen in delivery and pooled series", () => {
  const safe={conditions:['none'],contextReviewed:true};
  assert.equal(evaluateDelivery(nitrogenInput(),delivery(),safe).nitrogen,0.8);
  for(const context of [{conditions:['kidney'],contextReviewed:true},{conditions:['shortBowel'],contextReviewed:true},{...safe,highOutputStoma:true}]){
    const r=evaluateDelivery(nitrogenInput(),delivery(),context);
    assert.equal(r.valid,true);
    assert.equal(r.percent.energy,75);
    assert.equal(r.nitrogen,null);
    assert.ok(codes(r.notes).includes('nitrogen_ineligible'));
    const row={recordId:'context-record',input:nitrogenInput(),delivery:{measures:delivery()},clinicalProfile:{measures:context}};
    const series=buildDeliverySeries([row],selection());
    assert.equal(series.summary.days,1);
    assert.equal(series.rows[0].nitrogen,null);
  }
  for(const key of ['renal','extraLosses'])assert.equal(evaluateDelivery(nitrogenInput({inputErrors:[key]}),delivery()).nitrogen,null);
});

test("restore keeps valid zeros and source fields, clears confirmations and preserves invalid-field flags", () => {
  const source = delivery({ actualEnergy: 0, actualProtein: 0 });
  const restored = restoreDelivery({ version: FOLLOWUP_VERSION, measures: source, output: { valid: true } });
  assert.equal(restored.actualEnergy, 0);
  assert.equal(restored.actualProtein, 0);
  assert.equal(restored.confirmed, false);
  assert.equal(restored.targetsStable, false);
  assert.deepEqual(restored.invalidFields, []);
  assert.equal(evaluateDelivery(input(), restored).valid, false);
  const invalid = restoreDelivery({ ...source, actualEnergy: "0", actualProtein: -1, periodEnd: "2026-02-30T08:00Z", confirmed: "yes", unexpected: "ignored" });
  assert.equal(invalid.actualEnergy, null);
  assert.equal(invalid.actualProtein, null);
  assert.ok(invalid.invalidFields.includes("actualEnergy"));
  assert.ok(invalid.invalidFields.includes("actualProtein"));
  assert.ok(invalid.invalidFields.includes("periodEnd"));
  assert.equal("unexpected" in invalid, false);
  assert.equal(evaluateDelivery(input(), { ...invalid, actualEnergy: 0, actualProtein: 0, confirmed: true, targetsStable: true }).valid, false);
  assert.ok(restoreDelivery({ measures: [] }).invalidFields.includes("delivery"));
});

test("raw stored output claims are ignored and none of the inputs or records are mutated", () => {
  const records = [record("first")];
  const raw = records[0].delivery.measures;
  const before = structuredClone(records);
  Object.freeze(records[0].input);
  Object.freeze(raw);
  Object.freeze(records[0].delivery);
  Object.freeze(records[0]);
  Object.freeze(records);
  const restored = restoreDelivery(raw);
  const series = buildDeliverySeries(records, selection());
  assert.equal(series.rows[0].percent.energy, 75);
  assert.deepEqual(records, before);
  assert.equal(restored.confirmed, false);
  assert.equal(raw.confirmed, true);
  const fabricated = record("fabricated", { actualEnergy: null });
  fabricated.output = { valid: true, percent: { energy: 100 } };
  assert.equal(buildDeliverySeries([fabricated], selection()).rows.length, 0);
  for (const message of [...series.rows[0].errors, ...series.rows[0].notes, ...series.notes]) assert.ok(message.en && message.tr);
});
