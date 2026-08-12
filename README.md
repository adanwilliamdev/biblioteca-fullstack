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
```

## 👤 Usuários

```http
GET /api/users/me
PUT /api/users/me
```

## 🎬 Catálogo

```http
GET /api/catalog
POST /api/catalog
PUT /api/catalog/{id}
DELETE /api/catalog/{id}
```

## 📊 Dashboard

```http
GET /api/dashboard
```

## 🎬 TMDB

```http
GET /api/tmdb/search
POST /api/tmdb/import
```

A documentação completa da API pode ser acessada através do **Swagger/OpenAPI**:

```text
http://localhost:8080/swagger-ui.html
```

---

# 🧪 Testes

A estrutura do projeto pode ser expandida com testes automatizados para backend e frontend.

### Backend

```bash
mvn test
```

### Frontend

```bash
npm run test
```

> Adicione estes comandos ao README somente se os respectivos frameworks de teste estiverem configurados no projeto.

---

# 📌 Roadmap

## Concluído

* [x] Login com JWT
* [x] Dashboard
* [x] Controle de episódios
* [x] CRUD de filmes
* [x] CRUD de séries
* [x] Integração com TMDB
* [x] Docker

## Em desenvolvimento

* [ ] Upload de capas
* [ ] Testes automatizados
* [ ] Infinite Scroll
* [ ] Sistema de notificações
* [ ] Configurações do usuário
* [ ] Cache da API do TMDB

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
