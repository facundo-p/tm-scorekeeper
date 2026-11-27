import type { CSSProperties } from 'react'

export type CssVarValue = string | number

/**
 * Única vía para pasar valores dinámicos al CSS (D-09): custom properties como
 * `--w` o `--hue`. Las claves van sin los guiones iniciales: `cssVars({ w: '40%' })`.
 */
export function cssVars(vars: Record<string, CssVarValue | null | undefined>): CSSProperties {
  const out: Record<string, CssVarValue> = {}
  for (const [key, value] of Object.entries(vars)) {
    if (value != null) out[`--${key}`] = value
  }
  return out as CSSProperties
}
