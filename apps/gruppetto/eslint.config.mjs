import nx from '@nx/eslint-plugin';
import eslintPluginSimpleImportSort from 'eslint-plugin-simple-import-sort';
import globals from 'globals';

import baseConfig, { reactCompilerRules } from '../../eslint.config.mjs';

export default [
  ...baseConfig,
  // `flat/react`, not `flat/react-typescript`: only the former registers
  // react-hooks, jsx-a11y, react and import. The typescript variant enforces
  // TS rules alone, which left this app with no React or a11y lint at all
  // after `eslint-config-next/core-web-vitals` went away with Next.
  ...nx.configs['flat/react'],
  { plugins: { 'simple-import-sort': eslintPluginSimpleImportSort } },
  { languageOptions: { globals: { ...globals.jest } } },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      'simple-import-sort/imports': 1,
      'simple-import-sort/exports': 1,
    },
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    // This app compiles (see `vite.config.mts`), so the compiler's own
    // diagnostics are findings someone can act on. Off at the root, on here.
    rules: reactCompilerRules('error'),
  },
  {
    // TanStack Router writes this file; never hand-edit it.
    ignores: [
      '**/routeTree.gen.ts',
      '**/.output/**',
      '**/.nitro/**',
      '**/.tanstack/**',
      '**/dist/**',
    ],
  },
];
