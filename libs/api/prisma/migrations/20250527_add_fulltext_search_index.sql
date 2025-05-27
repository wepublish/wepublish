-- Create a GIN index for full-text search on article revisions
CREATE INDEX IF NOT EXISTS "article_revisions_fulltext_search_idx" ON "articles.revisions" USING GIN (
  (
    to_tsvector('german', coalesce(title, '')) || 
    to_tsvector('german', coalesce("preTitle", '')) || 
    to_tsvector('german', coalesce(lead, ''))
  )
);

-- Create a GIN index for full-text search on page revisions
CREATE INDEX IF NOT EXISTS "page_revisions_fulltext_search_idx" ON "pages.revisions" USING GIN (
  (
    to_tsvector('german', coalesce(title, '')) || 
    to_tsvector('german', coalesce(description, ''))
  )
);

-- Drop the searchPlainText column from article revisions
ALTER TABLE "articles.revisions" DROP COLUMN IF EXISTS "searchPlainText";

-- Drop the searchPlainText column from page revisions
ALTER TABLE "pages.revisions" DROP COLUMN IF EXISTS "searchPlainText";