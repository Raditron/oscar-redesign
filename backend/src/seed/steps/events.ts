import type { LocalizedTextJson } from '../admin-api.ts';
import { collectionStep } from '../collection-step.ts';

/** An Event as the seed sends it, and the fields of one it reads back. */
interface SiteEvent {
  readonly date: string;
  readonly title: LocalizedTextJson;
  /** Whole euro cents; null for free entry. */
  readonly entryFee: number | null;
}

/**
 * The two Events the site used to list in the music section of index.html and en/index.html (its `v2-gigs` list),
 * with their entry fees in whole cents. The site wrote them without a year ("31.10", "07.11"): they are 2026's,
 * so both are past by now, and guests won't see them. They're loaded for the record, as past Events.
 */
const SITE_EVENTS: readonly SiteEvent[] = [
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

export const eventsStep = collectionStep<SiteEvent>({
  name: 'events',
  path: '/admin/events',
  content: SITE_EVENTS,
  isSame: isSameEvent,
});

// An Event has no slug, so "already there" means on the same date with the same title, in both languages. The fee
// isn't compared: an Admin may have corrected it, and the seed leaves an Admin's edits alone.
function isSameEvent(a: SiteEvent, b: SiteEvent): boolean {
  return a.date === b.date && a.title.bg === b.title.bg && a.title.en === b.title.en;
}
