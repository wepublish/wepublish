import { createVitestConfig } from '../../../vitest.shared';

export default createVitestConfig({
  name: 'media-api',
  dir: __dirname,
  environment: 'node',
  react: false,
});
