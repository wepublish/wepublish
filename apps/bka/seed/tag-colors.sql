-- Local dev seed: BKa tag colours
-- Harvested from the live site (bka.ch magazin + agenda + home, 2026-10-01).
-- BKa reuses an 8-colour palette across tag families.
--
-- The tags marked INFERRED below never appeared on a rendered page during
-- harvesting, so their colour is a judgement call based on the family the tag
-- obviously belongs to. Swap them if the real values turn up.

BEGIN;

UPDATE tags SET color = v.color FROM (VALUES
  -- exact, observed on the live site
  ('Bühne',                      '#E53429'),
  ('Clubbing',                   '#E53429'),
  ('Film',                       '#1961AC'),
  ('Theater',                    '#1961AC'),
  ('Führung',                    '#1961AC'),
  ('Musik',                      '#AFD3AA'),
  ('Kleintheater',               '#AFD3AA'),
  ('Jazz/Blues',                 '#F29EB7'),
  ('Ausstellungen & Kulturerbe', '#F29EB7'),
  ('Oper',                       '#F29EB7'),
  ('Pop/Rock',                   '#2A4033'),
  ('Performance',                '#2A4033'),
  ('Begegnungen',                '#2A4033'),
  ('Experimental',               '#A9C5E8'),
  ('Im Gespräch',                '#A9C5E8'),
  ('Tanz',                       '#2BAC6C'),
  ('Literatur',                  '#2BAC6C'),
  ('Klassik',                    '#2BAC6C'),
  ('Diverses',                   '#2BAC6C'),
  ('Kunst',                      '#AB9200'),
  ('Spoken Word',                '#AB9200'),
  ('Workshop',                   '#AB9200'),
  -- INFERRED — not observed, assigned by tag family
  ('Kino',                       '#1961AC'),
  ('Kabarett',                   '#E53429'),
  ('Ausstellung',                '#F29EB7'),
  ('Museum',                     '#F29EB7'),
  ('Familie',                    '#2BAC6C'),
  ('Off the Record',             '#A9C5E8')
) AS v(tag, color)
WHERE tags.tag = v.tag;

COMMIT;
