# Fluxos da Plataforma

> **Navegação:**
> - [Visão geral](./README.md)
> - [Funcionalidades e Regras de Negócio](./FUNCIONALIDADES.md)
> - [Modelo de Dados](./BANCO_DE_DADOS.md)
> - **Fluxos**

Conjunto de diagramas de fluxo (Mermaid `flowchart`) que descrevem os caminhos operacionais críticos do Deploy Talent. Cada secção foca um caso de uso ponta a ponta, identificando ramos felizes, validações e estados de erro relevantes na API. Para o ciclo de vida dos agregados (`Job.status`, `Application.status`) consulte o [Modelo de Dados](./BANCO_DE_DADOS.md).

## Autenticação e contexto B2B

Toda rota protegida valida o JWT, aplica RBAC pelo papel exigido e, quando a operação é *tenant scoped*, garante que o `tenantId` do token existe, está activo e é gravado no `AsyncLocalStorage` antes de chegar ao handler.

```mermaid
flowchart TD
    req([Request com Authorization: Bearer]) --> jwt[JwtAuthGuard valida assinatura e expiração]
    jwt -- inválido --> err401[401 Unauthorized]
    jwt -- ok --> roles{RolesGuard: papel autorizado?}
    roles -- não --> err403[403 Forbidden]
    roles -- sim --> tenantReq{Handler exige tenant?}
    tenantReq -- não --> handler[Use case executa]
    tenantReq -- sim --> tenantCheck{tenantId do JWT existe e está activo?}
    tenantCheck -- não --> err400[400 Bad Request]
    tenantCheck -- sim --> als[Interceptor grava tenantId em AsyncLocalStorage]
    als --> handler
    handler --> resp([Resposta com isolamento garantido pela extensão Prisma])
```

## Convite de admin de empresa

O `SUPER_ADMIN` provisiona empresas e convida o primeiro `TENANT_ADMIN`. O corpo do pedido nunca aceita palavra passe; o destinatário fá la na ativação.

```mermaid
flowchart TD
    start([SUPER_ADMIN: POST /invitations/tenant-admin]) --> tenant{Tenant existe e está activo?}
    tenant -- não --> err400[400 Bad Request]
    tenant -- sim --> userClash{Email já é utilizador?}
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
    start([TENANT_ADMIN: POST /invitations/recruiter]) --> tenant{Tenant do JWT activo?}
    tenant -- não --> err400[400 Bad Request]
    tenant -- sim --> userClash{Email já é utilizador?}
    userClash -- sim --> err409[409 Conflict]
    userClash -- não --> revoke[Revoga convites RECRUITER pendentes mesmo email + tenant]
    revoke --> token[Gera token e SHA 256]
    token --> persist[Persiste Invitation role=RECRUITER]
    persist --> send[Envia email com link /ativar/&lt;token&gt;]
    send -- falha SMTP --> rollback[Revoga convite criado]
    rollback --> err5xx[Propaga erro]
    send -- ok --> created([201 CreatedInvitation])
```

## Activação de conta via convite

A página `/ativar/[token]` no frontend é pública. Faz pré visualização para mostrar empresa e email, depois aceita a palavra passe escolhida e devolve um JWT pronto.

```mermaid
flowchart TD
    open([Destinatário abre /ativar/&lt;token&gt;]) --> preview[GET /invitations/:token]
    preview --> valid{Token válido, não aceite, não revogado e não expirado?}
    valid -- não --> err404[404 Not Found]
    valid -- sim --> show[Mostra empresa + email + formulário de palavra passe]
    show --> submit([POST /invitations/:token/accept])
    submit --> tenantOk{Tenant ainda activo?}
    tenantOk -- não --> err400[400 Bad Request]
    tenantOk -- sim --> clash{Email já é utilizador entretanto?}
    clash -- sim --> err409[409 Conflict]
    clash -- não --> tx[Transação: cria User com role do convite + marca aceitação]
    tx --> jwt[LoginUseCase emite access_token]
    jwt --> done([Frontend grava sessão e redirecciona para home do papel])
```

## Upload com URL pré assinada

Ficheiros (currículos, avatares, logos, banners) entram no S3 por PUT directo com URL pré assinada e TTL curto. A API só guarda a chave do objecto; as leituras geram outra URL assinada de GET.

```mermaid
flowchart TD
    pick([Cliente selecciona ficheiro]) --> presign[POST /media/presign-upload com kind, filename, contentType]
    presign --> auth{Papel autorizado para o kind?}
    auth -- não --> err403[403 Forbidden]
    auth -- sim --> sign[StorageService gera URL PUT + chave por tenant ou utilizador]
    sign --> resp[200 PresignedUrl: url, key, expiresAt]
    resp --> put[Browser faz PUT directo no S3]
    put -- erro --> abort[Cliente aborta sem chave persistida]
    put -- ok --> patch[Cliente envia a key ao PATCH do recurso ex. /tenants/current/branding]
    patch --> persisted[Recurso guarda apenas a key]
    persisted --> read([Leituras pedem GET presign on demand])
```

## Candidatura espontânea pelo candidato

O candidato aplica directamente a partir do site público de carreiras ou do marketplace. A vaga tem de estar a aceitar candidaturas e a entrada inicial é gravada no histórico.

```mermaid
flowchart TD
    browse([Candidato vê vaga em /carreiras ou /vagas]) --> session{Sessão de CANDIDATE activa?}
    session -- não --> auth[Login ou registo do candidato]
    auth --> apply
    session -- sim --> apply[POST /tenants/:tenantId/applications/apply com jobId]
    apply --> jobOk{Vaga PUBLISHED ou PAUSED?}
    jobOk -- não --> err400[400 Bad Request]
    jobOk -- sim --> dup{Já existe candidatura para esta vaga?}
    dup -- sim --> err409[409 Conflict]
    dup -- não --> create[Cria Application APPLIED + appliedAt]
    create --> history[Regista ApplicationHistory inicial]
    history --> notify[Email best effort: candidatura submetida]
    notify --> done([201 Application])
```

## Sourcing pelo recrutador

O recrutador cria uma candidatura em nome de um candidato encontrado fora da plataforma. Se o email ainda não existir, a API provisiona `User` + `Candidate` com palavra passe aleatória para o candidato poder recuperar a conta mais tarde.

```mermaid
flowchart TD
    start([RECRUITER: POST /applications/sourced com email + jobId]) --> jobOk{Vaga pertence ao tenant?}
    jobOk -- não --> err403[403 Forbidden]
    jobOk -- sim --> userExists{Email já é utilizador?}
    userExists -- sim --> candExists{Possui perfil Candidate?}
    candExists -- não --> err400[400 Bad Request]
    userExists -- não --> provision[Cria User CANDIDATE com palavra passe aleatória + Candidate]
    provision --> createApp
    candExists -- sim --> createApp[Cria Application SOURCED com sourcedByUserId = recrutador]
    createApp --> history[Regista ApplicationHistory: SOURCED → SOURCED com movedBy]
    history --> done([201 Application])
```

## Transição no pipeline de candidaturas

Cada movimento entre estados (`APPLIED → IN_PROGRESS → HIRED`, por exemplo) passa pelas regras da máquina de estados e regista a entrada de auditoria com o autor.

```mermaid
flowchart TD
    start([RECRUITER ou TENANT_ADMIN: PATCH /applications/:id/move]) --> scope{Application pertence ao tenant do JWT?}
    scope -- não --> err403[403 Forbidden]
    scope -- sim --> rules{Transição permitida pela máquina de estados?}
    rules -- não --> err400[400 Bad Request]
    rules -- sim --> tx[Transação: actualiza Application.status + grava ApplicationHistory]
    tx --> terminal{Estado terminal?}
    terminal -- HIRED --> emailHired[Email best effort: contratado]
    terminal -- REJECTED --> emailRej[Email best effort: rejeitado]
    terminal -- intermédio --> done
    emailHired --> done([200 Application])
    emailRej --> done
```

## Remoção de recrutador pelo tenant admin

Hard delete justificado pelo schema: as FKs em `applications`, `application_history`, `evaluations` e `invitations` usam `ON DELETE SET NULL`, preservando o histórico sem o nome do autor.

```mermaid
flowchart TD
    start([TENANT_ADMIN: DELETE /tenants/current/recruiters/:userId]) --> self{userId == ID do requisitante?}
    self -- sim --> err400[400 Bad Request]
    self -- não --> exists{Utilizador existe?}
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
