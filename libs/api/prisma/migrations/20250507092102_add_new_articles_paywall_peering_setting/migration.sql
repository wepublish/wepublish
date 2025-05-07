INSERT INTO "settings" ("id", "modifiedAt", "name", "value", "settingRestriction") VALUES (gen_random_uuid(), CURRENT_TIMESTAMP, 'newArticlePeering', 'true'::jsonb, '{"allowedValues": {"boolChoice": true}}'::jsonb);
INSERT INTO "settings" ("id", "modifiedAt", "name", "value", "settingRestriction") VALUES (gen_random_uuid(), CURRENT_TIMESTAMP, 'newArticlePaywall', 'false'::jsonb, '{"allowedValues": {"boolChoice": true}}'::jsonb);

-- AlterTable
ALTER TABLE "articles" ADD COLUMN     "paywallId" TEXT;

-- AlterTable
ALTER TABLE "pages" ADD COLUMN     "paywallId" TEXT;

-- CreateTable
CREATE TABLE "paywalls" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT,
    "description" JSONB,

    CONSTRAINT "paywalls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "paywalls.memberPlans" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "memberPlanId" TEXT NOT NULL,
    "paywallId" TEXT NOT NULL,

    CONSTRAINT "paywalls.memberPlans_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "paywalls_name_key" ON "paywalls"("name");

-- CreateIndex
CREATE UNIQUE INDEX "paywalls.memberPlans_paywallId_memberPlanId_key" ON "paywalls.memberPlans"("paywallId", "memberPlanId");

-- AddForeignKey
ALTER TABLE "articles" ADD CONSTRAINT "articles_paywallId_fkey" FOREIGN KEY ("paywallId") REFERENCES "paywalls"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pages" ADD CONSTRAINT "pages_paywallId_fkey" FOREIGN KEY ("paywallId") REFERENCES "paywalls"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paywalls.memberPlans" ADD CONSTRAINT "paywalls.memberPlans_memberPlanId_fkey" FOREIGN KEY ("memberPlanId") REFERENCES "member.plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paywalls.memberPlans" ADD CONSTRAINT "paywalls.memberPlans_paywallId_fkey" FOREIGN KEY ("paywallId") REFERENCES "paywalls"("id") ON DELETE CASCADE ON UPDATE CASCADE;
