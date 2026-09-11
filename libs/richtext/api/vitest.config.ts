import { createVitestConfig } from '../../../vitest.shared';

export default createVitestConfig({
  name: 'richtext-api',
  dir: __dirname,
  environment: 'node',
  react: false,
});
