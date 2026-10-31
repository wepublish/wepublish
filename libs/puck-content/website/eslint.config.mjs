import baseConfig from '../../../eslint.config.mjs';
import nx from '@nx/eslint-plugin';
import reactRefresh from 'eslint-plugin-react-refresh';

const [rootRestrictedImportsSeverity, rootRestrictedImports] = baseConfig.find(
  entry => entry.rules?.['no-restricted-imports']
).rules['no-restricted-imports'];

const editorOnlyImports = {
  group: [
    '@wepublish/puck-content/editor',
    '@wepublish/puck-content/editor/*',
    '@wepublish/editor/api',
    '@wepublish/editor/api/*',
    '@wepublish/ui/editor',
    '@wepublish/ui/editor/*',
  ],
  message:
    'The website lib must not depend on the editor. Move the editor behaviour into @wepublish/puck-content/editor.',
};

const puckImports = {
  group: ['@puckeditor/*'],
  message:
    'The website lib renders without Puck. Only generated/generated-block.component.tsx may import it, to render generated blocks.',
};

const restrictImports = patterns => [
  rootRestrictedImportsSeverity,
  { ...rootRestrictedImports, patterns },
];

const puckRenderers = ['**/src/lib/generated/generated-block.component.tsx'];

export default [
  ...baseConfig,
  ...nx.configs['flat/react'],
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      'no-restricted-imports': restrictImports([editorOnlyImports, puckImports]),
    },
  },
  {
    files: puckRenderers,
    rules: {
      'no-restricted-imports': restrictImports([editorOnlyImports]),
    },
  },
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
    files: ['**/*.tsx', '**/*.jsx'],
    plugins: {
      'react-refresh': reactRefresh,
    },
    rules: {
      'react-refresh/only-export-components': [
        'error',
        { allowConstantExport: false },
      ],
      // The rule above accepts any PascalCase export as a component, so a
      // config object such as `export const Grid: ComponentConfig = {}`
      // slips through and breaks Fast Refresh. Object literals belong into
      // `.ts` files (e.g. `<name>.config.ts`).
      'no-restricted-syntax': [
        'error',
        {
          selector:
            'ExportNamedDeclaration > VariableDeclaration > VariableDeclarator > ObjectExpression.init',
          message:
            'Do not export object literals from .tsx files, move them into a .ts file so Fast Refresh keeps working.',
        },
        {
          selector:
            'ExportNamedDeclaration > VariableDeclaration > VariableDeclarator > :matches(TSAsExpression, TSSatisfiesExpression).init > ObjectExpression.expression',
          message:
            'Do not export object literals from .tsx files, move them into a .ts file so Fast Refresh keeps working.',
        },
      ],
    },
  },
  {
    files: ['**/*.js', '**/*.jsx'],
    // Override or add rules here
    rules: {},
  },
];
