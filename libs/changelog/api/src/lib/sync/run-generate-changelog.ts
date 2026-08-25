import { execFileSync, spawnSync } from 'child_process';
import path from 'path';
import {
  buildGenerationPrompt,
  parseGenerationResult,
  writeGeneratedChangelog,
} from './generate-changelog';

const USAGE =
  'Usage: npm run changelog:generate -- [--base <git-ref>]\n' +
  'Lets your locally installed Claude Code write the changelog entry (en, de, fr)\n' +
  'from the git changes of the current branch. Uses your normal Claude Code\n' +
  'login — no API key needed.';

const MAX_DIFF_LENGTH = 60_000;

const git = (...args: string[]): string =>
  execFileSync('git', args, { encoding: 'utf-8', maxBuffer: 32 * 1024 * 1024 });

const refExists = (ref: string): boolean => {
  try {
    execFileSync('git', ['rev-parse', '--verify', '--quiet', ref], {
      stdio: 'ignore',
    });
    return true;
  } catch {
    return false;
  }
};

function resolveBaseRef(explicitBase?: string): string {
  if (explicitBase) {
    return explicitBase;
  }

  const branch = git('rev-parse', '--abbrev-ref', 'HEAD').trim();

  if (branch === 'master' || branch === 'main') {
    return 'HEAD~1';
  }

  return refExists('origin/master') ? 'origin/master' : 'master';
}

function gatherGitContext(baseRef: string) {
  const excludes = [
    ':(exclude)package-lock.json',
    ':(exclude)libs/editor/api/src/lib/graphql.ts',
    ':(exclude)libs/website/api/src/lib/graphql.ts',
    ':(exclude)libs/peering/api/src/lib/remote/graphql.ts',
    ':(exclude)libs/testing/src/graphql/graphql-public.ts',
    ':(exclude)apps/api-example/schema-v2.graphql',
  ];

  const commitSubjects = git('log', '--format=- %s', `${baseRef}..HEAD`).trim();
  const fileList = git(
    'diff',
    '--name-status',
    `${baseRef}...HEAD`,
    '--',
    '.',
    ...excludes
  ).trim();
  let diff = git('diff', `${baseRef}...HEAD`, '--', '.', ...excludes);

  if (diff.length > MAX_DIFF_LENGTH) {
    diff = `${diff.slice(0, MAX_DIFF_LENGTH)}\n\n[diff truncated]`;
  }

  return {
    commitSubjects: commitSubjects || '(no commits — uncommitted changes?)',
    diff: `Changed files:\n${fileList}\n\n${diff}`,
  };
}

function ensureClaudeInstalled() {
  const check = spawnSync('claude', ['--version'], { stdio: 'ignore' });

  if (check.error || check.status !== 0) {
    throw new Error(
      'Claude Code is not installed (the `claude` command was not found).\n' +
        'Install it with one of:\n' +
        '  curl -fsSL https://claude.ai/install.sh | bash\n' +
        '  npm install -g @anthropic-ai/claude-code\n' +
        'Then run `claude` once and log in via /login (uses your claude.ai account).'
    );
  }
}

function runClaude(prompt: string): string {
  const result = spawnSync(
    'claude',
    ['-p', '--output-format', 'json', '--max-turns', '3'],
    {
      input: prompt,
      encoding: 'utf-8',
      maxBuffer: 32 * 1024 * 1024,
    }
  );

  const output = `${result.stdout ?? ''}${result.stderr ?? ''}`;

  if (result.status !== 0) {
    if (/log ?in|logged in|authentication|credential/i.test(output)) {
      throw new Error(
        'Claude Code is not logged in. Run `claude` once and use /login to\n' +
          'sign in with your claude.ai account — no API key needed. Then retry.'
      );
    }

    throw new Error(`Claude Code failed (exit ${result.status}):\n${output}`);
  }

  let envelope: { result?: unknown };

  try {
    envelope = JSON.parse(result.stdout);
  } catch {
    throw new Error(`Unexpected Claude Code output:\n${result.stdout}`);
  }

  if (typeof envelope.result !== 'string') {
    throw new Error(`Claude Code returned no result:\n${result.stdout}`);
  }

  return envelope.result;
}

export async function runGenerateChangelog() {
  const args = process.argv.slice(2);
  const baseFlagIndex = args.indexOf('--base');
  const explicitBase =
    baseFlagIndex !== -1 ? args[baseFlagIndex + 1] : undefined;
  const unknownFlags = args.filter(
    (arg, index) =>
      arg.startsWith('--') && arg !== '--base' && index !== baseFlagIndex + 1
  );

  if (unknownFlags.length > 0 || (baseFlagIndex !== -1 && !explicitBase)) {
    throw new Error(USAGE);
  }

  ensureClaudeInstalled();

  const baseRef = resolveBaseRef(explicitBase);
  console.log(`Analyzing changes against ${baseRef}...`);
  const { commitSubjects, diff } = gatherGitContext(baseRef);

  console.log('Asking Claude to write the changelog entry (en, de, fr)...');
  const reply = runClaude(buildGenerationPrompt(commitSubjects, diff));
  const generated = parseGenerationResult(reply);

  if ('skip' in generated) {
    console.log(
      `Claude found nothing user-facing to announce: ${generated.reason}`
    );
    console.log('No changelog entry was created.');
    return;
  }

  const directory = path.join(process.cwd(), 'libs/api/changelogs');
  const { files, entry } = await writeGeneratedChangelog(directory, generated);

  console.log('');
  console.log(`Created (actionRequired: ${entry.actionRequired}):`);

  for (const file of files) {
    console.log(`- ${path.relative(process.cwd(), file)}`);
  }

  console.log('');
  console.log(
    'Review the wording before committing — Claude drafts it, you own it.'
  );
}

runGenerateChangelog().catch(err => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
