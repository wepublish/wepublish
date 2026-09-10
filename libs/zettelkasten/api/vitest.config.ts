import { createVitestConfig } from '../../../vitest.shared';

export default createVitestConfig({
  name: 'zettelkasten-api',
  dir: __dirname,
  environment: 'node',
  react: false,
});
