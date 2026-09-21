from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import ENUM as PgEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import ContentType

ContentTypeType = PgEnum(ContentType, name="ContentType", create_type=False)


class Content(Base):
    __tablename__ = "conteudos"

    id: Mapped[int] = mapped_column(primary_key=True)
    titulo: Mapped[str] = mapped_column(Text)
    sinopse: Mapped[str | None] = mapped_column(String(2000))
    genero: Mapped[str | None] = mapped_column(Text)
    ano: Mapped[int | None] = mapped_column(Integer)
    imagem_url: Mapped[str | None] = mapped_column("imagemUrl", Text)
    tipo: Mapped[ContentType] = mapped_column(ContentTypeType)
    # Coluna legada (o progresso real fica em progresso_usuario); mantida por compatibilidade.
    assistido: Mapped[bool | None] = mapped_column(Boolean)
    criado_em: Mapped[datetime] = mapped_column("criadoEm", DateTime, server_default=func.now())

    temporadas: Mapped[list["Season"]] = relationship(
        back_populates="conteudo", passive_deletes=True, order_by="Season.numero"
    )


class Season(Base):
    __tablename__ = "temporadas"

    id: Mapped[int] = mapped_column(primary_key=True)
    numero: Mapped[int] = mapped_column(Integer)
    titulo: Mapped[str | None] = mapped_column(Text)
    conteudo_id: Mapped[int] = mapped_column(ForeignKey("conteudos.id", ondelete="CASCADE"))

    conteudo: Mapped[Content] = relationship(back_populates="temporadas")
    episodios: Mapped[list["Episode"]] = relationship(
        back_populates="temporada", passive_deletes=True, order_by="Episode.numero"
    )


class Episode(Base):
    __tablename__ = "episodios"

    id: Mapped[int] = mapped_column(primary_key=True)
    numero: Mapped[int] = mapped_column(Integer)
    titulo: Mapped[str | None] = mapped_column(Text)
    duracao_minutos: Mapped[int | None] = mapped_column("duracaoMinutos", Integer)
    temporada_id: Mapped[int] = mapped_column(ForeignKey("temporadas.id", ondelete="CASCADE"))

    temporada: Mapped[Season] = relationship(back_populates="episodios")
