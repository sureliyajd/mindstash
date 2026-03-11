"""drop deleted_at from users

Revision ID: k1l2m3n4o5p6
Revises: j0k1l2m3n4o5
Create Date: 2026-03-11 00:01:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers
revision = 'k1l2m3n4o5p6'
down_revision = '90079cb558db'
branch_labels = None
depends_on = None


def upgrade():
    op.drop_column('users', 'deleted_at')


def downgrade():
    op.add_column('users', sa.Column('deleted_at', sa.DateTime(), nullable=True))
