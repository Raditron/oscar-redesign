// #18 Happy hour, 18:00–20:00. The old site never mentions it, so only the time is stated: no days, drinks or prices
// of our own making, and (#21) no "Питай бара" / "Ask the bar" marker. A guest finds it where the hours are: on home
// under the week of opening hours, on the menu under the title and the open-now pill. Both languages, with and without
// JavaScript, at phone width.
const { test, expect } = require('@playwright/test');
const H = require('./helpers');

const T = {
  bg: { line: 'Happy hour 18:00–20:00.', visit: 'Славянска 15', hours: 'Работно време', menu: 'Меню' },
  en: { line: 'Happy hour 18:00–20:00.', visit: 'Slavyanska 15', hours: 'Opening hours', menu: 'Menu' }
};

/** The region the line belongs in: the visit section on home, the menu's title section on the menu. */
const home = (pw, lang) => pw.getByRole('region', { name: T[lang].visit });
const menuHead = (pw, lang) => pw.getByRole('region', { name: T[lang].menu, exact: true });
const where = (pw, lang, kind) => (kind === 'home' ? home(pw, lang) : menuHead(pw, lang));
const line = (pw, lang, kind) => where(pw, lang, kind).getByText(/^Happy hour 18:00/);
const textOf = loc => loc.evaluate(el => el.textContent.replace(/\s+/g, ' ').trim());

for (const P of H.PAGES) {
  const t = T[P.lang];
  test.describe(`${P.name}: happy hour`, () => {
    test('says 18:00–20:00, nothing more', async ({ page }) => {
      await H.openPage(page, P.path);
      const hh = line(page, P.lang, P.kind);
      await expect(hh).toHaveCount(1);
      await expect(hh).toBeVisible();
      // the exact words: the time. No day, drink, price, percentage or currency of our own making
      expect(await textOf(hh)).toBe(t.line);
      // no "Питай бара" / "Ask the bar" marker anywhere on the page (#21)
      await expect(page.getByText(/Питай бара|Ask the bar/)).toHaveCount(0);
      // only one happy-hour line per page
      await expect(page.getByText(/happy hour/i)).toHaveCount(1);
    });

    if (P.kind === 'home') {
      test('sits under the week of opening hours', async ({ page }) => {
        await H.openPage(page, P.path);
        const week = home(page, P.lang).getByRole('table', { name: t.hours });
        const hh = line(page, P.lang, P.kind);
        const after = await week.evaluate((w, l) => !!(w.compareDocumentPosition(l) & Node.DOCUMENT_POSITION_FOLLOWING), await hh.elementHandle());
        expect(after, 'the happy hour comes after the week').toBe(true);
        const [w, l] = [await week.boundingBox(), await hh.boundingBox()];
        expect(l.y, 'below the week on screen').toBeGreaterThanOrEqual(w.y + w.height);
      });
    } else {
      test('sits under the title and the open-now pill, before the first category', async ({ page }) => {
        await H.openPage(page, P.path);
        const title = page.getByRole('heading', { level: 1, name: t.menu });
        const [h, l] = [await title.boundingBox(), await line(page, P.lang, P.kind).boundingBox()];
        expect(l.y).toBeGreaterThan(h.y + h.height);
        await expect(line(page, P.lang, P.kind)).toBeInViewport();
      });
    }

    if (P.lang === 'bg') {
      test('"Happy hour" is marked as English for screen readers', async ({ page }) => {
        await H.openPage(page, P.path);
        await expect(line(page, P.lang, P.kind).locator('[lang="en"]')).toHaveText('Happy hour');
      });
    }

    test('is plain type: no glow, not gold, in the dim type of the line above', async ({ page }) => {
      await H.openPage(page, P.path);
      const hh = line(page, P.lang, P.kind);
      const look = el => { const s = getComputedStyle(el); return { shadow: s.textShadow, color: s.color }; };
      const l = await hh.evaluate(look);
      expect(l.shadow).toBe('none');
      // the same dim colour as the site's other secondary lines (.v2-dim), not the gold of the call
      const [dim, gold] = await hh.evaluate(el => [['p', 'v2-dim', ''], ['span', '', 'var(--gold)']].map(([tag, cls, color]) => {
        const s = el.parentElement.appendChild(document.createElement(tag));
        s.className = cls; s.style.color = color;
        const c = getComputedStyle(s).color; s.remove(); return c;
      }));
      expect(l.color).toBe(dim);
      expect(l.color).not.toBe(gold);
    });

    test('at phone width it fits, with no sideways scroll', async ({ page }) => {
      await page.setViewportSize(H.VIEWPORTS.phone);
      await H.openPage(page, P.path);
      const hh = line(page, P.lang, P.kind);
      await hh.scrollIntoViewIfNeeded();
      const box = await hh.boundingBox();
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(H.VIEWPORTS.phone.width);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(H.VIEWPORTS.phone.width);
    });

    test('without JavaScript it is there all the same', async ({ browser }) => {
      const ctx = await browser.newContext({ javaScriptEnabled: false });
      const pw = await ctx.newPage();
      await H.openPage(pw, P.path);
      const hh = line(pw, P.lang, P.kind);
      await expect(hh).toBeVisible();
      expect(await textOf(hh)).toBe(t.line);
      await ctx.close();
    });
  });
}
