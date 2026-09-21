from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import (
    Content,
    ContentType,
    Episode,
    ProgressStatus,
    Season,
    UserProgress,
)
from app.schemas.catalog import (
    ContentDetail,
    ContentRequest,
    ContentSummary,
    EpisodeItem,
    EpisodeRequest,
    Page,
    SeasonItem,
    SeasonRequest,
)
from app.services.progress_calc import progress_by_content


def _nao_encontrado(mensagem: str) -> HTTPException:
    return HTTPException(status.HTTP_404_NOT_FOUND, mensagem)


def _escape_like(valor: str) -> str:
    return valor.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


async def list_content(
    session: AsyncSession,
    user_id: int,
    *,
    titulo: str | None,
    genero: str | None,
    ano: int | None,
    tipo: ContentType | None,
    page: int,
    size: int,
) -> Page[ContentSummary]:
    filtros = []
    if titulo and titulo.strip():
        filtros.append(Content.titulo.ilike(f"%{_escape_like(titulo.strip())}%", escape="\\"))
    if genero and genero.strip():
        filtros.append(func.lower(Content.genero) == genero.strip().lower())
    if ano is not None:
        filtros.append(Content.ano == ano)
    if tipo is not None:
        filtros.append(Content.tipo == tipo)

    total = await session.scalar(select(func.count(Content.id)).where(*filtros)) or 0
    itens = (
        await session.scalars(
            select(Content).where(*filtros).order_by(Content.id).offset(page * size).limit(size)
        )
    ).all()

    progressos = await progress_by_content(session, user_id, [c.id for c in itens])
    resumo = [
        ContentSummary(
            id=c.id,
            titulo=c.titulo,
            genero=c.genero,
            ano=c.ano,
            imagem_url=c.imagem_url,
            tipo=c.tipo,
            progresso=progressos.get(c.id, 0.0),
        )
        for c in itens
    ]
    return Page.build(resumo, total, page, size)


async def get_details(session: AsyncSession, user_id: int, content_id: int) -> ContentDetail:
    content = await session.get(Content, content_id)
    if content is None:
        raise _nao_encontrado("Conteúdo não encontrado")

    progresso = (await progress_by_content(session, user_id, [content.id]))[content.id]
    base = {
        "id": content.id,
        "titulo": content.titulo,
        "sinopse": content.sinopse,
        "genero": content.genero,
        "ano": content.ano,
        "imagem_url": content.imagem_url,
        "tipo": content.tipo,
        "progresso": progresso,
    }

    if content.tipo == ContentType.FILME:
        return ContentDetail(**base, assistido=progresso >= 100.0)

    temporadas = (
        await session.scalars(
            select(Season)
            .where(Season.conteudo_id == content.id)
            .options(selectinload(Season.episodios))
            .order_by(Season.numero)
        )
    ).all()
    assistidos = set(
        (
            await session.scalars(
                select(UserProgress.episodio_id)
                .join(Episode, Episode.id == UserProgress.episodio_id)
                .join(Season, Season.id == Episode.temporada_id)
                .where(
                    UserProgress.usuario_id == user_id,
                    UserProgress.status == ProgressStatus.ASSISTIDO,
                    Season.conteudo_id == content.id,
                )
            )
        ).all()
    )

    itens_temporada = []
    for s in temporadas:
        episodios = [
            EpisodeItem(
                id=e.id,
                numero=e.numero,
                titulo=e.titulo,
                duracao_minutos=e.duracao_minutos,
                assistido=e.id in assistidos,
            )
            for e in s.episodios
        ]
        vistos = sum(1 for e in episodios if e.assistido)
        itens_temporada.append(
            SeasonItem(
                id=s.id,
                numero=s.numero,
                titulo=s.titulo,
                progresso=(100.0 * vistos / len(episodios)) if episodios else 0.0,
                episodios=episodios,
            )
        )
    return ContentDetail(**base, temporadas=itens_temporada)


# ---------- CRUD (admin) ----------


async def create_content(session: AsyncSession, dto: ContentRequest) -> Content:
    content = Content(**dto.model_dump(), assistido=False)
    session.add(content)
    await session.commit()
    await session.refresh(content)  # carrega criadoEm (default do banco)
    return content


async def update_content(session: AsyncSession, content_id: int, dto: ContentRequest) -> Content:
    content = await _get_content(session, content_id)
    for campo, valor in dto.model_dump().items():
        setattr(content, campo, valor)
    await session.commit()
    return content


async def delete_content(session: AsyncSession, content_id: int) -> None:
    content = await _get_content(session, content_id)
    # ON DELETE CASCADE remove temporadas, episódios e progresso vinculados.
    await session.delete(content)
    await session.commit()


async def add_season(session: AsyncSession, content_id: int, dto: SeasonRequest) -> Season:
    await _get_content(session, content_id)
    season = Season(numero=dto.numero, titulo=dto.titulo, conteudo_id=content_id)
    session.add(season)
    await session.commit()
    return season


async def remove_season(session: AsyncSession, season_id: int) -> None:
    season = await session.get(Season, season_id)
    if season is None:
        raise _nao_encontrado("Temporada não encontrada")
    await session.delete(season)
    await session.commit()


async def add_episode(session: AsyncSession, season_id: int, dto: EpisodeRequest) -> Episode:
    if await session.get(Season, season_id) is None:
        raise _nao_encontrado("Temporada não encontrada")
    episode = Episode(
        numero=dto.numero,
        titulo=dto.titulo,
        duracao_minutos=dto.duracao_minutos,
        temporada_id=season_id,
    )
    session.add(episode)
    await session.commit()
    return episode


async def remove_episode(session: AsyncSession, episode_id: int) -> None:
    episode = await session.get(Episode, episode_id)
    if episode is None:
        raise _nao_encontrado("Episódio não encontrado")
    await session.delete(episode)
    await session.commit()


async def _get_content(session: AsyncSession, content_id: int) -> Content:
    content = await session.get(Content, content_id)
    if content is None:
        raise _nao_encontrado("Conteúdo não encontrado")
    return content
