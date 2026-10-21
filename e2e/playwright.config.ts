import { defineConfig, devices } from '@playwright/test';
import { cucumberReporter, defineBddProject } from 'playwright-bdd';
import { blockThirdPartiesArg } from './support/third-party';
import { describeTarget, localDevServers } from './support/targets';
import { target } from './support/env';

const isCI = !!process.env.CI;

// One line per run, so every report says what it ran against.
if (!process.env.TEST_WORKER_INDEX) {
  console.log(`E2E target: ${describeTarget(target)}`);
}

export default defineConfig({
  webServer: localDevServers(target).map(({ name, ...server }) => ({
    ...server,
    name,
    cwd: '..',
    reuseExistingServer: true,
    stdout: 'ignore',
    stderr: 'pipe',
  })),
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  outputDir: 'test-results/artifacts',
  reporter: [
    [isCI ? 'github' : 'list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['json', { outputFile: 'test-results/results.json' }],
    cucumberReporter('html', { outputFile: 'cucumber-report/index.html' }),
  ],
  use: {
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    launchOptions: { args: [blockThirdPartiesArg] },
  },
  // One project per application; pick one with `--project website|editor`.
  // Steps are shared, features are not.
  projects: [
    {
      ...defineBddProject({
        name: 'website',
        features: 'features/website/**/*.feature',
        steps: 'steps/**/*.ts',
      }),
      use: { ...devices['Desktop Chrome'], baseURL: target.websiteUrl },
    },
    {
      ...defineBddProject({
        name: 'editor',
        features: 'features/editor/**/*.feature',
        steps: 'steps/**/*.ts',
      }),
      use: { ...devices['Desktop Chrome'], baseURL: target.editorUrl },
    },
  ],
});
