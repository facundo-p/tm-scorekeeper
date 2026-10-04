# Phase 27 — Verification

| Criterio | Evidencia | Estado |
|---|---|---|
| Planeta WebGL2 en TS, chunk aparte, respaldo CSS (FX-01) | `stage-*.js` aparte en el build; `PlanetSlot.test.tsx` (respaldo y registro); `planetMotion.test.ts` | ✅ |
| Shaders sin deriva respecto del mockup | `planetShaders.test.ts` (VERT, BAKE_FRAG, RENDER_FRAG idénticos) | ✅ |
| `planet-parked` y shell con planeta | `run.mjs --phase 27`: `planet-parked`, `404`, `state-loading`, `state-error` con 0 % de píxeles y 0 % en el planeta, escritorio y móvil | ✅ |
| Confeti | `confetti.test.ts` | ✅ |
| Instrumentos SVG (FX-02), `gal-instruments` | 27-B | ⏳ |
