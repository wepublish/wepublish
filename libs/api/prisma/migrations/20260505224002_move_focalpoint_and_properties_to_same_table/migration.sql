/*
  Warnings:

  - You are about to drop the `images.focal-point` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `properties` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "images.focal-point" DROP CONSTRAINT "images.focal-point_imageId_fkey";

-- DropForeignKey
ALTER TABLE "properties" DROP CONSTRAINT "properties_articleRevisionId_fkey";

-- DropForeignKey
ALTER TABLE "properties" DROP CONSTRAINT "properties_pageRevisionId_fkey";

-- DropForeignKey
ALTER TABLE "properties" DROP CONSTRAINT "properties_subscriptionId_fkey";

-- DropForeignKey
ALTER TABLE "properties" DROP CONSTRAINT "properties_userId_fkey";

-- AlterTable
ALTER TABLE "articles.revisions" ADD COLUMN     "properties" JSONB NOT NULL DEFAULT '[]';

-- AlterTable
ALTER TABLE "pages.revisions" ADD COLUMN     "properties" JSONB NOT NULL DEFAULT '[]';

-- AlterTable
ALTER TABLE "subscriptions" ADD COLUMN     "properties" JSONB NOT NULL DEFAULT '[]';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "properties" JSONB NOT NULL DEFAULT '[]';

-- Migrate properties
UPDATE "articles.revisions" a
SET "properties" = COALESCE(p.props, '[]'::jsonb)
FROM (
  SELECT
    "articleRevisionId",
    jsonb_agg(
      jsonb_build_object(
        'key', "key",
        'value', "value",
        'public', "public"
      )
    ) AS props
  FROM "properties"
  GROUP BY "articleRevisionId"
) p
WHERE a.id = p."articleRevisionId";

UPDATE "pages.revisions" a
SET "properties" = COALESCE(p.props, '[]'::jsonb)
FROM (
  SELECT
    "pageRevisionId",
    jsonb_agg(
      jsonb_build_object(
        'key', "key",
        'value', "value",
        'public', "public"
      )
    ) AS props
  FROM "properties"
  GROUP BY "pageRevisionId"
) p
WHERE a.id = p."pageRevisionId";

UPDATE "subscriptions" a
SET "properties" = COALESCE(p.props, '[]'::jsonb)
FROM (
  SELECT
    "subscriptionId",
    jsonb_agg(
      jsonb_build_object(
        'key', "key",
        'value', "value",
        'public', "public"
      )
    ) AS props
  FROM "properties"
  GROUP BY "subscriptionId"
) p
WHERE a.id = p."subscriptionId";

UPDATE "users" a
SET "properties" = COALESCE(p.props, '[]'::jsonb)
FROM (
  SELECT
    "userId",
    jsonb_agg(
      jsonb_build_object(
        'key', "key",
        'value', "value",
        'public', "public"
      )
    ) AS props
  FROM "properties"
  GROUP BY "userId"
) p
WHERE a.id = p."userId";

-- AlterTable
ALTER TABLE "images" ADD COLUMN     "focalPointX" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
ADD COLUMN     "focalPointY" DOUBLE PRECISION NOT NULL DEFAULT 0.5;

-- Migrate focal points
UPDATE "images" i
SET
  "focalPointX" = f."x",
  "focalPointY" = f."y"
FROM "images.focal-point" f
WHERE i.id = f."imageId";

-- DropTable
DROP TABLE "images.focal-point";

-- DropTable
DROP TABLE "properties";
