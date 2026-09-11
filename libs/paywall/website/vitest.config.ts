import { createVitestConfig } from '../../../vitest.shared';

export default createVitestConfig({
  name: 'paywall-website',
  dir: __dirname,
  setupFiles: ['./setup-tests.tsx'],
});
