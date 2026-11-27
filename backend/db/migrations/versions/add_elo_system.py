"""add elo system

Revision ID: b8d4e2c5a7f1
Revises: f3a9b2c1d4e5
Create Date: 2026-04-23

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = 'b8d4e2c5a7f1'
down_revision: Union[str, Sequence[str], None] = 'f3a9b2c1d4e5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "players",
        sa.Column("elo", sa.Integer(), nullable=False, server_default="1000"),
    )

    op.create_table(
        "player_elo_history",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("player_id", sa.String(), nullable=False),
        sa.Column("game_id", sa.String(), nullable=False),
        sa.Column("elo_before", sa.Integer(), nullable=False),
        sa.Column("elo_after", sa.Integer(), nullable=False),
        sa.Column("delta", sa.Integer(), nullable=False),
        sa.Column("recorded_at", sa.Date(), nullable=False),
        sa.ForeignKeyConstraint(["player_id"], ["players.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["game_id"], ["games.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_player_elo_history_player_id",
        "player_elo_history",
        ["player_id"],
    )
    op.create_index(
        "ix_player_elo_history_game_id",
        "player_elo_history",
        ["game_id"],
    )


def downgrade() -> None:
    op.drop_index("ix_player_elo_history_game_id", table_name="player_elo_history")
    op.drop_index("ix_player_elo_history_player_id", table_name="player_elo_history")
    op.drop_table("player_elo_history")
    op.drop_column("players", "elo")
