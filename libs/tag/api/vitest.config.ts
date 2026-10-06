import { createVitestConfig } from '../../../vitest.shared';

export default createVitestConfig({
  name: 'tag-api',
  dir: __dirname,
  environment: 'node',
  react: false,
  nest: true,
});
