import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs';
import os from 'os';
import path from 'path';
import {
  parseChangelogFolderTimestamp,
  readChangelogEntry,
  syncChangelogs,
} from './sync-changelogs';

const writeEntry = (
  directory: string,
  folderName: string,
  markdown: string
) => {
  mkdirSync(path.join(directory, folderName), { recursive: true });
  writeFileSync(path.join(directory, folderName, 'changelog.md'), markdown);
};

const validMarkdown = (title: string, actionRequired = false) =>
  [
    '---',
    `title: ${title}`,
    'lead: A lead',
    `actionRequired: ${actionRequired}`,
    '---',
    '',
    'A description',
  ].join('\n');

const createMockClient = () => ({
  changelogEntry: {
    findMany: jest.fn().mockResolvedValue([]),
    create: jest.fn().mockResolvedValue({}),
    update: jest.fn().mockResolvedValue({}),
  },
});

describe('parseChangelogFolderTimestamp', () => {
  it('parses the folder timestamp as UTC', () => {
    expect(
      parseChangelogFolderTimestamp('20260825120000_user_changelog')
    ).toEqual(new Date(Date.UTC(2026, 7, 25, 12, 0, 0)));
  });

  it('throws on invalid folder names', () => {
    expect(() => parseChangelogFolderTimestamp('not_a_changelog')).toThrow(
      /does not match the required naming/
    );
    expect(() =>
      parseChangelogFolderTimestamp('2026082512000_too_short')
    ).toThrow(/does not match the required naming/);
    expect(() =>
      parseChangelogFolderTimestamp('20260825120000_Uppercase')
    ).toThrow(/does not match the required naming/);
  });

  it('throws on impossible dates', () => {
    expect(() =>
      parseChangelogFolderTimestamp('20261325120000_invalid_month')
    ).toThrow(/invalid timestamp/);
  });
});

describe('syncChangelogs', () => {
  let directory: string;

  beforeEach(() => {
    directory = mkdtempSync(path.join(os.tmpdir(), 'changelogs-'));
  });

  afterEach(() => {
    rmSync(directory, { recursive: true, force: true });
  });

  it('creates entries that are not in the database yet', async () => {
    writeEntry(directory, '20260101120000_first', validMarkdown('First'));
    writeEntry(
      directory,
      '20260202120000_second',
      validMarkdown('Second', true)
    );

    const client = createMockClient();
    const result = await syncChangelogs(client, directory);

    expect(result.created).toEqual([
      '20260101120000_first',
      '20260202120000_second',
    ]);
    expect(result.errors).toEqual([]);
    expect(client.changelogEntry.create).toHaveBeenCalledTimes(2);
    expect(client.changelogEntry.create).toHaveBeenCalledWith({
      data: {
        name: '20260101120000_first',
        releasedAt: new Date(Date.UTC(2026, 0, 1, 12, 0, 0)),
        title: 'First',
        lead: 'A lead',
        description: 'A description',
        actionRequired: false,
        translations: {
          createMany: { data: [] },
        },
      },
    });
    expect(client.changelogEntry.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: '20260202120000_second',
        actionRequired: true,
      }),
    });
  });

  it('ignores files at the top level of the changelogs folder', async () => {
    writeFileSync(path.join(directory, 'README.md'), '# readme');
    writeEntry(directory, '20260101120000_first', validMarkdown('First'));

    const client = createMockClient();
    const result = await syncChangelogs(client, directory);

    expect(result.created).toEqual(['20260101120000_first']);
    expect(result.errors).toEqual([]);
  });

  it('leaves entries with unchanged content untouched', async () => {
    writeEntry(directory, '20260101120000_first', validMarkdown('First'));

    const client = createMockClient();
    client.changelogEntry.findMany.mockResolvedValue([
      {
        id: 'entry-1',
        name: '20260101120000_first',
        releasedAt: new Date(Date.UTC(2026, 0, 1, 12, 0, 0)),
        title: 'First',
        lead: 'A lead',
        description: 'A description',
        actionRequired: false,
        translations: [],
      },
    ]);

    const result = await syncChangelogs(client, directory);

    expect(result.unchanged).toEqual(['20260101120000_first']);
    expect(client.changelogEntry.create).not.toHaveBeenCalled();
    expect(client.changelogEntry.update).not.toHaveBeenCalled();
  });

  it('updates changed content without touching the confirmation', async () => {
    writeEntry(
      directory,
      '20260101120000_first',
      validMarkdown('Fixed title', true)
    );

    const client = createMockClient();
    client.changelogEntry.findMany.mockResolvedValue([
      {
        id: 'entry-1',
        name: '20260101120000_first',
        releasedAt: new Date(Date.UTC(2026, 0, 1, 12, 0, 0)),
        title: 'Old title',
        lead: 'A lead',
        description: 'A description',
        actionRequired: true,
        translations: [],
      },
    ]);

    const result = await syncChangelogs(client, directory);

    expect(result.updated).toEqual(['20260101120000_first']);
    expect(client.changelogEntry.update).toHaveBeenCalledTimes(1);

    const updateArgs = client.changelogEntry.update.mock.calls[0][0];
    expect(updateArgs.where).toEqual({ id: 'entry-1' });
    expect(updateArgs.data).toEqual({
      title: 'Fixed title',
      lead: 'A lead',
      description: 'A description',
      actionRequired: true,
      translations: {
        deleteMany: {},
        createMany: { data: [] },
      },
    });
    expect(updateArgs.data).not.toHaveProperty('confirmedAt');
    expect(updateArgs.data).not.toHaveProperty('confirmedByUserId');
  });

  it('collects errors per entry and keeps syncing the others', async () => {
    writeEntry(directory, '20260101120000_valid', validMarkdown('Valid'));
    writeEntry(directory, '20260202120000_invalid', '# no frontmatter at all');
    mkdirSync(path.join(directory, '20260303120000_empty'));
    mkdirSync(path.join(directory, 'badly_named_folder'));

    const client = createMockClient();
    const result = await syncChangelogs(client, directory);

    expect(result.created).toEqual(['20260101120000_valid']);
    expect(result.errors.map(({ name }) => name)).toEqual([
      '20260202120000_invalid',
      '20260303120000_empty',
      'badly_named_folder',
    ]);
    expect(client.changelogEntry.create).toHaveBeenCalledTimes(1);
  });

  it('inlines local images into the stored description', async () => {
    const folderName = '20260101120000_with_image';
    writeEntry(
      directory,
      folderName,
      [
        '---',
        'title: With image',
        'lead: A lead',
        '---',
        '',
        '![Screenshot](./screenshot.png)',
      ].join('\n')
    );
    writeFileSync(
      path.join(directory, folderName, 'screenshot.png'),
      Buffer.from('fake-png')
    );

    const client = createMockClient();
    await syncChangelogs(client, directory);

    const createArgs = client.changelogEntry.create.mock.calls[0][0];
    expect(createArgs.data.description).toBe(
      `![Screenshot](data:image/png;base64,${Buffer.from('fake-png').toString('base64')})`
    );
  });
});

describe('syncChangelogs translations', () => {
  let directory: string;

  beforeEach(() => {
    directory = mkdtempSync(path.join(os.tmpdir(), 'changelogs-'));
  });

  afterEach(() => {
    rmSync(directory, { recursive: true, force: true });
  });

  const germanMarkdown = [
    '---',
    'title: Erster Eintrag',
    'lead: Ein Lead auf Deutsch',
    '---',
    '',
    'Eine Beschreibung',
  ].join('\n');

  it('creates entries with their translations', async () => {
    writeEntry(directory, '20260101120000_first', validMarkdown('First'));
    writeFileSync(
      path.join(directory, '20260101120000_first', 'changelog.de.md'),
      germanMarkdown
    );

    const client = createMockClient();
    const result = await syncChangelogs(client, directory);

    expect(result.created).toEqual(['20260101120000_first']);
    expect(client.changelogEntry.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        title: 'First',
        translations: {
          createMany: {
            data: [
              {
                locale: 'de',
                title: 'Erster Eintrag',
                lead: 'Ein Lead auf Deutsch',
                description: 'Eine Beschreibung',
              },
            ],
          },
        },
      }),
    });
  });

  it('updates an entry when only a translation changed', async () => {
    writeEntry(directory, '20260101120000_first', validMarkdown('First'));
    writeFileSync(
      path.join(directory, '20260101120000_first', 'changelog.de.md'),
      germanMarkdown
    );

    const client = createMockClient();
    client.changelogEntry.findMany.mockResolvedValue([
      {
        id: 'entry-1',
        name: '20260101120000_first',
        releasedAt: new Date(Date.UTC(2026, 0, 1, 12, 0, 0)),
        title: 'First',
        lead: 'A lead',
        description: 'A description',
        actionRequired: false,
        translations: [
          {
            locale: 'de',
            title: 'Alter Titel',
            lead: 'Ein Lead auf Deutsch',
            description: 'Eine Beschreibung',
          },
        ],
      },
    ]);

    const result = await syncChangelogs(client, directory);

    expect(result.updated).toEqual(['20260101120000_first']);
    expect(client.changelogEntry.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          translations: {
            deleteMany: {},
            createMany: {
              data: [
                {
                  locale: 'de',
                  title: 'Erster Eintrag',
                  lead: 'Ein Lead auf Deutsch',
                  description: 'Eine Beschreibung',
                },
              ],
            },
          },
        }),
      })
    );
  });

  it('leaves entries untouched when base and translations are unchanged', async () => {
    writeEntry(directory, '20260101120000_first', validMarkdown('First'));
    writeFileSync(
      path.join(directory, '20260101120000_first', 'changelog.de.md'),
      germanMarkdown
    );

    const client = createMockClient();
    client.changelogEntry.findMany.mockResolvedValue([
      {
        id: 'entry-1',
        name: '20260101120000_first',
        releasedAt: new Date(Date.UTC(2026, 0, 1, 12, 0, 0)),
        title: 'First',
        lead: 'A lead',
        description: 'A description',
        actionRequired: false,
        translations: [
          {
            locale: 'de',
            title: 'Erster Eintrag',
            lead: 'Ein Lead auf Deutsch',
            description: 'Eine Beschreibung',
          },
        ],
      },
    ]);

    const result = await syncChangelogs(client, directory);

    expect(result.unchanged).toEqual(['20260101120000_first']);
    expect(client.changelogEntry.update).not.toHaveBeenCalled();
  });

  it('rejects translation files with unsupported locales', async () => {
    writeEntry(directory, '20260101120000_first', validMarkdown('First'));
    writeFileSync(
      path.join(directory, '20260101120000_first', 'changelog.es.md'),
      germanMarkdown
    );

    const client = createMockClient();
    const result = await syncChangelogs(client, directory);

    expect(result.errors.map(({ name }) => name)).toEqual([
      '20260101120000_first',
    ]);
    expect(result.errors[0].error.message).toMatch(/unsupported locale "es"/);
    expect(client.changelogEntry.create).not.toHaveBeenCalled();
  });
});

describe('readChangelogEntry', () => {
  let directory: string;

  beforeEach(() => {
    directory = mkdtempSync(path.join(os.tmpdir(), 'changelogs-'));
  });

  afterEach(() => {
    rmSync(directory, { recursive: true, force: true });
  });

  it('throws when the changelog.md is missing', async () => {
    mkdirSync(path.join(directory, '20260101120000_missing_file'));

    await expect(
      readChangelogEntry(directory, '20260101120000_missing_file')
    ).rejects.toThrow(/does not contain a readable changelog.md/);
  });
});
