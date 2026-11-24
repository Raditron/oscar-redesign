// Seam: the seed, called the way a program calls it. Once its step is switched on, it loads the menu's Categories as
// the site shows them today into an empty database, through the admin API: the shots and the sets, one Category
// each, and the ten spirits Categories, with all their items. Forced, it adds only the Categories whose slug isn't
// there yet.
import { describe, expect, it } from 'vitest';
import { seed, SeedRefusedError } from '../../src/seed/seed.ts';
import { addCategory, adminCategoryList, categoryAt } from '../support/categories.ts';
import { expectStatus } from '../support/expect-status.ts';
import { startTestBackend } from '../support/test-backend.ts';
import { ADMIN_PASSWORD } from '../support/valid-env.ts';

// The menu's category bar, in its order: the shots, the sets, then the spirits.
const SITE_SLUGS = ['shots', 'sets', 'vodka', 'gin', 'tequila', 'whisky', 'irish', 'bourbon', 'digestif', 'wine', 'beer', 'soft'];

describe('seed: the Categories', () => {
  it("loads the site's twelve Categories into an empty database, in the menu's order, and says it added them", async () => {
    const { url, api } = await startTestBackend();

    const loaded = await seed({ backendUrl: url, password: ADMIN_PASSWORD });

    const categories = await adminCategoryList(api);
    expect(categories.map((category) => category.slug)).toEqual(SITE_SLUGS);
    expect(loaded).toContainEqual({ step: 'categories', added: 12, skipped: 0 });
  });

  it('gives guests the 21 shots at 3 € each, the 2 sets and the 10 spirits Categories, with Averna unconfirmed', async () => {
    const { url, api } = await startTestBackend();
    await seed({ backendUrl: url, password: ADMIN_PASSWORD });

    const response = await api.get('/public/categories');

    expectStatus(response, 200);
    const { shots, sets, spirits } = response.body;
    expect(shots).toHaveLength(1);
    expect(shots[0].items).toHaveLength(21);
    expect(new Set(shots[0].items.map((item: { price: number }) => item.price))).toEqual(new Set([300]));
    expect(sets[0].items.map((item: { price: number }) => item.price)).toEqual([1800, 2000]);
    expect(spirits).toHaveLength(10);
    const digestif = spirits.find((category: { slug: string }) => category.slug === 'digestif');
    expect(digestif.items).toEqual([{ name: { bg: 'Averna', en: 'Averna' }, note: null, price: null }]);
  });

  it('refuses a database that already has Categories, saying so, and changes nothing', async () => {
    const { url, api } = await startTestBackend();
    const ours = await addCategory(api, categoryAt('spirits', 'rum', 1));

    const seeding = seed({ backendUrl: url, password: ADMIN_PASSWORD });

    await expect(seeding).rejects.toThrow(SeedRefusedError);
    await expect(seeding).rejects.toThrow(/already has categories/);
    expect(await adminCategoryList(api)).toEqual([ours]);
  });

  it("when forced, adds only the Categories whose slug is missing, and leaves an Admin's as they are", async () => {
    const { url, api } = await startTestBackend();
    const adminsGin = await addCategory(api, categoryAt('spirits', 'gin', 2));

    const loaded = await seed({ backendUrl: url, password: ADMIN_PASSWORD, force: true });

    const categories = await adminCategoryList(api);
    expect(categories.find((category) => category.slug === 'gin')).toEqual(adminsGin);
    expect(categories).toHaveLength(12);
    expect(loaded).toContainEqual({ step: 'categories', added: 11, skipped: 1 });
  });
});
