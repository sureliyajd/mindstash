"""Add last_surfaced_at for smart resurfacing

Revision ID: a3f2d9e81c45
Revises: c9d8f48eedbc
Create Date: 2026-01-10 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a3f2d9e81c45'
down_revision: Union[str, None] = 'c9d8f48eedbc'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add last_surfaced_at column for tracking when items were shown in "Today" module
    op.add_column('items', sa.Column('last_surfaced_at', sa.DateTime(), nullable=True))
    # Add index for efficient querying of resurfacing logic
    op.create_index(op.f('ix_items_last_surfaced_at'), 'items', ['last_surfaced_at'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_items_last_surfaced_at'), table_name='items')
    op.drop_column('items', 'last_surfaced_at')
