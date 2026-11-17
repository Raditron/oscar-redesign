// #14 Search and sharing: titles and descriptions, Open Graph / Twitter previews, JSON-LD, favicons.
// What a search engine or a chat app reads from each page, checked against what a visitor sees on it.
const { test, expect } = require('@playwright/test');
const H = require('./helpers');

const SCHEMA_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
// the day names the visit section's hours table prints, in SCHEMA_DAYS order
const DAY_NAMES = {
  bg: ['Неделя', 'Понеделник', 'Вторник', 'Сряда', 'Четвъртък', 'Петък', 'Събота'],
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
};
const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;
const CYRILLIC = /[\u0400-\u04FF]/;
const LOCALE = { bg: 'bg_BG', en: 'en_GB' };

/** An absolute address on the real host → the same file on the local test server. */
const local = abs => {
  expect(abs, 'absolute URL on the real host').toMatch(new RegExp(`^${H.SITE}/`));
  return abs.slice(H.SITE.length);
};

/** Every <meta> on the page as { 'name or property': [content, …] } and the canonical link. */
const readHead = pw => pw.evaluate(() => {
  const meta = {};
  document.querySelectorAll('head meta[name], head meta[property]').forEach(m => {
    const k = m.getAttribute('property') || m.getAttribute('name');
    (meta[k] = meta[k] || []).push(m.getAttribute('content'));
  });
  return { title: document.title, meta, canonical: document.querySelector('link[rel="canonical"]').href };
});
const one = (head, key) => {
  expect(head.meta[key], `<meta ${key}> once`).toHaveLength(1);
  return head.meta[key][0];
};

/** Every JSON-LD block on the page, parsed (a block that does not parse fails the test). */
const readJsonLd = async pw => {
  const blocks = await pw.locator('script[type="application/ld+json"]').allTextContents();
  return blocks.map((text, i) => {
    try { return JSON.parse(text); } catch (e) { throw new Error(`JSON-LD block ${i + 1} does not parse: ${e.message}`); }
  });
};
const asArray = v => (Array.isArray(v) ? v : [v]);

/** An image served by the local server: status, type and pixel size. */
async function imageInfo(pw, path) {
  const res = await pw.request.get(path);
  const size = res.status() === 200 ? await pw.evaluate(src => new Promise(ok => {
    const img = new Image();
    img.onload = () => ok({ w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = () => ok(null);
    img.src = src;
  }), path) : null;
  return { status: res.status(), type: res.headers()['content-type'], size };
}

/**
 * The week of hours as the page prints it without JavaScript (the header's fallback line), e.g.
 *   "Пн–Ср и Нд 18:00–23:30 · Чт до 02:00 · Пт–Сб до 03:00"  /  "Mon–Wed & Sun 18:00–23:30 · Thu to 02:00 · Fri–Sat to 03:00"
 * → { Monday: { opens: '18:00', closes: '23:30' }, Thursday: { closes: '02:00' }, … }
 */
function parseWeek(text, lang) {
  const abbr = { bg: ['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'], en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] }[lang];
  const weekOrder = [1, 2, 3, 4, 5, 6, 0];
  const day = a => { const i = abbr.indexOf(a.trim()); expect(i, `day "${a}" in "${text}"`).toBeGreaterThanOrEqual(0); return i; };
  const week = {};
  for (const seg of text.trim().split(/\s*·\s*/)) {
    const m = seg.match(/^(.+?)\s+(?:(\d\d:\d\d)\s*–\s*(\d\d:\d\d)|(?:до|to)\s+(\d\d:\d\d))$/);
    expect(m, `hours segment "${seg}"`).toBeTruthy();
    const hours = m[2] ? { opens: m[2], closes: m[3] } : { closes: m[4] };
    for (const part of m[1].split(/\s+(?:и|&)\s+/)) {
      const [a, b] = part.split('–');
      const from = weekOrder.indexOf(day(a)), to = b ? weekOrder.indexOf(day(b)) : from;
      for (let k = from; k <= to; k++) {
        const name = SCHEMA_DAYS[weekOrder[k]];
        expect(week[name], `${name} listed once in "${text}"`).toBeUndefined();
        week[name] = hours;
      }
    }
  }
  return week;
}

/** The structure Google's local-business and schema.org rules ask for, checked offline. */
function expectValidBar(bar, pageInfo) {
  expect(bar['@context']).toBe('https://schema.org');
  expect(bar['@type']).toBe('BarOrPub');
  expect(typeof bar.name === 'string' && bar.name.length > 0, 'name').toBe(true);
  expect(bar.url).toBe(pageInfo.url);
  expect(bar.telephone).toMatch(/^\+\d{8,15}$/);
  const a = bar.address;
  expect(a['@type']).toBe('PostalAddress');
  for (const k of ['streetAddress', 'addressLocality', 'postalCode']) expect(typeof a[k] === 'string' && a[k].length > 0, `address.${k}`).toBe(true);
  expect(a.addressCountry).toBe('BG');
  expect(bar.geo['@type']).toBe('GeoCoordinates');
  // in central Sofia, given to at least 5 decimals (Google asks for 5)
  expect(bar.geo.latitude).toBeGreaterThan(42.6); expect(bar.geo.latitude).toBeLessThan(42.8);
  expect(bar.geo.longitude).toBeGreaterThan(23.2); expect(bar.geo.longitude).toBeLessThan(23.4);
  for (const v of [bar.geo.latitude, bar.geo.longitude]) expect(String(v).split('.')[1].length).toBeGreaterThanOrEqual(5);
  const spec = asArray(bar.openingHoursSpecification);
  expect(spec.length).toBeGreaterThan(0);
  for (const s of spec) {
    expect(s['@type']).toBe('OpeningHoursSpecification');
    for (const d of asArray(s.dayOfWeek)) expect(SCHEMA_DAYS).toContain(d.replace(/^https?:\/\/schema\.org\//, ''));
    expect(s.opens).toMatch(HHMM);
    expect(s.closes).toMatch(HHMM);
  }
  for (const u of [...asArray(bar.image), bar.logo, bar.hasMenu, bar.hasMap, ...asArray(bar.sameAs)]) expect(u).toMatch(/^https:\/\//);
  // Google does not show review stars a business serves about itself, and the ratings shown on the page are
  // Google's and Tripadvisor's, not first-party reviews: none are declared here on purpose
  expect(bar.aggregateRating, 'no self-served rating').toBeUndefined();
  expect(bar.review, 'no self-served reviews').toBeUndefined();
}

test.describe('titles and descriptions', () => {
  test('every page has its own title and description, in its language', async ({ page }) => {
    const seen = { titles: new Set(), descriptions: new Set() };
    for (const p of H.PAGES) {
      await H.openPage(page, p.path);
      const head = await readHead(page);
      const description = one(head, 'description');
      expect(head.title.length, `${p.name} title length`).toBeGreaterThanOrEqual(15);
      expect(head.title.length, `${p.name} title length`).toBeLessThanOrEqual(70);
      expect(description.length, `${p.name} description length`).toBeGreaterThanOrEqual(70);
      expect(description.length, `${p.name} description length`).toBeLessThanOrEqual(170);
      // Bulgarian pages speak Bulgarian; the English pages carry no Cyrillic
      expect(CYRILLIC.test(head.title), `${p.name} title language`).toBe(p.lang === 'bg');
      expect(CYRILLIC.test(description), `${p.name} description language`).toBe(p.lang === 'bg');
      // the menu pages say they are the menu
      if (p.kind === 'menu') expect(head.title).toMatch(p.lang === 'bg' ? /^Меню/ : /^Menu/);
      seen.titles.add(head.title);
      seen.descriptions.add(description);
    }
    expect(seen.titles.size, 'unique titles').toBe(H.PAGES.length);
    expect(seen.descriptions.size, 'unique descriptions').toBe(H.PAGES.length);
  });
});

test.describe('link previews (Open Graph / Twitter)', () => {
  for (const p of H.PAGES) {
    test(`${p.name}: title, description, address and image for a shared link`, async ({ page }) => {
      await H.openPage(page, p.path);
      const head = await readHead(page);
      expect(one(head, 'og:type')).toBe('website');
      expect(one(head, 'og:site_name')).toBe(p.lang === 'bg' ? 'Оскар клуб' : 'Oscar Club');
      expect(one(head, 'og:url')).toBe(p.url);
      expect(head.canonical).toBe(p.url);
      expect(one(head, 'og:locale')).toBe(LOCALE[p.lang]);
      expect(one(head, 'og:locale:alternate')).toBe(LOCALE[p.lang === 'bg' ? 'en' : 'bg']);
      for (const k of ['og:title', 'og:description', 'twitter:title', 'twitter:description', 'og:image:alt', 'twitter:image:alt']) {
        const v = one(head, k);
        expect(v.length, k).toBeGreaterThan(10);
        expect(CYRILLIC.test(v.replace(/allow yourself to be yourself\./, '')), `${k} language`).toBe(p.lang === 'bg');
      }
      expect(one(head, 'twitter:card')).toBe('summary_large_image');
      const img = one(head, 'og:image');
      expect(one(head, 'twitter:image')).toBe(img);
      // the image resolves, is the declared type and has the declared size (1200×630, the size made for sharing)
      const info = await imageInfo(page, local(img));
      expect(info.status, `${img} resolves`).toBe(200);
      expect(info.type).toBe(one(head, 'og:image:type'));
      expect(info.size).toEqual({ w: Number(one(head, 'og:image:width')), h: Number(one(head, 'og:image:height')) });
      expect(info.size).toEqual({ w: 1200, h: 630 });
    });
  }
});

test.describe('structured data (JSON-LD)', () => {
  for (const lang of ['bg', 'en']) {
    const p = H.page(lang, 'home');

    test.describe(`${p.name}`, () => {
      // read the page as a search engine without JavaScript does: the header shows the whole week as text
      test.use({ javaScriptEnabled: false });

      test('declares the bar, and its phone, address, hours, menu and socials match the page', async ({ page }) => {
        await H.openPage(page, p.path);
        const blocks = await readJsonLd(page);
        const bars = blocks.filter(b => b['@type'] === 'BarOrPub');
        expect(bars, 'one BarOrPub').toHaveLength(1);
        const bar = bars[0];
        expectValidBar(bar, p);

        // phone: the header's call link, and every tel: link to the bar's line
        const headerTel = await page.getByRole('banner').locator('a[href^="tel:"]').first().getAttribute('href');
        expect(headerTel).toBe(`tel:${bar.telephone}`);
        const footer = page.getByRole('contentinfo');
        await expect(footer.locator(`a[href="tel:${bar.telephone}"]`)).toHaveCount(1);
        await expect(footer.getByRole('link', { name: bar.telephone.replace(/^\+359(\d{3})(\d{3})(\d{3})$/, '+359 $1 $2 $3') })).toBeVisible();

        // address: as the footer prints it ("ул. „Славянска“ 15, 1000 София" / "15 Slavyanska St, 1000 Sofia")
        const a = bar.address;
        await expect(footer.getByText(`${a.streetAddress}, ${a.postalCode} ${a.addressLocality}`, { exact: true })).toBeVisible();

        // hours: the week the page prints, day by day
        const week = parseWeek(await page.getByRole('banner').getByRole('status').innerText(), lang);
        const declared = {};
        for (const s of asArray(bar.openingHoursSpecification)) {
          for (const d of asArray(s.dayOfWeek)) {
            const name = d.replace(/^https?:\/\/schema\.org\//, '');
            expect(declared[name], `${name} declared once`).toBeUndefined();
            declared[name] = { opens: s.opens, closes: s.closes };
          }
        }
        expect(Object.keys(declared).sort()).toEqual([...SCHEMA_DAYS].sort());
        expect(Object.keys(week).sort()).toEqual([...SCHEMA_DAYS].sort());
        for (const d of SCHEMA_DAYS) {
          expect(declared[d].closes, `${d} closes`).toBe(week[d].closes);
          if (week[d].opens) expect(declared[d].opens, `${d} opens`).toBe(week[d].opens);
        }
        // the open the page prints once ("18:00–23:30") holds for the nights it gives only a close for ("до 02:00")
        const opens = new Set(Object.values(week).filter(h => h.opens).map(h => h.opens));
        expect(opens.size).toBe(1);
        for (const d of SCHEMA_DAYS) expect(declared[d].opens).toBe([...opens][0]);

        // …and the week of hours in the visit section, row by row: each day's open and close as the table prints them
        const table = page.getByRole('table', { name: lang === 'bg' ? 'Работно време' : 'Opening hours' });
        const rows = table.getByRole('row');
        await expect(rows).toHaveCount(7);
        const tabled = {};
        for (const row of await rows.all()) {
          const day = (await row.getByRole('rowheader').innerText()).trim();
          const i = DAY_NAMES[lang].indexOf(day);
          expect(i, `day "${day}" in the hours table`).toBeGreaterThanOrEqual(0);
          const m = (await row.getByRole('cell').innerText()).trim().match(/^(\d\d:\d\d)\s*–\s*(\d\d:\d\d)$/);
          expect(m, `${day}: hours "open – close"`).toBeTruthy();
          expect(tabled[SCHEMA_DAYS[i]], `${day} listed once`).toBeUndefined();
          tabled[SCHEMA_DAYS[i]] = { opens: m[1], closes: m[2] };
        }
        expect(Object.keys(tabled).sort()).toEqual([...SCHEMA_DAYS].sort());
        for (const d of SCHEMA_DAYS) expect(declared[d], `${d}: JSON-LD vs the hours table`).toEqual(tabled[d]);

        // menu: the page the header's menu link opens, in the same language
        const menuHref = await page.getByRole('navigation', { name: H.CHROME[lang].mainNav }).getByRole('link', { name: lang === 'bg' ? 'Меню' : 'Menu', exact: true }).evaluate(a => a.href);
        expect(new URL(menuHref).pathname).toBe(H.page(lang, 'menu').path);
        expect(bar.hasMenu).toBe(H.page(lang, 'menu').url);

        // socials: the footer's Instagram and Facebook links
        const socials = await footer.locator('a[href*="instagram.com"], a[href*="facebook.com"]').evaluateAll(as => as.map(a => a.href));
        expect([...asArray(bar.sameAs)].sort()).toEqual([...new Set(socials)].sort());

        // every image it names resolves here
        for (const u of [...asArray(bar.image), bar.logo]) expect((await page.request.get(local(u))).status(), u).toBe(200);
      });
    });
  }

  for (const lang of ['bg', 'en']) {
    const p = H.page(lang, 'menu');
    test(`${p.name}: declares the menu, and its sections are on the page`, async ({ page }) => {
      await H.openPage(page, p.path);
      const menus = (await readJsonLd(page)).filter(b => b['@type'] === 'Menu');
      expect(menus, 'one Menu').toHaveLength(1);
      const menu = menus[0];
      expect(menu['@context']).toBe('https://schema.org');
      expect(menu.url).toBe(p.url);
      expect(menu.inLanguage).toBe(lang);
      expect(CYRILLIC.test(menu.name)).toBe(lang === 'bg');
      const sections = asArray(menu.hasMenuSection);
      expect(sections.length).toBeGreaterThanOrEqual(3);
      const walk = list => list.forEach(s => {
        expect(s['@type']).toBe('MenuSection');
        expect(typeof s.name === 'string' && s.name.length > 0, 'section name').toBe(true);
        if (s.hasMenuSection) walk(asArray(s.hasMenuSection));
      });
      walk(sections);
      // each section that names an address points into this page, at a section that is there
      for (const s of sections.filter(x => x.url)) {
        const u = new URL(s.url);
        expect(`${u.origin}${u.pathname}`).toBe(p.url);
        await expect(page.locator(`[id="${u.hash.slice(1)}"]`), s.url).toHaveCount(1);
      }
      // the home page's bar points here
      await H.openPage(page, H.page(lang, 'home').path);
      const bar = (await readJsonLd(page)).find(b => b['@type'] === 'BarOrPub');
      expect(bar.hasMenu).toBe(menu.url);
    });
  }
});

test.describe('favicons', () => {
  for (const p of H.PAGES) {
    test(`${p.name}: SVG, PNG and Apple touch icons resolve at their declared sizes`, async ({ page }) => {
      await H.openPage(page, p.path);
      const icons = await page.locator('link[rel~="icon"], link[rel="apple-touch-icon"]').evaluateAll(ls => ls.map(l => ({
        rel: l.getAttribute('rel'), href: l.href, type: l.getAttribute('type'), sizes: l.getAttribute('sizes')
      })));
      expect(icons.find(i => i.type === 'image/svg+xml'), 'an SVG favicon').toBeTruthy();
      expect(icons.filter(i => i.rel === 'icon' && i.sizes).map(i => i.sizes).sort()).toEqual(['192x192', '32x32', '512x512']);
      expect(icons.find(i => i.rel === 'apple-touch-icon' && i.sizes === '180x180'), 'a 180px Apple touch icon').toBeTruthy();
      for (const i of icons) {
        const path = new URL(i.href).pathname;
        const info = await imageInfo(page, path);
        expect(info.status, `${path} resolves`).toBe(200);
        expect(info.size, `${path} draws`).toBeTruthy();
        if (i.type) expect(info.type, `${path} type`).toBe(i.type);
        if (i.rel === 'apple-touch-icon') expect(info.type).toBe('image/png');
        if (i.sizes) {
          const [w, h] = i.sizes.split('x').map(Number);
          expect(info.size, `${path} size`).toEqual({ w, h });
        }
      }
    });
  }
});
