# Modelo de Dados

> **Navegação:** [Visão geral](./README.md) · [Funcionalidades e Regras de Negócio](./FUNCIONALIDADES.md) · **Modelo de Dados**

Diagrama do banco de dados PostgreSQL gerido pelo Prisma. O schema vive em `api/prisma/schema/*.prisma` e está particionado por agregado (`tenants`, `users`, `candidates`, `jobs`, `applications`, `evaluations`).

## Diagrama ER

```mermaid
erDiagram
    TENANT ||--o{ USER                 : "emprega"
    TENANT ||--o{ JOB                  : "publica"
    TENANT ||--o{ APPLICATION          : "agrega"
    TENANT ||--o{ APPLICATION_HISTORY  : "audita"
    TENANT ||--o{ EVALUATION           : "armazena"
    TENANT ||--o{ INVITATION           : "convida"

    USER ||--o| CANDIDATE              : "perfil"
    USER ||--o{ APPLICATION            : "sourced_by"
    USER ||--o{ APPLICATION_HISTORY    : "moved_by"
    USER ||--o{ EVALUATION             : "created_by"
    USER ||--o{ INVITATION             : "convidado_por"

    CANDIDATE ||--o{ APPLICATION       : "candidata"
    CANDIDATE ||--o{ SAVED_JOB         : "guarda"

    JOB ||--o{ APPLICATION             : "recebe"
    JOB ||--o{ SAVED_JOB               : "salva"

    APPLICATION ||--o{ APPLICATION_HISTORY : "histórico"
    APPLICATION ||--o{ EVALUATION          : "avaliações"

    TENANT {
        uuid     id PK
        string   name
        string   slug UK
        boolean  isActive
        datetime deletedAt "soft delete"
        string   logoKey   "S3 key"
        string   bannerKey "S3 key"
        datetime createdAt
        datetime updatedAt
    }

    USER {
        uuid     id PK
        string   email UK
        string   passwordHash
        enum     role "SUPER_ADMIN|TENANT_ADMIN|RECRUITER|CANDIDATE"
        uuid     tenantId FK "nullable"
        string   avatarKey "S3 key"
        datetime createdAt
        datetime updatedAt
    }

    CANDIDATE {
        uuid     id PK
        uuid     userId FK,UK
        string   name
        string   email UK
        string   phone "nullable"
        string   resumeKey "S3 key"
        string   avatarKey "S3 key"
        datetime deletedAt    "nullable"
        datetime anonymizedAt "nullable"
        datetime createdAt
        datetime updatedAt
    }

    JOB {
        uuid     id PK
        uuid     tenantId FK
        string   title
        string   description
        string   modality
        string   location
        string   seniority
        enum     status "DRAFT|PUBLISHED|PAUSED|CLOSED"
        datetime createdAt
        datetime updatedAt
    }

    APPLICATION {
        uuid     id PK
        uuid     tenantId FK
        uuid     jobId FK
        uuid     candidateId FK
        uuid     sourcedByUserId FK "nullable"
        enum     status "SOURCED|APPLIED|IN_PROGRESS|REJECTED|WITHDRAWN|HIRED"
        string   stage  "nullable"
        datetime appliedAt "nullable"
        datetime createdAt
        datetime updatedAt
    }

    APPLICATION_HISTORY {
        uuid     id PK
        uuid     tenantId FK
        uuid     applicationId FK
        uuid     movedByUserId FK "nullable"
        enum     fromStatus
        enum     toStatus
        string   fromStage "nullable"
        string   toStage   "nullable"
        datetime createdAt
    }

    EVALUATION {
        uuid     id PK
        uuid     tenantId FK
        uuid     applicationId FK
        uuid     createdByUserId FK "nullable"
        int      score "nullable"
        string   notes "nullable"
        datetime createdAt
        datetime updatedAt
    }

    SAVED_JOB {
        uuid     id PK
        uuid     candidateId FK
        uuid     jobId FK
        datetime createdAt
    }

    INVITATION {
        uuid     id PK
        string   email
        enum     role "SUPER_ADMIN|TENANT_ADMIN|RECRUITER|CANDIDATE"
        uuid     tenantId FK "nullable"
        string   tokenHash UK "SHA 256 do token"
        uuid     invitedByUserId FK "nullable"
        datetime expiresAt
        datetime acceptedAt "nullable"
        datetime revokedAt  "nullable"
        datetime createdAt
        datetime updatedAt
    }
```

## Constraints e índices relevantes

| Tabela | Constraint | Notas |
|---|---|---|
| `tenants` | `slug` único | usado nas URLs públicas de carreiras |
| `users` | `email` único | login global |
| `users` | FK `tenantId` `ON DELETE SET NULL` | candidato/super admin não têm tenant |
| `candidates` | `userId` único | `1..1` com `User` (*one profile*) |
| `candidates` | `email` único | independente do utilizador |
| `applications` | único `(tenantId, jobId, candidateId)` | impede duplicar candidatura |
| `applications` | FK `sourcedByUserId` `ON DELETE SET NULL` | autor do *sourcing* opcional |
| `application_history` | FK `movedByUserId` `ON DELETE SET NULL` | preserva histórico mesmo se o utilizador for removido |
| `evaluations` | FK `createdByUserId` `ON DELETE SET NULL` | preserva avaliações órfãs |
| `saved_jobs` | único `(candidateId, jobId)` | sem duplicados de favoritos |
| `invitations` | `tokenHash` único | impede colisões e permite lookup directo pelo token recebido por email |
| `invitations` | FK `tenantId` `ON DELETE CASCADE` | apagar a empresa invalida convites pendentes |
| `invitations` | FK `invitedByUserId` `ON DELETE SET NULL` | mantém auditoria mesmo após remoção do autor |

Todas as FKs para `Tenant`, `Job`, `Candidate` e `Application` propagam com `ON DELETE CASCADE`; apagar um tenant remove o seu universo de dados (vagas, candidaturas, histórico, avaliações).

## Ciclo de vida: Vagas (`Job.status`)

```mermaid
stateDiagram-v2
    [*] --> DRAFT
    DRAFT --> PUBLISHED : valida campos obrigatórios
    PUBLISHED --> PAUSED
    PUBLISHED --> CLOSED
    PAUSED --> PUBLISHED
    PAUSED --> CLOSED
    CLOSED --> [*]
```

Transições permitidas só pelo use case de mudança de status. A passagem para `PUBLISHED` exige `title`, `description`, `modality`, `location` e `seniority` não vazios. `CLOSED` é terminal.

## Ciclo de vida: Candidaturas (`Application.status`)

```mermaid
stateDiagram-v2
    [*] --> SOURCED : recrutador
    [*] --> APPLIED : candidato
    SOURCED --> IN_PROGRESS
    SOURCED --> REJECTED
    APPLIED --> IN_PROGRESS
    APPLIED --> REJECTED
    APPLIED --> WITHDRAWN : pelo candidato
    IN_PROGRESS --> REJECTED
    IN_PROGRESS --> HIRED
    IN_PROGRESS --> WITHDRAWN : pelo candidato
    REJECTED --> [*]
    WITHDRAWN --> [*]
    HIRED --> [*]
```

Toda transição grava entrada em `ApplicationHistory` com `fromStatus`/`toStatus`, `fromStage`/`toStage` e o `movedByUserId` que executou a ação. Estados `REJECTED`, `WITHDRAWN` e `HIRED` são terminais.

## Isolamento por tenant

Além das FKs explícitas, o Prisma client é estendido para injetar/limitar `tenantId` nas queries de `Job`, `Application`, `ApplicationHistory` e `Evaluation` quando o contexto está definido em `AsyncLocalStorage`. Funciona como rede de segurança caso um use case esqueça o filtro.
