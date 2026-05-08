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

## Funcionalidades do sistema

Visão orientada ao que a API expõe hoje (detalhe de regras e estados: [`api/requirements.md`](api/requirements.md)).

- **Multi-tenant (empresas):** Cada organização é um *tenant* com dados isolados por `tenant_id`. Um administrador da plataforma (`SUPER_ADMIN`) gere o ciclo de vida dos tenants; dentro da empresa, `TENANT_ADMIN` e `RECRUITER` trabalham só no contexto do tenant do JWT.

- **Vagas e página de carreiras:** Criação e edição de vagas com ciclo `DRAFT` → `PUBLISHED` / `PAUSED` → `CLOSED`. Endpoints **públicos** listam e mostram vagas elegíveis por `tenantId` (site de emprego por empresa). Novas candidaturas só em vagas publicadas ou pausadas.

- **Perfil único do candidato (*one-profile*):** O candidato tem um perfil global (nome, contactos, currículo, etc.); alterações refletem em todas as candidaturas ativas. Pode **anonimizar a conta** (pedido de “esquecimento”, estilo LGPD) com remoção de dados identificáveis do perfil.

- **Candidaturas e pipeline:** O candidato candidata-se com o UUID do tenant na URL; vê as suas candidaturas e pode **desistir** (`WITHDRAWN`). Recrutadores fazem **sourcing** (`SOURCED`), movem o processo entre estados (`IN_PROGRESS`, `REJECTED`, `HIRED`, …) com **histórico de auditoria** (quem mudou, quando, estágios opcionais).

- **Avaliações internas:** Notas de entrevista ou pareceres por candidatura (`Evaluation`), criadas e lidas apenas no lado da empresa — o candidato não acede a este conteúdo.

- **E-mail transacional (SES):** Envio automático ao candidato na **submissão da candidatura**, ao ser marcado como **contratado** (`HIRED`) e ao ser **rejeitado** (`REJECTED`). Falhas de envio não impedem a operação principal (ficam registadas no log).

- **Ficheiros e marca:** Upload para S3 via **URL pré-assinada** (avatar do candidato; logo e banner do tenant). Download autorizado também por URL pré-assinada, segundo o papel e o prefixo da chave. Há recurso público de **branding** do tenant quando aplicável.

- **Segurança e operação:** Autenticação JWT com papéis (RBAC), CORS configurável por ambiente, Helmet em produção, **limite de pedidos** global (throttling) e **health check** para monitorização. Fora de `PROD`, a documentação interativa Swagger está disponível em `/docs`.

## Como rodar

Na pasta `api/`:

```bash
npm install
cp .env.example .env
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
- **Tenant B2B (`RECRUITER` / `TENANT_ADMIN`):** o tenant vem do campo `tenantId` do **JWT** (não envie header). Um interceptor valida que o tenant existe e está ativo e grava o contexto em `AsyncLocalStorage`.
- **Candidato em rotas “por empresa”:** use o **UUID do tenant na URL** (ex.: `POST /tenants/:tenantId/applications/apply`), não o header.
- **Contexto assíncrono:** o cliente Prisma estende queries de `job`, `application`, `applicationHistory` e `evaluation` para injetar/limitar por `tenantId` quando o contexto está definido — camada extra de isolamento além das regras dos use cases.

## Papéis

| Papel | Uso típico na API |
|-------|-------------------|
| `SUPER_ADMIN` | Criar/listar/suspender/ativar/soft-delete tenants; Criar `TENANT_ADMIN`. |
| `TENANT_ADMIN` | Convidar `RECRUITER`; vagas e pipeline no tenant do **JWT**. |
| `RECRUITER` | Mesmo escopo operacional de vagas/candidaturas no tenant do **JWT**. |
| `CANDIDATE` | Registro/login; perfil `GET/PATCH/DELETE /candidates/me`; candidaturas e listagem `applications/me`; candidatar com UUID do tenant na URL (`POST /tenants/:tenantId/applications/apply`). |

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