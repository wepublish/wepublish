import { createVitestConfig } from '../../vitest.shared';

export default createVitestConfig({
  name: 'utils',
  dir: __dirname,
  environment: 'node',
  exclude: ['api/**', 'website/**'],
});
