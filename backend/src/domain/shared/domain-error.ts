/**
 * A rule of the bar refused a value: a negative amount of Money, a blank title, a date that doesn't exist.
 *
 * Every domain object that refuses something throws its own subclass (InvalidMoneyError, BlankTextError, …), so a
 * test can say exactly which rule refused, and their messages are written for people. They know nothing of HTTP:
 * the interface layer answers every DomainError the same way, in one place (toHttpError).
 */
export abstract class DomainError extends Error {}
