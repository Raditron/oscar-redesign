import { DomainError } from '../shared/domain-error.ts';
import type { LocalizedText } from '../shared/localized-text.ts';
import type { Money } from '../shared/money.ts';
import { NotImplementedError } from '../shared/not-implemented-error.ts';
import type { Position } from '../shared/position.ts';
import type { Slug } from '../shared/slug.ts';
import type { Section } from './section.ts';

/** An item named by an id the Category doesn't have. */
export class UnknownMenuItemError extends DomainError {
  override readonly name = 'UnknownMenuItemError';

  constructor(id: string) {
    super(`This category has no item ${id}. It may have been deleted meanwhile: reload and try again.`);
  }
}

/** The same item listed twice. */
export class DuplicateMenuItemError extends DomainError {
  override readonly name = 'DuplicateMenuItemError';

  constructor(id: string) {
    super(`Item ${id} is listed twice. Each item appears once in its category.`);
  }
}

/** What an Admin says about one MenuItem. */
export interface MenuItemDetails {
  /**
   * Which of the Category's MenuItems this is: its id, to keep it the same item, or null for a new one. A new
   * Category has no items yet, so every id given to Category.create is null.
   */
  readonly id: string | null;
  readonly name: LocalizedText;
  /** Ingredients or a remark, e.g. "Kahlúa, Baileys, Cointreau"; null for none. */
  readonly note: LocalizedText | null;
  /** Null while the price is unconfirmed: guests see "—", never a guess. A price of 0 € is a price. */
  readonly price: Money | null;
  /** Left off the public site, but kept, so it can come back in one click. */
  readonly hidden: boolean;
}

/** What an Admin says about a Category: everything but its identity, its MenuItems in the bar's order included. */
export interface CategoryDetails {
  readonly slug: Slug;
  readonly section: Section;
  readonly name: LocalizedText;
  /**
   * The pour the prices refer to, written the way the bar writes it in each language ("0,5 l" / "0.5 l"); null when
   * there is none. A LocalizedText, so a blank one is refused before it gets here.
   */
  readonly servingSize: LocalizedText | null;
  /** Where it stands among the Categories of its Section. */
  readonly position: Position;
  /** In the order guests see them. */
  readonly items: readonly MenuItemDetails[];
}

/**
 * One line of a Category, as anyone outside the Category sees it: read-only. It exists only inside its Category,
 * which creates, changes, orders and removes its items, so the Category's rules hold for every change.
 */
export interface MenuItem {
  /** Which item it is, the same for as long as it is in its Category. */
  readonly id: string;
  readonly name: LocalizedText;
  readonly note: LocalizedText | null;
  /** Null while unconfirmed. */
  readonly price: Money | null;
  readonly hidden: boolean;
}

/**
 * A named group of MenuItems within one Section (shots, sets or spirits), in the bar's chosen order, with an
 * optional serving size.
 *
 * The aggregate boundary: a Category and its MenuItems are one aggregate, and the Category is its root. A MenuItem
 * has an identity of its own (an Admin edits "the Jura 10", not "the third line"), but it is reached only through
 * its Category, and changed only by an edit of the whole Category. So the item order is the list's order, and a
 * rule about the items, such as "each appears once", holds for every save.
 *
 * Unlike an Event, it also needs a way back from the database that keeps every item's id: the repository that
 * loads it will need a factory like Event.restore.
 */
export class Category {
  private constructor() {}

  /**
   * A new Category, with an id of its own, and an id of their own for each of its MenuItems. Refuses an item with an
   * id (a new Category has no items to name) with UnknownMenuItemError.
   */
  static create(_details: CategoryDetails): Category {
    throw new NotImplementedError('Category.create');
  }

  get id(): string {
    throw new NotImplementedError('Category.id');
  }

  get slug(): Slug {
    throw new NotImplementedError('Category.slug');
  }

  get section(): Section {
    throw new NotImplementedError('Category.section');
  }

  get name(): LocalizedText {
    throw new NotImplementedError('Category.name');
  }

  get servingSize(): LocalizedText | null {
    throw new NotImplementedError('Category.servingSize');
  }

  get position(): Position {
    throw new NotImplementedError('Category.position');
  }

  /** Every MenuItem, hidden ones included, in the bar's order. */
  get items(): readonly MenuItem[] {
    throw new NotImplementedError('Category.items');
  }

  /** What guests see: the MenuItems that aren't hidden, in the bar's order. */
  itemsShownToGuests(): readonly MenuItem[] {
    throw new NotImplementedError('Category.itemsShownToGuests');
  }

  /**
   * Replaces everything an Admin says about the Category, its items included: an item given with its id stays that
   * item, an item with a null id is new, and an item left out is removed. The items come in the order given.
   * Refuses, changing nothing, an id the Category doesn't have (UnknownMenuItemError) and an id given twice
   * (DuplicateMenuItemError).
   */
  edit(_details: CategoryDetails): void {
    throw new NotImplementedError('Category.edit');
  }
}
