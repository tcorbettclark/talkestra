// Measure the alignment of the #season event rows.
//
// Ported from the throwaway /tmp/pw/measure.js: converted to ESM (this package
// is "type": "module") and no longer writes outside the repo.
//
// Usage: npm run measure            (expects the dev server on $BASE_URL)
//        BASE_URL=http://localhost:5173 npm run measure

import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:5173";
const OUT = path.resolve("screenshots/season.png");

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
await page.goto(BASE_URL, { waitUntil: "load" });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(300);

const data = await page.evaluate(() => {
  const px = (n) => Math.round(n * 10) / 10;
  return [...document.querySelectorAll(".event")].map((r) => {
    const date = r.querySelector(".event-date");
    const time = r.querySelector("time");
    const title = r.querySelector(".event-title");
    const cs = getComputedStyle(date);
    const tRect = time.getBoundingClientRect();
    return {
      date: time.textContent.trim(),
      rowLeft: px(r.getBoundingClientRect().left),
      dateBoxLeft: px(date.getBoundingClientRect().left),
      timeTextLeft: px(tRect.left),
      titleLeft: px(title.getBoundingClientRect().left),
      timeWidth: px(tRect.width),
      timeHeight: px(tRect.height),
      lineHeight: cs.lineHeight,
      wrapped: tRect.height > parseFloat(cs.lineHeight) * 1.5,
      datePadLeft: cs.paddingLeft,
      rowPadLeft: getComputedStyle(r).paddingLeft,
    };
  });
});

console.log("date                     timeTextLeft  titleLeft  timeW    wrapped");
for (const d of data) {
  console.log(
    `${d.date.padEnd(24)} ${String(d.timeTextLeft).padStart(11)}  ${String(d.titleLeft).padStart(9)}  ${String(d.timeWidth).padStart(6)}   ${d.wrapped}`,
  );
}
const titleLefts = [...new Set(data.map((d) => d.titleLeft))];
console.log("\nunique titleLeft values:", titleLefts, titleLefts.length === 1 ? "=> ALIGNED" : "=> MISALIGNED");
const wrapped = data.filter((d) => d.wrapped).length;
console.log("dates wrapping:", wrapped, wrapped === 0 ? "=> none wrap" : "=> SOME WRAP");
console.log("date column width (dateBox left to title left):", data[0].titleLeft - data[0].dateBoxLeft);

fs.mkdirSync(path.dirname(OUT), { recursive: true });
await page.locator("#season").screenshot({ path: OUT });
console.log(`\nscreenshot -> ${OUT}`);
await browser.close();
