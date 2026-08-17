import { createVitestConfig } from '../../vitest.shared';

export default createVitestConfig({
  name: 'website',
  dir: __dirname,
  exclude: ['admin/**', 'api/**', 'builder/**', 'translations/**'],
});
