// /__galeria?parte=instrumentos: los instrumentos con los datos reales de la candidata, para
// compararlos con #galeria?parte=instrumentos del mockup (escenario gal-instruments, F27).
import { useMemo } from 'react'
import { eloSeries, eloShift, playerIndex, scoredGame } from '@/data/instruments'
import { useEloHistory, useGameReport, useHeadToHead, usePlayerInsights, usePlayersList } from '@/data/hooks'
import type { GameReport, HeadToHead, PlayerEloHistory, PlayerInsights, PlayerSummary } from '@/data/types'
import {
  CategoryLegend, CompositionBar, EloChart, EloShift, FormStrip, H2HMatrix, OceanSlots, OxygenArc, ScoreBars, ScoreTrack, Sparkline,
  Thermometer, TRTrack,
} from '@/ui/instruments'
import { LoadingState } from '@/ui/states'
import { GALLERY_PLAYER_ORDER, SAMPLE_GAME_ID, SAMPLE_PLAYER } from './sample'
import { Section } from './sections'

interface Sources { report: GameReport; players: PlayerSummary[]; insights: PlayerInsights; history: PlayerEloHistory[]; h2h: HeadToHead }

/** Lo que dibuja la galería, armado desde la API (jugadores activos con partidas, en el orden del mockup). */
function galleryModel({ report, players, insights, history, h2h }: Sources) {
  const index = playerIndex(players)
  const rank = (id: string) => GALLERY_PLAYER_ORDER.indexOf(id)
  const shown = players.filter((p) => p.is_active && p.since).sort((a, b) => rank(a.player_id) - rank(b.player_id))
  const series = eloSeries(history, index)
  const seriesOf = (id: string) => series.find((s) => s.player.id === id)
  return {
    game: scoredGame(report, index),
    shift: eloShift(report, index),
    players: shown.map((p) => index.get(p.player_id)!),
    chart: shown.map((p) => seriesOf(p.player_id) ?? { player: index.get(p.player_id)!, points: [] }),
    spark: (seriesOf(SAMPLE_PLAYER.id)?.points ?? []).map((p) => p.elo),
    insights,
    matrix: h2h.matrix,
  }
}

function useGalleryModel() {
  const { report } = useGameReport(SAMPLE_GAME_ID)
  const { players } = usePlayersList()
  const { insights } = usePlayerInsights(SAMPLE_PLAYER.id)
  const { history } = useEloHistory()
  const { h2h } = useHeadToHead()
  return useMemo(
    () => (report && players && insights && history && h2h ? galleryModel({ report, players, insights, history, h2h }) : null),
    [report, players, insights, history, h2h],
  )
}

export function Instruments() {
  const m = useGalleryModel()
  if (!m) return <LoadingState />
  return (
    <>
      <Section title="Parámetros globales"><Thermometer value={-4} /><OxygenArc value={9} /><OceanSlots value={6} /></Section>
      <Section title="Puntaje"><ScoreTrack results={m.game.results} /><CategoryLegend /><ScoreBars game={m.game} showTable /></Section>
      <Section title="Composición y forma">
        <CompositionBar share={m.insights.composition.share} label={SAMPLE_PLAYER.name} />
        <Sparkline values={m.spark} /><FormStrip form={m.insights.form} />
      </Section>
      <Section title="ELO"><EloChart series={m.chart} highlight={[SAMPLE_PLAYER.id]} /><EloShift changes={m.shift} /></Section>
      <Section title="Cara a cara y pista de TR"><H2HMatrix players={m.players} matrix={m.matrix} /><TRTrack results={m.game.results} /></Section>
    </>
  )
}
