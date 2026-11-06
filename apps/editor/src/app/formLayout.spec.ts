import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const root = resolve(__dirname, '../../../..');

const sourceDirs = [
  'apps/editor/src',
  ...readdirSync(join(root, 'libs'))
    .filter(lib => lib !== 'form')
    .map(lib => `libs/${lib}/editor/src`),
];

const viewApi = new Set([
  'formView',
  'useCreateForm',
  'useEditForm',
  'useSingletonForm',
  'FormPage',
  'FormDrawerPanel',
  'FormRoot',
  'editorForm',
]);

const viewModule = /^\.\.?\/[\w./-]*\.view$/;

const bannedImports: Readonly<Record<string, ReadonlySet<string>>> = {
  '@mui/material': new Set([
    'Card',
    'CardContent',
    'CardHeader',
    'Grid',
    'Paper',
  ]),
  '@wepublish/ui/editor': new Set(['SingleViewTitle', 'ListViewHeader']),
};

const namedImports =
  /import\s+(?:type\s+)?\{([^}]*)\}\s*from\s*['"]([^'"]+)['"]/g;

const defaultImports =
  /import\s+(\w+)\s*(?:,\s*\{[^}]*\})?\s*from\s*['"]([^'"]+)['"]/g;

const muiDeepImport = /^@mui\/material\/(\w+)$/;

type Import = { name: string; from: string };

const normalised = ({ name, from }: Import & { index: number }): Import =>
  muiDeepImport.test(from) ? { name, from: '@mui/material' } : { name, from };

function importsOf(source: string): Import[] {
  const named = [...source.matchAll(namedImports)].flatMap(
    ({ 1: names, 2: from, index }) =>
      names
        .split(',')
        .map(
          name =>
            name
              .trim()
              .replace(/^type\s+/, '')
              .split(/\s+as\s+/)[0]
        )
        .filter(name => name !== '')
        .map(name => ({ name, from, index }))
  );
  const defaults = [...source.matchAll(defaultImports)].map(
    ({ 1: name, 2: from, index }) => ({
      name: muiDeepImport.exec(from)?.[1] ?? name,
      from,
      index,
    })
  );

  return [...named, ...defaults]
    .sort((a, b) => a.index - b.index)
    .map(normalised);
}

const usesFormViews = (imports: Import[]) =>
  imports.some(
    ({ name, from }) =>
      (from === '@wepublish/form/editor' && viewApi.has(name)) ||
      (viewModule.test(from) && /View$/.test(name))
  );

function layoutViolations(source: string): string[] {
  const imports = importsOf(source);

  if (!usesFormViews(imports)) {
    return [];
  }

  return imports
    .filter(({ name, from }) => bannedImports[from]?.has(name))
    .map(({ name, from }) => `${name} from ${from}`);
}

function sourceFiles(): string[] {
  return sourceDirs
    .map(dir => join(root, dir))
    .filter(dir => existsSync(dir))
    .flatMap(dir =>
      (readdirSync(dir, { recursive: true }) as string[])
        .filter(
          file =>
            /\.tsx?$/.test(file) && !/\.(spec|test|stories)\.tsx?$/.test(file)
        )
        .map(file => join(dir, file))
    );
}

const checkedFiles = () =>
  sourceFiles().filter(file =>
    usesFormViews(importsOf(readFileSync(file, 'utf8')))
  );

describe('form view layout', () => {
  it('reports cards, grids and legacy headers in files that use form views', () => {
    const view = `import { Card, CardContent, Stack } from '@mui/material';
import { FormPage, useEditForm } from '@wepublish/form/editor';
import { SingleViewTitle, type ListViewHeader as Header } from '@wepublish/ui/editor';
`;
    const legacy = `import { Card, Grid } from '@mui/material';
import { SingleViewTitle } from '@wepublish/ui/editor';
`;
    const clean = `import { Alert } from '@mui/material';
import {
  formView,
  uniqueConstraint,
} from '@wepublish/form/editor';
import { FormFields } from '@wepublish/ui/editor';
`;

    expect(layoutViolations(view)).toEqual([
      'Card from @mui/material',
      'CardContent from @mui/material',
      'SingleViewTitle from @wepublish/ui/editor',
      'ListViewHeader from @wepublish/ui/editor',
    ]);
    expect(layoutViolations(legacy)).toEqual([]);
    expect(layoutViolations(clean)).toEqual([]);
  });

  it('also checks item layouts and deep imports next to form views', () => {
    const itemLayout = `import Card from '@mui/material/Card';
import { Grid } from '@mui/material/Grid';
import { editorForm } from '@wepublish/form/editor';
`;
    const sectionComponent = `import { Paper } from '@mui/material';
import { demoView } from './demo.view';
`;

    expect(layoutViolations(itemLayout)).toEqual([
      'Card from @mui/material',
      'Grid from @mui/material',
    ]);
    expect(layoutViolations(sectionComponent)).toEqual([
      'Paper from @mui/material',
    ]);
  });

  it('scans the migrated forms and their item layouts', () => {
    expect(checkedFiles().map(file => relative(root, file))).toEqual(
      expect.arrayContaining([
        'apps/editor/src/app/routes/authors/authorDrawer.tsx',
        'apps/editor/src/app/routes/events/eventCreateView.tsx',
        'apps/editor/src/app/routes/events/eventEditView.tsx',
        'apps/editor/src/app/routes/navigations/navigationDrawer.tsx',
        'apps/editor/src/app/routes/paywall/bypassTokenRow.tsx',
        'apps/editor/src/app/routes/paywall/paywallCreateView.tsx',
        'apps/editor/src/app/routes/paywall/paywallEditView.tsx',
        'apps/editor/src/app/routes/tags/tagCreateView.tsx',
        'apps/editor/src/app/routes/tags/tagEditView.tsx',
        'apps/editor/src/app/routes/website-settings/website-analytics.tsx',
        'libs/banner/editor/src/lib/create-banner-form.tsx',
        'libs/banner/editor/src/lib/edit-banner-form.tsx',
        'libs/consent/editor/src/lib/consent-create-view.tsx',
        'libs/consent/editor/src/lib/consent-edit-view.tsx',
        'libs/consent/editor/src/lib/user-consent-create-view.tsx',
        'libs/consent/editor/src/lib/user-consent-edit-view.tsx',
        'libs/settings/editor/src/lib/settings-page.tsx',
      ])
    );
  });

  it('keeps files that use form views free of hand-rolled cards, grids and headers', () => {
    const violations = checkedFiles().flatMap(file =>
      layoutViolations(readFileSync(file, 'utf8')).map(
        violation => `${relative(root, file)}: ${violation}`
      )
    );

    expect(violations).toEqual([]);
  });
});
