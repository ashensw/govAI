import json

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.api.deps import client_ip, get_current_user
from app.database import SessionLocal, get_db
from app.models import ChatMessage, ChatSession, MessageRole, User
from app.rag.llm.factory import get_llm_provider
from app.rag.pipeline import retrieve_citations, stream_answer
from app.schemas import ChatMessageCreate, ChatMessageOut, ChatSessionCreate, ChatSessionOut
from app.services.audit import log_action

router = APIRouter(prefix="/chat", tags=["chat"])

HISTORY_TURNS = 10  # most recent messages (user+assistant) carried into the prompt


def _get_owned_session(db: Session, session_id: str, user: User) -> ChatSession:
    session = db.get(ChatSession, session_id)
    if session is None or session.user_id != user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Chat session not found")
    return session


@router.post("/sessions", response_model=ChatSessionOut, status_code=status.HTTP_201_CREATED)
def create_session(
    payload: ChatSessionCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    session = ChatSession(user_id=user.id, title=payload.title or "New chat")
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


@router.get("/sessions", response_model=list[ChatSessionOut])
def list_sessions(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return (
        db.query(ChatSession)
        .filter(ChatSession.user_id == user.id)
        .order_by(ChatSession.updated_at.desc())
        .all()
    )


@router.get("/sessions/{session_id}/messages", response_model=list[ChatMessageOut])
def list_messages(session_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    session = _get_owned_session(db, session_id, user)
    return session.messages


@router.delete("/sessions/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_session(session_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    session = _get_owned_session(db, session_id, user)
    db.delete(session)
    db.commit()


@router.post("/sessions/{session_id}/messages")
def send_message(
    session_id: str,
    payload: ChatMessageCreate,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    session = _get_owned_session(db, session_id, user)

    history = [
        {"role": m.role.value, "content": m.content}
        for m in session.messages[-HISTORY_TURNS:]
    ]

    user_message = ChatMessage(session_id=session.id, role=MessageRole.user, content=payload.content)
    db.add(user_message)
    if session.title == "New chat":
        session.title = payload.content.strip()[:60] or "New chat"
    db.commit()

    citations = retrieve_citations(user, payload.content)
    llm = get_llm_provider()
    ip_address = client_ip(request)
    user_id, question = user.id, payload.content

    async def event_stream():
        full_text = ""
        try:
            async for token in stream_answer(llm, citations=citations, history=history, question=question):
                full_text += token
                yield f"event: token\ndata: {json.dumps({'text': token})}\n\n"

            yield f"event: citations\ndata: {json.dumps({'citations': citations})}\n\n"

            persist_db = SessionLocal()
            try:
                assistant_message = ChatMessage(
                    session_id=session_id,
                    role=MessageRole.assistant,
                    content=full_text,
                    citations=citations,
                )
                persist_db.add(assistant_message)
                log_action(
                    persist_db,
                    user=persist_db.get(User, user_id),
                    action="chat_query",
                    resource_type="chat_session",
                    resource_id=session_id,
                    ip_address=ip_address,
                    extra={
                        "question": question,
                        "cited_document_ids": [c["document_id"] for c in citations],
                    },
                )  # log_action() commits the session, persisting assistant_message too
            finally:
                persist_db.close()

            yield "event: done\ndata: {}\n\n"
        except Exception as exc:  # noqa: BLE001 - report failure to the client stream rather than a bare 500
            yield f"event: error\ndata: {json.dumps({'message': str(exc)})}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")
