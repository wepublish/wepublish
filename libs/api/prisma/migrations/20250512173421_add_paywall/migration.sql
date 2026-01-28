-- AlterTable
ALTER TABLE "articles" ADD COLUMN     "paywallId" UUID;

-- CreateTable
CREATE TABLE "paywalls" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT,
    "description" JSONB,
    "anyMemberPlan" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "paywalls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "paywalls.memberPlans" (
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMP(3) NOT NULL,
    "memberPlanId" TEXT NOT NULL,
    "paywallId" UUID NOT NULL,

    CONSTRAINT "paywalls.memberPlans_pkey" PRIMARY KEY ("paywallId","memberPlanId")
);

-- CreateIndex
CREATE UNIQUE INDEX "paywalls_name_key" ON "paywalls"("name");

-- AddForeignKey
ALTER TABLE "articles" ADD CONSTRAINT "articles_paywallId_fkey" FOREIGN KEY ("paywallId") REFERENCES "paywalls"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paywalls.memberPlans" ADD CONSTRAINT "paywalls.memberPlans_memberPlanId_fkey" FOREIGN KEY ("memberPlanId") REFERENCES "member.plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paywalls.memberPlans" ADD CONSTRAINT "paywalls.memberPlans_paywallId_fkey" FOREIGN KEY ("paywallId") REFERENCES "paywalls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "paywalls" ("id", "modifiedAt", "name", "description") VALUES (gen_random_uuid(), CURRENT_TIMESTAMP, 'Default', '[]'::JSONB);