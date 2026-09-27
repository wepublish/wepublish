INSERT INTO "block-content.styles" (
    "id",
    "createdAt",
    "modifiedAt",
    "name",
    "blocks"
)
VALUES
    (gen_random_uuid(), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'Lightbox', ARRAY ['imageGallery']::"BlockType"[])
ON CONFLICT ("name") DO UPDATE
	set "blocks" = excluded."blocks";
