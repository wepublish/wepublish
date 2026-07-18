import baseConfig from '../../eslint.config.mjs';
import nx from '@nx/eslint-plugin';
import eslintPluginI18next from 'eslint-plugin-i18next';
import eslintPluginSimpleImportSort from 'eslint-plugin-simple-import-sort';

export default [
  ...baseConfig,
  ...nx.configs['flat/react'],
  {
    plugins: {
      i18next: eslintPluginI18next,
      'simple-import-sort': eslintPluginSimpleImportSort,
    },
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      'no-empty': 'warn',
      'react/display-name': [0],
      'react/jsx-boolean-value': [1],
      'react/prop-types': [0],
      'i18next/no-literal-string': [
        2,
        {
          markupOnly: true,
          ignoreAttribute: [
            'align',
            'alignItems',
            'appearance',
            'as',
            'autoComplete',
            'axis',
            'backdrop',
            'closePath',
            'color',
            'componentClass',
            'controlId',
            'data-testid',
            'dataKey',
            'dateFormat',
            'display',
            'element',
            'eventKey',
            'fill',
            'fixed',
            'flexDirection',
            'flexWrap',
            'format',
            'href',
            'icon',
            'iconActive',
            'justify',
            'justifyContent',
            'minHeight',
            'name',
            'overflow',
            'path',
            'placement',
            'position',
            'sdkLanguage',
            'size',
            'spacing',
            'stack',
            'target',
            'to',
            'trigger',
            'value',
            'variant',
            'verticalAlign',
          ],
          ignoreComponent: ['code'],
          ignore: ['\u2014', '&'],
        },
      ],
      'simple-import-sort/imports': 1,
      'simple-import-sort/exports': 1,
      'import/first': 1,
      'import/newline-after-import': 1,
      'import/no-duplicates': 1,
    },
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
    // Ported from the former __mocks__/.eslintrc file.
    files: ['**/__mocks__/**'],
    rules: {
      '@typescript-eslint/ban-ts-comment': 'off',
      // @typescript-eslint/no-var-requires was replaced by no-require-imports in typescript-eslint v8.
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
];
