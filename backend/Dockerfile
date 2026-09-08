FROM node:20-alpine AS build
WORKDIR /app

# Instala OpenSSL (necessário para o Prisma detectar a versão correta no Alpine)
RUN apk add --no-cache openssl

COPY package*.json ./
COPY prisma ./prisma
RUN npm install

COPY tsconfig.json nest-cli.json ./
COPY src ./src
RUN npx prisma generate
RUN npm run build

# Instala apenas as dependências de produção em uma pasta separada,
# já com o client do Prisma gerado (evita rodar "prisma generate" de novo
# na imagem final, que era a causa do erro de permissão em runtime).
FROM node:20-alpine AS deps
WORKDIR /app
RUN apk add --no-cache openssl
COPY package*.json ./
COPY prisma ./prisma
RUN npm install --omit=dev
RUN npx prisma generate

FROM node:20-alpine
WORKDIR /app

# Instala OpenSSL e bash (para melhor compatibilidade)
RUN apk add --no-cache openssl bash

# Cria usuário não-root
RUN addgroup -S nestjs && adduser -S nestjs -G nestjs

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma ./prisma
COPY --from=build --chown=nestjs:nestjs /app/dist ./dist

# Ajusta permissões de TODO o node_modules (o client do Prisma fica em
# node_modules/.prisma, uma pasta separada de node_modules/@prisma — o
# chown anterior cobria só @prisma e deixava .prisma com dono root,
# causando "Can't write to .../@prisma/engines" quando o processo
# rodava como usuário não-root)
RUN chown -R nestjs:nestjs /app/node_modules /app/prisma

USER nestjs:nestjs
EXPOSE 8080

CMD ["node", "dist/main"]
