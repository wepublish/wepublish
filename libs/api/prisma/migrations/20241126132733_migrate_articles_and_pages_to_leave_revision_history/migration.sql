/*
  Warnings:

  - You are about to drop the column `draftId` on the `articles` table. All the data in the column will be lost.
  - You are about to drop the column `pendingId` on the `articles` table. All the data in the column will be lost.
  - You are about to drop the column `publishedId` on the `articles` table. All the data in the column will be lost.
  - You are about to drop the column `modifiedAt` on the `articles.revisions` table. All the data in the column will be lost.
  - You are about to drop the column `publishAt` on the `articles.revisions` table. All the data in the column will be lost.
  - You are about to drop the column `revision` on the `articles.revisions` table. All the data in the column will be lost.
  - You are about to drop the column `tags` on the `articles.revisions` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `articles.revisions` table. All the data in the column will be lost.
  - You are about to drop the column `draftId` on the `pages` table. All the data in the column will be lost.
  - You are about to drop the column `pendingId` on the `pages` table. All the data in the column will be lost.
  - You are about to drop the column `publishedId` on the `pages` table. All the data in the column will be lost.
  - You are about to drop the column `modifiedAt` on the `pages.revisions` table. All the data in the column will be lost.
  - You are about to drop the column `publishAt` on the `pages.revisions` table. All the data in the column will be lost.
  - You are about to drop the column `revision` on the `pages.revisions` table. All the data in the column will be lost.
  - You are about to drop the column `tags` on the `pages.revisions` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `pages.revisions` table. All the data in the column will be lost.
*/

/**
 * Article
**/

-- AlterTable
ALTER TABLE "articles" ADD COLUMN     "publishedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "articles_publishedAt_idx" ON "articles"("publishedAt");

-- AlterTable
ALTER TABLE "articles" ADD COLUMN     "slug" TEXT;

-- AlterTable
ALTER TABLE "articles" ADD COLUMN     "likes" INTEGER NOT NULL DEFAULT 0;

-- Migrate publishedAt
UPDATE "articles.revisions"
SET "publishedAt" = "publishAt"
WHERE "publishedAt" IS NULL;

UPDATE "articles" a
SET "publishedAt" = ar."publishedAt"
FROM "articles.revisions" ar
WHERE ar.id = a."publishedId";

-- Migrate slug
UPDATE "articles" a
SET "slug" = ar."slug"
FROM "articles.revisions" ar
WHERE ar.id = a."publishedId" or ar.id = a."pendingId";

-- CreateIndex
CREATE UNIQUE INDEX "articles_slug_key" ON "articles"("slug") WHERE ("publishedAt" is NOT null);

-- Migrate likes
UPDATE "articles" a
SET "likes" = ar."likes"
FROM "articles.revisions" ar
WHERE ar.id = a."publishedId" or ar.id = a."pendingId";

-- AlterTable
ALTER TABLE "articles.revisions" ADD COLUMN "articleId" TEXT;

-- Migrate articleId
UPDATE "articles.revisions" ar
SET "articleId" = a.id
FROM "articles" a
WHERE ar.id = a."draftId" OR ar.id = a."pendingId" OR ar.id = a."publishedId";

-- AlterTable
ALTER TABLE "articles.revisions" ALTER COLUMN "articleId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "articles.revisions" ADD CONSTRAINT "articles.revisions_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "articles.revisions" ADD COLUMN     "userId" TEXT;

-- AddForeignKey
ALTER TABLE "articles.revisions" ADD CONSTRAINT "articles.revisions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

/* REMOVE NOT NEEDED COLUMNS */
-- DropForeignKey
ALTER TABLE "articles" DROP CONSTRAINT "articles_draftId_fkey";

-- DropForeignKey
ALTER TABLE "articles" DROP CONSTRAINT "articles_pendingId_fkey";

-- DropForeignKey
ALTER TABLE "articles" DROP CONSTRAINT "articles_publishedId_fkey";

-- DropIndex
DROP INDEX "articles_draftId_key";

-- DropIndex
DROP INDEX "articles_pendingId_key";

-- DropIndex
DROP INDEX "articles_publishedId_key";

-- DropIndex
DROP INDEX "articles.revisions_publishAt_idx";

-- DropIndex
DROP INDEX "articles.revisions_tags_idx";

-- DropIndex
DROP INDEX "articles.revisions_updatedAt_idx";

-- AlterTable
ALTER TABLE "articles.revisions" DROP COLUMN "modifiedAt",
DROP COLUMN "publishAt",
DROP COLUMN "revision",
DROP COLUMN "tags",
DROP COLUMN "updatedAt",
DROP COLUMN "slug",
DROP COLUMN "likes";

-- AlterTable
ALTER TABLE "articles" DROP COLUMN "draftId",
DROP COLUMN "pendingId",
DROP COLUMN "publishedId";

/**
 * Page
**/
-- AlterTable
ALTER TABLE "pages" ADD COLUMN     "publishedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "pages_publishedAt_idx" ON "pages"("publishedAt");

-- AlterTable
ALTER TABLE "pages" ADD COLUMN     "slug" TEXT;

-- Migrate publishedAt
UPDATE "pages.revisions"
SET "publishedAt" = "publishAt"
WHERE "publishedAt" IS NULL;

UPDATE "pages" p
SET "publishedAt" = pr."publishedAt"
FROM "pages.revisions" pr
WHERE pr.id = p."publishedId";

-- Migrate slug
UPDATE "pages" p
SET "slug" = pr."slug"
FROM "pages.revisions" pr
WHERE pr.id = p."publishedId" or pr.id = p."pendingId";

-- CreateIndex
CREATE UNIQUE INDEX "pages_slug_key" ON "pages"("slug") WHERE ("publishedAt" is NOT null);

-- AlterTable
ALTER TABLE "pages.revisions" ADD COLUMN "pageId" TEXT;

-- Migrate pageId
UPDATE "pages.revisions" pr
SET "pageId" = p.id
FROM "pages" p
WHERE pr.id = p."draftId" OR pr.id = p."pendingId" OR pr.id = p."publishedId";

-- AlterTable
ALTER TABLE "pages.revisions" ALTER COLUMN "pageId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "pages.revisions" ADD CONSTRAINT "pages.revisions_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "pages.revisions" ADD COLUMN     "userId" TEXT;

-- AddForeignKey
ALTER TABLE "pages.revisions" ADD CONSTRAINT "pages.revisions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

/* REMOVE NOT NEEDED COLUMNS */
-- DropForeignKey
ALTER TABLE "pages" DROP CONSTRAINT "pages_draftId_fkey";

-- DropForeignKey
ALTER TABLE "pages" DROP CONSTRAINT "pages_pendingId_fkey";

-- DropForeignKey
ALTER TABLE "pages" DROP CONSTRAINT "pages_publishedId_fkey";

-- DropIndex
DROP INDEX "pages_draftId_key";

-- DropIndex
DROP INDEX "pages_pendingId_key";

-- DropIndex
DROP INDEX "pages_publishedId_key";

-- DropIndex
DROP INDEX "pages.revisions_publishAt_idx";

-- DropIndex
DROP INDEX "pages.revisions_tags_idx";

-- DropIndex
DROP INDEX "pages.revisions_updatedAt_idx";

-- AlterTable
ALTER TABLE "pages.revisions" DROP COLUMN "modifiedAt",
DROP COLUMN "publishAt",
DROP COLUMN "revision",
DROP COLUMN "tags",
DROP COLUMN "updatedAt",
DROP COLUMN "slug";

-- AlterTable
ALTER TABLE "pages.revisions" ALTER COLUMN "title" DROP NOT NULL;

-- AlterTable
ALTER TABLE "pages" DROP COLUMN "draftId",
DROP COLUMN "pendingId",
DROP COLUMN "publishedId";