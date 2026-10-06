// Lo puro del asistente de registro (port de docs/redesign/mockup/js/screens/register.js).
import { CATEGORIES } from '@/domain/catalog'
import { today } from '@/domain/clock'
import { awardLabel } from '@/domain/labels'

export type StepId = 'game' | 'table' | 'trmc' | 'awards' | 'milestones' | 'card_resource_points' | 'card_points'
  | 'greenery_points' | 'city_points' | 'turmoil_points' | 'review'

/** Un paso del asistente: `label` en la barra de pasos, `title` en el encabezado y en «Siguiente: …»;
 * `cat` es la categoría que el paso suma al marcador provisorio. */
export interface StepInfo { id: StepId; label: string; title: string; cat?: string }

const def = (id: StepId, label: string, title = label, cat?: string): StepInfo => ({ id, label, title, cat })

/** Orden de carga: TR y M€, recompensas, hitos, recursos, cartas, vegetación, ciudades y Turmoil (el de CATEGORIES). */
export const ALL_STEPS: StepInfo[] = [
  def('game', 'Partida'),
  def('table', 'Mesa'),
  def('trmc', 'TR y M€', 'TR y M€', 'terraform_rating'),
  def('awards', 'Recompensas', 'Recompensas', 'award_points'),
  def('milestones', 'Hitos', 'Hitos', 'milestone_points'),
  def('card_resource_points', 'Recursos', 'Recursos de cartas', 'card_resource_points'),
  def('card_points', 'Cartas', 'Puntos de cartas', 'card_points'),
  def('greenery_points', 'Vegetación', 'Vegetación', 'greenery_points'),
  def('city_points', 'Ciudades', 'Ciudades', 'city_points'),
  def('turmoil_points', 'Turmoil', 'Turmoil', 'turmoil_points'),
  def('review', 'Revisión'),
]

/** Pasos de la partida: el de Turmoil solo si se jugó con Turmoil. */
export const stepsFor = (expansions: string[]) =>
  ALL_STEPS.filter((x) => x.id !== 'turmoil_points' || expansions.includes('Turmoil'))

/** Índice del paso actual dentro de los pasos de la partida (un borrador viejo puede traer uno de más). */
export const stepIndex = (s: WizardState) => Math.min(s.step, stepsFor(s.expansions).length - 1)

/** Categorías que el marcador ya suma en el paso actual (vacío fuera de los pasos de puntos). */
export function scoredCats(s: WizardState): string[] {
  const steps = stepsFor(s.expansions)
  const i = stepIndex(s)
  if (!steps[i].cat) return []
  return steps.slice(0, i + 1).flatMap((x) => (x.cat ? [x.cat] : []))
}

export const INPUT_CATS = ['terraform_rating', 'greenery_points', 'city_points', 'card_points', 'card_resource_points', 'turmoil_points'] as const
export type InputCat = (typeof INPUT_CATS)[number]
export const MAX_PLAYERS = 5
export const MAX_MILESTONES = 3
export const MAX_AWARDS = 3

export interface WizardPlayer { id: string; corp: string; mc: number; scores: Record<InputCat, number> }
export interface WizardAward { name: string; opened_by: string; first: string[]; second: string[] }

export interface WizardState {
  step: number
  /** Precargado con una partida de ejemplo (solo en modo comparación, D-76). */
  example: boolean
  /** Id de la partida que se edita (PUT), o null si es nueva. */
  editing: string | null
  date: string
  map: string
  expansions: string[]
  draft: boolean
  generations: number
  players: WizardPlayer[]
  milestones: Record<string, string>
  awards: WizardAward[]
}

export const blankScores = (): Record<InputCat, number> =>
  ({ terraform_rating: 20, greenery_points: 0, city_points: 0, card_points: 0, card_resource_points: 0, turmoil_points: 0 })

export const blankState = (): WizardState => ({
  step: 0, example: false, editing: null, date: today(), map: '', expansions: ['Prelude'], draft: true, generations: 10,
  players: [], milestones: {}, awards: [],
})

export type Action =
  | { type: 'set'; patch: Partial<WizardState> }
  | { type: 'step'; step: number }
  | { type: 'reset' }
  | { type: 'togglePlayer'; id: string }
  | { type: 'player'; id: string; patch: Partial<WizardPlayer> }
  | { type: 'score'; id: string; key: InputCat; value: number }
  | { type: 'milestone'; name: string; id: string }
  | { type: 'award'; awards: WizardAward[] }

/** Sacar a un jugador también lo saca de los hitos y recompensas (en partidas de 2 no hay 2.º puesto). */
function togglePlayer(s: WizardState, id: string): WizardState {
  const has = s.players.some((p) => p.id === id)
  if (!has && s.players.length >= MAX_PLAYERS) return s
  const players = has ? s.players.filter((p) => p.id !== id) : [...s.players, { id, corp: '', mc: 0, scores: blankScores() }]
  const keep = (pid: string) => players.some((p) => p.id === pid)
  const second = (w: WizardAward) => (players.length === 2 ? [] : w.second.filter(keep))
  return {
    ...s,
    players,
    milestones: Object.fromEntries(Object.entries(s.milestones).filter(([, pid]) => keep(pid))),
    awards: s.awards.map((w) => ({ ...w, opened_by: keep(w.opened_by) ? w.opened_by : '', first: w.first.filter(keep), second: second(w) })),
  }
}

/** Tocar al dueño de un hito lo libera; se pueden reclamar 3 como máximo. */
function claimMilestone(s: WizardState, name: string, id: string): WizardState {
  const m = { ...s.milestones }
  if (m[name] === id || !id) delete m[name]
  else if (m[name] || Object.keys(m).length < MAX_MILESTONES) m[name] = id
  return { ...s, milestones: m }
}

/** Financiar o desfinanciar una recompensa (3 como máximo). */
export function toggleAward(awards: WizardAward[], name: string): WizardAward[] {
  if (awards.some((w) => w.name === name)) return awards.filter((w) => w.name !== name)
  return awards.length >= MAX_AWARDS ? awards : [...awards, { name, opened_by: '', first: [], second: [] }]
}

export const patchAward = (awards: WizardAward[], name: string, patch: Partial<WizardAward>) =>
  awards.map((w) => (w.name === name ? { ...w, ...patch } : w))

const patchPlayer = (s: WizardState, id: string, f: (p: WizardPlayer) => WizardPlayer) =>
  ({ ...s, players: s.players.map((p) => (p.id === id ? f(p) : p)) })

export function reducer(s: WizardState, a: Action): WizardState {
  switch (a.type) {
    case 'set': return { ...s, ...a.patch }
    case 'step': return { ...s, step: a.step }
    case 'reset': return blankState()
    case 'togglePlayer': return togglePlayer(s, a.id)
    case 'player': return patchPlayer(s, a.id, (p) => ({ ...p, ...a.patch }))
    case 'score': return patchPlayer(s, a.id, (p) => ({ ...p, scores: { ...p.scores, [a.key]: Math.max(0, a.value) } }))
    case 'milestone': return claimMilestone(s, a.name, a.id)
    case 'award': return { ...s, awards: a.awards }
  }
}

export interface DerivedRow { id: string; total: number; mc: number; sc: Record<string, number>; position: number }

/** Totales con hitos (5 PV) y recompensas (5 y 2 PV) automáticos; posiciones con desempate por M€. */
export function derived(s: WizardState) {
  const turmoil = s.expansions.includes('Turmoil')
  const rows: DerivedRow[] = s.players.map((p) => {
    const milestone_points = Object.values(s.milestones).filter((id) => id === p.id).length * 5
    const award_points = s.awards.reduce((t, w) => t + (w.first.includes(p.id) ? 5 : w.second.includes(p.id) ? 2 : 0), 0)
    const sc: Record<string, number> = { ...p.scores, milestone_points, award_points, turmoil_points: turmoil ? p.scores.turmoil_points : 0 }
    return { id: p.id, total: CATEGORIES.reduce((t, c) => t + (sc[c.key] ?? 0), 0), mc: p.mc, sc, position: 0 }
  })
  const order = rows.slice().sort((a, b) => b.total - a.total || b.mc - a.mc)
  order.forEach((r, i) => {
    const prev = order[i - 1]
    r.position = prev && prev.total === r.total && prev.mc === r.mc ? prev.position : i + 1
  })
  return { rows, order, turmoil }
}

export interface WizardError { field: string; msg: string }

/** Errores del paso actual (los mismos textos que el mockup). */
export function validate(s: WizardState, name: (id: string) => string): WizardError[] {
  const e: WizardError[] = []
  const id = stepsFor(s.expansions)[stepIndex(s)].id
  if (id === 'game') {
    if (!s.map) e.push({ field: 'map', msg: 'Elegí el mapa en el que jugaron.' })
    if (!s.date) e.push({ field: 'date', msg: 'Indicá la fecha de la partida.' })
    else if (s.date > today()) e.push({ field: 'date', msg: 'La fecha no puede ser posterior a hoy.' })
  }
  if (id === 'table') {
    if (s.players.length < 2) e.push({ field: 'players', msg: 'Elegí entre 2 y 5 jugadores.' })
    s.players.filter((p) => !p.corp).forEach((p) => e.push({ field: `corp-${p.id}`, msg: `Falta la corporación de ${name(p.id)}.` }))
  }
  if (id === 'awards') {
    s.awards.forEach((w) => {
      if (!w.opened_by) e.push({ field: `aw-${w.name}`, msg: `Indicá quién financió ${awardLabel(w.name)}.` })
      if (!w.first.length) e.push({ field: `aw-${w.name}`, msg: `Indicá el 1.º puesto de ${awardLabel(w.name)}.` })
    })
  }
  return e
}

export interface BoardRow { id: string; parts: { key: string; v: number }[]; total: number; mc: number; add: number }

/** Marcador provisorio: suma solo `cats` y ordena por puntos, M€ y orden de la mesa; `add` es lo que suma la última. */
export function scoreboard(s: WizardState, cats: string[]) {
  const last = cats[cats.length - 1]
  const rows: BoardRow[] = derived(s).rows.map((r) => {
    const parts = cats.map((key) => ({ key, v: r.sc[key] ?? 0 }))
    return { id: r.id, parts, total: parts.reduce((t, x) => t + x.v, 0), mc: r.mc, add: last ? r.sc[last] ?? 0 : 0 }
  })
  const order = rows.slice().sort((a, b) => b.total - a.total || b.mc - a.mc)
  return { rows, order, scale: Math.max(100, ...rows.map((r) => r.total)) }
}

/** ¿Hay empate en puntos entre alguien y otro? */
export const hasTies = (order: DerivedRow[]) => order.some((r, i) => order.some((o, j) => j !== i && o.total === r.total))
