# Deploy Talent — API

Backend **NestJS** da plataforma multi-tenant de recrutamento (ATS): isolamento lógico por `tenant_id`, perfil global de candidato (“one-profile”), vagas com máquina de estados e candidaturas com pipeline e histórico.

Código da API: [`api/`](api/). Regras de negócio detalhadas: [`api/requirements.md`](api/requirements.md).

## Stack

- **Runtime:** Node.js, TypeScript  
- **Framework:** NestJS 
- **ORM:** Prisma
- **Banco:** PostgreSQL  
- **Auth:** Passport , RBAC por papel no token  
- **Integrações (infra):** AWS SDK v3 — S3 (URLs pré-assinadas) e SES v2 (e-mail);
- **Documentação:** OpenAPI/Swagger
- **Qualidade:** Biome (lint/format), Jest  

## Como rodar

Na pasta `api/`:

```bash
npm install
```

Defina as variáveis de ambiente (veja a tabela abaixo).

```bash
npm run prisma:generate
npm run prisma:migrate
npm run start:dev
```

Produção:

```bash
npm run build
npm run start:prod
```

## Variáveis de ambiente

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `ENV_MODE` | Sim | `DEV`, `TEST` ou `PROD`. Em `PROD`, Swagger não é exposto. |
| `PORT` | Sim | Porta HTTP (1–65535). |
| `DATABASE_URL` | Sim | Connection string PostgreSQL (Prisma). |
| `JWT_SECRET` | Sim | Segredo de assinatura do JWT. |
| `JWT_EXPIRES_IN` | Sim | Expiração do token (formato aceito pelo Nest JWT, ex.: `7d`). |
| `AWS_REGION` | Sim | Região usada pelos clientes S3 e SES. |
| `S3_BUCKET` | Sim | Bucket para armazenamento. |
| `EMAIL_FROM` | Sim | Remetente padrão (SES). |
| `S3_ENDPOINT` | Não | Endpoint customizado (ex.: LocalStack, MinIO). |
| `S3_FORCE_PATH_STYLE` | Não | `true`/`1` para path-style. |
| `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY` | Não | Credenciais explícitas; se omitidas, usa cadeia padrão do SDK (ex.: IAM na AWS). |
| `S3_PRESIGN_TTL_SECONDS` | Não | TTL das URLs pré-assinadas (60–3600; padrão 900). |
| `S3_MAX_UPLOAD_BYTES` | Não | Limite referencial de upload (padrão 10 MiB). |
| `EMAIL_REPLY_TO` | Não | Reply-To opcional. |
| `EMAIL_ENDPOINT` | Não | Endpoint SES alternativo (ex.: local). |
| `EMAIL_ACCESS_KEY_ID` / `EMAIL_SECRET_ACCESS_KEY` | Não | Credenciais dedicadas ao SES; opcional como no S3. |
| `EMAIL_CONFIGURATION_SET` | Não | Configuration set do SES. |

## Autenticação e tenant

- **JWT:** envie `Authorization: Bearer <access_token>`. O payload inclui `sub` (id do usuário), `role` e `tenantId` (pode ser `null`, ex.: candidato ou super admin).
- **Header de tenant:** nas rotas que exigem contexto B2B, envie `X-Tenant-ID` com o **UUID** do registro `Tenant` (não o slug). O `TenantGuard` valida tenant ativo, não soft-deletado.
- **Contexto assíncrono:** `TenantContextMiddleware` grava o tenant em `AsyncLocalStorage`; o cliente Prisma estende queries de `job`, `application`, `applicationHistory` e `evaluation` para injetar/limitar por `tenantId` quando o header está presente — camada extra de isolamento além das regras dos use cases.

## Papéis

| Papel | Uso típico na API |
|-------|-------------------|
| `SUPER_ADMIN` | Criar/listar/suspender/ativar/soft-delete tenants; Criar `TENANT_ADMIN`. |
| `TENANT_ADMIN` | Convidar `RECRUITER`; vagas e pipeline no tenant do header. |
| `RECRUITER` | Mesmo escopo operacional de vagas/candidaturas do tenant (com o header). |
| `CANDIDATE` | Registro/login; perfil `GET/PATCH/DELETE /candidates/me`; candidaturas e listagem `applications/me`; aplicar em vaga com `X-Tenant-ID` da empresa. |

## Domínio implementado (visão rápida)

### Vagas (`Job`)

Estados: `DRAFT`, `PUBLISHED`, `PAUSED`, `CLOSED`.

Transições permitidas pelo use case de mudança de status:

- `DRAFT` → `PUBLISHED` (exige título, descrição, modalidade, localização e senioridade não vazios)
- `PUBLISHED` → `PAUSED` ou `CLOSED`
- `PAUSED` → `PUBLISHED` ou `CLOSED`
- `CLOSED` → sem transições

### Candidaturas (`Application`)

Estados: `SOURCED`, `APPLIED`, `IN_PROGRESS`, `REJECTED`, `WITHDRAWN`, `HIRED`.

- **Candidato:** `POST /applications/apply` só para vagas `PUBLISHED` ou `PAUSED`; cria `APPLIED` com `appliedAt` e registro inicial em `ApplicationHistory`.
- **Sourcing:** recrutadores criam candidatura `SOURCED` e podem provisionar candidato + usuário com senha aleatória se o e-mail ainda não existir.
- **Mover pipeline:** transições validadas (estados terminais não evoluem); histórico gravado com estágios (`stage`) e usuário que moveu.

## Documentação interativa

Com `ENV_MODE` diferente de `PROD`, após subir o servidor:

- UI: `/docs`
- OpenAPI JSON: `/docs-json`