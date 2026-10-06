"""Índices de claves foráneas y de fecha del historial (F21, TXN-03)

Revision ID: c9d0e1f2a3b4
Revises: b8c9d0e1f2a3
Create Date: 2026-10-03 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op

revision: str = 'c9d0e1f2a3b4'
down_revision: Union[str, Sequence[str], None] = 'b8c9d0e1f2a3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

INDEXES = (
    ("ix_player_results_game_id", "player_results", "game_id"),
    ("ix_player_results_player_id", "player_results", "player_id"),
    ("ix_awards_game_id", "awards", "game_id"),
    ("ix_player_elo_history_recorded_at", "player_elo_history", "recorded_at"),
)


def upgrade() -> None:
    for name, table, column in INDEXES:
        op.create_index(name, table, [column], if_not_exists=True)


def downgrade() -> None:
    for name, table, _ in reversed(INDEXES):
        op.drop_index(name, table_name=table, if_exists=True)
