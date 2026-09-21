import asyncio
import json
import logging
from typing import Any

import httpx
from fastapi import HTTPException, status
from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings
from app.core.redis import safe_get, safe_set
from app.models import Content, ContentType, Episode, Season
from app.schemas.tmdb import TmdbImportResult, TmdbSearchResult

logger = logging.getLogger("app.tmdb")

NAO_CONFIGURADO = (
    "Integração com o TMDB não configurada. Defina a variável de ambiente TMDB_API_KEY."
)
MAX_RESULTADOS = 20
MAX_REQUISICOES_SIMULTANEAS = 5


class TmdbClient:
    def __init__(self, settings: Settings, http: httpx.AsyncClient, redis: Redis) -> None:
        self.settings = settings
        self.http = http
        self.redis = redis

    # ----- infraestrutura -----

    def _require_configured(self) -> None:
        if not self.settings.tmdb_configured:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, NAO_CONFIGURADO)

    async def _get(self, path: str, **params: Any) -> dict[str, Any]:
        key = self.settings.tmdb_api_key.strip()
        headers = {}
        query = {"language": "pt-BR", **params}
        if key.startswith("eyJ"):  # "Access Token" v4 (JWT) -> Bearer
            headers["Authorization"] = f"Bearer {key}"
        else:  # chave v3
            query["api_key"] = key
        response = await self.http.get(
            f"{self.settings.tmdb_base_url}{path}", params=query, headers=headers
        )
        response.raise_for_status()
        return response.json()

    # ----- busca -----

    async def search(self, query: str, tipo: ContentType) -> list[TmdbSearchResult]:
        self._require_configured()

        cache_key = f"tmdb:search:{tipo.value}:{query.strip().lower()}"
        em_cache = await safe_get(self.redis, cache_key)
        if em_cache:
            return [TmdbSearchResult.model_validate(i) for i in json.loads(em_cache)]

        path = "/search/movie" if tipo == ContentType.FILME else "/search/tv"
        try:
            data = await self._get(path, query=query, include_adult="false")
        except httpx.HTTPError:
            logger.warning("Falha ao buscar no TMDB", exc_info=True)
            raise HTTPException(
                status.HTTP_502_BAD_GATEWAY, "Não foi possível consultar o TMDB agora."
            ) from None

        resultados = [
            self._to_result(n, tipo) for n in (data.get("results") or [])[:MAX_RESULTADOS]
        ]
        await safe_set(
            self.redis,
            cache_key,
            json.dumps([r.model_dump(by_alias=True) for r in resultados]),
            self.settings.tmdb_cache_ttl_seconds,
        )
        return resultados

    def _to_result(self, node: dict[str, Any], tipo: ContentType) -> TmdbSearchResult:
        eh_filme = tipo == ContentType.FILME
        poster = node.get("poster_path")
        avaliacao = node.get("vote_average")
        return TmdbSearchResult(
            tmdb_id=node["id"],
            titulo=(node.get("title") if eh_filme else node.get("name")) or "Sem título",
            ano=_ano(node.get("release_date") if eh_filme else node.get("first_air_date")),
            imagem_url=self.settings.tmdb_image_base_url + poster if poster else None,
            sinopse=node.get("overview") or None,
            tipo=tipo,
            avaliacao=float(avaliacao) if isinstance(avaliacao, int | float) else None,
        )

    # ----- importação -----

    async def import_title(
        self, session: AsyncSession, tmdb_id: int, tipo: ContentType
    ) -> TmdbImportResult:
        self._require_configured()

        eh_filme = tipo == ContentType.FILME
        try:
            details = await self._get(f"/movie/{tmdb_id}" if eh_filme else f"/tv/{tmdb_id}")
        except httpx.HTTPError:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST, "Não foi possível encontrar este título no TMDB"
            ) from None

        generos = ", ".join(g["name"] for g in details.get("genres") or [] if g.get("name"))
        poster = details.get("poster_path")
        overview = details.get("overview") or None
        content = Content(
            titulo=(details.get("title") if eh_filme else details.get("name")) or "Sem título",
            sinopse=overview[:2000] if overview else None,
            genero=generos or None,
            ano=_ano(details.get("release_date") if eh_filme else details.get("first_air_date")),
            imagem_url=self.settings.tmdb_image_base_url + poster if poster else None,
            tipo=tipo,
            assistido=False,
        )
        session.add(content)
        await session.flush()

        temporadas_importadas = 0
        episodios_importados = 0
        if tipo == ContentType.SERIE:
            seasons = details.get("seasons") or []
            episodios_por_temporada = await self._fetch_seasons(
                tmdb_id, [s["season_number"] for s in seasons]
            )
            for node in seasons:
                numero = node["season_number"]
                season = Season(
                    numero=numero, titulo=node.get("name") or None, conteudo_id=content.id
                )
                session.add(season)
                await session.flush()
                temporadas_importadas += 1
                for ep in episodios_por_temporada.get(numero, []):
                    runtime = ep.get("runtime")
                    session.add(
                        Episode(
                            numero=ep["episode_number"],
                            titulo=ep.get("name") or None,
                            duracao_minutos=runtime if isinstance(runtime, int) else None,
                            temporada_id=season.id,
                        )
                    )
                    episodios_importados += 1

        # Tudo (conteúdo + temporadas + episódios) numa única transação.
        await session.commit()
        return TmdbImportResult(
            conteudo_id=content.id,
            titulo=content.titulo,
            temporadas_importadas=temporadas_importadas,
            episodios_importados=episodios_importados,
        )

    async def _fetch_seasons(
        self, tmdb_id: int, numeros: list[int]
    ) -> dict[int, list[dict[str, Any]]]:
        limite = asyncio.Semaphore(MAX_REQUISICOES_SIMULTANEAS)

        async def buscar(numero: int) -> tuple[int, list[dict[str, Any]]]:
            async with limite:
                try:
                    data = await self._get(f"/tv/{tmdb_id}/season/{numero}")
                except httpx.HTTPError:
                    logger.warning("Temporada %s do TMDB %s indisponível", numero, tmdb_id)
                    return numero, []
                return numero, data.get("episodes") or []

        return dict(await asyncio.gather(*(buscar(n) for n in numeros)))


def _ano(data: str | None) -> int | None:
    if data and len(data) >= 4 and data[:4].isdigit():
        return int(data[:4])
    return None
