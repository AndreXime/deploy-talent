import { DocumentBuilder } from '@nestjs/swagger'

export function buildOpenApiConfig() {
  return new DocumentBuilder()
    .setTitle('Deploy Talent — ATS API')
    .setDescription(
      [
        'API REST multi-tenant (pool compartilhado, isolamento por `tenant_id`).',
        '',
        '### Autenticação',
        '- **Bearer JWT**: obtido via `POST /auth/login`, `POST /auth/register/candidate` ou provisioning admin.',
        '- **Tenant**: onde indicado nas rotas, envie `X-Tenant-ID` com o **UUID do registro `Tenant`** (não usar slug neste header).',
        '',
        '### Papéis (JWT `role`)',
        '- `SUPER_ADMIN`: gestão de tenants (plataforma).',
        '- `TENANT_ADMIN`: configura empresa e convida `RECRUITER` (precisa tenant no header onde aplicável).',
        '- `RECRUITER`: vagas e pipeline no tenant atual.',
        '- `CANDIDATE`: perfil global e candidaturas.',
      ].join('\n'),
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Cole aqui o `access_token` retornado pelo login/register.',
      },
      'bearer',
    )
    .addApiKey(
      {
        type: 'apiKey',
        in: 'header',
        name: 'X-Tenant-ID',
        description: '`Tenant.id` (UUID) da empresa atual. Obrigatório nas rotas B2B marcadas nesta spec.',
      },
      'tenant',
    )
    .addTag(
      'Health',
      'Verificação básica de disponibilidade (sem autenticação).',
    )
    .addTag(
      'Auth',
      'Login público e registro; provisioning de admins/recrutadores (JWT + papel).',
    )
    .addTag(
      'Tenants',
      'CRUD gestão da plataforma: empresas, suspender, soft delete. **`SUPER_ADMIN` + Bearer** apenas.',
    )
    .addTag(
      'Jobs',
      'Vagas do tenant atual. **`TENANT_ADMIN`/`RECRUITER` + Bearer + `X-Tenant-ID`**.',
    )
    .addTag(
      'Candidates',
      'Perfil B2C (one-profile). **`CANDIDATE` + Bearer**. `X-Tenant-ID` não é necessário nestes endpoints.',
    )
    .addTag(
      'Applications',
      'Candidaturas, sourcing, mover pipeline e avaliações. Segurança aplicada por rota (JWT; tenant obrigatório onde indicado).',
    )
    .build()
}
