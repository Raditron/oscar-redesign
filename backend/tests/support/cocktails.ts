// Cocktails for the tests, added and read back through the admin API, the way the admin panel does: never written to
// or read from the database directly.
import { expectStatus } from './expect-status.ts';
import { logInAsAdmin, type LocalizedTextJson, type TestApi } from './test-backend.ts';

/** A Cocktail as the admin panel lists it. */
export interface AdminCocktail {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly slogan: LocalizedTextJson;
  readonly description: LocalizedTextJson;
  readonly ingredients: LocalizedTextJson;
  readonly imageAlt: LocalizedTextJson;
  readonly imagePath: string;
  readonly baseSpirit: string;
  readonly volumeMl: number;
  readonly price: number;
  readonly accentColour: string;
  readonly featured: boolean;
  readonly hidden: boolean;
  readonly position: number;
}

/** Tarator, as the menu card and the home page carousel show it, and as the admin panel sends it. */
export const TARATOR = {
  slug: 'tarator',
  name: 'Tarator',
  slogan: { bg: 'Тараторът е студена супа.', en: 'Tarator is a cold cucumber soup.' },
  description: {
    bg: 'Нашият е в чаша: водка, Скинос, лимон и битер, с краставица, копър и пекан отгоре.',
    en: 'Ours comes in a glass: vodka, Skinos, lemon and bitters, topped with cucumber, dill and a pecan.',
  },
  ingredients: { bg: 'водка, Скинос, лимон, битер', en: 'vodka, Skinos, lemon, bitters' },
  imageAlt: { bg: 'Tarator: водка, Скинос, лимон, битер', en: 'Tarator: vodka, Skinos, lemon, bitters' },
  imagePath: 'assets/img/cocktails/taratorw.webp',
  baseSpirit: 'vodka',
  volumeMl: 280,
  price: 1000,
  accentColour: 'garden',
  featured: true,
  hidden: false,
  position: 1,
};

/** A Cocktail of its own, at `position`, for tests about many Cocktails. */
export function cocktailAt(slug: string, position: number, changes: object = {}) {
  return { ...TARATOR, slug, name: `Cocktail ${slug}`, position, ...changes };
}

/** Adds the Cocktail as an Admin would, and returns it as the backend answered. */
export async function addCocktail(api: TestApi, cocktail: object): Promise<AdminCocktail> {
  const response = await api
    .post('/admin/cocktails')
    .set('Authorization', `Bearer ${await logInAsAdmin(api)}`)
    .send(cocktail);
  expectStatus(response, 201);
  return response.body;
}

/** Every Cocktail, as GET /admin/cocktails lists them. */
export async function adminCocktailList(api: TestApi): Promise<AdminCocktail[]> {
  const response = await api.get('/admin/cocktails').set('Authorization', `Bearer ${await logInAsAdmin(api)}`);
  expectStatus(response, 200);
  return response.body;
}

/** A Cocktail as the admin panel sends it back to change it: its details, without its id. */
export function asSent({ id: _id, ...cocktail }: AdminCocktail) {
  return cocktail;
}
