INSERT INTO "block-content.styles" (
    "id",
    "createdAt",
    "modifiedAt",
    "name",
    "blocks"
)
VALUES
    (gen_random_uuid(), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'Banner', ARRAY ['linkPageBreak']::"BlockType"[]),
    (gen_random_uuid(), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'ContextBox', ARRAY ['linkPageBreak']::"BlockType"[]),
    (gen_random_uuid(), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'Focus', ARRAY ['teaserList']::"BlockType"[]),
    (gen_random_uuid(), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'Slider', ARRAY ['teaserList', 'teaserGrid6', 'imageGallery']::"BlockType"[])
ON CONFLICT ("name") DO UPDATE
	set "blocks" = excluded."blocks"