import { createVitestConfig } from '../../../vitest.shared';

export default createVitestConfig({
  name: 'puck-content-website',
  dir: __dirname,
  website: true,
});
