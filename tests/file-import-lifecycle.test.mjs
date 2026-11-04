import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import { randomUUID } from "node:crypto";
import { evaluate, VERSION } from "../dist/engine.mjs";
import { dateValid, labDefs, parseCSV, normalizeRow } from "../dist/import.mjs";
import { restoreDelivery, evaluateDelivery } from "../dist/followup-engine.mjs";
import { enforceClinicalContext } from "../dist/clinical-context.mjs";
import { buildCoreRuleProvenance } from "../dist/core-rule-provenance.mjs";
import { coreRuleSourcesMarkup, coreRuleSourcesTitle } from "../dist/core-provenance-ui.mjs";
import { engineSha256, assessmentSha256 } from "../dist/build-info.mjs";
import { EVIDENCE_CUTOFF, UI_VERSION } from "../dist/config.mjs";
import { emptyReferenceProfile, evaluateReferenceProfile, restoreReferenceProfile } from "../dist/lab-reference-ranges.mjs";

// Execute the real application and its registered handlers. Only browser/module
// dependencies are replaced; the file-read, review, reset and commit code is not.
const source = (await readFile(new URL("../dist/app.mjs", import.meta.url), "utf8"))
  .replace(/^import .*;\r?\n/gm, "")
  .replace('import("./vendor/pdf.mjs")', "__loadPdfModule()");
const deferred = () => {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};
const csv = (value) => `test,value,unit,date\nalbumin,${value},g/L,2026-10-24`;
const file = (name, text, size = 100) => ({ name, size, text: () => Promise.resolve(text) });
const pendingFile = (name) => {
  const read = deferred();
  return { read, file: { name, size: 100, text: () => read.promise } };
};

function app(loadPdfModule = () => Promise.reject(Error("Unexpected PDF request"))) {
  const elements = new Map();
  let visitButtons = [], applyButton = null, selectedImports = [], followupOptions;
  class Element {
    constructor(id = "") {
      this.id = id;
      this.handlers = new Map();
      this.dataset = {};
      this.files = [];
      this.checked = false;
      this.hidden = false;
      this.textContent = "";
      this.validity = { valid: true };
      this.classList = { add() {}, remove() {}, toggle() { return false; } };
      this._value = "";
      this._html = "";
    }
    get value() { return this._value; }
    set value(value) {
      this._value = value;
      if (!value && ["labFile", "sessionFile"].includes(this.id)) this.files = [];
    }
    get innerHTML() { return this._html; }
    set innerHTML(value) {
      this._html = value;
      if (this.id === "importPreview") {
        selectedImports = [];
        applyButton = value.includes('id="applyImport"') ? new Element("applyImport") : null;
      }
      if (this.id === "visitsList") {
        visitButtons = [...value.matchAll(/data-load-visit="(\d+)"/g)].map((match) => {
          const button = new Element();
          button.dataset.loadVisit = match[1];
          return button;
        });
      }
    }
    addEventListener(type, callback) {
      const handlers = this.handlers.get(type) || [];
      this.handlers.set(type, [...handlers, callback]);
    }
    emit(type) { return Promise.all((this.handlers.get(type) || []).map((callback) => callback({ target: this, preventDefault() {} }))); }
    setAttribute() {}
    focus() {}
    insertAdjacentHTML() {}
    click() { return this.emit("click"); }
  }
  const element = (id) => {
    if (id === "applyImport") return applyButton;
    if (!elements.has(id)) elements.set(id, new Element(id));
    return elements.get(id);
  };
  const document = {
    addEventListener() {},
    getElementById: element,
    querySelector: element,
    querySelectorAll(selector) {
      if (selector === "[data-load-visit]") return visitButtons;
      if (selector === "[data-import]:checked") return selectedImports;
      return [];
    },
    createElement: () => new Element(),
  };
  const noop = () => {};
  const lifecycle = () => ({ reset: noop, refresh: noop, invalidate: noop, invalidateCore: noop, invalidateReviews: noop, restore: noop, restoreDraft:noop, getDraft:()=>({}), snapshot: () => null, series:()=>null, getMeasures: () => ({}), context: () => ({ blockers: [] }), setDraft: noop });
  let persistenceOptions,saveAllowed=true;
  const persistenceState={dirty:false,saving:false,loaded:true,phase:'ready'};
  const location = { hash: "" };
  const context = vm.createContext({
    document, location, history: { pushState: noop },
    window: { location, addEventListener: noop, scrollTo: noop, matchMedia: () => ({ matches: false }), print: noop },
    setTimeout: () => 0, clearTimeout: noop, crypto: { randomUUID }, structuredClone,
    console, Blob, URL, Uint8Array,
    evaluate, VERSION, dateValid, labDefs, parseCSV, normalizeRow,
    restoreDelivery, evaluateDelivery, enforceClinicalContext,
    buildCoreRuleProvenance, coreRuleSourcesMarkup, coreRuleSourcesTitle,
    // A browser's imported modules and parsed records share one realm. Bridge
    // the VM/host boundary so the module's strict plain-object guard sees the
    // same object prototypes it would see in the real application.
    evaluateReferenceProfile:(input,profile,options)=>evaluateReferenceProfile(structuredClone(input),structuredClone(profile),options===undefined?undefined:structuredClone(options)),
    restoreReferenceProfile:value=>restoreReferenceProfile(structuredClone(value)), reportAppendixMarkup:()=>"",
    initLabReferences:()=>({refresh:noop,resetApplicability:noop,restore:noop,snapshot:()=>null}),
    initLocalRecordsUI:()=>({update:noop,refresh:noop}),
    createLocalRecordStore:options=>{persistenceOptions=options;return {start:()=>Promise.resolve({ok:false}),changed:noop,flush:()=>Promise.resolve({ok:saveAllowed}),getState:()=>persistenceState};},
    engineSha256, assessmentSha256, EVIDENCE_CUTOFF, UI_VERSION,
    initI18n: noop, translate: (text) => text, getLocale: () => "tr", getNumberLocale: () => "tr-TR",
    initClinicalWorkspace: lifecycle, initExperience: lifecycle,
    initNavigationHelp:()=>({refresh:noop,hide:noop}),initStartGuide:lifecycle,
    initAboutLicenses:()=>({refresh:noop,open:noop,hide:noop,destroy:noop}),
    initFollowup: (options) => { followupOptions = options; return lifecycle(); },
    applyEditionText: noop, editionText: (local) => local,
    __loadPdfModule: loadPdfModule,
    ...Object.fromEntries(["glutamineEvidence", "leucineEvidence", "evidence2026", "neuroEvidence2026", "extraEvidence", "evidence", "indexEvidence", "evidenceUpdate", "metabolicEvidence", "additionalSources"].map((key) => [key, []])),
  });
  new vm.Script(source + `\nglobalThis.inspectApp = () => structuredClone({state,visits,sourceInfo,importRows,importedComparisons});`, { filename: "app.mjs" }).runInContext(context);
  return {
    element,
    inspect: () => context.inspectApp(),
    click: (id) => element(id).click(),
    choose(id, selected) {
      const target = element(id);
      target.value = selected?.name || "";
      target.files = selected ? [selected] : [];
      return target.emit("change");
    },
    input(id, value) { element(id).value = value; return element(id).emit("input"); },
    confirm(id) { element(id).checked = true; return element(id).emit("change"); },
    selectRows(...indices) { selectedImports = indices.map((index) => ({ dataset: { import: String(index) } })); },
    openVisit: (index = 0) => visitButtons[index].click(),
    examples: () => followupOptions.onExamples(),
    captureLocal:()=>structuredClone(persistenceOptions.capture()),
    applyLocal:value=>persistenceOptions.apply(structuredClone(value)),
    allowDiskSave:value=>{saveAllowed=value;},
  };
}

const session = (h, code) => JSON.stringify({
  schema: "nutriklinik-research-0.1.0",
  records: [{ input: { ...h.inspect().state, studyId: code }, output: { trusted: true } }],
});
async function seedReviewedMeasurement(h) {
  await h.choose("labFile", file("reviewed.csv", csv(35)));
  h.selectRows(0);
  await h.click("applyImport");
  await h.input("studyId", "CASE-SAVED");
  await h.confirm("labsConfirmed");
  await h.confirm("clinicianConfirmed");
}

test("a slow old CSV cannot replace the newer structured preview or its status", async () => {
  const h = app(), old = pendingFile("old.csv");
  const oldJob = h.choose("labFile", old.file);
  await h.choose("labFile", file("new.json", JSON.stringify([{ test: "albumin", value: 42, unit: "g/L", date: "2026-10-24" }])));
  const status = h.element("uploadStatus").textContent;
  old.read.resolve(csv(25));
  await oldJob;
  assert.equal(h.inspect().importRows[0].value, 42);
  assert.equal(h.element("uploadStatus").textContent, status);
  h.selectRows(0);
  await h.click("applyImport");
  assert.equal(h.inspect().state.albumin, 42);
});

test("old TXT success and failure cannot overwrite a newer preview", async () => {
  for (const reject of [false, true]) {
    const h = app(), old = pendingFile("old.txt");
    const oldJob = h.choose("labFile", old.file);
    await h.choose("labFile", file("new.csv", csv(41)));
    const status = h.element("uploadStatus").textContent;
    if (reject) old.read.reject(Error("old read failed"));
    else old.read.resolve("Old document readable text that belongs to a previous selection.");
    await oldJob;
    assert.equal(h.inspect().importRows[0].value, 41);
    assert.equal(h.element("uploadStatus").textContent, status);
    assert.equal(h.element("extractedText").textContent, "");
    assert.equal(h.element("extractedText").hidden, true);
  }
});

function heldPdf(stage) {
  const entered = deferred(), release = deferred();
  let destroyed = 0;
  const wait = (name, value) => {
    if (stage !== name) return Promise.resolve(value);
    entered.resolve();
    return release.promise.then(() => value);
  };
  const page = { getTextContent: () => wait("text", { items: [{ str: "Readable PDF text from the old selected document." }] }) };
  const pdf = { numPages: 1, getPage: () => wait("page", page), destroy: () => { destroyed++; return wait("destroy"); } };
  const module = { GlobalWorkerOptions: {}, getDocument: () => ({ promise: wait("document", pdf) }) };
  return {
    entered: entered.promise, release: release.resolve,
    load: () => wait("module", module),
    file: { name: "old.pdf", size: 100, arrayBuffer: () => wait("bytes", new ArrayBuffer(2)) },
    destroyed: () => destroyed,
  };
}

test("local PDF review uses byte-only loading controls and displays extracted markup as text without importing measurements", async () => {
  const documentText = '<img src=x onerror="globalThis.untrustedPdfRan=true"> Albumin 999 g/L 2026-10-28';
  const bytes = new Uint8Array([37, 80, 68, 70, 45, 83, 89, 78, 84, 72, 69, 84, 73, 67]);
  let receivedOptions, destroyed = 0;
  const pdfModule = {
    GlobalWorkerOptions: {},
    getDocument(options) {
      receivedOptions = options;
      return { promise: Promise.resolve({
        numPages: 1,
        getPage: async number => {
          assert.equal(number, 1);
          return { getTextContent: async () => ({ items: [{ str: documentText, hasEOL: true }] }) };
        },
        destroy: async () => { destroyed++; },
      }) };
    },
  };
  const h = app(async () => pdfModule);
  await seedReviewedMeasurement(h);
  const before = h.inspect();
  assert.equal(before.state.labsConfirmed, true);
  assert.equal(before.state.clinicianConfirmed, true);

  await h.choose("labFile", { name: "local-review.pdf", size: bytes.byteLength, arrayBuffer: async () => bytes.buffer });

  assert.ok(receivedOptions.data instanceof Uint8Array);
  assert.deepEqual(Array.from(receivedOptions.data), Array.from(bytes));
  assert.equal(Object.hasOwn(receivedOptions, "url"), false);
  assert.equal(receivedOptions.useWorkerFetch, false);
  assert.equal(receivedOptions.disableAutoFetch, true);
  assert.equal(receivedOptions.disableStream, true);
  // Retained compatibility input; patched PDF.js is the dependency remediation.
  assert.equal(receivedOptions.isEvalSupported, false);
  assert.equal(Object.hasOwn(receivedOptions, "enableScripting"), false);
  assert.equal(pdfModule.GlobalWorkerOptions.workerSrc, "./vendor/pdf.worker.mjs");
  assert.equal(destroyed, 1);
  assert.ok(h.element("extractedText").textContent.includes(documentText));
  assert.equal(h.element("extractedText").innerHTML, "");
  assert.equal(h.element("extractedText").hidden, false);
  assert.match(h.element("uploadStatus").textContent, /otomatik eşlenmez/);
  assert.deepEqual(h.inspect().state, { ...before.state, labsConfirmed: false, clinicianConfirmed: false });
  assert.deepEqual(h.inspect().sourceInfo, before.sourceInfo);
  assert.deepEqual(h.inspect().visits, before.visits);
  assert.deepEqual(h.inspect().importRows, []);
  assert.equal(h.element("applyImport"), null);
  assert.equal(h.element("labsConfirmed").checked, false);
  assert.equal(h.element("clinicianConfirmed").checked, false);
});

test('PDF.js6 teardown uses its loading task on both successful text import and parse failure',async()=>{
 for(const reject of [false,true]){
  let destroyed=0,oldProxyDestroy=0;
  const doc={numPages:1,getPage:async()=>({getTextContent:async()=>({items:[{str:'Reviewed synthetic laboratory document text.'}]})}),destroy:()=>{oldProxyDestroy++;}};
  const h=app(async()=>({GlobalWorkerOptions:{},getDocument:()=>({promise:reject?Promise.reject(Error('synthetic parse rejection')):Promise.resolve(doc),destroy:async()=>{destroyed++;}})}));
  await h.choose('labFile',{name:'synthetic.pdf',size:100,arrayBuffer:async()=>new ArrayBuffer(4)});
  assert.equal(destroyed,1);assert.equal(oldProxyDestroy,0);
  assert.match(h.element('uploadStatus').textContent,reject?/synthetic parse rejection/:/Metin okundu/);
 }
});

test("stale PDF reads at each asynchronous stage cannot replace a newer selection", async () => {
  for (const stage of ["module", "bytes", "document", "page", "text", "destroy"]) {
    const pdf = heldPdf(stage), h = app(pdf.load);
    const oldJob = h.choose("labFile", pdf.file);
    await pdf.entered;
    await h.choose("labFile", file("new.csv", csv(40)));
    const status = h.element("uploadStatus").textContent;
    pdf.release();
    await oldJob;
    assert.equal(h.inspect().importRows[0].value, 40, stage);
    assert.equal(h.element("uploadStatus").textContent, status, stage);
    assert.equal(h.element("extractedText").textContent, "", stage);
    assert.equal(h.element("extractedText").hidden, true, stage);
    assert.equal(pdf.destroyed(), ["module", "bytes"].includes(stage) ? 0 : 1, stage);
  }
});

test("research files use the newest selection and stale errors/finally cannot clear it", async () => {
  const h = app(), old = pendingFile("old-session.json");
  const oldJob = h.choose("sessionFile", old.file);
  await h.choose("sessionFile", file("new-session.json", session(h, "NEW")));
  const status = h.element("researchStatus").textContent;
  old.read.resolve(session(h, "OLD"));
  await oldJob;
  assert.equal(h.inspect().visits[0].input.studyId, "NEW");
  assert.equal(h.element("researchStatus").textContent, status);
  assert.equal(h.inspect().visits[0].input.labsConfirmed, false);

  const a = pendingFile("a.json"), b = pendingFile("b.json");
  const aJob = h.choose("sessionFile", a.file), bJob = h.choose("sessionFile", b.file);
  a.read.reject(Error("stale failure"));
  await aJob;
  assert.equal(h.element("sessionFile").value, "b.json");
  assert.match(h.element("researchStatus").textContent, /okunuyor/);
  b.read.resolve(session(h, "B"));
  await bJob;
  assert.equal(h.inspect().visits[0].input.studyId, "B");
});

test("legacy research imports rebuild current rule provenance and identity while preserving untrusted originals", async () => {
  const forgedMap = {
    origin: "imported-claimed-authority", engineVersion: "forged-engine", clinicalValidation: true,
    rules: [{id:"formulaPlan",mappingStatus:"approved",sourceReferences:[{sourceId:"made-up",role:"validated-dose"}]}],
  };
  const confirmations = ["clinicianConfirmed", "formulaVerified", "labsConfirmed", "collectionComplete", "collectionMatched"];
  for (const incomingMap of [undefined, forgedMap]) {
    const h = app();
    const input = {...h.inspect().state,studyId:"LEGACY-REIMPORT"};
    for (const key of confirmations) input[key] = true;
    const original = {
      recordId:"legacy-record",schemaVersion:"0.1.0",engineVersion:"old-engine",
      engineSha256:"old-engine-hash",assessmentSha256:"old-assessment-hash",uiVersion:"0.0.1",
      evidenceCutoff:"2000-01-01",savedAt:"2020-01-01T12:00:00Z",input,
      output:{forged:true,plan:{volume:999999},metabolic:{title:"Claimed diagnosis"}},
      ...(incomingMap === undefined ? {} : {coreRuleProvenance:incomingMap}),
    };
    await h.choose("sessionFile", file("legacy.json", JSON.stringify({schema:"nutriklinik-research-0.1.0",records:[original]})));
    const [loaded] = h.inspect().visits;
    assert.ok(loaded, h.element("researchStatus").textContent);
    assert.notEqual(loaded.recordId, original.recordId);
    assert.equal(loaded.engineVersion, VERSION);
    assert.equal(loaded.engineSha256, engineSha256);
    assert.equal(loaded.assessmentSha256, assessmentSha256);
    assert.equal(loaded.uiVersion, UI_VERSION);
    assert.equal(loaded.evidenceCutoff, EVIDENCE_CUTOFF);
    assert.deepEqual(loaded.coreRuleProvenance, buildCoreRuleProvenance());
    assert.equal(loaded.coreRuleProvenance.origin, "current-implementation-map");
    assert.equal(loaded.coreRuleProvenance.clinicalValidation, false);
    assert.deepEqual(loaded.originalRecord, original);
    assert.equal(loaded.originalRecord.engineSha256, "old-engine-hash");
    for (const key of confirmations) {
      assert.equal(loaded.input[key], false, key);
      assert.equal(loaded.originalRecord.input[key], true, `Original ${key}`);
    }
    assert.deepEqual(loaded.output, evaluate(loaded.input));
    assert.equal(loaded.output.forged, undefined);
    if (incomingMap) {
      assert.equal(loaded.originalRecord.coreRuleProvenance.clinicalValidation, true);
      assert.notDeepEqual(loaded.coreRuleProvenance, loaded.originalRecord.coreRuleProvenance);
    } else assert.equal(Object.hasOwn(loaded.originalRecord, "coreRuleProvenance"), false);
  }
});

test("research reimport rebuilds clinic interval context without trusting imported normality or confirmations", async () => {
  const profile = emptyReferenceProfile();
  Object.assign(profile, { clinicName: "Example laboratory", source: "Assay interval sheet", version: "2026.1", effectiveFrom: "2026-01-01" });
  profile.rows.albumin = { enabled: true, lower: 3.5, upper: 5, unit: "g/dL" };
  profile.rows.crp = { enabled: true, lower: null, upper: 5, unit: "mg/L" };
  const forged = {
    schemaVersion: "clinic-lab-references-0.1.0", profileSnapshot: profile, profileValid: true,
    profileErrors: [], applicabilityConfirmed: true, clinicalValidation: true,
    results: [{ analyte: "albumin", status: "within", value: 999, lower: 0, upper: 1000, reason: null }],
  };
  const invalidSnapshot = { ...forged, profileValid: false, profileErrors: [{ code: "invalid-bound", path: "rows.albumin.lower" }] };
  for (const incoming of [undefined, null, profile, forged, invalidSnapshot]) {
    const h = app();
    const original = {
      input: { ...h.inspect().state, studyId: "CLINIC-REIMPORT", albumin: 31, crp: 28, labsConfirmed: true },
      output: { plan: { volume: 999999 }, claimedDiagnosis: "Anabolic" },
      ...(incoming === undefined ? {} : { labReferences: incoming }),
    };
    await h.choose("sessionFile", file("clinic-context.json", JSON.stringify({ schema: "nutriklinik-research-0.1.0", records: [original] })));
    const [loaded] = h.inspect().visits;
    assert.ok(loaded, h.element("researchStatus").textContent);
    assert.deepEqual(loaded.originalRecord, original);
    assert.equal(loaded.input.labsConfirmed, false);
    assert.deepEqual(loaded.output, evaluate(loaded.input));
    assert.equal(loaded.output.claimedDiagnosis, undefined);
    if (incoming == null) {
      assert.equal(loaded.labReferences, null, "Legacy records do not acquire an invented profile");
    } else {
      const expected = { ...evaluateReferenceProfile(loaded.input, restoreReferenceProfile(incoming)), applicabilityConfirmed: false };
      assert.deepEqual(loaded.labReferences, expected);
      assert.equal(loaded.labReferences.applicabilityConfirmed, false);
      assert.equal(loaded.labReferences.clinicalValidation, false);
      assert.ok(loaded.labReferences.results.every(row => !["below", "within", "above"].includes(row.status)));
      if (incoming === invalidSnapshot) {
        assert.equal(loaded.labReferences.profileValid, false);
        assert.deepEqual(loaded.labReferences.profileSnapshot, emptyReferenceProfile());
      } else {
        assert.equal(loaded.labReferences.profileSnapshot.clinicName, profile.clinicName);
        assert.equal(loaded.labReferences.results.find(row => row.analyte === "albumin").reason, "applicability-unconfirmed");
        assert.notDeepEqual(loaded.labReferences.results, forged.results);
      }
    }
    await h.openVisit();
    assert.deepEqual(h.inspect().state, loaded.input, "Opening imported range context does not change core inputs");
    assert.deepEqual(h.inspect().visits[0].originalRecord, original, "Opening retains the untrusted original unchanged");
  }
});

test("manual snapshots and each synthetic follow-up record acquire independent current maps without changing outputs", async () => {
  const h = app();
  await h.input("studyId", "MANUAL-MAP");
  await h.click("saveVisit");
  await h.click("saveVisit");
  const manual = h.inspect().visits;
  assert.equal(manual.length, 2);
  for (const record of manual) {
    assert.deepEqual(record.coreRuleProvenance, buildCoreRuleProvenance());
    assert.deepEqual(record.output, evaluate(record.input));
  }
  assert.notStrictEqual(manual[0].coreRuleProvenance, manual[1].coreRuleProvenance);

  const demo = app();
  demo.examples();
  const synthetic = demo.inspect().visits;
  assert.equal(synthetic.length, 3);
  for (const record of synthetic) {
    assert.deepEqual(record.coreRuleProvenance, buildCoreRuleProvenance());
    assert.deepEqual(record.output, evaluate(record.input));
    assert.equal(record.provenance[0].method, "synthetic-followup-example");
  }
  assert.notStrictEqual(synthetic[0].coreRuleProvenance, synthetic[1].coreRuleProvenance);
  assert.notStrictEqual(synthetic[1].coreRuleProvenance, synthetic[2].coreRuleProvenance);
});

test("case transitions invalidate both pending file streams and restore only the chosen case provenance", async () => {
  for (const transition of ["newCase", "demoCase", "openVisit", "examples", "studyId", "visitDate"]) {
    const h = app();
    if (transition === "examples") await h.input("albumin", "33");
    else {
      await seedReviewedMeasurement(h);
      await h.confirm("collectionComplete");
      await h.confirm("collectionMatched");
      await h.click("saveVisit");
    }
    const lab = pendingFile("old-case.csv"), research = pendingFile("old-case.json");
    const labJob = h.choose("labFile", lab.file), researchJob = h.choose("sessionFile", research.file);
    if (transition === "openVisit") await h.openVisit();
    else if (transition === "examples") h.examples();
    else if (transition === "studyId") await h.input("studyId", "NEW-CODE");
    else if (transition === "visitDate") await h.input("visitDate", "2026-10-25");
    else await h.click(transition);
    const afterTransition = h.inspect();
    const statuses = [h.element("uploadStatus").textContent, h.element("researchStatus").textContent];
    lab.read.resolve(csv(22));
    research.read.resolve(session(h, "STALE-CASE"));
    await Promise.all([labJob, researchJob]);
    assert.deepEqual(h.inspect(), afterTransition, transition);
    assert.deepEqual([h.element("uploadStatus").textContent, h.element("researchStatus").textContent], statuses, transition);
    assert.equal(h.element("importPreview").innerHTML, "", transition);
    if (transition === "openVisit") {
      assert.equal(h.inspect().sourceInfo[0].method, "structured-file-reviewed");
      for (const key of ["labsConfirmed", "clinicianConfirmed", "formulaVerified", "collectionComplete", "collectionMatched"])
        assert.equal(h.inspect().state[key], false, key);
      assert.equal(h.inspect().visits[0].input.collectionComplete, true, "Opening does not mutate the saved record");
      assert.equal(h.inspect().visits[0].input.collectionMatched, true);
    }
    if (["newCase", "demoCase", "examples"].includes(transition)) assert.deepEqual(h.inspect().sourceInfo, []);
  }
});

test("clearing preview retains applied measurements, confirmations and source history", async () => {
  const h = app();
  await seedReviewedMeasurement(h);
  const before = h.inspect();
  await h.click("clearImport");
  assert.deepEqual(h.inspect().state, before.state);
  assert.deepEqual(h.inspect().sourceInfo, before.sourceInfo);
  assert.deepEqual(h.inspect().importRows, []);
  assert.equal(h.element("applyImport"), null);
  const old = pendingFile("pending.csv"), job = h.choose("labFile", old.file);
  await h.click("clearImport");
  const cleared = h.inspect();
  old.read.resolve(csv(20));
  await job;
  assert.deepEqual(h.inspect(), cleared);
});

test("clear session records invalidates research replacement without cancelling lab review", async () => {
  const h = app(), research = pendingFile("old.json"), lab = pendingFile("current.csv");
  const researchJob = h.choose("sessionFile", research.file), labJob = h.choose("labFile", lab.file);
  await h.click("clearVisits");
  research.read.resolve(session(h, "SHOULD-NOT-RETURN"));
  lab.read.resolve(csv(39));
  await Promise.all([researchJob, labJob]);
  assert.deepEqual(h.inspect().visits, []);
  assert.equal(h.inspect().importRows[0].value, 39);
});

test("oversize selection removes stale apply controls and leaves a persistent error with confirmations reset", async () => {
  const h = app();
  await seedReviewedMeasurement(h);
  const provenance = h.inspect().sourceInfo;
  await h.choose("labFile", file("preview.csv", csv(30)));
  await h.confirm("labsConfirmed");
  await h.confirm("clinicianConfirmed");
  assert.ok(h.element("applyImport"));
  await h.choose("labFile", file("too-big.csv", csv(20), 10 * 1024 * 1024 + 1));
  assert.equal(h.element("applyImport"), null);
  assert.deepEqual(h.inspect().importRows, []);
  assert.equal(h.element("importPreview").innerHTML, "");
  assert.match(h.element("uploadStatus").textContent, /Dosya aktarılamadı: Dosya sınırı 10 MB/);
  assert.equal(h.inspect().state.labsConfirmed, false);
  assert.equal(h.inspect().state.clinicianConfirmed, false);
  assert.equal(h.inspect().state.albumin, 35);
  assert.deepEqual(h.inspect().sourceInfo, provenance);
  const old = pendingFile("old.csv"), oldJob = h.choose("labFile", old.file);
  await h.choose("labFile", file("too-big.csv", csv(20), 10 * 1024 * 1024 + 1));
  const error = h.element("uploadStatus").textContent;
  old.read.resolve(csv(21));
  await oldJob;
  assert.equal(h.element("uploadStatus").textContent, error);
  assert.equal(h.element("applyImport"), null);
  assert.deepEqual(h.inspect().importRows, []);
});

test("empty/cancelled chooser events do not destroy the case, preview or source record", async () => {
  const h = app();
  await seedReviewedMeasurement(h);
  const before = h.inspect();
  const preview = h.element("importPreview").innerHTML;
  await h.choose("labFile", null);
  await h.choose("sessionFile", null);
  assert.deepEqual(h.inspect(), before);
  assert.equal(h.element("importPreview").innerHTML, preview);
  const pending = pendingFile("still-current.csv"), job = h.choose("labFile", pending.file);
  await h.choose("labFile", null);
  pending.read.resolve(csv(38));
  await job;
  assert.equal(h.inspect().importRows[0].value, 38, "Cancelling a chooser does not cancel a previously selected read");
});

test('local reopening retains unfinished core values and immutable assessment history while clearing only current confirmations',async()=>{
 const first=app();await first.input('studyId','SYNTHETIC-LOCAL-REOPEN');await first.click('saveVisit');
 const saved=first.inspect().visits[0];await first.input('age',130);await first.input('formulaSource','Unfinished source text');
 const disk=first.captureLocal(),second=app();second.applyLocal(disk);
 assert.equal(second.inspect().state.age,130);assert.ok(second.inspect().state.inputErrors.includes('age'));
 assert.equal(second.inspect().state.formulaSource,'Unfinished source text');assert.equal(second.inspect().state.labsConfirmed,false);
 assert.equal(second.inspect().state.clinicianConfirmed,false);assert.deepEqual(second.inspect().visits,[saved]);
 assert.equal(second.captureLocal().current.draftId,disk.current.draftId);
 const before=second.inspect();assert.throws(()=>second.applyLocal({...disk,current:{...disk.current,input:{...disk.current.input,age:'forged'}}}));
 assert.deepEqual(second.inspect(),before,'Malformed saved state is rejected before replacing on-screen entries');
});

test('a failed disk save blocks switching patients and clearing the working list',async()=>{
 const h=app();await h.input('studyId','SYNTHETIC-UNSAVED');await h.click('saveVisit');const before=h.inspect();const draft=h.captureLocal().current.draftId;
 h.allowDiskSave(false);await h.click('newCase');await h.click('demoCase');await h.click('clearVisits');
 assert.deepEqual(h.inspect(),before);assert.equal(h.captureLocal().current.draftId,draft);
 h.allowDiskSave(true);await h.click('newCase');assert.notEqual(h.captureLocal().current.draftId,draft);
 assert.equal(h.inspect().state.studyId,'');assert.deepEqual(h.inspect().visits,before.visits);
});
