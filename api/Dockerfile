# Multi-stage Alpine build para a API (NestJS + Prisma 7 Driver Adapter).

ARG NODE_VERSION=22

# 1) deps: instala todas as deps (dev+prod) para conseguir compilar.
#    libc6-compat + toolchain são precisos por dependências nativas (ex.: bcrypt).
FROM node:${NODE_VERSION}-alpine AS deps
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# 2) builder: gera o cliente Prisma e compila o Nest (TS → dist/).
FROM node:${NODE_VERSION}-alpine AS builder
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# `prisma.config.ts` resolve env('DATABASE_URL'); o generate em si não liga à BD.
RUN DATABASE_URL="postgresql://build:build@localhost:5432/build" \
    npx prisma generate \
  && npm run build

# 3) prod-deps: instalação limpa só com deps de runtime.
#    --omit=peer salta peerOptional (ex.: o CLI `prisma`, que arrasta o Studio
#    inteiro: chart.js, react-dom, effect, pglite, ~160MB de stuff só para DEV).
#    --omit=optional remove optionalDependencies não necessárias.
#    Mantemos o toolchain porque alguns native modules (bcrypt) recompilam em musl.
FROM node:${NODE_VERSION}-alpine AS prod-deps
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --omit=optional --omit=peer \
  && npm cache clean --force \
  # @types/* são só .d.ts, nunca lidos em runtime.
  && rm -rf node_modules/@types \
  # Prisma 7 embarca compiladores WASM de TODAS as BDs.
  # Apagamos os engines que não usamos.
  && find node_modules/@prisma/client/runtime -type f \
       \( -name 'query_compiler_*_bg.cockroachdb.*' \
       -o -name 'query_compiler_*_bg.mysql.*' \
       -o -name 'query_compiler_*_bg.sqlite.*' \
       -o -name 'query_compiler_*_bg.sqlserver.*' \) \
       -delete

# 4) runner: imagem final mínima. Sem toolchain; só o necessário para correr `node dist/main`.
FROM node:${NODE_VERSION}-alpine AS runner
RUN apk add --no-cache tini libc6-compat
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3050

RUN addgroup -S app && adduser -S app -G app

COPY --from=prod-deps --chown=app:app /app/node_modules ./node_modules
COPY --from=builder  --chown=app:app /app/dist          ./dist
COPY --from=builder  --chown=app:app /app/generated     ./generated
COPY --from=builder  --chown=app:app /app/prisma        ./prisma
COPY --from=builder  --chown=app:app /app/package.json  ./package.json

USER app
EXPOSE 3050
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/src/main"]
