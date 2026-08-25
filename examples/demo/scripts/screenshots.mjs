import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join } from "node:path";

import { chromium } from "playwright";

const dist = new URL("../dist/", import.meta.url).pathname;
const docs = new URL("../../../docs/", import.meta.url).pathname;
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css" };
const port = 4173;

spawnSync("npx", ["vite", "build"], { stdio: "inherit", cwd: new URL("..", import.meta.url).pathname });

const server = createServer(async (req, res) => {
  const path = req.url === "/" ? "/index.html" : (req.url ?? "/").split("?")[0];
  try {
    const body = await readFile(join(dist, path));
    res.writeHead(200, { "content-type": types[extname(path)] ?? "application/octet-stream" });
    res.end(body);
  } catch {
    res.writeHead(404).end();
  }
});
await new Promise((resolve) => server.listen(port, resolve));

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1760, height: 820 }, deviceScaleFactor: 2 });
const problems = [];
page.on("pageerror", (error) => problems.push(error.message));
page.on("console", (message) => message.type() === "error" && problems.push(message.text()));

await page.goto(`http://localhost:${port}/`, { waitUntil: "networkidle" });
await page.waitForSelector('[role="treeitem"]');

const rows = page.locator('[aria-label="vanilla tree"] [role="treeitem"]');
await rows.nth(2).click();
await rows.nth(5).click({ modifiers: ["Control"] });
await rows.nth(8).click({ modifiers: ["Control"] });
await page.locator('[aria-label="vanilla tree"]').press("ArrowDown");
await page.locator('[aria-label="vanilla tree"]').press("ArrowDown");

await page.screenshot({ path: join(docs, "five-skins.png") });
await page
  .locator("section")
  .first()
  .screenshot({ path: join(docs, "vanilla-detail.png") });

const mounted = await page.locator('[role="treeitem"]').count();
const trees = await page.locator('[role="tree"]').count();
console.log(`${trees} trees, ${mounted} rows mounted in total`);

await browser.close();
server.close();

if (problems.length > 0) {
  console.error("the page logged problems:", problems);
  process.exit(1);
}
