from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import ENUM as PgEnum
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.enums import Role

# Os tipos ENUM são criados pelas migrations do Alembic (create_type=False aqui).
RoleType = PgEnum(Role, name="Role", create_type=False)


class User(Base):
    __tablename__ = "usuarios"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(Text, unique=True)
    nome: Mapped[str] = mapped_column(Text)
    senha: Mapped[str] = mapped_column(Text)
    role: Mapped[Role] = mapped_column(RoleType, server_default=Role.USER.value)
    criado_em: Mapped[datetime] = mapped_column("criadoEm", DateTime, server_default=func.now())


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id: Mapped[int] = mapped_column(primary_key=True)
    token: Mapped[str] = mapped_column(String(100), unique=True)
    usuario_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id", ondelete="RESTRICT"))
    expira_em: Mapped[datetime] = mapped_column("expiraEm", DateTime)
    revogado: Mapped[bool] = mapped_column(Boolean, server_default="false", default=False)
    criado_em: Mapped[datetime] = mapped_column("criadoEm", DateTime, server_default=func.now())
