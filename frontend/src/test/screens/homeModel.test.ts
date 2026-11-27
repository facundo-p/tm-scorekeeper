import { describe, it, expect } from 'vitest'
import { categoryOf, logbookItems, missingText, pendingParams, raceLede, seasonEta } from '@/screens/Home/model'
import { unlockedCount } from '@/screens/Home/LastGame'
import type { FeedItem, GameReport } from '@/data/types'

describe('Inicio (lo puro)', () => {
  it('only known categories pick the race; anything else is the total', () => {
    expect(categoryOf('card_points')).toBe('card_points')
    expect(categoryOf('nope')).toBe('total')
    expect(categoryOf(null)).toBe('total')
  })

  it('tells the games left and which parameters are still missing', () => {
    const early = { temp: 3.2, oxygen: 2.5, oceans: 1.5, games_left: 20 }
    expect(pendingParams(early).map((p) => p.key)).toEqual(['temp', 'oxygen', 'oceans'])
    expect(seasonEta(early)).toBe('Faltan unas 20 partidas para completarla. Falta completar la temperatura, el oxígeno y los océanos.')
    const oxygenOnly = { temp: 19, oxygen: 12.6, oceans: 9, games_left: 1 }
    expect(seasonEta(oxygenOnly)).toBe('Falta más o menos 1 partida para completarla. Solo falta el oxígeno: 12,6 de 14 %.')
    expect(seasonEta({ ...early, games_left: null })).toContain('Todavía no hay vegetación')
  })

  it('the race lede names the category and the Turmoil pool', () => {
    expect(raceLede('total', 12)).toBe('Promedio de puntos por partida en las 12 partidas de esta temporada. Hacen falta 3 partidas para clasificar.')
    expect(raceLede('turmoil_points', 4)).toContain('las 4 partidas con Turmoil')
    expect(raceLede('card_points', 4)).toContain('Promedio de cartas por partida')
  })

  it('says how many games a pending player is missing', () => {
    expect(missingText(1)).toBe('le falta 1 partida')
    expect(missingText(2)).toBe('le faltan 2 partidas')
  })

  it('the logbook skips plain games and keeps nine', () => {
    const feed: FeedItem[] = Array.from({ length: 12 }, (_, i) => ({ date: '2026-01-01', type: i % 3 ? 'record' : 'game', text: `${i}` }))
    const items = logbookItems(feed)
    expect(items.every((f) => f.type !== 'game')).toBe(true)
    expect(items.length).toBeLessThanOrEqual(9)
  })

  it('counts the achievement levels reached in a game', () => {
    const report = { achievements_by_player: { a: [{ code: 'x', tier: 1, levels: 1 }, { code: 'y', tier: 3, levels: 2 }], b: [{ code: 'x', tier: 1, levels: 1 }] } } as unknown as GameReport
    expect(unlockedCount(report)).toBe(4)
  })
})
