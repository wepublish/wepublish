import { createVitestConfig } from '../../vitest.shared';

export default createVitestConfig({
  name: 'user',
  dir: __dirname,
  environment: 'node',
  react: false,
  nest: true,
  exclude: ['website/**'],
});
