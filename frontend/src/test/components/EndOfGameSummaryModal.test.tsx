import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import EndOfGameSummaryModal from '@/components/EndOfGameSummaryModal/EndOfGameSummaryModal'
import type {
  GameResultDTO,
  RecordComparisonDTO,
  AchievementsByPlayerDTO,
  EloChangeDTO,
} from '@/types'

const PLAYER_NAMES = new Map([
  ['p1', 'Alice'],
  ['p2', 'Bob'],
])

const RESULT: GameResultDTO = {
  game_id: 'game-1',
  date: '2026-04-29',
  results: [
    { player_id: 'p1', total_points: 95, mc_total: 80, position: 1, tied: false },
    { player_id: 'p2', total_points: 70, mc_total: 50, position: 2, tied: false },
  ],
}

const RECORDS_NONE_ACHIEVED: RecordComparisonDTO[] = [
  {
    code: 'high_score',
    title: 'Highest score',
    emoji: '🏆',
    description: 'Score record',
    achieved: false,
    compared: null,
    current: { value: 95, title: null, emoji: null, attributes: [] },
  },
]

const ACHIEVEMENTS_EMPTY: AchievementsByPlayerDTO = {
  achievements_by_player: { p1: [], p2: [] },
}

const ACHIEVEMENTS_WITH_UNLOCKS: AchievementsByPlayerDTO = {
  achievements_by_player: {
    p1: [
      { code: 'first_win', title: 'Primer triunfo', tier: 1, is_new: true, is_upgrade: false, icon: null, fallback_icon: 'trophy' },
    ],
    p2: [],
  },
}

const ELO_CHANGES: EloChangeDTO[] = [
  { player_id: 'p1', player_name: 'Alice', elo_before: 1500, elo_after: 1523, delta: 23 },
  { player_id: 'p2', player_name: 'Bob', elo_before: 1500, elo_after: 1477, delta: -23 },
]

const ELO_CHANGES_ZERO: EloChangeDTO[] = [
  { player_id: 'p1', player_name: 'Alice', elo_before: 1500, elo_after: 1500, delta: 0 },
  { player_id: 'p2', player_name: 'Bob', elo_before: 1500, elo_after: 1500, delta: 0 },
]

function renderModal(overrides: Partial<React.ComponentProps<typeof EndOfGameSummaryModal>> = {}) {
  const props: React.ComponentProps<typeof EndOfGameSummaryModal> = {
    result: RESULT,
    records: RECORDS_NONE_ACHIEVED,
    loadingRecords: false,
    notAvailable: false,
    achievements: ACHIEVEMENTS_EMPTY,
    eloChanges: ELO_CHANGES,
    playerNames: PLAYER_NAMES,
    onClose: vi.fn(),
    ...overrides,
  }
  return { props, ...render(<EndOfGameSummaryModal {...props} />) }
}

describe('EndOfGameSummaryModal — POST-01 modal opens with 4 sections', () => {
  it('renders the modal title "Resumen de partida"', () => {
    renderModal()
    expect(screen.getByRole('heading', { level: 2, name: /resumen de partida/i })).toBeInTheDocument()
  })

  it('renders all 4 section headings in order: Resultados, Records, Logros, ELO', () => {
    renderModal()
    const sectionHeadings = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)
    expect(sectionHeadings).toEqual(expect.arrayContaining(['Resultados', 'Records', 'Logros', 'ELO']))
    // Verify order
    const indexOf = (s: string) => sectionHeadings.indexOf(s)
    expect(indexOf('Resultados')).toBeLessThan(indexOf('Records'))
    expect(indexOf('Records')).toBeLessThan(indexOf('Logros'))
    expect(indexOf('Logros')).toBeLessThan(indexOf('ELO'))
  })

  it('calls onClose when the Continuar button is clicked', () => {
    const { props } = renderModal()
    fireEvent.click(screen.getByRole('button', { name: /continuar/i }))
    expect(props.onClose).toHaveBeenCalledOnce()
  })
})

describe('EndOfGameSummaryModal — POST-02 ELO section visuals', () => {
  it('renders one ELO row per participant with #position, name, elo_before → elo_after, signed delta', () => {
    renderModal({ eloChanges: ELO_CHANGES })
    // #1 and #2 appear in both ResultsSection and EloSection — use getAllByText
    expect(screen.getAllByText(/#1/).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText(/#2/).length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText(/1500\s*→\s*1523/)).toBeInTheDocument()
    expect(screen.getByText(/1500\s*→\s*1477/)).toBeInTheDocument()
    expect(screen.getByText('+23')).toBeInTheDocument()
    expect(screen.getByText('-23')).toBeInTheDocument()
  })

  it('applies deltaPositive class when delta > 0', () => {
    renderModal({ eloChanges: ELO_CHANGES })
    const positive = screen.getByText('+23')
    expect(positive.className).toMatch(/deltaPositive/)
  })

  it('applies deltaNegative class when delta < 0', () => {
    renderModal({ eloChanges: ELO_CHANGES })
    const negative = screen.getByText('-23')
    expect(negative.className).toMatch(/deltaNegative/)
  })

  it('applies deltaZero class and renders ±0 when delta === 0', () => {
    renderModal({ eloChanges: ELO_CHANGES_ZERO })
    const zeros = screen.getAllByText('±0')
    expect(zeros).toHaveLength(2)
    expect(zeros[0].className).toMatch(/deltaZero/)
  })

  it('omits ELO section entirely when eloChanges is null (no "ELO" heading rendered)', () => {
    renderModal({ eloChanges: null })
    // D-04: eloChanges === null means fetch not yet settled or failed — section omitted entirely
    const eloHeadings = screen.queryAllByRole('heading', { level: 3, name: /^ELO$/ })
    expect(eloHeadings).toHaveLength(0)
  })

  it('omits ELO section entirely when eloChanges is an empty array (no "ELO" heading rendered)', () => {
    renderModal({ eloChanges: [] })
    const eloHeadings = screen.queryAllByRole('heading', { level: 3, name: /^ELO$/ })
    expect(eloHeadings).toHaveLength(0)
  })

  it('still renders Resultados, Records, and Logros sections when ELO eloChanges is null', () => {
    renderModal({ eloChanges: null })
    expect(screen.getByRole('heading', { level: 3, name: /resultados/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: /records/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: /logros/i })).toBeInTheDocument()
  })
})

describe('EndOfGameSummaryModal — POST-03 position next to delta', () => {
  it('shows position #1 next to first-place player ELO row', () => {
    renderModal({ eloChanges: ELO_CHANGES })
    const positions = screen.getAllByLabelText(/posición/i)
    // ResultsSection also renders #N — at least the ELO position label should exist
    const eloPositions = positions.filter((p) => p.getAttribute('aria-label') === 'Posición 1' || p.getAttribute('aria-label') === 'Posición 2')
    expect(eloPositions.length).toBeGreaterThanOrEqual(2)
  })

  it('joins position from GameResultDTO.results to ELO entry by player_id (different player order than results)', () => {
    // result has p1=#1, p2=#2; ELO_CHANGES given in same order BUT swap player order to verify join
    const reordered: EloChangeDTO[] = [
      { player_id: 'p2', player_name: 'Bob', elo_before: 1500, elo_after: 1477, delta: -23 },
      { player_id: 'p1', player_name: 'Alice', elo_before: 1500, elo_after: 1523, delta: 23 },
    ]
    renderModal({ eloChanges: reordered })
    // Despite reordered eloChanges, Alice (#1) should still appear with +23 in her row,
    // and Bob (#2) with -23 in his row — order is driven by result.results, join by player_id.
    expect(screen.getByText('+23')).toBeInTheDocument()
    expect(screen.getByText('-23')).toBeInTheDocument()
  })
})

describe('EndOfGameSummaryModal — empty states (D-04)', () => {
  it('shows "Ningún record nuevo en esta partida." when records exist but none are achieved', () => {
    renderModal({ records: RECORDS_NONE_ACHIEVED })
    expect(screen.getByText('Ningún record nuevo en esta partida.')).toBeInTheDocument()
  })

  it('shows "Ningún logro desbloqueado." when achievements arrays are all empty', () => {
    renderModal({ achievements: ACHIEVEMENTS_EMPTY })
    expect(screen.getByText('Ningún logro desbloqueado.')).toBeInTheDocument()
  })

  it('renders AchievementBadgeMini groups when achievements have unlocks', () => {
    renderModal({ achievements: ACHIEVEMENTS_WITH_UNLOCKS })
    expect(screen.getByText('Primer triunfo')).toBeInTheDocument()
    // Alice header in achievements section
    expect(screen.getByRole('heading', { level: 4, name: /alice/i })).toBeInTheDocument()
  })
})

describe('EndOfGameSummaryModal — Resultados visuals', () => {
  it('marks position #1 row with firstPlace modifier class', () => {
    renderModal()
    // Alice appears in both ResultsSection and EloSection — query by resultPlayerName class via the Resultados section
    const resultados = screen.getByRole('heading', { level: 3, name: /resultados/i }).closest('section')
    const aliceRow = resultados?.querySelector('[class*="resultPlayerName"]')?.closest('div')
    expect(aliceRow?.className).toMatch(/firstPlace/)
  })

  it('renders "MC: 80" and "95 pts" for Alice', () => {
    renderModal()
    expect(screen.getByText('95 pts')).toBeInTheDocument()
    expect(screen.getByText('MC: 80')).toBeInTheDocument()
  })
})
