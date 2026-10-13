import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

import de from './de.json';
import en from './en.json';
import fr from './fr.json';

type Catalog = { [key: string]: string | Catalog };

const root = resolve(__dirname, '../../../../..');

const sourceDirs = [
  'apps/editor/src',
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

function usedKeys() {
  const used = new Set<string>();

  for (const dir of sourceDirs.map(dir => join(root, dir))) {
    if (!existsSync(dir)) {
      continue;
    }

    for (const file of readdirSync(dir, { recursive: true }) as string[]) {
      if (!/\.tsx?$/.test(file) || /\.(spec|stories)\.tsx?$/.test(file)) {
        continue;
      }

      const source = readFileSync(join(dir, file), 'utf8');

      for (const match of source.matchAll(/\bt\(\s*['"]([\w.-]+)['"]/g)) {
        used.add(match[1]);
      }
    }
  }

  return [...used];
}

/**
 * Keys that appear twice in the same object. JSON.parse silently keeps the
 * last one, so a duplicate can hide a translation that was edited in the
 * other copy.
 */
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
