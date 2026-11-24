// Switched off: #38 (Cocktails) switches it on by adding `cocktailsStep` to SEED_STEPS in src/seed/seed.ts.
import { collectionStep, sameSlug } from '../collection-step.ts';

interface Text {
  readonly bg: string;
  readonly en: string;
}

interface SiteCocktail {
  readonly slug: string;
  readonly name: string;
  /** The first line of its slide in the home page carousel (`.v2-feat-slogan`). */
  readonly slogan: Text;
  /** The slide's second line (`.v2-lede`), where it says more than the ingredients; otherwise it is them. */
  readonly description?: Text;
  readonly ingredients: Text;
  readonly photo: string;
  readonly baseSpirit: string;
  readonly volumeMl: number;
  readonly price: number;
  readonly accentColour: string;
}

/**
 * The thirteen signature cocktails as mainmenu/index.html and en/mainmenu/index.html show them today, in their
 * order: the slug is the card's anchor (#tarator), the base spirit its filter key (data-base), the accent colour
 * its drink colour token (--drink:var(--d-garden) → "garden"), the price in whole euro cents. Every one is in the
 * home page carousel today (index.html and en/index.html), so every one is featured, and its slide gives it its
 * slogan and description, matched to it by name. The slides set the base spirit in bold (<b>водка</b>, …); the
 * description keeps the words, not the markup, since a LocalizedText is plain text.
 */
const SITE_COCKTAILS: readonly SiteCocktail[] = [
  {
    slug: 'tarator',
    name: 'Tarator',
    slogan: { bg: 'Тараторът е студена супа.', en: 'Tarator is a cold cucumber soup.' },
    description: {
      bg: 'Нашият е в чаша: водка, Скинос, лимон и битер, с краставица, копър и пекан отгоре.',
      en: 'Ours comes in a glass: vodka, Skinos, lemon and bitters, topped with cucumber, dill and a pecan.',
    },
    ingredients: { bg: 'водка, Скинос, лимон, битер', en: 'vodka, Skinos, lemon, bitters' },
    photo: 'taratorw.webp',
    baseSpirit: 'vodka',
    volumeMl: 280,
    price: 1000,
    accentColour: 'garden',
  },
  {
    slug: 'machree',
    name: 'Machree',
    slogan: { bg: 'Уиски, ягода и малко сърце.', en: 'Whiskey, strawberry and a little heart.' },
    ingredients: { bg: 'уиски, ягода, касис, лимон', en: 'whiskey, strawberry, cassis, lemon' },
    photo: 'macr.webp',
    baseSpirit: 'whiskey',
    volumeMl: 330,
    price: 800,
    accentColour: 'berry',
  },
  {
    slug: 'mucho',
    name: 'Mucho Bien',
    slogan: { bg: 'Десерт, който се пие.', en: 'Dessert you drink.' },
    ingredients: {
      bg: 'водка, Licor 43, Малибу, кондензирано мляко, лимон',
      en: 'vodka, Licor 43, Malibu, condensed milk, lemon',
    },
    photo: 'much.webp',
    baseSpirit: 'vodka',
    volumeMl: 220,
    price: 800,
    accentColour: 'champagne',
  },
  {
    slug: 'blue',
    name: 'Blue’s’our',
    slogan: { bg: 'Синьо като часа след залез.', en: 'Blue as the hour after sunset.' },
    ingredients: { bg: 'ром, блу кюрасао, лимон, битер от лайка', en: 'rum, blue curaçao, lemon, chamomile bitters' },
    photo: 'blue.webp',
    baseSpirit: 'rum',
    volumeMl: 280,
    price: 600,
    accentColour: 'curacao',
  },
  {
    slug: 'tropilita',
    name: 'Tropilita',
    slogan: { bg: 'Плаж в 180 ml.', en: 'A beach in 180 ml.' },
    ingredients: { bg: 'текила, киви, пиня колада, лимон, битер', en: 'tequila, kiwi, piña colada mix, lemon, bitters' },
    photo: 'trop.webp',
    baseSpirit: 'tequila',
    volumeMl: 180,
    price: 600,
    accentColour: 'garden',
  },
  {
    slug: 'better',
    name: 'Better Taste',
    slogan: { bg: 'Коняк и мед, с балсамико за кураж.', en: 'Cognac and honey, with balsamic for nerve.' },
    ingredients: {
      bg: 'коняк, черешово бренди, балсамико, мед, ябълков кордиал',
      en: 'cognac, cherry brandy, balsamic, honey, apple cordial',
    },
    photo: 'better.webp',
    baseSpirit: 'cognac',
    volumeMl: 280,
    price: 1200,
    accentColour: 'berry',
  },
  {
    slug: 'soju',
    name: 'Soju Spritz',
    slogan: { bg: 'Сеул и Венеция се срещат на „Славянска“.', en: 'Seoul meets Venice on Slavyanska.' },
    ingredients: { bg: 'соджу, лимонена сода, просеко', en: 'soju, lemon soda, prosecco' },
    photo: 'sojuw.webp',
    baseSpirit: 'soju',
    volumeMl: 280,
    price: 800,
    accentColour: 'champagne',
  },
  {
    slug: 'eden',
    name: 'Eden Garden',
    slogan: { bg: 'Кой каза, че е била ябълката?', en: 'Who said it was the apple?' },
    ingredients: { bg: 'джин, круша, личи, карамел, грейпфрут', en: 'gin, pear, lychee, caramel, grapefruit' },
    photo: 'edenw.webp',
    baseSpirit: 'gin',
    volumeMl: 220,
    price: 800,
    accentColour: 'amber',
  },
  {
    slug: 'spraoi',
    name: 'Spraoi',
    slogan: { bg: 'Уиски, което не се взема на сериозно.', en: 'Whiskey that doesn’t take itself seriously.' },
    ingredients: { bg: 'уиски, киви, ябълка Грани Смит', en: 'whiskey, kiwi, Granny Smith apple' },
    photo: 'spraiow.webp',
    baseSpirit: 'whiskey',
    volumeMl: 330,
    price: 800,
    accentColour: 'garden',
  },
  {
    slug: 'french69',
    name: 'French 69',
    slogan: { bg: 'Не точно French 75. В това е смисълът.', en: 'Not quite a French 75. That’s the point.' },
    ingredients: { bg: 'джин, круша, бъз, лимон, просеко', en: 'gin, pear, elderflower, lemon, prosecco' },
    photo: '69.webp',
    baseSpirit: 'gin',
    volumeMl: 175,
    price: 600,
    accentColour: 'champagne',
  },
  {
    slug: 'kissme',
    name: 'Kiss Me',
    slogan: { bg: 'Името е покана.', en: 'The name is an invitation.' },
    ingredients: { bg: 'ром, хибискус, вишна, лимон', en: 'rum, hibiscus, sour cherry, lemon' },
    photo: 'kissme.webp',
    baseSpirit: 'rum',
    volumeMl: 250,
    price: 800,
    accentColour: 'hibiscus',
  },
  {
    slug: 'cherry',
    name: 'Cherry Lady',
    slogan: { bg: 'Черешово бренди с маниери.', en: 'Cherry brandy with manners.' },
    ingredients: { bg: 'водка, Скинос, черешово бренди, лимон', en: 'vodka, Skinos, cherry brandy, lemon' },
    photo: 'cherry.webp',
    baseSpirit: 'vodka',
    volumeMl: 250,
    price: 1000,
    accentColour: 'hibiscus',
  },
  {
    slug: 'fridge',
    name: 'Fridge Cigarette',
    slogan: { bg: 'Димът е от мескала.', en: 'The smoke is the mezcal.' },
    ingredients: { bg: 'текила, мескал, малина, битер', en: 'tequila, mezcal, raspberry, bitters' },
    photo: 'fridge.webp',
    baseSpirit: 'tequila',
    volumeMl: 180,
    price: 600,
    accentColour: 'amber',
  },
];

/**
 * A cocktail as the admin API takes it. Twelve of the carousel's slides describe their cocktail by its ingredients,
 * so the description is those unless the slide says more (only Tarator's does). Its photo's alt text is the one the
 * pages give it, which is always its name and its ingredients ("Tarator: водка, Скинос, лимон, битер"), and the
 * image path is from the site's root, so it reads the same from any page. The menu's order is its position.
 */
function cocktailBody({ photo, description, ...cocktail }: SiteCocktail, index: number) {
  return {
    ...cocktail,
    description: description ?? cocktail.ingredients,
    imageAlt: { bg: `${cocktail.name}: ${cocktail.ingredients.bg}`, en: `${cocktail.name}: ${cocktail.ingredients.en}` },
    imagePath: `assets/img/cocktails/${photo}`,
    featured: true,
    hidden: false,
    position: index + 1,
  };
}

/** The cocktails step: through GET and POST /admin/cocktails. A Cocktail is already there when its slug is. */
export const cocktailsStep = collectionStep({
  name: 'cocktails',
  path: '/admin/cocktails',
  content: SITE_COCKTAILS.map(cocktailBody),
  isSame: sameSlug,
});
