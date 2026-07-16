import json
from collections.abc import AsyncIterator

import httpx

from app.rag.llm.base import LLMProvider, Message


class OllamaProvider(LLMProvider):
    """Talks to a local Ollama daemon over HTTP. This is the default
    provider: every prompt and every response stays inside the
    deployment's own network — nothing is sent to a third party."""

    def __init__(self, base_url: str, model: str, temperature: float = 0.1):
        self.base_url = base_url.rstrip("/")
        self.model = model
        self.temperature = temperature

    async def stream_chat(self, messages: list[Message]) -> AsyncIterator[str]:
        payload = {
            "model": self.model,
            "messages": messages,
            "stream": True,
            "options": {"temperature": self.temperature},
        }
        async with httpx.AsyncClient(timeout=None) as client:
            async with client.stream("POST", f"{self.base_url}/api/chat", json=payload) as response:
                response.raise_for_status()
                async for line in response.aiter_lines():
                    if not line.strip():
                        continue
                    data = json.loads(line)
                    content = data.get("message", {}).get("content")
                    if content:
                        yield content
                    if data.get("done"):
                        break
