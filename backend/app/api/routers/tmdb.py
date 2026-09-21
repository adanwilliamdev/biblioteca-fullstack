from typing import Annotated

from fastapi import APIRouter, Depends, Query

from app.api.deps import AdminUser, SessionDep, SettingsDep, TmdbDep, get_current_user
from app.models import ContentType
from app.schemas.tmdb import TmdbImportResult, TmdbSearchResult, TmdbStatus

router = APIRouter(prefix="/api/tmdb", tags=["tmdb"], dependencies=[Depends(get_current_user)])


@router.get("/status", response_model=TmdbStatus)
async def tmdb_status(settings: SettingsDep):
    return TmdbStatus(configurado=settings.tmdb_configured)


@router.get("/search", response_model=list[TmdbSearchResult])
async def search(tmdb: TmdbDep, query: Annotated[str, Query(min_length=1)], tipo: ContentType):
    return await tmdb.search(query, tipo)


@router.post("/import", response_model=TmdbImportResult)
async def import_title(
    tmdb: TmdbDep,
    _: AdminUser,
    session: SessionDep,
    tmdb_id: Annotated[int, Query(alias="tmdbId")],
    tipo: ContentType,
):
    return await tmdb.import_title(session, tmdb_id, tipo)
