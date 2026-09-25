import { TODO_MARKER } from './create-changelog';
import {
  addedChangelogFolders,
  validateChangelogEntry,
} from './check-changelog';
import { ChangelogEntryData } from './sync-changelogs';

const entry = (
  overrides: Partial<ChangelogEntryData> = {}
): ChangelogEntryData => ({
  name: '20260916080000_new_block',
  releasedAt: new Date('2026-09-16T08:00:00.000Z'),
  title: 'New landing page block',
  lead: 'Editors can now add a gallery block.',
  description: null,
  actionRequired: false,
  translations: [
    { locale: 'de', title: 'Titel', lead: 'Lead', description: null },
    { locale: 'fr', title: 'Titre', lead: 'Lead', description: null },
  ],
  ...overrides,
});

describe('addedChangelogFolders', () => {
  it('finds the folder a branch adds', () => {
    expect(
      addedChangelogFolders([
        'libs/api/changelogs/20260916080000_new_block/changelog.md',
        'libs/api/changelogs/20260916080000_new_block/changelog.de.md',
        'apps/editor/src/app/app.tsx',
      ])
    ).toEqual(['20260916080000_new_block']);
  });

  it('reports each folder once, however many files it holds', () => {
    expect(
      addedChangelogFolders([
        'libs/api/changelogs/20260916080000_a/changelog.md',
        'libs/api/changelogs/20260916080000_a/changelog.fr.md',
        'libs/api/changelogs/20260917090000_b/changelog.md',
      ])
    ).toEqual(['20260916080000_a', '20260917090000_b']);
  });

  it('ignores the README and anything not shaped like an entry', () => {
    expect(
      addedChangelogFolders([
        'libs/api/changelogs/README.md',
        'libs/api/changelogs/not-a-timestamp/changelog.md',
      ])
    ).toEqual([]);
  });

  it('ignores changes outside the changelog folder', () => {
    expect(
      addedChangelogFolders(['libs/api/prisma/schema.prisma', 'package.json'])
    ).toEqual([]);
  });
});

describe('validateChangelogEntry', () => {
  it('passes a filled-in entry', () => {
    expect(validateChangelogEntry(entry())).toEqual([]);
  });

  it('fails an entry that still carries the scaffolded placeholder', () => {
    const problems = validateChangelogEntry(
      entry({ lead: `${TODO_MARKER} – describe it` })
    );

    expect(problems).toHaveLength(1);
    expect(problems[0].warning).toBeUndefined();
    expect(problems[0].message).toMatch(/placeholder/i);
  });

  it('fails a placeholder left in a translation', () => {
    const problems = validateChangelogEntry(
      entry({
        translations: [
          {
            locale: 'de',
            title: 'Titel',
            lead: `${TODO_MARKER} – noch schreiben`,
            description: null,
          },
          { locale: 'fr', title: 'Titre', lead: 'Lead', description: null },
        ],
      })
    );

    expect(problems.map(problem => problem.warning)).toEqual([undefined]);
    expect(problems[0].message).toMatch(/de translation/);
  });

  it('fails an empty title or lead', () => {
    expect(validateChangelogEntry(entry({ title: '  ' }))).toHaveLength(1);
    expect(validateChangelogEntry(entry({ lead: '' }))).toHaveLength(1);
  });

  it('does not expect an en file — changelog.md is the English base', () => {
    expect(validateChangelogEntry(entry())).toEqual([]);
  });

  it('only warns about a missing translation', () => {
    const problems = validateChangelogEntry(
      entry({
        translations: [
          { locale: 'de', title: 'Titel', lead: 'Lead', description: null },
        ],
      })
    );

    expect(problems).toHaveLength(1);
    expect(problems[0].warning).toBe(true);
    expect(problems[0].message).toMatch(/fr/);
  });
});
