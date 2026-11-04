export const dateValid = (s) =>
  typeof s === "string" &&
  /^\d{4}-\d{2}-\d{2}$/.test(s) &&
  Number.isFinite(Date.parse(s + "T12:00:00Z")) &&
  new Date(s + "T12:00:00Z").toISOString().slice(0, 10) === s;
export const labDefs = {
  lactate: { unit: "mmol/L", min: 0.1, max: 30 },
  creatinine: { unit: "mg/dL", min: 0.1, max: 30 },
  albumin: { unit: "g/L", min: 5, max: 70 },
  neutrophils: { unit: "10^9/L", min: 0, max: 100 },
  lymphocytes: { unit: "10^9/L", min: 0, max: 100 },
  crp: { unit: "mg/L", min: 0, max: 1000 },
  potassium: { unit: "mmol/L", min: 0.5, max: 12 },
  phosphate: { unit: "mmol/L", min: 0.05, max: 8 },
  magnesium: { unit: "mmol/L", min: 0.05, max: 6 },
  uun: { unit: "g N/24h", min: 0, max: 100 },
};
const aliases = {
  lactate: "lactate",
  laktat: "lactate",
  creatinine: "creatinine",
  kreatinin: "creatinine",
  albumin: "albumin",
  albümin: "albumin",
  neutrophils: "neutrophils",
  neut: "neutrophils",
  nötrofil: "neutrophils",
  neutrophil: "neutrophils",
  lymphocytes: "lymphocytes",
  lenfosit: "lymphocytes",
  lymphocyte: "lymphocytes",
  crp: "crp",
  potassium: "potassium",
  potasyum: "potassium",
  phosphate: "phosphate",
  fosfat: "phosphate",
  magnesium: "magnesium",
  magnezyum: "magnesium",
  uun: "uun",
};
export function parseCSV(text) {
  const delimiter = text.split(/\r?\n/)[0].includes(";") ? ";" : ",";
  let rows = [],
    row = [],
    cell = "",
    quote = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (quote && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else quote = !quote;
    } else if (c === delimiter && !quote) {
      row.push(cell);
      cell = "";
    } else if ((c === "\n" || c === "\r") && !quote) {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      if (row.some((x) => x.trim())) rows.push(row);
      row = [];
      cell = "";
    } else cell += c;
  }
  if (quote) throw Error("CSV tırnakları eşleşmiyor.");
  row.push(cell);
  if (row.some((x) => x.trim())) rows.push(row);
  const header = (rows.shift() || []).map((x) =>
    x
      .replace(/^\uFEFF/, "")
      .trim()
      .toLowerCase(),
  );
  if (!["test", "value", "unit", "date"].every((k) => header.includes(k)))
    throw Error("CSV başlıkları test,value,unit,date olmalıdır.");
  return rows.map((r) => {
    if (r.length !== header.length)
      throw Error(
        "CSV sütun sayısı tutarsız. Ondalık virgül için noktalı virgül ayırıcı veya tırnak kullanın.",
      );
    return Object.fromEntries(header.map((h, i) => [h, r[i].trim()]));
  });
}
function unitNorm(s) {
  return String(s)
    .toLowerCase()
    .replace(/\s/g, "")
    .replaceAll("⁹", "^9")
    .replaceAll("×", "")
    .replaceAll("µ", "u")
    .replaceAll("μ", "u");
}
export function normalizeRow(r, i) {
  if (!r || typeof r !== "object") return { error: "Kayıt nesne değil", i };
  const test =
    aliases[
      String(r.test || "")
        .trim()
        .toLowerCase()
    ];
  let value =
    typeof r.value === "number"
      ? r.value
      : Number(String(r.value ?? "").replace(",", "."));
  const unit = unitNorm(r.unit ?? ""),
    date = String(r.date ?? "");
  if (!test)
    return {
      i,
      error: `Desteklenmeyen test: ${String(r.test || "").slice(0, 50)}`,
    };
  if (
    !["number", "string"].includes(typeof r.value) ||
    (typeof r.value === "string" &&
      !/^[+-]?(?:\d+(?:[.,]\d*)?|[.,]\d+)(?:[eE][+-]?\d+)?$/.test(
        r.value.trim(),
      )) ||
    !Number.isFinite(value)
  )
    return { i, error: "Sayısal değer eksik / geçersiz", test };
  let conversion = "";
  if (test === "albumin" && unit === "g/dl") {
    value *= 10;
    conversion = "g/dL × 10";
  } else if (
    ["neutrophils", "lymphocytes"].includes(test) &&
    ["/ul", "cells/ul", "/mm3"].includes(unit)
  ) {
    value /= 1000;
    conversion = "/µL ÷ 1000";
  } else if (
    unit !== unitNorm(labDefs[test].unit) &&
    !(test === "potassium" && unit === "meq/l")
  )
    return {
      i,
      test,
      error: `Birim doğrulanamadı: ${String(r.unit ?? "").slice(0, 30)}`,
    };
  if (value < labDefs[test].min || value > labDefs[test].max)
    return { i, test, error: "Değer bu sürümün veri kabul aralığı dışında." };
  if (!dateValid(date))
    return { i, test, error: "Tarih YYYY-MM-DD olmalıdır." };
  return { i, test, value, unit: labDefs[test].unit, date, conversion };
}
