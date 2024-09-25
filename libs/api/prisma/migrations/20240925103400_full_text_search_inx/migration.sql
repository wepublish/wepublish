-- Recreate Idexes
DROP INDEX "articles.revisions_jsonb_to_tsvector_idx";
CREATE INDEX idx_article_revisions_tsvector
    ON "articles.revisions" USING GIN (
                                              (to_tsvector('english', title) || to_tsvector('english', lead))
        );
