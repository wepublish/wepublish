import { createVitestConfig } from '../../../vitest.shared';

export default createVitestConfig({
  name: 'page-website',
  dir: __dirname,
  setupFiles: ['./setup-tests.tsx'],
});
