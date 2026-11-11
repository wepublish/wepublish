import { createVitestConfig } from '../../../vitest.shared';

export default createVitestConfig({
  name: 'tag-website',
  dir: __dirname,
  website: true,
});
