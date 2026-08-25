import path from 'path';
import { createChangelogFile } from './create-changelog';

const USAGE =
  'Usage: npm run changelog:create -- "Title of the change" [--action-required]';

export async function runCreateChangelog() {
  const args = process.argv.slice(2);
  const flags = args.filter(arg => arg.startsWith('--'));
  const unknownFlags = flags.filter(flag => flag !== '--action-required');

  if (unknownFlags.length > 0) {
    throw new Error(`Unknown option(s): ${unknownFlags.join(', ')}\n${USAGE}`);
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
    actionRequired: flags.includes('--action-required'),
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

  if (entry.actionRequired) {
    console.log(
      '- actionRequired is set: describe exactly what the user has to do manually'
    );
  }

  console.log('- See libs/api/changelogs/README.md for the full format');
}

runCreateChangelog().catch(err => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
