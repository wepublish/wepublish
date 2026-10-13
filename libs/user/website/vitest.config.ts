import { createVitestConfig } from '../../../vitest.shared';

export default createVitestConfig({
  name: 'user-website',
  dir: __dirname,
  setupFiles: ['./setup-tests.tsx'],
});
