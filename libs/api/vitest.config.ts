import { createVitestConfig } from '../../vitest.shared';

export default createVitestConfig({
  name: 'api',
  dir: __dirname,
  environment: 'node',
  react: false,
});
