import { createVitestConfig } from '../../../vitest.shared';

export default createVitestConfig({
  name: 'author-website',
  dir: __dirname,
  setupFiles: ['./setup-tests.tsx'],
});
