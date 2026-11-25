// Seam: the HTTP API of the fully composed backend. The admin panel lists, adds, edits and deletes Cocktails under
// /admin/cocktails, with the token from a login. The base spirit and the accent colour come from closed lists, the
// slug is unique among the Cocktails, the price crosses the API as whole euro cents and the volume as whole
// millilitres. The photo is a path to one of the site's own images, kept as given. Every Cocktail carries the
// slogan and description its slide in the home page carousel shows.
import { describe, expect, it } from 'vitest';
import { addCocktail, adminCocktailList, asSent, cocktailAt, TARATOR } from '../support/cocktails.ts';
import { expectStatus } from '../support/expect-status.ts';
import { expectValidationFailed } from '../support/expect-validation-failed.ts';
import { asAdmin } from '../support/test-backend.ts';

// Written out here, from the menu's filter chips and the design's drink colours, rather than taken from the domain.
const BASE_SPIRITS = ['vodka', 'whiskey', 'rum', 'tequila', 'gin', 'cognac', 'soju'];
const ACCENT_COLOURS = ['garden', 'curacao', 'berry', 'hibiscus', 'amber', 'champagne'];

describe('POST /admin/cocktails', () => {
  it('adds a Cocktail and answers 201 with it: its new id and every detail as sent', async () => {
    const { api, authorization } = await asAdmin();

    const response = await api.post('/admin/cocktails').set('Authorization', authorization).send(TARATOR);

    expectStatus(response, 201);
    expect(response.body).toEqual({ id: expect.any(String), ...TARATOR });
  });

  it.each(BASE_SPIRITS)('allows %s as a base spirit', async (baseSpirit) => {
    const { api } = await asAdmin();

    const added = await addCocktail(api, { ...TARATOR, baseSpirit });

    expect(added.baseSpirit).toBe(baseSpirit);
  });

  it.each(ACCENT_COLOURS)('allows %s as an accent colour', async (accentColour) => {
    const { api } = await asAdmin();

    const added = await addCocktail(api, { ...TARATOR, accentColour });

    expect(added.accentColour).toBe(accentColour);
  });

  it('keeps a hidden Cocktail, and one that is not featured', async () => {
    const { api } = await asAdmin();

    const added = await addCocktail(api, { ...TARATOR, featured: false, hidden: true });

    expect(added).toMatchObject({ featured: false, hidden: true });
  });

  it('answers a slug another Cocktail has with 409 DUPLICATE_SLUG, and keeps nothing', async () => {
    const { api, authorization } = await asAdmin();
    const first = await addCocktail(api, TARATOR);

    const response = await api
      .post('/admin/cocktails')
      .set('Authorization', authorization)
      .send(cocktailAt(TARATOR.slug, 2));

    expectStatus(response, 409);
    expect(response.body).toEqual({ code: 'DUPLICATE_SLUG', message: expect.any(String) });
    expect(await adminCocktailList(api)).toEqual([first]);
  });

  describe('refuses details it cannot keep with 400 VALIDATION_FAILED, naming each field', () => {
    it.each([
      ['a slug with capitals', { ...TARATOR, slug: 'Tarator' }, ['slug']],
      ['a slug that ends in a hyphen', { ...TARATOR, slug: 'tarator-' }, ['slug']],
      ['a blank name', { ...TARATOR, name: '  ' }, ['name']],
      ['a name in two languages, which a Cocktail does not have', { ...TARATOR, name: { bg: 'Таратор', en: 'Tarator' } }, ['name']],
      ['a blank Bulgarian slogan', { ...TARATOR, slogan: { ...TARATOR.slogan, bg: ' ' } }, ['slogan.bg']],
      ['a slogan in one language only', { ...TARATOR, slogan: TARATOR.slogan.en }, ['slogan']],
      ['a description with no English', { ...TARATOR, description: { bg: TARATOR.description.bg } }, ['description.en']],
      ['no description, which every Cocktail has for the carousel', { ...TARATOR, description: null }, ['description']],
      ['ingredients with no English', { ...TARATOR, ingredients: { bg: TARATOR.ingredients.bg } }, ['ingredients.en']],
      ['a blank Bulgarian alt text', { ...TARATOR, imageAlt: { ...TARATOR.imageAlt, bg: '' } }, ['imageAlt.bg']],
      ['a photo on another site', { ...TARATOR, imagePath: 'https://example.com/tarator.webp' }, ['imagePath']],
      ['a script as the photo, which the site would put in an <img src>', { ...TARATOR, imagePath: 'javascript:alert(1)' }, ['imagePath']],
      ['a blank photo path', { ...TARATOR, imagePath: '' }, ['imagePath']],
      ['a base spirit that is not on the list', { ...TARATOR, baseSpirit: 'beer' }, ['baseSpirit']],
      ['a base spirit in capitals', { ...TARATOR, baseSpirit: 'Vodka' }, ['baseSpirit']],
      ['a volume of 0', { ...TARATOR, volumeMl: 0 }, ['volumeMl']],
      ['a volume that is not a whole number of millilitres', { ...TARATOR, volumeMl: 280.5 }, ['volumeMl']],
      ['a volume as text', { ...TARATOR, volumeMl: '280 ml' }, ['volumeMl']],
      ['a negative price', { ...TARATOR, price: -1000 }, ['price']],
      ['a price in euro, not cents', { ...TARATOR, price: 9.5 }, ['price']],
      ['no price, which a Cocktail always has', { ...TARATOR, price: null }, ['price']],
      ['an accent colour that is not one of the drink colours', { ...TARATOR, accentColour: 'gold' }, ['accentColour']],
      ['an accent colour as a hex value', { ...TARATOR, accentColour: '#a9d13b' }, ['accentColour']],
      ['an accent colour as the CSS token', { ...TARATOR, accentColour: '--d-garden' }, ['accentColour']],
      ['featured as text', { ...TARATOR, featured: 'yes' }, ['featured']],
      ['hidden left out', { ...TARATOR, hidden: undefined }, ['hidden']],
      ['a position of 0', { ...TARATOR, position: 0 }, ['position']],
      [
        'nothing at all',
        {},
        [
          'slug',
          'name',
          'slogan',
          'description',
          'ingredients',
          'imageAlt',
          'imagePath',
          'baseSpirit',
          'volumeMl',
          'price',
          'accentColour',
          'featured',
          'hidden',
          'position',
        ],
      ],
    ])('%s', async (_case, body, fields) => {
      const { api, authorization } = await asAdmin();

      const response = await api.post('/admin/cocktails').set('Authorization', authorization).send(body);

      expectValidationFailed(response, fields);
    });

    it('and keeps nothing it refused', async () => {
      const { api, authorization } = await asAdmin();

      const response = await api.post('/admin/cocktails').set('Authorization', authorization).send({ ...TARATOR, baseSpirit: 'beer' });

      expectStatus(response, 400);
      expect(await adminCocktailList(api)).toEqual([]);
    });
  });
});

describe('GET /admin/cocktails', () => {
  it('lists no Cocktails before any are added', async () => {
    const { api, authorization } = await asAdmin();

    const response = await api.get('/admin/cocktails').set('Authorization', authorization);

    expectStatus(response, 200);
    expect(response.body).toEqual([]);
  });

  it('lists every Cocktail by position, hidden ones included', async () => {
    const { api } = await asAdmin();
    await addCocktail(api, cocktailAt('fridge', 13));
    await addCocktail(api, cocktailAt('machree', 2, { hidden: true }));
    await addCocktail(api, cocktailAt('tarator', 1));

    const list = await adminCocktailList(api);

    expect(list.map((cocktail) => [cocktail.slug, cocktail.hidden])).toEqual([
      ['tarator', false],
      ['machree', true],
      ['fridge', false],
    ]);
  });

  it('lists Cocktails that share a position in the same order on every load', async () => {
    const { api } = await asAdmin();
    for (const slug of ['spraoi', 'eden', 'soju']) await addCocktail(api, cocktailAt(slug, 7));

    const first = await adminCocktailList(api);
    const second = await adminCocktailList(api);

    expect(first.map((cocktail) => cocktail.slug).sort()).toEqual(['eden', 'soju', 'spraoi']);
    expect(second).toEqual(first);
  });

  it('gives each Cocktail its id and every detail', async () => {
    const { api } = await asAdmin();
    const { id } = await addCocktail(api, TARATOR);

    expect(await adminCocktailList(api)).toEqual([{ id, ...TARATOR }]);
  });
});

describe('PUT /admin/cocktails/:id', () => {
  it('replaces every detail and answers 200 with the Cocktail as it now is', async () => {
    const { api, authorization } = await asAdmin();
    const { id } = await addCocktail(api, TARATOR);
    const edited = {
      ...TARATOR,
      ingredients: { bg: 'водка, краставица, лимон', en: 'vodka, cucumber, lemon' },
      slogan: { bg: 'Супа за пиене.', en: 'Soup you drink.' },
      volumeMl: 300,
      price: 1100,
      accentColour: 'champagne',
      featured: false,
      hidden: true,
      position: 4,
    };

    const response = await api.put(`/admin/cocktails/${id}`).set('Authorization', authorization).send(edited);

    expectStatus(response, 200);
    expect(response.body).toEqual({ id, ...edited });
  });

  it('keeps the change: the list shows the Cocktail as edited, once', async () => {
    const { api, authorization } = await asAdmin();
    const added = await addCocktail(api, TARATOR);

    const response = await api.put(`/admin/cocktails/${added.id}`).set('Authorization', authorization).send({ ...asSent(added), price: 1200 });

    expectStatus(response, 200);
    expect(await adminCocktailList(api)).toEqual([{ ...added, price: 1200 }]);
  });

  it('lets a Cocktail keep its own slug', async () => {
    const { api, authorization } = await asAdmin();
    const added = await addCocktail(api, TARATOR);

    const response = await api.put(`/admin/cocktails/${added.id}`).set('Authorization', authorization).send(asSent(added));

    expectStatus(response, 200);
    expect(response.body).toEqual(added);
  });

  it("answers another Cocktail's slug with 409 DUPLICATE_SLUG, and leaves the Cocktail as it was", async () => {
    const { api, authorization } = await asAdmin();
    const tarator = await addCocktail(api, TARATOR);
    const machree = await addCocktail(api, cocktailAt('machree', 2));

    const response = await api
      .put(`/admin/cocktails/${machree.id}`)
      .set('Authorization', authorization)
      .send({ ...asSent(machree), slug: tarator.slug });

    expectStatus(response, 409);
    expect(response.body).toEqual({ code: 'DUPLICATE_SLUG', message: expect.any(String) });
    expect(await adminCocktailList(api)).toEqual([tarator, machree]);
  });

  it('answers an id no Cocktail has with 404 COCKTAIL_NOT_FOUND', async () => {
    const { api, authorization } = await asAdmin();

    const response = await api.put('/admin/cocktails/no-such-cocktail').set('Authorization', authorization).send(TARATOR);

    expectStatus(response, 404);
    expect(response.body).toEqual({ code: 'COCKTAIL_NOT_FOUND', message: expect.any(String) });
  });

  it('refuses details it cannot keep with 400 VALIDATION_FAILED, and leaves the Cocktail as it was', async () => {
    const { api, authorization } = await asAdmin();
    const added = await addCocktail(api, TARATOR);

    const response = await api
      .put(`/admin/cocktails/${added.id}`)
      .set('Authorization', authorization)
      .send({ ...asSent(added), accentColour: 'gold' });

    expectValidationFailed(response, ['accentColour']);
    expect(await adminCocktailList(api)).toEqual([added]);
  });
});

describe('DELETE /admin/cocktails/:id', () => {
  it('deletes the Cocktail and answers 204 with no body', async () => {
    const { api, authorization } = await asAdmin();
    const tarator = await addCocktail(api, TARATOR);
    const machree = await addCocktail(api, cocktailAt('machree', 2));

    const response = await api.delete(`/admin/cocktails/${tarator.id}`).set('Authorization', authorization);

    expectStatus(response, 204);
    expect(response.text).toBe('');
    expect(await adminCocktailList(api)).toEqual([machree]);
  });

  it('answers an id no Cocktail has with 404 COCKTAIL_NOT_FOUND, also when it was just deleted', async () => {
    const { api, authorization } = await asAdmin();
    const { id } = await addCocktail(api, TARATOR);
    expectStatus(await api.delete(`/admin/cocktails/${id}`).set('Authorization', authorization), 204);

    const response = await api.delete(`/admin/cocktails/${id}`).set('Authorization', authorization);

    expectStatus(response, 404);
    expect(response.body).toEqual({ code: 'COCKTAIL_NOT_FOUND', message: expect.any(String) });
  });
});

describe('without a token', () => {
  it.each([
    ['GET', '/admin/cocktails'],
    ['POST', '/admin/cocktails'],
    ['PUT', '/admin/cocktails/some-id'],
    ['DELETE', '/admin/cocktails/some-id'],
  ] as const)('%s %s answers 401 LOGIN_REQUIRED and changes nothing', async (method, path) => {
    const { api } = await asAdmin();
    const added = await addCocktail(api, TARATOR);

    const response = await api[method.toLowerCase() as Lowercase<typeof method>](path.replace('some-id', added.id)).send(cocktailAt('machree', 2));

    expectStatus(response, 401);
    expect(response.body).toEqual({ code: 'LOGIN_REQUIRED', message: expect.any(String) });
    expect(await adminCocktailList(api)).toEqual([added]);
  });
});
