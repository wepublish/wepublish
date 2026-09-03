import { createVitestConfig } from '../../../vitest.shared';

export default createVitestConfig({
  name: 'zettelkasten-editor',
  dir: __dirname,
  setupFiles: ['./setup-tests.tsx'],
});
