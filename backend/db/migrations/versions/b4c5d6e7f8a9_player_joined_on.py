"""Fecha de alta de los jugadores (F32, D-78)

`players.joined_on`: el «desde» del plantel es el alta, no la primera partida (como `since` en
PLAYERS_SEED del mockup). Las altas nuevas toman la fecha del día; las existentes, la de su
primera partida (lo que la API mostraba hasta ahora); los que nunca jugaron quedan en NULL.

Revision ID: b4c5d6e7f8a9
Revises: a3b4c5d6e7f8
Create Date: 2026-10-04 05:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = 'b4c5d6e7f8a9'
down_revision: Union[str, Sequence[str], None] = 'a3b4c5d6e7f8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_BACKFILL = sa.text("""
    UPDATE players p SET joined_on = f.first FROM (
        SELECT pr.player_id, MIN(g.date) AS first FROM player_results pr
        JOIN games g ON g.id = pr.game_id GROUP BY pr.player_id
    ) f WHERE f.player_id = p.id
""")


def upgrade() -> None:
    op.add_column("players", sa.Column("joined_on", sa.Date(), nullable=True))
    op.execute(_BACKFILL)
    op.alter_column("players", "joined_on", server_default=sa.text("CURRENT_DATE"))


def downgrade() -> None:
    op.drop_column("players", "joined_on")
