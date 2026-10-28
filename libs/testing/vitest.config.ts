import { createVitestConfig } from '../../vitest.shared';

export default createVitestConfig({
  name: 'testing',
  dir: __dirname,
  exclude: ['website/**'],
});
