import { createVitestConfig } from '../../../vitest.shared';

export default createVitestConfig({
  name: 'letter-api',
  dir: __dirname,
  environment: 'node',
  react: false,
  nest: true,
});
