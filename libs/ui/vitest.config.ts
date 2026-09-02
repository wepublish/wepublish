import { createVitestConfig } from '../../vitest.shared';

export default createVitestConfig({
  name: 'ui',
  dir: __dirname,
  setupFiles: ['./setup-tests.tsx'],
  exclude: ['editor/**', '**/editor/**'],
});
