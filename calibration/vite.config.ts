import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const here = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  root: join(here, "site"),
  base: "./",
  plugins: [react()],
  build: { outDir: join(tmpdir(), "eye-chart-calibration"), emptyOutDir: true },
  server: { fs: { allow: [join(here, "..")] } },
  preview: { port: 4173, strictPort: true, host: "127.0.0.1" },
});
