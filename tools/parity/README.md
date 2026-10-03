# Arnés de comparación (v2.0)

Compara el mockup (`docs/redesign/mockup/`) con la app real, escenario por escenario, en 1440×900 y 390×844. Especificación: `.planning/v2.0/SPEC.md` §6–7.

```bash
bash scripts/dev/bootstrap.sh                        # instala node_modules de este paquete y detecta chromium
node tools/parity/run.mjs --self --phase 16          # mockup contra sí mismo (≤ 0,01 %)
node tools/parity/run.mjs --self --ref mockup@<sha>  # una versión vieja del mockup contra la actual
node tools/parity/run.mjs --phase 28 --screens inicio # mockup contra la app (levanta tm_parity, uvicorn y vite preview)
npm --prefix tools/parity test                       # tests unitarios del arnés
```

Opciones: `--ids a,b`, `--screens a,b`, `--viewports desktop,mobile`, `--concurrency N` (por defecto 2), `--out dir`.
Sale con 1 si falla un escenario exigido (`gateFromPhase` ≤ fase; en `--self`, todos).

## Cómo funciona

- **Referencia** (`serve/reference.mjs`): el mockup estático; jsdelivr se responde con los paquetes de `node_modules` (versiones fijas), Google Fonts con las tipografías locales (`frontend/src/styles/fonts.css` y los archivos de `frontend/public/fonts/`), `fonts.gstatic.com` y toda otra red externa se bloquean; se ocultan los controles del prototipo.
- **Candidata** (`serve/candidate.mjs`): recrea `tm_parity`, `alembic upgrade head`, carga `fixtures/seed.json`, levanta uvicorn con credenciales de prueba, `vite build --mode parity` y `vite preview`; inyecta la sesión en `localStorage` salvo en escenarios `fresh: true`.
- **Congelado**: viewport a 1x, `reducedMotion: reduce`, `es-AR`, `America/Argentina/Buenos_Aires`, reloj fijo `2026-09-27T21:00:00-03:00`, mouse quieto, capturas con animaciones deshabilitadas y sin cursor de texto.
- **Listo** cuando: fuentes cargadas, `html[data-planet]` en `ready` o `fallback` y el planeta quieto (`__TM_PLANET__.settled()`), red en reposo 500 ms, 2 frames, ningún `aria-busy`.
- **Métricas por frame** (frames = pantallas de scroll de `[data-scroll-root]`): píxeles fuera del planeta, planeta (rect de `__TM_PLANET__.drawRect()`), alto y cantidad de frames, árbol de accesibilidad (main, navegación, diálogo), estilos de `probes`, errores de consola, desbordes y axe (este último solo en modo candidata).

## Escenarios

`scenarios/<pantalla>.yaml`, lista de objetos:

```yaml
- id: games-sort-winner          # único
  screen: partidas
  ref: { hash: '#partidas', search: '?mesa=3' }
  cand: { path: /partidas, search: '?mesa=3' }
  viewports: [desktop, mobile]   # por defecto, los dos
  fresh: false                   # true: sin sesión en la app
  planet: required               # none: la pantalla no tiene planeta
  actions:                       # por rol accesible, iguales en los dos lados
    - click: { role: button, name: Ganador }
      expect: { role: dialog }     # opcional: espera ese elemento (y reintenta la acción una vez)
  frames: all                    # o un número
  masks: [{ x: 0, y: 0, w: 100, h: 20 }]
  probes: [{ id: title, selector: 'h1' }]
  gateFromPhase: 29
  thresholds:
    pixels: { value: 0.6, reason: 'El calendario usa la fecha real del servidor' }
```

Salidas en `out/<run>/` (ignorado por git): `report.html` (lado a lado, diferencias y deslizador), `summary.json` e `img/`, y `judge/` con las composiciones para el juez visual (`JUDGE_RUBRIC.md`).
