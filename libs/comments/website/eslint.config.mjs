import baseConfig, { reactCompilerRules } from '../../../eslint.config.mjs';
import nx from '@nx/eslint-plugin';

export default [
  ...baseConfig,
  ...nx.configs['flat/react'],
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    // Override or add rules here
    rules: {},
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    // Override or add rules here
    rules: {},
  },
  {
    files: ['**/*.js', '**/*.jsx'],
    // Override or add rules here
    rules: {},
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    // Not compiled by the React Compiler — only `apps/editor` is — so its
    // diagnostics would be findings nobody here can act on. `nx`'s React
    // preset turns them on above, which is why they are switched off again
    // rather than left off by the root config.
    rules: reactCompilerRules('off'),
  },
];
