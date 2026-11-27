# 19-03 SUMMARY — Átomos, hoja y estados

- `frontend/src/ui/atoms/`: Plate, SectionHead, Button, Cube, PlayerTag, CorpEmblem, MapBadge, ExpansionTags, Chip, NewBadge, Delta, Tabs (flechas, Inicio y Fin), Readout, TierPips, Medal (inclinación con `useTilt`), CountUp (`useCountUp`), Empty y campos (`Field`, `TextField`, `SelectField`, `NumberField`/`Stepper`, `Switch`). Cada uno con su CSS Module cortado de `components.css` (y de `screens.css` para `.is-bad` y `stepper--s`), claves BEM (D-44).
- `frontend/src/ui/sheet/`: `Sheet` (portal a `#overlays` o al body, foco inicial, foco atrapado, Escape, clic en el fondo, devuelve el foco) y `SheetActions`.
- `frontend/src/ui/states/`: `LoadingState`, `ErrorState` (Reintentar) y `EmptyState`.
- `frontend/src/ui/{cx,motion}.ts` y `hooks/{useTilt,useCountUp}.ts`; `motion.ts` tolera entornos sin `matchMedia`.
- Diferencia con el mockup: Tabs agrega Inicio y Fin (SPEC 19.3); sin cambio visual.
- Tests: `src/test/ui/{atoms,Sheet,states,CountUp}.test.tsx`.
