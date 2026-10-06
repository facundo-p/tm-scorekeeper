"""add venus next milestone and award entries

Revision ID: c1d2e3f4a5b6
Revises: b8d4e2c5a7f1
Create Date: 2026-05-01 00:00:00.000000

"""
from typing import Sequence, Union

from db.migrations.helpers import add_enum_value


# revision identifiers, used by Alembic.
revision: str = 'c1d2e3f4a5b6'
down_revision: Union[str, Sequence[str], None] = 'b8d4e2c5a7f1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    add_enum_value("award", "VENUPHILE")
    add_enum_value("milestone", "HOVERLORD")


def downgrade() -> None:
    # PostgreSQL does not support removing enum values.
    pass
