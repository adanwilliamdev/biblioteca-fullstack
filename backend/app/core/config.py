import re
from functools import lru_cache

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Configuração lida de variáveis de ambiente (ou do arquivo .env).

    Os nomes das variáveis são os mesmos do backend NestJS original.
    """

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    port: int = 8080
    database_url: str
    redis_url: str = "redis://localhost:6379/0"

    # Sem valor padrão de propósito: a API não deve subir com um segredo conhecido.
    jwt_secret: str = Field(min_length=32)
    jwt_expiration_ms: int = 900_000
    jwt_refresh_expiration_ms: int = 604_800_000

    app_cors_allowed_origins: str = "http://localhost:*,http://127.0.0.1:*"
    app_cookie_secure: bool = False
    app_rate_limit_window_ms: int = 60_000
    app_rate_limit_max_attempts: int = 10
    # O IP do cliente vem de X-Forwarded-For quando a API está atrás de um proxy
    # (Next.js rewrites, nginx, Render, Railway...). Desligue se a API for exposta
    # diretamente, pois o header pode ser forjado por quem acessa sem proxy.
    app_trust_forwarded_for: bool = True

    tmdb_api_key: str = ""
    tmdb_base_url: str = "https://api.themoviedb.org/3"
    tmdb_image_base_url: str = "https://image.tmdb.org/t/p/w500"
    tmdb_cache_ttl_seconds: int = 600

    @field_validator("database_url")
    @classmethod
    def _use_async_driver(cls, value: str) -> str:
        for prefix in ("postgres://", "postgresql://"):
            if value.startswith(prefix):
                return "postgresql+asyncpg://" + value.removeprefix(prefix)
        return value

    @property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.app_cors_allowed_origins.split(",") if o.strip()]

    @property
    def cors_origin_regex(self) -> str:
        """Converte padrões com curinga (ex.: http://localhost:*) em uma regex única."""
        partes = [re.escape(p).replace(r"\*", ".*") for p in self.cors_origins]
        return "^(" + "|".join(partes) + ")$" if partes else r"^$"

    @property
    def tmdb_configured(self) -> bool:
        return bool(self.tmdb_api_key.strip())


@lru_cache
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]
