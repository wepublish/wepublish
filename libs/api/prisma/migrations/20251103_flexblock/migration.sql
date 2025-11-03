-- AlterEnum
ALTER TYPE "BlockType" ADD VALUE 'flexBlock';

-- COMMIT;

-- INSERT INTO "block-content.styles" ("id","createdAt","modifiedAt","name","blocks") VALUES (gen_random_uuid(), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'Alternating', ARRAY ['flexBlock']::"BlockType"[]) ON CONFLICT ("name") DO UPDATE set "blocks" = excluded."blocks"
