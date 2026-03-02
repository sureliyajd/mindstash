"""Add telegram_links table

Revision ID: e5f6g7h8i9j0
Revises: d4e5f6a7b8c9
Create Date: 2026-03-03 14:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from alembic import op


# revision identifiers, used by Alembic.
revision: str = "e5f6g7h8i9j0"
down_revision: Union[str, None] = "d4e5f6a7b8c9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "telegram_links",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("telegram_chat_id", sa.BigInteger, unique=True, nullable=True),
        sa.Column("telegram_username", sa.String, nullable=True),
        sa.Column("link_code", sa.String(6), unique=True, nullable=True),
        sa.Column("link_code_expires_at", sa.DateTime, nullable=True),
        sa.Column("is_active", sa.Boolean, server_default="false", nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime,
            server_default=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_index("ix_telegram_links_user_id", "telegram_links", ["user_id"])
    op.create_index("ix_telegram_links_telegram_chat_id", "telegram_links", ["telegram_chat_id"])
    op.create_index("ix_telegram_links_link_code", "telegram_links", ["link_code"])


def downgrade() -> None:
    op.drop_index("ix_telegram_links_link_code")
    op.drop_index("ix_telegram_links_telegram_chat_id")
    op.drop_index("ix_telegram_links_user_id")
    op.drop_table("telegram_links")
