import type { SeedStep } from '../seed-step.ts';

/** An Event as the seed sends it and reads it back: the fields of the admin API it needs. */
interface SiteEvent {
  readonly date: string;
  readonly title: { readonly bg: string; readonly en: string };
}

/**
 * The two Events the site lists today, in the music section of index.html and en/index.html (the `v2-gigs` list),
 * with their entry fees in whole cents. The site writes them without a year ("31.10", "07.11"): they are 2026's,
 * so both are past by now, and guests won't see them. They're loaded for the record, as past Events.
 */
const SITE_EVENTS = [
  {
    date: '2026-10-31',
    title: { bg: 'Halloween парти · DJ Павел Бочев', en: 'Halloween party · DJ Pavel Bochev' },
    entryFee: 1500,
  },
  {
    date: '2026-11-07',
    title: { bg: 'DISCOCKTAILS · Bo Vinyls на винил', en: 'DISCOCKTAILS · Bo Vinyls on vinyl' },
    entryFee: 1000,
  },
];

/** The events step: through GET and POST /admin/events. */
export const eventsStep: SeedStep = {
  name: 'events',

  async hasContent(api) {
    const events = (await api.get('/admin/events')) as unknown[];
    return events.length > 0;
  },

  async load(api) {
    const there = (await api.get('/admin/events')) as SiteEvent[];
    const missing = SITE_EVENTS.filter((event) => !there.some((existing) => isSameEvent(existing, event)));
    for (const event of missing) await api.post('/admin/events', event);
    return { added: missing.length, skipped: SITE_EVENTS.length - missing.length };
  },
};

// An Event has no slug, so "already there" means on the same date with the same title, in both languages. The fee
// isn't compared: an Admin may have corrected it, and the seed leaves an Admin's edits alone.
function isSameEvent(a: SiteEvent, b: SiteEvent): boolean {
  return a.date === b.date && a.title.bg === b.title.bg && a.title.en === b.title.en;
}
