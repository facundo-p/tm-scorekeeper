// Corporación con sugerencias: se escribe para filtrar entre todas las del catálogo (combobox ARIA 1.2).
import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { corpLabel } from '@/domain/catalog'
import { CorpEmblem, inputClassFor } from '@/ui/atoms'
import corpStyles from '@/ui/atoms/CorpEmblem.module.css'
import { cx } from '@/ui/cx'
import { suggestCorps, type CorpSuggestion } from './corpSearch'
import styles from './Register.module.css'

interface CorpPickerProps {
  id: string
  value: string
  /** Corporaciones que ya eligieron los demás, con el nombre de quien la eligió. */
  takenBy: Record<string, string>
  bad: boolean
  onPick: (corp: string) => void
}

/** Siguiente opción elegible desde `from` en la dirección `dir` (se queda donde está si no hay otra). */
function nextEnabled(list: CorpSuggestion[], from: number, dir: 1 | -1) {
  for (let i = from + dir; i >= 0 && i < list.length; i += dir) if (!list[i].takenBy) return i
  return from
}

/** Estado del combobox: lo escrito (null = muestra la elegida), si está abierto y la opción activa. */
function useCorpCombo(value: string, takenBy: Record<string, string>, onPick: (corp: string) => void) {
  const [query, setQuery] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const list = suggestCorps(query ?? '', takenBy)
  const close = () => { setOpen(false); setQuery(null); setActive(-1) }
  const pick = (s?: CorpSuggestion) => { if (s && !s.takenBy) { onPick(s.corp.name); close() } }
  const type = (text: string) => { setQuery(text); setOpen(true); setActive(nextEnabled(suggestCorps(text, takenBy), -1, 1)) }
  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      setOpen(true)
      setActive((i) => nextEnabled(list, i, e.key === 'ArrowDown' ? 1 : -1))
    } else if (e.key === 'Enter' && open) { e.preventDefault(); pick(list[active]) } else if (e.key === 'Escape') close()
  }
  return { text: query ?? (value ? corpLabel(value) : ''), open, active, list, pick, type, close, show: () => setOpen(true), onKeyDown }
}

function Option({ s, id, on, onPick }: { s: CorpSuggestion; id: string; on: boolean; onPick: () => void }) {
  const ref = useRef<HTMLLIElement>(null)
  useEffect(() => { if (on) ref.current?.scrollIntoView?.({ block: 'nearest' }) }, [on])
  const [a, b] = s.match ?? [0, 0]
  return (
    <li ref={ref} id={id} role="option" aria-selected={on} aria-disabled={!!s.takenBy} tabIndex={-1}
      className={cx(styles.corpopt, on && styles['is-on'], s.takenBy && styles['is-off'])}
      onMouseDown={(e) => { e.preventDefault(); onPick() }}>
      <CorpEmblem name={s.corp.name} size="s" />
      <span className={styles.corpopt__name}>{s.label.slice(0, a)}<mark>{s.label.slice(a, b)}</mark>{s.label.slice(b)}</span>
      {s.takenBy && <small>elegida por {s.takenBy}</small>}
    </li>
  )
}

/** Campo con la sigla de la elegida y la lista de sugerencias debajo. */
export function CorpPicker({ id, value, takenBy, bad, onPick }: CorpPickerProps) {
  const c = useCorpCombo(value, takenBy, onPick)
  const listId = `${id}-opciones`
  const optId = (i: number) => `${id}-op-${i}`
  return (
    <div className={styles.corppick}>
      <span className={styles.corppick__emblem}>{value && c.text === corpLabel(value) ? <CorpEmblem name={value} size="s" /> : <span className={cx(corpStyles.corp__mark, styles.corppick__ph)}>?</span>}</span>
      <input id={id} className={cx(inputClassFor(bad), styles.corppick__input)} role="combobox" aria-expanded={c.open} aria-controls={listId}
        aria-autocomplete="list" aria-activedescendant={c.open && c.active >= 0 ? optId(c.active) : undefined} autoComplete="off"
        placeholder="Escribí para buscar" value={c.text} onFocus={(e) => { e.target.select(); c.show() }} onBlur={c.close}
        onChange={(e) => c.type(e.target.value)} onKeyDown={c.onKeyDown} />
      {c.open && !!c.list.length && (
        <ul className={styles.corppick__list} id={listId} role="listbox" aria-label="Corporaciones">
          {c.list.map((s, i) => <Option key={s.corp.name} s={s} id={optId(i)} on={i === c.active} onPick={() => c.pick(s)} />)}
        </ul>
      )}
      {c.open && !c.list.length && <p className={styles.corppick__none} role="status">Ninguna corporación coincide.</p>}
    </div>
  )
}
