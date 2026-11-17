// #15 The upload: what goes on the server and what doesn't, that the package is complete on its own, the zip and the
// hand-off note beside it, and that uploading it over the old site keeps every old asset URL answering.
//
// `npm test` builds the package into a temp folder for this spec. `npm run test:dist` sets SITE_ROOT to
// dist/oscarclubsofia.com, and this spec checks that build (and the rest of the suite runs against it).
const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const H = require('./helpers');
const PKG = require('../tools/package.js');
const { serve } = require('./server');

const REPO = path.resolve(__dirname, '..');
const OLD_SITE = path.join(__dirname, 'fixtures', 'old-site');
const OLD_PAGES = ['index.html', 'mainmenu/index.html'];
const PAGES = H.PAGES.map(p => p.path.slice(1));
const LICENCE = /^assets\/fonts\/OFL-(.+)\.txt$/;
// Only these may ship: the four pages, the stylesheet, the script and the new assets
const SHIPPABLE = /^(index\.html|en\/index\.html|mainmenu\/index\.html|en\/mainmenu\/index\.html|css\/styles\.css|js\/main\.js|assets\/.+)$/;
// …and none of the repo's dev and design files may
const EXCLUDED_DIRS = ['design-system/', 'tests/', 'tools/', 'docs/', 'node_modules/', 'dist/', '.claude/', '.git/', 'test-results/', 'playwright-report/'];
const EXCLUDED_NAMES = ['package.json', 'package-lock.json', 'playwright.config.js', 'README.md', '.gitignore', 'handoff.html', PKG.NOTE_OUT];

/** Every file under `dir`, as sorted forward-slash paths relative to it. */
const walk = (dir, base = dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => {
  const abs = path.join(dir, e.name);
  return e.isDirectory() ? walk(abs, base) : [path.relative(base, abs).split(path.sep).join('/')];
}).sort();

test.describe.configure({ mode: 'default' });

let out, site, files, built;
test.beforeAll(() => {
  const given = process.env.SITE_ROOT && path.resolve(REPO, process.env.SITE_ROOT);
  if (given && path.basename(given) === PKG.SITE_DIR) {
    site = given; out = path.dirname(given); built = false;                  // npm run test:dist: check that build
  } else {
    out = fs.mkdtempSync(path.join(os.tmpdir(), 'oscar-package-'));         // npm test: build a fresh one
    PKG.build({ out });
    site = path.join(out, PKG.SITE_DIR); built = true;
  }
  files = walk(site);
});
test.afterAll(() => { if (built) fs.rmSync(out, { recursive: true, force: true }); });

/** What a page references, as paths in the site: every same-origin src/href/srcset/font/CSS url(), plus the absolute
 *  https://oscarclubsofia.com/… addresses in meta tags, link tags and JSON-LD. Each one must answer 200. */
async function referencedPaths(pw, base) {
  const local = await H.expectLocalReferencesResolve(pw);
  const css = await pw.evaluate(() => {
    const out = new Set();
    const visit = (rules, base) => {
      for (const r of rules) {
        if (r.cssRules) { visit(r.cssRules, base); continue; }
        const text = r.cssText.replace(/url\("data:(?:[^"\\]|\\.)*"\)/g, '');
        for (const m of text.matchAll(/url\("((?:[^"\\]|\\.)*)"\)/g)) out.add(new URL(m[1], base).href);
      }
    };
    for (const s of document.styleSheets) { try { visit(s.cssRules, s.href || location.href); } catch (_) { /* cross-origin */ } }
    return [...out];
  });
  const host = await pw.evaluate(site => {
    const out = new Set();
    const grab = s => (s.match(new RegExp(`${site.replace(/[./]/g, '\\$&')}[^\\s"'<>)\\\\]*`, 'g')) || []).forEach(u => out.add(u));
    document.querySelectorAll('meta[content]').forEach(m => grab(m.getAttribute('content')));
    document.querySelectorAll('link[href]').forEach(l => grab(l.getAttribute('href')));
    document.querySelectorAll('script[type="application/ld+json"]').forEach(s => grab(s.textContent));
    return [...out];
  }, `${H.SITE}/`);
  const paths = new Set();
  const add = (u, origin) => {
    const x = new URL(u);
    if (x.origin !== origin) return;
    let p = decodeURIComponent(x.pathname).slice(1);
    if (p === '' || p.endsWith('/')) p += 'index.html';
    paths.add(p);
  };
  local.forEach(u => add(u, base));
  css.forEach(u => add(u, base));
  host.forEach(u => add(u, H.SITE));
  const bad = [];
  for (const p of paths) { const res = await pw.request.get(`${base}/${p}`); if (res.status() !== 200) bad.push(`/${p} (${res.status()})`); }
  expect(bad, 'references that do not resolve in the package').toEqual([]);
  return paths;
}

test.describe('the upload folder', () => {
  test('holds the four pages, the stylesheet, the script and the new assets, and nothing from the dev side', async () => {
    for (const f of [...PAGES, 'css/styles.css', 'js/main.js']) expect(files, f).toContain(f);
    expect(files.filter(f => !SHIPPABLE.test(f)), 'files that are not site files').toEqual([]);
    expect(files.filter(f => EXCLUDED_DIRS.some(d => f.startsWith(d) || f.includes(`/${d}`))), 'dev folders').toEqual([]);
    expect(files.filter(f => EXCLUDED_NAMES.includes(path.posix.basename(f))), 'dev files').toEqual([]);
    expect(files.filter(f => f.split('/').some(part => part.startsWith('.'))), 'hidden files').toEqual([]);
    // a straight copy of the working tree: nothing is changed on the way
    const changed = files.filter(f => !fs.readFileSync(path.join(site, f)).equals(fs.readFileSync(path.join(REPO, f))));
    expect(changed, 'files that differ from the repo').toEqual([]);
  });

  test('every shipped file is referenced by a shipped page or stylesheet, and every reference resolves', async ({ page }) => {
    const srv = await serve(site);
    try {
      const referenced = new Set();
      for (const p of H.PAGES) {
        const log = H.watchNetwork(page);
        const res = await page.goto(`${srv.url}${p.path}`);
        expect(res.status(), p.name).toBe(200);
        await H.scrollThrough(page);
        (await referencedPaths(page, srv.url)).forEach(x => referenced.add(x));
        H.expectCleanNetwork(log);
        page.removeAllListeners('request'); page.removeAllListeners('requestfailed'); page.removeAllListeners('response');
      }
      expect([...referenced].filter(f => !files.includes(f)), 'referenced but not shipped').toEqual([]);
      // fonts' licences are the one exception: they ship beside the fonts because the licence asks for that
      expect(files.filter(f => !LICENCE.test(f) && !referenced.has(f)), 'shipped but not referenced (unused files)').toEqual([]);
      const fonts = files.filter(f => /\.woff2$/.test(f));
      const licences = files.filter(f => LICENCE.test(f));
      for (const l of licences) {
        const family = l.match(LICENCE)[1];
        expect(fonts.some(f => path.posix.basename(f).startsWith(`${family}-`)), `${l} sits next to its font`).toBe(true);
      }
      for (const f of fonts) expect(licences.some(l => path.posix.basename(f).startsWith(`${l.match(LICENCE)[1]}-`)), `${f} has its licence`).toBe(true);
    } finally { await srv.close(); }
  });

  test('the zip holds the folder and the hand-off note beside it, byte for byte', async () => {
    const zipPath = path.join(out, `${PKG.SITE_DIR}.zip`);
    expect(fs.existsSync(zipPath), 'the zip is built').toBe(true);
    const entries = PKG.unzip(fs.readFileSync(zipPath));
    const zipped = entries.filter(e => e.data).map(e => e.name).sort();
    expect(zipped).toEqual([PKG.NOTE_OUT, ...files.map(f => `${PKG.SITE_DIR}/${f}`)].sort());
    for (const e of entries.filter(x => x.data)) {
      const disk = e.name === PKG.NOTE_OUT ? path.join(out, PKG.NOTE_OUT) : path.join(out, e.name);
      expect(e.data.equals(fs.readFileSync(disk)), `${e.name} unzips to the same bytes`).toBe(true);
    }
    // plain ASCII names unzip the same with every tool (Windows Explorer, macOS Archive Utility, unzip)
    expect(entries.map(e => e.name).filter(n => /[^\x20-\x7e]/.test(n)), 'non-ASCII names').toEqual([]);
  });
});

test.describe('the hand-off note', () => {
  test('sits next to the upload folder (never inside it) and is the note from the repo', async () => {
    const note = path.join(out, PKG.NOTE_OUT);
    expect(fs.existsSync(note), `${PKG.NOTE_OUT} next to the folder`).toBe(true);
    expect(files.filter(f => /handoff|README/i.test(f)), 'no note inside the upload').toEqual([]);
    expect(fs.readFileSync(note).equals(fs.readFileSync(path.join(REPO, PKG.NOTE_SRC)))).toBe(true);
  });

  test('opens from disk with nothing loaded from anywhere, in Bulgarian then English, and covers what to upload, keep, check and ask', async ({ page }) => {
    const note = path.join(out, PKG.NOTE_OUT);
    const requests = [];
    page.on('request', r => requests.push(r.url()));
    await page.goto(`file:///${note.split(path.sep).join('/').replace(/^\//, '')}`);
    expect(requests.filter(u => !u.startsWith('file:') || !u.endsWith(PKG.NOTE_OUT)), 'requests besides the note itself').toEqual([]);

    const bg = page.locator('article[lang="bg"]');
    const en = page.locator('article[lang="en"]');
    await expect(bg.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(en.getByRole('heading', { level: 1 })).toBeVisible();
    expect(await bg.evaluate((a, b) => !!(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING), await en.elementHandle()), 'Bulgarian first').toBe(true);

    for (const [article, words] of [
      [bg, ['oscarclubsofia.com', 'Замени', 'Обедини', 'Не трийте нищо', '+359 899 666 633', 'search.google.com/test/rich-results',
        'Питай бара', 'NX0', 'основателя', 'Работното време', 'ноември 2026', 'Оценките', 'Averna']],
      [en, ['oscarclubsofia.com', 'Overwrite', 'Merge', 'Don\'t delete anything', '+359 899 666 633', 'search.google.com/test/rich-results',
        'Ask the bar', 'NX0', 'founder', 'Opening hours', 'November 2026', 'ratings', 'Averna']]
    ]) {
      const text = await article.innerText();
      for (const w of words) expect(text, `"${w}"`).toContain(w);
      // every old asset path that must stay on the server, by name
      for (const p of ['/logoOscar.png', '/prizeyear.png', '/menu3.png', '/mainmenu/png/', '/mainmenu/food/']) expect(text, p).toContain(p);
      // three checks after the upload
      expect(await article.getByRole('heading', { level: 3 }).count()).toBeGreaterThanOrEqual(3);
    }
  });
});

test.describe('uploading over the old site (a stand-in with the old asset paths)', () => {
  test('every old asset URL still answers with its own bytes, and the four pages are the new ones', async ({ page }) => {
    const old = walk(OLD_SITE);
    const oldAssets = old.filter(f => !OLD_PAGES.includes(f));
    // the stand-in covers every kind of old path the brief protects
    for (const re of [/^logoOscar\.png$/, /^prizeyear\.png$/, /^mainmenu\/png\/.+/, /^mainmenu\/food\/.+/]) expect(oldAssets.some(f => re.test(f)), String(re)).toBe(true);
    for (const f of OLD_PAGES) expect(old, f).toContain(f);

    // the package never ships a file at an old asset path, nor anything new into the old folders
    expect(files.filter(f => oldAssets.includes(f)), 'package files at old asset paths').toEqual([]);
    expect(files.filter(f => /^mainmenu\/(png|food)\//.test(f)), 'package files in the old image folders').toEqual([]);
    expect(files.filter(f => !f.includes('/') && f !== 'index.html'), 'package files beside the old root images').toEqual([]);

    // what an FTP upload does: the old site stays, the package is copied over it, same-named files are overwritten
    const server = fs.mkdtempSync(path.join(os.tmpdir(), 'oscar-old-site-'));
    fs.cpSync(OLD_SITE, server, { recursive: true });
    fs.cpSync(site, server, { recursive: true, force: true });
    const srv = await serve(server);
    try {
      for (const f of oldAssets) {
        const res = await page.request.get(`${srv.url}/${f}`);
        expect(res.status(), `/${f}`).toBe(200);
        expect((await res.body()).equals(fs.readFileSync(path.join(OLD_SITE, f))), `/${f} is the old file, unchanged`).toBe(true);
        expect(res.headers()['content-type'], `/${f}`).toMatch(/^image\//);
      }
      for (const p of H.PAGES) {
        const res = await page.request.get(`${srv.url}${p.path}`);
        expect((await res.body()).equals(fs.readFileSync(path.join(site, p.path))), `${p.path} is the new page`).toBe(true);
        const log = H.watchNetwork(page);
        await page.goto(`${srv.url}${p.path}`);
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
        await expect(page).not.toHaveTitle(/OLD/);
        await H.scrollThrough(page);
        await H.expectLocalReferencesResolve(page);
        H.expectCleanNetwork(log);
        page.removeAllListeners('request'); page.removeAllListeners('requestfailed'); page.removeAllListeners('response');
      }
      // the directory addresses the host serves too
      for (const [dir, file] of [['/', 'index.html'], ['/mainmenu/', 'mainmenu/index.html'], ['/en/', 'en/index.html'], ['/en/mainmenu/', 'en/mainmenu/index.html']]) {
        const res = await page.request.get(`${srv.url}${dir}`);
        expect((await res.body()).equals(fs.readFileSync(path.join(site, file))), `${dir} serves the new ${file}`).toBe(true);
      }
    } finally {
      await srv.close();
      fs.rmSync(server, { recursive: true, force: true });
    }
  });
});
