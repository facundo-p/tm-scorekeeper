"""Color del cubo de cada jugador (F24, STAT-08)

`players.color` entre 10 colores, único entre los activos (índice parcial). Backfill
determinístico: los jugadores se recorren por fecha de su primera partida (los que nunca
jugaron, al final) y luego por id; cada activo toma el primer color libre del catálogo y
cada inactivo el color de su posición (pueden repetirse entre inactivos). Con más de 10
activos la migración aborta.

Revision ID: f2a3b4c5d6e7
Revises: e1f2a3b4c5d6
Create Date: 2026-10-04 00:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = 'f2a3b4c5d6e7'
down_revision: Union[str, Sequence[str], None] = 'e1f2a3b4c5d6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# Copia fija del catálogo (models/player_colors.py) para que la migración no cambie si el catálogo cambia.
COLORS = ("rojo", "verde", "azul", "amarillo", "negro", "naranja", "violeta", "rosa", "blanco", "gris")

_ORDERED_PLAYERS = sa.text("""
    SELECT p.id, p.is_active FROM players p
    LEFT JOIN (SELECT pr.player_id, MIN(g.date) AS first FROM player_results pr
               JOIN games g ON g.id = pr.game_id GROUP BY pr.player_id) f ON f.player_id = p.id
    ORDER BY f.first NULLS LAST, p.id
""")


def _assign(rows) -> dict[str, str]:
    colors, used = {}, set()
    for i, (player_id, is_active) in enumerate(rows):
        if not is_active:
            colors[player_id] = COLORS[i % len(COLORS)]
            continue
        free = [c for c in COLORS if c not in used]
        if not free:
            raise RuntimeError("Más de 10 jugadores activos: no alcanzan los colores (STAT-08)")
        colors[player_id] = free[0]
        used.add(free[0])
    return colors


def upgrade() -> None:
    op.add_column("players", sa.Column("color", sa.String(), nullable=True))
    conn = op.get_bind()
    for player_id, color in _assign(conn.execute(_ORDERED_PLAYERS).fetchall()).items():
        conn.execute(sa.text("UPDATE players SET color = :c WHERE id = :id"), {"c": color, "id": player_id})
    op.alter_column("players", "color", nullable=False)
    op.create_check_constraint("ck_players_color", "players", f"color IN ({', '.join(repr(c) for c in COLORS)})")
    op.create_index("uq_players_active_color", "players", ["color"], unique=True, postgresql_where=sa.text("is_active"))


def downgrade() -> None:
    op.drop_index("uq_players_active_color", table_name="players")
    op.drop_constraint("ck_players_color", "players", type_="check")
    op.drop_column("players", "color")
