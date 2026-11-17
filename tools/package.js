// Builds the upload for the client. Dev-only, zero dependencies, runs the same on Windows, macOS and Linux.
//
//   npm run package
//
// dist/ is deleted and rebuilt from scratch every run:
//   dist/oscarclubsofia.com/       exactly the files that go on the server, at the paths they have there
//   dist/README-handoff.html       the hand-off note for the client (from docs/handoff.html), NEXT TO the folder
//   dist/oscarclubsofia.com.zip    both of the above, to send in one file
//
// What ships is found by following references, not by a list: start from the four pages, follow every file they
// reference (src, href, srcset, url(), and absolute https://oscarclubsofia.com/… addresses in meta tags and
// JSON-LD), then every file those reference (the stylesheet's fonts), and so on. An image nobody references
// does not ship. The fonts' OFL licences ship next to the fonts (the licence asks for that). A reference that
// does not resolve, or that points outside the site's own files (design-system/, tests/, …), stops the build.
//
// The zip is written here with Node's zlib (deflate) and a small ZIP writer, so no zip tool is needed.
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');

const REPO = path.resolve(__dirname, '..');
const HOST = 'https://oscarclubsofia.com/';
const SITE_DIR = 'oscarclubsofia.com';
const NOTE_SRC = 'docs/handoff.html';
const NOTE_OUT = 'README-handoff.html';
const PAGES = ['index.html', 'en/index.html', 'mainmenu/index.html', 'en/mainmenu/index.html'];
// The only places a shipped file may come from. Anything else a page points at is a mistake.
const SHIPPABLE = /^(index\.html|en\/index\.html|mainmenu\/index\.html|en\/mainmenu\/index\.html|css\/[^/]+\.css|js\/[^/]+\.js|assets\/.+)$/;
// Fonts' licence files: shipped beside the fonts they cover, although no page links to them.
const LICENCE = /^OFL-.+\.txt$/;

const posix = p => p.split(path.sep).join('/');

/** The references in one file's text, as raw strings (relative or absolute), by file type. */
function referencesIn(rel, text) {
  const out = [];
  const add = v => { if (v && v.trim()) out.push(v.trim()); };
  const cssUrls = css => { for (const m of css.matchAll(/url\(\s*(['"]?)(.*?)\1\s*\)/g)) add(m[2]); for (const m of css.matchAll(/@import\s+(['"])(.*?)\1/g)) add(m[2]); };
  if (/\.html$/.test(rel)) {
    text = text.replace(/<!--[\s\S]*?-->/g, '');   // comments (owner notes) reference nothing
    const decode = s => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
    for (const m of text.matchAll(/\s(?:src|href|poster|data-src)\s*=\s*(["'])(.*?)\1/gi)) add(decode(m[2]));
    for (const m of text.matchAll(/\s(?:srcset|imagesrcset)\s*=\s*(["'])(.*?)\1/gi)) decode(m[2]).split(',').forEach(s => add(s.trim().split(/\s+/)[0]));
    // absolute addresses on the real host: og:image, JSON-LD image/logo/url, canonical, hreflang
    for (const m of text.matchAll(/https:\/\/oscarclubsofia\.com\/[^\s"'<>)\\]*/g)) add(m[0]);
    // inline styles and <style> blocks
    for (const m of text.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)) cssUrls(m[1]);
    for (const m of text.matchAll(/\sstyle\s*=\s*(["'])(.*?)\1/gi)) cssUrls(decode(m[2]));
  } else if (/\.css$/.test(rel)) {
    cssUrls(text.replace(/\/\*[\s\S]*?\*\//g, ''));
  }
  return out;
}

/**
 * The file a reference points at, as a repo-relative path, or null when it is not a file of this site
 * (another host, tel:, mailto:, data:, a same-page #anchor).
 */
function resolveReference(fromRel, ref) {
  if (/^(data|tel|mailto|javascript|sms):/i.test(ref) || ref.startsWith('#')) return null;
  let u;
  try { u = new URL(ref, HOST + fromRel); } catch { return null; }
  if (u.origin !== new URL(HOST).origin) return null;
  let p = decodeURIComponent(u.pathname).replace(/^\//, '');
  if (p === '' || p.endsWith('/')) p += 'index.html';
  return p;
}

/**
 * Follow references from the four pages. Returns { files: Map(rel → Set(referrers)), problems: [string] }.
 * `root` is the folder to read (the repo by default).
 */
function crawl(root = REPO) {
  const files = new Map();
  const problems = [];
  const queue = [];
  const take = (rel, from) => {
    if (!files.has(rel)) { files.set(rel, new Set()); queue.push(rel); }
    if (from) files.get(rel).add(from);
  };
  PAGES.forEach(p => take(p, null));
  while (queue.length) {
    const rel = queue.shift();
    const abs = path.join(root, rel);
    if (!SHIPPABLE.test(rel)) { problems.push(`${rel} is not a site file (referenced by ${[...files.get(rel)].join(', ')})`); continue; }
    if (!fs.existsSync(abs) || !fs.statSync(abs).isFile()) { problems.push(`${rel} does not exist (referenced by ${[...files.get(rel)].join(', ')})`); continue; }
    if (/\.(html|css)$/.test(rel)) {
      for (const ref of referencesIn(rel, fs.readFileSync(abs, 'utf8'))) {
        const target = resolveReference(rel, ref);
        if (target) take(target, rel);
      }
    }
  }
  // licences beside shipped fonts
  for (const dir of new Set([...files.keys()].filter(f => /\.(woff2?|ttf|otf)$/.test(f)).map(f => path.posix.dirname(f)))) {
    for (const name of fs.readdirSync(path.join(root, dir)).filter(n => LICENCE.test(n)).sort()) take(`${dir}/${name}`, null);
  }
  return { files, problems };
}

// ---- ZIP (PKZIP 2.0: deflate, UTF-8 names, no zip64 — the upload is far below 4 GB) ----
const CRC_TABLE = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc32 = buf => { let c = 0xFFFFFFFF; for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
const dosTime = d => ({ time: (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1), date: ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate() });

/** entries: [{ name: 'a/b.txt' | 'a/' (folder), data?: Buffer }] → the zip file's bytes */
function zip(entries, when = new Date()) {
  const { time, date } = dosTime(when);
  const locals = [], centrals = [];
  let offset = 0;
  for (const e of entries) {
    const name = Buffer.from(e.name, 'utf8');
    const dir = e.name.endsWith('/');
    const data = dir ? Buffer.alloc(0) : e.data;
    const deflated = dir ? data : zlib.deflateRawSync(data, { level: 9 });
    const stored = dir || deflated.length >= data.length;
    const body = stored ? data : deflated;
    const crc = dir ? 0 : crc32(data);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0); local.writeUInt16LE(20, 4); local.writeUInt16LE(0x0800, 6);
    local.writeUInt16LE(stored ? 0 : 8, 8); local.writeUInt16LE(time, 10); local.writeUInt16LE(date, 12);
    local.writeUInt32LE(crc, 14); local.writeUInt32LE(body.length, 18); local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(name.length, 26); local.writeUInt16LE(0, 28);
    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0); central.writeUInt16LE(20, 4); central.writeUInt16LE(20, 6); central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(stored ? 0 : 8, 10); central.writeUInt16LE(time, 12); central.writeUInt16LE(date, 14);
    central.writeUInt32LE(crc, 16); central.writeUInt32LE(body.length, 20); central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(name.length, 28); central.writeUInt16LE(0, 30); central.writeUInt16LE(0, 32);
    central.writeUInt16LE(0, 34); central.writeUInt16LE(0, 36); central.writeUInt32LE(dir ? 0x10 : 0, 38); central.writeUInt32LE(offset, 42);
    locals.push(local, name, body);
    centrals.push(central, name);
    offset += local.length + name.length + body.length;
  }
  const cd = Buffer.concat(centrals);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(entries.length, 8); end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(cd.length, 12); end.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, cd, end]);
}

/** A zip's entries → [{ name, data }] (folders have no data). Enough of a reader for the tests to check the zip. */
function unzip(buf) {
  let e = buf.length - 22;
  while (e >= 0 && buf.readUInt32LE(e) !== 0x06054b50) e--;
  if (e < 0) throw new Error('not a zip file');
  const count = buf.readUInt16LE(e + 10);
  let p = buf.readUInt32LE(e + 16);
  const out = [];
  for (let i = 0; i < count; i++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) throw new Error('bad central directory');
    const method = buf.readUInt16LE(p + 10), crc = buf.readUInt32LE(p + 16), size = buf.readUInt32LE(p + 20);
    const nameLen = buf.readUInt16LE(p + 28), extra = buf.readUInt16LE(p + 30), comment = buf.readUInt16LE(p + 32), at = buf.readUInt32LE(p + 42);
    const name = buf.toString('utf8', p + 46, p + 46 + nameLen);
    const start = at + 30 + buf.readUInt16LE(at + 26) + buf.readUInt16LE(at + 28);
    const body = buf.subarray(start, start + size);
    const data = name.endsWith('/') ? null : method === 8 ? zlib.inflateRawSync(body) : Buffer.from(body);
    if (data && crc32(data) !== crc) throw new Error(`${name}: CRC mismatch`);
    out.push({ name, data });
    p += 46 + nameLen + extra + comment;
  }
  return out;
}

/** Build the upload into `out` (dist/ by default). Returns { siteDir, notePath, zipPath, files }. */
function build({ out = path.join(REPO, 'dist'), log = () => {} } = {}) {
  const { files, problems } = crawl(REPO);
  if (problems.length) throw new Error(`The package cannot be built:\n  ${problems.join('\n  ')}`);
  const note = path.join(REPO, NOTE_SRC);
  if (!fs.existsSync(note)) throw new Error(`${NOTE_SRC} is missing`);

  fs.rmSync(out, { recursive: true, force: true });
  const siteDir = path.join(out, SITE_DIR);
  const list = [...files.keys()].sort();
  for (const rel of list) {
    fs.mkdirSync(path.dirname(path.join(siteDir, rel)), { recursive: true });
    fs.copyFileSync(path.join(REPO, rel), path.join(siteDir, rel));
  }
  const notePath = path.join(out, NOTE_OUT);
  fs.copyFileSync(note, notePath);

  // zip: the note at the top, then the folder with every subfolder entry before its files
  const entries = [{ name: NOTE_OUT, data: fs.readFileSync(notePath) }];
  const seen = new Set();
  for (const rel of list) {
    const parts = `${SITE_DIR}/${rel}`.split('/');
    for (let i = 1; i < parts.length; i++) {
      const d = `${parts.slice(0, i).join('/')}/`;
      if (!seen.has(d)) { seen.add(d); entries.push({ name: d }); }
    }
    entries.push({ name: `${SITE_DIR}/${rel}`, data: fs.readFileSync(path.join(siteDir, rel)) });
  }
  const zipPath = path.join(out, `${SITE_DIR}.zip`);
  fs.writeFileSync(zipPath, zip(entries));

  const bytes = list.reduce((n, rel) => n + fs.statSync(path.join(siteDir, rel)).size, 0);
  log(`${posix(path.relative(REPO, siteDir))}/  ${list.length} files, ${(bytes / 1024).toFixed(0)} KB`);
  for (const rel of list) log(`  ${rel}`);
  log(`${posix(path.relative(REPO, notePath))}  (hand-off note, next to the folder)`);
  log(`${posix(path.relative(REPO, zipPath))}  ${(fs.statSync(zipPath).size / 1024).toFixed(0)} KB`);
  return { siteDir, notePath, zipPath, files: list };
}

module.exports = { build, crawl, referencesIn, resolveReference, zip, unzip, PAGES, SITE_DIR, NOTE_OUT, NOTE_SRC, HOST };

if (require.main === module) {
  try { build({ log: s => console.log(s) }); } catch (e) { console.error(e.message); process.exit(1); }
}
