# Deploy Talent

> **Navegação:**
> - **Visão geral**
> - [Funcionalidades e Regras de Negócio](./FUNCIONALIDADES.md)
> - [Modelo de Dados](./BANCO_DE_DADOS.md)
> - [Fluxos](./FLUXOS.md)

Plataforma multi-tenant de recrutamento (ATS). Backend **NestJS** + frontend **Next.js** num único repositório.

- Isolamento lógico por `tenant_id`, com perfil global do candidato (*one-profile*).
- Vagas com máquina de estados e candidaturas com pipeline + histórico.
- Site público de carreiras por empresa e marketplace público `/vagas`.
- Upload de currículos, avatares, logos e banners via S3 com URLs pré-assinadas.
- E-mail transacional via SMTP.

```text
.
├── api/                 NestJS 11 + Prisma 7 (driver adapter pg)
├── web/                 Next.js 16 (App Router, RSC, React Query)
├── docker/              setup do bucket MinIO
├── docker-compose.yml   infra local + apps containerizadas (profile)
├── .env.example         modelo das variáveis usadas pelo Docker Compose (raiz)
└── README.md
```

## Stack

| | API  | Web |
|---|---|---|
| Runtime | Node.js 22, TypeScript | Node.js 22, TypeScript |
| Framework | NestJS 11 | Next.js 16 (App Router) |
| Persistência / dados | Prisma 7, PostgreSQL | TanStack Query, React Hook Form, Zod |
| UI / estilo |  | Tailwind v4, shadcn/ui, lucide |
| Auth | Passport (JWT local), RBAC no token | sessão via JWT da API |
| Storage | AWS SDK v3 (S3 + pre-sign) | consome URLs pré-assinadas |
| E-mail | Nodemailer (SMTP) |  |
| Docs | OpenAPI/Swagger |  |
| Qualidade | Biome, Jest | Biome |

## Como rodar

Na **raiz do repositório**, cria o ficheiro `.env` a partir do modelo (o Compose interpola estas variáveis no `docker-compose.yml`):

```bash
cp .env.example .env
```

Há três caminhos. Escolhe um.

### A) Mais comum: infra em Docker, apps em modo dev local

Recomendado para desenvolvimento: hot reload, breakpoints, tudo a passar pela tua máquina.

```bash
# 0) na raiz: já tens `.env` (ver bloco acima)
# 1) sobe Postgres + MinIO + Mailpit
docker compose up -d

# 2) API (em api/)
cd api
npm install
cp .env.example .env
npm run prisma:generate
npm run prisma:migrate          # cria schema e aplica migrações
npx prisma db seed              # popula tenants, vagas, candidatos (ver "Seed" abaixo)
npm run start:dev               # http://localhost:3050  · Swagger em /docs

# 3) Web (noutro shell, em web/)
cd web
npm install
cp .env.example .env
npm run dev                     # http://localhost:3000
```

### B) Tudo em Docker

Útil para ensaiar prod-like ou validar o build das imagens. Os serviços `api` e `web` estão escondidos atrás de um **profile `app`** para não pesar no fluxo dev habitual. Precisas do `.env` na raiz (`cp .env.example .env`).

```bash
docker compose --profile app up -d --build
# API → http://localhost:3050   (Swagger em /docs)
# Web → http://localhost:3000
```

O `api` arranca depois do `postgres` ficar healthy e do `minio-setup` criar o bucket `files`. As migrações **não correm automaticamente** dentro do container, porque a imagem de produção não inclui o CLI do Prisma. Aplica-as a partir do `api/` local antes de subir o stack:

```bash
cd api && npm run prisma:migrate && npx prisma db seed
```

> **Nota S3 + Docker:** as URLs pré-assinadas geradas pela API correm dentro da network do Compose e usam `http://minio:9000`. Para abrires essas URLs no browser do host, adiciona uma vez `127.0.0.1 minio` ao `/etc/hosts`. Em modo (A) este problema não existe, porque o `S3_ENDPOINT` é `http://127.0.0.1:9000`.

## Build de produção

Os `Dockerfile`s são multi-stage Alpine, com user não-root atrás de `tini`. Imagens finais validadas:

| Imagem | Tamanho |
|---|---|
| `deploy-talent-api`  (`api/Dockerfile`)  | ~242 MB |
| `deploy-talent-web`  (`web/Dockerfile`)  | ~218 MB |

## Seed e credenciais de teste

`npx prisma db seed` cria 5 tenants (`Seed Empresa N`), 5 recrutadores cada, um pool de candidatos e candidaturas distribuídas pelo pipeline. Também faz upload idempotente de placeholders de avatar/logo/banner para o bucket S3 (mantidos com chave fixa em `seed/placeholders/...`).

Todas as contas geradas usam a mesma password.

| Papel | E-mail | Password |
|---|---|---|
| `SUPER_ADMIN` | `superadmin@seed.local` | `Seed123!` |
| `TENANT_ADMIN` (empresa N) | `empN-admin@seed.local` | `Seed123!` |
| `RECRUITER` (empresa N) | `empN-recR@seed.local` (R = 1..5) | `Seed123!` |
| `CANDIDATE` | gerados em `prisma/seed/mock-data.json` após o seed | `Seed123!` |

## Funcionalidades expostas pela API

- **Multi-tenant (empresas):** cada organização é um tenant com dados isolados por `tenant_id`. `SUPER_ADMIN` gere o ciclo de vida dos tenants; `TENANT_ADMIN` e `RECRUITER` trabalham apenas no contexto do tenant do JWT.
- **Vagas e página de carreiras:** criação e edição com ciclo `DRAFT` → `PUBLISHED` / `PAUSED` → `CLOSED`. Endpoints públicos servem o site de empresa (`/carreiras/:tenantId`) e o marketplace agregado (`/vagas`). Candidaturas novas só em vagas `PUBLISHED` ou `PAUSED`.
- **Perfil único do candidato (*one-profile*):** o candidato tem um perfil global; mudanças propagam a todas as candidaturas ativas. Pode anonimizar a conta (LGPD-style) com remoção dos dados identificáveis.
- **Candidaturas e pipeline:** o candidato candidata-se com o UUID do tenant na URL e pode desistir (`WITHDRAWN`). Recrutadores fazem *sourcing* (`SOURCED`), movem o processo (`IN_PROGRESS`, `REJECTED`, `HIRED`, …) com histórico de auditoria e etapas por vaga (`JobStage` / `ApplicationStageProgress`).
- **E-mail transacional (SMTP):** disparado em submissão, contratação e rejeição. Falhas no envio não bloqueiam a operação principal.
- **Arquivos e marca:** upload S3 com URL pré-assinada (avatar do candidato, currículo, logo e banner do tenant). Download autorizado também por URL pré-assinada, segundo o papel e o prefixo da chave. Há recurso público de branding do tenant.
- **Segurança e operação:** JWT + RBAC, CORS configurável, Helmet em produção, throttling global. Fora de `PROD`, Swagger em `/docs`.

## Onboarding B2B

**Produção:** o caminho canônico é **convite por email** (`SUPER_ADMIN` → `TENANT_ADMIN` → `RECRUITER`). Detalhes em [Funcionalidades](./FUNCIONALIDADES.md#onboarding-b2b-caminho-canônico-vs-auto-registro).

**Demo / piloto:** existe também auto-registro em `/registo` (`POST /auth/register/tenant-admin`), com aprovação do `SUPER_ADMIN` antes do tenant ficar ativo. Use apenas quando não houver operador para enviar convites manualmente.

## Variáveis de ambiente

### Docker Compose (`.env` na raiz)

O ficheiro `.env` ao lado de `docker-compose.yml` define Postgres, MinIO, variáveis do serviço `api` e o build arg `NEXT_PUBLIC_API_BASE_URL` da `web`. Não commits o `.env`; usa `cp .env.example .env` e ajusta valores (em produção, injeta segredos no servidor ou no CI).

### API (`api/.env`)

| Variável | Obrigatória | Descrição |
|---|---|---|
| `ENV_MODE` | Sim | `DEV`, `TEST` ou `PROD`. Em `PROD`, Swagger não é exposto. |
| `PORT` | Sim | Porta HTTP (1–65535). |
| `DATABASE_URL` | Sim | Connection string PostgreSQL (Prisma). |
| `JWT_SECRET` | Sim | Segredo de assinatura do access JWT (Bearer). |
| `JWT_ACCESS_EXPIRES_IN` | Não | TTL do access token (ex.: `10m`). Se omitido, usa `JWT_EXPIRES_IN`; se ambos omitidos, `10m`. |
| `JWT_EXPIRES_IN` | Não | Legado: TTL do access token quando `JWT_ACCESS_EXPIRES_IN` está vazio. |
| `JWT_REFRESH_EXPIRES_IN` | Não | TTL do refresh opaco na tabela `refresh_tokens` (ex.: `24h`; padrão `24h`). |
| `AWS_REGION` | Sim | Região do cliente S3 (e do signer das URLs). |
| `S3_BUCKET` | Sim | Bucket de armazenamento. |
| `S3_ENDPOINT` | Não | Endpoint S3-compatível custom (ex.: MinIO). |
| `S3_FORCE_PATH_STYLE` | Não | `true`/`1` para path-style. |
| `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY` | Não | Credenciais explícitas; se omitidas, usa a cadeia padrão do SDK (IAM, etc.). |
| `S3_PRESIGN_TTL_SECONDS` | Não | TTL das URLs (60–3600; padrão 900). |
| `S3_MAX_UPLOAD_BYTES` | Não | Limite referencial de upload (padrão 10 MiB). |
| `EMAIL_FROM` | Sim | Remetente padrão (SMTP). |
| `EMAIL_REPLY_TO` | Não | Reply-To opcional. |
| `SMTP_HOST` | Sim | Hostname do servidor SMTP. |
| `SMTP_PORT` | Sim | Porta SMTP (ex.: 1025 Mailpit, 587 SES STARTTLS). |
| `SMTP_SECURE` | Não | `true`/`1` para TLS implícito (porta 465). |
| `SMTP_USER` / `SMTP_PASSWORD` | Não | Auth SMTP; podem ser omitidos em servidores abertos (Mailpit). |
| `WEB_BASE_URL` | Sim | URL pública do frontend (sem barra final). Usada para montar os links dos emails de convite. |
| `INVITATION_TTL_HOURS` | Não | Tempo de vida dos convites de ativação (1..720, padrão 72). |
| `CORS_ORIGINS` | Não | Lista CSV de origens. Vazio em `PROD` = CORS desligado; vazio em `DEV/TEST` = qualquer origem. |
| `COOKIE_SECURE` | Não | `true`/`1` força `Secure` nos cookies de sessão; omitido = `Secure` só em `PROD`. |

### Web (`web/.env`)

| Variável | Obrigatória | Descrição |
|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | Sim | URL base da API Nest **alcançável pelo browser**, sem `/` final. *Baked* em build-time. |

## Autenticação e tenant (API)

- **JWT:** `Authorization: Bearer <access_token>`. O payload inclui `sub`, `role` e `tenantId` (pode ser `null`, ex.: candidato ou super admin).
- **B2B (`RECRUITER` / `TENANT_ADMIN`):** o tenant vem do `tenantId` do **JWT** (não envies header). Um interceptor valida que o tenant existe e está ativo e grava o contexto em `AsyncLocalStorage`.
- **Candidato em rotas "por empresa":** usa o **UUID do tenant na URL** (ex.: `POST /tenants/:tenantId/applications/apply`), não o header.
- **Contexto assíncrono:** o Prisma client estende queries de `job`, `application` e `applicationHistory` para injetar/limitar por `tenantId` quando o contexto está definido, funcionando como camada extra de isolamento além das regras dos use cases.

## Papéis

| Papel | Uso típico |
|---|---|
| `SUPER_ADMIN` | Criar/listar/suspender/ativar/soft-delete tenants; **convidar** `TENANT_ADMIN` por email (caminho canônico); aprovar/rejeitar auto-registros pendentes em `/plataforma/empresas`. |
| `TENANT_ADMIN` | Convidar `RECRUITER` por email (a conta é ativada pelo próprio com link único); vagas e pipeline no tenant do **JWT**. |
| `RECRUITER` | Mesmo escopo operacional de vagas/candidaturas no tenant do **JWT**. |
| `CANDIDATE` | Registo/login, `GET/PATCH/DELETE /candidates/me`, candidaturas (`/applications/me`) e candidatar com UUID do tenant na URL. |

## Domínio (visão rápida)

### Vagas (`Job`)

Estados: `DRAFT`, `PUBLISHED`, `PAUSED`, `CLOSED`.

Transições permitidas pelo use case de mudança de status:

- `DRAFT` → `PUBLISHED` (exige título, descrição, modalidade, localização e senioridade não vazios)
- `PUBLISHED` → `PAUSED` ou `CLOSED`
- `PAUSED` → `PUBLISHED` ou `CLOSED`
- `CLOSED` → sem transições

### Candidaturas (`Application`)

Estados: `SOURCED`, `APPLIED`, `IN_PROGRESS`, `REJECTED`, `WITHDRAWN`, `HIRED`.

- **Candidato:** `POST /applications/apply` só para vagas `PUBLISHED` ou `PAUSED`; cria `APPLIED` com `appliedAt` e regista entrada inicial em `ApplicationHistory`.
- **Sourcing:** recrutadores criam candidatura `SOURCED` e podem provisionar candidato + usuário com password aleatória se o e-mail ainda não existir.
- **Mover pipeline:** transições validadas (estados terminais não evoluem); histórico gravado com estágios (`stage`) e o usuário que moveu.

## URLs locais

| Serviço | URL |
|---|---|
| Web | http://localhost:3000 |
| API | http://localhost:3050 |
| Swagger (API) | http://localhost:3050/docs |
| OpenAPI JSON | http://localhost:3050/docs-json |
| MinIO (consola) | http://127.0.0.1:9001 |
| Mailpit (UI) | http://127.0.0.1:8025 |
| Postgres | `localhost:5432` (user e base definidos no `.env` da raiz; o exemplo usa `deploy_talent`) |
