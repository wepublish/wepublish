import { promises as fs } from 'fs';
import path from 'path';
import {
  inlineChangelogImages,
  parseChangelogMarkdown,
} from './parse-changelog-markdown';

export const CHANGELOG_FILE_NAME = 'changelog.md';
export const CHANGELOG_FOLDER_PATTERN = /^(\d{14})_[a-z0-9_]+$/;
export const CHANGELOG_LOCALES = ['de', 'en', 'fr'] as const;

export type ChangelogLocale = (typeof CHANGELOG_LOCALES)[number];

export const isChangelogLocale = (value: string): value is ChangelogLocale =>
  (CHANGELOG_LOCALES as readonly string[]).includes(value);

const TRANSLATION_FILE_PATTERN = /^changelog\.([a-z]{2,5})\.md$/;

export type ChangelogTranslationData = {
  locale: ChangelogLocale;
  title: string;
  lead: string;
  description: string | null;
};

export type ChangelogEntryData = {
  name: string;
  releasedAt: Date;
  title: string;
  lead: string;
  description: string | null;
  actionRequired: boolean;
  translations: ChangelogTranslationData[];
};

type ExistingChangelogEntry = Omit<ChangelogEntryData, 'translations'> & {
  id: string;
  translations: ChangelogTranslationData[];
};

type ExistingChangelogEntrySelect = {
  id: true;
  name: true;
  releasedAt: true;
  title: true;
  lead: true;
  description: true;
  actionRequired: true;
  translations: {
    select: {
      locale: true;
      title: true;
      lead: true;
      description: true;
    };
  };
};

type ChangelogEntryCreateData = Omit<ChangelogEntryData, 'translations'> & {
  translations: {
    createMany: { data: ChangelogTranslationData[] };
  };
};

type ChangelogEntryUpdateData = Omit<
  ChangelogEntryData,
  'name' | 'releasedAt' | 'translations'
> & {
  translations: {
    deleteMany: Record<string, never>;
    createMany: { data: ChangelogTranslationData[] };
  };
};

export type ChangelogSyncClient = {
  changelogEntry: {
    findMany(args: {
      select: ExistingChangelogEntrySelect;
    }): Promise<ExistingChangelogEntry[]>;
    create(args: { data: ChangelogEntryCreateData }): Promise<unknown>;
    update(args: {
      where: { id: string };
      data: ChangelogEntryUpdateData;
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

async function readChangelogFile(folderPath: string, fileName: string) {
  let markdown: string;

  try {
    markdown = await fs.readFile(path.join(folderPath, fileName), 'utf-8');
  } catch {
    throw new Error(`"${fileName}" is not readable`);
  }

  const parsed = parseChangelogMarkdown(markdown);

  return {
    ...parsed,
    description:
      parsed.description ?
        inlineChangelogImages(parsed.description, folderPath)
      : null,
  };
}

// The base changelog.md is the fallback content; changelog.<locale>.md files
// translate title, lead and description. actionRequired always comes from the
// base file.
async function readChangelogTranslations(
  folderPath: string
): Promise<ChangelogTranslationData[]> {
  const dirents = await fs.readdir(folderPath, { withFileTypes: true });
  const translations: ChangelogTranslationData[] = [];

  for (const dirent of dirents) {
    const match = dirent.name.match(TRANSLATION_FILE_PATTERN);

    if (!dirent.isFile() || !match) {
      continue;
    }

    const locale = match[1];

    if (!isChangelogLocale(locale)) {
      throw new Error(
        `"${dirent.name}" has an unsupported locale "${locale}". Supported: ${CHANGELOG_LOCALES.join(', ')}`
      );
    }

    const parsed = await readChangelogFile(folderPath, dirent.name);

    translations.push({
      locale,
      title: parsed.title,
      lead: parsed.lead,
      description: parsed.description,
    });
  }

  return translations.sort((a, b) => a.locale.localeCompare(b.locale));
}

export async function readChangelogEntry(
  directory: string,
  folderName: string
): Promise<ChangelogEntryData> {
  const releasedAt = parseChangelogFolderTimestamp(folderName);
  const folderPath = path.join(directory, folderName);

  let base: Awaited<ReturnType<typeof readChangelogFile>>;

  try {
    base = await readChangelogFile(folderPath, CHANGELOG_FILE_NAME);
  } catch (error) {
    throw new Error(
      `Changelog folder "${folderName}" does not contain a readable ${CHANGELOG_FILE_NAME}: ${
        error instanceof Error ? error.message : error
      }`
    );
  }

  const translations = await readChangelogTranslations(folderPath);

  return {
    name: folderName,
    releasedAt,
    title: base.title,
    lead: base.lead,
    description: base.description,
    actionRequired: base.actionRequired,
    translations,
  };
}

const serializeTranslations = (translations: ChangelogTranslationData[]) =>
  JSON.stringify(
    [...translations]
      .sort((a, b) => a.locale.localeCompare(b.locale))
      .map(({ locale, title, lead, description }) => ({
        locale,
        title,
        lead,
        description,
      }))
  );

const hasContentChanged = (
  existing: ExistingChangelogEntry,
  entry: ChangelogEntryData
): boolean =>
  existing.title !== entry.title ||
  existing.lead !== entry.lead ||
  existing.description !== entry.description ||
  existing.actionRequired !== entry.actionRequired ||
  serializeTranslations(existing.translations) !==
    serializeTranslations(entry.translations);

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
      translations: {
        select: {
          locale: true,
          title: true,
          lead: true,
          description: true,
        },
      },
    },
  });
  const existingByName = new Map(
    existingEntries.map(entry => [entry.name, entry])
  );

  for (const folderName of folderNames) {
    try {
      const { translations, ...entry } = await readChangelogEntry(
        directory,
        folderName
      );
      const existing = existingByName.get(folderName);

      if (!existing) {
        await prisma.changelogEntry.create({
          data: {
            ...entry,
            translations: {
              createMany: { data: translations },
            },
          },
        });
        result.created.push(folderName);
      } else if (hasContentChanged(existing, { ...entry, translations })) {
        await prisma.changelogEntry.update({
          where: { id: existing.id },
          data: {
            title: entry.title,
            lead: entry.lead,
            description: entry.description,
            actionRequired: entry.actionRequired,
            translations: {
              deleteMany: {},
              createMany: { data: translations },
            },
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
