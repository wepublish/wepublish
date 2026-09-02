import { createVitestConfig } from '../../../vitest.shared';

export default createVitestConfig({
  name: 'versionInformation-api',
  dir: __dirname,
  environment: 'node',
  react: false,
});
