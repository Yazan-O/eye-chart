import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import console from "node:console";
import process from "node:process";
import { URL } from "node:url";

const [projectId, outDir] = process.argv.slice(2);
if (!projectId || !outDir) {
  console.error("usage: node calibration/make-plans.mjs <projectId> <outDir>");
  process.exit(2);
}

const spec = JSON.parse(readFileSync(new URL("./tests.json", import.meta.url), "utf8"));
mkdirSync(outDir, { recursive: true });

for (const letter of spec.letters) {
  for (const variant of ["works", "broken"]) {
    const url = `${spec.origin}/#/l/${letter.id}/${variant}`;
    const plan = {
      projectId,
      type: "frontend",
      name: `${letter.id}/${variant}: ${letter.name}`,
      planSteps: [
        { type: "action", description: `Go to ${url}` },
        ...letter.steps.map(([type, description]) => ({ type, description })),
      ],
    };
    writeFileSync(join(outDir, `${letter.id}--${variant}.json`), JSON.stringify(plan, null, 2));
  }
}
