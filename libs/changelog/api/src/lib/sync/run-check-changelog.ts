import { execFileSync } from 'child_process';
import { existsSync, readdirSync } from 'fs';
import path from 'path';
import {
  MISSING_ENTRY_MESSAGE,
  addedChangelogFolders,
  validateChangelogEntry,
  type ChangelogProblem,
} from './check-changelog';
import {
  CHANGELOG_FOLDER_PATTERN,
  readChangelogEntry,
} from './sync-changelogs';

const USAGE =
  'Usage: npm run changelog:check -- [--since <git-ref>] [--dir <path>]';

function readFlag(args: string[], name: string): string | undefined {
  const index = args.indexOf(name);

  return index === -1 ? undefined : args[index + 1];
}

function changedFiles(since: string): string[] {
  const output = execFileSync(
    'git',
    ['diff', '--name-only', `${since}...HEAD`],
    { encoding: 'utf-8' }
  );

  return output.split('\n').filter(Boolean);
}

export async function runCheckChangelog(): Promise<number> {
  const args = process.argv.slice(2);
  const since = readFlag(args, '--since');
  const directory =
    readFlag(args, '--dir') ||
    process.env.CHANGELOGS_DIR ||
    path.join(process.cwd(), 'libs/api/changelogs');

  if (!existsSync(directory)) {
    console.error(`No changelog directory at ${directory}\n${USAGE}`);

    return 1;
  }

  // Without --since every entry is checked, which is what a push to a long-lived
  // branch wants. With it, only what this branch adds has to exist.
  const allFolders = readdirSync(directory, { withFileTypes: true })
    .filter(item => item.isDirectory())
    .map(item => item.name)
    .filter(name => CHANGELOG_FOLDER_PATTERN.test(name));

  const added =
    since ?
      addedChangelogFolders(
        changedFiles(since),
        path.relative(process.cwd(), directory)
      )
    : [];

  if (since && !added.length) {
    console.error(MISSING_ENTRY_MESSAGE);

    return 1;
  }

  const toCheck = since ? added : allFolders;
  const problems: ChangelogProblem[] = [];

  for (const folderName of toCheck) {
    try {
      problems.push(
        ...validateChangelogEntry(
          await readChangelogEntry(directory, folderName)
        )
      );
    } catch (error) {
      problems.push({
        folderName,
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const failures = problems.filter(problem => !problem.warning);

  for (const problem of problems) {
    console.error(
      `${problem.warning ? 'warning' : 'error'}: ${problem.folderName}: ${
        problem.message
      }`
    );
  }

  if (failures.length) {
    return 1;
  }

  console.log(
    toCheck.length ?
      `Checked ${toCheck.length} changelog entr${
        toCheck.length === 1 ? 'y' : 'ies'
      }.`
    : 'No changelog entries to check.'
  );

  return 0;
}

runCheckChangelog()
  .then(code => process.exit(code))
  .catch(error => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
