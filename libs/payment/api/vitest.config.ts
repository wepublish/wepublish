import { createVitestConfig } from '../../../vitest.shared';

export default createVitestConfig({
  name: 'payment-api',
  dir: __dirname,
  environment: 'node',
  react: false,
  nest: true,
});
