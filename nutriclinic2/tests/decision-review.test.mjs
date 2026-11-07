import test from "node:test";
import assert from "node:assert/strict";
import { choiceAvailable, makeReview, isReviewCurrent } from "../dist/decision-review.mjs";

const catalogue = [
  {
    id: "refeeding",
    sourceIds: ["nice-cg32", "auspen-refeeding-2025"],
    choices: [
      { id: "institutional-review" },
      { id: "ward-population", contexts: ["ward"] },
      { id: "icu-early", contexts: ["icu"], phases: ["early"] },
    ],
  },
  { id: "glutamine", sourceIds: ["redoxs-glutamine-2013"], choices: [{ id: "no-routine-extra" }] },
];
const input = () => ({
  context: "ward",
  phase: "",
  phosphate: 0.7,
  visitDate: "2026-10-24",
  formula: { name: "Özel ürün", energy: 1.5 },
  observations: [{ date: "2026-10-23", value: 0.8 }, { date: "2026-10-24", value: 0.7 }],
});
const args = (overrides = {}) => ({
  topicId: "refeeding",
  choiceId: "institutional-review",
  rationale: "  Evaluate population fit and the institution-approved protocol.  ",
  confirmed: true,
  input: input(),
  timestamp: "2026-10-24T10:00:00Z",
  ...overrides,
});

test("review binds the chosen topic, exact sources, rationale, time and input snapshot", () => {
  const data = args();
  const before = structuredClone(data);
  const review = makeReview(data, catalogue);
  assert.equal(review.rationale, "Evaluate population fit and the institution-approved protocol.");
  assert.equal(review.reviewedAt, "2026-10-24T10:00:00.000Z");
  assert.equal(review.topicId, "refeeding");
  assert.equal(review.choiceId, "institutional-review");
  assert.deepEqual(review.sourceIds, ["nice-cg32", "auspen-refeeding-2025"]);
  assert.deepEqual(data, before);
  assert.notEqual(review.reviewedInput, data.input);
  assert.notEqual(review.reviewedInput.formula, data.input.formula);
  assert.notEqual(review.sourceIds, catalogue[0].sourceIds);
  assert.ok(isReviewCurrent(review, data.input));
});

test("changed laboratory, clinical or source-product inputs require renewed review", () => {
  for (const changed of [
    { ...input(), phosphate: 0.9 },
    { ...input(), context: "icu" },
    { ...input(), visitDate: "2026-10-25" },
    { ...input(), formula: { name: "Different product", energy: 1.5 } },
    { ...input(), addedClinicalFact: true },
  ]) {
    const review = makeReview(args(), catalogue);
    assert.equal(isReviewCurrent(review, changed), false);
  }
  const review = makeReview(args(), catalogue);
  review.confirmed = false;
  assert.equal(isReviewCurrent(review, input()), false);
});

test("snapshot equality ignores object-key order but respects arrays and missing values", () => {
  const value = input();
  const reordered = Object.fromEntries(Object.entries(value).reverse());
  reordered.formula = { energy: 1.5, name: "Özel ürün" };
  const review = makeReview(args({ input: value }), catalogue);
  assert.equal(isReviewCurrent(review, reordered), true);
  assert.equal(isReviewCurrent(review, { ...value, observations: [...value.observations].reverse() }), false);
  const missing = { ...value };
  delete missing.phase;
  assert.equal(isReviewCurrent(review, missing), false);
  assert.equal(isReviewCurrent(review, { ...value, phase: null }), false);
});

test("mutating current form data cannot rewrite the stored reviewed inputs", () => {
  const data = args();
  const review = makeReview(data, catalogue);
  data.input.formula.energy = 2;
  data.input.observations[0].value = 0.4;
  assert.equal(review.reviewedInput.formula.energy, 1.5);
  assert.equal(review.reviewedInput.observations[0].value, 0.8);
  assert.equal(isReviewCurrent(review, data.input), false);
});

test("imported confirmation cannot silently become a new session review", () => {
  const review = makeReview(args(), catalogue);
  const exported = JSON.stringify(review);
  const imported = JSON.parse(exported);
  assert.equal(imported.confirmed, true);
  assert.equal(isReviewCurrent(imported, input()), false);
  assert.equal(isReviewCurrent({ ...review }, input()), false);
  const confirmedAgain = makeReview(args({ rationale: imported.rationale }), catalogue);
  assert.equal(isReviewCurrent(confirmedAgain, input()), true);
});

test("unknown topic/choice and choices belonging to another topic are rejected", () => {
  for (const overrides of [
    { topicId: "unknown" },
    { choiceId: "unknown" },
    { choiceId: "no-routine-extra" },
    { topicId: "" },
    { choiceId: "" },
  ]) assert.throws(() => makeReview(args(overrides), catalogue), TypeError);
  assert.throws(() => makeReview(args(), [...catalogue, catalogue[0]]), /ambiguous/);
  assert.throws(() => makeReview(args(), undefined), /catalogue/);
});

test("explicit confirmation and a bounded meaningful rationale are required", () => {
  for (const confirmed of [false, undefined, "true", 1])
    assert.throws(() => makeReview(args({ confirmed }), catalogue), /confirmation/);
  for (const rationale of ["", "   ", null, 42, "a".repeat(1201)])
    assert.throws(() => makeReview(args({ rationale }), catalogue), TypeError);
  assert.equal(makeReview(args({ rationale: "a".repeat(1200) }), catalogue).rationale.length, 1200);
});

test("research population restrictions cannot be bypassed by changing confirmation", () => {
  const ward = catalogue[0].choices[1];
  const earlyIcu = catalogue[0].choices[2];
  assert.equal(choiceAvailable(ward, { context: "ward" }), true);
  assert.equal(choiceAvailable(ward, { context: "icu" }), false);
  assert.equal(choiceAvailable(ward, {}), false);
  assert.equal(choiceAvailable(earlyIcu, { context: "icu", phase: "early" }), true);
  assert.equal(choiceAvailable(earlyIcu, { context: "icu", phase: "late" }), false);
  assert.throws(() => makeReview(args({ choiceId: "ward-population", input: { context: "icu", phase: "early" } }), catalogue), /unavailable/);
  assert.throws(() => makeReview(args({ choiceId: "icu-early", input: { context: "icu", phase: "late" } }), catalogue), /unavailable/);
  assert.equal(makeReview(args({ choiceId: "icu-early", input: { context: "icu", phase: "early" } }), catalogue).choiceId, "icu-early");
  for (const invalidChoice of [null, {}, { id: "x", contexts: "ward" }, { id: "x", contexts: [] }, { id: "x", phases: [""] }])
    assert.equal(choiceAvailable(invalidChoice, input()), false);
});

test("topic sources come from the catalogue rather than caller-supplied claims", () => {
  const review = makeReview({ ...args(), sourceIds: ["fabricated-source"] }, catalogue);
  assert.deepEqual(review.sourceIds, catalogue[0].sourceIds);
  for (const sourceIds of [[], null, [""], [42]])
    assert.throws(() => makeReview(args(), [{ ...catalogue[0], sourceIds }]), /sources/);
});

test("invalid snapshots and times are rejected rather than silently losing data", () => {
  const cyclic = input();
  cyclic.self = cyclic;
  for (const value of [null, [], cyclic, { context: "ward", x: undefined }, { context: "ward", x: NaN }, { context: "ward", x: Infinity }, { context: "ward", x: new Date() }, { context: "ward", x: () => 1 }])
    assert.throws(() => makeReview(args({ input: value }), catalogue), TypeError);
  for (const timestamp of [null, 0, "24/10/2026", "invalid", "2026-13-24T10:00:00Z", "2026-02-30T10:00:00Z", "2026-10-24T24:00:00Z", "2026-10-24T10:00:00+15:00"])
    assert.throws(() => makeReview(args({ timestamp }), catalogue), /timestamp/);
  const review = makeReview(args(), catalogue);
  assert.equal(isReviewCurrent(review, { ...input(), phosphate: NaN }), false);
  assert.equal(isReviewCurrent(null, input()), false);
});
