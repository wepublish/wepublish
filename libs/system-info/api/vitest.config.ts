import { createVitestConfig } from '../../../vitest.shared';

export default createVitestConfig({
  name: 'system-info-api',
  dir: __dirname,
  environment: 'node',
  react: false,
});
