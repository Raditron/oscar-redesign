// Seam: the domain layer, without HTTP or a database. A LocalizedText is a piece of text in both of the site's
// languages, Bulgarian and English, neither of them blank.
import { describe, expect, it } from 'vitest';
import { BlankTextError, LocalizedText } from '../../src/domain/shared/localized-text.ts';

describe('LocalizedText', () => {
  it('holds the Bulgarian and the English text', () => {
    const text = LocalizedText.of({ bg: 'Halloween парти', en: 'Halloween party' });

    expect(text.bg).toBe('Halloween парти');
    expect(text.en).toBe('Halloween party');
  });

  it('drops the spaces around each text, which nobody sees and nobody means', () => {
    const text = LocalizedText.of({ bg: '  Halloween парти ', en: '\tHalloween party\n' });

    expect(text.bg).toBe('Halloween парти');
    expect(text.en).toBe('Halloween party');
  });

  it.each([
    ['an empty Bulgarian text', { bg: '', en: 'Halloween party' }],
    ['an empty English text', { bg: 'Halloween парти', en: '' }],
    ['a Bulgarian text of spaces only', { bg: '   ', en: 'Halloween party' }],
    ['an English text of spaces only', { bg: 'Halloween парти', en: ' \n ' }],
  ])('refuses %s', (_case, texts) => {
    expect(() => LocalizedText.of(texts)).toThrow(BlankTextError);
  });
});
