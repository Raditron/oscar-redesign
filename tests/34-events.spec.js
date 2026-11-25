// #34 The Saturday gig list comes from the backend: upcoming Events in both languages, none when there are none, and
// the "unavailable" note with the reservation phone when the backend can't be reached, hangs, or JavaScript is off.
const { execFileSync } = require('node:child_process');
const path = require('node:path');
const { test, expect, closedBackendUrl, sharedBackendUrl, suiteTime } = require('./backend');
const H = require('./helpers');

const T = {
  bg: { music: 'В събота често има DJ.', unavailable: 'Програмата не е достъпна в момента. Маса запазваш на +359 899 666 633.' },
  en: { music: 'Saturdays often have a DJ.', unavailable: 'The line-up isn’t available right now. Book a table on +359 899 666 633.' }
};

const musicSection = (page, lang) => page.getByRole('region', { name: T[lang].music });
const instagram = section => section.getByRole('link', { name: /@oscarclub_official/ });

/** The music section says the line-up isn't available and gives the reservation phone, as a link that calls it. */
async function expectUnavailable(music, lang) {
  await expect(music.getByText(T[lang].unavailable)).toBeVisible();
  await expect(music.getByRole('link', { name: '+359 899 666 633' })).toHaveAttribute('href', 'tel:+359899666633');
  await expect(music.getByRole('list')).toHaveCount(0);
  await expect(instagram(music)).toBeVisible();
}

// Four upcoming Events (the suite's moment is Sunday 22 November 2026), added out of order, one with free entry and
// one with a fee in cents. Guests see the soonest three.
const UPCOMING = [
  { date: '2026-12-19', title: { bg: 'Коледно парти · DJ Мира', en: 'Christmas party · DJ Mira' }, entryFee: 1000 },
  { date: '2026-12-05', title: { bg: 'Винилова вечер', en: 'Vinyl night' }, entryFee: null },
  { date: '2026-11-28', title: { bg: 'Диско събота · DJ Иво', en: 'Disco Saturday · DJ Ivo' }, entryFee: 1500 },
  { date: '2026-12-12', title: { bg: 'Суинг с Бо', en: 'Swing with Bo' }, entryFee: 1250 }
];
const SHOWN = {
  bg: ['28.11 Диско събота · DJ Иво вход 15 €', '05.12 Винилова вечер', '12.12 Суинг с Бо вход 12,50 €'],
  en: ['28.11 Disco Saturday · DJ Ivo entry €15', '05.12 Vinyl night', '12.12 Swing with Bo entry €12.50']
};

test.describe('upcoming events', () => {
  for (const lang of ['bg', 'en']) {
    test(`${lang.toUpperCase()}: the soonest three, each with its date, title and entry fee (none when entry is free)`, async ({ page, privateBackend }) => {
      await privateBackend.addEvents(...UPCOMING);
      await H.openPage(page, H.page(lang, 'home').path, { backend: privateBackend.url });
      const music = musicSection(page, lang);
      await expect(music.getByRole('list').getByRole('listitem')).toHaveText(SHOWN[lang], { useInnerText: true });
      await expect(instagram(music)).toBeVisible();
      await H.expectNoSeriousA11yViolations(page);
    });
  }
});

test.describe('no upcoming events', () => {
  for (const lang of ['bg', 'en']) {
    test(`${lang.toUpperCase()}: the list is gone and the Instagram line stays`, async ({ page }) => {
      // the shared backend: both Events the seed loads are past at the suite's moment
      await H.openPage(page, H.page(lang, 'home').path);
      const music = musicSection(page, lang);
      await expect(music).not.toHaveAttribute('aria-busy', 'true');   // the backend has answered
      await expect(music.getByRole('list')).toHaveCount(0);
      await expect(music.getByText(T[lang].unavailable)).toBeHidden();
      await expect(instagram(music)).toBeVisible();
    });
  }
});

test.describe('the backend is down', () => {
  for (const lang of ['bg', 'en']) {
    test(`${lang.toUpperCase()}: the section says the line-up isn't available and gives the reservation phone`, async ({ page }) => {
      await H.openPage(page, H.page(lang, 'home').path, { backend: await closedBackendUrl() });
      await expectUnavailable(musicSection(page, lang), lang);
      await H.expectNoSeriousA11yViolations(page);
    });
  }
});

test('a backend that takes the request and never answers counts as down after 10 seconds', async ({ page, hangingBackendUrl }) => {
  // the page's clock, stopped, so the test moves it on itself instead of waiting
  await page.clock.install();
  await page.clock.pauseAt(new Date(Date.now() + 1000));
  await H.openPage(page, '/en/index.html', { backend: hangingBackendUrl });
  const music = musicSection(page, 'en');
  await page.clock.runFor(9_900);
  await expect(music).toHaveAttribute('aria-busy', 'true');
  await expect(music.getByText(T.en.unavailable)).toBeHidden();
  await page.clock.runFor(100);
  await expectUnavailable(music, 'en');
});

test('an error answer from the backend reads the same as a backend that is down', async ({ page }) => {
  await page.route(`${sharedBackendUrl()}/public/events`, route => route.fulfill({
    status: 500,
    headers: { 'Access-Control-Allow-Origin': '*' },
    json: { code: 'INTERNAL_ERROR', message: 'Something went wrong on our side.' }
  }));
  await H.openPage(page, '/index.html');
  await expectUnavailable(musicSection(page, 'bg'), 'bg');
});

test('an address written with a slash at the end works the same', async ({ page }) => {
  await H.openPage(page, '/en/index.html', { backend: `${sharedBackendUrl()}/` });
  const music = musicSection(page, 'en');
  await expect(music).not.toHaveAttribute('aria-busy', 'true');
  await expect(music.getByText(T.en.unavailable)).toBeHidden();
});

// js/config.js decides, with no override. The page gets the file as committed (or as a test writes it), never the one
// on disk: that one may hold an address set to try the site, or the live one in a package made for the bar.
const serveConfig = (page, body) => page.route('**/js/config.js', route => route.fulfill({ contentType: 'text/javascript', body }));
const committed = file => execFileSync('git', ['show', `HEAD:${file}`], { cwd: path.resolve(__dirname, '..'), encoding: 'utf8' });

test.describe('js/config.js as committed: no backend address', () => {
  for (const lang of ['bg', 'en']) {
    test(`${lang.toUpperCase()}: the note shows, and the page asks nothing of anyone`, async ({ page }) => {
      const fetched = [];
      page.on('request', req => { if (['fetch', 'xhr'].includes(req.resourceType())) fetched.push(req.url()); });
      await serveConfig(page, committed('js/config.js'));
      await H.openPage(page, H.page(lang, 'home').path, { backend: null });
      await expectUnavailable(musicSection(page, lang), lang);
      expect(fetched, 'content asked for').toEqual([]);
    });
  }
});

test('the address set in js/config.js is the backend the page loads from', async ({ page }) => {
  await serveConfig(page, `window.OC_BACKEND = '${sharedBackendUrl()}';`);
  const asked = page.waitForRequest(`${sharedBackendUrl()}/public/events`);
  await H.openPage(page, '/en/index.html', { backend: null });
  await asked;
  const music = musicSection(page, 'en');
  await expect(music).not.toHaveAttribute('aria-busy', 'true');
  await expect(music.getByText(T.en.unavailable)).toBeHidden();
});

test.describe('while the line-up is on its way', () => {
  for (const lang of ['bg', 'en']) {
    test(`${lang.toUpperCase()}: the section is busy and quiet: no list, no note`, async ({ page }) => {
      let answer;
      const held = new Promise(resolve => { answer = resolve; });
      await page.route(`${sharedBackendUrl()}/public/events`, async route => { await held; await route.continue(); });
      await H.openPage(page, H.page(lang, 'home').path);
      const music = musicSection(page, lang);
      await expect(music).toHaveAttribute('aria-busy', 'true');
      await expect(music.getByRole('list')).toHaveCount(0);
      await expect(music.getByText(T[lang].unavailable)).toBeHidden();
      answer();
      await expect(music).not.toHaveAttribute('aria-busy', 'true');
    });
  }
});

test.describe('a link to a part below the line-up', () => {
  test('lands on that part and stays there when the line-up arrives late, in a browser that keeps no scroll anchor', async ({ page, privateBackend }) => {
    await privateBackend.addEvents(...UPCOMING);
    await page.setViewportSize(H.VIEWPORTS.phone);
    let answer;
    const held = new Promise(resolve => { answer = resolve; });
    await page.route(`${privateBackend.url}/public/events`, async route => { await held; await route.continue(); });
    await H.openPage(page, '/en/index.html#events', { backend: privateBackend.url });
    // Chromium and Firefox hold a part in place when what is above it grows (scroll anchoring); WebKit doesn't. Turned
    // off here, so this browser stands for WebKit
    await page.addStyleTag({ content: '* { overflow-anchor: none !important; }' });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(2500);   // a slow backend: past the moments the page settles by itself once it has loaded

    const music = musicSection(page, 'en');
    const events = page.getByRole('region', { name: /^Party somewhere else\?/ });
    const top = async () => (await events.boundingBox()).y;
    const [placed, musicHeight] = [await top(), (await music.boundingBox()).height];
    answer();
    await expect(music.getByRole('listitem')).toHaveCount(3);
    expect((await music.boundingBox()).height, 'the line-up made the section above taller').toBeGreaterThan(musicHeight);
    await expect.poll(async () => Math.abs(await top() - placed), 'how far the linked part moved').toBeLessThanOrEqual(1);
  });
});

test.describe('the backend keeps the bar\'s time', () => {
  test('at 01:30 on Sunday Saturday\'s party is still listed; once the bar has closed at 03:00 it is gone', async ({ page, privateBackend }) => {
    await privateBackend.addEvents({ date: '2026-11-21', title: { bg: 'Събота вечер · DJ Иво', en: 'Saturday night · DJ Ivo' }, entryFee: null });
    // the page's clock and the backend's agree: Sunday 01:30, then 03:00
    await H.openPage(page, '/en/index.html', { backend: privateBackend.url, now: suiteTime() });
    const music = musicSection(page, 'en');
    await expect(music.getByRole('listitem')).toHaveText(['21.11 Saturday night · DJ Ivo'], { useInnerText: true });
    const closing = 90 * 60 * 1000;
    await privateBackend.advanceClock(closing);
    await H.openPage(page, '/en/index.html', { backend: privateBackend.url, now: suiteTime(closing) });
    await expect(music).not.toHaveAttribute('aria-busy', 'true');
    await expect(music.getByRole('list')).toHaveCount(0);
    await expect(instagram(music)).toBeVisible();
  });
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  for (const lang of ['bg', 'en']) {
    test(`${lang.toUpperCase()}: the same note, with the reservation phone`, async ({ page }) => {
      await H.openPage(page, H.page(lang, 'home').path);
      await expectUnavailable(musicSection(page, lang), lang);
    });
  }
});
