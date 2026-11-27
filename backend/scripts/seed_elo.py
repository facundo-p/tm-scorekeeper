"""
Seed script: calcula y persiste retroactivamente el ELO de todos los jugadores
a partir de las partidas ya registradas, en orden cronológico.

Es idempotente a nivel seed: si ya hay registros en player_elo_history aborta
sin tocar nada. La lógica de recálculo vive en EloService.recompute_all().

Usage:
    cd backend && python scripts/seed_elo.py
"""

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from repositories.container import elo_repository, players_repository
from services.container import elo_service


def seed_elo() -> int:
    if elo_repository.has_any_history():
        print(
            "ABORT: player_elo_history ya tiene registros. "
            "El seed solo se puede correr sobre una tabla vacía."
        )
        return 1

    if not players_repository.get_all():
        print("No hay jugadores registrados. Nada para hacer.")
        return 0

    print("Procesando partidas en orden cronológico...")
    elo_service.recompute_all()

    players = players_repository.get_all()
    print("\nELO final por jugador:")
    for player in sorted(players, key=lambda p: -p.elo):
        print(f"  {player.name:<20} {player.elo}")

    print("\nDone.")
    return 0


if __name__ == "__main__":
    sys.exit(seed_elo())
