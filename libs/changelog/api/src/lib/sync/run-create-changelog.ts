import { ChangelogSeverity } from '@prisma/client';
import path from 'path';
import { createChangelogFile } from './create-changelog';

const USAGE =
  'Usage: npm run changelog:create -- "Title of the change" [--recommended | --required]';

// `--action-required` predates the severities and stays an alias of
// `--required`.
const SEVERITY_FLAGS: Record<string, ChangelogSeverity> = {
  '--recommended': ChangelogSeverity.RECOMMENDED,
  '--required': ChangelogSeverity.REQUIRED,
  '--action-required': ChangelogSeverity.REQUIRED,
};

export async function runCreateChangelog() {
  const args = process.argv.slice(2);
  const flags = args.filter(arg => arg.startsWith('--'));
  const unknownFlags = flags.filter(flag => !(flag in SEVERITY_FLAGS));

  if (unknownFlags.length > 0) {
    throw new Error(`Unknown option(s): ${unknownFlags.join(', ')}\n${USAGE}`);
  }

  const severities = new Set(flags.map(flag => SEVERITY_FLAGS[flag]));

  if (severities.size > 1) {
    throw new Error(`Pass only one severity option.\n${USAGE}`);
  }

  const title = args
    .filter(arg => !arg.startsWith('--'))
    .join(' ')
    .trim();

  if (!title) {
    throw new Error(`Missing title.\n${USAGE}`);
  }

  const directory =
    process.env.CHANGELOGS_DIR ||
    path.join(process.cwd(), 'libs/api/changelogs');

  const { filePath, entry } = await createChangelogFile({
    directory,
    title,
    severity: [...severities][0] ?? ChangelogSeverity.INFO,
  });

  console.log(`Created ${path.relative(process.cwd(), filePath)}`);
  console.log('');
  console.log('Next steps:');
  console.log(
    '- Fill in the lead and description (entries still containing TODO fail CI)'
  );
  console.log(
    '- Put images next to the changelog.md and reference them relatively'
  );

  if (entry.severity !== ChangelogSeverity.INFO) {
    console.log(
      `- severity is ${entry.severity.toLowerCase()}: describe exactly what the user has to do manually`
    );
  }

  console.log('- See libs/api/changelogs/README.md for the full format');
}

runCreateChangelog().catch(err => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
