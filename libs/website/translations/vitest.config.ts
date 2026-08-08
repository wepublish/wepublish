import { createVitestConfig } from '../../../vitest.shared';

export default createVitestConfig({
  name: 'website-translations',
  dir: __dirname,
  environment: 'node',
  react: false,
});
