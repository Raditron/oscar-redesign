import { DomainError } from '../shared/domain-error.ts';
import { NotImplementedError } from '../shared/not-implemented-error.ts';

/** The three parts of the menu that hold Categories, in the order the menu shows them. */
export const SECTIONS = ['shots', 'sets', 'spirits'] as const;
export type Section = (typeof SECTIONS)[number];

/** Text that names no Section of the menu. */
export class UnknownSectionError extends DomainError {
  override readonly name = 'UnknownSectionError';

  constructor(text: string) {
    super(`A category belongs to one of the menu's sections (${SECTIONS.join(', ')}), not "${text}".`);
  }
}

/**
 * The Section `text` names; refuses any other text with UnknownSectionError. The type already holds the code to the
 * three; this is for text from outside it, such as a stored document read back.
 */
export function parseSection(_text: string): Section {
  throw new NotImplementedError('parseSection');
}
