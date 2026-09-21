from collections.abc import Callable
from typing import Annotated

from email_validator import EmailNotValidError, validate_email
from pydantic import AfterValidator, BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class CamelModel(BaseModel):
    """Campos em snake_case no Python, camelCase no JSON (contrato da API original)."""

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, from_attributes=True)


def _nao_vazio(mensagem: str) -> Callable[[str], str]:
    def validar(valor: str) -> str:
        if not valor.strip():
            raise ValueError(mensagem)
        return valor.strip()

    return validar


def NonBlank(mensagem: str) -> AfterValidator:  # noqa: N802 - usado como tipo em Annotated
    return AfterValidator(_nao_vazio(mensagem))


def _validar_email(valor: str) -> str:
    try:
        return validate_email(valor.strip(), check_deliverability=False).normalized.lower()
    except EmailNotValidError as exc:
        raise ValueError("E-mail inválido") from exc


Email = Annotated[str, AfterValidator(_validar_email)]


def _vazio_para_none(valor: str | None) -> str | None:
    if valor is None:
        return None
    valor = valor.strip()
    return valor or None


OptionalText = Annotated[str | None, AfterValidator(_vazio_para_none)]
