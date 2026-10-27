import nx from '@nx/eslint-plugin';
import stylistic from '@stylistic/eslint-plugin';
import eslintPluginStorybook from 'eslint-plugin-storybook';
import eslintPluginUnusedImports from 'eslint-plugin-unused-imports';
import globals from 'globals';

/**
 * The React Compiler's own lint rules, as one switch.
 *
 * Shared so the editor projects can turn on exactly what the root turns off,
 * rather than each listing the rules again and drifting apart.
 */
export const reactCompilerRules = level => ({
  ...Object.fromEntries(
    [
      'react-hooks/set-state-in-effect',
      'react-hooks/refs',
      'react-hooks/purity',
      'react-hooks/globals',
      'react-hooks/immutability',
      'react-hooks/preserve-manual-memoization',
    ].map(rule => [rule, level])
  ),
  // Reports that the compiler skipped a component because a library it uses
  // cannot be memoised safely — react-hook-form's `watch()`, for one. That is
  // a missed optimisation rather than a defect, so it stays advisory even
  // where the rest are errors.
  'react-hooks/incompatible-library': level === 'off' ? 'off' : 'warn',
});

export default [
  ...eslintPluginStorybook.configs['flat/recommended'],
  ...nx.configs['flat/base'],
  {
    plugins: {
      'unused-imports': eslintPluginUnusedImports,
      '@stylistic': stylistic,
    },
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          args: 'none',
          // typescript-eslint v8 changed the default of `caughtErrors` to 'all';
          // pin the previous default so behavior matches the pre-upgrade baseline.
          caughtErrors: 'none',
        },
      ],
      'unused-imports/no-unused-imports': 'error',
      'object-shorthand': 'warn',
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: false,
          // Nx 21+ also checks CommonJS require() calls; this pre-existing
          // import in the apps' next.config.js files was not checked before
          // the upgrade.
          allow: ['../../libs/utils/website/src/lib/next.config'],
          depConstraints: [
            {
              sourceTag: '*',
              onlyDependOnLibsWithTags: ['*'],
            },
          ],
        },
      ],
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@mui/material',
              importNames: ['styled'],
              message: "Please import 'styled' from '@emotion/styled' instead.",
            },
            {
              name: '@wepublish/user/api',
              importNames: ['SensitiveDataUser'],
              message:
                "Please only import 'SensitiveDataUser' when the sensitive data absolutely is required. Otherwise use `User` instead.",
            },
          ],
        },
      ],
    },
  },
  ...nx.configs['flat/typescript'],
  ...nx.configs['flat/javascript'],
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      // @typescript-eslint/no-extra-semi was removed in typescript-eslint v8;
      // @stylistic/no-extra-semi is its direct replacement.
      '@stylistic/no-extra-semi': 'error',
      'no-extra-semi': 'off',
      // Newly enabled by the ESLint v9 recommended preset; was not enforced before the upgrade.
      'no-constant-binary-expression': 'off',
      // Successors of @typescript-eslint/ban-types, newly enabled by the
      // typescript-eslint v8 recommended preset; were not enforced before the upgrade.
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-unsafe-function-type': 'off',
    },
  },
  {
    files: ['**/*.spec.ts', '**/*.spec.tsx', '**/*.spec.js', '**/*.spec.jsx'],
    languageOptions: {
      globals: {
        // The backend (NestJS) projects run on jest, everything else on vitest.
        ...globals.jest,
        vi: 'readonly',
      },
    },
  },
  {
    // The per-project vitest configs share their setup through the root-level
    // `vitest.shared.ts`, which is not part of any project and therefore has to
    // be imported by a relative path.
    files: ['**/vitest.config.ts'],
    rules: {
      '@nx/enforce-module-boundaries': 'off',
    },
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    // `eslint-plugin-react-hooks` v7 ships the React Compiler's diagnostics.
    // The compiler runs on `apps/editor` only (see its vite config), so they
    // are off here and switched back on by `reactCompilerRules` in the editor
    // projects' own configs — anywhere else they would be findings nobody can
    // act on. A project that starts compiling adds that import.
    rules: reactCompilerRules('off'),
  },
  {
    ignores: [
      '**/__generated__/**',
      '**/*/seed.ts',
      // graphql-codegen output
      '**/*.generated.ts',
      'libs/editor/api/src/lib/gql/**',
      'libs/website/api/src/lib/gql/**',
      'libs/peering/api/src/lib/remote/graphql.ts',
    ],
  },
];
