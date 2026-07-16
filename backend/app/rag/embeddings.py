"""Local embedding model wrapper.

Uses intfloat/multilingual-e5-* (E5 family), which covers ~100 languages
including Sinhala and Tamil, and — critically for a data-sovereignty
pitch — runs entirely on infrastructure the government controls. No text
ever leaves the deployment to compute an embedding.

E5 models expect a "query: " / "passage: " instruction prefix on the input
text; omitting it measurably hurts retrieval quality, so it is applied here
rather than left to callers.
"""

from functools import lru_cache

from sentence_transformers import SentenceTransformer

from app.config import get_settings

settings = get_settings()


@lru_cache
def _model() -> SentenceTransformer:
    return SentenceTransformer(settings.embedding_model)


def embed_passages(texts: list[str]) -> list[list[float]]:
    prefixed = [f"passage: {t}" for t in texts]
    vectors = _model().encode(prefixed, normalize_embeddings=True, show_progress_bar=False)
    return vectors.tolist()


def embed_query(text: str) -> list[float]:
    vector = _model().encode(f"query: {text}", normalize_embeddings=True, show_progress_bar=False)
    return vector.tolist()


def warm_up() -> None:
    """Force the model to load at process startup instead of on first request."""
    _model()
