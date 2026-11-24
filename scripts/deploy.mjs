#!/usr/bin/env node
// Deploy public/ to the live host with cache-busted asset URLs.
//
// Usage:
//   npm run deploy              # typecheck, stage, rewrite, upload
//   node scripts/deploy.mjs --dry-run   # show what would be rewritten, upload nothing
//
// Why this exists: the host sends no Cache-Control, so browsers use heuristic
// freshness (10% of a file's age) and would happily reuse a stale styles.css,
// main.js or image without revalidating. Versioning the URLs here means a
// changed file always arrives under a new one, whatever any cache decides to
// do with the old copy. It needs no server configuration, so there is nothing
// that can break the site.
//
// Every local asset referenced from index.html (and from styles.css) gains
// `?v=<hash>`, the hash being the first 10 hex of the SHA-256 of the bytes
// actually served. The staged copy is rewritten; `public/` itself is left
// clean so local paths stay easy to read and edit.

import { execSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const PUBLIC = path.join(ROOT, "public");
const REMOTE = "talkestra@ssh61.interdns.co.uk";
const REMOTE_DIR = "/home/talkestra/public_html";

const dryRun = process.argv.includes("--dry-run");

const hashOf = (file) =>
  createHash("sha256").update(fs.readFileSync(file)).digest("hex").slice(0, 10);

// Add ?v=<hash> to a site-absolute URL, replacing any existing ?v=.
const versioned = (url, hash) => {
  const bare = url.replace(/\?v=[^"')]*/, "");
  return `${bare}?v=${hash}`;
};

function main() {
  if (!dryRun) {
    // Refuse to publish a tree that does not typecheck.
    execSync("npm run typecheck", { cwd: ROOT, stdio: "inherit" });
  }

  const stage = fs.mkdtempSync(path.join(os.tmpdir(), "talkestra-deploy-"));
  const rewrites = [];
  const seen = new Set();
  const note = (line, key) => {
    if (seen.has(key)) return;
    seen.add(key);
    rewrites.push(line);
  };

  try {
    fs.cpSync(PUBLIC, stage, { recursive: true });
    const staged = (rel) => path.join(stage, rel);

    // 1. styles.css: version the images it points at (backgrounds, watermarks),
    //    so a new picture never arrives under a cached URL.
    const cssPath = staged("styles.css");
    let css = fs.readFileSync(cssPath, "utf8");
    css = css.replace(/url\("\/(images\/[^"?]+)"\)/g, (match, rel) => {
      const file = staged(rel);
      if (!fs.existsSync(file)) return match; // leave broken refs visible
      const hash = hashOf(file);
      note(`${rel} -> ?v=${hash} (in styles.css)`, rel);
      return `url("/${versioned(rel, hash)}")`;
    });
    fs.writeFileSync(cssPath, css);

    // 2. Hash the *final* bytes of the files whose URLs the HTML carries. The
    //    order matters: styles.css has just changed, so hash it afterwards.
    const assetHashes = new Map();
    for (const rel of ["styles.css", "main.js"]) {
      const file = staged(rel);
      if (fs.existsSync(file)) assetHashes.set(rel, hashOf(file));
    }

    // 3. index.html: version every site-absolute asset it references.
    const htmlPath = staged("index.html");
    let html = fs.readFileSync(htmlPath, "utf8");
    html = html.replace(
      /(?:href|src)="\/((?:styles\.css|main\.js|favicon\.svg|images\/[^"?]+))"/g,
      (match, rel) => {
        const hash = assetHashes.get(rel) ?? hashOf(staged(rel));
        const url = versioned(rel, hash);
        note(`${rel} -> ?v=${hash}`, rel);
        return match.replace(`"/${rel}"`, `"/${url}"`);
      },
    );
    fs.writeFileSync(htmlPath, html);

    console.log(`\nVersioned ${rewrites.length} reference(s):`);
    for (const line of rewrites) console.log(`  ${line}`);

    if (dryRun) {
      console.log("\n--dry-run: nothing uploaded.\n");
      return;
    }

    console.log(`\nUploading to ${REMOTE}:${REMOTE_DIR} …`);
    execSync(
      `tar czf - -C ${JSON.stringify(stage)} . | ssh ${REMOTE} 'tar xzf - -C ${REMOTE_DIR}'`,
      { stdio: "inherit", env: { ...process.env, COPYFILE_DISABLE: "1" } },
    );
    console.log("\nDone. Check the headers landed:");
    console.log("  curl -sI https://www.talkestra.com/styles.css | grep -i cache-control\n");
  } finally {
    fs.rmSync(stage, { recursive: true, force: true });
  }
}

main();
