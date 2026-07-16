# GovAI — Private AI Assistant (Proof of Concept)

A proof-of-concept demonstrating a **private, self-hostable RAG (Retrieval-
Augmented Generation) AI assistant** for internal government use — built to
show that modern AI capability (chat over your own documents, multilingual
support, source-cited answers) doesn't require sending sensitive data to a
third party.

> **This is a prototype, not an official government system.** No branding,
> emblem, or content here represents any real government body. Demo
> documents are entirely synthetic — see
> [`data/seed_documents/README.md`](data/seed_documents/README.md).

This README covers everything needed to understand, run, and deploy the
project from scratch on a brand-new machine. For deeper detail see:
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — system design, request
  flows, and why each technology was chosen
- [`docs/SECURITY.md`](docs/SECURITY.md) — the sovereignty/privacy story
  and an honest checklist of what a production rollout still needs

---

## Table of contents

1. [What it demonstrates](#what-it-demonstrates)
2. [Stack](#stack)
3. [How it works](#how-it-works)
4. [Deploying on a brand-new machine](#deploying-on-a-brand-new-machine)
5. [Configuration reference](#configuration-reference)
6. [Using the app](#using-the-app)
7. [Switching the LLM provider](#switching-the-llm-provider)
8. [Project structure](#project-structure)
9. [Local development without Docker](#local-development-without-docker)
10. [Testing](#testing)
11. [Troubleshooting](#troubleshooting)
12. [Status and production checklist](#status-and-production-checklist)

---

## What it demonstrates

- **RAG over your own documents** — upload PDFs/DOCX/text, ask questions,
  get answers grounded in and cited from those documents (not the model's
  general knowledge).
- **Runs entirely on infrastructure you control** — embeddings and the
  default LLM (via Ollama) never leave the deployment. No document, query,
  or answer needs to touch a third-party API unless you deliberately
  configure one.
- **Pluggable LLM backend** — swap between a local open-weight model,
  Anthropic, or any OpenAI-compatible endpoint via one config value, no
  code changes.
- **Role- and classification-based access control** — `admin` / `officer`
  / `viewer` roles, `public` / `restricted` / `confidential` document
  classification, department-scoped, enforced identically on document
  browsing *and* on chat retrieval — a user can never surface, via chat, a
  document they aren't authorized to browse directly.
- **Multilingual by design** — local multilingual embeddings
  (English/Sinhala/Tamil and ~100 other languages via
  `intfloat/multilingual-e5-base`), OCR with Sinhala/Tamil language packs
  for scanned documents, and a three-language UI. Cross-language retrieval
  works out of the box — a question asked in English can surface the most
  relevant Sinhala or Tamil chunk.
- **Audit trail** — every login, upload, and chat query is logged
  (who, what, over which documents, from which IP, when) for compliance
  review.

## Stack

| Layer | Choice | Why |
|---|---|---|
| Backend | FastAPI (Python) | Best-supported ecosystem for RAG/embeddings/vector-DB tooling |
| Frontend | React + Vite + TypeScript + Tailwind | Fast dev loop, clean typed API contract with the backend |
| Vector database | Qdrant | Low operational overhead, first-class metadata filtering (used for RBAC-at-retrieval) |
| Relational database | PostgreSQL | Users, departments, documents (metadata), chats, audit log |
| Embeddings | `intfloat/multilingual-e5-base`, local via `sentence-transformers` | Multilingual (incl. Sinhala/Tamil), runs entirely in-process — no network call |
| LLM | Ollama (default, local) — or Anthropic / any OpenAI-compatible endpoint | Sovereignty by default, quality-upgrade path when appropriate |
| OCR | Tesseract (English + Sinhala + Tamil) | Fallback for scanned/photographed documents |

## How it works

**Asking a question:** the query is embedded locally → Qdrant is searched
with an access filter built from the user's role/department (so retrieval
can never return a document the user isn't authorized to see) → the
retrieved chunks become numbered, cited context in the system prompt → the
configured LLM streams an answer over Server-Sent Events → the answer and
its citations are saved and audit-logged.

**Uploading a document:** saved to disk → a background task extracts text
per page (falling back to OCR for scanned pages) → text is chunked,
embedded, and upserted into Qdrant with the document's
department/classification as payload metadata → status flips to `ready` (or
`failed`, with a reason) for the UI to reflect live.

Full detail, diagrams, and the exact access-control matrix are in
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

---

## Deploying on a brand-new machine

These steps assume nothing is installed yet. Tested on Windows 11
(PowerShell); the Docker Compose steps are identical on macOS/Linux.

### 1. Install Docker Desktop

Docker Compose runs the entire stack (Postgres, Qdrant, Ollama, backend,
frontend) as one unit — it's the only hard prerequisite.

- **Windows 11:**
  ```powershell
  winget install --id Docker.DockerDesktop --source winget
  ```
  Docker Desktop on Windows requires the **WSL2** backend. If `wsl --status`
  doesn't already show a default distro, run `wsl --install` and reboot.
  After installing, **launch Docker Desktop at least once manually** — first
  run shows a EULA/onboarding dialog that needs a manual click-through
  before the engine will start.
- **macOS:** `brew install --cask docker`, then launch it once from
  Applications.
- **Linux:** follow
  [docs.docker.com/engine/install](https://docs.docker.com/engine/install/)
  for your distribution, or install Docker Desktop for Linux. Ensure your
  user is in the `docker` group (`sudo usermod -aG docker $USER`, then
  re-login) so `docker` commands don't need `sudo`.

Verify it's working:
```bash
docker version
docker compose version
```
Both should print version info without errors. If `docker version` hangs
or fails to connect, the Docker Desktop engine isn't running yet — open
the Docker Desktop application and wait for its whale icon to show
"running."

**Disk space:** budget ~8 GB free — the backend image (with PyTorch), the
frontend image, the Postgres/Qdrant/Ollama base images, the embedding
model (~1.1 GB, downloaded on first backend startup), and an Ollama model
(~4.9 GB for `llama3.1:8b`) all add up.

### 2. Get the code

```bash
git clone https://github.com/pgwijesinghe/govAI.git
cd govAI
```

### 3. Configure environment

```bash
cp .env.example .env
```
The defaults work out of the box for a local demo. At minimum, consider
changing `SEED_ADMIN_PASSWORD` and `JWT_SECRET_KEY` before anything beyond
a throwaway demo — see [Configuration reference](#configuration-reference)
below for what every variable does.

### 4. Build and start the stack

```bash
docker compose up --build
```
First run builds two images from scratch (the backend pulls a CPU-only
PyTorch wheel; the frontend runs `npm install` + `npm run build`) and pulls
three base images (Postgres, Qdrant, Ollama) — expect this to take several
minutes depending on your connection. Subsequent runs are fast (Docker
caches layers).

Run it in the background instead with `docker compose up --build -d`, and
follow logs with `docker compose logs -f`.

You'll know it's ready when the backend log shows:
```
INFO:app.main:GovAI backend ready (LLM provider: ollama)
INFO:     Application startup complete.
```
Or check programmatically:
```bash
curl http://localhost:8000/api/health
# {"status":"ok","postgres":"ok","qdrant":"ok","llm_provider":"ollama"}
```

### 5. Pull a local model

The `ollama-init` service in `docker-compose.yml` attempts this
automatically on startup, but it can take a while (~5 GB download) and is
worth watching directly the first time:

```bash
docker compose exec ollama ollama pull llama3.1:8b
```

Confirm it landed:
```bash
docker compose exec ollama ollama list
```

### 6. Seed the demo documents

Loads 15 synthetic sample documents (5 topics × English/Sinhala/Tamil) so
the chat demo has something to answer questions about immediately, and
gives the RBAC demo real content to show off (public / restricted /
confidential, scoped to different departments):

```bash
docker compose exec backend python -m scripts.seed_documents
```

Safe to re-run — already-seeded documents are skipped, not duplicated.

### 7. Open it

**http://localhost:5173**

Demo accounts (seeded automatically on first backend startup):

| Email | Password | Role | Department |
|---|---|---|---|
| `admin@govai.local` | value of `SEED_ADMIN_PASSWORD` in `.env` (default `ChangeMe123!`) | admin | — |
| `officer@govai.local` | `Officer123!` | officer | Ministry of Health (Demo) |
| `viewer@govai.local` | `Viewer123!` | viewer | Ministry of Health (Demo) |

Log in as each to see the access-control story play out: `viewer` cannot
see the confidential IT security policy or documents scoped to other
departments; `officer` sees everything scoped to Health; `admin` sees
everything, plus the admin dashboard and audit log.

### Performance expectations

CPU-only inference with an 8B model is genuinely slow — expect **30–90
seconds per answer** on a typical laptop (prompt processing + token
generation, both CPU-bound). This is real, worth setting expectations for
before a live demo. Options to speed it up:
- Use a GPU: uncomment the `deploy.resources.reservations.devices` block
  under the `ollama` service in `docker-compose.yml` (requires an NVIDIA
  GPU + the NVIDIA Container Toolkit on the host).
- Use a smaller/quantized model, e.g. `OLLAMA_MODEL=qwen2.5:3b` in `.env`.
- Switch `LLM_PROVIDER` to a hosted API for the demo itself (see
  [Switching the LLM provider](#switching-the-llm-provider)) while keeping
  Ollama as the documented default for the actual private deployment.

---

## Configuration reference

All configuration lives in `.env` (copy from `.env.example`). Grouped by
concern:

**Database**
- `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` — Postgres
  credentials, used both by the `postgres` container and by
  `DATABASE_URL`.
- `DATABASE_URL` — full SQLAlchemy connection string. When running via
  Docker Compose, `docker-compose.yml` overrides this automatically to
  point at the `postgres` service hostname regardless of what's in `.env`.

**Vector store**
- `QDRANT_URL`, `QDRANT_COLLECTION` — same override pattern as above under
  Docker Compose (points at the `qdrant` service).

**Auth**
- `JWT_SECRET_KEY` — **change this** for anything beyond a local demo
  (`openssl rand -hex 32` to generate one). Signs all session tokens.
- `JWT_ALGORITHM`, `JWT_EXPIRE_MINUTES` — token algorithm and session
  length (default 8 hours).

**LLM provider** — see [Switching the LLM provider](#switching-the-llm-provider)
for full detail on `LLM_PROVIDER` and the per-provider variables.
- `LLM_TEMPERATURE` (default `0.1`) — deliberately low. Grounded, cited QA
  over retrieved documents should stay faithful to the source text, not
  sample creatively; a higher temperature measurably increases the chance
  of the model inventing details not present in the retrieved context even
  when retrieval itself is correct. Raise it only if you specifically want
  more varied phrasing and accept that tradeoff.

**Embeddings**
- `EMBEDDING_MODEL` (default `intfloat/multilingual-e5-base`),
  `EMBEDDING_DIM` (default `768`) — must match: changing the model to one
  with a different output dimension requires updating `EMBEDDING_DIM` and
  re-ingesting all documents (the Qdrant collection is created with a fixed
  vector size).

**RAG tuning**
- `CHUNK_SIZE_WORDS` / `CHUNK_OVERLAP_WORDS` — word-window chunking size
  and overlap.
- `RETRIEVAL_TOP_K` — how many chunks are retrieved per query.

**Misc**
- `CORS_ORIGINS` — comma-separated list of allowed frontend origins.
- `UPLOAD_DIR` — where uploaded files are stored (Docker Compose points
  this at a named volume, `backend_uploads`, so it persists across
  container recreation).
- `MAX_UPLOAD_MB` — upload size limit.
- `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` — the admin account created on
  first startup.

---

## Using the app

- **Chat** — ask questions in English, Sinhala, or Tamil. Answers stream
  in and cite the specific document/page/relevance-score they're grounded
  in, expandable under "Sources."
- **Documents** (officer/admin) — drag-and-drop upload, pick a department
  and classification level, watch ingestion status update live
  (`processing` → `ready`/`failed`).
- **Admin** (admin only) — stats dashboard (documents/users/chats, broken
  down by department) and a paginated audit log of every login, upload,
  and chat query.
- **Language switcher** — top-right EN/SI/TA toggle changes UI chrome
  (nav, buttons, labels); document/chat content itself is whatever
  language it actually is.

## Switching the LLM provider

Edit `.env`, then restart the backend (`docker compose up -d --build backend`
if already running):

```bash
# Fully local (default) — nothing leaves your infrastructure
LLM_PROVIDER=ollama
OLLAMA_BASE_URL=http://ollama:11434   # only change if not using Docker Compose
OLLAMA_MODEL=llama3.1:8b

# Hosted Claude
LLM_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-...
ANTHROPIC_MODEL=claude-sonnet-5

# Any OpenAI-compatible endpoint (OpenAI itself, vLLM, LM Studio, ...)
LLM_PROVIDER=openai_compatible
OPENAI_COMPATIBLE_BASE_URL=https://api.openai.com/v1
OPENAI_COMPATIBLE_API_KEY=sk-...
OPENAI_COMPATIBLE_MODEL=gpt-4o-mini
```

Swapping providers is a config change only — the RAG pipeline, retrieval,
RBAC, and API contract are all provider-agnostic (`app/rag/llm/base.py`
defines the one interface every provider implements).

---

## Project structure

```
backend/                  FastAPI app, RAG pipeline, ingestion, LLM providers
  app/
    api/routes/            auth, departments, documents, chat, admin, health
    core/                   security (JWT/bcrypt), RBAC rules
    rag/                    embeddings, chunking, parsing, OCR, vector store, LLM providers
    models.py               SQLAlchemy models
    schemas.py              Pydantic request/response models
    seed.py                 startup seeding (departments + demo accounts)
  scripts/
    seed_documents.py       loads data/seed_documents/ into a running deployment
  tests/                    pytest unit tests
  Dockerfile
  requirements.txt

frontend/                 React + Vite + TypeScript + Tailwind SPA
  src/
    api/                    typed fetch client, one module per resource
    pages/                  Login, Chat, Documents, Admin
    components/             Nav, badges, language switcher, etc.
    i18n.ts                 EN/SI/TA UI-chrome dictionary
  Dockerfile                multi-stage build → nginx static serve

data/seed_documents/      15 synthetic demo documents (5 topics × EN/SI/TA)
docs/
  ARCHITECTURE.md          system design, request flows, design rationale
  SECURITY.md              sovereignty story + production checklist

docker-compose.yml         postgres, qdrant, ollama, ollama-init, backend, frontend
.env.example                every configuration variable, documented
```

## Local development without Docker

Useful for faster iteration on one side of the stack. You'll still need
Postgres, Qdrant, and (if testing generation) Ollama reachable somewhere —
either run the rest of the stack via `docker compose up postgres qdrant
ollama` and point `.env` at `localhost`, or run everything locally.

### Backend

```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\Activate.ps1   macOS/Linux: source .venv/bin/activate
pip install -r requirements-dev.txt
uvicorn app.main:app --reload
```

Uses `.env` in the repo root by default (via `pydantic-settings`), or set
env vars directly. Since `DATABASE_URL`/`QDRANT_URL`/`OLLAMA_BASE_URL`
default to `localhost` in `app/config.py`, this works against
`docker compose up postgres qdrant ollama` without any override.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Set `VITE_API_BASE_URL` in `frontend/.env` if the backend isn't at the
default `http://localhost:8000/api`.

## Testing

```bash
cd backend
pytest
```

```bash
cd frontend
npm run build   # type-checks (tsc -b) and builds
npm run lint
```

---

## Troubleshooting

Issues actually encountered while standing this up — documented so the
next person doesn't have to rediscover them.

**`env file .env not found`** when running `docker compose up` — you
skipped (or a copy command silently failed at) `cp .env.example .env`.
Verify with `ls .env` before retrying; Compose needs the file to exist,
not just `.env.example`.

**Docker Desktop installed but `docker version` can't connect to the
daemon** — the CLI and the engine are separate; installing doesn't launch
it. Start Docker Desktop from the Start Menu/Applications and wait for it
to report "running." On Windows, first launch may show a EULA dialog that
needs a manual click before the engine comes up — this is a native
desktop dialog, not something scriptable.

**`ollama-init` container loops forever printing "waiting for ollama..."**
— this was a real bug during development: the wait-loop used
`ollama --host ollama:11434 list`, but the Ollama CLI has no `--host`
flag (only the `OLLAMA_HOST` env var, which was already set) — the invalid
flag caused every check to fail silently, forever. Already fixed in this
repo's `docker-compose.yml`; if you see this again after modifying that
file, check the `command:` block wasn't reintroduced with a `--host` flag.

**Model pull or first answer is very slow** — expected on CPU-only
hardware; see [Performance expectations](#performance-expectations) above.
Watch live progress with `docker compose logs -f ollama-init` (pull) or
`docker compose logs -f ollama` (generation — look for `tg = N t/s` lines
showing tokens/second).

**The model answers with numbers/details that don't match the source
document** — check `LLM_TEMPERATURE` in `.env` (should be low, `0.1` by
default) and confirm citations shown alongside the answer actually contain
the right figures (expand "Sources" in the chat UI, or hit
`GET /api/chat/sessions/{id}/messages` directly). If citations are correct
but the prose isn't, it's a generation-faithfulness issue, not a retrieval
bug — see the temperature note under
[Configuration reference](#configuration-reference). Smaller local models
are more prone to this than larger ones; a hosted frontier model will be
markedly more faithful if grounding accuracy matters more than
self-hosting for a given use case.

**Port already in use** (`5173`, `8000`, `5432`, `6333`/`6334`, or
`11434`) — something else on the host is bound to one of these. Either
stop that process, or change the left-hand side of the relevant `ports:`
mapping in `docker-compose.yml` (e.g. `"5174:80"` for the frontend) and
adjust `CORS_ORIGINS` / `VITE_API_BASE_URL` accordingly.

**Login fails for every seeded account** — if you've modified
`app/schemas.py`, make sure `LoginRequest.email` is a plain `str`, not
pydantic's `EmailStr`. `EmailStr` (via `email-validator`) rejects `.local`
as a reserved special-use TLD even for pure syntax validation, which would
silently lock out every `@govai.local` demo account. This was a real bug
found during testing and is already fixed in this repo.

**First message in a brand-new chat never appears (no error shown)** —
also a real bug found and fixed during testing: creating a new chat
session used to re-trigger a message-list fetch that could race with and
overwrite the in-progress streamed reply. Fixed in
`frontend/src/pages/ChatPage.tsx` via a guard ref
(`skipNextMessagesFetchRef`). If you see this again after modifying that
file, check the guard wasn't removed.

**Rebuilding after a code change doesn't seem to take effect** — for
backend/frontend source changes, `docker compose up -d --build backend`
(or `frontend`) rebuilds just that service. `docker compose up --build`
without `-d` rebuilds everything and runs attached to logs.

---

## Status and production checklist

This is a proof of concept built to demonstrate feasibility and gather
stakeholder feedback — not a production system. [`docs/SECURITY.md`](docs/SECURITY.md)
has the explicit list of what a production rollout still requires (network
isolation, TLS, secrets management, SSO/MFA, rate limiting, penetration
testing, data retention policy, backups) and
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) lists PoC-level
simplifications (in-process background tasks instead of a real queue, no
reranking step, schema managed via `create_all` instead of migrations).
Read both before treating this as anything more than a demo.
