import { describe, it, expect } from 'vitest'
import { fmt, fmtDate, roundHalfEven } from '@/domain/format'
import { AWARD_LABELS, MILESTONE_LABELS, awardLabel, milestoneLabel } from '@/domain/labels'
import { CORP_BY_NAME, MAPS, MAP_ORDER, EXPANSIONS, corpLabel, ACHIEVEMENT_GLYPH, RECORD_ICON } from '@/domain/catalog'
// @ts-expect-error -- el mockup es JS sin tipos; el test solo compara sus datos
import * as mockupLabels from '../../../../docs/redesign/mockup/js/data/labels.js'

describe('format', () => {
  it('int agrupa desde 5 cifras (min2)', () => {
    expect(fmt.int(1234)).toBe('1234')
    expect(fmt.int(12345)).toBe('12.345')
  })

  it('signed usa el menos tipográfico y ±0', () => {
    expect([fmt.signed(12), fmt.signed(-7), fmt.signed(0)]).toEqual(['+12', '−7', '±0'])
  })

  it('dec y pct', () => {
    expect(fmt.dec(3.14159, 2)).toBe('3,14')
    expect(fmt.pct(0.256)).toBe('26 %')
  })

  it('fmtDate en es-AR, larga y corta', () => {
    expect(fmtDate('2026-09-27')).toBe('27 de septiembre de 2026')
    expect(fmtDate('2026-09-27', { short: true, year: false })).toBe('27 sept')
  })

  it('roundHalfEven como Python', () => {
    expect([0.5, 1.5, 2.5, -1.5, 2.6].map(roundHalfEven)).toEqual([0, 2, 2, -2, 3])
  })
})

describe('labels', () => {
  it('es espejo de labels.js del mockup', () => {
    expect(MILESTONE_LABELS).toEqual(mockupLabels.MILESTONE_LABELS)
    expect(AWARD_LABELS).toEqual(mockupLabels.AWARD_LABELS)
  })

  it('una clave sin traducción se muestra tal cual', () => {
    expect(milestoneLabel('Nuevo')).toBe('Nuevo')
    expect(awardLabel('Venuphile')).toBe('Venúfilo')
  })
})

describe('catalog', () => {
  it('cada mapa del orden tiene ficha y glifo', () => {
    expect(MAP_ORDER.every((m) => MAPS[m]?.glyph)).toBe(true)
  })

  it('UNMI se abrevia y las corporaciones tienen sigla', () => {
    expect(corpLabel('United Nations Mars Initiative (UNMI)')).toBe('UNMI')
    expect(CORP_BY_NAME['Point Luna'].short).toBe('PL')
  })

  it('expansiones, récords y logros', () => {
    expect(Object.keys(EXPANSIONS)).toEqual(['Prelude', 'Colonies', 'Turmoil', 'Venus next'])
    expect(Object.keys(RECORD_ICON)).toHaveLength(16)
    expect(ACHIEVEMENT_GLYPH.full_table).toBe('fullTable')
  })
})
