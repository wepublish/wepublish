import { createVitestConfig } from '../../../vitest.shared';

export default createVitestConfig({
  name: 'authentication-website',
  dir: __dirname,
  website: true,
});
