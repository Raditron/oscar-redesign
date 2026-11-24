import { DomainError } from '../shared/domain-error.ts';
import { NotImplementedError } from '../shared/not-implemented-error.ts';

/**
 * The spirits a Cocktail can be built on, in the order of the menu's filter chips. Extendable: a new spirit is one
 * more entry here (and a chip with its name on the site).
 */
export const BASE_SPIRITS = ['vodka', 'whiskey', 'rum', 'tequila', 'gin', 'cognac', 'soju'] as const;
export type BaseSpirit = (typeof BASE_SPIRITS)[number];

/** Text that names no base spirit on the list. */
export class UnknownBaseSpiritError extends DomainError {
  override readonly name = 'UnknownBaseSpiritError';

  constructor(text: string) {
    super(`A cocktail's base spirit is one of ${BASE_SPIRITS.join(', ')}, not "${text}".`);
  }
}

/**
 * The base spirit `text` names; refuses any other text with UnknownBaseSpiritError. The type already holds the code
 * to the list; this is for text from outside it, such as a stored document read back.
 */
export function parseBaseSpirit(_text: string): BaseSpirit {
  throw new NotImplementedError('parseBaseSpirit');
}
