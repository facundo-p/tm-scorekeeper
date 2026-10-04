import { describe, it, expect } from 'vitest'
import { categoryOf, gamesLeft, logbookItems, missingText, raceLede } from '@/screens/Home/model'
import { unlockedCount } from '@/screens/Home/LastGame'
import type { FeedItem, GameReport } from '@/data/types'

describe('Inicio (lo puro)', () => {
  it('only known categories pick the race; anything else is the total', () => {
    expect(categoryOf('card_points')).toBe('card_points')
    expect(categoryOf('nope')).toBe('total')
    expect(categoryOf(null)).toBe('total')
  })

  it('estimates the games left from the temperature, at least one', () => {
    expect(gamesLeft(-30)).toBe(24)
    expect(gamesLeft(8)).toBe(1)
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
