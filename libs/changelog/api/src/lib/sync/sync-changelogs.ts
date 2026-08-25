import { promises as fs } from 'fs';
import path from 'path';
import {
  inlineChangelogImages,
  parseChangelogMarkdown,
} from './parse-changelog-markdown';

export const CHANGELOG_FILE_NAME = 'changelog.md';
export const CHANGELOG_FOLDER_PATTERN = /^(\d{14})_[a-z0-9_]+$/;

export type ChangelogEntryData = {
  name: string;
  releasedAt: Date;
  title: string;
  lead: string;
  description: string | null;
  actionRequired: boolean;
};

type ExistingChangelogEntry = ChangelogEntryData & { id: string };

type ExistingChangelogEntrySelect = {
  id: true;
  name: true;
  releasedAt: true;
  title: true;
  lead: true;
  description: true;
  actionRequired: true;
};

export type ChangelogSyncClient = {
  changelogEntry: {
    findMany(args: {
      select: ExistingChangelogEntrySelect;
    }): Promise<ExistingChangelogEntry[]>;
    create(args: { data: ChangelogEntryData }): Promise<unknown>;
    update(args: {
      where: { id: string };
      data: Omit<ChangelogEntryData, 'name' | 'releasedAt'>;
    }): Promise<unknown>;
  };
};

export type ChangelogSyncResult = {
  created: string[];
  updated: string[];
  unchanged: string[];
  errors: { name: string; error: Error }[];
};

export function parseChangelogFolderTimestamp(folderName: string): Date {
  const match = folderName.match(CHANGELOG_FOLDER_PATTERN);

  if (!match) {
    throw new Error(
      `Changelog folder "${folderName}" does not match the required naming <YYYYMMDDHHMMSS>_<snake_case_name>`
    );
  }

  const timestamp = match[1];
  const year = Number(timestamp.slice(0, 4));
  const month = Number(timestamp.slice(4, 6));
  const day = Number(timestamp.slice(6, 8));
  const hours = Number(timestamp.slice(8, 10));
  const minutes = Number(timestamp.slice(10, 12));
  const seconds = Number(timestamp.slice(12, 14));

  const date = new Date(
    Date.UTC(year, month - 1, day, hours, minutes, seconds)
  );

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day ||
    date.getUTCHours() !== hours ||
    date.getUTCMinutes() !== minutes ||
    date.getUTCSeconds() !== seconds
  ) {
    throw new Error(
      `Changelog folder "${folderName}" contains an invalid timestamp "${timestamp}"`
    );
  }

  return date;
}

export async function readChangelogEntry(
  directory: string,
  folderName: string
): Promise<ChangelogEntryData> {
  const releasedAt = parseChangelogFolderTimestamp(folderName);
  const folderPath = path.join(directory, folderName);
  const filePath = path.join(folderPath, CHANGELOG_FILE_NAME);

  let markdown: string;

  try {
    markdown = await fs.readFile(filePath, 'utf-8');
  } catch {
    throw new Error(
      `Changelog folder "${folderName}" does not contain a readable ${CHANGELOG_FILE_NAME}`
    );
  }

  const parsed = parseChangelogMarkdown(markdown);

  return {
    name: folderName,
    releasedAt,
    title: parsed.title,
    lead: parsed.lead,
    description:
      parsed.description ?
        inlineChangelogImages(parsed.description, folderPath)
      : null,
    actionRequired: parsed.actionRequired,
  };
}

const hasContentChanged = (
  existing: ExistingChangelogEntry,
  entry: ChangelogEntryData
): boolean =>
  existing.title !== entry.title ||
  existing.lead !== entry.lead ||
  existing.description !== entry.description ||
  existing.actionRequired !== entry.actionRequired;

// Inserts every changelog folder that is not in the database yet (keyed by the
// unique folder name), so branches can be merged and deployed in any order
// without losing entries. Content updates never touch an existing confirmation.
export async function syncChangelogs(
  prisma: ChangelogSyncClient,
  directory: string
): Promise<ChangelogSyncResult> {
  const result: ChangelogSyncResult = {
    created: [],
    updated: [],
    unchanged: [],
    errors: [],
  };

  const dirents = await fs.readdir(directory, { withFileTypes: true });
  const folderNames = dirents
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name)
    .sort();

  const existingEntries = await prisma.changelogEntry.findMany({
    select: {
      id: true,
      name: true,
      releasedAt: true,
      title: true,
      lead: true,
      description: true,
      actionRequired: true,
    },
  });
  const existingByName = new Map(
    existingEntries.map(entry => [entry.name, entry])
  );

  for (const folderName of folderNames) {
    try {
      const entry = await readChangelogEntry(directory, folderName);
      const existing = existingByName.get(folderName);

      if (!existing) {
        await prisma.changelogEntry.create({ data: entry });
        result.created.push(folderName);
      } else if (hasContentChanged(existing, entry)) {
        await prisma.changelogEntry.update({
          where: { id: existing.id },
          data: {
            title: entry.title,
            lead: entry.lead,
            description: entry.description,
            actionRequired: entry.actionRequired,
          },
        });
        result.updated.push(folderName);
      } else {
        result.unchanged.push(folderName);
      }
    } catch (error) {
      result.errors.push({
        name: folderName,
        error: error instanceof Error ? error : new Error(String(error)),
      });
    }
  }

  return result;
}
