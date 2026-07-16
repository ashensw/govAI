# GovAI — Architecture

## Goal

Demonstrate a private, self-hostable Retrieval-Augmented Generation (RAG)
assistant that a government body can run entirely on infrastructure it
controls — no document, query, or answer needs to leave the deployment.

## Component overview

```
┌─────────────┐      ┌──────────────────────────┐      ┌───────────────┐
│  Frontend   │◄────►│         Backend           │◄────►│  PostgreSQL   │
│  (React)    │ HTTP │  FastAPI + RAG pipeline    │      │  (metadata)   │
└─────────────┘  SSE └────────────┬───────────────┘      └───────────────┘
                                   │
                     ┌─────────────┼──────────────┐
                     ▼             ▼              ▼
              ┌────────────┐ ┌───────────┐ ┌──────────────┐
              │  Qdrant    │ │  Ollama   │ │ Embedding     │
              │ (vectors)  │ │ (local    │ │ model (local, │
              │            │ │  LLM)     │ │ in-process)   │
              └────────────┘ └───────────┘ └──────────────┘
```

- **Frontend** — React/Vite SPA. Chat UI with streaming responses and
  inline citations, document upload/management, an admin dashboard, and a
  three-language (EN/SI/TA) UI toggle.
- **Backend** — FastAPI. Owns auth, RBAC, document ingestion, the RAG
  orchestration, and audit logging.
- **PostgreSQL** — system of record for users, departments, documents
  (metadata only — files live on disk/volume), chat sessions/messages, and
  the audit log.
- **Qdrant** — vector database holding chunk embeddings + payload metadata
  (document id, department, classification, page, language) used both for
  similarity search and for enforcing access control at retrieval time.
- **Embedding model** — `intfloat/multilingual-e5-base`, loaded in-process
  via `sentence-transformers`. Covers ~100 languages including Sinhala and
  Tamil, and never makes a network call — embeddings are computed locally.
- **LLM** — pluggable. Default is **Ollama**, serving an open-weight model
  (e.g. Llama 3.1) entirely on local infrastructure. The same interface
  (`app/rag/llm/base.py`) also has implementations for Anthropic's API and
  any OpenAI-compatible endpoint (OpenAI itself, or a self-hosted vLLM
  server), selected purely via the `LLM_PROVIDER` env var — no code changes
  needed to switch.

## Request flow: asking a question

1. User sends a message from the chat UI (authenticated, JWT bearer token).
2. Backend embeds the query locally (`app/rag/embeddings.py`).
3. Backend searches Qdrant, applying an **access filter** built from the
   user's role and department (`app/core/rbac.py` +
   `app/rag/vectorstore.py::_access_filter`) — a user only ever retrieves
   chunks from documents they are authorized to see, regardless of vector
   similarity.
4. Retrieved chunks become numbered, cited context in the system prompt
   (`app/rag/prompts.py`).
5. The selected LLM provider streams a response token-by-token over
   Server-Sent Events; the frontend renders it live.
6. Once complete, the assistant message + its citations are persisted, and
   an audit log entry records who asked what, over which documents, from
   which IP, and when.

## Document ingestion flow

1. An officer/admin uploads a PDF/DOCX/TXT file with a department and
   classification (`public` / `restricted` / `confidential`).
2. The file is saved to disk and a `Document` row is created with status
   `processing`; ingestion runs as a background task so the upload request
   returns immediately.
3. Text is extracted per page (`app/rag/parsing.py`); PDF pages with little
   or no extractable text (i.e. scanned/photographed documents) fall back to
   OCR (Tesseract, English+Sinhala+Tamil — `app/rag/ocr.py`).
4. Text is chunked on word boundaries with overlap
   (`app/rag/chunking.py`), language-detected, embedded, and upserted into
   Qdrant with the document's department/classification as payload metadata.
5. The `Document` row is updated to `ready` (or `failed`, with an error
   message) so the frontend can reflect status live.

## Access control model

Three roles (`admin`, `officer`, `viewer`) and three classification levels
per document (`public`, `restricted`, `confidential`), scoped by department:

| Classification | Visible to |
|---|---|
| `public` | every authenticated user |
| `restricted` | admins, and any user in the owning department |
| `confidential` | admins, and officers (not viewers) in the owning department |

This rule is implemented once (`app/core/rbac.py::can_access`) and applied
identically to the document list API and the vector search filter, so the
two surfaces can never drift out of sync.

## Why these choices, for a PoC

- **Local embeddings + local LLM by default** is the core sovereignty
  argument for a government buyer — nothing about "ask a question" requires
  a network call to a third party.
- **Pluggable LLM provider** lets the same demo show both the fully private
  story and, when appropriate for lower-sensitivity data, a higher-quality
  hosted model — a config change, not a rebuild.
- **Qdrant** was chosen over alternatives (pgvector, Weaviate, Milvus) for
  its low operational overhead in a single Docker Compose deployment and
  first-class metadata filtering, which the RBAC-at-retrieval design
  depends on.
- **FastAPI + SQLAlchemy** rather than a heavier framework — this is a PoC;
  the priority is a codebase a small platform team can read end-to-end in an
  afternoon, not a maximal feature set.

## Known PoC-level simplifications (call out explicitly in the pitch)

- Ingestion runs as an in-process background task, not a real task queue.
  A production deployment should move this to Celery/RQ/Arq so a crashed
  backend doesn't lose in-flight ingestion jobs, and so ingestion throughput
  scales independently of the API.
- No reranking step after vector search — a cross-encoder reranker (e.g.
  `bge-reranker` multilingual) would measurably improve precision on larger
  document sets.
- Schema migrations use `create_all` at startup, not Alembic — fine for a
  demo, not for an evolving production schema.
- No rate limiting, no per-tenant isolation, no secrets manager integration
  (env vars only) — all straightforward additions before a production
  deployment, deliberately left out to keep the PoC legible.
- Language detection (`app/rag/language.py`) special-cases Sinhala/Tamil by
  Unicode script range, which is reliable, but falls back to `langdetect`
  for everything else — `langdetect` is known to misclassify very short
  Latin-script documents (observed: a ~40-word English test document tagged
  as Catalan). This washes out on realistically-sized documents (a few
  hundred words+) but is worth knowing about when a short document shows an
  unexpected language tag in the Documents table.
