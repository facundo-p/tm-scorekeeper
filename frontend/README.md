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

### Credenciales de acceso (mock)

| Usuario | Contraseña |
|---|---|
| `admin` | `admin` |

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
├── api/              # Cliente HTTP y llamadas a la API
├── components/       # Componentes de las pantallas actuales (se reemplazan en v2.0)
├── constants/        # Enums del juego (mapas, hitos, recompensas, corporaciones)
├── context/          # AuthContext (sesión en localStorage)
├── domain/           # v2.0: catálogo, etiquetas en castellano, formato es-AR y cssVars()
├── hooks/            # usePlayers, useGames
├── pages/            # Pantallas; Gallery/ es la galería de comparación (/__galeria, solo --mode parity)
├── styles/           # v2.0: tokens, tipografías y base del sistema visual (los carga ui/frame)
├── types/            # Interfaces TypeScript de los DTOs del backend
├── ui/               # v2.0: atoms/ (CSS Modules), icons/, sheet/, states/, frame/, hooks/
├── utils/            # gameCalculations.ts, validation.ts, a11y.ts
└── test/
    ├── unit/         # Utilidades, dominio y regla de estilos
    ├── components/   # Componentes con React Testing Library
    ├── ui/           # Sistema visual v2.0
    └── e2e/          # Tests de integración con Playwright
```

### Sistema visual v2.0

Port del mockup (`docs/redesign/mockup/`). Los estilos son CSS Modules con los nombres BEM del mockup como claves (`styles['btn--primary']`, D-44); las tipografías se sirven desde `public/fonts/` y se declaran en `src/styles/fonts.css`. La galería `/__galeria` muestra los átomos con datos fijos y existe solo en `vite build --mode parity`, que usa el arnés de comparación (`tools/parity/`).
