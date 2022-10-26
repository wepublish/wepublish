ALTER TABLE articles ADD CONSTRAINT articles_no_null_on_revisions CHECK (num_nonnulls("publishedId","draftId","pendingId") >= 1);
ALTER TABLE pages ADD CONSTRAINT pages_no_null_on_revisions CHECK (num_nonnulls("publishedId","draftId","pendingId") >= 1);
