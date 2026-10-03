"""games.created_at para el orden canónico (fecha, created_at, id) (F21, TXN-02, D-56)

El backfill respeta el orden anterior (fecha, id): dentro de cada fecha, created_at sube
de a un segundo siguiendo el id. Las partidas nuevas toman now().

Revision ID: a7b8c9d0e1f2
Revises: f6a7b8c9d0e1
Create Date: 2026-10-03 00:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = 'a7b8c9d0e1f2'
down_revision: Union[str, Sequence[str], None] = 'f6a7b8c9d0e1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

BACKFILL = sa.text("""
    UPDATE games SET created_at = ordered.ts
    FROM (
        SELECT id,
               (date::timestamp AT TIME ZONE 'UTC')
                 + make_interval(secs => row_number() OVER (PARTITION BY date ORDER BY id)) AS ts
        FROM games
    ) AS ordered
    WHERE games.id = ordered.id
""")


def upgrade() -> None:
    op.add_column("games", sa.Column("created_at", sa.DateTime(timezone=True), nullable=True))
    op.execute(BACKFILL)
    op.alter_column("games", "created_at", nullable=False, server_default=sa.func.now())


def downgrade() -> None:
    op.drop_column("games", "created_at")
