import { createVitestConfig } from '../../../vitest.shared';

export default createVitestConfig({
  name: 'user-api',
  dir: __dirname,
  environment: 'node',
  react: false,
  nest: true,
});
