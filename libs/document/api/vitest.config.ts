import { createVitestConfig } from '../../../vitest.shared';

export default createVitestConfig({
  name: 'document-api',
  dir: __dirname,
  environment: 'node',
  react: false,
});
