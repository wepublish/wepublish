import { createVitestConfig } from '../../../vitest.shared';

export default createVitestConfig({
  name: 'google-analytics-api',
  dir: __dirname,
  environment: 'node',
  react: false,
  nest: true,
});
