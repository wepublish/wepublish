import { createVitestConfig } from '../../../vitest.shared';

export default createVitestConfig({
  name: 'form-core',
  dir: __dirname,
  reactCompiler: true,
  overrides: {
    test: {
      typecheck: {
        enabled: true,
        include: ['src/**/*.test-d.ts'],
        tsconfig: './tsconfig.spec.json',
      },
    },
  },
});
