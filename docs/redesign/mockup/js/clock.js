// Injectable clock: "today" comes from ?now=YYYY-MM-DD when present (comparisons,
// demos), otherwise from the browser's local date. No screen hard-codes a date.
const pad = (n) => String(n).padStart(2, '0');
const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export function today() {
  const q = typeof location === 'undefined' ? null : new URLSearchParams(location.search).get('now');
  return q && /^\d{4}-\d{2}-\d{2}$/.test(q) ? q : iso(new Date());
}

// ISO date `months` months before `day` (same day of month, clamped by Date).
export function monthsBefore(day, months) {
  const d = new Date(`${day}T12:00:00`);
  d.setMonth(d.getMonth() - months);
  return iso(d);
}
