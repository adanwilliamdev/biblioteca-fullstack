import logging
from datetime import UTC, datetime
from typing import Any

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

logger = logging.getLogger("app.errors")

FORBIDDEN_MESSAGE = "Você não tem permissão para executar esta ação"
INTERNAL_MESSAGE = "Ocorreu um erro inesperado. Tente novamente mais tarde."


def error_body(status: int, **extra: Any) -> dict[str, Any]:
    return {"timestamp": datetime.now(UTC).isoformat(), "status": status, **extra}


def _campo(loc: tuple[Any, ...]) -> str:
    return ".".join(str(p) for p in loc if p not in ("body", "query", "path"))


def _formatar_erro(err: dict[str, Any]) -> str:
    tipo = err["type"]
    campo = _campo(err["loc"])
    if tipo == "value_error":
        # Mensagens que escrevemos nos validators já estão em português.
        return str(err["msg"]).removeprefix("Value error, ")
    if tipo == "missing":
        return f"Campo obrigatório: {campo}"
    if tipo in ("enum", "literal_error"):
        return f"Valor inválido para '{campo}'"
    if tipo in ("int_parsing", "int_type"):
        return f"'{campo}' deve ser um número inteiro"
    if tipo.startswith("string_too_long"):
        return f"'{campo}' excede o tamanho máximo permitido"
    if tipo.startswith("greater_than") or tipo.startswith("less_than"):
        return f"'{campo}' está fora do intervalo permitido"
    return f"{campo}: {err['msg']}"


def register_exception_handlers(app: FastAPI) -> None:
    """Formato de erro compatível com o GlobalExceptionFilter original:

    - validação -> 400 {timestamp, status, erros: [...]}
    - demais    -> {timestamp, status, message}
    """

    @app.exception_handler(RequestValidationError)
    async def _validation(_: Request, exc: RequestValidationError) -> JSONResponse:
        erros = [_formatar_erro(e) for e in exc.errors()]
        # "message" facilita a exibição direta no frontend.
        return JSONResponse(
            status_code=400, content=error_body(400, erros=erros, message=", ".join(erros))
        )

    @app.exception_handler(StarletteHTTPException)
    async def _http(_: Request, exc: StarletteHTTPException) -> JSONResponse:
        message = FORBIDDEN_MESSAGE if exc.status_code == 403 else str(exc.detail)
        return JSONResponse(
            status_code=exc.status_code,
            content=error_body(exc.status_code, message=message),
            headers=getattr(exc, "headers", None),
        )

    @app.exception_handler(Exception)
    async def _unexpected(_: Request, exc: Exception) -> JSONResponse:
        logger.exception("Erro inesperado ao processar requisição", exc_info=exc)
        return JSONResponse(status_code=500, content=error_body(500, message=INTERNAL_MESSAGE))
