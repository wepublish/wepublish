-- CreateEnum
CREATE TYPE "AuditLogAction" AS ENUM ('create', 'update', 'delete', 'other');

-- CreateEnum
CREATE TYPE "AuditLogActorType" AS ENUM ('user', 'token');

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "mutation" TEXT NOT NULL,
    "action" "AuditLogAction" NOT NULL,
    "entity" TEXT,
    "recordId" TEXT,
    "actorType" "AuditLogActorType" NOT NULL,
    "userId" TEXT,
    "userEmail" TEXT,
    "tokenName" TEXT,
    "sessionId" TEXT,
    "impersonatedBy" TEXT,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "errorMessage" TEXT,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");
CREATE INDEX "audit_logs_userId_createdAt_idx" ON "audit_logs"("userId", "createdAt");
CREATE INDEX "audit_logs_sessionId_idx" ON "audit_logs"("sessionId");
CREATE INDEX "audit_logs_entity_recordId_idx" ON "audit_logs"("entity", "recordId");
