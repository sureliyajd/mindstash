"""add deleted_at to users

Revision ID: j0k1l2m3n4o5
Revises: i9j0k1l2m3n4
Create Date: 2026-03-11 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers
revision = 'j0k1l2m3n4o5'
down_revision = 'i9j0k1l2m3n4'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('users', sa.Column('deleted_at', sa.DateTime(), nullable=True))


def downgrade():
    op.drop_column('users', 'deleted_at')
