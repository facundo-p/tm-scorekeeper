# 16-01 Summary — Arnés de comparación
- `tools/parity/`: `run.mjs`, `config.mjs`, `lib/{args,browser,ready,actions,capture,compare,evaluate,report,scenarios}.mjs`, `serve/{static,reference,candidate}.mjs`, 7 archivos de escenarios (14 escenarios base × 2 viewports), `JUDGE_RUBRIC.md`, `README.md`; versiones fijas (`playwright@1.56.1`, `pixelmatch@7.2.0`, `pngjs@7.0.0`, `yaml@2.8.1`, `@axe-core/playwright@4.10.2`, `preact@10.27.2`, `htm@3.1.1`).
- Mockup: congelado del planeta y del ticker bajo reduced-motion, `window.__TM_PLANET__.{drawRect,settled}`, `data-planet="fallback"` sin WebGL2 (D-21).
- Tipografías OFL locales en `frontend/public/fonts/` (latin y latin-ext, D-26).
- 14 tests unitarios del arnés (`npm --prefix tools/parity test`), en CI (job `test-tools`).
- `gates.sh parity` corre `--self` hasta F18 y los tests del arnés.
