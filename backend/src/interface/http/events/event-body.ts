import { z } from 'zod';
import type { EventDetails } from '../../../domain/events/event.ts';
import { CalendarDate } from '../../../domain/shared/calendar-date.ts';
import { LocalizedText } from '../../../domain/shared/localized-text.ts';
import { Money } from '../../../domain/shared/money.ts';

/** What to tell the Admin about each field, shown next to it when it is missing or wrong. */
const MESSAGES = {
  date: 'Enter the date as YYYY-MM-DD, e.g. 2026-11-28.',
  title: 'Enter the title in Bulgarian and in English.',
  titleBg: 'Enter the Bulgarian title.',
  titleEn: 'Enter the English title.',
  entryFee: 'Enter the entry fee in whole euro cents (1500 for 15 €), or null for free entry.',
} as const;

const nonBlank = (message: string) => z.string({ error: message }).trim().min(1, { error: message });

/**
 * The body of POST /admin/events and PUT /admin/events/:id: an Event's details as the admin panel sends them.
 *
 * zod checks every field at once, so one 400 lists every problem, each with its field (`title.en`), and the domain
 * checks the same rules again when the details become value objects: the domain never trusts that this check ran.
 * Once the body passes, it is turned into domain values here, at the edge, so the application is only ever handed
 * EventDetails, never raw JSON. `entryFee` must be present: free entry is an explicit null, never a missing field.
 */
export const EventBody = z
  .object({
    // zod's ISO date refuses dates the calendar doesn't have, such as 2026-02-29, as the domain does.
    date: z.iso.date({ error: MESSAGES.date }),
    title: z.object({ bg: nonBlank(MESSAGES.titleBg), en: nonBlank(MESSAGES.titleEn) }, { error: MESSAGES.title }),
    entryFee: z
      .number({ error: MESSAGES.entryFee })
      .int({ error: MESSAGES.entryFee })
      .min(0, { error: MESSAGES.entryFee })
      .nullable(),
  })
  .transform(
    (body): EventDetails => ({
      date: CalendarDate.parse(body.date),
      title: LocalizedText.of(body.title),
      entryFee: body.entryFee === null ? null : Money.ofCents(body.entryFee),
    }),
  );
