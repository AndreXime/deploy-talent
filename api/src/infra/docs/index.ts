import { DocumentBuilder } from '@nestjs/swagger'

export function buildOpenApiConfig() {
  return new DocumentBuilder()
    .setTitle('Deploy Talent — ATS API')
    .setDescription(
      [
        'API REST multi-tenant (pool compartilhado, isolamento por `tenant_id`).',
        '',
        '### Autenticação',
        '- **JWT (access)**: header `Authorization: Bearer <jwt>` ou **cookie httpOnly** `deploy_talent_access_token` quando o primeiro login/cadastro/refresco define `Set-Cookie` (`SameSite=Lax`, `credentials: include` entre origens CORS configuradas). O JSON já não inclui os tokens crus; há `GET /auth/session`.',
        '- **Bearer no Swagger/OpenAPI**: após autorizar pode colar aqui um access JWT obtido pela própria UI do Swagger só enquanto testa fora do fluxo de cookies.',
        '- **Refresh opaco**: cookie httpOnly `deploy_talent_refresh_token` ou corpo de `POST /auth/refresh` (útil em clientes não-browser).',
        '- **Tenant (B2B)**: `RECRUITER`/`TENANT_ADMIN` — o tenant vem do **JWT** (sem header).',
        '- **Candidato em rotas por empresa**: use o **UUID do tenant na URL** (ex.: candidatura a uma vaga).',
        '',
        '### Papéis (JWT `role`)',
        '- `SUPER_ADMIN`: gestão de tenants (plataforma).',
        '- `TENANT_ADMIN`: configura empresa e convida `RECRUITER` (tenant no JWT).',
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
        description: 'Access JWT.',
      },
      'bearer',
    )
    .addTag('Health', 'Verificação básica de disponibilidade (sem autenticação).')
    .addTag('Auth', 'Login público e registro; provisioning de admins/recrutadores (JWT + papel).')
    .addTag(
      'Tenants',
      'CRUD gestão da plataforma: empresas, suspender, soft delete. **`SUPER_ADMIN` + Bearer** apenas.',
    )
    .addTag(
      'Jobs',
      'Vagas do tenant atual. **`TENANT_ADMIN`/`RECRUITER` + Bearer** (tenant no JWT).',
    )
    .addTag(
      'Candidates',
      'Perfil B2C (one-profile). **`CANDIDATE` + Bearer**. Rotas de perfil sem tenant na URL.',
    )
    .addTag(
      'Applications',
      'Candidaturas, sourcing, mover pipeline e avaliações. Segurança aplicada por rota (JWT; tenant obrigatório onde indicado).',
    )
    .build()
}
