import logging

from fastapi import Request
from redis.asyncio import Redis

logger = logging.getLogger("app.redis")


def create_redis(url: str) -> Redis:
    return Redis.from_url(url, decode_responses=True)


def get_redis(request: Request) -> Redis:
    return request.app.state.redis


async def safe_get(redis: Redis, key: str) -> str | None:
    """GET tolerante a falhas: se o Redis cair, a API continua (só perde o cache)."""
    try:
        return await redis.get(key)
    except Exception:
        logger.warning("Redis indisponível ao ler %s", key, exc_info=True)
        return None


async def safe_set(redis: Redis, key: str, value: str, ttl_seconds: int) -> None:
    try:
        await redis.set(key, value, ex=ttl_seconds)
    except Exception:
        logger.warning("Redis indisponível ao gravar %s", key, exc_info=True)
