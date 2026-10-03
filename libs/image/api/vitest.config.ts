import { createVitestConfig } from '../../../vitest.shared';

export default createVitestConfig({
  name: 'image-api',
  dir: __dirname,
  environment: 'node',
  react: false,
  nest: true,
});
