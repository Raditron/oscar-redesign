// #10 Home: story, featured-cocktail carousel and cocktail index (BG + EN).
// Asserts what a visitor sees and can do: text, roles, accessible names, what is visible, what changes over time.
const { test, expect } = require('@playwright/test');
const H = require('./helpers');

const NOW = '2026-11-16T20:00';   // a fixed clock, so the status line never ticks during a test

const L = {
  bg: {
    story: 'История',
    say: ['Отворихме на 23 май 1999 г. като кафене за бизнес срещи. Вечер ставаше клуб.', 'Днес сме коктейл бар с 13 авторски коктейла и девиз, който пишем и до днес:'],
    founder: /Трифон|Гяцов|Основател/,
    award: 'Бранд на годината 2024 · Класация БГ',
    carousel: 'Авторски коктейли', prev: 'Предишен коктейл', next: 'Следващ коктейл', pause: 'Пауза', play: 'Пусни', of: 'от',
    index: 'Всички 13 авторски', fullMenu: 'Цялото меню', menuPath: '/mainmenu/index.html',
    // the carousel's order (Tarator first) and each drink's line + what is read under it (site-v2.js C.slogans, featLede)
    slides: [
      ['Тараторът е студена супа.', 'Нашият е в чаша: водка, Скинос, лимон и битер, с краставица, копър и пекан отгоре.'],
      ['Уиски, ягода и малко сърце.', 'уиски, ягода, касис, лимон'],
      ['Десерт, който се пие.', 'водка, Licor 43, Малибу, кондензирано мляко, лимон']
    ],
    lastSlogan: 'Димът е от мескала.'
  },
  en: {
    story: 'Our story',
    say: ['We opened on 23 May 1999 as a café for business meetings. At night it turned into a club.', 'Today we’re a cocktail bar with 13 cocktails of our own and a motto we still write on everything:'],
    founder: /Trifon|Gyatsov|Founded by/,
    award: 'Brand of the Year 2024 · Klasatsia BG',
    carousel: 'Signature cocktails', prev: 'Previous cocktail', next: 'Next cocktail', pause: 'Pause', play: 'Play', of: 'of',
    index: 'All 13 of our own', fullMenu: 'The full menu', menuPath: '/en/mainmenu/index.html',
    slides: [
      ['Tarator is a cold cucumber soup.', 'Ours comes in a glass: vodka, Skinos, lemon and bitters, topped with cucumber, dill and a pecan.'],
      ['Whiskey, strawberry and a little heart.', 'whiskey, strawberry, cassis, lemon'],
      ['Dessert you drink.', 'vodka, Licor 43, Malibu, condensed milk, lemon']
    ],
    lastSlogan: 'The smoke is the mezcal.'
  }
};

// design-system/data.js, in the index's order (site-v2.js index()): name, ml, price in euro, image
const INDEX = [
  ['Tarator', 280, 10, 'taratorw'], ['Machree', 330, 8, 'macr'], ['Blue’s’our', 280, 6, 'blue'], ['Kiss Me', 250, 8, 'kissme'],
  ['Eden Garden', 220, 8, 'edenw'], ['Spraoi', 330, 8, 'spraiow'], ['Better Taste', 280, 12, 'better'], ['French 69', 175, 6, '69'],
  ['Mucho Bien', 220, 8, 'much'], ['Soju Spritz', 280, 8, 'sojuw'], ['Cherry Lady', 250, 10, 'cherry'], ['Tropilita', 180, 6, 'trop'],
  ['Fridge Cigarette', 180, 6, 'fridge']
];
const DRINK = { machree: '#e5383b', fridge: '#ec8b00', blue: '#2fa4f0' };   // tokens: --d-berry, --d-amber, --d-curacao

// the prototype's dwell time: 2.5s for the glass + 0.3s a word (line + what is under it), never under 6s, in 0.5s steps
const words = s => s.split(/\s+/).filter(Boolean).length;
const dwell = ([line, lede]) => Math.max(6000, Math.round((2500 + 300 * (words(line) + words(lede))) / 500) * 500);

const home = lang => H.page(lang, 'home').path;
const carousel = (page, lang) => page.getByRole('region', { name: L[lang].carousel });
const indexSec = (page, lang) => page.getByRole('region', { name: L[lang].index });
const slogan = (page, lang, i) => carousel(page, lang).getByText(L[lang].slides[i][0], { exact: true });

/** Bring the carousel on screen with the mouse resting above it, on the story (so nothing holds it by accident). */
async function showCarousel(page, lang) {
  await page.evaluate(() => { const f = document.getElementById('cocktails'); scrollTo(0, f.getBoundingClientRect().top + scrollY - 260); });
  await page.mouse.move(8, 120);
}
/** Whether the hairline over the controls is filling toward the next drink (it only runs while the carousel plays). */
const hairlineRuns = (page, lang) => carousel(page, lang).evaluate(el => el.getAnimations({ subtree: true }).some(a => a.animationName === 'v2-fill'));
/** Start recording every transition or animation that starts inside the carousel; motionSeen() reads the list. */
const recordMotion = (page, lang) => carousel(page, lang).evaluate(el => {
  window.__motion = [];
  for (const t of ['transitionrun', 'animationstart']) el.addEventListener(t, e => window.__motion.push(`${t} ${e.propertyName || e.animationName}`));
});
const motionSeen = page => page.evaluate(() => window.__motion);
/** Show the carousel and wait until it is actually running (it only starts once it is on screen). */
async function showRunningCarousel(page, lang) {
  await showCarousel(page, lang);
  await expect.poll(() => hairlineRuns(page, lang)).toBe(true);
}

/** The preview glass a visitor sees beside the index: the large image that is fully shown. */
const shownPreview = (page, lang) => indexSec(page, lang).evaluate(sec =>
  [...sec.querySelectorAll('img')].filter(i => i.getBoundingClientRect().width > 200 && getComputedStyle(i).opacity === '1')
    .map(i => i.getAttribute('src').split('/').pop()));

/** How a name and its row are drawn. */
const look = loc => loc.evaluate(el => {
  const nm = el.querySelector('a'), cs = getComputedStyle(el), ns = getComputedStyle(nm);
  return { color: ns.color, shadow: ns.textShadow, row: [cs.backgroundColor, cs.borderBottomColor, cs.borderBottomWidth, cs.boxShadow, cs.color].join(' | ') };
});
/** What the browser draws for a drink colour lit as a tube (the name's colour while pointed at). */
const litColour = (page, hex) => page.evaluate(h => {
  const p = document.createElement('i'); p.style.color = `color-mix(in srgb, ${h} 45%, #fff)`; document.body.append(p);
  const c = getComputedStyle(p).color; p.remove(); return c;
}, hex);

for (const lang of ['bg', 'en']) {
  const T = L[lang];
  const LANG = lang.toUpperCase();

  test.describe(`${LANG} · story`, () => {
    test('then and now, running into the motto, with the date and the award; no founder name', async ({ page }) => {
      await H.openPage(page, home(lang), { now: NOW });
      const story = page.getByRole('region', { name: T.story });
      await story.scrollIntoViewIfNeeded();
      for (const p of T.say) await expect(story.getByText(p, { exact: true })).toBeVisible();
      const motto = story.getByText('allow yourself to be yourself.', { exact: true });
      await expect(motto).toBeVisible();
      await expect(story.getByText('23.05.1999')).toBeVisible();
      await expect(story.getByText(T.award)).toBeVisible();
      // the motto comes right after the two halves of the story
      expect(await story.evaluate(s => s.innerText.replace(/\s+/g, ' ').trim().indexOf('allow yourself'))).toBeGreaterThan(0);
      // the founder's name stays hidden until the bar confirms it: not on screen and not in the page source
      await expect(story).not.toContainText(T.founder);
      expect(await page.content()).not.toMatch(T.founder);
    });
  });

  test.describe(`${LANG} · carousel`, () => {
    test('shows one drink at a time: its line, what is in it, name, ml and price', async ({ page }) => {
      await H.openPage(page, home(lang), { now: NOW });
      const car = carousel(page, lang);
      await car.scrollIntoViewIfNeeded();
      await expect(slogan(page, lang, 0)).toBeVisible();
      await expect(car.getByText(T.slides[0][1], { exact: true })).toBeVisible();
      await expect(car.getByText('280 ml').first()).toBeVisible();
      await expect(car.getByText(lang === 'bg' ? '10 €' : '€10').first()).toBeVisible();
      await expect(slogan(page, lang, 1)).toBeHidden();
      await expect(car.getByText(T.lastSlogan)).toBeHidden();
      await expect(car.getByRole('group', { name: `1 ${T.of} 13` })).toBeVisible();
      await expect(car.getByRole('group')).toHaveCount(1);   // the other twelve are hidden from assistive tech too
    });

    test('previous / next by mouse, with a wrap-around', async ({ page }) => {
      await H.openPage(page, home(lang), { now: NOW });
      const car = carousel(page, lang);
      await car.scrollIntoViewIfNeeded();
      await car.getByRole('button', { name: T.next }).click();
      await expect(slogan(page, lang, 1)).toBeVisible();
      await expect(slogan(page, lang, 0)).toBeHidden();
      await expect(car.getByRole('group', { name: `2 ${T.of} 13` })).toBeVisible();
      await car.getByRole('button', { name: T.next }).click();
      await expect(slogan(page, lang, 2)).toBeVisible();
      await car.getByRole('button', { name: T.prev }).click();
      await car.getByRole('button', { name: T.prev }).click();
      await expect(slogan(page, lang, 0)).toBeVisible();
      await car.getByRole('button', { name: T.prev }).click();
      await expect(car.getByText(T.lastSlogan)).toBeVisible();
      await expect(car.getByRole('group', { name: `13 ${T.of} 13` })).toBeVisible();
      // stepping by hand stops the auto-advance for good; the toggle now offers Play
      await expect(car.getByRole('button', { name: T.play })).toBeVisible();
    });

    test('previous / next by keyboard: Tab to the buttons, Enter / Space, and the arrow keys', async ({ page }) => {
      await H.openPage(page, home(lang), { now: NOW });
      const car = carousel(page, lang);
      await car.scrollIntoViewIfNeeded();
      const prev = car.getByRole('button', { name: T.prev });
      await prev.focus();
      await page.keyboard.press('Tab');
      await expect(car.getByRole('button', { name: T.next })).toBeFocused();
      await page.keyboard.press('Enter');
      await expect(slogan(page, lang, 1)).toBeVisible();
      await page.keyboard.press('Space');
      await expect(slogan(page, lang, 2)).toBeVisible();
      await page.keyboard.press('Shift+Tab');
      await expect(prev).toBeFocused();
      await page.keyboard.press('Enter');
      await expect(slogan(page, lang, 1)).toBeVisible();
      await page.keyboard.press('ArrowLeft');
      await expect(slogan(page, lang, 0)).toBeVisible();
      await page.keyboard.press('ArrowRight');
      await expect(slogan(page, lang, 1)).toBeVisible();
      // every control shows a focus ring
      for (const name of [T.prev, T.next, T.play]) {
        const b = car.getByRole('button', { name });
        await b.focus();
        await page.keyboard.press('Shift+Tab'); await page.keyboard.press('Tab');   // focus by keyboard → :focus-visible
        expect(await b.evaluate(el => getComputedStyle(el).outlineStyle !== 'none' && parseFloat(getComputedStyle(el).outlineWidth) >= 1)).toBe(true);
      }
    });

    test('advances on its own after the word-count dwell time', async ({ page }) => {
      await page.clock.install();
      await H.openPage(page, home(lang), { now: NOW });
      await showRunningCarousel(page, lang);
      await expect(carousel(page, lang).getByRole('button', { name: T.pause })).toBeVisible();
      const d0 = dwell(T.slides[0]), d1 = dwell(T.slides[1]);
      expect(d0).toBe(lang === 'bg' ? 8000 : 9500);   // Tarator has the most to read, so it holds longest
      await page.clock.runFor(d0 - 500);
      await expect(slogan(page, lang, 0)).toBeVisible();
      await page.clock.runFor(600);
      await expect(slogan(page, lang, 1)).toBeVisible();
      await page.clock.runFor(d1 + 100);
      await expect(slogan(page, lang, 2)).toBeVisible();
    });

    test('holds still while the mouse is over it, and goes on when it leaves', async ({ page }) => {
      await page.clock.install();
      await H.openPage(page, home(lang), { now: NOW });
      await showRunningCarousel(page, lang);
      await carousel(page, lang).getByText(T.slides[0][1], { exact: true }).hover();
      await expect.poll(() => hairlineRuns(page, lang)).toBe(false);
      await page.clock.runFor(30000);
      await expect(slogan(page, lang, 0)).toBeVisible();
      await page.mouse.move(8, 120);
      await expect.poll(() => hairlineRuns(page, lang)).toBe(true);
      await page.clock.runFor(dwell(T.slides[0]) + 100);
      await expect(slogan(page, lang, 1)).toBeVisible();
    });

    test('holds still while a control has keyboard focus, and goes on when focus leaves', async ({ page }) => {
      await page.clock.install();
      await H.openPage(page, home(lang), { now: NOW });
      await showRunningCarousel(page, lang);
      await carousel(page, lang).getByRole('button', { name: T.pause }).focus();
      await expect.poll(() => hairlineRuns(page, lang)).toBe(false);
      await page.clock.runFor(30000);
      await expect(slogan(page, lang, 0)).toBeVisible();
      // focus leaves (Tab would also scroll the page on to the index, and off screen it holds still anyway)
      await page.evaluate(() => document.activeElement.blur());
      await expect(carousel(page, lang).getByRole('button', { name: T.pause })).not.toBeFocused();
      await expect.poll(() => hairlineRuns(page, lang)).toBe(true);
      await page.clock.runFor(dwell(T.slides[0]) + 100);
      await expect(slogan(page, lang, 1)).toBeVisible();
    });

    test('Pause stops it, Play starts it again', async ({ page }) => {
      await page.clock.install();
      await H.openPage(page, home(lang), { now: NOW });
      await showRunningCarousel(page, lang);
      const car = carousel(page, lang);
      await car.getByRole('button', { name: T.pause }).click();
      await page.mouse.move(8, 120);
      await page.evaluate(() => document.activeElement.blur());
      await page.clock.runFor(30000);
      await expect(slogan(page, lang, 0)).toBeVisible();
      await car.getByRole('button', { name: T.play }).click();
      await expect(car.getByRole('button', { name: T.pause })).toBeVisible();
      await page.mouse.move(8, 120);
      await page.evaluate(() => document.activeElement.blur());
      await expect.poll(() => hairlineRuns(page, lang)).toBe(true);
      await page.clock.runFor(dwell(T.slides[0]) + 100);
      await expect(slogan(page, lang, 1)).toBeVisible();
    });

    test('reduced motion: no auto-advance and no animated transitions', async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.clock.install();
      await H.openPage(page, home(lang), { now: NOW });
      await showCarousel(page, lang);
      const car = carousel(page, lang);
      await expect(car.getByRole('button', { name: T.play })).toBeVisible();   // it starts paused
      await page.clock.runFor(60000);
      expect(await hairlineRuns(page, lang)).toBe(false);
      await expect(slogan(page, lang, 0)).toBeVisible();
      await expect(slogan(page, lang, 1)).toBeHidden();
      await recordMotion(page, lang);
      await car.getByRole('button', { name: T.next }).click();
      await expect(slogan(page, lang, 1)).toBeVisible();
      await expect(slogan(page, lang, 0)).toBeHidden();
      // the change is a cut: nothing in the carousel transitioned or animated
      expect(await motionSeen(page)).toEqual([]);
    });

    test('without reduced motion the change is a crossfade (sanity check for the test above)', async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'no-preference' });
      await H.openPage(page, home(lang), { now: NOW });
      const car = carousel(page, lang);
      await car.scrollIntoViewIfNeeded();
      await recordMotion(page, lang);
      await car.getByRole('button', { name: T.next }).click();
      await expect.poll(async () => (await motionSeen(page)).length).toBeGreaterThan(0);
    });
  });

  test.describe(`${LANG} · index`, () => {
    test('all 13 rows: name, ingredients, ml and price in euro, and the link to the full menu', async ({ page }) => {
      await H.openPage(page, home(lang), { now: NOW });
      const idx = indexSec(page, lang);
      await expect(idx.getByRole('heading', { level: 2, name: T.index })).toBeVisible();
      const rows = idx.getByRole('listitem');
      await expect(rows).toHaveCount(13);
      for (let i = 0; i < 13; i++) {
        const [name, ml, eur] = INDEX[i];
        await expect(rows.nth(i)).toContainText(name);
        await expect(rows.nth(i)).toContainText(`${ml} ml`);
        await expect(rows.nth(i)).toContainText(lang === 'bg' ? `${eur} €` : `€${eur}`);
      }
      await expect(rows.nth(0)).toContainText(lang === 'bg' ? 'водка, Скинос, лимон, битер' : 'vodka, Skinos, lemon, bitters');
      await idx.getByRole('link', { name: T.fullMenu }).click();
      await expect(page).toHaveURL(new RegExp(`${T.menuPath.replace(/\//g, '\\/')}$`));
    });

    test('focusing a drink name swaps the preview and lights that name (the name only) in its drink colour', async ({ page }) => {
      await H.openPage(page, home(lang), { now: NOW });
      const idx = indexSec(page, lang);
      const rows = idx.getByRole('listitem');
      await idx.getByRole('link', { name: T.fullMenu }).focus();
      await page.keyboard.press('Tab');
      // the next stop is the first drink's name, a link to its card on the menu (the rows themselves take no focus)
      await expect(rows.nth(0).getByRole('link')).toBeFocused();
      await expect.poll(() => shownPreview(page, lang)).toEqual(['taratorw.webp']);
      const before = await look(rows.nth(1));
      await page.keyboard.press('Tab');
      await expect(rows.nth(1).getByRole('link')).toBeFocused();
      await expect.poll(() => shownPreview(page, lang)).toEqual(['macr.webp']);
      const lit = litColour(page, DRINK.machree);
      await expect.poll(async () => (await look(rows.nth(1))).color).toBe(await lit);
      const after = await look(rows.nth(1));
      expect(after.shadow).not.toBe('none');
      expect(after.row, 'the row and its border stay as they were').toBe(before.row);
      // the previous name goes dark again
      const first = await look(rows.nth(0));
      expect(first.shadow).toBe('none');
      expect(first.color).not.toBe(after.color);
      // the focused name shows the focus ring
      expect(await rows.nth(1).getByRole('link').evaluate(el => getComputedStyle(el).outlineStyle)).not.toBe('none');
    });

    test('pointing at a row does the same', async ({ page }) => {
      await H.openPage(page, home(lang), { now: NOW });
      const idx = indexSec(page, lang);
      const rows = idx.getByRole('listitem');
      const before = await look(rows.nth(12));
      await rows.nth(12).hover();
      await expect.poll(() => shownPreview(page, lang)).toEqual(['fridge.webp']);
      await expect.poll(async () => (await look(rows.nth(12))).color).toBe(await litColour(page, DRINK.fridge));
      const after = await look(rows.nth(12));
      expect(after.shadow).not.toBe('none');
      expect(after.row).toBe(before.row);
      await rows.nth(2).hover();
      await expect.poll(() => shownPreview(page, lang)).toEqual(['blue.webp']);
      await expect.poll(async () => (await look(rows.nth(2))).color).toBe(await litColour(page, DRINK.blue));
      expect((await look(rows.nth(12))).shadow).toBe('none');
    });

    test('on a phone each row shows its glass as a thumbnail', async ({ page }) => {
      await page.setViewportSize(H.VIEWPORTS.phone);
      await H.openPage(page, home(lang), { now: NOW });
      const rows = indexSec(page, lang).getByRole('listitem');
      await rows.nth(12).scrollIntoViewIfNeeded();
      for (const i of [0, 12]) {
        const img = rows.nth(i).locator('img');
        await expect(img).toBeVisible();
        await expect.poll(() => img.evaluate(el => el.complete && el.naturalWidth > 0)).toBe(true);
        expect(await img.getAttribute('src')).toContain(`/cocktails/${INDEX[i][3]}.webp`);
      }
    });
  });

  test.describe(`${LANG} · images`, () => {
    test('every image in the three sections: lazy, with width/height, decorative ones with empty alt, and it loads', async ({ page }) => {
      const log = H.watchNetwork(page);
      await H.openPage(page, home(lang), { now: NOW });
      const imgs = [];
      for (const sec of [page.getByRole('region', { name: T.story }), carousel(page, lang), indexSec(page, lang)]) {
        imgs.push(...await sec.locator('img').evaluateAll(els => els.map(i => ({ src: i.getAttribute('src'), loading: i.getAttribute('loading'), w: i.getAttribute('width'), h: i.getAttribute('height'), alt: i.getAttribute('alt') }))));
      }
      expect(imgs.length).toBe(1 + 13 + 13 + 13);
      for (const i of imgs) {
        expect(i.w && i.h, `${i.src} width/height`).toBeTruthy();
        expect(i.alt, `${i.src} alt`).toBe('');   // all are decorative: the drink's name is always in the text beside it
        expect(i.src).toMatch(lang === 'bg' ? /^assets\/img\// : /^\.\.\/assets\/img\//);
      }
      // all three sections sit below the hero: every image waits until it is near the screen
      for (const i of imgs) expect(i.loading, i.src).toBe('lazy');
      await H.scrollThrough(page);
      await H.expectLocalReferencesResolve(page);
      H.expectCleanNetwork(log);
    });
  });

  test.describe(`${LANG} · without JavaScript`, () => {
    test.use({ javaScriptEnabled: false });

    test('all 13 cocktails are listed with name, ingredients, ml and price, and the carousel shows its first drink', async ({ page }) => {
      await H.openPage(page, home(lang));
      const idx = indexSec(page, lang);
      const rows = idx.getByRole('listitem');
      await expect(rows).toHaveCount(13);
      for (let i = 0; i < 13; i++) {
        const [name, ml, eur] = INDEX[i];
        await expect(rows.nth(i).getByText(name, { exact: true })).toBeVisible();
        await expect(rows.nth(i).getByText(`${ml} ml`)).toBeVisible();
        await expect(rows.nth(i).getByText(lang === 'bg' ? `${eur} €` : `€${eur}`)).toBeVisible();
        expect((await rows.nth(i).innerText()).split(',').length).toBeGreaterThan(1);   // the ingredients
      }
      const car = carousel(page, lang);
      await car.scrollIntoViewIfNeeded();
      await expect(slogan(page, lang, 0)).toBeVisible();
      await expect(car.getByText(T.slides[0][1], { exact: true })).toBeVisible();
      await expect(slogan(page, lang, 1)).toBeHidden();
      // no dead controls: without the script there is nothing for them to do
      await expect(car.getByRole('button')).toHaveCount(0);
      const story = page.getByRole('region', { name: T.story });
      for (const p of T.say) await expect(story.getByText(p, { exact: true })).toBeVisible();
    });
  });

  test.describe(`${LANG} · accessibility`, () => {
    for (const vp of ['phone', 'desktop']) {
      test(`${vp}: axe stays clean after using the carousel and the index`, async ({ page }) => {
        await page.setViewportSize(H.VIEWPORTS[vp]);
        await H.openPage(page, home(lang), { now: NOW });
        const car = carousel(page, lang);
        await car.scrollIntoViewIfNeeded();
        await car.getByRole('button', { name: T.next }).click();
        await indexSec(page, lang).getByRole('listitem').nth(3).focus();
        await H.expectNoSeriousA11yViolations(page);
      });
    }
  });
}

test('BG and EN: the same 13 drinks in the same order with the same ml and prices, in the index and the carousel', async ({ page }) => {
  const read = async lang => {
    await H.openPage(page, home(lang), { now: NOW });
    const rows = await indexSec(page, lang).getByRole('listitem').evaluateAll(els => els.map(li => li.textContent.replace(/\s+/g, ' ')));
    // every slide, the twelve waiting ones too (they are in the HTML, hidden until their turn)
    const slides = await carousel(page, lang).locator('[role="group"]').evaluateAll(els => els.map(g => {
      const w = document.createTreeWalker(g, NodeFilter.SHOW_TEXT), out = [];
      while (w.nextNode()) out.push(w.currentNode.data);
      return out.join(' ').replace(/\s+/g, ' ');
    }));
    const facts = s => {
      const name = INDEX.map(x => x[0]).find(n => s.includes(n));
      const ml = (s.match(/(\d+) ml/) || [])[1];
      const eur = (s.match(/€\s?(\d+)|(\d+)\s?€/) || []).slice(1).find(Boolean);
      return `${name} ${ml} ${eur}`;
    };
    return { index: rows.map(facts), carousel: slides.map(facts) };
  };
  const bg = await read('bg'), en = await read('en');
  expect(bg.index).toEqual(INDEX.map(([n, ml, eur]) => `${n} ${ml} ${eur}`));
  expect(en.index).toEqual(bg.index);
  expect(bg.carousel).toHaveLength(13);
  expect(en.carousel).toEqual(bg.carousel);
  expect([...bg.carousel].sort()).toEqual([...bg.index].sort());
});
