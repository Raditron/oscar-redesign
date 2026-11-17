// Dev only, never uploaded. Renders the link-preview image and the PNG favicons with Playwright's Chromium:
//   assets/share/oscar-club.jpg              1200×630, from tools/share-card.html
//   assets/icons/favicon-32.png               32×32   ┐
//   assets/icons/icon-192.png                 192×192 ├ from assets/icons/favicon.svg
//   assets/icons/icon-512.png                 512×512 ┘
//   assets/icons/apple-touch-icon.png         180×180, the same drawing on a full square (iOS rounds the corners itself)
// Usage (after `npm install`):  node tools/render-share-assets.js
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('@playwright/test');

const ROOT = path.resolve(__dirname, '..');
const ORIGIN = 'http://render.local';
const TYPES = { '.html': 'text/html', '.css': 'text/css', '.woff2': 'font/woff2', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.png': 'image/png' };
const out = (...p) => path.join(ROOT, 'assets', ...p);

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ deviceScaleFactor: 1 });
  // serve the repo from a fake origin, so fonts and images load the way they do on the host
  await ctx.route(`${ORIGIN}/**`, route => {
    const file = path.join(ROOT, decodeURIComponent(new URL(route.request().url()).pathname));
    if (!file.startsWith(ROOT) || !fs.existsSync(file)) return route.fulfill({ status: 404, body: 'Not found' });
    route.fulfill({ status: 200, contentType: TYPES[path.extname(file)] || 'application/octet-stream', body: fs.readFileSync(file) });
  });
  const page = await ctx.newPage();

  // 1 · the share card
  const mark = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8').match(/<svg class="mark lit"[\s\S]*?<\/svg>/)[0]
    .replace('role="img" aria-label="Oscar Club"', 'aria-hidden="true"');
  await page.setViewportSize({ width: 1200, height: 630 });
  await page.goto(`${ORIGIN}/tools/share-card.html`);
  await page.evaluate(svg => { document.getElementById('mark').outerHTML = svg; }, mark);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() => [...document.images].every(i => i.complete && i.naturalWidth));
  fs.mkdirSync(out('share'), { recursive: true });
  await page.screenshot({ path: out('share', 'oscar-club.jpg'), type: 'jpeg', quality: 86 });

  // 2 · the favicons, from the SVG
  const svg = fs.readFileSync(out('icons', 'favicon.svg'), 'utf8');
  const square = svg.replace(/ rx="[^"]*"/, '');   // apple-touch-icon: no transparent corners (iOS would paint them black anyway)
  const icons = [['favicon-32.png', 32, svg], ['icon-192.png', 192, svg], ['icon-512.png', 512, svg], ['apple-touch-icon.png', 180, square]];
  for (const [name, size, src] of icons) {
    await page.setViewportSize({ width: size, height: size });
    await page.setContent(`<!doctype html><style>*{margin:0}html,body{background:transparent}img{display:block;width:${size}px;height:${size}px}</style>
      <img src="data:image/svg+xml;base64,${Buffer.from(src).toString('base64')}" alt="">`);
    await page.waitForFunction(() => document.images[0].complete);
    await page.screenshot({ path: out('icons', name), omitBackground: true });
  }

  await browser.close();
  console.log('rendered assets/share/oscar-club.jpg and', icons.map(i => i[0]).join(', '));
})();
