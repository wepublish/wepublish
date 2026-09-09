import { createVitestConfig } from '../../../vitest.shared';

export default createVitestConfig({
  name: 'media-transform-guard-api',
  dir: __dirname,
  environment: 'node',
  react: false,
});
