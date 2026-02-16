-- CreateEnum
CREATE TYPE "ExternalAppsTarget" AS ENUM ('blank', 'iframe');

-- CreateTable
CREATE TABLE "apps.external" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "target" "ExternalAppsTarget" NOT NULL,
    "icon" TEXT,

    CONSTRAINT "apps.external_pkey" PRIMARY KEY ("id")
);
