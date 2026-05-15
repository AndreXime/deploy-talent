import { apiRequest } from '@/lib/api/client'
import type {
  ApplicationCurrentStageResponse,
  ApplicationStageProgressResponse,
  PipelineStageInput,
  PipelineStageResponse,
  PipelineTemplateResponse,
} from '@/lib/api/types'

export function getTenantPipeline() {
  return apiRequest<PipelineTemplateResponse>('/tenants/current/pipeline', {
    method: 'GET',
  })
}

export function replaceTenantPipeline(stages: PipelineStageInput[]) {
  return apiRequest<PipelineTemplateResponse>('/tenants/current/pipeline', {
    method: 'PUT',
    json: { stages },
  })
}

export function listJobStages(jobId: string) {
  return apiRequest<PipelineStageResponse[]>(`/jobs/${encodeURIComponent(jobId)}/stages`, {
    method: 'GET',
  })
}

export function replaceJobStages(jobId: string, stages: PipelineStageInput[]) {
  return apiRequest<PipelineStageResponse[]>(`/jobs/${encodeURIComponent(jobId)}/stages`, {
    method: 'PUT',
    json: { stages },
  })
}

export function moveApplicationStage(applicationId: string, jobStageId: string) {
  return apiRequest<ApplicationStageProgressResponse>(
    `/applications/${encodeURIComponent(applicationId)}/stage`,
    { method: 'PATCH', json: { jobStageId } },
  )
}

export function listApplicationProgress(applicationId: string) {
  return apiRequest<ApplicationStageProgressResponse[]>(
    `/applications/${encodeURIComponent(applicationId)}/progress`,
    { method: 'GET' },
  )
}

export function getMyCurrentStage(applicationId: string) {
  return apiRequest<ApplicationCurrentStageResponse>(
    `/applications/me/${encodeURIComponent(applicationId)}/currentStage`,
    { method: 'GET' },
  )
}

export function submitCurrentStage(applicationId: string, payload: Record<string, unknown>) {
  return apiRequest<ApplicationStageProgressResponse>(
    `/applications/me/${encodeURIComponent(applicationId)}/currentStage/submit`,
    { method: 'POST', json: payload },
  )
}

export function setStageInterviewLink(
  applicationId: string,
  jobStageId: string,
  body: { url: string; scheduledAt?: string },
) {
  return apiRequest<ApplicationStageProgressResponse>(
    `/applications/${encodeURIComponent(applicationId)}/stage/${encodeURIComponent(
      jobStageId,
    )}/interviewLink`,
    { method: 'PATCH', json: body },
  )
}
