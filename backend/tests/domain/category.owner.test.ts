// Seam: the domain layer, without HTTP or a database. A Category is a named group of MenuItems in one Section of
// the menu, in the bar's order, with an optional serving size in both languages. Its MenuItems exist only inside it: they are created,
// changed, reordered, hidden and removed by editing the Category. An item's price may be unconfirmed.
import { describe, expect, it } from 'vitest';
import {
  Category,
  DuplicateMenuItemError,
  UnknownMenuItemError,
  type CategoryDetails,
  type MenuItem,
  type MenuItemDetails,
} from '../../src/domain/categories/category.ts';
import { LocalizedText } from '../../src/domain/shared/localized-text.ts';
import { Money } from '../../src/domain/shared/money.ts';
import { Position } from '../../src/domain/shared/position.ts';
import { Slug } from '../../src/domain/shared/slug.ts';
import { expectRefusal } from '../support/expect-refusal.ts';

/** A new item, named the same in both languages, shown to guests. */
const newItem = (name: string, price: Money | null = Money.ofCents(500), hidden = false): MenuItemDetails => ({
  id: null,
  name: LocalizedText.of({ bg: name, en: name }),
  note: null,
  price,
  hidden,
});

/**
 * An item already in the Category, as an edit sends it back: with its id, changed as `changes` say. Copied field by
 * field rather than spread, so a MenuItem may just as well be a class with getters.
 */
const kept = (item: MenuItem, changes: Partial<MenuItemDetails> = {}): MenuItemDetails => ({
  id: item.id,
  name: item.name,
  note: item.note,
  price: item.price,
  hidden: item.hidden,
  ...changes,
});

const FIFTY_ML = LocalizedText.of({ bg: '50 ml', en: '50 ml' });

/** Scotch whisky, from the menu, with the items given. */
const scotch = (items: readonly MenuItemDetails[], servingSize: LocalizedText | null = FIFTY_ML): CategoryDetails => ({
  slug: Slug.parse('whisky'),
  section: 'spirits',
  name: LocalizedText.of({ bg: 'Шотландско уиски', en: 'Scotch whisky' }),
  servingSize,
  position: Position.of(4),
  items,
});

const threeWhiskies = () => scotch([newItem('Loch Lomond'), newItem('Jura 10'), newItem('anCnoc')]);

const namesOf = (items: readonly MenuItem[]) => items.map((item) => item.name.en);
const idsOf = (items: readonly MenuItem[]) => items.map((item) => item.id);

describe('Category', () => {
  describe('when created', () => {
    it('keeps its slug, Section, name, serving size and position', () => {
      const category = Category.create(threeWhiskies());

      expect(category.slug.toString()).toBe('whisky');
      expect(category.section).toBe('spirits');
      expect(category.name.en).toBe('Scotch whisky');
      expect(category.servingSize?.en).toBe('50 ml');
      expect(category.position.value).toBe(4);
    });

    it('keeps its items in the order given', () => {
      expect(namesOf(Category.create(threeWhiskies()).items)).toEqual(['Loch Lomond', 'Jura 10', 'anCnoc']);
    });

    it('gives itself and each of its items an identity of its own', () => {
      const first = Category.create(threeWhiskies());
      const second = Category.create(threeWhiskies());

      expect(first.id).not.toBe(second.id);
      expect(new Set([...idsOf(first.items), ...idsOf(second.items)]).size).toBe(6);
    });

    it('allows no serving size, and no items yet', () => {
      const category = Category.create(scotch([], null));

      expect(category.servingSize).toBeNull();
      expect(category.items).toEqual([]);
    });

    it('refuses an item with an id, since a new Category has no items to name', () => {
      const claimed = { ...newItem('Jura 10'), id: 'an-item-of-another-category' };

      expectRefusal(() => Category.create(scotch([claimed])), UnknownMenuItemError);
    });
  });

  describe('its prices', () => {
    it('keeps a price in whole cents', () => {
      const [jura] = Category.create(scotch([newItem('Jura 10', Money.ofCents(900))])).items;

      expect(jura?.price?.cents).toBe(900);
    });

    it('keeps an unconfirmed price as unconfirmed (null), never as a number', () => {
      const [averna] = Category.create(scotch([newItem('Averna', null)])).items;

      expect(averna?.price).toBeNull();
    });

    it('keeps a price of 0 € as a price, apart from an unconfirmed one', () => {
      const [water] = Category.create(scotch([newItem('Water', Money.ofCents(0))])).items;

      expect(water?.price?.cents).toBe(0);
    });

    it('keeps an item without a note, and one with a note in both languages', () => {
      const note = LocalizedText.of({ bg: 'енергийна напитка', en: 'energy drink' });
      const [coke, redBull] = Category.create(scotch([newItem('Coca-Cola'), { ...newItem('Red Bull'), note }])).items;

      expect(coke?.note).toBeNull();
      expect(redBull?.note?.en).toBe('energy drink');
    });
  });

  describe('hiding items', () => {
    it('keeps a hidden item, marked hidden', () => {
      const category = Category.create(scotch([newItem('Loch Lomond'), newItem('Jura 10', undefined, true)]));

      expect(category.items.map((item) => item.hidden)).toEqual([false, true]);
    });

    it('shows guests only the items that are not hidden, in the bar’s order', () => {
      const category = Category.create(
        scotch([newItem('Loch Lomond'), newItem('Jura 10', undefined, true), newItem('anCnoc')]),
      );

      expect(namesOf(category.itemsShownToGuests())).toEqual(['Loch Lomond', 'anCnoc']);
    });

    it('brings a hidden item back as the same item once it is shown again', () => {
      const category = Category.create(scotch([newItem('Jura 10', undefined, true)]));
      const [jura] = category.items;

      category.edit(scotch([kept(jura!, { hidden: false })]));

      expect(idsOf(category.itemsShownToGuests())).toEqual([jura!.id]);
    });
  });

  describe('when edited', () => {
    it('stays the same Category', () => {
      const category = Category.create(threeWhiskies());
      const id = category.id;

      category.edit({ ...threeWhiskies(), name: LocalizedText.of({ bg: 'Шотландски', en: 'Scotch' }) });

      expect(category.id).toBe(id);
      expect(category.name.en).toBe('Scotch');
    });

    it('changes an item sent back with its id, and keeps it the same item', () => {
      const category = Category.create(threeWhiskies());
      const [loch, jura, ancnoc] = category.items;

      category.edit(scotch([kept(loch!), kept(jura!, { price: Money.ofCents(950) }), kept(ancnoc!)]));

      expect(idsOf(category.items)).toEqual([loch!.id, jura!.id, ancnoc!.id]);
      expect(category.items[1]?.price?.cents).toBe(950);
    });

    it('puts the items in the order given: reordering keeps every item', () => {
      const category = Category.create(threeWhiskies());
      const [loch, jura, ancnoc] = category.items;

      category.edit(scotch([kept(ancnoc!), kept(loch!), kept(jura!)]));

      expect(idsOf(category.items)).toEqual([ancnoc!.id, loch!.id, jura!.id]);
    });

    it('adds an item given with a null id, as a new item with an id of its own', () => {
      const category = Category.create(threeWhiskies());
      const before = idsOf(category.items);

      category.edit(scotch([...category.items.map((item) => kept(item)), newItem('Talisker 10')]));

      const talisker = category.items[3];
      expect(talisker?.name.en).toBe('Talisker 10');
      expect(before).not.toContain(talisker?.id);
    });

    it('removes an item left out', () => {
      const category = Category.create(threeWhiskies());
      const [loch, , ancnoc] = category.items;

      category.edit(scotch([kept(loch!), kept(ancnoc!)]));

      expect(namesOf(category.items)).toEqual(['Loch Lomond', 'anCnoc']);
    });

    it('refuses an id it does not have, and stays as it was', () => {
      const category = Category.create(threeWhiskies());
      const before = namesOf(category.items);

      expectRefusal(() => category.edit(scotch([{ ...newItem('Jura 10'), id: 'no-such-item' }])), UnknownMenuItemError);
      expect(namesOf(category.items)).toEqual(before);
    });

    it('refuses the same item twice, and stays as it was', () => {
      const category = Category.create(threeWhiskies());
      const [loch] = category.items;

      expectRefusal(() => category.edit(scotch([kept(loch!), kept(loch!)])), DuplicateMenuItemError);
      expect(category.items).toHaveLength(3);
    });

    it('changes its serving size, which each language writes its own way', () => {
      const category = Category.create(threeWhiskies());

      category.edit(scotch([], LocalizedText.of({ bg: '0,5 l', en: '0.5 l' })));

      expect([category.servingSize?.bg, category.servingSize?.en]).toEqual(['0,5 l', '0.5 l']);
    });

    it('moves to another Section', () => {
      const category = Category.create(threeWhiskies());

      category.edit({ ...threeWhiskies(), section: 'shots' });

      expect(category.section).toBe('shots');
    });
  });
});
