import baseConfig from '../../eslint.config.mjs';
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
    files: ['.storybook/**/*.ts', '.storybook/**/*.tsx'],
    rules: {
      // The addons live in the workspace root package.json, which the rule
      // cannot resolve since the inferred lint target runs eslint with the
      // project root as its cwd.
      'storybook/no-uninstalled-addons': 'off',
    },
  },
];
