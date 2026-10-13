import { createVitestConfig } from '../../vitest.shared';

export default createVitestConfig({
  name: 'richtext',
  dir: __dirname,
  environment: 'node',
  exclude: ['api/**', 'editor/**', 'website/**'],
});
