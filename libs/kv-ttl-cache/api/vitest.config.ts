import { createVitestConfig } from '../../../vitest.shared';

export default createVitestConfig({
  name: 'kv-ttl-cache-api',
  dir: __dirname,
  environment: 'node',
  react: false,
});
