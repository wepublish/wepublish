-- CreateEnum
CREATE TYPE "MailProvider" AS ENUM ('mailgun', 'mailchimp', 'slack');

-- CreateEnum
CREATE TYPE "TrackingPixel" AS ENUM ('prolitteris');

-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('stripe-checkout', 'stripe', 'payrexx', 'payrexx-subscription', 'bexio', 'mollie', 'no-charge');

-- CreateEnum
CREATE TYPE "ChallengeProvider" AS ENUM ('turnstile');

-- CreateEnum
CREATE TYPE "AIProvider" AS ENUM ('v0');

-- CreateTable
CREATE TABLE "settings.mailprovider" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMP(3) NOT NULL,
    "type" "MailProvider" NOT NULL,
    "name" TEXT,
    "fromAddress" TEXT,
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
    "type" "TrackingPixel" NOT NULL,
    "name" TEXT,
    "prolitteris_memberNr" TEXT,
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
    "type" "PaymentProvider" NOT NULL,
    "name" TEXT,
    "offSessionPayments" BOOLEAN,
    "webhookEndpointSecret" TEXT,
    "apiKey" TEXT,
    "methods" JSONB,
    "payrexx_instancename" TEXT,
    "payrexx_psp" JSONB,
    "payrexx_pm" JSONB,
    "payrexx_vatrate" TEXT,
    "bexio_userId" TEXT,
    "bexio_countryId" TEXT,
    "bexio_invoiceTemplateNewMembership" TEXT,
    "bexio_invoiceTemplateRenewalMembership" TEXT,
    "bexio_unitId" TEXT,
    "bexio_taxId" TEXT,
    "bexio_accountId" TEXT,
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
    "type" "ChallengeProvider" NOT NULL,
    "secret" TEXT,
    "siteKey" TEXT,

    CONSTRAINT "settings.challengeprovider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings.hotandtrending" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMP(3) NOT NULL,
    "credentials" TEXT,
    "property" TEXT,
    "articlePrefix" TEXT,

    CONSTRAINT "settings.hotandtrending_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings.aiprovider" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMP(3) NOT NULL,
    "type" "AIProvider" NOT NULL,
    "name" TEXT,
    "apiKey" TEXT,
    "systemPrompt" TEXT,

    CONSTRAINT "settings.aiprovider_pkey" PRIMARY KEY ("id")
);
