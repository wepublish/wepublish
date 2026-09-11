import { createVitestConfig } from '../../vitest.shared';

export default createVitestConfig({
  name: 'storybook',
  dir: __dirname,
  exclude: ['mocks/**'],
});
