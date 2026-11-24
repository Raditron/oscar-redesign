// Seam: the HTTP API of the fully composed backend. Guests get the signature cocktails from GET /public/cocktails,
// without a token: the ones that aren't hidden, by position, each with what the menu card, the home page carousel
// and the cocktail index show. Featured ones are the carousel's, which shows each one's slogan and description. The
// Cocktails are added the way the admin panel adds them.
import { describe, expect, it } from 'vitest';
import { addCocktail, cocktailAt, TARATOR } from '../support/cocktails.ts';
import { expectStatus } from '../support/expect-status.ts';
import { createTestBackend, logInAsAdmin } from '../support/test-backend.ts';

const slugsIn = (body: { slug: string }[]) => body.map((cocktail) => cocktail.slug);

describe('GET /public/cocktails', () => {
  it('gives an empty list before any Cocktails are added', async () => {
    const api = await createTestBackend();

    const response = await api.get('/public/cocktails');

    expectStatus(response, 200);
    expect(response.body).toEqual([]);
  });

  it('gives each Cocktail what guests see: no id, position or hidden flag', async () => {
    const api = await createTestBackend();
    await addCocktail(api, TARATOR);

    const response = await api.get('/public/cocktails');

    expectStatus(response, 200);
    expect(response.body).toEqual([
      {
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
      },
    ]);
  });

  it("gives them by position, the bar's chosen order for the menu and the carousel alike", async () => {
    const api = await createTestBackend();
    await addCocktail(api, cocktailAt('fridge', 13));
    await addCocktail(api, cocktailAt('tarator', 1));
    await addCocktail(api, cocktailAt('machree', 2));

    const response = await api.get('/public/cocktails');

    expectStatus(response, 200);
    expect(slugsIn(response.body)).toEqual(['tarator', 'machree', 'fridge']);
  });

  it('leaves hidden Cocktails out', async () => {
    const api = await createTestBackend();
    await addCocktail(api, cocktailAt('tarator', 1));
    await addCocktail(api, cocktailAt('machree', 2, { hidden: true }));
    await addCocktail(api, cocktailAt('mucho', 3));

    const response = await api.get('/public/cocktails');

    expectStatus(response, 200);
    expect(slugsIn(response.body)).toEqual(['tarator', 'mucho']);
  });

  it('says which are featured, for the home page carousel', async () => {
    const api = await createTestBackend();
    await addCocktail(api, cocktailAt('tarator', 1, { featured: true }));
    await addCocktail(api, cocktailAt('machree', 2, { featured: false }));

    const response = await api.get('/public/cocktails');

    expectStatus(response, 200);
    expect(response.body.map((cocktail: { featured: boolean }) => cocktail.featured)).toEqual([true, false]);
  });

  it("shows an Admin's edit on the next load: a Cocktail hidden is gone", async () => {
    const api = await createTestBackend();
    const { id } = await addCocktail(api, TARATOR);
    const edit = await api
      .put(`/admin/cocktails/${id}`)
      .set('Authorization', `Bearer ${await logInAsAdmin(api)}`)
      .send({ ...TARATOR, hidden: true });
    expectStatus(edit, 200);

    const response = await api.get('/public/cocktails');

    expectStatus(response, 200);
    expect(response.body).toEqual([]);
  });

  it('lets a browser keep the list only if it checks back on every load, like every public answer', async () => {
    const api = await createTestBackend();

    const response = await api.get('/public/cocktails');

    expectStatus(response, 200);
    expect(response.headers['cache-control']).toBe('no-cache');
  });
});
