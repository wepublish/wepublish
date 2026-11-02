import { createVitestConfig } from '../../../vitest.shared';

export default createVitestConfig({
  name: 'login-code-api',
  dir: __dirname,
  environment: 'node',
  react: false,
  nest: true,
});
