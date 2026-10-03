import { HEX_PATH, ICONS, MAP_GLYPHS } from './glyphs'
import './icons.css'

interface IconProps {
  name: string
  size?: number
  label?: string
  className?: string
}

const a11y = (label?: string | null) =>
  label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true as const }

/** Ícono del set del mockup; desconocido → `dot`. Con `label` es una imagen accesible. */
export function Icon({ name, size = 20, label, className }: IconProps) {
  const body = ICONS[name] ?? ICONS.dot
  return (
    <svg className={`icon ${className ?? ''}`} width={size} height={size} viewBox="0 0 24 24"
      {...a11y(label)} dangerouslySetInnerHTML={{ __html: body }} />
  )
}

interface MapGlyphProps {
  glyph?: string
  map?: string
  size?: number
  label?: string | null
}

/** Hexágono con el relieve característico de cada mapa. */
export function MapGlyph({ glyph, map, size = 28, label }: MapGlyphProps) {
  const body = `<path d="${HEX_PATH}" class="m-hex"/>${(glyph && MAP_GLYPHS[glyph]) ?? ''}`
  return (
    <svg className="map-glyph" data-map={glyph} width={size} height={size} viewBox="0 0 24 24"
      {...a11y(label ?? map)} dangerouslySetInnerHTML={{ __html: body }} />
  )
}
