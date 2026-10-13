import { existsSync, mkdirSync, writeFileSync } from 'fs';
import path from 'path';
import {
  CHANGELOG_FILE_NAME,
  CHANGELOG_FOLDER_PATTERN,
  ChangelogEntryData,
  readChangelogEntry,
} from './sync-changelogs';

const CHARACTER_REPLACEMENTS: Record<string, string> = {
  ä: 'ae',
  ö: 'oe',
  ü: 'ue',
  ß: 'ss',
};

export function slugifyChangelogName(input: string): string {
  const slug = input
    .toLowerCase()
    .replace(/[äöüß]/g, character => CHARACTER_REPLACEMENTS[character])
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

  if (!slug) {
    throw new Error(
      `"${input}" cannot be turned into a changelog folder name (a-z, 0-9 and _ only)`
    );
  }

  return slug;
}

export function buildChangelogFolderName(title: string, now: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  const timestamp = [
    now.getUTCFullYear(),
    pad(now.getUTCMonth() + 1),
    pad(now.getUTCDate()),
    pad(now.getUTCHours()),
    pad(now.getUTCMinutes()),
    pad(now.getUTCSeconds()),
  ].join('');

  const folderName = `${timestamp}_${slugifyChangelogName(title)}`;

  if (!CHANGELOG_FOLDER_PATTERN.test(folderName)) {
    throw new Error(
      `Generated folder name "${folderName}" does not match the required naming <YYYYMMDDHHMMSS>_<snake_case_name>`
    );
  }

  return folderName;
}

export const TODO_MARKER = 'TODO';

const changelogTemplate = (title: string, actionRequired: boolean) => `---
title: ${title}
lead: ${TODO_MARKER} – Describe in one or two plain-language sentences what changes for the user.
actionRequired: ${actionRequired}
---

${TODO_MARKER} – Optional longer description in markdown (paragraphs, links, lists,
images). Delete this section if the lead says it all. See
libs/api/changelogs/README.md for how to add images and how to write for end
users.
`;

export type CreateChangelogOptions = {
  directory: string;
  title: string;
  actionRequired?: boolean;
  now?: Date;
};

export type CreatedChangelog = {
  folderName: string;
  folderPath: string;
  filePath: string;
  entry: ChangelogEntryData;
};

export async function createChangelogFile({
  directory,
  title,
  actionRequired = false,
  now = new Date(),
}: CreateChangelogOptions): Promise<CreatedChangelog> {
  const cleanTitle = title.replace(/\s+/g, ' ').trim();

  if (!cleanTitle) {
    throw new Error('A title for the changelog entry is required');
  }

  const folderName = buildChangelogFolderName(cleanTitle, now);
  const folderPath = path.join(directory, folderName);

  if (existsSync(folderPath)) {
    throw new Error(`Changelog folder "${folderName}" already exists`);
  }

  mkdirSync(folderPath, { recursive: true });

  const filePath = path.join(folderPath, CHANGELOG_FILE_NAME);
  writeFileSync(filePath, changelogTemplate(cleanTitle, actionRequired));

  // Round-trip through the exact parser the database sync uses, so a generated
  // entry is guaranteed to be insertable once its placeholders are filled in.
  const entry = await readChangelogEntry(directory, folderName);

  return { folderName, folderPath, filePath, entry };
}
