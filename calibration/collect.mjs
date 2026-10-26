import { execFileSync } from "node:child_process";
import { Buffer } from "node:buffer";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import console from "node:console";
import process from "node:process";
import { URL, fileURLToPath } from "node:url";

const [mapFile, runsFile, projectId, commit, cliVersion] = process.argv.slice(2);
if (!mapFile || !runsFile || !projectId || !commit || !cliVersion) {
  console.error("usage: node calibration/collect.mjs <map.json> <runs.json> <projectId> <commit> <cliVersion>");
  process.exit(2);
}

const ts = process.env.TS_CLI ?? "testsprite";
const repo = new URL("..", import.meta.url);
const shotsDir = new URL("public/readings/shots/", repo);
mkdirSync(shotsDir, { recursive: true });

function cli(args) {
  const out = execFileSync(ts, [...args, "--output", "json"], { shell: true, encoding: "utf8", maxBuffer: 64 << 20 });
  return JSON.parse(out);
}

function quote(a) {
  return /[\s"]/.test(a) ? `"${a}"` : a;
}

const tests = JSON.parse(readFileSync(mapFile, "utf8"));
const runs = JSON.parse(readFileSync(runsFile, "utf8"));
const byTest = new Map(runs.map((r) => [r.testId, r]));

const results = [];
for (const t of tests) {
  const [letterId, variant] = t.file.replace(/\.json$/, "").split("--");
  const run = byTest.get(t.testId);
  if (!run) throw new Error(`no run recorded for ${t.file} (${t.testId})`);
  const runId = run.runId;
  const steps = cli(["test", "steps", t.testId, "--run-id", runId, "--page-size", "100"]).items;
  const latest = cli(["test", "result", t.testId, "--include-analysis"]);
  if (latest.runIdIfAvailable !== runId) throw new Error(`latest result for ${t.file} is ${latest.runIdIfAvailable}, expected ${runId}`);
  const dir = join(tmpdir(), "eye-chart-bundles", runId);
  let failure = null;
  if (run.status !== "passed") {
    mkdirSync(join(dir, ".."), { recursive: true });
    if (!existsSync(join(dir, "meta.json"))) {
      execFileSync(ts, ["test", "artifact", "get", runId, "--out", quote(dir)], { shell: true, stdio: "ignore" });
    }
    failure = JSON.parse(readFileSync(join(dir, "failure.json"), "utf8"));
  }
  const failedStep = steps.find((s) => s.status === "failed");
  const lastAssertion = [...steps].reverse().find((s) => s.stepType === "assertion");
  const reason =
    latest.analysis?.rootCauseHypothesis ??
    failure?.rootCauseHypothesis ??
    failedStep?.error ??
    lastAssertion?.description ??
    latest.summary;

  let video = existsSync(dir) ? readdirSync(dir).find((f) => f.startsWith("video.")) : undefined;
  if (video) video = join(dir, video);
  else if (latest.videoUrl) {
    mkdirSync(dir, { recursive: true });
    video = join(dir, "video.webm");
    const res = await globalThis.fetch(latest.videoUrl);
    if (!res.ok) throw new Error(`video download ${res.status} for ${runId}`);
    writeFileSync(video, Buffer.from(await res.arrayBuffer()));
  }
  let screenshot = null;
  if (video) {
    const png = fileURLToPath(new URL(`${runId}.png`, shotsDir));
    execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-sseof", "-0.3", "-i", video, "-frames:v", "1", "-vf", "scale=960:-2", png]);
    screenshot = `readings/shots/${runId}.png`;
  }

  results.push({
    letterId,
    variant,
    truth: variant.endsWith("broken") ? "fail" : "pass",
    verdict: run.status,
    testId: t.testId,
    runId,
    reason,
    screenshot,
  });
}

const order = JSON.parse(readFileSync(new URL("./tests.json", import.meta.url), "utf8")).letters.map((l) => l.id);
const variants = ["works", "broken", "lens", "lens-broken"];
const rank = (r) => order.indexOf(r.letterId) * 4 + variants.indexOf(r.variant);

const takenAt = runs.map((r) => r.finishedAt).filter(Boolean).sort().at(-1) ?? new Date().toISOString();
const head = { takenAt, commit, engine: `TestSprite cloud agent, CLI ${cliVersion}`, projectId };
const dir = new URL("public/readings/", repo);
const latestFile = new URL("latest.json", dir);
const fresh = new Set(results.map((r) => `${r.letterId}/${r.variant}`));
const kept = existsSync(latestFile)
  ? JSON.parse(readFileSync(latestFile, "utf8")).results.filter((r) => !fresh.has(`${r.letterId}/${r.variant}`))
  : [];
const merged = [...kept, ...results].sort((a, b) => rank(a) - rank(b));
results.sort((a, b) => rank(a) - rank(b));

let dated = new URL(`${takenAt.slice(0, 10)}.json`, dir);
for (let n = 2; existsSync(dated); n++) dated = new URL(`${takenAt.slice(0, 10)}-${n}.json`, dir);
writeFileSync(dated, `${JSON.stringify({ ...head, results }, null, 2)}\n`);
writeFileSync(latestFile, `${JSON.stringify({ ...head, results: merged }, null, 2)}\n`);
console.log(results.map((r) => `${r.letterId}/${r.variant} truth=${r.truth} verdict=${r.verdict}`).join("\n"));
