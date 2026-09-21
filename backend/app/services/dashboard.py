from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Content, ContentType, Episode, ProgressStatus, Season, UserProgress
from app.schemas.dashboard import ContinuarAssistindoItem, DashboardOut, GeneroStat
from app.services.progress_calc import progress_by_content

MAX_CONTINUAR = 5


async def build_dashboard(session: AsyncSession, user_id: int) -> DashboardOut:
    assistido = UserProgress.status == ProgressStatus.ASSISTIDO

    # Todos os conteúdos (id, tipo) — o progresso de cada um sai em 3 queries agregadas.
    conteudos = (await session.execute(select(Content.id, Content.tipo))).tuples().all()
    progresso = await progress_by_content(session, user_id, [c_id for c_id, _ in conteudos])

    total_filmes = sum(1 for _, t in conteudos if t == ContentType.FILME)
    total_series = sum(1 for _, t in conteudos if t == ContentType.SERIE)

    concluidas = em_progresso = nao_iniciadas = 0
    for c_id, tipo in conteudos:
        if tipo != ContentType.SERIE:
            continue
        p = progresso[c_id]
        if p >= 100.0:
            concluidas += 1
        elif p > 0.0:
            em_progresso += 1
        else:
            nao_iniciadas += 1

    progresso_geral = (sum(progresso.values()) / len(conteudos)) if conteudos else 0.0

    episodios_assistidos = await session.scalar(
        select(func.count(UserProgress.id)).where(
            UserProgress.usuario_id == user_id, assistido, UserProgress.episodio_id.is_not(None)
        )
    )
    filmes_assistidos = await session.scalar(
        select(func.count(UserProgress.id)).where(
            UserProgress.usuario_id == user_id, assistido, UserProgress.conteudo_id.is_not(None)
        )
    )
    minutos = await session.scalar(
        select(func.coalesce(func.sum(Episode.duracao_minutos), 0))
        .select_from(UserProgress)
        .join(Episode, Episode.id == UserProgress.episodio_id)
        .where(UserProgress.usuario_id == user_id, assistido)
    )

    generos = (
        (
            await session.execute(
                select(Content.genero, func.count(Content.id))
                .where(Content.genero.is_not(None))
                .group_by(Content.genero)
                .order_by(func.count(Content.id).desc(), Content.genero)
            )
        )
        .tuples()
        .all()
    )

    # "Continuar assistindo": último episódio marcado de cada série, mais recentes primeiro.
    recentes = (
        (
            await session.execute(
                select(
                    Content.id,
                    Content.titulo,
                    Content.imagem_url,
                    Episode.id,
                    Episode.numero,
                    Season.numero,
                )
                .select_from(UserProgress)
                .join(Episode, Episode.id == UserProgress.episodio_id)
                .join(Season, Season.id == Episode.temporada_id)
                .join(Content, Content.id == Season.conteudo_id)
                .where(UserProgress.usuario_id == user_id, assistido)
                .order_by(UserProgress.atualizado_em.desc().nulls_last(), UserProgress.id.desc())
                .limit(50)
            )
        )
        .tuples()
        .all()
    )

    continuar: list[ContinuarAssistindoItem] = []
    vistos: set[int] = set()
    for c_id, titulo, imagem, ep_id, ep_num, temp_num in recentes:
        if c_id in vistos:
            continue
        vistos.add(c_id)
        continuar.append(
            ContinuarAssistindoItem(
                conteudo_id=c_id,
                titulo_conteudo=titulo,
                imagem_url=imagem,
                episodio_id=ep_id,
                numero_episodio=ep_num,
                numero_temporada=temp_num,
                progresso_serie=progresso.get(c_id, 0.0),
            )
        )
        if len(continuar) >= MAX_CONTINUAR:
            break

    return DashboardOut(
        total_filmes=total_filmes,
        total_series=total_series,
        episodios_assistidos=episodios_assistidos or 0,
        filmes_assistidos=filmes_assistidos or 0,
        progresso_geral=progresso_geral,
        total_horas_assistidas=float(minutos or 0) / 60.0,
        series_concluidas=concluidas,
        series_em_progresso=em_progresso,
        series_nao_iniciadas=nao_iniciadas,
        distribuicao_por_genero=[GeneroStat(genero=g, quantidade=q) for g, q in generos],
        continuar_assistindo=continuar,
    )
