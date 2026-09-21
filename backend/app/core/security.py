import asyncio
import secrets
from datetime import UTC, datetime, timedelta

import bcrypt
import jwt

from app.core.config import get_settings

ALGORITHM = "HS256"
BCRYPT_ROUNDS = 10
# bcrypt só considera os primeiros 72 bytes; versões novas da lib recusam senhas maiores.
MAX_PASSWORD_BYTES = 72

# Hash descartável para gastar o mesmo tempo quando o e-mail não existe
# (evita enumeração de usuários por tempo de resposta).
_DUMMY_HASH = bcrypt.hashpw(b"dummy-password", bcrypt.gensalt(BCRYPT_ROUNDS)).decode()


def utcnow() -> datetime:
    """UTC "naive": as colunas são TIMESTAMP sem fuso, como no schema original."""
    return datetime.now(UTC).replace(tzinfo=None)


def _hash_sync(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt(BCRYPT_ROUNDS)).decode()


def _verify_sync(password: str, hashed: str) -> bool:
    raw = password.encode()
    if len(raw) > MAX_PASSWORD_BYTES:
        return False
    try:
        return bcrypt.checkpw(raw, hashed.encode())
    except ValueError:
        return False


async def hash_password(password: str) -> str:
    # bcrypt é CPU-bound: roda em thread para não travar o event loop.
    return await asyncio.to_thread(_hash_sync, password)


async def verify_password(password: str, hashed: str | None) -> bool:
    if hashed is None:
        await asyncio.to_thread(_verify_sync, password, _DUMMY_HASH)
        return False
    return await asyncio.to_thread(_verify_sync, password, hashed)


def create_access_token(user_id: int) -> str:
    settings = get_settings()
    agora = datetime.now(UTC)
    payload = {
        "sub": str(user_id),
        "iat": agora,
        "exp": agora + timedelta(milliseconds=settings.jwt_expiration_ms),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=ALGORITHM)


def decode_access_token(token: str) -> int | None:
    """Devolve o id do usuário, ou None se o token for inválido/expirado."""
    try:
        payload = jwt.decode(token, get_settings().jwt_secret, algorithms=[ALGORITHM])
        return int(payload["sub"])
    except (jwt.PyJWTError, KeyError, ValueError):
        return None


def generate_refresh_token() -> str:
    # 64 caracteres hex (cabe no VARCHAR(100) da coluna).
    return secrets.token_hex(32)
