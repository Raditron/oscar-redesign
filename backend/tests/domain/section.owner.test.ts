// Seam: the domain layer, without HTTP or a database. A Category belongs to one of the menu's three Sections:
// shots, sets or spirits.
import { describe, expect, it } from 'vitest';
import { parseSection, UnknownSectionError } from '../../src/domain/categories/section.ts';
import { expectRefusal } from '../support/expect-refusal.ts';

describe('parseSection', () => {
  it.each(['shots', 'sets', 'spirits'])('knows %s', (text) => {
    expect(parseSection(text)).toBe(text);
  });

  it.each([
    ['the cocktails, which are not a Section of Categories', 'cocktails'],
    ['a Section in capitals', 'Shots'],
    ['a Section in Bulgarian', 'шотове'],
    ['nothing', ''],
  ])('refuses %s', (_case, text) => {
    expectRefusal(() => parseSection(text), UnknownSectionError);
  });
});
