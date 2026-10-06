# 16-04 Summary — Golden del backend
- `backend/tests/golden/{conftest,adapters,test_golden}.py` + `enabled.yaml` (positions y elo sin filtro).
- Las posiciones y el ELO (por partida y final) del backend coinciden exactamente con el mockup: el redondeo half-even alinea los dos lados.
- `pyyaml==6.0.3` en `requirements-dev.txt`.
