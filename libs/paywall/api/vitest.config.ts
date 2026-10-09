import { createVitestConfig } from '../../../vitest.shared';

export default createVitestConfig({
  name: 'paywall-api',
  dir: __dirname,
  environment: 'node',
  react: false,
  nest: true,
});
