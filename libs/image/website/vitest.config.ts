import { createVitestConfig } from '../../../vitest.shared';

export default createVitestConfig({
  name: 'image-website',
  dir: __dirname,
  website: true,
});
