import { createVitestConfig } from '../../../vitest.shared';

export default createVitestConfig({
  name: 'puck-content-editor',
  dir: __dirname,
  setupFiles: ['vitest.setup-i18n.ts'],
});
