import { createVitestConfig } from '../../../vitest.shared';

export default createVitestConfig({
  name: 'tenant-wepublish-site',
  dir: __dirname,
  website: true,
});
