import { createVitestConfig } from '../../../vitest.shared';

export default createVitestConfig({
  name: 'poll-api',
  dir: __dirname,
  environment: 'node',
  react: false,
});
