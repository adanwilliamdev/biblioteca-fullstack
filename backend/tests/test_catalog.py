import pytest


async def make_series(admin, titulo="Dark", eps=3, genero="Ficção", ano=2017):
    r = await admin.post(
        "/api/catalog",
        json={"titulo": titulo, "tipo": "SERIE", "genero": genero, "ano": ano, "sinopse": "s"},
    )
    assert r.status_code == 201, r.text
    cid = r.json()["id"]
    season = (await admin.post(f"/api/catalog/{cid}/temporadas", json={"numero": 1})).json()
    ep_ids = []
    for n in range(1, eps + 1):
        ep = await admin.post(
            f"/api/catalog/temporadas/{season['id']}/episodios",
            json={"numero": n, "titulo": f"Ep {n}", "duracaoMinutos": 60},
        )
        assert ep.status_code == 201
        ep_ids.append(ep.json()["id"])
    return cid, season["id"], ep_ids


async def test_non_admin_cannot_write(user_client):
    body = {"titulo": "X", "tipo": "FILME"}
    r = await user_client.post("/api/catalog", json=body)
    assert r.status_code == 403
    assert r.json()["message"] == "Você não tem permissão para executar esta ação"
    assert (await user_client.put("/api/catalog/1", json=body)).status_code == 403
    assert (await user_client.delete("/api/catalog/1")).status_code == 403
    assert (await user_client.post("/api/tmdb/import?tmdbId=1&tipo=FILME")).status_code == 403


async def test_create_validates_and_normalizes(admin_client):
    bad = await admin_client.post("/api/catalog", json={"titulo": " ", "tipo": "FILME"})
    assert bad.status_code == 400 and "Título é obrigatório" in bad.json()["erros"]
    bad_tipo = await admin_client.post("/api/catalog", json={"titulo": "X", "tipo": "JOGO"})
    assert bad_tipo.status_code == 400

    r = await admin_client.post(
        "/api/catalog",
        json={"titulo": "  Matrix ", "tipo": "FILME", "sinopse": "", "genero": "", "ano": 1999},
    )
    assert r.status_code == 201
    j = r.json()
    assert j["titulo"] == "Matrix" and j["sinopse"] is None and j["genero"] is None
    assert j["imagemUrl"] is None and j["assistido"] is False and "criadoEm" in j


async def test_list_filters_pagination_and_progress(admin_client):
    for i in range(5):
        await admin_client.post(
            "/api/catalog",
            json={"titulo": f"Filme {i}", "tipo": "FILME", "genero": "Ação", "ano": 2000 + i},
        )
    await admin_client.post("/api/catalog", json={"titulo": "100% Real_", "tipo": "SERIE"})

    r = await admin_client.get("/api/catalog?size=4&page=1")
    j = r.json()
    assert j["totalElements"] == 6 and j["totalPages"] == 2 and j["number"] == 1
    assert len(j["content"]) == 2

    assert (await admin_client.get("/api/catalog?titulo=filme 3")).json()["totalElements"] == 1
    assert (await admin_client.get("/api/catalog?genero=ação")).json()["totalElements"] == 5
    assert (await admin_client.get("/api/catalog?ano=2002")).json()["totalElements"] == 1
    assert (await admin_client.get("/api/catalog?tipo=SERIE")).json()["totalElements"] == 1
    # caracteres especiais de LIKE são tratados como texto
    assert (await admin_client.get("/api/catalog?titulo=100%25")).json()["totalElements"] == 1
    assert (await admin_client.get("/api/catalog?titulo=%25")).json()["totalElements"] == 1
    empty = (await admin_client.get("/api/catalog?titulo=zzz")).json()
    assert empty["content"] == [] and empty["totalPages"] == 1
    assert (await admin_client.get("/api/catalog?size=0")).status_code == 400


async def test_series_progress_flow(admin_client):
    cid, season_id, eps = await make_series(admin_client, eps=4)

    detail = (await admin_client.get(f"/api/catalog/{cid}")).json()
    assert detail["progresso"] == 0 and detail["assistido"] is None
    assert [e["numero"] for e in detail["temporadas"][0]["episodios"]] == [1, 2, 3, 4]

    r = await admin_client.put(f"/api/progresso/episodios/{eps[0]}?status=ASSISTIDO")
    assert r.status_code == 200
    assert r.json() == {
        "episodioId": eps[0], "conteudoId": cid, "status": "ASSISTIDO",
        "progressoTemporada": 25.0, "progressoSerie": 25.0,
    }  # fmt: skip
    # idempotente (upsert) e desfazível
    await admin_client.put(f"/api/progresso/episodios/{eps[0]}?status=ASSISTIDO")
    await admin_client.put(f"/api/progresso/episodios/{eps[1]}?status=ASSISTIDO")

    detail = (await admin_client.get(f"/api/catalog/{cid}")).json()
    assert detail["progresso"] == 50.0
    assert detail["temporadas"][0]["progresso"] == 50.0
    assert [e["assistido"] for e in detail["temporadas"][0]["episodios"]] == [
        True,
        True,
        False,
        False,
    ]

    listed = (await admin_client.get("/api/catalog")).json()["content"][0]
    assert listed["progresso"] == 50.0

    undo = await admin_client.put(f"/api/progresso/episodios/{eps[1]}?status=PENDENTE")
    assert undo.json()["progressoSerie"] == 25.0

    assert (
        await admin_client.put("/api/progresso/episodios/9999?status=ASSISTIDO")
    ).status_code == 404
    assert (
        await admin_client.put(f"/api/progresso/episodios/{eps[0]}?status=XYZ")
    ).status_code == 400


async def test_progress_is_per_user(admin_client, make_client):
    cid, _, eps = await make_series(admin_client, eps=2)
    await admin_client.put(f"/api/progresso/episodios/{eps[0]}?status=ASSISTIDO")

    other = make_client()
    await other.post(
        "/api/auth/register", json={"nome": "B", "email": "b@example.com", "senha": "123456"}
    )
    assert (await other.get(f"/api/catalog/{cid}")).json()["progresso"] == 0
    assert (await admin_client.get(f"/api/catalog/{cid}")).json()["progresso"] == 50.0


async def test_movie_progress(admin_client):
    r = await admin_client.post("/api/catalog", json={"titulo": "Matrix", "tipo": "FILME"})
    cid = r.json()["id"]

    marked = await admin_client.put(f"/api/progresso/conteudos/{cid}?status=ASSISTIDO")
    assert marked.json() == {
        "conteudoId": cid,
        "status": "ASSISTIDO",
        "progressoTemporada": 100.0,
        "progressoSerie": 100.0,
    }
    d = (await admin_client.get(f"/api/catalog/{cid}")).json()
    assert d["assistido"] is True and d["progresso"] == 100.0 and d["temporadas"] is None

    await admin_client.put(f"/api/progresso/conteudos/{cid}?status=PENDENTE")
    d = (await admin_client.get(f"/api/catalog/{cid}")).json()
    assert d["assistido"] is False and d["progresso"] == 0.0
    assert (
        await admin_client.put("/api/progresso/conteudos/999?status=ASSISTIDO")
    ).status_code == 404


async def test_update_and_delete_cascade(admin_client):
    cid, _, eps = await make_series(admin_client, eps=2)
    await admin_client.put(f"/api/progresso/episodios/{eps[0]}?status=ASSISTIDO")

    up = await admin_client.put(
        f"/api/catalog/{cid}", json={"titulo": "Dark 2", "tipo": "SERIE", "ano": 2019}
    )
    assert up.status_code == 200 and up.json()["titulo"] == "Dark 2" and up.json()["genero"] is None

    assert (await admin_client.delete(f"/api/catalog/{cid}")).status_code == 204
    assert (await admin_client.get(f"/api/catalog/{cid}")).status_code == 404
    assert (await admin_client.delete(f"/api/catalog/{cid}")).status_code == 404
    # episódios e progresso foram removidos em cascata
    assert (
        await admin_client.put(f"/api/progresso/episodios/{eps[0]}?status=ASSISTIDO")
    ).status_code == 404


async def test_remove_season_and_episode(admin_client):
    cid, season_id, eps = await make_series(admin_client, eps=2)
    assert (await admin_client.delete(f"/api/catalog/episodios/{eps[0]}")).status_code == 204
    assert (await admin_client.delete(f"/api/catalog/episodios/{eps[0]}")).status_code == 404
    d = (await admin_client.get(f"/api/catalog/{cid}")).json()
    assert len(d["temporadas"][0]["episodios"]) == 1
    assert (await admin_client.delete(f"/api/catalog/temporadas/{season_id}")).status_code == 204
    assert (await admin_client.get(f"/api/catalog/{cid}")).json()["temporadas"] == []
    assert (
        await admin_client.post("/api/catalog/999/temporadas", json={"numero": 1})
    ).status_code == 404
    assert (
        await admin_client.post("/api/catalog/temporadas/999/episodios", json={"numero": 1})
    ).status_code == 404


async def test_dashboard(admin_client):
    empty = (await admin_client.get("/api/dashboard")).json()
    assert empty["progressoGeral"] == 0 and empty["continuarAssistindo"] == []

    s1, _, e1 = await make_series(admin_client, "Serie A", eps=2, genero="Drama")
    s2, _, e2 = await make_series(admin_client, "Serie B", eps=2, genero="Drama")
    await make_series(admin_client, "Serie C", eps=1, genero="Comédia")
    filme = (
        await admin_client.post(
            "/api/catalog", json={"titulo": "F", "tipo": "FILME", "genero": "Drama"}
        )
    ).json()["id"]

    for ep in e1:  # Serie A concluída
        await admin_client.put(f"/api/progresso/episodios/{ep}?status=ASSISTIDO")
    await admin_client.put(f"/api/progresso/episodios/{e2[0]}?status=ASSISTIDO")  # B em progresso
    await admin_client.put(f"/api/progresso/conteudos/{filme}?status=ASSISTIDO")

    d = (await admin_client.get("/api/dashboard")).json()
    assert d["totalFilmes"] == 1 and d["totalSeries"] == 3
    assert (d["seriesConcluidas"], d["seriesEmProgresso"], d["seriesNaoIniciadas"]) == (1, 1, 1)
    assert d["episodiosAssistidos"] == 3 and d["filmesAssistidos"] == 1
    assert d["totalHorasAssistidas"] == pytest.approx(3.0)  # 3 episódios x 60 min
    # progresso geral = média de (100, 50, 0, 100) = 62.5
    assert d["progressoGeral"] == pytest.approx(62.5)
    assert d["distribuicaoPorGenero"][0] == {"genero": "Drama", "quantidade": 3}
    # uma entrada por série, mais recente primeiro
    assert [i["tituloConteudo"] for i in d["continuarAssistindo"]] == ["Serie B", "Serie A"]
    assert d["continuarAssistindo"][0]["progressoSerie"] == 50.0
