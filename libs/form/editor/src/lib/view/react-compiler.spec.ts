import { readdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';

import { DiscardChangesDialog } from './discard-changes-dialog';
import { FormDrawer, FormDrawerPanel } from './form-drawer';
import { FormPage, FormPageHeader } from './form-page';
import { FormBody, FormRoot } from './form-root';
import { FormSaveActions } from './form-save-actions';
import { FormRow, FormSection, FormToggleGroup } from './form-section';
import { ConfiguredSection, DynamicSection } from './form-sections';
import { SaveConfirmationDialog } from './save-confirmation-dialog';
import {
  useCreateForm,
  useEditForm,
  useSingletonForm,
} from './use-form-controller';
import { useQueryLoader } from './use-query-loader';
import { useRouteDrawer } from './use-route-drawer';

const isCompiled = (code: string) => /\$\[\d+\]/.test(code);

type CompilerEvent = {
  readonly kind: string;
  readonly fnLoc?: { readonly start?: { readonly line?: number } } | null;
};

type Babel = {
  readonly transformSync: (
    code: string,
    options: Readonly<Record<string, unknown>>
  ) => unknown;
};

const load = createRequire(__filename);
const babel = load('@babel/core') as Babel;
const libDir = resolve(__dirname, '..');
const bailouts: ReadonlySet<string> = new Set([
  'CompileError',
  'CompileSkip',
  'PipelineError',
]);

function compilerBailouts(filename: string, code: string): string[] {
  const found: string[] = [];

  babel.transformSync(code, {
    filename,
    babelrc: false,
    configFile: false,
    presets: [
      [
        load.resolve('@babel/preset-typescript'),
        { isTSX: true, allExtensions: true },
      ],
    ],
    plugins: [
      [
        load.resolve('babel-plugin-react-compiler'),
        {
          target: '19',
          logger: {
            logEvent: (_file: string, event: CompilerEvent) => {
              if (bailouts.has(event.kind)) {
                found.push(`${filename}:${event.fnLoc?.start?.line ?? '?'}`);
              }
            },
          },
        },
      ],
    ],
  });

  return found;
}

const librarySources = () =>
  (readdirSync(libDir, { recursive: true }) as string[]).filter(
    file => /\.tsx?$/.test(file) && !/\.(spec|test-d)\.tsx?$/.test(file)
  );

const bailingOut = `export function Demo({ user }) {
  let name = '';

  try {
    name = user?.name ?? '';
  } catch {
    name = '';
  }

  return <p>{name}</p>;
}
`;

describe('the form view kit under test', () => {
  it.each([
    ['FormPage', FormPage],
    ['FormDrawer', FormDrawer],
    ['FormDrawerPanel', FormDrawerPanel],
    ['FormRoot', FormRoot],
    ['FormBody', FormBody],
    ['FormPageHeader', FormPageHeader],
    ['FormSaveActions', FormSaveActions],
    ['FormSection', FormSection],
    ['FormRow', FormRow],
    ['FormToggleGroup', FormToggleGroup],
    ['ConfiguredSection', ConfiguredSection],
    ['DynamicSection', DynamicSection],
    ['SaveConfirmationDialog', SaveConfirmationDialog],
    ['DiscardChangesDialog', DiscardChangesDialog],
    ['useCreateForm', useCreateForm],
    ['useEditForm', useEditForm],
    ['useSingletonForm', useSingletonForm],
    ['useQueryLoader', useQueryLoader],
    ['useRouteDrawer', useRouteDrawer],
  ])('runs %s through the React Compiler', (_name, compiled) => {
    expect(isCompiled(compiled.toString())).toBe(true);
  });
});

describe('every component and hook of the form library', () => {
  it('reports a component the React Compiler bails out on', () => {
    expect(compilerBailouts('demo.tsx', bailingOut)).toEqual(['demo.tsx:1']);
  });

  it('runs through the React Compiler, exported or not', () => {
    const sources = librarySources();

    expect(sources).toEqual(
      expect.arrayContaining([
        join('view', 'use-form-controller.ts'),
        join('view', 'form-save-actions.tsx'),
        join('fields', 'article-field.tsx'),
      ])
    );
    expect(
      sources.flatMap(file =>
        compilerBailouts(file, readFileSync(join(libDir, file), 'utf8'))
      )
    ).toEqual([]);
  }, 60_000);
});
