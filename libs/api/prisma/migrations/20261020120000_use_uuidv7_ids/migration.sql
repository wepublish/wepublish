-- AlterTable
ALTER TABLE "articles.revisions" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "articles" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "articles.tracking-pixels" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "tracking.pixels.methods" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "authors.links" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "authors" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "api-tokens.tokens" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "comments.revisions" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "comments" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "comments.rating-systems" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "comments.rating-system-answers" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "comments.ratings" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "invoices.items" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "invoices" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "mail.log" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "mail.send_jobs" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "mail.send_job_recipients" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "member.plans.payment-methods" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "member.plans.periodicity-prices" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "member.plans" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "navigations.links" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "navigations" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "pages.revisions" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "pages" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "payment.methods" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "payments" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "peerProfiles" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "peers" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "tokens" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "sessions" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "impersonation_grants" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "subscriptions.periods" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "subscriptions.deactivation-reasons" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "subscriptions" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "users.payment-providers" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "users.roles" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "settings" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "tags" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "polls" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "polls.answers" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "polls.votes" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "polls.external-vote-sources" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "polls.external-votes" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "events" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "consents" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "user-consents" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "user_communication_flows" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "subscription_communication_flows" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "subscriptions.intervals" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "mail_templates" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "periodic_jobs" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "block-content.styles" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "block_templates" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "banners" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "banner_actions" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "crowdfundings" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "crowdfunding_goals" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "paywalls" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "paywall_bypasses" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "apps.external" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "mailchimp_sync_errors" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "settings.website" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "discountCodes" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "goodies" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "notifications.reads" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "notifications.confirmations" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "changelog.entries" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "changelog.entries.translations" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "medium_features" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "audit_logs" ALTER COLUMN "id" DROP DEFAULT;

