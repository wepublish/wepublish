import { createVitestConfig } from '../../../vitest.shared';

export default createVitestConfig({
  name: 'puck-content-api',
  dir: __dirname,
  environment: 'node',
  react: false,
  nest: true,
});
