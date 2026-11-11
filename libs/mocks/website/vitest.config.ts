import { createVitestConfig } from '../../../vitest.shared';

export default createVitestConfig({
  name: 'mocks-website',
  dir: __dirname,
  website: true,
});
