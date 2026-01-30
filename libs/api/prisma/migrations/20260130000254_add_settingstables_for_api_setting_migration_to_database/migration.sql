-- CreateEnum
CREATE TYPE "MailProviderType" AS ENUM ('mailgun', 'mailchimp', 'slack');

-- CreateEnum
CREATE TYPE "PaymentProviderType" AS ENUM ('stripe-checkout', 'stripe', 'payrexx', 'payrexx-subscription', 'bexio', 'mollie', 'no-charge');

-- CreateEnum
CREATE TYPE "ChallengeProviderType" AS ENUM ('turnstile');

-- CreateEnum
CREATE TYPE "AIProviderType" AS ENUM ('v0');

-- CreateTable
CREATE TABLE "settings.mailprovider" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMP(3) NOT NULL,
    "type" "MailProviderType" NOT NULL,
    "name" TEXT,
    "fromAddress" TEXT,
    "replyToAddress" TEXT,
    "webhookEndpointSecret" TEXT,
    "apiKey" TEXT,
    "mailgun_mailDomain" TEXT,
    "mailgun_baseDomain" TEXT,
    "mailchimp_baseURL" TEXT,
    "slack_webhookURL" TEXT,

    CONSTRAINT "settings.mailprovider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings.trackingpixel" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMP(3) NOT NULL,
    "type" "TrackingPixelProviderType" NOT NULL,
    "name" TEXT,
    "prolitteris_memberNr" TEXT,
    "prolitteris_username" TEXT,
    "prolitteris_password" TEXT,
    "prolitteris_publisherInternalKeyDomain" TEXT,
    "prolitteris_usePublisherInternalKey" BOOLEAN,
    "prolitteris_onlyPaidContentAccess" BOOLEAN,

    CONSTRAINT "settings.trackingpixel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings.paymentprovider" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMP(3) NOT NULL,
    "type" "PaymentProviderType" NOT NULL,
    "name" TEXT,
    "offSessionPayments" BOOLEAN,
    "webhookEndpointSecret" TEXT,
    "apiKey" TEXT,
    "methods" JSONB,
    "payrexx_instancename" TEXT,
    "payrexx_psp" JSONB,
    "payrexx_pm" JSONB,
    "payrexx_vatrate" DECIMAL(5,4),
    "bexio_userId" INTEGER,
    "bexio_countryId" INTEGER,
    "bexio_invoiceTemplateNewMembership" TEXT,
    "bexio_invoiceTemplateRenewalMembership" TEXT,
    "bexio_unitId" INTEGER,
    "bexio_taxId" INTEGER,
    "bexio_accountId" INTEGER,
    "bexio_invoiceTitleNewMembership" TEXT,
    "bexio_invoiceTitleRenewalMembership" TEXT,
    "bexio_invoiceMailSubjectNewMembership" TEXT,
    "bexio_invoiceMailBodyNewMembership" TEXT,
    "bexio_invoiceMailSubjectRenewalMembership" TEXT,
    "bexio_invoiceMailBodyRenewalMembership" TEXT,
    "bexio_markInvoiceAsOpen" BOOLEAN,
    "mollie_apiBaseUrl" TEXT,

    CONSTRAINT "settings.paymentprovider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings.challengeprovider" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT,
    "type" "ChallengeProviderType" NOT NULL,
    "secret" TEXT,
    "siteKey" TEXT,

    CONSTRAINT "settings.challengeprovider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings.aiprovider" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMP(3) NOT NULL,
    "type" "AIProviderType" NOT NULL,
    "name" TEXT,
    "apiKey" TEXT,
    "systemPrompt" TEXT,

    CONSTRAINT "settings.aiprovider_pkey" PRIMARY KEY ("id")
);
