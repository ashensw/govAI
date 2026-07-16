# Seed documents

These are **synthetic, fictional documents** generated to give the GovAI
proof-of-concept something realistic to ingest and answer questions about in
a live demo. They are **not** real government records, do not reference any
real ongoing policy, and use a placeholder issuing body name
("Department of Public Administration (Demo)", etc.) with invented
reference numbers — do not mistake them for actual government issuances.

## Topics (each exists in `en/`, `si/`, and `ta/`)

1. `circular-public-holidays.txt` — annual public holiday circular
2. `circular-procurement-guidelines.txt` — procurement/tendering thresholds and approval authority
3. `circular-hr-leave-policy.txt` — HR leave entitlements and application procedure
4. `advisory-public-health-guidance.txt` — seasonal dengue prevention advisory
5. `policy-it-data-security.txt` — internal IT/data security policy

Each language version covers the same topic, reference numbers, and dates so
that cross-language retrieval can be demonstrated (e.g. asking a question in
English and getting a grounded answer even if the most relevant chunk is the
Sinhala or Tamil version of that document).

Load them into a running deployment with:

```bash
docker compose exec backend python -m scripts.seed_documents
```

See `backend/scripts/seed_documents.py` for how each file is mapped to a
department and classification level (public / restricted / confidential) —
this mapping is what makes the role-based access control demo meaningful.
