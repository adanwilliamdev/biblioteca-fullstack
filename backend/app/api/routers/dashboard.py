from fastapi import APIRouter, Depends

from app.api.deps import CurrentUser, SessionDep, get_current_user
from app.schemas.dashboard import DashboardOut
from app.services.dashboard import build_dashboard

router = APIRouter(
    prefix="/api/dashboard", tags=["dashboard"], dependencies=[Depends(get_current_user)]
)


@router.get("", response_model=DashboardOut)
async def dashboard(user: CurrentUser, session: SessionDep):
    return await build_dashboard(session, user.id)
