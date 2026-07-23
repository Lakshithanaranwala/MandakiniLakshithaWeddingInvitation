/**
 * Generates a .ics calendar event blob and triggers a download.
 * No dependency — pure string construction per RFC 5545.
 *
 * NOTE: Ceremony start time is flagged for confirmation.
 * Currently using 10:30 AM Sri Lanka time (UTC+05:30).
 * Please confirm exact ceremony and reception times.
 */
export function downloadCalendar(): void {
  // 2026-09-11 10:28 AM Sri Lanka (UTC+05:30) → 04:58 UTC
  const dtStart  = '20260911T045800Z';
  // End of day Sri Lanka → 18:30 UTC
  const dtEnd    = '20260911T130000Z';
  const now      = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Mandakini & Lakshitha//Wedding//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `DTSTAMP:${now}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    'SUMMARY:Mandakini & Lakshitha Wedding',
    'DESCRIPTION:Poruwa ceremony 10:28 AM\\nMandakini Club House\\, Divulapitiya\\, Sri Lanka',
    'LOCATION:Mandakini Club House\\, Divulapitiya\\, Sri Lanka',
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = 'mandakini-lakshitha-wedding.ics';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
