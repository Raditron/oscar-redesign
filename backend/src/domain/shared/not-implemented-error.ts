/**
 * Scaffolding for the owner's slices, not a rule of the bar: what every declared but not yet written member of
 * VenueSettings (#36), Category (#37) and Cocktail (#38) throws, so that their tests fail for this one reason and
 * never for a broken test.
 *
 * Deliberately not a DomainError: a test that expects a rule's own refusal (`toThrow(InvalidHappyHourError)`) can
 * never be satisfied by it, and the API answers it 500, never 400. Each member that throws it is replaced by its
 * real body; delete this file once nothing imports it.
 */
export class NotImplementedError extends Error {
  override readonly name = 'NotImplementedError';

  /** `member` names what is missing, e.g. "HappyHour.of". */
  constructor(member: string) {
    super(`${member} is not implemented yet.`);
  }
}
