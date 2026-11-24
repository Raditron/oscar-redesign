// Seam: the domain layer, without HTTP or a database. An ImagePath is where a Cocktail's photo is: a path to one of
// the site's own images. The site writes it into an <img src>, so a scheme or another site's address never gets in.
import { describe, expect, it } from 'vitest';
import { ImagePath, InvalidImagePathError } from '../../src/domain/cocktails/image-path.ts';
import { expectRefusal } from '../support/expect-refusal.ts';

describe('ImagePath', () => {
  it('keeps a path to one of the site’s images as given', () => {
    expect(ImagePath.parse('assets/img/cocktails/taratorw.webp').toString()).toBe('assets/img/cocktails/taratorw.webp');
  });

  it.each([
    ['a photo on another site', 'https://example.com/tarator.webp'],
    ['a script, which an <img src> must never get', 'javascript:alert(1)'],
    ['an image written into the address', 'data:image/webp;base64,UklGRg=='],
    ['another site’s photo without the scheme', '//example.com/tarator.webp'],
    ['nothing', ''],
    ['spaces only', '   '],
  ])('refuses %s', (_case, text) => {
    expectRefusal(() => ImagePath.parse(text), InvalidImagePathError);
  });
});
