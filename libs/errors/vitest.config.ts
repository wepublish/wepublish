import { createVitestConfig } from '../../vitest.shared';

export default createVitestConfig({
  name: 'errors',
  dir: __dirname,
  environment: 'node',
  exclude: ['website/**'],
});
