// Inicio (F28, SCR-02): port de docs/redesign/mockup/js/screens/home.js con datos de la API.
import { useState } from 'react'
import { useMesaParam } from '@/ui/MesaFilter'
import { useSearchParam } from '@/ui/hooks/useSearchParam'
import { ErrorState, LoadingState } from '@/ui/states'
import { Council } from './Council'
import { FeedList } from './FeedList'
import { LastGame, NoGames } from './LastGame'
import { categoryOf, logbookItems } from './model'
import { SeasonHero } from './SeasonHero'
import { SeasonRace } from './SeasonRace'
import { SeasonRules } from './SeasonRules'
import { useHomeData } from './useHomeData'
import { Plate, SectionHead } from '@/ui/atoms'
import { cx } from '@/ui/cx'
import reveal from '@/ui/reveal.module.css'
import styles from './Home.module.css'

export default function Home() {
  const [rules, setRules] = useState(false)
  const [mesa, setMesa] = useMesaParam()
  const [cat] = useSearchParam('cat')
  const category = categoryOf(cat)
  const d = useHomeData(category, mesa)
  if (d.error) return <ErrorState onRetry={d.refetch} />
  if (!d.ready) return <LoadingState />
  return (
    <>
      <SeasonHero season={d.season!} summary={d.summary!} onRules={() => setRules(true)} />
      <div className={styles['home-grid']}>
        {d.report ? <LastGame report={d.report} players={d.players} /> : <NoGames />}
        <Plate className={cx(styles.logbook, reveal.reveal)} label="Bitácora">
          <SectionHead title="Bitácora del archivo" />
          <FeedList items={logbookItems(d.feed!)} players={d.players} />
        </Plate>
        <Council rows={d.ranking!.players} />
        <SeasonRace season={d.season!} category={category} mesa={mesa} setMesa={setMesa} players={d.players} />
      </div>
      {rules && <SeasonRules players={d.players} onClose={() => setRules(false)} />}
    </>
  )
}
