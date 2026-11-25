// Shared test helpers. Every ticket's spec can use these; tests assert only what a visitor sees and can do
// (roles, labels, text, requests), never class names.
const { expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;
const { sharedBackendUrl } = require('./backend');

const SITE = 'https://oscarclubsofia.com';

// The four pages. `path` is where the file is served; `url` is its canonical address on the real host.
const PAGES = [
  { name: 'home BG', path: '/index.html', lang: 'bg', kind: 'home', url: `${SITE}/`, otherLang: '/en/index.html' },
  { name: 'home EN', path: '/en/index.html', lang: 'en', kind: 'home', url: `${SITE}/en/`, otherLang: '/index.html' },
  { name: 'menu BG', path: '/mainmenu/index.html', lang: 'bg', kind: 'menu', url: `${SITE}/mainmenu/`, otherLang: '/en/mainmenu/index.html' },
  { name: 'menu EN', path: '/en/mainmenu/index.html', lang: 'en', kind: 'menu', url: `${SITE}/en/mainmenu/`, otherLang: '/mainmenu/index.html' }
];
const page = (lang, kind) => PAGES.find(p => p.lang === lang && p.kind === kind);

const VIEWPORTS = { phone: { width: 390, height: 844 }, tablet: { width: 860, height: 1000 }, desktop: { width: 1440, height: 900 } };

// Accessible names of the shared chrome, per language
const CHROME = {
  bg: { mainNav: 'Основна навигация', langGroup: 'Език', quick: 'Бързи действия', skip: 'Към съдържанието' },
  en: { mainNav: 'Main', langGroup: 'Language', quick: 'Quick actions', skip: 'Skip to content' }
};

/**
 * Firefox workaround (test tooling only, nothing to do with the site). In Playwright 1.65's Firefox, a multi-element
 * read (locator.evaluateAll / allTextContents / allInnerTexts) on a locator inside a region named by aria-labelledby
 * crashes the page once that region has been queried before ("Page crashed"; reproduced on a 3-element page with no CSS
 * or script). Reading the same elements through their handles does not, so in Firefox those three calls take that
 * route. The result is identical; Chromium and WebKit use Playwright's own calls. Installed by openPage(). The cause is
 * the Firefox bug described at AXE_FOR_FIREFOX below.
 */
function patchFirefoxLocators(pw) {
  const proto = Object.getPrototypeOf(pw.locator('html'));
  if (proto.__ocFirefoxPatch) return;
  proto.__ocFirefoxPatch = true;
  const inFirefox = loc => { const b = loc.page().context().browser(); return !!b && b.browserType().name() === 'firefox'; };
  const { evaluateAll, allTextContents, allInnerTexts } = proto;
  proto.evaluateAll = async function (fn, arg) {
    if (!inFirefox(this)) return evaluateAll.call(this, fn, arg);
    const handles = await this.elementHandles();
    try {
      return await this.page().evaluate(([src, els, a]) => (0, eval)(`(${src})`)(els, a), [String(fn), handles, arg]);
    } finally { await Promise.all(handles.map(h => h.dispose())); }
  };
  proto.allTextContents = function () { return inFirefox(this) ? this.evaluateAll(els => els.map(e => e.textContent || '')) : allTextContents.call(this); };
  proto.allInnerTexts = function () { return inFirefox(this) ? this.evaluateAll(els => els.map(e => e.innerText)) : allInnerTexts.call(this); };
}

// The backend each page loads from. An init script can't be taken back, and the order several run in isn't defined,
// so a page is pointed at one backend for good.
const pointedAt = new WeakMap();

/** Point the page at a backend (see tests/backend.js): window.OC_API, set before js/main.js runs, on every load. */
async function pointAtBackend(pw, url) {
  if (pointedAt.has(pw)) {
    if (pointedAt.get(pw) !== url) throw new Error(`This page loads from ${pointedAt.get(pw)}: open another page for ${url}`);
    return;
  }
  pointedAt.set(pw, url);
  await pw.addInitScript(u => { window.OC_API = u; }, url);
}

/**
 * Open a page. `now` sets the clock as Sofia local time ('2026-11-20T01:30'); `query` adds more parameters; `backend`
 * is the base URL the page loads its content from: the suite's shared backend unless given (a private backend's url,
 * closedBackendUrl(), or '' for none). null leaves it to js/config.js: only for a test that serves that file itself
 * (page.route), so the suite never calls the backend the file on disk may name.
 */
async function openPage(pw, path, { now, query, backend = sharedBackendUrl() } = {}) {
  patchFirefoxLocators(pw);
  if (backend !== null) await pointAtBackend(pw, backend);
  const params = new URLSearchParams(query || {});
  if (now) params.set('now', now);
  const qs = params.toString();
  const res = await pw.goto(path + (qs ? `?${qs}` : ''));
  expect(res && res.status(), `${path} should load`).toBe(200);
  return res;
}

/** The open-now line in the header. */
const headerStatus = pw => pw.getByRole('banner').getByRole('status');

/**
 * Start recording network traffic. Call before openPage. Returns { failed, thirdParty, requests }:
 *   failed      every request that errored or answered 4xx/5xx
 *   thirdParty  every http(s) request to a host other than the local test servers (the site's, and its backend's)
 */
function watchNetwork(pw) {
  const log = { failed: [], thirdParty: [], requests: [] };
  pw.on('request', req => {
    const u = new URL(req.url());
    log.requests.push(req.url());
    if (/^https?:$/.test(u.protocol) && !['localhost', '127.0.0.1'].includes(u.hostname)) log.thirdParty.push(req.url());
  });
  pw.on('requestfailed', req => log.failed.push(`${req.url()} (${req.failure() && req.failure().errorText})`));
  pw.on('response', res => { if (res.status() >= 400) log.failed.push(`${res.url()} (${res.status()})`); });
  return log;
}

/** Assert the recorded traffic: nothing failed, nothing went beyond the site and its backend. */
function expectCleanNetwork(log) {
  expect(log.thirdParty, 'requests to third-party hosts').toEqual([]);
  expect(log.failed, 'failed requests / 404s').toEqual([]);
}

/** Scroll through the whole page so lazy images load, then return to the top. */
async function scrollThrough(pw) {
  await pw.evaluate(async () => {
    for (let y = 0; y < document.documentElement.scrollHeight; y += innerHeight / 2) { scrollTo(0, y); await new Promise(r => setTimeout(r, 30)); }
    scrollTo(0, 0);
  });
}

/**
 * Every same-origin file the page references resolves with 200: images (src + srcset), stylesheets, preloads, icons,
 * scripts, @font-face sources, and every same-origin link target (without its #fragment).
 */
async function expectLocalReferencesResolve(pw) {
  const urls = await pw.evaluate(() => {
    const out = new Set();
    const add = u => { try { const x = new URL(u, location.href); if (x.origin === location.origin) { x.hash = ''; out.add(x.href); } } catch (_) { /* not a URL */ } };
    document.querySelectorAll('img[src], script[src], source[src], video[src]').forEach(el => add(el.getAttribute('src')));
    document.querySelectorAll('img[srcset], source[srcset]').forEach(el => el.getAttribute('srcset').split(',').forEach(s => add(s.trim().split(/\s+/)[0])));
    document.querySelectorAll('link[href]').forEach(el => add(el.href));
    document.querySelectorAll('a[href]').forEach(el => { const h = el.getAttribute('href'); if (!/^(tel:|mailto:|#)/.test(h)) add(el.href); });
    for (const sheet of document.styleSheets) {
      let rules; try { rules = sheet.cssRules; } catch (_) { continue; }
      for (const r of rules) if (r instanceof CSSFontFaceRule) {
        for (const m of r.style.getPropertyValue('src').matchAll(/url\("?([^")]+)"?\)/g)) add(new URL(m[1], sheet.href).href);
      }
    }
    return [...out];
  });
  const bad = [];
  for (const u of urls) {
    const res = await pw.request.get(u);
    if (res.status() !== 200) bad.push(`${u} (${res.status()})`);
  }
  expect(bad, 'local references that do not resolve').toEqual([]);
  return urls;
}

/**
 * Firefox workaround (test tooling only, nothing to do with the site). Playwright 1.65's Firefox (159) crashes the page
 * ("Page crashed") once an element's ariaLabelledByElements has been read from two JavaScript worlds: Playwright reads
 * it in a world of its own whenever it finds an element by role or label, and axe reads it in the page's (Mozilla bug
 * 2090055, fixed in Firefox 163; microsoft/playwright#43967). So in Firefox, axe takes aria-labelledby from the
 * attribute, the only way the site sets it: the same rules run and find the same things. Drop it once Playwright's
 * Firefox is 163 or later.
 */
const axeCore = require(require.resolve('axe-core', { paths: [require.resolve('@axe-core/playwright')] }));   // the copy AxeBuilder injects
const AXE_FOR_FIREFOX = `${axeCore.source}\n;axe.configure({ standards: { ariaAttrs: { 'aria-labelledby': { prop: undefined } } } });`;

/** axe scan: no serious or critical violations. `exclude` takes CSS selectors to leave out (use sparingly). */
async function expectNoSeriousA11yViolations(pw, { exclude = [] } = {}) {
  const inFirefox = pw.context().browser()?.browserType().name() === 'firefox';
  let axe = new AxeBuilder({ page: pw, axeSource: inFirefox ? AXE_FOR_FIREFOX : undefined });
  for (const sel of exclude) axe = axe.exclude(sel);
  const { violations } = await axe.analyze();
  const serious = violations.filter(v => v.impact === 'serious' || v.impact === 'critical')
    .map(v => `${v.impact}: ${v.id} — ${v.help}\n    ${v.nodes.slice(0, 5).map(n => n.target.join(' ')).join('\n    ')}`);
  expect(serious, 'axe serious/critical violations').toEqual([]);
}

/**
 * Tab through the page from the top and describe every focused element: its name, and whether a focus indicator
 * (outline or box-shadow ring) is drawn. Returns [{ tag, name, ring }].
 */
async function tabThrough(pw, max = 80) {
  const seen = [];
  await pw.evaluate(() => { document.querySelectorAll('[data-tab-seen]').forEach(el => delete el.dataset.tabSeen); document.activeElement && document.activeElement.blur(); scrollTo(0, 0); });
  for (let i = 0; i < max; i++) {
    await pw.keyboard.press('Tab');
    const info = await pw.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return null;
      if (el.dataset.tabSeen) return { wrapped: true };
      el.dataset.tabSeen = '1';
      const cs = getComputedStyle(el);
      const outline = cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) >= 1;
      const ring = outline || (cs.boxShadow && cs.boxShadow !== 'none');
      return { tag: el.tagName.toLowerCase(), name: (el.getAttribute('aria-label') || el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 60), href: el.getAttribute('href'), ring: !!ring };
    });
    if (!info || info.wrapped) break;   // left the page or wrapped around to the start
    seen.push(info);
  }
  return seen;
}

/**
 * Why the tests that walk the page with the Tab key skip WebKit: Playwright's WebKit keeps Safari's default, where Tab
 * moves between form controls and buttons only and links are reached with Option+Tab, a key the WebKit build Playwright
 * runs here does not map. Chromium and Firefox walk every link; WebKit still runs every other check, focus rings included
 * where a test focuses an element directly. Use: test.skip(browserName === 'webkit', H.WEBKIT_TAB).
 */
const WEBKIT_TAB = 'WebKit (as Safari by default) does not move Tab through links; see helpers.js';

module.exports = {
  SITE, PAGES, VIEWPORTS, CHROME, page,
  openPage, pointAtBackend, headerStatus, watchNetwork, expectCleanNetwork, scrollThrough, expectLocalReferencesResolve,
  expectNoSeriousA11yViolations, tabThrough, WEBKIT_TAB
};
