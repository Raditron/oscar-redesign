// #12 Menu page, first slice: pinned header, menu title + status, category bar (sticky, scroll-spy, landings),
// signature cocktails with the base-spirit filter. Both languages.
const { test, expect } = require('@playwright/test');
const H = require('./helpers');

const T = {
  bg: {
    title: 'Меню', euro: 'Всички цени са в евро', cats: 'Категории', filter: 'По основа', all: 'Всички',
    sig: '13 коктейла от 6 до 12 €. Избери по алкохола, който пиеш.', sigLink: 'Авторски коктейли', shotsLink: 'Шотове',
    vodka: 'Водка', gin: 'Джин', open: 'Отворено · до 02:00'
  },
  en: {
    title: 'Menu', euro: 'All prices are in euro', cats: 'Categories', filter: 'By base spirit', all: 'All',
    sig: '13 cocktails, €6 to €12. Pick by the spirit you drink.', sigLink: 'Signature cocktails', shotsLink: 'Shots',
    vodka: 'Vodka', gin: 'Gin', open: 'Open now · until 02:00'
  }
};
// the category bar, in order. Its accordion targets (#vodka … #soft) are the spirits/wine/beer <details> of #13
const CATEGORY_IDS = ['cocktails', 'shots', 'vodka', 'gin', 'tequila', 'whisky', 'irish', 'bourbon', 'digestif', 'wine', 'beer', 'soft'];
const ALL_COCKTAILS = ['Tarator', 'Machree', 'Mucho Bien', 'Blue’s’our', 'Tropilita', 'Better Taste', 'Soju Spritz', 'Eden Garden', 'Spraoi', 'French 69', 'Kiss Me', 'Cherry Lady', 'Fridge Cigarette'];
const VODKA = ['Tarator', 'Mucho Bien', 'Cherry Lady'];
const GIN = ['Eden Garden', 'French 69'];

const catbar = (pw, lang) => pw.getByRole('navigation', { name: T[lang].cats });
const cocktails = (pw, lang) => pw.getByRole('region', { name: T[lang].sig });
const cards = (pw, lang) => cocktails(pw, lang).getByRole('article');
const cardNames = (pw, lang) => cocktails(pw, lang).getByRole('heading', { level: 3 });
const chip = (pw, lang, label) => pw.getByRole('group', { name: T[lang].filter }).getByRole('button', { name: new RegExp(`^${label} \\d+$`) });

/** Wait until the category row has stopped scrolling sideways (after a jump it glides the current chip into view;
 *  clicking while it glides could hit the chip next to the one meant). */
const settled = nav => nav.evaluate(async row => {
  const frame = () => new Promise(r => requestAnimationFrame(r));
  let last = NaN;
  for (let i = 0; i < 120; i++) { await frame(); await frame(); if (row.scrollLeft === last) return; last = row.scrollLeft; }
});

/** Where the pinned header ends and the category bar begins and ends, in viewport px. */
async function bars(pw, lang) {
  const h = await pw.getByRole('banner').boundingBox();
  const c = await catbar(pw, lang).boundingBox();
  return { headerTop: h.y, headerBottom: h.y + h.height, barTop: c.y, barBottom: c.y + c.height };
}

/** The colour of one screen pixel (read back through a canvas, so no image library is needed). */
async function pixel(pw, x, y) {
  const png = await pw.screenshot({ clip: { x, y, width: 1, height: 1 } });
  return pw.evaluate(async b64 => {
    const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
    const c = document.createElement('canvas'); c.width = c.height = 1;
    const ctx = c.getContext('2d'); ctx.drawImage(img, 0, 0);
    return [...ctx.getImageData(0, 0, 1, 1).data.slice(0, 3)];
  }, png.toString('base64'));
}

for (const lang of ['bg', 'en']) {
  const P = H.page(lang, 'menu');
  const L = T[lang];

  test.describe(`${P.name}`, () => {
    test('the title is the lit sign, with the euro label and the open-now status', async ({ page }) => {
      await H.openPage(page, P.path, { now: '2026-11-20T01:00' });
      const main = page.getByRole('main');
      const h1 = main.getByRole('heading', { level: 1 });
      await expect(h1).toHaveText(L.title);
      await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
      // lit: the title glows (a text-shadow halo), as a brand mark may
      expect(await h1.evaluate(el => getComputedStyle(el).textShadow)).not.toBe('none');
      await expect(main.getByText(L.euro, { exact: true })).toBeVisible();
      // the open-now line under the title is plain text: the page's one live region is the header's
      const head = main.getByRole('region', { name: L.title });
      await expect(head.getByText(L.open)).toBeVisible();
      await expect(main.getByRole('status')).toHaveCount(0);
    });

    for (const [vp, size] of Object.entries(H.VIEWPORTS)) {
      test(`${vp}: the header stays pinned and the category bar sticks right under it, no gap, no overlap`, async ({ page }) => {
        await page.setViewportSize(size);
        await H.openPage(page, P.path);
        const total = await page.evaluate(() => document.documentElement.scrollHeight);
        // from the cocktails down to the last category (the bar unsticks only when the menu body ends)
        const cocktailsTop = await page.evaluate(() => document.getElementById('cocktails').getBoundingClientRect().top + scrollY);
        for (const y of [cocktailsTop, cocktailsTop + 400, cocktailsTop + 1500]) {
          if (y > total - size.height) continue;
          await page.evaluate(top => scrollTo(0, top), y);
          await expect(page.getByRole('banner')).toBeInViewport();
          await expect(catbar(page, lang)).toBeInViewport();
          const b = await bars(page, lang);
          expect(b.headerTop, `header pinned at the top (scrollY ${y})`).toBeCloseTo(0, 0);
          expect(Math.abs(b.barTop - b.headerBottom), `bar starts where the header ends (scrollY ${y})`).toBeLessThan(0.75);
        }
        // and further down, past the cocktails, the header is still there
        await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
        await expect(page.getByRole('banner')).toBeInViewport();
        expect((await page.getByRole('banner').boundingBox()).y).toBeCloseTo(0, 0);
      });
    }

    test('the category bar marks the section in view as you scroll', async ({ page }) => {
      await page.setViewportSize(H.VIEWPORTS.phone);
      await H.openPage(page, P.path);
      const nav = catbar(page, lang);
      const sig = nav.getByRole('link', { name: L.sigLink });
      const shots = nav.getByRole('link', { name: L.shotsLink });
      await expect(sig).toHaveAttribute('aria-current', 'true');
      // scroll (not click) until the shots section reaches the bars
      await page.evaluate(() => { const s = document.getElementById('shots'); scrollTo(0, s.getBoundingClientRect().top + scrollY - 160); });
      await expect(shots).toHaveAttribute('aria-current', 'true');
      await expect(sig).not.toHaveAttribute('aria-current', 'true');
      await expect(nav.locator('[aria-current="true"]')).toHaveCount(1);
      // halfway through the cocktails, the cocktails are marked again
      await page.evaluate(() => { const s = document.getElementById('cocktails'); scrollTo(0, s.getBoundingClientRect().top + scrollY + s.offsetHeight / 2); });
      await expect(sig).toHaveAttribute('aria-current', 'true');
      await expect(shots).not.toHaveAttribute('aria-current', 'true');
    });

    test('the category bar lists the menu in order', async ({ page }) => {
      await H.openPage(page, P.path);
      const hrefs = await catbar(page, lang).getByRole('link').evaluateAll(as => as.map(a => a.getAttribute('href')));
      expect(hrefs).toEqual(CATEGORY_IDS.map(id => '#' + id));
    });

    for (const vp of ['phone', 'desktop']) {
      test(`${vp}: category links land with the section heading visible below both bars`, async ({ page }) => {
        await page.setViewportSize(H.VIEWPORTS[vp]);
        await H.openPage(page, P.path);
        const links = catbar(page, lang).getByRole('link');
        const pending = [];
        for (let i = 0; i < CATEGORY_IDS.length; i++) {
          const id = CATEGORY_IDS[i];
          const target = page.locator(`#${id}`);
          if (!(await target.count())) { pending.push(id); continue; }   // an accordion #13 has not built yet
          await page.evaluate(() => scrollTo(0, 0));
          await settled(catbar(page, lang));
          await links.nth(i).click();
          await expect(page).toHaveURL(new RegExp(`#${id}$`));
          // the section's heading (or the accordion's summary row)
          const heading = target.locator(':scope h2, :scope > summary').first();
          await expect(heading).toBeInViewport();
          const box = await heading.boundingBox();
          const b = await bars(page, lang);
          expect(box.y, `#${id}: heading below the category bar`).toBeGreaterThanOrEqual(b.barBottom - 0.5);
          expect(box.y + Math.min(box.height, 40), `#${id}: heading on screen`).toBeLessThanOrEqual(H.VIEWPORTS[vp].height);
          if (await target.evaluate(el => el.tagName === 'DETAILS')) await expect(target).toHaveJSProperty('open', true);
          await expect(links.nth(i)).toHaveAttribute('aria-current', 'true');
        }
        if (pending.length) test.info().annotations.push({ type: 'pending #13', description: `targets not built yet: ${pending.join(', ')}` });
      });
    }

    test('the base-spirit filter narrows the cocktail cards and resets', async ({ page }) => {
      await H.openPage(page, P.path);
      await expect(cards(page, lang)).toHaveCount(13);
      await expect(chip(page, lang, L.all)).toHaveAttribute('aria-pressed', 'true');

      await chip(page, lang, L.vodka).click();
      await expect(chip(page, lang, L.vodka)).toHaveAttribute('aria-pressed', 'true');
      await expect(chip(page, lang, L.all)).toHaveAttribute('aria-pressed', 'false');
      await expect(cardNames(page, lang)).toHaveText(VODKA);

      await chip(page, lang, L.gin).click();
      await expect(cardNames(page, lang)).toHaveText(GIN);
      await expect(chip(page, lang, L.vodka)).toHaveAttribute('aria-pressed', 'false');

      await chip(page, lang, L.all).click();
      await expect(cardNames(page, lang)).toHaveText(ALL_COCKTAILS);
      await expect(chip(page, lang, L.all)).toHaveAttribute('aria-pressed', 'true');
    });

    test('the filter works from the keyboard', async ({ page }) => {
      await H.openPage(page, P.path);
      await chip(page, lang, L.gin).focus();
      await page.keyboard.press('Enter');
      await expect(cardNames(page, lang)).toHaveText(GIN);
      await chip(page, lang, L.all).focus();
      await page.keyboard.press('Space');
      await expect(cards(page, lang)).toHaveCount(13);
    });

    test('desktop: the cocktail cards stand 4 across, with photo, ingredients, size and price', async ({ page }) => {
      await H.openPage(page, P.path);
      const tops = await cards(page, lang).evaluateAll(els => els.slice(0, 5).map(e => Math.round(e.getBoundingClientRect().top)));
      expect(new Set(tops.slice(0, 4)).size).toBe(1);
      expect(tops[4]).toBeGreaterThan(tops[0]);
      const first = cards(page, lang).first();
      await expect(first.getByRole('heading', { level: 3 })).toHaveText('Tarator');
      await expect(first).toContainText('280 ml');
      await expect(first).toContainText(lang === 'bg' ? '10 €' : '€10');
      await expect(first.getByRole('img')).toHaveAccessibleName(lang === 'bg' ? 'Tarator: водка, Скинос, лимон, битер' : 'Tarator: vodka, Skinos, lemon, bitters');
    });

    test('cocktail photos load lazily, sized, and every one resolves', async ({ page }) => {
      const log = H.watchNetwork(page);
      await H.openPage(page, P.path);
      const imgs = cocktails(page, lang).getByRole('img');
      await expect(imgs).toHaveCount(13);
      for (const img of await imgs.all()) {
        await expect(img).toHaveAttribute('loading', 'lazy');
        await expect(img).toHaveAttribute('width', /^\d+$/);
        await expect(img).toHaveAttribute('height', /^\d+$/);
      }
      await H.scrollThrough(page);
      // lazy: each loads once it comes on screen (WebKit skips the ones a fast scroll only flew past)
      for (const img of await imgs.all()) { await img.scrollIntoViewIfNeeded(); await expect.poll(() => img.evaluate(i => i.complete && i.naturalWidth > 0)).toBe(true); }
      await expect.poll(() => imgs.evaluateAll(els => els.every(i => i.complete && i.naturalWidth > 0))).toBe(true);
      H.expectCleanNetwork(log);
    });

    for (const vp of ['phone', 'desktop']) {
      test(`${vp}: no colour seam between the v2 chrome and the menu body`, async ({ page }) => {
        await page.setViewportSize(H.VIEWPORTS[vp]);
        await H.openPage(page, P.path);
        // one pure black from the header (between the mark and the status) down through the title, the category bar row and the cocktails, as in the footer
        const ys = await page.evaluate(() => {
          const r = s => document.querySelector(s).getBoundingClientRect();
          return { header: [(r('header a').right + r('header [role=status]').left) / 2, r('header').top + 32], head: r('main h1').top - 30, bar: r('#cocktails').top - 8, sig: r('#cocktails').top + 30 };
        });
        const samples = {};
        for (const [k, y] of Object.entries(ys)) samples[k] = Array.isArray(y) ? await pixel(page, Math.round(y[0]), Math.round(y[1])) : await pixel(page, 2, Math.round(y));
        await page.getByRole('contentinfo').scrollIntoViewIfNeeded();
        const f = await page.getByRole('contentinfo').boundingBox();
        samples.footer = await pixel(page, 2, Math.round(f.y + 40));
        for (const [k, rgb] of Object.entries(samples)) expect(Math.max(...rgb), `${k} is the room's black (${rgb})`).toBeLessThanOrEqual(3);
      });
    }

    test('language switch goes to the other menu, which has the same categories and cocktails', async ({ page }) => {
      await H.openPage(page, P.path);
      const other = lang === 'bg' ? 'en' : 'bg';
      await page.getByRole('banner').getByRole('group', { name: H.CHROME[lang].langGroup }).getByRole('link', { name: other.toUpperCase() }).click();
      await expect(page).toHaveURL(new RegExp(`${H.page(other, 'menu').path.replace(/\./g, '\\.')}$`));
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(T[other].title);
      await expect(catbar(page, other).getByRole('link')).toHaveCount(CATEGORY_IDS.length);
      await expect(cardNames(page, other)).toHaveText(ALL_COCKTAILS);
    });

    for (const vp of ['phone', 'desktop']) {
      test(`${vp}: axe stays clean with the bars stuck and the filter in use`, async ({ page }) => {
        await page.setViewportSize(H.VIEWPORTS[vp]);
        await H.openPage(page, P.path);
        await chip(page, lang, L.vodka).click();
        await page.evaluate(() => scrollTo(0, document.getElementById('cocktails').getBoundingClientRect().top + scrollY));
        await H.expectNoSeriousA11yViolations(page);
      });
    }
  });

  test.describe(`${P.name} without JavaScript`, () => {
    test.use({ javaScriptEnabled: false });
    test('every cocktail card shows, and the category bar still jumps', async ({ page }) => {
      await H.openPage(page, P.path);
      await expect(cards(page, lang)).toHaveCount(13);
      for (const card of await cards(page, lang).all()) await expect(card).toBeVisible();
      await expect(cardNames(page, lang)).toHaveText(ALL_COCKTAILS);
      // the filter needs script, so it isn't offered as dead buttons
      await expect(page.getByRole('group', { name: L.filter })).toBeHidden();
      // the title, the euro label, and the week's hours in place of the live status
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(L.title);
      await expect(page.getByRole('main').getByRole('region', { name: L.title })).toContainText('18:00–23:30');
      await catbar(page, lang).getByRole('link', { name: L.shotsLink }).click();
      await expect(page).toHaveURL(/#shots$/);
      const b = await bars(page, lang);
      expect(b.headerTop).toBeCloseTo(0, 0);
      expect(Math.abs(b.barTop - b.headerBottom)).toBeLessThan(0.75);
      const h = await page.locator('#shots h2').boundingBox();
      expect(h.y).toBeGreaterThanOrEqual(b.barBottom - 0.5);
    });
  });
}

test('home: the header still scrolls away (only the menu pins it)', async ({ page }) => {
  for (const lang of ['bg', 'en']) {
    await H.openPage(page, H.page(lang, 'home').path);
    const header = page.getByRole('banner');
    await expect(header).toBeInViewport();
    await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
    await expect(header).not.toBeInViewport();
  }
});
