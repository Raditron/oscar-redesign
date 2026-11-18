// #24 Happy hour: 50% off, every night 18:00–20:00, said so a guest can't miss it. Home: in the hero slate (first
// screen) and as the key under the week of opening hours. Menu: under the title, before the first category. While it
// is on (18:00–20:00, Sofia time) every open-now line says so and when it ends. "−50%" is set large in the display
// face, in ivory: no gold, no glow, no box or pill. Both languages, with and without JavaScript, at phone width.
const { test, expect } = require('@playwright/test');
const H = require('./helpers');

const SLOGAN = 'allow yourself to be yourself.';
const T = {
  // what a screen reader reads (textContent), and what is drawn (the "отстъпка"/"off" is for screen readers only)
  bg: { said: '−50% отстъпка Happy hour всяка вечер 18:00–20:00', seen: '−50% Happy hour всяка вечер 18:00–20:00',
        visit: 'Славянска 15', menu: 'Меню', live: 'Happy hour −50% отстъпка до 20:00', liveSeen: 'Happy hour −50%',
        open: 'Отворено до 23:30', closed: 'Затворено отваря днес в 18:00' },
  en: { said: '−50% off Happy hour every night 18:00–20:00', seen: '−50% Happy hour every night 18:00–20:00',
        visit: 'Slavyanska 15', menu: 'Menu', live: 'Happy hour −50% off until 20:00', liveSeen: 'Happy hour −50%',
        open: 'Open now until 23:30', closed: 'Closed opens today at 18:00' }
};
// Mon 16 Nov 2026, Sofia time
const MON = t => `2026-11-16T${t}`;

const textOf = loc => loc.evaluate(el => el.textContent.replace(/\s+/g, ' ').trim());
const seenText = loc => loc.evaluate(el => {
  const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  let out = '';
  for (let n = w.nextNode(); n; n = w.nextNode()) { const r = n.parentElement.getBoundingClientRect(); if (r.width > 1 && r.height > 1) out += ' ' + n.data; }
  return out.replace(/\s+/g, ' ').trim();
});

/** The happy-hour blocks a page carries, each with where it is: [label, locator]. */
const blocks = (pw, P) => {
  const t = T[P.lang], hh = region => region.locator('p, li').filter({ hasText: /^\s*−50%/ });
  return P.kind === 'home'
    ? [['hero slate', hh(pw.getByRole('region', { name: SLOGAN }).getByRole('list'))],
       ['under the week', hh(pw.getByRole('region', { name: t.visit }))]]
    : [['menu title', hh(pw.getByRole('region', { name: t.menu, exact: true }))]];
};

for (const P of H.PAGES) {
  const t = T[P.lang];
  test.describe(`${P.name}: happy hour, 50% off`, () => {
    test('says −50%, happy hour, every night 18:00–20:00, in each place', async ({ page }) => {
      await H.openPage(page, P.path, { now: MON('22:00') });
      for (const [where, b] of blocks(page, P)) {
        await expect(b, where).toHaveCount(1);
        await expect(b, where).toBeVisible();
        expect(await textOf(b), where).toBe(t.said);
        expect(await seenText(b), where).toBe(t.seen);
        if (P.lang === 'bg') await expect(b.locator('[lang="en"]'), where).toHaveText('Happy hour');
      }
    });

    test('"−50%" is large display type in ivory: no gold, no glow, no box', async ({ page }) => {
      await H.openPage(page, P.path, { now: MON('22:00') });
      for (const [where, b] of blocks(page, P)) {
        const off = b.getByText('−50%');
        const s = await off.evaluate(el => {
          const c = getComputedStyle(el), p = getComputedStyle(el.closest('p, li'));
          const probe = col => { const x = el.parentElement.appendChild(document.createElement('span')); x.style.color = col; const v = getComputedStyle(x).color; x.remove(); return v; };
          return { font: c.fontFamily, size: parseFloat(c.fontSize), color: c.color, shadow: c.textShadow, ivory: probe('var(--ivory)'),
                   golds: ['var(--gold)', 'var(--gold-hi)', 'var(--brass-hi)'].map(probe),
                   boxes: [c, p].map(x => [x.backgroundColor, x.borderTopWidth, x.borderRadius]) };
        });
        expect(s.font, where).toMatch(/^"?Poiret One/);
        expect(s.size, where).toBeGreaterThanOrEqual(28);
        expect(s.color, where).toBe(s.ivory);
        for (const g of s.golds) expect(s.color, where).not.toBe(g);
        expect(s.shadow, where).toBe('none');
        for (const [bg, bw] of s.boxes) { expect(bg, where).toBe('rgba(0, 0, 0, 0)'); expect(bw, where).toBe('0px'); }
      }
    });

    if (P.kind === 'home') {
      test('in the first screen: the slate\'s second item, right after the hours', async ({ page }) => {
        await H.openPage(page, P.path, { now: MON('22:00') });
        const items = page.getByRole('region', { name: SLOGAN }).getByRole('list').getByRole('listitem');
        expect(await textOf(items.nth(1))).toBe(t.said);
      });
    } else {
      test('the menu: under the title, before the first category, in view on a phone', async ({ page }) => {
        await page.setViewportSize(H.VIEWPORTS.phone);
        await H.openPage(page, P.path, { now: MON('22:00') });
        const [[, b]] = blocks(page, P);
        const title = await page.getByRole('heading', { level: 1, name: t.menu }).boundingBox();
        const box = await b.boundingBox();
        expect(box.y).toBeGreaterThan(title.y + title.height);
        await expect(b).toBeInViewport();
        // "−50%" and the words share one line at phone width
        const [o, w] = await b.evaluate(el => [...el.children].slice(0, 2).map(c => c.getBoundingClientRect().top + c.getBoundingClientRect().height / 2));
        expect(Math.abs(o - w)).toBeLessThan(12);
      });
    }

    test('while it is on, the open-now lines say so and when it ends', async ({ page }) => {
      for (const at of ['18:00', '19:10', '19:59']) {
        await H.openPage(page, P.path, { now: MON(at) });
        const lines = page.locator('[data-oc-status]');
        const n = await lines.count();
        expect(n).toBeGreaterThan(0);
        for (let i = 0; i < n; i++) {
          const line = lines.nth(i);
          expect((await textOf(line)).replace(/ · /, ' '), `${at}, line ${i}`).toBe(t.live);
          await expect(line).toHaveAttribute('data-state', 'open');
          if (P.lang === 'bg') await expect(line.locator('[lang="en"]')).toHaveText('Happy hour');
        }
      }
      // the header's live region on a phone: the short line still says it
      await page.setViewportSize(H.VIEWPORTS.phone);
      await H.openPage(page, P.path, { now: MON('19:10') });
      expect(await seenText(H.headerStatus(page))).toBe(t.liveSeen);
    });

    test('outside it, the open-now line is unchanged', async ({ page }) => {
      for (const [at, want] of [['17:59', t.closed], ['20:00', t.open]]) {
        await H.openPage(page, P.path, { now: MON(at) });
        await expect(H.headerStatus(page)).toHaveText(want);
      }
      // after midnight on a late night (Fri 01:00, Thursday night) it's the plain open line
      await H.openPage(page, P.path, { now: '2026-11-20T01:00' });
      await expect(H.headerStatus(page)).toHaveText(P.lang === 'bg' ? 'Отворено до 02:00' : 'Open now until 02:00');
    });

    test('at phone width it fits, with no sideways scroll, happy hour on or off', async ({ page }) => {
      await page.setViewportSize(H.VIEWPORTS.phone);
      for (const at of ['19:10', '22:00']) {
        await H.openPage(page, P.path, { now: MON(at) });
        for (const [where, b] of blocks(page, P)) {
          await b.scrollIntoViewIfNeeded();
          const box = await b.boundingBox();
          expect(box.x, where).toBeGreaterThanOrEqual(0);
          expect(box.x + box.width, where).toBeLessThanOrEqual(H.VIEWPORTS.phone.width);
        }
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(H.VIEWPORTS.phone.width);
      }
    });

    test('without JavaScript every block is there all the same', async ({ browser }) => {
      const ctx = await browser.newContext({ javaScriptEnabled: false });
      const pw = await ctx.newPage();
      await H.openPage(pw, P.path);
      for (const [where, b] of blocks(pw, P)) {
        await expect(b, where).toBeVisible();
        expect(await textOf(b), where).toBe(t.said);
      }
      await ctx.close();
    });
  });
}
