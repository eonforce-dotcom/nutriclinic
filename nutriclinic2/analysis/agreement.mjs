/** Offline, synthetic-only computational development. Never a clinical gate. */
export const ANALYSIS_VERSION = "0.1.0";
const DAY = 86400000;
const EXPECTED = Object.freeze({
  construct: "whole-body-nitrogen-balance", unit: "g N/24h",
  difference: "candidate-minus-reference", estimand: "eligible-window",
  method: "ba2007-varying-value-anova",
  residualAssumption: "independent-within-patient-synthetic",
});
const ASSUMPTIONS = Object.freeze([
  "Synthetic assertions do not establish physiological reference independence or validity.",
  "The ANOVA illustration assumes independent, homoscedastic within-patient differences; serial independence and real-patient suitability are unchecked.",
  "Whole-patient resampling assumes representative independent patient clusters; percentile intervals are a computational demonstration, not validated coverage.",
  "No clinical agreement margin, categorical metabolic label, sample size or dose has been selected. clinicalPass is always null.",
]);
const object = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const text = (value) => typeof value === "string" && value.trim().length > 0;
const idValid = (value) => text(value) && value === value.trim() && value.length <= 160;
const finite = (value) => typeof value === "number" && Number.isFinite(value);
const unique = (values) => [...new Set(values)];
// Explicit Unicode code-point ordering; never execution-host collation.
function compare(a, b) {
  const x = Array.from(a), y = Array.from(b);
  for (let i = 0; i < Math.min(x.length, y.length); i++) {
    const d = x[i].codePointAt(0) - y[i].codePointAt(0);
    if (d) return d;
  }
  return x.length - y.length;
}
const byIdentity = (a, b) => compare(a.patientId, b.patientId) || compare(a.admissionId, b.admissionId) || compare(a.windowId, b.windowId) || compare(a.revisionId || "", b.revisionId || "");
const canonical = (value) => Array.isArray(value) ? `[${value.map(canonical).join(",")}]`
  : object(value) ? `{${Object.keys(value).sort(compare).map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}`
    : JSON.stringify(value);
const mean = (values) => values.length ? values.reduce((sum, value) => sum + value / values.length, 0) : null;

function timestamp(value) {
  if (typeof value !== "string") return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?(Z|[+-]\d{2}:\d{2})$/.exec(value);
  if (!m) return null;
  const [year, month, day, hour, minute, second] = m.slice(1, 7).map((v) => Number(v || 0));
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (year < 1 || month < 1 || month > 12 || day < 1 || day > days[month - 1] || hour > 23 || minute > 59 || second > 59) return null;
  const zone = m[8];
  let offset = 0;
  if (zone !== "Z") {
    const h = Number(zone.slice(1, 3)), n = Number(zone.slice(4, 6));
    if (h > 14 || n > 59 || (h === 14 && n !== 0)) return null;
    offset = (h * 60 + n) * (zone[0] === "-" ? -1 : 1);
  }
  const point = new Date(0);
  point.setUTCFullYear(year, month - 1, day);
  point.setUTCHours(hour, minute, second, Number((m[7] || "").padEnd(3, "0")));
  return point.getTime() - offset * 60000;
}

function groupsByPatient(pairs) {
  const groups = new Map();
  for (const pair of pairs) {
    if (!groups.has(pair.patientId)) groups.set(pair.patientId, []);
    groups.get(pair.patientId).push(pair.difference);
  }
  return [...groups].sort(([a], [b]) => compare(a, b));
}

function anova(pairs) {
  const groups = groupsByPatient(pairs), N = pairs.length, n = groups.length;
  const components = { N, n, withinSS: null, betweenSS: null, MSW: null, MSB: null, divisor: null, varianceBetween: null, varianceTotal: null };
  const unavailable = (reason) => ({ status: "not_estimable", reason, components, loa: null });
  if (n < 2) return unavailable("insufficient_patients");
  if (N <= n) return unavailable("no_within_patient_repeats");
  const bias = mean(pairs.map((p) => p.difference));
  const summaries = groups.map(([patientId, values]) => ({ patientId, values, mean: mean(values) }));
  components.withinSS = summaries.reduce((sum, g) => sum + g.values.reduce((s, x) => s + (x - g.mean) ** 2, 0), 0);
  components.betweenSS = summaries.reduce((sum, g) => sum + g.values.length * (g.mean - bias) ** 2, 0);
  if (![components.withinSS, components.betweenSS].every(Number.isFinite)) {
    components.withinSS = Number.isFinite(components.withinSS) ? components.withinSS : null;
    components.betweenSS = Number.isFinite(components.betweenSS) ? components.betweenSS : null;
    return unavailable("nonfinite_variance");
  }
  components.MSW = components.withinSS / (N - n);
  components.MSB = components.betweenSS / (n - 1);
  components.divisor = (N ** 2 - summaries.reduce((s, g) => s + g.values.length ** 2, 0)) / ((n - 1) * N);
  components.varianceBetween = (components.MSB - components.MSW) / components.divisor;
  components.varianceTotal = components.MSW + components.varianceBetween;
  if (!Object.values(components).every(Number.isFinite)) {
    for (const key of Object.keys(components)) if (!Number.isFinite(components[key])) components[key] = null;
    return unavailable("nonfinite_variance");
  }
  if (components.varianceBetween < 0) return unavailable("negative_between_component");
  const width = 1.96 * Math.sqrt(components.varianceTotal);
  const loa = { lower: bias - width, upper: bias + width };
  if (!Object.values(loa).every(Number.isFinite)) return unavailable("nonfinite_limits");
  return { status: "estimable", reason: null, components, loa };
}

function mulberry32(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}
function percentile(values, probability) {
  const sorted = [...values].sort((a, b) => a - b);
  const position = (sorted.length - 1) * probability, lower = Math.floor(position), weight = position - lower;
  return weight === 0 ? sorted[lower] : sorted[lower] * (1 - weight) + sorted[lower + 1] * weight;
}
const interval = (values) => ({ lower: percentile(values, 0.025), upper: percentile(values, 0.975) });

function bootstrap(pairs, config, point) {
  const result = {
    status: "not_estimable", reason: null, seed: config.seed, replicates: config.replicates, replicatesRun: 0,
    rng: "mulberry32", seedPolicy: "reset independently within each setting", sampling: "whole-patient-with-replacement",
    quantiles: [0.025, 0.975], quantileMethod: "linear interpolation at (length - 1) * probability",
    biasValidReplicates: 0, biasFailedReplicates: 0, anovaValidReplicates: 0, anovaFailedReplicates: 0,
    anovaFailures: {}, biasCI: null, loaCI: null,
  };
  const groups = groupsByPatient(pairs);
  if (groups.length < 2) { result.reason = "insufficient_patients"; return result; }
  const random = mulberry32(config.seed), biases = [], patientBiases = [], lowers = [], uppers = [];
  for (let r = 0; r < config.replicates; r++) {
    const sampled = [];
    for (let draw = 0; draw < groups.length; draw++) {
      const [, values] = groups[Math.floor(random() * groups.length)];
      // Fresh identities keep repeated draws of one patient as distinct clusters.
      for (const difference of values) sampled.push({ patientId: `draw-${draw}`, difference });
    }
    const bias = mean(sampled.map((p) => p.difference));
    const sensitivity = mean(groupsByPatient(sampled).map(([, values]) => mean(values)));
    if (finite(bias) && finite(sensitivity)) { biases.push(bias); patientBiases.push(sensitivity); result.biasValidReplicates++; }
    else result.biasFailedReplicates++;
    const estimate = anova(sampled);
    if (estimate.status === "estimable") {
      lowers.push(estimate.loa.lower); uppers.push(estimate.loa.upper); result.anovaValidReplicates++;
    } else {
      result.anovaFailedReplicates++;
      result.anovaFailures[estimate.reason] = (result.anovaFailures[estimate.reason] || 0) + 1;
    }
    result.replicatesRun++;
  }
  if (result.biasFailedReplicates === 0) {
    result.biasCI = { eligibleWindow: interval(biases), patientWeighted: interval(patientBiases) };
    result.status = "estimated";
  } else result.reason = "nonfinite_bootstrap_bias";
  if (point.status === "estimable" && result.anovaFailedReplicates === 0)
    result.loaCI = { lower: interval(lowers), upper: interval(uppers) };
  return result;
}

const emptyCounts = () => ({
  patients: 0, admissions: 0, logicalWindows: 0, planned: 0, attempted: 0, complete: 0,
  candidateObserved: 0, referenceAvailable: 0, pairs: 0, revisionGroups: 0, duplicateRows: 0,
  unresolvedRevisions: 0, unknownAttempted: 0, unknownComplete: 0,
});
const emptySetting = () => ({ countsStatus: "not_evaluated", counts: Object.fromEntries(Object.keys(emptyCounts()).map((key) => [key, null])), exclusions: [], reasonCounts: {}, pairs: [], bias: { eligibleWindow: null, patientWeighted: null }, anova: null, bootstrap: null });

/** Pure report builder: inputs are never changed; all clinical conclusions refused. */
export function analyzeSyntheticAgreement(input) {
  const report = {
    schema: "nutriklinik-synthetic-agreement-report-v1", analysisVersion: ANALYSIS_VERSION,
    status: "refused", syntheticOnly: true, clinicalPass: null, analysisSetStatus: "not_built", errors: [], contract: null,
    assumptions: [...ASSUMPTIONS], patients: { total: null, screened: null, eligible: null, enrolled: null },
    ledger: [], settings: { icu: emptySetting(), ward: emptySetting() },
  };
  const error = (code, path, message) => report.errors.push({ code, path, message });
  const shape = (value, keys, path) => {
    if (!object(value)) { error("invalid_object", path, "A JSON object is required."); return false; }
    for (const key of Object.keys(value)) if (!keys.includes(key)) error("unknown_field", `${path}.${key}`, "Unknown fields are not accepted by the synthetic-only contract.");
    return true;
  };
  if (!shape(input, ["schema", "dataClass", "config", "patients", "windows"], "input")) return report;
  if (input.schema !== "nutriklinik-synthetic-agreement-v1" || input.dataClass !== "synthetic") {
    error("synthetic_only", "input", "Only the explicitly synthetic schema and dataClass are accepted; this is not a real-study data route.");
    return report;
  }
  if (shape(input.config, [...Object.keys(EXPECTED), "bootstrap"], "config")) {
    for (const [key, expected] of Object.entries(EXPECTED)) if (input.config[key] !== expected)
      error("unapproved_contract", `config.${key}`, `Explicit value required: ${expected}. No real-study configuration is approved.`);
    if (shape(input.config.bootstrap, ["seed", "replicates"], "config.bootstrap")) {
      const b = input.config.bootstrap;
      if (!Number.isInteger(b.seed) || b.seed < 0 || b.seed > 4294967295) error("invalid_seed", "config.bootstrap.seed", "An explicit uint32 seed is required.");
      if (!Number.isInteger(b.replicates) || b.replicates < 1 || b.replicates > 10000) error("invalid_replicates", "config.bootstrap.replicates", "An explicit computational replicate count from 1 to 10000 is required.");
    }
  }
  if (!Array.isArray(input.patients) || input.patients.length > 10000) error("invalid_patients", "patients", "Patient ledger must be an array of at most 10000 synthetic entries.");
  if (!Array.isArray(input.windows) || input.windows.length > 50000) error("invalid_windows", "windows", "Window ledger must be an array of at most 50000 synthetic entries.");
  if (report.errors.length) return report;
  report.contract = { ...EXPECTED, bootstrap: { ...input.config.bootstrap } };
  const patients = new Map();
  Array.from(input.patients).forEach((patient, index) => {
    const path = `patients[${index}]`;
    if (!shape(patient, ["patientId", "screened", "eligible", "enrolled"], path)) return;
    if (!idValid(patient.patientId)) error("invalid_identifier", `${path}.patientId`, "A nonempty, trimmed patient ID of at most 160 characters is required.");
    else if (patients.has(patient.patientId)) error("duplicate_patient", path, "Patient identities must be unique, not revisions.");
    else patients.set(patient.patientId, patient);
    for (const key of ["screened", "eligible", "enrolled"]) if (typeof patient[key] !== "boolean") error("invalid_flag", `${path}.${key}`, "An explicit boolean is required.");
    if ((patient.eligible === true && patient.screened !== true) || (patient.enrolled === true && patient.eligible !== true))
      error("patient_nesting", path, "Enrollment must be nested within eligibility and screening.");
  });
  const measurement = (value, reference, path) => {
    if (!shape(value, ["status", "value", "unit", "construct", "start", "end", "source", "independent", "reason"], path)) return;
    const statuses = reference ? ["observed", "unavailable", "unreliable"] : ["observed", "expected_suppression", "execution_failure", "unavailable"];
    if (!statuses.includes(value.status)) { error("invalid_status", `${path}.status`, "Use an explicit permitted measurement status."); return; }
    if (value.status !== "observed") return;
    if (!finite(value.value)) error("invalid_observed_value", `${path}.value`, "An observed value must be a finite number; zero is valid and missing is not zero.");
    if (value.unit !== EXPECTED.unit || value.construct !== EXPECTED.construct) error("incompatible_measurement", path, "Observed measurements must explicitly represent the same whole-body construct and g N/24h unit.");
    if (!text(value.source)) error("missing_source", `${path}.source`, "An observed synthetic source description is required.");
    if (reference && value.independent !== true) error("reference_not_independent", `${path}.independent`, "An observed reference requires the explicit synthetic independence assertion; no physiological independence is established.");
  };
  Array.from(input.windows).forEach((window, index) => {
    const path = `windows[${index}]`;
    if (!shape(window, ["patientId", "admissionId", "windowId", "revisionId", "selected", "planned", "attempted", "collectionComplete", "setting", "start", "end", "exitReason", "candidate", "reference"], path)) return;
    for (const key of ["patientId", "admissionId", "windowId", "revisionId"]) if (!idValid(window[key])) error("invalid_identifier", `${path}.${key}`, "An explicit trimmed synthetic identifier is required.");
    if (patients.get(window.patientId)?.enrolled !== true) error("window_patient", path, "Windows must refer to an enrolled patient in the external patient ledger.");
    for (const key of ["selected", "planned", "attempted", "collectionComplete"]) if (typeof window[key] !== "boolean") error("invalid_flag", `${path}.${key}`, "An explicit boolean is required.");
    if ((window.attempted === true && window.planned !== true) || (window.collectionComplete === true && window.attempted !== true))
      error("window_nesting", path, "Attempted windows must be planned; completed collections must have been attempted.");
    if (!["icu", "ward"].includes(window.setting)) error("invalid_setting", `${path}.setting`, "ICU and ward are the only permitted separate settings.");
    if (![null, "death", "discharge", "transfer", "other"].includes(window.exitReason)) error("invalid_exit", `${path}.exitReason`, "An explicit permitted external exit reason or null is required.");
    measurement(window.candidate, false, `${path}.candidate`);
    measurement(window.reference, true, `${path}.reference`);
    if (window.candidate?.status === "observed" && window.reference?.status === "observed" && finite(window.candidate.value) && finite(window.reference.value)) {
      if (!finite(window.candidate.value - window.reference.value) || !finite(window.candidate.value / 2 + window.reference.value / 2))
        error("nonfinite_pair", path, "Finite observed values overflow the paired arithmetic; agreement is refused.");
    }
  });
  if (report.errors.length) return report;
  report.patients = { total: patients.size, screened: 0, eligible: 0, enrolled: 0 };
  for (const patient of patients.values()) for (const flag of ["screened", "eligible", "enrolled"]) if (patient[flag]) report.patients[flag]++;

  const logical = new Map();
  for (const window of input.windows) {
    const key = JSON.stringify([window.patientId, window.admissionId, window.windowId]);
    if (!logical.has(key)) logical.set(key, new Map());
    const revisions = logical.get(key);
    if (!revisions.has(window.revisionId)) revisions.set(window.revisionId, { variants: new Map(), duplicateRows: 0 });
    const revision = revisions.get(window.revisionId), payload = canonical(window);
    if (revision.variants.has(payload)) revision.duplicateRows++;
    else revision.variants.set(payload, window);
  }
  const retained = [];
  for (const revisions of logical.values()) {
    const variants = [...revisions.values()].flatMap((r) => [...r.variants.values()]);
    const selectedIds = unique(variants.filter((v) => v.selected).map((v) => v.revisionId)).sort(compare);
    const conflict = [...revisions.values()].some((r) => r.variants.size > 1);
    const chosen = selectedIds.length === 1 && !conflict ? variants.find((v) => v.selected) : null;
    const common = (key) => unique(variants.map((v) => v[key])).length === 1 ? variants[0][key] : null;
    const selectedOrCommon = (key) => chosen ? chosen[key] : common(key);
    const row = {
      patientId: variants[0].patientId, admissionId: variants[0].admissionId, windowId: variants[0].windowId,
      revisionId: chosen?.revisionId ?? null, selectedRevisionIds: selectedIds,
      setting: selectedOrCommon("setting"), planned: selectedOrCommon("planned"), attempted: selectedOrCommon("attempted"),
      collectionComplete: selectedOrCommon("collectionComplete"), exitReason: selectedOrCommon("exitReason"),
      start: selectedOrCommon("start"), end: selectedOrCommon("end"),
      candidateStatus: chosen?.candidate.status ?? null, referenceStatus: chosen?.reference.status ?? null,
      revisionGroups: revisions.size, duplicateRows: [...revisions.values()].reduce((s, r) => s + r.duplicateRows, 0),
      reasons: [],
    };
    if (conflict) row.reasons.push("conflicting_duplicate");
    if (selectedIds.length === 0) row.reasons.push("revision_selection_missing");
    if (selectedIds.length > 1) row.reasons.push("revision_selection_multiple");
    if (!chosen && ["setting", "planned", "attempted", "collectionComplete", "start", "end"].some((key) => common(key) === null)) row.reasons.push("ledger_conflict");
    if (chosen) {
      if (!chosen.planned) row.reasons.push("not_planned");
      if (!chosen.attempted) row.reasons.push("not_attempted");
      if (!chosen.collectionComplete) row.reasons.push("incomplete_collection");
      if (chosen.candidate.status !== "observed") row.reasons.push(`candidate_${chosen.candidate.status}`);
      if (chosen.reference.status !== "observed") row.reasons.push(`reference_${chosen.reference.status}`);
      const start = timestamp(chosen.start), end = timestamp(chosen.end);
      if (start === null || end === null) row.reasons.push("interval_invalid");
      else if (end - start !== DAY) row.reasons.push("interval_not_24h");
      for (const name of ["candidate", "reference"]) if (chosen[name].status === "observed") {
        const a = timestamp(chosen[name].start), b = timestamp(chosen[name].end);
        if (a === null || b === null) row.reasons.push(`${name}_interval_invalid`);
        else if (start !== null && end !== null && (a !== start || b !== end)) row.reasons.push(`${name}_interval_mismatch`);
      }
      retained.push({ row, chosen, start, end });
    }
    report.ledger.push(row);
  }
  // A selected overlapping interval is relevant even if its measurement is
  // unavailable. Compare across admissions and settings within the same patient.
  const ordered = retained.filter((r) => r.start !== null && r.end !== null && r.end > r.start)
    .sort((a, b) => compare(a.row.patientId, b.row.patientId) || a.start - b.start || byIdentity(a.row, b.row));
  let component = null;
  for (const current of ordered) {
    if (component && component.patientId === current.row.patientId && component.end > current.start) {
      if (!current.row.reasons.includes("overlap")) current.row.reasons.push("overlap");
      if (!component.first.row.reasons.includes("overlap")) component.first.row.reasons.push("overlap");
      component.end = Math.max(component.end, current.end);
    } else component = { patientId: current.row.patientId, end: current.end, first: current };
  }
  report.ledger.sort(byIdentity);
  for (const setting of ["icu", "ward"]) {
    const output = report.settings[setting], rows = report.ledger.filter((r) => r.setting === setting);
    output.countsStatus = "computed";
    output.counts = emptyCounts();
    output.counts.patients = unique(rows.map((r) => r.patientId)).length;
    output.counts.admissions = unique(rows.map((r) => JSON.stringify([r.patientId, r.admissionId]))).length;
    output.counts.logicalWindows = rows.length;
    for (const row of rows) {
      for (const [key, flag] of [["planned", "planned"], ["attempted", "attempted"], ["complete", "collectionComplete"]]) if (row[flag] === true) output.counts[key]++;
      if (row.attempted === null) output.counts.unknownAttempted++;
      if (row.collectionComplete === null) output.counts.unknownComplete++;
      if (row.candidateStatus === "observed") output.counts.candidateObserved++;
      if (row.referenceStatus === "observed") output.counts.referenceAvailable++;
      output.counts.revisionGroups += row.revisionGroups;
      output.counts.duplicateRows += row.duplicateRows;
      if (row.revisionId === null) output.counts.unresolvedRevisions++;
      if (row.reasons.length) output.exclusions.push({ patientId: row.patientId, admissionId: row.admissionId, windowId: row.windowId, revisionId: row.revisionId, reasons: [...row.reasons] });
      for (const reason of row.reasons) output.reasonCounts[reason] = (output.reasonCounts[reason] || 0) + 1;
    }
    for (const { row, chosen } of retained.filter((r) => r.row.setting === setting && r.row.reasons.length === 0)) {
      output.pairs.push({ patientId: row.patientId, admissionId: row.admissionId, windowId: row.windowId, revisionId: row.revisionId,
        start: chosen.start, end: chosen.end, candidate: chosen.candidate.value, reference: chosen.reference.value,
        unit: EXPECTED.unit, construct: EXPECTED.construct, timeBasis: "explicit-offset-instants",
        candidateSource: chosen.candidate.source, referenceSource: chosen.reference.source,
        candidateStart: chosen.candidate.start, candidateEnd: chosen.candidate.end,
        referenceStart: chosen.reference.start, referenceEnd: chosen.reference.end,
        referenceIndependentSyntheticAssertion: true,
        difference: chosen.candidate.value - chosen.reference.value, mean: chosen.candidate.value / 2 + chosen.reference.value / 2 });
    }
    output.pairs.sort(byIdentity);
    output.counts.pairs = output.pairs.length;
    output.bias.eligibleWindow = mean(output.pairs.map((p) => p.difference));
    output.bias.patientWeighted = mean(groupsByPatient(output.pairs).map(([, values]) => mean(values)));
    if (output.pairs.length && (!finite(output.bias.eligibleWindow) || !finite(output.bias.patientWeighted))) {
      error("nonfinite_summary", `settings.${setting}`, "Observed paired arithmetic overflows a summary; agreement is refused.");
      output.bias = { eligibleWindow: null, patientWeighted: null };
    }
    output.anova = anova(output.pairs);
    output.bootstrap = bootstrap(output.pairs, input.config.bootstrap, output.anova);
  }
  report.ledgerSummary = { logicalWindows: report.ledger.length, unassignedSettingWindows: report.ledger.filter((r) => r.setting === null).length };
  report.analysisSetStatus = "built";
  if (!report.errors.length) report.status = "ok";
  else for (const output of Object.values(report.settings)) { output.bias = { eligibleWindow: null, patientWeighted: null }; output.anova = null; output.bootstrap = null; }
  return report;
}
