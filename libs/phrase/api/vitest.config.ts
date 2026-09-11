import { createVitestConfig } from '../../../vitest.shared';

export default createVitestConfig({
  name: 'phrase-api',
  dir: __dirname,
  environment: 'node',
  react: false,
});
