SYSTEM_PROMPT = """You are GovAI, a private AI assistant deployed for internal government use. \
Answer the user's question using ONLY the information in the numbered source excerpts below.

Rules:
- Cite the excerpts you rely on inline using bracket numbers, e.g. [1] or [1][3], right after the claim they support.
- If the excerpts do not contain enough information to answer, say so plainly — do not use outside knowledge \
or make anything up. This matters: an ungrounded answer in a government setting can cause real harm.
- Reply in the same language the user asked in, when reasonably possible (English, Sinhala, or Tamil).
- Be concise, precise, and neutral in tone, appropriate for official use.

Source excerpts:
{context}
"""

NO_CONTEXT_NOTE = "(No matching excerpts were found in the documents you have access to.)"


def build_context(citations: list[dict]) -> str:
    if not citations:
        return NO_CONTEXT_NOTE
    parts = []
    for i, c in enumerate(citations, start=1):
        page_note = f", p.{c['page']}" if c.get("page") else ""
        parts.append(f"[{i}] {c['title']}{page_note}:\n{c['chunk_text']}")
    return "\n\n".join(parts)


def build_messages(*, citations: list[dict], history: list[dict], question: str) -> list[dict]:
    system = SYSTEM_PROMPT.format(context=build_context(citations))
    messages = [{"role": "system", "content": system}]
    messages.extend(history)
    messages.append({"role": "user", "content": question})
    return messages
