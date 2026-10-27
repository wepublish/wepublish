import { createVitestConfig } from '../../../vitest.shared';

export default createVitestConfig({
  name: 'public-content-cache-api',
  dir: __dirname,
  environment: 'node',
  react: false,
  nest: true,
});
