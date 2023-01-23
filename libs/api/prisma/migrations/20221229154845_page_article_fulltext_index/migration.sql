-- Indexes for fulltext search
CREATE INDEX ON "articles.revisions" USING gin(jsonb_to_tsvector('english', jsonb_path_query_array(blocks, 'strict $.**.text'), '["string"]'));
CREATE INDEX ON "pages.revisions" USING gin(jsonb_to_tsvector('english', jsonb_path_query_array(blocks, 'strict $.**.text'), '["string"]'));
