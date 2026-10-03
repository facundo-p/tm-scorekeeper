// Injectable clock: "today" comes from ?now=YYYY-MM-DD when present (comparisons,
// demos), otherwise from the browser's local date. No screen hard-codes a date.
const pad = (n) => String(n).padStart(2, '0');
const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export function today() {
  const q = typeof location === 'undefined' ? null : new URLSearchParams(location.search).get('now');
  return q && /^\d{4}-\d{2}-\d{2}$/.test(q) ? q : iso(new Date());
}

// ISO date `months` months before `day`: same day of month, clamped to the last
// day of the target month (31 March − 1 month = 28/29 February).
export function monthsBefore(day, months) {
  const [y, m, d] = day.split('-').map(Number);
  const target = new Date(y, m - 1 - months, 1, 12);
  const last = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(d, last));
  return iso(target);
}
