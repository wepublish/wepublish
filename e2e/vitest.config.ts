import { createVitestConfig } from '../vitest.shared';

// Unit specs of the suite's support code (e2e/support/*.spec.ts). The
// journeys themselves run through Playwright (`pnpm run e2e`), never here.
export default createVitestConfig({
  name: 'e2e',
  dir: __dirname,
  environment: 'node',
  react: false,
  exclude: ['.features-gen/**', 'playwright-report/**', 'test-results/**'],
});
