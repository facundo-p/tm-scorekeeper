"""UNIQUE(game_id, player_id) en player_results (F20, SEC-03)

Aborta si la base ya tiene un jugador repetido en una partida: hay que corregir esos
datos a mano antes de migrar (la restricción no se puede crear con duplicados).

Revision ID: f6a7b8c9d0e1
Revises: e5f6a7b8c9d0
Create Date: 2026-10-03 00:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = 'f6a7b8c9d0e1'
down_revision: Union[str, Sequence[str], None] = 'e5f6a7b8c9d0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

CONSTRAINT = "uq_player_result_game_player"

DUPLICATES = sa.text(
    "SELECT game_id, player_id, count(*) AS n FROM player_results "
    "GROUP BY game_id, player_id HAVING count(*) > 1 ORDER BY game_id, player_id LIMIT 10"
)


def upgrade() -> None:
    duplicates = op.get_bind().execute(DUPLICATES).fetchall()
    if duplicates:
        listed = ", ".join(f"{row.game_id}/{row.player_id} ×{row.n}" for row in duplicates)
        raise RuntimeError(f"player_results tiene jugadores repetidos en una partida: {listed}. "
                           "Corregilos antes de migrar.")
    op.create_unique_constraint(CONSTRAINT, "player_results", ["game_id", "player_id"])


def downgrade() -> None:
    op.drop_constraint(CONSTRAINT, "player_results", type_="unique")
