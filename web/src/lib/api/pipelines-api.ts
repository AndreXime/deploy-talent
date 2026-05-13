import { apiRequest } from '@/lib/api/client'
import type {
  ApplicationCurrentStageResponse,
  ApplicationStageProgressResponse,
  PipelineStageInput,
  PipelineStageResponse,
  PipelineTemplateResponse,
} from '@/lib/api/types'

export function getTenantPipeline(token: string) {
  return apiRequest<PipelineTemplateResponse>('/tenants/current/pipeline', {
    method: 'GET',
    token,
  })
}

export function replaceTenantPipeline(token: string, stages: PipelineStageInput[]) {
  return apiRequest<PipelineTemplateResponse>('/tenants/current/pipeline', {
    method: 'PUT',
    token,
    json: { stages },
  })
}

export function listJobStages(token: string, jobId: string) {
  return apiRequest<PipelineStageResponse[]>(`/jobs/${encodeURIComponent(jobId)}/stages`, {
    method: 'GET',
    token,
  })
}

export function replaceJobStages(token: string, jobId: string, stages: PipelineStageInput[]) {
  return apiRequest<PipelineStageResponse[]>(`/jobs/${encodeURIComponent(jobId)}/stages`, {
    method: 'PUT',
    token,
    json: { stages },
  })
}

export function moveApplicationStage(token: string, applicationId: string, jobStageId: string) {
  return apiRequest<ApplicationStageProgressResponse>(
    `/applications/${encodeURIComponent(applicationId)}/stage`,
    { method: 'PATCH', token, json: { jobStageId } },
  )
}

export function listApplicationProgress(token: string, applicationId: string) {
  return apiRequest<ApplicationStageProgressResponse[]>(
    `/applications/${encodeURIComponent(applicationId)}/progress`,
    { method: 'GET', token },
  )
}

export function getMyCurrentStage(token: string, applicationId: string) {
  return apiRequest<ApplicationCurrentStageResponse>(
    `/applications/me/${encodeURIComponent(applicationId)}/currentStage`,
    { method: 'GET', token },
  )
}

export function submitCurrentStage(
  token: string,
  applicationId: string,
  payload: Record<string, unknown>,
) {
  return apiRequest<ApplicationStageProgressResponse>(
    `/applications/me/${encodeURIComponent(applicationId)}/currentStage/submit`,
    { method: 'POST', token, json: payload },
  )
}

export function setStageInterviewLink(
  token: string,
  applicationId: string,
  jobStageId: string,
  body: { url: string; scheduledAt?: string },
) {
  return apiRequest<ApplicationStageProgressResponse>(
    `/applications/${encodeURIComponent(applicationId)}/stage/${encodeURIComponent(
      jobStageId,
    )}/interviewLink`,
    { method: 'PATCH', token, json: body },
  )
}
