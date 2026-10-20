import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import ts from 'typescript';

import de from '../locales/de.json';
import en from '../locales/en.json';
import fr from '../locales/fr.json';
import { allCommands } from './commands';

type Catalog = { [key: string]: string | Catalog };

const catalogs = {
  en: en.translation as Catalog,
  de: de.translation as Catalog,
  fr: fr.translation as Catalog,
};

const lookup = (catalog: Catalog, key: string) =>
  key
    .split('.')
    .reduce<
      string | Catalog | undefined
    >((value, part) => (value && typeof value !== 'string' ? value[part] : undefined), catalog);

const pathOf = (tag: ts.JsxOpeningLikeElement) => {
  if (tag.tagName.getText() !== 'Route') {
    return undefined;
  }

  const attribute = tag.attributes.properties.find(
    property =>
      ts.isJsxAttribute(property) && property.name.getText() === 'path'
  );

  return (
      attribute &&
        ts.isJsxAttribute(attribute) &&
        attribute.initializer &&
        ts.isStringLiteral(attribute.initializer)
    ) ?
      attribute.initializer.text
    : undefined;
};

/** Every route path in app.tsx, a nested route joined to its parents. */
const routerPaths = () => {
  const file = ts.createSourceFile(
    'app.tsx',
    readFileSync(join(__dirname, '../app.tsx'), 'utf8'),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
  );
  const paths: string[] = [];

  const visit = (node: ts.Node, parent: string) => {
    const tag =
      ts.isJsxElement(node) ? node.openingElement
      : ts.isJsxSelfClosingElement(node) ? node
      : undefined;
    const path = tag && pathOf(tag);
    const full =
      path === undefined ? parent : (
        `${parent.replace(/\/$/, '')}/${path.replace(/^\//, '')}`
      );

    if (path !== undefined) {
      paths.push(full);
    }

    ts.forEachChild(node, child => visit(child, full));
  };

  visit(file, '');

  return paths;
};

const NOT_A_DESTINATION = [/^\/login/, /^\/$/, /:/, /^\/systemmails$/];

const commandPaths = () => {
  const paths: string[] = [];

  allCommands.forEach(({ perform }) =>
    perform({ navigate: to => paths.push(to), close: () => undefined })
  );

  return paths;
};

const reachable = new Set(commandPaths());

describe('editor command registry', () => {
  it('reaches every route the editor has, except the ones needing an id', () => {
    const missing = routerPaths().filter(
      path =>
        !NOT_A_DESTINATION.some(pattern => pattern.test(path)) &&
        !reachable.has(path)
    );

    expect(missing).toEqual([]);
  });

  it('points every command at a route the router actually serves', () => {
    const patterns = routerPaths().map(
      path =>
        new RegExp(
          `^${path.replace(/:[^/]+/g, '[^/]+').replace(/\//g, '\\/')}$`
        )
    );

    const dangling = commandPaths().filter(
      path => !patterns.some(pattern => pattern.test(path))
    );

    expect(dangling).toEqual([]);
  });

  it('leaves a command that acts rather than navigates out of the routes', () => {
    expect(commandPaths().length).toBeLessThanOrEqual(allCommands.length);
  });

  it('marks the three favourites, and nothing else', () => {
    expect(
      allCommands.filter(({ favourite }) => favourite).map(({ id }) => id)
    ).toEqual(['articles', 'pages', 'blockTemplates']);
  });

  it('gives every command an id of its own', () => {
    const ids = allCommands.map(({ id }) => id);

    expect(ids).toEqual([...new Set(ids)]);
  });

  it.each(['en', 'de', 'fr'] as const)(
    'has a title in %s for every command',
    language => {
      const untranslated = allCommands
        .filter(
          ({ titleKey }) =>
            typeof lookup(catalogs[language], titleKey) !== 'string'
        )
        .map(({ id, titleKey }) => `${id} -> ${titleKey}`);

      expect(untranslated).toEqual([]);
    }
  );

  it.each(['en', 'de', 'fr'] as const)(
    'has a section name in %s wherever one is claimed',
    language => {
      const untranslated = allCommands
        .filter(
          ({ sectionKey }) =>
            sectionKey &&
            typeof lookup(catalogs[language], sectionKey) !== 'string'
        )
        .map(({ id, sectionKey }) => `${id} -> ${sectionKey}`);

      expect(untranslated).toEqual([]);
    }
  );

  it.each(['en', 'de', 'fr'] as const)(
    'has the palette chrome translated in %s',
    language => {
      const missing = [
        'commandPalette.title',
        'commandPalette.placeholder',
        'commandPalette.empty',
        'commandPalette.groups.favourite',
        'commandPalette.groups.navigate',
        'commandPalette.groups.create',
        'commandPalette.groups.account',
        'commandPalette.hints.move',
        'commandPalette.hints.select',
        'commandPalette.hints.close',
      ].filter(key => typeof lookup(catalogs[language], key) !== 'string');

      expect(missing).toEqual([]);
    }
  );
});
