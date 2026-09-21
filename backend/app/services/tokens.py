from datetime import timedelta

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.security import generate_refresh_token, utcnow
from app.models import RefreshToken, User


async def create_refresh_token(session: AsyncSession, user: User) -> RefreshToken:
    ttl = timedelta(milliseconds=get_settings().jwt_refresh_expiration_ms)
    token = RefreshToken(
        token=generate_refresh_token(), usuario_id=user.id, expira_em=utcnow() + ttl, revogado=False
    )
    session.add(token)
    await session.flush()
    return token


async def get_valid_user(session: AsyncSession, token_value: str) -> User | None:
    """Usuário dono do refresh token, se ele existir, não estiver revogado nem expirado."""
    row = (
        await session.execute(
            select(RefreshToken, User)
            .join(User, User.id == RefreshToken.usuario_id)
            .where(RefreshToken.token == token_value)
        )
    ).first()
    if row is None:
        return None
    token, user = row
    if token.revogado or token.expira_em < utcnow():
        return None
    return user


async def revoke(session: AsyncSession, token_value: str) -> None:
    await session.execute(
        update(RefreshToken).where(RefreshToken.token == token_value).values(revogado=True)
    )
