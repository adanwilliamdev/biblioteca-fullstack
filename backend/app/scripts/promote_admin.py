"""Promove um usuário existente a ADMIN.

Uso (dentro de backend/):
    python -m app.scripts.promote_admin email@exemplo.com

O cadastro pela API sempre cria usuários com role USER; esta é a forma de criar o
primeiro administrador (necessário para cadastrar filmes/séries).
"""

import asyncio
import sys

from sqlalchemy import func, select

from app.core.config import get_settings
from app.db.session import create_engine, create_sessionmaker
from app.models import Role, User


async def main(email: str) -> int:
    engine = create_engine(get_settings().database_url)
    try:
        async with create_sessionmaker(engine)() as session:
            user = await session.scalar(select(User).where(func.lower(User.email) == email.lower()))
            if user is None:
                print(f"Usuário não encontrado: {email} (cadastre-se primeiro pelo app)")
                return 1
            user.role = Role.ADMIN
            await session.commit()
            print(f"{user.email} agora é ADMIN.")
            return 0
    finally:
        await engine.dispose()


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Uso: python -m app.scripts.promote_admin email@exemplo.com")
        sys.exit(2)
    sys.exit(asyncio.run(main(sys.argv[1])))
