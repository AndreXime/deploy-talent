### Especificação de Regras de Negócio: Plataforma de Recrutamento Multi-Tenant (ATS)

Este documento detalha o core domain e as regras de negócio da plataforma, estruturadas por agregados e entidades principais.

---

### 1. Isolamento de Domínio e Multi-Tenancy

A plataforma opera sob uma arquitetura de *Pool* (banco e schemas compartilhados). O isolamento lógico dita as seguintes regras fundamentais:

*   **Identidade do Tenant (`tenant_id`):** O `tenant_id` representa uma Empresa cliente da plataforma.
*   **Fronteira de Dados B2B:** Nenhuma entidade transacional pertencente a um tenant (Vagas, Notas, Estágios de Pipeline, Recrutadores) pode ser acessada, lida ou modificada por outro tenant.
*   **Fronteira de Dados B2C (Candidatos):** O perfil do candidato (Dados Pessoais, Currículo, Skills) pertence à Plataforma (Global Pool). No entanto, os *dados da candidatura* (Respostas a formulários customizados, status no funil, histórico de mensagens com a empresa) pertencem ao cruzamento entre Candidato e Tenant (Entidade `Application`).
*   **Deleção Lógica (Soft Delete):** A exclusão de um Tenant não remove os registros físicos imediatamente por questões de conformidade legal e auditoria. Aplica-se uma *flag* `deleted_at`, inativando acesso a todos os recursos associados.

---

### 2. Atores e RBAC (Role-Based Access Control)

As permissões operam em uma matriz de controle de acesso rigorosa.

**2.1. Platform Admin (SuperUser)**
*   Acesso restrito à infraestrutura raiz.
*   **Regras:** Pode suspender, ativar ou excluir Tenants. Não possui acesso ao conteúdo interno dos Tenants (ex: mensagens, currículos, avaliações) por motivos de privacidade.

**2.2. Tenant Admin (Administrador da Empresa)**
*   Escopo de acesso limitado ao seu `tenant_id`.
*   **Regras:** Pode gerenciar o *billing* (assinaturas), alterar configurações globais da empresa (branding, subdomínio) e convidar ou revogar acesso de outros recrutadores.

**2.3. Recruiter (Recrutador / Hiring Manager)**
*   Escopo de acesso limitado ao seu `tenant_id`.
*   **Regras:** Pode criar e editar vagas, visualizar candidaturas, alterar o status de candidatos no pipeline e adicionar notas internas.
*   *Variação (Hiring Manager):* Pode ter visualização restrita apenas às vagas nas quais está explicitamente designado como responsável.

**2.4. Candidate (Candidato)**
*   Escopo Global (Plataforma).
*   **Regras:** Tem acesso de escrita apenas ao seu próprio perfil e às suas candidaturas. Não visualiza notas internas da empresa, visualiza apenas o status atual público (ex: "Em análise", "Entrevista", "Processo Encerrado").

---

### 3. Máquina de Estados: Vagas (Jobs)

A entidade `Job` possui um ciclo de vida estrito controlado por estados.

*   **DRAFT (Rascunho):** A vaga está sendo editada. Inivísvel para candidatos. Nenhuma candidatura pode ser recebida.
*   **PUBLISHED (Publicada):** A vaga está visível na página de carreiras (subdomínio do tenant). Aceita novas candidaturas (Criação de `Application`).
*   **PAUSED (Pausada):** A vaga temporariamente não recebe novas candidaturas (botão "Aplicar" desabilitado), mas permanece visível ou acessível para quem tem o link. Processos seletivos em andamento continuam.
*   **CLOSED (Fechada):** A vaga foi preenchida ou cancelada. Não aceita novas candidaturas. Candidatos associados que não foram contratados devem ser movidos para um status final (ex: "Não selecionado").

**Restrições Adicionais:**
*   Para transicionar de DRAFT para PUBLISHED, campos obrigatórios devem ser validados (Título, Descrição, Modalidade, Localização, Senioridade).

---

### 4. Entidade: Perfil do Candidato (Candidate Profile)

O sistema adota o modelo *One-Profile* (Single Sign-On B2C).

*   **Propriedade de Dados:** O candidato é o dono de seus dados mestre (Nome, Histórico Profissional, Contatos, Skills).
*   **Atualização em Cascata:** Se um candidato atualiza seu currículo ou telefone, essa alteração reflete imediatamente para todos os recrutadores que possuem aplicações ativas com este candidato.
*   **Consentimento (LGPD/GDPR):** O candidato pode solicitar o "Esquecimento" (exclusão de conta). Se isso ocorrer, seus dados de identificação pessoal (PII) nos pipelines das empresas (Tenants) devem ser anonimizados.

---

### 5. Máquina de Estados e Regras: Pipeline de Recrutamento (Applications)

A entidade `Application` é o relacionamento entre um `Candidate` e um `Job`. É a entidade de maior carga transacional.

**5.1. Fluxo do Pipeline (Estágios Customizáveis)**
Embora cada tenant possa criar estágios customizados (ex: "Desafio Técnico", "Fit Cultural"), existem macro-estados lógicos obrigatórios sob o capô:

1.  **SOURCED (Busca Ativa):** O candidato foi adicionado ao pipeline por um recrutador. O candidato deve ser notificado e consentir com a participação para que a candidatura avance.
2.  **APPLIED (Inscrito):** Ação originada pelo candidato. Data e hora de submissão marcadas como imutáveis.
3.  **IN_PROGRESS (Em Processo):** O candidato está se movendo entre as etapas configuradas pelo tenant.
4.  **REJECTED (Rejeitado):** Estado final terminal. O candidato não foi selecionado.
    *   *Regra:* O sistema deve permitir envio de feedback assíncrono programado (evitar aviso imediato para mitigar atrito).
5.  **WITHDRAWN (Desistência):** Estado final terminal originado pelo candidato.
6.  **HIRED (Contratado):** Estado final de sucesso.
    *   *Regra:* Transicionar um candidato para HIRED pode disparar a automação para sugerir a mudança da vaga (Job) para CLOSED.

**5.2. Regras de Colaboração e Auditoria**
*   **Blind Reviews (Opcional):** Para mitigar viés inconsciente, a plataforma pode ter um modo de anonimização onde o recrutador não vê fotos, idade ou gênero do candidato nas primeiras fases do funil.
*   **Imutabilidade de Histórico:** Qualquer mudança de estágio no pipeline (de `Applied` para `Interview`, por exemplo) gera um log inalterável de auditoria (`ApplicationHistory`), contendo: quem moveu, qual candidato, de onde, para onde e o timestamp.
*   **Isolamento de Feedback:** O modelo `Evaluation` (notas da entrevista) é rigidamente atrelado ao `tenant_id` e à `application_id`. Candidatos nunca têm acesso de leitura a esta tabela.