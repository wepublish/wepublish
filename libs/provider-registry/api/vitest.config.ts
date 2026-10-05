import { createVitestConfig } from '../../../vitest.shared';

export default createVitestConfig({
  name: 'provider-registry-api',
  dir: __dirname,
  environment: 'node',
  react: false,
});
