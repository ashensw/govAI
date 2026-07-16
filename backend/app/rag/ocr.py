"""OCR fallback for scanned documents (e.g. photographed circulars) using
Tesseract with English + Sinhala + Tamil trained data. Requires the
`tesseract-ocr` system package plus `tesseract-ocr-sin` and
`tesseract-ocr-tam` language packs (installed in the backend Dockerfile).

If Tesseract or a language pack isn't available, this degrades gracefully —
ingestion continues with whatever native text extraction produced instead of
failing the whole document.
"""

import logging

logger = logging.getLogger(__name__)

TESSERACT_LANGS = "eng+sin+tam"


def ocr_pdf_page(pdf_path: str, page_number: int) -> str:
    try:
        import pytesseract
        from pdf2image import convert_from_path
    except ImportError:
        logger.warning("OCR dependencies not installed; skipping OCR for %s page %s", pdf_path, page_number)
        return ""

    try:
        images = convert_from_path(pdf_path, first_page=page_number, last_page=page_number, dpi=300)
        if not images:
            return ""
        return pytesseract.image_to_string(images[0], lang=TESSERACT_LANGS)
    except Exception:  # noqa: BLE001 - OCR is best-effort, never fail ingestion because of it
        logger.exception("OCR failed for %s page %s", pdf_path, page_number)
        return ""
