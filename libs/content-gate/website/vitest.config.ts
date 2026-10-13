import { createVitestConfig } from '../../../vitest.shared';

export default createVitestConfig({
  name: 'content-gate-website',
  dir: __dirname,
  setupFiles: ['./setup-tests.tsx'],
});
