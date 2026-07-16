"""Word-boundary chunker with overlap.

Splitting on whitespace-delimited words (rather than a tokenizer) keeps this
dependency-free and works uniformly across English, Sinhala and Tamil, which
all use spaces between words.
"""

from app.config import get_settings

settings = get_settings()


def chunk_page(text: str, page: int | None) -> list[dict]:
    words = text.split()
    if not words:
        return []

    size = settings.chunk_size_words
    overlap = settings.chunk_overlap_words
    step = max(size - overlap, 1)

    chunks = []
    for start in range(0, len(words), step):
        window = words[start : start + size]
        if not window:
            break
        chunks.append({"text": " ".join(window), "page": page})
        if start + size >= len(words):
            break
    return chunks


def chunk_pages(pages: list[tuple[int | None, str]]) -> list[dict]:
    """pages: list of (page_number, page_text). Returns a flat list of chunk dicts."""
    chunks: list[dict] = []
    for page_num, text in pages:
        chunks.extend(chunk_page(text, page_num))
    return chunks
