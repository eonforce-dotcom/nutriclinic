import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { installSyntheticDownloads } from "../dist/synthetic-downloads.mjs";

const moduleUrl = "https://example.test/nutriklinik/synthetic-downloads.mjs";
const pageUrl = "https://example.test/nutriklinik/index.html";
const names = ["analysis-synthetic-input.json", "analysis-synthetic-report.json"];
const deferred = () => {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};
const response = (bytes, url = "") => ({ ok: true, status: 200, redirected: false, url, arrayBuffer: async () => Uint8Array.from(bytes).buffer });

function harness(fetchImpl, hrefs = names.map((name) => "./" + name), extra = {}) {
  const anchors = [], clicks = [], urls = [], revoked = [], timers = new Map(), cancelled = [];
  let language = "en", timerId = 0;
  class Link {
    constructor(href) { this.attributes = new Map([["href", href]]); this.handlers = new Set(); this.prevented = 0; }
    getAttribute(name) { return this.attributes.has(name) ? this.attributes.get(name) : null; }
    setAttribute(name, value) { this.attributes.set(name, String(value)); }
    removeAttribute(name) { this.attributes.delete(name); }
    addEventListener(type, handler) { assert.equal(type, "click"); this.handlers.add(handler); }
    removeEventListener(type, handler) { assert.equal(type, "click"); this.handlers.delete(handler); }
    click() { return Promise.all([...this.handlers].map((handler) => handler({ preventDefault: () => { this.prevented++; } }))); }
  }
  const links = hrefs.map((href) => new Link(href)), status = { textContent: "" };
  const doc = {
    baseURI: pageUrl,
    getElementById(id) { assert.equal(id, "researchStatus"); return status; },
    querySelectorAll(selector) { assert.equal(selector, "a[data-synthetic-download]"); return links; },
    createElement(tag) {
      assert.equal(tag, "a");
      const anchor = { attached: false, removed: false, click() { assert.equal(this.attached, true); clicks.push({ href: this.href, download: this.download, hidden: this.hidden }); if (extra.clickThrows) throw Error("Browser download error"); }, remove() { this.removed = true; this.attached = false; } };
      anchors.push(anchor); return anchor;
    },
    body: { appendChild(anchor) { anchor.attached = true; } },
  };
  const calls = [];
  const options = {
    document: doc, moduleUrl, pageUrl, getLocale: () => language,
    fetch: (url, options) => { calls.push({ url, options }); return fetchImpl(url, options); },
    objectUrls: {
      createObjectURL(blob) { const url = `blob:synthetic-${urls.length + 1}`; urls.push({ url, blob }); return url; },
      revokeObjectURL(url) { revoked.push(url); },
    },
    setTimeout(callback, delay) { assert.equal(delay, 1000); timers.set(++timerId, callback); return timerId; },
    clearTimeout(id) { cancelled.push(id); timers.delete(id); },
    ...extra.options,
  };
  const installed = installSyntheticDownloads(options);
  return { links, status, calls, anchors, clicks, urls, revoked, timers, cancelled, options, installed,
    language(value) { language = value; },
    flush() { for (const [id, callback] of [...timers]) { timers.delete(id); callback(); } },
  };
}

test("both known synthetic assets download exact original bytes through octet-stream Blob anchors", async () => {
  const originals = await Promise.all(names.map((name) => readFile(new URL("../dist/" + name, import.meta.url))));
  const h = harness((url) => Promise.resolve(response(originals[names.indexOf(new URL(url).pathname.split("/").at(-1))], url)));
  assert.equal(h.installed.installedCount, 2);
  for (let i = 0; i < names.length; i++) {
    h.links[i].setAttribute("download", "untrusted-name.json");
    await h.links[i].click();
    assert.equal(h.links[i].prevented, 1);
    assert.equal(h.calls[i].url, new URL(names[i], moduleUrl).href);
    const { signal, ...request } = h.calls[i].options;
    assert.ok(signal instanceof AbortSignal);
    assert.deepEqual(request, { method: "GET", mode: "same-origin", credentials: "same-origin", redirect: "error", cache: "no-store" });
    assert.equal(h.urls[i].blob.type, "application/octet-stream");
    const bytes = Buffer.from(await h.urls[i].blob.arrayBuffer());
    assert.deepEqual(bytes, originals[i]);
    const hash = (value) => createHash("sha256").update(value).digest("hex");
    assert.equal(hash(bytes), hash(originals[i]));
    assert.deepEqual(h.clicks[i], { href: h.urls[i].url, download: names[i], hidden: true });
    assert.equal(h.anchors[i].removed, true);
    assert.equal(h.links[i].getAttribute("aria-busy"), null);
  }
  assert.equal(h.status.textContent, "Synthetic file download requested.");
  assert.deepEqual(h.revoked, [], "URLs remain usable until after the browser click");
  h.flush();
  assert.deepEqual(h.revoked, h.urls.map((value) => value.url));
  h.installed.dispose();
  assert.equal(h.revoked.length, 2, "Disposal does not revoke a URL twice");
});

test("handler preserves arbitrary bytes without JSON parsing, decoding or newline normalization", async () => {
  const bytes = Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), Buffer.from("{\r\n  \"name\":\"Türkçe\"\r\n}\r\n"), Buffer.from([0, 255, 128])]);
  const h = harness(async () => response(bytes));
  await h.links[0].click();
  assert.deepEqual(Buffer.from(await h.urls[0].blob.arrayBuffer()), bytes);
  h.installed.dispose();
});

test("a busy link prevents duplicate requests and restores preexisting aria state", async () => {
  const pending = deferred(), h = harness(() => pending.promise);
  h.links[0].setAttribute("aria-disabled", "false");
  const first = h.links[0].click();
  assert.equal(h.links[0].getAttribute("aria-busy"), "true");
  assert.equal(h.links[0].getAttribute("aria-disabled"), "true");
  await h.links[0].click();
  assert.equal(h.calls.length, 1); assert.equal(h.links[0].prevented, 2);
  h.language("tr");
  pending.resolve(response([1, 2, 3])); await first;
  assert.equal(h.status.textContent, "Sentetik dosya için indirme isteği gönderildi.");
  assert.equal(h.links[0].getAttribute("aria-busy"), null);
  assert.equal(h.links[0].getAttribute("aria-disabled"), "false");
  h.installed.dispose();
});

test("cross-origin, queried and unknown hrefs never cause a fetch", async () => {
  const h = harness(() => { throw Error("Fetch must not run"); }, [
    "https://other.test/analysis-synthetic-input.json", "./analysis-synthetic-input.json?patient=123", "./analysis-synthetic-input.json#fragment", "./patient-export.json", "data:application/json,{}",
  ]);
  for (const link of h.links) await link.click();
  assert.equal(h.calls.length, 0); assert.equal(h.clicks.length, 0);
  assert.equal(h.status.textContent, "The synthetic file could not be downloaded. Try again.");
  h.installed.dispose();
  const foreignModule = harness(() => { throw Error("Fetch must not run"); }, ["https://cdn.test/analysis-synthetic-input.json"], { options: { moduleUrl: "https://cdn.test/synthetic-downloads.mjs" } });
  await foreignModule.links[0].click();
  assert.equal(foreignModule.calls.length, 0); foreignModule.installed.dispose();
});

test("HTTP, redirected, network and body-read errors produce current-language status without a file", async () => {
  for (const makeResponse of [
    () => Promise.resolve({ ok: false, status: 404, arrayBuffer() { throw Error("Must not read an error body"); } }),
    () => Promise.resolve({ ok: true, status: 206, arrayBuffer() { throw Error("Must not read partial data"); } }),
    () => Promise.resolve({ ...response([1]), redirected: true }),
    () => Promise.resolve(response([1], "https://other.test/analysis-synthetic-input.json")),
    () => Promise.reject(Error("Private network diagnostics must not be displayed")),
    () => Promise.resolve({ ...response([1]), arrayBuffer: () => Promise.reject(Error("Body failed")) }),
  ]) {
    const h = harness(makeResponse); h.language("tr");
    await h.links[0].click();
    assert.equal(h.status.textContent, "Sentetik dosya indirilemedi. Yeniden deneyin.");
    assert.equal(h.links[0].getAttribute("aria-busy"), null);
    assert.equal(h.urls.length, 0); assert.equal(h.clicks.length, 0);
    h.installed.dispose();
  }
});

test("browser click failure removes the temporary anchor and immediately revokes its URL", async () => {
  const h = harness(async () => response([1, 2]), undefined, { clickThrows: true });
  await h.links[0].click();
  assert.equal(h.anchors[0].removed, true);
  assert.deepEqual(h.revoked, [h.urls[0].url]);
  assert.equal(h.timers.size, 0);
  assert.equal(h.status.textContent, "The synthetic file could not be downloaded. Try again.");
  h.installed.dispose(); assert.equal(h.revoked.length, 1);
});

test("disposal aborts an active request and an eventual stale result cannot create a download", async () => {
  const pending = deferred(), h = harness(() => pending.promise), job = h.links[0].click();
  h.installed.dispose();
  assert.equal(h.calls[0].options.signal.aborted, true);
  assert.equal(h.links[0].getAttribute("aria-busy"), null);
  const status = h.status.textContent;
  pending.resolve(response([1, 2])); await job;
  assert.equal(h.status.textContent, status);
  assert.equal(h.urls.length, 0); assert.equal(h.clicks.length, 0);
  assert.equal(h.links[0].handlers.size, 0);
});

test("installation is idempotent and a late older failure cannot replace the latest request status", async () => {
  const pending = deferred(), h = harness((url) => url.includes("-input.") ? pending.promise : Promise.resolve(response([1])));
  const duplicate = installSyntheticDownloads(h.options);
  assert.equal(duplicate.installedCount, 0);
  const old = h.links[0].click();
  await h.links[1].click();
  const latest = h.status.textContent;
  pending.reject(Error("Old download failed")); await old;
  assert.equal(h.status.textContent, latest); assert.equal(h.calls.length, 2);
  h.installed.dispose();
  assert.equal(h.timers.size, 0); assert.equal(h.revoked.length, 1);
  const reinstalled = installSyntheticDownloads(h.options);
  assert.equal(reinstalled.installedCount, 2);
  reinstalled.dispose(); duplicate.dispose();
});
