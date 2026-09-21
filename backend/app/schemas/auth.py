from typing import Annotated

from pydantic import AfterValidator

from app.core.security import MAX_PASSWORD_BYTES
from app.models.enums import Role
from app.schemas.base import CamelModel, Email, NonBlank


def _senha_valida(valor: str) -> str:
    if len(valor) < 6:
        raise ValueError("Senha deve ter ao menos 6 caracteres")
    if len(valor.encode()) > MAX_PASSWORD_BYTES:
        raise ValueError(f"Senha deve ter no máximo {MAX_PASSWORD_BYTES} bytes")
    return valor


class RegisterRequest(CamelModel):
    nome: Annotated[str, NonBlank("Nome é obrigatório")]
    email: Email
    senha: Annotated[str, AfterValidator(_senha_valida)]


class LoginRequest(CamelModel):
    email: Email
    senha: Annotated[str, NonBlank("Senha é obrigatória")]


class UserOut(CamelModel):
    id: int
    nome: str
    email: str
    role: Role


class UpdateProfileRequest(CamelModel):
    nome: Annotated[str, NonBlank("Nome é obrigatório")]
