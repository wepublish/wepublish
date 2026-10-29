import { allowedCommands } from '@wepublish/ui/editor';
import type { i18n as I18n, TFunction } from 'i18next';

import { catalogs, lookup, routerPaths } from '../testing/routerPaths';
import { allCommands, editorCommands } from './commands';

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

  it('hides the newsletter while its feature is off, as the sidebar does', () => {
    const t = ((key: string) => key) as TFunction;
    const i18n = { getFixedT: () => t } as unknown as I18n;
    const ids = (features: string[]) =>
      allowedCommands(
        editorCommands(t, i18n),
        undefined,
        new Set(features)
      ).map(({ id }) => id);

    expect(ids([])).not.toContain('newsletter');
    expect(ids(['newsletter-editor'])).toContain('newsletter');
  });

  it('leaves a command that acts rather than navigates out of the routes', () => {
    expect(commandPaths().length).toBeLessThanOrEqual(allCommands.length);
  });

  it.each([
    ['letterLayouts', 'paper-letters'],
    ['createLetterLayout', 'paper-letters'],
  ])('offers %s only where %s is switched on', (id, feature) => {
    expect(allCommands.find(command => command.id === id)?.feature).toBe(
      feature
    );
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
