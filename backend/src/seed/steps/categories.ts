// Switched off: #37 (Categories) switches it on by adding `categoriesStep` to SEED_STEPS in src/seed/seed.ts.
import type { LocalizedTextJson } from '../admin-api.ts';
import { collectionStep, sameSlug } from '../collection-step.ts';

/** The same text in both languages: a brand ("Jura 10") or a pour ("50 ml") reads the same on either page. */
const both = (text: string): LocalizedTextJson => ({ bg: text, en: text });

/** A new MenuItem as the admin API takes it: no id yet, shown to guests. A null price is unconfirmed. */
const item = (name: LocalizedTextJson, price: number | null, note: LocalizedTextJson | null = null) => ({
  id: null,
  name,
  note,
  price,
  hidden: false,
});

/** One of the twenty-one shots: each is 3 €, with its ingredients as its note. */
const shot = (name: string, bg: string, en: string) => item(both(name), 300, { bg, en });

/**
 * The menu as mainmenu/index.html and en/mainmenu/index.html show it today, in their order, with prices in whole
 * euro cents. The slugs are the pages' anchors (#vodka, #whisky, …), which the category bar links to.
 *
 * The pages list the shots and the sets as two flat lists, and a Category always has a name, so each is one
 * Category named as the page's headings name them: "Шотове" / "Shots" (the category bar's chip) and "Сетове" /
 * "Sets" (the heading above the sets). The shots are 25 ml each (the section's kicker); a set has no one pour, and
 * neither do the soft drinks, whose rows give their own sizes.
 *
 * Averna's price is unconfirmed (null): the old site priced it in leva, and the bar hasn't confirmed it in euro.
 * A serving size is a LocalizedText, as each page writes it: the same in both but for the beer's, "0,5 l" on the
 * Bulgarian page and "0.5 l" on the English one.
 */
const SITE_CATEGORIES = [
  {
    slug: 'shots',
    section: 'shots',
    name: { bg: 'Шотове', en: 'Shots' },
    servingSize: both('25 ml'),
    position: 1,
    items: [
      shot('Adios', 'Jägermeister, малинов шнапс, Aftershock', 'Jägermeister, raspberry schnapps, Aftershock'),
      shot('B-68', 'Kahlúa, Baileys, абсент', 'Kahlúa, Baileys, absinthe'),
      shot('Strawberry NI', 'ром, ягода, Baileys', 'rum, strawberry, Baileys'),
      shot('B-52', 'Kahlúa, Baileys, Cointreau', 'Kahlúa, Baileys, Cointreau'),
      shot('Blow Job', 'Kahlúa, Baileys, бита сметана', 'Kahlúa, Baileys, whipped cream'),
      shot('Bolivian Kiss', 'Agwa de Bolivia, лайм', 'Agwa de Bolivia, lime'),
      shot('Brain Tumor', 'Carpano Dry, гренадин, Baileys', 'Carpano Dry, grenadine, Baileys'),
      shot('Brave Bull', 'текила, Kahlúa, какаов ликьор', 'tequila, Kahlúa, cacao liqueur'),
      shot('Hot Jump', 'самбука, ром, Tabasco', 'sambuca, rum, Tabasco'),
      shot('Slippery Nipple', 'самбука, Baileys, гренадин', 'sambuca, Baileys, grenadine'),
      shot('Sticky Fingers', 'Aftershock Red, уиски', 'Aftershock Red, whiskey'),
      shot('Coco-Loco', 'водка, какао, Frangelico', 'vodka, cacao, Frangelico'),
      shot('Thin Red Line', 'текила, самбука, Tabasco', 'tequila, sambuca, Tabasco'),
      shot('Viagra', 'мента, амарето, Baileys, какао', 'mint, amaretto, Baileys, cacao'),
      shot('Cool Kiss', 'Aftershock Red, Baileys', 'Aftershock Red, Baileys'),
      shot('Goodbye Johnnie', 'текила, ананасов ром', 'tequila, pineapple rum'),
      shot('Hammer', 'Aftershock Black, абсент', 'Aftershock Black, absinthe'),
      shot('K-For', 'ментов шнапс, Jägermeister', 'mint schnapps, Jägermeister'),
      shot('No Name', 'Baileys, Licor 43, Cointreau', 'Baileys, Licor 43, Cointreau'),
      shot('Peach Lady', 'праскова, ананасов ром, гренадин', 'peach, pineapple rum, grenadine'),
      shot('Red Devil', 'Aftershock Red, абсент', 'Aftershock Red, absinthe'),
    ],
  },
  {
    slug: 'sets',
    section: 'sets',
    name: { bg: 'Сетове', en: 'Sets' },
    servingSize: null,
    position: 1,
    items: [
      item({ bg: 'Booster Dose · 6 шота', en: 'Booster Dose · 6 shots' }, 1800, { bg: 'никой не знае', en: 'no one knows' }),
      item({ bg: 'Revolution · 8 шота', en: 'Revolution · 8 shots' }, 2000, {
        bg: 'уиски, амарето, водка, блу кюрасао, ром, гренадин',
        en: 'whisky, amaretto, vodka, blue curaçao, rum, grenadine',
      }),
    ],
  },
  {
    slug: 'vodka',
    section: 'spirits',
    name: { bg: 'Водка', en: 'Vodka' },
    servingSize: both('50 ml'),
    position: 1,
    items: [item(both('Skyy'), 500)],
  },
  {
    slug: 'gin',
    section: 'spirits',
    name: { bg: 'Джин', en: 'Gin' },
    servingSize: both('50 ml'),
    position: 2,
    items: [item(both('Bickens'), 500), item(both('Rocu'), 800)],
  },
  {
    slug: 'tequila',
    section: 'spirits',
    name: { bg: 'Текила', en: 'Tequila' },
    servingSize: both('25 ml'),
    position: 3,
    items: [item(both('Espolòn Silver / Reposado'), 300)],
  },
  {
    slug: 'whisky',
    section: 'spirits',
    name: { bg: 'Шотландско уиски', en: 'Scotch whisky' },
    servingSize: both('50 ml'),
    position: 4,
    items: [
      item(both('Loch Lomond'), 700),
      item(both('Tamnavulin 12'), 700),
      item(both('Jura 10'), 900),
      item(both('Loch Lomond 12'), 1000),
      item(both('Glen Grant 12'), 1000),
      item(both('Auchentoshan 12'), 1000),
      item(both('anCnoc'), 1200),
    ],
  },
  {
    slug: 'irish',
    section: 'spirits',
    name: { bg: 'Ирландско уиски', en: 'Irish whiskey' },
    servingSize: both('50 ml'),
    position: 5,
    items: [item(both('Kilbeggan'), 500)],
  },
  {
    slug: 'bourbon',
    section: 'spirits',
    name: { bg: 'Бърбън', en: 'Bourbon' },
    servingSize: both('50 ml'),
    position: 6,
    items: [item(both('Jim Beam'), 500)],
  },
  {
    slug: 'digestif',
    section: 'spirits',
    name: { bg: 'Дижестив', en: 'Digestif' },
    servingSize: both('25 ml'),
    position: 7,
    items: [item(both('Averna'), null)],
  },
  {
    slug: 'wine',
    section: 'spirits',
    name: { bg: 'Вино', en: 'Wine' },
    servingSize: both('750 ml'),
    position: 8,
    items: [item(both('Cinzano'), 3500)],
  },
  {
    slug: 'beer',
    section: 'spirits',
    name: { bg: 'Бира', en: 'Beer' },
    servingSize: { bg: '0,5 l', en: '0.5 l' },
    position: 9,
    items: [item(both('Schöfferhofer'), 500)],
  },
  {
    slug: 'soft',
    section: 'spirits',
    name: { bg: 'Безалкохолни', en: 'Soft drinks' },
    servingSize: null,
    position: 10,
    items: [
      item(both('Coca-Cola · 330 ml'), 300),
      item(both('Crodo lemon / orange / mojito · 330 ml'), 300),
      item(both('Red Bull · 250 ml'), 400, {
        bg: 'енергийна напитка, също без захар и с вкусове',
        en: 'energy drink, sugar-free and flavoured editions',
      }),
    ],
  },
];

export const categoriesStep = collectionStep({
  name: 'categories',
  path: '/admin/categories',
  content: SITE_CATEGORIES,
  isSame: sameSlug,
});
