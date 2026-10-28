import { createVitestConfig } from '../../../vitest.shared';

export default createVitestConfig({
  name: 'website-revalidation-api',
  dir: __dirname,
  environment: 'node',
  react: false,
  nest: true,
});
