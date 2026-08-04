import { createVitestConfig } from '../../../vitest.shared';

export default createVitestConfig({
  name: 'errors-website',
  dir: __dirname,
  setupFiles: ['./setup-tests.tsx'],
});
