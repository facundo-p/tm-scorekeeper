# Phase 19: Base visual del frontend — Context

**Milestone:** v2.0 · **Épica:** E5 (#76) · **Requisitos:** VIS-01..04 · **Plan maestro:** `.planning/v2.0/SPEC.md` § F19.

## Objetivo
Llevar al frontend el sistema visual del mockup sin tocar todavía las pantallas: ESLint con la regla de estilos (D-09), tokens, base y tipografías, íconos, átomos con CSS Modules, hoja accesible, estados, dominio (catálogo, etiquetas, formato, `cssVars`) y la galería `/__galeria` (solo en `--mode parity`) que se compara contra `#galeria` del mockup.

## Decisiones locales
- **D-42** La galería del mockup es una página «lisa»: sin rail, barra, dock, cielo ni planeta, para comparar los átomos antes de portar el shell (F26) y los efectos (F27). `#galeria` muestra átomos, campos, estados y la hoja; `#galeria?parte=instrumentos` muestra los instrumentos (escenario `gal-instruments`, F27).
- **D-43** Los estilos nuevos (`src/styles/index.css`: tokens, tipografías y base) los carga solo el marco nuevo (`src/ui/frame/Frame`), que en F19 usa solo la galería; la app vieja no cambia hasta que F26 monte el shell. Los tokens `--color-*` viejos conviven hasta F35.
- **D-44** CSS Modules con los nombres BEM del mockup como claves (`styles['btn--primary']`) para que el port sea trazable; quedan globales solo las clases que usa el SVG de los íconos (`i-st`, `g-*`, `m-*`) y las utilidades de `base.css` (`vh`, `num`, `muted`, `faint`, …).
- **D-45** La galería usa datos de ejemplo fijos (`src/pages/Gallery/sample.ts`), no la API.

## Fuera de alcance
Shell, rutas nuevas y datos (F26); planeta, cielo e instrumentos (F27); pantallas (F28+).
