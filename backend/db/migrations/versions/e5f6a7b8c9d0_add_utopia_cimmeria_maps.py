"""add Utopia Planitia and Terra Cimmeria maps with their milestones and awards

Revision ID: e5f6a7b8c9d0
Revises: c1d2e3f4a5b6
Create Date: 2026-08-22 00:00:00.000000

"""
from typing import Sequence, Union

from db.migrations.helpers import add_enum_value


# revision identifiers, used by Alembic.
revision: str = 'e5f6a7b8c9d0'
down_revision: Union[str, Sequence[str], None] = 'c1d2e3f4a5b6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


UTOPIA_MILESTONES = ("MANAGER", "PIONEER", "TRADER", "METALLURGIST", "RESEARCHER")
CIMMERIA_MILESTONES = ("PLANETOLOGIST", "ARCHITECT", "COASTGUARD", "FORESTER", "FUNDRAISER")

UTOPIA_AWARDS = ("SUBURBIAN", "INVESTOR", "BOTANIST", "INCORPORATOR", "METROPOLIST")
CIMMERIA_AWARDS = ("ELECTRICIAN", "FOUNDER", "MOGUL", "ZOOLOGIST", "FORECASTER")


def upgrade() -> None:
    add_enum_value("mapname", "UTOPIA")
    add_enum_value("mapname", "CIMMERIA")

    for milestone in UTOPIA_MILESTONES + CIMMERIA_MILESTONES:
        add_enum_value("milestone", milestone)

    for award in UTOPIA_AWARDS + CIMMERIA_AWARDS:
        add_enum_value("award", award)


def downgrade() -> None:
    # PostgreSQL does not support removing enum values.
    pass
