"""Text extraction for the document types the ingestion pipeline accepts:
PDF, DOCX, and plain text/Markdown. PDFs with little or no extractable text
(i.e. scanned pages) fall back to OCR page-by-page.

Returns a list of (page_number, text) tuples — page_number is None for
formats without a native page concept (DOCX, plain text).
"""

from pathlib import Path

from pypdf import PdfReader

from app.rag.ocr import ocr_pdf_page

MIN_NATIVE_TEXT_CHARS = 40  # below this, a PDF page is treated as scanned/image-only


def parse_pdf(path: str) -> list[tuple[int, str]]:
    reader = PdfReader(path)
    pages: list[tuple[int, str]] = []
    for i, page in enumerate(reader.pages, start=1):
        text = (page.extract_text() or "").strip()
        if len(text) < MIN_NATIVE_TEXT_CHARS:
            ocr_text = ocr_pdf_page(path, i).strip()
            if len(ocr_text) > len(text):
                text = ocr_text
        if text:
            pages.append((i, text))
    return pages


def parse_docx(path: str) -> list[tuple[int, str]]:
    from docx import Document as DocxDocument

    doc = DocxDocument(path)
    text = "\n".join(p.text for p in doc.paragraphs if p.text.strip())
    return [(1, text)] if text.strip() else []


def parse_text(path: str) -> list[tuple[int, str]]:
    content = Path(path).read_text(encoding="utf-8", errors="ignore")
    return [(1, content)] if content.strip() else []


def parse_document(path: str, filename: str) -> list[tuple[int, str]]:
    suffix = Path(filename).suffix.lower()
    if suffix == ".pdf":
        return parse_pdf(path)
    if suffix == ".docx":
        return parse_docx(path)
    if suffix in (".txt", ".md"):
        return parse_text(path)
    raise ValueError(f"Unsupported file type: {suffix}")
