from app.models.enums import ContentType
from app.schemas.base import CamelModel


class TmdbStatus(CamelModel):
    configurado: bool


class TmdbSearchResult(CamelModel):
    tmdb_id: int
    titulo: str
    ano: int | None
    imagem_url: str | None
    sinopse: str | None
    tipo: ContentType
    avaliacao: float | None


class TmdbImportResult(CamelModel):
    conteudo_id: int
    titulo: str
    temporadas_importadas: int
    episodios_importados: int
