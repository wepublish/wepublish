import { createVitestConfig } from '../vitest.shared';

/**
 * The image-build guards are plain Node scripts, so they need neither a DOM
 * nor React — but they are tests like any other, and running them under the
 * same runner is what gets them into `nx -t test`, and therefore into CI.
 * Before this they ran only when somebody remembered to type `node --test`.
 */
export default createVitestConfig({
  name: 'docker-scripts',
  dir: __dirname,
  environment: 'node',
  react: false,
});
