/**
 * The bar is in Sofia: its ServiceNights, its WeeklySchedule and the date of every Event are Sofia time, wherever
 * the server runs. That is a fact about the bar, not about any clock, so the domain owns it: a Clock only says which
 * instant it is, and the bar's local date and time are that instant read in this zone.
 */
export const BAR_TIME_ZONE = 'Europe/Sofia';
