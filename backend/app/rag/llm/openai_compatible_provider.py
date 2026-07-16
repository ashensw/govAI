import json
from collections.abc import AsyncIterator

import httpx

from app.rag.llm.base import LLMProvider, Message


class OpenAICompatibleProvider(LLMProvider):
    """Works with OpenAI itself, or any self-hosted server that speaks the
    same /chat/completions wire format (vLLM, LM Studio, Azure OpenAI
    gateways, etc.) — useful for standing up a higher-throughput self-hosted
    model without writing a new provider."""

    def __init__(self, base_url: str, api_key: str, model: str, temperature: float = 0.1):
        self.base_url = base_url.rstrip("/")
        self.api_key = api_key
        self.model = model
        self.temperature = temperature

    async def stream_chat(self, messages: list[Message]) -> AsyncIterator[str]:
        headers = {"Authorization": f"Bearer {self.api_key}"} if self.api_key else {}
        payload = {"model": self.model, "messages": messages, "stream": True, "temperature": self.temperature}

        async with httpx.AsyncClient(timeout=None) as client:
            async with client.stream(
                "POST", f"{self.base_url}/chat/completions", json=payload, headers=headers
            ) as response:
                response.raise_for_status()
                async for line in response.aiter_lines():
                    line = line.strip()
                    if not line or not line.startswith("data:"):
                        continue
                    data_str = line[len("data:") :].strip()
                    if data_str == "[DONE]":
                        break
                    chunk = json.loads(data_str)
                    delta = chunk.get("choices", [{}])[0].get("delta", {})
                    content = delta.get("content")
                    if content:
                        yield content
