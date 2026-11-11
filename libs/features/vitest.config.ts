import { createVitestConfig } from '../../vitest.shared';

export default createVitestConfig({
  name: 'features',
  dir: __dirname,
  environment: 'node',
  react: false,
  nest: true,
});
