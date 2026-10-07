import { createVitestConfig } from '../../../vitest.shared';

export default createVitestConfig({
  name: 'stats-api',
  dir: __dirname,
  environment: 'node',
  react: false,
  nest: true,
});
