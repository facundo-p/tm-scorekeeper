# tm-scorekeeper — Frontend

Interfaz web de la aplicación construida con React 18 + TypeScript + Vite: el port del mockup del rediseño (`docs/redesign/mockup/`) con datos reales. Se comunica con el backend FastAPI a través de un proxy en desarrollo.

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

Los tests viven en `src/test/`: `unit/` (dominio, cliente HTTP, la regla de estilos y el catálogo frente a los enums del backend), `ui/` (átomos, hoja y estados del sistema visual), `shell/`, `fx/`, `instruments/` y `screens/`. Los recorridos de punta a punta (registrar solo con el teclado, saltar la ceremonia) son chequeos funcionales del arnés de comparación (`tools/parity/functional`, D-81).

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

Presupuesto (D-83): `node tools/budgets/check-bundle.mjs` (desde la raíz, después del build) lee `dist/.vite/manifest.json` y falla si:
- el JS inicial pasa de 100 kB gzip. El JS inicial es la entrada y sus imports estáticos; las pantallas y el motor del planeta se cargan con `import()`.
- el motor del planeta (`fx/planet/stage.ts`) no está en un chunk aparte.

Lo corren CI y `gates.sh`.

---

## Estructura de carpetas relevante

```
frontend/src/
├── api/              # http.ts (Bearer, 15 s, cancelación, ApiError), client.ts y auth.ts (login y sesión)
├── context/          # AuthContext (sesión en localStorage)
├── data/             # TanStack Query (query.ts), hooks de lectura (hooks.ts), escrituras (mutations.ts) y tipos de la API (types.ts)
├── domain/           # catálogo del juego (mapas con sus hitos y recompensas, expansiones, corporaciones), etiquetas en castellano, formato es-AR y cssVars()
├── fx/               # cielo (stars.ts), planeta WebGL2 (planet/), confeti y generador determinístico (rand.ts)
├── routes.tsx        # rutas en castellano (D-02), redirecciones de las rutas de v1, 404
├── screens/          # pantallas (Login, Home, Games, GameReport, Register, Ceremony, Ranking, Profile, Records, Achievements, NotFound) y Gallery/, la galería de comparación
├── shell/            # AppShell (cielo, rail, barra superior con transmisión y temporada, dock), rutas (paths.ts) y ProtectedRoute
├── styles/           # tokens, tipografías y base del sistema visual (los carga ui/frame)
├── ui/               # atoms/ (CSS Modules), icons/, sheet/, states/, frame/, hooks/, filters/, MesaFilter/, instruments/
└── test/
    ├── unit/         # Dominio, cliente HTTP, regla de estilos y catálogo frente al backend
    ├── ui/           # Sistema visual (átomos, hoja y estados)
    ├── shell/        # Shell, rutas y filtro de mesa
    ├── fx/           # Planeta (deriva de shaders, motor), confeti
    ├── instruments/  # Instrumentos SVG
    └── screens/      # Pantallas y su lógica pura
```

### Sistema visual v2.0

Port del mockup (`docs/redesign/mockup/`). Los estilos son CSS Modules con los nombres BEM del mockup como claves (`styles['btn--primary']`, D-44); las tipografías se sirven desde `public/fonts/` y se declaran en `src/styles/fonts.css`. La galería `/__galeria` muestra los átomos con datos fijos y existe solo en `vite build --mode parity`, que usa el arnés de comparación (`tools/parity/`).

### Shell, rutas y datos (v2.0, F26)

- Rutas en castellano (`/`, `/partidas`, `/partidas/:id`, `/registrar`, `/ranking`, `/jugadores/:id`, `/records`, `/logros`, `/acceso`); las viejas (`/home`, `/games/...`, `/players/...`) redirigen. Una ruta desconocida muestra la 404 dentro del shell.
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

### Pantallas (v2.0, F28–F34)

- Cada pantalla vive en `screens/<Pantalla>/`: componentes chicos, un `*.module.css` portado de `screens.css` del mockup y lo puro en `model.ts` (con tests en `src/test/screens/`). Los datos salen de hooks de `data/hooks.ts`.
- Acceso (`/acceso`, F28): login real; valida campos vacíos sin llamar al servidor y muestra los errores del servidor con los textos del mockup.
- Inicio (`/`, F28): temporada en curso con el planeta interactivo, última partida, bitácora, consejo y carrera por promedio; la categoría (`?cat=`) y la mesa (`?mesa=`) viven en la URL y solo filtran la carrera.
- Partidas (`/partidas`, F29): archivo con actividad de 52 semanas, filtros (mapa, jugadores, mesa) y orden (`domain/sort.ts`); agrupado por mes cuando se ordena por fecha.
- Informe (`/partidas/:id`, F29): héroe con el planeta en la región del mapa, puntaje final (barras o tabla), hitos y recompensas, ELO, récords y logros; eliminar pide confirmación e invalida todo el cache (`data/mutations.ts`).
- Registrar (`/registrar`, F30) y editar (`/partidas/:id/editar`): asistente de 5 pasos con vista previa; el borrador vive en `sessionStorage`; guarda con `POST` (y abre la ceremonia) o `PUT` (y vuelve al informe). Lo puro (reductor, totales, validación) está en `screens/Register/model.ts` y la conversión con la API en `io.ts`.
- Ceremonia (`/partidas/:id/ceremonia`, F31): marco desnudo (sin navegación) con el conteo por categoría, el ganador con confetti, el ELO, los récords y los logros. Se puede saltar; con reduced-motion abre en el final. Lo puro está en `screens/Ceremony/model.ts`.
- Ranking (`/ranking`, F32): clasificación por ELO (o ELO de mesa con `?mesa=`) con equidad (`ui/fairness`), evolución del ELO con rangos y jugadores resaltados, desglose por tamaño de mesa, cara a cara y el plantel con alta y edición (nombre, color de cubo, desactivar). `/jugadores` redirige acá.
- Perfil (`/jugadores/:id`, F33): expediente (cubo 3D, arquetipo, ELO o ELO de mesa, lecturas, favoritos) y pestañas (`?tab=`): resumen (ELO, ADN de puntaje, equidad, por mesa, rivales, mapas, corporaciones), partidas, récords y logros. Lo puro está en `screens/Profile/model.ts`.
- Récords (`/records`, F34): monumento al mayor puntaje y placas con su escalera en la línea del archivo, filtrables por mesa, mapa y expansión (`?mesa=`, `?mapa=`, `?exp=`). Logros (`/logros`, F34): grilla con materiales por nivel, progreso de un jugador y hoja con la escalera; con mesa, vista calculada.
