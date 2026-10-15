-- Converts migrated `author=<id>` HTML shortcode blocks into real Author blocks.
--
-- The BKa import encoded author references on /info (and elsewhere) as HTML
-- blocks whose body is literally `author=<authorId>`, which renders as raw text.
-- Now that an Author block exists, those become first-class blocks the editor
-- can edit and the website can style.
--
-- Only rewrites shortcodes whose id resolves to an existing author, so a typo
-- in the migrated content is left untouched rather than turned into a dangling
-- reference. Idempotent: already-converted blocks no longer match.

BEGIN;

UPDATE "pages.revisions" pr
SET blocks = converted.blocks
FROM (
  SELECT
    pr2.id,
    jsonb_agg(
      CASE
        WHEN b->>'type' = 'html'
         AND b->>'html' ~ '^author=[a-z0-9]+$'
         AND EXISTS (
           SELECT 1 FROM authors a
           WHERE a.id = substring(b->>'html' from '^author=(.+)$')
         )
        THEN jsonb_build_object(
          'type', 'author',
          'authorId', substring(b->>'html' from '^author=(.+)$'),
          'blockStyle', b->'blockStyle',
          'disabled', b->'disabled'
        )
        ELSE b
      END
      ORDER BY idx
    ) AS blocks
  FROM "pages.revisions" pr2, jsonb_array_elements(pr2.blocks) WITH ORDINALITY AS t(b, idx)
  WHERE pr2.blocks::text ~ '"author=[a-z0-9]+"'
  GROUP BY pr2.id
) AS converted
WHERE pr.id = converted.id;

COMMIT;
