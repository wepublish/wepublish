import { createVitestConfig } from '../../../../vitest.shared';

export default createVitestConfig({
  name: 'event-import-api',
  dir: __dirname,
  environment: 'node',
  react: false,
  nest: true,
});
