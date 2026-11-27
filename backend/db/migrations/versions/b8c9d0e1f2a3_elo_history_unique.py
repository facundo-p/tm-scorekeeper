"""UNIQUE(player_id, game_id) en player_elo_history (F21, TXN-01)

El historial de ELO es derivado: si una carrera dejó filas repetidas, se conserva la de
menor id y se borran las demás antes de crear la restricción (el recálculo siguiente las
regenera igual).

Revision ID: b8c9d0e1f2a3
Revises: a7b8c9d0e1f2
Create Date: 2026-10-03 00:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = 'b8c9d0e1f2a3'
down_revision: Union[str, Sequence[str], None] = 'a7b8c9d0e1f2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

CONSTRAINT = "uq_elo_history_player_game"

DEDUPE = sa.text("""
    DELETE FROM player_elo_history h
    USING player_elo_history keep
    WHERE h.player_id = keep.player_id AND h.game_id = keep.game_id AND h.id > keep.id
""")


def upgrade() -> None:
    op.execute(DEDUPE)
    op.create_unique_constraint(CONSTRAINT, "player_elo_history", ["player_id", "game_id"])


def downgrade() -> None:
    op.drop_constraint(CONSTRAINT, "player_elo_history", type_="unique")
