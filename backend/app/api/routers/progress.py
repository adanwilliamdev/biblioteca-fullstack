from fastapi import APIRouter, Depends

from app.api.deps import CurrentUser, SessionDep, get_current_user
from app.models import ProgressStatus
from app.schemas.catalog import ProgressOut
from app.services import progress

router = APIRouter(
    prefix="/api/progresso", tags=["progress"], dependencies=[Depends(get_current_user)]
)


@router.put("/episodios/{episode_id}", response_model=ProgressOut, response_model_exclude_none=True)
async def mark_episode(
    episode_id: int, status: ProgressStatus, user: CurrentUser, session: SessionDep
):
    return await progress.mark_episode(session, user.id, episode_id, status)


@router.put("/conteudos/{content_id}", response_model=ProgressOut, response_model_exclude_none=True)
async def mark_movie(
    content_id: int, status: ProgressStatus, user: CurrentUser, session: SessionDep
):
    return await progress.mark_movie(session, user.id, content_id, status)
