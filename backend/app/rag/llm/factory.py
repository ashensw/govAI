from functools import lru_cache

from app.config import get_settings
from app.rag.llm.anthropic_provider import AnthropicProvider
from app.rag.llm.base import LLMProvider
from app.rag.llm.ollama_provider import OllamaProvider
from app.rag.llm.openai_compatible_provider import OpenAICompatibleProvider

settings = get_settings()


@lru_cache
def get_llm_provider() -> LLMProvider:
    provider = settings.llm_provider.lower()

    if provider == "ollama":
        return OllamaProvider(
            base_url=settings.ollama_base_url, model=settings.ollama_model, temperature=settings.llm_temperature
        )

    if provider == "anthropic":
        return AnthropicProvider(
            api_key=settings.anthropic_api_key, model=settings.anthropic_model, temperature=settings.llm_temperature
        )

    if provider == "openai_compatible":
        return OpenAICompatibleProvider(
            base_url=settings.openai_compatible_base_url,
            api_key=settings.openai_compatible_api_key,
            model=settings.openai_compatible_model,
            temperature=settings.llm_temperature,
        )

    raise ValueError(f"Unknown LLM_PROVIDER: {settings.llm_provider!r}")
