# 📚 Biblioteca Fullstack

Sistema web para gerenciamento de biblioteca, com catálogo de títulos, acompanhamento de progresso, dashboard administrativo, autenticação e integração com dados externos.

## 🛠️ Stack

### Frontend

<p>
  <img src="https://img.shields.io/badge/Next.js%2016-000000?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js">
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Tailwind%20CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS">
  <img src="https://img.shields.io/badge/shadcn%2Fui-000000?style=for-the-badge&logo=shadcnui&logoColor=white" alt="shadcn/ui">
  <img src="https://img.shields.io/badge/TanStack%20Query-FF4154?style=for-the-badge&logo=reactquery&logoColor=white" alt="TanStack Query">
</p>

### Backend

<p>
  <img src="https://img.shields.io/badge/Python%203.12+-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python">
  <img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI">
  <img src="https://img.shields.io/badge/Pydantic-E92063?style=for-the-badge&logo=pydantic&logoColor=white" alt="Pydantic">
  <img src="https://img.shields.io/badge/SQLAlchemy-D71F00?style=for-the-badge&logo=sqlalchemy&logoColor=white" alt="SQLAlchemy">
  <img src="https://img.shields.io/badge/Alembic-333333?style=for-the-badge" alt="Alembic">
</p>

### Banco de Dados & Infraestrutura

<p>
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white" alt="Redis">
  <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker">
  <img src="https://img.shields.io/badge/Docker%20Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker Compose">
</p>

## ✨ Funcionalidades

### 📚 Catálogo

* Gerenciamento de títulos
* Cadastro e edição de informações
* Organização do catálogo
* Consulta de títulos
* Controle de temporadas e episódios
* Integração com dados do TMDB

### ▶️ Progresso

* Acompanhamento do progresso de séries
* Controle de episódios assistidos
* Controle de temporadas
* Seção de conteúdos em andamento
* Exibição de progresso agregado

### 📊 Dashboard

* Indicadores gerais da biblioteca
* Estatísticas de progresso
* Dados agregados do catálogo
* Consultas otimizadas para evitar N+1

### 👥 Usuários

O sistema possui diferentes níveis de acesso:

| Perfil  | Permissões                              |
| ------- | --------------------------------------- |
| `USER`  | Acesso às funcionalidades da biblioteca |
| `ADMIN` | Gerenciamento administrativo e catálogo |

### 🔐 Autenticação

* Login e cadastro
* Autenticação baseada em JWT
* Access Tokens
* Refresh Tokens
* Cookies HTTP-only
* Controle de acesso por perfil
* Proteção das rotas administrativas

### 🔎 Integração TMDB

* Importação de informações de títulos
* Importação de temporadas
* Busca de dados externos
* Processamento transacional
* Consultas paralelas de temporadas
* Cache das consultas utilizando Redis

### ⚡ Performance

* Redis para cache
* Cache de dados externos com TTL
* Rate limiting baseado em IP
* Queries agregadas
* Redução de consultas desnecessárias
* Paginação com limite de até 100 registros

## 📁 Estrutura

```text
biblioteca/
│
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── core/
│   │   │   ├── config/
│   │   │   ├── security/
│   │   │   ├── redis/
│   │   │   └── errors/
│   │   │
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/
│   │   ├── api/
│   │   │   └── routers/
│   │   └── scripts/
│   │
│   ├── alembic/
│   │   └── versions/
│   │
│   ├── tests/
│   └── requirements-dev.txt
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── lib/
│   │   └── proxy.ts
│   │
│   └── package.json
│
├── docker-compose.yml
└── README.md
```

## 🐳 Como executar com Docker

Configure as variáveis de ambiente:

```bash
cp .env.example .env
```

Defina um `JWT_SECRET` seguro e execute:

```bash
docker compose up --build
```

### 🌐 Acessos

Frontend:

```text
http://localhost:3000
```

API e Swagger:

```text
http://localhost:8080/docs
```

## 👑 Criando o primeiro administrador

O cadastro cria inicialmente usuários com o perfil `USER`.

Para promover um usuário a administrador:

```bash
docker compose exec backend \
python -m app.scripts.promote_admin seu@email.com
```

## 💻 Execução local

### Pré-requisitos

* Node.js 20.9+
* Python 3.12+
* PostgreSQL
* Redis

PostgreSQL e Redis podem ser iniciados utilizando:

```bash
docker compose up postgres redis
```

### Backend

```bash
cd backend

python -m venv .venv
source .venv/bin/activate

pip install -r requirements-dev.txt

cp .env.example .env

alembic upgrade head

uvicorn app.main:app --reload --port 8080
```

### Frontend

Em outro terminal:

```bash
cd frontend

cp .env.example .env.local

npm install

npm run dev
```

Configure:

```env
API_URL=http://localhost:8080
```

## 🧪 Testes

Os testes de integração utilizam PostgreSQL e Redis.

Banco de testes:

```text
biblioteca_test
```

Redis:

```text
Database 15
```

Para executar:

```bash
createdb -h localhost -U biblioteca biblioteca_test

pytest
```

## 🔐 Segurança

A aplicação utiliza:

* JWT
* Bcrypt
* Cookies HTTP-only
* Controle de acesso baseado em perfil
* Rate limiting por IP
* Refresh Tokens
* Redis para gerenciamento de sessões e cache

O `JWT_SECRET` é obrigatório e deve possuir no mínimo 32 caracteres.

Exemplo para gerar uma chave:

```bash
openssl rand -base64 64
```

## ⚙️ Regras de Negócio

### Administração

Funcionalidades administrativas são disponibilizadas exclusivamente para usuários `ADMIN`.

### Catálogo

Usuários administrativos podem adicionar, editar e excluir títulos, temporadas e episódios.

### Progresso

O sistema calcula o progresso utilizando consultas agregadas para evitar consultas individuais desnecessárias.

### Importação

A importação de dados externos é realizada de forma transacional. Falhas durante a comunicação com o serviço externo são tratadas pela API.

### Continuação

A área de conteúdos em andamento apresenta uma entrada por série, evitando duplicação.

## 🔧 Variáveis de Ambiente

### Backend

Arquivo:

```text
backend/.env.example
```

Principais variáveis:

```env
DATABASE_URL=
REDIS_URL=
JWT_SECRET=
JWT_EXPIRATION_MS=
JWT_REFRESH_EXPIRATION_MS=
APP_CORS_ALLOWED_ORIGINS=
APP_COOKIE_SECURE=
APP_RATE_LIMIT_WINDOW_MS=
APP_RATE_LIMIT_MAX_ATTEMPTS=
APP_TRUST_FORWARDED_FOR=
TMDB_API_KEY=
```

A `TMDB_API_KEY` aceita chave da API v3 ou token v4.

### Frontend

```env
API_URL=
```

A variável `API_URL` é utilizada durante o build do frontend para configurar as rotas da API.

## 🚀 Deploy

A aplicação pode ser implantada utilizando:

* Railway
* Render
* PostgreSQL gerenciado
* Redis gerenciado

A arquitetura de produção utiliza serviços separados para:

```text
Frontend
   ↓
Backend
   ↓
PostgreSQL
   +
Redis
```

No frontend, configure `API_URL` como variável de build apontando para o backend.

No backend:

```env
APP_COOKIE_SECURE=true
```

## 📌 Status

Projeto em desenvolvimento, com arquitetura fullstack baseada em **Next.js, Python e FastAPI**, focada em gerenciamento de biblioteca, autenticação, catálogo, acompanhamento de progresso e dashboard administrativo.
