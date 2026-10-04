# tm-scorekeeper — Frontend

Interfaz web de la aplicación construida con React 18 + TypeScript + Vite. Se comunica con el backend FastAPI a través de un proxy en desarrollo.

---

## Requisitos previos

| Herramienta | Versión mínima | Verificación |
|---|---|---|
| **Node.js** | 18.x o superior | `node --version` |
| **npm** | 9.x o superior | `npm --version` |
| **Backend corriendo** | — | Ver `README.md` en la raíz del repo |

---

## Instalación

Desde la carpeta `frontend/`:

```bash
npm install
```

---

## Levantar el servidor de desarrollo

```bash
npm run dev
```

El frontend queda disponible en **http://localhost:5173**.

Todas las llamadas a `/api/*` se redirigen automáticamente al backend en `http://localhost:8000`, por lo que no hace falta configurar CORS ni variables de entorno adicionales.

> **El backend debe estar corriendo** antes de usar la aplicación. Ver instrucciones en el `README.md` de la raíz del repo.

### Credenciales de acceso

El login es real (v2.0, D-03): el backend valida contra `AUTH_USERNAME` y `AUTH_PASSWORD_HASH` (ver `backend/.env.example`) y devuelve un token que el cliente guarda en `localStorage` (`tm_token`) y manda como `Authorization: Bearer`. Un 401 de cualquier llamada cierra la sesión.

---

## Tests

### Tests unitarios y de componentes (Vitest)

No requieren backend. Se ejecutan en un entorno jsdom simulado.

```bash
# Correr todos los tests una sola vez
npm test -- --run

# Correr en modo watch (re-ejecuta al guardar)
npm test

# Abrir la interfaz visual de Vitest
npm run test:ui
```

Los tests viven en `src/test/`: `unit/` (utilidades, dominio y la regla de estilos), `components/` (pantallas actuales), `ui/` (átomos, hoja y estados del sistema visual v2.0) y `hooks/`.

### Lint

```bash
npm run lint
```

ESLint 9 (`eslint.config.js`) con typescript-eslint, react-hooks y jsx-a11y. Corre en CI con `--max-warnings 0`. Regla del proyecto (D-09): sin estilos inline; los valores dinámicos llegan al CSS solo como custom properties con `style={cssVars({ ... })}` (`src/domain/cssVars.ts`).

## Build de producción

```bash
npm run build
```

Los archivos quedan en `dist/`. Requiere que TypeScript compile sin errores.

---

## Estructura de carpetas relevante

```
frontend/src/
├── api/              # http.ts (Bearer, 15 s, cancelación, ApiError) y llamadas de las pantallas viejas
├── components/       # Componentes de las pantallas actuales (se reemplazan en v2.0)
├── constants/        # Enums del juego (mapas, hitos, recompensas, corporaciones)
├── context/          # AuthContext (sesión en localStorage)
├── data/             # v2.0: TanStack Query (query.ts) y hooks de datos de la API v2 (hooks.ts)
├── domain/           # v2.0: catálogo, etiquetas en castellano, formato es-AR y cssVars()
├── hooks/            # usePlayers, useGames
├── fx/               # v2.0: cielo (stars.ts), planeta WebGL2 (planet/), confeti y generador determinístico (rand.ts)
├── pages/            # Pantallas viejas (se muestran dentro del shell hasta portarse, D-69); Gallery/ es la galería de comparación
├── routes.tsx        # v2.0: rutas en castellano (D-02), redirecciones de las viejas, 404
├── screens/          # v2.0: pantallas nuevas (Login, Home, NotFound, y las de F29–F34)
├── shell/            # v2.0: AppShell (cielo, rail, barra superior con transmisión y temporada, dock), rutas (paths.ts)
├── styles/           # v2.0: tokens, tipografías y base del sistema visual (los carga ui/frame)
├── types/            # Interfaces TypeScript de los DTOs del backend
├── ui/               # v2.0: atoms/ (CSS Modules), icons/, sheet/, states/, frame/, hooks/, filters/, MesaFilter/, instruments/
├── utils/            # gameCalculations.ts, validation.ts, a11y.ts
└── test/
    ├── unit/         # Utilidades, dominio y regla de estilos
    ├── components/   # Componentes con React Testing Library
    ├── ui/           # Sistema visual v2.0
    ├── shell/        # Shell, rutas y filtro de mesa (v2.0)
    ├── fx/           # Planeta (deriva de shaders, motor), confeti (v2.0)
    ├── instruments/  # Instrumentos SVG (v2.0)
    └── e2e/          # Tests de integración con Playwright
```

### Sistema visual v2.0

Port del mockup (`docs/redesign/mockup/`). Los estilos son CSS Modules con los nombres BEM del mockup como claves (`styles['btn--primary']`, D-44); las tipografías se sirven desde `public/fonts/` y se declaran en `src/styles/fonts.css`. La galería `/__galeria` muestra los átomos con datos fijos y existe solo en `vite build --mode parity`, que usa el arnés de comparación (`tools/parity/`).

### Shell, rutas y datos (v2.0, F26)

- Rutas en castellano (`/`, `/partidas`, `/partidas/:id`, `/registrar`, `/ranking`, `/jugadores/:id`, `/records`, `/logros`, `/acceso`); las viejas (`/home`, `/games/...`, `/players/...`) redirigen. Una ruta desconocida muestra la 404 dentro del shell.
- Mientras una pantalla no se porte (F28–F34), su ruta nueva muestra la página vieja dentro del shell (D-69).
- Datos: `useApiQuery` envuelve TanStack Query con la forma del skill `new-hook` (`{ dato, loading, error, refetch }`); la clave de cache es la ruta con su query string, así el filtro (`?player_count=`) separa las entradas (D-10).
- Filtro de mesa: `useMesaParam()` lee y escribe `?mesa=2..5` en la URL; `MesaFilter` y `MesaNotice` en `ui/MesaFilter/`.
- Con `vite --mode parity`, `?demo=loading|error` muestra el estado de carga o de error en cualquier pantalla (comparación).

### Planeta y efectos (v2.0, F27)

- `fx/planet/`: el Marte WebGL2 persistente del mockup. `PlanetProvider` (en `routes.tsx`) comparte el motor; `PlanetCanvas` va en la capa `.fx` del marco y carga el motor (`stage.ts`) en un chunk aparte; una pantalla pide el globo con `<PlanetSlot region="Hellas" />` y el planeta vuela ahí. Sin slot se estaciona abajo a la derecha.
- Sin WebGL2 (o mientras carga), el slot pinta un globo CSS; con `prefers-reduced-motion`, el globo es una imagen fija.
- `fx/planet/shaders.ts` es copia literal del mockup: no se edita a mano (lo vigila `src/test/fx/planetShaders.test.ts`). Lo puro del motor (objetivos y suavizado) está en `motion.ts`, con tests.
- `fx/stars.ts` (cielo) y `fx/confetti.ts` (estallido de la ceremonia).
- `ui/instruments/`: termómetro, arco de oxígeno, océanos, pista de puntaje, leyenda, barras de puntaje (con tabla), composición, sparkline, forma, gráfico de ELO (con tabla), matriz cara a cara, pista de TR y cambio de ELO. Reciben datos ya resueltos (`types.ts`); `data/instruments.ts` los arma desde la API. Lo puro (escalas, carriles, gradientes) está en funciones con tests.
- `/__galeria?parte=instrumentos` (modo parity) los muestra con datos de la API, para compararlos con el mockup (D-73).
- El CSS global de la app vieja (`src/index.css`) solo afecta a `[data-legacy]` (páginas viejas dentro de `Legacy`).

### Pantallas (v2.0, F28–F34)

- Cada pantalla vive en `screens/<Pantalla>/`: componentes chicos, un `*.module.css` portado de `screens.css` del mockup y lo puro en `model.ts` (con tests en `src/test/screens/`). Los datos salen de hooks de `data/hooks.ts`.
- Acceso (`/acceso`, F28): login real; valida campos vacíos sin llamar al servidor y muestra los errores del servidor con los textos del mockup.
- Inicio (`/`, F28): temporada en curso con el planeta interactivo, última partida, bitácora, consejo y carrera por promedio; la categoría (`?cat=`) y la mesa (`?mesa=`) viven en la URL y solo filtran la carrera.
