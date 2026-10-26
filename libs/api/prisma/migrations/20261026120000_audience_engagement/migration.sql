-- Audience Engagement: banners (and the unreleased content gates) become
-- engagement rules with stages and actions. Paywalls stay their own table and
-- get "enforced", which cuts paywalled blocks on the server.
--
-- It replaces the unreleased 20261021120000_unify_gates, so it starts from one
-- of two states:
--   * master: "paywalls", "banners", "banner_actions", "_BannerToPage" (and
--     maybe "content_gates" from the deleted 20261013120000_add_content_gate)
--   * unify_gates applied: everything lives in "gates", told apart by "mode"
-- Both copy their rows into the same temp tables first, so the inserts into the
-- new tables are written once. Ids are kept: settings, caches and website
-- dismissals that point at a banner keep working.
--
-- One transaction, so a failure leaves the schema as it was.
BEGIN;

-- CreateEnum
CREATE TYPE "EngagementGoal" AS ENUM ('ANNOUNCEMENT', 'NEWSLETTER', 'MEMBERSHIP');

-- CreateEnum
CREATE TYPE "EngagementAudience" AS ENUM ('ALL', 'ANONYMOUS', 'REGISTERED', 'NON_MEMBERS', 'MEMBERS', 'NON_PAYING', 'PAYING_MEMBERS', 'PAYWALL_BYPASSED');

-- CreateEnum
CREATE TYPE "EngagementPlacement" AS ENUM ('BANNER', 'MODAL', 'INLINE', 'CUTOFF');

-- CreateEnum
CREATE TYPE "EngagementEnforcement" AS ENUM ('SOFT', 'HARD');

-- CreateEnum
CREATE TYPE "EngagementRequirement" AS ENUM ('REGISTRATION', 'MEMBERSHIP', 'PAID_MEMBERSHIP');

-- CreateEnum
CREATE TYPE "EngagementActionType" AS ENUM ('URL', 'NEWSLETTER', 'LOGIN', 'REGISTER', 'MEMBERSHIP');

-- CreateEnum
CREATE TYPE "NewsletterReferralMode" AS ENUM ('NONE', 'UNLIMITED', 'LIMITED');

-- RenameEnum: BannerActionRole on master, GateActionRole after unify_gates
DO $$
BEGIN
    IF to_regtype('"GateActionRole"') IS NOT NULL THEN
        ALTER TYPE "GateActionRole" RENAME TO "EngagementActionRole";
    ELSE
        ALTER TYPE "BannerActionRole" RENAME TO "EngagementActionRole";
    END IF;
END $$;

-- AlterTable (unify_gates and the old content gate migration already added it)
ALTER TABLE "articles" ADD COLUMN IF NOT EXISTS "contentGateDisabled" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "engagement_rules" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMPTZ(3) NOT NULL,
    "name" TEXT NOT NULL,
    "goal" "EngagementGoal" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 1,
    "audience" "EngagementAudience" NOT NULL DEFAULT 'ALL',
    "showOnArticles" BOOLEAN NOT NULL DEFAULT true,
    "includePeeredArticles" BOOLEAN NOT NULL DEFAULT false,
    "meterWindowDays" INTEGER,
    "newsletterReferral" "NewsletterReferralMode" NOT NULL DEFAULT 'NONE',
    "newsletterReferralLimit" INTEGER NOT NULL DEFAULT 0,
    "newsletterParams" JSONB,

    CONSTRAINT "engagement_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "engagement_stages" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMPTZ(3) NOT NULL,
    "ruleId" UUID NOT NULL,
    "afterArticles" INTEGER NOT NULL DEFAULT 0,
    "placement" "EngagementPlacement" NOT NULL,
    "enforcement" "EngagementEnforcement" NOT NULL DEFAULT 'SOFT',
    "requirement" "EngagementRequirement",
    "previewBlocks" INTEGER,
    "dismissible" BOOLEAN NOT NULL DEFAULT true,
    "hideForMinutes" INTEGER NOT NULL DEFAULT 1440,
    "delaySeconds" INTEGER NOT NULL DEFAULT 0,
    "title" TEXT,
    "text" TEXT,
    "cta" TEXT,
    "description" JSONB,
    "html" TEXT,
    "embedUrl" TEXT,
    "imageId" TEXT,

    CONSTRAINT "engagement_stages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "engagement_actions" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMPTZ(3) NOT NULL,
    "stageId" UUID NOT NULL,
    "type" "EngagementActionType" NOT NULL DEFAULT 'URL',
    "label" TEXT NOT NULL,
    "url" TEXT NOT NULL DEFAULT '',
    "style" TEXT NOT NULL DEFAULT '',
    "role" "EngagementActionRole" NOT NULL DEFAULT 'other',

    CONSTRAINT "engagement_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_EngagementRuleToPage" (
    "A" UUID NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_EngagementRuleToPage_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "engagement_stages_ruleId_afterArticles_key" ON "engagement_stages"("ruleId", "afterArticles");

-- CreateIndex
CREATE INDEX "_EngagementRuleToPage_B_index" ON "_EngagementRuleToPage"("B");

-- Rows to migrate, in one shape whichever state the database is in
CREATE TEMP TABLE "_m_banners" (
    "id" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL,
    "modifiedAt" TIMESTAMPTZ(3) NOT NULL,
    "title" TEXT,
    "text" TEXT,
    "cta" TEXT,
    "html" TEXT,
    "embedUrl" TEXT,
    "imageId" TEXT,
    "active" BOOLEAN NOT NULL,
    "collapsible" BOOLEAN NOT NULL,
    "hideForMinutes" INTEGER NOT NULL,
    "delay" INTEGER NOT NULL,
    "showOnArticles" BOOLEAN NOT NULL,
    "loginStatus" TEXT NOT NULL
) ON COMMIT DROP;

CREATE TEMP TABLE "_m_banner_actions" (
    "id" UUID NOT NULL,
    "bannerId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL,
    "modifiedAt" TIMESTAMPTZ(3) NOT NULL,
    "label" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "style" TEXT NOT NULL,
    "role" TEXT NOT NULL
) ON COMMIT DROP;

CREATE TEMP TABLE "_m_banner_pages" (
    "bannerId" UUID NOT NULL,
    "pageId" TEXT NOT NULL
) ON COMMIT DROP;

CREATE TEMP TABLE "_m_content_gates" (
    "id" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL,
    "modifiedAt" TIMESTAMPTZ(3) NOT NULL,
    "name" TEXT,
    "active" BOOLEAN NOT NULL,
    "anonymousOnly" BOOLEAN NOT NULL,
    "freeArticles" INTEGER NOT NULL,
    "softArticles" INTEGER NOT NULL,
    "previewBlocks" INTEGER NOT NULL,
    "meterWindowDays" INTEGER,
    "softDescription" JSONB,
    "hardDescription" JSONB,
    "newsletterParams" JSONB,
    "newsletterNeverGate" BOOLEAN NOT NULL,
    "newsletterFreeArticles" INTEGER NOT NULL,
    "ctaLabel" TEXT,
    "ctaUrl" TEXT
) ON COMMIT DROP;

DO $$
BEGIN
    IF to_regclass('"gates"') IS NULL THEN
        -- master
        INSERT INTO "_m_banners"
        SELECT "id"::uuid, "createdAt", "modifiedAt", "title", "text", "cta", "html",
            "embedUrl", "imageId", "active", "collapsible", "hideForMinutes", "delay",
            "showOnArticles", "showForLoginStatus"::text
        FROM "banners";

        INSERT INTO "_m_banner_actions"
        SELECT "id"::uuid, "bannerId"::uuid, "createdAt", "modifiedAt", "label", "url", "style", "role"::text
        FROM "banner_actions";

        INSERT INTO "_m_banner_pages"
        SELECT "A"::uuid, "B" FROM "_BannerToPage";

        IF to_regclass('"content_gates"') IS NOT NULL THEN
            INSERT INTO "_m_content_gates"
            SELECT "id", "createdAt", "modifiedAt", "name", "active",
                "audience"::text = 'ANONYMOUS', "freeArticles", "softGateArticles",
                "previewBlocks", "meterWindowDays", "softDescription", "hardDescription",
                "newsletterParams", "newsletterNeverGate", "newsletterFreeArticles",
                "ctaLabel", "ctaUrl"
            FROM "content_gates";

            DROP TABLE "content_gates";
        END IF;

        DROP TABLE "_BannerToPage";
        DROP TABLE "banner_actions";
        DROP TABLE "banners";

        ALTER TABLE "paywalls" ADD COLUMN "enforced" BOOLEAN NOT NULL DEFAULT false;
    ELSE
        -- unify_gates: paywalls go back to their own tables, ids kept
        CREATE TABLE "paywalls" (
            "id" UUID NOT NULL DEFAULT uuidv7(),
            "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "modifiedAt" TIMESTAMPTZ(3) NOT NULL,
            "name" TEXT,
            "description" JSONB,
            "slateDescription" JSONB,
            "upgradeDescription" JSONB,
            "slateUpgradeDescription" JSONB,
            "circumventDescription" JSONB,
            "slateCircumventDescription" JSONB,
            "upgradeCircumventDescription" JSONB,
            "slateUpgradeCircumventDescription" JSONB,
            "anyMemberPlan" BOOLEAN NOT NULL DEFAULT false,
            "active" BOOLEAN NOT NULL DEFAULT true,
            "alternativeSubscribeUrl" TEXT,
            "hideContentAfter" INTEGER NOT NULL DEFAULT 3,
            "fadeout" BOOLEAN NOT NULL DEFAULT true,
            "enforced" BOOLEAN NOT NULL DEFAULT false,

            CONSTRAINT "paywalls_pkey" PRIMARY KEY ("id")
        );

        CREATE UNIQUE INDEX "paywalls_name_key" ON "paywalls"("name");

        INSERT INTO "paywalls" (
            "id", "createdAt", "modifiedAt", "name",
            "description", "slateDescription",
            "upgradeDescription", "slateUpgradeDescription",
            "circumventDescription", "slateCircumventDescription",
            "upgradeCircumventDescription", "slateUpgradeCircumventDescription",
            "anyMemberPlan", "active", "alternativeSubscribeUrl",
            "hideContentAfter", "fadeout"
        )
        SELECT
            g."id", g."createdAt", g."modifiedAt", g."name",
            g."description", g."slateDescription",
            g."upgradeDescription", g."slateUpgradeDescription",
            g."circumventDescription", g."slateCircumventDescription",
            g."upgradeCircumventDescription", g."slateUpgradeCircumventDescription",
            g."anyMemberPlan", g."active",
            (
                SELECT a."url" FROM "gate_actions" a
                WHERE a."gateId" = g."id" AND a."role" = 'primary' AND a."url" <> ''
                ORDER BY a."createdAt", a."id"
                LIMIT 1
            ),
            COALESCE(g."previewBlocks", 3), g."fadeout"
        FROM "gates" g
        WHERE g."mode" = 'PAYWALL';

        DELETE FROM "gate_member_plans" WHERE "gateId" NOT IN (SELECT "id" FROM "paywalls");
        ALTER TABLE "gate_member_plans" DROP CONSTRAINT "gate_member_plans_gateId_fkey";
        ALTER TABLE "gate_member_plans" RENAME TO "paywalls.memberPlans";
        ALTER TABLE "paywalls.memberPlans" RENAME COLUMN "gateId" TO "paywallId";
        ALTER TABLE "paywalls.memberPlans" RENAME CONSTRAINT "gate_member_plans_pkey" TO "paywalls.memberPlans_pkey";
        ALTER TABLE "paywalls.memberPlans" RENAME CONSTRAINT "gate_member_plans_memberPlanId_fkey" TO "paywalls.memberPlans_memberPlanId_fkey";
        ALTER TABLE "paywalls.memberPlans" ADD CONSTRAINT "paywalls.memberPlans_paywallId_fkey" FOREIGN KEY ("paywallId") REFERENCES "paywalls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

        DELETE FROM "gate_bypasses" WHERE "gateId" NOT IN (SELECT "id" FROM "paywalls");
        ALTER TABLE "gate_bypasses" DROP CONSTRAINT "gate_bypasses_gateId_fkey";
        ALTER TABLE "gate_bypasses" RENAME TO "paywall_bypasses";
        ALTER TABLE "paywall_bypasses" RENAME COLUMN "gateId" TO "paywallId";
        ALTER TABLE "paywall_bypasses" RENAME CONSTRAINT "gate_bypasses_pkey" TO "paywall_bypasses_pkey";
        ALTER INDEX "gate_bypasses_gateId_token_key" RENAME TO "paywall_bypasses_paywallId_token_key";
        ALTER TABLE "paywall_bypasses" ADD CONSTRAINT "paywall_bypasses_paywallId_fkey" FOREIGN KEY ("paywallId") REFERENCES "paywalls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

        -- unify_gates let an article point at any gate: only paywalls stay
        ALTER TABLE "articles" DROP CONSTRAINT "articles_paywallId_fkey";
        UPDATE "articles" SET "paywallId" = NULL
        WHERE "paywallId" IS NOT NULL AND "paywallId" NOT IN (SELECT "id" FROM "paywalls");
        ALTER TABLE "articles" ADD CONSTRAINT "articles_paywallId_fkey" FOREIGN KEY ("paywallId") REFERENCES "paywalls"("id") ON DELETE SET NULL ON UPDATE CASCADE;

        INSERT INTO "_m_banners"
        SELECT "id", "createdAt", "modifiedAt", "title", "text", "cta", "html",
            "embedUrl", "imageId", "active", "collapsible", "hideForMinutes", "delay",
            "showOnArticles", "audience"::text
        FROM "gates"
        WHERE "mode" = 'BANNER';

        INSERT INTO "_m_banner_actions"
        SELECT a."id"::uuid, a."gateId", a."createdAt", a."modifiedAt", a."label", a."url", a."style", a."role"::text
        FROM "gate_actions" a
        JOIN "gates" g ON g."id" = a."gateId"
        WHERE g."mode" = 'BANNER';

        INSERT INTO "_m_banner_pages"
        SELECT p."A", p."B"
        FROM "_GateToPage" p
        JOIN "gates" g ON g."id" = p."A"
        WHERE g."mode" = 'BANNER';

        INSERT INTO "_m_content_gates"
        SELECT g."id", g."createdAt", g."modifiedAt", g."name", g."active",
            g."audience"::text = 'logged_out', COALESCE(g."freeArticles", 0),
            COALESCE(g."softGateArticles", 0), COALESCE(g."previewBlocks", 3),
            g."meterWindowDays", g."softDescription", g."description",
            g."newsletterParams", g."newsletterNeverGate", g."newsletterFreeArticles",
            a."label", a."url"
        FROM "gates" g
        LEFT JOIN LATERAL (
            SELECT "label", "url" FROM "gate_actions"
            WHERE "gateId" = g."id" AND "role" = 'primary' AND "url" <> ''
            ORDER BY "createdAt", "id"
            LIMIT 1
        ) a ON true
        WHERE g."mode" = 'CONTENT_GATE';

        DROP TABLE "_GateToPage";
        DROP TABLE "gate_actions";
        DROP TABLE "gates";
        DROP TYPE "GateMode";
    END IF;
END $$;

DROP TYPE IF EXISTS "ContentGateAudience";
DROP TYPE "LoginStatus";

-- Banners become announcements: one soft stage from the first article on.
-- The priority keeps master's primaryBanner pick: it preferred the audience
-- that fits the reader best (bypassed, then logged out or subscribed, then
-- unsubscribed, then logged in, then all).
INSERT INTO "engagement_rules" (
    "id", "createdAt", "modifiedAt", "name", "goal", "active", "priority",
    "audience", "showOnArticles", "includePeeredArticles"
)
SELECT
    "id", "createdAt", "modifiedAt", COALESCE(NULLIF("title", ''), 'Banner'), 'ANNOUNCEMENT', "active",
    CASE "loginStatus"
        WHEN 'paywall_bypassed' THEN 4
        WHEN 'logged_out' THEN 3
        WHEN 'subscribed' THEN 3
        WHEN 'unsubscribed' THEN 2
        WHEN 'logged_in' THEN 1
        ELSE 0
    END,
    CASE "loginStatus"
        WHEN 'paywall_bypassed' THEN 'PAYWALL_BYPASSED'
        WHEN 'logged_out' THEN 'ANONYMOUS'
        WHEN 'subscribed' THEN 'MEMBERS'
        WHEN 'unsubscribed' THEN 'NON_MEMBERS'
        WHEN 'logged_in' THEN 'REGISTERED'
        ELSE 'ALL'
    END::"EngagementAudience",
    "showOnArticles", true
FROM "_m_banners";

INSERT INTO "engagement_stages" (
    "createdAt", "modifiedAt", "ruleId", "afterArticles", "placement", "enforcement",
    "dismissible", "hideForMinutes", "delaySeconds",
    "title", "text", "cta", "html", "embedUrl", "imageId"
)
SELECT
    "createdAt", "modifiedAt", "id", 0, 'BANNER', 'SOFT',
    "collapsible", "hideForMinutes", "delay",
    "title", "text", "cta", "html", "embedUrl", "imageId"
FROM "_m_banners";

INSERT INTO "engagement_actions" ("id", "createdAt", "modifiedAt", "stageId", "type", "label", "url", "style", "role")
SELECT a."id", a."createdAt", a."modifiedAt", s."id", 'URL', a."label", a."url", a."style", a."role"::"EngagementActionRole"
FROM "_m_banner_actions" a
JOIN "engagement_stages" s ON s."ruleId" = a."bannerId";

INSERT INTO "_EngagementRuleToPage" ("A", "B")
SELECT "bannerId", "pageId" FROM "_m_banner_pages";

-- Content gates become metered rules: a soft modal once the free articles are
-- read, then a hard cutoff after the soft ones. Logged out gates ask for a
-- registration, unsubscribed gates for a membership.
INSERT INTO "engagement_rules" (
    "id", "createdAt", "modifiedAt", "name", "goal", "active", "audience",
    "showOnArticles", "meterWindowDays", "newsletterReferral",
    "newsletterReferralLimit", "newsletterParams"
)
SELECT
    "id", "createdAt", "modifiedAt", COALESCE(NULLIF("name", ''), 'Content gate'), 'MEMBERSHIP', "active",
    CASE WHEN "anonymousOnly" THEN 'ANONYMOUS' ELSE 'NON_MEMBERS' END::"EngagementAudience",
    true, GREATEST(COALESCE("meterWindowDays", 30), 1),
    CASE
        WHEN "newsletterNeverGate" THEN 'UNLIMITED'
        WHEN "newsletterFreeArticles" > 0 THEN 'LIMITED'
        ELSE 'NONE'
    END::"NewsletterReferralMode",
    CASE WHEN "newsletterNeverGate" THEN 0 ELSE GREATEST("newsletterFreeArticles", 0) END,
    "newsletterParams"
FROM "_m_content_gates";

INSERT INTO "engagement_stages" (
    "createdAt", "modifiedAt", "ruleId", "afterArticles", "placement", "enforcement", "description"
)
SELECT "createdAt", "modifiedAt", "id", GREATEST("freeArticles", 0), 'MODAL', 'SOFT', "softDescription"
FROM "_m_content_gates"
WHERE "softArticles" > 0;

INSERT INTO "engagement_stages" (
    "createdAt", "modifiedAt", "ruleId", "afterArticles", "placement", "enforcement",
    "requirement", "previewBlocks", "dismissible", "description"
)
SELECT
    "createdAt", "modifiedAt", "id", GREATEST("freeArticles", 0) + GREATEST("softArticles", 0),
    'CUTOFF', 'HARD',
    CASE WHEN "anonymousOnly" THEN 'REGISTRATION' ELSE 'MEMBERSHIP' END::"EngagementRequirement",
    GREATEST("previewBlocks", 0), false, "hardDescription"
FROM "_m_content_gates";

-- Every stage gets the gate's call to action, or a register / membership link
INSERT INTO "engagement_actions" ("modifiedAt", "stageId", "type", "label", "url", "role")
SELECT
    now(), s."id",
    CASE
        WHEN c."ctaUrl" IS NOT NULL AND c."ctaUrl" <> '' THEN 'URL'
        WHEN c."anonymousOnly" THEN 'REGISTER'
        ELSE 'MEMBERSHIP'
    END::"EngagementActionType",
    COALESCE(c."ctaLabel", ''), COALESCE(c."ctaUrl", ''), 'primary'
FROM "_m_content_gates" c
JOIN "engagement_stages" s ON s."ruleId" = c."id";

-- and the hard stage a login, for readers who already have an account
INSERT INTO "engagement_actions" ("modifiedAt", "stageId", "type", "label", "role")
SELECT now(), s."id", 'LOGIN', '', 'other'
FROM "_m_content_gates" c
JOIN "engagement_stages" s ON s."ruleId" = c."id" AND s."enforcement" = 'HARD';

-- AddForeignKey
ALTER TABLE "engagement_stages" ADD CONSTRAINT "engagement_stages_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "engagement_rules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "engagement_stages" ADD CONSTRAINT "engagement_stages_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "images"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "engagement_actions" ADD CONSTRAINT "engagement_actions_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "engagement_stages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EngagementRuleToPage" ADD CONSTRAINT "_EngagementRuleToPage_A_fkey" FOREIGN KEY ("A") REFERENCES "engagement_rules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EngagementRuleToPage" ADD CONSTRAINT "_EngagementRuleToPage_B_fkey" FOREIGN KEY ("B") REFERENCES "pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Roles that could manage banners can manage engagement rules
UPDATE "users.roles" SET "permissionIDs" = array_append("permissionIDs", 'CAN_GET_ENGAGEMENT_RULE')
WHERE 'CAN_GET_BANNER' = ANY("permissionIDs") AND NOT 'CAN_GET_ENGAGEMENT_RULE' = ANY("permissionIDs");

UPDATE "users.roles" SET "permissionIDs" = array_append("permissionIDs", 'CAN_GET_ENGAGEMENT_RULES')
WHERE 'CAN_GET_BANNERS' = ANY("permissionIDs") AND NOT 'CAN_GET_ENGAGEMENT_RULES' = ANY("permissionIDs");

UPDATE "users.roles" SET "permissionIDs" = array_append("permissionIDs", 'CAN_CREATE_ENGAGEMENT_RULE')
WHERE 'CAN_CREATE_BANNER' = ANY("permissionIDs") AND NOT 'CAN_CREATE_ENGAGEMENT_RULE' = ANY("permissionIDs");

UPDATE "users.roles" SET "permissionIDs" = array_append("permissionIDs", 'CAN_UPDATE_ENGAGEMENT_RULE')
WHERE 'CAN_UPDATE_BANNER' = ANY("permissionIDs") AND NOT 'CAN_UPDATE_ENGAGEMENT_RULE' = ANY("permissionIDs");

UPDATE "users.roles" SET "permissionIDs" = array_append("permissionIDs", 'CAN_DELETE_ENGAGEMENT_RULE')
WHERE 'CAN_DELETE_BANNER' = ANY("permissionIDs") AND NOT 'CAN_DELETE_ENGAGEMENT_RULE' = ANY("permissionIDs");

-- The unreleased content gate permissions are gone
UPDATE "users.roles" SET "permissionIDs" = array_remove(array_remove(array_remove(
    "permissionIDs", 'CAN_CREATE_CONTENT_GATE'), 'CAN_UPDATE_CONTENT_GATE'), 'CAN_DELETE_CONTENT_GATE')
WHERE "permissionIDs" && ARRAY['CAN_CREATE_CONTENT_GATE', 'CAN_UPDATE_CONTENT_GATE', 'CAN_DELETE_CONTENT_GATE'];

COMMIT;
