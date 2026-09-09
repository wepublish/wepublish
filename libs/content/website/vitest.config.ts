import { createVitestConfig } from '../../../vitest.shared';

export default createVitestConfig({
  name: 'content-website',
  dir: __dirname,
  setupFiles: ['./setup-tests.tsx'],
});
