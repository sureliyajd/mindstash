"""add email preferences to users

Revision ID: a1b2c3d4e5f6
Revises: c2fa447829f7
Create Date: 2026-03-09 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'a1b2c3d4e5f6'
down_revision = 'c2fa447829f7'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('users', sa.Column('daily_briefing_enabled', sa.Boolean(), nullable=False, server_default='true'))
    op.add_column('users', sa.Column('weekly_digest_enabled', sa.Boolean(), nullable=False, server_default='true'))
    op.add_column('users', sa.Column('item_reminders_enabled', sa.Boolean(), nullable=False, server_default='true'))


def downgrade() -> None:
    op.drop_column('users', 'item_reminders_enabled')
    op.drop_column('users', 'weekly_digest_enabled')
    op.drop_column('users', 'daily_briefing_enabled')
