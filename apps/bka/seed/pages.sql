-- Local dev seed: BKa block styles + the Magazin page.
--
-- The old bka.ch had these pages hardcoded; here they become real CMS content.
-- The Magazin page holds the right-hand column ("Die Auswahl der Redaktion") as
-- a TeaserSlots block; the left-hand article list stays hardcoded in the page
-- component, but the same teaser rendering is exposed to editors through the
-- "Magazin" block style so it can be used anywhere.
--
-- Idempotent: removes the magazin page and the BKa block styles, then recreates.

BEGIN;

----------------------------------------------------------------------------
-- Block styles
----------------------------------------------------------------------------
DELETE FROM "block-content.styles" WHERE name IN ('Magazin', 'Empfehlung');

INSERT INTO "block-content.styles" (id, name, blocks, "createdAt", "modifiedAt")
VALUES
  -- Text-only teasers with coloured tag chips (the magazin list look).
  ('bka-style-magazin', 'Magazin',
   ARRAY['teaserSlots','teaserList','teaserGrid6']::"BlockType"[], NOW(), NOW()),
  -- Image teasers with the date/author caption overlay.
  ('bka-style-empfehlung', 'Empfehlung',
   ARRAY['teaserSlots','teaserList','teaserGrid6']::"BlockType"[], NOW(), NOW());

----------------------------------------------------------------------------
-- Magazin page
----------------------------------------------------------------------------
DELETE FROM pages WHERE slug = 'magazin';

INSERT INTO pages (id, slug, hidden, "publishedAt", "createdAt", "modifiedAt")
VALUES ('bka-page-magazin', 'magazin', false, NOW(), NOW(), NOW());

INSERT INTO "pages.revisions"
  (id, "pageId", title, description, "seoTitle", "seoDescription",
   blocks, properties, "publishedAt", "createdAt")
VALUES (
  'bka-page-magazin-rev-1',
  'bka-page-magazin',
  'Magazin',
  'Magazin der kulturellen Veranstaltungen im Kanton Bern',
  'Magazin',
  'Magazin der kulturellen Veranstaltungen im Kanton Bern',
  jsonb_build_array(
    jsonb_build_object(
      'type', 'title',
      'title', 'Magazin',
      'lead', 'Magazin der kulturellen Veranstaltungen im Kanton Bern',
      'blockStyle', NULL
    ),
    jsonb_build_object(
      'type', 'teaserSlots',
      'title', 'Die Auswahl der Redaktion',
      'blockStyle', 'bka-style-empfehlung',
      'autofillConfig', jsonb_build_object(
        'enabled', true,
        'teaserType', 'article',
        'filter', jsonb_build_object('tags', jsonb_build_array())
      ),
      'slots', jsonb_build_array(
        jsonb_build_object('type', 'Autofill'),
        jsonb_build_object('type', 'Autofill'),
        jsonb_build_object('type', 'Autofill'),
        jsonb_build_object('type', 'Autofill'),
        jsonb_build_object('type', 'Autofill'),
        jsonb_build_object('type', 'Autofill')
      )
    )
  ),
  '[]'::jsonb,
  NOW(),
  NOW()
);

COMMIT;
