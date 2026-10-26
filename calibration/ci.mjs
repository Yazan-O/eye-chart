import { execFileSync } from "node:child_process";
import { appendFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import console from "node:console";
import process from "node:process";
import { URL } from "node:url";

export const SET = ["toast/works", "hover-menu/works", "hover-menu/lens", "autocomplete/broken", "consent-scrim/broken"];
const CREDITS_PER_RUN = 0.5;
const MAX_CREDITS = 3;

const [base, outFile] = process.argv.slice(2);
const project = process.env.TESTSPRITE_CALIBRATION_PROJECT_ID;
const minCredits = Number(process.env.CALIBRATION_MIN_CREDITS ?? "8");
if (!base || !outFile || !project) {
  console.error("usage: TESTSPRITE_CALIBRATION_PROJECT_ID=<id> node calibration/ci.mjs <preview base url> <out.json>");
  process.exit(2);
}
if (SET.length * CREDITS_PER_RUN > MAX_CREDITS) throw new Error(`set costs more than ${MAX_CREDITS} credits`);

const ts = process.env.TS_CLI ?? "testsprite";
const shell = process.platform === "win32";
const root = base.endsWith("/") ? base : `${base}/`;
const work = mkdtempSync(join(tmpdir(), "eye-chart-ci-"));
const summaryFile = process.env.GITHUB_STEP_SUMMARY;
const commentFile = process.env.REEXAM_COMMENT_FILE;

function q(a) {
  return shell && /[\s"]/.test(a) ? `"${a}"` : a;
}

function cli(args, { allowFail = false } = {}) {
  try {
    return JSON.parse(execFileSync(ts, [...args.map(q), "--output", "json"], { shell, encoding: "utf8", maxBuffer: 64 << 20 }));
  } catch (err) {
    if (allowFail) return err.stdout ? JSON.parse(err.stdout) : null;
    throw err;
  }
}

function summary(text) {
  if (summaryFile) appendFileSync(summaryFile, `${text}\n`);
  if (commentFile) appendFileSync(commentFile, `${text}\n`);
  console.log(text);
}

const spec = JSON.parse(readFileSync(new URL("./tests.json", import.meta.url), "utf8"));
const wanted = SET.map((key) => {
  const [id, variant] = key.split("/");
  const letter = spec.letters.find((l) => l.id === id);
  if (!letter) throw new Error(`no spec for ${id}`);
  const name = `ci ${key}: ${letter.name}`;
  const planSteps = [
    { type: "action", description: `Go to ${root}#/l/${id}/${variant}` },
    ...letter.steps.map(([type, description]) => ({ type, description })),
  ];
  return { key, id, variant, name, planSteps, truth: variant === "broken" ? "fail" : "pass" };
});

const before = cli(["usage"]).credits;
if (before < minCredits) {
  summary(`## Re-examination skipped\n\nCredits left: ${before}, below the floor of ${minCredits}. No run was started.`);
  writeFileSync(outFile, JSON.stringify({ skipped: true, credits: before, minCredits }, null, 2));
  process.exit(0);
}

const existing = cli(["test", "list", "--project", project, "--page-size", "100", "--max-items", "500"]).items;
const missing = [];
for (const w of wanted) {
  const found = existing.find((t) => t.name === w.name);
  if (found) {
    w.testId = found.id;
    const file = join(work, `${w.id}--${w.variant}.steps.json`);
    writeFileSync(file, JSON.stringify({ planSteps: w.planSteps }));
    cli(["test", "plan", "put", w.testId, "--steps", file, "--force"]);
  } else {
    missing.push(w);
  }
}
if (missing.length) {
  const dir = join(work, "plans");
  mkdirSync(dir);
  missing.forEach((w, i) =>
    writeFileSync(
      join(dir, `${String(i).padStart(2, "0")}.json`),
      JSON.stringify({ projectId: project, type: "frontend", name: w.name, planSteps: w.planSteps }),
    ),
  );
  const created = cli(["test", "create-batch", "--plan-from-dir", dir]).results;
  for (const r of created) {
    if (r.status !== "created") throw new Error(`create failed: ${JSON.stringify(r)}`);
    missing[r.specIndex].testId = r.testId;
  }
}

const runs = [];
for (const w of wanted) {
  const runSummary = join(work, `summary-${w.id}-${w.variant}.json`);
  try {
    cli(["test", "run", w.testId, "--target-url", root, "--wait", "--timeout", "900", "--summary-file", runSummary], {
      allowFail: true,
    });
  } catch (err) {
    console.error(`run failed for ${w.key}: ${err.stderr ?? err.message}`);
  }
  if (existsSync(runSummary)) runs.push(...JSON.parse(readFileSync(runSummary, "utf8")).runs);
}

const results = wanted.map((w) => {
  const run = runs.find((r) => r.testId === w.testId);
  if (!run) return { ...w, verdict: "not run", runId: null, reason: "no run recorded" };
  const verdict = run.status;
  let reason;
  try {
    if (verdict === "passed") {
      const steps = cli(["test", "steps", w.testId, "--run-id", run.runId, "--page-size", "100"]).items;
      reason = [...steps].reverse().find((s) => s.stepType === "assertion")?.description ?? "";
    } else {
      const dir = join(work, "bundles", run.runId);
      mkdirSync(join(dir, ".."), { recursive: true });
      execFileSync(ts, ["test", "artifact", "get", run.runId, "--out", q(dir)], { shell, stdio: "ignore" });
      reason = JSON.parse(readFileSync(join(dir, "failure.json"), "utf8")).rootCauseHypothesis ?? "";
    }
  } catch (err) {
    reason = `reason not fetched: ${err.message.split("\n")[0]}`;
  }
  return { ...w, verdict, runId: run.runId, reason };
});

const after = cli(["usage"]).credits;
const right = (r) =>
  r.verdict === "blocked" || r.verdict === "not run"
    ? r.verdict
    : (r.truth === "pass") === (r.verdict === "passed")
      ? "right"
      : "wrong";

const report = {
  takenAt: new Date().toISOString(),
  target: root,
  commit: process.env.GITHUB_SHA ?? null,
  projectId: project,
  creditsBefore: before,
  creditsAfter: after,
  results: results.map(({ id, variant, truth, verdict, testId, runId, reason }) => ({
    letterId: id,
    variant,
    truth,
    verdict,
    testId,
    runId,
    reason,
  })),
};
writeFileSync(outFile, `${JSON.stringify(report, null, 2)}\n`);

summary(`## TestSprite re-examination\n\nTarget: ${root}\n\n| Twin | Truth | Verdict | Read |\n|---|---|---|---|`);
for (const r of results) summary(`| ${r.key} | ${r.truth} | ${r.verdict} | ${right(r)} |`);
summary(`\nCredits: ${before} before, ${after} after (${(before - after).toFixed(1)} used). A misread never fails this job.`);
