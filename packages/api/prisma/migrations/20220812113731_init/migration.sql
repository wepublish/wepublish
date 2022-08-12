-- CreateEnum
CREATE TYPE "CommentItemType" AS ENUM ('article', 'page');

-- CreateEnum
CREATE TYPE "CommentRejectionReason" AS ENUM ('misconduct', 'spam');

-- CreateEnum
CREATE TYPE "CommentState" AS ENUM ('approved', 'pendingApproval', 'pendingUserChanges', 'rejected');

-- CreateEnum
CREATE TYPE "CommentAuthorType" AS ENUM ('team', 'author', 'verifiedUser', 'guestUser');

-- CreateEnum
CREATE TYPE "MailLogState" AS ENUM ('submitted', 'accepted', 'delivered', 'deferred', 'bounced', 'rejected');

-- CreateEnum
CREATE TYPE "PaymentPeriodicity" AS ENUM ('monthly', 'quarterly', 'biannual', 'yearly');

-- CreateEnum
CREATE TYPE "PaymentState" AS ENUM ('created', 'submitted', 'requiresUserAction', 'processing', 'paid', 'canceled', 'declined');

-- CreateEnum
CREATE TYPE "SubscriptionDeactivationReason" AS ENUM ('none', 'userSelfDeactivated', 'invoiceNotPaid');

-- CreateTable
CREATE TABLE "properties" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMP(3) NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "public" BOOLEAN NOT NULL,
    "articleRevisionId" TEXT,
    "pageRevisionId" TEXT,
    "subscriptionId" TEXT,
    "userId" TEXT,

    CONSTRAINT "properties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "articles.revisions" (
    "id" TEXT NOT NULL,
    "preTitle" TEXT,
    "title" TEXT,
    "lead" TEXT,
    "seoTitle" TEXT,
    "slug" TEXT,
    "tags" TEXT[],
    "canonicalUrl" TEXT,
    "imageID" TEXT,
    "authorIDs" TEXT[],
    "breaking" BOOLEAN NOT NULL,
    "blocks" JSONB[],
    "hideAuthor" BOOLEAN NOT NULL,
    "socialMediaTitle" TEXT,
    "socialMediaDescription" TEXT,
    "socialMediaAuthorIDs" TEXT[],
    "socialMediaImageID" TEXT,
    "revision" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3),
    "publishAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),

    CONSTRAINT "articles.revisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "articles" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMP(3) NOT NULL,
    "publishedId" TEXT,
    "pendingId" TEXT,
    "draftId" TEXT,
    "shared" BOOLEAN NOT NULL,

    CONSTRAINT "articles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "authors.links" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMP(3) NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "authorId" TEXT,

    CONSTRAINT "authors.links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "authors" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "jobTitle" TEXT,
    "bio" JSONB[],
    "imageID" TEXT,

    CONSTRAINT "authors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "images.focal-point" (
    "x" DOUBLE PRECISION,
    "y" DOUBLE PRECISION,
    "imageId" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "images" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "description" TEXT,
    "extension" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "filename" TEXT,
    "format" TEXT NOT NULL,
    "license" TEXT,
    "link" TEXT,
    "mimeType" TEXT NOT NULL,
    "modifiedAt" TIMESTAMP(3) NOT NULL,
    "source" TEXT,
    "tags" TEXT[],
    "title" TEXT,
    "height" INTEGER NOT NULL,
    "width" INTEGER NOT NULL,

    CONSTRAINT "images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comments.revisions" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "text" JSONB NOT NULL,
    "commentId" TEXT,

    CONSTRAINT "comments.revisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comments" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMP(3) NOT NULL,
    "userID" TEXT,
    "itemID" TEXT NOT NULL,
    "itemType" "CommentItemType" NOT NULL,
    "parentID" TEXT,
    "rejectionReason" "CommentRejectionReason",
    "state" "CommentState" NOT NULL,
    "authorType" "CommentAuthorType" NOT NULL,
    "guestUsername" TEXT,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices.items" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "quantity" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,
    "invoiceId" TEXT,

    CONSTRAINT "invoices.items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMP(3) NOT NULL,
    "mail" TEXT NOT NULL,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "paidAt" TIMESTAMP(3),
    "canceledAt" TIMESTAMP(3),
    "sentReminderAt" TIMESTAMP(3),
    "manuallySetAsPaidByUserId" TEXT,
    "subscriptionID" TEXT,
    "userID" TEXT,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mail.log" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMP(3) NOT NULL,
    "recipient" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "state" "MailLogState" NOT NULL,
    "mailData" TEXT,
    "mailProviderID" TEXT NOT NULL,

    CONSTRAINT "mail.log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "member.plans.payment-methods" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMP(3) NOT NULL,
    "paymentMethodIDs" TEXT[],
    "paymentPeriodicities" "PaymentPeriodicity"[],
    "forceAutoRenewal" BOOLEAN NOT NULL,
    "memberPlanId" TEXT,

    CONSTRAINT "member.plans.payment-methods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "member.plans" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "tags" TEXT[],
    "description" JSONB[],
    "active" BOOLEAN NOT NULL,
    "amountPerMonthMin" DOUBLE PRECISION NOT NULL,
    "imageID" TEXT,

    CONSTRAINT "member.plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "navigations.links" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMP(3) NOT NULL,
    "label" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT,
    "pageID" TEXT,
    "articleID" TEXT,
    "navigationId" TEXT,

    CONSTRAINT "navigations.links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "navigations" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMP(3) NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "navigations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pages.revision" (
    "id" TEXT NOT NULL,
    "revision" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "publishAt" TIMESTAMP(3),
    "slug" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "tags" TEXT[],
    "imageID" TEXT,
    "socialMediaTitle" TEXT,
    "socialMediaDescription" TEXT,
    "socialMediaImageID" TEXT,
    "blocks" JSONB[],

    CONSTRAINT "pages.revision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pages" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMP(3) NOT NULL,
    "publishedId" TEXT,
    "pendingId" TEXT,
    "draftId" TEXT,

    CONSTRAINT "pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment.methods" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "paymentProviderID" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL,

    CONSTRAINT "payment.methods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMP(3) NOT NULL,
    "invoiceID" TEXT NOT NULL,
    "state" "PaymentState" NOT NULL,
    "intentID" TEXT,
    "intentSecret" TEXT,
    "intentData" TEXT,
    "paymentData" TEXT,
    "paymentMethodID" TEXT NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "peerProfiles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "themeColor" TEXT NOT NULL,
    "themeFontColor" TEXT NOT NULL,
    "callToActionURL" TEXT NOT NULL,
    "callToActionText" JSONB[],
    "callToActionImageURL" TEXT,
    "callToActionImageID" TEXT,
    "logoID" TEXT,

    CONSTRAINT "peerProfiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "peers" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "hostURL" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "isDisabled" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "peers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tokens" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "roleIDs" TEXT[],

    CONSTRAINT "tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "userID" TEXT NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions.periods" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMP(3) NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "paymentPeriodicity" "PaymentPeriodicity" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "invoiceID" TEXT NOT NULL,
    "subscriptionId" TEXT,

    CONSTRAINT "subscriptions.periods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions.deactivation-reasons" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMP(3) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "reason" "SubscriptionDeactivationReason" NOT NULL,
    "subscriptionID" TEXT NOT NULL,

    CONSTRAINT "subscriptions.deactivation-reasons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMP(3) NOT NULL,
    "paymentPeriodicity" "PaymentPeriodicity" NOT NULL,
    "monthlyAmount" DOUBLE PRECISION NOT NULL,
    "autoRenew" BOOLEAN NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "paidUntil" TIMESTAMP(3),
    "paymentMethodID" TEXT NOT NULL,
    "memberPlanID" TEXT NOT NULL,
    "userID" TEXT NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users.addresses" (
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMP(3) NOT NULL,
    "company" TEXT,
    "streetAddress" TEXT,
    "streetAddress2" TEXT,
    "zipCode" TEXT,
    "city" TEXT,
    "country" TEXT,
    "userId" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "users.oauth2-accounts" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMP(3) NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refreshToken" TEXT,
    "accessToken" TEXT NOT NULL,
    "expiresAt" INTEGER NOT NULL,
    "tokenType" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "idToken" TEXT NOT NULL,
    "oauthTokenSecret" TEXT,
    "oauthToken" TEXT,
    "sessionState" TEXT,
    "userId" TEXT,

    CONSTRAINT "users.oauth2-accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users.payment-providers" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMP(3) NOT NULL,
    "paymentProviderID" TEXT NOT NULL,
    "customerID" TEXT NOT NULL,
    "userId" TEXT,

    CONSTRAINT "users.payment-providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMP(3) NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerifiedAt" TIMESTAMP(3),
    "name" TEXT NOT NULL,
    "firstName" TEXT,
    "preferredName" TEXT,
    "password" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL,
    "lastLogin" TIMESTAMP(3),
    "roleIDs" TEXT[],

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users.roles" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "name" TEXT NOT NULL,
    "permissionIDs" TEXT[],
    "systemRole" BOOLEAN NOT NULL,

    CONSTRAINT "users.roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "settingRestriction" JSONB NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "articles.revisions_publishAt_idx" ON "articles.revisions"("publishAt");

-- CreateIndex
CREATE INDEX "articles.revisions_publishedAt_idx" ON "articles.revisions"("publishedAt");

-- CreateIndex
CREATE INDEX "articles.revisions_updatedAt_idx" ON "articles.revisions"("updatedAt");

-- CreateIndex
CREATE INDEX "articles.revisions_tags_idx" ON "articles.revisions"("tags");

-- CreateIndex
CREATE UNIQUE INDEX "articles_publishedId_key" ON "articles"("publishedId");

-- CreateIndex
CREATE UNIQUE INDEX "articles_pendingId_key" ON "articles"("pendingId");

-- CreateIndex
CREATE UNIQUE INDEX "articles_draftId_key" ON "articles"("draftId");

-- CreateIndex
CREATE INDEX "articles_createdAt_idx" ON "articles"("createdAt");

-- CreateIndex
CREATE INDEX "articles_modifiedAt_idx" ON "articles"("modifiedAt");

-- CreateIndex
CREATE UNIQUE INDEX "authors_slug_key" ON "authors"("slug");

-- CreateIndex
CREATE INDEX "authors_createdAt_idx" ON "authors"("createdAt");

-- CreateIndex
CREATE INDEX "authors_modifiedAt_idx" ON "authors"("modifiedAt");

-- CreateIndex
CREATE INDEX "authors_name_idx" ON "authors"("name");

-- CreateIndex
CREATE UNIQUE INDEX "images.focal-point_imageId_key" ON "images.focal-point"("imageId");

-- CreateIndex
CREATE INDEX "images_createdAt_idx" ON "images"("createdAt");

-- CreateIndex
CREATE INDEX "images_modifiedAt_idx" ON "images"("modifiedAt");

-- CreateIndex
CREATE INDEX "images_title_idx" ON "images"("title");

-- CreateIndex
CREATE INDEX "images_tags_idx" ON "images"("tags");

-- CreateIndex
CREATE INDEX "comments.revisions_createdAt_idx" ON "comments.revisions"("createdAt");

-- CreateIndex
CREATE INDEX "comments_createdAt_idx" ON "comments"("createdAt");

-- CreateIndex
CREATE INDEX "invoices_mail_idx" ON "invoices"("mail");

-- CreateIndex
CREATE INDEX "mail.log_subject_idx" ON "mail.log"("subject");

-- CreateIndex
CREATE UNIQUE INDEX "member.plans_slug_key" ON "member.plans"("slug");

-- CreateIndex
CREATE INDEX "member.plans_name_idx" ON "member.plans"("name");

-- CreateIndex
CREATE UNIQUE INDEX "navigations_key_key" ON "navigations"("key");

-- CreateIndex
CREATE INDEX "navigations_createdAt_idx" ON "navigations"("createdAt");

-- CreateIndex
CREATE INDEX "navigations_modifiedAt_idx" ON "navigations"("modifiedAt");

-- CreateIndex
CREATE INDEX "navigations_name_idx" ON "navigations"("name");

-- CreateIndex
CREATE INDEX "pages.revision_publishAt_idx" ON "pages.revision"("publishAt");

-- CreateIndex
CREATE INDEX "pages.revision_publishedAt_idx" ON "pages.revision"("publishedAt");

-- CreateIndex
CREATE INDEX "pages.revision_updatedAt_idx" ON "pages.revision"("updatedAt");

-- CreateIndex
CREATE INDEX "pages.revision_tags_idx" ON "pages.revision"("tags");

-- CreateIndex
CREATE UNIQUE INDEX "pages_publishedId_key" ON "pages"("publishedId");

-- CreateIndex
CREATE UNIQUE INDEX "pages_pendingId_key" ON "pages"("pendingId");

-- CreateIndex
CREATE UNIQUE INDEX "pages_draftId_key" ON "pages"("draftId");

-- CreateIndex
CREATE INDEX "pages_createdAt_idx" ON "pages"("createdAt");

-- CreateIndex
CREATE INDEX "pages_modifiedAt_idx" ON "pages"("modifiedAt");

-- CreateIndex
CREATE INDEX "payments_intentID_idx" ON "payments"("intentID");

-- CreateIndex
CREATE UNIQUE INDEX "peers_slug_key" ON "peers"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "tokens_name_key" ON "tokens"("name");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_key" ON "sessions"("token");

-- CreateIndex
CREATE INDEX "sessions_userID_idx" ON "sessions"("userID");

-- CreateIndex
CREATE INDEX "sessions_token_idx" ON "sessions"("token");

-- CreateIndex
CREATE INDEX "sessions_expiresAt_idx" ON "sessions"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions.deactivation-reasons_subscriptionID_key" ON "subscriptions.deactivation-reasons"("subscriptionID");

-- CreateIndex
CREATE UNIQUE INDEX "users.addresses_userId_key" ON "users.addresses"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users.roles_name_key" ON "users.roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "settings_name_key" ON "settings"("name");

-- AddForeignKey
ALTER TABLE "properties" ADD CONSTRAINT "properties_articleRevisionId_fkey" FOREIGN KEY ("articleRevisionId") REFERENCES "articles.revisions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "properties" ADD CONSTRAINT "properties_pageRevisionId_fkey" FOREIGN KEY ("pageRevisionId") REFERENCES "pages.revision"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "properties" ADD CONSTRAINT "properties_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "properties" ADD CONSTRAINT "properties_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "articles" ADD CONSTRAINT "articles_publishedId_fkey" FOREIGN KEY ("publishedId") REFERENCES "articles.revisions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "articles" ADD CONSTRAINT "articles_pendingId_fkey" FOREIGN KEY ("pendingId") REFERENCES "articles.revisions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "articles" ADD CONSTRAINT "articles_draftId_fkey" FOREIGN KEY ("draftId") REFERENCES "articles.revisions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "authors.links" ADD CONSTRAINT "authors.links_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "authors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "authors" ADD CONSTRAINT "authors_imageID_fkey" FOREIGN KEY ("imageID") REFERENCES "images"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "images.focal-point" ADD CONSTRAINT "images.focal-point_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "images"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments.revisions" ADD CONSTRAINT "comments.revisions_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "comments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_userID_fkey" FOREIGN KEY ("userID") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices.items" ADD CONSTRAINT "invoices.items_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_subscriptionID_fkey" FOREIGN KEY ("subscriptionID") REFERENCES "subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_userID_fkey" FOREIGN KEY ("userID") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member.plans.payment-methods" ADD CONSTRAINT "member.plans.payment-methods_memberPlanId_fkey" FOREIGN KEY ("memberPlanId") REFERENCES "member.plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member.plans" ADD CONSTRAINT "member.plans_imageID_fkey" FOREIGN KEY ("imageID") REFERENCES "images"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "navigations.links" ADD CONSTRAINT "navigations.links_navigationId_fkey" FOREIGN KEY ("navigationId") REFERENCES "navigations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pages" ADD CONSTRAINT "pages_publishedId_fkey" FOREIGN KEY ("publishedId") REFERENCES "pages.revision"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pages" ADD CONSTRAINT "pages_pendingId_fkey" FOREIGN KEY ("pendingId") REFERENCES "pages.revision"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pages" ADD CONSTRAINT "pages_draftId_fkey" FOREIGN KEY ("draftId") REFERENCES "pages.revision"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_paymentMethodID_fkey" FOREIGN KEY ("paymentMethodID") REFERENCES "payment.methods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "peerProfiles" ADD CONSTRAINT "peerProfiles_logoID_fkey" FOREIGN KEY ("logoID") REFERENCES "images"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userID_fkey" FOREIGN KEY ("userID") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions.periods" ADD CONSTRAINT "subscriptions.periods_invoiceID_fkey" FOREIGN KEY ("invoiceID") REFERENCES "invoices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions.periods" ADD CONSTRAINT "subscriptions.periods_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions.deactivation-reasons" ADD CONSTRAINT "subscriptions.deactivation-reasons_subscriptionID_fkey" FOREIGN KEY ("subscriptionID") REFERENCES "subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_memberPlanID_fkey" FOREIGN KEY ("memberPlanID") REFERENCES "member.plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_paymentMethodID_fkey" FOREIGN KEY ("paymentMethodID") REFERENCES "payment.methods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_userID_fkey" FOREIGN KEY ("userID") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users.addresses" ADD CONSTRAINT "users.addresses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users.oauth2-accounts" ADD CONSTRAINT "users.oauth2-accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users.payment-providers" ADD CONSTRAINT "users.payment-providers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
