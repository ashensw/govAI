"""Qdrant wrapper: collection management, chunk upsert, and RBAC-filtered
similarity search.

Every point payload carries the same classification/department metadata as
the owning Postgres Document row, so retrieval can be filtered server-side —
a user's chat query never returns chunks from documents they aren't
authorized to read, even if those chunks are the closest vector match.
"""

import uuid
from functools import lru_cache

from qdrant_client import QdrantClient
from qdrant_client.http import models as qm

from app.config import get_settings
from app.models import Classification, Role, User
from app.rag.embeddings import embed_passages

settings = get_settings()


@lru_cache
def get_client() -> QdrantClient:
    return QdrantClient(url=settings.qdrant_url)


def ensure_collection() -> None:
    client = get_client()
    existing = [c.name for c in client.get_collections().collections]
    if settings.qdrant_collection in existing:
        return
    client.create_collection(
        collection_name=settings.qdrant_collection,
        vectors_config=qm.VectorParams(size=settings.embedding_dim, distance=qm.Distance.COSINE),
    )


def delete_document_chunks(document_id: str) -> None:
    get_client().delete(
        collection_name=settings.qdrant_collection,
        points_selector=qm.FilterSelector(
            filter=qm.Filter(must=[qm.FieldCondition(key="document_id", match=qm.MatchValue(value=document_id))])
        ),
    )


def upsert_chunks(
    *,
    document_id: str,
    title: str,
    department_id: str | None,
    classification: Classification,
    language: str | None,
    chunks: list[dict],  # [{"text": str, "page": int | None}]
) -> int:
    if not chunks:
        return 0

    vectors = embed_passages([c["text"] for c in chunks])
    points = [
        qm.PointStruct(
            id=str(uuid.uuid4()),
            vector=vector,
            payload={
                "document_id": document_id,
                "title": title,
                "department_id": department_id,
                "classification": classification.value,
                "language": language,
                "page": chunk.get("page"),
                "text": chunk["text"],
            },
        )
        for vector, chunk in zip(vectors, chunks)
    ]
    get_client().upsert(collection_name=settings.qdrant_collection, points=points)
    return len(points)


def _access_filter(user: User) -> qm.Filter | None:
    if user.role == Role.admin:
        return None

    should = [
        qm.FieldCondition(key="classification", match=qm.MatchValue(value=Classification.public.value))
    ]

    if user.department_id:
        should.append(
            qm.Filter(
                must=[
                    qm.FieldCondition(key="classification", match=qm.MatchValue(value=Classification.restricted.value)),
                    qm.FieldCondition(key="department_id", match=qm.MatchValue(value=user.department_id)),
                ]
            )
        )
        if user.role == Role.officer:
            should.append(
                qm.Filter(
                    must=[
                        qm.FieldCondition(
                            key="classification", match=qm.MatchValue(value=Classification.confidential.value)
                        ),
                        qm.FieldCondition(key="department_id", match=qm.MatchValue(value=user.department_id)),
                    ]
                )
            )

    return qm.Filter(should=should)


def search(*, query_embedding: list[float], user: User, top_k: int) -> list[qm.ScoredPoint]:
    return get_client().query_points(
        collection_name=settings.qdrant_collection,
        query=query_embedding,
        query_filter=_access_filter(user),
        limit=top_k,
        with_payload=True,
    ).points
