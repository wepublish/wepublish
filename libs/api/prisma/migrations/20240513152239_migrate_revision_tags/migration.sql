-- Migrate Articles
INSERT INTO "tags" (id, tag, type, "modifiedAt")
SELECT DISTINCT ON (tag)
	gen_random_uuid() as id,
	unnest(r.tags) AS tag,
	'article'::"TagType" AS type,
	CURRENT_TIMESTAMP as modifiedAt
FROM "articles.revisions" r;

INSERT INTO "articles.tagged-articles" ("articleId", "tagId", "modifiedAt")
SELECT a.id as "articleId", t."id" as "tagId", CURRENT_TIMESTAMP as "modifiedAt"
FROM "articles.revisions" r
INNER JOIN "articles" a ON a."pendingId" = r.id OR a."publishedId" = r.id OR a."draftId" = r.id
CROSS JOIN LATERAL UNNEST(r.tags) AS unnested("tag")
JOIN "tags" t ON t.tag = unnested."tag" AND type = 'article'::"TagType"
ON CONFLICT DO NOTHING;


-- Migrate Pages
INSERT INTO "tags" (id, tag, type, "modifiedAt")
SELECT DISTINCT ON (tag)
	gen_random_uuid() as id,
	unnest(r.tags) AS tag,
	'page'::"TagType" AS type,
	CURRENT_TIMESTAMP as modifiedAt
FROM "pages.revisions" r;

INSERT INTO "pages.tagged-pages" ("pageId", "tagId", "modifiedAt")
SELECT p.id as "pageId", t."id" as "tagId", CURRENT_TIMESTAMP as "modifiedAt"
FROM "pages.revisions" r
INNER JOIN "pages" p ON p."pendingId" = r.id OR p."publishedId" = r.id OR p."draftId" = r.id
CROSS JOIN LATERAL UNNEST(r.tags) AS unnested("tag")
JOIN "tags" t ON t.tag = unnested."tag" AND type = 'page'::"TagType"
ON CONFLICT DO NOTHING;