"""update corporation enum

Revision ID: 85250527884f
Revises: 7ab0ad45d0f2
Create Date: 2026-03-05 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

from db.migrations.helpers import add_enum_value


# revision identifiers, used by Alembic.
revision: str = '85250527884f'
down_revision: Union[str, Sequence[str], None] = '0ff39863f305'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Base Game
    add_enum_value("corporation", "UNMI")
    # Prelude
    add_enum_value("corporation", "NIRGAL")
    add_enum_value("corporation", "ECOTEC")
    add_enum_value("corporation", "PALLADIN_SHIPPING")
    add_enum_value("corporation", "SPIRE")
    # Colonies
    add_enum_value("corporation", "ARKLIGHT")
    # Turmoil
    add_enum_value("corporation", "PRISTAR")
    add_enum_value("corporation", "LAKEFRONT_RESORTS")
    add_enum_value("corporation", "TERRALABS")
    # Prelude 2
    add_enum_value("corporation", "NOVEL")
    add_enum_value("corporation", "PHILARES")


def downgrade() -> None:
    pass  # PostgreSQL cannot remove enum values
