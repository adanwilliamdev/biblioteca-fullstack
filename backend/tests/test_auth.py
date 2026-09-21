import pytest

from tests.conftest import register


async def test_register_sets_httponly_cookies_and_hides_tokens(client):
    r = await register(client)
    assert r.status_code == 201
    assert r.json() == {"id": 1, "nome": "Maria", "email": "user@example.com", "role": "USER"}
    set_cookie = r.headers.get_list("set-cookie")
    assert any(c.startswith("access_token=") and "HttpOnly" in c for c in set_cookie)
    assert any(c.startswith("refresh_token=") and "HttpOnly" in c for c in set_cookie)
    assert "access_token" not in r.text and "refresh_token" not in r.text


async def test_register_duplicate_email_is_409_case_insensitive(client):
    await register(client)
    r = await register(client, email="USER@example.com")
    assert r.status_code == 409
    assert r.json()["message"] == "Já existe um usuário cadastrado com este e-mail"


@pytest.mark.parametrize(
    ("payload", "esperado"),
    [
        ({"nome": "", "email": "a@b.co", "senha": "123456"}, "Nome é obrigatório"),
        ({"nome": "A", "email": "nao-e-email", "senha": "123456"}, "E-mail inválido"),
        ({"nome": "A", "email": "a@b.co", "senha": "123"}, "Senha deve ter ao menos 6 caracteres"),
        ({"email": "a@b.co", "senha": "123456"}, "Campo obrigatório: nome"),
    ],
)
async def test_register_validation_errors(client, payload, esperado):
    r = await client.post("/api/auth/register", json=payload)
    assert r.status_code == 400
    assert esperado in r.json()["erros"]


async def test_login_ok_and_wrong_password(client):
    await register(client)
    bad = await client.post(
        "/api/auth/login", json={"email": "user@example.com", "senha": "errada"}
    )
    assert bad.status_code == 401
    assert bad.json()["message"] == "E-mail ou senha inválidos"

    unknown = await client.post("/api/auth/login", json={"email": "x@y.co", "senha": "qualquer"})
    assert unknown.status_code == 401
    assert unknown.json()["message"] == "E-mail ou senha inválidos"

    ok = await client.post(
        "/api/auth/login", json={"email": "USER@example.com", "senha": "segredo1"}
    )
    assert ok.status_code == 200
    assert ok.json()["email"] == "user@example.com"


async def test_protected_routes_require_auth(client):
    for path in ("/api/users/me", "/api/catalog", "/api/dashboard", "/api/tmdb/status"):
        assert (await client.get(path)).status_code == 401


async def test_me_and_update_profile(user_client):
    me = await user_client.get("/api/users/me")
    assert me.status_code == 200 and me.json()["nome"] == "Maria"
    up = await user_client.put("/api/users/me", json={"nome": "Maria Silva"})
    assert up.status_code == 200 and up.json()["nome"] == "Maria Silva"
    assert (await user_client.put("/api/users/me", json={"nome": "  "})).status_code == 400


async def test_bearer_header_works_without_cookie(client, make_client):
    await register(client)
    # Pega o JWT do cookie e usa como Bearer em um cliente sem cookies.
    token = client.cookies.get("access_token")
    other = make_client()
    r = await other.get("/api/users/me", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200


async def test_refresh_rotates_token_and_old_one_is_rejected(client, make_client):
    await register(client)
    old_refresh = client.cookies.get("refresh_token")

    r = await client.post("/api/auth/refresh")
    assert r.status_code == 200
    new_refresh = client.cookies.get("refresh_token")
    assert new_refresh and new_refresh != old_refresh

    # Reapresentar o token antigo (já revogado) falha e limpa os cookies.
    replay = make_client()
    replay.cookies.set("refresh_token", old_refresh)
    r2 = await replay.post("/api/auth/refresh")
    assert r2.status_code == 401
    assert r2.json()["message"] == "Sessão expirada, faça login novamente"
    assert any(
        "refresh_token=" in c and "Max-Age=0" in c for c in r2.headers.get_list("set-cookie")
    )


async def test_refresh_without_cookie_is_401(client):
    assert (await client.post("/api/auth/refresh")).status_code == 401


async def test_logout_revokes_refresh_token(client, make_client):
    await register(client)
    refresh = client.cookies.get("refresh_token")
    r = await client.post("/api/auth/logout")
    assert r.status_code == 204

    reuse = make_client()
    reuse.cookies.set("refresh_token", refresh)
    assert (await reuse.post("/api/auth/refresh")).status_code == 401


async def test_rate_limit_on_login(lifespan_app, client, monkeypatch):
    from app.core.config import get_settings

    monkeypatch.setattr(get_settings(), "app_rate_limit_max_attempts", 3)
    codes = []
    for _ in range(5):
        r = await client.post("/api/auth/login", json={"email": "a@b.co", "senha": "x"})
        codes.append(r.status_code)
    assert codes == [401, 401, 401, 429, 429]
    assert "Retry-After" in r.headers
