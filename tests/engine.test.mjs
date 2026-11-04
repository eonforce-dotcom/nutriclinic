import test from "node:test";
import assert from "node:assert/strict";
import { VERSION, evaluate } from "../dist/engine.mjs";

const complete = (overrides) => ({
  age: 50,
  height: 175,
  weight: 70,
  usualWeight: 70,
  lossMonths: 6,
  albumin: null,
  neutrophils: null,
  lymphocytes: null,
  crp: null,
  labDate: "2026-10-23",
  visitDate: "2026-10-23",
  collectionStart: null,
  collectionEnd: null,
  urineVolume: null,
  phosphate: null,
  potassium: null,
  magnesium: null,
  uun: null,
  uunDate: null,
  actualProtein: null,
  usualIntake: 50,
  reducedDays: 0,
  negligibleDays: 0,
  measuredEE: null,
  kcalTarget: 1800,
  proteinTarget: 90,
  otherKcal: 300,
  otherProtein: 20,
  formulaEnergy: 1.5,
  formulaProtein: 6,
  formulaWater: 77,
  formulaName: "Doğrulanmış örnek ürün",
  formulaSource: "2026-10 ürün etiketi, lot TEST",
  formulaVolumeLimit: 1500,
  hours: 20,
  servingVolume: 200,
  context: "ward",
  phase: "",
  renal: "none",
  hemodynamics: "stable",
  swallow: "safe",
  route: "oral",
  gi: "functional",
  electrolytes: "normal",
  refeedingHistory: "no",
  fluidWeight: "reliable",
  muscle: "normal",
  inflammation: "no",
  intakeCriterion: "no",
  pregnant: "no",
  labsConfirmed: false,
  collectionComplete: false,
  collectionMatched: false,
  extraLosses: false,
  screenPositive: false,
  formulaVerified: true,
  clinicianConfirmed: true,
  ...overrides,
});

test("an invalid displayed field never silently becomes missing and permits a plan", () => {
  for (const inputErrors of [["potassium"], ["creatinine"], "invalid"]) {
    const result = evaluate(complete({ inputErrors }));
    assert.equal(result.plan, null);
    assert.match(result.blockers.join(" "), /Geçersiz biçim/);
  }
  assert.ok(evaluate(complete({ inputErrors: [] })).plan);
});

test("version and empty input never fabricate numbers or a plan", () => {
  assert.equal(VERSION, "0.1.1");
  for (const input of [{}, null, undefined]) {
    const r = evaluate(input);
    assert.equal(r.bmi, null);
    assert.equal(r.weightLoss, null);
    assert.deepEqual(r.indices, { nlr: null, pni: null, nitrogen: null });
    assert.equal(r.refeeding.level, "unknown");
    assert.equal(r.plan, null);
    assert.ok(r.blockers.length);
  }
});

test("volume follows clinician energy gap and includes other-source protein separately", () => {
  const r = evaluate(complete());
  assert.deepEqual(r.blockers, []);
  assert.deepEqual(r.plan, {
    volume: 1000,
    rate: 0,
    energy: 1800,
    protein: 80,
    water: 770,
    energyGap: 0,
    proteinGap: 10,
  });
  assert.equal(r.bmi, 22.86);
  assert.equal(r.weightLoss, 0);
  assert.ok(r.trace.some((t) => t.includes("otomatik artırılmadı")));
});

test("volume cap leaves an explicit energy deficit and does not inflate protein", () => {
  const r = evaluate(complete({ formulaVolumeLimit: 600 }));
  assert.deepEqual(r.plan, {
    volume: 600,
    rate: 0,
    energy: 1200,
    protein: 56,
    water: 462,
    energyGap: 600,
    proteinGap: 34,
  });
});

test("fractional volume caps and derived amounts are never exceeded by rounding", () => {
  const capped = evaluate(complete({ formulaVolumeLimit: 123.45 }));
  assert.equal(capped.plan.volume, 123.4);
  assert.ok(capped.plan.volume <= 123.45);
  assert.equal(capped.plan.energy, 485.1);
  const derived = evaluate(complete({ formulaEnergy: 1.3, otherKcal: 301 }));
  assert.ok(derived.plan.volume <= (1800 - 301) / 1.3);
  assert.ok(derived.plan.energy <= 1800);
});

test("other sources meeting/exceeding energy give zero extra formula", () => {
  const r = evaluate(complete({ otherKcal: 2000 }));
  assert.equal(r.plan.volume, 0);
  assert.equal(r.plan.energy, 2000);
  assert.equal(r.plan.protein, 20);
  assert.equal(r.plan.proteinGap, 70);
  assert.ok(r.trace.some((t) => t.includes("enerji hedefini")));
});

test("confirmation checkbox cannot bypass any hard safety gate", () => {
  for (const overrides of [
    { age: 17 },
    { renal: "aki" },
    { renal: "ckd" },
    { renal: "rrt" },
    { weight: 100, usualWeight: 100 },
    { pregnant: "yes" },
    { hemodynamics: "unstable" },
    { gi: "contraindicated" },
    { swallow: "unsafe" },
    { fluidWeight: "unreliable" },
    { electrolytes: "low" },
    { negligibleDays: 11 },
    { formulaVerified: false },
    { clinicianConfirmed: false },
    { context: "icu", phase: "" },
  ]) {
    const r = evaluate(complete(overrides));
    assert.equal(r.plan, null, JSON.stringify(overrides));
    assert.ok(r.blockers.length, JSON.stringify(overrides));
  }
});

test("unknown safety and source calories never silently become zero", () => {
  for (const overrides of [
    { renal: "" },
    { pregnant: "" },
    { hemodynamics: "" },
    { gi: "" },
    { swallow: "" },
    { route: "" },
    { fluidWeight: "" },
    { electrolytes: "" },
    { refeedingHistory: "" },
    { usualWeight: null },
    { lossMonths: null },
    { negligibleDays: null },
    { otherKcal: null },
    { otherProtein: null },
    { usualIntake: null },
    { route: "tube", hours: null },
    { formulaWater: null },
    { formulaVolumeLimit: null },
  ])
    assert.equal(
      evaluate(complete(overrides)).plan,
      null,
      JSON.stringify(overrides),
    );
});

test("numeric strings, infinity, NaN, impossible units and zero energy are rejected", () => {
  for (const overrides of [
    { weight: "70" },
    { age: NaN },
    { kcalTarget: Infinity },
    { formulaEnergy: 0 },
    { formulaEnergy: 150 },
    { formulaWater: 101 },
    { hours: 0 },
    { hours: 25 },
    { uun: -1 },
    { otherKcal: -1 },
  ])
    assert.equal(evaluate(complete(overrides)).plan, null, String(overrides));
});

test("laboratory indices require confirmed labs and correct unit formula", () => {
  const data = complete({ albumin: 35, neutrophils: 6, lymphocytes: 2 });
  assert.equal(evaluate(data).indices.pni, null);
  assert.equal(evaluate(data).indices.nlr, null);
  assert.equal(evaluate(data).plan, null);
  const r = evaluate({ ...data, labsConfirmed: true });
  assert.equal(r.indices.nlr.value, 3);
  assert.equal(r.indices.pni.value, 45);
  assert.match(r.metabolic.title, /belirlenemedi/);
  const zero = evaluate({ ...data, labsConfirmed: true, lymphocytes: 0 });
  assert.equal(zero.indices.nlr, null);
  assert.equal(zero.indices.pni.value, 35);
});

test("nitrogen balance uses real matched intake and an entire valid collection", () => {
  const data = complete({
    labsConfirmed: true,
    uun: 12,
    uunDate: "2026-10-23",
    actualProtein: 75,
    collectionStart: "2026-10-22T08:00:00+03:00",
    collectionEnd: "2026-10-23T08:00:00+03:00",
    urineVolume: 1500,
    collectionComplete: true,
    collectionMatched: true,
    extraLosses: false,
  });
  const r = evaluate(data);
  assert.equal(r.indices.nitrogen.value, -4);
  assert.match(r.metabolic.title, /Negatif/);
  for (const overrides of [
    { collectionComplete: false },
    { collectionMatched: false },
    { extraLosses: true },
    { extraLosses: undefined },
    { renal: "aki" },
    { renal: "rrt" },
    { renal: "" },
    { actualProtein: null },
    { uun: null },
    { labsConfirmed: false },
  ])
    assert.equal(
      evaluate({ ...data, ...overrides }).indices.nitrogen,
      null,
      JSON.stringify(overrides),
    );
  const positive = evaluate({ ...data, actualProtein: 125 });
  assert.equal(positive.indices.nitrogen.value, 4);
  assert.match(positive.metabolic.detail, /kanıtlamaz/);
});

test("refeeding detects a major criterion and two independent minor criteria", () => {
  assert.equal(
    evaluate(complete({ height: 175, weight: 48, usualWeight: 48 })).refeeding
      .level,
    "high",
  );
  const two = evaluate(
    complete({ weight: 55, usualWeight: 55, negligibleDays: 6 }),
  );
  assert.equal(two.refeeding.level, "high");
  assert.equal(
    evaluate(complete({ usualWeight: 85, lossMonths: 6 })).refeeding.level,
    "high",
  );
  assert.equal(evaluate(complete({ reducedDays: 11 })).refeeding.level, "low");
  assert.equal(
    evaluate(complete({ negligibleDays: 11 })).refeeding.level,
    "high",
  );
  assert.equal(
    evaluate(complete({ weight: 55, usualWeight: 55 })).refeeding.level,
    "low",
  );
  assert.equal(
    evaluate(complete({ weight: 55, usualWeight: 55, refeedingHistory: "yes" }))
      .refeeding.level,
    "high",
  );
});

test("rapid loss is not reassuring and missing risk data remains unknown", () => {
  assert.equal(
    evaluate(complete({ usualWeight: 85, lossMonths: 1 })).refeeding.level,
    "unknown",
  );
  assert.equal(
    evaluate(complete({ usualWeight: null })).refeeding.level,
    "unknown",
  );
  const r = evaluate(complete({ negligibleDays: 15, usualWeight: null }));
  assert.equal(r.refeeding.level, "high");
  assert.equal(r.plan, null);
});

test("electrolyte safety warnings block even if clinician marks electrolytes normal", () => {
  for (const overrides of [
    { phosphate: 0.64 },
    { potassium: 2.49 },
    { magnesium: 0.49 },
    { phosphate: 0 },
  ]) {
    const r = evaluate(
      complete({ ...overrides, electrolytes: "normal", labsConfirmed: true }),
    );
    assert.equal(r.refeeding.level, "high");
    assert.equal(r.plan, null);
    assert.ok(r.blockers.some((t) => t.includes("Elektrolit güvenlik")));
  }
});

test("numeric electrolyte values override a contradictory normal checkbox safely", () => {
  for (const overrides of [
    { potassium: 3.4 },
    { phosphate: 0.7 },
    { magnesium: 0.65 },
  ]) {
    const r = evaluate(
      complete({ ...overrides, labsConfirmed: true, electrolytes: "normal" }),
    );
    assert.equal(r.refeeding.level, "unknown");
    assert.equal(r.plan, null);
    assert.ok(r.blockers.some((t) => t.includes("lokal referans")));
    assert.ok(r.trace.some((t) => t.includes("evrensel laboratuvar normu")));
  }
  for (const overrides of [
    { potassium: 5.6 },
    { phosphate: 1.6 },
    { magnesium: 1.11 },
  ]) {
    const r = evaluate(complete({ ...overrides, labsConfirmed: true }));
    assert.equal(r.plan, null);
    assert.notEqual(r.refeeding.level, "low");
    assert.ok(r.blockers.some((t) => t.includes("ön kontrol aralığı")));
  }
  for (const overrides of [
    { potassium: 3.5 },
    { potassium: 5.5 },
    { phosphate: 0.8 },
    { phosphate: 1.5 },
    { magnesium: 0.7 },
    { magnesium: 1.1 },
  ]) {
    assert.notEqual(
      evaluate(complete({ ...overrides, labsConfirmed: true })).plan,
      null,
    );
  }
});

test("laboratory dates must be real ISO dates and confirmations cannot bypass them", () => {
  for (const labDate of [
    null,
    "",
    "23.10.2026",
    "2026-02-30",
    "2025-02-29",
    "2026-13-01",
    "2026-10-23T10:00",
  ]) {
    const r = evaluate(
      complete({
        albumin: 35,
        neutrophils: 6,
        lymphocytes: 2,
        labsConfirmed: true,
        labDate,
      }),
    );
    assert.equal(r.indices.nlr, null);
    assert.equal(r.indices.pni, null);
    assert.equal(r.plan, null);
  }
  assert.equal(
    evaluate(
      complete({
        albumin: 35,
        lymphocytes: 2,
        labsConfirmed: true,
        labDate: "2024-02-29",
      }),
    ).indices.pni.value,
    45,
  );
});

test("a future laboratory date cannot enter the evaluation despite confirmations", () => {
  const data = complete({ albumin: 35, lymphocytes: 2, labsConfirmed: true });
  const future = evaluate({
    ...data,
    labDate: "2026-10-24",
    visitDate: "2026-10-23",
  });
  assert.equal(future.indices.pni, null);
  assert.equal(future.plan, null);
  assert.ok(
    future.blockers.some((t) => t.includes("değerlendirme tarihinden sonra")),
  );
  assert.equal(
    evaluate({ ...data, labDate: "2026-10-23", visitDate: "2026-10-23" })
      .indices.pni.value,
    45,
  );
  assert.equal(
    evaluate({ ...data, labDate: "2026-10-22", visitDate: "2026-10-23" })
      .indices.pni.value,
    45,
  );
  assert.equal(evaluate({ ...data, visitDate: "2026-02-30" }).plan, null);
});

test("nitrogen collection requires actual duration, volume and matching time bases", () => {
  const data = complete({
    labsConfirmed: true,
    uun: 12,
    uunDate: "2026-10-23",
    actualProtein: 75,
    collectionComplete: true,
    collectionMatched: true,
    extraLosses: false,
    urineVolume: 1500,
    collectionStart: "2026-10-22T08:00",
    collectionEnd: "2026-10-23T08:00",
  });
  assert.equal(evaluate(data).indices.nitrogen.value, -4);
  const invalidCollections = [
    { collectionStart: null },
    { collectionEnd: null },
    { urineVolume: null },
    { urineVolume: 0 },
    { collectionEnd: "2026-10-23T07:53" },
    { collectionEnd: "2026-10-23T08:07" },
    { collectionEnd: "2026-10-21T08:00" },
    { collectionStart: "2026-02-30T08:00" },
    { collectionEnd: "2026-10-23T24:00" },
    { collectionEnd: "2026-10-23T08:00+03:00" },
    {
      collectionStart: "2026-10-22T08:00+15:00",
      collectionEnd: "2026-10-23T08:00+15:00",
    },
  ];
  for (const overrides of invalidCollections) {
    const r = evaluate({ ...data, ...overrides });
    assert.equal(r.indices.nitrogen, null, JSON.stringify(overrides));
    assert.equal(r.plan, null, JSON.stringify(overrides));
  }
  for (const collectionEnd of ["2026-10-23T07:54", "2026-10-23T08:06"]) {
    assert.equal(
      evaluate({ ...data, collectionEnd }).indices.nitrogen.value,
      -4,
    );
  }
  const zoned = evaluate({
    ...data,
    collectionStart: "2026-10-22T08:00+03:00",
    collectionEnd: "2026-10-23T05:00Z",
  });
  assert.equal(zoned.indices.nitrogen.value, -4);
});

const confirmedLaboratoryInput = (overrides = {}) => complete({
  labsConfirmed: true,
  albumin: 35,
  neutrophils: 6,
  lymphocytes: 2,
  uun: 12,
  uunDate: "2026-10-23",
  actualProtein: 75,
  collectionStart: "2026-10-22T08:00+03:00",
  collectionEnd: "2026-10-23T08:00+03:00",
  urineVolume: 1500,
  collectionComplete: true,
  collectionMatched: true,
  ...overrides,
});

test("all laboratory indices require a real assessment date even with confirmations", () => {
  for (const visitDate of [undefined, null, "", "2026-02-30", "2026-13-01", "2026-10-23T12:00", 20261023]) {
    const r = evaluate(confirmedLaboratoryInput({ visitDate }));
    assert.deepEqual(r.indices, { nlr: null, pni: null, nitrogen: null }, String(visitDate));
    assert.match(r.metabolic.title, /belirlenemedi/);
    assert.equal(r.plan, null);
    assert.ok(r.blockers.includes("Geçerli YYYY-MM-DD değerlendirme tarihi gerekli."));
    // A missing assessment date is also required for a draft with no laboratory data.
    assert.equal(evaluate(complete({ visitDate })).plan, null);
  }
  const valid = evaluate(confirmedLaboratoryInput());
  assert.equal(valid.indices.nlr.value, 3);
  assert.equal(valid.indices.pni.value, 45);
  assert.equal(valid.indices.nitrogen.value, -4);
  assert.ok(valid.plan);
});

test("UUN date is independently required for nitrogen balance but not unrelated draft arithmetic", () => {
  for (const uunDate of [undefined, null, ""]) {
    const r = evaluate(confirmedLaboratoryInput({ uunDate }));
    assert.equal(r.indices.nitrogen, null);
    assert.equal(r.indices.nlr.value, 3);
    assert.equal(r.indices.pni.value, 45);
    assert.match(r.metabolic.title, /belirlenemedi/);
    assert.ok(r.plan, "Missing optional NB evidence does not require NB to generate a draft");
    assert.match(r.trace.join(" "), /kan örneği tarihinden ayrı/);
  }
  for (const uunDate of ["2026-02-30", "23.10.2026", "2026-10-23T08:00", 20261023]) {
    const r = evaluate(confirmedLaboratoryInput({ uunDate }));
    assert.equal(r.indices.nitrogen, null);
    assert.equal(r.plan, null);
    assert.match(r.blockers.join(" "), /uunDate/);
  }
  const separateBloodDate = evaluate(confirmedLaboratoryInput({ labDate: "2026-10-22" }));
  assert.equal(separateBloodDate.indices.nitrogen.value, -4);
});

test("future or mismatched urine dates are integrity blockers despite collection confirmations", () => {
  const mismatch = evaluate(confirmedLaboratoryInput({ uunDate: "2026-10-22" }));
  assert.equal(mismatch.indices.nitrogen, null);
  assert.equal(mismatch.plan, null);
  assert.match(mismatch.blockers.join(" "), /yazılı ISO günüyle eşleşmiyor/);
  const futureUun = evaluate(confirmedLaboratoryInput({ uunDate: "2026-10-24" }));
  assert.equal(futureUun.indices.nitrogen, null);
  assert.equal(futureUun.plan, null);
  assert.ok(futureUun.blockers.some((t) => t.startsWith("UUN örnek/toplama bitiş tarihi değerlendirme tarihinden sonra")));
  for (const overrides of [
    { uunDate: "2030-01-02", collectionStart: "2030-01-01T08:00", collectionEnd: "2030-01-02T08:00" },
    { uunDate: null, collectionStart: "2026-10-23T08:00", collectionEnd: "2026-10-24T08:00" },
  ]) {
    const r = evaluate(confirmedLaboratoryInput(overrides));
    assert.equal(r.indices.nitrogen, null);
    assert.equal(r.plan, null);
    assert.ok(r.blockers.some((t) => t.startsWith("İdrar toplama bitiş tarihi değerlendirme tarihinden sonra")));
    // Valid blood results remain interpretable; the erroneous urine record is separate.
    assert.equal(r.indices.nlr.value, 3);
    assert.equal(r.indices.pni.value, 45);
    assert.match(r.metabolic.title, /belirlenemedi/);
  }
});

test("urine date checks use written ISO days while zoned duration uses instants", () => {
  // This end instant is on 24 October UTC, but its explicitly written day is 23 October.
  const pastWrittenDay = confirmedLaboratoryInput({
    collectionStart: "2026-10-22T23:30-03:00",
    collectionEnd: "2026-10-23T23:30-03:00",
  });
  assert.equal(evaluate(pastWrittenDay).indices.nitrogen.value, -4);
  assert.ok(evaluate(pastWrittenDay).plan);
  // This instant is on 23 October UTC; the written 24 October day is still future.
  const futureWrittenDay = evaluate(confirmedLaboratoryInput({
    uunDate: "2026-10-24",
    collectionStart: "2026-10-23T00:30+14:00",
    collectionEnd: "2026-10-24T00:30+14:00",
  }));
  assert.equal(futureWrittenDay.indices.nitrogen, null);
  assert.equal(futureWrittenDay.plan, null);
  const writtenMismatch = evaluate({ ...pastWrittenDay, uunDate: "2026-10-24", visitDate: "2026-10-24" });
  assert.equal(writtenMismatch.indices.nitrogen, null);
  assert.match(writtenMismatch.blockers.join(" "), /yazılı ISO günüyle eşleşmiyor/);
});

test("input validation errors suppress only dependent laboratory indices", () => {
  const all = ["nlr", "pni", "nitrogen"];
  const cases = [
    ["albumin", ["pni"]],
    ["neutrophils", ["nlr"]],
    ["lymphocytes", ["nlr", "pni"]],
    ...["uun", "actualProtein", "uunDate", "collectionStart", "collectionEnd", "urineVolume"].map((key) => [key, ["nitrogen"]]),
    ...["age", "labDate", "visitDate"].map((key) => [key, all]),
    ["creatinine", []],
  ];
  for (const [field, suppressed] of cases) {
    const r = evaluate(confirmedLaboratoryInput({ inputErrors: [field] }));
    for (const index of all)
      assert.equal(r.indices[index] === null, suppressed.includes(index), `${field}: ${index}`);
    assert.equal(r.plan, null);
    if (suppressed.includes("nitrogen")) assert.match(r.metabolic.title, /belirlenemedi/);
  }
  const union = evaluate(confirmedLaboratoryInput({ inputErrors: ["albumin", "uun"] }));
  assert.equal(union.indices.nlr.value, 3);
  assert.equal(union.indices.pni, null);
  assert.equal(union.indices.nitrogen, null);
  const accepted = evaluate(confirmedLaboratoryInput({ inputErrors: [] }));
  assert.equal(accepted.indices.nitrogen.value, -4);
  assert.ok(accepted.plan);
});

test("malformed validation metadata cannot leave laboratory interpretations active", () => {
  for (const inputErrors of [null, "albumin", {}, [null], [0], [""], ["albumin", null], new Array(1)]) {
    const input = confirmedLaboratoryInput({ inputErrors });
    const before = structuredClone(input);
    const r = evaluate(input);
    assert.deepEqual(r.indices, { nlr: null, pni: null, nitrogen: null });
    assert.match(r.metabolic.title, /belirlenemedi/);
    assert.equal(r.plan, null);
    assert.deepEqual(input, before);
  }
});

test("invalid numerical laboratory inputs suppress their dependent indices", () => {
  for (const [field, value, suppressed] of [
    ["albumin", -1, ["pni"]],
    ["lymphocytes", NaN, ["nlr", "pni"]],
    ["neutrophils", 201, ["nlr"]],
    ["uun", -1, ["nitrogen"]],
    ["actualProtein", "75", ["nitrogen"]],
    ["urineVolume", -1500, ["nitrogen"]],
  ]) {
    const r = evaluate(confirmedLaboratoryInput({ [field]: value }));
    for (const index of ["nlr", "pni", "nitrogen"])
      assert.equal(r.indices[index] === null, suppressed.includes(index), `${field}: ${index}`);
    assert.equal(r.plan, null);
  }
});

test("formula provenance is required even with broad confirmations", () => {
  for (const overrides of [
    { formulaName: "" },
    { formulaName: "   " },
    { formulaName: null },
    { formulaSource: "" },
    { formulaSource: "   " },
    { formulaSource: null },
    { formulaSource: 42 },
  ]) {
    assert.equal(evaluate(complete(overrides)).plan, null);
  }
});

test("usual intake above 100 percent remains a valid raw numeric input up to 200", () => {
  assert.notEqual(evaluate(complete({ usualIntake: 150 })).plan, null);
  assert.notEqual(evaluate(complete({ usualIntake: 200 })).plan, null);
  assert.equal(evaluate(complete({ usualIntake: 201 })).plan, null);
});

test("normal BMI does not rule out GLIM and edema does not authorize a dose", () => {
  const r = evaluate(
    complete({ muscle: "low", inflammation: "yes", screenPositive: true }),
  );
  assert.match(r.glim.title, /aday/);
  const normal = evaluate(complete());
  assert.match(normal.glim.detail, /dışlamaz/);
  const lost = evaluate(
    complete({ usualWeight: 75, inflammation: "yes", screenPositive: true }),
  );
  assert.match(lost.glim.detail, /ağırlık kaybı/);
  assert.equal(evaluate(complete({ fluidWeight: "unreliable" })).plan, null);
});

test("ICU phase and measured expenditure never create calorie or protein targets", () => {
  for (const phase of ["early", "late", "recovery"]) {
    const r = evaluate(
      complete({
        context: "icu",
        phase,
        measuredEE: 2000,
        kcalTarget: null,
        proteinTarget: null,
      }),
    );
    assert.equal(r.plan, null);
    assert.match(r.reference.energy, /ilk hafta/);
  }
});

test("tube route can omit swallow but oral route cannot", () => {
  assert.notEqual(
    evaluate(complete({ route: "tube", swallow: "" })).plan,
    null,
  );
  assert.equal(evaluate(complete({ route: "oral", swallow: "" })).plan, null);
});

test("oral portions and tube pump duration have separate requirements", () => {
  const oral = evaluate(
    complete({ route: "oral", hours: null, servingVolume: 200 }),
  );
  assert.notEqual(oral.plan, null);
  assert.equal(oral.plan.rate, 0);
  for (const servingVolume of [null, 0, -10, "", "200"]) {
    assert.equal(
      evaluate(complete({ route: "oral", servingVolume })).plan,
      null,
    );
  }
  const tube = evaluate(
    complete({ route: "tube", servingVolume: null, hours: 20 }),
  );
  assert.notEqual(tube.plan, null);
  assert.equal(tube.plan.rate, 50);
  assert.equal(evaluate(complete({ route: "tube", hours: null })).plan, null);
});

test("inputs are not mutated and outputs contain no NaN or Infinity", () => {
  const input = Object.freeze(complete());
  const r = evaluate(input);
  assert.doesNotMatch(JSON.stringify(r), /NaN|Infinity/);
  assert.equal(input.weight, 70);
});
