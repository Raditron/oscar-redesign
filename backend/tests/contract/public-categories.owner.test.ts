// Seam: the HTTP API of the fully composed backend. Guests get the menu's Categories from GET /public/categories,
// without a token, grouped by Section (shots, sets, spirits), each Section's Categories by position, each with its
// visible MenuItems in the bar's order. Hidden items never appear; an unconfirmed price is null, and the site shows
// "—" for it. The Categories are added the way the admin panel adds them.
import { describe, expect, it } from 'vitest';
import { addCategory, asSent, categoryAt, newItem, SCOTCH } from '../support/categories.ts';
import { expectStatus } from '../support/expect-status.ts';
import { createTestBackend, logInAsAdmin } from '../support/test-backend.ts';

describe('GET /public/categories', () => {
  it('gives every Section, empty, before any Categories are added', async () => {
    const api = await createTestBackend();

    const response = await api.get('/public/categories');

    expectStatus(response, 200);
    expect(response.body).toEqual({ shots: [], sets: [], spirits: [] });
  });

  it('lets a browser keep the menu only if it checks back on every load, like every public answer', async () => {
    const api = await createTestBackend();

    const response = await api.get('/public/categories');

    expectStatus(response, 200);
    expect(response.headers['cache-control']).toBe('no-cache');
  });

  it('gives each Category its slug, name, serving size and items, each item with its name, note and price', async () => {
    const api = await createTestBackend();
    const coke = newItem('Coca-Cola · 330 ml', 300);
    const redBull = { ...newItem('Red Bull · 250 ml', 400), note: { bg: 'енергийна напитка', en: 'energy drink' } };
    await addCategory(api, { ...categoryAt('spirits', 'soft', 10), name: { bg: 'Безалкохолни', en: 'Soft drinks' }, items: [coke, redBull] });

    const response = await api.get('/public/categories');

    expectStatus(response, 200);
    expect(response.body.spirits).toEqual([
      {
        slug: 'soft',
        name: { bg: 'Безалкохолни', en: 'Soft drinks' },
        servingSize: null,
        items: [
          { name: coke.name, note: null, price: 300 },
          { name: redBull.name, note: { bg: 'енергийна напитка', en: 'energy drink' }, price: 400 },
        ],
      },
    ]);
  });

  it('gives a serving size as each language writes it, and null where there is none', async () => {
    const api = await createTestBackend();
    await addCategory(api, { ...categoryAt('spirits', 'beer', 9), servingSize: { bg: '0,5 l', en: '0.5 l' } });
    await addCategory(api, categoryAt('spirits', 'soft', 10));

    const response = await api.get('/public/categories');

    expectStatus(response, 200);
    expect(response.body.spirits.map((category: { servingSize: unknown }) => category.servingSize)).toEqual([
      { bg: '0,5 l', en: '0.5 l' },
      null,
    ]);
  });

  it("puts each Category in its Section, and each Section's Categories by position", async () => {
    const api = await createTestBackend();
    for (const category of [
      categoryAt('spirits', 'gin', 2),
      categoryAt('sets', 'sets', 1),
      categoryAt('spirits', 'vodka', 1),
      categoryAt('shots', 'shots', 1),
    ]) {
      await addCategory(api, category);
    }

    const response = await api.get('/public/categories');

    expectStatus(response, 200);
    const slugsIn = (section: string) => response.body[section].map((category: { slug: string }) => category.slug);
    expect([slugsIn('shots'), slugsIn('sets'), slugsIn('spirits')]).toEqual([['shots'], ['sets'], ['vodka', 'gin']]);
  });

  it('leaves hidden items out, and keeps the others in the order the bar chose', async () => {
    const api = await createTestBackend();
    const [loch, jura, ancnoc] = SCOTCH.items;
    await addCategory(api, { ...SCOTCH, items: [ancnoc, { ...jura!, hidden: true }, loch] });

    const response = await api.get('/public/categories');

    expectStatus(response, 200);
    expect(response.body.spirits[0].items.map((item: { name: { en: string } }) => item.name.en)).toEqual(['anCnoc', 'Loch Lomond']);
  });

  it('gives an unconfirmed price as null, and a price of 0 € as 0', async () => {
    const api = await createTestBackend();
    await addCategory(api, { ...SCOTCH, items: [newItem('Averna', null), newItem('Water', 0)] });

    const response = await api.get('/public/categories');

    expectStatus(response, 200);
    expect(response.body.spirits[0].items.map((item: { price: number | null }) => item.price)).toEqual([null, 0]);
  });

  it("shows an Admin's edit on the next load: an item hidden is gone", async () => {
    const api = await createTestBackend();
    const added = await addCategory(api, SCOTCH);
    const edit = await api
      .put(`/admin/categories/${added.id}`)
      .set('Authorization', `Bearer ${await logInAsAdmin(api)}`)
      .send({ ...asSent(added), items: added.items.map((item) => ({ ...item, hidden: item.name.en !== 'Jura 10' })) });
    expectStatus(edit, 200);

    const response = await api.get('/public/categories');

    expectStatus(response, 200);
    expect(response.body.spirits[0].items).toEqual([{ name: { bg: 'Jura 10', en: 'Jura 10' }, note: null, price: 900 }]);
  });
});
