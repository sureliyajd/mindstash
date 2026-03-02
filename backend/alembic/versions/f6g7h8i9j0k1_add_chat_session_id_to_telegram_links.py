"""Add chat_session_id to telegram_links

Revision ID: f6g7h8i9j0k1
Revises: e5f6g7h8i9j0
Create Date: 2026-03-03 15:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from alembic import op


# revision identifiers, used by Alembic.
revision: str = "f6g7h8i9j0k1"
down_revision: Union[str, None] = "e5f6g7h8i9j0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "telegram_links",
        sa.Column(
            "chat_session_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("chat_sessions.id", ondelete="SET NULL"),
            nullable=True,
        ),
    )
    op.create_index(
        "ix_telegram_links_chat_session_id",
        "telegram_links",
        ["chat_session_id"],
    )


def downgrade() -> None:
    op.drop_index("ix_telegram_links_chat_session_id")
    op.drop_column("telegram_links", "chat_session_id")
