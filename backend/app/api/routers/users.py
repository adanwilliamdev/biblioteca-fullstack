from fastapi import APIRouter, Depends

from app.api.deps import CurrentUser, SessionDep, get_current_user
from app.schemas.auth import UpdateProfileRequest, UserOut
from app.services import users

router = APIRouter(prefix="/api/users", tags=["users"], dependencies=[Depends(get_current_user)])


@router.get("/me", response_model=UserOut)
async def me(user: CurrentUser):
    return user


@router.put("/me", response_model=UserOut)
async def update_me(dto: UpdateProfileRequest, user: CurrentUser, session: SessionDep):
    return await users.update_name(session, user, dto.nome)
