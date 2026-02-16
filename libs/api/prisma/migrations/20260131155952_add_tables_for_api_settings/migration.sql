-- CreateEnum
CREATE TYPE "MailProviderType" AS ENUM ('mailgun', 'mailchimp', 'slack');

-- CreateEnum
CREATE TYPE "PaymentProviderType" AS ENUM ('stripe-checkout', 'stripe', 'payrexx', 'payrexx-subscription', 'bexio', 'mollie', 'no-charge');

-- CreateEnum
CREATE TYPE "PayrexxPSP" AS ENUM ('PAYREXX_PAY', 'PAYREXX_PAY_PLUS', 'POSTFINANCE_ECOMMERCE', 'PAYPAL', 'STRIPE', 'OGONE_BASIC', 'GIROPAY', 'OGONE_ALIAS_GATEWAY', 'CONCARDIS_PAY_ENGINE', 'CONCARDIS_BASIC', 'COINBASE', 'POSTFINANCE_ALIAS_GATEWAY', 'BRAINTREE', 'KLARNA', 'INVOICE', 'TWINT', 'SAFERPAY', 'DATATRANS', 'CCAVENUE', 'VIVEUM', 'REKA', 'SWISSBILLING', 'PAYONE', 'PAYREXX_PAYMENTS_BY_STRIPE', 'VORKASSE', 'CONCARDIS_PAYENGINE', 'WIRPAY', 'MOLLIE', 'SKRILL', 'VRPAY', 'WORLDPAY', 'PAYSAFECASH', 'UTRUST', 'POINTS_PAY', 'AMAZON_PAY', 'CLEARHAUS_ACQUIRING', 'POSTFINANCE_CHECKOUT', 'BARZAHLEN_VIACASH', 'POWERPAY', 'CEMBRAPAY');

-- CreateEnum
CREATE TYPE "PayrexxPM" AS ENUM ('ALIPAY', 'AMAZON_PAY', 'AMERICAN_EXPRESS', 'APPLE_PAY', 'BANCONTACT', 'BANK_TRANSFER', 'CARTES_BANCAIRES', 'CRYPTO', 'DINERS_CLUB', 'DISCOVER', 'EPS', 'GIROPAY', 'GOOGLE_PAY', 'IDEAL', 'INVOICE', 'JCB', 'MAESTRO', 'MASTERCARD', 'PAY_BY_BANK', 'PAYPAL', 'POST_FINANCE_PAY', 'POWERPAY', 'PREPAYMENT', 'SAMSUNG_PAY', 'SEPA_DIRECT_DEBIT', 'KLARNA', 'TWINT', 'UNIONPAY', 'VERD_CASH', 'VISA', 'V_PAY', 'WECHAT_PAY', 'SWISSCOM_PAY');

-- CreateEnum
CREATE TYPE "StripePaymentMethod" AS ENUM ('ACSS_DEBIT', 'AFTERPAY_CLEARPAY', 'ALIPAY', 'AU_BECS_DEBIT', 'BACS_DEBIT', 'BANCONTACT', 'BOLETO', 'CARD', 'EPS', 'FPX', 'GIROPAY', 'GRABPAY', 'IDEAL', 'KLARNA', 'KONBINI', 'OXXO', 'P24', 'PAYNOW', 'SEPA_DEBIT', 'SOFORT', 'US_BANK_ACCOUNT', 'WECHAT_PAY');

-- CreateEnum
CREATE TYPE "MolliePaymentMethod" AS ENUM ('ALMA', 'APPLEPAY', 'BACS', 'BANCOMATPAY', 'BANCONTACT', 'BANKTRANSFER', 'BELFIUS', 'BILLIE', 'BLIK', 'CREDITCARD', 'DIRECTDEBIT', 'EPS', 'GIFTCARD', 'IDEAL', 'IN3', 'KBC', 'KLARNA', 'KLARNAPAYLATER', 'KLARNAPAYNOW', 'KLARNASLICEIT', 'MYBANK', 'PAYPAL', 'PAYSAFECARD', 'PRZELEWY24', 'RIVERTY', 'SATISPAY', 'TRUSTLY', 'TWINT', 'VOUCHER');

-- CreateEnum
CREATE TYPE "ChallengeProviderType" AS ENUM ('turnstile');

-- CreateEnum
CREATE TYPE "AIProviderType" AS ENUM ('v0');

-- CreateTable
CREATE TABLE "settings.mailprovider" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMP(3) NOT NULL,
    "lastLoadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
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
    "lastLoadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
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
    "lastLoadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" "PaymentProviderType" NOT NULL,
    "name" TEXT,
    "offSessionPayments" BOOLEAN,
    "webhookEndpointSecret" TEXT,
    "apiKey" TEXT,
    "stripe_methods" "StripePaymentMethod"[],
    "payrexx_instancename" TEXT,
    "payrexx_psp" "PayrexxPSP"[],
    "payrexx_pm" "PayrexxPM"[],
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
    "mollie_methods" "MolliePaymentMethod"[],

    CONSTRAINT "settings.paymentprovider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings.challengeprovider" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMP(3) NOT NULL,
    "lastLoadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
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
    "lastLoadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" "AIProviderType" NOT NULL,
    "name" TEXT,
    "apiKey" TEXT,
    "systemPrompt" TEXT,

    CONSTRAINT "settings.aiprovider_pkey" PRIMARY KEY ("id")
);
