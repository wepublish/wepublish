import { createVitestConfig } from '../../../vitest.shared';

export default createVitestConfig({
  name: 'event-schedule',
  dir: __dirname,
  environment: 'node',
  react: false,
});
