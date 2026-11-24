/**
 * Where "now" comes from. Production uses the system clock; tests (and the browser suite's backends) use a fixed
 * clock, so every rule that depends on the time is checked against a known moment.
 *
 * Why a port, and why here: application services ask the clock and hand the moment to the domain as an argument.
 * Domain objects never ask for the time themselves, so their rules stay plain functions of their inputs.
 */
export interface Clock {
  now(): Date;
}
