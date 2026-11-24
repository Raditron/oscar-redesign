// #8 Site skeleton: pages, chrome, open-now status, language switch, fonts, integrity, accessibility.
const { test, expect } = require('@playwright/test');
const H = require('./helpers');

// Sofia local times (week of Mon 16 Nov 2026) and what the status says, as the prototype's logic gives it
const CASES = [
  { when: 'Mon 17:59', now: '2026-11-16T17:59', bg: 'Затворено отваря днес в 18:00', en: 'Closed opens today at 18:00' },
  { when: 'Mon 23:00', now: '2026-11-16T23:00', bg: 'Затваря скоро в 23:30', en: 'Closing soon at 23:30' },
  { when: 'Thu 01:30 (Wednesday night, closed at 23:30)', now: '2026-11-19T01:30', bg: 'Затворено отваря днес в 18:00', en: 'Closed opens today at 18:00' },
  // Thursday night runs to 02:00. At 01:30 that is 30 minutes away, so the unchanged prototype logic (≤ 45 min) says
  // "closing soon"; 01:00 shows the plain "open until 02:00"
  { when: 'Fri 01:00 (Thursday night)', now: '2026-11-20T01:00', bg: 'Отворено до 02:00', en: 'Open now until 02:00' },
  { when: 'Fri 01:30 (Thursday night)', now: '2026-11-20T01:30', bg: 'Затваря скоро в 02:00', en: 'Closing soon at 02:00' },
  { when: 'Sat 02:50 (Friday night)', now: '2026-11-21T02:50', bg: 'Затваря скоро в 03:00', en: 'Closing soon at 03:00' },
  { when: 'Sun 12:00', now: '2026-11-22T12:00', bg: 'Затворено отваря днес в 18:00', en: 'Closed opens today at 18:00' },
  { when: 'Sun 23:50 (after close)', now: '2026-11-22T23:50', bg: 'Затворено отваря утре в 18:00', en: 'Closed opens tomorrow at 18:00' }
];

test.describe('open-now status (Sofia time)', () => {
  for (const lang of ['bg', 'en']) {
    for (const c of CASES) {
      test(`${lang.toUpperCase()} · ${c.when} → ${c[lang]}`, async ({ page }) => {
        await H.openPage(page, H.page(lang, 'home').path, { now: c.now });
        await expect(H.headerStatus(page)).toHaveText(c[lang]);
      });
    }
  }

  test('the menu pages show the same status', async ({ page }) => {
    for (const lang of ['bg', 'en']) {
      await H.openPage(page, H.page(lang, 'menu').path, { now: '2026-11-21T02:50' });
      await expect(H.headerStatus(page)).toHaveText(CASES[5][lang]);
    }
  });

  test('without an override it follows the real clock in Sofia, not the visitor\'s timezone', async ({ page }) => {
    // the browser runs in New York (playwright.config.js). 15:59 UTC on Mon 16 Nov = 17:59 in Sofia (UTC+2)
    await page.clock.setFixedTime(new Date('2026-11-16T15:59:00Z'));
    await H.openPage(page, '/index.html');
    await expect(H.headerStatus(page)).toHaveText('Затворено отваря днес в 18:00');
    // 23:30 UTC on Fri 20 Nov = 01:30 on Saturday in Sofia: still Friday night, open until 03:00
    await page.clock.setFixedTime(new Date('2026-11-20T23:30:00Z'));
    await H.openPage(page, '/en/index.html');
    await expect(H.headerStatus(page)).toHaveText('Open now until 03:00');
  });

  test('a clock set with window.OC_NOW before the script is honoured', async ({ page }) => {
    await page.addInitScript(() => { window.OC_NOW = '2026-11-21T02:50'; });
    await H.openPage(page, '/en/index.html');
    await expect(H.headerStatus(page)).toHaveText('Closing soon at 03:00');
  });

  test('on a phone the header shows the short status (label only)', async ({ page }) => {
    await page.setViewportSize(H.VIEWPORTS.phone);
    await H.openPage(page, '/index.html', { now: '2026-11-16T17:59' });
    const status = H.headerStatus(page);
    await expect(status.getByText('Затворено')).toBeVisible();
    await expect(status.getByText('отваря днес в 18:00')).toBeHidden();
  });
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  for (const p of H.PAGES) {
    test(`${p.name}: the status region shows the week's hours`, async ({ page }) => {
      await H.openPage(page, p.path);
      const status = H.headerStatus(page);
      await expect(status).toBeVisible();
      await expect(status).toHaveText(p.lang === 'bg'
        ? 'Пн–Ср и Нд 18:00–23:30 · Чт до 02:00 · Пт–Сб до 03:00'
        : 'Mon–Wed & Sun 18:00–23:30 · Thu to 02:00 · Fri–Sat to 03:00');
    });
  }
});

test.describe('pages and chrome', () => {
  for (const p of H.PAGES) {
    test(`${p.name}: language, landmarks, header, footer`, async ({ page }) => {
      await H.openPage(page, p.path);
      await expect(page.locator('html')).toHaveAttribute('lang', p.lang);
      const T = H.CHROME[p.lang];
      await expect(page.getByRole('banner')).toBeVisible();
      await expect(page.getByRole('main')).toHaveCount(1);
      await expect(page.getByRole('contentinfo')).toBeVisible();
      await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
      // the lit OC mark in the header (a link home) and in the footer
      await expect(page.getByRole('banner').getByRole('link', { name: /Oscar Club/ })).toBeVisible();
      await expect(page.getByRole('contentinfo').getByRole('img', { name: 'Oscar Club' })).toBeVisible();
      await expect(page.getByRole('contentinfo').getByRole('link', { name: '+359 899 666 633' })).toHaveAttribute('href', 'tel:+359899666633');
      await expect(page.getByRole('contentinfo').getByRole('link', { name: 'Instagram' })).toHaveAttribute('href', 'https://www.instagram.com/oscarclub_official/');
      await expect(page.getByRole('contentinfo').getByRole('link', { name: 'Facebook' })).toHaveAttribute('href', 'https://www.facebook.com/OscarClub.sf');
      // desktop header: nav with the menu + the four home sections, and the phone number
      const nav = page.getByRole('navigation', { name: T.mainNav });
      await expect(nav.getByRole('link')).toHaveCount(5);
      await expect(page.getByRole('banner').getByRole('link', { name: '+359 899 666 633' })).toBeVisible();
    });
  }

  test('home: header links lead to sections that exist', async ({ page }) => {
    for (const lang of ['bg', 'en']) {
      await H.openPage(page, H.page(lang, 'home').path);
      const hrefs = await page.getByRole('navigation', { name: H.CHROME[lang].mainNav }).getByRole('link').evaluateAll(as => as.map(a => a.getAttribute('href')));
      expect(hrefs[0]).toBe('mainmenu/index.html');
      for (const h of hrefs.slice(1)) {
        expect(h).toMatch(/^#/);
        await expect(page.locator(h), `${lang}: target of ${h}`).toHaveCount(1);
      }
    }
  });

  test('menu: header links lead back to the home sections, and Menu is the current page', async ({ page }) => {
    await H.openPage(page, '/en/mainmenu/index.html');
    const nav = page.getByRole('navigation', { name: 'Main' });
    await expect(nav.getByRole('link', { name: 'Menu' })).toHaveAttribute('aria-current', 'page');
    await nav.getByRole('link', { name: 'Music' }).click();
    await expect(page).toHaveURL(/\/en\/index\.html#music$/);
    await expect(page.locator('#music')).toHaveCount(1);
  });

  test('home: the header scrolls away with the page', async ({ page }) => {
    await H.openPage(page, '/index.html');
    const header = page.getByRole('banner');
    await expect(header).toBeInViewport();
    await page.evaluate(() => scrollTo(0, 600));
    await expect(header).not.toBeInViewport();
  });

  for (const lang of ['bg', 'en']) {
    test(`${lang.toUpperCase()}: the thumb bar shows on phones only`, async ({ page }) => {
      const T = H.CHROME[lang];
      await page.setViewportSize(H.VIEWPORTS.phone);
      await H.openPage(page, H.page(lang, 'home').path);
      const bar = page.getByRole('navigation', { name: T.quick });
      await expect(bar).toBeVisible();
      await expect(bar.getByRole('link').first()).toHaveAttribute('href', 'tel:+359899666633');
      await expect(bar.getByRole('link')).toHaveCount(3);
      // stays within thumb reach while scrolling
      await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight / 2));
      await expect(bar).toBeInViewport();
      await page.setViewportSize(H.VIEWPORTS.desktop);
      await expect(bar).toBeHidden();
    });
  }
});

test.describe('language switch, canonical, hreflang', () => {
  for (const p of H.PAGES) {
    test(`${p.name}: switch lands on the same page in the other language`, async ({ page }) => {
      await H.openPage(page, p.path);
      const group = page.getByRole('group', { name: H.CHROME[p.lang].langGroup });
      const here = group.getByRole('link', { name: p.lang.toUpperCase() });
      await expect(here).toHaveAttribute('aria-current', 'page');
      const otherLang = p.lang === 'bg' ? 'en' : 'bg';
      const there = group.getByRole('link', { name: otherLang.toUpperCase() });
      await expect(there).not.toHaveAttribute('aria-current', /.+/);
      await there.click();
      await expect(page).toHaveURL(new RegExp(`${p.otherLang.replace(/\./g, '\\.')}$`));
      await expect(page.locator('html')).toHaveAttribute('lang', otherLang);
      // and back again
      await page.getByRole('group', { name: H.CHROME[otherLang].langGroup }).getByRole('link', { name: p.lang.toUpperCase() }).click();
      await expect(page).toHaveURL(new RegExp(`${p.path.replace(/\./g, '\\.')}$`));
    });

    test(`${p.name}: canonical and hreflang`, async ({ page }) => {
      await H.openPage(page, p.path);
      const bg = H.page('bg', p.kind).url, en = H.page('en', p.kind).url;
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', p.url);
      await expect(page.locator('link[rel="alternate"][hreflang="bg"]')).toHaveAttribute('href', bg);
      await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute('href', en);
      await expect(page.locator('link[rel="alternate"][hreflang="x-default"]')).toHaveAttribute('href', bg);
      await expect(page.locator('link[rel="alternate"][hreflang]')).toHaveCount(3);
    });
  }
});

test.describe('integrity: no 404s, nothing asked of anyone but the site and its backend, self-hosted fonts', () => {
  for (const p of H.PAGES) {
    for (const vp of ['phone', 'desktop']) {
      test(`${p.name} · ${vp}`, async ({ page }) => {
        await page.setViewportSize(H.VIEWPORTS[vp]);
        const log = H.watchNetwork(page);
        await H.openPage(page, p.path);
        await H.scrollThrough(page);
        await page.evaluate(() => document.fonts.ready);
        await page.waitForLoadState('networkidle');
        H.expectCleanNetwork(log);
        await H.expectLocalReferencesResolve(page);
        // the three faces load from this site
        const loaded = await page.evaluate(() => [...document.fonts].filter(f => f.status === 'loaded').map(f => f.family.replace(/"/g, '')));
        for (const fam of ['Poiret One', 'Onest', 'Cormorant']) expect(loaded, `${fam} loaded`).toContain(fam);
        expect(log.requests.filter(u => /\.woff2$/.test(u)).every(u => new URL(u).pathname.includes('/assets/fonts/'))).toBe(true);
      });
    }
  }
});

test.describe('accessibility', () => {
  for (const p of H.PAGES) {
    for (const vp of ['phone', 'desktop']) {
      test(`${p.name} · ${vp}: axe finds no serious or critical violations`, async ({ page }) => {
        await page.setViewportSize(H.VIEWPORTS[vp]);
        await H.openPage(page, p.path, { now: '2026-11-20T01:00' });
        await H.expectNoSeriousA11yViolations(page);
      });
    }
  }

  for (const p of [H.page('bg', 'home'), H.page('en', 'menu')]) {
    test(`${p.name}: the skip link is the first stop, shows on focus and moves focus to the content`, async ({ page, browserName }) => {
      test.skip(browserName === 'webkit', H.WEBKIT_TAB);
      await page.setViewportSize(H.VIEWPORTS.phone);
      await H.openPage(page, p.path);
      await page.keyboard.press('Tab');
      const skip = page.getByRole('link', { name: H.CHROME[p.lang].skip });
      await expect(skip).toBeFocused();
      await expect(skip).toBeInViewport();
      await page.keyboard.press('Enter');
      await expect(page.getByRole('main')).toBeFocused();
    });
  }

  for (const p of H.PAGES) {
    for (const vp of ['phone', 'desktop']) {
      test(`${p.name} · ${vp}: every link reached by Tab shows a focus ring`, async ({ page, browserName }) => {
        test.skip(browserName === 'webkit', H.WEBKIT_TAB);
        await page.setViewportSize(H.VIEWPORTS[vp]);
        await H.openPage(page, p.path);
        const stops = await H.tabThrough(page);
        expect(stops.length).toBeGreaterThan(5);
        expect(stops.filter(s => !s.ring), 'focused without a visible ring').toEqual([]);
        // the order starts with the skip link, then the brand
        expect(stops[0].name).toBe(H.CHROME[p.lang].skip);
        expect(stops[1].name).toMatch(/^Oscar Club/);
      });
    }
  }
});
