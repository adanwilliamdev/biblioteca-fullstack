-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "ContentType" AS ENUM ('FILME', 'SERIE');

-- CreateEnum
CREATE TYPE "ProgressStatus" AS ENUM ('ASSISTIDO', 'PENDENTE');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" SERIAL NOT NULL,
    "token" VARCHAR(100) NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "expiraEm" TIMESTAMP(3) NOT NULL,
    "revogado" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conteudos" (
    "id" SERIAL NOT NULL,
    "titulo" TEXT NOT NULL,
    "sinopse" VARCHAR(2000),
    "genero" TEXT,
    "ano" INTEGER,
    "imagemUrl" TEXT,
    "tipo" "ContentType" NOT NULL,
    "assistido" BOOLEAN,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conteudos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "temporadas" (
    "id" SERIAL NOT NULL,
    "numero" INTEGER NOT NULL,
    "titulo" TEXT,
    "conteudo_id" INTEGER NOT NULL,

    CONSTRAINT "temporadas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "episodios" (
    "id" SERIAL NOT NULL,
    "numero" INTEGER NOT NULL,
    "titulo" TEXT,
    "duracaoMinutos" INTEGER,
    "temporada_id" INTEGER NOT NULL,

    CONSTRAINT "episodios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "progresso_usuario" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "conteudo_id" INTEGER,
    "episodio_id" INTEGER,
    "status" "ProgressStatus" NOT NULL,
    "atualizado_em" TIMESTAMP(3),

    CONSTRAINT "progresso_usuario_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "progresso_usuario_usuario_id_episodio_id_key" ON "progresso_usuario"("usuario_id", "episodio_id");

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "temporadas" ADD CONSTRAINT "temporadas_conteudo_id_fkey" FOREIGN KEY ("conteudo_id") REFERENCES "conteudos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "episodios" ADD CONSTRAINT "episodios_temporada_id_fkey" FOREIGN KEY ("temporada_id") REFERENCES "temporadas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progresso_usuario" ADD CONSTRAINT "progresso_usuario_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progresso_usuario" ADD CONSTRAINT "progresso_usuario_conteudo_id_fkey" FOREIGN KEY ("conteudo_id") REFERENCES "conteudos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progresso_usuario" ADD CONSTRAINT "progresso_usuario_episodio_id_fkey" FOREIGN KEY ("episodio_id") REFERENCES "episodios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
