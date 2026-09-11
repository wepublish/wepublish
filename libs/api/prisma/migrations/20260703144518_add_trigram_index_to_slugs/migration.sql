-- This is an empty migration.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX "articles_slug_trgm_idx" ON "articles" USING gin ("slug" gin_trgm_ops);
CREATE INDEX "pages_slug_trgm_idx" ON "pages" USING gin ("slug" gin_trgm_ops);
