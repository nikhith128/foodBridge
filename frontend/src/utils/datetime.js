/**
 * Date and time formatting for the donation pages.
 *
 * Everything here is locale-independent and deterministic: the smoke test
 * renders these components under Node, and a page that formatted a deadline
 * differently on the developer's machine and the test machine would be a
 * fragile thing to assert against.
 *
 * The screens show deadlines as a countdown ("Expires in 42m") next to an
 * absolute time ("16:30"), so both shapes are provided.
 */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;

function pad(value) {
  return String(value).padStart(2, '0');
}

/** A Date from anything date-like, or null when it is not a real date. */
export function parseDate(value) {
  if (value === null || value === undefined || value === '') return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Whole minutes from `now` until `value`; negative once it has passed. */
export function minutesUntil(value, now = new Date()) {
  const date = parseDate(value);
  if (!date) return 0;
  return Math.round((date.getTime() - now.getTime()) / MINUTE_MS);
}

/** True when the value is a real date in the past. */
export function isPast(value, now = new Date()) {
  const date = parseDate(value);
  if (!date) return false;
  return date.getTime() <= now.getTime();
}

/** "2h 18m", "42m", "3h", "now" — never a negative duration. */
export function formatDuration(minutes) {
  const total = Math.max(0, Math.round(Number(minutes) || 0));
  if (total === 0) return 'now';
  const hours = Math.floor(total / 60);
  const mins = total % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

/** "2h 18m left", or "Expired" once the moment has passed. */
export function countdownLabel(value, now = new Date()) {
  const minutes = minutesUntil(value, now);
  if (minutes <= 0) return 'Expired';
  return `${formatDuration(minutes)} left`;
}

/** "15 Nov, 16:30" — deterministic, not locale-dependent. */
export function formatDateTime(value, { withYear = false } = {}) {
  const date = parseDate(value);
  if (!date) return '—';
  const day = date.getDate();
  const month = MONTHS[date.getMonth()];
  const time = `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  return withYear ? `${day} ${month} ${date.getFullYear()}, ${time}` : `${day} ${month}, ${time}`;
}

/**
 * "15 Nov" from a bare `YYYY-MM-DD` day key, as the impact chart axis uses.
 *
 * Read straight off the string rather than through `Date`: `new Date('2026-11-15')`
 * is UTC midnight, and `getDate()` on it would report the 14th on any machine
 * west of Greenwich. The bucket label must be the same everywhere.
 */
export function formatDayKey(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value ?? ''));
  if (!match) return '—';
  return `${Number(match[3])} ${MONTHS[Number(match[2]) - 1]}`;
}

/**
 * A value for `<input type="datetime-local">`: local time, no seconds, no zone.
 * Using toISOString() here would shift the value by the UTC offset and quietly
 * change the time the donor picked.
 */export function toDateTimeLocalValue(value) {
  const date = parseDate(value);
  if (!date) return '';
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

/**
 * A datetime-local value back to an ISO string for the API.
 * Returns '' when the field is empty or unparseable, so the caller can leave it
 * for the server-side validator to reject with a proper message.
 */
export function toIsoFromLocal(value) {
  const date = parseDate(value);
  return date ? date.toISOString() : '';
}

/** `hours` from now, as a datetime-local value. Used to seed the form defaults. */
export function localValueFromNow(hours = 0) {
  return toDateTimeLocalValue(new Date(Date.now() + hours * HOUR_MS));
}

export const TIME_CONSTANTS = { MINUTE_MS, HOUR_MS };
