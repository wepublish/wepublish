-- Recreate Idexes
DROP INDEX "articles.revisions_jsonb_to_tsvector_idx";
DROP INDEX "pages.revisions_jsonb_to_tsvector_idx";
CREATE INDEX idx_articles_revisions_tsvector
    ON public."articles.revisions" USING GIN (
                                              (
                                                  to_tsvector('german', title) ||
                                                  to_tsvector('german', lead)
                                                  )
        );
CREATE INDEX idx_pages_revisions_tsvector
    ON public."pages.revisions" USING GIN (
                                           (
                                               to_tsvector('german', title) ||
                                               jsonb_to_tsvector(
                                                       'german',
                                                       jsonb_path_query_array(blocks, 'strict $.**.text'),
                                                       '["string"]'
                                               )
                                               )
        );