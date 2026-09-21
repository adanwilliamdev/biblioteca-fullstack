import httpx
import pytest

from app.core.config import get_settings


def tmdb_handler(calls: list[str]):
    def handler(request: httpx.Request) -> httpx.Response:
        calls.append(request.url.path)
        path = request.url.path
        assert request.url.params["api_key"] == "chave-teste"
        assert request.url.params["language"] == "pt-BR"
        if path == "/3/search/movie":
            return httpx.Response(
                200,
                json={
                    "results": [
                        {
                            "id": 603,
                            "title": "Matrix",
                            "release_date": "1999-03-30",
                            "poster_path": "/p.jpg",
                            "overview": "Neo.",
                            "vote_average": 8.2,
                        },
                        {"id": 1, "release_date": ""},
                    ]
                },
            )
        if path == "/3/tv/1399":
            return httpx.Response(
                200,
                json={
                    "name": "Série X",
                    "first_air_date": "2011-04-17",
                    "overview": "o" * 2500,
                    "genres": [{"name": "Drama"}, {"name": "Fantasia"}],
                    "poster_path": None,
                    "seasons": [
                        {"season_number": 0, "name": "Especiais"},
                        {"season_number": 1, "name": "Temporada 1"},
                    ],
                },
            )
        if path == "/3/tv/1399/season/0":
            return httpx.Response(404, json={})
        if path == "/3/tv/1399/season/1":
            return httpx.Response(
                200,
                json={
                    "episodes": [
                        {"episode_number": 1, "name": "Piloto", "runtime": 58},
                        {"episode_number": 2, "name": "Dois", "runtime": None},
                    ]
                },
            )
        return httpx.Response(404, json={})

    return handler


@pytest.fixture
def tmdb_mock(lifespan_app, monkeypatch):
    calls: list[str] = []
    monkeypatch.setattr(get_settings(), "tmdb_api_key", "chave-teste")
    original = lifespan_app.state.http
    lifespan_app.state.http = httpx.AsyncClient(transport=httpx.MockTransport(tmdb_handler(calls)))
    yield calls
    lifespan_app.state.http = original


async def test_status_and_unconfigured_search(user_client):
    assert (await user_client.get("/api/tmdb/status")).json() == {"configurado": False}
    r = await user_client.get("/api/tmdb/search?query=matrix&tipo=FILME")
    assert r.status_code == 400 and "TMDB_API_KEY" in r.json()["message"]


async def test_search_maps_results_and_caches_in_redis(user_client, tmdb_mock):
    assert (await user_client.get("/api/tmdb/status")).json() == {"configurado": True}
    r = await user_client.get("/api/tmdb/search?query=Matrix&tipo=FILME")
    assert r.status_code == 200
    first, second = r.json()
    assert first == {
        "tmdbId": 603, "titulo": "Matrix", "ano": 1999,
        "imagemUrl": "https://image.tmdb.org/t/p/w500/p.jpg", "sinopse": "Neo.",
        "tipo": "FILME", "avaliacao": 8.2,
    }  # fmt: skip
    assert second["titulo"] == "Sem título" and second["ano"] is None

    again = await user_client.get("/api/tmdb/search?query=matrix&tipo=FILME")  # mesma busca
    assert again.json() == r.json()
    assert tmdb_mock.count("/3/search/movie") == 1  # segunda veio do Redis


async def test_search_upstream_failure_is_502(user_client, lifespan_app, monkeypatch):
    monkeypatch.setattr(get_settings(), "tmdb_api_key", "k")
    original = lifespan_app.state.http
    lifespan_app.state.http = httpx.AsyncClient(
        transport=httpx.MockTransport(lambda req: httpx.Response(500))
    )
    try:
        r = await user_client.get("/api/tmdb/search?query=x&tipo=SERIE")
        assert r.status_code == 502
    finally:
        lifespan_app.state.http = original


async def test_import_series_creates_everything(admin_client, tmdb_mock):
    r = await admin_client.post("/api/tmdb/import?tmdbId=1399&tipo=SERIE")
    assert r.status_code == 200, r.text
    j = r.json()
    assert j["titulo"] == "Série X"
    assert (j["temporadasImportadas"], j["episodiosImportados"]) == (2, 2)

    d = (await admin_client.get(f"/api/catalog/{j['conteudoId']}")).json()
    assert d["genero"] == "Drama, Fantasia" and d["ano"] == 2011
    assert len(d["sinopse"]) == 2000
    seasons = {s["numero"]: s for s in d["temporadas"]}
    assert seasons[0]["episodios"] == []  # temporada 0 falhou no TMDB: entra vazia
    assert [e["duracaoMinutos"] for e in seasons[1]["episodios"]] == [58, None]


async def test_import_unknown_title_is_400(admin_client, tmdb_mock):
    r = await admin_client.post("/api/tmdb/import?tmdbId=42&tipo=FILME")
    assert r.status_code == 400
    assert (await admin_client.get("/api/catalog")).json()["totalElements"] == 0
