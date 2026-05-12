# Funcionalidades e Regras de Negócio

> **Navegação:** [Visão geral](./README.md) · **Funcionalidades e Regras de Negócio** · [Modelo de Dados](./BANCO_DE_DADOS.md)

O **Deploy Talent** é uma plataforma multi-tenant de recrutamento (ATS) que materializa, num só produto, todo o ciclo de aquisição de talento: desde o site público de carreiras de cada empresa, passando pelo marketplace agregado de vagas, até à gestão interna do pipeline de candidaturas. Do lado **B2B**, cada empresa opera como um *tenant* isolado por `tenant_id`, com os seus próprios recrutadores, vagas, candidaturas, avaliações e ativos de marca (logo, banner), sob uma hierarquia de papéis (`SUPER_ADMIN`, `TENANT_ADMIN`, `RECRUITER`) que delimita o que cada utilizador vê e faz. Do lado **B2C**, o candidato mantém um perfil único e global (*one-profile*), independente das empresas onde se candidata: edita uma vez, propaga em todas as candidaturas ativas, e pode anonimizar a conta para responder a pedidos no estilo LGPD. As vagas seguem uma máquina de estados explícita (`DRAFT → PUBLISHED → PAUSED → CLOSED`) e as candidaturas percorrem um pipeline auditável (`SOURCED`, `APPLIED`, `IN_PROGRESS`, `REJECTED`, `WITHDRAWN`, `HIRED`), com cada transição gravada em histórico identificando o utilizador autor da mudança. À volta deste núcleo, a plataforma trata também das pontas operacionais: ficheiros (currículos, avatares, logos, banners) entram e saem do S3 por URLs pré-assinadas com TTL e autorização por papel + prefixo da chave; e-mails transacionais (submissão, contratação, rejeição) são disparados via SMTP em *best-effort* para não bloquear o fluxo principal; e a camada de segurança combina JWT + RBAC, CORS configurável, Helmet em produção, throttling global e uma extensão do Prisma client que injeta `tenantId` automaticamente nas queries de domínio, funcionando como rede de proteção extra para o isolamento entre tenants.

## Funcionalidades

### Multi-tenant (empresas)

Cada organização é um tenant com dados isolados por `tenant_id`. O `SUPER_ADMIN` gere o ciclo de vida dos tenants (criar, listar, suspender, ativar, soft-delete); `TENANT_ADMIN` e `RECRUITER` operam apenas no contexto do tenant do JWT. O isolamento é reforçado por uma extensão do Prisma client que injeta/limita por `tenantId` queries de `job`, `application`, `applicationHistory` e `evaluation` quando o contexto está definido em `AsyncLocalStorage`.

### Vagas e página de carreiras

Criação e edição de vagas com ciclo `DRAFT` → `PUBLISHED` / `PAUSED` → `CLOSED`. Endpoints públicos servem o site de empresa em `/carreiras/:tenantId` e o marketplace agregado em `/vagas`. Candidaturas novas só são aceites em vagas `PUBLISHED` ou `PAUSED`.

### Perfil único do candidato (*one-profile*)

O candidato tem um único perfil global; alterações propagam para todas as candidaturas ativas. Suporta anonimização (estilo LGPD) com remoção dos dados identificáveis, preservando histórico operacional.

### Candidaturas e pipeline

O candidato candidata-se com o UUID do tenant na URL e pode desistir (`WITHDRAWN`). Recrutadores fazem *sourcing* (`SOURCED`), movem o processo entre estados (`IN_PROGRESS`, `REJECTED`, `HIRED`, …) e cada transição é gravada em `ApplicationHistory` com `stage` e utilizador que moveu.

### Avaliações internas

Notas e pareceres por candidatura (entidade `Evaluation`), visíveis apenas no lado da empresa (`TENANT_ADMIN` / `RECRUITER`).

### E-mail transacional (SMTP)

Disparado em submissão de candidatura, contratação e rejeição. Falhas no envio **não bloqueiam** a operação principal, são apenas registadas.

### Ficheiros e marca

Upload via S3 com URL pré-assinada para: avatar do candidato, currículo, logo e banner do tenant. O download autorizado também é por URL pré-assinada, validado pelo papel e pelo prefixo da chave. Existe ainda um recurso público de branding do tenant para o site de carreiras.

### Segurança e operação

Autenticação JWT com RBAC no token, CORS configurável, Helmet em produção e throttling global. Fora de `PROD`, o Swagger fica em `/docs`.

### Convites de ativação

O `SUPER_ADMIN` não cria contas de `TENANT_ADMIN` com palavra passe definida pelo próprio. Em vez disso envia um **convite por email**: a API gera um token opaco de 32 bytes, persiste apenas o SHA 256, e o link único `${WEB_BASE_URL}/ativar/<token>` viaja exclusivamente por SMTP. O destinatário abre o link, define a sua própria palavra passe e a conta é criada nesse momento, com login imediato.

## Regras de Negócio

### Vagas (`Job`)

Estados possíveis: `DRAFT`, `PUBLISHED`, `PAUSED`, `CLOSED`.

Transições permitidas pelo use case de mudança de status:

| De | Para |
|---|---|
| `DRAFT` | `PUBLISHED` (exige título, descrição, modalidade, localização e senioridade não vazios) |
| `PUBLISHED` | `PAUSED` ou `CLOSED` |
| `PAUSED` | `PUBLISHED` ou `CLOSED` |
| `CLOSED` | sem transições (estado terminal) |

Regras complementares:

- Só vagas `PUBLISHED` e `PAUSED` aceitam novas candidaturas.
- Vagas em `DRAFT` não aparecem no site público nem no marketplace `/vagas`.

### Candidaturas (`Application`)

Estados possíveis: `SOURCED`, `APPLIED`, `IN_PROGRESS`, `REJECTED`, `WITHDRAWN`, `HIRED`.

Regras de criação:

- **Candidato:** `POST /applications/apply` só funciona para vagas `PUBLISHED` ou `PAUSED`; cria a candidatura em `APPLIED`, define `appliedAt` e regista a entrada inicial em `ApplicationHistory`.
- **Sourcing:** recrutadores criam candidatura em `SOURCED` e podem provisionar candidato + utilizador com password aleatória se o e-mail ainda não existir.

Regras de transição:

- Estados terminais (`REJECTED`, `WITHDRAWN`, `HIRED`) não evoluem para outros estados.
- Toda transição grava entrada em `ApplicationHistory` com `stage` resultante e utilizador autor da mudança.
- Candidato só pode desistir (`WITHDRAWN`) das próprias candidaturas.

### Papéis e permissões

| Papel | Escopo operacional |
|---|---|
| `SUPER_ADMIN` | Criar, listar, suspender, ativar e soft-delete de tenants; convidar `TENANT_ADMIN` por email (link único de ativação). |
| `TENANT_ADMIN` | Convidar `RECRUITER`; gerir vagas e pipeline no tenant do **JWT**. |
| `RECRUITER` | Mesmo escopo operacional de vagas e candidaturas no tenant do **JWT**. |
| `CANDIDATE` | Registo/login, `GET/PATCH/DELETE /candidates/me`, `/applications/me` e candidatura com UUID do tenant na URL. |

### Resolução do tenant

- **B2B (`RECRUITER` / `TENANT_ADMIN`):** o tenant vem do `tenantId` do **JWT**, nunca por header. Um interceptor valida que o tenant existe e está ativo e grava o contexto em `AsyncLocalStorage`.
- **Candidato em rotas "por empresa":** usa o **UUID do tenant na URL** (ex.: `POST /tenants/:tenantId/applications/apply`).
- **Isolamento extra:** a extensão do Prisma client aplica filtro/injeção de `tenantId` em `job`, `application`, `applicationHistory` e `evaluation` quando há contexto, mesmo que o use case se esqueça.

### Perfil único do candidato

- Um candidato → um perfil global, independente de quantas candidaturas tenha em diferentes tenants.
- Edição de perfil propaga aos dados de exibição em todas as candidaturas ativas.
- Anonimização remove dados identificáveis (nome, e-mail, telefone, currículo) mas preserva o histórico de pipeline necessário à auditoria.

### Ficheiros (S3)

- Upload e download apenas por URL pré-assinada, com TTL configurável (`S3_PRESIGN_TTL_SECONDS`, 60–3600s, padrão 900).
- Limite referencial de upload definido por `S3_MAX_UPLOAD_BYTES` (padrão 10 MiB).
- Autorização de download por papel **e** prefixo da chave (ex.: currículo só ao próprio candidato e ao recrutador da vaga onde se candidatou).
- Recursos de branding do tenant (logo e banner) expostos publicamente para o site de carreiras.

### E-mail transacional

- Eventos que disparam envio: submissão de candidatura, contratação (`HIRED`), rejeição (`REJECTED`).
- O envio é *best-effort*: erros de SMTP são registados mas não revertem a operação principal.

### Convite de administrador de tenant

- O `SUPER_ADMIN` envia um convite por email para cada futuro `TENANT_ADMIN`; o corpo do pedido não aceita nem permite definir palavra passe.
- A API gera um token opaco aleatório (32 bytes, base64url) e guarda **apenas o SHA 256**, evitando que uma fuga de leitura no Postgres comprometa convites pendentes.
- Cada novo convite para o mesmo email e empresa revoga automaticamente os convites pendentes anteriores.
- Validade configurável por `INVITATION_TTL_HOURS` (1..720, padrão 72h). Convites expirados, já aceites ou revogados deixam de ser utilizáveis.
- Se o envio SMTP falhar o convite é revogado, garantindo que não fica um token activo em base de dados sem ter sido entregue.
- A ativação cria o utilizador, marca o convite como aceite numa única transação, e devolve um `access_token` para login imediato.
