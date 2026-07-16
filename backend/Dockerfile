FROM python:3.11-slim

WORKDIR /app

# poppler-utils -> pdf2image (renders PDF pages to images for OCR)
# tesseract-ocr + sin/tam language packs -> OCR fallback for scanned
# circulars in English, Sinhala, or Tamil
RUN apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr \
    tesseract-ocr-sin \
    tesseract-ocr-tam \
    poppler-utils \
    curl \
    && rm -rf /var/lib/apt/lists/*

# CPU-only torch build first — much smaller than the default CUDA wheel and
# all this PoC needs, since embeddings run on CPU.
RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app
COPY scripts ./scripts

RUN mkdir -p /app/uploads

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
