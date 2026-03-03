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

Cobertura actual: **61 tests** distribuidos en 7 archivos:

| Archivo | Qué cubre |
|---|---|
| `unit/gameCalculations.test.ts` | `calcMilestonePoints`, `calcAwardPoints`, `calcRunningTotal` |
| `unit/gameRules.test.ts` | Constantes del juego, milestones y awards por mapa |
| `unit/enums.test.ts` | Valores y conteos de los enums del juego |
| `unit/validation.test.ts` | Validadores de cada paso del wizard |
| `components/Login.test.tsx` | Formulario de login con credenciales correctas e incorrectas |
| `components/StepMilestones.test.tsx` | Límite de 3 hitos, bloqueo del 4to |
| `components/StepAwards.test.tsx` | Reglas de recompensas: 2 jugadores, empate en 1ro, opciones filtradas |

### Tests E2E (Playwright)

Requieren **tanto el frontend como el backend corriendo** simultáneamente.

```bash
# Terminal 1 — Backend (desde la raíz del repo)
cd backend && uvicorn main:app --reload

# Terminal 2 — Frontend
cd frontend && npm run dev

# Terminal 3 — Ejecutar los tests E2E
cd frontend && npm run test:e2e
```

Los tests E2E crean jugadores de prueba en la base de datos (con nombre `E2E ...`) y cubren:

- Login válido e inválido, persistencia de sesión, logout
- Validaciones en cada paso del wizard de carga de partida (fecha faltante, mapa faltante, menos de 2 jugadores, recompensa duplicada)
- Creación completa de una partida con recompensas, hitos y todos los campos de puntaje

Para ver el reporte HTML generado tras la ejecución:

```bash
npx playwright show-report
```

---

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
├── components/       # Componentes reutilizables (Button, Input, Modal, etc.)
├── constants/        # Enums del juego (mapas, hitos, recompensas, corporaciones)
├── context/          # AuthContext (sesión en localStorage)
├── hooks/            # usePlayers, useGames
├── pages/            # Login, Home, Players, GameForm (wizard), GameRecords, Records
├── types/            # Interfaces TypeScript de los DTOs del backend
├── utils/            # gameCalculations.ts, validation.ts
└── test/
    ├── unit/         # Tests de utilidades y constantes
    ├── components/   # Tests de componentes con React Testing Library
    └── e2e/          # Tests de integración con Playwright
```
