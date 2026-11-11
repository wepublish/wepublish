import baseConfig, { reactCompilerRules, restrictedImportPaths } from '../../../eslint.config.mjs';
import nx from '@nx/eslint-plugin';
import eslintPluginI18next from 'eslint-plugin-i18next';

export default [
  ...baseConfig,
  ...nx.configs['flat/react'],
  {
    plugins: {
      i18next: eslintPluginI18next,
    },
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      'i18next/no-literal-string': [
        2,
        {
          markupOnly: true,
          ignoreAttribute: [
            'align',
            'alignItems',
            'as',
            'autoComplete',
            'color',
            'component',
            'data-testid',
            'display',
            'edge',
            'flexDirection',
            'href',
            'justifyContent',
            'name',
            'placement',
            'position',
            'size',
            'spacing',
            'target',
            'to',
            'type',
            'value',
            'variant',
          ],
          ignoreComponent: ['code'],
          ignore: ['—', '&'],
        },
      ],
    },
  },
  {
    files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx'],
    rules: {
      'i18next/no-literal-string': 'off',
    },
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      curly: ['error', 'all'],
      'no-restricted-imports': [
        'error',
        {
          paths: restrictedImportPaths,
          patterns: [
            {
              regex: '^zod(/v3)?$',
              message: "Form schemas use the zod 4 API: import from 'zod/v4'.",
            },
          ],
        },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: "CallExpression[callee.property.name='watch']",
          message: 'Use useWatch(); watch() makes the React Compiler skip the component.',
        },
        {
          selector: "MemberExpression[property.name='formState']",
          message:
            'Read form state through useFormState() or useFormStatus(); formState on the form object goes stale under the React Compiler.',
        },
      ],
    },
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: reactCompilerRules('error'),
  },
];
