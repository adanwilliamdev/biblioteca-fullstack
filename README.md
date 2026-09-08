# Biblioteca Fullstack — versão Node.js

Conversão do backend original em **Java/Spring Boot** para **Node.js** usando
**NestJS** (framework) e **Prisma** (ORM), mantendo a mesma API REST, o mesmo
banco PostgreSQL e o mesmo frontend React/TypeScript (que já era Node.js e não
precisou de nenhuma alteração).

## O que foi convertido

| Java / Spring Boot            | Node.js / NestJS               |
|--------------------------------|---------------------------------|
| Spring Boot + Maven            | NestJS + npm                    |
| Spring Data JPA / Hibernate    | Prisma ORM                      |
| Spring Security + JWT (jjwt)   | Passport JWT + `@nestjs/jwt`    |
| `OncePerRequestFilter`         | Middleware / Guards do Nest     |
| Bean Validation (`jakarta.validation`) | `class-validator`        |
| `@RestControllerAdvice`        | `ExceptionFilter` global        |
| Cache em memória (`ConcurrentMapCacheManager`) | Cache próprio em memória (Map + TTL) |
| Springdoc / Swagger UI         | `@nestjs/swagger`                |

Todos os endpoints (`/api/auth/*`, `/api/users/*`, `/api/catalog/*`,
`/api/progresso/*`, `/api/dashboard`, `/api/tmdb/*`), o fluxo de autenticação
via cookies httpOnly com rotação de refresh token, o rate limiting de
login/registro e as regras de negócio (cálculo de progresso, importação do
TMDB etc.) foram reproduzidos fielmente.

O **frontend não precisou de nenhuma mudança** — ele já consome a API por HTTP
e o formato das respostas foi mantido compatível.

## Estrutura

```
biblioteca-fullstack-node/
├── backend/         # API Node.js (NestJS + Prisma)
├── frontend/         # React + Vite (inalterado)
├── docker-compose.yml
└── railway.json
```

## Rodando localmente (sem Docker)

### 1. Banco de dados

Suba um Postgres localmente (ou use o `docker-compose.yml` só para o serviço
`postgres`):

```bash
docker compose up -d postgres
```

### 2. Backend

```bash
cd backend
cp .env.example .env
# edite o .env e defina JWT_SECRET (gere um com: openssl rand -base64 64)

npm install
npx prisma generate      # gera o Prisma Client a partir do schema.prisma
npx prisma migrate dev --name init   # cria as tabelas no Postgres

npm run start:dev
```

> **Importante:** os comandos `prisma generate` e `prisma migrate` baixam um
> binário do "query engine" na primeira execução. Isso exige acesso normal à
> internet (ao domínio `binaries.prisma.sh`) — rode-os numa máquina/ambiente
> sem bloqueios de rede incomuns. Este projeto foi montado num sandbox que
> bloqueia esse domínio, então essa etapa não pôde ser validada
> automaticamente aqui, mas é o fluxo padrão de qualquer projeto Prisma.

O servidor sobe em `http://localhost:8080`, com Swagger em
`http://localhost:8080/swagger-ui.html`.

### 3. Frontend

```bash
cd frontend
cp .env.example .env   # já aponta para http://localhost:8080/api
npm install
npm run dev
```

## Rodando com Docker Compose

```bash
export JWT_SECRET=$(openssl rand -base64 64)
docker compose up --build
```

- Frontend: http://localhost:5173
- Backend: http://localhost:8080
- Postgres: localhost:5432

O container do backend roda `prisma migrate deploy` automaticamente antes de
iniciar o servidor (ver `backend/Dockerfile`), então as tabelas são criadas
sozinhas no primeiro start.

## Variáveis de ambiente do backend

Veja `backend/.env.example` para a lista completa (JWT, CORS, rate limit,
TMDB, etc.) — os nomes e os valores padrão são os mesmos da versão Java
(`application.yml`), exceto pela adição de `DATABASE_URL`, que substitui as
variáveis `DB_HOST/DB_PORT/DB_NAME/DB_USER/DB_PASSWORD` (formato exigido pelo
Prisma).

## Observações sobre a conversão

- **Autenticação**: mesmo esquema de cookies httpOnly (`access_token` /
  `refresh_token`), mesma rotação de refresh token, mesmo rate limiting por
  IP em `/api/auth/login` e `/api/auth/register`.
- **Autorização**: rotas de escrita do catálogo e importação do TMDB exigem
  `role = ADMIN`, via um guard equivalente a `@PreAuthorize("hasRole('ADMIN')")`.
- **Progresso e dashboard**: a lógica de cálculo de progresso por lote (evitar
  N+1) foi mantida, ainda que a forma de agregação em Prisma seja um pouco
  diferente das queries JPQL originais.
- **Exclusão em cascata**: no Java isso era feito manualmente (deletando
  registros de progresso antes do conteúdo/temporada/episódio). No Prisma,
  isso agora é resolvido diretamente no schema com `onDelete: Cascade`.
