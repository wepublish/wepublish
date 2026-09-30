-- CreateEnum
CREATE TYPE "NewsletterListLockedDisplay" AS ENUM ('hidden', 'teaser');

-- CreateEnum
CREATE TYPE "NewsletterSubscriberSource" AS ENUM ('self', 'auto', 'editor');

-- AlterEnum
ALTER TYPE "UserEvent" ADD VALUE 'NEWSLETTER_CONFIRMATION';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "newsletterConfirmedAt" TIMESTAMPTZ(3);

-- CreateTable
CREATE TABLE "newsletter_lists" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMPTZ(3) NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "requiresSubscription" BOOLEAN NOT NULL DEFAULT false,
    "anyMemberPlan" BOOLEAN NOT NULL DEFAULT false,
    "autoSubscribe" BOOLEAN NOT NULL DEFAULT true,
    "lockedDisplay" "NewsletterListLockedDisplay" NOT NULL DEFAULT 'teaser',
    "lockedText" TEXT,
    "lockedLinkUrl" TEXT,

    CONSTRAINT "newsletter_lists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "newsletter_list_member_plans" (
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMPTZ(3) NOT NULL,
    "listId" TEXT NOT NULL,
    "memberPlanId" TEXT NOT NULL,

    CONSTRAINT "newsletter_list_member_plans_pkey" PRIMARY KEY ("listId","memberPlanId")
);

-- CreateTable
CREATE TABLE "newsletter_subscribers" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMPTZ(3) NOT NULL,
    "listId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "source" "NewsletterSubscriberSource" NOT NULL,
    "subscribedAt" TIMESTAMPTZ(3) NOT NULL,
    "confirmedAt" TIMESTAMPTZ(3),
    "unsubscribedAt" TIMESTAMPTZ(3),

    CONSTRAINT "newsletter_subscribers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "newsletter_lists_slug_key" ON "newsletter_lists"("slug");

-- CreateIndex
CREATE INDEX "newsletter_subscribers_listId_idx" ON "newsletter_subscribers"("listId");

-- CreateIndex
CREATE UNIQUE INDEX "newsletter_subscribers_userId_listId_key" ON "newsletter_subscribers"("userId", "listId");

-- AddForeignKey
ALTER TABLE "newsletter_list_member_plans" ADD CONSTRAINT "newsletter_list_member_plans_listId_fkey" FOREIGN KEY ("listId") REFERENCES "newsletter_lists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "newsletter_list_member_plans" ADD CONSTRAINT "newsletter_list_member_plans_memberPlanId_fkey" FOREIGN KEY ("memberPlanId") REFERENCES "member.plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "newsletter_subscribers" ADD CONSTRAINT "newsletter_subscribers_listId_fkey" FOREIGN KEY ("listId") REFERENCES "newsletter_lists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "newsletter_subscribers" ADD CONSTRAINT "newsletter_subscribers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
