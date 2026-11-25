"""Color de cubo por partida (D-88)

`player_results.color`: el color que el jugador usó en esa partida (uno de los cinco del juego),
para que el registro coincida con el tablero. NULL en las partidas existentes: se usa el del jugador.

Revision ID: c5d6e7f8a9b0
Revises: b4c5d6e7f8a9
Create Date: 2026-11-25 18:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = 'c5d6e7f8a9b0'
down_revision: Union[str, Sequence[str], None] = 'b4c5d6e7f8a9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_COLORS = ("negro", "verde", "azul", "rojo", "amarillo")  # congelado: GAME_COLORS al crear la migración


def upgrade() -> None:
    op.add_column("player_results", sa.Column("color", sa.String(), nullable=True))
    op.create_check_constraint("ck_player_results_color", "player_results",
                               f"color IS NULL OR color IN ({', '.join(repr(c) for c in _COLORS)})")


def downgrade() -> None:
    op.drop_constraint("ck_player_results_color", "player_results", type_="check")
    op.drop_column("player_results", "color")
