"""Schema inicial (equivalente à migration Prisma 20260908000000_init).

Mantém os mesmos nomes de tabelas, colunas, enums, índices e constraints do banco
criado pelo Prisma. Se você já tem um banco criado pelo backend NestJS, NÃO rode esta
migration: marque-a como aplicada com `alembic stamp head`.

Revision ID: 0001
Revises:
Create Date: 2026-09-20
"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "0001"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

ts = postgresql.TIMESTAMP(precision=3)
role = postgresql.ENUM("USER", "ADMIN", name="Role", create_type=False)
content_type = postgresql.ENUM("FILME", "SERIE", name="ContentType", create_type=False)
progress_status = postgresql.ENUM("ASSISTIDO", "PENDENTE", name="ProgressStatus", create_type=False)


def upgrade() -> None:
    bind = op.get_bind()
    for enum in (role, content_type, progress_status):
        enum.create(bind, checkfirst=True)

    op.create_table(
        "usuarios",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("email", sa.Text(), nullable=False),
        sa.Column("nome", sa.Text(), nullable=False),
        sa.Column("senha", sa.Text(), nullable=False),
        sa.Column("role", role, server_default="USER", nullable=False),
        sa.Column("criadoEm", ts, server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.PrimaryKeyConstraint("id", name="usuarios_pkey"),
    )
    op.create_index("usuarios_email_key", "usuarios", ["email"], unique=True)

    op.create_table(
        "refresh_tokens",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("token", sa.String(100), nullable=False),
        sa.Column("usuario_id", sa.Integer(), nullable=False),
        sa.Column("expiraEm", ts, nullable=False),
        sa.Column("revogado", sa.Boolean(), server_default=sa.false(), nullable=False),
        sa.Column("criadoEm", ts, server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.PrimaryKeyConstraint("id", name="refresh_tokens_pkey"),
        sa.ForeignKeyConstraint(
            ["usuario_id"], ["usuarios.id"], name="refresh_tokens_usuario_id_fkey",
            ondelete="RESTRICT", onupdate="CASCADE",
        ),
    )  # fmt: skip
    op.create_index("refresh_tokens_token_key", "refresh_tokens", ["token"], unique=True)

    op.create_table(
        "conteudos",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("titulo", sa.Text(), nullable=False),
        sa.Column("sinopse", sa.String(2000), nullable=True),
        sa.Column("genero", sa.Text(), nullable=True),
        sa.Column("ano", sa.Integer(), nullable=True),
        sa.Column("imagemUrl", sa.Text(), nullable=True),
        sa.Column("tipo", content_type, nullable=False),
        sa.Column("assistido", sa.Boolean(), nullable=True),
        sa.Column("criadoEm", ts, server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.PrimaryKeyConstraint("id", name="conteudos_pkey"),
    )

    op.create_table(
        "temporadas",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("numero", sa.Integer(), nullable=False),
        sa.Column("titulo", sa.Text(), nullable=True),
        sa.Column("conteudo_id", sa.Integer(), nullable=False),
        sa.PrimaryKeyConstraint("id", name="temporadas_pkey"),
        sa.ForeignKeyConstraint(
            ["conteudo_id"], ["conteudos.id"], name="temporadas_conteudo_id_fkey",
            ondelete="CASCADE", onupdate="CASCADE",
        ),
    )  # fmt: skip

    op.create_table(
        "episodios",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("numero", sa.Integer(), nullable=False),
        sa.Column("titulo", sa.Text(), nullable=True),
        sa.Column("duracaoMinutos", sa.Integer(), nullable=True),
        sa.Column("temporada_id", sa.Integer(), nullable=False),
        sa.PrimaryKeyConstraint("id", name="episodios_pkey"),
        sa.ForeignKeyConstraint(
            ["temporada_id"], ["temporadas.id"], name="episodios_temporada_id_fkey",
            ondelete="CASCADE", onupdate="CASCADE",
        ),
    )  # fmt: skip

    op.create_table(
        "progresso_usuario",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("usuario_id", sa.Integer(), nullable=False),
        sa.Column("conteudo_id", sa.Integer(), nullable=True),
        sa.Column("episodio_id", sa.Integer(), nullable=True),
        sa.Column("status", progress_status, nullable=False),
        sa.Column("atualizado_em", ts, nullable=True),
        sa.PrimaryKeyConstraint("id", name="progresso_usuario_pkey"),
        sa.ForeignKeyConstraint(
            ["usuario_id"], ["usuarios.id"], name="progresso_usuario_usuario_id_fkey",
            ondelete="RESTRICT", onupdate="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["conteudo_id"], ["conteudos.id"], name="progresso_usuario_conteudo_id_fkey",
            ondelete="CASCADE", onupdate="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["episodio_id"], ["episodios.id"], name="progresso_usuario_episodio_id_fkey",
            ondelete="CASCADE", onupdate="CASCADE",
        ),
    )  # fmt: skip
    op.create_index(
        "progresso_usuario_usuario_id_episodio_id_key",
        "progresso_usuario",
        ["usuario_id", "episodio_id"],
        unique=True,
    )


def downgrade() -> None:
    op.drop_table("progresso_usuario")
    op.drop_table("episodios")
    op.drop_table("temporadas")
    op.drop_table("conteudos")
    op.drop_table("refresh_tokens")
    op.drop_table("usuarios")
    bind = op.get_bind()
    for enum in (progress_status, content_type, role):
        enum.drop(bind, checkfirst=True)
