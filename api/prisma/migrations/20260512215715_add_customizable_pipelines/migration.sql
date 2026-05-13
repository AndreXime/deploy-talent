/*
  Warnings:

  - You are about to drop the column `stage` on the `applications` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "PipelineStageKind" AS ENUM ('MANUAL', 'QUESTIONNAIRE', 'INTERVIEW_LINK', 'FILE_UPLOAD');

-- CreateEnum
CREATE TYPE "ApplicationStageProgressStatus" AS ENUM ('PENDING', 'COMPLETED', 'SKIPPED');

-- AlterTable
ALTER TABLE "applications" DROP COLUMN "stage",
ADD COLUMN     "currentJobStageId" TEXT;

-- CreateTable
CREATE TABLE "pipeline_templates" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Pipeline default',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pipeline_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pipeline_template_stages" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "kind" "PipelineStageKind" NOT NULL,
    "name" TEXT NOT NULL,
    "config" JSONB NOT NULL DEFAULT '{}',
    "required" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pipeline_template_stages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_stages" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "kind" "PipelineStageKind" NOT NULL,
    "name" TEXT NOT NULL,
    "config" JSONB NOT NULL DEFAULT '{}',
    "required" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_stages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "application_stage_progress" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "jobStageId" TEXT NOT NULL,
    "status" "ApplicationStageProgressStatus" NOT NULL DEFAULT 'PENDING',
    "submittedData" JSONB,
    "completedAt" TIMESTAMP(3),
    "completedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "application_stage_progress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pipeline_templates_tenantId_key" ON "pipeline_templates"("tenantId");

-- CreateIndex
CREATE INDEX "pipeline_template_stages_templateId_idx" ON "pipeline_template_stages"("templateId");

-- CreateIndex
CREATE UNIQUE INDEX "pipeline_template_stages_templateId_position_key" ON "pipeline_template_stages"("templateId", "position");

-- CreateIndex
CREATE INDEX "job_stages_jobId_idx" ON "job_stages"("jobId");

-- CreateIndex
CREATE UNIQUE INDEX "job_stages_jobId_position_key" ON "job_stages"("jobId", "position");

-- CreateIndex
CREATE INDEX "application_stage_progress_applicationId_idx" ON "application_stage_progress"("applicationId");

-- CreateIndex
CREATE INDEX "application_stage_progress_jobStageId_idx" ON "application_stage_progress"("jobStageId");

-- CreateIndex
CREATE UNIQUE INDEX "application_stage_progress_applicationId_jobStageId_key" ON "application_stage_progress"("applicationId", "jobStageId");

-- CreateIndex
CREATE INDEX "applications_currentJobStageId_idx" ON "applications"("currentJobStageId");

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_currentJobStageId_fkey" FOREIGN KEY ("currentJobStageId") REFERENCES "job_stages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pipeline_templates" ADD CONSTRAINT "pipeline_templates_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pipeline_template_stages" ADD CONSTRAINT "pipeline_template_stages_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "pipeline_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_stages" ADD CONSTRAINT "job_stages_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_stage_progress" ADD CONSTRAINT "application_stage_progress_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_stage_progress" ADD CONSTRAINT "application_stage_progress_jobStageId_fkey" FOREIGN KEY ("jobStageId") REFERENCES "job_stages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_stage_progress" ADD CONSTRAINT "application_stage_progress_completedByUserId_fkey" FOREIGN KEY ("completedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
