// #17 Parity fixes from the review (#16): the behaviour and layout items, checked the way a visitor meets them.
// Language switch keeps your place (P10), index names link to their cards on the menu, one live region per page,
// contact values never break mid-word (P2), one gold action on a phone (P8), the header mark unlit (P9), no separator
// left at a line end (P3, P11, P12), the now-line never through tonight's label (P4), footer hairline (P16), nothing of
// the glass under the slate's line (P17), reduced motion (P15). Both languages.
const { test, expect } = require('@playwright/test');
const H = require('./helpers');

const TEL = 'tel:+359899666633';
const IDS = ['tarator', 'machree', 'blue', 'kissme', 'eden', 'spraoi', 'better', 'french69', 'mucho', 'soju', 'cherry', 'tropilita', 'fridge'];
const T = {
  bg: { index: 'Всички 13 авторски', cats: 'Категории', filter: 'По основа', all: 'Всички', gin: 'Джин', sig: '13 коктейла от 6 до 12 €. Избери по алкохола, който пиеш.', dirs: 'Маршрут', call: 'Обади се' },
  en: { index: 'All 13 of our own', cats: 'Categories', filter: 'By base spirit', all: 'All', gin: 'Gin', sig: '13 cocktails, €6 to €12. Pick by the spirit you drink.', dirs: 'Directions', call: 'Call' }
};
const other = lang => (lang === 'bg' ? 'en' : 'bg');
const langLink = (pw, lang, to) => pw.getByRole('group', { name: H.CHROME[lang].langGroup }).getByRole('link', { name: to.toUpperCase() });

/** Is the element actually drawn at its centre? Clipped → false. (Brought to mid-screen first, clear of the pinned
 *  header and the thumb bar, which would otherwise cover it.) */
const drawnAt = loc => loc.evaluate(el => {
  el.scrollIntoView({ block: 'center' });
  const r = el.getBoundingClientRect();
  const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
  return !!hit && (hit === el || el.contains(hit));
});

/** Two inline things sit on the same line (the last line box of `a` and the first of `b`). */
const sameLine = (a, b) => {
  const ra = [...a.getClientRects()].pop(), rb = b.getClientRects()[0];
  return Math.abs(ra.top + ra.height / 2 - (rb.top + rb.height / 2)) < Math.min(ra.height, rb.height) / 2;
};

test.describe('P10 the language switch keeps your place', () => {
  for (const lang of ['bg', 'en']) {
    const to = other(lang);
    // on the menu the header is pinned, so the switch is on screen wherever you read. On home the header scrolls away:
    // a pointer reaches the switch only back at the top (where it rightly goes to the top), but a screen reader's links
    // list or a script activates it where you are, without scrolling: that is the home case here
    for (const [kind, id] of [['home', 'music'], ['home', 'visit'], ['menu', 'shots'], ['menu', 'nx0']]) {
      test(`${H.page(lang, kind).name}: reading #${id}, the switch opens ${to.toUpperCase()} at #${id}`, async ({ page }) => {
        await H.openPage(page, H.page(lang, kind).path);
        await page.locator(`#${id}`).evaluate(el => el.scrollIntoView());
        await page.evaluate(() => scrollBy(0, 40));
        if (kind === 'menu') await langLink(page, lang, to).click();
        else await langLink(page, lang, to).evaluate(a => a.click());
        await expect(page).toHaveURL(new RegExp(`${H.page(to, kind).path.replace(/\./g, '\\.')}#${id}$`));
        await expect(page.locator('html')).toHaveAttribute('lang', to);
        await expect(page.locator(`#${id}`)).toBeInViewport();
      });
    }

    test(`${H.page(lang, 'menu').name}: reading an open accordion, the other menu opens it at the same place`, async ({ page }) => {
      await page.setViewportSize(H.VIEWPORTS.phone);
      await H.openPage(page, H.page(lang, 'menu').path);
      await page.getByRole('navigation', { name: T[lang].cats }).locator('a[href="#whisky"]').click();
      await expect(page.locator('#whisky')).toHaveJSProperty('open', true);
      await langLink(page, lang, to).click();
      await expect(page).toHaveURL(/#whisky$/);
      await expect(page.locator('#whisky')).toHaveJSProperty('open', true);
      await expect(page.locator('#whisky > summary')).toBeInViewport();
    });
  }

  test.describe('without JavaScript', () => {
    test.use({ javaScriptEnabled: false });
    test('the switch still works: it opens the top of the other page', async ({ page }) => {
      await H.openPage(page, '/index.html');
      await page.locator('#visit').evaluate(el => el.scrollIntoView());
      await langLink(page, 'bg', 'en').click();
      await expect(page).toHaveURL(/\/en\/index\.html$/);
    });
  });
});

test.describe('the cocktail index links each drink to its card on the menu', () => {
  for (const lang of ['bg', 'en']) {
    const home = H.page(lang, 'home'), menu = H.page(lang, 'menu');
    const index = pw => pw.getByRole('region', { name: T[lang].index });

    test(`${home.name}: every name is a link to its card; the rows themselves take no focus`, async ({ page }) => {
      await H.openPage(page, home.path);
      const rows = index(page).getByRole('listitem');
      await expect(rows).toHaveCount(13);
      const links = await rows.evaluateAll(lis => lis.map(li => {
        const a = li.querySelectorAll('a');
        return { n: a.length, href: a[0] && a[0].getAttribute('href'), focusable: li.tabIndex >= 0 || li.hasAttribute('tabindex') };
      }));
      expect(links.map(l => l.href)).toEqual(IDS.map(id => `mainmenu/index.html#${id}`));
      expect(links.every(l => l.n === 1 && !l.focusable)).toBe(true);
      // every target is a card on the menu, named as the link is
      await H.openPage(page, menu.path);
      for (const id of IDS) await expect(page.locator(`#${id}`).getByRole('heading', { level: 3 })).toHaveCount(1);
    });

    for (const vp of ['phone', 'tablet', 'desktop']) {
      test(`${home.name} · ${vp}: following a name lands on its card, clear of the header and the category bar`, async ({ page }) => {
        await page.setViewportSize(H.VIEWPORTS[vp]);
        await H.openPage(page, home.path);
        const link = index(page).getByRole('link', { name: 'Spraoi', exact: true });
        await link.click();
        await expect(page).toHaveURL(new RegExp(`${menu.path.replace(/\./g, '\\.')}#spraoi$`));
        const card = page.locator('#spraoi');
        await expect(card.getByRole('heading', { name: 'Spraoi' })).toBeInViewport();
        const bar = await page.getByRole('navigation', { name: T[lang].cats }).boundingBox();
        const top = (await card.boundingBox()).y;
        expect(top, 'the card starts below the pinned header and the category bar').toBeGreaterThanOrEqual(bar.y + bar.height - 0.5);
        expect(top).toBeLessThan(bar.y + bar.height + 60);
      });
    }

    test(`${menu.name}: a link to a card the filter hides brings back All first`, async ({ page }) => {
      await H.openPage(page, menu.path);
      const filter = page.getByRole('group', { name: T[lang].filter });
      await filter.getByRole('button', { name: new RegExp(`^${T[lang].gin} \\d+$`) }).click();
      await expect(page.locator('#tarator')).toBeHidden();
      await page.evaluate(() => { location.hash = 'tarator'; });
      await expect(page.locator('#tarator')).toBeVisible();
      await expect(page.locator('#tarator')).toBeInViewport();
      await expect(filter.getByRole('button', { name: new RegExp(`^${T[lang].all} \\d+$`) })).toHaveAttribute('aria-pressed', 'true');
    });

    test(`${home.name}: focusing a name and pointing at it still swap the preview`, async ({ page }) => {
      await H.openPage(page, home.path);
      const shown = () => index(page).evaluate(sec => [...sec.querySelectorAll('img[data-v2-img]')].filter(i => getComputedStyle(i).opacity === '1').map(i => i.dataset.v2Img));
      await index(page).getByRole('link', { name: 'Kiss Me', exact: true }).focus();
      await expect.poll(shown).toEqual(['kissme']);
      await index(page).getByRole('link', { name: 'Soju Spritz', exact: true }).hover();
      await expect.poll(shown).toEqual(['soju']);
    });
  }
});

test.describe('one live region per page', () => {
  for (const p of H.PAGES) {
    test(`${p.name}: the open-now status is announced from the header only; the other lines are plain text, still live`, async ({ page }) => {
      await H.openPage(page, p.path, { now: '2026-11-20T22:00' });
      const text = p.lang === 'bg' ? 'Отворено' : 'Open now';
      await expect(H.headerStatus(page)).toContainText(text);
      // every element announced as a status: the header's line, and on home the copy confirmation (empty until you copy)
      const statuses = await page.getByRole('status').evaluateAll(els => els.map(el => ({ inHeader: !!el.closest('header'), text: el.textContent.trim() })));
      expect(statuses.filter(s => s.inHeader)).toHaveLength(1);
      expect(statuses.filter(s => !s.inHeader), 'a second live status line').toEqual(p.kind === 'home' ? [{ inHeader: false, text: '' }] : []);
      // the other copies of the line are filled all the same
      const main = page.getByRole('main');
      await expect(main.getByText(new RegExp(`^${text}`)).first()).toBeVisible();
      if (p.kind === 'home') await expect(main.getByText(new RegExp(`^${text}`))).toHaveCount(2);   // hero slate, visit
    });
  }
});

test.describe('P2 contact values never break mid-word', () => {
  for (const lang of ['bg', 'en']) {
    test(`${lang.toUpperCase()}: phone, email and Instagram each stay on one line from 320 to 1440px`, async ({ page }) => {
      await H.openPage(page, H.page(lang, 'home').path);
      const visit = page.locator('#visit');
      for (const width of [320, 360, 390, 560, 760, 860, 960, 1024, 1099, 1100, 1180, 1280, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        for (const name of ['+359 899 666 633', 'oscarclub.sf@gmail.com', '@oscarclub_official', 'OscarClub.sf']) {
          const a = visit.getByRole('link', { name, exact: true });
          expect(await a.evaluate(el => el.getClientRects().length), `${name} at ${width}px`).toBe(1);
          // and it is not cut off either
          expect(await a.evaluate(el => el.scrollWidth <= el.parentElement.clientWidth + 1), `${name} fits at ${width}px`).toBe(true);
        }
      }
    });
  }
});

/** Every control painted gold on the page (its background), with its link target. */
const goldControls = pw => pw.evaluate(() => {
  const rgb = c => (c.match(/[\d.]+/g) || []).map(Number);
  const isGold = c => { const [r, g, b, a = 1] = rgb(c); return a > 0.5 && r > 150 && g > 120 && b < 130 && r - b > 60; };
  return [...document.querySelectorAll('a, button, summary')]
    .filter(el => { const r = el.getBoundingClientRect(); return r.width && r.height && getComputedStyle(el).visibility !== 'hidden'; })
    .filter(el => isGold(getComputedStyle(el).backgroundColor))
    .map(el => ({ text: el.textContent.trim().replace(/\s+/g, ' '), href: el.getAttribute('href') }));
});

test.describe('P8 one gold action on screen', () => {
  for (const lang of ['bg', 'en']) {
    for (const vp of ['phone', 'tablet']) {
      test(`home ${lang.toUpperCase()} · ${vp}: with the thumb bar on screen, the call is the only gold action; Directions is a text link`, async ({ page }) => {
        await page.setViewportSize(H.VIEWPORTS[vp]);
        await H.openPage(page, H.page(lang, 'home').path);
        for (const g of await goldControls(page)) expect(g.href, `gold control "${g.text}"`).toBe(TEL);
        const dirs = page.locator('#visit').getByRole('link', { name: T[lang].dirs });
        await dirs.scrollIntoViewIfNeeded();
        await expect(dirs).toBeVisible();
        const look = await dirs.evaluate(el => { const cs = getComputedStyle(el); return { bg: cs.backgroundColor, color: cs.color }; });
        expect(look.bg).toBe('rgba(0, 0, 0, 0)');
        expect(look.color).toBe('rgb(243, 235, 221)');
        await expect(page.getByRole('navigation', { name: H.CHROME[lang].quick }).getByRole('link', { name: T[lang].call })).toBeInViewport();
      });
    }
    test(`home ${lang.toUpperCase()} · desktop: no thumb bar, so the visit section's Directions is its gold action`, async ({ page }) => {
      await H.openPage(page, H.page(lang, 'home').path);
      const gold = await goldControls(page);
      expect(gold.map(g => g.href)).toEqual([TEL, expect.stringMatching(/^https:\/\/www\.google\.com\/maps\/dir\//)]);
    });
  }
});

test.describe('P9 one lit sign per screen: the header mark is unlit', () => {
  for (const p of H.PAGES) {
    test(`${p.name}: the header OC mark is plain ivory, no glow; the footer rings stay lit`, async ({ page }) => {
      await H.openPage(page, p.path);
      const mark = page.getByRole('banner').getByRole('img', { name: 'Oscar Club' });
      const look = await mark.evaluate(el => { const cs = getComputedStyle(el); return { filter: cs.filter, color: cs.color }; });
      expect(look.filter).toBe('none');
      expect(look.color).toBe('rgb(243, 235, 221)');
      expect(await page.getByRole('contentinfo').getByRole('img', { name: 'Oscar Club' }).evaluate(el => getComputedStyle(el).filter)).not.toBe('none');
    });
  }
});

test.describe('no separator left at the end (or start) of a line', () => {
  for (const lang of ['bg', 'en']) {
    const home = H.page(lang, 'home');

    test(`P3 ${home.name}: the "·" between the phone number and the DM link shows only when both share a line`, async ({ page }) => {
      await H.openPage(page, home.path);
      const alt = page.getByRole('region', { name: 'allow yourself to be yourself.' }).getByRole('link', { name: '+359 899 666 633' }).locator('xpath=..');
      const sep = alt.getByText('·', { exact: true });
      let wrapped = 0;
      for (const width of [320, 360, 390, 430, 560, 860, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        await sep.scrollIntoViewIfNeeded();
        const one = await alt.evaluate((p, f) => new Function('a', 'b', `return (${f})(a, b)`)(p.querySelector('a[href^="tel:"]'), p.querySelector('a[href*="ig.me"]')), sameLine.toString());
        if (!one) wrapped++;
        expect(await drawnAt(sep), `"·" drawn at ${width}px`).toBe(one);
      }
      expect(wrapped, 'the DM link wraps at some phone width').toBeGreaterThan(0);
    });

    test(`P11 ${home.name}: in the slate, a hairline stands only between two items on the same row`, async ({ page }) => {
      await H.openPage(page, home.path, { now: '2026-11-20T22:00' });
      const items = page.getByRole('region', { name: 'allow yourself to be yourself.' }).getByRole('list').getByRole('listitem');
      for (const width of [860, 900, 1000, 1100, 1200, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        await items.first().scrollIntoViewIfNeeded();
        const res = await items.evaluateAll(lis => lis.slice(1).map((li, i) => {
          const prev = lis[i], r = li.getBoundingClientRect(), rp = prev.getBoundingClientRect();
          const bw = parseFloat(getComputedStyle(li).borderLeftWidth) || 0, bwp = parseFloat(getComputedStyle(prev).borderRightWidth) || 0;
          // where a hairline between prev and li would be: li's left border, or prev's right border
          const x = bw ? r.left + bw / 2 : rp.right - bwp / 2, y = bw ? r.top + r.height / 2 : rp.top + rp.height / 2;
          const hit = document.elementFromPoint(x, y);
          const drawn = (bw || bwp) > 0 && !!hit && (hit === li || hit === prev);
          return { same: Math.abs(r.top - rp.top) < 4, drawn };
        }));
        for (const [i, r] of res.entries()) expect(r.drawn, `item ${i + 2} at ${width}px: hairline drawn = same row`).toBe(r.same);
      }
    });

    test.describe(`${home.name} without JavaScript`, () => {
      test.use({ javaScriptEnabled: false });
      test(`P12: the header's week line never leaves a "·" at a line end`, async ({ page }) => {
        await H.openPage(page, home.path);
        const status = H.headerStatus(page);
        const seps = status.getByText('·', { exact: true });
        for (const width of [320, 360, 390, 560, 760, 860, 900, 1000, 1100, 1440]) {
          await page.setViewportSize({ width, height: 900 });
          await expect(seps).toHaveCount(2);
          for (let i = 0; i < 2; i++) {
            const one = await seps.nth(i).evaluate((sep, f) => new Function('a', 'b', `return (${f})(a, b)`)(sep.parentElement, sep.parentElement.nextElementSibling), sameLine.toString());
            expect(await drawnAt(seps.nth(i)), `"·" ${i + 1} drawn at ${width}px`).toBe(one);
          }
        }
      });
    });
  }
});

test.describe('P4 the now-line never cuts through tonight\'s hours', () => {
  for (const lang of ['bg', 'en']) {
    for (const width of [320, 390, 860, 1440]) {
      test(`${lang.toUpperCase()} at ${width}px, every half hour of a Friday night`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        for (const now of ['2026-11-20T18:15', '2026-11-20T19:00', '2026-11-20T19:30', '2026-11-20T20:00', '2026-11-20T20:30', '2026-11-20T21:00', '2026-11-20T21:30', '2026-11-20T22:30', '2026-11-21T00:30']) {
          await H.openPage(page, H.page(lang, 'home').path, { now });
          const label = page.locator('#visit tr[aria-current="date"] td').getByText('18:00 – 03:00');
          await label.scrollIntoViewIfNeeded();
          // every point across the hours, at mid-height, is the hours themselves (the line passes behind them)
          const cut = await label.evaluate(el => {
            const r = el.getBoundingClientRect(), y = r.top + r.height / 2, bad = [];
            for (let x = r.left + 1; x < r.right - 1; x += 1) { const hit = document.elementFromPoint(x, y); if (!hit || !(hit === el || el.contains(hit))) bad.push(Math.round(x - r.left)); }
            return bad;
          });
          expect(cut, `${now}: points of the label covered`).toEqual([]);
        }
      });
    }
  }
});

test.describe('P16 / P17 hairlines', () => {
  for (const lang of ['bg', 'en']) {
    for (const kind of ['home', 'menu']) {
      test(`P16 ${H.page(lang, kind).name}: the footer hairline spans the whole row`, async ({ page }) => {
        for (const width of [390, 860, 1440]) {
          await page.setViewportSize({ width, height: 900 });
          await H.openPage(page, H.page(lang, kind).path);
          const r = await page.getByRole('contentinfo').evaluate(f => {
            const cs = getComputedStyle(f), fw = f.getBoundingClientRect().width - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
            const row = [...f.children].find(c => parseFloat(getComputedStyle(c).borderTopWidth) > 0);
            return { row: row.getBoundingClientRect().width, content: fw };
          });
          expect(Math.abs(r.row - r.content), `at ${width}px`).toBeLessThan(1.5);
        }
      });
    }

    test(`P17 home ${lang.toUpperCase()} at 1440px: nothing of the glass shows under the slate's hairline`, async ({ page }) => {
      await H.openPage(page, H.page(lang, 'home').path, { now: '2026-11-20T22:00' });
      const hero = page.getByRole('region', { name: 'allow yourself to be yourself.' });
      // once the sign has switched on and the glass has risen into place
      await hero.evaluate(el => Promise.all(el.getAnimations({ subtree: true }).filter(x => x.effect.getComputedTiming().iterations !== Infinity).map(x => x.finished)));
      const items = hero.getByRole('list').getByRole('listitem');
      const last = await items.last().boundingBox();
      const line = await items.first().locator('xpath=..').boundingBox();
      const glass = await page.locator('main > section').first().locator('img').first().boundingBox();
      // the strip just under the hairline, right of the last item, where the glass stands
      const x = Math.max(last.x + last.width + 24, glass.x), y = line.y + 2;
      const png = await page.screenshot({ clip: { x, y, width: 1440 - x, height: 16 } });
      const max = await page.evaluate(async b64 => {
        const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
        const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
        const ctx = c.getContext('2d'); ctx.drawImage(img, 0, 0);
        const d = ctx.getImageData(0, 0, img.width, img.height).data; let m = 0;
        for (let i = 0; i < d.length; i += 4) m = Math.max(m, d[i], d[i + 1], d[i + 2]);
        return m;
      }, png.toString('base64'));
      expect(max, 'brightest pixel under the hairline').toBeLessThan(12);
    });
  }
});

test.describe('P15 reduced motion: no arrow nudge, no card zoom', () => {
  for (const [motion, moves] of [['reduce', false], ['no-preference', true]]) {
    test(`${motion}: arrows ${moves ? 'nudge' : 'stay put'}, the menu card glass ${moves ? 'lifts' : 'stays put'}`, async ({ browser }) => {
      const ctx = await browser.newContext({ reducedMotion: motion, viewport: H.VIEWPORTS.desktop });
      const pw = await ctx.newPage();
      await H.openPage(pw, '/en/index.html');
      const link = pw.getByRole('region', { name: T.en.index }).getByRole('link', { name: /The full menu/ });
      await link.hover();
      const arrow = await link.evaluate(a => { const s = [...a.querySelectorAll('span')].pop(), cs = getComputedStyle(s); return { t: cs.transform, d: cs.transitionDuration }; });
      expect(arrow.t !== 'none', 'arrow moved').toBe(moves);
      if (!moves) expect(arrow.d).toBe('0s');
      await H.openPage(pw, '/en/mainmenu/index.html');
      const card = pw.getByRole('region', { name: T.en.sig }).getByRole('article').first();
      await card.scrollIntoViewIfNeeded();
      await card.hover();
      const img = await card.getByRole('img').evaluate(i => { const cs = getComputedStyle(i); return { t: cs.transform, d: cs.transitionDuration }; });
      expect(img.t !== 'none', 'glass moved').toBe(moves);
      if (!moves) expect(img.d).toBe('0s');
      await ctx.close();
    });
  }
});
