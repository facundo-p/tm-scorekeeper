// Reloj (port de docs/redesign/mockup/js/clock.js): «hoy» es la fecha local del navegador.
const pad = (n: number) => String(n).padStart(2, '0')
export const isoDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

export const today = () => isoDate(new Date())

/** Fecha ISO `months` meses antes de `day`, con el día recortado al último del mes (31/3 − 1 = 28 o 29/2). */
export function monthsBefore(day: string, months: number) {
  const [y, m, d] = day.split('-').map(Number)
  const target = new Date(y, m - 1 - months, 1, 12)
  const last = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate()
  target.setDate(Math.min(d, last))
  return isoDate(target)
}
