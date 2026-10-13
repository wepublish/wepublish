import { createVitestConfig } from '../../../vitest.shared';

export default createVitestConfig({
  name: 'content-gate-api',
  dir: __dirname,
  environment: 'node',
  react: false,
  nest: true,
});
