UPDATE "block-content.styles"
    SET "blocks" = ARRAY ['teaserList', 'teaserSlots']::"BlockType"[]
    WHERE "name" = 'Focus';
UPDATE "block-content.styles"
    SET "blocks" = ARRAY ['teaserList', 'teaserGrid6', 'teaserSlots', 'imageGallery']::"BlockType"[]
    WHERE "name" = 'Slider';