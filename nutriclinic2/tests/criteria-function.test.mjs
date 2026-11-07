import test from "node:test";
import assert from "node:assert/strict";
import { evaluateFunction, functionSources } from "../dist/criteria-function.mjs";

const input = (overrides = {}) => ({
  age: 72, sex: "male", height: 175, fluidWeight: "reliable", context: "ward",
  swallow: "safe", route: "oral", visitDate: "2026-10-24", ...overrides,
});
const measures = (overrides = {}) => ({
  gripStrength: 30, chairRiseSeconds: 12, appendicularMass: 26,
  gaitSpeed: 1, sppb: 10, strengthValid: true, muscleValid: true,
  performanceValid: true, sarcopeniaConfounded: false,
  functionSource: "DXA and standardized functional measurements",
  functionDate: "2026-10-24", functionConfirmed: true,
  eat10Total: 0, fois: 7, iddsiFood: 7, iddsiFluid: 0,
  dysphagiaAssessment: "bedside", dysphagiaSource: "Clinician's original assessment",
  dysphagiaDate: "2026-10-24", dysphagiaConfirmed: true,
  dysphagiaUnsafeSigns: false, impairedAlertness: false, ...overrides,
});
const card = (id, d = input(), m = measures()) => evaluateFunction(d, m).find((entry) => entry.id === id);

test("empty or invalid top-level data never become normal measurements or clearance", () => {
  for (const d of [{}, null, undefined, []]) {
    const cards = evaluateFunction(d, {});
    assert.equal(cards.length, 5);
    assert.ok(cards.every((entry) => entry.status === "incomplete"));
    assert.equal(cards[0].values.gripStrength, null);
    assert.equal(cards[1].values.score, null);
    assert.equal(cards[4].values.safetyKnown, false);
    assert.equal(cards[4].values.waterChallengeOffered, false);
  }
});

test("grip and five-chair-rise thresholds retain their strict boundaries", () => {
  for (const [sex, gripStrength, expected] of [
    ["male", 27, false], ["male", 26.99, true],
    ["female", 16, false], ["female", 15.99, true],
  ]) {
    const r = card("ewgsop2", input({ sex }), measures({ gripStrength, chairRiseSeconds: null }));
    assert.equal(r.values.lowStrength, expected);
  }
  for (const [chairRiseSeconds, expected] of [[15, false], [15.01, true]]) {
    assert.equal(card("ewgsop2", input({ sex: "other" }), measures({ gripStrength: null, chairRiseSeconds })).values.lowStrength, expected);
  }
  assert.equal(card("ewgsop2", input({ sex: "other" }), measures({ chairRiseSeconds: null })).values.lowStrength, null);
});

test("corrected female and male ASM thresholds use appendicular mass rather than FFMI", () => {
  for (const [sex, height, appendicularMass, absolute, indexed] of [
    ["male", 160, 20, false, false], ["male", 160, 19.99, true, false],
    ["female", 150, 15, false, false], ["female", 150, 14.99, true, false],
    ["male", 200, 28, false, false], ["male", 200, 27.99, false, true],
    ["female", 180, 5.5 * 1.8 ** 2, false, false],
    ["female", 180, 5.49 * 1.8 ** 2, false, true],
  ]) {
    const r = card("ewgsop2", input({ sex, height }), measures({ appendicularMass }));
    assert.equal(r.values.lowMassByAbsolute, absolute);
    assert.equal(r.values.lowMassByIndexed, indexed);
  }
  const r = card("ewgsop2", input(), measures({ appendicularMass: null, ffmi: 12, totalLeanMass: 30 }));
  assert.equal(r.values.lowMass, null);
  assert.equal(r.values.asmHeight2, null);
  assert.ok(functionSources.some((entry) => entry.doi === "10.1093/ageing/afz046"));
});

test("performance boundaries modify candidate severity only after low strength and mass", () => {
  for (const [gaitSpeed, sppb, expected] of [[0.8, null, true], [0.80001, null, false], [null, 8, true], [null, 9, false], [null, 0, true]]) {
    const r = card("ewgsop2", input(), measures({ gripStrength: 20, appendicularMass: 18, gaitSpeed, sppb }));
    assert.equal(r.status, "met");
    assert.equal(r.values.lowPerformance, expected);
    assert.equal(r.values.severeCandidatePattern, expected);
  }
  const normalStrength = card("ewgsop2", input(), measures({ gaitSpeed: 0.5, sppb: 5 }));
  assert.equal(normalStrength.status, "not_met");
  assert.equal(normalStrength.values.severeCandidatePattern, false);
});

test("ICU, neurological confounding and invalid measurement context cannot yield a classified candidate", () => {
  const low = measures({ gripStrength: 20, appendicularMass: 18, gaitSpeed: 0.5 });
  for (const [d, m] of [
    [input({ context: "icu" }), low],
    [input(), { ...low, sarcopeniaConfounded: true }],
  ]) {
    const r = card("ewgsop2", d, m);
    assert.equal(r.status, "review");
    assert.equal(r.values.candidatePattern, false);
    assert.equal(r.values.severeCandidatePattern, false);
  }
  for (const override of [{ strengthValid: false }, { strengthValid: undefined }, { functionConfirmed: false }, { sarcopeniaConfounded: undefined }]) {
    assert.equal(card("ewgsop2", input(), { ...low, ...override }).status, "incomplete");
  }
  assert.equal(card("ewgsop2", input({ fluidWeight: "unreliable" }), low).values.lowMass, null);
  assert.equal(card("ewgsop2", input({ age: 17 }), low).status, "incomplete");
});

test("missing performance is unknown, and isolated low strength is a review finding", () => {
  const r = card("ewgsop2", input(), measures({ gripStrength: 20, appendicularMass: 18, gaitSpeed: null, sppb: null }));
  assert.equal(r.status, "met");
  assert.equal(r.values.lowPerformance, null);
  assert.equal(r.values.severeCandidatePattern, false);
  const strengthOnly = card("ewgsop2", input(), measures({ gripStrength: 20, appendicularMass: null }));
  assert.equal(strengthOnly.status, "review");
  assert.equal(strengthOnly.values.candidatePattern, false);
});

test("numeric strings, impossible values and unit errors do not create a candidate", () => {
  for (const override of [
    { gripStrength: "20" }, { gripStrength: NaN }, { gripStrength: -1 },
    { chairRiseSeconds: 0 }, { appendicularMass: 0 }, { gaitSpeed: 0 },
    { gaitSpeed: 50 }, { sppb: 8.5 }, { sppb: 13 },
  ]) {
    const r = card("ewgsop2", input(), measures(override));
    assert.equal(r.status, "incomplete");
    assert.ok(r.values.errors.length);
    assert.equal(r.values.candidatePattern, false);
  }
});

test("EAT-10 positive symptoms never become an aspiration diagnosis or unsafe flag alone", () => {
  for (const [eat10Total, positive] of [[0, false], [2, false], [3, true], [40, true]]) {
    const m = measures({ eat10Total });
    const eat = card("eat10", input(), m);
    const safety = card("swallow-safety", input(), m);
    assert.equal(eat.values.screenPositive, positive);
    assert.equal(eat.status, positive ? "met" : "not_met");
    assert.equal(safety.values.hasUnsafeSwallow, false);
    assert.deepEqual(safety.values.safetyReasons, []);
    assert.equal(safety.values.waterChallengeOffered, false);
  }
});

test("unanswered EAT-10 items stay missing and conflicting score sources require reconciliation", () => {
  const absent = measures({ eat10Total: null, eat10Items: Array(10).fill(null) });
  assert.equal(card("eat10", input(), absent).values.score, null);
  assert.equal(card("eat10", input(), absent).status, "incomplete");
  const partial = measures({ eat10Total: null, eat10Items: [3, ...Array(9).fill(null)] });
  assert.equal(card("eat10", input(), partial).values.score, null);
  const complete = measures({ eat10Total: null, eat10Items: [1, 2, ...Array(8).fill(0)] });
  assert.equal(card("eat10", input(), complete).values.score, 3);
  const conflict = measures({ eat10Total: 2, eat10Items: [1, 2, ...Array(8).fill(0)] });
  assert.equal(card("eat10", input(), conflict).status, "review");
  assert.equal(card("eat10", input(), conflict).values.score, null);
  for (const eat10Total of [-1, 41, 2.5, "3", Infinity]) {
    assert.equal(card("eat10", input(), measures({ eat10Total })).status, "incomplete");
  }
});

test("source, real assessment date and confirmation cannot be replaced by a low score", () => {
  for (const override of [
    { dysphagiaSource: "" }, { dysphagiaConfirmed: false },
    { dysphagiaDate: "2026-02-30" }, { dysphagiaDate: "2026-10-25" },
    { dysphagiaDate: "24.10.2026" },
  ]) {
    const m = measures({ eat10Total: 0, ...override });
    assert.equal(card("eat10", input(), m).status, "incomplete");
    assert.equal(card("swallow-safety", input(), m).values.safetyKnown, false);
  }
  assert.equal(card("ewgsop2", input(), measures({ functionDate: "2026-10-25" })).status, "incomplete");
});

test("FOIS is a functional record and never automatically changes the feeding route", () => {
  for (let fois = 1; fois <= 7; fois++) {
    const d = input();
    const r = card("fois", d, measures({ fois }));
    assert.equal(r.status, "review");
    assert.equal(r.values.level, fois);
    assert.equal(d.route, "oral");
    assert.equal("route" in r.values, false);
  }
  assert.equal(card("swallow-safety", input(), measures({ fois: 1 })).values.oralRecordConflict, true);
  assert.equal(card("swallow-safety", input(), measures({ fois: 1 })).status, "review");
  for (const fois of [0, 8, 2.5, "7", null])
    assert.equal(card("fois", input(), measures({ fois })).status, "incomplete");
});

test("IDDSI food/fluid domains are separate records and zero fluid is a real level", () => {
  const r = card("iddsi");
  assert.equal(r.status, "review");
  assert.equal(r.values.food, 7);
  assert.equal(r.values.fluid, 0);
  assert.equal(r.values.frameworkVersion, "2.2");
  assert.equal(card("iddsi", input(), measures({ iddsiFood: null })).values.food, null);
  for (const override of [{ iddsiFood: 0 }, { iddsiFood: 2 }, { iddsiFluid: 5 }, { iddsiFluid: "0" }, { iddsiFood: 8 }])
    assert.equal(card("iddsi", input(), measures(override)).status, "incomplete");
  assert.equal("recommendedTexture" in r.values, false);
  assert.equal("thickener" in r.values, false);
});

test("impaired alertness or unsafe swallowing always flags review, even with EAT-10 zero", () => {
  for (const [d, override, reason] of [
    [input(), { impairedAlertness: true }, "impaired_alertness"],
    [input({ swallow: "unsafe" }), {}, "unsafe_swallow"],
    [input(), { dysphagiaUnsafeSigns: true }, "unsafe_signs"],
  ]) {
    const m = measures({ eat10Total: 0, dysphagiaConfirmed: false, ...override });
    const r = card("swallow-safety", d, m);
    assert.equal(r.status, "review");
    assert.equal(r.values.hasUnsafeSwallow, true);
    assert.ok(r.values.safetyReasons.includes(reason));
    assert.equal(r.values.waterChallengeOffered, false);
    assert.equal(r.values.assessmentReady, false);
  }
  assert.equal(card("eat10", input(), measures({ impairedAlertness: true })).status, "review");
});

test("assessment methods never constitute app-issued oral clearance", () => {
  for (const dysphagiaAssessment of ["bedside", "FEES", "VFSS"]) {
    const r = card("swallow-safety", input(), measures({ dysphagiaAssessment }));
    assert.equal(r.values.assessmentReady, true);
    assert.equal(r.values.hasUnsafeSwallow, false);
    assert.match(r.summary.en, /not clearance/);
    assert.equal(r.values.waterChallengeOffered, false);
  }
  const unknown = card("swallow-safety", input(), measures({ dysphagiaAssessment: "none" }));
  assert.equal(unknown.status, "incomplete");
  assert.equal(unknown.values.assessmentReady, false);
});

test("outputs are bilingual, source-linked, finite and leave all inputs unchanged", () => {
  const d = input();
  const m = measures({ eat10Items: Array(10).fill(0) });
  const before = structuredClone({ d, m });
  Object.freeze(d);
  Object.freeze(m.eat10Items);
  Object.freeze(m);
  const cards = evaluateFunction(d, m);
  assert.deepEqual({ d, m }, before);
  const sourceIds = new Set(functionSources.map((source) => source.id));
  for (const r of cards) {
    assert.ok(["met", "not_met", "incomplete", "review"].includes(r.status));
    assert.ok(r.title.en && r.title.tr && r.summary.en && r.summary.tr);
    assert.ok(r.details.every((detail) => detail.en && detail.tr));
    assert.ok(r.sourceIds.every((id) => sourceIds.has(id)));
  }
  assert.doesNotMatch(JSON.stringify(cards), /NaN|Infinity/);
});
