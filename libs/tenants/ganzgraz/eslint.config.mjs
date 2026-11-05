import baseConfig from '../../../eslint.config.mjs';
import nx from '@nx/eslint-plugin';
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import eslintPluginSimpleImportSort from 'eslint-plugin-simple-import-sort';

export default [
  ...baseConfig,
  ...nx.configs['flat/react-typescript'],
  ...nextCoreWebVitals,
  {
    rules: {
      'react-hooks/refs': 'off',
      'react-hooks/immutability': 'off',
      'react-hooks/preserve-manual-memoization': 'off',
      'react-hooks/set-state-in-effect': 'off',
      '@next/next/no-html-link-for-pages': 'off',
    },
  },
  { plugins: { 'simple-import-sort': eslintPluginSimpleImportSort } },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      'simple-import-sort/imports': 1,
      'simple-import-sort/exports': 1,
    },
  },
];
