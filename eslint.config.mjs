import nx from '@nx/eslint-plugin';
import stylistic from '@stylistic/eslint-plugin';
import eslintPluginStorybook from 'eslint-plugin-storybook';
import eslintPluginUnusedImports from 'eslint-plugin-unused-imports';
import globals from 'globals';

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
        ...globals.jest,
      },
    },
  },
  {
    ignores: ['**/__generated__/**', '**/*/seed.ts'],
  },
];
