// Categories for the tests, added and read back through the admin API, the way the admin panel does: never written
// to or read from the database directly.
import { expectStatus } from './expect-status.ts';
import { logInAsAdmin, type TestApi } from './test-backend.ts';

/** A MenuItem as the admin panel lists it. */
export interface AdminMenuItem {
  readonly id: string;
  readonly name: { readonly bg: string; readonly en: string };
  readonly note: { readonly bg: string; readonly en: string } | null;
  readonly price: number | null;
  readonly hidden: boolean;
}

/** A Category as the admin panel lists it. */
export interface AdminCategory {
  readonly id: string;
  readonly slug: string;
  readonly section: string;
  readonly name: { readonly bg: string; readonly en: string };
  readonly servingSize: { readonly bg: string; readonly en: string } | null;
  readonly position: number;
  readonly items: readonly AdminMenuItem[];
}

/** A new MenuItem as the admin panel sends it (no id yet), named the same in both languages, shown to guests. */
export function newItem(name: string, price: number | null = 500) {
  return { id: null, name: { bg: name, en: name }, note: null, price, hidden: false };
}

/** Scotch whisky, from the menu: three of its items, 50 ml each. */
export const SCOTCH = {
  slug: 'whisky',
  section: 'spirits',
  name: { bg: 'Шотландско уиски', en: 'Scotch whisky' },
  servingSize: { bg: '50 ml', en: '50 ml' },
  position: 4,
  items: [newItem('Loch Lomond', 700), newItem('Jura 10', 900), newItem('anCnoc', 1200)],
};

/** A Category of its own in `section`, at `position`, with one item, for tests about many Categories. */
export function categoryAt(section: string, slug: string, position: number) {
  return { slug, section, name: { bg: `Категория ${slug}`, en: `Category ${slug}` }, servingSize: null, position, items: [newItem(slug)] };
}

/** Adds the Category as an Admin would, and returns it as the backend answered. */
export async function addCategory(api: TestApi, category: object): Promise<AdminCategory> {
  const response = await api
    .post('/admin/categories')
    .set('Authorization', `Bearer ${await logInAsAdmin(api)}`)
    .send(category);
  expectStatus(response, 201);
  return response.body;
}

/** Every Category, as GET /admin/categories lists them. */
export async function adminCategoryList(api: TestApi): Promise<AdminCategory[]> {
  const response = await api.get('/admin/categories').set('Authorization', `Bearer ${await logInAsAdmin(api)}`);
  expectStatus(response, 200);
  return response.body;
}

/** A Category as the admin panel sends it back to change it: its details, with its items' ids. */
export function asSent({ id: _id, ...category }: AdminCategory) {
  return category;
}
