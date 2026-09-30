#!/usr/bin/env node
// Screenshot a page (or one element) and report anything that went wrong.
//
// Usage:
//   npm run shot                          -> screenshots/shot.png of $BASE_URL
//   npm run shot -- /pricing              -> path relative to $BASE_URL
//   npm run shot -- http://localhost:5173 out/foo.png
//   npm run shot -- --full                -> full-page capture
//   npm run shot -- --selector "#season"  -> just that element
//   npm run shot -- --out out/foo.png     -> where to write (default screenshots/shot.png)
//   npm run shot -- --w 390 --h 844       -> mobile viewport
//   npm run shot -- --dark                -> prefers-color-scheme: dark
//   npm run shot -- --print               -> print stylesheet (no score ink, menus hidden)
//
// Env: BASE_URL (default http://localhost:5173), DPR (device scale factor)

import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const opts = { full: false, selector: null, w: 1280, h: 900, wait: 300, dark: false, out: null, print: false };
const positional = [];

const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) {
  const arg = argv[i];
  const value = () => {
    const v = argv[++i];
    if (v === undefined) throw new Error(`${arg} needs a value`);
    return v;
  };
  if (arg === "--full") opts.full = true;
  else if (arg === "--dark") opts.dark = true;
  else if (arg === "--print") opts.print = true;
  else if (arg === "--selector") opts.selector = value();
  else if (arg === "--out") opts.out = value();
  else if (arg === "--w") opts.w = Number(value());
  else if (arg === "--h") opts.h = Number(value());
  else if (arg === "--wait") opts.wait = Number(value());
  else if (arg.startsWith("-")) throw new Error(`unknown option: ${arg}`);
  else positional.push(arg);
}

const base = process.env.BASE_URL ?? "http://localhost:5173";
let url = positional[0] ?? base;
if (!/^[a-z]+:\/\//i.test(url)) url = new URL(url, base).href;

const out = path.resolve(opts.out ?? positional[1] ?? "screenshots/shot.png");
fs.mkdirSync(path.dirname(out), { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: opts.w, height: opts.h },
  deviceScaleFactor: Number(process.env.DPR ?? 1),
  colorScheme: opts.dark ? "dark" : "light",
});
const page = await context.newPage();
if (opts.print) await page.emulateMedia({ media: "print" });

const problems = new Set();
page.on("console", (m) => m.type() === "error" && problems.add(`console: ${m.text()}`));
page.on("pageerror", (e) => problems.add(`pageerror: ${e.message}`));
page.on("requestfailed", (r) => problems.add(`request failed: ${r.url()} (${r.failure()?.errorText})`));
page.on("response", (r) => r.status() >= 400 && problems.add(`http ${r.status()}: ${r.url()}`));

try {
  await page.goto(url, { waitUntil: "load", timeout: 15_000 });
  await page.evaluate(() => document.fonts.ready);
  if (opts.wait) await page.waitForTimeout(opts.wait);

  if (opts.selector) await page.locator(opts.selector).first().screenshot({ path: out });
  else await page.screenshot({ path: out, fullPage: opts.full });

  const kb = (fs.statSync(out).size / 1024).toFixed(0);
  console.log(`${await page.title()} — ${url}`);
  console.log(
    `${opts.w}x${opts.h}${opts.full ? " full-page" : ""}${opts.selector ? ` ${opts.selector}` : ""}` +
      `${opts.dark ? " dark" : ""}${opts.print ? " print" : ""} -> ${path.relative(process.cwd(), out)} (${kb} KB)`,
  );
} catch (err) {
  console.error(`failed: ${err.message.split("\n")[0]}`);
  process.exitCode = 1;
} finally {
  await browser.close();
}

if (problems.size) {
  console.error("\npage problems:");
  for (const p of problems) console.error(`  ${p}`);
  process.exitCode = 1;
}
