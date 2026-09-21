import math
from datetime import datetime
from typing import Annotated

from pydantic import AfterValidator

from app.models.enums import ContentType, ProgressStatus
from app.schemas.base import CamelModel, NonBlank, OptionalText


def _sinopse_valida(valor: str | None) -> str | None:
    if valor is not None and len(valor) > 2000:
        raise ValueError("Sinopse deve ter no máximo 2000 caracteres")
    return valor


class ContentRequest(CamelModel):
    titulo: Annotated[str, NonBlank("Título é obrigatório")]
    sinopse: Annotated[OptionalText, AfterValidator(_sinopse_valida)] = None
    genero: OptionalText = None
    ano: int | None = None
    imagem_url: OptionalText = None
    tipo: ContentType


class SeasonRequest(CamelModel):
    numero: int
    titulo: OptionalText = None


class EpisodeRequest(CamelModel):
    numero: int
    titulo: OptionalText = None
    duracao_minutos: int | None = None


class ContentOut(CamelModel):
    id: int
    titulo: str
    sinopse: str | None
    genero: str | None
    ano: int | None
    imagem_url: str | None
    tipo: ContentType
    assistido: bool | None
    criado_em: datetime


class ContentSummary(CamelModel):
    id: int
    titulo: str
    genero: str | None
    ano: int | None
    imagem_url: str | None
    tipo: ContentType
    progresso: float


class EpisodeItem(CamelModel):
    id: int
    numero: int
    titulo: str | None
    duracao_minutos: int | None
    assistido: bool


class SeasonItem(CamelModel):
    id: int
    numero: int
    titulo: str | None
    progresso: float
    episodios: list[EpisodeItem]


class ContentDetail(CamelModel):
    id: int
    titulo: str
    sinopse: str | None
    genero: str | None
    ano: int | None
    imagem_url: str | None
    tipo: ContentType
    progresso: float
    assistido: bool | None = None  # só para filmes
    temporadas: list[SeasonItem] | None = None  # só para séries


class SeasonOut(CamelModel):
    id: int
    numero: int
    titulo: str | None
    conteudo_id: int


class EpisodeOut(CamelModel):
    id: int
    numero: int
    titulo: str | None
    duracao_minutos: int | None
    temporada_id: int


class Page[T](CamelModel):
    """Mesmo formato de página do Spring Data usado no backend original."""

    content: list[T]
    total_elements: int
    total_pages: int
    number: int
    size: int

    @classmethod
    def build(cls, items: list[T], total: int, page: int, size: int) -> "Page[T]":
        return cls(
            content=items,
            total_elements=total,
            total_pages=max(1, math.ceil(total / size)),
            number=page,
            size=size,
        )


class ProgressOut(CamelModel):
    episodio_id: int | None = None
    conteudo_id: int
    status: ProgressStatus
    progresso_temporada: float
    progresso_serie: float
