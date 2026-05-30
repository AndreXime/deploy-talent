# Funcionalidades e Regras de Negócio

> **Navegação:**
> - [Visão geral](./README.md)
> - **Funcionalidades e Regras de Negócio**
> - [Modelo de Dados](./BANCO_DE_DADOS.md)
> - [Fluxos](./FLUXOS.md)

O **Deploy Talent** é uma plataforma multi-tenant de recrutamento (ATS) que materializa, num só produto, todo o ciclo de aquisição de talento: desde o site público de carreiras de cada empresa, passando pelo marketplace agregado de vagas, até a gestão interna do pipeline de candidaturas. Do lado **B2B**, cada empresa opera como um *tenant* isolado por `tenant_id`, com os seus próprios recrutadores, vagas, candidaturas, pipeline e ativos de marca (logo, banner), sob uma hierarquia de papéis (`SUPER_ADMIN`, `TENANT_ADMIN`, `RECRUITER`) que delimita o que cada usuário vê e faz. Do lado **B2C**, o candidato mantém um perfil único e global (*one-profile*), independente das empresas onde se candidata: edita uma vez, propaga em todas as candidaturas ativas, e pode anonimizar a conta para responder a pedidos no estilo LGPD. As vagas seguem uma máquina de estados explícita (`DRAFT → PUBLISHED → PAUSED → CLOSED`) e as candidaturas percorrem um pipeline auditável (`SOURCED`, `APPLIED`, `IN_PROGRESS`, `REJECTED`, `WITHDRAWN`, `HIRED`), com cada transição gravada em histórico identificando o usuário autor da mudança. À volta deste núcleo, a plataforma trata também das pontas operacionais: arquivos (currículos, avatares, logos, banners) entram e saem do S3 por URLs pré-assinadas com TTL e autorização por papel + prefixo da chave; e-mails transacionais (submissão, contratação, rejeição) são disparados via SMTP em *best-effort* para não bloquear o fluxo principal; e a camada de segurança combina JWT + RBAC, CORS configurável, Helmet em produção, throttling global e uma extensão do Prisma client que injeta `tenantId` automaticamente nas queries de domínio, funcionando como rede de proteção extra para o isolamento entre tenants.

## Funcionalidades

### Multi-tenant (empresas)

Cada organização é um tenant com dados isolados por `tenant_id`. O `SUPER_ADMIN` gere o ciclo de vida dos tenants (criar, listar, suspender, ativar, soft-delete); `TENANT_ADMIN` e `RECRUITER` operam apenas no contexto do tenant do JWT. O isolamento é reforçado por uma extensão do Prisma client que injeta/limita por `tenantId` queries de `job`, `application` e `applicationHistory` quando o contexto está definido em `AsyncLocalStorage`.

### Vagas e página de carreiras

Criação e edição de vagas com ciclo `DRAFT` → `PUBLISHED` / `PAUSED` → `CLOSED`. Endpoints públicos servem o site de empresa em `/carreiras/:tenantId` e o marketplace agregado em `/vagas`. Candidaturas novas só são aceitas em vagas `PUBLISHED` ou `PAUSED`.

### Perfil único do candidato (*one-profile*)

O candidato tem um único perfil global; alterações propagam para todas as candidaturas ativas. Suporta anonimização (estilo LGPD) com remoção dos dados identificáveis, preservando histórico operacional.

### Candidaturas e pipeline

O candidato candidata-se com o UUID do tenant na URL e pode desistir (`WITHDRAWN`). O recrutador faz *sourcing por email* (ver "Sourcing por email") e movimenta o processo entre dois eixos:

* **Status macro** (`APPLIED`, `IN_PROGRESS`, `HIRED`, `REJECTED`, `WITHDRAWN`) com transições gravadas em `ApplicationHistory`.
* **Etapa da pipeline** customizável por vaga (`JobStage`) com cursor `Application.currentJobStageId` e auditoria por `ApplicationStageProgress`.

### Pipeline customizável

Cada tenant tem um template padrão (`PipelineTemplate` + `TemplateStage`). Ao criar uma vaga, o template é clonado em `JobStage` e pode ser editado pela empresa enquanto a vaga estiver em `DRAFT`. Cada etapa tem um `kind`:

* `MANUAL`: avaliação interna sem ação do candidato.
* `QUESTIONNAIRE`: perguntas configuráveis (`TEXT_SHORT`, `TEXT_LONG`, `SINGLE_CHOICE`) que o candidato responde no portal.
* `INTERVIEW_LINK`: o recrutador compartilha um URL (com agendamento opcional) que o candidato vê na sua área.
* `FILE_UPLOAD`: o candidato submete um arquivo via S3 pré-assinado (`purpose` `APPLICATION_STAGE_FILE`). A API fixa os tipos permitidos (PDF, DOCX, PNG, JPG, TXT) e o tamanho máximo efetivo (menor entre 10 MiB e `S3_MAX_UPLOAD_BYTES`). A configuração da etapa só pode incluir `instructions`.

Cada submissão fica em `ApplicationStageProgress` (`PENDING` → `COMPLETED`), incluindo dados submetidos e quem completou, para auditoria.

### E-mail transacional (SMTP)

Disparado em submissão de candidatura, contratação e rejeição. Falhas no envio **não bloqueiam** a operação principal, são apenas registradas.

### Arquivos e marca

Upload via S3 com URL pré-assinada para: avatar do candidato, currículo, logo e banner do tenant. O download autorizado também é por URL pré-assinada, validado pelo papel e pelo prefixo da chave. Existe ainda um recurso público de branding do tenant para o site de carreiras.

### Segurança e operação

Autenticação JWT com RBAC no token, CORS configurável, Helmet em produção e throttling global. Fora de `PROD`, o Swagger fica em `/docs`.

### Convites de ativação

Toda a entrada B2B **em produção** passa por **convite por email**, nunca por senha definida por terceiros. O `SUPER_ADMIN` convida o `TENANT_ADMIN` de cada empresa; depois é o próprio `TENANT_ADMIN` que convida os seus `RECRUITER` no contexto do tenant do JWT. O sourcing por email compartilha o mesmo mecanismo de convite para criar `CANDIDATE` quando o email ainda não existe na plataforma. Em todos os casos a API gera um token opaco de 32 bytes, persiste apenas o SHA 256, e o link único `${WEB_BASE_URL}/ativar/<token>` viaja exclusivamente por SMTP. O destinatário abre o link, define a sua própria senha e a conta é criada nesse momento, com login imediato.

### Onboarding B2B: caminho canônico vs. auto-registro

| Caminho | Quem inicia | Endpoint / UI | Uso recomendado |
|---|---|---|---|
| **Convite (canônico)** | `SUPER_ADMIN` convida `TENANT_ADMIN`; `TENANT_ADMIN` convida `RECRUITER` | `POST /invitations/tenant-admin`, `POST /invitations/recruiter`, `/ativar/[token]` | **Produção** e ambientes onde o operador controla quem entra |
| **Auto-registro + aprovação** | Futuro `TENANT_ADMIN` preenche formulário público | `POST /auth/register/tenant-admin`, `/registo`, aprovação em `/plataforma/empresas` | **Demo / piloto** quando não há operador disponível para convidar manualmente |

Regras:

- Em produção, prefira sempre o fluxo por **convite**. O auto-registro cria tenant inativo (`signupPending: true`) e exige aprovação do `SUPER_ADMIN` antes do login B2B funcionar.
- Os dois caminhos coexistem na API e na UI, mas o auto-registro não substitui convites para recrutadores: após aprovação, o `TENANT_ADMIN` ainda convida `RECRUITER` por email.
- Para desabilitar auto-registro em produção, remova ou proteja a rota `/registo` no frontend e não exponha `POST /auth/register/tenant-admin` publicamente (ex.: feature flag ou gateway).

### Sourcing por email

`TENANT_ADMIN` e `RECRUITER` fazem prospecção a partir do detalhe da vaga submetendo apenas `nome + email`. A API decide o efeito conforme o estado do email no domínio:

- **`CANDIDATE_INVITED`**: email não está registrado. É criado um `Invitation` com `role: CANDIDATE` e `tenantId: null`, e enviado link de ativação `${WEB_BASE_URL}/ativar/<token>`. Ao aceitar, o `User` e o `Candidate` são provisionados em transação, com o nome guardado no convite. A candidatura à vaga acontece quando o candidato a envia a partir da página pública.
- **`JOB_LINK_SENT`**: email pertence a um `User` `CANDIDATE` mas sem candidatura nesta vaga. Não é criado nada na plataforma; apenas é disparado um email com o link público da vaga (`${WEB_BASE_URL}/carreiras/<tenantId>/vagas/<jobId>`).
- **`ALREADY_APPLIED`**: já existe uma `Application` para o par (vaga, candidato). Nenhum email é enviado; a API responde com `applicationId` e o frontend mostra "candidato já se candidatou a esta vaga".

Se o email pertencer a um usuário interno (`SUPER_ADMIN`, `TENANT_ADMIN`, `RECRUITER`), a API responde `409 Conflict`.

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

- **Candidato:** `POST /applications/apply` só funciona para vagas `PUBLISHED` ou `PAUSED`; cria a candidatura em `APPLIED`, atribui a primeira `JobStage` como `currentJobStageId`, abre um `ApplicationStageProgress` em `PENDING` e regista a entrada inicial em `ApplicationHistory`.
- **Sourcing:** `POST /applications/sourced` não cria candidaturas. Conforme o estado do email envia convite de plataforma (`CANDIDATE_INVITED`), envia link público da vaga (`JOB_LINK_SENT`) ou responde sem efeito (`ALREADY_APPLIED`). A candidatura efetiva acontece quando o candidato submete `apply` a partir da página pública.

Regras de transição:

- Estados terminais (`REJECTED`, `WITHDRAWN`, `HIRED`) não evoluem para outros estados.
- Toda transição de status grava entrada em `ApplicationHistory` com usuário autor da mudança.
- Mover etapa via `PATCH /applications/:id/stage` atualiza `currentJobStageId`, garante status `IN_PROGRESS` se vier de `APPLIED`/`SOURCED` e cria/aproveita o `ApplicationStageProgress` da nova etapa.
- Candidato só pode desistir (`WITHDRAWN`) das próprias candidaturas.

### Papéis e permissões

| Papel | Escopo operacional |
|---|---|
| `SUPER_ADMIN` | Criar, listar, suspender, ativar e soft-delete de tenants; convidar `TENANT_ADMIN` por email (link único de ativação). |
| `TENANT_ADMIN` | Convidar `RECRUITER` por email (link único de ativação); gerir vagas e pipeline no tenant do **JWT**. |
| `RECRUITER` | Mesmo escopo operacional de vagas e candidaturas no tenant do **JWT**. |
| `CANDIDATE` | Registo/login, `GET/PATCH/DELETE /candidates/me`, `/applications/me` e candidatura com UUID do tenant na URL. |

### Resolução do tenant

- **B2B (`RECRUITER` / `TENANT_ADMIN`):** o tenant vem do `tenantId` do **JWT**, nunca por header. Um interceptor valida que o tenant existe e está ativo e grava o contexto em `AsyncLocalStorage`.
- **Candidato em rotas "por empresa":** usa o **UUID do tenant na URL** (ex.: `POST /tenants/:tenantId/applications/apply`).
- **Isolamento extra:** a extensão do Prisma client aplica filtro/injeção de `tenantId` em `job`, `application` e `applicationHistory` quando há contexto, mesmo que o use case se esqueça.

### Perfil único do candidato

- Um candidato → um perfil global, independente de quantas candidaturas tenha em diferentes tenants.
- Edição de perfil propaga aos dados de exibição em todas as candidaturas ativas.
- Anonimização remove dados identificáveis (nome, e-mail, telefone, currículo) mas preserva o histórico de pipeline necessário à auditoria.

### Arquivos (S3)

- Upload e download apenas por URL pré-assinada, com TTL configurável (`S3_PRESIGN_TTL_SECONDS`, 60–3600s, padrão 900).
- Limite referencial de upload definido por `S3_MAX_UPLOAD_BYTES` (padrão 10 MiB).
- Autorização de download por papel **e** prefixo da chave (ex.: currículo só ao próprio candidato e ao recrutador da vaga onde se candidatou).
- Recursos de branding do tenant (logo e banner) expostos publicamente para o site de carreiras.

### E-mail transacional

- Eventos que disparam envio: submissão de candidatura, contratação (`HIRED`), rejeição (`REJECTED`).
- O envio é *best-effort*: erros de SMTP são registrados mas não revertem a operação principal.

### Pipeline customizável

- Cada tenant tem **um** `PipelineTemplate` com etapas (`TemplateStage`). Caso não exista, o sistema cria automaticamente um template padrão com a etapa `Triagem` (`MANUAL`).
- Editável em `/empresa/pipeline` apenas pelo `TENANT_ADMIN`. As alterações **não retroagem** a vagas já criadas.
- Ao criar uma vaga, o template é clonado em `JobStage` (FK `jobId`). Enquanto a vaga estiver em `DRAFT`, o recrutador pode reordenar/adicionar/remover etapas em `/empresa/vagas/:jobId/etapas`. Após `PUBLISHED`/`PAUSED`/`CLOSED` as etapas ficam fixas.
- Cada etapa tem um `kind` que define a interação com o candidato: `MANUAL`, `QUESTIONNAIRE`, `INTERVIEW_LINK`, `FILE_UPLOAD`. Configurações específicas vivem em `JobStage.config` (JSON).
- Movimento entre etapas é por endpoint dedicado `PATCH /applications/:id/stage` (não viaja em `/move`, que continua a tratar de status macro). Cada movimento garante a existência de um `ApplicationStageProgress` `PENDING` para a nova etapa.
- O candidato vê em `/candidato/candidaturas/:id` apenas a etapa atual e pode submeter:
  * Para `QUESTIONNAIRE`: respostas validadas contra o `config.questions`.
  * Para `FILE_UPLOAD`: upload presigned no purpose `APPLICATION_STAGE_FILE`, com chave e metadados em `ApplicationStageProgress.submittedData`; tipos e limite de tamanho são impostos pela API.
- `INTERVIEW_LINK` é configurado pelo recrutador (`PATCH /applications/:id/stage/:jobStageId/interviewLink`), que armazena URL e agendamento na progress da própria candidatura, ficando visível para o candidato.

### Convites B2B (admin de tenant e recrutador)

- O onboarding de **ambos** os papéis B2B passa pela mesma máquina de convite. `SUPER_ADMIN` envia o convite ao futuro `TENANT_ADMIN` (`POST /invitations/tenant-admin`); o `TENANT_ADMIN` envia o convite a cada futuro `RECRUITER` no tenant do seu JWT (`POST /invitations/recruiter`). Em nenhum dos pedidos é possível enviar ou definir senha.
- A API gera um token opaco aleatório (32 bytes, base64url) e guarda **apenas o SHA 256**, evitando que uma fuga de leitura no Postgres comprometa convites pendentes.
- Cada novo convite para o mesmo email, empresa e papel revoga automaticamente os convites pendentes anteriores.
- Validade configurável por `INVITATION_TTL_HOURS` (1..720, padrão 72h). Convites expirados, já aceitos ou revogados deixam de ser utilizáveis.
- Se o envio SMTP falhar o convite é revogado, garantindo que não fica um token ativo em base de dados sem ter sido entregue.
- A ativação (`POST /invitations/:token/accept`) cria o usuário com o papel registrado no convite, marca o convite como aceito numa única transação, e devolve `access_token` e `refresh_token` (refresh opaco no banco) para login imediato.
