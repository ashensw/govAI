from collections.abc import AsyncIterator

from anthropic import AsyncAnthropic

from app.rag.llm.base import LLMProvider, Message


class AnthropicProvider(LLMProvider):
    """Hosted Claude API. Only use this for content that is cleared to
    leave the deployment's own infrastructure — see SECURITY.md."""

    def __init__(self, api_key: str, model: str, temperature: float = 0.1):
        self.client = AsyncAnthropic(api_key=api_key)
        self.model = model
        self.temperature = temperature

    async def stream_chat(self, messages: list[Message]) -> AsyncIterator[str]:
        system_parts = [m["content"] for m in messages if m["role"] == "system"]
        chat_messages = [m for m in messages if m["role"] != "system"]

        async with self.client.messages.stream(
            model=self.model,
            max_tokens=1536,
            temperature=self.temperature,
            system="\n\n".join(system_parts) or None,
            messages=chat_messages,
        ) as stream:
            async for text in stream.text_stream:
                yield text
