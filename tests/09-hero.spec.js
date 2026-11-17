// #9 Home hero: the lit slogan, the gold call, the slate (status, address, ratings, award). BG + EN.
const { test, expect } = require('@playwright/test');
const H = require('./helpers');

const TEL = 'tel:+359899666633';
const DM = 'https://ig.me/m/oscarclub_official';
const SLOGAN = 'allow yourself to be yourself.';

// What a visitor reads in the hero, per language, exactly as the v2 prototype renders it
const COPY = {
  bg: {
    call: 'Обади се за маса', phone: '+359 899 666 633', dm: 'или пиши в Instagram', dirs: 'Маршрут',
    address: 'ул. „Славянска“ 15', ratings: '4,7 Google (671 отзива) · 4,8 Tripadvisor (141 отзива)', ratingsSeen: '4,7 Google (671) · 4,8 Tripadvisor (141)', award: 'Бранд на годината 2024',
    week: 'Пн–Ср и Нд 18:00–23:30 · Чт до 02:00 · Пт–Сб до 03:00',
    // Fri 22:00 in Sofia: open until 03:00
    status: 'Отворено до 03:00'
  },
  en: {
    call: 'Call to book a table', phone: '+359 899 666 633', dm: 'or message us on Instagram', dirs: 'Directions',
    address: '15 Slavyanska St', ratings: '4.7 Google (671 reviews) · 4.8 Tripadvisor (141 reviews)', ratingsSeen: '4.7 Google (671) · 4.8 Tripadvisor (141)', award: 'Brand of the Year 2024',
    week: 'Mon–Wed & Sun 18:00–23:30 · Thu to 02:00 · Fri–Sat to 03:00',
    status: 'Open now until 03:00'
  }
};
const FRI_22 = '2026-11-20T22:00';

// The hero is the region named by the page's one h1
const hero = pw => pw.getByRole('region', { name: SLOGAN });
const slate = pw => hero(pw).getByRole('list');
const textOf = loc => loc.evaluate(el => el.textContent.replace(/\s+/g, ' ').trim());
// the text drawn on screen: leaves out words that are there for screen readers only (clipped to a 1px box)
const seenText = loc => loc.evaluate(el => {
  const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  let out = '';
  for (let n = w.nextNode(); n; n = w.nextNode()) { const r = n.parentElement.getBoundingClientRect(); if (r.width > 1 && r.height > 1) out += n.data; }
  return out.replace(/\s+/g, ' ').trim();
});

// WCAG relative luminance / contrast of two computed rgb() colours
const contrast = (a, b) => {
  const lum = c => {
    const [r, g, bl] = c.match(/[\d.]+/g).slice(0, 3).map(Number).map(v => v / 255).map(v => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
};

for (const lang of ['bg', 'en']) {
  const P = H.page(lang, 'home');
  const C = COPY[lang];

  test.describe(`${P.name} hero`, () => {
    test('the slogan is the page heading, lit as neon', async ({ page }) => {
      await H.openPage(page, P.path, { now: FRI_22 });
      const h1 = page.getByRole('heading', { level: 1 });
      await expect(h1).toHaveCount(1);
      await expect(h1).toHaveAccessibleName(SLOGAN);
      await expect(h1).toBeVisible();
      // the slogan is English on both pages, so screen readers say it in English
      expect(await h1.evaluate(el => el.closest('[lang]').getAttribute('lang'))).toBe('en');
      await expect(hero(page)).toBeVisible();
      // neon: a glow around the letters (rule 3 allows it on the slogan, the brand mark), once the sign has switched on
      await h1.evaluate(el => Promise.all(el.getAnimations({ subtree: true }).map(a => a.finished)));
      const glow = await h1.evaluate(el => [el, ...el.querySelectorAll('*')].map(e => getComputedStyle(e).textShadow));
      for (const g of glow) expect(g, 'the slogan glows').not.toBe('none');
    });

    test('the gold call, the phone number and the Instagram DM', async ({ page }) => {
      await H.openPage(page, P.path, { now: FRI_22 });
      const call = hero(page).getByRole('link', { name: C.call });
      await expect(call).toBeVisible();
      await expect(call).toHaveAttribute('href', TEL);
      const phone = hero(page).getByRole('link', { name: C.phone });
      await expect(phone).toBeVisible();
      await expect(phone).toHaveAttribute('href', TEL);
      const dm = hero(page).getByRole('link', { name: C.dm });
      await expect(dm).toBeVisible();
      await expect(dm).toHaveAttribute('href', DM);
      await expect(dm).toHaveAttribute('target', '_blank');
      expect(await dm.getAttribute('rel')).toContain('noopener');
      // no booking form anywhere in the hero
      await expect(hero(page).locator('form, input, select, textarea')).toHaveCount(0);
    });

    test('the slate: open-now status, address with directions, ratings, award', async ({ page }) => {
      await H.openPage(page, P.path, { now: FRI_22 });
      const items = slate(page).getByRole('listitem');
      await expect(items).toHaveCount(4);
      await expect(items.nth(0).getByRole('status')).toHaveText(C.status);
      expect(await textOf(items.nth(1))).toBe(`${C.address} ${C.dirs}↗`);
      const dirs = items.nth(1).getByRole('link', { name: C.dirs });
      await expect(dirs).toHaveAttribute('target', '_blank');
      const url = new URL(await dirs.getAttribute('href'));
      expect(url.origin + url.pathname).toBe('https://www.google.com/maps/dir/');
      expect(url.searchParams.get('api')).toBe('1');
      expect(url.searchParams.get('destination')).toMatch(/Slavyanska 15, Sofia/);
      // ratings: Google 4.7 and Tripadvisor 4.8, each with its own review count, as text. On screen the count stands in
      // brackets; a screen reader also hears the word "reviews"
      expect(await textOf(items.nth(2))).toBe(C.ratings);
      expect(await seenText(items.nth(2))).toBe(C.ratingsSeen);
      expect(await textOf(items.nth(3))).toBe(C.award);
      for (let i = 0; i < 4; i++) await expect(items.nth(i)).toBeVisible();
    });

    test('the status follows the Sofia clock', async ({ page }) => {
      await H.openPage(page, P.path, { now: '2026-11-21T02:50' });
      await expect(slate(page).getByRole('status')).toHaveText(lang === 'bg' ? 'Затваря скоро в 03:00' : 'Closing soon at 03:00');
      await H.openPage(page, P.path, { now: '2026-11-16T17:59' });
      await expect(slate(page).getByRole('status')).toHaveText(lang === 'bg' ? 'Затворено отваря днес в 18:00' : 'Closed opens today at 18:00');
    });

    test('the hero glass loads eagerly with fixed dimensions and resolves', async ({ page }) => {
      const log = H.watchNetwork(page);
      await H.openPage(page, P.path);
      const glass = hero(page).locator('img[src$="cocktails/blue.webp"]');
      await expect(glass).toHaveCount(1);
      expect(await glass.getAttribute('loading')).not.toBe('lazy');
      expect(Number(await glass.getAttribute('width'))).toBeGreaterThan(0);
      expect(Number(await glass.getAttribute('height'))).toBeGreaterThan(0);
      await expect(glass).toBeVisible();
      expect(await glass.evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
      // decorative: the drink is shown, not described (the heading carries the meaning)
      await expect(glass).toHaveAttribute('alt', '');
      // the award image too has width/height
      const award = hero(page).locator('img[src$="award-2024.webp"]');
      await expect(award).toHaveAttribute('width', '28');
      await expect(award).toHaveAttribute('height', '28');
      await page.waitForLoadState('networkidle');
      H.expectCleanNetwork(log);
    });

    test('the gold label reads dark on gold (AA), and no UI element glows', async ({ page }) => {
      await H.openPage(page, P.path, { now: FRI_22, query: {} });
      const call = hero(page).getByRole('link', { name: C.call });
      const { fg, bg } = await call.evaluate(el => { const cs = getComputedStyle(el); return { fg: cs.color, bg: cs.backgroundColor }; });
      expect(contrast(fg, bg), `${fg} on ${bg}`).toBeGreaterThanOrEqual(4.5);
      // dark ink: the label is darker than the gold
      expect(fg).toMatch(/^rgb\((\d{1,2}), (\d{1,2}), (\d{1,2})\)$/);
      // no glow on the button, the phone/DM links or anything in the slate
      const ui = hero(page).locator('a, a *, ul, li, li *');
      const lit = await ui.evaluateAll(els => els.map(el => {
        const cs = getComputedStyle(el);
        return { name: el.textContent.trim().slice(0, 30), shadow: cs.textShadow, box: cs.boxShadow, filter: cs.filter };
      }).filter(x => x.shadow !== 'none' || x.box !== 'none' || x.filter !== 'none'));
      expect(lit, 'UI elements with a glow').toEqual([]);
    });

    test('without JavaScript the hero is whole: the week\'s hours, the call and every link', async ({ browser }) => {
      const ctx = await browser.newContext({ javaScriptEnabled: false });
      const pw = await ctx.newPage();
      await H.openPage(pw, P.path);
      await expect(slate(pw).getByRole('status')).toHaveText(C.week);
      await expect(hero(pw).getByRole('link', { name: C.call })).toHaveAttribute('href', TEL);
      await expect(hero(pw).getByRole('link', { name: C.dm })).toHaveAttribute('href', DM);
      await expect(hero(pw).getByRole('link', { name: C.dirs })).toBeVisible();
      expect(await textOf(slate(pw).getByRole('listitem').nth(2))).toBe(C.ratings);
      await ctx.close();
    });

    test('the sign switches on with a flicker when motion is welcome', async ({ browser }) => {
      const ctx = await browser.newContext({ reducedMotion: 'no-preference' });
      const pw = await ctx.newPage();
      await H.openPage(pw, P.path);
      const h1 = pw.getByRole('heading', { level: 1 });
      const names = await h1.evaluate(el => el.getAnimations({ subtree: true }).map(a => a.animationName));
      expect(names.length).toBeGreaterThan(0);
      expect(new Set(names)).toEqual(new Set(['v2-flicker']));
      // it plays once, then the sign stays lit
      await h1.evaluate(el => Promise.all(el.getAnimations({ subtree: true }).map(a => a.finished)));
      const after = await h1.evaluate(el => [...el.children].map(e => getComputedStyle(e).opacity));
      expect(after.every(o => o === '1')).toBe(true);
      await ctx.close();
    });

    test('with reduced motion the slogan has no flicker and is simply lit', async ({ browser }) => {
      const ctx = await browser.newContext({ reducedMotion: 'reduce' });
      const pw = await ctx.newPage();
      await H.openPage(pw, P.path);
      const anims = await hero(pw).evaluate(el => el.getAnimations({ subtree: true }).map(a => a.animationName || a.constructor.name));
      expect(anims, 'animations in the hero').toEqual([]);
      const h1 = pw.getByRole('heading', { level: 1 });
      const lit = await h1.evaluate(el => [...el.children].map(e => ({ o: getComputedStyle(e).opacity, s: getComputedStyle(e).textShadow })));
      for (const l of lit) { expect(l.o).toBe('1'); expect(l.s).not.toBe('none'); }
      await ctx.close();
    });

    for (const vp of ['phone', 'desktop']) {
      test(`no layout shift in the hero once the fonts and the glass arrive (${vp})`, async ({ browser }) => {
        const ctx = await browser.newContext({ viewport: H.VIEWPORTS[vp], reducedMotion: 'reduce' });
        const pw = await ctx.newPage();
        // hold back the fonts and the glass so the first paint uses the fallback face and an empty image box
        await pw.route(/\.(woff2|webp)(\?|$)/, async route => { await new Promise(r => setTimeout(r, 700)); await route.continue(); });
        await pw.addInitScript(() => {
          window.__heroShift = 0;
          new PerformanceObserver(list => {
            for (const e of list.getEntries()) {
              if (e.hadRecentInput) continue;
              if (e.sources.some(s => s.node && s.node.closest && s.node.closest('main > section:first-child'))) window.__heroShift += e.value;
            }
          }).observe({ type: 'layout-shift', buffered: true });
        });
        await H.openPage(pw, P.path);
        await pw.evaluate(() => document.fonts.ready);
        await pw.waitForLoadState('networkidle');
        await pw.waitForTimeout(200);
        const loaded = await pw.evaluate(() => [...document.fonts].filter(f => f.status === 'loaded').map(f => f.family.replace(/"/g, '')));
        expect(loaded).toEqual(expect.arrayContaining(['Poiret One', 'Cormorant']));
        expect(await pw.evaluate(() => window.__heroShift)).toBeLessThan(0.01);
        await ctx.close();
      });
    }

    for (const vp of ['phone', 'desktop']) {
      test(`axe: no serious or critical violations (${vp})`, async ({ page }) => {
        await page.setViewportSize(H.VIEWPORTS[vp]);
        await H.openPage(page, P.path, { now: FRI_22 });
        await H.expectNoSeriousA11yViolations(page);
      });
    }

    test('every hero link and the call button are reachable by keyboard with a visible ring', async ({ page }) => {
      await H.openPage(page, P.path, { now: FRI_22 });
      const seen = await H.tabThrough(page);
      for (const name of [C.call, C.phone, C.dm, C.dirs]) {
        const hit = seen.filter(s => s.name.includes(name));
        expect(hit.length, `${name} is in the tab order`).toBeGreaterThan(0);
        for (const h of hit) expect(h.ring, `${name} shows a focus ring`).toBe(true);
      }
    });
  });
}

test.describe('hero parity', () => {
  const heroFacts = async (pw, path) => {
    await H.openPage(pw, path, { now: FRI_22 });
    const links = await hero(pw).getByRole('link').evaluateAll(as => as.map(a => ({ href: a.getAttribute('href'), target: a.getAttribute('target') })));
    const items = await slate(pw).getByRole('listitem').evaluateAll(lis => lis.map(li => ({
      status: !!li.querySelector('[role="status"]'),
      links: [...li.querySelectorAll('a')].map(a => a.getAttribute('href')),
      numbers: (li.textContent.match(/\d+(?:[.,]\d+)?/g) || []).map(n => n.replace(',', '.')),
      images: [...li.querySelectorAll('img')].map(i => i.getAttribute('src').replace(/^(\.\.\/)+/, ''))
    })));
    const glass = await hero(pw).locator('img').first().getAttribute('src');
    return { links, items, glass: glass.replace(/^(\.\.\/)+/, '') };
  };

  test('BG and EN heroes have the same links and the same slate items, in the same order', async ({ page }) => {
    const bg = await heroFacts(page, H.page('bg', 'home').path);
    const en = await heroFacts(page, H.page('en', 'home').path);
    expect(bg.links.length).toBe(4);
    expect(en.links).toEqual(bg.links);
    expect(en.items).toEqual(bg.items);
    expect(en.glass).toBe(bg.glass);
    // and they say the same thing: the clock line, the street number, the two ratings and their review counts, the year
    expect(bg.items.map(i => i.numbers)).toEqual([['03', '00'], ['15'], ['4.7', '671', '4.8', '141'], ['2024']]);
  });
});
