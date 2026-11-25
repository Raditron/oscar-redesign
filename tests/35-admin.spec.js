// #35 The admin panel at /admin/, with its Events section: what the bar's staff see and do there. Sign in with the
// shared password, add, change and delete events, and see a save on the public site on the next load. The panel
// speaks Bulgarian only; an event's title is typed in Bulgarian and English side by side.
//
// Every test that adds content, moves the clock or spends the login rate limit runs against a backend of its own
// (the privateBackend fixture, tests/backend.js), so it never disturbs the tests running beside it.
const { execFileSync } = require('node:child_process');
const path = require('node:path');
const { test, expect, closedBackendUrl, sharedBackendUrl } = require('./backend');
const { ADMIN_PASSWORD } = require('../backend/tests/support/valid-env.ts');
const H = require('./helpers');

const ADMIN = '/admin/';

/** Open the panel on `backend`'s data. */
const openAdmin = (page, backend) => H.openPage(page, ADMIN, { backend });

const signInForm = page => page.getByRole('form', { name: 'Вход' });

/** Sign in from the sign-in screen. */
async function signIn(page, password) {
  await signInForm(page).getByLabel('Парола').fill(password);
  await signInForm(page).getByRole('button', { name: 'Влез' }).click();
}

const eventsSection = page => page.getByRole('region', { name: 'Събития' });
const eventForm = page => page.getByRole('form', { name: /събитие/ });

const escapeRegExp = text => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/**
 * What an event's row in the list reads before its buttons, one part per line: its date and weekday, the Bulgarian
 * title, the English title, the entry fee.
 */
const reads = (...parts) => new RegExp(`^${parts.map(escapeRegExp).join('\\s+')}\\s+Промени`);

/** Type an event into the form: { date: 'YYYY-MM-DD', bg, en, fee: what the admin types in the fee box }. */
async function fillEvent(page, { date, bg, en, fee = '' }) {
  const form = eventForm(page);
  await form.getByLabel('Дата').fill(date);
  await form.getByLabel('Заглавие на български').fill(bg);
  await form.getByLabel('Заглавие на английски').fill(en);
  await form.getByLabel(/^Вход/).fill(fee);
}

test.describe('signing in', () => {
  test('a wrong password says so; after five wrong tries in a row the panel says to wait 15 minutes', async ({ page, privateBackend }) => {
    await openAdmin(page, privateBackend.url);
    const form = signInForm(page);
    await signIn(page, 'not the password');
    await expect(form.getByRole('alert')).toHaveText('Грешна парола. Опитай пак.');
    await expect(form.getByLabel('Парола')).toHaveAccessibleDescription('Грешна парола. Опитай пак.');
    for (let tries = 2; tries <= 5; tries++) {
      await signIn(page, `wrong ${tries}`);
      await expect(form.getByRole('alert')).toHaveText('Грешна парола. Опитай пак.');
    }
    // the sixth try is refused before the password is checked, even the right one
    await signIn(page, privateBackend.password);
    await expect(form.getByRole('alert')).toHaveText('Твърде много грешни опити. Опитай пак след 15 минути.');
    await expect(eventsSection(page)).toBeHidden();
  });

  test('the rate-limit message says how long is left of the wait', async ({ page, privateBackend }) => {
    await openAdmin(page, privateBackend.url);
    const form = signInForm(page);
    for (let tries = 1; tries <= 5; tries++) {
      await signIn(page, `wrong ${tries}`);
      await expect(form.getByRole('alert')).toHaveText('Грешна парола. Опитай пак.');
    }
    await privateBackend.advanceClock(5 * 60_000 + 1000);   // 9 min 59 s of the 15-minute window left
    await signIn(page, privateBackend.password);
    await expect(form.getByRole('alert')).toHaveText('Твърде много грешни опити. Опитай пак след 10 минути.');
  });
});

test.describe('adding an event', () => {
  test('signed in, an admin adds an event and it is on the public home page on the next load, in both languages', async ({ page, privateBackend }) => {
    await openAdmin(page, privateBackend.url);
    await signIn(page, privateBackend.password);
    // the line the panel answers in is there before its first answer: a screen reader only hears a change to a live
    // region it already knew of
    await expect(eventsSection(page).getByRole('status')).toHaveText('');
    await fillEvent(page, { date: '2026-11-28', bg: 'Диско събота · DJ Иво', en: 'Disco Saturday · DJ Ivo', fee: '15' });
    await eventForm(page).getByRole('button', { name: 'Добави събитие' }).click();
    await expect(page.getByRole('status').filter({ hasText: 'Събитието е добавено.' })).toBeVisible();

    await H.openPage(page, '/index.html', { backend: privateBackend.url });
    await expect(page.getByRole('region', { name: 'В събота често има DJ.' }).getByRole('listitem'))
      .toHaveText(['28.11 Диско събота · DJ Иво вход 15 €'], { useInnerText: true });
    await H.openPage(page, '/en/index.html', { backend: privateBackend.url });
    await expect(page.getByRole('region', { name: 'Saturdays often have a DJ.' }).getByRole('listitem'))
      .toHaveText(['28.11 Disco Saturday · DJ Ivo entry €15'], { useInnerText: true });
  });
});

test.describe('what the form refuses', () => {
  test('a missing English title: the error stands next to that field, and nothing is saved', async ({ page, privateBackend }) => {
    await openAdmin(page, privateBackend.url);
    await signIn(page, privateBackend.password);
    await fillEvent(page, { date: '2026-12-05', bg: 'Винилова вечер', en: '   ', fee: '' });
    await eventForm(page).getByRole('button', { name: 'Добави събитие' }).click();

    const form = eventForm(page);
    await expect(form.getByLabel('Заглавие на английски')).toHaveAccessibleDescription('Напиши заглавието на английски.');
    await expect(form.getByLabel('Заглавие на английски')).toHaveAttribute('aria-invalid', 'true');
    await expect(form.getByLabel('Заглавие на български')).toHaveAccessibleDescription('');
    await expect(form.getByLabel('Заглавие на английски')).toBeFocused();
    // what was typed stays, and no event was added
    await expect(form.getByLabel('Заглавие на български')).toHaveValue('Винилова вечер');
    await expect(form.getByLabel('Дата')).toHaveValue('2026-12-05');
    await expect(eventsSection(page).getByRole('list', { name: 'Предстоящи' }).getByRole('listitem')).toHaveCount(0);
    await expect(eventsSection(page).getByText('Няма предстоящи събития.', { exact: false })).toBeVisible();
  });

  test('everything missing or wrong is marked in one go, the first of it gets the focus, and nothing is sent', async ({ page, privateBackend }) => {
    await openAdmin(page, privateBackend.url);
    await signIn(page, privateBackend.password);
    const sent = [];
    page.on('request', req => { if (req.method() === 'POST' && req.url().endsWith('/admin/events')) sent.push(req.url()); });
    await fillEvent(page, { date: '', bg: '  ', en: '', fee: 'abc' });
    await eventForm(page).getByRole('button', { name: 'Добави събитие' }).click();

    const form = eventForm(page);
    await expect(form.getByLabel('Дата')).toHaveAccessibleDescription('Избери дата.');
    await expect(form.getByLabel(/^Вход/)).toHaveAccessibleDescription(/Напиши сума в евро/);
    await expect(form.getByLabel('Заглавие на български')).toHaveAccessibleDescription('Напиши заглавието на български.');
    await expect(form.getByLabel('Заглавие на английски')).toHaveAccessibleDescription('Напиши заглавието на английски.');
    await expect(form.getByLabel('Дата')).toBeFocused();
    expect(sent, 'saves sent').toEqual([]);
  });

  test('a field the backend refuses although the panel let it through: the message stands next to that field', async ({ page }) => {
    // the panel checks what the backend checks today; should the two ever differ, the backend's word still lands in place
    const refused = { code: 'VALIDATION_FAILED', message: 'Some fields are missing or invalid.', details: [{ field: 'title.en', message: 'Enter the English title.' }] };
    await page.route(`${sharedBackendUrl()}/admin/events`, route => (route.request().method() === 'POST'
      ? route.fulfill({ status: 400, headers: { 'Access-Control-Allow-Origin': '*' }, json: refused })
      : route.continue()));
    await openAdmin(page);
    await signIn(page, ADMIN_PASSWORD);
    await fillEvent(page, { date: '2026-12-05', bg: 'Винилова вечер', en: 'Vinyl night', fee: '' });
    await eventForm(page).getByRole('button', { name: 'Добави събитие' }).click();

    const form = eventForm(page);
    await expect(form.getByLabel('Заглавие на английски')).toHaveAccessibleDescription('Напиши заглавието на английски.');
    await expect(form.getByLabel('Заглавие на английски')).toBeFocused();
    await expect(form.getByLabel('Заглавие на английски')).toHaveValue('Vinyl night');
  });
});

test.describe('when the session has run out', () => {
  test('saving asks for the password again; once signed in, the save goes through with what was typed', async ({ page, privateBackend }) => {
    await openAdmin(page, privateBackend.url);
    await signIn(page, privateBackend.password);
    await expect(eventsSection(page)).toBeVisible();
    // the shift is over: a session lasts 8 hours
    await privateBackend.advanceClock(8 * 3600_000 + 60_000);

    const typed = { date: '2026-12-12', bg: 'Суинг с Бо', en: 'Swing with Bo', fee: '12,50' };
    await fillEvent(page, typed);
    await eventForm(page).getByRole('button', { name: 'Добави събитие' }).click();

    const again = page.getByRole('dialog', { name: 'Влез отново' });
    await expect(again).toBeVisible();
    await expect(again.getByLabel('Парола')).toBeFocused();
    // a wrong password there is refused like at the door, and the dialog stays
    await again.getByLabel('Парола').fill('not the password');
    await again.getByRole('button', { name: 'Влез' }).click();
    await expect(again.getByRole('alert')).toHaveText('Грешна парола. Опитай пак.');
    await again.getByLabel('Парола').fill(privateBackend.password);
    await again.getByRole('button', { name: 'Влез' }).click();
    await expect(again).toBeHidden();

    await expect(page.getByRole('status').filter({ hasText: 'Събитието е добавено.' })).toBeVisible();
    await expect(eventsSection(page).getByRole('list', { name: 'Предстоящи' }).getByRole('listitem'))
      .toHaveText([reads('12.12.2026 събота', 'Суинг с Бо', 'Swing with Bo', 'вход 12,50 €')], { useInnerText: true });
    // the password typed into the question doesn't stay behind in the page once it's answered
    expect(await page.locator('input').evaluateAll(inputs => inputs.map(i => i.value)), 'what the page\'s fields hold')
      .not.toContain(privateBackend.password);
  });

  test('closing the question without signing in saves nothing and keeps what was typed', async ({ page, privateBackend }) => {
    await openAdmin(page, privateBackend.url);
    await signIn(page, privateBackend.password);
    await expect(eventsSection(page)).toBeVisible();
    await privateBackend.advanceClock(8 * 3600_000 + 60_000);
    await fillEvent(page, { date: '2026-12-12', bg: 'Суинг с Бо', en: 'Swing with Bo', fee: '12,50' });
    await eventForm(page).getByRole('button', { name: 'Добави събитие' }).click();
    const again = page.getByRole('dialog', { name: 'Влез отново' });
    await again.getByRole('button', { name: 'Откажи' }).click();
    await expect(again).toBeHidden();
    await expect(eventForm(page).getByRole('alert')).toHaveText('Не е запазено: сесията изтече. Влез отново и опитай пак.');
    await expect(eventForm(page).getByLabel('Заглавие на английски')).toHaveValue('Swing with Bo');
    await expect(eventForm(page).getByLabel(/^Вход/)).toHaveValue('12,50');
  });
});

// Upcoming at the suite's moment (Sunday 22 November 2026), added out of order; one with free entry
const UPCOMING = [
  { date: '2026-12-19', title: { bg: 'Коледно парти · DJ Мира', en: 'Christmas party · DJ Mira' }, entryFee: 1000 },
  { date: '2026-11-28', title: { bg: 'Диско събота · DJ Иво', en: 'Disco Saturday · DJ Ivo' }, entryFee: 1500 },
  { date: '2026-12-05', title: { bg: 'Винилова вечер', en: 'Vinyl night' }, entryFee: null }
];
const upcomingList = page => eventsSection(page).getByRole('list', { name: 'Предстоящи' });
const pastList = page => eventsSection(page).getByRole('list', { name: /^Минали/ });
const row = (list, title) => list.getByRole('listitem').filter({ hasText: title });

test.describe('the list of events', () => {
  test('upcoming first, soonest first; then the past ones, latest first, marked as not on the site', async ({ page, privateBackend }) => {
    await privateBackend.addEvents(...UPCOMING);
    await openAdmin(page, privateBackend.url);
    await signIn(page, privateBackend.password);
    await expect(upcomingList(page).getByRole('listitem')).toHaveText([
      reads('28.11.2026 събота', 'Диско събота · DJ Иво', 'Disco Saturday · DJ Ivo', 'вход 15 €'),
      reads('05.12.2026 събота', 'Винилова вечер', 'Vinyl night', 'свободен вход'),
      reads('19.12.2026 събота', 'Коледно парти · DJ Мира', 'Christmas party · DJ Mira', 'вход 10 €')
    ], { useInnerText: true });
    // the two the seed loads, from the site's old gig list
    await expect(pastList(page)).toHaveAccessibleName('Минали не се показват на сайта');
    await expect(pastList(page).getByRole('listitem')).toHaveText([
      reads('07.11.2026 събота', 'DISCOCKTAILS · Bo Vinyls на винил', 'DISCOCKTAILS · Bo Vinyls on vinyl', 'вход 10 €'),
      reads('31.10.2026 събота', 'Halloween парти · DJ Павел Бочев', 'Halloween party · DJ Pavel Bochev', 'вход 15 €')
    ], { useInnerText: true });
    // the upcoming list comes first on the page
    const [up, past] = [await upcomingList(page).boundingBox(), await pastList(page).boundingBox()];
    expect(up.y).toBeLessThan(past.y);
  });

  test('an event is changed in the same form: what it holds comes in, the change is saved, and the site shows it', async ({ page, privateBackend }) => {
    await privateBackend.addEvents(...UPCOMING);
    await openAdmin(page, privateBackend.url);
    await signIn(page, privateBackend.password);
    await row(upcomingList(page), 'Диско събота').getByRole('button', { name: 'Промени' }).click();

    const form = page.getByRole('form', { name: 'Промяна на събитие' });
    await expect(form.getByLabel('Дата')).toHaveValue('2026-11-28');
    await expect(form.getByLabel('Заглавие на български')).toHaveValue('Диско събота · DJ Иво');
    await expect(form.getByLabel('Заглавие на английски')).toHaveValue('Disco Saturday · DJ Ivo');
    await expect(form.getByLabel(/^Вход/)).toHaveValue('15');
    await expect(form.getByLabel('Дата')).toBeFocused();

    await form.getByLabel('Заглавие на английски').fill('Disco Saturday · DJ Ivo & friends');
    await form.getByLabel(/^Вход/).fill('12.5');
    await form.getByRole('button', { name: 'Запази промените' }).click();
    await expect(page.getByRole('status').filter({ hasText: 'Промените са запазени.' })).toBeVisible();
    await expect(row(upcomingList(page), 'Диско събота')).toHaveText(reads('28.11.2026 събота', 'Диско събота · DJ Иво', 'Disco Saturday · DJ Ivo & friends', 'вход 12,50 €'), { useInnerText: true });
    // the form is back to a new event, empty
    await expect(page.getByRole('form', { name: 'Ново събитие' }).getByLabel('Заглавие на английски')).toHaveValue('');

    await H.openPage(page, '/en/index.html', { backend: privateBackend.url });
    await expect(page.getByRole('region', { name: 'Saturdays often have a DJ.' }).getByRole('listitem').first())
      .toHaveText('28.11 Disco Saturday · DJ Ivo & friends entry €12.50', { useInnerText: true });
  });

  test('a change can be dropped: the form goes back to a new event and the event stays as it was', async ({ page, privateBackend }) => {
    await privateBackend.addEvents(UPCOMING[2]);
    await openAdmin(page, privateBackend.url);
    await signIn(page, privateBackend.password);
    await row(upcomingList(page), 'Винилова вечер').getByRole('button', { name: 'Промени' }).click();
    const form = page.getByRole('form', { name: 'Промяна на събитие' });
    await expect(form.getByLabel(/^Вход/)).toHaveValue('');
    await form.getByLabel('Заглавие на български').fill('нещо друго');
    await form.getByRole('button', { name: 'Откажи промяната' }).click();
    await expect(page.getByRole('form', { name: 'Ново събитие' }).getByLabel('Заглавие на български')).toHaveValue('');
    await expect(page.getByRole('button', { name: 'Откажи промяната' })).toBeHidden();
    await expect(row(upcomingList(page), 'Винилова вечер')).toBeVisible();
  });

  test('deleting asks first; "Откажи" keeps the event, "Изтрий" removes it', async ({ page, privateBackend }) => {
    await privateBackend.addEvents(...UPCOMING);
    await openAdmin(page, privateBackend.url);
    await signIn(page, privateBackend.password);
    const ask = page.getByRole('dialog', { name: 'Изтриване' });

    await row(upcomingList(page), 'Винилова вечер').getByRole('button', { name: 'Изтрий' }).click();
    await expect(ask).toContainText('Да изтрия ли „Винилова вечер“ (05.12.2026)?');
    // the safe answer is the one Enter gives
    await expect(ask.getByRole('button', { name: 'Откажи' })).toBeFocused();
    await ask.getByRole('button', { name: 'Откажи' }).click();
    await expect(ask).toBeHidden();
    await expect(upcomingList(page).getByRole('listitem')).toHaveCount(3);

    await row(upcomingList(page), 'Винилова вечер').getByRole('button', { name: 'Изтрий' }).click();
    await ask.getByRole('button', { name: 'Изтрий' }).click();
    await expect(page.getByRole('status').filter({ hasText: 'Събитието е изтрито.' })).toBeVisible();
    await expect(upcomingList(page).getByRole('listitem')).toHaveCount(2);
    await expect(row(upcomingList(page), 'Винилова вечер')).toHaveCount(0);
    // the button that was pressed has gone with its row: the keyboard carries on from what the panel said
    await expect(page.getByRole('status').filter({ hasText: 'Събитието е изтрито.' })).toBeFocused();
  });
});

test.describe('the entry fee', () => {
  test('is typed in euros, with a comma or a point; anything else is refused next to the box before anything is sent', async ({ page, privateBackend }) => {
    await openAdmin(page, privateBackend.url);
    await signIn(page, privateBackend.password);
    const form = eventForm(page);
    const fee = form.getByLabel(/^Вход/);
    await expect(fee).toHaveAccessibleDescription('Например 15 или 12,50. Празно: свободен вход.');
    const sent = [];
    page.on('request', req => { if (req.method() === 'POST' && req.url().endsWith('/admin/events')) sent.push(req.url()); });

    for (const typed of ['12,505', '-5', '15 лв', '1.000']) {
      await fillEvent(page, { date: '2026-12-05', bg: 'Винилова вечер', en: 'Vinyl night', fee: typed });
      await form.getByRole('button', { name: 'Добави събитие' }).click();
      await expect(fee, typed).toHaveAccessibleDescription(/Напиши сума в евро, например 15 или 12,50, или остави празно за свободен вход\.$/);
      await expect(fee, typed).toBeFocused();
    }
    expect(sent, 'saves sent with a fee the panel refused').toEqual([]);

    // a point works as well as a comma, a single decimal means tens of cents, and the € sign may be typed
    await fee.fill('7.5 €');
    await form.getByRole('button', { name: 'Добави събитие' }).click();
    await expect(row(upcomingList(page), 'Винилова вечер')).toHaveText(reads('05.12.2026 събота', 'Винилова вечер', 'Vinyl night', 'вход 7,50 €'), { useInnerText: true });
  });
});

test.describe('the session', () => {
  // the shared backend: these only sign in and read
  test('lasts while the tab is open: a reload keeps the admin signed in, a new tab asks for the password', async ({ page, context }) => {
    await openAdmin(page);
    await signIn(page, ADMIN_PASSWORD);
    await expect(eventsSection(page)).toBeVisible();
    await page.reload();
    await expect(eventsSection(page)).toBeVisible();
    await expect(pastList(page).getByRole('listitem')).toHaveCount(2);

    const other = await context.newPage();
    await openAdmin(other);
    await expect(signInForm(other)).toBeVisible();
    await expect(eventsSection(other)).toBeHidden();
  });

  test('"Изход" signs out: the sign-in screen is back, and a reload doesn\'t sign in again', async ({ page }) => {
    await openAdmin(page);
    await signIn(page, ADMIN_PASSWORD);
    await expect(eventsSection(page)).toBeVisible();
    await page.getByRole('button', { name: 'Изход' }).click();
    await expect(signInForm(page)).toBeVisible();
    await expect(eventsSection(page)).toBeHidden();
    await expect(signInForm(page).getByLabel('Парола')).toBeFocused();
    await page.reload();
    await expect(signInForm(page)).toBeVisible();
  });
});

test.describe('kept out of sight', () => {
  test('the panel asks search engines not to index it or follow it', async ({ page }) => {
    await openAdmin(page);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /\bnoindex\b/);
    await expect(page).toHaveTitle('Админ · Оскар клуб');
    await expect(page.locator('html')).toHaveAttribute('lang', 'bg');
  });

  for (const p of H.PAGES) {
    test(`${p.name}: no link to the panel, and no word of its address in the page or its scripts`, async ({ page }) => {
      const scripts = [];
      page.on('response', res => { if (res.request().resourceType() === 'script') scripts.push(res); });
      await H.openPage(page, p.path);
      const targets = await page.locator('a[href], link[href], area[href], form[action]')
        .evaluateAll(els => els.map(e => new URL(e.getAttribute('href') || e.getAttribute('action'), location.href)).filter(u => u.origin === location.origin).map(u => u.pathname));
      expect(targets.filter(t => /^\/admin(\/|$)/i.test(t)), 'links to the panel').toEqual([]);
      const texts = [await page.content(), ...await Promise.all(scripts.map(s => s.text()))];
      expect(texts.filter(t => /\badmin\//i.test(t)), 'the panel\'s address').toEqual([]);
    });
  }
});

test.describe('accessible and usable at phone width', () => {
  test('the sign-in screen passes the axe scan', async ({ page, privateBackend }) => {
    await openAdmin(page, privateBackend.url);
    await signIn(page, 'not the password');
    await expect(signInForm(page).getByRole('alert')).toHaveText('Грешна парола. Опитай пак.');
    await H.expectNoSeriousA11yViolations(page);
  });

  test('at 375 px: nothing runs off the side, the form and the list work, and every state passes the axe scan', async ({ page, privateBackend }) => {
    await privateBackend.addEvents(...UPCOMING);
    await page.setViewportSize({ width: 375, height: 812 });
    await openAdmin(page, privateBackend.url);
    await signIn(page, privateBackend.password);
    await expect(upcomingList(page).getByRole('listitem')).toHaveCount(3);
    const fits = () => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
    expect(await fits(), 'no sideways scroll').toBe(true);
    await H.expectNoSeriousA11yViolations(page);

    // the form with its errors showing
    await fillEvent(page, { date: '', bg: '', en: '', fee: 'abc' });
    await eventForm(page).getByRole('button', { name: 'Добави събитие' }).click();
    await expect(eventForm(page).getByLabel('Заглавие на английски')).toHaveAccessibleDescription('Напиши заглавието на английски.');
    expect(await fits(), 'no sideways scroll with the errors showing').toBe(true);
    await H.expectNoSeriousA11yViolations(page);

    // every field and button is within the screen's width
    for (const box of [eventForm(page).getByLabel('Дата'), eventForm(page).getByLabel('Заглавие на английски'),
      eventForm(page).getByRole('button', { name: 'Добави събитие' }),
      row(upcomingList(page), 'Винилова вечер').getByRole('button', { name: 'Изтрий' })]) {
      const b = await box.boundingBox();
      expect(b.x, 'starts on screen').toBeGreaterThanOrEqual(0);
      expect(b.x + b.width, 'ends on screen').toBeLessThanOrEqual(375);
      expect(b.height, 'tall enough to tap').toBeGreaterThanOrEqual(44);
    }

    // the delete question, open
    await row(upcomingList(page), 'Винилова вечер').getByRole('button', { name: 'Изтрий' }).click();
    await expect(page.getByRole('dialog', { name: 'Изтриване' })).toBeVisible();
    await H.expectNoSeriousA11yViolations(page);
    await page.keyboard.press('Escape');

    // the question for the password, open, once the session has run out
    await privateBackend.advanceClock(8 * 3600_000 + 60_000);
    await page.reload();
    await expect(page.getByRole('dialog', { name: 'Влез отново' })).toBeVisible();
    expect(await fits(), 'no sideways scroll with the question open').toBe(true);
    await H.expectNoSeriousA11yViolations(page);
  });
});

test.describe('when the backend can\'t be reached', () => {
  test('with no backend address in js/config.js (as committed), the sign-in screen says where it goes, and asks nothing of anyone', async ({ page }) => {
    const fetched = [];
    page.on('request', req => { if (['fetch', 'xhr'].includes(req.resourceType())) fetched.push(req.url()); });
    const committed = execFileSync('git', ['show', 'HEAD:js/config.js'], { cwd: path.resolve(__dirname, '..'), encoding: 'utf8' });
    await page.route('**/js/config.js', route => route.fulfill({ contentType: 'text/javascript', body: committed }));
    await H.openPage(page, ADMIN, { backend: null });
    await expect(signInForm(page).getByRole('alert')).toHaveText('Панелът не знае адреса на сървъра: той се записва в js/config.js.');
    await signIn(page, 'anything');
    await expect(signInForm(page).getByRole('alert')).toHaveText('Панелът не знае адреса на сървъра: той се записва в js/config.js.');
    expect(fetched, 'requests sent').toEqual([]);
  });

  test('a backend that is down: signing in says there is no connection', async ({ page }) => {
    await openAdmin(page, await closedBackendUrl());
    await signIn(page, ADMIN_PASSWORD);
    await expect(signInForm(page).getByRole('alert')).toHaveText('Не влезе: няма връзка със сървъра. Провери интернета и опитай пак.');
  });

  test('a save with no answer in time: the panel can\'t tell if it was saved, so it shows the list as it is now and keeps what was typed', async ({ page, privateBackend }) => {
    await page.clock.install();
    await openAdmin(page, privateBackend.url);
    await signIn(page, privateBackend.password);
    // the backend saves it, but its answer never comes back
    let saved;
    const savedOnTheBackend = new Promise(resolve => { saved = resolve; });
    await page.route(`${privateBackend.url}/admin/events`, async route => {
      if (route.request().method() !== 'POST') return route.continue();
      await route.fetch();
      saved();
    });
    await fillEvent(page, { date: '2026-12-05', bg: 'Винилова вечер', en: 'Vinyl night', fee: '8' });
    await eventForm(page).getByRole('button', { name: 'Добави събитие' }).click();
    await savedOnTheBackend;
    await page.clock.runFor(10_000);   // the panel waits 10 seconds for an answer

    await expect(eventForm(page).getByRole('alert')).toHaveText('Сървърът не отговори навреме и не е ясно дали е запазено. Провери в списъка по-долу, преди да опиташ пак.');
    await expect(row(upcomingList(page), 'Винилова вечер')).toHaveText(reads('05.12.2026 събота', 'Винилова вечер', 'Vinyl night', 'вход 8 €'), { useInnerText: true });
    await expect(eventForm(page).getByLabel('Заглавие на английски')).toHaveValue('Vinyl night');
    await expect(eventForm(page).getByLabel(/^Вход/)).toHaveValue('8');
  });

  test('a list that fails to load says so, and loads on "Опитай пак"', async ({ page }) => {
    let failures = 1;
    await page.route(`${sharedBackendUrl()}/admin/events`, route => (failures-- > 0
      ? route.fulfill({ status: 500, headers: { 'Access-Control-Allow-Origin': '*' }, json: { code: 'INTERNAL_ERROR', message: 'Something went wrong on our side.' } })
      : route.continue()));
    await openAdmin(page);
    await signIn(page, ADMIN_PASSWORD);
    await expect(eventsSection(page).getByRole('alert').filter({ hasText: 'Събитията' })).toHaveText('Събитията не се заредиха: сървърът отказа. Опитай пак след малко.');
    await eventsSection(page).getByRole('button', { name: 'Опитай пак' }).click();
    await expect(pastList(page).getByRole('listitem')).toHaveCount(2);
    await expect(eventsSection(page).getByText('Събитията не се заредиха', { exact: false })).toBeHidden();
    await expect(eventsSection(page).getByRole('button', { name: 'Опитай пак' })).toBeHidden();
  });
});

test.describe('when something changed behind the panel\'s back', () => {
  test('a session that ran out while the panel was closed: on the next load the list asks for the password, then shows', async ({ page, privateBackend }) => {
    await openAdmin(page, privateBackend.url);
    await signIn(page, privateBackend.password);
    await expect(pastList(page).getByRole('listitem')).toHaveCount(2);
    await privateBackend.advanceClock(8 * 3600_000 + 60_000);
    await page.reload();
    const again = page.getByRole('dialog', { name: 'Влез отново' });
    await again.getByLabel('Парола').fill(privateBackend.password);
    await again.getByRole('button', { name: 'Влез' }).click();
    await expect(again).toBeHidden();
    await expect(pastList(page).getByRole('listitem')).toHaveCount(2);
  });

  test('an event deleted elsewhere while it was being changed: saving says so, and what was typed can be added as new', async ({ page, privateBackend }) => {
    await privateBackend.addEvents(UPCOMING[2]);
    await openAdmin(page, privateBackend.url);
    await signIn(page, privateBackend.password);
    await row(upcomingList(page), 'Винилова вечер').getByRole('button', { name: 'Промени' }).click();
    await page.getByRole('form', { name: 'Промяна на събитие' }).getByLabel(/^Вход/).fill('5');

    // someone else deletes it, from another phone
    const token = await privateBackend.logIn();
    const auth = { Authorization: `Bearer ${token}` };
    const [ev] = (await (await fetch(`${privateBackend.url}/admin/events`, { headers: auth })).json()).filter(e => e.upcoming);
    expect((await fetch(`${privateBackend.url}/admin/events/${ev.id}`, { method: 'DELETE', headers: auth })).status).toBe(204);

    await page.getByRole('button', { name: 'Запази промените' }).click();
    const form = page.getByRole('form', { name: 'Ново събитие' });
    await expect(form.getByRole('alert')).toHaveText('Това събитие вече е изтрито. Написаното остава: можеш да го добавиш като ново.');
    await expect(form.getByLabel('Заглавие на български')).toHaveValue('Винилова вечер');
    await expect(upcomingList(page).getByRole('listitem')).toHaveCount(0);
    await form.getByRole('button', { name: 'Добави събитие' }).click();
    await expect(row(upcomingList(page), 'Винилова вечер')).toHaveText(reads('05.12.2026 събота', 'Винилова вечер', 'Vinyl night', 'вход 5 €'), { useInnerText: true });
  });
});
