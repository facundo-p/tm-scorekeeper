"""fix award tharsis enums and add venus next entries

Revision ID: c1d2e3f4a5b6
Revises: b8d4e2c5a7f1
Create Date: 2026-05-01 00:00:00.000000

"""
from typing import Sequence, Union

from db.migrations.helpers import rename_enum_value, add_enum_value


# revision identifiers, used by Alembic.
revision: str = 'c1d2e3f4a5b6'
down_revision: Union[str, Sequence[str], None] = 'b8d4e2c5a7f1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Rename Tharsis Award labels from English keys to Spanish keys
    rename_enum_value("award", "LANDLORD", "TERRATENIENTE")
    rename_enum_value("award", "BANKER", "BANQUERO")
    rename_enum_value("award", "SCIENTIST", "CIENTIFICO")
    rename_enum_value("award", "THERMALIST", "TERMALISTA")
    rename_enum_value("award", "MINER", "MINERO")

    # Add Venus Next award and milestone
    add_enum_value("award", "VENUPHILE")
    add_enum_value("milestone", "HOVERLORD")


def downgrade() -> None:
    # Note: PostgreSQL does not support removing enum values.
    # Reverse renaming is possible.
    rename_enum_value("award", "TERRATENIENTE", "LANDLORD")
    rename_enum_value("award", "BANQUERO", "BANKER")
    rename_enum_value("award", "CIENTIFICO", "SCIENTIST")
    rename_enum_value("award", "TERMALISTA", "THERMALIST")
    rename_enum_value("award", "MINERO", "MINER")
    # VENUPHILE and HOVERLORD cannot be removed from the enum in PostgreSQL
