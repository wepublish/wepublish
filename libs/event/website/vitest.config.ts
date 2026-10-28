import { createVitestConfig } from '../../../vitest.shared';

export default createVitestConfig({
  name: 'event-website',
  dir: __dirname,
  website: true,
});
