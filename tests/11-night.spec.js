// #11 Home: music, events (the gold room) and visit — the week of hours, contacts, copy buttons, header landings.
const { test, expect } = require('@playwright/test');
const H = require('./helpers');

const DIR = 'https://www.google.com/maps/dir/?api=1&destination=Oscar+Club+Cocktail+bar%2C+Slavyanska+15%2C+Sofia';
const IG = 'https://www.instagram.com/oscarclub_official/';
const FB = 'https://www.facebook.com/OscarClub.sf';
const EVENTS_MAIL = 'events@oscarclubsofia.com';
const EVENTS_TEL = '+359 883 30 50 55';

const T = {
  bg: {
    music: 'В събота често има DJ.', events: 'Празнуваш другаде? Барът идва с теб.', visit: 'Славянска 15', hours: 'Работно време',
    nav: { music: 'Музика', events: 'Събития', visit: 'Посещение' },
    musicAlt: 'DJ пуска музика под медния полилей в Оскар клуб',
    days: ['Понеделник', 'Вторник', 'Сряда', 'Четвъртък', 'Петък', 'Събота', 'Неделя'],
    copyMail: 'Копирай имейла за събития', copyTel: 'Копирай телефона за събития', copied: 'Копирано',
    access: /Входът и паркингът са достъпни с инвалидна количка/, directions: 'Маршрут'
  },
  en: {
    music: 'Saturdays often have a DJ.', events: 'Party somewhere else? The bar comes with you.', visit: 'Slavyanska 15', hours: 'Opening hours',
    nav: { music: 'Music', events: 'Events', visit: 'Visit' },
    musicAlt: 'A DJ playing under the copper chandelier at Oscar Club',
    days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    copyMail: 'Copy the events email', copyTel: 'Copy the events phone number', copied: 'Copied',
    access: /wheelchair-accessible entrance and car park/, directions: 'Directions'
  }
};

const section = (page, lang, key) => page.getByRole('region', { name: T[lang][key] });
const week = (page, lang) => page.getByRole('table', { name: T[lang].hours });
/** Names of the rows marked as tonight (aria-current="date"). */
const markedRows = async (page, lang) => week(page, lang).locator('tr[aria-current="date"]').locator('th').allInnerTexts();

// Sofia local times (week of Mon 16 Nov 2026) → the night it is (index into T.days, Monday first)
const NIGHTS = [
  { when: 'Mon 20:00', now: '2026-11-16T20:00', night: 0 },
  { when: 'Mon 12:00 (before opening, today is still today)', now: '2026-11-16T12:00', night: 0 },
  { when: 'Tue 00:30 (Monday closed at 23:30)', now: '2026-11-17T00:30', night: 1 },
  { when: 'Thu 23:00', now: '2026-11-19T23:00', night: 3 },
  { when: 'Fri 01:30 (still Thursday night, open until 02:00)', now: '2026-11-20T01:30', night: 3 },
  { when: 'Fri 02:30 (Thursday night is over)', now: '2026-11-20T02:30', night: 4 },
  { when: 'Sat 02:50 (still Friday night)', now: '2026-11-21T02:50', night: 4 },
  { when: 'Sun 01:00 (still Saturday night)', now: '2026-11-22T01:00', night: 5 },
  { when: 'Sun 12:00', now: '2026-11-22T12:00', night: 6 }
];

test.describe('the three sections', () => {
  for (const lang of ['bg', 'en']) {
    test(`${lang.toUpperCase()}: music, events and visit are there, in order, with their content`, async ({ page }) => {
      await H.openPage(page, H.page(lang, 'home').path);
      const t = T[lang];
      const ids = await page.locator('main > section').evaluateAll(s => s.map(x => x.id).filter(Boolean));
      expect(ids.slice(ids.indexOf('music'))).toEqual(['music', 'events', 'visit']);

      const music = section(page, lang, 'music');
      await expect(music.getByRole('heading', { level: 2 })).toHaveText(t.music);
      await expect(music.getByRole('img', { name: t.musicAlt })).toBeAttached();
      await expect(music.getByRole('listitem')).toHaveCount(2);
      await expect(music.getByRole('link', { name: /@oscarclub_official/ })).toHaveAttribute('href', IG);

      const events = section(page, lang, 'events');
      await expect(events.getByRole('heading', { level: 2 })).toHaveText(t.events);
      await expect(events.getByRole('link', { name: EVENTS_MAIL })).toHaveAttribute('href', `mailto:${EVENTS_MAIL}`);
      await expect(events.getByRole('link', { name: EVENTS_TEL })).toHaveAttribute('href', 'tel:+359883305055');

      const visit = section(page, lang, 'visit');
      await expect(visit.getByRole('heading', { level: 2 })).toHaveText(t.visit);
      await expect(visit.getByRole('heading', { level: 3, name: t.hours })).toBeVisible();
      // the address is the directions link, and so is the button
      await expect(visit.getByRole('link', { name: t.visit })).toHaveAttribute('href', DIR);
      await expect(visit.getByRole('link', { name: t.directions })).toHaveAttribute('href', DIR);
      await expect(visit.getByRole('link', { name: '+359 899 666 633' })).toHaveAttribute('href', 'tel:+359899666633');
      await expect(visit.getByRole('link', { name: 'oscarclub.sf@gmail.com' })).toHaveAttribute('href', 'mailto:oscarclub.sf@gmail.com');
      await expect(visit.getByRole('link', { name: '@oscarclub_official' })).toHaveAttribute('href', IG);
      await expect(visit.getByRole('link', { name: 'OscarClub.sf', exact: true })).toHaveAttribute('href', FB);
      await expect(visit.getByText(t.access)).toBeVisible();
      // outbound links open in a new tab, safely
      for (const a of await visit.locator('a[href^="http"]').all()) {
        await expect(a).toHaveAttribute('target', '_blank');
        await expect(a).toHaveAttribute('rel', /noopener/);
      }
    });
  }

  test('the music and storefront photos load', async ({ page }) => {
    for (const lang of ['bg', 'en']) {
      await H.openPage(page, H.page(lang, 'home').path);
      await H.scrollThrough(page);
      for (const id of ['music', 'visit']) {
        const img = page.locator(`#${id} img`);
        await expect.poll(() => img.evaluate(i => i.complete && i.naturalWidth)).toBeGreaterThan(0);
      }
    }
  });
});

test.describe('the week of hours: tonight is marked (Sofia time)', () => {
  for (const lang of ['bg', 'en']) {
    for (const c of NIGHTS) {
      test(`${lang.toUpperCase()} · ${c.when} → ${T.en.days[c.night]}`, async ({ page }) => {
        await H.openPage(page, H.page(lang, 'home').path, { now: c.now });
        await expect(week(page, lang).getByRole('row')).toHaveCount(7);
        expect(await markedRows(page, lang)).toEqual([T[lang].days[c.night]]);
      });
    }
  }

  test('the line beside the heading says the same as the header', async ({ page }) => {
    await H.openPage(page, '/index.html', { now: '2026-11-20T01:30' });
    await expect(section(page, 'bg', 'visit').getByText('Затваря скоро в 02:00')).toBeVisible();
    await H.openPage(page, '/en/index.html', { now: '2026-11-21T22:00' });
    await expect(section(page, 'en', 'visit').getByText('Open now until 03:00')).toBeVisible();
  });

  test('the brass bar is on tonight only', async ({ page }) => {
    await H.openPage(page, '/en/index.html', { now: '2026-11-21T02:50' });
    const colours = await week(page, 'en').getByRole('row').evaluateAll(rows => rows.map(r => getComputedStyle(r.querySelector('td i') || r).backgroundColor));
    expect(colours.filter(c => c === 'rgb(232, 201, 106)')).toHaveLength(1);   // --brass-hi
    expect(colours[4]).toBe('rgb(232, 201, 106)');                               // Friday
  });

  test('without an override it follows the real clock in Sofia', async ({ page }) => {
    // the browser runs in New York. 23:30 UTC on Fri 20 Nov = 01:30 on Saturday in Sofia: still Friday night
    await page.clock.setFixedTime(new Date('2026-11-20T23:30:00Z'));
    await H.openPage(page, '/en/index.html');
    expect(await markedRows(page, 'en')).toEqual(['Friday']);
  });
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  for (const lang of ['bg', 'en']) {
    test(`${lang.toUpperCase()}: the full week, no row marked, every contact a working link, no copy buttons`, async ({ page }) => {
      await H.openPage(page, H.page(lang, 'home').path, { now: '2026-11-20T23:00' });
      const t = T[lang];
      const rows = week(page, lang).getByRole('row');
      await expect(rows).toHaveCount(7);
      for (const [i, day] of t.days.entries()) {
        await expect(rows.nth(i)).toBeVisible();
        await expect(rows.nth(i).getByRole('rowheader')).toHaveText(day);
        await expect(rows.nth(i)).toContainText(i === 3 ? '18:00 – 02:00' : i === 4 || i === 5 ? '18:00 – 03:00' : '18:00 – 23:30');
      }
      expect(await markedRows(page, lang)).toEqual([]);
      const events = section(page, lang, 'events');
      await expect(events.getByRole('link', { name: EVENTS_MAIL })).toBeVisible();
      await expect(events.getByRole('link', { name: EVENTS_TEL })).toBeVisible();
      await expect(events.getByRole('button')).toHaveCount(0);
      const visit = section(page, lang, 'visit');
      for (const name of [t.visit, t.directions, '+359 899 666 633', 'oscarclub.sf@gmail.com', '@oscarclub_official', 'OscarClub.sf']) {
        await expect(visit.getByRole('link', { name, exact: true })).toBeVisible();
      }
    });
  }
});

test.describe('copy buttons on the events contacts', () => {
  test.use({ permissions: ['clipboard-read', 'clipboard-write'] });
  for (const lang of ['bg', 'en']) {
    test(`${lang.toUpperCase()}: each copies the exact value and says so`, async ({ page }) => {
      await H.openPage(page, H.page(lang, 'home').path);
      const t = T[lang];
      const events = section(page, lang, 'events');
      const status = events.getByRole('status');
      await expect(status).toBeEmpty();
      for (const [name, value] of [[t.copyMail, EVENTS_MAIL], [t.copyTel, EVENTS_TEL]]) {
        const btn = events.getByRole('button', { name });
        await expect(btn).toBeVisible();
        await btn.click();
        await expect(status).toHaveText(`${t.copied}: ${value}`);
        expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(value);
        await expect(btn).toBeFocused();
      }
    });
  }

  test('works from the keyboard, and the same copy twice is said again', async ({ page }) => {
    await H.openPage(page, '/en/index.html');
    const events = section(page, 'en', 'events');
    const btn = events.getByRole('button', { name: T.en.copyTel });
    await btn.focus();
    await page.keyboard.press('Enter');
    await expect(events.getByRole('status')).toHaveText(`Copied: ${EVENTS_TEL}`);
    await page.evaluate(() => navigator.clipboard.writeText('something else'));
    await page.keyboard.press('Space');
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(EVENTS_TEL);
    await expect(events.getByRole('status')).toHaveText(`Copied: ${EVENTS_TEL}`);
  });
});

test.describe('header links land on their sections', () => {
  for (const lang of ['bg', 'en']) {
    test(`${lang.toUpperCase()}: music, events and visit open with the heading in view, nothing over it`, async ({ page }) => {
      await page.setViewportSize(H.VIEWPORTS.desktop);
      await H.openPage(page, H.page(lang, 'home').path);
      for (const key of ['music', 'events', 'visit']) {
        await page.evaluate(() => scrollTo(0, 0));
        await page.getByRole('navigation', { name: H.CHROME[lang].mainNav }).getByRole('link', { name: T[lang].nav[key], exact: true }).click();
        await expect(page).toHaveURL(new RegExp(`#${key}$`));
        const heading = section(page, lang, key).getByRole('heading', { level: 2 });
        await expect(heading).toBeInViewport({ ratio: 1 });
        // the topmost thing at the heading's centre is the heading itself (not a bar or header over it)
        const onTop = await heading.evaluate(h => { const r = h.getBoundingClientRect(); const el = document.elementFromPoint(r.left + Math.min(40, r.width / 2), r.top + r.height / 2); return !!el && h.contains(el); });
        expect(onTop, `${key} heading is not covered`).toBe(true);
        const top = await heading.evaluate(h => h.getBoundingClientRect().top);
        expect(top).toBeGreaterThanOrEqual(0);
      }
    });
  }
});

test.describe('the gold room', () => {
  for (const lang of ['bg', 'en']) {
    test(`${lang.toUpperCase()}: gold is a surface only in the events room, and the ink on it is AA`, async ({ page }) => {
      await H.openPage(page, H.page(lang, 'home').path);
      await page.locator('#events').evaluate(() => {}); // page ready
      const result = await page.evaluate(() => {
        const rgb = s => (s.match(/[\d.]+/g) || []).map(Number);
        const lum = ([r, g, b]) => [r, g, b].map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }).reduce((a, v, i) => a + v * [0.2126, 0.7152, 0.0722][i], 0);
        const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
        const isGold = c => { const [r, g, b, a = 1] = rgb(c); return a > 0.5 && r > 150 && g > 120 && b < 130 && r - b > 60; };
        // every big painted surface on the page (wider than half the viewport): only the events room may be gold
        const goldSurfaces = [...document.querySelectorAll('body *')].filter(el => {
          const r = el.getBoundingClientRect();
          return r.width > innerWidth / 2 && r.height > 200 && isGold(getComputedStyle(el).backgroundColor);
        }).map(el => el.id || el.className);
        const ev = document.getElementById('events');
        const bg = rgb(getComputedStyle(ev).backgroundColor);
        // every piece of text in the room, its colour blended onto the brass
        const low = [];
        const walker = document.createTreeWalker(ev, NodeFilter.SHOW_TEXT);
        for (let n = walker.nextNode(); n; n = walker.nextNode()) {
          if (!n.textContent.trim()) continue;
          const el = n.parentElement; if (!el.getClientRects().length) continue;
          const [r, g, b, a = 1] = rgb(getComputedStyle(el).color);
          const ink = [r * a + bg[0] * (1 - a), g * a + bg[1] * (1 - a), b * a + bg[2] * (1 - a)];
          const cr = ratio(ink, bg);
          if (cr < 4.5) low.push(`${n.textContent.trim().slice(0, 30)}: ${cr.toFixed(2)}`);
        }
        return { goldSurfaces, low };
      });
      expect(result.goldSurfaces).toEqual(['events']);
      expect(result.low, 'text on the brass below 4.5:1').toEqual([]);
    });
  }
});

test.describe('BG and EN parity', () => {
  test('the same contacts and links in music, events and visit', async ({ page }) => {
    const links = {};
    for (const lang of ['bg', 'en']) {
      await H.openPage(page, H.page(lang, 'home').path);
      links[lang] = await page.locator('#music a, #events a, #visit a').evaluateAll(as => as.map(a => a.getAttribute('href')));
    }
    expect(links.en).toEqual(links.bg);
    const want = ['tel:+359899666633', `mailto:oscarclub.sf@gmail.com`, 'tel:+359883305055', `mailto:${EVENTS_MAIL}`, DIR, IG, FB];
    for (const h of want) expect(links.bg.map(x => x.replace(/&amp;/g, '&')), h).toContain(h);
  });

  test('the same copy buttons', async ({ page }) => {
    const values = {};
    for (const lang of ['bg', 'en']) {
      await H.openPage(page, H.page(lang, 'home').path);
      values[lang] = await page.locator('#events').getByRole('button').evaluateAll(bs => bs.map(b => b.dataset.copy));
    }
    expect(values.bg).toEqual([EVENTS_MAIL, EVENTS_TEL]);
    expect(values.en).toEqual(values.bg);
  });
});

test.describe('accessibility', () => {
  test.use({ permissions: ['clipboard-read', 'clipboard-write'] });
  for (const lang of ['bg', 'en']) {
    for (const vp of ['phone', 'desktop']) {
      test(`${lang.toUpperCase()} home at ${vp}: axe clean with tonight marked and a copy confirmed`, async ({ page }) => {
        await page.setViewportSize(H.VIEWPORTS[vp]);
        await H.openPage(page, H.page(lang, 'home').path, { now: '2026-11-20T23:10' });
        await section(page, lang, 'events').getByRole('button', { name: T[lang].copyMail }).click();
        await expect(section(page, lang, 'events').getByRole('status')).not.toBeEmpty();
        await H.expectNoSeriousA11yViolations(page);
      });
    }
  }

  test('the copy buttons and contacts get a visible focus ring', async ({ page }) => {
    await H.openPage(page, '/index.html');
    const seen = await H.tabThrough(page, 120);
    const mine = seen.filter(s => /Копирай|events@|883 30|Маршрут|oscarclub\.sf|OscarClub\.sf|Славянска/.test(s.name));
    expect(mine.length).toBeGreaterThanOrEqual(7);
    expect(mine.filter(s => !s.ring)).toEqual([]);
  });
});
