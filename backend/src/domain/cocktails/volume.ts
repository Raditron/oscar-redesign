import { DomainError } from '../shared/domain-error.ts';
import { NotImplementedError } from '../shared/not-implemented-error.ts';

/** A volume that isn't a whole number of millilitres above 0. */
export class InvalidVolumeError extends DomainError {
  override readonly name = 'InvalidVolumeError';

  constructor(millilitres: number) {
    super(`A cocktail's volume is a whole number of millilitres above 0, e.g. 280, not ${millilitres}.`);
  }
}

/** How much a Cocktail holds, as the menu card shows it: "280 ml". Counted in whole millilitres. */
export class Volume {
  private constructor() {}

  /** Refuses with InvalidVolumeError a value that isn't a whole number above 0. */
  static ofMillilitres(_millilitres: number): Volume {
    throw new NotImplementedError('Volume.ofMillilitres');
  }

  get millilitres(): number {
    throw new NotImplementedError('Volume.millilitres');
  }
}
