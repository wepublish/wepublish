import { createVitestConfig } from '../../../vitest.shared';

export default createVitestConfig({
  name: 'ai-editor',
  dir: __dirname,
  setupFiles: ['./setup-tests.tsx'],
});
