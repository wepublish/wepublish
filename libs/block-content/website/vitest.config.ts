import { createVitestConfig } from '../../../vitest.shared';

export default createVitestConfig({
  name: 'block-content-website',
  dir: __dirname,
  website: true,
});
