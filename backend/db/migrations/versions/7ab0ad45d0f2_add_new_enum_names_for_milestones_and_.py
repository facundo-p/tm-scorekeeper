"""add new enum names for milestones and awards

Revision ID: 7ab0ad45d0f2
Revises: a9ed5386f94f
Create Date: 2026-03-02 14:34:14.355081

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

from db.migrations.helpers import add_enum_value


# revision identifiers, used by Alembic.
revision: str = '7ab0ad45d0f2'
down_revision: Union[str, Sequence[str], None] = 'a9ed5386f94f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:

    # Vastias Borealis
    add_enum_value("milestone", "AGRONOMIST")
    add_enum_value("milestone", "ENGINEER")
    add_enum_value("milestone", "SPACECRAFTER")
    add_enum_value("milestone", "GEOLOGIST")
    add_enum_value("milestone", "FARMER")
    # Amazonis Planitia
    add_enum_value("milestone", "TERRAN")
    add_enum_value("milestone", "LANDSHAPER")
    add_enum_value("milestone", "MERCHANT")
    add_enum_value("milestone", "SPONSOR")
    add_enum_value("milestone", "LOBBYIST")

    # Vastias Borealis
    add_enum_value("award", "TRAVELLER")
    add_enum_value("award", "LANDSCAPER")
    add_enum_value("award", "HIGHLANDER")
    add_enum_value("award", "PROMOTER")
    add_enum_value("award", "BLACKSMITH")
    # Amazonis Planitia
    add_enum_value("award", "COLLECTOR")
    add_enum_value("award", "INNOVATOR")
    add_enum_value("award", "CONSTRUCTOR")
    add_enum_value("award", "MANUFACTURER")
    add_enum_value("award", "PHYSICIST")



def downgrade() -> None:
    """Downgrade schema."""
    pass
