from abc import ABC, abstractmethod
from collections.abc import AsyncIterator

Message = dict[str, str]  # {"role": "system" | "user" | "assistant", "content": str}


class LLMProvider(ABC):
    """Every backend the assistant can be pointed at implements this one
    method. Swapping providers — e.g. from a fully self-hosted Ollama model
    to a hosted API once a use case is cleared for it — is a config change,
    never a code change in the RAG pipeline or API layer."""

    @abstractmethod
    def stream_chat(self, messages: list[Message]) -> AsyncIterator[str]:
        """Yield response text incrementally (token/word chunks)."""
        raise NotImplementedError
        yield  # pragma: no cover - makes this an async generator for type checkers
