"""add player achievements

Revision ID: f3a9b2c1d4e5
Revises: 85250527884f
Create Date: 2026-03-31

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'f3a9b2c1d4e5'
down_revision: Union[str, Sequence[str], None] = '85250527884f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "player_achievements",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("player_id", sa.String(), nullable=False),
        sa.Column("code", sa.String(), nullable=False),
        sa.Column("tier", sa.Integer(), nullable=False),
        sa.Column("unlocked_at", sa.Date(), nullable=False),
        sa.ForeignKeyConstraint(["player_id"], ["players.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("player_id", "code", name="uq_player_achievement"),
    )


def downgrade() -> None:
    op.drop_table("player_achievements")
