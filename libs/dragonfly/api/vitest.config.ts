import { createVitestConfig } from '../../../vitest.shared';

export default createVitestConfig({
  name: 'dragonfly-api',
  dir: __dirname,
  environment: 'node',
  react: false,
  nest: true,
});
