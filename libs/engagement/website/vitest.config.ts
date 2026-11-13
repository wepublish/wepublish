import { createVitestConfig } from '../../../vitest.shared';

export default createVitestConfig({
  name: 'engagement-website',
  dir: __dirname,
  website: true,
});
