import { createVitestConfig } from '../../../vitest.shared';

export default createVitestConfig({
  name: 'comments-website',
  dir: __dirname,
  setupFiles: ['./setup-tests.tsx'],
});
