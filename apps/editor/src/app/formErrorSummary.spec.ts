import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';

const root = resolve(__dirname, '../../../..');

const sourceDirs = [
  'apps/editor/src',
  ...readdirSync(join(root, 'libs'))
    .filter(lib => lib !== 'form')
    .map(lib => `libs/${lib}/editor/src`),
];

const rendersForm = /<(?:editorForm\.Form|FormRoot|FormPage|FormDrawerPanel)\b/;
const rendersSummary =
  /<(?:FormErrorSummary|FormBody|FormPage|FormDrawerPanel)\b/;
const relativeImport = /from\s+['"](\.{1,2}\/[^'"]+)['"]/g;
const extensions = ['.tsx', '.ts', '/index.tsx', '/index.ts'];

type Read = (file: string) => string | undefined;

function importsOf(file: string, source: string, read: Read): string[] {
  return [...source.matchAll(relativeImport)].flatMap(([, path]) => {
    const base = join(dirname(file), path);
    const found = extensions
      .map(extension => `${base}${extension}`)
      .find(candidate => read(candidate) !== undefined);

    return found === undefined ? [] : [found];
  });
}

function reachesSummary(file: string, read: Read): boolean {
  const seen = new Set<string>();
  const queue = [file];

  while (queue.length > 0) {
    const next = queue.shift() as string;
    const source = read(next);

    if (seen.has(next) || source === undefined) {
      continue;
    }

    seen.add(next);

    if (rendersSummary.test(source)) {
      return true;
    }

    queue.push(...importsOf(next, source, read));
  }

  return false;
}

function checkForms(files: string[], read: Read) {
  const forms = files.filter(file => rendersForm.test(read(file) ?? ''));

  return {
    forms,
    withoutSummary: forms.filter(file => !reachesSummary(file, read)),
  };
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

const readSource: Read = file =>
  existsSync(file) ? readFileSync(file, 'utf8') : undefined;

describe('FormErrorSummary', () => {
  it('reports a form whose layout renders no summary, directly or through a local import', () => {
    const sources: Record<string, string> = {
      '/lib/a-view.tsx': `import { AForm } from './a-form';\n<editorForm.Form form={a}><AForm /></editorForm.Form>`,
      '/lib/a-form.tsx': `export const AForm = () => <><FormErrorSummary /><AutoFields /></>;`,
      '/lib/b-view.tsx': `import {\n  BForm,\n} from './b-form';\n<editorForm.Form form={b}><BForm /></editorForm.Form>`,
      '/lib/b-form.tsx': `export const BForm = () => <AutoFields />;`,
      '/lib/c-view.tsx': `<editorForm.Form form={c}><FormErrorSummary /></editorForm.Form>`,
      '/lib/d-list.tsx': `export const DList = () => <table />;`,
      '/lib/e-view.tsx': `<FormRoot controller={c}><Header /></FormRoot>`,
      '/lib/f-view.tsx': `<FormPage controller={c} />`,
      '/lib/g-view.tsx': `<FormDrawer><FormDrawerPanel controller={c} /></FormDrawer>`,
      '/lib/h-view.tsx': `<FormRoot controller={c}><FormBody /></FormRoot>`,
    };

    expect(checkForms(Object.keys(sources), file => sources[file])).toEqual({
      forms: [
        '/lib/a-view.tsx',
        '/lib/b-view.tsx',
        '/lib/c-view.tsx',
        '/lib/e-view.tsx',
        '/lib/f-view.tsx',
        '/lib/g-view.tsx',
        '/lib/h-view.tsx',
      ],
      withoutSummary: ['/lib/b-view.tsx', '/lib/e-view.tsx'],
    });
  });

  it('is rendered by every editor form, since errors off screen have nowhere else to go', () => {
    const { forms, withoutSummary } = checkForms(sourceFiles(), readSource);
    const relativeTo = (files: string[]) =>
      files.map(file => relative(root, file)).sort();

    expect(relativeTo(forms)).toEqual(
      expect.arrayContaining([
        'apps/editor/src/app/routes/authors/authorDrawer.tsx',
        'apps/editor/src/app/routes/events/eventCreateView.tsx',
        'apps/editor/src/app/routes/events/eventEditView.tsx',
        'apps/editor/src/app/routes/navigations/navigationDrawer.tsx',
        'apps/editor/src/app/routes/paywall/paywallCreateView.tsx',
        'apps/editor/src/app/routes/paywall/paywallEditView.tsx',
        'apps/editor/src/app/routes/tags/tagCreateView.tsx',
        'apps/editor/src/app/routes/tags/tagEditView.tsx',
        'apps/editor/src/app/routes/users/userCreateView.tsx',
        'apps/editor/src/app/routes/users/userEditView.tsx',
        'apps/editor/src/app/routes/website-settings/website-ads.tsx',
        'apps/editor/src/app/routes/website-settings/website-analytics.tsx',
        'apps/editor/src/app/routes/website-settings/website-fonts.tsx',
        'apps/editor/src/app/routes/website-settings/website-theme.tsx',
        'libs/banner/editor/src/lib/create-banner-form.tsx',
        'libs/banner/editor/src/lib/edit-banner-form.tsx',
        'libs/consent/editor/src/lib/consent-create-view.tsx',
        'libs/consent/editor/src/lib/consent-edit-view.tsx',
        'libs/consent/editor/src/lib/user-consent-create-view.tsx',
        'libs/consent/editor/src/lib/user-consent-edit-view.tsx',
        'libs/settings/editor/src/lib/settings-page.tsx',
      ])
    );
    expect(relativeTo(withoutSummary)).toEqual([]);
  });
});
