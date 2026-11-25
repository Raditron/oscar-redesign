// The ServiceNight rule's cases, for the bar's current hours (Mon–Wed and Sun 18:00–23:30, Thu until 02:00, Fri–Sat
// until 03:00): a moment on Sofia's wall clock, and the date of the ServiceNight it belongs to. The rule exists
// twice, here in the domain and in the site's open-now line (OC.nightOf in js/main.js), and both are checked against
// these same cases (the site's in tests/11-night.spec.js at the repo root), so this file is plain data that imports
// nothing. `sofiaTime` is written the way the site's `?now=` override takes it. Every moment is in winter, when Sofia
// is UTC+2.
export const SERVICE_NIGHT_CASES: readonly { when: string; sofiaTime: string; serviceNight: string }[] = [
  { when: 'Monday 12:00, before the bar opens', sofiaTime: '2026-11-16T12:00', serviceNight: '2026-11-16' },
  { when: 'Monday 20:00, an evening', sofiaTime: '2026-11-16T20:00', serviceNight: '2026-11-16' },
  { when: 'Tuesday 00:30, after Monday closed at 23:30', sofiaTime: '2026-11-17T00:30', serviceNight: '2026-11-17' },
  { when: 'Thursday 23:00', sofiaTime: '2026-11-19T23:00', serviceNight: '2026-11-19' },
  { when: 'Friday 01:30, while Thursday is open until 02:00', sofiaTime: '2026-11-20T01:30', serviceNight: '2026-11-19' },
  { when: "Friday 02:00, Thursday's closing time", sofiaTime: '2026-11-20T02:00', serviceNight: '2026-11-20' },
  { when: 'Friday 02:30', sofiaTime: '2026-11-20T02:30', serviceNight: '2026-11-20' },
  { when: 'Saturday 00:00, while Friday is open until 03:00', sofiaTime: '2026-11-21T00:00', serviceNight: '2026-11-20' },
  { when: 'Saturday 02:50', sofiaTime: '2026-11-21T02:50', serviceNight: '2026-11-20' },
  { when: 'Saturday 20:00', sofiaTime: '2026-11-21T20:00', serviceNight: '2026-11-21' },
  { when: 'Sunday 01:00, while Saturday is open until 03:00', sofiaTime: '2026-11-22T01:00', serviceNight: '2026-11-21' },
  { when: 'Sunday 01:30', sofiaTime: '2026-11-22T01:30', serviceNight: '2026-11-21' },
  { when: 'Sunday 02:59', sofiaTime: '2026-11-22T02:59', serviceNight: '2026-11-21' },
  { when: "Sunday 03:00, Saturday's closing time", sofiaTime: '2026-11-22T03:00', serviceNight: '2026-11-22' },
  { when: 'Sunday 12:00', sofiaTime: '2026-11-22T12:00', serviceNight: '2026-11-22' },
  { when: 'Monday 00:10, after Sunday closed at 23:30', sofiaTime: '2026-11-23T00:10', serviceNight: '2026-11-23' },
  { when: 'Sunday 1 November 01:30, the month after Halloween', sofiaTime: '2026-11-01T01:30', serviceNight: '2026-10-31' },
  { when: "New Year's Day 01:30, the year after New Year's Eve", sofiaTime: '2027-01-01T01:30', serviceNight: '2026-12-31' },
];
