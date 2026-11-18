// #18 Happy hour, 18:00–20:00. The old site never mentions it, so only the time is stated: no days, drinks or prices
// of our own making, and (#21) no "Питай бара" / "Ask the bar" marker. A guest finds it where the hours are: on home
// under the week of opening hours, on the menu under the title. Both languages, with and without
// JavaScript, at phone width.
// #24: the bar has since confirmed 50% off, every night, so the line now says "−50%" too, set large. Its words and its
// look are tested in 24-happy-hour-off.spec.js; this file keeps where it sits, the hatch on the week, phone, no-JS.
const { test, expect } = require('@playwright/test');
const H = require('./helpers');

const T = {
  bg: { line: '−50% отстъпка Happy hour всяка вечер 18:00–20:00', visit: 'Славянска 15', hours: 'Работно време', menu: 'Меню' },
  en: { line: '−50% off Happy hour every night 18:00–20:00', visit: 'Slavyanska 15', hours: 'Opening hours', menu: 'Menu' }
};

/** The region the line belongs in: the visit section on home, the menu's title section on the menu. */
const home = (pw, lang) => pw.getByRole('region', { name: T[lang].visit });
const menuHead = (pw, lang) => pw.getByRole('region', { name: T[lang].menu, exact: true });
const where = (pw, lang, kind) => (kind === 'home' ? home(pw, lang) : menuHead(pw, lang));
const line = (pw, lang, kind) => where(pw, lang, kind).locator('p').filter({ hasText: /^s*−50%/ });
const textOf = loc => loc.evaluate(el => el.textContent.replace(/\s+/g, ' ').trim());

for (const P of H.PAGES) {
  const t = T[P.lang];
  test.describe(`${P.name}: happy hour`, () => {
    test('is stated once in its place', async ({ page }) => {
      await H.openPage(page, P.path);
      const hh = line(page, P.lang, P.kind);
      await expect(hh).toHaveCount(1);
      await expect(hh).toBeVisible();
      expect(await textOf(hh)).toBe(t.line);
      // no "Питай бара" / "Ask the bar" marker anywhere on the page (#21)
      await expect(page.getByText(/Питай бара|Ask the bar/)).toHaveCount(0);
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
      test('sits under the title, before the first category', async ({ page }) => {
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

    test('is plain type: no glow, not gold', async ({ page }) => {
      await H.openPage(page, P.path);
      const l = await line(page, P.lang, P.kind).evaluate(el => {
        const probe = col => { const x = el.appendChild(document.createElement('span')); x.style.color = col; const v = getComputedStyle(x).color; x.remove(); return v; };
        return { shadow: getComputedStyle(el).textShadow, colors: [...el.querySelectorAll('*')].map(c => getComputedStyle(c).color), gold: probe('var(--gold)') };
      });
      expect(l.shadow).toBe('none');
      expect(l.colors).not.toContain(l.gold);
    });

    if (P.kind === 'home') {
      // #22: the week draws it too. Every night's bar hatches its first two hours of nine (18:00–20:00) in its own ink,
      // tonight's included; the key under the week carries the same hatch beside the words
      for (const vp of ['desktop', 'phone']) {
        test(`the week hatches 18:00–20:00 on every night, with a key (${vp})`, async ({ page }) => {
          await page.setViewportSize(H.VIEWPORTS[vp]);
          await H.openPage(page, P.path);
          const bars = home(page, P.lang).locator('.v2-week .v2-bar');
          await expect(bars).toHaveCount(7);
          const marks = await bars.evaluateAll(els => els.map(el => {
            const a = getComputedStyle(el, '::after');
            return { bar: el.getBoundingClientRect().width, w: parseFloat(a.width), left: a.left, img: a.backgroundImage, today: !!el.closest('tr.today') };
          }));
          for (const m of marks) {
            expect(m.left).toBe('0px');
            expect(Math.abs(m.w - m.bar * 2 / 9)).toBeLessThan(1);
            expect(m.img).toContain('repeating-linear-gradient');
          }
          // tonight's hatch is in the on-brass ink, the other nights' in ivory: two inks, both from the bar they sit on
          if (marks.some(m => m.today)) expect(new Set(marks.map(m => m.img)).size).toBe(2);
          // the hours stay above the hatch
          const z = await bars.first().locator('span').evaluate(el => getComputedStyle(el).zIndex);
          expect(Number(z)).toBeGreaterThan(0);
          // the key: a hatched swatch, hidden from screen readers, then the words
          const hh = line(page, P.lang, P.kind);
          const sw = hh.locator('i[aria-hidden="true"]');
          await expect(sw).toBeVisible();
          expect(await sw.evaluate(el => getComputedStyle(el).backgroundImage)).toContain('repeating-linear-gradient');
          expect(await textOf(hh)).toBe(t.line);
        });
      }
    }

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
