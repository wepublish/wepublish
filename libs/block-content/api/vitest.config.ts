import { createVitestConfig } from '../../../vitest.shared';

export default createVitestConfig({
  name: 'block-content-api',
  dir: __dirname,
  environment: 'node',
  react: false,
  nest: true,
});
