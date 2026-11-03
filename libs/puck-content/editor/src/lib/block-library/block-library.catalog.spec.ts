import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { blockCatalog } from './block-library.catalog';
import {
  blockCategoryKey,
  blockGroupHintKey,
  blockGroupKey,
} from './block-library.helpers';

const locales = ['en', 'de', 'fr'].map(locale => ({
  locale,
  messages: JSON.parse(
    readFileSync(
      join(
        __dirname,
        `../../../../../../apps/editor/src/app/locales/${locale}.json`
      ),
      'utf8'
    )
  ).translation,
}));

const lookup = (messages: unknown, key: string) =>
  key
    .split('.')
    .reduce<unknown>(
      (node, part) =>
        node && typeof node === 'object' ?
          (node as Record<string, unknown>)[part]
        : undefined,
      messages
    );

describe('blockCatalog', () => {
  it('orders the categories from everyday writing to rarely used embeds', () => {
    expect(blockCatalog.map(({ id }) => id)).toEqual([
      'text',
      'media',
      'layout',
      'teaser',
      'engagement',
      'form',
      'embed',
    ]);
  });

  it('gives only the teaser and the form a group of parts', () => {
    expect(
      blockCatalog.flatMap(category =>
        'group' in category ? [[category.id, category.group]] : []
      )
    ).toEqual([
      ['teaser', 'teaserParts'],
      ['form', 'formFields'],
    ]);
  });

  it.each(locales)(
    'names every category and group in $locale',
    ({ messages }) => {
      expect(
        blockCatalog
          .flatMap(category => [
            blockCategoryKey(category.id),
            ...('group' in category ?
              [blockGroupKey(category.group), blockGroupHintKey(category.group)]
            : []),
          ])
          .filter(key => typeof lookup(messages, key) !== 'string')
      ).toEqual([]);
    }
  );
});
