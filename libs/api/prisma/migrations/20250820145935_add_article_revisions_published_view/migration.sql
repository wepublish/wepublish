CREATE VIEW "article.revisions.published" AS
    SELECT DISTINCT ON ("articleId")
        *
        FROM
        "articles.revisions"
        WHERE
        "publishedAt" IS NOT NULL AND "publishedAt" <= CURRENT_TIMESTAMP
    ORDER BY
    "articleId", "createdAt" DESC
;