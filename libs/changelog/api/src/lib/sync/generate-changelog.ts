import { mkdirSync, writeFileSync } from 'fs';
import path from 'path';
import { buildChangelogFolderName } from './create-changelog';
import {
  CHANGELOG_FILE_NAME,
  ChangelogEntryData,
  isChangelogLocale,
  readChangelogEntry,
} from './sync-changelogs';

export const GENERATION_BASE_LOCALE = 'en';

export type GeneratedChangelogContent = {
  title: string;
  lead: string;
  description: string | null;
};

export type GeneratedChangelog = {
  slug: string;
  actionRequired: boolean;
  entries: Record<string, GeneratedChangelogContent>;
};

export type SkippedGeneration = {
  skip: true;
  reason: string;
};

export function buildGenerationPrompt(
  commitSubjects: string,
  diff: string
): string {
  return [
    'You generate a user-facing changelog entry for the We.Publish editor.',
    'The audience are newsroom editors and publishers, not developers: describe',
    'what changes for them in plain language, never the implementation.',
    '',
    'Analyze the following git changes and reply with ONLY a JSON object — no',
    'markdown fences, no commentary — in exactly this shape:',
    '',
    '{',
    '  "slug": "short_snake_case_name",',
    '  "actionRequired": false,',
    '  "entries": {',
    '    "en": { "title": "...", "lead": "...", "description": "... or null" },',
    '    "de": { "title": "...", "lead": "...", "description": "... or null" },',
    '    "fr": { "title": "...", "lead": "...", "description": "... or null" }',
    '  }',
    '}',
    '',
    'Rules:',
    '- title and lead are single-line plain text; the lead is 1-2 sentences',
    '  about what changes for the user.',
    '- description is optional markdown (paragraphs, lists, links — no images);',
    '  use null when the lead says it all.',
    '- Set actionRequired to true ONLY when every instance has to complete a',
    '  manual step (e.g. add a new block to their navigation), and then the',
    '  description must say exactly what to do.',
    '- German uses the formal "Sie".',
    '- If the changes are not noticeable for editor users at all, reply with',
    '  {"skip": true, "reason": "..."} instead.',
    '',
    'Commits:',
    commitSubjects,
    '',
    'Diff:',
    diff,
  ].join('\n');
}

const stripCodeFences = (text: string): string => {
  const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  return (match ? match[1] : text).trim();
};

const isContent = (value: unknown): value is GeneratedChangelogContent => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const content = value as Record<string, unknown>;

  return (
    typeof content.title === 'string' &&
    !!content.title.trim() &&
    typeof content.lead === 'string' &&
    !!content.lead.trim() &&
    (content.description === null || typeof content.description === 'string')
  );
};

export function parseGenerationResult(
  text: string
): GeneratedChangelog | SkippedGeneration {
  let parsed: unknown;

  try {
    parsed = JSON.parse(stripCodeFences(text));
  } catch {
    throw new Error(
      `Claude did not reply with valid JSON. Reply was:\n${text}`
    );
  }

  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('Claude replied with JSON that is not an object');
  }

  const result = parsed as Record<string, unknown>;

  if (result.skip === true) {
    return {
      skip: true,
      reason: typeof result.reason === 'string' ? result.reason : 'unknown',
    };
  }

  if (typeof result.slug !== 'string' || !result.slug.trim()) {
    throw new Error('Claude reply is missing a "slug"');
  }

  const entries = result.entries;

  if (typeof entries !== 'object' || entries === null) {
    throw new Error('Claude reply is missing "entries"');
  }

  const validated: Record<string, GeneratedChangelogContent> = {};

  for (const [locale, content] of Object.entries(entries)) {
    if (locale !== GENERATION_BASE_LOCALE && !isChangelogLocale(locale)) {
      throw new Error(
        `Claude reply contains an unsupported locale "${locale}"`
      );
    }

    if (!isContent(content)) {
      throw new Error(
        `Claude reply has an invalid entry for locale "${locale}" (title and lead are required)`
      );
    }

    validated[locale] = {
      title: content.title.trim().replace(/\s+/g, ' '),
      lead: content.lead.trim().replace(/\s+/g, ' '),
      description: content.description?.trim() || null,
    };
  }

  if (!validated[GENERATION_BASE_LOCALE]) {
    throw new Error(
      `Claude reply is missing the "${GENERATION_BASE_LOCALE}" entry`
    );
  }

  return {
    slug: result.slug.trim(),
    actionRequired: result.actionRequired === true,
    entries: validated,
  };
}

export function composeChangelogMarkdown(
  content: GeneratedChangelogContent,
  actionRequired?: boolean
): string {
  const frontmatter = [
    '---',
    `title: ${content.title}`,
    `lead: ${content.lead}`,
    ...(actionRequired !== undefined ?
      [`actionRequired: ${actionRequired}`]
    : []),
    '---',
  ];

  return `${frontmatter.join('\n')}\n${
    content.description ? `\n${content.description}\n` : ''
  }`;
}

export type WrittenChangelog = {
  folderName: string;
  files: string[];
  entry: ChangelogEntryData;
};

export async function writeGeneratedChangelog(
  directory: string,
  generated: GeneratedChangelog,
  now = new Date()
): Promise<WrittenChangelog> {
  const folderName = buildChangelogFolderName(generated.slug, now);
  const folderPath = path.join(directory, folderName);
  const files: string[] = [];

  mkdirSync(folderPath, { recursive: true });

  for (const [locale, content] of Object.entries(generated.entries)) {
    const fileName =
      locale === GENERATION_BASE_LOCALE ? CHANGELOG_FILE_NAME : (
        `changelog.${locale}.md`
      );
    const filePath = path.join(folderPath, fileName);

    writeFileSync(
      filePath,
      composeChangelogMarkdown(
        content,
        locale === GENERATION_BASE_LOCALE ? generated.actionRequired : undefined
      )
    );
    files.push(filePath);
  }

  // Round-trip through the exact parser the database sync uses, so the
  // generated entry is guaranteed to be insertable.
  const entry = await readChangelogEntry(directory, folderName);

  return { folderName, files, entry };
}
