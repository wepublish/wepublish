import { defineConfig } from 'vitest/config';
import { createVitestConfig } from '../../../vitest.shared';

const uncompiledSpecs = ['src/lib/subscription-flow/**/*.spec.{ts,tsx}'];

const compiled = createVitestConfig({
  name: 'membership-editor',
  dir: __dirname,
  reactCompiler: true,
  exclude: uncompiledSpecs,
});

const uncompiled = createVitestConfig({
  name: 'membership-editor-uncompiled',
  dir: __dirname,
});

export default defineConfig({
  test: {
    projects: [
      compiled,
      {
        ...uncompiled,
        test: { ...uncompiled.test, include: uncompiledSpecs },
      },
    ],
  },
});
