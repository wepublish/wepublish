import { createVitestConfig } from '../../../vitest.shared';

export default createVitestConfig({
  name: 'tacking-pixel-api',
  dir: __dirname,
  environment: 'node',
  react: false,
});
