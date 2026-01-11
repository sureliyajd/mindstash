"""Add notification and completion tracking fields

Revision ID: 6de7fae67bb3
Revises: a3f2d9e81c45
Create Date: 2026-01-11 18:09:46.215440

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '6de7fae67bb3'
down_revision: Union[str, None] = 'a3f2d9e81c45'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add nullable columns first
    op.add_column('items', sa.Column('notification_date', sa.DateTime(), nullable=True))
    op.add_column('items', sa.Column('notification_frequency', sa.String(), nullable=True))
    op.add_column('items', sa.Column('next_notification_at', sa.DateTime(), nullable=True))
    op.add_column('items', sa.Column('last_notified_at', sa.DateTime(), nullable=True))
    op.add_column('items', sa.Column('completed_at', sa.DateTime(), nullable=True))

    # Add boolean columns with server_default to handle existing rows
    op.add_column('items', sa.Column('notification_enabled', sa.Boolean(), server_default='true', nullable=False))
    op.add_column('items', sa.Column('is_completed', sa.Boolean(), server_default='false', nullable=False))

    # Create indexes
    op.create_index(op.f('ix_items_is_completed'), 'items', ['is_completed'], unique=False)
    op.create_index(op.f('ix_items_next_notification_at'), 'items', ['next_notification_at'], unique=False)
    op.create_index(op.f('ix_items_notification_date'), 'items', ['notification_date'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_items_notification_date'), table_name='items')
    op.drop_index(op.f('ix_items_next_notification_at'), table_name='items')
    op.drop_index(op.f('ix_items_is_completed'), table_name='items')
    op.drop_column('items', 'completed_at')
    op.drop_column('items', 'is_completed')
    op.drop_column('items', 'notification_enabled')
    op.drop_column('items', 'last_notified_at')
    op.drop_column('items', 'next_notification_at')
    op.drop_column('items', 'notification_frequency')
    op.drop_column('items', 'notification_date')
