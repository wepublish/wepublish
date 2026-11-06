import { NavigationLinkType } from '@wepublish/editor/api';
import { fieldOptions, schemaAt } from '@wepublish/form/core';

import de from '../../locales/de.json';
import en from '../../locales/en.json';
import fr from '../../locales/fr.json';
import { navigationSchema } from './navigation.schema';

type Catalog = { [key: string]: string | Catalog };

const textAt = (catalog: Catalog, key: string) =>
  key
    .split('.')
    .reduce<string | Catalog | undefined>(
      (node, part) => (typeof node === 'object' ? node[part] : undefined),
      catalog
    );

const linkTypeOptions = () => {
  const schema = schemaAt(navigationSchema, 'links.*.type');

  return schema === undefined ? [] : fieldOptions(schema);
};

describe('navigation schema', () => {
  it('labels the link types from their own key family', () => {
    expect(
      Object.fromEntries(
        linkTypeOptions().map(({ value, labelKey }) => [value, labelKey])
      )
    ).toEqual(
      Object.fromEntries(
        Object.values(NavigationLinkType).map(value => [
          value,
          `navigation.panels.linkTypes.${value}`,
        ])
      )
    );
  });

  it.each([
    ['en', en.translation],
    ['de', de.translation],
    ['fr', fr.translation],
  ] as const)('has a label for every link type (%s)', (_, catalog) => {
    const missing = linkTypeOptions()
      .map(({ labelKey }) => labelKey ?? '')
      .filter(key => typeof textAt(catalog as Catalog, key) !== 'string');

    expect(missing).toEqual([]);
  });
});
