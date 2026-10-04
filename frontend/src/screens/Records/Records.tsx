// Salón de récords (F34, SCR-12): port de docs/redesign/mockup/js/screens/records.js con datos de la API.
// Los récords se calculan sobre el subconjunto de partidas del filtro (#37): mesa, mapa y expansión.
import { useMemo } from 'react'
import { useGameSummaries, useGroupSummary, usePlayersList, useRecords } from '@/data/hooks'
import { bySignup, playerIndex } from '@/data/instruments'
import { EXPANSIONS, MAP_ORDER, mapInfo } from '@/domain/catalog'
import { Empty } from '@/ui/atoms'
import { cx } from '@/ui/cx'
import { FilterChip, FilterGroup, FilterPanel } from '@/ui/filters'
import { ScreenHead } from '@/ui/frame'
import { useSearchParam } from '@/ui/hooks/useSearchParam'
import { Icon, MapGlyph } from '@/ui/icons'
import { MesaFilter, MesaNotice, useMesaParam, type TableSize } from '@/ui/MesaFilter'
import reveal from '@/ui/reveal.module.css'
import { ErrorState, LoadingState } from '@/ui/states'
import { gamesText, splitRecords, timeline } from './model'
import { Monument, Plaque } from './Plaques'
import { TrophyNav } from './TrophyNav'
import styles from './Records.module.css'

interface Option { id: string; label: string; icon: JSX.Element }
const MAP_OPTIONS: Option[] = MAP_ORDER.map((m) => ({ id: m, label: m, icon: <MapGlyph glyph={mapInfo(m).glyph} size={18} /> }))
const EXP_OPTIONS: Option[] = Object.values(EXPANSIONS).map((e) => ({ id: e.id, label: e.label, icon: <Icon name={e.glyph} size={15} /> }))

function Filter({ label, value, options, onChange }: { label: string; value: string | null; options: Option[]; onChange: (v: string | null) => void }) {
  return (
    <FilterGroup label={label}>
      <FilterChip on={!value} onClick={() => onChange(null)}>Todos</FilterChip>
      {options.map((o) => <FilterChip key={o.id} on={value === o.id} onClick={() => onChange(value === o.id ? null : o.id)}>{o.icon}{o.label}</FilterChip>)}
    </FilterGroup>
  )
}

/** Mapa (`?mapa=`) y expansión (`?exp=`) válidos de la URL; cualquier otro valor se ignora. */
function useRecordFilters() {
  const [rawMap, setMap] = useSearchParam('mapa')
  const [rawExp, setExp] = useSearchParam('exp')
  const [mesa, setMesa] = useMesaParam()
  const map = rawMap && MAP_ORDER.includes(rawMap) ? rawMap : null
  const exp = rawExp && EXPANSIONS[rawExp] ? rawExp : null
  return { map, exp, mesa, setMap, setExp, setMesa }
}

type Filters = ReturnType<typeof useRecordFilters>

function useRecordsData({ map, exp, mesa }: { map: string | null; exp: string | null; mesa: TableSize | null }) {
  const subset = { mesa, map, expansion: exp }
  const q = { records: useRecords(subset), games: useGameSummaries(subset), archive: useGroupSummary(), players: usePlayersList() }
  const all = Object.values(q)
  const players = useMemo(() => playerIndex(q.players.players ?? []), [q.players.players])
  const order = useMemo(() => bySignup(q.players.players ?? []).map((p) => p.player_id), [q.players.players])
  return { q, players, rank: (id: string) => order.indexOf(id), error: all.find((x) => x.error)?.error, retry: () => all.forEach((x) => x.refetch()) }
}

function Hall({ d }: { d: ReturnType<typeof useRecordsData> }) {
  const { records, games, archive } = { records: d.q.records.records!, games: d.q.games.games!, archive: d.q.archive.summary! }
  if (!games.length) return <Empty icon="trophy" title="Sin partidas con este filtro">Probá con otro mapa o expansión.</Empty>
  const t = timeline(archive.first ?? '', archive.last ?? '')
  const { top, rest } = splitRecords(records)
  return (
    <>
      {top && top.value != null && <Monument rec={top} players={d.players} t={t} />}
      <ul className={styles.plaques}>{rest.map((r, i) => <Plaque key={r.code} rec={r} i={i} players={d.players} t={t} rank={d.rank} />)}</ul>
    </>
  )
}

function Body({ f }: { f: Filters }) {
  const d = useRecordsData(f)
  if (d.error) return <ErrorState onRetry={d.retry} />
  if (!d.q.records.records || !d.q.games.games || !d.q.archive.summary || !d.q.players.players) return <LoadingState />
  const n = d.q.games.games.length
  return (
    <>
      <MesaNotice value={f.mesa} onClear={() => f.setMesa(null)}>{gamesText(n)}</MesaNotice>
      {(f.map || f.exp) && !f.mesa && <p className={styles.activef}><span>{gamesText(n)} con este filtro</span></p>}
      <Hall d={d} />
    </>
  )
}

export default function Records() {
  const f = useRecordFilters()
  return (
    <>
      <TrophyNav current="records" />
      <ScreenHead title="Salón de récords" sub="Las mejores marcas del grupo. Un récord cambia de dueño solo cuando alguien lo supera; quien lo iguala lo comparte." revealAt={0} />
      <FilterPanel className={cx(styles['records-filters'], reveal.reveal)}>
        <MesaFilter value={f.mesa} onChange={f.setMesa} />
        <Filter label="Mapa" value={f.map} options={MAP_OPTIONS} onChange={f.setMap} />
        <Filter label="Expansión" value={f.exp} options={EXP_OPTIONS} onChange={f.setExp} />
      </FilterPanel>
      <Body f={f} />
    </>
  )
}
