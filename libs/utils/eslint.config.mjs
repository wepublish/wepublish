import baseConfig from '../../eslint.config.mjs';

export default [
  ...baseConfig,
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
    // The nested utils-api and utils-website projects are linted by their own
    // lint targets with their own configs (which register the plugins their
    // sources need); with flat config they can no longer be linted with this
    // project's config.
    ignores: ['**/api/**', '**/website/**'],
  },
];
