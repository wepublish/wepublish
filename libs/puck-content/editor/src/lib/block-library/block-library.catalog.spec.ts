import i18next from 'i18next';

import { config } from '../config';
import { blockCatalog, catalogBlockNames } from './block-library.catalog';
import {
  blockCategoryKey,
  blockGroupHintKey,
  blockGroupKey,
  blockLabelKey,
} from './block-library.helpers';
import { blockIcons } from './block-library.icons';

describe('blockCatalog', () => {
  const componentNames = Object.keys(config.components);

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

  it('lists every component exactly once', () => {
    const names = catalogBlockNames(blockCatalog);

    expect([...names].sort()).toEqual([...componentNames].sort());
    expect(new Set(names).size).toBe(names.length);
  });

  it('keeps the teaser parts in their own group after the teaser', () => {
    const teaser = blockCatalog.find(({ id }) => id === 'teaser');

    expect(teaser?.blocks).toEqual(['Teaser']);
    expect(teaser?.group?.id).toBe('teaserParts');
    expect(teaser?.group?.blocks).toEqual(
      expect.arrayContaining(['TeaserTitle', 'TeaserImage', 'TeaserLead'])
    );
  });

  it('keeps the form fields in their own group after the form', () => {
    const form = blockCatalog.find(({ id }) => id === 'form');

    expect(form?.blocks).toEqual(['Form']);
    expect(form?.group?.id).toBe('formFields');
    expect(form?.group?.blocks).toEqual(
      expect.arrayContaining(['FormInput', 'FormSubmit'])
    );
  });

  it('has an icon for every component', () => {
    expect(componentNames.filter(name => !blockIcons[name])).toEqual([]);
  });

  it('has an English name for every component', () => {
    expect(
      componentNames.filter(name => !i18next.exists(blockLabelKey(name)))
    ).toEqual([]);
  });

  it('names every category and group in English', () => {
    expect(
      blockCatalog
        .flatMap(({ id, group }) => [
          blockCategoryKey(id),
          ...(group ?
            [blockGroupKey(group.id), blockGroupHintKey(group.id)]
          : []),
        ])
        .filter(key => !i18next.exists(key))
    ).toEqual([]);
  });

  it('gives readable names instead of component keys', () => {
    expect(i18next.t(blockLabelKey('RichText'))).toBe('Text');
    expect(i18next.t(blockLabelKey('IFrame'))).toBe('Web page (iframe)');
    expect(i18next.t(blockLabelKey('TeaserPreTitle'))).toBe('Teaser pre-title');
  });
});
