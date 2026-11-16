import { createVitestConfig } from '../../../vitest.shared';

export default createVitestConfig({
  name: 'print-issue-api',
  dir: __dirname,
  environment: 'node',
  react: false,
  nest: true,
});
