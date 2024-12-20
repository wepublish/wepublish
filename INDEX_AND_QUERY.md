CREATE INDEX idx_articles_revisions_text_search ON "articles.revisions" USING gin((to_tsvector('english', title) || jsonb_to_tsvector('english', jsonb_path_query_array(blocks, 'strict $.**."text"'::jsonpath, '{}'::jsonb, false), '["string"]'::jsonb)));

SELECT * FROM articles a
JOIN "articles.revisions" ar ON a."publishedId" = ar.id
WHERE to_tsvector('english', ar.title)
  || jsonb_to_tsvector('english', jsonb_path_query_array(blocks, 'strict $.**.text'), '["string"]')
  @@ to_tsquery('english', 'labore & perferendis');
