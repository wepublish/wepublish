import { createVitestConfig } from '../../../vitest.shared';

export default createVitestConfig({
  name: 'session-api',
  dir: __dirname,
  environment: 'node',
  react: false,
  nest: true,
});
