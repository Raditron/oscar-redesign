import { DomainError } from '../shared/domain-error.ts';
import { NotImplementedError } from '../shared/not-implemented-error.ts';

/** Text that isn't a path to one of the site's own images. */
export class InvalidImagePathError extends DomainError {
  override readonly name = 'InvalidImagePathError';

  constructor(text: string) {
    super(`A cocktail's photo is one of the site's own images, given by its path, e.g. "assets/img/cocktails/taratorw.webp", not "${text}".`);
  }
}

/**
 * Where a Cocktail's photo is: a path to one of the site's own images, "assets/img/cocktails/taratorw.webp". Kept as
 * given; whether the file exists is the site's business (the admin panel offers only the images it has).
 *
 * Why it refuses a scheme or a host: the site writes the path into an `<img src>`, so a "javascript:" URL, or a photo
 * from another site, must never get there.
 */
export class ImagePath {
  private constructor() {}

  /** Refuses with InvalidImagePathError blank text, and text with a scheme ("https:", "javascript:") or a host ("//…"). */
  static parse(_text: string): ImagePath {
    throw new NotImplementedError('ImagePath.parse');
  }

  toString(): string {
    throw new NotImplementedError('ImagePath.toString');
  }
}
