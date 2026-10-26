import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import console from "node:console";
import process from "node:process";
import { fileURLToPath, URL } from "node:url";

const project = process.argv[2] ?? "aca2323a-9450-40b3-ab92-6ad21f4d77ff";
const ts = process.env.TS_CLI ?? "testsprite";
const shell = process.platform === "win32";
const dir = fileURLToPath(new URL("./site-suite/", import.meta.url));

function cli(args) {
  return JSON.parse(execFileSync(ts, [...args, "--output", "json"], { shell, encoding: "utf8", maxBuffer: 64 << 20 }));
}

function slug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

mkdirSync(dir, { recursive: true });
for (const f of readdirSync(dir)) if (f.endsWith(".json")) rmSync(join(dir, f));

const tests = cli(["test", "list", "--project", project, "--page-size", "100", "--max-items", "500"]).items;
for (const t of tests) {
  const full = cli(["test", "get", t.id]);
  const plan = {
    testId: full.id,
    projectId: full.projectId,
    name: full.name,
    type: full.type,
    priority: full.priority,
    createdFrom: full.createdFrom,
    planSteps: full.planSteps.map(({ type, description }) => ({ type, description })),
  };
  writeFileSync(join(dir, `${slug(full.name)}.json`), `${JSON.stringify(plan, null, 2)}\n`);
}
console.log(`${tests.length} plans written to ${dir}`);
