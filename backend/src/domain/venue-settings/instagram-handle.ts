import { DomainError } from '../shared/domain-error.ts';
import { NotImplementedError } from '../shared/not-implemented-error.ts';

/** Text that isn't an Instagram handle. */
export class InvalidInstagramHandleError extends DomainError {
  override readonly name = 'InvalidInstagramHandleError';

  constructor(text: string) {
    super(`An Instagram handle is letters, digits, dots and underscores, such as "oscarclub_official", not "${text}".`);
  }
}

/**
 * The bar's name on Instagram, "oscarclub_official": the handle alone, not a link. The site builds the profile link
 * (instagram.com/…), the message link (ig.me/m/…) and the "@…" it shows from it, so the handle is all it keeps.
 */
export class InstagramHandle {
  private constructor() {}

  /** Refuses with InvalidInstagramHandleError anything that can't be a handle, such as a link or text with spaces. */
  static parse(_text: string): InstagramHandle {
    throw new NotImplementedError('InstagramHandle.parse');
  }

  toString(): string {
    throw new NotImplementedError('InstagramHandle.toString');
  }
}
