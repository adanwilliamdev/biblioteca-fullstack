# 📚 Biblioteca Fullstack

Sistema de gerenciamento de biblioteca desenvolvido com **Node.js, NestJS, Prisma, PostgreSQL e React**.

A aplicação oferece autenticação segura, gerenciamento de usuários e catálogo, controle de progresso, dashboard e integração com a API do **TMDB**.

## 🚀 Funcionalidades

* 🔐 Autenticação com JWT e cookies `httpOnly`
* 🔄 Rotação de Refresh Token
* 👤 Gerenciamento de usuários
* 🛡️ Autorização baseada em roles
* 📚 Gerenciamento de catálogo
* 📊 Controle de progresso e dashboard
* 🎬 Integração com TMDB
* 🚦 Rate limiting
* ⚡ Cache em memória com TTL
* 📖 Swagger
* 🐳 Docker Compose

## 🛠️ Tecnologias

**Backend:** Node.js · NestJS · TypeScript · Prisma · PostgreSQL · JWT

**Frontend:** React · TypeScript · Vite

**Infraestrutura:** Docker · Docker Compose · Railway

## 📂 Estrutura

```text
biblioteca-fullstack-node/
├── backend/          # API NestJS + Prisma
├── frontend/         # React + Vite
├── docker-compose.yml
└── railway.json
```

## ⚙️ Execução

### Backend

```bash
cd backend

cp .env.example .env
npm install

npx prisma generate
npx prisma migrate dev --name init

npm run start:dev
```

### Frontend

```bash
cd frontend

cp .env.example .env
npm install

npm run dev
```

### Docker

```bash
docker compose up --build
```

## 🌐 Acesso

| Serviço    | Endereço                                |
| ---------- | --------------------------------------- |
| Frontend   | `http://localhost:5173`                 |
| Backend    | `http://localhost:8080`                 |
| Swagger    | `http://localhost:8080/swagger-ui.html` |
| PostgreSQL | `localhost:5432`                        |

## 🔐 Segurança

* JWT com cookies `httpOnly`
* Refresh Token com rotação
* Controle de acesso por `ADMIN` / `USER`
* Rate limiting
* Validação de dados
* CORS configurável
* Variáveis sensíveis via `.env`

## 📄 Licença

Projeto desenvolvido para fins de estudo, aprendizado e demonstração de conhecimentos em desenvolvimento Fullstack.
