import { ComponentConfig } from '@puckeditor/core';
import i18next from 'i18next';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createElement, Fragment } from 'react';
import { MdTitle } from 'react-icons/md';

import { withCSS } from '../blocks/with-css';
import { withDataSource, withImageDataSource } from '../blocks/with-datasource';
import { withGroup, withGroupAll } from '../blocks/with-group';
import { withLock, withLockAll } from '../blocks/with-lock';
import { withVisibility } from '../blocks/with-visibility';
import { config } from '../config';
import { withFieldTabs, withFieldTabsAll } from '../field-tabs/field-tabs';
import { blockCatalog } from './block-library.catalog';

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

const components = Object.entries(config.components);

describe('block metadata', () => {
  it('gives every component an icon, a category, a name and an order', () => {
    expect(
      components.flatMap(([name, component]) =>
        (['icon', 'category', 'nameKey', 'order'] as const)
          .filter(key => component[key] === undefined)
          .map(key => `${name}.${key}`)
      )
    ).toEqual([]);
  });

  it.each(locales)('names every component in $locale', ({ messages }) => {
    expect(
      components
        .map(([, component]) => component.nameKey ?? '')
        .filter(key => typeof lookup(messages, key) !== 'string')
    ).toEqual([]);
  });

  it('gives readable names instead of component keys', () => {
    expect(i18next.t(config.components.RichText.nameKey ?? '')).toBe('Text');
    expect(i18next.t(config.components.IFrame.nameKey ?? '')).toBe(
      'Web page (iframe)'
    );
    expect(i18next.t(config.components.TeaserPreTitle.nameKey ?? '')).toBe(
      'Teaser pre-title'
    );
  });

  it('only puts a block into the group of its own category', () => {
    const groupOf = Object.fromEntries(
      blockCatalog.map(category => [
        category.id,
        'group' in category ? category.group : undefined,
      ])
    );

    expect(
      components
        .filter(
          ([, { category, group }]) =>
            group && (!category || groupOf[category] !== group)
        )
        .map(([name]) => name)
    ).toEqual([]);
  });

  it('never gives two blocks of one section the same order', () => {
    const sections = components.map(
      ([, { category, group, order }]) => `${category}/${group}/${order}`
    );

    expect(
      sections.filter((key, index) => sections.indexOf(key) !== index)
    ).toEqual([]);
  });

  it('derives the Puck categories in the order of the Blocks panel', () => {
    expect(config.categories).toEqual({
      text: {
        components: [
          'Title',
          'RichText',
          'Quote',
          'Listicle',
          'Button',
          'Break',
        ],
      },
      media: {
        components: [
          'Image',
          'Lightbox',
          'YouTube',
          'Vimeo',
          'FacebookVideo',
          'TikTok',
          'Streamable',
          'SoundCloud',
        ],
      },
      layout: {
        components: [
          'Container',
          'Grid',
          'DynamicGrid',
          'Row',
          'Slider',
          'Collapsible',
          'Space',
        ],
      },
      teaser: {
        components: [
          'Teaser',
          'TeaserImage',
          'TeaserPreTitle',
          'TeaserTitle',
          'TeaserLead',
          'TeaserAuthors',
          'TeaserDate',
          'TeaserTags',
        ],
      },
      engagement: {
        components: [
          'Subscribe',
          'MailchimpForm',
          'Poll',
          'Comment',
          'Event',
          'Crowdfunding',
        ],
      },
      form: {
        components: [
          'Form',
          'FormInput',
          'FormTextarea',
          'FormCheckbox',
          'FormSelect',
          'FormRadioGroup',
          'FormHidden',
          'FormSubmit',
        ],
      },
      embed: {
        components: [
          'Facebook',
          'Instagram',
          'Twitter',
          'Polis',
          'IFrame',
          'Html',
          'BildwurfAd',
        ],
      },
      other: { visible: false },
    });
  });
});

describe('block metadata through the wrappers', () => {
  const meta = {
    icon: MdTitle,
    category: 'teaser',
    group: 'teaserParts',
    nameKey: 'puck.blocks.names.TeaserTitle',
    order: 3,
  } as const;

  const block: ComponentConfig<{ className?: string }> = {
    ...meta,
    render: () => createElement(Fragment),
  };

  it.each([
    ['withCSS', () => withCSS(block)],
    ['withVisibility', () => withVisibility(block)],
    ['withDataSource', () => withDataSource(block)],
    ['withImageDataSource', () => withImageDataSource(block)],
    ['withLock', () => withLock(block)],
    ['withFieldTabs', () => withFieldTabs(block)],
    ['withLockAll', () => withLockAll({ Title: block }).Title],
    ['withGroup', () => withGroup(block)],
    ['withGroupAll', () => withGroupAll({ Title: block }).Title],
    ['withFieldTabsAll', () => withFieldTabsAll({ Title: block }).Title],
  ])('%s keeps the metadata', (_, wrap) => {
    expect(wrap()).toMatchObject(meta);
  });
});
