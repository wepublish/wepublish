import { formErrorKeys } from '@wepublish/form/core';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

import de from './de.json';
import en from './en.json';
import fr from './fr.json';

type Catalog = { [key: string]: string | Catalog };

const root = resolve(__dirname, '../../../../..');

const sourceDirs = [
  'apps/editor/src',
  'libs/form/core/src',
  ...readdirSync(join(root, 'libs')).map(lib => `libs/${lib}/editor/src`),
];

function keysOf(catalog: Catalog, prefix = ''): string[] {
  return Object.entries(catalog).flatMap(([key, value]) =>
    typeof value === 'string' ?
      [`${prefix}${key}`]
    : keysOf(value, `${prefix}${key}.`)
  );
}

const keys = {
  en: new Set(keysOf(en.translation as Catalog)),
  de: new Set(keysOf(de.translation as Catalog)),
  fr: new Set(keysOf(fr.translation as Catalog)),
};

const usesFormLibrary = /from\s+['"]@wepublish\/form\//;
const usesZodV4 = /from\s+['"]zod\/v4['"]/;
const formSchemaFile = /\.schema\.tsx?$/;
const formMetaKey =
  /(?<![\w-])(?:label|addLabel|description|helperText|placeholder|error|title|unit|successToast)\s*[:=]\s*\{?\s*['"]([\w.-]+)['"]/g;
const formMetaPrefix =
  /(?<![\w-])optionLabelPrefix\s*[:=]\s*\{?\s*['"]([\w.-]+)['"]/g;
const fieldErrorKey =
  /\bsetFieldError\(\s*[^,]+,\s*[^,]+,\s*['"]([\w.-]+)['"]/g;
const formLibraryFile = /^libs\/form\/[\w-]+\/src\//;
const formLibraryKey = /['"](form(?:\.[\w-]+)+)['"]/g;

const capturedBy = (source: string, pattern: RegExp) =>
  [...source.matchAll(pattern)].map(match => match[1]);

function formTextsIn(file: string, source: string) {
  const libraryKeys =
    formLibraryFile.test(file) ? capturedBy(source, formLibraryKey) : [];
  const declaresFormTexts =
    usesFormLibrary.test(source) ||
    (formSchemaFile.test(file) && usesZodV4.test(source));

  if (!declaresFormTexts) {
    return { keys: libraryKeys, prefixes: [] };
  }

  return {
    keys: [
      ...new Set([
        ...capturedBy(source, formMetaKey),
        ...capturedBy(source, fieldErrorKey),
        ...libraryKeys,
      ]),
    ],
    prefixes: capturedBy(source, formMetaPrefix),
  };
}

const isScannedSource = (file: string) =>
  /\.tsx?$/.test(file) &&
  !/\.(spec|stories|test-d)\.tsx?$/.test(file) &&
  !/(^|\/)testing\//.test(file);

function usedKeys() {
  const used = new Set<string>();

  for (const dir of sourceDirs.map(dir => join(root, dir))) {
    if (!existsSync(dir)) {
      continue;
    }

    for (const file of readdirSync(dir, { recursive: true }) as string[]) {
      if (!isScannedSource(file)) {
        continue;
      }

      const path = join(dir, file);
      const source = readFileSync(path, 'utf8');

      for (const match of source.matchAll(/\bt\(\s*['"]([\w.-]+)['"]/g)) {
        used.add(match[1]);
      }

      for (const key of formTextsIn(relative(root, path), source).keys) {
        used.add(key);
      }
    }
  }

  return [...used];
}

function duplicateKeys(json: string): string[] {
  const duplicates: string[] = [];
  const objects: { path: string; keys: Set<string> }[] = [];
  let lastKey = '';
  let index = 0;

  while (index < json.length) {
    const char = json[index];

    if (char === '"') {
      let end = index + 1;

      while (json[end] !== '"') {
        end += json[end] === '\\' ? 2 : 1;
      }

      const value = JSON.parse(json.slice(index, end + 1)) as string;
      const isKey = /^\s*:/.test(json.slice(end + 1));
      const object = objects[objects.length - 1];

      if (isKey && object) {
        if (object.keys.has(value)) {
          duplicates.push(`${object.path}${value}`);
        }

        object.keys.add(value);
        lastKey = value;
      }

      index = end + 1;
      continue;
    }

    if (char === '{') {
      const parent = objects[objects.length - 1];
      objects.push({
        path: parent ? `${parent.path}${lastKey}.` : '',
        keys: new Set(),
      });
    } else if (char === '}') {
      objects.pop();
    }

    index++;
  }

  return duplicates;
}

function usedPrefixes() {
  const prefixes = new Set<string>();

  for (const dir of sourceDirs.map(dir => join(root, dir))) {
    if (!existsSync(dir)) {
      continue;
    }

    for (const file of readdirSync(dir, { recursive: true }) as string[]) {
      if (!isScannedSource(file)) {
        continue;
      }

      const path = join(dir, file);
      const source = readFileSync(path, 'utf8');

      for (const match of source.matchAll(/\bt\(\s*`([\w.-]+\.)\$\{/g)) {
        prefixes.add(match[1]);
      }

      for (const prefix of formTextsIn(relative(root, path), source).prefixes) {
        prefixes.add(prefix);
      }
    }
  }

  return [...prefixes];
}

const hasKey = (lang: keyof typeof keys, key: string) =>
  keys[lang].has(key) ||
  [...keys[lang]].some(existing => existing.startsWith(`${key}_`));

describe('editor translations', () => {
  it.each(['en', 'de', 'fr'] as const)('have no duplicate keys (%s)', lang => {
    expect(
      duplicateKeys(readFileSync(join(__dirname, `${lang}.json`), 'utf8'))
    ).toEqual([]);
  });

  it.each(['en', 'de', 'fr'] as const)(
    'contain every key the editor uses (%s)',
    lang => {
      expect(usedKeys().filter(key => !hasKey(lang, key))).toEqual([]);
    }
  );

  it.each(['en', 'de', 'fr'] as const)(
    'keep the key families the editor builds at runtime (%s)',
    lang => {
      const missing = usedPrefixes().filter(
        prefix => ![...keys[lang]].some(key => key.startsWith(prefix))
      );

      expect(missing).toEqual([]);
    }
  );

  it('build runtime keys only from dotted key families', () => {
    expect(usedPrefixes().filter(prefix => !prefix.endsWith('.'))).toEqual([]);
  });

  it.each(['en', 'de', 'fr'] as const)(
    'contain every key the form library builds (%s)',
    lang => {
      expect(formErrorKeys.filter(key => !hasKey(lang, key))).toEqual([]);
    }
  );

  it.each(['de', 'fr'] as const)('translate every English text (%s)', lang => {
    expect([...keys.en].filter(key => !keys[lang].has(key))).toEqual([]);
  });

  it.each(['de', 'fr'] as const)(
    'have no texts that English lacks (%s)',
    lang => {
      expect([...keys[lang]].filter(key => !keys.en.has(key))).toEqual([]);
    }
  );
});

describe('form text scan', () => {
  const schema = `import { z } from 'zod/v4';

export const demoSchema = z.object({
  title: z.string().min(1, { error: 'demo.titleTooShort' }).meta({
    label: 'demo.title',
    description: 'demo.titleInfo',
    helperText: 'demo.titleHelp',
    placeholder: 'demo.titlePlaceholder',
  }),
  role: z.enum(['reader', 'editor']).meta({ optionLabelPrefix: 'demo.roles.' }),
});
`;

  const view = `import { editorForm } from '@wepublish/form/editor';

export const DemoFields = () => (
  <Field
    name="title"
    helperText="demo.titleOverride"
    slotProps={{ htmlInput: { 'aria-label': 'demo.notAKey' } }}
    fields={{ role: { label: 'demo.roleOverride' } }}
    props={{ variant: 'table', addLabel: 'demo.addRow' }}
  />
);
`;

  const serverError = `import { setFieldError } from '@wepublish/form/editor';

export const onError = (handle: DemoForm) =>
  setFieldError(
    handle.form,
    'slug',
    'demo.slugTaken',
    { slug: 'demo.notAKey' }
  );
`;

  const libraryHelper = `import type { z } from 'zod/v4';

export const errorPrefix = 'form.errors.';

export const colorError = (issue: z.core.$ZodRawIssue) =>
  issue.input === '' ? undefined : 'form.color.invalid';
`;

  const puckConfig = `import { z } from 'zod/v4';

export const spaceAi = z.object({ size: z.enum(['s', 'm']) });
export const spaceConfig = { fields: { size: { label: 'Size' } } };
`;

  it('reads the keys and option families of form schemas', () => {
    expect(formTextsIn('demo.schema.ts', schema)).toEqual({
      keys: [
        'demo.titleTooShort',
        'demo.title',
        'demo.titleInfo',
        'demo.titleHelp',
        'demo.titlePlaceholder',
      ],
      prefixes: ['demo.roles.'],
    });
  });

  it('reads the overrides of views that use the form library', () => {
    expect(formTextsIn('demo-form.tsx', view)).toEqual({
      keys: ['demo.titleOverride', 'demo.roleOverride', 'demo.addRow'],
      prefixes: [],
    });
  });

  it('reads the keys that views set as field errors', () => {
    expect(formTextsIn('demo-create-view.tsx', serverError)).toEqual({
      keys: ['demo.slugTaken'],
      prefixes: [],
    });
  });

  it('reads the keys the form library returns as plain strings', () => {
    expect(
      formTextsIn(
        'libs/form/editor/src/lib/fields/color-format.ts',
        libraryHelper
      )
    ).toEqual({ keys: ['form.color.invalid'], prefixes: [] });
    expect(
      formTextsIn('libs/demo/editor/src/lib/color-format.ts', libraryHelper)
    ).toEqual({ keys: [], prefixes: [] });
  });

  it('reads the keys of form views', () => {
    const formViewSource = `import { formView, useCreateForm } from '@wepublish/form/editor';

export const demoView = formView(demoSchema, {
  sections: [{ title: 'demo.section', description: 'demo.sectionInfo' }],
  fields: { days: { props: { unit: 'form.units.days' } } },
});

export const useDemo = () =>
  useCreateForm(demoView, {
    title: 'demo.titleCreate',
    successToast: 'demo.saved',
    save: async () => undefined,
  });
`;

    expect(formTextsIn('demo.view.ts', formViewSource).keys).toEqual(
      expect.arrayContaining([
        'demo.section',
        'demo.sectionInfo',
        'form.units.days',
        'demo.titleCreate',
        'demo.saved',
      ])
    );
  });

  it('skips spec fixtures in testing directories and type tests', () => {
    expect(isScannedSource('lib/demo-view.tsx')).toBe(true);
    expect(isScannedSource('lib/demo-view.spec.tsx')).toBe(false);
    expect(isScannedSource('lib/demo-view.test-d.ts')).toBe(false);
    expect(isScannedSource('testing/demo-queries.tsx')).toBe(false);
    expect(isScannedSource('lib/testing/demo-queries.ts')).toBe(false);
  });

  it('ignores zod/v4 files that are not form schemas', () => {
    expect(formTextsIn('space.config.ts', puckConfig)).toEqual({
      keys: [],
      prefixes: [],
    });
  });

  it('finds the keys of the migrated forms', () => {
    expect(usedKeys()).toEqual(
      expect.arrayContaining([
        'consents.slugInfo',
        'userConsents.alreadyExists',
        'banner.form.mustNotBeNegative',
        'banner.form.timing',
        'event.form.endsBeforeStart',
        'event.form.sections.media',
        'navigation.panels.keyTaken',
        'navigation.panels.addLink',
        'paywall.form.nameTaken',
        'paywall.form.sections.access',
        'tags.form.uniqueConstraint',
        'tags.form.sections.display',
        'event.create.title',
        'settingList.publicApi',
        'websiteSettings.analytics.plausible.paPlaceholder',
        'websiteSettings.analytics.google.title',
        'form.errors.required',
        'banner.actions.add',
        'form.color.invalid',
      ])
    );
    expect(usedPrefixes()).toEqual(
      expect.arrayContaining([
        'banner.actions.role.',
        'banner.form.loginStatus.',
        'event.form.statuses.',
        'navigation.panels.linkTypes.',
      ])
    );
  });
});
