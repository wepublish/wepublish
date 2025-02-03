DROP INDEX IF EXISTS idx_articles_revisions_tsvector;
DROP INDEX IF EXISTS idx_pages_revisions_tsvector;

-- AlterTable
ALTER TABLE "articles.revisions" DROP COLUMN "searchPlainText";

-- AlterTable
ALTER TABLE "pages.revisions" DROP COLUMN "searchPlainText";

-- AlterTable
ALTER TABLE "articles.revisions" ADD COLUMN "fullText" tsvector NOT NULL GENERATED ALWAYS AS (to_tsvector('english', title) || jsonb_to_tsvector('english', jsonb_path_query_array(blocks, 'strict $.**."text"'::jsonpath, '{}'::jsonb, false), '["string"]'::jsonb)) STORED;

-- AlterTable
ALTER TABLE "pages.revisions" ADD COLUMN "fullText" tsvector NOT NULL GENERATED ALWAYS AS (to_tsvector('english', title) || jsonb_to_tsvector('english', jsonb_path_query_array(blocks, 'strict $.**."text"'::jsonpath, '{}'::jsonb, false), '["string"]'::jsonb)) STORED;
