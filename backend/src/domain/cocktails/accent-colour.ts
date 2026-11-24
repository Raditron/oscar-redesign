import { DomainError } from '../shared/domain-error.ts';
import { NotImplementedError } from '../shared/not-implemented-error.ts';

/**
 * The design's drink colours, by the names of their tokens in css/styles.css (`--d-garden` … `--d-champagne`). The
 * design adds no colours for a new cocktail: it joins the family closest to its glass. So the list is closed, and a
 * colour the site has no token for can't be chosen.
 */
export const ACCENT_COLOURS = ['garden', 'curacao', 'berry', 'hibiscus', 'amber', 'champagne'] as const;
export type AccentColour = (typeof ACCENT_COLOURS)[number];

/** Text that names none of the design's drink colours. */
export class UnknownAccentColourError extends DomainError {
  override readonly name = 'UnknownAccentColourError';

  constructor(text: string) {
    super(`A cocktail's accent colour is one of the design's drink colours (${ACCENT_COLOURS.join(', ')}), not "${text}".`);
  }
}

/**
 * The accent colour `text` names; refuses any other text with UnknownAccentColourError. The type already holds the
 * code to the list; this is for text from outside it, such as a stored document read back.
 */
export function parseAccentColour(_text: string): AccentColour {
  throw new NotImplementedError('parseAccentColour');
}
