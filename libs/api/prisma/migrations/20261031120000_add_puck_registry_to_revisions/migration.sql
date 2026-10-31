-- AlterTable
ALTER TABLE "articles.revisions" ADD COLUMN     "puckRegistry" JSONB;

-- AlterTable
ALTER TABLE "pages.revisions" ADD COLUMN     "puckRegistry" JSONB;

-- Upgrade Puck blocks stored before the envelope had a kind
CREATE FUNCTION "puck_upgrade_blocks"(blocks jsonb) RETURNS jsonb
LANGUAGE plpgsql AS $$
DECLARE
  block jsonb;
  upgraded jsonb := '[]'::jsonb;
  next jsonb;
BEGIN
  FOR block IN
    SELECT entry.value
    FROM jsonb_array_elements(blocks) WITH ORDINALITY AS entry(value, position)
    ORDER BY entry.position
  LOOP
    IF jsonb_typeof(block) <> 'object' THEN
      upgraded := upgraded || jsonb_build_array(block);
      CONTINUE;
    END IF;

    next := (block - 'data' - 'slot' - 'children')
      || jsonb_build_object(
        'kind', 'puck',
        'props', coalesce(nullif(block -> 'data', 'null'::jsonb), '{}'::jsonb)
      );

    IF block ? 'slot' THEN
      next := next || jsonb_build_object('puckSlot', block -> 'slot');
    END IF;

    IF jsonb_typeof(next -> 'datasources' -> 'image') = 'object'
      AND coalesce(next -> 'datasources' -> 'image' ->> 'type', '') NOT IN ('single', 'multiple') THEN
      next := jsonb_set(next, '{datasources}', (next -> 'datasources') - 'image');
    END IF;

    IF jsonb_typeof(block -> 'children') = 'array' THEN
      next := next || jsonb_build_object('children', "puck_upgrade_blocks"(block -> 'children'));
    END IF;

    upgraded := upgraded || jsonb_build_array(next);
  END LOOP;

  RETURN upgraded;
END;
$$;

UPDATE "articles.revisions"
SET "puckBlocks" = "puck_upgrade_blocks"("puckBlocks")
WHERE jsonb_typeof("puckBlocks") = 'array'
  AND NOT EXISTS (
    SELECT 1 FROM jsonb_array_elements("puckBlocks") AS stored(block)
    WHERE jsonb_typeof(stored.block) = 'object' AND stored.block ? 'kind'
  );

UPDATE "pages.revisions"
SET "puckBlocks" = "puck_upgrade_blocks"("puckBlocks")
WHERE jsonb_typeof("puckBlocks") = 'array'
  AND NOT EXISTS (
    SELECT 1 FROM jsonb_array_elements("puckBlocks") AS stored(block)
    WHERE jsonb_typeof(stored.block) = 'object' AND stored.block ? 'kind'
  );

DROP FUNCTION "puck_upgrade_blocks"(jsonb);
