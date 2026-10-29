import { createVitestConfig } from '../../../vitest.shared';

export default createVitestConfig({
  name: 'membership-website',
  dir: __dirname,
  website: true,
});
