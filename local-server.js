import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import handler from "./api/analyze.js";

const root = fileURLToPath(new URL(".", import.meta.url));
const port = Number(process.env.PORT || 4173);

async function loadEnv() {
  const envPath = join(root, ".env");
  if (!existsSync(envPath)) return;

  const raw = await readFile(envPath, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!match || process.env[match[1]]) continue;
    process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
  }
}

function sendJson(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
}

function wrapResponse(res) {
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (body) => sendJson(res, res.statusCode || 200, body);
  return res;
}

const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
};

await loadEnv();

createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);

    if (url.pathname === "/api/analyze") {
      await handler(req, wrapResponse(res));
      return;
    }

    const pathname = url.pathname === "/" ? "/index.html" : url.pathname;
    const target = normalize(join(root, pathname));
    if (!target.startsWith(root)) {
      res.writeHead(403).end("Forbidden");
      return;
    }

    const data = await readFile(target);
    res.writeHead(200, {
      "Content-Type": mime[extname(target)] || "application/octet-stream",
      "Cache-Control": "no-store",
    });
    res.end(data);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found");
  }
}).listen(port, () => {
  console.log(`EcoChic demo running at http://localhost:${port}`);
});
