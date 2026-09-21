from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import utcnow
from app.models import Content, Episode, ProgressStatus, Season, UserProgress
from app.schemas.catalog import ProgressOut
from app.services.progress_calc import series_progress


async def mark_episode(
    session: AsyncSession, user_id: int, episode_id: int, novo_status: ProgressStatus
) -> ProgressOut:
    row = (
        await session.execute(
            select(Episode.id, Season.id, Season.conteudo_id)
            .join(Season, Season.id == Episode.temporada_id)
            .where(Episode.id == episode_id)
        )
    ).first()
    if row is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Episódio não encontrado")
    _, season_id, content_id = row

    # Upsert atômico sobre a unique (usuario_id, episodio_id): sem corrida entre requisições.
    agora = utcnow()
    stmt = insert(UserProgress).values(
        usuario_id=user_id, episodio_id=episode_id, status=novo_status, atualizado_em=agora
    )
    await session.execute(
        stmt.on_conflict_do_update(
            index_elements=["usuario_id", "episodio_id"],
            set_={"status": novo_status, "atualizado_em": agora},
        )
    )
    await session.commit()

    total_temporada = await session.scalar(
        select(func.count(Episode.id)).where(Episode.temporada_id == season_id)
    )
    assistidos_temporada = await session.scalar(
        select(func.count(UserProgress.id))
        .join(Episode, Episode.id == UserProgress.episodio_id)
        .where(
            UserProgress.usuario_id == user_id,
            UserProgress.status == ProgressStatus.ASSISTIDO,
            Episode.temporada_id == season_id,
        )
    )
    progresso_temporada = (
        100.0 * (assistidos_temporada or 0) / total_temporada if total_temporada else 0.0
    )

    return ProgressOut(
        episodio_id=episode_id,
        conteudo_id=content_id,
        status=novo_status,
        progresso_temporada=progresso_temporada,
        progresso_serie=await series_progress(session, user_id, content_id),
    )


async def mark_movie(
    session: AsyncSession, user_id: int, content_id: int, novo_status: ProgressStatus
) -> ProgressOut:
    if await session.get(Content, content_id) is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Conteúdo não encontrado")

    existente = await session.scalar(
        select(UserProgress)
        .where(UserProgress.usuario_id == user_id, UserProgress.conteudo_id == content_id)
        .order_by(UserProgress.id)
        .limit(1)
    )
    if existente:
        existente.status = novo_status
        existente.atualizado_em = utcnow()
    else:
        session.add(
            UserProgress(
                usuario_id=user_id,
                conteudo_id=content_id,
                status=novo_status,
                atualizado_em=utcnow(),
            )
        )
    await session.commit()

    progresso = 100.0 if novo_status == ProgressStatus.ASSISTIDO else 0.0
    return ProgressOut(
        conteudo_id=content_id,
        status=novo_status,
        progresso_temporada=progresso,
        progresso_serie=progresso,
    )
