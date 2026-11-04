#!/usr/bin/env node
/** Explicit offline CLI; no browser imports, network access or clinical engine. */
import { readFile, writeFile, realpath, stat } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { analyzeSyntheticAgreement } from "./agreement.mjs";

const usage = "Usage: node analysis/run.mjs --input <synthetic.json> [--output <report.json>]\nOnly explicitly synthetic computational fixtures are accepted; no clinical validation or clinical-pass conclusion.\n";
const analysisFiles = ["analysis/agreement.mjs", "analysis/run.mjs"];
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const root = dirname(dirname(fileURLToPath(import.meta.url)));
const samePath = (a, b) => process.platform === "win32" ? a.toLowerCase() === b.toLowerCase() : a === b;
const argumentError = (message) => Object.assign(Error(message), { exitCode: 2 });

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 1 && ["--help", "-h"].includes(args[0])) { process.stdout.write(usage); return; }
  const options = {};
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i], value = args[i + 1];
    if (!["--input", "--output"].includes(key) || !value || value.startsWith("--") || options[key])
      throw argumentError("Specify --input and optional --output once each; unknown arguments are refused.");
    options[key] = value;
  }
  if (!options["--input"]) throw argumentError("An explicit --input path is required.");
  const inputPath = await realpath(resolve(options["--input"]));
  let outputPath = null;
  if (options["--output"]) {
    const requested = resolve(options["--output"]);
    try { outputPath = await realpath(requested); }
    catch (err) {
      if (err.code !== "ENOENT") throw err;
      outputPath = resolve(await realpath(dirname(requested)), basename(requested));
    }
    if (samePath(inputPath, outputPath)) throw argumentError("Output must not overwrite the input fixture.");
    const inputStat = await stat(inputPath);
    try {
      const outputStat = await stat(outputPath);
      if (inputStat.dev === outputStat.dev && inputStat.ino === outputStat.ino)
        throw argumentError("Output must not overwrite a hard-linked input fixture.");
    } catch (err) { if (err.code !== "ENOENT") throw err; }
    for (const path of analysisFiles) if (samePath(await realpath(resolve(root, path)), outputPath))
      throw argumentError("Output must not overwrite the analysis implementation.");
  }
  const bytes = await readFile(inputPath);
  let input;
  try { input = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)); }
  catch { throw argumentError("Input must be valid UTF-8 JSON using the explicit synthetic schema."); }
  const report = analyzeSyntheticAgreement(input);
  const contents = await Promise.all(analysisFiles.map((path) => readFile(resolve(root, path), "utf8")));
  report.provenance = {
    nodeVersion: process.version,
    inputSha256: hash(bytes), inputBytes: bytes.length,
    analysisFiles: [...analysisFiles],
    analysisFileSha256: Object.fromEntries(analysisFiles.map((path, index) => [path, hash(Buffer.from(contents[index], "utf8"))])),
    analysisSha256: hash(Buffer.from(analysisFiles.map((path, index) => path + "\n" + contents[index]).join("\n"), "utf8")),
    analysisHashAlgorithm: "SHA-256 of UTF-8 bytes: ordered analysisFiles.map(file => file + '\\n' + UTF8(file)).join('\\n'); no newline normalization",
  };
  const output = JSON.stringify(report, null, 2) + "\n";
  if (outputPath) await writeFile(outputPath, output, "utf8");
  else process.stdout.write(output);
  if (report.status === "refused") process.exitCode = 2;
}

main().catch((err) => {
  process.stderr.write(`Analysis CLI error: ${err.message}\n`);
  if (err.exitCode === 2) process.stderr.write(usage);
  process.exitCode = err.exitCode || 1;
});
