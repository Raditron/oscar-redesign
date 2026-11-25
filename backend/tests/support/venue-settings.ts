// The VenueSettings for the tests, saved and read back through the admin API, the way the admin panel does: never
// written to or read from the database directly. Written out here rather than taken from the backend or the seed,
// so a test's expectations never come from the code it checks.
import { expectStatus } from './expect-status.ts';
import { logInAsAdmin, type TestApi } from './test-backend.ts';

const open = (opensAt: string, closesAt: string) => ({ opensAt, closesAt });

/** The bar's VenueSettings as the site shows them today, as the admin API takes and gives them. */
export const SITE_VENUE_SETTINGS = {
  // Mon–Wed and Sun 18:00–23:30, Thu until 02:00, Fri–Sat until 03:00
  weeklySchedule: {
    monday: open('18:00', '23:30'),
    tuesday: open('18:00', '23:30'),
    wednesday: open('18:00', '23:30'),
    thursday: open('18:00', '02:00'),
    friday: open('18:00', '03:00'),
    saturday: open('18:00', '03:00'),
    sunday: open('18:00', '23:30'),
  },
  happyHour: { from: '18:00', to: '20:00', discountPercent: 50 },
  contacts: {
    reservationPhone: '+359 899 666 633',
    generalEmail: 'oscarclub.sf@gmail.com',
    eventsEmail: 'events@oscarclubsofia.com',
    eventsPhone: '+359 883 30 50 55',
    address: { bg: 'ул. „Славянска“ 15, 1000 София', en: '15 Slavyanska St, 1000 Sofia' },
    mapsUrl: 'https://www.google.com/maps/dir/?api=1&destination=Oscar+Club+Cocktail+bar%2C+Slavyanska+15%2C+Sofia',
    instagramHandle: 'oscarclub_official',
    facebookUrl: 'https://www.facebook.com/OscarClub.sf',
  },
};

/** The site's VenueSettings with one weekday's hours changed: `{ opensAt, closesAt }`, or null for closed. */
export function withHoursOn(weekday: keyof typeof SITE_VENUE_SETTINGS.weeklySchedule, hours: object | null) {
  return { ...SITE_VENUE_SETTINGS, weeklySchedule: { ...SITE_VENUE_SETTINGS.weeklySchedule, [weekday]: hours } };
}

/** Saves the VenueSettings as an Admin would, and returns them as the backend answered. */
export async function saveVenueSettings(api: TestApi, settings: object): Promise<unknown> {
  const response = await api
    .put('/admin/venue-settings')
    .set('Authorization', `Bearer ${await logInAsAdmin(api)}`)
    .send(settings);
  expectStatus(response, 200);
  return response.body;
}

/** The VenueSettings as GET /admin/venue-settings gives them. */
export async function adminVenueSettings(api: TestApi): Promise<unknown> {
  const response = await api.get('/admin/venue-settings').set('Authorization', `Bearer ${await logInAsAdmin(api)}`);
  expectStatus(response, 200);
  return response.body;
}
