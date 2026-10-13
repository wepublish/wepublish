-- Fix published slugs that only differ in casing
WITH "DuplicateSlugs" AS (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY LOWER(slug) ORDER BY "publishedAt") AS rownumber
    FROM "articles"
    WHERE "publishedAt" IS NOT NULL AND slug IS NOT NULL
)
UPDATE "articles"
SET slug = CONCAT("articles".slug, '-', ds.rownumber)
FROM "DuplicateSlugs" ds
WHERE "articles".id = ds.id AND ds.rownumber > 1;

-- Lowercase slugs
UPDATE "articles" SET slug = LOWER(slug) WHERE slug <> LOWER(slug);

-- AddCheckConstraint
ALTER TABLE "articles" ADD CONSTRAINT "articles_slug_lowercase_check" CHECK (slug = LOWER(slug));

-- DropIndex
DROP INDEX "articles_slug_lower_idx";

