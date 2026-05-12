import { apiRequest } from '@/lib/api/client'
import type {
  AccessTokenResponse,
  CreatedInvitationResponse,
  InvitationPreviewResponse,
} from '@/lib/api/types'

export function inviteTenantAdminRequest(token: string, body: { tenantId: string; email: string }) {
  return apiRequest<CreatedInvitationResponse>('/invitations/tenant-admin', {
    method: 'POST',
    token,
    json: body,
  })
}

export function inviteRecruiterRequest(token: string, body: { email: string }) {
  return apiRequest<CreatedInvitationResponse>('/invitations/recruiter', {
    method: 'POST',
    token,
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
  return apiRequest<AccessTokenResponse>(
    `/invitations/${encodeURIComponent(invitationToken)}/accept`,
    { method: 'POST', json: body },
  )
}
