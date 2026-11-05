import { createVitestConfig } from '../../../vitest.shared';

export default createVitestConfig({
  name: 'tenant-flimmer',
  dir: __dirname,
  website: true,
});
