from app.schemas.base import CamelModel


class GeneroStat(CamelModel):
    genero: str
    quantidade: int


class ContinuarAssistindoItem(CamelModel):
    conteudo_id: int
    titulo_conteudo: str
    imagem_url: str | None
    episodio_id: int
    numero_episodio: int
    numero_temporada: int
    progresso_serie: float


class DashboardOut(CamelModel):
    total_filmes: int
    total_series: int
    episodios_assistidos: int
    filmes_assistidos: int
    progresso_geral: float
    total_horas_assistidas: float
    series_concluidas: int
    series_em_progresso: int
    series_nao_iniciadas: int
    distribuicao_por_genero: list[GeneroStat]
    continuar_assistindo: list[ContinuarAssistindoItem]
