import http from "node:http";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 5173;
const ROOT = path.resolve(__dirname, "public");

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".map": "application/json; charset=utf-8",
};

function send(res: http.ServerResponse, status: number, body: string | Buffer, contentType?: string) {
  res.writeHead(status, { "Content-Type": contentType ?? "text/plain; charset=utf-8" });
  res.end(body);
}

function safeJoin(root: string, requested: string): string | null {
  const resolved = path.resolve(root, "." + path.normalize("/" + requested));
  if (!resolved.startsWith(root)) return null;
  return resolved;
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url ?? "/", `http://${req.headers.host}`);
  let pathname = decodeURIComponent(url.pathname);
  if (pathname === "/") pathname = "/index.html";

  const filePath = safeJoin(ROOT, pathname);
  if (!filePath) return send(res, 403, "Forbidden");

  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      // Fall back to index.html only for extension-less paths (clean routes
      // such as /season). A missing asset like /images/foo.jpg must 404, so a
      // broken link is visible instead of silently returning HTML.
      const isCleanRoute = path.extname(pathname) === "";
      if (!isCleanRoute) return send(res, 404, "Not Found");

      const indexPath = path.join(ROOT, "index.html");
      return fs.readFile(indexPath, (e, data) => {
        if (e) return send(res, 404, "Not Found");
        send(res, 200, data, MIME[".html"]);
      });
    }
    const ext = path.extname(filePath).toLowerCase();
    fs.readFile(filePath, (e, data) => {
      if (e) return send(res, 500, "Internal Server Error");
      send(res, 200, data, MIME[ext] ?? "application/octet-stream");
    });
  });
});

server.listen(PORT, () => {
  console.log(`\n  ➜  Local:   http://localhost:${PORT}/`);
  console.log(`  ➜  Serving: ${ROOT}\n`);
});