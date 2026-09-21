import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

import httpx
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routers import auth, catalog, dashboard, progress, tmdb, users
from app.core.config import get_settings
from app.core.errors import register_exception_handlers
from app.core.redis import create_redis
from app.db.session import create_engine, create_sessionmaker

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    settings = get_settings()
    engine = create_engine(settings.database_url)
    app.state.engine = engine
    app.state.sessionmaker = create_sessionmaker(engine)
    app.state.redis = create_redis(settings.redis_url)
    app.state.http = httpx.AsyncClient(timeout=8.0)
    try:
        yield
    finally:
        await app.state.http.aclose()
        await app.state.redis.aclose()
        await engine.dispose()


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title="Biblioteca API",
        description="API da Biblioteca (filmes e séries): FastAPI, SQLAlchemy, PostgreSQL e Redis.",
        version="2.0.0",
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origin_regex=settings.cors_origin_regex,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        allow_headers=["*"],
    )
    register_exception_handlers(app)

    for router in (
        auth.router,
        users.router,
        catalog.router,
        progress.router,
        dashboard.router,
        tmdb.router,
    ):
        app.include_router(router)

    @app.get("/health", tags=["health"], include_in_schema=False)
    async def health() -> dict[str, str]:
        return {"status": "ok"}

    return app


app = create_app()
