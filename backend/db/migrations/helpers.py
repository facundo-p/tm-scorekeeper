from alembic import op
from sqlalchemy import text


def add_enum_value(enum_type: str, value: str):
    """
    Safely add a value to a PostgreSQL enum type.
    Uses autocommit block to avoid transactional issues.
    """
    if not enum_type.isidentifier():
        raise ValueError("Invalid enum type name")

    if not value.isidentifier():
        raise ValueError("Invalid enum value")

    with op.get_context().autocommit_block():
        op.execute(
            text(f"ALTER TYPE {enum_type} ADD VALUE IF NOT EXISTS '{value}';")
        )