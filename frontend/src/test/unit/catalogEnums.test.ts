// El catálogo del frontend (domain/catalog, domain/labels) tiene que cubrir los enums del backend:
// si el backend suma o renombra un mapa, una expansión, un hito, una recompensa o una corporación,
// este test lo detecta (reemplaza al test de constants/enums de la app vieja, F35). Lee el backend
// del mismo repo y supone valores entre comillas dobles en una línea (`NOMBRE = "valor"`).
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it, expect } from 'vitest'
import { CORP_BY_NAME, EXPANSIONS, MAP_ORDER } from '@/domain/catalog'
import { AWARD_LABELS, MILESTONE_LABELS } from '@/domain/labels'
import { COLORS } from '@/screens/Ranking/model'

const source = readFileSync(resolve(__dirname, '../../../../backend/models/enums.py'), 'utf8')

/** Valores (`NOMBRE = "valor"`) de una clase Enum del backend. */
function enumValues(name: string): string[] {
  const start = source.indexOf(`class ${name}(`)
  if (start < 0) throw new Error(`No está el enum ${name} en models/enums.py`)
  const end = source.indexOf('\nclass ', start + 1)
  const body = source.slice(start, end < 0 ? undefined : end)
  return [...body.matchAll(/^\s+[A-Z0-9_]+\s*=\s*"([^"]+)"/gm)].map((m) => m[1])
}

describe('catálogo frente a los enums del backend', () => {
  it('los mapas y las expansiones son exactamente los del backend', () => {
    expect([...MAP_ORDER].sort()).toEqual(enumValues('MapName').sort())
    expect(Object.keys(EXPANSIONS).sort()).toEqual(enumValues('Expansion').sort())
  })

  it('cada hito, recompensa y corporación del backend tiene su etiqueta o su emblema', () => {
    for (const m of enumValues('Milestone')) expect(MILESTONE_LABELS[m], m).toBeDefined()
    for (const a of enumValues('Award')) expect(AWARD_LABELS[a], a).toBeDefined()
    for (const c of enumValues('Corporation')) expect(CORP_BY_NAME[c], c).toBeDefined()
    expect(enumValues('Corporation').length).toBeGreaterThan(20)
  })

  it('la hoja de jugador ofrece los mismos colores que el backend (D-84)', () => {
    const colors = readFileSync(resolve(__dirname, '../../../../backend/models/player_colors.py'), 'utf8')
    const tuple = colors.match(/PLAYER_COLORS = \(([^)]*)\)/)?.[1]
    if (!tuple) throw new Error('No está la tupla PLAYER_COLORS en models/player_colors.py')
    expect([...COLORS]).toEqual([...tuple.matchAll(/"([^"]+)"/g)].map((m) => m[1]))
  })
})
