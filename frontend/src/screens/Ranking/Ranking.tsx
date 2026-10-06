// Ranking (F32, SCR-08 y SCR-09): port de docs/redesign/mockup/js/screens/ranking.js con datos de la API.
// Con filtro de mesa todo (el ELO incluido) se recalcula sobre esas partidas.
import { useState } from 'react'
import { useHeadToHead, usePlayersList, useRanking } from '@/data/hooks'
import type { HeadToHead, PlayerSummary, Ranking as RankingData } from '@/data/types'
import { ScreenHead } from '@/ui/frame'
import { MesaFilter, MesaNotice, useMesaParam, type TableSize } from '@/ui/MesaFilter'
import { ErrorState, LoadingState } from '@/ui/states'
import { ByTable } from './ByTable'
import { EloPanel } from './EloPanel'
import { HeadToHeadPanel } from './HeadToHeadPanel'
import { Leaderboard } from './Leaderboard'
import { PlayerSheet } from './PlayerSheet'
import { Roster } from './Roster'
import styles from './Ranking.module.css'

interface GridProps { ranking: RankingData; h2h: HeadToHead; players: PlayerSummary[]; mesa: TableSize | null; onAdd: () => void }

function Grid({ ranking, h2h, players, mesa, onAdd }: GridProps) {
  const rows = ranking.players
  return (
    <div className={styles['ranking-grid']}>
      <Leaderboard rows={rows} mesa={mesa} />
      <EloPanel key={mesa ?? 'all'} rows={rows} mesa={mesa} />
      <ByTable rows={rows} mesa={mesa} />
      <HeadToHeadPanel rows={rows} h2h={h2h} />
      <Roster players={players} onAdd={onAdd} />
    </div>
  )
}

function useRankingData(mesa: TableSize | null) {
  const r = useRanking({ mesa })
  const h = useHeadToHead({ mesa })
  const p = usePlayersList()
  const error = r.error ?? h.error ?? p.error
  const retry = () => { r.refetch(); h.refetch(); p.refetch() }
  return { ranking: r.ranking, h2h: h.h2h, players: p.players, error, retry }
}

export default function Ranking() {
  const [adding, setAdding] = useState(false)
  const [mesa, setMesa] = useMesaParam()
  const d = useRankingData(mesa)
  return (
    <>
      <ScreenHead title="Ranking" sub="ELO por pares con K = 32: cada partida enfrenta a todos contra todos. Todos arrancan en 1000." revealAt={0}>
        <MesaFilter value={mesa} onChange={setMesa} />
      </ScreenHead>
      <MesaNotice value={mesa} onClear={() => setMesa(null)}>el ELO se recalcula desde 1000 solo con esas partidas</MesaNotice>
      {d.error ? <ErrorState onRetry={d.retry} />
        : !d.ranking || !d.h2h || !d.players ? <LoadingState />
          : <Grid ranking={d.ranking} h2h={d.h2h} players={d.players} mesa={mesa} onAdd={() => setAdding(true)} />}
      {adding && d.players && <PlayerSheet players={d.players} onClose={() => setAdding(false)} />}
    </>
  )
}
