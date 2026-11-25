// Seam: a seed step, as the seed calls it. The VenueSettings, Categories and Cocktails steps are written but not
// switched on until the owner's slices give them routes to load through; their content can be checked against the
// site already. Each step is handed an admin API that answers as an empty backend would and records what the step
// sends it. The expected values are the ones the pages show (mainmenu/index.html, index.html and their English
// twins), written out here rather than taken from the steps.
import { describe, expect, it } from 'vitest';
import { AdminApiError, type AdminApi } from '../../src/seed/admin-api.ts';
import { categoriesStep } from '../../src/seed/steps/categories.ts';
import { cocktailsStep } from '../../src/seed/steps/cocktails.ts';
import { venueSettingsStep } from '../../src/seed/steps/venue-settings.ts';
import { TARATOR } from '../support/cocktails.ts';
import { SITE_VENUE_SETTINGS } from '../support/venue-settings.ts';

interface Sent {
  readonly method: string;
  readonly path: string;
  // JSON, as a response body is to the contract tests: read as it comes, field by field.
  readonly body: any;
}

/** An admin API with nothing in it, as an empty backend answers, which keeps everything a step sends it. */
function emptyBackend(): { api: AdminApi; sent: Sent[] } {
  const sent: Sent[] = [];
  const api = {
    async get(path: string) {
      if (path === '/admin/venue-settings') {
        throw new AdminApiError('GET /admin/venue-settings answered 404 VENUE_SETTINGS_NOT_FOUND', 'VENUE_SETTINGS_NOT_FOUND');
      }
      return [];
    },
    async post(path: string, body: unknown) {
      sent.push({ method: 'POST', path, body });
      return body;
    },
    async put(path: string, body: unknown) {
      sent.push({ method: 'PUT', path, body });
      return body;
    },
  };
  // Only the three calls a step makes, so it stands in for the real class.
  return { api: api as unknown as AdminApi, sent };
}

describe("the venue settings step's content", () => {
  it("is the site's hours, happy hour and contacts, saved once", async () => {
    const { api, sent } = emptyBackend();

    const result = await venueSettingsStep.load(api);

    expect(result).toEqual({ added: 1, skipped: 0 });
    expect(sent).toEqual([{ method: 'PUT', path: '/admin/venue-settings', body: SITE_VENUE_SETTINGS }]);
  });

  it('has every contact the home pages link to, so none has to stay in the HTML', async () => {
    const { api, sent } = emptyBackend();

    await venueSettingsStep.load(api);

    expect(sent[0]!.body.contacts).toEqual({
      reservationPhone: '+359 899 666 633', // the header's phone
      generalEmail: 'oscarclub.sf@gmail.com', // the visit section's email
      eventsEmail: 'events@oscarclubsofia.com', // the events section
      eventsPhone: '+359 883 30 50 55',
      address: { bg: 'ул. „Славянска“ 15, 1000 София', en: '15 Slavyanska St, 1000 Sofia' }, // the footer
      // behind every "Маршрут" / "Directions" link (the &amp; in the pages' href is a plain & once read)
      mapsUrl: 'https://www.google.com/maps/dir/?api=1&destination=Oscar+Club+Cocktail+bar%2C+Slavyanska+15%2C+Sofia',
      instagramHandle: 'oscarclub_official', // instagram.com/oscarclub_official/
      facebookUrl: 'https://www.facebook.com/OscarClub.sf', // the visit section, the footer and the JSON-LD's sameAs
    });
  });
});

describe("the categories step's content", () => {
  async function loaded() {
    const { api, sent } = emptyBackend();
    const result = await categoriesStep.load(api);
    return { result, categories: sent.map(({ body }) => body), paths: sent.map(({ method, path }) => `${method} ${path}`) };
  }

  it("is the menu's twelve Categories, added one by one, in the order of its category bar", async () => {
    const { result, categories, paths } = await loaded();

    expect(result).toEqual({ added: 12, skipped: 0 });
    expect(new Set(paths)).toEqual(new Set(['POST /admin/categories']));
    expect(categories.map((category) => [category.section, category.slug, category.position])).toEqual([
      ['shots', 'shots', 1],
      ['sets', 'sets', 1],
      ['spirits', 'vodka', 1],
      ['spirits', 'gin', 2],
      ['spirits', 'tequila', 3],
      ['spirits', 'whisky', 4],
      ['spirits', 'irish', 5],
      ['spirits', 'bourbon', 6],
      ['spirits', 'digestif', 7],
      ['spirits', 'wine', 8],
      ['spirits', 'beer', 9],
      ['spirits', 'soft', 10],
    ]);
  });

  it('names each Category as the pages do, with its serving size as each page writes it', async () => {
    const { categories } = await loaded();
    const servingSize = (category: { servingSize: { bg: string; en: string } | null }) =>
      category.servingSize && [category.servingSize.bg, category.servingSize.en];

    expect(categories.map((category) => [category.name.bg, category.name.en, servingSize(category)])).toEqual([
      ['Шотове', 'Shots', ['25 ml', '25 ml']],
      ['Сетове', 'Sets', null],
      ['Водка', 'Vodka', ['50 ml', '50 ml']],
      ['Джин', 'Gin', ['50 ml', '50 ml']],
      ['Текила', 'Tequila', ['25 ml', '25 ml']],
      ['Шотландско уиски', 'Scotch whisky', ['50 ml', '50 ml']],
      ['Ирландско уиски', 'Irish whiskey', ['50 ml', '50 ml']],
      ['Бърбън', 'Bourbon', ['50 ml', '50 ml']],
      ['Дижестив', 'Digestif', ['25 ml', '25 ml']],
      ['Вино', 'Wine', ['750 ml', '750 ml']],
      ['Бира', 'Beer', ['0,5 l', '0.5 l']],
      ['Безалкохолни', 'Soft drinks', null],
    ]);
  });

  it('has as many items in each Category as the menu: 21 shots, 2 sets, and the spirits', async () => {
    const { categories } = await loaded();

    expect(categories.map((category) => category.items.length)).toEqual([21, 2, 1, 2, 1, 7, 1, 1, 1, 1, 1, 3]);
  });

  it('prices every shot at 3 € and gives each its ingredients in both languages', async () => {
    const { categories } = await loaded();
    const shots = categories[0].items;

    expect(new Set(shots.map((shot: { price: number }) => shot.price))).toEqual(new Set([300]));
    expect(shots[0]).toEqual({
      id: null,
      name: { bg: 'Adios', en: 'Adios' },
      note: { bg: 'Jägermeister, малинов шнапс, Aftershock', en: 'Jägermeister, raspberry schnapps, Aftershock' },
      price: 300,
      hidden: false,
    });
    expect(shots.at(-1).name.en).toBe('Red Devil');
  });

  it('gives the sets their names, prices and notes in both languages', async () => {
    const { categories } = await loaded();

    expect(categories[1].items.map((set: { name: object; price: number }) => [set.name, set.price])).toEqual([
      [{ bg: 'Booster Dose · 6 шота', en: 'Booster Dose · 6 shots' }, 1800],
      [{ bg: 'Revolution · 8 шота', en: 'Revolution · 8 shots' }, 2000],
    ]);
    expect(categories[1].items[0].note).toEqual({ bg: 'никой не знае', en: 'no one knows' });
  });

  it("leaves Averna's price unconfirmed, and prices the Scotch whiskies as the menu does", async () => {
    const { categories } = await loaded();
    const bySlug = (slug: string) => categories.find((category) => category.slug === slug);

    expect(bySlug('digestif').items.map((item: { price: unknown }) => item.price)).toEqual([null]);
    expect(bySlug('whisky').items.map((item: { name: { en: string }; price: number }) => [item.name.en, item.price])).toEqual([
      ['Loch Lomond', 700],
      ['Tamnavulin 12', 700],
      ['Jura 10', 900],
      ['Loch Lomond 12', 1000],
      ['Glen Grant 12', 1000],
      ['Auchentoshan 12', 1000],
      ['anCnoc', 1200],
    ]);
  });

  it('adds every item as new and shown to guests', async () => {
    const { categories } = await loaded();
    const items = categories.flatMap((category) => category.items);

    expect(items.every((item: { id: unknown; hidden: unknown }) => item.id === null && item.hidden === false)).toBe(true);
  });
});

describe("the cocktails step's content", () => {
  async function loaded() {
    const { api, sent } = emptyBackend();
    const result = await cocktailsStep.load(api);
    return { result, cocktails: sent.map(({ body }) => body), paths: sent.map(({ method, path }) => `${method} ${path}`) };
  }

  it("is the menu's thirteen Cocktails, added one by one, in its order", async () => {
    const { result, cocktails, paths } = await loaded();

    expect(result).toEqual({ added: 13, skipped: 0 });
    expect(new Set(paths)).toEqual(new Set(['POST /admin/cocktails']));
    expect(cocktails.map((cocktail) => [cocktail.slug, cocktail.position])).toEqual([
      ['tarator', 1],
      ['machree', 2],
      ['mucho', 3],
      ['blue', 4],
      ['tropilita', 5],
      ['better', 6],
      ['soju', 7],
      ['eden', 8],
      ['spraoi', 9],
      ['french69', 10],
      ['kissme', 11],
      ['cherry', 12],
      ['fridge', 13],
    ]);
  });

  it('gives Tarator every detail as the menu card shows it', async () => {
    const { cocktails } = await loaded();

    expect(cocktails[0]).toEqual(TARATOR);
  });

  it("gives each its name, base spirit, volume, price and the design's drink colour", async () => {
    const { cocktails } = await loaded();

    expect(cocktails.map((cocktail) => [cocktail.name, cocktail.baseSpirit, cocktail.volumeMl, cocktail.price, cocktail.accentColour])).toEqual([
      ['Tarator', 'vodka', 280, 1000, 'garden'],
      ['Machree', 'whiskey', 330, 800, 'berry'],
      ['Mucho Bien', 'vodka', 220, 800, 'champagne'],
      ['Blue’s’our', 'rum', 280, 600, 'curacao'],
      ['Tropilita', 'tequila', 180, 600, 'garden'],
      ['Better Taste', 'cognac', 280, 1200, 'berry'],
      ['Soju Spritz', 'soju', 280, 800, 'champagne'],
      ['Eden Garden', 'gin', 220, 800, 'amber'],
      ['Spraoi', 'whiskey', 330, 800, 'garden'],
      ['French 69', 'gin', 175, 600, 'champagne'],
      ['Kiss Me', 'rum', 250, 800, 'hibiscus'],
      ['Cherry Lady', 'vodka', 250, 1000, 'hibiscus'],
      ['Fridge Cigarette', 'tequila', 180, 600, 'amber'],
    ]);
  });

  it('gives each the photo and alt text the menu card has, in both languages', async () => {
    const { cocktails } = await loaded();

    expect(cocktails.map((cocktail) => cocktail.imagePath)).toEqual(
      ['taratorw', 'macr', 'much', 'blue', 'trop', 'better', 'sojuw', 'edenw', 'spraiow', '69', 'kissme', 'cherry', 'fridge'].map(
        (file) => `assets/img/cocktails/${file}.webp`,
      ),
    );
    expect(cocktails[3].imageAlt).toEqual({
      bg: 'Blue’s’our: ром, блу кюрасао, лимон, битер от лайка',
      en: 'Blue’s’our: rum, blue curaçao, lemon, chamomile bitters',
    });
    expect(cocktails[4].ingredients.en).toBe('tequila, kiwi, piña colada mix, lemon, bitters');
  });

  it("gives each the slogan and the description of its slide in the home page carousel, in Bulgarian", async () => {
    const { cocktails } = await loaded();

    expect(cocktails.map((cocktail) => [cocktail.name, cocktail.slogan.bg, cocktail.description.bg])).toEqual([
      ['Tarator', 'Тараторът е студена супа.', 'Нашият е в чаша: водка, Скинос, лимон и битер, с краставица, копър и пекан отгоре.'],
      ['Machree', 'Уиски, ягода и малко сърце.', 'уиски, ягода, касис, лимон'],
      ['Mucho Bien', 'Десерт, който се пие.', 'водка, Licor 43, Малибу, кондензирано мляко, лимон'],
      ['Blue’s’our', 'Синьо като часа след залез.', 'ром, блу кюрасао, лимон, битер от лайка'],
      ['Tropilita', 'Плаж в 180 ml.', 'текила, киви, пиня колада, лимон, битер'],
      ['Better Taste', 'Коняк и мед, с балсамико за кураж.', 'коняк, черешово бренди, балсамико, мед, ябълков кордиал'],
      ['Soju Spritz', 'Сеул и Венеция се срещат на „Славянска“.', 'соджу, лимонена сода, просеко'],
      ['Eden Garden', 'Кой каза, че е била ябълката?', 'джин, круша, личи, карамел, грейпфрут'],
      ['Spraoi', 'Уиски, което не се взема на сериозно.', 'уиски, киви, ябълка Грани Смит'],
      ['French 69', 'Не точно French 75. В това е смисълът.', 'джин, круша, бъз, лимон, просеко'],
      ['Kiss Me', 'Името е покана.', 'ром, хибискус, вишна, лимон'],
      ['Cherry Lady', 'Черешово бренди с маниери.', 'водка, Скинос, черешово бренди, лимон'],
      ['Fridge Cigarette', 'Димът е от мескала.', 'текила, мескал, малина, битер'],
    ]);
  });

  it("gives each the slogan and the description of its slide in the home page carousel, in English", async () => {
    const { cocktails } = await loaded();

    expect(cocktails.map((cocktail) => [cocktail.name, cocktail.slogan.en, cocktail.description.en])).toEqual([
      ['Tarator', 'Tarator is a cold cucumber soup.', 'Ours comes in a glass: vodka, Skinos, lemon and bitters, topped with cucumber, dill and a pecan.'],
      ['Machree', 'Whiskey, strawberry and a little heart.', 'whiskey, strawberry, cassis, lemon'],
      ['Mucho Bien', 'Dessert you drink.', 'vodka, Licor 43, Malibu, condensed milk, lemon'],
      ['Blue’s’our', 'Blue as the hour after sunset.', 'rum, blue curaçao, lemon, chamomile bitters'],
      ['Tropilita', 'A beach in 180 ml.', 'tequila, kiwi, piña colada mix, lemon, bitters'],
      ['Better Taste', 'Cognac and honey, with balsamic for nerve.', 'cognac, cherry brandy, balsamic, honey, apple cordial'],
      ['Soju Spritz', 'Seoul meets Venice on Slavyanska.', 'soju, lemon soda, prosecco'],
      ['Eden Garden', 'Who said it was the apple?', 'gin, pear, lychee, caramel, grapefruit'],
      ['Spraoi', 'Whiskey that doesn’t take itself seriously.', 'whiskey, kiwi, Granny Smith apple'],
      ['French 69', 'Not quite a French 75. That’s the point.', 'gin, pear, elderflower, lemon, prosecco'],
      ['Kiss Me', 'The name is an invitation.', 'rum, hibiscus, sour cherry, lemon'],
      ['Cherry Lady', 'Cherry brandy with manners.', 'vodka, Skinos, cherry brandy, lemon'],
      ['Fridge Cigarette', 'The smoke is the mezcal.', 'tequila, mezcal, raspberry, bitters'],
    ]);
  });

  it('features every one, since all thirteen are in the home page carousel, and hides none', async () => {
    const { cocktails } = await loaded();

    expect(cocktails.every((cocktail) => cocktail.featured === true && cocktail.hidden === false)).toBe(true);
  });
});
