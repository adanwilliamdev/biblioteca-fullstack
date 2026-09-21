"""Testes de integração: exigem PostgreSQL e Redis rodando (veja o README).

Variáveis usadas (com valores padrão para o docker-compose local):
  TEST_DATABASE_URL  (padrão: postgresql://biblioteca:biblioteca@localhost:5432/biblioteca_test)
  TEST_REDIS_URL     (padrão: redis://localhost:6379/15)
"""

import os
import subprocess
import sys
from pathlib import Path

TEST_DB = os.getenv(
    "TEST_DATABASE_URL", "postgresql://biblioteca:biblioteca@localhost:5432/biblioteca_test"
)
TEST_REDIS = os.getenv("TEST_REDIS_URL", "redis://localhost:6379/15")

# Precisa vir ANTES de importar a app (Settings é lida na importação).
os.environ["DATABASE_URL"] = TEST_DB
os.environ["REDIS_URL"] = TEST_REDIS
os.environ["JWT_SECRET"] = "test-secret-test-secret-test-secret-1234567890"
os.environ["APP_RATE_LIMIT_MAX_ATTEMPTS"] = "1000"
os.environ["TMDB_API_KEY"] = ""

import httpx  # noqa: E402
import pytest  # noqa: E402
import pytest_asyncio  # noqa: E402
from sqlalchemy import text  # noqa: E402

from app.core.security import hash_password  # noqa: E402
from app.main import app  # noqa: E402
from app.models import Role, User  # noqa: E402

BACKEND_DIR = Path(__file__).resolve().parent.parent


@pytest.fixture(scope="session", autouse=True)
def _migrate_database():
    """Recria o schema do zero rodando as migrations reais do Alembic."""
    env = {**os.environ}
    for cmd in (["downgrade", "base"], ["upgrade", "head"]):
        subprocess.run(
            [sys.executable, "-m", "alembic", *cmd], cwd=BACKEND_DIR, env=env, check=True
        )


@pytest_asyncio.fixture(scope="session")
async def lifespan_app():
    async with app.router.lifespan_context(app):
        yield app


@pytest_asyncio.fixture(autouse=True)
async def _clean_state(lifespan_app):
    async with lifespan_app.state.engine.begin() as conn:
        await conn.execute(
            text(
                "TRUNCATE usuarios, refresh_tokens, conteudos, temporadas, episodios, "
                "progresso_usuario RESTART IDENTITY CASCADE"
            )
        )
    await lifespan_app.state.redis.flushdb()
    yield


@pytest_asyncio.fixture
async def client(lifespan_app):
    transport = httpx.ASGITransport(app=lifespan_app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as c:
        yield c


@pytest_asyncio.fixture
async def make_client(lifespan_app):
    """Cria clientes independentes (cada um com seu próprio jar de cookies)."""
    clients = []

    def _make():
        transport = httpx.ASGITransport(app=lifespan_app)
        c = httpx.AsyncClient(transport=transport, base_url="http://test")
        clients.append(c)
        return c

    yield _make
    for c in clients:
        await c.aclose()


async def register(c: httpx.AsyncClient, email="user@example.com", nome="Maria", senha="segredo1"):
    return await c.post("/api/auth/register", json={"nome": nome, "email": email, "senha": senha})


@pytest_asyncio.fixture
async def user_client(client):
    r = await register(client)
    assert r.status_code == 201, r.text
    return client


@pytest_asyncio.fixture
async def admin_client(lifespan_app, make_client):
    async with lifespan_app.state.sessionmaker() as session:
        session.add(
            User(
                nome="Admin",
                email="admin@example.com",
                senha=await hash_password("admin123"),
                role=Role.ADMIN,
            )
        )
        await session.commit()
    c = make_client()
    r = await c.post("/api/auth/login", json={"email": "admin@example.com", "senha": "admin123"})
    assert r.status_code == 200, r.text
    return c
