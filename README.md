<div align="center">

# 📚 Minha Biblioteca

### Gerenciador de Filmes e Séries

Aplicação **Full Stack** para catalogar filmes e séries, acompanhar o progresso de episódios e visualizar estatísticas através de um dashboard moderno.

![Java](https://img.shields.io/badge/Java-17-ED8B00?style=for-the-badge\&logo=openjdk\&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-3-6DB33F?style=for-the-badge\&logo=springboot\&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge\&logo=react\&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge\&logo=typescript\&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge\&logo=postgresql\&logoColor=white)

</div>

---

# 📖 Sobre o Projeto

O **Minha Biblioteca** é um sistema full-stack desenvolvido para gerenciamento de filmes e séries.

A aplicação permite organizar uma biblioteca pessoal, acompanhar episódios assistidos, importar conteúdos automaticamente através da API do **TMDB** e visualizar estatísticas de consumo em um dashboard.

O projeto foi desenvolvido com foco em:

* Arquitetura Full Stack
* APIs REST
* Autenticação e autorização
* Integração com APIs externas
* Persistência de dados
* Gerenciamento de estado
* Containerização
* Experiência de usuário

---

# ✨ Funcionalidades

## 🎬 Catálogo

* Cadastro manual de filmes e séries
* Importação automática através do TMDB
* Busca por título
* Filtros por gênero, ano e tipo
* Paginação

## 📺 Controle de Progresso

* Marcação de filmes como assistidos
* Controle individual de episódios
* Controle de temporadas
* Cálculo automático de progresso
* Acompanhamento de conteúdos em andamento

## 📊 Dashboard

O dashboard apresenta informações como:

* 🎬 Filmes cadastrados
* 📺 Séries cadastradas
* ⏱️ Horas assistidas
* 🎞️ Episódios assistidos
* 📈 Progresso geral
* 🎭 Distribuição por gênero
* ▶️ Conteúdos para continuar assistindo

## 👤 Usuários

* Cadastro de usuários
* Login
* Autenticação JWT
* Perfil do usuário
* Controle de permissões
* Roles de acesso

## ⚙️ Administração

Área administrativa para gerenciamento de:

* Filmes
* Séries
* Temporadas
* Episódios
* Usuários

---

# 🛠️ Tecnologias

## Backend

| Tecnologia          | Utilização                    |
| ------------------- | ----------------------------- |
| **Java 17**         | Linguagem principal           |
| **Spring Boot 3**   | Framework backend             |
| **Spring Security** | Autenticação e autorização    |
| **Spring Data JPA** | Persistência de dados         |
| **Hibernate**       | ORM                           |
| **PostgreSQL**      | Banco de dados                |
| **JWT**             | Autenticação stateless        |
| **Maven**           | Gerenciamento de dependências |

## Frontend

| Tecnologia       | Utilização               |
| ---------------- | ------------------------ |
| **React 18**     | Interface de usuário     |
| **TypeScript**   | Tipagem estática         |
| **Vite**         | Build e desenvolvimento  |
| **React Router** | Roteamento               |
| **Recharts**     | Gráficos e visualizações |

## DevOps

* Docker
* Docker Compose

---

# 🏗️ Arquitetura

A aplicação é dividida em duas principais camadas:

```text
                    ┌─────────────────┐
                    │    Frontend     │
                    │ React + TS      │
                    └────────┬────────┘
                             │
                             │ HTTP / REST
                             ▼
                    ┌─────────────────┐
                    │     Backend     │
                    │ Spring Boot     │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
        ┌──────────┐   ┌──────────┐   ┌──────────┐
        │PostgreSQL│   │   TMDB   │   │   JWT    │
        │          │   │   API    │   │ Security │
        └──────────┘   └──────────┘   └──────────┘
```

---

# 📂 Estrutura do Projeto

```text
.
├── backend/
│   ├── src/
│   ├── pom.xml
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   ├── package.json
│   └── Dockerfile
│
├── docker-compose.yml
└── README.md
```

---

# 🚀 Executando o Projeto

## 🐳 Docker

A forma recomendada para executar o projeto é utilizando Docker Compose.

Antes de subir os containers, crie o arquivo `.env` na raiz do projeto a partir do
`.env.example` e defina um `JWT_SECRET` (o Compose recusa subir sem essa variável):

```bash
cp .env.example .env
# gere uma chave forte, por exemplo:
openssl rand -base64 64
# cole o valor gerado em JWT_SECRET no arquivo .env
```

```bash
docker compose up --build
```

Após a inicialização:

| Serviço      | URL                                   |
| ------------ | ------------------------------------- |
| **Frontend** | http://localhost:5173                 |
| **API**      | http://localhost:8080                 |
| **Swagger**  | http://localhost:8080/swagger-ui.html |

---

# 💻 Execução Local

## 🗄️ Banco de Dados

Execute uma instância do PostgreSQL utilizando Docker:

```bash
docker run --name biblioteca-postgres \
-e POSTGRES_DB=biblioteca \
-e POSTGRES_USER=biblioteca \
-e POSTGRES_PASSWORD=biblioteca \
-p 5432:5432 \
-d postgres:16-alpine
```

---

## ☕ Backend

Entre no diretório do backend:

```bash
cd backend
```

Execute a aplicação:

```bash
mvn spring-boot:run
```

A API estará disponível em:

```text
http://localhost:8080
```

---

## ⚛️ Frontend

Entre no diretório do frontend:

```bash
cd frontend
```

Instale as dependências:

```bash
npm install
```

Execute o projeto:

```bash
npm run dev
```

O frontend estará disponível em:

```text
http://localhost:5173
```

---

# 🔑 Variáveis de Ambiente

Crie um arquivo `.env` ou configure as variáveis no ambiente de execução.

```env
TMDB_API_KEY=sua_chave
```

A integração com o TMDB é **opcional**.

Sem a chave configurada, o cadastro manual de filmes e séries continua funcionando normalmente.

> 🔒 Nunca versione chaves de API, senhas ou outros dados sensíveis no repositório.

---

# 🎬 Integração com TMDB

O sistema possui integração com a API do **TMDB**, permitindo importar informações automaticamente.

Entre os dados disponíveis estão:

* 🖼️ Poster
* 📝 Sinopse
* 🎭 Gêneros
* 📅 Ano de lançamento
* 📺 Temporadas
* 🎞️ Episódios

Fluxo simplificado:

```text
Usuário
   │
   ▼
Busca título
   │
   ▼
API TMDB
   │
   ▼
Informações do conteúdo
   │
   ▼
Backend
   │
   ▼
PostgreSQL
   │
   ▼
Biblioteca do usuário
```

---

# 👤 Administração

Todos os usuários são criados inicialmente com a role:

```text
USER
```

Para promover um usuário para administrador:

```sql
UPDATE usuarios
SET role = 'ADMIN'
WHERE email = 'usuario@email.com';
```

> O nome da tabela e dos campos deve corresponder à implementação real do banco de dados.

---

# 📡 API

## 🔐 Autenticação

```http
POST /api/auth/register
POST /api/auth/login
POST /api/auth/refresh
POST /api/auth/logout
```

> O access token e o refresh token são emitidos como cookies **httpOnly** (não aparecem no
> corpo da resposta). O access token expira em 15 min por padrão; `/api/auth/refresh` renova
> a sessão usando o refresh token (válido por 7 dias, rotacionado a cada uso).

## 👤 Usuários

```http
GET /api/users/me
PUT /api/users/me
```

## 🎬 Catálogo

```http
GET /api/catalog
POST /api/catalog        (ADMIN)
PUT /api/catalog/{id}    (ADMIN)
DELETE /api/catalog/{id} (ADMIN)
```

## 📊 Dashboard

```http
GET /api/dashboard
```

## 🎬 TMDB

```http
GET /api/tmdb/search
POST /api/tmdb/import (ADMIN)
```

A documentação completa da API pode ser acessada através do **Swagger/OpenAPI**:

```text
http://localhost:8080/swagger-ui.html
```

---

# 🧪 Testes

O backend já tem `spring-boot-starter-test`, `spring-security-test` e H2 configurados.

### Backend

```bash
cd backend
mvn test
```

Cobertura atual: fluxo de autenticação completo (registro, login, refresh com rotação,
logout, acesso negado sem cookie), cálculo de progresso de filmes/séries (individual e em
lote) e o filtro de rate limiting.

### Frontend

```bash
cd frontend
npm run test
```

> Ainda não há testes de frontend configurados — é um bom próximo passo (ex: Vitest +
> Testing Library para os fluxos de login e catálogo).

---

# 📌 Roadmap

## Concluído

* [x] Login com JWT (access token + refresh token, via cookies httpOnly)
* [x] Dashboard
* [x] Controle de episódios
* [x] CRUD de filmes
* [x] CRUD de séries (restrito a ADMIN)
* [x] Integração com TMDB
* [x] Docker (containers rodando como usuário não-root)
* [x] Testes automatizados de backend
* [x] Cache da API do TMDB
* [x] Rate limiting em login/registro

## Em desenvolvimento

* [ ] Testes automatizados de frontend
* [ ] Upload de capas
* [ ] Infinite Scroll
* [ ] Sistema de notificações
* [ ] Configurações do usuário

---

# 🤝 Contribuição

Contribuições são bem-vindas.

Crie uma nova branch:

```bash
git checkout -b feature/minha-feature
```

Faça suas alterações e crie um commit:

```bash
git add .
git commit -m "feat: adiciona nova funcionalidade"
```

Envie a branch:

```bash
git push origin feature/minha-feature
```

Depois, abra um **Pull Request**.

---

# 📄 Licença

Este projeto está distribuído sob a licença **MIT**.

Consulte o arquivo `LICENSE` para mais informações.

---

<div align="center">

### Desenvolvido com ❤️

**Java • Spring Boot • React • TypeScript • PostgreSQL**

</div>
