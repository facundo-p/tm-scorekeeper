# 35-01 SUMMARY — Borrar lo viejo

- **Cuatro PR que solo borran (D-81):** #171 (tests de v1 y Playwright), #172 (páginas, `Legacy` e `index.css`), #173 (componentes, recharts y lucide) y 35.1-D (hooks, tipos, utilidades, constantes y API vieja del cliente).
- **Ya no existen:** `pages/`, `components/`, `hooks/`, `types/`, `utils/`, `constants/`, los tokens `--color-*` ni el reset de `[data-legacy]`.
- **Dependencias quitadas:** recharts, lucide-react y @playwright/test.
- **Lo que siguió en uso se movió:**
  - la galería de comparación a `screens/Gallery`;
  - `ProtectedRoute` a `shell/`.
- **El espejo de reglas del juego se quedó:**
  - `TestFrontendMirror` en el backend ahora compara `game_rules.py` con los hitos y recompensas de cada mapa en `domain/catalog.ts`;
  - `catalogEnums.test.ts` controla que el catálogo cubra los enums del backend.
- **Skills al día:** `new-component`, `new-hook`, `sync-enums` y `new-achievement`.
- **Comparación completa:** en verde en cada PR; sin el CSS global viejo, las pantallas siguen iguales al mockup.
