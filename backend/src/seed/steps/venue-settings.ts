// Switched off: #36 (VenueSettings) switches it on by adding `venueSettingsStep` to SEED_STEPS in src/seed/seed.ts.
import { AdminApiError, type AdminApi } from '../admin-api.ts';
import type { SeedStep } from '../seed-step.ts';

const open = (opensAt: string, closesAt: string) => ({ opensAt, closesAt });

/**
 * The bar's details as the site shows them today: the hours from `OC.hours` in js/main.js (the same in the hours
 * table and the opening-hours JSON-LD of index.html and en/index.html), the happy hour from `OC.happyHour` (50 % off,
 * 18:00–20:00, every night), and the contacts from the home pages: the reservation phone in the header, the events
 * email and phone in the events section, the address as the footer writes it, the Instagram handle in its links.
 */
const SITE_VENUE_SETTINGS = {
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
    eventsEmail: 'events@oscarclubsofia.com',
    eventsPhone: '+359 883 30 50 55',
    address: { bg: 'ул. „Славянска“ 15, 1000 София', en: '15 Slavyanska St, 1000 Sofia' },
    instagramHandle: 'oscarclub_official',
  },
};

/**
 * The venue settings step: through GET and PUT /admin/venue-settings. There is one VenueSettings, so "already there"
 * means saved at all: once an Admin has saved theirs, the seed never replaces them.
 */
export const venueSettingsStep: SeedStep = {
  name: 'venue settings',

  hasContent(api) {
    return areSaved(api);
  },

  async load(api) {
    if (await areSaved(api)) return { added: 0, skipped: 1 };
    await api.put('/admin/venue-settings', SITE_VENUE_SETTINGS);
    return { added: 1, skipped: 0 };
  },
};

// Until the VenueSettings are first saved, the backend answers 404 VENUE_SETTINGS_NOT_FOUND: it makes none up.
async function areSaved(api: AdminApi): Promise<boolean> {
  try {
    await api.get('/admin/venue-settings');
    return true;
  } catch (error) {
    if (error instanceof AdminApiError && error.code === 'VENUE_SETTINGS_NOT_FOUND') return false;
    throw error;
  }
}
