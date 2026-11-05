import { createVitestConfig } from '../../vitest.shared';

export default createVitestConfig({
  name: 'ui',
  dir: __dirname,
  website: true,
  exclude: ['editor/**', '**/editor/**'],
});
