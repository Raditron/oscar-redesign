// Seam: the HTTP API of the fully composed backend. The admin panel reads and replaces the one VenueSettings (the
// WeeklySchedule, the HappyHour and the Contacts) at /admin/venue-settings, with the token from a login. Times
// cross the API as HH:MM on Sofia's wall clock; a closed day is an explicit null. Until they are first saved there
// are no VenueSettings: the backend makes none up.
import { describe, expect, it } from 'vitest';
import { expectStatus } from '../support/expect-status.ts';
import { expectValidationFailed } from '../support/expect-validation-failed.ts';
import { asAdmin } from '../support/test-backend.ts';
import { adminVenueSettings, saveVenueSettings, SITE_VENUE_SETTINGS, withHoursOn } from '../support/venue-settings.ts';

const { weeklySchedule, happyHour, contacts } = SITE_VENUE_SETTINGS;

describe('GET /admin/venue-settings', () => {
  it('answers 404 VENUE_SETTINGS_NOT_FOUND until they are first saved', async () => {
    const { api, authorization } = await asAdmin();

    const response = await api.get('/admin/venue-settings').set('Authorization', authorization);

    expectStatus(response, 404);
    expect(response.body).toEqual({ code: 'VENUE_SETTINGS_NOT_FOUND', message: expect.any(String) });
  });

  it('gives the WeeklySchedule, the HappyHour and the Contacts as last saved', async () => {
    const { api, authorization } = await asAdmin();
    await saveVenueSettings(api, SITE_VENUE_SETTINGS);

    const response = await api.get('/admin/venue-settings').set('Authorization', authorization);

    expectStatus(response, 200);
    expect(response.body).toEqual(SITE_VENUE_SETTINGS);
  });
});

describe('PUT /admin/venue-settings', () => {
  it('saves them the first time and answers 200 with them as saved', async () => {
    const { api, authorization } = await asAdmin();

    const response = await api.put('/admin/venue-settings').set('Authorization', authorization).send(SITE_VENUE_SETTINGS);

    expectStatus(response, 200);
    expect(response.body).toEqual(SITE_VENUE_SETTINGS);
  });

  it('replaces them whole afterwards', async () => {
    const { api, authorization } = await asAdmin();
    await saveVenueSettings(api, SITE_VENUE_SETTINGS);
    const changed = {
      weeklySchedule: { ...weeklySchedule, monday: null, friday: { opensAt: '19:00', closesAt: '04:00' } },
      happyHour: { from: '19:00', to: '21:00', discountPercent: 30 },
      contacts: { ...contacts, eventsEmail: 'party@oscarclubsofia.com', instagramHandle: 'oscar.club' },
    };

    const response = await api.put('/admin/venue-settings').set('Authorization', authorization).send(changed);

    expectStatus(response, 200);
    expect(await adminVenueSettings(api)).toEqual(changed);
  });

  it('keeps a closed day as null, and a close after midnight as the earlier time', async () => {
    const { api } = await asAdmin();
    const settings = withHoursOn('sunday', null);

    const saved = await saveVenueSettings(api, settings);

    expect(saved).toMatchObject({ weeklySchedule: { sunday: null, saturday: { opensAt: '18:00', closesAt: '03:00' } } });
  });

  it('allows any discount from 1 to 100 %', async () => {
    const { api } = await asAdmin();

    const least = await saveVenueSettings(api, { ...SITE_VENUE_SETTINGS, happyHour: { ...happyHour, discountPercent: 1 } });
    const most = await saveVenueSettings(api, { ...SITE_VENUE_SETTINGS, happyHour: { ...happyHour, discountPercent: 100 } });

    expect([least, most]).toMatchObject([{ happyHour: { discountPercent: 1 } }, { happyHour: { discountPercent: 100 } }]);
  });

  describe('refuses details it cannot keep with 400 VALIDATION_FAILED, naming each field', () => {
    const { monday: _monday, ...withoutMonday } = weeklySchedule;

    it.each([
      ['a weekday left out, rather than null for closed', { ...SITE_VENUE_SETTINGS, weeklySchedule: withoutMonday }, ['weeklySchedule.monday']],
      ['a closing time past 23:59', withHoursOn('saturday', { opensAt: '18:00', closesAt: '24:00' }), ['weeklySchedule.saturday.closesAt']],
      ['a time without its leading zero', withHoursOn('monday', { opensAt: '6:00', closesAt: '23:30' }), ['weeklySchedule.monday.opensAt']],
      ['a day that opens and closes at the same time', withHoursOn('monday', { opensAt: '18:00', closesAt: '18:00' }), ['weeklySchedule.monday']],
      ['a discount of 0 %', { ...SITE_VENUE_SETTINGS, happyHour: { ...happyHour, discountPercent: 0 } }, ['happyHour.discountPercent']],
      ['a discount over 100 %', { ...SITE_VENUE_SETTINGS, happyHour: { ...happyHour, discountPercent: 101 } }, ['happyHour.discountPercent']],
      ['a discount that is not a whole number', { ...SITE_VENUE_SETTINGS, happyHour: { ...happyHour, discountPercent: 12.5 } }, ['happyHour.discountPercent']],
      ['a discount as text', { ...SITE_VENUE_SETTINGS, happyHour: { ...happyHour, discountPercent: '50%' } }, ['happyHour.discountPercent']],
      ['a happy hour that ends before it starts', { ...SITE_VENUE_SETTINGS, happyHour: { ...happyHour, from: '20:00', to: '18:00' } }, ['happyHour']],
      ['a happy hour time that is not HH:MM', { ...SITE_VENUE_SETTINGS, happyHour: { ...happyHour, to: '8pm' } }, ['happyHour.to']],
      ['a reservation phone without the country code', { ...SITE_VENUE_SETTINGS, contacts: { ...contacts, reservationPhone: '0899 666 633' } }, ['contacts.reservationPhone']],
      ['an events phone that is not a number', { ...SITE_VENUE_SETTINGS, contacts: { ...contacts, eventsPhone: 'call us' } }, ['contacts.eventsPhone']],
      ['an events email without an @', { ...SITE_VENUE_SETTINGS, contacts: { ...contacts, eventsEmail: 'events.oscarclubsofia.com' } }, ['contacts.eventsEmail']],
      ['a blank English address', { ...SITE_VENUE_SETTINGS, contacts: { ...contacts, address: { ...contacts.address, en: ' ' } } }, ['contacts.address.en']],
      ['an Instagram link instead of the handle', { ...SITE_VENUE_SETTINGS, contacts: { ...contacts, instagramHandle: 'https://www.instagram.com/oscarclub_official/' } }, ['contacts.instagramHandle']],
      ['nothing at all', {}, ['contacts', 'happyHour', 'weeklySchedule']],
    ])('%s', async (_case, body, fields) => {
      const { api, authorization } = await asAdmin();

      const response = await api.put('/admin/venue-settings').set('Authorization', authorization).send(body);

      expectValidationFailed(response, fields);
    });

    it('and keeps the VenueSettings as they were', async () => {
      const { api, authorization } = await asAdmin();
      await saveVenueSettings(api, SITE_VENUE_SETTINGS);

      const response = await api
        .put('/admin/venue-settings')
        .set('Authorization', authorization)
        .send({ ...SITE_VENUE_SETTINGS, happyHour: { ...happyHour, discountPercent: 0 } });

      expectStatus(response, 400);
      expect(await adminVenueSettings(api)).toEqual(SITE_VENUE_SETTINGS);
    });
  });
});

describe('without a token', () => {
  it.each([
    ['GET', '/admin/venue-settings'],
    ['PUT', '/admin/venue-settings'],
  ] as const)('%s %s answers 401 LOGIN_REQUIRED and changes nothing', async (method, path) => {
    const { api } = await asAdmin();
    await saveVenueSettings(api, SITE_VENUE_SETTINGS);

    const response = await api[method === 'GET' ? 'get' : 'put'](path).send(withHoursOn('monday', null));

    expectStatus(response, 401);
    expect(response.body).toEqual({ code: 'LOGIN_REQUIRED', message: expect.any(String) });
    expect(await adminVenueSettings(api)).toEqual(SITE_VENUE_SETTINGS);
  });
});
