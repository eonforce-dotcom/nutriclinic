import { getLocale } from "./i18n.mjs";

const FILENAMES = Object.freeze([
  "analysis-synthetic-input.json",
  "analysis-synthetic-report.json",
]);
const attached = new WeakMap();
const messages = {
  reading: { en: "Preparing the synthetic JSON download…", tr: "Sentetik JSON indirmesi hazırlanıyor…" },
  requested: { en: "Synthetic file download requested.", tr: "Sentetik dosya için indirme isteği gönderildi." },
  failed: { en: "The synthetic file could not be downloaded. Try again.", tr: "Sentetik dosya indirilemedi. Yeniden deneyin." },
};

/** Static synthetic files only. Dependencies are injectable for handler tests. */
export function installSyntheticDownloads(options = {}) {
  const doc = options.document ?? globalThis.document;
  if (!doc) return { installedCount: 0, dispose() {} };
  const fetchFile = options.fetch ?? globalThis.fetch?.bind(globalThis);
  const BlobClass = options.Blob ?? globalThis.Blob;
  const objectUrls = options.objectUrls ?? globalThis.URL;
  const schedule = options.setTimeout ?? globalThis.setTimeout;
  const cancel = options.clearTimeout ?? globalThis.clearTimeout;
  const locale = options.getLocale ?? getLocale;
  const AbortClass = options.AbortController ?? globalThis.AbortController;
  const moduleUrl = new URL(options.moduleUrl ?? import.meta.url);
  const pageUrl = new URL(options.pageUrl ?? doc.baseURI ?? globalThis.location?.href ?? moduleUrl.href);
  const assets = FILENAMES.map((filename) => ({ filename, url: new URL(filename, moduleUrl) }));
  const bindings = [];
  let statusGeneration = 0;
  const status = (kind, generation) => {
    if (generation !== statusGeneration) return;
    const target = doc.getElementById("researchStatus");
    if (target) target.textContent = messages[kind][locale() === "tr" ? "tr" : "en"];
  };
  const restore = (link, name, value) => value === null ? link.removeAttribute(name) : link.setAttribute(name, value);

  for (const link of doc.querySelectorAll("a[data-synthetic-download]")) {
    if (attached.has(link)) continue;
    const binding = { link, busy: false, disposed: false, controller: null, urls: new Map(), previous: null };
    const release = (url) => {
      if (!binding.urls.has(url)) return;
      const timer = binding.urls.get(url);
      binding.urls.delete(url);
      if (timer !== null) cancel(timer);
      try { objectUrls.revokeObjectURL(url); } catch { /* Cleanup cannot change download status. */ }
    };
    const handler = async (event) => {
      event.preventDefault();
      if (binding.busy || binding.disposed) return;
      binding.busy = true;
      const generation = ++statusGeneration;
      binding.previous = { busy: link.getAttribute("aria-busy"), disabled: link.getAttribute("aria-disabled") };
      link.setAttribute("aria-busy", "true");
      link.setAttribute("aria-disabled", "true");
      status("reading", generation);
      let anchor = null, url = null, clicked = false;
      try {
        const href = new URL(link.getAttribute("href"), doc.baseURI ?? pageUrl.href);
        const asset = assets.find((item) => item.url.href === href.href);
        if (!asset || !["https:", "http:"].includes(pageUrl.protocol) || asset.url.origin !== pageUrl.origin)
          throw Error("Unsupported synthetic asset.");
        binding.controller = AbortClass ? new AbortClass() : null;
        const response = await fetchFile(asset.url.href, {
          method: "GET", mode: "same-origin", credentials: "same-origin", redirect: "error", cache: "no-store",
          ...(binding.controller ? { signal: binding.controller.signal } : {}),
        });
        if (binding.disposed) return;
        if (!response.ok || response.status !== 200 || response.redirected || (response.url && new URL(response.url).href !== asset.url.href))
          throw Error("Synthetic asset response was not successful.");
        const bytes = await response.arrayBuffer();
        if (binding.disposed) return;
        // No JSON parsing, text decoding or serialization: retain the source bytes.
        const blob = new BlobClass([bytes], { type: "application/octet-stream" });
        url = objectUrls.createObjectURL(blob);
        binding.urls.set(url, null);
        anchor = doc.createElement("a");
        anchor.href = url;
        anchor.download = asset.filename;
        anchor.hidden = true;
        doc.body.appendChild(anchor);
        anchor.click();
        clicked = true;
        status("requested", generation);
      } catch {
        if (!binding.disposed) status("failed", generation);
      } finally {
        anchor?.remove();
        if (url) {
          if (clicked && !binding.disposed) binding.urls.set(url, schedule(() => release(url), 1000));
          else release(url);
        }
        binding.controller = null;
        binding.busy = false;
        if (!binding.disposed && binding.previous) {
          restore(link, "aria-busy", binding.previous.busy);
          restore(link, "aria-disabled", binding.previous.disabled);
          binding.previous = null;
        }
      }
    };
    binding.handler = handler;
    binding.release = release;
    link.addEventListener("click", handler);
    attached.set(link, binding);
    bindings.push(binding);
  }
  return {
    installedCount: bindings.length,
    dispose() {
      statusGeneration++;
      for (const binding of bindings) {
        if (binding.disposed) continue;
        binding.disposed = true;
        binding.controller?.abort();
        binding.link.removeEventListener("click", binding.handler);
        if (binding.previous) {
          restore(binding.link, "aria-busy", binding.previous.busy);
          restore(binding.link, "aria-disabled", binding.previous.disabled);
        }
        for (const url of [...binding.urls.keys()]) binding.release(url);
        attached.delete(binding.link);
      }
    },
  };
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => installSyntheticDownloads(), { once: true });
  else installSyntheticDownloads();
}
