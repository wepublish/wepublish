import { readdirSync } from 'fs';
import path from 'path';
import { TODO_MARKER } from './create-changelog';
import { readChangelogEntry } from './sync-changelogs';

// Validates the real changelog entries in libs/api/changelogs so a malformed
// entry fails CI instead of the production migration job.
describe('repository changelogs', () => {
  const changelogsDirectory = path.join(
    __dirname,
    '../../../../..',
    'api/changelogs'
  );

  const folderNames = readdirSync(changelogsDirectory, {
    withFileTypes: true,
  })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  it('contains at least one entry', () => {
    expect(folderNames.length).toBeGreaterThan(0);
  });

  it('every entry is valid and syncable', async () => {
    for (const folderName of folderNames) {
      await expect(
        readChangelogEntry(changelogsDirectory, folderName)
      ).resolves.toMatchObject({
        name: folderName,
        title: expect.any(String),
        lead: expect.any(String),
        actionRequired: expect.any(Boolean),
        releasedAt: expect.any(Date),
      });
    }
  });

  it('no entry still contains template TODO placeholders', async () => {
    const offenders: string[] = [];

    for (const folderName of folderNames) {
      const entry = await readChangelogEntry(changelogsDirectory, folderName);
      const texts = [entry.title, entry.lead, entry.description ?? ''];

      if (texts.some(text => text.includes(TODO_MARKER))) {
        offenders.push(folderName);
      }
    }

    expect(offenders).toEqual([]);
  });
});
