import { createVitestConfig } from '../../vitest.shared';

export default createVitestConfig({
  name: 'newsletter',
  dir: __dirname,
  environment: 'node',
  exclude: ['api/**', 'editor/**'],
});
