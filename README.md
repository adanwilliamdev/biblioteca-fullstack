<div align="center">

# 📚 Minha Biblioteca

### Gerenciador de Filmes e Séries

Aplicação Full Stack para catalogar filmes e séries, acompanhar o progresso de episódios e visualizar estatísticas através de um dashboard moderno.

![Java](https://img.shields.io/badge/Java-17-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-3-6DB33F?style=for-the-badge&logo=springboot&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)

</div>

---

# 📖 Sobre

O **Minha Biblioteca** é um sistema para gerenciamento de filmes e séries, permitindo organizar sua biblioteca pessoal, acompanhar episódios assistidos, importar conteúdos do TMDB e visualizar estatísticas em tempo real.

---

# ✨ Funcionalidades

## 🎬 Catálogo

- Cadastro manual de filmes e séries
- Importação automática pelo TMDB
- Busca por título
- Filtros por gênero, ano e tipo
- Paginação

## 📺 Progresso

- Marcar filmes como assistidos
- Controle de episódios
- Controle de temporadas
- Progresso automático

## 📊 Dashboard

- Filmes cadastrados
- Séries cadastradas
- Horas assistidas
- Episódios assistidos
- Progresso geral
- Distribuição por gênero
- Continuar assistindo

## 👤 Usuários

- Cadastro
- Login
- JWT
- Perfil
- Controle de permissões

## ⚙ Administração

- CRUD completo
- Filmes
- Séries
- Temporadas
- Episódios

---

# 🛠 Tecnologias

## Backend

- Java 17
- Spring Boot 3
- Spring Security
- Spring Data JPA
- Hibernate
- PostgreSQL
- JWT
- Maven

## Frontend

- React 18
- TypeScript
- Vite
- React Router
- Recharts

## DevOps

- Docker
- Docker Compose

---

# 📂 Estrutura

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
└── docker-compose.yml
```

---

# 🚀 Executando o Projeto

## Docker (Recomendado)

```bash
docker compose up --build
```

Aplicação disponível em:

| Serviço | URL |
|----------|-----|
| Frontend | http://localhost:5173 |
| API | http://localhost:8080 |
| Swagger | http://localhost:8080/swagger-ui.html |

---

## Execução Local

### Banco

```bash
docker run --name biblioteca-postgres \
-e POSTGRES_DB=biblioteca \
-e POSTGRES_USER=biblioteca \
-e POSTGRES_PASSWORD=biblioteca \
-p 5432:5432 \
-d postgres:16-alpine
```

### Backend

```bash
cd backend

mvn spring-boot:run
```

### Frontend

```bash
cd frontend

npm install

npm run dev
```

---

# 🔑 Variáveis de Ambiente

Crie um arquivo `.env`

```env
TMDB_API_KEY=sua_chave
```

A integração com o TMDB é opcional.

Sem a chave o cadastro manual continua funcionando normalmente.

---

# 🎬 Integração TMDB

O sistema permite importar automaticamente:

- Poster
- Sinopse
- Gêneros
- Ano
- Temporadas
- Episódios

Tudo utilizando a API do TMDB.

---

# 👤 Administração

Todos os usuários são criados com a role:

```
USER
```

Para promover um usuário:

```sql
UPDATE usuarios
SET role='ADMIN'
WHERE email='usuario@email.com';
```

---

# 📡 API

## Autenticação

```
POST /api/auth/register

POST /api/auth/login
```

## Usuários

```
GET /api/users/me

PUT /api/users/me
```

## Catálogo

```
GET /api/catalog

POST /api/catalog

PUT /api/catalog/{id}

DELETE /api/catalog/{id}
```

## Dashboard

```
GET /api/dashboard
```

## TMDB

```
GET /api/tmdb/search

POST /api/tmdb/import
```

A documentação completa pode ser acessada pelo Swagger.

---

# 📌 Roadmap

- [x] Login JWT
- [x] Dashboard
- [x] Controle de episódios
- [x] CRUD de filmes
- [x] CRUD de séries
- [x] Integração TMDB
- [x] Docker
- [ ] Upload de capas
- [ ] Testes automatizados
- [ ] Infinite Scroll
- [ ] Notificações
- [ ] Configurações
- [ ] Cache do TMDB

---

# 🤝 Contribuição

```bash
git checkout -b feature/minha-feature

git commit -m "feat: nova funcionalidade"

git push origin feature/minha-feature
```

Depois abra um Pull Request.

---

# 📄 Licença

Distribuído sob a licença MIT.

---

<div align="center">

Desenvolvido com ❤️ utilizando Java, Spring Boot e React.

</div>
