import baseConfig, { reactCompilerRules } from '../../../eslint.config.mjs';
import nx from '@nx/eslint-plugin';

const coreImports = [
  'react',
  'react/jsx-runtime',
  'react-hook-form',
  '@hookform/resolvers',
  'zod/v4',
  'zod/v4/core',
];

const testImports = [...coreImports, 'react-dom', 'vitest', '@testing-library/.+'];

const onlyImports = (allowed, message) => [
  'error',
  { patterns: [{ regex: `^(?!(${allowed.join('|')})$)[^.]`, message }] },
];

export default [
  ...baseConfig,
  ...nx.configs['flat/react'],
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      curly: ['error', 'all'],
      'no-restricted-imports': onlyImports(
        coreImports,
        '@wepublish/form/core imports only react, react-hook-form, @hookform/resolvers and zod/v4.'
      ),
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
    files: ['**/*.spec.ts', '**/*.spec.tsx', '**/*.test-d.ts', 'src/testing/**'],
    rules: {
      'no-restricted-imports': onlyImports(testImports, 'Specs of @wepublish/form/core import only the test tools.'),
    },
  },
  {
    files: ['src/lib/changed-values.ts'],
    rules: {
      'no-restricted-syntax': 'off',
    },
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: reactCompilerRules('error'),
  },
];
