import { createVitestConfig } from '../../../vitest.shared';

export default createVitestConfig({
  name: 'property-api',
  dir: __dirname,
  environment: 'node',
  react: false,
});
