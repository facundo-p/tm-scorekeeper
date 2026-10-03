// Formato de números y fechas en es-AR: port de `fmt` (docs/redesign/mockup/js/lib.js) y
// de `fmtDate` (js/ui/atoms.js). El menos es tipográfico (−) y el cero lleva ±.

const MINUS = '−'
// `useGrouping: 'min2'` (ES2023): 1234 sin separador, 12.345 con punto. La lib ES2020 del tsconfig no lo tipa.
const INT_FORMAT = { useGrouping: 'min2' } as unknown as Intl.NumberFormatOptions

export const fmt = {
  int: (n: number) => Math.round(n).toLocaleString('es-AR', INT_FORMAT),
  pct: (x: number, digits = 0) => `${(x * 100).toFixed(digits)} %`,
  signed: (n: number) => (n > 0 ? `+${n}` : n < 0 ? `${MINUS}${Math.abs(n)}` : '±0'),
  dec: (n: number, d = 1) => n.toLocaleString('es-AR', { minimumFractionDigits: d, maximumFractionDigits: d }),
}

interface DateOptions {
  short?: boolean
  year?: boolean
}

/** «27 de septiembre de 2026»; `short` usa el mes abreviado y `year: false` lo omite. */
export function fmtDate(iso: string, opts: DateOptions = {}) {
  const d = new Date(`${iso}T12:00:00`)
  return d.toLocaleDateString('es-AR', {
    day: 'numeric', month: opts.short ? 'short' : 'long', year: opts.year === false ? undefined : 'numeric',
  })
}

/** Redondeo half-even, como `round()` de Python (D-06). */
export function roundHalfEven(x: number) {
  const floor = Math.floor(x)
  const diff = x - floor
  if (diff > 0.5) return floor + 1
  if (diff < 0.5) return floor
  return floor % 2 === 0 ? floor : floor + 1
}
