import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import admin, auth, chat, departments, documents, health
from app.config import get_settings
from app.database import Base, engine
from app.rag.embeddings import warm_up
from app.rag.vectorstore import ensure_collection
from app.seed import seed_initial_data

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

settings = get_settings()


@asynccontextmanager
async def lifespan(_: FastAPI):
    logger.info("Creating database tables if needed...")
    Base.metadata.create_all(bind=engine)

    logger.info("Ensuring Qdrant collection exists...")
    ensure_collection()

    logger.info("Warming up embedding model (%s)...", settings.embedding_model)
    warm_up()

    logger.info("Seeding initial departments/admin user if needed...")
    seed_initial_data()

    logger.info("GovAI backend ready (LLM provider: %s)", settings.llm_provider)
    yield


app = FastAPI(
    title="GovAI PoC API",
    description="Proof-of-concept private RAG assistant for internal government use.",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/api")
app.include_router(auth.router, prefix="/api")
app.include_router(departments.router, prefix="/api")
app.include_router(documents.router, prefix="/api")
app.include_router(chat.router, prefix="/api")
app.include_router(admin.router, prefix="/api")
