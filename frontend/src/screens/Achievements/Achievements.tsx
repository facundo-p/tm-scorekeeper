// Logros (F34, SCR-13): port de docs/redesign/mockup/js/screens/achievements.js con datos de la API.
// Con filtro de mesa, los niveles son una vista calculada sobre esas partidas (no cambian los oficiales).
import { useMemo, useState } from 'react'
import { useAchievementCatalog, usePlayerAchievements, usePlayersList, useRanking } from '@/data/hooks'
import { retryFailed } from '@/data/query'
import { bySignup, playerIndex } from '@/data/instruments'
import type { CatalogAchievement, PlayerAchievement } from '@/data/types'
import { cssVars } from '@/domain/cssVars'
import { Cube } from '@/ui/atoms'
import { cx } from '@/ui/cx'
import { ScreenHead } from '@/ui/frame'
import { MesaFilter, MesaNotice, useMesaParam, type TableSize } from '@/ui/MesaFilter'
import reveal from '@/ui/reveal.module.css'
import { ErrorState, LoadingState } from '@/ui/states'
import { TrophyNav } from '../Records/TrophyNav'
import { Detail, MaterialStrip, PlayerPicker, Tile } from './Parts'
import styles from './Achievements.module.css'

/** Catálogo (con mesa), jugadores activos con partidas (en orden de alta) y los logros del elegido. */
function useAchievementsData(mesa: TableSize | null, who: string | null) {
  const q = { catalog: useAchievementCatalog({ mesa }), players: usePlayersList(), ranking: useRanking() }
  const mine = usePlayerAchievements(who ?? '', { mesa, enabled: !!who })
  const all = [...Object.values(q), mine]
  const players = useMemo(() => playerIndex(q.players.players ?? []), [q.players.players])
  const withGames = new Set(q.ranking.ranking?.players.map((r) => r.player_id))
  const active = bySignup(q.players.players ?? []).filter((p) => p.is_active && withGames.has(p.player_id))
  const byCode = Object.fromEntries((who ? mine.achievements ?? [] : []).map((a) => [a.code, a]))
  return { q, players, active, byCode, error: all.find((x) => x.error)?.error, retry: () => retryFailed(all) }
}

function Count({ who, list, byCode, mesa, players }: { who: string; list: CatalogAchievement[]; byCode: Record<string, PlayerAchievement>; mesa: TableSize | null; players: ReturnType<typeof playerIndex> }) {
  const p = players.get(who)
  const unlocked = list.filter((a) => (byCode[a.code]?.tier ?? 0) > 0).length
  return <p className={styles['ach-count']}><Cube color={p?.color} size={14} /><b>{p?.name}</b> tiene {unlocked} de {list.length} logros{mesa ? ` en mesas de ${mesa}` : ''}.</p>
}

type Data = ReturnType<typeof useAchievementsData>

interface ToolsProps { d: Data; who: string | null; setWho: (id: string | null) => void; mesa: TableSize | null; setMesa: (n: TableSize | null) => void }

function Tools({ d, who, setWho, mesa, setMesa }: ToolsProps) {
  const list = d.q.catalog.catalog
  return (
    <div className={cx(reveal.reveal, styles['ach-tools'])} style={cssVars({ i: 1 })}>
      <MaterialStrip />
      <PlayerPicker players={d.active} value={who} onChange={setWho} />
      <MesaFilter value={mesa} onChange={setMesa} />
      {who && list && <Count who={who} list={list} byCode={d.byCode} mesa={mesa} players={d.players} />}
    </div>
  )
}

function Grid({ d, who, onOpen }: { d: Data; who: string | null; onOpen: (code: string) => void }) {
  const list = d.q.catalog.catalog
  if (d.error) return <ErrorState onRetry={d.retry} />
  if (!list || !d.q.players.players) return <LoadingState />
  return <ul className={styles.mgrid}>{list.map((a, i) => <Tile key={a.code} a={a} mine={who ? d.byCode[a.code] : undefined} i={i} players={d.players} onOpen={() => onOpen(a.code)} />)}</ul>
}

export default function Achievements() {
  const [who, setWho] = useState<string | null>(null)
  const [open, setOpen] = useState<string | null>(null)
  const [mesa, setMesa] = useMesaParam()
  const d = useAchievementsData(mesa, who)
  const openDef = open ? d.q.catalog.catalog?.find((a) => a.code === open) : undefined
  return (
    <>
      <TrophyNav current="achievements" />
      <ScreenHead title="Logros" sub="Cada nivel cambia el material de la medalla y queda fechado con la partida que lo alcanzó. Si se corrige o se borra una partida, los niveles se recalculan." revealAt={0} />
      <Tools d={d} who={who} setWho={setWho} mesa={mesa} setMesa={setMesa} />
      <MesaNotice value={mesa} onClear={() => setMesa(null)}>vista calculada: los logros oficiales no cambian</MesaNotice>
      <Grid d={d} who={who} onOpen={setOpen} />
      {openDef && <Detail a={openDef} mine={who ? d.byCode[openDef.code] : undefined} who={who} players={d.players} onClose={() => setOpen(null)} />}
    </>
  )
}
