import { TODO_MARKER } from './create-changelog';
import { GENERATION_BASE_LOCALE } from './generate-changelog';
import {
  CHANGELOG_FOLDER_PATTERN,
  CHANGELOG_LOCALES,
  ChangelogEntryData,
} from './sync-changelogs';

/**
 * `changelog.md` itself is the English text, so only the other languages have
 * their own file. Expecting a `changelog.en.md` would flag every correct entry.
 */
export const TRANSLATED_LOCALES = CHANGELOG_LOCALES.filter(
  locale => locale !== GENERATION_BASE_LOCALE
);

export type ChangelogProblem = {
  folderName: string;
  message: string;
  /** A warning does not fail the check; it is printed so it can be fixed. */
  warning?: boolean;
};

/**
 * The changelog folders a branch adds, read from `git diff --name-only`.
 *
 * Only additions count: touching an existing entry is editing history, not
 * announcing a change, so it never satisfies the requirement.
 */
export function addedChangelogFolders(
  changedFiles: string[],
  directory = 'libs/api/changelogs'
): string[] {
  const prefix = `${directory}/`;
  const folders = changedFiles
    .filter(file => file.startsWith(prefix))
    .map(file => file.slice(prefix.length).split('/')[0])
    .filter(folder => CHANGELOG_FOLDER_PATTERN.test(folder));

  return [...new Set(folders)].sort();
}

const containsPlaceholder = (value: string | null | undefined): boolean =>
  !!value && value.includes(TODO_MARKER);

/**
 * What would go wrong once this entry reaches an instance.
 *
 * A placeholder that nobody filled in is the common case: `changelog:create`
 * writes TODO markers and says they fail CI, so this is where that promise is
 * kept. A missing translation only degrades the entry for that language, so it
 * is reported without failing the branch.
 */
export function validateChangelogEntry(
  entry: ChangelogEntryData
): ChangelogProblem[] {
  const problems: ChangelogProblem[] = [];

  if (!entry.title.trim()) {
    problems.push({ folderName: entry.name, message: 'The title is empty.' });
  }

  if (!entry.lead.trim()) {
    problems.push({ folderName: entry.name, message: 'The lead is empty.' });
  }

  if (
    containsPlaceholder(entry.title) ||
    containsPlaceholder(entry.lead) ||
    containsPlaceholder(entry.description)
  ) {
    problems.push({
      folderName: entry.name,
      message: `Still contains a ${TODO_MARKER} placeholder — fill it in or remove that part.`,
    });
  }

  for (const translation of entry.translations) {
    if (
      containsPlaceholder(translation.title) ||
      containsPlaceholder(translation.lead) ||
      containsPlaceholder(translation.description)
    ) {
      problems.push({
        folderName: entry.name,
        message: `The ${translation.locale} translation still contains a ${TODO_MARKER} placeholder.`,
      });
    }
  }

  const locales = new Set(entry.translations.map(({ locale }) => locale));
  const missing = TRANSLATED_LOCALES.filter(locale => !locales.has(locale));

  if (missing.length) {
    problems.push({
      folderName: entry.name,
      warning: true,
      message: `No translation for ${missing.join(
        ', '
      )} — those languages fall back to the base text.`,
    });
  }

  return problems;
}

export const MISSING_ENTRY_MESSAGE = [
  'This branch adds no changelog entry.',
  '',
  'If it changes something an editor user can notice, add one:',
  '',
  '  npm run changelog:generate      # drafts it from the branch diff',
  '  npm run changelog:create -- "Short title"',
  '',
  'If it does not — a refactor, a CI fix, a test — label the pull request',
  '"no-changelog" and this check goes green.',
].join('\n');
