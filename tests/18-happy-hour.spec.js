// #18 Happy hour, 18:00–20:00. The old site never mentions it, so only the time is stated; the days, the drinks and the
// prices are marked "Питай бара" / "Ask the bar", never guessed. A guest finds it where the hours are: on home under
// the week of opening hours, on the menu under the title and the open-now pill. Both languages, with and without
// JavaScript, at phone width.
const { test, expect } = require('@playwright/test');
const H = require('./helpers');

const T = {
  bg: { line: 'Happy hour 18:00–20:00. Дни, напитки и цени: Питай бара', ask: 'Питай бара', visit: 'Славянска 15', hours: 'Работно време', menu: 'Меню' },
  en: { line: 'Happy hour 18:00–20:00. Days, drinks and prices: Ask the bar', ask: 'Ask the bar', visit: 'Slavyanska 15', hours: 'Opening hours', menu: 'Menu' }
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
    test('says 18:00–20:00 and asks the bar for the rest, nothing more', async ({ page }) => {
      await H.openPage(page, P.path);
      const hh = line(page, P.lang, P.kind);
      await expect(hh).toHaveCount(1);
      await expect(hh).toBeVisible();
      // the exact words: the time and the marker. No day, drink, price, percentage or currency of our own making
      expect(await textOf(hh)).toBe(t.line);
      await expect(hh.getByText(t.ask, { exact: true })).toBeVisible();
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

    test('is plain type: no glow, not gold, the marker in ivory like the rest', async ({ page }) => {
      await H.openPage(page, P.path);
      const hh = line(page, P.lang, P.kind);
      const look = el => { const s = getComputedStyle(el); return { shadow: s.textShadow, color: s.color }; };
      const [l, m] = [await hh.evaluate(look), await hh.getByText(t.ask, { exact: true }).evaluate(look)];
      expect(l.shadow).toBe('none');
      expect(m.shadow).toBe('none');
      // the marker is set apart from the dim line, in the site's ivory (the colour of the type), as the menu marks
      // Averna's price and the NX0 download
      const ivory = await hh.evaluate(el => {
        const s = el.appendChild(document.createElement('span'));
        s.style.color = 'var(--ivory)';
        const c = getComputedStyle(s).color; s.remove(); return c;
      });
      expect(m.color).toBe(ivory);
      expect(m.color).not.toBe(l.color);
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
