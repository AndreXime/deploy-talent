import { apiRequest } from '@/lib/api/client'
import type {
  CreatedInvitationResponse,
  InvitationPreviewResponse,
  SessionClaimsResponse,
} from '@/lib/api/types'

export function inviteTenantAdminRequest(body: { tenantId: string; email: string }) {
  return apiRequest<CreatedInvitationResponse>('/invitations/tenant-admin', {
    method: 'POST',
    json: body,
  })
}

export function inviteRecruiterRequest(body: { email: string }) {
  return apiRequest<CreatedInvitationResponse>('/invitations/recruiter', {
    method: 'POST',
    json: body,
  })
}

export function getInvitationByTokenRequest(invitationToken: string) {
  return apiRequest<InvitationPreviewResponse>(
    `/invitations/${encodeURIComponent(invitationToken)}`,
    { method: 'GET' },
  )
}

export function acceptInvitationRequest(invitationToken: string, body: { password: string }) {
  return apiRequest<SessionClaimsResponse>(
    `/invitations/${encodeURIComponent(invitationToken)}/accept`,
    { method: 'POST', json: body },
  )
}
