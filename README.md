# 📚 Minha Biblioteca — Gerenciador de Séries e Filmes

Aplicação full stack para catalogar filmes e séries, acompanhar o progresso de episódios/temporadas e visualizar estatísticas em um dashboard.

## Stack

| Camada       | Tecnologia                              |
|--------------|------------------------------------------|
| Back-end     | Java 17 + Spring Boot 3 (Web, Security, Data JPA) |
| Banco        | PostgreSQL                                |
| ORM          | Spring Data JPA / Hibernate                |
| Front-end    | React 18 + TypeScript + Vite               |
| Autenticação | Spring Security + JWT                      |
| Gráficos     | Recharts                                   |
| Build/Deploy | Maven, Docker, Docker Compose              |

## Estrutura do projeto

```
.
├── backend/    # API REST em Spring Boot
├── frontend/   # SPA em React + TypeScript
└── docker-compose.yml
```

## Integração com o TMDB (busca de filmes/séries)

O catálogo pode importar filmes e séries prontos (pôster, sinopse, ano, temporadas e episódios) a partir do [TMDB](https://www.themoviedb.org/). Isso é opcional — sem a chave configurada, a aba "Buscar no TMDB" avisa que a integração não está disponível e o cadastro manual continua funcionando normalmente.

1. Crie uma conta gratuita em https://www.themoviedb.org/ e gere uma chave de API (v3 auth) em **Configurações → API**.
2. Copie `.env.example` para `.env` na raiz do projeto e cole a chave em `TMDB_API_KEY`.
3. Suba o projeto normalmente (Docker Compose lê o `.env` automaticamente) ou, rodando localmente, exporte a variável antes de iniciar o back-end:
   ```bash
   export TMDB_API_KEY=sua_chave_aqui
   ```

## Rodando com Docker (recomendado)

Pré-requisitos: Docker e Docker Compose instalados. Configure o `.env` (ver seção acima) antes de subir, se quiser usar a busca do TMDB.

```bash
docker compose up --build
```

- Front-end: http://localhost:5173
- API: http://localhost:8080
- Swagger: http://localhost:8080/swagger-ui.html

O primeiro usuário cadastrado não é administrador automaticamente — veja a seção **"Criando um administrador"** abaixo.

## Rodando localmente (sem Docker)

### 1. Banco de dados

Suba um PostgreSQL local (ou use o serviço `postgres` do `docker-compose.yml` isoladamente):

```bash
docker run --name biblioteca-postgres -e POSTGRES_DB=biblioteca \
  -e POSTGRES_USER=biblioteca -e POSTGRES_PASSWORD=biblioteca \
  -p 5432:5432 -d postgres:16-alpine
```

### 2. Back-end

```bash
cd backend
mvn spring-boot:run
```

A API sobe em `http://localhost:8080`. As tabelas são criadas/atualizadas automaticamente pelo Hibernate (`ddl-auto: update`).

### 3. Front-end

```bash
cd frontend
npm install
npm run dev
```

O front-end sobe em `http://localhost:5173` e já está configurado (via proxy do Vite) para conversar com a API em `localhost:8080`.

## Criando um administrador

Todo usuário criado via `/api/auth/register` nasce com a role `USER`. Para promover alguém a `ADMIN` (necessário para acessar a tela de Administração e o CRUD de conteúdos), rode no banco:

```sql
UPDATE usuarios SET role = 'ADMIN' WHERE email = 'seu-email@exemplo.com';
```

## Principais endpoints da API

| Método | Rota                                        | Descrição                              |
|--------|----------------------------------------------|-----------------------------------------|
| POST   | `/api/auth/register`                          | Cria conta de usuário                   |
| POST   | `/api/auth/login`                             | Autentica e retorna um JWT              |
| GET    | `/api/users/me`                               | Retorna o perfil do usuário logado      |
| PUT    | `/api/users/me`                               | Atualiza nome do usuário                |
| GET    | `/api/catalog`                                | Lista conteúdos (paginado, com filtros) |
| GET    | `/api/catalog/{id}`                           | Detalhes de um conteúdo                 |
| POST   | `/api/catalog`                                | Cria filme/série (qualquer usuário logado) |
| PUT    | `/api/catalog/{id}` *(ADMIN)*                 | Edita filme/série                       |
| DELETE | `/api/catalog/{id}` *(ADMIN)*                 | Remove filme/série                      |
| POST   | `/api/catalog/{id}/temporadas`                | Adiciona temporada a uma série (qualquer usuário logado) |
| DELETE | `/api/catalog/temporadas/{id}` *(ADMIN)*      | Remove temporada                        |
| POST   | `/api/catalog/temporadas/{id}/episodios`      | Adiciona episódio a uma temporada (qualquer usuário logado) |
| DELETE | `/api/catalog/episodios/{id}` *(ADMIN)*       | Remove episódio                         |
| PUT    | `/api/progresso/episodios/{id}?status=ASSISTIDO\|PENDENTE` | Marca/desmarca episódio |
| PUT    | `/api/progresso/conteudos/{id}?status=ASSISTIDO\|PENDENTE` | Marca/desmarca filme    |
| GET    | `/api/dashboard`                              | Estatísticas do usuário logado          |
| GET    | `/api/tmdb/status`                            | Indica se a integração com o TMDB está configurada |
| GET    | `/api/tmdb/search?query=&tipo=FILME\|SERIE`   | Busca filmes/séries no TMDB              |
| POST   | `/api/tmdb/import?tmdbId=&tipo=FILME\|SERIE`  | Importa um título do TMDB (com temporadas/episódios, se for série) |

Documentação interativa completa em `/swagger-ui.html` com o back-end rodando.

## Funcionalidades implementadas

- Cadastro/login com JWT e senhas criptografadas (BCrypt)
- Dashboard com estatísticas (filmes/séries no catálogo, episódios assistidos, horas assistidas, progresso geral, distribuição por gênero, séries concluídas vs. em progresso, "continuar assistindo")
- Catálogo com busca por título, filtros por gênero/ano/tipo e paginação
- Botão **"+ Adicionar"** na tela de Catálogo, disponível para qualquer usuário logado, com duas formas de cadastro:
  - **Buscar no TMDB**: pesquisa filmes/séries na base do TMDB e importa com um clique (pôster, sinopse, ano, gênero e, para séries, todas as temporadas e episódios já cadastrados automaticamente)
  - **Cadastro manual**: formulário simples para digitar os dados na mão, sem depender de API externa
- Tela de detalhes com temporadas expansíveis, checkboxes para marcar episódios como assistidos (o progresso da temporada e da série é recalculado automaticamente) e botões para adicionar temporadas/episódios manualmente a uma série (útil para séries cadastradas à mão)
- Marcação de filmes como assistido/não assistido
- Tela de administração com CRUD completo de filmes, séries, temporadas e episódios (protegida por role `ADMIN`); edição e remoção de conteúdos continuam restritas a administradores, mas qualquer usuário pode adicionar
- Edição de perfil do usuário

## Próximos passos sugeridos

- Upload real de imagens de capa no cadastro manual (hoje é apenas uma URL)
- Testes automatizados (JUnit no back-end, Vitest/RTL no front-end)
- Paginação/infinite scroll na tela de administração
- Notificações e área de configurações mencionadas no dashboard
- Cache local dos gêneros/detalhes do TMDB para reduzir chamadas repetidas à API externa
