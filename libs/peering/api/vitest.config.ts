import { createVitestConfig } from '../../../vitest.shared';

export default createVitestConfig({
  name: 'peering-api',
  dir: __dirname,
  environment: 'node',
  react: false,
  nest: true,
  // `import/` is its own project (peering-api-import) with its own config.
  // The jest setup excluded it with `testPathIgnorePatterns`; without this the
  // specs run twice, and under the wrong config.
  exclude: ['import/**'],
});
