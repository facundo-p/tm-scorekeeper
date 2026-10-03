# 21-04 SUMMARY — Empates, récords, Spacefarer, 404 y CI

- `winners()`/`is_winner()` en `services/helpers/results.py`; `tied=true` para todo el grupo empatado (D-17). Victorias, rachas y logros cuentan a los co-ganadores (D-07). El golden de posiciones compara `tied` (D-24).
- Récords por partida con todos los poseedores del máximo, cada uno con su primera fecha (`best_with_holders`).
- Spacecrafter → Spacefarer (migración `d0e1f2a3b4c5`, `Milestone._missing_` acepta el nombre viejo, frontend, mockup y fixtures; D-31).
- 404 en récords, ELO y logros de partidas inexistentes y en logros de jugadores inexistentes (el test viejo que esperaba 200 vacío se actualizó al contrato nuevo).
- CI: job `test-migrations` (upgrade, downgrade a base, upgrade); el downgrade inicial ahora borra los tipos enum.
