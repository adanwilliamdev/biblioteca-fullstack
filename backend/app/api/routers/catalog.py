from typing import Annotated

from fastapi import APIRouter, Depends, Query, Response, status

from app.api.deps import AdminUser, CurrentUser, SessionDep, get_current_user
from app.models import ContentType
from app.schemas.catalog import (
    ContentDetail,
    ContentOut,
    ContentRequest,
    ContentSummary,
    EpisodeOut,
    EpisodeRequest,
    Page,
    SeasonOut,
    SeasonRequest,
)
from app.services import catalog

router = APIRouter(
    prefix="/api/catalog", tags=["catalog"], dependencies=[Depends(get_current_user)]
)


@router.get("", response_model=Page[ContentSummary])
async def list_content(
    user: CurrentUser,
    session: SessionDep,
    titulo: str | None = None,
    genero: str | None = None,
    ano: int | None = None,
    tipo: ContentType | None = None,
    page: Annotated[int, Query(ge=0)] = 0,
    size: Annotated[int, Query(ge=1, le=100)] = 15,
):
    return await catalog.list_content(
        session, user.id, titulo=titulo, genero=genero, ano=ano, tipo=tipo, page=page, size=size
    )


@router.get("/{content_id}", response_model=ContentDetail)
async def details(content_id: int, user: CurrentUser, session: SessionDep):
    return await catalog.get_details(session, user.id, content_id)


@router.post("", response_model=ContentOut, status_code=status.HTTP_201_CREATED)
async def create(dto: ContentRequest, _: AdminUser, session: SessionDep):
    return await catalog.create_content(session, dto)


@router.put("/{content_id}", response_model=ContentOut)
async def update(content_id: int, dto: ContentRequest, _: AdminUser, session: SessionDep):
    return await catalog.update_content(session, content_id, dto)


@router.delete("/{content_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove(content_id: int, _: AdminUser, session: SessionDep):
    await catalog.delete_content(session, content_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post(
    "/{content_id}/temporadas", response_model=SeasonOut, status_code=status.HTTP_201_CREATED
)
async def add_season(content_id: int, dto: SeasonRequest, _: AdminUser, session: SessionDep):
    return await catalog.add_season(session, content_id, dto)


@router.delete("/temporadas/{season_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_season(season_id: int, _: AdminUser, session: SessionDep):
    await catalog.remove_season(session, season_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post(
    "/temporadas/{season_id}/episodios",
    response_model=EpisodeOut,
    status_code=status.HTTP_201_CREATED,
)
async def add_episode(season_id: int, dto: EpisodeRequest, _: AdminUser, session: SessionDep):
    return await catalog.add_episode(session, season_id, dto)


@router.delete("/episodios/{episode_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_episode(episode_id: int, _: AdminUser, session: SessionDep):
    await catalog.remove_episode(session, episode_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
