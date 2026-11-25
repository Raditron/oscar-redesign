// Seam: the HTTP API of the fully composed backend. The admin panel lists, adds, edits and deletes Categories under
// /admin/categories, with the token from a login. A Category is saved whole, its MenuItems included: an item sent
// with its id stays that item, an item with a null id is new, and an item left out is removed; the items' order is
// the order sent. Prices cross the API as whole euro cents; an unconfirmed price is an explicit null. A serving size
// is written in both languages ("0,5 l" / "0.5 l"), or null for none.
import { describe, expect, it } from 'vitest';
import { addCategory, adminCategoryList, asSent, categoryAt, newItem, SCOTCH, type AdminCategory } from '../support/categories.ts';
import { expectStatus } from '../support/expect-status.ts';
import { expectValidationFailed } from '../support/expect-validation-failed.ts';
import { asAdmin } from '../support/test-backend.ts';

const namesIn = (category: AdminCategory) => category.items.map((item) => item.name.en);

describe('POST /admin/categories', () => {
  it('adds a Category and answers 201 with it: its new id, its details, and an id for each item, in the order sent', async () => {
    const { api, authorization } = await asAdmin();

    const response = await api.post('/admin/categories').set('Authorization', authorization).send(SCOTCH);

    expectStatus(response, 201);
    expect(response.body).toEqual({
      ...SCOTCH,
      id: expect.any(String),
      items: SCOTCH.items.map((item) => ({ ...item, id: expect.any(String) })),
    });
    expect(new Set(response.body.items.map((item: { id: string }) => item.id)).size).toBe(3);
  });

  it('keeps an unconfirmed price (null) and a price of 0 € (0) apart', async () => {
    const { api } = await asAdmin();

    const added = await addCategory(api, { ...SCOTCH, items: [newItem('Averna', null), newItem('Water', 0)] });

    expect(added.items.map((item) => item.price)).toEqual([null, 0]);
  });

  it('keeps a hidden item, marked hidden, and a note in both languages', async () => {
    const { api } = await asAdmin();
    const redBull = { ...newItem('Red Bull · 250 ml', 400), note: { bg: 'енергийна напитка', en: 'energy drink' }, hidden: true };

    const added = await addCategory(api, { ...SCOTCH, items: [redBull] });

    expect(added.items).toEqual([{ ...redBull, id: expect.any(String) }]);
  });

  it('allows a Category with no serving size (null) and no items yet', async () => {
    const { api } = await asAdmin();

    const added = await addCategory(api, { ...SCOTCH, servingSize: null, items: [] });

    expect(added).toMatchObject({ servingSize: null, items: [] });
  });

  it('answers a slug another Category has with 409 DUPLICATE_SLUG, and keeps nothing', async () => {
    const { api, authorization } = await asAdmin();
    const first = await addCategory(api, SCOTCH);

    const response = await api
      .post('/admin/categories')
      .set('Authorization', authorization)
      .send(categoryAt('spirits', SCOTCH.slug, 9));

    expectStatus(response, 409);
    expect(response.body).toEqual({ code: 'DUPLICATE_SLUG', message: expect.any(String) });
    expect(await adminCategoryList(api)).toEqual([first]);
  });

  describe('refuses details it cannot keep with 400 VALIDATION_FAILED, naming each field', () => {
    const [loch, jura] = SCOTCH.items;

    it.each([
      ['a slug with capitals', { ...SCOTCH, slug: 'Whisky' }, ['slug']],
      ['a slug with a space', { ...SCOTCH, slug: 'scotch whisky' }, ['slug']],
      ['a slug in Cyrillic', { ...SCOTCH, slug: 'уиски' }, ['slug']],
      ['a section the menu does not have', { ...SCOTCH, section: 'cocktails' }, ['section']],
      ['a name with no English', { ...SCOTCH, name: { bg: SCOTCH.name.bg } }, ['name.en']],
      ['a blank Bulgarian serving size, rather than null for none', { ...SCOTCH, servingSize: { bg: '  ', en: '50 ml' } }, ['servingSize.bg']],
      ['a serving size in one language only', { ...SCOTCH, servingSize: '50 ml' }, ['servingSize']],
      ['no serving size at all, rather than null', { ...SCOTCH, servingSize: undefined }, ['servingSize']],
      ['a position of 0', { ...SCOTCH, position: 0 }, ['position']],
      ['a position that is not a whole number', { ...SCOTCH, position: 1.5 }, ['position']],
      ['items that are not a list', { ...SCOTCH, items: 'Jura 10' }, ['items']],
      ['an item with a blank Bulgarian name', { ...SCOTCH, items: [{ ...loch, name: { bg: ' ', en: 'Loch Lomond' } }] }, ['items.0.name.bg']],
      ['an item with a negative price', { ...SCOTCH, items: [loch, { ...jura, price: -900 }] }, ['items.1.price']],
      ['an item priced in euro, not cents', { ...SCOTCH, items: [{ ...loch, price: 7.5 }] }, ['items.0.price']],
      ['an item with no price at all, rather than null for unconfirmed', { ...SCOTCH, items: [{ ...loch, price: undefined }] }, ['items.0.price']],
      ['an item with a note in one language only', { ...SCOTCH, items: [{ ...loch, note: { bg: 'торфено' } }] }, ['items.0.note.en']],
      ['an item that does not say whether it is hidden', { ...SCOTCH, items: [{ ...loch, hidden: undefined }] }, ['items.0.hidden']],
      ['an item with no id at all, rather than null for a new one', { ...SCOTCH, items: [{ ...loch, id: undefined }] }, ['items.0.id']],
      ['nothing at all', {}, ['items', 'name', 'position', 'section', 'servingSize', 'slug']],
    ])('%s', async (_case, body, fields) => {
      const { api, authorization } = await asAdmin();

      const response = await api.post('/admin/categories').set('Authorization', authorization).send(body);

      expectValidationFailed(response, fields);
    });

    it('and keeps nothing it refused', async () => {
      const { api, authorization } = await asAdmin();

      const response = await api.post('/admin/categories').set('Authorization', authorization).send({ ...SCOTCH, position: 0 });

      expectStatus(response, 400);
      expect(await adminCategoryList(api)).toEqual([]);
    });
  });

  it('refuses an item id on a new Category, which has no items yet, with 400 VALIDATION_FAILED', async () => {
    const { api, authorization } = await asAdmin();

    const response = await api
      .post('/admin/categories')
      .set('Authorization', authorization)
      .send({ ...SCOTCH, items: [{ ...newItem('Jura 10'), id: 'an-item-of-another-category' }] });

    expectStatus(response, 400);
    expect(response.body).toMatchObject({ code: 'VALIDATION_FAILED', message: expect.any(String) });
    expect(await adminCategoryList(api)).toEqual([]);
  });
});

describe('GET /admin/categories', () => {
  it('lists no Categories before any are added', async () => {
    const { api, authorization } = await asAdmin();

    const response = await api.get('/admin/categories').set('Authorization', authorization);

    expectStatus(response, 200);
    expect(response.body).toEqual([]);
  });

  it("lists every Category, each Section's by position", async () => {
    const { api } = await asAdmin();
    for (const category of [
      categoryAt('spirits', 'gin', 2),
      categoryAt('sets', 'sets', 1),
      categoryAt('spirits', 'vodka', 1),
      categoryAt('shots', 'shots', 1),
      categoryAt('spirits', 'tequila', 3),
    ]) {
      await addCategory(api, category);
    }

    const list = await adminCategoryList(api);

    const slugsIn = (section: string) => list.filter((category) => category.section === section).map((category) => category.slug);
    expect(list).toHaveLength(5);
    expect([slugsIn('shots'), slugsIn('sets'), slugsIn('spirits')]).toEqual([['shots'], ['sets'], ['vodka', 'gin', 'tequila']]);
  });

  it('lists Categories that share a position in the same order on every load', async () => {
    const { api } = await asAdmin();
    for (const slug of ['wine', 'beer', 'soft']) await addCategory(api, categoryAt('spirits', slug, 8));

    const first = await adminCategoryList(api);
    const second = await adminCategoryList(api);

    expect(first.map((category) => category.slug).sort()).toEqual(['beer', 'soft', 'wine']);
    expect(second).toEqual(first);
  });

  it('gives each Category its id, details and items, hidden ones included', async () => {
    const { api } = await asAdmin();
    const hidden = { ...newItem('Jura 10', 900), hidden: true };
    const added = await addCategory(api, { ...SCOTCH, items: [newItem('Loch Lomond', 700), hidden] });

    const list = await adminCategoryList(api);

    expect(list).toEqual([added]);
    expect(list[0]?.items.map((item) => item.hidden)).toEqual([false, true]);
  });
});

describe('PUT /admin/categories/:id', () => {
  it('replaces the details and answers 200 with the Category as it now is, each item sent with its id still that item', async () => {
    const { api, authorization } = await asAdmin();
    const added = await addCategory(api, SCOTCH);
    const [loch, jura, ancnoc] = added.items;
    const edited = {
      ...asSent(added),
      name: { bg: 'Шотландски', en: 'Scotch' },
      servingSize: { bg: '40 ml', en: '40 ml' },
      items: [{ ...loch!, price: 750 }, jura!, ancnoc!],
    };

    const response = await api.put(`/admin/categories/${added.id}`).set('Authorization', authorization).send(edited);

    expectStatus(response, 200);
    expect(response.body).toEqual({ ...edited, id: added.id });
  });

  it('puts the items in the order sent, each keeping its id', async () => {
    const { api, authorization } = await asAdmin();
    const added = await addCategory(api, SCOTCH);
    const reversed = [...added.items].reverse();

    const response = await api
      .put(`/admin/categories/${added.id}`)
      .set('Authorization', authorization)
      .send({ ...asSent(added), items: reversed });

    expectStatus(response, 200);
    expect(response.body.items).toEqual(reversed);
  });

  it('adds an item sent with a null id, with a new id, and removes an item left out', async () => {
    const { api, authorization } = await asAdmin();
    const added = await addCategory(api, SCOTCH);
    const [loch, , ancnoc] = added.items;

    const response = await api
      .put(`/admin/categories/${added.id}`)
      .set('Authorization', authorization)
      .send({ ...asSent(added), items: [loch, newItem('Talisker 10', 1100), ancnoc] });

    expectStatus(response, 200);
    expect(namesIn(response.body)).toEqual(['Loch Lomond', 'Talisker 10', 'anCnoc']);
    const talisker = response.body.items[1];
    expect([loch!.id, ancnoc!.id]).not.toContain(talisker.id);
    expect(talisker.id).toEqual(expect.any(String));
  });

  it('hides an item and shows it again, keeping it the same item', async () => {
    const { api, authorization } = await asAdmin();
    const added = await addCategory(api, SCOTCH);
    const withJura = (hidden: boolean) => ({ ...asSent(added), items: added.items.map((item) => (item.name.en === 'Jura 10' ? { ...item, hidden } : item)) });

    const hidden = await api.put(`/admin/categories/${added.id}`).set('Authorization', authorization).send(withJura(true));
    const shown = await api.put(`/admin/categories/${added.id}`).set('Authorization', authorization).send(withJura(false));

    expectStatus(hidden, 200);
    expectStatus(shown, 200);
    expect(hidden.body.items.map((item: { hidden: boolean }) => item.hidden)).toEqual([false, true, false]);
    expect(shown.body).toEqual(added);
  });

  it('moves a Category to another section and gives it a new slug', async () => {
    const { api, authorization } = await asAdmin();
    const added = await addCategory(api, SCOTCH);
    const moved = { ...asSent(added), slug: 'whisky-shots', section: 'shots', position: 2 };

    const response = await api.put(`/admin/categories/${added.id}`).set('Authorization', authorization).send(moved);

    expectStatus(response, 200);
    expect(response.body).toEqual({ ...moved, id: added.id });
  });

  it('keeps the change: the list shows the Category as edited, once', async () => {
    const { api, authorization } = await asAdmin();
    const added = await addCategory(api, SCOTCH);

    const response = await api.put(`/admin/categories/${added.id}`).set('Authorization', authorization).send({ ...asSent(added), position: 5 });

    expectStatus(response, 200);
    expect(await adminCategoryList(api)).toEqual([{ ...added, position: 5 }]);
  });

  it("answers another Category's slug with 409 DUPLICATE_SLUG, and leaves the Category as it was", async () => {
    const { api, authorization } = await asAdmin();
    const gin = await addCategory(api, categoryAt('spirits', 'gin', 2));
    const scotch = await addCategory(api, SCOTCH);

    const response = await api
      .put(`/admin/categories/${scotch.id}`)
      .set('Authorization', authorization)
      .send({ ...asSent(scotch), slug: gin.slug });

    expectStatus(response, 409);
    expect(response.body).toEqual({ code: 'DUPLICATE_SLUG', message: expect.any(String) });
    expect(await adminCategoryList(api)).toEqual([gin, scotch]);
  });

  it('answers an id no Category has with 404 CATEGORY_NOT_FOUND', async () => {
    const { api, authorization } = await asAdmin();

    const response = await api.put('/admin/categories/no-such-category').set('Authorization', authorization).send(SCOTCH);

    expectStatus(response, 404);
    expect(response.body).toEqual({ code: 'CATEGORY_NOT_FOUND', message: expect.any(String) });
  });

  it.each([
    ['an item id the Category does not have', (category: AdminCategory) => [...category.items, { ...category.items[0]!, id: 'no-such-item' }]],
    ['the same item twice', (category: AdminCategory) => [...category.items, category.items[0]!]],
  ])('refuses %s with 400 VALIDATION_FAILED, and leaves the Category as it was', async (_case, itemsOf) => {
    const { api, authorization } = await asAdmin();
    const added = await addCategory(api, SCOTCH);

    const response = await api
      .put(`/admin/categories/${added.id}`)
      .set('Authorization', authorization)
      .send({ ...asSent(added), items: itemsOf(added) });

    expectStatus(response, 400);
    expect(response.body).toMatchObject({ code: 'VALIDATION_FAILED', message: expect.any(String) });
    expect(await adminCategoryList(api)).toEqual([added]);
  });

  it('refuses details it cannot keep with 400 VALIDATION_FAILED, and leaves the Category as it was', async () => {
    const { api, authorization } = await asAdmin();
    const added = await addCategory(api, SCOTCH);
    const [loch, ...rest] = added.items;

    const response = await api
      .put(`/admin/categories/${added.id}`)
      .set('Authorization', authorization)
      .send({ ...asSent(added), items: [{ ...loch!, price: -1 }, ...rest] });

    expectValidationFailed(response, ['items.0.price']);
    expect(await adminCategoryList(api)).toEqual([added]);
  });
});

describe('DELETE /admin/categories/:id', () => {
  it('deletes the Category, its items with it, and answers 204 with no body', async () => {
    const { api, authorization } = await asAdmin();
    const scotch = await addCategory(api, SCOTCH);
    const gin = await addCategory(api, categoryAt('spirits', 'gin', 2));

    const response = await api.delete(`/admin/categories/${scotch.id}`).set('Authorization', authorization);

    expectStatus(response, 204);
    expect(response.text).toBe('');
    expect(await adminCategoryList(api)).toEqual([gin]);
  });

  it('answers an id no Category has with 404 CATEGORY_NOT_FOUND, also when it was just deleted', async () => {
    const { api, authorization } = await asAdmin();
    const { id } = await addCategory(api, SCOTCH);
    expectStatus(await api.delete(`/admin/categories/${id}`).set('Authorization', authorization), 204);

    const response = await api.delete(`/admin/categories/${id}`).set('Authorization', authorization);

    expectStatus(response, 404);
    expect(response.body).toEqual({ code: 'CATEGORY_NOT_FOUND', message: expect.any(String) });
  });
});

describe('without a token', () => {
  it.each([
    ['GET', '/admin/categories'],
    ['POST', '/admin/categories'],
    ['PUT', '/admin/categories/some-id'],
    ['DELETE', '/admin/categories/some-id'],
  ] as const)('%s %s answers 401 LOGIN_REQUIRED and changes nothing', async (method, path) => {
    const { api } = await asAdmin();
    const added = await addCategory(api, SCOTCH);

    const response = await api[method.toLowerCase() as Lowercase<typeof method>](path.replace('some-id', added.id)).send(categoryAt('spirits', 'gin', 2));

    expectStatus(response, 401);
    expect(response.body).toEqual({ code: 'LOGIN_REQUIRED', message: expect.any(String) });
    expect(await adminCategoryList(api)).toEqual([added]);
  });
});
