import nx from '@nx/eslint-plugin';
import eslintPluginSimpleImportSort from 'eslint-plugin-simple-import-sort';
import globals from 'globals';

import baseConfig from '../../eslint.config.mjs';

export default [
  ...baseConfig,
  ...nx.configs['flat/react-typescript'],
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
