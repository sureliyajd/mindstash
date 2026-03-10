"""seed admin user

Revision ID: h8i9j0k1l2m3
Revises: g7h8i9j0k1l2
Create Date: 2026-03-10 10:01:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'h8i9j0k1l2m3'
down_revision = 'g7h8i9j0k1l2'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        "UPDATE users SET is_admin = true WHERE email = 'jaydeepsureliya.jd@gmail.com'"
    )


def downgrade() -> None:
    op.execute(
        "UPDATE users SET is_admin = false WHERE email = 'jaydeepsureliya.jd@gmail.com'"
    )
