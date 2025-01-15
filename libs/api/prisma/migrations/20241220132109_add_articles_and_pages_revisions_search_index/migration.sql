DROP INDEX IF EXISTS idx_articles_revisions_tsvector;
DROP INDEX IF EXISTS idx_pages_revisions_tsvector;

CREATE INDEX idx_articles_revisions_text_search ON "articles.revisions" USING gin((to_tsvector('english', title) || jsonb_to_tsvector('english', jsonb_path_query_array(blocks, 'strict $.**."text"'::jsonpath, '{}'::jsonb, false), '["string"]'::jsonb)));
CREATE INDEX idx_pages_revisions_text_search ON "pages.revisions" USING gin((to_tsvector('english', title) || jsonb_to_tsvector('english', jsonb_path_query_array(blocks, 'strict $.**."text"'::jsonpath, '{}'::jsonb, false), '["string"]'::jsonb)));
