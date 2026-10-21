import { createVitestConfig } from '../../../vitest.shared';

export default createVitestConfig({
  name: 'features-api',
  dir: __dirname,
  environment: 'node',
  react: false,
  nest: true,
});
