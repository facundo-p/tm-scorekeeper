"""Hito de Vastitas Borealis: Spacecrafter → Spacefarer (F21, TXN-04, D-31)

Revision ID: d0e1f2a3b4c5
Revises: c9d0e1f2a3b4
Create Date: 2026-10-03 00:00:00.000000

"""
from typing import Sequence, Union

from db.migrations.helpers import rename_enum_value

revision: str = 'd0e1f2a3b4c5'
down_revision: Union[str, Sequence[str], None] = 'c9d0e1f2a3b4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    rename_enum_value("milestone", "SPACECRAFTER", "SPACEFARER")


def downgrade() -> None:
    rename_enum_value("milestone", "SPACEFARER", "SPACECRAFTER")
