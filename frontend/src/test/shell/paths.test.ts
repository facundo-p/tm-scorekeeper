import { describe, it, expect } from 'vitest'
import { PATHS, sectionOf } from '@/shell/paths'
import { apiPath } from '@/data/query'
import { mesaOf } from '@/ui/MesaFilter'

describe('rutas (D-02)', () => {
  it('builds the Spanish paths', () => {
    expect(PATHS.game('g 1')).toBe('/partidas/g%201')
    expect(PATHS.ceremony('g-063')).toBe('/partidas/g-063/ceremonia')
    expect(PATHS.profile('p-facu')).toBe('/jugadores/p-facu')
  })

  it('highlights the right section', () => {
    expect(sectionOf('/')).toBe('home')
    expect(sectionOf('/partidas/g-1/editar')).toBe('games')
    expect(sectionOf('/jugadores/p-facu')).toBe('ranking')
    expect(sectionOf('/logros')).toBe('trophies')
    expect(sectionOf('/no-existe')).toBeNull()
  })
})

describe('datos', () => {
  it('cache keys carry the filter, sorted and without empty values', () => {
    expect(apiPath('/feed', { player_count: 3, limit: null, a: '' })).toBe('/feed?player_count=3')
    expect(apiPath('/seasons/current', { player_count: 4, category: 'total' })).toBe('/seasons/current?category=total&player_count=4')
    expect(apiPath('/players/')).toBe('/players/')
  })

  it('only table sizes 2..5 are a valid mesa', () => {
    expect(mesaOf('3')).toBe(3)
    expect(mesaOf('6')).toBeNull()
    expect(mesaOf(null)).toBeNull()
  })
})
