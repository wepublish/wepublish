import { createVitestConfig } from '../../../vitest.shared';

export default createVitestConfig({
  name: 'authentication-api',
  dir: __dirname,
  environment: 'node',
  react: false,
  nest: true,
});
