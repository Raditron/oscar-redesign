// #13 Menu, the rest: shots and shot sets, the spirits / wine / beer accordions (native disclosure) and the NX0 partner
// sticker at the foot of the menu. Both languages, with and without JavaScript.
// The expected drinks and prices come straight from the prototype's data (design-system/data.js), the menu's source of truth.
const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const H = require('./helpers');

/* ---------- the menu as the prototype's data has it ---------- */
const DATA = (() => {
  const sandbox = { window: {} };
  sandbox.window.window = sandbox.window;
  vm.createContext(sandbox.window);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'design-system', 'data.js'), 'utf8'), sandbox.window);
  return sandbox.window.OC;
})();

const T = {
  bg: {
    shotsH: '21 шота. Всеки е 3 €.', setsH: 'Сетове', shotsWord: 'шота', spH: 'Уиски, джин, вино, бира. Мерим по 50 ml, текилата по 25.',
    nx0H: 'Касовата бележка тук струва нещо.', get: 'Изтегли NX0', ask: 'Питай бара', cats: 'Категории', call: 'Обади се'
  },
  en: {
    shotsH: '21 shots. Every one is €3.', setsH: 'Sets', shotsWord: 'shots', spH: 'Whisky, gin, wine, beer. We pour 50 ml, tequila 25.',
    nx0H: 'Your receipt here is worth something.', get: 'Get the NX0 app', ask: 'Ask the bar', cats: 'Categories', call: 'Call'
  }
};
const CATS = DATA.menu.map(m => m.id);   // vodka gin tequila whisky irish bourbon digestif wine beer soft
const PHONE = 'tel:+359899666633';

// What is in each shot, in Bulgarian on the BG menu (the prototype's data has it in English only): brand names stay as
// they are, the rest is translated
const SHOT_ING_BG = {
  'Adios': 'Jägermeister, малинов шнапс, Aftershock', 'B-68': 'Kahlúa, Baileys, абсент', 'Strawberry NI': 'ром, ягода, Baileys',
  'B-52': 'Kahlúa, Baileys, Cointreau', 'Blow Job': 'Kahlúa, Baileys, бита сметана', 'Bolivian Kiss': 'Agwa de Bolivia, лайм',
  'Brain Tumor': 'Carpano Dry, гренадин, Baileys', 'Brave Bull': 'текила, Kahlúa, какаов ликьор', 'Hot Jump': 'самбука, ром, Tabasco',
  'Slippery Nipple': 'самбука, Baileys, гренадин', 'Sticky Fingers': 'Aftershock Red, уиски', 'Coco-Loco': 'водка, какао, Frangelico',
  'Thin Red Line': 'текила, самбука, Tabasco', 'Viagra': 'мента, амарето, Baileys, какао', 'Cool Kiss': 'Aftershock Red, Baileys',
  'Goodbye Johnnie': 'текила, ананасов ром', 'Hammer': 'Aftershock Black, абсент', 'K-For': 'ментов шнапс, Jägermeister',
  'No Name': 'Baileys, Licor 43, Cointreau', 'Peach Lady': 'праскова, ананасов ром, гренадин', 'Red Devil': 'Aftershock Red, абсент'
};
const shotIng = (lang, name, en) => (lang === 'bg' ? SHOT_ING_BG[name] : en);
// the serving as each language writes it: EN uses the decimal point (0.5 l), BG the comma (0,5 l)
const vol = (lang, v) => (lang === 'en' ? v.replace(/(\d),(\d)/, '$1.$2') : v);
// a price the bar has not confirmed (Averna) says so, in words, where the price goes
const ASK = { bg: 'Питай бара', en: 'Ask the bar' };
const IVORY = 'rgb(243, 235, 221)';

/** Every price row in a section, in reading order: [{ name, price }] where price is a number, or null for a price still
 *  to confirm. A row is found by what a visitor sees: a price ("3 €" / "€3" / "Питай бара" / "Ask the bar") and the
 *  drink name beside it. */
const priceRows = (pw, sectionId) => pw.locator(`#${sectionId}`).evaluate(sec => {
  const re = /^(?:(\d+) €|€(\d+)|Питай бара|Ask the bar)$/;
  const out = [];
  const walk = document.createTreeWalker(sec, NodeFilter.SHOW_ELEMENT);
  for (let el = walk.nextNode(); el; el = walk.nextNode()) {
    if (el.children.length) continue;
    const m = re.exec(el.textContent.trim());
    if (!m) continue;
    const row = el.parentElement;
    const name = row.firstElementChild === el ? '' : row.firstElementChild.textContent.trim();
    out.push({ name, price: m[1] ? +m[1] : m[2] ? +m[2] : null });
  }
  return out;
});

/** what the data says each section lists, for one language */
const expectedShots = lang => [
  ...DATA.shots.map(([n]) => ({ name: n, price: 3 })),
  ...DATA.shotSets.map(s => ({ name: `${s.name} · ${s.n} ${T[lang].shotsWord}`, price: s.price }))
];
const expectedSpirits = () => DATA.menu.flatMap(m => m.items.map(([n, p]) => ({ name: n, price: p })));

/** Where the category bar ends (the pinned header + the bar), in viewport px. */
const barBottom = async (pw, lang) => {
  const c = await pw.getByRole('navigation', { name: T[lang].cats }).boundingBox();
  return c.y + c.height;
};

for (const lang of ['bg', 'en']) {
  const P = H.page(lang, 'menu');
  const L = T[lang];
  const label = id => DATA.menu.find(m => m.id === id).t[lang];

  test.describe(`${P.name}`, () => {
    test('shots: 21 at 3 € each, then the two sets, every one from the menu and nothing else', async ({ page }) => {
      await H.openPage(page, P.path);
      const shots = page.getByRole('region', { name: L.shotsH });
      await expect(shots.getByRole('heading', { level: 2 })).toHaveText(L.shotsH);
      await expect(shots.getByRole('heading', { level: 3 })).toHaveText(L.setsH);
      expect(await priceRows(page, 'shots')).toEqual(expectedShots(lang));
      // what is in each shot is said under its name
      for (const [n, ing] of DATA.shots) await expect(shots.getByText(shotIng(lang, n, ing), { exact: true }).first(), n).toBeVisible();
      // the BG menu says it in Bulgarian: none of the English lines is left (the ones made only of brand names stay)
      if (lang === 'bg') {
        for (const [n, ing] of DATA.shots) if (SHOT_ING_BG[n] !== ing) await expect(shots.getByText(ing, { exact: true }), n).toHaveCount(0);
      }
      for (const s of DATA.shotSets) await expect(shots.getByText(s.ing[lang], { exact: true })).toBeVisible();
    });

    test('spirits, wine and beer: ten accordions in the menu order, every drink and price, the first one open', async ({ page }) => {
      await H.openPage(page, P.path);
      const sp = page.getByRole('region', { name: L.spH });
      await expect(sp.getByRole('heading', { level: 2 })).toHaveText(L.spH);
      // the accordions, in order, each named by its category (and its serving and count)
      const summaries = await page.locator('#spirits details > summary').allTextContents();
      expect(summaries.map(s => s.replace(/\s+/g, ' ').trim())).toEqual(DATA.menu.map(m => `${label(m.id)} ${m.vol ? vol(lang, m.vol) + ' · ' : ''}${m.items.length}`));
      expect(await page.locator('#spirits details').evaluateAll(ds => ds.map(d => d.id))).toEqual(CATS);
      // every drink and price (closed ones included: they are in the page, just folded)
      expect(await priceRows(page, 'spirits')).toEqual(expectedSpirits());
      // the first category starts open and its drinks show; the others are folded
      await expect(page.locator('#vodka')).toHaveJSProperty('open', true);
      await expect(sp.getByText('Skyy', { exact: true })).toBeVisible();
      for (const id of CATS.slice(1)) await expect(page.locator(`#${id}`)).toHaveJSProperty('open', false);
      await expect(sp.getByText('Bickens', { exact: true })).toBeHidden();
      // a price still to confirm says so where the price goes ("Питай бара" / "Ask the bar"), never a guess; the owner's
      // to-do (the old price is in leva) is not shown to guests. Plain ivory type: not gold (not a price), not a status colour
      await page.locator('#digestif > summary').click();
      const ask = page.locator('#digestif').getByText(ASK[lang], { exact: true });
      await expect(ask).toBeVisible();
      await expect(page.locator('#digestif')).not.toContainText(DATA.menu.find(m => m.id === 'digestif').note[lang]);
      await expect(page.locator('#digestif')).not.toContainText(/BGN|лева|leva|евро|euro/);
      expect(await ask.evaluate(el => getComputedStyle(el).color)).toBe(IVORY);
      // Red Bull says what it is in plain words
      await page.locator('#soft > summary').click();
      await expect(page.locator('#soft').getByText(lang === 'bg' ? 'енергийна напитка, също без захар и с вкусове' : 'energy drink, sugar-free and flavoured editions', { exact: true })).toBeVisible();
    });

    test('the accordions open and close with Enter and with Space', async ({ page }) => {
      await H.openPage(page, P.path);
      const gin = page.locator('#gin');
      const summary = gin.locator('summary');
      const bickens = page.locator('#spirits').getByText('Bickens', { exact: true });
      // reach it with Tab, the way a keyboard user does
      await page.locator('#vodka > summary').focus();
      await page.keyboard.press('Tab');
      await expect(summary).toBeFocused();
      // a visible focus ring
      expect(await summary.evaluate(el => { const cs = getComputedStyle(el); return cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) >= 1; })).toBe(true);
      await page.keyboard.press('Enter');
      await expect(gin).toHaveJSProperty('open', true);
      await expect(bickens).toBeVisible();
      await page.keyboard.press('Enter');
      await expect(gin).toHaveJSProperty('open', false);
      await expect(bickens).toBeHidden();
      await page.keyboard.press('Space');
      await expect(gin).toHaveJSProperty('open', true);
      await expect(bickens).toBeVisible();
      await page.keyboard.press('Space');
      await expect(gin).toHaveJSProperty('open', false);
    });

    for (const vp of ['phone', 'tablet', 'desktop']) {
      test(`${vp}: category links for shots and every accordion land with the heading visible, and open the accordion`, async ({ page }) => {
        await page.setViewportSize(H.VIEWPORTS[vp]);
        await H.openPage(page, P.path);
        const nav = page.getByRole('navigation', { name: L.cats });
        for (const id of ['shots', ...CATS]) {
          await page.evaluate(() => scrollTo(0, 0));
          if (id !== 'shots' && id !== 'vodka') await expect(page.locator(`#${id}`)).toHaveJSProperty('open', false);
          await nav.locator(`a[href="#${id}"]`).click();
          await expect(page).toHaveURL(new RegExp(`#${id}$`));
          const head = id === 'shots' ? page.locator('#shots h2') : page.locator(`#${id} > summary`);
          await expect(head).toBeInViewport();
          const box = await head.boundingBox();
          expect(box.y, `#${id}: heading below the bars`).toBeGreaterThanOrEqual((await barBottom(page, lang)) - 0.5);
          expect(box.y + Math.min(box.height, 40), `#${id}: heading on screen`).toBeLessThanOrEqual(H.VIEWPORTS[vp].height);
          if (id !== 'shots') {
            await expect(page.locator(`#${id}`)).toHaveJSProperty('open', true);
            // and its first drink is there to read
            await expect(page.locator(`#${id}`).getByText(DATA.menu.find(m => m.id === id).items[0][0], { exact: true })).toBeVisible();
            await page.locator(`#${id} > summary`).click();   // fold it again for the next round
          }
        }
      });
    }

    test('a link straight to an accordion (#whisky) opens it on arrival', async ({ page }) => {
      await page.setViewportSize(H.VIEWPORTS.phone);
      await page.goto(P.path + '#whisky');
      await expect(page.locator('#whisky')).toHaveJSProperty('open', true);
      await expect(page.locator('#whisky').getByText('Auchentoshan 12', { exact: true })).toBeVisible();
    });

    test('NX0: their own logo, unaltered, links to NX0; the download is a marked "ask the bar" placeholder', async ({ page, request }) => {
      await H.openPage(page, P.path);
      const nx0 = page.getByRole('region', { name: L.nx0H });
      await expect(nx0.getByRole('heading', { level: 2 })).toHaveText(L.nx0H);
      // it sits at the foot of the menu: after the accordions, before the footer
      const order = await page.evaluate(() => {
        const y = el => el.getBoundingClientRect().top;
        return [y(document.getElementById('spirits')), y(document.getElementById('nx0')), y(document.querySelector('footer'))];
      });
      expect(order[0]).toBeLessThan(order[1]);
      expect(order[1]).toBeLessThan(order[2]);

      // the logo is a link to NX0, opening in a new tab
      const logo = nx0.getByRole('link', { name: 'NX0', exact: true });
      await expect(logo).toHaveCount(1);
      await expect(logo).toHaveAttribute('href', /^https:\/\/nx0\.ai\/?$/);
      await expect(logo).toHaveAttribute('target', '_blank');
      await expect(logo).toHaveAttribute('rel', /noopener/);
      // unaltered: the very file from nx0.ai (as kept in the prototype), at its own proportions, with nothing drawn over it
      const img = logo.getByRole('img', { name: 'NX0' });
      await img.scrollIntoViewIfNeeded();
      await expect.poll(() => img.evaluate(i => i.complete && i.naturalWidth)).toBe(640);
      const shown = await img.evaluate(i => {
        const r = i.getBoundingClientRect(), cs = getComputedStyle(i), a = getComputedStyle(i.parentElement);
        return { ratio: r.width / r.height, natural: i.naturalWidth / i.naturalHeight, filter: cs.filter, opacity: +cs.opacity * +a.opacity, blend: cs.mixBlendMode, src: i.currentSrc };
      });
      expect(shown.ratio).toBeCloseTo(shown.natural, 1);
      expect(shown.filter).toBe('none');
      expect(shown.blend).toBe('normal');
      expect(shown.opacity).toBe(1);
      const served = await (await request.get(shown.src)).body();
      expect(served.equals(fs.readFileSync(path.join(__dirname, '..', 'design-system', 'img', 'nx0-logo.png'))), 'the logo file is NX0\'s own, unchanged').toBe(true);

      // the download: no made-up link, a visibly marked placeholder instead
      await expect(nx0.getByRole('link')).toHaveCount(1);
      await expect(page.locator('a[href*="download"], a[href*="apps.apple.com"], a[href*="play.google.com"]')).toHaveCount(0);
      const get = nx0.getByText(`${L.get} · ${L.ask}`, { exact: true });
      await expect(get).toBeVisible();
      const ask = nx0.getByText(L.ask, { exact: true });
      await expect(ask).toBeVisible();
      // marked: set apart from the words around it (by weight), in ivory like the rest of the type (no status colour:
      // colour is for drinks), not dressed as a button
      const look = await ask.evaluate(el => {
        const a = getComputedStyle(el), p = getComputedStyle(el.parentElement);
        return { color: a.color, weight: +a.fontWeight, pweight: +p.fontWeight, bg: a.backgroundColor, pbg: p.backgroundColor };
      });
      expect(look.color).toBe(IVORY);
      expect(look.weight).toBeGreaterThan(look.pweight);
      expect(look.bg).toBe('rgba(0, 0, 0, 0)');
      expect(look.pbg).toBe('rgba(0, 0, 0, 0)');
    });

    for (const vp of ['phone', 'desktop']) {
      test(`${vp}: gold stays on the call: no other control on the menu page is painted gold`, async ({ page }) => {
        await page.setViewportSize(H.VIEWPORTS[vp]);
        await H.openPage(page, P.path);
        await page.evaluate(() => document.querySelectorAll('details').forEach(d => { d.open = true; }));
        const gold = await page.evaluate(() => {
          const rgb = c => (c.match(/[\d.]+/g) || []).map(Number);
          const isGold = c => { const [r, g, b, a = 1] = rgb(c); return a > 0.5 && r > 150 && g > 120 && b < 130 && r - b > 60; };
          return [...document.querySelectorAll('a, button, summary, [role="button"], [role="link"]')]
            .filter(el => { const r = el.getBoundingClientRect(); return r.width && r.height && getComputedStyle(el).visibility !== 'hidden'; })
            .filter(el => isGold(getComputedStyle(el).backgroundColor))
            .map(el => ({ text: el.textContent.trim().replace(/\s+/g, ' '), href: el.getAttribute('href') }));
        });
        for (const g of gold) expect(g.href, `gold control "${g.text}"`).toBe('tel:+359899666633');
        // and nothing in the shots, the accordions or the NX0 strip is a button
        await expect(page.locator('#shots, #spirits, #nx0').getByRole('button')).toHaveCount(0);
        if (vp === 'phone') expect(gold.map(g => g.text)).toEqual([L.call]);
      });

      test(`${vp}: axe stays clean with every accordion open and the NX0 strip in view`, async ({ page }) => {
        await page.setViewportSize(H.VIEWPORTS[vp]);
        await H.openPage(page, P.path);
        await page.evaluate(() => document.querySelectorAll('details').forEach(d => { d.open = true; }));
        await page.locator('#nx0').scrollIntoViewIfNeeded();
        await H.expectNoSeriousA11yViolations(page);
      });
    }

    test('the headings run in order: shots (h2) › sets (h3), spirits (h2), NX0 (h2)', async ({ page }) => {
      await H.openPage(page, P.path);
      const heads = await page.locator('#shots, #spirits, #nx0').getByRole('heading').evaluateAll(hs => hs.map(h => `${h.tagName} ${h.textContent.trim()}`));
      expect(heads).toEqual([`H2 ${L.shotsH}`, `H3 ${L.setsH}`, `H2 ${L.spH}`, `H2 ${L.nx0H}`]);
    });
  });

  test.describe(`${P.name} without JavaScript`, () => {
    test.use({ javaScriptEnabled: false });

    test('every shot, set and drink is in the page, and the accordions still open by click and keyboard', async ({ page }) => {
      await H.openPage(page, P.path);
      expect(await priceRows(page, 'shots')).toEqual(expectedShots(lang));
      expect(await priceRows(page, 'spirits')).toEqual(expectedSpirits());
      await expect(page.locator('#vodka')).toHaveJSProperty('open', true);
      await expect(page.locator('#spirits').getByText('Skyy', { exact: true })).toBeVisible();
      // click
      await page.locator('#wine > summary').click();
      await expect(page.locator('#wine')).toHaveJSProperty('open', true);
      await expect(page.locator('#spirits').getByText('Cinzano', { exact: true })).toBeVisible();
      // Enter and Space
      await page.locator('#beer > summary').focus();
      await page.keyboard.press('Enter');
      await expect(page.locator('#beer')).toHaveJSProperty('open', true);
      await expect(page.locator('#spirits').getByText('Schöfferhofer', { exact: true })).toBeVisible();
      await page.keyboard.press('Space');
      await expect(page.locator('#beer')).toHaveJSProperty('open', false);
      // the category bar still jumps to an accordion (it lands on its row, ready to open)
      await page.getByRole('navigation', { name: L.cats }).locator('a[href="#soft"]').click();
      await expect(page).toHaveURL(/#soft$/);
      await expect(page.locator('#soft > summary')).toBeInViewport();
      // the NX0 strip is all there
      await expect(page.getByRole('region', { name: L.nx0H }).getByRole('link', { name: 'NX0', exact: true })).toBeVisible();
      await expect(page.getByRole('region', { name: L.nx0H }).getByText(L.ask, { exact: true })).toBeVisible();
    });
  });
}

test('BG and EN list the same shots, sets and drinks, in the same order, at the same prices', async ({ browser }) => {
  const read = async lang => {
    const pw = await browser.newPage();
    await H.openPage(pw, H.page(lang, 'menu').path);
    const strip = rows => rows.map(r => ({ name: r.name.replace(/ · \d+ (шота|shots)$/, ''), price: r.price }));
    const out = {
      shots: strip(await priceRows(pw, 'shots')),
      spirits: await priceRows(pw, 'spirits'),
      cats: await pw.locator('#spirits details').evaluateAll(ds => ds.map(d => d.id)),
      nx0: await pw.locator('#nx0 a').evaluateAll(as => as.map(a => a.href))
    };
    await pw.close();
    return out;
  };
  const bg = await read('bg'), en = await read('en');
  expect(bg.shots.length).toBe(23);
  expect(bg.spirits.length).toBe(expectedSpirits().length);
  expect(en).toEqual(bg);
});
