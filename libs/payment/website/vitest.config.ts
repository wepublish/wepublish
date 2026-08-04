import { createVitestConfig } from '../../../vitest.shared';

export default createVitestConfig({
  name: 'payment-website',
  dir: __dirname,
  setupFiles: ['./setup-tests.tsx'],
});
