import logging
from typing import Annotated

import httpx
from fastapi import Depends, HTTPException, Request, status
from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings, get_settings
from app.core.redis import get_redis
from app.core.security import decode_access_token
from app.db.session import get_session
from app.models import Role, User
from app.services.tmdb import TmdbClient

logger = logging.getLogger("app.deps")

ACCESS_COOKIE = "access_token"
REFRESH_COOKIE = "refresh_token"

SessionDep = Annotated[AsyncSession, Depends(get_session)]
RedisDep = Annotated[Redis, Depends(get_redis)]
SettingsDep = Annotated[Settings, Depends(get_settings)]


def _extract_token(request: Request) -> str | None:
    """Cookie httpOnly (frontend web) com fallback para 'Authorization: Bearer' (API/Swagger)."""
    if token := request.cookies.get(ACCESS_COOKIE):
        return token
    authorization = request.headers.get("authorization", "")
    if authorization.startswith("Bearer "):
        return authorization.removeprefix("Bearer ")
    return None


async def get_current_user(request: Request, session: SessionDep) -> User:
    token = _extract_token(request)
    user_id = decode_access_token(token) if token else None
    user = await session.get(User, user_id) if user_id is not None else None
    if user is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Não autenticado")
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


async def require_admin(user: CurrentUser) -> User:
    if user.role != Role.ADMIN:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Acesso restrito a administradores")
    return user


AdminUser = Annotated[User, Depends(require_admin)]


def _client_ip(request: Request, settings: Settings) -> str:
    if settings.app_trust_forwarded_for:
        forwarded = request.headers.get("x-forwarded-for", "").strip()
        if forwarded:
            return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


async def auth_rate_limit(request: Request, redis: RedisDep, settings: SettingsDep) -> None:
    """Limita tentativas de login/registro por IP (janela fixa, contador no Redis).

    Como o contador vive no Redis, o limite vale para todas as instâncias da API.
    Se o Redis estiver fora do ar, a requisição passa (fail-open) e o erro é registrado.
    """
    key = f"rl:auth:{_client_ip(request, settings)}"
    try:
        await redis.set(key, 0, px=settings.app_rate_limit_window_ms, nx=True)
        tentativas = await redis.incr(key)
        ttl_ms = await redis.pttl(key)
    except Exception:
        logger.warning("Redis indisponível: rate limit ignorado", exc_info=True)
        return

    if tentativas > settings.app_rate_limit_max_attempts:
        retry_after = max(1, (ttl_ms if ttl_ms > 0 else settings.app_rate_limit_window_ms) // 1000)
        raise HTTPException(
            status.HTTP_429_TOO_MANY_REQUESTS,
            "Muitas tentativas. Aguarde um instante e tente novamente.",
            headers={"Retry-After": str(retry_after)},
        )


def get_http(request: Request) -> httpx.AsyncClient:
    return request.app.state.http


def get_tmdb(
    settings: SettingsDep,
    redis: RedisDep,
    http: Annotated[httpx.AsyncClient, Depends(get_http)],
) -> TmdbClient:
    return TmdbClient(settings, http, redis)


TmdbDep = Annotated[TmdbClient, Depends(get_tmdb)]
