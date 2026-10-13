import { createVitestConfig } from '../../vitest.shared';

export default createVitestConfig({
  name: 'media',
  dir: __dirname,
  environment: 'node',
  react: false,
});
