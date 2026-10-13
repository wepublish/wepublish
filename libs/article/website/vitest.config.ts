import { createVitestConfig } from '../../../vitest.shared';

export default createVitestConfig({
  name: 'article-website',
  dir: __dirname,
  setupFiles: ['./setup-tests.tsx'],
});
