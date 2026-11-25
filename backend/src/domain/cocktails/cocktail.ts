import { DomainError } from '../shared/domain-error.ts';
import type { LocalizedText } from '../shared/localized-text.ts';
import type { Money } from '../shared/money.ts';
import { NotImplementedError } from '../shared/not-implemented-error.ts';
import type { Position } from '../shared/position.ts';
import type { Slug } from '../shared/slug.ts';
import type { AccentColour } from './accent-colour.ts';
import type { BaseSpirit } from './base-spirit.ts';
import type { ImagePath } from './image-path.ts';
import type { Volume } from './volume.ts';

/** A Cocktail's name with nothing in it. */
export class BlankCocktailNameError extends DomainError {
  override readonly name = 'BlankCocktailNameError';

  constructor() {
    super('A cocktail needs a name.');
  }
}

/** What an Admin says about a Cocktail: everything but its identity. */
export interface CocktailDetails {
  readonly slug: Slug;
  /** The same in both languages: "Tarator", "Blue’s’our". */
  readonly name: string;
  /** The first line of its slide in the home page carousel: "Tarator is a cold cucumber soup." */
  readonly slogan: LocalizedText;
  /** The slide's second line, under the slogan: what is in the glass, in the bar's words. */
  readonly description: LocalizedText;
  readonly ingredients: LocalizedText;
  /** What the photo shows, for guests who can't see it. */
  readonly imageAlt: LocalizedText;
  readonly imagePath: ImagePath;
  readonly baseSpirit: BaseSpirit;
  readonly volume: Volume;
  readonly price: Money;
  readonly accentColour: AccentColour;
  /** Shown in the home page carousel. */
  readonly featured: boolean;
  /** Left off the public site, but kept, so a seasonal drink can come back. */
  readonly hidden: boolean;
  /** Where it stands among the Cocktails, on the menu and in the carousel alike. */
  readonly position: Position;
}

/**
 * One of the bar's signature cocktails, shown with its photo, ingredients, base spirit, volume, price and accent
 * colour. Any Cocktail can be featured, so each carries its own slogan and description for the carousel.
 *
 * Its own aggregate, like an Event: nothing inside it has an identity of its own, and its rules live in its parts
 * (each a value object), but for its name. Its base spirit and accent colour come from closed lists (the menu's
 * filter and the design's colours depend on them). No two Cocktails share a Slug: a rule about many Cocktails at
 * once, which no one Cocktail can answer, so it lives outside this class (where is yours to design).
 */
export class Cocktail {
  private constructor() {}

  /** A new Cocktail, with an id of its own. Refuses a blank name with BlankCocktailNameError. */
  static create(_details: CocktailDetails): Cocktail {
    throw new NotImplementedError('Cocktail.create');
  }

  get id(): string {
    throw new NotImplementedError('Cocktail.id');
  }

  get slug(): Slug {
    throw new NotImplementedError('Cocktail.slug');
  }

  get name(): string {
    throw new NotImplementedError('Cocktail.name');
  }

  get slogan(): LocalizedText {
    throw new NotImplementedError('Cocktail.slogan');
  }

  get description(): LocalizedText {
    throw new NotImplementedError('Cocktail.description');
  }

  get ingredients(): LocalizedText {
    throw new NotImplementedError('Cocktail.ingredients');
  }

  get imageAlt(): LocalizedText {
    throw new NotImplementedError('Cocktail.imageAlt');
  }

  get imagePath(): ImagePath {
    throw new NotImplementedError('Cocktail.imagePath');
  }

  get baseSpirit(): BaseSpirit {
    throw new NotImplementedError('Cocktail.baseSpirit');
  }

  get volume(): Volume {
    throw new NotImplementedError('Cocktail.volume');
  }

  get price(): Money {
    throw new NotImplementedError('Cocktail.price');
  }

  get accentColour(): AccentColour {
    throw new NotImplementedError('Cocktail.accentColour');
  }

  get featured(): boolean {
    throw new NotImplementedError('Cocktail.featured');
  }

  get hidden(): boolean {
    throw new NotImplementedError('Cocktail.hidden');
  }

  get position(): Position {
    throw new NotImplementedError('Cocktail.position');
  }

  /** Replaces everything an Admin says about it, refusing, and changing nothing, what `create` refuses. */
  edit(_details: CocktailDetails): void {
    throw new NotImplementedError('Cocktail.edit');
  }
}
