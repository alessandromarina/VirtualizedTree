import { spawnSync } from "node:child_process";
import { rmSync } from "node:fs";

import { build } from "esbuild";

const outdir = ".test-build";

rmSync(outdir, { recursive: true, force: true });

try {
  await build({
    entryPoints: ["test/skins.test.tsx", "test/tree.test.tsx"],
    outdir,
    bundle: true,
    platform: "browser",
    format: "esm",
    target: "es2022",
    jsx: "automatic",
    sourcemap: "inline",
    external: ["jsdom", "node:*"],
    loader: { ".css": "local-css" },
    logLevel: "warning",
  });

  const result = spawnSync(
    process.execPath,
    ["--test", "--test-timeout=15000", "--test-force-exit", `${outdir}/*.test.js`],
    { stdio: "inherit" }
  );
  process.exit(result.status ?? 1);
} finally {
  rmSync(outdir, { recursive: true, force: true });
}
