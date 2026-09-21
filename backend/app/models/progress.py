from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import ENUM as PgEnum
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.enums import ProgressStatus

ProgressStatusType = PgEnum(ProgressStatus, name="ProgressStatus", create_type=False)


class UserProgress(Base):
    """Progresso do usuário: uma linha por episódio (séries) ou por conteúdo (filmes)."""

    __tablename__ = "progresso_usuario"
    __table_args__ = (
        UniqueConstraint(
            "usuario_id", "episodio_id", name="progresso_usuario_usuario_id_episodio_id_key"
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    usuario_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id", ondelete="RESTRICT"))
    conteudo_id: Mapped[int | None] = mapped_column(ForeignKey("conteudos.id", ondelete="CASCADE"))
    episodio_id: Mapped[int | None] = mapped_column(ForeignKey("episodios.id", ondelete="CASCADE"))
    status: Mapped[ProgressStatus] = mapped_column(ProgressStatusType)
    atualizado_em: Mapped[datetime | None] = mapped_column("atualizado_em", DateTime)
