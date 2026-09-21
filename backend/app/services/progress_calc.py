"""Cálculo de progresso (0-100) compartilhado por catálogo, progresso e dashboard.

Regra (igual à do backend original):
- conteúdo com episódios: episódios assistidos / total de episódios;
- sem episódios (filmes): 100 se o usuário marcou como ASSISTIDO, senão 0.
"""

from collections.abc import Collection

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Episode, ProgressStatus, Season, UserProgress


async def progress_by_content(
    session: AsyncSession, user_id: int, content_ids: Collection[int]
) -> dict[int, float]:
    ids = list(content_ids)
    if not ids:
        return {}

    total_rows = await session.execute(
        select(Season.conteudo_id, func.count(Episode.id))
        .join(Episode, Episode.temporada_id == Season.id)
        .where(Season.conteudo_id.in_(ids))
        .group_by(Season.conteudo_id)
    )
    total_por_conteudo = dict(total_rows.tuples().all())

    assistidos_rows = await session.execute(
        select(Season.conteudo_id, func.count(UserProgress.id))
        .select_from(UserProgress)
        .join(Episode, UserProgress.episodio_id == Episode.id)
        .join(Season, Episode.temporada_id == Season.id)
        .where(
            UserProgress.usuario_id == user_id,
            UserProgress.status == ProgressStatus.ASSISTIDO,
            Season.conteudo_id.in_(ids),
        )
        .group_by(Season.conteudo_id)
    )
    assistidos_por_conteudo = dict(assistidos_rows.tuples().all())

    filmes_rows = await session.execute(
        select(UserProgress.conteudo_id)
        .where(
            UserProgress.usuario_id == user_id,
            UserProgress.status == ProgressStatus.ASSISTIDO,
            UserProgress.conteudo_id.in_(ids),
        )
        .distinct()
    )
    filmes_assistidos = set(filmes_rows.scalars().all())

    resultado: dict[int, float] = {}
    for conteudo_id in ids:
        total = total_por_conteudo.get(conteudo_id, 0)
        if total > 0:
            resultado[conteudo_id] = 100.0 * assistidos_por_conteudo.get(conteudo_id, 0) / total
        else:
            resultado[conteudo_id] = 100.0 if conteudo_id in filmes_assistidos else 0.0
    return resultado


async def series_progress(session: AsyncSession, user_id: int, content_id: int) -> float:
    return (await progress_by_content(session, user_id, [content_id])).get(content_id, 0.0)
