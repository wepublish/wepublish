import { createVitestConfig } from '../../../vitest.shared';

export default createVitestConfig({
  name: 'audio-api',
  dir: __dirname,
  environment: 'node',
  react: false,
});
