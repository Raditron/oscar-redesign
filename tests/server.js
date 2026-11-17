// Tiny static file server for local preview and the Playwright tests. Zero dependencies.
// Serves the site folder, so the pages answer at the same paths as on the real host:
//   /index.html  /en/index.html  /mainmenu/index.html  /en/mainmenu/index.html
// A directory URL ("/", "/en/") serves its index.html, like the host does. Missing files are a plain 404.
// Usage: node tests/server.js [port]   (default 4173, or $PORT)
// The folder is the repo root, or $SITE_ROOT when set (e.g. SITE_ROOT=dist/oscarclubsofia.com serves the package).
// The tests also use createServer(root) to serve other folders (the package, a copy of the old site).
'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const REPO = path.resolve(__dirname, '..');
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.gif': 'image/gif', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.woff': 'font/woff',
  '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml', '.webmanifest': 'application/manifest+json'
};

/** The folder the CLI serves: $SITE_ROOT (relative to the repo root) or the repo root itself. */
const siteRoot = () => path.resolve(REPO, process.env.SITE_ROOT || '.');

/** An http.Server (not yet listening) that serves `root` the way the host does. */
function createServer(root) {
  const ROOT = path.resolve(root);
  return http.createServer((req, res) => {
    let rel;
    try { rel = decodeURIComponent(new URL(req.url, 'http://x').pathname); } catch { rel = '/'; }
    let file = path.join(ROOT, path.normalize(rel));
    if (!file.startsWith(ROOT)) { res.writeHead(403).end('Forbidden'); return; }
    if (rel.endsWith('/')) file = path.join(file, 'index.html');
    fs.stat(file, (err, st) => {
      if (err || !st.isFile()) { res.writeHead(404, { 'Content-Type': 'text/plain' }).end('Not found'); return; }
      res.writeHead(200, { 'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      fs.createReadStream(file).pipe(res);
    });
  });
}

/** Serve `root` on a free port. Resolves to { url, close() }. */
function serve(root) {
  const server = createServer(root);
  return new Promise((ok, fail) => {
    server.once('error', fail);
    server.listen(0, '127.0.0.1', () => ok({
      url: `http://127.0.0.1:${server.address().port}`,
      close: () => new Promise(done => server.close(() => done()))
    }));
  });
}

module.exports = { createServer, serve, siteRoot };

if (require.main === module) {
  const ROOT = siteRoot();
  const PORT = Number(process.argv[2] || process.env.PORT || 4173);
  if (!fs.existsSync(path.join(ROOT, 'index.html'))) { console.error(`No index.html in ${ROOT}`); process.exit(1); }
  createServer(ROOT).listen(PORT, () => console.log(`Serving ${ROOT} at http://localhost:${PORT}/`));
}
