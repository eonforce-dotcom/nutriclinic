import test from "node:test";
import assert from "node:assert/strict";
import { parseCSV, normalizeRow, dateValid } from "../dist/import.mjs";
const row = (value, unit = "10^9/L", date = "2026-10-23") => ({
  test: "neutrophils",
  value,
  unit,
  date,
});
test("missing, booleans and nonnumeric JSON never become a real zero", () => {
  for (const v of [
    "",
    "   ",
    null,
    undefined,
    false,
    true,
    [],
    {},
    "0x10",
    "NaN",
    "Infinity",
  ])
    assert.ok(normalizeRow(row(v), 0).error, String(v));
  assert.equal(normalizeRow(row(0), 0).value, 0);
});
test("units are explicitly converted and ambiguous units rejected", () => {
  assert.equal(
    normalizeRow(
      { test: "albumin", value: 3.1, unit: "g/dL", date: "2026-10-23" },
      0,
    ).value,
    31,
  );
  assert.equal(normalizeRow(row(1300, "/µL"), 0).value, 1.3);
  assert.ok(normalizeRow(row(4, "%"), 0).error);
  assert.ok(
    normalizeRow(
      { test: "urea", value: 40, unit: "mg/dL", date: "2026-10-23" },
      0,
    ).error,
  );
});
test("calendar dates reject rollover and non ISO values", () => {
  for (const v of ["2026-02-31", "2026-13-01", "23/10/2026", "2026-2-3", ""])
    assert.equal(dateValid(v), false);
  assert.equal(dateValid("2024-02-29"), true);
  assert.ok(normalizeRow(row(4, "10^9/L", "2026-02-31"), 0).error);
});
test("CSV handles Turkish decimals, quoted separators and BOM", () => {
  const rs = parseCSV(
    '\uFEFFtest;value;unit;date\r\nalbumin;"3,1";g/dL;2026-10-23\r\n',
  );
  assert.equal(normalizeRow(rs[0], 0).value, 31);
  assert.throws(() =>
    parseCSV("test,value,unit,date\nalbumin,3,1,g/L,2026-10-23"),
  );
  assert.throws(() =>
    parseCSV('test,value,unit,date\n"albumin,3,g/L,2026-10-23'),
  );
});
