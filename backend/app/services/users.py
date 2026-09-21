from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password
from app.models import Role, User


async def get_by_email(session: AsyncSession, email: str) -> User | None:
    # Comparação sem diferenciar maiúsculas: bases antigas podem ter e-mails com caixa mista.
    return await session.scalar(select(User).where(func.lower(User.email) == email.lower()))


async def register(session: AsyncSession, nome: str, email: str, senha: str) -> User:
    if await get_by_email(session, email):
        raise HTTPException(
            status.HTTP_409_CONFLICT, "Já existe um usuário cadastrado com este e-mail"
        )
    user = User(nome=nome, email=email, senha=await hash_password(senha), role=Role.USER)
    session.add(user)
    try:
        await session.commit()
    except IntegrityError:
        await session.rollback()
        raise HTTPException(
            status.HTTP_409_CONFLICT, "Já existe um usuário cadastrado com este e-mail"
        ) from None
    return user


async def update_name(session: AsyncSession, user: User, nome: str) -> User:
    user.nome = nome
    await session.commit()
    return user
