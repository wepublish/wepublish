import { createVitestConfig } from '../../vitest.shared';

export default createVitestConfig({
  name: 'permissions',
  dir: __dirname,
  environment: 'node',
  react: false,
  nest: true,
});
