-- Paywalls, content gates and banners become one table, "gates", told apart
-- by "mode". Existing paywalls and banners keep their ids, so articles,
-- settings and website caches that point at them stay valid.
--
-- It also replaces the unreleased 20261013120000_add_content_gate: databases
-- that applied it keep their content gates and contentGateDisabled.
--
-- One transaction, so a failure leaves the schema as it was.
BEGIN;

-- CreateEnum
CREATE TYPE "GateMode" AS ENUM ('PAYWALL', 'CONTENT_GATE', 'BANNER');

-- RenameEnum
ALTER TYPE "BannerActionRole" RENAME TO "GateActionRole";

-- AlterTable
ALTER TABLE "articles" ADD COLUMN IF NOT EXISTS "contentGateDisabled" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "gates" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMPTZ(3) NOT NULL,
    "mode" "GateMode" NOT NULL,
    "name" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "audience" "LoginStatus" NOT NULL DEFAULT 'all',
    "anyMemberPlan" BOOLEAN NOT NULL DEFAULT false,
    "showOnArticles" BOOLEAN NOT NULL DEFAULT false,
    "title" TEXT,
    "text" TEXT,
    "cta" TEXT,
    "html" TEXT,
    "embedUrl" TEXT,
    "imageId" TEXT,
    "description" JSONB,
    "slateDescription" JSONB,
    "upgradeDescription" JSONB,
    "slateUpgradeDescription" JSONB,
    "circumventDescription" JSONB,
    "slateCircumventDescription" JSONB,
    "upgradeCircumventDescription" JSONB,
    "slateUpgradeCircumventDescription" JSONB,
    "softDescription" JSONB,
    "previewBlocks" INTEGER,
    "fadeout" BOOLEAN NOT NULL DEFAULT false,
    "freeArticles" INTEGER,
    "softGateArticles" INTEGER,
    "meterWindowDays" INTEGER,
    "newsletterParams" JSONB,
    "newsletterNeverGate" BOOLEAN NOT NULL DEFAULT false,
    "newsletterFreeArticles" INTEGER NOT NULL DEFAULT 0,
    "collapsible" BOOLEAN NOT NULL DEFAULT true,
    "hideForMinutes" INTEGER NOT NULL DEFAULT 1440,
    "delay" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "gates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gate_actions" (
    "id" TEXT NOT NULL DEFAULT uuidv7(),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMPTZ(3) NOT NULL,
    "gateId" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "style" TEXT NOT NULL DEFAULT '',
    "role" "GateActionRole" NOT NULL DEFAULT 'other',

    CONSTRAINT "gate_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_GateToPage" (
    "A" UUID NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_GateToPage_AB_pkey" PRIMARY KEY ("A","B")
);

-- Copy paywalls, keeping their ids
INSERT INTO "gates" (
    "id", "createdAt", "modifiedAt", "mode", "name", "active", "audience",
    "anyMemberPlan", "previewBlocks", "fadeout",
    "description", "slateDescription",
    "upgradeDescription", "slateUpgradeDescription",
    "circumventDescription", "slateCircumventDescription",
    "upgradeCircumventDescription", "slateUpgradeCircumventDescription"
)
SELECT
    "id", "createdAt", "modifiedAt", 'PAYWALL', "name", "active", 'unsubscribed',
    "anyMemberPlan", "hideContentAfter", "fadeout",
    "description", "slateDescription",
    "upgradeDescription", "slateUpgradeDescription",
    "circumventDescription", "slateCircumventDescription",
    "upgradeCircumventDescription", "slateUpgradeCircumventDescription"
FROM "paywalls";

-- A paywall's alternativeSubscribeUrl becomes its primary action
INSERT INTO "gate_actions" ("modifiedAt", "gateId", "label", "url", "role")
SELECT now(), "id", '', "alternativeSubscribeUrl", 'primary'
FROM "paywalls"
WHERE "alternativeSubscribeUrl" IS NOT NULL AND "alternativeSubscribeUrl" <> '';

-- Copy banners, keeping their ids
INSERT INTO "gates" (
    "id", "createdAt", "modifiedAt", "mode", "active", "audience",
    "showOnArticles", "title", "text", "cta", "html", "embedUrl", "imageId",
    "collapsible", "hideForMinutes", "delay"
)
SELECT
    "id"::uuid, "createdAt", "modifiedAt", 'BANNER', "active", "showForLoginStatus",
    "showOnArticles", "title", "text", "cta", "html", "embedUrl", "imageId",
    "collapsible", "hideForMinutes", "delay"
FROM "banners";

INSERT INTO "gate_actions" ("id", "createdAt", "modifiedAt", "gateId", "label", "url", "style", "role")
SELECT "id", "createdAt", "modifiedAt", "bannerId"::uuid, "label", "url", "style", "role"
FROM "banner_actions";

INSERT INTO "_GateToPage" ("A", "B")
SELECT "A"::uuid, "B"
FROM "_BannerToPage";

-- Copy content gates of databases that applied 20261013120000_add_content_gate
DO $$
BEGIN
    IF to_regclass('content_gates') IS NOT NULL THEN
        INSERT INTO "gates" (
            "id", "createdAt", "modifiedAt", "mode", "name", "active", "audience",
            "showOnArticles", "freeArticles", "softGateArticles", "previewBlocks",
            "meterWindowDays", "softDescription", "description",
            "newsletterParams", "newsletterNeverGate", "newsletterFreeArticles"
        )
        SELECT
            "id", "createdAt", "modifiedAt", 'CONTENT_GATE', "name", "active",
            CASE "audience"::text WHEN 'ANONYMOUS' THEN 'logged_out' ELSE 'unsubscribed' END::"LoginStatus",
            true, "freeArticles", "softGateArticles", "previewBlocks",
            "meterWindowDays", "softDescription", "hardDescription",
            "newsletterParams", "newsletterNeverGate", "newsletterFreeArticles"
        FROM "content_gates";

        INSERT INTO "gate_actions" ("modifiedAt", "gateId", "label", "url", "role")
        SELECT now(), "id", COALESCE("ctaLabel", ''), "ctaUrl", 'primary'
        FROM "content_gates"
        WHERE "ctaUrl" IS NOT NULL AND "ctaUrl" <> '';

        DROP TABLE "content_gates";
    END IF;
END $$;

DROP TYPE IF EXISTS "ContentGateAudience";

-- Paywall member plans and bypasses keep their rows and move to the gate
ALTER TABLE "paywalls.memberPlans" DROP CONSTRAINT "paywalls.memberPlans_paywallId_fkey";
ALTER TABLE "paywalls.memberPlans" RENAME TO "gate_member_plans";
ALTER TABLE "gate_member_plans" RENAME COLUMN "paywallId" TO "gateId";
ALTER TABLE "gate_member_plans" RENAME CONSTRAINT "paywalls.memberPlans_pkey" TO "gate_member_plans_pkey";
ALTER TABLE "gate_member_plans" RENAME CONSTRAINT "paywalls.memberPlans_memberPlanId_fkey" TO "gate_member_plans_memberPlanId_fkey";

ALTER TABLE "paywall_bypasses" DROP CONSTRAINT "paywall_bypasses_paywallId_fkey";
ALTER TABLE "paywall_bypasses" RENAME TO "gate_bypasses";
ALTER TABLE "gate_bypasses" RENAME COLUMN "paywallId" TO "gateId";
ALTER TABLE "gate_bypasses" RENAME CONSTRAINT "paywall_bypasses_pkey" TO "gate_bypasses_pkey";
ALTER INDEX "paywall_bypasses_paywallId_token_key" RENAME TO "gate_bypasses_gateId_token_key";

-- Articles keep their paywallId, which now points at gates
ALTER TABLE "articles" DROP CONSTRAINT "articles_paywallId_fkey";

-- DropTable
DROP TABLE "_BannerToPage";
DROP TABLE "banner_actions";
DROP TABLE "banners";
DROP TABLE "paywalls";

-- CreateIndex
CREATE UNIQUE INDEX "gates_mode_name_key" ON "gates"("mode", "name");

-- CreateIndex
CREATE INDEX "_GateToPage_B_index" ON "_GateToPage"("B");

-- At most one content gate can be active at a time
CREATE UNIQUE INDEX "gates_single_active_content_gate" ON "gates"("mode") WHERE "active" AND "mode" = 'CONTENT_GATE';

-- AddForeignKey
ALTER TABLE "articles" ADD CONSTRAINT "articles_paywallId_fkey" FOREIGN KEY ("paywallId") REFERENCES "gates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gates" ADD CONSTRAINT "gates_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "images"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gate_actions" ADD CONSTRAINT "gate_actions_gateId_fkey" FOREIGN KEY ("gateId") REFERENCES "gates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gate_member_plans" ADD CONSTRAINT "gate_member_plans_gateId_fkey" FOREIGN KEY ("gateId") REFERENCES "gates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gate_bypasses" ADD CONSTRAINT "gate_bypasses_gateId_fkey" FOREIGN KEY ("gateId") REFERENCES "gates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GateToPage" ADD CONSTRAINT "_GateToPage_A_fkey" FOREIGN KEY ("A") REFERENCES "gates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GateToPage" ADD CONSTRAINT "_GateToPage_B_fkey" FOREIGN KEY ("B") REFERENCES "pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT;
