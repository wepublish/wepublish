import { createVitestConfig } from '../../../vitest.shared';

export default createVitestConfig({
  name: 'newsletter-email',
  dir: __dirname,
  environment: 'node',
  react: false,
});
