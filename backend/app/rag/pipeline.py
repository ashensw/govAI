from collections.abc import AsyncIterator

from app.config import get_settings
from app.models import User
from app.rag.embeddings import embed_query
from app.rag.llm.base import LLMProvider
from app.rag.prompts import build_messages
from app.rag.vectorstore import search

settings = get_settings()


def retrieve_citations(user: User, query: str) -> list[dict]:
    embedding = embed_query(query)
    points = search(query_embedding=embedding, user=user, top_k=settings.retrieval_top_k)
    return [
        {
            "document_id": p.payload["document_id"],
            "title": p.payload["title"],
            "chunk_text": p.payload["text"],
            "page": p.payload.get("page"),
            "score": round(p.score, 4),
        }
        for p in points
    ]


async def stream_answer(
    llm: LLMProvider, *, citations: list[dict], history: list[dict], question: str
) -> AsyncIterator[str]:
    messages = build_messages(citations=citations, history=history, question=question)
    async for token in llm.stream_chat(messages):
        yield token
