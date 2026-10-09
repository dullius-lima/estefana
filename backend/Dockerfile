# Estágio 1: Dependências e Preparação
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci

COPY . .

# Estágio 2: Imagem Final de Execução
FROM node:20-alpine AS runner

WORKDIR /usr/src/app

ENV NODE_ENV=production
ENV PORT=3000

# Execução segura com usuário sem privilégios de root
USER node

COPY --chown=node:node package*.json ./
RUN npm ci --only=production && npm cache clean --force

COPY --chown=node:node --from=builder /usr/src/app/src ./src/

EXPOSE 3000

CMD ["node", "src/index.js"]
