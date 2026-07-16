from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Postgres
    database_url: str = "postgresql+psycopg://govai:govai@localhost:5432/govai"

    # Qdrant
    qdrant_url: str = "http://localhost:6333"
    qdrant_collection: str = "govai_documents"

    # Auth
    jwt_secret_key: str = "dev-secret-change-me"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 480

    # LLM provider: ollama | anthropic | openai_compatible
    llm_provider: str = "ollama"

    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "llama3.1:8b"

    anthropic_api_key: str = ""
    anthropic_model: str = "claude-sonnet-5"

    openai_compatible_base_url: str = "https://api.openai.com/v1"
    openai_compatible_api_key: str = ""
    openai_compatible_model: str = "gpt-4o-mini"

    # Embeddings
    embedding_model: str = "intfloat/multilingual-e5-base"
    embedding_dim: int = 768

    # RAG tuning
    chunk_size_words: int = 220
    chunk_overlap_words: int = 40
    retrieval_top_k: int = 6
    # Low by default: grounded, cited QA should be faithful to the
    # retrieved excerpts, not creative. Observed live during testing —
    # llama3.1:8b at the default temperature (0.8) fabricated specific
    # figures and job titles that did not appear anywhere in a *correctly
    # retrieved* context chunk. Lowering this materially reduces that.
    llm_temperature: float = 0.1

    # Misc
    cors_origins: str = "http://localhost:5173"
    upload_dir: str = "./uploads"
    max_upload_mb: int = 25

    seed_admin_email: str = "admin@govai.local"
    seed_admin_password: str = "ChangeMe123!"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
