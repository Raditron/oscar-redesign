// Seam: the seed, called the way a program calls it. Once its step is switched on, it loads the thirteen signature
// cocktails as the site shows them today into an empty database, through the admin API. Forced, it adds only the
// Cocktails whose slug isn't there yet.
import { describe, expect, it } from 'vitest';
import { seed, SeedRefusedError } from '../../src/seed/seed.ts';
import { addCocktail, adminCocktailList, cocktailAt, TARATOR } from '../support/cocktails.ts';
import { expectStatus } from '../support/expect-status.ts';
import { startTestBackend } from '../support/test-backend.ts';
import { ADMIN_PASSWORD } from '../support/valid-env.ts';

// The menu's cards, in their order (their anchors).
const SITE_SLUGS = ['tarator', 'machree', 'mucho', 'blue', 'tropilita', 'better', 'soju', 'eden', 'spraoi', 'french69', 'kissme', 'cherry', 'fridge'];

describe('seed: the Cocktails', () => {
  it("loads the site's thirteen Cocktails into an empty database, in the menu's order, and says it added them", async () => {
    const { url, api } = await startTestBackend();

    const loaded = await seed({ backendUrl: url, password: ADMIN_PASSWORD });

    const cocktails = await adminCocktailList(api);
    expect(cocktails.map((cocktail) => cocktail.slug)).toEqual(SITE_SLUGS);
    expect(cocktails[0]).toEqual({ id: expect.any(String), ...TARATOR });
    expect(loaded).toContainEqual({ step: 'cocktails', added: 13, skipped: 0 });
  });

  it('gives guests all thirteen, every one featured, from 6 to 12 €, with the filter counts the menu shows', async () => {
    const { url, api } = await startTestBackend();
    await seed({ backendUrl: url, password: ADMIN_PASSWORD });

    const response = await api.get('/public/cocktails');

    expectStatus(response, 200);
    const cocktails: { baseSpirit: string; price: number; featured: boolean }[] = response.body;
    expect(cocktails).toHaveLength(13);
    expect(cocktails.every((cocktail) => cocktail.featured)).toBe(true);
    const prices = cocktails.map((cocktail) => cocktail.price);
    expect([Math.min(...prices), Math.max(...prices)]).toEqual([600, 1200]);
    const count = (spirit: string) => cocktails.filter((cocktail) => cocktail.baseSpirit === spirit).length;
    expect(['vodka', 'whiskey', 'rum', 'tequila', 'gin', 'cognac', 'soju'].map(count)).toEqual([3, 2, 2, 2, 2, 1, 1]);
  });

  it('refuses a database that already has Cocktails, saying so, and changes nothing', async () => {
    const { url, api } = await startTestBackend();
    const ours = await addCocktail(api, cocktailAt('negroni', 1));

    const seeding = seed({ backendUrl: url, password: ADMIN_PASSWORD });

    await expect(seeding).rejects.toThrow(SeedRefusedError);
    await expect(seeding).rejects.toThrow(/already has cocktails/);
    expect(await adminCocktailList(api)).toEqual([ours]);
  });

  it("when forced, adds only the Cocktails whose slug is missing, and leaves an Admin's as they are", async () => {
    const { url, api } = await startTestBackend();
    const adminsTarator = await addCocktail(api, { ...TARATOR, price: 1100, featured: false });

    const loaded = await seed({ backendUrl: url, password: ADMIN_PASSWORD, force: true });

    const cocktails = await adminCocktailList(api);
    expect(cocktails.find((cocktail) => cocktail.slug === 'tarator')).toEqual(adminsTarator);
    expect(cocktails).toHaveLength(13);
    expect(loaded).toContainEqual({ step: 'cocktails', added: 12, skipped: 1 });
  });
});
