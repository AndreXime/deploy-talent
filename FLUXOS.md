# Fluxos da Plataforma

> **Navegação:**
> - [Visão geral](./README.md)
> - [Funcionalidades e Regras de Negócio](./FUNCIONALIDADES.md)
> - [Modelo de Dados](./BANCO_DE_DADOS.md)
> - **Fluxos**

Conjunto de diagramas de fluxo (Mermaid `flowchart`) que descrevem os caminhos operacionais críticos do Deploy Talent. Cada seção foca um caso de uso ponta a ponta, identificando ramos felizes, validações e estados de erro relevantes na API. Para o ciclo de vida dos agregados (`Job.status`, `Application.status`) consulte o [Modelo de Dados](./BANCO_DE_DADOS.md).

## Autenticação e contexto B2B

Toda rota protegida valida o JWT, aplica RBAC pelo papel exigido e, quando a operação é *tenant scoped*, garante que o `tenantId` do token existe, está ativo e é gravado no `AsyncLocalStorage` antes de chegar ao handler.

```mermaid
flowchart TD
    req([Request com Authorization: Bearer]) --> jwt[JwtAuthGuard valida assinatura e expiração]
    jwt -- inválido --> err401[401 Unauthorized]
    jwt -- ok --> roles{RolesGuard: papel autorizado?}
    roles -- não --> err403[403 Forbidden]
    roles -- sim --> tenantReq{Handler exige tenant?}
    tenantReq -- não --> handler[Use case executa]
    tenantReq -- sim --> tenantCheck{tenantId do JWT existe e está ativo?}
    tenantCheck -- não --> err400[400 Bad Request]
    tenantCheck -- sim --> als[Interceptor grava tenantId em AsyncLocalStorage]
    als --> handler
    handler --> resp([Resposta com isolamento garantido pela extensão Prisma])
```

## Convite de admin de empresa

O `SUPER_ADMIN` provisiona empresas e convida o primeiro `TENANT_ADMIN`. O corpo do pedido nunca aceita senha; o destinatário faz isso na ativação.

```mermaid
flowchart TD
    start([SUPER_ADMIN: POST /invitations/tenant-admin]) --> tenant{Tenant existe e está ativo?}
    tenant -- não --> err400[400 Bad Request]
    tenant -- sim --> userClash{Email já é usuário?}
    userClash -- sim --> err409[409 Conflict]
    userClash -- não --> revoke[Revoga convites pendentes mesmo email + tenant]
    revoke --> token[Gera token aleatório 32 bytes e SHA 256]
    token --> persist[Persiste Invitation com tokenHash e expiresAt]
    persist --> send[InvitationEmailNotifier envia link único]
    send -- falha SMTP --> rollback[Revoga convite recém criado]
    rollback --> err5xx[Propaga erro ao cliente]
    send -- ok --> created([201 CreatedInvitation])
```

## Convite de recrutador

O `TENANT_ADMIN` repete o mesmo padrão, mas o tenant vem implicitamente do JWT e o papel é `RECRUITER`.

```mermaid
flowchart TD
    start([TENANT_ADMIN: POST /invitations/recruiter]) --> tenant{Tenant do JWT ativo?}
    tenant -- não --> err400[400 Bad Request]
    tenant -- sim --> userClash{Email já é usuário?}
    userClash -- sim --> err409[409 Conflict]
    userClash -- não --> revoke[Revoga convites RECRUITER pendentes mesmo email + tenant]
    revoke --> token[Gera token e SHA 256]
    token --> persist[Persiste Invitation role=RECRUITER]
    persist --> send[Envia email com link /ativar/&lt;token&gt;]
    send -- falha SMTP --> rollback[Revoga convite criado]
    rollback --> err5xx[Propaga erro]
    send -- ok --> created([201 CreatedInvitation])
```

## Ativação de conta via convite

A página `/ativar/[token]` no frontend é pública. Faz prévia para mostrar nome, empresa (quando B2B) e email, depois aceita a senha escolhida e devolve um JWT pronto. Para convites `CANDIDATE` (sourcing) também é criado o `Candidate` na mesma transação.

```mermaid
flowchart TD
    open([Destinatário abre /ativar/&lt;token&gt;]) --> preview[GET /invitations/:token]
    preview --> valid{Token válido, não aceite, não revogado e não expirado?}
    valid -- não --> err404[404 Not Found]
    valid -- sim --> show[Mostra dados do convite e formulário de senha]
    show --> submit([POST /invitations/:token/accept])
    submit --> isB2b{Convite B2B?}
    isB2b -- sim --> tenantOk{Tenant ainda ativo?}
    tenantOk -- não --> err400[400 Bad Request]
    isB2b -- não --> clash
    tenantOk -- sim --> clash{Email já é usuário entretanto?}
    clash -- sim --> err409[409 Conflict]
    clash -- não --> tx[Transação: cria User com role do convite, cria Candidate se role=CANDIDATE, marca aceitação]
    tx --> jwt[LoginUseCase emite access_token]
    jwt --> done([Frontend grava sessão e redireciona para home do papel])
```

## Upload com URL pré assinada

Arquivos (currículos, avatares, logos, banners) entram no S3 por PUT direto com URL pré assinada e TTL curto. A API só guarda a chave do objeto; as leituras geram outra URL assinada de GET.

```mermaid
flowchart TD
    pick([Cliente selecciona arquivo]) --> presign[POST /media/presign-upload com kind, filename, contentType]
    presign --> auth{Papel autorizado para o kind?}
    auth -- não --> err403[403 Forbidden]
    auth -- sim --> sign[StorageService gera URL PUT + chave por tenant ou usuário]
    sign --> resp[200 PresignedUrl: url, key, expiresAt]
    resp --> put[Browser faz PUT direto no S3]
    put -- erro --> abort[Cliente aborta sem chave persistida]
    put -- ok --> patch[Cliente envia a key ao PATCH do recurso ex. /tenants/current/branding]
    patch --> persisted[Recurso guarda apenas a key]
    persisted --> read([Leituras pedem GET presign on demand])
```

## Candidatura espontânea pelo candidato

O candidato aplica directamente a partir do site público de carreiras ou do marketplace. A vaga tem de estar a aceitar candidaturas e a entrada inicial é gravada no histórico.

```mermaid
flowchart TD
    browse([Candidato vê vaga em /carreiras ou /vagas]) --> session{Sessão de CANDIDATE ativa?}
    session -- não --> auth[Login ou registo do candidato]
    auth --> apply
    session -- sim --> apply[POST /tenants/:tenantId/applications/apply com jobId]
    apply --> jobOk{Vaga PUBLISHED ou PAUSED?}
    jobOk -- não --> err400[400 Bad Request]
    jobOk -- sim --> dup{Já existe candidatura para esta vaga?}
    dup -- sim --> err409[409 Conflict]
    dup -- não --> firstStage[Carrega a primeira JobStage da vaga]
    firstStage --> create[Cria Application APPLIED com currentJobStageId + appliedAt]
    create --> progress[Cria ApplicationStageProgress PENDING para a etapa inicial]
    progress --> history[Regista ApplicationHistory inicial com nome da etapa]
    history --> notify[Email best effort: candidatura submetida]
    notify --> done([201 Application])
```

## Sourcing por email pelo recrutador

O recrutador faz prospecção por email a partir da vaga. A API decide o efeito a partir do estado do email na plataforma: convite para se cadastrar, email com link da vaga, ou nada se já existir candidatura. Nenhuma candidatura é criada pelo lado da empresa; o candidato submete `apply` quando quiser.

```mermaid
flowchart TD
    start([RECRUITER: POST /applications/sourced com nome + email + jobId]) --> jobOk{Vaga pertence ao tenant?}
    jobOk -- não --> err404[404 Not Found]
    jobOk -- sim --> userExists{Email pertence a um User?}
    userExists -- não --> invite[Cria Invitation CANDIDATE com tenantId null]
    invite --> emailInvite[Email com link /ativar/&lt;token&gt;]
    emailInvite --> doneInvited([201 CANDIDATE_INVITED])

    userExists -- sim --> isCandidate{Role do User é CANDIDATE?}
    isCandidate -- não --> err409[409 Conflict]
    isCandidate -- sim --> hasApp{Já existe Application para esta vaga?}
    hasApp -- sim --> noOp[Nada enviado, devolve applicationId]
    noOp --> doneApplied([201 ALREADY_APPLIED])
    hasApp -- não --> emailJob[Email com link público da vaga carreiras/&lt;tenantId&gt;/vagas/&lt;jobId&gt;]
    emailJob --> doneLink([201 JOB_LINK_SENT])
```

## Transição no pipeline de candidaturas

A pipeline tem dois eixos independentes: status macro (`/move`) e etapa customizável (`/stage`). O candidato vê e interage apenas com a etapa atual.

### Mudança de status macro

```mermaid
flowchart TD
    start([RECRUITER ou TENANT_ADMIN: PATCH /applications/:id/move]) --> scope{Application pertence ao tenant do JWT?}
    scope -- não --> err403[403 Forbidden]
    scope -- sim --> rules{Transição permitida pela máquina de estados?}
    rules -- não --> err400[400 Bad Request]
    rules -- sim --> tx[Transação: atualiza Application.status + grava ApplicationHistory]
    tx --> terminal{Estado terminal?}
    terminal -- HIRED --> emailHired[Email best effort: contratado]
    terminal -- REJECTED --> emailRej[Email best effort: rejeitado]
    terminal -- intermédio --> done
    emailHired --> done([200 Application])
    emailRej --> done
```

### Mover etapa da pipeline customizável

```mermaid
flowchart TD
    start([RECRUITER ou TENANT_ADMIN: PATCH /applications/:id/stage com jobStageId]) --> own{Application no tenant do JWT?}
    own -- não --> err403[403 Forbidden]
    own -- sim --> stageOk{JobStage pertence à mesma vaga?}
    stageOk -- não --> err400[400 Bad Request]
    stageOk -- sim --> bumpStatus[Se status era APPLIED ou SOURCED passa a IN_PROGRESS]
    bumpStatus --> cursor[Atualiza Application.currentJobStageId]
    cursor --> progress[Upsert ApplicationStageProgress PENDING para a etapa]
    progress --> history[Regista ApplicationHistory com fromStage e toStage por nome]
    history --> done([200 ApplicationStageProgress])
```

### Submissão do candidato na etapa atual

```mermaid
flowchart TD
    start([CANDIDATE: POST /applications/me/:id/currentStage/submit]) --> hasStage{currentJobStageId definido?}
    hasStage -- não --> err400b[400 Bad Request]
    hasStage -- sim --> alive{Status diferente de HIRED, REJECTED, WITHDRAWN?}
    alive -- não --> err400c[400 Bad Request]
    alive -- sim --> validate[validateStageSubmission(kind, config, payload)]
    validate -- erro --> err400d[400 Bad Request com detalhe]
    validate -- ok --> upsert[Upsert ApplicationStageProgress COMPLETED com submittedData e completedByUserId]
    upsert --> doneSubmit([200 ApplicationStageProgress])
```

### Recrutador define link de entrevista

```mermaid
flowchart TD
    startIv([RECRUITER: PATCH /applications/:id/stage/:jobStageId/interviewLink]) --> kindOk{JobStage.kind = INTERVIEW_LINK?}
    kindOk -- não --> err400e[400 Bad Request]
    kindOk -- sim --> validateLink[Valida url e scheduledAt opcional]
    validateLink --> upsertIv[Upsert ApplicationStageProgress com url e scheduledAt em submittedData]
    upsertIv --> doneIv([200 ApplicationStageProgress])
```

## Remoção de recrutador pelo tenant admin

Hard delete justificado pelo schema: as FKs em `applications`, `application_history` e `invitations` usam `ON DELETE SET NULL`, preservando o histórico sem o nome do autor.

```mermaid
flowchart TD
    start([TENANT_ADMIN: DELETE /tenants/current/recruiters/:userId]) --> self{userId == ID do requisitante?}
    self -- sim --> err400[400 Bad Request]
    self -- não --> exists{Usuário existe?}
    exists -- não --> err404[404 Not Found]
    exists -- sim --> scope{Pertence ao tenant e tem papel RECRUITER?}
    scope -- não --> err403[403 Forbidden]
    scope -- sim --> del[Prisma.user.delete]
    del --> setnull[FKs com ON DELETE SET NULL preservam histórico]
    setnull --> done([204 No Content])
```

## Site público de carreiras e marketplace

O Next.js consome endpoints públicos para servir tanto o site dedicado de cada empresa (`/carreiras/[tenantId]/...`) como o marketplace agregado (`/vagas`). Ambos os caminhos terminam na candidatura espontânea descrita acima.

```mermaid
flowchart TD
    visitor([Visitante]) --> route{Rota?}
    route -- /carreiras/:slug --> resolve[GET /tenants/public/by-slug/:slug]
    resolve --> tenantJobs[GET /tenants/:tenantId/jobs]
    route -- /vagas --> market[GET /jobs/public com filtros e facetas]
    tenantJobs --> render[Página com cards de vagas + branding da empresa]
    market --> render
    render --> detail([Visitante abre detalhe e segue para candidatura])
```
