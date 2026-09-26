import { existsSync, mkdtempSync, readFileSync, rmSync } from 'fs';
import os from 'os';
import path from 'path';
import {
  buildChangelogFolderName,
  createChangelogFile,
  slugifyChangelogName,
} from './create-changelog';
import { CHANGELOG_FOLDER_PATTERN } from './sync-changelogs';

describe('slugifyChangelogName', () => {
  it('turns a human title into a snake_case slug', () => {
    expect(slugifyChangelogName('New landing page block')).toBe(
      'new_landing_page_block'
    );
  });

  it('transliterates umlauts and strips accents', () => {
    expect(slugifyChangelogName('Änderung für die Bezahlübersicht')).toBe(
      'aenderung_fuer_die_bezahluebersicht'
    );
    expect(slugifyChangelogName('Résumé créé')).toBe('resume_cree');
    expect(slugifyChangelogName('Großes Update')).toBe('grosses_update');
  });

  it('collapses special characters and trims underscores', () => {
    expect(slugifyChangelogName('  Hello -- world!!  ')).toBe('hello_world');
    expect(slugifyChangelogName('v2.5: "Paywall" (beta)')).toBe(
      'v2_5_paywall_beta'
    );
  });

  it('throws when nothing usable remains', () => {
    expect(() => slugifyChangelogName('!!! ???')).toThrow(
      /cannot be turned into a changelog folder name/
    );
  });
});

describe('buildChangelogFolderName', () => {
  it('combines a UTC timestamp with the slug', () => {
    const folderName = buildChangelogFolderName(
      'New landing page block',
      new Date(Date.UTC(2026, 7, 25, 9, 5, 3))
    );

    expect(folderName).toBe('20260825090503_new_landing_page_block');
    expect(folderName).toMatch(CHANGELOG_FOLDER_PATTERN);
  });
});

describe('createChangelogFile', () => {
  let directory: string;

  beforeEach(() => {
    directory = mkdtempSync(path.join(os.tmpdir(), 'create-changelog-'));
  });

  afterEach(() => {
    rmSync(directory, { recursive: true, force: true });
  });

  it('creates a folder and template that the sync parser accepts', async () => {
    const { folderName, filePath, entry } = await createChangelogFile({
      directory,
      title: 'New landing page block',
      now: new Date(Date.UTC(2026, 7, 25, 9, 5, 3)),
    });

    expect(folderName).toBe('20260825090503_new_landing_page_block');
    expect(existsSync(filePath)).toBe(true);
    expect(entry).toMatchObject({
      name: folderName,
      title: 'New landing page block',
      actionRequired: false,
      releasedAt: new Date(Date.UTC(2026, 7, 25, 9, 5, 3)),
    });
    expect(entry.lead).toContain('TODO');
    expect(entry.description).toContain('TODO');
  });

  it('sets actionRequired in the template', async () => {
    const { entry } = await createChangelogFile({
      directory,
      title: 'Manual step needed',
      actionRequired: true,
      now: new Date(Date.UTC(2026, 7, 25, 9, 5, 3)),
    });

    expect(entry.actionRequired).toBe(true);
  });

  it('normalizes whitespace in the title', async () => {
    const { entry, filePath } = await createChangelogFile({
      directory,
      title: '  Spaced \n out   title ',
      now: new Date(Date.UTC(2026, 7, 25, 9, 5, 3)),
    });

    expect(entry.title).toBe('Spaced out title');
    expect(readFileSync(filePath, 'utf-8')).toContain(
      'title: Spaced out title'
    );
  });

  it('throws when the title is empty', async () => {
    await expect(
      createChangelogFile({ directory, title: '   ' })
    ).rejects.toThrow(/title for the changelog entry is required/);
  });

  it('throws when the folder already exists', async () => {
    const now = new Date(Date.UTC(2026, 7, 25, 9, 5, 3));
    await createChangelogFile({ directory, title: 'Same name', now });

    await expect(
      createChangelogFile({ directory, title: 'Same name', now })
    ).rejects.toThrow(/already exists/);
  });
});
