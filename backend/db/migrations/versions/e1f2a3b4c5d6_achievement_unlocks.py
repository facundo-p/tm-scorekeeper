"""Logros derivados: achievement_unlocks y app_meta (F23, STAT-04, STAT-05, D-04, D-13)

Los logros pasan a derivarse del historial: `player_achievements` (un nivel por logro, que
nunca bajaba) se reemplaza por `achievement_unlocks` (un renglón por nivel, con la partida
que lo alcanzó). Los datos son derivados: al arrancar, `derived_version` vacía dispara el
recálculo (D-13), así que la migración no copia nada. La bajada conserva solo el nivel
máximo de cada logro y usa como `unlocked_at` la fecha de la partida que lo dio.

Revision ID: e1f2a3b4c5d6
Revises: d0e1f2a3b4c5
Create Date: 2026-10-04 00:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = 'e1f2a3b4c5d6'
down_revision: Union[str, Sequence[str], None] = 'd0e1f2a3b4c5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "achievement_unlocks",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("player_id", sa.String(), sa.ForeignKey("players.id", ondelete="CASCADE"), nullable=False),
        sa.Column("code", sa.String(), nullable=False),
        sa.Column("tier", sa.Integer(), nullable=False),
        sa.Column("game_id", sa.String(), sa.ForeignKey("games.id", ondelete="CASCADE"), nullable=False),
        sa.Column("unlocked_on", sa.Date(), nullable=False),
        sa.UniqueConstraint("player_id", "code", "tier", name="uq_achievement_unlock"),
    )
    op.create_index("ix_achievement_unlocks_game_id", "achievement_unlocks", ["game_id"])
    op.create_table(
        "app_meta",
        sa.Column("key", sa.String(), primary_key=True),
        sa.Column("value", sa.String(), nullable=False),
    )
    op.drop_table("player_achievements")


def downgrade() -> None:
    op.create_table(
        "player_achievements",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("player_id", sa.String(), sa.ForeignKey("players.id", ondelete="CASCADE"), nullable=False),
        sa.Column("code", sa.String(), nullable=False),
        sa.Column("tier", sa.Integer(), nullable=False),
        sa.Column("unlocked_at", sa.Date(), nullable=False),
        sa.UniqueConstraint("player_id", "code", name="uq_player_achievement"),
    )
    op.execute(
        "INSERT INTO player_achievements (player_id, code, tier, unlocked_at) "
        "SELECT DISTINCT ON (player_id, code) player_id, code, tier, unlocked_on "
        "FROM achievement_unlocks ORDER BY player_id, code, tier DESC"
    )
    op.drop_table("app_meta")
    op.drop_index("ix_achievement_unlocks_game_id", table_name="achievement_unlocks")
    op.drop_table("achievement_unlocks")
