from app.rag.chunking import chunk_page, chunk_pages


def test_chunk_page_empty_text_returns_no_chunks():
    assert chunk_page("", page=1) == []
    assert chunk_page("   ", page=1) == []


def test_chunk_page_short_text_returns_single_chunk():
    text = "word " * 10
    chunks = chunk_page(text, page=3)
    assert len(chunks) == 1
    assert chunks[0]["page"] == 3
    assert chunks[0]["text"] == " ".join(["word"] * 10)


def test_chunk_page_respects_size_and_overlap():
    words = [f"w{i}" for i in range(500)]
    text = " ".join(words)
    chunks = chunk_page(text, page=None)

    assert len(chunks) > 1
    # every word must be covered by at least one chunk
    covered = set()
    for c in chunks:
        covered.update(c["text"].split())
    assert covered == set(words)


def test_chunk_pages_flattens_across_pages():
    pages = [(1, "alpha beta gamma"), (2, "delta epsilon")]
    chunks = chunk_pages(pages)
    assert [c["page"] for c in chunks] == [1, 2]
