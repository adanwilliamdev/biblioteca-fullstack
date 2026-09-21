import enum


class Role(enum.StrEnum):
    USER = "USER"
    ADMIN = "ADMIN"


class ContentType(enum.StrEnum):
    FILME = "FILME"
    SERIE = "SERIE"


class ProgressStatus(enum.StrEnum):
    ASSISTIDO = "ASSISTIDO"
    PENDENTE = "PENDENTE"
