import { createVitestConfig } from '../../vitest.shared';

export default createVitestConfig({
  name: 'website',
  dir: __dirname,
  website: true,
  exclude: ['admin/**', 'api/**', 'builder/**', 'translations/**'],
});
