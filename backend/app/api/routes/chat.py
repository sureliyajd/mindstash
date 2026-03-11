"""
Chat routes for MindStash AI agent

Endpoints:
- POST / - Send a message and get SSE-streamed response
- GET /sessions - List user's chat sessions
- GET /sessions/{session_id}/messages - Get messages for a session
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from uuid import UUID

from app.core.database import get_db
from app.core.rate_limit import user_limiter
from app.api.dependencies import get_current_user
from app.models.user import User
from app.models.chat import ChatSession, ChatMessage
from app.schemas.chat import (
    ChatRequest,
    ChatSessionResponse,
    ChatSessionListResponse,
    ChatMessageResponse,
    ConfirmationRequest,
    PendingConfirmationResponse,
)
from app.models.chat import PendingConfirmation
from app.services.ai.agent import run_agent, run_confirmation
from app.services.activity import log_activity
from app.services.plan import check_chat_limit, increment_chat_count

router = APIRouter(tags=["chat"])


@router.post("/")
@user_limiter.limit("20/hour")
def chat_message(
    request: Request,
    chat_request: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Send a message to the AI agent and receive SSE-streamed response.

    Rate Limit: 20 messages per hour per user

    SSE events:
    - session_id: The chat session ID
    - text_delta: Streamed text from the assistant
    - tool_start: Tool execution started
    - tool_result: Tool execution result
    - error: Error occurred
    - done: Stream complete
    """
    request.state.user = current_user

    # Check chat message plan limit before processing
    check_chat_limit(current_user, db)

    # Increment chat message count (fire-and-forget, before streaming)
    increment_chat_count(current_user, db)

    log_activity(db, current_user.id, "chat_message", source="web",
                 resource_type="chat_session",
                 details={"message_preview": chat_request.message[:80]})

    return StreamingResponse(
        run_agent(
            message=chat_request.message,
            session_id=chat_request.session_id,
            db=db,
            user_id=current_user.id,
        ),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.get("/sessions", response_model=ChatSessionListResponse)
@user_limiter.limit("100/hour")
def list_sessions(
    request: Request,
    limit: int = Query(20, ge=1, le=50),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    List the current user's chat sessions, ordered by most recently active.

    Rate Limit: 100 requests per hour per user
    """
    request.state.user = current_user

    query = (
        db.query(ChatSession)
        .filter(ChatSession.user_id == current_user.id)
        .order_by(ChatSession.last_active_at.desc())
    )

    total = query.count()
    sessions = query.offset(offset).limit(limit).all()

    session_responses = []
    for s in sessions:
        msg_count = (
            db.query(func.count(ChatMessage.id))
            .filter(ChatMessage.session_id == s.id)
            .scalar()
        )
        session_responses.append(
            ChatSessionResponse(
                id=str(s.id),
                title=s.title,
                agent_type=s.agent_type,
                is_active=s.is_active,
                created_at=s.created_at,
                last_active_at=s.last_active_at,
                message_count=msg_count or 0,
            )
        )

    return ChatSessionListResponse(sessions=session_responses, total=total)


@router.get("/sessions/{session_id}/messages", response_model=list[ChatMessageResponse])
@user_limiter.limit("100/hour")
def get_session_messages(
    request: Request,
    session_id: UUID,
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get messages for a specific chat session.

    Rate Limit: 100 requests per hour per user
    """
    request.state.user = current_user

    # Verify session belongs to user
    session = (
        db.query(ChatSession)
        .filter(
            ChatSession.id == session_id,
            ChatSession.user_id == current_user.id,
        )
        .first()
    )
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found",
        )

    messages = (
        db.query(ChatMessage)
        .filter(ChatMessage.session_id == session_id)
        .order_by(ChatMessage.created_at.asc())
        .limit(limit)
        .all()
    )

    return [
        ChatMessageResponse(
            id=str(m.id),
            role=m.role,
            content=m.content,
            tool_calls=m.tool_calls,
            created_at=m.created_at,
        )
        for m in messages
    ]


@router.post("/confirm")
def confirm_action(
    request: Request,
    body: ConfirmationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Confirm or deny a pending HITL action. Returns SSE-streamed response.
    """
    request.state.user = current_user

    return StreamingResponse(
        run_confirmation(
            confirmation_id=body.confirmation_id,
            confirmed=body.confirmed,
            db=db,
            user_id=current_user.id,
        ),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.get(
    "/sessions/{session_id}/pending-confirmation",
    response_model=PendingConfirmationResponse,
)
@user_limiter.limit("100/hour")
def get_pending_confirmation(
    request: Request,
    session_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Check if a session has a pending confirmation (for session restore).
    Auto-expires confirmations past their expires_at.
    """
    request.state.user = current_user
    from datetime import datetime

    pending = (
        db.query(PendingConfirmation)
        .filter(
            PendingConfirmation.session_id == session_id,
            PendingConfirmation.user_id == current_user.id,
            PendingConfirmation.status == "pending",
        )
        .first()
    )

    if not pending:
        return PendingConfirmationResponse(has_pending=False)

    # Check expiry
    if pending.expires_at and pending.expires_at < datetime.utcnow():
        pending.status = "expired"
        pending.resolved_at = datetime.utcnow()
        db.commit()
        return PendingConfirmationResponse(has_pending=False)

    return PendingConfirmationResponse(
        has_pending=True,
        confirmation_id=str(pending.id),
        tool=pending.tool_name,
        tool_input=pending.tool_input,
        description=pending.description,
    )
