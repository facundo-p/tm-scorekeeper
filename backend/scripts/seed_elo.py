"""
Seed script: calcula y persiste retroactivamente el ELO de todos los jugadores
a partir de las partidas ya registradas, en orden cronológico.

Es idempotente: si ya hay registros en player_elo_history aborta sin tocar nada.

Usage:
    cd backend && python scripts/seed_elo.py
"""

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from repositories.container import (
    games_repository,
    players_repository,
    elo_repository,
)
from services.elo_service import calculate_elo_changes, DEFAULT_ELO


def seed_elo() -> int:
    if elo_repository.has_any_history():
        print(
            "ABORT: player_elo_history ya tiene registros. "
            "El seed solo se puede correr sobre una tabla vacía."
        )
        return 1

    games = list(games_repository.list().values())
    if not games:
        print("No hay partidas registradas. Nada para hacer.")
        return 0

    games.sort(key=lambda g: (g.date, g.id))

    players = players_repository.get_all()
    current_elo = {p.player_id: DEFAULT_ELO for p in players}

    print(f"Procesando {len(games)} partidas en orden cronológico...")

    for idx, game in enumerate(games, 1):
        for pr in game.player_results:
            current_elo.setdefault(pr.player_id, DEFAULT_ELO)

        elo_snapshot = {
            pr.player_id: current_elo[pr.player_id]
            for pr in game.player_results
        }

        changes = calculate_elo_changes(game, elo_snapshot)

        elo_repository.save_elo_changes(
            game_id=game.id,
            recorded_at=game.date,
            changes=changes,
        )

        for c in changes:
            current_elo[c.player_id] = c.elo_after

        print(f"  [{idx}/{len(games)}] {game.date} {game.id[:8]}... ok")

    players_repository.bulk_update_elo(current_elo)

    print("\nELO final por jugador:")
    name_by_id = {p.player_id: p.name for p in players}
    for player_id, elo in sorted(
        current_elo.items(), key=lambda kv: -kv[1]
    ):
        name = name_by_id.get(player_id, player_id)
        print(f"  {name:<20} {elo}")

    print("\nDone.")
    return 0


if __name__ == "__main__":
    sys.exit(seed_elo())
