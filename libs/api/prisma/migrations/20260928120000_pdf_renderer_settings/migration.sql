-- CreateEnum
CREATE TYPE "PdfRendererType" AS ENUM ('cloudflare');

-- CreateTable
CREATE TABLE "settings.pdfrenderer" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMPTZ(3) NOT NULL,
    "lastLoadedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" "PdfRendererType" NOT NULL,
    "name" TEXT,
    "cloudflare_accountId" TEXT,
    "cloudflare_apiToken" TEXT,
    "timeoutMs" INTEGER,

    CONSTRAINT "settings.pdfrenderer_pkey" PRIMARY KEY ("id")
);
