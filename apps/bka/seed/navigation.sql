-- Local dev seed: BKa navigations
-- Mirrors the sidebar on https://www.bka.ch/ (captured 2026-10-01).
-- Idempotent: deletes the three navigations by key, then re-inserts.
-- Links cascade-delete via navigations.links_navigationId_fkey.

BEGIN;

DELETE FROM navigations WHERE key IN ('main', 'action', 'secondary', 'social');

INSERT INTO navigations (id, key, name, "createdAt", "modifiedAt") VALUES
  ('bka-nav-1-main',      'main',      'Hauptnavigation', NOW(), NOW()),
  ('bka-nav-2-action',    'action',    'Aktion',          NOW(), NOW()),
  ('bka-nav-3-secondary', 'secondary', 'Services',        NOW(), NOW()),
  ('bka-nav-4-social',    'social',    'Social Media',    NOW(), NOW());

-- Main navigation. Pages that exist in the dump are linked as `page` links so
-- the PageNavigationLink resolution path is exercised; the rest are `external`
-- links with relative URLs (those pages do not exist locally yet).
INSERT INTO "navigations.links"
  (id, label, type, url, "pageID", "navigationId", "createdAt", "modifiedAt")
VALUES
  ('bka-lnk-1-01', 'Magazin',    'external', '/magazin',       NULL,                        'bka-nav-1-main', NOW(), NOW()),
  ('bka-lnk-1-02', 'Agenda',     'external', '/agenda',        NULL,                        'bka-nav-1-main', NOW(), NOW()),
  ('bka-lnk-1-03', 'BKa on Air', 'page',     NULL,             'cmsyfr5cf25yt01lxkonbx0im', 'bka-nav-1-main', NOW(), NOW()),
  ('bka-lnk-1-04', 'Wer & Wo',   'external', '/organizations', NULL,                        'bka-nav-1-main', NOW(), NOW()),
  ('bka-lnk-1-05', 'Service',    'page',     NULL,             'cmlhv4e9d004ana07o3ixwhao', 'bka-nav-1-main', NOW(), NOW()),
  ('bka-lnk-1-06', 'Über uns',   'page',     NULL,             'cmlpggx7p003fo607cb9fbxpi', 'bka-nav-1-main', NOW(), NOW());

INSERT INTO "navigations.links"
  (id, label, type, url, "navigationId", "createdAt", "modifiedAt")
VALUES
  ('bka-lnk-2-01', 'Veranstaltung als Gast erfassen', 'external', '/propose-an-event',  'bka-nav-2-action',    NOW(), NOW()),
  ('bka-lnk-3-01', 'Newsletter abonnieren',           'external', '/newsletter-signup', 'bka-nav-3-secondary', NOW(), NOW()),
  ('bka-lnk-3-02', 'Archiv Printausgabe',             'external', '/archiv',            'bka-nav-3-secondary', NOW(), NOW());

INSERT INTO "navigations.links"
  (id, label, type, url, "navigationId", "createdAt", "modifiedAt")
VALUES
  ('bka-lnk-4-01', 'Instagram', 'external', 'https://www.instagram.com/bernerkulturagenda/',                       'bka-nav-4-social', NOW(), NOW()),
  ('bka-lnk-4-02', 'Facebook',  'external', 'https://www.facebook.com/people/Berner-Kulturagenda/100063983086454/', 'bka-nav-4-social', NOW(), NOW());

COMMIT;
