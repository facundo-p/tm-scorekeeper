// Perfil del jugador (F33, SCR-10 y SCR-11): port de docs/redesign/mockup/js/screens/profile.js con datos
// de la API. Con filtro de mesa todo (el ELO incluido) sale de esas partidas; los logros, como vista calculada.
import { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { useAchievementCatalog, useGroupSummary, usePlayerAchievements, usePlayerInsights, usePlayersList, useRecords } from '@/data/hooks'
import { playerIndex } from '@/data/instruments'
import { Button, Empty, Tabs, type TabItem } from '@/ui/atoms'
import { useSearchParam } from '@/ui/hooks/useSearchParam'
import { MesaFilter, MesaNotice, useMesaParam, type TableSize } from '@/ui/MesaFilter'
import { EmptyState, ErrorState, LoadingState } from '@/ui/states'
import { Hero } from './Hero'
import { heldRecords, tabOf, type Tab } from './model'
import { Summary } from './Summary'
import { AchievementsTab, History, RecordsHeld } from './Tabs'
import styles from './Profile.module.css'

function useProfileData(pid: string, mesa: TableSize | null) {
  const q = {
    insights: usePlayerInsights(pid, { mesa }), players: usePlayersList(), summary: useGroupSummary({ mesa }),
    achievements: usePlayerAchievements(pid, { mesa }), catalog: useAchievementCatalog(), records: useRecords({ mesa }),
  }
  const all = Object.values(q)
  const players = useMemo(() => playerIndex(q.players.players ?? []), [q.players.players])
  const ready = q.insights.insights && q.players.players && q.summary.summary && q.achievements.achievements && q.catalog.catalog && q.records.records
  return { q, players, ready, error: all.find((x) => x.error)?.error, retry: () => all.forEach((x) => x.refetch()) }
}

type Data = ReturnType<typeof useProfileData>

function tabItems(d: Data): TabItem[] {
  const p = d.q.insights.insights!
  return [
    { id: 'resumen', label: 'Resumen', icon: 'chart' },
    { id: 'partidas', label: 'Partidas', icon: 'games', count: p.games },
    { id: 'records', label: 'Récords', icon: 'trophyNav', count: p.records_held.length },
    { id: 'logros', label: 'Logros', icon: 'crown', count: d.q.achievements.achievements!.filter((a) => a.tier > 0).length },
  ]
}

function TabBody({ tab, d, pid, mesa }: { tab: Tab; d: Data; pid: string; mesa: TableSize | null }) {
  const p = d.q.insights.insights!
  const me = d.players.get(pid)!
  if (tab === 'partidas') return <History rows={p.history} />
  if (tab === 'records') return <RecordsHeld name={me.name} held={heldRecords(d.q.records.records!, p.records_held)} />
  if (tab === 'logros') return <AchievementsTab catalog={d.q.catalog.catalog!} mine={d.q.achievements.achievements!} />
  return <Summary p={p} me={me} group={d.q.summary.summary!.composition} players={d.players} mesa={mesa} />
}

function noticeText(tab: Tab, mesa: TableSize | null, games: number, name: string) {
  return mesa && tab === 'logros' ? 'vista calculada: los logros oficiales no cambian' : `${games} ${games === 1 ? 'partida' : 'partidas'} de ${name}`
}

function ProfileBody({ d, pid }: { d: Data; pid: string }) {
  const [mesa, setMesa] = useMesaParam()
  const [raw, setRaw] = useSearchParam('tab')
  const tab = tabOf(raw)
  const p = d.q.insights.insights!
  const player = d.q.players.players!.find((x) => x.player_id === pid)!
  return (
    <>
      <Hero p={p} player={player} mesa={mesa} />
      <div className={styles.ptabs}><Tabs items={tabItems(d)} value={tab} onChange={(t) => setRaw(t === 'resumen' ? null : t)} label="Secciones del perfil" /></div>
      <div className={styles['profile-tools']}><MesaFilter value={mesa} onChange={setMesa} /></div>
      <MesaNotice value={mesa} onClear={() => setMesa(null)}>{noticeText(tab, mesa, p.games, player.name)}</MesaNotice>
      {p.games === 0
        ? <Empty icon="players" title={`${player.name} no jugó partidas de ${mesa} jugadores`} action={<Button onClick={() => setMesa(null)}>Ver todas las mesas</Button>}>Probá con otro tamaño de mesa.</Empty>
        : <TabBody tab={tab} d={d} pid={pid} mesa={mesa} />}
    </>
  )
}

export default function Profile() {
  const { playerId = '' } = useParams()
  const [mesa] = useMesaParam()
  const d = useProfileData(playerId, mesa)
  const missing = d.q.players.players && !d.q.players.players.some((x) => x.player_id === playerId)
  if (missing) return <EmptyState icon="search" title="Este jugador no está en el archivo" />
  if (d.error) return <ErrorState onRetry={d.retry} />
  if (!d.ready) return <LoadingState />
  return <ProfileBody d={d} pid={playerId} />
}
