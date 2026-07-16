# GovAI — Security & Data Sovereignty Notes

This document exists to be direct about what this PoC does and does not
provide, for an honest pitch conversation.

## Data sovereignty story

- **Embeddings are computed locally.** The embedding model runs in-process
  inside the backend container. No document text is sent anywhere to be
  vectorized.
- **The default LLM runs locally too.** With `LLM_PROVIDER=ollama` (the
  default), every prompt and every generated answer stays inside the
  deployment's own Docker network. This is the configuration to demo when
  the pitch is "your data never leaves your infrastructure."
- **Hosted providers are opt-in, not default.** `anthropic` and
  `openai_compatible` providers exist to show that quality can scale up
  when a specific use case is cleared for it, but switching to them is a
  deliberate configuration change (`LLM_PROVIDER` + API key), never silent.
- **Air-gap compatible in principle.** Because the embedding model and the
  default LLM are both self-hosted, this stack can run with no outbound
  internet access at all once the Docker images and model weights have been
  pulled once (or transferred offline).

## Access control

- JWT-based authentication; tokens expire (`JWT_EXPIRE_MINUTES`, default 8
  hours).
- Three roles (`admin`, `officer`, `viewer`) and three document
  classification levels (`public`, `restricted`, `confidential`), scoped by
  department — see `docs/ARCHITECTURE.md` for the exact matrix.
- The same access rule is enforced both on the document list API **and** on
  vector retrieval, so a chat query cannot surface a chunk from a document
  the user isn't authorized to browse directly.
- Passwords are hashed with bcrypt; never stored or logged in plaintext.

## Audit trail

Every login, document upload/delete, and chat query is written to an
append-only `audit_logs` table with the acting user, action, resource,
source IP, and timestamp — the record a government compliance review would
ask for.

## What this PoC deliberately does NOT implement (production checklist)

These are flagged, not hidden — treat this as the "before go-live" list:

- **Network isolation / VPC segmentation.** Docker Compose here runs
  everything on one host for demo purposes. A production deployment needs
  Qdrant, Postgres, and Ollama on a private network with no direct external
  exposure — only the backend API should be reachable, ideally behind a
  reverse proxy / API gateway with TLS termination.
- **TLS.** No HTTPS is configured in this PoC (assumes local/demo network).
  Production needs TLS everywhere, including between internal services if
  crossing trust boundaries.
- **Secrets management.** Config is via `.env` / environment variables.
  Production should pull secrets (JWT signing key, DB credentials, any API
  keys) from a vault (e.g. HashiCorp Vault, cloud KMS) rather than plain
  env files.
- **MFA / SSO integration.** Login is email+password only. A government
  deployment will likely want integration with an existing identity
  provider (SAML/OIDC) and MFA.
- **Rate limiting & abuse protection.** None implemented; add at the
  gateway layer before production.
- **Formal penetration testing & dependency scanning.** Not performed as
  part of this PoC; required before any production rollout.
- **Data retention & deletion policy.** Chat history and uploaded documents
  persist indefinitely in this PoC. A real deployment needs an explicit
  retention policy, especially for anything touching personal data.
- **Backup/DR strategy** for Postgres and the Qdrant volume.

## Recommended pitch framing

Lead with: *"Every component in this stack can run entirely inside your own
network, using open-weight models you control — including the parts that
usually force a choice between AI capability and data sovereignty (the
embedding step and the language model itself)."* Then be upfront about the
production-hardening checklist above — it builds more trust than silence
does.
