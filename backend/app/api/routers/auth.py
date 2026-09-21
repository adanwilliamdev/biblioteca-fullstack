from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from fastapi.responses import JSONResponse

from app.api.deps import (
    ACCESS_COOKIE,
    REFRESH_COOKIE,
    SessionDep,
    SettingsDep,
    auth_rate_limit,
)
from app.core.errors import error_body
from app.core.security import create_access_token, verify_password
from app.models import User
from app.schemas.auth import LoginRequest, RegisterRequest, UserOut
from app.services import tokens, users

router = APIRouter(prefix="/api/auth", tags=["auth"])

SESSAO_EXPIRADA = "Sessão expirada, faça login novamente"


def _set_cookie(response: Response, settings, name: str, value: str, max_age_ms: int) -> None:
    response.set_cookie(
        name,
        value,
        max_age=max_age_ms // 1000,
        httponly=True,
        secure=settings.app_cookie_secure,
        samesite="lax",
        path="/",
    )


def _clear_cookies(response: Response, settings) -> None:
    for name in (ACCESS_COOKIE, REFRESH_COOKIE):
        response.set_cookie(
            name, "", max_age=0, httponly=True, secure=settings.app_cookie_secure,
            samesite="lax", path="/",
        )  # fmt: skip


async def _issue_cookies(
    response: Response, session: SessionDep, settings: SettingsDep, user: User
) -> None:
    """Access token (JWT curto) + refresh token opaco, ambos só em cookies httpOnly.

    Nenhum dos dois vai no corpo JSON: JavaScript no navegador não consegue lê-los,
    o que limita o estrago de um eventual XSS.
    """
    refresh = await tokens.create_refresh_token(session, user)
    await session.commit()
    _set_cookie(
        response, settings, ACCESS_COOKIE, create_access_token(user.id), settings.jwt_expiration_ms
    )
    _set_cookie(
        response, settings, REFRESH_COOKIE, refresh.token, settings.jwt_refresh_expiration_ms
    )


@router.post(
    "/register",
    status_code=status.HTTP_201_CREATED,
    response_model=UserOut,
    dependencies=[Depends(auth_rate_limit)],
)
async def register(
    dto: RegisterRequest, response: Response, session: SessionDep, settings: SettingsDep
):
    user = await users.register(session, dto.nome, dto.email, dto.senha)
    await _issue_cookies(response, session, settings, user)
    return user


@router.post("/login", response_model=UserOut, dependencies=[Depends(auth_rate_limit)])
async def login(dto: LoginRequest, response: Response, session: SessionDep, settings: SettingsDep):
    user = await users.get_by_email(session, dto.email)
    if not await verify_password(dto.senha, user.senha if user else None):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "E-mail ou senha inválidos")
    await _issue_cookies(response, session, settings, user)
    return user


@router.post("/refresh", response_model=UserOut)
async def refresh(request: Request, response: Response, session: SessionDep, settings: SettingsDep):
    token_value = request.cookies.get(REFRESH_COOKIE)
    user = await tokens.get_valid_user(session, token_value) if token_value else None
    if user is None:
        # Resposta própria: os cookies inválidos precisam ser limpos junto com o 401.
        falha = JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content=error_body(status.HTTP_401_UNAUTHORIZED, message=SESSAO_EXPIRADA),
        )
        _clear_cookies(falha, settings)
        return falha

    # Rotação: o refresh token usado é revogado e um novo par é emitido.
    await tokens.revoke(session, token_value)
    await _issue_cookies(response, session, settings, user)
    return user


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(request: Request, session: SessionDep, settings: SettingsDep):
    if token_value := request.cookies.get(REFRESH_COOKIE):
        await tokens.revoke(session, token_value)
        await session.commit()
    encerrada = Response(status_code=status.HTTP_204_NO_CONTENT)
    _clear_cookies(encerrada, settings)
    return encerrada
