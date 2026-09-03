-- CreateEnum
CREATE TYPE "KnowledgeProviderType" AS ENUM ('zettelkasten');

-- AlterEnum
ALTER TYPE "BlockType" ADD VALUE 'mailchimpForm';

-- CreateTable
CREATE TABLE "settings.knowledgeprovider" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMPTZ(3) NOT NULL,
    "lastLoadedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" "KnowledgeProviderType" NOT NULL,
    "name" TEXT,
    "url" TEXT,
    "token" TEXT,
    "tenant" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "settings.knowledgeprovider_pkey" PRIMARY KEY ("id")
);

-- The single row every editor has; the form updates it, nothing creates rows.
INSERT INTO "settings.knowledgeprovider" ("id", "modifiedAt", "type", "name")
VALUES ('zettelkasten', CURRENT_TIMESTAMP, 'zettelkasten', 'Zettelkasten');
