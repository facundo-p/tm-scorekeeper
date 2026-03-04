"""update  enum names for Tharsis  awards

Revision ID: 0ff39863f305
Revises: 7ab0ad45d0f2
Create Date: 2026-03-03 02:08:51.370995

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from db.migrations.helpers import rename_enum_value


# revision identifiers, used by Alembic.
revision: str = '0ff39863f305'
down_revision: Union[str, Sequence[str], None] = '7ab0ad45d0f2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade():
    # Tharsis
    rename_enum_value("award", "TERRAFORMER", "LANDLORD")
    rename_enum_value("award", "MAYOR", "BANKER")
    rename_enum_value("award", "GARDENER", "SCIENTIST")
    rename_enum_value("award", "BUILDER", "THERMALIST")
    rename_enum_value("award", "PLANNER", "MINER")


def downgrade():
    # Tharsis
    rename_enum_value("award", "LANDLORD", "TERRAFORMER")
    rename_enum_value("award", "BANKER", "MAYOR")
    rename_enum_value("award", "SCIENTIST", "GARDENER")
    rename_enum_value("award", "THERMALIST", "BUILDER")
    rename_enum_value("award", "MINER", "PLANNER")
