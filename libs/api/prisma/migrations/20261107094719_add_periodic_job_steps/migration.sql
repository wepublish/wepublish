-- CreateEnum
CREATE TYPE "PeriodicJobStepStatus" AS ENUM ('ok', 'warning', 'error', 'skipped');

-- CreateTable
CREATE TABLE "periodic_job_steps" (
    "id" TEXT NOT NULL DEFAULT uuidv7(),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "periodicJobId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "status" "PeriodicJobStepStatus" NOT NULL,
    "counts" JSONB,
    "error" TEXT,
    "startedAt" TIMESTAMPTZ(3) NOT NULL,
    "finishedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "periodic_job_steps_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "periodic_job_steps_periodicJobId_idx" ON "periodic_job_steps"("periodicJobId");

-- AddForeignKey
ALTER TABLE "periodic_job_steps" ADD CONSTRAINT "periodic_job_steps_periodicJobId_fkey" FOREIGN KEY ("periodicJobId") REFERENCES "periodic_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
