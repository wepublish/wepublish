import { createVitestConfig } from '../../vitest.shared';

export default createVitestConfig({
  name: 'api-example',
  dir: __dirname,
  environment: 'node',
  react: false,
});
