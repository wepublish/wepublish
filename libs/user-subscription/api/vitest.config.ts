import { createVitestConfig } from '../../../vitest.shared';

export default createVitestConfig({
  name: 'user-subscription-api',
  dir: __dirname,
  environment: 'node',
  react: false,
  nest: true,
});
