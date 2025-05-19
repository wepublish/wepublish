INSERT INTO "block-content.styles" (
    "id",
    "createdAt",
    "modifiedAt",
    "name",
    "blocks"
)
VALUES
    (gen_random_uuid(), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'Alternating', ARRAY ['teaserList', 'teaserGrid6']::"BlockType"[])
ON CONFLICT ("name") DO UPDATE
	set "blocks" = excluded."blocks"