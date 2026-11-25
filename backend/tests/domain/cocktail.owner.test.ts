// Seam: the domain layer, without HTTP or a database. A Cocktail is one of the bar's signature cocktails: a name,
// its carousel slogan and description, its ingredients and its photo's alt text in both languages, a base spirit and
// an accent colour from fixed lists, a Volume, a price, a photo from the site's own images, and whether it is
// featured or hidden. Its parts refuse what they can't be on their own (see their own tests); these check the whole.
import { describe, expect, it } from 'vitest';
import { BlankCocktailNameError, Cocktail, type CocktailDetails } from '../../src/domain/cocktails/cocktail.ts';
import { ImagePath } from '../../src/domain/cocktails/image-path.ts';
import { Volume } from '../../src/domain/cocktails/volume.ts';
import { LocalizedText } from '../../src/domain/shared/localized-text.ts';
import { Money } from '../../src/domain/shared/money.ts';
import { Position } from '../../src/domain/shared/position.ts';
import { Slug } from '../../src/domain/shared/slug.ts';
import { expectRefusal } from '../support/expect-refusal.ts';

/** Tarator, as the menu and the carousel show it, changed as `changes` say. */
const tarator = (changes: Partial<CocktailDetails> = {}): CocktailDetails => ({
  slug: Slug.parse('tarator'),
  name: 'Tarator',
  slogan: LocalizedText.of({ bg: 'Тараторът е студена супа.', en: 'Tarator is a cold cucumber soup.' }),
  description: LocalizedText.of({
    bg: 'Нашият е в чаша: водка, Скинос, лимон и битер, с краставица, копър и пекан отгоре.',
    en: 'Ours comes in a glass: vodka, Skinos, lemon and bitters, topped with cucumber, dill and a pecan.',
  }),
  ingredients: LocalizedText.of({ bg: 'водка, Скинос, лимон, битер', en: 'vodka, Skinos, lemon, bitters' }),
  imageAlt: LocalizedText.of({ bg: 'Tarator: водка, Скинос, лимон, битер', en: 'Tarator: vodka, Skinos, lemon, bitters' }),
  imagePath: ImagePath.parse('assets/img/cocktails/taratorw.webp'),
  baseSpirit: 'vodka',
  volume: Volume.ofMillilitres(280),
  price: Money.ofCents(1000),
  accentColour: 'garden',
  featured: true,
  hidden: false,
  position: Position.of(1),
  ...changes,
});

describe('Cocktail', () => {
  it('keeps every detail it is given', () => {
    const cocktail = Cocktail.create(tarator());

    expect(cocktail.slug.toString()).toBe('tarator');
    expect(cocktail.name).toBe('Tarator');
    expect(cocktail.slogan.en).toBe('Tarator is a cold cucumber soup.');
    expect(cocktail.description.bg).toBe('Нашият е в чаша: водка, Скинос, лимон и битер, с краставица, копър и пекан отгоре.');
    expect(cocktail.ingredients.en).toBe('vodka, Skinos, lemon, bitters');
    expect(cocktail.imageAlt.bg).toBe('Tarator: водка, Скинос, лимон, битер');
    expect(cocktail.imagePath.toString()).toBe('assets/img/cocktails/taratorw.webp');
    expect(cocktail.baseSpirit).toBe('vodka');
    expect(cocktail.volume.millilitres).toBe(280);
    expect(cocktail.price.cents).toBe(1000);
    expect(cocktail.accentColour).toBe('garden');
    expect(cocktail.featured).toBe(true);
    expect(cocktail.hidden).toBe(false);
    expect(cocktail.position.value).toBe(1);
  });

  it('gets an identity of its own, so two Cocktails with the same details are still two', () => {
    expect(Cocktail.create(tarator()).id).not.toBe(Cocktail.create(tarator()).id);
  });

  it('can be hidden, and not featured', () => {
    const cocktail = Cocktail.create(tarator({ featured: false, hidden: true }));

    expect([cocktail.featured, cocktail.hidden]).toEqual([false, true]);
  });

  it.each(['', '   '])('refuses a blank name (%j)', (name) => {
    expectRefusal(() => Cocktail.create(tarator({ name })), BlankCocktailNameError);
  });

  describe('when edited', () => {
    it('stays the same Cocktail, with every detail replaced', () => {
      const cocktail = Cocktail.create(tarator());
      const id = cocktail.id;
      const slogan = LocalizedText.of({ bg: 'Супа за пиене.', en: 'Soup you drink.' });

      cocktail.edit(tarator({ slogan, price: Money.ofCents(1200), accentColour: 'champagne', hidden: true }));

      expect(cocktail.id).toBe(id);
      expect([cocktail.slogan.en, cocktail.price.cents, cocktail.accentColour, cocktail.hidden]).toEqual([
        'Soup you drink.',
        1200,
        'champagne',
        true,
      ]);
    });

    it('refuses what it refuses when created, and stays as it was', () => {
      const cocktail = Cocktail.create(tarator());

      expectRefusal(() => cocktail.edit(tarator({ name: ' ' })), BlankCocktailNameError);
      expect(cocktail.name).toBe('Tarator');
    });
  });
});
