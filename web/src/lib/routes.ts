export function homePathForRole(role: string): string {
  switch (role) {
    case 'CANDIDATE':
      return '/candidato'
    case 'TENANT_ADMIN':
    case 'RECRUITER':
      return '/empresa'
    case 'SUPER_ADMIN':
      return '/plataforma/empresas'
    default:
      return '/'
  }
}
